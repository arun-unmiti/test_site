import { Component, OnInit } from "@angular/core";
import { isObject } from "highcharts";
import { UserDetailService } from "src/app/auth/user-detail.service";
import { CoreService } from "src/app/utilities/core.service";
import { FilterService } from "src/app/utilities/filter.service";
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FeatureToggleService } from "../../shared/services/feature-toggle.service";
import { environment, ProjectContext } from "../../../environments/environment";

@Component({
  selector: "app-user-map",
  templateUrl: "./user-map.component.html",
  styleUrls: ["./user-map.component.css"],
})
export class UserMapComponent implements OnInit {
  states: any[] = [];
  users: any[] = [];
  agencies: any[] = [];

  user = "";
  agency = "";

  userId = "";
  unitId = "";
  agencyId: any = "";
  loading = 0;
  resetting = 0;
  userLoading = 0;

  selectedUser: any;
  selectedAgency: any;
  selectedClients: any = "";
  clientsDrop: any;

  client: any;
  allClients: any[] = [];
  clientSuggestions: any[] = [];
  agenciesSuggestion: any[] = [];
  userSuggestion: any[] = [];
  loggedUser: any;
  selectedClient: any;
  filterStates: any[] = [];
  filterDistricts: any[] = [];
  filterBlocks: any[] = [];
  filterTehsils: any[] = [];
  noUser: boolean = false;

  selectedSeason: any = "";
  selectedYear: any = "";

  seasons: any[] = [];
  years: any[] = [];
  projectContext: ProjectContext;
  assetsFolder: string;

  constructor(
    private filter: FilterService,
    private core: CoreService,
    private userDetails: UserDetailService,
    private modalService: NgbModal,
    private featureToggle: FeatureToggleService
  ) {
      this.projectContext = this.featureToggle.getContext() as ProjectContext;
      this.assetsFolder = environment.projectConfigs[this.projectContext].assetsFolder;
  }

  searched: any;

  ngOnInit(): void {
    this.loggedUser = this.userDetails.getUserDetail();
    this.loading++;
    if (this.filter.isLoactionFetched) {
      this.init();
    } else {
      this.filter.fetchedLocationData.subscribe(() => {
        this.init();
      });
    }
  }

  init() {
    this.filterStates = this.core.clone(this.filter.states);
    this.filterDistricts = this.core.clone(this.filter.districts);
    this.filterBlocks = this.core.clone(this.filter.blocks);
    this.filterTehsils = this.core.clone(this.filter.tehsils);
    this.seasons = this.filter.seasons;
    this.years = this.filter.years;
    if (this.projectContext === 'saksham') {
      this.selectedClients = '2000'
    }
    if (this.loggedUser.unit_id || this.selectedClients) {
      this.getMappingDetails({
        type: "agency",
        client_id: this.loggedUser.unit_id || this.selectedClients,
      });
      this.onClientSelect(this.loggedUser?.unit_id);
      this.selectedClients = this.loggedUser.unit_id || '2000';
    } else {
      this.getMappingDetails({ type: "client" });
    }
    this.loading--;
  }

  getMappingDetails(env: any) {
    this.userId = this.unitId = "";
    this.searched = null;
    this.userLoading++;
    if (+this.loggedUser.user_role > 2) {
      env.states = env?.states?.length ? env.states : this.filterStates.map((d: any) => d.state_id);
      env.districts = env?.districts?.length ? env.districts : this.filterDistricts.map((d: any) => d.district_id);
      env.tehsils = env?.tehsils?.length ? env.tehsils : this.filterTehsils.map((d: any) => d.tehsil_id);
      env.blocks = env?.blocks?.length ? env.blocks : this.filterBlocks.map((d: any) => d.block_id);
    }
    const request = { purpose: "get_mapping_details", ...env };
    this.core.post("users", request).then((response: any) => {
      if (response?.status !== 1) {
        return;
      }
      if (request?.type === "client") {
        this.allClients = response?.all_units || [];
        this.clientSuggestions = this.core.clone(this.allClients);
        this.selectedUser = this.selectedAgency = {};
        this.agencyId = "";
        this.agencies = this.agenciesSuggestion = this.users = this.userSuggestion = [];
      } else if (request?.type === "agency") {
        this.agencies = response?.all_agencies || [];
        this.agencies.unshift({ agency_name: "Self", agency_id: "0" });
        this.agenciesSuggestion = this.core.clone(this.agencies);
        this.users = this.userSuggestion = [];
        if (this.loggedUser.user_role === '7' && this.loggedUser.agency_id) {
          this.agencyId = this.loggedUser.agency_id;
        }
      } else if (request?.type === "user") {
        this.selectedUser = {};
        const users = response?.all_users || [];
        this.users = +this.loggedUser.user_role <= 2 ? users : users.filter((d: any) => +d.role_id > +this.loggedUser.user_role);
        this.users.forEach((d: any) => (d.fullName = `${d.first_name} ${d.last_name} (${d.email_id}${d.phone ? " - " + d.phone : ""})`));
        this.userSuggestion = this.core.clone(this.users).filter((ele: any) => ele.user_id !== this.loggedUser.user_id && +ele.role_id > 4);
        this.userSuggestion.forEach((data) => (data.displayName = `${data?.first_name} ${data?.last_name} - (${data?.phone})`));
        this.noUser = !this.userSuggestion?.length;
      }
    })
    .catch((error) => console.error(error)).finally(() => this.userLoading--);
  }

