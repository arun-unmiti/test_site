import { Component, OnInit, ViewChild } from "@angular/core";
import { MultiSelectModule } from "primeng/multiselect";
import { Chart } from "angular-highcharts";
import * as Highcharts from "highcharts";
import * as moment from "moment";
import { CoreService } from "../utilities/core.service";
import { FilterService } from "../utilities/filter.service";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import * as XLSX from 'xlsx';
import { UserDetailService } from "../auth/user-detail.service";
import { FeatureToggleService } from "../shared/services/feature-toggle.service";
import { environment, ProjectContext } from "../../environments/environment";

@Component({
  selector: "app-cce-dashboard",
  templateUrl: "./cce-dashboard.component.html",
  styleUrls: ["./cce-dashboard.component.css"],
})
export class CceDashboardComponent implements OnInit {
  @ViewChild("mapDetail") mapDetail: any;
  states: any[] = [];
  districts: any[] = [];
  blocks: any[] = [];
  crops: any[] = [];

  districtOptions: any[] = [];
  blockOptions: any[] = [];
  yearOptions: any[] = [];
  seasonOptions: any[] = [];

  selectedCities: any;

  selectedState: any[] = [];
  selectedDistrict: any[] = [];
  selectedBlock: any[] = [];
  selectedTehsil: any[] = [];
  selectedCrop: any[] = [];
  dataCrops: any[] = [];
  selectedSI: any = "";
  selectedYear: any[] = [];
  selectedseason: any[] = [];

  sIOptions: any[] = [];

  tehsils: any[] = [];

  tehsilOptions: any[] = [];

  selectedDate: any = {
    startDate: moment().subtract(29, "days"),
    endDate: moment(),
  };
  localeValue = {
    format: "DD/MM/YYYY",
    displayFormat: "DD-MM-YYYY",
    separator: " - ",
    cancelLabel: "Cancel",
    applyLabel: "Okay",
  };

  State_level_exposure: any;
  State_level_planened: any;

  loss_no_of_iu: any;
  No_loss_no_of_iu: any;
  Loss_Ratio_all_crop_wise: any;

  Ius_all_planned_cce_completed: any;
  Loss_ratio: any;
  Loss_ratio_modal: any;

  Claim_Amount: any;
  Loss_Ratio_over_time: any;
  ius_having_loss_and_no_loss: any;
  ius_having_loss_and_no_loss_modal: any;

  Loss_Ratio_crop_wise: any;

  locationCompletionRatioChart: any;
  locationCompletionRatioChart_modal: any;
  cropCompletionRatioChart: any;
  cropCompletionRatioChart_modal: any;

  loading = 0;
  croploading = 0;
  locationloading = 0;
  active = 1;
  labels: any;
  cities: any;

  Resurvey_time: any;
  Change_in_crop_health: any;
  districtWiseCompletion: any;

  allData: any[] = [];
  surveyData: any[] = [];
  surveyLocation: any[] = [];
  fields: any[] = [];
  revisitData: any[] = [];
  revisitMap: Map<any, any> = new Map();

  cropOptions: any[] = [];
  selectedNotifieldUnit: any[] = [];

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

  notifiedUnit: any[] = [];

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

  @ViewChild("content") modelContent: any;
  @ViewChild("actualExpectedLossModal") actualExpectedLossModal: any;
  @ViewChild("cceExposureModal") cceExposureModal: any;
  @ViewChild("noOfCCEModal") noOfCCEModal: any;
  @ViewChild("cceProgressModal") cceProgressModal: any;

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
  stateDashboardData: any[] = [];
  districtDashboardData: any[] = [];
  tehsilDashboardData: any[] = [];
  cropDashboardData: any[] = [];
  totData: any[] = [];

  clientData: any[] = [];
  selectedClient: any[] = [];
  clientStates: any[] = [];
  clientDistricts: any[] = [];
  user: any;
  locationLabel: string = "";
  isFileData = false;

