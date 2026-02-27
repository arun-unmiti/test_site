import { Injectable } from '@angular/core';
import { CoreService } from '../core.service';
import * as XLSX from 'xlsx';
import * as moment from 'moment';
import { FILE_HEADERS } from './constants';

@Injectable({
  providedIn: 'root',
})
export class FileProcessingService {
  constructor(private coreService: CoreService) {}

  async fileToJson(component: any, file: any) {
    return new Promise((res, rej) => {
      const fileReader = new FileReader();
      fileReader.onload = (event: any) => {
        const arrayBuffer = event.target.result;
        const text = new TextDecoder().decode(new Uint8Array(arrayBuffer));
        const data = this.parseCsv(text);
        if (!data?.length) {
          this.coreService.toast('warn', 'Empty file');
          res(null);
          return;
        }
        const sheetData = this.convertToSheetData(data);
        const { jsonData, validData, invalidData } = this.processSheetData(component, sheetData);
        res({ jsonData, validData, invalidData });
      };
      fileReader.readAsArrayBuffer(file);
    });
  }

  parseCsv(csvText: string): string[][] {
    const rows = csvText.split('\n');
    const result: string[][] = [];
  
    const parseRow = (row: string, i: number, columns: string[], currentColumn: string, insideQuotes: boolean): string[] | null => {
      if (i >= row.length) {
        columns.push(currentColumn.trim());
        if (columns.every((col) => col === '')) {
          return null;
        }
        return columns;
      }
  
      const char = row[i];
      if (char === '"') {
        return parseRow(row, i + 1, columns, currentColumn, !insideQuotes);
      }
      if (char === ',' && !insideQuotes) {
        columns.push(currentColumn.trim());
        return parseRow(row, i + 1, columns, '', insideQuotes);
      }
      return parseRow(row, i + 1, columns, currentColumn + char, insideQuotes);
    };
  
    for (const row of rows) {
      const columns = parseRow(row, 0, [], '', false);
      if (columns) {
        result.push(columns);
      }
    }
  
    return result as string[][];
  }

  convertToSheetData(data: any[]): any[] {
    const work_book = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(work_book, worksheet, 'Sheet1');
    const xlsxData = XLSX.write(work_book, { bookType: 'xlsx', type: 'array' });
    const work_book_from_csv = XLSX.read(xlsxData, { type: 'array', cellDates: true });
    return XLSX.utils.sheet_to_json(work_book_from_csv.Sheets[work_book_from_csv.SheetNames[0]], { header: 1 });
  }

  processSheetData(component: any, sheetData: any[]): { jsonData: any[]; validData: any[]; invalidData: any[] } {
    const uniqueCombinationSet: Set<string> = new Set();
    const jsonData: any[] = [];
    const validData: any[] = [];
    const invalidData: any[] = [];
    const fields: any = {};
    const keys: string[] = [];
    FILE_HEADERS.forEach((d: any) => {
      fields[d.field] = d;
      keys.push(d.field);
    });
    for (let i = 1; i < sheetData.length; i++) {
      const row = this.processRow(component, sheetData[i], keys, fields, uniqueCombinationSet);
      const combinationKey = `${row.crop || ''}-${row.season || ''}-${row.financial_year || ''}-${row.pincode || ''}`;
      if (!uniqueCombinationSet.has(combinationKey)) {
        uniqueCombinationSet.add(combinationKey);
        jsonData.push(row);
        (row.isValid ? validData : invalidData).push(row);
      }
    }
    return { jsonData, validData, invalidData };
  }

  processRow(component: any, sheet: any, keys: string[], fields: any, uniqueCombinationSet: Set<string>): any {
    const row: any = { errors: {}, isValid: true, remark: [] };
    this.populateRowFields(row, sheet, keys, component);
    const combinationKey = `${row.crop || ''}-${row.season || ''}-${row.financial_year || ''}-${row.pincode || ''}`;
    if (uniqueCombinationSet.has(combinationKey)){
      return row;
    }
    this.validateRowFields(row, fields);
    return row;
  }

  private populateRowFields(row: any, sheet: any, keys: string[], component: any) {
    keys.forEach((key, j) => {
      let cell = sheet[j];
      if (cell instanceof Date){
        cell = moment(cell).format('DD-MM-YYYY');
      }
      if (typeof cell === 'string'){
        cell = cell.trim();
      }
      row[key] = this.mapFieldValue(component, key, cell) || cell;
    });
  }

  private validateRowFields(row: any, fields: any) {
    FILE_HEADERS.forEach((field: any) => {
      if (!row[field.field] && field.default){
        row[field.field] = field.default;
      }
      if (!row[field.field] && field.requried) {
        const required = typeof field.requried === 'function' ? field.requried(row) : !field.requried;
        if (!required) {
          if (!field.zeroAllowed && row[field.field] === 0) {
            row.remark.push(`${field.header} is not allowed for zero value`);
            row.errors[field.field] = true;
            row.isValid = false;
          } else if (!row[field.field] && row[field.field] !== 0) {
            row.remark.push(`${field.header} is mandatory`);
            row.errors[field.field] = true;
            row.isValid = false;
          }
        }
      }
      this.validateField(field, row);
    });
  }

  mapFieldValue(component: any, key: string, cell: any): any {
    if (key === 'crop'){
      return component.pairedCropMapping[cell?.toLowerCase?.() || cell];
    }
    if (key === 'financial_year'){
      return component.pairedYearMapping[cell?.toLowerCase?.().trim() || cell];
    }
    if (key === 'season'){
      return component.pairedSeasonMapping[cell?.toLowerCase?.().trim() || cell];
    }
    return null;
  }

  validateField(field: any, row: any) {
    if (field.type === 'number' && row[field.field] && isNaN(+row[field.field])) {
      row.errors[field.field] = true;
      row.remark.push(field.is_lkp ? `${row[field.field]} value is incorrect for ${field.header}` : `${field.header} value must be in number format`);
      row.isValid = false;
    }
    if (field.type === 'date' && row[field.field]) {
      const datePattern = /^(18|19|20)\d\d-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/;
      if (!datePattern.test(row[field.field])) {
        row.errors[field.field] = true;
        row.remark.push(`${field.header} value must be in "YYYY-MM-DD" date format`);
        row.isValid = false;
      }
    }
    if (field.length && row[field.field] && row[field.field]?.length > field.length) {
      row.errors[field.field] = true;
      row.remark.push(`${field.header} value cannot exceed more than ${field.length} characters`);
      row.isValid = false;
    }
    if (field.type === 'alphanumaric' && row[field.field] && !/^[A-Z a-z 0-9]+$/.test(row[field.field])) {
      row.errors[field.field] = true;
      row.remark.push(`${field.header} value is incorrect, use only alphanumeric values`);
      row.isValid = false;
    }
  }
}