import { Injectable } from '@angular/core';
import { CoreService } from '../../utilities/core.service';
import { FilterService } from '../../utilities/filter.service';
import * as XLSX from 'xlsx';
import * as moment from 'moment';

@Injectable({
  providedIn: 'root',
})
export class DownloadExportService {
  constructor(private coreService: CoreService, private filterService: FilterService) {}

  async downloadTable(component: any) {
    return new Promise(async (res, rej) => {
      component.abortController.signal.addEventListener('abort', () => rej('Download Aborted.'));
      const request = this.buildDownloadRequest(component);
      const resultData = await this.downloadTableRecords(request, [], component.isComponentActive, component.downloadRecordPerPage);
      res(this.generateDownloadData(component, resultData));
    });
  }

  private buildDownloadRequest(component: any) {
    const start_date = component.selectedFromDate?.startDate?.format('YYYY-MM-DD');
    const end_date = component.selectedFromDate?.endDate?.format('YYYY-MM-DD');
    const other_columns = this.buildOtherColumns(component);
    const request = {
      purpose: component.excelDownloadPurpose || component.dataPurpose, client_id: ["2000"],
      survey_id: component.surveyId,
      states: component.selectedState?.map((d: any) => d.state_id),
      districts: component.selectedDist?.map((d: any) => d.district_id),
      tehsils: component.selectedBlock.map((d: any) => d.tehsil_id),
      crop_id: component.selectedCrop,
      user_id: component.selectedUser?.map((d: any) => d.user_id),
      start_date,
      end_date,
      agency_id: [],
      years: [component.selectedYear],
      seasons: [component.selectedSeason],
      crop_column: component.crop_column,
      other_columns,
      date_type: component.dateType,
      pagination: { page_no: 1, records_per_page: component.downloadRecordPerPage },
    };
    if (
      +component.user.user_role > 2 &&
      (request.purpose === component.dataPurpose || request.purpose === component.excelDownloadPurpose)
    ) {
      request.states = request.states?.length ? request.states : component.statesData.map((e: any) => e.state_id);
      request.districts = request.districts?.length
        ? request.districts
        : this.filterService.districts.map((e: any) => e.district_id);
      request.tehsils = request.tehsils?.length ? request.tehsils : this.filterService.tehsils.map((e: any) => e.tehsil_id);
    }
    return request;
  }

  private async downloadTableRecords(
    request: any,
    resultData: any[] = [],
    isComponentActive: boolean,
    downloadRecordPerPage: number
  ): Promise<any[]> {
    if (!isComponentActive){
      return resultData;
    }
    const response: any = await this.coreService.post(request);
    if (response?.status === 1 && response.surveydata?.length) {
      resultData.push(...response.surveydata);
      request.pagination.page_no++;
      if (downloadRecordPerPage !== response.surveydata?.length){
        return resultData;
      }
      return this.downloadTableRecords(request, resultData, isComponentActive, downloadRecordPerPage);
    }
    return resultData;
  }

  exportExcel(component: any, data: any, fields: any) {
    const fieldsToExport = this.prepareFields(component, fields);
    const header = fieldsToExport.map((d: any) => d.header);
    const keys = fieldsToExport.map((d: any) => d.field);
    const excelData = data.map((item: any) =>
      keys.map((k: any) => (component.parentSurveyId ? item[k] || item?.parent?.[k] || '' : item[k]))
    );
    if (component.parentSurveyId) {
      data.forEach((item: any) => {
        delete item?.parent?.approved_reject;
        delete item?.parent?.approved_reject_by;
        delete item?.parent?.approved_reject_date;
        delete item?.parent?.approved_reject_status;
      });
    }
    excelData.unshift(header);
    this.writeToExcel(excelData, component.surveyName);
  }

  private prepareFields(component: any, fields: any) {
    if (component.url_id !== '22'){
      return fields.filter((field: any) => !field.excludeExport);
    }
    return fields
      .filter((field: any) => field.field !== 'sno')
      .concat([
        { field: 'id', header: 'AI ID', required: false, type: 'number' },
        { field: 'added_by_name', header: 'uploaded by', required: false, type: 'text' },
        { field: 'added_datetime', header: 'upload/time', required: false, type: 'text' },
      ]);
  }

