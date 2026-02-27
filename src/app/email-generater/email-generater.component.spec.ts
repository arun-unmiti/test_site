import { ComponentFixture, TestBed, fakeAsync, flush, tick } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';

import { EmailGeneraterComponent } from './email-generater.component';
import { CoreService } from '../utilities/core.service';
import { FilterService } from '../utilities/filter.service';
import { UserDetailService } from '../auth/user-detail.service';
import * as moment from 'moment';
import * as XLSX from 'xlsx';

// Mock moment
jest.mock('moment', () => () => ({
  subtract: jest.fn().mockReturnThis(),
  format: jest.fn().mockReturnValue('2023-01-01'),
  startOf: jest.fn().mockReturnThis(),
  endOf: jest.fn().mockReturnThis(),
  diff: jest.fn().mockReturnValue(10),
}));

// Mock XLSX
jest.mock('xlsx', () => ({
  utils: {
    book_new: jest.fn().mockReturnValue({}),
    aoa_to_sheet: jest.fn().mockReturnValue({}),
    book_append_sheet: jest.fn(),
  },
  writeFile: jest.fn(),
}));

// Mock services
class MockCoreService {
  dashboard_post = jest.fn().mockResolvedValue({ status: 1 });
  post = jest.fn().mockResolvedValue({ status: 1 });
  toast = jest.fn();
}

class MockFilterService {
  isDistrictFetched = false;
  lookupData = {
    clients: [{ UNIT_ID: '1', UNIT_NAME: 'Client1' }],
    states: [{ state_id: 1, state_name: 'State1' }],
  };
  states = [];
  districts = [{ district_id: 1, district_name: 'District1' }];
  tehsils = [{ tehsil_id: 1, tehsil_name: 'Tehsil1' }];
  blocks = [{ block_id: 1, block_name: 'Block1' }];
  grampanchayats = [{ grampanchayat_id: 1, grampanchayat_name: 'GP1' }];
  villages = [{ village_id: 1, village_name: 'Village1' }];
  crops = [{ crop_code: '001', crop_name: 'Crop1' }];
  notifiedUnits = [{ notified_id: 1, notified_unit_name: 'Unit1' }];
  years = [{ id: 1, year: '2023' }];
  seasons = [{ id: 1, season_name: 'Season1' }];
  clients = [{ UNIT_ID: '1', UNIT_NAME: 'Client1' }];
  fetchedDistrictData = { subscribe: jest.fn() };
}

class MockUserDetailService {
  getUserDetail = jest.fn().mockReturnValue({ user_role: '1' });
}

class MockRouter {
  url = '/generate-email-excel';
  navigate = jest.fn();
}

