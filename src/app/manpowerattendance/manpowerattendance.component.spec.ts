import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MultiSelectModule } from 'primeng/multiselect';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import {
  DateAdapter,
  MAT_DATE_FORMATS,
  MAT_DATE_LOCALE,
} from "@angular/material/core";
import * as moment from 'moment';

import { ManpowerattendanceComponent } from './manpowerattendance.component';
import { CoreService } from '../utilities/core.service';
import { FilterService } from '../utilities/filter.service';
import { UserDetailService } from '../auth/user-detail.service';
import { FeatureToggleService } from '../shared/services/feature-toggle.service';
import { environment, ProjectContext } from '../../environments/environment';
import * as L from 'leaflet';
import 'leaflet.markercluster';
import * as d3 from 'd3';
import * as topojson from 'topojson';
import 'leaflet-easybutton';

export const MY_FORMATS = {
  parse: {
    dateInput: "LL",
  },
  display: {
    dateInput: "LL",
    monthYearLabel: "MMM YYYY",
    dateA11yLabel: "LL",
    monthYearA11yLabel: "MMMM YYYY",
  },
};

// ✅ Mock Services
const mockUserDetailService = {
  getUserDetail: jest.fn(() => ({ user_id: '123', user_role: '1', unit_id: '2000' })),
  getLocation: jest.fn(() => ({ states: [1], districts: [1] })),
};

const mockCoreService = {
  post: jest.fn().mockResolvedValue({ status: 1 }),
  terminateAPICalls: jest.fn(),
  clone: jest.fn((obj: any) => JSON.parse(JSON.stringify(obj))),
};

const mockFilterService = {
  isDataFetched: true,
  fetchedLookupData: { subscribe: jest.fn() },
  clients: [{ UNIT_ID: '2000', UNIT_NAME: 'Client1' }],
  states: [{ state_id: 1, state_name: 'State1' }],
  districts: [{ district_id: 1, district_name: 'District1', state_id: 1 }],
  getClientWiseLocation: jest.fn().mockResolvedValue([ [1], [1] ]), // clientStates, clientDistricts
};

const mockFeatureToggleService = {
  getContext: jest.fn(() => 'saksham'),
};

jest.mock('../../environments/environment', () => ({
  environment: {
    projectConfigs: {
      munichre: { assetsFolder: '/assets/munichre' },
      saksham: { assetsFolder: '/assets/saksham' },
    }
  }
}));

