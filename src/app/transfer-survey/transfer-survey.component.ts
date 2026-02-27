import { Component, OnInit, ViewChild } from "@angular/core";
import * as moment from "moment";
import { UserDetailService } from "../auth/user-detail.service";
import { CoreService } from "../utilities/core.service";
import { FilterService } from "../utilities/filter.service";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { FeatureToggleService } from "../shared/services/feature-toggle.service";
import { environment, ProjectContext } from "../../environments/environment";

@Component({
  selector: "app-transfer-survey",
  templateUrl: "./transfer-survey.component.html",
  styleUrls: ["./transfer-survey.component.css"],
})
export class TransferSurveyComponent implements OnInit {
  loading = 0;
  isLoadedData = false;
  lookupLoader: any = 0;
  isStateLoading: any = 0;
  agencyLoading: any = 0;
  userLoading: any = 0;
  dataLoading: any = 0;
  transferring: any = 0;

  userDetails: any;
  isFilterCollapsed = true;
  districtField: any;
  dataCrops: any[] = [];
  cropsData: any[] = [];
  clientStates: any[] = [];
  clientDistricts: any[] = [];
  clientTehsils: any[] = [];
  states: any[] = [];
  allDistricts: any[] = [];
  allTehsils: any[] = [];
  allBlocks: any[] = [];
  selectedForm: any = "";
  selectedYear: any = "";
  selectedSeason: any = "";
  singleClient: any = "";
  selectedClient: any[] = [];
  selectedAgency: any[] = [];
  selectedState: any[] = [];
  selectedDistrict: any[] = [];
  selectedTehsil: any[] = [];
  selectedBlock: any[] = [];
  selectedCrop: any[] = [];
  selectedUser: any[] = [];
  selectedSingleUser: any[] = [];
  selectedFromDate: any = {
    startDate: moment().subtract(7, "days"),
    endDate: moment(),
  };

  yearData: any[] = [];
  seasonData: any[] = [];
  clientData: any[] = [];
  agencyData: any[] = [];
  districts: any[] = [];
  tehsilOptions: any[] = [];
  blocks: any[] = [];
  usersData: any[] = [];

  stateMap: Map<any, any> = new Map();
  districtMap: Map<any, any> = new Map();
  tehsilMap: Map<any, any> = new Map();
  blockMap: Map<any, any> = new Map();
  grampanchayatMap: Map<any, any> = new Map();
  villageMap: Map<any, any> = new Map();
  cropMap: Map<any, any> = new Map();
  seasonMap: Map<any, any> = new Map();
  yearMap: Map<any, any> = new Map();
  notifiedUnitMap: Map<any, any> = new Map();

  localeValue = {
    format: "DD/MM/YYYY",
    displayFormat: "DD-MM-YYYY",
    separator: " - ",
    cancelLabel: "Cancel",
    applyLabel: "Okay",
  };

  ranges = {
    Today: [moment(), moment()],
    Yesterday: [moment().subtract(1, "days"), moment().subtract(1, "days")],
    "Last 7 Days": [moment().subtract(6, "days"), moment()],
    "Last 15 Days": [moment().subtract(14, "days"), moment()],
    "This Month": [moment().startOf("month"), moment().endOf("month")],
    "Last Month": [
      moment().subtract(1, "month").startOf("month"),
      moment().subtract(1, "month").endOf("month"),
    ],
    "Last 3 Month": [
      moment().subtract(3, "month").startOf("month"),
      moment().subtract(1, "month").endOf("month"),
    ],
  };

  maxDate: any = moment();

  columns: any[] = [];
  totalData: any[] = [];
  tableData: any[] = [];
  currentpage = 1;
  recordsPerPage = 10;
  @ViewChild("pagination") pagination: any;
  checkedCount = 0;
  allChecked = false;
  allIndeterminate = false;
  isSearched = false;


