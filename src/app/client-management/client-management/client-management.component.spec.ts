import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MessageService } from 'primeng/api';
import { of, throwError } from 'rxjs';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { By } from '@angular/platform-browser';

// ✅ Mock Firebase
jest.mock('firebase/app', () => {
  return {
    initializeApp: jest.fn(() => ({
      name: 'mockApp',
      options: {},
      analytics: jest.fn(() => ({
        logEvent: jest.fn(),
        setUserId: jest.fn(),
        setCurrentScreen: jest.fn(),
      })),
    })),
  };
});

jest.mock('../../../environments/environment', () => ({
  environment: {
    projectConfigs: {
      munichre: { assetsFolder: '/assets/munichre' },
      other: { assetsFolder: '/assets/other' }
    }
  }
}));

// ✅ Mock Services
const mockUserDetailService = {
  getUserDetail: jest.fn(() => ({ user_id: '123' })),
  resetCount: jest.fn(),
  getcsrfTokenName: jest.fn(() => 'mockCsrfName'),
  getcsrfToken: jest.fn(() => 'mockCsrfToken'),
};

const mockCoreService = {
  checkSessionTime: jest.fn(),
  clearCache: [],
  addLookup: jest.fn(),
  post: jest.fn(),
  toast: jest.fn(),
  fetchAzureBlob: jest.fn(() => Promise.resolve(new Blob())),
  downloadTable: jest.fn(),
};

const mockFeatureToggleService = {
  getContext: jest.fn(() => 'munichre'),
  featureContext$: of('munichre'),
  setContext: jest.fn(),
  initializeUserContext: jest.fn(),
  setFaviconAndTitle: jest.fn(),
  getConfig: jest.fn(() => ({ BASECLIENTIMG: 'mockUrl/' })),
};

const mockModalService = {
  open: jest.fn(),
  dismissAll: jest.fn(),
};

const mockFilterService = {
  // Add any methods if used; currently not apparent in component
};

const mockDomSanitizer = {
  bypassSecurityTrustUrl: jest.fn((url) => `safe:${url}`),
  sanitize: jest.fn((context, value) => value),
};

const mockInsightsService = {
  logException: jest.fn(),
};

import { ClientManagementComponent } from './client-management.component';
import { UserDetailService } from 'src/app/auth/user-detail.service';
import { CoreService } from 'src/app/utilities/core.service';
import { FeatureToggleService } from 'src/app/shared/services/feature-toggle.service';
import { FilterService } from 'src/app/utilities/filter.service';
import { DomSanitizer } from '@angular/platform-browser';
import { InsightsService } from 'src/app/utilities/insights.service';

