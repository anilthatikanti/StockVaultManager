import { Routes } from '@angular/router';
import { AuthenticationComponent } from '../component/authentication/authentication.component';
import { LoginComponent } from '../component/login/login.component';
import { LayoutComponent } from '../component/layout/layout.component';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
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
          import('../component/authentication/auth.routes').then(
            (m) => m.routes
          ),
      },
    ],
  },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
];
