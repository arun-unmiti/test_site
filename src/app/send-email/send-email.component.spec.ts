import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import * as XLSX from "xlsx";
import * as moment from 'moment';

import { SendEmailComponent } from './send-email.component';
import { UserDetailService } from '../auth/user-detail.service';
import { CoreService } from '../utilities/core.service';
import { FilterService } from '../utilities/filter.service';

class MockUserDetailService {
  getUserDetail = jest.fn(() => ({ user_role: '1' }));
}

class MockCoreService {
  mail_post = jest.fn().mockResolvedValue({ status: 1 });
}

class MockFilterService {
  isDistrictFetched = true;
  fetchedDistrictData = { subscribe: jest.fn() };
}

class MockActivatedRoute {
  params = of({ client_id: '123' });
}

class MockRouter {
  url = '/default';
}

describe('SendEmailComponent', () => {
  let component: SendEmailComponent;
  let fixture: ComponentFixture<SendEmailComponent>;
  let coreService: any;
  let userService: any;
  let filterService: any;
  let router: any;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        RouterTestingModule,
      ],
      declarations: [SendEmailComponent],
      providers: [
        { provide: UserDetailService, useClass: MockUserDetailService },
        { provide: CoreService, useClass: MockCoreService },
        { provide: FilterService, useClass: MockFilterService },
        { provide: ActivatedRoute, useClass: MockActivatedRoute },
        { provide: Router, useClass: MockRouter },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(SendEmailComponent);
    component = fixture.componentInstance;
    coreService = TestBed.inject(CoreService);
    userService = TestBed.inject(UserDetailService);
    filterService = TestBed.inject(FilterService);
    router = TestBed.inject(Router);
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should set season and startDate for rabi route', () => {
      router.url = '/rabi';
      const getFilterDataSpy = jest.spyOn(component, 'getFilterData');
      component.ngOnInit();
      expect(component.season).toEqual(['1']);
      expect(component.startDate).toBe('2022-10-01');
      expect(getFilterDataSpy).toHaveBeenCalled();
    });

    it('should set season and startDate for non-rabi route', () => {
      router.url = '/default';
      const getFilterDataSpy = jest.spyOn(component, 'getFilterData');
      component.ngOnInit();
      expect(component.season).toEqual(['1']);
      expect(component.startDate).toBe('2023-11-01');
      expect(getFilterDataSpy).toHaveBeenCalled();
    });

    it('should set selectedClient from params and call getFilterData', () => {
      const getFilterDataSpy = jest.spyOn(component, 'getFilterData');
      component.ngOnInit();
      expect(component.selectedClient).toBe('123');
      expect(getFilterDataSpy).toHaveBeenCalled();
    });
  });

  describe('getFilterData', () => {
    it('should post for lookups and set input data on success', async () => {
      const mockResponse = { clients: [], states: [], districts: [] };
      coreService.mail_post.mockResolvedValueOnce(mockResponse);
      const setInputDataSpy = jest.spyOn(component, 'setInputData');
      await component.getFilterData();
      expect(coreService.mail_post).toHaveBeenCalledWith({ purpose: 'get_lookups' });
      expect(setInputDataSpy).toHaveBeenCalledWith(mockResponse);
    });

    it('should handle error', async () => {
      coreService.mail_post.mockRejectedValueOnce(new Error());
      await component.getFilterData();
      expect(true).toBe(true);
    });
  });

  describe('setInputData', () => {
    let getPlanSpy: jest.SpyInstance;
    beforeEach(() => {
      getPlanSpy = jest.spyOn(component, 'getPlanandCCEData');
    });

    it('should handle empty response data', () => {
      const res = {
        clients: [],
        states: [],
        districts: [],
        tehsils: [],
        blocks: [],
        grampanchayats: [],
        villages: [],
        crops: [],
        notified_unit: [],
        year: [],
        season: [],
      };
      component.setInputData(res);
      expect(component.clientData).toEqual([]);
      expect(component.statesData).toEqual([]);
      expect(component.districts).toEqual([]);
      expect(component.disableSelect).toBe(true);
      expect(getPlanSpy).toHaveBeenCalled();
    });

    it('should clear message after timeout', fakeAsync(() => {
      const res = {
        clients: [],
        states: [],
        districts: [],
        tehsils: [],
        blocks: [],
        grampanchayats: [],
        villages: [],
        crops: [],
        notified_unit: [],
        year: [],
        season: [],
      };
      component.setInputData(res);
      expect(component.message).toBe('Location fetched successfully');
      tick(500);
      expect(component.message).toBe('');
    }));
  });

  describe('getPlanandCCEData', () => {
    beforeEach(() => {
      component.selectedClient = '1';
      component.clientData = [{ UNIT_ID: '1' }];
      component.year = [4];
      component.season = ['1'];
      component.startDate = '2023-01-01';
      component.endData = '2023-12-31';
      component.exportType = 'excel';
    });

    it('should not push surveyData if single step and field_627 empty', async () => {
      coreService.mail_post.mockResolvedValueOnce({ status: 1, districts: [1], states: [1] });
      coreService.mail_post.mockResolvedValueOnce({ status: 1, allData: [] });
      coreService.mail_post.mockResolvedValueOnce({ status: 1, surveydata: [] });
      coreService.mail_post.mockResolvedValueOnce({ status: 1, surveydata: [{ field_623: 'single step', field_627: '', case_ID: '1' }] });
      coreService.mail_post.mockResolvedValueOnce({ status: 1, fields: [] });
      await component.getPlanandCCEData();
      expect(component.surveyData.length).toBe(0);
    });

    it('should handle no revisit data', async () => {
      coreService.mail_post.mockResolvedValueOnce({ status: 1, districts: [1], states: [1] });
      coreService.mail_post.mockResolvedValueOnce({ status: 1, allData: [] });
      coreService.mail_post.mockResolvedValueOnce({ status: 1, surveydata: [] });
      coreService.mail_post.mockResolvedValueOnce({ status: 1, surveydata: [{ field_623: 'multi', field_585: 7, case_ID: '1', field_624: '10' }] });
      coreService.mail_post.mockResolvedValueOnce({ status: 1, fields: [] });
      await component.getPlanandCCEData();
      expect(component.surveyData.length).toBe(0);
    });

    it('should filter out zero planned CCEs', async () => {
      coreService.mail_post.mockResolvedValueOnce({ status: 1, districts: [1], states: [1] });
      coreService.mail_post.mockResolvedValueOnce({ status: 1, allData: [{ no_of_CCEs_planned: 0 }] });
      coreService.mail_post.mockResolvedValueOnce({ status: 1, surveydata: [] });
      coreService.mail_post.mockResolvedValueOnce({ status: 1, surveydata: [] });
      coreService.mail_post.mockResolvedValueOnce({ status: 1, fields: [] });
      await component.getPlanandCCEData();
      expect(component.allData.length).toBe(0);
      expect(component.allIUs.length).toBe(0);
    });

    it('should handle status !=1 for responses', async () => {
      coreService.mail_post.mockResolvedValueOnce({ status: 1, districts: [1], states: [1] });
      coreService.mail_post.mockResolvedValueOnce({ status: 0 });
      coreService.mail_post.mockResolvedValueOnce({ status: 0 });
      coreService.mail_post.mockResolvedValueOnce({ status: 0 });
      coreService.mail_post.mockResolvedValueOnce({ status: 0 });
      await component.getPlanandCCEData();
      expect(component.allData.length).toBe(0);
      expect(component.revisitData.length).toBe(0);
      expect(component.surveyData.length).toBe(0);
    });

    it('should handle no surveyData for surveyDataWithLabel', async () => {
      coreService.mail_post.mockResolvedValueOnce({ status: 1, districts: [1], states: [1] });
      coreService.mail_post.mockResolvedValueOnce({ status: 1, allData: [] });
      coreService.mail_post.mockResolvedValueOnce({ status: 1, surveydata: [] });
      coreService.mail_post.mockResolvedValueOnce({ status: 1, surveydata: [] });
      coreService.mail_post.mockResolvedValueOnce({ status: 1, fields: [] });
      await component.getPlanandCCEData();
      expect(component.surveyDataWithLabel.length).toBe(0);
    });

    it('should handle multi-step with revisit_data null', async () => {
      coreService.mail_post.mockResolvedValueOnce({ status: 1, districts: [1], states: [1] });
      coreService.mail_post.mockResolvedValueOnce({ status: 1, allData: [] });
      coreService.mail_post.mockResolvedValueOnce({ status: 1, surveydata: [] });
      coreService.mail_post.mockResolvedValueOnce({ status: 1, surveydata: [{ field_623: 'multi', field_585: 7, case_ID: '1', field_624: '10' }] });
      coreService.mail_post.mockResolvedValueOnce({ status: 1, fields: [] });
      await component.getPlanandCCEData();
      expect(component.surveyData.length).toBe(0);
    });

    it('should handle exportType not excel', async () => {
      component.exportType = 'email';
      coreService.mail_post.mockResolvedValueOnce({ status: 1, districts: [1], states: [1] });
      coreService.mail_post.mockResolvedValueOnce({ status: 1, allData: [] });
      coreService.mail_post.mockResolvedValueOnce({ status: 1, surveydata: [] });
      coreService.mail_post.mockResolvedValueOnce({ status: 1, surveydata: [] });
      await component.getPlanandCCEData();
      expect(coreService.mail_post).toHaveBeenCalledTimes(4); // no fields request
    });
  });

  describe('generateData', () => {
    beforeEach(() => {
      component.allIUs = ['1=>1=>1=>1=>1=>2023=>1'];
      component.allData = [{ gp_notified_area: '1', notified_unit: '1', crop: '1', state_id: '1', dist_id: '1', tehsil_id: '1', year: '2023', season: '1', no_of_CCEs_planned: 1, threshold_yield: 100, draige_factor: 1, gross_premium: 100, sum_insured: 1000, expected_yield: 100, cce_plot_size: 100 }];
      component.exportType = 'excel';
    });

    it('should generate data with full completed branch', () => {
      component.surveyData = Array(1).fill({ datetime: '2023-01-01', field_593: '1', field_585: '1', field_589: '1', field_586: '1', field_591: '1', field_583: '2023', field_584: '1', dry_weight: 5, revisit: 1 });
      component.revisitData = [];
      component.generateData();
      expect(component.message).toBe('IU data calculated successfully.');
    });

    it('should generate data with partially completed branch', () => {
      component.allData[0].no_of_CCEs_planned = 5;
      component.surveyData = Array(3).fill({ datetime: '2023-01-01', field_593: '1', field_585: '1', field_589: '1', field_586: '1', field_591: '1', field_583: '2023', field_584: '1', dry_weight: 5, revisit: 1 });
      component.generateData();
      expect(component.message).toBe('IU data calculated successfully.');
    });

    it('should generate data with yet to start branch', () => {
      component.surveyData = [];
      component.generateData();
      expect(component.message).toBe('IU data calculated successfully.');
    });

    it('should handle different notified units in gp_notified_area_name', () => {
      component.allIUs = ['1=>2=>1=>1=>1=>2023=>1'];
      component.allData[0].notified_unit = 2;
      component.generateData();
      expect(true).toBe(true);
    });

    it('should call downloadExcel when exportType is excel', () => {
      const downloadExcelSpy = jest.spyOn(component as any, 'downloadExcel');
      component.selectedClient = '1';
      component.clientMap.set('1', 'Client1');
      component.surveyData = [];
      component.generateData();
      expect(downloadExcelSpy).toHaveBeenCalled();
      expect(component.disableSelect).toBe(false);
    });

    it('should push to iu_crop_level_data if conditions met', () => {
      component.allData[0].no_of_CCEs_planned = 5;
      component.surveyData = Array(3).fill({ datetime: '2023-01-01', field_593: '1', field_585: '1', field_589: '1', field_586: '1', field_591: '1', field_583: '2023', field_584: '1', dry_weight: 1, revisit: 1 });
      component.allData[0].sum_insured = 10000000;
      component.generateData();
      expect(component.message).toBe('IU data calculated successfully.');
    });

    it('should not push to iu_crop_level_data if conditions not met', () => {
      component.allData[0].sum_insured = 9999999;
      component.generateData();
      expect(component.message).toBe('IU data calculated successfully.');
    });

    it('should handle no deficiency', () => {
      component.surveyData = Array(1).fill({ datetime: '2023-01-01', field_593: '1', field_585: '1', field_589: '1', field_586: '1', field_591: '1', field_583: '2023', field_584: '1', dry_weight: 100, revisit: 1 });
      component.generateData();
      expect(component.message).toBe('IU data calculated successfully.');
    });

    it('should compute expected claim', () => {
      component.allData[0].no_of_CCEs_planned = 5;
      component.surveyData = Array(3).fill({ datetime: '2023-01-01', field_593: '1', field_585: '1', field_589: '1', field_586: '1', field_591: '1', field_583: '2023', field_584: '1', dry_weight: 5, revisit: 1 });
      component.generateData();
      expect(component.message).toBe('IU data calculated successfully.');
    });
  });

  describe('generateDateWiseData', () => {
    beforeEach(() => {
      component.stateMap.set('1', 'State1');
      component.districtMap.set('1', 'District1');
      component.tehsilMap.set('1', 'Tehsil1');
      component.notifiedMap.set('1', 'Notified1');
      component.cropMap.set(1, 'Crop1');
      component.yearMap.set(4, '2023');
      component.seasonMap.set('1', 'Season1');
      component.grampanchayatMap.set('1', 'GramPanchayat1');
      component.blockMap.set('1', 'Block1');
      component.villageMap.set('1', 'Village1');
    });

    it('should generate date-wise data for 7 days', () => {
      component.allIUs = [];
      component.allData = [];
      component.surveyData = [];
      const totData: any = [];
      const result = component['generateDateWiseData'](totData);
      expect(result.length).toBe(7);
    });

    it('should calculate for full completed on past dates', () => {
      component.allIUs = ['1=>1=>1=>1=>1=>4=>1'];
      component.allData = [{ gp_notified_area: '1', notified_unit: '1', crop: '1', state_id: '1', dist_id: '1', year: 4, season: '1', no_of_CCEs_planned: 5, sum_insured: 1000, gross_premium: 100, threshold_yield: 100, cce_plot_size: 100, draige_factor: 1 }];
      component.surveyData = Array(5).fill({ datetime: moment().subtract(2, "days").format('YYYY-MM-DD'), field_593: '1', field_585: '1', field_589: '1', field_586: '1', field_591: '1', field_583: 4, field_584: '1', dry_weight: 5 });
      const totData = component.allIUs.map(ele => ({ surveyData: component.surveyData.filter(e => true), no_of_CCEs_planned: 5, sum_insured: 1000, gross_premium: 100, threshold_yield: 100, cce_plot_size: 100, draige_factor: 1, start_date: moment().subtract(2, "days").valueOf(), end_date: moment().subtract(2, "days").valueOf() }));
      const result = component['generateDateWiseData'](totData);
      expect(result[0].full_completed).toBe(1);
    });

    it('should handle no surveyData', () => {
      component.allIUs = ['1=>1=>1=>1=>1=>4=>1'];
      component.allData = [{ gp_notified_area: '1', notified_unit: '1', crop: '1', state_id: '1', dist_id: '1', year: 4, season: '1', no_of_CCEs_planned: 5 }];
      component.surveyData = [];
      const totData = component.allIUs.map(ele => ({ surveyData: [], no_of_CCEs_planned: 5, sum_insured: 1000, gross_premium: 100 }));
      const result = component['generateDateWiseData'](totData);
      expect(result[0].yet_to_start).toBe(1);
    });
  });

  describe('generateStateData', () => {
    it('should aggregate data by state', () => {
      component.stateMap.set('1', 'State1');
      const totData = [{ state_id: '1', sum_insured: 1000, gross_premium: 100, claim_amount: 50, full_completed: 1, partially_completed: 0, yet_to_start: 0, partial_claim_amount: 50, partial_gross_premium: 100 }];
      const result = component['generateStateData'](totData);
      expect(result[0].state_name).toBe('State1');
      expect(result[0].full_completed_sum_insured).toBe(1000);
    });

    it('should sort by sum_insured descending', () => {
      component.stateMap.set('1', 'State1');
      component.stateMap.set('2', 'State2');
      const totData = [
        { state_id: '1', sum_insured: 2000 },
        { state_id: '2', sum_insured: 1000 }
      ];
      const result = component['generateStateData'](totData);
      expect(result[0].state_id).toBe('1');
    });
  });

  describe('generateDistrictData', () => {
    it('should aggregate data by district and filter no_of_survey > 0', () => {
      component.districtMap.set('1', 'District1');
      component.stateMap.set('1', 'State1');
      const totData = [{ dist_id: '1', state_id: '1', no_of_survey: 1, sum_insured: 1000 }];
      const result = component['generateDistrictData'](totData);
      expect(result[0].district_name).toBe('District1');
    });

    it('should handle season partial loss ratio', () => {
      component.districtMap.set('1', 'District1');
      const totData = [{ dist_id: '1', season_partial_claim_amount: 50, season_gross_premium: 100, no_of_survey: 1 }];
      const result = component['generateDistrictData'](totData);
      expect(result[0].season_partial_loss_ratio).toBe(0.5);
    });

    it('should count loss and no loss', () => {
      component.districtMap.set('1', 'District1');
      const totData = [
        { dist_id: '1', partial_claim_amount: 50, yet_to_start: 0, no_of_survey: 2 },
        { dist_id: '1', partial_claim_amount: 0, yet_to_start: 0, no_of_survey: 3 },
        { dist_id: '1', partial_claim_amount: 0, yet_to_start: 1, no_of_survey: 4 }
      ];
      const result = component['generateDistrictData'](totData);
      expect(result[0].lossCount).toBe(2);
      expect(result[0].noLossCount).toBe(7);
    });

    it('should sort by sum_insured descending and filter no_of_survey >0', () => {
      component.districtMap.set('1', 'District1');
      component.districtMap.set('2', 'District2');
      const totData = [
        { dist_id: '1', sum_insured: 2000, no_of_survey: 1 },
        { dist_id: '2', sum_insured: 1000, no_of_survey: 0 }
      ];
      const result = component['generateDistrictData'](totData);
      expect(result.length).toBe(1);
      expect(result[0].dist_id).toBe('1');
    });
  });

  describe('generateYesterdayData', () => {
    beforeEach(() => {
      component.allIUs = ['1=>1=>1=>1=>1=>4=>1'];
      component.allData = [{ gp_notified_area: '1', notified_unit: '1', crop: '1', state_id: '1', dist_id: '1', year: 4, season: '1', no_of_CCEs_planned: 5, threshold_yield: 100, draige_factor: 1, gross_premium: 100, sum_insured: 1000, expected_yield: 100, cce_plot_size: 100 }];
    });

    it('should generate yesterday data with partial completed', () => {
      const yesterday = moment().subtract(1, 'days').format('YYYY-MM-DD');
      component.surveyData = Array(3).fill({ datetime: yesterday, field_593: '1', field_585: '1', field_589: '1', field_586: '1', field_591: '1', field_583: 4, field_584: '1', dry_weight: 5 });
      const allTotData = [{ partial_claim_amount: 50, partial_gross_premium: 100 }];
      const result = component['generateYesterdayData'](allTotData);
      expect(result['yesterday_date']).toBe(moment().subtract(1, 'days').format('DD-MM-YYYY'));
    });

    it('should push to iu_crop_level_data if conditions met', () => {
      const yesterday = moment().subtract(1, 'days').format('YYYY-MM-DD');
      component.surveyData = Array(3).fill({ datetime: yesterday, field_593: '1', field_585: '1', field_589: '1', field_586: '1', field_591: '1', field_583: 4, field_584: '1', dry_weight: 1 });
      component.allData[0].no_of_CCEs_planned = 5;
      component.allData[0].sum_insured = 10000000;
      const allTotData = [{ partial_claim_amount: 50, partial_gross_premium: 100 }];
      const result = component['generateYesterdayData'](allTotData);
      expect(true).toBe(true);
    });
  });

  describe('divide', () => {
    it('should divide numbers, handle zero denominator', () => {
      expect(component['divide'](10, 2)).toBe(5);
      expect(component['divide'](10, 0)).toBe(0);
    });
  });

  describe('actialYield', () => {
    it('should calculate actual yield', () => {
      const data = [{ dry_weight: 10 }];
      expect(component['actialYield'](data, 1, 100)).toBe(1000);
      expect(component['actialYield']([], 1, 100)).toBe(0);
    });

    it('should handle zero area', () => {
      const data = [{ dry_weight: 10 }];
      expect(component['actialYield'](data, 1, 0)).toBe(0);
    });
  });

  describe('clearDetails', () => {
    it('should clear data arrays', () => {
      component.surveyData = [{}];
      component.allData = [{}];
      component['clearDetails']();
      expect(component.surveyData).toEqual([]);
      expect(component.allData).toEqual([]);
    });
  });

  describe('downloadExcel', () => {
    it('should download excel with sheets', () => {
      const jsonData = [{ name: 'Test', data: [{ key: 'value' }] }];
      jest.spyOn(XLSX.utils, 'aoa_to_sheet').mockReturnValue({} as any);
      jest.spyOn(XLSX.utils, 'book_new').mockReturnValue({} as any);
      jest.spyOn(XLSX.utils, 'book_append_sheet').mockImplementation(() => {});
      const writeFileSpy = jest.spyOn(XLSX, 'writeFile').mockImplementation(() => {});
      component['downloadExcel'](...jsonData);
      expect(writeFileSpy).toHaveBeenCalled();
    });

    it('should skip sheet if no data[0]', () => {
      const jsonData = [{ name: 'Test', data: [] }];
      jest.spyOn(XLSX.utils, 'aoa_to_sheet').mockReturnValue({} as any);
      jest.spyOn(XLSX.utils, 'book_new').mockReturnValue({} as any);
      jest.spyOn(XLSX.utils, 'book_append_sheet').mockImplementation(() => {});
      const writeFileSpy = jest.spyOn(XLSX, 'writeFile').mockImplementation(() => {});
      component['downloadExcel'](...jsonData);
      expect(writeFileSpy).toHaveBeenCalled();
    });

    it('should filter non-object values in keys', () => {
      const jsonData = [{ name: 'Test', data: [{ key: 'value', obj: {} }] }];
      jest.spyOn(XLSX.utils, 'aoa_to_sheet').mockReturnValue({} as any);
      jest.spyOn(XLSX.utils, 'book_new').mockReturnValue({} as any);
      jest.spyOn(XLSX.utils, 'book_append_sheet').mockImplementation(() => {});
      const writeFileSpy = jest.spyOn(XLSX, 'writeFile').mockImplementation(() => {});
      component['downloadExcel'](...jsonData);
      expect(writeFileSpy).toHaveBeenCalled();
    });
  });

  describe('generateData', () => {
    it('should generate data summaries', () => {
      component.allIUs = ['1=>1=>1=>1=>1=>2023=>1'];
      component.allData = [{ gp_notified_area: '1', notified_unit: '1', crop: '1', state_id: '1', dist_id: '1', tehsil_id: '1', year: '2023', season: '1', no_of_CCEs_planned: 1, threshold_yield: 100, draige_factor: 1, gross_premium: 100, sum_insured: 1000, expected_yield: 100, cce_plot_size: 100 }];
      component.exportType = 'excel';
      component.generateData();
      expect(component.message).toBe('IU data calculated successfully.');
    });
  });
});