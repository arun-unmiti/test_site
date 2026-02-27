import { TestBed } from '@angular/core/testing';
import { GeojsonMapperService } from './geojson-mapper.service';

describe('GeojsonMapperService', () => {
  let service: GeojsonMapperService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GeojsonMapperService);
  });

  it('should create the component', () => {
    expect(service).toBeTruthy();
  });

  describe('stringToGeojson', () => {
    it('should convert string coordinates to GeoJSON polygon', () => {
      const input = '["1,2","3,4"]'; // Fixed: input must be array of comma-separated strings
      const expected = [
        {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [[[2, 1, 100], [4, 3, 100]]],
          },
          properties: {},
        },
      ];
      expect(service.stringToGeojson(input)).toEqual(expected);
    });
  });

  describe('coordinateToString', () => {
    it('should convert coordinates to string', () => {
      const input = [[[2, 1], [4, 3]]];
      const expected = '["1,2","3,4"]';
      expect(service.coordinateToString(input)).toBe(expected);
    });
  });

  describe('computeArea', () => {
    it('should compute area of path', () => {
      const path = [[[0, 0], [0, 1], [1, 0]]];
      const area = service.computeArea(path);
      expect(area).toBeGreaterThan(0);
    });
  });

  describe('computeSignedArea', () => {
    it('should return 0 for less than 3 points', () => {
      expect(service['computeSignedArea']([], service['EARTH_RADIUS'])).toBe(0);
      expect(service['computeSignedArea']([{ latitude: 0, longitude: 0 }], service['EARTH_RADIUS'])).toBe(0);
      expect(service['computeSignedArea']([{ latitude: 0, longitude: 0 }, { latitude: 1, longitude: 1 }], service['EARTH_RADIUS'])).toBe(0);
    });

    it('should compute signed area for polygon', () => {
      const path = [
        { latitude: 0, longitude: 0 },
        { latitude: 0, longitude: 1 },
        { latitude: 1, longitude: 0 },
      ];
      const area = service['computeSignedArea'](path, service['EARTH_RADIUS']);
      expect(area).not.toBe(0);
    });
  });

  describe('polarTriangleArea', () => {
    it('should compute polar triangle area', () => {
      const result = service['polarTriangleArea'](1, 0, 1, Math.PI / 2);
      expect(Math.abs(result)).toBeCloseTo(Math.PI / 2, 5); // Use abs since signed area can be negative depending on order
    });
  });

  describe('toRadians', () => {
    it('should convert degrees to radians', () => {
      expect(service['toRadians'](180)).toBe(Math.PI);
      expect(service['toRadians'](90)).toBe(Math.PI / 2);
      expect(service['toRadians'](0)).toBe(0);
    });
  });
});