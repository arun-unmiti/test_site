import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';

import { CceUploadComponent } from './cce-upload.component';
import { CoreService } from '../utilities/core.service';
import { FilterService } from '../utilities/filter.service';
import { FeatureToggleService } from '../shared/services/feature-toggle.service';
import { environment, ProjectContext } from '../../environments/environment';
import * as XLSX from 'xlsx';
import * as moment from 'moment';
import { InsightsService } from '../utilities/insights.service';

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
  clone = jest.fn(obj => JSON.parse(JSON.stringify(obj)));
  post = jest.fn().mockResolvedValue({ status: 1, msg: 'Success' });
  toast = jest.fn();
}

class MockFilterService {
  isvillageFetched = false;
  states: any[] = [{ state_id: 1, state_name: 'State1' }];
  districts: any[] = [{ district_id: 1, district_name: 'District1', state_id: 1 }];
  tehsils: any[] = [{ tehsil_id: 1, tehsil_name: 'Tehsil1', district_id: 1, state_id: 1 }];
  blocks: any[] = [{ block_id: 1, block_name: 'Block1', tehsil_id: 1, district_id: 1, state_id: 1 }];
  grampanchayats: any[] = [{ grampanchayat_id: 1, grampanchayat_name: 'GP1', block_id: 1, tehsil_id: 1, district_id: 1, state_id: 1 }];
  villages: any[] = [{ village_id: 1, village_name: 'Village1', grampanchayat_id: 1, block_id: 1, tehsil_id: 1, district_id: 1, state_id: 1 }];
  notifiedUnits: any[] = [{ notified_id: 1, notified_unit_name: 'Unit1' }];
  crops: any[] = [{ crop_code: '001', crop_name: 'Crop1' }];
  years: any[] = [{ id: 2023, year_code: '2023' }];
  seasons: any[] = [{ id: 1, season_name: 'Season1' }];
  fetchedVillageData = { subscribe: jest.fn() };
}

class MockFeatureToggleService {
  getContext = jest.fn().mockReturnValue('testContext' as ProjectContext);
}

const mockInsightsService = {
  logException: jest.fn(),
};

