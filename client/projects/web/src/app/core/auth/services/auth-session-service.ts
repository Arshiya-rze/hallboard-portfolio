/**
 * Authentication features, such as login and registration, handle their
 * flow-specific API operations.
 *
 * This service manages application-wide authentication session concerns like:
 * - Current authenticated user
 * - Authentication status
 * - Session initialization
 * - Logout
 * - Token/session expiration
 * - Session refresh coordination
 */

import { computed, inject, Service, signal } from '@angular/core';
import { ApiClient } from '../../http/api/api-client';
import { finalize, Observable, tap } from 'rxjs';
import { LoggedInUser } from '../models/logged-in-user-model';
import { BrowserStorage } from '../../platform/browser-storage';
import { Router } from '@angular/router';

@Service()
export class AuthSessionService {
    private readonly _loggedInUserSig = signal<LoggedInUser | undefined>(undefined);
    loggedInUserSig = this._loggedInUserSig.asReadonly();
    isAuthenticatedSig = computed(() => this.loggedInUserSig() !== undefined);

    private readonly _apiClient = inject(ApiClient);
    private readonly _browserStorage = inject(BrowserStorage);
    private readonly _router = inject(Router);
    readonly apiRoute = 'auth';

    reloadLoggedInUser(): Observable<LoggedInUser | null> {
        return this._apiClient
            .postNoBody<LoggedInUser | null>(this.apiRoute)
            .pipe(
                tap(user => {
                    if (user) {
                        this.setCurrentUser(user);
                    } else {
                        this.clearAuthState();
                    }
                }),
            );
    }

    refreshSession(): Observable<string> {
        return this._apiClient.getText(`${this.apiRoute}/refresh-tokens`);
    }

    getCsrfToken$(): Observable<{ requestToken: string }> {
        return this._apiClient.get<{ requestToken: string }>(`${this.apiRoute}/get-csrf-token`);
    }

    // Do NOT FORGET to subscribe!
    logout(): Observable<string> {
        return this._apiClient.postTextNoBody(`${this.apiRoute}/logout`)
            .pipe( // Always clear the local session, whether the backend request succeeds or fails.
                finalize(() => {
                    this.clearAuthState();

                    this._router.navigate(['auth/login'], {
                        replaceUrl: true
                    });
                })
            );
    }

    setCurrentUser(loggedInUser: LoggedInUser): void {
        this._loggedInUserSig.set(loggedInUser);
    }

    clearAuthState(): void {
        this._loggedInUserSig.set(undefined);
        this._browserStorage.sessionClear();
        this._browserStorage.localClear();
    }
}
