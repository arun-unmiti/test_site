import { Component, Input, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { CoreService } from "../utilities/core.service";
import { FilterService } from "../utilities/filter.service";
import lgZoom from "lightgallery/plugins/zoom";
import { BeforeSlideDetail } from "lightgallery/lg-events";
import { UserDetailService } from "../auth/user-detail.service";
import * as XLSX from "xlsx";
import * as moment from "moment";
import { Subject } from "rxjs";
import { debounceTime, distinctUntilChanged } from "rxjs/operators";
import { FeatureToggleService } from '../shared/services/feature-toggle.service';
import { environment, ProjectContext } from "../../environments/environment";
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Component({
  selector: "app-survey-wise-data",
  templateUrl: "./survey-wise-data.component.html",
  styleUrls: ["./survey-wise-data.component.css"],
})
export class SurveyWiseDataComponent implements OnInit, OnDestroy {
  @Input() surveyId: any;
  @Input() parentSurveyId: any;
  @Input() surveyName: any;
  @Input() excelDownloadPurpose: any;
  @Input() showApproveColumn: boolean = false;
  @Input() showDateType: boolean = true;
  @Input() showCrop: any = true;
  @Input() showInactiveUser: any = false;
  @Input() surveyStatus: any = 1;
  @Input() canViewData: any = true;
  @ViewChild("pagination") pagination: any;
  noOfVisit: any = "";
  dateType: any = "datetime";
  fields: any[] = [];
  parentFields: any[] = [];
  surveyData: any[] = [];
  locationData: any[] = [];
  loading = 0;
  lookupLoader = 0;
  isStateLoading = 0;
  isCropLoading = 0;
  tableData: any[] = [];
  colDefs: any[] = [];
  allColDefs: any[] = [];
  typeFields: any[] = [];
  kml_files: any[] = [];
  img_files: any[] = [];
  globalFilter: any;
  currentpage = 1;
  recordsPerPage = 10;
  buttonsType = ["file", "kml", "viewbutton", "signature", "approveBox"];
  toalRecord = 1;
  downloadTableData: any[] = [];
  otherActivityData: any[] = [];
  selectedOtherActivity: any[] = [];
  surveyIntimationNo: any = "";
  searchCaseId: any = "";
  showDraft = false;

  imgUrl:any = "";
  imgUrlSuffix:any  = "";

  clientData: any[] = [];
  yearData: any[] = [];
  seasonData: any[] = [];
  statesData: any[] = [];
  cropsData: any[] = [];
  districtData: any[] = [];
  blockData: any[] = [];
  agencyData: any[] = [];
  usersData: any[] = [];
  selectedFromDate: any = {
    startDate: moment().subtract(7, "days"),
    endDate: moment(),
  };
  maxDate: any = moment();
  minDate: any = "2021-01-01"; // moment().format('YYYY-MM-DD');
  selectedToDate: any;
  selectedClient: any[] = [];
  singleClient: any = "";
  selectedAgency: any[] = [];
  selectedAgencyRevisit: any[] = [];
  selectedUser: any[] = [];
  selectedCrop: any[] = [];
  selectedState: any[] = [];
  selectedDist: any[] = [];
  selectedBlock: any[] = [];
  selectedYear: any = "";
  selectedSeason: any = "";
  districts: any[] = [];
  tehsils: any[] = [];
  user: any;
  @Input() dataPurpose = "get_surveydata";
  @Input() searchPurpose = "get_surveydata";
  @Input() canApprove = false;
  @Input() canReject = false;
  @Input() canPending = false;

  fieldResponse: any;

  datalabel: any = {};

  localeValue = {
    format: "DD/MM/YYYY",
    displayFormat: "DD-MM-YYYY",
    separator: " - ",
    cancelLabel: "Cancel",
    applyLabel: "Okay",
  };
  showDateLabel = true;

  notifiedUnits: any;
  selectednotifiedUnits: any[] = [];
  clientStates: any[] = [];
  clientDistricts: any = [];
  clientTehsils: any[] = [];
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
  agencyMap: Map<any, any> = new Map();
  userPhoneMap: any;
  dataCrops: any[] = [];
  crop_column: any;
  showDetails = false;
  detailDataId: any;
  searchObser = new Subject<any>();
  userLoading = 0;
  agencyLoading = 0;
  showDataLabels = true;
  isFilterCollapsed = true;
  readonly downloadRecordPerPage = 1e4;
  isComponentActive = true;
  preApplied = false;		
  csrfTokenName: any;
  csrfToken: any;
  private abortController = new AbortController();
  projectContext: ProjectContext;
  assetsFolder: string; 

  constructor(
    private core: CoreService,
    private activeRoute: ActivatedRoute,
    private filter: FilterService,
    private modalService: NgbModal,
    private userService: UserDetailService,
    private featureToggle: FeatureToggleService,
    private sanitizer: DomSanitizer
  ) {
    this.projectContext = this.featureToggle.getContext() as ProjectContext;
    this.assetsFolder = environment.projectConfigs[this.projectContext].assetsFolder;
    if (this.projectContext === 'saksham') {
      this.selectedClient = ['2000'];
      this.singleClient = "2000";
    }
    this.searchObser
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => {
        if (this.surveyIntimationNo || this.searchCaseId) {
          this.getSearchSurveyData(this.surveyId);
        } else {
          this.getSurveyData(this.surveyId);
        }
      });
  }

  ngOnInit(): void {
    const config = this.featureToggle.getConfig();
    this.imgUrl = config.BASEKMLPREFIX;
    this.imgUrlSuffix  = config.BASEKMLSUFFIX;

    this.user = this.userService.getUserDetail();
    this.getLocationCropData();
    this.getFilterData();

    if (this.surveyId == 1) {
      this.crop_column = "field_509";
    } else if (this.surveyId == 2) {
      this.crop_column = "field_539";
    } else if (this.surveyId == 3) {
      this.crop_column = "field_593";
    }

    if (this.parentSurveyId == 1) {
      this.crop_column = "field_509";
    } else if (this.parentSurveyId == 2) {
      this.crop_column = "field_539";
    } else if (this.parentSurveyId == 3) {
      this.crop_column = "field_593";
    }

    this.getOtherActivityOptionData();
    if (this.projectContext === 'munichre') {		
      this.csrfTokenName = this.userService.getcsrfTokenName();
      this.csrfToken = this.userService.getcsrfToken();
    }
  }

  settings = {
    counter: false,
    plugins: [lgZoom],
  };
  onBeforeSlide = (detail: BeforeSlideDetail): void => {
    const { index, prevIndex } = detail;
  };

  getFilterData() {
    this.lookupLoader++;
    if (this.filter.isDistrictFetched) {
      if (this.user?.unit_id) {
        this.selectedClient = this.projectContext === 'munichre' ? [{ UNIT_ID: this.user.unit_id }] : ['2000'];
        this.onClientChange(this.selectedClient);
      }
      this.getRouterParam();
      this.districts = this.filter.districts;
      this.tehsils = this.filter.tehsils;
      this.setInputData();
      this.lookupLoader--;
    } else {
      this.filter.fetchedDistrictData.subscribe(() => {
        if (this.user?.unit_id) {
          this.selectedClient = this.projectContext === 'munichre' ? [{ UNIT_ID: this.user.unit_id }] : ['2000'];
          this.onClientChange(this.selectedClient);
        }
        this.getRouterParam();
        this.districts = this.filter.districts;
        this.tehsils = this.filter.tehsils;
        this.setInputData();
        this.lookupLoader--;
      });
    }

    if (this.filter.isvillageFetched) {
      this.setVilageData();
    } else {
        this.filter.fetchedVillageData.subscribe(() => {
          this.setVilageData();
          if (this.preApplied) {
            this.preApplied = false;
            this.loading--;
            this.applyFilter();
          }
        })
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

  getUserData() {
    if (
      this.selectedYear &&
      this.selectedSeason &&
      this.singleClient &&
      this.selectedAgency
    ) {
      this.userLoading++;
      this.usersData = [];
      const request = {
        year: this.selectedYear,
        season: this.selectedSeason,
        states: this.selectedState?.map((d: any) => d.state_id),
        districts: this.selectedDist?.map((d: any) => d.district_id),
        tehsils: this.selectedBlock?.map((d: any) => d.tehsil_id),
        roll: "",
        agencies: this.selectedAgency.includes("0") ? [] : this.selectedAgency,
        client_id: this.singleClient,
        purpose: "userslist",
      };

      if (!request.states?.length) {
        request.states = this.statesData.map((e) => e.state_id);
      }
      if (!request.districts?.length) {
        request.districts = this.filter.districts.map((e) => e.district_id);
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

  resetData() {
    this.surveyData = [];
    this.parentFields = [];
    this.datalabel = {};
    this.tableData = [];
  }

  onIntimationNumberChange(event: any) {
    this.searchObser.next(event);
  }
  onCaseIdChange(event: any) {
    this.searchObser.next(event);
  }

  getRouterParam() {
    if (this.user?.unit_id) {
      // this.getSurveyData(this.surveyId);
    }
  }

  sendFieldResponse() {
    return new Promise((res) => res(this.fieldResponse));
  }

  getSurveyData(surveyId: any) {
    this.currentpage = 1;
    if (!this.selectedClient?.length && !this.user?.unit_id) {
      this.core.toast("warn", "Please select a client");
      return;
    }
    if (!this.filter.villages?.length) {
      this.preApplied = true;
      this.loading++;
      return;
    }
    this.datalabel = {};
    const start_date = this.selectedFromDate?.startDate?.format("YYYY-MM-DD");
    const end_date = this.selectedFromDate?.endDate?.format("YYYY-MM-DD");
    const other_columns: any[] = [];
    if (this.surveyId == 6) {
      other_columns.push({
        field: "field_759",
        value: this.selectedOtherActivity.map((d) => d.value),
      });
    }
    if (this.surveyId == 2) {
      if (this.surveyIntimationNo) {
        other_columns.push({
          field: "field_779",
          value: [this.surveyIntimationNo],
        });
      }
    }
    if (this.searchCaseId) {
      other_columns.push({
        field: "case_ID",
        value: [this.searchCaseId],
      });
    }
    let isLocationAssigned = true;
    const requests = [
      { purpose: "get_surveyfields", survey_id: surveyId },
      {
        purpose: this.dataPurpose,
        survey_id: surveyId,
        pagination: {
          page_no: this.currentpage,
          records_per_page: this.recordsPerPage,
        },
        states: this.selectedState?.map((d: any) => d.state_id),
        districts: this.selectedDist?.map((d: any) => d.district_id),
        tehsils: this.selectedBlock.map((d) => d.tehsil_id),
        crop_id: this.selectedCrop?.map((d: any) => d.crop_id),
        user_id: this.selectedUser?.map((d: any) => d.user_id),
        start_date: start_date,
        end_date: end_date,
        client_id: this.user?.unit_id
          ? [this.user?.unit_id]
          : this.projectContext === 'munichre'
            ? this.selectedClient?.map((d: any) => d.UNIT_ID)
            : this.selectedClient,
        agency_id: this.selectedAgency.includes("0") ? [] : this.selectedAgency,
        years: [this.selectedYear],
        seasons: [this.selectedSeason],
        notified_units: this.selectednotifiedUnits.map((d) => d.notified_id),
        no_of_visit: undefined,
        crop_column: this.crop_column,
        other_columns,
        date_type: this.dateType,
      },
    ].map((d) => {
      if (+this.user.user_role > 2 && d.purpose == this.dataPurpose) {
        if (!d.states?.length) {
          d.states = this.statesData.map((e) => e.state_id);
        }
        if (!d.districts?.length) {
          d.districts = this.filter.districts.map((e) => e.district_id);
        }
        if (!d.tehsils?.length) {
          d.tehsils = this.filter.tehsils.map((e) => e.tehsil_id);
        }
        if (!d.states?.length) {
          isLocationAssigned = false;
        }
      }
      if (d.purpose != this.dataPurpose && this.fieldResponse) {
        return this.sendFieldResponse();
      }
      return this.core.data_post(d);
    });
    if (!isLocationAssigned) {
      this.core.toast("warn", "No data is avaliable for the selected filters");
      return;
    }
    this.resetData();
    this.loading++;
    Promise.all(requests)
      .then((responses: any) => {
        this.showDataLabels = true;
        if (responses?.[0]?.["status"] == 1) {
          this.fieldResponse = this.core.clone(responses[0]);
          if (this.parentSurveyId) {
            this.fields = responses?.[0]?.[`fields${this.surveyId}`] || [];
            this.fields.sort((a: any, b: any) => a.slno - b.slno);
            this.parentFields =
              responses?.[0]?.[`fields${this.parentSurveyId}`] || [];
            this.parentFields.sort((a: any, b: any) => a.slno - b.slno);
            this.fields.unshift(
              ...(responses?.[0]?.[`fields${this.parentSurveyId}`] || [])
            );
          } else {
            this.fields = responses?.[0]?.["fields"] || [];
            this.fields.sort((a: any, b: any) => a.slno - b.slno);
          }
          this.fields = this.fields.filter((d) => d.display == 1);
        }
        if (responses?.[1]?.["status"] == 1) {
          if (
            responses?.[2]?.["status"] == 1 &&
            responses?.[1]?.["surveydata"]?.length
          ) {
            const caseIds = this.core.uniqueList(
              responses?.[2]?.["surveydata"] || [],
              "case_ID"
            );
            responses[1]["surveydata"] = responses[1]["surveydata"].filter(
              (d: any) => caseIds.includes(d.case_ID)
            );
          }
          if (this.parentSurveyId) {
            this.surveyData = [];
            const parentSurveyData = responses?.[1]?.["surveydata"] || [];
            if (parentSurveyData.length) {
              for (let i = 0; i < parentSurveyData.length; i++) {
                const parent = parentSurveyData[i];
                const parentData: any = {};
                if (parent?.parent) {
                  for (let key in parent.parent) {
                    if (key?.includes("field_")) {
                      parentData[key] = parent.parent[key];
                    }
                  }
                  this.surveyData.push({ ...parent, ...parentData });
                }
              }
            }
          } else {
            this.surveyData = responses?.[1]?.["surveydata"] || [];
          }
          this.locationData = responses?.[1]?.["locationdata"];

          if (this.dataPurpose == "get_pending_surveydata") {
            this.toalRecord = +(responses?.[1]?.["total_pending"] || 1);
          } else if (this.dataPurpose == "get_approved_surveydata") {
            this.toalRecord = +(responses?.[1]?.["total_approved"] || 1);
          } else if (this.dataPurpose == "get_rejected_surveydata") {
            this.toalRecord = +(responses?.[1]?.["total_rejected"] || 1);
          } else if (this.dataPurpose == "get_consolidated_surveydata") {
            this.toalRecord = +(responses?.[1]?.["total_uploads"] || 1);
          } else if (this.dataPurpose == "get_draft_surveydata") {
            this.toalRecord = +(responses?.[1]?.["total_draft"] || 1);
            this.showDraft = true;
          }
          this.datalabel.totalApproved =
            responses?.[1]?.["total_approved"] || 0;
          this.datalabel.totalPending = responses?.[1]?.["total_pending"] || 0;
          this.datalabel.totalRejected =
            responses?.[1]?.["total_rejected"] || 0;
          this.datalabel.totalUploads = responses?.[1]?.["total_uploads"] || 0;
          this.datalabel.totalDraft = responses?.[1]?.["total_draft"] || 0;
        }

        if (this.fields?.length) {
          this.generateColDef();
          this.generateRowData();
        }
      })
      .catch()
      .finally(() => {
        this.loading--;
      });
  }

  getSearchSurveyData(surveyId: any) {
    this.currentpage = 1;
    if (!this.selectedClient?.length && !this.user?.unit_id) {
      this.core.toast("warn", "Please select a client");
      return;
    }
    this.datalabel = {};
    const start_date = this.selectedFromDate?.startDate?.format("YYYY-MM-DD");
    const end_date = this.selectedFromDate?.endDate?.format("YYYY-MM-DD");
    const other_columns: any[] = [];
    if (this.surveyId == 6) {
      other_columns.push({
        field: "field_759",
        value: this.selectedOtherActivity.map((d) => d.value),
      });
    }
    if (this.surveyId == 2) {
      if (this.surveyIntimationNo) {
        other_columns.push({
          field: "field_779",
          value: [this.surveyIntimationNo],
        });
      }
    }
    if (this.searchCaseId) {
      other_columns.push({
        field: "case_ID",
        value: [this.searchCaseId],
      });
    }
    const request =
      {
        purpose: this.searchPurpose,
        survey_id: surveyId,
        agency_id: this.selectedAgency.includes("0") ? [] : this.selectedAgency,
        other_columns,
        pagination: {
          page_no: this.currentpage,
          records_per_page: this.recordsPerPage,
        },
        user_id: this.selectedUser?.map((d: any) => d.user_id),
        start_date: start_date,
        end_date: end_date,
        client_id: this.user?.unit_id
          ? [this.user?.unit_id]
          : this.projectContext === 'munichre'
            ? this.selectedClient?.map((d: any) => d.UNIT_ID)
            : this.selectedClient,
        years: [this.selectedYear],
        seasons: [this.selectedSeason],
        crop_column: this.crop_column,
        date_type: this.dateType,
      };
    this.loading++;
    this.showDataLabels = false;
    this.core
      .dashboard_post(request)
      .then((response: any) => {
        if (response?.["status"] == 1) {
          if (this.parentSurveyId) {
            this.surveyData = [];
            const parentSurveyData = response?.["surveydata"] || [];
            if (parentSurveyData.length) {
              for (let i = 0; i < parentSurveyData.length; i++) {
                const parent = parentSurveyData[i];
                const parentData: any = {};
                if (parent?.parent) {
                  for (let key in parent.parent) {
                    if (key?.includes("field_")) {
                      parentData[key] = parent.parent[key];
                    }
                  }
                  this.surveyData.push({ ...parent, ...parentData });
                }
              }
            }
          } else {
            this.surveyData = response?.["surveydata"] || [];
          }
          this.locationData = response?.["locationdata"];

          if (this.dataPurpose == "get_pending_surveydata") {
            this.toalRecord = +(response?.["total_pending"] || 1);
          } else if (this.dataPurpose == "get_approved_surveydata") {
            this.toalRecord = +(response?.["total_approved"] || 1);
          } else if (this.dataPurpose == "get_rejected_surveydata") {
            this.toalRecord = +(response?.["total_rejected"] || 1);
          } else if (this.dataPurpose == "get_consolidated_surveydata") {
            this.toalRecord = +(response?.["total_uploads"] || 1);
          } else if (this.dataPurpose == "get_draft_surveydata") {
            this.toalRecord = +(response?.["total_draft"] || 1);
            this.showDraft = true;
          }
          this.datalabel.totalApproved = response?.["total_approved"] || 0;
          this.datalabel.totalPending = response?.["total_pending"] || 0;
          this.datalabel.totalRejected = response?.["total_rejected"] || 0;
          this.datalabel.totalUploads = response?.["total_uploads"] || 0;
          this.datalabel.totalDraft = response?.["total_draft"] || 0;

          if (this.fields?.length) {
            this.generateColDef();
            this.generateRowData();
          }
        }
      })
      .catch()
      .finally(() => {
        this.loading--;
      });
  }

  onPageTrigger(env: any) {
    const start_date = this.selectedFromDate?.startDate?.format("YYYY-MM-DD");
    const end_date = this.selectedFromDate?.endDate?.format("YYYY-MM-DD");
    this.currentpage = env.page_no;
    this.recordsPerPage = env.records_per_page;
    const other_columns: any[] = [];
    if (this.surveyId == 6) {
      other_columns.push({
        field: "field_759",
        value: this.selectedOtherActivity.map((d) => d.value),
      });
    }
    if (this.surveyId == 2) {
      if (this.surveyIntimationNo) {
        other_columns.push({
          field: "field_779",
          value: [this.surveyIntimationNo],
        });
      }
    }
    if (this.searchCaseId) {
      other_columns.push({
        field: "case_ID",
        value: [this.searchCaseId],
      });
    }
    const request: any = {
      purpose: this.dataPurpose,
      survey_id: this.surveyId,
      states: this.selectedState?.map((d: any) => d.state_id),
      districts: this.selectedDist?.map((d: any) => d.district_id),
      tehsils: this.selectedBlock.map((d) => d.tehsil_id),
      crop_id: this.selectedCrop?.map((d: any) => d.crop_id),
      user_id: this.selectedUser?.map((d: any) => d.user_id),
      start_date: start_date,
      end_date: end_date,
      client_id: this.user?.unit_id
        ? [this.user?.unit_id]
        : this.projectContext === 'munichre'
          ? this.selectedClient?.map((d: any) => d.UNIT_ID)
          : this.selectedClient,
      agency_id: this.selectedAgency.includes("0") ? [] : this.selectedAgency,
      years: [this.selectedYear],
      seasons: [this.selectedSeason],
      crop_column: this.crop_column,
      notified_units: this.selectednotifiedUnits.map((d) => d.notified_id),
      other_columns,
      pagination: {
        page_no: this.currentpage,
        records_per_page: this.recordsPerPage,
      },
      date_type: this.dateType,
    };

    if (+this.user.user_role > 2) {
      if (!request.states?.length) {
        request.states = this.statesData.map((e) => e.state_id);
      }
      if (!request.districts?.length) {
        request.districts = this.filter.districts.map((e) => e.district_id);
      }
      if (!request.tehsils?.length) {
        request.tehsils = this.filter.tehsils.map((e) => e.tehsil_id);
      }
    }

    this.loading++;
    this.core
      .data_post(request)
      .then((response: any) => {
        if (response?.status == 1) {
          if (this.parentSurveyId) {
            this.surveyData = [];
            const parentSurveyData = response?.["surveydata"] || [];
            if (parentSurveyData.length) {
              for (let i = 0; i < parentSurveyData.length; i++) {
                const parent = parentSurveyData[i];
                const parentData: any = {};
                if (parent?.parent) {
                  for (let key in parent.parent) {
                    if (key?.includes("field_")) {
                      parentData[key] = parent.parent[key];
                    }
                  }
                }
                this.surveyData.push({ ...parent, ...parentData });
              }
            }
          } else {
            this.surveyData = response?.["surveydata"] || [];
          }
          if (this.dataPurpose == "get_pending_surveydata") {
            this.toalRecord = +(response?.["total_pending"] || 1);
          } else if (this.dataPurpose == "get_approved_surveydata") {
            this.toalRecord = +(response?.["total_approved"] || 1);
          } else if (this.dataPurpose == "get_rejected_surveydata") {
            this.toalRecord = +(response?.["total_rejected"] || 1);
          }
          this.datalabel.totalApproved = response?.["total_approved"] || 0;
          this.datalabel.totalPending = response?.["total_pending"] || 0;
          this.datalabel.totalRejected = response?.["total_rejected"] || 0;
          this.datalabel.totalUploads = response?.["total_uploads"] || 0;
          this.datalabel.totalDraft = response?.["total_draft"] || 0;
          this.generateRowData();
        }
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        this.loading--;
      });
  }

  downloadPromise() {
    return new Promise( async (res,rej) => {

      this.abortController.signal.addEventListener("abort", () => {
        rej("Download Aborted.");
      });

    const start_date = this.selectedFromDate?.startDate?.format("YYYY-MM-DD");
    const end_date = this.selectedFromDate?.endDate?.format("YYYY-MM-DD");
    const other_columns: any[] = [];
    if (this.surveyId == 6) {
      other_columns.push({
        field: "field_759",
        value: this.selectedOtherActivity.map((d) => d.value),
      });
    }
    if (this.surveyId == 2) {
      if (this.surveyIntimationNo) {
        other_columns.push({
          field: "field_779",
          value: [this.surveyIntimationNo],
        });
      }
    }
    if (this.searchCaseId) {
      other_columns.push({
        field: "case_ID",
        value: [this.searchCaseId],
      });
    }

    const requestforTableData: any = [
      {
        purpose: this.excelDownloadPurpose || this.dataPurpose,
        survey_id: this.surveyId,
        states: this.selectedState?.map((d: any) => d.state_id),
        districts: this.selectedDist?.map((d: any) => d.district_id),
        tehsils: this.selectedBlock.map((d) => d.tehsil_id),
        crop_id: this.selectedCrop?.map((d: any) => d.crop_id),
        user_id: this.selectedUser?.map((d: any) => d.user_id),
        start_date: start_date,
        end_date: end_date,
        client_id: this.user?.unit_id
          ? [this.user?.unit_id]
          : this.projectContext === 'munichre'
            ? this.selectedClient?.map((d: any) => d.UNIT_ID)
            : this.selectedClient,
        agency_id: this.selectedAgency.includes("0") ? [] : this.selectedAgency,
        years: [this.selectedYear],
        seasons: [this.selectedSeason],
        crop_column: this.crop_column,
        other_columns,
        date_type: this.dateType,
        pagination: {
          "page_no": 1,
          "records_per_page": this.downloadRecordPerPage
        }
      },
    ].map((d) => {
      if (
        +this.user.user_role > 2 &&
        (d.purpose == this.dataPurpose ||
          d.purpose == this.excelDownloadPurpose)
      ) {
        if (!d.states?.length) {
          d.states = this.statesData.map((e) => e.state_id);
        }
        if (!d.districts?.length) {
          d.districts = this.filter.districts.map((e) => e.district_id);
        }
        if (!d.tehsils?.length) {
          d.tehsils = this.filter.tehsils.map((e) => e.tehsil_id);
        }
      }
      return d;
    }).find(d => true);


    this.downloadTableRecords(requestforTableData,[], res,rej)

   








    });
  }


  downloadTableRecords (request:any, resultData: any[]=[], res: any, rej: any) {
    if (!this.isComponentActive) {
      return;
    }
    this.core.post(request).then((response: any) => {
      if (response?.status == 1 && response.surveydata?.length) {
        resultData.push(...response.surveydata);
        request.pagination.page_no++;
        if (this.downloadRecordPerPage != response.surveydata?.length) {
          res(resultData);
          return;
        }
        this.downloadTableRecords(request,resultData,res, rej);
      } else {
        res(resultData);
      }
    }).catch(err => {
      rej(err);
    })
  }

  downloadTable() {   
    this.loading++;
    this.downloadPromise()
      .then((response: any) => {
        if (response?.length) {
          
          this.surveyData = response;
          try {
            this.downloadTableData = this.generateDownloadData();
          } catch (e) {
            console.error(e);
          }
          this.exportExcel(this.downloadTableData, this.colDefs);
        }
      })
      .catch((err) => console.log(err))
      .finally(() => {
        this.loading--;
      });
  }

  generateColDef() {
    const exportExcludesTypes = ["tab", "kml", "file", "signature"];
    this.colDefs = this.fields
      .map((field: any) => {
        return {
          field: `field_${field.field_id}`,
          header: field.display_name || field.label,
          type: field.type,
          id: field.field_id,
          subtype: field.subtype,
          excludeExport: exportExcludesTypes.includes(field.type),
        };
      })
      .filter((d) => d.type != "tab");
    if (this.canViewData) {
      this.colDefs.unshift({
        field: `action`,
        header: `Action`,
        type: `viewbutton`,
        excludeExport: true,
      });
    }

    this.colDefs.unshift({ field: `sno`, header: `S No.` });
    if (this.projectContext === 'munichre') {
      this.colDefs.push({ field: `client_name`, header: `IC Name` });
    }
    this.colDefs.push({
      field: `agency_id`,
      header: `Agency`,
      type: "lkp_agency",
    });
    if (this.projectContext === 'munichre') {
      this.colDefs.push({ field: `is_otp_verified`, header: `Farmer OTP verification` });
    }
    this.colDefs.push({ field: `first_name`, header: `First name` });
    this.colDefs.push({ field: `last_name`, header: `Last Name` });
    this.colDefs.push({ field: `user_id`, header: `User Id` });
    this.colDefs.push({ field: `user_phone`, header: `User Phone No` });
    this.colDefs.push({ field: `datetime`, header: `Date Time` });
    if (this.dataPurpose !== "get_pending_surveydata") {
      this.colDefs.push({
        field: `approved_reject_date`,
        header: `Approved / Rejected Date`,
      });
    }
    this.colDefs.push({ field: `case_ID`, header: `Case Id` });
    this.colDefs.push({ field: `id`, header: `AI ID` });
    if (this.showApproveColumn) {
      this.colDefs.push({
        field: `approved_reject`,
        header: `Validation Status`,
      });
    }
    if (this.parentSurveyId) {
      this.colDefs.push({ field: `no_of_visit`, header: `No of visit` });
    }

    for (let index = 0; index < this.colDefs.length; index++) {
      const col = this.colDefs[index];
      col.visibility = true;
    }
    this.allColDefs = this.core.clone(this.colDefs);
    this.typeFields = this.fields
      .filter(
        (d) =>
          d?.type.startsWith("lkp") || d?.type == "kml" || d?.type == "file"
      )
      .map((d) => {
        return {
          type: d.type,
          field: `field_${d.field_id}`,
          subtype: d.subtype,
        };
      });
    this.typeFields.push({ type: "lkp_agency", field: "agency_id" });
  }

  async getGrampanchayatMap() {
    const blockField = this.fields.find(
      (d: any) => d.type == "lkp_block"
    )?.field_id;
    const panchayatMap = new Map();
    const existingBlockIds = this.filter.grampanchayats.map(
      (d: any) => d.block_id
    );
    const blockIds = this.surveyData
      .filter(
        (d: any) =>
          d[`field_${blockField}`] &&
          !existingBlockIds.includes(d[`field_${blockField}`])
      )
      .map((d: any) => d[`field_${blockField}`]);
    if (blockIds?.length) {
      await this.filter.getGrampanchayatData(blockIds);
    }
    this.filter.grampanchayats.forEach((d) =>
      panchayatMap.set(d.grampanchayat_id, d.grampanchayat_name)
    );
    return panchayatMap;
  }

  async getVillageMap() {
    const panchayatField = this.fields.find(
      (d: any) => d.type == "lkp_grampanchayat"
    )?.field_id;
    const villageMap = new Map();
    const existingPanchayatIds = this.filter.villages.map(
      (d: any) => d.block_id
    );
    const panchayatIds = this.surveyData
      .filter(
        (d: any) =>
          d[`field_${panchayatField}`] &&
          !existingPanchayatIds.includes(d[`field_${panchayatField}`])
      )
      .map((d: any) => d[`field_${panchayatField}`]);
    if (panchayatIds?.length) {
      await this.filter.getVillageData(panchayatIds);
    }
    this.filter.villages.forEach((d) =>
      villageMap.set(d.village_id, d.village_name)
    );
    return villageMap;
  }

  async generateRowData() {
    this.loading++;
    this.tableData = this.core.clone(this.surveyData);
    if (this.parentSurveyId) {
      this.tableData = this.tableData.filter(
        (ele) =>
          !this.noOfVisit ||
          (this.noOfVisit <= ele.totalVisist &&
            ele.no_of_visit <= this.noOfVisit)
      );
    }

    this.loading--;
    this.tableData.forEach((data: any, i: any) => {
      data.sno = (this.currentpage - 1) * this.recordsPerPage + (i + 1);
      if (data.approved_reject == 0) {
        data.approved_reject = "Rejected";
      } else if (+data.approved_reject === 1) {
        data.approved_reject = "Approved";
      } else {
        data.approved_reject = "Pending";
      }
      data.user_phone = this.userPhoneMap[data.user_id] || data.user_id;
      if (this.projectContext === 'munichre') {
        data.is_otp_verified = data.is_otp_verified === '0' ? 'Not verified' : 'Verified'
      }
      this.typeFields.forEach((field: any) => {
        switch (field.type) {
          case "lkp_state":
            data[field.field] =
              this.stateMap.get(data[field.field]) || data[field.field];
            break;

          case "lkp_district":
            data[field.field] =
              this.districtMap.get(data[field.field]) || data[field.field];
            break;

          case "lkp_block":
            data[field.field] =
              this.blockMap.get(data[field.field]) || data[field.field];
            break;

          case "lkp_village":
            data[field.field] =
              this.villageMap.get(data[field.field]) || data[field.field];
            break;

          case "lkp_crop":
            data[field.field] =
              this.cropMap.get(data[field.field]) ||
              this.cropMap.get(0 + data[field.field]) ||
              data[field.field];
            break;

          case "lkp_tehsil":
            data[field.field] =
              this.tehsilMap.get(data[field.field]) || data[field.field];
            break;

          case "lkp_grampanchayat":
            data[field.field] =
              this.grampanchayatMap.get(data[field.field]) ||
              data[field.field];
            break;

          case "lkp_season":
            data[field.field] =
              this.seasonMap.get(data[field.field]) || data[field.field];
            break;

          case "lkp_year":
            data[field.field] =
              this.yearMap.get(data[field.field]) || data[field.field];
            break;

          case "lkp_notified_unit":
            data[field.field] =
              this.notifiedUnitMap.get(data[field.field]) ||
              data[field.field];
            break;

          case "lkp_agency":
            if (data[field.field] + "" === "0") {
              data[field.field] = "Self";
            } else {
              data[field.field] =
                this.agencyMap.get(data[field.field]) || data[field.field];
            }
            break;

          default:
            break;
        }
      });
    });

    setTimeout(() => {
      this.pagination?.updatePagination();
    }, 1000);
  }

  generateDownloadData() {
    if (this.parentSurveyId) {
      for (let index = 0; index < this.surveyData.length; index++) {
        const element = this.surveyData[index];
        if (element.parent && typeof element.parent == "string") {
          element.parent = JSON.parse(element.parent);
        }
        let no_of_visit = 0;
        for (let indx = this.surveyData.length - 1; indx >= 0; indx--) {
          const ele = this.surveyData[indx];
          if (ele.case_ID == element.case_ID) {
            no_of_visit++;
            if (!ele.no_of_visit) {
              ele.no_of_visit = no_of_visit;
            }
          }
        }
        element.totalVisist = no_of_visit;
      }
    }
    let tableData = this.core.clone(this.surveyData);

    if (this.parentSurveyId) {
      tableData = tableData.filter(
        (ele: any) =>
          !this.noOfVisit ||
          (this.noOfVisit <= ele.totalVisist &&
            ele.no_of_visit <= this.noOfVisit)
      );
    }
    const resultData = [];
    for (let i = 0; i < tableData.length; i++) {
      const data = tableData[i];
      data.sno = (this.currentpage - 1) * this.recordsPerPage + (i + 1);
      data.user_phone = this.userPhoneMap[data.user_id] || data.user_id;
      if (data.approved_reject == 0) {
        data.approved_reject = "Rejected";
      } else if (+data.approved_reject === 1) {
        data.approved_reject = "Approved";
      } else {
        data.approved_reject = "Pending";
      }
      if (this.projectContext === 'munichre') {
        data.is_otp_verified = data.is_otp_verified === '0' ? 'Not verified' : 'Verified'
      }

      this.typeFields.forEach((field: any) => {
        switch (field.type) {
          case "lkp_state":
            {
              data[field.field] =
                this.stateMap.get(data[field.field]) || data[field.field];
              if (this.parentSurveyId && data["parent"]) {
                data["parent"][field.field] =
                  this.stateMap.get(data["parent"][field.field]) ||
                  data["parent"][field.field];
              }
            }
            break;

          case "lkp_district":
            {
              data[field.field] =
                this.districtMap.get(data[field.field]) || data[field.field];
              if (this.parentSurveyId && data["parent"]) {
                data["parent"][field.field] =
                  this.districtMap.get(data["parent"][field.field]) ||
                  data["parent"][field.field];
              }
            }
            break;

          case "lkp_block":
            {
              data[field.field] =
                this.blockMap.get(data[field.field]) || data[field.field];
              if (this.parentSurveyId && data["parent"]) {
                data["parent"][field.field] =
                  this.blockMap.get(data["parent"][field.field]) ||
                  data["parent"][field.field];
              }
            }
            break;

          case "lkp_village":
            {
              data[field.field] =
                this.villageMap.get(data[field.field]) || data[field.field];
              if (this.parentSurveyId && data["parent"]) {
                data["parent"][field.field] =
                  this.villageMap.get(data["parent"][field.field]) ||
                  data["parent"][field.field];
              }
            }
            break;

          case "lkp_crop":
            {
              data[field.field] =
                this.cropMap.get(data[field.field]) ||
                this.cropMap.get(0 + data[field.field]) ||
                data[field.field];
            }
            if (this.parentSurveyId && data["parent"]) {
              data["parent"][field.field] =
                this.cropMap.get(data["parent"][field.field]) ||
                this.cropMap.get(0 + data["parent"][field.field]) ||
                data["parent"][field.field];
            }
            break;

          case "lkp_tehsil":
            {
              data[field.field] =
                this.tehsilMap.get(data[field.field]) || data[field.field];
              if (this.parentSurveyId && data["parent"]) {
                data["parent"][field.field] =
                  this.tehsilMap.get(data["parent"][field.field]) ||
                  data["parent"][field.field];
              }
            }
            break;

          case "lkp_grampanchayat":
            {
              data[field.field] =
                this.grampanchayatMap.get(data[field.field]) ||
                data[field.field];
              if (this.parentSurveyId && data["parent"]) {
                data["parent"][field.field] =
                  this.grampanchayatMap.get(data["parent"][field.field]) ||
                  data["parent"][field.field];
              }
            }
            break;

          case "lkp_season":
            {
              data[field.field] =
                this.seasonMap.get(data[field.field]) || data[field.field];
              if (this.parentSurveyId && data["parent"]) {
                data["parent"][field.field] =
                  this.seasonMap.get(data["parent"][field.field]) ||
                  data["parent"][field.field];
              }
            }
            break;
          case "lkp_year":
            {
              data[field.field] =
                this.yearMap.get(data[field.field]) || data[field.field];
              if (this.parentSurveyId && data["parent"]) {
                data["parent"][field.field] =
                  this.yearMap.get(data["parent"][field.field]) ||
                  data["parent"][field.field];
              }
            }
            break;
          case "lkp_notified_unit":
            {
              data[field.field] =
                this.notifiedUnitMap.get(data[field.field]) ||
                data[field.field];
              if (this.parentSurveyId && data["parent"]) {
                data["parent"][field.field] =
                  this.notifiedUnitMap.get(data["parent"][field.field]) ||
                  data["parent"][field.field];
              }
            }
            break;
          case "lkp_agency":
            {
              if (data[field.field] + "" === "0") {
                data[field.field] = "Self";
              } else {
                data[field.field] =
                  this.agencyMap.get(data[field.field]) || data[field.field];
              }

              if (this.parentSurveyId && data["parent"]) {
                if (data["parent"][field.field] + "" === "0") {
                  data["parent"][field.field] = "Self";
                } else {
                  data["parent"][field.field] =
                    this.agencyMap.get(data["parent"][field.field]) ||
                    data["parent"][field.field];
                }
              }
            }
            break;
            default: {
              break;
            }
        }
      });
      if (this.parentSurveyId) {
        data.state_id = this.stateMap.get(data.state_id);
        data.dist_id = this.districtMap.get(data.dist_id);
        data.tehsil_id = this.tehsilMap.get(data.tehsil_id);
        data.block_id = this.blockMap.get(data.block_id);
        data.gp_id = this.grampanchayatMap.get(data.gp_id);
        data.village_id = this.villageMap.get(data.village_id);
        data.crop_id =
          this.cropMap.get(data.crop_id) ||
          this.cropMap.get(0 + data.crop_id) ||
          data.crop_id;
        data.totalVisist = undefined;
      }

      resultData.push(data);
    }

    return resultData;
  }

  onTableButton(field: any, data: any) {
    if (field.type == "kml") {
    }

    if (field.type == "file" && field.subtype == "image") {
    }
  }

  async open(content: any, data: any, survey: any): Promise<void> {
    const dataId = survey.data_id;
    const isMunichRe = this.projectContext === 'munichre';
    this.img_files = [];
    this.kml_files = [];
    const requestBase = { purpose: 'get_files', survey_id: this.surveyId, data_id: dataId };
    try {
      if (data.type === 'kml') {
        const response: any = await this.core.post({
          ...requestBase,
          type: 'kml',
        });
        this.kml_files = response.files || [];
        return this.openModal(content, { keyboard: false });
      }
      if (data.type === 'file' && data.subtype === 'image' || data.type === 'signature') {
        const response: any = await this.core.post({
          ...requestBase,
          type: 'image', field_id: data.id,
        });
        let files = response.files || [];
        if (isMunichRe) {
          files = await this.attachSafeUrls(files);
        }
        this.img_files = files;
        const modalSize = data.type === 'signature' ? 'sm' : 'xl';
        return this.openModal(content, { size: modalSize, centered: true });
      }
    } catch (err) {
      this.core.toast('error', 'Failed to load data.');
    }
  }

  private openModal(content: any, options: any = {}): void {
    this.modalService
      .open(content, {
        ariaLabelledBy: 'modal-basic-title',
        ...options,
      });
  }

  private async attachSafeUrls(files: any[]): Promise<any[]> {
    const promises = files.map(async (file) => {
      try {
        const blob = await this.core.fetchAzureBlob(this.imgUrl + file.file_name);
        const objectUrl = URL.createObjectURL(blob);
        return {
          ...file,
          safeUrl: this.sanitizer.bypassSecurityTrustUrl(objectUrl),
        };
      } catch {
        return { ...file, safeUrl: null };
      }
    });
    return Promise.all(promises);
  }

  async download_kml(data: any) {
    const config = this.featureToggle.getConfig();
    try {
      if (data?.coordinates) {
        const coordinates = JSON.parse(data.coordinates).map((d: string) => d.split(',').reverse().join(','));
        const kmlText = `<?xml version="1.0" encoding="UTF-8"?><kml xmlns="http://www.opengis.net/kml/2.2"><Document><Placemark><ExtendedData></ExtendedData><Polygon><outerBoundaryIs><LinearRing><coordinates>${coordinates.join('\n')}</coordinates></LinearRing></outerBoundaryIs></Polygon></Placemark></Document></kml>`.trim();
        const blob = new Blob([kmlText], { type: 'application/vnd.google-earth.kml+xml' });
        const objectUrl = URL.createObjectURL(blob);
        const safeUrl: SafeUrl = this.sanitizer.bypassSecurityTrustUrl(objectUrl);
        const filename = `${moment().format('YYYYMMDDHHmmSS')}.kml`;
        this.downloadFile(safeUrl as string, filename);
        URL.revokeObjectURL(objectUrl);
      } else if (data?.file_name) {
        let url = config.BASEKMLPREFIX + data.file_name;
        if (this.projectContext === 'munichre') {
          const blob = await this.core.fetchAzureBlob(url);
          const objectUrl = URL.createObjectURL(blob);
          const safeUrl: SafeUrl = this.sanitizer.bypassSecurityTrustUrl(objectUrl);
          const filename = data.file_name.endsWith('.kml') ? data.file_name : `${data.file_name}.kml`;
          this.downloadFile(safeUrl as string, filename);
          URL.revokeObjectURL(objectUrl);
        } else {
          url += this.imgUrlSuffix;
          this.downloadFile(url, data.file_name);
        }
      } else {
        this.core.toast('warn', 'No KML data or file available');
      }
    } catch (err) {
      this.core.toast('error', 'Failed to download KML file');
    }
  }

  private downloadFile(url: string, filename: string) {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  exportExcel(data: any, fields: any) {
    const fieldsAlloc: any = {};
    const header: any[] = [];
    const keys: any[] = [];
    for (let i = 0; i < fields.length; i++) {
      const d = fields[i];
      if (!d.excludeExport) {
        header.push(d.header);
        keys.push(d.field);
      }
    }

    const excelData = data.map((item: any) => {
      if (this.parentSurveyId) {
        delete item?.["parent"]?.approved_reject;
        delete item?.["parent"]?.approved_reject_by;
        delete item?.["parent"]?.approved_reject_date;
        delete item?.["parent"]?.approved_reject_status;
        return keys.map((k) => item[k] || item?.["parent"]?.[k] || "");
      }
      return keys.map((k) => item[k]);
    });
    excelData.unshift(header);
    const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(excelData);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    const sheetName = this.surveyName.replace("/", "or");
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(
      wb,
      `${moment(new Date()).format("yyyyMMDD")}_${sheetName}.xlsx`
    );
  }

  setInputData() {
    this.clientData = this.filter.lookupData?.clients;
    this.yearData = this.filter.years;
    this.seasonData = this.filter.seasons;
    this.statesData = this.filter.lookupData?.states;
    this.usersData = this.filter.lookupData?.users;
    this.notifiedUnits = this.filter.notifiedUnits;
    this.usersData.forEach(d => (d.username = `${d.first_name} ${d.last_name}`));
    this.setDefaultLocation();
    const setMap = (items: any[], map: Map<any, any>, idKey: string, nameKey: string) => {
      items.forEach(item => map.set(item[idKey], item[nameKey]));
    };
    setMap(this.filter.states, this.stateMap, 'state_id', 'state_name');
    setMap(this.filter.districts, this.districtMap, 'district_id', 'district_name');
    setMap(this.filter.tehsils, this.tehsilMap, 'tehsil_id', 'tehsil_name');
    setMap(this.filter.blocks, this.blockMap, 'block_id', 'block_name');
    setMap(this.filter.crops, this.cropMap, 'crop_code', 'crop_name');
    setMap(this.filter.seasons, this.seasonMap, 'id', 'season_name');
    setMap(this.filter.years, this.yearMap, 'id', 'year');
    setMap(this.filter.notifiedUnits, this.notifiedUnitMap, 'notified_id', 'notified_unit_name');
    setMap(this.filter.agencies, this.agencyMap, 'agency_id', 'agency_name');
    this.userPhoneMap = {};
    this.usersData.forEach(user => (this.userPhoneMap[user.user_id] = user.phone));
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

  applyFilter() {
    this.showDateLabel = false;
    this.searchCaseId = "";
    this.surveyIntimationNo = "";

    this.getSurveyData(this.surveyId);
  }

  onSingleClinetChange(event: any) {
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
    if (this.projectContext === 'munichre') {
      this.selectedAgency = event
    }
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
      this.user
    );
    this.isStateLoading--;
    this.clientStates = location.states || [];
    this.clientDistricts = location.districts;
    this.clientTehsils = location.tehsils;

    this.statesData = this.clientStates;
  }

  async onClientChange(event: any) {
    this.agencyData = [];
    this.statesData = [];
    this.districtData = [];
    this.blockData = [];
    if (!["7"].includes(this.user?.user_role)) {
      this.selectedAgency = [];
      this.selectedAgencyRevisit = [];
    }
    this.selectedState = [];
    this.selectedDist = [];
    this.selectedBlock = [];
    this.clientStates = [];
    this.clientDistricts = [];
    this.getLocationCropData();
    this.getAgencyData();
    this.getUserData();
    this.resetData();
  }

  async onStateSelect(event: any) {
    this.districtData = [];
    this.blockData = [];
    this.selectedDist = [];
    this.selectedBlock = [];
    if (event?.length) {
      this.districtData = this.core.clone(event).map((state: any) => {
        state.items = this.core
          .clone(this.clientDistricts)
          .filter((dist: any) => dist.state_id == state.state_id);
        return state;
      });
    }

    this.getLocationCropData();
    this.getUserData();
    this.resetData();
  }

  onDistSelect(env: any) {
    this.blockData = [];
    this.selectedBlock = [];
    if (env?.length) {
      this.blockData = env.map((d: any) => {
        d.items = this.clientTehsils.filter(
          (e: any) => e.district_id == d.district_id
        );
        return d;
      });
    }
    this.getLocationCropData();
    this.getUserData();
    this.resetData();
  }

  onTehsilSelect(env: any) {
    this.getLocationCropData();
    this.getUserData();
    this.resetData();
  }

  onYearSelect(env: any) {
    this.agencyData = [];
    this.statesData = [];
    this.districtData = [];
    this.blockData = [];
    if (!["7"].includes(this.user?.user_role)) {
      this.selectedAgency = [];
      this.selectedAgencyRevisit = [];
    }
    this.selectedState = [];
    this.selectedDist = [];
    this.selectedBlock = [];
    this.clientStates = [];
    this.clientDistricts = [];
    this.getAgencyData();
    this.getLocationCropData();
    this.resetData();

    if (
      ["7"].includes(this.user?.user_role) &&
      this.selectedYear &&
      this.selectedSeason
    ) {
      this.onAgencyChange(this.selectedAgency);
    }
  }

  onSeasonSelect(env: any) {
    this.agencyData = [];
    this.statesData = [];
    this.districtData = [];
    this.blockData = [];
    if (!["7"].includes(this.user?.user_role)) {
      this.selectedAgency = [];
      this.selectedAgencyRevisit = [];
    }
    this.selectedState = [];
    this.selectedDist = [];
    this.selectedBlock = [];
    this.clientStates = [];
    this.clientDistricts = [];
    this.getAgencyData();
    this.getLocationCropData();
    this.resetData();

    if (
      ["7"].includes(this.user?.user_role) &&
      this.selectedYear &&
      this.selectedSeason
    ) {
      this.onAgencyChange(this.selectedAgency);
    }
  }

  get isDataApprove() {
    return this.tableData.some((d) => d.approve);
  }

  onApproveSet(approveFlag: any) {
    const data = this.tableData
      .filter((d) => d.approve)
      .map((d: any, i: any) => {
        return { id: d.id };
      });
    const request = { purpose: approveFlag, survey_id: this.surveyId, data };
    this.loading++;
    this.core
      .post(request)
      .then((response: any) => {
        if (response.status == 1) {
          this.core.toast("success", response.msg);

          this.onPageTrigger({
            page_no: this.currentpage,
            records_per_page: this.recordsPerPage,
          });
        } else {
          this.core.toast("error", response.msg);
        }
      })
      .catch((err) => {
        this.core.toast("error", "Unable to update approve status");
      })
      .finally(() => this.loading--);
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

  getOtherActivityOptionData() {
    if (this.surveyId == 6) {
      this.loading++;
      const request = {
        purpose: "get_surveyfield_multiple",
        survey_id: this.surveyId,
        field_id: "759",
      };
      this.core
        .post(request)
        .then((response: any) => {
          if (response?.status == 1) {
            this.otherActivityData = response.multiple_fields || [];
          }
        })
        .catch((err) => {
          console.log(err);
        })
        .finally(() => this.loading--);
    }
  }

  get chmRevisitFields() {
    return [
      {
        field: "sno",
        sortId: 1,
      },
      {
        field: "id",
        sortId: 2,
      },
      {
        field: "case_ID",
        sortId: 3,
      },
      {
        field: "state_id",
        sortId: 4,
      },
      {
        field: "dist_id",
        sortId: 5,
      },
      {
        field: "tehsil_id",
        sortId: 6,
      },
      {
        field: "block_id",
        sortId: 7,
      },
      {
        field: "gp_id",
        sortId: 8,
      },
      {
        field: "village_id",
        sortId: 9,
      },
      {
        field: "crop_id",
        sortId: 10,
      },
      {
        field: "field_709",
        sortId: 11,
      },
      {
        field: "field_710",
        sortId: 12,
      },
      {
        field: "field_711",
        sortId: 13,
      },
      {
        field: "field_712",
        sortId: 14,
      },
      {
        field: "field_713",
        sortId: 15,
      },
      {
        field: "field_765",
        sortId: 16,
      },
      {
        field: "approved_reject_by",
        sortId: 23,
      },
      {
        field: "approved_reject_date",
        sortId: 24,
      },
      {
        field: "datetime",
        sortId: 25,
      },
      {
        field: "status",
        sortId: 26,
      },
      {
        field: "client_name",
        sortId: 17,
      },
      {
        field: "first_name",
        sortId: 18,
      },
      {
        field: "last_name",
        sortId: 19,
      },
      {
        field: "no_of_visit",
        sortId: 22,
      },
      {
        field: "user_id",
        sortId: null,
      },
      {
        field: "data_id",
        sortId: null,
      },
      {
        field: "client_id",
        sortId: null,
      },
      {
        field: "field_708",
        sortId: null,
      },
      {
        field: "Media Upload",
        sortId: null,
      },
      {
        field: "Field images from all direction",
        sortId: null,
      },
      {
        field: "Crop Closeup image",
        sortId: null,
      },
      {
        field: "Crop image",
        sortId: null,
      },
      {
        field: "Crop flowers and seed bud pics",
        sortId: null,
      },
      {
        field: "KML file Upload",
        sortId: null,
      },
      {
        field: "approved_reject",
        sortId: null,
      },
      {
        field: "ip_address",
        sortId: null,
      },
      {
        field: "totalVisist",
        sortId: null,
      },
    ];
  }

  onColumnVisibilityChange() {
    const colDefs = [];
    for (let index = 0; index < this.allColDefs.length; index++) {
      const col = this.allColDefs[index];
      if (col.visibility) colDefs.push(col);
    }
    this.colDefs = colDefs;
  }

  onViewData(dataId: any) {
    this.detailDataId = dataId;
    this.showDetails = true;
  }

  onDetailEmit() {
    if (!this.selectedFromDate?.startDate && !this.selectedFromDate?.endDate) {
      this.selectedFromDate = null;
    }
    this.showDetails = false;
    if (this.searchCaseId || this.surveyIntimationNo) {
      this.getSearchSurveyData(this.surveyId);
    } else {
      this.onPageTrigger({
        page_no: this.currentpage,
        records_per_page: this.recordsPerPage,
      });
    }
  }

  setDefaultLocation() {
    if (this.user?.unit_id) {
      this.singleClient = this.user?.unit_id;
    }
    if (["7"].includes(this.user?.user_role)) {
      this.selectedAgency = [this.user.agency_id || "0"];
      this.selectedAgencyRevisit = JSON.parse(JSON.stringify(this.selectedAgency))
    }
    const location = this.userService.getLocation();
  }

  get deactiveField() {
    return (
      this.selectedYear && this.selectedSeason && this.selectedAgency?.length
    );
  }

  abortDownload() {

  }

  ngOnDestroy(): void {
  this.isComponentActive = false;
    this.abortController.abort();
  }
}
