import { Component, OnInit, ViewChild } from "@angular/core";
import { MultiSelectModule } from "primeng/multiselect";
import { Chart } from "angular-highcharts";
import * as Highcharts from "highcharts";
import * as moment from "moment";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { CoreService } from "../utilities/core.service";
import { FilterService } from "../utilities/filter.service";
import { UserDetailService } from "../auth/user-detail.service";
import { FeatureToggleService } from "../shared/services/feature-toggle.service";
import { environment, ProjectContext } from "../../environments/environment";

@Component({
  selector: "app-cls-dashboard",
  templateUrl: "./cls-dashboard.component.html",
  styleUrls: ["./cls-dashboard.component.css"],
})
export class ClsDashboardComponent implements OnInit {
  @ViewChild("mapDetail") mapDetail: any;
  @ViewChild("content") modelContent: any;

  loading = 0;
  isFileData = false;
  croploading = 0;
  locationloading = 0;
  active = 1;
  cities: any;
  selectedCities: any;

  states: any[] = [];
  districts: any[] = [];
  blocks: any[] = [];
  crops: any[] = [];
  tehsils: any[] = [];

  stateMap: Map<any, any> = new Map<any, any>();
  districtMap: Map<any, any> = new Map<any, any>();
  tehsilMap: Map<any, any> = new Map<any, any>();
  blockMap: Map<any, any> = new Map();
  grampanchayatMap: Map<any, any> = new Map();
  villageMap: Map<any, any> = new Map();
  cropsMap: Map<any, any> = new Map<any, any>();
  cropIdMap: Map<any, any> = new Map<any, any>();
  cropCodeMap: Map<any, any> = new Map<any, any>();
  notifiedUnitMap: Map<any, any> = new Map();
  agencyMap: Map<any, any> = new Map();

  selectedState: any[] = [];
  selectedDistrict: any[] = [];
  selectedBlock: any[] = [];
  selectedTehsil: any[] = [];
  selectedNotifieldUnit: any[] = [];
  selectedCrop: any[] = [];
  dataCrops: any[] = [];
  selectedSI: any = "";
  selectedDate: any = {
    startDate: moment().subtract(29, "days"),
    endDate: moment(),
  };
  selectedYear: any[] = [];
  selectedseason: any[] = [];

  districtOptions: any[] = [];
  blockOptions: any[] = [];
  tehsilOptions: any[] = [];
  yearOptions: any[] = [];
  seasonOptions: any[] = [];

  sIOptions: any[] = [];

  allData: any[] = [];
  surveyData: any[] = [];
  surveyLocation: any[] = [];
  fields: any[] = [];
  revisitData: any[] = [];

  crop_wise_loss_reporting: any;
  crop_wise_loss_reporting_modal: any;
  District_Block_wise_iu_wise_loss_reporting: any;
  District_Block_wise_iu_wise_loss_reporting_modal: any;
  type_of_surveys: any;
  Cause_of_Loss: any;
  Cause_of_Loss_modal: any;
  Crop_stage: any;
  Crop_wise_claim_assessment: any;
  Crop_wise_claim_assessment_modal: any;
  District_wise_Claim_Assessment: any;
  District_wise_Claim_Assessment_modal: any;
  Survey_Completion_over_time: any;
  cls_survey_execution: any;
  cls_survey_execution_modal: any;

  cls_survey_approval: any;
  cls_survey_approval_modal: any;

  cls_survey_approval_progress: any;
  cls_survey_approval_progress_modal: any;
 
  agency_survey_approval_progress: any;
  agency_survey_approval_progress_modal: any;

  minDate: any = null;
  maxDate: any = null;
  t_8Days: any = null;
  iuServeyMap: Map<any, any> = new Map();
  iuIntimationMap: Map<any, any> = new Map();

  singleYear: any = '';
  singleseason: any = '';
  singleClient: any = '';
  isFilterCollapsed = true;
  selectedAgency: any[] = [];
  agencyData: any[] = []
  isStateLoading = 0;
  agencyLoading: any = 0;
  clientTehsils: any[] = [];
  timestamp: any;

  @ViewChild("daysModal") daysModal: any;
  @ViewChild("daysApproveModal") daysApproveModal: any;
  @ViewChild("daysApproveProgressModal") daysApproveProgressModal: any;
  @ViewChild("locationSurveyProgressModal") locationSurveyProgressModal: any;
  @ViewChild("agencySurveyProgressModal") agencySurveyProgressModal: any;
  @ViewChild("cropSurveyProgressModal") cropSurveyProgressModal: any;
  @ViewChild("cropCliamAmountModal") cropCliamAmountModal: any;
  @ViewChild("locationCliamAmountModal") locationCliamAmountModal: any;
  @ViewChild("causeOfLossModal") causeOfLossModal: any;

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

  localeValue = {
    format: "DD/MM/YYYY",
    displayFormat: "DD-MM-YYYY",
    separator: " - ",
    cancelLabel: "Cancel",
    applyLabel: "Okay",
  };
  CropStageFull: any;
  notifiedUnit: any[] = [];
  cropOptions: any[] = [];
  intimationData: any[] = [];

  clientData: any[] = [];
  selectedClient: any[] = [];
  clientStates: any[] = [];
  clientDistricts: any[] = [];
  user: any;
  locationLabel: string = "";
  chartlabels: any;
  chartStyle = {color: '#333333', fontWeight: 'bold', fontSize: '12px'}
  projectContext: ProjectContext;
  assetsFolder: string; 

  constructor(
    private filter: FilterService,
    private core: CoreService,
    private userDetail: UserDetailService,
    private modalService: NgbModal,
    private featureToggle: FeatureToggleService
  ) {
    this.projectContext = this.featureToggle.getContext() as ProjectContext;
    this.assetsFolder = environment.projectConfigs[this.projectContext].assetsFolder;
    if (this.projectContext === 'saksham') {
      this.selectedClient = ['2000']
    }
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
    this.user = this.userDetail.getUserDetail();
    this.chartlabels = {style: this.chartStyle};
  }

