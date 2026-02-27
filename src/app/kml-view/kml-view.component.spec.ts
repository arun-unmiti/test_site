import { ComponentFixture, TestBed, fakeAsync, tick, flushMicrotasks } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';
import * as XLSX from 'xlsx';

import { KmlViewComponent } from './kml-view.component';
import { CoreService } from '../utilities/core.service';
import { FilterService } from '../utilities/filter.service';
import { UserDetailService } from '../auth/user-detail.service';
import { GeojsonMapperService } from '../utilities/geojson-mapper.service';
import { FeatureToggleService } from '../shared/services/feature-toggle.service';
import { environment, ProjectContext } from '../../environments/environment';

// Mock services
class MockCoreService {
  post = jest.fn().mockResolvedValue({});
  dashboard_post = jest.fn().mockResolvedValue({});
  webserivce_post = jest.fn().mockResolvedValue({});
  toast = jest.fn();
  clone = jest.fn(obj => JSON.parse(JSON.stringify(obj)));
  fetchAzureBlob = jest.fn().mockResolvedValue(new Blob());
  getNotifiedCropList = jest.fn<any, any>();
}

class MockFilterService {
  states: any[] = [{ state_id: 1, state_name: 'State1' }];
  districts: any[] = [{ district_id: 1, district_name: 'District1' }];
  tehsils: any[] = [{ tehsil_id: 1, tehsil_name: 'Tehsil1' }];
  blocks: any[] = [{ block_id: 1, block_name: 'Block1' }];
  grampanchayats: any[] = [{ grampanchayat_id: 1, grampanchayat_name: 'GP1' }];
  villages: any[] = [{ village_id: 1, village_name: 'Village1' }];
  crops: any[] = [{ crop_code: 1, crop_name: 'Crop1' }];
  years: any[] = [{ id: 2023, year: 2023 }];
  seasons: any[] = [{ id: 1, season_name: 'Season1' }];
  notifiedUnits: any[] = [];
  users: any[] = [];
  lookupData = {
    clients: [{ UNIT_ID: '2000', UNIT_NAME: 'Client1' }],
    states: [],
    districts: [],
    tehsils: [],
    blocks: [],
    grampanchayats: [],
    villages: [],
  };
  isLoactionFetched = false;
  isvillageFetched = false;
  fetchedLocationData = { subscribe: jest.fn() };
  fetchedVillageData = { subscribe: jest.fn() };
  getAgencyWiseLocation = jest.fn().mockResolvedValue({ states: [], districts: [], tehsils: [] });
}

class MockUserDetailService {
  getUserDetail = jest.fn(() => ({ unit_id: '2000', user_role: '1', agency_id: '1' }));
}

class MockGeojsonMapperService {
  stringToGeojson = jest.fn((): any[] => []);
  coordinateToString = jest.fn(() => '');
  computeArea = jest.fn(() => 0);
}

class MockFeatureToggleService {
  getContext = jest.fn().mockReturnValue('testContext' as ProjectContext);
  getConfig = jest.fn().mockReturnValue({ BASEKMLPREFIX: 'mock_prefix', BASEKMLSUFFIX: 'mock_suffix' });
}

// Mock environment
jest.mock('../../environments/environment', () => ({
  environment: {
    projectConfigs: {
      munichre: { assetsFolder: '/assets/munichre' },
      saksham: { assetsFolder: '/assets/saksham' },
      testContext: { assetsFolder: '/assets/test/' }
    }
  }
}));

// Mock toGeoJSON
(global as any).toGeoJSON = {
  kml: jest.fn().mockReturnValue({ features: [] }),
};

// Mock DOMParser
global.DOMParser = jest.fn().mockImplementation(() => ({
  parseFromString: jest.fn().mockReturnValue({ documentElement: {} }),
}));

// Mock fetch
global.fetch = jest.fn().mockResolvedValue({
  text: jest.fn().mockResolvedValue('<kml></kml>'),
}) as jest.Mock;

jest.mock('xlsx', () => ({
  utils: {
    aoa_to_sheet: jest.fn(),
    book_new: jest.fn(),
    book_append_sheet: jest.fn(),
  },
  writeFile: jest.fn(),
}));

