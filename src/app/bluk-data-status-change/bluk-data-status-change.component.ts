import { Component, OnInit, ViewChild } from '@angular/core';
import * as XLSX from 'xlsx';
import { CoreService } from '../utilities/core.service';
import * as moment from 'moment';
import { Route, Router } from '@angular/router';
import { FeatureToggleService } from "../shared/services/feature-toggle.service";
import { environment, ProjectContext } from "../../environments/environment";
import { UserDetailService } from '../auth/user-detail.service';
import { InsightsService } from '../utilities/insights.service';

@Component({
  selector: 'app-bluk-data-status-change',
  templateUrl: './bluk-data-status-change.component.html',
  styleUrls: ['./bluk-data-status-change.component.css']
})
export class BlukDataStatusChangeComponent implements OnInit {


  initLoading: any = 0;
  statuses: any[];
  fileName: any = '';
  updatedStatus: any = ''
  survey: any = '2';
  fileData: any[] = [];
  loading = 0;
  surveyData:any[] = [];
  fields:any[] = [];
  validRecords: any[] = [];
  invalidRecords: any[] = [];
  invalidColumns: any[] =["AI ID","Case Id", "Remark"]
  @ViewChild('fileEle') fileEle: any;
  surveyId: any;
  title: any;
  exportFile: any;
  csrfTokenName: any;
  csrfToken: any;
  projectContext: ProjectContext;
  assetsFolder: string; 

  constructor(private core: CoreService, private route: Router, private featureToggle: FeatureToggleService, private userService: UserDetailService, private insightsService: InsightsService) {
    this.projectContext = this.featureToggle.getContext() as ProjectContext;
    this.assetsFolder = environment.projectConfigs[this.projectContext].assetsFolder;
    this.statuses = [
      {label: 'Approve', value: 'approve_data'},
      {label: 'Reject', value: 'reject_data'},
      {label: 'Revert', value: 'revert_approve_data'},
    ]
  }

  ngOnInit(): void {
    if(this.route.url.includes('chm')){
      this.title = "CHM Bulk Bucket Upload";
      this.surveyId = 1;
      this.exportFile = `${this.assetsFolder}/data/chm_bluk_update_template.xlsx`;
    } else if (this.route.url.includes('cls')) {
      this.title = "CLS Bulk Bucket Upload"
      this.surveyId = 2;
      this.exportFile = `${this.assetsFolder}/data/cls_bluk_update_template.xlsx`;
      this.invalidColumns = ["AI ID","Case Id", "Intimation no", "Remark"];
    } else if (this.route.url.includes('cce')) {
      this.title = "CCE Bulk Bucket Upload"
      this.surveyId = 3;
      this.exportFile = `${this.assetsFolder}/data/cce_bluk_update_template.xlsx`;
    }
    this.getSurveyFields();		
    this.csrfTokenName = this.userService.getcsrfTokenName();
    this.csrfToken = this.userService.getcsrfToken();
  }

  getSurveyFields() {
    this.initLoading++
    const request = {purpose:"get_surveyfields",survey_id:this.surveyId};
    this.core.data_post(request).then((response: any) => {
      if (response?.status == 1) {
        this.fields = (response?.fields || [])
      }
    }).catch(err => {
      this.insightsService.logException(err);
    }).finally(() => this.initLoading--)
  }

  onFileEleClick(element: any) {
    this.validRecords = [];
    this.invalidRecords = [];
    this.fileData = [];
    this.fileEle.nativeElement.value = null
    this.fileName = '';
  }

  async onFileChange(event: any) {
    if (event.target.files?.length == 1) {
      const file = event.target.files[0];
      const fileData: any = await this.fileToJson(file);
      if (fileData?.length) {
        this.fileName = file.name;
        this.fileData = fileData;
        if (this.updatedStatus === 'approve_data') {
          this.fetchSurveyData(fileData);
        }
      } else {
        event.target.value = null;
      }

    }
  }

