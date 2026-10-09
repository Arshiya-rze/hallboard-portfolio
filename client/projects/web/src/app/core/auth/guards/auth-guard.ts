import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, catchError, of } from 'rxjs';
import { AuthSessionService } from '../services/auth-session-service';

export const authGuard: CanActivateFn = (route, state) => {
  const authSession = inject(AuthSessionService);
  const router = inject(Router);

  // This function creates the URL only when needed/called
  const loginUrlTree = () =>
    router.createUrlTree(['/auth/login'], {
      queryParams: { returnUrl: state.url }
    });

  if (authSession.isAuthenticatedSig()) {
    return true;
  }

  return authSession.reloadLoggedInUser().pipe(
    map(user => user ? true : loginUrlTree()),
    catchError(() => {
      authSession.clearAuthState();

      // A guard should usually return a UrlTree instead of manually navigating. 
      // A guard returns:
      //    boolean | UrlTree | Observable<boolean | UrlTree>
      return of(loginUrlTree());
    })
  )
};
