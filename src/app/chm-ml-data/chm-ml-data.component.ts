import { Component, OnInit, ViewChild } from "@angular/core";
import * as moment from "moment";
import { FilterService } from "../utilities/filter.service";
import { CoreService } from "../utilities/core.service";
import { UserDetailService } from "../auth/user-detail.service";
import * as XLSX from "xlsx";
import { FeatureToggleService } from '../shared/services/feature-toggle.service';
import { environment, ProjectContext } from '../../environments/environment';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Component({
  selector: "app-chm-ml-data",
  templateUrl: "./chm-ml-data.component.html",
  styleUrls: ["./chm-ml-data.component.css"],
})
export class ChmMlDataComponent implements OnInit {
  loading = 0;
  downloading = 0;
  lookupLoader = 0;
  isFilterCollapsed = true;
  isStateLoading = 0;
  isCropLoading = 0;
  agencyLoading = 0;
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
  localeValue = {
    format: "DD/MM/YYYY",
    displayFormat: "DD-MM-YYYY",
    separator: " - ",
    cancelLabel: "Cancel",
    applyLabel: "Okay",
  };
  maxDate: any = moment();
  surveyId = 1;
  imgURL:any = "";
  imgURLSuffix:any  = "";
  tableFields: any[] =[];
  tableData: any[] =[];
  totalData: any[] =[];
  currentpage = 1;
  recordsPerPage = 10;
  @ViewChild("pagination") pagination: any;

  yearData: any[] = [];
  seasonData: any[] = [];
  clientData: any[] = [];
  agencyData: any[] = [];
  statesData: any[] = [];
  districtData: any[] = [];
  blockData: any[] = [];
  cropsData: any[] = [];
  dataCrops: any[] = [];

  selectedYear: any = "";
  selectedSeason: any = "";
  singleClient: any = "";
  selectedAgency: any[] = [];
  selectedState: any[] = [];
  selectedDist: any[] = [];
  selectedBlock: any[] = [];
  selectedCrop: any[] = [];
  selectedFromDate: any = {
    startDate: moment().subtract(7, "days"),
    endDate: moment(),
  };
  selectednotifiedUnits: any[] = [];
  selectedClient: any[] = [];

  states: any[] = [];
  districts: any[] = [];
  tehsils: any[] = [];
  crops: any[] = [];
  clientStates: any[] = [];
  clientDistricts: any = [];
  clientTehsils: any[] = [];

  stateMap: Map<any, any> = new Map();
  districtMap: Map<any, any> = new Map();
  tehsilMap: Map<any, any> = new Map();
  cropMap: Map<any, any> = new Map();
  seasonMap: Map<any, any> = new Map();
  yearMap: Map<any, any> = new Map();
  notifiedUnitMap: Map<any, any> = new Map();

  fieldsData: any[] = [];
  fieldDataMap: any;
  projectContext: ProjectContext;
  assetsFolder: string;

  constructor(
    private filter: FilterService,
    private core: CoreService,
    private userService: UserDetailService,
    private featureToggle: FeatureToggleService,
    private sanitizer: DomSanitizer
  ) {
      this.projectContext = this.featureToggle.getContext() as ProjectContext;
      this.assetsFolder = environment.projectConfigs[this.projectContext].assetsFolder;
    }

  ngOnInit(): void {
    const config = this.featureToggle.getConfig();
    this.imgURL = config.BASEKMLPREFIX;
    this.imgURLSuffix  = config.BASEKMLSUFFIX;
    this.user = this.userService.getUserDetail();
    this.getLocationCropData();
    this.lookupLoader++;
    if (this.filter.isLoactionFetched) {
      this.getLocationsData();
    } else {
      this.filter.fetchedLocationData.subscribe(() => {
        this.getLocationsData();
      });
    }
  }

