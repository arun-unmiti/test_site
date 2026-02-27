import 'zone.js/bundles/zone-testing-bundle.umd.js';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ReCaptchaV3Service } from 'ng-recaptcha';
import { of, throwError } from 'rxjs';

import { AddusersComponent } from './addusers.component';
import { CoreService } from 'src/app/utilities/core.service';
import { FilterService } from 'src/app/utilities/filter.service';
import { UserDetailService } from 'src/app/auth/user-detail.service';
import { FeatureToggleService } from '../../shared/services/feature-toggle.service';
import { environment } from '../../../environments/environment';

// Mock Services
class MockCoreService {
  post = jest.fn().mockResolvedValue({ status: 1 });
  clone = jest.fn(obj => JSON.parse(JSON.stringify(obj)));
  toast = jest.fn();
}

class MockFilterService {
  isLoactionFetched = true;
  fetchedLocationData = { subscribe: jest.fn() };
  years = [{ id: '2023', year: '2023' }];
  seasons = [{ id: '1', season_name: 'Season1' }];
  states = [{ state_id: '1', state_name: 'State1' }];
  districts = [{ district_id: '1', district_name: 'Dist1', state_id: '1' }];
  tehsils = [{ tehsil_id: '1', tehsil_name: 'Tehsil1', district_id: '1' }];
  blocks = [{ block_id: '1', block_name: 'Block1', tehsil_id: '1' }];
  getAgencyWiseLocation = jest.fn().mockResolvedValue({ states: [{ state_id: '1' }], districts: [], tehsils: [] });
}

class MockUserDetailService {
  getUserDetail = jest.fn(() => ({ user_role: '1', unit_id: '2000', agency_id: 'agency1' }));
  getLocation = jest.fn(() => ({ states: [{ state_id: '1' }], districts: [{ district_id: '1' }] }));
  getcsrfTokenName = jest.fn(() => 'csrf_name');
  getcsrfToken = jest.fn(() => 'csrf_token');
  AESEncrypt = jest.fn(val => val);
}

class MockFeatureToggleService {
  getContext = jest.fn(() => 'saksham');
}

class MockNgbModal {
  open = jest.fn().mockReturnValue({ result: Promise.resolve('yes') });
}

class MockReCaptchaV3Service {
  execute = jest.fn().mockReturnValue(of('mock-token'));
}

jest.mock('../../../environments/environment', () => ({
  environment: {
    projectConfigs: {
      saksham: { assetsFolder: '/assets/saksham/' },
      munichre: { assetsFolder: '/assets/munichre/' }
    }
  }
}));

