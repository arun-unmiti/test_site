import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MultiSelectModule } from 'primeng/multiselect';

import { NotificationsComponent } from './notifications.component';
import { UserDetailService } from 'src/app/auth/user-detail.service';
import { CoreService } from 'src/app/utilities/core.service';
import { FilterService } from 'src/app/utilities/filter.service';
import { FeatureToggleService } from '../../shared/services/feature-toggle.service';
import { InsightsService } from '../../utilities/insights.service';

// Mock services
class MockUserDetailService {
  getUserDetail = jest.fn(() => ({ user_id: '123', user_role: '1', unit_id: '2000' }));
}

class MockCoreService {
  clone = jest.fn(obj => JSON.parse(JSON.stringify(obj)));
  toast = jest.fn();
  post = jest.fn().mockResolvedValue({ status: 1 });
  sortList = jest.fn(list => list);
  dashboard_post = jest.fn().mockResolvedValue({ status: 1 });
}

class MockFilterService {
  isLoactionFetched = true;
  fetchedLocationData = { subscribe: jest.fn() };
  states: any[] = [{ state_id: 1, state_name: 'State1' }];
  districts: any[] = [{ district_id: 1, district_name: 'District1', state_id: 1 }];
  tehsils: any[] = [{ tehsil_id: 1, tehsil_name: 'Tehsil1', district_id: 1 }];
  crops: any[] = [{ crop_id: 1, crop_name: 'Crop1' }];
  clients: any[] = [{ UNIT_ID: '2000', UNIT_NAME: 'Client1' }];
  getClientWiseLocation = jest.fn().mockResolvedValue([ [], [] ]); // [states, districts]
}

class MockFeatureToggleService {
  getContext = jest.fn(() => 'saksham');
}

class MockInsightsService {
  logException = jest.fn();
}

