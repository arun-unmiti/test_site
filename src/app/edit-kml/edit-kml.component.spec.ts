import { ComponentFixture, TestBed, fakeAsync, flush } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';

import { EditKmlComponent } from './edit-kml.component';
import { CoreService } from '../utilities/core.service';
import { GeojsonMapperService } from '../utilities/geojson-mapper.service';
import { FeatureToggleService } from '../shared/services/feature-toggle.service';
import { environment, ProjectContext } from '../../environments/environment';
import { InsightsService } from '../utilities/insights.service';

// Mock environment
jest.mock('../../environments/environment', () => ({
  environment: {
    projectConfigs: {
      testContext: { assetsFolder: '/assets/test/' },
      munichre: { assetsFolder: '/assets/munichre/' },
      saksham: { assetsFolder: '/assets/saksham/' }
    }
  }
}));

// Mock services
class MockCoreService {
  data_post = jest.fn().mockResolvedValue({ status: 1 });
  toast = jest.fn();
  post = jest.fn().mockResolvedValue({ status: 1 });
}

class MockGeojsonMapperService {
  stringToGeojson = jest.fn().mockReturnValue([]); // Adjusted to return array
  coordinateToString = jest.fn().mockReturnValue('');
  computeArea = jest.fn().mockReturnValue(0);
}

class MockFeatureToggleService {
  getContext = jest.fn().mockReturnValue('testContext' as ProjectContext);
  getConfig = jest.fn().mockReturnValue({ BASEKMLPREFIX: 'mock_prefix', BASEKMLSUFFIX: 'mock_suffix' });
}

class MockHttpClient {
  get = jest.fn().mockReturnValue(of('kml content'));
}

class MockInsightsService {
  logException = jest.fn();
}