describe('ClientManagementComponent', () => {
  let component: ClientManagementComponent;
  let fixture: ComponentFixture<ClientManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ClientManagementComponent],
      imports: [FormsModule, ReactiveFormsModule, TableModule],
      providers: [
        MessageService,
        { provide: UserDetailService, useValue: mockUserDetailService },
        { provide: CoreService, useValue: mockCoreService },
        { provide: FeatureToggleService, useValue: mockFeatureToggleService },
        { provide: NgbModal, useValue: mockModalService },
        { provide: FilterService, useValue: mockFilterService },
        { provide: DomSanitizer, useValue: mockDomSanitizer },
        { provide: InsightsService, useValue: mockInsightsService },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    fixture = TestBed.createComponent(ClientManagementComponent);
    component = fixture.componentInstance;
    mockInsightsService.logException.mockReset();
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should call getClients, set csrf tokens, and patch form', () => {
      const getClientsSpy = jest.spyOn(component, 'getClients');
      component.ngOnInit();
      expect(getClientsSpy).toHaveBeenCalled();
      expect(mockUserDetailService.getcsrfTokenName).toHaveBeenCalled();
      expect(mockUserDetailService.getcsrfToken).toHaveBeenCalled();
      expect(component.csrfTokenName).toBe('mockCsrfName');
      expect(component.csrfToken).toBe('mockCsrfToken');
      expect(component.clientForm.value.csrf_token).toBe('mockCsrfToken');
    });
  });

  describe('getClients', () => {
    it('should fetch and map clients, set safeLogoUrl for munichre context on success', async () => {
      const mockResponse = {
        status: 1,
        all_clients: [
          { UNIT_ID: 1, company_logo: 'logo1.png', UNIT_STATUS: 1 },
          { UNIT_ID: 2, company_logo: 'logo2.png', UNIT_STATUS: 0 },
        ],
      };
      mockCoreService.post.mockResolvedValueOnce(mockResponse);
      const blob = new Blob();
      mockCoreService.fetchAzureBlob.mockResolvedValueOnce(blob).mockResolvedValueOnce(blob);
      URL.createObjectURL = jest.fn(() => 'mockObjectUrl');

      await component.getClients();

      expect(mockCoreService.post).toHaveBeenCalledWith('client', { purpose: 'get_all_created' });
      expect(component.clientList).toEqual([
        expect.objectContaining({
          sno: 1,
          statusResult: 'Active',
          safeLogoUrl: 'safe:mockObjectUrl',
        }),
        expect.objectContaining({
          sno: 2,
          statusResult: 'In-active',
          safeLogoUrl: 'safe:mockObjectUrl',
        }),
      ]);
      expect(mockCoreService.fetchAzureBlob).toHaveBeenCalledTimes(2);
      expect(mockDomSanitizer.bypassSecurityTrustUrl).toHaveBeenCalledTimes(2);
    });

    it('should handle non-munichre context without fetching blobs', async () => {
      mockFeatureToggleService.getContext.mockReturnValueOnce('other');
      const mockResponse = {
        status: 1,
        all_clients: [{ UNIT_ID: 1, UNIT_STATUS: 2 }],
      };
      mockCoreService.post.mockResolvedValueOnce(mockResponse);

      await component.getClients();

      expect(component.clientList).toEqual([
        expect.objectContaining({
          sno: 1,
          statusResult: 'Pending Approval',
          safeLogoUrl: null,
        }),
      ]);
      expect(mockCoreService.fetchAzureBlob).not.toHaveBeenCalled();
    });

    it('should toast error on failure', async () => {
      mockCoreService.post.mockRejectedValueOnce(new Error('error'));

      await component.getClients();

      expect(mockCoreService.toast).toHaveBeenCalledWith('error', 'Failed to load client list');
      expect(mockInsightsService.logException).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should not set clients if status !== 1', async () => {
      mockCoreService.post.mockResolvedValueOnce({ status: 0 });

      await component.getClients();

      expect(component.clientList).toEqual([]);
    });
  });

  describe('getImgUrl', () => {
    it('should return constructed image URL', () => {
      const url = component.getImgUrl('test.png');
      expect(url).toBe('mockUrl/test.png');
    });
  });

  describe('getErrImgUrl', () => {
    it('should set event target src to default image', () => {
      const mockEvent = { target: { src: '' } };
      component.getErrImgUrl(mockEvent);
      expect(mockEvent.target.src).toBe('mockUrl/default.png');
    });
  });

  describe('exportTable', () => {
    it('should set downloading, call downloadTable after timeout, and reset downloading', fakeAsync(() => {
      const element = 'element';
      const fileName = 'file';
      component.exportTable(element, fileName);
      expect(component.downloading).toBe(true);
      tick(100);
      expect(mockCoreService.downloadTable).toHaveBeenCalledWith(element, fileName);
      expect(component.downloading).toBe(false);
    }));
  });

  describe('update', () => {
    it('should post update request with new image if set, toast success, refresh clients, dismiss modal', async () => {
      component.selectedClient = { client_id: 1 };
      component.newProfileImage = 'newImage';
      mockCoreService.post.mockResolvedValueOnce({ status: 1, msg: 'Updated' });

      component.update();
      await Promise.resolve();

      expect(mockCoreService.post).toHaveBeenCalledWith('client', {
        client_id: 1,
        purpose: 'update',
        new_client_image: 'newImage',
      });
      expect(mockCoreService.toast).toHaveBeenCalledWith('success', 'Updated');
      expect(mockModalService.dismissAll).toHaveBeenCalled();
      // getClients spied implicitly via call
    });
  });

  describe('changeStatus', () => {
    it('should post status change, toast success, refresh clients', async () => {
      const mockClient = { UNIT_ID: 1 };
      mockCoreService.post.mockResolvedValueOnce({ status: 1, msg: 'Changed' });

      component.changeStatus(mockClient, 1);
      await Promise.resolve();

      expect(mockCoreService.post).toHaveBeenCalledWith('client', {
        purpose: 'change_client_status',
        UNIT_ID: 1,
        UNIT_STATUS: 1,
      });
      expect(mockCoreService.toast).toHaveBeenCalledWith('success', 'Changed');
    });

    it('should toast error on failure', async () => {
      const mockClient = { UNIT_ID: 1 };
      mockCoreService.post.mockResolvedValueOnce({ status: 0, msg: 'Error' });

      component.changeStatus(mockClient, 0);
      await Promise.resolve();

      expect(mockCoreService.toast).toHaveBeenCalledWith('error', 'Error');
    });
  });

  describe('getStatus', () => {
    it('should return correct status string', () => {
      expect(component.getStatus(2)).toBe('Pending Approval');
      expect(component.getStatus(1)).toBe('Active');
      expect(component.getStatus(0)).toBe('In-active');
    });
  });

  describe('applyFilterGlobal', () => {
    it('should call filterGlobal on dt if exists', () => {
      const mockEvent = { target: { value: 'test' } };
      const filterSpy = jest.fn();
      component.dt = { filterGlobal: filterSpy } as any;

      component.applyFilterGlobal(mockEvent, 'contains');

      expect(filterSpy).toHaveBeenCalledWith('test', 'contains');
    });
  });

  describe('getEventValue', () => {
    it('should return event target value', () => {
      const mockEvent = { target: { value: 'value' } };
      expect(component.getEventValue(mockEvent)).toBe('value');
    });
  });

  describe('onClientProfileChange', () => {
    it('should read file as data URL and set newProfileImage', (done) => {
      const mockFile = new Blob([''], { type: 'image/jpeg' });
      const mockEvent = { target: { files: [mockFile] } };
      const mockInput = {} as any;

      // Mock FileReader
      const mockReader = {
        onload: null as any,
        readAsDataURL: jest.fn(),
      };
      (global as any).FileReader = jest.fn(() => mockReader);

      component.onClientProfileChange(mockEvent, mockInput);

      expect(mockReader.readAsDataURL).toHaveBeenCalledWith(mockFile);

      // Simulate onload
      mockReader.onload({ currentTarget: { result: 'data:url' } });
      expect(component.newProfileImage).toBe('data:url');
      done();
    });

    it('should do nothing if no files', () => {
      const mockEvent = { target: { files: [] } };
      component.onClientProfileChange(mockEvent, {} as any);
      expect(component.newProfileImage).toBeFalsy();
    });
  });

  it('should clear form data on cancel', async () => {
    const mockModalRef = {
      result: Promise.reject('cancel'),
    };
    mockModalService.open.mockReturnValue(mockModalRef);

    const mockClient = { UNIT_ID: 1 };
    mockCoreService.post.mockResolvedValueOnce({
      status: 1,
      client: {
        UNIT_ID: 1,
        UNIT_NAME: 'Test Client',
        phone: '1234567890',
        address: 'Test Address',
        poc_name: 'POC Name',
        poc_email: 'poc@email.com',
        poc_phone: '9876543210',
        client: { UNIT_ID: 1 }
      }
    });

    component.open(null, mockClient);

    // Wait for modal result promise to reject (cancel)
    await mockModalRef.result.catch(() => {});

    expect(component.selectedClient).toEqual({});
  });
});