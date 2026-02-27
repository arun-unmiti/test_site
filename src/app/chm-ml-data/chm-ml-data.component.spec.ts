import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MultiSelectModule } from 'primeng/multiselect';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MessageService } from 'primeng/api';
import { of, Subject, throwError } from 'rxjs';
import { DomSanitizer } from '@angular/platform-browser';
import * as XLSX from 'xlsx';

import { ChmMlDataComponent } from './chm-ml-data.component';
import { UserDetailService } from '../auth/user-detail.service';
import { CoreService } from '../utilities/core.service';
import { FeatureToggleService } from '../shared/services/feature-toggle.service';
import { FilterService } from '../utilities/filter.service';

// Mock Firebase
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({
    name: 'mockApp',
    options: {},
    analytics: jest.fn(() => ({
      logEvent: jest.fn(),
      setUserId: jest.fn(),
      setCurrentScreen: jest.fn(),
    })),
  })),
}));

// Mock moment inline to avoid initialization issues
jest.mock('moment', () => {
  const momentMock = jest.fn().mockImplementation(() => ({
    subtract: jest.fn().mockReturnThis(),
    format: jest.fn().mockReturnValue('2023-01-01'),
    startOf: jest.fn().mockReturnThis(),
    endOf: jest.fn().mockReturnThis(),
  })) as unknown as typeof import('moment');

  momentMock.weekdaysMin = jest.fn().mockReturnValue(['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']);
  momentMock.monthsShort = jest.fn().mockReturnValue(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']);
  momentMock.weekdaysShort = jest.fn().mockReturnValue(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
  momentMock.localeData = jest.fn().mockReturnValue({
    firstDayOfWeek: jest.fn().mockReturnValue(1),
  });

  return momentMock;
});

// Mock Services
const mockUserDetailService = {
  getUserDetail: jest.fn().mockReturnValue({ user_id: '123', user_role: '7' }),
  resetCount: jest.fn(),
};

const mockCoreService = {
  checkSessionTime: jest.fn(),
  clearCache: [],
  addLookup: jest.fn(),
  dashboard_post: jest.fn().mockResolvedValue({ status: 1, lkp_Karnatakacrops: [{ state_id: 1, dist_id: 1, notified_unit: 1 }] }),
  clone: jest.fn(obj => Array.isArray(obj) ? [...obj] : { ...obj }),
  post: jest.fn().mockResolvedValue({ status: 1, all_agencies: [{ agency_id: 1, agency_name: 'Agency1' }], total_uploads: [{ field_1: 'value', file_name: 'file.jpg' }] }),
  getNotifiedCropList: jest.fn().mockReturnValue([{ crop_id: '001', crop: 'Crop1' }]),
  data_post: jest.fn().mockResolvedValue({ status: 1, fields: [{ field_id: 1, display_name: 'Field1' }] }),
  fetchAzureBlob: jest.fn().mockResolvedValue(new Blob([])),
  toast: jest.fn(),
};

const mockFeatureToggleService = {
  getContext: jest.fn().mockReturnValue('munichre'),
  featureContext$: of('munichre'),
  setContext: jest.fn(),
  initializeUserContext: jest.fn(),
  setFaviconAndTitle: jest.fn(),
  getConfig: jest.fn().mockReturnValue({
    BASEKMLPREFIX: 'mockPrefix',
    BASEKMLSUFFIX: 'mockSuffix'
  }),
};

const mockFilterService = {
  isLoactionFetched: true,
  fetchedLocationData: new Subject(),
  states: [{ state_id: 1, state_name: 'State1' }],
  districts: [{ district_id: 1, district_name: 'District1', state_id: 1 }],
  tehsils: [{ tehsil_id: 1, tehsil_name: 'Tehsil1', district_id: 1 }],
  crops: [{ crop_code: '001', crop_name: 'Crop1' }],
  clients: [{ UNIT_ID: 1, UNIT_NAME: 'Client1' }],
  years: [{ id: 2023, year: '2023' }],
  seasons: [{ id: 1, season_name: 'Season1' }],
  getAgencyWiseLocation: jest.fn().mockResolvedValue({ states: [{ state_id: 1 }], districts: [{ district_id: 1 }], tehsils: [{ tehsil_id: 1 }] }),
};

const mockDomSanitizer = {
  bypassSecurityTrustUrl: jest.fn(url => url as any),
};

jest.mock('../../environments/environment', () => ({
  environment: {
    projectConfigs: {
      munichre: { assetsFolder: '/assets/mock' }
    }
  }
}));

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn().mockReturnValue('blob:url');

// Mock XLSX for download
jest.mock('xlsx', () => ({
  utils: {
    aoa_to_sheet: jest.fn(),
    book_new: jest.fn(),
    book_append_sheet: jest.fn(),
  },
  writeFile: jest.fn(),
}));

describe('ChmMlDataComponent', () => {
  let component: ChmMlDataComponent;
  let fixture: ComponentFixture<ChmMlDataComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ChmMlDataComponent],
      imports: [FormsModule, MultiSelectModule, NgbModule, NgxDaterangepickerMd.forRoot()],
      providers: [
        MessageService,
        { provide: UserDetailService, useValue: mockUserDetailService },
        { provide: CoreService, useValue: mockCoreService },
        { provide: FeatureToggleService, useValue: mockFeatureToggleService },
        { provide: FilterService, useValue: mockFilterService },
        { provide: DomSanitizer, useValue: mockDomSanitizer }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ChmMlDataComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  describe('constructor', () => {
    it('should set projectContext and assetsFolder', () => {
      expect(mockFeatureToggleService.getContext).toHaveBeenCalled();
      expect(component.projectContext).toBe('munichre');
      expect(component.assetsFolder).toBe('/assets/mock');
    });
  });

  describe('ngOnInit', () => {
    it('should set imgURL and suffix, get user, call getLocationCropData, and call getLocationsData if fetched', () => {
      mockFilterService.isLoactionFetched = true;
      const getLocationCropDataSpy = jest.spyOn(component, 'getLocationCropData');
      const getLocationsDataSpy = jest.spyOn(component, 'getLocationsData');
      component.ngOnInit();
      expect(mockFeatureToggleService.getConfig).toHaveBeenCalled();
      expect(component.imgURL).toBe('mockPrefix');
      expect(component.imgURLSuffix).toBe('mockSuffix');
      expect(mockUserDetailService.getUserDetail).toHaveBeenCalled();
      expect(component.user).toEqual({ user_id: '123', user_role: '7' });
      expect(getLocationCropDataSpy).toHaveBeenCalled();
      expect(getLocationsDataSpy).toHaveBeenCalled();
    });

    it('should subscribe to fetchedLocationData if not fetched', () => {
      mockFilterService.isLoactionFetched = false;
      const getLocationsDataSpy = jest.spyOn(component, 'getLocationsData');
      component.ngOnInit();
      (mockFilterService.fetchedLocationData as Subject<any>).next(null);
      expect(getLocationsDataSpy).toHaveBeenCalled();
    });
  });

  describe('getLocationsData', () => {
    it('should set data from filter, build maps, and call getAllStates', () => {
      const getAllStatesSpy = jest.spyOn(component, 'getAllStates');
      component.getLocationsData();
      expect(component.states).toEqual(mockFilterService.states);
      expect(component.districts).toEqual(mockFilterService.districts);
      expect(component.tehsils).toEqual(mockFilterService.tehsils);
      expect(component.crops).toEqual(mockFilterService.crops);
      expect(component.clientData).toEqual(mockFilterService.clients);
      expect(component.yearData).toEqual(mockFilterService.years);
      expect(component.seasonData).toEqual(mockFilterService.seasons);
      expect(component.stateMap.get(1)).toBe('State1');
      expect(component.districtMap.get(1)).toBe('District1');
      expect(component.tehsilMap.get(1)).toBe('Tehsil1');
      expect(component.cropMap.get('001')).toBe('Crop1');
      expect(component.seasonMap.get(1)).toBe('Season1');
      expect(component.yearMap.get(2023)).toBe('2023');
      expect(getAllStatesSpy).toHaveBeenCalled();
    });
  });

  describe('getLocationCropData', () => {
    it('should filter existing dataCrops if available', () => {
      component.dataCrops = [{ state_id: 1, dist_id: 1, notified_unit: 1 }];
      component.selectedState = [{ state_id: 1 }];
      component.selectedDist = [{ district_id: 1 }];
      component.selectednotifiedUnits = [{ notified_id: 1 }];
      const getNotifiedCropListSpy = jest.spyOn(mockCoreService, 'getNotifiedCropList').mockReturnValue([{ crop_id: '001', crop: 'Crop1' }]);
      component.getLocationCropData();
      expect(component.cropsData).toEqual([{ crop_id: '001', crop: 'Crop1' }]);
      expect(getNotifiedCropListSpy).toHaveBeenCalled();
      expect(component.isCropLoading).toBe(0);
    });
  });

  describe('getAgencyData', () => {
    it('should not fetch if missing selections', () => {
      component.singleClient = null;
      component.getAgencyData();
      expect(mockCoreService.dashboard_post).not.toHaveBeenCalled();
    });
  });

  describe('getAllStates', () => {
    it('should set statesData to states if no singleClient', () => {
      component.singleClient = null;
      component.states = [{ state_id: 1 }];
      component.getAllStates();
      expect(component.statesData).toEqual([{ state_id: 1 }]);
    });

    it('should not set if singleClient', () => {
      component.singleClient = 1;
      component.statesData = [];
      component.getAllStates();
      expect(component.statesData).toEqual([]);
    });
  });

  describe('onYearSelect', () => {
    it('should reset selections and call methods', () => {
      const getAgencyDataSpy = jest.spyOn(component, 'getAgencyData');
      const getLocationCropDataSpy = jest.spyOn(component, 'getLocationCropData');
      const getAllStatesSpy = jest.spyOn(component, 'getAllStates');
      const resetDataSpy = jest.spyOn(component, 'resetData');
      component.onYearSelect(2023);
      expect(component.agencyData).toEqual([]);
      expect(component.statesData).toEqual([]);
      expect(component.districtData).toEqual([]);
      expect(component.blockData).toEqual([]);
      expect(component.selectedAgency).toEqual([]);
      expect(component.selectedState).toEqual([]);
      expect(component.selectedDist).toEqual([]);
      expect(component.selectedBlock).toEqual([]);
      expect(component.clientStates).toEqual([]);
      expect(component.clientDistricts).toEqual([]);
      expect(getAgencyDataSpy).toHaveBeenCalled();
      expect(getLocationCropDataSpy).toHaveBeenCalled();
      expect(getAllStatesSpy).toHaveBeenCalled();
      expect(resetDataSpy).toHaveBeenCalled();
    });

    it('should not reset selectedAgency if role 7', () => {
      component.user = { user_role: '7' };
      component.selectedAgency = [1];
      component.onYearSelect(2023);
      expect(component.selectedAgency).toEqual([1]);
    });
  });

  describe('onSeasonSelect', () => {
    it('should reset selections and call methods', () => {
      const getAgencyDataSpy = jest.spyOn(component, 'getAgencyData');
      const getLocationCropDataSpy = jest.spyOn(component, 'getLocationCropData');
      const getAllStatesSpy = jest.spyOn(component, 'getAllStates');
      const resetDataSpy = jest.spyOn(component, 'resetData');
      component.onSeasonSelect(1);
      expect(component.agencyData).toEqual([]);
      expect(component.statesData).toEqual([]);
      expect(component.districtData).toEqual([]);
      expect(component.blockData).toEqual([]);
      expect(component.selectedAgency).toEqual([]);
      expect(component.selectedState).toEqual([]);
      expect(component.selectedDist).toEqual([]);
      expect(component.selectedBlock).toEqual([]);
      expect(component.clientStates).toEqual([]);
      expect(component.clientDistricts).toEqual([]);
      expect(getAgencyDataSpy).toHaveBeenCalled();
      expect(getLocationCropDataSpy).toHaveBeenCalled();
      expect(getAllStatesSpy).toHaveBeenCalled();
      expect(resetDataSpy).toHaveBeenCalled();
    });
  });

  describe('onClientChange', () => {
    it('should reset selections and call methods', () => {
      const getLocationCropDataSpy = jest.spyOn(component, 'getLocationCropData');
      const getAgencyDataSpy = jest.spyOn(component, 'getAgencyData');
      const getAllStatesSpy = jest.spyOn(component, 'getAllStates');
      const resetDataSpy = jest.spyOn(component, 'resetData');
      component.onClientChange([{ UNIT_ID: 1 }]);
      expect(component.agencyData).toEqual([]);
      expect(component.statesData).toEqual([]);
      expect(component.districtData).toEqual([]);
      expect(component.blockData).toEqual([]);
      expect(component.selectedAgency).toEqual([]);
      expect(component.selectedState).toEqual([]);
      expect(component.selectedDist).toEqual([]);
      expect(component.selectedBlock).toEqual([]);
      expect(component.clientStates).toEqual([]);
      expect(component.clientDistricts).toEqual([]);
      expect(getLocationCropDataSpy).toHaveBeenCalled();
      expect(getAgencyDataSpy).toHaveBeenCalled();
      expect(getAllStatesSpy).toHaveBeenCalled();
      expect(resetDataSpy).toHaveBeenCalled();
    });
  });

  describe('onSingleClinetChange', () => {
    it('should reset if no event', () => {
      const onClientChangeSpy = jest.spyOn(component, 'onClientChange');
      component.onSingleClinetChange(null);
      expect(component.selectedAgency).toEqual([]);
      expect(component.agencyData).toEqual([]);
      expect(component.selectedClient).toEqual([]);
      expect(onClientChangeSpy).not.toHaveBeenCalled();
    });

    it('should set selectedClient and call onClientChange', () => {
      component.clientData = [{ UNIT_ID: '1' }];
      const onClientChangeSpy = jest.spyOn(component, 'onClientChange');
      component.onSingleClinetChange('1');
      expect(component.selectedClient).toEqual([{ UNIT_ID: '1' }]);
      expect(onClientChangeSpy).toHaveBeenCalledWith([{ UNIT_ID: '1' }]);
    });
  });

  describe('onAgencyChange', () => {
    it('should reset and call loadAgencyLocation if event', fakeAsync(() => {
      const loadAgencyLocationSpy = jest.spyOn(component, 'loadAgencyLocation');
      const getLocationCropDataSpy = jest.spyOn(component, 'getLocationCropData');
      const getAllStatesSpy = jest.spyOn(component, 'getAllStates');
      const resetDataSpy = jest.spyOn(component, 'resetData');
      component.onAgencyChange(1);
      tick();
      expect(component.statesData).toEqual([]);
      expect(component.districtData).toEqual([]);
      expect(component.blockData).toEqual([]);
      expect(component.selectedState).toEqual([]);
      expect(component.selectedDist).toEqual([]);
      expect(component.selectedBlock).toEqual([]);
      expect(component.clientStates).toEqual([]);
      expect(component.clientDistricts).toEqual([]);
      expect(loadAgencyLocationSpy).toHaveBeenCalledWith(1);
      expect(getLocationCropDataSpy).toHaveBeenCalled();
      expect(getAllStatesSpy).toHaveBeenCalled();
      expect(resetDataSpy).toHaveBeenCalled();
    }));

    it('should reset and call methods if no event', () => {
      const loadAgencyLocationSpy = jest.spyOn(component, 'loadAgencyLocation');
      component.onAgencyChange(null);
      expect(loadAgencyLocationSpy).not.toHaveBeenCalled();
    });
  });

  describe('onStateSelect', () => {
    it('should set districtData and call getLocationCropData', () => {
      const resetDataSpy = jest.spyOn(component, 'resetData');
      const getLocationCropDataSpy = jest.spyOn(component, 'getLocationCropData');
      component.singleClient = null;
      component.onStateSelect([{ state_id: 1 }]);
      expect(component.districtData).toHaveLength(1);
      expect(component.districtData[0].items).toEqual([{ district_id: 1, district_name: 'District1', state_id: 1 }]);
      expect(component.blockData).toEqual([]);
      expect(component.selectedDist).toEqual([]);
      expect(component.selectedBlock).toEqual([]);
      expect(getLocationCropDataSpy).toHaveBeenCalled();
      expect(resetDataSpy).toHaveBeenCalled();
    });

    it('should use clientDistricts if singleClient', () => {
      component.singleClient = 1;
      component.clientDistricts = [{ district_id: 1, state_id: 1 }];
      component.onStateSelect([{ state_id: 1 }]);
      expect(component.districtData[0].items).toEqual([{ district_id: 1, state_id: 1 }]);
    });

    it('should reset if no event', () => {
      component.onStateSelect([]);
      expect(component.districtData).toEqual([]);
      expect(component.blockData).toEqual([]);
      expect(component.selectedDist).toEqual([]);
      expect(component.selectedBlock).toEqual([]);
    });
  });

  describe('onDistSelect', () => {
    it('should set blockData and call getLocationCropData', () => {
      const resetDataSpy = jest.spyOn(component, 'resetData');
      const getLocationCropDataSpy = jest.spyOn(component, 'getLocationCropData');
      component.singleClient = null;
      component.onDistSelect([{ district_id: 1 }]);
      expect(component.blockData).toHaveLength(1);
      expect(component.blockData[0].items).toEqual([{ tehsil_id: 1, tehsil_name: 'Tehsil1', district_id: 1 }]);
      expect(component.selectedBlock).toEqual([]);
      expect(getLocationCropDataSpy).toHaveBeenCalled();
      expect(resetDataSpy).toHaveBeenCalled();
    });

    it('should use clientTehsils if singleClient', () => {
      component.singleClient = 1;
      component.clientTehsils = [{ tehsil_id: 1, district_id: 1 }];
      component.onDistSelect([{ district_id: 1 }]);
      expect(component.blockData[0].items).toEqual([{ tehsil_id: 1, district_id: 1 }]);
    });

    it('should reset if no event', () => {
      component.onDistSelect([]);
      expect(component.blockData).toEqual([]);
      expect(component.selectedBlock).toEqual([]);
    });
  });

  describe('onTehsilSelect', () => {
    it('should call getLocationCropData and resetData', () => {
      const getLocationCropDataSpy = jest.spyOn(component, 'getLocationCropData');
      const resetDataSpy = jest.spyOn(component, 'resetData');
      component.onTehsilSelect([{ tehsil_id: 1 }]);
      expect(getLocationCropDataSpy).toHaveBeenCalled();
      expect(resetDataSpy).toHaveBeenCalled();
    });
  });

  describe('resetData', () => {
    it('should be empty (placeholder)', () => {
      expect(component.resetData()).toBeUndefined();
    });
  });

  describe('prepareFilterRequest', () => {
    it('should toast and return null if no year', async () => {
      component.selectedYear = null;
      const result = await component.prepareFilterRequest();
      expect(result).toBeNull();
      expect(mockCoreService.toast).toHaveBeenCalledWith('warn', 'Please select year');
    });

    it('should toast and return null if no season', async () => {
      component.selectedYear = 2023;
      component.selectedSeason = null;
      const result = await component.prepareFilterRequest();
      expect(result).toBeNull();
      expect(mockCoreService.toast).toHaveBeenCalledWith('warn', 'Please select season');
    });

    it('should prepare request with fields if no fieldsData', async () => {
      component.selectedYear = 2023;
      component.selectedSeason = 1;
      component.fieldsData = [];
      const result: any = await component.prepareFilterRequest();
      expect(result.calls.length).toBe(2);
      expect(result.isMunichRe).toBe(true);
    });

    it('should prepare request without fields if fieldsData', async () => {
      component.selectedYear = 2023;
      component.selectedSeason = 1;
      component.fieldsData = [{}];
      const result: any = await component.prepareFilterRequest();
      expect(result.calls.length).toBe(1);
    });
  });

  describe('processFilterResponse', () => {
    it('should handle null', () => {
      component.processFilterResponse(null);
      expect(mockCoreService.toast).not.toHaveBeenCalled();
    });

    it('should handle error', fakeAsync(() => {
      const prepared = { calls: [Promise.reject('error')], isMunichRe: true, request: { purpose: 'get_ml_data', states: [], districts: [], tehsils: [], crop_id: [], start_date: null, end_date: null, client_id: [], agency_id: [], years: [], seasons: [], crop_column: 'field_509' }, fieldRequest: { purpose: 'get_surveyfields', survey_id: 1 } };
      component.processFilterResponse(prepared);
      tick();
      expect(mockCoreService.toast).toHaveBeenCalledWith('warn', 'Error fetching data');
      expect(component.loading).toBe(0);
    }));

    it('should handle no data', fakeAsync(() => {
      const prepared = { calls: [Promise.resolve({ status: 1, total_uploads: [] })], isMunichRe: true, request: { purpose: 'get_ml_data', states: [], districts: [], tehsils: [], crop_id: [], start_date: null, end_date: null, client_id: [], agency_id: [], years: [], seasons: [], crop_column: 'field_509' }, fieldRequest: { purpose: 'get_surveyfields', survey_id: 1 } };
      component.processFilterResponse(prepared);
      tick();
      expect(component.totalData).toEqual([]);
      expect(component.loading).toBe(0);
    }));
  });

  describe('fetchAndPrepareData', () => {
    it('should fetch and map fields', async () => {
      const calls = [Promise.resolve({ status: 1, total_uploads: [{ field_1: 'value' }] }), Promise.resolve({ status: 1, fields: [{ field_id: 1, display_name: 'Field1' }] })];
      const result = await (component as any).fetchAndPrepareData(calls, true);
      expect(result?.totalData).toEqual([{ field_1: 'value' }]);
      expect(result?.fieldKeys).toEqual(['field_1']);
      expect(component.fieldsData).toEqual([{ field_id: 1, display_name: 'Field1' }]);
      expect(component.fieldDataMap['field_1']).toBe('Field1');
    });

    it('should return null on failure', async () => {
      const calls = [Promise.resolve({ status: 0 })];
      const result = await (component as any).fetchAndPrepareData(calls, true);
      expect(result).toBeNull();
    });

    it('should skip fields if already present', async () => {
      component.fieldsData = [{ field_id: 1 }];
      const calls = [Promise.resolve({ status: 1, total_uploads: [{ field_1: 'value' }] })];
      const result = await (component as any).fetchAndPrepareData(calls, true);
      expect(result?.fieldKeys).toEqual(['field_1']);
    });
  });

  describe('onPageTrigger', () => {
    it('should update page and data', () => {
      component.totalData = [{ sno: 1 }, { sno: 2 }];
      component.pagination = { updatePagination: jest.fn() };
      component.onPageTrigger({ page_no: 2, records_per_page: 1 });
      expect(component.currentpage).toBe(2);
      expect(component.recordsPerPage).toBe(1);
      expect(component.tableData).toEqual([{ sno: 2 }]);
      expect(component.pagination.updatePagination).toHaveBeenCalled();
    });

    it('should not call update if no pagination', () => {
      component.totalData = [{ sno: 1 }];
      component.pagination = null;
      component.onPageTrigger({ page_no: 1, records_per_page: 10 });
      expect(component.tableData).toEqual([{ sno: 1 }]);
    });
  });

  describe('downloadRecords', () => {
    it('should not download if downloading', () => {
      component.downloading = 1;
      component.downloadRecords();
      expect(XLSX.utils.aoa_to_sheet).not.toHaveBeenCalled();
    });

    it('should download excel', fakeAsync(() => {
      component.totalData = [{ sno: 1, Field1: 'value' }];
      component.tableFields = ['sno', 'Field1'];
      component.downloadRecords();
      tick();
      expect(XLSX.utils.aoa_to_sheet).toHaveBeenCalledWith([[ 'SNO', 'FIELD1' ], [1, 'value']]);
      expect(XLSX.writeFile).toHaveBeenCalled();
      expect(component.downloading).toBe(0);
    }));
  });
});