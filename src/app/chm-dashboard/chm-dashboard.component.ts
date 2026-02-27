import { Component, OnInit, ViewChild } from "@angular/core";
import { MultiSelectModule } from "primeng/multiselect";
import { Chart } from "angular-highcharts";
import * as Highcharts from "highcharts";
import * as moment from "moment";
import { FilterService } from "../utilities/filter.service";
import { CoreService } from "../utilities/core.service";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { UserDetailService } from "../auth/user-detail.service";
// import { Lookup } from "./lookup";
import { FeatureToggleService } from "../shared/services/feature-toggle.service";
import { environment, ProjectContext } from "../../environments/environment";

@Component({
  selector: "app-chm-dashboard",
  templateUrl: "./chm-dashboard.component.html",
  styleUrls: ["./chm-dashboard.component.css"],
})
export class ChmDashboardComponent implements OnInit {
  @ViewChild("mapDetail") mapDetail: any;

  selectedYear: any[] = [];
  selectedseason: any[] = [];
 
  singleYear: any = '';
  singleseason: any = '';
  singleClient: any = '';
  selectedAgency: any = [] = [];


  crops: any[] = [];
  states: any[] = [];
  districts: any[] = [];
  tehsils: any[] = [];
  kCrops: any[] = [];
  dataCrops: any[] = [];
  notifiedUnit: any[] = [];
  selectedNotifieldUnit: any[] = [];
  cropOptions: any[] = [];

  // tempLookup: Lookup = new Lookup();

  districtOptions: any[] = [];
  tehsilOptions: any[] = [];

  selectedCities: any;

  selectedState: any[] = [];
  selectedDistrict: any[] = [];
  selectedTehsil: any[] = [];
  selectedCrop: any[] = [];
  selectedSI: any = "";
  sIOptions: any[] = [];
  selectedDate: any = {
    startDate: moment().subtract(29, "days"),
    endDate: moment(),
  };
  agencyData: any[] = [];
  localeValue = {
    format: "DD/MM/YYYY",
    displayFormat: "DD-MM-YYYY",
    separator: " - ",
    cancelLabel: "Cancel",
    applyLabel: "Okay",
  };

  Exposure_covered_percentage: any;
  Captured_no_of_samples: any;
  poor_good_moderate: any;
  poor_good_moderate_all: any;
  bar_one: any;
  bar_two: any;
  Rainfall_irrigated: any;
  Crop_wise_health: any;
  location_wise_health: any;

  Resurvey_time: any;
  Change_in_crop_health: any;
  allData: any[] = [];
  surveyData: any[] = [];
  surveyLocation: any[] = [];
  fields: any[] = [];
  revisitData: any[] = [];
  selectedClient: any[] = [];

  revist_survey_map: Map<any, any> = new Map();
  iuServeyMap: Map<any, any> = new Map();
  
  stateMap: Map<any, any> = new Map<any, any>();
  districtMap: Map<any, any> = new Map<any, any>();
  tehsilMap: Map<any, any> = new Map<any, any>();
  blockMap: Map<any, any> = new Map();
  grampanchayatMap: Map<any, any> = new Map();
  villageMap: Map<any, any> = new Map();
  notifiedUnitMap: Map<any, any> = new Map();
  locationlbl = "District";
  cropsMap: Map<any, any> = new Map<any, any>();
  cropIdMap: Map<any, any> = new Map<any, any>();
  cropCodeMap: Map<any, any> = new Map<any, any>();

  loading = 0;
  isFileData = false;
  timestamp: any;
  croploading = 0;
  locationloading = 0;
  agencyLoading = 0;
  isStateLoading = 0;
  active = 1;
  labels: any;
  cities: any;
  user: any;

  ranges = {
    Today: [moment(), moment()],
    Yesterday: [moment().subtract(1, "days"), moment().subtract(1, "days")],
    "Last 7 Days": [moment().subtract(6, "days"), moment()],
    "Last 30 Days": [moment().subtract(29, "days"), moment()],
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

  @ViewChild("content") modelContent: any;
  @ViewChild("location") modelLocation: any;
  seasonOptions: any[] = [];
  yearOptions: any[] = [];
  clientData: any[] = [];
  clientStates: any[] = [];
  clientDistricts: any[] = [];
  clientTehsils: any[] = [];
  allTotData: any[] = [];
  chartlabels: any;
  isFilterCollapsed = true;
  chartStyle = {color: '#333333', fontWeight: 'bold', fontSize: '12px'}
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
    if (this.projectContext === 'saksham') {
      this.selectedClient = ['2000']
    }
    this.user = this.userDetails.getUserDetail();
    this.chartlabels = {style: this.chartStyle};

    this.sIOptions = [
      { label: "> 10 L", value: "1e6-25e5" },
      { label: "> 25 L", value: "25e5-5e6" },
      { label: "> 50 L", value: "5e6-75e5" },
      { label: "> 75 L", value: "75e5-1e7" },
      { label: "> 1 Cr", value: "1e7-2e7" },
      { label: "> 2 Cr", value: "2e7-5e7" },
      { label: "> 5 Cr", value: "5e7-1e8" },
      { label: "> 10 Cr", value: "1e8" },
    ];
  }

  ngOnInit(): void {
    this.loading++;
    this.getLoaedFileData();
    if (this.filter.isLoactionFetched) {
      this.getLocationsData();
    } else {
      this.filter.fetchedLocationData.subscribe(() => {
        this.getLocationsData();
      });
    }
    if (this.filter.isvillageFetched) {
      this.setVilageData();
    } else {
        this.filter.fetchedVillageData.subscribe(() => {
          this.setVilageData();
        })
    }

  }


  setLabels(totData: any) {
    const totalChmToCover = totData
      .map((d: any) => +(d.no_of_CHMs_planned || 0))
      .reduce((a: any, b: any) => a + b, 0);
    this.labels = {};
    this.labels.noOfCHMPlanned = totalChmToCover;
    this.labels.noOfCHMAchieved = totData
      .map((d: any) => d.chmData.length)
      .reduce((a: any, b: any) => a + b, 0);
    this.labels.totalExposure = this.allTotData
      .map((d: any) => Number(d.sum_insured || 0))
      .reduce((a: any, b: any) => a + b, 0);
    this.labels.totalPlanExposure = totData
      .map((d: any) => Number(d.sum_insured || 0))
      .reduce((a: any, b: any) => a + b, 0);
    this.labels.totalCovered = totData
      .map((d: any) => d.exposure_covred)
      .reduce((a: any, b: any) => a + b, 0);
    this.labels.states = this.core.uniqueList(this.allData, "state_id").length;
    this.labels.districts = this.core.uniqueList(
      this.allData,
      "dist_id"
    ).length;
    this.labels.tehsil = this.core.uniqueList(this.allData, "tehsil_id").length;
  }

  getLocationsData() {
    this.states = this.core.clone(this.filter.states);
    this.districts = this.core.clone(this.filter.districts);
    this.tehsils = this.core.clone(this.filter.tehsils);
    this.crops = this.core.clone(this.filter.crops);
    this.clientData = this.core.clone(this.filter.clients);

    if (this.user.unit_id) {
      this.singleClient = this.user.unit_id;
      this.selectedClient = [this.user.unit_id];
    }

    this.setDefaultLocation();

    this.seasonOptions = this.core.clone(this.filter.seasons);
    this.yearOptions = this.core.clone(this.filter.years);
    this.notifiedUnit = this.core.clone(this.filter.notifiedUnits);

    this.states.forEach((d) => this.stateMap.set(d.state_id, d.state_name));
    this.districts.forEach((d) =>
      this.districtMap.set(d.district_id, d.district_name)
    );
    this.tehsils.forEach((d) => this.tehsilMap.set(d.tehsil_id, d.tehsil_name));

    // lkp_block mapping
    for (let indx = 0; indx < this.filter.blocks.length; indx++) {
      const item = this.filter.blocks[indx];
      this.blockMap.set(item.block_id, item.block_name);
    }

    // lkp_notifieldUnit mapping
    for (let indx = 0; indx < this.filter.notifiedUnits.length; indx++) {
      const item = this.filter.notifiedUnits[indx];
      this.notifiedUnitMap.set(item.notified_id, item.notified_unit_name);
    }

    this.filter.crops.forEach((d) =>
      this.cropsMap.set(d.crop_code, d.crop_name)
    );
    this.crops.forEach((d: any) => {
      this.cropIdMap.set(d.id, d.crop_code);
      this.cropCodeMap.set(Number(d.crop_code).toString(), d.id);
    });
    this.loading--;
    this.getLocationCropData();
  }

  setVilageData() {

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
 
   }

  onYearSelect(event: any) {
    this.selectedYear = this.yearOptions.filter(d => d.id == event)
    this.states = [];
    this.selectedState = [];

    this.clientStates = [];
    this.clientDistricts = [];

    this.districtOptions = [];
    this.tehsilOptions = [];
    this.selectedDistrict = [];
    this.selectedTehsil = [];

    if (!['7'].includes(this.user?.user_role)) {
      this.selectedAgency = [];
    }
    this.agencyData = [];

    this.getAgencyData();
    this.getLocationCropData();
  }
  
  onSeasonSelect(event: any) {
    this.selectedseason = this.seasonOptions.filter(d => d.id == event);
    this.states = [];
    this.selectedState = [];

    this.clientStates = [];
    this.clientDistricts = [];

    this.districtOptions = [];
    this.tehsilOptions = [];
    this.selectedDistrict = [];
    this.selectedTehsil = [];

    if (!['7'].includes(this.user?.user_role)) {
      this.selectedAgency = [];
    }
    this.agencyData = [];

    this.getAgencyData();
    this.getLocationCropData();
  }

  onSingleClinetChange(event: any) {
    this.selectedClient = this.clientData.filter(d => d.UNIT_ID == event).map(d => d.UNIT_ID);
    this.onClientSelect(this.selectedClient);
  }

  onAgencyChange(event: any) {
    this.states = [];
    this.selectedState = [];

    this.clientStates = [];
    this.clientDistricts = [];

    this.districtOptions = [];
    this.tehsilOptions = [];
    this.selectedDistrict = [];
    this.selectedTehsil = [];

    if (event) {
      this.loadAgencyLocation(event)
    }

    this.getLocationCropData();
  }