  ngOnInit(): void {
    // this.getSeasonAndYearData();
    // this.getLocationCropData();
    this.getLoaedFileData();
    this.loading++;
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

  getLocationsData() {
    this.states = this.core.clone(this.filter.states);
    this.districts = this.core.clone(this.filter.districts);
    this.tehsils = this.core.clone(this.filter.tehsils);
    this.crops = this.core.clone(this.filter.crops);
    this.seasonOptions = this.core.clone(this.filter.seasons);
    this.yearOptions = this.core.clone(this.filter.years);
    this.notifiedUnit = this.core.clone(this.filter.notifiedUnits);
    this.clientData = this.core.clone(this.filter.clients);
    if (this.user.unit_id) {
      this.selectedClient = [this.user.unit_id];
    }

    this.setDefaultLocation();

    this.states.forEach((d) => this.stateMap.set(d.state_id, d.state_name));
    this.districts.forEach((d) =>
      this.districtMap.set(d.district_id, d.district_name)
    );
    this.tehsils.forEach((d) => this.tehsilMap.set(d.tehsil_id, d.tehsil_name));
    this.filter.crops.forEach((d) =>
      this.cropsMap.set(+d.crop_code, d.crop_name)
    );

    const agencies = this.filter.agencies;
    for (let index = 0; index < agencies.length; index++) {
      const data = agencies[index];
      this.agencyMap.set(data.agency_id, data.agency_name);
    }

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
    if (this.selectedClient.length && this.singleYear && this.singleseason) {
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

  getSeasonAndYearData() {
    const request = {
      purpose: "get_years_range_and_season",
    };
    this.loading++;
    this.core
      .post(request)
      .then((response: any) => {
        if (response?.status == 1) {
        }
      })
      .catch((err) => console.error(err))
      .finally(() => this.loading--);
  }
  onSearch() {
    this.surveyData = [];
    this.intimationData = [];
    this.allData = [];
    if (!this.selectedState?.length) {
      this.core.toast("warn", "Please select at least one state");
      return;
    }
    this.isFileData = false;
    const request: any = { purpose: "get_chm_data" };
    request.state = this.selectedState.map((d) => d.state_id);
    request.district = this.selectedDistrict.map((d) => d.district_id);
    request.tehsil = this.selectedTehsil.map((d) => d.tehsil_id);
    request.crop = this.selectedCrop?.map((d: any) => d.crop_id);
    request.seasons = this.selectedseason.map((d) => d.id);
    request.years = this.selectedYear.map((d) => d.id);
    request.notified_units = this.selectedNotifieldUnit.map(
      (d) => d.notified_id
    );
    request.client_id = this.selectedClient;

    const intimationRequest = {
      purpose: "get_cls_intimation_data",
      state: this.selectedState.map((d) => d.state_id),
      district: this.selectedDistrict.map((d) => d.district_id),
      tehsil: this.selectedTehsil.map((d) => d.tehsil_id),
      crop: this.selectedCrop?.map((d: any) => d.crop_id),
      seasons: this.selectedseason.map((d) => d.id),
      years: this.selectedYear.map((d) => d.id),
      notified_units: this.selectedNotifieldUnit.map((d) => d.notified_id),
      client_id: this.selectedClient,
    };

    const surveyDataRequest = {
      purpose: "get_all_surveydata",
      survey_id: "2",
      crop_column: "field_539",
      states: this.selectedState.map((d) => d.state_id),
      districts: this.selectedDistrict.map((d) => d.district_id),
      tehsils: this.selectedTehsil.map((d) => d.tehsil_id),
      start_date: this.selectedDate?.startDate?.format("yyyy-MM-DD"),
      end_date: this.selectedDate?.endDate?.format("yyyy-MM-DD"),
      crop_id: this.selectedCrop?.map((d: any) => d.crop_id),
      seasons: this.selectedseason.map((d) => d.id),
      years: this.selectedYear.map((d) => d.id),
      notified_units: this.selectedNotifieldUnit.map((d) => d.notified_id),
      client_id: this.selectedClient,
      user_id: [],
    };

    this.clearDetail();
    this.loading++;
    if (+this.user.user_role > 2) {
      const allStates = this.states.map((e) => e.state_id);
      const allDistrict = this.districts.map((e) => e.district_id);
      const allTehsils = this.tehsils.map((e) => e.tehsil_id);

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

      if (!intimationRequest.state?.length) {
        intimationRequest.state = allStates;
      }
      if (!intimationRequest.district?.length) {
        intimationRequest.district = allDistrict;
      }
      if (!intimationRequest.tehsil?.length) {
        intimationRequest.tehsil = allTehsils;
      }
    }
    const allPromises = [request, surveyDataRequest, intimationRequest].map(
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
          // this.kCrops = responses[0].lkp_Karnatakacrops || [];
          this.notifiedUnit = responses[0].lkp_notified_unit || [];
        }
        if (responses?.[1].status == 1) {
          const surveyData = responses[1].surveydata || [];
          const dataIds = this.core.uniqueList(surveyData, "data_id");
          for (let j = 0; j < surveyData.length; j++) {
            const data = surveyData[j];
            if (data.status == 2) {
              continue;
            }
            data.datetime = new Date(data.datetime).setHours(0, 0, 0, 0);
            const currentDate = data.datetime;
            if (!this.minDate) {
              this.minDate = currentDate;
            }
            if (!this.maxDate) {
              this.maxDate = currentDate;
            }
            if (this.minDate && this.minDate > currentDate) {
              this.minDate = currentDate;
            }
            if (this.maxDate && this.maxDate < currentDate) {
              this.maxDate = currentDate;
            }

            const notified_unit = data.field_532;
            const crop = +data.field_539;
            const state_id = data.field_528;
            const dist_id = data.field_529;
            const year = data.field_953;
            const season = data.field_526;
            let gp_notified_area = "";
            if (notified_unit == 1) {
              gp_notified_area = data.field_533;
            } else if (notified_unit == 2) {
              gp_notified_area = data.field_531;
            } else if (notified_unit == 3) {
              gp_notified_area = data.field_530;
            } else if (notified_unit == 4) {
              gp_notified_area = data.field_534;
            } else if (notified_unit == 5) {
              gp_notified_area = data.field_529;
            }
            const obj: any = {
              client_id: data.client_id,
              agency_id: data.agency_id,
              approved_reject: data.approved_reject,
              approved_reject_date: data.approved_reject_date,
              datetime: data.datetime,
              id: data.id,
              field_539: data.field_539,
              field_532: data.field_532,
              field_528: data.field_528,
              field_529: data.field_529,
              field_953: data.field_953,
              field_526: data.field_526,
              field_533: data.field_533,
              field_531: data.field_531,
              field_530: data.field_530,
              field_534: data.field_534,
              field_779: data.field_779,
              field_550: data.field_550,
              field_548: data.field_548,
              field_546: data.field_546,
              field_547: data.field_547,
              field_525: data.field_525,
              field_553: data.field_553,
              field_554: data.field_554,
              field_527: data.field_527,
              field_524: data.field_524,
              field_540: data.field_540,
              status: data.status,
            };
            const key = `${gp_notified_area}=>${notified_unit}=>${crop}=>${state_id}=>${dist_id}=>${year}=>${season}`;
            obj.iu = key;
            if (this.iuServeyMap.get(key)) {
              this.iuServeyMap.get(key).push(obj);
            } else {
              this.iuServeyMap.set(key, [obj]);
            }
            this.surveyData.push(obj);
          }
          this.surveyLocation = (responses[1].locationdata || []).filter(
            (d: any) => dataIds.includes(d.data_id)
          );
          // this.mapDetail.refreshMap();
          if (this.surveyData?.length) {
            this.minDate = new Date(this.minDate).setHours(0, 0, 0, 0);
            this.maxDate = new Date(this.maxDate).setHours(23, 59, 59, 999);
            this.t_8Days =
              new Date(this.maxDate).getTime() - 24 * 60 * 60 * 1000 * 7;
          }
          this.refreshDetail();
        }
        if (responses?.[2].status == 1) {
          this.intimationData = responses[2].intimation_data || [];
          for (let i = 0; i < this.intimationData.length; i++) {
              const data = this.intimationData[i];
              const notified_unit = data.iu_level;
              const crop = +data.crop;
              const state_id = data.state;
              const dist_id = data.district;
              const year = data.int_year;
              const season = data.season;
              let gp_notified_area = "";
              if (notified_unit == 1) {
                gp_notified_area = data.grampanchayat;
              } else if (notified_unit == 2) {
                gp_notified_area = data.ri_circle;
              } else if (notified_unit == 3) {
                gp_notified_area = data.block;
              } else if (notified_unit == 4) {
                gp_notified_area = data.village;
              } else if (notified_unit == 5) {
                gp_notified_area = data.district;
              }

              const key = `${gp_notified_area}=>${notified_unit}=>${crop}=>${state_id}=>${dist_id}=>${year}=>${season}`;
              data.iu = key;
            if (this.iuIntimationMap.get(key)) {
              this.iuIntimationMap.get(key).push(data);
            } else {
              this.iuIntimationMap.set(key, [data]);
            }
          }
        }
        // this.setLabels()
        this.generateCharts();
      })
      .catch((err) => console.error(err))
      .finally(() => this.loading--);
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

  generateIUCalculation(plan_data: any, survey_data: any) {
    const all_ius: any[] = [];
    const iu_calculated_data = [];
    const state_iu_wise_map = new Map();
    const district_iu_wise_map = new Map();
    const tehsil_iu_wise_map = new Map();
    const all_iu_wise_map = new Map();
    const crop_iu_wise_map = new Map();
    const state_survey_wise_map = new Map();
    const agency_survey_wise_map = new Map();
    const district_survey_wise_map = new Map();
    const tehsil_survey_wise_map = new Map();
    const crop_survey_wise_map = new Map();
    if (plan_data?.length && survey_data?.length) {
      for (let pin = 0; pin < plan_data.length; pin++) {
        const ele = plan_data[pin];
        const key = `${ele.gp_notified_area}=>${ele.notified_unit}=>${ele.crop}=>${ele.state_id}=>${ele.dist_id}=>${ele.year}=>${ele.season}`;
        if (!all_ius.includes(key)) {
          all_ius.push(key);
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
          result.intimationData = this.iuIntimationMap.get(key) || [];
          result.state_id = result.data.state_id;
          result.dist_id = result.data.dist_id;
          result.tehsil_id = result.data.tehsil_id;
          result.gp_notified_area = result.data.gp_notified_area;
          result.notified_unit = result.data.notified_unit;
          result.crop = result.data.crop;
          iu_name += ' - ' + this.cropsMap.get(+result.crop);
          result.threshold_yield = +result.data.threshold_yield || 0;
          result.draige_factor = +result.data.draige_factor || 0;
          result.gross_premium = +result.data.gross_premium || 0;
          result.sum_insured = +result.data.sum_insured || 0;
          result.scale_of_finance = +result.data.scale_of_finance || 0;
          result.season = result.data.season;
          result.year = result.data.year;
          result.date_of_sowing = result.data.date_of_sowing;
          result.date_of_loss = result.data.date_of_loss;
          result.no_of_survey = result.survey_data.length;
          result.survey_date = null;
          result.approved_date = null;
          if (result.no_of_survey) {
            const surveyDates: any = [], approve_date: any = [];
            result.survey_data.forEach((d: any) => {
              surveyDates.push(d.datetime);
              if (d.approved_reject_date){
                approve_date.push(new Date(d.approved_reject_date).setHours(0,0,0,0));
              }
            });
            result.survey_date = Math.min(
              ...surveyDates
            );
            if (approve_date?.length) {
              result.approved_date = Math.min(
                ...approve_date
              );
            }
          }

          result.dos_15 = result.data["DOS-15"];
          result.dos_30 = result.data["DOS-30"];
          result.dos_45 = result.data["DOS-45"];
          result.dos_60 = result.data["DOS-60"];
          result.dos_75 = result.data["DOS-75"];
          result.dos_90 = result.data["DOS-90"];
          result.gtr_90 = result.data["DOS-GR-90"];

          result.total_land_area = 0;
          result.insured_area = 0;
          result.damaged_area = 0;
          result.loss_percentage = 0;
          result.input_cost = 0;
          result.sample_damaged_area = 0;
          result.sample_loss_percentage = 0;
          result.sample_avg_loss_percentage = 0;
          result.sample_avg_damaged_area = 0;
          result.claim_amount = 0;
          result.sample_claim_amount = 0;
          result.individual_claim_amount = 0;
          result.draft = 0;
          result.approved = 0;
          result.rejected = 0;
          result.pending = 0;
          result.not_surveyed = 0;

          const sampleIntimationIds = result.intimationData
            .map((d: any) => d.intimation_id);
          const surveyIntimationIds = result.survey_data.filter((d: any) => sampleIntimationIds.includes(d))
            .map((d: any) => d.field_779);
          result.not_surveyed = sampleIntimationIds.map((d: any) => surveyIntimationIds.includes(d) ? 0 : 1).reduce((x: any,y: any) => x+y,0);

          const conductedSampleSurvey = [];
          const conductedindividualSurvey = [];

          for (let indx = 0; indx < result.survey_data?.length; indx++) {
            const survey = result.survey_data[indx];
            if (
              sampleIntimationIds.includes(result.survey_data[indx].field_779)
            ) {
              conductedSampleSurvey.push(result.survey_data[indx]);
            } else {
              conductedindividualSurvey.push(result.survey_data[indx]);
            }

            let state_survey_wise_data = state_survey_wise_map.get(
              result.state_id
            );
            let district_survey_wise_data = district_survey_wise_map.get(
              result.dist_id
            );
            let tehsil_survey_wise_data = tehsil_survey_wise_map.get(
              result.tehsil_id
            );
            let crop_survey_wise_data = crop_survey_wise_map.get(+result.crop);

            let agency_survey_wise_data = agency_survey_wise_map.get(survey.agency_id);
            if (!state_survey_wise_data) {
              state_survey_wise_data = {
                name: this.stateMap.get(result.state_id),
                upto10: 0,
                day11to20: 0,
                day21to30: 0,
                day31to40: 0,
                morethan40: 0,
                approved_upto10: 0,
                approved_day11to20: 0,
                approved_day21to30: 0,
                approved_day31to40: 0,
                approved_morethan40: 0,
                approved_yettoComplete: 0,
                yettoComplete: 0,
                lossReported: 0,
                noLossReported: 0,
              };
            }
            if (!district_survey_wise_data) {
              district_survey_wise_data = {
                name: this.districtMap.get(result.dist_id),
                upto10: 0,
                day11to20: 0,
                day21to30: 0,
                day31to40: 0,
                morethan40: 0,
                approved_upto10: 0,
                approved_day11to20: 0,
                approved_day21to30: 0,
                approved_day31to40: 0,
                approved_morethan40: 0,
                approved_yettoComplete: 0,
                yettoComplete: 0,
                lossReported: 0,
                noLossReported: 0,
              };
            }
            if (!tehsil_survey_wise_data) {
              tehsil_survey_wise_data = {
                name: this.tehsilMap.get(result.tehsil_id),
                upto10: 0,
                day11to20: 0,
                day21to30: 0,
                day31to40: 0,
                morethan40: 0,
                approved_upto10: 0,
                approved_day11to20: 0,
                approved_day21to30: 0,
                approved_day31to40: 0,
                approved_morethan40: 0,
                approved_yettoComplete: 0,
                yettoComplete: 0,
                lossReported: 0,
                noLossReported: 0,
              };
            }
            if (!crop_survey_wise_data) {
              crop_survey_wise_data = {
                name: this.cropsMap.get(+result.crop),
                lossReported: 0,
                noLossReported: 0,
                harvest: 0,
                maturity: 0,
                grain_filling: 0,
                vegetative: 0,
                sowing: 0,
              };
            }
            if (!agency_survey_wise_data) {
              agency_survey_wise_data = {
                agency_id: survey.agency_id,
                agency_name: this.agencyMap.get(survey.agency_id),
                approved: 0,
                rejected: 0,
                draft: 0,
                pending: 0,
                not_surveyed: 0
              }
            }
            agency_survey_wise_data.not_surveyed += surveyIntimationIds.includes(survey.field_799) &&  !sampleIntimationIds.includes(survey.field_799)  ? 1 : 0;
            if (survey.field_527 && survey.field_524) {
              const diff = moment(survey.field_527.trim()).diff(
                moment(survey.field_524.trim()),
                "days"
              );
              if (diff < 10) {
                state_survey_wise_data.upto10++;
                district_survey_wise_data.upto10++;
                tehsil_survey_wise_data.upto10++;
              } else if (diff < 20 && diff >= 10) {
                state_survey_wise_data.day11to20++;
                district_survey_wise_data.day11to20++;
                tehsil_survey_wise_data.day11to20++;
              } else if (diff < 30 && diff >= 20) {
                state_survey_wise_data.day21to30++;
                district_survey_wise_data.day21to30++;
                tehsil_survey_wise_data.day21to30++;
              } else if (diff < 40 && diff >= 30) {
                state_survey_wise_data.day31to40++;
                district_survey_wise_data.day21to30++;
                tehsil_survey_wise_data.day21to30++;
              } else if (diff >= 40) {
                state_survey_wise_data.morethan40++;
                district_survey_wise_data.morethan40++;
                tehsil_survey_wise_data.morethan40++;
              }
            }
            if (survey.status == 1) {
              if (survey.datetime && survey.approved_reject_date) {
                const diff = moment(survey.approved_reject_date).diff(
                  moment(survey.datetime),
                  "days"
                );
                if (diff < 10) {
                  state_survey_wise_data.approved_upto10++;
                  district_survey_wise_data.approved_upto10++;
                  tehsil_survey_wise_data.approved_upto10++;
                } else if (diff < 20 && diff >= 10) {
                  state_survey_wise_data.approved_day11to20++;
                  district_survey_wise_data.approved_day11to20++;
                  tehsil_survey_wise_data.approved_day11to20++;
                } else if (diff < 30 && diff >= 20) {
                  state_survey_wise_data.approved_day21to30++;
                  district_survey_wise_data.approved_day21to30++;
                  tehsil_survey_wise_data.approved_day21to30++;
                } else if (diff < 40 && diff >= 30) {
                  state_survey_wise_data.approved_day31to40++;
                  district_survey_wise_data.approved_day21to30++;
                  tehsil_survey_wise_data.approved_day21to30++;
                } else if (diff >= 40) {
                  state_survey_wise_data.approved_morethan40++;
                  district_survey_wise_data.approved_morethan40++;
                  tehsil_survey_wise_data.approved_morethan40++;
                }
              } else {
                state_survey_wise_data.approved_yettoComplete++;
                district_survey_wise_data.approved_yettoComplete++;
                tehsil_survey_wise_data.approved_yettoComplete++;
              }
            }

            if (survey.field_540) {
              const stage = survey.field_540.toLowerCase().trim();
              if (stage === "harvest") {
                crop_survey_wise_data.harvest++;
              } else if (stage === "maturity") {
                crop_survey_wise_data.maturity++;
              } else if (stage === "grain filling") {
                crop_survey_wise_data.grain_filling++;
              } else if (stage === "vegetative") {
                crop_survey_wise_data.vegetative++;
              } else if (stage === "sowing") {
                crop_survey_wise_data.sowing++;
              }
            }
            if (survey.field_550) {
              state_survey_wise_data.lossReported++;
              district_survey_wise_data.lossReported++;
              tehsil_survey_wise_data.lossReported++;
              crop_survey_wise_data.lossReported++;
            } else {
              state_survey_wise_data.noLossReported++;
              district_survey_wise_data.lossReported++;
              tehsil_survey_wise_data.lossReported++;
              crop_survey_wise_data.noLossReported++;
            }


            state_survey_wise_map.set(result.state_id, state_survey_wise_data);
            district_survey_wise_map.set(
              result.dist_id,
              district_survey_wise_data
            );
            tehsil_survey_wise_map.set(
              result.tehsil_id,
              tehsil_survey_wise_data
            );
            crop_survey_wise_map.set(+result.crop, crop_survey_wise_data);

            if (survey.status == 0) {
              result.draft++;
              agency_survey_wise_data.draft++;
            } else {
              if (survey.approved_reject == 1) {
                result.approved++;
                agency_survey_wise_data.approved++;
              } else if (survey.approved_reject == 0) {
                result.rejected++;
                agency_survey_wise_data.rejected++;
              } else {
                result.pending++;
                agency_survey_wise_data.pending++;
              }
            }

            agency_survey_wise_map.set(survey.agency_id, agency_survey_wise_data);

          }

          result.no_of_sample_survey = sampleIntimationIds?.length;
          result.no_of_sample_survey_conducted = conductedSampleSurvey?.length;
          result.no_of_individual_survey_conducted =
            conductedindividualSurvey?.length;

          if (result.no_of_sample_survey_conducted) {
            for (
              let indx = 0;
              indx < result.no_of_sample_survey_conducted;
              indx++
            ) {
              result.sample_loss_percentage += +(
                conductedSampleSurvey[indx]?.field_550 || 0
              );
              result.sample_avg_damaged_area += +(
                conductedSampleSurvey[indx]?.field_548 || 0
              );
            }

            result.sample_avg_loss_percentage =
              result.sample_loss_percentage /
              result.no_of_sample_survey_conducted;
            result.sample_avg_damaged_area =
              result.sample_damaged_area / result.no_of_sample_survey_conducted;

            result.sample_claim_amount = conductedSampleSurvey
              .map((d) => {
                result.total_land_area += +d.field_546 || 0;
                result.insured_area += +d.field_547 || 0;
                result.damaged_area += +d.field_548 || 0;
                result.loss_percentage += +d.field_550 || 0;

                if (d.loss_type == "Localized") {
                  const diff = moment(d.date_of_loss).diff(
                    moment(result.date_of_sowing),
                    "days"
                  );
                  if (diff >= 0 && diff < 15) {
                    result.input_cost = +result.data["DOS-15"] || 0;
                  } else if (diff < 30 && diff >= 15) {
                    result.input_cost = +result.data["DOS-30"] || 0;
                  } else if (diff < 45 && diff >= 30) {
                    result.input_cost = +result.data["DOS-45"] || 0;
                  } else if (diff < 60 && diff >= 45) {
                    result.input_cost = +result.data["DOS-60"] || 0;
                  } else if (diff < 75 && diff >= 60) {
                    result.input_cost = +result.data["DOS-75"] || 0;
                  } else if (diff < 90 && diff >= 75) {
                    result.input_cost = +result.data["DOS-90"] || 0;
                  } else if (diff >= 90) {
                    result.input_cost = +result.data["DOS-GR-90"] || 0;
                  }
                } else {
                  result.input_cost = result.scale_of_finance;
                }
                return (
                  +d.insure_area *
                  (result.sample_avg_loss_percentage / 100) *
                  result.input_cost
                );
              })
              .reduce((a, b) => a + b, 0);

            result.claim_amount += result.sample_claim_amount;
          }

          result.individual_claim_amount += conductedindividualSurvey
            .map((d) => {
              result.total_land_area += +d.field_546 || 0;
              result.insured_area += +d.field_547 || 0;
              result.damaged_area += +d.field_548 || 0;
              result.loss_percentage += +d.field_550 || 0;

              if (d.field_525 == "Localized") {
                const diff = moment(d.field_553).diff(
                  moment(result.date_of_sowing),
                  "days"
                );
                if (diff >= 0 && diff < 15) {
                  result.input_cost = +result.data["DOS-15"] || 0;
                } else if (diff < 30 && diff >= 15) {
                  result.input_cost = +result.data["DOS-30"] || 0;
                } else if (diff < 45 && diff >= 30) {
                  result.input_cost = +result.data["DOS-45"] || 0;
                } else if (diff < 60 && diff >= 45) {
                  result.input_cost = +result.data["DOS-60"] || 0;
                } else if (diff < 75 && diff >= 60) {
                  result.input_cost = +result.data["DOS-75"] || 0;
                } else if (diff < 90 && diff >= 75) {
                  result.input_cost = +result.data["DOS-90"] || 0;
                } else if (diff >= 90) {
                  result.input_cost = +result.data["DOS-GR-90"] || 0;
                }
              } else {
                result.input_cost = result.scale_of_finance;
              }
              return (
                this.divide(+d.field_547, +d.field_546) *
                +d.field_548 *
                ((+d.field_550 || 0) / 100) *
                result.input_cost
              );
            })
            .reduce((a, b) => a + b, 0);

          result.claim_amount += result.individual_claim_amount;

          result.actual_loss_ratio = this.divide(
            result.claim_amount,
            result.gross_premium
          );

          iu_calculated_data.push(result);

          let state_iu_wise_data = state_iu_wise_map.get(result.state_id);
          if (state_iu_wise_data) {
            state_iu_wise_data.claim_amount += result.claim_amount;
            state_iu_wise_data.gross_premium += result.gross_premium;
            state_iu_wise_data.sum_insured += result.sum_insured;
            state_iu_wise_data.approved += result.approved;
            state_iu_wise_data.rejected += result.rejected;
            state_iu_wise_data.draft += result.draft;
            state_iu_wise_data.pending += result.pending;
            state_iu_wise_data.not_surveyed += result.not_surveyed;
            state_iu_wise_data.loss_ratio += this.divide(
              state_iu_wise_data.claim_amount,
              state_iu_wise_data.gross_premium
            );
          } else {
            state_iu_wise_data = {
              name: this.stateMap.get(result.state_id),
              claim_amount: result.claim_amount,
              gross_premium: result.gross_premium,
              sum_insured: result.sum_insured,
              approved: result.approved,
              rejected: result.rejected,
              draft: result.draft,
              pending: result.pending,
              not_surveyed: result.not_surveyed,
              loss_ratio: this.divide(
                result.claim_amount,
                result.gross_premium
              ),
            };
          }
          state_iu_wise_map.set(result.state_id, state_iu_wise_data);

          let district_iu_wise_data = district_iu_wise_map.get(result.dist_id);
          if (district_iu_wise_data) {
            district_iu_wise_data.claim_amount += result.claim_amount;
            district_iu_wise_data.gross_premium += result.gross_premium;
            district_iu_wise_data.sum_insured += result.sum_insured;
            district_iu_wise_data.approved += result.approved;
            district_iu_wise_data.rejected += result.rejected;
            district_iu_wise_data.draft += result.draft;
            district_iu_wise_data.pending += result.pending;
            district_iu_wise_data.not_surveyed += result.not_surveyed;
            district_iu_wise_data.loss_ratio += this.divide(
              district_iu_wise_data.claim_amount,
              district_iu_wise_data.gross_premium
            );
          } else {
            district_iu_wise_data = {
              name: this.districtMap.get(result.dist_id),
              claim_amount: result.claim_amount,
              gross_premium: result.gross_premium,
              sum_insured: result.sum_insured,
              approved: result.approved,
              rejected: result.rejected,
              draft: result.draft,
              pending: result.pending,
              not_surveyed: result.not_surveyed,
              loss_ratio: this.divide(
                result.claim_amount,
                result.gross_premium
              ),
            };
          }
          district_iu_wise_map.set(result.dist_id, district_iu_wise_data);

          let tehsil_iu_wise_data = tehsil_iu_wise_map.get(result.tehsil_id);
          if (tehsil_iu_wise_data) {
            tehsil_iu_wise_data.claim_amount += result.claim_amount;
            tehsil_iu_wise_data.gross_premium += result.gross_premium;
            tehsil_iu_wise_data.sum_insured += result.sum_insured;
            tehsil_iu_wise_data.approved += result.approved;
            tehsil_iu_wise_data.rejected += result.rejected;
            tehsil_iu_wise_data.draft += result.draft;
            tehsil_iu_wise_data.pending += result.pending;
            tehsil_iu_wise_data.not_surveyed += result.not_surveyed;
            tehsil_iu_wise_data.loss_ratio += this.divide(
              tehsil_iu_wise_data.claim_amount,
              tehsil_iu_wise_data.gross_premium
            );
          } else {
            tehsil_iu_wise_data = {
              name: this.tehsilMap.get(result.tehsil_id),
              claim_amount: result.claim_amount,
              gross_premium: result.gross_premium,
              sum_insured: result.sum_insured,
              approved: result.approved,
              rejected: result.rejected,
              draft: result.draft,
              pending: result.pending,
              not_surveyed: result.not_surveyed,
              loss_ratio: this.divide(
                result.claim_amount,
                result.gross_premium
              ),
            };
          }
          tehsil_iu_wise_map.set(result.tehsil_id, tehsil_iu_wise_data);

          const all_iu_wise_data  = {
            name: iu_name,
            claim_amount: result.claim_amount || 0,
            gross_premium: result.gross_premium || 0,
            sum_insured: result.sum_insured || 0,
            loss_ratio: result.loss_ratio,
          };

          all_iu_wise_map.set(key, all_iu_wise_data);

          let crop_iu_wise_data = crop_iu_wise_map.get(+result.crop);
          if (crop_iu_wise_data) {
            crop_iu_wise_data.claim_amount += result.claim_amount;
            crop_iu_wise_data.gross_premium += result.gross_premium;
            crop_iu_wise_data.sum_insured += result.sum_insured;
            crop_iu_wise_data.approved += result.approved;
            crop_iu_wise_data.rejected += result.rejected;
            crop_iu_wise_data.draft += result.draft;
            crop_iu_wise_data.pending += result.pending;
            crop_iu_wise_data.not_surveyed += result.not_surveyed;
            crop_iu_wise_data.loss_ratio += this.divide(
              crop_iu_wise_data.claim_amount,
              crop_iu_wise_data.gross_premium
            );
          } else {
            crop_iu_wise_data = {
              name: this.cropsMap.get(+result.crop),
              claim_amount: result.claim_amount,
              gross_premium: result.gross_premium,
              sum_insured: result.sum_insured,
              approved: result.approved,
              rejected: result.rejected,
              draft: result.draft,
              pending: result.pending,
              not_surveyed: result.not_surveyed,
              loss_ratio: this.divide(
                result.claim_amount,
                result.gross_premium
              ),
            };
          }
          crop_iu_wise_map.set(+result.crop, crop_iu_wise_data);
        }
      }
    }

    const crop_iu_data = [...crop_iu_wise_map]
      .map((d: any) => d[1])
      .sort((a, b) => b.sum_insured - a.sum_insured);
    const crop_survey_data = crop_survey_wise_map;
    let location_iu_data = [];
    let location_survey_data: any = null;

    let iu_wise_map = null;
    if (tehsil_iu_wise_map.size === 1) {
      this.locationLabel = 'IU'
      location_iu_data = [...all_iu_wise_map]
      .map((d: any) => d[1])
      .sort((a, b) => b.sum_insured - a.sum_insured);
      location_survey_data = all_iu_wise_map;
    }
    else if (district_iu_wise_map.size == 1) {
      this.locationLabel = "Block";
      location_iu_data = [...tehsil_iu_wise_map]
        .map((d: any) => d[1])
        .sort((a, b) => b.sum_insured - a.sum_insured);
      location_survey_data = tehsil_survey_wise_map;
    } else if (state_iu_wise_map.size == 1) {
      this.locationLabel = "District";
      location_iu_data = [...district_iu_wise_map]
        .map((d: any) => d[1])
        .sort((a, b) => b.sum_insured - a.sum_insured);
      location_survey_data = district_survey_wise_map;
    } else {
      this.locationLabel = "State";
      location_iu_data = [...state_iu_wise_map]
        .map((d: any) => d[1])
        .sort((a, b) => b.sum_insured - a.sum_insured);
      location_survey_data = state_survey_wise_map;
    }

    location_iu_data.forEach(d => {
      d.loss_ratio = this.divide(d.claim_amount,d.gross_premium)
  })
  crop_iu_data.forEach(d => {
      d.loss_ratio = this.divide(d.claim_amount,d.gross_premium)
  })
    return {
      iu_calculated_data,
      location_iu_data,
      crop_iu_data,
      location_survey_data,
      crop_survey_data,
      agnecy_survey_data :  agency_survey_wise_map
    };
  }

  dateWiseIU(totData: any) {
    const dateList = [];
    let seriesDate = null;
    let cat = [];
    let completed = [];
    let loss_ratio = [];
    let gross_premium = [];
    let claim_amount = [];

    let approved = [];
    let rejected = [];
    let pending = [];
    let draft = [];
    let not_surveyed = [];

    if (this.minDate && this.maxDate) {
      if (this.minDate < this.t_8Days) {
        while (seriesDate === null || seriesDate < this.t_8Days) {
          const result: any = {};
          if (seriesDate === null) {
            seriesDate = this.minDate;
            result.start_date = seriesDate;
          } else {
            result.start_date =
              new Date(seriesDate).getTime() + 24 * 60 * 60 * 1000;
          }
          seriesDate = new Date(seriesDate).getTime() + 24 * 60 * 60 * 1000 * 7;
          if (seriesDate > this.t_8Days) {
            seriesDate = this.t_8Days;
          }
          result.end_date = seriesDate;
          dateList.push(result);
        }
      }
      for (let i = 1; i <= 7; i++) {
        if (seriesDate == null) {
          seriesDate = this.minDate;
        } else {
          seriesDate = new Date(seriesDate).getTime() + 24 * 60 * 60 * 1000;
        }
        dateList.push({ end_date: seriesDate });
      }
      for (let i = 0; i < dateList.length; i++) {
        const dateData = dateList[i];
        if (dateData.start_date) {
          cat.push(
            `${moment(dateData.start_date).format("YYYY-MM-DD")} To ${moment(
              dateData.end_date
            ).format("YYYY-MM-DD")}`
          );
        } else {
          cat.push(`${moment(dateData.end_date).format("YYYY-MM-DD")}`);
        }
        claim_amount.push(0);
        gross_premium.push(0);
        loss_ratio.push(0);
        completed.push(0);

        approved.push(0);
        rejected.push(0);
        pending.push(0);
        draft.push(0);
        not_surveyed.push(0);

        for (let j = 0; j < totData.length; j++) {
          const iu_data = totData[j];
          if (iu_data.survey_date && iu_data.survey_date <= dateData.end_date) {
            completed[i] += iu_data.no_of_survey;
            claim_amount[i] += iu_data.claim_amount;
            gross_premium[i] += iu_data.gross_premium;
          }
          if (iu_data.survey_date && iu_data.survey_date <= dateData.end_date) {
            if (iu_data.survey_date && iu_data.approved_date <= dateData.end_date) {
              approved[i] += iu_data.approved;
              rejected[i] += iu_data.rejected;
            } else {
              pending[i] += iu_data.approved +iu_data.rejected;
            }
            pending[i] += iu_data.pending;
            draft[i] += iu_data.draft;
          } else {
            not_surveyed[i] += iu_data.not_surveyed;
          }
        }
        loss_ratio[i] = this.divide(claim_amount[i], gross_premium[i]);
      }
    }

    return { cat, completed, loss_ratio, approved, rejected, pending, draft };
  }

  generateChartData(
    totData: any,
    state_iu_data: any,
    crop_iu_data: any,
    state_survey_wise_map: any,
    crop_survey_wise_map: any,
    agnecy_survey_data: any
  ) {
    const iuSurveyData = totData.flatMap((d: any) => d.survey_data);
    const date_wise_loss_ratio = this.dateWiseIU(totData);

    const states = [];
    const crops = [];
    const state_counts: any = {};
    const crop_counts: any = {};
    const cause_map = new Map();
    const top_cause_map = new Map();
    const other_cause_map = new Map();
    ["no event"].forEach((d) => cause_map.set(d, "No Event"));
    ["cyclone"].forEach((d) => cause_map.set(d, "Cyclone"));
    ["drought"].forEach((d) => cause_map.set(d, "Drought"));
    ["dry spell"].forEach((d) => cause_map.set(d, "Dry Spell"));
    [
      "flood",
      "flood due to dam overflow/river flood",
      "inundation",
      "heavy rainfall",
      "unseasonal rainfall",
    ].forEach((d) => cause_map.set(d, "Flood"));
    ["pest & disease"].forEach((d) => cause_map.set(d, "Pest & Disease"));
    [
      "cloud burst",
      "hailstorm",
      "landslide",
      "lightening",
      "natural fire",
      "wild animal attack",
      "storm",
      "others",
    ].forEach((d) => cause_map.set(d, "Others"));
    top_cause_map.set("No Event", 0);
    top_cause_map.set("Cyclone", 0);
    top_cause_map.set("Drought", 0);
    top_cause_map.set("Dry Spell", 0);
    top_cause_map.set("Flood", 0);
    top_cause_map.set("Pest & Disease", 0);
    top_cause_map.set("Others", 0);

    let field = "";
    if (this.locationLabel == "State") {
      field = "field_528";
    } else if (this.locationLabel == "District") {
      field = "field_529";
    } else if (this.locationLabel == "Block") {
      field = "field_530";
    } else if (this.locationLabel == "IU") {
      field = 'iu';
    }

    for (let i = 0; i < iuSurveyData.length; i++) {
      const data = iuSurveyData[i];
      if (state_counts[data[field]]) {
        state_counts[data[field]]++;
      } else {
        states.push(data[field]);
        state_counts[data[field]] = 1;
      }

      if (crop_counts[data["field_539"]]) {
        crop_counts[data["field_539"]]++;
      } else {
        crops.push(data["field_539"]);
        crop_counts[data["field_539"]] = 1;
      }
      if (data.field_554) {
        const lossCause = cause_map.get(data.field_554.toLowerCase());
        if (lossCause == "Others") {
          top_cause_map.set(lossCause, top_cause_map.get(lossCause) + 1);
          if (other_cause_map.get(data.field_554)) {
            other_cause_map.set(
              data.field_554,
              other_cause_map.get(data.field_554) + 1
            );
          } else {
            other_cause_map.set(data.field_554, 1);
          }
        } else {
          top_cause_map.set(lossCause, top_cause_map.get(lossCause) + 1);
        }
      }
    }

    states.sort((a, b) => state_counts[b] - state_counts[a]);
    crops.sort((a, b) => crop_counts[b] - crop_counts[a]);

    const cause_of_loss_top = [...top_cause_map].map((d) => ({
      name: d[0],
      y: d[1],
    }));
    const cause_of_loss_other = [...other_cause_map].map((d) => ({
      name: d[0],
      y: d[1],
    }));

    const survey_completed_in_days_top_5: any = {
      upto10: [],
      day11to20: [],
      day21to30: [],
      day31to40: [],
      morethan40: [],
      yettoComplete: [],
      cat: [],
    };
    const survey_completed_in_days_rest: any = {
      upto10: [],
      day11to20: [],
      day21to30: [],
      day31to40: [],
      morethan40: [],
      yettoComplete: [],
      cat: [],
    };
    const survey_approved_in_days_top_5: any = {
      upto10: [],
      day11to20: [],
      day21to30: [],
      day31to40: [],
      morethan40: [],
      yettoComplete: [],
      cat: [],
    };
    const survey_approved_in_days_rest: any = {
      upto10: [],
      day11to20: [],
      day21to30: [],
      day31to40: [],
      morethan40: [],
      yettoComplete: [],
      cat: [],
    };

    const cls_location_wise_survey_progress_top_5: any = {
      cat: [],
      approved: [],
      pending: [],
      rejected: [],
      draft: [],
      not_surveyed: [],
    }
    const cls_location_wise_survey_progress_rest: any = {
      cat: [],
      approved: [],
      pending: [],
      rejected: [],
      draft: [],
      not_surveyed: [],
    }
    const agency_wise_survey_progress_top_5: any = {
      cat: [],
      approved: [],
      pending: [],
      rejected: [],
      draft: [],
      not_surveyed: [],
    }
    const agency_wise_survey_progress_rest: any = {
      cat: [],
      approved: [],
      pending: [],
      rejected: [],
      draft: [],
      not_surveyed: [],
    }

    const cls_location_progress_survey_top_5: any = {
      cat: [],
      lossReported: [],
      noLossReported: [],
    };
    const cls_location_progress_survey_rest: any = {
      cat: [],
      lossReported: [],
      noLossReported: [],
    };

    const cls_crop_progress_survey_top_5: any = {
      cat: [],
      lossReported: [],
      noLossReported: [],
    };
    const cls_crop_progress_survey_rest: any = {
      cat: [],
      lossReported: [],
      noLossReported: [],
    };

    const crop_state_wise_top_5: any = {
      cat: [],
      harvest: [],
      maturity: [],
      grain_filling: [],
      vegetative: [],
      sowing: [],
    };
    const crop_state_wise_rest: any = {
      cat: [],
      harvest: [],
      maturity: [],
      grain_filling: [],
      vegetative: [],
      sowing: [],
    };

    const location_claim_amount_top_5: any = {
      cat: [],
      claim_amount: [],
      gross_premium: [],
      loss_ratio: [],
    };
    const location_claim_amount_rest: any = {
      cat: [],
      claim_amount: [],
      gross_premium: [],
      loss_ratio: [],
    };

    const crop_claim_amount_top_5: any = {
      cat: [],
      claim_amount: [],
      gross_premium: [],
      loss_ratio: [],
    };
    const crop_claim_amount_rest: any = {
      cat: [],
      claim_amount: [],
      gross_premium: [],
      loss_ratio: [],
    };

    for (let i = 0; i < states.length; i++) {
      const state = states[i];
      const state_data: any = state_survey_wise_map.get(state);
      if (i < 5) {
        survey_completed_in_days_top_5.cat.push(state_data.name);
        survey_completed_in_days_top_5.upto10.push(state_data.upto10);
        survey_completed_in_days_top_5.day11to20.push(state_data.day11to20);
        survey_completed_in_days_top_5.day21to30.push(state_data.day21to30);
        survey_completed_in_days_top_5.day31to40.push(state_data.day31to40);
        survey_completed_in_days_top_5.morethan40.push(state_data.morethan40);
        survey_completed_in_days_top_5.yettoComplete.push(
          state_data.yettoComplete
        );
        survey_approved_in_days_top_5.cat.push(state_data.name);
        survey_approved_in_days_top_5.upto10.push(state_data.approved_upto10);
        survey_approved_in_days_top_5.day11to20.push(state_data.approved_day11to20);
        survey_approved_in_days_top_5.day21to30.push(state_data.approved_day21to30);
        survey_approved_in_days_top_5.day31to40.push(state_data.approved_day31to40);
        survey_approved_in_days_top_5.morethan40.push(state_data.approved_morethan40);
        survey_approved_in_days_top_5.yettoComplete.push(state_data.approved_yettoComplete);

        cls_location_progress_survey_top_5.cat.push(state_data.name);
        cls_location_progress_survey_top_5.lossReported.push(
          state_data.lossReported
        );
        cls_location_progress_survey_top_5.noLossReported.push(
          state_data.noLossReported
        );

        

      } else {
        if (i == 5) {
          survey_completed_in_days_top_5.cat.push("Others");
          survey_completed_in_days_top_5.upto10.push(state_data.upto10);
          survey_completed_in_days_top_5.day11to20.push(state_data.day11to20);
          survey_completed_in_days_top_5.day21to30.push(state_data.day21to30);
          survey_completed_in_days_top_5.day31to40.push(state_data.day31to40);
          survey_completed_in_days_top_5.morethan40.push(state_data.morethan40);
          survey_completed_in_days_top_5.yettoComplete.push(
            state_data.yettoComplete
          );

          survey_approved_in_days_top_5.cat.push("Others");
          survey_approved_in_days_top_5.upto10.push(state_data.approved_upto10);
          survey_approved_in_days_top_5.day11to20.push(state_data.approved_day11to20);
          survey_approved_in_days_top_5.day21to30.push(state_data.approved_day21to30);
          survey_approved_in_days_top_5.day31to40.push(state_data.approved_day31to40);
          survey_approved_in_days_top_5.morethan40.push(state_data.approved_morethan40);
          survey_approved_in_days_top_5.yettoComplete.push(state_data.approved_yettoComplete);

          cls_location_progress_survey_top_5.cat.push("Others");
          cls_location_progress_survey_top_5.lossReported.push(
            state_data.lossReported
          );
          cls_location_progress_survey_top_5.noLossReported.push(
            state_data.noLossReported
          );

        
        } else {
          survey_completed_in_days_top_5.upto10[5] += state_data.upto10;
          survey_completed_in_days_top_5.day11to20[5] += state_data.day11to20;
          survey_completed_in_days_top_5.day21to30[5] += state_data.day21to30;
          survey_completed_in_days_top_5.day31to40[5] += state_data.day31to40;
          survey_completed_in_days_top_5.morethan40[5] += state_data.morethan40;
          survey_completed_in_days_top_5.yettoComplete[5] +=
            state_data.yettoComplete;


          survey_approved_in_days_top_5.upto10[5] += state_data.approved_upto10;
          survey_approved_in_days_top_5.day11to20[5] += state_data.approved_day11to20;
          survey_approved_in_days_top_5.day21to30[5] += state_data.approved_day21to30;
          survey_approved_in_days_top_5.day31to40[5] += state_data.approved_day31to40;
          survey_approved_in_days_top_5.morethan40[5] += state_data.approved_morethan40;
          survey_approved_in_days_top_5.yettoComplete += state_data.approved_yettoComplete;

          cls_location_progress_survey_top_5.lossReported[5] +=
            state_data.lossReported;
          cls_location_progress_survey_top_5.noLossReported[5] +=
            state_data.noLossReported;

        }

        survey_completed_in_days_rest.cat.push(state_data.name);
        survey_completed_in_days_rest.upto10.push(state_data.upto10);
        survey_completed_in_days_rest.day11to20.push(state_data.day11to20);
        survey_completed_in_days_rest.day21to30.push(state_data.day21to30);
        survey_completed_in_days_rest.day31to40.push(state_data.day31to40);
        survey_completed_in_days_rest.morethan40.push(state_data.morethan40);
        survey_completed_in_days_rest.yettoComplete.push(
          state_data.yettoComplete
        );

        survey_approved_in_days_rest.cat.push(state_data.name);
        survey_approved_in_days_rest.upto10.push(state_data.approved_upto10);
        survey_approved_in_days_rest.day11to20.push(state_data.approved_day11to20);
        survey_approved_in_days_rest.day21to30.push(state_data.approved_day21to30);
        survey_approved_in_days_rest.day31to40.push(state_data.approved_day31to40);
        survey_approved_in_days_rest.morethan40.push(state_data.approved_morethan40);

        cls_location_progress_survey_rest.cat.push(state_data.name);
        cls_location_progress_survey_rest.lossReported.push(
          state_data.lossReported
        );
        cls_location_progress_survey_rest.noLossReported.push(
          state_data.noLossReported
        );

      }
    }
    for (let i = 0; i < crops.length; i++) {
      const crop = crops[i];
      const crop_data = crop_survey_wise_map.get(+crop);
      if (i < 5) {
        cls_crop_progress_survey_top_5.cat.push(crop_data.name);
        cls_crop_progress_survey_top_5.lossReported.push(
          crop_data.lossReported
        );
        cls_crop_progress_survey_top_5.noLossReported.push(
          crop_data.noLossReported
        );

        crop_state_wise_top_5.cat.push(crop_data.name);
        crop_state_wise_top_5.harvest.push(crop_data.harvest);
        crop_state_wise_top_5.maturity.push(crop_data.maturity);
        crop_state_wise_top_5.grain_filling.push(crop_data.grain_filling);
        crop_state_wise_top_5.vegetative.push(crop_data.vegetative);
        crop_state_wise_top_5.sowing.push(crop_data.sowing);
      } else {
        if (i == 5) {
          cls_crop_progress_survey_top_5.cat.push("Others");
          cls_crop_progress_survey_top_5.lossReported.push(
            crop_data.lossReported
          );
          cls_crop_progress_survey_top_5.noLossReported.push(
            crop_data.noLossReported
          );

          crop_state_wise_top_5.cat.push("Others");
          crop_state_wise_top_5.harvest.push(crop_data.harvest);
          crop_state_wise_top_5.maturity.push(crop_data.maturity);
          crop_state_wise_top_5.grain_filling.push(crop_data.grain_filling);
          crop_state_wise_top_5.vegetative.push(crop_data.vegetative);
          crop_state_wise_top_5.sowing.push(crop_data.sowing);
        } else {
          cls_crop_progress_survey_top_5.lossReported[5] +=
            crop_data.lossReported;
          cls_crop_progress_survey_top_5.noLossReported[5] +=
            crop_data.noLossReported;

          crop_state_wise_top_5.harvest[5] += crop_data.harvest;
          crop_state_wise_top_5.maturity[5] += crop_data.maturity;
          crop_state_wise_top_5.grain_filling[5] += crop_data.grain_filling;
          crop_state_wise_top_5.vegetative[5] += crop_data.vegetative;
          crop_state_wise_top_5.sowing[5] += crop_data.sowing;
        }

        cls_crop_progress_survey_rest.cat.push(crop_data.name);
        cls_crop_progress_survey_rest.lossReported.push(crop_data.lossReported);
        cls_crop_progress_survey_rest.noLossReported.push(
          crop_data.noLossReported
        );

        crop_state_wise_rest.cat.push(crop_data.name);
        crop_state_wise_rest.harvest.push(crop_data.harvest);
        crop_state_wise_rest.maturity.push(crop_data.maturity);
        crop_state_wise_rest.grain_filling.push(crop_data.grain_filling);
        crop_state_wise_rest.vegetative.push(crop_data.vegetative);
        crop_state_wise_rest.sowing.push(crop_data.sowing);
      }
    }

    const agency_data = [...agnecy_survey_data];
    for (let i = 0; i < agency_data.length; i++) {
      const data = agency_data[i][1];
      if (i<5) {
        agency_wise_survey_progress_top_5.cat.push(data.agency_name);
        agency_wise_survey_progress_top_5.approved.push(data.approved);
        agency_wise_survey_progress_top_5.rejected.push(data.rejected);
        agency_wise_survey_progress_top_5.pending.push(data.pending);
        agency_wise_survey_progress_top_5.draft.push(data.draft);
        agency_wise_survey_progress_top_5.not_surveyed.push(data.not_surveyed);
      } else {
        if (i == 5) {
          agency_wise_survey_progress_top_5.cat.push('Others');
          agency_wise_survey_progress_top_5.approved.push(data.approved);
          agency_wise_survey_progress_top_5.rejected.push(data.rejected);
          agency_wise_survey_progress_top_5.pending.push(data.pending);
          agency_wise_survey_progress_top_5.draft.push(data.draft);
          agency_wise_survey_progress_top_5.not_surveyed.push(data.not_surveyed);
        } else {
          agency_wise_survey_progress_top_5.approved[5] += data.approved;
          agency_wise_survey_progress_top_5.rejected[5] += data.rejected;
          agency_wise_survey_progress_top_5.pending[5] += data.pending;
          agency_wise_survey_progress_top_5.draft[5] += data.draft;
          agency_wise_survey_progress_top_5.not_surveyed[5] += data.not_surveyed;
        }
        agency_wise_survey_progress_rest.cat.push(data.agency_name);
        agency_wise_survey_progress_rest.approved.push(data.approved);
        agency_wise_survey_progress_rest.rejected.push(data.rejected);
        agency_wise_survey_progress_rest.pending.push(data.pending);
        agency_wise_survey_progress_rest.draft.push(data.draft);
        agency_wise_survey_progress_rest.not_surveyed.push(data.not_surveyed);
      }
    }

    for (let i = 0; i < state_iu_data.length; i++) {
      const data = state_iu_data[i];
      if (i < 5) {
        location_claim_amount_top_5.cat.push(data.name);
        location_claim_amount_top_5.claim_amount.push(data.claim_amount);
        location_claim_amount_top_5.gross_premium.push(data.gross_premium);
        location_claim_amount_top_5.loss_ratio.push(data.loss_ratio);

        cls_location_wise_survey_progress_top_5.cat.push(data.name);
        cls_location_wise_survey_progress_top_5.approved.push(data.approved);
        cls_location_wise_survey_progress_top_5.rejected.push(data.rejected);
        cls_location_wise_survey_progress_top_5.pending.push(data.pending);
        cls_location_wise_survey_progress_top_5.draft.push(data.draft);
        cls_location_wise_survey_progress_top_5.not_surveyed.push(data.not_surveyed);
      } else {
        if (i == 5) {
          location_claim_amount_top_5.cat.push("Others");
          location_claim_amount_top_5.claim_amount.push(data.claim_amount);
          location_claim_amount_top_5.gross_premium.push(data.gross_premium);
          location_claim_amount_top_5.loss_ratio.push(data.loss_ratio);

          cls_location_wise_survey_progress_top_5.cat.push("Others");
          cls_location_wise_survey_progress_top_5.approved.push(data.approved);
          cls_location_wise_survey_progress_top_5.rejected.push(data.rejected);
          cls_location_wise_survey_progress_top_5.pending.push(data.pending);
          cls_location_wise_survey_progress_top_5.draft.push(data.draft);
          cls_location_wise_survey_progress_top_5.not_surveyed.push(data.not_surveyed);
        } else {
          location_claim_amount_top_5.claim_amount[5] += data.claim_amount || 0;
          location_claim_amount_top_5.gross_premium[5] += data.gross_premium || 0;
          location_claim_amount_top_5.loss_ratio[5] += data.loss_ratio || 0;

          cls_location_wise_survey_progress_top_5.approved[5] += data.approved;
            cls_location_wise_survey_progress_top_5.rejected[5] += data.rejected;
            cls_location_wise_survey_progress_top_5.pending[5] += data.pending;
            cls_location_wise_survey_progress_top_5.draft[5] += data.draft;
            cls_location_wise_survey_progress_top_5.not_surveyed[5] += data.not_surveyed;
        }

        location_claim_amount_rest.cat.push(data.name);
        location_claim_amount_rest.claim_amount.push(data.claim_amount);
        location_claim_amount_rest.gross_premium.push(data.gross_premium);
        location_claim_amount_rest.loss_ratio.push(data.loss_ratio);

        cls_location_wise_survey_progress_rest.cat.push("Others");
        cls_location_wise_survey_progress_rest.approved.push(data.approved);
        cls_location_wise_survey_progress_rest.rejected.push(data.rejected);
        cls_location_wise_survey_progress_rest.pending.push(data.pending);
        cls_location_wise_survey_progress_rest.draft.push(data.draft);
        cls_location_wise_survey_progress_rest.not_surveyed.push(data.not_surveyed);
      }
    }
    if (state_iu_data.length > 5) {
      location_claim_amount_top_5.loss_ratio[5] = this.divide(
        location_claim_amount_top_5.claim_amount[5],
        location_claim_amount_top_5.gross_premium[5]
      );
    }

    for (let i = 0; i < crop_iu_data.length; i++) {
      const data = crop_iu_data[i];
      if (i < 5) {
        crop_claim_amount_top_5.cat.push(data.name);
        crop_claim_amount_top_5.claim_amount.push(data.claim_amount);
        crop_claim_amount_top_5.gross_premium.push(data.gross_premium);
        crop_claim_amount_top_5.loss_ratio.push(data.loss_ratio);
      } else {
        if (i == 5) {
          crop_claim_amount_top_5.cat.push("Others");
          crop_claim_amount_top_5.claim_amount.push(data.claim_amount);
          crop_claim_amount_top_5.gross_premium.push(data.gross_premium);
          crop_claim_amount_top_5.loss_ratio.push(data.loss_ratio);
        } else {
          crop_claim_amount_top_5.claim_amount[5] += data.claim_amount || 0;
          crop_claim_amount_top_5.gross_premium[5]+= data.gross_premium || 0;
          crop_claim_amount_top_5.loss_ratio[5] += data.loss_ratio || 0;
        }

        crop_claim_amount_rest.cat.push(data.name);
        crop_claim_amount_rest.claim_amount.push(data.claim_amount);
        crop_claim_amount_rest.gross_premium.push(data.gross_premium);
        crop_claim_amount_rest.loss_ratio.push(data.loss_ratio);
      }
    }
    if (crop_iu_data.length > 5) {
      crop_claim_amount_top_5.loss_ratio[5] = this.divide(
        crop_claim_amount_top_5.claim_amount[5],
        crop_claim_amount_top_5.gross_premium[5]
      );
    }

    return {
      date_wise_loss_ratio,
      cls_location_wise_survey_progress_top_5,
      cls_location_wise_survey_progress_rest,
      survey_completed_in_days_top_5,
      survey_completed_in_days_rest,
      survey_approved_in_days_top_5,
      survey_approved_in_days_rest,
      cls_location_progress_survey_top_5,
      cls_location_progress_survey_rest,
      cls_crop_progress_survey_top_5,
      cls_crop_progress_survey_rest,
      cause_of_loss_top,
      cause_of_loss_other,
      crop_state_wise_top_5,
      crop_state_wise_rest,
      location_claim_amount_top_5,
      location_claim_amount_rest,
      crop_claim_amount_top_5,
      crop_claim_amount_rest,
      agency_wise_survey_progress_top_5,
      agency_wise_survey_progress_rest
    };
  }

  generateCharts() {
    const {
      iu_calculated_data,
      location_iu_data,
      crop_iu_data,
      location_survey_data,
      crop_survey_data,
      agnecy_survey_data
    } = this.generateIUCalculation(this.allData, this.surveyData);

    const chartData = this.generateChartData(
      iu_calculated_data,
      location_iu_data,
      crop_iu_data,
      location_survey_data,
      crop_survey_data,
      agnecy_survey_data
    );
    // .filter(d => d.no_of_intimations > 0);

    // this.generatecrop_wise_loss_reporting(totData, {});
    // this.generateDistrict_Block_wise_iu_wise_loss_reporting(totData,{});
    // // this.generatetype_of_surveys(totData);
    // this.generateCause_of_Loss(totData,{});
    // this.generateCrop_wise_claim_assessment(totData,{});
    // this.generateDistrict_wise_Claim_Assessment(totData, {});
    // this.generateSurvey_Completion_over_time(totData);
    // this.generatecls_survey_execution(totData, {});
    // this.generateCrop_stage(totData, {});

    this.generateSurvey_Completion_over_time(chartData.date_wise_loss_ratio);
    this.generatecls_survey_execution(
      chartData.survey_completed_in_days_top_5,
      chartData.survey_completed_in_days_rest
    );
    this.generatecls_survey_approval(
      chartData.survey_approved_in_days_top_5,
      chartData.survey_approved_in_days_rest
    );
    this.generatecls_survey_approval_progress(
      chartData.cls_location_wise_survey_progress_top_5,
      chartData.cls_location_wise_survey_progress_rest
    );

    this.generatecls_agency_approval_progress(
      chartData.agency_wise_survey_progress_top_5,
      chartData.agency_wise_survey_progress_rest
    );

    this.generateDistrict_Block_wise_iu_wise_loss_reporting(
      chartData.cls_location_progress_survey_top_5,
      chartData.cls_location_progress_survey_rest
    );
    this.generatecrop_wise_loss_reporting(
      chartData.cls_crop_progress_survey_top_5,
      chartData.cls_crop_progress_survey_rest
    );
    this.generateCause_of_Loss(
      chartData.cause_of_loss_top,
      chartData.cause_of_loss_other
    );
    this.generateDistrict_wise_Claim_Assessment(
      chartData.location_claim_amount_top_5,
      chartData.location_claim_amount_rest
    );
    this.generateCrop_wise_claim_assessment(
      chartData.crop_claim_amount_top_5,
      chartData.crop_claim_amount_rest
    );
    this.generateCrop_stage(
      chartData.crop_state_wise_top_5,
      chartData.crop_state_wise_rest
    );
  }

  generatecrop_wise_loss_reporting(totData: any, restDAta: any) {
    const top5: any = {
      categories: totData.cat,
      lossReporting: totData.lossReported,
      noLossReporting: totData.noLossReported,
      yetToComplete: [],
    };
    const rest: any = {
      categories: restDAta.cat,
      lossReporting: restDAta.lossReported,
      noLossReporting: restDAta.noLossReported,
      yetToComplete: [],
    };

    const chartColumnClick = (event: any) => {
      if (event?.point?.category == "Others") {
        this.modalService.open(this.cropSurveyProgressModal, { size: "xl" });
        setTimeout(() => {
          this.generatecrop_wise_loss_reporting_modal(rest);
        }, 500);
      }
    };

    const option = {
      chart: {
        type: "column",
      },
      title: {
        text: "",
      },
      xAxis: {
        categories: top5.categories,
        labels: this.chartlabels,
      },
      legend: {
        reversed: true,
        symbolRadius: 0,
      },
      yAxis: {
        labels: this.chartlabels,
        min: 0,
        title: {
          text: "",
        },
        stackLabels: {
          enabled: false,
        },
      },
      tooltip: {
        headerFormat: "<b>{point.x}</b><br/>",
        pointFormat: "{series.name}: {point.y}",
      },
      plotOptions: {
        column: {
          stacking: "normal",
          dataLabels: {
            enabled: true,
          },
          events: {
            click: function (event: any) {
              chartColumnClick(event);
            },
          },
        },
      },
      series: [
        // {
        //   name: "Yet to start",
        //   color: "#a5a5a5",
        //   data: top5.yetToComplete,
        // },
        {
          name: "No Loss Reported",
          color: "#5b9bd5",
          data: top5.noLossReporting,
        },
        {
          name: "Loss Reported",
          color: "#ed7d31",
          data: top5.lossReporting,
        },
      ],
    };
    this.crop_wise_loss_reporting = new Chart(Object.assign(option));
  }

  generateDistrict_Block_wise_iu_wise_loss_reporting(
    totData: any,
    restData: any
  ) {
    const top5: any = {
      categories: totData.cat,
      lossReporting: totData.lossReported,
      noLossReporting: totData.noLossReported,
      yetToComplete: [],
    };
    const rest: any = {
      categories: restData.cat,
      lossReporting: restData.lossReported,
      noLossReporting: restData.noLossReported,
      yetToComplete: [],
    };

    const chartColumnClick = (event: any) => {
      if (event?.point?.category == "Others") {
        this.modalService.open(this.locationSurveyProgressModal, {
          size: "xl",
        });
        setTimeout(() => {
          this.generateDistrict_Block_wise_iu_wise_loss_reporting_modal(rest);
        }, 500);
      }
    };
    const option = {
      chart: {
        type: "column",
      },
      title: {
        text: "",
      },
      xAxis: {
        categories: top5.categories,
        labels: this.chartlabels,
      },
      yAxis: {
        labels: this.chartlabels,
        min: 0,
        title: {
          text: "",
        },
        stackLabels: {
          enabled: false,
        },
      },

      tooltip: {
        headerFormat: "<b>{point.x}</b><br/>",
        pointFormat: "{series.name}: {point.y}",
      },
      legend: {
        reversed: true,
        symbolRadius: 0,
      },
      plotOptions: {
        column: {
          stacking: "normal",
          dataLabels: {
            enabled: true,
            rotation: 0,
            color: "#000",
            align: "center",
            format: "{point.y}",
            style: {
              fontSize: "10px",
            },
          },
          events: {
            click: function (event: any) {
              chartColumnClick(event);
            },
          },
        },
      },
      series: [
        // {
        //   name: "Yet to start",
        //   color: "#a5a5a5",
        //   data: top5.yetToComplete,
        // },
        {
          name: "No Loss Reported",
          color: "#5b9bd5",
          data: top5.noLossReporting,
        },
        {
          name: "Loss Reported",
          color: "#ed7d31",
          data: top5.lossReporting,
        },
      ],
    };
    this.District_Block_wise_iu_wise_loss_reporting = new Chart(
      Object.assign(option)
    );
  }

  generatetype_of_surveys(totData: any) {
    const types: any[] = [];
    const chartData: any[] = [];

    for (let indx = 0; indx < totData.length; indx++) {
      const tData = totData[indx];
      if (tData?.surveyData?.length) {
        for (let sindx = 0; sindx < tData?.surveyData.length; sindx++) {
          const surveyData = tData?.surveyData[sindx];
          if (surveyData?.field_525) {
            const hasIndex = types.indexOf(surveyData?.field_525);
            if (hasIndex >= 0) {
              chartData[hasIndex].y++;
            } else {
              types.push(surveyData?.field_525);
              chartData.push({ name: surveyData?.field_525, y: 1 });
            }
          }
        }
      }
    }

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
            color: "#000",
            format: "{point.name}: {point.percentage:.1f}%",
          },
          // dataLabels: {
          //   enabled: true,
          //   format: "{point.name}: {point.percentage:.1f}%",
          // },
        },
      },
      legend: {
        symbolRadius: 0,
      },
      tooltip: {
        headerFormat: "",
        pointFormat: `
          <span style="color:{point.color}">{point.name} : <b>{point.y:.1f} ({point.percentage:.1f}%) </b><br/> </span>
          `,
      },
      colors: [
        // "#7a7777",
        // "#e60000",
        // "#c46a0a",
        // "#1cc40a",
        "#ed7d31",
        "#5b9bd5",
        "#FF9655",
        "#FFF263",
        "#6AF9C4",
      ],