  async fileToJson (file: any) {
    return await new Promise((res,rej) => {
      const fileReader = new FileReader();
      fileReader.onload = (event: any) => {
        const data = new Uint8Array(event.target.result);
        const work_book = XLSX.read(data, {type:'array'});
        const sheet_name = work_book.SheetNames;
        const sheet_data = XLSX.utils.sheet_to_json(work_book.Sheets[sheet_name[0]], {header:1});
        if (sheet_data?.length) {
          const headers: any = sheet_data[0];
          if (this.surveyId == 2 && (headers?.length !== 3 || headers[0]?.trim().toLowerCase() !== "ai id" || headers[1]?.trim().toLowerCase() !== "case id" || headers[2]?.trim().toLowerCase() !== "intimation no")) {
            this.core.toast('warn',"Invalid file data")
            res(null);
          } else if (this.surveyId != 2 && (headers?.length !== 2 || headers[0]?.trim().toLowerCase() !== "ai id" || headers[1]?.trim().toLowerCase() !== "case id")) {
            this.core.toast('warn',"Invalid file data")
            res(null);
          } else {
            const jsonData: any[] = [];
            const keys = ['ai_id', 'case_id', 'intimation_id']
            for (let i = 1; i < sheet_data.length; i++) {
              const data: any = sheet_data[i];
              const row: any = {};
              if ((this.surveyId == 2 && data.length != 3) || (this.surveyId != 2 && data.length != 2)) {
                this.core.toast('warn',"Invalid file data")
                res(null);
                break
              } else {
                for (let j = 0; j < data.length; j++) {
                  const cell = data[j];
                  row[keys[j]] = cell;
                }
                jsonData.push(row);
              }
            }
            const [ai_ids,caseIds,intimationIds] = [[],[],[]];
            for (let i = 0; i < jsonData.length; i++) {
              const data = jsonData[i];
              if (!data.ai_id) {
                this.core.toast('warn',`AI ID is missing at row no. ${i+2}`);
                res(null)
                return;
              }
              if (isNaN(+data.ai_id)) {
                this.core.toast('warn',`Invalid AI ID at row no. ${i+2}`);
                res(null)
                return;
              }
              if (!data.case_id) {
                this.core.toast('warn',`Case Id is missing at row no. ${i+2}`);
                res(null)
                return;
              }
              if (data.case_id?.length != 10) {
                this.core.toast('warn',`Case Id's is not 10 charector at row no. ${i+2}`);
                res(null)
                return;
              }
              if (this.surveyId == 2) {
                if (!data.intimation_id) {
                  this.core.toast('warn',`Intimation is missing at row no. ${i+2}`);
                  res(null)
                  return;
                }
                const expectedIntimationLength = this.projectContext === 'munichre' ? 24 : 23;
                if (data.intimation_id?.length != expectedIntimationLength) {
                  this.core.toast('warn', `Case Id's is not ${expectedIntimationLength} charector at row no. ${i + 2}`);
                  res(null);
                  return;
                }
                const intimationIdChunck = data.intimation_id.split('-');
                if (intimationIdChunck[0] != 'INT') {
                  this.core.toast('warn',`Invalid intimation Id initial at row no. ${i+2}`);
                  res(null)
                  return;
                }
                if (intimationIdChunck[1]?.length != 4 || isNaN(+intimationIdChunck[1])) {
                  this.core.toast('warn',`Invalid intimation Id year at row no. ${i+2}`);
                  res(null)
                  return;
                }
                if (intimationIdChunck[2]?.length != 2 || !/[A-Z]/g.test(intimationIdChunck[2])) {
                  this.core.toast('warn',`Invalid intimation Id state at row no. ${i+2}`);
                  res(null)
                  return;
                }
                if (intimationIdChunck[3]?.length != 2 || !/[A-Z]/g.test(intimationIdChunck[3])) {
                  this.core.toast('warn',`Invalid intimation Id season at row no. ${i+2}`);
                  res(null)
                  return;
                }
                const expectedChunkLength = this.projectContext === 'munichre' ? 9 : 8;
                if (intimationIdChunck[4]?.length != expectedChunkLength || isNaN(intimationIdChunck[4])) {
                  this.core.toast('warn', `Invalid intimation Id at row no. ${i + 2}`);
                  res(null);
                  return;
                }
              }
            }
            if (this.surveyId == 2 && new Set(jsonData.map(d => d.intimation_id)).size !== jsonData.length) {
              this.core.toast('warn',"Duplicate intimation id")
              res(null)
            } else {
              res(jsonData);
            }
          }
        } else {
          this.core.toast('warn',"Empty file")
          res(null)
        }
      }
      fileReader.readAsArrayBuffer(file);
    })
  }

