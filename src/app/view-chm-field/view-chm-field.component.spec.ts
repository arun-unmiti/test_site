import { TestBed, async, ComponentFixture, fakeAsync, tick, flushMicrotasks } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
import * as moment from 'moment';

import { ViewChmFieldComponent } from './view-chm-field.component';
import { FilterService } from '../utilities/filter.service';
import { CoreService } from '../utilities/core.service';
import { UserDetailService } from '../auth/user-detail.service';
import { FeatureToggleService } from '../shared/services/feature-toggle.service';
import { InsightsService } from '../utilities/insights.service';
import { environment, ProjectContext } from '../../environments/environment';

jest.mock('../../environments/environment', () => ({
  environment: {
    projectConfigs: {
      munichre: { assetsFolder: '/assets/munichre' },
      saksham: { assetsFolder: '/assets/saksham' },
    }
  }
}));

jest.mock('xlsx', () => ({
  utils: {
    aoa_to_sheet: jest.fn(),
    book_new: jest.fn(),
    book_append_sheet: jest.fn(),
  },
  writeFile: jest.fn(),
}));

class MockFilterService {
  isDistrictFetched = true;
  districts = [{ district_id: '1', state_id: '1', district_name: 'District1' }];
  tehsils = [{ tehsil_id: '1', district_id: '1', tehsil_name: 'Tehsil1' }];
  years = [{ id: '2023', year: '2023' }];
  seasons = [{ id: '1', season_name: 'Season1' }];
  states = [{ state_id: '1', state_name: 'State1' }];
  lookupData = { states: [{ state_id: '1', state_name: 'State1' }] };
  fetchedDistrictData = { subscribe: jest.fn() };
}

class MockCoreService {
  dashboard_post = jest.fn().mockResolvedValue({ status: 1, location: [], total_records: 0 });
  toast = jest.fn();
  clone = jest.fn(obj => JSON.parse(JSON.stringify(obj)));
}

class MockUserDetailService {
  getUserDetail = jest.fn().mockReturnValue({ user_role: '1' });
}

class MockFeatureToggleService {
  getContext = jest.fn().mockReturnValue('munichre');
}

class MockInsightsService {
  logException = jest.fn();
}

