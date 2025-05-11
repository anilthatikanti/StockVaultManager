import { Component, OnInit } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import {
  logoutUser,
  sendUserEmailVerificationLink,
} from '../functions/authentication.function';
import { applyActionCode, Auth } from '@angular/fire/auth';
import { ActivatedRoute, Router } from '@angular/router';
import { WEB_APP_URL } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '../../../shared/services/toastService/toast.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [ButtonModule],
  templateUrl: './verify-email.component.html',
  styleUrl: './verify-email.component.css',
})
export class VerifyEmailComponent implements OnInit {
  email!: string;
  mode: string = '';
  oobCode: string = '';
  apiKey: string = '';
  continueUrl: string = '';
  isVerifyEmailSend: Boolean = false;

  isResendButtonDisabled: boolean = true;
  timer: number = 60;
  timerId!: any;
  emailVerified: boolean = false;
  emailVerificationFailureMessage: string = '';

  constructor(
    private firebaseAuth: Auth,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.activatedRoute.queryParams.subscribe((params) => {
      this.mode = params['mode'] ?? 'checkInbox';
      this.oobCode = params['oobCode'];
      this.apiKey = params['apiKey'];
      this.continueUrl = params['continueUrl'] ?? WEB_APP_URL;
    });

    this.emailVerifyComponentInit();
  }

  async emailVerifyComponentInit() {
    this.userEmailVerifyStatusCheck();
    switch (this.mode) {
      case 'checkInbox':
        await this.onClickResendVerificationLink();
        break;
      case 'resetPassword':
        this.router.navigate([`/auth/reset-password`], {
          queryParams: { oobCode: `${this.oobCode}` },
        });
        break;
      case 'verifyEmail':
        await this.applyVerificationCode();
        break;
      case 'emailVerifyFailed':
        break;
      default:
        this.router.navigate(['']);
    }
  }

  async userEmailVerifyStatusCheck() {
    try {
      const interval = setInterval(async () => {
        const user = this.firebaseAuth.currentUser;
        if (user) {
          await user.reload();
          await user.getIdTokenResult(true);
          if (user.emailVerified) {
            clearInterval(interval);
            const data = await firstValueFrom(
              this.http.post('http://localhost:3000/user/create-user', { email: user.email })
            );
            window.location.href = this.router.url || WEB_APP_URL;
          }
        }
      }, 1000);
    } catch (error) {
      console.error('Error in userEmailVerifyStatusCheck:', error);
    }
  }

  async applyVerificationCode() {
    try {
      await applyActionCode(this.firebaseAuth, this.oobCode);
      this.mode = 'emailVerifySuccess';
    } catch (error: any) {
      console.log('verifyEmail: [ERR] ', error);
      if (error.code == 'auth/invalid-action-code') {
        this.emailVerificationFailureMessage =
          'Either your verification link has expired or the link has already been used';
      } else {
        this.emailVerificationFailureMessage =
          "Unfortunately, we couldn't verify your email. Please try again.";
      }
      this.mode = 'emailVerifyFailed';
    }
  }

  async onClickResendVerificationLink() {
    if (this.firebaseAuth.currentUser?.emailVerified) {
      window.location.href = `${this.continueUrl}`;
      return;
    }
    let isEmailSent = await sendUserEmailVerificationLink(
      window.location.host,
      this.firebaseAuth,
      this.toast.messageService!
    );
    if (isEmailSent) {
      this.startTimer();
    } else {
      await logoutUser(this.firebaseAuth);
    }
  }

  startTimer() {
    this.isVerifyEmailSend = true;
    this.isResendButtonDisabled = true;
    this.timer = 60;
    this.timerId = setInterval(() => {
      this.timer = this.timer - 1;
      if (this.timer === 0) {
        clearInterval(this.timerId);
        this.isResendButtonDisabled = false;
        this.isVerifyEmailSend = false;
      }
    }, 1000);
  }

  onClickBackToLogin() {
    logoutUser(this.firebaseAuth, false);
    this.router.navigate(['/auth/login']);
  }
}