  fetchSurveyData(fileData: any[]) {
    const request = {purpose: 'get_records_by_id', survey_id: this.surveyId, data: fileData}
    this.core.post(request).then((response: any) => {
      if (response?.status == 1) {
        this.surveyData = response.surveydata || [];
        this.validateSurveyData();
      }
    }).catch(err => {
      this.insightsService.logException(err);
    })
  }

  validateSurveyData() {
    this.validRecords = [];
    this.invalidRecords = [];
    const parentTabs = this.fields.filter(d => d.type == 'tab').map(d => d.field_id);
    for (let i = 0; i < this.surveyData.length; i++) {
      const data = this.surveyData[i];
      data.errors = [];
      for (let fid = 0; fid < this.fields.length; fid++) {
        const field = this.fields[fid];
        if (field.type != 'tab' && field.type != 'file') {
          if (parentTabs.includes(field.parent_id) || data[`field_${field.parent_id}`] == field.parent_value) {
            if (field.required && !data[`field_${field.field_id}`]) {
              data.errors.push(`${field?.label} is required.`);
            }
            if (data[`field_${field.field_id}`] && field.maxlength && data[`field_${field.field_id}`]?.length > +field.maxlength) {
              data.errors.push(`${field?.label} value should not exceed ${field.maxlength} charecter.`);
            }
            if (field.type == 'number' && field.subtype != 'phone' && data[`field_${field.field_id}`] && field.max_val &&  +data[`field_${field.field_id}`] > +field.max_val) {
              data.errors.push(`${field?.label} value should not more than ${field.max_val}.`);
            }
          }
        }
      }
      data.errors = data.errors.join('\n');
      if (!data.errors.trim()) {
        this.validRecords.push({ai_id: data.id});
      } else {
        if (this.surveyId == 1) {
          this.invalidRecords.push({"AI ID": data.id, "Case Id": data.case_ID, "Intimation no": data.field_779, "Remark": data.errors});
        } else {
          this.invalidRecords.push({"AI ID": data.id, "Case Id": data.case_ID, "Remark": data.errors});
        }
      }
    }
  }

  onStatusFlagChange(event: any) {
    this.validRecords = [];
    this.invalidRecords = [];
    this.fileData = [];
    this.fileName = '';
    this.fileEle.nativeElement.value = null;
  }

  onSubmit() {
    if (!this.updatedStatus) {
      this.core.toast('warn',"Please update the status.");
      return
    }
    if (!this.fileName || !this.fileData?.length) {
      this.core.toast('warn',"Please upload file.");
      return
    }
    if (this.updatedStatus == 'approve_data') {
      this.fileData = this.validRecords;
    }
    const data = this.fileData.map(d => ({id: d.ai_id}))
    const request = { purpose: this.updatedStatus, survey_id: this.surveyId, data };
    this.loading++;
    this.core
      .post(request)
      .then((response: any) => {
        if (response.status == 1) {
          this.core.toast("success", response.msg);
          this.validRecords = [];
          this.invalidRecords = [];
          this.fileData = [];
          this.fileName = '';
          if (this.fileEle?.nativeElement?.value) {
            this.fileEle.nativeElement.value = null
          }
        } else {
          this.core.toast("error", response.msg);
        }
      })
      .catch((err) => {
        this.insightsService.logException(err);
        this.core.toast("error", "Unable to update approve status");
      })
      .finally(() => this.loading--);
  }

  /**
   * method to download failed validation data
   */
  onFaildDownload() {
    const fileName = 'Failed_CLS_Data';
    const jsonData: any[] = this.invalidRecords.map(data => {
      const row = [];
      for (let i = 0; i < this.invalidColumns.length; i++) {
        const cell = this.invalidColumns[i];
        row.push(data[cell]);
      }
      return row;
    })
    jsonData.unshift(this.invalidColumns);
    const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(jsonData);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    const sheetName = fileName;
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `${moment(new Date()).format('YYYYMMDD')}_${fileName}.xlsx`);
  }

}
