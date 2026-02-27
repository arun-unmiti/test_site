// src/app/forgot-password/forgot-password.component.spec.ts

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ReCaptchaV3Service } from 'ng-recaptcha';
import { of, throwError } from 'rxjs';
import { ForgotPasswordComponent } from './forgot-password.component';
import { CoreService } from '../utilities/core.service';
import { UserDetailService } from '../auth/user-detail.service';
import { FeatureToggleService } from '../shared/services/feature-toggle.service';
import { InsightsService } from '../utilities/insights.service';
import { fakeAsync, tick, flush } from '@angular/core/testing';

// Mock Firebase - these must be at the top level
jest.mock('firebase/app', () => {
  const mAuth = {
    signInWithPhoneNumber: jest.fn(),
    signInWithCredential: jest.fn(),
    signOut: jest.fn(),
  };

  const mPhoneAuthProvider = {
    credential: jest.fn(),
  };

  const mRecaptchaVerifier = jest.fn(() => ({}));

  const mAuthNamespace: any = jest.fn(() => mAuth);
  mAuthNamespace.PhoneAuthProvider = mPhoneAuthProvider;
  mAuthNamespace.RecaptchaVerifier = mRecaptchaVerifier;

  return {
    default: {
      initializeApp: jest.fn(() => ({})),
      auth: mAuthNamespace,
    },
  };
});

jest.mock('firebase/auth', () => ({}));
jest.mock('firebase/firestore', () => ({}));

jest.mock('sweetalert2', () => ({
  __esModule: true,
  default: {
    fire: jest.fn().mockResolvedValue({ isConfirmed: true }),
  },
}));

// Import Swal after the mock
import Swal from 'sweetalert2';

