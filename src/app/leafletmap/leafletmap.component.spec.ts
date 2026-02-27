import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';

import { LeafletmapComponent } from './leafletmap.component';
import { CoreService } from '../utilities/core.service';
import { FeatureToggleService } from '../shared/services/feature-toggle.service';
import * as L from 'leaflet';
import * as topojson from 'topojson';
import * as d3 from 'd3';

// Mock environment
jest.mock('../../environments/environment', () => ({
  environment: {
    projectConfigs: {
      munichre: { assetsFolder: 'assets/munichre' }
    }
  }
}));

// Mock Leaflet easyButton (the component calls L.easyButton)
(L as any).easyButton = jest.fn(() => ({
  addTo: jest.fn(),
  state: jest.fn(),
}));

// Mock Leaflet map and related methods
const mockMap = {
  setView: jest.fn(),
  addLayer: jest.fn(),
  removeLayer: jest.fn(),
  remove: jest.fn(),
  eachLayer: jest.fn(),
  fitBounds: jest.fn(),
  on: jest.fn(),
  addControl: jest.fn(),
};

// Mock marker object with chainable methods
const mockMarker = {
  addTo: jest.fn().mockReturnThis(),
  bindPopup: jest.fn().mockReturnThis(),
  addEventListener: jest.fn().mockReturnThis(),
  remove: jest.fn(),
};

// Mock heat layer with chainable methods
const mockHeatLayer = {
  addTo: jest.fn().mockReturnThis(),
  addLatLng: jest.fn().mockReturnThis(),
};

// Mock polyline with chainable methods
const mockPolyline = {
  setStyle: jest.fn().mockReturnThis(),
  addTo: jest.fn().mockReturnThis(),
  remove: jest.fn(),
};

// Mock kml layer with chainable methods
const mockKmlLayer = {
  addTo: jest.fn().mockReturnThis(),
  on: jest.fn().mockReturnThis(),
  bringToFront: jest.fn().mockReturnThis(),
};

(L as any).map = jest.fn(() => mockMap);
(L as any).tileLayer = jest.fn(() => ({ addTo: jest.fn() }));
(L as any).control = {
  groupedLayers: jest.fn(() => ({ addTo: jest.fn() })),
};
(L as any).markerClusterGroup = jest.fn(() => ({
  addLayer: jest.fn().mockReturnThis(),
  clearLayers: jest.fn(),
  bringToBack: jest.fn(),
}));
(L as any).heatLayer = jest.fn(() => mockHeatLayer);
(L as any).marker = jest.fn(() => mockMarker);
(L as any).polyline = jest.fn(() => mockPolyline);
(L as any).geoJSON = jest.fn(() => ({
  addTo: jest.fn(),
  getBounds: jest.fn(() => ({})), // Mock bounds
}));
(L as any).FeatureGroup = jest.fn(() => ({
  addLayer: jest.fn(),
  getLayerId: jest.fn(() => 1),
}));
(L as any).Control = {
  Draw: jest.fn(() => ({})),
};
(L as any).Draw = {
  Event: {
    CREATED: 'draw:created',
  },
};
(L as any).Icon = {
  extend: jest.fn(() => class {}),
};
(L as any).DivIcon = jest.fn(() => ({}));
(L as any).Point = jest.fn(() => ({}));

// Mock omnivore
(global as any).omnivore = {
  kml: jest.fn(() => mockKmlLayer),
};
(global as any).omnivore.kml.parse = jest.fn(() => mockKmlLayer);

// Mock tokml
(global as any).tokml = jest.fn(() => 'mock kml content');

// Mock d3.json
(d3 as any).json = jest.fn(() => Promise.resolve({ objects: { collection: {} } }));

// Mock topojson.feature
(topojson as any).feature = jest.fn(() => ({ features: [] }));

// Mock services
const mockCoreService = {
  fetchAzureBlob: jest.fn(() => Promise.resolve({
    text: jest.fn(() => Promise.resolve('mock text'))
  })),
  toast: jest.fn(),
};

const mockFeatureToggleService = {
  getContext: jest.fn(() => 'munichre'),
  getConfig: jest.fn(() => ({
    BASEKMLPREFIX: 'https://example.com/kml/',
    BASEKMLSUFFIX: '.kml',
  })),
};

