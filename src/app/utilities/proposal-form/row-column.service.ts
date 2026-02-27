import { Injectable } from '@angular/core';
import { CoreService } from '../core.service';

@Injectable({
  providedIn: 'root',
})
export class RowColumnService {
  constructor(private coreService: CoreService) {}

  generateRowData(component: any) {
    component.loading++;
    component.tableData = this.coreService.clone(component.surveyData);
    if (component.parentSurveyId) {
      component.tableData = component.tableData.filter(
        (ele: any) => !component.noOfVisit || (component.noOfVisit <= ele.totalVisist && ele.no_of_visit <= component.noOfVisit)
      );
    }
    const headerFields = component.url_id === '22' ? JSON.parse(JSON.stringify(component.fileHeaders)) : JSON.parse(JSON.stringify(component.typeFields));
    const mapFieldToMap: any = {
      state: component.stateMap, district: component.districtMap, tehsil: component.tehsilMap, block: component.blockMap, grampanchayat: component.grampanchayatMap,
      village: component.villageMap, crop: component.cropMap, season: component.seasonMap, financial_year: component.yearMap,
    };
    component.tableData.forEach((data: any, i: any) => {
      data.sno = (component.currentpage - 1) * component.recordsPerPage + (i + 1);
      data.approved_reject = data.approved_reject === '0' ? 'Rejected' : data.approved_reject === '1' ? 'Approved' : 'Pending';
      data.user_phone = component.userPhoneMap[data.user_id] || data.user_id;
      this.processRowFields(data, headerFields, mapFieldToMap, component);
    });
    component.loading--;
    setTimeout(() => component.pagination?.updatePagination(), 1000);
  }

  private processRowFields(data: any, headerFields: any[], mapFieldToMap: any, component: any) {
    headerFields.forEach((field: any) => {
      const fieldName = field.field;
      const value = data[fieldName];
      if (field.type === 'product_crop') {
        data[fieldName] = component.cropMap.get(value) || component.cropMap.get('0' + value) || value;
      } else if (field.type === 'lkp_season') {
        data[fieldName] = component.seasonMap.get(value) || value;
      } else if (field.type === 'lkp_year') {
        data[fieldName] = component.yearMap.get(value) || value;
      } else if (component.url_id === '22' && mapFieldToMap[fieldName]) {
        const source = ['crop', 'season', 'financial_year'].includes(fieldName) ? value : value;
        data[fieldName] = fieldName === 'crop'
          ? mapFieldToMap[fieldName].get(source) || mapFieldToMap[fieldName].get('0' + source) || source
          : mapFieldToMap[fieldName].get(source) || source;
      }
    });
  }

  generateColDef(component: any) {
    const exportExcludesTypes = ['tab', 'kml', 'file', 'signature'];
    component.colDefs =
      component.url_id !== '22'
        ? component.fields
            .map((field: any) => ({
              field: `field_${field.field_id}`, header: field.display_name || field.label, type: field.type,
              id: field.field_id, subtype: field.subtype, excludeExport: exportExcludesTypes.includes(field.type),
            }))
            .filter((d: any) => d.type !== 'tab')
        : JSON.parse(JSON.stringify(component.fileHeaders));
    if (component.url_id !== '22') {
      if (component.canViewData) {
        component.colDefs.unshift({ field: 'action', header: 'Action', type: 'viewbutton', excludeExport: true });
      }
      component.colDefs.push(
        { field: 'agency_id', header: 'Agency', type: 'lkp_agency' }, { field: 'first_name', header: 'First name' }, { field: 'last_name', header: 'Last Name' },
        { field: 'user_id', header: 'User Id' }, { field: 'user_phone', header: 'User Phone No' }, { field: 'datetime', header: 'Date Time' }, { field: 'case_ID', header: 'Case Id' }, { field: 'id', header: 'AI ID' }
      );
      if (component.dataPurpose !== 'get_pending_surveydata') {
        component.colDefs.push({ field: 'approved_reject_date', header: 'Approved / Rejected Date' });
      }
      if (component.showApproveColumn) {
        component.colDefs.push({ field: 'approved_reject', header: 'Validation Status' });
      }
      if (component.parentSurveyId) {
        component.colDefs.push({ field: 'no_of_visit', header: 'No of visit' });
      }
    }
    component.colDefs.unshift({ field: 'sno', header: 'S No.' });
    component.colDefs.forEach((col: any) => (col.visibility = true));
    component.allColDefs = this.coreService.clone(component.colDefs);
    component.typeFields = component.fields
      .filter((d: any) => ['lkp', 'product'].some((t) => d.type.startsWith(t)) || ['kml', 'file', 'select'].includes(d.type))
      .map((d: any) => ({ type: d.type, field: `field_${d.field_id}`, subtype: d.subtype }));
  }
}