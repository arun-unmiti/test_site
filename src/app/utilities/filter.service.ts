import { Injectable } from "@angular/core";
import { CoreService } from "./core.service";
import { Subject } from "rxjs";
import { UserDetailService } from "../auth/user-detail.service";
@Injectable({
  providedIn: "root",
})
export class FilterService {
  public fetchedLookupData = new Subject();
  public fetchedLocationData = new Subject();
  public fetchedDistrictData = new Subject();
  public fetchedVillageData = new Subject();
  public isDataFetched = false;
  public isDistrictFetched = false;
  public isLoactionFetched = false;
  public isvillageFetched = false;
  public lookupData: any;
  public states: any[] = [];
  public districts: any[] = [];
  public tehsils: any[] = [];
  public blocks: any[] = [];
  public grampanchayats: any[] = [];
  public crops: any[] = [];
  public productCrops: any[] = [];
  public ifscs: any[] = [];
  public soilTypes: any[] = [];
  public clients: any[] = [];
  public seasons: any[] = [];
  public years: any[] = [];
  public notifiedUnits: any[] = [];
  public agencies: any[] = [];
  public stateOptionList: any[] = [];
  public villages: any[] = [];
  users: any[] = [];
  private agencyWiseLocationMap: Map<any, any> = new Map();
  constructor(private core: CoreService, private userService: UserDetailService) {
    this.getLookupData();
    const clearUser = () => this.onLogout();
    this.core.clearCache.push(clearUser);
    this.core.addLookup = () => {
      if (!this.states.length) this.getLookupData();
    };
  }
  onLogout() {
    this.isDataFetched = false;
    this.isDistrictFetched = false;
    this.isLoactionFetched = false;
    this.lookupData = null;
    this.states = [];
    this.districts = [];
    this.tehsils = [];
    this.blocks = [];
    this.grampanchayats = [];
    this.crops = [];
    this.productCrops = [];
    this.ifscs = [];
    this.soilTypes = [];
    this.clients = [];
    this.stateOptionList = [];
    this.villages = [];
  }
  async getLookupData() {
    const request = { purpose: "get_lookups" };
    await this.core.dashboard_post(request).then((response: any) => {
        this.lookupData = response;
        this.setValues();
      }).catch((err) => {
        this.lookupData = {};
        this.setValues();
        if (typeof err != "string") {
          this.core.toast("error", "Unable to get location data, Please contact admin");
        }
      });
  }
  setValues() {
    this.initializeLookupData();
    this.filterAndAssignLocations();
    this.assignOtherLookups();
    this.finalizeDataFetch();
  }
  private initializeLookupData() {
    const expectedKeys = ['states', 'districts', 'tehsils', 'blocks', 'grampanchayats', 'crops', 'productCrops', 'ifscs', 'soil_types', 'clients', 'season', 'year', 'notified_unit', 'agencies', 'users', 'villages'];
    expectedKeys.forEach(k => {
      if (!this.lookupData[k]) {
        this.lookupData[k] = [];
      }
    });
    const keys = Object.keys(this.lookupData);
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      if (!this.lookupData[k]) {
        this.lookupData[k] = [];
      }
    }
  }
  private filterAndAssignLocations() {
    this.lookupData.states = this.lookupData.states.filter((item: { state_id: number | null }) => item.state_id != null);
    this.states = this.lookupData.states;
    this.lookupData.districts = this.lookupData.districts.filter((item: { district_id: number | null }) => item.district_id != null);
    this.districts = this.lookupData.districts;
    this.lookupData.tehsils = this.lookupData.tehsils.filter((item: { tehsil_id: number | null }) => item.tehsil_id != null);
    this.tehsils = this.lookupData.tehsils;
    this.blocks = this.lookupData.blocks || [];
    this.grampanchayats = this.lookupData.grampanchayats || [];
    this.villages = this.lookupData.villages || [];
  }
  private assignOtherLookups() {
    this.crops = this.lookupData.crops || [];
    this.productCrops = this.lookupData?.productCrops ?? [];
    this.ifscs = this.lookupData.ifscs || [];
    this.soilTypes = this.lookupData.soil_types || [];
    this.clients = this.lookupData.clients || [];
    this.seasons = this.lookupData.season || [];
    this.years = this.lookupData.year || [];
    this.notifiedUnits = this.lookupData.notified_unit || [];
    this.agencies = this.lookupData.agencies || [];
    this.users = this.lookupData.users || [];
  }
  private finalizeDataFetch() {
    this.grampanchayats = [];
    this.villages = [];
    this.fetchedLookupData.next();
    this.isDataFetched = true;
    this.fetchedDistrictData.next();
    this.isDistrictFetched = true;
    this.fetchedLocationData.next();
    this.isLoactionFetched = true;
    this.getGrampanchayatVillages();
    this.userService.setLocation(this.states, this.districts);
  }
  async getDistrictData(values: any[]) {
    const promises = values.map((d) => {
      const request = {purpose: "get_locations", location_type: "lkp_district", location_id: d};
      return this.core.postWithError(request);
    });
    await Promise.all(promises).then((res) => {
      res.forEach((d: any) => {
        if (d.status == 1) {
          this.districts.push(...d.lkp_district);
        }
      });
    });
  }
  async getTehsilData(values: any[]) {
    const promises = values.map((d) => {
      const request = {purpose: "get_locations", location_type: "lkp_tehsil", location_id: d};
      return this.core.postWithError(request);
    });
    await Promise.all(promises).then((res) => {
      res.forEach((d: any) => {
        if (d.status == 1) {
          this.tehsils.push(...d.lkp_tehsil);
        }
      });
    });
  }
  async getBlockData(values: any[]) {
    const promises = values.map((d) => {
      const request = {purpose: "get_locations", location_type: "lkp_block", location_id: d};
      return this.core.postWithError(request);
    });
    await Promise.all(promises).then((res) => {
      res.forEach((d: any) => {
        if (d.status == 1) {
          this.blocks.push(...d.lkp_block);
        }
      });
    });
  }
  async getGrampanchayatData(values: any[]) {
    const promises = values.map((d) => {
      const request = {purpose: "get_locations", location_type: "lkp_grampanchayat", location_id: d};
      return this.core.postWithError(request);
    });
    await Promise.all(promises).then((res) => {
      res.forEach((d: any) => {
        if (d.status == 1) {
          this.grampanchayats.push(...d.lkp_grampanchayat);
        }
      });
    });
  }
  async getVillageData(values: any[]) {
    const promises = values.map((d) => {
      const request = {purpose: "get_locations", location_type: "lkp_village", location_id: d};
      return this.core.postWithError(request);
    });
    await Promise.all(promises).then((res) => {
      res.forEach((d: any) => {
        if (d.status == 1) {
          this.villages.push(...d.lkp_village);
        }
      });
    });
  }
  async getDistrictByState(stateIds: any) {
    const avaliableDistrictsStates = [
      ...new Set(this.districts.map((d) => d.state_id)),
    ];
    const mixingStateIds = stateIds.filter(
      (data: any) => !avaliableDistrictsStates.includes(data)
    );
    if (mixingStateIds.length) {
      await this.getDistrictData(mixingStateIds);
    }
    return this.core.clone(
      this.districts.filter((data) => stateIds.includes(data.state_id))
    );
  }
  async getClientWiseLocation(event: any) {
    let [selectedState, selectedDistrict]: any = [[], []];
    if (event?.length) {
      const clients: any[] = event.map((item: any) => item.UNIT_ID);
      await this.core
        .dashboard_post("result/get_all_client_district", {
          client_id: clients,
        })
        .then((response: any) => {
          selectedState = response.states;
          selectedDistrict = response.districts;
        })
        .catch((err) => {
          console.error(err);
        });
    }
    return [selectedState, selectedDistrict];
  }
  async getAgencyWiseLocation(event: any, user: any) {
    let request: any = {purpose: "get_agency_locations", client: event.client, agency: event.agency, year: event.year, season: event.season};
    const mapData = this.agencyWiseLocationMap.get(JSON.stringify(request));
    const states: any[] = [],
      districts: any[] = [],
      tehsils: any[] = [];
    return await new Promise((res) => {
      if (mapData) {
        res(mapData);
      } else {
        if (user?.user_role == 7) {
          request = {purpose: "get_user_locations", user_id: user.user_id, client: event.client, agency: event.agency?.length ? event.agency[0] : 0,
            season: event.season, year: event.year, states: [], districts: [], tehsils: [], blocks: []};
          this.core.dashboard_post("users", request).then((response: any) => {
              if (response?.status == 1) {
                if (response?.selectedLoc) {
                  const location = JSON.parse(response.selectedLoc);
                  if (location.states) {
                    for (let i = 0; i < this.states.length; i++) {
                      const state = this.states[i];
                      if (location.states.includes(state.state_id)) {
                        states.push(state);
                      }
                    }
                  }
                  if (location.districts) {
                    for (let i = 0; i < this.districts.length; i++) {
                      const district = this.districts[i];
                      if (location.districts.includes(district.district_id)) {
                        districts.push(district);
                      }
                    }
                  }
                  if (location.tehsils) {
                    for (let i = 0; i < this.tehsils.length; i++) {
                      const tehsil = this.tehsils[i];
                      if (location.tehsils.includes(tehsil.tehsil_id)) {
                        tehsils.push(tehsil);
                      }
                    }
                  }
                  const result = { states, districts, tehsils };
                  this.agencyWiseLocationMap.set(
                    JSON.stringify(request),
                    result
                  );
                  res(result);
                }
              } else {
                res({ states, districts, tehsils });
              }
            })
            .catch((err) => {
              res({ states, districts, tehsils });
            })
            .finally();
        } else if (event.agency == 0 || (event.agency?.length && event.agency.find((d: any) => d == 0))) {
          request = {purpose: "location", client_id: event.client, year: event.year, season: event.season};
          this.core.dashboard_post("client", request).then((response: any) => {
              if (response?.status == 1) {
                if (response?.selected) {
                  const location = response.selected;
                  const dist_ids = [];
                  if (location.states) {
                    for (let i = 0; i < this.states.length; i++) {
                      const state = this.states[i];
                      if (location.states.includes(state.state_id)) {
                        states.push(state);
                      }
                    }
                  }
                  if (location.districts) {
                    for (let i = 0; i < this.districts.length; i++) {
                      const district = this.districts[i];
                      dist_ids.push(district.district_id);
                      if (location.districts.includes(district.district_id)) {
                        districts.push(district);
                      }
                    }
                  }
                  for (let i = 0; i < this.tehsils.length; i++) {
                    const tehsil = this.tehsils[i];
                    if (dist_ids.includes(tehsil.district_id)) {
                      tehsils.push(tehsil);
                    }
                  }
                  const result = { states, districts, tehsils };
                  this.agencyWiseLocationMap.set(
                    JSON.stringify(request),
                    result
                  );
                  res(result);
                }
              } else {
                res({ states, districts, tehsils });
              }
            })
            .catch((err) => {
              res({ states, districts, tehsils });
            })
            .finally();
        } else {
          this.core
            .dashboard_post("agency", request)
            .then((response: any) => {
              if (response?.status == 1) {
                if (response?.selectedLoc) {
                  const location = JSON.parse(response.selectedLoc);
                  if (location.states) {
                    for (let i = 0; i < this.states.length; i++) {
                      const state = this.states[i];
                      if (location.states.includes(state.state_id)) {
                        states.push(state);
                      }
                    }
                  }
                  if (location.districts) {
                    for (let i = 0; i < this.districts.length; i++) {
                      const district = this.districts[i];
                      if (location.districts.includes(district.district_id)) {
                        districts.push(district);
                      }
                    }
                  }
                  if (location.tehsils) {
                    for (let i = 0; i < this.tehsils.length; i++) {
                      const tehsil = this.tehsils[i];
                      if (location.tehsils.includes(tehsil.tehsil_id)) {
                        tehsils.push(tehsil);
                      }
                    }
                  }
                  const result = { states, districts, tehsils };
                  this.agencyWiseLocationMap.set(
                    JSON.stringify(request),
                    result
                  );
                  res(result);
                }
              } else {
                res({ states, districts, tehsils });
              }
            })
            .catch((err) => {
              res({ states, districts, tehsils });
            })
            .finally();
        }
      }
    });
  }
  getGrampanchayatVillages() {
    const role = +this.userService.getUserDetail()?.user_role;
    const district_id = [3,4].includes(role) ? this.districts.map(d => d.district_id) : [];
    const gRequest: any = {purpose: 'get_grampanchayats', district_id};
    const vRequest: any = {purpose: 'get_villages', district_id}
    Promise.all([this.core.post(gRequest), this.core.post(vRequest)]).then((responses: any[]) => {
        if (responses[0]?.grampanchayats) {
          this.grampanchayats = responses[0]?.grampanchayats;
        }
        if (responses[1]?.villages) {
          this.villages = responses[1]?.villages;
        }
        this.fetchedVillageData.next();
        this.isvillageFetched = true;
    }).catch(e => {
      console.error(e);
    })
  }
}