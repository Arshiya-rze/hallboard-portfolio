import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const apiErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const snack = inject(MatSnackBar);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 400) {
        console.error('API 400 response:', {
          status: err.status,
          error: err.error,
        });

        snack.open(
          'Generic error message! The request could not be processed. Please report this error to support.',
          'Close',
          {
            horizontalPosition: 'center',
            verticalPosition: 'top',
          },
        );
      } else if (err.status === 403) {
        void router.navigate(['/no-access']);
      } else if (err.status === 404) {
        void router.navigate(['/not-found']);
      } else if (err.status >= 500 && err.status < 600) {
        void router.navigate(['/server-error']);
      } else if (err.status !== 401) {
        snack.open(
          'Something unexpected went wrong.',
          'Close',
          {
            horizontalPosition: 'center',
            verticalPosition: 'top',
            duration: 7000,
          },
        );
      }

      return throwError(() => err);
    }),
  );
};