  getLocationsData() {
    this.lookupLoader--;
    this.states = this.core.clone(this.filter.states);
    this.districts = this.core.clone(this.filter.districts);
    this.tehsils = this.core.clone(this.filter.tehsils);
    this.crops = this.core.clone(this.filter.crops);
    this.clientData = this.core.clone(this.filter.clients);

    this.yearData = this.filter.years;
    this.seasonData = this.filter.seasons;

    this.getAllStates();

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

    // lkp_crop mapping
    for (let indx = 0; indx < this.filter.crops.length; indx++) {
      const item = this.filter.crops[indx];
      this.cropMap.set(item.crop_code, item.crop_name);
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
  }

  getLocationCropData() {
    this.selectedCrop = [];
    const request = {
      purpose: "lkp_chm_crop",
      state: this.selectedState.map((d) => d.state_id),
      district: this.selectedDist.map((d) => d.district_id),
      tehsils: this.selectedBlock.map((d) => d.tehsil_id),
      notifiedUnit: this.selectednotifiedUnits.map((d) => d.notified_id),
    };

    if (this.dataCrops?.length) {
      const cropsData = this.core.clone(
        this.dataCrops.filter((d) => {
          return (
            (!request.state.length || request.state.includes(d.state_id)) &&
            (!request.district.length ||
              request.district.includes(d.dist_id)) &&
            (!request.notifiedUnit.length ||
              request.notifiedUnit.includes(d.notified_unit))
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
    this.isCropLoading++;
    this.core
      .dashboard_post(request)
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
      .finally(() => this.isCropLoading--);
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
      this.user
    );
    this.isStateLoading--;
    this.clientStates = location.states || [];
    this.clientDistricts = location.districts;
    this.clientTehsils = location.tehsils;

    this.statesData = this.clientStates;
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

  getAllStates() {
    if (!this.singleClient) {
      this.statesData = this.states;
    }
  }

  onYearSelect(env: any) {
    this.agencyData = [];
    this.statesData = [];
    this.districtData = [];
    this.blockData = [];
    if (!["7"].includes(this.user?.user_role)) {
      this.selectedAgency = [];
    }
    this.selectedState = [];
    this.selectedDist = [];
    this.selectedBlock = [];
    this.clientStates = [];
    this.clientDistricts = [];
    this.getAgencyData();
    this.getLocationCropData();
    this.getAllStates();
    this.resetData();
  }

  onSeasonSelect(env: any) {
    this.agencyData = [];
    this.statesData = [];
    this.districtData = [];
    this.blockData = [];
    this.selectedAgency = [];
    this.selectedState = [];
    this.selectedDist = [];
    this.selectedBlock = [];
    this.clientStates = [];
    this.clientDistricts = [];
    this.getAgencyData();
    this.getLocationCropData();
    this.getAllStates();
    this.resetData();
  }

  async onClientChange(event: any) {
    this.agencyData = [];
    this.statesData = [];
    this.districtData = [];
    this.blockData = [];
    this.selectedAgency = [];
    this.selectedState = [];
    this.selectedDist = [];
    this.selectedBlock = [];
    this.clientStates = [];
    this.clientDistricts = [];
    this.getLocationCropData();
    this.getAgencyData();
    this.getAllStates();
    this.resetData();
  }

  onSingleClinetChange(event: any) {
    this.selectedAgency = [];
    this.agencyData = [];
    this.selectedClient = [];
    if (event) {
      const client = this.clientData.find((d) => d.UNIT_ID == event);
      if (client) {
        this.selectedClient = [client];
        this.onClientChange(this.selectedClient);
      }
    }
  }

  onAgencyChange(event: any) {
    this.statesData = [];
    this.districtData = [];
    this.blockData = [];
    this.selectedState = [];
    this.selectedDist = [];
    this.selectedBlock = [];
    this.clientStates = [];
    this.clientDistricts = [];
    if (event) {
      this.loadAgencyLocation(event);
    }
    this.getLocationCropData();
    this.getAllStates();
    this.resetData();
  }

  async onStateSelect(event: any) {
    this.districtData = [];
    this.blockData = [];
    this.selectedDist = [];
    this.selectedBlock = [];
    if (event?.length) {
      const districtOptions = this.singleClient
        ? this.core.clone(this.clientDistricts)
        : this.core.clone(this.filter.districts);
      this.districtData = this.core.clone(event).map((state: any) => {
        state.items = districtOptions.filter(
          (dist: any) => dist.state_id == state.state_id
        );
        return state;
      });
    }

    this.getLocationCropData();
    this.resetData();
  }

  onDistSelect(env: any) {
    this.blockData = [];
    this.selectedBlock = [];
    if (env?.length) {
      const tehsilOptions = this.singleClient
        ? this.core.clone(this.clientTehsils)
        : this.core.clone(this.filter.tehsils);
      this.blockData = env.map((d: any) => {
        d.items = tehsilOptions.filter(
          (e: any) => e.district_id == d.district_id
        );
        return d;
      });
    }
    this.getLocationCropData();
    this.resetData();
  }

  onTehsilSelect(env: any) {
    this.getLocationCropData();
    this.resetData();
  }

  resetData() {}

  async applyFilter() {
    const prepared = await this.prepareFilterRequest();
    await this.processFilterResponse(prepared);
  }

  async prepareFilterRequest() {
    const isMunichRe = this.projectContext === 'munichre';
    if (!this.selectedYear) {
      this.core.toast('warn', "Please select year");
      return null;
    }
    if (!this.selectedSeason) {
      this.core.toast('warn', "Please select season");
      return null;
    }
    this.totalData = [];
    this.tableData = [];
    this.tableFields = [];
    this.currentpage = 1;
    const start_date = this.selectedFromDate?.startDate?.format("YYYY-MM-DD");
    const end_date = this.selectedFromDate?.endDate?.format("YYYY-MM-DD");
    const request = {
      purpose: "get_ml_data",
      states: this.selectedState.map(d => d.state_id),
      districts: this.selectedDist.map(d => d.district_id),
      tehsils: this.selectedBlock.map(d => d.tehsil_id),
      crop_id: this.selectedCrop.map(d => d.crop_id),
      start_date,
      end_date,
      client_id: this.selectedClient?.map((d: any) => d.UNIT_ID),
      agency_id: this.selectedAgency.includes("0") ? [] : this.selectedAgency,
      years: [this.selectedYear],
      seasons: [this.selectedSeason],
      crop_column: "field_509",
    };
    const fieldRequest = { purpose: "get_surveyfields", survey_id: this.surveyId };
    const calls = [this.core.post("result", request)];
    if (!this.fieldsData?.length) {
      calls.push(this.core.data_post(fieldRequest));
    }
    return { calls, isMunichRe, request, fieldRequest };
  }

  async processFilterResponse(prepared: any) {
    if (!prepared) {
      return;
    }
    const { calls, isMunichRe } = prepared;
    this.loading++;
    try {
      const data = await this.fetchAndPrepareData(calls, isMunichRe);
      if (!data) {
        return;
      }
      await this.transformAndPaginateData(data.totalData, data.fieldKeys, isMunichRe);
    } catch (err) {
      this.core.toast("warn", "Error fetching data");
    } finally {
      this.loading--;
    }
  }

  private async fetchAndPrepareData(calls: any[], isMunichRe: boolean): Promise<{ totalData: any[], fieldKeys: string[] } | null> {
    const responses: any[] = await Promise.all(calls);
    if (responses?.[1]?.status === 1) {
      this.fieldsData = responses[1].fields || [];
      this.fieldDataMap = {};
      this.fieldsData.forEach(field => {
        this.fieldDataMap[`field_${field.field_id}`] = field.display_name || field.label;
      });
    }
    const result = responses[0];
    if (result?.status !== 1) {
      return null;
    }
    const totalData = result.total_uploads || [];
    if (!totalData.length) {
      return null;
    }
    const fieldKeys = Object.keys(totalData[0]).filter(
      key => key.startsWith("field") && !key.endsWith("id")
    );
    return { totalData, fieldKeys };
  }
  
  private async transformAndPaginateData(totalData: any[], fieldKeys: string[], isMunichRe: boolean): Promise<void> {
    await Promise.all(
      totalData.map(async (data: any, i: number) => {
        data.sno = i + 1;
        fieldKeys.forEach(key => {
          data[this.fieldDataMap[key]] = data[key];
          delete data[key];
        });
        data["field_id"] = this.fieldDataMap[`field_${data["field_id"]}`];
        if (isMunichRe) {
          const relativePath = `api/azure-image/survey/${data.file_name}`;
          try {
            const blob = await this.core.fetchAzureBlob(relativePath);
            data.link = this.sanitizer.bypassSecurityTrustUrl(URL.createObjectURL(blob));
          } catch {
            data.link = null;
          }
        } else {
          data.link = `${this.imgURL}${data.file_name}${this.imgURLSuffix}`;
        }
      })
    );
    this.tableFields = Object.keys(totalData[0]);
    this.tableFields.splice(this.tableFields.indexOf("sno"), 1);
    this.tableFields.unshift("sno");
    this.totalData = totalData;
    this.tableData = this.core.clone(
      this.totalData.slice(
        (this.currentpage - 1) * this.recordsPerPage,
        this.currentpage * this.recordsPerPage
      )
    );
    setTimeout(() => this.pagination?.updatePagination());
  }

  onPageTrigger(env: any) {
    this.currentpage = env.page_no;
    this.recordsPerPage = env.records_per_page;
    this.tableData = this.core.clone(this.totalData.slice(
      ((this.currentpage-1)*this.recordsPerPage),
      (this.currentpage*this.recordsPerPage)
    ))
    if (this.pagination) {
      this.pagination.updatePagination();
    }
  }

  downloadRecords () {
    if (this.downloading) {
      return;
    }
    this.downloading++
    setTimeout(() => {
      const excelData = [];
      for (let i = 0; i < this.totalData.length; i++) {
        const data = this.totalData[i];
        const record = [];
        for (let j = 0; j < this.tableFields.length; j++) {
          const field = this.tableFields[j];
          record.push(data[field])
        }
        excelData.push(record);
      }

      excelData.unshift(this.tableFields.map(d => d.replaceAll('_', ' ').toUpperCase()));
      const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(excelData);
      const wb: XLSX.WorkBook = XLSX.utils.book_new();
      const sheetName = "ML_Data";
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
      XLSX.writeFile(
        wb,
        `${moment(new Date()).format("yyyyMMDD")}_${sheetName}.xlsx`
      );
      this.downloading--;
    })
  }


}
