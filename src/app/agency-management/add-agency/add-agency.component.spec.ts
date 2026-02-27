// src/app/agency-management/add-agency/add-agency.component.spec.ts

import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { NO_ERRORS_SCHEMA } from '@angular/core';

import { AddAgencyComponent } from './add-agency.component';
import { CoreService } from '../../utilities/core.service';
import { UserDetailService } from '../../auth/user-detail.service';
import { FeatureToggleService } from '../../shared/services/feature-toggle.service';
import { FilterService } from '../../utilities/filter.service';
import { Location } from '@angular/common';
import { InsightsService } from '../../utilities/insights.service';

// Mock services
const mockCoreService = {
  post: jest.fn(),
  toast: jest.fn(),
};

const mockUserDetailService = {
  getUserDetail: jest.fn(() => ({ unit_id: '123', user_role: 1 })),
  getcsrfTokenName: jest.fn(() => 'csrf_token'),
  getcsrfToken: jest.fn(() => 'csrf_token_value'),
};

const mockFeatureToggleService = {
  getContext: jest.fn(() => 'munichre'),
};

const mockLocation = {
  back: jest.fn(),
};

const mockFilterService = {};

const mockInsightsService = {
  logException: jest.fn(),
};

describe('AddAgencyComponent', () => {
  let component: AddAgencyComponent;
  let fixture: ComponentFixture<AddAgencyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      declarations: [AddAgencyComponent],
      providers: [
        FormBuilder,
        { provide: CoreService, useValue: mockCoreService },
        { provide: UserDetailService, useValue: mockUserDetailService },
        { provide: FeatureToggleService, useValue: mockFeatureToggleService },
        { provide: FilterService, useValue: mockFilterService },
        { provide: Location, useValue: mockLocation },
        { provide: InsightsService, useValue: mockInsightsService },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(AddAgencyComponent);
    component = fixture.componentInstance;

    mockCoreService.post.mockReset();
    mockCoreService.toast.mockReset();
    mockFeatureToggleService.getContext.mockReset();
    mockFeatureToggleService.getContext.mockReturnValue('munichre');
    mockUserDetailService.getUserDetail.mockReset();
    mockUserDetailService.getUserDetail.mockReturnValue({ unit_id: '123', user_role: 1 });
    mockUserDetailService.getcsrfTokenName.mockReset();
    mockUserDetailService.getcsrfTokenName.mockReturnValue('csrf_token');
    mockUserDetailService.getcsrfToken.mockReset();
    mockUserDetailService.getcsrfToken.mockReturnValue('csrf_token_value');
    mockLocation.back.mockReset();
    mockInsightsService.logException.mockReset();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should initialize form and fetch clients', async () => {
      const mockClients = [{ UNIT_ID: 1, UNIT_NAME: 'Client1', UNIT_STATUS: 1 }];
      mockCoreService.post.mockResolvedValueOnce({ status: 1, all_clients: mockClients });

      component.ngOnInit();
      await fixture.whenStable();

      expect(component.regForm).toBeDefined();
      expect(component.userDetails).toEqual({ unit_id: '123', user_role: 1 });
      expect(component.projectContext).toBe('munichre');
      expect(mockCoreService.post).toHaveBeenCalledWith('client', { purpose: 'get_all_created' });
    });

    it('should set default client value based on projectContext', async () => {
      mockFeatureToggleService.getContext.mockReturnValue('saksham');
      mockCoreService.post.mockResolvedValueOnce({ status: 1, all_clients: [] });

      component.ngOnInit();
      await fixture.whenStable();

      expect(component.regForm.get('client')?.value).toBe('2000');
    });

    it('should filter active clients', async () => {
      const mockClients = [
        { UNIT_ID: 1, UNIT_NAME: 'Active', UNIT_STATUS: 1 },
        { UNIT_ID: 2, UNIT_NAME: 'Inactive', UNIT_STATUS: 0 },
      ];
      mockCoreService.post.mockResolvedValueOnce({ status: 1, all_clients: mockClients });

      component.ngOnInit();
      await fixture.whenStable();

      expect(component.clients).toEqual([mockClients[0]]);
    });
  });

  describe('Form Validation', () => {
    beforeEach(async () => {
      mockCoreService.post.mockResolvedValueOnce({ status: 1, all_clients: [] });
      component.ngOnInit();
      await fixture.whenStable();
    });

    it('should have required fields invalid initially', () => {
      expect(component.regForm.valid).toBeFalsy();
      expect(component.f.name.errors?.required).toBeTruthy();
      expect(component.f.phone.errors?.required).toBeTruthy();
      expect(component.f.address.errors?.required).toBeTruthy();
      expect(component.f.pocname.errors?.required).toBeTruthy();
      expect(component.f.pocemail.errors?.required).toBeTruthy();
    });

    it('should validate phone field', () => {
      const phoneControl = component.regForm.get('phone');
      phoneControl?.setValue('123');
      expect(phoneControl?.errors?.minlength).toBeTruthy();
      phoneControl?.setValue('abc1234567');
      expect(phoneControl?.errors?.pattern).toBeTruthy();
      phoneControl?.setValue('1234567890');
      expect(phoneControl?.valid).toBeTruthy();
    });

    it('should validate email field', () => {
      const emailControl = component.regForm.get('pocemail');
      emailControl?.setValue('invalid');
      expect(emailControl?.errors?.email).toBeTruthy();
      emailControl?.setValue('test@example.com');
      expect(emailControl?.valid).toBeTruthy();
    });
  });

  describe('onFileSelected', () => {
    beforeEach(async () => {
      mockCoreService.post.mockResolvedValueOnce({ status: 1, all_clients: [] });
      component.ngOnInit();
      await fixture.whenStable();
    });

    it('should set fileName and uploadedFile for valid file', fakeAsync(() => {
      const mockFile = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      Object.defineProperty(mockFile, 'size', { value: 1024 * 1024 * 2 }); // 2MB < 4MB

      const event = { target: { files: [mockFile] } };
      const fileUpload = { value: '' };

      // Improved FileReader mock with async onload
      jest.spyOn(window, 'FileReader').mockImplementation(() => {
        const reader: any = {
          result: null,
          onload: null,
          readAsDataURL: jest.fn().mockImplementation(function (this: any, file: File) {
            setTimeout(() => {
              this.result = 'data:application/pdf;base64,Y29udGVudA==';
              if (this.onload) this.onload({ target: { result: this.result } });
            }, 0);
          }),
          onerror: null
        };
        return reader;
      });

      component.onFileSelected(event, fileUpload);
      tick(100); // Allow setTimeout(0) to execute

      expect(component.fileName).toBe('test.pdf');
      expect(component.uploadedFile).toContain('data:application/pdf;base64');
    }));

    it('should not set file if size exceeds limit', () => {
      const mockFile = new File(['content'], 'large.pdf', { type: 'application/pdf' });
      Object.defineProperty(mockFile, 'size', { value: 1024 * 1024 * 5 }); // 5MB > 4MB
      const event = { target: { files: [mockFile] } };
      const fileUpload = { value: '' };

      component.onFileSelected(event, fileUpload);

      expect(component.fileName).toBeUndefined();
      expect(component.uploadedFile).toBeUndefined();
      expect(mockCoreService.toast).toHaveBeenCalledWith('warn', 'File size should not exceed 4MB');
    });

    it('should ignore if no file selected', () => {
      const event = { target: { files: [] } };
      const fileUpload = { value: '' };

      component.onFileSelected(event, fileUpload);

      expect(component.fileName).toBeUndefined();
      expect(component.uploadedFile).toBeUndefined();
    });
  });

  describe('createClient', () => {
    beforeEach(async () => {
      mockCoreService.post.mockResolvedValueOnce({ status: 1, all_clients: [] });
      component.ngOnInit();
      await fixture.whenStable();
      mockCoreService.post.mockClear();
    });

    it('should not submit if form is invalid', () => {
      component.submitted = false;
      component.createClient();

      expect(component.submitted).toBeTruthy();
      expect(mockCoreService.post).toHaveBeenCalledTimes(0);
    });

    it('should submit form and reset on success', async () => {
      component.regForm.patchValue({
        name: 'Agency',
        phone: '1234567890',
        address: 'Address',
        client: '1',
        pocname: 'POC',
        pocemail: 'poc@example.com',
      });
      mockCoreService.post.mockResolvedValueOnce({ status: 1, msg: 'Success' });

      component.createClient();
      await fixture.whenStable();

      expect(mockCoreService.post).toHaveBeenCalledTimes(1);
      expect(mockCoreService.post).toHaveBeenCalledWith('agency', expect.objectContaining({
        purpose: 'create',
        name: 'Agency',
        phone: '1234567890',
      }));
      expect(mockCoreService.toast).toHaveBeenCalledWith('success', 'Success');
      expect(component.submitted).toBeFalsy();
      expect(component.regForm.pristine).toBeTruthy();
    });

    it('should handle error responses', async () => {
      component.regForm.patchValue({
        name: 'Agency',
        phone: '1234567890',
        address: 'Address',
        client: '1',
        pocname: 'POC',
        pocemail: 'poc@example.com',
      });
      mockCoreService.post.mockResolvedValueOnce({ status: 0, msg: 'Error' });

      component.createClient();
      await fixture.whenStable();

      expect(mockCoreService.post).toHaveBeenCalledTimes(1);
      expect(mockCoreService.toast).toHaveBeenCalledWith('error', 'Error');
    });

    it('should trim name before submission', async () => {
      component.regForm.patchValue({
        name: '  Agency  ',
        phone: '1234567890',
        address: 'Address',
        client: '1',
        pocname: 'POC',
        pocemail: 'poc@example.com',
      });
      mockCoreService.post.mockResolvedValueOnce({ status: 1, msg: 'Success' });

      component.createClient();
      await fixture.whenStable();

      expect(mockCoreService.post).toHaveBeenCalledWith('agency', expect.objectContaining({ name: 'Agency' }));
    });
  });

  describe('back', () => {
    it('should call location.back', () => {
      component.back();
      expect(mockLocation.back).toHaveBeenCalled();
    });
  });
});