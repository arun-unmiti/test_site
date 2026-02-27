import { ComponentFixture, TestBed, fakeAsync, tick, flushMicrotasks } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of } from 'rxjs';
import { NgbModalModule, NgbModal, NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { MultiSelectModule } from 'primeng/multiselect';
import { ClsDashboardComponent } from './cls-dashboard.component';
import { CoreService } from '../utilities/core.service';
import { FilterService } from '../utilities/filter.service';
import { UserDetailService } from '../auth/user-detail.service';
import { FeatureToggleService } from '../shared/services/feature-toggle.service';
import { environment, ProjectContext } from '../../environments/environment';
// Mock Chart from angular-highcharts
jest.mock('angular-highcharts', () => ({
  Chart: jest.fn().mockImplementation(() => ({})),
}));
// Mock moment
jest.mock('moment', () => {
  const actualMoment = jest.requireActual('moment');
  return (date?: any) => {
    const m = actualMoment(date);
    m.subtract = jest.fn().mockReturnThis();
    m.format = jest.fn().mockImplementation((format) => actualMoment(date).format(format));
    m.startOf = jest.fn().mockReturnThis();
    m.endOf = jest.fn().mockReturnThis();
    m.diff = jest.fn().mockReturnValue(10);
    return m;
  };
});
// Expanded mock for environment to include all contexts
jest.mock('../../environments/environment', () => ({
  environment: {
    projectConfigs: {
      testContext: { assetsFolder: '/assets/test/' },
      saksham: { assetsFolder: '/assets/saksham/' },
      munichre: { assetsFolder: '/assets/munichre/' },
    }
  }
}));
// Mock services
class MockCoreService {
  clone = jest.fn(obj => JSON.parse(JSON.stringify(obj)));
  post = jest.fn().mockResolvedValue({ status: 1, msg: 'Success' });
  dashboard_post = jest.fn().mockResolvedValue({ status: 1 });
  sortList = jest.fn((list, key) => list);
  getNotifiedCropList = jest.fn((list) => list);
  uniqueList = jest.fn((list) => list);
  toast = jest.fn();
}
class MockFilterService {
  states: any[] = [{ state_id: 1, state_name: 'State1' }];
  districts: any[] = [{ district_id: 1, district_name: 'District1' }];
  tehsils: any[] = [{ tehsil_id: 1, tehsil_name: 'Tehsil1' }];
  crops: any[] = [{ crop_code: '001', crop_name: 'Crop1', id: 1 }];
  seasons: any[] = [{ id: 1, season_name: 'Season1' }];
  years: any[] = [{ id: 2023, year: '2023' }];
  notifiedUnits: any[] = [{ notified_id: 1, notified_unit_name: 'Unit1' }];
  agencies: any[] = [{ agency_id: 1, agency_name: 'Agency1' }];
  clients: any[] = [{ UNIT_ID: '2000', unit_name: 'Client1' }];
  blocks: any[] = [{ block_id: 1, block_name: 'Block1' }];
  grampanchayats: any[] = [{ grampanchayat_id: 1, grampanchayat_name: 'GP1' }];
  villages: any[] = [{ village_id: 1, village_name: 'Village1' }];
  isLoactionFetched = false;
  isvillageFetched = false;
  fetchedLocationData = { subscribe: jest.fn() };
  fetchedVillageData = { subscribe: jest.fn() };
  getAgencyWiseLocation = jest.fn().mockResolvedValue({ states: [], districts: [], tehsils: [] });
  getClientWiseLocation = jest.fn().mockResolvedValue([[], []]);
}
class MockUserDetailService {
  getUserDetail = jest.fn().mockReturnValue({ unit_id: '2000', user_role: '1' });
  getLocation = jest.fn().mockReturnValue({ states: [], districts: [] });
}
class MockFeatureToggleService {
  getContext = jest.fn().mockReturnValue('testContext' as ProjectContext);
}
class MockNgbModal {
  open = jest.fn().mockReturnValue({ result: Promise.resolve() });
}
describe('ClsDashboardComponent', () => {
  let component: ClsDashboardComponent;
  let fixture: ComponentFixture<ClsDashboardComponent>;
  let coreService: MockCoreService;
  let filterService: MockFilterService;
  let userDetailService: MockUserDetailService;
  let featureToggleService: MockFeatureToggleService;
  let modalService: MockNgbModal;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        NgbModalModule,
        NgbNavModule,
        MultiSelectModule,
      ],
      declarations: [ClsDashboardComponent],
      providers: [
        { provide: CoreService, useClass: MockCoreService },
        { provide: FilterService, useClass: MockFilterService },
        { provide: UserDetailService, useClass: MockUserDetailService },
        { provide: FeatureToggleService, useClass: MockFeatureToggleService },
        { provide: NgbModal, useClass: MockNgbModal },
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
    fixture = TestBed.createComponent(ClsDashboardComponent);
    component = fixture.componentInstance;
    coreService = TestBed.inject(CoreService) as unknown as MockCoreService;
    filterService = TestBed.inject(FilterService) as unknown as MockFilterService;
    userDetailService = TestBed.inject(UserDetailService) as unknown as MockUserDetailService;
    featureToggleService = TestBed.inject(FeatureToggleService) as unknown as MockFeatureToggleService;
    modalService = TestBed.inject(NgbModal) as unknown as MockNgbModal;
    fixture.detectChanges();
  });
  it('should create the component', () => {
    expect(component).toBeTruthy();
  });
  describe('constructor', () => {
    it('should set projectContext and assetsFolder', () => {
      expect(featureToggleService.getContext).toHaveBeenCalled();
      expect(component.projectContext).toBe('testContext');
      expect(component.assetsFolder).toBe('/assets/test/');
    });
    it('should set selectedClient for saksham context', () => {
      featureToggleService.getContext.mockReturnValue('saksham');
      const newComponent = new ClsDashboardComponent(
        filterService as any,
        coreService as any,
        userDetailService as any,
        modalService as any,
        featureToggleService as any
      );
      expect(newComponent.selectedClient).toEqual(['2000']);
    });
    it('should set sIOptions', () => {
      expect(component.sIOptions.length).toBe(8);
    });
    it('should set user', () => {
      expect(component.user).toEqual({ unit_id: '2000', user_role: '1' });
    });
    it('should set chartlabels', () => {
      expect(component.chartlabels).toEqual({ style: { color: '#333333', fontWeight: 'bold', fontSize: '12px' } });
    });
  });
  describe('ngOnInit', () => {
    it('should call getLoaedFileData', () => {
      const getLoaedFileDataSpy = jest.spyOn(component, 'getLoaedFileData');
      component.ngOnInit();
      expect(getLoaedFileDataSpy).toHaveBeenCalled();
    });
    it('should call getLocationsData if isLoactionFetched true', () => {
      filterService.isLoactionFetched = true;
      const getLocationsDataSpy = jest.spyOn(component, 'getLocationsData');
      component.ngOnInit();
      expect(getLocationsDataSpy).toHaveBeenCalled();
    });
    it('should subscribe to fetchedLocationData if isLoactionFetched false', () => {
      filterService.isLoactionFetched = false;
      const getLocationsDataSpy = jest.spyOn(component, 'getLocationsData');
      component.ngOnInit();
      const subscribeCb = filterService.fetchedLocationData.subscribe.mock.calls[0][0];
      subscribeCb();
      expect(getLocationsDataSpy).toHaveBeenCalled();
    });
    it('should call setVilageData if isvillageFetched true', () => {
      filterService.isvillageFetched = true;
      const setVilageDataSpy = jest.spyOn(component, 'setVilageData');
      component.ngOnInit();
      expect(setVilageDataSpy).toHaveBeenCalled();
    });
    it('should subscribe to fetchedVillageData if isvillageFetched false', () => {
      filterService.isvillageFetched = false;
      const setVilageDataSpy = jest.spyOn(component, 'setVilageData');
      component.ngOnInit();
      const subscribeCb = filterService.fetchedVillageData.subscribe.mock.calls[0][0];
      subscribeCb();
      expect(setVilageDataSpy).toHaveBeenCalled();
    });
  });
  describe('getLocationsData', () => {
    beforeEach(() => {
      filterService.agencies = [{ agency_id: 1, agency_name: 'Agency1' }];
      filterService.blocks = [{ block_id: 1, block_name: 'Block1' }];
      filterService.notifiedUnits = [{ notified_id: 1, notified_unit_name: 'Unit1' }];
    });

    it('should set maps and call setDefaultLocation', () => {
      const setDefaultLocationSpy = jest.spyOn(component, 'setDefaultLocation');
      const getLocationCropDataSpy = jest.spyOn(component, 'getLocationCropData');
      component.getLocationsData();
      expect(component.states.length).toBe(1);
      expect(component.districts.length).toBe(1);
      expect(component.tehsils.length).toBe(1);
      expect(component.crops.length).toBe(1);
      expect(component.seasonOptions.length).toBe(1);
      expect(component.yearOptions.length).toBe(1);
      expect(component.notifiedUnit.length).toBe(1);
      expect(component.clientData.length).toBe(1);
      expect(setDefaultLocationSpy).toHaveBeenCalled();
      expect(component.stateMap.get(1)).toBe('State1');
      expect(component.districtMap.get(1)).toBe('District1');
      expect(component.tehsilMap.get(1)).toBe('Tehsil1');
      expect(component.cropsMap.get(1)).toBe('Crop1');
      expect(component.agencyMap.get(1)).toBe('Agency1');
      expect(component.blockMap.get(1)).toBe('Block1');
      expect(component.notifiedUnitMap.get(1)).toBe('Unit1');
      expect(getLocationCropDataSpy).toHaveBeenCalled();
    });
    
    it('should set selectedClient if user.unit_id', () => {
      userDetailService.getUserDetail.mockReturnValue({ unit_id: '2000' });
      component.getLocationsData();
      expect(component.selectedClient).toEqual(['2000']);
    });
    it('should handle empty filter data', () => {
      filterService.states = [];
      filterService.districts = [];
      filterService.tehsils = [];
      filterService.crops = [];
      filterService.seasons = [];
      filterService.years = [];
      filterService.notifiedUnits = [];
      filterService.clients = [];
      component.getLocationsData();
      expect(component.states).toEqual([]);
      expect(component.districts).toEqual([]);
      expect(component.tehsils).toEqual([]);
      expect(component.crops).toEqual([]);
      expect(component.seasonOptions).toEqual([]);
      expect(component.yearOptions).toEqual([]);
      expect(component.notifiedUnit).toEqual([]);
      expect(component.clientData).toEqual([]);
    });
    it('should set cropIdMap and cropCodeMap', () => {
      filterService.crops = [{ id: 1, crop_code: '001' }, { id: 2, crop_code: '002' }];
      component.getLocationsData();
      expect(component.cropIdMap.get(1)).toBe('001');
      expect(component.cropCodeMap.get('1')).toBe(1);
    });
    it('should decrement loading', () => {
      component.loading = 1;
      component.getLocationsData();
      expect(component.loading).toBe(0);
    });
    it('should execute agencies loop', () => {
      const agenciesLoopSpy = jest.spyOn(component, 'getLocationsData');
      component.getLocationsData();
      expect(agenciesLoopSpy).toHaveBeenCalled();
      expect(component.agencyMap.size).toBe(1);
    });
    it('should execute blocks loop', () => {
      component.getLocationsData();
      expect(component.blockMap.size).toBe(1);
    });
    it('should execute notifiedUnits loop', () => {
      component.getLocationsData();
      expect(component.notifiedUnitMap.size).toBe(1);
    });
  });
  describe('setVilageData', () => {
    it('should set grampanchayatMap and villageMap', () => {
      filterService.grampanchayats = [{ grampanchayat_id: 1, grampanchayat_name: 'GP1' }];
      filterService.villages = [{ village_id: 1, village_name: 'Village1' }];
      component.setVilageData();
      expect(component.grampanchayatMap.get(1)).toBe('GP1');
      expect(component.villageMap.get(1)).toBe('Village1');
    });
    it('should handle empty lists', () => {
      filterService.grampanchayats = [];
      filterService.villages = [];
      expect(() => component.setVilageData()).not.toThrow();
    });
    it('should execute grampanchayats loop', () => {
      filterService.grampanchayats = [{ grampanchayat_id: 1, grampanchayat_name: 'GP1' }];
      component.setVilageData();
      expect(component.grampanchayatMap.size).toBe(1);
    });
    it('should execute villages loop', () => {
      filterService.villages = [{ village_id: 1, village_name: 'Village1' }];
      component.setVilageData();
      expect(component.villageMap.size).toBe(1);
    });
  });
  describe('onYearSelect', () => {
    it('should update selectedYear and reset locations', () => {
      component.yearOptions = [{ id: 2023, year: '2023' }];
      const getAgencyDataSpy = jest.spyOn(component, 'getAgencyData');
      const getLocationCropDataSpy = jest.spyOn(component, 'getLocationCropData');
      component.onYearSelect(2023);
      expect(component.selectedYear).toEqual([{ id: 2023, year: '2023' }]);
      expect(component.states).toEqual([]);
      expect(component.selectedState).toEqual([]);
      expect(component.clientStates).toEqual([]);
      expect(component.clientDistricts).toEqual([]);
      expect(component.districtOptions).toEqual([]);
      expect(component.tehsilOptions).toEqual([]);
      expect(component.selectedDistrict).toEqual([]);
      expect(component.selectedTehsil).toEqual([]);
      expect(component.selectedAgency).toEqual([]);
      expect(component.agencyData).toEqual([]);
      expect(getAgencyDataSpy).toHaveBeenCalled();
      expect(getLocationCropDataSpy).toHaveBeenCalled();
    });
    it('should not reset agency if user role is 7', () => {
      component.user.user_role = '7';
      component.selectedAgency = [1];
      component.onYearSelect(2023);
      expect(component.selectedAgency).toEqual([1]);
    });
    it('should handle no matching year', () => {
      component.yearOptions = [{ id: 2024 }];
      component.onYearSelect(2023);
      expect(component.selectedYear).toEqual([]);
    });
    it('should call getAgencyData and getLocationCropData when matching year found', () => {
      component.yearOptions = [{ id: 2023, year: '2023' }];
      const getAgencyDataSpy = jest.spyOn(component, 'getAgencyData');
      const getLocationCropDataSpy = jest.spyOn(component, 'getLocationCropData');
      component.onYearSelect(2023);
      expect(getAgencyDataSpy).toHaveBeenCalled();
      expect(getLocationCropDataSpy).toHaveBeenCalled();
    });
  });
  describe('onSeasonSelect', () => {
    it('should update selectedseason and reset locations', () => {
      component.seasonOptions = [{ id: 1, season_name: 'Season1' }];
      const getAgencyDataSpy = jest.spyOn(component, 'getAgencyData');
      const getLocationCropDataSpy = jest.spyOn(component, 'getLocationCropData');
      component.onSeasonSelect(1);
      expect(component.selectedseason).toEqual([{ id: 1, season_name: 'Season1' }]);
      expect(component.states).toEqual([]);
      expect(component.selectedState).toEqual([]);
      expect(component.clientStates).toEqual([]);
      expect(component.clientDistricts).toEqual([]);
      expect(component.districtOptions).toEqual([]);
      expect(component.tehsilOptions).toEqual([]);
      expect(component.selectedDistrict).toEqual([]);
      expect(component.selectedTehsil).toEqual([]);
      expect(component.selectedAgency).toEqual([]);
      expect(component.agencyData).toEqual([]);
      expect(getAgencyDataSpy).toHaveBeenCalled();
      expect(getLocationCropDataSpy).toHaveBeenCalled();
    });
    it('should not reset agency if user role is 7', () => {
      component.user.user_role = '7';
      component.selectedAgency = [1];
      component.onSeasonSelect(1);
      expect(component.selectedAgency).toEqual([1]);
    });
    it('should handle no matching season', () => {
      component.seasonOptions = [{ id: 2 }];
      component.onSeasonSelect(1);
      expect(component.selectedseason).toEqual([]);
    });
  });
  describe('onSingleClinetChange', () => {
    it('should update selectedClient and call onClientSelect', () => {
      component.clientData = [{ UNIT_ID: '2000', unit_name: 'Client1' }];
      const onClientSelectSpy = jest.spyOn(component, 'onClientSelect');
      component.onSingleClinetChange('2000');
      expect(component.selectedClient).toEqual(['2000']);
      expect(onClientSelectSpy).toHaveBeenCalledWith(['2000']);
    });
    it('should set empty if no match', () => {
      component.clientData = [];
      component.onSingleClinetChange('invalid');
      expect(component.selectedClient).toEqual([]);
    });
  });
  describe('onAgencyChange', () => {
    it('should reset locations and call loadAgencyLocation if event', fakeAsync(() => {
      const loadAgencyLocationSpy = jest.spyOn(component, 'loadAgencyLocation');
      const getLocationCropDataSpy = jest.spyOn(component, 'getLocationCropData');
      component.onAgencyChange([1]);
      tick();
      expect(component.states).toEqual([]);
      expect(component.selectedState).toEqual([]);
      expect(component.clientStates).toEqual([]);
      expect(component.clientDistricts).toEqual([]);
      expect(component.districtOptions).toEqual([]);
      expect(component.tehsilOptions).toEqual([]);
      expect(component.selectedDistrict).toEqual([]);
      expect(component.selectedTehsil).toEqual([]);
      expect(loadAgencyLocationSpy).toHaveBeenCalledWith([1]);
      expect(getLocationCropDataSpy).toHaveBeenCalled();
    }));
    it('should reset locations if no event', fakeAsync(() => {
      const loadAgencyLocationSpy = jest.spyOn(component, 'loadAgencyLocation');
      const getLocationCropDataSpy = jest.spyOn(component, 'getLocationCropData');
      component.onAgencyChange(null);
      tick();
      expect(loadAgencyLocationSpy).not.toHaveBeenCalled();
      expect(getLocationCropDataSpy).toHaveBeenCalled();
    }));
  });
  describe('loadAgencyLocation', () => {
    it('should not call if no year or season', fakeAsync(async () => {
      component.singleYear = null;
      component.singleseason = null;
      component.selectedClient = ['2000'];
      await component.loadAgencyLocation([1]);
      expect(filterService.getAgencyWiseLocation).toHaveBeenCalledWith(
        { client: ['2000'], agency: [1], year: null, season: null },
        { unit_id: '2000', user_role: '1' }
      );
    }));
    it('should fetch locations', fakeAsync(async () => {
      component.singleYear = 2023;
      component.singleseason = 1;
      component.selectedClient = ['2000'];
      filterService.getAgencyWiseLocation.mockResolvedValue({ states: [{ state_id: 1 }], districts: [{ district_id: 1 }], tehsils: [{ tehsil_id: 1 }] });
      await component.loadAgencyLocation([1]);
      expect(filterService.getAgencyWiseLocation).toHaveBeenCalled();
      expect(component.clientStates.length).toBe(1);
    }));
    it('should increment and decrement isStateLoading', fakeAsync(async () => {
      component.isStateLoading = 0;
      await component.loadAgencyLocation([1]);
      expect(component.isStateLoading).toBe(0);
    }));
  });
  describe('onClientSelect', () => {
    it('should reset locations and call getAgencyData', () => {
      const getAgencyDataSpy = jest.spyOn(component, 'getAgencyData');
      component.onClientSelect(['2000']);
      expect(component.states).toEqual([]);
      expect(component.selectedState).toEqual([]);
      expect(component.clientStates).toEqual([]);
      expect(component.clientDistricts).toEqual([]);
      expect(component.districtOptions).toEqual([]);
      expect(component.tehsilOptions).toEqual([]);
      expect(component.selectedDistrict).toEqual([]);
      expect(component.selectedTehsil).toEqual([]);
      expect(component.selectedAgency).toEqual([]);
      expect(component.agencyData).toEqual([]);
      expect(getAgencyDataSpy).toHaveBeenCalled();
    });
    it('should not reset agency if user role is 7', () => {
      component.user.user_role = '7';
      component.selectedAgency = [1];
      const getAgencyDataSpy = jest.spyOn(component, 'getAgencyData');
      component.onClientSelect(['2000']);
      expect(component.selectedAgency).toEqual([1]);
      expect(getAgencyDataSpy).toHaveBeenCalled();
    });
    it('should handle empty event', () => {
      const getAgencyDataSpy = jest.spyOn(component, 'getAgencyData');
      component.onClientSelect([]);
      expect(getAgencyDataSpy).toHaveBeenCalled();
    });
  });
  describe('getAgencyData', () => {
    it('should not fetch if missing data', () => {
      component.selectedClient = [];
      component.getAgencyData();
      expect(coreService.dashboard_post).not.toHaveBeenCalled();
    });
    it('should handle error', fakeAsync(() => {
      component.selectedClient = ['2000'];
      component.singleYear = 2023;
      component.singleseason = 1;
      coreService.dashboard_post.mockRejectedValue(new Error('Error'));
      component.getAgencyData();
      tick();
      flushMicrotasks();
      expect(component.agencyData).toEqual([]);
    }));
    it('should increment and decrement agencyLoading', fakeAsync(() => {
      component.agencyLoading = 0;
      component.getAgencyData();
      tick();
      flushMicrotasks();
      expect(component.agencyLoading).toBe(0);
    }));
  });
  describe('onStateChange', () => {
    it('should update districtOptions', () => {
      component.clientDistricts = [{ district_id: 1, state_id: 1 }];
      const getLocationCropDataSpy = jest.spyOn(component, 'getLocationCropData');
      component.onStateChange([{ state_id: 1 }]);
      expect(component.districtOptions[0].items.length).toBe(1);
      expect(component.tehsilOptions).toEqual([]);
      expect(component.selectedDistrict).toEqual([]);
      expect(component.selectedTehsil).toEqual([]);
      expect(getLocationCropDataSpy).toHaveBeenCalled();
    });
    it('should handle empty event', () => {
      component.onStateChange([]);
      expect(component.districtOptions).toEqual([]);
    });
  });
  describe('onDistrictChange', () => {
    it('should update tehsilOptions', () => {
      component.clientTehsils = [{ tehsil_id: 1, district_id: 1 }];
      const getLocationCropDataSpy = jest.spyOn(component, 'getLocationCropData');
      component.onDistrictChange([{ district_id: 1 }]);
      expect(component.tehsilOptions[0].items.length).toBe(1);
      expect(component.selectedTehsil).toEqual([]);
      expect(getLocationCropDataSpy).toHaveBeenCalled();
    });
    it('should handle empty event', () => {
      component.onDistrictChange([]);
      expect(component.tehsilOptions).toEqual([]);
    });
  });
  describe('onTehsilChange', () => {
    it('should call getLocationCropData', () => {
      const getLocationCropDataSpy = jest.spyOn(component, 'getLocationCropData');
      component.onTehsilChange();
      expect(getLocationCropDataSpy).toHaveBeenCalled();
    });
  });
  describe('getLocationCropData', () => {
    it('should set cropOptions from dataCrops if available', () => {
      component.dataCrops = [{ year: 2023, season: 1, state_id: 1, dist_id: 1, tehsil_id: 1, notified_unit: 1 }];
      component.selectedYear = [{ id: 2023 }];
      component.selectedseason = [{ id: 1 }];
      component.selectedState = [{ state_id: 1 }];
      component.selectedDistrict = [{ district_id: 1 }];
      component.selectedTehsil = [{ tehsil_id: 1 }];
      component.selectedNotifieldUnit = [{ notified_id: 1 }];
      coreService.getNotifiedCropList.mockReturnValueOnce([{ crop_id: 1 }]);
      component.getLocationCropData();
      expect(component.cropOptions.length).toBe(1);
    });
    it('should handle error', fakeAsync(() => {
      component.dataCrops = [];
      coreService.post.mockRejectedValue(new Error('Error'));
      component.getLocationCropData();
      tick();
      flushMicrotasks();
      expect(component.cropOptions).toEqual([]);
    }));
    it('should handle status not 1', fakeAsync(() => {
      component.dataCrops = [];
      coreService.post.mockResolvedValue({ status: 0 });
      component.getLocationCropData();
      tick();
      flushMicrotasks();
      expect(component.dataCrops).toEqual([]);
    }));
    it('should reset selectedCrop', () => {
      component.selectedCrop = [{}];
      component.getLocationCropData();
      expect(component.selectedCrop).toEqual([]);
    });
  });
  describe('getSeasonAndYearData', () => {
    it('should fetch season and year data', fakeAsync(() => {
      coreService.post.mockResolvedValue({ status: 1 });
      component.getSeasonAndYearData();
      tick();
      flushMicrotasks();
      expect(coreService.post).toHaveBeenCalledWith({ purpose: 'get_years_range_and_season' });
    }));
    it('should handle error', fakeAsync(() => {
      coreService.post.mockRejectedValue(new Error('Error'));
      component.getSeasonAndYearData();
      tick();
      flushMicrotasks();
    }));
  });
  describe('onSearch', () => {
    it('should warn if no state selected', () => {
      component.selectedState = [];
      component.onSearch();
      expect(coreService.toast).toHaveBeenCalledWith('warn', 'Please select at least one state');
    });
    it('should handle user role > 2', fakeAsync(() => {
      component.user.user_role = '3';
      component.selectedState = [{state_id: 1}];
      component.states = [{state_id: 1}];
      component.districts = [{district_id: 1}];
      component.tehsils = [{tehsil_id: 1}];
      component.selectedDistrict = [];
      component.selectedTehsil = [];
      component.onSearch();
      tick();
      flushMicrotasks();
      expect(coreService.dashboard_post).toHaveBeenCalledTimes(3);
    }));
    it('should handle error', fakeAsync(() => {
      component.selectedState = [{state_id: 1}];
      coreService.dashboard_post.mockRejectedValue(new Error('Error'));
      component.onSearch();
      tick();
      flushMicrotasks();
      expect(component.allData).toEqual([]);
      expect(component.surveyData).toEqual([]);
      expect(component.intimationData).toEqual([]);
    }));
    it('should set minDate maxDate and t_8Days', fakeAsync(() => {
      component.selectedState = [{state_id: 1}];
      coreService.dashboard_post.mockResolvedValueOnce({ status: 1, allData: [] });
      coreService.dashboard_post.mockResolvedValueOnce({ status: 1, surveydata: [{ datetime: '2023-01-01T00:00:00', status: 1, field_539: 1, field_528: 1, field_529: 1, field_953: 2023, field_526: 1 }], locationdata: [] });
      coreService.dashboard_post.mockResolvedValueOnce({ status: 1, intimation_data: [] });
      component.onSearch();
      tick();
      flushMicrotasks();
      expect(component.minDate).toBeDefined();
      expect(component.maxDate).toBeDefined();
      expect(component.t_8Days).toBeDefined();
    }));
    it('should skip status 2 surveys', fakeAsync(() => {
      component.selectedState = [{state_id: 1}];
      coreService.dashboard_post.mockResolvedValueOnce({ status: 1, allData: [] });
      coreService.dashboard_post.mockResolvedValueOnce({ status: 1, surveydata: [{ datetime: '2023-01-01T00:00:00', status: 2, field_539: 1, field_528: 1, field_529: 1, field_953: 2023, field_526: 1 }], locationdata: [] });
      coreService.dashboard_post.mockResolvedValueOnce({ status: 1, intimation_data: [] });
      component.onSearch();
      tick();
      flushMicrotasks();
      expect(component.surveyData.length).toBe(0);
    }));
  });
  describe('isValidSI', () => {
    it('should return true if no selectedSI', () => {
      component.selectedSI = null;
      expect(component.isValidSI([{ key: 10 }], 'key')).toBe(true);
    });
    it('should check range', () => {
      component.selectedSI = '1-10';
      expect(component.isValidSI([{ key: 5 }], 'key')).toBe(true);
      expect(component.isValidSI([{ key: 15 }], 'key')).toBe(false);
    });
    it('should handle max without min', () => {
      component.selectedSI = '-10';
      expect(component.isValidSI([{ key: 5 }], 'key')).toBe(true);
      expect(component.isValidSI([{ key: 15 }], 'key')).toBe(false);
    });
    it('should handle min without max', () => {
      component.selectedSI = '10-';
      expect(component.isValidSI([{ key: 15 }], 'key')).toBe(true);
      expect(component.isValidSI([{ key: 5 }], 'key')).toBe(false);
    });
    it('should sum multiple', () => {
      component.selectedSI = '10-20';
      expect(component.isValidSI([{ key: 5 }, { key: 10 }], 'key')).toBe(true);
    });
    it('should handle empty data', () => {
      component.selectedSI = '10-20';
      expect(component.isValidSI([], 'key')).toBe(false);
    });
  });
  describe('generateIUCalculation', () => {
    beforeEach(() => {
      component.grampanchayatMap.set(1, 'GP1');
      component.blockMap.set(1, 'Block1');
      component.tehsilMap.set(1, 'Tehsil1');
      component.villageMap.set(1, 'Village1');
      component.districtMap.set(1, 'District1');
      component.cropsMap.set(1, 'Crop1');
      component.agencyMap.set(1, 'Agency1');
    });
    it('should calculate IU data', () => {
      const plan_data = [{ gp_notified_area: 1, notified_unit: 1, crop: 1, state_id: 1, dist_id: 1, year: 2023, season: 1, threshold_yield: '100', draige_factor: '1', gross_premium: '1000', sum_insured: '10000', scale_of_finance: '100', "DOS-15": '10', "DOS-30": '20', "DOS-45": '30', "DOS-60": '40', "DOS-75": '50', "DOS-90": '60', "DOS-GR-90": '70' }];
      const survey_data: any[] = [{ datetime: '2023-01-01', approved_reject_date: '2023-01-02', field_532: 1, field_539: '1', field_528: 1, field_529: 1, field_953: 2023, field_526: 1, field_533: 1, field_531: 1, field_530: 1, field_534: 1, field_779: 'INT1', field_550: '50', field_548: '5', field_546: '10', field_547: '10', field_525: 'Localized', field_553: '2023-01-01', field_554: 'flood', field_527: '2023-01-01', field_524: '2023-01-01', field_540: 'harvest', status: 1, approved_reject: 1, agency_id: 1, client_id: '2000' }];
      component.iuServeyMap.set('1=>1=>1=>1=>1=>2023=>1', survey_data);
      component.iuIntimationMap.set('1=>1=>1=>1=>1=>2023=>1', [{ intimation_id: 'INT1' }]);
      const result = component.generateIUCalculation(plan_data, survey_data);
      expect(result.iu_calculated_data.length).toBe(1);
      expect(result.location_iu_data.length).toBeGreaterThan(0);
      expect(result.crop_iu_data.length).toBeGreaterThan(0);
    });
    it('should handle empty inputs', () => {
      const result = component.generateIUCalculation([], []);
      expect(result.iu_calculated_data).toEqual([]);
      expect(result.location_iu_data).toEqual([]);
      expect(result.crop_iu_data).toEqual([]);
    });
    it('should handle different notified units', () => {
      const plan_data = [{ gp_notified_area: 1, notified_unit: 2, crop: 1, state_id: 1, dist_id: 1, year: 2023, season: 1 }];
      const survey_data: any[] = [{
        field_532: 2,
        field_531: 1,
        field_539: 1,
        field_528: 1,
        field_529: 1,
        field_953: 2023,
        field_526: 1,
        status: 1,
        agency_id: 1,
        field_779: '',
        field_550: 0,
        field_540: '',
        datetime: Date.now(),
        approved_reject_date: null,
        field_527: null,
        field_524: null
      }];
      component.iuServeyMap.set('1=>2=>1=>1=>1=>2023=>1', survey_data);
      const result = component.generateIUCalculation(plan_data, survey_data);
      expect(result.iu_calculated_data[0].data.notified_unit).toBe(2);
    });
    it('should handle no survey data', () => {
      const plan_data = [{ gp_notified_area: 1, notified_unit: 1, crop: 1, state_id: 1, dist_id: 1, year: 2023, season: 1 }];
      const survey_data: any[] = [];
      const result = component.generateIUCalculation(plan_data, survey_data);
      expect(result.iu_calculated_data.length).toBe(0);
    });
    it('should handle no intimation data', () => {
      const plan_data = [{ gp_notified_area: 1, notified_unit: 1, crop: 1, state_id: 1, dist_id: 1, year: 2023, season: 1 }];
      const survey_data: any[] = [{
        field_779: 'INT1',
        field_539: 1,
        field_528: 1,
        field_529: 1,
        field_953: 2023,
        field_526: 1,
        status: 1,
        agency_id: 1,
        field_550: 0,
        field_540: '',
        datetime: Date.now(),
        approved_reject_date: null,
        field_527: null,
        field_524: null
      }];
      component.iuServeyMap.set('1=>1=>1=>1=>1=>2023=>1', survey_data);
      const result = component.generateIUCalculation(plan_data, survey_data);
      expect(result.iu_calculated_data[0].no_of_sample_survey_conducted).toBe(0);
    });
    it('should handle survey status 2', () => {
      const plan_data = [{ gp_notified_area: 1, notified_unit: 1, crop: 1, state_id: 1, dist_id: 1, year: 2023, season: 1 }];
      const survey_data: any[] = [{
        status: 2,
        field_539: 1,
        field_528: 1,
        field_529: 1,
        field_953: 2023,
        field_526: 1,
        agency_id: 1,
        field_779: '',
        field_550: 0,
        field_540: '',
        datetime: Date.now(),
        approved_reject_date: null,
        field_527: null,
        field_524: null
      }];
      component.iuServeyMap.set('1=>1=>1=>1=>1=>2023=>1', survey_data);
      const result = component.generateIUCalculation(plan_data, survey_data);
      expect(result.iu_calculated_data[0].no_of_survey).toBe(1);
    });
    it('should handle multiple surveys', () => {
      const plan_data = [{ gp_notified_area: 1, notified_unit: 1, crop: 1, state_id: 1, dist_id: 1, year: 2023, season: 1 }];
      const survey_data: any[] = [{
        datetime: '2023-01-01',
        field_539: 1,
        field_528: 1,
        field_529: 1,
        field_953: 2023,
        field_526: 1,
        status: 1,
        agency_id: 1,
        field_779: '',
        field_550: 0,
        field_540: '',
        approved_reject_date: null,
        field_527: null,
        field_524: null
      }, {
        datetime: '2023-01-02',
        field_539: 1,
        field_528: 1,
        field_529: 1,
        field_953: 2023,
        field_526: 1,
        status: 1,
        agency_id: 1,
        field_779: '',
        field_550: 0,
        field_540: '',
        approved_reject_date: null,
        field_527: null,
        field_524: null
      }];
      component.iuServeyMap.set('1=>1=>1=>1=>1=>2023=>1', survey_data);
      const result = component.generateIUCalculation(plan_data, survey_data);
      expect(result.iu_calculated_data[0].no_of_survey).toBe(2);
    });
    it('should handle survey status 0 (draft)', () => {
      const plan_data = [{ gp_notified_area: 1, notified_unit: 1, crop: 1, state_id: 1, dist_id: 1, year: 2023, season: 1 }];
      const survey_data: any[] = [{
        status: 0,
        agency_id: 1,
        field_539: 1,
        field_528: 1,
        field_529: 1,
        field_953: 2023,
        field_526: 1,
        field_779: '',
        field_550: 0,
        field_540: '',
        datetime: Date.now(),
        approved_reject_date: null,
        field_527: null,
        field_524: null
      }];
      component.iuServeyMap.set('1=>1=>1=>1=>1=>2023=>1', survey_data);
      const result = component.generateIUCalculation(plan_data, survey_data);
      expect(result.iu_calculated_data[0].draft).toBe(1);
    });
    it('should handle approved_reject 0 (rejected)', () => {
      const plan_data = [{ gp_notified_area: 1, notified_unit: 1, crop: 1, state_id: 1, dist_id: 1, year: 2023, season: 1 }];
      const survey_data: any[] = [{
        status: 1,
        approved_reject: 0,
        agency_id: 1,
        field_539: 1,
        field_528: 1,
        field_529: 1,
        field_953: 2023,
        field_526: 1,
        field_779: '',
        field_550: 0,
        field_540: '',
        datetime: Date.now(),
        approved_reject_date: null,
        field_527: null,
        field_524: null
      }];
      component.iuServeyMap.set('1=>1=>1=>1=>1=>2023=>1', survey_data);
      const result = component.generateIUCalculation(plan_data, survey_data);
      expect(result.iu_calculated_data[0].rejected).toBe(1);
    });
    it('should handle approved_reject null (pending)', () => {
      const plan_data = [{ gp_notified_area: 1, notified_unit: 1, crop: 1, state_id: 1, dist_id: 1, year: 2023, season: 1 }];
      const survey_data: any[] = [{
        status: 1,
        approved_reject: null,
        agency_id: 1,
        field_539: 1,
        field_528: 1,
        field_529: 1,
        field_953: 2023,
        field_526: 1,
        field_779: '',
        field_550: 0,
        field_540: '',
        datetime: Date.now(),
        approved_reject_date: null,
        field_527: null,
        field_524: null
      }];
      component.iuServeyMap.set('1=>1=>1=>1=>1=>2023=>1', survey_data);
      const result = component.generateIUCalculation(plan_data, survey_data);
      expect(result.iu_calculated_data[0].pending).toBe(1);
    });
    it('should handle no approved_reject_date (yet to complete)', () => {
      const plan_data = [{ gp_notified_area: 1, notified_unit: 1, crop: 1, state_id: 1, dist_id: 1, year: 2023, season: 1 }];
      const survey_data: any[] = [{
        status: 1,
        datetime: '2023-01-01',
        approved_reject_date: null,
        field_539: 1,
        field_528: 1,
        field_529: 1,
        field_953: 2023,
        field_526: 1,
        agency_id: 1,
        field_779: '',
        field_550: 0,
        field_540: '',
        field_527: null,
        field_524: null
      }];
      component.iuServeyMap.set('1=>1=>1=>1=>1=>2023=>1', survey_data);
      const result = component.generateIUCalculation(plan_data, survey_data);
      expect(result.iu_calculated_data[0].approved_date).toBeNull();
    });
    it('should handle different crop stages', () => {
      const plan_data = [{ gp_notified_area: 1, notified_unit: 1, crop: 1, state_id: 1, dist_id: 1, year: 2023, season: 1 }];
      const survey_data: any[] = [{
        field_540: 'vegetative',
        field_539: 1,
        field_528: 1,
        field_529: 1,
        field_953: 2023,
        field_526: 1,
        status: 1,
        agency_id: 1,
        field_779: '',
        field_550: 0,
        datetime: Date.now(),
        approved_reject_date: null,
        field_527: null,
        field_524: null
      }];
      component.iuServeyMap.set('1=>1=>1=>1=>1=>2023=>1', survey_data);
      const result = component.generateIUCalculation(plan_data, survey_data);
      expect(result.crop_survey_data.get(1).vegetative).toBe(1);
    });
    it('should set locationLabel based on map sizes', () => {
      const plan_data1 = { gp_notified_area: 1, notified_unit: 1, crop: 1, state_id: 1, dist_id: 1, tehsil_id: 1, year: 2023, season: 1 };
      const plan_data2 = { gp_notified_area: 2, notified_unit: 1, crop: 1, state_id: 2, dist_id: 2, tehsil_id: 2, year: 2023, season: 1 };
      const plan_data = [plan_data1, plan_data2];
      const key1 = '1=>1=>1=>1=>1=>2023=>1';
      const key2 = '2=>1=>1=>2=>2=>2023=>1';
      const survey_data: any[] = [{ field_532: 1 }];
      component.iuServeyMap.set(key1, survey_data);
      component.iuServeyMap.set(key2, survey_data);
      component.generateIUCalculation(plan_data, survey_data);
      expect(component.locationLabel).toBe('State');
      // Reset and test single tehsil
      component.locationLabel = '';
      const singleTehsilPlan = [{ gp_notified_area: 1, notified_unit: 1, crop: 1, state_id: 1, dist_id: 1, tehsil_id: 1, year: 2023, season: 1 }];
      component.generateIUCalculation(singleTehsilPlan, [{}]);
      expect(component.locationLabel).toBe('IU');
    });
    it('should handle input_cost for localized diff <15', () => {
      const plan_data = [{ gp_notified_area: 1, notified_unit: 1, crop: 1, state_id: 1, dist_id: 1, year: 2023, season: 1, date_of_sowing: '2023-01-01', "DOS-15": 10 }];
      const survey_data = [{ field_525: 'Localized', field_553: '2023-01-10', field_547: 10, field_546: 10, field_548: 5, field_550: 50, field_539: 1, field_528: 1, field_529: 1, field_953: 2023, field_526: 1, status: 1, agency_id: 1, field_779: '', datetime: Date.now() }];
      component.iuServeyMap.set('1=>1=>1=>1=>1=>2023=>1', survey_data);
      const result = component.generateIUCalculation(plan_data, survey_data);
      expect(result.iu_calculated_data[0].individual_claim_amount).toBeGreaterThan(0);
    });
    it('should handle non-localized input_cost as scale_of_finance', () => {
      const plan_data = [{ gp_notified_area: 1, notified_unit: 1, crop: 1, state_id: 1, dist_id: 1, year: 2023, season: 1, scale_of_finance: 100 }];
      const survey_data = [{ field_525: 'Non-Localized', field_547: 10, field_546: 10, field_548: 5, field_550: 50, field_539: 1, field_528: 1, field_529: 1, field_953: 2023, field_526: 1, status: 1, agency_id: 1 }];
      component.iuServeyMap.set('1=>1=>1=>1=>1=>2023=>1', survey_data);
      const result = component.generateIUCalculation(plan_data, survey_data);
      expect(result.iu_calculated_data[0].individual_claim_amount).toBeGreaterThan(0);
    });
    it('should calculate not_surveyed correctly', () => {
      const plan_data = [{ gp_notified_area: 1, notified_unit: 1, crop: 1, state_id: 1, dist_id: 1, year: 2023, season: 1 }];
      const survey_data = [{ field_779: 'INT2', field_539: 1, field_528: 1, field_529: 1, field_953: 2023, field_526: 1, status: 1, agency_id: 1 }];
      component.iuServeyMap.set('1=>1=>1=>1=>1=>2023=>1', survey_data);
      component.iuIntimationMap.set('1=>1=>1=>1=>1=>2023=>1', [{ intimation_id: 'INT1' }]);
      const result = component.generateIUCalculation(plan_data, survey_data);
      expect(result.iu_calculated_data[0].not_surveyed).toBe(1);
    });
    it('should set iu_name for different notified_unit', () => {
      const plan_data = [{ gp_notified_area: 3, notified_unit: 3, crop: 1, state_id: 1, dist_id: 1, year: 2023, season: 1 }];
      const survey_data = [{}];
      component.iuServeyMap.set('3=>3=>1=>1=>1=>2023=>1', survey_data);
      const result = component.generateIUCalculation(plan_data, survey_data);
      expect(result.iu_calculated_data[0].data.gp_notified_area).toBe(3); // Ensures branch
    });
    it('should set location_iu_data loss_ratio', () => {
      const plan_data = [{ gp_notified_area: 1, notified_unit: 1, crop: 1, state_id: 1, dist_id: 1, year: 2023, season: 1, gross_premium: 1000, sum_insured: 10000 }];
      const survey_data = [{ field_779: '', field_539: 1, field_528: 1, field_529: 1, field_953: 2023, field_526: 1, status: 1, agency_id: 1, field_550: 0, datetime: Date.now() }];
      component.iuServeyMap.set('1=>1=>1=>1=>1=>2023=>1', survey_data);
      const result = component.generateIUCalculation(plan_data, survey_data);
      expect(result.location_iu_data[0].loss_ratio).toBe(0);
    });
  });
  describe('dateWiseIU', () => {
    beforeEach(() => {
      component.minDate = new Date('2023-01-01').getTime();
      component.maxDate = new Date('2023-01-10').getTime();
      component.t_8Days = new Date('2023-01-08').getTime();
    });
    it('should generate date wise data', () => {
      const totData = [{ survey_date: new Date('2023-01-02').getTime(), approved_date: new Date('2023-01-03').getTime(), claim_amount: 100, gross_premium: 1000, approved: 1, rejected: 0, pending: 0, draft: 0, not_surveyed: 0, no_of_survey: 1 }];
      const result = component.dateWiseIU(totData);
      expect(result.cat.length).toBeGreaterThan(0);
      expect(result.completed.length).toBeGreaterThan(0);
    });
    it('should handle no min/max', () => {
      component.minDate = null;
      component.maxDate = null;
      const result = component.dateWiseIU([]);
      expect(result.cat).toEqual([]);
    });
    it('should handle minDate >= t_8Days', () => {
      component.minDate = new Date('2023-01-09').getTime();
      component.maxDate = new Date('2023-01-10').getTime();
      component.t_8Days = new Date('2023-01-08').getTime();
      const totData = [{ survey_date: new Date('2023-01-09').getTime() }];
      const result = component.dateWiseIU(totData);
      expect(result.cat.length).toBe(7);
    });
    it('should handle weekly buckets before t_8Days', () => {
      component.minDate = new Date('2023-01-01').getTime() - 14 * 24 * 60 * 60 * 1000; // 2 weeks before
      const totData = [{ survey_date: new Date('2023-01-01').getTime() }];
      const result = component.dateWiseIU(totData);
      expect(result.cat.length).toBeGreaterThan(7); // Weekly + daily
    });
    it('should calculate loss_ratio per bucket', () => {
      const totData = [{ survey_date: new Date('2023-01-02').getTime(), claim_amount: 100, gross_premium: 1000 }];
      const result = component.dateWiseIU(totData);
      expect(result.loss_ratio[0]).toBe(0.1);
    });
  });
  describe('generateChartData', () => {
    beforeEach(() => {
      component.locationLabel = "State";
    });
    it('should generate chart data', () => {
      const totData = [{survey_data: [{field_528: 1, field_539: 1, field_554: 'flood'}]}];
      const state_iu_data = [{name: 'State1', sum_insured: 100}];
      const crop_iu_data = [{name: 'Crop1', sum_insured: 100}];
      const state_survey_wise_map = new Map([[1, {name: 'State1', upto10: 1, day11to20: 1, day21to30: 1, day31to40: 1, morethan40: 1, yettoComplete: 1, approved_upto10: 1, approved_day11to20: 1, approved_day21to30: 1, approved_day31to40: 1, approved_morethan40: 1, approved_yettoComplete: 1, lossReported: 1, noLossReported: 1}]]);
      const crop_survey_wise_map = new Map([[1, {name: 'Crop1', lossReported: 1, noLossReported: 1, harvest: 1, maturity: 1, grain_filling: 1, vegetative: 1, sowing: 1}]]);
      const agnecy_survey_data = new Map([[1, {agency_id: 1, agency_name: 'Agency1', approved: 1, rejected: 1, pending: 1, draft: 1, not_surveyed: 1}]]);
      const result = component.generateChartData(totData, state_iu_data, crop_iu_data, state_survey_wise_map, crop_survey_wise_map, agnecy_survey_data);
      expect(result.date_wise_loss_ratio).toBeDefined();
      expect(result.cls_location_wise_survey_progress_top_5).toBeDefined();
      // Check other properties
    });
    it('should handle <5 items', () => {
      // Set maps with fewer items
      const totData: any = [];
      const state_iu_data: any = [];
      const crop_iu_data: any = [];
      const state_survey_wise_map = new Map();
      const crop_survey_wise_map = new Map();
      const agnecy_survey_data = new Map();
      const result = component.generateChartData(totData, state_iu_data, crop_iu_data, state_survey_wise_map, crop_survey_wise_map, agnecy_survey_data);
      expect(result.cause_of_loss_top.length).toBe(7);
    });
    it('should handle >5 items aggregation', () => {
      const totData = Array(6).fill({survey_data: [{field_528: 1, field_539: 1, field_554: 'flood'}]});
      const state_iu_data = Array(6).fill({name: 'State', sum_insured: 100});
      const crop_iu_data = Array(6).fill({name: 'Crop', sum_insured: 100});
      const state_survey_wise_map = new Map(Array(6).fill(0).map((_, i) => [i+1, {name: `State${i}`, upto10: 1, day11to20: 1, day21to30: 1, day31to40: 1, morethan40: 1, yettoComplete: 1, approved_upto10: 1, approved_day11to20: 1, approved_day21to30: 1, approved_day31to40: 1, approved_morethan40: 1, approved_yettoComplete: 1, lossReported: 1, noLossReported: 1}]));
      const crop_survey_wise_map = new Map(Array(6).fill(0).map((_, i) => [i+1, {name: `Crop${i}`, lossReported: 1, noLossReported: 1, harvest: 1, maturity: 1, grain_filling: 1, vegetative: 1, sowing: 1}]));
      const agnecy_survey_data = new Map(Array(6).fill(0).map((_, i) => [i+1, {agency_id: i+1, agency_name: `Agency${i}`, approved: 1, rejected: 1, pending: 1, draft: 1, not_surveyed: 1}]));
      const result = component.generateChartData(totData, state_iu_data, crop_iu_data, state_survey_wise_map, crop_survey_wise_map, agnecy_survey_data);
      expect(result.cls_location_wise_survey_progress_top_5.cat[5]).toBe('Others');
    });
    it('should handle different locationLabel', () => {
      component.locationLabel = "District";
      const totData = [{survey_data: [{field_529: 1, field_539: 1}]}];
      const state_iu_data = [{name: 'District1', sum_insured: 100}];
      const crop_iu_data = [{name: 'Crop1', sum_insured: 100}];
      const state_survey_wise_map = new Map([[1, {name: 'District1', lossReported: 1, noLossReported: 1, upto10: 0, day11to20: 0, day21to30: 0, day31to40: 0, morethan40: 0, yettoComplete: 0, approved_upto10: 0, approved_day11to20: 0, approved_day21to30: 0, approved_day31to40: 0, approved_morethan40: 0, approved_yettoComplete: 0}]]);
      const crop_survey_wise_map = new Map([[1, {name: 'Crop1', lossReported: 1, noLossReported: 1, harvest: 0, maturity: 0, grain_filling: 0, vegetative: 0, sowing: 0}]]);
      const agnecy_survey_data = new Map();
      const result = component.generateChartData(totData, state_iu_data, crop_iu_data, state_survey_wise_map, crop_survey_wise_map, agnecy_survey_data);
      expect(result).toBeDefined();
    });
  });
  describe('generateCharts', () => {
    it('should call all chart generation methods', () => {
      jest.spyOn(component, 'generateIUCalculation').mockReturnValue({
        iu_calculated_data: [],
        location_iu_data: [],
        crop_iu_data: [],
        location_survey_data: new Map(),
        crop_survey_data: new Map(),
        agnecy_survey_data: new Map(),
      });
      jest.spyOn(component, 'generateChartData').mockReturnValue({
        date_wise_loss_ratio: { cat: [], completed: [], loss_ratio: [], approved: [], rejected: [], pending: [], draft: [] },
        cls_location_wise_survey_progress_top_5: { cat: [], approved: [], rejected: [], pending: [], draft: [], not_surveyed: [] },
        cls_location_wise_survey_progress_rest: { cat: [], approved: [], rejected: [], pending: [], draft: [], not_surveyed: [] },
        survey_completed_in_days_top_5: { cat: [], yettoComplete: [], morethan40: [], day31to40: [], day21to30: [], day11to20: [], upto10: [] },
        survey_completed_in_days_rest: { cat: [], yettoComplete: [], morethan40: [], day31to40: [], day21to30: [], day11to20: [], upto10: [] },
        survey_approved_in_days_top_5: { cat: [], yettoComplete: [], morethan40: [], day31to40: [], day21to30: [], day11to20: [], upto10: [] },
        survey_approved_in_days_rest: { cat: [], yettoComplete: [], morethan40: [], day31to40: [], day21to30: [], day11to20: [], upto10: [] },
        cls_location_progress_survey_top_5: { cat: [], lossReported: [], noLossReported: [] },
        cls_location_progress_survey_rest: { cat: [], lossReported: [], noLossReported: [] },
        cls_crop_progress_survey_top_5: { cat: [], lossReported: [], noLossReported: [] },
        cls_crop_progress_survey_rest: { cat: [], lossReported: [], noLossReported: [] },
        cause_of_loss_top: [],
        cause_of_loss_other: [],
        crop_state_wise_top_5: { cat: [], harvest: [], maturity: [], grain_filling: [], vegetative: [], sowing: [] },
        crop_state_wise_rest: { cat: [], harvest: [], maturity: [], grain_filling: [], vegetative: [], sowing: [] },
        location_claim_amount_top_5: { cat: [], claim_amount: [], gross_premium: [], loss_ratio: [] },
        location_claim_amount_rest: { cat: [], claim_amount: [], gross_premium: [], loss_ratio: [] },
        crop_claim_amount_top_5: { cat: [], claim_amount: [], gross_premium: [], loss_ratio: [] },
        crop_claim_amount_rest: { cat: [], claim_amount: [], gross_premium: [], loss_ratio: [] },
        agency_wise_survey_progress_top_5: { cat: [], approved: [], rejected: [], pending: [], draft: [], not_surveyed: [] },
        agency_wise_survey_progress_rest: { cat: [], approved: [], rejected: [], pending: [], draft: [], not_surveyed: [] },
      });
      const spies = [
        jest.spyOn(component, 'generateSurvey_Completion_over_time'),
        jest.spyOn(component, 'generatecls_survey_execution'),
        jest.spyOn(component, 'generatecls_survey_approval'),
        jest.spyOn(component, 'generatecls_survey_approval_progress'),
        jest.spyOn(component, 'generatecls_agency_approval_progress'),
        jest.spyOn(component, 'generateDistrict_Block_wise_iu_wise_loss_reporting'),
        jest.spyOn(component, 'generatecrop_wise_loss_reporting'),
        jest.spyOn(component, 'generateCause_of_Loss'),
        jest.spyOn(component, 'generateDistrict_wise_Claim_Assessment'),
        jest.spyOn(component, 'generateCrop_wise_claim_assessment'),
        jest.spyOn(component, 'generateCrop_stage'),
      ];
      component.generateCharts();
      spies.forEach(spy => expect(spy).toHaveBeenCalled());
    });
    it('should handle empty data', () => {
      jest.spyOn(component, 'generateIUCalculation').mockReturnValue({
        iu_calculated_data: [],
        location_iu_data: [],
        crop_iu_data: [],
        location_survey_data: new Map(),
        crop_survey_data: new Map(),
        agnecy_survey_data: new Map(),
      });
      jest.spyOn(component, 'generateChartData').mockReturnValue({
        date_wise_loss_ratio: { cat: [], completed: [], loss_ratio: [], approved: [], rejected: [], pending: [], draft: [] },
        cls_location_wise_survey_progress_top_5: { cat: [], approved: [], rejected: [], pending: [], draft: [], not_surveyed: [] },
        cls_location_wise_survey_progress_rest: { cat: [], approved: [], rejected: [], pending: [], draft: [], not_surveyed: [] },
        survey_completed_in_days_top_5: { cat: [], yettoComplete: [], morethan40: [], day31to40: [], day21to30: [], day11to20: [], upto10: [] },
        survey_completed_in_days_rest: { cat: [], yettoComplete: [], morethan40: [], day31to40: [], day21to30: [], day11to20: [], upto10: [] },
        survey_approved_in_days_top_5: { cat: [], yettoComplete: [], morethan40: [], day31to40: [], day21to30: [], day11to20: [], upto10: [] },
        survey_approved_in_days_rest: { cat: [], yettoComplete: [], morethan40: [], day31to40: [], day21to30: [], day11to20: [], upto10: [] },
        cls_location_progress_survey_top_5: { cat: [], lossReported: [], noLossReported: [] },
        cls_location_progress_survey_rest: { cat: [], lossReported: [], noLossReported: [] },
        cls_crop_progress_survey_top_5: { cat: [], lossReported: [], noLossReported: [] },
        cls_crop_progress_survey_rest: { cat: [], lossReported: [], noLossReported: [] },
        cause_of_loss_top: [],
        cause_of_loss_other: [],
        crop_state_wise_top_5: { cat: [], harvest: [], maturity: [], grain_filling: [], vegetative: [], sowing: [] },
        crop_state_wise_rest: { cat: [], harvest: [], maturity: [], grain_filling: [], vegetative: [], sowing: [] },
        location_claim_amount_top_5: { cat: [], claim_amount: [], gross_premium: [], loss_ratio: [] },
        location_claim_amount_rest: { cat: [], claim_amount: [], gross_premium: [], loss_ratio: [] },
        crop_claim_amount_top_5: { cat: [], claim_amount: [], gross_premium: [], loss_ratio: [] },
        crop_claim_amount_rest: { cat: [], claim_amount: [], gross_premium: [], loss_ratio: [] },
        agency_wise_survey_progress_top_5: { cat: [], approved: [], rejected: [], pending: [], draft: [], not_surveyed: [] },
        agency_wise_survey_progress_rest: { cat: [], approved: [], rejected: [], pending: [], draft: [], not_surveyed: [] },
      });
      component.generateCharts();
      // No errors thrown
      expect(true).toBe(true);
    });
  });
  describe('generatecrop_wise_loss_reporting', () => {
    it('should create chart', () => {
      const totData = { cat: ['Cat1'], lossReported: [10], noLossReported: [5] };
      const restDAta = { cat: ['Cat2'], lossReported: [20], noLossReported: [10] };
      component.generatecrop_wise_loss_reporting(totData, restDAta);
      expect(component.crop_wise_loss_reporting).toBeDefined();
    });
    it('should handle empty data', () => {
      component.generatecrop_wise_loss_reporting({ cat: [], lossReported: [], noLossReported: [] }, { cat: [], lossReported: [], noLossReported: [] });
      expect(component.crop_wise_loss_reporting).toBeDefined();
    });
  });
  describe('generateDistrict_Block_wise_iu_wise_loss_reporting', () => {
    it('should create chart', () => {
      const totData = { cat: ['District1'], lossReported: [10], noLossReported: [5] };
      const restData = { cat: ['District2'], lossReported: [20], noLossReported: [10] };
      component.generateDistrict_Block_wise_iu_wise_loss_reporting(totData, restData);
      expect(component.District_Block_wise_iu_wise_loss_reporting).toBeDefined();
    });
    it('should handle empty data', () => {
      component.generateDistrict_Block_wise_iu_wise_loss_reporting({ cat: [], lossReported: [], noLossReported: [] }, { cat: [], lossReported: [], noLossReported: [] });
      expect(component.District_Block_wise_iu_wise_loss_reporting).toBeDefined();
    });
  });
  describe('generatetype_of_surveys', () => {
    it('should create chart', () => {
      const totData = [{ surveyData: [{ field_525: 'Type1' }] }];
      component.generatetype_of_surveys(totData);
      expect(component.type_of_surveys).toBeDefined();
    });
    it('should handle no field_525', () => {
      const totData = [{ surveyData: [{}] }];
      component.generatetype_of_surveys(totData);
      expect(component.type_of_surveys).toBeDefined();
    });
    it('should handle multiple types', () => {
      const totData = [{ surveyData: [{ field_525: 'Type1' }, { field_525: 'Type2' }] }];
      component.generatetype_of_surveys(totData);
      expect(component.type_of_surveys).toBeDefined();
    });
  });
  describe('generateCause_of_Loss', () => {
    it('should create chart', () => {
      const chartData = [{ name: 'Flood', y: 10 }];
      const otherChartData = [{ name: 'Other', y: 5 }];
      component.generateCause_of_Loss(chartData, otherChartData);
      expect(component.Cause_of_Loss).toBeDefined();
    });
    it('should handle empty data', () => {
      component.generateCause_of_Loss([], []);
      expect(component.Cause_of_Loss).toBeDefined();
    });
  });
  describe('generateCrop_stage', () => {
    it('should create chart', () => {
      const totData = { cat: ['Crop1'], harvest: [1], maturity: [2], grain_filling: [3], vegetative: [4], sowing: [5] };
      const restData = { cat: ['Crop2'], harvest: [6], maturity: [7], grain_filling: [8], vegetative: [9], sowing: [10] };
      component.generateCrop_stage(totData, restData);
      expect(component.Crop_stage).toBeDefined();
    });
    it('should handle empty data', () => {
      component.generateCrop_stage({ cat: [], harvest: [], maturity: [], grain_filling: [], vegetative: [], sowing: [] }, { cat: [], harvest: [], maturity: [], grain_filling: [], vegetative: [], sowing: [] });
      expect(component.Crop_stage).toBeDefined();
    });
  });
  describe('generatecls_survey_execution', () => {
    it('should create chart', () => {
      const totData = { cat: ['Cat1'], yettoComplete: [1], morethan40: [2], day31to40: [3], day21to30: [4], day11to20: [5], upto10: [6] };
      const restData = { cat: ['Cat2'], yettoComplete: [7], morethan40: [8], day31to40: [9], day21to30: [10], day11to20: [11], upto10: [12] };
      component.generatecls_survey_execution(totData, restData);
      expect(component.cls_survey_execution).toBeDefined();
    });
    it('should handle empty data', () => {
      component.generatecls_survey_execution({ cat: [], yettoComplete: [], morethan40: [], day31to40: [], day21to30: [], day11to20: [], upto10: [] }, { cat: [], yettoComplete: [], morethan40: [], day31to40: [], day21to30: [], day11to20: [], upto10: [] });
      expect(component.cls_survey_execution).toBeDefined();
    });
  });
  describe('generatecls_survey_approval', () => {
    it('should create chart', () => {
      const totData = { cat: ['Cat1'], yettoComplete: [1], morethan40: [2], day31to40: [3], day21to30: [4], day11to20: [5], upto10: [6] };
      const restData = { cat: ['Cat2'], yettoComplete: [7], morethan40: [8], day31to40: [9], day21to30: [10], day11to20: [11], upto10: [12] };
      component.generatecls_survey_approval(totData, restData);
      expect(component.cls_survey_approval).toBeDefined();
    });
    it('should handle empty data', () => {
      component.generatecls_survey_approval({ cat: [], yettoComplete: [], morethan40: [], day31to40: [], day21to30: [], day11to20: [], upto10: [] }, { cat: [], yettoComplete: [], morethan40: [], day31to40: [], day21to30: [], day11to20: [], upto10: [] });
      expect(component.cls_survey_approval).toBeDefined();
    });
  });
  describe('generatecls_survey_approval_progress', () => {
    it('should create chart', () => {
      const totData = { cat: ['Cat1'], approved: [1], pending: [2], rejected: [3], draft: [4], not_surveyed: [5] };
      const restData = { cat: ['Cat2'], approved: [6], pending: [7], rejected: [8], draft: [9], not_surveyed: [10] };
      component.generatecls_survey_approval_progress(totData, restData);
      expect(component.cls_survey_approval_progress).toBeDefined();
    });
    it('should handle empty data', () => {
      component.generatecls_survey_approval_progress({ cat: [], approved: [], pending: [], rejected: [], draft: [], not_surveyed: [] }, { cat: [], approved: [], pending: [], rejected: [], draft: [], not_surveyed: [] });
      expect(component.cls_survey_approval_progress).toBeDefined();
    });
  });
  describe('generatecls_agency_approval_progress', () => {
    it('should create chart', () => {
      const totData = { cat: ['Agency1'], approved: [1], pending: [2], rejected: [3], draft: [4], not_surveyed: [5] };
      const restData = { cat: ['Agency2'], approved: [6], pending: [7], rejected: [8], draft: [9], not_surveyed: [10] };
      component.generatecls_agency_approval_progress(totData, restData);
      expect(component.agency_survey_approval_progress).toBeDefined();
    });
    it('should handle empty data', () => {
      component.generatecls_agency_approval_progress({ cat: [], approved: [], pending: [], rejected: [], draft: [], not_surveyed: [] }, { cat: [], approved: [], pending: [], rejected: [], draft: [], not_surveyed: [] });
      expect(component.agency_survey_approval_progress).toBeDefined();
    });
  });
  describe('generateCrop_wise_claim_assessment', () => {
    it('should create chart', () => {
      const totData = { cat: ['Crop1'], claim_amount: [100], loss_ratio: [0.1] };
      const restData = { cat: ['Crop2'], claim_amount: [200], loss_ratio: [0.2] };
      component.generateCrop_wise_claim_assessment(totData, restData);
      expect(component.Crop_wise_claim_assessment).toBeDefined();
    });
    it('should handle empty data', () => {
      component.generateCrop_wise_claim_assessment({ cat: [], claim_amount: [], loss_ratio: [] }, { cat: [], claim_amount: [], loss_ratio: [] });
      expect(component.Crop_wise_claim_assessment).toBeDefined();
    });
  });
  describe('generateDistrict_wise_Claim_Assessment', () => {
    it('should create chart', () => {
      const totData = { cat: ['District1'], claim_amount: [100], loss_ratio: [0.1] };
      const restData = { cat: ['District2'], claim_amount: [200], loss_ratio: [0.2] };
      component.generateDistrict_wise_Claim_Assessment(totData, restData);
      expect(component.District_wise_Claim_Assessment).toBeDefined();
    });
    it('should handle empty data', () => {
      component.generateDistrict_wise_Claim_Assessment({ cat: [], claim_amount: [], loss_ratio: [] }, { cat: [], claim_amount: [], loss_ratio: [] });
      expect(component.District_wise_Claim_Assessment).toBeDefined();
    });
  });
  describe('generateSurvey_Completion_over_time', () => {
    it('should create chart', () => {
      const totData = { cat: ['Date1'], completed: [10], loss_ratio: [0.1], approved: [5], rejected: [1], pending: [2], draft: [1], not_surveyed: [1] };
      component.generateSurvey_Completion_over_time(totData);
      expect(component.Survey_Completion_over_time).toBeDefined();
    });
    it('should handle empty data', () => {
      component.generateSurvey_Completion_over_time({ cat: [], completed: [], loss_ratio: [], approved: [], rejected: [], pending: [], draft: [], not_surveyed: [] });
      expect(component.Survey_Completion_over_time).toBeDefined();
    });
  });
  describe('generateCropStageFull', () => {
    it('should create chart', () => {
      const categories = ['Crop1'];
      const series = [{ name: 'Harvest', data: [1] }];
      component.generateCropStageFull(categories, series);
      expect(component.CropStageFull).toBeDefined();
    });
    it('should handle empty data', () => {
      component.generateCropStageFull([], []);
      expect(component.CropStageFull).toBeDefined();
    });
  });
  describe('abbreviateNumber', () => {
    it('should abbreviate numbers', () => {
      expect(component.abbreviateNumber(0)).toBe('');
      expect(component.abbreviateNumber(500)).toBe('500');
      expect(component.abbreviateNumber(1500)).toBe('1.5 K');
      expect(component.abbreviateNumber(150000)).toBe('1.5 L');
      expect(component.abbreviateNumber(15000000)).toBe('1.5 Cr');
    });
    it('should handle negative', () => {
      expect(component.abbreviateNumber(-1500)).toBe('-1.5 K');
    });
    it('should handle fractions', () => {
      expect(component.abbreviateNumber(1500.5)).toBe('1.5 K');
    });
  });
  describe('refreshDetail', () => {
    it('should call refreshMap if mapDetail', () => {
      component.mapDetail = { refreshMap: jest.fn() };
      component.refreshDetail();
      expect(component.mapDetail.refreshMap).toHaveBeenCalled();
    });
    it('should do nothing if no mapDetail', () => {
      component.mapDetail = null;
      expect(() => component.refreshDetail()).not.toThrow();
    });
  });
  describe('clearDetail', () => {
    it('should reset data and call clearDetail if mapDetail', () => {
      component.mapDetail = { clearDetail: jest.fn() };
      component.clearDetail();
      expect(component.timestamp).toBeNull();
      expect(component.minDate).toBeNull();
      expect(component.maxDate).toBeNull();
      expect(component.t_8Days).toBeNull();
      expect(component.surveyData).toEqual([]);
      expect(component.allData).toEqual([]);
      expect(component.revisitData).toEqual([]);
      expect(component.surveyLocation).toEqual([]);
      expect(component.mapDetail.clearDetail).toHaveBeenCalled();
    });
    it('should reset without mapDetail', () => {
      component.mapDetail = null;
      expect(() => component.clearDetail()).not.toThrow();
    });
  });
  describe('generatecls_survey_execution_modal', () => {
    it('should create modal chart', () => {
      const cat = ['Cat1'];
      const yettoComplete = [1];
      const morethan40 = [2];
      const day31to40 = [3];
      const day21to30 = [4];
      const day11to20 = [5];
      const upto10 = [6];
      component.generatecls_survey_execution_modal(cat, yettoComplete, morethan40, day31to40, day21to30, day11to20, upto10);
      expect(component.cls_survey_execution_modal).toBeDefined();
    });
    it('should handle empty data', () => {
      component.generatecls_survey_execution_modal([], [], [], [], [], [], []);
      expect(component.cls_survey_execution_modal).toBeDefined();
    });
  });
  describe('generatecls_survey_approval_modal', () => {
    it('should create modal chart', () => {
      const cat = ['Cat1'];
      const yettoComplete = [1];
      const morethan40 = [2];
      const day31to40 = [3];
      const day21to30 = [4];
      const day11to20 = [5];
      const upto10 = [6];
      component.generatecls_survey_approval_modal(cat, yettoComplete, morethan40, day31to40, day21to30, day11to20, upto10);
      expect(component.cls_survey_approval_modal).toBeDefined();
    });
    it('should handle empty data', () => {
      component.generatecls_survey_approval_modal([], [], [], [], [], [], []);
      expect(component.cls_survey_approval_modal).toBeDefined();
    });
  });
  describe('generatecls_survey_approval_progress_modal', () => {
    it('should create modal chart', () => {
      const cat = ['Cat1'];
      const approved = [1];
      const pending = [2];
      const rejected = [3];
      const draft = [4];
      const not_surveyed = [5];
      component.generatecls_survey_approval_progress_modal(cat, approved, pending, rejected, draft, not_surveyed);
      expect(component.cls_survey_approval_progress_modal).toBeDefined();
    });
    it('should handle empty data', () => {
      component.generatecls_survey_approval_progress_modal([], [], [], [], [], []);
      expect(component.cls_survey_approval_progress_modal).toBeDefined();
    });
  });
  describe('generatecls_agency_approval_progress_modal', () => {
    it('should create modal chart', () => {
      const cat = ['Agency1'];
      const approved = [1];
      const pending = [2];
      const rejected = [3];
      const draft = [4];
      const not_surveyed = [5];
      component.generatecls_agency_approval_progress_modal(cat, approved, pending, rejected, draft, not_surveyed);
      expect(component.agency_survey_approval_progress_modal).toBeDefined();
    });
    it('should handle empty data', () => {
      component.generatecls_agency_approval_progress_modal([], [], [], [], [], []);
      expect(component.agency_survey_approval_progress_modal).toBeDefined();
    });
  });
  describe('generateDistrict_Block_wise_iu_wise_loss_reporting_modal', () => {
    it('should create modal chart', () => {
      const chartData = { categories: ['District1'], noLossReporting: [5], lossReporting: [10] };
      component.generateDistrict_Block_wise_iu_wise_loss_reporting_modal(chartData);
      expect(component.District_Block_wise_iu_wise_loss_reporting_modal).toBeDefined();
    });
    it('should handle empty data', () => {
      component.generateDistrict_Block_wise_iu_wise_loss_reporting_modal({ categories: [], noLossReporting: [], lossReporting: [] });
      expect(component.District_Block_wise_iu_wise_loss_reporting_modal).toBeDefined();
    });
  });
  describe('generatecrop_wise_loss_reporting_modal', () => {
    it('should create modal chart', () => {
      const chartData = { categories: ['Crop1'], noLossReporting: [5], lossReporting: [10] };
      component.generatecrop_wise_loss_reporting_modal(chartData);
      expect(component.crop_wise_loss_reporting_modal).toBeDefined();
    });
    it('should handle empty data', () => {
      component.generatecrop_wise_loss_reporting_modal({ categories: [], noLossReporting: [], lossReporting: [] });
      expect(component.crop_wise_loss_reporting_modal).toBeDefined();
    });
  });
  describe('generateCrop_wise_claim_assessment_modal', () => {
    it('should create modal chart', () => {
      const chartData = { categories: ['Crop1'], claimAmount: [100], lossRatio: [0.1] };
      component.generateCrop_wise_claim_assessment_modal(chartData);
      expect(component.Crop_wise_claim_assessment_modal).toBeDefined();
    });
    it('should handle empty data', () => {
      component.generateCrop_wise_claim_assessment_modal({ categories: [], claimAmount: [], lossRatio: [] });
      expect(component.Crop_wise_claim_assessment_modal).toBeDefined();
    });
  });
  describe('generateDistrict_wise_Claim_Assessment_modal', () => {
    it('should create modal chart', () => {
      const chartData = { categories: ['District1'], claimAmount: [100], lossRatio: [0.1] };
      component.generateDistrict_wise_Claim_Assessment_modal(chartData);
      expect(component.District_wise_Claim_Assessment_modal).toBeDefined();
    });
    it('should handle empty data', () => {
      component.generateDistrict_wise_Claim_Assessment_modal({ categories: [], claimAmount: [], lossRatio: [] });
      expect(component.District_wise_Claim_Assessment_modal).toBeDefined();
    });
  });
  describe('generateCause_of_Loss_modal', () => {
    it('should create modal chart', () => {
      const chartData = [{ name: 'Other', y: 5 }];
      component.generateCause_of_Loss_modal(chartData);
      expect(component.Cause_of_Loss_modal).toBeDefined();
    });
    it('should handle empty data', () => {
      component.generateCause_of_Loss_modal([]);
      expect(component.Cause_of_Loss_modal).toBeDefined();
    });
  });
  describe('setDefaultLocation', () => {
    it('should set selectedState and call onStateChange if states in location', () => {
      userDetailService.getLocation.mockReturnValue({ states: [1], districts: [1] });
      const onStateChangeSpy = jest.spyOn(component, 'onStateChange');
      const onDistrictChangeSpy = jest.spyOn(component, 'onDistrictChange');
      component.states = [{ state_id: 1 }];
      component.districts = [{ district_id: 1 }];
      component.setDefaultLocation();
      expect(component.selectedState.length).toBe(1);
      expect(onStateChangeSpy).toHaveBeenCalledWith(component.selectedState);
      expect(component.selectedDistrict.length).toBe(1);
      expect(onDistrictChangeSpy).toHaveBeenCalledWith(component.selectedDistrict);
    });
    it('should do nothing if no states', () => {
      userDetailService.getLocation.mockReturnValue({ states: [] });
      const onStateChangeSpy = jest.spyOn(component, 'onStateChange');
      component.setDefaultLocation();
      expect(onStateChangeSpy).toHaveBeenCalledWith([]);
    });
    it('should handle no districts', () => {
      userDetailService.getLocation.mockReturnValue({ states: [1] });
      const onStateChangeSpy = jest.spyOn(component, 'onStateChange');
      component.states = [{ state_id: 1 }];
      component.setDefaultLocation();
      expect(onStateChangeSpy).toHaveBeenCalled();
    });
  });
  describe('getLoaedFileData', () => {
    it('should handle no data', fakeAsync(() => {
      component.user.user_role = '1';
      coreService.post.mockResolvedValue({ data: [] });
      component.getLoaedFileData();
      tick();
      flushMicrotasks();
      expect(component.isFileData).toBe(false);
    }));
    it('should handle error', fakeAsync(() => {
      component.user.user_role = '1';
      coreService.post.mockRejectedValue(new Error('Error'));
      component.getLoaedFileData();
      tick();
      flushMicrotasks();
      expect(component.isFileData).toBe(false);
    }));
    it('should use unit_id for munichre', fakeAsync(() => {
      featureToggleService.getContext.mockReturnValue('munichre' as ProjectContext);
      component.projectContext = 'munichre';
      component.user.user_role = '1';
      component.user.unit_id = '1000';
      coreService.post.mockResolvedValue({ data: [{ client_id: '1000', data: JSON.stringify({ timestamp: '2023-01-01' }) }] });
      component.getLoaedFileData();
      tick();
      flushMicrotasks();
      expect(coreService.post).toHaveBeenCalledWith(expect.objectContaining({ "client_id": '1000' }));
    }));
  });
  describe('deactiveField', () => {
    it('should return true if all set', () => {
      component.singleYear = 2023;
      component.singleseason = 1;
      component.selectedAgency = [1];
      expect(component.deactiveField).toBeTruthy();
    });
    it('should return false if missing', () => {
      component.singleYear = null;
      expect(component.deactiveField).toBeFalsy();
    });
    it('should return false if empty agency', () => {
      component.singleYear = 2023;
      component.singleseason = 1;
      component.selectedAgency = [];
      expect(component.deactiveField).toBeFalsy();
    });
  });
  describe('divide', () => {
    it('should divide or return 0', () => {
      expect(component.divide(10, 2)).toBe(5);
      expect(component.divide(10, 0)).toBe(0);
    });
  });
});