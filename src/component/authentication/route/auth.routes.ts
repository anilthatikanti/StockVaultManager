import { Routes } from '@angular/router';
import { SignupComponent } from '../signup/signup.component';
import { LoginComponent } from '../login/login.component';
import { negAuthGuard } from '../guards/neg-auth/neg-auth-gaurd.guard';
import { authGuard } from '../guards/auth/auth-gaurd.guard';
import { VerifyEmailComponent } from '../verify-email/verify-email.component';
import { ForgotPasswordComponent } from '../forgot-password/forgot-passward.component';
import { ResetPaswwordComponent } from '../reset-password/reset-password.component';

export const routes: Routes = [
  { path: 'signup', component: SignupComponent, canActivate: [negAuthGuard] },
  { path: 'login', component: LoginComponent, canActivate: [negAuthGuard] },
  {
    path: 'verify-email',
    component: VerifyEmailComponent,
    canActivate: [authGuard],
  },
  {
    path: 'forgot-password',
    component: ForgotPasswordComponent,
    canActivate: [negAuthGuard],
  },
  {
    path: 'reset-password',
    component: ResetPaswwordComponent,
    canActivate: [negAuthGuard],
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
];
