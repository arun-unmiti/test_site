import { Component, OnInit } from "@angular/core";
import { UserDetailService } from "src/app/auth/user-detail.service";
import { CoreService } from "src/app/utilities/core.service";
import { FilterService } from "src/app/utilities/filter.service";
import { FeatureToggleService } from "../../shared/services/feature-toggle.service";
import { environment, ProjectContext } from "../../../environments/environment";
import { InsightsService } from 'src/app/utilities/insights.service';

@Component({
  selector: "app-map-agency",
  templateUrl: "./map-agency.component.html",
  styleUrls: ["./map-agency.component.css"],
})
export class MapAgencyComponent implements OnInit {
  loader = 0;
  loading: any = 0;
  agencyLoader = 0;
  states: any[] = [];

  screens: any[] = [
    {
      group_name: 'Dashboard', screens: [
        {screen_name: 'Crop Health Monitoring', screen_id: 'chmdashboard', isActive: true},
        {screen_name: 'Crop Loss Survey', screen_id: 'clsdashboard', isActive: true},
        {screen_name: 'Crop Cutting Survey', screen_id: 'ccedashboard', isActive: true},

    ]},
    {
      group_name: 'Data', screens: [
        {screen_name: 'CHM', screen_id: 'chm', isActive: true},
        {screen_name: 'Revisit CHM', screen_id: 'revisit_chm', isActive: true},
        {screen_name: 'CLS', screen_id: 'cls', isActive: true},
        {screen_name: 'CCE', screen_id: 'cce', isActive: true},
        {screen_name: 'Two Step / Multipicking', screen_id: 'multipicking', isActive: true},
        {screen_name: 'Other Activity', screen_id: 'other_activity', isActive: true},
      ]
    },
    {screen_name: 'User Management', screen_id: 'user_management', isActive: true},
    {screen_name: 'KML View', screen_id: 'kml_view', isActive: true},
  ];
  selectedClient: any = "";
  selectedAgency: any = "";
  selectedSeason: any = "";
  selectedYear: any = "";

  clients: any[] = [];
  agencies: any[] = [];
  allAgencies: Map<string, any> = new Map();
  seasons: any[] = [];
  years: any[] = [];

  loggedUser: any;
  projectContext: ProjectContext;
  assetsFolder: string;
  constructor(private core: CoreService, private filter: FilterService, private userDetails: UserDetailService, private featureToggle: FeatureToggleService, private insightsService: InsightsService) {
    this.projectContext = this.featureToggle.getContext() as ProjectContext;
    this.assetsFolder = environment.projectConfigs[this.projectContext].assetsFolder;
    if (this.projectContext === 'saksham') {
      this.selectedClient = "2000"
    }
  }

  ngOnInit(): void {
    this.loggedUser = this.userDetails.getUserDetail();
    if (this.projectContext === 'saksham') {
      const externalDataGroup = {
        group_name: 'External Data',
        screens: [
          { screen_name: 'CHM - View CHM Field', screen_id: 'external_chm_view', isActive: true },
          { screen_name: 'CLS - View CLS Field', screen_id: 'external_cls_view', isActive: true },
          { screen_name: 'CCE - View CCE Field', screen_id: 'external_cce_view', isActive: true },
        ],
      };
      this.screens.splice(2, 0, externalDataGroup);
    }
    this.getFilterData();
    if (this.loggedUser?.unit_id) {
      this.selectedClient = this.loggedUser.unit_id;
      this.onClientSelect(this.loggedUser.unit_id);
    } else {
      this.fetchClients();
    }
  }

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

  setSeasonYear() {
    this.loader--;
    this.seasons = this.filter.seasons;
    this.years = this.filter.years;
  }

  /**
   * triggers on client changes
   * @param clientId
   */
  onClientSelect(clientId: string) {
    this.states = [];
    this.fetchAgencies(clientId);

  }

  /**
   * Method to clear location data
   */
  clearLocationData() {
    this.states = [];
  }


