jest.mock('../../../environments/environment', () => ({
  environment: {
    featureContext: 'munichre',
    projectConfigs: {
      saksham: {
        ASSET_PATH: '/assets/saksham/',
        favicon: 'saksham-favicon.ico',
        title: 'Saksham Dashboard',
        enabledModules: ['dashboard', 'reports']
      },
      munichre: {
        ASSET_PATH: '/assets/munichre/',
        favicon: 'munichre-favicon.ico',
        title: 'Munich Re Portal',
        enabledModules: ['dashboard']
      }
    }
  }
}));

import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { of } from 'rxjs';
import { FeatureToggleService } from './feature-toggle.service';
import { UserDetailService } from '../../auth/user-detail.service';

describe('FeatureToggleService', () => {
  let activatedRouteMock: any;
  let routerMock: any;
  let titleServiceMock: any;
  let userDetailServiceMock: any;

  beforeEach(() => {
    activatedRouteMock = {
      queryParams: of({ context: null })
    };

    routerMock = {};

    titleServiceMock = {
      setTitle: jest.fn()
    };

    userDetailServiceMock = {
      getUserDetail: jest.fn(() => ({ client_id: 'saksham_client_id' }))
    };

    // Mock localStorage (default = null)
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(() => null),
        setItem: jest.fn()
      },
      writable: true
    });

    // Mock document for favicon
    const mockNodeList = {
      length: 0,
      item: jest.fn(),
      forEach: jest.fn((callback) => {}),
    } as unknown as NodeListOf<Element>;

    jest.spyOn(document, 'querySelectorAll').mockReturnValue(mockNodeList);
    jest.spyOn(document.head, 'appendChild').mockImplementation((node) => node);
    jest.spyOn(document, 'createElement').mockImplementation((tag) => ({
      type: '',
      rel: '',
      href: ''
    }) as HTMLLinkElement);

    TestBed.configureTestingModule({
      providers: [
        FeatureToggleService,
        { provide: ActivatedRoute, useValue: activatedRouteMock },
        { provide: Router, useValue: routerMock },
        { provide: Title, useValue: titleServiceMock },
        { provide: UserDetailService, useValue: userDetailServiceMock },
      ]
    });
  });

  // ←←← THIS IS THE FIX
  afterEach(() => {
    TestBed.resetTestingModule();
  });
  // ←←←

  it('should create the service', () => {
    const service = TestBed.inject(FeatureToggleService);
    expect(service).toBeTruthy();
  });

  it('should initialize with default context from environment', () => {
    const service = TestBed.inject(FeatureToggleService);
    expect(service.getContext()).toBe('munichre');
  });

  describe('initializeUserContext', () => {
    it('should set context to saksham if client_id matches', () => {
      const service = TestBed.inject(FeatureToggleService);
      const setContextSpy = jest.spyOn(service, 'setContext');
      service.initializeUserContext();
      expect(setContextSpy).toHaveBeenCalledWith('saksham');
    });
  });

  describe('isValidContext', () => {
    it('should return true for valid contexts', () => {
      const service = TestBed.inject(FeatureToggleService);
      expect(service['isValidContext']('saksham')).toBe(true);
      expect(service['isValidContext']('munichre')).toBe(true);
    });

    it('should return false for invalid contexts', () => {
      const service = TestBed.inject(FeatureToggleService);
      expect(service['isValidContext']('invalid')).toBe(false);
      expect(service['isValidContext'](null)).toBe(false);
    });
  });

  describe('setContext', () => {
    it('should update context, localStorage, and call setFaviconAndTitle for valid context', () => {
      const service = TestBed.inject(FeatureToggleService);
      const setFaviconSpy = jest.spyOn(service, 'setFaviconAndTitle');
      service.setContext('saksham');
      expect(service.getContext()).toBe('saksham');
      expect(localStorage.setItem).toHaveBeenCalledWith('featureContext', 'saksham');
      expect(setFaviconSpy).toHaveBeenCalled();
    });

    it('should not update for invalid context', () => {
      const service = TestBed.inject(FeatureToggleService);
      const setFaviconSpy = jest.spyOn(service, 'setFaviconAndTitle');
      service.setContext('invalid' as any);
      expect(service.getContext()).toBe('munichre');
      expect(localStorage.setItem).not.toHaveBeenCalled();
      expect(setFaviconSpy).not.toHaveBeenCalled();
    });
  });

  describe('getters', () => {
    it('getContext should return current context', () => {
      const service = TestBed.inject(FeatureToggleService);
      expect(service.getContext()).toBe('munichre');
    });

    it('isProject should return true for matching project', () => {
      const service = TestBed.inject(FeatureToggleService);
      expect(service.isProject('munichre')).toBe(true);
      expect(service.isProject('saksham')).toBe(false);
    });

    it('getConfig should return correct config', () => {
      const service = TestBed.inject(FeatureToggleService);
      const config = service.getConfig();
      expect(config.title).toBe('Munich Re Portal');
      expect(config.enabledModules).toContain('dashboard');
    });

    it('getAssetPath should return asset path', () => {
      const service = TestBed.inject(FeatureToggleService);
      expect(service.getAssetPath()).toBe('/assets/munichre/');
    });

    it('isModuleEnabled should return correct status', () => {
      const service = TestBed.inject(FeatureToggleService);
      expect(service.isModuleEnabled('dashboard')).toBe(true);
      expect(service.isModuleEnabled('reports')).toBe(false);
      expect(service.isModuleEnabled('unknown')).toBe(false);
    });
  });

  describe('setFaviconAndTitle', () => {
    it('should update favicon and title', () => {
      const createElementSpy = jest.spyOn(document, 'createElement');
      const appendChildSpy = jest.spyOn(document.head, 'appendChild');
      const querySelectorAllSpy = jest.spyOn(document, 'querySelectorAll');

      const service = TestBed.inject(FeatureToggleService);
      service.setFaviconAndTitle();

      expect(querySelectorAllSpy).toHaveBeenCalledWith("link[rel*='icon']");
      expect(createElementSpy).toHaveBeenCalledWith('link');
      expect(appendChildSpy).toHaveBeenCalled();
      expect(titleServiceMock.setTitle).toHaveBeenCalledWith('Munich Re Portal');
    });
  });

  describe('Multi-Client Logic', () => {
    it('should initialize with munichre from localStorage if valid', () => {
      (window.localStorage.getItem as jest.Mock).mockReturnValue('munichre');
      const service = TestBed.inject(FeatureToggleService);
      expect(service.getContext()).toBe('munichre');
      expect(service.getConfig().title).toBe('Munich Re Portal');
    });

    it('should set context from query params if valid', () => {
      activatedRouteMock.queryParams = of({ context: 'saksham' });
      const service = TestBed.inject(FeatureToggleService);
      expect(service.getContext()).toBe('saksham');
    });

    it('should switch to saksham and update all getters correctly', () => {
      const service = TestBed.inject(FeatureToggleService);
      service.setContext('saksham');
      expect(service.getContext()).toBe('saksham');
      expect(service.isProject('saksham')).toBe(true);
      expect(service.isProject('munichre')).toBe(false);
      expect(service.getConfig().title).toBe('Saksham Dashboard');
      expect(service.getAssetPath()).toBe('/assets/saksham/');
      expect(service.isModuleEnabled('dashboard')).toBe(true);
      expect(service.isModuleEnabled('reports')).toBe(true);
    });

    it('should not change context if client_id does not match saksham', () => {
      const service = TestBed.inject(FeatureToggleService);
      (userDetailServiceMock.getUserDetail as jest.Mock).mockReturnValue({ client_id: 'munichre_client_id' });
      service.initializeUserContext();
      expect(service.getContext()).toBe('munichre');
    });

    it('should set saksham favicon and title correctly', () => {
      const service = TestBed.inject(FeatureToggleService);
      const createElementSpy = jest.spyOn(document, 'createElement').mockImplementation((tag) => ({
        type: 'image/x-icon',
        rel: 'icon',
        href: ''
      }) as HTMLLinkElement);
      service.setContext('saksham');
      const createdLink = createElementSpy.mock.results[createElementSpy.mock.results.length - 1].value;
      expect(createdLink.href).toMatch(/\/assets\/saksham\/saksham-favicon.ico\?t=\d+/);
      expect(titleServiceMock.setTitle).toHaveBeenCalledWith('Saksham Dashboard');
    });
  });
});