describe('AddusersComponent', () => {
  let component: AddusersComponent;
  let fixture: ComponentFixture<AddusersComponent>;
  let coreService: any;
  let filterService: any;
  let userService: any;
  let featureToggle: any;
  let modalService: any;
  let recaptchaService: any;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        FormsModule,
        ReactiveFormsModule,
        NgbModule,
      ],
      declarations: [AddusersComponent],
      providers: [
        { provide: CoreService, useClass: MockCoreService },
        { provide: FilterService, useClass: MockFilterService },
        { provide: UserDetailService, useClass: MockUserDetailService },
        { provide: FeatureToggleService, useClass: MockFeatureToggleService },
        { provide: NgbModal, useClass: MockNgbModal },
        { provide: ReCaptchaV3Service, useClass: MockReCaptchaV3Service },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(AddusersComponent);
    component = fixture.componentInstance;
    coreService = TestBed.inject(CoreService);
    filterService = TestBed.inject(FilterService);
    userService = TestBed.inject(UserDetailService);
    featureToggle = TestBed.inject(FeatureToggleService);
    modalService = TestBed.inject(NgbModal);
    recaptchaService = TestBed.inject(ReCaptchaV3Service);
    fixture.detectChanges(); // Initialize ngOnInit and form
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  describe('constructor', () => {
    it('should set projectContext and assetsFolder', () => {
      expect(component.projectContext).toBe('saksham');
      expect(component.assetsFolder).toBe('/assets/saksham/');
    });
  });

  describe('ngOnInit', () => {
    it('should set user details and call methods', () => {
      const initFormSpy = jest.spyOn(component, 'initForm');
      const loadLocationSpy = jest.spyOn(component, 'loadLocation');
      const userRoleSpy = jest.spyOn(component, 'userRole');
      component.ngOnInit();
      expect(component.userDetails).toEqual(expect.objectContaining({ user_role: '1' }));
      expect(initFormSpy).toHaveBeenCalled();
      expect(loadLocationSpy).toHaveBeenCalled();
      expect(userRoleSpy).toHaveBeenCalled();
      expect(component.csrfTokenName).toBe('csrf_name');
      expect(component.csrfToken).toBe('csrf_token');
    });
  });

  describe('loadLocation', () => {
    it('should call addLocation if fetched', () => {
      filterService.isLoactionFetched = true;
      const addLocationSpy = jest.spyOn(component, 'addLocation');
      component.loadLocation();
      expect(component.isLoadingLocation).toBe(0);
      expect(addLocationSpy).toHaveBeenCalled();
    });

    it('should subscribe if not fetched', () => {
      filterService.isLoactionFetched = false;
      const addLocationSpy = jest.spyOn(component, 'addLocation');
      component.loadLocation();
      const subscriber = filterService.fetchedLocationData.subscribe.mock.calls[0][0];
      subscriber();
      expect(addLocationSpy).toHaveBeenCalled();
      expect(component.isLoadingLocation).toBe(0);
    });
  });

  describe('addLocation', () => {
    it('should set data', () => {
      component.isLoadingLocation = 1;
      filterService.years = [{ id: '1' }];
      filterService.seasons = [{ id: '1' }];
      component.addLocation();
      expect(component.yearData).toEqual([{ id: '1' }]);
      expect(component.seasonData).toEqual([{ id: '1' }]);
      expect(component.isLoadingLocation).toBe(0);
    });
  });

  describe('onStateChange', () => {
    it('should set districts', () => {
      component.initForm();
      component.userForm.patchValue({ user_role: '5' });
      component.clientDistricts = [{ state_id: '1', district_id: '1' }];
      component.onStateChange([{ state_id: '1', state_name: 'State1' }]);
      expect(component.districtData[0].items).toEqual([{ state_id: '1', district_id: '1' }]);
      expect(component.selectedDist).toEqual([{ state_id: '1', district_id: '1' }]);
    });

    it('should not set selectedDist for other roles', () => {
      component.userForm.patchValue({ user_role: '1' });
      component.clientDistricts = [{ state_id: '1', district_id: '1' }];
      component.onStateChange([{ state_id: '1', state_name: 'State1' }]);
      expect(component.selectedDist).toEqual([]);
    });

    it('should handle empty event', () => {
      component.onStateChange([]);
      expect(component.districtData).toEqual([]);
    });
  });

  describe('onSingleStateChange', () => {
    it('should filter state and call onStateChange', () => {
      component.statesData = [{ state_id: '1', state_name: 'State1' }];
      const onStateChangeSpy = jest.spyOn(component, 'onStateChange');
      component.onSingleStateChange('1');
      expect(component.selectedState).toEqual([{ state_id: '1', state_name: 'State1' }]);
      expect(onStateChangeSpy).toHaveBeenCalledWith([{ state_id: '1', state_name: 'State1' }]);
    });

    it('should set empty if no match', () => {
      component.statesData = [];
      component.onSingleStateChange('1');
      expect(component.selectedState).toEqual([]);
    });
  });

  describe('onDistrictChange', () => {
    it('should set tehsils', () => {
      component.clientTehsils = [{ district_id: '1', tehsil_id: '1' }];
      component.onDistrictChange([{ district_id: '1', district_name: 'Dist1' }]);
      expect(component.tehsilsData[0].items).toEqual([{ district_id: '1', tehsil_id: '1' }]);
      expect(component.selectedtehsil).toEqual([{ district_id: '1', tehsil_id: '1' }]);
      expect(component.blockData).toEqual([]);
      expect(component.selectedBlock).toEqual([]);
    });

    it('should handle empty event', () => {
      component.onDistrictChange([]);
      expect(component.tehsilsData).toEqual([]);
    });
  });

  describe('onSingleDistrictChange', () => {
    it('should filter district and call onDistrictChange', () => {
      component.clientDistricts = [{ district_id: '1' }];
      const onDistrictChangeSpy = jest.spyOn(component, 'onDistrictChange');
      component.onSingleDistrictChange('1');
      expect(component.selectedDist).toEqual([{ district_id: '1' }]);
      expect(onDistrictChangeSpy).toHaveBeenCalledWith([{ district_id: '1' }]);
    });

    it('should set empty if no match', () => {
      component.clientDistricts = [];
      component.onSingleDistrictChange('1');
      expect(component.selectedDist).toEqual([]);
    });
  });

  describe('onTehsilChange', () => {
    it('should set blocks', () => {
      component.allBlocks = [{ tehsil_id: '1', block_id: '1' }];
      component.onTehsilChange([{ tehsil_id: '1', tehsil_name: 'Tehsil1' }]);
      expect(component.blockData[0].items).toEqual([{ tehsil_id: '1', block_id: '1' }]);
      expect(component.selectedBlock).toEqual([]);
    });

    it('should handle empty event', () => {
      component.onTehsilChange([]);
      expect(component.blockData).toEqual([]);
    });
  });

  describe('onBlockChange', () => {
    it('should do nothing', () => {
      component.onBlockChange('test');
      expect(true).toBe(true); // Placeholder for empty method
    });
  });
  
  describe('userRole', () => {
    it('should handle status not 1', async () => {
      coreService.post
        .mockResolvedValueOnce({ status: 0 })
        .mockResolvedValueOnce({ status: 0 });
      await component.userRole();
      expect(component.roles).toEqual([]);
      expect(component.allAgencies).toEqual([]);
    });
  });

  describe('initForm', () => {
    it('should call onClientChange if unit_id', () => {
      const onClientChangeSpy = jest.spyOn(component, 'onClientChange');
      component.initForm();
      expect(onClientChangeSpy).toHaveBeenCalledWith('2000');
    });

    it('should not set roleType if not hideRoleType', () => {
      component.hideRoleType = false;
      component.initForm();
      expect(component.userForm.get('roleType').value).toBe('');
    });
  });

  describe('onLevelChange', () => {
    it('should reset form fields', () => {
      component.onLevelChange('3');
      expect(component.userForm.get('roleType').value).toBe('');
      expect(component.userForm.get('agency').value).toBe('');
      expect(component.selectedState).toEqual([]);
    });

    it('should set client for saksham', () => {
      featureToggle.getContext.mockReturnValue('saksham');
      component.onLevelChange('1');
      expect(component.userForm.get('client').value).toBe('2000');
    });

    it('should handle validators for role 7,8', () => {
      component.onLevelChange('7');
      expect(component.userForm.get('roleType').validator).toBeDefined();
    });

    it('should set roleType for hideRoleType', () => {
      component.hideRoleType = true;
      component.userDetails = { agency_id: 'agency1' };
      component.onLevelChange('7');
      expect(component.userForm.get('roleType').value).toBe('2');
    });

    it('should reset for roles 1-4', () => {
      component.onLevelChange('4');
      expect(component.selectedState).toEqual([]);
    });

    it('should reset for roles 1-6', () => {
      component.onLevelChange('6');
      expect(component.selectedDist).toEqual([]);
    });
  });

  describe('onTypeChange', () => {
    it('should handle validators', () => {
      component.userForm.patchValue({ user_role: '7', roleType: '2' });
      component.onTypeChange('2');
      expect(component.userForm.get('agency').validator).toBeDefined();
    });

    it('should clear validators if not', () => {
      component.userForm.patchValue({ user_role: '1', roleType: '1' });
      component.onTypeChange('1');
      expect(component.userForm.get('agency').validator).toBeNull();
    });

    it('should set agency for hideRoleType', () => {
      component.hideRoleType = true;
      component.userDetails = { agency_id: 'agency1' };
      component.userForm.patchValue({ roleType: '2' });
      component.onTypeChange('2');
      expect(component.userForm.get('agency').value).toBe('agency1');
    });

    it('should reset locations', () => {
      component.onTypeChange('1');
      expect(component.selectedState).toEqual([]);
    });
  });

  describe('props', () => {
    it('should get control', () => {
      expect(component.props('first_name')).toBeDefined();
    });

    it('should return undefined if no form', () => {
      component.userForm = null;
      expect(component.props('first_name')).toBeUndefined();
    });
  });

  describe('get f', () => {
    it('should return controls', () => {
      expect(component.f).toBeDefined();
    });
  });

  describe('createUser', () => {    
    it('should create user on valid form', async () => {
      component.initForm();
      component.userForm.patchValue({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '1234567890',
        emp_id: 'EMP001',
        password: 'Password1!',
        cpassword: 'Password1!',
        user_role: '7',
        client: '2000',
        roleType: '2',
        agency: 'agency1',
        designation: 'Dev'
      });
      component.selectedYear = '2023';
      component.selectedSeason = '1';
      component.selectedState = [{ state_id: '1' }];
      component.selectedDist = [{ district_id: '1' }];
      component.selectedtehsil = [{ tehsil_id: '1' }];
      coreService.post.mockResolvedValueOnce({ status: 1, msg: 'Success' });
      const initFormSpy = jest.spyOn(component, 'initForm');
      await component.createUser();
      expect(coreService.toast).toHaveBeenCalledWith('success', 'Success');
      expect(initFormSpy).toHaveBeenCalled();
    });

    it('should show toast on invalid form', () => {
      component.initForm();
      component.createUser();
      expect(coreService.toast).toHaveBeenCalledWith('error', 'Please check mandatory fields');
    });

    it('should show toast on invalid form', () => {
      component.createUser();
      expect(coreService.toast).toHaveBeenCalledWith('error', 'Please check mandatory fields');
      expect(component.submitted).toBe(true);
    });

    it('should return if invalid after markAllAsTouched', () => {
      component.submitted = true;
      component.createUser();
      expect(component.loading).toBe(0);
    });

    it('should show toast on password mismatch', () => {
      component.userForm.patchValue({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '1234567890',
        emp_id: 'EMP001',
        password: 'Password1!',
        cpassword: 'Password2!',
        user_role: '1',
        client: '2000'
      });
      component.createUser();
      expect(coreService.toast).toHaveBeenCalledWith('warn', 'Password and Confirm Password must be similar');
    });

    it('should show toast on missing year', () => {
      component.userForm.patchValue({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '1234567890',
        emp_id: 'EMP001',
        password: 'Password1!',
        cpassword: 'Password1!',
        user_role: '5',
        client: '2000'
      });
      component.createUser();
      expect(coreService.toast).toHaveBeenCalledWith('warn', 'Please assign year to user');
    });

    it('should show toast on missing season', () => {
      component.userForm.patchValue({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '1234567890',
        emp_id: 'EMP001',
        password: 'Password1!',
        cpassword: 'Password1!',
        user_role: '5',
        client: '2000'
      });
      component.selectedYear = '2023';
      component.createUser();
      expect(coreService.toast).toHaveBeenCalledWith('warn', 'Please assign season to user');
    });

    it('should show toast on missing state', () => {
      component.userForm.patchValue({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '1234567890',
        emp_id: 'EMP001',
        password: 'Password1!',
        cpassword: 'Password1!',
        user_role: '5',
        client: '2000'
      });
      component.selectedYear = '2023';
      component.selectedSeason = '1';
      component.createUser();
      expect(coreService.toast).toHaveBeenCalledWith('warn', 'Please assign locations to user');
    });

    it('should show toast on missing dist', () => {
      component.userForm.patchValue({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '1234567890',
        emp_id: 'EMP001',
        password: 'Password1!',
        cpassword: 'Password1!',
        user_role: '5',
        client: '2000'
      });
      component.selectedYear = '2023';
      component.selectedSeason = '1';
      component.selectedState = [{ state_id: '1' }];
      component.createUser();
      expect(coreService.toast).toHaveBeenCalledWith('warn', 'Please assign locations to user');
    });

    it('should show toast on missing tehsil for role 8', () => {
      component.userForm.patchValue({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '1234567890',
        emp_id: 'EMP001',
        password: 'Password1!',
        cpassword: 'Password1!',
        user_role: '8',
        client: '2000'
      });
      component.selectedYear = '2023';
      component.selectedSeason = '1';
      component.selectedState = [{ state_id: '1' }];
      component.selectedDist = [{ district_id: '1' }];
      component.createUser();
      expect(coreService.toast).toHaveBeenCalledWith('warn', 'Please assign locations to user');
    });

    it('should handle status 0 with active account', async () => {
      component.userForm.patchValue({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '1234567890',
        emp_id: 'EMP001',
        password: 'Password1!',
        cpassword: 'Password1!',
        user_role: '1',
        client: '2000'
      });
      coreService.post.mockResolvedValueOnce({ status: 0, active_account: 1, user_id: '1' });
      const openConfirmationSpy = jest.spyOn(component, 'openConfirmation');
      await component.createUser();
      expect(openConfirmationSpy).toHaveBeenCalledWith(expect.anything(), '1');
    });

    it('should handle status 0 without active account', async () => {
      component.userForm.patchValue({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '1234567890',
        emp_id: 'EMP001',
        password: 'Password1!',
        cpassword: 'Password1!',
        user_role: '1',
        client: '2000'
      });
      coreService.post.mockResolvedValueOnce({ status: 0, msg: 'Error' });
      await component.createUser();
      expect(coreService.toast).toHaveBeenCalledWith('error', 'Error');
    });

    it('should handle status 0 with phone error', async () => {
      component.userForm.patchValue({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '1234567890',
        emp_id: 'EMP001',
        password: 'Password1!',
        cpassword: 'Password1!',
        user_role: '1',
        client: '2000'
      });
      coreService.post.mockResolvedValueOnce({ status: 0, phone: 'Phone error' });
      await component.createUser();
      expect(coreService.toast).toHaveBeenCalledWith('error', 'Phone error');
    });

    it('should handle status 0 with email error', async () => {
      component.userForm.patchValue({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '1234567890',
        emp_id: 'EMP001',
        password: 'Password1!',
        cpassword: 'Password1!',
        user_role: '1',
        client: '2000'
      });
      coreService.post.mockResolvedValueOnce({ status: 0, email: 'Email error' });
      await component.createUser();
      expect(coreService.toast).toHaveBeenCalledWith('error', 'Email error');
    });

    it('should handle status 0 with username error', async () => {
      component.userForm.patchValue({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '1234567890',
        emp_id: 'EMP001',
        password: 'Password1!',
        cpassword: 'Password1!',
        user_role: '1',
        client: '2000'
      });
      coreService.post.mockResolvedValueOnce({ status: 0, username: 'Username error' });
      await component.createUser();
      expect(coreService.toast).toHaveBeenCalledWith('error', 'Username error');
    });

    it('should set roleType to 1 for roles 1-6', async () => {
      component.userForm.patchValue({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '1234567890',
        emp_id: 'EMP001',
        password: 'Password1!',
        cpassword: 'Password1!',
        user_role: '5',
        client: '2000'
      });
      component.selectedYear = '2023';
      component.selectedSeason = '1';
      component.selectedState = [{ state_id: '1' }];
      component.selectedDist = [{ district_id: '1' }];
      coreService.post.mockResolvedValueOnce({ status: 1 });
      await component.createUser();
      expect(coreService.post).toHaveBeenCalledWith('users', expect.objectContaining({ roleType: '1' }));
    });

    it('should handle munichre single client', async () => {
      featureToggle.getContext.mockReturnValue('munichre');
      component.projectContext = 'munichre';
      component.userForm.patchValue({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '1234567890',
        emp_id: 'EMP001',
        password: 'Password1!',
        cpassword: 'Password1!',
        user_role: '1',
        client: '1000'
      });
      component.selected_clients = ['1000'];
      coreService.post.mockResolvedValueOnce({ status: 1 });
      await component.createUser();
      expect(coreService.post).toHaveBeenCalledWith('users', expect.objectContaining({ client: '1000' }));
    });

    it('should handle munichre multiple clients', async () => {
      featureToggle.getContext.mockReturnValue('munichre');
      component.projectContext = 'munichre';
      component.userForm.patchValue({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '1234567890',
        emp_id: 'EMP001',
        password: 'Password1!',
        cpassword: 'Password1!',
        user_role: '1',
        client: '1000'
      });
      component.selected_clients = ['1000', '2000'];
      coreService.post.mockResolvedValueOnce({ status: 1 });
      await component.createUser();
      expect(coreService.post).toHaveBeenCalledWith('users', expect.objectContaining({ client: ['1000', '2000'] }));
    });

    it('should handle role 4 client as array', async () => {
      component.userForm.patchValue({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '1234567890',
        emp_id: 'EMP001',
        password: 'Password1!',
        cpassword: 'Password1!',
        user_role: '4',
        client: '2000'
      });
      coreService.post.mockResolvedValueOnce({ status: 1 });
      await component.createUser();
      expect(coreService.post).toHaveBeenCalledWith('users', expect.objectContaining({ client: ['2000'] }));
    });

    it('should set agency to null if not roleType 2', async () => {
      component.userForm.patchValue({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '1234567890',
        emp_id: 'EMP001',
        password: 'Password1!',
        cpassword: 'Password1!',
        user_role: '1',
        client: '2000',
        roleType: '1',
        agency: 'agency1'
      });
      coreService.post.mockResolvedValueOnce({ status: 1 });
      await component.createUser();
      expect(coreService.post).toHaveBeenCalledWith('users', expect.objectContaining({ agency: null }));
    });
  });

  describe('onClientChange', () => {
    it('should handle single client', () => {
      component.allAgencies = [{ client: { UNIT_ID: '2000' } }];
      component.onClientChange('2000');
      expect(component.agencies).toEqual([{ client: { UNIT_ID: '2000' } }]);
    });

    it('should handle empty', () => {
      component.onClientChange([]);
      expect(component.agencies).toEqual([]);
    });
  });

  describe('open', () => {
    it('should open modal if valid', () => {
      component.userForm.patchValue({ user_role: '7', roleType: '2', agency: 'agency1' });
      component.open('content');
      expect(modalService.open).toHaveBeenCalled();
    });

    it('should toast if no roleType', () => {
      component.userForm.patchValue({ user_role: '7' });
      component.open('content');
      expect(coreService.toast).toHaveBeenCalledWith('warn', 'Please select Role Type');
      expect(modalService.open).not.toHaveBeenCalled();
    });

    it('should toast if no agency', () => {
      component.userForm.patchValue({ user_role: '7', roleType: '2' });
      component.open('content');
      expect(coreService.toast).toHaveBeenCalledWith('warn', 'Please select Agency');
      expect(modalService.open).not.toHaveBeenCalled();
    });

    it('should handle role 8 same as 7', () => {
      component.userForm.patchValue({ user_role: '8', roleType: '2', agency: 'agency1' });
      component.open('content');
      expect(modalService.open).toHaveBeenCalled();
    });
  });

  describe('openConfirmation', () => {
    it('should open modal and deactivate on yes', async () => {
      let resolveModal: (value: string) => void;
      modalService.open.mockReturnValue({ result: new Promise((resolve) => { resolveModal = resolve; }) });
      coreService.post.mockResolvedValueOnce({ status: 1 });
      const createUserSpy = jest.spyOn(component, 'createUser');
      component.openConfirmation('content', '1');
      resolveModal!('yes');
      await new Promise(process.nextTick);
      expect(recaptchaService.execute).toHaveBeenCalledWith('deactivate_user');
      expect(coreService.post).toHaveBeenCalledWith('users', { purpose: 'deactivate_user', user_id: '1', platform: 'web', captcha_token: 'mock-token' });
      expect(createUserSpy).toHaveBeenCalled();
    });

    it('should handle deactivate error', async () => {
      let resolveModal: (value: string) => void;
      modalService.open.mockReturnValue({ result: new Promise((resolve) => { resolveModal = resolve; }) });
      coreService.post.mockRejectedValueOnce(new Error('error'));
      component.openConfirmation('content', '1');
      resolveModal!('yes');
      await new Promise(process.nextTick);
      expect(coreService.toast).toHaveBeenCalledWith('error', 'Unable to deactivate user');
    });

    it('should handle status not 1', async () => {
      let resolveModal: (value: string) => void;
      modalService.open.mockReturnValue({ result: new Promise((resolve) => { resolveModal = resolve; }) });
      coreService.post.mockResolvedValueOnce({ status: 0, message: 'Error' });
      component.openConfirmation('content', '1');
      resolveModal!('yes');
      await new Promise(process.nextTick);
      expect(coreService.toast).toHaveBeenCalledWith('error', 'Error');
    });
  });

  describe('onAgencyChange', () => {
    it('should reset locations', () => {
      component.onAgencyChange('agency1');
      expect(component.selectedState).toEqual([]);
      expect(component.selectedDist).toEqual([]);
      expect(component.selectedtehsil).toEqual([]);
      expect(component.statesData).toEqual([]);
      expect(component.districtData).toEqual([]);
      expect(component.tehsilsData).toEqual([]);
      expect(component.singleState).toBe('');
      expect(component.singleDist).toBe('');
    });
  });

  describe('onYearSelect', () => {
    it('should reset locations and call loadAgencyLocation', () => {
      const loadSpy = jest.spyOn(component, 'loadAgencyLocation');
      component.onYearSelect('2023');
      expect(component.selectedState).toEqual([]);
      expect(component.selectedDist).toEqual([]);
      expect(component.selectedtehsil).toEqual([]);
      expect(component.statesData).toEqual([]);
      expect(component.districtData).toEqual([]);
      expect(component.tehsilsData).toEqual([]);
      expect(component.singleState).toBe('');
      expect(component.singleDist).toBe('');
      expect(loadSpy).toHaveBeenCalled();
    });
  });

  describe('onSeasonSelect', () => {
    it('should reset locations and call loadAgencyLocation', () => {
      const loadSpy = jest.spyOn(component, 'loadAgencyLocation');
      component.onSeasonSelect('1');
      expect(component.selectedState).toEqual([]);
      expect(component.selectedDist).toEqual([]);
      expect(component.selectedtehsil).toEqual([]);
      expect(component.statesData).toEqual([]);
      expect(component.districtData).toEqual([]);
      expect(component.tehsilsData).toEqual([]);
      expect(component.singleState).toBe('');
      expect(component.singleDist).toBe('');
      expect(loadSpy).toHaveBeenCalled();
    });
  });

  describe('loadAgencyLocation', () => {
    it('should not call if no year or season', async () => {
      component.selectedYear = null;
      await component.loadAgencyLocation();
      expect(filterService.getAgencyWiseLocation).not.toHaveBeenCalled();
      expect(component.isStateLoading).toBe(0);
    });

    it('should fetch and set locations for saksham', async () => {
      component.userForm.patchValue({ roleType: '2', user_role: '7', agency: 'agency1' });
      component.projectContext = 'saksham';
      component.selectedYear = '2023';
      component.selectedSeason = '1';
      component.selected_clients = ['2000'];
      await component.loadAgencyLocation();
      expect(filterService.getAgencyWiseLocation).toHaveBeenCalledWith(expect.objectContaining({ client: '2000', agency: ['agency1'] }), component.userDetails);
      expect(component.statesData).toEqual([{ state_id: '1' }]);
      expect(component.clientStates).toEqual([{ state_id: '1' }]);
      expect(component.clientDistricts).toEqual([]);
      expect(component.clientTehsils).toEqual([]);
      expect(component.isStateLoading).toBe(0);
    });

    it('should handle agency 0 if roleType not 2', async () => {
      component.userForm.patchValue({ roleType: '1', user_role: '1' });
      component.projectContext = 'saksham';
      component.selectedYear = '2023';
      component.selectedSeason = '1';
      await component.loadAgencyLocation();
      expect(filterService.getAgencyWiseLocation).toHaveBeenCalledWith(expect.objectContaining({ agency: '0' }), component.userDetails);
    });
  });
});