import { Injectable } from '@angular/core';
import { CoreService } from '../core.service';
import { FilterService } from '../filter.service';
import { RowColumnService } from './row-column.service';

@Injectable({
  providedIn: 'root',
})
export class SurveyDataService {
  constructor(
    private coreService: CoreService,
    private filterService: FilterService,
    private rowColumnService: RowColumnService
  ) {}

  async getSurveyFields(component: any) {
    component.lookupLoader++;
    const request = { purpose: 'get_surveyfields', survey_id: component.surveyId };
    try {
      const response: any = await this.coreService.data_post(request);
      if (response?.status === 1) {
        component.surveyFields = response?.fields || [];
        component.surveyFields = component.surveyFields.sort((a: any, b: any) => a.slno - b.slno);
        component.surveyFields = component.surveyFields.filter((field: any) =>
          ['lkp_year', 'lkp_season', 'product_crop'].includes(field.type)
        );
      }
    } catch {
      this.coreService.toast('error', 'Error fetching survey fields');
    } finally {
      component.lookupLoader--;
    }
  }

  async getSurveyData(component: any, surveyId: any) {
    component.currentpage = 1;
    if (!component.selectedYear.length || !component.selectedSeason.length) {
      this.coreService.toast('warning', 'Please select a year and season');
      return;
    }
    component.datalabel = {};
    const other_columns = this.buildOtherColumns(component);
    const { requests, isLocationAssigned } = this.buildRequests(component, surveyId, other_columns);
    if (!isLocationAssigned) {
      this.coreService.toast('warn', 'No data is available for the selected filters');
      return;
    }
    component.resetData();
    component.loading++;
    try {
      const responses = await Promise.all(requests);
      this.processResponses(component, responses);
    } catch {
      this.coreService.toast('warn', 'Error fetching data');
    }
    component.loading--;
  }

  async getSearchSurveyData(component: any, surveyId: any) {
    component.currentpage = 1;
    if (!component.selectedClient.length && !component.user?.unit_id) {
      this.coreService.toast('warn', 'Please select a client');
      return;
    }
    component.datalabel = {};
    const other_columns = this.buildOtherColumns(component);
    const request = {
      purpose: component.searchPurpose, survey_id: surveyId, agency_id: [], other_columns, client_id: ["2000"],
      pagination: { page_no: component.currentpage, records_per_page: component.recordsPerPage },
      user_id: component.selectedUser?.map((d: any) => d.user_id),
      start_date: component.selectedFromDate?.startDate?.format('YYYY-MM-DD'), end_date: component.selectedFromDate?.endDate?.format('YYYY-MM-DD'),
      years: [component.selectedYear], seasons: [component.selectedSeason], crop_column: component.crop_column, date_type: component.dateType,
    };
    component.loading++;
    component.showDataLabels = false;
    try {
      const response: any = await this.coreService.dashboard_post(request);
      if (response?.status === 1) {
        component.surveyData = this.processSurveyData(component, response?.surveydata || []);
        component.locationData = response?.locationdata;
        component.toalRecord = +(response?.[`total_${component.dataPurpose.replace('get_', '').replace('_surveydata', '')}`] || 1);
        component.showDraft = component.dataPurpose === 'get_draft_surveydata';
        ['totalUploads', 'totalApproved', 'totalRejected', 'totalPending', 'totalDraft'].forEach((k) => {
          const snakeKey = k.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
          component.datalabel[k] = response?.[snakeKey] ?? 0;
        });
        if (component.fields?.length) {
          this.rowColumnService.generateColDef(component);
          this.rowColumnService.generateRowData(component);
        }
      }
    } catch {
      this.coreService.toast('warn', 'Error fetching data');
    }
    component.loading--;
  }

  async onPageTrigger(component: any, env: any) {
    component.currentpage = env.page_no;
    component.recordsPerPage = env.records_per_page;
    const other_columns = this.buildOtherColumns(component);
    const request: any = this.buildRequest(component, other_columns);
    if (+component.user.user_role > 2) {
      request.states = request.states.length ? request.states : component.statesData.map((e: any) => e.state_id);
      request.districts = request.districts.length ? request.districts : this.filterService.districts.map((e: any) => e.district_id);
      request.tehsils = request.tehsils.length ? request.tehsils : this.filterService.tehsils.map((e: any) => e.tehsil_id);
    }
    component.loading++;
    try {
      const response: any = await this.coreService.data_post(request);
      if (response?.status === 1) {
        component.surveyData = this.processSurveyData(component, response?.surveydata || []);
        component.toalRecord = +(response?.[`total_${component.dataPurpose.replace('get_', '').replace('_surveydata', '')}`] || 1);
        ['totalUploads', 'totalApproved', 'totalRejected', 'totalPending', 'totalDraft'].forEach((k) => {
          const snakeKey = k.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
          component.datalabel[k] = response?.[snakeKey] ?? 0;
        });
        this.rowColumnService.generateRowData(component);
      }
    } catch {
      this.coreService.toast('warn', 'Error fetching data');
    }
    component.loading--;
  }

  private buildOtherColumns(component: any): any[] {
    const other_columns: any[] = [
      {
        condition: component.surveyId === 6,
        field: 'field_759',
        value: component.selectedOtherActivity?.map((d: any) => d.value) || [],
      },
      {
        condition: component.surveyId === 2 && !!component.surveyIntimationNo,
        field: 'field_779',
        value: component.surveyIntimationNo ? [component.surveyIntimationNo] : [],
      },
      {
        condition: !!component.searchCaseId,
        field: 'case_ID',
        value: component.searchCaseId ? [component.searchCaseId] : [],
      },
    ].reduce((acc: any[], column) => {
      if (column.condition) {
        acc.push({ field: column.field, value: column.value });
      }
      return acc;
    }, []);

    return other_columns;
  }