describe('ManpowerattendanceComponent', () => {
  let component: ManpowerattendanceComponent;
  let fixture: ComponentFixture<ManpowerattendanceComponent>;
  let coreService: any;
  let filterService: any;
  let userService: any;
  let featureToggle: any;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        MultiSelectModule,
        NgbModule,
      ],
      declarations: [ManpowerattendanceComponent],
      providers: [
        { provide: UserDetailService, useValue: mockUserDetailService },
        { provide: CoreService, useValue: mockCoreService },
        { provide: FilterService, useValue: mockFilterService },
        { provide: FeatureToggleService, useValue: mockFeatureToggleService },
        { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ManpowerattendanceComponent);
    component = fixture.componentInstance;
    coreService = TestBed.inject(CoreService);
    filterService = TestBed.inject(FilterService);
    userService = TestBed.inject(UserDetailService);
    featureToggle = TestBed.inject(FeatureToggleService);

    // Mock L methods to avoid DOM errors
    jest.spyOn(L, 'map').mockImplementation((id, options) => ({
      setView: jest.fn(),
      addLayer: jest.fn(),
      fitBounds: jest.fn(),
      eachLayer: jest.fn(),
    } as any));

    jest.spyOn(L, 'easyButton').mockReturnValue({
      addTo: jest.fn(),
    } as any);

    (L as any).d3SvgOverlay = jest.fn((fn, opts) => ({ addTo: jest.fn() }));

    jest.spyOn(L.control, 'groupedLayers').mockReturnValue({
      addTo: jest.fn(),
    } as any);

    global.fetch = jest.fn().mockResolvedValue({ json: jest.fn().mockResolvedValue({}) });

    fixture.detectChanges(); // To initialize the component
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  describe('constructor', () => {
    it('should set projectContext and assetsFolder from featureToggle', () => {
      featureToggle.getContext.mockReturnValueOnce('saksham');
      const comp = new ManpowerattendanceComponent(coreService as any, filterService as any, userService as any, featureToggle as any);
      expect(comp.projectContext).toBe('saksham');
      expect(comp.assetsFolder).toBe('/assets/saksham');
    });
  });

  describe('ngOnInit', () => {
    it('should set userDetail from userService', () => {
      component.ngOnInit();
      expect(component.userDetail).toEqual({ user_id: '123', user_role: '1', unit_id: '2000' });
    });

    it('should set selectedClient if assetsFolder is munichre', () => {
      featureToggle.getContext.mockReturnValueOnce('munichre');
      component.assetsFolder = '/assets/munichre';
      component.ngOnInit();
      expect(component.selectedClient).toEqual([{ UNIT_ID: '2000' }]);
    });

    it('should call initData', () => {
      const initDataSpy = jest.spyOn(component, 'initData');
      component.ngOnInit();
      expect(initDataSpy).toHaveBeenCalled();
    });
  });

  describe('initData', () => {
    it('should set selectedClient and call onClientSelect and setInputData if isDataFetched', () => {
      filterService.isDataFetched = true;
      component.userDetail = { unit_id: '2000' };
      const onClientSelectSpy = jest.spyOn(component, 'onClientSelect');
      const setInputDataSpy = jest.spyOn(component, 'setInputData');
      component.initData();
      expect(onClientSelectSpy).toHaveBeenCalledWith([{ UNIT_ID: '2000' }]);
      expect(setInputDataSpy).toHaveBeenCalled();
    });
  });

  describe('ngAfterViewInit', () => {
    it('should set surveyColors and call initMap', () => {
      const initMapSpy = jest.spyOn(component, 'initMap');
      component.ngAfterViewInit();
      expect(component.surveyColors.totalSurvey).toBe('#11f0cb');
      expect(initMapSpy).toHaveBeenCalled();
    });
  });

  describe('clearData', () => {
    it('should be empty', () => {
      expect(component.clearData()).toBeUndefined();
    });
  });

  describe('initMap', () => {
    let tileLayerSpy: jest.SpyInstance;
    let mapSpy: jest.SpyInstance;
    let easyButtonSpy: jest.SpyInstance;
    let groupedLayersSpy: jest.SpyInstance;

    beforeEach(() => {
      tileLayerSpy = jest.spyOn(L, 'tileLayer').mockReturnValue({} as any);
      mapSpy = jest.spyOn(L, 'map').mockReturnValue({
        setView: jest.fn(),
        addLayer: jest.fn(),
        fitBounds: jest.fn(),
        eachLayer: jest.fn(),
      } as any);
      easyButtonSpy = jest.spyOn(L, 'easyButton').mockReturnValue({
        addTo: jest.fn(),
      } as any);
      groupedLayersSpy = jest.spyOn(L.control, 'groupedLayers').mockReturnValue({
        addTo: jest.fn(),
      } as any);
    });

    it('should initialize Leaflet map', () => {
      component.initMap();
      expect(mapSpy).toHaveBeenCalledWith('mapk', expect.any(Object));
      expect((component as any).map.setView).toHaveBeenCalledWith([20.5937, 78.9629], 4);
    });

    it('should call generateBoundries', () => {
      const generateBoundriesSpy = jest.spyOn(component, 'generateBoundries');
      component.initMap();
      expect(generateBoundriesSpy).toHaveBeenCalled();
    });
  });

  describe('generateBoundries', () => {
    let jsonSpy: jest.SpyInstance;
    let featureSpy: jest.SpyInstance;
    let markerClusterGroupSpy: jest.SpyInstance;
    let geoJSONSpy: jest.SpyInstance;

    beforeEach(() => {
      jsonSpy = jest.spyOn(d3, 'json').mockResolvedValue({ objects: { collection: {} } });
      featureSpy = jest.spyOn(topojson, 'feature').mockReturnValue({ type: 'FeatureCollection', features: [] } as any);
      markerClusterGroupSpy = jest.spyOn(L, 'markerClusterGroup').mockReturnValue({ addLayer: jest.fn() } as any);
      geoJSONSpy = jest.spyOn(L, 'geoJSON').mockReturnValue({ getBounds: jest.fn() } as any);
    });

    it('should load topojson and add to map', async () => {
      await component.generateBoundries();
      expect(jsonSpy).toHaveBeenCalledWith(expect.stringContaining('/maps/india.topojson'));
      expect((component as any).map.addLayer).toHaveBeenCalled();
      expect((component as any).map.fitBounds).toHaveBeenCalled();
    });

    it('should handle json error', fakeAsync(() => {
      jsonSpy.mockRejectedValue(new Error('error'));
      component.generateBoundries();
      tick();
      // No crash
    }));
  });

  describe('setInputData', () => {
    it('should set data from filter', () => {
      const setDefaultLocationSpy = jest.spyOn(component, 'setDefaultLocation');
      const applyFilterSpy = jest.spyOn(component, 'applyFilter');
      component.setInputData();
      expect(component.clientData).toEqual(filterService.clients);
      expect(component.statesData).toEqual(filterService.states);
      expect(component.districts).toEqual(filterService.districts);
      expect(setDefaultLocationSpy).toHaveBeenCalled();
      expect(applyFilterSpy).toHaveBeenCalled();
    });
  });

  describe('setDefaultLocation', () => {
    it('should set selectedState and call onStateSelect', () => {
      const onStateSelectSpy = jest.spyOn(component, 'onStateSelect');
      const onDistSelectSpy = jest.spyOn(component, 'onDistSelect');
      component.statesData = [{ state_id: 1 }];
      component.districts = [{ district_id: 1 }];
      component.setDefaultLocation();
      expect(component.selectedState).toEqual([{ state_id: 1 }]);
      expect(onStateSelectSpy).toHaveBeenCalledWith(expect.any(Array));
      expect(component.selectedDist).toEqual([{ district_id: 1 }]);
      expect(onDistSelectSpy).toHaveBeenCalledWith(expect.any(Array));
    });

    it('should not set if no location.states', () => {
      userService.getLocation.mockReturnValueOnce({});
      const onStateSelectSpy = jest.spyOn(component, 'onStateSelect');
      component.setDefaultLocation();
      expect(onStateSelectSpy).not.toHaveBeenCalled();
    });

    it('should not set districts if no location.districts', () => {
      userService.getLocation.mockReturnValueOnce({ states: [1] });
      const onDistSelectSpy = jest.spyOn(component, 'onDistSelect');
      component.setDefaultLocation();
      expect(onDistSelectSpy).not.toHaveBeenCalled();
    });
  });

  describe('onClientSelect', () => {
    it('should reset if no event', fakeAsync(() => {
      component.onClientSelect([]);
      tick();
      expect(component.clientStates).toEqual([]);
      expect(component.clientDistricts).toEqual([]);
    }));
  });

  describe('onStateSelect', () => {
    it('should set districtData', () => {
      const event = [{ state_id: 1, state_name: 'State1' }];
      component.onStateSelect(event);
      expect(component.districtData[0].items).toEqual(expect.arrayContaining([expect.objectContaining({ district_id: 1 })]));
      expect(component.selectedDist).toEqual([]);
    });

    it('should reset if no event', () => {
      component.onStateSelect([]);
      expect(component.districtData).toEqual([]);
      expect(component.selectedDist).toEqual([]);
    });
  });

  describe('onDistSelect', () => {
    it('should be empty', () => {
      expect(component.onDistSelect([])).toBeUndefined();
    });
  });

  describe('applyFilter', () => {
    it('should prepare request and call post', async () => {
      component.selectedState = [{ state_id: 1 }];
      component.selectedDist = [{ district_id: 1 }];
      component.selectedClient = [{ UNIT_ID: '2000' }];
      component.selectedFromDate = { startDate: moment(), endDate: moment() };
      const mockResponse = { status: 1, total: { users: 10 } };
      coreService.post.mockResolvedValueOnce(mockResponse);
      const getStateDataSpy = jest.spyOn(component, 'getStateData');
      await component.applyFilter();
      expect((component as any).map.eachLayer).toHaveBeenCalled();
      expect(component.label).toEqual(mockResponse.total);
      expect(getStateDataSpy).toHaveBeenCalledWith(expect.any(Object));
    });
    
    it('should set states/districts from data if no selected', fakeAsync(() => {
      component.selectedState = [];
      component.selectedDist = [];
      component.statesData = [{ state_id: 1 }];
      component.districts = [{ district_id: 1 }];
      component.selectedClient = [{ UNIT_ID: '2000' }];
      component.selectedFromDate = { startDate: moment(), endDate: moment() };
      coreService.post.mockResolvedValueOnce({ status: 1 });
      component.applyFilter();
      tick();
    }));

    it('should handle post error', fakeAsync(() => {
      coreService.post.mockRejectedValueOnce(new Error('error'));
      component.applyFilter();
      tick();
      // console.error called
    }));
  });

  describe('getStateData', () => {
    it('should be empty', () => {
      expect(component.getStateData({})).toBeUndefined();
    });
  });

  describe('countryBubbleMap', () => {
    it('should update countryGeoJson properties', () => {
      component.countryGeoJson = { features: [{ properties: { stateId: 1 } }] };
      component.stateCountData = [{ state_id: 1, no_of_cce: 5, no_of_chm: 10, no_of_cls: 15, totalSurvey: 30 }];
      (L as any).d3SvgOverlay = jest.fn((fn, opts) => ({ addTo: jest.fn() }));
      component.countryBubbleMap();
      expect(component.countryGeoJson.features[0].properties.totalSurvey).toBe(30);
      expect((component as any).map.setView).toHaveBeenCalledWith([20.5937, 78.9629], 4);
    });

    it('should handle no features or stateCountData', () => {
      component.countryGeoJson = { features: [] };
      component.stateCountData = [];
      (L as any).d3SvgOverlay = jest.fn((fn, opts) => ({ addTo: jest.fn() }));
      component.countryBubbleMap();
      // No crash
    });

    it('should not update if no stateId match', () => {
      component.countryGeoJson = { features: [{ properties: { stateId: 2 } }] };
      component.stateCountData = [{ state_id: 1 }];
      component.countryBubbleMap();
      expect(component.countryGeoJson.features[0].properties.no_of_cce).toBeNull();
    });
  });

  describe('shwToolTip', () => {
    it('should return tooltip HTML', () => {
      const data = { state: 'State1', no_of_chm: 10, no_of_cls: 15, no_of_cce: 5 };
      const result = component.shwToolTip(data);
      expect(result).toContain('State1');
      expect(result).toContain('10');
      expect(result).toContain('15');
      expect(result).toContain('5');
    });

    it('should use district if isDist true', () => {
      const data = { district: 'Dist1', no_of_chm: 10, no_of_cls: 15, no_of_cce: 5 };
      const result = component.shwToolTip(data, true);
      expect(result).toContain('Dist1');
    });
  });

  describe('ngOnDestroy', () => {
    it('should call terminateAPICalls', () => {
      component.ngOnDestroy();
      expect(coreService.terminateAPICalls).toHaveBeenCalled();
    });
  });
});