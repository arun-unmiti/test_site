import { TestBed } from '@angular/core/testing';
import { ProposalWiseManagementService } from './proposal-wise-management.service';
import { SurveyDataService } from '../../utilities/proposal-form/survey-data.service';
import { FilterDataService } from '../../utilities/proposal-form/filter-data.service';
import { DownloadExportService } from '../../utilities/proposal-form/download-export.service';
import { FileProcessingService } from '../../utilities/proposal-form/file-processing.service';
import { FileUploadService } from '../../utilities/proposal-form/file-upload.service';
import { RowColumnService } from '../../utilities/proposal-form/row-column.service';
import { CoreService } from '../../utilities/core.service';
import { FilterService } from '../../utilities/filter.service';

describe('ProposalWiseManagementService', () => {
  let service: ProposalWiseManagementService;

  const mockSurveyDataService = { getSurveyFields: jest.fn(), getSurveyData: jest.fn(), getSearchSurveyData: jest.fn(), onPageTrigger: jest.fn() };
  const mockFilterDataService = { getFilterData: jest.fn() };
  const mockDownloadExportService = { downloadTable: jest.fn(), exportExcel: jest.fn() };
  const mockFileProcessingService = { fileToJson: jest.fn() };
  const mockFileUploadService = { uploadChunksSequentially: jest.fn(), downloadInvalids: jest.fn() };
  const mockRowColumnService = {};

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ProposalWiseManagementService,
        { provide: SurveyDataService, useValue: mockSurveyDataService },
        { provide: FilterDataService, useValue: mockFilterDataService },
        { provide: DownloadExportService, useValue: mockDownloadExportService },
        { provide: FileProcessingService, useValue: mockFileProcessingService },
        { provide: FileUploadService, useValue: mockFileUploadService },
        { provide: RowColumnService, useValue: mockRowColumnService },
        { provide: CoreService, useValue: {} },
        { provide: FilterService, useValue: {} },
      ],
    });

    service = TestBed.inject(ProposalWiseManagementService);
  });

  it('should create the component', () => {
    expect(service).toBeTruthy();
  });

  it('should delegate getSurveyFields', async () => {
    const component = {};
    await service.getSurveyFields(component);
    expect(mockSurveyDataService.getSurveyFields).toHaveBeenCalledWith(component);
  });

  it('should delegate getFilterData', () => {
    const component = {};
    service.getFilterData(component);
    expect(mockFilterDataService.getFilterData).toHaveBeenCalledWith(component);
  });

  it('should delegate getSurveyData', async () => {
    const component = {};
    const surveyId = 1;
    await service.getSurveyData(component, surveyId);
    expect(mockSurveyDataService.getSurveyData).toHaveBeenCalledWith(component, surveyId);
  });

  it('should delegate downloadTable', async () => {
    const component = {};
    await service.downloadTable(component);
    expect(mockDownloadExportService.downloadTable).toHaveBeenCalledWith(component);
  });

  it('should delegate exportExcel', () => {
    const component = {};
    const data: any = [];
    const fields: any = [];
    service.exportExcel(component, data, fields);
    expect(mockDownloadExportService.exportExcel).toHaveBeenCalledWith(component, data, fields);
  });

  it('should delegate fileToJson', async () => {
    const component = {};
    const file = new Blob();
    await service.fileToJson(component, file);
    expect(mockFileProcessingService.fileToJson).toHaveBeenCalledWith(component, file);
  });

  it('should delegate uploadChunksSequentially', async () => {
    const component = {};
    const data: any = [];
    await service.uploadChunksSequentially(component, data);
    expect(mockFileUploadService.uploadChunksSequentially).toHaveBeenCalledWith(component, data);
  });
});