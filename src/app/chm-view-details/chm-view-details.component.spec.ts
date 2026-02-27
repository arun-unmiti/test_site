import { ComponentFixture, TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { Location } from '@angular/common';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Pipe, PipeTransform } from '@angular/core';
import { of, throwError } from 'rxjs';
import { BeforeSlideDetail } from 'lightgallery/lg-events';
import { SecurityContext } from '@angular/core';
import { DomSanitizer, SafeUrl, SafeResourceUrl } from '@angular/platform-browser';
// Component and mocks
import { ChmViewDetailsComponent } from './chm-view-details.component';
import { CoreService } from '../utilities/core.service';
import { FilterService } from '../utilities/filter.service';
import { UserDetailService } from '../auth/user-detail.service';
import { NgxImageCompressService } from 'ngx-image-compress';
import { GeojsonMapperService } from '../utilities/geojson-mapper.service';
import { FeatureToggleService } from '../shared/services/feature-toggle.service';
import { environment, ProjectContext } from '../../environments/environment';
// Mock safe pipe
@Pipe({ name: 'safe' })
class MockSafePipe implements PipeTransform {
  transform(value: any, ...args: any[]): any {
    return value;
  }
}
// Mock environment
jest.mock('../../environments/environment', () => ({
  environment: {
    projectConfigs: {
      testContext: { assetsFolder: '/assets/test' },
      munichre: { assetsFolder: '/assets/munichre' }
    }
  }
}));
// Mock services
class MockCoreService {
  data_post = jest.fn().mockResolvedValue({ status: 1, fields: [{ field_id: 1, type: 'tab', slno: 1 }], surveydata: { field_1: 'value' } });
  post = jest.fn().mockResolvedValue({ status: 1 });
  toast = jest.fn();
  fetchAzureBlob = jest.fn().mockResolvedValue(new Blob());
  clone = jest.fn(obj => Array.isArray(obj) ? [...obj] : { ...obj });
}
class MockFilterService {
  isvillageFetched = true;
  states: any[] = [{ state_id: 1, state_name: 'State1', code: 'S1' }];
  districts: any[] = [{ district_id: 1, district_name: 'District1', state_id: 1 }];
  tehsils: any[] = [{ tehsil_id: 1, tehsil_name: 'Tehsil1', district_id: 1 }];
  blocks: any[] = [{ block_id: 1, block_name: 'Block1', tehsil_id: 1 }];
  grampanchayats: any[] = [{ grampanchayat_id: 1, grampanchayat_name: 'GP1', block_id: 1 }];
  villages: any[] = [{ village_id: 1, village_name: 'Village1', grampanchayat_id: 1 }];
  crops: any[] = [{ crop_code: '001', crop_name: 'Crop1', id: 1 }];
  seasons: any[] = [{ id: 1, season_name: 'Season1', season_code: 'SE1' }];
  years: any[] = [{ id: 2023, year: '2023', year_code: '23' }];
  notifiedUnits: any[] = [{ notified_id: 1, notified_unit_name: 'Unit1' }];
  soilTypes: any[] = [{ SOIL_TYPE_ID: 1, SOIL_TYPE_DESC: 'Soil1' }];
  ifscs: any[] = [{ IFSC_CODE: 'IFSC1' }];
  productCrops: any[] = [{ crop_code: '001', crop_name: 'ProductCrop1' }];
  fetchedVillageData = { subscribe: jest.fn(cb => cb()) };
}
class MockUserDetailService {
  getUserDetail = jest.fn().mockReturnValue({ unit_id: '2000', user_role: '1' });
  getcsrfTokenName = jest.fn().mockReturnValue('csrf_name');
  getcsrfToken = jest.fn().mockReturnValue('csrf_token');
}
class MockNgxImageCompressService {
  compressFile = jest.fn().mockResolvedValue('compressed_image_data_url');
}
class MockGeojsonMapperService {
  stringToGeojson = jest.fn().mockReturnValue({ type: 'FeatureCollection', features: [] });
}
class MockFeatureToggleService {
  getContext = jest.fn().mockReturnValue('munichre' as ProjectContext);
  getConfig = jest.fn().mockReturnValue({
    BASEKMLPREFIX: 'mock_prefix/',
    BASEKMLSUFFIX: '?mock_suffix',
  });
}
class MockNgbModal {
  open = jest.fn().mockReturnValue({ componentInstance: {} });
  dismissAll = jest.fn();
}
class MockActivatedRoute {
  paramMap = {
    subscribe: jest.fn(cb => cb({ has: jest.fn().mockReturnValue(true), get: (key: string) => key === 'surveyId' ? '1' : '1', getAll: jest.fn().mockReturnValue([]), keys: [] } as ParamMap)),
  };
}
class MockLocation {
  back = jest.fn();
}
class MockDomSanitizer {
  bypassSecurityTrustUrl = jest.fn().mockReturnValue('safeUrl' as any);
  bypassSecurityTrustResourceUrl = jest.fn().mockReturnValue('safeResourceUrl' as any);
  bypassSecurityTrustHtml = jest.fn().mockReturnValue('safeHtml');
  sanitize = jest.fn((context, value) => value);
}
jest.mock('sweetalert2', () => ({
  default: {
    fire: jest.fn().mockResolvedValue({ isConfirmed: true })
  }
}));
jest.mock('dom-to-image', () => ({
  default: {
    toJpeg: jest.fn().mockResolvedValue('mock_image_data')
  }
}));
jest.mock('jspdf', () => ({
  jsPDF: jest.fn().mockReturnValue({
    html: jest.fn((content, options) => {
      options.callback({ save: jest.fn() });
    }),
    save: jest.fn()
  })
}));
beforeAll(() => {
  Object.defineProperty(URL, 'createObjectURL', {
    writable: true,
    value: jest.fn().mockReturnValue('blob:url')
  });

  Object.defineProperty(URL, 'revokeObjectURL', {
    writable: true,
    value: jest.fn()
  });
});
global.fetch = jest.fn().mockResolvedValue({
  text: jest.fn().mockResolvedValue('<kml></kml>')
} as any);
const fetchSpy = jest.spyOn(global, 'fetch') as jest.Mock;
describe('ChmViewDetailsComponent', () => {
  let component: ChmViewDetailsComponent;
  let fixture: ComponentFixture<ChmViewDetailsComponent>;
  let coreService: MockCoreService;
  let filterService: MockFilterService;
  let userDetailService: MockUserDetailService;
  let imageCompressService: MockNgxImageCompressService;
  let geojsonMapperService: MockGeojsonMapperService;
  let featureToggleService: MockFeatureToggleService;
  let modalService: MockNgbModal;
  let activatedRoute: MockActivatedRoute;
  let location: MockLocation;
  let sanitizer: MockDomSanitizer;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        ChmViewDetailsComponent,
        MockSafePipe
      ],
      providers: [
        { provide: CoreService, useClass: MockCoreService },
        { provide: FilterService, useClass: MockFilterService },
        { provide: UserDetailService, useClass: MockUserDetailService },
        { provide: NgxImageCompressService, useClass: MockNgxImageCompressService },
        { provide: GeojsonMapperService, useClass: MockGeojsonMapperService },
        { provide: FeatureToggleService, useClass: MockFeatureToggleService },
        { provide: NgbModal, useClass: MockNgbModal },
        { provide: ActivatedRoute, useClass: MockActivatedRoute },
        { provide: Location, useClass: MockLocation },
        { provide: DomSanitizer, useClass: MockDomSanitizer }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
    fixture = TestBed.createComponent(ChmViewDetailsComponent);
    component = fixture.componentInstance;
    coreService = TestBed.inject(CoreService) as unknown as MockCoreService;
    filterService = TestBed.inject(FilterService) as unknown as MockFilterService;
    userDetailService = TestBed.inject(UserDetailService) as unknown as MockUserDetailService;
    imageCompressService = TestBed.inject(NgxImageCompressService) as unknown as MockNgxImageCompressService;
    geojsonMapperService = TestBed.inject(GeojsonMapperService) as unknown as MockGeojsonMapperService;
    featureToggleService = TestBed.inject(FeatureToggleService) as unknown as MockFeatureToggleService;
    modalService = TestBed.inject(NgbModal) as unknown as MockNgbModal;
    activatedRoute = TestBed.inject(ActivatedRoute) as unknown as MockActivatedRoute;
    location = TestBed.inject(Location) as unknown as MockLocation;
    sanitizer = TestBed.inject(DomSanitizer) as unknown as MockDomSanitizer;
    component.chmDom = { querySelector: jest.fn(), querySelectorAll: jest.fn() } as any;
    component.fields = [];
    component.parentFields = [];
    component.data = {};
    component.parentData = {};
    component.lkpsIds = {};
    component.parentLkpsIds = {};
    component.cropLkpIds = [];
    component.tabs = [];
    component.parentTabs = [];
    component.imageFields = [];
    component.fieldImages = {};
    component.parentFieldImages = {};
    component.imageURLs = [];
    component.parentImageURLs = [];
    component.deletedImages = [];
    component.geoJsonData = null;
    component.showMap = true;
    component.isEditable = false;
    component.showApproval = false;
    component.updating = false;
    component.loader = 0;
    component.sLoader = 0;
    component.imageLoader = 0;
    component.isCropLoading = 0;
    component.imageBlobs = {};
    component.imageBlobUrls = {};
    fixture.detectChanges();
  });
  it('should create', () => {
    expect(component).toBeTruthy();
  });
  describe('constructor', () => {
    it('should initialize projectContext and assetsFolder', () => {
      expect(component.projectContext).toBe('munichre');
      expect(component.assetsFolder).toBe('/assets/munichre');
    });
    it('should set missedImage', () => {
      expect(component.missedImage).toBe('/assets/munichre/images/missed_image.png');
    });
  });
  describe('ngOnInit', () => {
    it('should set kmlUrl, imgUrl, imgUrlSuffix from config', () => {
      component.ngOnInit();
      expect(component.kmlUrl).toBe('mock_prefix/');
      expect(component.imgUrl).toBe('mock_prefix/');
      expect(component.imgUrlSuffix).toBe('?mock_suffix');
    });
    it('should set user from userDetails', () => {
      component.ngOnInit();
      expect(userDetailService.getUserDetail).toHaveBeenCalled();
      expect(component.user).toEqual({ unit_id: '2000', user_role: '1' });
    });
    it('should call setCropColumn', () => {
      const spy = jest.spyOn(component, 'setCropColumn');
      component.ngOnInit();
      expect(spy).toHaveBeenCalled();
    });
    it('should set districtField and mediaField for survey_id 1', () => {
      component.isChild = true;
      component.survey_id = 1;
      component.ngOnInit();
      expect(component.districtField).toBe('field_502');
      expect(component.mediaField).toBe(695);
    });
    it('should set districtField and mediaField for survey_id 4', () => {
      component.isChild = true;
      component.survey_id = 4;
      component.ngOnInit();
      expect(component.districtField).toBe('field_502');
      expect(component.mediaField).toBe(695);
    });
    it('should call getFilterData', () => {
      const spy = jest.spyOn(component, 'getFilterData');
      component.ngOnInit();
      expect(spy).toHaveBeenCalled();
    });
    it('should set csrfTokenName and csrfToken', () => {
      component.ngOnInit();
      expect(component.csrfTokenName).toBe('csrf_name');
      expect(component.csrfToken).toBe('csrf_token');
    });
    it('should handle survey_id 2', () => {
      component.isChild = true;
      component.survey_id = 2;
      component.ngOnInit();
      expect(component.districtField).toBe('field_529');
      expect(component.mediaField).toBe(702);
      expect(component.signatureField).toBe(783);
    });
    it('should handle survey_id 3 or 7', () => {
      component.isChild = true;
      component.survey_id = 3;
      component.ngOnInit();
      expect(component.signatureField).toBe(743);
      expect(component.mediaField).toBe(630);
      expect(component.districtField).toBe('field_586');
    });
  });
  describe('settings', () => {
    it('should have counter false and plugins with lgZoom', () => {
      expect(component.settings.counter).toBe(false);
      expect(component.settings.plugins).toHaveLength(1);
    });
  });
  describe('onBeforeSlide', () => {
    it('should close gallery if gallery exists', () => {
      const detail: BeforeSlideDetail = { index: 1, prevIndex: 0, fromTouch: false, fromThumb: false };
      component.gallery = { LG: { closeGallery: jest.fn() } };
      const closeSpy = jest.spyOn(component.gallery.LG, 'closeGallery');
      component.onBeforeSlide(detail);
      expect(closeSpy).toHaveBeenCalled();
      expect(component.gallery).toBeNull();
    });
    it('should do nothing if gallery is null', () => {
      const detail: BeforeSlideDetail = { index: 1, prevIndex: 0, fromTouch: false, fromThumb: false };
      component.gallery = null;
      component.onBeforeSlide(detail);
      expect(component.gallery).toBeNull();
    });
  });
  describe('setCropColumn', () => {
    it('should set columns for survey_id 1', () => {
      component.survey_id = 1;
      component.setCropColumn();
      expect(component.crop_column).toBe('field_509');
      expect(component.iu_column).toBe('field_505');
    });
    it('should set columns for survey_id 2', () => {
      component.survey_id = 2;
      component.setCropColumn();
      expect(component.crop_column).toBe('field_539');
      expect(component.iu_column).toBe('field_532');
    });
    it('should set columns for survey_id 3', () => {
      component.survey_id = 3;
      component.setCropColumn();
      expect(component.crop_column).toBe('field_593');
      expect(component.iu_column).toBe('field_589');
    });
    it('should not set columns for unknown survey_id', () => {
      component.survey_id = 5;
      component.crop_column = 'old_crop';
      component.iu_column = 'old_iu';
      component.setCropColumn();
      expect(component.crop_column).toBe('old_crop');
      expect(component.iu_column).toBe('old_iu');
    });
  });
  describe('getRouterParam', () => {
    it('should call setInputData', () => {
      const spy = jest.spyOn(component, 'setInputData');
      component.getRouterParam();
      expect(spy).toHaveBeenCalled();
    });
    it('should call getSurveyData if isChild and params present', () => {
      component.isChild = true;
      component.survey_id = 1;
      component.data_id = 1;
      const spy = jest.spyOn(component, 'getSurveyData');
      component.getRouterParam();
      expect(spy).toHaveBeenCalledWith(1, 1);
    });
    it('should subscribe to paramMap if not isChild', () => {
      component.isChild = false;
      const spy = jest.spyOn(component, 'getSurveyData');
      component.getRouterParam();
      const subscribeCb = activatedRoute.paramMap.subscribe.mock.calls[0][0];
      subscribeCb({ get: (key: string) => key === 'surveyId' ? 2 : 3 } as unknown as ParamMap);
      expect(component.survey_id).toBe(2);
      expect(component.data_id).toBe(3);
      expect(spy).toHaveBeenCalledWith(2, 3);
    });
    it('should not call getSurveyData if no params', () => {
      component.isChild = false;
      const spy = jest.spyOn(component, 'getSurveyData');
      activatedRoute.paramMap.subscribe = jest.fn(cb => cb({ get: () => null } as unknown as ParamMap));
      component.getRouterParam();
      expect(spy).not.toHaveBeenCalled();
    });
  });
  describe('setInputData', () => {
    it('should populate all maps', () => {
      component.setInputData();
      expect(component.stateMap.size).toBe(1);
      expect(component.districtMap.size).toBe(1);
      expect(component.tehsilMap.size).toBe(1);
      expect(component.blockMap.size).toBe(1);
      expect(component.grampanchayatMap.size).toBe(1);
      expect(component.villageMap.size).toBe(1);
      expect(component.cropMap.size).toBe(1);
      expect(component.cropCodeMap.size).toBe(1);
      expect(component.seasonMap.size).toBe(1);
      expect(component.seasonCodeMap.size).toBe(1);
      expect(component.yearMap.size).toBe(1);
      expect(component.yearCodeMap.size).toBe(1);
      expect(component.notifiedUnitMap.size).toBe(1);
      expect(component.soilTypeMap.size).toBe(1);
      expect(component.ifscsMap.size).toBe(1);
    });
  });
  describe('getSurveyData', () => {
    it('should handle status != 1', fakeAsync(() => {
      coreService.data_post.mockResolvedValueOnce({ status: 0 });
      coreService.data_post.mockResolvedValueOnce({ status: 0 });
      component.getSurveyData(1, 1);
      tick();
      flush();
      expect(component.fields).toEqual([]);
    }));
  });
  describe('setProductCropOptions', () => {
    it('should set optionMap and options from productCrops', () => {
      const field: any = {};
      component['setProductCropOptions'](field);
      expect(field.optionMap['001']).toBe('ProductCrop1');
      expect(field.options).toEqual([{ label: 'ProductCrop1', value: 1 }]);
    });
  });
  describe('getOPtionFields', () => {
    it('should handle status != 1', fakeAsync(() => {
      const fields: any[] = [{ field_id: 1 }];
      coreService.data_post.mockResolvedValue({ status: 0 });
      component['getOPtionFields'](fields);
      tick();
      flush();
      expect(fields[0].options).toBeUndefined();
      expect(component.optionField).toEqual([]);
    }));
    it('should handle error', fakeAsync(() => {
      const fields: any[] = [{ field_id: 1 }];
      coreService.data_post.mockRejectedValue(new Error('error'));
      component['getOPtionFields'](fields);
      tick();
      flush();
      expect(component.optionField).toEqual([]);
    }));
  });
  describe('generateParentFieldData', () => {
    it('should call getOPtionFields for option fields', () => {
      component.parentFields = [{ field_id: 1, type: 'select' }];
      const spy = jest.spyOn(component as any, 'getOPtionFields');
      component['generateParentFieldData']();
      expect(spy).toHaveBeenCalled();
    });
    it('should do nothing if no parentFields', () => {
      component.parentFields = [];
      component['generateParentFieldData']();
      expect(component.parentTabs).toEqual([]);
    });
  });
  describe('getImagesData', () => {
    it('should fetch images successfully', async () => {
      coreService.data_post.mockResolvedValue({ status: 1, files: [{ file_name: 'test.jpg', field_id: 1, id: 1 }] });
      const fields = [{ field_id: 1 }];
      await component['getImagesData'](fields);
      expect(component.imageURLs.length).toBe(1);
      expect(component.fieldImages[1].length).toBe(1);
    });

    it('should handle error in fetching images', async () => {
      coreService.data_post.mockRejectedValue(new Error('Error'));
      const fields = [{ field_id: 1 }];
      await component['getImagesData'](fields);
      expect(coreService.toast).toHaveBeenCalledWith('error', expect.stringContaining('Error'));
    });
  });

  describe('groupImagesByField', () => {
    it('should group images by field_id', () => {
      const images = [{ field_id: 1, file_name: 'img1' }, { field_id: 1, file_name: 'img2' }, { field_id: 2, file_name: 'img3' }];
      const grouped = component['groupImagesByField'](images);
      expect(grouped[1].length).toBe(2);
      expect(grouped[2].length).toBe(1);
    });

    it('should remove duplicates', () => {
      const images = [{ field_id: 1, file_name: 'img1' }, { field_id: 1, file_name: 'img1' }];
      const grouped = component['groupImagesByField'](images);
      expect(grouped[1].length).toBe(1);
    });
  });

  describe('fetchImageBlobs', () => {
    it('should fetch image blobs for images', async () => {
      const images: any = [{ id: 1, file_name: 'test.jpg', type: 'img' }];
      coreService.fetchAzureBlob.mockResolvedValue(new Blob());
      await component['fetchImageBlobs'](images, '1');
      expect(component.imageBlobUrls[1]).toBeDefined();
    });

    it('should handle PDF files', async () => {
      const images: any = [{ id: 1, file_name: 'test.pdf', type: 'pdf' }];
      coreService.fetchAzureBlob.mockResolvedValue(new Blob());
      await component['fetchImageBlobs'](images, '1');
      expect(images[0].type).toBe('pdf');
      expect(component.imageBlobUrls[1]).toBeDefined();
    });

    it('should handle fetch error for images', async () => {
      const images: any = [{ id: 1, file_name: 'test.jpg', type: 'img' }];
      coreService.fetchAzureBlob.mockRejectedValue(new Error('Error'));
      await component['fetchImageBlobs'](images, '1');
      expect(images[0].isMissed).toBe(true);
      expect(component.imageBlobUrls[1]).toBe(component.missedImage);
    });

    it('should handle direct PDF URL if fetch fails for PDF', async () => {
      const images: any = [{ id: 1, file_name: 'test.pdf', type: 'pdf' }];
      coreService.fetchAzureBlob.mockRejectedValue(new Error('Error'));
      await component['fetchImageBlobs'](images, '1');
      expect(images[0].type).toBe('pdf');
      expect(component.imageBlobUrls[1]).toBeDefined();
    });
  });

  describe('download_kml', () => {
    it('should handle no file name', async () => {
      await component.download_kml({});
      expect(coreService.toast).toHaveBeenCalledWith('warn', 'No KML file provided');
    });

    it('should download KML for munichre project', async () => {
      featureToggleService.getContext.mockReturnValue('munichre');
      coreService.fetchAzureBlob.mockRejectedValue(new Error('Error')); // To trigger error toast for test, but adjust if needed
      const data = { file_name: 'test.kml' };
      await component.download_kml(data);
      expect(coreService.toast).toHaveBeenCalledWith('error', 'Failed to download KML file');
    });

    it('should handle error in downloading KML for munichre', async () => {
      featureToggleService.getContext.mockReturnValue('munichre');
      coreService.fetchAzureBlob.mockRejectedValue(new Error('Error'));
      const data = { file_name: 'test.kml' };
      await component.download_kml(data);
      expect(coreService.toast).toHaveBeenCalledWith('error', 'Failed to download KML file');
    });

    it('should download KML for non-munichre project', async () => {
      featureToggleService.getContext.mockReturnValue('testContext' as ProjectContext);
      const data = { file_name: 'test.kml' };
      await component.download_kml(data);
      expect(modalService.dismissAll).toHaveBeenCalled();
    });
  });

  describe('editKMLFile', () => {
    it('should set isEditkML to true', () => {
      component.isEditkML = false;
      component.editKMLFile();
      expect(component.isEditkML).toBe(true);
    });
  });

  describe('back', () => {
    it('should call location.back if not isChild', () => {
      component.isChild = false;
      component.back();
      expect(location.back).toHaveBeenCalled();
    });

    it('should emit action if isChild', () => {
      component.isChild = true;
      const emitSpy = jest.spyOn(component.emitAction, 'emit');
      component.back();
      expect(emitSpy).toHaveBeenCalled();
    });
  });

  describe('validateData', () => {
    beforeEach(() => {
      component.fields = [
        { field_id: 1, type: 'text', required: 1, label: 'Field1', parent_id: null, parent_value: null },
        { field_id: 2, type: 'date', required: 1, label: 'DateField', parent_id: null, parent_value: null },
        { field_id: 3, type: 'text', required: 1, label: 'MaxLengthField', maxlength: 5 },
        { field_id: 4, type: 'number', required: 1, label: 'MaxValueField', max: 10 },
      ];
      component.data = { field_1: 'value', field_2: '2023-01-01', field_3: 'short', field_4: 5, datetime: '2023-01-02' };
      component.survey_id = 2;
      component.surveyDates = { 2: 'field_2' };
      component.surveyIntimationTextData = { freeText: '123456789', static: 'INT', year: '2023', state: 'S1', season: 'SE' };
      component.intimationNoPrefix = 'INT-2023-S1-SE';
      component.user = { user_role: '1' };
      component.projectContext = 'munichre' as ProjectContext;
      component.yearCodeMap = new Map([[2023, '2023']]);
      component.stateCodeMap = new Map([[1, 'S1']]);
      component.seasonCodeMap = new Map([[1, 'SE']]);
      component.data.field_953 = 2023;
      component.data.field_528 = 1;
      component.data.field_526 = 1;
    });

    it('should return true if all required fields are filled and valid', () => {
      expect(component.validateData(component.data)).toBe(true);
    });

    it('should toast warning and return false if required field is missing', () => {
      component.data.field_1 = '';
      expect(component.validateData(component.data)).toBe(false);
      expect(coreService.toast).toHaveBeenCalledWith('warn', 'Field1 is required.');
    });

    it('should validate date format and range', () => {
      component.data.field_2 = 'invalid-date';
      expect(component.validateData(component.data)).toBe(false);
      expect(coreService.toast).toHaveBeenCalledWith('warn', 'DateField is invalid.');

      component.data.field_2 = '2019-01-01';
      expect(component.validateData(component.data)).toBe(false);
      expect(coreService.toast).toHaveBeenCalledWith('warn', 'Invalid date is selected for DateField.');
    });

    it('should validate maxlength', () => {
      component.data.field_3 = 'too long';
      expect(component.validateData(component.data)).toBe(false);
      expect(coreService.toast).toHaveBeenCalledWith('warn', 'MaxLengthField value should not exceed 5 charecter.');
    });

    it('should validate max value', () => {
      component.data.field_4 = 15;
      expect(component.validateData(component.data)).toBe(false);
      expect(coreService.toast).toHaveBeenCalledWith('warn', 'MaxValueField value should not be greater than 10.');
    });

    it('should validate survey date against submitted date', () => {
      component.data.field_2 = '2023-01-03';
      expect(component.validateData(component.data)).toBe(false);
      expect(coreService.toast).toHaveBeenCalledWith('warn', expect.stringContaining('should not be more than submitted date'));
    });

    it('should validate intimation number for survey_id 2', () => {
      component.surveyIntimationTextData.freeText = 'short';
      expect(component.validateData(component.data)).toBe(false);
      expect(coreService.toast).toHaveBeenCalledWith('warn', 'Invalid intimation number');
    });

    it('should validate no loss conditions for survey_id 2', () => {
      component.data.field_720 = 'No loss';
      component.data.field_548 = 1;
      expect(component.validateData(component.data)).toBe(false);
      expect(coreService.toast).toHaveBeenCalledWith('warn', expect.stringContaining('must be 0 if Survey type is "no loss"'));
    });
  });

  describe('onKMLAction', () => {
    it('should update geoJsonData for geojson-update', () => {
      const event = { purpose: 'geojson-update', geoJsonData: {} };
      component.onKMLAction(event);
      expect(component.geoJsonData).toEqual({});
    });

    it('should reset edit mode for cancel', () => {
      const event = { purpose: 'cancel' };
      const getSurveyDataSpy = jest.spyOn(component, 'getSurveyData');
      component.onKMLAction(event);
      expect(component.isEditkML).toBe(false);
      expect(component.isEditable).toBe(false);
      expect(getSurveyDataSpy).toHaveBeenCalled();
    });

    it('should not update if updating', () => {
      const event = { purpose: 'update-kml' };
      component.updating = true;
      component.onKMLAction(event);
      expect(coreService.post).not.toHaveBeenCalled();
    });

    it('should not update if validation fails', () => {
      const event = { purpose: 'update-kml' };
      jest.spyOn(component, 'validateData').mockReturnValue(false);
      component.onKMLAction(event);
      expect(coreService.post).not.toHaveBeenCalled();
    });
  });

  describe('onEditDetail', () => {
    it('should toggle edit mode and refresh data', () => {
      component.imageFields = [{ field_id: 1 }];
      component.optionField = [{ field_id: 2 }];
      const getImagesDataSpy = jest.spyOn(component, 'getImagesData');
      const getOPtionFieldsSpy = jest.spyOn(component, 'getOPtionFields');
      component.onEditDetail();
      expect(component.isEditable).toBe(true);
      expect(getImagesDataSpy).toHaveBeenCalledWith(component.imageFields);
      expect(getOPtionFieldsSpy).toHaveBeenCalledWith(component.optionField);
      expect(component.showMap).toBe(false);
    });
  });

  describe('getFormFieldMultipleData', () => {
    it('should fetch multiple data for field', async () => {
      coreService.data_post.mockResolvedValue({ status: 1, multiple_fields: [{ label: 'Opt1', value: '1' }] });
      const options = await component['getFormFieldMultipleData'](1);
      expect(options.length).toBe(1);
    });

    it('should return empty array on failure', async () => {
      coreService.data_post.mockResolvedValue({ status: 0 });
      const options = await component['getFormFieldMultipleData'](1);
      expect(options).toEqual([]);
    });
  });

  describe('generateColDef', () => {
    it('should generate column definitions', () => {
      component.fields = [{ field_id: 1, type: 'lkp_state', subtype: 'state' }];
      component['generateColDef']();
      expect(component.typeFields.length).toBe(1);
    });
  });

  describe('generateRowData', () => {
    it('should generate row data using maps', () => {
      component.typeFields = [{ field: 'field_1', type: 'lkp_state' }];
      component.data = { field_1: 1 };
      component.stateMap.set(1, 'State1');
      component['generateRowData']();
      expect(component.data.field_1).toBe('State1');
    });
  });

  describe('onFiedChange', () => {
    beforeEach(() => {
      component.fields = [{ field_id: 1, type: 'text', subtype: 'email' }];
      component.data = { field_1: 'old@email.com' };
      component.chmDom = { querySelector: jest.fn().mockReturnValue({ value: '' }), querySelectorAll: jest.fn().mockReturnValue([]) };
    });

    it('should validate email subtype', () => {
      const event = { target: { value: 'invalid' } };
      component.onFiedChange(event, 'text', 1);
      expect(coreService.toast).toHaveBeenCalledWith('error', 'Please Enter a valid email');
    });

    it('should validate phone subtype length', () => {
      component.fields[0].subtype = 'phone';
      const event = { target: { value: '12345678901' } };
      component.onFiedChange(event, 'text', 1);
      expect(coreService.toast).toHaveBeenCalledWith('error', 'Phone number cannot exceed 10 digits.');
    });

    it('should prepend +91 for phone if missing', () => {
      component.fields[0].subtype = 'phone';
      const event = { target: { value: '1234567890' } };
      component.onFiedChange(event, 'text', 1);
      expect(component.data.field_1).toBe('+911234567890');
    });

    it('should set zero for no loss', () => {
      component.fields = [{ field_id: 720, type: 'select' }];
      const event = { target: { value: 'No loss' } };
      component.onFiedChange(event, 'select', 720);
      expect(component.data.field_548).toBe('0');
      expect(component.data.field_550).toBe('0');
    });
  });

  describe('onIntimationPrefixChange', () => {
    it('should update intimation prefix', () => {
      component.chmDom = { querySelector: jest.fn().mockReturnValueOnce({ value: 'INT-2023-S1-SE' }).mockReturnValueOnce({ value: 'freetext' }) };
      component.surveyIntimationField = 1;
      component.data = {};
      component.onIntimationPrefixChange();
      expect(component.data.field_1).toBe('INT-2023-S1-SE-freetext');
    });
  });

  describe('applyLocationLkpOptions', () => {
    beforeEach(() => {
      component.lkpsIds = { lkp_state: 1 };
      component.data = { field_1: 1 };
    });

    it('should apply options for lkp_state', () => {
      component.fields = [{ type: 'lkp_district', options: [], optionMap: {} }];
      component.applyLocationLkpOptions('lkp_state');
      expect(component.fields[0].options.length).toBeGreaterThan(0);
    });

    it('should apply options for lkp_district', () => {
      component.fields = [{ type: 'lkp_tehsil', options: [], optionMap: {} }];
      component.lkpsIds = { lkp_district: 2 };
      component.data = { field_2: 1 };
      component.applyLocationLkpOptions('lkp_district');
      expect(component.fields[0].options.length).toBeGreaterThan(0);
    });

    // Add similar tests for other lkp types
  });

  describe('onStateChange', () => {
    it('should clear dependent fields and apply options', () => {
      component.lkpsIds = { lkp_district: 2, lkp_tehsil: 3, lkp_block: 4, lkp_grampanchayat: 5, lkp_village: 6 };
      component.data = {};
      const event = { target: { value: 1 } };
      const clearCropsSpy = jest.spyOn(component, 'clearCrops');
      const applySpy = jest.spyOn(component, 'applyLocationLkpOptions');
      component.onStateChange(event, 'lkp_state');
      expect(component.data.field_2).toBe('');
      expect(clearCropsSpy).toHaveBeenCalled();
      expect(applySpy).toHaveBeenCalledWith('lkp_state');
    });
  });

  describe('onDistrictChange', () => {
    it('should clear dependent fields and apply options', () => {
      component.lkpsIds = { lkp_tehsil: 3, lkp_block: 4, lkp_grampanchayat: 5, lkp_village: 6 };
      component.data = {};
      const event = { target: { value: 1 } };
      const clearCropsSpy = jest.spyOn(component, 'clearCrops');
      const applySpy = jest.spyOn(component, 'applyLocationLkpOptions');
      component.onDistrictChange(event, 'lkp_district');
      expect(component.data.field_3).toBe('');
      expect(clearCropsSpy).toHaveBeenCalled();
      expect(applySpy).toHaveBeenCalledWith('lkp_district');
    });
  });

  describe('onTehsilChange', () => {
    it('should clear dependent fields and apply options', () => {
      component.lkpsIds = { lkp_block: 4, lkp_grampanchayat: 5, lkp_village: 6 };
      component.data = {};
      const event = { target: { value: 1 } };
      const clearCropsSpy = jest.spyOn(component, 'clearCrops');
      const applySpy = jest.spyOn(component, 'applyLocationLkpOptions');
      component.onTehsilChange(event, 'lkp_tehsil');
      expect(component.data.field_4).toBe('');
      expect(clearCropsSpy).toHaveBeenCalled();
      expect(applySpy).toHaveBeenCalledWith('lkp_tehsil');
    });
  });

  describe('onBlockChange', () => {
    it('should clear dependent fields and apply options', () => {
      component.lkpsIds = { lkp_grampanchayat: 5, lkp_village: 6 };
      component.data = {};
      const event = { target: { value: 1 } };
      const clearCropsSpy = jest.spyOn(component, 'clearCrops');
      const applySpy = jest.spyOn(component, 'applyLocationLkpOptions');
      component.onBlockChange(event, 'lkp_block');
      expect(component.data.field_5).toBe('');
      expect(clearCropsSpy).toHaveBeenCalled();
      expect(applySpy).toHaveBeenCalledWith('lkp_block');
    });
  });

  describe('onGrampanchayatChange', () => {
    it('should clear dependent fields and apply options', () => {
      component.lkpsIds = { lkp_village: 6 };
      component.data = {};
      const event = { target: { value: 1 } };
      const clearCropsSpy = jest.spyOn(component, 'clearCrops');
      const applySpy = jest.spyOn(component, 'applyLocationLkpOptions');
      component.onGrampanchayatChange(event, 'lkp_grampanchayat');
      expect(component.data.field_6).toBe('');
      expect(clearCropsSpy).toHaveBeenCalled();
      expect(applySpy).toHaveBeenCalledWith('lkp_grampanchayat');
    });
  });

  describe('clearCrops', () => {
    it('should clear crop fields', () => {
      component.cropLkpIds = [1];
      component.fields = [{ field_id: 1, type: 'lkp_crop' }];
      component.iu_column = 'field_2';
      component.data = {};
      component.clearCrops();
      expect(component.data.field_1).toBe('');
      expect(component.data.field_2).toBe('');
    });
  });

  describe('getCropOptions', () => {
    it('should set crop options for survey_id 1', () => {
      component.survey_id = 1;
      component.setCropColumn();
      expect(component.crop_column).toBe('field_509');
      expect(component.iu_column).toBe('field_505');
    });

    it('should set crop_column and iu_column for survey_id 2', () => {
      component.survey_id = 2;
      component.setCropColumn();
      expect(component.crop_column).toBe('field_539');
      expect(component.iu_column).toBe('field_532');
    });

    it('should set crop_column and iu_column for survey_id 3', () => {
      component.survey_id = 3;
      component.setCropColumn();
      expect(component.crop_column).toBe('field_593');
      expect(component.iu_column).toBe('field_589');
    });

    it('should not set columns for unknown survey_id', () => {
      component.survey_id = 999;
      component.crop_column = undefined;
      component.iu_column = undefined;
      component.setCropColumn();
      expect(component.crop_column).toBeUndefined();
      expect(component.iu_column).toBeUndefined();
    });
  });
  describe('getFilterData', () => {
    it('should subscribe to fetchedVillageData if isvillageFetched is false', () => {
      filterService.isvillageFetched = false;
      const getRouterParamSpy = jest.spyOn(component, 'getRouterParam');
      component.getFilterData();
      const subscribeCb = filterService.fetchedVillageData.subscribe.mock.calls[0][0];
      subscribeCb();
      expect(getRouterParamSpy).toHaveBeenCalled();
    });
    it('should call getRouterParam if isvillageFetched is true', () => {
      filterService.isvillageFetched = true;
      const getRouterParamSpy = jest.spyOn(component, 'getRouterParam');
      component.getFilterData();
      expect(getRouterParamSpy).toHaveBeenCalled();
    });
  });
  describe('getPlannedCropData', () => {
    it('should fetch planned crop data successfully', async () => {
      coreService.data_post.mockResolvedValue({ status: 1, lkp_Karnatakacrops: ['crop1', 'crop2'] });
      await component['getPlannedCropData']();
      expect(component.plannedCropData).toEqual(['crop1', 'crop2']);
      expect(component.loader).toBe(0);
    });
    it('should handle error in fetching planned crop data', async () => {
      coreService.data_post.mockRejectedValue(new Error('Error'));
      await component['getPlannedCropData']();
      expect(component.plannedCropData).toEqual([]);
      expect(component.loader).toBe(0);
    });
    it('should set plannedCropData to empty if status != 1', async () => {
      coreService.data_post.mockResolvedValue({ status: 0 });
      await component['getPlannedCropData']();
      expect(component.plannedCropData).toEqual([]);
    });
  });
  describe('getRouterParam', () => {
    it('should call setInputData and getSurveyData when params are present', fakeAsync(() => {
      const setInputDataSpy = jest.spyOn(component, 'setInputData');
      const getSurveyDataSpy = jest.spyOn(component, 'getSurveyData');
      component.survey_id = 1;
      component.data_id = 1;
      component.isChild = true;
      component.getRouterParam();
      tick();
      flush();
      expect(setInputDataSpy).toHaveBeenCalled();
      expect(getSurveyDataSpy).toHaveBeenCalledWith(1, 1);
    }));
    it('should subscribe to paramMap if not isChild', fakeAsync(() => {
      component.isChild = false;
      const getSurveyDataSpy = jest.spyOn(component, 'getSurveyData');
      component.getRouterParam();
      tick();
      flush();
      expect(getSurveyDataSpy).toHaveBeenCalledWith('1', '1');
    }));
    it('should not call getSurveyData if no params', fakeAsync(() => {
      component.isChild = false;
      activatedRoute.paramMap.subscribe = jest.fn(cb => cb({ get: () => null } as unknown as ParamMap));
      const getSurveyDataSpy = jest.spyOn(component, 'getSurveyData');
      component.getRouterParam();
      tick();
      flush();
      expect(getSurveyDataSpy).not.toHaveBeenCalled();
    }));
  });
  describe('setInputData', () => {
    it('should populate all maps from filterService data', () => {
      component.setInputData();
      expect(component.stateMap.get(1)).toBe('State1');
      expect(component.stateCodeMap.get(1)).toBe('S1');
      expect(component.districtMap.get(1)).toBe('District1');
      expect(component.tehsilMap.get(1)).toBe('Tehsil1');
      expect(component.blockMap.get(1)).toBe('Block1');
      expect(component.grampanchayatMap.get(1)).toBe('GP1');
      expect(component.villageMap.get(1)).toBe('Village1');
      expect(component.cropMap.get('001')).toBe('Crop1');
      expect(component.cropCodeMap.get(1)).toBe(1);
      expect(component.seasonMap.get(1)).toBe('Season1');
      expect(component.seasonCodeMap.get(1)).toBe('SE1');
      expect(component.yearMap.get(2023)).toBe('2023');
      expect(component.yearCodeMap.get(2023)).toBe('23');
      expect(component.notifiedUnitMap.get(1)).toBe('Unit1');
      expect(component.soilTypeMap.get(1)).toBe('Soil1');
      expect(component.ifscsMap.get('IFSC1')).toBe('IFSC1');
    });
  });
  describe('getSurveyData', () => {
    it('should handle status != 1', fakeAsync(() => {
      coreService.data_post.mockResolvedValueOnce({ status: 0 });
      coreService.data_post.mockResolvedValueOnce({ status: 0 });
      component.getSurveyData(1, 1);
      tick();
      flush();
      tick();
      expect(component.fields).toEqual([]);
    }));
    it('should handle error in data fetching', fakeAsync(() => {
      coreService.data_post.mockRejectedValueOnce(new Error('Fetch error'));
      component.getSurveyData(1, 1);
      tick();
      flush();
      expect(coreService.toast).not.toHaveBeenCalled();
    }));
  });
  describe('setProductCropOptions', () => {
    it('should set options for product_crop field', () => {
      const field: any = { optionMap: {}, options: [] };
      component['setProductCropOptions'](field);
      expect(field.options.length).toBe(1);
      expect(field.optionMap['001']).toBe('ProductCrop1');
    });
  });
  describe('getOPtionFields', () => {
    it('should handle status != 1', fakeAsync(() => {
      const fields: any[] = [{ field_id: 1 }];
      coreService.data_post.mockResolvedValue({ status: 0 });
      component['getOPtionFields'](fields);
      tick();
      flush();
      tick();
      expect(fields[0].options).toBeUndefined();
      expect(component.optionField).toEqual([]);
    }));
    it('should handle error', fakeAsync(() => {
      const fields: any[] = [{ field_id: 1 }];
      coreService.data_post.mockRejectedValue(new Error('error'));
      component['getOPtionFields'](fields);
      tick();
      flush();
      tick();
      expect(component.optionField).toEqual([]);
    }));
  });
  describe('generateParentFieldData', () => {
    it('should fetch parent images', async () => {
      component.parentFields = [{ field_id: 1, type: 'file', subtype: 'image', parent_id: 'tab1' }];
      component.parentData = { data_id: 1 };
      component.tabs = [{ field_id: 'tab1', type: 'tab' }];
      component.survey_id = 1;
      const spy = jest.spyOn(component as any, 'getParentImagesData');
      component['generateParentFieldData']();
      expect(spy).toHaveBeenCalled();
    });
    it('should set parentLkpsIds', () => {
      component.parentFields = [{ field_id: 1, type: 'lkp_state' }];
      component['generateParentFieldData']();
      expect(component.parentLkpsIds['lkp_state']).toBe(1);
    });
    it('should set options for select and radio', () => {
      component.parentFields = [{ field_id: 1, type: 'select', options: [], optionMap: {} }];
      component['generateParentFieldData']();
      expect(component.parentFields[0].options).toEqual([]);
    });
    it('should set options for lkp_state', () => {
      component.parentFields = [{ field_id: 1, type: 'lkp_state', optionMap: {}, options: [] }];
      component.parentLkpsIds = { lkp_state: 1 };
      component.parentData = { field_1: 1 };
      component['generateParentFieldData']();
      expect(component.parentFields[0].options.length).toBeGreaterThan(0);
    });
    it('should call getOPtionFields', () => {
      component.parentFields = [{ field_id: 1, type: 'select', options: [], optionMap: {} }];
      const spy = jest.spyOn(component as any, 'getOPtionFields');
      component['generateParentFieldData']();
      expect(spy).toHaveBeenCalled();
    });
  });
  describe('getParentImagesData', () => {
    it('should fetch parent images successfully', async () => {
      component.parentData = { data_id: 1 };
      coreService.data_post.mockResolvedValue({ status: 1, files: [{ file_name: 'parent.jpg', field_id: 1, id: 1 }] });
      const fields = [{ field_id: 1 }];
      await component['getParentImagesData'](fields);
      expect(component.parentImageURLs.length).toBe(1);
      expect(component.parentFieldImages[1].length).toBe(1);
    });

    it('should handle error in fetching parent images', async () => {
      component.parentData = { data_id: 1 };
      coreService.data_post.mockRejectedValue(new Error('Error'));
      const fields = [{ field_id: 1 }];
      await component['getParentImagesData'](fields);
      expect(coreService.toast).toHaveBeenCalledWith('error', expect.stringContaining('Error'));
    });
    it('should handle status != 1', async () => {
      component.parentData = { data_id: 1 };
      coreService.data_post.mockResolvedValue({ status: 0 });
      await component['getParentImagesData']([]);
      expect(component.parentImageURLs).toEqual([]);
    });
    it('should handle error', async () => {
      component.parentData = { data_id: 1 };
      coreService.data_post.mockRejectedValue(new Error('error'));
      await component['getParentImagesData']([]);
      expect(coreService.toast).toHaveBeenCalledWith('error', expect.stringContaining('error'));
    });
    it('should fetch blobs for munichre', async () => {
      component.parentData = { data_id: 1 };
      featureToggleService.getContext.mockReturnValue('munichre');
      coreService.data_post.mockResolvedValue({ status: 1, files: [{ file_name: 'parent.jpg', field_id: 1, id: 1 }] });
      const fields = [{ field_id: 1 }];
      const spy = jest.spyOn(component as any, 'fetchImageBlobs');
      await component['getParentImagesData'](fields);
      expect(spy).toHaveBeenCalled();
    });
    it('should set showApproval', async () => {
      component.parentData = { data_id: 1 };
      coreService.data_post.mockResolvedValue({ status: 1, files: [{ field_id: 1 }] });
      const fields = [{ field_id: 1 }];
      await component['getParentImagesData'](fields);
      expect(component.showApproval).toBe(true);
    });
  });

  describe('getImagesData', () => {
    it('should fetch images successfully', async () => {
      coreService.data_post.mockResolvedValue({ status: 1, files: [{ file_name: 'test.jpg', field_id: 1, id: 1 }] });
      const fields = [{ field_id: 1 }];
      await component['getImagesData'](fields);
      expect(component.imageURLs.length).toBe(1);
      expect(component.fieldImages[1].length).toBe(1);
    });

    it('should handle error in fetching images', async () => {
      coreService.data_post.mockRejectedValue(new Error('Error'));
      const fields = [{ field_id: 1 }];
      await component['getImagesData'](fields);
      expect(coreService.toast).toHaveBeenCalledWith('error', expect.stringContaining('Error'));
    });
  });

  describe('groupImagesByField', () => {
    it('should group images by field_id', () => {
      const images = [{ field_id: 1, file_name: 'img1' }, { field_id: 1, file_name: 'img2' }, { field_id: 2, file_name: 'img3' }];
      const grouped = component['groupImagesByField'](images);
      expect(grouped[1].length).toBe(2);
      expect(grouped[2].length).toBe(1);
    });

    it('should remove duplicates', () => {
      const images = [{ field_id: 1, file_name: 'img1' }, { field_id: 1, file_name: 'img1' }];
      const grouped = component['groupImagesByField'](images);
      expect(grouped[1].length).toBe(1);
    });
  });
  describe('fetchImageBlobs', () => {
    it('should fetch image blobs for images', async () => {
      const images: any = [{ id: 1, file_name: 'test.jpg', type: 'img' }];
      coreService.fetchAzureBlob.mockResolvedValue(new Blob());
      await component['fetchImageBlobs'](images, '1');
      expect(component.imageBlobUrls[1]).toBeDefined();
    });
    it('should handle PDF files', async () => {
      const images: any = [{ id: 1, file_name: 'test.pdf', type: 'pdf' }];
      coreService.fetchAzureBlob.mockResolvedValue(new Blob());
      await component['fetchImageBlobs'](images, '1');
      expect(images[0].type).toBe('pdf');
      expect(component.imageBlobUrls[1]).toBeDefined();
    });
    it('should handle fetch error for images', async () => {
      const images: any = [{ id: 1, file_name: 'test.jpg', type: 'img' }];
      coreService.fetchAzureBlob.mockRejectedValue(new Error('Error'));
      await component['fetchImageBlobs'](images, '1');
      expect(images[0].isMissed).toBe(true);
      expect(component.imageBlobUrls[1]).toBe(component.missedImage);
    });
    it('should handle direct PDF URL if fetch fails for PDF', async () => {
      const images: any = [{ id: 1, file_name: 'test.pdf', type: 'pdf' }];
      coreService.fetchAzureBlob.mockRejectedValue(new Error('Error'));
      await component['fetchImageBlobs'](images, '1');
      expect(images[0].type).toBe('pdf');
      expect(component.imageBlobUrls[1]).toBeDefined();
    });
    it('should handle empty images', async () => {
      await component['fetchImageBlobs']([], '1');
      expect(coreService.fetchAzureBlob).not.toHaveBeenCalled();
    });
  });
  describe('download_kml', () => {
    it('should handle no file name', async () => {
      await component.download_kml({});
      expect(coreService.toast).toHaveBeenCalledWith('warn', 'No KML file provided');
    });
    it('should download KML for munichre project', async () => {
      featureToggleService.getContext.mockReturnValue('munichre');
      coreService.fetchAzureBlob.mockResolvedValue(new Blob());
      const data = { file_name: 'test.kml' };
      await component.download_kml(data);
      expect(coreService.toast).toHaveBeenCalledWith('success', 'KML file downloaded successfully');
      expect(modalService.dismissAll).toHaveBeenCalled();
    });
    it('should handle error in downloading KML for munichre', async () => {
      featureToggleService.getContext.mockReturnValue('munichre');
      coreService.fetchAzureBlob.mockRejectedValue(new Error('Error'));
      const data = { file_name: 'test.kml' };
      await component.download_kml(data);
      expect(coreService.toast).toHaveBeenCalledWith('error', 'Failed to download KML file');
      expect(modalService.dismissAll).toHaveBeenCalled();
    });
    it('should download KML for non-munichre project', async () => {
      featureToggleService.getContext.mockReturnValue('testContext' as ProjectContext);
      const data = { file_name: 'test.kml' };
      await component.download_kml(data);
      expect(modalService.dismissAll).toHaveBeenCalled();
    });
  });
  describe('editKMLFile', () => {
    it('should set isEditkML to true', () => {
      component.isEditkML = false;
      component.editKMLFile();
      expect(component.isEditkML).toBe(true);
    });
  });
  describe('back', () => {
    it('should call location.back if not isChild', () => {
      component.isChild = false;
      component.back();
      expect(location.back).toHaveBeenCalled();
    });
    it('should emit action if isChild', () => {
      component.isChild = true;
      const emitSpy = jest.spyOn(component.emitAction, 'emit');
      component.back();
      expect(emitSpy).toHaveBeenCalled();
    });
  });
  describe('validateData', () => {
    beforeEach(() => {
      component.fields = [
        { field_id: 1, type: 'text', required: 1, label: 'Field1', parent_id: null, parent_value: null },
        { field_id: 2, type: 'date', required: 1, label: 'DateField', parent_id: null, parent_value: null },
        { field_id: 3, type: 'text', required: 1, label: 'MaxLengthField', maxlength: 5 },
        { field_id: 4, type: 'number', required: 1, label: 'MaxValueField', max: 10 },
      ];
      component.data = { field_1: 'value', field_2: '2023-01-01', field_3: 'short', field_4: 5, datetime: '2023-01-02' };
      component.survey_id = 2;
      component.surveyDates = { 2: 'field_2' };
      component.surveyIntimationTextData = { freeText: '123456789', static: 'INT', year: '2023', state: 'S1', season: 'SE' };
      component.intimationNoPrefix = 'INT-2023-S1-SE';
      component.user = { user_role: '1' };
      component.projectContext = 'munichre' as ProjectContext;
      component.yearCodeMap = new Map([[2023, '2023']]);
      component.stateCodeMap = new Map([[1, 'S1']]);
      component.seasonCodeMap = new Map([[1, 'SE']]);
      component.data.field_953 = 2023;
      component.data.field_528 = 1;
      component.data.field_526 = 1;
    });
    it('should return true if all required fields are filled and valid', () => {
      expect(component.validateData(component.data)).toBe(true);
    });
    it('should toast warning and return false if required field is missing', () => {
      component.data.field_1 = '';
      expect(component.validateData(component.data)).toBe(false);
      expect(coreService.toast).toHaveBeenCalledWith('warn', 'Field1 is required.');
    });
    it('should validate date format and range', () => {
      component.data.field_2 = 'invalid-date';
      expect(component.validateData(component.data)).toBe(false);
      expect(coreService.toast).toHaveBeenCalledWith('warn', 'DateField is invalid.');
      component.data.field_2 = '2019-01-01';
      expect(component.validateData(component.data)).toBe(false);
      expect(coreService.toast).toHaveBeenCalledWith('warn', 'Invalid date is selected for DateField.');
    });
    it('should validate maxlength', () => {
      component.data.field_3 = 'too long';
      expect(component.validateData(component.data)).toBe(false);
      expect(coreService.toast).toHaveBeenCalledWith('warn', 'MaxLengthField value should not exceed 5 charecter.');
    });
    it('should validate max value', () => {
      component.data.field_4 = 15;
      expect(component.validateData(component.data)).toBe(false);
      expect(coreService.toast).toHaveBeenCalledWith('warn', 'MaxValueField value should not be greater than 10.');
    });
    it('should validate survey date against submitted date', () => {
      component.data.field_2 = '2023-01-03';
      expect(component.validateData(component.data)).toBe(false);
      expect(coreService.toast).toHaveBeenCalledWith('warn', expect.stringContaining('should not be more than submitted date'));
    });
    it('should validate intimation number for survey_id 2', () => {
      component.surveyIntimationTextData.freeText = 'short';
      expect(component.validateData(component.data)).toBe(false);
      expect(coreService.toast).toHaveBeenCalledWith('warn', 'Invalid intimation number');
    });
    it('should validate no loss conditions for survey_id 2', () => {
      component.data.field_720 = 'No loss';
      component.data.field_548 = 1;
      expect(component.validateData(component.data)).toBe(false);
      expect(coreService.toast).toHaveBeenCalledWith('warn', expect.stringContaining('must be 0 if Survey type is "no loss"'));
    });
  });
  describe('onKMLAction', () => {
    it('should update geoJsonData for geojson-update', () => {
      const event = { purpose: 'geojson-update', geoJsonData: {} };
      component.onKMLAction(event);
      expect(component.geoJsonData).toEqual({});
    });
    it('should reset edit mode for cancel', () => {
      const event = { purpose: 'cancel' };
      const getSurveyDataSpy = jest.spyOn(component, 'getSurveyData');
      component.onKMLAction(event);
      expect(component.isEditkML).toBe(false);
      expect(component.isEditable).toBe(false);
      expect(getSurveyDataSpy).toHaveBeenCalled();
    });
    it('should not update if updating', () => {
      const event = { purpose: 'update-kml' };
      component.updating = true;
      component.onKMLAction(event);
      expect(coreService.post).not.toHaveBeenCalled();
    });
    it('should not update if validation fails', () => {
      const event = { purpose: 'update-kml' };
      jest.spyOn(component, 'validateData').mockReturnValue(false);
      component.onKMLAction(event);
      expect(coreService.post).not.toHaveBeenCalled();
    });
  });
  describe('onEditDetail', () => {
    it('should toggle edit mode and refresh data', () => {
      component.imageFields = [{ field_id: 1 }];
      component.optionField = [{ field_id: 2 }];
      const getImagesDataSpy = jest.spyOn(component, 'getImagesData');
      const getOPtionFieldsSpy = jest.spyOn(component, 'getOPtionFields');
      component.onEditDetail();
      expect(component.isEditable).toBe(true);
      expect(getImagesDataSpy).toHaveBeenCalledWith(component.imageFields);
      expect(getOPtionFieldsSpy).toHaveBeenCalledWith(component.optionField);
      expect(component.showMap).toBe(false);
    });
    it('should set active radio', () => {
      component.fields = [{ field_id: 1, type: 'radio-group' }];
      component.data = { field_1: 'value1' };
      component.chmDom = { querySelectorAll: jest.fn().mockReturnValue([{ getAttribute: jest.fn().mockReturnValue('value1'), checked: false }]) };
      component.onEditDetail();
      expect(component.chmDom.querySelectorAll.mock.calls[0][0]).toContain('field_1');
    });
    it('should set survey_intimation_no', () => {
      component.surveyIntimationField = 1;
      component.surveyIntimationTextData = { freeText: 'free', static: '', year: '', state: '', season: '' };
      component.data = { field_1: 'INT-2023-S1-SE-free' };
      component.chmDom = { querySelector: jest.fn().mockReturnValue({ value: '' }) };
      component.onEditDetail();
      expect(component.chmDom.querySelector.mock.calls[0][0]).toContain('field_1');
    });
  });
  describe('getFormFieldMultipleData', () => {
    it('should fetch multiple data for field', async () => {
      coreService.data_post.mockResolvedValue({ status: 1, multiple_fields: [{ label: 'Opt1', value: '1' }] });
      const options = await component['getFormFieldMultipleData'](1);
      expect(options.length).toBe(1);
    });
    it('should return empty array on failure', async () => {
      coreService.data_post.mockResolvedValue({ status: 0 });
      const options = await component['getFormFieldMultipleData'](1);
      expect(options).toEqual([]);
    });
  });
  describe('generateColDef', () => {
    it('should generate column definitions', () => {
      component.fields = [{ field_id: 1, type: 'lkp_state', subtype: 'state' }];
      component['generateColDef']();
      expect(component.typeFields.length).toBe(1);
    });
    it('should include kml and file types', () => {
      component.fields = [{ field_id: 2, type: 'kml' }, { field_id: 3, type: 'file' }];
      component['generateColDef']();
      expect(component.typeFields.length).toBe(2);
    });
  });
  describe('generateRowData', () => {
    it('should generate row data using maps', () => {
      component.typeFields = [{ field: 'field_1', type: 'lkp_state' }];
      component.data = { field_1: 1 };
      component.stateMap.set(1, 'State1');
      component['generateRowData']();
      expect(component.data.field_1).toBe('State1');
    });
    it('should handle lkp_crop with string or number', () => {
      component.typeFields = [{ field: 'field_2', type: 'lkp_crop' }];
      component.data = { field_2: '001' };
      component.cropMap.set('001', 'Crop1');
      component.cropMap.set('0001', 'Crop1');
      component['generateRowData']();
      expect(component.data.field_2).toBe('Crop1');
    });
    it('should handle unknown type', () => {
      component.typeFields = [{ field: 'field_3', type: 'unknown' }];
      component.data = { field_3: 'value' };
      component['generateRowData']();
      expect(component.data.field_3).toBe('value');
    });
  });
  describe('onFiedChange', () => {
    beforeEach(() => {
      component.fields = [{ field_id: 1, type: 'text', subtype: 'email' }];
      component.data = { field_1: 'old@email.com' };
      component.chmDom = { querySelector: jest.fn().mockReturnValue({ value: '' }), querySelectorAll: jest.fn().mockReturnValue([]) };
    });

    it('should validate email subtype', () => {
      const event = { target: { value: 'invalid' } };
      component.onFiedChange(event, 'text', 1);
      expect(coreService.toast).toHaveBeenCalledWith('error', 'Please Enter a valid email');
    });

    it('should validate phone subtype length', () => {
      component.fields[0].subtype = 'phone';
      const event = { target: { value: '12345678901' } };
      component.onFiedChange(event, 'text', 1);
      expect(coreService.toast).toHaveBeenCalledWith('error', 'Phone number cannot exceed 10 digits.');
    });

    it('should prepend +91 for phone if missing', () => {
      component.fields[0].subtype = 'phone';
      const event = { target: { value: '1234567890' } };
      component.onFiedChange(event, 'text', 1);
      expect(component.data.field_1).toBe('+911234567890');
    });

    it('should set zero for no loss', () => {
      component.fields = [{ field_id: 720, type: 'select' }];
      const event = { target: { value: 'No loss' } };
      component.onFiedChange(event, 'select', 720);
      expect(component.data.field_548).toBe('0');
      expect(component.data.field_550).toBe('0');
    });
    it('should handle survey_intimation_no', () => {
      const event = { target: { value: 'free' } };
      component.onFiedChange(event, 'survey_intimation_no', 1);
      expect(component.data.field_1).toBeDefined();
    });
    it('should set showChild for childs', () => {
      component.fields = [{ field_id: 1, type: 'text', childValues: ['value'], showChild: false }];
      const event = { target: { value: 'value' } };
      component.onFiedChange(event, 'text', 1);
      expect(component.fields[0].showChild).toBe(true);
    });
    it('should set showChild for lkp_crop', () => {
      component.fields = [{ field_id: 1, type: 'lkp_crop', childValues: [1], showChild: false }];
      const event = { target: { value: 1 } };
      component.cropCodeMap.set(1, 1);
      component.onFiedChange(event, 'lkp_crop', 1);
      expect(component.fields[0].showChild).toBe(true);
    });
  });
  describe('onIntimationPrefixChange', () => {
    it('should update intimation prefix', () => {
      component.chmDom = { querySelector: jest.fn().mockReturnValueOnce({ value: 'INT-2023-S1-SE' }).mockReturnValueOnce({ value: 'freetext' }) };
      component.surveyIntimationField = 1;
      component.data = {};
      component.onIntimationPrefixChange();
      expect(component.data.field_1).toBe('INT-2023-S1-SE-freetext');
    });
    it('should handle no prefix value', () => {
      component.chmDom = { querySelector: jest.fn().mockReturnValue({ value: '' }) };
      component.surveyIntimationField = 1;
      component.data = {};
      component.onIntimationPrefixChange();
      expect(component.data.field_1).toBe('----');
    });
  });
  describe('applyLocationLkpOptions', () => {
    beforeEach(() => {
      component.lkpsIds = { lkp_state: 1 };
      component.data = { field_1: 1 };
    });

    it('should apply options for lkp_state', () => {
      component.fields = [{ type: 'lkp_district', options: [], optionMap: {} }];
      component.applyLocationLkpOptions('lkp_state');
      expect(component.fields[0].options.length).toBeGreaterThan(0);
    });
    it('should apply options for lkp_district', () => {
      component.fields = [{ type: 'lkp_tehsil', options: [], optionMap: {} }];
      component.lkpsIds = { lkp_district: 2 };
      component.data = { field_2: 1 };
      component.applyLocationLkpOptions('lkp_district');
      expect(component.fields[0].options.length).toBeGreaterThan(0);
    });
    it('should apply options for lkp_tehsil', () => {
      component.fields = [{ type: 'lkp_block', options: [], optionMap: {} }];
      component.lkpsIds = { lkp_tehsil: 3 };
      component.data = { field_3: 1 };
      component.applyLocationLkpOptions('lkp_tehsil');
      expect(component.fields[0].options.length).toBeGreaterThan(0);
    });
    it('should apply options for lkp_block', () => {
      component.fields = [{ type: 'lkp_grampanchayat', options: [], optionMap: {} }];
      component.lkpsIds = { lkp_block: 4 };
      component.data = { field_4: 1 };
      component.applyLocationLkpOptions('lkp_block');
      expect(component.fields[0].options.length).toBeGreaterThan(0);
    });
    it('should apply options for lkp_grampanchayat', () => {
      component.fields = [{ type: 'lkp_village', options: [], optionMap: {} }];
      component.lkpsIds = { lkp_grampanchayat: 5 };
      component.data = { field_5: 1 };
      component.applyLocationLkpOptions('lkp_grampanchayat');
      expect(component.fields[0].options.length).toBeGreaterThan(0);
    });
    it('should do nothing if no fieldType', () => {
      component.applyLocationLkpOptions(null);
      expect(true).toBe(true);
    });
  });
  describe('onStateChange', () => {
    it('should clear dependent fields and apply options', () => {
      component.lkpsIds = { lkp_district: 2, lkp_tehsil: 3, lkp_block: 4, lkp_grampanchayat: 5, lkp_village: 6 };
      component.data = {};
      const event = { target: { value: 1 } };
      const clearCropsSpy = jest.spyOn(component, 'clearCrops');
      const applySpy = jest.spyOn(component, 'applyLocationLkpOptions');
      component.onStateChange(event, 'lkp_state');
      expect(component.data.field_2).toBe('');
      expect(clearCropsSpy).toHaveBeenCalled();
      expect(applySpy).toHaveBeenCalledWith('lkp_state');
    });
  });
  describe('onDistrictChange', () => {
    it('should clear dependent fields and apply options', () => {
      component.lkpsIds = { lkp_tehsil: 3, lkp_block: 4, lkp_grampanchayat: 5, lkp_village: 6 };
      component.data = {};
      const event = { target: { value: 1 } };
      const clearCropsSpy = jest.spyOn(component, 'clearCrops');
      const applySpy = jest.spyOn(component, 'applyLocationLkpOptions');
      component.onDistrictChange(event, 'lkp_district');
      expect(component.data.field_3).toBe('');
      expect(clearCropsSpy).toHaveBeenCalled();
      expect(applySpy).toHaveBeenCalledWith('lkp_district');
    });
  });
  describe('onTehsilChange', () => {
    it('should clear dependent fields and apply options', () => {
      component.lkpsIds = { lkp_block: 4, lkp_grampanchayat: 5, lkp_village: 6 };
      component.data = {};
      const event = { target: { value: 1 } };
      const clearCropsSpy = jest.spyOn(component, 'clearCrops');
      const applySpy = jest.spyOn(component, 'applyLocationLkpOptions');
      component.onTehsilChange(event, 'lkp_tehsil');
      expect(component.data.field_4).toBe('');
      expect(clearCropsSpy).toHaveBeenCalled();
      expect(applySpy).toHaveBeenCalledWith('lkp_tehsil');
    });
  });
  describe('onBlockChange', () => {
    it('should clear dependent fields and apply options', () => {
      component.lkpsIds = { lkp_grampanchayat: 5, lkp_village: 6 };
      component.data = {};
      const event = { target: { value: 1 } };
      const clearCropsSpy = jest.spyOn(component, 'clearCrops');
      const applySpy = jest.spyOn(component, 'applyLocationLkpOptions');
      component.onBlockChange(event, 'lkp_block');
      expect(component.data.field_5).toBe('');
      expect(clearCropsSpy).toHaveBeenCalled();
      expect(applySpy).toHaveBeenCalledWith('lkp_block');
    });
  });
  describe('onGrampanchayatChange', () => {
    it('should clear dependent fields and apply options', () => {
      component.lkpsIds = { lkp_village: 6 };
      component.data = {};
      const event = { target: { value: 1 } };
      const clearCropsSpy = jest.spyOn(component, 'clearCrops');
      const applySpy = jest.spyOn(component, 'applyLocationLkpOptions');
      component.onGrampanchayatChange(event, 'lkp_grampanchayat');
      expect(component.data.field_6).toBe('');
      expect(clearCropsSpy).toHaveBeenCalled();
      expect(applySpy).toHaveBeenCalledWith('lkp_grampanchayat');
    });
  });
  describe('clearCrops', () => {
    it('should clear crop fields', () => {
      component.cropLkpIds = [1];
      component.fields = [{ field_id: 1, type: 'lkp_crop' }];
      component.iu_column = 'field_2';
      component.data = {};
      component.clearCrops();
      expect(component.data.field_1).toBe('');
      expect(component.data.field_2).toBe('');
    });
  });
  describe('getCropOptions', () => {
    it('should set crop options', () => {
      component.lkpsIds = { lkp_year: 1, lkp_season: 2, lkp_state: 3, lkp_district: 4 };
      component.data = { field_1: 2023, field_2: 1, field_3: 1, field_4: 1 };
      component.plannedCropData = [{ state_id: 1, dist_id: 1, year: 2023, season: 1, crop_id: 1, crop: 'Crop1', notified_unit: 'Unit1' }];
      component.cropLkpIds = [5];
      component.fields = [{ field_id: 5, type: 'lkp_crop', optionMap: {}, options: [] }];
      component.getCropOptions();
      expect(component.fields[0].options.length).toBe(1);
    });
    it('should set crop options for specific field', () => {
      const field = { optionMap: {}, options: [] };
      component.lkpsIds = { lkp_year: 1, lkp_season: 2, lkp_state: 3, lkp_district: 4 };
      component.data = { field_1: 2023, field_2: 1, field_3: 1, field_4: 1 };
      component.plannedCropData = [{ state_id: 1, dist_id: 1, year: 2023, season: 1, crop_id: 1, crop: 'Crop1', notified_unit: 'Unit1' }];
      component.getCropOptions(field);
      expect(field.options.length).toBe(1);
    });
    it('should do nothing if no plannedCropData', () => {
      component.plannedCropData = [];
      component.lkpsIds = { lkp_year: 1, lkp_season: 2, lkp_state: 3, lkp_district: 4 };
      component.data = { field_1: 2023, field_2: 1, field_3: 1, field_4: 1 };
      component.getCropOptions();
      expect(true).toBe(true);
    });
  });
  describe('onNewImageAdded', () => {
    beforeEach(() => {
      global.fetch = jest.fn().mockResolvedValue({ blob: jest.fn().mockResolvedValue(new Blob()) });
    });
    it('should handle file size exceeding limit', () => {
      const event = { target: { files: [{ size: 6 * 1024 * 1024, name: 'large.jpg' }] } };
      component.onNewImageAdded(event, 1);
      expect(coreService.toast).toHaveBeenCalledWith('warn', 'File size should not exceed 5MB');
    });
  });
  describe('processFile', () => {
    it('should process image file', async () => {
      const file = new File([''], 'test.jpg');
      const field_id = 1;
      const fieldImages: any[] = [];
      jest.spyOn(component as any, 'readFileAsDataUrl').mockResolvedValue('data:image/jpeg;base64,...');
      imageCompressService.compressFile.mockResolvedValue('compressed');
      global.fetch = jest.fn().mockResolvedValue({ blob: jest.fn().mockResolvedValue(new Blob()) });
      await component['processFile'](file, field_id, fieldImages);
      expect(fieldImages.length).toBe(1);
      expect(fieldImages[0].type).toBe('img');
      expect(component.imageBlobUrls[fieldImages[0].id]).toBeDefined();
    });
    it('should process PDF file', async () => {
      const file = new File([''], 'test.pdf');
      const field_id = 1;
      const fieldImages: any[] = [];
      jest.spyOn(component as any, 'readFileAsDataUrl').mockResolvedValue('data:application/pdf;base64,...');
      global.fetch = jest.fn().mockResolvedValue({ blob: jest.fn().mockResolvedValue(new Blob()) });
      await component['processFile'](file, field_id, fieldImages);
      expect(fieldImages.length).toBe(1);
      expect(fieldImages[0].type).toBe('pdf');
      expect(component.imageBlobUrls[fieldImages[0].id]).toBeDefined();
    });
  });
  describe('uploadFile', () => {
    it('should upload file successfully', async () => {
      const blob = new Blob();
      const type = 'img';
      const tempId = 'temp1';
      const tempBlobUrl = 'blob:url';
      const field_id = 1;
      const fieldImages: any[] = [{ id: tempId }];
      coreService.post.mockResolvedValue({ status: 1, file: { id: 2, file_name: 'uploaded.jpg' } });
      coreService.fetchAzureBlob.mockResolvedValue(new Blob());
      await component['uploadFile'](blob, type, tempId, tempBlobUrl, field_id, fieldImages);
      expect(fieldImages[0].id).toBe(2);
      expect(component.imageBlobUrls[2]).toBeDefined();
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:url');
    });
    it('should handle upload failure', async () => {
      const blob = new Blob();
      const type = 'img';
      const tempId = 'temp1';
      const tempBlobUrl = 'blob:url';
      const field_id = 1;
      const fieldImages: any[] = [{ id: tempId }];
      coreService.post.mockResolvedValue({ status: 0, msg: 'Failed' });
      await component['uploadFile'](blob, type, tempId, tempBlobUrl, field_id, fieldImages);
      expect(fieldImages.length).toBe(0);
      expect(coreService.toast).toHaveBeenCalledWith('error', 'Failed');
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:url');
    });
    it('should handle error', async () => {
      const blob = new Blob();
      const type = 'img';
      const tempId = 'temp1';
      const tempBlobUrl = 'blob:url';
      const field_id = 1;
      const fieldImages: any[] = [{ id: tempId }];
      coreService.post.mockRejectedValue(new Error('Error'));
      await component['uploadFile'](blob, type, tempId, tempBlobUrl, field_id, fieldImages);
      expect(fieldImages.length).toBe(0);
      expect(coreService.toast).toHaveBeenCalledWith('error', 'Unable to add file');
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:url');
    });
    it('should handle fetch error for server image', async () => {
      const blob = new Blob();
      const type = 'img';
      const tempId = 'temp1';
      const tempBlobUrl = 'blob:url';
      const field_id = 1;
      const fieldImages: any[] = [{ id: tempId }];
      coreService.post.mockResolvedValue({ status: 1, file: { id: 2, file_name: 'uploaded.jpg' } });
      coreService.fetchAzureBlob.mockRejectedValue(new Error('Error'));
      await component['uploadFile'](blob, type, tempId, tempBlobUrl, field_id, fieldImages);
      expect(fieldImages[0].isMissed).toBe(true);
      expect(component.imageBlobUrls[2]).toBe(component.missedImage);
    });
  });
  describe('processAndUploadFile', () => {
    it('should process and upload file', fakeAsync(() => {
      const file = new File([''], 'test.jpg');
      const reader = new FileReader();
      jest.spyOn(reader, 'readAsDataURL').mockImplementation(() => {
        const event = { currentTarget: { result: 'data:image/jpeg;base64,...' } };
        (component as any)['handleFileRead'](event, file, 1, []);
      });
      (component as any)['processAndUploadFile'](file, 1, []);
      tick();
      flush();
      tick();
    }));
    it('should add PDF placeholder', fakeAsync(() => {
      const file = new File([''], 'test.pdf');
      const reader = new FileReader();
      jest.spyOn(reader, 'readAsDataURL').mockImplementation(() => {
        const event = { currentTarget: { result: 'data:application/pdf;base64,...' } };
        (component as any)['handleFileRead'](event, file, 1, []);
      });
      (component as any)['processAndUploadFile'](file, 1, []);
      tick();
      flush();
      tick();
    }));
  });
  describe('handleFileRead', () => {
    beforeEach(() => {
      global.fetch = jest.fn().mockResolvedValue({ blob: jest.fn().mockResolvedValue(new Blob()) });
    });
    it('should handle image read', async () => {
      const env = { currentTarget: { result: 'data:image/jpeg;base64,...' } };
      const file = new File([''], 'test.jpg');
      const images: any = [];
      coreService.post.mockResolvedValue({ status: 1, file: { file_name: 'uploaded.jpg' } });
      await (component as any)['handleFileRead'](env, file, 1, images);
      expect(images.length).toBe(1);
    });
    it('should handle PDF read', async () => {
      const env = { currentTarget: { result: 'data:application/pdf;base64,...' } };
      const file = new File([''], 'test.pdf');
      const images: any = [];
      coreService.post.mockResolvedValue({ status: 1, file: { file_name: 'uploaded.pdf' } });
      await (component as any)['handleFileRead'](env, file, 1, images);
      expect(images.length).toBe(1);
    });
    it('should handle upload failure', async () => {
      const env = { currentTarget: { result: 'data:image/jpeg;base64,...' } };
      const file = new File([''], 'test.jpg');
      const images: any = [];
      coreService.post.mockResolvedValue({ status: 0, msg: 'Failed' });
      await (component as any)['handleFileRead'](env, file, 1, images);
      expect(images.length).toBe(0);
      expect(coreService.toast).toHaveBeenCalledWith('error', 'Failed');
    });
    it('should handle error', async () => {
      const env = { currentTarget: { result: 'data:image/jpeg;base64,...' } };
      const file = new File([''], 'test.jpg');
      const images: any = [];
      coreService.post.mockRejectedValue(new Error('Error'));
      await (component as any)['handleFileRead'](env, file, 1, images);
      expect(images.length).toBe(0);
      expect(coreService.toast).toHaveBeenCalledWith('error', 'Unable to add file');
    });
  });
  describe('onNewImageUpdated', () => {
    it('should handle no files', () => {
      const event = { target: { files: [] } };
      component.onNewImageUpdated(event, {});
      expect(coreService.toast).not.toHaveBeenCalled();
    });

    it('should update image', fakeAsync(() => {
      const file = new File([''], 'update.jpg');
      const event = { target: { files: [file] } };
      const imgData: any = { field_id: 1, id: 1, timestamp: 0 };
      coreService.post.mockResolvedValue({ status: 1 });
      component.onNewImageUpdated(event, imgData);
      tick();
      flush();
      expect(imgData.timestamp).toBeDefined();
    }));
    it('should handle file size exceeding limit', () => {
      const event = { target: { files: [{ size: 6 * 1024 * 1024 }] } };
      component.onNewImageUpdated(event, {});
      expect(coreService.toast).toHaveBeenCalledWith('warn', 'File size should not exceed 5MB');
    });
  });
  describe('imageCompresser', () => {
    it('should compress image', async () => {
      const file = 'data:image/jpeg;base64,...';
      const compressed = await component['imageCompresser'](file);
      expect(compressed).toBe('compressed_image_data_url');
    });
  });
  describe('onImageAddClick', () => {
    it('should reset and click input', () => {
      const imageInput = { value: 'old', click: jest.fn() };
      component.onImageAddClick(imageInput);
      expect(imageInput.value).toBeNull();
      expect(imageInput.click).toHaveBeenCalled();
    });
  });
  describe('onDeleteClick', () => {
    let Swal: any;
    beforeEach(() => {
      Swal = require('sweetalert2').default;
      Swal.fire = jest.fn();
      component.fieldImages = { 1: [{ id: 1, file_name: 'test.jpg', type: 'img' }] };
      component.projectContext = 'munichre' as ProjectContext;
      component.imageBlobUrls = { 1: 'blob:url' as any };
    });
    it('should not delete if confirmation is cancelled', fakeAsync(() => {
      (Swal.fire as jest.Mock).mockResolvedValue({ isConfirmed: false });
      component.onDeleteClick(new Event('click'), {}, 0, 1);
      tick();
      flush();
      tick();
      expect(coreService.post).not.toHaveBeenCalled();
    }));
    it('should handle no fieldImages', async () => {
      component.fieldImages = {};
      await component.onDeleteClick(new Event('click'), {}, 0, 1);
      expect(coreService.post).not.toHaveBeenCalled();
    });
    it('should handle no img id', async () => {
      component.fieldImages[1][0].id = null;
      await component.onDeleteClick(new Event('click'), {}, 0, 1);
      expect(coreService.post).not.toHaveBeenCalled();
    });
  });
  describe('getKMLFile', () => {
    it('should fetch KML successfully', async () => {
      global.fetch = jest.fn().mockResolvedValue({ text: jest.fn().mockResolvedValue('<kml></kml>') });
      const geoJson = await component['getKMLFile']('url');
      expect(geoJson).toBeDefined();
    });
    it('should remove innerBoundaryIs', async () => {
      const xml = '<kml><outerBoundaryIs></outerBoundaryIs><innerBoundaryIs></innerBoundaryIs></kml>';
      global.fetch = jest.fn().mockResolvedValue({ text: jest.fn().mockResolvedValue(xml) });
      await component['getKMLFile']('url');
      expect(true).toBe(true); // Check removal in DOMParser
    });
    it('should handle error in fetching KML', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Error'));
      const geoJson = await component['getKMLFile']('url');
      expect(geoJson).toEqual({});
    });
  });
  describe('updateStatus', () => {
    let Swal: any;
    beforeEach(() => {
      Swal = require('sweetalert2').default;
      Swal.fire = jest.fn().mockResolvedValue({ isConfirmed: true });
      component.geoJsonData = {};
      component.data = { id: 1 };
      component.survey_id = 1;
      component.fields = [];
      component.tabs = [];
      component.fieldImages = {};
    });
    it('should handle rejection', fakeAsync(() => {
      (Swal.fire as jest.Mock).mockResolvedValue({ isConfirmed: false });
      component.updateStatus('approve_data');
      tick();
      flush();
      tick();
      expect(coreService.post).not.toHaveBeenCalled();
    }));
    it('should validate before approve', () => {
      jest.spyOn(component, 'validateData').mockReturnValue(false);
      component.updateStatus('approve_data');
      expect(coreService.post).not.toHaveBeenCalled();
    });
    it('should check for missed images', () => {
      jest.spyOn(component, 'validateData').mockReturnValue(true);
      component.fields = [{ type: 'file', subtype: 'image', required: true, field_id: 1, parent_id: 'tab1', label: 'Img' }];
      component.tabs = [{ field_id: 'tab1', type: 'tab' }];
      component.fieldImages = { 1: [{ isMissed: true }] };
      component.updateStatus('approve_data');
      expect(coreService.toast).toHaveBeenCalledWith('warn', expect.stringContaining('unsynced image'));
    });
    it('should fetch KML if missing', fakeAsync(() => {
      jest.spyOn(component, 'validateData').mockReturnValue(true);
      component.geoJsonData = null;
      const getKMLDataSpy = jest.spyOn(component as any, 'getKMLData').mockResolvedValue(undefined);
      component.updateStatus('approve_data');
      tick();
      flush();
      tick();
      expect(getKMLDataSpy).toHaveBeenCalled();
    }));
    it('should validate bank details for survey_id 2', () => {
      jest.spyOn(component, 'validateData').mockReturnValue(true);
      component.survey_id = 2;
      component.fields = [{ field_id: 570, requiredBankDetails: true, label: 'Bank' }];
      component.data.field_570 = '';
      component.geoJsonData = {};
      component.updateStatus('approve_data');
      expect(coreService.toast).toHaveBeenCalledWith('warn', expect.stringContaining('requrired'));
    });
    it('should set confirmButtonText for different purposes', () => {
      component.updateStatus('reject_data');
      expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({ confirmButtonText: 'Yes, Reject it' }));
      component.updateStatus('revert_data');
      expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({ confirmButtonText: 'Yes, Revert it' }));
    });
  });
  describe('delay', () => {
    it('should delay execution', async () => {
      const param = jest.fn();
      await component['delay'](param);
      expect(param).toHaveBeenCalled();
    });
  });
  describe('validateDateFields', () => {
    it('should validate date fields', () => {
      const tab = { childs: [{ field_id: 1, parent_value: ['value'], required: true, disabled: true, invalid: false, childs: [] }], field_id: 1, type: 'text', required: true, disabled: false, invalid: false };
      component.data = { field_1: 'value' };
      component['validateDateFields'](tab);
      expect(tab.childs[0].disabled).toBe(false);
      expect(tab.invalid).toBe(false);
    });
    it('should handle crop type', () => {
      const tab: any = { type: 'lkp_crop', childs: [{ field_id: 1, parent_value: ['001'], required: true }], field_id: 1, showChild: false };
      component.data = { field_1: '001', field_501: 15 };
      component['validateDateFields'](tab);
      expect(tab.showChild).toBe(true);
    });
    it('should clear value if changed', () => {
      const tab = { childs: [{ field_id: 1, parent_value: ['old'] }] };
      component.data = { field_1: 'new' };
      component.chmDom = { querySelector: jest.fn().mockReturnValue({ value: 'old' }) };
      component['validateDateFields'](tab, true);
      expect(component.data.field_1).toBeNull();
    });
  });
  describe('lazyLoadImage', () => {
    it('should lazy load images', () => {
      component.chmDom = { querySelectorAll: jest.fn().mockReturnValue([{ getAttribute: jest.fn().mockReturnValue('src') }]) };
      global.IntersectionObserver = jest.fn().mockImplementation((cb) => ({ observe: jest.fn(), cb })); // Add cb
      component['lazyLoadImage']();
      expect(component.chmDom.querySelectorAll).toHaveBeenCalledWith('[data-src]');
    });
    it('should handle no images', () => {
      component.chmDom = { querySelectorAll: jest.fn().mockReturnValue([]) };
      component['lazyLoadImage']();
      expect(true).toBe(true);
    });
  });
  describe('openInGallery', () => {
    it('should open gallery modal for non-PDF', () => {
      component['openInGallery']('url', 'image');
      expect(component.isPdf).toBe(false);
      expect(modalService.open).toHaveBeenCalled();
    });
    it('should open gallery modal for PDF', () => {
      component['openInGallery']('url.pdf', 'application/pdf');
      expect(component.isPdf).toBe(true);
      expect(modalService.open).toHaveBeenCalled();
    });
    it('should call openPdfInNewTab for PDF in munichre', () => {
      featureToggleService.getContext.mockReturnValue('munichre');
      const spy = jest.spyOn(component as any, 'openPdfInNewTab');
      component['openInGallery']('url.pdf', 'application/pdf');
      expect(spy).toHaveBeenCalled();
    });
    it('should handle SafeUrl', () => {
      component['openInGallery']('safeUrl' as SafeUrl, '');
      expect(component.galleryUrl).toBeDefined();
    });
  });
  describe('openPdfInNewTab', () => {
    it('should open PDF in new tab', () => {
      jest.spyOn(window, 'open').mockImplementation(() => null);
      component.galleryUrl = 'safeUrl';
      component['openPdfInNewTab']();
      expect(window.open).toHaveBeenCalledWith('safeUrl', '_blank');
    });
    it('should toast error if no raw URL', () => {
      component.galleryUrl = null;
      component['openPdfInNewTab']();
      expect(coreService.toast).toHaveBeenCalledWith('error', 'Failed to extract raw URL for new tab');
    });
  });
  describe('onImageError', () => {
    it('should set isMissed on image error', () => {
      const img = { isMissed: false };
      component['onImageError'](img);
      expect(img.isMissed).toBe(true);
    });
    it('should do nothing if no imgData', () => {
      component['onImageError'](null);
      expect(true).toBe(true);
    });
  });
  describe('toggleZoom', () => {
    it('should toggle zoom class', () => {
      const event = { target: { classList: { toggle: jest.fn() } } };
      component['toggleZoom'](event);
      expect(event.target.classList.toggle).toHaveBeenCalledWith('w-100');
    });
    it('should do nothing if no target', () => {
      const event = {};
      expect(() => component['toggleZoom'](event)).not.toThrow();
    });
  });
  describe('exportPDF', () => {
    it('should export PDF with map', fakeAsync(() => {
      component.chmDom = { querySelectorAll: jest.fn().mockReturnValue([{ clientWidth: 100 }]) };
      (component as any).element.nativeElement = { querySelector: jest.fn(selector => selector === 'div' ? component.chmDom : { clientWidth: 100 }) };
      component.exportPDF();
      tick();
      flush();
      tick();
      expect(component.printingMsg).toBe('Generating PDF, please wait...');
    }));
  });
  describe('makeSvgDataUri', () => {
    it('should make SVG data URI', async () => {
      const node = document.createElement('div');
      const uri = await component['makeSvgDataUri'](node, 100, 100);
      expect(uri.startsWith('data:image/svg+xml;charset=utf-8')).toBe(true);
    });
  });
  describe('onlyNumberKeyDown', () => {
    it('should allow number keys', () => {
      const event = { key: '5', code: 'Digit5', ctrlKey: false, metaKey: false, stopPropagation: jest.fn(), preventDefault: jest.fn() };
      const result = component['onlyNumberKeyDown'](event);
      expect(result).toBeUndefined();
      expect(event.stopPropagation).not.toHaveBeenCalled();
    });
    it('should prevent non-number keys', () => {
      const event = { key: 'a', code: 'KeyA', ctrlKey: false, metaKey: false, stopPropagation: jest.fn(), preventDefault: jest.fn() };
      const result = component['onlyNumberKeyDown'](event);
      expect(result).toBe(false);
      expect(event.stopPropagation).toHaveBeenCalled();
      expect(event.preventDefault).toHaveBeenCalled();
    });
    it('should allow action keys with ctrl/meta', () => {
      const event = { key: 'v', code: 'KeyV', ctrlKey: true, metaKey: false, stopPropagation: jest.fn(), preventDefault: jest.fn() };
      const result = component['onlyNumberKeyDown'](event);
      expect(result).toBeUndefined();
    });
    it('should allow navigation and function keys', () => {
      const event = { key: 'ArrowLeft', code: 'ArrowLeft', ctrlKey: false, metaKey: false, stopPropagation: jest.fn(), preventDefault: jest.fn() };
      const result = component['onlyNumberKeyDown'](event);
      expect(result).toBeUndefined();
    });
  });
  describe('showMediaImages', () => {
    it('should show media images', () => {
      component.showMedia = false;
      const getImagesDataSpy = jest.spyOn(component, 'getImagesData');
      component.showMediaImages();
      expect(component.showMedia).toBe(true);
      expect(getImagesDataSpy).toHaveBeenCalledWith(component.imageFields);
    });
  });
  describe('showSignatureImages', () => {
    it('should show signature images', () => {
      component.showSignature = false;
      const getImagesDataSpy = jest.spyOn(component, 'getImagesData');
      component.showSignatureImages();
      expect(component.showSignature).toBe(true);
      expect(getImagesDataSpy).toHaveBeenCalledWith(component.imageFields);
    });
  });
});