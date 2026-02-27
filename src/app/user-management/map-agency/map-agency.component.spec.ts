import 'zone.js/bundles/zone-testing-bundle.umd.js';
import { ComponentFixture, TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbModule, NgbCollapseModule } from '@ng-bootstrap/ng-bootstrap';

import { MapAgencyComponent } from './map-agency.component';
import { CoreService } from 'src/app/utilities/core.service';
import { FilterService } from 'src/app/utilities/filter.service';
import { UserDetailService } from 'src/app/auth/user-detail.service';
import { FeatureToggleService } from '../../shared/services/feature-toggle.service';
import { InsightsService } from 'src/app/utilities/insights.service';

// Mock Services
class MockCoreService {
  post = jest.fn().mockResolvedValue({ status: 1 });
  clone = jest.fn(obj => JSON.parse(JSON.stringify(obj)));
  toast = jest.fn();
}

class MockFilterService {
  isLoactionFetched = true;
  fetchedLocationData = { subscribe: jest.fn() };
  seasons = [{ id: '1', season_name: 'Season1' }];
  years = [{ id: '2023', year: '2023' }];
}

class MockUserDetailService {
  getUserDetail = jest.fn(() => ({ user_role: '1', unit_id: '2000' }));
}

class MockFeatureToggleService {
  getContext = jest.fn(() => 'saksham');
}

class MockInsightsService {
  logException = jest.fn();
}