describe('EditKmlComponent', () => {
  let component: EditKmlComponent;
  let fixture: ComponentFixture<EditKmlComponent>;
  let coreService: MockCoreService;
  let geoMapper: MockGeojsonMapperService;
  let featureToggleService: MockFeatureToggleService;
  let httpClient: MockHttpClient;
  let insightsService: MockInsightsService;

  // Mock DOMParser
  global.DOMParser = jest.fn().mockImplementation(() => ({
    parseFromString: jest.fn().mockReturnValue({
      getElementsByTagName: jest.fn().mockImplementation((tag) => {
        if (tag === 'outerBoundaryIs') return { length: 1 };
        if (tag === 'innerBoundaryIs') return { length: 1, 0: { remove: jest.fn() } };
        return { length: 0 };
      }),
      documentElement: {}
    })
  }));

  // Mock toGeoJSON
  (global as any).toGeoJSON = {
    kml: jest.fn().mockReturnValue({ features: [] }),
  };

  // Mock fetch
  global.fetch = jest.fn().mockResolvedValue({
    text: jest.fn().mockResolvedValue('<kml></kml>'),
  }) as jest.Mock;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [EditKmlComponent],
      providers: [
        { provide: CoreService, useClass: MockCoreService },
        { provide: GeojsonMapperService, useClass: MockGeojsonMapperService },
        { provide: FeatureToggleService, useClass: MockFeatureToggleService },
        { provide: HttpClient, useClass: MockHttpClient },
        { provide: InsightsService, useClass: MockInsightsService }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).overrideComponent(EditKmlComponent, {
      set: { template: '<div></div>' } // Override to avoid template errors
    }).compileComponents();

    fixture = TestBed.createComponent(EditKmlComponent);
    component = fixture.componentInstance;
    coreService = TestBed.inject(CoreService) as unknown as MockCoreService;
    geoMapper = TestBed.inject(GeojsonMapperService) as unknown as MockGeojsonMapperService;
    featureToggleService = TestBed.inject(FeatureToggleService) as unknown as MockFeatureToggleService;
    httpClient = TestBed.inject(HttpClient) as unknown as MockHttpClient;
    insightsService = TestBed.inject(InsightsService) as unknown as MockInsightsService;
    insightsService.logException.mockReset();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  describe('constructor', () => {
    it('should set projectContext and assetsFolder', () => {
      expect(featureToggleService.getContext).toHaveBeenCalled();
      expect(component.projectContext).toBe('testContext');
      expect(component.assetsFolder).toBe('/assets/test/');
    });

    it('should set assetsFolder for munichre', () => {
      featureToggleService.getContext.mockReturnValue('munichre');
      const comp = new EditKmlComponent(coreService as any, httpClient as any, geoMapper as any, featureToggleService as any, insightsService as any);
      expect(comp.assetsFolder).toBe('/assets/munichre/');
    });

    it('should set assetsFolder for saksham', () => {
      featureToggleService.getContext.mockReturnValue('saksham');
      const comp = new EditKmlComponent(coreService as any, httpClient as any, geoMapper as any, featureToggleService as any, insightsService as any);
      expect(comp.assetsFolder).toBe('/assets/saksham/');
    });
  });

  describe('ngOnInit', () => {
    it('should set kmlUrl and kmlUrlSuffix from config', () => {
      fixture.detectChanges();
      expect(component.kmlUrl).toBe('mock_prefix');
      expect(component.kmlUrlSuffix).toBe('mock_suffix');
    });

    it('should set properties and call getKMLData if data and survey_id present', () => {
      component.survey_id = 1;
      component.data = { data_id: 1, lat: '20', lng: '78' };
      const getKMLDataSpy = jest.spyOn(component, 'getKMLData');
      fixture.detectChanges();
      expect(component.data_id).toBe(1);
      expect(component.lat).toBe(20);
      expect(component.lng).toBe(78);
      expect(getKMLDataSpy).toHaveBeenCalled();
    });

    it('should not call getKMLData if no data or survey_id', () => {
      const getKMLDataSpy = jest.spyOn(component, 'getKMLData');
      fixture.detectChanges();
      expect(getKMLDataSpy).not.toHaveBeenCalled();
    });
  });

  describe('onAction', () => {
    beforeEach(() => {
      component.leafletMap = { map: { _layers: {} }, drawLayerId: [1] };
    });

    it('should warn if no features drawn', () => {
      component.onAction('update-kml');
      expect(coreService.toast).toHaveBeenCalledWith('warn', 'Please draw KML area');
    });

    it('should warn if multiple features', () => {
      component.leafletMap.map._layers = { 1: { _leaflet_id: 1, toGeoJSON: jest.fn().mockReturnValue({ features: [{}, {}] }) } };
      component.onAction('update-kml');
      expect(coreService.toast).toHaveBeenCalledWith('warn', 'Invalid KML area');
    });

    it('should emit update-kml with data', () => {
      const geoJson = { features: [{ geometry: { coordinates: [[[ [1,2] ]]] } }] };
      component.leafletMap.map._layers = { 1: { _leaflet_id: 1, toGeoJSON: jest.fn().mockReturnValue(geoJson) } };
      geoMapper.computeArea.mockReturnValue(100);
      component.geoJsonData = [{ properties: {} }];
      component.data_id = 1;
      component.survey_id = 1;
      component.data = { case_ID: 'test' };
      const emitSpy = jest.spyOn(component.action, 'emit');
      component.onAction('update-kml');
      expect(emitSpy).toHaveBeenCalledWith(expect.objectContaining({ purpose: 'update-kml' }));
    });

    it('should emit cancel', () => {
      const emitSpy = jest.spyOn(component.action, 'emit');
      component.onAction('cancel');
      expect(emitSpy).toHaveBeenCalledWith({ purpose: 'cancel' });
    });

    it('should emit other purpose', () => {
      const emitSpy = jest.spyOn(component.action, 'emit');
      component.onAction('other');
      expect(emitSpy).toHaveBeenCalledWith({ purpose: 'other' });
    });

    it('should emit purpose if no leafletMap', () => {
      component.leafletMap = null;
      const emitSpy = jest.spyOn(component.action, 'emit');
      component.onAction('update-kml');
      expect(emitSpy).toHaveBeenCalledWith({ purpose: 'update-kml' });
    });

    it('should handle name ending with .kml', () => {
      const geoJson = { features: [{ geometry: { coordinates: [[[ [1,2] ]]] } }] };
      component.leafletMap.map._layers = { 1: { _leaflet_id: 1, toGeoJSON: jest.fn().mockReturnValue(geoJson) } };
      geoMapper.computeArea.mockReturnValue(100);
      component.geoJsonData = [{ properties: {} }];
      component.data_id = 1;
      component.survey_id = 1;
      component.data = { case_ID: 'test.kml' };
      const emitSpy = jest.spyOn(component.action, 'emit');
      component.onAction('update-kml');
      expect(emitSpy).toHaveBeenCalledWith(expect.objectContaining({ name: 'test' }));
    });

    it('should compute measured_area in Hectare', () => {
      const geoJson = { features: [{ geometry: { coordinates: [[[ [1,2] ]]] } }] };
      component.leafletMap.map._layers = { 1: { _leaflet_id: 1, toGeoJSON: jest.fn().mockReturnValue(geoJson) } };
      geoMapper.computeArea.mockReturnValue(8093);
      component.geoJsonData = [{ properties: {} }];
      component.data_id = 1;
      component.survey_id = 1;
      component.data = { case_ID: 'test' };
      const emitSpy = jest.spyOn(component.action, 'emit');
      component.onAction('update-kml');
      expect(emitSpy).toHaveBeenCalledWith(expect.objectContaining({ measured_area: '0.81 Hectare' }));
    });

    it('should use geoJsonData properties if present', () => {
      const geoJson = { features: [{ geometry: { coordinates: [[[ [1,2] ]]] } }] };
      component.leafletMap.map._layers = { 1: { _leaflet_id: 1, toGeoJSON: jest.fn().mockReturnValue(geoJson) } };
      geoMapper.computeArea.mockReturnValue(100);
      component.geoJsonData = [{ properties: { name: 'existing' } }];
      component.data_id = 1;
      component.survey_id = 1;
      component.data = { case_ID: 'test' };
      const emitSpy = jest.spyOn(component.action, 'emit');
      component.onAction('update-kml');
      expect(emitSpy).toHaveBeenCalled();
    });

    it('should handle no geoJsonData properties', () => {
      const geoJson = { features: [{ geometry: { coordinates: [[[ [1,2] ]]] } }] };
      component.leafletMap.map._layers = { 1: { _leaflet_id: 1, toGeoJSON: jest.fn().mockReturnValue(geoJson) } };
      geoMapper.computeArea.mockReturnValue(100);
      component.geoJsonData = null;
      component.data_id = 1;
      component.survey_id = 1;
      component.data = { case_ID: 'test' };
      const emitSpy = jest.spyOn(component.action, 'emit');
      component.onAction('update-kml');
      expect(emitSpy).toHaveBeenCalledWith(expect.objectContaining({ name: 'test' }));
    });
  });

  describe('getKMLData', () => {
    it('should set showMap if geoJsonData present', fakeAsync(() => {
      component.geoJsonData = [{ geometry: { coordinates: [[[ [1, [2,3]] ]]] }} ]; // Fixed syntax
      component.getKMLData();
      flush(); // Flush promise and timer
      expect(component.showMap).toBe(true);
    }));
    it('should set lat and lng from coordinates', () => {
      component.geoJsonData = [{ geometry: { coordinates: [[[10, 20]]] } }];
      component.getKMLData();
      expect(component.lat).toBe(20);
      expect(component.lng).toBe(10);
    });

    it('should not set lat lng if no valid coordinates', () => {
      component.geoJsonData = [{ geometry: { coordinates: [] } }];
      component.getKMLData();
      expect(component.lat).toBeUndefined();
      expect(component.lng).toBeUndefined();
    });

    it('should toast error if status !=1', async () => {
      component.geoJsonData = null;
      coreService.data_post.mockResolvedValue({ status: 0, message: 'error msg' });
      await component.getKMLData();
      expect(coreService.toast).toHaveBeenCalledWith('error', 'error msg');
    });
  });

  describe('getKMLFile', () => {
    it('should fetch and parse kml, remove innerBoundaryIs', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({ text: jest.fn().mockResolvedValue('<kml><outerBoundaryIs></outerBoundaryIs><innerBoundaryIs></innerBoundaryIs></kml>') });
      (global as any).toGeoJSON.kml.mockReturnValue({ features: [] });
      const res = await component.getKMLFile('url');
      expect(res).toEqual({ features: [] });
      expect((global.DOMParser as jest.Mock).mock.results[0].value.parseFromString).toHaveBeenCalled();
    });

    it('should not remove if no innerBoundaryIs', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({ text: jest.fn().mockResolvedValue('<kml></kml>') });
      (global as any).toGeoJSON.kml.mockReturnValue({ features: [] });
      const res = await component.getKMLFile('url');
      expect(res).toEqual({ features: [] });
    });

    it('should return {} on fetch error', async () => {
      const mockError = new Error('error');
      (global.fetch as jest.Mock).mockRejectedValue(mockError);
      const res = await component.getKMLFile('url');
      expect(res).toEqual({});
      expect(insightsService.logException).toHaveBeenCalledWith(mockError);
    });
  });

  describe('getBase64Data', () => {
    it('should return base64 from blob', async () => {
      const blob = new Blob(['test'], { type: 'text/plain' });
      const base64 = await component.getBase64Data(blob);
      expect(base64).toBe('data:text/plain;base64,dGVzdA==');
    });
  });

  describe('getLatLng', () => {
    it('should return lat lng string', () => {
      const geoJson = { features: [{ geometry: { coordinates: [[[ [1,2] ]]] } }] };
      expect(component.getLatLng(geoJson)).toBe('2,1');
    });

    it('should return empty string on error', () => {
      expect(component.getLatLng({})).toBe('');
    });

    it('should handle invalid coordinates', () => {
      const geoJson = { features: [{ geometry: { coordinates: [] } }] };
      expect(component.getLatLng(geoJson)).toBe('');
    });

    it('should handle no features', () => {
      const geoJson = { features: [] };
      expect(component.getLatLng(geoJson)).toBe('');
    });
  });
});