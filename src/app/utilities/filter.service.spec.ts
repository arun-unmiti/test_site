import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { CoreService } from './core.service';
import { UserDetailService } from '../auth/user-detail.service';
import { of, throwError } from 'rxjs';
import { FilterService } from './filter.service';

describe('FilterService', () => {
  let service: FilterService;
  let coreService: jest.Mocked<CoreService>;
  let userDetailService: jest.Mocked<UserDetailService>;

  const mockLookupData = {
    states: [{ state_id: 1, name: 'State1' }, { state_id: null }],
    districts: [{ district_id: 1, state_id: 1, name: 'District1' }, { district_id: null }],
    tehsils: [{ tehsil_id: 1, district_id: 1, name: 'Tehsil1' }, { tehsil_id: null }],
    blocks: [{ block_id: 1, name: 'Block1' }],
    grampanchayats: [{ gp_id: 1, name: 'GP1' }],
    crops: [{ crop_id: 1, name: 'Crop1' }],
    productCrops: [{ crop_id: 2, name: 'ProductCrop1' }],
    ifscs: [{ ifsc: 'IFSC1' }],
    soil_types: [{ soil_id: 1, name: 'Soil1' }],
    clients: [{ client_id: 1, name: 'Client1' }],
    season: [{ season_id: 1, name: 'Season1' }],
    year: [{ year: 2023 }],
    notified_unit: [{ unit_id: 1, name: 'Unit1' }],
    agencies: [{ agency_id: 1, name: 'Agency1' }],
    users: [{ user_id: 1, name: 'User1' }],
    villages: [{ village_id: 1, name: 'Village1' }],
  };

  const mockUser = { user_role: '1', user_id: 1 };

  beforeEach(() => {
    coreService = {
      dashboard_post: jest.fn(),
      postWithError: jest.fn(),
      post: jest.fn(),
      toast: jest.fn(),
      clearCache: [],
      addLookup: jest.fn(),
      clone: jest.fn((obj) => JSON.parse(JSON.stringify(obj))),
    } as any;

    userDetailService = {
      getUserDetail: jest.fn().mockReturnValue(mockUser),
      setLocation: jest.fn(),
    } as any;

    jest.spyOn(FilterService.prototype, 'getLookupData').mockReturnValue(Promise.resolve());

    TestBed.configureTestingModule({
      providers: [
        FilterService,
        { provide: CoreService, useValue: coreService },
        { provide: UserDetailService, useValue: userDetailService },
      ],
    });

    service = TestBed.inject(FilterService);
  });

  it('should create the component', () => {
    expect(service).toBeTruthy();
  });

  describe('constructor', () => {
    it('should call getLookupData and set up logout callback and addLookup', () => {
      jest.restoreAllMocks();
      const getSpy = jest.spyOn(FilterService.prototype, 'getLookupData').mockReturnValue(Promise.resolve());
      const logoutSpy = jest.spyOn(FilterService.prototype, 'onLogout');

      coreService.clearCache = [];
      const instance = new FilterService(coreService, userDetailService);

      expect(getSpy).toHaveBeenCalledTimes(1);
      expect(coreService.clearCache.length).toBe(1);
      coreService.clearCache[0]();
      expect(logoutSpy).toHaveBeenCalled();

      instance.states = [];
      coreService.addLookup();
      expect(getSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('onLogout', () => {
    it('should reset all flags and arrays', () => {
      service.isDataFetched = true;
      service.isDistrictFetched = true;
      service.isLoactionFetched = true;
      service.lookupData = {};
      service.states = [{} as any];
      service.districts = [{} as any];
      service.tehsils = [{} as any];
      service.blocks = [{} as any];
      service.grampanchayats = [{} as any];
      service.crops = [{} as any];
      service.productCrops = [{} as any];
      service.ifscs = [{} as any];
      service.soilTypes = [{} as any];
      service.clients = [{} as any];
      service.stateOptionList = [{} as any];
      service.villages = [{} as any];

      service.onLogout();

      expect(service.isDataFetched).toBe(false);
      expect(service.isDistrictFetched).toBe(false);
      expect(service.isLoactionFetched).toBe(false);
      expect(service.lookupData).toBeNull();
      expect(service.states).toEqual([]);
      expect(service.districts).toEqual([]);
      expect(service.tehsils).toEqual([]);
      expect(service.blocks).toEqual([]);
      expect(service.grampanchayats).toEqual([]);
      expect(service.crops).toEqual([]);
      expect(service.productCrops).toEqual([]);
      expect(service.ifscs).toEqual([]);
      expect(service.soilTypes).toEqual([]);
      expect(service.clients).toEqual([]);
      expect(service.stateOptionList).toEqual([]);
      expect(service.villages).toEqual([]);
    });
  });

  describe('getLookupData', () => {
    beforeEach(() => {
      jest.restoreAllMocks();
    });

    it('should fetch data, set values on success', async () => {
      coreService.dashboard_post.mockResolvedValue(mockLookupData);
      const setSpy = jest.spyOn(service, 'setValues');

      await service.getLookupData();

      expect(coreService.dashboard_post).toHaveBeenCalledWith({ purpose: 'get_lookups' });
      expect(setSpy).toHaveBeenCalled();
    });

    it('should handle error, set empty, toast if not string error', async () => {
      const error = new Error('error');
      coreService.dashboard_post.mockRejectedValue(error);
      const setSpy = jest.spyOn(service, 'setValues').mockImplementation(() => {});

      await service.getLookupData();

      expect(setSpy).toHaveBeenCalled();
      expect(service.lookupData).toEqual({});
      expect(coreService.toast).toHaveBeenCalledWith('error', 'Unable to get location data, Please contact admin');
    });

    it('should not toast if error is string', async () => {
      coreService.dashboard_post.mockRejectedValue('string error');
      const setSpy = jest.spyOn(service, 'setValues').mockImplementation(() => {});

      await service.getLookupData();

      expect(setSpy).toHaveBeenCalled();
      expect(coreService.toast).not.toHaveBeenCalled();
    });
  });

  describe('setValues', () => {
    it('should set default empty arrays for missing keys', () => {
      service.lookupData = {
        states: [],
        districts: [],
        tehsils: [],
        blocks: [],
        grampanchayats: [],
        crops: [],
        productCrops: [],
        ifscs: [],
        soil_types: [],
        clients: [],
        season: [],
        year: [],
        notified_unit: [],
        agencies: [],
        users: [],
        villages: [],
        missing: null,
      };
      service.setValues();
      expect(service.lookupData.missing).toEqual([]);
    });

    it('should filter null ids and set properties, emit subjects', () => {
      service.lookupData = mockLookupData;
      const gpSpy = jest.spyOn(service, 'getGrampanchayatVillages').mockReturnValue(undefined);
      const nextSpy = jest.spyOn(service['fetchedLookupData'], 'next');
      const districtNextSpy = jest.spyOn(service['fetchedDistrictData'], 'next');
      const locationNextSpy = jest.spyOn(service['fetchedLocationData'], 'next');

      service.setValues();

      expect(service.states).toEqual([{ state_id: 1, name: 'State1' }]);
      expect(service.districts).toEqual([{ district_id: 1, state_id: 1, name: 'District1' }]);
      expect(service.tehsils).toEqual([{ tehsil_id: 1, district_id: 1, name: 'Tehsil1' }]);
      expect(service.blocks).toEqual(mockLookupData.blocks);
      expect(service.crops).toEqual(mockLookupData.crops);
      expect(service.productCrops).toEqual(mockLookupData.productCrops);
      expect(service.ifscs).toEqual(mockLookupData.ifscs);
      expect(service.soilTypes).toEqual(mockLookupData.soil_types);
      expect(service.clients).toEqual(mockLookupData.clients);
      expect(service.seasons).toEqual(mockLookupData.season);
      expect(service.years).toEqual(mockLookupData.year);
      expect(service.notifiedUnits).toEqual(mockLookupData.notified_unit);
      expect(service.agencies).toEqual(mockLookupData.agencies);
      expect(service.users).toEqual(mockLookupData.users);
      expect(service.grampanchayats).toEqual([]);
      expect(service.villages).toEqual([]);
      expect(nextSpy).toHaveBeenCalled();
      expect(districtNextSpy).toHaveBeenCalled();
      expect(locationNextSpy).toHaveBeenCalled();
      expect(service.isDataFetched).toBe(true);
      expect(service.isDistrictFetched).toBe(true);
      expect(service.isLoactionFetched).toBe(true);
      expect(userDetailService.setLocation).toHaveBeenCalledWith(service.states, service.districts);
      expect(gpSpy).toHaveBeenCalled();
    });
  });

  describe('getDistrictData', () => {
    it('should fetch and push districts for multiple ids', async () => {
      coreService.postWithError.mockResolvedValueOnce({ status: 1, lkp_district: [{ district_id: 2 }] });
      coreService.postWithError.mockResolvedValueOnce({ status: 1, lkp_district: [{ district_id: 3 }] });

      await service.getDistrictData([1, 2]);

      expect(coreService.postWithError).toHaveBeenCalledWith({ purpose: "get_locations", location_type: "lkp_district", location_id: 1 });
      expect(coreService.postWithError).toHaveBeenCalledWith({ purpose: "get_locations", location_type: "lkp_district", location_id: 2 });
      expect(service.districts).toEqual([{ district_id: 2 }, { district_id: 3 }]);
      expect(service.districts).toHaveLength(2);
    });

    it('should skip if status not 1', async () => {
      coreService.postWithError.mockResolvedValue({ status: 0 });

      await service.getDistrictData([1]);

      expect(service.districts).toHaveLength(0);
    });
  });

  describe('getTehsilData', () => {
    it('should fetch and push tehsils for multiple ids', async () => {
      coreService.postWithError.mockResolvedValueOnce({ status: 1, lkp_tehsil: [{ tehsil_id: 2 }] });
      coreService.postWithError.mockResolvedValueOnce({ status: 1, lkp_tehsil: [{ tehsil_id: 3 }] });

      await service.getTehsilData([1, 2]);

      expect(coreService.postWithError).toHaveBeenCalledTimes(2);
      expect(service.tehsils).toHaveLength(2);
    });

    it('should skip if status not 1', async () => {
      coreService.postWithError.mockResolvedValue({ status: 0 });

      await service.getTehsilData([1]);

      expect(service.tehsils).toHaveLength(0);
    });
  });

  describe('getBlockData', () => {
    it('should fetch and push blocks for multiple ids', async () => {
      coreService.postWithError.mockResolvedValueOnce({ status: 1, lkp_block: [{ block_id: 2 }] });
      coreService.postWithError.mockResolvedValueOnce({ status: 1, lkp_block: [{ block_id: 3 }] });

      await service.getBlockData([1, 2]);

      expect(coreService.postWithError).toHaveBeenCalledTimes(2);
      expect(service.blocks).toHaveLength(2);
    });

    it('should skip if status not 1', async () => {
      coreService.postWithError.mockResolvedValue({ status: 0 });

      await service.getBlockData([1]);

      expect(service.blocks).toHaveLength(0);
    });
  });

  describe('getGrampanchayatData', () => {
    it('should fetch and push grampanchayats for multiple ids', async () => {
      coreService.postWithError.mockResolvedValueOnce({ status: 1, lkp_grampanchayat: [{ gp_id: 2 }] });
      coreService.postWithError.mockResolvedValueOnce({ status: 1, lkp_grampanchayat: [{ gp_id: 3 }] });

      await service.getGrampanchayatData([1, 2]);

      expect(coreService.postWithError).toHaveBeenCalledTimes(2);
      expect(service.grampanchayats).toHaveLength(2);
    });

    it('should skip if status not 1', async () => {
      coreService.postWithError.mockResolvedValue({ status: 0 });

      await service.getGrampanchayatData([1]);

      expect(service.grampanchayats).toHaveLength(0);
    });
  });

  describe('getVillageData', () => {
    it('should fetch and push villages for multiple ids', async () => {
      coreService.postWithError.mockResolvedValueOnce({ status: 1, lkp_village: [{ village_id: 2 }] });
      coreService.postWithError.mockResolvedValueOnce({ status: 1, lkp_village: [{ village_id: 3 }] });

      await service.getVillageData([1, 2]);

      expect(coreService.postWithError).toHaveBeenCalledTimes(2);
      expect(service.villages).toHaveLength(2);
    });

    it('should skip if status not 1', async () => {
      coreService.postWithError.mockResolvedValue({ status: 0 });

      await service.getVillageData([1]);

      expect(service.villages).toHaveLength(0);
    });
  });

  describe('getDistrictByState', () => {
    it('should return existing districts, fetch missing', async () => {
      service.districts = [{ district_id: 1, state_id: 1 }];
      coreService.postWithError.mockResolvedValue({ status: 1, lkp_district: [{ district_id: 2, state_id: 2 }] });

      const res = await service.getDistrictByState([1, 2]);
      expect(res).toHaveLength(2);

      expect(coreService.postWithError).toHaveBeenCalledWith({ purpose: "get_locations", location_type: "lkp_district", location_id: 2 });
      expect(service.districts).toHaveLength(2);
    });

    it('should return empty if no states', async () => {
      const res = await service.getDistrictByState([]);
      expect(res).toEqual([]);

      expect(coreService.postWithError).not.toHaveBeenCalled();
    });
  });

  describe('getClientWiseLocation', () => {
    it('should return locations for clients', async () => {
      coreService.dashboard_post.mockResolvedValue({ states: [1], districts: [1] });

      const res = await service.getClientWiseLocation([{ UNIT_ID: 1 }]);
      expect(res).toEqual([[1], [1]]);

      expect(coreService.dashboard_post).toHaveBeenCalledWith('result/get_all_client_district', { client_id: [1] });
    });

    it('should return empty if no clients', async () => {
      const res = await service.getClientWiseLocation([]);
      expect(res).toEqual([[], []]);

      expect(coreService.dashboard_post).not.toHaveBeenCalled();
    });

    it('should handle error', async () => {
      coreService.dashboard_post.mockRejectedValue('error');

      const res = await service.getClientWiseLocation([{ UNIT_ID: 1 }]);
      expect(res).toEqual([[], []]);
    });
  });

  describe('getAgencyWiseLocation', () => {
    it('should use cache if available', async () => {
      const key = JSON.stringify({ purpose: 'get_agency_locations', client: 1, agency: 1, year: 2023, season: 1 });
      service['agencyWiseLocationMap'].set(key, { states: [{}], districts: [{}], tehsils: [{}] });

      const res: any = await service.getAgencyWiseLocation({ client: 1, agency: 1, year: 2023, season: 1 }, mockUser);
      expect(res.states).toHaveLength(1);

      expect(coreService.dashboard_post).not.toHaveBeenCalled();
    });

    it('should fetch for user role 7', async () => {
      userDetailService.getUserDetail.mockReturnValue({ user_role: 7, user_id: 1 });
      coreService.dashboard_post.mockResolvedValue({ status: 1, selectedLoc: JSON.stringify({ states: [1], districts: [1], tehsils: [1] }) });
      service.states = [{ state_id: 1 }];
      service.districts = [{ district_id: 1 }];
      service.tehsils = [{ tehsil_id: 1 }];

      const res: any = await service.getAgencyWiseLocation({ client: 1, agency: 1, year: 2023, season: 1 }, { user_role: 7, user_id: 1 });
      expect(res.states).toHaveLength(1);

      expect(coreService.dashboard_post).toHaveBeenCalledWith('users', expect.objectContaining({ purpose: 'get_user_locations' }));
    });

    it('should fetch for agency 0 or includes 0', async () => {
      coreService.dashboard_post.mockResolvedValue({ status: 1, selected: { states: [1], districts: [1] } });
      service.states = [{ state_id: 1 }];
      service.districts = [{ district_id: 1, state_id: 1 }];
      service.tehsils = [{ tehsil_id: 1, district_id: 1 }];

      const res: any = await service.getAgencyWiseLocation({ client: 1, agency: [0], year: 2023, season: 1 }, mockUser);
      expect(res.tehsils).toHaveLength(1);

      expect(coreService.dashboard_post).toHaveBeenCalledWith('client', expect.objectContaining({ purpose: 'location' }));
    });

    it('should fetch for other agencies', async () => {
      coreService.dashboard_post.mockResolvedValue({ status: 1, selectedLoc: JSON.stringify({ states: [1], districts: [1], tehsils: [1] }) });
      service.states = [{ state_id: 1 }];
      service.districts = [{ district_id: 1 }];
      service.tehsils = [{ tehsil_id: 1 }];

      const res: any = await service.getAgencyWiseLocation({ client: 1, agency: 1, year: 2023, season: 1 }, mockUser);
      expect(res.states).toHaveLength(1);

      expect(coreService.dashboard_post).toHaveBeenCalledWith('agency', expect.objectContaining({ purpose: 'get_agency_locations' }));
    });

    it('should return empty on error or status not 1', async () => {
      coreService.dashboard_post.mockResolvedValue({ status: 0 });

      const res: any = await service.getAgencyWiseLocation({ client: 1, agency: 1, year: 2023, season: 1 }, mockUser);
      expect(res.states).toEqual([]);
    });
  });

  describe('getGrampanchayatVillages', () => {
    it('should handle error', fakeAsync(() => {
      coreService.post.mockRejectedValueOnce('error');
      coreService.post.mockRejectedValueOnce('error');

      service.getGrampanchayatVillages();
      tick();

      expect(service.grampanchayats).toEqual([]);
      expect(service.villages).toEqual([]);
    }));
  });
});