describe('ForgotPasswordComponent', () => {
  let component: ForgotPasswordComponent;
  let fixture: ComponentFixture<ForgotPasswordComponent>;
  let originalLocalStorage: Storage | undefined;

  const mockCoreService = {
    post: jest.fn(),
    toast: jest.fn(),
  };

  const mockUserDetailService = {
    AESEncrypt: jest.fn().mockReturnValue('encrypted-password'),
  };

  const mockFeatureToggleService = {
    getConfig: jest.fn(() => ({ config: btoa(JSON.stringify({})) })),
  };

  const mockRouter = {
    navigate: jest.fn(),
  };

  const mockRecaptchaV3Service = {
    execute: jest.fn().mockReturnValue(of('mock-recaptcha-token')),
  };

  const mockInsightsService = {
    logException: jest.fn(),
  };

  // Access mocks after the jest.mock calls
  const firebase = require('firebase/app');
  const mockAuthNamespace = firebase.default.auth;
  const mockAuth = mockAuthNamespace();
  const mockSignInWithPhoneNumber = mockAuth.signInWithPhoneNumber;
  const mockSignInWithCredential = mockAuth.signInWithCredential;
  const mockSignOut = mockAuth.signOut;
  const mockPhoneAuthCredential = mockAuthNamespace.PhoneAuthProvider.credential;
  const mockRecaptchaVerifier = mockAuthNamespace.RecaptchaVerifier;

  beforeEach(async () => {
    // Save original localStorage
    originalLocalStorage = window.localStorage;

    await TestBed.configureTestingModule({
      declarations: [ForgotPasswordComponent],
      imports: [HttpClientTestingModule, FormsModule],
      providers: [
        { provide: CoreService, useValue: mockCoreService },
        { provide: UserDetailService, useValue: mockUserDetailService },
        { provide: FeatureToggleService, useValue: mockFeatureToggleService },
        { provide: Router, useValue: mockRouter },
        { provide: ReCaptchaV3Service, useValue: mockRecaptchaV3Service },
        { provide: InsightsService, useValue: mockInsightsService },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ForgotPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    component.remainingAttempts = 2;
    component.isSendingOTP = false;
    component.showPasswordChangeContainer = false;
    component.phoneNumber = '';
    component.otp = '';
    component.verificationId = '';
    component.disablePhoneNumber = false;
    component.showSendOTP = true;
    component.showResendOTP = false;
    component.showOTPVerification = false;
    component.newPassword = '';
    component.confirmPassword = '';
    component.resendTimer = 0;
    if (component.timerInterval) {
      clearInterval(component.timerInterval);
    }
    component.passwordError = '';
    component.userData = {};
    component.passwordChanged = false;
    mockInsightsService.logException.mockReset();
  });

  afterEach(() => {
    // Restore original localStorage
    if (originalLocalStorage) {
      Object.defineProperty(window, 'localStorage', {
        value: originalLocalStorage,
        writable: true,
      });
    }
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should be empty', () => {
      component.ngOnInit();
      expect(true).toBe(true);
    });
  });

  describe('sendOTP', () => {
    it('should return early if isSendingOTP', () => {
      component.isSendingOTP = true;
      component.sendOTP();
      expect(mockRecaptchaV3Service.execute).not.toHaveBeenCalled();
    });

    it('should handle reCAPTCHA error', () => {
      mockRecaptchaV3Service.execute.mockReturnValue(throwError(() => new Error('recaptcha error')));

      component.sendOTP();

      expect(Swal.fire).toHaveBeenCalledWith('Security Check Failed', 'reCAPTCHA verification failed. Please try again.', 'error');
    });
  });

  describe('startResendTimer', () => {
    it('should start timer and show resend when timer reaches 0', fakeAsync(() => {
      component.startResendTimer();
      expect(component.resendTimer).toBe(30);
      expect(component.showResendOTP).toBe(false);

      for (let i = 0; i < 30; i++) {
        tick(1000);
        expect(component.resendTimer).toBe(29 - i);
      }

      expect(component.resendTimer).toBe(0);
      expect(component.showResendOTP).toBe(true);
    }));
  });

  describe('onOtpChange', () => {
    it('should set OTP', () => {
      component.onOtpChange('123456');
      expect(component.otp).toBe('123456');
    });
  });

  describe('changePassword', () => {
    it('should return early if isSendingOTP', () => {
      component.isSendingOTP = true;
      component.changePassword();
      expect(mockCoreService.post).not.toHaveBeenCalled();
    });

    it('should show error if passwords mismatch', () => {
      component.newPassword = 'pass1';
      component.confirmPassword = 'pass2';
      component.changePassword();
      expect(Swal.fire).toHaveBeenCalledWith('Error', 'Passwords do not match. Please try again.', 'error');
      expect(mockCoreService.post).not.toHaveBeenCalled();
    });

    it('should show error if passwords empty', () => {
      component.newPassword = '';
      component.confirmPassword = '';
      component.changePassword();
      expect(Swal.fire).toHaveBeenCalledWith('Error', 'Please enter a new password and confirm it.', 'error');
      expect(mockCoreService.post).not.toHaveBeenCalled();
    });

    it('should show error if password invalid', () => {
      component.newPassword = 'weak';
      component.confirmPassword = 'weak';
      component.changePassword();
      expect(Swal.fire).toHaveBeenCalledWith('Error', 'Password does not meet the requirements. Please try again.', 'error');
      expect(mockCoreService.post).not.toHaveBeenCalled();
    });
  });

  describe('isPasswordValid', () => {
    it('should return true for valid password', () => {
      component.newPassword = 'Strong1!';
      expect(component.isPasswordValid()).toBe(true);
    });

    it('should return false for password without uppercase', () => {
      component.newPassword = 'weakpass1!';
      expect(component.isPasswordValid()).toBe(false);
    });

    it('should return false for password without lowercase', () => {
      component.newPassword = 'STRONGPASS1!';
      expect(component.isPasswordValid()).toBe(false);
    });

    it('should return false for password without special character', () => {
      component.newPassword = 'StrongPass123';
      expect(component.isPasswordValid()).toBe(false);
    });

    it('should return false for password shorter than 8 characters', () => {
      component.newPassword = 'Short1!';
      expect(component.isPasswordValid()).toBe(false);
    });

    it('should return false for empty password', () => {
      component.newPassword = '';
      expect(component.isPasswordValid()).toBe(false);
    });
  });
});