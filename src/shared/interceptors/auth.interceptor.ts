import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Auth, user } from '@angular/fire/auth';
import { from, mergeMap, take } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(Auth); // Inject Auth in a function-based approach

  return user(auth).pipe(
    take(1),
    mergeMap((firebaseUser) => 
      firebaseUser 
        ? from(firebaseUser.getIdToken()).pipe(
            mergeMap((token) => 
              next(req.clone({ setHeaders: { Authorization: `Bearer ${token}`,'Cache-Control': 'no-cache' } }))
            )
          ) 
        : next(req)
    )
  );
};
