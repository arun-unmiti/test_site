import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MultiSelectModule } from 'primeng/multiselect';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
import * as moment from 'moment';
import * as XLSX from 'xlsx';

import { ViewClsIntimationComponent } from './view-cls-intimation.component';
import { FilterService } from '../utilities/filter.service';
import { CoreService } from '../utilities/core.service';
import { UserDetailService } from '../auth/user-detail.service';
import { FeatureToggleService } from '../shared/services/feature-toggle.service';
import { InsightsService } from '../utilities/insights.service';

class MockFilterService {
  isDistrictFetched = true;
  districts = [{ district_id: '1', state_id: '1', district_name: 'District1' }];
  tehsils = [{ tehsil_id: '1', district_id: '1', tehsil_name: 'Tehsil1' }];
  blocks = [{ block_id: '1', tehsil_id: '1', block_name: 'Block1' }];
  grampanchayats = [{ grampanchayat_id: '1', block_id: '1', grampanchayat_name: 'GramPanchayat1' }];
  villages = [{ village_id: '1', grampanchayat_id: '1', village_name: 'Village1' }];
  years = [{ id: '2023', year: '2023' }];
  seasons = [{ id: '1', season_name: 'Season1' }];
  crops = [{ crop_code: '1', crop_name: 'Crop1' }];
  notifiedUnits = [{ notified_id: '1', notified_unit_name: 'NotifiedUnit1' }];
  states = [{ state_id: '1', state_name: 'State1' }];
  lookupData = { states: [{ state_id: '1', state_name: 'State1' }] };
  fetchedDistrictData = { subscribe: jest.fn() };
  fetchedVillageData = { subscribe: jest.fn() };
  isvillageFetched = true;
}

class MockCoreService {
  dashboard_post = jest.fn().mockResolvedValue({ status: 1, intimation_data: [], total_records: 0 });
  toast = jest.fn();
  clone = jest.fn(obj => JSON.parse(JSON.stringify(obj)));
}

class MockUserDetailService {
  getUserDetail = jest.fn().mockReturnValue({ user_role: '1' });
}

class MockFeatureToggleService {
  getContext = jest.fn().mockReturnValue('saksham');
}

class MockInsightsService {
  logException = jest.fn();
}

