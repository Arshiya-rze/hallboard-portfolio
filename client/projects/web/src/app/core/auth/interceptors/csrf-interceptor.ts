import { HttpInterceptorFn } from '@angular/common/http';
import { AuthSessionService } from '../services/auth-session-service';
import { inject } from '@angular/core';
import { switchMap, take } from 'rxjs';
import { BrowserStorage } from '../../platform/browser-storage';
import { environment } from '../../../../environments/environment';

const unsafeMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export const csrfInterceptor: HttpInterceptorFn = (req, next) => {
  const authSessionService = inject(AuthSessionService);
  const browserStorage = inject(BrowserStorage);

  // Never send an application CSRF token to third-party or read-only requests.
  if (!req.url.startsWith(environment.apiUrl) || !unsafeMethods.has(req.method)) {
    return next(req);
  }

  // Reuse the tab-scoped token when one has already been issued.
  const csrfToken = browserStorage.sessionGetItem<string>('csrfToken');
  if (csrfToken) {
    return next(
      req.clone({
        setHeaders: { 'X-XSRF-TOKEN': csrfToken },
      }),
    );
  }

  // Acquire and cache a token before forwarding the original unsafe request.
  return authSessionService.getCsrfToken$().pipe(
    take(1),
    switchMap((response) => {
      browserStorage.sessionSetItem('csrfToken', response.requestToken);

      return next(
        req.clone({
          setHeaders: { 'X-XSRF-TOKEN': response.requestToken },
        }),
      );
    }),
  );
};
