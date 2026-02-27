import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ToastModule } from 'primeng/toast';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MessageService } from 'primeng/api';
import { of } from 'rxjs';

import { AppComponent } from './app.component';
import { FeatureToggleService } from './shared/services/feature-toggle.service';
import { CoreService } from './utilities/core.service';
import { UserDetailService } from './auth/user-detail.service';
import { InsightsService } from './utilities/insights.service';

// ✅ Mock Firebase
jest.mock('firebase/app', () => {
  return {
    initializeApp: jest.fn(() => ({
      name: 'mockApp',
      options: {},
      analytics: jest.fn(() => ({
        logEvent: jest.fn(),
        setUserId: jest.fn(),
        setCurrentScreen: jest.fn(),
      })),
    })),
  };
});

// ✅ Mock Services
const mockUserDetailService = {
  getUserDetail: jest.fn(() => ({ user_id: '123' })),
  resetCount: jest.fn(),
};

const mockCoreService = {
  checkSessionTime: jest.fn(),
};

const mockFeatureToggleService = {
  getContext: jest.fn(() => 'munichre'),
  featureContext$: of('munichre'),
  setContext: jest.fn(),
  initializeUserContext: jest.fn(),
  setFaviconAndTitle: jest.fn(),
  getConfig: jest.fn(() => ({ title: 'Mock Title' })),
};

const mockInsightsService = {
  logPageView: jest.fn(),
};

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        ToastModule,
        HttpClientTestingModule
      ],
      declarations: [AppComponent],
      providers: [
        { provide: UserDetailService, useValue: mockUserDetailService },
        { provide: CoreService, useValue: mockCoreService },
        { provide: FeatureToggleService, useValue: mockFeatureToggleService },
        { provide: InsightsService, useValue: mockInsightsService },
        MessageService
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should call setContext when switchContext is called', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const component = fixture.componentInstance;
    component.switchContext('saksham');
    expect(mockFeatureToggleService.setContext).toHaveBeenCalledWith('saksham');
  });

  it('should reset count when tokenTimer is triggered and user is available', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const component = fixture.componentInstance;
    component.tokenTimer();
    expect(mockUserDetailService.resetCount).toHaveBeenCalled();
  });
});