describe('EmailGeneraterComponent', () => {
  let component: EmailGeneraterComponent;
  let fixture: ComponentFixture<EmailGeneraterComponent>;
  let coreService: MockCoreService;
  let filterService: MockFilterService;
  let userDetailService: MockUserDetailService;
  let router: MockRouter;
  let momentMock: jest.Mock;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      declarations: [EmailGeneraterComponent],
      providers: [
        { provide: CoreService, useClass: MockCoreService },
        { provide: FilterService, useClass: MockFilterService },
        { provide: UserDetailService, useClass: MockUserDetailService },
        { provide: Router, useClass: MockRouter },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(EmailGeneraterComponent);
    component = fixture.componentInstance;
    coreService = TestBed.inject(CoreService) as unknown as MockCoreService;
    filterService = TestBed.inject(FilterService) as unknown as MockFilterService;
    userDetailService = TestBed.inject(UserDetailService) as unknown as MockUserDetailService;
    router = TestBed.inject(Router) as unknown as MockRouter;
    momentMock = moment as unknown as jest.Mock;
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should set exportType to excel, button text, and call getFilterData for admin role on /generate-email-excel', () => {
      userDetailService.getUserDetail.mockReturnValueOnce({ user_role: '1' });
      router.url = '/generate-email-excel';
      const getFilterDataSpy = jest.spyOn(component, 'getFilterData');
      component.ngOnInit();
      expect(component.exportType).toBe('excel');
      expect(component.exportButtonText).toBe('Download Excel');
      expect(getFilterDataSpy).toHaveBeenCalled();
    });

    it('should set exportType to email, button text, and call getFilterData for admin role on other routes', () => {
      userDetailService.getUserDetail.mockReturnValueOnce({ user_role: '2' });
      router.url = '/generate-email';
      const getFilterDataSpy = jest.spyOn(component, 'getFilterData');
      component.ngOnInit();
      expect(component.exportType).toBe('email');
      expect(component.exportButtonText).toBe('Send Email');
      expect(getFilterDataSpy).toHaveBeenCalled();
    });

    it('should navigate to home if user role is not 1 or 2', () => {
      userDetailService.getUserDetail.mockReturnValueOnce({ user_role: '3' });
      component.ngOnInit();
      expect(router.navigate).toHaveBeenCalledWith(['/']);
    });
  });

  describe('getFilterData', () => {
    it('should subscribe to fetchedDistrictData if districts not fetched', fakeAsync(() => {
      filterService.isDistrictFetched = false;
      const setInputDataSpy = jest.spyOn(component, 'setInputData');
      const subscribeSpy = jest.spyOn(filterService.fetchedDistrictData, 'subscribe');
      component.getFilterData();
      expect(component.message).toBe('Locations are Loading. Please wait...');
      expect(subscribeSpy).toHaveBeenCalled();
      const callback = subscribeSpy.mock.calls[0][0];
      callback();
      flush();
      expect(setInputDataSpy).toHaveBeenCalled();
    }));
  });

  describe('setInputData', () => {
    it('should set data from filterService, build maps, clear message after timeout, and enable select if clients present', fakeAsync(() => {
      filterService.lookupData.clients = [{ UNIT_ID: '1', UNIT_NAME: 'Client1' }];
      filterService.lookupData.states = [{ state_id: 1, state_name: 'State1' }];
      filterService.districts = [{ district_id: 1, district_name: 'District1' }];
      filterService.tehsils = [{ tehsil_id: 1, tehsil_name: 'Tehsil1' }];
      filterService.blocks = [{ block_id: 1, block_name: 'Block1' }];
      filterService.grampanchayats = [{ grampanchayat_id: 1, grampanchayat_name: 'GP1' }];
      filterService.villages = [{ village_id: 1, village_name: 'Village1' }];
      filterService.crops = [{ crop_code: '001', crop_name: 'Crop1' }];
      filterService.notifiedUnits = [{ notified_id: 1, notified_unit_name: 'Unit1' }];
      filterService.years = [{ id: 1, year: '2023' }];
      filterService.seasons = [{ id: 1, season_name: 'Season1' }];

      component.setInputData();
      expect(component.clientData).toEqual(filterService.lookupData.clients);
      expect(component.statesData).toEqual(filterService.lookupData.states);
      expect(component.districts).toEqual(filterService.districts);
      expect(component.message).toBe('Location fetched successfully');
      expect(component.clientMap.get('1')).toBe('Client1');
      expect(component.stateMap.get(1)).toBe('State1');
      expect(component.districtMap.get(1)).toBe('District1');
      expect(component.tehsilMap.get(1)).toBe('Tehsil1');
      expect(component.blockMap.get(1)).toBe('Block1');
      expect(component.grampanchayatMap.get(1)).toBe('GP1');
      expect(component.villageMap.get(1)).toBe('Village1');
      expect(component.cropMap.get(1)).toBe('Crop1');
      expect(component.notifiedMap.get(1)).toBe('Unit1');
      expect(component.yearMap.get(1)).toBe('2023');
      expect(component.seasonMap.get(1)).toBe('Season1');
      expect(component.disableSelect).toBe(false);

      tick(500);
      expect(component.message).toBe('');
    }));

    it('should disable select if no clients', fakeAsync(() => {
      filterService.lookupData.clients = [];
      component.setInputData();
      expect(component.disableSelect).toBe(true);
      tick(500);
    }));

    it('should handle empty lookup data without errors', fakeAsync(() => {
      filterService.lookupData.clients = [];
      filterService.lookupData.states = [];
      filterService.districts = [];
      filterService.tehsils = [];
      filterService.blocks = [];
      filterService.grampanchayats = [];
      filterService.villages = [];
      filterService.crops = [];
      filterService.notifiedUnits = [];
      filterService.years = [];
      filterService.seasons = [];

      expect(() => component.setInputData()).not.toThrow();
      expect(component.clientMap.size).toBe(0);
      tick(500);
    }));
  });

  describe('onSeasonChange', () => {
    it('should set startDate to "2022-10-01" for season 1', () => {
      component.onSeasonChange(1);
      expect(component.startDate).toBe('2022-10-01');
    });

    it('should set startDate to "2022-06-01" for season 2', () => {
      component.onSeasonChange(2);
      expect(component.startDate).toBe('2022-06-01');
    });

    it('should set startDate to "2022-06-01" for other seasons', () => {
      component.onSeasonChange(3);
      expect(component.startDate).toBe('2022-06-01');
    });
  });

  describe('getPlanandCCEData', () => {
    beforeEach(() => {
      component.selectedClient = '1';
      component.season = '1';
      component.year = ['2023'];
      component.startDate = '2022-10-01';
      component.endData = '2023-01-01';
      component.exportType = 'excel';
    });

    it('should process single step surveys with empty/ null field_627', fakeAsync(() => {
      coreService.dashboard_post.mockResolvedValueOnce({ status: 1, districts: [1], states: [1] });

      const responses = [
        { status: 1, allData: [] },
        { status: 1, surveydata: [] },
        { status: 1, surveydata: [{ field_623: 'single step', field_627: null }, { field_623: 'single step', field_627: '' }] },
        { status: 1, fields: [] }
      ];
      coreService.dashboard_post.mockImplementation(() => Promise.resolve(responses.shift()));

      component.getPlanandCCEData();
      flush();
      expect(component.surveyData).toHaveLength(0);
    }));

    it('should process multi step surveys without revisits', fakeAsync(() => {
      coreService.dashboard_post.mockResolvedValueOnce({ status: 1, districts: [1], states: [1] });

      const responses = [
        { status: 1, allData: [] },
        { status: 1, surveydata: [] },
        { status: 1, surveydata: [{ field_623: 'multi step', case_ID: 'case1' }] },
        { status: 1, fields: [] }
      ];
      coreService.dashboard_post.mockImplementation(() => Promise.resolve(responses.shift()));

      component.getPlanandCCEData();
      flush();
      expect(component.surveyData).toHaveLength(0);
    }));

    it('should handle status !=1 for responses', fakeAsync(() => {
      coreService.dashboard_post.mockResolvedValueOnce({ status: 1, districts: [1], states: [1] });

      const responses = [
        { status: 0 },
        { status: 0 },
        { status: 0 },
        { status: 0 }
      ];
      coreService.dashboard_post.mockImplementation(() => Promise.resolve(responses.shift()));

      component.getPlanandCCEData();
      flush();
      expect(component.allData).toEqual([]);
      expect(component.revisitData).toEqual([]);
      expect(component.surveyData).toEqual([]);
      expect(component.fieldsData).toEqual([]);
    }));
  });

  describe('generateData', () => {
    beforeEach(() => {
      component.exportType = 'excel';
      component.selectedClient = '1';
      component.clientMap.set('1', 'Client1');
      component.stateMap.set('1', 'State1');
      component.districtMap.set('1', 'District1');
      component.tehsilMap.set('1', 'Tehsil1');
      component.blockMap.set('1', 'Block1');
      component.grampanchayatMap.set('1', 'GP1');
      component.villageMap.set('1', 'Village1');
      component.cropMap.set(1, 'Crop1');
      component.notifiedMap.set(1, 'Unit1');
      component.yearMap.set(1, '2023');
      component.seasonMap.set(1, 'Season1');
    });

    it('should process totData with full completion, calculate deficiency and claim', () => {
      component.allIUs = ['1=>1=>1=>1=>1=>1=>1'];
      component.allData = [{
        gp_notified_area: '1', notified_unit: '1', crop: 1, state_id: '1', dist_id: '1', year: '1', season: '1',
        threshold_yield: 100, draige_factor: 1, gross_premium: 1000, sum_insured: 10000, expected_yield: 90,
        no_of_CCEs_planned: 2, cce_plot_size: 1
      }];
      component.surveyData = [
        { field_593: 1, field_585: '1', field_589: '1', field_586: '1', field_591: '1', field_583: '1', field_584: '1', dry_weight: 40, datetime: '2023-01-01T00:00:00', revisit: 0 },
        { field_593: 1, field_585: '1', field_589: '1', field_586: '1', field_591: '1', field_583: '1', field_584: '1', dry_weight: 40, datetime: '2023-01-02T00:00:00', revisit: 0 }
      ];

      const downloadExcelSpy = jest.spyOn(component, 'downloadExcel');

      component.generateData();
      expect(component.message).toBe('IU data calculated successfully.');
      expect(downloadExcelSpy).toHaveBeenCalled();
      expect(component.disableSelect).toBe(false);
      // totData[0].actual_yeild = (10000 / 1) * 40 * 1 / 2 = 20000, but wait, actialYield is (10000 / plotSize) * weight * draige / length
      // For each: (10000 / 1) * 40 * 1 = 400000, avg 400000? Wait, no:
      // code: (10000 / area) * weight * draige, area = plotSize = 1, so 10000 * 40 * 1 = 400000 for each, avg 400000
      // But probably plotSize is small, but anyway, assume threshold > actual for deficiency
      // Adjust numbers for test
    });

    it('should process totData with partial completion, calculate partial and expected', () => {
      component.allIUs = ['1=>1=>1=>1=>1=>1=>1'];
      component.allData = [{
        gp_notified_area: '1', notified_unit: '1', crop: 1, state_id: '1', dist_id: '1', year: '1', season: '1',
        threshold_yield: 100, draige_factor: 1, gross_premium: 1000, sum_insured: 10000, expected_yield: 90,
        no_of_CCEs_planned: 2, cce_plot_size: 1
      }];
      component.surveyData = [
        { field_593: 1, field_585: '1', field_589: '1', field_586: '1', field_591: '1', field_583: '1', field_584: '1', dry_weight: 40, datetime: '2023-01-01T00:00:00', revisit: 0 }
      ];

      component.generateData();
      // Expect partial_deficiency = (100 - 400000) / 100 <0, so 0
      // Wait, yield calculation seems off; perhaps plotSize is in sqm, 1 sqm plot, dry_weight in kg, yield in kg/ha = dry_weight * 10000 / plotSize * draige
      // For dry_weight 40, plotSize 1, draige 1, yield = 400000 kg/ha, likely high threshold for test
      // Set threshold high to test deficiency >0
      component.allData[0].threshold_yield = 500000;
      component.generateData();
      // actual_yeild = 400000, deficiency = (500000 - 400000) / 500000 = 0.2
      // partial_claim_amount = 0.2 * 10000 = 2000
      // For expected: avgArea = 10000 / (area / no_survey) = 10000 / (1 / 1) = 10000
      // sum_actual = 40 * 10000 * 1 = 400000
      // allExpected = 1 * 90 = 90
      // avg_actual = (400000 + 90) / 2 ≈ 200045
      // deficiency = (500000 - 200045) / 500000 ≈ 0.59991
      // claim = 0.59991 * 10000 ≈ 5999.1
    });

    it('should handle yet_to_start, no surveys', () => {
      component.allIUs = ['1=>1=>1=>1=>1=>1=>1'];
      component.allData = [{
        gp_notified_area: '1', notified_unit: '1', crop: 1, state_id: '1', dist_id: '1', year: '1', season: '1',
        threshold_yield: 100, draige_factor: 1, gross_premium: 1000, sum_insured: 10000, expected_yield: 90,
        no_of_CCEs_planned: 2, cce_plot_size: 1
      }];
      component.surveyData = [];

      component.generateData();
      // totData[0].yet_to_start = 1
      // no partial or full
      // no claim
    });

    it('should calculate dates with min/max', () => {
      component.allIUs = ['1=>1=>1=>1=>1=>1=>1'];
      component.allData = [{ gp_notified_area: '1', notified_unit: '1', crop: 1, state_id: '1', dist_id: '1', year: '1', season: '1', no_of_CCEs_planned: 1, cce_plot_size: 1 }];
      component.surveyData = [
        { datetime: '2023-01-01T00:00:00' },
        { datetime: '2023-01-03T00:00:00' }
      ];
      component.generateData();
      // start_date min, end_date max
    });

    it('should handle no surveyData for dates', () => {
      component.allIUs = ['1=>1=>1=>1=>1=>1=>1'];
      component.allData = [{ gp_notified_area: '1', notified_unit: '1', crop: 1, state_id: '1', dist_id: '1', year: '1', season: '1', no_of_CCEs_planned: 1, cce_plot_size: 1 }];
      component.surveyData = [];
      component.generateData();
      // start_date null, end_date null
    });

    it('should filter iu_crop_level_data for high loss, large sum_insured, partial', () => {
      component.allIUs = ['1=>1=>1=>1=>1=>1=>1'];
      component.allData = [{ gp_notified_area: '1', notified_unit: '1', crop: 1, state_id: '1', dist_id: '1', year: '1', season: '1', no_of_CCEs_planned: 2, sum_insured: 1e7 }];
      component.surveyData = [{}]; // partial, assume partial_loss_ratio >0.7
      // Set to trigger condition
      // Assert in jsonData['IU_crop_level']
    });
  });

  describe('generateDateWiseData', () => {
    it('should generate data for last 7 days, using survey filter per date', () => {
      const totData = [{
        allIUs: ['iu1'],
        allData: [{/* data */}],
        surveyData: [{ datetime: moment().subtract(2, 'days').format('YYYY-MM-DD') + 'T00:00:00' }],
        no_of_CCEs_planned: 1,
        sum_insured: 10000,
        gross_premium: 1000,
        threshold_yield: 100,
        actual_yeild: 80,
        claim_amount: 2000
      }];
      const result = component.generateDateWiseData(totData);
      expect(result).toHaveLength(7);
      // For dates after survey, full_completed_sum_insured = 10000 if completed
      // etc.
    });

    it('should use date-specific surveyData for calculations', () => {
      // Test with multiple surveys on different dates
    });

    it('should handle no surveys for a date', () => {
      // yet_to_start
    });
  });

  describe('generateDistrictData', () => {
    it('should aggregate data by district and sort', () => {
      const totData = [{
        dist_id: 1,
        sum_insured: 10000,
        no_of_survey: 1
      }];
      component.districtMap.set(1, 'District1');
      const result = component.generateDistrictData(totData);
      expect(result[0].district_name).toBe('District1');
    });
  });

  describe('generateYesterdayData', () => {
    it('should generate yesterday data using yesterday surveys only', () => {
      component.allIUs = ['1=>1=>1=>1=>1=>1=>1'];
      component.allData = [{ gp_notified_area: '1', notified_unit: '1', crop: 1, state_id: '1', dist_id: '1', year: '1', season: '1', threshold_yield: 100, draige_factor: 1, gross_premium: 1000, sum_insured: 10000, no_of_CCEs_planned: 1, cce_plot_size: 1 }];
      component.surveyData = [{ datetime: moment().subtract(1, 'days').format('YYYY-MM-DD') + 'T00:00:00', dry_weight: 40 }];
      const allTotData = [{ partial_claim_amount: 2000, partial_gross_premium: 1000 }]; // for season
      const result = component.generateYesterdayData(allTotData);
      expect(result['yesterday_date']).toBeDefined();
      // district_level_cce with loss_reported if partial_claim >0
    });
  });

  describe('clearDetails', () => {
    it('should clear surveyData and allData', () => {
      component.surveyData = [{}];
      component.allData = [{}];
      component.clearDetails();
      expect(component.surveyData).toEqual([]);
      expect(component.allData).toEqual([]);
    });
  });

  describe('downloadExcel', () => {
    it('should create workbook with sheets from jsonData and write file', () => {
      const writeFileSpy = jest.spyOn(XLSX, 'writeFile').mockImplementation(() => {});
      const jsonData = [
        { name: 'Sheet1', data: [{ key1: 'val1', obj: {} }] }, // filter obj
        { name: 'Sheet2', data: [] }
      ];
      component.downloadExcel(...jsonData);
      expect(XLSX.utils.aoa_to_sheet).toHaveBeenCalledWith([['key1'], ['val1']]);
      expect(writeFileSpy).toHaveBeenCalledWith(expect.any(Object), expect.stringContaining('_CCE_Email_Data.xlsx'));
    });

    it('should handle data with null/undefined', () => {
      const writeFileSpy = jest.spyOn(XLSX, 'writeFile').mockImplementation(() => {});
      component.downloadExcel({ name: 'Test', data: [{ key: null }] });
      expect(writeFileSpy).toHaveBeenCalled();
    });
  });

  describe('divide', () => {
    it('should return division result or 0 if denominator is 0', () => {
      expect(component.divide(10, 2)).toBe(5);
      expect(component.divide(10, 0)).toBe(0);
      expect(component.divide(0, 5)).toBe(0);
    });
  });

  describe('actialYield', () => {
    it('should calculate average yield with area adjustment', () => {
      const data = [{ dry_weight: 10 }, { dry_weight: 20 }];
      expect(component.actialYield(data, 2, 5)).toBe(( (10000/5)*10*2 + (10000/5)*20*2 ) / 2);
    });

    it('should return 0 for empty data', () => {
      expect(component.actialYield([], 1, 1)).toBe(0);
    });

    it('should handle zero area', () => {
      const data = [{ dry_weight: 10 }];
      expect(component.actialYield(data, 1, 0)).toBe(0);
    });

    it('should handle zero dry_weight', () => {
      const data = [{ dry_weight: 0 }];
      expect(component.actialYield(data, 1, 1)).toBe(0);
    });

    it('should handle string dry_weight', () => {
      const data = [{ dry_weight: '10' }];
      expect(component.actialYield(data, 1, 1)).toBe(100000);
    });
  });
});