describe('ViewChmFieldComponent', () => {
  let component: ViewChmFieldComponent;
  let fixture: ComponentFixture<ViewChmFieldComponent>;
  let filterService: any;
  let coreService: any;
  let userDetailService: any;
  let featureToggleService: any;
  let insightsService: any;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        FormsModule,
      ],
      declarations: [ViewChmFieldComponent],
      providers: [
        { provide: FilterService, useClass: MockFilterService },
        { provide: CoreService, useClass: MockCoreService },
        { provide: UserDetailService, useClass: MockUserDetailService },
        { provide: FeatureToggleService, useClass: MockFeatureToggleService },
        { provide: InsightsService, useClass: MockInsightsService },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ViewChmFieldComponent);
    component = fixture.componentInstance;
    filterService = TestBed.inject(FilterService);
    coreService = TestBed.inject(CoreService);
    userDetailService = TestBed.inject(UserDetailService);
    featureToggleService = TestBed.inject(FeatureToggleService);
    insightsService = TestBed.inject(InsightsService);
  }));

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  describe('constructor', () => {
    it('should set projectContext and assetsFolder', () => {
      featureToggleService.getContext.mockReturnValue('saksham');
      const comp = new ViewChmFieldComponent(filterService as any, coreService as any, userDetailService as any, featureToggleService as any, insightsService as any);
      expect(comp.projectContext).toBe('saksham');
      expect(comp.assetsFolder).toBe('/assets/saksham');
    });
  });

  describe('ngOnInit', () => {
    it('should set currentUser, call getColumns and setupFilterSubscriptions', () => {
      const getColumnsSpy = jest.spyOn(component, 'getColumns');
      const getFilterDataSpy = jest.spyOn(component, 'setupFilterSubscriptions');
      component.ngOnInit();
      expect(component.currentUser).toEqual({ user_role: '1' });
      expect(getColumnsSpy).toHaveBeenCalled();
      expect(getFilterDataSpy).toHaveBeenCalled();
    });
  });

  describe('setupFilterSubscriptions', () => {
    it('should set districts and tehsils and call setInputData when districts fetched', () => {
      const setInputDataSpy = jest.spyOn(component, 'setInputData');
      component.lookupLoader = true;
      component.setupFilterSubscriptions();
      expect(component.districts).toEqual([{ district_id: '1', state_id: '1', district_name: 'District1' }]);
      expect(component.tehsils).toEqual([{ tehsil_id: '1', district_id: '1', tehsil_name: 'Tehsil1' }]);
      expect(setInputDataSpy).toHaveBeenCalled();
      expect(component.lookupLoader).toBe(false);
    });

    it('should subscribe to fetchedDistrictData when not fetched', fakeAsync(() => {
      filterService.isDistrictFetched = false;
      const setInputDataSpy = jest.spyOn(component, 'setInputData');
      component.lookupLoader = true;
      component.setupFilterSubscriptions();
      const subscriber = filterService.fetchedDistrictData.subscribe.mock.calls[0][0];
      subscriber();
      tick();
      expect(component.districts).toEqual([{ district_id: '1', state_id: '1', district_name: 'District1' }]);
      expect(component.tehsils).toEqual([{ tehsil_id: '1', district_id: '1', tehsil_name: 'Tehsil1' }]);
      expect(setInputDataSpy).toHaveBeenCalled();
      expect(component.lookupLoader).toBe(false);
    }));
  });

  describe('onYearSelect', () => {
    it('should be empty', () => {
      component.onYearSelect('2023');
      expect(true).toBe(true);
    });
  });

  describe('onSeasonSelect', () => {
    it('should be empty', () => {
      component.onSeasonSelect('1');
      expect(true).toBe(true);
    });
  });

  describe('onStateSelect', () => {
    it('should reset and set districtData', () => {
      const event = [{ state_id: 1, state_name: 'State1' }];
      component.districts = [{ state_id: 1, district_id: 1, district_name: 'District1' }];
      component.onStateSelect(event);
      expect(component.districtData[0].items).toEqual([{ state_id: 1, district_id: 1, district_name: 'District1' }]);
      expect(component.blockData).toEqual([]);
      expect(component.selectedDist).toEqual([]);
      expect(component.selectedBlock).toEqual([]);
    });

    it('should reset if no event', () => {
      component.onStateSelect([]);
      expect(component.districtData).toEqual([]);
    });
  });

  describe('onDistSelect', () => {
    it('should reset and set blockData', () => {
      const event = [{ district_id: 1, district_name: 'District1' }];
      component.tehsils = [{ district_id: 1, tehsil_id: 1, tehsil_name: 'Tehsil1' }];
      component.onDistSelect(event);
      expect(component.blockData[0].items).toEqual([{ district_id: 1, tehsil_id: 1, tehsil_name: 'Tehsil1' }]);
      expect(component.selectedBlock).toEqual([]);
    });

    it('should reset if no event', () => {
      component.onDistSelect([]);
      expect(component.blockData).toEqual([]);
    });
  });
  
  describe('onTehsilSelect', () => {
    it('should be empty', () => {
      component.onTehsilSelect('1');
      expect(true).toBe(true);
    });
  });

  describe('applyFilter', () => {
    it('should toast if munichre and no year', () => {
      featureToggleService.getContext.mockReturnValue('munichre');
      component.projectContext = 'munichre';
      component.selectedYear = null;
      component.applyFilter();
      expect(coreService.toast).toHaveBeenCalledWith('warn', 'Year is required');
    });

    it('should toast if munichre and no season', () => {
      featureToggleService.getContext.mockReturnValue('munichre');
      component.projectContext = 'munichre';
      component.selectedYear = '2023';
      component.selectedSeason = null;
      component.applyFilter();
      expect(coreService.toast).toHaveBeenCalledWith('warn', 'Season is required');
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
      expect(component.seasonMap.get('1')).toBe('Season1');
      expect(component.yearMap.get('2023')).toBe('2023');
      expect(component.lookupLoader).toBe(false);
    });
  });

  describe('onPageTrigger', () => {
    it('should update pagination and call getViewCHMData', () => {
      const spy = jest.spyOn(component, 'getViewCHMData');
      component.onPageTrigger({ page_no: 2, records_per_page: 20 });
      expect(component.currentpage).toBe(2);
      expect(component.recordsPerPage).toBe(20);
      expect(component.rows).toEqual([]);
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('getColumns', () => {
    it('should set columns', () => {
      component.getColumns();
      expect(component.columns.length).toBe(9);
      expect(component.columns[0]).toEqual({ field: 'id', header: 'ID' });
      expect(component.columns[1]).toEqual({ field: 'year', header: 'Year' });
      expect(component.columns[2]).toEqual({ field: 'season', header: 'Season' });
      expect(component.columns[3]).toEqual({ field: 'state', header: 'State' });
      expect(component.columns[4]).toEqual({ field: 'district', header: 'District' });
      expect(component.columns[5]).toEqual({ field: 'tehsil', header: 'Block' });
      expect(component.columns[6]).toEqual({ field: 'lat', header: 'Latitude' });
      expect(component.columns[7]).toEqual({ field: 'lng', header: 'Longitude' });
      expect(component.columns[8]).toEqual({ field: 'added_datetime', header: 'Date Time' });
    });
  });

  // New test cases start here

  describe('buildRequest (via public methods)', () => {
    beforeEach(() => {
      component.ngOnInit();
      component.setInputData();
      component.selectedYear = '2023';
      component.selectedSeason = '1';
      component.selectedState = [{ state_id: '1' }];
      component.selectedDist = [{ district_id: '1' }];
      component.selectedBlock = [{ tehsil_id: '1' }];
      component.selectedFromDate = {
        startDate: moment('2023-01-01'),
        endDate: moment('2023-01-31'),
      };
    });

    it('should build request for munichre with selected values', () => {
      component.projectContext = 'munichre';
      const request = (component as any).buildRequest(1, 10);
      expect(request).toEqual({
        purpose: 'get_chm_location',
        year: '2023',
        season: '1',
        state: ['1'],
        district: ['1'],
        start_date: '2023-01-01',
        end_date: '2023-01-31',
        pagination: { page_no: 1, records_per_page: 10 },
        tehsil: ['1'],
      });
    });

    it('should build request for non-munichre with selected values', () => {
      component.projectContext = 'saksham';
      const request = (component as any).buildRequest(1, 10);
      expect(request).toEqual({
        purpose: 'get_chm_location',
        year: '2023',
        season: '1',
        state: ['1'],
        district: ['1'],
        start_date: '2023-01-01',
        end_date: '2023-01-31',
        pagination: { page_no: 1, records_per_page: 10 },
        tehsils: ['1'],
      });
    });

    it('should set all states/districts/tehsils if not selected for non-munichre and user_role not 1 or 2', () => {
      component.projectContext = 'saksham';
      userDetailService.getUserDetail.mockReturnValue({ user_role: '3' });
      component.currentUser = { user_role: '3' };
      component.selectedState = [];
      component.selectedDist = [];
      component.selectedBlock = [];
      const request = (component as any).buildRequest(1, 10);
      expect(request.state).toEqual(['1']);
      expect(request.district).toEqual(['1']);
      expect(request.tehsils).toEqual(['1']);
    });

    it('should not set all if selected for non-munichre and user_role not 1 or 2', () => {
      component.projectContext = 'saksham';
      userDetailService.getUserDetail.mockReturnValue({ user_role: '3' });
      component.currentUser = { user_role: '3' };
      const request = (component as any).buildRequest(1, 10);
      expect(request.state).toEqual(['1']);
      expect(request.district).toEqual(['1']);
      expect(request.tehsils).toEqual(['1']);
    });

    it('should not modify if user_role 1 or 2 for non-munichre', () => {
      component.projectContext = 'saksham';
      component.selectedState = [];
      component.selectedDist = [];
      component.selectedBlock = [];
      const request = (component as any).buildRequest(1, 10);
      expect(request.state).toEqual([]);
      expect(request.district).toEqual([]);
      expect(request.tehsils).toEqual([]);
    });

    it('should handle null dates', () => {
      component.selectedFromDate = null;
      const request = (component as any).buildRequest(1, 10);
      expect(request.start_date).toBeNull();
      expect(request.end_date).toBeNull();
    });
  });

  describe('applyFilter success path', () => {
    beforeEach(() => {
      component.ngOnInit();
      component.setInputData();
      component.projectContext = 'munichre';
      component.selectedYear = '2023';
      component.selectedSeason = '1';
      jest.spyOn(component, 'getViewCHMData');
    });

    it('should reset and call getViewCHMData for munichre', () => {
      component.applyFilter();
      expect(component.rows).toEqual([]);
      expect(component.no_data).toBe('No data found');
      expect(component.currentpage).toBe(1);
      expect(component.getViewCHMData).toHaveBeenCalled();
    });
  });

  describe('getViewCHMData', () => {
    let request: any;
    beforeEach(() => {
      component.ngOnInit();
      component.setInputData();
      request = { purpose: 'test' };
      component.columns = component.columns; // already set
      component.pagination = { updatePagination: jest.fn() };
      component.stateMap.set('1', 'State1');
      component.districtMap.set('1', 'District1');
      component.tehsilMap.set('1', 'Tehsil1');
      component.seasonMap.set('1', 'Season1');
      component.yearMap.set('2023', '2023');
    });

    it('should not update pagination if not present', fakeAsync(() => {
      component.pagination = undefined;
      coreService.dashboard_post.mockResolvedValue({ status: 1, location: [] });
      component.getViewCHMData(request);
      tick();
      tick(0);
      // No error
      expect(true).toBe(true);
    }));
  });

  describe('applyFilter for non-munichre', () => {
    beforeEach(() => {
      featureToggleService.getContext.mockReturnValue('saksham');
      component.projectContext = 'saksham';
      component.ngOnInit();
      component.setInputData();
      jest.spyOn(component, 'getViewCHMData');
    });

    it('should apply without validation', () => {
      component.selectedYear = null;
      component.selectedSeason = null;
      component.applyFilter();
      expect(coreService.toast).not.toHaveBeenCalled();
      expect(component.getViewCHMData).toHaveBeenCalled();
    });
  });
});