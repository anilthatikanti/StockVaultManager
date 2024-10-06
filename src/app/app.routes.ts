import { Routes } from '@angular/router';
import { AuthenticationComponent } from '../component/authentication/authentication.component';
import { LoginComponent } from '../component/login/login.component';

export const routes: Routes = [
  {
    path: 'auth',
    component: AuthenticationComponent,
  },
  { path: '', redirectTo: 'auth', pathMatch: 'full' },
];
