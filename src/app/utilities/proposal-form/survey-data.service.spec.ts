import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';

import { SurveyDataService } from './survey-data.service';
import { CoreService } from '../core.service';
import { FilterService } from '../filter.service';
import { RowColumnService } from './row-column.service';

class MockCoreService {
  data_post = jest.fn().mockResolvedValue({ status: 1 });
  dashboard_post = jest.fn().mockResolvedValue({ status: 1 });
  clone = jest.fn(obj => JSON.parse(JSON.stringify(obj)));
  toast = jest.fn();
  uniqueList = jest.fn((arr, key) => [...new Set(arr.map((item: any) => item[key]))]);
}

class MockFilterService {
  districts = [{ district_id: '1' }];
  tehsils = [{ tehsil_id: '1' }];
}

class MockRowColumnService {
  generateColDef = jest.fn();
  generateRowData = jest.fn();
}

describe('SurveyDataService', () => {
  let service: SurveyDataService;
  let coreService: any;
  let filterService: any;
  let rowColumnService: any;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        SurveyDataService,
        { provide: CoreService, useClass: MockCoreService },
        { provide: FilterService, useClass: MockFilterService },
        { provide: RowColumnService, useClass: MockRowColumnService },
      ],
    });

    service = TestBed.inject(SurveyDataService);
    coreService = TestBed.inject(CoreService);
    filterService = TestBed.inject(FilterService);
    rowColumnService = TestBed.inject(RowColumnService);
  });

  it('should create the component', () => {
    expect(service).toBeTruthy();
  });

  describe('getSurveyFields', () => {
    it('should fetch survey fields', async () => {
      const component = { lookupLoader: 0, surveyId: 1, surveyFields: [] };
      coreService.data_post.mockResolvedValueOnce({ status: 1, fields: [{ slno: 2, type: 'lkp_season' }, { slno: 1, type: 'lkp_year' }] });
      await service.getSurveyFields(component);
      expect(component.surveyFields).toEqual([{ slno: 1, type: 'lkp_year' }, { slno: 2, type: 'lkp_season' }]);
    });

    it('should handle status not 1', async () => {
      const component = { lookupLoader: 0, surveyId: 1, surveyFields: [] };
      coreService.data_post.mockResolvedValueOnce({ status: 0, fields: [] });
      await service.getSurveyFields(component);
      expect(component.surveyFields).toEqual([]);
    });

    it('should handle error', async () => {
      const component = { lookupLoader: 0, surveyId: 1, surveyFields: [] };
      coreService.data_post.mockRejectedValueOnce(new Error('Error'));
      const toastSpy = jest.spyOn(coreService, 'toast');
      await service.getSurveyFields(component);
      expect(toastSpy).toHaveBeenCalledWith('error', 'Error fetching survey fields');
      expect(component.surveyFields).toEqual([]);
    });

    it('should filter fields by type', async () => {
      const component = { lookupLoader: 0, surveyId: 1, surveyFields: [] };
      coreService.data_post.mockResolvedValueOnce({ 
        status: 1, 
        fields: [
          { slno: 3, type: 'other' },
          { slno: 1, type: 'lkp_year' },
          { slno: 2, type: 'lkp_season' },
          { slno: 4, type: 'product_crop' }
        ] 
      });
      await service.getSurveyFields(component);
      expect(component.surveyFields).toEqual([
        { slno: 1, type: 'lkp_year' },
        { slno: 2, type: 'lkp_season' },
        { slno: 4, type: 'product_crop' }
      ]);
    });

    it('should increment and decrement lookupLoader', async () => {
      const component = { lookupLoader: 0, surveyId: 1, surveyFields: [] };
      coreService.data_post.mockResolvedValueOnce({ status: 1, fields: [] });
      await service.getSurveyFields(component);
      expect(component.lookupLoader).toBe(0); // Back to original after finally
    });
  });

  describe('getSurveyData', () => {
    it('should fetch survey data', async () => {
      const component: any = { 
        selectedYear: [2023], 
        selectedSeason: [1], 
        statesData: [{ state_id: '1' }], 
        loading: 0, 
        selectedState: [], 
        selectedDist: [], 
        selectedBlock: [], 
        user: { user_role: '1' },
        selectednotifiedUnits: [],
        dataPurpose: 'get_surveydata',
        crop_column: 'crop',
        dateType: 'date',
        selectedCrop: '1',
        selectedUser: [],
        selectedFromDate: {startDate: {format: jest.fn().mockReturnValue('2023-01-01')}, endDate: {format: jest.fn().mockReturnValue('2023-12-31')}},
        currentpage: 1,
        recordsPerPage: 10,
        resetData: jest.fn(),
        fieldResponse: null,
        parentSurveyId: null,
        url_id: '22',
        datalabel: {},
        surveyData: [],
        locationData: null,
        toalRecord: 0,
        showDraft: false,
        showDataLabels: false,
        fields: [],
        parentFields: []
      };
      const surveyId = 1;
      coreService.data_post.mockResolvedValueOnce({ status: 1, fields: [{ slno: 1 }] });
      coreService.data_post.mockResolvedValueOnce({ status: 1, surveydata: [{ id: 1 }], total_surveydata: 5 });
      await service.getSurveyData(component, surveyId);
      expect(component.surveyData).toEqual([{ id: 1 }]);
      expect(component.toalRecord).toBe(5);
    });

    it('should toast if no year selected', async () => {
      const component: any = { 
        selectedYear: [], 
        selectedSeason: [1], 
        loading: 0, 
        resetData: jest.fn(),
        surveyData: [],
        datalabel: {}
      };
      const surveyId = 1;
      const toastSpy = jest.spyOn(coreService, 'toast');
      await service.getSurveyData(component, surveyId);
      expect(toastSpy).toHaveBeenCalledWith('warning', 'Please select a year and season');
      expect(component.loading).toBe(0); // Not incremented
    });

    it('should toast if no season selected', async () => {
      const component: any = { 
        selectedYear: [2023], 
        selectedSeason: [], 
        loading: 0, 
        resetData: jest.fn(),
        surveyData: [],
        datalabel: {}
      };
      const surveyId = 1;
      const toastSpy = jest.spyOn(coreService, 'toast');
      await service.getSurveyData(component, surveyId);
      expect(toastSpy).toHaveBeenCalledWith('warning', 'Please select a year and season');
    });

    it('should toast if no location assigned for role >2', async () => {
      const component: any = { 
        selectedYear: [2023], 
        selectedSeason: [1], 
        statesData: [], // Empty states
        loading: 0, 
        selectedState: [], 
        selectedDist: [], 
        selectedBlock: [], 
        user: { user_role: '3' },
        selectednotifiedUnits: [],
        dataPurpose: 'get_surveydata',
        crop_column: 'crop',
        dateType: 'date',
        selectedCrop: '1',
        selectedUser: [],
        selectedFromDate: {startDate: {format: jest.fn().mockReturnValue('2023-01-01')}, endDate: {format: jest.fn().mockReturnValue('2023-12-31')}},
        currentpage: 1,
        recordsPerPage: 10,
        resetData: jest.fn(),
        fieldResponse: null,
        parentSurveyId: null,
        url_id: '22',
        datalabel: {},
        surveyData: [],
        locationData: null,
        toalRecord: 0,
        showDraft: false,
        showDataLabels: false,
        fields: [],
        parentFields: []
      };
      const surveyId = 1;
      const toastSpy = jest.spyOn(coreService, 'toast');
      await service.getSurveyData(component, surveyId);
      expect(toastSpy).toHaveBeenCalledWith('warn', 'No data is available for the selected filters');
    });

    it('should handle error in Promise.all', async () => {
      const component: any = { 
        selectedYear: [2023], 
        selectedSeason: [1], 
        statesData: [{ state_id: '1' }], 
        loading: 0, 
        selectedState: [{ state_id: '1' }], 
        selectedDist: [], 
        selectedBlock: [], 
        user: { user_role: '1' },
        selectednotifiedUnits: [],
        dataPurpose: 'get_surveydata',
        crop_column: 'crop',
        dateType: 'date',
        selectedCrop: '1',
        selectedUser: [],
        selectedFromDate: {startDate: {format: jest.fn().mockReturnValue('2023-01-01')}, endDate: {format: jest.fn().mockReturnValue('2023-12-31')}},
        currentpage: 1,
        recordsPerPage: 10,
        resetData: jest.fn(),
        fieldResponse: null,
        parentSurveyId: null,
        url_id: '22',
        datalabel: {},
        surveyData: [],
        locationData: null,
        toalRecord: 0,
        showDraft: false,
        showDataLabels: false,
        fields: [],
        parentFields: []
      };
      const surveyId = 1;
      const toastSpy = jest.spyOn(coreService, 'toast');
      coreService.data_post.mockRejectedValueOnce(new Error('Error'));
      await service.getSurveyData(component, surveyId);
      expect(toastSpy).toHaveBeenCalledWith('warn', 'Error fetching data');
      expect(component.loading).toBe(0);
    });

    it('should set showDataLabels to true on success', async () => {
      const component: any = { 
        selectedYear: [2023], 
        selectedSeason: [1], 
        statesData: [{ state_id: '1' }], 
        loading: 0, 
        selectedState: [{ state_id: '1' }], 
        selectedDist: [], 
        selectedBlock: [], 
        user: { user_role: '1' },
        selectednotifiedUnits: [],
        dataPurpose: 'get_view_product_details',
        crop_column: 'crop',
        dateType: 'date',
        selectedCrop: '1',
        selectedUser: [],
        selectedFromDate: {startDate: {format: jest.fn().mockReturnValue('2023-01-01')}, endDate: {format: jest.fn().mockReturnValue('2023-12-31')}},
        currentpage: 1,
        recordsPerPage: 10,
        resetData: jest.fn(),
        fieldResponse: null,
        parentSurveyId: null,
        url_id: '22',
        datalabel: {},
        surveyData: [],
        locationData: null,
        toalRecord: 0,
        showDraft: false,
        showDataLabels: false,
        fields: [],
        parentFields: []
      };
      const surveyId = 1;
      coreService.data_post
        .mockResolvedValueOnce({ status: 1, fields: [] })
        .mockResolvedValueOnce({ status: 1, surveydata: [], total_records: 0 });
      await service.getSurveyData(component, surveyId);
      expect(component.showDataLabels).toBe(true);
      expect(component.toalRecord).toBe(0);
    });

    it('should set showDraft true for get_draft_surveydata', async () => {
      const component: any = { 
        selectedYear: [2023], 
        selectedSeason: [1], 
        statesData: [{ state_id: '1' }], 
        loading: 0, 
        selectedState: [{ state_id: '1' }], 
        selectedDist: [], 
        selectedBlock: [], 
        user: { user_role: '1' },
        selectednotifiedUnits: [],
        dataPurpose: 'get_draft_surveydata',
        crop_column: 'crop',
        dateType: 'date',
        selectedCrop: '1',
        selectedUser: [],
        selectedFromDate: {startDate: {format: jest.fn().mockReturnValue('2023-01-01')}, endDate: {format: jest.fn().mockReturnValue('2023-12-31')}},
        currentpage: 1,
        recordsPerPage: 10,
        resetData: jest.fn(),
        fieldResponse: null,
        parentSurveyId: null,
        url_id: '22',
        datalabel: {},
        surveyData: [],
        locationData: null,
        toalRecord: 0,
        showDraft: false,
        showDataLabels: false,
        fields: [],
        parentFields: []
      };
      const surveyId = 1;
      coreService.data_post
        .mockResolvedValueOnce({ status: 1, fields: [] })
        .mockResolvedValueOnce({ status: 1, surveydata: [{ id: 1 }] });
      await service.getSurveyData(component, surveyId);
      expect(component.showDraft).toBe(true);
    });
  });

  describe('getSearchSurveyData', () => {
    it('should fetch search survey data', async () => {
      const component: any = { 
        selectedClient: [2000], 
        loading: 0, 
        fields: [{}], 
        user: { user_role: '1' },
        searchPurpose: 'search_surveydata',
        dataPurpose: 'get_surveydata',
        selectedYear: 2023,
        selectedSeason: 1,
        crop_column: 'crop',
        dateType: 'date',
        selectedUser: [],
        selectedFromDate: {startDate: {format: jest.fn().mockReturnValue('2023-01-01')}, endDate: {format: jest.fn().mockReturnValue('2023-12-31')}},
        currentpage: 1,
        recordsPerPage: 10,
        datalabel: {},
        surveyData: [],
        locationData: null,
        toalRecord: 0,
        showDraft: false,
        showDataLabels: false
      };
      const surveyId = 1;
      coreService.dashboard_post.mockResolvedValueOnce({ status: 1, surveydata: [{ id: 1 }], total_surveydata: 5 });
      await service.getSearchSurveyData(component, surveyId);
      expect(component.surveyData).toEqual([{ id: 1 }]);
      expect(rowColumnService.generateColDef).toHaveBeenCalled();
    });

    it('should toast if no client selected and no unit_id', async () => {
      const component: any = { 
        selectedClient: [], 
        loading: 0, 
        user: { unit_id: null },
        searchPurpose: 'search_surveydata',
        dataPurpose: 'get_surveydata',
        selectedYear: 2023,
        selectedSeason: 1,
        crop_column: 'crop',
        dateType: 'date',
        selectedUser: [],
        selectedFromDate: {startDate: {format: jest.fn().mockReturnValue('2023-01-01')}, endDate: {format: jest.fn().mockReturnValue('2023-12-31')}},
        currentpage: 1,
        recordsPerPage: 10,
        datalabel: {},
        surveyData: [],
        locationData: null,
        toalRecord: 0,
        showDraft: false,
        showDataLabels: false
      };
      const surveyId = 1;
      const toastSpy = jest.spyOn(coreService, 'toast');
      await service.getSearchSurveyData(component, surveyId);
      expect(toastSpy).toHaveBeenCalledWith('warn', 'Please select a client');
    });

    it('should handle error', async () => {
      const component: any = { 
        selectedClient: [2000], 
        loading: 0, 
        fields: [{}], 
        user: { user_role: '1' },
        searchPurpose: 'search_surveydata',
        dataPurpose: 'get_surveydata',
        selectedYear: 2023,
        selectedSeason: 1,
        crop_column: 'crop',
        dateType: 'date',
        selectedUser: [],
        selectedFromDate: {startDate: {format: jest.fn().mockReturnValue('2023-01-01')}, endDate: {format: jest.fn().mockReturnValue('2023-12-31')}},
        currentpage: 1,
        recordsPerPage: 10,
        datalabel: {},
        surveyData: [],
        locationData: null,
        toalRecord: 0,
        showDraft: false,
        showDataLabels: false
      };
      const surveyId = 1;
      const toastSpy = jest.spyOn(coreService, 'toast');
      coreService.dashboard_post.mockRejectedValueOnce(new Error('Error'));
      await service.getSearchSurveyData(component, surveyId);
      expect(toastSpy).toHaveBeenCalledWith('warn', 'Error fetching data');
      expect(component.showDataLabels).toBe(false);
    });

    it('should set showDraft true for get_draft_surveydata', async () => {
      const component: any = { 
        selectedClient: [2000], 
        loading: 0, 
        fields: [{}], 
        user: { user_role: '1' },
        searchPurpose: 'get_draft_surveydata',
        dataPurpose: 'get_draft_surveydata',
        selectedYear: 2023,
        selectedSeason: 1,
        crop_column: 'crop',
        dateType: 'date',
        selectedUser: [],
        selectedFromDate: {startDate: {format: jest.fn().mockReturnValue('2023-01-01')}, endDate: {format: jest.fn().mockReturnValue('2023-12-31')}},
        currentpage: 1,
        recordsPerPage: 10,
        datalabel: {},
        surveyData: [],
        locationData: null,
        toalRecord: 0,
        showDraft: false,
        showDataLabels: false
      };
      const surveyId = 1;
      coreService.dashboard_post.mockResolvedValueOnce({ status: 1, surveydata: [{ id: 1 }] });
      await service.getSearchSurveyData(component, surveyId);
      expect(component.showDraft).toBe(true);
    });

    it('should set datalabel from response snake_case', async () => {
      const component: any = { 
        selectedClient: [2000], 
        loading: 0, 
        fields: [{}], 
        user: { user_role: '1' },
        searchPurpose: 'search_surveydata',
        dataPurpose: 'get_surveydata',
        selectedYear: 2023,
        selectedSeason: 1,
        crop_column: 'crop',
        dateType: 'date',
        selectedUser: [],
        selectedFromDate: {startDate: {format: jest.fn().mockReturnValue('2023-01-01')}, endDate: {format: jest.fn().mockReturnValue('2023-12-31')}},
        currentpage: 1,
        recordsPerPage: 10,
        datalabel: {},
        surveyData: [],
        locationData: null,
        toalRecord: 0,
        showDraft: false,
        showDataLabels: false
      };
      const surveyId = 1;
      coreService.dashboard_post.mockResolvedValueOnce({ 
        status: 1, 
        surveydata: [{ id: 1 }], 
        total_uploads: 10 
      });
      await service.getSearchSurveyData(component, surveyId);
      expect(component.datalabel.totalUploads).toBe(10);
    });

    it('should not call generateColDef if no fields', async () => {
      const component: any = { 
        selectedClient: [2000], 
        loading: 0, 
        fields: [], 
        user: { user_role: '1' },
        searchPurpose: 'search_surveydata',
        dataPurpose: 'get_surveydata',
        selectedYear: 2023,
        selectedSeason: 1,
        crop_column: 'crop',
        dateType: 'date',
        selectedUser: [],
        selectedFromDate: {startDate: {format: jest.fn().mockReturnValue('2023-01-01')}, endDate: {format: jest.fn().mockReturnValue('2023-12-31')}},
        currentpage: 1,
        recordsPerPage: 10,
        datalabel: {},
        surveyData: [],
        locationData: null,
        toalRecord: 0,
        showDraft: false,
        showDataLabels: false
      };
      const surveyId = 1;
      coreService.dashboard_post.mockResolvedValueOnce({ status: 1, surveydata: [{ id: 1 }] });
      await service.getSearchSurveyData(component, surveyId);
      expect(rowColumnService.generateColDef).not.toHaveBeenCalled();
    });
  });

  describe('onPageTrigger', () => {
    it('should trigger page data', async () => {
      const component = { 
        loading: 0, 
        selectedState: [], 
        selectedDist: [], 
        selectedBlock: [], 
        statesData: [{ state_id: '1' }], 
        user: { user_role: '1' },
        selectednotifiedUnits: [],
        selectedYear: 2023,
        selectedSeason: 1,
        crop_column: 'crop',
        dateType: 'date',
        selectedCrop: '1',
        selectedUser: [],
        selectedFromDate: {startDate: {format: jest.fn().mockReturnValue('2023-01-01')}, endDate: {format: jest.fn().mockReturnValue('2023-12-31')}},
        surveyId: 1,
        dataPurpose: 'get_surveydata',
        currentpage: 1,
        recordsPerPage: 10,
        datalabel: {},
        surveyData: [],
        toalRecord: 0
      };
      const env = { page_no: 2, records_per_page: 20 };
      coreService.data_post.mockResolvedValueOnce({ status: 1, surveydata: [{ id: 1 }], total_surveydata: 10 });
      await service.onPageTrigger(component, env);
      expect(rowColumnService.generateRowData).toHaveBeenCalledWith(component);
      expect(component.currentpage).toBe(2);
      expect(component.recordsPerPage).toBe(20);
    });

    it('should handle role >2 by using all locations if empty', async () => {
      const component = { 
        loading: 0, 
        selectedState: [], 
        selectedDist: [], 
        selectedBlock: [], 
        statesData: [{ state_id: '1' }, { state_id: '2' }], 
        user: { user_role: '3' },
        selectednotifiedUnits: [],
        selectedYear: 2023,
        selectedSeason: 1,
        crop_column: 'crop',
        dateType: 'date',
        selectedCrop: '1',
        selectedUser: [],
        selectedFromDate: {startDate: {format: jest.fn().mockReturnValue('2023-01-01')}, endDate: {format: jest.fn().mockReturnValue('2023-12-31')}},
        surveyId: 1,
        dataPurpose: 'get_surveydata',
        currentpage: 1,
        recordsPerPage: 10,
        datalabel: {},
        surveyData: [],
        toalRecord: 0
      };
      const env = { page_no: 2, records_per_page: 20 };
      coreService.data_post.mockResolvedValueOnce({ status: 1, surveydata: [{ id: 1 }] });
      await service.onPageTrigger(component, env);
      expect(coreService.data_post).toHaveBeenCalledWith(expect.objectContaining({
        states: ['1', '2'],
        districts: ['1'],
        tehsils: ['1']
      }));
    });

    it('should handle error', async () => {
      const component = { 
        loading: 0, 
        selectedState: [{ state_id: '1' }], 
        selectedDist: [], 
        selectedBlock: [], 
        statesData: [{ state_id: '1' }], 
        user: { user_role: '1' },
        selectednotifiedUnits: [],
        selectedYear: 2023,
        selectedSeason: 1,
        crop_column: 'crop',
        dateType: 'date',
        selectedCrop: '1',
        selectedUser: [],
        selectedFromDate: {startDate: {format: jest.fn().mockReturnValue('2023-01-01')}, endDate: {format: jest.fn().mockReturnValue('2023-12-31')}},
        surveyId: 1,
        dataPurpose: 'get_surveydata',
        currentpage: 1,
        recordsPerPage: 10,
        datalabel: {},
        surveyData: [],
        toalRecord: 0
      };
      const env = { page_no: 2, records_per_page: 20 };
      coreService.data_post.mockRejectedValueOnce(new Error('Error'));
      const toastSpy = jest.spyOn(coreService, 'toast');
      await service.onPageTrigger(component, env);
      expect(toastSpy).toHaveBeenCalledWith('warn', 'Error fetching data');
    });

    it('should set datalabel from snake_case', async () => {
      const component = { 
        loading: 0, 
        selectedState: [{ state_id: '1' }], 
        selectedDist: [], 
        selectedBlock: [], 
        statesData: [{ state_id: '1' }], 
        user: { user_role: '1' },
        selectednotifiedUnits: [],
        selectedYear: 2023,
        selectedSeason: 1,
        crop_column: 'crop',
        dateType: 'date',
        selectedCrop: '1',
        selectedUser: [],
        selectedFromDate: {startDate: {format: jest.fn().mockReturnValue('2023-01-01')}, endDate: {format: jest.fn().mockReturnValue('2023-12-31')}},
        surveyId: 1,
        dataPurpose: 'get_surveydata',
        currentpage: 1,
        recordsPerPage: 10,
        datalabel: { totalApproved: 0 },
        surveyData: [],
        toalRecord: 0
      };
      const env = { page_no: 2, records_per_page: 20 };
      coreService.data_post.mockResolvedValueOnce({ 
        status: 1, 
        surveydata: [{ id: 1 }], 
        total_approved: 5 
      });
      await service.onPageTrigger(component, env);
      expect(component.datalabel.totalApproved).toBe(5);
    });
  });

  describe('buildOtherColumns', () => {
    it('should build empty if no conditions met', () => {
      const component = { surveyId: 1, surveyIntimationNo: null, searchCaseId: null, selectedOtherActivity: null };
      const result = (service as any).buildOtherColumns(component);
      expect(result).toEqual([]);
    });

    it('should add field_759 for surveyId=6', () => {
      const component = { surveyId: 6, selectedOtherActivity: [{ value: 'act1' }], surveyIntimationNo: null, searchCaseId: null };
      const result = (service as any).buildOtherColumns(component);
      expect(result).toEqual([{ field: 'field_759', value: ['act1'] }]);
    });

    it('should add field_779 for surveyId=2 with intimation', () => {
      const component = { surveyId: 2, surveyIntimationNo: 'INT123', searchCaseId: null, selectedOtherActivity: null };
      const result = (service as any).buildOtherColumns(component);
      expect(result).toEqual([{ field: 'field_779', value: ['INT123'] }]);
    });

    it('should add case_ID for searchCaseId', () => {
      const component = { surveyId: 1, surveyIntimationNo: null, searchCaseId: 'CASE123', selectedOtherActivity: null };
      const result = (service as any).buildOtherColumns(component);
      expect(result).toEqual([{ field: 'case_ID', value: ['CASE123'] }]);
    });

    it('should handle empty values', () => {
      const component = { surveyId: 6, selectedOtherActivity: [], surveyIntimationNo: null, searchCaseId: null };
      const result = (service as any).buildOtherColumns(component);
      expect(result).toEqual([{ field: 'field_759', value: [] }]);
    });
  });

  describe('buildRequest', () => {
    it('should build request with selected values', () => {
      const component = { 
        selectedState: [{ state_id: '1' }], 
        selectedDist: [{ district_id: '1' }], 
        selectedBlock: [{ tehsil_id: '1' }], 
        selectednotifiedUnits: [{ notified_id: '1' }], 
        selectedYear: 2023, 
        selectedSeason: 1, 
        crop_column: 'crop', 
        dateType: 'date', 
        selectedCrop: '1', 
        selectedUser: [{ user_id: '1' }], 
        selectedFromDate: { startDate: { format: () => '2023-01-01' }, endDate: { format: () => '2023-12-31' } }, 
        surveyId: 1, 
        dataPurpose: 'get_surveydata', 
        currentpage: 1, 
        recordsPerPage: 10 
      };
      const other_columns = [{ field: 'test', value: ['val'] }];
      const result = (service as any).buildRequest(component, other_columns);
      expect(result).toMatchObject({
        purpose: 'get_surveydata',
        client_id: ["2000"],
        survey_id: 1,
        states: ['1'],
        districts: ['1'],
        tehsils: ['1'],
        crop_id: '1',
        user_id: ['1'],
        start_date: '2023-01-01',
        end_date: '2023-12-31',
        agency_id: null,
        years: [2023],
        seasons: [1],
        crop_column: 'crop',
        notified_units: ['1'],
        other_columns: [{ field: 'test', value: ['val'] }],
        pagination: { page_no: 1, records_per_page: 10 },
        date_type: 'date'
      });
    });

    it('should handle empty selected arrays', () => {
      const component = { 
        selectedState: [], 
        selectedDist: [], 
        selectedBlock: [], 
        selectednotifiedUnits: [], 
        selectedYear: 2023, 
        selectedSeason: 1, 
        crop_column: 'crop', 
        dateType: 'date', 
        selectedCrop: null, 
        selectedUser: [], 
        selectedFromDate: { startDate: null, endDate: null }, 
        surveyId: 1, 
        dataPurpose: 'get_surveydata', 
        currentpage: 1, 
        recordsPerPage: 10 
      };
      const other_columns: any = [];
      const result = (service as any).buildRequest(component, other_columns);
      expect(result.states).toEqual([]);
      expect(result.districts).toEqual([]);
      expect(result.tehsils).toEqual([]);
      expect(result.crop_id).toBe(null);
      expect(result.start_date).toBe(undefined);
      expect(result.end_date).toBe(undefined);
      expect(result.user_id).toEqual([]);
      expect(result.notified_units).toEqual([]);
    });
  });

  describe('processResponses', () => {
    it('should set toalRecord from total_records for get_view_product_details', () => {
      const component = { 
        parentSurveyId: null, 
        fieldResponse: null, 
        fields: [], 
        parentFields: [], 
        showDataLabels: false, 
        surveyData: [], 
        locationData: null, 
        toalRecord: 0, 
        showDraft: false, 
        datalabel: {}, 
        url_id: '22', 
        dataPurpose: 'get_view_product_details' 
      };
      const responses = [
        { status: 1, fields: [] },
        { status: 1, surveydata: [{ id: 1 }], total_records: 7 }
      ];
      (service as any).processResponses(component, responses);
      expect(component.toalRecord).toBe(7);
    });
  });

  describe('processSurveyData', () => {
    it('should return surveydata as-is if no parentSurveyId', () => {
      const component = { parentSurveyId: null };
      const surveydata = [{ id: 1 }];
      const result = (service as any).processSurveyData(component, surveydata);
      expect(result).toEqual([{ id: 1 }]);
    });

    it('should merge parent data if parentSurveyId exists', () => {
      const component = { parentSurveyId: 2 };
      const surveydata = [{
        id: 1,
        parent: { field_100: 'parent_value', other: 'ignore' },
        child: { field_200: 'child_value' }
      }];
      const result = (service as any).processSurveyData(component, surveydata);
      expect(result[0]).toMatchObject({
        id: 1,
        child: { field_200: 'child_value' },
        field_100: 'parent_value' // Merged field_
      });
      expect(result[0].other).toBeUndefined(); // Ignored non-field_
    });

    it('should handle no parent', () => {
      const component = { parentSurveyId: 2 };
      const surveydata = [{ id: 1 }]; // No parent
      const result = (service as any).processSurveyData(component, surveydata);
      expect(result).toEqual([{ id: 1 }]);
    });

    it('should handle empty surveydata', () => {
      const component = { parentSurveyId: 2 };
      const result = (service as any).processSurveyData(component, []);
      expect(result).toEqual([]);
    });
  });
});