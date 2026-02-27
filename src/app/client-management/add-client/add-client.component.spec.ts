import { ComponentFixture, TestBed, fakeAsync, flushMicrotasks, tick } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Location } from '@angular/common';

import { AddClientComponent } from './add-client.component';
import { CoreService } from '../../utilities/core.service';
import { NgxImageCompressService } from 'ngx-image-compress';
import { UserDetailService } from 'src/app/auth/user-detail.service';
import { FeatureToggleService } from '../../shared/services/feature-toggle.service';
import { environment, ProjectContext } from '../../../environments/environment';
import { InsightsService } from '../../utilities/insights.service';

// Mock environment
jest.mock('../../../environments/environment', () => ({
  environment: {
    projectConfigs: {
      testContext: { assetsFolder: '/assets/test' }
    }
  }
}));

// Mock services
class MockCoreService {
  post = jest.fn();
  toast = jest.fn();
}

class MockNgxImageCompressService {
  uploadFile = jest.fn().mockResolvedValue({ image: 'mock_image', orientation: 1 });
  compressFile = jest.fn().mockResolvedValue('compressed_image');
}

class MockUserDetailService {
  getcsrfTokenName = jest.fn().mockReturnValue('csrf_name');
  getcsrfToken = jest.fn().mockReturnValue('csrf_token');
}

class MockFeatureToggleService {
  getContext = jest.fn().mockReturnValue('testContext' as ProjectContext);
}

class MockNgbModal {
  open = jest.fn().mockReturnValue({ result: Promise.resolve() });
}

const mockLocation = {
  back: jest.fn()
};

const mockInsightsService = {
  logException: jest.fn(),
};

describe('AddClientComponent', () => {
  let component: AddClientComponent;
  let fixture: ComponentFixture<AddClientComponent>;
  let coreService: MockCoreService;
  let imageCompressService: MockNgxImageCompressService;
  let userDetailService: MockUserDetailService;
  let featureToggleService: MockFeatureToggleService;
  let modalService: MockNgbModal;
  let location: typeof mockLocation;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      declarations: [AddClientComponent],
      providers: [
        FormBuilder,
        { provide: CoreService, useClass: MockCoreService },
        { provide: NgxImageCompressService, useClass: MockNgxImageCompressService },
        { provide: UserDetailService, useClass: MockUserDetailService },
        { provide: FeatureToggleService, useClass: MockFeatureToggleService },
        { provide: NgbModal, useClass: MockNgbModal },
        { provide: Location, useValue: mockLocation },
        { provide: InsightsService, useValue: mockInsightsService }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(AddClientComponent);
    component = fixture.componentInstance;
    coreService = TestBed.inject(CoreService) as unknown as MockCoreService;
    imageCompressService = TestBed.inject(NgxImageCompressService) as unknown as MockNgxImageCompressService;
    userDetailService = TestBed.inject(UserDetailService) as unknown as MockUserDetailService;
    featureToggleService = TestBed.inject(FeatureToggleService) as unknown as MockFeatureToggleService;
    modalService = TestBed.inject(NgbModal) as unknown as MockNgbModal;
    location = TestBed.inject(Location) as unknown as typeof mockLocation;
    mockInsightsService.logException.mockReset();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should call initForm and set csrfTokenName and csrfToken', () => {
      const initFormSpy = jest.spyOn(component, 'initForm');
      component.ngOnInit();
      expect(initFormSpy).toHaveBeenCalled();
      expect(userDetailService.getcsrfTokenName).toHaveBeenCalled();
      expect(userDetailService.getcsrfToken).toHaveBeenCalled();
      expect(component.csrfTokenName).toBe('csrf_name');
      expect(component.csrfToken).toBe('csrf_token');
    });
  });

  describe('initForm', () => {
    it('should initialize regForm with required controls', () => {
      component.ngOnInit();
      expect(component.regForm.contains('name')).toBe(true);
      expect(component.regForm.contains('phone')).toBe(true);
      expect(component.regForm.contains('address')).toBe(true);
      expect(component.regForm.contains('pocname')).toBe(true);
      expect(component.regForm.contains('pocemail')).toBe(true);
      expect(component.regForm.contains('csrf_token')).toBe(true);
      expect(component.regForm.get('csrf_token')?.value).toBe('csrf_token');
    });
  });

  describe('get f', () => {
    it('should return regForm controls', () => {
      component.ngOnInit();
      expect(component.f).toBe(component.regForm.controls);
    });
  });

  describe('createClient', () => {
    beforeEach(() => {
      component.ngOnInit();
    });

    it('should not submit if form is invalid', () => {
      component.submitted = true;
      component.regForm.markAllAsTouched();
      component.createClient();
      expect(coreService.post).not.toHaveBeenCalled();
    });

    it('should submit form and reset on success', async () => {
      component.regForm.setValue({
        name: 'Test Client',
        phone: '1234567890',
        address: 'Test Address',
        pocname: 'Test POC',
        pocemail: 'poc@test.com',
        csrf_token: 'csrf_token'
      });
      component.imgResultAfterCompress = 'compressed_image';
      coreService.post.mockResolvedValue({ status: 1, msg: 'Success' });
      const getClientsSpy = jest.spyOn(component, 'getClients');
      component.createClient();
      await Promise.resolve();
      await Promise.resolve();
      expect(coreService.post).toHaveBeenCalledWith('client', expect.objectContaining({ purpose: 'create' }));
      expect(coreService.toast).toHaveBeenCalledWith('success', 'Success');
      expect(component.regForm.value.name).toBeNull();
      expect(getClientsSpy).toHaveBeenCalled();
      expect(component.imgResultAfterCompress).toBe('');
      expect(component.submitted).toBe(false);
    });

    it('should toast error on failure', async () => {
      component.regForm.setValue({
        name: 'Test Client',
        phone: '1234567890',
        address: 'Test Address',
        pocname: 'Test POC',
        pocemail: 'poc@test.com',
        csrf_token: 'csrf_token'
      });
      coreService.post.mockResolvedValue({ status: 0, msg: 'Error' });
      component.createClient();
      await Promise.resolve();
      await Promise.resolve();
      expect(coreService.toast).toHaveBeenCalledWith('error', 'Error');
    });

    it('should toast specific errors', async () => {
      component.regForm.setValue({
        name: 'Test Client',
        phone: '1234567890',
        address: 'Test Address',
        pocname: 'Test POC',
        pocemail: 'poc@test.com',
        csrf_token: 'csrf_token'
      });
      coreService.post.mockResolvedValue({ name: 'Name error', address: 'Address error', pocemail: 'Email error' });
      component.createClient();
      await Promise.resolve();
      await Promise.resolve();
      expect(coreService.toast).toHaveBeenCalledWith('error', 'Name error');
      expect(coreService.toast).toHaveBeenCalledWith('error', 'Address error');
      expect(coreService.toast).toHaveBeenCalledWith('error', 'Email error');
    });
  });

  describe('back', () => {
    it('should call location.back', () => {
      component.back();
      expect(location.back).toHaveBeenCalled();
    });
  });

  describe('open', () => {
    it('should open modal', () => {
      const content = 'content';
      component.open(content);
      expect(modalService.open).toHaveBeenCalledWith(content, { ariaLabelledBy: 'modal-basic-title' });
    });
  });

  describe('get uf', () => {
    it('should return uploadForm controls', () => {
      expect(component.uf).toBe(component.uploadForm.controls);
    });
  });
});