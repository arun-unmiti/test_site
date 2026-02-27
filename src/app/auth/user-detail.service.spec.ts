import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { CoreService } from '../utilities/core.service';
import { FeatureToggleService } from '../shared/services/feature-toggle.service';
import { UserDetailService } from './user-detail.service';
import { HttpClient } from '@angular/common/http';
import { ProjectConfig } from '../../environments/environment'; // Adjust the path if necessary based on your project structure
import Swal from 'sweetalert2';
import * as CryptoJS from 'crypto-js';
import { throwError, of } from 'rxjs';
import { InsightsService } from '../utilities/insights.service';

jest.mock('sweetalert2', () => ({
  __esModule: true,
  default: {
    fire: jest.fn(),
  },
}));

describe('UserDetailService', () => {
  let service: UserDetailService;
  let coreService: jest.Mocked<CoreService>;
  let router: jest.Mocked<Router>;
  let featureToggleService: jest.Mocked<FeatureToggleService>;
  let httpClient: jest.Mocked<HttpClient>;
  let mockInsightsService: jest.Mocked<InsightsService>;
  let storage: { setItem: jest.Mock; getItem: jest.Mock; clear: jest.Mock; removeItem: jest.Mock };

  beforeEach(() => {
    const store = new Map<string, string>();
    storage = {
      setItem: jest.fn((key: string, value: string) => {
        store.set(key, value);
      }),
      getItem: jest.fn((key: string) => store.get(key) || null),
      clear: jest.fn(() => store.clear()),
      removeItem: jest.fn((key: string) => store.delete(key)),
    };

    coreService = {
      post: jest.fn(),
      get: jest.fn(),
      toast: jest.fn(),
      loginAnalytics: jest.fn(),
      addLookup: jest.fn(),
      logoutSession: jest.fn(),
      removePopups: jest.fn(),
      clearCache: [],
    } as any;

    router = {
      navigate: jest.fn(),
      navigateByUrl: jest.fn(),
    } as any;

    featureToggleService = {
      getConfig: jest.fn().mockReturnValue({
        storage,
        sessionTimeout: 30,
        ENCRYKEY: btoa('somekey'),
        ENCRYIV: btoa('someiv'),
        BASEURI: 'https://api.example.com/',
        projectContext: 'munichre',
      } as unknown as ProjectConfig),
    } as any;

    httpClient = {
      post: jest.fn(),
    } as any;

    mockInsightsService = {
      logException: jest.fn(),
    } as unknown as jest.Mocked<InsightsService>;

    // Mock window.crypto globally for tests
    global.window = Object.create(window);
    Object.defineProperty(window, 'crypto', {
      value: {
        getRandomValues: jest.fn((array: Uint8Array) => {
          array.fill(0);
          return array;
        }),
      },
      writable: true,
    });

    TestBed.configureTestingModule({
      providers: [
        UserDetailService,
        { provide: CoreService, useValue: coreService },
        { provide: Router, useValue: router },
        { provide: FeatureToggleService, useValue: featureToggleService },
        { provide: HttpClient, useValue: httpClient },
        { provide: InsightsService, useValue: mockInsightsService },
      ],
    });

    service = TestBed.inject(UserDetailService);
    mockInsightsService.logException.mockReset();
  });

  afterEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('should create the component', () => {
    expect(service).toBeTruthy();
  });

  describe('getDeviceId', () => {
    it('should generate and store device id if not present', () => {
      const deviceId = service.getDeviceId();
      expect(deviceId).toBe('00000000000000000000000000000000');
      expect(localStorage.getItem('device_id')).toBe(deviceId);
    });

    it('should return existing device id', () => {
      localStorage.setItem('device_id', 'existing-id');
      expect(service.getDeviceId()).toBe('existing-id');
    });
  });

  describe('generateDeviceId', () => {
    it('should generate a device ID using crypto', () => {
      (window.crypto.getRandomValues as jest.Mock).mockImplementation((array: Uint8Array) => {
        array.fill(1); // Mock random values
        return array;
      });
      const deviceId = (service as any).generateDeviceId();
      expect(deviceId).toBe('01010101010101010101010101010101');
    });
  });

  describe('login', () => {
    it('should handle successful login (status 1)', async () => {
      coreService.post.mockResolvedValueOnce({ status: 1, token: 'token' });
      coreService.post.mockResolvedValueOnce({ status: 1, userinfo: { user_role: 1, twofa_enabled: false } });
      coreService.get.mockResolvedValueOnce({ csrf_token_name: 'name', csrf_hash: 'hash' });

      const response = await service.login({ username: 'test' });

      expect(response).toEqual({
        status: 1,
        token: 'token',
        userinfo: { user_role: 1, twofa_enabled: false },
        twofa_enabled: false,
      });
      expect(storage.setItem).toHaveBeenCalledWith('token', 'token');
      expect(coreService.toast).not.toHaveBeenCalled();
    });

    it('should handle failed userinfo fetch after status 1', async () => {
      coreService.post.mockResolvedValueOnce({ status: 1, token: 'token' });
      coreService.post.mockResolvedValueOnce({ status: 0, msg: 'userinfo error' });
      coreService.get.mockResolvedValueOnce({ csrf_token_name: 'name', csrf_hash: 'hash' });

      const response = await service.login({ username: 'test' });

      expect(coreService.toast).toHaveBeenCalledWith('error', 'userinfo error');
      expect(response).toEqual({ status: 0, msg: 'Failed to fetch user details' });
      expect(storage.removeItem).toHaveBeenCalledWith('token');
    });

    it('should handle failed userinfo fetch after status 1 with fallback msg', async () => {
      coreService.post.mockResolvedValueOnce({ status: 1, token: 'token' });
      coreService.post.mockResolvedValueOnce({ status: 0 });
      coreService.get.mockResolvedValueOnce({ csrf_token_name: 'name', csrf_hash: 'hash' });

      const response = await service.login({ username: 'test' });

      expect(coreService.toast).toHaveBeenCalledWith('error', 'Failed to fetch user details');
      expect(response).toEqual({ status: 0, msg: 'Failed to fetch user details' });
      expect(storage.removeItem).toHaveBeenCalledWith('token');
    });

    it('should handle force login on status 2 (no 2fa_required) and continue', async () => {
      (Swal.fire as jest.Mock).mockResolvedValueOnce({ isConfirmed: true });
      coreService.post.mockResolvedValueOnce({ status: 2, msg: 'warning' });
      coreService.post.mockResolvedValueOnce({ status: 1, token: 'token' });
      coreService.post.mockResolvedValueOnce({ status: 1, userinfo: { user_role: 1, twofa_enabled: false } });
      coreService.get.mockResolvedValueOnce({ csrf_token_name: 'name', csrf_hash: 'hash' });

      const response = await service.login({ username: 'test' });

      expect(Swal.fire).toHaveBeenCalled();
      expect(coreService.post).toHaveBeenCalledTimes(3);
      expect(response).toEqual({
        status: 1,
        token: 'token',
        userinfo: { user_role: 1, twofa_enabled: false },
        twofa_enabled: false,
      });
    });

    it('should handle force login on status 2 (no 2fa_required) and cancel', async () => {
      (Swal.fire as jest.Mock).mockResolvedValueOnce({ isConfirmed: false });
      coreService.post.mockResolvedValueOnce({ status: 2, msg: 'warning' });
      coreService.get.mockResolvedValueOnce({ csrf_token_name: 'name', csrf_hash: 'hash' });

      const response = await service.login({ username: 'test' });

      expect(Swal.fire).toHaveBeenCalled();
      expect(coreService.post).toHaveBeenCalledTimes(1);
      expect(response).toEqual({ status: 2, msg: 'warning' });
    });

    it('should handle status 2 with 2fa_required (successful tmp userinfo fetch)', async () => {
      coreService.post.mockResolvedValueOnce({ status: 2, '2fa_required': true, tmp_token: 'tmp_token' });
      httpClient.post.mockReturnValueOnce(of({ status: 1, userinfo: { user_role: 1, twofa_enabled: true } }));
      coreService.get.mockResolvedValueOnce({ csrf_token_name: 'name', csrf_hash: 'hash' });

      const response = await service.login({ username: 'test' });

      expect(httpClient.post).toHaveBeenCalledWith(
        'https://api.example.com/users',
        { purpose: 'getuserinfo' },
        { headers: { Authorization: 'tmp_token' } }
      );
      expect(response).toEqual({
        status: 2,
        '2fa_required': true,
        tmp_token: 'tmp_token',
        userinfo: { user_role: 1, twofa_enabled: true },
      });
    });

    it('should handle status 2 with 2fa_required (failed tmp userinfo fetch)', async () => {
      coreService.post.mockResolvedValueOnce({ status: 2, '2fa_required': true, tmp_token: 'tmp_token' });
      httpClient.post.mockReturnValueOnce(throwError(() => new Error('fetch error')));
      coreService.get.mockResolvedValueOnce({ csrf_token_name: 'name', csrf_hash: 'hash' });

      const response = await service.login({ username: 'test' });

      expect(coreService.toast).toHaveBeenCalledWith('error', 'Temporary userinfo fetch with tmp_token failed (expected if not authorized)');
      expect(response).toEqual({
        status: 2,
        '2fa_required': true,
        tmp_token: 'tmp_token',
        userinfo: null,
      });
    });

    it('should toast error on failed login (other status)', async () => {
      coreService.post.mockResolvedValueOnce({ status: 0, msg: 'error' });
      coreService.get.mockResolvedValueOnce({ csrf_token_name: 'name', csrf_hash: 'hash' });

      const response = await service.login({ username: 'test' });

      expect(coreService.toast).toHaveBeenCalledWith('error', 'error');
      expect(response).toEqual({ status: 0, msg: 'error' });
    });

    it('should toast fallback error on failed login without msg', async () => {
      coreService.post.mockResolvedValueOnce({ status: 0 });
      coreService.get.mockResolvedValueOnce({ csrf_token_name: 'name', csrf_hash: 'hash' });

      const response = await service.login({ username: 'test' });

      expect(coreService.toast).toHaveBeenCalledWith('error', 'Login failed');
      expect(response).toEqual({ status: 0 });
    });

    it('should handle error during login', async () => {
      coreService.post.mockRejectedValueOnce(new Error('error') as never);
      coreService.get.mockResolvedValueOnce({ csrf_token_name: 'name', csrf_hash: 'hash' });

      const response = await service.login({ username: 'test' });

      expect(coreService.toast).toHaveBeenCalledWith('error', 'Unable to login');
      expect(mockInsightsService.logException).toHaveBeenCalledWith(expect.any(Error));
      expect(response).toEqual({ status: 0, msg: 'Unable to login' });
    });

    it('should fetch csrf only for munichre', async () => {
      const overriddenConfig = {
        ...featureToggleService.getConfig(),
        projectContext: 'saksham',
      };
      service.config = overriddenConfig;
      coreService.post.mockResolvedValueOnce({ status: 1, token: 'token' });
      coreService.post.mockResolvedValueOnce({ status: 1, userinfo: { user_role: 1, twofa_enabled: false } });

      await service.login({ username: 'test' });

      expect(coreService.get).not.toHaveBeenCalled();
    });

    it('should handle error in fetching csrf token', async () => {
      coreService.post.mockResolvedValueOnce({ status: 1, token: 'token' });
      coreService.post.mockResolvedValueOnce({ status: 1, userinfo: { user_role: 1, twofa_enabled: false } });
      coreService.get.mockRejectedValueOnce(new Error('csrf error'));

      const response = await service.login({ username: 'test' });

      expect(coreService.toast).toHaveBeenCalledWith('error', 'Failed to fetch token. Please try again later.');
      expect(mockInsightsService.logException).toHaveBeenCalledWith(expect.any(Error));
      expect(response).toEqual({
        status: 1,
        token: 'token',
        userinfo: { user_role: 1, twofa_enabled: false },
        twofa_enabled: false,
      });
    });
  });

  describe('handleSuccessfulLogin', () => {
    it('should handle without userResponse (fetch userinfo)', async () => {
      coreService.post.mockResolvedValueOnce({ status: 1, userinfo: { user_role: 1 } });

      const response = await (service as any).handleSuccessfulLogin({ token: 'token' });

      expect(response).toEqual({ token: 'token' });
      expect(router.navigate).toHaveBeenCalledWith(['/']);
      expect(coreService.loginAnalytics).toHaveBeenCalled();
      expect(coreService.addLookup).toHaveBeenCalled();
    });

    it('should handle with userResponse provided', async () => {
      const userResponse = { status: 1, userinfo: { user_role: 1 } };

      const response = await (service as any).handleSuccessfulLogin({ token: 'token' }, userResponse);

      expect(response).toEqual({ token: 'token' });
      expect(coreService.post).not.toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(['/']);
      expect(coreService.loginAnalytics).toHaveBeenCalled();
      expect(coreService.addLookup).toHaveBeenCalled();
    });

    it('should handle userinfo status not 1 (without userResponse)', async () => {
      coreService.post.mockResolvedValueOnce({ status: 0, msg: 'userinfo error' });

      const response = await (service as any).handleSuccessfulLogin({ token: 'token' });

      expect(coreService.toast).toHaveBeenCalledWith('error', 'userinfo error');
      expect(response).toEqual({ status: 0, msg: 'Failed to fetch user details' });
    });

    it('should handle userinfo msg fallback (without userResponse)', async () => {
      coreService.post.mockResolvedValueOnce({ status: 0 });

      const response = await (service as any).handleSuccessfulLogin({ token: 'token' });

      expect(coreService.toast).toHaveBeenCalledWith('error', 'Failed to fetch user details');
      expect(response).toEqual({ status: 0, msg: 'Failed to fetch user details' });
    });

    it('should handle invalid role', async () => {
      coreService.post.mockResolvedValueOnce({ status: 1, userinfo: { user_role: 99 } });

      const response = await (service as any).handleSuccessfulLogin({ token: 'token' });

      expect(coreService.toast).toHaveBeenCalledWith('error', "You do not have access to web login, please contact admin!");
      expect(response).toEqual({ status: 0, msg: "You do not have access to web login, please contact admin!" });
    });

    it('should handle no user', async () => {
      coreService.post.mockResolvedValueOnce({ status: 1, userinfo: null });

      const response = await (service as any).handleSuccessfulLogin({ token: 'token' });

      expect(response).toEqual({ status: 0, msg: 'Failed to fetch user details' });
    });
  });

  describe('logout', () => {
    it('should clear session and navigate to login', () => {
      service.logout();

      expect(coreService.logoutSession).toHaveBeenCalled();
      expect(storage.clear).toHaveBeenCalled();
      expect(router.navigateByUrl).toHaveBeenCalledWith('/login', { replaceUrl: true });
    });

    it('should not logout if already logging out', () => {
      (service as any).isLoggingOut = true;
      service.logout();

      expect(coreService.logoutSession).not.toHaveBeenCalled();
    });

    it('should handle error in logout', () => {
      coreService.logoutSession.mockImplementationOnce(() => { throw new Error('logout error'); });

      service.logout();

      expect(coreService.toast).toHaveBeenCalledWith('error', 'UserDetailService: Logout error');
      expect(mockInsightsService.logException).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('getUserDetail', () => {
    it('should return parsed user', () => {
      (storage.getItem as jest.Mock).mockReturnValue(JSON.stringify({ user_id: 1 }));

      expect(service.getUserDetail()).toEqual({ user_id: 1 });
    });

    it('should return empty object on error', () => {
      (storage.getItem as jest.Mock).mockReturnValue('invalid');

      expect(service.getUserDetail()).toEqual({});
    });

    it('should return empty if no user', () => {
      (storage.getItem as jest.Mock).mockReturnValue(null);

      expect(service.getUserDetail()).toEqual({});
    });
  });

  describe('checkTokenTime', () => {
    it('should return true if token not expired', () => {
      (storage.getItem as jest.Mock).mockReturnValue(btoa((Date.now() + 10000).toString()));

      expect(service.checkTokenTime()).toBe(true);
    });

    it('should return false if token expired', () => {
      (storage.getItem as jest.Mock).mockReturnValue(btoa((Date.now() - 10000).toString()));

      expect(service.checkTokenTime()).toBe(false);
    });

    it('should return false if no expire', () => {
      (storage.getItem as jest.Mock).mockReturnValue(null);

      expect(service.checkTokenTime()).toBe(false);
    });

    it('should handle error', () => {
      jest.spyOn(global, 'atob').mockImplementationOnce(() => { throw new Error('decode error'); });

      (storage.getItem as jest.Mock).mockReturnValue('invalid');

      expect(service.checkTokenTime()).toBe(false);
      expect(coreService.toast).toHaveBeenCalledWith('error', 'UserDetailService: checkTokenTime error');
    });
  });

  describe('AESEncrypt', () => {
    it('should encrypt text', () => {
      const encrypted = service.AESEncrypt('test');
      expect(encrypted).toBeTruthy();
    });
  });

  describe('setLocation and getLocation', () => {
    it('should set and get location for eligible users', () => {
      jest.spyOn(service, 'getUserDetail').mockReturnValue({ user_role: 5 });

      service.setLocation([{ state_id: 1 }], []);
      expect(service.getLocation()).toEqual({ states: [1] });

      jest.spyOn(service, 'getUserDetail').mockReturnValue({ user_role: 7 });
      service.setLocation([{ state_id: 1 }], [{ district_id: 2 }]);
      expect(service.getLocation()).toEqual({ states: [1], districts: [2] });
    });

    it('should not set location for ineligible users', () => {
      jest.spyOn(service, 'getUserDetail').mockReturnValue({ user_role: 1 });

      service.setLocation([{ state_id: 1 }], [{ district_id: 2 }]);
      expect(service.getLocation()).toEqual({});
    });

    it('should return empty if no location', () => {
      expect(service.getLocation()).toEqual({});
    });
  });

  describe('getToken', () => {
    it('should get token', () => {
      (storage.getItem as jest.Mock).mockReturnValue('token');

      expect(service.getToken()).toBe('token');
    });
  });

  describe('getcsrfToken', () => {
    it('should get csrf token', () => {
      (storage.getItem as jest.Mock).mockReturnValue('hash');

      expect(service.getcsrfToken()).toBe('hash');
    });

    it('should return empty if no token', () => {
      (storage.getItem as jest.Mock).mockReturnValue(null);

      expect(service.getcsrfToken()).toBe('');
    });
  });

  describe('getcsrfTokenName', () => {
    it('should get csrf token name', () => {
      (storage.getItem as jest.Mock).mockReturnValue('name');

      expect(service.getcsrfTokenName()).toBe('name');
    });

    it('should return empty if no name', () => {
      (storage.getItem as jest.Mock).mockReturnValue(null);

      expect(service.getcsrfTokenName()).toBe('');
    });
  });

  describe('setUserImg', () => {
    it('should set user image and trigger subject', () => {
      (storage.getItem as jest.Mock).mockReturnValue(JSON.stringify({ user_id: 1 }));
      const nextSpy = jest.spyOn((service as any).onUserUpdate, 'next');

      service.setUserImg('newimg');

      expect(nextSpy).toHaveBeenCalled();
      expect(JSON.parse((storage.setItem as jest.Mock).mock.calls[0][1])).toEqual({ user_id: 1, image: 'newimg' });
    });

    it('should set even if empty user object', () => {
      (storage.getItem as jest.Mock).mockReturnValue(null);

      service.setUserImg('newimg');

      expect(storage.setItem).toHaveBeenCalled();
    });
  });

  describe('refreshToken', () => {
    it('should set token and user, call resetCount', () => {
      const resetCountSpy = jest.spyOn(service as any, 'resetCount');

      (service as any).refreshToken({ token: 'newtoken' }, { user_id: 2 });

      expect(storage.setItem).toHaveBeenCalledWith('token', 'newtoken');
      expect(storage.setItem).toHaveBeenCalledWith('user', JSON.stringify({ user_id: 2 }));
      expect(resetCountSpy).toHaveBeenCalled();
    });

    it('should set only token if no user', () => {
      (service as any).refreshToken({ token: 'newtoken' });

      expect(storage.setItem).toHaveBeenCalledWith('token', 'newtoken');
      expect(storage.setItem).not.toHaveBeenCalledWith('user', expect.anything());
    });
  });

  describe('resetTimeout', () => {
    it('should clear timeout and subscription', () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
      (service as any).intervalTime = 123; // mock timeout id
      const unsubscribeSpy = jest.fn();
      (service as any).intervalSubscription = { unsubscribe: unsubscribeSpy };

      (service as any).resetTimeout();

      expect(clearTimeoutSpy).toHaveBeenCalledWith(123);
      expect(unsubscribeSpy).toHaveBeenCalled();
      expect((service as any).intervalTime).toBeNull();
      expect((service as any).intervalSubscription).toBeNull();
    });

    it('should handle no timeout or subscription', () => {
      (service as any).intervalTime = null;
      (service as any).intervalSubscription = null;

      expect(() => (service as any).resetTimeout()).not.toThrow();
    });

    it('should unsubscribe intervalSubscription if exists', () => {
      const unsubscribeSpy = jest.fn();
      (service as any).intervalSubscription = { unsubscribe: unsubscribeSpy };

      (service as any).resetTimeout();

      expect(unsubscribeSpy).toHaveBeenCalled();
      expect((service as any).intervalSubscription).toBeNull();
    });
  });

  describe('refreshTimeout', () => {
    it('should set timeout and check token', fakeAsync(() => {
      const logoutSpy = jest.spyOn(service, 'logout');
      const toastSpy = jest.spyOn(coreService, 'toast');
      const resetSpy = jest.spyOn(service as any, 'resetTimeout');
      const removePopupsSpy = jest.spyOn(coreService, 'removePopups');

      (storage.getItem as jest.Mock).mockReturnValue(btoa((Date.now() - 10000).toString())); // expired

      (service as any).refreshTimeout(100);

      tick(100);

      expect(toastSpy).toHaveBeenCalledWith('error', 'Session Expired, Please Login again and continue');
      expect(removePopupsSpy).toHaveBeenCalled();
      expect(logoutSpy).toHaveBeenCalled();
    }));

    it('should handle no expire in reset', fakeAsync(() => {
      const resetSpy = jest.spyOn(service as any, 'resetTimeout');
      (storage.getItem as jest.Mock).mockReturnValue(null); // no expire

      (service as any).refreshTimeout(100);

      tick(100);

      expect(resetSpy).toHaveBeenCalledTimes(2); // initial and in logout
    }));
  });

  describe('resetTime', () => {
    it('should set expire and call refreshTimeout', () => {
      const refreshSpy = jest.spyOn(service as any, 'refreshTimeout');

      (service as any).resetTime(60000);

      expect(storage.setItem).toHaveBeenCalledWith('expire', expect.any(String));
      expect(refreshSpy).toHaveBeenCalledWith(30000);
    });
  });

  describe('getIntervalTime', () => {
    it('should get interval time', () => {
      (storage.getItem as jest.Mock).mockReturnValue(btoa('12345'));

      expect((service as any).getIntervalTime()).toBe(12345);
    });

    it('should return 0 if no expire', () => {
      (storage.getItem as jest.Mock).mockReturnValue(null);

      expect((service as any).getIntervalTime()).toBe(0);
    });

    it('should handle invalid base64', () => {
      jest.spyOn(global, 'atob').mockImplementationOnce(() => { throw new Error('invalid base64'); });
      (storage.getItem as jest.Mock).mockReturnValue('invalid');

      expect(() => (service as any).getIntervalTime()).toThrow();
    });
  });

  describe('resetCount', () => {
    it('should call resetTime with config timeout', () => {
      const resetTimeSpy = jest.spyOn(service as any, 'resetTime');

      (service as any).resetCount();

      expect(resetTimeSpy).toHaveBeenCalledWith(30 * 60 * 1000);
    });
  });
});