  async loadAgencyLocation(agency: any) {

    const request = {
      client: this.selectedClient, agency, year: this.singleYear, season: this.singleseason
    }
    this.isStateLoading++
    const location: any = await this.filter.getAgencyWiseLocation(request, this.user);
    this.isStateLoading--;
    this.clientStates = location.states || [];
    this.clientDistricts = location.districts;
    this.clientTehsils = location.tehsils;

    this.states = this.clientStates;

  }

  getLocationCropData() {
    this.selectedCrop = [];
    const request = {
      purpose: "lkp_chm_crop",
      state: this.selectedState.map((d) => d.state_id),
      district: this.selectedDistrict.map((d) => d.district_id),
      tehsil: this.selectedTehsil.map((d) => d.tehsil_id),
      notifiedUnit: this.selectedNotifieldUnit.map((d) => d.notified_id),
      years: this.selectedYear.map((d) => d.id),
      seasons: this.selectedseason.map((d) => d.id),
    };

    if (this.dataCrops?.length) {
      const cropOptions = this.core.clone(
        this.dataCrops.filter((d) => {
          return (
            (!request.years.length || request.years.includes(d.year)) &&
            (!request.seasons.length || request.seasons.includes(d.season)) &&
            (!request.state.length || request.state.includes(d.state_id)) &&
            (!request.district.length ||
              request.district.includes(d.dist_id)) &&
            (!request.tehsil.length || request.tehsil.includes(d.tehsil_id)) &&
            (!request.notifiedUnit.length ||
              request.notifiedUnit.includes(d.notified_unit))
          );
        })
      );
      this.cropOptions = this.core.getNotifiedCropList(
        this.core.clone(cropOptions),
        this.stateMap,
        this.districtMap,
        this.notifiedUnitMap
      );
      return;
    }
    this.croploading++;
    this.core
      .post(request)
      .then((response: any) => {
        if (response?.status == 1) {
          this.dataCrops = this.core.sortList(
            response.lkp_Karnatakacrops || [],
            "crop"
          );
          this.cropOptions = this.core.getNotifiedCropList(
            this.core.clone(this.dataCrops),
            this.stateMap,
            this.districtMap,
            this.notifiedUnitMap
          );
        }
      })
      .catch((err) => console.error(err))
      .finally(() => this.croploading--);
  }

  async onClientSelect(event: any) {
    this.states = [];
    this.selectedState = [];

    this.clientStates = [];
    this.clientDistricts = [];

    this.districtOptions = [];
    this.tehsilOptions = [];
    this.selectedDistrict = [];
    this.selectedTehsil = [];

    if (!['7'].includes(this.user?.user_role)) {
      this.selectedAgency = [];
    }
    this.agencyData = [];

    this.getAgencyData();


    // if (event?.length) {
    //   this.locationloading++;
    //   [this.clientStates, this.clientDistricts] =
    //   await this.filter.getClientWiseLocation(event);
    //   this.locationloading--;
    // }
    // this.states = this.core
    //   .clone(this.filter.states)
    //   .filter(
    //     (item: any) =>
    //       !this.clientStates?.length ||
    //       this.clientStates.includes(item.state_id)
    //   );
  }

  getAgencyData() {
    if (this.selectedClient?.length && this.singleYear && this.singleseason) {
      const request = {"purpose":"get_all","client_id":this.selectedClient, 'year': this.singleYear, 'season': this.singleseason};
      this.agencyLoading++;
      this.core.dashboard_post('agency',request).then((response: any) => {
        if (response?.status == 1) {
            this.agencyData = response.all_agencies || [];
            this.agencyData.push({agency_id: '0', agency_name: 'Self'});
        }
      }).catch(err => {
        console.log(err);
      }).finally(() => {
        this.agencyLoading--;
      })
    }
  }

  onStateChange(event: any) {
    this.districtOptions = [];
    this.tehsilOptions = [];
    this.selectedDistrict = [];
    this.selectedTehsil = [];
    if (event?.length) {
      this.districtOptions = event.map((d: any) => {
        d.items = this.clientDistricts.filter(
          (e) =>
            e.state_id == d.state_id
        );
        return d;
      });
    }
    this.getLocationCropData();
  }

  onDistrictChange(event: any) {
    this.tehsilOptions = [];
    this.selectedTehsil = [];
    if (event?.length) {
      this.tehsilOptions = event.map((d: any) => {
        d.items = this.clientTehsils.filter((e) => e.district_id == d.district_id);
        return d;
      });
    }
    this.getLocationCropData();
  }

  onTehsilChange() {
    this.getLocationCropData();
  }

  isValidSI(data: any, key: string) {
    if (!this.selectedSI) {
      return true;
    } else {
      const tot = data
        .map((d: any) => Number(d[key] || 0))
        .reduce((a: any, b: any) => a + b, 0);
      const [min, max] = this.selectedSI.split("-").map((d: any) => Number(d));
      return (!min || tot >= min) && (!max || tot <= max);
    }
  }

  onSearch() {
    if (!this.selectedState?.length) {
      this.core.toast("warn", "Please select at least one state");
      return;
    }
    this.isFileData = false
    this.timestamp = null;
    const request: any = { purpose: "get_chm_data" };
    request.state = this.selectedState.map((d) => d.state_id);
    request.district = this.selectedDistrict.map((d) => d.district_id);
    request.tehsil = this.selectedTehsil.map((d) => d.tehsil_id);
    request.crop = this.selectedCrop?.map((d: any) => d.crop_id);
    request.client_id = this.selectedClient;
    request.seasons = this.selectedseason.map((d) => d.id);
    request.years = this.selectedYear.map((d) => d.id);

    const surveyDataRequest = {
      purpose: "get_surveydata",
      survey_id: "1",
      crop_column: "field_509",
      states: this.selectedState.map((d) => d.state_id),
      districts: this.selectedDistrict.map((d) => d.district_id),
      tehsils: this.selectedTehsil.map((d) => d.tehsil_id),
      start_date: this.selectedDate?.startDate?.format("yyyy-MM-DD"),
      end_date: this.selectedDate?.endDate?.format("yyyy-MM-DD"),
      crop_id: this.selectedCrop?.map((d: any) => d.crop_id),
      client_id: this.selectedClient,
      seasons: this.selectedseason.map((d) => d.id),
      years: this.selectedYear.map((d) => d.id),
      agency_id: this.selectedAgency.includes('0') ? [] : this.selectedAgency,
      user_id: [],
    };
    const fieldsRequests = {
      purpose: "get_surveydata",
      survey_id: "4",
      // states: this.selectedState.map((d) => d.state_id),
      // districts: this.selectedDistrict.map((d) => d.district_id),
      // tehsils: this.selectedTehsil.map((d) => d.tehsil_id),
      start_date: this.selectedDate?.startDate?.format("yyyy-MM-DD"),
      end_date: this.selectedDate?.endDate?.format("yyyy-MM-DD"),
      crop_id: this.selectedCrop?.map((d: any) => d.crop_id),
      // client_id: this.selectedClient.map((d) => d.UNIT_ID),
      seasons: this.selectedseason.map((d) => d.id),
      years: this.selectedYear.map((d) => d.id),
      user_id: [],
    };
    this.loading++;
    if (+this.user.user_role > 2 || this.selectedClient.length) {
      const allStates = this.states.map((e) => e.state_id);
      const allDistrict = this.clientDistricts.map((e) => e.district_id);
      const allTehsils = this.clientTehsils.map((e) => e.tehsil_id);

      if (!request.state?.length) {
        request.state = allStates;
      }
      if (!request.district?.length) {
        request.district = allDistrict;
      }
      if (!request.tehsil?.length) {
        request.tehsil = allTehsils;
      }

      if (!surveyDataRequest.states?.length) {
        surveyDataRequest.states = allStates;
      }
      if (!surveyDataRequest.districts?.length) {
        surveyDataRequest.districts = allDistrict;
      }
      if (!surveyDataRequest.tehsils?.length) {
        surveyDataRequest.tehsils = allTehsils;
      }
    }
    this.clearDetail();
    const allPromises = [request, surveyDataRequest, fieldsRequests].map(
      (d: any) => this.core.dashboard_post(d)
    );
    Promise.all(allPromises)
      .then((responses: any) => {
        if (responses?.[0].status == 1) {
          const distIds = this.core
            .clone(this.districtOptions)
            .flatMap((d: any) => d.items)
            .map((d: any) => d.district_id);

          this.allData = (responses[0]?.allData || []).filter(
            (d: any) => !distIds?.length || distIds.includes(d.dist_id)
          );
          this.kCrops = responses[0].lkp_Karnatakacrops || [];
          this.notifiedUnit = responses[0].lkp_notified_unit || [];
        }
        if (responses?.[2].status == 1) {
          this.revisitData = responses[2].surveydata
          for (let i = 0; i < this.revisitData.length; i++) {
            const data = this.revisitData[i];
            let revisit_map_data = this.revist_survey_map.get(data.case_ID);
            if (!revisit_map_data) {
              revisit_map_data = [];
            }
            revisit_map_data.push(data);
            this.revist_survey_map.set(data.case_ID, revisit_map_data);
          }
        }
        if (responses?.[1].status == 1) {
          this.surveyData = responses[1].surveydata || [];
          
          for (let i = 0; i < this.surveyData.length; i++) {
            const data = this.surveyData[i];
            data.revisit_data = this.revist_survey_map.get(data.case_ID) || [];
            const notified_unit = data.field_505;
            const crop = +data.field_509;
            const state_id = data.field_501;
            const dist_id = data.field_502;
            const year = data.field_951;
            const season = data.field_506;
            let gp_notified_area = "";
            if (notified_unit == 1) {
              gp_notified_area = data.field_644;
            } else if (notified_unit == 2) {
              gp_notified_area = data.field_503;
            } else if (notified_unit == 3) {
              gp_notified_area = data.field_643;
            } else if (notified_unit == 4) {
              gp_notified_area = data.field_504;
            } else if (notified_unit == 5) {
              gp_notified_area = data.field_502;
            }
  
            const key = `${gp_notified_area}=>${notified_unit}=>${crop}=>${state_id}=>${dist_id}=>${year}=>${season}`;
            data.key = key;
            if (this.iuServeyMap.get(key)) {
              this.iuServeyMap.get(key).push(data);
            } else {
              this.iuServeyMap.set(key, [data]);
            }
          }

          const dataIds = this.core.uniqueList(this.surveyData, "data_id");
          this.surveyLocation = (responses[1].locationdata || []).filter(
            (d: any) => dataIds.includes(d.data_id)
          );
          this.refreshDetail();
        }


        this.generateCharts();
      })
      .catch((err) => console.log(err))
      .finally(() => this.loading--);
  }

