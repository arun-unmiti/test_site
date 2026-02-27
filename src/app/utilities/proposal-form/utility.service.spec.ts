import { TestBed } from '@angular/core/testing';
import { UtilityService } from './utility.service';
import { CoreService } from '../core.service';
import { FeatureToggleService } from '../../shared/services/feature-toggle.service';

class MockCoreService {}
class MockFeatureToggleService {
  getConfig = jest.fn(() => ({ BASEKMLPREFIX: 'prefix/', BASEKMLSUFFIX: '.kml' }));
}

describe('UtilityService', () => {
  let service: UtilityService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        UtilityService,
        { provide: CoreService, useClass: MockCoreService },
        { provide: FeatureToggleService, useClass: MockFeatureToggleService },
      ],
    });

    service = TestBed.inject(UtilityService);
  });

  it('should create the component', () => {
    expect(service).toBeTruthy();
  });

  describe('generateFile', () => {
    it('should create and click download link', () => {
      jest.spyOn(document, 'createElement').mockReturnValue({
        setAttribute: jest.fn(),
        style: { visibility: 'hidden' },
        click: jest.fn(),
      } as any);
      jest.spyOn(document.body, 'appendChild').mockImplementation();
      jest.spyOn(document.body, 'removeChild').mockImplementation();
      service.generateFile('url', 'file.txt');
      expect(document.createElement).toHaveBeenCalledWith('a');
    });
  });

  describe('downloadKml', () => {
    it('should download from URL when no coordinates', () => {
      const generateFileSpy = jest.spyOn(service, 'generateFile');
      const data = { file_name: 'test.kml' };
      service.downloadKml(data);
      expect(generateFileSpy).toHaveBeenCalledWith('prefix/test.kml.kml', 'test.kml');
    });
  });

  describe('updatePageReport', () => {
    it('should update page report text', () => {
      const component: any = { currentpage: 2, recordsPerPage: 10, totalRecords: 25 };
      service.updatePageReport(component);
      expect(component.page_text).toBe('Page 2 of 3; Records 11 to 20 of 25');
    });
  });

  describe('invalidUpdatePageReport', () => {
    it('should update invalid page report', () => {
      const component: any = { invalidCurrentpage: 1, invalidRecordsPerPage: 5, invalidTotalRecords: 8 };
      service.invalidUpdatePageReport(component);
      expect(component.invalid_page_text).toBe('Page 1 of 2; Records 1 to 5 of 8');
    });
  });
});