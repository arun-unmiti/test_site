import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { UserDetailService } from '../auth/user-detail.service';
import { CoreService } from '../utilities/core.service';
import { FeatureToggleService } from '../shared/services/feature-toggle.service';
import { environment, ProjectContext } from '../../environments/environment';
import { NgxQrcodeElementTypes, NgxQrcodeErrorCorrectionLevels } from 'ngx-qrcode2';
import jwtDecode from 'jwt-decode';
import firebase from 'firebase/app';
import 'firebase/auth';
@Component({ selector: 'app-login', templateUrl: './login.component.html', styleUrls: ['./login.component.css'] })
export class LoginComponent implements OnInit {
  userName: any;
  password: any;
  loading: boolean = false;
  projectContext: ProjectContext;
  assetsFolder: string;
  show2fa: boolean = false;
  showEnable2fa: boolean = false;
  otp: string = '';
  mobileOtp: string = '';
  mobileOtpSent: boolean = false;
  tmpToken: string = '';
  userId: any;
  otpLoading: boolean = false;
  otpAuthUri: string = '';
  secret: string = '';
  label: string = '';
  maskedLabel: string = '';
  maskedSecret: string = '';
  showQr: boolean = false;
  showOtpForEnable: boolean = false;
  storedUserinfo: any;
  phoneDisplay: string = 'your registered mobile number';
  reCaptchaVerifier: any;
  verificationId: string | null = null;
  resendTimer: number = 0;
  timerInterval: any;
  remainingAttempts: number = 3;
  showResendOTP: boolean = false;
  elementType = NgxQrcodeElementTypes.CANVAS;
  errorCorrectionLevel = NgxQrcodeErrorCorrectionLevels.HIGH;
  config = { allowNumbersOnly: true, length: 6, isPasswordInput: false, disableAutoFocus: false, placeholder: '', inputStyles: { width: '50px', height: '50px' } };
  constructor( private userService: UserDetailService, private core: CoreService, private featureToggle: FeatureToggleService, private cdr: ChangeDetectorRef ) {
    this.userService.resetTimeout();
    this.projectContext = this.featureToggle.getContext() as ProjectContext;
    this.assetsFolder = environment.projectConfigs[this.projectContext].assetsFolder;
  }
  ngOnInit(): void {}
  private reset2faFields() {
    this.otp = '';
    this.mobileOtp = '';
    this.mobileOtpSent = false;
    this.otpLoading = false;
    this.showQr = false;
    this.showOtpForEnable = false;
    this.loading = false;
    this.phoneDisplay = 'your registered mobile number';
    this.maskedLabel = '';
    this.maskedSecret = '';
    this.verificationId = null;
    // Only clear reCaptchaVerifier if it exists (avoids unnecessary clearing when not initialized)
    if (this.reCaptchaVerifier) {
      this.reCaptchaVerifier.clear();
      this.reCaptchaVerifier = null;
    }
    this.resendTimer = 0;
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    this.remainingAttempts = 3;
    this.showResendOTP = false;
  }
  private updatePhoneDisplay() {
    if (this.storedUserinfo?.phone && this.storedUserinfo.phone.length === 10) {
      const last4 = this.storedUserinfo.phone.slice(-4);
      this.phoneDisplay = '+91 *******' + last4;
    } else {
      this.phoneDisplay = 'your registered mobile number';
    }
  }
  goBackToLogin() {
    this.show2fa = false;
    this.showEnable2fa = false;
    this.reset2faFields();
    this.tmpToken = '';
    this.userId = null;
    this.storedUserinfo = null;
    this.password = '';
    this.userService.session.removeItem('token');
  }
  async submit() {
    if (this.loading) {
      return;
    }
    if (!this.userName) {
      this.core.toast('warn', 'Email Address/Username is required');
      return;
    }
    if (!this.password) {
      this.core.toast('warn', 'Password is required');
      return;
    }
    this.loading = true;
    try {
      const request = this.prepareLoginRequest();
      const response: any = await this.userService.login(request);
      await this.processSubmitResponse(response);
    } catch (error: any) {
      this.core.toast('error', error.error?.message || 'Invalid credentials');
    } finally {
      this.loading = false;
    }
  }
  private prepareLoginRequest() {
    return {
      email_id: this.userName, pass: this.userService.AESEncrypt(this.password), logintype: 'simple', purpose: 'login', platform: 'web'
    };
  }
  private async processSubmitResponse(response: any) {
    if (response.status === 1) {
      this.tmpToken = response.token;
      this.userId = response.userinfo.user_id;
      this.storedUserinfo = response.userinfo;
      this.userService.session.setItem('token', this.tmpToken);
      this.updatePhoneDisplay();
      await this.handleStatusOne(response);
    } else if (response.status === 2 && response["2fa_required"]) {
      this.tmpToken = response.tmp_token;
      if (response.userinfo) {
        this.userId = response.userinfo.user_id;
        this.storedUserinfo = response.userinfo;
        this.updatePhoneDisplay();
      }
      this.show2fa = true;
      this.reset2faFields();
      this.core.toast('info', 'Please choose a verification method');
    } else {
      this.core.toast('error', response.msg || 'Login failed');
    }
  }
  private async handleStatusOne(response: any) {
    if (response.twofa_enabled === '0') {
      this.showEnable2fa = true;
      this.reset2faFields();
      this.core.toast('info', '2FA is not enabled. Please enable it now to continue.');
      await this.generateUserKey();
    } else {
      await this.userService.handleSuccessfulLogin({ token: response.token }, { userinfo: response.userinfo });
    }
  }
  async generateUserKey() {
    this.loading = true;
    try {
      this.ensureUserId();
      const request = this.prepareGenerateKeyRequest();
      const options = this.prepareAuthOptions();
      const response: any = await this.core.post('twofactorlogin/generateuserkey', request, options);
      this.processGenerateKeyResponse(response);
    } catch (error: any) {
      this.core.toast('error', error.error?.message || 'Error generating key');
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }
  private ensureUserId() {
    if (!this.userId) {
      const decoded: any = jwtDecode(this.tmpToken);
      this.userId = decoded.user?.user_id;
    }
  }
  private prepareGenerateKeyRequest() {
    return {
      purpose: 'generateuserkey', user_id: this.userId
    };
  }
  private prepareAuthOptions() {
    return {
      headers: {
        Authorization: `${this.tmpToken}`
      }
    };
  }
  private processGenerateKeyResponse(response: any) {
    if (response.status === 1 && response.uri) {
      this.otpAuthUri = response.uri;
      this.parseOtpAuthUri();
      if (!this.validateSecret()) {
        this.core.toast('error', 'Invalid secret format generated');
        return;
      }
      this.maskLabelAndSecret();
      this.showQr = true;
    } else {
      this.core.toast('error', response.msg || 'Failed to generate key');
    }
  }
  private parseOtpAuthUri() {
    const uriParts = this.otpAuthUri.split('?');
    const path = decodeURIComponent(uriParts[0].split('totp/')[1]);
    const params = new URLSearchParams(uriParts[1]);
    this.secret = params.get('secret') || '';
    this.label = path;
  }
  private validateSecret(): boolean {
    // Base32 validation: A-Z, 2-7, length multiple of 8 bits (but typically 16-32 chars for TOTP)
    const base32Regex = /^[A-Z2-7]+$/;
    return base32Regex.test(this.secret) && this.secret.length >= 16;
  }
  private maskLabelAndSecret() {
    // Mask Account (label) - handles formats like "Service:user@example.com" or "user@example.com"
    this.maskedLabel = this.label;
    if (this.label.includes('@')) {
      const parts = this.label.split('@');
      const domainPart = '@' + parts.slice(1).join('@');
      let preAt = parts[0];
      let servicePrefix = '';
      const colonIndex = preAt.lastIndexOf(':');
      if (colonIndex !== -1) {
        servicePrefix = preAt.substring(0, colonIndex + 1);
        preAt = preAt.substring(colonIndex + 1);
      }
      const visibleChars = preAt.length >= 5 ? 4 : 2;
      const maskedUsername = preAt.substring(0, visibleChars) + '***';
      this.maskedLabel = servicePrefix + maskedUsername + domainPart;
    }
    // Mask Key (secret) - group by 4, show first/last 8 chars grouped when long
    const len = this.secret.length;
    if (len <= 20) {
      this.maskedSecret = this.secret.match(/.{4}/g)?.join(' ') || this.secret;
    } else {
      const visiblePerEnd = 8;
      const start = this.secret.substring(0, visiblePerEnd);
      const end = this.secret.substring(len - visiblePerEnd);
      const startGrouped = start.match(/.{4}/g)?.join(' ') || start;
      const endGrouped = end.match(/.{4}/g)?.join(' ') || end;
      const hiddenLength = len - visiblePerEnd * 2;
      const starsCount = Math.max(7, hiddenLength);
      const stars = '*'.repeat(starsCount);
      this.maskedSecret = startGrouped + ' ' + stars + endGrouped;
    }
  }
  copyText(text: string) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        this.core.toast('success', 'Copied to clipboard');
      }).catch(() => {
        this.core.toast('error', 'Failed to copy');
      });
    } else {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'absolute';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        this.core.toast('success', 'Copied to clipboard');
      } catch (err) {
        this.core.toast('error', 'Failed to copy');
      }
      document.body.removeChild(textarea);
    }
  }
  proceedToEnable() {
    this.showOtpForEnable = true;
  }
  onOtpChange(otpCode: string) {
    this.otp = otpCode;
  }
  onMobileOtpChange(otpCode: string) {
    this.mobileOtp = otpCode;
  }
  // Firebase Mobile OTP Flow (no backend involvement)
  private startResendTimer() {
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
  async sendMobileOtp() {
    if (this.otpLoading) {
      return;
    }
    if (!this.storedUserinfo?.phone || this.storedUserinfo.phone.length !== 10) {
      this.core.toast('error', 'Registered phone number is not available or invalid');
      return;
    }
    this.otpLoading = true;
    try {
      await this.initializeReCaptcha();
      const phoneNumber = '+91' + this.storedUserinfo.phone;
      // Add timeout for Firebase OTP sending (e.g., 30 seconds)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('OTP sending timed out')), 30000)
      );
      const confirmationResult = await Promise.race([ timeoutPromise, firebase.auth().signInWithPhoneNumber(phoneNumber, this.reCaptchaVerifier) ]);
      this.verificationId = (confirmationResult as any).verificationId;
      this.mobileOtpSent = true;
      this.startResendTimer();
      this.core.toast('success', `OTP sent to ${this.phoneDisplay}`);
    } catch (error: any) {
      this.core.toast('error', 'Failed to send OTP: ' + (error.message || 'Unknown error'));
      if (this.reCaptchaVerifier) {
        this.reCaptchaVerifier.clear();
      }
    } finally {
      this.otpLoading = false;
    }
  }
  private async initializeReCaptcha() {
    if (this.reCaptchaVerifier) {
      this.reCaptchaVerifier.clear();
    }
    this.reCaptchaVerifier = new firebase.auth.RecaptchaVerifier('sign-in-button', { size: 'invisible' });
  }
  resendMobileOtp() {
    this.mobileOtp = '';
    this.sendMobileOtp();
  }
  async verifyMobileOtp() {
    if (this.otpLoading || this.mobileOtp.length !== 6 || !this.verificationId) {
      return;
    }
    this.otpLoading = true;
    try {
      const credential = firebase.auth.PhoneAuthProvider.credential(this.verificationId, this.mobileOtp);
      await firebase.auth().signInWithCredential(credential);
      this.core.toast('success', 'Mobile OTP verified successfully');
      await this.userService.handleSuccessfulLogin({ token: this.tmpToken }, this.storedUserinfo ? { userinfo: this.storedUserinfo } : undefined);
    } catch (error: any) {
      this.remainingAttempts--;
      this.core.toast('error', `Invalid OTP. Attempts left: ${this.remainingAttempts}`);
      if (this.remainingAttempts === 0) {
        this.goBackToLogin();
      }
    } finally {
      this.otpLoading = false;
    }
  }
  async verifyTotpForEnable() {
    if (this.otpLoading || this.otp.length !== 6) {
      return;
    }
    this.otpLoading = true;
    try {
      const request = this.prepareVerifyTotpRequest('registration');
      const options = this.prepareAuthOptions();
      const response: any = await this.core.post('twofactorlogin/validateOtp', request, options);
      await this.processVerifyTotpResponse(response, true);
    } catch (error: any) {
      this.core.toast('error', error.error?.message || 'Error verifying code');
    } finally {
      this.otpLoading = false;
    }
  }
  private prepareVerifyTotpRequest(otpType: string) {
    return { otp: this.otp, user_id: this.userId, otp_type: otpType };
  }
  private async processVerifyTotpResponse(response: any, isEnable: boolean) {
    if (response.status === 1) {
      this.core.toast('success', isEnable ? '2FA enabled successfully' : '2FA verified successfully');
      await this.userService.handleSuccessfulLogin(response, isEnable ? { userinfo: this.storedUserinfo } : undefined);
    } else {
      this.core.toast('error', response.msg || 'Invalid code');
    }
  }
  async verifyTotp() {
    if (this.otpLoading || this.otp.length !== 6) {
      return;
    }
    this.otpLoading = true;
    try {
      this.ensureUserId();
      const request = this.prepareVerifyTotpLoginRequest();
      const options = this.prepareAuthOptions();
      const response: any = await this.core.post('twofactorlogin/validateOtp', request, options);
      await this.processVerifyTotpResponse(response, false);
    } catch (error: any) {
      this.core.toast('error', error.error?.message || 'Error verifying code');
    } finally {
      this.otpLoading = false;
    }
  }
  private prepareVerifyTotpLoginRequest() {
    return { otp: this.otp, user_id: this.userId, otp_type: 'login', device_id: this.userService.getDeviceId(), platform: 'web' };
  }
}