  generateIUCalculation(plan_data: any[], survey_data: any[]) {
    const all_ius: any[] = [];
    const iu_calculated_data = [];
    const state_iu_wise_map = new Map();
    const district_iu_wise_map = new Map();
    const tehsil_iu_wise_map = new Map();
    const all_iu_wise_map = new Map();
    const crop_iu_wise_map = new Map();
    const state_survey_wise_map = new Map();
    const crop_survey_wise_map = new Map();
    const revisit_moniter = {
      on_time: 0,
      delay: 0,
      missed: 0,
      no_change: 0,
      improving: 0,
      deteriorating: 0,
      revisit_exposure: 0,
			no_change_exposure: 0,
			improving_trend_exposure: 0,
			deteriorating_trend_exposure: 0,
    };
    const labels: any = {
      no_of_chm_planned: 0,
      no_of_chm_achieved: 0,
      total_sum_insured: 0,
      planned_sum_insured: 0,
      exposure_covred: 0,
      states: new Set(),
      districts: new Set(),
      tehsils: new Set(),
    };
    const healthMap = new Map();
    healthMap.set("Very Poor", 1);
    healthMap.set("Poor", 2);
    healthMap.set("Average", 3);
    healthMap.set("Good", 4);
    healthMap.set("Very Good", 5);
    if (plan_data?.length && survey_data?.length) {
      for (let pin = 0; pin < plan_data.length; pin++) {
        const ele = plan_data[pin];
        const key = `${ele.gp_notified_area}=>${ele.notified_unit}=>${ele.crop}=>${ele.state_id}=>${ele.dist_id}=>${ele.year}=>${ele.season}`;
        if (!all_ius.includes(key)) {
          all_ius.push(key);
          labels.total_sum_insured += +ele.sum_insured || 0;
          const result: any = {};
          result.data = ele;
          
          let iu_name = '';
          if (result.data.notified_unit == 1) {
            iu_name = this.grampanchayatMap.get(result.data.gp_notified_area) || result.data.notified_unit
          } else if (result.data.notified_unit == 2) {
            iu_name = this.blockMap.get(result.data.gp_notified_area) || result.data.notified_unit
          } else if (result.data.notified_unit == 3) {
            iu_name = this.tehsilMap.get(result.data.gp_notified_area) || result.data.notified_unit
          } else if (result.data.notified_unit == 4) {
            iu_name = this.villageMap.get(result.data.gp_notified_area) || result.data.notified_unit
          } else if (result.data.notified_unit == 5) {
            iu_name = this.districtMap.get(result.data.gp_notified_area) || result.data.notified_unit
          }
          result.survey_data = this.iuServeyMap.get(key) || [];
          result.key = key;
          result.state_id = result.data.state_id;
          result.dist_id = result.data.dist_id;
          result.tehsil_id = result.data.tehsil_id;
          result.gp_notified_area = result.data.gp_notified_area;
          result.notified_unit = result.data.notified_unit;
          result.crop = result.data.crop;
          result.season = result.data.season;
          result.year = result.data.year;
          result.threshold_yield = +result.data.threshold_yield || 0;
          result.gross_premium = +result.data.gross_premium || 0;
          result.sum_insured = +result.data.sum_insured || 0;
          result.planned_sum_insured = 0;
          result.no_of_survey = result.survey_data.length;
          result.no_of_CHMs_planned = +(result.data.no_of_CHMs_planned || 0);
          result.exposure_covred = result.sum_insured;
          labels.no_of_chm_achieved += result.no_of_survey;
          if (ele.no_of_CHMs_planned > 0) {
          // iu_name += ' - ' + (this.cropsMap.get(result.data.crop) ||  this.cropsMap.get('0'+result.data.crop)),
            labels.states.add(result.state_id);
            labels.districts.add(result.dist_id);
            labels.tehsils.add(result.tehsil_id);
            result.planned_sum_insured = result.sum_insured;
            result.exposure_covred =
              result.no_of_survey <= result.no_of_CHMs_planned
                ? result.sum_insured *
                  this.divide(result.no_of_survey, result.data.no_of_CHMs_planned)
                : result.sum_insured;
            // result.exposure_covred = result.sum_insured * this.divide(result.no_of_survey, result.no_of_CHMs_planned);
            labels.planned_sum_insured += result.sum_insured;
            labels.no_of_chm_planned += result.no_of_CHMs_planned;

          }

            result.very_good = 0;
            result.good = 0;
            result.average = 0;
            result.poor = 0;
            result.very_poor = 0;
            result.not_surveyed = 0;
  
            result.very_good_weightage = 0;
            result.good_weightage = 0;
            result.average_weightage = 0;
            result.poor_weightage = 0;
            result.very_poor_weightage = 0;
            result.not_surveyed_weightage = 0;

            result.revisit_exposure = 0;
            result.no_change_exposure = 0;
            result.improving_trend_exposure = 0;
            result.deteriorating_trend_exposure = 0;

            result.no_change =  0;
				    result.improving =  0;
				    result.deteriorating =  0;
  
            if (result.no_of_survey) {
              for (let i = 0; i < result.no_of_survey; i++) {
                const survey_data = result.survey_data[i];
                const crop_health = (
                  survey_data.revisit_data.length
                    ? survey_data.revisit_data[0].field_712
                    : survey_data.field_518
                )
                  ?.toLowerCase()
                  .trim();
                if (crop_health === "very good") {
                  result.very_good++;
                } else if (crop_health === "good") {
                  result.good++;
                } else if (crop_health === "average") {
                  result.average++;
                } else if (crop_health === "poor") {
                  result.poor++;
                } else if (crop_health === "very poor") {
                  result.very_poor++;
                }
  
                let state_survey_wise_data = state_survey_wise_map.get(
                  result.state_id
                );
                let crop_survey_wise_data = crop_survey_wise_map.get(
                  +result.crop
                );
                if (!state_survey_wise_data) {
                  state_survey_wise_data = [];
                }
                if (!crop_survey_wise_data) {
                  crop_survey_wise_data = [];
                }
                state_survey_wise_data.push(survey_data);
                crop_survey_wise_data.push(survey_data);
  
                state_survey_wise_map.set(
                  result.state_id,
                  state_survey_wise_data
                );
                crop_survey_wise_map.set(+result.crop, crop_survey_wise_data);
  
                if (survey_data.revisit_data.length) {
                  const revist =
                    survey_data.revisit_data[survey_data.revisit_data.length - 1];
                  if (
                    moment(revist.datetime).isBetween(
                      moment(survey_data.datetime),
                      moment(moment(revist.datetime).add(19, "days"))
                    )
                  ) {
                    revisit_moniter.on_time++;
                  } else {
                    revisit_moniter.delay++;
                  }
  
                  if (survey_data.revisit_data.length == 1) {
                    result.revisit_exposure += result.exposure_covred;
                    if (
                      survey_data.field_518 ==
                      survey_data.revisit_data[0].field_712
                    ) {
                      revisit_moniter.no_change++;
                      result.no_change++;
                    } else if (
                      healthMap.get(survey_data.revisit_data[0].field_712) >
                      healthMap.get(survey_data.field_518)
                    ) {
                      revisit_moniter.improving++;
                      result.improving++;
                    } else {
                      revisit_moniter.deteriorating++;
                      result.deteriorating++;
                    }
                  } else {
                    if (
                      survey_data.revisit_data[0].field_712 ==
                      survey_data.revisit_data[1].field_712
                    ) {
                      revisit_moniter.no_change++;
                      result.no_change++;
                    } else if (
                      healthMap.get(survey_data.revisit_data[1].field_712) >
                      healthMap.get(survey_data.revisit_data[0].field_712)
                    ) {
                      revisit_moniter.improving++;
                      result.improving++;
                    } else {
                      revisit_moniter.deteriorating++;
                      result.deteriorating++;
                    }
                  }
                } else {
                  revisit_moniter.missed++;
                }
              }
            }
            result.not_surveyed =
              result.no_of_survey > result.no_of_CHMs_planned
                ? 0
                : result.no_of_CHMs_planned -
                  (result.very_poor +
                    result.poor +
                    result.average +
                    result.good +
                    result.very_good);
  
            if (result.no_of_survey > 0 && result.no_of_survey < result.no_of_CHMs_planned) {
              result.very_good_weightage = this.divide(
                result.very_good,
                result.no_of_CHMs_planned
              );
              result.good_weightage = this.divide(
                result.good,
                result.no_of_CHMs_planned
              );
              result.average_weightage = this.divide(
                result.average,
                result.no_of_CHMs_planned
              );
              result.poor_weightage = this.divide(
                result.poor,
                result.no_of_CHMs_planned
              );
              result.very_poor_weightage = this.divide(
                result.very_poor,
                result.no_of_CHMs_planned
              );
              result.not_surveyed_weightage = this.divide(
                result.not_surveyed,
                result.no_of_CHMs_planned
              );
            } else {
              result.very_good_weightage = this.divide(
                result.very_good,
                result.no_of_survey
              );
              result.good_weightage = this.divide(result.good, result.no_of_survey);
              result.average_weightage = this.divide(
                result.average,
                result.no_of_survey
              );
              result.poor_weightage = this.divide(result.poor, result.no_of_survey);
              result.very_poor_weightage = this.divide(
                result.very_poor,
                result.no_of_survey
              );
              result.not_surveyed_weightage = this.divide(
                result.not_surveyed,
                result.no_of_survey
              );
            }
  
            result.very_poor_sum_insured =
              result.very_poor_weightage * result.exposure_covred;
            result.poor_sum_insured = result.poor_weightage * result.exposure_covred;
            result.average_sum_insured =
              result.average_weightage * result.exposure_covred;
            result.good_sum_insured = result.good_weightage * result.exposure_covred;
            result.very_good_sum_insured =
              result.very_good_weightage * result.exposure_covred;
            // result.no_loss_sum_insured =
            //   result.not_surveyed_weightage * result.exposure_covred;

            result.tot_sum_insured = result.very_poor_sum_insured + result.poor_sum_insured + result.average_sum_insured + result.good_sum_insured + result.very_good_sum_insured + result.no_loss_sum_insured;
            result.planned_exposure_covred = result.very_poor_sum_insured + result.poor_sum_insured + result.average_sum_insured + result.good_sum_insured + result.very_good_sum_insured;
            labels.exposure_covred += result.planned_exposure_covred;
            result.no_loss_sum_insured  = result.no_of_CHMs_planned &&  result.sum_insured > result.planned_exposure_covred ? result.sum_insured - result.planned_exposure_covred : 0;
            // result.no_loss_sum_insured  = result.no_of_CHMs_planned ? result.sum_insured - result.planned_exposure_covred : 0;
            if (result.tot_sum_insured.toFixed(2) != result.exposure_covred.toFixed(2)) {
            }
  
            result.tot = this.divide(result.no_of_survey, result.no_of_CHMs_planned);
  
            let state_iu_wise_data = state_iu_wise_map.get(result.state_id);
            if (!state_iu_wise_data) {
              state_iu_wise_data = {
                name: this.stateMap.get(result.state_id),
                threshold_yield: 0,
                gross_premium: 0,
                sum_insured: 0,
                planned_sum_insured: 0,
                no_of_survey: 0,
                no_of_CHMs_planned: 0,
                exposure_covred: 0,
                planned_exposure_covred: 0,
                very_good: 0,
                good: 0,
                average: 0,
                poor: 0,
                very_poor: 0,
                not_surveyed: 0,
                very_good_weightage: 0,
                good_weightage: 0,
                average_weightage: 0,
                poor_weightage: 0,
                very_poor_weightage: 0,
                not_surveyed_weightage: 0,
                very_poor_sum_insured: 0,
                poor_sum_insured: 0,
                average_sum_insured: 0,
                good_sum_insured: 0,
                very_good_sum_insured: 0,
                no_loss_sum_insured: 0,
                tot: 0,
              };
            }
            state_iu_wise_data.threshold_yield += result.threshold_yield;
            state_iu_wise_data.gross_premium += result.gross_premium;
            state_iu_wise_data.sum_insured += result.sum_insured;
            state_iu_wise_data.planned_sum_insured += result.planned_sum_insured;
            state_iu_wise_data.no_of_survey += result.no_of_survey;
            state_iu_wise_data.no_of_CHMs_planned += result.no_of_CHMs_planned;
            state_iu_wise_data.exposure_covred += result.exposure_covred;
            state_iu_wise_data.planned_exposure_covred += result.planned_exposure_covred;
            state_iu_wise_data.very_good += result.very_good;
            state_iu_wise_data.good += result.good;
            state_iu_wise_data.average += result.average;
            state_iu_wise_data.poor += result.poor;
            state_iu_wise_data.very_poor += result.very_poor;
            state_iu_wise_data.not_surveyed += result.not_surveyed;
            state_iu_wise_data.very_good_weightage += result.very_good_weightage;
            state_iu_wise_data.good_weightage += result.good_weightage;
            state_iu_wise_data.average_weightage += result.average_weightage;
            state_iu_wise_data.poor_weightage += result.poor_weightage;
            state_iu_wise_data.very_poor_weightage += result.very_poor_weightage;
            state_iu_wise_data.not_surveyed_weightage +=
              result.not_surveyed_weightage;
            state_iu_wise_data.very_poor_sum_insured +=
              result.very_poor_sum_insured;
            state_iu_wise_data.poor_sum_insured += result.poor_sum_insured;
            state_iu_wise_data.average_sum_insured += result.average_sum_insured;
            state_iu_wise_data.good_sum_insured += result.good_sum_insured;
            state_iu_wise_data.very_good_sum_insured +=
              result.very_good_sum_insured;
            state_iu_wise_data.no_loss_sum_insured += result.no_loss_sum_insured;
            state_iu_wise_data.tot += this.divide(state_iu_wise_data.no_of_survey, state_iu_wise_data.no_of_CHMs_planned);
  
            state_iu_wise_map.set(result.state_id, state_iu_wise_data);

            let district_iu_wise_data = district_iu_wise_map.get(result.dist_id);
            if (!district_iu_wise_data) {
              district_iu_wise_data = {
                name: this.districtMap.get(result.dist_id),
                threshold_yield: 0,
                gross_premium: 0,
                sum_insured: 0,
                planned_sum_insured: 0,
                no_of_survey: 0,
                no_of_CHMs_planned: 0,
                exposure_covred: 0,
                planned_exposure_covred: 0,
                very_good: 0,
                good: 0,
                average: 0,
                poor: 0,
                very_poor: 0,
                not_surveyed: 0,
                very_good_weightage: 0,
                good_weightage: 0,
                average_weightage: 0,
                poor_weightage: 0,
                very_poor_weightage: 0,
                not_surveyed_weightage: 0,
                very_poor_sum_insured: 0,
                poor_sum_insured: 0,
                average_sum_insured: 0,
                good_sum_insured: 0,
                very_good_sum_insured: 0,
                no_loss_sum_insured: 0,
                tot: 0,
              };
            }
            district_iu_wise_data.threshold_yield += result.threshold_yield;
            district_iu_wise_data.gross_premium += result.gross_premium;
            district_iu_wise_data.sum_insured += result.sum_insured;
            district_iu_wise_data.planned_sum_insured += result.planned_sum_insured;
            district_iu_wise_data.no_of_survey += result.no_of_survey;
            district_iu_wise_data.no_of_CHMs_planned += result.no_of_CHMs_planned;
            district_iu_wise_data.exposure_covred += result.exposure_covred;
            district_iu_wise_data.planned_exposure_covred += result.planned_exposure_covred;
            district_iu_wise_data.very_good += result.very_good;
            district_iu_wise_data.good += result.good;
            district_iu_wise_data.average += result.average;
            district_iu_wise_data.poor += result.poor;
            district_iu_wise_data.very_poor += result.very_poor;
            district_iu_wise_data.not_surveyed += result.not_surveyed;
            district_iu_wise_data.very_good_weightage += result.very_good_weightage;
            district_iu_wise_data.good_weightage += result.good_weightage;
            district_iu_wise_data.average_weightage += result.average_weightage;
            district_iu_wise_data.poor_weightage += result.poor_weightage;
            district_iu_wise_data.very_poor_weightage += result.very_poor_weightage;
            district_iu_wise_data.not_surveyed_weightage +=
              result.not_surveyed_weightage;
            district_iu_wise_data.very_poor_sum_insured +=
              result.very_poor_sum_insured;
            district_iu_wise_data.poor_sum_insured += result.poor_sum_insured;
            district_iu_wise_data.average_sum_insured += result.average_sum_insured;
            district_iu_wise_data.good_sum_insured += result.good_sum_insured;
            district_iu_wise_data.very_good_sum_insured +=
              result.very_good_sum_insured;
            district_iu_wise_data.no_loss_sum_insured += result.no_loss_sum_insured;
            district_iu_wise_data.tot += this.divide(district_iu_wise_data.no_of_survey, district_iu_wise_data.no_of_CHMs_planned);
  
            district_iu_wise_map.set(result.dist_id, district_iu_wise_data);


            let tehsil_iu_wise_data = tehsil_iu_wise_map.get(result.tehsil_id);
            if (!tehsil_iu_wise_data) {
              tehsil_iu_wise_data = {
                name: this.tehsilMap.get(result.tehsil_id),
                threshold_yield: 0,
                gross_premium: 0,
                sum_insured: 0,
                planned_sum_insured: 0,
                no_of_survey: 0,
                no_of_CHMs_planned: 0,
                exposure_covred: 0,
                planned_exposure_covred: 0,
                very_good: 0,
                good: 0,
                average: 0,
                poor: 0,
                very_poor: 0,
                not_surveyed: 0,
                very_good_weightage: 0,
                good_weightage: 0,
                average_weightage: 0,
                poor_weightage: 0,
                very_poor_weightage: 0,
                not_surveyed_weightage: 0,
                very_poor_sum_insured: 0,
                poor_sum_insured: 0,
                average_sum_insured: 0,
                good_sum_insured: 0,
                very_good_sum_insured: 0,
                no_loss_sum_insured: 0,
                tot: 0,
              };
            }
            tehsil_iu_wise_data.threshold_yield += result.threshold_yield;
            tehsil_iu_wise_data.gross_premium += result.gross_premium;
            tehsil_iu_wise_data.sum_insured += result.sum_insured;
            tehsil_iu_wise_data.planned_sum_insured += result.planned_sum_insured;
            tehsil_iu_wise_data.no_of_survey += result.no_of_survey;
            tehsil_iu_wise_data.no_of_CHMs_planned += result.no_of_CHMs_planned;
            tehsil_iu_wise_data.exposure_covred += result.exposure_covred;
            tehsil_iu_wise_data.planned_exposure_covred += result.planned_exposure_covred;
            tehsil_iu_wise_data.very_good += result.very_good;
            tehsil_iu_wise_data.good += result.good;
            tehsil_iu_wise_data.average += result.average;
            tehsil_iu_wise_data.poor += result.poor;
            tehsil_iu_wise_data.very_poor += result.very_poor;
            tehsil_iu_wise_data.not_surveyed += result.not_surveyed;
            tehsil_iu_wise_data.very_good_weightage += result.very_good_weightage;
            tehsil_iu_wise_data.good_weightage += result.good_weightage;
            tehsil_iu_wise_data.average_weightage += result.average_weightage;
            tehsil_iu_wise_data.poor_weightage += result.poor_weightage;
            tehsil_iu_wise_data.very_poor_weightage += result.very_poor_weightage;
            tehsil_iu_wise_data.not_surveyed_weightage +=
              result.not_surveyed_weightage;
            tehsil_iu_wise_data.very_poor_sum_insured +=
              result.very_poor_sum_insured;
            tehsil_iu_wise_data.poor_sum_insured += result.poor_sum_insured;
            tehsil_iu_wise_data.average_sum_insured += result.average_sum_insured;
            tehsil_iu_wise_data.good_sum_insured += result.good_sum_insured;
            tehsil_iu_wise_data.very_good_sum_insured +=
              result.very_good_sum_insured;
            tehsil_iu_wise_data.no_loss_sum_insured += result.no_loss_sum_insured;
            tehsil_iu_wise_data.tot += this.divide(tehsil_iu_wise_data.no_of_survey, tehsil_iu_wise_data.no_of_CHMs_planned);
  
            tehsil_iu_wise_map.set(result.tehsil_id, tehsil_iu_wise_data);

            let all_iu_wise_data = all_iu_wise_map.get(result.data.gp_notified_area);
            if (!all_iu_wise_data) {
              all_iu_wise_data = {
                name: iu_name,
                threshold_yield: 0,
                gross_premium: 0,
                sum_insured: 0,
                planned_sum_insured: 0,
                no_of_survey: 0,
                no_of_CHMs_planned: 0,
                exposure_covred: 0,
                planned_exposure_covred: 0,
                very_good: 0,
                good: 0,
                average: 0,
                poor: 0,
                very_poor: 0,
                not_surveyed: 0,
                very_good_weightage: 0,
                good_weightage: 0,
                average_weightage: 0,
                poor_weightage: 0,
                very_poor_weightage: 0,
                not_surveyed_weightage: 0,
                very_poor_sum_insured: 0,
                poor_sum_insured: 0,
                average_sum_insured: 0,
                good_sum_insured: 0,
                very_good_sum_insured: 0,
                no_loss_sum_insured: 0,
                tot: 0,
              };
            }
            all_iu_wise_data.threshold_yield += result.threshold_yield;
            all_iu_wise_data.gross_premium += result.gross_premium;
            all_iu_wise_data.sum_insured += result.sum_insured;
            all_iu_wise_data.planned_sum_insured += result.planned_sum_insured;
            all_iu_wise_data.no_of_survey += result.no_of_survey;
            all_iu_wise_data.no_of_CHMs_planned += result.no_of_CHMs_planned;
            all_iu_wise_data.exposure_covred += result.exposure_covred;
            all_iu_wise_data.planned_exposure_covred += result.planned_exposure_covred;
            all_iu_wise_data.very_good += result.very_good;
            all_iu_wise_data.good += result.good;
            all_iu_wise_data.average += result.average;
            all_iu_wise_data.poor += result.poor;
            all_iu_wise_data.very_poor += result.very_poor;
            all_iu_wise_data.not_surveyed += result.not_surveyed;
            all_iu_wise_data.very_good_weightage += result.very_good_weightage;
            all_iu_wise_data.good_weightage += result.good_weightage;
            all_iu_wise_data.average_weightage += result.average_weightage;
            all_iu_wise_data.poor_weightage += result.poor_weightage;
            all_iu_wise_data.very_poor_weightage += result.very_poor_weightage;
            all_iu_wise_data.not_surveyed_weightage +=
              result.not_surveyed_weightage;
            all_iu_wise_data.very_poor_sum_insured +=
              result.very_poor_sum_insured;
            all_iu_wise_data.poor_sum_insured += result.poor_sum_insured;
            all_iu_wise_data.average_sum_insured += result.average_sum_insured;
            all_iu_wise_data.good_sum_insured += result.good_sum_insured;
            all_iu_wise_data.very_good_sum_insured +=
              result.very_good_sum_insured;
            all_iu_wise_data.no_loss_sum_insured += result.no_loss_sum_insured;
            all_iu_wise_data.tot += this.divide(all_iu_wise_data.no_of_survey, all_iu_wise_data.no_of_CHMs_planned);
  
            all_iu_wise_map.set(result.data.gp_notified_area, all_iu_wise_data);
          
  
            let crop_iu_wise_data = crop_iu_wise_map.get(+result.crop);
            if (!crop_iu_wise_data) {
              crop_iu_wise_data = {
                name: this.cropsMap.get(result.crop) ||  this.cropsMap.get('0'+result.crop),
                threshold_yield: 0,
                gross_premium: 0,
                sum_insured: 0,
                planned_sum_insured: 0,
                no_of_survey: 0,
                no_of_CHMs_planned: 0,
                exposure_covred: 0,
                planned_exposure_covred: 0,
                very_good: 0,
                good: 0,
                average: 0,
                poor: 0,
                very_poor: 0,
                not_surveyed: 0,
                very_good_weightage: 0,
                good_weightage: 0,
                average_weightage: 0,
                poor_weightage: 0,
                very_poor_weightage: 0,
                not_surveyed_weightage: 0,
                very_poor_sum_insured: 0,
                poor_sum_insured: 0,
                average_sum_insured: 0,
                good_sum_insured: 0,
                very_good_sum_insured: 0,
                no_loss_sum_insured: 0,
                tot: 0,
              };
            }
  
            crop_iu_wise_data.threshold_yield += result.threshold_yield;
            crop_iu_wise_data.gross_premium += result.gross_premium;
            crop_iu_wise_data.sum_insured += result.sum_insured;
            crop_iu_wise_data.planned_sum_insured += result.planned_sum_insured;
            crop_iu_wise_data.no_of_survey += result.no_of_survey;
            crop_iu_wise_data.no_of_CHMs_planned += result.no_of_CHMs_planned;
            crop_iu_wise_data.exposure_covred += result.exposure_covred;
            crop_iu_wise_data.planned_exposure_covred += result.exposure_covred;
            crop_iu_wise_data.very_good += result.very_good;
            crop_iu_wise_data.good += result.good;
            crop_iu_wise_data.average += result.average;
            crop_iu_wise_data.poor += result.poor;
            crop_iu_wise_data.very_poor += result.very_poor;
            crop_iu_wise_data.not_surveyed += result.not_surveyed;
            crop_iu_wise_data.very_good_weightage += result.very_good_weightage;
            crop_iu_wise_data.good_weightage += result.good_weightage;
            crop_iu_wise_data.average_weightage += result.average_weightage;
            crop_iu_wise_data.poor_weightage += result.poor_weightage;
            crop_iu_wise_data.very_poor_weightage += result.very_poor_weightage;
            crop_iu_wise_data.not_surveyed_weightage +=
              result.not_surveyed_weightage;
            crop_iu_wise_data.very_poor_sum_insured +=
              result.very_poor_sum_insured;
            crop_iu_wise_data.poor_sum_insured += result.poor_sum_insured;
            crop_iu_wise_data.average_sum_insured += result.average_sum_insured;
            crop_iu_wise_data.good_sum_insured += result.good_sum_insured;
            crop_iu_wise_data.very_good_sum_insured +=
              result.very_good_sum_insured;
            crop_iu_wise_data.no_loss_sum_insured += result.no_loss_sum_insured;
            crop_iu_wise_data.tot += this.divide(crop_iu_wise_data.no_of_survey, crop_iu_wise_data.no_of_CHMs_planned);
  
            crop_iu_wise_map.set(+result.crop, crop_iu_wise_data);
  
            iu_calculated_data.push(result);

            if (result.revisit_exposure > 0) {
              const total_revisit = result.no_change + result.improving + result.deteriorating;
              result.no_change_exposure = this.divide(result.no_change, total_revisit) * result.revisit_exposure;
              result.improving_trend_exposure = this.divide(result.improving, total_revisit) * result.revisit_exposure;
              result.deteriorating_trend_exposure = this.divide(result.deteriorating, total_revisit) * result.revisit_exposure;
            }


            revisit_moniter.revisit_exposure += result.revisit_exposure;
            revisit_moniter.no_change_exposure += result.no_change_exposure;
            revisit_moniter.improving_trend_exposure += result.improving_trend_exposure;
            revisit_moniter.deteriorating_trend_exposure += result.deteriorating_trend_exposure;

          
        }
      }
    }
  
    labels.states = labels.states.size
    labels.districts = labels.districts.size
    labels.tehsils = labels.tehsils.size

    let iu_wise_map = null;
    if (tehsil_iu_wise_map.size === 1) {
      this.locationlbl = 'IU'
      iu_wise_map = all_iu_wise_map;
    }
    else if (district_iu_wise_map.size === 1) {
      this.locationlbl = 'Block'
      iu_wise_map = tehsil_iu_wise_map;
    } else if (state_iu_wise_map.size === 1) {
      this.locationlbl = 'District'
      iu_wise_map = district_iu_wise_map;
    } else {
      this.locationlbl = 'State'
      iu_wise_map = state_iu_wise_map;
    }
    return {
      iu_calculated_data,
      iu_wise_map,
      crop_iu_wise_map,
      state_survey_wise_map,
      crop_survey_wise_map,
      revisit_moniter,
      labels
    };
  };


