import { Injectable } from '@angular/core';
import { ApplicationInsights } from '@microsoft/applicationinsights-web';
import { FeatureToggleService } from '../shared/services/feature-toggle.service';

@Injectable({
  providedIn: 'root'
})
export class InsightsService {

  private appInsights!: ApplicationInsights;

  constructor(private featureToggle: FeatureToggleService) {
    const config = this.featureToggle.getConfig();

    this.appInsights = new ApplicationInsights({
      config: {
        instrumentationKey: atob(config.INSIGHTCONFIG),
        enableAutoRouteTracking: true, 
      }
    });
    this.appInsights.loadAppInsights();

  }

  logEvent(name: string, properties?: { [key: string]: any }) {
    this.appInsights.trackEvent({ name, properties });
  }

  logException(exception: Error) {
    this.appInsights.trackException({ exception });
  }

  logPageView(name?: string) {
    this.appInsights.trackPageView({ name });
  }
}