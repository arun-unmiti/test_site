import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Router } from '@angular/router';
import { LoginComponent } from './login.component';
import { UserDetailService } from 'src/app/auth/user-detail.service';
import { CoreService } from 'src/app/utilities/core.service';
import { FeatureToggleService } from 'src/app/shared/services/feature-toggle.service';
import { NgxQRCodeModule } from 'ngx-qrcode2';
import jwtDecode from 'jwt-decode';
import firebase from 'firebase/app';

jest.mock('jwt-decode', () => jest.fn());
jest.mock('firebase/app', () => {
  const mAuthInstance = {
    signInWithPhoneNumber: jest.fn(),
    signInWithCredential: jest.fn(),
  };
  const mAuth = jest.fn(() => mAuthInstance);
  (mAuth as any).RecaptchaVerifier = jest.fn((id: string, opt: any) => ({
    clear: jest.fn(),
  }));
  (mAuth as any).PhoneAuthProvider = {
    credential: jest.fn((vid: string, code: string) => ({})),
  };
  return {
    auth: mAuth,
  };
});

const mockUserDetailService = {
  login: jest.fn(),
  handleSuccessfulLogin: jest.fn(),
  AESEncrypt: jest.fn((pass) => pass),
  resetTimeout: jest.fn(),
  session: {
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
  getDeviceId: jest.fn(() => 'mock-device-id'),
};

const mockCoreService = {
  toast: jest.fn(),
  post: jest.fn(),
};

const mockFeatureToggleService = {
  getContext: jest.fn(() => 'munichre'),
};

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let router: Router;
  let coreService: any;
  let userService: any;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LoginComponent],
      imports: [
        FormsModule,
        HttpClientTestingModule,
        RouterTestingModule.withRoutes([{ path: '**', component: LoginComponent }]),
        NgxQRCodeModule,
      ],
      providers: [
        { provide: UserDetailService, useValue: mockUserDetailService },
        { provide: CoreService, useValue: mockCoreService },
        { provide: FeatureToggleService, useValue: mockFeatureToggleService },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    coreService = TestBed.inject(CoreService);
    userService = TestBed.inject(UserDetailService);
    jest.spyOn(router, 'navigate');
    fixture.detectChanges();
    jest.clearAllMocks();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should verify valid login credentials without 2FA', async () => {
    const mockResponse = {
      status: 1,
      token: 'mock-token',
      userinfo: { user_role: 1, twofa_enabled: '1', user_id: '123', phone: '1234567890' },
      twofa_enabled: '1',
    };
    userService.login.mockResolvedValue(mockResponse);
    userService.handleSuccessfulLogin.mockResolvedValue({});

    component.userName = 'valid@user.com';
    component.password = 'validpass';
    await component.submit();

    expect(userService.login).toHaveBeenCalledWith({
      email_id: 'valid@user.com',
      pass: 'validpass',
      logintype: 'simple',
      purpose: 'login',
      platform: 'web',
    });
    expect(userService.handleSuccessfulLogin).toHaveBeenCalledWith(
      { token: 'mock-token' },
      { userinfo: { user_role: 1, twofa_enabled: '1', user_id: '123', phone: '1234567890' } }
    );
    expect(coreService.toast).not.toHaveBeenCalled();
    expect(component.loading).toBe(false);
  });

  it('should verify invalid login credentials and show error message', async () => {
    const mockError = { error: { message: 'Invalid credentials' } };
    userService.login.mockRejectedValue(mockError);

    component.userName = 'invalid@user.com';
    component.password = 'invalidpass';
    await component.submit();

    expect(userService.login).toHaveBeenCalledWith({
      email_id: 'invalid@user.com',
      pass: 'invalidpass',
      logintype: 'simple',
      purpose: 'login',
      platform: 'web',
    });
    expect(coreService.toast).toHaveBeenCalledWith('error', 'Invalid credentials');
    expect(router.navigate).not.toHaveBeenCalled();
    expect(component.loading).toBe(false);
  });

  it('should show warning if username is empty', () => {
    component.userName = '';
    component.password = 'validpass';
    component.submit();
    expect(coreService.toast).toHaveBeenCalledWith('warn', 'Email Address/Username is required');
    expect(userService.login).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
    expect(component.loading).toBe(false);
  });

  it('should show warning if password is empty', () => {
    component.userName = 'valid@user.com';
    component.password = '';
    component.submit();
    expect(coreService.toast).toHaveBeenCalledWith('warn', 'Password is required');
    expect(userService.login).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
    expect(component.loading).toBe(false);
  });

  it('should not submit if loading is true', () => {
    component.loading = true;
    component.userName = 'valid@user.com';
    component.password = 'validpass';
    component.submit();
    expect(userService.login).not.toHaveBeenCalled();
  });

  it('should handle login with 2FA required without userinfo', async () => {
    const mockResponse = {
      status: 2,
      '2fa_required': true,
      tmp_token: 'mock-tmp-token',
    };
    userService.login.mockResolvedValue(mockResponse);

    component.userName = 'valid@user.com';
    component.password = 'validpass';
    await component.submit();

    expect(component.show2fa).toBe(true);
    expect(component.tmpToken).toBe('mock-tmp-token');
    expect(component.userId).toBeUndefined();
    expect(component.storedUserinfo).toBeUndefined();
    expect(component.phoneDisplay).toBe('your registered mobile number');
    expect(coreService.toast).toHaveBeenCalledWith('info', 'Please choose a verification method');
  });

  it('should handle login failure with custom message', async () => {
    const mockResponse = { status: 0, msg: 'Custom error' };
    userService.login.mockResolvedValue(mockResponse);

    component.userName = 'test';
    component.password = 'test';
    await component.submit();

    expect(coreService.toast).toHaveBeenCalledWith('error', 'Custom error');
  });

  it('should handle login failure without message', async () => {
    const mockResponse = { status: 0 };
    userService.login.mockResolvedValue(mockResponse);

    component.userName = 'test';
    component.password = 'test';
    await component.submit();

    expect(coreService.toast).toHaveBeenCalledWith('error', 'Login failed');
  });

  it('should handle login error without error object', async () => {
    userService.login.mockRejectedValue(new Error('Generic error'));

    component.userName = 'test';
    component.password = 'test';
    await component.submit();

    expect(coreService.toast).toHaveBeenCalledWith('error', 'Invalid credentials');
  });

  it('should handle successful login with 2FA disabled', async () => {
    const mockResponse = {
      status: 1,
      token: 'mock-token',
      userinfo: { user_role: 1, twofa_enabled: '0', user_id: '123', phone: '1234567890' },
      twofa_enabled: '0',
    };
    userService.login.mockResolvedValue(mockResponse);
    coreService.post.mockResolvedValue({
      status: 1,
      uri: 'otpauth://totp/label?secret=JBSWY3DPEHPK3PXP',
    });

    component.userName = 'valid@user.com';
    component.password = 'validpass';
    await component.submit();

    expect(component.showEnable2fa).toBe(true);
    expect(coreService.toast).toHaveBeenCalledWith('info', '2FA is not enabled. Please enable it now to continue.');
    expect(coreService.post).toHaveBeenCalledWith(
      'twofactorlogin/generateuserkey',
      { purpose: 'generateuserkey', user_id: '123' },
      { headers: { Authorization: 'mock-token' } }
    );
    expect(component.otpAuthUri).toBe('otpauth://totp/label?secret=JBSWY3DPEHPK3PXP');
    expect(component.secret).toBe('JBSWY3DPEHPK3PXP');
    expect(component.label).toBe('label');
    expect(component.showQr).toBe(true);
  });

  it('should generate user key and handle invalid secret', async () => {
    component.tmpToken = 'mock-token';
    component.userId = '123';
    coreService.post.mockResolvedValue({
      status: 1,
      uri: 'otpauth://totp/label?secret=invalid!',
    });

    await component.generateUserKey();

    expect(coreService.toast).toHaveBeenCalledWith('error', 'Invalid secret format generated');
    expect(component.showQr).toBe(false);
  });

  it('should generate user key and handle failure', async () => {
    component.tmpToken = 'mock-token';
    component.userId = '123';
    coreService.post.mockResolvedValue({ status: 0, msg: 'Failed' });

    await component.generateUserKey();

    expect(coreService.toast).toHaveBeenCalledWith('error', 'Failed');
  });

  it('should generate user key and handle error', async () => {
    component.tmpToken = 'mock-token';
    component.userId = '123';
    coreService.post.mockRejectedValue({ error: { message: 'Error' } });

    await component.generateUserKey();

    expect(coreService.toast).toHaveBeenCalledWith('error', 'Error');
  });

  it('should parse OTP auth URI correctly', () => {
    component.otpAuthUri = 'otpauth://totp/Service%3Auser%40example.com?secret=ABCDEF1234567890';
    (component as any).parseOtpAuthUri();
    expect(component.label).toBe('Service:user@example.com');
    expect(component.secret).toBe('ABCDEF1234567890');
  });

  it('should validate secret correctly', () => {
    component.secret = 'JBSWY3DPEHPK3PXP'; // Valid Base32
    expect((component as any).validateSecret()).toBe(true);

    component.secret = 'invalid!'; // Invalid chars
    expect((component as any).validateSecret()).toBe(false);

    component.secret = 'ABCDEF'; // Too short
    expect((component as any).validateSecret()).toBe(false);
  });

  it('should mask label and secret correctly', () => {
    // Label without @
    component.label = 'simplelabel';
    (component as any).maskLabelAndSecret();
    expect(component.maskedLabel).toBe('simplelabel');

    // Label with @, long username, no service
    component.label = 'longusername@example.com';
    (component as any).maskLabelAndSecret();
    expect(component.maskedLabel).toBe('long***@example.com');

    // Label with @, short username
    component.label = 'user@example.com';
    (component as any).maskLabelAndSecret();
    expect(component.maskedLabel).toBe('us***@example.com');

    // With service
    component.label = 'Service:longuser@example.com';
    (component as any).maskLabelAndSecret();
    expect(component.maskedLabel).toBe('Service:long***@example.com');

    // Secret <=20
    component.secret = 'JBSWY3DPEHPK3PXP'; //16
    (component as any).maskLabelAndSecret();
    expect(component.maskedSecret).toBe('JBSW Y3DP EHPK 3PXP');

    // Secret >20, say 32
    component.secret = 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP';
    (component as any).maskLabelAndSecret();
    expect(component.maskedSecret).toBe('JBSW Y3DP ****************EHPK 3PXP');
  });

  it('should copy text using clipboard', async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, writable: true });

    await component.copyText('text');
    expect(writeText).toHaveBeenCalledWith('text');
    expect(coreService.toast).toHaveBeenCalledWith('success', 'Copied to clipboard');
  });

  it('should proceed to enable 2FA', () => {
    component.proceedToEnable();
    expect(component.showOtpForEnable).toBe(true);
  });

  it('should update OTP on change', () => {
    component.onOtpChange('123456');
    expect(component.otp).toBe('123456');
  });

  it('should update mobile OTP on change', () => {
    component.onMobileOtpChange('654321');
    expect(component.mobileOtp).toBe('654321');
  });

  it('should start resend timer and show resend when done', fakeAsync(() => {
    (component as any).startResendTimer();
    expect(component.resendTimer).toBe(30);
    expect(component.showResendOTP).toBe(false);

    tick(30000);
    expect(component.resendTimer).toBe(0);
    expect(component.showResendOTP).toBe(true);
  }));

  it('should not send mobile OTP if no valid phone', () => {
    component.storedUserinfo = { phone: '123' };
    component.sendMobileOtp();
    expect(coreService.toast).toHaveBeenCalledWith('error', 'Registered phone number is not available or invalid');
  });

  it('should resend mobile OTP', () => {
    const sendSpy = jest.spyOn(component, 'sendMobileOtp');
    component.resendMobileOtp();
    expect(component.mobileOtp).toBe('');
    expect(sendSpy).toHaveBeenCalled();
  });

  it('should not verify TOTP for enable if invalid', () => {
    component.otp = '12345';
    component.verifyTotpForEnable();
    expect(coreService.post).not.toHaveBeenCalled();
  });

  it('should verify TOTP for enable successfully', async () => {
    component.otp = '123456';
    component.userId = '123';
    component.tmpToken = 'mock-token';
    component.storedUserinfo = { user_id: '123' };
    coreService.post.mockResolvedValue({ status: 1 });
    userService.handleSuccessfulLogin.mockResolvedValue({});

    await component.verifyTotpForEnable();

    expect(coreService.post).toHaveBeenCalledWith(
      'twofactorlogin/validateOtp',
      { otp: '123456', user_id: '123', otp_type: 'registration' },
      { headers: { Authorization: 'mock-token' } }
    );
    expect(coreService.toast).toHaveBeenCalledWith('success', '2FA enabled successfully');
    expect(userService.handleSuccessfulLogin).toHaveBeenCalledWith({ status: 1 }, { userinfo: { user_id: '123' } });
  });

  it('should handle verify TOTP for enable failure', async () => {
    component.otp = '123456';
    component.userId = '123';
    component.tmpToken = 'mock-token';
    coreService.post.mockResolvedValue({ status: 0, msg: 'Invalid' });

    await component.verifyTotpForEnable();

    expect(coreService.toast).toHaveBeenCalledWith('error', 'Invalid');
  });

  it('should handle verify TOTP for enable error', async () => {
    component.otp = '123456';
    component.userId = '123';
    component.tmpToken = 'mock-token';
    coreService.post.mockRejectedValue({ error: { message: 'Error' } });

    await component.verifyTotpForEnable();

    expect(coreService.toast).toHaveBeenCalledWith('error', 'Error');
  });

  it('should not verify TOTP if invalid', () => {
    component.otp = '12345';
    component.verifyTotp();
    expect(coreService.post).not.toHaveBeenCalled();
  });

  it('should verify TOTP successfully', async () => {
    component.otp = '123456';
    component.userId = '123';
    component.tmpToken = 'mock-token';
    coreService.post.mockResolvedValue({ status: 1 });
    userService.handleSuccessfulLogin.mockResolvedValue({});

    await component.verifyTotp();

    expect(coreService.post).toHaveBeenCalledWith(
      'twofactorlogin/validateOtp',
      { otp: '123456', user_id: '123', otp_type: 'login', device_id: 'mock-device-id', platform: 'web' },
      { headers: { Authorization: 'mock-token' } }
    );
    expect(coreService.toast).toHaveBeenCalledWith('success', '2FA verified successfully');
    expect(userService.handleSuccessfulLogin).toHaveBeenCalledWith({ status: 1 }, undefined);
  });

  it('should handle verify TOTP failure', async () => {
    component.otp = '123456';
    component.userId = '123';
    component.tmpToken = 'mock-token';
    coreService.post.mockResolvedValue({ status: 0, msg: 'Invalid' });

    await component.verifyTotp();

    expect(coreService.toast).toHaveBeenCalledWith('error', 'Invalid');
  });

  it('should handle verify TOTP error', async () => {
    component.otp = '123456';
    component.userId = '123';
    component.tmpToken = 'mock-token';
    coreService.post.mockRejectedValue({ error: { message: 'Error' } });

    await component.verifyTotp();

    expect(coreService.toast).toHaveBeenCalledWith('error', 'Error');
  });

  it('should go back to login and reset fields', () => {
    component.show2fa = true;
    component.showEnable2fa = true;
    component.tmpToken = 'token';
    component.userId = '123';
    component.storedUserinfo = {};
    component.password = 'pass';
    component.mobileOtpSent = true;
    component.otpLoading = true;
    component.showQr = true;
    component.showOtpForEnable = true;
    component.loading = true;
    component.verificationId = 'vid';
    component.resendTimer = 10;
    component.timerInterval = setInterval(() => {}, 1000);
    component.remainingAttempts = 2;
    component.showResendOTP = true;

    const clearSpy = jest.fn();
    component.reCaptchaVerifier = { clear: clearSpy };

    component.goBackToLogin();

    expect(component.show2fa).toBe(false);
    expect(component.showEnable2fa).toBe(false);
    expect(component.tmpToken).toBe('');
    expect(component.userId).toBeNull();
    expect(component.storedUserinfo).toBeNull();
    expect(component.password).toBe('');
    expect(userService.session.removeItem).toHaveBeenCalledWith('token');
    expect(component.mobileOtpSent).toBe(false);
    expect(component.otpLoading).toBe(false);
    expect(component.showQr).toBe(false);
    expect(component.showOtpForEnable).toBe(false);
    expect(component.loading).toBe(false);
    expect(component.verificationId).toBeNull();
    expect(component.resendTimer).toBe(0);
    expect(component.remainingAttempts).toBe(3);
    expect(component.showResendOTP).toBe(false);
    expect(clearSpy).toHaveBeenCalled();
    expect(component.reCaptchaVerifier).toBeNull();
  });

  it('should update phone display with valid phone', () => {
    component.storedUserinfo = { phone: '1234567890' };
    (component as any).updatePhoneDisplay();
    expect(component.phoneDisplay).toBe('+91 *******7890');
  });

  it('should update phone display with invalid phone', () => {
    component.storedUserinfo = { phone: '123' };
    (component as any).updatePhoneDisplay();
    expect(component.phoneDisplay).toBe('your registered mobile number');
  });

  it('should reset 2FA fields without existing verifier', () => {
    component.reCaptchaVerifier = null;
    (component as any).reset2faFields();
    expect(component.reCaptchaVerifier).toBeNull(); // No error
  });
});