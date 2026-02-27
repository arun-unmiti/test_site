import { ComponentFixture, TestBed, fakeAsync, tick, flushMicrotasks, flush } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import * as XLSX from 'xlsx';
import * as moment from 'moment';

import { BlukDataStatusChangeComponent } from './bluk-data-status-change.component';
import { CoreService } from '../utilities/core.service';
import { FeatureToggleService } from '../shared/services/feature-toggle.service';
import { UserDetailService } from '../auth/user-detail.service';
import { InsightsService } from '../utilities/insights.service';
import { environment, ProjectContext } from '../../environments/environment';

// Mock environment
jest.mock('../../environments/environment', () => ({
  environment: {
    projectConfigs: {
      munichre: { assetsFolder: '/assets/munichre' },
      saksham: { assetsFolder: '/assets/saksham' },
      custom: { assetsFolder: '/assets/custom' },
      testContext: { assetsFolder: '/assets/test/' }
    }
  }
}));

// Mock XLSX
jest.mock('xlsx', () => ({
  read: jest.fn(),
  utils: {
    sheet_to_json: jest.fn(),
    aoa_to_sheet: jest.fn(),
    book_new: jest.fn(),
    book_append_sheet: jest.fn(),
  },
  writeFile: jest.fn(),
}));

// Mock moment
jest.mock('moment', () => () => ({
  format: jest.fn().mockReturnValue('20230101'),
}));