  private writeToExcel(excelData: any[], surveyName: string) {
    const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(excelData);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    const sheetName = surveyName.replace('/', 'or');
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `${moment().format('yyyyMMDD')}_${sheetName}.xlsx`);
  }

  generateDownloadData(component: any, surveyData: any[]) {
    let tableData = this.coreService.clone(surveyData);
    if (component.parentSurveyId) {
      tableData = this.processParentSurveyData(tableData, component.noOfVisit);
    }
    const fieldMap: any = {
      state: component.stateMap,
      district: component.districtMap,
      tehsil: component.tehsilMap,
      block: component.blockMap,
      grampanchayat: component.grampanchayatMap,
      village: component.villageMap,
      crop: component.cropMap,
      season: component.seasonMap,
      financial_year: component.yearMap,
    };
    return tableData.map((data: any, i: number) => {
      data.sno = (component.currentpage - 1) * component.recordsPerPage + (i + 1);
      data.user_phone = component.userPhoneMap[data.user_id] || data.user_id;
      data.approved_reject = data.approved_reject === '0' ? 'Rejected' : data.approved_reject === '1' ? 'Approved' : 'Pending';
      this.processHeaderFields(data, fieldMap, component);
      if (component.parentSurveyId) {
        this.applyParentSurveyMappings(data, component);
      }
      return data;
    });
  }

  private processParentSurveyData(tableData: any[], noOfVisit: any): any[] {
    tableData.forEach((ele: any) => {
      if (ele.parent && typeof ele.parent === 'string') {
        ele.parent = JSON.parse(ele.parent);
      }
      ele.totalVisist = tableData.filter((e: any) => e.case_ID === ele.case_ID).length;
      ele.no_of_visit = ele.no_of_visit || ele.totalVisist;
    });
    return tableData.filter((ele: any) => !noOfVisit || (noOfVisit <= ele.totalVisist && ele.no_of_visit <= noOfVisit));
  }

  private processHeaderFields(data: any, fieldMap: any, component: any) {
    const headerFields = component.url_id === '22' ? JSON.parse(JSON.stringify(component.fileHeaders)) : JSON.parse(JSON.stringify(component.typeFields));
    headerFields.forEach((field: any) => {
      const fn = field.field;
      const val = data[fn];
      const parent = component.parentSurveyId && data.parent;
      if (field.type === 'product_crop') {
        data[fn] = component.cropMap.get(val) || component.cropMap.get('0' + val) || val;
        if (parent) {
          parent[fn] = component.cropMap.get(parent[fn]) || component.cropMap.get('0' + parent[fn]) || parent[fn];
        }
      } else if (field.type === 'lkp_season') {
        data[fn] = component.seasonMap.get(val) || val;
        if (parent) {
          parent[fn] = component.seasonMap.get(parent[fn]) || parent[fn];
        }
      } else if (field.type === 'lkp_year') {
        data[fn] = component.yearMap.get(val) || val;
        if (parent) {
          parent[fn] = component.yearMap.get(parent[fn]) || parent[fn];
        }
      } else if (component.url_id === '22' && fieldMap[fn]) {
        const isCrop = fn === 'crop';
        data[fn] = fieldMap[fn].get(val) || (isCrop ? fieldMap[fn].get('0' + val) : null) || val;
      }
    });
  }

  private applyParentSurveyMappings(data: any, component: any) {
    data.state_id = component.stateMap.get(data.state_id);
    data.dist_id = component.districtMap.get(data.dist_id);
    data.tehsil_id = component.tehsilMap.get(data.tehsil_id);
    data.block_id = component.blockMap.get(data.block_id);
    data.gp_id = component.grampanchayatMap.get(data.gp_id);
    data.village_id = component.villageMap.get(data.village_id);
    data.crop_id = component.cropMap.get(data.crop_id) || component.cropMap.get('0' + data.crop_id) || data.crop_id;
    data.totalVisist = undefined;
  }

  private buildOtherColumns(component: any): any[] {
    const other_columns: any[] = [];
    if (component.surveyId === 6) {
      other_columns.push({ field: 'field_759', value: component.selectedOtherActivity.map((d: any) => d.value) });
    }
    if (component.surveyId === 2 && component.surveyIntimationNo) {
      other_columns.push({ field: 'field_779', value: [component.surveyIntimationNo] });
    }
    if (component.searchCaseId) {
      other_columns.push({ field: 'case_ID', value: [component.searchCaseId] });
    }
    return other_columns;
  }
}