  private buildRequests(component: any, surveyId: any, other_columns: any[]): { requests: any[]; isLocationAssigned: boolean } {
    let isLocationAssigned = true;
    const requests = [
      { purpose: 'get_surveyfields', survey_id: surveyId },
      {
        purpose: component.dataPurpose, client_id: ["2000"],
        survey_id: surveyId,
        pagination: { page_no: component.currentpage, records_per_page: component.recordsPerPage },
        states: component.selectedState?.map((d: any) => d.state_id) || [],
        districts: component.selectedDist?.map((d: any) => d.district_id) || [],
        tehsils: component.selectedBlock.map((d: any) => d.tehsil_id) || [],
        crop_id: component.selectedCrop,
        user_id: component.selectedUser?.map((d: any) => d.user_id),
        start_date: component.selectedFromDate?.startDate?.format('YYYY-MM-DD'),
        end_date: component.selectedFromDate?.endDate?.format('YYYY-MM-DD'),
        agency_id: [],
        years: [component.selectedYear],
        seasons: [component.selectedSeason],
        notified_units: component.selectednotifiedUnits.map((d: any) => d.notified_id),
        no_of_visit: undefined,
        crop_column: component.crop_column,
        other_columns,
        date_type: component.dateType,
      },
    ].map((d: any) => {
      if (+component.user.user_role > 2 && d.purpose === component.dataPurpose) {
        d.states = d.states.length ? d.states : component.statesData.map((e: any) => e.state_id);
        d.districts = d.districts.length ? d.districts : this.filterService.districts.map((e: any) => e.district_id);
        d.tehsils = d.tehsils.length ? d.tehsils : this.filterService.tehsils.map((e: any) => e.tehsil_id);
        isLocationAssigned = d.states?.length;
      }
      return d.purpose !== component.dataPurpose && component.fieldResponse ? Promise.resolve(component.fieldResponse) : this.coreService.data_post(d);
    });
    return { requests, isLocationAssigned };
  }

  private buildRequest(component: any, other_columns: any[]): any {
    return {
      purpose: component.dataPurpose, client_id: ["2000"],
      survey_id: component.surveyId,
      states: component.selectedState?.map((d: any) => d.state_id) || [],
      districts: component.selectedDist?.map((d: any) => d.district_id) || [],
      tehsils: component.selectedBlock.map((d: any) => d.tehsil_id) || [],
      crop_id: component.selectedCrop,
      user_id: component.selectedUser?.map((d: any) => d.user_id),
      start_date: component.selectedFromDate?.startDate?.format('YYYY-MM-DD'),
      end_date: component.selectedFromDate?.endDate?.format('YYYY-MM-DD'),
      agency_id: null,
      years: [component.selectedYear],
      seasons: [component.selectedSeason],
      crop_column: component.crop_column,
      notified_units: component.selectednotifiedUnits.map((d: any) => d.notified_id),
      other_columns,
      pagination: { page_no: component.currentpage, records_per_page: component.recordsPerPage },
      date_type: component.dateType,
    };
  }

  private processResponses(component: any, responses: any[]) {
    component.showDataLabels = true;
    if (responses?.[0]?.status === 1) {
      component.fieldResponse = this.coreService.clone(responses[0]);
      component.fields = component.parentSurveyId
        ? [...(responses[0]?.[`fields${component.parentSurveyId}`] || []), ...(responses[0]?.[`fields${component.surveyId}`] || [])]
        : responses[0]?.fields || [];
      component.fields = component.fields.sort((a: any, b: any) => a.slno - b.slno).filter((d: any) => d.display === '1');
      component.parentFields = component.parentSurveyId
        ? (responses[0]?.[`fields${component.parentSurveyId}`] || []).sort((a: any, b: any) => a.slno - b.slno)
        : [];
    }
    if (responses?.[1]?.status === 1) {
      if (responses?.[1]?.status === 1 && responses[1]?.surveydata?.length) {
        const caseIds = this.coreService.uniqueList(responses[1]?.surveydata || [], 'case_ID');
        responses[1].surveydata = responses[1].surveydata.filter((d: any) => caseIds.includes(d.case_ID));
      }
      component.surveyData = this.processSurveyData(component, responses[1]?.surveydata || []);
      component.locationData = responses[1]?.locationdata;
      component.toalRecord =
        +(responses[1]?.[`total_${component.dataPurpose.replace('get_', '').replace('_surveydata', '')}`] ||
          (component.dataPurpose === 'get_view_product_details' ? responses[1]?.total_records : 1));
      component.showDraft = component.dataPurpose === 'get_draft_surveydata';
      ['totalUploads', 'totalApproved', 'totalRejected', 'totalPending', 'totalDraft'].forEach((k) => {
        const snakeKey = k.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        component.datalabel[k] = responses[1]?.[snakeKey] ?? 0;
      });
      if (component.url_id === '22') {
        component.datalabel.totalUploads = responses[1]?.total_records || 0;
      }
    }
    if (component.fields?.length) {
      this.rowColumnService.generateColDef(component);
      this.rowColumnService.generateRowData(component);
    }
  }

  private processSurveyData(component: any, surveydata: any[]): any[] {
    if (!component.parentSurveyId){
      return surveydata;
    }
    return surveydata.map((parent: any) => {
      const parentData: any = {};
      if (parent?.parent) {
        for (const key of Object.keys(parent.parent)) {
          if (key.includes('field_')) {
            parentData[key] = parent.parent[key];
          }
        }
      }
      return { ...parent, ...parentData };
    });
  }
}