  setUserVal() {
    const userId = this.userId;
    if (this.user?.trim()) {
      const selected = this.users.find((d) =>
        d?.username?.toLowerCase().includes(this.user.toLowerCase().trim())
      );
      this.user = selected?.username;
      this.userId = selected?.user_id;
      if (this.userId != userId) {
        this.getUserLoaction();
      }
    }
  }

  setAgencyVal() {
    const unitId = this.unitId;
    if (this.agency?.trim()) {
      const selected = this.agencies.find((d) =>
        d?.UNIT_NAME?.toLowerCase().includes(this.agency.toLowerCase())
      );
      this.agency = selected?.UNIT_NAME;
      this.unitId = selected?.UNIT_ID;
      if (this.unitId != unitId) {
        this.getUserLoaction();
      }
    }
  }

  onUserChange(env: any) {
    this.getUserLoaction();
  }

  onClientSelect(env: any) {
    this.clearUserLocation();
    this.noUser = false;
    this.selectedAgency = {};
    this.agencyId = "";
    if (env) {
      this.getMappingDetails({ type: "agency", client_id: env });
    }
  }

  onAgencyChange(env: any) {
    this.clearUserLocation();
    this.noUser = false;
    this.userSuggestion = [];
    // if (env) {
    //   const request: any = { type: "user", agency_id: env,client_id: this.selectedClients, states: [], districts: [], tehsils: [], blocks: []  };
    //   this.getMappingDetails(request);
    // }
  }

  onSeasonChange(event: any) {
    this.clearUserLocation();
  }
  onYearChange(event: any) {
    this.clearUserLocation();
  }

  onSearchClick() {
    if (!this.selectedClients) {
      this.core.toast("warn", "Client is required");
      return;
    }
    if (!this.agencyId) {
      this.core.toast("warn", "Agency is required");
      return;
    }
    if (!this.selectedSeason) {
      this.core.toast("warn", "Season is required");
      return;
    }
    if (!this.selectedYear) {
      this.core.toast("warn", "Year is required");
      return;
    }
    const request: any = {
      type: "user",
      agency_id: this.agencyId,
      client_id: this.selectedClients,
      season: this.selectedSeason,
      year: this.selectedYear,
      states: [],
      districts: [],
      tehsils: [],
      blocks: [],
    };
    this.getMappingDetails(request);
  }

  getUserDetails(request: any) {
    this.loading++;

    this.core
      .post(request)
      .then((response: any) => {
        if (response?.status == 1) {
          // if (this.userDetail?.unit_id) {
          //   const  userList= response.users || response.userdata || [];
          //   this.userList = userList.filter((d:any)=> +d.role_id > +this.userDetail.user_role)
          // } else {
          //   this.userList = response.users || response.userdata || [];
          // }

          // this.userList.forEach((d: any, i: any) => { d.sno = i + 1, d.checked = false, d.statusName = this.getStatus(d.status) })

          // this.userList = this.userList.filter(d => this.userDetail.user_role != d.role_id)
          const users = response.users || response.userdata || [];
          if (+this.loggedUser.user_role <= 2) {
            this.users = users;
          } else {
            this.users = users.filter(
              (d: any) => +d.role_id > +this.loggedUser.user_role
            );
          }
          this.users.forEach(
            (d: any) =>
              (d.fullName = `${d.first_name} ${d.last_name} (${d.email_id}  ${
                d.phone ? "- " + d.phone : ""
              })`)
          );
          this.userSuggestion = this.core
            .clone(this.users)
            .filter(
              (ele: any) =>
                ele.user_id != this.loggedUser.user_id && +ele.role_id > 4
            );
          this.userSuggestion.forEach((data) => {
            data.displayName = `${data?.first_name} ${data?.last_name} - (${data?.phone})`;
          });
        }
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        this.loading--;
      });
  }

