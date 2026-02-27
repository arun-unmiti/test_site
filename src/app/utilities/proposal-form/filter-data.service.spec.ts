import { TestBed } from '@angular/core/testing';
import { FilterDataService } from './filter-data.service';
import { FilterService } from '../filter.service';
import { CoreService } from '../core.service';

class MockFilterService {
  isDistrictFetched = true;
  districts = [{ district_id: '1' }];
  tehsils = [{ tehsil_id: '1' }];
  isvillageFetched = true;
  states = [{ state_id: '1', state_name: 'State1' }];
  productCrops = [{ crop_code: '1', crop_name: 'Crop1' }];
  years = [{ id: '2023', year: '2023' }];
  seasons = [{ id: '1', season_name: 'Season1' }];
  lookupData: { clients: { id: number }[], users: { user_id: string; phone: string }[] } = { clients: [], users: [] };
  fetchedDistrictData = { subscribe: jest.fn() };
  fetchedVillageData = { subscribe: jest.fn() };
}

class MockCoreService {
  clone = jest.fn(obj => JSON.parse(JSON.stringify(obj)));
}

describe('FilterDataService', () => {
  let service: FilterDataService;
  let filterService: MockFilterService;
  let coreService: MockCoreService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        FilterDataService,
        { provide: FilterService, useClass: MockFilterService },
        { provide: CoreService, useClass: MockCoreService },
      ],
    });

    service = TestBed.inject(FilterDataService);
    filterService = TestBed.inject(FilterService) as any;
    coreService = TestBed.inject(CoreService) as any;
  });

  it('should create the component', () => {
    expect(service).toBeTruthy();
  });

  describe('getLookupData', () => {
    it('should populate all mappings correctly', () => {
      const component: any = {};
      service['getLookupData'](component);
      expect(component.stateMapping['state1']).toBe('1');
      expect(component.pairedCropMapping['crop1']).toBe('1');
      expect(component.yearMapping['2023']).toBe('2023');
      expect(component.seasonMapping['season1']).toBe('Season1');
    });
  });
});