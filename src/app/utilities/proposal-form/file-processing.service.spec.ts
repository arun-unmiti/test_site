import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { of } from 'rxjs';
import * as XLSX from 'xlsx';
import * as moment from 'moment';

import { FileProcessingService } from './file-processing.service';
import { CoreService } from '../core.service';

// Mock Services
class MockCoreService {
  toast = jest.fn();
}

jest.mock('./constants', () => ({
  FILE_HEADERS: [
    { field: 'season', header: 'Season', requried: true, type: 'number' },
    { field: 'financial_year', header: 'Financial Year', requried: true, type: 'number' },
    { field: 'product_name', header: 'Product Name', requried: true, type: 'text' },
    { field: 'state', header: 'State', requried: true, type: 'text' },
    { field: 'district', header: 'District', requried: true, type: 'text' },
    { field: 'block', header: 'Block', requried: true, type: 'text' },
    { field: 'location', header: 'Location', requried: true, type: 'text' },
    { field: 'pincode', header: 'Pincode', requried: true, type: 'number', length: 6 },
    { field: 'crop', header: 'Crop', requried: true, type: 'text' },
    { field: 'area_insured', header: 'Area Insured', requried: true, type: 'number' },
    { field: 'premium_unit', header: 'Premium Unit', requried: true, type: 'number' },
    { field: 'sum_insured_unit', header: 'Sum Insured Unit', requried: true, type: 'number' },
    { field: 'risk_start_date', header: 'Risk Start Date', requried: true, type: 'date' },
    { field: 'risk_end_date', header: 'Risk End Date', requried: true, type: 'date' },
    { field: 'alphanum_field', header: 'Alphanum', type: 'alphanumaric' },
    { field: 'zero_not_allowed', header: 'Zero Not Allowed', requried: true, zeroAllowed: false, type: 'number' },
    { field: 'some_field', default: 'default' },
  ],
}));

const mockFileHeaders = [
  { field: 'season', header: 'Season', requried: true, type: 'number' },
  { field: 'financial_year', header: 'Financial Year', requried: true, type: 'number' },
  { field: 'product_name', header: 'Product Name', requried: true, type: 'text' },
  { field: 'state', header: 'State', requried: true, type: 'text' },
  { field: 'district', header: 'District', requried: true, type: 'text' },
  { field: 'block', header: 'Block', requried: true, type: 'text' },
  { field: 'location', header: 'Location', requried: true, type: 'text' },
  { field: 'pincode', header: 'Pincode', requried: true, type: 'number', length: 6 },
  { field: 'crop', header: 'Crop', requried: true, type: 'text' },
  { field: 'area_insured', header: 'Area Insured', requried: true, type: 'number' },
  { field: 'premium_unit', header: 'Premium Unit', requried: true, type: 'number' },
  { field: 'sum_insured_unit', header: 'Sum Insured Unit', requried: true, type: 'number' },
  { field: 'risk_start_date', header: 'Risk Start Date', requried: true, type: 'date' },
  { field: 'risk_end_date', header: 'Risk End Date', requried: true, type: 'date' },
  { field: 'alphanum_field', header: 'Alphanum', type: 'alphanumaric' },
  { field: 'zero_not_allowed', header: 'Zero Not Allowed', requried: true, zeroAllowed: false, type: 'number' },
  { field: 'some_field', default: 'default' },
];

