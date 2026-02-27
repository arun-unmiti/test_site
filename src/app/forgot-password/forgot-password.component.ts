import { Component, OnInit } from '@angular/core';
import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';
import { Router } from '@angular/router';
import { FormControl } from '@angular/forms';
import Swal from 'sweetalert2';
import { CoreService } from '../utilities/core.service';
import { UserDetailService } from '../auth/user-detail.service';
import { FeatureToggleService } from '../shared/services/feature-toggle.service';
import { ReCaptchaV3Service } from 'ng-recaptcha';
import { InsightsService } from '../utilities/insights.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent implements OnInit {
  phoneNumber: string = '';
  reCaptchaVerifier: any;
  otp!: string;
  verify: any;
  remainingAttempts: number = 2;
  resendTimer: number = 0;
  verificationId: string | any;
  showOTPVerification: boolean = false;
  timerInterval: any;
  disableSendOTP: boolean = false;
  disablePhoneNumber: boolean = false;
  showResendOTP: boolean = false;
  showPasswordChangeContainer: boolean = false;
  showSendOTP: boolean = true;
  userData: any;
  newPassword: string = '';
  confirmPassword: string = '';
  passwordChanged: boolean = false;
  public passwordError: string = '';
  isSendingOTP: boolean = false;

  constructor(
    private router: Router,
    private core: CoreService,
    private userservice: UserDetailService,
    private featureToggle: FeatureToggleService,
    private recaptchaV3Service: ReCaptchaV3Service,
    private insightsService: InsightsService
  ) {}

  config = {
    allowNumbersOnly: true,
    length: 6,
    isPasswordInput: false,
    disableAutoFocus: false,
    placeholder: '',
    inputStyles: {
      width: '50px',
      height: '50px',
    }
  };

  ngOnInit() {
  }

  sendOTP(): void {
    if (this.isSendingOTP) {
      return;
    }
    this.recaptchaV3Service.execute('phone_check').subscribe({
      next: (token: string) => {
        const request = { purpose: 'mobile_verification', phone_no: this.phoneNumber, captcha_token: token, platform: 'web'          
        };
        this.isSendingOTP = true;
        this.core.post('auth/mobile_verification', request).then((response: any) => {
            if (response.status === 1) {
              this.reCaptchaVerifier = new firebase.auth.RecaptchaVerifier('sign-in-button', { size: 'invisible' });
              firebase.auth().signInWithPhoneNumber('+91' + this.phoneNumber, this.reCaptchaVerifier)
                .then((confirmationResult) => {
                  this.verificationId = confirmationResult.verificationId;
                  this.showSendOTP = false;
                  this.showResendOTP = true;
                  this.disablePhoneNumber = true;
                  this.showOTPVerification = true;
                }).catch((error) => {
                  this.insightsService.logException(error);
                  Swal.fire('Error', 'Failed to send OTP. Try again.', 'error');
                });
            } else {
              Swal.fire('Error', 'Invalid phone number or verification failed.', 'error');
            }
          }).catch((error) => {
            this.insightsService.logException(error);
            Swal.fire('Error', 'Something went wrong. Please try again.', 'error');
          }).finally(() => { 
            this.isSendingOTP = false; 
          });
      },
      error: (err) => {
        this.insightsService.logException(err);
        Swal.fire('Security Check Failed', 'reCAPTCHA verification failed. Please try again.', 'error');
      }
    });
  }

  startResendTimer(): void {
    this.resendTimer = 30;
    this.showResendOTP = false;
    this.timerInterval = setInterval(() => {
      this.resendTimer--;
      if (this.resendTimer === 0) {
        clearInterval(this.timerInterval);
        this.showResendOTP = true;
      }
    }, 1000);
  }

  resendOtpWithPhoneNumber(): void {
    this.isSendingOTP = true;
    firebase.auth().signInWithPhoneNumber('+91' + this.phoneNumber, this.reCaptchaVerifier)
      .then((confirmationResult) => {
        this.verificationId = confirmationResult.verificationId;
        this.startResendTimer();
      })
      .catch((error) => {
        this.insightsService.logException(error);
        Swal.fire('Error', 'Failed to resend OTP.', 'error');
      }).finally(() => { 
        this.isSendingOTP = false; 
      });
  }

  resendOTP() {
    this.resendOtpWithPhoneNumber();
    this.showSendOTP = false;
    this.showResendOTP = true;
    this.disableSendOTP = true;
    this.resendTimer = 30;
    this.startResendTimer();
  }

  onOtpChange(otpCode: string) {
    this.otp = otpCode;
  }

  handleClick() {
    this.isSendingOTP = true;
    const credential = firebase.auth.PhoneAuthProvider.credential(this.verificationId, this.otp);
    firebase.auth().signInWithCredential(credential)
      .then((response) => {
        localStorage.setItem('user', JSON.stringify(response.user));
        this.verify = JSON.parse(localStorage.getItem('user') || '{}');
        response.user?.getIdToken(true).then((idToken) => {
          localStorage.setItem('token', idToken);
          this.showPasswordChangeContainer = true;
        }).catch((error) => {
          this.insightsService.logException(error);
          Swal.fire('Error', 'Failed to authenticate. Please try again.', 'error');
        });
      })
      .catch((error: any) => {
        this.insightsService.logException(error);
        this.remainingAttempts--;
        Swal.fire('Error', 'Invalid OTP. Attempts left: ' + this.remainingAttempts, 'error');
        if (this.remainingAttempts === 0) {
          this.router.navigate(['/login']);
        }
      }).finally(() => { 
        this.isSendingOTP = false; 
      });
  }

  changePassword(): void {
    if (this.isSendingOTP) {
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      Swal.fire('Error', 'Passwords do not match. Please try again.', 'error');
      return;
    }
    if (!this.newPassword || !this.confirmPassword) {
      Swal.fire('Error', 'Please enter a new password and confirm it.', 'error');
      return;
    }
    if (!this.isPasswordValid()) {
      Swal.fire('Error', 'Password does not meet the requirements. Please try again.', 'error');
      return;
    }
    const request = {
      purpose: 'changepassword_otp',
      new_password: this.userservice.AESEncrypt(this.newPassword)
    };
    this.isSendingOTP = true;
    const token = localStorage.getItem('token');
    const options = { headers: { "Authorization": "Bearer " + token } };
    this.core.post("auth/changepassword_otp", request, options).then((res: any) => {
            if (res.status === 1) {
                this.core.toast("success", res.msg);
                localStorage.removeItem('token');
                firebase.auth().signOut();
                this.router.navigate(['/login']);
            } else {
                Swal.fire('Error', 'Failed to update password. Please try again.', 'error');
            }
        }).catch(error => {
            this.insightsService.logException(error);
            Swal.fire('Error', 'An error occurred while changing the password. Please try again.', 'error');
        }).finally(() => { 
          this.isSendingOTP = false; 
        });
  }

  isPasswordValid(): boolean {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*_=+-]).{8,}$/;
    return regex.test(this.newPassword);
  }
}