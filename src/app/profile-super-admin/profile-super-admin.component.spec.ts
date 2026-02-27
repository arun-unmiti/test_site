import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NgbModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

import { ProfileSuperAdminComponent } from './profile-super-admin.component';
import { CoreService } from '../utilities/core.service';
import { UserDetailService } from '../auth/user-detail.service';
import { FilterService } from '../utilities/filter.service';
import { FeatureToggleService } from '../shared/services/feature-toggle.service';
import { environment, ProjectContext } from '../../environments/environment';

// ✅ Mock SafePipe
@Pipe({ name: 'safe' })
class SafePipe implements PipeTransform {
  transform(value: any, type: string): any {
    return value;
  }
}

// ✅ Mock Services
class MockCoreService {
  post = jest.fn().mockResolvedValue({ status: 1 });
  dashboard_post = jest.fn().mockResolvedValue({ status: 1 });
  get = jest.fn().mockResolvedValue({ status: 1 });
  getSelf = jest.fn().mockResolvedValue({ status: 1 });
  toast = jest.fn();
}

class MockUserDetailService {
  getUserDetail = jest.fn(() => ({ user_id: '123', user_role: '1', unit_id: '2000', image: 'img.jpg' }));
  setUserImg = jest.fn();
  getcsrfTokenName = jest.fn(() => 'csrf_name');
  getcsrfToken = jest.fn(() => 'csrf_token');
}

class MockFilterService {
  isLoactionFetched = true;
  fetchedLocationData = { subscribe: jest.fn() };
  years = [{ id: 2023, year: '2023' }];
  seasons = [{ id: 1, season_name: 'Kharif' }];
  clients = [{ UNIT_ID: '2000', UNIT_NAME: 'Client1' }];
}

class MockFeatureToggleService {
  getContext = jest.fn(() => 'saksham');
  getConfig = jest.fn(() => ({ BASEUSERIMG: 'path/to/' }));
}

class MockNgbModal {
  open = jest.fn().mockReturnValue({ result: Promise.resolve('yes') });
  dismissAll = jest.fn();
}

class MockDomSanitizer {
  bypassSecurityTrustHtml = jest.fn(value => value);
}