  minDate: any;
  maxDate: any;
  t_8Days: any;

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
    this.getLocalFile();
    this.getLocationCropData();
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
      this.cropsMap.set(d.crop_code, d.crop_name)
    );

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

  getLocalFile() {
    if (![1,2,3,4].includes(+this.user.user_role)) {
      return
    }
    const request = {
      "purpose" : "dashboard_1",
      "survey_id" : 3,
      "client_id": this.projectContext === 'munichre' ? this.user.unit_id : '2000',
      }
    // const fileName = this.user.unit_id ? `${this.user.unit_id}_cce_chart_data` : 'cce_chart_data';
    this.loading++;
    this.core
      .post(request)
      // .getLocalDataFile(fileName)
      .then((response: any) => {
        if (response) {
         const  data = response.data.find((d: any) => d.client_id == request.client_id)?.data;
        const chartData: any = data ? JSON.parse(data) : {};
        //  const  chartData = response;
          this.labels = chartData.labels;
          setTimeout(() => {
            this.locationLabel = "State";
            this.generateLoss_Ratio_over_time(chartData.loss_ratio_over_time);
            this.generateLoss_ratio(
              chartData.location_wise_loss_ratio_top_5,
              chartData.location_wise_loss_ratio_top_5
            );
            this.generateLoss_Ratio_crop_wise(
              chartData.crop_wise_loss_ratio_top_5,
              chartData.crop_wise_loss_ratio_rest
            );
            this.generateLocationCompletionRatio(
              chartData.planed_and_cowitnessed_top_5,
              chartData.planed_and_cowitnessed_rest
            );
            this.generateCropCompletionRatio(
              chartData.no_of_planed_and_cowitnessed_top_5,
              chartData.no_of_planed_and_cowitnessed_rest
            );
            this.generateIus_all_planned_cce_completed(
              chartData.location_wise_completion
            );
            this.generateClaim_Amount(chartData.location_wise_claim_amount);
            this.generateius_having_loss_and_no_loss(
              chartData.location_cce_progress_top_5,
              chartData.location_cce_progress_rest
            );
          });
          if (chartData.timestamp) {
            this.timestamp = moment(chartData.timestamp).format('DD/MM/YYYY');
          }
          this.isFileData = true;
        }
      })
      .catch((err) => {
        console.log(err);
      })
      .finally(() => this.loading--);
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
  onSearch() {
    if (!this.selectedState?.length) {
      this.core.toast("warn", "Please select at least one state");
      return;
    }

    this.clearDetail();
    this.timestamp = null;
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
    // request.start_date = this.selectedDate?.startDate?.format("yyyy-MM-DD");
    // request.end_date = this.selectedDate?.endDate?.format("yyyy-MM-DD");

    const surveyDataRequest = {
      purpose: "get_surveydata",
      survey_id: "3",
      crop_column: "field_593",
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

    const cceRevisitRequest = {
      purpose: "get_surveydata",
      survey_id: "7",
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

    this.loading++;
    this.isFileData = false;
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
      
      if (!cceRevisitRequest.states?.length) {
        cceRevisitRequest.states = allStates;
      }
      if (!cceRevisitRequest.districts?.length) {
        cceRevisitRequest.districts = allDistrict;
      }
      if (!cceRevisitRequest.tehsils?.length) {
        cceRevisitRequest.tehsils = allTehsils;
      }
    }
    const allPromises = [request, cceRevisitRequest, surveyDataRequest].map((d: any) =>
      this.core.dashboard_post(d)
    );
    Promise.all(allPromises)
      .then((responses: any) => {
        if (responses?.[0].status == 1) {
          const distIds = this.core
            .clone(this.districtOptions)
            .flatMap((d: any) => d.items)
            .map((d: any) => d.district_id);
          this.allData = (responses[0]?.allData || []).filter(
            (d: any) => d.no_of_CCEs_planned > 0);
        }
        if (responses?.[1]?.status == 1) {
          const revisitData = (responses[1].surveydata || []).sort((a: any,b: any) => a.datetime.localeCompare(b.datetime));
          for (let i = 0; i < revisitData.length; i++) {
            const data = revisitData[i];
            if (!this.revisitMap.get(data.case_ID)) {
              this.revisitMap.set(data.case_ID, [])
            }
            this.revisitMap.set(data.case_ID, [...this.revisitMap.get(data.case_ID), data])
          }
          this.revisitData = revisitData;
        }
        if (responses?.[2].status == 1) {
          const surveyData = responses[2].surveydata || [];
          for (let i = 0; i < surveyData.length; i++) {
            const data = surveyData[i];
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

            data.revisit = 1;
              data.dry_weight = null
              if (data.field_623?.toLowerCase().trim() === 'single step') {
                if (!(data.field_627 === '' || data.field_627 === null)) {
                  data.dry_weight = +data.field_627
                  this.surveyData.push(data)
                }
              } else {
                const revisitData = this.revisitMap.get(data.case_ID);
                data.revisit = revisitData?.length;
                if (revisitData?.length) {
                  const all_weights: any[] = [+(data.field_624 || data.field_651)];
                  let revist_cycle = 1
                  if (data.field_585 == 7) {
                    revist_cycle = 2
                  }
                  if (revisitData.length > revist_cycle) {
                    revist_cycle = revisitData.length;
                  }
                  for (let j = 0; j < revist_cycle; j++) {
                    const revisit_data = revisitData[j];
                    if (revisit_data) {
                      if (revisit_data.field_780?.toLowerCase().trim() === 'dry weight') {
                        all_weights.push(+revisit_data.field_769)
                      } else {
                        all_weights.push(+revisit_data.field_781)
                      }
                    } else {
                      all_weights.push(Math.min(...all_weights))
                    }
                  }
                  data.dry_weight = all_weights.reduce((a: any,b: any) => +a + +b)
                  this.surveyData.push(data);
                }
              }
          }
          this.minDate = new Date(this.minDate).setHours(0, 0, 0, 0);
          this.maxDate = new Date(this.maxDate).setHours(23, 59, 59, 999);
          this.t_8Days =
            new Date(this.maxDate).getTime() - 24 * 60 * 60 * 1000 * 7;
          const dataIds = this.core.uniqueList(this.surveyData, "data_id");
          this.surveyLocation = (responses[1].locationdata || []).filter(
            (d: any) => dataIds.includes(d.data_id)
          );
          this.refreshDetail();
        }
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

  setLabels(totData: any) {
    this.labels = {};
    this.labels.no_of_cce_plan = totData
      .map((d: any) => d.no_of_CCEs_planned)
      .reduce((a: any, b: any) => a + b, 0);
    this.labels.no_of_cce_co_witnessed = totData
      .map((d: any) => d.no_of_survey)
      .reduce((a: any, b: any) => a + b, 0);
    this.labels.total_exposure = totData
      .map((d: any) => d.sum_insured)
      .reduce((a: any, b: any) => a + b, 0);
    this.labels.planned_exposure = totData
      .filter((d: any) => d.no_of_CCEs_planned)
      .map((d: any) => d.sum_insured)
      .reduce((a: any, b: any) => a + b, 0);
    this.labels.exposure_covered = totData
      .map((d: any) => d.partial_exposure_covered)
      .reduce((a: any, b: any) => a + b, 0);
    this.labels.states = this.core.uniqueList(this.allData, "state_id").length;
    this.labels.districts = this.core.uniqueList(
      this.allData,
      "dist_id"
    ).length;
    this.labels.tehsils = this.core.uniqueList(
      this.allData,
      "tehsil_id"
    ).length;
  }

  generateIUCalculation(plan_data: any[], survey_data: any[], all_ius: any[]) {
    const iu_calculated_data = [];
    const stateSet = new Set();
    const districtSet = new Set();
    const tehsilSet = new Set();
    const labels = {
      no_of_cce_plan: 0,
      no_of_cce_co_witnessed: 0,
      total_exposure: 0,
      planned_exposure: 0,
      exposure_covered: 0,
      states: 0,
      districts: 0,
      tehsils: 0,
    };
    if (plan_data?.length && survey_data?.length) {
      for (let iui = 0; iui < all_ius.length; iui++) {
        const ele = all_ius[iui];
        const result: any = {};
        const notifyInfo = ele.split("=>").map((d: any) => d.trim());
        result.data = plan_data.find(
          (d) =>
            d.gp_notified_area == notifyInfo[0] &&
            d.notified_unit == notifyInfo[1] &&
            d.crop == notifyInfo[2] &&
            d.state_id == notifyInfo[3] &&
            d.dist_id == notifyInfo[4] &&
            d.year == notifyInfo[5] &&
            d.season == notifyInfo[6]
        );
        result.survey_data = [];
        for (let sid = 0; sid < survey_data.length; sid++) {
          const e = survey_data[sid];
          if (
            result.data.crop == e.field_593 &&
            result.data.state_id == e.field_585 &&
            result.data.notified_unit == e.field_589 &&
            result.data.dist_id == e.field_586 &&
            result.data.year == e.field_583 &&
            result.data.season == e.field_584 &&
            ((result.data.notified_unit == 1 &&
              result.data.gp_notified_area == e.field_591) ||
              (result.data.notified_unit == 2 &&
                result.data.gp_notified_area == e.field_588) ||
              (result.data.notified_unit == 3 &&
                result.data.gp_notified_area == e.field_587) ||
              (result.data.notified_unit == 4 &&
                result.data.gp_notified_area == e.field_592) ||
              (result.data.notified_unit == 5 &&
                result.data.gp_notified_area == e.field_586))
          ) {
            result.survey_data.push(e);
          }
        }

        result.state_id = result.data.state_id;
        result.dist_id = result.data.dist_id;
        result.tehsil_id = result.data.tehsil_id;
        result.iu = ele;
        result.iu_name = '';
        if (result.data.notified_unit == 1) {
          result.iu_name = this.grampanchayatMap.get(result.data.gp_notified_area) || result.data.notified_unit
        } else if (result.data.notified_unit == 2) {
          result.iu_name = this.blockMap.get(result.data.gp_notified_area) || result.data.notified_unit
        } else if (result.data.notified_unit == 3) {
          result.iu_name = this.tehsilMap.get(result.data.gp_notified_area) || result.data.notified_unit
        } else if (result.data.notified_unit == 4) {
          result.iu_name = this.villageMap.get(result.data.gp_notified_area) || result.data.notified_unit
        } else if (result.data.notified_unit == 5) {
          result.iu_name = this.districtMap.get(result.data.gp_notified_area) || result.data.notified_unit
        }
        stateSet.add(result.state_id);
        districtSet.add(result.dist_id);
        tehsilSet.add(result.tehsil_id);
        result.gp_notified_area = result.data.gp_notified_area;
        result.notified_unit = result.data.notified_unit;
        result.notified_unit = result.data.notified_unit;
        result.crop = result.data.crop;
        result.iu_name +=  ' - ' + (this.cropsMap.get(result.crop) || this.cropsMap.get(0 + result.crop) || result.crop),
        result.threshold_yield = +result.data.threshold_yield || 0;
        result.draige_factor = +result.data.draige_factor || 0;
        result.gross_premium = +result.data.gross_premium || 0;
        result.sum_insured = +result.data.sum_insured || 0;
        labels.total_exposure += result.sum_insured;
        result.expected = +result.data.expected_yield || 0;
        result.no_of_CCEs_planned = +result.data.no_of_CCEs_planned || 0;
        labels.no_of_cce_plan += result.no_of_CCEs_planned;
        result.missed_data = 0;
        result.loss_data = 0;
        result.no_loss_data = 0;
        if (result.no_of_CCEs_planned) {
          labels.planned_exposure += result.sum_insured;
        }
        result.season = result.data.season;
        result.year = result.data.year;
        result.date_of_sowing = result.data.date_of_sowing;
        result.date_of_loss = result.data.date_of_loss;
        result.no_of_survey = result.survey_data.length;
        labels.no_of_cce_co_witnessed += result.no_of_survey;
        result.exposure_covered = 0;
        result.partially_completed = 0;
        result.full_completed = 0;
        result.partially_completed = 0;
        result.yet_to_start = 0;
        [result.area, result.dry_weight] = this.getAreaWeight(
          result.survey_data,
          +result.data.cce_plot_size
        );
        result.actual_yeild = this.actialYield(
          result.survey_data,
          result.draige_factor,
          +result.data.cce_plot_size
        );
        result.claim_amount = 0;
        result.deficiency = 0;
        result.partial_exposure_covered = 0;
        result.partial_claim_amount = 0;
        result.partial_deficiency = 0;
        result.no_of_survey_pending = Math.max(
          result.no_of_CCEs_planned - result.no_of_survey,
          0
        );

        if (result.no_of_survey == 0) {
          result.yet_to_start = 1;
        } else if (
          result.no_of_survey >= Number(result.no_of_CCEs_planned || 0)
        ) {
          if (result.threshold_yield > result.actual_yeild) {
            result.deficiency =
              (result.threshold_yield - result.actual_yeild) /
              result.threshold_yield;
          }
          result.exposure_covered = result.sum_insured;
          result.full_completed = 1;
          result.claim_amount = result.deficiency * result.sum_insured;
          result.actual_loss_ratio = this.divide(
            result.claim_amount,
            result.gross_premium
          );
          if (result.claim_amount > 0) {
            result.loss_data = 1;
          } else {
            result.no_loss_data = 1;
          }
        } else {
          result.partially_completed = 1;
        }

        if (result.no_of_survey != 0) {
          if (result.threshold_yield > result.actual_yeild) {
            result.partial_deficiency =
              (result.threshold_yield - result.actual_yeild) /
              result.threshold_yield;
          }
          result.partial_exposure_covered = result.sum_insured;
          labels.exposure_covered += result.partial_exposure_covered;
          result.partial_claim_amount =
            result.partial_deficiency * result.sum_insured;
          result.partial_gross_premium = result.gross_premium;
          result.partial_loss_ratio = this.divide(
            result.partial_claim_amount,
            result.partial_gross_premium
          );
        }

        if (!result.full_completed) {
          result.missed_data = 1;
          const avgArea = this.divide(
            10000,
            this.divide(result.area, result.no_of_survey)
          );
          const sum_actual_yield =
            result.dry_weight * avgArea * result.draige_factor;
          const allExpectedYield =
            result.no_of_survey_pending * result.expected;
          const avg_actual_yield = this.divide(
            sum_actual_yield + allExpectedYield,
            result.no_of_CCEs_planned
          );
          const deficiency =
            result.threshold_yield > avg_actual_yield
              ? this.divide(
                  result.threshold_yield - avg_actual_yield,
                  result.threshold_yield
                )
              : 0;
          const claim = deficiency * result.sum_insured;
          result.expected_deficiency = deficiency;
          result.expected_claim = claim;
          result.expected_loss_ratio = this.divide(claim, result.partial_gross_premium);
        } else {
          result.expected_loss_ratio = 0;
        }

        iu_calculated_data.push(result);
      }
    }
    labels.states = stateSet.size;
    labels.districts = districtSet.size;
    labels.tehsils = tehsilSet.size;
    return { totData: iu_calculated_data, labels };
  }

  generateCharts() {
    const allIUsList = [
      ...new Set(
        this.allData.map(
          (d) =>
            `${d.gp_notified_area}=>${d.notified_unit}=>${d.crop}=>${d.state_id}=>${d.dist_id}=>${d.year}=>${d.season}`
        )
      ),
    ];
    const { totData, labels }: any = this.generateIUCalculation(
      this.allData,
      this.surveyData,
      allIUsList
    );
    this.labels = labels;
    let locationData: any = [];
    let locationid = "";

    let dateData = this.generateDateWiseData(totData);

    let cropData = this.generateCropData(totData);

    let states = this.core.uniqueList(totData, "state_id");
    let distircts = this.core.uniqueList(totData, "dist_id");
    let tehsils = this.core.uniqueList(totData, "tehsil_id");

    if (tehsils.length == 1) {
      locationData = this.generateIUData(totData);
      locationid = "iu";
      this.locationLabel = "IU";
    } else if (distircts.length == 1) {
      locationData = this.generateTehsilData(totData);
      locationid = "tehsil_id";
      this.locationLabel = "Block";
    } else if (states.length == 1) {
      locationData = this.generateDistrictData(totData);
      locationid = "dist_id";
      this.locationLabel = "District";
    } else {
      locationData = this.generateStateData(totData);
      locationid = "state_id";
      this.locationLabel = "State";
    }

    const chartData = {...this.generateLocationWiseGraphs(locationData), ...this.generateCropWiseGraphs(cropData)}

    // cropData =  cropData.filter((crp) =>
    //   this.isValidSI(
    //     cropData.filter((d) => d.crop == crp),
    //     "sum_insured"
    //   )
    // );

    // locationData = locationData.filter((e: any) =>
    //     this.isValidSI(
    //       locationData.filter((d: any) => d[locationid] == e),
    //       "sum_insured"
    //     )
    //   );

    this.totData = totData;
    this.generateLoss_Ratio_over_time(dateData);
    this.generateLoss_ratio(
      chartData.location_wise_loss_ratio_top_5,
      chartData.location_wise_loss_ratio_rest
    );
    this.generateLoss_Ratio_crop_wise(
      chartData.crop_wise_loss_ratio_top_5,
      chartData.crop_wise_loss_ratio_rest
    );
    this.generateLocationCompletionRatio(
      chartData.planed_and_cowitnessed_top_5,
      chartData.planed_and_cowitnessed_rest
    );
    this.generateCropCompletionRatio(
      chartData.no_of_planed_and_cowitnessed_top_5,
      chartData.no_of_planed_and_cowitnessed_rest
    );
    this.generateIus_all_planned_cce_completed(
      chartData.location_wise_completion
    );
    this.generateClaim_Amount(chartData.location_wise_claim_amount);
    this.generateius_having_loss_and_no_loss(
      chartData.location_cce_progress_top_5,
      chartData.location_cce_progress_rest
    );
    // this.generateLoss_ratio(locationData, []);
    // this.generateLoss_Ratio_crop_wise(cropData, []);
    // // this.generateState_level_exposure(locationData);
    // this.generateLocationCompletionRatio(locationData, []);
    // // this.generateState_level_planened(locationData);
    // this.generateCropCompletionRatio(locationData, []);
    // this.generateIus_all_planned_cce_completed(locationData);
    // this.generateClaim_Amount(locationData);
    // this.generateius_having_loss_and_no_loss(totData, []);
    // console.timeEnd();
  }

  generateStateData(plan_data: any[]) {
    const states = [...new Set(plan_data.map((data) => data.state_id))];
    const stateData = [];
    for (let sid = 0; sid < states.length; sid++) {
      const stateId = states[sid];
      const data = {
        state_id: stateId,
        name: this.stateMap.get(stateId),
        threshold_yield: 0,
        draige_factor: 0,
        gross_premium: 0,
        sum_insured: 0,
        expected: 0,
        no_of_CCEs_planned: 0,
        no_of_survey: 0,
        area: 0,
        dry_weight: 0,
        exposure_covered: 0,
        partially_completed: 0,
        full_completed: 0,
        yet_to_start: 0,
        actual_yeild: 0,
        deficiency: 0,
        no_of_survey_pending: 0,
        expected_loss_ratio: 0,
        claim_amount: 0,
        actual_loss_ratio: 0,
        total_count: 0,
        lossCount: 0,
        noLossCount: 0,
        expected_claim: 0,
        total_gross_premium: 0,
        full_completed_sum_insured: 0,
        partially_completed_sum_insured: 0,
        yet_to_start_sum_insured: 0,
        partial_claim_amount: 0,
        partial_loss_ratio: 0,
        partial_gross_premium: 0,
        missed_data: 0,
        loss_data: 0,
        no_loss_data: 0,
      };

      for (let indx = 0; indx < plan_data.length; indx++) {
        const info = plan_data[indx];
        if (info.state_id == data.state_id) {
          data.total_count++;
          data.state_id = info.state_id;
          data.threshold_yield += info.threshold_yield;
          data.draige_factor += info.draige_factor;
          data.sum_insured += info.sum_insured;
          data.expected += info.expected;
          data.no_of_CCEs_planned += info.no_of_CCEs_planned;
          data.no_of_survey += info.no_of_survey;
          data.exposure_covered += info.exposure_covered;
          data.partially_completed += info.partially_completed;
          data.full_completed += info.full_completed;
          data.yet_to_start += info.yet_to_start;
          data.area += info.area;
          data.dry_weight += info.dry_weight;
          data.no_of_survey_pending += info.no_of_survey_pending;
          data.actual_yeild += info.actual_yeild;
          data.expected_claim += info.expected_claim || 0;
          data.total_gross_premium += info.gross_premium;
          data.missed_data += info.missed_data;
          data.loss_data += info.loss_data;
          data.no_loss_data += info.no_loss_data;

          if (info.full_completed) {
            data.gross_premium += info.gross_premium;
            data.deficiency += info.deficiency || 0;
            data.claim_amount += info.claim_amount || 0;
            data.full_completed_sum_insured += info.sum_insured;
          }

          if (info.partially_completed) {
            data.partially_completed_sum_insured += info.sum_insured;
          }

          if (info.yet_to_start) {
            data.yet_to_start_sum_insured += info.sum_insured;
          }

          data.partial_claim_amount += +(info.partial_claim_amount || 0);
          if (!info.yet_to_start) {
            data.partial_gross_premium += info.gross_premium;
          }

          if (data.claim_amount > 0) {
            data.lossCount++;
          } else {
            data.noLossCount++;
          }
        }
      }
      data.actual_loss_ratio = this.divide(
        data.claim_amount,
        data.gross_premium
      );

      data.partial_loss_ratio = this.divide(
        data.partial_claim_amount,
        data.partial_gross_premium // will change in future
      );

      data.expected_loss_ratio = this.divide(
        data.expected_claim + data.claim_amount,
        data.total_gross_premium
      );
      stateData.push(data);
    }
    return stateData.sort((a, b) => b.sum_insured - a.sum_insured);
  }

  generateLocationCompletionRatio(totData: any[], remainData: any[]) {
    const top5_cats: any = [];
    const top5_completed: any = [];
    const top5_partiallyCompleted: any = [];
    const top5_yetToStart: any = [];

    const rest_cats: any = [];
    const rest_completed: any = [];
    const rest_partiallyCompleted: any = [];
    const rest_yetToStart: any = [];

    for (let i = 0; i < totData.length; i++) {
      const data = totData[i];
      top5_cats.push(data.name);
      top5_completed.push({
        y: data.full_completed_sum_insured,
        point: this.abbreviateNumber(data.full_completed_sum_insured),
        claim_amount: data.partial_claim_amount,
        gross_premium: data.partial_gross_premium,
      });
      top5_partiallyCompleted.push({
        y: data.partially_completed_sum_insured,
        point: this.abbreviateNumber(data.partially_completed_sum_insured),
        claim_amount: data.partial_claim_amount,
        gross_premium: data.partial_gross_premium,
      });
      top5_yetToStart.push({
        y: data.yet_to_start_sum_insured,
        point: this.abbreviateNumber(data.yet_to_start_sum_insured),
        claim_amount: data.partial_claim_amount,
        gross_premium: data.partial_gross_premium,
      });
    }
    for (let i = 0; i < remainData.length; i++) {
      const data = remainData[i];
      rest_cats.push(data.name);
      rest_completed.push({
        y: data.full_completed_sum_insured,
        point: this.abbreviateNumber(data.full_completed_sum_insured),
        claim_amount: data.partial_claim_amount,
        gross_premium: data.partial_gross_premium,
      });
      rest_partiallyCompleted.push({
        y: data.partially_completed_sum_insured,
        point: this.abbreviateNumber(data.partially_completed_sum_insured),
        claim_amount: data.partial_claim_amount,
        gross_premium: data.partial_gross_premium,
      });
      rest_yetToStart.push({
        y: data.yet_to_start_sum_insured,
        point: this.abbreviateNumber(data.yet_to_start_sum_insured),
        claim_amount: data.partial_claim_amount,
        gross_premium: data.partial_gross_premium,
      });
    }

    const chartColumnClick = (event: any) => {
      if (event?.point?.category == "Others") {
        this.modalService.open(this.cceExposureModal, { size: "xl" });
        setTimeout(() => {
          this.generateLocationCompletionRatio_modal(
            rest_cats,
            rest_completed,
            rest_partiallyCompleted,
            rest_yetToStart
          );
        }, 500);
      }
    };
    const option = {
      title: {
        text: "",
      },
      xAxis: {
        categories: top5_cats,
        labels: this.chartlabels
      },
      yAxis: [
        {
          gridLineWidth: 0,
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
        },
        {
          gridLineWidth: 0,
          min: 0,
          opposite: true,
          title: {
            text: "",
          },
        },
      ],
      tooltip: {
        headerFormat: "<b>{point.x}</b><br/>",
        pointFormat: " <b>{series.name}: {point.point} </b> ",
      },
      plotOptions: {
        column: {
          dataLabels: {
            enabled: true,
          },
          events: {
            click: function (event: any) {
              chartColumnClick(event);
            },
          },
          stacking: "normal",
        },
        line: {
          dataLabels: {
            enabled: true,
            x: 45,
            style: {
              marginLeft: "40px",
            },
          },
        },
      },
      series: [
        {
          type: "column",
          name: "Yet to start",
          color: "#a5a5a5",
          data: top5_yetToStart,
          dataLabels: {
            enabled: true,
            rotation: 0,
            color: "#000",
            align: "center",
            format: "{point.point}",
            y: -5,
            style: {
              fontSize: "10px",
            },
          },
        },
        {
          type: "column",
          name: "Partially Completed",
          color: "#ed7d31",
          data: top5_partiallyCompleted,
          dataLabels: {
            enabled: true,
            rotation: 0,
            color: "#000",
            align: "center",
            format: "{point.point}",
            y: -5,
            style: {
              fontSize: "10px",
            },
          },
        },
        {
          type: "column",
          name: "Fully Completed",
          color: "#4473c5",
          data: top5_completed,
          dataLabels: {
            enabled: true,
            rotation: 0,
            color: "#000",
            align: "center",
            format: "{point.point}",
            y: -5,
            style: {
              fontSize: "10px",
            },
          },
        },
      ],
    };

    this.locationCompletionRatioChart = new Chart(Object.assign(option));
  }

  generateDistrictData(plan_data: any[]) {

    const districts = [...new Set(plan_data.map((data) => data.dist_id))];
    const districtsData = [];
    for (let sid = 0; sid < districts.length; sid++) {
      const districtId = districts[sid];
      const data = {
        state_id: "",
        dist_id: districtId,
        name: this.districtMap.get(districtId),
        threshold_yield: 0,
        draige_factor: 0,
        gross_premium: 0,
        sum_insured: 0,
        expected: 0,
        no_of_CCEs_planned: 0,
        no_of_survey: 0,
        area: 0,
        dry_weight: 0,
        exposure_covered: 0,
        partially_completed: 0,
        full_completed: 0,
        yet_to_start: 0,
        actual_yeild: 0,
        deficiency: 0,
        no_of_survey_pending: 0,
        expected_loss_ratio: 0,
        claim_amount: 0,
        actual_loss_ratio: 0,
        total_count: 0,
        lossCount: 0,
        noLossCount: 0,
        expected_claim: 0,
        total_gross_premium: 0,
        full_completed_sum_insured: 0,
        partially_completed_sum_insured: 0,
        yet_to_start_sum_insured: 0,
        partial_claim_amount: 0,
        partial_loss_ratio: 0,
        partial_gross_premium: 0,
        missed_data: 0,
        loss_data: 0,
        no_loss_data: 0,
      };

      for (let indx = 0; indx < plan_data.length; indx++) {
        const info = plan_data[indx];
        if (info.dist_id == data.dist_id) {
          data.state_id = info.state_id;
          data.total_count++;
          data.threshold_yield += info.threshold_yield;
          data.draige_factor += info.draige_factor;
          data.sum_insured += info.sum_insured;
          data.expected += info.expected;
          data.no_of_CCEs_planned += info.no_of_CCEs_planned;
          data.no_of_survey += info.no_of_survey;
          data.exposure_covered += info.exposure_covered;
          data.partially_completed += info.partially_completed;
          data.full_completed += info.full_completed;
          data.yet_to_start += info.yet_to_start;
          data.area += info.area;
          data.dry_weight += info.dry_weight;
          data.no_of_survey_pending += info.no_of_survey_pending;
          data.actual_yeild += info.actual_yeild;
          data.expected_claim += info.expected_claim || 0;
          data.total_gross_premium += info.gross_premium;
          data.missed_data += info.missed_data;
          data.loss_data += info.loss_data;
          data.no_loss_data += info.no_loss_data;

          if (info.full_completed) {
            data.gross_premium += info.gross_premium;
            data.deficiency += info.deficiency || 0;
            data.claim_amount += info.claim_amount || 0;
            data.full_completed_sum_insured += info.sum_insured;
          }

          if (info.partially_completed) {
            data.partially_completed_sum_insured += info.sum_insured;
          }

          if (info.yet_to_start) {
            data.yet_to_start_sum_insured += info.sum_insured;
          }

          data.partial_claim_amount += +(info.partial_claim_amount || 0);
          if (!info.yet_to_start) {
            data.partial_gross_premium += info.gross_premium;
          }

          if (data.claim_amount > 0) {
            data.lossCount++;
          } else {
            data.noLossCount++;
          }
        }
      }
      data.actual_loss_ratio = this.divide(
        data.claim_amount,
        data.gross_premium
      );

      data.partial_loss_ratio = this.divide(
        data.partial_claim_amount,
        data.partial_gross_premium // will change in future
      );

      data.expected_loss_ratio = this.divide(
        data.expected_claim + data.claim_amount,
        data.total_gross_premium
      );
      districtsData.push(data);
    }
    this.districtDashboardData = districtsData.sort(
      (a, b) => b.sum_insured - a.sum_insured
    );
    return districtsData

  }

  generateIUData(plan_data: any) {
    return plan_data.map((data: any) => {
      return {
        state_id: data.state_id,
        dist_id: data.dist_id,
        tehsil_id: data.tehsil_id,
        name: data.iu_name,
        threshold_yield: data.threshold_yield || 0,
        draige_factor: data.draige_factor || 0,
        gross_premium: data.gross_premium || 0,
        sum_insured: data.sum_insured || 0,
        expected: data.expected || 0,
        no_of_CCEs_planned: data.no_of_CCEs_planned || 0,
        no_of_survey: data.no_of_survey || 0,
        area: data.area || 0,
        dry_weight: data.dry_weight || 0,
        exposure_covered: data.exposure_covered || 0,
        partially_completed: data.partially_completed || 0,
        full_completed: data.full_completed || 0,
        yet_to_start: data.yet_to_start || 0,
        actual_yeild: data.actual_yeild || 0,
        deficiency: data.deficiency || 0,
        no_of_survey_pending: data.no_of_survey_pending || 0,
        expected_loss_ratio: data.expected_loss_ratio || 0,
        claim_amount: data.claim_amount || 0,
        actual_loss_ratio: data.actual_loss_ratio || 0,
        total_count: data.total_count || 0,
        lossCount: data.lossCount || 0,
        noLossCount: data.noLossCount || 0,
        expected_claim: data.expected_claim || 0,
        total_gross_premium: data.total_gross_premium || 0,
        full_completed_sum_insured: data.full_completed ? data.sum_insured || 0 : 0,
        partially_completed_sum_insured: data.partially_completed ?  data.sum_insured || 0 : 0,
        yet_to_start_sum_insured: data.yet_to_start ? data.sum_insured || 0 : 0,
        partial_claim_amount: data.partial_claim_amount || 0,
        partial_loss_ratio: data.partial_loss_ratio || 0,
        partial_gross_premium: data.partial_gross_premium || 0,
        missed_data: data.missed_data || 0,
        loss_data: data.loss_data || 0,
        no_loss_data: data.no_loss_data || 0,
      };
    })
  }

  generateTehsilData(plan_data: any[]) {

    const tehsils = [...new Set(plan_data.map((data) => data.tehsil_id))]
    const tehsilsData = [];
    for (let sid = 0; sid < tehsils.length; sid++) {
      const tehsilId = tehsils[sid];
      const data = {
        state_id: "",
        dist_id: "",
        tehsil_id: tehsilId,
        name: this.tehsilMap.get(tehsilId),
        threshold_yield: 0,
        draige_factor: 0,
        gross_premium: 0,
        sum_insured: 0,
        expected: 0,
        no_of_CCEs_planned: 0,
        no_of_survey: 0,
        area: 0,
        dry_weight: 0,
        exposure_covered: 0,
        partially_completed: 0,
        full_completed: 0,
        yet_to_start: 0,
        actual_yeild: 0,
        deficiency: 0,
        no_of_survey_pending: 0,
        expected_loss_ratio: 0,
        claim_amount: 0,
        actual_loss_ratio: 0,
        total_count: 0,
        lossCount: 0,
        noLossCount: 0,
        expected_claim: 0,
        total_gross_premium: 0,
        full_completed_sum_insured: 0,
        partially_completed_sum_insured: 0,
        yet_to_start_sum_insured: 0,
        partial_claim_amount: 0,
        partial_loss_ratio: 0,
        partial_gross_premium: 0,
        missed_data: 0,
        loss_data: 0,
        no_loss_data: 0,
      };

      for (let indx = 0; indx < plan_data.length; indx++) {
        const info = plan_data[indx];
        if (info.tehsil_id == data.tehsil_id) {
          data.state_id = info.state_id;
          data.dist_id = info.dist_id;
          data.total_count++;
          data.threshold_yield += info.threshold_yield;
          data.draige_factor += info.draige_factor;
          data.sum_insured += info.sum_insured;
          data.expected += info.expected;
          data.no_of_CCEs_planned += info.no_of_CCEs_planned;
          data.no_of_survey += info.no_of_survey;
          data.exposure_covered += info.exposure_covered;
          data.partially_completed += info.partially_completed;
          data.full_completed += info.full_completed;
          data.yet_to_start += info.yet_to_start;
          data.area += info.area;
          data.dry_weight += info.dry_weight;
          data.no_of_survey_pending += info.no_of_survey_pending;
          data.actual_yeild += info.actual_yeild;
          data.expected_claim += info.expected_claim || 0;
          data.total_gross_premium += info.gross_premium;
          data.missed_data += info.missed_data;
          data.loss_data += info.loss_data;
          data.no_loss_data += info.no_loss_data;

          if (info.full_completed) {
            data.gross_premium += info.gross_premium;
            data.deficiency += info.deficiency || 0;
            data.claim_amount += info.claim_amount || 0;
            data.full_completed_sum_insured += info.sum_insured;
          }

          if (info.partially_completed) {
            data.partially_completed_sum_insured += info.sum_insured;
          }

          if (info.yet_to_start) {
            data.yet_to_start_sum_insured += info.sum_insured;
          }

          data.partial_claim_amount += +(info.partial_claim_amount || 0);
          if (!info.yet_to_start) {
            data.partial_gross_premium += info.gross_premium;
          }

          if (data.claim_amount > 0) {
            data.lossCount++;
          } else {
            data.noLossCount++;
          }
        }
      }
      data.actual_loss_ratio = this.divide(
        data.claim_amount,
        data.gross_premium
      );

      data.partial_loss_ratio = this.divide(
        data.partial_claim_amount,
        data.partial_gross_premium // will change in future
      );

      data.expected_loss_ratio = this.divide(
        data.expected_claim + data.claim_amount,
        data.total_gross_premium
      );
      tehsilsData.push(data);
    }
    this.tehsilDashboardData = tehsilsData.sort(
      (a, b) => b.sum_insured - a.sum_insured
    );
    return tehsilsData
  }
  generateDateWiseData = (totData: any) => {
    const dateList = [];
    let seriesDate = null;
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
    for (let i = 1; i <= 7; i++) {
      seriesDate = new Date(seriesDate).getTime() + 24 * 60 * 60 * 1000;
      dateList.push({ end_date: seriesDate });
    }
    const dateWiseData = [];
    for (let i = 0; i < dateList.length; i++) {
      const dateData = dateList[i];
      const data = {
        name: dateData.start_date
          ? `${moment(dateData.start_date).format("YYYY-MM-DD")} To ${moment(
              dateData.end_date
            ).format("YYYY-MM-DD")}`
          : moment(dateData.end_date).format("YYYY-MM-DD"),
        no_of_CCEs_planned: 0,
        partially_completed: 0,
        full_completed: 0,
        yet_to_start: 0,
        claim_amount: 0,
        actual_loss_ratio: 0,
        total_gross_premium: 0,
        gross_premium: 0,
        full_completed_sum_insured: 0,
        partially_completed_sum_insured: 0,
        yet_to_start_sum_insured: 0,
        survey_start_date: null,
        survey_end_date: null,
        partial_claim_amount: 0,
        partial_loss_ratio: 0,
        partial_gross_premium: 0,
      };
      for (let indx = 0; indx < totData.length; indx++) {
        const info = totData[indx];
        data.total_gross_premium += info.gross_premium;
        const surveys = info.survey_data;
        if (surveys.length) {
          const firstDate = surveys[0].datetime;
          const lastDate = surveys[surveys.length - 1].datetime;
          if (firstDate && dateData.end_date >= lastDate) {
            if (surveys.length >= info.no_of_CCEs_planned) {
              data.full_completed += 1;
              data.full_completed_sum_insured += info.sum_insured;
              data.claim_amount += info.claim_amount;
              data.gross_premium += info.gross_premium;
            } else {
              data.partially_completed += 1;
              data.partially_completed_sum_insured += info.sum_insured;
              data.partial_claim_amount += info.partial_claim_amount;
              data.partial_gross_premium += info.partial_gross_premium;
            }
          } else {
            data.yet_to_start += 1;
            data.yet_to_start_sum_insured += info.sum_insured;
          }
          data.survey_start_date = firstDate;
          data.survey_end_date = lastDate;
        } else {
          data.yet_to_start += 1;
          data.yet_to_start_sum_insured += info.sum_insured;
        }
      }
      data.actual_loss_ratio = this.divide(
        data.claim_amount,
        data.gross_premium
      );
      data.partial_loss_ratio = this.divide(
        data.partial_claim_amount,
        data.partial_gross_premium // will change in future
      );
      dateWiseData.push(data);
    }
    return dateWiseData;
  };
  generateCropData(plan_data: any[]) {
    
    const crops = [...new Set(plan_data.map((data) => data.crop))];
  const cropData = [];
  for (let sid = 0; sid < crops.length; sid++) {
    const cropId = crops[sid];
    const data = {
      crop_id: cropId,
      name: this.cropsMap.get(cropId) || this.cropsMap.get(0 + cropId) || cropId,
      threshold_yield: 0,
      draige_factor: 0,
      gross_premium: 0,
      sum_insured: 0,
      expected: 0,
      no_of_CCEs_planned: 0,
      no_of_survey: 0,
      area: 0,
      dry_weight: 0,
      exposure_covered: 0,
      partially_completed: 0,
      full_completed: 0,
      yet_to_start: 0,
      actual_yeild: 0,
      deficiency: 0,
      no_of_survey_pending: 0,
      expected_loss_ratio: 0,
      claim_amount: 0,
      actual_loss_ratio: 0,
      total_count: 0,
      lossCount: 0,
      noLossCount: 0,
      expected_claim: 0,
      total_gross_premium: 0,
      full_completed_sum_insured: 0,
      partially_completed_sum_insured: 0,
      yet_to_start_sum_insured: 0,
      partial_claim_amount: 0,
      partial_loss_ratio: 0,
      partial_gross_premium: 0,
    };

    for (let indx = 0; indx < plan_data.length; indx++) {
      const info = plan_data[indx];
      if (info.crop == data.crop_id) {
        data.total_count++;
        data.threshold_yield += info.threshold_yield;
        data.draige_factor += info.draige_factor;
        data.sum_insured += info.sum_insured;
        data.expected += info.expected;
        data.no_of_CCEs_planned += info.no_of_CCEs_planned;
        data.no_of_survey += info.no_of_survey;
        data.exposure_covered += info.exposure_covered;
        data.partially_completed += info.partially_completed;
        data.full_completed += info.full_completed;
        data.yet_to_start += info.yet_to_start;
        data.area += info.area;
        data.dry_weight += info.dry_weight;
        data.no_of_survey_pending += info.no_of_survey_pending;
        data.actual_yeild += info.actual_yeild;
        data.expected_claim += info.expected_claim || 0;
        data.total_gross_premium += info.gross_premium;

        if (info.full_completed) {
          data.gross_premium += info.gross_premium;
          data.deficiency += info.deficiency || 0;
          data.claim_amount += info.claim_amount || 0;
          data.full_completed_sum_insured += info.sum_insured;
        }

        if (info.partially_completed) {
          data.partially_completed_sum_insured += info.sum_insured;
        }

        if (info.yet_to_start) {
          data.yet_to_start_sum_insured += info.sum_insured;
        }

        data.partial_claim_amount += +(info.partial_claim_amount || 0);
        if (!info.yet_to_start) {
          data.partial_gross_premium += info.gross_premium;
        }

        if (data.claim_amount > 0) {
          data.lossCount++;
        } else {
          data.noLossCount++;
        }
      }
    }
    data.actual_loss_ratio = this.divide(data.claim_amount, data.gross_premium);

    data.partial_loss_ratio = this.divide(
      data.partial_claim_amount,
      data.partial_gross_premium // will change in future
    );

    data.expected_loss_ratio = this.divide(
      data.expected_claim + data.claim_amount,
      data.total_gross_premium
    );
    cropData.push(data);
  }
    this.cropDashboardData = cropData;
    return cropData;
  }

  generateLocationWiseGraphs (location_data: any) {
    const location_wise_loss_ratio_top_5 = [];
    const location_wise_loss_ratio_rest = [];
    const planed_and_cowitnessed_top_5 = [];
    const planed_and_cowitnessed_rest = [];
    const no_of_planed_and_cowitnessed_top_5 = [];
    const no_of_planed_and_cowitnessed_rest = [];
    const location_wise_completion = [];
    const location_wise_claim_amount = [];
    const location_cce_progress_top_5 = [];
    const location_cce_progress_rest = [];
  
    let rest_claim_amount = 0;
    let rest_partial_claim_amount = 0;
    let rest_expected_claim_amount = 0;
    let rest_gross_premium = 0;
    let rest_partial_gross_premium = 0;
    let rest_full_completed_sum_insured = 0;
    let rest_partially_completed_sum_insured = 0;
    let rest_yet_to_start_sum_insured = 0;
    let rest_partially_completed = 0;
    let rest_full_completed = 0;
    let rest_yet_to_start = 0;
    let rest_missed_data = 0;
    let rest_loss_data = 0;
    let rest_no_loss_data = 0;
  
    for (let i = 0; i < location_data.length; i++) {
      const data = location_data[i];
      location_wise_completion.push({
        name: data.name,
        planned: data.total_count,
        full_completed: data.full_completed,
      });
      location_wise_claim_amount.push({
        name: data.name,
        claim_amount: data.claim_amount,
        partial_claim_amount: data.partial_claim_amount,
      });
      if (i < 5) {
        location_wise_loss_ratio_top_5.push({
          name: data.name,
          partial_claim_amount: data.partial_claim_amount,
          claim_amount: data.claim_amount,
          expected_claim_amount: data.expected_claim + data.claim_amount,
          gross_premium: data.gross_premium,
          partial_gross_premium: data.partial_gross_premium, // will change in future
          partial_loss_ratio: data.partial_loss_ratio,
          actual_loss_ratio: data.actual_loss_ratio,
          expected_loss_ratio: data.expected_loss_ratio,
        });
        planed_and_cowitnessed_top_5.push({
          name: data.name,
          full_completed_sum_insured: data.full_completed_sum_insured,
          partially_completed_sum_insured: data.partially_completed_sum_insured,
          yet_to_start_sum_insured: data.total_yet_to_start_sum_insured,
        });
        no_of_planed_and_cowitnessed_top_5.push({
          name: data.name,
          full_completed: data.full_completed,
          partially_completed: data.partially_completed,
          yet_to_start: data.yet_to_start,
        });
        location_cce_progress_top_5.push({
          name: data.name,
          loss: data.loss_data,
          no_loss: data.no_loss_data,
          not_completed: data.missed_data,
        });
      } else {
        location_wise_loss_ratio_rest.push({
          name: data.name,
          partial_claim_amount: data.partial_claim_amount,
          claim_amount: data.claim_amount,
          expected_claim_amount: data.expected_claim + data.claim_amount,
          gross_premium: data.gross_premium,
          partial_gross_premium: data.partial_gross_premium, // will change in future
          partial_loss_ratio: data.partial_loss_ratio,
          actual_loss_ratio: data.actual_loss_ratio,
          expected_loss_ratio: data.expected_loss_ratio,
        });
        planed_and_cowitnessed_rest.push({
          name: data.name,
          full_completed_sum_insured: data.full_completed_sum_insured,
          partially_completed_sum_insured: data.partially_completed_sum_insured,
          yet_to_start_sum_insured: data.total_yet_to_start_sum_insured,
        });
        no_of_planed_and_cowitnessed_rest.push({
          name: data.name,
          full_completed: data.full_completed,
          partially_completed: data.partially_completed,
          yet_to_start: data.yet_to_start,
        });
        location_cce_progress_rest.push({
          name: data.name,
          loss: data.loss_data,
          no_loss: data.no_loss_data,
          not_completed: data.missed_data,
        });
        rest_claim_amount += data.claim_amount;
        rest_partial_claim_amount += data.partial_claim_amount;
        rest_expected_claim_amount += data.expected_claim + data.claim_amount;
        rest_gross_premium += data.total_gross_premium;
        rest_partial_gross_premium += data.partial_gross_premium; // will change in future
        rest_full_completed_sum_insured += data.full_completed_sum_insured;
        rest_partially_completed_sum_insured +=
          data.partially_completed_sum_insured;
        rest_yet_to_start_sum_insured += data.yet_to_start_sum_insured;
        rest_partially_completed += data.partially_completed;
        rest_full_completed += data.full_completed;
        rest_yet_to_start += data.yet_to_start;
        rest_missed_data += data.missed_data;
        rest_loss_data += data.loss_data;
        rest_no_loss_data += data.no_loss_data;
      }
    }
    if (location_data?.length > 5) {
      location_wise_loss_ratio_top_5.push({
        name: "Others",
        partial_claim_amount: rest_partial_claim_amount,
        claim_amount: rest_claim_amount,
        expected_claim_amount: rest_expected_claim_amount,
        actual_loss_ratio: this.divide(rest_claim_amount, rest_gross_premium),
        gross_premium: rest_gross_premium,
        partial_gross_premium: rest_partial_gross_premium,
        partial_loss_ratio: this.divide(rest_partial_claim_amount, rest_partial_gross_premium),
        expected_loss_ratio: this.divide(
          rest_expected_claim_amount,
          rest_gross_premium
        ),
      });
      planed_and_cowitnessed_top_5.push({
        name: "Others",
        full_completed_sum_insured: rest_full_completed_sum_insured,
        partially_completed_sum_insured: rest_partially_completed_sum_insured,
        yet_to_start_sum_insured: rest_yet_to_start_sum_insured,
      });
      no_of_planed_and_cowitnessed_top_5.push({
        name: "Others",
        full_completed: rest_full_completed,
        partially_completed: rest_partially_completed,
        yet_to_start: rest_yet_to_start,
      });
      location_cce_progress_top_5.push({
        name: "Others",
        loss: rest_loss_data,
        no_loss: rest_no_loss_data,
        not_completed: rest_missed_data,
      });
    }
  
    return {
      location_wise_loss_ratio_top_5,
      location_wise_loss_ratio_rest,
      planed_and_cowitnessed_top_5,
      planed_and_cowitnessed_rest,
      no_of_planed_and_cowitnessed_top_5,
      no_of_planed_and_cowitnessed_rest,
      location_wise_completion,
      location_wise_claim_amount,
      location_cce_progress_top_5,
      location_cce_progress_rest,
    };
  };
  generateCropWiseGraphs(crop_data: any){
    const crop_wise_loss_ratio_top_5 = [];
    const crop_wise_loss_ratio_rest = [];
    let rest_claim_amount = 0;
    let rest_partial_claim_amount = 0;
    let rest_gross_premium = 0;
    let rest_partial_gross_premium = 0;
    let rest_expected_claim_amount = 0;
    for (let i = 0; i < crop_data.length; i++) {
      const data = crop_data[i];
      if (i < 5) {
        crop_wise_loss_ratio_top_5.push({
          name: data.name,
          partial_claim_amount: data.partial_claim_amount,
          claim_amount: data.claim_amount,
          expected_claim_amount: data.expected_claim + data.claim_amount,
          gross_premium: data.total_gross_premium,
          partial_gross_premium: data.partial_gross_premium, // will change in future
          partial_loss_ratio: data.partial_loss_ratio,
          actual_loss_ratio: data.actual_loss_ratio,
          expected_loss_ratio: data.expected_loss_ratio,
        });
      } else {
        crop_wise_loss_ratio_rest.push({
          name: data.name,
          partial_claim_amount: data.partial_claim_amount,
          claim_amount: data.claim_amount,
          expected_claim_amount: data.expected_claim + data.claim_amount,
          gross_premium: data.total_gross_premium,
          partial_gross_premium: data.partial_gross_premium, // will change in future
          partial_loss_ratio: data.partial_loss_ratio,
          actual_loss_ratio: data.actual_loss_ratio,
          expected_loss_ratio: data.expected_loss_ratio,
        });
  
        rest_claim_amount += data.claim_amount;
        rest_partial_claim_amount += data.partial_claim_amount;
        rest_gross_premium += data.total_gross_premium;
        rest_partial_gross_premium += data.partial_gross_premium; // will change in future
        rest_expected_claim_amount += data.expected_claim + data.claim_amount;
      }
    }
    if (crop_data?.length > 5) {
      crop_wise_loss_ratio_top_5.push({
        name: "Others",
        partial_claim_amount: rest_partial_claim_amount,
        claim_amount: rest_claim_amount,
        expected_claim_amount: rest_expected_claim_amount,
        actual_loss_ratio: this.divide(rest_claim_amount, rest_gross_premium),
        gross_premium: rest_gross_premium,
        partial_gross_premium: rest_partial_gross_premium,
        partial_loss_ratio: this.divide(rest_partial_claim_amount, rest_gross_premium),
        expected_loss_ratio: this.divide(
          rest_expected_claim_amount,
          rest_gross_premium
        ),
      });
    }
  
    return { crop_wise_loss_ratio_top_5, crop_wise_loss_ratio_rest };
  };

  generateLoss_Ratio_all_crop_wise(
    rest_cats: any,
    rest_actual: any,
    rest_expect: any
  ) {
    const option = {
      chart: {
        type: "column",
      },
      title: {
        text: "",
      },

      xAxis: {
        categories: rest_cats,
        labels: this.chartlabels
      },
      yAxis: {
        gridLineWidth: 0,
        title: "",
        labels: this.chartlabels
      },
      credits: {
        enabled: false,
      },
      plotOptions: {
        series: {
          dataLabels: {
            enabled: true,
            format: "{point.y:.0f} %",
          },
        },
      },
      tooltip: {
        headerFormat: "<b>{point.x}</b><br/>",
        pointFormat:
          "<b>{series.name}: {point.y:.0f} % <br>Claim Amount : {point.claim_amount:.0f} <br>Gross Premium : {point.gross_premium:.0f}</b> ",
      },
      series: [
        {
          name: "Actual LR",
          data: rest_actual,
          color: "#4472c4",
        },
        {
          name: "Expected LR",
          data: rest_expect,
          color: "#ed7d31",
        },
      ],
    };
    this.Loss_Ratio_all_crop_wise = new Chart(Object.assign(option));
  }

  generateLoss_Ratio_crop_wise(totData: any[], remainData: any) {
    const [top5_cats, top5_actual, top5_expect]: any[] = [[], [], []];
    const [rest_cats, rest_actual, rest_expect]: any[] = [[], [], []];
    for (let i = 0; i < totData.length; i++) {
      const data = totData[i];
      top5_cats.push(data.name);
      top5_actual.push({
        y: data.partial_loss_ratio * 100,
        claim_amount: this.abbreviateNumber(data.partial_claim_amount) || 0,
        gross_premium: this.abbreviateNumber(data.partial_gross_premium),
        d_claim_amount: data.partial_claim_amount,
        d_gross_premium: data.partial_gross_premium,
      });
      top5_expect.push({
        y: data.expected_loss_ratio * 100,
        claim_amount: this.abbreviateNumber(data.expected_claim_amount) || 0,
        gross_premium: this.abbreviateNumber(data.gross_premium),
        d_claim_amount: data.expected_claim_amount,
        d_gross_premium: data.gross_premium,
      });
    }
    for (let i = 0; i < remainData.length; i++) {
      const data = remainData[i];
      rest_cats.push(data.name);
      rest_actual.push({
        y: data.partial_loss_ratio * 100,
        claim_amount: this.abbreviateNumber(data.partial_claim_amount) || 0,
        gross_premium: this.abbreviateNumber(data.partial_gross_premium),
        d_claim_amount: data.partial_claim_amount,
        d_gross_premium: data.partial_gross_premium,
      });
      rest_expect.push({
        y: data.expected_loss_ratio * 100,
        claim_amount: this.abbreviateNumber(data.expected_claim_amount) || 0,
        gross_premium: this.abbreviateNumber(data.gross_premium),
        d_claim_amount: data.expected_claim_amount,
        d_gross_premium: data.gross_premium,
      });
    }

    const chartColumnClick = (event: any) => {
      if (event?.point?.category == "Others") {
        this.modalService.open(this.modelContent, { size: "xl" });
        setTimeout(() => {
          this.generateLoss_Ratio_all_crop_wise(
            rest_cats,
            rest_actual,
            rest_expect
          );
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
        categories: top5_cats,
        labels: this.chartlabels
      },
      yAxis: {
        gridLineWidth: 0,
        labels: this.chartlabels,
        title: "",
      },
      credits: {
        enabled: false,
      },
      plotOptions: {
        series: {
          dataLabels: {
            enabled: true,
            format: "{point.y:.0f} %",
          },
          events: {
            click: function (event: any) {
              chartColumnClick(event);
            },
          },
        },
      },
      tooltip: {
        headerFormat: "<b>{point.x}</b><br/>",
        pointFormat:
          "<b>{series.name}: {point.y:.0f} % <br>Claim Amount : {point.claim_amount:.0f} <br>Gross Premium : {point.gross_premium:.0f}</b> ",
      },
      series: [
        {
          name: "Actual LR",
          data: top5_actual,
          color: "#4472c4",
        },
        {
          name: "Expected LR",
          data: top5_expect,
          color: "#ed7d31",
        },
      ],
    };
    this.Loss_Ratio_crop_wise = new Chart(Object.assign(option));
  }

  generateius_having_loss_and_no_loss(totData: any, remainData: any) {
    const [top_5_names, top_5_mData, top_5_nData, top_5_lData]: any = [
      [],
      [],
      [],
      [],
    ];
    const [rest_names, rest_mData, rest_nData, rest_lData]: any = [
      [],
      [],
      [],
      [],
    ];

    for (let i = 0; i < totData.length; i++) {
      const data = totData[i];
      top_5_names.push(data.name);
      top_5_mData.push(data.not_completed);
      top_5_nData.push(data.no_loss);
      top_5_lData.push(data.loss);
    }

    for (let i = 0; i < remainData.length; i++) {
      const data = remainData[i];
      rest_names.push(data.name);
      rest_mData.push(data.not_completed);
      rest_nData.push(data.no_loss);
      rest_lData.push(data.loss);
    }

    const chartColumnClick = (event: any) => {
      if (event?.point?.category == "Others") {
        this.modalService.open(this.cceProgressModal, { size: "xl" });
        setTimeout(() => {
          this.generateius_having_loss_and_no_loss_modal({
            rest_names,
            rest_mData,
            rest_nData,
            rest_lData,
          });
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
        categories: top_5_names,
        labels: this.chartlabels,
      },
      yAxis: {
        gridLineWidth: 0,
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
      },
      plotOptions: {
        bar: {
          stacking: "normal",
          dataLabels: {
            enabled: true,
            color: "#000",
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
          name: "CCEs not completed in IU’s & Crop",
          data: top_5_mData,
          color: "#a5a5a5",
        },
        {
          name: "No Loss in IU’s & Crop",
          data: top_5_nData,
          color: "#548235",
        },
        {
          name: "Loss in IU’s & Crop",
          data: top_5_lData,
          color: "#C15BB3",
        },
      ],
    };

    this.ius_having_loss_and_no_loss = new Chart(Object.assign(option));
  }

  generateState_level_exposure(totData: any) {
    const seriesData: any[] = [];
    for (let indx = 0; indx < totData.length; indx++) {
      const actualP =
        this.divide(totData[indx].exposure_covered, totData[indx].sum_insured) *
        100;
      seriesData.push({
        name: totData[indx].name,
        y: actualP,
        custome: {
          name: totData[indx].name,
          planned: this.abbreviateNumber(totData[indx].sum_insured),
          tot: this.abbreviateNumber(totData[indx].exposure_covered),
          actualP,
        },
      });
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
            format: "{point.name}: {point.custome.actualP:.0f}%",
          },
        },
      },
      tooltip: {
        headerFormat: "",
        pointFormat: `
          <span style="font-size:11px">{point.custome.name}</span><br>
          <span>Exposure Achieved</span>: <b>{point.custome.tot} ({point.custome.actualP:.0f}%) </b><br/>
          <span>Exposure Planned: <b> {point.custome.planned:.0f} </b><br/>
          `,
      },
      colors: [
        "#7a7777",
        "#e60000",
        "#c46a0a",
        "#1cc40a",
        "#C15BB3",
        "#175788",
        "#FF9655",
        "#FFF263",
        "#6AF9C4",
      ],
      series: [
        {
          name: " ",
          data: [...seriesData],
        },
      ],
    };

    this.State_level_exposure = new Chart(Object.assign(option));
  }

  generateState_level_planened(totData: any[]) {
    let seriesData = [];
    for (let indx = 0; indx < totData.length; indx++) {
      const actualP =
        this.divide(
          totData[indx].no_of_survey,
          totData[indx].no_of_CCEs_planned
        ) * 100;
      seriesData.push({
        name: totData[indx].name,
        y: totData[indx].no_of_CCEs_planned,
        custome: { totUpload: totData[indx].no_of_survey, actualP },
      });
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
            format: "{point.name}: {point.custome.actualP:.0f}%",
          },
        },
      },
      tooltip: {
        headerFormat: "",
        pointFormat: `
        <span>Samples Surveyed</span>: <b>{point.custome.totUpload} ({point.custome.actualP:.0f}%)</b> <br/>
        <span>Samples Planned : </span>: <b>{point.y:.0f}</b><br/>
          `,
      },
      colors: [
        "#7a7777",
        "#e60000",
        "#c46a0a",
        "#1cc40a",
        "#C15BB3",
        "#175788",
        "#FF9655",
        "#FFF263",
        "#6AF9C4",
      ],
      series: [
        {
          name: " ",
          data: [...seriesData],
        },
      ],
    };

    this.State_level_planened = new Chart(Object.assign(option));
  }

  generateCropCompletionRatio(totData: any[], remainData: any) {
    const top5_cats: any = [];
    const top5_completed: any = [];
    const top5_partiallyCompleted: any = [];
    const top5_yetToStart: any = [];

    const rest_cats: any = [];
    const rest_completed: any = [];
    const rest_partiallyCompleted: any = [];
    const rest_yetToStart: any = [];

    for (let i = 0; i < totData.length; i++) {
      const data = totData[i];
      top5_cats.push(data.name);
      top5_completed.push({
        y: data.full_completed,
        point: this.abbreviateNumber(data.full_completed_sum_insured),
        claim_amount: data.partial_claim_amount,
        gross_premium: data.partial_gross_premium,
      });
      top5_partiallyCompleted.push({
        y: data.partially_completed,
        point: this.abbreviateNumber(data.partially_completed_sum_insured),
        claim_amount: data.partial_claim_amount,
        gross_premium: data.partial_gross_premium,
      });
      top5_yetToStart.push({
        y: data.yet_to_start,
        point: this.abbreviateNumber(data.yet_to_start_sum_insured),
        claim_amount: data.partial_claim_amount,
        gross_premium: data.partial_gross_premium,
      });
    }
    for (let i = 0; i < remainData.length; i++) {
      const data = remainData[i];
      rest_cats.push(data.name);
      rest_completed.push({
        y: data.full_completed,
        point: this.abbreviateNumber(data.full_completed_sum_insured),
        claim_amount: data.partial_claim_amount,
        gross_premium: data.partial_gross_premium,
      });
      rest_partiallyCompleted.push({
        y: data.partially_completed,
        point: this.abbreviateNumber(data.partially_completed_sum_insured),
        claim_amount: data.partial_claim_amount,
        gross_premium: data.partial_gross_premium,
      });
      rest_yetToStart.push({
        y: data.yet_to_start,
        point: this.abbreviateNumber(data.yet_to_start_sum_insured),
        claim_amount: data.partial_claim_amount,
        gross_premium: data.partial_gross_premium,
      });
    }

    const chartColumnClick = (event: any) => {
      if (event?.point?.category == "Others") {
        this.modalService.open(this.noOfCCEModal, { size: "xl" });
        setTimeout(() => {
          this.generateCropCompletionRatio_modal(
            rest_cats,
            rest_completed,
            rest_partiallyCompleted,
            rest_yetToStart
          );
        }, 500);
      }
    };

    const option = {
      title: {
        text: "",
      },
      xAxis: {
        categories: top5_cats,
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
          labels: this.chartlabels,
          min: 0,
          opposite: true,
          title: {
            text: "",
          },
        },
      ],
      tooltip: {
        headerFormat: "<b>{point.x}</b><br/>",
        pointFormat: " <b>{series.name}: {point.y:.0f} </b> ",
      },
      plotOptions: {
        column: {
          dataLabels: {
            enabled: true,
          },
          events: {
            click: function (event: any) {
              chartColumnClick(event);
            },
          },
          stacking: "normal",
        },
        line: {
          dataLabels: {
            enabled: true,
            x: 45,
            style: {
              marginLeft: "40px",
            },
          },
        },
      },
      series: [
        {
          type: "column",
          name: "Yet to start",
          color: "#a5a5a5",
          data: top5_yetToStart,
          dataLabels: {
            enabled: true,
            rotation: 0,
            color: "#000",
            align: "center",
            format: "{point.y}",
            y: -5,
            style: {
              fontSize: "10px",
            },
          },
        },
        {
          type: "column",
          name: "Partially Completed",
          color: "#ed7d31",
          data: top5_partiallyCompleted,
          dataLabels: {
            enabled: true,
            rotation: 0,
            color: "#000",
            align: "center",
            format: "{point.y}",
            y: -5,
            style: {
              fontSize: "10px",
            },
          },
        },
        {
          type: "column",
          name: "Fully Completed",
          color: "#4473c5",
          data: top5_completed,
          dataLabels: {
            enabled: true,
            rotation: 0,
            color: "#000",
            align: "center",
            format: "{point.y}",
            y: -5,
            style: {
              fontSize: "10px",
            },
          },
        },
      ],
    };

    this.cropCompletionRatioChart = new Chart(Object.assign(option));
  }

  generateloss_no_of_iu(totData: any[]) {
    let seriesData = [];
    let states = this.core.uniqueList(totData, "state_id");
    let distircts = this.core.uniqueList(totData, "dist_id");
    let tehsil = this.core.uniqueList(totData, "tehsil_id");
    const lossData = totData.filter((d) => d.loss > 0);
    let allData = [];
    if (distircts.length == 1) {
      tehsil = tehsil.filter((e: any) =>
        this.isValidSI(
          totData.filter((d: any) => d.tehsil_id == e),
          "sum_insured"
        )
      );
      seriesData = tehsil.map((s) => {
        allData = lossData.filter((d: any) => d.tehsil_id == s);
        const tot = allData
          .map((d: any) => d.actialYield)
          .reduce((a: any, b: any) => a + b, 0);
        const planned = allData
          .map((d: any) => d.avgTY)
          .reduce((a: any, b: any) => a + b, 0);
        return {
          name: this.tehsilMap.get(s),
          y: allData.length,
          custome: {
            name: this.tehsilMap.get(s),
            planned: this.abbreviateNumber(planned),
            tot: this.abbreviateNumber(tot),
          },
        };
      });
    } else if (states.length == 1) {
      distircts = distircts.filter((e: any) =>
        this.isValidSI(
          totData.filter((d: any) => d.dist_id == e),
          "sum_insured"
        )
      );
      seriesData = distircts.map((s) => {
        allData = lossData.filter((d: any) => d.dist_id == s);
        const tot = allData
          .map((d: any) => d.actialYield)
          .reduce((a: any, b: any) => a + b, 0);
        const planned = allData
          .map((d: any) => d.avgTY)
          .reduce((a: any, b: any) => a + b, 0);
        return {
          name: this.districtMap.get(s),
          y: allData.length,
          custome: {
            name: this.districtMap.get(s),
            planned: this.abbreviateNumber(planned),
            tot: this.abbreviateNumber(tot),
          },
        };
      });
    } else {
      states = states.filter((e: any) =>
        this.isValidSI(
          totData.filter((d: any) => d.state_id == e),
          "sum_insured"
        )
      );
      seriesData = states.map((s) => {
        allData = lossData.filter((d: any) => d.state_id == s);
        const tot = allData
          .map((d: any) => d.actialYield)
          .reduce((a: any, b: any) => a + b, 0);
        const planned = allData
          .map((d: any) => d.avgTY)
          .reduce((a: any, b: any) => a + b, 0);
        return {
          name: this.stateMap.get(s),
          y: allData.length,
          custome: {
            name: this.stateMap.get(s),
            planned: this.abbreviateNumber(planned),
            tot: this.abbreviateNumber(tot),
          },
        };
      });
    }

    const option = {
      chart: {
        type: "pie",
        renderTo: "container",
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
            format: "{point.name}: {point.y:.0f}%",
          },
        },
      },
      tooltip: {
        headerFormat: '<span style="font-size:11px">{series.name}</span><br>',
        pointFormat:
          '<span style="color:{point.color}">{point.name}</span>: <b>{point.percentage:.0f}%</b> of total<br/>',
      },
      colors: [
        "#7a7777",
        "#c4260a",
        "#c46a0a",
        "#1cc40a",
        "#C15BB3",
        "#175788",
        "#FF9655",
        "#FFF263",
        "#6AF9C4",
      ],
      series: [
        {
          name: "",
          data: [...seriesData],
        },
      ],
    };

    this.loss_no_of_iu = new Chart(Object.assign(option));
  }

  generateNo_loss_no_of_iu(totData: any[]) {
    let seriesData = [];
    let states = this.core.uniqueList(totData, "state_id");
    let distircts = this.core.uniqueList(totData, "dist_id");
    let tehsil = this.core.uniqueList(totData, "tehsil_id");
    const lossData = totData.filter((d) => d.loss <= 0);
    let allData = [];
    if (distircts.length == 1) {
      tehsil = tehsil.filter((e: any) =>
        this.isValidSI(
          totData.filter((d: any) => d.tehsil_id == e),
          "sum_insured"
        )
      );
      seriesData = tehsil.map((s) => {
        allData = lossData.filter((d: any) => d.tehsil_id == s);
        const tot = allData
          .map((d: any) => d.actialYield)
          .reduce((a: any, b: any) => a + b, 0);
        const planned = allData
          .map((d: any) => d.avgTY)
          .reduce((a: any, b: any) => a + b, 0);
        return {
          name: this.tehsilMap.get(s),
          y: allData.length,
          custome: {
            name: this.tehsilMap.get(s),
            planned: this.abbreviateNumber(planned),
            tot: this.abbreviateNumber(tot),
          },
        };
      });
    } else if (states.length == 1) {
      distircts = distircts.filter((e: any) =>
        this.isValidSI(
          totData.filter((d: any) => d.dist_id == e),
          "sum_insured"
        )
      );
      seriesData = distircts.map((s) => {
        allData = lossData.filter((d: any) => d.dist_id == s);
        const tot = allData
          .map((d: any) => d.actialYield)
          .reduce((a: any, b: any) => a + b, 0);
        const planned = allData
          .map((d: any) => d.avgTY)
          .reduce((a: any, b: any) => a + b, 0);
        return {
          name: this.districtMap.get(s),
          y: allData.length,
          custome: {
            name: this.districtMap.get(s),
            planned: this.abbreviateNumber(planned),
            tot: this.abbreviateNumber(tot),
          },
        };
      });
    } else {
      states = states.filter((e: any) =>
        this.isValidSI(
          totData.filter((d: any) => d.state_id == e),
          "sum_insured"
        )
      );
      seriesData = states.map((s) => {
        allData = lossData.filter((d: any) => d.state_id == s);
        const tot = allData
          .map((d: any) => d.actialYield)
          .reduce((a: any, b: any) => a + b, 0);
        const planned = allData
          .map((d: any) => d.avgTY)
          .reduce((a: any, b: any) => a + b, 0);
        return {
          name: this.stateMap.get(s),
          y: allData.length,
          custome: {
            name: this.stateMap.get(s),
            planned: this.abbreviateNumber(planned),
            tot: this.abbreviateNumber(tot),
          },
        };
      });
    }
    const option = {
      chart: {
        type: "pie",
        renderTo: "container",
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
            format: "{point.name}: {point.y:.0f}%",
          },
        },
      },
      tooltip: {
        headerFormat: '<span style="font-size:11px">{series.name}</span><br>',
        pointFormat:
          '<span style="color:{point.color}">{point.name}</span>: <b>{point.percentage:.0f}%</b> of total<br/>',
      },
      colors: [
        "#7a7777",
        "#c4260a",
        "#c46a0a",
        "#1cc40a",
        "#C15BB3",
        "#175788",
        "#FF9655",
        "#FFF263",
        "#6AF9C4",
      ],
      series: [
        {
          name: "",
          data: [...seriesData],
        },
      ],
    };

    this.No_loss_no_of_iu = new Chart(Object.assign(option));
  }

  generateIus_all_planned_cce_completed(totData: any) {
    let seriesData: any = [];
    for (let indx = 0; indx < totData.length; indx++) {
      seriesData.push({
        name: totData[indx].name,
        y:
          this.divide(totData[indx].full_completed, totData[indx].planned) *
          100,
        custome: {
          name: totData[indx].name,
          planned: this.abbreviateNumber(totData[indx].planned),
          tot: this.abbreviateNumber(totData[indx].full_completed),
        },
      });
    }

    const option = {
      chart: {
        type: "pie",
        renderTo: "container",
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
            format: "{point.name}: {point.y:.0f}%",
          },
        },
      },
      tooltip: {
        headerFormat: '<span style="font-size:11px">{series.name}</span><br>',
        pointFormat: `
          <span>Planned</span>: <b>{point.custome.planned}</b> <br/>
          <span>Completed</span>: <b>{point.custome.tot}%</b><br/>
          <span>{point.name}</span>: <b>{point.y:.0f}%</b> of total<br/>
          `,
      },
      colors: [
        "#7a7777",
        "#c4260a",
        "#c46a0a",
        "#1cc40a",
        "#C15BB3",
        "#175788",
        "#FF9655",
        "#FFF263",
        "#6AF9C4",
      ],
      series: [
        {
          name: "",
          data: [...seriesData],
        },
      ],
    };

    this.Ius_all_planned_cce_completed = new Chart(Object.assign(option));
  }

  generateLoss_ratio(totData: any[], remainData: any) {
    const [top5_cats, top5_actual, top5_expect]: any[] = [[], [], []];
    const [rest_cats, rest_actual, rest_expect]: any[] = [[], [], []];
    for (let i = 0; i < totData.length; i++) {
      const data = totData[i];
      top5_cats.push(data.name);
      top5_actual.push({
        y: data.partial_loss_ratio * 100,
        claim_amount: this.abbreviateNumber(data.partial_claim_amount) || 0,
        gross_premium: this.abbreviateNumber(data.partial_gross_premium),
        d_claim_amount: data.partial_claim_amount,
        d_gross_premium: data.partial_gross_premium,
      });
      top5_expect.push({
        y: data.expected_loss_ratio * 100,
        claim_amount: this.abbreviateNumber(data.expected_claim_amount) || 0,
        gross_premium: this.abbreviateNumber(data.gross_premium),
        d_claim_amount: data.expected_claim_amount,
        d_gross_premium: data.partial_gross_premium,
      });
    }
    for (let i = 0; i < remainData.length; i++) {
      const data = remainData[i];
      rest_cats.push(data.name);
      rest_actual.push({
        y: data.partial_loss_ratio * 100,
        claim_amount: this.abbreviateNumber(data.partial_claim_amount) || 0,
        gross_premium: this.abbreviateNumber(data.partial_gross_premium),
        d_claim_amount: data.partial_claim_amount,
        d_gross_premium: data.partial_gross_premium,
      });
      rest_expect.push({
        y: data.expected_loss_ratio * 100,
        claim_amount: this.abbreviateNumber(data.expected_claim_amount) || 0,
        gross_premium: this.abbreviateNumber(data.gross_premium),
        d_claim_amount: data.expected_claim_amount,
        d_gross_premium: data.gross_premium,
      });
    }

    const chartColumnClick = (event: any) => {
      if (event?.point?.category == "Others") {
        this.modalService.open(this.actualExpectedLossModal, { size: "xl" });
        setTimeout(() => {
          this.generateLoss_ratio_modal(rest_cats, rest_actual, rest_expect);
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
      subtitle: {
        text: "",
      },
      xAxis: {
        categories: top5_cats,
        labels: this.chartlabels,
        crosshair: true,
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
          labels: this.chartlabels,
          opposite: true,
          title: {
            text: "",
          },
        },
      ],
      legend: {
        enabled: true,
      },
      plotOptions: {
        series: {
          events: {
            click: function (event: any) {
              chartColumnClick(event);
            },
          },
        },
      },
      tooltip: {
        headerFormat: "<b>{point.x}</b><br/>",
        pointFormat:
          " <b>{series.name}: {point.y:.0f} % <br>Claim Amount : {point.claim_amount:.0f} <br>Gross Premium : {point.gross_premium:.0f}</b> ",
      },
      series: [
        {
          name: "Actual LR",
          color: "#1e535f",
          data: top5_actual,
          dataLabels: {
            enabled: true,
            rotation: 0,
            color: "#000",
            align: "center",
            format: "{point.y:.0f} %",
            y: -5,
            style: {
              fontSize: "10px",
            },
          },
        },
        {
          name: "Expected LR",
          color: "#ff9655",
          data: top5_expect,
          dataLabels: {
            enabled: true,
            rotation: 0,
            color: "#000",
            align: "center",
            format: "{point.y:.0f} %",
            y: -5,
            style: {
              fontSize: "10px",
            },
          },
        },
      ],
    };
    this.Loss_ratio = new Chart(Object.assign(option));
  }

  generateClaim_Amount(totData: any) {
    let seriesData: any = [];
    for (let indx = 0; indx < totData.length; indx++) {
      seriesData.push({
        name: totData[indx].name,
        y: totData[indx].partial_claim_amount,
        custome: {
          name: totData[indx].name,
          tot: this.abbreviateNumber(totData[indx].partial_claim_amount),
        },
      });
    }
    const option = {
      chart: {
        type: "pie",
        renderTo: "container",
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
            format: "{point.name}: {point.custome.tot:.0f}",
          },
        },
      },
      tooltip: {
        headerFormat: '<span style="font-size:11px">{point.name}</span><br>',
        pointFormat: ` <span style="font-size:11px">{point.name}</span><br>
          <span>{series.name}</span>: <b>{point.custome.tot:.0f}</b><br/>`,
      },
      colors: [
        "#7a7777",
        "#c4260a",
        "#c46a0a",
        "#1cc40a",
        "#C15BB3",
        "#175788",
        "#FF9655",
        "#FFF263",
        "#6AF9C4",
      ],
      series: [
        {
          name: "Claim Amount",
          data: [...seriesData],
        },
      ],
    };

    this.Claim_Amount = new Chart(Object.assign(option));
  }

  generateLoss_Ratio_over_time(totData: any[]) {
    const cats: any = [];
    const completed: any = [];
    const inCompleted: any = [];
    const missedDataSeries: any = [];
    const lossRatio: any = [];

    for (let indx = 0; indx < totData.length; indx++) {
      cats.push(totData[indx].name);
      completed.push({
        y: totData[indx].full_completed_sum_insured,
        point: this.abbreviateNumber(totData[indx].full_completed_sum_insured),
      });
      inCompleted.push({
        y: totData[indx].partially_completed_sum_insured,
        point: this.abbreviateNumber(
          totData[indx].partially_completed_sum_insured
        ),
      });
      missedDataSeries.push({
        y: totData[indx].yet_to_start_sum_insured,
        point: this.abbreviateNumber(totData[indx].yet_to_start_sum_insured),
      });
      lossRatio.push(totData[indx].partial_loss_ratio * 100);
    }
    const option = {
      title: {
        text: "",
      },
      xAxis: {
        categories: cats,
        labels: this.chartlabels,
      },
      yAxis: [
        {
          gridLineWidth: 0,
          min: 0,
          labels: {
            style: this.chartStyle,
            formatter: function (env: any) {
              return (env.value / 1e7).toFixed(0) + " Cr";
            },
          },
          title: {
            text: "",
          },
        },
        {
          gridLineWidth: 0,
          labels: this.chartlabels,
          min: 0,
          opposite: true,
          title: {
            text: "",
          },
        },
      ],
      tooltip: {
        headerFormat: "",
        pointFormat: ` <span style="font-size:11px">{point.name}</span><br>
      <span style="color:{point.color}">{series.name}</span>: <b>{point.point}</b><br/>`,
      },
      plotOptions: {
        column: {
          dataLabels: {
            enabled: true,
          },
          stacking: "normal",
        },
        line: {
          dataLabels: {
            enabled: true,
            x: 45,
            style: {
              marginLeft: "40px",
            },
          },
        },
      },
      series: [
        {
          type: "column",
          name: "Yet to start",
          color: "#a5a5a5",
          data: missedDataSeries,
          dataLabels: {
            enabled: true,
            rotation: 0,
            color: "#000",
            align: "center",
            format: "{point.point}",
            y: -5,
            style: {
              fontSize: "10px",
            },
          },
        },
        {
          type: "column",
          name: "Partially Completed",
          color: "#ed7d31",
          data: inCompleted,
          dataLabels: {
            enabled: true,
            rotation: 0,
            color: "#000",
            align: "center",
            format: "{point.point}",
            y: -5,
            style: {
              fontSize: "10px",
            },
          },
        },
        {
          type: "column",
          name: "Fully Completed",
          color: "#4473c5",
          data: completed,
          dataLabels: {
            enabled: true,
            rotation: 0,
            color: "#000",
            align: "center",
            format: "{point.point}",
            y: -5,
            style: {
              fontSize: "10px",
            },
          },
        },
        {
          type: "line",
          name: "Loss Ratio",
          color: "#f4c22b",
          yAxis: 1,
          data: lossRatio,
          dataLabels: {
            enabled: true,
            rotation: 0,
            color: "#000",
            align: "center",
            format: "{point.y:.0f}%",
            y: -5,
            style: {
              fontSize: "10px",
            },
          },
          tooltip: {
            headerFormat: "",
            pointFormat: ` <span style="font-size:11px">{point.name}</span><br>
          <span style="color:{point.color}">{series.name}</span>: <b>{point.y:.0f}%</b><br/>`,
          },
          // marker: {
          //   lineWidth: 2,
          //   // lineColor: Highcharts.getOptions().colors[3],
          //   fillColor: "#000",
          // },
        },
      ],
    };

    this.Loss_Ratio_over_time = new Chart(Object.assign(option));
  }

  generateDistrictWiseComplitionGraph(totData: any[]) {
    let states = this.core.uniqueList(totData, "state_id");
    let distircts = this.core.uniqueList(totData, "dist_id");
    let tehsil = this.core.uniqueList(totData, "tehsil_id");

    let cats = [];
    let allData = [];

    if (distircts.length == 1) {
      tehsil = tehsil.filter((e: any) =>
        this.isValidSI(
          totData.filter((d: any) => d.tehsil_id == e),
          "sumInsured"
        )
      );
      cats = tehsil.map((d) => this.tehsilMap.get(d));

      allData = tehsil.map((s) => {
        const r: any = {};
        const d = totData.filter((e: any) => e.tehsil_id == s);
        r.completed = d
          .map((e) => (e.IU_size ? 1 : 0))
          .reduce((a: any, b: any) => a + b, 0);
        r.expected = d.length * 4;
        r.incomplete = r.expected - r.completed;
        r.totalUpload = d.length;
        r.name = this.tehsilMap.get(d);
        r.completedPer = (r.completed / r.expected) * 100;
        return r;
      });
    } else if (states.length == 1) {
      distircts = distircts.filter((e: any) =>
        this.isValidSI(
          totData.filter((d: any) => d.dist_id == e),
          "sumInsured"
        )
      );
      cats = distircts.map((d) => this.districtMap.get(d));
      allData = distircts.map((s) => {
        const r: any = {};
        const d = totData.filter((e: any) => e.dist_id == s);
        r.completed = d
          .map((e) => (e.IU_size ? 1 : 0))
          .reduce((a: any, b: any) => a + b, 0);
        r.expected = d.length * 4;
        r.incomplete = r.expected - r.completed;
        r.totalUpload = d.length;
        r.name = this.tehsilMap.get(d);
        r.completedPer = (r.completed / r.expected) * 100;
        return r;
      });
    } else {
      states = states.filter((e: any) =>
        this.isValidSI(
          totData.filter((d: any) => d.state_id == e),
          "sumInsured"
        )
      );
      cats = states.map((d) => this.stateMap.get(d));
      allData = states.map((s) => {
        const r: any = {};
        const d = totData.filter((e: any) => e.state_id == s);
        r.completed = d
          .map((e) => (e.IU_size ? 1 : 0))
          .reduce((a: any, b: any) => a + b, 0);
        r.expected = d.length * 4;
        r.incomplete = r.expected - r.completed;
        r.totalUpload = d.length;
        r.name = this.tehsilMap.get(d);
        r.completedPer = (r.completed / r.expected) * 100;
        return r;
      });
    }

    const completed = allData.map((d: any) => {
      return { name: d.name, y: d.completed, custome: d };
    });
    const inCompleted = allData.map((d: any) => {
      return { name: d.name, y: d.incomplete, custome: d };
    });

    const option = {
      chart: {
        type: "column",
      },
      title: {
        text: "",
      },

      xAxis: {
        categories: cats,
      },
      yAxis: {
        gridLineWidth: 0,
        title: "",
      },
      credits: {
        enabled: false,
      },
      plotOptions: {
        column: {
          stacking: "normal",
          dataLabels: {
            enabled: true,
            format: "{point.y:.0f}",
          },
        },
      },
      tooltip: {
        headerFormat: "",
        pointFormat: `<b>{point.custome.name}</b><br/>
        <b>Total IU’s {point.custome.totalUpload:.0f}</b><br/>
        <b>CCE’s Completed in IU’s: {point.custome.completed:.0f} ({point.custome.completedPer:.0f}%) </b> <br/>
        <b>CCE’s not completed in IU’s: {point.custome.incomplete:.0f} </b>
        
        `,
      },
      series: [
        {
          name: "Completed",
          data: completed,
          color: "#4472c4",
        },
        {
          name: "In-Completed",
          data: inCompleted,
          color: "#ed7d31",
        },
      ],
    };
    this.districtWiseCompletion = new Chart(Object.assign(option));
  }

  abbreviateNumber(number: any, excp?: any): any | void {
    const numberFormatter = new Intl.NumberFormat("en-IN", {
      maximumFractionDigits: 1,
    });
    if (!number) {
      return excp ? excp : "";
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
    this.minDate = null;
    this.maxDate = null;
    this.surveyData = [];
    this.allData = [];
    this.revisitData = [];
    this.surveyLocation = [];
    if (this.mapDetail) {
      this.mapDetail.clearDetail();
    }
  }

  divide = (numerator: number, denominator: number) =>
    denominator == 0 ? 0 : numerator / denominator;

  generateExcel() {
    this.districtDashboardData;
    const header = [
      "state_id",
      "dist_id",
      "name",
      "threshold_yield",
      "draige_factor",
      "gross_premium",
      "sum_insured",
      "expected",
      "no_of_CCEs_planned",
      "no_of_survey",
      "area",
      "dry_weight",
      "exposure_covered",
      "partially_completed",
      "full_completed",
      "yet_to_start",
      "actual_yeild",
      "deficiency",
      "no_of_survey_pending",
      "expected_loss_ratio",
      "expected_deficiency",
      "expected_claim",
      "total_gross_premium",
      "claim_amount",
      "actual_loss_ratio",
    ];
    const totHeader = [
      "state_id",
      "State",
      "dist_id",
      "District Name",
      "tehsil_id",
      "Tehsil Name",
      "gp_notified_area",
      "notified_unit",
      "crop",
      "threshold_yield",
      "draige_factor",
      "gross_premium",
      "sum_insured",
      "expected",
      "no_of_CCEs_planned",
      "season",
      "year",
      "date_of_sowing",
      "date_of_loss",
      "no_of_survey",
      "exposure_covered",
      "partially_completed",
      "full_completed",
      "yet_to_start",
      "area",
      "dry_weight",
      "actual_yeild",
      "deficiency",
      "no_of_survey_pending",
      "expected_loss_ratio",
      "claim_amount",
      "expected_claim",
      "actual_loss_ratio",
      "survey_date",
    ];

    const data = this.districtDashboardData.map((d) => header.map((k) => d[k]));
    data.unshift(header);

    const totData = this.totData.map((d) => totHeader.map((k) => d[k]));
    totData.unshift(totHeader);

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
    const wstot: XLSX.WorkSheet = XLSX.utils.json_to_sheet(totData);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    const sheetName = "District";
    XLSX.utils.book_append_sheet(wb, ws, "District");
    XLSX.utils.book_append_sheet(wb, wstot, "All");
    XLSX.writeFile(wb, `${new Date().getTime()}.xlsx`);
  }

  generateLoss_ratio_modal(rest_cats: any, rest_actual: any, rest_expect: any) {
    const option = {
      chart: {
        type: "column",
      },
      title: {
        text: "",
      },
      subtitle: {
        text: "",
      },
      xAxis: {
        categories: rest_cats,
        labels: this.chartlabels,
        crosshair: true,
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
          labels: this.chartlabels,
          opposite: true,
          title: {
            text: "",
          },
        },
      ],
      legend: {
        enabled: true,
      },
      plotOptions: {
        series: {},
      },
      tooltip: {
        headerFormat: "<b>{point.x}</b><br/>",
        pointFormat:
          " <b>{series.name}: {point.y:.0f} % <br>Claim Amount : {point.claim_amount:.0f} <br>Gross Premium : {point.gross_premium:.0f}</b> ",
      },
      series: [
        {
          name: "Actual LR",
          color: "#1e535f",
          data: rest_actual,
          dataLabels: {
            enabled: true,
            rotation: 0,
            color: "#000",
            align: "center",
            format: "{point.y:.0f} %",
            y: -5,
            style: {
              fontSize: "10px",
            },
          },
        },
        {
          name: "Expected LR",
          color: "#ff9655",
          data: rest_expect,
          dataLabels: {
            enabled: true,
            rotation: 0,
            color: "#000",
            align: "center",
            format: "{point.y:.0f} %",
            y: -5,
            style: {
              fontSize: "10px",
            },
          },
        },
      ],
    };
    this.Loss_ratio_modal = new Chart(Object.assign(option));
  }

  generateLocationCompletionRatio_modal(
    rest_cats: any,
    rest_completed: any,
    rest_partiallyCompleted: any,
    rest_yetToStart: any
  ) {
    const option = {
      title: {
        text: "",
      },
      xAxis: {
        categories: rest_cats,
        labels: this.chartlabels
      },
      yAxis: [
        {
          gridLineWidth: 0,
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
        },
        {
          gridLineWidth: 0,
          min: 0,
          opposite: true,
          title: {
            text: "",
          },
        },
      ],
      tooltip: {
        headerFormat: "<b>{point.x}</b><br/>",
        pointFormat: " <b>{series.name}: {point.point} </b> ",
      },
      plotOptions: {
        column: {
          dataLabels: {
            enabled: true,
          },
          stacking: "normal",
        },
        line: {
          dataLabels: {
            enabled: true,
            x: 45,
            style: {
              marginLeft: "40px",
            },
          },
        },
      },
      series: [
        {
          type: "column",
          name: "Yet to start",
          color: "#a5a5a5",
          data: rest_yetToStart,
          dataLabels: {
            enabled: true,
            rotation: 0,
            color: "#000",
            align: "center",
            format: "{point.point}",
            y: -5,
            style: {
              fontSize: "10px",
            },
          },
        },
        {
          type: "column",
          name: "Partially Completed",
          color: "#ed7d31",
          data: rest_partiallyCompleted,
          dataLabels: {
            enabled: true,
            rotation: 0,
            color: "#000",
            align: "center",
            format: "{point.point}",
            y: -5,
            style: {
              fontSize: "10px",
            },
          },
        },
        {
          type: "column",
          name: "Fully Completed",
          color: "#4473c5",
          data: rest_completed,
          dataLabels: {
            enabled: true,
            rotation: 0,
            color: "#000",
            align: "center",
            format: "{point.point}",
            y: -5,
            style: {
              fontSize: "10px",
            },
          },
        },
      ],
    };

    this.locationCompletionRatioChart_modal = new Chart(Object.assign(option));
  }

  generateCropCompletionRatio_modal(
    rest_cats: any,
    rest_completed: any,
    rest_partiallyCompleted: any,
    rest_yetToStart: any
  ) {
    const option = {
      title: {
        text: "",
      },
      xAxis: {
        categories: rest_cats,
        labels: this.chartlabels
      },
      yAxis: [
        {
          gridLineWidth: 0,
          labels: this.chartlabels,
          min: 0,
          title: {
            text: "",
          },
        },
        {
          gridLineWidth: 0,
          labels: this.chartlabels,
          min: 0,
          opposite: true,
          title: {
            text: "",
          },
        },
      ],
      tooltip: {
        headerFormat: "<b>{point.x}</b><br/>",
        pointFormat: " <b>{series.name}: {point.y:.0f} </b> ",
      },
      plotOptions: {
        column: {
          dataLabels: {
            enabled: true,
          },
          stacking: "normal",
        },
        line: {
          dataLabels: {
            enabled: true,
            x: 45,
            style: {
              marginLeft: "40px",
            },
          },
        },
      },
      series: [
        {
          type: "column",
          name: "Yet to start",
          color: "#a5a5a5",
          data: rest_yetToStart,
          dataLabels: {
            enabled: true,
            rotation: 0,
            color: "#000",
            align: "center",
            format: "{point.y}",
            y: -5,
            style: {
              fontSize: "10px",
            },
          },
        },
        {
          type: "column",
          name: "Partially Completed",
          color: "#ed7d31",
          data: rest_partiallyCompleted,
          dataLabels: {
            enabled: true,
            rotation: 0,
            color: "#000",
            align: "center",
            format: "{point.y}",
            y: -5,
            style: {
              fontSize: "10px",
            },
          },
        },
        {
          type: "column",
          name: "Fully Completed",
          color: "#4473c5",
          data: rest_completed,
          dataLabels: {
            enabled: true,
            rotation: 0,
            color: "#000",
            align: "center",
            format: "{point.y}",
            y: -5,
            style: {
              fontSize: "10px",
            },
          },
        },
      ],
    };

    this.cropCompletionRatioChart_modal = new Chart(Object.assign(option));
  }

  generateius_having_loss_and_no_loss_modal(restData: any) {
    const option = {
      chart: {
        type: "bar",
      },
      title: {
        text: "",
      },
      xAxis: {
        categories: restData.rest_names,
        labels: this.chartlabels,
      },
      yAxis: {
        gridLineWidth: 0,
        min: 0,
        labels: this.chartlabels,
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
      },
      plotOptions: {
        bar: {
          stacking: "normal",
          dataLabels: {
            enabled: true,
            color: "#000",
          },
        },
      },
      series: [
        {
          name: "CCEs not completed in IU’s & Crop",
          data: restData.rest_mData,
          color: "#a5a5a5",
        },
        {
          name: "No Loss in IU’s & Crop",
          data: restData.rest_nData,
          color: "#548235",
        },
        {
          name: "Loss in IU’s & Crop",
          data: restData.rest_lData,
          color: "#C15BB3",
        },
      ],
    };

    this.ius_having_loss_and_no_loss_modal = new Chart(Object.assign(option));
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

  actialYield = (data: any[], draige_factor: number, plotSize: any) => {
    if (!data?.length) {
      return 0;
    }

    const areaWeght = data
      .map((d) => {
        const result = { area: 0, weight: 0 };
        result.area = plotSize;
        result.weight = Number(d.dry_weight || 0);
        return result.area
          ? (10000 / result.area) * result.weight * draige_factor
          : 0;
      })
      .reduce((a: any, b: any) => a + b, 0);
    if (areaWeght) return areaWeght / data.length;
    return 0;
  };

  getAreaWeight = (data: any, plotSize: any): any[] => {
    if (!data?.length) {
      return [0, 0];
    }

    const areaWeght = data.map((d: any) => {
      const result = { area: 0, weight: 0 };
      result.area = plotSize;
      result.weight = Number(d.dry_weight || 0);
      return result;
    });
    const area = areaWeght
      .map((d: any) => +(d.area || 0))
      .reduce((a: any, b: any) => a + b, 0);
    const weight = areaWeght
      .map((d: any) => +(d.weight || 0))
      .reduce((a: any, b: any) => a + b, 0);

    return [area || 0, weight || 0];
  };

  get deactiveField() {
    return this.singleYear && this.singleseason && this.selectedAgency?.length;
  }
}
