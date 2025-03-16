import { inject } from '@angular/core';
import { Auth, authState } from '@angular/fire/auth';
import { CanActivateFn, Router } from '@angular/router';
import { ToastService } from '../../../../shared/services/toastService/toast.service';
import { firstValueFrom } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
  const firebaseAuth = inject(Auth);
  const router = inject(Router);
  const toastService = inject(ToastService);

  return new Promise((resolve, reject) => {
    firebaseAuth.onAuthStateChanged(async (user) => {
      console.log('user', user)
      if (user) {
        if (user.emailVerified) {
          if (state.url.includes('/auth/verify-email')) {
            router.navigate(['']);
            resolve(false);
          } else {
            resolve(true);
          }
        } else {
          if (state.url.includes('/auth/verify-email')) {
            resolve(true);
          } else {
            router.navigate(['/auth/verify-email']);
            resolve(false);
          }
        }
      } else {
        if (
          state.url.includes('/auth/verify-email') &&
          state.root.queryParams['oobCode']
        ) {
          resolve(true);
        } else {
          router.navigate(['/auth/login']);
          resolve(false);
        }
      }
    });
  });
};