  convert(param: any) {
    let h: any = [];
    for(let k of param[0]) {
      if(param[0][k] && typeof param[0][k] != 'object') {
        h.push(k)
      }
    }
    
    return param.map((d: any) => {
      return h.map((k: any) => {
        const val = d[k];
        if (typeof val == 'string') {
          return val.split('\n').join(' ').split('\t').join(' ').trim();
        }
        return val
      })
    })
  }

  generateChartData(
    totData: any,
    state_iu_wise_map: any,
    crop_iu_wise_map: any,
    state_survey_wise_map: any,
    crop_survey_wise_map: any,
    revisit_moniter: any
  ) {
    // ("Calculating state wise iu.");
    const state_iu_data: any[] = [...state_iu_wise_map].map((d: any) => d[1]).sort((a: any, b: any) => b.sum_insured - a.sum_insured);
    // ("state wise iu calculated.");
  
    // ("Calculating crop wise iu.");
    const crop_iu_data: any[] = [...crop_iu_wise_map].map((d: any) => d[1]).sort((a: any, b: any) => b.sum_insured - a.sum_insured);
    // ("state wise iu calculated.");
  
    let very_good_sum_insured = 0,
      good_sum_insured = 0,
      average_sum_insured = 0,
      poor_sum_insured = 0,
      very_poor_sum_insured = 0;
    let very_good = 0,
      good = 0,
      average = 0,
      poor = 0,
      very_poor = 0;

    // let exposured_covered = 0;
  
    const chm_exposure = [];
    const chm_survey_sample = [];
    const location_wise_health_top_5: any = {
      cat: [],
      series: [
        {
          name: "Not Surveyed",
          data: [],
        },
        {
          name: "Very Poor",
          data: [],
        },
        {
          name: "Poor",
          data: [],
        },
        {
          name: "Average",
          data: [],
        },
        {
          name: "Good",
          data: [],
        },
        {
          name: "Very Good",
          data: [],
        },
      ],
    };
    const location_wise_health_rest: any = {
      cat: [],
      series: [
        {
          name: "Not Surveyed",
          data: [],
        },
        {
          name: "Very Poor",
          data: [],
        },
        {
          name: "Poor",
          data: [],
        },
        {
          name: "Average",
          data: [],
        },
        {
          name: "Good",
          data: [],
        },
        {
          name: "Very Good",
          data: [],
        },
      ],
    };
  
    const crop_wise_health_top_5: any = {
      cat: [],
      series: [
        {
          name: "Not Surveyed",
          data: [],
        },
        {
          name: "Very Poor",
          data: [],
        },
        {
          name: "Poor",
          data: [],
        },
        {
          name: "Average",
          data: [],
        },
        {
          name: "Good",
          data: [],
        },
        {
          name: "Very Good",
          data: [],
        },
      ],
    };
    const crop_wise_health_rest: any = {
      cat: [],
      series: [
        {
          name: "Not Surveyed",
          data: [],
        },
        {
          name: "Very Poor",
          data: [],
        },
        {
          name: "Poor",
          data: [],
        },
        {
          name: "Average",
          data: [],
        },
        {
          name: "Good",
          data: [],
        },
        {
          name: "Very Good",
          data: [],
        },
      ],
    };
  
    const resurvey_time = [
      ["Delay", revisit_moniter.delay],
      ["Missed", revisit_moniter.missed],
      ["On time", revisit_moniter.on_time],
    ];
  
    const change_in_crop_health = [
      {name: "No change", y: revisit_moniter.no_change_exposure, custome: { value: this.abbreviateNumber(revisit_moniter.no_change_exposure) }},
      {name: "Improving Trend", y: revisit_moniter.improving_trend_exposure, custome: { value: this.abbreviateNumber(revisit_moniter.improving_trend_exposure) }},
      {name: "Deteriorating Trend", y: revisit_moniter.deteriorating_trend_exposure, custome: { value: this.abbreviateNumber(revisit_moniter.deteriorating_trend_exposure) }},
      // {name: "No Revisit", y: revisit_moniter.missed, custome: { value: this.abbreviateNumber(revisit_moniter.missed) }},
      // ["No change", revisit_moniter.no_change],
      // ["Improving Trend", revisit_moniter.improving],
      // ["Deteriorating Trend", revisit_moniter.deteriorating],
      // ["No Revisit", revisit_moniter.missed],
    ];
  
    for (let i = 0; i < state_iu_data.length; i++) {
      const state = state_iu_data[i];
      very_good_sum_insured += state.very_good_sum_insured;
      good_sum_insured += state.good_sum_insured;
      average_sum_insured += state.average_sum_insured;
      poor_sum_insured += state.poor_sum_insured;
      very_poor_sum_insured += state.very_poor_sum_insured;
  
      very_good += state.very_good;
      good += state.good;
      average += state.average;
      poor += state.poor;
      very_poor += state.very_poor;
      let actualP = state.planned_sum_insured
        ? this.divide(state.exposure_covred, state.planned_sum_insured) * 100
        : 0;
      actualP = actualP > 100 ? 100 : actualP;
      chm_exposure.push({
        name: state.name,
        y: actualP,
        custome: {
          name: state.name,
          planned: this.abbreviateNumber(state.planned_sum_insured),
          tot: this.abbreviateNumber(state.exposure_covred),
          actualP,
        },
      });
      const sampleActualP = this.divide(state.no_of_survey, state.no_of_CHMs_planned) * 100;
      chm_survey_sample.push({
        name: state.name,
        y: sampleActualP,
        custome: {
          totUpload: state.no_of_survey,
          actualP: sampleActualP,
          planned: state.no_of_CHMs_planned,
        },
      });
  
      if (i < 5) {
        location_wise_health_top_5.cat.push(state.name);
        location_wise_health_top_5.series[0].data.push(state.no_loss_sum_insured);
        location_wise_health_top_5.series[1].data.push(
          state.very_poor_sum_insured
        );
        location_wise_health_top_5.series[2].data.push(state.poor_sum_insured);
        location_wise_health_top_5.series[3].data.push(state.average_sum_insured);
        location_wise_health_top_5.series[4].data.push(state.good_sum_insured);
        location_wise_health_top_5.series[5].data.push(
          state.very_good_sum_insured
        );
      } else {
        if (i == 5) {
          location_wise_health_top_5.cat.push("Others");
          location_wise_health_top_5.series[0].data.push(
            state.no_loss_sum_insured
          );
          location_wise_health_top_5.series[1].data.push(
            state.very_poor_sum_insured
          );
          location_wise_health_top_5.series[2].data.push(state.poor_sum_insured);
          location_wise_health_top_5.series[3].data.push(
            state.average_sum_insured
          );
          location_wise_health_top_5.series[4].data.push(state.good_sum_insured);
          location_wise_health_top_5.series[5].data.push(
            state.very_good_sum_insured
          );
        } else {
          location_wise_health_top_5.series[0].data[5] +=
            state.no_loss_sum_insured;
          location_wise_health_top_5.series[1].data[5] +=
            state.very_poor_sum_insured;
          location_wise_health_top_5.series[2].data[5] += state.poor_sum_insured;
          location_wise_health_top_5.series[3].data[5] +=
            state.average_sum_insured;
          location_wise_health_top_5.series[4].data[5] += state.good_sum_insured;
          location_wise_health_top_5.series[5].data[5] +=
            state.very_good_sum_insured;
        }
        location_wise_health_rest.cat.push(state.name);
        location_wise_health_rest.series[0].data.push(state.no_loss_sum_insured);
        location_wise_health_rest.series[1].data.push(
          state.very_poor_sum_insured
        );
        location_wise_health_rest.series[2].data.push(state.poor_sum_insured);
        location_wise_health_rest.series[3].data.push(state.average_sum_insured);
        location_wise_health_rest.series[4].data.push(state.good_sum_insured);
        location_wise_health_rest.series[5].data.push(
          state.very_good_sum_insured
        );
      }
    }
  
    for (let i = 0; i < crop_iu_data.length; i++) {
      const crop = crop_iu_data[i];
      if (i < 5) {
        crop_wise_health_top_5.cat.push(crop.name);
        crop_wise_health_top_5.series[0].data.push(crop.no_loss_sum_insured);
        crop_wise_health_top_5.series[1].data.push(crop.very_poor_sum_insured);
        crop_wise_health_top_5.series[2].data.push(crop.poor_sum_insured);
        crop_wise_health_top_5.series[3].data.push(crop.average_sum_insured);
        crop_wise_health_top_5.series[4].data.push(crop.good_sum_insured);
        crop_wise_health_top_5.series[5].data.push(crop.very_good_sum_insured);
      } else {
        if (i == 5) {
          crop_wise_health_top_5.cat.push("Others");
          crop_wise_health_top_5.series[0].data.push(crop.no_loss_sum_insured);
          crop_wise_health_top_5.series[1].data.push(crop.very_poor_sum_insured);
          crop_wise_health_top_5.series[2].data.push(crop.poor_sum_insured);
          crop_wise_health_top_5.series[3].data.push(crop.average_sum_insured);
          crop_wise_health_top_5.series[4].data.push(crop.good_sum_insured);
          crop_wise_health_top_5.series[5].data.push(crop.very_good_sum_insured);
        } else {
          crop_wise_health_top_5.series[0].data[5] += crop.no_loss_sum_insured;
          crop_wise_health_top_5.series[1].data[5] += crop.very_poor_sum_insured;
          crop_wise_health_top_5.series[2].data[5] += crop.poor_sum_insured;
          crop_wise_health_top_5.series[3].data[5] += crop.average_sum_insured;
          crop_wise_health_top_5.series[4].data[5] += crop.good_sum_insured;
          crop_wise_health_top_5.series[5].data[5] += crop.very_good_sum_insured;
        }
        crop_wise_health_rest.cat.push(crop.name);
        crop_wise_health_rest.series[0].data.push(crop.no_loss_sum_insured);
        crop_wise_health_rest.series[1].data.push(crop.very_poor_sum_insured);
        crop_wise_health_rest.series[2].data.push(crop.poor_sum_insured);
        crop_wise_health_rest.series[3].data.push(crop.average_sum_insured);
        crop_wise_health_rest.series[4].data.push(crop.good_sum_insured);
        crop_wise_health_rest.series[5].data.push(crop.very_good_sum_insured);
      }
    }
  
    const crop_health_exposure_wise = [
      {
        name: "Very Good",
        y: very_good_sum_insured,
        custome: {
          exposure: very_good_sum_insured,
          expCr: this.abbreviateNumber(very_good_sum_insured),
        },
      },
      {
        name: "Good",
        y: good_sum_insured,
        custome: {
          exposure: good_sum_insured,
          expCr: this.abbreviateNumber(good_sum_insured),
        },
      },
      {
        name: "Average",
        y: average_sum_insured,
        custome: {
          exposure: average_sum_insured,
          expCr: this.abbreviateNumber(average_sum_insured),
        },
      },
      {
        name: "Poor",
        y: poor_sum_insured,
        custome: {
          exposure: poor_sum_insured,
          expCr: this.abbreviateNumber(poor_sum_insured),
        },
      },
      {
        name: "Very Poor",
        y: very_poor_sum_insured,
        custome: {
          exposure: very_poor_sum_insured,
          expCr: this.abbreviateNumber(very_poor_sum_insured),
        },
      },
    ];
  
    const crop_health_exposure_survey = [
      ["Very Good", very_good],
      ["Good", good],
      ["Average", average],
      ["Poor", poor],
      ["Very Poor", very_poor],
    ];
  
    return {
      chm_exposure,
      chm_survey_sample,
      crop_health_exposure_wise,
      crop_health_exposure_survey,
      location_wise_health_top_5,
      location_wise_health_rest,
      crop_wise_health_top_5,
      crop_wise_health_rest,
      resurvey_time,
      change_in_crop_health,
    };
  };

