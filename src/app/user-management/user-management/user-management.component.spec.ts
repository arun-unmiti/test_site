import 'zone.js/bundles/zone-testing-bundle.umd.js';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModule, NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { TableModule } from 'primeng/table';
import { MultiSelectModule } from 'primeng/multiselect';
import { of, throwError, Subject } from 'rxjs';

import { UserManagementComponent } from './user-management.component';
import { CoreService } from 'src/app/utilities/core.service';
import { FilterService } from 'src/app/utilities/filter.service';
import { UserDetailService } from 'src/app/auth/user-detail.service';
import { FeatureToggleService } from '../../shared/services/feature-toggle.service';

// Mock Services
class MockCoreService {
  post = jest.fn().mockResolvedValue({ status: 1 });
  dashboard_post = jest.fn().mockResolvedValue({ status: 1 });
  clone = jest.fn(obj => JSON.parse(JSON.stringify(obj)));
  toast = jest.fn();
  exportExcel = jest.fn();
}

class MockFilterService {
  isLoactionFetched = true;
  fetchedLocationData = { subscribe: jest.fn() };
  clients = [{ UNIT_ID: '2000', UNIT_NAME: 'Client1' }];
  years = [{ id: '2023', year: '2023' }];
  seasons = [{ id: '1', season_name: 'Season1' }];
  states = [{ state_id: '1' }];
  districts = [{ district_id: '1' }];
  tehsils = [{ tehsil_id: '1' }];
  blocks = [{ block_id: '1' }];
  getAgencyWiseLocation = jest.fn().mockResolvedValue({ states: [], districts: [], tehsils: [] });
}

class MockUserDetailService {
  getUserDetail = jest.fn(() => ({ user_role: '1', unit_id: '2000', agency_id: 'agency1' }));
  getcsrfTokenName = jest.fn(() => 'csrf_name');
  getcsrfToken = jest.fn(() => 'csrf_token');
  getLocation = jest.fn(() => ({ states: [1], districts: [1] }));
}

class MockFeatureToggleService {
  getContext = jest.fn(() => 'saksham');
}

class MockNgbModal {
  open = jest.fn().mockReturnValue({ result: Promise.resolve('Save click') });
  dismissAll = jest.fn();
}