describe('CceUploadComponent', () => {
  let component: CceUploadComponent;
  let fixture: ComponentFixture<CceUploadComponent>;
  let coreService: MockCoreService;
  let filterService: MockFilterService;
  let featureToggleService: MockFeatureToggleService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CceUploadComponent],
      providers: [
        { provide: CoreService, useClass: MockCoreService },
        { provide: FilterService, useClass: MockFilterService },
        { provide: FeatureToggleService, useClass: MockFeatureToggleService },
        { provide: InsightsService, useValue: mockInsightsService },
      ],
      schemas: [NO_ERRORS_SCHEMA] // ignores ViewChild, unknown elements, bindings
    }).compileComponents();

    fixture = TestBed.createComponent(CceUploadComponent);
    component = fixture.componentInstance;
    coreService = TestBed.inject(CoreService) as unknown as MockCoreService;
    filterService = TestBed.inject(FilterService) as unknown as MockFilterService;
    featureToggleService = TestBed.inject(FeatureToggleService) as unknown as MockFeatureToggleService;
    mockInsightsService.logException.mockReset();
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
      expect(component.fileHeaders.length).toBe(18);
    });
  });

  describe('ngOnInit', () => {
    it('should call getFilterData', () => {
      const getFilterDataSpy = jest.spyOn(component, 'getFilterData');
      component.ngOnInit();
      expect(getFilterDataSpy).toHaveBeenCalled();
    });
  });

  describe('getFilterData', () => {
    it('should call fetchLookupDataImmediately if isvillageFetched is true', () => {
      filterService.isvillageFetched = true;
      const fetchLookupDataImmediatelySpy = jest.spyOn(component, 'fetchLookupDataImmediately');
      component.getFilterData();
      expect(fetchLookupDataImmediatelySpy).toHaveBeenCalled();
    });

    it('should call waitForVillageDataAndFetchLookup if isvillageFetched is false', () => {
      filterService.isvillageFetched = false;
      const waitForVillageDataAndFetchLookupSpy = jest.spyOn(component, 'waitForVillageDataAndFetchLookup');
      component.getFilterData();
      expect(waitForVillageDataAndFetchLookupSpy).toHaveBeenCalled();
    });
  });

  describe('fetchLookupDataImmediately', () => {
    it('should call getLookupData', () => {
      const getLookupDataSpy = jest.spyOn(component, 'getLookupData');
      component.fetchLookupDataImmediately();
      expect(getLookupDataSpy).toHaveBeenCalled();
    });
  });

  describe('waitForVillageDataAndFetchLookup', () => {
    it('should subscribe to fetchedVillageData and call getLookupData', fakeAsync(() => {
      const getLookupDataSpy = jest.spyOn(component, 'getLookupData');
      component.waitForVillageDataAndFetchLookup();
      expect(filterService.fetchedVillageData.subscribe).toHaveBeenCalled();
      const cb = (filterService.fetchedVillageData.subscribe as jest.Mock).mock.calls[0][0];
      cb();
      expect(getLookupDataSpy).toHaveBeenCalled();
    }));
  });

  describe('getLookupData', () => {
    it('should call initializeLookupData and buildAllMappings', () => {
      const initializeLookupDataSpy = jest.spyOn(component as any, 'initializeLookupData');
      const buildAllMappingsSpy = jest.spyOn(component as any, 'buildAllMappings');
      component.getLookupData();
      expect(initializeLookupDataSpy).toHaveBeenCalled();
      expect(buildAllMappingsSpy).toHaveBeenCalled();
    });
  });

  describe('initializeLookupData', () => {
    it('should set lookup data from filter and set isLookupLoaded to true', () => {
      component['initializeLookupData']();
      expect(component.isLookupLoaded).toBe(true);
      expect(component.stateData).toEqual(filterService.states);
      expect(component.districtData).toEqual(filterService.districts);
      expect(component.blockData).toEqual(filterService.tehsils);
      expect(component.riCircleData).toEqual(filterService.blocks);
      expect(component.grampanchayatData).toEqual(filterService.grampanchayats);
      expect(component.villageData).toEqual(filterService.villages);
      expect(component.iuLevelData).toEqual(filterService.notifiedUnits);
      expect(component.cropData).toEqual(filterService.crops);
      expect(component.yearData).toEqual(filterService.years);
      expect(component.seasonData).toEqual(filterService.seasons);
    });
  });

  describe('buildAllMappings', () => {
    it('should build mappings for all data types', () => {
      const buildMappingsSpy = jest.spyOn(component as any, 'buildMappings');
      component['buildAllMappings']();
      expect(buildMappingsSpy).toHaveBeenCalledTimes(10); // One for each setMapping call
    });
  });

  describe('buildMappings', () => {
    it('should build mapping and pairedMapping correctly', () => {
      const data = [{ state_name: 'State1', state_id: 1 }];
      const config = { nameField: 'state_name', idField: 'state_id', parentFields: [], lowerTrim: true, hasReverse: true, hasPaired: true };
      const result = component['buildMappings'](data, config);
      expect(result.mapping['state1']).toBe(1);
      expect(result.mapping[1]).toBe('State1');
      expect(result.pairedMapping['state1']).toBe(1);
    });

    it('should handle parentFields in pairedKey', () => {
      const data = [{ district_name: 'District1', district_id: 1, state_id: 1 }];
      const config = { nameField: 'district_name', idField: 'district_id', parentFields: ['state_id'], lowerTrim: true, hasReverse: true, hasPaired: true };
      const result = component['buildMappings'](data, config);
      expect(result.mapping['district1']).toBe(1);
      expect(result.mapping[1]).toBe('District1');
      expect(result.pairedMapping['1=>district1']).toBe(1);
    });
  });

  describe('downloadInvalids', () => {
    it('should generate and download Excel with invalid data', () => {
      component.invalidFileData = [{ year: 2023, remark: ['Error1', 'Error2'] }];
      const writeFileSpy = jest.spyOn(XLSX, 'writeFile');
      component.downloadInvalids();
      expect(writeFileSpy).toHaveBeenCalled();
    });
  });

  describe('fileToJson', () => {
    it('should read Excel and process to JSON', fakeAsync(() => {
      const file = new Blob([], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const validateRowSpy = jest.spyOn(component as any, 'validateRow');
      global.FileReader = jest.fn().mockImplementation(function (this: any) {
        this.onload = jest.fn();
        this.readAsArrayBuffer = jest.fn(() => {
          this.onload({ target: { result: new Uint8Array([]) } });
        });
      }) as any;
      (XLSX as any).read = jest.fn().mockReturnValue({ Sheets: { Sheet1: {} }, SheetNames: ['Sheet1'] });
      XLSX.utils.sheet_to_json = jest.fn().mockReturnValue([['header1'], ['data1']]);
      const result: any = component.fileToJson(file);
      tick();
      expect(result).resolves.toEqual({ jsonData: expect.any(Array), validData: expect.any(Array), invalidData: expect.any(Array) });
    }));
  });

  describe('clearFailed', () => {
    it('should do nothing', () => {
      expect(component.clearFailed()).toBeUndefined();
    });
  });

  describe('onFileEleClick', () => {
    it('should clear fileEle value and fileName', () => {
      component.fileEle = { nativeElement: { value: 'file' } } as any;
      component.fileName = 'name';
      component.onFileEleClick(null);
      expect(component.fileEle.nativeElement.value).toBeNull();
      expect(component.fileName).toBe("");
    });
  });

  describe('onFileChange', () => {
    it('should process single file and set data', async () => {
      const file = { name: 'test.xlsx' } as File;
      const event = { target: { files: [file], value: 'path' } };
      jest.spyOn(component, 'fileToJson').mockResolvedValue({ validData: [{ b: 2 }], invalidData: [{ c: 3 }] });
      await component.onFileChange(event);
      expect(component.fileName).toBe('test.xlsx');
      expect(component.fileData).toEqual([{ b: 2 }]);
      expect(component.invalidFileData).toEqual([{ c: 3 }]);
    });

    it('should clear target value if no fileData', async () => {
      const event = { target: { files: [{} as File], value: 'path' } };
      jest.spyOn(component, 'fileToJson').mockResolvedValue(null);
      await component.onFileChange(event);
      expect(event.target.value).toBeNull();
    });

    it('should do nothing if no files or multiple files', async () => {
      const event1 = { target: { files: [] } };
      const event2 = { target: { files: [{}, {}] } };
      const fileToJsonSpy = jest.spyOn(component, 'fileToJson');
      await component.onFileChange(event1);
      await component.onFileChange(event2);
      expect(fileToJsonSpy).not.toHaveBeenCalled();
    });
  });

  describe('downloadInvalids with empty remark', () => {
    it('should handle empty remark', () => {
      component.invalidFileData = [{ year: 2023, remark: [] }];
      const writeFileSpy = jest.spyOn(XLSX, 'writeFile');
      component.downloadInvalids();
      expect(writeFileSpy).toHaveBeenCalled();
    });

    it('should handle no remark', () => {
      component.invalidFileData = [{ year: 2023 }];
      const writeFileSpy = jest.spyOn(XLSX, 'writeFile');
      component.downloadInvalids();
      expect(writeFileSpy).toHaveBeenCalled();
    });
  });

  describe('fileToJson full processing', () => {
    beforeEach(() => {
      component.getLookupData(); // Initialize mappings
    });

    it('should process valid row with all mappings', async () => {
      const sheetData = [
        ['year', 'season', 'state', 'district', 'taluka', 'ri_circle', 'gp', 'village', 'notified_unit', 'crop', 'cce_type', 'random_no', 'longitude', 'latitude', 'farmer_name', 'farmer_mobile_no', 'shape_of_cce_plot', 'dimension_of_plot'],
        [2023, 'Season1', 'State1', 'District1', 'Tehsil1', 'Block1', 'GP1', 'Village1', 'Unit1', 'Crop1', 'type', 1, 10.0, 20.0, 'farmer', 1234567890, 'shape', 'dim']
      ];
      const file = new Blob([], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }) as File;
      (XLSX as any).read = jest.fn().mockReturnValue({ Sheets: { Sheet1: {} }, SheetNames: ['Sheet1'] });
      XLSX.utils.sheet_to_json = jest.fn().mockReturnValue(sheetData);
      const result: any = await component.fileToJson(file);
      expect(result.validData.length).toBe(1);
      const row = result.validData[0];
      expect(row.year).toBe(2023);
      expect(row.season).toBe(1);
      expect(row.state).toBe(1);
      expect(row.district).toBe(1);
      expect(row.taluka).toBe(1);
      expect(row.ri_circle).toBe(1);
      expect(row.gp).toBe(1);
      expect(row.village).toBe(1);
      expect(row.notified_unit).toBe(1);
      expect(row.crop).toBe('001');
      expect(row.cce_type).toBe('type');
      expect(row.isValid).toBe(true);
    });

    it('should handle non-string cell without trim', async () => {
      const sheetData = [
        ['year', 'season', 'state', 'district', 'taluka', 'ri_circle', 'gp', 'village', 'notified_unit', 'crop', 'cce_type', 'random_no', 'longitude', 'latitude', 'farmer_name', 'farmer_mobile_no', 'shape_of_cce_plot', 'dimension_of_plot'],
        [2023, 1, 1, 1, 1, 1, 1, 1, 1, '001', 'type', 1, 10.0, 20.0, 'farmer', 1234567890, 'shape', 'dim']
      ];
      const file = new Blob([], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }) as File;
      (XLSX as any).read = jest.fn().mockReturnValue({ Sheets: { Sheet1: {} }, SheetNames: ['Sheet1'] });
      XLSX.utils.sheet_to_json = jest.fn().mockReturnValue(sheetData);
      const result: any = await component.fileToJson(file);
      expect(result.validData.length).toBe(1);
      const row = result.validData[0];
      expect(row.season).toBe(1); // not trimmed since number
    });

    it('should handle empty file and toast warn', async () => {
      const file = new Blob([], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }) as File;
      (XLSX as any).read = jest.fn().mockReturnValue({
        Sheets: { Sheet1: {} },
        SheetNames: ['Sheet1']
      });
      XLSX.utils.sheet_to_json = jest.fn().mockReturnValue([]);
      const toastSpy = jest.spyOn(coreService, 'toast');
      const result = await component.fileToJson(file);
      expect(toastSpy).toHaveBeenCalledWith('warn', 'Empty file');
      expect(result).toBeNull();
    });

    it('should cover required validation when field.requried is true', async () => {
      // Temporarily set requried for coverage
      const originalHeaders = [...component.fileHeaders];
      component.fileHeaders[0].requried = true; // year
      const sheetData = [
        ['year', 'season', 'state', 'district', 'taluka', 'ri_circle', 'gp', 'village', 'notified_unit', 'crop', 'cce_type', 'random_no', 'longitude', 'latitude', 'farmer_name', 'farmer_mobile_no', 'shape_of_cce_plot', 'dimension_of_plot'],
        ['', 'Season1', 'State1', 'District1', 'Tehsil1', 'Block1', 'GP1', 'Village1', 'Unit1', 'Crop1', 'type', 1, 10.0, 20.0, 'farmer', 1234567890, 'shape', 'dim']
      ];
      const file = new Blob([], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }) as File;
      (XLSX as any).read = jest.fn().mockReturnValue({ Sheets: { Sheet1: {} }, SheetNames: ['Sheet1'] });
      XLSX.utils.sheet_to_json = jest.fn().mockReturnValue(sheetData);
      const result: any = await component.fileToJson(file);
      expect(result.invalidData.length).toBe(1);
      const row = result.invalidData[0];
      expect(row.remark).toContain('Year is mandatory');
      // Restore
      component.fileHeaders = originalHeaders;
    });

    it('should cover required as function returning false (add error)', async () => {
      const originalHeaders = [...component.fileHeaders];
      component.fileHeaders[0].requried = (row: any) => false; // required = false, !required = true, add error
      const sheetData = [
        ['year', 'season', 'state', 'district', 'taluka', 'ri_circle', 'gp', 'village', 'notified_unit', 'crop', 'cce_type', 'random_no', 'longitude', 'latitude', 'farmer_name', 'farmer_mobile_no', 'shape_of_cce_plot', 'dimension_of_plot'],
        ['', 'Season1', 'State1', 'District1', 'Tehsil1', 'Block1', 'GP1', 'Village1', 'Unit1', 'Crop1', 'type', 1, 10.0, 20.0, 'farmer', 1234567890, 'shape', 'dim']
      ];
      const file = new Blob([], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }) as File;
      (XLSX as any).read = jest.fn().mockReturnValue({ Sheets: { Sheet1: {} }, SheetNames: ['Sheet1'] });
      XLSX.utils.sheet_to_json = jest.fn().mockReturnValue(sheetData);
      const result: any = await component.fileToJson(file);
      expect(result.invalidData.length).toBe(1);
      const row = result.invalidData[0];
      expect(row.remark).toContain('Year is mandatory');
      component.fileHeaders = originalHeaders;
    });

    it('should cover required as function returning true (no error)', async () => {
      const originalHeaders = [...component.fileHeaders];
      component.fileHeaders[0].requried = (row: any) => true; // required = true, !required = false, no add
      const sheetData = [
        ['year', 'season', 'state', 'district', 'taluka', 'ri_circle', 'gp', 'village', 'notified_unit', 'crop', 'cce_type', 'random_no', 'longitude', 'latitude', 'farmer_name', 'farmer_mobile_no', 'shape_of_cce_plot', 'dimension_of_plot'],
        ['', 'Season1', 'State1', 'District1', 'Tehsil1', 'Block1', 'GP1', 'Village1', 'Unit1', 'Crop1', 'type', 1, 10.0, 20.0, 'farmer', 1234567890, 'shape', 'dim']
      ];
      const file = new Blob([], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }) as File;
      (XLSX as any).read = jest.fn().mockReturnValue({ Sheets: { Sheet1: {} }, SheetNames: ['Sheet1'] });
      XLSX.utils.sheet_to_json = jest.fn().mockReturnValue(sheetData);
      const result: any = await component.fileToJson(file);
      expect(result.validData.length).toBe(1); // no error added
      component.fileHeaders = originalHeaders;
    });

    it('should cover date validation', async () => {
      const originalHeaders = [...component.fileHeaders];
      component.fileHeaders.push({ field: "test_date", header: "Test Date", type: "date" });
      const sheetData = [
        [...component.fileHeaders.map(h => h.field)],
        [2023, 'Season1', 'State1', 'District1', 'Tehsil1', 'Block1', 'GP1', 'Village1', 'Unit1', 'Crop1', 'type', 1, 10.0, 20.0, 'farmer', 1234567890, 'shape', 'dim', 'invalid']
      ];
      const file = new Blob([], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }) as File;
      (XLSX as any).read = jest.fn().mockReturnValue({ Sheets: { Sheet1: {} }, SheetNames: ['Sheet1'] });
      XLSX.utils.sheet_to_json = jest.fn().mockReturnValue(sheetData);
      const result: any = await component.fileToJson(file);
      expect(result.invalidData.length).toBe(1);
      const row = result.invalidData[0];
      expect(row.remark).toContain('Test Date value must be in "DD-MM-YYYY" date format');
      component.fileHeaders = originalHeaders;
    });

    it('should accept valid date format', async () => {
      const originalHeaders = [...component.fileHeaders];
      component.fileHeaders.push({ field: "test_date", header: "Test Date", type: "date" });
      const sheetData = [
        [...component.fileHeaders.map(h => h.field)],
        [2023, 'Season1', 'State1', 'District1', 'Tehsil1', 'Block1', 'GP1', 'Village1', 'Unit1', 'Crop1', 'type', 1, 10.0, 20.0, 'farmer', 1234567890, 'shape', 'dim', '01-01-2023']
      ];
      const file = new Blob([], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }) as File;
      (XLSX as any).read = jest.fn().mockReturnValue({ Sheets: { Sheet1: {} }, SheetNames: ['Sheet1'] });
      XLSX.utils.sheet_to_json = jest.fn().mockReturnValue(sheetData);
      const result: any = await component.fileToJson(file);
      expect(result.validData.length).toBe(1);
      component.fileHeaders = originalHeaders;
    });
  });

  describe('onSubmit', () => {
    it('should post data and reset on success', async () => {
      component.fileData = [{ test: 'data' }];
      component.fileEle = { nativeElement: { value: 'file' } } as any;
      component.fileName = 'test.xlsx';
      coreService.post.mockResolvedValueOnce({ status: 1, msg: 'Success' });

      component.onSubmit();
      await fixture.whenStable();

      expect(coreService.post).toHaveBeenCalledWith({ purpose: 'upload_cce_implementation', data: [{ test: 'data' }] });
      expect(coreService.toast).toHaveBeenCalledWith('success', 'Success');
      expect(component.fileData).toEqual([]);
      expect(component.invalidFileData).toEqual([]);
      expect(component.fileEle.nativeElement.value).toBeNull();
      expect(component.fileName).toBe('');
    });

    it('should toast error on failure', async () => {
      component.fileData = [{ test: 'data' }];
      coreService.post.mockResolvedValueOnce({ status: 0, msg: 'Error' });

      component.onSubmit();
      await fixture.whenStable();

      expect(coreService.toast).toHaveBeenCalledWith('error', 'Error');
    });
  });
});