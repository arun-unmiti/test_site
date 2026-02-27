import { ComponentFixture, TestBed, fakeAsync, flush } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';

import { ChmFieldDataUploadComponent } from './chm-field-data-upload.component';
import { CoreService } from '../utilities/core.service';
import { FilterService } from '../utilities/filter.service';
import { FeatureToggleService } from '../shared/services/feature-toggle.service';
import { UserDetailService } from '../auth/user-detail.service';
import { environment, ProjectContext } from '../../environments/environment';
import * as XLSX from 'xlsx';

// Mock environment
jest.mock('../../environments/environment', () => ({
  environment: {
    projectConfigs: {
      testContext: { assetsFolder: '/assets/test/' }
    }
  }
}));

// Mock services
class MockCoreService {
  post = jest.fn().mockResolvedValue({ status: 1, msg: 'Success' });
  toast = jest.fn();
  clone = jest.fn(obj => JSON.parse(JSON.stringify(obj)));
}

class MockFilterService {
  isvillageFetched = false;
  states: any[] = [{ state_id: 1, state_name: 'State1' }];
  districts: any[] = [{ district_id: 1, district_name: 'District1', state_id: 1 }];
  tehsils: any[] = [{ tehsil_id: 1, tehsil_name: 'Tehsil1', district_id: 1, state_id: 1 }];
  years: any[] = [{ id: 2023, year_code: '2023' }];
  seasons: any[] = [{ id: 1, season_name: 'Season1' }];
  fetchedLocationData = { subscribe: jest.fn() };
}

class MockFeatureToggleService {
  getContext = jest.fn().mockReturnValue('testContext' as ProjectContext);
}

class MockUserDetailService {
  getcsrfTokenName = jest.fn().mockReturnValue('csrf_name');
  getcsrfToken = jest.fn().mockReturnValue('csrf_token');
}

