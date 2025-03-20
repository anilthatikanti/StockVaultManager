import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Auth, user } from '@angular/fire/auth';
import { catchError, from, mergeMap, take, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(Auth); // Inject Auth in a function-based approach

  return user(auth).pipe(
    take(1),
    mergeMap((firebaseUser) =>
      firebaseUser
        ? from(firebaseUser.getIdToken()).pipe(
            mergeMap((token) => {
              return next(
                req.clone({
                  setHeaders: { Authorization: `Bearer ${token}` },
                })
              );
            })
          )
        : next(req)
    ),
    catchError((err) => {
      console.error('🔥 HTTP Error:', err);
      console.log(err.error?.message || 'Something went wrong!'); // Show message in UI
      return throwError(() => err);
    })
  );
};