      series: [
        {
          type: "pie",
          name: "CLS Survey",
          data: chartData,
          showInLegend: true,
        },
      ],
    };
    this.type_of_surveys = new Chart(Object.assign(option));
  }

  generateCause_of_Loss(chartData: any, otherChartData: any) {
    const chartSeriesClick = (event: any) => {
      if (event?.point?.name == "Others") {
        this.modalService.open(this.causeOfLossModal, { size: "xl" });
        setTimeout(() => {
          this.generateCause_of_Loss_modal(otherChartData);
        }, 500);
      }
    };

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
            rotation: 0,
            color: "#000",
            align: "center",
            format: "{point.name}: {point.percentage:.1f}%",
            y: -5,
            style: {
              fontSize: "10px",
            },
          },
          events: {
            click: function (event: any) {
              chartSeriesClick(event);
            },
          },
          // dataLabels: {
          //   enabled: true,
          //   format: "{point.name}: {point.percentage:.1f}%",
          // },
        },
      },
      legend: {
        symbolRadius: 0,
      },
      tooltip: {
        headerFormat: "",
        pointFormat: `
          <span style="font-size:11px">{point.name} : {point.y} ({point.percentage:.1f}%)</span><br>
          `,
      },

      series: [
        {
          type: "pie",
          name: "Cause of Loss",
          data: chartData,
          showInLegend: true,
        },
      ],
    };
    this.Cause_of_Loss = new Chart(Object.assign(option));
  }

  generateCrop_stage(totData: any, restData: any) {
    const categories: any[] = restData.cat;
    const top5Categories: any[] = totData.cat;
    const series: any[] = [
      {
        name: "Harvest",
        data: restData.harvest,
      },
      {
        name: "Maturity",
        data: restData.maturity,
      },
      {
        name: "Grain Filling",
        data: restData.grain_filling,
      },
      {
        name: "Vegetative",
        data: restData.vegetative,
      },
      {
        name: "Sowing",
        data: restData.sowing,
      },
    ];
    const top5Series: any[] = [
      {
        name: "Harvest",
        data: totData.harvest,
      },
      {
        name: "Maturity",
        data: totData.maturity,
      },
      {
        name: "Grain Filling",
        data: totData.grain_filling,
      },
      {
        name: "Vegetative",
        data: totData.vegetative,
      },
      {
        name: "Sowing",
        data: totData.sowing,
      },
    ];

    const chartColumnClick = (event: any) => {
      if (event?.point?.category == "Others") {
        this.modalService.open(this.modelContent, { size: "xl" });
        setTimeout(() => {
          this.generateCropStageFull(categories, series);
        }, 500);
      }
    };

    const option = {
      chart: {
        type: "bar",
      },
      title: {
        text: "",
      },
      xAxis: {
        categories: top5Categories,
        labels: this.chartlabels
      },
      yAxis: {
        min: 0,
        labels: this.chartlabels,
        title: {
          text: "",
        },
      },
      colors: [
        "#db2742",
        "#c99a7a",
        "#518031",
        "#6bab41",
        "#3f95e0",
        // "#255e91",
        // "#9e480e",
        // "#70ad47",
        // "#ffbf00",
      ],
      legend: {
        reversed: true,
        symbolRadius: 0,
      },
      plotOptions: {
        series: {
          stacking: "normal",
          dataLabels: {
            enabled: true,
          },
          events: {
            click: function (event: any) {
              chartColumnClick(event);
            },
          },
        },
      },
      series: top5Series,
    };

    this.Crop_stage = new Chart(Object.assign(option));
  }

  generatecls_survey_execution(totData: any, restData: any) {
    const top5_cat: any[] = totData.cat.reverse();
    const top5_yettoComplete: any[] = totData.yettoComplete.reverse();
    const top5_morethan40: any[] = totData.morethan40.reverse();
    const top5_day31to40: any[] = totData.day31to40.reverse();
    const top5_day21to30: any[] = totData.day21to30.reverse();
    const top5_day11to20: any[] = totData.day11to20.reverse();
    const top5_upto10: any[] = totData.upto10.reverse();

    const rest_cat: any[] = restData.cat.reverse();
    const rest_yettoComplete: any[] = restData.yettoComplete.reverse();
    const rest_morethan40: any[] = restData.morethan40.reverse();
    const rest_day31to40: any[] = restData.day31to40.reverse();
    const rest_day21to30: any[] = restData.day21to30.reverse();
    const rest_day11to20: any[] = restData.day11to20.reverse();
    const rest_upto10: any[] = restData.upto10.reverse();

    const chartColumnClick = (event: any) => {
      if (event?.point?.category == "Others") {
        this.modalService.open(this.daysModal, { size: "xl" });
        setTimeout(() => {
          this.generatecls_survey_execution_modal(
            rest_cat,
            rest_yettoComplete,
            rest_morethan40,
            rest_day31to40,
            rest_day21to30,
            rest_day11to20,
            rest_upto10
          );
        }, 500);
      }
    };

    const option = {
      chart: {
        type: "bar",
      },
      title: {
        text: "",
      },
      xAxis: {
        categories: top5_cat,
        reversed: false,
        labels: this.chartlabels,
      },
      yAxis: {
        labels: this.chartlabels,
        min: 0,
        title: {
          text: "",
        },
      },
      legend: {
        reversed: true,
        symbolRadius: 0,
      },
      plotOptions: {
        series: {
          stacking: "normal",
          dataLabels: {
            enabled: false,
            rotation: 0,
            color: "#000",
            align: "center",
            format: "{point.y:.0f}",
          },
          events: {
            click: function (event: any) {
              chartColumnClick(event);
            },
          },
        },
      },
      series: [
        {
          name: "Yet to Complete",
          color: "#bdbdbd",
          data: top5_yettoComplete,
        },
        {
          name: ">40 Days",
          color: "#be0000",
          data: top5_morethan40,
        },
        {
          name: "40 Days",
          color: "#ff0000",
          data: top5_day31to40,
        },
        {
          name: "30 Days",
          color: "#f5ba91",
          data: top5_day21to30,
        },
        {
          name: "20 Days",
          color: "#5598d3",
          data: top5_day11to20,
        },
        {
          name: "10 Days",
          color: "#6aaa40",
          data: top5_upto10,
        },
      ],
    };

    this.cls_survey_execution = new Chart(Object.assign(option));
  }
  generatecls_survey_approval(totData: any, restData: any) {
    const top5_cat: any[] = totData.cat.reverse();
    const top5_yettoComplete: any[] = totData.yettoComplete.reverse();
    const top5_morethan40: any[] = totData.morethan40.reverse();
    const top5_day31to40: any[] = totData.day31to40.reverse();
    const top5_day21to30: any[] = totData.day21to30.reverse();
    const top5_day11to20: any[] = totData.day11to20.reverse();
    const top5_upto10: any[] = totData.upto10.reverse();

    const rest_cat: any[] = restData.cat.reverse();
    const rest_yettoComplete: any[] = restData.yettoComplete.reverse();
    const rest_morethan40: any[] = restData.morethan40.reverse();
    const rest_day31to40: any[] = restData.day31to40.reverse();
    const rest_day21to30: any[] = restData.day21to30.reverse();
    const rest_day11to20: any[] = restData.day11to20.reverse();
    const rest_upto10: any[] = restData.upto10.reverse();

    const chartColumnClick = (event: any) => {
      if (event?.point?.category == "Others") {
        this.modalService.open(this.daysApproveModal, { size: "xl" });
        setTimeout(() => {
          this.generatecls_survey_approval_modal(
            rest_cat,
            rest_yettoComplete,
            rest_morethan40,
            rest_day31to40,
            rest_day21to30,
            rest_day11to20,
            rest_upto10
          );
        }, 500);
      }
    };

    const option = {
      chart: {
        type: "bar",
      },
      title: {
        text: "",
      },
      xAxis: {
        categories: top5_cat,
        reversed: false,
        labels: this.chartlabels,
      },
      yAxis: {
        labels: this.chartlabels,
        min: 0,
        title: {
          text: "",
        },
      },
      legend: {
        reversed: true,
        symbolRadius: 0,
      },
      plotOptions: {
        series: {
          stacking: "normal",
          dataLabels: {
            enabled: false,
            rotation: 0,
            color: "#000",
            align: "center",
            format: "{point.y:.0f}",
          },
          events: {
            click: function (event: any) {
              chartColumnClick(event);
            },
          },
        },
      },
      series: [
        {
          name: "Yet to Complete",
          color: "#bdbdbd",
          data: top5_yettoComplete,
        },
        {
          name: ">40 Days",
          color: "#be0000",
          data: top5_morethan40,
        },
        {
          name: "40 Days",
          color: "#ff0000",
          data: top5_day31to40,
        },
        {
          name: "30 Days",
          color: "#f5ba91",
          data: top5_day21to30,
        },
        {
          name: "20 Days",
          color: "#5598d3",
          data: top5_day11to20,
        },
        {
          name: "10 Days",
          color: "#6aaa40",
          data: top5_upto10,
        },
      ],
    };

    this.cls_survey_approval = new Chart(Object.assign(option));
  }
  generatecls_survey_approval_progress(totData: any, restData: any) {
    const top5_cat: any[] = totData.cat.reverse();
    const top5_approved: any[] = totData.approved.reverse();
    const top5_pending: any[] = totData.pending.reverse();
    const top5_rejected: any[] = totData.rejected.reverse();
    const top5_draft: any[] = totData.draft.reverse();
    const top5_not_surveyed: any[] = totData.not_surveyed.reverse();

    const rest_cat: any[] = restData.cat.reverse();
    const rest_approved: any[] = restData.approved.reverse();
    const rest_pending: any[] = restData.pending.reverse();
    const rest_rejected: any[] = restData.rejected.reverse();
    const rest_draft: any[] = restData.draft.reverse();
    const rest_not_surveyed: any[] = restData.not_surveyed.reverse();

    const chartColumnClick = (event: any) => {
      if (event?.point?.category == "Others") {
        this.modalService.open(this.daysApproveProgressModal, { size: "xl" });
        setTimeout(() => {
          this.generatecls_survey_approval_progress_modal(
            rest_cat,
            rest_approved,
            rest_pending,
            rest_rejected,
            rest_draft,
            rest_not_surveyed,
          );
        }, 500);
      }
    };

    const option = {
      chart: {
        type: "bar",
      },
      title: {
        text: "",
      },
      xAxis: {
        categories: top5_cat,
        reversed: false,
        labels: this.chartlabels,
      },
      yAxis: {
        labels: this.chartlabels,
        min: 0,
        title: {
          text: "",
        },
      },
      legend: {
        reversed: true,
        symbolRadius: 0,
      },
      plotOptions: {
        series: {
          stacking: "normal",
          dataLabels: {
            enabled: false,
            rotation: 0,
            color: "#000",
            align: "center",
            format: "{point.y:.0f}",
          },
          events: {
            click: function (event: any) {
              chartColumnClick(event);
            },
          },
        },
      },
      series: [
        {
          name: "Approved",
          color: "#5598d3",
          data: top5_approved,
        },
        {
          name: "Rejected",
          color: "#ed833a",
          data: top5_rejected,
        },
        {
          name: "Pending",
          color: "#ffe699",
          data: top5_pending,
        },
        {
          name: "Draft",
          color: "#6aaa40",
          data: top5_draft,
        },
        {
          name: "Not Surveyed",
          color: "#bdbdbd",
          data: top5_not_surveyed,
        },
      ],
    };

    this.cls_survey_approval_progress = new Chart(Object.assign(option));
  }

  generatecls_agency_approval_progress(totData: any, restData: any) {
    const top5_cat: any[] = totData.cat.reverse();
    const top5_approved: any[] = totData.approved.reverse();
    const top5_pending: any[] = totData.pending.reverse();
    const top5_rejected: any[] = totData.rejected.reverse();
    const top5_draft: any[] = totData.draft.reverse();
    const top5_not_surveyed: any[] = totData.not_surveyed.reverse();

    const rest_cat: any[] = restData.cat.reverse();
    const rest_approved: any[] = restData.approved.reverse();
    const rest_pending: any[] = restData.pending.reverse();
    const rest_rejected: any[] = restData.rejected.reverse();
    const rest_draft: any[] = restData.draft.reverse();
    const rest_not_surveyed: any[] = restData.not_surveyed.reverse();

    const chartColumnClick = (event: any) => {
      if (event?.point?.category == "Others") {
        this.modalService.open(this.agencySurveyProgressModal, { size: "xl" });
        setTimeout(() => {
          this.generatecls_agency_approval_progress_modal(
            rest_cat,
            rest_approved,
            rest_pending,
            rest_rejected,
            rest_draft,
            rest_not_surveyed,
          );
        }, 500);
      }
    };

    const option = {
      chart: {
        type: "bar",
      },
      title: {
        text: "",
      },
      xAxis: {
        categories: top5_cat,
        reversed: false,
        labels: this.chartlabels,
      },
      yAxis: {
        labels: this.chartlabels,
        min: 0,
        title: {
          text: "",
        },
      },
      legend: {
        reversed: true,
        symbolRadius: 0,
      },
      plotOptions: {
        series: {
          stacking: "normal",
          dataLabels: {
            enabled: false,
            rotation: 0,
            color: "#000",
            align: "center",
            format: "{point.y:.0f}",
          },
          events: {
            click: function (event: any) {
              chartColumnClick(event);
            },
          },
        },
      },
      series: [
        {
          name: "Approved",
          color: "#5598d3",
          data: top5_approved,
        },
        {
          name: "Rejected",
          color: "#ed833a",
          data: top5_rejected,
        },
        {
          name: "Pending",
          color: "#ffe699",
          data: top5_pending,
        },
        {
          name: "Draft",
          color: "#6aaa40",
          data: top5_draft,
        },
        {
          name: "Not Surveyed",
          color: "#bdbdbd",
          data: top5_not_surveyed,
        },
      ],
    };

    this.agency_survey_approval_progress = new Chart(Object.assign(option));
  }

  generateCrop_wise_claim_assessment(totData: any, restData: any) {
    const top5: any = {
      categories: totData.cat,
      noLoss: [],
      claimAmount: totData.claim_amount,
      lossRatio: totData.loss_ratio.map((d: any) => d * 100),
    };
    const rest: any = {
      categories: restData.cat,
      noLoss: [],
      claimAmount: restData.claim_amount,
      lossRatio: restData.loss_ratio.map((d: any) => d * 100),
    };

    const chartColumnClick = (event: any) => {
      if (event?.point?.category == "Others") {
        this.modalService.open(this.cropCliamAmountModal, { size: "xl" });
        setTimeout(() => {
          this.generateCrop_wise_claim_assessment_modal(rest);
        }, 500);
      }
    };

    const option = {
      title: {
        text: "",
      },
      xAxis: {
        categories: top5.categories,
        labels: this.chartlabels
      },
      // yAxis: {
      //   min: 0,
      //   title: {
      //     text: ''
      //   },
      // },
      yAxis: [
        {
          gridLineWidth: 0,
          min: 0,
          labels: this.chartlabels,
          title: {
            text: "",
          },
        },
        {
          gridLineWidth: 0,
          min: 0,
          opposite: true,
          labels: {
            style: this.chartStyle,
            format: "{value}%",
          },
          title: {
            text: "",
          },
        },
      ],
      plotOptions: {
        column: {
          stacking: "normal",
          dataLabels: {
            enabled: true,
            rotation: 0,
            color: "#000",
            align: "center",
            format: "{point.y:.1f}",
            y: -5,
            style: {
              fontSize: "10px",
            },
          },
          events: {
            click: function (event: any) {
              chartColumnClick(event);
            },
          },
        },
      },
      legend: {
        symbolRadius: 0,
      },
      labels: {
        items: [
          {
            html: "",
            style: {
              left: "50px",
              top: "18px",
            },
          },
        ],
      },
      tooltip: {
        pointFormat: "{series.name}: {point.label}",
      },

      series: [
        // {
        //   type: "column",
        //   color: "#5b9bd5",
        //   name: "No loss Exposure",
        //   data: top5.noLoss.map((d: any) => ({y: d, label: this.abbreviateNumber(d)})),
        //   dataLabels: [{
        //     align: 'left',
        //     format: '{point.label}'
        // }]
        // },
        {
          type: "column",
          color: "#ed7d31",
          name: "Claim amount",
          data: top5.claimAmount.map((d: any) => ({
            y: d,
            label: this.abbreviateNumber(d),
          })),
          dataLabels: [
            {
              align: "center",
              format: "{point.label}",
            },
          ],
        },
        {
          type: "spline",
          name: "Loss Ratio (%)",
          data: top5.lossRatio.map((d: any) => ({
            y: d,
            label: this.abbreviateNumber(d),
          })),
          dataLabels: [
            {
              align: "center",
              format: "{point.label}",
            },
          ],
          yAxis: 1,
          marker: {
            lineWidth: 4,
            fillColor: "gray",
          },
        },
      ],
    };
    this.Crop_wise_claim_assessment = new Chart(Object.assign(option));
  }

  generateDistrict_wise_Claim_Assessment(totData: any, restData: any) {
    const top5: any = {
      categories: totData.cat,
      noLoss: [],
      claimAmount: totData.claim_amount,
      lossRatio: totData.loss_ratio.map((d: any) => d * 100),
    };
    const rest: any = {
      categories: restData.cat,
      noLoss: [],
      claimAmount: restData.claim_amount,
      lossRatio: restData.loss_ratio.map((d: any) => d * 100),
    };

    const chartColumnClick = (event: any) => {
      if (event?.point?.category == "Others") {
        this.modalService.open(this.locationCliamAmountModal, { size: "xl" });
        setTimeout(() => {
          this.generateDistrict_wise_Claim_Assessment_modal(rest);
        }, 500);
      }
    };

    const option = {
      title: {
        text: "",
      },
      xAxis: {
        categories: top5.categories,
        labels: this.chartlabels,
      },
      // yAxis: {
      //   min: 0,
      //   title: {
      //     text: ''
      //   },
      // },
      yAxis: [
        {
          gridLineWidth: 0,
          min: 0,
          labels: this.chartlabels,
          title: {
            text: "",
          },
        },
        {
          gridLineWidth: 0,
          min: 0,
          opposite: true,
          labels: {
            style: this.chartStyle,
            format: "{value}%",
          },
          title: {
            text: "",
          },
        },
      ],
      plotOptions: {
        column: {
          stacking: "normal",
          dataLabels: {
            enabled: true,
            rotation: 0,
            color: "#000",
            align: "center",
            format: "{point.label}",
            y: -5,
            style: {
              fontSize: "10px",
            },
          },
          events: {
            click: function (event: any) {
              chartColumnClick(event);
            },
          },
        },
      },
      legend: {
        symbolRadius: 0,
      },
      labels: {
        items: [
          {
            html: "",
            style: {
              left: "50px",
              top: "18px",
            },
          },
        ],
      },

      tooltip: {
        pointFormat: "{series.name}: {point.label}",
      },

      series: [
        // {
        //   type: "column",
        //   name: "No loss Exposure",
        //   color: "#5b9bd5",
        //   data: top5.noLoss.map((d: any) => ({y: d, label: this.abbreviateNumber(d)})),
        // },
        {
          type: "column",
          name: "Claim amount",
          color: "#ed7d31",
          data: top5.claimAmount.map((d: any) => ({
            y: d,
            label: this.abbreviateNumber(d),
          })),
        },
        {
          type: "spline",
          name: "Loss Ratio (%)",
          data: top5.lossRatio.map((d: any) => ({
            y: d,
            label: this.abbreviateNumber(d),
          })),
          yAxis: 1,
          dataLabels: [
            {
              align: "left",
              format: "{point.label}",
            },
          ],
          marker: {
            lineWidth: 2,
            fillColor: "gray",
          },
        },
      ],
    };
    this.District_wise_Claim_Assessment = new Chart(Object.assign(option));
  }

  generateSurvey_Completion_over_time(totData: any) {
    const completed: any[] = totData.completed;
    const yetToStart: any[] = [];
    const lossRatio: any[] = totData.loss_ratio.map((d: number) => +d.toFixed(2));
    const catDates: any[] = totData.cat;

    const approved: any[] = totData.approved;
    const rejected: any[] = totData.rejected;
    const pending: any[] = totData.pending;
    const draft: any[] = totData.draft;
    const not_surveyed: any[] = totData.not_surveyed;

    const option = {
      chart: {
        paddingRight: 50,
        paddingLeft: 20,
      },
      title: {
        text: "",
      },
      xAxis: {
        // categories: dates,
        categories: catDates,
        labels: this.chartlabels
      },
      // yAxis: {
      //   min: 0,
      //   title: {
      //     text: ''
      //   },
      // },
      yAxis: [
        {
          gridLineWidth: 0,
          min: 0,
          labels: this.chartlabels,
          title: {
            text: "",
          },
        },
        {
          gridLineWidth: 0,
          min: 0,
          opposite: true,
          labels: {
            style: this.chartStyle,
            format: "{value}%",
          },
          title: {
            text: "",
          },
        },
      ],
      plotOptions: {
        column: {
          stacking: "normal",
          dataLabels: {
            enabled: true,
            rotation: 0,
            color: "#000",
            align: "center",
            format: "{point.y:.0f}",
            y: -5,
            style: {
              fontSize: "10px",
            },
          },
        },
      },
      legend: {
        symbolRadius: 0,
      },

      labels: {
        items: [
          {
            html: "",
            style: {
              left: "50px",
              top: "18px",
              color: "#000",
            },
          },
        ],
      },

      series: [
        {
          type: "column",
          color: "#5b9bd5",
          name: "Approved",
          data: approved,
        },
        {
          type: "column",
          color: "#ed833a",
          name: "Rejected",
          data: rejected,
        },
        {
          type: "column",
          color: "#ffe699",
          name: "Pending",
          data: pending,
        },
        {
          type: "column",
          color: "#9d8968",
          name: "Draft",
          data: draft,
        },
        {
          type: "column",
          color: "#bdbdbd",
          name: "Not Surveyed",
          data: not_surveyed,
        },
        
        // {
        //   type: "column",
        //   color: "#ed7d31",
        //   name: "Survey Completed",
        //   data: completed,
        // },
        // {
        //   type: "spline",
        //   name: "Loss Ratio (%)",
        //   data: lossRatio,
        //   yAxis: 1,
        // },
      ],
    };
    this.Survey_Completion_over_time = new Chart(Object.assign(option));
  }

  generateCropStageFull(categories: any, series: any) {
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
        labels: this.chartlabels,
        title: {
          text: "",
        },
      },
      colors: ["#db2742", "#c99a7a", "#518031", "#6bab41", "#3f95e0"],
      legend: {
        reversed: true,
        symbolRadius: 0,
      },
      plotOptions: {
        series: {
          stacking: "normal",
          dataLabels: {
            enabled: true,
          },
        },
      },
      series,
    };

    this.CropStageFull = new Chart(Object.assign(option));
  }

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

  clearDetail() {
    this.timestamp = null;
    this.minDate = null;
    this.maxDate = null;
    this.t_8Days = null;
    this.surveyData = [];
    this.allData = [];
    this.revisitData = [];
    this.surveyLocation = [];
    if (this.mapDetail) {
      this.mapDetail.clearDetail();
    }
  }
  generatecls_survey_execution_modal(
    cat: any,
    yettoComplete: any,
    morethan40: any,
    day31to40: any,
    day21to30: any,
    day11to20: any,
    upto10: any
  ) {
    const option = {
      chart: {
        type: "bar",
      },
      title: {
        text: "",
      },
      xAxis: {
        categories: cat,
        reversed: false,
        labels: this.chartlabels,
      },
      yAxis: {
        labels: this.chartlabels,
        min: 0,
        title: {
          text: "",
        },
      },
      legend: {
        reversed: true,
        symbolRadius: 0,
      },
      plotOptions: {
        series: {
          stacking: "normal",
          dataLabels: {
            enabled: false,
            rotation: 0,
            color: "#000",
            align: "center",
            format: "{point.y:.0f}",
          },
        },
      },
      series: [
        {
          name: "Yet to Complete",
          color: "#bdbdbd",
          data: yettoComplete,
        },
        {
          name: ">40 Days",
          color: "#be0000",
          data: morethan40,
        },
        {
          name: "40 Days",
          color: "#ff0000",
          data: day31to40,
        },
        {
          name: "30 Days",
          color: "#f5ba91",
          data: day21to30,
        },
        {
          name: "20 Days",
          color: "#5598d3",
          data: day11to20,
        },
        {
          name: "10 Days",
          color: "#6aaa40",
          data: upto10,
        },
      ],
    };

    this.cls_survey_execution_modal = new Chart(Object.assign(option));
  }

  generatecls_survey_approval_modal(
    cat: any,
    yettoComplete: any,
    morethan40: any,
    day31to40: any,
    day21to30: any,
    day11to20: any,
    upto10: any
  ) {
    const option = {
      chart: {
        type: "bar",
      },
      title: {
        text: "",
      },
      xAxis: {
        categories: cat,
        reversed: false,
        labels: this.chartlabels,
      },
      yAxis: {
        labels: this.chartlabels,
        min: 0,
        title: {
          text: "",
        },
      },
      legend: {
        reversed: true,
        symbolRadius: 0,
      },
      plotOptions: {
        series: {
          stacking: "normal",
          dataLabels: {
            enabled: false,
            rotation: 0,
            color: "#000",
            align: "center",
            format: "{point.y:.0f}",
          },
        },
      },
      series: [
        {
          name: "Yet to Complete",
          color: "#bdbdbd",
          data: yettoComplete,
        },
        {
          name: ">40 Days",
          color: "#be0000",
          data: morethan40,
        },
        {
          name: "40 Days",
          color: "#ff0000",
          data: day31to40,
        },
        {
          name: "30 Days",
          color: "#f5ba91",
          data: day21to30,
        },
        {
          name: "20 Days",
          color: "#5598d3",
          data: day11to20,
        },
        {
          name: "10 Days",
          color: "#6aaa40",
          data: upto10,
        },
      ],
    };

    this.cls_survey_approval_modal = new Chart(Object.assign(option));
  }
  generatecls_survey_approval_progress_modal(
    cat: any,
    approved: any,
    pending: any,
    rejected: any,
    draft: any,
    not_surveyed: any,
  ) {
    const option = {
      chart: {
        type: "bar",
      },
      title: {
        text: "",
      },
      xAxis: {
        categories: cat,
        reversed: false,
        labels: this.chartlabels,
      },
      yAxis: {
        labels: this.chartlabels,
        min: 0,
        title: {
          text: "",
        },
      },
      legend: {
        reversed: true,
        symbolRadius: 0,
      },
      plotOptions: {
        series: {
          stacking: "normal",
          dataLabels: {
            enabled: false,
            rotation: 0,
            color: "#000",
            align: "center",
            format: "{point.y:.0f}",
          },
        },
      },
      series: [
        {
          name: "Approved",
          color: "#5598d3",
          data: approved,
        },
        {
          name: "Rejected",
          color: "#ed833a",
          data: rejected,
        },
        {
          name: "Pending",
          color: "#ffe699",
          data: pending,
        },
        {
          name: "Draft",
          color: "#6aaa40",
          data: draft,
        },
        {
          name: "Not Surveyed",
          color: "#bdbdbd",
          data: not_surveyed,
        },
      ],
    };

    this.cls_survey_approval_progress_modal = new Chart(Object.assign(option));
  }

  generatecls_agency_approval_progress_modal(
    cat: any,
    approved: any,
    pending: any,
    rejected: any,
    draft: any,
    not_surveyed: any,
  ) {
    const option = {
      chart: {
        type: "bar",
      },
      title: {
        text: "",
      },
      xAxis: {
        categories: cat,
        reversed: false,
        labels: this.chartlabels,
      },
      yAxis: {
        labels: this.chartlabels,
        min: 0,
        title: {
          text: "",
        },
      },
      legend: {
        reversed: true,
        symbolRadius: 0,
      },
      plotOptions: {
        series: {
          stacking: "normal",
          dataLabels: {
            enabled: false,
            rotation: 0,
            color: "#000",
            align: "center",
            format: "{point.y:.0f}",
          },
        },
      },
      series: [
        {
          name: "Approved",
          color: "#5598d3",
          data: approved,
        },
        {
          name: "Rejected",
          color: "#ed833a",
          data: rejected,
        },
        {
          name: "Pending",
          color: "#ffe699",
          data: pending,
        },
        {
          name: "Draft",
          color: "#6aaa40",
          data: draft,
        },
        {
          name: "Not Surveyed",
          color: "#bdbdbd",
          data: not_surveyed,
        },
      ],
    };

    this.agency_survey_approval_progress_modal = new Chart(Object.assign(option));
  }

  generateDistrict_Block_wise_iu_wise_loss_reporting_modal(chartData: any) {
    const option = {
      chart: {
        type: "column",
      },
      title: {
        text: "",
      },
      xAxis: {
        categories: chartData.categories,
        labels: this.chartlabels,
      },
      yAxis: {
        labels: this.chartlabels,
        min: 0,
        title: {
          text: "",
        },
        stackLabels: {
          enabled: false,
        },
      },

      tooltip: {
        headerFormat: "<b>{point.x}</b><br/>",
        pointFormat: "{series.name}: {point.y}",
      },
      legend: {
        reversed: true,
        symbolRadius: 0,
      },
      plotOptions: {
        column: {
          stacking: "normal",
          dataLabels: {
            enabled: true,
            rotation: 0,
            color: "#000",
            align: "center",
            format: "{point.y}",
            style: {
              fontSize: "10px",
            },
          },
        },
      },
      series: [
        // {
        //   name: "Yet to start",
        //   color: "#a5a5a5",
        //   data: chartData.yetToComplete,
        // },
        {
          name: "No Loss Reported",
          color: "#5b9bd5",
          data: chartData.noLossReporting,
        },
        {
          name: "Loss Reported",
          color: "#ed7d31",
          data: chartData.lossReporting,
        },
      ],
    };
    this.District_Block_wise_iu_wise_loss_reporting_modal = new Chart(
      Object.assign(option)
    );
  }

  generatecrop_wise_loss_reporting_modal(chartData: any) {
    const option = {
      chart: {
        type: "column",
      },
      title: {
        text: "",
      },
      xAxis: {
        categories: chartData.categories,
        labels: this.chartlabels,
      },
      legend: {
        reversed: true,
        symbolRadius: 0,
      },
      yAxis: {
        labels: this.chartlabels,
        min: 0,
        title: {
          text: "",
        },
        stackLabels: {
          enabled: false,
        },
      },
      tooltip: {
        headerFormat: "<b>{point.x}</b><br/>",
        pointFormat: "{series.name}: {point.y}",
      },
      plotOptions: {
        column: {
          stacking: "normal",
          dataLabels: {
            enabled: true,
          },
        },
      },
      series: [
        // {
        //   name: "Yet to start",
        //   color: "#a5a5a5",
        //   data: chartData.yetToComplete,
        // },
        {
          name: "No Loss Reported",
          color: "#5b9bd5",
          data: chartData.noLossReporting,
        },
        {
          name: "Loss Reported",
          color: "#ed7d31",
          data: chartData.lossReporting,
        },
      ],
    };
    this.crop_wise_loss_reporting_modal = new Chart(Object.assign(option));
  }

  generateCrop_wise_claim_assessment_modal(chartData: any) {
    const option = {
      title: {
        text: "",
      },
      xAxis: {
        categories: chartData.categories,
        labels: this.chartlabels
      },
      yAxis: [
        {
          gridLineWidth: 0,
          min: 0,
          labels: this.chartlabels,
          title: {
            text: "",
          },
        },
        {
          gridLineWidth: 0,
          min: 0,
          opposite: true,
          labels: {
            style: this.chartStyle,
            format: "{value}%",
          },
          title: {
            text: "",
          },
        },
      ],
      plotOptions: {
        column: {
          stacking: "normal",
          dataLabels: {
            enabled: true,
            rotation: 0,
            color: "#000",
            align: "center",
            format: "{point.y:.1f}",
            y: -5,
            style: {
              fontSize: "10px",
            },
          },
        },
      },
      legend: {
        symbolRadius: 0,
      },
      labels: {
        items: [
          {
            html: "",
            style: {
              left: "50px",
              top: "18px",
            },
          },
        ],
      },
      tooltip: {
        pointFormat: "{series.name}: {point.label}",
      },

      series: [
        // {
        //   type: "column",
        //   color: "#5b9bd5",
        //   name: "No loss Exposure",
        //   data: chartData.noLoss.map((d: any) => ({y: d, label: this.abbreviateNumber(d)})),
        //   dataLabels: [{
        //     align: 'left',
        //     format: '{point.label}'
        // }]
        // },
        {
          type: "column",
          color: "#ed7d31",
          name: "Claim amount",
          data: chartData.claimAmount.map((d: any) => ({
            y: d,
            label: this.abbreviateNumber(d),
          })),
          dataLabels: [
            {
              align: "left",
              format: "{point.label}",
            },
          ],
        },
        {
          type: "spline",
          name: "Loss Ratio (%)",
          data: chartData.lossRatio.map((d: any) => ({
            y: d,
            label: this.abbreviateNumber(d),
          })),
          dataLabels: [
            {
              align: "left",
              format: "{point.label}",
            },
          ],
          yAxis: 1,
          marker: {
            lineWidth: 4,
            fillColor: "gray",
          },
        },
      ],
    };
    this.Crop_wise_claim_assessment_modal = new Chart(Object.assign(option));
  }

  generateDistrict_wise_Claim_Assessment_modal(chartData: any) {
    const option = {
      title: {
        text: "",
      },
      xAxis: {
        categories: chartData.categories,
        labels: this.chartlabels,
      },
      yAxis: [
        {
          gridLineWidth: 0,
          min: 0,
          labels: this.chartlabels,
          title: {
            text: "",
          },
        },
        {
          gridLineWidth: 0,
          min: 0,
          opposite: true,
          labels: {
            format: "{value}%",
            style: this.chartStyle,
          },
          title: {
            text: "",
          },
        },
      ],
      plotOptions: {
        column: {
          stacking: "normal",
          dataLabels: {
            enabled: true,
            rotation: 0,
            color: "#000",
            align: "center",
            format: "{point.label}",
            y: -5,
            style: {
              fontSize: "10px",
            },
          },
        },
      },
      legend: {
        symbolRadius: 0,
      },
      labels: {
        items: [
          {
            html: "",
            style: {
              left: "50px",
              top: "18px",
            },
          },
        ],
      },

      tooltip: {
        pointFormat: "{series.name}: {point.label}",
      },

      series: [
        // {
        //   type: "column",
        //   name: "No loss Exposure",
        //   color: "#5b9bd5",
        //   data: chartData.noLoss.map((d: any) => ({y: d, label: this.abbreviateNumber(d)})),
        // },
        {
          type: "column",
          name: "Claim amount",
          color: "#ed7d31",
          data: chartData.claimAmount.map((d: any) => ({
            y: d,
            label: this.abbreviateNumber(d),
          })),
        },
        {
          type: "spline",
          name: "Loss Ratio (%)",
          data: chartData.lossRatio.map((d: any) => ({
            y: d,
            label: this.abbreviateNumber(d),
          })),
          yAxis: 1,
          dataLabels: [
            {
              align: "left",
              format: "{point.label}",
            },
          ],
          marker: {
            lineWidth: 2,
            fillColor: "gray",
          },
        },
      ],
    };
    this.District_wise_Claim_Assessment_modal = new Chart(
      Object.assign(option)
    );
  }

  generateCause_of_Loss_modal(chartData: any) {
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
            rotation: 0,
            color: "#000",
            align: "center",
            format: "{point.name}: {point.percentage:.1f}%",
            y: -5,
            style: {
              fontSize: "10px",
            },
          },
        },
      },
      legend: {
        symbolRadius: 0,
      },
      tooltip: {
        headerFormat: "",
        pointFormat: `
          <span style="font-size:11px">{point.name} : {point.y} ({point.percentage:.1f}%)</span><br>
          `,
      },

      series: [
        {
          type: "pie",
          name: "Cause of Loss",
          data: chartData,
          showInLegend: true,
        },
      ],
    };
    this.Cause_of_Loss_modal = new Chart(Object.assign(option));
  }

  setDefaultLocation() {
    const location = this.userDetail.getLocation();
    if (location?.states) {
      this.selectedState = this.states;
      this.onStateChange(this.selectedState);
      if (location?.districts) {
        this.selectedDistrict = this.districts;
        this.onDistrictChange(this.selectedDistrict);
      }
    }
  }

  getLoaedFileData() {
    if (![1, 2, 3, 4].includes(+this.user.user_role)) {
      return;
    }
    const request = {
      purpose: "dashboard_1",
      survey_id: 2,
      "client_id": this.projectContext === 'munichre' ? this.user.unit_id : '2000',
    };
    // const fileName = this.user.unit_id
    //   ? `${this.user.unit_id}_cls_chart_data`
    //   : "cls_chart_data";
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
          this.locationLabel = "State";
          this.generateSurvey_Completion_over_time(
            chartData.date_wise_loss_ratio
          );
          if (chartData.survey_completed_in_days_top_5) {
            this.generatecls_survey_execution(
              chartData.survey_completed_in_days_top_5,
              chartData.survey_completed_in_days_rest
            );
          }
          if (chartData.survey_approved_in_days_top_5) {
            this.generatecls_survey_approval(
              chartData.survey_approved_in_days_top_5,
              chartData.survey_approved_in_days_rest
            );
          }
          if (chartData.survey_approved_in_days_top_5) {
            this.generatecls_survey_approval_progress(
              chartData.cls_location_wise_survey_progress_top_5,
              chartData.cls_location_wise_survey_progress_rest
            );
          }
          if (chartData.agency_wise_survey_progress_top_5) {
            this.generatecls_agency_approval_progress(
              chartData.agency_wise_survey_progress_top_5,
              chartData.agency_wise_survey_progress_rest
            );
          }
          if (chartData.cls_location_progress_survey_top_5) {
            this.generateDistrict_Block_wise_iu_wise_loss_reporting(
              chartData.cls_location_progress_survey_top_5,
              chartData.cls_location_progress_survey_rest
            );
          }
          this.generatecrop_wise_loss_reporting(
            chartData.cls_crop_progress_survey_top_5,
            chartData.cls_crop_progress_survey_rest
          );
          this.generateCause_of_Loss(
            chartData.cause_of_loss_top,
            chartData.cause_of_loss_other
          );
          this.generateDistrict_wise_Claim_Assessment(
            chartData.location_claim_amount_top_5,
            chartData.location_claim_amount_rest
          );
          this.generateCrop_wise_claim_assessment(
            chartData.crop_claim_amount_top_5,
            chartData.crop_claim_amount_rest
          );
          this.generateCrop_stage(
            chartData.crop_state_wise_top_5,
            chartData.crop_state_wise_rest
          );
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

  get deactiveField() {
    return this.singleYear && this.singleseason && this.selectedAgency?.length;
  }

  divide = (numerator: number, denominator: number) =>
    denominator == 0 ? 0 : numerator / denominator;
}
