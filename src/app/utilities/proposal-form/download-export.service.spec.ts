import 'zone.js/bundles/zone-testing-bundle.umd.js';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';
import * as XLSX from 'xlsx';
import * as moment from 'moment';

import { DownloadExportService } from './download-export.service';
import { CoreService } from '../../utilities/core.service';
import { FilterService } from '../../utilities/filter.service';

class MockCoreService {
  post = jest.fn().mockResolvedValue({ status: 1, surveydata: [] });
  clone = jest.fn(obj => JSON.parse(JSON.stringify(obj)));
  toast = jest.fn();
}

class MockFilterService {
  districts = [];
  tehsils = [];
}

describe('DownloadExportService', () => {
  let service: DownloadExportService;
  let coreService: any;
  let filterService: any;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        DownloadExportService,
        { provide: CoreService, useClass: MockCoreService },
        { provide: FilterService, useClass: MockFilterService },
      ],
    });

    service = TestBed.inject(DownloadExportService);
    coreService = TestBed.inject(CoreService);
    filterService = TestBed.inject(FilterService);
  });

  it('should create the component', () => {
    expect(service).toBeTruthy();
  });

  describe('downloadTable', () => {
    it('should build request, download records, and generate data', fakeAsync(async () => {
      const mockComponent = {
        abortController: { signal: { addEventListener: jest.fn() } },
        isComponentActive: true,
        downloadRecordPerPage: 10,
        selectedFromDate: { startDate: { format: () => '2023-01-01' }, endDate: { format: () => '2023-01-31' } },
        excelDownloadPurpose: 'test_purpose',
        dataPurpose: 'data',
        surveyId: 1,
        selectedState: [{ state_id: 1 }],
        selectedDist: [{ district_id: 1 }],
        selectedBlock: [{ tehsil_id: 1 }],
        selectedCrop: [1],
        selectedUser: [{ user_id: 1 }],
        selectedYear: 2023,
        selectedSeason: 1,
        crop_column: 'crop',
        dateType: 'date',
        user: { user_role: 1 },
        statesData: [{ state_id: 1 }],
        recordsPerPage: 10,
        currentpage: 1,
        parentSurveyId: null,
        url_id: '1',
        stateMap: new Map(),
        districtMap: new Map(),
        tehsilMap: new Map(),
        blockMap: new Map(),
        grampanchayatMap: new Map(),
        villageMap: new Map(),
        cropMap: new Map(),
        seasonMap: new Map(),
        yearMap: new Map(),
        userPhoneMap: {},
        fileHeaders: [],
        typeFields: [],
        selectedOtherActivity: [],
        surveyIntimationNo: null,
        searchCaseId: null,
        noOfVisit: null,
        surveyName: 'Test Survey',
      };

      coreService.post.mockResolvedValueOnce({ status: 1, surveydata: Array.from({length: 10}, (_, i) => ({ id: i + 1 })) });
      coreService.post.mockResolvedValueOnce({ status: 1, surveydata: [] });

      const result = await service.downloadTable(mockComponent);
      expect(coreService.post).toHaveBeenCalledTimes(2);
      expect(result).toEqual(expect.arrayContaining([expect.objectContaining({ sno: 1 })]));
    }));

    it('should reject if aborted', fakeAsync(() => {
      const mockComponent = {
        abortController: { signal: { addEventListener: jest.fn((_, cb) => cb()) } },
        isComponentActive: true,
        downloadRecordPerPage: 10,
        selectedFromDate: { startDate: { format: () => '2023-01-01' }, endDate: { format: () => '2023-01-31' } },
        dataPurpose: 'data',
        surveyId: 1,
        selectedState: [],
        selectedDist: [],
        selectedBlock: [],
        selectedCrop: [],
        selectedUser: [],
        selectedYear: 2023,
        selectedSeason: 1,
        crop_column: 'crop',
        dateType: 'date',
        user: { user_role: 1 },
        statesData: [],
        selectedOtherActivity: [],
        surveyIntimationNo: null,
        searchCaseId: null,
      };
      service.downloadTable(mockComponent).catch(err => expect(err).toBe('Download Aborted.'));
      tick();
    }));
  });

  describe('buildDownloadRequest', () => {
    it('should build request with defaults', () => {
      const mockComponent = {
        selectedFromDate: { startDate: { format: () => '2023-01-01' }, endDate: { format: () => '2023-01-31' } },
        dataPurpose: 'data',
        surveyId: 1,
        selectedState: [{ state_id: 1 }],
        selectedDist: [{ district_id: 1 }],
        selectedBlock: [{ tehsil_id: 1 }],
        selectedCrop: [1],
        selectedUser: [{ user_id: 1 }],
        selectedYear: 2023,
        selectedSeason: 1,
        crop_column: 'crop',
        dateType: 'date',
        user: { user_role: 1 },
        statesData: [{ state_id: 1 }],
        selectedOtherActivity: [],
        surveyIntimationNo: null,
        searchCaseId: null,
        downloadRecordPerPage: 10,
      };
      const request = (service as any).buildDownloadRequest(mockComponent);
      expect(request.purpose).toBe('data');
      expect(request.client_id).toEqual(["2000"]);
      expect(request.start_date).toBe('2023-01-01');
      expect(request.pagination.records_per_page).toBe(10);
    });

    it('should adjust locations for user_role > 2', () => {
      const mockComponent = {
        dataPurpose: 'data',
        user: { user_role: 3 },
        statesData: [{ state_id: 1 }],
        selectedState: [],
        selectedDist: [],
        selectedBlock: [],
      };
      filterService.districts = [{ district_id: 1 }];
      filterService.tehsils = [{ tehsil_id: 1 }];
      const request = (service as any).buildDownloadRequest(mockComponent);
      expect(request.states).toEqual([1]);
      expect(request.districts).toEqual([1]);
      expect(request.tehsils).toEqual([1]);
    });
  });

  describe('downloadTableRecords', () => {
    it('should recursively fetch pages until no more data', fakeAsync(async () => {
      const request = { pagination: { page_no: 1 } };
      coreService.post.mockResolvedValueOnce({ status: 1, surveydata: [1,2,3,4,5,6,7,8,9,10] });
      coreService.post.mockResolvedValueOnce({ status: 1, surveydata: [11] });
      coreService.post.mockResolvedValueOnce({ status: 1, surveydata: [] });
      const result = await (service as any).downloadTableRecords(request, [], true, 10);
      expect(result).toEqual([1,2,3,4,5,6,7,8,9,10,11]);
      expect(request.pagination.page_no).toBe(3);
    }));

    it('should stop if component not active', fakeAsync(async () => {
      const request = { pagination: { page_no: 1 } };
      coreService.post.mockResolvedValueOnce({ status: 1, surveydata: [1] });
      const result = await (service as any).downloadTableRecords(request, [], false, 10);
      expect(result).toEqual([]);
    }));

    it('should stop if fewer records than page size', fakeAsync(async () => {
      const request = { pagination: { page_no: 1 } };
      coreService.post.mockResolvedValueOnce({ status: 1, surveydata: [1,2] });
      const result = await (service as any).downloadTableRecords(request, [], true, 10);
      expect(result).toEqual([1,2]);
    }));
  });

  describe('exportExcel', () => {
    it('should prepare fields, map data, and write to excel', () => {
      const mockComponent = { url_id: '22', parentSurveyId: null, surveyName: 'Test' };
      const data = [{ field1: 'val1' }];
      const fields = [{ field: 'field1', header: 'Header1', excludeExport: false }];
      jest.spyOn(XLSX.utils, 'aoa_to_sheet').mockReturnValue({} as any);
      jest.spyOn(XLSX.utils, 'book_new').mockReturnValue({} as any);
      jest.spyOn(XLSX.utils, 'book_append_sheet').mockImplementation(() => {});
      const writeFileSpy = jest.spyOn(XLSX, 'writeFile').mockImplementation(() => {});
      (service as any).exportExcel(mockComponent, data, fields);
      expect(writeFileSpy).toHaveBeenCalled();
    });

    it('should filter fields for url_id !== 22', () => {
      const mockComponent = { url_id: '1', parentSurveyId: null, surveyName: 'Test' };
      const data = [{ field1: 'val1' }];
      const fields = [{ field: 'field1', header: 'Header1', excludeExport: true }];
      jest.spyOn(XLSX.utils, 'aoa_to_sheet').mockReturnValue({} as any);
      jest.spyOn(XLSX.utils, 'book_new').mockReturnValue({} as any);
      jest.spyOn(XLSX.utils, 'book_append_sheet').mockImplementation(() => {});
      const writeFileSpy = jest.spyOn(XLSX, 'writeFile').mockImplementation(() => {});
      (service as any).exportExcel(mockComponent, data, fields);
      expect(writeFileSpy).toHaveBeenCalled();
    });

    it('should handle parentSurveyId', () => {
      const mockComponent = { url_id: '22', parentSurveyId: true, surveyName: 'Test' };
      const data = [{ field1: 'val1', parent: { field1: 'parentVal' } }];
      const fields = [{ field: 'field1', header: 'Header1' }];
      jest.spyOn(XLSX.utils, 'aoa_to_sheet').mockReturnValue({} as any);
      jest.spyOn(XLSX.utils, 'book_new').mockReturnValue({} as any);
      jest.spyOn(XLSX.utils, 'book_append_sheet').mockImplementation(() => {});
      const writeFileSpy = jest.spyOn(XLSX, 'writeFile').mockImplementation(() => {});
      (service as any).exportExcel(mockComponent, data, fields);
      expect(writeFileSpy).toHaveBeenCalled();
    });
  });

  describe('prepareFields', () => {
    it('should filter excludeExport for url_id !== 22', () => {
      const fields = [{ field: 'sno', excludeExport: true }, { field: 'id', excludeExport: false }];
      const result = (service as any).prepareFields({ url_id: '1' }, fields);
      expect(result.length).toBe(1);
      expect(result[0].field).toBe('id');
    });

    it('should add extra fields for url_id === 22', () => {
      const fields = [{ field: 'sno' }];
      const result = (service as any).prepareFields({ url_id: '22' }, fields);
      expect(result.length).toBe(3);
      expect(result[2].field).toBe('added_datetime');
    });
  });

  describe('writeToExcel', () => {
    it('should write data to excel file', () => {
      const excelData = [['Header'], ['Data']];
      const surveyName = 'Test';
      jest.spyOn(XLSX.utils, 'aoa_to_sheet').mockReturnValue({} as any);
      jest.spyOn(XLSX.utils, 'book_new').mockReturnValue({} as any);
      jest.spyOn(XLSX.utils, 'book_append_sheet').mockImplementation(() => {});
      const writeFileSpy = jest.spyOn(XLSX, 'writeFile').mockImplementation(() => {});
      (service as any).writeToExcel(excelData, surveyName);
      expect(writeFileSpy).toHaveBeenCalled();
    });
  });

  describe('generateDownloadData', () => {
    it('should process data without parentSurveyId', () => {
      const mockComponent = {
        currentpage: 1,
        recordsPerPage: 10,
        parentSurveyId: null,
        url_id: '22',
        stateMap: new Map([[1, 'State1']]),
        districtMap: new Map(),
        tehsilMap: new Map(),
        blockMap: new Map(),
        grampanchayatMap: new Map(),
        villageMap: new Map(),
        cropMap: new Map([['001', 'Crop1']]),
        seasonMap: new Map([[1, 'Season1']]),
        yearMap: new Map([[2023, '2023']]),
        userPhoneMap: { 1: '123456' },
        fileHeaders: [{ field: 'state', type: 'lkp_state' }, { field: 'crop', type: 'product_crop' }],
        typeFields: [],
        noOfVisit: null,
      };
      const surveyData = [{ state: 1, crop: '001', user_id: 1, approved_reject: '0' }];
      const result = (service as any).generateDownloadData(mockComponent, surveyData);
      expect(result[0].sno).toBe(1);
      expect(result[0].user_phone).toBe('123456');
      expect(result[0].approved_reject).toBe('Rejected');
    });

    it('should process data with parentSurveyId', () => {
      const mockComponent = {
        currentpage: 1,
        recordsPerPage: 10,
        parentSurveyId: true,
        url_id: '22',
        stateMap: new Map([[1, 'State1']]),
        districtMap: new Map([[1, 'District1']]),
        tehsilMap: new Map([[1, 'Tehsil1']]),
        blockMap: new Map([[1, 'Block1']]),
        grampanchayatMap: new Map([[1, 'GP1']]),
        villageMap: new Map([[1, 'Village1']]),
        cropMap: new Map([['001', 'Crop1']]),
        seasonMap: new Map([[1, 'Season1']]),
        yearMap: new Map([[2023, '2023']]),
        userPhoneMap: { 1: '123456' },
        fileHeaders: [{ field: 'state_id', type: 'lkp_state' }, { field: 'crop_id', type: 'product_crop' }],
        typeFields: [],
        noOfVisit: 1,
      };
      const surveyData = [{ state_id: 1, dist_id: 1, tehsil_id: 1, block_id: 1, gp_id: 1, village_id: 1, crop_id: '001', case_ID: 'case1', parent: '{"approved_reject": "1"}', user_id: 1 }];
      const result = (service as any).generateDownloadData(mockComponent, surveyData);
      expect(result[0].state_id).toBe('State1');
      expect(result[0].crop_id).toBe('Crop1');
      expect(result[0].totalVisist).toBeUndefined();
    });
  });

  describe('processParentSurveyData', () => {
    it('should process parent data and filter by noOfVisit', () => {
      const tableData = [
        { case_ID: '1', parent: '{"key": "val"}' },
        { case_ID: '1' },
      ];
      const result = (service as any).processParentSurveyData(tableData, 2);
      expect(result.length).toBe(2);
      expect(result[0].totalVisist).toBe(2);
      expect(result[0].no_of_visit).toBe(2);
    });

    it('should filter out if noOfVisit not matching', () => {
      const tableData = [{ case_ID: '1' }];
      const result = (service as any).processParentSurveyData(tableData, 2);
      expect(result.length).toBe(0);
    });
  });

  describe('processHeaderFields', () => {
    it('should map fields correctly', () => {
      const data = { crop: '001', season: 1, financial_year: 2023 };
      const fieldMap = { crop: new Map([['001', 'Crop1']]), season: new Map([[1, 'Season1']]), financial_year: new Map([[2023, '2023']]) };
      const mockComponent = { 
        parentSurveyId: false, 
        url_id: '22', 
        fileHeaders: [{ field: 'crop', type: 'product_crop' }, { field: 'season', type: 'lkp_season' }, { field: 'financial_year', type: 'lkp_year' }],
        cropMap: new Map([['001', 'Crop1']]),
        seasonMap: new Map([[1, 'Season1']]),
        yearMap: new Map([[2023, '2023']]),
      };
      (service as any).processHeaderFields(data, fieldMap, mockComponent);
      expect(data.crop).toBe('Crop1');
      expect(data.season).toBe('Season1');
      expect(data.financial_year).toBe('2023');
    });

    it('should handle parent data', () => {
      const data = { parent: { crop: '001' } };
      const fieldMap = { crop: new Map([['001', 'Crop1']]) };
      const mockComponent = { 
        parentSurveyId: true, 
        url_id: '22', 
        fileHeaders: [{ field: 'crop', type: 'product_crop' }],
        cropMap: new Map([['001', 'Crop1']]),
      };
      (service as any).processHeaderFields(data, fieldMap, mockComponent);
      expect(data.parent.crop).toBe('Crop1');
    });
  });

  describe('applyParentSurveyMappings', () => {
    it('should apply mappings to data', () => {
      const data = { state_id: 1, dist_id: 1, tehsil_id: 1, block_id: 1, gp_id: 1, village_id: 1, crop_id: '001' };
      const mockComponent = {
        stateMap: new Map([[1, 'State1']]),
        districtMap: new Map([[1, 'District1']]),
        tehsilMap: new Map([[1, 'Tehsil1']]),
        blockMap: new Map([[1, 'Block1']]),
        grampanchayatMap: new Map([[1, 'GP1']]),
        villageMap: new Map([[1, 'Village1']]),
        cropMap: new Map([['001', 'Crop1']]),
      };
      (service as any).applyParentSurveyMappings(data, mockComponent);
      expect(data.state_id).toBe('State1');
      expect(data.crop_id).toBe('Crop1');
    });
  });

  describe('buildOtherColumns', () => {
    it('should build other columns for surveyId 6', () => {
      const mockComponent = { surveyId: 6, selectedOtherActivity: [{ value: 1 }] };
      const result = (service as any).buildOtherColumns(mockComponent);
      expect(result[0].field).toBe('field_759');
      expect(result[0].value).toEqual([1]);
    });

    it('should build for surveyId 2 with intimationNo', () => {
      const mockComponent = { surveyId: 2, surveyIntimationNo: '123' };
      const result = (service as any).buildOtherColumns(mockComponent);
      expect(result[0].field).toBe('field_779');
      expect(result[0].value).toEqual(['123']);
    });

    it('should build for searchCaseId', () => {
      const mockComponent = { searchCaseId: 'case1' };
      const result = (service as any).buildOtherColumns(mockComponent);
      expect(result[0].field).toBe('case_ID');
      expect(result[0].value).toEqual(['case1']);
    });

    it('should return empty if no conditions met', () => {
      const mockComponent = {};
      const result = (service as any).buildOtherColumns(mockComponent);
      expect(result).toEqual([]);
    });
  });
});