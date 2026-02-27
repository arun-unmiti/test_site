import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { ApprovedDataComponent } from './approved-data.component';
import { CoreService } from '../utilities/core.service';
import { FeatureToggleService } from '../shared/services/feature-toggle.service';
import { environment, ProjectContext } from '../../environments/environment';
import { InsightsService } from '../utilities/insights.service';

// Mock environment to avoid accessing undefined projectConfigs
jest.mock('../../environments/environment', () => ({
  environment: {
    projectConfigs: {
      mockContext: { assetsFolder: '/assets/mock/' }
    }
  }
}));

// Mock FeatureToggleService with getContext()
class MockFeatureToggleService {
  getContext = jest.fn().mockReturnValue('mockContext' as ProjectContext);
}

describe('ApprovedDataComponent', () => {
  let component: ApprovedDataComponent;
  let fixture: ComponentFixture<ApprovedDataComponent>;
  let mockCoreService: jest.Mocked<CoreService>;
  let mockInsightsService: jest.Mocked<InsightsService>;

  beforeEach(async () => {
    mockCoreService = {
      post: jest.fn(),
    } as unknown as jest.Mocked<CoreService>;

    mockInsightsService = {
      logException: jest.fn(),
    } as unknown as jest.Mocked<InsightsService>;

    await TestBed.configureTestingModule({
      declarations: [ApprovedDataComponent],
      imports: [NgbModule],
      providers: [
        { provide: CoreService, useValue: mockCoreService },
        { provide: FeatureToggleService, useClass: MockFeatureToggleService },
        { provide: InsightsService, useValue: mockInsightsService },
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(ApprovedDataComponent);
    component = fixture.componentInstance;
    mockCoreService.post.mockResolvedValue({ status: false });
    fixture.detectChanges();
    await fixture.whenStable();
    mockInsightsService.logException.mockReset();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should set projectContext and assetsFolder in constructor', () => {
    expect(component.projectContext).toBe('mockContext');
    expect(component.assetsFolder).toBe('/assets/mock/');
  });

  describe('ngOnInit', () => {
    it('should call getSurveryData', () => {
      const spy = jest.spyOn(component, 'getSurveryData');

      component.ngOnInit();

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('getSurveryData', () => {
    it('should increase loading, call core.post with correct request, set surveys on success, and decrease loading', async () => {
      const mockResponse = { status: true, surveys: [{ id: 1, title: 'Survey1' }] };
      mockCoreService.post.mockResolvedValueOnce(mockResponse);

      component.getSurveryData();

      expect(component.loading).toBe(1);
      expect(mockCoreService.post).toHaveBeenCalledWith({ purpose: 'get_surveys' });

      await new Promise(resolve => setTimeout(resolve));

      expect(component.surveys).toEqual(mockResponse.surveys);
      expect(component.loading).toBe(0);
    });

    it('should set surveys to empty array if response.surveys is undefined', async () => {
      const mockResponse = { status: true };
      mockCoreService.post.mockResolvedValueOnce(mockResponse);

      component.getSurveryData();

      await new Promise(resolve => setTimeout(resolve));

      expect(component.surveys).toEqual([]);
      expect(component.loading).toBe(0);
    });

    it('should not set surveys if response.status is false', async () => {
      const mockResponse = { status: false };
      mockCoreService.post.mockResolvedValueOnce(mockResponse);

      component.getSurveryData();

      await new Promise(resolve => setTimeout(resolve));

      expect(component.surveys).toEqual([]);
      expect(component.loading).toBe(0);
    });

    it('should handle error, not set surveys, decrease loading, and log exception', async () => {
      mockCoreService.post.mockRejectedValue(new Error('API error'));

      component.getSurveryData();

      await new Promise(resolve => setTimeout(resolve));

      expect(component.surveys).toEqual([]);
      expect(component.loading).toBe(0);
      expect(mockInsightsService.logException).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('template rendering', () => {
    it('should show loader when loading is true', () => {
      component.loading = 1;
      fixture.detectChanges();

      const loaderElement = fixture.nativeElement.querySelector('.loader');
      expect(loaderElement).not.toBeNull();
    });

    it('should not show loader when loading is false', () => {
      component.loading = 0;
      fixture.detectChanges();

      const loaderElement = fixture.nativeElement.querySelector('.loader');
      expect(loaderElement).toBeNull();
    });

    it('should render title "Approved Data"', () => {
      fixture.detectChanges();

      const titleElement = fixture.nativeElement.querySelector('.title');
      expect(titleElement.textContent).toContain('Approved Data');
    });

    it('should render nav tabs based on surveys', async () => {
      const mockResponse = { status: true, surveys: [{ id: 1, title: 'Survey1' }, { id: 2, title: 'Survey2' }] };
      mockCoreService.post.mockResolvedValueOnce(mockResponse);

      component.ngOnInit();
      await new Promise(resolve => setTimeout(resolve));
      fixture.detectChanges();

      const tabElements = fixture.nativeElement.querySelectorAll('a[ngbNavLink]');
      expect(tabElements.length).toBe(2);
      expect(tabElements[0].textContent).toContain('Survey1');
      expect(tabElements[1].textContent).toContain('Survey2');
    });

    it('should render app-survey-wise-data in tab content', async () => {
      const mockResponse = { status: true, surveys: [{ id: 1, title: 'Survey1', parent_form: 0 }] };
      mockCoreService.post.mockResolvedValueOnce(mockResponse);

      component.ngOnInit();
      await new Promise(resolve => setTimeout(resolve));
      fixture.detectChanges();

      const childComponent = fixture.nativeElement.querySelector('app-survey-wise-data');
      expect(childComponent).not.toBeNull();
      expect(childComponent.getAttribute('surveyName')).toBe('Survey1');
      expect(childComponent.getAttribute('surveyId')).toBe('1');
      expect(childComponent.getAttribute('dataPurpose')).toBe('get_approved_surveydata');
      expect(childComponent.getAttribute('canApprove')).toBe('false');
      expect(childComponent.getAttribute('canReject')).toBe('true');
      expect(childComponent.getAttribute('canPending')).toBe('true');
      expect(childComponent.getAttribute('parentSurveyId')).toBe('0');
    });
  });
});