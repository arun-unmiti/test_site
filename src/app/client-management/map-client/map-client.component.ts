import { Component, OnInit } from '@angular/core';
import { CoreService } from '../../utilities/core.service';
import { FilterService } from '../../utilities/filter.service';
import { FeatureToggleService } from "../../shared/services/feature-toggle.service";
import { environment, ProjectContext } from "../../../environments/environment";
import { InsightsService } from '../../utilities/insights.service';

@Component({
  selector: 'app-map-client',
  templateUrl: './map-client.component.html',
  styleUrls: ['./map-client.component.css']
})
export class MapClientComponent implements OnInit {

  public isCollapsed = true;
  public isCollapsed1 = false;
  public isCollapsed2 = false;

  selectedClient = '';
  clients: any[] = [];
  selectedstate: any[] = [];
  unselectedstate: any[] = [];
  allStates: any[] = [];
  allLocation: any[] = [];
  selectedDistrict: any[] = [];

  seasons: any[] = [];
  years: any[] = [];

  selectedSeason: any = "";
  selectedYear: any = "";

  loader: any = 0;


  mapUsers: any[] = [];

  selectedUsers: any;
  locationLoading: any = 0;
  submiting: any = 0;
  projectContext: ProjectContext;
  assetsFolder: string;

  constructor(private core: CoreService, private filter: FilterService, private featureToggle: FeatureToggleService, private insightsService: InsightsService) {
    this.projectContext = this.featureToggle.getContext() as ProjectContext;
    this.assetsFolder = environment.projectConfigs[this.projectContext].assetsFolder;
    if (this.projectContext === 'saksham') {
      this.selectedClient = '2000'
    }
  }

  ngOnInit(): void {
    this.getFilterData();
    this.getAllClient()
  }

  /**
   * Method to fetch all Clients
   */
  getAllClient () {
    const request = {"purpose":"get_all_created"}
    this.core.post('client',request).then((response: any) => {
      if (response?.status == 1) {
        this.clients = response.all_clients?.filter((d:any)=> d.UNIT_STATUS == 1);
      }
    }).catch(err => {
      this.insightsService.logException(err);
    });
  }

  /**
   * Method to get data from Lookup
   */
  getFilterData() {
    this.loader++;
    if (this.filter.isLoactionFetched) {
      this.setSeasonYear();
    } else {
      this.filter.fetchedLocationData.subscribe(() => {
        this.setSeasonYear();
      });
    }
  }

  /**
   * Method to bind lookup values to Season and Years
   */
  setSeasonYear() {
    this.loader--;
    this.seasons = this.filter.seasons;
    // const excludes = ['2','3']
    this.years = this.filter.years
    // .filter(d => !excludes.includes(d.id));
  }

  /**
   * Method to fetch client allocated location
   * @returns false
   */
  getClientLocation() {
    if (!this.selectedClient) {
          this.core.toast('warn', 'Client is required');
      return;
    }
    if (!this.selectedSeason) {
          this.core.toast('warn', 'Season is required');
      return;
    }
    if (!this.selectedYear) {
          this.core.toast('warn', 'Year is required');
      return;
    }
    this.locationLoading++;
    const request = {"purpose":"location", client_id: this.selectedClient, season: this.selectedSeason, year: this.selectedYear};
    this.core.post('client',request).then((response: any) => {
      if (response?.status == 1) {
        this.allStates = response?.all_state || []

        this.selectedstate = response?.selected?.states || [];
        this.selectedDistrict = response?.selected?.districts || [];
      const allLocation = this.core.clone(this.allStates);
      allLocation.forEach((state: any) => {
        state.checked = this.selectedstate.includes(state.state_id);
        state.collapse = true;
        if (state?.districts?.length) {
          state.districts.forEach((district: any) => {
            district.checked = this.selectedDistrict.includes(district.district_id);
          })
        }
      })
      this.allLocation = allLocation;

      this.allLocation.forEach((location: any) => this.onDistrictChange(location));
      }
    }).catch(err => {
      this.insightsService.logException(err);
    }).finally(() => {
      this.locationLoading--;
    });
  }

  /**
   * Method triggers on Client change and clear location data
   * @param env 
   */
  onClientChange(env: any) {
    this.allLocation = []
  }

  /**
   * Method triggers on Season change and clear location data
   * @param env 
   */
  onSeasonChange(env: any) {
    this.allLocation = []
  }

   /**
   * Method triggers on Season change and clear location data
   * @param env 
   */
  onYearChange(env: any) {
    this.allLocation = []
  }

   /**
   * Method triggers on Search button click
   * @param env 
   */
  onSearchClick() {
    this.getClientLocation()
  }

  /**
   * Method triggers on "Assign All" click and set all location checked
   */
  assignAllLocation() {
    this.allLocation.forEach(d => {
      d.checked = true
      d.intermediate = false;
      if (d?.districts.length) {
        d.districts.forEach((e: any) => {
          e.checked = true;
          e.intermediate = false;
        })
      }
    });
  }

  /**
   * Metho triggers on state check/uncheck and update its value to district
   * @param stateData 
   */
  onStateChange(stateData: any) {

    if (stateData?.districts?.length) {
      stateData.districts.forEach((dist: any) => {
        dist.intermediate = false;
        dist.checked = stateData.checked;
      })
    }

  }

  /**
   * Method triggers on district check/uncheck and update state check value as per condition
   * @param stateData 
   */
  onDistrictChange(stateData: any) {
    if (stateData?.districts?.length) {
        stateData.intermediate = false;
        stateData.checked = stateData.districts.every((dist: any) => dist.checked)
        if (!stateData.checked) {
          setTimeout(() => {
            stateData.checked = false;
            stateData.intermediate = stateData.districts.some((dist: any) => dist.checked)
          }, 100)
        } else {
          stateData.intermediate = false;
        }
    }
  }

  /**
   * Method triggers on submit button click and update map location
   */
  submit() {
    const request: any = {purpose: 'map_client_location', client_id: this.selectedClient, season: this.selectedSeason, year: this.selectedYear, states: []};
    this.allLocation.forEach((state: any) => {
      if (state?.districts?.length) {
        state?.districts.filter((dist: any) => dist.checked).forEach((dist: any) => request.states.push({state_id: state.state_id, district_id: dist.district_id}))
      }
    });
    this.submiting++;
    this.core.post('client',request).then((response: any) => {
      if (response?.status == 1) {
        this.core.toast('success', response.msg);
        this.getClientLocation();
      } else {
        this.core.toast('error', response.msg);
      }
    }).catch(err => {
      this.core.toast('error', 'Unable to map location');
      this.insightsService.logException(err);
    }).finally(() => this.submiting--);
  }


}
