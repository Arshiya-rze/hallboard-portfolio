import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { map, catchError, of } from 'rxjs';
import { AuthSessionService } from '../services/auth-session-service';

export const guestGuard: CanActivateFn = (route, state) => {
  const authSession = inject(AuthSessionService);

  // Cancel navigation and remain on the current page.
  if (authSession.isAuthenticatedSig()) {
    return false;
  }

  return authSession.reloadLoggedInUser().pipe(
    // Allow guest routes only when the server confirms no authenticated user exists.
    map(user => user === null),

    // No valid session exists, so allow access to login/register.
    catchError(() => {
      authSession.clearAuthState();
      return of(true);
    }),
  );
};
