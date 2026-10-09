import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError, shareReplay, finalize, switchMap, Observable } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthSessionService } from '../services/auth-session-service';

let refreshRequest$: Observable<string> | null = null;

export const authRefreshInterceptor: HttpInterceptorFn = (req, next) => {
  const authSession = inject(AuthSessionService);
  const snackBar = inject(MatSnackBar);

  // Prevent a failed refresh request from attempting another refresh.
  if (req.url.endsWith(`/${authSession.apiRoute}/refresh-tokens`)) {
    return next(req);
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401) {
        return throwError(() => error);
      }

      if (!refreshRequest$) {
        refreshRequest$ = authSession.refreshSession().pipe(
          finalize(() => {
            refreshRequest$ = null;
          }),
          // The refresh request should continue even if one of the original requests is cancelled;
          // Concurrent 401 responses should reuse the same refresh request.
          shareReplay({
            bufferSize: 1,
            refCount: false
          })
        );
      }

      return refreshRequest$.pipe(
        catchError(refreshError => {
          authSession.logout();

          snackBar.open(
            'Your session has expired. Please log in again.',
            'Close',
            {
              horizontalPosition: 'center',
              verticalPosition: 'top',
              duration: 7000
            }
          );

          return throwError(() => refreshError);
        }),

        // Errors from the retried request are not interpreted as
        // refresh failures.
        switchMap(() => next(req))
      );
    })
  );
};
