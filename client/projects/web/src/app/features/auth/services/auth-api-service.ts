import { inject, Service } from '@angular/core';
import { Observable, map } from 'rxjs';
import { LoggedInUser } from '../../../core/auth/models/logged-in-user-model';
import { LoginRequest } from '../login/models/login-request';
import { AuthSessionService } from '../../../core/auth/services/auth-session-service';
import { RegisterUserRequest } from '../register/models/register-user-request';
import { VerifyAccountRequest } from '../register/models/verify-account-request';
import { PasswordResetRequest } from '../reset-password/models/password-reset-request';
import { VerifyPasswordResetRequest as PasswordResetVerifyRequest } from '../reset-password/models/password-reset-verify';
import { ApiClient } from '../../../core/http/api/api-client';

@Service()
export class AuthApiService {
    private readonly _authSession = inject(AuthSessionService);
    private readonly _apiClient = inject(ApiClient);
    private readonly _apiRoute = 'auth';

    registerUser(request: RegisterUserRequest): Observable<string> {
        return this._apiClient.postText<RegisterUserRequest>(`${this._apiRoute}/register`, request);
    }

    verifyAccount(request: VerifyAccountRequest): Observable<LoggedInUser | null> {
        return this._apiClient.post<VerifyAccountRequest, LoggedInUser>(`${this._apiRoute}/verify-account`, request).pipe(
            map((res: LoggedInUser) => {
                if (res) {
                    this._authSession.setCurrentUser(res);
                    return res;
                }

                return null;
            }),
        );
    }

    login(request: LoginRequest): Observable<LoggedInUser | null> {
        return this._apiClient.post<LoginRequest, LoggedInUser>(`${this._apiRoute}/login`, request).pipe(
            map((res: LoggedInUser) => {
                if (res) {
                    this._authSession.setCurrentUser(res);
                    return res;
                }

                return null;
            }),
        );
    }

    sendPasswordResetCode(request: PasswordResetRequest): Observable<string> {
        return this._apiClient.postText<PasswordResetRequest>(`${this._apiRoute}/password-reset/send-code`, request);
    }

    verifyPasswordReset(request: PasswordResetVerifyRequest): Observable<LoggedInUser> {
        return this._apiClient.post<PasswordResetVerifyRequest, LoggedInUser>(`${this._apiRoute}/password-reset/verify-code`, request);
    }
}
