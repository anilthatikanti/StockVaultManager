import { inject } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { CanActivateFn, Router } from '@angular/router';

export const negAuthGuard: CanActivateFn = (route, state) => {
  const firebaseAuth = inject(Auth);
  const router = inject(Router);

  return new Promise((resolve, reject) => {
    firebaseAuth.onAuthStateChanged((user) => {
      if (user?.emailVerified) {
        router.navigate(['']);
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
};