  transferUser: any = '';
  @ViewChild("transferContent") transferContent: any;
  @ViewChild("confirmContent") confirmContent: any;
  projectContext: ProjectContext;
  assetsFolder: string;  

  constructor(
    private core: CoreService,
    private filter: FilterService,
    private userService: UserDetailService,
    private modalService: NgbModal,
    private featureToggle: FeatureToggleService
  ) {
    this.projectContext = this.featureToggle.getContext() as ProjectContext;
    this.assetsFolder = environment.projectConfigs[this.projectContext].assetsFolder;
    if (this.projectContext === 'saksham') {
      this.singleClient = '2000'
    }
  }

  ngOnInit(): void {
    this.userDetails = this.userService.getUserDetail();
    this.getFilterData();
    this.getLocationCropData();
  }

  getFilterData() {
    this.lookupLoader++;
    if (this.filter.isLoactionFetched) {
      this.addFilterData();
      // this.getKMLData();
    } else {
      this.filter.fetchedLocationData.subscribe(() => {
        this.addFilterData();
        // this.getKMLData();
      });
    }
  }

  addFilterData() {
    this.states = this.core.clone(this.filter.states);
    this.allDistricts = this.core.clone(this.filter.districts);
    this.allTehsils = this.core.clone(this.filter.tehsils);
    this.allBlocks = this.core.clone(this.filter.blocks);
    this.clientData = this.filter.lookupData?.clients;
    this.yearData = this.filter.years;
    this.seasonData = this.filter.seasons;

    this.lookupLoader--;

    this.setDefaultLocation();

    // lkp_state mapping
    for (let indx = 0; indx < this.filter.states.length; indx++) {
      const item = this.filter.states[indx];
      this.stateMap.set(item.state_id, item.state_name);
    }

    // lkp_district mapping
    for (let indx = 0; indx < this.filter.districts.length; indx++) {
      const item = this.filter.districts[indx];
      this.districtMap.set(item.district_id, item.district_name);
    }

    // lkp_tehsil mapping
    for (let indx = 0; indx < this.filter.tehsils.length; indx++) {
      const item = this.filter.tehsils[indx];
      this.tehsilMap.set(item.tehsil_id, item.tehsil_name);
    }

    // lkp_block mapping
    for (let indx = 0; indx < this.filter.blocks.length; indx++) {
      const item = this.filter.blocks[indx];
      this.blockMap.set(item.block_id, item.block_name);
    }

    // lkp_grampanchayats mapping
    for (let indx = 0; indx < this.filter.grampanchayats.length; indx++) {
      const item = this.filter.grampanchayats[indx];
      this.grampanchayatMap.set(item.grampanchayat_id, item.grampanchayat_name);
    }

    // lkp_village mapping
    for (let indx = 0; indx < this.filter.villages.length; indx++) {
      const item = this.filter.villages[indx];
      this.villageMap.set(item.village_id, item.village_name);
    }

    // lkp_crop mapping
    for (let indx = 0; indx < this.filter.crops.length; indx++) {
      const item = this.filter.crops[indx];
      this.cropMap.set(+item.crop_code, item.crop_name);
    }

    // lkp_season mapping
    for (let indx = 0; indx < this.filter.seasons.length; indx++) {
      const item = this.filter.seasons[indx];
      this.seasonMap.set(item.id, item.season_name);
    }

    // lkp_year mapping
    for (let indx = 0; indx < this.filter.years.length; indx++) {
      const item = this.filter.years[indx];
      this.yearMap.set(item.id, item.year);
    }

    // lkp_notifieldUnit mapping
    for (let indx = 0; indx < this.filter.notifiedUnits.length; indx++) {
      const item = this.filter.notifiedUnits[indx];
      this.notifiedUnitMap.set(item.notified_id, item.notified_unit_name);
    }
  }

