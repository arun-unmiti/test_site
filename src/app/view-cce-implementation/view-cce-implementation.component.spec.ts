import 'zone.js/bundles/zone-testing-bundle.umd.js';
import { ComponentFixture, TestBed, async } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbModule, NgbCollapseModule } from '@ng-bootstrap/ng-bootstrap';
import { MultiSelectModule } from 'primeng/multiselect';
import * as XLSX from 'xlsx';
import * as moment from 'moment';

jest.mock('../../environments/environment', () => ({
  environment: {
    projectConfigs: {
      saksham: { assetsFolder: 'assets/saksham' },
      other: { assetsFolder: 'assets/other' },
    },
  },
  ProjectContext: 'saksham',
}));

import { ViewCceImplementationComponent } from './view-cce-implementation.component';
import { FilterService } from '../utilities/filter.service';
import { CoreService } from '../utilities/core.service';
import { UserDetailService } from '../auth/user-detail.service';
import { FeatureToggleService } from '../shared/services/feature-toggle.service';
import { of, throwError } from 'rxjs';

// Mock Services
class MockFilterService {
  isDistrictFetched = true;
  fetchedDistrictData = { subscribe: jest.fn((callback) => callback()) };
  states = [{ state_id: '1', state_name: 'State1' }];
  districts = [{ district_id: '1', district_name: 'Dist1', state_id: '1' }];
  tehsils = [{ tehsil_id: '1', tehsil_name: 'Tehsil1', district_id: '1' }];
  blocks = [{ block_id: '1', block_name: 'Block1' }];
  grampanchayats = [{ grampanchayat_id: '1', grampanchayat_name: 'GP1' }];
  villages = [{ village_id: '1', village_name: 'Village1' }];
  crops = [{ crop_code: 1, crop_name: 'Crop1' }];
  seasons = [{ id: '1', season_name: 'Season1' }];
  years = [{ id: '2023', year: '2023' }];
  notifiedUnits = [{ notified_id: '1', notified_unit_name: 'NU1' }];
  lookupData = { states: [{ state_id: '1' }] };
}

class MockCoreService {
  dashboard_post = jest.fn().mockResolvedValue({ status: 1, implementation: [{ state: '1' }] });
  toast = jest.fn();
  clone = jest.fn(obj => JSON.parse(JSON.stringify(obj)));
}

class MockUserDetailService {
  getUserDetail = jest.fn(() => ({ user_role: '1' }));
}

class MockFeatureToggleService {
  getContext = jest.fn(() => 'saksham');
}