  getUserLoaction() {
    this.userId = this.selectedUser;
    this.unitId = isObject(this.selectedClients)
      ? this.selectedClients?.UNIT_ID
      : this.selectedClients;

    // this.agencyId = this.selectedAgency?.agency_id;
    if (this.selectedUser?.role_id == 6) return;

    if (this.userId && this.unitId) {
      this.states = [];
      this.loading++;
      const request: any = {
        purpose: "get_user_locations",
        user_id: this.userId,
        client: this.unitId,
        agency: this.agencyId,
        season: this.selectedSeason,
        year: this.selectedYear,
        states: [],
        districts: [],
        tehsils: [],
        blocks: [],
      };

      if (+this.loggedUser.user_role > 2) {
        request.states =
          request?.states?.length == 0
            ? this.filterStates.map((d: any) => d.state_id)
            : request.states;
        request.districts =
          request?.districts?.length == 0
            ? this.filterDistricts.map((d: any) => d.district_id)
            : request.districts;
        request.tehsils =
          request?.tehsils?.length == 0
            ? this.filterTehsils.map((d: any) => d.tehsil_id)
            : request.tehsils;
        request.blocks =
          request?.blocks?.length == 0
            ? this.filterBlocks.map((d: any) => d.block_id)
            : request.blocks;
      }

      this.core
        .post("users", request)
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
                      if (t?.blocks?.length) {
                        t.blocks.forEach((b: any) => {
                          b.checked = selectedLoc?.blocks?.includes(b.block_id);
                          b.collapse = true;
                        });
                        t.checked = t.blocks.every((b: any) => b.checked);
                        if (!t.checked) {
                          t.indeterminate = t.blocks.some(
                            (b: any) => b.checked
                          );
                        }
                      }
                    });
                    // d.checked = selectedLoc?.districts?.includes(d.district_id);
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
                //  selectedLoc?.states?.includes(s.state_id);
              }
              // });
            });
          }
        })
        .catch((error) => console.error(error))
        .finally(() => this.loading--);
    }
  }

  onStateChanged(env: any, data: any, noRefresh?: any) {
    data.indeterminate = false;
    if (data?.districts?.length) {
      data.districts.forEach((d: any) => this.onDistrictChange(env, d, true));
    }
    if (!noRefresh) {
      this.refreshCheckbox(data);
    }
  }

  onDistrictChange(env: any, data: any, noRefresh?: any) {
    data.checked = env;
    data.indeterminate = false;
    if (data?.tehsils?.length) {
      data.tehsils.forEach((t: any) => this.onTehsilChange(env, t, true));
    }
    if (!noRefresh) {
      this.refreshCheckbox(data);
    }
  }

  onTehsilChange(env: any, data: any, noRefresh?: any) {
    data.checked = env;
    data.indeterminate = false;
    if (data.blocks) {
      data.blocks.forEach((b: any) => this.onBlockChange(env, b, true));
    }
    if (!noRefresh) {
      this.refreshCheckbox(data);
    }
  }

  onBlockChange(env: any, data: any, noRefresh?: any) {
    data.checked = env;
    if (!noRefresh) {
      this.refreshCheckbox(data);
    }
  }

  refreshCheckbox(rData: any) {
    this.states.forEach((s) => {
      if (s?.districts?.length && (!rData?.state_id || s.state_id == rData.state_id)) {
        s.districts.forEach((d: any) => {
          if (d?.tehsils?.length && (!rData?.district_id || d.district_id == rData.district_id)) {
            d.tehsils.forEach((t: any) => {
              if (t?.blocks?.length && (!rData?.tehsil_id || t.tehsil_id == rData.tehsil_id)) {
                t.checked = t.blocks.every((b: any) => b.checked);
                t.indeterminate = false;
                if (!t.checked) {
                  // setTimeout(
                  //   () =>
                      (t.indeterminate = t.blocks.some((b: any) => b.checked))
                  // );
                }
              }
            });
            d.checked = d.tehsils.every((t: any) => t.checked);
            d.indeterminate = false;
            if (!d.checked) {
              // setTimeout(
              //   () =>
                  (d.indeterminate = d.tehsils.some(
                    (b: any) => b.checked || b.indeterminate
                  ))
              // );
            }
          }
        });
        s.checked = s.districts.every((d: any) => d.checked);
        s.indeterminate = false;
        if (!s.checked) {
          // setTimeout(
          //   () =>
              (s.indeterminate = s.districts.some(
                (b: any) => b.checked || b.indeterminate
              ))
          // );
        }
      }
    });
  }

  onSubmit() {
    const selectedLoc: any = {
      state: [],
      district: [],
      tehsil: [],
      block: [],
    };

    this.states.forEach((s: any) => {
      if (s.checked) selectedLoc?.state.push(s.state_id);
      if (s?.districts?.length) {
        s.districts.forEach((d: any) => {
          if (d.checked) selectedLoc?.district?.push(d.district_id);
          if (d?.tehsils?.length) {
            d.tehsils.forEach((t: any) => {
              if (t.checked) selectedLoc?.tehsil?.push(t.tehsil_id);
              if (t?.blocks?.length) {
                t.blocks.forEach((b: any) => {
                  if (b.checked) selectedLoc?.block?.push(b.block_id);
                });
              }
            });
          }
        });
      }
    });

    const request = {
      purpose: "update_user_mapping",
      user: this.userId,
      client: this.unitId,
      agency: this.agencyId,
      season: this.selectedSeason,
      year: this.selectedYear,
      ...selectedLoc,
    };
    this.loading++;
    this.core
      .post("users", request)
      .then((response: any) => {
        if (response?.status == 1) {
          this.agency = "";
          this.userId = "";
          this.unitId = "";
          this.user = "";
          this.states = [];
          this.core.toast("success", response.msg);
          this.onAgencyChange(this.agencyId);
        } else {
          this.core.toast("error", response.msg);
        }
      })
      .catch((err) => {
        this.core.toast("error", "Unable to update mapping");
      })
      .finally(() => this.loading--);

    // update_user_mapping
  }

  openResetConfirmation(content: any) {
		this.modalService.open(content, { centered: true, animation: true, keyboard: false, backdrop: 'static',  });
	}

  onReset(modal: any) {
    const request = {
      purpose: "reset_user_mapping",
      user: this.userId,
      client: this.unitId,
      agency: this.agencyId,
      season: this.selectedSeason,
      year: this.selectedYear,
    };
    this.resetting++;
    this.core
      .post("users", request)
      .then((response: any) => {
        if (response?.status == 1) {
          this.agency = "";
          this.userId = "";
          this.unitId = "";
          this.user = "";
          this.states = [];
          this.core.toast("success", response.msg);
          this.onAgencyChange(this.agencyId);
          modal.close('success');
        } else {
          this.core.toast("error", response.msg);
        }
      })
      .catch((err) => {
        this.core.toast("error", "Unable to reset mapping");
      })
      .finally(() => this.resetting--);
  }

  filteredCities: any[] = [];
  filterCountrySingle(event: any) {
    this.filteredCities = this.users;
  }
  handleDropdownClick() {
    this.filteredCities = this.users;
  }

  filterUser(event: any) {
    let query = event.query;
    this.userSuggestion = this.clientSuggestions = this.users.filter(
      (user: any) =>
        user.fullName.toLowerCase().indexOf(query.toLowerCase()) == 0
    );
  }

  filterClient(event: any) {
    let query = event.query;
    this.clientSuggestions = this.allClients.filter(
      (client: any) =>
        client.UNIT_NAME.toLowerCase().indexOf(query.toLowerCase()) == 0
    );
  }

  filterAgency(event: any) {
    let query = event.query;
    this.agenciesSuggestion = this.agencies.filter(
      (agency: any) =>
        agency.agency_name.toLowerCase().indexOf(query.toLowerCase()) == 0
    );
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

  clearUserLocation() {
    this.searched = '';
    this.userSuggestion = [];
    this.states = [];
  }
}