  setDefaultLocation() {
    if (this.userDetails?.unit_id) {
      this.singleClient = this.userDetails?.unit_id;
      this.selectedClient = this.clientData.filter(
        (d) => d.UNIT_ID == this.singleClient
      );
    }
    if (["7"].includes(this.userDetails?.user_role)) {
      this.selectedAgency = [this.userDetails.agency_id || "0"];
    }
  }

  getLocationCropData() {
    this.selectedCrop = [];
    const request = {
      purpose: "lkp_chm_crop",
      state: this.selectedState.map((d) => d.state_id),
      district: this.selectedDistrict.map((d) => d.district_id),
      tehsil: [],
      notifiedUnit: [],
    };

    if (this.dataCrops?.length) {
      const cropsData = this.core.clone(
        this.dataCrops.filter((d) => {
          return (
            (!request.state.length || request.state.includes(d.state_id)) &&
            (!request.district.length || request.district.includes(d.dist_id))
          );
        })
      );
      this.cropsData = this.core.getNotifiedCropList(
        this.core.clone(cropsData),
        this.stateMap,
        this.districtMap,
        this.notifiedUnitMap
      );
      return;
    }
    this.loading++;
    this.core
      .post(request)
      .then((response: any) => {
        if (response?.status == 1) {
          this.dataCrops = response.lkp_Karnatakacrops || [];
          this.cropsData = this.core.getNotifiedCropList(
            this.core.clone(this.dataCrops),
            this.stateMap,
            this.districtMap,
            this.notifiedUnitMap
          );
        }
      })
      .catch((err) => console.error(err))
      .finally(() => this.loading--);
  }

  onSurveyChange(event: any) {
    if (event == 1) {
      this.districtField = "field_502";
    } else if (event == 2) {
      this.districtField = "field_529";
    } else if (event == 3) {
      this.districtField = "field_586";
    }

    this.resetData();
  }

  onYearSelect(env: any) {
    if (!["7"].includes(this.userDetails?.user_role)) {
      this.selectedAgency = [];
      this.agencyData = [];
    }
    this.selectedState = [];
    this.districts = [];
    this.tehsilOptions = [];
    this.blocks = [];
    this.selectedDistrict = [];
    this.selectedBlock = [];
    this.selectedTehsil = [];
    this.selectedUser = [];
    this.selectedSingleUser = [];
    this.getLocationCropData();
    this.getUserData();
    this.resetData();
    if (
      !["7"].includes(this.userDetails?.user_role) &&
      this.singleClient &&
      this.selectedYear &&
      this.selectedSeason
    ) {
      this.getAgencyData();
    }
    if (
      ["7"].includes(this.userDetails?.user_role) &&
      this.selectedYear &&
      this.selectedSeason
    ) {
      this.onAgencyChange(this.selectedAgency);
    }
  }

  onSeasonSelect(env: any) {
    if (!["7"].includes(this.userDetails?.user_role)) {
      this.selectedAgency = [];
      this.agencyData = [];
    }
    this.selectedState = [];
    this.districts = [];
    this.tehsilOptions = [];
    this.blocks = [];
    this.selectedTehsil = [];
    this.selectedDistrict = [];
    this.selectedBlock = [];
    this.selectedUser = [];
    this.selectedSingleUser = [];
    this.getLocationCropData();
    this.getUserData();
    this.resetData();
    if (
      !["7"].includes(this.userDetails?.user_role) &&
      this.singleClient &&
      this.selectedYear &&
      this.selectedSeason
    ) {
      this.getAgencyData();
    }
    if (
      ["7"].includes(this.userDetails?.user_role) &&
      this.selectedYear &&
      this.selectedSeason
    ) {
      this.onAgencyChange(this.selectedAgency);
    }
  }

  onSingleClientChange(event: any) {
    this.selectedClient = this.clientData.filter((d) => d.UNIT_ID == event);
    this.onClientSelect(this.selectedClient);
  }