describe('NotificationsComponent', () => {
  let component: NotificationsComponent;
  let fixture: ComponentFixture<NotificationsComponent>;
  let userService: any;
  let coreService: any;
  let filterService: any;
  let featureToggle: any;
  let insightsService: any;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [NotificationsComponent],
      imports: [HttpClientTestingModule, MultiSelectModule],
      providers: [
        { provide: UserDetailService, useClass: MockUserDetailService },
        { provide: CoreService, useClass: MockCoreService },
        { provide: FilterService, useClass: MockFilterService },
        { provide: FeatureToggleService, useClass: MockFeatureToggleService },
        { provide: InsightsService, useValue: new MockInsightsService() },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationsComponent);
    component = fixture.componentInstance;
    userService = TestBed.inject(UserDetailService);
    coreService = TestBed.inject(CoreService);
    filterService = TestBed.inject(FilterService);
    featureToggle = TestBed.inject(FeatureToggleService);
    insightsService = TestBed.inject(InsightsService);
    component.user = { unit_id: '2000', user_role: '1' };
    insightsService.logException.mockReset();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should set user from userService', () => {
      component.ngOnInit();
      expect(component.user).toEqual({ user_id: '123', user_role: '1', unit_id: '2000' });
    });

    it('should call getAllUsers if user_role is 1 or 2', () => {
      userService.getUserDetail.mockReturnValueOnce({ user_role: '1' });
      const getAllUsersSpy = jest.spyOn(component, 'getAllUsers');
      component.ngOnInit();
      expect(getAllUsersSpy).toHaveBeenCalled();
    });

    it('should set selectedClient and call onClientSelect if not role 1 or 2', () => {
      userService.getUserDetail.mockReturnValueOnce({ user_role: '3', unit_id: '2000' });
      const onClientSelectSpy = jest.spyOn(component, 'onClientSelect');
      component.ngOnInit();
      expect(component.selectedClient).toBe('2000');
      expect(onClientSelectSpy).toHaveBeenCalledWith('2000');
    });

    it('should call onClientSelect', () => {
      const onClientSelectSpy = jest.spyOn(component, 'onClientSelect');
      component.ngOnInit();
      expect(onClientSelectSpy).toHaveBeenCalled();
    });

    it('should call getLocationsData if isLoactionFetched', () => {
      filterService.isLoactionFetched = true;
      const getLocationsDataSpy = jest.spyOn(component, 'getLocationsData');
      component.ngOnInit();
      expect(getLocationsDataSpy).toHaveBeenCalled();
    });

    it('should subscribe to fetchedLocationData if not fetched', () => {
      filterService.isLoactionFetched = false;
      const getLocationsDataSpy = jest.spyOn(component, 'getLocationsData');
      component.ngOnInit();
      const subscriber = filterService.fetchedLocationData.subscribe.mock.calls[0][0];
      subscriber();
      expect(getLocationsDataSpy).toHaveBeenCalled();
    });
  });

  describe('getLocationsData', () => {
    it('should set location data from filter service', () => {
      jest.spyOn(coreService, 'clone').mockImplementation(obj => obj);
      component.getLocationsData();
      expect(component.states).toEqual(filterService.states);
      expect(component.districts).toEqual(filterService.districts);
      expect(component.tehsils).toEqual(filterService.tehsils);
      expect(component.crops).toEqual(filterService.crops);
      expect(component.clientData).toEqual(filterService.clients);
    });

    it('should set selectedClient if user has unit_id', () => {
      component.getLocationsData();
      expect(component.selectedClient).toBe('2000');
    });
  });

  describe('onClientSelect', () => {
    it('should reset location filters and fetch client locations', async () => {
      const event = '2000';
      await component.onClientSelect(event);
      expect(component.clientStates).toEqual([]);
      expect(component.clientDistricts).toEqual([]);
      expect(component.states).toEqual(expect.arrayContaining([expect.objectContaining({ state_id: 1 })]));
      expect(component.selectedState).toEqual([]);
      expect(component.districtOptions).toEqual([]);
      expect(component.tehsilOptions).toEqual([]);
      expect(component.selectedDistrict).toEqual([]);
      expect(component.selectedTehsil).toEqual([]);
      expect(filterService.getClientWiseLocation).toHaveBeenCalledWith([{ UNIT_ID: '2000' }]);
    });

    it('should set states based on clientStates', async () => {
      await component.onClientSelect('2000');
      expect(component.states).toEqual(expect.arrayContaining([expect.objectContaining({ state_id: 1 })]));
    });

    it('should call getAllUsers', async () => {
      const getAllUsersSpy = jest.spyOn(component, 'getAllUsers');
      await component.onClientSelect('2000');
      expect(getAllUsersSpy).toHaveBeenCalled();
    });
  });

  describe('onStateChange', () => {
    it('should reset district and tehsil options', () => {
      const event = [{ state_id: 1 }];
      component.onStateChange(event);
      expect(component.districtOptions).toEqual(expect.arrayContaining([expect.objectContaining({ state_id: 1, items: [] })]));
      expect(component.tehsilOptions).toEqual([]);
      expect(component.selectedDistrict).toEqual([]);
      expect(component.selectedTehsil).toEqual([]);
    });

    it('should call getAllUsers', () => {
      const getAllUsersSpy = jest.spyOn(component, 'getAllUsers');
      component.onStateChange([]);
      expect(getAllUsersSpy).toHaveBeenCalled();
    });
  });

  describe('onDistrictChange', () => {
    it('should reset tehsil options', () => {
      const event = [{ district_id: 1 }];
      component.onDistrictChange(event);
      expect(component.tehsilOptions).toEqual(expect.arrayContaining([expect.objectContaining({ district_id: 1, items: [] })]));
      expect(component.selectedTehsil).toEqual([]);
    });

    it('should call getAllUsers', () => {
      const getAllUsersSpy = jest.spyOn(component, 'getAllUsers');
      component.onDistrictChange([]);
      expect(getAllUsersSpy).toHaveBeenCalled();
    });
  });

  describe('onTehsilChange', () => {
    it('should call getAllUsers', () => {
      const getAllUsersSpy = jest.spyOn(component, 'getAllUsers');
      component.onTehsilChange();
      expect(getAllUsersSpy).toHaveBeenCalled();
    });
  });

  describe('submit', () => {
    it('should toast warning if no selectedUser', () => {
      component.submit();
      expect(coreService.toast).toHaveBeenCalledWith('warn', 'Plase select User');
    });

    it('should toast warning if no comment', () => {
      component.selectedUser = [{ user_id: 'u1' }];
      component.submit();
      expect(coreService.toast).toHaveBeenCalledWith('warn', 'Plase add notification text');
    });

    it('should post request and toast success on success', async () => {
      component.selectedUser = [{ user_id: 'u1' }];
      component.comment = 'Test comment';
      component.selectedClient = '2000';
      const mockResponse = { status: 1, msg: 'Success' };
      coreService.post.mockResolvedValueOnce(mockResponse);
      const clearSpy = jest.spyOn(component, 'clear');
      await component.submit();
      expect(coreService.post).toHaveBeenCalledWith(expect.objectContaining({ purpose: 'push_notification' }));
      expect(coreService.toast).toHaveBeenCalledWith('success', 'Success');
      expect(clearSpy).toHaveBeenCalled();
    });

    it('should toast error on failure', fakeAsync(() => {
      component.selectedUser = [{ user_id: 'u1' }];
      component.comment = 'Test comment';
      coreService.post.mockReturnValueOnce(Promise.reject(new Error('Error')));
      component.submit();
      tick();
      expect(coreService.toast).toHaveBeenCalledWith('error', 'Unable to push notification');
      expect(insightsService.logException).toHaveBeenCalledWith(expect.any(Error));
    }));
  });

  describe('clear', () => {
    it('should reset properties and call onClientSelect', () => {
      const onClientSelectSpy = jest.spyOn(component, 'onClientSelect');
      component.selectedClient = '2000';
      component.clear();
      expect(onClientSelectSpy).toHaveBeenCalledWith('2000');
      expect(component.selectedUser).toEqual([]);
      expect(component.comment).toBe('');
    });
  });

  describe('getAllUsers', () => {
    it('should reset userList and post request', async () => {
      component.selectedState = [{ state_id: 1 }];
      component.selectedDistrict = [{ district_id: 1 }];
      component.selectedTehsil = [{ tehsil_id: 1 }];
      component.selectedClient = '2000';
      component.user = { user_role: '3' };
      component.states = [{ state_id: 1 }];
      component.districts = [{ district_id: 1 }];
      component.tehsils = [{ tehsil_id: 1 }];
      const mockResponse = { status: 1, userdata: [{ user_id: 'u1', first_name: 'First', last_name: 'Last' }] };
      coreService.post.mockResolvedValueOnce(mockResponse);
      await component.getAllUsers();
      expect(component.userList).toEqual(expect.arrayContaining([expect.objectContaining({ user_id: 'u1' })]));
      expect(coreService.sortList).toHaveBeenCalled();
    });
  });
});