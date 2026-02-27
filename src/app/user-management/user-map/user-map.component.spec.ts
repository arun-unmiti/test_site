import 'zone.js/bundles/zone-testing-bundle.umd.js';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA, Pipe, PipeTransform } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { UserMapComponent } from './user-map.component';
import { FilterService } from 'src/app/utilities/filter.service';
import { CoreService } from 'src/app/utilities/core.service';
import { UserDetailService } from 'src/app/auth/user-detail.service';
import { FeatureToggleService } from '../../shared/services/feature-toggle.service';

// Mock Pipe
@Pipe({ name: 'search' })
class MockSearchPipe implements PipeTransform {
  transform(value: any, args?: any): any {
    return value;
  }
}

// Mock Services
class MockFilterService {
  isLoactionFetched = true;
  fetchedLocationData = { subscribe: jest.fn() };
  states = [];
  districts = [];
  blocks = [];
  tehsils = [];
  seasons = [];
  years = [];
  getAgencyWiseLocation = jest.fn().mockResolvedValue({ states: [], districts: [], tehsils: [] });
  clone = jest.fn(obj => JSON.parse(JSON.stringify(obj)));
}

class MockCoreService {
  post = jest.fn().mockResolvedValue({ status: 1 });
  clone = jest.fn(obj => JSON.parse(JSON.stringify(obj)));
  toast = jest.fn();
}

class MockUserDetailService {
  getUserDetail = jest.fn(() => ({ user_id: '123', user_role: '1', unit_id: '2000' }));
}

class MockFeatureToggleService {
  getContext = jest.fn(() => 'saksham');
}

class MockNgbModal {
  open = jest.fn().mockReturnValue({ result: Promise.resolve(), close: jest.fn() });
}

