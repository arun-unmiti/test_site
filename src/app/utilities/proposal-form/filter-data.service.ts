import { Injectable } from '@angular/core';
import { FilterService } from '../filter.service';
import { CoreService } from '../core.service';

@Injectable({
  providedIn: 'root',
})
export class FilterDataService {
  constructor(private filterService: FilterService, private coreService: CoreService) {}

  async getFilterData(component: any) {
    if (this.filterService.isDistrictFetched) {
      component.lookupLoader++; // Increment counter
      component.districts = this.filterService.districts;
      component.tehsils = this.filterService.tehsils;
      this.setInputData(component);
      component.lookupLoader--; // Decrement counter
    } else {
      component.lookupLoader++; // Increment again
      this.filterService.fetchedDistrictData.subscribe(() => {
        component.districts = this.filterService.districts;
        component.tehsils = this.filterService.tehsils;
        this.setInputData(component);
        component.lookupLoader--; // Decrement when districts/tehsils arrive
      });
    }
    if (this.filterService.isvillageFetched) {
      component.lookupLoader++; // Increment counter
      this.getLookupData(component);
      component.lookupLoader--; // Decrement counter
    } else {
      component.lookupLoader++; // Increment again
      this.filterService.fetchedVillageData.subscribe(() => {
        this.getLookupData(component);
        component.lookupLoader--; // Decrement when villages arrive
      });
    }
  }

  getLookupData(component: any) {
    component.statesData = this.filterService.states;
    component.stateMapping = {};
    component.pairedStateMapping = {};
    component.stateCodeMapping = {};
    component.statesData.forEach((state: any) => {
      component.stateMapping[state.state_name.toLowerCase().trim()] = state.state_id;
      component.stateMapping[state.state_id] = state.state_name;
      component.stateCodeMapping[state.code] = state.state_id;
      component.pairedStateMapping[state.state_name.toLowerCase().trim()] = state.state_id;
    });
    component.cropData = this.filterService.productCrops;
    component.cropMapping = {};
    component.pairedCropMapping = {};
    component.cropData.forEach((crop: any) => {
      component.cropMapping[crop.crop_name.toLowerCase().trim()] = crop.crop_name;
      component.pairedCropMapping[crop.crop_name.toLowerCase().trim()] = crop.crop_code;
      component.cropMapping[crop.crop_code] = crop.crop_name;
    });
    component.yearData = this.filterService.years;
    component.yearMapping = {};
    component.pairedYearMapping = {};
    component.yearCodeMapping = {};
    component.yearData.forEach((year: any) => {
      component.yearMapping[year.year_code] = year.year;
      component.yearCodeMapping[year.year_code] = year.id;
      component.pairedYearMapping[year.year_code] = year.id;
      component.yearMapping[year.id] = year.year;
    });
    component.seasonData = this.filterService.seasons;
    component.seasonMapping = {};
    component.seasonCodeMapping = {};
    component.pairedSeasonMapping = {};
    component.seasonData.forEach((season: any) => {
      component.seasonMapping[season.season_name.toLowerCase().trim()] = season.season_name;
      component.seasonCodeMapping[season.season_code] = season.id;
      component.pairedSeasonMapping[season.season_name.toLowerCase().trim()] = season.id;
      component.seasonMapping[season.id] = season.season_name;
    });
  }

  setInputData(component: any) {
    component.clientData = this.filterService.lookupData?.clients;
    component.usersData = this.filterService.lookupData?.users;
    if (Array.isArray(component.usersData)) {
      component.usersData.forEach((d: any) => {
        d.username = d.first_name + ' ' + d.last_name;
      });
    }
    component.filterService.productCrops.forEach((item: any) => {
      component.cropMap.set(item.crop_code, item.crop_name);
    });
    component.filterService.seasons.forEach((item: any) => {
      component.seasonMap.set(item.id, item.season_name);
    });
    component.filterService.years.forEach((item: any) => {
      component.yearMap.set(item.id, item.year);
    });
    component.userPhoneMap = {};
    component.usersData?.forEach((user: any) => {
      component.userPhoneMap[user.user_id] = user.phone;
    });
  }
}