  async onClientSelect(event: any) {
    this.agencyData = [];
    this.selectedAgency = [];
    this.states = [];
    this.selectedState = [];
    this.selectedState = [];
    this.clientStates = [];
    this.clientDistricts = [];

    this.districts = [];
    this.selectedState = [];
    this.selectedDistrict = [];
    this.selectedUser = [];
    this.selectedSingleUser = [];
    this.getLocationCropData();
    this.getUserData();
    this.resetData();

    if (
      !["7"].includes(this.userDetails?.user_role) &&
      this.singleClient &&
      this.selectedYear &&
      this.selectedSeason
    ) {
      this.getAgencyData();
    }
  }

  getAgencyData() {
    if (this.singleClient && this.selectedYear && this.selectedSeason) {
      const request = {
        purpose: "get_all",
        client_id: this.singleClient,
        year: this.selectedYear,
        season: this.selectedSeason,
      };
      this.agencyLoading++;
      this.core
        .dashboard_post("agency", request)
        .then((response: any) => {
          if (response?.status == 1) {
            this.agencyData = response.all_agencies || [];
            this.agencyData.push({ agency_id: "0", agency_name: "Self" });
          }
        })
        .catch((err) => {
          console.log(err);
        })
        .finally(() => {
          this.agencyLoading--;
        });
    }
  }

  onAgencyChange(event: any) {
    this.selectedState = [];
    this.districts = [];
    this.tehsilOptions = [];
    this.blocks = [];
    this.selectedDistrict = [];
    this.selectedBlock = [];
    this.selectedTehsil = [];
    this.clientStates = [];
    this.clientDistricts = [];
    this.selectedUser = [];
    this.selectedSingleUser = [];
    if (event) {
      this.loadAgencyLocation(event);
    }
    this.getLocationCropData();
    this.getUserData();
    this.resetData();
  }

  async loadAgencyLocation(agency: any) {
    const request = {
      client: this.singleClient,
      agency,
      year: this.selectedYear,
      season: this.selectedSeason,
    };
    this.isStateLoading++;
    const location: any = await this.filter.getAgencyWiseLocation(
      request,
      this.userDetails
    );
    this.isStateLoading--;
    this.clientStates = location.states || [];
    this.clientDistricts = location.districts;
    this.clientTehsils = location.tehsils;

    this.states = this.clientStates;
  }

  onStateChange(env: any) {
    this.districts = [];
    this.tehsilOptions = [];
    this.blocks = [];
    this.selectedDistrict = [];
    this.selectedBlock = [];
    this.selectedUser = [];
    this.selectedSingleUser = [];
    this.getLocationCropData();
    this.getUserData();
    this.resetData();
    if (env?.length) {
      this.districts =
        this.core.clone(env).map((state: any) => {
          const result: any = {
            state_name: state.state_name,
            state_id: state.state_id,
            items: [],
          };
          result.items = this.clientDistricts.filter(
            (district: any) => district.state_id == state.state_id
          );
          return result;
        }) || [];
    }
  }

  onDistrictChange(env: any) {
    this.tehsilOptions = [];
    this.blocks = [];
    this.selectedBlock = [];
    this.selectedUser = [];
    this.selectedSingleUser = [];
    this.getLocationCropData();
    this.getUserData();
    this.resetData();
    if (env?.length) {
      this.tehsilOptions = env.map((district: any) => {
        const result: any = {
          district_id: district.district_id,
          district_name: district.district_name,
        };
        result.items = this.clientTehsils.filter(
          (d: any) => d.district_id == district.district_id
        );
        return result;
      });
    }
  }