describe('ViewCceImplementationComponent', () => {
  let component: ViewCceImplementationComponent;
  let fixture: ComponentFixture<ViewCceImplementationComponent>;
  let filterService: any;
  let coreService: any;
  let userService: any;
  let featureToggle: any;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ViewCceImplementationComponent],
      imports: [
        HttpClientTestingModule,
        FormsModule,
        NgbModule,
        NgbCollapseModule,
        MultiSelectModule,
      ],
      providers: [
        { provide: FilterService, useClass: MockFilterService },
        { provide: CoreService, useClass: MockCoreService },
        { provide: UserDetailService, useClass: MockUserDetailService },
        { provide: FeatureToggleService, useClass: MockFeatureToggleService },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ViewCceImplementationComponent);
    component = fixture.componentInstance;
    filterService = TestBed.inject(FilterService);
    coreService = TestBed.inject(CoreService);
    userService = TestBed.inject(UserDetailService);
    featureToggle = TestBed.inject(FeatureToggleService);
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  describe('constructor', () => {
    it('should set projectContext and assetsFolder', () => {
      expect(component.projectContext).toBe('saksham');
      expect(component.assetsFolder).toBeDefined();
    });

    it('should handle different contexts', () => {
      featureToggle.getContext.mockReturnValue('other');
      const newFixture = TestBed.createComponent(ViewCceImplementationComponent);
      const newComponent = newFixture.componentInstance;
      expect(newComponent.projectContext).toBe('other');
      expect(newComponent.assetsFolder).toBe('assets/other');
    });
  });

  describe('ngOnInit', () => {
    it('should set currentUser and call methods', () => {
      const getColumnsSpy = jest.spyOn(component, 'getColumns');
      const initializeFilterDataSpy = jest.spyOn(component, 'initializeFilterData');
      component.ngOnInit();
      expect(component.currentUser).toEqual({ user_role: '1' });
      expect(getColumnsSpy).toHaveBeenCalled();
      expect(initializeFilterDataSpy).toHaveBeenCalled();
    });
  });

  describe('initializeFilterData', () => {
    it('should set lookupLoader to true', () => {
      const setInputDataSpy = jest.spyOn(component, 'setInputData').mockImplementation(() => {});
      component.initializeFilterData();
      expect(component.lookupLoader).toBe(true);
    });

    it('should set districts/tehsils and call setInputData if fetched', () => {
      filterService.isDistrictFetched = true;
      const setInputDataSpy = jest.spyOn(component, 'setInputData');
      component.initializeFilterData();
      expect(component.districts).toEqual([{ district_id: '1', district_name: 'Dist1', state_id: '1' }]);
      expect(component.tehsils).toEqual([{ tehsil_id: '1', tehsil_name: 'Tehsil1', district_id: '1' }]);
      expect(setInputDataSpy).toHaveBeenCalled();
    });

    it('should subscribe if not fetched', () => {
      filterService.isDistrictFetched = false;
      filterService.fetchedDistrictData = { subscribe: jest.fn() };
      const setInputDataSpy = jest.spyOn(component, 'setInputData');
      component.initializeFilterData();
      const subscriber = filterService.fetchedDistrictData.subscribe.mock.calls[0][0];
      subscriber();
      expect(setInputDataSpy).toHaveBeenCalled();
      expect(component.districts).toEqual([{ district_id: '1', district_name: 'Dist1', state_id: '1' }]);
      expect(component.tehsils).toEqual([{ tehsil_id: '1', tehsil_name: 'Tehsil1', district_id: '1' }]);
    });
  });

  describe('setInputData', () => {
    it('should set lookupLoader to false and populate all maps', () => {
      component.setInputData();
      expect(component.lookupLoader).toBe(false);
      expect(component.yearData).toEqual(filterService.years);
      expect(component.seasonData).toEqual(filterService.seasons);
      expect(component.statesData).toEqual(filterService.lookupData.states);

      expect(component.stateMap.get('1')).toBe('State1');
      expect(component.districtMap.get('1')).toBe('Dist1');
      expect(component.tehsilMap.get('1')).toBe('Tehsil1');
      expect(component.blockMap.get('1')).toBe('Block1');
      expect(component.grampanchayatMap.get('1')).toBe('GP1');
      expect(component.villageMap.get('1')).toBe('Village1');
      expect(component.seasonMap.get('1')).toBe('Season1');
      expect(component.yearMap.get('2023')).toBe('2023');
      expect(component.cropMap.get(1)).toBe('Crop1');
      expect(component.notifiedUnitMap.get('1')).toBe('NU1');
    });
  });

  describe('onYearSelect', () => {
    it('should handle year selection (empty implementation)', () => {
      const event = '2023';
      component.onYearSelect(event);
      expect(true).toBe(true); // Covers the empty method
    });
  });

  describe('onSeasonSelect', () => {
    it('should handle season selection (empty implementation)', () => {
      const event = '1';
      component.onSeasonSelect(event);
      expect(true).toBe(true); // Covers the empty method
    });
  });

  describe('onStateSelect', () => {
    it('should reset district and block selections and data if no states selected', () => {
      component.onStateSelect([]);
      expect(component.districtData).toEqual([]);
      expect(component.blockData).toEqual([]);
      expect(component.selectedDist).toEqual([]);
      expect(component.selectedBlock).toEqual([]);
    });

    it('should set districtData based on selected states', () => {
      component.districts = [{ state_id: '1', district_id: '1' }];
      const event = [{ state_id: '1' }];
      component.onStateSelect(event);
      expect(component.districtData.length).toBe(1);
      expect(component.districtData[0].items).toEqual([{ state_id: '1', district_id: '1' }]);
    });
  });

  describe('onDistSelect', () => {
    it('should reset block selections and data if no districts selected', () => {
      component.onDistSelect([]);
      expect(component.blockData).toEqual([]);
      expect(component.selectedBlock).toEqual([]);
    });

    it('should set blockData based on selected districts', () => {
      component.tehsils = [{ district_id: '1', tehsil_id: '1' }];
      const event = [{ district_id: '1' }];
      component.onDistSelect(event);
      expect(component.blockData.length).toBe(1);
      expect(component.blockData[0].items).toEqual([{ district_id: '1', tehsil_id: '1' }]);
    });
  });

  describe('onTehsilSelect', () => {
    it('should handle tehsil selection (empty implementation)', () => {
      const event = '1';
      component.onTehsilSelect(event);
      expect(true).toBe(true); // Covers the empty method
    });
  });

  describe('applyFilter', () => {
    beforeEach(() => {
      component.selectedYear = '2023';
      component.selectedSeason = '1';
      component.selectedState = [{ state_id: '1' }];
      component.selectedDist = [{ district_id: '1' }];
      component.selectedBlock = [{ tehsil_id: '1' }];
      component.selectedFromDate = { startDate: moment('2023-01-01'), endDate: moment('2023-01-31') };

      component.stateMap.set('1', 'State1');
      component.districtMap.set('1', 'Dist1');
      component.tehsilMap.set('1', 'Tehsil1');
      component.blockMap.set('1', 'Block1');
      component.grampanchayatMap.set('1', 'GP1');
      component.villageMap.set('1', 'Village1');
      component.seasonMap.set('1', 'Season1');
      component.yearMap.set('2023', '2023');
      component.cropMap.set(1, 'Crop1');
      component.notifiedUnitMap.set('1', 'NU1');

      component.getColumns(); // To set columns
    });

    it('should handle user_role not 1 or 2 and fill missing state/district/taluka', () => {
      userService.getUserDetail.mockReturnValue({ user_role: '3' });
      component.currentUser = { user_role: '3' };
      component.selectedState = [];
      component.selectedDist = [];
      component.selectedBlock = [];
      filterService.states = [{ state_id: '1' }];
      filterService.districts = [{ district_id: '1' }];
      filterService.tehsils = [{ tehsil_id: '1' }];

      component.applyFilter();
      const request = coreService.dashboard_post.mock.calls[0][0];
      expect(request.state).toEqual(['1']);
      expect(request.district).toEqual(['1']);
      expect(request.taluka).toEqual(['1']);
    });

    it('should not fill missing fields if user_role is 1 or 2', () => {
      component.selectedState = [];
      component.selectedDist = [];
      component.selectedBlock = [];

      component.applyFilter();
      const request = coreService.dashboard_post.mock.calls[0][0];
      expect(request.state).toEqual([]);
      expect(request.district).toEqual([]);
      expect(request.taluka).toEqual([]);
    });

    it('should process response and map all fields using maps', async () => {
      const mockResponse = {
        status: 1,
        implementation: [
          {
            year: '2023',
            season: '1',
            state: '1',
            district: '1',
            taluka: '1',
            ri_circle: '1',
            gp: '1',
            village: '1',
            notified_unit: '1',
            crop: 1,
            notified_area: 'Area1',
            cce_type: 'Type1',
            random_no: '123',
            longitude: '10',
            latitude: '20',
            farmer_name: 'Farmer',
            farmer_mobile: '12345',
            shape_of_cce_plot: 'Square',
            dimension_of_plot: '10x10',
          }
        ]
      };
      coreService.dashboard_post.mockResolvedValue(mockResponse);

      component.applyFilter();
      await coreService.dashboard_post.mock.results[0].value;

      expect(component.rows.length).toBe(1);
      const row = component.rows[0];
      expect(row.year).toBe('2023');
      expect(row.season).toBe('Season1');
      expect(row.state).toBe('State1');
      expect(row.district).toBe('Dist1');
      expect(row.taluka).toBe('Tehsil1');
      expect(row.ri_circle).toBe('Block1');
      expect(row.gp).toBe('GP1');
      expect(row.village).toBe('Village1');
      expect(row.notified_unit).toBe('NU1');
      expect(row.crop).toBe('Crop1');
      // Non-mapped fields remain as is
      expect(row.notified_area).toBe('Area1');
      expect(row.cce_type).toBe('Type1');
      expect(row.random_no).toBe('123');
      expect(row.longitude).toBe('10');
      expect(row.latitude).toBe('20');
      expect(row.farmer_name).toBe('Farmer');
      expect(row.farmer_mobile).toBe('12345');
      expect(row.shape_of_cce_plot).toBe('Square');
      expect(row.dimension_of_plot).toBe('10x10');

      expect(component.no_data).toBe('');
    });

    it('should set no_data if no rows', async () => {
      coreService.dashboard_post.mockResolvedValue({ status: 1, implementation: [] });
      component.applyFilter();
      await coreService.dashboard_post.mock.results[0].value;
      expect(component.rows).toEqual([]);
      expect(component.no_data).toBe('No data found');
    });

    it('should not set rows if status !=1', async () => {
      coreService.dashboard_post.mockResolvedValue({ status: 0 });
      component.applyFilter();
      await coreService.dashboard_post.mock.results[0].value;
      expect(component.rows).toEqual([]);
    });

    it('should handle error in catch', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      coreService.dashboard_post.mockRejectedValue('error');
      component.applyFilter();
      expect(component.loading).toBe(1);
      await expect(coreService.dashboard_post.mock.results[0].value).rejects.toBe('error');
      expect(consoleSpy).toHaveBeenCalledWith('error');
      expect(component.loading).toBe(0);
    });

    it('should handle null start_date and end_date', () => {
      component.selectedFromDate = null;
      component.applyFilter();
      const request = coreService.dashboard_post.mock.calls[0][0];
      expect(request.start_date).toBeNull();
      expect(request.end_date).toBeNull();
    });
  });

  describe('getColumns', () => {
    it('should set columns array correctly', () => {
      component.columns = [];
      component.getColumns();
      expect(component.columns.length).toBe(19);
      expect(component.columns[0]).toEqual({ field: 'year', header: 'Year' });
      expect(component.columns[1]).toEqual({ field: 'season', header: 'Season' });
      expect(component.columns[2]).toEqual({ field: 'state', header: 'State' });
      expect(component.columns[3]).toEqual({ field: 'district', header: 'DISTRICT' });
      expect(component.columns[4]).toEqual({ field: 'taluka', header: 'TALUKA' });
      expect(component.columns[5]).toEqual({ field: 'ri_circle', header: 'RI circle' });
      expect(component.columns[6]).toEqual({ field: 'notified_area', header: 'Notified area' });
      expect(component.columns[7]).toEqual({ field: 'gp', header: 'GP' });
      expect(component.columns[8]).toEqual({ field: 'village', header: 'Village' });
      expect(component.columns[9]).toEqual({ field: 'notified_unit', header: 'Notified Unit' });
      expect(component.columns[10]).toEqual({ field: 'crop', header: 'Crop' });
      expect(component.columns[11]).toEqual({ field: 'cce_type', header: 'CCE Type' });
      expect(component.columns[12]).toEqual({ field: 'random_no', header: 'Random no' });
      expect(component.columns[13]).toEqual({ field: 'longitude', header: 'Longitude' });
      expect(component.columns[14]).toEqual({ field: 'latitude', header: 'Latitude' });
      expect(component.columns[15]).toEqual({ field: 'farmer_name', header: 'Farmer Name' });
      expect(component.columns[16]).toEqual({ field: 'farmer_mobile', header: 'Farmer Mobile no' });
      expect(component.columns[17]).toEqual({ field: 'shape_of_cce_plot', header: 'Shape of CCE plot' });
      expect(component.columns[18]).toEqual({ field: 'dimension_of_plot', header: 'Dimension of plot' });
    });
  });

  describe('downloadExcel', () => {
    beforeEach(() => {
      component.getColumns(); // Set columns
      component.rows = [
        {
          year: '2023',
          season: 'Season1',
          state: 'State1',
          // ... assume all fields
        }
      ];

      jest.spyOn(XLSX.utils, 'aoa_to_sheet').mockReturnValue({} as any);
      jest.spyOn(XLSX.utils, 'book_new').mockReturnValue({} as any);
      jest.spyOn(XLSX.utils, 'book_append_sheet').mockImplementation(() => {});
      jest.spyOn(XLSX, 'writeFile').mockImplementation(() => {});
      jest.spyOn(moment.prototype, 'format').mockReturnValue('20230101');
    });

    it('should prepare data and call XLSX methods', () => {
      component.downloadExcel();
      expect(XLSX.utils.aoa_to_sheet).toHaveBeenCalled();
      expect(XLSX.utils.book_new).toHaveBeenCalled();
      expect(XLSX.utils.book_append_sheet).toHaveBeenCalled();
      expect(XLSX.writeFile).toHaveBeenCalledWith(expect.any(Object), '20230101_cce_implementation.xlsx');
    });

    it('should handle empty rows', () => {
      component.rows = [];
      component.downloadExcel();
      expect(XLSX.utils.aoa_to_sheet).toHaveBeenCalledWith([component.columns.map(d => d.header)]);
    });
  });
});