import { Routes } from '@angular/router';
import { AuthenticationComponent } from '../component/authentication/route/authentication.component';
import { LoginComponent } from '../component/authentication/login/login.component';
import { LayoutComponent } from '../component/layout/layout.component';
import { authGuard } from '../component/authentication/guards/auth/auth-gaurd.guard';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    // canActivate: [authGuard],
    children: [
      {
        path: '',
        loadChildren: () =>
          import('../component/layout/layout.routes').then((m) => m.routes),
      },
    ],
  },
  {
    path: 'auth',
    component: AuthenticationComponent,
    children: [
      {
        path: '',
        loadChildren: () =>
          import('../component/authentication/route/auth.routes').then(
            (m) => m.routes
          ),
      },
    ],
  },
];
