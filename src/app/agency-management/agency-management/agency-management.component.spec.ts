import { ComponentFixture, TestBed, fakeAsync, flush } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MessageService } from 'primeng/api';
import { of } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DomSanitizer, SafeUrl, SafeResourceUrl, SafeHtml } from '@angular/platform-browser';

import { AgencyManagementComponent } from './agency-management.component';
import { UserDetailService } from 'src/app/auth/user-detail.service';
import { CoreService } from 'src/app/utilities/core.service';
import { FeatureToggleService } from 'src/app/shared/services/feature-toggle.service';
import { FilterService } from 'src/app/utilities/filter.service';
import { InsightsService } from 'src/app/utilities/insights.service';

// Mock Firebase (keep if used somewhere in app)
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({ analytics: jest.fn() })),
}));

describe('AgencyManagementComponent', () => {
  let component: AgencyManagementComponent;
  let fixture: ComponentFixture<AgencyManagementComponent>;

  // Mocks
  const mockUserDetailService = {
    getUserDetail: jest.fn(),
  };

  const mockCoreService = {
    post: jest.fn(),
    toast: jest.fn(),
    exportExcel: jest.fn(),
    fetchAzureBlob: jest.fn().mockResolvedValue(new Blob()),
  };

  const mockFilterService: any = {
    isDataFetched: false,
    clients: [],
    fetchedLookupData: of({}),
  };

  const mockFeatureToggleService = {
    getContext: jest.fn().mockReturnValue('munichre'),
    getConfig: jest.fn().mockReturnValue({
      BASEAGENCY: 'https://mock/',
      BASEAGENCYSUFFIX: '?t=abc',
    }),
  };

  const mockModalService = {
    open: jest.fn().mockReturnValue({ result: Promise.resolve() }),
    dismissAll: jest.fn(),
  };

  const mockSanitizer = {
    bypassSecurityTrustUrl: jest.fn(v => v),
    sanitize: jest.fn((context, value) => value),
  };

  const mockInsightsService = {
    logException: jest.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AgencyManagementComponent],
      imports: [FormsModule, TableModule],
      providers: [
        { provide: UserDetailService, useValue: mockUserDetailService },
        { provide: CoreService, useValue: mockCoreService },
        { provide: FeatureToggleService, useValue: mockFeatureToggleService },
        { provide: FilterService, useValue: mockFilterService },
        { provide: NgbModal, useValue: mockModalService },
        { provide: DomSanitizer, useValue: mockSanitizer },
        { provide: InsightsService, useValue: mockInsightsService },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(AgencyManagementComponent);
    component = fixture.componentInstance;
    mockInsightsService.logException.mockReset();
  });

  afterEach(() => {
    jest.clearAllMocks();
    mockFilterService.isDataFetched = false;
    mockFilterService.clients = [];
  });

  it('should create the component', fakeAsync(() => {
    mockUserDetailService.getUserDetail.mockReturnValue({ unit_id: '123' });
    mockCoreService.post.mockResolvedValue({ status: 1, all_agencies: [] });

    fixture.detectChanges(); // calls ngOnInit
    flush();

    expect(component).toBeTruthy();
  }));

  describe('ngOnInit', () => {
    it('should call getUserDetail and getAgencies', fakeAsync(() => {
      const spy = jest.spyOn(component, 'getAgencies');
      mockUserDetailService.getUserDetail.mockReturnValue({ unit_id: '123' });
      mockCoreService.post.mockResolvedValue({ status: 1, all_agencies: [] });

      component.ngOnInit();
      flush();

      expect(mockUserDetailService.getUserDetail).toHaveBeenCalled();
      expect(spy).toHaveBeenCalled();
    }));

    it('should subscribe to fetchedLookupData when isDataFetched = false', () => {
      const subscribeSpy = jest.spyOn(mockFilterService.fetchedLookupData, 'subscribe');
      mockUserDetailService.getUserDetail.mockReturnValue({ unit_id: '123' });

      mockFilterService.isDataFetched = false;
      component.ngOnInit();

      expect(subscribeSpy).toHaveBeenCalled();
    });
  });

  describe('getAgencies', () => {
    it('should load agencies for munichre context', async () => {
      component.projectContext = 'munichre';
      component.userDetails = { unit_id: '123' };

      mockCoreService.post.mockResolvedValue({
        status: 1,
        all_agencies: [{ agency_id: 10, agency_name: 'A1', status: 1, client: { UNIT_NAME: 'C1' } }],
      });

      component.getAgencies();
      await fixture.whenStable();
      await new Promise(resolve => setTimeout(resolve));

      expect(mockCoreService.post).toHaveBeenCalledWith('agency', {
        purpose: 'get_all_created',
        client_id: '123',
      });
      expect(component.agencyList[0].clientName).toBe('C1');
      expect(component.loader).toBe(0);
    });

    it('should load agencies for saksham context with client_id 2000', async () => {
      component.projectContext = 'saksham';
      component.userDetails = {};

      mockCoreService.post.mockResolvedValue({
        status: 1,
        all_agencies: [{ agency_id: 20, agency_name: 'A2', status: 1 }],
      });

      component.getAgencies();
      await fixture.whenStable();
      await new Promise(resolve => setTimeout(resolve));

      expect(mockCoreService.post).toHaveBeenCalledWith('agency', {
        purpose: 'get_all_created',
        client_id: '2000',
      });
      expect(component.loader).toBe(0);
    });

    it('should clear list and stop loader on status 0', async () => {
      component.projectContext = 'munichre';
      component.userDetails = { unit_id: '123' };
      mockCoreService.post.mockResolvedValue({ status: 0 });

      component.getAgencies();
      await fixture.whenStable();
      await new Promise(resolve => setTimeout(resolve));

      expect(component.agencyList).toEqual([]);
      expect(component.loader).toBe(0);
    });

    it('should handle error and clear list', async () => {
      component.projectContext = 'munichre';
      component.userDetails = { unit_id: '123' };
      mockCoreService.post.mockRejectedValue(new Error('API error'));

      component.getAgencies();
      await fixture.whenStable();
      await new Promise(resolve => setTimeout(resolve));

      expect(component.agencyList).toEqual([]);
      expect(component.loader).toBe(0);
      expect(mockInsightsService.logException).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('open', () => {
    it('should load agency details and open modal', async () => {
      const content = {};
      const agency = { agency_id: 7 };

      mockCoreService.post.mockResolvedValue({
        status: 1,
        agency: {
          agency_id: 7,
          agency_name: 'Demo',
          phone: '555',
          address: 'Street',
          poc_name: 'John',
          poc_email: 'j@ex.com',
          poc_phone: '666',
          client: { UNIT_ID: 300 },
        },
      });

      component.open(content, agency);
      await fixture.whenStable();
      await new Promise(resolve => setTimeout(resolve));

      expect(component.selectedAgency).toMatchObject({
        agency_id: 7,
        name: 'Demo',
        phone: '555',
        address: 'Street',
        pocname: 'John',
        pocemail: 'j@ex.com',
        pocphone: '666',
        client: 300,
      });
      expect(component.loader).toBe(0);
      expect(mockModalService.open).toHaveBeenCalled();
    });

    it('should reset loader on error', async () => {
      mockCoreService.post.mockResolvedValue({ status: 0 });

      component.open({}, { agency_id: 99 });
      await fixture.whenStable();
      await new Promise(resolve => setTimeout(resolve));

      expect(component.selectedAgency).toEqual({});
      expect(component.loader).toBe(0);
    });
  });

  describe('exportTable', () => {
    it('should include Client column for munichre', () => {
      component.projectContext = 'munichre';

      const data = [{ sno: 1, agency_name: 'A', clientName: 'C', address: 'Addr', phone: '1', poc_name: 'P', poc_email: 'p@e.com', statusName: 'Active' }];

      component.exportTable(data, 'file1');

      expect(mockCoreService.exportExcel).toHaveBeenCalledWith(
        data,
        expect.arrayContaining([{ field: 'clientName', header: 'Client' }]),
        'file1'
      );
    });

    it('should exclude Client column for saksham', () => {
      component.projectContext = 'saksham';

      const data = [{ sno: 1, agency_name: 'A', address: 'Addr', phone: '1', poc_name: 'P', poc_email: 'p@e.com', statusName: 'Active' }];

      component.exportTable(data, 'file2');

      const fields = (mockCoreService.exportExcel as jest.Mock).mock.calls[0][1] as Array<{ field: string; header: string }>;
      expect(fields.some(f => f.field === 'clientName')).toBe(false);
    });
  });

  describe('update', () => {
    it('should send update request and refresh list on success', async () => {
      component.selectedAgency = { agency_id: 42, name: 'X' };
      const spy = jest.spyOn(component, 'getAgencies');
      mockCoreService.post.mockResolvedValueOnce({ status: 1, msg: 'Agency updated successfully' });
      mockCoreService.post.mockResolvedValueOnce({ status: 1, all_agencies: [] });

      component.update();
      await fixture.whenStable();
      await new Promise(resolve => setTimeout(resolve));

      expect(mockCoreService.post).toHaveBeenCalledWith('agency', expect.objectContaining({ purpose: 'update' }));
      expect(mockCoreService.toast).toHaveBeenCalledWith('success', 'Agency updated successfully');
      expect(spy).toHaveBeenCalled();
      expect(mockModalService.dismissAll).toHaveBeenCalled();
      expect(component.loader).toBe(0);
    });

    it('should only stop loader on failure', async () => {
      mockCoreService.post.mockResolvedValue({ status: 0 });

      component.update();
      await fixture.whenStable();
      await new Promise(resolve => setTimeout(resolve));

      expect(component.loader).toBe(0);
      expect(mockModalService.dismissAll).not.toHaveBeenCalled();
    });
  });

  describe('changeStatus', () => {
    it('should change status and refresh on success', async () => {
      const spy = jest.spyOn(component, 'getAgencies');
      mockCoreService.post.mockResolvedValueOnce({ status: 1, msg: 'Status changed successfully' });
      mockCoreService.post.mockResolvedValueOnce({ status: 1, all_agencies: [] });

      component.changeStatus({ agency_id: 15 }, 1);
      await fixture.whenStable();
      await new Promise(resolve => setTimeout(resolve));

      expect(mockCoreService.toast).toHaveBeenCalledWith('success', 'Status changed successfully');
      expect(spy).toHaveBeenCalled();
      expect(component.loader).toBe(0);
    });

    it('should show error toast on failure', async () => {
      mockCoreService.post.mockResolvedValue({ status: 0, msg: 'Error occurred' });

      component.changeStatus({ agency_id: 99 }, 1);
      await fixture.whenStable();
      await new Promise(resolve => setTimeout(resolve));

      expect(mockCoreService.toast).toHaveBeenCalledWith('error', 'Error occurred');
      expect(component.loader).toBe(0);
    });
  });

  // Passing tests - kept minimal
  describe('getStatus', () => {
    it.each([
      [1, 'Active'],
      [2, 'Pending Approval'],
      [0, 'In-active'],
      [5, 'In-active'],
    ])('status %i → %s', (input, expected) => {
      expect(component.getStatus(input)).toBe(expected);
    });
  });

  describe('viewDocument', () => {
    it('should warn when no document exists', () => {
      component.viewDocument({ document: null });
      expect(mockCoreService.toast).toHaveBeenCalledWith('warn', 'No document available for this agency');
    });

    it('should open document in new tab for non-munichre context', async () => {
      component.projectContext = 'saksham';
      const agency = { document: 'path/to/doc.pdf' };

      const createElementSpy = jest.spyOn(document, 'createElement').mockReturnValue(document.createElement('a'));

      await component.viewDocument(agency);

      expect(createElementSpy).toHaveBeenCalled();
      expect(mockCoreService.toast).not.toHaveBeenCalledWith('error', expect.anything());
    });
  });
});