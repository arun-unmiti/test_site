import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { NgbModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TableModule } from 'primeng/table';
import { AccordionModule } from 'primeng/accordion';
import { FormsModule } from '@angular/forms';
import { Directive, Input } from '@angular/core';

import { ProposalWiseManagementComponent } from './proposal-wise-management.component';
import { CoreService } from '../utilities/core.service';
import { FilterService } from '../utilities/filter.service';
import { UserDetailService } from '../auth/user-detail.service';
import { ProposalWiseManagementService } from '../utilities/proposal-form/proposal-wise-management.service';
import { UtilityService } from '../utilities/proposal-form/utility.service';
import { FeatureToggleService } from '../shared/services/feature-toggle.service';

// ✅ Stub Lightgallery Directive
@Directive({
  selector: 'lightgallery',
})
class MockLightgalleryDirective {
  @Input() settings: any;
  @Input() onBeforeSlide: any;
}

// ✅ Mock Services
class MockCoreService {
  post = jest.fn().mockResolvedValue({ status: 1, msg: 'Success' });
  toast = jest.fn();
  clone = jest.fn((obj) => JSON.parse(JSON.stringify(obj)));
}

class MockFilterService {
  // Add mocks if needed
}

class MockUserDetailService {
  getUserDetail = jest.fn(() => ({ user_role: '1' }));
}

class MockProposalWiseManagementService {
  getFilterData = jest.fn();
  getSurveyFields = jest.fn();
  downloadTable = jest.fn().mockResolvedValue([]);
  fileToJson = jest.fn().mockResolvedValue({ validData: [], invalidData: [], jsonData: [] });
  uploadChunksSequentially = jest.fn().mockResolvedValue('');
  getSurveyData = jest.fn().mockResolvedValue(undefined);
  getSearchSurveyData = jest.fn().mockResolvedValue(undefined);
  onPageTrigger = jest.fn().mockResolvedValue(undefined);
  exportExcel = jest.fn();
  downloadInvalids = jest.fn();
}

class MockUtilityService {
  updatePageReport = jest.fn();
  invalidUpdatePageReport = jest.fn();
  downloadKml = jest.fn();
}

class MockFeatureToggleService {
  getContext = jest.fn(() => 'saksham');
  getConfig = jest.fn(() => ({ BASEKMLPREFIX: 'http://example.com/', BASEKMLSUFFIX: '.ext' }));
}

class MockNgbModal {
  open = jest.fn().mockReturnValue({ result: Promise.resolve(), dismiss: jest.fn() });
  dismissAll = jest.fn();
}

