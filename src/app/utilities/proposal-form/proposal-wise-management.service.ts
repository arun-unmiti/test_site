import { Injectable } from '@angular/core';
import { CoreService } from '../../utilities/core.service';
import { FilterService } from '../../utilities/filter.service';
import { SurveyDataService } from '../../utilities/proposal-form/survey-data.service';
import { FilterDataService } from '../../utilities/proposal-form/filter-data.service';
import { DownloadExportService } from '../../utilities/proposal-form/download-export.service';
import { FileProcessingService } from '../../utilities/proposal-form/file-processing.service';
import { FileUploadService } from '../../utilities/proposal-form/file-upload.service';
import { RowColumnService } from '../../utilities/proposal-form/row-column.service';

@Injectable({
  providedIn: 'root',
})
export class ProposalWiseManagementService {
  constructor(
    private coreService: CoreService,
    private filterService: FilterService,
    private surveyDataService: SurveyDataService,
    private filterDataService: FilterDataService,
    private downloadExportService: DownloadExportService,
    private fileProcessingService: FileProcessingService,
    private fileUploadService: FileUploadService,
    private rowColumnService: RowColumnService
  ) {}

  async getSurveyFields(component: any) {
    return this.surveyDataService.getSurveyFields(component);
  }

  getFilterData(component: any) {
    return this.filterDataService.getFilterData(component);
  }

  async getSurveyData(component: any, surveyId: any) {
    return this.surveyDataService.getSurveyData(component, surveyId);
  }

  async getSearchSurveyData(component: any, surveyId: any) {
    return this.surveyDataService.getSearchSurveyData(component, surveyId);
  }

  async onPageTrigger(component: any, env: any) {
    return this.surveyDataService.onPageTrigger(component, env);
  }

  async downloadTable(component: any) {
    return this.downloadExportService.downloadTable(component);
  }

  exportExcel(component: any, data: any, fields: any) {
    return this.downloadExportService.exportExcel(component, data, fields);
  }

  async fileToJson(component: any, file: any) {
    return this.fileProcessingService.fileToJson(component, file);
  }

  async uploadChunksSequentially(component: any, data: any[]): Promise<string> {
    return this.fileUploadService.uploadChunksSequentially(component, data);
  }

  downloadInvalids(component: any) {
    return this.fileUploadService.downloadInvalids(component);
  }
}