describe('UserMapComponent', () => {
  let component: UserMapComponent;
  let fixture: ComponentFixture<UserMapComponent>;
  let filterService: MockFilterService;
  let coreService: MockCoreService;
  let userService: MockUserDetailService;
  let featureToggle: MockFeatureToggleService;
  let modalService: MockNgbModal;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        FormsModule,
        NgbModule,
      ],
      declarations: [UserMapComponent, MockSearchPipe],
      providers: [
        { provide: FilterService, useClass: MockFilterService },
        { provide: CoreService, useClass: MockCoreService },
        { provide: UserDetailService, useClass: MockUserDetailService },
        { provide: FeatureToggleService, useClass: MockFeatureToggleService },
        { provide: NgbModal, useClass: MockNgbModal },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(UserMapComponent);
    component = fixture.componentInstance;
    filterService = TestBed.inject(FilterService) as any;
    coreService = TestBed.inject(CoreService) as any;
    userService = TestBed.inject(UserDetailService) as any;
    featureToggle = TestBed.inject(FeatureToggleService) as any;
    modalService = TestBed.inject(NgbModal) as any;

    // Default logged user (prevents undefined errors in virtually every test)
    component.loggedUser = userService.getUserDetail();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should call init if fetched', () => {
      filterService.isLoactionFetched = true;
      const initSpy = jest.spyOn(component as any, 'init');
      component.ngOnInit();
      expect(initSpy).toHaveBeenCalled();
    });

    it('should subscribe if not fetched', () => {
      filterService.isLoactionFetched = false;
      const initSpy = jest.spyOn(component as any, 'init');
      component.ngOnInit();
      const subscriber = filterService.fetchedLocationData.subscribe.mock.calls[0][0];
      subscriber();
      expect(initSpy).toHaveBeenCalled();
    });
  });

  describe('init', () => {
    it('should initialize with saksham context and unit_id', () => {
      component.projectContext = 'saksham';
      component.filterStates = [{ state_id: 1 }];
      const getMappingDetailsSpy = jest.spyOn(component, 'getMappingDetails');
      const onClientSelectSpy = jest.spyOn(component, 'onClientSelect');
      component.init();
      expect(component.selectedClients).toBe('2000');
      expect(getMappingDetailsSpy).toHaveBeenCalledWith({ type: "agency", client_id: '2000' });
      expect(onClientSelectSpy).toHaveBeenCalledWith('2000');
    });

    it('should initialize without unit_id', () => {
      component.loggedUser = { user_role: '1', unit_id: null };
      component.projectContext = 'saksham'; // still sets selectedClients = '2000'
      const getMappingDetailsSpy = jest.spyOn(component, 'getMappingDetails');
      component.init();
      expect(getMappingDetailsSpy).toHaveBeenCalledWith({ type: "agency", client_id: '2000' });
    });
  });

  describe('getMappingDetails', () => {
    it('should return if status !=1', fakeAsync(() => {
      coreService.post.mockResolvedValue({ status: 0 });
      component.getMappingDetails({ type: "client" });
      tick();
      expect(component.allClients).toEqual([]);
    }));

    it('should add states etc for role >2', fakeAsync(() => {
      component.loggedUser = { user_role: '3' };
      component.filterStates = [{ state_id: 1 }];
      component.filterDistricts = [{ district_id: 1 }];
      component.filterTehsils = [{ tehsil_id: 1 }];
      component.filterBlocks = [{ block_id: 1 }];
      component.getMappingDetails({ type: "client" });
      tick();
      expect(coreService.post).toHaveBeenCalledWith("users", expect.objectContaining({
        states: [1],
        districts: [1],
        tehsils: [1],
        blocks: [1]
      }));
    }));
  });

  describe('setUserVal', () => {
    it('should call getUserLoaction if changed', () => {
      component.users = [{ username: 'testuser', user_id: 1 }];
      component.user = 'testuser';
      component.userId = '999';
      const getUserLoactionSpy = jest.spyOn(component, 'getUserLoaction');
      component.setUserVal();
      expect(getUserLoactionSpy).toHaveBeenCalled();
    });

    it('should handle empty trim', () => {
      component.user = '   ';
      component.setUserVal();
      expect(component.userId).toBe('');
    });
  });

  describe('setAgencyVal', () => {
    it('should not set if no match', () => {
      component.agencies = [];
      component.agency = 'unknown';
      component.setAgencyVal();
      expect(component.unitId).toBe('');
    });

    it('should call getUserLoaction if changed', () => {
      component.agencies = [{ UNIT_NAME: 'testagency', UNIT_ID: 1 }];
      component.agency = 'testagency';
      component.unitId = '999';
      const getUserLoactionSpy = jest.spyOn(component, 'getUserLoaction');
      component.setAgencyVal();
      expect(getUserLoactionSpy).toHaveBeenCalled();
    });

    it('should handle empty trim', () => {
      component.agency = '   ';
      component.setAgencyVal();
      expect(component.unitId).toBe('');
    });
  });

  describe('onUserChange', () => {
    it('should call getUserLoaction', () => {
      const getUserLoactionSpy = jest.spyOn(component, 'getUserLoaction');
      component.onUserChange('event');
      expect(getUserLoactionSpy).toHaveBeenCalled();
    });
  });

  describe('onClientSelect', () => {
    it('should clear and call getMappingDetails if env', () => {
      const clearUserLocationSpy = jest.spyOn(component, 'clearUserLocation');
      const getMappingDetailsSpy = jest.spyOn(component, 'getMappingDetails');
      component.onClientSelect('2000');
      expect(clearUserLocationSpy).toHaveBeenCalled();
      expect(component.noUser).toBe(false);
      expect(component.selectedAgency).toEqual({});
      expect(component.agencyId).toBe("");
      expect(getMappingDetailsSpy).toHaveBeenCalledWith({ type: "agency", client_id: '2000' });
    });

    it('should clear without calling getMappingDetails if no env', () => {
      const clearUserLocationSpy = jest.spyOn(component, 'clearUserLocation');
      const getMappingDetailsSpy = jest.spyOn(component, 'getMappingDetails');
      component.onClientSelect(null);
      expect(clearUserLocationSpy).toHaveBeenCalled();
      expect(getMappingDetailsSpy).not.toHaveBeenCalled();
    });
  });

  describe('onAgencyChange', () => {
    it('should clear user location', () => {
      const clearUserLocationSpy = jest.spyOn(component, 'clearUserLocation');
      component.onAgencyChange('1');
      expect(clearUserLocationSpy).toHaveBeenCalled();
      expect(component.noUser).toBe(false);
      expect(component.userSuggestion).toEqual([]);
    });
  });

  describe('onSeasonChange', () => {
    it('should clear user location', () => {
      const clearUserLocationSpy = jest.spyOn(component, 'clearUserLocation');
      component.onSeasonChange('1');
      expect(clearUserLocationSpy).toHaveBeenCalled();
    });
  });

  describe('onYearChange', () => {
    it('should clear user location', () => {
      const clearUserLocationSpy = jest.spyOn(component, 'clearUserLocation');
      component.onYearChange('2023');
      expect(clearUserLocationSpy).toHaveBeenCalled();
    });
  });

  describe('onSearchClick', () => {
    it('should toast warn if no client', () => {
      component.selectedClients = null;
      component.onSearchClick();
      expect(coreService.toast).toHaveBeenCalledWith("warn", "Client is required");
    });

    it('should toast warn if no agency', () => {
      component.selectedClients = '2000';
      component.agencyId = null;
      component.onSearchClick();
      expect(coreService.toast).toHaveBeenCalledWith("warn", "Agency is required");
    });

    it('should toast warn if no season', () => {
      component.selectedClients = '2000';
      component.agencyId = '1';
      component.selectedSeason = null;
      component.onSearchClick();
      expect(coreService.toast).toHaveBeenCalledWith("warn", "Season is required");
    });

    it('should toast warn if no year', () => {
      component.selectedClients = '2000';
      component.agencyId = '1';
      component.selectedSeason = '1';
      component.selectedYear = null;
      component.onSearchClick();
      expect(coreService.toast).toHaveBeenCalledWith("warn", "Year is required");
    });

    it('should call getMappingDetails if all present', () => {
      component.selectedClients = '2000';
      component.agencyId = '1';
      component.selectedSeason = '1';
      component.selectedYear = '2023';
      const getMappingDetailsSpy = jest.spyOn(component, 'getMappingDetails');
      component.onSearchClick();
      expect(getMappingDetailsSpy).toHaveBeenCalled();
    });
  });

  describe('getUserLoaction', () => {
    it('should return if role_id ==6', () => {
      component.selectedUser = { role_id: 6 };
      component.getUserLoaction();
      expect(coreService.post).not.toHaveBeenCalled();
    });

    it('should handle status !=1', fakeAsync(() => {
      coreService.post.mockResolvedValue({ status: 0 });
      component.userId = '1';
      component.unitId = '2000';
      component.getUserLoaction();
      tick();
      expect(component.states).toEqual([]);
    }));

    it('should not call if no userId or unitId', () => {
      component.userId = '' as any;
      component.unitId = '' as any;
      component.getUserLoaction();
      expect(coreService.post).not.toHaveBeenCalled();
    });
  });

  describe('onStateChanged', () => {
    it('should handle state change', () => {
      const data = { districts: [{ tehsils: [] }] };
      const onDistrictChangeSpy = jest.spyOn(component, 'onDistrictChange');
      const refreshCheckboxSpy = jest.spyOn(component, 'refreshCheckbox');
      component.onStateChanged(true, data);
      expect(onDistrictChangeSpy).toHaveBeenCalledWith(true, data.districts[0], true);
      expect(refreshCheckboxSpy).toHaveBeenCalledWith(data);
    });

    it('should handle no districts', () => {
      const data = {};
      const refreshCheckboxSpy = jest.spyOn(component, 'refreshCheckbox');
      component.onStateChanged(true, data);
      expect(refreshCheckboxSpy).toHaveBeenCalled();
    });

    it('should not refresh if noRefresh', () => {
      const data = {};
      const refreshCheckboxSpy = jest.spyOn(component, 'refreshCheckbox');
      component.onStateChanged(true, data, true);
      expect(refreshCheckboxSpy).not.toHaveBeenCalled();
    });
  });

  describe('onDistrictChange', () => {
    it('should handle district change', () => {
      const data: any = { tehsils: [{}] };
      const onTehsilChangeSpy = jest.spyOn(component, 'onTehsilChange');
      const refreshCheckboxSpy = jest.spyOn(component, 'refreshCheckbox');
      component.onDistrictChange(true, data);
      expect(data.checked).toBe(true);
      expect(onTehsilChangeSpy).toHaveBeenCalledWith(true, data.tehsils[0], true);
      expect(refreshCheckboxSpy).toHaveBeenCalledWith(data);
    });

    it('should handle no tehsils', () => {
      const data = {};
      const refreshCheckboxSpy = jest.spyOn(component, 'refreshCheckbox');
      component.onDistrictChange(true, data);
      expect(refreshCheckboxSpy).toHaveBeenCalled();
    });

    it('should not refresh if noRefresh', () => {
      const data = {};
      const refreshCheckboxSpy = jest.spyOn(component, 'refreshCheckbox');
      component.onDistrictChange(true, data, true);
      expect(refreshCheckboxSpy).not.toHaveBeenCalled();
    });
  });

  describe('onTehsilChange', () => {
    it('should handle tehsil change', () => {
      const data: any = { blocks: [{}] };
      const onBlockChangeSpy = jest.spyOn(component, 'onBlockChange');
      const refreshCheckboxSpy = jest.spyOn(component, 'refreshCheckbox');
      component.onTehsilChange(true, data);
      expect(data.checked).toBe(true);
      expect(onBlockChangeSpy).toHaveBeenCalledWith(true, data.blocks[0], true);
      expect(refreshCheckboxSpy).toHaveBeenCalledWith(data);
    });

    it('should handle no blocks', () => {
      const data = {};
      const refreshCheckboxSpy = jest.spyOn(component, 'refreshCheckbox');
      component.onTehsilChange(true, data);
      expect(refreshCheckboxSpy).toHaveBeenCalled();
    });

    it('should not refresh if noRefresh', () => {
      const data = {};
      const refreshCheckboxSpy = jest.spyOn(component, 'refreshCheckbox');
      component.onTehsilChange(true, data, true);
      expect(refreshCheckboxSpy).not.toHaveBeenCalled();
    });
  });

  describe('onBlockChange', () => {
    it('should handle block change', () => {
      const data: any = {};
      const refreshCheckboxSpy = jest.spyOn(component, 'refreshCheckbox');
      component.onBlockChange(true, data);
      expect(data.checked).toBe(true);
      expect(refreshCheckboxSpy).toHaveBeenCalledWith(data);
    });

    it('should not refresh if noRefresh', () => {
      const data: any = {};
      const refreshCheckboxSpy = jest.spyOn(component, 'refreshCheckbox');
      component.onBlockChange(true, data, true);
      expect(refreshCheckboxSpy).not.toHaveBeenCalled();
    });
  });

  describe('refreshCheckbox', () => {
    it('should refresh checkboxes', () => {
      const rData = { state_id: '1', district_id: '1', tehsil_id: '1' };
      component.states = [{ state_id: '1', districts: [{ district_id: '1', tehsils: [{ tehsil_id: '1', blocks: [{ checked: true }, { checked: false }] }] }] }];
      component.refreshCheckbox(rData);
      expect(component.states[0].districts[0].tehsils[0].checked).toBe(false);
      expect(component.states[0].districts[0].tehsils[0].indeterminate).toBe(true);
      expect(component.states[0].districts[0].checked).toBe(false);
      expect(component.states[0].districts[0].indeterminate).toBe(true);
      expect(component.states[0].checked).toBe(false);
      expect(component.states[0].indeterminate).toBe(true);
    });

    it('should handle no districts', () => {
      component.states = [{ districts: [] }];
      expect(() => component.refreshCheckbox({})).not.toThrow();
    });

    it('should handle no tehsils', () => {
      component.states = [{ districts: [{ tehsils: [] }] }];
      expect(() => component.refreshCheckbox({})).not.toThrow();
    });

    it('should handle no blocks', () => {
      component.states = [{ districts: [{ tehsils: [{ blocks: [] }] }] }];
      expect(() => component.refreshCheckbox({})).not.toThrow();
    });

    it('should filter by rData ids', () => {
      component.states = [{ state_id: 2, districts: [] }, { state_id: 1, districts: [] }];
      component.refreshCheckbox({ state_id: 1 });
      // Only state_id 1 processed
    });
  });

  describe('onSubmit', () => {
    it('should collect partial selected', () => {
      component.states = [{ state_id: 1, checked: false, districts: [{ district_id: 1, checked: false, tehsils: [{ tehsil_id: 1, checked: false, blocks: [{ block_id: 1, checked: true }] }] }] }];
      component.userId = '1';
      component.unitId = '2000';
      component.agencyId = '1';
      component.selectedSeason = '1';
      component.selectedYear = '2023';
      coreService.post.mockResolvedValue({ status: 1 });
      component.onSubmit();
      expect(coreService.post).toHaveBeenCalledWith("users", expect.objectContaining({ block: [1] }));
    });

    it('should submit mapping', async () => {
      component.states = [{ state_id: '1', checked: true, districts: [{ district_id: '1', checked: true, tehsils: [{ tehsil_id: '1', checked: true, blocks: [{ block_id: '1', checked: true }] }] }] }];
      component.userId = '1';
      component.unitId = '2000';
      coreService.post.mockResolvedValueOnce({ status: 1, msg: 'Success' });
      const onAgencyChangeSpy = jest.spyOn(component, 'onAgencyChange');
      await component.onSubmit();
      expect(coreService.post).toHaveBeenCalled();
      expect(coreService.toast).toHaveBeenCalledWith('success', 'Success');
      expect(onAgencyChangeSpy).toHaveBeenCalled();
    });
  });

  describe('openResetConfirmation', () => {
    it('should open modal', () => {
      component.openResetConfirmation('content');
      expect(modalService.open).toHaveBeenCalledWith('content', { centered: true, animation: true, keyboard: false, backdrop: 'static' });
    });
  });

  describe('filterCountrySingle', () => {
    it('should set filteredCities to users', () => {
      component.users = [{ id: 1 }];
      component.filterCountrySingle('event');
      expect(component.filteredCities).toEqual([{ id: 1 }]);
    });
  });

  describe('handleDropdownClick', () => {
    it('should set filteredCities to users', () => {
      component.users = [{ id: 1 }];
      component.handleDropdownClick();
      expect(component.filteredCities).toEqual([{ id: 1 }]);
    });
  });

  describe('onReset', () => {
    it('should reset mapping', async () => {
      coreService.post.mockResolvedValueOnce({ status: 1, msg: 'Success' });
      const onAgencyChangeSpy = jest.spyOn(component, 'onAgencyChange');
      const modal = { close: jest.fn() };
      await component.onReset(modal);
      expect(coreService.post).toHaveBeenCalled();
      expect(coreService.toast).toHaveBeenCalledWith('success', 'Success');
      expect(onAgencyChangeSpy).toHaveBeenCalled();
      expect(modal.close).toHaveBeenCalledWith('success');
    });
  });

  describe('filterUser', () => {
    it('should filter users', () => {
      component.users = [{ fullName: 'Test User' }, { fullName: 'Other' }];
      const event = { query: 'test' };
      component.filterUser(event);
      expect(component.userSuggestion).toEqual([{ fullName: 'Test User' }]);
    });

    it('should be case insensitive', () => {
      component.users = [{ fullName: 'TEST USER' }];
      const event = { query: 'test' };
      component.filterUser(event);
      expect(component.userSuggestion.length).toBe(1);
    });
  });

  describe('filterClient', () => {
    it('should filter clients', () => {
      component.allClients = [{ UNIT_NAME: 'Test Client' }, { UNIT_NAME: 'Other' }];
      const event = { query: 'test' };
      component.filterClient(event);
      expect(component.clientSuggestions).toEqual([{ UNIT_NAME: 'Test Client' }]);
    });
  });

  describe('filterAgency', () => {
    it('should filter agencies', () => {
      component.agencies = [{ agency_name: 'Test Agency' }, { agency_name: 'Other' }];
      const event = { query: 'test' };
      component.filterAgency(event);
      expect(component.agenciesSuggestion).toEqual([{ agency_name: 'Test Agency' }]);
    });
  });

  describe('assignAllLocation', () => {
    it('should assign all locations', () => {
      component.states = [{ districts: [{ tehsils: [{ blocks: [{}] }] }] }];
      component.assignAllLocation();
      expect(component.states[0].checked).toBe(true);
      expect(component.states[0].districts[0].checked).toBe(true);
      expect(component.states[0].districts[0].tehsils[0].checked).toBe(true);
      expect(component.states[0].districts[0].tehsils[0].blocks[0].checked).toBe(true);
    });

    it('should handle no districts', () => {
      component.states = [{}];
      expect(() => component.assignAllLocation()).not.toThrow();
    });
  });

  describe('clearUserLocation', () => {
    it('should clear user location', () => {
      component.clearUserLocation();
      expect(component.searched).toBe('');
      expect(component.userSuggestion).toEqual([]);
      expect(component.states).toEqual([]);
    });
  });
});