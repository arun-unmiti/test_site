import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { HttpClient } from '@angular/common/http';
import { HttpAPIInterceptor } from './http.interceptor';
import { UserDetailService } from '../auth/user-detail.service';
import { InsightsService } from '../utilities/insights.service';

describe('HttpAPIInterceptor', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;
  let userDetailService: jest.Mocked<UserDetailService>;
  let insightsService: jest.Mocked<InsightsService>;

  beforeEach(() => {
    userDetailService = {
      getToken: jest.fn().mockReturnValue('mock-token'),
    } as any;

    insightsService = {
      logException: jest.fn(),
    } as any;

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        HttpAPIInterceptor,
        { provide: HTTP_INTERCEPTORS, useClass: HttpAPIInterceptor, multi: true },
        { provide: UserDetailService, useValue: userDetailService },
        { provide: InsightsService, useValue: insightsService },
      ],
    });

    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create the component', () => {
    const interceptor = TestBed.inject(HttpAPIInterceptor);
    expect(interceptor).toBeTruthy();
  });

  describe('intercept', () => {
    it('should not modify request for login url and log exception on error', () => {
      httpClient.get('/auth/login').subscribe({
        next: () => fail('should have failed'),
        error: (error) => expect(error).toBeTruthy(),
      });

      const req = httpMock.expectOne('/auth/login');
      expect(req.request.headers.has('Authorization')).toBe(false);
      req.error(new ErrorEvent('network error'));
      expect(insightsService.logException).toHaveBeenCalled();
    });

    it('should not modify request for login url and not log on success', () => {
      httpClient.get('/auth/login').subscribe();

      const req = httpMock.expectOne('/auth/login');
      expect(req.request.headers.has('Authorization')).toBe(false);
      req.flush({});
      expect(insightsService.logException).not.toHaveBeenCalled();
    });

    it('should add authorization and cache headers for .kml url and log exception on error', () => {
      httpClient.get('/data.kml').subscribe({
        next: () => fail('should have failed'),
        error: (error) => expect(error).toBeTruthy(),
      });

      const req = httpMock.expectOne('/data.kml');
      expect(req.request.headers.get('Authorization')).toBe('mock-token');
      expect(req.request.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate');
      expect(req.request.headers.get('Pragma')).toBe('no-cache');
      expect(req.request.headers.get('Expires')).toBe('0');
      req.error(new ErrorEvent('network error'));
      expect(insightsService.logException).toHaveBeenCalled();
    });

    it('should add authorization and cache headers for .kml url and not log on success', () => {
      httpClient.get('/data.kml').subscribe();

      const req = httpMock.expectOne('/data.kml');
      expect(req.request.headers.get('Authorization')).toBe('mock-token');
      expect(req.request.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate');
      expect(req.request.headers.get('Pragma')).toBe('no-cache');
      expect(req.request.headers.get('Expires')).toBe('0');
      req.flush({});
      expect(insightsService.logException).not.toHaveBeenCalled();
    });

    it('should add authorization header if not present and log exception on error', () => {
      httpClient.get('/api/data').subscribe({
        next: () => fail('should have failed'),
        error: (error) => expect(error).toBeTruthy(),
      });

      const req = httpMock.expectOne('/api/data');
      expect(req.request.headers.get('Authorization')).toBe('mock-token');
      req.error(new ErrorEvent('network error'));
      expect(insightsService.logException).toHaveBeenCalled();
    });

    it('should add authorization header if not present and not log on success', () => {
      httpClient.get('/api/data').subscribe();

      const req = httpMock.expectOne('/api/data');
      expect(req.request.headers.get('Authorization')).toBe('mock-token');
      req.flush({});
      expect(insightsService.logException).not.toHaveBeenCalled();
    });

    it('should not add authorization if already present and log exception on error', () => {
      httpClient.get('/api/data', { headers: { Authorization: 'existing-token' } }).subscribe({
        next: () => fail('should have failed'),
        error: (error) => expect(error).toBeTruthy(),
      });

      const req = httpMock.expectOne('/api/data');
      expect(req.request.headers.get('Authorization')).toBe('existing-token');
      req.error(new ErrorEvent('network error'));
      expect(insightsService.logException).toHaveBeenCalled();
    });

    it('should not add authorization if already present and not log on success', () => {
      httpClient.get('/api/data', { headers: { Authorization: 'existing-token' } }).subscribe();

      const req = httpMock.expectOne('/api/data');
      expect(req.request.headers.get('Authorization')).toBe('existing-token');
      req.flush({});
      expect(insightsService.logException).not.toHaveBeenCalled();
    });
  });
});