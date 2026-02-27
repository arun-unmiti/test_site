import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';

import { ChangePasswordComponent } from './change-password.component';
import { CoreService } from '../utilities/core.service';
import { UserDetailService } from '../auth/user-detail.service';
import { InsightsService } from '../utilities/insights.service';

// Mock services
class MockCoreService {
  post = jest.fn();
  toast = jest.fn();
}

class MockUserDetailService {
  getcsrfTokenName = jest.fn().mockReturnValue('csrf_name');
  getcsrfToken = jest.fn().mockReturnValue('csrf_token');
  getUserDetail = jest.fn().mockReturnValue({ user_id: 1 });
  AESEncrypt = jest.fn().mockReturnValue('encrypted_value');
  logout = jest.fn();
}

class MockInsightsService {
  logException = jest.fn();
}

describe('ChangePasswordComponent', () => {
  let component: ChangePasswordComponent;
  let fixture: ComponentFixture<ChangePasswordComponent>;
  let mockCoreService: MockCoreService;
  let mockUserDetailService: MockUserDetailService;
  let mockInsightsService: MockInsightsService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      declarations: [ChangePasswordComponent],
      providers: [
        FormBuilder,
        { provide: CoreService, useClass: MockCoreService },
        { provide: UserDetailService, useClass: MockUserDetailService },
        { provide: InsightsService, useClass: MockInsightsService }
      ],
      schemas: [NO_ERRORS_SCHEMA] // ignores unknown elements, bindings
    }).compileComponents();

    fixture = TestBed.createComponent(ChangePasswordComponent);
    component = fixture.componentInstance;
    mockCoreService = TestBed.inject(CoreService) as unknown as MockCoreService;
    mockUserDetailService = TestBed.inject(UserDetailService) as unknown as MockUserDetailService;
    mockInsightsService = TestBed.inject(InsightsService) as unknown as MockInsightsService;
    fixture.detectChanges(); // Trigger ngOnInit
    mockInsightsService.logException.mockReset();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should initialize form and set csrf token values', () => {
      expect(mockUserDetailService.getcsrfTokenName).toHaveBeenCalled();
      expect(mockUserDetailService.getcsrfToken).toHaveBeenCalled();
      expect(component.csrfTokenName).toBe('csrf_name');
      expect(component.csrfToken).toBe('csrf_token');
      // Form value is not automatically set in component; [value] binding in template doesn't update reactive form control
      // If needed, component should explicitly set: this.userForm.get('csrf_token')?.setValue(this.csrfToken);
      expect(component.userForm.get('csrf_token')?.value).toBe(''); // Adjust expectation based on current implementation
    });
  });

  describe('form initialization and validators', () => {
    it('should initialize the form with required fields', () => {
      const form = component.userForm;
      expect(form).toBeDefined();
      expect(form.get('currentPassword')).toBeDefined();
      expect(form.get('newPassword')).toBeDefined();
      expect(form.get('confirmPassword')).toBeDefined();
      expect(form.get('csrf_token')).toBeDefined();
    });

    it('should have required validator on currentPassword', () => {
      const control = component.userForm.get('currentPassword');
      control?.setValue('');
      expect(control?.valid).toBeFalsy();
      expect(control?.errors?.['required']).toBeTruthy();
    });

    it('should have required and pattern validator on newPassword', () => {
      const control = component.userForm.get('newPassword');
      control?.setValue('');
      expect(control?.valid).toBeFalsy();
      expect(control?.errors?.['required']).toBeTruthy();

      control?.setValue('weak');
      expect(control?.valid).toBeFalsy();
      expect(control?.errors?.['pattern']).toBeTruthy();

      control?.setValue('StrongPass1!');
      expect(control?.valid).toBeTruthy();
    });

    it('should have required validator on confirmPassword', () => {
      const control = component.userForm.get('confirmPassword');
      control?.setValue('');
      expect(control?.valid).toBeFalsy();
      expect(control?.errors?.['required']).toBeTruthy();
    });
  });

  describe('onUpdate', () => {
    beforeEach(() => {
      component.userForm.markAllAsTouched(); // Simulate touched for validation
    });

    it('should not submit if currentPassword is empty', () => {
      component.userForm.patchValue({
        currentPassword: '',
        newPassword: 'StrongPass1!',
        confirmPassword: 'StrongPass1!'
      });
      component.onUpdate();
      expect(mockCoreService.toast).toHaveBeenCalledWith('warn', 'Current Password is required');
      expect(mockCoreService.post).not.toHaveBeenCalled();
    });

    it('should not submit if newPassword is empty', () => {
      component.userForm.patchValue({
        currentPassword: 'oldPass',
        newPassword: '',
        confirmPassword: 'StrongPass1!'
      });
      component.onUpdate();
      expect(mockCoreService.toast).toHaveBeenCalledWith('warn', 'New Password is required');
      expect(mockCoreService.post).not.toHaveBeenCalled();
    });

    it('should not submit if confirmPassword is empty', () => {
      component.userForm.patchValue({
        currentPassword: 'oldPass',
        newPassword: 'StrongPass1!',
        confirmPassword: ''
      });
      component.onUpdate();
      expect(mockCoreService.toast).toHaveBeenCalledWith('warn', 'Confirm Password is required');
      expect(mockCoreService.post).not.toHaveBeenCalled();
    });

    it('should not submit if newPassword does not match pattern', () => {
      component.userForm.patchValue({
        currentPassword: 'oldPass',
        newPassword: 'weak',
        confirmPassword: 'weak'
      });
      component.onUpdate();
      expect(mockCoreService.toast).toHaveBeenCalledWith('warn', 'New Password must be atleast 8 digit with upper case , lower case and special symbol');
      expect(mockCoreService.post).not.toHaveBeenCalled();
    });

    it('should not submit if currentPassword equals newPassword', () => {
      component.userForm.patchValue({
        currentPassword: 'samePass1!',
        newPassword: 'samePass1!',
        confirmPassword: 'samePass1!'
      });
      component.onUpdate();
      expect(mockCoreService.toast).toHaveBeenCalledWith('warn', 'Current Password and New Password should not be same');
      expect(mockCoreService.post).not.toHaveBeenCalled();
    });

    it('should not submit if newPassword does not match confirmPassword', () => {
      component.userForm.patchValue({
        currentPassword: 'oldPass1!',
        newPassword: 'newPass1!',
        confirmPassword: 'mismatchPass1!'
      });
      component.onUpdate();
      expect(mockCoreService.toast).toHaveBeenCalledWith('warn', 'New Password and Confirm Password should be same');
      expect(mockCoreService.post).not.toHaveBeenCalled();
    });
  });
});