  generateCharts() {
   const {
      iu_calculated_data,
      iu_wise_map,
      crop_iu_wise_map,
      state_survey_wise_map,
      crop_survey_wise_map,
      revisit_moniter,
      labels
    } = this.generateIUCalculation(this.allData, this.surveyData);
    const chartData = this.generateChartData(
      iu_calculated_data,
      iu_wise_map,
      crop_iu_wise_map,
      state_survey_wise_map,
      crop_survey_wise_map,
      revisit_moniter,
    );
    this.labels = labels;
    this.generateExposure_covered_percentage(chartData.chm_exposure)
    this.generateCaptured_no_of_samples(chartData.chm_survey_sample)
    this.generatepoor_good_moderate(chartData.crop_health_exposure_wise)
    this.generatepoor_good_moderate_overall(chartData.crop_health_exposure_survey)
    this.generatebar_one(chartData.location_wise_health_top_5, chartData.location_wise_health_rest)
    this.generatebar_two(chartData.crop_wise_health_top_5, chartData.crop_wise_health_rest)
    this.generateResurvey_time(chartData.resurvey_time)
    this.generateChange_in_crop_health(chartData.change_in_crop_health)
    // this.generateExposure_covered_percentage(locHealthData);
    // this.generateCaptured_no_of_samples(locHealthData);
    // this.generatepoor_good_moderate(locHealthData);
    // this.generatepoor_good_moderate_overall(locHealthData);
    // this.generatebar_one(locHealthData,{});
    // this.generatebar_two(locHealthData,{});
    // this.generateRainfall_irrigated();
    // this.generateResurvey_time(locHealthData);
    // this.generateChange_in_crop_health(locHealthData);
  }