describe('ProposalWiseManagementComponent', () => {
  let component: ProposalWiseManagementComponent;
  let fixture: ComponentFixture<ProposalWiseManagementComponent>;
  let coreService: any;
  let proposalService: any;
  let utilityService: any;
  let featureToggle: any;
  let modalService: any;
  let userService: any;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        NgbModule,
        TableModule,
        AccordionModule,
        FormsModule,
      ],
      declarations: [ProposalWiseManagementComponent, MockLightgalleryDirective],
      providers: [
        { provide: CoreService, useClass: MockCoreService },
        { provide: FilterService, useClass: MockFilterService },
        { provide: UserDetailService, useClass: MockUserDetailService },
        { provide: ProposalWiseManagementService, useClass: MockProposalWiseManagementService },
        { provide: UtilityService, useClass: MockUtilityService },
        { provide: FeatureToggleService, useClass: MockFeatureToggleService },
        { provide: NgbModal, useClass: MockNgbModal },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ProposalWiseManagementComponent);
    component = fixture.componentInstance;
    coreService = TestBed.inject(CoreService);
    proposalService = TestBed.inject(ProposalWiseManagementService);
    utilityService = TestBed.inject(UtilityService);
    featureToggle = TestBed.inject(FeatureToggleService);
    modalService = TestBed.inject(NgbModal);
    userService = TestBed.inject(UserDetailService);
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should set properties and call service methods', () => {
      const getFilterDataSpy = jest.spyOn(proposalService, 'getFilterData');
      const getSurveyFieldsSpy = jest.spyOn(proposalService, 'getSurveyFields');
      component.ngOnInit();
      expect(component.projectContext).toBe('saksham');
      expect(component.assetsFolder).toBeDefined();
      expect(component.user).toEqual({ user_role: '1' });
      expect(getFilterDataSpy).toHaveBeenCalledWith(component);
      expect(getSurveyFieldsSpy).toHaveBeenCalledWith(component);
      expect(component.imgUrl).toBe('http://example.com/');
      expect(component.imgUrlSuffix).toBe('.ext');
    });
  });

  describe('applyFilter', () => {
    it('should reset search fields and call getSurveyData', () => {
      const getSurveyDataSpy = jest.spyOn(component, 'getSurveyData');
      component.applyFilter();
      expect(component.showDateLabel).toBe(false);
      expect(component.searchCaseId).toBe('');
      expect(component.surveyIntimationNo).toBe('');
      expect(getSurveyDataSpy).toHaveBeenCalledWith(component.surveyId);
    });
  });

  describe('resetData', () => {
    it('should reset data arrays', () => {
      component.fields = [{}];
      component.surveyData = [{ id: '1' }];
      component.parentFields = [{}];
      component.tableData = [{ id: '1' }];
      component.colDefs = [{}];
      component.allColDefs = [{}];
      component.resetData();
      expect(component.fields).toEqual([]);
      expect(component.surveyData).toEqual([]);
      expect(component.parentFields).toEqual([]);
      expect(component.tableData).toEqual([]);
      expect(component.colDefs).toEqual([]);
      expect(component.allColDefs).toEqual([]);
    });
  });

  describe('onCropSelect', () => {
    it('should call resetData', () => {
      const resetDataSpy = jest.spyOn(component, 'resetData');
      component.onCropSelect({});
      expect(resetDataSpy).toHaveBeenCalled();
    });
  });

  describe('onYearSelect', () => {
    it('should call resetData', () => {
      const resetDataSpy = jest.spyOn(component, 'resetData');
      component.onYearSelect({});
      expect(resetDataSpy).toHaveBeenCalled();
    });
  });

  describe('onSeasonSelect', () => {
    it('should call resetData', () => {
      const resetDataSpy = jest.spyOn(component, 'resetData');
      component.onSeasonSelect({});
      expect(resetDataSpy).toHaveBeenCalled();
    });
  });

  describe('onIntimationNumberChange', () => {
    it('should trigger searchObser.next', () => {
      const nextSpy = jest.spyOn(component.searchObser, 'next');
      component.onIntimationNumberChange('test');
      expect(nextSpy).toHaveBeenCalledWith('test');
    });
  });

  describe('onCaseIdChange', () => {
    it('should trigger searchObser.next', () => {
      const nextSpy = jest.spyOn(component.searchObser, 'next');
      component.onCaseIdChange('test');
      expect(nextSpy).toHaveBeenCalledWith('test');
    });
  });

  describe('onApproveSet', () => {
    it('should post approved data and show toast on success', async () => {
      component.tableData = [{ id: '1', approve: true }, { id: '2', approve: false }];
      component.surveyId = '13';
      await component.onApproveSet('approve_data');
      expect(coreService.post).toHaveBeenCalledWith({ purpose: 'approve_data', survey_id: '13', data: [{ id: '1' }] });
      expect(coreService.toast).toHaveBeenCalledWith('success', 'Success');
    });

    it('should show error toast on failure', async () => {
      component.tableData = [{ id: '1', approve: true }];
      coreService.post.mockRejectedValueOnce(new Error());
      await component.onApproveSet('approve_data');
      expect(coreService.toast).toHaveBeenCalledWith('error', 'Unable to update approve status');
    });
  });

  describe('onColumnVisibilityChange', () => {
    it('should filter visible columns', () => {
      component.allColDefs = [{ visibility: true }, { visibility: false }];
      component.onColumnVisibilityChange();
      expect(component.colDefs).toEqual([{ visibility: true }]);
    });
  });

  describe('downloadTable', () => {
    it('should download and export data on success', async () => {
      const mockData = [{ id: 1 }];
      proposalService.downloadTable.mockResolvedValueOnce(mockData);
      await component.downloadTable();
      expect(component.loading).toBe(0);
      expect(proposalService.exportExcel).toHaveBeenCalledWith(component, mockData, component.colDefs);
    });

    it('should show error toast on failure', async () => {
      proposalService.downloadTable.mockRejectedValueOnce(new Error());
      await component.downloadTable();
      expect(coreService.toast).toHaveBeenCalledWith('error', 'Unable to Download');
      expect(component.loading).toBe(0);
    });
  });

  describe('onDetailEmit', () => {
    it('should hide details and call getSearchSurveyData if search fields set', () => {
      component.searchCaseId = 'test';
      const getSearchSurveyDataSpy = jest.spyOn(component, 'getSearchSurveyData');
      component.onDetailEmit();
      expect(component.showDetails).toBe(false);
      expect(getSearchSurveyDataSpy).toHaveBeenCalledWith(component.surveyId);
    });

    it('should call onPageTrigger if no search fields', () => {
      component.searchCaseId = '';
      component.surveyIntimationNo = '';
      const onPageTriggerSpy = jest.spyOn(component, 'onPageTrigger');
      component.onDetailEmit();
      expect(onPageTriggerSpy).toHaveBeenCalledWith({ page_no: component.currentpage, records_per_page: component.recordsPerPage });
    });
  });

  describe('open', () => {
    it('should call post and open modal for kml type', async () => {
      component.surveyId = '13';
      const data = { type: 'kml', id: '1' };
      const survey = { data_id: '2' };
      coreService.post.mockResolvedValueOnce({ files: [{ file: 'test.kml' }] });
      await component.open('content', data, survey);
      expect(coreService.post).toHaveBeenCalledWith({ purpose: 'get_files', survey_id: '13', type: 'kml', data_id: '2' });
      expect(component.kml_files).toEqual([{ file: 'test.kml' }]);
      expect(modalService.open).toHaveBeenCalled();
    });
  });

  describe('onViewData', () => {
    it('should set detail properties', () => {
      component.onViewData('123');
      expect(component.detailDataId).toBe('123');
      expect(component.showDetails).toBe(true);
    });
  });

  describe('onProductFileChange', () => {
    it('should handle file change and set data', async () => {
      const event = { target: { files: [new File([''], 'test.csv')] } };
      const mockFileData = { validData: [{ id: 1 }], invalidData: [{ id: 2 }], jsonData: [{ id: 3 }] };
      proposalService.fileToJson.mockResolvedValueOnce(mockFileData);
      await component.onProductFileChange(event);
      expect(component.fileName).toBe('test.csv');
      expect(component.fileData).toEqual([{ id: 1 }]);
      expect(component.invalidFileData).toEqual([{ id: 2 }]);
      expect(component.totalRecords).toBe(1);
      expect(component.invalidTotalRecords).toBe(1);
      expect(utilityService.updatePageReport).toHaveBeenCalledWith(component);
      expect(utilityService.invalidUpdatePageReport).toHaveBeenCalledWith(component);
    });

    it('should warn if too many records', async () => {
      const event = { target: { files: [new File([''], 'test.csv')] } };
      proposalService.fileToJson.mockResolvedValueOnce({ jsonData: new Array(8001) });
      await component.onProductFileChange(event);
      expect(coreService.toast).toHaveBeenCalledWith('warn', 'This file contains more than 8,000 records.');
    });

    it('should do nothing if no file', async () => {
      const event = { target: { files: [] } };
      await component.onProductFileChange(event);
      expect(component.fileData).toEqual([]);
    });
  });

  describe('invalidOnPageTrigger', () => {
    it('should update pagination and call invalidUpdatePageReport', () => {
      const event = { first: 10, rows: 5 };
      component.invalidOnPageTrigger(event);
      expect(component.invalidCurrentpage).toBe(3);
      expect(component.invalidRecordsPerPage).toBe(5);
      expect(utilityService.invalidUpdatePageReport).toHaveBeenCalledWith(component);
    });
  });

  describe('onSubmit', () => {
    it('should upload data and show success toast', async () => {
      component.fileData = [{ id: 1 }];
      component.fileEle = { nativeElement: { value: 'test' } };
      await component.onSubmit();
      expect(modalService.open).toHaveBeenCalled();
      expect(coreService.clone).toHaveBeenCalled();
      expect(proposalService.uploadChunksSequentially).toHaveBeenCalled();
      expect(component.fileData).toEqual([]);
      expect(component.invalidFileData).toEqual([]);
      expect(component.fileName).toBe('');
      expect(modalService.dismissAll).toHaveBeenCalled();
      expect(coreService.toast).toHaveBeenCalledWith('success', 'Upload completed successfully!');
    });
  });

  describe('download_kml', () => {
    it('should call downloadKml', () => {
      const data = { file: 'test.kml' };
      component.download_kml(data);
      expect(utilityService.downloadKml).toHaveBeenCalledWith(data);
    });
  });

  describe('downloadInvalids', () => {
    it('should call downloadInvalids', () => {
      component.downloadInvalids();
      expect(proposalService.downloadInvalids).toHaveBeenCalledWith(component);
    });
  });

  describe('getSurveyData', () => {
    it('should call proposalService getSurveyData', async () => {
      await component.getSurveyData('13');
      expect(proposalService.getSurveyData).toHaveBeenCalledWith(component, '13');
    });
  });

  describe('getSearchSurveyData', () => {
    it('should call proposalService getSearchSurveyData', async () => {
      await component.getSearchSurveyData('13');
      expect(proposalService.getSearchSurveyData).toHaveBeenCalledWith(component, '13');
    });
  });

  describe('onPageTrigger', () => {
    it('should call proposalService onPageTrigger', async () => {
      const env = { page_no: 2, records_per_page: 20 };
      await component.onPageTrigger(env);
      expect(proposalService.onPageTrigger).toHaveBeenCalledWith(component, env);
    });
  });

  describe('get deactiveField', () => {
    it('should return true if year and season selected', () => {
      component.selectedYear = ['2023'];
      component.selectedSeason = ['Kharif'];
      expect(component.deactiveField).toBeTruthy();
    });

    it('should return false if not selected', () => {
      component.selectedYear = [];
      component.selectedSeason = [];
      expect(component.deactiveField).toBeFalsy();
    });
  });

  describe('get isDataApprove', () => {
    it('should return true if any approve true', () => {
      component.tableData = [{ id: '1', approve: true }];
      expect(component.isDataApprove).toBe(true);
    });

    it('should return false if none approve', () => {
      component.tableData = [{ id: '1', approve: false }];
      expect(component.isDataApprove).toBe(false);
    });
  });
});