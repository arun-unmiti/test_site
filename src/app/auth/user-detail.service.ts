import { Injectable } from '@angular/core';
import { CoreService } from '../utilities/core.service';
import { FeatureToggleService } from '../shared/services/feature-toggle.service';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import * as CryptoJS from 'crypto-js';
import jwtDecode from 'jwt-decode';
import { interval } from 'rxjs';
import Swal from 'sweetalert2';
import { HttpClient } from '@angular/common/http';
import { InsightsService } from '../utilities/insights.service';

@Injectable({
  providedIn: 'root'
})
export class UserDetailService {
  onUserUpdate = new Subject();
  public session: any = null;
  private isLoggingOut = false;
  intervalSubscription: any;
  public intervalTime: any = null;
  config: any;

  constructor(
    private core: CoreService,
    private router: Router,
    private featureToggle: FeatureToggleService,
    private http: HttpClient,
    private insightsService: InsightsService
  ) {
    this.config = this.featureToggle.getConfig();
    this.session = this.config.storage;
    this.core.logoutCallback = this.logout;
    this.core.refreshTokenCallback = this.refreshToken;
    const user = this.getUserDetail();
    this.getDeviceId();
  }

  private generateDeviceId(): string {
    const array = new Uint8Array(16);
    window.crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
  }

  getDeviceId(): string {
    let deviceId = localStorage.getItem('device_id');
    if (!deviceId) {
      deviceId = this.generateDeviceId();
      localStorage.setItem('device_id', deviceId);
    }
    return deviceId;
  }

  async login(request: any) {
    try {
      request.device_id = this.getDeviceId();
      let response: any = await this.core.post('auth/login', request);
      if (+response?.status === 2 && !response['2fa_required']) {
        response = await this.handleAnotherDeviceLogin(response, request);
      }
      return await this.processLoginResponse(response);
    } catch (err: any) {
      this.core.toast('error', 'Unable to login');
      this.insightsService.logException(err);
      return { status: 0, msg: 'Unable to login' };
    } finally {
      await this.handlePostLoginCsrf();
    }
  }

  private async handleAnotherDeviceLogin(response: any, request: any): Promise<any> {
    const result = await Swal.fire({
      title: 'Warning',
      text: response.msg,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Continue',
      cancelButtonText: 'Cancel',
      customClass: { container: 'swal2-container-high-z' }
    });
    if (result.isConfirmed) {
      request.force_login = true;
      return await this.core.post('auth/login', request);
    }
    return response;
  }

  private async processLoginResponse(response: any): Promise<any> {
    if (response?.status == 1) {
      return await this.handleStatusOne(response);
    }
    if (response?.status == 2 && response['2fa_required']) {
      return await this.handleStatusTwoWith2FA(response);
    }
    this.core.toast('error', response.msg || 'Login failed');
    return response;
  }

  private async handleStatusOne(response: any): Promise<any> {
    this.session.setItem('token', response.token);
    const userResponse: any = await this.core.post('users', { purpose: 'getuserinfo' });
    if (userResponse?.status !== 1) {
      this.session.removeItem('token');
      this.core.toast('error', userResponse.msg || 'Failed to fetch user details');
      return { status: 0, msg: 'Failed to fetch user details' };
    }
    const userinfo = userResponse.userinfo;
    return {
      status: 1,
      token: response.token,
      userinfo: userinfo,
      twofa_enabled: userinfo.twofa_enabled
    };
  }

  private async handleStatusTwoWith2FA(response: any): Promise<any> {
    let userinfo: any = null;
    try {
      const headers = { Authorization: response.tmp_token };
      const userResponse: any = await this.http.post(
        this.featureToggle.getConfig().BASEURI + 'users',
        { purpose: 'getuserinfo' },
        { headers }
      ).toPromise();
      if (userResponse?.status === 1 && userResponse.userinfo) {
        userinfo = userResponse.userinfo;
      }
    } catch (err: any) {
      this.core.toast('error', 'Temporary userinfo fetch with tmp_token failed (expected if not authorized)');
      this.insightsService.logException(err);
    }
    return {
      status: 2,
      "2fa_required": true,
      tmp_token: response.tmp_token,
      userinfo
    };
  }

  private async handlePostLoginCsrf(): Promise<void> {
    if (this.config.projectContext === 'munichre') {
      try {
        const csrfResponse: any = await this.core.get('auth/getCsrfToken');
        this.session.setItem('csrfTokenName', csrfResponse.csrf_token_name);
        this.session.setItem('csrfTokenHash', csrfResponse.csrf_hash);
      } catch (csrfErr: any) {
        this.core.toast('error', 'Failed to fetch token. Please try again later.');
        this.insightsService.logException(csrfErr);
      }
    }
  }

