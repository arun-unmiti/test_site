import { Injectable } from '@angular/core';
import { CoreService } from '../core.service';
import * as XLSX from 'xlsx';
import * as moment from 'moment';
import { FILE_HEADERS } from './constants';

@Injectable({
  providedIn: 'root',
})
export class FileUploadService {
  constructor(private coreService: CoreService) {}

  async uploadChunksSequentially(component: any, data: any[]): Promise<string> {
    const chunks = this.chunkArray(data, component.chunkSize);
    let response_msg = '';
    let error_msg = false;
    let chunkNumber = 1;
    for (const chunk of chunks) {
      const request = { purpose: 'upload_product_details', data: chunk };
      component.submitting++;
      try {
        const response: any = await this.coreService.post('upload_data', request);
        response_msg = response.msg;
        if (response?.status !== 1) {
          error_msg = true;
          continue;
        }
        if (!response.failedUploads?.length){
          continue;
        }
        this.handleFailedUploads(component, response.failedUploads);
      } catch {
        error_msg = true;
        response_msg = 'Unable to upload Product Verification data';
      } finally {
        this.updateUploadProgress(component, chunkNumber);
        chunkNumber++;
      }
    }
    return error_msg ? response_msg : '';
  }

  private handleFailedUploads(component: any, failedUploads: any[]) {
    const failedApplications = failedUploads
      .map((application: any) => component.fileData.find((d: any) => d.intimation_id === application))
      .filter((d: any) => d);
    component.failedUploads = component.failedUploads.concat(this.coreService.clone(failedApplications));
  }

  private updateUploadProgress(component: any, chunkNumber: number) {
    component.submitting--;
    component.uploadedRecords = chunkNumber * component.chunkSize;
    if (component.uploadedRecords > component.totalUploadRecords) {
      component.uploadedRecords = component.totalUploadRecords;
    }
    component.progress = parseFloat(((component.uploadedRecords / component.totalUploadRecords) * 100).toFixed(1));
    if (component.uploadedRecords >= component.totalUploadRecords) {
      component.isUploading = false;
      component.ngbModalService.dismissAll();
    }
  }

  downloadInvalids(component: any) {
    const fileName = 'invalid_product_data';
    const jsonData: any[] = component.invalidFileData.map((data: any) => {
      const row = [];
      for (const field of FILE_HEADERS) {
        const cell = data[field.field];
        switch (field.field) {
          case 'crop':
            row.push(component.cropMapping[cell] || cell);
            break;
          case 'financial_year':
            row.push(component.yearMapping[cell] || cell);
            break;
          case 'season':
            row.push(component.seasonMapping[cell] || cell);
            break;
          default:
            row.push(cell);
            break;
        }
      }
      row.push(data.remark.join('.\n'));
      return row;
    });
    jsonData.unshift([...FILE_HEADERS.map((d) => d.header), 'Remark']);
    const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(jsonData);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, fileName);
    XLSX.writeFile(wb, `${moment().format('yyyyMMDD')}_${fileName}.xlsx`);
  }

  chunkArray(array: any[], size: number): any[][] {
    const result: any[][] = [];
    for (let i = 0; i < array.length; i += size) {
      result.push(array.slice(i, i + size));
    }
    return result;
  }
}