  //In this fetchClients am making request to url and include body parameters
  //when the response is recieved client array updated with data from response
  fetchClients() {
    this.loader++;
    const request = { purpose: "get_mapping_details", type: "client" };
    this.core
      .post("users", request)
      .then((response: any) => {
        if (response.status == 1) {
          this.clients = response.all_units || [];
          if (this.projectContext === 'saksham' && +this.loggedUser.user_role < 2) {
            this.onClientSelect(this.selectedClient);
          }
        }
      })
      .catch((err) => {
        this.insightsService.logException(err);
      })
      .finally(() => {
        this.loader--;
      });
  }

  /**
   * Method to fetch agencies based upon client id and it is triggers upon client change
   * @param clientId
   * @returns
   */
  fetchAgencies(clientId: string) {
    this.selectedAgency = "";
    this.agencies = [];
    if (clientId) {
      const agencyData = this.allAgencies.get(clientId);
      if (agencyData?.length) {
        this.agencies = agencyData;
        return;
      }
      this.loader++;
      this.agencyLoader++;
      const request = {
        purpose: "get_mapping_details",
        type: "agency",
        client_id: clientId,
      };
      this.core
        .post("users", request)
        .then((response: any) => {
          if (response.status == 1) {
            this.agencies = response.all_agencies || [];
            this.allAgencies.set(clientId, this.core.clone(this.agencies));
          }
        })
        .catch((err) => {
          this.insightsService.logException(err);
        })
        .finally(() => {
          this.loader--;
          this.agencyLoader--;
        });
    }
  }

  /**
   * Method to Toggle state
   * @param state
   */
  onStateToggle(state: any) {
    state.collapsed = !state.collapsed;
  }

  /**
   * onSearchClick method to fetch agency data
   */
  onSearchClick() {
    this.states = [];
    for (let i = 0; i < this.screens.length; i++) {
      const group = this.screens[i];
      if (group?.screens) {
        for (let j = 0; j < group.screens.length; j++) {
          const screen = group.screens[j];
          screen.isActive = true;
        }
      }
    }
    const request = {
      purpose: "get_agency_locations",
      client: this.selectedClient,
      agency: this.selectedAgency,
      season: this.selectedSeason,
      year: this.selectedYear,
    };
    this.loader++;
    this.core
      .post("agency", request)
      .then((response: any) => {
        if (response?.status == 1) {
          const selectedLoc = response.selectedLoc
            ? JSON.parse(response.selectedLoc)
            : {};
          this.states = response.states;
          this.states.forEach((s: any) => {
            s.collapse = true;
            if (s?.districts?.length) {
              s.districts.forEach((d: any) => {
                d.collapse = true;
                if (d?.tehsils?.length) {
                  d.tehsils.forEach((t: any) => {
                    t.collapse = true;
                    t.checked = selectedLoc?.tehsils?.includes(t.tehsil_id);
                  });
                  d.checked = d.tehsils.every((b: any) => b.checked);
                  if (!d.checked) {
                    d.indeterminate = d.tehsils.some(
                      (b: any) => b.checked || b.indeterminate
                    );
                  }
                }
              });
              s.checked = s.districts.every((b: any) => b.checked);
              if (!s.checked) {
                s.indeterminate = s.districts.some(
                  (b: any) => b.checked || b.indeterminate
                );
              }
            }
          });
          if (response?.assignedScreens) {
            for (let i = 0; i < this.screens.length; i++) {
              const group = this.screens[i];
              if (group?.screen_id) {
                group.isActive = response.assignedScreens[group.screen_id] == 1 ? true : false;
              }
              if (group?.screens) {
                for (let j = 0; j < group.screens.length; j++) {
                  const screen = group.screens[j];
                  screen.isActive = response.assignedScreens[screen.screen_id] == 1 ? true : false;
                }
              }
            }
          }
        }
      })
      .catch((err) => {
        this.insightsService.logException(err);
      })
      .finally(() => {
        this.loader--;
      });
  }