describe('BlukDataStatusChangeComponent', () => {
  let component: BlukDataStatusChangeComponent;
  let fixture: ComponentFixture<BlukDataStatusChangeComponent>;
  let core: jest.Mocked<CoreService>;
  let featureToggle: jest.Mocked<FeatureToggleService>;
  let userService: jest.Mocked<UserDetailService>;
  let insightsService: jest.Mocked<InsightsService>;
  let router: any; // Use 'any' to allow assignment to url

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BlukDataStatusChangeComponent],
      providers: [
        { provide: CoreService, useValue: { data_post: jest.fn(), post: jest.fn(), toast: jest.fn() } },
        { provide: FeatureToggleService, useValue: { getContext: jest.fn().mockReturnValue('munichre' as ProjectContext) } },
        { provide: UserDetailService, useValue: { getcsrfTokenName: jest.fn().mockReturnValue('csrf_name'), getcsrfToken: jest.fn().mockReturnValue('csrf_token') } },
        { provide: Router, useValue: { url: '/cls' } as any }, // 'as any' to allow url assignment in tests
        { provide: InsightsService, useValue: { logException: jest.fn() } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(BlukDataStatusChangeComponent);
    component = fixture.componentInstance;
    core = TestBed.inject(CoreService) as jest.Mocked<CoreService>;
    featureToggle = TestBed.inject(FeatureToggleService) as jest.Mocked<FeatureToggleService>;
    userService = TestBed.inject(UserDetailService) as jest.Mocked<UserDetailService>;
    insightsService = TestBed.inject(InsightsService) as jest.Mocked<InsightsService>;
    router = TestBed.inject(Router) as any;
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  describe('constructor', () => {
    it('should initialize statuses', () => {
      expect(component.statuses).toEqual([
        { label: 'Approve', value: 'approve_data' },
        { label: 'Reject', value: 'reject_data' },
        { label: 'Revert', value: 'revert_approve_data' },
      ]);
    });

    it('should set projectContext and assetsFolder', () => {
      featureToggle.getContext.mockReturnValue('saksham' as ProjectContext);
      const newComponent = new BlukDataStatusChangeComponent(core as any, router, featureToggle as any, userService as any, insightsService as any);
      expect(newComponent.projectContext).toBe('saksham');
      expect(newComponent.assetsFolder).toBe('/assets/saksham');
    });

    it('should set projectContext and assetsFolder for custom', () => {
      featureToggle.getContext.mockReturnValue('custom' as ProjectContext);
      const newComponent = new BlukDataStatusChangeComponent(core as any, router, featureToggle as any, userService as any, insightsService as any);
      expect(newComponent.projectContext).toBe('custom');
      expect(newComponent.assetsFolder).toBe('/assets/custom');
    });
  });

  describe('ngOnInit', () => {
    beforeEach(() => {
      core.data_post.mockResolvedValue({ status: 1, fields: [{ field_id: 1 }] });
    });

    it('should set for chm route', () => {
      router.url = '/chm';
      const spy = jest.spyOn(component, 'getSurveyFields');
      component.ngOnInit();
      expect(component.title).toBe('CHM Bulk Bucket Upload');
      expect(component.surveyId).toBe(1);
      expect(component.exportFile).toBe('/assets/munichre/data/chm_bluk_update_template.xlsx');
      expect(component.invalidColumns).toEqual(["AI ID","Case Id", "Remark"]);
      expect(component.csrfTokenName).toBe('csrf_name');
      expect(component.csrfToken).toBe('csrf_token');
      expect(spy).toHaveBeenCalled();
    });

    it('should set for cls route', () => {
      router.url = '/cls';
      const spy = jest.spyOn(component, 'getSurveyFields');
      component.ngOnInit();
      expect(component.title).toBe('CLS Bulk Bucket Upload');
      expect(component.surveyId).toBe(2);
      expect(component.exportFile).toBe('/assets/munichre/data/cls_bluk_update_template.xlsx');
      expect(component.invalidColumns).toEqual(["AI ID","Case Id", "Intimation no", "Remark"]);
      expect(component.csrfTokenName).toBe('csrf_name');
      expect(component.csrfToken).toBe('csrf_token');
      expect(spy).toHaveBeenCalled();
    });

    it('should set for cce route', () => {
      router.url = '/cce';
      const spy = jest.spyOn(component, 'getSurveyFields');
      component.ngOnInit();
      expect(component.title).toBe('CCE Bulk Bucket Upload');
      expect(component.surveyId).toBe(3);
      expect(component.exportFile).toBe('/assets/munichre/data/cce_bluk_update_template.xlsx');
      expect(component.invalidColumns).toEqual(["AI ID","Case Id", "Remark"]);
      expect(component.csrfTokenName).toBe('csrf_name');
      expect(component.csrfToken).toBe('csrf_token');
      expect(spy).toHaveBeenCalled();
    });

    it('should handle unknown route', () => {
      router.url = '/unknown';
      const spy = jest.spyOn(component, 'getSurveyFields');
      component.ngOnInit();
      expect(component.title).toBeUndefined();
      expect(component.surveyId).toBeUndefined();
      expect(component.exportFile).toBeUndefined();
      expect(component.invalidColumns).toEqual(["AI ID","Case Id", "Remark"]);
      expect(component.csrfTokenName).toBe('csrf_name');
      expect(component.csrfToken).toBe('csrf_token');
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('getSurveyFields', () => {
    it('should handle empty response', fakeAsync(() => {
      core.data_post.mockResolvedValue({ status: 0 });
      component.getSurveyFields();
      flushMicrotasks();
      flush();
      expect(component.fields).toEqual([]);
    }));

    it('should handle successful response with no fields', fakeAsync(() => {
      core.data_post.mockResolvedValue({ status: 1 });
      component.getSurveyFields();
      flushMicrotasks();
      flush();
      expect(component.fields).toEqual([]);
    }));

    it('should handle error', async () => {
      core.data_post.mockRejectedValue(new Error('error'));
      component.getSurveyFields();
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(component.initLoading).toBe(0);
      expect(component.fields).toEqual([]);
      expect(insightsService.logException).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('onFileEleClick', () => {
    it('should reset records and file input', () => {
      component.validRecords = [{} as any];
      component.invalidRecords = [{} as any];
      component.fileData = [{} as any];
      component.fileEle = { nativeElement: { value: 'value' } } as any;

      component.onFileEleClick(component.fileEle);

      expect(component.validRecords).toEqual([]);
      expect(component.invalidRecords).toEqual([]);
      expect(component.fileData).toEqual([]);
      expect(component.fileEle.nativeElement.value).toBeNull();
      expect(component.fileName).toBe('');
    });
  });

  describe('onFileChange', () => {
    it('should not process if no files', () => {
      const event = { target: { files: [], value: 'test' } } as any;

      component.onFileChange(event);

      expect(component.fileName).toBe('');
      expect(event.target.value).toBe('test'); // not reset
    });

    it('should not process if multiple files', () => {
      const event = { target: { files: [new File([], 'file1'), new File([], 'file2')] } } as any;
      const fileToJsonSpy = jest.spyOn(component, 'fileToJson');

      component.onFileChange(event);

      expect(fileToJsonSpy).not.toHaveBeenCalled();
      expect(component.fileName).toBe('');
    });

    it('should process valid file when status is not approve_data', async () => {
      const file = new File([], 'test.xlsx');
      const event = { target: { files: [file], value: 'path' } } as any;
      component.updatedStatus = 'reject_data';
      jest.spyOn(component, 'fileToJson').mockResolvedValue([{ ai_id: 1 }]);
      const fetchSpy = jest.spyOn(component, 'fetchSurveyData');

      await component.onFileChange(event);

      expect(component.fileName).toBe('test.xlsx');
      expect(component.fileData).toEqual([{ ai_id: 1 }]);
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('should reset input on invalid file', async () => {
      const file = new File([], 'test.xlsx');
      const event = { target: { files: [file], value: 'path' } } as any;
      jest.spyOn(component, 'fileToJson').mockResolvedValue(null);

      await component.onFileChange(event);

      expect(component.fileName).toBe('');
      expect(component.fileData).toEqual([]);
      expect(event.target.value).toBeNull();
    });
  });

  describe('fileToJson', () => {
    const mockWorkbook = { SheetNames: ['Sheet1'], Sheets: { Sheet1: {} } };

    beforeEach(() => {
      (XLSX.read as jest.Mock).mockReturnValue(mockWorkbook);
    });

    it('should read and validate CLS Excel file for munichre', fakeAsync(() => {
      component.surveyId = 2;
      component.projectContext = 'munichre';
      const file = new File([], 'test.xlsx');
      (XLSX.utils.sheet_to_json as jest.Mock).mockReturnValue([
        ['AI ID', 'Case Id', 'Intimation no'],
        [1, '1234567890', 'INT-2023-MH-KH-123456789'],
      ]);

      component.fileToJson(file).then((data) => {
        expect(data).toEqual([{ ai_id: 1, case_id: '1234567890', intimation_id: 'INT-2023-MH-KH-123456789' }]);
      });
      flushMicrotasks();
    }));

    it('should read and validate CLS Excel file for saksham', fakeAsync(() => {
      component.surveyId = 2;
      component.projectContext = 'saksham';
      const file = new File([], 'test.xlsx');
      (XLSX.utils.sheet_to_json as jest.Mock).mockReturnValue([
        ['AI ID', 'Case Id', 'Intimation no'],
        [1, '1234567890', 'INT-2023-MH-KH-12345678'],
      ]);

      component.fileToJson(file).then((data) => {
        expect(data).toEqual([{ ai_id: 1, case_id: '1234567890', intimation_id: 'INT-2023-MH-KH-12345678' }]);
      });
      flushMicrotasks();
    }));

    it('should read and validate CLS Excel file for custom', fakeAsync(() => {
      component.surveyId = 2;
      component.projectContext = 'custom' as ProjectContext;
      const file = new File([], 'test.xlsx');
      (XLSX.utils.sheet_to_json as jest.Mock).mockReturnValue([
        ['AI ID', 'Case Id', 'Intimation no'],
        [1, '1234567890', 'INT-2023-MH-KH-12345678'],
      ]);

      component.fileToJson(file).then((data) => {
        expect(data).toEqual([{ ai_id: 1, case_id: '1234567890', intimation_id: 'INT-2023-MH-KH-12345678' }]);
      });
      flushMicrotasks();
    }));

    it('should use 23 for unknown projectContext', fakeAsync(() => {
      featureToggle.getContext.mockReturnValue('unknown' as any);
      component.projectContext = 'unknown' as any;
      component.surveyId = 2;
      const file = new File([], 'test.xlsx');
      (XLSX.utils.sheet_to_json as jest.Mock).mockReturnValue([
        ['AI ID', 'Case Id', 'Intimation no'],
        [1, '1234567890', 'INT-2023-MH-KH-1234567'], // length 22, invalid for 23
      ]);

      component.fileToJson(file).then((data) => {
        expect(data).toBeNull();
        expect(core.toast).toHaveBeenCalledWith('warn', `Case Id's is not 23 charector at row no. 2`);
      });
      flushMicrotasks();
    }));

    it('should read and validate non-CLS Excel file', fakeAsync(() => {
      component.surveyId = 1;
      const file = new File([], 'test.xlsx');
      (XLSX.utils.sheet_to_json as jest.Mock).mockReturnValue([
        ['AI ID', 'Case Id'],
        [1, '1234567890'],
      ]);

      component.fileToJson(file).then((data) => {
        expect(data).toEqual([{ ai_id: 1, case_id: '1234567890' }]);
      });
      flushMicrotasks();
    }));

    it('should toast and return null on invalid headers for CLS', fakeAsync(() => {
      component.surveyId = 2;
      (XLSX.utils.sheet_to_json as jest.Mock).mockReturnValue([['Wrong', 'Headers', 'Extra']]);

      component.fileToJson(new File([], 'test.xlsx')).then((data) => {
        expect(data).toBeNull();
        expect(core.toast).toHaveBeenCalledWith('warn', 'Invalid file data');
      });
      flushMicrotasks();
    }));

    it('should toast and return null on invalid headers for non-CLS', fakeAsync(() => {
      component.surveyId = 1;
      (XLSX.utils.sheet_to_json as jest.Mock).mockReturnValue([['Wrong', 'Headers']]);

      component.fileToJson(new File([], 'test.xlsx')).then((data) => {
        expect(data).toBeNull();
        expect(core.toast).toHaveBeenCalledWith('warn', 'Invalid file data');
      });
      flushMicrotasks();
    }));

    it('should toast and return null on invalid row length for CLS', fakeAsync(() => {
      component.surveyId = 2;
      (XLSX.utils.sheet_to_json as jest.Mock).mockReturnValue([
        ['AI ID', 'Case Id', 'Intimation no'],
        [1, '1234567890'],
      ]);

      component.fileToJson(new File([], 'test.xlsx')).then((data) => {
        expect(data).toBeNull();
        expect(core.toast).toHaveBeenCalledWith('warn', 'Invalid file data');
      });
      flushMicrotasks();
    }));

    it('should toast and return null on invalid row length for CLS with multiple rows', fakeAsync(() => {
      component.surveyId = 2;
      (XLSX.utils.sheet_to_json as jest.Mock).mockReturnValue([
        ['AI ID', 'Case Id', 'Intimation no'],
        [1, '1234567890', 'INT-2023-MH-KH-123456789'],
        [2, '1234567890'],
      ]);

      component.fileToJson(new File([], 'test.xlsx')).then((data) => {
        expect(data).toBeNull();
        expect(core.toast).toHaveBeenCalledWith('warn', 'Invalid file data');
      });
      flushMicrotasks();
    }));

    it('should toast and return null on invalid row length for non-CLS', fakeAsync(() => {
      component.surveyId = 1;
      (XLSX.utils.sheet_to_json as jest.Mock).mockReturnValue([
        ['AI ID', 'Case Id'],
        [1, '1234567890', 'extra'],
      ]);

      component.fileToJson(new File([], 'test.xlsx')).then((data) => {
        expect(data).toBeNull();
        expect(core.toast).toHaveBeenCalledWith('warn', 'Invalid file data');
      });
      flushMicrotasks();
    }));

    it('should toast on missing AI ID', fakeAsync(() => {
      component.surveyId = 1;
      (XLSX.utils.sheet_to_json as jest.Mock).mockReturnValue([
        ['AI ID', 'Case Id'],
        [null, '1234567890'],
      ]);

      component.fileToJson(new File([], 'test.xlsx')).then((data) => {
        expect(data).toBeNull();
        expect(core.toast).toHaveBeenCalledWith('warn', `AI ID is missing at row no. 2`);
      });
      flushMicrotasks();
    }));

    it('should toast on invalid AI ID (not number)', fakeAsync(() => {
      component.surveyId = 1;
      (XLSX.utils.sheet_to_json as jest.Mock).mockReturnValue([
        ['AI ID', 'Case Id'],
        ['abc', '1234567890'],
      ]);

      component.fileToJson(new File([], 'test.xlsx')).then((data) => {
        expect(data).toBeNull();
        expect(core.toast).toHaveBeenCalledWith('warn', `Invalid AI ID at row no. 2`);
      });
      flushMicrotasks();
    }));

    it('should toast on missing Case Id', fakeAsync(() => {
      component.surveyId = 1;
      (XLSX.utils.sheet_to_json as jest.Mock).mockReturnValue([
        ['AI ID', 'Case Id'],
        [1, null],
      ]);

      component.fileToJson(new File([], 'test.xlsx')).then((data) => {
        expect(data).toBeNull();
        expect(core.toast).toHaveBeenCalledWith('warn', `Case Id is missing at row no. 2`);
      });
      flushMicrotasks();
    }));

    it('should toast on invalid Case Id length', fakeAsync(() => {
      component.surveyId = 1;
      (XLSX.utils.sheet_to_json as jest.Mock).mockReturnValue([
        ['AI ID', 'Case Id'],
        [1, '123'],
      ]);

      component.fileToJson(new File([], 'test.xlsx')).then((data) => {
        expect(data).toBeNull();
        expect(core.toast).toHaveBeenCalledWith('warn', `Case Id's is not 10 charector at row no. 2`);
      });
      flushMicrotasks();
    }));

    it('should toast on missing Intimation for CLS', fakeAsync(() => {
      component.surveyId = 2;
      (XLSX.utils.sheet_to_json as jest.Mock).mockReturnValue([
        ['AI ID', 'Case Id', 'Intimation no'],
        [1, '1234567890', null],
      ]);

      component.fileToJson(new File([], 'test.xlsx')).then((data) => {
        expect(data).toBeNull();
        expect(core.toast).toHaveBeenCalledWith('warn', `Intimation is missing at row no. 2`);
      });
      flushMicrotasks();
    }));

    it('should toast on invalid Intimation length for munichre', fakeAsync(() => {
      component.surveyId = 2;
      component.projectContext = 'munichre';
      (XLSX.utils.sheet_to_json as jest.Mock).mockReturnValue([
        ['AI ID', 'Case Id', 'Intimation no'],
        [1, '1234567890', 'INT-2023-MH-KH-123'],
      ]);

      component.fileToJson(new File([], 'test.xlsx')).then((data) => {
        expect(data).toBeNull();
        expect(core.toast).toHaveBeenCalledWith('warn', `Case Id's is not 24 charector at row no. 2`);
      });
      flushMicrotasks();
    }));

    it('should toast on invalid Intimation length for saksham', fakeAsync(() => {
      component.surveyId = 2;
      component.projectContext = 'saksham';
      (XLSX.utils.sheet_to_json as jest.Mock).mockReturnValue([
        ['AI ID', 'Case Id', 'Intimation no'],
        [1, '1234567890', 'INT-2023-MH-KH-123'],
      ]);

      component.fileToJson(new File([], 'test.xlsx')).then((data) => {
        expect(data).toBeNull();
        expect(core.toast).toHaveBeenCalledWith('warn', `Case Id's is not 23 charector at row no. 2`);
      });
      flushMicrotasks();
    }));

    it('should toast on invalid Intimation length for custom', fakeAsync(() => {
      component.surveyId = 2;
      component.projectContext = 'custom' as ProjectContext;
      (XLSX.utils.sheet_to_json as jest.Mock).mockReturnValue([
        ['AI ID', 'Case Id', 'Intimation no'],
        [1, '1234567890', 'INT-2023-MH-KH-123'],
      ]);

      component.fileToJson(new File([], 'test.xlsx')).then((data) => {
        expect(data).toBeNull();
        expect(core.toast).toHaveBeenCalledWith('warn', `Case Id's is not 23 charector at row no. 2`);
      });
      flushMicrotasks();
    }));

    it('should toast on invalid Intimation initial', fakeAsync(() => {
      component.surveyId = 2;
      (XLSX.utils.sheet_to_json as jest.Mock).mockReturnValue([
        ['AI ID', 'Case Id', 'Intimation no'],
        [1, '1234567890', 'ABC-2023-MH-KH-123456789'],
      ]);

      component.fileToJson(new File([], 'test.xlsx')).then((data) => {
        expect(data).toBeNull();
        expect(core.toast).toHaveBeenCalledWith('warn', `Invalid intimation Id initial at row no. 2`);
      });
      flushMicrotasks();
    }));

    it('should toast on invalid Intimation year length', fakeAsync(() => {
      component.surveyId = 2;
      (XLSX.utils.sheet_to_json as jest.Mock).mockReturnValue([
        ['AI ID', 'Case Id', 'Intimation no'],
        [1, '1234567890', 'INT-23-MH-KH-123456789'],
      ]);

      component.fileToJson(new File([], 'test.xlsx')).then((data) => {
        expect(data).toBeNull();
        expect(core.toast).toHaveBeenCalledWith('warn', `Invalid intimation Id year at row no. 2`);
      });
      flushMicrotasks();
    }));

    it('should toast on invalid Intimation year (not number)', fakeAsync(() => {
      component.surveyId = 2;
      (XLSX.utils.sheet_to_json as jest.Mock).mockReturnValue([
        ['AI ID', 'Case Id', 'Intimation no'],
        [1, '1234567890', 'INT-ABCD-MH-KH-123456789'],
      ]);

      component.fileToJson(new File([], 'test.xlsx')).then((data) => {
        expect(data).toBeNull();
        expect(core.toast).toHaveBeenCalledWith('warn', `Invalid intimation Id year at row no. 2`);
      });
      flushMicrotasks();
    }));

    it('should toast on invalid Intimation state length', fakeAsync(() => {
      component.surveyId = 2;
      (XLSX.utils.sheet_to_json as jest.Mock).mockReturnValue([
        ['AI ID', 'Case Id', 'Intimation no'],
        [1, '1234567890', 'INT-2023-M-KH-123456789'],
      ]);

      component.fileToJson(new File([], 'test.xlsx')).then((data) => {
        expect(data).toBeNull();
        expect(core.toast).toHaveBeenCalledWith('warn', `Invalid intimation Id state at row no. 2`);
      });
      flushMicrotasks();
    }));

    it('should toast on invalid Intimation state (not uppercase letters)', fakeAsync(() => {
      component.surveyId = 2;
      (XLSX.utils.sheet_to_json as jest.Mock).mockReturnValue([
        ['AI ID', 'Case Id', 'Intimation no'],
        [1, '1234567890', 'INT-2023-mh-KH-123456789'],
      ]);

      component.fileToJson(new File([], 'test.xlsx')).then((data) => {
        expect(data).toBeNull();
        expect(core.toast).toHaveBeenCalledWith('warn', `Invalid intimation Id state at row no. 2`);
      });
      flushMicrotasks();
    }));

    it('should toast on invalid Intimation season length', fakeAsync(() => {
      component.surveyId = 2;
      (XLSX.utils.sheet_to_json as jest.Mock).mockReturnValue([
        ['AI ID', 'Case Id', 'Intimation no'],
        [1, '1234567890', 'INT-2023-MH-K-123456789'],
      ]);

      component.fileToJson(new File([], 'test.xlsx')).then((data) => {
        expect(data).toBeNull();
        expect(core.toast).toHaveBeenCalledWith('warn', `Invalid intimation Id season at row no. 2`);
      });
      flushMicrotasks();
    }));

    it('should toast on invalid Intimation season (not uppercase letters)', fakeAsync(() => {
      component.surveyId = 2;
      (XLSX.utils.sheet_to_json as jest.Mock).mockReturnValue([
        ['AI ID', 'Case Id', 'Intimation no'],
        [1, '1234567890', 'INT-2023-MH-kh-123456789'],
      ]);

      component.fileToJson(new File([], 'test.xlsx')).then((data) => {
        expect(data).toBeNull();
        expect(core.toast).toHaveBeenCalledWith('warn', `Invalid intimation Id season at row no. 2`);
      });
      flushMicrotasks();
    }));

    it('should toast on invalid Intimation last chunk length for munichre', fakeAsync(() => {
      component.surveyId = 2;
      component.projectContext = 'munichre';
      (XLSX.utils.sheet_to_json as jest.Mock).mockReturnValue([
        ['AI ID', 'Case Id', 'Intimation no'],
        [1, '1234567890', 'INT-2023-MH-KH-12345678'],
      ]);

      component.fileToJson(new File([], 'test.xlsx')).then((data) => {
        expect(data).toBeNull();
        expect(core.toast).toHaveBeenCalledWith('warn', `Invalid intimation Id at row no. 2`);
      });
      flushMicrotasks();
    }));

    it('should toast on invalid Intimation last chunk length for saksham', fakeAsync(() => {
      component.surveyId = 2;
      component.projectContext = 'saksham';
      (XLSX.utils.sheet_to_json as jest.Mock).mockReturnValue([
        ['AI ID', 'Case Id', 'Intimation no'],
        [1, '1234567890', 'INT-2023-MH-KH-123456789'],
      ]);

      component.fileToJson(new File([], 'test.xlsx')).then((data) => {
        expect(data).toBeNull();
        expect(core.toast).toHaveBeenCalledWith('warn', `Invalid intimation Id at row no. 2`);
      });
      flushMicrotasks();
    }));

    it('should toast on invalid Intimation last chunk (not number)', fakeAsync(() => {
      component.surveyId = 2;
      (XLSX.utils.sheet_to_json as jest.Mock).mockReturnValue([
        ['AI ID', 'Case Id', 'Intimation no'],
        [1, '1234567890', 'INT-2023-MH-KH-ABCDEFghi'],
      ]);

      component.fileToJson(new File([], 'test.xlsx')).then((data) => {
        expect(data).toBeNull();
        expect(core.toast).toHaveBeenCalledWith('warn', `Invalid intimation Id at row no. 2`);
      });
      flushMicrotasks();
    }));

    it('should toast on duplicate Intimation for CLS', fakeAsync(() => {
      component.surveyId = 2;
      (XLSX.utils.sheet_to_json as jest.Mock).mockReturnValue([
        ['AI ID', 'Case Id', 'Intimation no'],
        [1, '1234567890', 'INT-2023-MH-KH-123456789'],
        [2, '0987654321', 'INT-2023-MH-KH-123456789'],
      ]);

      component.fileToJson(new File([], 'test.xlsx')).then((data) => {
        expect(data).toBeNull();
        expect(core.toast).toHaveBeenCalledWith('warn', 'Duplicate intimation id');
      });
      flushMicrotasks();
    }));

    it('should not toast on duplicate for non-CLS', fakeAsync(() => {
      component.surveyId = 1;
      (XLSX.utils.sheet_to_json as jest.Mock).mockReturnValue([
        ['AI ID', 'Case Id'],
        [1, '1234567890'],
        [2, '1234567890'],
      ]);

      component.fileToJson(new File([], 'test.xlsx')).then((data) => {
        expect(data).not.toBeNull();
        expect(core.toast).not.toHaveBeenCalled();
      });
      flushMicrotasks();
    }));

    it('should return null on empty file', fakeAsync(() => {
      (XLSX.utils.sheet_to_json as jest.Mock).mockReturnValue([]);

      component.fileToJson(new File([], 'test.xlsx')).then((data) => {
        expect(data).toBeNull();
        expect(core.toast).toHaveBeenCalledWith('warn', "Empty file");
      });
      flushMicrotasks();
    }));

    it('should handle trimmed headers', fakeAsync(() => {
      component.surveyId = 1;
      (XLSX.utils.sheet_to_json as jest.Mock).mockReturnValue([
        [' ai id ', ' case id '],
        [1, '1234567890'],
      ]);

      component.fileToJson(new File([], 'test.xlsx')).then((data) => {
        expect(data).toEqual([{ ai_id: 1, case_id: '1234567890' }]);
      });
      flushMicrotasks();
    }));
  });

  describe('fetchSurveyData', () => {
    it('should not validate on failure status', fakeAsync(() => {
      core.post.mockResolvedValue({ status: 0 });
      const validateSpy = jest.spyOn(component, 'validateSurveyData');

      component.fetchSurveyData([{ ai_id: 1 }]);
      flushMicrotasks();
      flush();
      expect(component.surveyData).toEqual([]);
      expect(validateSpy).not.toHaveBeenCalled();
    }));

    it('should handle empty surveydata', async () => {
      core.post.mockResolvedValue({ status: 1, surveydata: [] });
      const validateSpy = jest.spyOn(component, 'validateSurveyData');

      component.fetchSurveyData([{ ai_id: 1 }]);
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(component.surveyData).toEqual([]);
      expect(validateSpy).toHaveBeenCalled();
    });

    it('should handle error', async () => {
      core.post.mockRejectedValue(new Error('API error'));

      component.fetchSurveyData([{ ai_id: 1 }]);
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(insightsService.logException).toHaveBeenCalledWith(expect.any(Error));
      expect(component.surveyData).toEqual([]);
    });
  });

  describe('validateSurveyData', () => {
    it('should validate records with tabs and conditionals for surveyId 1', () => {
      component.fields = [
        { type: 'tab', field_id: 100, required: false, parent_id: 0 },
        { type: 'text', field_id: 1, required: true, label: 'Field1', parent_id: 100 },
        { type: 'text', field_id: 2, required: false, maxlength: 5, label: 'Field2', parent_id: 0 },
        { type: 'number', field_id: 3, required: false, max_val: 10, label: 'Field3', parent_id: 0, subtype: 'normal' },
        { type: 'number', field_id: 4, required: false, max_val: 10, label: 'Field4', parent_id: 0, subtype: 'phone' },
        { type: 'file', field_id: 5, required: true, label: 'File', parent_id: 0 },
        { type: 'text', field_id: 6, required: true, label: 'Conditional', parent_id: 2, parent_value: 'match' },
      ];
      component.surveyData = [
        { id: 1, case_ID: 'case1', field_1: 'value', field_2: 'short', field_3: 5, field_4: 15, field_6: 'value', field_779: 'int1' },
        { id: 2, case_ID: 'case2', field_1: '', field_2: 'too long', field_3: 15, field_4: 15, field_6: '', field_779: 'int2' },
        { id: 3, case_ID: 'case3', field_1: 'value', field_2: 'match', field_3: 5, field_6: '', field_779: 'int3' },
      ];
      component.surveyId = 1;

      component.validateSurveyData();

      expect(component.validRecords).toEqual([{ ai_id: 1 }]);
      expect(component.invalidRecords).toEqual([
        { 'AI ID': 2, 'Case Id': 'case2', 'Intimation no': 'int2', 'Remark': 'Field1 is required.\nField2 value should not exceed 5 charecter.\nField3 value should not more than 10.' },
        { 'AI ID': 3, 'Case Id': 'case3', 'Intimation no': 'int3', 'Remark': 'Conditional is required.' },
      ]);
    });

    it('should validate records with tabs and conditionals for surveyId 2', () => {
      component.fields = [
        { type: 'tab', field_id: 100, required: false, parent_id: 0 },
        { type: 'text', field_id: 1, required: true, label: 'Field1', parent_id: 100 },
        { type: 'text', field_id: 2, required: false, maxlength: 5, label: 'Field2', parent_id: 0 },
        { type: 'number', field_id: 3, required: false, max_val: 10, label: 'Field3', parent_id: 0, subtype: 'normal' },
        { type: 'number', field_id: 4, required: false, max_val: 10, label: 'Field4', parent_id: 0, subtype: 'phone' },
        { type: 'file', field_id: 5, required: true, label: 'File', parent_id: 0 },
        { type: 'text', field_id: 6, required: true, label: 'Conditional', parent_id: 2, parent_value: 'match' },
      ];
      component.surveyData = [
        { id: 1, case_ID: 'case1', field_1: 'value', field_2: 'short', field_3: 5, field_4: 15, field_6: 'value' },
        { id: 2, case_ID: 'case2', field_1: '', field_2: 'too long', field_3: 15, field_4: 15, field_6: '' },
        { id: 3, case_ID: 'case3', field_1: 'value', field_2: 'match', field_3: 5, field_6: '' },
      ];
      component.surveyId = 2;

      component.validateSurveyData();

      expect(component.validRecords).toEqual([{ ai_id: 1 }]);
      expect(component.invalidRecords).toEqual([
        { 'AI ID': 2, 'Case Id': 'case2', 'Remark': 'Field1 is required.\nField2 value should not exceed 5 charecter.\nField3 value should not more than 10.' },
        { 'AI ID': 3, 'Case Id': 'case3', 'Remark': 'Conditional is required.' },
      ]);
    });

    it('should handle no errors', () => {
      component.fields = [];
      component.surveyData = [{ id: 1, case_ID: 'case1' }];
      component.surveyId = 1;

      component.validateSurveyData();

      expect(component.validRecords).toEqual([{ ai_id: 1 }]);
      expect(component.invalidRecords).toEqual([]);
    });

    it('should skip validation for tab and file fields', () => {
      component.fields = [
        { type: 'tab', field_id: 1, required: true, label: 'Tab' },
        { type: 'file', field_id: 2, required: true, label: 'File' },
      ];
      component.surveyData = [{ id: 1, case_ID: 'case1' }];

      component.validateSurveyData();

      expect(component.validRecords).toEqual([{ ai_id: 1 }]);
    });

    it('should check maxlength', () => {
      component.fields = [{ type: 'text', field_id: 1, required: false, maxlength: 5, label: 'Field' }];
      component.surveyData = [{ id: 1, case_ID: 'case1', field_1: '123456' }];

      component.validateSurveyData();

      expect(component.invalidRecords[0].Remark).toContain('should not exceed 5');
    });

    it('should check max_val for non-phone number', () => {
      component.fields = [{ type: 'number', subtype: 'normal', field_id: 1, required: false, max_val: 10, label: 'Field' }];
      component.surveyData = [{ id: 1, case_ID: 'case1', field_1: 11 }];

      component.validateSurveyData();

      expect(component.invalidRecords[0].Remark).toContain('should not more than 10');
    });

    it('should not check max_val for phone number', () => {
      component.fields = [{ type: 'number', subtype: 'phone', field_id: 1, required: false, max_val: 10, label: 'Field' }];
      component.surveyData = [{ id: 1, case_ID: 'case1', field_1: 11 }];

      component.validateSurveyData();

      expect(component.validRecords).toEqual([{ ai_id: 1 }]);
    });

    it('should not check if no value for maxlength and max_val', () => {
      component.fields = [
        { type: 'text', field_id: 1, required: false, maxlength: 5, label: 'Field1' },
        { type: 'number', subtype: 'normal', field_id: 2, required: false, max_val: 10, label: 'Field2' },
      ];
      component.surveyData = [{ id: 1, case_ID: 'case1' }];

      component.validateSurveyData();

      expect(component.validRecords).toEqual([{ ai_id: 1 }]);
    });

    it('should join multiple errors', () => {
      component.fields = [
        { type: 'text', field_id: 1, required: true, label: 'Field1' },
        { type: 'text', field_id: 2, required: true, label: 'Field2' },
      ];
      component.surveyData = [{ id: 1, case_ID: 'case1' }];

      component.validateSurveyData();

      expect(component.invalidRecords[0].Remark).toBe('Field1 is required.\nField2 is required.');
    });

    it('should trim errors and add to valid if empty after trim', () => {
      component.fields = [];
      component.surveyData = [{ id: 1, case_ID: 'case1', errors: [' '] }]; // but errors set to []

      component.validateSurveyData();

      expect(component.validRecords).toEqual([{ ai_id: 1 }]);
    });

    it('should not add error if conditional not matching', () => {
      component.fields = [
        { type: 'text', field_id: 1, required: true, label: 'Conditional', parent_id: 100, parent_value: 'match' },
      ];
      component.surveyData = [{ id: 1, case_ID: 'case1', field_100: 'no match' }];

      component.validateSurveyData();

      expect(component.validRecords).toEqual([{ ai_id: 1 }]);
    });

    it('should handle non-number for max_val', () => {
      component.fields = [{ type: 'number', subtype: 'normal', field_id: 1, required: false, max_val: 10, label: 'Field' }];
      component.surveyData = [{ id: 1, case_ID: 'case1', field_1: 'abc' }];

      component.validateSurveyData();

      expect(component.validRecords).toEqual([{ ai_id: 1 }]); // NaN > 10 false
    });

    it('should handle empty surveyData', () => {
      component.surveyData = [];
      component.validateSurveyData();
      expect(component.validRecords).toEqual([]);
      expect(component.invalidRecords).toEqual([]);
    });

    it('should handle empty fields', () => {
      component.fields = [];
      component.surveyData = [{ id: 1, case_ID: 'case1' }];
      component.validateSurveyData();
      expect(component.validRecords).toEqual([{ ai_id: 1 }]);
    });

    it('should add Intimation no only for surveyId 1', () => {
      component.fields = [{ type: 'text', field_id: 1, required: true, label: 'Field1' }];
      component.surveyData = [{ id: 1, case_ID: 'case1', field_779: 'int1' }];
      component.surveyId = 1;
      component.validateSurveyData();
      expect(component.invalidRecords[0]['Intimation no']).toBe('int1');
    });

    it('should not add Intimation no for surveyId 3', () => {
      component.fields = [{ type: 'text', field_id: 1, required: true, label: 'Field1' }];
      component.surveyData = [{ id: 1, case_ID: 'case1', field_779: 'int1' }];
      component.surveyId = 3;
      component.validateSurveyData();
      expect(component.invalidRecords[0]['Intimation no']).toBeUndefined();
      expect(component.invalidRecords[0]['Remark']).toBe('Field1 is required.');
    });
  });

  describe('onStatusFlagChange', () => {
    it('should reset', () => {
      component.validRecords = [{} as any];
      component.invalidRecords = [{} as any];
      component.fileData = [{} as any];
      component.fileName = 'file';
      component.fileEle = { nativeElement: { value: 'value' } } as any;

      component.onStatusFlagChange({});

      expect(component.validRecords).toEqual([]);
      expect(component.invalidRecords).toEqual([]);
      expect(component.fileData).toEqual([]);
      expect(component.fileName).toBe('');
      expect(component.fileEle.nativeElement.value).toBeNull();
    });
  });

  describe('onSubmit', () => {
    it('should toast if no status', () => {
      component.updatedStatus = '';

      component.onSubmit();

      expect(core.toast).toHaveBeenCalledWith('warn', "Please update the status.");
      expect(component.loading).toBe(0);
    });

    it('should toast if no file', () => {
      component.updatedStatus = 'approve_data';
      component.fileName = '';
      component.fileData = [];

      component.onSubmit();

      expect(core.toast).toHaveBeenCalledWith('warn', "Please upload file.");
      expect(component.loading).toBe(0);
    });

    it('should toast if no fileData length', () => {
      component.updatedStatus = 'approve_data';
      component.fileName = 'file';
      component.fileData = [];

      component.onSubmit();

      expect(core.toast).toHaveBeenCalledWith('warn', "Please upload file.");
      expect(component.loading).toBe(0);
    });

    it('should submit reject with fileData', fakeAsync(() => {
      component.updatedStatus = 'reject_data';
      component.fileName = 'file';
      component.fileData = [{ ai_id: 1 }];
      component.surveyId = 2;
      core.post.mockResolvedValue({ status: 1, msg: 'success' });

      component.onSubmit();
      flushMicrotasks();
      flush();
      expect(core.post).toHaveBeenCalledWith({ purpose: 'reject_data', survey_id: 2, data: [{ id: 1 }] });
    }));

    it('should not reset fileEle if no value', fakeAsync(() => {
      component.updatedStatus = 'approve_data';
      component.fileName = 'file';
      component.fileData = [{ ai_id: 1 }];
      component.validRecords = [{ ai_id: 1 }];
      component.fileEle = { nativeElement: { value: '' } } as any;
      core.post.mockResolvedValue({ status: 1, msg: 'success' });

      component.onSubmit();
      flushMicrotasks();
      flush();
      expect(component.fileEle.nativeElement.value).toBe('');
    }));

    it('should handle failure status', async () => {
      component.updatedStatus = 'approve_data';
      component.fileName = 'file';
      component.fileData = [{ ai_id: 1 }];
      component.validRecords = [{ ai_id: 1 }];
      core.post.mockResolvedValue({ status: 0, msg: 'fail' });

      component.onSubmit();
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(core.toast).toHaveBeenCalledWith('error', 'fail');
      expect(component.loading).toBe(0);
    });

    it('should handle error', async () => {
      component.updatedStatus = 'approve_data';
      component.fileName = 'file';
      component.fileData = [{ ai_id: 1 }];
      component.validRecords = [{ ai_id: 1 }];
      core.post.mockRejectedValue(new Error('error'));

      component.onSubmit();
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(core.toast).toHaveBeenCalledWith('error', 'Unable to update approve status');
      expect(insightsService.logException).toHaveBeenCalledWith(expect.any(Error));
      expect(component.loading).toBe(0);
    });

    it('should reset fileEle if has value on success', async () => {
      component.updatedStatus = 'approve_data';
      component.fileName = 'file';
      component.fileData = [{ ai_id: 1 }];
      component.validRecords = [{ ai_id: 1 }];
      component.fileEle = { nativeElement: { value: 'value' } } as any;
      core.post.mockResolvedValue({ status: 1, msg: 'success' });

      component.onSubmit();
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(component.fileEle.nativeElement.value).toBeNull();
    });
  });

  describe('onFaildDownload', () => {
    it('should export invalid records', () => {
      component.invalidRecords = [{ 'AI ID': 1, 'Case Id': 'case', 'Intimation no': 'int', Remark: 'error' }];
      component.invalidColumns = ['AI ID', 'Case Id', 'Intimation no', 'Remark'];
      const mockWs = {};
      const mockWb = {};
      (XLSX.utils.aoa_to_sheet as jest.Mock).mockReturnValue(mockWs);
      (XLSX.utils.book_new as jest.Mock).mockReturnValue(mockWb);
      (XLSX.utils.book_append_sheet as jest.Mock).mockImplementation();

      component.onFaildDownload();

      expect(XLSX.utils.aoa_to_sheet).toHaveBeenCalledWith([
        ['AI ID', 'Case Id', 'Intimation no', 'Remark'],
        [1, 'case', 'int', 'error'],
      ]);
      expect(XLSX.writeFile).toHaveBeenCalledWith(mockWb, expect.stringContaining('Failed_CLS_Data.xlsx'));
    });

    it('should handle missing columns in data', () => {
      component.invalidRecords = [{ 'AI ID': 1, 'Case Id': 'case', Remark: 'error' }];
      component.invalidColumns = ['AI ID', 'Case Id', 'Intimation no', 'Remark'];

      component.onFaildDownload();

      expect(XLSX.utils.aoa_to_sheet).toHaveBeenCalledWith([
        ['AI ID', 'Case Id', 'Intimation no', 'Remark'],
        [1, 'case', undefined, 'error'],
      ]);
    });

    it('should export with no invalid records', () => {
      component.invalidRecords = [];
      component.invalidColumns = ['AI ID', 'Case Id', 'Intimation no', 'Remark'];

      component.onFaildDownload();

      expect(XLSX.utils.aoa_to_sheet).toHaveBeenCalledWith([
        ['AI ID', 'Case Id', 'Intimation no', 'Remark'],
      ]);
    });
  });
});