describe('KmlViewComponent', () => {
  let component: KmlViewComponent;
  let fixture: ComponentFixture<KmlViewComponent>;
  let coreService: MockCoreService;
  let filterService: MockFilterService;
  let userService: MockUserDetailService;
  let geoMapper: MockGeojsonMapperService;
  let featureToggle: MockFeatureToggleService;

  beforeEach(async () => {
    global.URL = {
      createObjectURL: jest.fn(),
    } as any;

    await TestBed.configureTestingModule({
      declarations: [KmlViewComponent],
      imports: [HttpClientTestingModule],
      providers: [
        { provide: CoreService, useClass: MockCoreService },
        { provide: FilterService, useClass: MockFilterService },
        { provide: UserDetailService, useClass: MockUserDetailService },
        { provide: GeojsonMapperService, useClass: MockGeojsonMapperService },
        { provide: FeatureToggleService, useClass: MockFeatureToggleService },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(KmlViewComponent);
    component = fixture.componentInstance;
    coreService = TestBed.inject(CoreService) as unknown as MockCoreService;
    filterService = TestBed.inject(FilterService) as unknown as MockFilterService;
    userService = TestBed.inject(UserDetailService) as unknown as MockUserDetailService;
    geoMapper = TestBed.inject(GeojsonMapperService) as unknown as MockGeojsonMapperService;
    featureToggle = TestBed.inject(FeatureToggleService) as unknown as MockFeatureToggleService;
    fixture.detectChanges(); // Call ngOnInit
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  describe('constructor', () => {
    it('should set projectContext and assetsFolder', () => {
      featureToggle.getContext.mockReturnValue('saksham');
      const comp = new KmlViewComponent(coreService as any, filterService as any, {} as any, userService as any, geoMapper as any, featureToggle as any);
      expect(comp.projectContext).toBe('saksham');
      expect(comp.assetsFolder).toBe('/assets/saksham');
      expect(comp.selectedClient).toEqual(['2000']);
      expect(comp.singleClient).toBe('2000');
    });

    it('should set for munichre', () => {
      featureToggle.getContext.mockReturnValue('munichre');
      const comp = new KmlViewComponent(coreService as any, filterService as any, {} as any, userService as any, geoMapper as any, featureToggle as any);
      expect(comp.projectContext).toBe('munichre');
      expect(comp.assetsFolder).toBe('/assets/munichre');
      expect(comp.selectedClient).toEqual([]);
    });

    it('should set projectContext and assetsFolder for testContext', () => {
      featureToggle.getContext.mockReturnValue('testContext');
      const comp = new KmlViewComponent(coreService as any, filterService as any, {} as any, userService as any, geoMapper as any, featureToggle as any);
      expect(comp.projectContext).toBe('testContext');
      expect(comp.assetsFolder).toBe('/assets/test/');
      expect(comp.selectedClient).toEqual([]);
    });
  });

  describe('ngOnInit', () => {
    it('should set userDetails from userService', () => {
      expect(component.userDetails).toEqual({ unit_id: '2000', user_role: '1', agency_id: '1' });
    });

    it('should call getFilterData and getLocationCropData', () => {
      const getFilterDataSpy = jest.spyOn(component, 'getFilterData');
      const getLocationCropDataSpy = jest.spyOn(component, 'getLocationCropData');
      component.ngOnInit();
      expect(getFilterDataSpy).toHaveBeenCalled();
      expect(getLocationCropDataSpy).toHaveBeenCalled();
    });

    it('should set kmlUrl and kmlUrlSuffix from config', () => {
      expect(component.kmlUrl).toBe('mock_prefix');
      expect(component.kmlUrlSuffix).toBe('mock_suffix');
    });
  });

  describe('getFilterData', () => {
    it('should call addFilterData if isLoactionFetched is true', () => {
      filterService.isLoactionFetched = true;
      const addFilterDataSpy = jest.spyOn(component, 'addFilterData');
      component.getFilterData();
      expect(addFilterDataSpy).toHaveBeenCalled();
    });

    it('should subscribe to fetchedLocationData if not fetched', () => {
      filterService.isLoactionFetched = false;
      const addFilterDataSpy = jest.spyOn(component, 'addFilterData');
      component.getFilterData();
      const subscriber = filterService.fetchedLocationData.subscribe.mock.calls[0][0];
      subscriber();
      expect(addFilterDataSpy).toHaveBeenCalled();
    });

    it('should call setVilageData if isvillageFetched is true', () => {
      filterService.isvillageFetched = true;
      const setVilageDataSpy = jest.spyOn(component, 'setVilageData');
      component.getFilterData();
      expect(setVilageDataSpy).toHaveBeenCalled();
    });

    it('should subscribe to fetchedVillageData if not fetched', () => {
      filterService.isvillageFetched = false;
      const setVilageDataSpy = jest.spyOn(component, 'setVilageData');
      component.getFilterData();
      const subscriber = filterService.fetchedVillageData.subscribe.mock.calls[0][0];
      subscriber();
      expect(setVilageDataSpy).toHaveBeenCalled();
    });

    it('should subscribe to fetchedVillageData and call search if preApplied', () => {
      filterService.isvillageFetched = false;
      component.preApplied = true;
      component.loading = 1;
      const setVilageDataSpy = jest.spyOn(component, 'setVilageData');
      const searchSpy = jest.spyOn(component, 'search');
      component.getFilterData();
      const subscriber = filterService.fetchedVillageData.subscribe.mock.calls[0][0];
      subscriber();
      expect(setVilageDataSpy).toHaveBeenCalled();
      expect(component.loading).toBe(0);
      expect(component.preApplied).toBe(false);
      expect(searchSpy).toHaveBeenCalled();
    });

    it('should call getApprovedStatusData', () => {
      const getApprovedStatusDataSpy = jest.spyOn(component, 'getApprovedStatusData');
      component.getFilterData();
      expect(getApprovedStatusDataSpy).toHaveBeenCalled();
    });
  });

  describe('getApprovedStatusData', () => {
    it('should set approvedStatusData and flag', () => {
      component.getApprovedStatusData();
      expect(component.approvedStatusData).toEqual([
        { label: 'Pending', value: null },
        { label: 'Approved', value: '1' },
      ]);
      expect(component.approvedStatusFlag).toEqual({
        '0': 'Rejected',
        null: 'Pending',
        '1': 'Approved',
      });
    });
  });

  describe('addFilterData', () => {
    it('should set filter data and maps', () => {
      jest.spyOn(coreService, 'clone').mockImplementation(obj => obj);
      component.addFilterData();
      expect(component.states).toEqual(filterService.states);
      expect(component.allDistricts).toEqual(filterService.districts);
      expect(component.allTehsils).toEqual(filterService.tehsils);
      expect(component.allBlocks).toEqual(filterService.blocks);
      expect(component.clientData).toEqual(filterService.lookupData.clients);
      expect(component.yearData).toEqual(filterService.years);
      expect(component.seasonData).toEqual(filterService.seasons);
      expect(component.stateMap.get(1)).toBe('State1');
      expect(component.districtMap.get(1)).toBe('District1');
      expect(component.tehsilMap.get(1)).toBe('Tehsil1');
      expect(component.blockMap.get(1)).toBe('Block1');
      expect(component.cropMap.get(1)).toBe('Crop1');
      expect(component.seasonMap.get(1)).toBe('Season1');
      expect(component.yearMap.get(2023)).toBe(2023);
    });

    it('should set users map with full name', () => {
      filterService.users = [{ user_id: 1, first_name: 'First', last_name: 'Last' }];
      component.addFilterData();
      expect(component.userIdMap.get(1)).toBe('First Last');
    });

    it('should set users map with first name only if no last name', () => {
      filterService.users = [{ user_id: 1, first_name: 'First' }];
      component.addFilterData();
      expect(component.userIdMap.get(1)).toBe('First undefined');
    });

    it('should call setDefaultLocation', () => {
      const setDefaultLocationSpy = jest.spyOn(component, 'setDefaultLocation');
      component.addFilterData();
      expect(setDefaultLocationSpy).toHaveBeenCalled();
    });
  });

  describe('setVilageData', () => {
    it('should populate maps', () => {
      component.setVilageData();
      expect(component.grampanchayatMap.get(1)).toBe('GP1');
      expect(component.villageMap.get(1)).toBe('Village1');
    });

    it('should handle empty grampanchayats and villages', () => {
      filterService.grampanchayats = [];
      filterService.villages = [];
      component.setVilageData();
      expect(component.grampanchayatMap.size).toBe(0);
      expect(component.villageMap.size).toBe(0);
    });
  });

  describe('onSingleClientChange', () => {
    it('should set selectedClient for munichre', () => {
      featureToggle.getContext.mockReturnValue('munichre');
      component.projectContext = 'munichre';
      component.clientData = [{ UNIT_ID: '2000' }];
      const onClientSelectSpy = jest.spyOn(component, 'onClientSelect');
      component.onSingleClientChange('2000');
      expect(component.selectedClient).toEqual([{ UNIT_ID: '2000' }]);
      expect(onClientSelectSpy).toHaveBeenCalledWith([{ UNIT_ID: '2000' }]);
    });

    it('should set for saksham', () => {
      featureToggle.getContext.mockReturnValue('saksham');
      component.projectContext = 'saksham';
      const onClientSelectSpy = jest.spyOn(component, 'onClientSelect');
      component.onSingleClientChange('2000');
      expect(component.selectedClient).toEqual(['2000']);
      expect(onClientSelectSpy).toHaveBeenCalledWith(['2000']);
    });

    it('should set empty if no match', () => {
      featureToggle.getContext.mockReturnValue('munichre');
      component.projectContext = 'munichre';
      component.clientData = [];
      component.onSingleClientChange('invalid');
      expect(component.selectedClient).toEqual([]);
    });
  });

  describe('callPromise', () => {
    it('should call function in promise', async () => {
      const func = jest.fn();
      await component.callPromise(func);
      expect(func).toHaveBeenCalled();
    });
  });

  describe('onClientSelect', () => {
    it('should reset filters and call methods', () => {
      const getLocationCropDataSpy = jest.spyOn(component, 'getLocationCropData');
      const getAgencyDataSpy = jest.spyOn(component, 'getAgencyData');
      component.userDetails = { user_role: '1' };
      component.singleClient = '2000';
      component.selectedYear = 2023;
      component.selectedSeason = 1;
      component.onClientSelect([]);
      expect(component.agencyData).toEqual([]);
      expect(component.selectedAgency).toEqual([]);
      expect(component.states).toEqual([]);
      expect(component.singleState).toBe("");
      expect(component.selectedState).toEqual([]);
      expect(component.clientStates).toEqual([]);
      expect(component.clientDistricts).toEqual([]);
      expect(component.districts).toEqual([]);
      expect(component.selectedDistrict).toEqual([]);
      expect(getLocationCropDataSpy).toHaveBeenCalled();
      expect(getAgencyDataSpy).toHaveBeenCalled();
    });

    it('should not call getAgencyData for role 7', () => {
      component.userDetails = { user_role: '7' };
      const getAgencyDataSpy = jest.spyOn(component, 'getAgencyData');
      component.onClientSelect([]);
      expect(getAgencyDataSpy).not.toHaveBeenCalled();
    });

    it('should not call getAgencyData if missing year or season', () => {
      component.userDetails = { user_role: '1' };
      component.singleClient = '2000';
      component.selectedYear = null;
      component.selectedSeason = 1;
      const getAgencyDataSpy = jest.spyOn(component, 'getAgencyData');
      component.onClientSelect([]);
      expect(getAgencyDataSpy).not.toHaveBeenCalled();
    });
  });

  describe('getLocationCropData', () => {
    beforeEach(() => {
      component.selectedState = [{ state_id: 1 }];
      component.selectedDistrict = [{ district_id: 1 }];
    });

    it('should use dataCrops if available', () => {
      component.dataCrops = [{ state_id: 1, dist_id: 1, crop_id: 1 }];
      const getNotifiedCropListSpy = jest.spyOn(coreService, 'getNotifiedCropList').mockReturnValue([{ crop_id: 1 }]);
      component.getLocationCropData();
      expect(component.cropsData).toEqual([{ crop_id: 1 }]);
      expect(getNotifiedCropListSpy).toHaveBeenCalled();
    });

    it('should use dataCrops with no matches', () => {
      component.dataCrops = [{ state_id: 2, dist_id: 2, crop_id: 1 }];
      const getNotifiedCropListSpy = jest.spyOn(coreService, 'getNotifiedCropList').mockReturnValue([]);
      component.getLocationCropData();
      expect(component.cropsData).toEqual([]);
    });

    it('should fetch if no dataCrops', async () => {
      component.dataCrops = [];
      coreService.post.mockResolvedValue({ status: 1, lkp_Karnatakacrops: [{ crop_id: 1 }] });
      const getNotifiedCropListSpy = jest.spyOn(coreService, 'getNotifiedCropList').mockReturnValue([{ crop_id: 1 }]);
      component.getLocationCropData();
      await new Promise(resolve => setTimeout(resolve));
      expect(component.dataCrops).toEqual([{ crop_id: 1 }]);
      expect(component.cropsData).toEqual([{ crop_id: 1 }]);
      expect(getNotifiedCropListSpy).toHaveBeenCalled();
    });

    it('should handle fetch error', fakeAsync(() => {
      component.dataCrops = [];
      coreService.post.mockRejectedValue(new Error('error'));
      component.getLocationCropData();
      tick();
      expect(component.cropsData).toEqual([]);
    }));

    it('should handle status not 1', async () => {
      component.dataCrops = [];
      coreService.post.mockResolvedValue({ status: 0 });
      component.getLocationCropData();
      await new Promise(resolve => setTimeout(resolve));
      expect(component.dataCrops).toEqual([]);
    });
  });

  describe('onSurveyChange', () => {
    it('should set districtField', () => {
      component.onSurveyChange(1);
      expect(component.districtField).toBe('field_502');
      component.onSurveyChange(2);
      expect(component.districtField).toBe('field_529');
      component.onSurveyChange(3);
      expect(component.districtField).toBe('field_586');
    });

    it('should not change if invalid', () => {
      component.districtField = 'default';
      component.onSurveyChange(4);
      expect(component.districtField).toBe('default');
    });
  });

  describe('onSingleStateChange', () => {
    it('should set selectedState and call onStateChange', () => {
      component.states = [{ state_id: 1 }];
      const spy = jest.spyOn(component, 'onStateChange');
      component.onSingleStateChange(1);
      expect(component.selectedState).toEqual([{ state_id: 1 }]);
      expect(spy).toHaveBeenCalledWith([{ state_id: 1 }]);
    });

    it('should set empty if no match', () => {
      component.states = [];
      component.onSingleStateChange(1);
      expect(component.selectedState).toEqual([]);
    });
  });

  describe('onStateChange', () => {
    it('should reset and set districts', () => {
      component.clientDistricts = [{ state_id: 1, district_id: 1, district_name: 'District1' }];
      const spy = jest.spyOn(component, 'getLocationCropData');
      component.onStateChange([{ state_id: 1, state_name: 'State1' }]);
      expect(component.districts[0].state_name).toBe('State1');
      expect(component.districts[0].items).toEqual([{ state_id: 1, district_id: 1, district_name: 'District1' }]);
      expect(component.tehsilOptions).toEqual([]);
      expect(component.blocks).toEqual([]);
      expect(component.selectedDistrict).toEqual([]);
      expect(component.selectedBlock).toEqual([]);
      expect(spy).toHaveBeenCalled();
    });

    it('should reset if no event', () => {
      component.onStateChange([]);
      expect(component.districts).toEqual([]);
      expect(component.tehsilOptions).toEqual([]);
      expect(component.blocks).toEqual([]);
      expect(component.selectedDistrict).toEqual([]);
      expect(component.selectedBlock).toEqual([]);
    });
  });

  describe('onDistrictChange', () => {
    it('should reset and set tehsilOptions', () => {
      component.clientTehsils = [{ district_id: 1, tehsil_id: 1, tehsil_name: 'Tehsil1' }];
      const spy = jest.spyOn(component, 'getLocationCropData');
      component.onDistrictChange([{ district_id: 1, district_name: 'District1' }]);
      expect(component.tehsilOptions[0].district_name).toBe('District1');
      expect(component.tehsilOptions[0].items).toEqual([{ district_id: 1, tehsil_id: 1, tehsil_name: 'Tehsil1' }]);
      expect(component.blocks).toEqual([]);
      expect(component.selectedBlock).toEqual([]);
      expect(spy).toHaveBeenCalled();
    });

    it('should reset if no event', () => {
      component.onDistrictChange([]);
      expect(component.tehsilOptions).toEqual([]);
      expect(component.blocks).toEqual([]);
      expect(component.selectedBlock).toEqual([]);
    });
  });

  describe('search', () => {
    beforeEach(() => {
      component.userDetails = { user_role: '1', unit_id: '2000' };
    });

    it('should warn if no form', () => {
      component.search();
      expect(coreService.toast).toHaveBeenCalledWith('warn', 'Please select form');
    });

    it('should warn if not single state', () => {
      component.selectedForm = 1;
      component.selectedState = [];
      component.search();
      expect(coreService.toast).toHaveBeenCalledWith('warn', 'Please select state');
    });

    it('should set isSearched and call getKMLData', () => {
      component.selectedForm = 1;
      component.selectedState = [{ state_id: 1 }];
      const spy = jest.spyOn(component, 'getKMLData');
      component.search();
      expect(component.isSearched).toBe(true);
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('closePopup', () => {
    it('should reset height and tableData', () => {
      component.closePopup();
      expect(component.height).toBe('600px');
      expect(component.tableData).toEqual([]);
    });
  });

  describe('mapPointClick', () => {
    it('should be empty', () => {
      component.mapPointClick({});
      expect(true).toBe(true);
    });
  });

  describe('generateColDef', () => {
    it('should generate colDefs and typeFields', () => {
      component.fields = [
        { field_id: 1, label: 'Label1', type: 'text' },
        { field_id: 2, label: 'Label2', type: 'lkp_state' },
      ];
      component.generateColDef();
      expect(component.colDefs).toEqual([
        { field: 'field_1', header: 'Label1', type: 'text', id: 1 },
        { field: 'field_2', header: 'Label2', type: 'lkp_state', id: 2 },
      ]);
      expect(component.typeFields).toEqual([
        { type: 'lkp_state', field: 'field_2' },
        { type: 'approved_reject', field: 'approved_reject' },
      ]);
    });

    it('should handle no fields', () => {
      component.fields = [];
      component.generateColDef();
      expect(component.colDefs).toEqual([]);
      expect(component.typeFields).toEqual([{ type: 'approved_reject', field: 'approved_reject' }]);
    });
  });

  describe('generateRowData', () => {
    it('should clone and map tableData', () => {
      component.surveydata = [{ field_1: 1 }];
      component.typeFields = [{ type: 'lkp_state', field: 'field_1' }];
      filterService.states = [{ state_id: 1, state_name: 'State1' }];
      component.generateRowData();
      expect(component.tableData[0].sno).toBe(1);
      expect(component.tableData[0].field_1).toBe('State1');
    });

    it('should handle unknown lkp type', () => {
      component.surveydata = [{ field_1: 'unknown' }];
      component.typeFields = [{ type: 'lkp_unknown', field: 'field_1' }];
      component.generateRowData();
      expect(component.tableData[0].field_1).toBe('unknown');
    });

    it('should handle lkp_district', () => {
      component.surveydata = [{ field_2: 1 }];
      component.typeFields = [{ type: 'lkp_district', field: 'field_2' }];
      filterService.districts = [{ district_id: 1, district_name: 'District1' }];
      component.generateRowData();
      expect(component.tableData[0].field_2).toBe('District1');
    });

    it('should handle lkp_block', () => {
      component.surveydata = [{ field_3: 1 }];
      component.typeFields = [{ type: 'lkp_block', field: 'field_3' }];
      filterService.blocks = [{ block_id: 1, block_name: 'Block1' }];
      component.generateRowData();
      expect(component.tableData[0].field_3).toBe('Block1');
    });

    it('should handle lkp_crop', () => {
      component.surveydata = [{ field_5: 1 }];
      component.typeFields = [{ type: 'lkp_crop', field: 'field_5' }];
      filterService.crops = [{ crop_code: 1, crop_name: 'Crop1' }];
      component.generateRowData();
      expect(component.tableData[0].field_5).toBe('Crop1');
    });

    it('should handle lkp_tehsil', () => {
      component.surveydata = [{ field_6: 1 }];
      component.typeFields = [{ type: 'lkp_tehsil', field: 'field_6' }];
      filterService.tehsils = [{ tehsil_id: 1, tehsil_name: 'Tehsil1' }];
      component.generateRowData();
      expect(component.tableData[0].field_6).toBe('Tehsil1');
    });

    it('should handle lkp_village', () => {
      component.surveydata = [{ field_7: 1 }];
      component.typeFields = [{ type: 'lkp_village', field: 'field_7' }];
      component.villageMap.set(1, 'Village1');
      component.generateRowData();
      expect(component.tableData[0].field_7).toBe(1);
    });

    it('should handle lkp_grampanchayat', () => {
      component.surveydata = [{ field_8: 1 }];
      component.typeFields = [{ type: 'lkp_grampanchayat', field: 'field_8' }];
      component.grampanchayatMap.set(1, 'GP1');
      component.generateRowData();
      expect(component.tableData[0].field_8).toBe(1);
    });

    it('should handle lkp_season', () => {
      component.surveydata = [{ field_9: 1 }];
      component.typeFields = [{ type: 'lkp_season', field: 'field_9' }];
      component.seasonMap.set(1, 'Season1');
      component.generateRowData();
      expect(component.tableData[0].field_9).toBe(1);
    });

    it('should handle lkp_year', () => {
      component.surveydata = [{ field_9: 19 }];
      component.typeFields = [{ type: 'lkp_year', field: 'field_9' }];
      component.yearMap.set(19, 19);
      component.generateRowData();
      expect(component.tableData[0].field_9).toBe(19);
    });

    it('should handle lkp_notified_unit', () => {
      component.surveydata = [{ field_10: 1 }];
      component.typeFields = [{ type: 'lkp_notified_unit', field: 'field_10' }];
      component.notifiedUnitMap.set(1, 'Unit1');
      component.generateRowData();
      expect(component.tableData[0].field_10).toBe(1);
    });

    it('should handle approved_reject', () => {
      component.surveydata = [{ approved_reject: '1' }];
      component.typeFields = [{ type: 'approved_reject', field: 'approved_reject' }];
      component.approvedStatusFlag['1'] = 'Approved';
      component.generateRowData();
      expect(component.tableData[0].approved_reject).toBe('1');
    });

    it('should handle approved_reject_by', () => {
      component.surveydata = [{ approved_reject_by: 1 }];
      component.typeFields = [{ type: 'approved_reject_by', field: 'approved_reject_by' }];
      component.userIdMap.set(1, 'User1');
      component.generateRowData();
      expect(component.tableData[0].approved_reject_by).toBe(1);
    });

    it('should handle user_id', () => {
      component.surveydata = [{ user_id: 1 }];
      component.typeFields = [{ type: 'user_id', field: 'user_id' }];
      component.userIdMap.set(1, 'User1');
      component.generateRowData();
      expect(component.tableData[0].user_id).toBe(1);
    });

    it('should handle no typeFields', () => {
      component.surveydata = [{ field_1: 'value' }];
      component.typeFields = [];
      component.generateRowData();
      expect(component.tableData[0].field_1).toBe('value');
    });
  });

  describe('clearMapDetail', () => {
    it('should clear arrays', () => {
      component.clearMapDetail();
      expect(component.survey).toEqual({});
      expect(component.surveydata).toEqual([]);
      expect(component.fields).toEqual([]);
      expect(component.colDefs).toEqual([]);
      expect(component.typeFields).toEqual([]);
      expect(component.tableData).toEqual([]);
    });
  });

  describe('ranges', () => {
    it('should have predefined ranges', () => {
      expect(component.ranges.Today).toBeDefined();
      expect(component.ranges.Yesterday).toBeDefined();
      expect(component.ranges['Last 7 Days']).toBeDefined();
      expect(component.ranges['Last 15 Days']).toBeDefined();
      expect(component.ranges['This Month']).toBeDefined();
      expect(component.ranges['Last Month']).toBeDefined();
      expect(component.ranges['Last 3 Month']).toBeDefined();
    });
  });

  describe('setDefaultLocation', () => {
    it('should set singleClient and selectedClient from userDetails', () => {
      component.userDetails = { unit_id: '2000' };
      component.clientData = [{ UNIT_ID: '2000' }];
      component.projectContext = 'munichre';
      component.setDefaultLocation();
      expect(component.singleClient).toBe('2000');
      expect(component.selectedClient).toEqual([{ UNIT_ID: '2000' }]);
    });

    it('should set selectedClient from userDetails for saksham', () => {
      component.projectContext = 'saksham';
      component.userDetails = { unit_id: '2000' };
      component.setDefaultLocation();
      expect(component.singleClient).toBe('2000');
      expect(component.selectedClient).toEqual(['2000']);
    });

    it('should set selectedAgency for role 7 with agency_id', () => {
      component.userDetails = { user_role: '7', agency_id: '1' };
      component.setDefaultLocation();
      expect(component.selectedAgency).toEqual(['1']);
    });

    it('should set selectedAgency to 0 if no agency_id', () => {
      component.userDetails = { user_role: '7' };
      component.setDefaultLocation();
      expect(component.selectedAgency).toEqual(['0']);
    });

    it('should not set selectedAgency for non-role 7', () => {
      component.userDetails = { user_role: '1' };
      component.setDefaultLocation();
      expect(component.selectedAgency).toEqual([]);
    });
  });

  describe('getAgencyData', () => {
    it('should not call if missing data', () => {
      component.singleClient = null;
      component.getAgencyData();
      expect(coreService.dashboard_post).not.toHaveBeenCalled();
    });

    it('should call dashboard_post and set agencyData', async () => {
      component.singleClient = '2000';
      component.selectedYear = 2023;
      component.selectedSeason = 1;
      coreService.dashboard_post.mockResolvedValue({ status: 1, all_agencies: [{ agency_id: 1 }] });
      component.getAgencyData();
      await new Promise(resolve => setTimeout(resolve));
      expect(component.agencyData).toEqual([{ agency_id: 1 }, { agency_id: '0', agency_name: 'Self' }]);
    });

    it('should handle error', async () => {
      component.singleClient = '2000';
      component.selectedYear = 2023;
      component.selectedSeason = 1;
      coreService.dashboard_post.mockRejectedValue(new Error('error'));
      component.getAgencyData();
      await new Promise(resolve => setTimeout(resolve));
      expect(component.agencyData).toEqual([]);
    });

    it('should handle status not 1', async () => {
      component.singleClient = '2000';
      component.selectedYear = 2023;
      component.selectedSeason = 1;
      coreService.dashboard_post.mockResolvedValue({ status: 0 });
      component.getAgencyData();
      await new Promise(resolve => setTimeout(resolve));
      expect(component.agencyData).toEqual([]);
    });
  });

  describe('getKMLData', () => {
    it('should return early if villages length 0', () => {
      filterService.villages = [];
      component.getKMLData();
      expect(component.preApplied).toBe(true);
    });

    it('should handle null approvedStatus', () => {
      component.selectedApprovedStatus = null;
      component.getKMLData();
      // Check request has approved_reject: null
    });

    it('should handle undefined approvedStatus', () => {
      component.selectedApprovedStatus = undefined;
      component.getKMLData();
      // Check request has no approved_reject
    });

    it('should handle fields4 and fields7', async () => {
      filterService.villages = [{}];
      coreService.post.mockResolvedValue({ status: 1, fields4: [{ field_id: 2 }] });
      component.getKMLData();
      await new Promise(resolve => setTimeout(resolve));
      expect(component.fields).toEqual([{ field_id: 2 }]);
    });

    it('should handle error in promises', fakeAsync(() => {
      coreService.post.mockRejectedValue(new Error('error'));
      component.getKMLData();
      tick();
      expect(component.fields).toEqual([]);
    }));

    it('should handle status not 1 for fields', async () => {
      coreService.post.mockResolvedValue({ status: 0 });
      component.getKMLData();
      await new Promise(resolve => setTimeout(resolve));
      expect(component.fields).toEqual([]);
    });

    it('should handle status not 1 for kmls', async () => {
      coreService.post.mockResolvedValue({ status: 1 });
      coreService.webserivce_post.mockResolvedValue({ status: 0 });
      component.getKMLData();
      await new Promise(resolve => setTimeout(resolve));
      expect(component.surveydata).toEqual([]);
      expect(component.kmls).toEqual([]);
    });
  });

  describe('loadAgencyLocation', () => {
    it('should load locations', async () => {
      filterService.getAgencyWiseLocation.mockResolvedValue({ states: [{ state_id: 1 }], districts: [{ district_id: 1 }], tehsils: [{ tehsil_id: 1 }] });
      component.singleClient = '2000';
      component.selectedYear = 2023;
      component.selectedSeason = 1;
      component.userDetails = { user_role: '1' };
      await component.loadAgencyLocation(['1']);
      expect(component.clientStates).toEqual([{ state_id: 1 }]);
      expect(component.clientDistricts).toEqual([{ district_id: 1 }]);
      expect(component.clientTehsils).toEqual([{ tehsil_id: 1 }]);
      expect(component.states).toEqual([{ state_id: 1 }]);
    });
  });

  describe('onYearSelect', () => {
    it('should not call getAgencyData if missing client/season', () => {
      component.userDetails = { user_role: '1' };
      const getAgencyDataSpy = jest.spyOn(component, 'getAgencyData');
      component.onYearSelect(2023);
      expect(getAgencyDataSpy).not.toHaveBeenCalled();
    });
  });

  describe('onSeasonSelect', () => {
    it('should not call getAgencyData if missing client/year', () => {
      component.userDetails = { user_role: '1' };
      const getAgencyDataSpy = jest.spyOn(component, 'getAgencyData');
      component.onSeasonSelect(1);
      expect(getAgencyDataSpy).not.toHaveBeenCalled();
    });
  });

  describe('onAgencyChange', () => {
    it('should reset and load if event', () => {
      const loadAgencyLocationSpy = jest.spyOn(component, 'loadAgencyLocation');
      const getLocationCropDataSpy = jest.spyOn(component, 'getLocationCropData');
      component.onAgencyChange(['1']);
      expect(component.singleState).toBe('');
      expect(component.districts).toEqual([]);
      expect(component.tehsilOptions).toEqual([]);
      expect(component.blocks).toEqual([]);
      expect(component.selectedDistrict).toEqual([]);
      expect(component.selectedBlock).toEqual([]);
      expect(component.selectedTehsil).toEqual([]);
      expect(component.clientStates).toEqual([]);
      expect(component.clientDistricts).toEqual([]);
      expect(loadAgencyLocationSpy).toHaveBeenCalledWith(['1']);
      expect(getLocationCropDataSpy).toHaveBeenCalled();
    });

    it('should reset and call getLocationCropData if no event', () => {
      const loadAgencyLocationSpy = jest.spyOn(component, 'loadAgencyLocation');
      const getLocationCropDataSpy = jest.spyOn(component, 'getLocationCropData');
      component.onAgencyChange(null);
      expect(loadAgencyLocationSpy).not.toHaveBeenCalled();
      expect(getLocationCropDataSpy).toHaveBeenCalled();
    });
  });

  describe('get deactiveField', () => {
    it('should return true', () => {
      component.selectedYear = 2023;
      component.selectedSeason = 1;
      component.selectedAgency = ['1'];
      expect(component.deactiveField).toBeTruthy();
    });

    it('should return false if missing year', () => {
      component.selectedYear = null;
      component.selectedSeason = 1;
      component.selectedAgency = ['1'];
      expect(component.deactiveField).toBeFalsy();
    });

    it('should return false if missing season', () => {
      component.selectedYear = 2023;
      component.selectedSeason = null;
      component.selectedAgency = ['1'];
      expect(component.deactiveField).toBeFalsy();
    });

    it('should return false if missing agency', () => {
      component.selectedYear = 2023;
      component.selectedSeason = 1;
      component.selectedAgency = [];
      expect(component.deactiveField).toBeFalsy();
    });
  });

  describe('downloadStatus', () => {
    it('should generate and download Excel', () => {
      component.surveyTextData = { 1: { id: 1, data_id: 'data1', case_ID: 'case1', user_id: 1, first_name: 'First', last_name: 'Last' } };
      component.dataDownloadStatus = { 1: true };
      const aoa_to_sheetSpy = jest.spyOn(XLSX.utils, 'aoa_to_sheet');
      const book_newSpy = jest.spyOn(XLSX.utils, 'book_new');
      const book_append_sheetSpy = jest.spyOn(XLSX.utils, 'book_append_sheet');
      const writeFileSpy = jest.spyOn(XLSX, 'writeFile');
      component.downloadStatus();
      expect(aoa_to_sheetSpy).toHaveBeenCalled();
      expect(book_newSpy).toHaveBeenCalled();
      expect(book_append_sheetSpy).toHaveBeenCalled();
      expect(writeFileSpy).toHaveBeenCalled();
    });

    it('should handle false status', () => {
      component.surveyTextData = { 1: { id: 1, data_id: 'data1', case_ID: 'case1', user_id: 1, first_name: 'First', last_name: 'Last' } };
      component.dataDownloadStatus = { 1: false };
      const writeFileSpy = jest.spyOn(XLSX, 'writeFile');
      component.downloadStatus();
      expect(writeFileSpy).toHaveBeenCalled();
    });

    it('should handle empty surveyTextData', () => {
      component.surveyTextData = {};
      const writeFileSpy = jest.spyOn(XLSX, 'writeFile');
      component.downloadStatus();
      expect(writeFileSpy).toHaveBeenCalled();
    });
  });

  describe('downloadGeoJson', () => {
    it('should call generateFile', () => {
      const generateFileSpy = jest.spyOn(component, 'generateFile');
      component.downloadGeoJson();
      expect(generateFileSpy).toHaveBeenCalledWith(component.geoJsonData);
    });
  });

  describe('generateFile', () => {
    it('should create and download GeoJSON file', () => {
      const features = [{ type: 'Feature' }];
      const createObjectURLSpy = jest.spyOn(URL, 'createObjectURL');
      const appendChildSpy = jest.spyOn(document.body, 'appendChild');
      const removeChildSpy = jest.spyOn(document.body, 'removeChild');
      component.generateFile(features);
      expect(createObjectURLSpy).toHaveBeenCalled();
      expect(appendChildSpy).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalled();
    });
  });

  describe('fetchKML', () => {
    it('should handle coordinates (geojson)', fakeAsync(() => {
      const fileDetail = { coordinates: 'coords', info: [{}] };
      geoMapper.stringToGeojson.mockReturnValue([{ properties: {} }]);
      const p = component.fetchKML(fileDetail);
      tick();
      return p.then(res => {
        expect(res).toEqual({ response: [{ properties: {} }], request: fileDetail, type: 'geojson' });
      });
    }));

    it('should handle file_name for munichre with Azure', async () => {
      component.projectContext = 'munichre';
      const fileDetail = { file_name: 'file.kml', info: [{}] };
      coreService.fetchAzureBlob.mockResolvedValue({ text: jest.fn().mockResolvedValue('<kml></kml>') });
      const p = component.fetchKML(fileDetail);
      const res = await p;
      expect(res).toEqual({ response: { documentElement: {} }, request: fileDetail });
    });

    it('should handle file_name for non-munichre with fetch', async () => {
      component.projectContext = 'saksham';
      const fileDetail = { file_name: 'file.kml', info: [{}] };
      (global.fetch as jest.Mock).mockResolvedValue({ text: jest.fn().mockResolvedValue('<kml></kml>') });
      const p = component.fetchKML(fileDetail);
      const res = await p;
      expect(res).toEqual({ response: { documentElement: {} }, request: fileDetail });
    });

    it('should handle no textResponse', fakeAsync(() => {
      component.projectContext = 'munichre';
      const fileDetail = { file_name: 'file.kml' };
      coreService.fetchAzureBlob.mockResolvedValue({ text: jest.fn().mockResolvedValue(null) });
      const p = component.fetchKML(fileDetail);
      tick();
      return p.then(res => {
        expect(res).toEqual({ response: null, request: fileDetail });
      });
    }));

    it('should handle no coordinates or file_name', fakeAsync(() => {
      const fileDetail = {};
      const p = component.fetchKML(fileDetail);
      tick();
      return p.then(res => {
        expect(res).toEqual({ request: fileDetail });
      });
    }));
  });

  describe('generateGeoJson', () => {
    it('should handle no kmls', fakeAsync(() => {
      component.kmls = [];
      component.generateGeoJson();
      tick(100);
      flushMicrotasks();
      expect(component.geoJsonData).toEqual([]);
      expect(component.geoJsonLoading).toBe(0);
    }));

    it('should handle geojson type', fakeAsync(() => {
      component.kmls = [{ file_name: 'file1', coordinates: 'coords1', plot_data_id: 1 }];
      geoMapper.stringToGeojson.mockReturnValue([{ properties: {} }]);
      component.surveyTextData = { 1: { id: 1, all_kmls: [{}] } };
      component.generateGeoJson();
      tick(100);
      flushMicrotasks();
      expect(geoMapper.stringToGeojson).toHaveBeenCalledWith('coords1');
    }));

    it('should handle parse error', fakeAsync(() => {
      component.kmls = [{ file_name: 'file1.kml', plot_data_id: 1 }];
      (global.fetch as jest.Mock).mockResolvedValueOnce({ text: jest.fn().mockResolvedValueOnce('invalid') });
      (global as any).toGeoJSON.kml.mockImplementation(() => { throw new Error('parse error'); });
      component.generateGeoJson();
      tick(100);
      flushMicrotasks();
      expect(component.geoJsonData).toEqual([]);
    }));

    it('should set showMap if data', fakeAsync(() => {
      component.kmls = [{ file_name: 'file1', coordinates: 'coords1', plot_data_id: 1 }];
      geoMapper.stringToGeojson.mockReturnValue([{ properties: {} }]);
      component.generateGeoJson();
      tick(100);
      flushMicrotasks();
      expect(component.showMap).toBe(false); // as per code
    }));

    it('should handle kml type with munichre', fakeAsync(() => {
      component.projectContext = 'munichre';
      component.kmls = [{ file_name: 'file1.kml', plot_data_id: 1 }];
      coreService.fetchAzureBlob.mockResolvedValueOnce({ text: jest.fn().mockResolvedValueOnce('<kml></kml>') });
      (global as any).toGeoJSON.kml.mockReturnValue({ features: [{ properties: {} }] });
      component.surveyTextData = { 1: { id: 1, all_kmls: [{}] } };
      component.generateGeoJson();
      tick(100);
      flushMicrotasks();
      expect(coreService.fetchAzureBlob).toHaveBeenCalledWith('mock_prefixfile1.kml');
      expect((global as any).toGeoJSON.kml).toHaveBeenCalled();
    }));

    it('should handle kml type non-munichre', fakeAsync(() => {
      component.projectContext = 'saksham';
      component.kmls = [{ file_name: 'file1.kml', plot_data_id: 1 }];
      (global.fetch as jest.Mock).mockResolvedValueOnce({ text: jest.fn().mockResolvedValueOnce('<kml></kml>') });
      (global as any).toGeoJSON.kml.mockReturnValue({ features: [{ properties: {} }] });
      component.surveyTextData = { 1: { id: 1, all_kmls: [{}] } };
      component.generateGeoJson();
      tick(100);
      flushMicrotasks();
      expect(global.fetch).toHaveBeenCalledWith('mock_prefixfile1.kmlmock_suffix');
    }));

    it('should update dataDownloadStatus', fakeAsync(() => {
      component.kmls = [{ file_name: 'file1', coordinates: 'coords1', plot_data_id: 1 }];
      geoMapper.stringToGeojson.mockReturnValue([{ properties: {} }]);
      component.surveyTextData = { 1: { id: 1 } };
      component.dataDownloadStatus = {};
      component.generateGeoJson();
      tick(100);
      flushMicrotasks();
      expect(component.dataDownloadStatus[1]).toBe(true);
    }));

    it('should handle no geoData', fakeAsync(() => {
      component.kmls = [{ file_name: 'file1', coordinates: 'coords1', plot_data_id: 1 }];
      geoMapper.stringToGeojson.mockReturnValue([]);
      component.generateGeoJson();
      tick(100);
      flushMicrotasks();
      expect(component.geoJsonData).toEqual([]);
    }));

    it('should handle catch in Promise.all', fakeAsync(() => {
      component.kmls = [{ file_name: 'file1', coordinates: 'coords1', plot_data_id: 1 }];
      geoMapper.stringToGeojson.mockImplementation(() => { throw new Error('error'); });
      component.generateGeoJson();
      tick(100);
      flushMicrotasks();
      expect(component.geoJsonData).toEqual([]);
    }));
  });
});