  /**
   * Metod to convert json to excel data
   * @param data 
   * @returns 
   */
  generateExcelText(data: any[]) {
    if (data?.length) {
      const firstRecord = data[0];
      const headers = Object.keys(firstRecord).filter(
        (k) => typeof firstRecord[k] != "object"
      );
      let textData = headers.join("\t") + "\n";
      textData += data
        .map((d) =>
          headers
            .map((k) => (d[k]?.split ? d[k].split("\n").join(" ") : d[k]))
            .join("\t")
        )
        .join("\n");
      return textData;
    }
    return "";
  }

  generateCrop_wise_health(crops: any[], series: any[]) {
    const abr = this.abbreviateNumber;
    const option = {
      chart: {
        type: "bar",
      },
      title: {
        text: "",
      },
      xAxis: {
        categories: crops,
        labels: this.chartlabels
      },
      yAxis: {
        min: 0,
        gridLineWidth: 0,
        title: {
          text: "",
        },
        labels: {
          style: this.chartStyle,
          formatter: function (env: any) {
            return (env.value / 1e7).toFixed(0) + " Cr";
          },
        },
      },
      legend: {
        reversed: true,
      },
      colors: [
        "#7a7777", // grey
        "#e60000", // red
        "#FF9655", // orange
        "#FFF263", // yellow
        "#56e393", // light green
        "#1cc40a", // green
        "#e8612c", // light red
        "#6AF9C4", // cyan
      ],
      plotOptions: {
        series: {
          stacking: "normal",
          dataLabels: {
            enabled: true,
            format: "{point.custome.sum}",
          },
        },
      },
      tooltip: {
        formatter: function(): any | void {
          const t : any = this;
          const point: any = t.point;
          return `<span style="font-size:11px">${point.category}</span><br> <b>${point.percentage.toFixed(0)}%</b> of total<br/>
          <span >Total Exposure</span>: <b>${abr(point.y)}</b> of total<br/>`
        },
      },
      series,
    };
    this.Crop_wise_health = new Chart(Object.assign(option));
  }

