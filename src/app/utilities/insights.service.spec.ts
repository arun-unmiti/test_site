import { TestBed } from '@angular/core/testing';
import { InsightsService } from './insights.service';
import { FeatureToggleService } from '../shared/services/feature-toggle.service';
import { ApplicationInsights } from '@microsoft/applicationinsights-web';

jest.mock('@microsoft/applicationinsights-web');

describe('InsightsService', () => {
  let service: InsightsService;
  let featureToggleService: jest.Mocked<FeatureToggleService>;
  let mockAppInsights: jest.Mocked<ApplicationInsights>;

  beforeEach(() => {
    featureToggleService = {
      getConfig: jest.fn().mockReturnValue({ INSIGHTCONFIG: btoa('mock-key') }),
    } as any;

    mockAppInsights = {
      loadAppInsights: jest.fn(),
      trackEvent: jest.fn(),
      trackException: jest.fn(),
      trackPageView: jest.fn(),
    } as any;

    (ApplicationInsights as jest.Mock).mockImplementation(() => mockAppInsights);

    TestBed.configureTestingModule({
      providers: [
        InsightsService,
        { provide: FeatureToggleService, useValue: featureToggleService },
      ],
    });

    service = TestBed.inject(InsightsService);
  });

  it('should be created the service', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize ApplicationInsights with correct config in constructor', () => {
    expect(featureToggleService.getConfig).toHaveBeenCalled();
    expect(ApplicationInsights).toHaveBeenCalledWith({
      config: {
        instrumentationKey: 'mock-key',
        enableAutoRouteTracking: true,
      },
    });
    expect(mockAppInsights.loadAppInsights).toHaveBeenCalled();
  });

  it('should call trackEvent on logEvent', () => {
    const properties = { key: 'value' };
    service.logEvent('test-event', properties);
    expect(mockAppInsights.trackEvent).toHaveBeenCalledWith({ name: 'test-event', properties });
  });

  it('should call trackEvent on logEvent without properties', () => {
    service.logEvent('test-event');
    expect(mockAppInsights.trackEvent).toHaveBeenCalledWith({ name: 'test-event', properties: undefined });
  });

  it('should call trackException on logException', () => {
    const error = new Error('test-error');
    service.logException(error);
    expect(mockAppInsights.trackException).toHaveBeenCalledWith({ exception: error });
  });

  it('should call trackPageView on logPageView with name', () => {
    service.logPageView('test-page');
    expect(mockAppInsights.trackPageView).toHaveBeenCalledWith({ name: 'test-page' });
  });

  it('should call trackPageView on logPageView without name', () => {
    service.logPageView();
    expect(mockAppInsights.trackPageView).toHaveBeenCalledWith({ name: undefined });
  });
});