describe('UserManagementComponent', () => {
  let component: UserManagementComponent;
  let fixture: ComponentFixture<UserManagementComponent>;
  let coreService: any;
  let filterService: any;
  let userService: any;
  let featureToggle: any;
  let modalService: any;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UserManagementComponent],
      imports: [
        HttpClientTestingModule,
        FormsModule,
        ReactiveFormsModule,
        NgbModule,
        TableModule,
        MultiSelectModule,
      ],
      providers: [
        { provide: CoreService, useClass: MockCoreService },
        { provide: FilterService, useClass: MockFilterService },
        { provide: UserDetailService, useClass: MockUserDetailService },
        { provide: FeatureToggleService, useClass: MockFeatureToggleService },
        { provide: NgbModal, useClass: MockNgbModal },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(UserManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    coreService = TestBed.inject(CoreService);
    filterService = TestBed.inject(FilterService);
    userService = TestBed.inject(UserDetailService);
    featureToggle = TestBed.inject(FeatureToggleService);
    modalService = TestBed.inject(NgbModal);
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should set userDetail and call methods', () => {
      const userRoleSpy = jest.spyOn(component, 'userRole');
      component.ngOnInit();
      expect(component.userDetail).toEqual(expect.objectContaining({ user_role: '1' }));
      expect(userRoleSpy).toHaveBeenCalled();
      expect(component.csrfTokenName).toBe('csrf_name');
      expect(component.csrfToken).toBe('csrf_token');
    });

    it('should set singleClient if unit_id exists', () => {
      userService.getUserDetail.mockReturnValueOnce({ user_role: '1', unit_id: '1000' });
      component.ngOnInit();
      expect(component.singleClient).toBe('1000');
    });

    it('should set isMandatory true for roles 5,6,7', () => {
      userService.getUserDetail.mockReturnValueOnce({ user_role: '5' });
      component.ngOnInit();
      expect(component.isMandentory).toBe(true);
    });

    it('should call setFilterValue if isLocationFetched true', () => {
      const setFilterValueSpy = jest.spyOn(component, 'setFilterValue');
      component.ngOnInit();
      expect(setFilterValueSpy).toHaveBeenCalled();
    });

    it('should subscribe to fetchedLocationData if isLocationFetched false', () => {
      filterService.isLoactionFetched = false;
      const subject = new Subject<void>();
      filterService.fetchedLocationData.subscribe = jest.fn(callback => subject.subscribe(callback));
      const setFilterValueSpy = jest.spyOn(component, 'setFilterValue');
      component.ngOnInit();
      subject.next();
      expect(setFilterValueSpy).toHaveBeenCalled();
    });
  });

  describe('userRole', () => {
    it('should fetch roles', async () => {
      coreService.post.mockResolvedValueOnce({ status: 1, all_roles: [{ role_id: '1' }] });
      await component.userRole();
      expect(component.roles).toEqual([{ role_id: '1' }]);
    });

    it('should filter roles based on user_role not 1', async () => {
      userService.getUserDetail.mockReturnValueOnce({ user_role: '3' });
      coreService.post.mockResolvedValueOnce({ status: 1, all_roles: [{ role_id: '3', can_add: [{ role_id: '5' }] }] });
      component.userDetail = { user_role: '3' };
      await component.userRole();
      expect(component.roles).toEqual([{ role_id: '5' }]);
    });
  });

  describe('getUserData', () => {
    it('should handle params', async () => {
      coreService.post.mockResolvedValueOnce({ status: 1, users: [{ role_id: '5' }] });
      coreService.post.mockResolvedValueOnce({ status: 1, all_agencies: [] });
      coreService.post.mockResolvedValueOnce({ status: 1, users: [{ role_id: '5' }] });
      await component.getUserData({ param: 'test' });
      expect(coreService.post).toHaveBeenCalledWith({ purpose: 'userslist', param: 'test' });
    });

    it('should handle status !=1', async () => {
      coreService.post.mockResolvedValueOnce({ status: 0 });
      coreService.post.mockResolvedValueOnce({ status: 1 });
      coreService.post.mockResolvedValueOnce({ status: 0 });
      await component.getUserData();
      expect(component.userList).toEqual([]);
      expect(component.allUsersList).toEqual([]);
    });
  });

  describe('setFilterValue', () => {
    it('should set filter values', () => {
      component.setFilterValue();
      expect(component.clients).toEqual([{ UNIT_ID: '2000', UNIT_NAME: 'Client1' }]);
    });

    it('should call setDefaultLocation and onSearch for roles 1-4', () => {
      const setDefaultLocationSpy = jest.spyOn(component, 'setDefaultLocation');
      const onSearchSpy = jest.spyOn(component, 'onSearch');
      component.userDetail = { user_role: '2' };
      component.setFilterValue();
      expect(setDefaultLocationSpy).toHaveBeenCalled();
      expect(onSearchSpy).toHaveBeenCalled();
    });
  });

  describe('onStateChange', () => {
    it('should set district options', () => {
      component.clientDistricts = [{ state_id: '1' }];
      component.onStateChange([{ state_id: '1' }]);
      expect(component.districtOptions[0].items).toEqual([{ state_id: '1' }]);
    });

    it('should reset districts and blocks if no event', () => {
      component.onStateChange([]);
      expect(component.districtOptions).toEqual([]);
      expect(component.blockOptions).toEqual([]);
    });
  });

  describe('getDistrictData', () => {
    it('should fetch districts', async () => {
      coreService.post.mockResolvedValueOnce({ status: 1, lkp_district: [{ district_id: '1' }] });
      await component.getDistrictData(['1']);
      expect(component.districtData).toEqual([{ district_id: '1' }]);
    });

    it('should handle multiple states', async () => {
      coreService.post.mockResolvedValueOnce({ status: 1, lkp_district: [{ district_id: '1' }] });
      coreService.post.mockResolvedValueOnce({ status: 1, lkp_district: [{ district_id: '2' }] });
      await component.getDistrictData(['1', '2']);
      expect(component.districtData).toEqual([{ district_id: '1' }, { district_id: '2' }]);
    });

    it('should handle status !=1', async () => {
      coreService.post.mockResolvedValueOnce({ status: 0 });
      await component.getDistrictData(['1']);
      expect(component.districtData).toEqual([]);
    });
  });

  describe('onDistrictChange', () => {
    it('should set block options', () => {
      component.clientTehsils = [{ district_id: '1' }];
      component.onDistrictChange([{ district_id: '1' }]);
      expect(component.blockOptions[0].items).toEqual([{ district_id: '1' }]);
    });
  });

  describe('onSearch', () => {
    it('should toast warn if mandatory year missing', () => {
      component.isMandentory = true;
      component.selectedYear = '';
      component.onSearch();
      expect(coreService.toast).toHaveBeenCalledWith('warn', 'Please select year');
    });

    it('should toast warn if mandatory season missing', () => {
      component.isMandentory = true;
      component.selectedYear = '2023';
      component.selectedSeason = '';
      component.onSearch();
      expect(coreService.toast).toHaveBeenCalledWith('warn', 'Please select season');
    });

    it('should toast warn if role missing for roles 5,6', () => {
      component.userDetail = { user_role: '5' };
      component.selectedRole = '';
      component.onSearch();
      expect(coreService.toast).toHaveBeenCalledWith('warn', 'Please select role type');
    });

    it('should toast warn if agency missing for off-role', () => {
      component.userDetail = { user_role: '5' };
      component.selectedRole = 2;
      component.selectedAgency = [];
      component.onSearch();
      expect(coreService.toast).toHaveBeenCalledWith('warn', 'Please select agency');
    });

    it('should fetch users with filters', async () => {
      component.userDetail = { user_role: '1' };
      component.selectedState = [{ state_id: '1' }];
      component.selectedDistrict = [{ district_id: '1' }];
      component.selectedBlock = [{ tehsil_id: '1' }];
      component.selectedRole = '1';
      component.selectedAgency = [{ agency_id: '1' }];
      component.singleClient = '2000';
      component.selectedYear = '2023';
      component.selectedSeason = '1';
      component.selectedStatus = '1';
      component.mobileNumber = '1234567890';
      coreService.post.mockResolvedValueOnce({ status: 1, users: [{ role_id: '2', first_name: 'John', last_name: 'Doe', status: '1' }] });
      const resetTableSpy = jest.spyOn(component, 'resetTable');
      await component.onSearch();
      expect(resetTableSpy).toHaveBeenCalled();
      expect(component.userList[0].fullName).toBe('John Doe');
    });

    it('should set roll for role 7 with agency', async () => {
      component.userDetail = { user_role: '7', agency_id: '1' };
      coreService.post.mockResolvedValueOnce({ status: 1, users: [] });
      await component.onSearch();
      expect(coreService.post).toHaveBeenLastCalledWith(expect.objectContaining({ roll: '2' }));
    });

    it('should unset roll for role 7 without agency', async () => {
      component.userDetail = { user_role: '7' };
      coreService.post.mockResolvedValueOnce({ status: 1, users: [] });
      await component.onSearch();
      expect(coreService.post).toHaveBeenLastCalledWith(expect.not.objectContaining({ roll: expect.anything() }));
    });

    it('should filter userList excluding own role', async () => {
      component.userDetail = { user_role: '1' };
      coreService.post.mockResolvedValueOnce({ status: 1, users: [{ role_id: '1' }, { role_id: '2' }] });
      await component.onSearch();
      expect(component.userList.length).toBe(1);
      expect(component.userList[0].role_id).toBe('2');
    });

    it('should call getUserData if no filters', async () => {
      component.projectContext = 'munichre';
      component.userDetail = { user_role: '3' };
      component.mobileNumber = '';
      component.selectedState = [];
      component.selectedDistrict = [];
      component.selectedBlock = [];
      component.selectedRole = '';
      component.selectedAgency = [];
      component.singleClient = '';
      component.selectedYear = '';
      component.selectedSeason = '';
      component.selectedStatus = '';
      const getUserDataSpy = jest.spyOn(component, 'getUserData');
      await component.onSearch();
      expect(getUserDataSpy).toHaveBeenCalled();
    });

    it('should handle status !=1', async () => {
      coreService.post.mockResolvedValueOnce({ status: 0 });
      await component.onSearch();
      expect(component.userList).toEqual([]);
    });

    it('should delete empty location arrays', async () => {
      component.userDetail = { user_role: '1' };
      component.selectedState = [];
      coreService.post.mockResolvedValueOnce({ status: 1, users: [] });
      await component.onSearch();
      expect(coreService.post).toHaveBeenLastCalledWith(expect.not.objectContaining({ states: expect.anything() }));
    });

    it('should filter for unit_id', async () => {
      component.userDetail = { unit_id: '2000', user_role: '3' };
      coreService.post.mockResolvedValueOnce({ status: 1, users: [{ role_id: '3' }, { role_id: '5' }] });
      await component.onSearch();
      expect(component.userList.length).toBe(1);
      expect(component.userList[0].role_id).toBe('5');
    });
  });

  describe('setStatus', () => {
    it('should set status', async () => {
      component.userList = [{ user_id: '1', checked: true, role_id: '5' }];
      coreService.post.mockResolvedValueOnce({ status: 1, msg: 'Success' });
      const onSearchSpy = jest.spyOn(component, 'onSearch');
      await component.setStatus(1);
      expect(coreService.toast).toHaveBeenCalledWith('success', 'Success');
      expect(onSearchSpy).toHaveBeenCalled();
    });

    it('should handle status !=1', async () => {
      coreService.post.mockResolvedValueOnce({ status: 0, msg: 'Error' });
      await component.setStatus(1);
      expect(coreService.toast).toHaveBeenCalledWith('error', 'Error');
    });
  });

  describe('open', () => {
    it('should handle dismiss', fakeAsync(() => {
      modalService.open.mockReturnValueOnce({ result: Promise.reject(ModalDismissReasons.ESC) });
      component.open('content', { user_id: '1' });
      tick();
      expect(component.closeResult).toBe('Dismissed by pressing ESC');
    }));

    it('should handle backdrop dismiss', fakeAsync(() => {
      modalService.open.mockReturnValueOnce({ result: Promise.reject(ModalDismissReasons.BACKDROP_CLICK) });
      component.open('content', { user_id: '1' });
      tick();
      expect(component.closeResult).toBe('Dismissed by clicking on a backdrop');
    }));

    it('should handle other dismiss', fakeAsync(() => {
      modalService.open.mockReturnValueOnce({ result: Promise.reject('reason') });
      component.open('content', { user_id: '1' });
      tick();
      expect(component.closeResult).toBe('Dismissed with: reason');
    }));

    it('should handle error in fetching user details', async () => {
      coreService.post.mockRejectedValueOnce(new Error('Error'));
      coreService.post.mockResolvedValueOnce({ status: 1 });
      await component.open('content', { user_id: '1' });
      // Catch block empty
    });

    it('should handle status !=1 for user details', async () => {
      coreService.post.mockResolvedValueOnce({ status: 0 });
      coreService.post.mockResolvedValueOnce({ status: 1 });
      await component.open('content', { user_id: '1' });
      expect(component.selectedUser.email).toBeUndefined();
    });

    it('should handle no agency in user details', async () => {
      coreService.post.mockResolvedValueOnce({ status: 1, user_details: { agency: null } });
      coreService.post.mockResolvedValueOnce({ status: 1 });
      await component.open('content', { user_id: '1' });
      expect(component.selectedUser.client_id).toBeUndefined();
    });
  });

  describe('allowOnlyNumbers', () => {
    it('should allow numbers', () => {
      const event = { keyCode: 49, preventDefault: jest.fn() } as any;
      component.allowOnlyNumbers(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should prevent non-numbers', () => {
      const event = { keyCode: 65, preventDefault: jest.fn() } as any;
      component.allowOnlyNumbers(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });
  });

  describe('confirm', () => {
    it('should open confirm modal', () => {
      component.confirm('content', 1);
      expect(modalService.open).toHaveBeenCalledWith('content', { ariaLabelledBy: 'modal-basic-title', size: 'lg' });
      expect(component.bulk_status).toBe(1);
      expect(component.bulk_msg).toBe('active');
    });

    it('should set inactive msg', () => {
      component.confirm('content', 0);
      expect(component.bulk_msg).toBe('inactive');
    });
  });

  describe('getDismissReason', () => {
    it('should return ESC reason', () => {
      expect((component as any).getDismissReason(ModalDismissReasons.ESC)).toBe('by pressing ESC');
    });

    it('should return backdrop reason', () => {
      expect((component as any).getDismissReason(ModalDismissReasons.BACKDROP_CLICK)).toBe('by clicking on a backdrop');
    });

    it('should return other reason', () => {
      expect((component as any).getDismissReason('reason')).toBe('with: reason');
    });
  });

  describe('onChange', () => {
    it('should reset agency_id', () => {
      component.selectedUser.agency_id = '1';
      component.onChange('event');
      expect(component.selectedUser.agency_id).toBe('');
    });
  });

  describe('update', () => {
    it('should toast error if invalid phone', () => {
      component.selectedUser = { phone: 'abc', emp_id: 'EMP001' };
      component.update();
      expect(coreService.toast).toHaveBeenCalledWith('error', 'Enter valid Mobile Number');
    });

    it('should toast error if emp_id missing', () => {
      component.selectedUser = { phone: '1234567890', emp_id: '' };
      component.update();
      expect(coreService.toast).toHaveBeenCalledWith('error', 'Enter Employee Id');
    });

    it('should delete role_type and agency_id if not 7 or 8', async () => {
      component.selectedUser = { phone: '1234567890', emp_id: 'EMP001', role: '1', role_type: '2', agency_id: '1' };
      coreService.post.mockResolvedValueOnce({ status: 1, msg: 'Success' });
      await component.update();
      expect(coreService.post).toHaveBeenLastCalledWith(expect.not.objectContaining({ role_type: expect.anything(), agency_id: expect.anything() }));
    });

    it('should update user', async () => {
      component.selectedUser = { phone: '1234567890', emp_id: 'EMP001', role: '7', role_type: '2', agency_id: '1' };
      coreService.post.mockResolvedValueOnce({ status: 1, msg: 'Success' });
      const onSearchSpy = jest.spyOn(component, 'onSearch');
      await component.update();
      expect(coreService.toast).toHaveBeenCalledWith('success', 'Success');
      expect(onSearchSpy).toHaveBeenCalled();
    });

    it('should handle status=0 with email error', async () => {
      component.selectedUser = { phone: '1234567890', emp_id: 'EMP001', role: '7' };
      coreService.post.mockResolvedValueOnce({ status: 0, email: 'Email error' });
      await component.update();
      expect(coreService.toast).toHaveBeenCalledWith('error', 'Email error');
    });

    it('should handle status=0 with phone error', async () => {
      component.selectedUser = { phone: '1234567890', emp_id: 'EMP001', role: '7' };
      coreService.post.mockResolvedValueOnce({ status: 0, phone: 'Phone error' });
      await component.update();
      expect(coreService.toast).toHaveBeenCalledWith('error', 'Phone error');
    });

    it('should handle general error', async () => {
      component.selectedUser = { phone: '1234567890', emp_id: 'EMP001', role: '7' };
      coreService.post.mockResolvedValueOnce({ status: 0 });
      await component.update();
      expect(coreService.toast).toHaveBeenCalledWith('error', 'something went wrong');
    });

    it('should handle catch error', async () => {
      component.selectedUser = { phone: '1234567890', emp_id: 'EMP001', role: '7' };
      coreService.post.mockRejectedValueOnce(new Error('Error'));
      await component.update();
      // Console.log in catch, but no toast
    });
  });

  describe('changeStatus', () => {
    it('should change status', async () => {
      const user = { user_id: '1' };
      coreService.post.mockResolvedValueOnce({ status: 1, msg: 'Success' });
      const onSearchSpy = jest.spyOn(component, 'onSearch');
      await component.changeStatus(user, 1);
      expect(coreService.toast).toHaveBeenCalledWith('success', 'Success');
      expect(onSearchSpy).toHaveBeenCalled();
    });

    it('should handle status !=1', async () => {
      coreService.post.mockResolvedValueOnce({ status: 0, msg: 'Error' });
      await component.changeStatus({ user_id: '1' }, 1);
      expect(coreService.toast).toHaveBeenCalledWith('error', 'Error');
    });
  });

  describe('resetPassword', () => {
    it('should reset password', async () => {
      const user = { user_id: '1' };
      coreService.post.mockResolvedValueOnce({ status: 1, msg: 'Success' });
      const onSearchSpy = jest.spyOn(component, 'onSearch');
      await component.resetPassword(user);
      expect(coreService.toast).toHaveBeenCalledWith('success', 'Success');
      expect(onSearchSpy).toHaveBeenCalled();
    });

    it('should handle status=0 with email error', async () => {
      coreService.post.mockResolvedValueOnce({ status: 0, email: 'Email error' });
      await component.resetPassword({ user_id: '1' });
      expect(coreService.toast).toHaveBeenCalledWith('error', 'Email error');
    });

    it('should handle status=0 with phone error', async () => {
      coreService.post.mockResolvedValueOnce({ status: 0, phone: 'Phone error' });
      await component.resetPassword({ user_id: '1' });
      expect(coreService.toast).toHaveBeenCalledWith('error', 'Phone error');
    });

    it('should handle general error', async () => {
      coreService.post.mockResolvedValueOnce({ status: 0 });
      await component.resetPassword({ user_id: '1' });
      expect(coreService.toast).toHaveBeenCalledWith('error', 'something went wrong');
    });
  });

  describe('reset2FA', () => {
    it('should reset 2FA', async () => {
      component.selectedUser = { user_id: '1' };
      component.userDetail = { user_id: '2', user_role: '1' };
      coreService.post.mockResolvedValueOnce({ status: 1, msg: 'Success' });
      const onSearchSpy = jest.spyOn(component, 'onSearch');
      await component.reset2FA();
      expect(coreService.toast).toHaveBeenCalledWith('success', 'Success');
      expect(onSearchSpy).toHaveBeenCalled();
    });

    it('should handle status !=1', async () => {
      coreService.post.mockResolvedValueOnce({ status: 0, msg: 'Error' });
      await component.reset2FA();
      expect(coreService.toast).toHaveBeenCalledWith('error', 'Error');
    });
  });

  describe('exportTable', () => {
    it('should export table for munichre', () => {
      component.projectContext = 'munichre';
      const data: any[] = [];
      component.exportTable(data, 'Users');
      expect(coreService.exportExcel).toHaveBeenCalledWith(data, expect.arrayContaining([{ field: 'user_id', header: 'User Id' }]), 'Users');
    });

    it('should export table for others', () => {
      component.projectContext = 'saksham';
      const data: any[] = [];
      component.exportTable(data, 'Users');
      expect(coreService.exportExcel).toHaveBeenCalledWith(data, expect.arrayContaining([{ field: 'emp_id', header: 'Employee ID' }]), 'Users');
    });
  });

  describe('exportAllUsers', () => {
    it('should export all users for others', () => {
      component.projectContext = 'saksham';
      component.allUsersList = [];
      component.exportAllUsers();
      expect(coreService.exportExcel).toHaveBeenCalledWith([], expect.any(Array), 'AllUsers');
    });

    it('should handle download error for munichre', async () => {
      component.projectContext = 'munichre';
      coreService.post.mockRejectedValueOnce({ message: 'Error' });
      await expect(component.exportAllUsers()).rejects.toThrow('Failed to download file: Error');
    });
  });

  describe('clear', () => {
    it('should clear table', () => {
      const table: any = { clear: jest.fn() };
      component.clear(table);
      expect(table.clear).toHaveBeenCalled();
    });
  });

  describe('onSelectUser', () => {
    it('should select user', () => {
      component.userList = [{ role_id: '5', checked: true }];
      component.onSelectUser({ user_id: '1' });
      expect(component.allChecked).toBe(true);
      expect(component.selectedUserIdArray).toEqual(['1']);
    });

    it('should deselect user', () => {
      component.selectedUserIdArray = ['1'];
      component.onSelectUser({ user_id: '1' });
      expect(component.selectedUserIdArray).toEqual([]);
    });

    it('should set allChecked false if not all checked', () => {
      component.userList = [{ role_id: '5', checked: false }, { role_id: '5', checked: true }];
      component.onSelectUser({ user_id: '1' });
      expect(component.allChecked).toBe(false);
    });
  });

  describe('getStatus', () => {
    it('should get status name', () => {
      expect(component.getStatus(2)).toBe('Pending Approval');
      expect(component.getStatus(1)).toBe('Active');
      expect(component.getStatus(0)).toBe('In-active');
    });
  });

  describe('onAllChecked', () => {
    it('should check all non-role1', () => {
      component.userList = [{ role_id: '1', checked: false }, { role_id: '5', checked: false }];
      component.onAllChecked(true);
      expect(component.userList[0].checked).toBe(false);
      expect(component.userList[1].checked).toBe(true);
    });
  });

  describe('get canActiveInActive', () => {
    it('should return true if any non-role1 checked', () => {
      component.userList = [{ role_id: '5', checked: true }];
      expect(component.canActiveInActive).toBe(true);
    });

    it('should return false if no non-role1 checked', () => {
      component.userList = [{ role_id: '1', checked: true }, { role_id: '5', checked: false }];
      expect(component.canActiveInActive).toBe(false);
    });
  });

  describe('OnRoleTypeChange', () => {
    it('should handle role type change', () => {
      const loadAgencyLocationSpy = jest.spyOn(component, 'loadAgencyLocation');
      component.OnRoleTypeChange('1');
      expect(loadAgencyLocationSpy).toHaveBeenCalled();
    });

    it('should reset for off-role without calling load', () => {
      const loadAgencyLocationSpy = jest.spyOn(component, 'loadAgencyLocation');
      component.OnRoleTypeChange('2');
      expect(loadAgencyLocationSpy).not.toHaveBeenCalled();
      expect(component.selectedAgency).toEqual([]);
    });

    it('should not reset agency for role 7', () => {
      component.userDetail = { user_role: '7' };
      component.selectedAgency = [{ agency_id: '1' }];
      component.OnRoleTypeChange('1');
      expect(component.selectedAgency).toEqual([{ agency_id: '1' }]);
    });
  });

  describe('onClientChange', () => {
    it('should filter by user agency_id', () => {
      component.userDetail = { agency_id: '2' };
      component.clientAgencies = [{ client: { UNIT_ID: '2000' }, agency_id: '1' }, { client: { UNIT_ID: '2000' }, agency_id: '2' }];
      component.onClientChange('2000');
      expect(component.clientAgency).toEqual([{ client: { UNIT_ID: '2000' }, agency_id: '2' }]);
    });

    it('should reset userList if not isNotFilter', () => {
      component.userList = [{}];
      component.onClientChange('2000');
      expect(component.userList).toEqual([]);
    });

    it('should not reset userList if isNotFilter', () => {
      component.userList = [{}];
      component.onClientChange('2000', true);
      expect(component.userList).toEqual([{}]);
    });
  });

  describe('resetTable', () => {
    it('should reset table', () => {
      component.first = 10;
      component.resetTable();
      expect(component.first).toBe(0);
    });
  });

  describe('getAgencues', () => {
    it('should get agencies', async () => {
      coreService.post.mockResolvedValueOnce({ status: 1, all_agencies: [{ agency_id: '1' }] });
      await component.getAgencues();
      expect(component.agencies).toEqual([{ agency_id: '1' }]);
    });

    it('should handle error', async () => {
      coreService.post.mockRejectedValueOnce(new Error('Error'));
      await component.getAgencues();
      // Console.log in catch
    });

    it('should handle status !=1', async () => {
      coreService.post.mockResolvedValueOnce({ status: 0 });
      await component.getAgencues();
      expect(component.agencies).toEqual([]);
    });
  });

  describe('setDefaultLocation', () => {
    it('should set default location', () => {
      component.states = [{ state_id: '1' }];
      userService.getLocation.mockReturnValueOnce({ states: [1], districts: [1] });
      component.districts = [{ district_id: '1' }];
      const onStateChangeSpy = jest.spyOn(component, 'onStateChange');
      const onDistrictChangeSpy = jest.spyOn(component, 'onDistrictChange');
      component.setDefaultLocation();
      expect(component.selectedState).toEqual([{ state_id: '1' }]);
      expect(onStateChangeSpy).toHaveBeenCalled();
      expect(onDistrictChangeSpy).toHaveBeenCalled();
    });

    it('should not set districts if no districts in location', () => {
      userService.getLocation.mockReturnValueOnce({ states: [1] });
      const onDistrictChangeSpy = jest.spyOn(component, 'onDistrictChange');
      component.setDefaultLocation();
      expect(onDistrictChangeSpy).not.toHaveBeenCalled();
    });

    it('should set agency for role 7 with agency', () => {
      component.userDetail = { user_role: '7', agency_id: '1' };
      component.setDefaultLocation();
      expect(component.selectedAgency).toEqual(['1']);
    });
  });

  describe('onYearSelect', () => {
    it('should handle year select', () => {
      const getAgencyDataSpy = jest.spyOn(component, 'getAgencyData');
      component.onYearSelect('2023');
      expect(getAgencyDataSpy).toHaveBeenCalled();
    });

    it('should reset locations and agencies', () => {
      component.onYearSelect('2023');
      expect(component.userList).toEqual([]);
      expect(component.agencies).toEqual([]);
      expect(component.selectedState).toEqual([]);
    });

    it('should not reset role and agency for role 7', () => {
      component.userDetail = { user_role: '7' };
      component.selectedRole = '1';
      component.selectedAgency = [{ agency_id: '1' }];
      component.onYearSelect('2023');
      expect(component.selectedRole).toBe('1');
      expect(component.selectedAgency).toEqual([{ agency_id: '1' }]);
    });
  });

  describe('onSeasonSelect', () => {
    it('should handle season select', () => {
      const getAgencyDataSpy = jest.spyOn(component, 'getAgencyData');
      component.onSeasonSelect('1');
      expect(getAgencyDataSpy).toHaveBeenCalled();
    });
  });

  describe('onSingleClinetChange', () => {
    it('should handle client change', () => {
      const getAgencyDataSpy = jest.spyOn(component, 'getAgencyData');
      component.onSingleClinetChange('2000');
      expect(getAgencyDataSpy).toHaveBeenCalled();
    });
  });

  describe('loadAgencyLocation', () => {
    it('should load agency location', async () => {
      filterService.getAgencyWiseLocation.mockResolvedValueOnce({ states: [{ state_id: '1' }] });
      await component.loadAgencyLocation();
      expect(component.states).toEqual([{ state_id: '1' }]);
    });
  });

  describe('getAgencyData', () => {
    it('should get agency data', async () => {
      component.singleClient = '2000';
      component.selectedYear = '2023';
      component.selectedSeason = '1';
      coreService.dashboard_post.mockResolvedValueOnce({ status: 1, all_agencies: [{ agency_id: '1' }] });
      await component.getAgencyData();
      expect(component.agencies).toEqual([{ agency_id: '1' }]);
    });

    it('should handle role 7 with agency', async () => {
      component.userDetail = { user_role: '7', agency_id: '2' };
      component.singleClient = '2000';
      component.selectedYear = '2023';
      component.selectedSeason = '1';
      coreService.dashboard_post.mockResolvedValueOnce({ status: 1, all_agencies: [{ agency_id: '2' }, { agency_id: '3' }] });
      const onAgencyChangeSpy = jest.spyOn(component, 'onAgencyChange');
      await component.getAgencyData();
      expect(onAgencyChangeSpy).toHaveBeenCalledWith([{ agency_id: '2' }]);
    });

    it('should not fetch if missing required fields', async () => {
      component.singleClient = '';
      await component.getAgencyData();
      expect(coreService.dashboard_post).not.toHaveBeenCalled();
    });

    it('should handle error', async () => {
      component.singleClient = '2000';
      component.selectedYear = '2023';
      component.selectedSeason = '1';
      coreService.dashboard_post.mockRejectedValueOnce(new Error('Error'));
      await component.getAgencyData();
      // Console.log in catch
    });

    it('should handle status !=1', async () => {
      component.singleClient = '2000';
      component.selectedYear = '2023';
      component.selectedSeason = '1';
      coreService.dashboard_post.mockResolvedValueOnce({ status: 0 });
      await component.getAgencyData();
      expect(component.agencies).toEqual([]);
    });
  });

  describe('onAgencyChange', () => {
    it('should handle agency change', async () => {
      const loadAgencyLocationSpy = jest.spyOn(component, 'loadAgencyLocation');
      await component.onAgencyChange([{ agency_id: '1' }]);
      expect(loadAgencyLocationSpy).toHaveBeenCalledWith(['1']);
    });

    it('should reset locations', async () => {
      await component.onAgencyChange([]);
      expect(component.states).toEqual([]);
      expect(component.selectedState).toEqual([]);
    });
  });

  describe('get isRoleValid', () => {
    it('should return true if missing required', () => {
      component.selectedYear = '';
      expect(component.isRoleValid).toBe(true);
    });

    it('should return false if all present', () => {
      component.selectedYear = '2023';
      component.selectedSeason = '1';
      component.singleClient = '2000';
      expect(component.isRoleValid).toBe(false);
    });
  });

  describe('get isAgencyValid', () => {
    it('should return true if missing required or not off-role', () => {
      component.selectedRole = '1';
      expect(component.isAgencyValid).toBe(true);
    });

    it('should return false if all present and off-role', () => {
      component.selectedYear = '2023';
      component.selectedSeason = '1';
      component.singleClient = '2000';
      component.selectedRole = 2;
      expect(component.isAgencyValid).toBe(false);
    });
  });

  describe('get isLocationValid', () => {
    it('should return true if missing required', () => {
      component.selectedYear = '';
      expect(component.isLocationValid).toBe(true);
    });

    it('should return false if all present and (on-role or agencies selected)', () => {
      component.selectedYear = '2023';
      component.selectedSeason = '1';
      component.singleClient = '2000';
      component.selectedRole = '1';
      expect(component.isLocationValid).toBe(false);

      component.selectedRole = '2';
      component.selectedAgency = [{ agency_id: '1' }];
      expect(component.isLocationValid).toBe(false);
    });
  });
});