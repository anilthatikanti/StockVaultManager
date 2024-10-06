import { Routes } from '@angular/router';
import { AuthenticationComponent } from '../component/authentication/authentication.component';
import { LoginComponent } from '../component/login/login.component';

export const routes: Routes = [
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
  {
    path: 'dashboard',
    loadComponent: () =>
      import('../component/dashboard/dashboard.component').then(
        (m) => m.DashboardComponent
      ),
  },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
];