  generateLocationWiseHealth(categories: any, series: any) {
    const abr = this.abbreviateNumber;
    const option = {
      chart: {
        type: "bar",
      },
      title: {
        text: "",
      },
      xAxis: {
        categories,
        labels: this.chartlabels
      },
      yAxis: {
        min: 0,
        title: {
          text: "",
        },
        labels: {
          style: this.chartStyle,
          formatter: function (env: any) {
            return (env.value / 1e7).toFixed(0) + " Cr";
          },
        },
        gridLineWidth: 0,
      },
      legend: {
        reversed: true,
      },
      colors: [
        "#7a7777", // grey
        "#e60000", // red
        "#FF9655", // orange
        "#FFF263", // yellow
        "#56e393", // light green
        "#1cc40a", // green
        "#e8612c", // light red
        "#6AF9C4", // cyan
      ],
      plotOptions: {
        series: {
          stacking: "normal",
          dataLabels: {
            enabled: true,
            format: "{point.custome.expo}",
          },
        },
      },
      tooltip: {
        formatter: function(): any | void {
          const t : any = this;
          const point: any = t.point;
          return `<span style="font-size:11px">${point.category}</span><br> <b>${point.percentage.toFixed(0)}%</b> of total<br/>
          <span >Total Exposure</span>: <b>${abr(point.y)}</b> of total<br/>`
        },
      },
      series,
    };
    this.location_wise_health = new Chart(Object.assign(option));
  }

  generateExposure_covered_percentage(totData: any) {
    const option = {
      chart: {
        type: "pie",
        renderTo: "container",
        plotBackgroundColor: null,
        plotBorderWidth: null,
        plotShadow: false,
      },
      title: {
        verticalAlign: "middle",
        floating: true,
        text: "",
      },
      plotOptions: {
        pie: {
          innerSize: "75%",
        },
        series: {
          dataLabels: {
            enabled: true,
            format: "{point.name}: {point.custome.actualP:.0f}%",
          },
        },
      },
      tooltip: {
        headerFormat: "",
        pointFormat: `
          <span style="font-size:11px">{point.custome.name}</span><br>
          <span >Exposure Planned {point.custome.planned:.0f}<br/>
          <span >Exposure Achieved</span>: <b>{point.custome.tot} ({point.custome.actualP:.0f}%) </b><br/>
          `,
      },
      colors: [
        "#1cc40a",
        "#6AF9C4",
        "#FFF263",
        "#FF9655",
        "#175788",
        "#C15BB3",
        "#c46a0a",
        "#e60000",
        "#7a7777",
      ],
      series: [
        {
          name: " ",
          data: [...totData],
        },
      ],
    };

    this.Exposure_covered_percentage = new Chart(Object.assign(option));
  }

  generateCaptured_no_of_samples(totData: any) {
    const option = {
      chart: {
        type: "pie",
        renderTo: "container",
        plotBackgroundColor: null,
        plotBorderWidth: null,
        plotShadow: false,
      },
      title: {
        verticalAlign: "middle",
        floating: true,
        text: "",
      },
      plotOptions: {
        pie: {
          innerSize: "75%",
        },
        series: {
          dataLabels: {
            enabled: true,
            format: "{point.name}: {point.custome.actualP:.0f}%",
          },
        },
      },
      tooltip: {
        headerFormat: "",
        pointFormat: `<span >Samples Planned : </span>: <b>{point.custome.planned:.0f}</b><br/>
          <span >Samples Surveyed</span>: <b>{point.custome.totUpload} ({point.custome.actualP:.0f}%)</b> <br/>`,
      },
      colors: [
        "#1cc40a",
        "#6AF9C4",
        "#FFF263",
        "#FF9655",
        "#175788",
        "#C15BB3",
        "#c46a0a",
        "#e60000",
        "#7a7777",
      ],
      series: [
        {
          name: " ",
          data: [...totData],
        },
      ],
    };

    this.Captured_no_of_samples = new Chart(Object.assign(option));
  }

  generatepoor_good_moderate(locHealthData: any) {
    
    const option = {
      chart: {
        type: "pie",
        renderTo: "container",
        plotBackgroundColor: null,
        plotBorderWidth: null,
        plotShadow: false,
      },
      title: {
        verticalAlign: "middle",
        floating: true,
        text: "",
      },
      plotOptions: {
        pie: {
          innerSize: "75%",
          showInLegend: true,
        },
        series: {
          dataLabels: {
            enabled: true,
            // distance: -100,
            format: "{point.name}: {point.percentage:.0f}%",
          },
        },
      },
      tooltip: {
        headerFormat: '<span style="font-size:11px">{series.name}</span><br>',
        pointFormat:
          "<span >{point.name}</span>: <b>{point.custome.expCr}</b><br/>",
      },
      colors: [
        "#1cc40a", // green
        "#56e393", // light green
        "#FFF263", // yellow
        "#FF9655", // orange
        "#e60000", // red
        "#e8612c", // light red
        "#7a7777", // grey
        "#6AF9C4", // cyan
      ],
      series: [
        {
          name: " ",
          data: [...locHealthData],
        },
      ],
    };

    this.poor_good_moderate = new Chart(Object.assign(option));
  }

  generatepoor_good_moderate_overall(totData: any) {
    const option = {
      chart: {
        type: "pie",
        renderTo: "container",
        plotBackgroundColor: null,
        plotBorderWidth: null,
        plotShadow: false,
      },
      title: {
        verticalAlign: "middle",
        floating: true,
        text: "",
      },
      plotOptions: {
        pie: {
          innerSize: "75%",
          showInLegend: true,
        },
        series: {
          dataLabels: {
            enabled: true,
            // distance: -100,
            format: "{point.name}: {point.percentage:.0f}%",
          },
        },
      },
      tooltip: {
        headerFormat: '<span style="font-size:11px">{series.name}</span><br>',
        pointFormat:
          "<span >{point.name}</span>: <b>{point.y:.0f}</b> of total<br/>",
      },
      colors: [
        "#1cc40a", // green
        "#56e393", // light green
        "#FFF263", // yellow
        "#FF9655", // orange
        "#e60000", // red
        "#e8612c", // light red
        "#7a7777", // grey
        "#6AF9C4", // cyan
      ],
      series: [
        {
          name: " ",
          data: totData,
        },
      ],
    };
    this.poor_good_moderate_all = new Chart(Object.assign(option));
  }

