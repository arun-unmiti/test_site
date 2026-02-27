import { ComponentFixture, TestBed, fakeAsync, tick, flushMicrotasks } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of } from 'rxjs';

import { MapClientComponent } from './map-client.component';
import { CoreService } from '../../utilities/core.service';
import { FilterService } from '../../utilities/filter.service';
import { FeatureToggleService } from '../../shared/services/feature-toggle.service';
import { environment, ProjectContext } from '../../../environments/environment';
import { InsightsService } from '../../utilities/insights.service';

// Mock environment
jest.mock('../../../environments/environment', () => ({
  environment: {
    projectConfigs: {
      munichre: { assetsFolder: '/assets/munichre' },
      saksham: { assetsFolder: '/assets/saksham' },
      testContext: { assetsFolder: '/assets/test/' }
    }
  }
}));

describe('MapClientComponent', () => {
  let component: MapClientComponent;
  let fixture: ComponentFixture<MapClientComponent>;
  let coreService: any;
  let filterService: any;
  let featureToggleService: any;
  let mockInsightsService: any;

  beforeEach(async () => {
    coreService = {
      post: jest.fn().mockResolvedValue({}),
      toast: jest.fn(),
      clone: jest.fn(obj => JSON.parse(JSON.stringify(obj))),
    };

    filterService = {
      isLoactionFetched: true,
      seasons: [{ id: 1, season_name: 'Season1' }],
      years: [{ id: 2023, year: 2023 }],
      fetchedLocationData: { subscribe: jest.fn() },
    };

    featureToggleService = {
      getContext: jest.fn().mockReturnValue('testContext' as ProjectContext),
    };

    mockInsightsService = {
      logException: jest.fn(),
    };

    await TestBed.configureTestingModule({
      declarations: [MapClientComponent],
      providers: [
        { provide: CoreService, useValue: coreService },
        { provide: FilterService, useValue: filterService },
        { provide: FeatureToggleService, useValue: featureToggleService },
        { provide: InsightsService, useValue: mockInsightsService }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(MapClientComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    mockInsightsService.logException.mockReset();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should set selectedClient to 2000 if projectContext is saksham', () => {
    featureToggleService.getContext.mockReturnValueOnce('saksham');
    const comp = new MapClientComponent(coreService as any, filterService as any, featureToggleService as any, mockInsightsService as any);
    expect(comp.selectedClient).toBe('2000');
  });

  describe('ngOnInit', () => {
    it('should call getFilterData and getAllClient', () => {
      const getFilterDataSpy = jest.spyOn(component, 'getFilterData');
      const getAllClientSpy = jest.spyOn(component, 'getAllClient');
      component.ngOnInit();
      expect(getFilterDataSpy).toHaveBeenCalled();
      expect(getAllClientSpy).toHaveBeenCalled();
    });
  });

  describe('getAllClient', () => {
    it('should fetch and filter active clients', async () => {
      const mockResponse = {
        status: 1,
        all_clients: [
          { UNIT_ID: 1, UNIT_NAME: 'Active', UNIT_STATUS: 1 },
          { UNIT_ID: 2, UNIT_NAME: 'Inactive', UNIT_STATUS: 0 },
        ],
      };
      coreService.post.mockResolvedValueOnce(mockResponse);

      await component.getAllClient();

      expect(coreService.post).toHaveBeenCalledWith('client', { purpose: 'get_all_created' });
      expect(component.clients).toEqual([{ UNIT_ID: 1, UNIT_NAME: 'Active', UNIT_STATUS: 1 }]);
    });
  });

  describe('getFilterData', () => {
    it('should increment loader, call setSeasonYear if locations fetched', () => {
      filterService.isLoactionFetched = true;
      const setSeasonYearSpy = jest.spyOn(component, 'setSeasonYear');
      component.getFilterData();
      expect(component.loader).toBe(0); // inc then dec
      expect(setSeasonYearSpy).toHaveBeenCalled();
    });
  });

  describe('setSeasonYear', () => {
    it('should set seasons and years from filter service', () => {
      component.setSeasonYear();
      expect(component.seasons).toEqual(filterService.seasons);
      expect(component.years).toEqual(filterService.years);
    });
  });

  describe('getClientLocation', () => {
    it('should toast warning if no client selected', () => {
      component.selectedClient = '';
      component.getClientLocation();
      expect(coreService.toast).toHaveBeenCalledWith('warn', 'Client is required');
    });

    it('should toast warning if no season selected', () => {
      component.selectedClient = '1';
      component.selectedSeason = '';
      component.getClientLocation();
      expect(coreService.toast).toHaveBeenCalledWith('warn', 'Season is required');
    });

    it('should toast warning if no year selected', () => {
      component.selectedClient = '1';
      component.selectedSeason = '1';
      component.selectedYear = '';
      component.getClientLocation();
      expect(coreService.toast).toHaveBeenCalledWith('warn', 'Year is required');
    });
  });

  describe('onClientChange', () => {
    it('should clear allLocation', () => {
      component.allLocation = [{}];
      component.onClientChange(null);
      expect(component.allLocation).toEqual([]);
    });
  });

  describe('onSeasonChange', () => {
    it('should clear allLocation', () => {
      component.allLocation = [{}];
      component.onSeasonChange(null);
      expect(component.allLocation).toEqual([]);
    });
  });

  describe('onYearChange', () => {
    it('should clear allLocation', () => {
      component.allLocation = [{}];
      component.onYearChange(null);
      expect(component.allLocation).toEqual([]);
    });
  });

  describe('onSearchClick', () => {
    it('should call getClientLocation', () => {
      const spy = jest.spyOn(component, 'getClientLocation');
      component.onSearchClick();
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('assignAllLocation', () => {
    it('should set all locations and districts to checked', () => {
      component.allLocation = [
        {
          checked: false,
          intermediate: true,
          districts: [{ checked: false }, { checked: false }],
        },
      ];
      component.assignAllLocation();
      expect(component.allLocation[0].checked).toBe(true);
      expect(component.allLocation[0].intermediate).toBe(false);
      expect(component.allLocation[0].districts[0].checked).toBe(true);
      expect(component.allLocation[0].districts[1].checked).toBe(true);
    });
  });

  describe('onStateChange', () => {
    it('should update districts checked status', () => {
      const state = {
        checked: true,
        districts: [{ checked: false }, { checked: false }],
      };
      component.onStateChange(state);
      expect(state.districts[0].checked).toBe(true);
      expect(state.districts[1].checked).toBe(true);
    });
  });

  describe('onDistrictChange', () => {
    it('should update state checked and intermediate based on districts', fakeAsync(() => {
      const stateAllChecked: any = {
        districts: [{ checked: true }, { checked: true }],
      };
      component.onDistrictChange(stateAllChecked);
      expect(stateAllChecked.checked).toBe(true);
      expect(stateAllChecked.intermediate).toBe(false);

      const stateNoneChecked: any = {
        districts: [{ checked: false }, { checked: false }],
      };
      component.onDistrictChange(stateNoneChecked);
      tick(100);
      expect(stateNoneChecked.checked).toBe(false);
      expect(stateNoneChecked.intermediate).toBe(false);

      const stateSomeChecked: any = {
        districts: [{ checked: true }, { checked: false }],
      };
      component.onDistrictChange(stateSomeChecked);
      tick(100);
      expect(stateSomeChecked.checked).toBe(false);
      expect(stateSomeChecked.intermediate).toBe(true);
    }));
  });
});