describe('ChmFieldDataUploadComponent', () => {
  let component: ChmFieldDataUploadComponent;
  let fixture: ComponentFixture<ChmFieldDataUploadComponent>;
  let coreService: MockCoreService;
  let filterService: MockFilterService;
  let featureToggleService: MockFeatureToggleService;
  let userDetailService: MockUserDetailService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ChmFieldDataUploadComponent],
      providers: [
        { provide: CoreService, useClass: MockCoreService },
        { provide: FilterService, useClass: MockFilterService },
        { provide: FeatureToggleService, useClass: MockFeatureToggleService },
        { provide: UserDetailService, useClass: MockUserDetailService }
      ],
      schemas: [NO_ERRORS_SCHEMA] // ignores ViewChild, unknown elements, bindings
    }).compileComponents();

    fixture = TestBed.createComponent(ChmFieldDataUploadComponent);
    component = fixture.componentInstance;
    coreService = TestBed.inject(CoreService) as unknown as MockCoreService;
    filterService = TestBed.inject(FilterService) as unknown as MockFilterService;
    featureToggleService = TestBed.inject(FeatureToggleService) as unknown as MockFeatureToggleService;
    userDetailService = TestBed.inject(UserDetailService) as unknown as MockUserDetailService;
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

    it('should initialize fileHeaders', () => {
      expect(component.fileHeaders.length).toBe(7);
    });
  });

  describe('ngOnInit', () => {
    it('should call getFilterData and set csrf tokens', () => {
      const getFilterDataSpy = jest.spyOn(component, 'getFilterData');
      component.ngOnInit();
      expect(getFilterDataSpy).toHaveBeenCalled();
      expect(userDetailService.getcsrfTokenName).toHaveBeenCalled();
      expect(userDetailService.getcsrfToken).toHaveBeenCalled();
      expect(component.csrfTokenName).toBe('csrf_name');
      expect(component.csrfToken).toBe('csrf_token');
    });
  });

  describe('getFilterData', () => {
    it('should call get_lookup_data if isvillageFetched is true', () => {
      filterService.isvillageFetched = true;
      const getLookupDataSpy = jest.spyOn(component, 'get_lookup_data');
      component.getFilterData();
      expect(getLookupDataSpy).toHaveBeenCalled();
    });

    it('should subscribe to fetchedLocationData if isvillageFetched is false', () => {
      filterService.isvillageFetched = false;
      const getLookupDataSpy = jest.spyOn(component, 'get_lookup_data');
      component.getFilterData();
      expect(filterService.fetchedLocationData.subscribe).toHaveBeenCalled();
      const cb = (filterService.fetchedLocationData.subscribe as jest.Mock).mock.calls[0][0];
      cb();
      expect(getLookupDataSpy).toHaveBeenCalled();
    });
  });

  describe('get_lookup_data', () => {
    it('should set lookup data and build mappings', () => {
      component.get_lookup_data();
      expect(component.isLookupLoaded).toBe(true);
      expect(component.stateData).toEqual(filterService.states);
      expect(component.districtData).toEqual(filterService.districts);
      expect(component.blockData).toEqual(filterService.tehsils);
      expect(component.yearData).toEqual(filterService.years);
      expect(component.seasonData).toEqual(filterService.seasons);
      // Check one mapping example
      expect(component.stateMapping['state1']).toBe(1);
      expect(component.stateMapping[1]).toBe('State1');
    });
  });

  describe('onFileEleClick', () => {
    it('should reset file input value and fileName', () => {
      const element = { nativeElement: { value: 'test.csv' } };
      component.fileName = 'test.csv';
      component.fileEle = element as any;
      component.onFileEleClick(element);
      expect(element.nativeElement.value).toBeNull();
      expect(component.fileName).toBe('');
    });
  });

  describe('fileToJson', () => {
    beforeEach(() => {
      component.get_lookup_data(); // Initialize mappings before fileToJson tests
    });

    it('should read Excel and process to JSON, validate rows', fakeAsync(() => {
      const file = new Blob([], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      global.FileReader = jest.fn().mockImplementation(function (this: any) {
        this.onload = jest.fn();
        this.readAsArrayBuffer = jest.fn(() => {
          this.onload({ target: { result: new Uint8Array([]) } });
        });
      }) as any;
      (XLSX as any).read = jest.fn().mockReturnValue({ Sheets: { Sheet1: {} }, SheetNames: ['Sheet1'] });
      XLSX.utils.sheet_to_json = jest.fn().mockReturnValue([component.fileHeaders.map(h => h.header), ['2023', 'Season1', 'State1', 'District1', 'Tehsil1', 12.34, 56.78]]);
      component.fileToJson(file).then((result: any) => {
        expect(result.validData.length).toBe(1);
        expect(result.invalidData.length).toBe(0);
      });
      flush();
    }));

    it('should handle invalid headers', fakeAsync(() => {
      const file = new Blob([]);
      XLSX.utils.sheet_to_json = jest.fn().mockReturnValue([['wrong header']]);
      component.fileToJson(file).then((result) => {
        expect(result).toBeNull();
        expect(coreService.toast).toHaveBeenCalledWith('warn', 'Invalid file data');
      });
      flush();
    }));

    it('should detect duplicates and invalids', fakeAsync(() => {
      const file = new Blob([]);
      XLSX.utils.sheet_to_json = jest.fn().mockReturnValue([
        component.fileHeaders.map(h => h.header),
        ['2023', 'Season1', 'State1', 'District1', 'Tehsil1', 12.34, 56.78],
        ['2023', 'Season1', 'State1', 'District1', 'Tehsil1', 12.34, 56.78] // duplicate coord
      ]);
      component.fileToJson(file).then((result: any) => {
        expect(result.validData.length).toBe(0);
        expect(result.invalidData.length).toBe(2);
        expect(result.invalidData[0].remark).toContain('Duplicate coordinate');
      });
      flush();
    }));
  });

  describe('downloadInvalids', () => {
    beforeEach(() => {
      component.get_lookup_data(); // Initialize mappings
    });

    it('should generate and download Excel with invalid data', () => {
      component.invalidFileData = [{ year: 2023, remark: ['Error1'], record_index: 1 }];
      const writeFileSpy = jest.spyOn(XLSX, 'writeFile');
      component.downloadInvalids();
      expect(writeFileSpy).toHaveBeenCalled();
    });
  });

  describe('clearFailed', () => {
    it('should clear failedIntimations', () => {
      component.failedIntimations = [{}];
      component.clearFailed();
      expect(component.failedIntimations).toEqual([]);
    });
  });

  describe('downloadFaileds', () => {
    beforeEach(() => {
      component.get_lookup_data(); // Initialize mappings
    });

    it('should generate and download Excel with failed data', () => {
      component.failedIntimations = [{ year: 2023 }];
      const writeFileSpy = jest.spyOn(XLSX, 'writeFile');
      component.downloadFaileds();
      expect(writeFileSpy).toHaveBeenCalled();
    });
  });
});