  generatebar_one(locHealthData: any, restHealthData: any) {
    const chartColumnClick = (event: any) => {
      if (event?.point?.category == "Others") {
        this.modalService.open(this.modelLocation, { size: "xl" });
        setTimeout(() => {
          this.generateLocationWiseHealth(restHealthData.cat, restHealthData.series);
        }, 500);
      }
    };
    const abr = this.abbreviateNumber;
    const option = {
      chart: {
        type: "bar",
      },
      title: {
        text: "",
      },
      xAxis: {
        categories: locHealthData.cat,
        labels: this.chartlabels
      },
      yAxis: {
        min: 0,
        title: {
          text: "",
        },
        labels: {
          style: this.chartStyle,
          formatter: function (env: any) {
            return (env.value / 1e7).toFixed(0) + " Cr";
          },
        },
        gridLineWidth: 0,
      },
      legend: {
        reversed: true,
      },
      colors: [
        "#7a7777", // grey
        "#e60000", // red
        "#FF9655", // orange
        "#FFF263", // yellow
        "#56e393", // light green
        "#1cc40a", // green
        "#e8612c", // light red
        "#6AF9C4", // cyan
      ],
      plotOptions: {
        series: {
          stacking: "normal",
          dataLabels: {
            enabled: true,
            formatter: function() {
              const t : any = this;
              const point: any = t.point;
              return abr(point.y)
            },
          },
          events: {
            click: function (event: any) {
              chartColumnClick(event);
            },
          },
        },
      },
      tooltip: {
        formatter: function(): any | void {
          const t : any = this;
          const point: any = t.point;
          return `<span style="font-size:11px">${point.category}</span><br> <b>${point.percentage.toFixed(0)}%</b> of total<br/>
          <span >Total Exposure</span>: <b>${abr(point.y)}</b> of total<br/>`
        },
      },
      series: locHealthData.series,
    };
    this.bar_one = new Chart(Object.assign(option));
  }

  generatebar_two(locHealthData: any, restHealthData: any) {
    const chartColumnClick = (event: any) => {
      if (event?.point?.category == "Others") {
        this.modalService.open(this.modelContent, { size: "xl" });
        setTimeout(() => {
          this.generateCrop_wise_health(restHealthData.cat, restHealthData.series);
        }, 500);
      }
    };
    const abr = this.abbreviateNumber;
    const option = {
      chart: {
        type: "bar",
      },
      title: {
        text: "",
      },
      xAxis: {
        categories: locHealthData.cat,
        labels: this.chartlabels
      },
      yAxis: {
        min: 0,
        gridLineWidth: 0,
        title: {
          text: "",
        },
        labels: {
          style: this.chartStyle,
          formatter: function (env: any) {
            return (env.value / 1e7).toFixed(0) + " Cr";
          },
        },
      },
      legend: {
        reversed: true,
      },
      colors: [
        "#7a7777", // grey
        "#e60000", // red
        "#FF9655", // orange
        "#FFF263", // yellow
        "#56e393", // light green
        "#1cc40a", // green
        "#e8612c", // light red
        "#6AF9C4", // cyan
      ],
      plotOptions: {
        series: {
          stacking: "normal",
          dataLabels: {
            enabled: true,
            formatter: function() {
              const t : any = this;
              const point: any = t.point;
              return abr(point.y)
            },
          },
          events: {
            click: function (event: any) {
              chartColumnClick(event);
            },
          },
        },
      },
      tooltip: {
        formatter: function(): any | void {
          const t : any = this;
          const point: any = t.point;
          return `<span style="font-size:11px">${point.category}</span><br> <b>${point.percentage.toFixed(0)}%</b> of total<br/>
          <span >Total Exposure</span>: <b>${abr(point.y)}</b> of total<br/>`
        },
        // pointFormatter:  ,
      },
      series: locHealthData.series,
    };
    this.bar_two = new Chart(Object.assign(option));
  }

  generateRainfall_irrigated() {
    const option = {
      chart: {
        type: "pie",
        renderTo: "container",
        plotBackgroundColor: null,
        plotBorderWidth: null,
        plotShadow: false,
      },
      title: {
        verticalAlign: "middle",
        floating: true,
        text: "",
      },
      plotOptions: {
        pie: {
          innerSize: "75%",
        },
        series: {
          dataLabels: {
            enabled: true,
            format: "{point.name}: {point.percentage:.0f}%",
          },
        },
      },
      tooltip: {
        headerFormat: '<span style="font-size:11px">{series.name}</span><br>',
        pointFormat:
          "<span >{point.name}</span>: <b>{point.y:.0f} ({point.percentage:.0f})%</b> of total<br/>",
      },
      colors: [
        "#FF9655", // orange
        "#6AF9C4", // cyan
      ],
      series: [
        {
          name: " ",
          data: [
            [
              "Rainfall",
              this.surveyData.filter((d) => d.field_516 == "Rainfed").length,
            ],
            [
              "Irrigated",
              this.surveyData.filter((d) => d.field_516 == "Irrigated").length,
            ],
          ],
        },
      ],
    };

    this.Rainfall_irrigated = new Chart(Object.assign(option));
  }

  generateResurvey_time(totData: any) {
    const option = {
      chart: {
        type: "pie",
        renderTo: "container",
        plotBackgroundColor: null,
        plotBorderWidth: null,
        plotShadow: false,
      },
      title: {
        verticalAlign: "middle",
        floating: true,
        text: "",
      },
      plotOptions: {
        pie: {
          innerSize: "75%",
        },
        series: {
          dataLabels: {
            enabled: true,
            format: "{point.name}: {point.percentage:.0f}%",
          },
        },
      },
      tooltip: {
        headerFormat: '<span style="font-size:11px">{series.name}</span><br>',
        pointFormat:
          "<span >{point.name}</span>: <b>{point.y}</b> of total<br/>",
      },
      legend: {
        reversed: true,
      },
      colors: [
        "#FF9655", // orange
        "#e60000", // red
        "#1cc40a", // green
        "#7a7777", // grey
      ],
      series: [
        {
          name: " ",
          data: totData,
        },
      ],
    };

    this.Resurvey_time = new Chart(Object.assign(option));
  }

  generateChange_in_crop_health(totData: any) {
    const option = {
      chart: {
        type: "pie",
        renderTo: "container",
        plotBackgroundColor: null,
        plotBorderWidth: null,
        plotShadow: false,
      },
      title: {
        verticalAlign: "middle",
        floating: true,
        text: "",
      },
      plotOptions: {
        pie: {
          innerSize: "75%",
        },
        series: {
          dataLabels: {
            enabled: true,
            format: "{point.name}: {point.percentage:.0f} %",
          },
        },
      },
      tooltip: {
        headerFormat: '<span style="font-size:11px">{series.name}</span><br>',
        pointFormat: "<span >{point.name}</span>: <b>{point.custome.value:.0f}</b><br/>",
      },
      colors: [
        "#175788", // navy blue
        "#1cc40a", // green
        "#e60000", // red
        "#7a7777", // grey
      ],
      series: [
        {
          name: " ",
          data: totData,
        },
      ],
    };

    this.Change_in_crop_health = new Chart(Object.assign(option));
  }

  /**
   * Method to convert number to english text as per Indian standard
   * @param number 
   * @returns 
   */
  abbreviateNumber(number: any): any | void {
    const numberFormatter = new Intl.NumberFormat("en-IN", {
      maximumFractionDigits: 1,
    });
    if (!number) {
      return "";
    } else {
      number = Math.ceil(number);
    }
    const numberCleaned = Math.round(Math.abs(number));
    if (numberCleaned < 1e3) return numberFormatter.format(Math.floor(number));
    else if (numberCleaned >= 1e3 && numberCleaned < 1e5)
      return numberFormatter.format(number / 1e3) + " K";
    else if (numberCleaned >= 1e5 && numberCleaned < 1e7)
      return numberFormatter.format(number / 1e5) + " L";
    else return numberFormatter.format(number / 1e7) + " Cr";
  }

  refreshDetail() {
    if (this.mapDetail) {
      this.mapDetail.refreshMap();
    }
  }

  /**
   * Method to load T-1 data
   * @returns 
   */
  getLoaedFileData() {
    if (![1, 2, 3, 4].includes(+this.user.user_role)) {
      return;
    }
    const request = {
      purpose: "dashboard_1",
      survey_id: 1,
      "client_id": this.projectContext === 'munichre' ? this.user.unit_id : '2000',
    };
    // const fileName = this.user.unit_id
    //   ? `${this.user.unit_id}_chm_chart_data`
    //   : "chm_chart_data";
    this.loading++;
    this.core
      .post(request)
    // this.core
    //   .getLocalDataFile(fileName)
      .then((response: any) => {
        if (response) {
          const  data = response.data.find((d: any) => d.client_id == request.client_id)?.data;
          const chartData: any = data ? JSON.parse(data) : {};
          // const chartData = response;
          this.locationlbl = "State";
          this.labels = chartData.labels
          this.generateExposure_covered_percentage(chartData.chm_exposure)
          this.generateCaptured_no_of_samples(chartData.chm_survey_sample)
          this.generatepoor_good_moderate(chartData.crop_health_exposure_wise)
          this.generatepoor_good_moderate_overall(chartData.crop_health_exposure_survey)
          this.generatebar_one(chartData.location_wise_health_top_5, chartData.location_wise_health_rest)
          this.generatebar_two(chartData.crop_wise_health_top_5, chartData.crop_wise_health_rest)
          this.generateResurvey_time(chartData.resurvey_time)
          this.generateChange_in_crop_health(chartData.change_in_crop_health)
          if (chartData.timestamp) {
            this.timestamp = moment(chartData.timestamp).format('DD/MM/YYYY');
          }
          this.isFileData = true;
        }
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => this.loading--);
  }

  /**
   * Method to divide two number and handle "divide by zero" error
   * @param numerator 
   * @param denominator 
   * @returns 
   */
  divide = (numerator: number, denominator: number) =>
    denominator == 0 ? 0 : numerator / denominator;

  /**
   * Method to clear data
   */
  clearDetail() {
    this.iuServeyMap = new Map();
    this.revist_survey_map = new Map();
    this.surveyData = [];
    this.allData = [];
    this.revisitData = [];
    this.surveyLocation = [];
    if (this.mapDetail) {
      this.mapDetail.clearDetail();
    }
  }

  /**
   * Method to assign default location to state, cluster and district admin
   */
  setDefaultLocation() {
    if (['7'].includes(this.user?.user_role)) {
      this.selectedAgency = [this.user.agency_id || '0'];
    }
    // const location = this.userDetails.getLocation();
    // if (location?.states) {
    //   this.selectedState = this.states;
    //   this.onStateChange(this.selectedState);
    //   if (location?.districts) {
    //     this.selectedDistrict = this.districts;
    //     this.onDistrictChange(this.selectedDistrict);
    //   }
    // }
  }

  get deactiveField() {
    return this.singleYear && this.singleseason && this.selectedAgency?.length;
  }
}