  async handleSuccessfulLogin(response: any, userResponse?: any) {
    let user = await this.fetchUserForSuccessfulLogin(userResponse);
    if (!user) {
      return { status: 0, msg: 'Failed to fetch user details' };
    }
    if ([1, 2, 3, 4, 5, 6, 7].includes(+user.user_role)) {
      this.refreshToken(response, user);
      this.core.loginAnalytics();
      this.core.addLookup();
      this.router.navigate(['/']);
      return response;
    }
    this.core.toast('error', "You do not have access to web login, please contact admin!");
    return { status: 0, msg: "You do not have access to web login, please contact admin!" };
  }

  private async fetchUserForSuccessfulLogin(userResponse?: any): Promise<any> {
    if (userResponse) {
      return userResponse.userinfo;
    }
    const ur: any = await this.core.post('users', { purpose: 'getuserinfo' });
    if (ur?.status !== 1) {
      this.core.toast('error', ur.msg || 'Failed to fetch user details');
      return null;
    }
    return ur.userinfo;
  }

  resetTimeout() {
    if (this.intervalTime) {
      clearTimeout(this.intervalTime);
      this.intervalTime = null;
    }
    if (this.intervalSubscription) {
      this.intervalSubscription.unsubscribe();
      this.intervalSubscription = null;
    }
  }

  checkTokenTime() {
    const expire = this.session.getItem('expire');
    let isValid = false;
    try {
      if (expire) {
        const expireTime = +atob(expire);
        const currentTime = Date.now();
        if (currentTime < expireTime) {
          isValid = true;
        }
      }
    } catch (e) {
      this.core.toast('error', 'UserDetailService: checkTokenTime error');
    }
    return isValid;
  }

  refreshTimeout = (time: any) => {
    this.resetTimeout();
    this.intervalTime = setTimeout(() => {
      const tokenValid = this.checkTokenTime();
      if (tokenValid) {
        this.resetTimeout();
        const expire = this.session.getItem('expire');
        if (expire) {
          const expireTime = +atob(expire);
          const currentTime = Date.now();
          this.refreshTimeout(expireTime - currentTime);
        }
      } else {
        this.core.toast('error', 'Session Expired, Please Login again and continue');
        this.core.removePopups();
        this.logout();
      }
    }, time);
  }

  refreshToken = (response: any, user?: any) => {
    this.session.setItem('token', response.token);
    if (user) {
      this.session.setItem('user', JSON.stringify(user));
    }
    this.resetCount();
  }

  getUserDetail() {
    try {
      return JSON.parse(this.session.getItem('user') || '{}');
    } catch (e) {
      return {};
    }
  }

  getToken() {
    return this.session.getItem('token');
  }
		
  getcsrfToken() {
    return this.session.getItem('csrfTokenHash') || '';
  }
  
  getcsrfTokenName() {
    return this.session.getItem('csrfTokenName') || '';
  }
  
  setUserImg(img: any) {
    const user = this.getUserDetail();
    if (user) {
      user.image = img;
      this.session.setItem('user', JSON.stringify(user));
      this.onUserUpdate.next();
    }
  }

  logout = () => {
    if (this.isLoggingOut) {
      return;
    }
    this.isLoggingOut = true;
    try {
      this.core.logoutSession();
      this.session.clear(); // Clear all session storage
      this.resetTimeout();
      this.core.clearCache.forEach((d: any) => {
        if (typeof d === 'function') {
          d();
        }
      });
      this.router.navigateByUrl('/login', { replaceUrl: true });
    } catch (error: any) {
      this.core.toast('error', 'UserDetailService: Logout error');
      this.insightsService.logException(error);
    } finally {
      this.isLoggingOut = false;
    }
  }

  AESEncrypt(plainText: string) {
    const text = plainText;
    const key = CryptoJS.enc.Utf8.parse(atob(this.featureToggle.getConfig().ENCRYKEY || ''));
    const iv = CryptoJS.enc.Utf8.parse(atob(this.featureToggle.getConfig().ENCRYIV || ''));
    const encrypted = CryptoJS.AES.encrypt(text, key, { iv: iv });
    return encrypted.toString();
  }

  resetTime(timer: any) {
    this.session.setItem('expire', btoa((Date.now() + timer - 30 * 1000).toString()));
    this.refreshTimeout(timer - 30 * 1000);
  }

  getIntervalTime() {
    const timer = this.session.getItem('expire');
    return timer ? +atob(timer) : 0;
  }

  resetCount = () => {
    this.resetTime(this.config.sessionTimeout * 60 * 1000);
  }

  setLocation(states: any[], districts: any[]) {
    const location: any = {};
    const user = this.getUserDetail();
    if (user?.user_role >= 5) {
      location.states = states.map((d) => d.state_id);
      if (user?.user_role == 7) {
        location.districts = districts.map((d) => d.district_id);
      }
      this.session.setItem('location', JSON.stringify(location));
    }
  }

  getLocation() {
    const location = this.session.getItem('location');
    return location ? JSON.parse(location) : {};
  }
}