describe('ViewClsIntimationComponent', () => {
  let component: ViewClsIntimationComponent;
  let fixture: ComponentFixture<ViewClsIntimationComponent>;
  let filterService: any;
  let coreService: any;
  let userDetailService: any;
  let featureToggleService: any;
  let insightsService: any;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        FormsModule,
        MultiSelectModule,
        NgxDaterangepickerMd.forRoot()
      ],
      declarations: [ViewClsIntimationComponent],
      providers: [
        { provide: FilterService, useClass: MockFilterService },
        { provide: CoreService, useClass: MockCoreService },
        { provide: UserDetailService, useClass: MockUserDetailService },
        { provide: FeatureToggleService, useClass: MockFeatureToggleService },
        { provide: InsightsService, useClass: MockInsightsService },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ViewClsIntimationComponent);
    component = fixture.componentInstance;
    filterService = TestBed.inject(FilterService);
    coreService = TestBed.inject(CoreService);
    userDetailService = TestBed.inject(UserDetailService);
    featureToggleService = TestBed.inject(FeatureToggleService);
    insightsService = TestBed.inject(InsightsService);
    component['filter'] = filterService;
    insightsService.logException.mockReset();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should set currentUser, call getColumns and configureFilterData', () => {
      const getColumnsSpy = jest.spyOn(component, 'getColumns');
      const configureFilterDataSpy = jest.spyOn(component, 'configureFilterData');
      component.ngOnInit();
      expect(component.currentUser).toEqual({ user_role: '1' });
      expect(getColumnsSpy).toHaveBeenCalled();
      expect(configureFilterDataSpy).toHaveBeenCalled();
    });
  });

  describe('configureFilterData', () => {
    it('should set districts and tehsils and call setInputData when districts fetched', () => {
      const setInputDataSpy = jest.spyOn(component, 'setInputData');
      const setVilageDataSpy = jest.spyOn(component, 'setVilageData');
      component.configureFilterData();
      expect(component.districts).toEqual([{ district_id: '1', state_id: '1', district_name: 'District1' }]);
      expect(component.tehsils).toEqual([{ tehsil_id: '1', district_id: '1', tehsil_name: 'Tehsil1' }]);
      expect(setInputDataSpy).toHaveBeenCalled();
      expect(setVilageDataSpy).toHaveBeenCalled();
      expect(component.lookupLoader).toBe(false);
    });

    it('should subscribe to fetchedDistrictData when not fetched', () => {
      filterService.isDistrictFetched = false;
      const setInputDataSpy = jest.spyOn(component, 'setInputData');
      component.configureFilterData();
      const subscriber = filterService.fetchedDistrictData.subscribe.mock.calls[0][0];
      subscriber();
      expect(component.districts).toEqual([{ district_id: '1', state_id: '1', district_name: 'District1' }]);
      expect(component.tehsils).toEqual([{ tehsil_id: '1', district_id: '1', tehsil_name: 'Tehsil1' }]);
      expect(setInputDataSpy).toHaveBeenCalled();
    });

    it('should subscribe to fetchedVillageData when not fetched', () => {
      filterService.isvillageFetched = false;
      const setVilageDataSpy = jest.spyOn(component, 'setVilageData');
      component.configureFilterData();
      const subscriber = filterService.fetchedVillageData.subscribe.mock.calls[0][0];
      subscriber();
      expect(setVilageDataSpy).toHaveBeenCalled();
    });
  });

  describe('setInputData', () => {
    it('should set filter data and mappings', () => {
      component.setInputData();
      expect(component.yearData).toEqual([{ id: '2023', year: '2023' }]);
      expect(component.seasonData).toEqual([{ id: '1', season_name: 'Season1' }]);
      expect(component.statesData).toEqual([{ state_id: '1', state_name: 'State1' }]);
      expect(component.stateMap.get('1')).toBe('State1');
      expect(component.districtMap.get('1')).toBe('District1');
      expect(component.tehsilMap.get('1')).toBe('Tehsil1');
      expect(component.blockMap.get('1')).toBe('Block1');
      expect(component.seasonMap.get('1')).toBe('Season1');
      expect(component.yearMap.get('2023')).toBe('2023');
      expect(component.cropMap.get(1)).toBe('Crop1');
      expect(component.notifiedUnitMap.get('1')).toBe('NotifiedUnit1');
      expect(component.lookupLoader).toBe(false);
    });
  });

  describe('setVilageData', () => {
    it('should set grampanchayat and village mappings', () => {
      component.setVilageData();
      expect(component.grampanchayatMap.get('1')).toBe('GramPanchayat1');
      expect(component.villageMap.get('1')).toBe('Village1');
    });
  });

  describe('onStateSelect', () => {
    it('should update districtData based on selected states', () => {
      const event = [{ state_id: '1', state_name: 'State1' }];
      component.districts = filterService.districts;
      component.onStateSelect(event);
      expect(component.districtData).toEqual([{ state_id: '1', state_name: 'State1', items: [{ district_id: '1', state_id: '1', district_name: 'District1' }] }]);
      expect(component.blockData).toEqual([]);
      expect(component.selectedDist).toEqual([]);
      expect(component.selectedBlock).toEqual([]);
    });
  });

  describe('onDistSelect', () => {
    it('should update blockData based on selected districts', () => {
      const event = [{ district_id: '1', district_name: 'District1' }];
      component.tehsils = filterService.tehsils;
      component.onDistSelect(event);
      expect(component.blockData).toEqual([{ district_id: '1', district_name: 'District1', items: [{ tehsil_id: '1', district_id: '1', tehsil_name: 'Tehsil1' }] }]);
      expect(component.selectedBlock).toEqual([]);
    });
  });

  describe('applyFilter', () => {
    it('should show warning if year or season not selected', () => {
      component.selectedYear = '';
      component.selectedSeason = '';
      component.applyFilter();
      expect(coreService.toast).toHaveBeenCalledWith('warn', 'Year is required');
      component.selectedYear = '2023';
      component.applyFilter();
      expect(coreService.toast).toHaveBeenCalledWith('warn', 'Season is required');
    });

    it('should call getIntimationData with built request', () => {
      const getIntimationDataSpy = jest.spyOn(component, 'getIntimationData');
      component.projectContext = 'saksham';
      component.currentUser = { user_role: '1' };
      component.selectedYear = '2023';
      component.selectedSeason = '1';
      component.applyFilter();
      expect(component.rows).toEqual([]);
      expect(component.no_data).toBe('No data found');
      expect(component.currentpage).toBe(1);
      expect(getIntimationDataSpy).toHaveBeenCalled();
    });
  });

  describe('getIntimationData', () => {
    it('should increment loading and return if villages not loaded', () => {
      filterService.villages = [];
      const request = {};
      component.getIntimationData(request);
      expect(component.loading).toBe(1);
      expect(component.preApplied).toBe(true);
    });

    it('should handle error', async () => {
      filterService.villages = [{}];
      const request = {};
      const mockError = new Error('API error');
      coreService.dashboard_post.mockRejectedValue(mockError);

      component.getIntimationData(request);
      await new Promise(resolve => setTimeout(resolve));

      expect(component.loading).toBe(0);
      expect(insightsService.logException).toHaveBeenCalledWith(mockError);
    });
  });

  describe('onPageTrigger', () => {
    it('should update pagination and call getIntimationData', () => {
      const getIntimationDataSpy = jest.spyOn(component, 'getIntimationData');
      const event = { page_no: 2, records_per_page: 20 };
      component.onPageTrigger(event);
      expect(component.currentpage).toBe(2);
      expect(component.recordsPerPage).toBe(20);
      expect(component.rows).toEqual([]);
      expect(component.no_data).toBe('No data found');
      expect(getIntimationDataSpy).toHaveBeenCalled();
    });
  });

  describe('getColumns', () => {
    it('should set columns for saksham context', () => {
      component.projectContext = 'saksham';
      component.getColumns();
      expect(component.columns.some(col => col.field === 'farmer_mobile_number')).toBe(true);
    });

    it('should set columns for munichre context', () => {
      component.projectContext = 'munichre';
      component.getColumns();
      expect(component.columns.some(col => col.field === 'insured_area')).toBe(true);
      expect(component.columns.some(col => col.field === 'post_harvest_date')).toBe(true);
    });
  });

  describe('downloadExcel', () => {
    it('should download excel with data', async () => {
      coreService.dashboard_post.mockResolvedValueOnce({ status: 1, intimation_data: [{ id: 1, state: '1' }] });
      jest.spyOn(XLSX.utils, 'aoa_to_sheet').mockReturnValue({} as any);
      jest.spyOn(XLSX.utils, 'book_new').mockReturnValue({} as any);
      jest.spyOn(XLSX.utils, 'book_append_sheet').mockImplementation(() => {});
      const writeFileSpy = jest.spyOn(XLSX, 'writeFile').mockImplementation(() => {});
      await component.downloadExcel();
      expect(coreService.dashboard_post).toHaveBeenCalled();
      expect(writeFileSpy).toHaveBeenCalled();
    });
  });

  describe('generateExcel', () => {
    it('should generate and write excel file', () => {
      const rows = [{ id: 1 }];
      jest.spyOn(XLSX.utils, 'aoa_to_sheet').mockReturnValue({} as any);
      jest.spyOn(XLSX.utils, 'book_new').mockReturnValue({} as any);
      jest.spyOn(XLSX.utils, 'book_append_sheet').mockImplementation(() => {});
      const writeFileSpy = jest.spyOn(XLSX, 'writeFile').mockImplementation(() => {});
      component.columns = [{ field: 'id', header: 'ID' }];
      component['generateExcel'](rows);
      expect(writeFileSpy).toHaveBeenCalled();
    });
  });
});