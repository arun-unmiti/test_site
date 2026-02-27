import { Component, OnInit } from '@angular/core';
import { UserDetailService } from 'src/app/auth/user-detail.service';
import { CoreService } from 'src/app/utilities/core.service';
import { FilterService } from 'src/app/utilities/filter.service';
import { FeatureToggleService } from "../../shared/services/feature-toggle.service";
import { InsightsService } from '../../utilities/insights.service';
import { environment, ProjectContext } from "../../../environments/environment";

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css']
})
export class NotificationsComponent implements OnInit {

  cities: any;

  selectedCities: any;

  user: any;
  loading = 0;
  states: any = [];
  districts: any[] = [];
  tehsils: any[] = [];
  crops: any[] = [];
  clientData: any[] = [];

  selectedClient: any = '';
  comment: any = '';
  selectedState: any[] = [];
  clientStates: any[] = [];
  clientDistricts: any[] = [];
  districtOptions: any[] = [];
  tehsilOptions: any[] = [];
  selectedDistrict: any[] = [];
  selectedTehsil: any[] = [];
  userList: any[] = [];
  selectedUser: any[] = [];
  projectContext: ProjectContext;
  assetsFolder: string; 

  constructor(private filter: FilterService, private core: CoreService, private userService: UserDetailService, private featureToggle: FeatureToggleService, private insightsService: InsightsService) {
      this.projectContext = this.featureToggle.getContext() as ProjectContext;
      this.assetsFolder = environment.projectConfigs[this.projectContext].assetsFolder;
      if (this.projectContext === 'saksham') {
        this.selectedClient = '2000'
      }
        this.cities = [
          {state: 'State 1', client: 'Client 1', block:'Block 1', district:'District 1', users: 'User 1'},
          {state: 'State 2', client: 'Client 2', block:'Block 2', district:'District 2', users: 'User 2'},
          {state: 'State 3', client: 'Client 3', block:'Block 3', district:'District 3', users: 'User 3'},
          {state: 'State 4', client: 'Client 4', block:'Block 4', district:'District 4', users: 'User 4'},
          {state: 'State 5', client: 'Client 5', block:'Block 5', district:'District 5', users: 'User 5'}
      ];
   }

  ngOnInit(): void {
    this.user = this.userService.getUserDetail();
    if (['1','2'].includes(this.user.user_role)) {
      this.getAllUsers()
    } else {
      this.selectedClient = this.user.unit_id
    }
    this.onClientSelect(this.selectedClient);
    this.loading++
    if (this.filter.isLoactionFetched) {
      this.getLocationsData();
    } else {
      this.filter.fetchedLocationData.subscribe(() => {
        this.getLocationsData();
      });
    }
  }

  getLocationsData() {
    this.states = this.core.clone(this.filter.states);
    this.districts = this.core.clone(this.filter.districts);
    this.tehsils = this.core.clone(this.filter.tehsils);
    this.crops = this.core.clone(this.filter.crops);
    this.clientData = this.core.clone(this.filter.clients)
    if(this.user.unit_id) {
      this.selectedClient = this.user.unit_id;
    }

    
    this.loading--;
  }

  async onClientSelect(event: any) {

    this.clientStates = [];
    this.clientDistricts = [];
    
    this.states = [];
    this.selectedState = [];
    this.districtOptions = [];
    this.tehsilOptions = [];
    this.selectedDistrict = [];
    this.selectedTehsil = [];
    if (event) {
      [this.clientStates, this.clientDistricts] =  await this.filter.getClientWiseLocation([{UNIT_ID: event}]);
     }
     this.states = this.core.clone(this.filter.states).filter((item: any) => (!this.clientStates?.length || this.clientStates.includes(item.state_id)))
     this.getAllUsers()
  }

  onStateChange(event: any) {
    this.districtOptions = [];
    this.tehsilOptions = [];
    this.selectedDistrict = [];
    this.selectedTehsil = [];
    if (event?.length) {
      this.districtOptions = event.map((d: any) => {
        d.items = this.districts.filter((e: any) => (!this.clientDistricts?.length || this.clientDistricts.includes(e.district_id)) && e.state_id == d.state_id);
        return d;
      });
    }
    this.getAllUsers()
  }

  onDistrictChange(event: any) {
    this.tehsilOptions = [];
    this.selectedTehsil = [];
    if (event?.length) {
      this.tehsilOptions = event.map((d: any) => {
        d.items = this.tehsils.filter((e) => e.district_id == d.district_id);
        return d;
      });
    }
    this.getAllUsers()
  }

  onTehsilChange() {
    this.getAllUsers()
  }

  submit() {
    if (!this.selectedUser?.length) {
      this.core.toast('warn', 'Plase select User')
      return;
    }
    if (!this.comment?.trim()) {
      this.core.toast('warn', 'Plase add notification text')
      return;
    }
    const request = {
      "purpose":"push_notification",
      "client_id": this.selectedClient,
      "notification": this.comment,
      "users": this.selectedUser.map((d) => ({id: d.user_id})),
    }
 
    this.loading++

    this.core.post(request).then((response: any) => {
      if (response?.status == 1) {
        this.core.toast('success', response.msg)
        this.clear()
      } else {
        this.core.toast('error', response.msg)
      }
    }).catch((err) => {
      this.core.toast('error', 'Unable to push notification');
      this.insightsService.logException(err);
    }).finally(() => this.loading--)
  }

  clear() {
    this.selectedCities = '';
    this.onClientSelect(this.selectedClient);
    this.selectedUser = [];
    this.comment = ''
  }

  getAllUsers() {
    this.userList = [];
    this.selectedUser = [];
    const request = {
      client_id: this.selectedClient,
      states: this.selectedState.map((d: any) => d.state_id),
      districts: this.selectedDistrict.map((d: any) => d.district_id),
      tehsils: this.selectedTehsil.map((d: any) => d.tehsil_id),
      status: '1',
      purpose: 'userslist'
    }

    if (+this.user.user_role > 2) {
      request.states  = request.states?.length == 0 ? this.states.map((d: any) => d.state_id) : request.states;
      request.districts  = request.districts?.length == 0 ?  this.districts.map((d: any) => d.district_id) : request.districts;
      request.tehsils  = request.tehsils?.length == 0 ?  this.tehsils.map((d: any) => d.block_id) : request.tehsils;
    }

    this.loading++
    this.core.post(request).then((response: any) => {
      if (response?.status == 1) {
        const userList = response.userdata.map((d: any) => ({user_id: d.user_id, name: `${d.first_name} ${d.last_name}`}))
        this.userList = this.core.sortList(userList || [], 'name');
      }
    }).catch((err) => {
      this.insightsService.logException(err);
    }).finally(() => this.loading--)
  }

}
