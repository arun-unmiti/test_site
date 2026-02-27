import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { of } from 'rxjs';

import { FarmerDetailsComponent } from './farmer-details.component';
import { CoreService } from '../utilities/core.service';
import { FilterService } from '../utilities/filter.service';
import { FeatureToggleService } from '../shared/services/feature-toggle.service';
import { DomSanitizer } from '@angular/platform-browser';
import { InsightsService } from "../utilities/insights.service";
import { environment, ProjectContext } from '../../environments/environment';

// Mock lightgallery component
@Component({
  selector: 'lightgallery',
  template: ''
})
class MockLightgalleryComponent {
  @Input() settings: any;
  @Input() onBeforeSlide: any;
}

// Mock leafletmap component
@Component({
  selector: 'app-leafletmap',
  template: ''
})
class MockLeafletMapComponent {
  @Input() height!: string;
  @Input() locationData!: any[];
  @Input() showpopup!: boolean;
  @Input() lat!: any;
  @Input() lng!: any;
  @Input() zoomView!: number;
  @Input() mapType!: string;
  @Output() pointClick = new EventEmitter();
  generateKML = jest.fn(() => ({ geoJson: { features: [] } }));
  resetMap = jest.fn();
  map = { setView: jest.fn() };
}

// Mock environment
jest.mock('../../environments/environment', () => ({
  environment: {
    projectConfigs: {
      munichre: { assetsFolder: '/assets/munichre' },
      saksham: { assetsFolder: '/assets/saksham' },
      testContext: { assetsFolder: '/assets/test/' }
    }
  }
}));

