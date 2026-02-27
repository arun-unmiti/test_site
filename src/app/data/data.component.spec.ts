import { ComponentFixture, TestBed, fakeAsync, flush } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';

import { DataComponent } from './data.component';
import { CoreService } from '../utilities/core.service';
import { FeatureToggleService } from '../shared/services/feature-toggle.service';
import { environment, ProjectContext } from '../../environments/environment';
import { InsightsService } from "../utilities/insights.service";

// Mock environment
jest.mock('../../environments/environment', () => ({
  environment: {
    projectConfigs: {
      testContext: { assetsFolder: '/assets/test/' }
    }
  }
}));

// Mock services
class MockCoreService {
  post = jest.fn().mockResolvedValue({ status: 1, surveys: [] });
}

class MockFeatureToggleService {
  getContext = jest.fn().mockReturnValue('testContext' as ProjectContext);
}

const mockInsightsService = {
  logException: jest.fn(),
};

describe('DataComponent', () => {
  let component: DataComponent;
  let fixture: ComponentFixture<DataComponent>;
  let coreService: MockCoreService;
  let featureToggleService: MockFeatureToggleService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgbNavModule],
      declarations: [DataComponent],
      providers: [
        { provide: CoreService, useClass: MockCoreService },
        { provide: FeatureToggleService, useClass: MockFeatureToggleService },
        { provide: InsightsService, useValue: mockInsightsService }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(DataComponent);
    component = fixture.componentInstance;
    coreService = TestBed.inject(CoreService) as unknown as MockCoreService;
    featureToggleService = TestBed.inject(FeatureToggleService) as unknown as MockFeatureToggleService;
    mockInsightsService.logException.mockReset();
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
  });

  describe('ngOnInit', () => {
    it('should call getSurveryData', () => {
      const getSurveryDataSpy = jest.spyOn(component, 'getSurveryData');
      component.ngOnInit();
      expect(getSurveryDataSpy).toHaveBeenCalled();
    });
  });
});