describe('MapAgencyComponent', () => {
  let component: MapAgencyComponent;
  let fixture: ComponentFixture<MapAgencyComponent>;
  let coreService: any;
  let filterService: any;
  let userService: any;
  let featureToggle: any;
  let insightsService: any;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MapAgencyComponent],
      imports: [
        HttpClientTestingModule,
        FormsModule,
        NgbModule,
        NgbCollapseModule,
      ],
      providers: [
        { provide: CoreService, useClass: MockCoreService },
        { provide: FilterService, useClass: MockFilterService },
        { provide: UserDetailService, useClass: MockUserDetailService },
        { provide: FeatureToggleService, useClass: MockFeatureToggleService },
        { provide: InsightsService, useClass: MockInsightsService },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(MapAgencyComponent);
    component = fixture.componentInstance;
    coreService = TestBed.inject(CoreService);
    filterService = TestBed.inject(FilterService);
    userService = TestBed.inject(UserDetailService);
    featureToggle = TestBed.inject(FeatureToggleService);
    insightsService = TestBed.inject(InsightsService);
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should set loggedUser and call methods', () => {
      const getFilterDataSpy = jest.spyOn(component, 'getFilterData');
      const fetchClientsSpy = jest.spyOn(component, 'fetchClients');
      component.ngOnInit();
      expect(component.loggedUser).toEqual(expect.objectContaining({ user_role: '1' }));
      expect(component.projectContext).toBe('saksham');
      expect(getFilterDataSpy).toHaveBeenCalled();
      expect(fetchClientsSpy).not.toHaveBeenCalled(); // since unit_id exists
    });

    it('should fetch clients if no unit_id', () => {
      userService.getUserDetail.mockReturnValueOnce({ user_role: '1' });
      const fetchClientsSpy = jest.spyOn(component, 'fetchClients');
      component.ngOnInit();
      expect(fetchClientsSpy).toHaveBeenCalled();
    });

    it('should add external data group for saksham', () => {
      component.ngOnInit();
      expect(component.screens.some(group => group.group_name === 'External Data')).toBe(true);
    });

    it('should set selectedClient to unit_id and call onClientSelect if unit_id exists', () => {
      const onClientSelectSpy = jest.spyOn(component, 'onClientSelect');
      component.ngOnInit();
      expect(component.selectedClient).toBe('2000');
      expect(onClientSelectSpy).toHaveBeenCalledWith('2000');
    });
  });

  describe('getFilterData', () => {
    it('should call setSeasonYear if fetched', () => {
      filterService.isLoactionFetched = true;
      const setSeasonYearSpy = jest.spyOn(component, 'setSeasonYear');
      component.getFilterData();
      expect(setSeasonYearSpy).toHaveBeenCalled();
    });

    it('should subscribe if not fetched', () => {
      filterService.isLoactionFetched = false;
      const setSeasonYearSpy = jest.spyOn(component, 'setSeasonYear');
      component.getFilterData();
      const subscriber = filterService.fetchedLocationData.subscribe.mock.calls[0][0];
      subscriber();
      expect(setSeasonYearSpy).toHaveBeenCalled();
    });
  });

  describe('setSeasonYear', () => {
    it('should set seasons and years', () => {
      component.setSeasonYear();
      expect(component.seasons).toEqual([{ id: '1', season_name: 'Season1' }]);
      expect(component.years).toEqual([{ id: '2023', year: '2023' }]);
    });
  });

  describe('onClientSelect', () => {
    it('should call fetchAgencies and clear states', () => {
      const fetchAgenciesSpy = jest.spyOn(component, 'fetchAgencies');
      component.states = [{}]; // Set some states to verify clearing
      component.onClientSelect('2000');
      expect(component.states).toEqual([]);
      expect(fetchAgenciesSpy).toHaveBeenCalledWith('2000');
    });
  });

  describe('clearLocationData', () => {
    it('should clear states', () => {
      component.states = [{ state_id: '1' }];
      component.clearLocationData();
      expect(component.states).toEqual([]);
    });
  });

  describe('fetchClients', () => {
    beforeEach(() => {
      component.projectContext = 'saksham';
    });
    
    it('should fetch clients', async () => {
      coreService.post.mockResolvedValueOnce({ status: 1, all_units: [{ UNIT_ID: '1' }] });
      await component.fetchClients();
      expect(component.clients).toEqual([{ UNIT_ID: '1' }]);
    });

    it('should not call onClientSelect for role >= 2', fakeAsync(async () => {
      component.loggedUser = { user_role: '2' };
      coreService.post.mockResolvedValueOnce({ status: 1, all_units: [{ UNIT_ID: '1' }] });
      const onClientSelectSpy = jest.spyOn(component, 'onClientSelect');
      await component.fetchClients();
      tick();
      expect(onClientSelectSpy).not.toHaveBeenCalled();
    }));

    it('should not call onClientSelect for non-saksham context', fakeAsync(async () => {
      component.projectContext = 'munichre';
      component.loggedUser = { user_role: '1' };
      coreService.post.mockResolvedValueOnce({ status: 1, all_units: [{ UNIT_ID: '1' }] });
      const onClientSelectSpy = jest.spyOn(component, 'onClientSelect');
      await component.fetchClients();
      tick();
      expect(onClientSelectSpy).not.toHaveBeenCalled();
    }));
  });

  describe('fetchAgencies', () => {
    it('should fetch agencies', async () => {
      coreService.post.mockResolvedValueOnce({ status: 1, all_agencies: [{ agency_id: '1' }] });
      await component.fetchAgencies('2000');
      expect(component.agencies).toEqual([{ agency_id: '1' }]);
      expect(component.allAgencies.get('2000')).toEqual([{ agency_id: '1' }]);
    });

    it('should use cached agencies if available', () => {
      component.allAgencies.set('2000', [{ agency_id: '1' }]);
      component.fetchAgencies('2000');
      expect(component.agencies).toEqual([{ agency_id: '1' }]);
      expect(coreService.post).not.toHaveBeenCalled();
    });

    it('should not fetch if no clientId', () => {
      component.fetchAgencies('');
      expect(coreService.post).not.toHaveBeenCalled();
    });
  });

  describe('onStateToggle', () => {
    it('should toggle state collapsed', () => {
      const state = { collapsed: false };
      component.onStateToggle(state);
      expect(state.collapsed).toBe(true);
    });
  });

  describe('onSearchClick', () => {
    it('should reset screens isActive to true before search', fakeAsync(async () => {
      component.ngOnInit(); // to initialize screens
      component.screens[0].screens[0].isActive = false;
      coreService.post.mockResolvedValueOnce({ status: 1, states: [], assignedScreens: {} });
      component.onSearchClick();
      tick();
      flush();
      expect(component.screens[0].screens[0].isActive).toBe(true);
    }));
  });

  describe('assignAllLocation', () => {
    it('should assign all locations including blocks', () => {
      component.states = [
        {
          districts: [
            {
              tehsils: [
                { blocks: [{}, {}] }
              ]
            }
          ]
        }
      ];
      component.assignAllLocation();
      expect(component.states[0].checked).toBe(true);
      expect(component.states[0].districts[0].checked).toBe(true);
      expect(component.states[0].districts[0].tehsils[0].checked).toBe(true);
      expect(component.states[0].districts[0].tehsils[0].blocks[0].checked).toBe(true);
    });

    it('should handle without districts or tehsils', () => {
      component.states = [{}];
      component.assignAllLocation();
      expect(component.states[0].checked).toBe(true);
    });
  });

  describe('refreshCheckbox', () => {
    it('should refresh checkboxes with tehsils and set indeterminate', fakeAsync(() => {
      component.states = [
        {
          districts: [
            {
              tehsils: [
                { checked: true },
                { checked: false }
              ]
            }
          ]
        }
      ];
      component.refreshCheckbox();
      tick();
      expect(component.states[0].districts[0].checked).toBe(false);
      expect(component.states[0].districts[0].indeterminate).toBe(true);
      expect(component.states[0].checked).toBe(false);
      expect(component.states[0].indeterminate).toBe(true);
    }));

    it('should handle all checked', fakeAsync(() => {
      component.states = [
        {
          districts: [
            {
              tehsils: [
                { checked: true },
                { checked: true }
              ]
            }
          ]
        }
      ];
      component.refreshCheckbox();
      tick();
      expect(component.states[0].districts[0].checked).toBe(true);
      expect(component.states[0].districts[0].indeterminate).toBe(false);
      expect(component.states[0].checked).toBe(true);
      expect(component.states[0].indeterminate).toBe(false);
    }));

    it('should handle no districts or tehsils', () => {
      component.states = [{}];
      component.refreshCheckbox();
      // No errors
      expect(true).toBe(true);
    });
  });

  describe('onStateChanged', () => {
    it('should handle state change and propagate to districts', () => {
      const data: any = { districts: [{ tehsils: [] }] };
      const onDistrictChangeSpy = jest.spyOn(component, 'onDistrictChange');
      const refreshCheckboxSpy = jest.spyOn(component, 'refreshCheckbox');
      component.onStateChanged(true, data);
      expect(data.indeterminate).toBe(false);
      expect(onDistrictChangeSpy).toHaveBeenCalledWith(true, data.districts[0], true);
      expect(refreshCheckboxSpy).toHaveBeenCalled();
    });

    it('should not refresh if noRefresh', () => {
      const data = {};
      const refreshCheckboxSpy = jest.spyOn(component, 'refreshCheckbox');
      component.onStateChanged(true, data, true);
      expect(refreshCheckboxSpy).not.toHaveBeenCalled();
    });
  });

  describe('onDistrictChange', () => {
    it('should handle district change and propagate to tehsils', () => {
      const data: any = { tehsils: [{}] };
      const onTehsilChangeSpy = jest.spyOn(component, 'onTehsilChange');
      const refreshCheckboxSpy = jest.spyOn(component, 'refreshCheckbox');
      component.onDistrictChange(true, data);
      expect(data.checked).toBe(true);
      expect(data.indeterminate).toBe(false);
      expect(onTehsilChangeSpy).toHaveBeenCalledWith(true, data.tehsils[0], true);
      expect(refreshCheckboxSpy).toHaveBeenCalled();
    });

    it('should not refresh if noRefresh', () => {
      const data = {};
      const refreshCheckboxSpy = jest.spyOn(component, 'refreshCheckbox');
      component.onDistrictChange(true, data, true);
      expect(refreshCheckboxSpy).not.toHaveBeenCalled();
    });
  });

  describe('onTehsilChange', () => {
    it('should handle tehsil change', () => {
      const data: any = {};
      const refreshCheckboxSpy = jest.spyOn(component, 'refreshCheckbox');
      component.onTehsilChange(true, data);
      expect(data.checked).toBe(true);
      expect(data.indeterminate).toBe(false);
      expect(refreshCheckboxSpy).toHaveBeenCalled();
    });

    it('should not refresh if noRefresh', () => {
      const data: any = {};
      const refreshCheckboxSpy = jest.spyOn(component, 'refreshCheckbox');
      component.onTehsilChange(true, data, true);
      expect(refreshCheckboxSpy).not.toHaveBeenCalled();
    });
  });

  describe('onSubmit', () => {
    beforeEach(() => {
      component.ngOnInit(); // Initialize screens
    });

    it('should collect from indeterminate states', fakeAsync(async () => {
      component.states = [
        { state_id: '1', indeterminate: true, districts: [{ district_id: '1', indeterminate: true, tehsils: [{ tehsil_id: '1', checked: true }, { tehsil_id: '2', checked: false }] }] }
      ];
      coreService.post.mockResolvedValueOnce({ status: 1, msg: 'Success' });
      component.onSubmit();
      tick();
      flush();
      expect(coreService.post).toHaveBeenCalledWith('agency', expect.objectContaining({
        tehsils: [{ state_id: '1', district_id: '1', tehsil_id: '1' }]
      }));
    }));

    it('should submit mapping', async () => {
      component.states = [{ state_id: '1', checked: true, districts: [{ district_id: '1', checked: true, tehsils: [{ tehsil_id: '1', checked: true }] }] }];
      component.selectedClient = '2000';
      component.selectedAgency = 'agency1';
      component.selectedSeason = '1';
      component.selectedYear = '2023';
      coreService.post.mockResolvedValueOnce({ status: 1, msg: 'Success' });
      const onSearchClickSpy = jest.spyOn(component, 'onSearchClick');
      await component.onSubmit();
      expect(coreService.post).toHaveBeenCalledWith('agency', expect.objectContaining({ purpose: 'update_agency_mapping' }));
      expect(coreService.toast).toHaveBeenCalledWith('success', 'Success');
      expect(onSearchClickSpy).toHaveBeenCalled();
    });
  });
});