describe('ProfileSuperAdminComponent', () => {
  let component: ProfileSuperAdminComponent;
  let fixture: ComponentFixture<ProfileSuperAdminComponent>;
  let coreService: any;
  let userService: any;
  let filterService: any;
  let featureToggle: any;
  let modalService: any;
  let sanitizer: any;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProfileSuperAdminComponent, SafePipe],
      imports: [HttpClientTestingModule, NgbModule, FormsModule, ReactiveFormsModule],
      providers: [
        { provide: CoreService, useClass: MockCoreService },
        { provide: UserDetailService, useClass: MockUserDetailService },
        { provide: FilterService, useClass: MockFilterService },
        { provide: FeatureToggleService, useClass: MockFeatureToggleService },
        { provide: NgbModal, useClass: MockNgbModal },
        { provide: DomSanitizer, useClass: MockDomSanitizer },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileSuperAdminComponent);
    component = fixture.componentInstance;
    coreService = TestBed.inject(CoreService);
    userService = TestBed.inject(UserDetailService);
    filterService = TestBed.inject(FilterService);
    featureToggle = TestBed.inject(FeatureToggleService);
    modalService = TestBed.inject(NgbModal);
    sanitizer = TestBed.inject(DomSanitizer);
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  describe('constructor', () => {
    it('should set projectContext and assetsFolder', () => {
      expect(component.projectContext).toBe('saksham');
      expect(component.assetsFolder).toBe(environment.projectConfigs['saksham'].assetsFolder);
    });

    it('should set selectedClient to "2000" if projectContext is saksham', () => {
      expect(component.selectedClient).toBe('2000');
    });
  });

  describe('ngOnInit', () => {
    it('should call getLookupLocation, getDashboardLog, getEmailLog, getClientEmails, setEmailDefault, getDashboardDefaultData, getEmailDefaultData', () => {
      const getLookupLocationSpy = jest.spyOn(component, 'getLookupLocation');
      const getDashboardLogSpy = jest.spyOn(component, 'getDashboardLog');
      const getEmailLogSpy = jest.spyOn(component, 'getEmailLog');
      const getClientEmailsSpy = jest.spyOn(component, 'getClientEmails');
      const setEmailDefaultSpy = jest.spyOn(component, 'setEmailDefault');
      const getDashboardDefaultDataSpy = jest.spyOn(component, 'getDashboardDefaultData');
      const getEmailDefaultDataSpy = jest.spyOn(component, 'getEmailDefaultData');
      const getFullUserDetailSpy = jest.spyOn(component, 'getFullUserDetail');
      const changeTabSpy = jest.spyOn(component, 'changeTab');
      component.ngOnInit();
      expect(getLookupLocationSpy).toHaveBeenCalled();
      expect(getDashboardLogSpy).toHaveBeenCalled();
      expect(getEmailLogSpy).toHaveBeenCalled();
      expect(getClientEmailsSpy).toHaveBeenCalled();
      expect(setEmailDefaultSpy).toHaveBeenCalled();
      expect(getDashboardDefaultDataSpy).toHaveBeenCalled();
      expect(getEmailDefaultDataSpy).toHaveBeenCalled();
      expect(component.surveysMap[1]).toBe('Crop Health Monitoring');
      expect(component.userDetails).toEqual({ user_id: '123', user_role: '1', unit_id: '2000', image: 'img.jpg' });
      expect(component.altText).toBe('Admin Profile');
      expect(changeTabSpy).not.toHaveBeenCalledWith(4);
      expect(getFullUserDetailSpy).toHaveBeenCalled();
      expect(component.userImg).toBe('path/to/img.jpg');
      expect(component.roleOptions).toHaveLength(4);
      expect(component.csrfTokenName).toBe('csrf_name');
      expect(component.csrfToken).toBe('csrf_token');
    });

    it('should set altText to "Client Logo" and call changeTab if user_role not 1 or 2', () => {
      userService.getUserDetail.mockReturnValueOnce({ user_id: '123', user_role: '3', unit_id: '2000', image: 'img.jpg' });
      const changeTabSpy = jest.spyOn(component, 'changeTab');
      component.ngOnInit();
      expect(component.altText).toBe('Client Logo');
      expect(changeTabSpy).toHaveBeenCalledWith(4);
    });
  });

  describe('getLookupLocation', () => {
    it('should call getLocationsData if isLoactionFetched', () => {
      filterService.isLoactionFetched = true;
      const getLocationsDataSpy = jest.spyOn(component, 'getLocationsData');
      component.getLookupLocation();
      expect(getLocationsDataSpy).toHaveBeenCalled();
    });

    it('should subscribe to fetchedLocationData if not fetched', () => {
      filterService.isLoactionFetched = false;
      const getLocationsDataSpy = jest.spyOn(component, 'getLocationsData');
      component.getLookupLocation();
      const subscriber = filterService.fetchedLocationData.subscribe.mock.calls[0][0];
      subscriber();
      expect(getLocationsDataSpy).toHaveBeenCalled();
    });
  });

  describe('getDashboardLog', () => {
    it('should fetch and set dashboardLogs', async () => {
      const mockResponse = { status: 1, jobs: [{ added_datetime: '2023-08-02', job_status: 'success', survey_id: 1, comment: '1234' }], total_jobs: 1 };
      coreService.post.mockResolvedValueOnce(mockResponse);
      await component.getDashboardLog();
      expect(component.dashboardLogs[0].sno).toBe(1);
      expect(component.dashboardLogs[0].date).toBe('02-08-2023');
      expect(component.dashboardLogs[0].status).toBe('success');
      expect(component.dashboardLogs[0].survey_type).toBe('CHM');
      expect(component.totalDashboardRecord).toBe(1);
    });

    it('should not fetch if loadingDashboardLog > 0', () => {
      component.loadingDashboardLog = 1;
      component.getDashboardLog();
      expect(coreService.post).not.toHaveBeenCalled();
    });

    it('should handle status != 1', async () => {
      coreService.post.mockResolvedValueOnce({ status: 0 });
      await component.getDashboardLog();
      expect(component.dashboardLogs).toEqual([]);
    });

    it('should handle error', async () => {
      coreService.post.mockRejectedValueOnce(new Error('error'));
      await component.getDashboardLog();
      expect(component.dashboardLogs).toEqual([]);
    });
  });

  describe('getEmailLog', () => {
    it('should fetch and set emailLogs', async () => {
      const mockResponse = { status: 1, jobs: [{ added_datetime: '2023-08-02', job_status: 'success', survey_id: 1, comment: '1234' }], total_jobs: 1 };
      coreService.post.mockResolvedValueOnce(mockResponse);
      await component.getEmailLog();
      expect(component.emailLogs[0].sno).toBe(1);
      expect(component.emailLogs[0].date).toBe('02-08-2023');
      expect(component.emailLogs[0].status).toBe('success');
      expect(component.emailLogs[0].survey_type).toBe('CHM');
      expect(component.totalEmailRecord).toBe(1);
    });

    it('should not fetch if loadingEmailLog > 0', () => {
      component.loadingEmailLog = 1;
      component.getEmailLog();
      expect(coreService.post).not.toHaveBeenCalled();
    });

    it('should handle status != 1', async () => {
      coreService.post.mockResolvedValueOnce({ status: 0 });
      await component.getEmailLog();
      expect(component.emailLogs).toEqual([]);
    });

    it('should handle error', async () => {
      coreService.post.mockRejectedValueOnce(new Error('error'));
      await component.getEmailLog();
      expect(component.emailLogs).toEqual([]);
    });
  });

  describe('getLocationsData', () => {
    it('should set options from filter', () => {
      component.getLocationsData();
      expect(component.yearOptions).toEqual(filterService.years);
      expect(component.seasonOptions).toEqual(filterService.seasons);
      expect(component.clientOptions).toEqual(filterService.clients);
      expect(component.clientMap['2000']).toBe('Client1');
    });
  });

  describe('openConfirmation', () => {
    it('should set instType and open modal', async () => {
      component.surveysMap = {1: 'CHM'};
      component.projectContext = 'saksham';
      component.selectedEmailClient = [];
      await component.openConfirmation(1, 'dashboard');
      expect(component.instType).toEqual(expect.objectContaining({ type: 'dashboard', survey_id: 1, name: 'Crop Health Monitoring', title: 'Crop Health Monitoring Dashboard' }));
      expect(modalService.open).toHaveBeenCalled();
    });

    it('should handle dashboard type for survey 1', async () => {
      modalService.open.mockReturnValueOnce({ result: Promise.resolve('yes') });
      coreService.get.mockResolvedValueOnce({ status: 1 });
      await component.openConfirmation(1, 'dashboard');
      expect(coreService.get).toHaveBeenCalledWith('chmdashboard');
    });

    it('should handle email type for survey 1', async () => {
      component.selectedEmailClient = [{ UNIT_ID: '2000' }];
      modalService.open.mockReturnValueOnce({ result: Promise.resolve('yes') });
      coreService.get.mockResolvedValueOnce({ status: 1 });
      await component.openConfirmation(1, 'email');
      expect(coreService.get).toHaveBeenCalledWith('chmmail?client=2000');
    });

    it('should handle dashboard type for survey 2', async () => {
      modalService.open.mockReturnValueOnce({ result: Promise.resolve('yes') });
      coreService.get.mockResolvedValueOnce({ status: 1 });
      await component.openConfirmation(2, 'dashboard');
      expect(coreService.get).toHaveBeenCalledWith('clsdashboard');
    });

    it('should handle email type for survey 2', async () => {
      component.selectedEmailClient = [{ UNIT_ID: '2000' }];
      modalService.open.mockReturnValueOnce({ result: Promise.resolve('yes') });
      coreService.get.mockResolvedValueOnce({ status: 1 });
      await component.openConfirmation(2, 'email');
      expect(coreService.get).toHaveBeenCalledWith('clsmail?client=2000');
    });

    it('should handle dashboard type for survey 3', async () => {
      modalService.open.mockReturnValueOnce({ result: Promise.resolve('yes') });
      coreService.get.mockResolvedValueOnce({ status: 1 });
      await component.openConfirmation(3, 'dashboard');
      expect(coreService.get).toHaveBeenCalledWith('ccedashboard');
    });

    it('should toast success after initiation', async () => {
      modalService.open.mockReturnValueOnce({ result: Promise.resolve('yes') });
      coreService.get.mockResolvedValueOnce({ status: 1 });
      await component.openConfirmation(1, 'dashboard');
      expect(coreService.toast).toHaveBeenCalledWith('success', 'Crop Health Monitoring Dashboard initiated successfully');
    });

    it('should reset selectedEmailClient after initiation', async () => {
      component.selectedEmailClient = [{ UNIT_ID: '2000' }];
      modalService.open.mockReturnValueOnce({ result: Promise.resolve('yes') });
      coreService.get.mockResolvedValueOnce({ status: 1 });
      await component.openConfirmation(1, 'dashboard');
      expect(component.selectedEmailClient).toEqual([]);
    });

    it('should not initiate if modal result not yes', async () => {
      modalService.open.mockReturnValueOnce({ result: Promise.resolve('no') });
      await component.openConfirmation(1, 'dashboard');
      expect(coreService.get).not.toHaveBeenCalled();
    });
  });

  describe('getClientEmails', () => {
    it('should fetch and set clientEmails', async () => {
      const mockResponse = { status: 1, emails: [{ id: 1, email: 'test@email.com', type: 'to', survey: 1, client: '2000', status: 1 }] };
      coreService.post.mockResolvedValueOnce(mockResponse);
      await component.getClientEmails();
      expect(component.clientEmails[0].checkbox).toBe('email-status-1');
      expect(component.clientEmails[0].status).toBe(true);
    });

    it('should handle status != 1', async () => {
      coreService.post.mockResolvedValueOnce({ status: 0 });
      await component.getClientEmails();
      expect(component.clientEmails).toEqual([]);
    });

    it('should handle empty emails', async () => {
      coreService.post.mockResolvedValueOnce({ status: 1, emails: [] });
      await component.getClientEmails();
      expect(component.clientEmails).toEqual([]);
    });

    it('should handle error', async () => {
      coreService.post.mockRejectedValueOnce(new Error('error'));
      await component.getClientEmails();
      expect(component.clientEmails).toEqual([]);
    });

    it('should set status to false if 0', async () => {
      coreService.post.mockResolvedValueOnce({ status: 1, emails: [{ id: 1, status: 0 }] });
      await component.getClientEmails();
      expect(component.clientEmails[0].status).toBe(false);
    });
  });

  describe('openAddEmail', () => {
    it('should open modal and call setEmailDefault if result not yes', async () => {
      modalService.open.mockReturnValueOnce({ result: Promise.resolve('no') });
      const setEmailDefaultSpy = jest.spyOn(component, 'setEmailDefault');
      await component.openAddEmail();
      expect(setEmailDefaultSpy).toHaveBeenCalled();
    });

    it('should not call setEmailDefault if result yes', async () => {
      modalService.open.mockReturnValueOnce({ result: Promise.resolve('yes') });
      const setEmailDefaultSpy = jest.spyOn(component, 'setEmailDefault');
      await component.openAddEmail();
      expect(setEmailDefaultSpy).not.toHaveBeenCalled();
    });
  });

  describe('updateEmailStatus', () => {
    it('should revert status on no', async () => {
      const event = true;
      const data = { status: true };
      modalService.open.mockReturnValueOnce({ result: Promise.resolve('no') });
      await component.updateEmailStatus(event, data);
      expect(data.status).toBe(false);
    });
  });

  describe('setEmailDefault', () => {
    it('should reset clientEmailObj', () => {
      component.setEmailDefault();
      expect(component.clientEmailObj).toEqual({ email: '', type: '', survey: '', client: expect.any(String) });
    });
  });

  describe('getDashboardDefaultData', () => {
    it('should set defaultDashboardData', () => {
      component.getDashboardDefaultData();
      expect(component.defaultDashboardData).toHaveLength(3);
      expect(component.defaultDashboardData[0].survey).toBe('1');
    });
  });

  describe('getEmailDefaultData', () => {
    it('should set defaultEmailData to empty array', () => {
      component.getEmailDefaultData();
      expect(component.defaultEmailData).toEqual([]);
    });
  });

  describe('getEmailPath', () => {
    it('should return path with optional param', () => {
      expect(component.getEmailPath('test')).toBe('auto_email/test');
      expect(component.getEmailPath('')).toBe('auto_email');
    });
  });

  describe('open', () => {
    it('should open modal', () => {
      component.open('content');
      expect(modalService.open).toHaveBeenCalled();
    });
  });

  describe('onAddEmail', () => {
    it('should toast warning on invalid data', () => {
      component.clientEmailObj = { email: '', type: '', survey: '', client: '' };
      component.onAddEmail({ close: jest.fn() });
      expect(coreService.toast).toHaveBeenCalledWith('warn', 'Invalid data');
    });

    it('should post request and close modal on success', async () => {
      component.clientEmailObj = { email: 'test@email.com', type: 'to', survey: 1, client: '2000' };
      const mockResponse = { status: 1, msg: 'Added' };
      coreService.post.mockResolvedValueOnce(mockResponse);
      const getClientEmailsSpy = jest.spyOn(component, 'getClientEmails');
      const setEmailDefaultSpy = jest.spyOn(component, 'setEmailDefault');
      const modal = { close: jest.fn() };
      await component.onAddEmail(modal);
      expect(coreService.post).toHaveBeenCalledWith('auto_email', expect.objectContaining({ purpose: 'add_cron_email' }));
      expect(coreService.toast).toHaveBeenCalledWith('success', 'Added');
      expect(getClientEmailsSpy).toHaveBeenCalled();
      expect(modal.close).toHaveBeenCalledWith('yes');
      expect(setEmailDefaultSpy).toHaveBeenCalled();
    });

    it('should toast warn on status !=1', async () => {
      component.clientEmailObj = { email: 'test@email.com', type: 'to', survey: 1, client: '2000' };
      coreService.post.mockResolvedValueOnce({ status: 0, msg: 'Failed' });
      const modal = { close: jest.fn() };
      await component.onAddEmail(modal);
      expect(coreService.toast).toHaveBeenCalledWith('warn', 'Failed');
      expect(modal.close).not.toHaveBeenCalled();
    });

    it('should validate email regex', () => {
      component.clientEmailObj = { email: 'invalid', type: 'to', survey: 1, client: '2000' };
      component.onAddEmail({ close: jest.fn() });
      expect(coreService.toast).toHaveBeenCalledWith('warn', 'Invalid data');
    });
  });

  describe('onImageChange', () => {
    it('should do nothing if no files', () => {
      const event = { target: { files: [] } };
      component.onImageChange(event as any);
      expect(component.imgFile).toBe('');
    });
  });

  describe('onYearChange', () => {
    it('should call getAgencyData', () => {
      const getAgencyDataSpy = jest.spyOn(component, 'getAgencyData');
      component.onYearChange();
      expect(getAgencyDataSpy).toHaveBeenCalled();
    });
  });

  describe('onSeasonChange', () => {
    it('should call getAgencyData', () => {
      const getAgencyDataSpy = jest.spyOn(component, 'getAgencyData');
      component.onSeasonChange();
      expect(getAgencyDataSpy).toHaveBeenCalled();
    });
  });

  describe('onClientChange', () => {
    it('should call getAgencyData', () => {
      const getAgencyDataSpy = jest.spyOn(component, 'getAgencyData');
      component.onClientChange();
      expect(getAgencyDataSpy).toHaveBeenCalled();
    });
  });

  describe('getAgencyData', () => {
    it('should fetch agencies if selections made', async () => {
      component.selectedClient = '2000';
      component.selectedYear = '2023';
      component.selectedseason = '1';
      const mockResponse = { status: 1, all_agencies: [{ agency_id: 1, agency_name: 'Agency1' }] };
      coreService.dashboard_post.mockResolvedValueOnce(mockResponse);
      await component.getAgencyData();
      expect(coreService.dashboard_post).toHaveBeenCalledWith('agency', expect.objectContaining({ purpose: 'get_all' }));
      expect(component.agencyOptions).toHaveLength(2); // + Self
      expect(component.agencyOptions[1]).toEqual({ agency_id: '0', agency_name: 'Self' });
    });

    it('should not fetch if missing selection', () => {
      component.selectedClient = '';
      component.getAgencyData();
      expect(coreService.dashboard_post).not.toHaveBeenCalled();
    });

    it('should handle status !=1', async () => {
      component.selectedClient = '2000';
      component.selectedYear = '2023';
      component.selectedseason = '1';
      coreService.dashboard_post.mockResolvedValueOnce({ status: 0 });
      await component.getAgencyData();
      expect(component.agencyOptions).toEqual([]);
    });

    it('should handle error', async () => {
      component.selectedClient = '2000';
      component.selectedYear = '2023';
      component.selectedseason = '1';
      coreService.dashboard_post.mockRejectedValueOnce(new Error('error'));
      await component.getAgencyData();
      expect(component.agencyOptions).toEqual([]);
    });
  });

  describe('generateUserLabel', () => {
    it('should handle no phone', () => {
      component.user = { first_name: 'John', last_name: 'Doe', role_name: 'Admin', email_id: 'test@email.com' };
      component.generateUserLabel();
      expect(component.labelDetails.phoneNumber).toBe('NA');
    });

    it('should handle no email', () => {
      component.user = { first_name: 'John', last_name: 'Doe', role_name: 'Admin', phone: '+1234567890' };
      component.generateUserLabel();
      expect(component.labelDetails.email).toBe('NA');
    });
  });

  describe('hasRoleImg', () => {
    it('should return tick if role matches', () => {
      component.user = { role_id: 5 };
      expect(component.hasRoleImg(5, 6)).toBe(`${component.assetsFolder}/images/tick.png`);
    });

    it('should return close if role not matches', () => {
      component.user = { role_id: 5 };
      expect(component.hasRoleImg(7)).toBe(`${component.assetsFolder}/images/close.png`);
    });

    it('should return empty if no role_id', () => {
      component.user = {};
      expect(component.hasRoleImg(5)).toBe('');
    });
  });

  describe('openResetConfirmation', () => {
    it('should open modal if all selections made', () => {
      component.selectedYear = '2023';
      component.selectedseason = '1';
      component.selectedClient = '2000';
      component.selectedAgency = '1';
      component.openResetConfirmation('content');
      expect(modalService.open).toHaveBeenCalled();
    });

    it('should toast warn if missing year', () => {
      component.selectedseason = '1';
      component.selectedClient = '2000';
      component.selectedAgency = '1';
      component.openResetConfirmation('content');
      expect(coreService.toast).toHaveBeenCalledWith('warn', 'Please select year');
      expect(modalService.open).not.toHaveBeenCalled();
    });

    it('should toast warn if missing season', () => {
      component.selectedYear = '2023';
      component.selectedClient = '2000';
      component.selectedAgency = '1';
      component.openResetConfirmation('content');
      expect(coreService.toast).toHaveBeenCalledWith('warn', 'Please select season');
    });

    it('should toast warn if missing agency', () => {
      component.selectedYear = '2023';
      component.selectedseason = '1';
      component.selectedClient = '2000';
      component.openResetConfirmation('content');
      expect(coreService.toast).toHaveBeenCalledWith('warn', 'Please select agency');
    });
  });

  describe('submitDefault', () => {
    it('should post reset and reset selections on success', async () => {
      component.selectedClient = '2000';
      component.selectedAgency = '1';
      component.selectedseason = '1';
      component.selectedYear = '2023';
      component.selectedRoles = [5,6];
      coreService.post.mockResolvedValueOnce({ status: 1, msg: 'Reset' });
      const modal = { close: jest.fn() };
      await component.submitDefault(modal);
      expect(coreService.post).toHaveBeenCalledWith('users', expect.objectContaining({ purpose: 'reset_user_mapping' }));
      expect(component.selectedAgency).toBe('');
      expect(component.selectedClient).toBe('2000'); // since saksham
      expect(component.selectedYear).toBe('');
      expect(component.selectedseason).toBe('');
      expect(component.selectedRoles).toEqual([]);
      expect(component.agencyOptions).toEqual([]);
      expect(coreService.toast).toHaveBeenCalledWith('success', 'Reset');
      expect(modal.close).toHaveBeenCalledWith('success');
    });

    it('should toast error on status !=1', async () => {
      coreService.post.mockResolvedValueOnce({ status: 0, msg: 'Failed' });
      await component.submitDefault({ close: jest.fn() });
      expect(coreService.toast).toHaveBeenCalledWith('error', 'Failed');
    });
  });

  describe('changeTab', () => {
    it('should set active if different', () => {
      component.active = 1;
      component.changeTab(2);
      expect(component.active).toBe(2);
    });

    it('should not set if same', () => {
      component.active = 1;
      component.changeTab(1);
      expect(component.active).toBe(1);
    });
  });

  describe('onDashboardPageTrigger', () => {
    it('should update pagination and call getDashboardLog', () => {
      const env = { page_no: 2, records_per_page: 20 };
      const getDashboardLogSpy = jest.spyOn(component, 'getDashboardLog');
      component.onDashboardPageTrigger(env);
      expect(component.currentDashboardpage).toBe(2);
      expect(component.dashboardRecordsPerPage).toBe(20);
      expect(getDashboardLogSpy).toHaveBeenCalled();
    });
  });

  describe('onEmailPageTrigger', () => {
    it('should update pagination and call getEmailLog', () => {
      const env = { page_no: 2, records_per_page: 20 };
      const getEmailLogSpy = jest.spyOn(component, 'getEmailLog');
      component.onEmailPageTrigger(env);
      expect(component.currentemailpage).toBe(2);
      expect(component.emailRecordsPerPage).toBe(20);
      expect(getEmailLogSpy).toHaveBeenCalled();
    });
  });

  // Add tests for other methods...
});