describe('FarmerDetailsComponent', () => {
  let component: FarmerDetailsComponent;
  let fixture: ComponentFixture<FarmerDetailsComponent>;
  let coreService: any;
  let filterService: any;
  let featureToggleService: any;
  let sanitizer: any;
  let insightsService: any;

  beforeEach(async () => {
    coreService = {
      post: jest.fn().mockResolvedValue({}),
      clone: jest.fn(obj => JSON.parse(JSON.stringify(obj))),
      fetchAzureBlob: jest.fn().mockResolvedValue(new Blob()),
      toast: jest.fn(),
    };

    filterService = {
      states: [{ state_id: 1, state_name: 'State1' }],
      districts: [{ district_id: 1, district_name: 'District1' }],
      tehsils: [{ tehsil_id: 1, tehsil_name: 'Tehsil1' }],
      crops: [{ crop_code: 1, crop_name: 'Crop1' }],
      blocks: [{ block_id: 1, block_name: 'Block1' }],
      grampanchayats: [],
      villages: [],
      getGrampanchayatData: jest.fn().mockResolvedValue(undefined),
      getVillageData: jest.fn().mockResolvedValue(undefined),
    };

    featureToggleService = {
      getContext: jest.fn().mockReturnValue('testContext' as ProjectContext),
      getConfig: jest.fn().mockReturnValue({ BASEKMLPREFIX: 'prefix/', BASEKMLSUFFIX: '.suffix' }),
    };

    sanitizer = {
      bypassSecurityTrustUrl: jest.fn().mockReturnValue('safe-url'),
    };

    insightsService = {
      logException: jest.fn(),
    };

    await TestBed.configureTestingModule({
      declarations: [
        FarmerDetailsComponent,
        MockLightgalleryComponent,
        MockLeafletMapComponent
      ],
      providers: [
        { provide: CoreService, useValue: coreService },
        { provide: FilterService, useValue: filterService },
        { provide: FeatureToggleService, useValue: featureToggleService },
        { provide: DomSanitizer, useValue: sanitizer },
        { provide: InsightsService, useValue: insightsService }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(FarmerDetailsComponent);
    component = fixture.componentInstance;
    component.mediaTab = { children: [], childern: [] };
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  describe('constructor', () => {
    it('should set projectContext and assetsFolder', () => {
      featureToggleService.getContext.mockReturnValue('munichre' as ProjectContext);
      const newComponent = new FarmerDetailsComponent(coreService, filterService, featureToggleService, sanitizer, insightsService);
      expect(newComponent.projectContext).toBe('munichre');
      expect(newComponent.assetsFolder).toBe('/assets/munichre');
    });
  });

  describe('ngOnInit', () => {
    it('should set imgUrl and imgUrlSuffix from config', () => {
      component.ngOnInit();
      expect(component.imgUrl).toBe('prefix/');
      expect(component.imgUrlSuffix).toBe('.suffix');
    });

    it('should set locationData from surveyLocation', () => {
      component.surveyLocation = [{ id: 1 }];
      component.ngOnInit();
      expect(component.locationData).toEqual([{ id: 1 }]);
    });

    it('should call getSurveyFields and getLocationsData', () => {
      const getSurveyFieldsSpy = jest.spyOn(component, 'getSurveyFields');
      const getLocationsDataSpy = jest.spyOn(component, 'getLocationsData');
      component.ngOnInit();
      expect(getSurveyFieldsSpy).toHaveBeenCalled();
      expect(getLocationsDataSpy).toHaveBeenCalled();
    });
  });

  describe('getLocationsData', () => {
    it('should clone and set states, districts, tehsils, crops from filter service', () => {
      jest.spyOn(coreService, 'clone').mockImplementation(obj => obj);
      component.getLocationsData();
      expect(component.states).toEqual(filterService.states);
      expect(component.districts).toEqual(filterService.districts);
      expect(component.tehsils).toEqual(filterService.tehsils);
      expect(component.crops).toEqual(filterService.crops);
    });

    it('should populate maps correctly', () => {
      component.getLocationsData();
      expect(component.stateMap.get(1)).toBe('State1');
      expect(component.districtMap.get(1)).toBe('District1');
      expect(component.tehsilMap.get(1)).toBe('Tehsil1');
      expect(component.cropsMap.get(1)).toBe('Crop1');
      expect(component.blockMap.get(1)).toBe('Block1');
    });
  });

  describe('getSurveyFields', () => {
    it('should not call post if surveyId is falsy', () => {
      component.surveyId = null;
      component.getSurveyFields();
      expect(coreService.post).not.toHaveBeenCalled();
    });

    it('should fetch fields and set tabs, basicTab, mediaTab, tablesTab', async () => {
      component.surveyId = 1;
      const mockResponse = {
        status: 1,
        fields: [
          { field_id: 1, type: 'tab', label: 'Basic details' },
          { field_id: 2, type: 'tab', label: 'Media Upload' },
          { field_id: 3, type: 'tab', label: 'Other' },
          { field_id: 4, parent_id: 1, type: 'text', label: 'Field1' },
        ]
      };
      coreService.post.mockResolvedValueOnce(mockResponse);
      await component.getSurveyFields();
      expect(coreService.post).toHaveBeenCalledWith({ purpose: 'get_surveyfields', survey_id: 1 });
      expect(component.fields).toEqual(mockResponse.fields);
      expect(component.tabs.length).toBe(3);
      expect(component.basicTab.label).toBe('Basic details');
      expect(component.mediaTab.label).toBe('Media Upload');
      expect(component.tablesTab.length).toBe(1);
      expect(component.tablesTab[0].label).toBe('Other');
    });

    it('should handle response with no fields', async () => {
      component.surveyId = 1;
      coreService.post.mockResolvedValueOnce({ status: 1, fields: [] });
      await component.getSurveyFields();
      expect(component.fields).toEqual([]);
      expect(component.tabs).toEqual([]);
      expect(component.basicTab).toBeUndefined();
      expect(component.mediaTab).toBeUndefined();
      expect(component.tablesTab).toEqual([]);
    });

    it('should handle children typo in mediaTab', async () => {
      component.surveyId = 1;
      const mockResponse = {
        status: 1,
        fields: [
          { field_id: 2, type: 'tab', label: 'Media Upload' },
          { field_id: 5, parent_id: 2, type: 'file', subtype: 'image' },
        ]
      };
      coreService.post.mockResolvedValueOnce(mockResponse);
      await component.getSurveyFields();
      expect(component.mediaTab.childern).toHaveLength(1); // Assuming typo handling in code
    });
  });

  describe('getData', () => {
    it('should return NA if no selectedFarmer id', () => {
      component.selectedFarmer = {};
      expect(component.getData({ field_id: 1 })).toBe('NA');
    });

    it('should return field value or NA', () => {
      component.selectedFarmer = { id: 1, field_1: 'Value' };
      expect(component.getData({ field_id: 1 })).toBe('Value');
      expect(component.getData({ field_id: 2 })).toBe('NA');
    });
  });

  describe('refreshMap', () => {
    it('should toggle showMap and reset locationData', fakeAsync(() => {
      component.surveyLocation = [{ id: 1 }];
      component.refreshMap();
      expect(component.showMap).toBe(false);
      tick(0);
      expect(component.showMap).toBe(true);
      expect(component.locationData).toEqual([{ id: 1 }]);
    }));
  });

  describe('clearDetail', () => {
    it('should reset all detail properties and call refreshMap', () => {
      const refreshMapSpy = jest.spyOn(component, 'refreshMap');
      component.clearDetail();
      expect(component.imageFiles).toEqual([]);
      expect(component.kmlFileInfo).toEqual([]);
      expect(component.tabs).toEqual([]);
      expect(component.basicTab).toBeNull();
      expect(component.tablesTab).toEqual([]);
      expect(component.selectedFarmer).toEqual({});
      expect(component.executeDetail).toBeNull();
      expect(component.isAllImgMissed).toBe(false);
      expect(refreshMapSpy).toHaveBeenCalled();
    });
  });

  describe('generateKML', () => {
    it('should call generateKML on leafletMap if exists', () => {
      component.leafletMap = { generateKML: jest.fn() };
      component.generateKML();
      expect(component.leafletMap.generateKML).toHaveBeenCalled();
    });
  });

  describe('onPointClick', () => {
    it('should reset if no env', async () => {
      await component.onPointClick(null);
      expect(component.selectedFarmer).toEqual({});
      expect(component.kmlFileInfo).toEqual([]);
    });

    it('should set selectedFarmer, lat, lng, and call methods if env', async () => {
      const mockEnv = { data_id: 1 };
      component.surveyData = [{ data_id: 1, lat: '10', lng: '20' }];
      component.mediaTab = { children: [], childern: [] };
      const generateRowDataSpy = jest.spyOn(component, 'generateRowData').mockResolvedValue(undefined);
      const getKMLFilesSpy = jest.spyOn(component, 'getKMLFiles');
      const getImageFilesSpy = jest.spyOn(component, 'getImageFiles');
      const getExecuteDetailSpy = jest.spyOn(component, 'getExecuteDetail');
      await component.onPointClick(mockEnv);
      expect(component.selectedFarmer).toEqual({ data_id: 1, lat: '10', lng: '20' });
      expect(component.lat).toBe(10);
      expect(component.lng).toBe(20);
      expect(generateRowDataSpy).toHaveBeenCalled();
      expect(getKMLFilesSpy).toHaveBeenCalled();
      expect(getImageFilesSpy).toHaveBeenCalled();
      expect(getExecuteDetailSpy).toHaveBeenCalled();
    });
  });

  describe('getKMLFiles', () => {
    it('should handle no kmlMap', async () => {
      component.kmlMap = null;
      coreService.post.mockResolvedValueOnce({ status: 1, files: [] });
      await component.getKMLFiles();
      expect(component.kmlFileInfo).toEqual([]);
    });
  });

  describe('getImageFiles', () => {
    beforeEach(() => {
      component.mediaTab = { children: [
        { field_id: 1, type: 'file', subtype: 'image' },
        { field_id: 2, type: 'file', subtype: 'image' }
      ], childern: [
        { field_id: 1, type: 'file', subtype: 'image' },
        { field_id: 2, type: 'file', subtype: 'image' }
      ] };
      component.surveyId = 1;
      component.selectedFarmer = { data_id: 1 };
    });

    it('should not process if no image fields', async () => {
      component.mediaTab = { children: [], childern: [] };
      await component.getImageFiles();
      expect(coreService.post).not.toHaveBeenCalled();
    });

    it('should handle failure in responses', async () => {
      coreService.post
        .mockResolvedValueOnce({ status: 0 })
        .mockResolvedValueOnce({ status: 1, files: [] });
      await component.getImageFiles();
      expect(component.imageFiles).toEqual([]);
    });

    it('should handle error in promise.all', async () => {
      coreService.post.mockRejectedValueOnce('error');
      await component.getImageFiles();
      expect(coreService.toast).not.toHaveBeenCalled(); // since !isMunichRe in catch
    });
  });

  describe('getExecuteDetail', () => {
    it('should fetch and set executeDetail', async () => {
      component.selectedFarmer = { user_id: 1 };
      const mockResponse = { status: 1, user_details: { name: 'User' } };
      coreService.post.mockResolvedValueOnce(mockResponse);
      await component.getExecuteDetail();
      expect(coreService.post).toHaveBeenCalledWith('users', { purpose: 'get_user_details', user_id: 1 });
      expect(component.executeDetail).toEqual({ name: 'User' });
    });
  });

  describe('getGrampanchayatMap', () => {
    it('should not fetch if no new blockIds', async () => {
      component.selectedFarmer = {};
      const result = await component.getGrampanchayatMap();
      expect(filterService.getGrampanchayatData).not.toHaveBeenCalled();
      expect(result.size).toBe(0);
    });
  });

  describe('getVillageMap', () => {
    it('should not fetch if no new panchayatIds', async () => {
      component.selectedFarmer = {};
      const result = await component.getVillageMap();
      expect(filterService.getVillageData).not.toHaveBeenCalled();
      expect(result.size).toBe(0);
    });
  });

  describe('generateRowData', () => {
    it('should increment/decrement loading and map field values', async () => {
      component.fields = [
        { field_id: 1, type: 'lkp_state' },
        { field_id: 2, type: 'lkp_district' },
        { field_id: 3, type: 'lkp_tehsil' },
        { field_id: 4, type: 'lkp_block' },
        { field_id: 5, type: 'lkp_crop' },
        { field_id: 6, type: 'lkp_grampanchayat' },
        { field_id: 7, type: 'lkp_village' },
        { field_id: 8, type: 'text' },
      ];
      component.selectedFarmer = {
        field_1: 1, field_2: 1, field_3: 1, field_4: 1, field_5: 1, field_6: 2, field_7: 2, field_8: 'text'
      };
      component.stateMap.set(1, 'State1');
      component.districtMap.set(1, 'District1');
      component.tehsilMap.set(1, 'Tehsil1');
      component.blockMap.set(1, 'Block1');
      component.cropsMap.set(1, 'Crop1');
      const mockPanchayatMap = new Map([[2, 'GP2']]);
      const mockVillageMap = new Map([[2, 'V2']]);
      jest.spyOn(component, 'getGrampanchayatMap').mockResolvedValue(mockPanchayatMap);
      jest.spyOn(component, 'getVillageMap').mockResolvedValue(mockVillageMap);
      await component.generateRowData();
      expect(component.loading).toBe(0);
      expect(component.selectedFarmer.field_1).toBe('State1');
      expect(component.selectedFarmer.field_2).toBe('District1');
      expect(component.selectedFarmer.field_3).toBe('Tehsil1');
      expect(component.selectedFarmer.field_4).toBe('Block1');
      expect(component.selectedFarmer.field_5).toBe('Crop1');
      expect(component.selectedFarmer.field_6).toBe('GP2');
      expect(component.selectedFarmer.field_7).toBe('V2');
      expect(component.selectedFarmer.field_8).toBe('text');
    });

    it('should handle grampanchayat fallback to value if not in map', async () => {
      component.fields = [{ field_id: 6, type: 'lkp_grampanchayat' }];
      component.selectedFarmer = { field_6: 3 };
      jest.spyOn(component, 'getGrampanchayatMap').mockResolvedValue(new Map());
      jest.spyOn(component, 'getVillageMap').mockResolvedValue(new Map());
      await component.generateRowData();
      expect(component.selectedFarmer.field_6).toBe(3);
    });
  });

  describe('onNoImage', () => {
    it('should set missedImage and check isAllImgMissed', () => {
      component.imageFiles = [{}, {}];
      component.onNoImage(null, component.imageFiles[0]);
      expect(component.imageFiles[0].missedImage).toBe(true);
      expect(component.isAllImgMissed).toBe(false);
      component.onNoImage(null, component.imageFiles[1]);
      expect(component.isAllImgMissed).toBe(true);
    });

    it('should handle empty imageFiles', () => {
      component.imageFiles = [];
      component.onNoImage(null, {});
      expect(component.isAllImgMissed).toBe(true); // every on empty is true
    });
  });

  describe('downloadFile', () => {
    it('should generate KML, add properties, and download if features', () => {
      component.kmlMap = { generateKML: jest.fn().mockReturnValue({ geoJson: { features: [{ properties: {} }] } }) };
      component.fields = [{ field_id: 1 }];
      component.selectedFarmer = { field_1: 'value' };
      component.fieldsMap.set('field_1', 'Label1');
      const downloadTextFileSpy = jest.spyOn(component, 'downloadTextFile');
      component.downloadFile();
      expect(component.kmlMap.generateKML).toHaveBeenCalled();
      expect(downloadTextFileSpy).toHaveBeenCalledWith('Munich_Re', expect.stringContaining('"Label1": "value"'));
    });

    it('should not download if no features', () => {
      component.kmlMap = { generateKML: jest.fn().mockReturnValue({ geoJson: {} }) };
      const downloadTextFileSpy = jest.spyOn(component, 'downloadTextFile');
      component.downloadFile();
      expect(downloadTextFileSpy).not.toHaveBeenCalled();
    });

    it('should not download if no kmlMap', () => {
      component.kmlMap = null;
      const downloadTextFileSpy = jest.spyOn(component, 'downloadTextFile');
      component.downloadFile();
      expect(downloadTextFileSpy).not.toHaveBeenCalled();
    });
  });

  describe('downloadTextFile', () => {
    it('should create and click download link', () => {
      const createElementSpy = jest.spyOn(document, 'createElement').mockReturnValue({
        setAttribute: jest.fn(),
        style: { visibility: '' },
        click: jest.fn()
      } as any);
      const appendChildSpy = jest.spyOn(document.body, 'appendChild').mockImplementation();
      const removeChildSpy = jest.spyOn(document.body, 'removeChild').mockImplementation();
      component.downloadTextFile('test', 'data');
      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(appendChildSpy).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalled();
    });
  });
});