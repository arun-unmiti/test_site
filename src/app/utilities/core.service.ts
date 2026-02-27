import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MessageService } from 'primeng/api';
import { FeatureToggleService } from '../shared/services/feature-toggle.service';
import { ProjectConfig, environment, ProjectContext } from 'src/environments/environment'; // Import ProjectContext
import * as XLSX from 'xlsx';
import * as moment from 'moment';
import * as CryptoJS from 'crypto-js';
import { PDFDocument, PDFOperator, StandardFonts } from 'pdf-lib';
import { AngularFireAnalytics } from '@angular/fire/analytics';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class CoreService {
  private readonly apiRegexPattern = new RegExp(/^[a-zA-Z0-9@+#&$*!%:(){}\n\t_ .-]*$/);
  private readonly session: Storage; // Use dynamic storage from environment
  private projectContext: ProjectContext; // Add projectContext
  private assetsFolder: string; // Add assetsFolder

  constructor(
    private http: HttpClient,
    private messageService: MessageService,
    private analytics: AngularFireAnalytics,
    private router: Router,
    private featureToggle: FeatureToggleService
  ) {
    this.projectContext = this.featureToggle.getContext() as ProjectContext; // Initialize projectContext
    this.assetsFolder = environment.projectConfigs[this.projectContext].assetsFolder; // Initialize assetsFolder
    this.session = environment.projectConfigs[this.projectContext].storage; // Initialize session storage dynamically
    let fanalytics: any = this.analytics;
    // fanalytics.getEvents().subscribe((events: any) => {
    // });
  }

  public clearCache: any[] = [];
  public logoutCallback: any;
  public refreshTokenCallback: any;
  public addLookup = () => {};
  private abortController = new AbortController();

  private addinRequest(request: any, key: any, value: any) {
    if (request instanceof FormData) {
      request.append(key, value);
    } else {
      request[key] = value;
    }
  }

  async get(url: any) {
    const userDetail = JSON.parse(this.session.getItem('user') || '{}');
    return new Promise((res, rej) => {
      this.http
        .get(this.featureToggle.getConfig().BASEURI + url)
        .toPromise()
        .then((response: any) => {
          if (response?.session === false) {
            if (this.logoutCallback) {
              this.logoutCallback();
            }
          }
          res(response);
        })
        .catch((err) => rej(err));
    });
  }

  async getSelf(url: any) {
    const base = window.origin + '/#/';
    return new Promise((res, rej) => {
      this.http
        .get(base + url)
        .toPromise()
        .then((response: any) => {
          if (response?.session === false) {
            if (this.logoutCallback) {
              this.logoutCallback();
            }
          }
          res(response);
        })
        .catch((err) => rej(err));
    });
  }
  
  async fetchAzureBlob(fullUrl: string): Promise<Blob> {
    try {
      return await this.http.get(fullUrl, { responseType: 'blob' }).toPromise() as Blob;
    } catch (error:any) {
      try {
        const response = await this.http.get(fullUrl, { responseType: 'arraybuffer' }).toPromise();
        return new Blob([response], { type: 'application/pdf' });
      } catch (arrayBufferError:any) {
        throw new Error('Failed to fetch PDF: ' + (arrayBufferError.message || error.message));
      }
    }
  }

  async post(url: any, request?: any, httpOptions: any = {}) {
    const userDetail = JSON.parse(this.session.getItem('user') || '{}');
    let apiUrl = 'data';
    if (!request) {
      request = this.clone(url);
    } else {
      apiUrl = url;
    }
    if (userDetail?.unit_id && !request.client_id && !['8', '9', '10', '11', '12'].includes(request?.survey_id?.toString())) {
      this.addinRequest(request, 'client_id', userDetail?.unit_id);
    }
    this.addinRequest(request, 'login_id', userDetail?.user_id);
    this.addinRequest(request, 'login_role', userDetail?.user_role);
    return new Promise((res, rej) => {
      if (request.purpose !== 'get_lookups') {
        this.abortController.signal.addEventListener('abort', () => rej());
      }
      if (this.validateSession(apiUrl, rej)) {
        return;
      }
      this.http.post(this.featureToggle.getConfig().BASEURI + apiUrl, request, httpOptions).toPromise().then((response: any) => {
        this.handlePostResponse(response);
        res(response);
      }).catch(rej);
    });
  }

  handlePostResponse(response: any) {
    if (response?.session === false) {
      if (this.logoutCallback) {
        this.logoutCallback();
      }
    }
    if (response?.hasOwnProperty('token')) {
      if (!response?.token) {
        if (this.logoutCallback) {
          this.logoutCallback();
        }
      } else {
        if (this.refreshTokenCallback) {
          this.refreshTokenCallback(response);
        }
      }
    }
  }

  async mail_post(request?: any, url = '') {
    if (!request) {
      request = {};
    }
    request.login_id = '1';
    request.login_role = '1';
    return new Promise((res, rej) => {
      this.http
        .post(this.featureToggle.getConfig().BASEURI + 'auto_email' + (url ? '/' + url : ''), request)
        .toPromise()
        .then((response: any) => {
          if (response?.session === false) {
            if (this.logoutCallback) {
              this.logoutCallback();
            }
          }
          res(response);
        })
        .catch((err) => rej(err));
    });
  }

  async postWithError(url: any, request?: any) {
    const userDetail = JSON.parse(this.session.getItem('user') || '{}');
    let apiUrl = 'data';
    if (!request) {
      request = this.clone(url);
    } else {
      apiUrl = url;
    }
    if (userDetail?.unit_id && !request.client_id) {
      request.client_id = userDetail?.unit_id;
    }
    request.login_id = userDetail?.user_id;
    request.login_role = userDetail?.user_role;
    return new Promise((res, rej) => {
      this.abortController.signal.addEventListener('abort', () => {
        rej();
      });
      if (this.validateSession(apiUrl, rej)) {
        return;
      }
      this.http.post(this.featureToggle.getConfig().BASEURI + apiUrl, request).toPromise().then((response: any) => {
          if (response?.session === false) {
            if (this.logoutCallback) {
              this.logoutCallback();
            }
          }
          if (response?.hasOwnProperty('token')) {
            if (!response?.token) {
              if (this.logoutCallback) {
                this.logoutCallback();
              }
            } else {
              if (this.refreshTokenCallback) {
                this.refreshTokenCallback(response);
              }
            }
          }
          res(response);
        }).catch((err) => rej(err));
    });
  }

  async webserivce_post(url: any, request?: any) {
    const userDetail = JSON.parse(this.session.getItem('user') || '{}');
    let apiUrl = 'data';
    if (!request) {
      request = this.clone(url);
    } else {
      apiUrl = url;
    }
    if (userDetail?.unit_id && !request.client_id) {
      this.addinRequest(request, 'client_id', userDetail?.unit_id);
    }
    this.addinRequest(request, 'login_id', userDetail?.user_id);
    this.addinRequest(request, 'login_role', userDetail?.user_role);
    return new Promise((res, rej) => {
      if (request.purpose !== 'get_lookups') {
        this.abortController.signal.addEventListener('abort', () => {
          rej();
        });
      }
      if (this.validateSession(apiUrl, rej)) {
        return;
      }
      this.http.post((this.featureToggle.getConfig().BASEWEBSERVICE || this.featureToggle.getConfig().BASEURI) + apiUrl, request).toPromise().then((response: any) => {
          if (response?.session === false) {
            if (this.logoutCallback) {
              this.logoutCallback();
            }
          }
          if (response?.hasOwnProperty('token')) {
            if (!response?.token) {
              if (this.logoutCallback) this.logoutCallback();
            } else {
              if (this.refreshTokenCallback) this.refreshTokenCallback(response);
            }
          }
          res(response);
        }).catch((err) => rej(err));
    });
  }

  async dashboard_post(url: any, request?: any) {
    const userDetail = JSON.parse(this.session.getItem('user') || '{}');
    let apiUrl = 'data';
    if (!request) {
      request = this.clone(url);
    } else {
      apiUrl = url;
    }
    if (userDetail?.unit_id && !request.client_id) {
      this.addinRequest(request, 'client_id', userDetail?.unit_id);
    }
    this.addinRequest(request, 'login_id', userDetail?.user_id);
    this.addinRequest(request, 'login_role', userDetail?.user_role);
    return new Promise((res, rej) => {
      if (request.purpose !== 'get_lookups') {
        this.abortController.signal.addEventListener('abort', () => {
          rej();
        });
      }
      if (this.validateSession(apiUrl, rej)) {
        return;
      }
      this.http.post((this.featureToggle.getConfig().BASEDASHBOARD || this.featureToggle.getConfig().BASEURI) + apiUrl, request).toPromise().then((response: any) => {
          if (response?.session === false) {
            if (this.logoutCallback) {
              this.logoutCallback();
            }
          }
          if (response?.hasOwnProperty('token')) {
            if (!response?.token) {
              if (this.logoutCallback) this.logoutCallback();
            } else {
              if (this.refreshTokenCallback) this.refreshTokenCallback(response);
            }
          }
          res(response);
        }).catch((err) => rej(err));
    });
  }

  async data_post(url: any, request?: any) {
    const userDetail = JSON.parse(this.session.getItem('user') || '{}');
    let apiUrl = 'data';
    if (!request) {
      request = this.clone(url);
    } else {
      apiUrl = url;
    }
    if (userDetail?.unit_id && !request.client_id && !['8', '9', '10', '11', '12'].includes(request?.survey_id?.toString())) {
      this.addinRequest(request, 'client_id', userDetail?.unit_id);
    }
    this.addinRequest(request, 'login_id', userDetail?.user_id);
    this.addinRequest(request, 'login_role', userDetail?.user_role);
    return new Promise((res, rej) => {
      if (request.purpose !== 'get_lookups') {
        this.abortController.signal.addEventListener('abort', () => {
          rej();
        });
      }
      if (this.validateSession(apiUrl, rej)) {
        return;
      }
      this.http.post((this.featureToggle.getConfig().BASEDATA || this.featureToggle.getConfig().BASEURI) + apiUrl, request).toPromise().then((response: any) => {
          if (response?.session === false) {
            if (this.logoutCallback) {
              this.logoutCallback();
            }
          }
          if (response?.hasOwnProperty('token')) {
            if (!response?.token) {
              if (this.logoutCallback) this.logoutCallback();
            } else {
              if (this.refreshTokenCallback) this.refreshTokenCallback(response);
            }
          }
          res(response);
        }).catch((err) => rej(err));
    });
  }

  async report_post(url: any, request?: any) {
    const userDetail = JSON.parse(this.session.getItem('user') || '{}');
    let apiUrl = 'data';
    if (!request) {
      request = this.clone(url);
    } else {
      apiUrl = url;
    }
    if (userDetail?.unit_id && !request.client_id) {
      this.addinRequest(request, 'client_id', userDetail?.unit_id);
    }
    this.addinRequest(request, 'login_id', userDetail?.user_id);
    this.addinRequest(request, 'login_role', userDetail?.user_role);
    return new Promise((res, rej) => {
      if (request.purpose !== 'get_lookups') {
        this.abortController.signal.addEventListener('abort', () => {
          rej();
        });
      }
      if (this.validateSession(apiUrl, rej)) {
        return;
      }
      this.http.post((this.featureToggle.getConfig().BASEREPORT || this.featureToggle.getConfig().BASEURI) + apiUrl, request).toPromise().then((response: any) => {
          if (response?.session === false) {
            if (this.logoutCallback) {
              this.logoutCallback();
            }
          }
          if (response?.hasOwnProperty('token')) {
            if (!response?.token) {
              if (this.logoutCallback) this.logoutCallback();
            } else {
              if (this.refreshTokenCallback) this.refreshTokenCallback(response);
            }
          }
          res(response);
        }).catch((err) => rej(err));
    });
  }

  async logoutSession() {
    const userDetail = JSON.parse(this.session.getItem('user') || '{}');
    const request = {
      purpose: 'logout',
      login_id: userDetail?.user_id,
      device_id: localStorage.getItem('device_id'),
      platform: 'web'
    };
    await this.http.post(`${this.featureToggle.getConfig().BASEURI}auth/logout`, request).toPromise().then();
  }

  clone(obj: any) {
    if (typeof obj === 'object') {
      return JSON.parse(JSON.stringify(obj));
    }
    return obj;
  }

  validObjectTextPattern(request: any) {
    if (request) {
      return this.apiRegexPattern.test(
        JSON.stringify(request)
          .split(/[{}\[\]\n\t]/)
          .join(' ')
          .split('\\n')
          .join(' ')
          .split('\\t')
          .join(' ')
      );
    }
    return true;
  }

  displayPrecision(number: any, decimal: any) {
    if (typeof number === 'number' || typeof number === 'string') {
      return Number(Number(number).toFixed(decimal));
    }
    return number;
  }

  uniqueList(array: any, key: any) {
    return Array.from(new Set(array.map((d: any) => d[key])));
  }

  uniqueArray(array: any, key: any) {
    return this.uniqueList(array, key).map((d: any) => {
      return array.find((e: any) => e[key] === d);
    });
  }

  sortList(array: any, key?: any, type?: any, order = true): any[] | any {
    if (Array.isArray(array)) {
      return array.sort((a: any, b: any) => {
        const [firstVal, secondVal] = key ? [a[key], b[key]] : [a, b];
        if (type === 'number') {
          return order ? firstVal - secondVal : secondVal - firstVal;
        }
        return order
          ? firstVal?.localeCompare(secondVal)
          : secondVal?.localeCompare(firstVal);
      });
    }
    return array;
  }

  flat(array: any) {
    return array.reduce((a: any, b: any) => a.concat(b), []);
  }

  toast(type: any, text: any, summary?: any) {
    this.messageService.add({ severity: type, summary, detail: text });
  }

  exportExcel(rowData: any, columns: any, fileName: any) {
    const rows = rowData.map((data: any) => {
      const result: any = {};
      columns
        .filter((d: any) => !d.excludeExport)
        .forEach((col: any) => {
          if (col.field === 'employee_type') {
            result[col.header] = (data[col.field] === '0' || data[col.field] === '1') ? 'Self' : 'Agency User';
          } else if (col.field === 'added_datetime') {
            result[col.header] = moment(data[col.field]).format('MMMM Do YYYY, h:mm:ss a');
          } else {
            result[col.header] = data[col.field];
          }
        });
      return result;
    });
    const data = this.getStringData(rows);
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    const sheetName = fileName;
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(
      wb,
      `${moment(new Date()).format('yyyyMMDD')}_${fileName}.xlsx`
    );
  }

  downloadTable(elementId: any, fileName: any): void {
    const element = document.getElementById(elementId);
    if (!element) return;
    const ws: XLSX.WorkSheet = XLSX.utils.table_to_sheet(element);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, fileName);
    XLSX.writeFile(
      wb,
      `${moment(new Date()).format('yyyyMMdd')}_${fileName}.xlsx`
    );
  }

  private getStringData(tableRowData: any) {
    const tableData: any = [];
    tableRowData.map((mData: any) => {
      const rowData: any = {};
      Object.keys(mData).forEach((fData) => {
        if (!mData[fData]) {
          rowData[fData] = mData[fData];
        } else {
          rowData[fData] = mData[fData].toString();
        }
      });
      tableData.push(rowData);
    });
    return tableData;
  }

  getNotifiedCropList(
    array: any,
    stateMap: Map<any, any>,
    districtMap: Map<any, any>,
    notifiedMap: Map<any, any>
  ) {
    const keys = [...new Set(array.map((d: any) => d.crop_id))];
    return keys
      .map((crop_id: any) => {
        return array.find((d: any) => d.crop_id === crop_id);
      })
      .sort((a: any, b: any) => a.crop.localeCompare(b.crop));
  }

  terminateAPICalls() {
    this.abortController.abort();
  }

  getLocalDataFile(url: any) {
    return this.http.get(`${this.assetsFolder}/data/${url}.json`).toPromise(); // Use dynamic assetsFolder
  }

  loginAnalytics() {
    const userDetail = JSON.parse(this.session.getItem('user') || '{}');
    const eventName = environment.production ? 'web_login' : 'user_login';
    this.analytics.logEvent(eventName, {
      first_name: userDetail.first_name,
      last_name: userDetail.last_name,
      user_id: userDetail.user_id,
      email_id: userDetail.email_id,
      client_id: userDetail.unit_id || null,
    });
  }

  async pdfCompressor(url: any) {
    const pdfBuffer = await fetch(url).then((res) => res.arrayBuffer());
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pages = pdfDoc.getPages();
    for (let i = 0; i < pages.length; i++) {
      const page: any = pages[i];
      const contentStream = page.getContentStream();
      const contentBytes = contentStream.getContentsSize();
      const { width, height } = page.getSize();
      const newPage: any = pdfDoc.addPage([width, height]);
      const newContentStream = newPage.getContentStream().clone();
      newContentStream.sizeInBytes(contentBytes);
      newPage.setContents(newContentStream);
    }
    const compressedPdfBuffer = await pdfDoc.save();
    return compressedPdfBuffer;
  }

  private compressOperators(operators: PDFOperator[] | any): PDFOperator[] {
    const compressedOperators: PDFOperator[] = [];
    let prevOperator: PDFOperator | undefined;
    for (const operator of operators) {
      if (operator.fontName) {
        compressedOperators.push(operator);
        prevOperator = operator;
        continue;
      }
      if (prevOperator && this.isEquivalentOperator(prevOperator, operator)) {
        continue;
      }
      compressedOperators.push(operator);
      prevOperator = operator;
    }
    return compressedOperators;
  }

  private isEquivalentOperator(a: PDFOperator | any, b: PDFOperator | any): boolean {
    if (a.operator !== b.operator) {
      return false;
    }
    if (a.fontName !== b.fontName) {
      return false;
    }
    if (a.fontSize !== b.fontSize) {
      return false;
    }
    if (a.color !== b.color) {
      return false;
    }
    return true;
  }

  public checkSessionTime() {
    const expire = this.session.getItem('expire');
    let isValid = false;
    try {
      if (expire) {
        const expireTime = new Date(+atob(expire)).getTime();
        const currentTime = Date.now();
        if (currentTime < expireTime) {
          isValid = true;
        }
      }
    } catch (e) {}
    if (!isValid) {
      this.logoutSession();
      this.session.removeItem('user');
      this.session.removeItem('token');
      this.session.removeItem('expire');
      this.session.removeItem('location');
    }
    return isValid;
  }

  isIgnoreTokenPath(path: any) {
    return ['auth/login', 'auth/mobile_verification', 'auth/changepassword_otp', 'twofactorlogin/validateOtp', 'twofactorlogin/generateuserkey'].includes(path);
  }

  validateSession(apiUrl: any, rej: any) {
    if (!this.isIgnoreTokenPath(apiUrl) && !this.checkSessionTime()) {
      rej('Session Time out');
      this.toast('error', 'Session Expired, Please Login again and continue');
      this.removePopups();
      this.router.navigate(['/login']);
      return true;
    }
    return false;
  }

  removePopups() {
    document.querySelectorAll('.dropdown-menu').forEach((d) => d.classList.remove('show'));
    document
      .querySelectorAll('ngb-modal-backdrop,ngb-modal-window,.cdk-overlay-connected-position-bounding-box')
      .forEach((d) => d.remove());
    document.body.click();
  }
}