  getUserData() {
    this.usersData = [];
    this.selectedUser = [];
    this.selectedSingleUser = [];
    if (
      this.selectedYear &&
      this.selectedSeason &&
      this.singleClient &&
      this.selectedAgency?.length &&
      this.selectedState?.length &&
      this.selectedDistrict?.length
    ) {
      this.userLoading++;
      const request = {
        year: this.selectedYear,
        season: this.selectedSeason,
        states: this.selectedState?.map((d: any) => d.state_id),
        districts: this.selectedDistrict?.map((d: any) => d.district_id),
        tehsils: this.selectedBlock?.map((d: any) => d.tehsil_id),
        roll: "",
        agencies: this.selectedAgency.includes("0") ? [] : this.selectedAgency,
        client_id: this.singleClient,
        purpose: "userslist",
      };

      if (!request.states?.length) {
        request.states = this.states.map((e) => e.state_id);
      }
      if (!request.districts?.length) {
        request.districts = this.districts.map((e) => e.district_id);
      }

      this.core
        .dashboard_post(request)
        .then((response: any) => {
          if (response?.status == 1) {
            this.usersData = response?.userdata || [];
            for (let i = 0; i < this.usersData.length; i++) {
              const user = this.usersData[i];
              user.username = user.first_name + " " + user.last_name;
            }
          }
        })
        .catch((err) => {
          console.error(err);
        })
        .finally(() => this.userLoading--);
    }
  }

  onPageTrigger(env: any) {
    this.currentpage = env.page_no;
    this.recordsPerPage = env.records_per_page;
    this.tableData = this.totalData.slice(
        (this.currentpage - 1) * this.recordsPerPage,
        this.currentpage * this.recordsPerPage
      );
    if (this.pagination) {
      this.pagination.updatePagination();
    }
  }

  search() {
    if (!this.selectedYear) {
      this.core.toast("warn", "Please select year");
      return;
    }
    if (!this.selectedSeason) {
      this.core.toast("warn", "Please select season");
      return;
    }
    if (!this.selectedClient?.length) {
      this.core.toast("warn", "Please select client");
      return;
    }
    if (!this.selectedAgency?.length) {
      this.core.toast("warn", "Please select agency");
      return;
    }
    if (!this.selectedState?.length) {
      this.core.toast("warn", "Please select state");
      return;
    }
    if (!this.selectedDistrict?.length) {
      this.core.toast("warn", "Please select district");
      return;
    }
    if (!this.selectedUser?.length) {
      this.core.toast("warn", "Please select user");
      return;
    }
    this.resetData();
    const fieldsRequests = {
      purpose: "get_surveyfields",
      survey_id: this.selectedForm,
    };
    const request = {
      purpose: "get_all_surveydata",
      survey_id: this.selectedForm,
      crop_column: "",
      agency_id: this.selectedAgency.includes("0") ? [] : this.selectedAgency,
      states: this.selectedState.map((d) => d.state_id),
      districts: this.selectedDistrict.map((d) => d.district_id),
      tehsils: this.selectedTehsil.map((d) => d.tehsil_id),
      start_date: this.selectedFromDate?.startDate?.format("yyyy-MM-DD"),
      end_date: this.selectedFromDate?.endDate?.format("yyyy-MM-DD"),
      crop_id: this.selectedCrop?.map((d: any) => d.crop_id),
      seasons: [this.selectedSeason],
      years: [this.selectedYear],
      client_id: this.selectedClient.map((d) => d.UNIT_ID),
      user_id: this.selectedUser.map((d) => d.user_id),
    };
    if (request.survey_id == 1) {
      request.crop_column = "field_509";
    } else if (request.survey_id == 2) {
      request.crop_column = "field_539";
    } else if (request.survey_id == 3) {
      request.crop_column = "field_593";
    }
    this.dataLoading++;
    Promise.all([
      this.core.post(fieldsRequests),
      this.core.webserivce_post(request),
    ])
      .then(([feildResponse, response]: any) => {
        if (feildResponse?.status == 1) {
          this.setColumns();
        }
        if (response?.status == 1) {
          this.setTableData(response.surveydata);
        }
      })
      .catch((error) => {
        console.error(error);
      })
      .finally(() => {
        this.dataLoading--;
        this.isSearched = true;
      });
  }

