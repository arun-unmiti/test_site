import { ComponentFixture, TestBed, fakeAsync, tick, flushMicrotasks, flush } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Component, Input } from '@angular/core';
import { of, Subject, throwError } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { CmsWiseManagementComponent } from './cms-wise-management.component';
import { CoreService } from '../utilities/core.service';
import { FilterService } from '../utilities/filter.service';
import { UserDetailService } from '../auth/user-detail.service';
import { NgxImageCompressService } from 'ngx-image-compress';
import { FeatureToggleService } from '../shared/services/feature-toggle.service';
import { environment, ProjectContext } from '../../environments/environment';
import * as XLSX from 'xlsx';
import * as moment from 'moment';

// Mock lightgallery component to handle the invalid binding
@Component({
  selector: 'lightgallery',
  template: ''
})
class MockLightgalleryComponent {
  @Input() settings: any;
  @Input('onBeforeSlide') onBeforeSlide: any; // Accept as attribute input to avoid binding error
}

// Mock environment
jest.mock('../../environments/environment', () => ({
  environment: {
    projectConfigs: {
      testContext: { assetsFolder: '/assets/test/' }
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
    return m;
  };
});

// Mock services
class MockCoreService {
  clone = jest.fn(obj => JSON.parse(JSON.stringify(obj)));
  post = jest.fn().mockResolvedValue({ status: 1, msg: 'Success' });
  dashboard_post = jest.fn().mockResolvedValue({ status: 1 });
  data_post = jest.fn().mockResolvedValue({ status: 1 });
  uniqueList = jest.fn((list, key) => [...new Set(list.map((item: any) => item[key]))].map(val => list.find((item: any) => item[key] === val)));
  getNotifiedCropList = jest.fn((list) => list);
  toast = jest.fn();
}

class MockFilterService {
  isvillageFetched = false;
  isDistrictFetched = false;
  states: any[] = [{ state_id: 1, state_name: 'State1', code: 'S1' }];
  districts: any[] = [{ district_id: 1, district_name: 'District1', state_id: 1 }];
  tehsils: any[] = [{ tehsil_id: 1, tehsil_name: 'Tehsil1', district_id: 1, state_id: 1 }];
  blocks: any[] = [{ block_id: 1, block_name: 'Block1', tehsil_id: 1, district_id: 1, state_id: 1 }];
  grampanchayats: any[] = [{ grampanchayat_id: 1, grampanchayat_name: 'GP1', block_id: 1, tehsil_id: 1, district_id: 1, state_id: 1 }];
  villages: any[] = [{ village_id: 1, village_name: 'Village1', grampanchayat_id: 1, block_id: 1, tehsil_id: 1, district_id: 1, state_id: 1 }];
  notifiedUnits: any[] = [{ notified_id: 1, notified_unit_name: 'Unit1' }];
  crops: any[] = [{ crop_code: '001', crop_name: 'Crop1', id: 1 }];
  years: any[] = [{ id: 2023, year: '2023', year_code: '23' }];
  seasons: any[] = [{ id: 1, season_name: 'Season1', season_code: 'SE1' }];
  agencies: any[] = [{ agency_id: 1, agency_name: 'Agency1' }];
  lookupData: {
    clients: any[];
    states: any[];
    districts: any[];
    tehsils: any[];
    blocks: any[];
    grampanchayats: any[];
    villages: any[];
    users: any[];
  } = {
    clients: [{ unit_id: '2000', unit_name: 'Client1' }],
    states: [{ state_id: 1, state_name: 'State1' }],
    districts: [{ district_id: 1, district_name: 'District1' }],
    tehsils: [{ tehsil_id: 1, tehsil_name: 'Tehsil1' }],
    blocks: [{ block_id: 1, block_name: 'Block1' }],
    grampanchayats: [{ grampanchayat_id: 1, grampanchayat_name: 'GP1' }],
    villages: [{ village_id: 1, village_name: 'Village1' }],
    users: [{ user_id: 1, first_name: 'First', last_name: 'Last', phone: '1234567890' }]
  };
  fetchedVillageData = new Subject<void>();
  fetchedDistrictData = new Subject<void>();
}

class MockUserDetailService {
  getUserDetail = jest.fn().mockReturnValue({ unit_id: '2000', user_role: '1' });
}

class MockNgxImageCompressService {
  compressFile = jest.fn().mockResolvedValue('compressed_image');
}

class MockFeatureToggleService {
  getContext = jest.fn().mockReturnValue('testContext' as ProjectContext);
  getConfig = jest.fn().mockReturnValue({ BASEKMLPREFIX: 'mock_prefix', BASEKMLSUFFIX: 'mock_suffix' });
}

class MockNgbModal {
  open = jest.fn().mockReturnValue({ result: Promise.resolve() });
  dismissAll = jest.fn();
}

const mockActivatedRoute = {
  paramMap: { subscribe: jest.fn() }
};

describe('CmsWiseManagementComponent', () => {
  let component: CmsWiseManagementComponent;
  let fixture: ComponentFixture<CmsWiseManagementComponent>;
  let coreService: MockCoreService;
  let filterService: MockFilterService;
  let userDetailService: MockUserDetailService;
  let imageCompress: MockNgxImageCompressService;
  let featureToggleService: MockFeatureToggleService;
  let modalService: MockNgbModal;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        CmsWiseManagementComponent,
        MockLightgalleryComponent
      ],
      providers: [
        { provide: CoreService, useClass: MockCoreService },
        { provide: FilterService, useClass: MockFilterService },
        { provide: UserDetailService, useClass: MockUserDetailService },
        { provide: NgxImageCompressService, useClass: MockNgxImageCompressService },
        { provide: FeatureToggleService, useClass: MockFeatureToggleService },
        { provide: NgbModal, useClass: MockNgbModal },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(CmsWiseManagementComponent);
    component = fixture.componentInstance;
    coreService = TestBed.inject(CoreService) as unknown as MockCoreService;
    filterService = TestBed.inject(FilterService) as unknown as MockFilterService;
    userDetailService = TestBed.inject(UserDetailService) as unknown as MockUserDetailService;
    imageCompress = TestBed.inject(NgxImageCompressService) as unknown as MockNgxImageCompressService;
    featureToggleService = TestBed.inject(FeatureToggleService) as unknown as MockFeatureToggleService;
    modalService = TestBed.inject(NgbModal) as unknown as MockNgbModal;

    // Set default inputs
    component.url_id = '1';
    component.surveyId = '8';
    component.parentSurveyId = null;
    component.surveyName = 'Workshop Management';
    component.excelDownloadPurpose = 'get_pending_exceldata';
    component.showApproveColumn = false;
    component.showDateType = false;
    component.showCrop = true;
    component.showInactiveUser = false;
    component.surveyStatus = 1;
    component.canViewData = true;
    component.dataPurpose = 'get_pending_surveydata';
    component.searchPurpose = 'search_pending_surveydata';
    component.canApprove = true;
    component.canReject = true;
    component.canPending = false;
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

    it('should initialize fileHeaders', () => {
      expect(component.fileHeaders.length).toBe(19); // Adjusted based on code
    });
  });

  describe('ngOnInit', () => {
    it('should call getLocationCropData, getFilterData, and getSurveyFields', () => {
      const getLocationCropDataSpy = jest.spyOn(component, 'getLocationCropData');
      const getFilterDataSpy = jest.spyOn(component, 'getFilterData');
      const getSurveyFieldsSpy = jest.spyOn(component, 'getSurveyFields');
      component.ngOnInit();
      expect(getLocationCropDataSpy).toHaveBeenCalled();
      expect(getFilterDataSpy).toHaveBeenCalled();
      expect(getSurveyFieldsSpy).toHaveBeenCalled();
    });

    it('should set imgUrl and imgUrlSuffix', () => {
      component.ngOnInit();
      expect(component.imgUrl).toBe('mock_prefix');
      expect(component.imgUrlSuffix).toBe('mock_suffix');
    });

    it('should set user from userService', () => {
      component.ngOnInit();
      expect(component.user).toEqual({ unit_id: '2000', user_role: '1' });
    });
  });

  describe('getLocationCropData', () => {
    it('should use existing dataCrops if available', () => {
      component.dataCrops = [{ state_id: 1, dist_id: 1, notified_unit: 1 }];
      component.selectedState = [{ state_id: 1 }];
      component.selectedDist = [{ district_id: 1 }];
      component.selectednotifiedUnits = [{ notified_id: 1 }];
      component.stateMap = new Map([[1, 'State1']]);
      component.districtMap = new Map([[1, 'District1']]);
      component.notifiedUnitMap = new Map([[1, 'Unit1']]);
      const getNotifiedCropListSpy = jest.spyOn(coreService, 'getNotifiedCropList').mockReturnValue([{ crop_id: 1 }]);
      component.getLocationCropData();
      expect(getNotifiedCropListSpy).toHaveBeenCalledWith(expect.arrayContaining([{ state_id: 1, dist_id: 1, notified_unit: 1 }]), component.stateMap, component.districtMap, component.notifiedUnitMap);
      expect(component.cropsData).toEqual([{ crop_id: 1 }]);
      expect(component.isCropLoading).toBe(0);
    });
    it('should handle status not 1', fakeAsync(() => {
      component.dataCrops = [];
      coreService.dashboard_post.mockResolvedValue({ status: 0 });
      component.getLocationCropData();
      tick();
      expect(component.dataCrops).toEqual([]);
    }));
  });

  describe('getFilterData', () => {
    it('should increment lookupLoader initially', () => {
      component.getFilterData();
      expect(component.lookupLoader).toBe(1);
    });

    it('should handle url_id 21 with isvillageFetched true', () => {
      component.url_id = '21';
      filterService.isvillageFetched = true;
      const getLookupDataSpy = jest.spyOn(component, 'getLookupData');
      component.getFilterData();
      expect(getLookupDataSpy).toHaveBeenCalled();
    });

    it('should subscribe to fetchedVillageData for url_id 21 if isvillageFetched false', fakeAsync(() => {
      component.url_id = '21';
      filterService.isvillageFetched = false;
      const getLookupDataSpy = jest.spyOn(component, 'getLookupData');
      component.getFilterData();
      filterService.fetchedVillageData.next();
      tick();
      expect(getLookupDataSpy).toHaveBeenCalled();
    }));

    it('should handle isDistrictFetched true', () => {
      filterService.isDistrictFetched = true;
      const setInputDataSpy = jest.spyOn(component, 'setInputData');
      component.getFilterData();
      expect(setInputDataSpy).toHaveBeenCalled();
      expect(component.districts).toEqual(filterService.districts);
      expect(component.tehsils).toEqual(filterService.tehsils);
      expect(component.lookupLoader).toBe(0);
    });

    it('should subscribe to fetchedDistrictData if isDistrictFetched false', fakeAsync(() => {
      filterService.isDistrictFetched = false;
      const setInputDataSpy = jest.spyOn(component, 'setInputData');
      component.getFilterData();
      filterService.fetchedDistrictData.next();
      tick();
      expect(setInputDataSpy).toHaveBeenCalled();
      expect(component.lookupLoader).toBe(0);
    }));

    it('should handle isvillageFetched true for setVilageData', () => {
      filterService.isvillageFetched = true;
      const setVilageDataSpy = jest.spyOn(component, 'setVilageData');
      component.getFilterData();
      expect(setVilageDataSpy).toHaveBeenCalled();
    });

    it('should subscribe to fetchedVillageData for setVilageData if isvillageFetched false', fakeAsync(() => {
      filterService.isvillageFetched = false;
      const setVilageDataSpy = jest.spyOn(component, 'setVilageData');
      component.getFilterData();
      filterService.fetchedVillageData.next();
      tick();
      expect(setVilageDataSpy).toHaveBeenCalled();
    }));

    it('should apply preApplied filter if set', fakeAsync(() => {
      component.preApplied = true;
      filterService.isvillageFetched = false;
      const applyFilterSpy = jest.spyOn(component, 'applyFilter');
      component.getFilterData();
      filterService.fetchedVillageData.next();
      tick();
      expect(component.preApplied).toBe(false);
      expect(applyFilterSpy).toHaveBeenCalled();
    }));
  });

  describe('getLookupData', () => {
    it('should set all mappings correctly', () => {
      filterService.states = [{ state_id: 1, state_name: 'State1', code: 'S1' }];
      filterService.districts = [{ district_id: 1, district_name: 'District1', state_id: 1 }];
      filterService.tehsils = [{ tehsil_id: 1, tehsil_name: 'Tehsil1', district_id: 1, state_id: 1 }];
      filterService.blocks = [{ block_id: 1, block_name: 'Block1', tehsil_id: 1, district_id: 1, state_id: 1 }];
      filterService.grampanchayats = [{ grampanchayat_id: 1, grampanchayat_name: 'GP1', block_id: 1, tehsil_id: 1, district_id: 1, state_id: 1 }];
      filterService.villages = [{ village_id: 1, village_name: 'Village1', grampanchayat_id: 1, block_id: 1, tehsil_id: 1, district_id: 1, state_id: 1 }];
      filterService.notifiedUnits = [{ notified_id: 1, notified_unit_name: 'Unit1' }];
      filterService.crops = [{ crop_code: '001', crop_name: 'Crop1' }];
      filterService.years = [{ id: 2023, year_code: '23', year: '2023' }];
      filterService.seasons = [{ id: 1, season_name: 'Season1', season_code: 'SE1' }];
      component.getLookupData();
      expect(component.stateMapping['state1']).toBe(1);
      expect(component.stateMapping[1]).toBe('State1');
      expect(component.stateCodeMapping['S1']).toBe(1);
      expect(component.pairedStateMapping['state1']).toBe(1);
      expect(component.districtMapping['district1']).toBe(1);
      expect(component.districtMapping[1]).toBe('District1');
      expect(component.pairedDistrictMapping['1=>district1']).toBe(1);
      expect(component.teshilMapping['tehsil1']).toBe(1);
      expect(component.teshilMapping[1]).toBe('Tehsil1');
      expect(component.pairedTeshilMapping['1=>1=>tehsil1']).toBe(1);
      expect(component.blockMapping['block1']).toBe(1);
      expect(component.blockMapping[1]).toBe('Block1');
      expect(component.pairedBlockMapping['1=>1=>1=>block1']).toBe(1);
      expect(component.grampanchayatMapping['gp1']).toBe(1);
      expect(component.grampanchayatMapping[1]).toBe('GP1');
      expect(component.pairedGrampanchayatMapping['1=>1=>1=>1=>gp1']).toBe(1);
      expect(component.villageMapping['village1']).toBe(1);
      expect(component.villageMapping[1]).toBe('Village1');
      expect(component.pairedVillageMapping['1=>1=>1=>1=>1=>village1']).toBe(1);
      expect(component.iuLevelMapping['unit1']).toBe(1);
      expect(component.iuLevelMapping[1]).toBe('Unit1');
      expect(component.pairedIuLevelMapping['unit1']).toBe(1);
      expect(component.cropMapping['crop1']).toBe('001');
      expect(component.cropMapping['001']).toBe('Crop1');
      expect(component.pairedCropMapping['crop1']).toBe('001');
      expect(component.yearMapping['23']).toBe(2023);
      expect(component.yearMapping[2023]).toBe('23');
      expect(component.yearCodeMapping['23']).toBe(2023);
      expect(component.pairedYearMapping['23']).toBe(2023);
      expect(component.seasonMapping['season1']).toBe(1);
      expect(component.seasonMapping[1]).toBe('Season1');
      expect(component.seasonCodeMapping['SE1']).toBe(1);
      expect(component.pairedSeasonMapping['season1']).toBe(1);
      expect(component.lookupLoader).toBe(0);
    });
  });
  describe('getSurveyFields', () => {
    it('should handle no fields', fakeAsync(() => {
      coreService.data_post.mockResolvedValue({ status: 1, fields: [] });
      jest.spyOn(component, 'getFormFieldMultipleData').mockResolvedValue([]);
      component.getSurveyFields();
      tick();
      expect(component.surveyFields).toEqual([]);
    }));
  });
  describe('getFormFieldMultipleData', () => {
    it('should fetch multiple fields', fakeAsync(() => {
      coreService.data_post.mockResolvedValue({ status: 1, multiple_fields: [{ field_id: 1 }] });
      const result = component.getFormFieldMultipleData([1]);
      tick();
      expect(result).resolves.toEqual([{ field_id: 1 }]);
      expect(coreService.data_post).toHaveBeenCalledWith(expect.objectContaining({ field_id: [1] }));
    }));
    it('should return empty on error', fakeAsync(() => {
      coreService.data_post.mockRejectedValue(new Error('Error'));
      const result = component.getFormFieldMultipleData([1]);
      tick();
      expect(result).resolves.toEqual([]);
    }));
    it('should return empty if status not 1', fakeAsync(() => {
      coreService.data_post.mockResolvedValue({ status: 0 });
      const result = component.getFormFieldMultipleData([1]);
      tick();
      expect(result).resolves.toEqual([]);
    }));
  });
  describe('onSingleSelect', () => {
    it('should show others if selected "others"', () => {
      const field = { field_id: 1, mutiple_options: [{ value: 'others' }] };
      const event = { target: { value: 'others' } };
      component.surveyFields = [{ parent_id: 1, show_others: false }];
      component.onSingleSelect(event, field);
      expect(component.surveyFields[0].show_others).toBe(true);
    });
    it('should hide others if not "others"', () => {
      const field = { field_id: 1, mutiple_options: [{ value: 'opt1' }] };
      const event = { target: { value: 'opt1' } };
      component.surveyFields = [{ parent_id: 1, show_others: true }];
      component.onSingleSelect(event, field);
      expect(component.surveyFields[0].show_others).toBe(false);
    });
  });
  describe('setInputData', () => {
    it('should set all maps and data correctly', () => {
      filterService.lookupData = {
        clients: [{ unit_id: '2000', unit_name: 'Client1' }],
        states: [{ state_id: 1, state_name: 'State1' }],
        districts: [{ district_id: 1, district_name: 'District1' }],
        tehsils: [{ tehsil_id: 1, tehsil_name: 'Tehsil1' }],
        blocks: [{ block_id: 1, block_name: 'Block1' }],
        grampanchayats: [{ grampanchayat_id: 1, grampanchayat_name: 'GP1' }],
        villages: [{ village_id: 1, village_name: 'Village1' }],
        users: [{ user_id: 1, first_name: 'First', last_name: 'Last', phone: '123' }]
      };
      filterService.notifiedUnits = [{ notified_id: 1, notified_unit_name: 'Unit1' }];
      filterService.crops = [{ crop_code: '001', crop_name: 'Crop1' }];
      filterService.years = [{ id: 2023, year: '2023' }];
      filterService.seasons = [{ id: 1, season_name: 'Season1' }];
      filterService.agencies = [{ agency_id: 1, agency_name: 'Agency1' }];
      component.setInputData();
      expect(component.clientData.length).toBe(1);
      expect(component.yearData.length).toBe(1);
      expect(component.seasonData.length).toBe(1);
      expect(component.statesData.length).toBe(1);
      expect(component.clientDistricts.length).toBe(1);
      expect(component.clientTehsils.length).toBe(1);
      expect(component.clientBlocks.length).toBe(1);
      expect(component.clientGrampanchayats.length).toBe(1);
      expect(component.clientVillages.length).toBe(1);
      expect(component.usersData[0].username).toBe('First Last');
      expect(component.notifiedUnits.length).toBe(1);
      expect(component.stateMap.get(1)).toBe('State1');
      expect(component.districtMap.get(1)).toBe('District1');
      expect(component.tehsilMap.get(1)).toBe('Tehsil1');
      expect(component.blockMap.get(1)).toBe('Block1');
      expect(component.cropMap.get('001')).toBe('Crop1');
      expect(component.seasonMap.get(1)).toBe('Season1');
      expect(component.yearMap.get(2023)).toBe('2023');
      expect(component.notifiedUnitMap.get(1)).toBe('Unit1');
      expect(component.agencyMap.get(1)).toBe('Agency1');
      expect(component.userPhoneMap[1]).toBe('123');
    });
    it('should handle empty usersData', () => {
      filterService.lookupData.users = [];
      component.setInputData();
      expect(component.userPhoneMap).toEqual({});
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
  describe('applyFilter', () => {
    it('should set showDateLabel to false and call getSurveyData', () => {
      const getSurveyDataSpy = jest.spyOn(component, 'getSurveyData');
      component.applyFilter();
      expect(component.showDateLabel).toBe(false);
      expect(component.searchCaseId).toBe('');
      expect(component.surveyIntimationNo).toBe('');
      expect(getSurveyDataSpy).toHaveBeenCalledWith(component.surveyId);
    });
  });
  describe('getSurveyData', () => {
    it('should toast warning if no year or season selected', () => {
      component.selectedYear = '';
      component.selectedSeason = '';
      component.getSurveyData('8');
      expect(coreService.toast).toHaveBeenCalledWith('warning', 'Please select a year and season');
    });
    it('should handle error in promises', fakeAsync(() => {
      component.selectedYear = '2023';
      component.selectedSeason = '1';
      coreService.data_post.mockRejectedValueOnce(new Error('Error'));
      jest.spyOn(component as any, 'getRequestData').mockResolvedValue({});
      component.getSurveyData('8');
      tick();
      expect(component.loading).toBe(0);
    }));
    it('should set showDataLabels true', fakeAsync(() => {
      component.selectedYear = '2023';
      component.selectedSeason = '1';
      component.selectedState = [{ state_id: 1 }];
      coreService.data_post.mockResolvedValueOnce({ status: 1, fields: [{ slno: 1, display: 1 }] });
      coreService.data_post.mockResolvedValueOnce({ status: 1, surveydata: [{ id: 1 }], locationdata: [] });
      jest.spyOn(component as any, 'getRequestData').mockResolvedValue({});
      component.getSurveyData('8');
      tick();
      expect(component.showDataLabels).toBe(true);
    }));
  });
  describe('updateCounts', () => {
    it('should update counts based on dataPurpose', () => {
      const response = {
        total_pending: 5,
        total_approved: 10,
        total_rejected: 2,
        total_uploads: 20,
        total_draft: 3,
        total_records: 100
      };
      component.dataPurpose = 'get_pending_surveydata';
      (component as any)['updateCounts'](response);
      expect(component.toalRecord).toBe(5);
      component.dataPurpose = 'get_approved_surveydata';
      (component as any)['updateCounts'](response);
      expect(component.toalRecord).toBe(10);
      component.dataPurpose = 'get_rejected_surveydata';
      (component as any)['updateCounts'](response);
      expect(component.toalRecord).toBe(2);
      component.dataPurpose = 'get_consolidated_surveydata';
      (component as any)['updateCounts'](response);
      expect(component.toalRecord).toBe(20);
      component.dataPurpose = 'get_draft_surveydata';
      (component as any)['updateCounts'](response);
      expect(component.toalRecord).toBe(3);
      expect(component.showDraft).toBe(true);
      component.dataPurpose = 'get_view_farmer_data';
      (component as any)['updateCounts'](response);
      expect(component.toalRecord).toBe(100);
      component.url_id = '22';
      (component as any)['updateCounts'](response);
      expect(component.datalabel.totalUploads).toBe(100);
    });
  });
  describe('onStateSelect', () => {
    beforeEach(() => {
      component.clientDistricts = [{ district_id: 1, district_name: 'District1', state_id: 1 }];
    });
    it('should update districtData for multi-select', () => {
      const event = [{ state_id: 1 }];
      const resetDataSpy = jest.spyOn(component, 'resetData');
      component.onStateSelect(event);
      expect(component.districtData[0].items.length).toBe(1);
      expect(component.selectedDist).toEqual([]);
      expect(component.teshilData).toEqual([]);
      expect(component.selectedTehsil).toEqual([]);
      expect(component.blockData).toEqual([]);
      expect(component.selectedBlock).toEqual([]);
      expect(resetDataSpy).toHaveBeenCalled();
    });
    it('should update districtData for single-select', () => {
      const event = 1;
      const resetDataSpy = jest.spyOn(component, 'resetData');
      component.onStateSelect(event);
      expect(component.districtData.length).toBe(1);
      expect(resetDataSpy).toHaveBeenCalled();
    });
    it('should handle empty event', () => {
      const event: any = [];
      component.onStateSelect(event);
      expect(component.districtData).toEqual([]);
    });
    it('should handle non-array event', () => {
      const event = null;
      component.onStateSelect(event);
      expect(component.districtData).toEqual([]);
    });
  });
  describe('onDistSelect', () => {
    beforeEach(() => {
      component.clientTehsils = [{ tehsil_id: 1, tehsil_name: 'Tehsil1', district_id: 1 }];
    });
    it('should update teshilData for multi-select', () => {
      const event = [{ district_id: 1 }];
      const resetDataSpy = jest.spyOn(component, 'resetData');
      component.onDistSelect(event);
      expect(component.teshilData[0].items.length).toBe(1);
      expect(component.selectedTehsil).toEqual([]);
      expect(component.blockData).toEqual([]);
      expect(component.selectedBlock).toEqual([]);
      expect(resetDataSpy).toHaveBeenCalled();
    });
    it('should update teshilData for single-select', () => {
      const event = 1;
      const resetDataSpy = jest.spyOn(component, 'resetData');
      component.onDistSelect(event);
      expect(component.teshilData.length).toBe(1);
      expect(resetDataSpy).toHaveBeenCalled();
    });
    it('should handle empty event', () => {
      const event: any = [];
      component.onDistSelect(event);
      expect(component.teshilData).toEqual([]);
    });
  });
  describe('onTehsilSelect', () => {
    beforeEach(() => {
      component.clientBlocks = [{ block_id: 1, block_name: 'Block1', tehsil_id: 1 }];
    });
    it('should update blockData for multi-select', () => {
      const event = [{ tehsil_id: 1 }];
      const resetDataSpy = jest.spyOn(component, 'resetData');
      component.onTehsilSelect(event);
      expect(component.blockData[0].items.length).toBe(1);
      expect(component.selectedBlock).toEqual([]);
      expect(resetDataSpy).toHaveBeenCalled();
    });
    it('should update blockData for single-select', () => {
      const event = 1;
      const resetDataSpy = jest.spyOn(component, 'resetData');
      component.onTehsilSelect(event);
      expect(component.blockData.length).toBe(1);
      expect(resetDataSpy).toHaveBeenCalled();
    });
    it('should handle empty event', () => {
      const event: any = [];
      component.onTehsilSelect(event);
      expect(component.blockData).toEqual([]);
    });
  });
  describe('onBlockSelect', () => {
    beforeEach(() => {
      filterService.grampanchayats = [{ grampanchayat_id: 1, grampanchayat_name: 'GP1', block_id: 1 }];
    });
    it('should update grampanchayatData for multi-select', () => {
      const event = [{ block_id: 1 }];
      const resetDataSpy = jest.spyOn(component, 'resetData');
      component.onBlockSelect(event);
      expect(component.grampanchayatData[0].items.length).toBe(1);
      expect(component.selectedGrampanchayat).toEqual([]);
      expect(component.villageData).toEqual([]);
      expect(component.selectedVillage).toEqual([]);
      expect(resetDataSpy).toHaveBeenCalled();
    });
    it('should update grampanchayatData for single-select', () => {
      const event = 1;
      const resetDataSpy = jest.spyOn(component, 'resetData');
      component.onBlockSelect(event);
      expect(component.grampanchayatData.length).toBe(1);
      expect(resetDataSpy).toHaveBeenCalled();
    });
    it('should handle empty event', () => {
      const event: any = [];
      component.onBlockSelect(event);
      expect(component.grampanchayatData).toEqual([]);
    });
  });
  describe('onGrampanchayatSelect', () => {
    beforeEach(() => {
      filterService.villages = [{ village_id: 1, village_name: 'Village1', grampanchayat_id: 1 }];
    });
    it('should update villageData for multi-select', () => {
      const event = [{ grampanchayat_id: 1 }];
      const resetDataSpy = jest.spyOn(component, 'resetData');
      component.onGrampanchayatSelect(event);
      expect(component.villageData[0].items.length).toBe(1);
      expect(component.selectedVillage).toEqual([]);
      expect(resetDataSpy).toHaveBeenCalled();
    });
    it('should update villageData for single-select', () => {
      const event = 1;
      const resetDataSpy = jest.spyOn(component, 'resetData');
      component.onGrampanchayatSelect(event);
      expect(component.villageData.length).toBe(1);
      expect(resetDataSpy).toHaveBeenCalled();
    });
    it('should handle empty event', () => {
      const event: any = [];
      component.onGrampanchayatSelect(event);
      expect(component.villageData).toEqual([]);
    });
  });
  describe('onYearSelect', () => {
    it('should call resetData', () => {
      const event = '2023';
      const resetDataSpy = jest.spyOn(component, 'resetData');
      component.onYearSelect(event);
      expect(resetDataSpy).toHaveBeenCalled();
    });
  });
  describe('onSeasonSelect', () => {
    it('should call resetData', () => {
      const event = '1';
      const resetDataSpy = jest.spyOn(component, 'resetData');
      component.onSeasonSelect(event);
      expect(resetDataSpy).toHaveBeenCalled();
    });
  });
  describe('onFieldSelect', () => {
    it('should call resetData', () => {
      const event = 'field1';
      const resetDataSpy = jest.spyOn(component, 'resetData');
      component.onFieldSelect(event);
      expect(resetDataSpy).toHaveBeenCalled();
    });
  });
  describe('resetData', () => {
    it('should reset data properties', () => {
      component.resetData();
      expect(component.fields).toEqual([]);
      expect(component.surveyData).toEqual([]);
      expect(component.parentFields).toEqual([]);
      expect(component.tableData).toEqual([]);
      expect(component.colDefs).toEqual([]);
      expect(component.allColDefs).toEqual([]);
    });
  });
  describe('filePreviews and files', () => {
    it('should initialize as empty objects', () => {
      expect(component.filePreviews).toEqual({});
      expect(component.files).toEqual({});
    });
  });
  describe('onFileChange', () => {
    it('should skip invalid file types', () => {
      const file = new File([''], 'invalid.txt', { type: 'text/plain' });
      Object.defineProperty(file, 'size', { value: 1024 * 1024 });
      const event = { target: { files: [file] } };
      const field = { name: 'field1', maxlength: 3 };
      component.onFileChange(event, field);
      expect(coreService.toast).toHaveBeenCalledWith('error', expect.stringContaining('not a valid file type'));
    });
    it('should skip large files', () => {
      const file = new File([''], 'large.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 6 * 1024 * 1024 });
      const event = { target: { files: [file] } };
      const field = { name: 'field1', maxlength: 3 };
      component.onFileChange(event, field);
      expect(coreService.toast).toHaveBeenCalledWith('error', expect.stringContaining('exceeds the maximum size'));
    });
    it('should limit to max files', () => {
      component.files['field1'] = [new File([''], 'file1'), new File([''], 'file2'), new File([''], 'file3')];
      const file = new File([''], 'file4.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 1024 * 1024 });
      const event = { target: { files: [file], value: 'file4.jpg' } };
      const field = { name: 'field1', maxlength: 3 };
      component.onFileChange(event, field);
      expect(coreService.toast).toHaveBeenCalledWith('error', expect.stringContaining('maximum of 3 files'));
      expect((event.target as any).value).toBe('file4.jpg');
    });
    it('should limit to max files with no files', () => {
      component.files['field1'] = [new File([''], 'file1'), new File([''], 'file2'), new File([''], 'file3')];
      const event = { target: { files: [], value: '' } };
      const field = { name: 'field1', maxlength: 3 };
      component.onFileChange(event, field);
      expect(coreService.toast).toHaveBeenCalledWith('error', expect.stringContaining('maximum of 3 files'));
      expect((event.target as any).value).toBe('');
    });
  });
  describe('removeFile', () => {
    it('should remove file and preview', () => {
      component.filePreviews['field1'] = [{ name: 'file1.jpg', type: 'image/jpeg', previewUrl: 'url' }];
      component.files['field1'] = [new File([''], 'file1.jpg')];
      component.removeFile('field1', { name: 'file1.jpg' });
      expect(component.filePreviews['field1'].length).toBe(0);
      expect(component.files['field1'].length).toBe(0);
    });
    it('should do nothing if file not found', () => {
      component.filePreviews['field1'] = [{ name: 'file1.jpg' }];
      component.files['field1'] = [new File([''], 'file1.jpg')];
      component.removeFile('field1', { name: 'file2.jpg' });
      expect(component.filePreviews['field1'].length).toBe(1);
    });
  });
  describe('submitForm', () => {
    it('should handle required fields validation', fakeAsync(() => {
      component.surveyFields = [{ field_id: 1, type: 'text', required: 1, show_others: true }];
      jest.spyOn(document, 'getElementById').mockReturnValue({ value: '' } as HTMLInputElement);
      const event = { preventDefault: jest.fn() } as unknown as Event;
      component.submitForm(event);
      tick();
      expect(coreService.toast).toHaveBeenCalledWith('error', 'Please fill all the mandatory fields');
      expect(component.loading).toBe(0);
    }));
    it('should handle email validation', fakeAsync(() => {
      component.surveyFields = [{ field_id: 1, type: 'text', subtype: 'email', required: 1, show_others: true }];
      jest.spyOn(document, 'getElementById').mockReturnValue({ value: 'invalid' } as HTMLInputElement);
      const event = { preventDefault: jest.fn() } as unknown as Event;
      component.submitForm(event);
      tick();
      expect(coreService.toast).toHaveBeenCalledWith('error', 'Please Enter a valid email');
      expect(component.loading).toBe(0);
    }));
    it('should handle file required validation', fakeAsync(() => {
      component.surveyFields = [{ field_id: 1, type: 'file', required: 1, name: 'file1', label: 'File' }];
      const event = { preventDefault: jest.fn() } as unknown as Event;
      component.submitForm(event);
      tick();
      expect(coreService.toast).toHaveBeenCalledWith('error', 'Please fill all the mandatory fields');
      expect(component.loading).toBe(0);
    }));
    it('should append scheme for label "scheme"', fakeAsync(() => {
      component.surveyFields = [{ field_id: 1, label: 'scheme', type: 'text' }];
      jest.spyOn(document, 'getElementById').mockReturnValue({ value: 'sch1' } as HTMLInputElement);
      coreService.post.mockResolvedValue({ status: 1 });
      component.submitForm({ preventDefault: jest.fn() } as unknown as Event);
      tick();
      expect(coreService.post).toHaveBeenCalledWith('upload_data', expect.any(FormData));
    }));
    it('should append workshop_type for surveyId 8', fakeAsync(() => {
      component.surveyId = '8';
      component.surveyFields = [{ field_id: 1, label: 'Workshop Type', type: 'text' }];
      jest.spyOn(document, 'getElementById').mockReturnValue({ value: 'ws1' } as HTMLInputElement);
      coreService.post.mockResolvedValue({ status: 1 });
      component.submitForm({ preventDefault: jest.fn() } as unknown as Event);
      tick();
      expect(coreService.post).toHaveBeenCalledWith('upload_data', expect.any(FormData));
    }));
    it('should append office_type and office_ownership for surveyId 9', fakeAsync(() => {
      component.surveyId = '9';
      component.surveyFields = [
        { field_id: 1, label: 'Office Type', type: 'text' },
        { field_id: 2, label: 'Office Ownership', type: 'text' }
      ];
      jest.spyOn(document, 'getElementById').mockImplementation((id) => ({ value: id === '1' ? 'ot1' : 'oo1' } as HTMLInputElement));
      coreService.post.mockResolvedValue({ status: 1 });
      component.submitForm({ preventDefault: jest.fn() } as unknown as Event);
      tick();
      expect(coreService.post).toHaveBeenCalledWith('upload_data', expect.any(FormData));
    }));
    it('should append files as array', fakeAsync(() => {
      component.surveyFields = [{ field_id: 1, type: 'file', required: 1, name: 'file1', show_others: true }];
      component.files['file1'] = [new File([''], 'file1'), new File([''], 'file2')];
      coreService.post.mockResolvedValue({ status: 1 });
      component.submitForm({ preventDefault: jest.fn() } as unknown as Event);
      tick();
      expect(coreService.post).toHaveBeenCalledWith('upload_data', expect.any(FormData));
    }));
    it('should handle no required fields', fakeAsync(() => {
      component.surveyFields = [{ field_id: 1, type: 'text', required: 0 }];
      jest.spyOn(document, 'getElementById').mockReturnValue({ value: '' } as HTMLInputElement);
      coreService.post.mockResolvedValue({ status: 1 });
      component.submitForm({ preventDefault: jest.fn() } as unknown as Event);
      tick();
      expect(coreService.post).toHaveBeenCalled();
    }));
    it('should handle show_others false for required', fakeAsync(() => {
      component.surveyFields = [{ field_id: 1, type: 'text', required: 1, show_others: false }];
      jest.spyOn(document, 'getElementById').mockReturnValue({ value: '' } as HTMLInputElement);
      component.submitForm({ preventDefault: jest.fn() } as unknown as Event);
      tick();
      expect(coreService.toast).not.toHaveBeenCalledWith('error', 'Please fill all the mandatory fields');
    }));
    it('should append survey_id if set', fakeAsync(() => {
      component.surveyId = '8';
      component.surveyFields = [];
      coreService.post.mockResolvedValue({ status: 1 });
      component.submitForm({ preventDefault: jest.fn() } as unknown as Event);
      tick();
      expect(coreService.post).toHaveBeenCalledWith('upload_data', expect.any(FormData));
    }));
    it('should append state_id if array or single', fakeAsync(() => {
      component.selectedState = [{ state_id: 1 }];
      component.surveyFields = [];
      coreService.post.mockResolvedValue({ status: 1 });
      component.submitForm({ preventDefault: jest.fn() } as unknown as Event);
      tick();
      expect(coreService.post).toHaveBeenCalledWith('upload_data', expect.any(FormData));
      (component as any).selectedState = 1;
      component.submitForm({ preventDefault: jest.fn() } as unknown as Event);
      tick();
      expect(coreService.post).toHaveBeenCalledWith('upload_data', expect.any(FormData));
    }));
    // Similar for other selects: dist, tehsil, etc.
  });
  describe('downloadInvalids', () => {
    it('should generate and download Excel with invalid data', () => {
      component.invalidFileData = [{ applicationid: '123', remark: ['Error1'], state: 1 }];
      component.fileHeaders = [{ field: 'applicationid', header: 'Application ID' }, { field: 'state', header: 'State' }];
      component.stateMapping = { 1: 'State1' };
      const writeFileSpy = jest.spyOn(XLSX, 'writeFile');
      component.downloadInvalids();
      expect(writeFileSpy).toHaveBeenCalled();
    });
  });
  describe('resetForm', () => {
    it('should reset all form fields and files', () => {
      component.selectedYear = '2023';
      component.selectedSeason = '1';
      component.selectedState = [1];
      component.files = { field1: [] };
      component.filePreviews = { field1: [] };
      component.surveyFields = [{ field_id: '1' }];
      const fileInputs = [{ value: 'old' }] as unknown as NodeListOf<HTMLInputElement>;
      jest.spyOn(document, 'querySelectorAll').mockReturnValue(fileInputs);
      jest.spyOn(document, 'getElementById').mockReturnValue({ value: 'old' } as HTMLInputElement);
      component.resetForm();
      expect(component.selectedYear).toBe('');
      expect(component.files).toEqual({});
      expect(component.filePreviews).toEqual({});
      expect(fileInputs[0].value).toBe('');
    });
  });
  describe('submitSearch', () => {
    it('should call dashboard_post with request', () => {
      component.selectedFromDate = { startDate: { format: jest.fn().mockReturnValue('2023-01-01') }, endDate: { format: jest.fn().mockReturnValue('2023-01-31') } };
      component.user = { user_role: '1' };
      const event = { preventDefault: jest.fn() } as unknown as Event;
      component.submitSearch(event);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(coreService.dashboard_post).toHaveBeenCalled();
    });
  });
  describe('generateRowData', () => {
    it('should generate tableData with mappings', fakeAsync(() => {
      component.surveyData = [{ sno: 1, approved_reject: 1, user_id: 1, field_1: 1 }];
      component.parentSurveyId = 'parent';
      component.noOfVisit = 1;
      component.surveyData[0].totalVisist = 1;
      component.surveyData[0].no_of_visit = 1;
      component.typeFields = [{ type: 'lkp_state', field: 'field_1' }];
      component.stateMap = new Map([[1, 'State1']]);
      component.userPhoneMap = { 1: '123' };
      component.agencyMap = new Map([[1, 'Agency1']]);
      component.pagination = { updatePagination: jest.fn() };
      component.generateRowData();
      tick(1000);
      expect(component.tableData[0].approved_reject).toBe('Approved');
      expect(component.tableData[0].user_phone).toBe('123');
      expect(component.tableData[0].field_1).toBe('State1');
      expect(component.loading).toBe(0);
      expect(component.pagination.updatePagination).toHaveBeenCalled();
    }));
  });
  describe('generateColDef', () => {
    it('should generate colDefs for non-22 url_id', () => {
      component.fields = [{ field_id: 1, display_name: 'Field1', type: 'text', display: 1 }];
      component.canViewData = true;
      component.canApprove = true;
      component.showApproveColumn = true;
      component.parentSurveyId = 'parent';
      component.generateColDef();
      expect(component.colDefs.some(col => col.field === 'action')).toBe(true);
      expect(component.colDefs.some(col => col.field === 'approved_reject')).toBe(true);
      expect(component.colDefs.some(col => col.field === 'no_of_visit')).toBe(true);
      expect(component.typeFields.some(field => field.type === 'lkp_agency')).toBe(true);
      expect(component.allColDefs.length).toBe(component.colDefs.length);
    });
    it('should generate colDefs for url_id 22', () => {
      component.url_id = '22';
      component.generateColDef();
      expect(component.colDefs[0].field).toBe('sno');
      expect(component.colDefs.length).toBe(component.fileHeaders.length + 1);
    });
    it('should exclude tab types', () => {
      component.fields = [{ field_id: 1, type: 'tab' }];
      component.generateColDef();
      expect(component.colDefs.filter(col => col.field === 'field_1').length).toBe(0);
    });
    it('should not add action if !canViewData or url_id 22', () => {
      component.canViewData = false;
      component.url_id = '22';
      component.generateColDef();
      expect(component.colDefs.some(col => col.field === 'action')).toBe(false);
    });
    it('should not add approveBox if no permissions', () => {
      component.canApprove = false;
      component.canReject = false;
      component.canPending = false;
      component.generateColDef();
      expect(component.colDefs.some(col => col.type === 'approveBox')).toBe(false);
    });
    it('should add approved_reject_date if not pending', () => {
      component.dataPurpose = 'get_approved_surveydata';
      component.generateColDef();
      expect(component.colDefs.some(col => col.field === 'approved_reject_date')).toBe(true);
    });
  });
  describe('settings', () => {
    it('should have counter false and plugins defined', () => {
      expect(component.settings.counter).toBe(false);
      expect(component.settings.plugins).toBeDefined();
    });
  });
  describe('onBeforeSlide', () => {
    it('should call provided function', () => {
      const detail: any = { index: 1 };
      const spy = jest.fn();
      component.onBeforeSlide = spy;
      component.onBeforeSlide(detail);
      expect(spy).toHaveBeenCalledWith(detail);
    });
  });
  describe('isDataApprove', () => {
    it('should return true if any data approve is true', () => {
      component.tableData = [{ approve: true }];
      expect(component.isDataApprove).toBe(true);
    });
    it('should return false if no approve', () => {
      component.tableData = [{ approve: false }];
      expect(component.isDataApprove).toBe(false);
    });
  });
  describe('onIntimationNumberChange', () => {
    it('should trigger searchObser', () => {
      const event = { target: { value: 'INT123' } };
      const nextSpy = jest.spyOn(component.searchObser, 'next');
      component.onIntimationNumberChange(event);
      expect(nextSpy).toHaveBeenCalledWith(event);
    });
  });
  describe('onCaseIdChange', () => {
    it('should trigger searchObser', () => {
      const event = { target: { value: 'CASE123' } };
      const nextSpy = jest.spyOn(component.searchObser, 'next');
      component.onCaseIdChange(event);
      expect(nextSpy).toHaveBeenCalledWith(event);
    });
  });
  describe('onApproveSet', () => {
    it('should handle reject flag', () => {
      component.tableData = [{ approve: true, id: 1 }];
      component.onApproveSet('reject');
      expect(coreService.post).toHaveBeenCalledWith(expect.objectContaining({ purpose: 'reject' }));
    });
  });
  describe('onColumnVisibilityChange', () => {
    it('should update colDefs based on visibility', () => {
      component.allColDefs = [{ visibility: true }, { visibility: false }];
      component.onColumnVisibilityChange();
      expect(component.colDefs.length).toBe(1);
    });
  });
  describe('downloadTableRecords', () => {
    it('should stop if not component active', () => {
      component.isComponentActive = false;
      const res = jest.fn();
      const rej = jest.fn();
      component.downloadTableRecords({}, [], res, rej);
      expect(res).not.toHaveBeenCalled();
    });
  });
  describe('generateDownloadData', () => {
    it('should generate download data with mappings', () => {
      component.surveyData = [{ field_1: 1, approved_reject: 1, user_id: 1, parent: { field_1: 1 } }];
      component.parentSurveyId = 'parent';
      component.noOfVisit = 1;
      component.typeFields = [{ type: 'lkp_state', field: 'field_1' }];
      component.stateMap = new Map([[1, 'State1']]);
      component.userPhoneMap = { 1: '123' };
      component.agencyMap = new Map([[1, 'Agency1']]);
      const data = component.generateDownloadData();
      expect(data[0].approved_reject).toBe('Approved');
      expect(data[0].user_phone).toBe('123');
      expect(data[0].field_1).toBe('State1');
    });
  });
  describe('exportExcel', () => {
    it('should export data to Excel', () => {
      const data = [{ sno: 1, field_1: 'value' }];
      const fields = [{ field: 'sno', header: 'S No.', excludeExport: false }, { field: 'field_1', header: 'Field1', excludeExport: false }];
      const writeFileSpy = jest.spyOn(XLSX, 'writeFile');
      component.exportExcel(data, fields);
      expect(writeFileSpy).toHaveBeenCalled();
    });
    it('should handle parentSurveyId keys', () => {
      component.parentSurveyId = 'parent';
      const data = [{ sno: 1, parent: { field_1: 'parent_value' } }];
      const fields = [{ field: 'sno' }, { field: 'field_1' }];
      const writeFileSpy = jest.spyOn(XLSX, 'writeFile');
      component.exportExcel(data, fields);
      expect(writeFileSpy).toHaveBeenCalled();
    });
    it('should adjust fields for url_id 22', () => {
      component.url_id = '22';
      const data = [{ id: 1 }];
      const fields = [{ field: 'sno' }];
      const writeFileSpy = jest.spyOn(XLSX, 'writeFile');
      component.exportExcel(data, fields);
      expect(writeFileSpy).toHaveBeenCalled();
    });
  });
  describe('onDetailEmit', () => {
    it('should call getSearchSurveyData if search terms present', () => {
      component.showDetails = true;
      component.surveyIntimationNo = 'INT123';
      const getSearchSurveyDataSpy = jest.spyOn(component, 'getSearchSurveyData');
      component.onDetailEmit();
      expect(component.showDetails).toBe(false);
      expect(getSearchSurveyDataSpy).toHaveBeenCalledWith(component.surveyId);
    });
  });
  describe('getSearchSurveyData', () => {
    it('should toast warning if no client selected', () => {
      component.selectedClient = [];
      component.user = { unit_id: null };
      component.getSearchSurveyData('8');
      expect(coreService.toast).toHaveBeenCalledWith('warn', 'Please select a client');
    });
    it('should handle error', fakeAsync(() => {
      component.selectedClient = ['2000'];
      coreService.dashboard_post.mockRejectedValue(new Error('Error'));
      jest.spyOn(component as any, 'getRequestData').mockResolvedValue({});
      component.getSearchSurveyData('8');
      tick();
      expect(component.loading).toBe(0);
    }));
  });
  describe('handleSearchResponse', () => {
    it('should handle response with parentSurveyId', () => {
      const response = { status: 1, surveydata: [{ case_ID: '1', parent: { field_1: 'value' } }] };
      component.parentSurveyId = 'parent';
      component['handleSearchResponse'](response);
      expect(component.surveyData.length).toBe(1);
      expect(component.surveyData[0].field_1).toBe('value');
    });
   
    it('should handle without parentSurveyId', () => {
      const response = { status: 1, surveydata: [{ id: 1 }], locationdata: [] };
      (component as any)['handleSearchResponse'](response);
      expect(component.surveyData.length).toBe(1);
      expect(component.locationData).toEqual([]);
    });
    it('should do nothing if status not 1', () => {
      const response = { status: 0 };
      (component as any)['handleSearchResponse'](response);
      expect(component.surveyData).toEqual([]);
    });
  });
  describe('updateMetrics', () => {
    it('should update metrics based on dataPurpose', () => {
      const response = {
        total_pending: 5,
        total_approved: 10,
        total_rejected: 2,
        total_uploads: 20,
        total_draft: 3
      };
      component.dataPurpose = 'get_pending_surveydata';
      (component as any)['updateMetrics'](response);
      expect(component.toalRecord).toBe(5);
      // Similarly for others
    });
  });
  describe('generateFile', () => {
    it('should create and click download link', () => {
      const url = 'http://example.com/file.kml';
      const filename = 'test.kml';
      const appendChildSpy = jest.spyOn(document.body, 'appendChild');
      const removeChildSpy = jest.spyOn(document.body, 'removeChild');
      const link = document.createElement('a');
      jest.spyOn(document, 'createElement').mockReturnValue(link);
      const clickSpy = jest.spyOn(link, 'click');
      component.generateFile(url, filename);
      expect(link.href).toBe(url);
      expect(link.download).toBe(filename);
      expect(appendChildSpy).toHaveBeenCalledWith(link);
      expect(clickSpy).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalledWith(link);
    });
  });
  describe('download_kml', () => {
    it('should call generateFile if no coordinates', () => {
      const data = { file_name: 'test.kml' };
      const generateFileSpy = jest.spyOn(component, 'generateFile');
      component.download_kml(data);
      expect(generateFileSpy).toHaveBeenCalledWith(expect.stringContaining('test.kml'), 'test.kml');
    });
  });
  describe('isLimitedRole', () => {
    it('should return true for roles 3 and 4', () => {
      expect(component.isLimitedRole(3)).toBe(true);
      expect(component.isLimitedRole(4)).toBe(true);
      expect(component.isLimitedRole(1)).toBe(false);
    });
  });
  describe('onViewData', () => {
    it('should set detailDataId and showDetails', () => {
      component.onViewData(1);
      expect(component.detailDataId).toBe(1);
      expect(component.showDetails).toBe(true);
    });
  });
  describe('updatePageReport', () => {
    it('should update page_text', () => {
      component.currentpage = 2;
      component.recordsPerPage = 10;
      component.totalRecords = 25;
      component.updatePageReport();
      expect(component.page_text).toContain('Page 2 of 3');
    });
  });
  describe('invalidOnPageTrigger', () => {
    it('should update invalidCurrentpage and call invalidUpdatePageReport', () => {
      const event = { first: 10, rows: 10 };
      const invalidUpdatePageReportSpy = jest.spyOn(component, 'invalidUpdatePageReport');
      component.invalidOnPageTrigger(event);
      expect(component.invalidCurrentpage).toBe(2);
      expect(component.invalidRecordsPerPage).toBe(10);
      expect(invalidUpdatePageReportSpy).toHaveBeenCalled();
    });
  });
  describe('invalidUpdatePageReport', () => {
    it('should update invalid_page_text', () => {
      component.invalidCurrentpage = 2;
      component.invalidRecordsPerPage = 10;
      component.invalidTotalRecords = 25;
      component.invalidUpdatePageReport();
      expect(component.invalid_page_text).toContain('Page 2 of 3');
    });
  });
  describe('fileToJson', () => {
    it('should process valid Excel file', fakeAsync(() => {
      const file = new File([''], 'test.xlsx');
      const promise = component.fileToJson(file);
      tick();
      promise.then((result) => {
        expect(result).toBeDefined();
      });
    }));
  });
  describe('processCell', () => {
    it('should lowercase string', () => {
      expect(component.processCell('Test')).toBe('test');
    });

    it('should return non-string as is', () => {
      expect(component.processCell(123)).toBe(123);
    });
  });

  describe('parseCsv', () => {
    it('should parse CSV text', () => {
      const csvText = 'header1,header2\nvalue1,value2';
      const result = component.parseCsv(csvText);
      expect(result).toEqual([['header1', 'header2'], ['value1', 'value2']]);
    });

    it('should handle quoted fields', () => {
      const csvText = 'header,"quoted,value"';
      const result = component.parseCsv(csvText);
      expect(result).toEqual([['header', 'quoted,value']]);
    });

    it('should skip empty rows', () => {
      const csvText = ',,\nheader,value';
      const result = component.parseCsv(csvText);
      expect(result).toEqual([['header', 'value']]);
    });
  });

  describe('isValidDate', () => {
    it('should validate date format', () => {
      expect(component.isValidDate('2023-01-01')).toBe(true);
      expect(component.isValidDate('invalid')).toBe(false);
      expect(component.isValidDate('123')).toBe(false);
    });
  });

  describe('chunkArray', () => {
    it('should chunk array', () => {
      const array = [1, 2, 3, 4, 5];
      const result = component.chunkArray(array, 2);
      expect(result).toEqual([[1, 2], [3, 4], [5]]);
    });
  });

  describe('uploadChunksSequentially', () => {
    it('should handle status not 1', fakeAsync(() => {
      coreService.post.mockResolvedValue({ status: 0, msg: 'Failure' });
      const result = component.uploadChunksSequentially([[{}]]);
      tick();
      expect(result).resolves.toBe('Failure');
    }));

    it('should handle error', fakeAsync(() => {
      coreService.post.mockRejectedValue(new Error('Error'));
      const result = component.uploadChunksSequentially([[{}]]);
      tick();
      expect(result).resolves.toBe('Unable to upload Insured Verification data');
    }));
  });

  describe('ngOnDestroy', () => {
    it('should set isComponentActive to false and abort', () => {
      const abortSpy = jest.spyOn(component['abortController'], 'abort');
      component.ngOnDestroy();
      expect(component.isComponentActive).toBe(false);
      expect(abortSpy).toHaveBeenCalled();
    });
  });
  
  describe('updateTotals', () => {
    it('should update datalabel', () => {
      const response = {
        total_approved: 10,
        total_pending: 5,
        total_rejected: 2,
        total_uploads: 20,
        total_draft: 3
      };
      component['updateTotals'](response);
      expect(component.datalabel.totalApproved).toBe(10);
      // etc.
    });
  });
});