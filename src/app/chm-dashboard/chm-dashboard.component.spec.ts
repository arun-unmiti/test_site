import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { MultiSelectModule } from 'primeng/multiselect';
import { FormsModule } from '@angular/forms';
import * as moment from 'moment';

import { ChmDashboardComponent } from './chm-dashboard.component';
import { FilterService } from '../utilities/filter.service';
import { CoreService } from '../utilities/core.service';
import { UserDetailService } from '../auth/user-detail.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FeatureToggleService } from '../shared/services/feature-toggle.service';
import { environment, ProjectContext } from '../../environments/environment';

// Mock environment
jest.mock('../../environments/environment', () => ({
  environment: {
    projectConfigs: {
      testContext: { assetsFolder: '/assets/test/' },
      saksham: { assetsFolder: '/assets/saksham/' },
      munichre: { assetsFolder: '/assets/munichre/' }
    }
  }
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
    m.isBetween = jest.fn().mockReturnValue(true);
    m.add = jest.fn().mockReturnThis();
    m.toISOString = jest.fn().mockReturnValue(new Date().toISOString());
    return m;
  };
});

// Mock angular-highcharts
jest.mock('angular-highcharts', () => ({
  Chart: jest.fn().mockImplementation((options) => ({ options })),
}));

// Mock services
class MockCoreService {
  clone = jest.fn(obj => JSON.parse(JSON.stringify(obj)));
  post = jest.fn().mockResolvedValue({ status: 1, msg: 'Success' });
  dashboard_post = jest.fn().mockResolvedValue({ status: 1 });
  toast = jest.fn();
  sortList = jest.fn((list, key) => list);
  getNotifiedCropList = jest.fn((list) => list);
  uniqueList = jest.fn((list, key) => [...new Set(list.map((item: any) => item[key]))]);
  divide = jest.fn((a, b) => b ? a / b : 0);
  abbreviateNumber = jest.fn(num => num.toString());
}

class MockFilterService {
  states: any[] = [{ state_id: 1, state_name: 'State1' }];
  districts: any[] = [{ district_id: 1, district_name: 'District1' }];
  tehsils: any[] = [{ tehsil_id: 1, tehsil_name: 'Tehsil1' }];
  crops: any[] = [{ crop_code: '001', crop_name: 'Crop1', id: 1 }];
  seasons: any[] = [{ id: 1, season_name: 'Season1' }];
  years: any[] = [{ id: 2023, year: '2023' }];
  blocks: any[] = [{ block_id: 1, block_name: 'Block1' }];
  grampanchayats: any[] = [{ grampanchayat_id: 1, grampanchayat_name: 'GP1' }];
  villages: any[] = [{ village_id: 1, village_name: 'Village1' }];
  notifiedUnits: any[] = [{ notified_id: 1, notified_unit_name: 'Unit1' }];
  clients: any[] = [{ UNIT_ID: 2000, UNIT_NAME: 'Client1' }];
  isLoactionFetched = false;
  isvillageFetched = false;
  fetchedLocationData = { subscribe: jest.fn() };
  fetchedVillageData = { subscribe: jest.fn() };
  getAgencyWiseLocation = jest.fn().mockResolvedValue({ states: [{state_id: 1}], districts: [{district_id: 1}], tehsils: [{tehsil_id: 1}] });
  getClientWiseLocation = jest.fn().mockResolvedValue([[], []]);
}

class MockUserDetailService {
  getUserDetail = jest.fn().mockReturnValue({ unit_id: '2000', user_role: '1', agency_id: '0' });
  getLocation = jest.fn().mockReturnValue({ states: [], districts: [] });
}

class MockNgbModal {
  open = jest.fn().mockReturnValue({ result: Promise.resolve() });
}

class MockFeatureToggleService {
  getContext = jest.fn().mockReturnValue('testContext' as ProjectContext);
}