  setColumns() {
    if (this.selectedForm == 1) {
      this.columns = [
        { field: "check", header: "" },
        { field: "id", header: "AI Id" },
        { field: "case_ID", header: "Case Id" },
        { field: "data_id", header: "Data Id" },
        { field: "field_951", header: "Cropping Year" },
        { field: "field_506", header: "Season" },
        { field: "field_501", header: "State" },
        { field: "field_502", header: "District" },
        { field: "field_643", header: "Tehsil/Taluka/Sub District/ Block" },
        {
          field: "field_503", header: "Revenue circle/Hubli/GirdawarCircle/Nyay panchayyat",
        },
        { field: "field_644", header: "Grampanchayat/Patwar Halka/Firka" },
        { field: "field_504", header: "Village" },
        { field: "field_509", header: "Crop Name" },
        { field: "field_505", header: "Notified Area/IU" },
        { field: "user_id", header: "User Id" },
        { field: "first_name", header: "User First Name" },
        { field: "last_name", header: "User Last Name" },
        { field: "row_status", header: "Status" },
        { field: "datetime", header: "Date Time" },
      ];
    } else if (this.selectedForm == 2) {
      this.columns = [
        { field: "check", header: "" },
        { field: "id", header: "AI Id" },
        { field: "case_ID", header: "Case Id" },
        { field: "data_id", header: "Data Id" },
        { field: "field_583", header: "Cropping Year" },
        { field: "field_584", header: "Season" },
        { field: "field_585", header: "State" },
        { field: "field_586", header: "District" },
        { field: "field_587", header: "Tehsil/Taluka/Sub District/ Block" },
        { field: "field_588", header: "Revenue circle/Hubli/GirdawarCircle/Nyay panchayyat" },
        { field: "field_591", header: "Grampanchayat/Patwar Halka/Firka" },
        { field: "field_592", header: "Village" },
        { field: "field_593", header: "Crop Name" },
        { field: "field_589", header: "Notified Area/IU" },
        { field: "user_id", header: "User Id" },
        { field: "first_name", header: "User First Name" },
        { field: "last_name", header: "User Last Name" },
        { field: "row_status", header: "Status" },
        { field: "datetime", header: "Date Time" },
      ]
    }
  }

  setTableData(surveyData: any[]) {
    const activeData: any[] = [];
    for (let i = 0; i < surveyData.length; i++) {
      const data = surveyData[i];
      if (this.selectedForm == 1) {
        data.field_951 = this.yearMap.get(data.field_951) || data.field_951;
        data.field_506 = this.seasonMap.get(data.field_506) || data.field_506;
        data.field_501 = this.stateMap.get(data.field_501) || data.field_501;
        data.field_502 = this.districtMap.get(data.field_502) || data.field_502;
        data.field_643 = this.tehsilMap.get(data.field_643) || data.field_643;
        data.field_503 = this.blockMap.get(data.field_503) || data.field_503;
        data.field_644 = this.grampanchayatMap.get(data.field_644) || data.field_644;
        data.field_504 = this.villageMap.get(data.field_504) || data.field_504;
        data.field_505 = this.notifiedUnitMap.get(data.field_505) || data.field_505;
        data.field_509 = this.cropMap.get(+data.field_509) || data.field_509;
      } else if (this.selectedForm == 2) {
        data.field_583 = this.yearMap.get(data.field_583) || data.field_583;
        data.field_584 = this.seasonMap.get(data.field_584) || data.field_584;
        data.field_585 = this.stateMap.get(data.field_585) || data.field_585;
        data.field_586 = this.districtMap.get(data.field_586) || data.field_586;
        data.field_587 = this.tehsilMap.get(data.field_587) || data.field_587;
        data.field_588 = this.blockMap.get(data.field_588) || data.field_588;
        data.field_591 = this.grampanchayatMap.get(data.field_591) || data.field_591;
        data.field_592 = this.villageMap.get(data.field_592) || data.field_592;
        data.field_589 = this.notifiedUnitMap.get(data.field_589) || data.field_589;
        data.field_593 = this.cropMap.get(+data.field_593) || data.field_593;
      }
      if (data.status === "1") {
        if (data.approved_reject === "1") {
          data.row_status = "Approved";
        } else if (data.approved_reject === "0") {
          data.row_status = "Rejected";
        } else {
          data.row_status = "Pending";
        }
        activeData.push(data);
      } else if (data.status === "0") {
        data.row_status = "Draft";
      } else {
        data.row_status = "Deleted";
      }
    }
    this.totalData = activeData;
    this.tableData = this.totalData.slice(
        (this.currentpage - 1) * this.recordsPerPage,
        this.currentpage * this.recordsPerPage
      );
    setTimeout(() => {
      if (this.pagination) {
        this.pagination.updatePagination();
      }
    });
  }

