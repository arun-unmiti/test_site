import { ComponentFixture, TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { NgbModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';

import { TransferSurveyComponent } from './transfer-survey.component';
import { CoreService } from '../utilities/core.service';
import { FilterService } from '../utilities/filter.service';
import { UserDetailService } from '../auth/user-detail.service';
import { FeatureToggleService } from '../shared/services/feature-toggle.service';
import { environment, ProjectContext } from '../../environments/environment';

// Mock environment
jest.mock('../../environments/environment', () => ({
  environment: {
    projectConfigs: {
      munichre: { assetsFolder: '/assets/munichre' },
      saksham: { assetsFolder: '/assets/saksham' },
    }
  }
}));

class MockCoreService {
  post = jest.fn().mockResolvedValue({ status: 1 });
  dashboard_post = jest.fn().mockResolvedValue({ status: 1 });
  toast = jest.fn();
  clone = jest.fn(obj => JSON.parse(JSON.stringify(obj)));
  webserivce_post = jest.fn().mockResolvedValue({ status: 1 });
  getNotifiedCropList = jest.fn().mockReturnValue([]);
}

class MockFilterService {
  isLoactionFetched = true;
  fetchedLocationData = { subscribe: jest.fn() };
  getAgencyWiseLocation = jest.fn().mockResolvedValue({ states: [], districts: [], tehsils: [] });

  // Initialize all arrays to avoid "undefined.length" / "undefined.forEach"
  states = [{ state_id: 1, state_name: 'State1' }];
  districts = [{ district_id: 1, district_name: 'District1' }];
  tehsils = [{ tehsil_id: 1, tehsil_name: 'Tehsil1' }];
  blocks = [{ block_id: 1, block_name: 'Block1' }];
  grampanchayats = [{ grampanchayat_id: 1, grampanchayat_name: 'GP1' }];
  villages = [{ village_id: 1, village_name: 'Village1' }];
  crops = [{ crop_code: 1, crop_name: 'Crop1' }];
  seasons = [{ id: 1, season_name: 'Season1' }];
  years = [{ id: 2023, year: 2023 }];
  notifiedUnits = [{ notified_id: 1, notified_unit_name: 'NU1' }];
  lookupData = { clients: [{ UNIT_ID: '2000' }] };
}

class MockUserDetailService {
  getUserDetail = jest.fn(() => ({ user_id: '123', user_role: '1', unit_id: '2000', agency_id: 'agency1' }));
}

class MockFeatureToggleService {
  getContext = jest.fn(() => 'saksham');
}

class MockNgbModal {
  open = jest.fn().mockReturnValue({ result: Promise.resolve('yes') });
}

describe('TransferSurveyComponent', () => {
  let component: TransferSurveyComponent;
  let fixture: ComponentFixture<TransferSurveyComponent>;
  let coreService: any;
  let filterService: any;
  let userService: any;
  let featureToggle: any;
  let modalService: any;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        NgbModule,
        FormsModule,
      ],
      declarations: [TransferSurveyComponent],
      providers: [
        { provide: CoreService, useClass: MockCoreService },
        { provide: FilterService, useClass: MockFilterService },
        { provide: UserDetailService, useClass: MockUserDetailService },
        { provide: FeatureToggleService, useClass: MockFeatureToggleService },
        { provide: NgbModal, useClass: MockNgbModal },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(TransferSurveyComponent);
    component = fixture.componentInstance;
    coreService = TestBed.inject(CoreService);
    filterService = TestBed.inject(FilterService);
    userService = TestBed.inject(UserDetailService);
    featureToggle = TestBed.inject(FeatureToggleService);
    modalService = TestBed.inject(NgbModal);
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  describe('constructor', () => {
    it('should set singleClient for saksham', () => {
      featureToggle.getContext.mockReturnValue('saksham');
      const comp = new TransferSurveyComponent(coreService as any, filterService as any, userService as any, modalService as any, featureToggle as any);
      expect(comp.singleClient).toBe('2000');
    });
  });

  describe('ngOnInit', () => {
    it('should set userDetails and call methods', () => {
      const getFilterDataSpy = jest.spyOn(component, 'getFilterData');
      const getLocationCropDataSpy = jest.spyOn(component, 'getLocationCropData');
      component.ngOnInit();
      expect(component.userDetails).toEqual({ user_id: '123', user_role: '1', unit_id: '2000', agency_id: 'agency1' });
      expect(getFilterDataSpy).toHaveBeenCalled();
      expect(getLocationCropDataSpy).toHaveBeenCalled();
    });
  });

  describe('getFilterData', () => {
    it('should call addFilterData if fetched', () => {
      filterService.isLoactionFetched = true;
      const addFilterDataSpy = jest.spyOn(component, 'addFilterData');
      component.lookupLoader = 0;
      component.getFilterData();
      expect(addFilterDataSpy).toHaveBeenCalled();
    });

    it('should subscribe if not fetched', fakeAsync(() => {
      filterService.isLoactionFetched = false;
      const addFilterDataSpy = jest.spyOn(component, 'addFilterData');
      component.lookupLoader = 0;
      component.getFilterData();
      const subscriber = filterService.fetchedLocationData.subscribe.mock.calls[0][0];
      subscriber();
      tick();
      expect(addFilterDataSpy).toHaveBeenCalled();
    }));
  });

  describe('addFilterData', () => {
    it('should set maps and data', () => {
      filterService.states = [{ state_id: '1', state_name: 'State1' }];
      filterService.districts = [{ district_id: '1', district_name: 'Dist1' }];
      filterService.tehsils = [{ tehsil_id: '1', tehsil_name: 'Tehsil1' }];
      filterService.blocks = [{ block_id: '1', block_name: 'Block1' }];
      filterService.grampanchayats = [{ grampanchayat_id: '1', grampanchayat_name: 'GP1' }];
      filterService.villages = [{ village_id: '1', village_name: 'Village1' }];
      filterService.crops = [{ crop_code: '1', crop_name: 'Crop1' }];
      filterService.seasons = [{ id: '1', season_name: 'Season1' }];
      filterService.years = [{ id: '1', year: '2023' }];
      filterService.notifiedUnits = [{ notified_id: '1', notified_unit_name: 'NU1' }];

      const setDefaultLocationSpy = jest.spyOn(component, 'setDefaultLocation');

      component.addFilterData();

      expect(component.states).toEqual(filterService.states);
      expect(component.allDistricts).toEqual(filterService.districts);
      expect(component.stateMap.get('1')).toBe('State1');
      expect(component.districtMap.get('1')).toBe('Dist1');
      expect(component.tehsilMap.get('1')).toBe('Tehsil1');
      expect(component.blockMap.get('1')).toBe('Block1');
      expect(component.grampanchayatMap.get('1')).toBe('GP1');
      expect(component.villageMap.get('1')).toBe('Village1');
      expect(component.cropMap.get(1)).toBe('Crop1');
      expect(component.seasonMap.get('1')).toBe('Season1');
      expect(component.yearMap.get('1')).toBe('2023');
      expect(component.notifiedUnitMap.get('1')).toBe('NU1');
      expect(setDefaultLocationSpy).toHaveBeenCalled();
    });
  });

  describe('setDefaultLocation', () => {
    it('should set client and agency', () => {
      component.userDetails = { unit_id: '2000', user_role: '7', agency_id: 'agency1' };
      component.clientData = [{ UNIT_ID: '2000' }];
      component.setDefaultLocation();
      expect(component.singleClient).toBe('2000');
      expect(component.selectedClient).toEqual([{ UNIT_ID: '2000' }]);
      expect(component.selectedAgency).toEqual(['agency1']);
    });

    it('should set agency to 0 if no agency_id', () => {
      component.userDetails = { user_role: '7', agency_id: null };
      component.setDefaultLocation();
      expect(component.selectedAgency).toEqual(['0']);
    });
  });

  describe('getLocationCropData', () => {
    it('should fetch crops', async () => {
      component.dataCrops = [];
      coreService.post.mockResolvedValueOnce({ status: 1, lkp_Karnatakacrops: [{ crop_id: '1' }] });
      await component.getLocationCropData();
      expect(component.dataCrops).toEqual([{ crop_id: '1' }]);
    });

    it('should use existing dataCrops and filter', () => {
      component.dataCrops = [{ state_id: 1, dist_id: 1 }];
      component.selectedState = [{ state_id: 1 }];
      component.selectedDistrict = [{ district_id: 1 }];
      coreService.getNotifiedCropList.mockReturnValue([{ crop: 'filtered' }]);
      component.getLocationCropData();
      expect(component.cropsData).toEqual([{ crop: 'filtered' }]);
    });

    it('should handle empty filters', () => {
      component.dataCrops = [{ state_id: 1, dist_id: 1 }];
      component.selectedState = [];
      component.selectedDistrict = [];
      coreService.getNotifiedCropList.mockReturnValue([{ crop: 'all' }]);
      component.getLocationCropData();
      expect(component.cropsData).toEqual([{ crop: 'all' }]);
    });

    it('should handle error in fetch', async () => {
      component.dataCrops = [];
      coreService.post.mockRejectedValueOnce(new Error('error'));
      await component.getLocationCropData();
      expect(component.cropsData).toEqual([]);
    });
  });

  describe('onSurveyChange', () => {
    it('should set districtField and reset', () => {
      const resetSpy = jest.spyOn(component, 'resetData');
      component.onSurveyChange(1);
      expect(component.districtField).toBe('field_502');
      expect(resetSpy).toHaveBeenCalled();
      component.onSurveyChange(2);
      expect(component.districtField).toBe('field_529');
      expect(resetSpy).toHaveBeenCalledTimes(2);
      component.onSurveyChange(3);
      expect(component.districtField).toBe('field_586');
      expect(resetSpy).toHaveBeenCalledTimes(3);
    });

    it('should handle invalid event', () => {
      const resetSpy = jest.spyOn(component, 'resetData');
      component.onSurveyChange(4);
      expect(component.districtField).toBeUndefined();
      expect(resetSpy).toHaveBeenCalled();
    });
  });
  

  describe('onYearSelect', () => {
    it('should reset and call methods', () => {
      const getLocationCropDataSpy = jest.spyOn(component, 'getLocationCropData');
      const getUserDataSpy = jest.spyOn(component, 'getUserData');
      const resetDataSpy = jest.spyOn(component, 'resetData');
      component.userDetails = { user_role: '7' };
      component.singleClient = '2000';
      component.selectedSeason = '1';
      component.selectedAgency = ['1'];
      component.selectedYear = '2023';
      component.onYearSelect('2023');
      expect(getLocationCropDataSpy).toHaveBeenCalled();
      expect(getUserDataSpy).toHaveBeenCalled();
      expect(resetDataSpy).toHaveBeenCalled();
      expect(component.selectedAgency).toEqual(['1']);
    });

    it('should reset agencies if not role 7', fakeAsync(() => {
      const getAgencyDataSpy = jest.spyOn(component, 'getAgencyData');
      component.userDetails = { user_role: '1' };
      component.singleClient = '2000';
      component.selectedSeason = '1';
      component.selectedYear = '2023';
      component.onYearSelect('2023');
      tick();
      expect(component.selectedAgency).toEqual([]);
      expect(component.agencyData).toEqual([]);
      expect(getAgencyDataSpy).toHaveBeenCalled();
    }));

    it('should call onAgencyChange if role 7 and conditions met', () => {
      const onAgencyChangeSpy = jest.spyOn(component, 'onAgencyChange');
      component.userDetails = { user_role: '7' };
      component.selectedAgency = ['1'];
      component.selectedSeason = '1';
      component.selectedYear = '2023';
      component.onYearSelect('2023');
      expect(onAgencyChangeSpy).toHaveBeenCalledWith(['1']);
    });

    it('should not call getAgencyData if missing conditions', () => {
      const getAgencyDataSpy = jest.spyOn(component, 'getAgencyData');
      component.userDetails = { user_role: '1' };
      component.singleClient = null;
      component.onYearSelect('2023');
      expect(getAgencyDataSpy).not.toHaveBeenCalled();
    });
  });

  describe('onSeasonSelect', () => {
    it('should reset and call methods', () => {
      const getLocationCropDataSpy = jest.spyOn(component, 'getLocationCropData');
      const getUserDataSpy = jest.spyOn(component, 'getUserData');
      const resetDataSpy = jest.spyOn(component, 'resetData');
      component.userDetails = { user_role: '7' };
      component.singleClient = '2000';
      component.selectedYear = '2023';
      component.selectedAgency = ['1'];
      component.selectedSeason = '1';
      component.onSeasonSelect('1');
      expect(getLocationCropDataSpy).toHaveBeenCalled();
      expect(getUserDataSpy).toHaveBeenCalled();
      expect(resetDataSpy).toHaveBeenCalled();
      expect(component.selectedAgency).toEqual(['1']);
    });

    it('should reset agencies if not role 7', fakeAsync(() => {
      const getAgencyDataSpy = jest.spyOn(component, 'getAgencyData');
      component.userDetails = { user_role: '1' };
      component.singleClient = '2000';
      component.selectedYear = '2023';
      component.selectedSeason = '1';
      component.onSeasonSelect('1');
      tick();
      expect(component.selectedAgency).toEqual([]);
      expect(component.agencyData).toEqual([]);
      expect(getAgencyDataSpy).toHaveBeenCalled();
    }));

    it('should call onAgencyChange if role 7 and conditions met', () => {
      const onAgencyChangeSpy = jest.spyOn(component, 'onAgencyChange');
      component.userDetails = { user_role: '7' };
      component.selectedAgency = ['1'];
      component.selectedYear = '2023';
      component.selectedSeason = '1';
      component.onSeasonSelect('1');
      expect(onAgencyChangeSpy).toHaveBeenCalledWith(['1']);
    });

    it('should not call getAgencyData if missing conditions', () => {
      const getAgencyDataSpy = jest.spyOn(component, 'getAgencyData');
      component.userDetails = { user_role: '1' };
      component.singleClient = null;
      component.onSeasonSelect('1');
      expect(getAgencyDataSpy).not.toHaveBeenCalled();
    });
  });

  describe('onSingleClientChange', () => {
    it('should set selectedClient and call onClientSelect', () => {
      component.clientData = [{ UNIT_ID: '2000' }];
      const spy = jest.spyOn(component, 'onClientSelect');
      component.onSingleClientChange('2000');
      expect(component.selectedClient).toEqual([{ UNIT_ID: '2000' }]);
      expect(spy).toHaveBeenCalledWith([{ UNIT_ID: '2000' }]);
    });

    it('should set empty if invalid', () => {
      const spy = jest.spyOn(component, 'onClientSelect');
      component.onSingleClientChange('invalid');
      expect(component.selectedClient).toEqual([]);
      expect(spy).toHaveBeenCalledWith([]);
    });
  });

  describe('onClientSelect', () => {
    it('should reset and call methods', () => {
      const getLocationCropDataSpy = jest.spyOn(component, 'getLocationCropData');
      const getUserDataSpy = jest.spyOn(component, 'getUserData');
      const resetDataSpy = jest.spyOn(component, 'resetData');
      const getAgencyDataSpy = jest.spyOn(component, 'getAgencyData');
      component.userDetails = { user_role: '1' };
      component.singleClient = '2000';
      component.selectedYear = 2023;
      component.selectedSeason = 1;
      component.onClientSelect([]);
      expect(component.agencyData).toEqual([]);
      expect(component.selectedAgency).toEqual([]);
      expect(component.states).toEqual([]);
      expect(component.selectedState).toEqual([]);
      expect(component.clientStates).toEqual([]);
      expect(component.clientDistricts).toEqual([]);
      expect(component.districts).toEqual([]);
      expect(component.selectedDistrict).toEqual([]);
      expect(component.selectedUser).toEqual([]);
      expect(component.selectedSingleUser).toEqual([]);
      expect(getLocationCropDataSpy).toHaveBeenCalled();
      expect(getUserDataSpy).toHaveBeenCalled();
      expect(resetDataSpy).toHaveBeenCalled();
      expect(getAgencyDataSpy).toHaveBeenCalled();
    });

    it('should not call getAgencyData if role 7', () => {
      const getAgencyDataSpy = jest.spyOn(component, 'getAgencyData');
      component.userDetails = { user_role: '7' };
      component.onClientSelect([]);
      expect(getAgencyDataSpy).not.toHaveBeenCalled();
    });

    it('should not call getAgencyData if missing conditions', () => {
      const getAgencyDataSpy = jest.spyOn(component, 'getAgencyData');
      component.userDetails = { user_role: '1' };
      component.singleClient = null;
      component.onClientSelect([]);
      expect(getAgencyDataSpy).not.toHaveBeenCalled();
    });
  });

  describe('getAgencyData', () => {
    it('should not fetch if missing data', () => {
      component.singleClient = null;
      component.getAgencyData();
      expect(coreService.dashboard_post).not.toHaveBeenCalled();
    });
  });

  describe('onAgencyChange', () => {
    it('should reset and call methods', () => {
      const loadAgencyLocationSpy = jest.spyOn(component, 'loadAgencyLocation');
      const getLocationCropDataSpy = jest.spyOn(component, 'getLocationCropData');
      const getUserDataSpy = jest.spyOn(component, 'getUserData');
      const resetDataSpy = jest.spyOn(component, 'resetData');
      component.onAgencyChange(['1']);
      expect(component.selectedState).toEqual([]);
      expect(component.districts).toEqual([]);
      expect(component.tehsilOptions).toEqual([]);
      expect(component.blocks).toEqual([]);
      expect(component.selectedDistrict).toEqual([]);
      expect(component.selectedBlock).toEqual([]);
      expect(component.selectedTehsil).toEqual([]);
      expect(component.clientStates).toEqual([]);
      expect(component.clientDistricts).toEqual([]);
      expect(component.selectedUser).toEqual([]);
      expect(component.selectedSingleUser).toEqual([]);
      expect(loadAgencyLocationSpy).toHaveBeenCalledWith(['1']);
      expect(getLocationCropDataSpy).toHaveBeenCalled();
      expect(getUserDataSpy).toHaveBeenCalled();
      expect(resetDataSpy).toHaveBeenCalled();
    });

    it('should not load if no event', () => {
      const loadAgencyLocationSpy = jest.spyOn(component, 'loadAgencyLocation');
      component.onAgencyChange(null);
      expect(loadAgencyLocationSpy).not.toHaveBeenCalled();
    });
  });

  describe('loadAgencyLocation', () => {
    it('should load locations', async () => {
      filterService.getAgencyWiseLocation.mockResolvedValue({ states: [{ state_id: 1 }], districts: [], tehsils: [] });
      component.singleClient = '2000';
      component.selectedYear = 2023;
      component.selectedSeason = 1;
      component.userDetails = { user_role: '1' };
      component.isStateLoading = 0;
      await component.loadAgencyLocation(['1']);
      expect(component.clientStates).toEqual([{ state_id: 1 }]);
      expect(component.states).toEqual([{ state_id: 1 }]);
      expect(component.isStateLoading).toBe(0);
    });

    it('should handle empty locations', async () => {
      filterService.getAgencyWiseLocation.mockResolvedValue({ states: null, districts: null, tehsils: null });
      component.singleClient = '2000';
      component.selectedYear = 2023;
      component.selectedSeason = 1;
      component.userDetails = { user_role: '1' };
      await component.loadAgencyLocation(['1']);
      expect(component.clientStates).toEqual([]);
      expect(component.clientDistricts).toBeNull();
      expect(component.clientTehsils).toBeNull();
      expect(component.states).toEqual([]);
    });
  });

  describe('onStateChange', () => {
    it('should reset and set districts', () => {
      component.clientDistricts = [{ state_id: 1, district_id: 1 }];
      const getLocationCropDataSpy = jest.spyOn(component, 'getLocationCropData');
      const getUserDataSpy = jest.spyOn(component, 'getUserData');
      const resetDataSpy = jest.spyOn(component, 'resetData');
      component.onStateChange([{ state_id: 1, state_name: 'State1' }]);
      expect(component.districts[0].items).toEqual([{ state_id: 1, district_id: 1 }]);
      expect(component.tehsilOptions).toEqual([]);
      expect(component.blocks).toEqual([]);
      expect(component.selectedDistrict).toEqual([]);
      expect(component.selectedBlock).toEqual([]);
      expect(component.selectedUser).toEqual([]);
      expect(component.selectedSingleUser).toEqual([]);
      expect(getLocationCropDataSpy).toHaveBeenCalled();
      expect(getUserDataSpy).toHaveBeenCalled();
      expect(resetDataSpy).toHaveBeenCalled();
    });

    it('should reset if no length', () => {
      const getLocationCropDataSpy = jest.spyOn(component, 'getLocationCropData');
      component.onStateChange([]);
      expect(component.districts).toEqual([]);
      expect(getLocationCropDataSpy).toHaveBeenCalled();
    });
  });

  describe('onDistrictChange', () => {
    it('should reset and set tehsilOptions', () => {
      component.clientTehsils = [{ district_id: 1, tehsil_id: 1 }];
      const getLocationCropDataSpy = jest.spyOn(component, 'getLocationCropData');
      const getUserDataSpy = jest.spyOn(component, 'getUserData');
      const resetDataSpy = jest.spyOn(component, 'resetData');
      component.onDistrictChange([{ district_id: 1, district_name: 'District1' }]);
      expect(component.tehsilOptions[0].items).toEqual([{ district_id: 1, tehsil_id: 1 }]);
      expect(component.blocks).toEqual([]);
      expect(component.selectedBlock).toEqual([]);
      expect(component.selectedUser).toEqual([]);
      expect(component.selectedSingleUser).toEqual([]);
      expect(getLocationCropDataSpy).toHaveBeenCalled();
      expect(getUserDataSpy).toHaveBeenCalled();
      expect(resetDataSpy).toHaveBeenCalled();
    });

    it('should reset if no length', () => {
      const getLocationCropDataSpy = jest.spyOn(component, 'getLocationCropData');
      component.onDistrictChange([]);
      expect(component.tehsilOptions).toEqual([]);
      expect(getLocationCropDataSpy).toHaveBeenCalled();
    });
  });

  describe('getUserData', () => {
    it('should not fetch if missing data', () => {
      component.selectedYear = null;
      component.getUserData();
      expect(coreService.dashboard_post).not.toHaveBeenCalled();
    });

    it('should fetch users', async () => {
      component.selectedYear = '2023';
      component.selectedSeason = '1';
      component.singleClient = '2000';
      component.selectedAgency = ['1'];
      component.selectedState = [{ state_id: 1 }];
      component.selectedDistrict = [{ district_id: 1 }];
      coreService.dashboard_post.mockResolvedValueOnce({ status: 1, userdata: [{ user_id: 1, first_name: 'John', last_name: 'Doe' }] });
      await component.getUserData();
      expect(component.usersData[0].username).toBe('John Doe');
    });

    it('should not fetch users if no states selected', async () => {
      component.selectedYear = '2023';
      component.selectedSeason = '1';
      component.singleClient = '2000';
      component.selectedAgency = ['1'];
      component.selectedState = [];
      component.states = [{ state_id: 1 }];
      component.selectedDistrict = [{ district_id: 1 }];
      await component.getUserData();
      expect(coreService.dashboard_post).not.toHaveBeenCalled();
    });

    it('should not fetch users if no districts selected', async () => {
      component.selectedYear = '2023';
      component.selectedSeason = '1';
      component.singleClient = '2000';
      component.selectedAgency = ['1'];
      component.selectedState = [{ state_id: 1 }];
      component.selectedDistrict = [];
      component.districts = [{ district_id: 1 }];
      await component.getUserData();
      expect(coreService.dashboard_post).not.toHaveBeenCalled();
    });

    it('should handle empty agencies', async () => {
      component.selectedYear = '2023';
      component.selectedSeason = '1';
      component.singleClient = '2000';
      component.selectedAgency = ['0'];
      component.selectedState = [{ state_id: 1 }];
      component.selectedDistrict = [{ district_id: 1 }];
      coreService.dashboard_post.mockResolvedValueOnce({ status: 1, userdata: [] });
      await component.getUserData();
      expect(coreService.dashboard_post.mock.calls[0][0].agencies).toEqual([]);
    });

    it('should handle error', async () => {
      component.selectedYear = '2023';
      component.selectedSeason = '1';
      component.singleClient = '2000';
      component.selectedAgency = ['1'];
      component.selectedState = [{ state_id: 1 }];
      component.selectedDistrict = [{ district_id: 1 }];
      coreService.dashboard_post.mockRejectedValueOnce(new Error('error'));
      await component.getUserData();
      expect(component.usersData).toEqual([]);
    });
  });

  describe('onPageTrigger', () => {
    it('should update tableData and pagination', () => {
      component.totalData = Array.from({ length: 20 }, (_, i) => ({ id: i + 1 }));
      component.pagination = { updatePagination: jest.fn() };
      component.onPageTrigger({ page_no: 2, records_per_page: 10 });
      expect(component.currentpage).toBe(2);
      expect(component.recordsPerPage).toBe(10);
      expect(component.tableData).toEqual(component.totalData.slice(10, 20));
      expect(component.pagination.updatePagination).toHaveBeenCalled();
    });

    it('should handle no pagination', () => {
      component.totalData = Array.from({ length: 20 }, (_, i) => ({ id: i + 1 }));
      component.pagination = null;
      expect(() => component.onPageTrigger({ page_no: 2, records_per_page: 10 })).not.toThrow();
    });
  });

  describe('search', () => {
    it('should toast if missing required fields', () => {
      component.selectedYear = null;
      component.search();
      expect(coreService.toast).toHaveBeenCalledWith('warn', 'Please select year');
      component.selectedYear = 2023;
      component.selectedSeason = null;
      component.search();
      expect(coreService.toast).toHaveBeenCalledWith('warn', 'Please select season');
      component.selectedSeason = 1;
      component.selectedClient = [];
      component.search();
      expect(coreService.toast).toHaveBeenCalledWith('warn', 'Please select client');
      component.selectedClient = [{ UNIT_ID: '2000' }];
      component.selectedAgency = [];
      component.search();
      expect(coreService.toast).toHaveBeenCalledWith('warn', 'Please select agency');
      component.selectedAgency = ['1'];
      component.selectedState = [];
      component.search();
      expect(coreService.toast).toHaveBeenCalledWith('warn', 'Please select state');
      component.selectedState = [{ state_id: 1 }];
      component.selectedDistrict = [];
      component.search();
      expect(coreService.toast).toHaveBeenCalledWith('warn', 'Please select district');
      component.selectedDistrict = [{ district_id: 1 }];
      component.selectedUser = [];
      component.search();
      expect(coreService.toast).toHaveBeenCalledWith('warn', 'Please select user');
    });

    it('should set crop_column based on survey_id', () => {
      component.selectedForm = 2;
      component.selectedYear = 2023;
      component.selectedSeason = 1;
      component.selectedClient = [{ UNIT_ID: '2000' }];
      component.selectedAgency = ['1'];
      component.selectedState = [{ state_id: 1 }];
      component.selectedDistrict = [{ district_id: 1 }];
      component.selectedUser = [{ user_id: 1 }];
      component.search();
      expect(coreService.webserivce_post.mock.calls[0][0].crop_column).toBe('field_539');
    });

    it('should handle empty agencies', () => {
      component.selectedForm = 1;
      component.selectedYear = 2023;
      component.selectedSeason = 1;
      component.selectedClient = [{ UNIT_ID: '2000' }];
      component.selectedAgency = ['0'];
      component.selectedState = [{ state_id: 1 }];
      component.selectedDistrict = [{ district_id: 1 }];
      component.selectedUser = [{ user_id: 1 }];
      component.search();
      expect(coreService.webserivce_post.mock.calls[0][0].agency_id).toEqual([]);
    });
  });

  describe('setColumns', () => {
    it('should set columns for form 1', () => {
      component.selectedForm = 1;
      component.setColumns();
      expect(component.columns.length).toBe(19);
      expect(component.columns[0]).toEqual({ field: 'check', header: '' });
      expect(component.columns[1]).toEqual({ field: 'id', header: 'AI Id' });
    });

    it('should set columns for form 2', () => {
      component.selectedForm = 2;
      component.setColumns();
      expect(component.columns.length).toBe(19);
      expect(component.columns[4]).toEqual({ field: 'field_583', header: 'Cropping Year' });
    });

    it('should set no columns for form 3', () => {
      component.selectedForm = 3;
      component.setColumns();
      expect(component.columns.length).toBe(0);
    });
  });

  describe('setTableData', () => {
    it('should set row_status for rejected', () => {
      component.selectedForm = 1;
      const surveyData: any = [{ status: '1', approved_reject: '0' }];
      component.setTableData(surveyData);
      expect(surveyData[0].row_status).toBe('Rejected');
    });

    it('should set row_status for pending', () => {
      component.selectedForm = 1;
      const surveyData: any = [{ status: '1', approved_reject: null }];
      component.setTableData(surveyData);
      expect(surveyData[0].row_status).toBe('Pending');
    });

    it('should set row_status for draft', () => {
      component.selectedForm = 1;
      const surveyData: any = [{ status: '0' }];
      component.setTableData(surveyData);
      expect(surveyData[0].row_status).toBe('Draft');
    });

    it('should set row_status for deleted', () => {
      component.selectedForm = 1;
      const surveyData: any = [{ status: '-1' }];
      component.setTableData(surveyData);
      expect(surveyData[0].row_status).toBe('Deleted');
    });

    it('should map fields for form 1', () => {
      component.selectedForm = 1;
      component.yearMap.set(2023, 2023);
      component.seasonMap.set(1, 'Kharif');
      component.stateMap.set(1, 'State');
      const surveyData: any = [{
        field_951: 2023,
        field_506: 1,
        field_501: 1,
        field_502: 1,
        field_643: 1,
        field_503: 1,
        field_644: 1,
        field_504: 1,
        field_505: 1,
        field_509: '1',
        status: '1',
        approved_reject: '1'
      }];
      component.setTableData(surveyData);
      expect(surveyData[0].field_951).toBe(2023);
      expect(surveyData[0].field_506).toBe('Kharif');
      expect(surveyData[0].field_501).toBe('State');
      expect(surveyData[0].row_status).toBe('Approved');
    });

    it('should map fields for form 2', () => {
      component.selectedForm = 2;
      const surveyData: any = [{
        field_583: 2023,
        field_584: 1,
        field_585: 1,
        field_586: 1,
        field_587: 1,
        field_588: 1,
        field_591: 1,
        field_592: 1,
        field_589: 1,
        field_593: '1',
        status: '1',
        approved_reject: '1'
      }];
      component.setTableData(surveyData);
      expect(surveyData[0].row_status).toBe('Approved');
    });

    it('should map fields for form 3', () => {
      component.selectedForm = 3;
      const surveyData: any = [{
        field_583: 2023,
        status: '1',
        approved_reject: '1'
      }];
      component.setTableData(surveyData);
      expect(surveyData[0].row_status).toBe('Approved');
    });

    it('should filter only active data', () => {
      component.selectedForm = 1;
      const surveyData = [{ status: '1' }, { status: '0' }, { status: '-1' }];
      component.setTableData(surveyData);
      expect(component.totalData.length).toBe(1);
    });

    it('should update pagination after setTimeout', fakeAsync(() => {
      component.pagination = { updatePagination: jest.fn() };
      component.setTableData([]);
      tick(0);
      expect(component.pagination.updatePagination).toHaveBeenCalled();
    }));

    it('should handle no pagination in setTimeout', fakeAsync(() => {
      component.pagination = null;
      component.setTableData([]);
      tick(0);
      expect(() => {}).not.toThrow();
    }));

    it('should handle unmapped values', () => {
      component.selectedForm = 1;
      const surveyData = [{ field_951: 'unknown', status: '1', approved_reject: '1' }];
      component.setTableData(surveyData);
      expect(surveyData[0].field_951).toBe('unknown');
    });
  });

  describe('onSingleUserChange', () => {
    it('should set selectedUser and reset', () => {
      component.usersData = [{ user_id: 1 }];
      const resetSpy = jest.spyOn(component, 'resetData');
      component.onSingleUserChange(1);
      expect(component.selectedUser).toEqual([{ user_id: 1 }]);
      expect(resetSpy).toHaveBeenCalled();
    });

    it('should set empty if no event', () => {
      const resetSpy = jest.spyOn(component, 'resetData');
      component.onSingleUserChange(null);
      expect(component.selectedUser).toEqual([]);
      expect(resetSpy).toHaveBeenCalled();
    });

    it('should set empty if invalid', () => {
      const resetSpy = jest.spyOn(component, 'resetData');
      component.onSingleUserChange(999);
      expect(component.selectedUser).toEqual([]);
      expect(resetSpy).toHaveBeenCalled();
    });
  });

  describe('resetData', () => {
    it('should reset', () => {
      component.resetData();
      expect(component.isSearched).toBe(false);
      expect(component.currentpage).toBe(1);
      expect(component.columns).toEqual([]);
      expect(component.totalData).toEqual([]);
      expect(component.tableData).toEqual([]);
      expect(component.checkedCount).toBe(0);
      expect(component.allChecked).toBe(false);
      expect(component.allIndeterminate).toBe(false);
    });
  });

  describe('onRowCheckboxChange', () => {
    it('should update check and counts', () => {
      component.totalData = [{ id: 1, check: false }, { id: 2, check: false }];
      component.onRowCheckboxChange({ target: { checked: true } } as any, component.totalData[0]);
      expect(component.totalData[0].check).toBe(true);
      expect(component.checkedCount).toBe(1);
      expect(component.allChecked).toBe(false);
      expect(component.allIndeterminate).toBe(true);
    });

    it('should update to all checked', () => {
      component.totalData = [{ id: 1, check: true }, { id: 2, check: false }];
      component.onRowCheckboxChange({ target: { checked: true } } as any, component.totalData[1]);
      expect(component.checkedCount).toBe(2);
      expect(component.allChecked).toBe(true);
      expect(component.allIndeterminate).toBe(false);
    });

    it('should update from all checked', () => {
      component.totalData = [{ id: 1, check: true }, { id: 2, check: true }];
      component.onRowCheckboxChange({ target: { checked: false } } as any, component.totalData[0]);
      expect(component.checkedCount).toBe(1);
      expect(component.allChecked).toBe(false);
      expect(component.allIndeterminate).toBe(true);
    });
  });

  describe('onAllChecked', () => {
    it('should check all', () => {
      component.totalData = [{ check: false }, { check: false }];
      component.tableData = component.totalData;
      component.onAllChecked(true);
      expect(component.totalData.every(d => d.check)).toBe(true);
      expect(component.checkedCount).toBe(2);
      expect(component.allIndeterminate).toBe(false);
    });

    it('should uncheck all', () => {
      component.totalData = [{ check: true }, { check: true }];
      component.tableData = component.totalData;
      component.onAllChecked(false);
      expect(component.totalData.every(d => !d.check)).toBe(true);
      expect(component.checkedCount).toBe(0);
      expect(component.allIndeterminate).toBe(false);
    });

    it('should handle empty tableData', () => {
      component.totalData = [{ check: false }, { check: false }];
      component.tableData = [];
      component.onAllChecked(true);
      expect(component.totalData.every(d => d.check)).toBe(true);
    });
  });

  describe('transferData', () => {
    it('should open modal and handle yes', fakeAsync(() => {
      modalService.open.mockReturnValueOnce({ result: Promise.resolve('yes') });
      modalService.open.mockReturnValueOnce({ result: Promise.resolve('yes') });
      component.transferData();
      flush();
      expect(modalService.open).toHaveBeenCalledTimes(2);
    }));

    it('should not open second if no', fakeAsync(() => {
      modalService.open.mockReturnValueOnce({ result: Promise.resolve('no') });
      component.transferData();
      flush();
      expect(modalService.open).toHaveBeenCalledTimes(1);
    }));
  });

  describe('onSubmit', () => {
    it('should close if different', () => {
      component.transferUser = 1;
      component.selectedSingleUser = [2];
      const modal = { close: jest.fn() };
      component.onSubmit(modal);
      expect(modal.close).toHaveBeenCalledWith('yes');
    });

    it('should toast if same', () => {
      component.transferUser = 1;
      component.selectedSingleUser = [1];
      const modal = { close: jest.fn() };
      component.onSubmit(modal);
      expect(coreService.toast).toHaveBeenCalledWith('warn', "From user and To user cannot be same");
      expect(modal.close).not.toHaveBeenCalled();
    });
  });

  describe('deactiveField', () => {
    it('should return true if selected', () => {
      component.selectedYear = '2023';
      component.selectedSeason = '1';
      component.selectedAgency = ['1'];
      expect(component.deactiveField).toBeTruthy();
    });

    it('should return false if missing', () => {
      component.selectedYear = null;
      expect(component.deactiveField).toBeFalsy();
    });
  });
});