describe('LeafletmapComponent', () => {
  let component: LeafletmapComponent;
  let fixture: ComponentFixture<LeafletmapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LeafletmapComponent],
      imports: [HttpClientTestingModule],
      providers: [
        { provide: CoreService, useValue: mockCoreService },
        { provide: FeatureToggleService, useValue: mockFeatureToggleService },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(LeafletmapComponent);
    component = fixture.componentInstance;
    component.mapContent = { nativeElement: { id: 'test-map-id' } } as any;
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  describe('constructor', () => {
    it('should initialize projectContext and assetsFolder', () => {
      expect(mockFeatureToggleService.getContext).toHaveBeenCalled();
      expect(component.projectContext).toBe('munichre');
      expect(component.assetsFolder).toBe('assets/munichre');
      expect(component.topoJsonURL).toBe('assets/munichre/maps/');
    });
  });

  describe('ngOnInit', () => {
    it('should call initMap after timeout', fakeAsync(() => {
      const initMapSpy = jest.spyOn(component, 'initMap');
      component.ngOnInit();
      tick(1000);
      expect(initMapSpy).toHaveBeenCalled();
      tick(500); // Clear the timer in initMap
    }));
  });

  describe('initMap', () => {
    beforeEach(() => {
      component.map = null; // Ensure map is null before init
    });

    it('should initialize map with default layers and controls', fakeAsync(() => {
      const generateBoundriesSpy = jest.spyOn(component, 'generateBoundries');
      component.initMap();
      expect(L.map).toHaveBeenCalledWith('test-map-id', expect.objectContaining({
        center: [20.5937, 78.9629],
        zoom: 4,
      }));
      expect((L as any).easyButton).toHaveBeenCalled();
      const button = (L as any).easyButton.mock.results[0].value;
      expect(button.addTo).toHaveBeenCalled();
      expect((L as any).control.groupedLayers).toHaveBeenCalled();
      expect(generateBoundriesSpy).toHaveBeenCalled();
      tick(500); // For setTimeout in initMap
      expect(mockMap.setView).toHaveBeenCalledWith([20.5937, 78.9629], 4);
    }));

    it('should handle points map type', fakeAsync(() => {
      component.mapType = 'points';
      component.mapData = [{ lat: 10, lng: 20, address: 'addr', data_id: '1', location_id: '2' }];
      component.initMap();
      expect((L as any).markerClusterGroup).toHaveBeenCalled();
      expect((L as any).marker).toHaveBeenCalled();
      expect(mockMap.addLayer).toHaveBeenCalled();
      tick(500);
    }));

    it('should handle heat map type', fakeAsync(() => {
      component.mapType = 'heat';
      component.mapData = [{ lat: 10, lng: 20, loss_percent: 0.5 }];
      component.initMap();
      expect((L as any).heatLayer).toHaveBeenCalled();
      expect(mockMap.addLayer).toHaveBeenCalled();
      tick(500);
    }));

    it('should handle pipeline map type', fakeAsync(() => {
      component.mapType = 'pipeline';
      component.mapData = [{ lat: 10, lng: 20, user_id: '1', date_time: 'now', status: 'ok', dayIndex: 1 }];
      component.initMap();
      expect((L as any).marker).toHaveBeenCalled();
      expect(mockMarker.bindPopup).toHaveBeenCalled();
      expect((L as any).polyline).toHaveBeenCalled();
      tick(500);
    }));

    it('should handle kml map type', fakeAsync(() => {
      component.mapType = 'kml';
      component.mapData = [{ file_name: 'test.kml' }];
      component.initMap();
      tick();
      expect(mockCoreService.fetchAzureBlob).toHaveBeenCalled();
      expect((global as any).omnivore.kml.parse).toHaveBeenCalled();
      tick(500);
    }));

    it('should handle geoJson map type', fakeAsync(() => {
      component.mapType = 'geoJson';
      component.mapData = [{ type: 'Feature', properties: {}, geometry: {} }];
      component.initMap();
      expect((L as any).geoJSON).toHaveBeenCalled();
      tick(500);
    }));

    it('should enable editable map if flag is true', fakeAsync(() => {
      component.editableMap = true;
      component.initMap();
      expect((L as any).FeatureGroup).toHaveBeenCalled();
      expect((L as any).Control.Draw).toHaveBeenCalled();
      expect(mockMap.addControl).toHaveBeenCalled();
      tick(500);
    }));
  });

  describe('resetMap', () => {
    it('should remove existing map and reinitialize with new data', fakeAsync(() => {
      component.map = mockMap;
      const initMapSpy = jest.spyOn(component, 'initMap');
      const newData = [{ lat: 30, lng: 40 }];
      component.resetMap(newData);
      expect(mockMap.remove).toHaveBeenCalled();
      expect(component.mapData).toEqual(newData);
      expect(initMapSpy).toHaveBeenCalled();
      tick(500);
    }));
  });

  describe('generateBoundries', () => {
    beforeEach(() => {
      component.map = mockMap;
    });

    it('should load topojson and add boundaries', fakeAsync(() => {
      (d3 as any).json.mockResolvedValueOnce({ objects: { collection: {} } });
      (topojson as any).feature.mockReturnValueOnce({ features: [] });
      component.generateBoundries();
      tick();
      expect(d3.json).toHaveBeenCalledWith(expect.stringContaining('india.topojson'));
      expect((L as any).markerClusterGroup).toHaveBeenCalled();
      expect((L as any).geoJSON).toHaveBeenCalled();
      expect(mockMap.fitBounds).toHaveBeenCalled();
    }));
  });

  describe('generateKML', () => {
    beforeEach(() => {
      component.map = mockMap;
    });

    it('should generate geoJson from draw layers', () => {
      mockMap.eachLayer.mockImplementation((cb) => cb({ _leaflet_id: 1, toGeoJSON: jest.fn(() => ({ type: 'FeatureCollection', features: [{ properties: {} }] })) }));
      component.drawLayerId = [1];
      component.drawLayerMap.set(1, 'kml1');
      const result = component.generateKML();
      expect(result.geoJson.features.length).toBe(1);
      expect(result.tokml).toBeDefined();
    });
  });

  describe('downloadTextFile', () => {
    it('should create and download a text file', () => {
      const createElementSpy = jest.spyOn(document, 'createElement').mockReturnValue({
        setAttribute: jest.fn(),
        style: { visibility: '' },
        click: jest.fn(),
      } as any);
      const appendChildSpy = jest.spyOn(document.body, 'appendChild').mockImplementation((node) => node);
      const removeChildSpy = jest.spyOn(document.body, 'removeChild').mockImplementation((node) => node);
      component.downloadTextFile('test', 'content');
      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(appendChildSpy).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalled();
    });
  });
});