  onSingleUserChange(event: any) {
    this.selectedUser = event ? this.usersData.filter(d => d.user_id == event) : [];
    this.resetData();
  }

  resetData() {
    this.isSearched = false;
    this.currentpage = 1;
    this.columns = [];
    this.totalData = [];
    this.tableData = [];
    this.checkedCount = 0;
    this.allChecked = false;
    this.allIndeterminate = false;
  }

  onRowCheckboxChange(event: any, data: any) {
    data.check = event.target.checked;
    let cCount = 0;
    for (let i = 0; i < this.totalData.length; i++) {
      const ele = this.totalData[i];
      if (ele.id == data.id) {
        ele.check = event.target.checked;
      }
      if (ele.check) {
        cCount++;
      }
    }
    this.checkedCount = cCount;
    this.allChecked = this.checkedCount == this.totalData.length;
    this.allIndeterminate = !this.allChecked && this.checkedCount > 0;
  }

  onAllChecked(event: any) {
    this.allIndeterminate = false;
    for (let i = 0; i < this.totalData.length; i++) {
      const ele = this.totalData[i];
      if (this.tableData[i]) {
        this.tableData[i].check = event;
      }
      ele.check = event;
    }
    this.checkedCount = event ? this.totalData.length : 0
  }

  transferData() {
    this.transferUser = '';
    this.modalService.open(this.transferContent, {centered: true, animation: true, keyboard: false, backdrop: 'static' }).result.then((result) => {
      if (result == 'yes') {
        
        this.modalService.open(this.confirmContent, {centered: true, animation: true, keyboard: false, backdrop: 'static'}).result.then()
      }
    });
  }

  onSubmit(modal: any) {
    if (this.transferUser == this.selectedSingleUser) {
      this.core.toast('warn', "From user and To user cannot be same");
      return;
    }
    modal.close('yes')
  }

  onConfirmed(modal: any) {
    
    const checkObj: any = {};
    for (let i = 0; i < this.totalData.length; i++) {
      const data = this.totalData[i];
      if (data.check) {
        if (checkObj[data.user_id]) {
          checkObj[data.user_id].push(data.data_id)
        } else {
          checkObj[data.user_id] = [data.data_id]
        }
      }
    }
    const data = Object.keys(checkObj).map(user => {
      return {user_id: user, data_id: checkObj[user]}
    })
    this.transferring++;
    const request = {
      purpose: 'transfer',
      survey_id: this.selectedForm,
      new_user: this.transferUser,
      data
    }
    this.core.post(request).then((response: any) => {
      if (response?.status == 1) {
        this.core.toast('success', response?.msg);
        modal.close('yes');
        this.search();
      } else {
        this.core.toast('error', response?.msg);
      }
    }).catch(error => {
      this.transferring++;
      console.error(error);
      this.core.toast('error', 'Unable to transfer ser');
    }).finally
    this.transferring--;
  }

  get deactiveField() {
    return (
      this.selectedYear && this.selectedSeason && this.selectedAgency?.length
    );
  }
}