  assignAllLocation() {
    this.states.forEach((s: any) => {
      s.checked = true;
      if (s?.districts?.length) {
        s.districts.forEach((d: any) => {
          d.checked = true;
          if (d?.tehsils?.length) {
            d.tehsils.forEach((t: any) => {
              t.checked = true;
              if (t?.blocks?.length) {
                t.blocks.forEach((b: any) => {
                  b.checked = true;
                });
              }
            });
          }
        });
      }
    });
  }

  refreshCheckbox() {
    this.states.forEach((s) => {
      if (s?.districts?.length) {
        s.districts.forEach((d: any) => {
          if (d?.tehsils?.length) {
            d.tehsils.forEach((t: any) => {
              if (d?.blocks?.length) {
                d.checked = d.blocks.every((b: any) => b.checked);
                d.indeterminate = false;
                if (!d.checked) {
                  setTimeout(
                    () =>
                      (d.indeterminate = d.blocks.some((b: any) => b.checked))
                  );
                }
              }
            });
            d.checked = d.tehsils.every((t: any) => t.checked);
            d.indeterminate = false;
            if (!d.checked) {
              setTimeout(
                () =>
                  (d.indeterminate = d.tehsils.some(
                    (b: any) => b.checked || b.indeterminate
                  ))
              );
            }
          }
        });
        s.checked = s.districts.every((d: any) => d.checked);
        s.indeterminate = false;
        if (!s.checked) {
          setTimeout(
            () =>
              (s.indeterminate = s.districts.some(
                (b: any) => b.checked || b.indeterminate
              ))
          );
        }
      }
    });
  }
  onStateChanged(env: any, data: any, noRefresh?: any) {
    data.indeterminate = false;
    if (data?.districts?.length) {
      data.districts.forEach((d: any) => this.onDistrictChange(env, d, true));
    }
    if (!noRefresh) {
      this.refreshCheckbox();
    }
  }
  onDistrictChange(env: any, data: any, noRefresh?: any) {
    data.checked = env;
    data.indeterminate = false;
    if (data?.tehsils?.length) {
      data.tehsils.forEach((t: any) => this.onTehsilChange(env, t, true));
    }
    if (!noRefresh) {
      this.refreshCheckbox();
    }
  }
  onTehsilChange(env: any, data: any, noRefresh?: any) {
    data.checked = env;
    data.indeterminate = false;
    if (!noRefresh) {
      this.refreshCheckbox();
    }
  }
  onSubmit() {
    const tehsils: any = [];
    const selectedScreens: any[] = []
    for (let sid = 0; sid < this.states.length; sid++) {
      const state = this.states[sid];
      if ((state?.indeterminate || state?.checked) && state?.districts?.length) {
        for (let did = 0; did < state.districts.length; did++) {
          const district = state.districts[did];
          if ((district?.indeterminate || district?.checked) && district?.tehsils?.length) {
            for (let tid = 0; tid < district.tehsils.length; tid++) {
              const data = district.tehsils[tid];
              if (data.checked) {
                tehsils.push({state_id: state.state_id, district_id: district.district_id, tehsil_id: data.tehsil_id });
              }
            }
          }
        }
      }
    }
    for (let i = 0; i < this.screens.length; i++) {
      const group = this.screens[i];
      if (group?.screen_id) {
        selectedScreens.push({name: group.screen_id, value: group?.isActive ? 1 : 0});
      }
      if (group?.screens?.length) {
        for (let j = 0; j < group.screens.length; j++) {
          const screen = group.screens[j];
          selectedScreens.push({name: screen.screen_id, value: screen?.isActive ? 1 : 0});
        }
      }
    }
    const request = { purpose: "update_agency_mapping", tehsils, client: this.selectedClient, agency: this.selectedAgency, season: this.selectedSeason, year: this.selectedYear, screens: selectedScreens };
    this.core.post('agency', request).then((response: any) => {
      this.loader++;
      if (+response?.status === 1) {
        this.core.toast('success', response.msg);
        this.onSearchClick();
      } else {
        this.core.toast('error', response.msg);
      }
    }).catch((err:any) => {
      this.insightsService.logException(err);
      this.core.toast('error', 'Unable to update agency mapping')
    }).finally(() => this.loader--)
  }
}