describe('ChmDashboardComponent', () => {
  let component: ChmDashboardComponent;
  let fixture: ComponentFixture<ChmDashboardComponent>;
  let coreService: MockCoreService;
  let filterService: MockFilterService;
  let userDetailService: MockUserDetailService;
  let modalService: MockNgbModal;
  let featureToggleService: MockFeatureToggleService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        NgbNavModule,
        MultiSelectModule,
        FormsModule
      ],
      declarations: [ChmDashboardComponent],
      providers: [
        { provide: CoreService, useClass: MockCoreService },
        { provide: FilterService, useClass: MockFilterService },
        { provide: UserDetailService, useClass: MockUserDetailService },
        { provide: NgbModal, useClass: MockNgbModal },
        { provide: FeatureToggleService, useClass: MockFeatureToggleService }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(ChmDashboardComponent);
    component = fixture.componentInstance;
    coreService = TestBed.inject(CoreService) as unknown as MockCoreService;
    filterService = TestBed.inject(FilterService) as unknown as MockFilterService;
    userDetailService = TestBed.inject(UserDetailService) as unknown as MockUserDetailService;
    modalService = TestBed.inject(NgbModal) as unknown as MockNgbModal;
    featureToggleService = TestBed.inject(FeatureToggleService) as unknown as MockFeatureToggleService;
    filterService.getAgencyWiseLocation = jest.fn().mockResolvedValue({ states: [], districts: [], tehsils: [] });
    filterService.getClientWiseLocation = jest.fn().mockResolvedValue([[], []]);
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
      const newComponent = new ChmDashboardComponent(filterService as any, coreService as any, userDetailService as any, modalService as any, featureToggleService as any);
      expect(newComponent.selectedClient).toEqual(['2000']);
    });

    it('should set user', () => {
      expect(component.user).toEqual({ unit_id: '2000', user_role: '1', agency_id: '0' });
    });

    it('should set chartlabels', () => {
      expect(component.chartlabels).toEqual({ style: { color: '#333333', fontWeight: 'bold', fontSize: '12px' } });
    });

    it('should set sIOptions', () => {
      expect(component.sIOptions.length).toBe(8);
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

  describe('setLabels', () => {
    it('should set labels from totData', () => {
      component.allTotData = [{ sum_insured: 1000 }];
      const totData = [{ no_of_CHMs_planned: 5, chmData: { length: 3 }, sum_insured: 1000, exposure_covred: 600 }];
      component.setLabels(totData);
      expect(component.labels.noOfCHMPlanned).toBe(5);
      expect(component.labels.noOfCHMAchieved).toBe(3);
      expect(component.labels.totalExposure).toBe(1000);
      expect(component.labels.totalPlanExposure).toBe(1000);
      expect(component.labels.totalCovered).toBe(600);
      expect(component.labels.states).toBe(0);
      expect(component.labels.districts).toBe(0);
      expect(component.labels.tehsil).toBe(0);
    });
  });

  describe('getLocationsData', () => {
    it('should set maps and call setDefaultLocation', () => {
      const setDefaultLocationSpy = jest.spyOn(component, 'setDefaultLocation');
      const getLocationCropDataSpy = jest.spyOn(component, 'getLocationCropData');
      component.loading = 1;
      component.getLocationsData();
      expect(component.states.length).toBe(1);
      expect(component.districts.length).toBe(1);
      expect(component.tehsils.length).toBe(1);
      expect(component.crops.length).toBe(1);
      expect(component.clientData.length).toBe(1);
      expect(setDefaultLocationSpy).toHaveBeenCalled();
      expect(component.stateMap.get(1)).toBe('State1');
      expect(component.districtMap.get(1)).toBe('District1');
      expect(component.tehsilMap.get(1)).toBe('Tehsil1');
      expect(component.blockMap.get(1)).toBe('Block1');
      expect(component.notifiedUnitMap.get(1)).toBe('Unit1');
      expect(component.cropsMap.get('001')).toBe('Crop1');
      expect(getLocationCropDataSpy).toHaveBeenCalled();
      expect(component.loading).toBe(0);
    });

    it('should set singleClient and selectedClient if user.unit_id', () => {
      userDetailService.getUserDetail.mockReturnValue({ unit_id: '2000' });
      component.getLocationsData();
      expect(component.singleClient).toBe('2000');
      expect(component.selectedClient).toEqual(['2000']);
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
  });

  describe('onYearSelect', () => {
    it('should update selectedYear and reset locations', () => {
      component.yearOptions = [{ id: 2023 }];
      const getAgencyDataSpy = jest.spyOn(component, 'getAgencyData');
      const getLocationCropDataSpy = jest.spyOn(component, 'getLocationCropData');
      component.onYearSelect(2023);
      expect(component.selectedYear).toEqual([{ id: 2023 }]);
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

    it('should not reset agency if role 7', () => {
      component.user.user_role = '7';
      component.selectedAgency = [1];
      component.onYearSelect(2023);
      expect(component.selectedAgency).toEqual([1]);
    });
  });

  describe('onSeasonSelect', () => {
    it('should update selectedseason and reset locations', () => {
      component.seasonOptions = [{ id: 1 }];
      const getAgencyDataSpy = jest.spyOn(component, 'getAgencyData');
      const getLocationCropDataSpy = jest.spyOn(component, 'getLocationCropData');
      component.onSeasonSelect(1);
      expect(component.selectedseason).toEqual([{ id: 1 }]);
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
  });

  describe('onSingleClinetChange', () => {
    it('should update selectedClient and call onClientSelect', () => {
      component.clientData = [{ UNIT_ID: 2000 }];
      const onClientSelectSpy = jest.spyOn(component, 'onClientSelect');
      component.onSingleClinetChange(2000);
      expect(component.selectedClient).toEqual([2000]);
      expect(onClientSelectSpy).toHaveBeenCalledWith([2000]);
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

    it('should handle status not 1', fakeAsync(() => {
      component.dataCrops = [];
      coreService.post.mockResolvedValue({ status: 0 });
      component.getLocationCropData();
      tick();
      expect(component.dataCrops).toEqual([]);
    }));
  });

  describe('onClientSelect', () => {
    it('should reset locations and call getAgencyData', () => {
      const getAgencyDataSpy = jest.spyOn(component, 'getAgencyData');
      component.onClientSelect([2000]);
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

    it('should not reset agency if role 7', () => {
      component.user.user_role = '7';
      component.selectedAgency = [1];
      component.onClientSelect([2000]);
      expect(component.selectedAgency).toEqual([1]);
    });
  });

  describe('getAgencyData', () => {
    it('should not fetch if missing data', () => {
      component.selectedClient = [];
      component.getAgencyData();
      expect(coreService.dashboard_post).not.toHaveBeenCalled();
    });
  });

  describe('onStateChange', () => {
    it('should update districtOptions', () => {
      component.clientDistricts = [{state_id: 1}];
      component.onStateChange([{state_id: 1}]);
      expect(component.districtOptions[0].items).toEqual([{state_id: 1}]);
    });
  });

  describe('onDistrictChange', () => {
    it('should update tehsilOptions', () => {
      component.clientTehsils = [{district_id: 1}];
      component.onDistrictChange([{district_id: 1}]);
      expect(component.tehsilOptions[0].items).toEqual([{district_id: 1}]);
    });
  });

  describe('onTehsilChange', () => {
    it('should call getLocationCropData', () => {
      const spy = jest.spyOn(component, 'getLocationCropData');
      component.onTehsilChange();
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('isValidSI', () => {
    it('should return true if no selectedSI', () => {
      component.selectedSI = null;
      expect(component.isValidSI([], 'key')).toBe(true);
    });

    it('should check sum against min and max', () => {
      component.selectedSI = '1e6-25e5';
      const data = [{ key: 1000000 }];
      expect(component.isValidSI(data, 'key')).toBe(true);
    });
  });

  describe('onSearch', () => {
    it('should toast warning if no state selected', () => {
      component.selectedState = [];
      component.onSearch();
      expect(coreService.toast).toHaveBeenCalledWith('warn', 'Please select at least one state');
    });

    it('should handle user role >2 or selectedClient', fakeAsync(() => {
      component.user.user_role = '3';
      component.selectedState = [];
      component.states = [{state_id: 1}];
      component.clientDistricts = [{district_id: 1}];
      component.clientTehsils = [{tehsil_id: 1}];
      component.selectedClient = [2000];
      component.onSearch();
      tick();
      expect(component.loading).toBe(0);
    }));

    it('should handle no surveyData', fakeAsync(() => {
      component.selectedState = [{state_id: 1}];
      coreService.dashboard_post.mockResolvedValueOnce({status: 1});
      coreService.dashboard_post.mockResolvedValueOnce({status: 1, surveydata: []});
      coreService.dashboard_post.mockResolvedValueOnce({status: 1, surveydata: []});
      component.onSearch();
      tick();
      expect(component.surveyData).toEqual([]);
    }));
  });

  describe('generateIUCalculation', () => {
    it('should calculate IU data', () => {
      component.allData = [{ gp_notified_area: 1, notified_unit: 1, crop: 1, state_id: 1, dist_id: 1, tehsil_id: 1, year: 2023, season: 1, sum_insured: 100, no_of_CHMs_planned: 5 }];
      component.surveyData = [{ case_ID: '1', field_505: 1, field_509: 1, field_501: 1, field_502: 1, field_951: 2023, field_506: 1, field_644: 1, field_518: 'Very Poor', field_516: 'Rainfed', revisit_data: [{field_712: 'Poor'}] }];
      component.grampanchayatMap.set(1, 'GP1');
      component.cropsMap.set(1, 'Crop1');
      component.tehsilMap.set(1, 'Tehsil1');
      component.districtMap.set(1, 'District1');
      component.stateMap.set(1, 'State1');
      component.iuServeyMap.set('1=>1=>1=>1=>1=>2023=>1', component.surveyData);
      const result = component.generateIUCalculation(component.allData, component.surveyData);
      expect(result.iu_calculated_data.length).toBe(1);
      expect(result.labels.no_of_chm_planned).toBe(5);
    });

    it('should handle no plan_data or survey_data', () => {
      const result = component.generateIUCalculation([], []);
      expect(result.iu_calculated_data).toEqual([]);
    });

    it('should handle different notified_unit', () => {
      component.allData = [
        { gp_notified_area: 1, notified_unit: 2, crop: 1, state_id: 1, dist_id: 1, tehsil_id: 1, year: 2023, season: 1, no_of_CHMs_planned: 1 },
        { gp_notified_area: 1, notified_unit: 3, crop: 1, state_id: 1, dist_id: 1, tehsil_id: 1, year: 2023, season: 1, no_of_CHMs_planned: 1 },
        { gp_notified_area: 1, notified_unit: 4, crop: 1, state_id: 1, dist_id: 1, tehsil_id: 1, year: 2023, season: 1, no_of_CHMs_planned: 1 },
        { gp_notified_area: 1, notified_unit: 5, crop: 1, state_id: 1, dist_id: 1, tehsil_id: 1, year: 2023, season: 1, no_of_CHMs_planned: 1 }
      ];
      component.surveyData = [{}];
      component.blockMap.set(1, 'Block1');
      component.tehsilMap.set(1, 'Tehsil1');
      component.villageMap.set(1, 'Village1');
      component.districtMap.set(1, 'District1');
      const result = component.generateIUCalculation(component.allData, component.surveyData);
      expect(result.iu_calculated_data.length).toBe(4);
    });

    it('should handle crop health counts', () => {
      component.allData = [{ gp_notified_area: 1, notified_unit: 1, crop: 1, state_id: 1, dist_id: 1, tehsil_id: 1, year: 2023, season: 1, no_of_CHMs_planned: 5 }];
      component.surveyData = [
        { field_518: 'very good', revisit_data: [] },
        { field_518: 'good', revisit_data: [] },
        { field_518: 'average', revisit_data: [] },
        { field_518: 'poor', revisit_data: [] },
        { field_518: 'very poor', revisit_data: [] }
      ];
      component.iuServeyMap.set('1=>1=>1=>1=>1=>2023=>1', component.surveyData);
      const result = component.generateIUCalculation(component.allData, component.surveyData);
      expect(result.iu_calculated_data[0].very_good).toBe(1);
      expect(result.iu_calculated_data[0].good).toBe(1);
      expect(result.iu_calculated_data[0].average).toBe(1);
      expect(result.iu_calculated_data[0].poor).toBe(1);
      expect(result.iu_calculated_data[0].very_poor).toBe(1);
    });

    it('should handle change in crop health', () => {
      component.allData = [{ gp_notified_area: 1, notified_unit: 1, crop: 1, state_id: 1, dist_id: 1, tehsil_id: 1, year: 2023, season: 1 }];
      component.surveyData = [
        { revisit_data: [{field_712: 'Very Good'}], field_518: 'Good' },
        { revisit_data: [{field_712: 'Poor'}], field_518: 'Average' },
        { revisit_data: [{field_712: 'Average'}], field_518: 'Average' }
      ];
      component.iuServeyMap.set('1=>1=>1=>1=>1=>2023=>1', component.surveyData);
      const result = component.generateIUCalculation(component.allData, component.surveyData);
      expect(result.revisit_moniter.improving).toBe(1);
      expect(result.revisit_moniter.deteriorating).toBe(1);
      expect(result.revisit_moniter.no_change).toBe(1);
    });

    it('should handle multiple revisits', () => {
      component.allData = [{ gp_notified_area: 1, notified_unit: 1, crop: 1, state_id: 1, dist_id: 1, tehsil_id: 1, year: 2023, season: 1 }];
      component.surveyData = [{ revisit_data: [{field_712: 'Good'}, {field_712: 'Very Good'}] }];
      component.iuServeyMap.set('1=>1=>1=>1=>1=>2023=>1', component.surveyData);
      const result = component.generateIUCalculation(component.allData, component.surveyData);
      expect(result.revisit_moniter.improving).toBe(1);
    });

    it('should calculate weightages when surveys < planned', () => {
      component.allData = [{ gp_notified_area: 1, notified_unit: 1, crop: 1, state_id: 1, dist_id: 1, tehsil_id: 1, year: 2023, season: 1, no_of_CHMs_planned: 5, sum_insured: 100 }];
      component.surveyData = [{ field_518: 'Very Good', revisit_data: [] }, { field_518: 'Good', revisit_data: [] }];
      component.iuServeyMap.set('1=>1=>1=>1=>1=>2023=>1', component.surveyData);
      const result = component.generateIUCalculation(component.allData, component.surveyData);
      expect(result.iu_calculated_data[0].very_good_weightage).toBe(0.2);
    });

    it('should calculate weightages when surveys >= planned', () => {
      component.allData = [{ gp_notified_area: 1, notified_unit: 1, crop: 1, state_id: 1, dist_id: 1, tehsil_id: 1, year: 2023, season: 1, no_of_CHMs_planned: 2, sum_insured: 100 }];
      component.surveyData = [{ field_518: 'Very Good', revisit_data: [] }, { field_518: 'Good', revisit_data: [] }, { field_518: 'Average', revisit_data: [] }];
      component.iuServeyMap.set('1=>1=>1=>1=>1=>2023=>1', component.surveyData);
      const result = component.generateIUCalculation(component.allData, component.surveyData);
      expect(result.iu_calculated_data[0].very_good_weightage).toBe(1/3);
    });
  });

  describe('generateChartData', () => {
    it('should generate chart data', () => {
      const totData: any[] = [];
      const state_iu_wise_map = new Map([[1, {name: 'State1', very_good_sum_insured: 100, good_sum_insured: 200, average_sum_insured: 300, poor_sum_insured: 400, very_poor_sum_insured: 500, very_good: 1, good: 2, average: 3, poor: 4, very_poor: 5, planned_sum_insured: 1000, exposure_covred: 800, no_of_survey: 15, no_of_CHMs_planned: 20}]]);
      const crop_iu_wise_map = new Map([[1, {name: 'Crop1', no_loss_sum_insured: 100, very_poor_sum_insured: 200, poor_sum_insured: 300, average_sum_insured: 400, good_sum_insured: 500, very_good_sum_insured: 600}]]);
      const state_survey_wise_map = new Map();
      const crop_survey_wise_map = new Map();
      const revisit_moniter = {delay: 1, missed: 2, on_time: 3, no_change: 4, improving: 5, deteriorating: 6, no_change_exposure: 100, improving_trend_exposure: 200, deteriorating_trend_exposure: 300};
      const result = component.generateChartData(totData, state_iu_wise_map, crop_iu_wise_map, state_survey_wise_map, crop_survey_wise_map, revisit_moniter);
      expect(result.chm_exposure[0].y).toBe(80);
      expect(result.crop_health_exposure_wise[0].y).toBe(100);
      expect(result.location_wise_health_top_5.cat).toEqual(['State1']);
      expect(result.crop_wise_health_top_5.cat).toEqual(['Crop1']);
      expect(result.resurvey_time).toEqual([['Delay', 1], ['Missed', 2], ['On time', 3]]);
      expect(result.change_in_crop_health[0].y).toBe(100);
    });

    it('should handle >5 locations and crops', () => {
      const state_iu_wise_map = new Map();
      const crop_iu_wise_map = new Map();
      for (let i = 1; i <= 6; i++) {
        state_iu_wise_map.set(i, {name: `State${i}`, no_loss_sum_insured: 100, very_poor_sum_insured: 200, poor_sum_insured: 300, average_sum_insured: 400, good_sum_insured: 500, very_good_sum_insured: 600});
        crop_iu_wise_map.set(i, {name: `Crop${i}`, no_loss_sum_insured: 100, very_poor_sum_insured: 200, poor_sum_insured: 300, average_sum_insured: 400, good_sum_insured: 500, very_good_sum_insured: 600});
      }
      const result = component.generateChartData([], state_iu_wise_map, crop_iu_wise_map, new Map(), new Map(), {});
      expect(result.location_wise_health_top_5.cat[5]).toBe('Others');
      expect(result.crop_wise_health_top_5.cat[5]).toBe('Others');
    });
  });

  describe('generateCharts', () => {
    it('should generate charts', () => {
      const generateExposure_covered_percentageSpy = jest.spyOn(component, 'generateExposure_covered_percentage');
      component.generateCharts();
      expect(generateExposure_covered_percentageSpy).toHaveBeenCalled();
    });
  });

  describe('generateExcelText', () => {
    it('should generate excel text', () => {
      const data = [{ a: '1', b: '2\n3' }];
      const text = component.generateExcelText(data);
      expect(text).toContain('a\tb');
      expect(text).toContain('1\t2 3');
    });

    it('should return empty if no data', () => {
      expect(component.generateExcelText([])).toBe('');
    });
  });

  describe('generateCrop_wise_health', () => {
    it('should generate crop wise health chart', () => {
      component.generateCrop_wise_health(['Crop1'], [{name: 'Series1', data: [1]}]);
      expect(component.Crop_wise_health).toBeDefined();
    });
  });

  describe('generateLocationWiseHealth', () => {
    it('should generate location wise health chart', () => {
      component.generateLocationWiseHealth(['Loc1'], [{name: 'Series1', data: [1]}]);
      expect(component.location_wise_health).toBeDefined();
    });
  });

  describe('generateExposure_covered_percentage', () => {
    it('should generate exposure covered percentage chart', () => {
      component.generateExposure_covered_percentage([]);
      expect(component.Exposure_covered_percentage).toBeDefined();
    });
  });

  describe('generateCaptured_no_of_samples', () => {
    it('should generate captured no of samples chart', () => {
      component.generateCaptured_no_of_samples([]);
      expect(component.Captured_no_of_samples).toBeDefined();
    });
  });

  describe('generatepoor_good_moderate', () => {
    it('should generate poor good moderate chart', () => {
      component.generatepoor_good_moderate([]);
      expect(component.poor_good_moderate).toBeDefined();
    });
  });

  describe('generatepoor_good_moderate_overall', () => {
    it('should generate poor good moderate overall chart', () => {
      component.generatepoor_good_moderate_overall([]);
      expect(component.poor_good_moderate_all).toBeDefined();
    });
  });

  describe('generatebar_one', () => {
    it('should generate bar one chart', () => {
      component.generatebar_one({cat: [], series: []}, {cat: [], series: []});
      expect(component.bar_one).toBeDefined();
    });

    it('should open modal on Others click', () => {
      jest.useFakeTimers();
      component.generatebar_one({cat: ['Others'], series: [{name: 'Series1', data: [1]}]}, {cat: ['Rest'], series: [{name: 'Series1', data: [1]}]});
      const event = { point: { category: 'Others' } };
      const plotOptions = component.bar_one.options.plotOptions;
      plotOptions.series.events.click(event);
      jest.advanceTimersByTime(500);
      expect(modalService.open).toHaveBeenCalledWith(component.modelLocation, { size: "xl" });
      expect(component.location_wise_health).toBeDefined();
      jest.useRealTimers();
    });
  });

  describe('generatebar_two', () => {
    it('should generate bar two chart', () => {
      component.generatebar_two({cat: [], series: []}, {cat: [], series: []});
      expect(component.bar_two).toBeDefined();
    });

    it('should open modal on Others click', () => {
      jest.useFakeTimers();
      component.generatebar_two({cat: ['Others'], series: [{name: 'Series1', data: [1]}]}, {cat: ['Rest'], series: [{name: 'Series1', data: [1]}]});
      const event = { point: { category: 'Others' } };
      const plotOptions = component.bar_two.options.plotOptions;
      plotOptions.series.events.click(event);
      jest.advanceTimersByTime(500);
      expect(modalService.open).toHaveBeenCalledWith(component.modelContent, { size: "xl" });
      expect(component.Crop_wise_health).toBeDefined();
      jest.useRealTimers();
    });
  });

  describe('generateRainfall_irrigated', () => {
    it('should generate rainfall irrigated chart', () => {
      component.surveyData = [{field_516: 'Rainfed'}, {field_516: 'Irrigated'}];
      component.generateRainfall_irrigated();
      expect(component.Rainfall_irrigated).toBeDefined();
    });
  });

  describe('generateResurvey_time', () => {
    it('should generate resurvey time chart', () => {
      component.generateResurvey_time([]);
      expect(component.Resurvey_time).toBeDefined();
    });
  });

  describe('generateChange_in_crop_health', () => {
    it('should generate change in crop health chart', () => {
      component.generateChange_in_crop_health([]);
      expect(component.Change_in_crop_health).toBeDefined();
    });
  });

  describe('abbreviateNumber', () => {
    it('should abbreviate numbers', () => {
      expect(component.abbreviateNumber(1000)).toBe('1 K');
      expect(component.abbreviateNumber(100000)).toBe('1 L');
      expect(component.abbreviateNumber(10000000)).toBe('1 Cr');
      expect(component.abbreviateNumber(500)).toBe('500');
      expect(component.abbreviateNumber(0)).toBe('');
    });
  });

  describe('refreshDetail', () => {
    it('should call refreshMap if mapDetail', () => {
      component.mapDetail = { refreshMap: jest.fn() };
      component.refreshDetail();
      expect(component.mapDetail.refreshMap).toHaveBeenCalled();
    });

    it('should not throw if no mapDetail', () => {
      component.mapDetail = null;
      expect(() => component.refreshDetail()).not.toThrow();
    });
  });

  describe('getLoaedFileData', () => {
    it('should return if role not allowed', () => {
      component.user = { user_role: '5' };
      component.getLoaedFileData();
      expect(coreService.post).not.toHaveBeenCalled();
    });

    it('should handle no data', fakeAsync(() => {
      component.user.user_role = '1';
      coreService.post.mockResolvedValue({ data: [] });
      component.getLoaedFileData();
      tick();
      expect(component.isFileData).toBe(false);
    }));
  });

  describe('clearDetail', () => {
    it('should clear data and call clearDetail if mapDetail', () => {
      component.mapDetail = { clearDetail: jest.fn() };
      component.clearDetail();
      expect(component.iuServeyMap.size).toBe(0);
      expect(component.revist_survey_map.size).toBe(0);
      expect(component.surveyData).toEqual([]);
      expect(component.allData).toEqual([]);
      expect(component.revisitData).toEqual([]);
      expect(component.surveyLocation).toEqual([]);
      expect(component.mapDetail.clearDetail).toHaveBeenCalled();
    });

    it('should not throw if no mapDetail', () => {
      component.mapDetail = null;
      expect(() => component.clearDetail()).not.toThrow();
    });
  });

  describe('divide', () => {
    it('should divide', () => {
      expect(component.divide(10, 2)).toBe(5);
      expect(component.divide(10, 0)).toBe(0);
    });
  });

  describe('setDefaultLocation', () => {
    it('should set selectedAgency if role 7', () => {
      component.user = { user_role: '7', agency_id: '1' };
      component.setDefaultLocation();
      expect(component.selectedAgency).toEqual(['1']);
    });

    it('should set selectedAgency to 0 if no agency_id', () => {
      component.user = { user_role: '7' };
      component.setDefaultLocation();
      expect(component.selectedAgency).toEqual(['0']);
    });
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
  });

  describe('Additional tests for coverage', () => {
    it('should handle revisit in generateIUCalculation', () => {
      const plan_data = [{ gp_notified_area: 1, notified_unit: 1, crop: 1, state_id: 1, dist_id: 1, tehsil_id: 1, year: 2023, season: 1 }];
      const survey_data = [{ revisit_data: [{field_712: 'Good', datetime: new Date().toISOString()}], datetime: new Date().toISOString(), field_518: 'Poor' }];
      component.iuServeyMap.set('1=>1=>1=>1=>1=>2023=>1', survey_data);
      const result = component.generateIUCalculation(plan_data, survey_data);
      expect(result.iu_calculated_data[0].good).toBe(1);
    });
  });
});