describe('FileProcessingService', () => {
  let service: FileProcessingService;
  let coreService: any;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        FileProcessingService,
        { provide: CoreService, useClass: MockCoreService },
      ],
    });

    service = TestBed.inject(FileProcessingService);
    coreService = TestBed.inject(CoreService);
  });

  it('should create the component', () => {
    expect(service).toBeTruthy();
  });

  describe('fileToJson', () => {
    jest.setTimeout(10000); // Increase timeout for file reading tests

    it('should convert file to json', fakeAsync(() => {
      const component = { pairedCropMapping: { 1: 1 }, pairedYearMapping: { 2023: 2023 }, pairedSeasonMapping: { 1: 1 } };
      const file = new Blob(['season,financial_year,product_name,state,district,block,location,pincode,crop,area_insured,premium_unit,sum_insured_unit,risk_start_date,risk_end_date\n1,2023,Product,State,District,Block,Location,123456,1,1,1,1,2023-01-01,2023-12-31'], { type: 'text/csv' });
      const promise = service.fileToJson(component, file);
      tick(1000); // Simulate time for file reading
      promise.then((result: any) => {
        expect(result).toBeDefined();
        expect(result.jsonData.length).toBe(1);
      });
    }));

    it('should handle empty file', fakeAsync(() => {
      const component = {};
      const file = new Blob([''], { type: 'text/csv' });
      const promise = service.fileToJson(component, file);
      tick(1000); // Simulate time for file reading
      promise.then((result) => {
        expect(result).toBeNull();
        expect(coreService.toast).toHaveBeenCalledWith('warn', 'Empty file');
      });
    }));
  });

  describe('parseCsv', () => {
    it('should parse csv text', () => {
      const csvText = 'field1,field2\nvalue1,"value2"\nvalue3,value4';
      const result = service.parseCsv(csvText);
      expect(result).toEqual([['field1', 'field2'], ['value1', 'value2'], ['value3', 'value4']]);
    });

    it('should skip empty rows', () => {
      const csvText = '\nfield1,field2\n\nvalue1,value2';
      const result = service.parseCsv(csvText);
      expect(result).toEqual([['field1', 'field2'], ['value1', 'value2']]);
    });

    it('should handle quotes inside quotes', () => {
      const csvText = 'field1,"field""2"""\nvalue1,"value""2"""';
      const result = service.parseCsv(csvText);
      expect(result).toEqual([['field1', 'field2'], ['value1', 'value2']]);
    });

    it('should handle commas inside quotes', () => {
      const csvText = '"value,1","value2"';
      const result = service.parseCsv(csvText);
      expect(result).toEqual([['value,1', 'value2']]);
    });
  });

  describe('convertToSheetData', () => {
    it('should convert data to sheet data', () => {
      const data = [['field1', 'field2'], ['value1', 'value2']];
      const result = service.convertToSheetData(data);
      expect(result).toEqual([['field1', 'field2'], ['value1', 'value2']]);
    });

    it('should handle dates', () => {
      const data = [['date'], [new Date('2023-01-01')]];
      const result = service.convertToSheetData(data);
      expect(result[1][0] instanceof Date).toBe(true);
    });
  });

  describe('processSheetData', () => {
    it('should process sheet data with invalid rows', () => {
      const component = { pairedCropMapping: {}, pairedYearMapping: {}, pairedSeasonMapping: {} };
      const sheetData = [
        ['season', 'financial_year', 'product_name', 'state', 'district', 'block', 'location', 'pincode', 'crop', 'area_insured', 'premium_unit', 'sum_insured_unit', 'risk_start_date', 'risk_end_date'],
        ['invalid', 'invalid', '', 'State', 'District', 'Block', 'Location', '1234567', 'Crop', 'abc', '1', '1', 'invalid', '2023-12-31'],
      ];
      const result = service.processSheetData(component, sheetData);
      expect(result.jsonData.length).toBe(1);
      expect(result.validData.length).toBe(0);
      expect(result.invalidData.length).toBe(1);
      expect(result.invalidData[0].remark).toContain('Season value must be in number format');
    });

    it('should handle duplicates', () => {
      const component = { pairedCropMapping: {}, pairedYearMapping: {}, pairedSeasonMapping: {} };
      const sheetData = [
        ['season', 'financial_year', 'product_name', 'state', 'district', 'block', 'location', 'pincode', 'crop', 'area_insured', 'premium_unit', 'sum_insured_unit', 'risk_start_date', 'risk_end_date'],
        ['1', '2023', 'Product', 'State', 'District', 'Block', 'Location', '123456', 'Crop', '1', '1', '1', '2023-01-01', '2023-12-31'],
        ['1', '2023', 'Product2', 'State2', 'District2', 'Block2', 'Location2', '123456', 'Crop', '2', '2', '2', '2023-01-01', '2023-12-31'],
      ];
      const result = service.processSheetData(component, sheetData);
      expect(result.jsonData.length).toBe(1);
    });
  });

  describe('processRow', () => {
    it('should process invalid row', () => {
      const component = { pairedCropMapping: {}, pairedYearMapping: {}, pairedSeasonMapping: {} };
      const sheet = ['invalid', 'invalid', '', 'State', 'District', 'Block', 'Location', '1234567', 'Crop', 'abc', '1', '1', 'invalid', '2023-12-31'];
      const keys = mockFileHeaders.map(h => h.field);
      const fields: { [key: string]: any } = mockFileHeaders.reduce((acc: { [key: string]: any }, f) => { acc[f.field] = f; return acc; }, {});
      const uniqueSet = new Set<string>();
      const result = service.processRow(component, sheet, keys, fields, uniqueSet);
      expect(result.isValid).toBe(false);
      expect(result.remark.length).toBeGreaterThan(0);
    });

    it('should skip if duplicate', () => {
      const component = { pairedCropMapping: {}, pairedYearMapping: {}, pairedSeasonMapping: {} };
      const sheet = ['1', '2023', 'Product', 'State', 'District', 'Block', 'Location', '123456', 'Crop', '1', '1', '1', '2023-01-01', '2023-12-31'];
      const keys = mockFileHeaders.map(h => h.field);
      const fields: { [key: string]: any } = mockFileHeaders.reduce((acc: { [key: string]: any }, f) => { acc[f.field] = f; return acc; }, {});
      const uniqueSet = new Set<string>(['Crop-1-2023-123456']);
      const result = service.processRow(component, sheet, keys, fields, uniqueSet);
      expect(result.isValid).toBe(true); // But since duplicate, not added in processSheetData
    });
  });

  describe('populateRowFields', () => {
    it('should populate fields', () => {
      const row: any = {};
      const sheet = ['1', '2023'];
      const keys = ['season', 'financial_year'];
      const component = { pairedSeasonMapping: {'1': 1}, pairedYearMapping: {'2023': 2023} };
      service['populateRowFields'](row, sheet, keys, component);
      expect(row['season']).toBe(1);
      expect(row['financial_year']).toBe(2023);
    });

    it('should format date fields', () => {
      const row: any = {};
      const sheet = [new Date('2023-01-01')];
      const keys = ['risk_start_date'];
      const component = { pairedCropMapping: {}, pairedYearMapping: {}, pairedSeasonMapping: {} };
      service['populateRowFields'](row, sheet, keys, component);
      expect(row['risk_start_date']).toBe('01-01-2023');
    });

    it('should trim strings', () => {
      const row: any = {};
      const sheet = [' test '];
      const keys = ['product_name'];
      const component = { pairedCropMapping: {}, pairedYearMapping: {}, pairedSeasonMapping: {} };
      service['populateRowFields'](row, sheet, keys, component);
      expect(row['product_name']).toBe('test');
    });
  });

  describe('validateRowFields', () => {
    it('should validate required fields', () => {
      const row: any = { product_name: '' , errors: {}, remark: [], isValid: true};
      const fields: { [key: string]: any } = { product_name: { requried: true, header: 'Product Name' } };
      service['validateRowFields'](row, fields);
      expect(row.remark).toContain('Product Name is mandatory');
      expect(row.isValid).toBe(false);
    });

    it('should check zero not allowed', () => {
      const row: any = { zero_not_allowed: 0 , errors: {}, remark: [], isValid: true};
      const fields: { [key: string]: any } = { zero_not_allowed: { requried: true, zeroAllowed: false, header: 'Zero Not Allowed' } };
      service['validateRowFields'](row, fields);
      expect(row.remark).toContain('Zero Not Allowed is not allowed for zero value');
      expect(row.isValid).toBe(false);
    });

    it('should set default if not required', () => {
      const row: any = { some_field: null , errors: {}, remark: [], isValid: true};
      const fields: { [key: string]: any } = { some_field: { default: 'default' } };
      service['validateRowFields'](row, fields);
      expect(row.some_field).toBe('default');
    });
  });

  describe('mapFieldValue', () => {
    it('should map crop', () => {
      const component = { pairedCropMapping: { crop1: '001' } };
      expect(service.mapFieldValue(component, 'crop', 'crop1')).toBe('001');
      expect(service.mapFieldValue(component, 'crop', 'Crop1')).toBe('001');
      expect(service.mapFieldValue(component, 'crop', 'unknown')).toBeUndefined();
    });

    it('should map financial_year', () => {
      const component = { pairedYearMapping: { '2023': 2023 } };
      expect(service.mapFieldValue(component, 'financial_year', '2023')).toBe(2023);
      expect(service.mapFieldValue(component, 'financial_year', ' 2023 ')).toBe(2023);
    });

    it('should map season', () => {
      const component = { pairedSeasonMapping: { season1: 1 } };
      expect(service.mapFieldValue(component, 'season', 'season1')).toBe(1);
    });

    it('should return null for other keys', () => {
      const component = {};
      expect(service.mapFieldValue(component, 'other', 'value')).toBeNull();
    });
  });

  describe('validateField', () => {
    it('should validate number', () => {
      const field = { type: 'number', header: 'Number', field: 'number' };
      const row: any = { number: 'abc', errors: {}, remark: [], isValid: true };
      service.validateField(field, row);
      expect(row.remark).toContain('Number value must be in number format');
      expect(row.isValid).toBe(false);
    });

    it('should validate date', () => {
      const field = { type: 'date', header: 'Date', field: 'date' };
      const row: any = { date: 'invalid', errors: {}, remark: [], isValid: true };
      service.validateField(field, row);
      expect(row.remark).toContain('Date value must be in "YYYY-MM-DD" date format');
      expect(row.isValid).toBe(false);
    });

    it('should validate length', () => {
      const field = { length: 5, header: 'Length', field: 'length' };
      const row: any = { length: '123456', errors: {}, remark: [], isValid: true };
      service.validateField(field, row);
      expect(row.remark).toContain('Length value cannot exceed more than 5 characters');
      expect(row.isValid).toBe(false);
    });

    it('should validate alphanumeric', () => {
      const field = { type: 'alphanumaric', header: 'Alphanum', field: 'alphanum' };
      const row: any = { alphanum: 'abc@123', errors: {}, remark: [], isValid: true };
      service.validateField(field, row);
      expect(row.remark).toContain('Alphanum value is incorrect, use only alphanumeric values');
      expect(row.isValid).toBe(false);
    });

    it('should not validate if no value', () => {
      const field = { type: 'number', header: 'Number', field: 'number' };
      const row: any = { number: null, errors: {}, remark: [], isValid: true };
      service.validateField(field, row);
      expect(row.isValid).toBe(true);
    });
  });
});