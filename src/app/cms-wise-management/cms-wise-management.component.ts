import { Component, Input, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { environment, ProjectContext } from "../../environments/environment";
import { CoreService } from "../utilities/core.service";
import { FilterService } from "../utilities/filter.service";
import lgZoom from "lightgallery/plugins/zoom";
import { BeforeSlideDetail } from "lightgallery/lg-events";
import { UserDetailService } from "../auth/user-detail.service";
import * as XLSX from "xlsx";
import * as moment from "moment";
import { Subject } from "rxjs";
import { debounceTime, distinctUntilChanged } from "rxjs/operators";
import { NgxImageCompressService } from "ngx-image-compress";
import { FeatureToggleService } from '../shared/services/feature-toggle.service';

export const MY_FORMATS = {
  parse: {
    dateInput: "LL",
  },
  display: {
    dateInput: "LL",
    monthYearLabel: "MMM YYYY",
    dateA11yLabel: "LL",
    monthYearA11yLabel: "MMMM YYYY",
  },
};
@Component({
  selector: 'app-cms-wise-management',
  templateUrl: './cms-wise-management.component.html',
  styleUrls: ['./cms-wise-management.component.css'],
})

export class CmsWiseManagementComponent implements OnInit, OnDestroy {
  @Input() url_id: any;
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

  @Input() dataPurpose = "get_surveydata";
  @Input() searchPurpose = "get_surveydata";
  @Input() canApprove = false;
  @Input() canReject = false;
  @Input() canPending = false;

  private readonly MAX_FILE_SIZE = 1024 * 1024 * 5;
  selectedAttendeeFile: File | null = null; // Store the attendee sheet file
  selectedWorkshopImages: string[] = []; // Store selected workshop images previews
  selectedFilesForWorkshop: File[] = []; // Store selected workshop image files
  showDateLabel = true;
  notifiedUnits: any;
  selectednotifiedUnits: any[] = [];
  clientStates: any[] = [];
  clientDistricts: any = [];
  clientTehsils: any[] = [];
  clientBlocks: any[] = [];
  clientGrampanchayats: any[] = [];
  clientVillages: any[] = [];
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

  isFilterCollapsed = true;
  currentpage = 1;
  downloadTableData: any[] = [];
  surveyIntimationNo: any = "";
  recordsPerPage = 10;
  allColDefs: any[] = [];
  searchCaseId: any = "";
  toalRecord = 1;
  kml_files: any[] = [];
  buttonsType = ["file", "kml", "viewbutton", "signature", "approveBox"];
  imgUrl:any = "";
  imgUrlSuffix:any  = "";
  img_files: any[] = [];
  selectedOtherActivity: any[] = [];
  selectedState: any[] = [];
  selectedDist: any[] = [];
  selectedTehsil: any[] = [];
  selectedBlock: any[] = [];
  selectedGrampanchayat: any[] = [];
  selectedVillage: any[] = [];
  selectedYear: any = "";
  selectedSeason: any = "";
  selectedFieldOption:any = {}
  districts: any[] = [];
  tehsils: any[] = [];
  selectedCrop: any[] = [];
  selectedUser: any[] = [];
  user: any;
  selectedClient: any[] = ['2000'];
  singleClient: any = "2000";
  colDefs: any[] = [];
  showDataLabels = true;
  fieldResponse: any;
  datalabel: any = {};
  showDraft = false;
  typeFields: any[] = [];
  tableData: any[] = [];

  ranges = {
    Today: [moment(), moment()],
    Yesterday: [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
    'Last 7 Days': [moment().subtract(6, 'days'), moment()],
    'Last 30 Days': [moment().subtract(29, 'days'), moment()],
    'This Month': [moment().startOf('month'), moment().endOf('month')],
    'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')],
    'Last 3 Month': [moment().subtract(3, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')],
  };

  selectedFromDate: any = { "startDate": moment().subtract(6, 'days'), "endDate": moment() };
  localeValue = { "format": "DD/MM/YYYY", "displayFormat": "DD-MM-YYYY", "separator": " - ", "cancelLabel": "Cancel", "applyLabel": "Okay" }

  clientData: any[] = [];
  yearData: any[] = [];
  seasonData: any[] = [];
  statesData: any[] = [];
  cropsData: any[] = [];
  districtData: any[] = [];
  teshilData: any[] = [];
  blockData: any[] = [];
  grampanchayatData: any[] = [];
  villageData: any[] = [];
  workshopTypeData: any[] = [];
  agencyData: any[] = [];
  usersData: any[] = [];
  preApplied = false;
  selectedImages: string[] = []; // Array to hold the image previews
  attendeeSheet: File | null = null; // To hold the selected attendee sheet file
  surveyFields:any = [];
  fileHeaders: any[];

  isCollapsed: boolean = true;
  collapseId: string = "collapseExample";

  fileName: any = "";
  survey: any = "2";
  fileData: any[] = [];
  invalidFileData: any[] = [];
  @ViewChild("fileEle") fileEle: any;
  stateMapping: any;
  pairedStateMapping: any;
  stateCodeMapping: any;
  districtMapping: any;
  pairedDistrictMapping: any
  teshilMapping: any;
  pairedTeshilMapping: any
  blockMapping: any;
  pairedBlockMapping: any
  riCircleData: any[] = [];
  riCircleMapping: any;
  pairedRiCircleMapping: any;
  grampanchayatMapping: any;
  pairedGrampanchayatMapping: any;
  villageMapping: any;
  pairedVillageMapping: any;
  iuLevelData: any[] = [];
  iuLevelMapping: any;
  pairedIuLevelMapping: any;
  cropData: any[] = [];
  cropMapping: any;
  pairedCropMapping: any;
  yearMapping: any;
  pairedYearMapping: any;
  yearCodeMapping: any;
  seasonMapping: any;
  pairedSeasonMapping: any;
  seasonCodeMapping: any;
  isDisabled: boolean = true;
  isLookupLoaded = false;
  failedUploads: any[] = [];
  submitting = 0;
  
  totalRecords: any = 0;
  invalidCurrentpage: any = 1;
  invalidRecordsPerPage: any = 10;
  invalidTotalRecords: any = 0;
  page_text:string = '';
  invalid_page_text:string = '';

  totalUploadRecords = 8000;  // Total number of records to upload
  uploadedRecords = 0;
  chunkSize = 500;       // Number of records per API request
  progress = 0;          // Progress percentage
  isUploading = false;   // Flag to disable button during upload

  @ViewChild("progressContent") progressContent: any;
  
  readonly downloadRecordPerPage = 1e4;
  isComponentActive = true;
  private abortController = new AbortController();
  projectContext: ProjectContext;
  assetsFolder: string;
  
  constructor(
    private core: CoreService,
    private activeRoute: ActivatedRoute,
    private filter: FilterService,
    private modalService: NgbModal,
    private userService: UserDetailService,
    private imageCompress: NgxImageCompressService,
    private featureToggle: FeatureToggleService
  ) {
    this.projectContext = this.featureToggle.getContext() as ProjectContext;
    this.assetsFolder = environment.projectConfigs[this.projectContext].assetsFolder;
    this.fileHeaders = [      
      {
        field: "applicationid",
        header: "Application ID",
        requried: true,
        type: "number",
      },      
      {
        field: "farmerid",
        header: "Farmer ID",
        requried: true,
        type: "number",
      },
      {
        field: "int_year",
        header: "Year",
        requried: true,
        type: "number",
        is_lkp: true,
      },
      {
        field: "season",
        header: "Season",
        requried: true,
        type: "number",
        is_lkp: true,
      },
      {
        field: "scheme",
        header: "Scheme",
        requried: true,
        type: "text",
      },
      {
        field: "farmer_name",
        header: "Farmer Name",
        requried: true,
      },
      {
        field: "relative_name",
        header: "Relative Name",
        requried: true,        
      },
      {
        field: "farmer_mobile",
        header: "Farmer Mobile",
        requried: true,
        type: "number",
      },
      {
        field: "state",
        header: "State Name",
        requried: true,
        type: "number",
        is_lkp: true,
      },
      {
        field: "district",
        header: "District Name",
        requried: true,
        dependent: true,
        type: "number",
        is_lkp: true,
      },
      {
        field: "tehsil",
        header: "Tehsil Name",
        requried: true,
        dependent: true,
        type: "number",
        is_lkp: true,
      },
      {
        field: "block",
        header: "RI Circle Name",
        type: "number",
        requried: true,
        dependent: true,
        is_lkp: true,
      },
      {
        field: "grampanchayat",
        header: "Grampanchayat Name",
        type: "number",
        requried: true,
        dependent: true,
        is_lkp: true,
      },
      {
        field: "village",
        header: "Village Name",
        type: "number",
        requried: true,
        dependent: true,
        is_lkp: true,
      },
      {
        field: "crop",
        header: "Crop Name",
        requried: true,
        type: "number",
        is_lkp: true,
      },
      {
        field: "iu_name",
        header: "IU Name",
        requried: true,
        type: "number",
        is_lkp: true,
      },
      {
        field: "survey_number",
        header: "Land Survey Number",
        requried: true,
        type: "text",
      },
      {
        field: "sub_div_number",
        header: "Land SubDivision Number",
        requried: true,
        type: "text",
      },
      {
        field: "area",
        header: "Area Insured",
        requried: true,
        type: "number",
      }
      
    ];
    
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
    this.getSurveyFields();

    // this.getOtherActivityOptionData();

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

  /**
   * Method to add lookup values
   */
  getLookupData() {
    this.lookupLoader++
    this.statesData = this.filter.states;
    this.stateMapping = {};
    this.pairedStateMapping = {};
    this.stateCodeMapping = {};
    this.statesData.forEach((state) => {
      this.stateMapping[state.state_name.toLowerCase().trim()] = state.state_id;
      this.stateMapping[state.state_id] = state.state_name;
      this.stateCodeMapping[state.code] = state.state_id;
      this.pairedStateMapping[state.state_name.toLowerCase().trim()] = state.state_id;
    });

    this.districtData = this.filter.districts;
    this.districtMapping = {};
    this.pairedDistrictMapping = {};
    this.districtData.forEach((district) => {
    this.districtMapping[district.district_name.toLowerCase()] = district.district_id;
    this.pairedDistrictMapping[`${district.state_id}=>${district.district_name.toLowerCase().trim()}`] = district.district_id;
      this.districtMapping[district.district_id] = district.district_name;
    });

    this.teshilData = this.filter.tehsils;
    this.teshilMapping = {};
    this.pairedTeshilMapping = {}
    this.teshilData.forEach((tehsil) => {
      this.teshilMapping[tehsil.tehsil_name.toLowerCase().trim()] = tehsil.tehsil_id;
      this.pairedTeshilMapping[`${tehsil.state_id}=>${tehsil.district_id}=>${tehsil.tehsil_name.toLowerCase().trim()}`] = tehsil.tehsil_id;
      this.teshilMapping[tehsil.tehsil_id] = tehsil.tehsil_name;
    });

    this.blockData = this.filter.blocks;
    this.blockMapping = {};
    this.pairedBlockMapping = {};
    this.blockData.forEach((block) => {
      this.blockMapping[block.block_name.toLowerCase().trim()] = block.block_id;
      this.pairedBlockMapping[`${block.state_id}=>${block.district_id}=>${block.tehsil_id}=>${block.block_name.toLowerCase().trim()}`] = block.block_id;
      this.blockMapping[block.block_id] = block.block_name;
    });

    this.grampanchayatData = this.filter.grampanchayats;
    this.grampanchayatMapping = {};
    this.pairedGrampanchayatMapping = {};
    this.grampanchayatData.forEach((grampanchayat) => {
      this.grampanchayatMapping[
        grampanchayat.grampanchayat_name.toLowerCase().trim()
      ] = grampanchayat.grampanchayat_id;
      this.pairedGrampanchayatMapping[
        `${grampanchayat.state_id}=>${grampanchayat.district_id}=>${grampanchayat.tehsil_id}=>${grampanchayat.block_id}=>${grampanchayat.grampanchayat_name.toLowerCase().trim()}`
      ] = grampanchayat.grampanchayat_id;
      this.grampanchayatMapping[grampanchayat.grampanchayat_id] =
        grampanchayat.grampanchayat_name;
    });

    this.villageData = this.filter.villages;
    this.villageMapping = {};
    this.pairedVillageMapping = {};
    this.villageData.forEach((village) => {
      this.villageMapping[village.village_name.toLowerCase().trim()] =
        village.village_id;
      this.pairedVillageMapping[`${village.state_id}=>${village.district_id}=>${village.tehsil_id}=>${village.block_id}=>${village.grampanchayat_id}=>${village.village_name.toLowerCase().trim()}`] =
        village.village_id;
      this.villageMapping[village.village_id] = village.village_name;
    });
    this.iuLevelData = this.filter.notifiedUnits;
    this.iuLevelMapping = {};
    this.pairedIuLevelMapping = {};
    this.iuLevelData.forEach((iuLevel) => {
      this.iuLevelMapping[iuLevel.notified_unit_name.toLowerCase().trim()] =
        iuLevel.notified_id;
      this.pairedIuLevelMapping[iuLevel.notified_unit_name.toLowerCase().trim()] =
        iuLevel.notified_id;
      this.iuLevelMapping[iuLevel.notified_id] = iuLevel.notified_unit_name;
    });    
    this.cropData = this.filter.crops;
    this.cropMapping = {};
    this.pairedCropMapping = {};
    this.cropData.forEach((crop) => {
      this.cropMapping[crop.crop_name.toLowerCase().trim()] = crop.crop_code;
      this.pairedCropMapping[crop.crop_name.toLowerCase().trim()] = crop.crop_code;
      this.cropMapping[crop.crop_code] = crop.crop_name;
    });

    this.yearData = this.filter.years;
    this.yearMapping = {};
    this.pairedYearMapping = {};
    this.yearCodeMapping = {};
    this.yearData.forEach((year) => {
      this.yearMapping[year.year_code] = year.id;
      this.yearCodeMapping[year.year_code] = year.id;
      this.pairedYearMapping[year.year_code] = year.id;
      this.yearMapping[year.id] = year.year_code;
    });

    this.seasonData = this.filter.seasons;
    this.seasonMapping = {};
    this.seasonCodeMapping = {};
    this.pairedSeasonMapping = {};
    this.seasonData.forEach((season) => {
      this.seasonMapping[season.season_name.toLowerCase().trim()] = season.id;
      this.seasonCodeMapping[season.season_code] = season.id;
      this.pairedSeasonMapping[season.season_name.toLowerCase().trim()] = season.id;
      this.seasonMapping[season.id] = season.season_name;
    });
    this.lookupLoader--
  }

  async getSurveyFields() {
    this.lookupLoader++; // To indicate that a lookup request is in progress
  
    const request = { purpose: "get_surveyfields", survey_id: this.surveyId };
    try {
      const response: any = await this.core.data_post(request);
      if (response?.status == 1) {
        this.surveyFields = response?.fields || [];
        this.surveyFields = this.surveyFields.sort((a:any, b:any) => a.slno - b.slno);
        if (!['1', '6', '11', '16'].includes(this.url_id)) {
          this.surveyFields = this.surveyFields.filter((field: any) => 
            ['lkp_year', 'lkp_season', 'lkp_state', 'lkp_district', 'lkp_tehsil', 'lkp_block', 'select'].includes(field.type)
          );
        }
        
        const fieldIds = this.surveyFields.map((item: any) => item.field_id);
        const options = await this.getFormFieldMultipleData(fieldIds);
        this.surveyFields.forEach((field: any) => {
          field['mutiple_options'] = options.filter((option: any) => option.field_id === field.field_id) || [];
          if (field.type === 'text' && field.parent_value && field.parent_value.toLowerCase() === 'others') {
            field['show_others'] = false;
          } else {
            field['show_others'] = true;
          }
          this.selectedFieldOption[field.field_id] = '';
        });

      }
    } catch (err) {
      console.error('Error fetching survey fields:', err);
    } finally {
      this.lookupLoader--;
    }
  }

  onSingleSelect(event: any, field: any) {
    const selectedOptionId = event.target.value;
    const selectedOption = field.mutiple_options.find((option: any) => option.value === selectedOptionId);
    this.surveyFields.forEach((item: any) => {
      if (item.parent_id === field.field_id) {
        item['show_others'] = (selectedOption.value.toLowerCase() === 'others');
      }
    });
  }
  
  async getFormFieldMultipleData(fieldIds: any) {
    const request = {
      purpose: "get_surveyfield_multiple",
      survey_id: this.surveyId,
      field_id: fieldIds,
    };
    try {
      const response: any = await this.core.data_post(request);
      if (response?.status == 1) {
        return response.multiple_fields;
      }
    } catch (err) {
      console.error('Error fetching multiple fields:', err);
      return []; // Return an empty array if there's an error
    }
    return []; // Return an empty array if status is not 1
  }

  getFilterData() {
    this.lookupLoader++;
    
    if (this.url_id === '21'){
      if (this.filter.isvillageFetched) {
        this.getLookupData();
      } else {
        this.lookupLoader++
        this.filter.fetchedVillageData.subscribe(() => {
          this.getLookupData();
          this.lookupLoader--
        });
      }
    }

    if (this.filter.isDistrictFetched) {
      // if (this.user?.unit_id) {
      //   this.selectedClient = ['2000'];
      //   this.onClientChange(this.selectedClient);
      // }
      this.districts = this.filter.districts;
      this.tehsils = this.filter.tehsils;
      this.setInputData();
      this.lookupLoader--;
    } else {
      this.filter.fetchedDistrictData.subscribe(() => {
        // if (this.user?.unit_id) {
        //   this.selectedClient = ['2000'];
        //   this.onClientChange(this.selectedClient);
        // }
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
            this.applyFilter();
          }
        })
    }
  }

  setInputData() {
    this.filter = this.filter
    this.clientData = this.filter.lookupData?.clients;
    this.yearData = this.filter.years;
    this.seasonData = this.filter.seasons;
    this.statesData = this.filter.lookupData?.states;
    this.clientDistricts = this.filter.lookupData?.districts
    this.clientTehsils = this.filter.lookupData?.tehsils
    this.clientBlocks = this.filter.lookupData?.blocks
    this.clientGrampanchayats = this.filter.lookupData?.grampanchayats
    this.clientVillages = this.filter.lookupData?.villages
    this.usersData = this.filter.lookupData?.users;

    this.notifiedUnits = this.filter.notifiedUnits;
    if (Array.isArray(this.usersData)) {
      this.usersData.forEach((d) => {
        d.username = d.first_name + " " + d.last_name;
      });
    }
    // this.setDefaultLocation();

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

    // lkp_notifieldUnit mapping
    for (let indx = 0; indx < this.filter.notifiedUnits.length; indx++) {
      const item = this.filter.notifiedUnits[indx];
      this.notifiedUnitMap.set(item.notified_id, item.notified_unit_name);
    }

    // agency id mapping
    for (let indx = 0; indx < this.filter.agencies.length; indx++) {
      const item = this.filter.agencies[indx];
      this.agencyMap.set(item.agency_id, item.agency_name);
    }

    this.userPhoneMap = {};
    for (let indx = 0; indx < this.usersData?.length; indx++) {
      const user = this.usersData[indx];
      this.userPhoneMap[user.user_id] = user.phone;
    }
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

  sendFieldResponse() {
    return new Promise((res) => res(this.fieldResponse));
  }

  async getRequestData(){

    let selectFilters: { 
      scheme?: any[]; 
      workshop_type?: any[]; 
      office_type?: any[]; 
      office_ownership?: any[]; 
    } = {};
    
    this.surveyFields.forEach((field: any) => {
      const inputElement = <HTMLInputElement>document.getElementById(field.field_id);
      const value = inputElement?.value;
    
      if (value) {
        // Check for "scheme"
        if (field.label.toLowerCase() === 'scheme') {
          if (!selectFilters.scheme) {
            selectFilters.scheme = [];  // Initialize the array if it's undefined
          }
          selectFilters.scheme.push(value);
        } 
        // Check for "workshop type" when surveyId is '8'
        else if (this.surveyId === '8' && field.label.toLowerCase().includes('workshop type')) {
          if (!selectFilters.workshop_type) {
            selectFilters.workshop_type = [];  // Initialize the array if it's undefined
          }
          selectFilters.workshop_type.push(value);
        } 
        // Check for "office type" when surveyId is '9'
        else if (this.surveyId === '9' && field.label.toLowerCase().includes('office type')) {
          if (!selectFilters.office_type) {
            selectFilters.office_type = [];  // Initialize the array if it's undefined
          }
          selectFilters.office_type.push(value);
        } 
        // Check for "office ownership" when surveyId is '9'
        else if (this.surveyId === '9' && field.label.toLowerCase().includes('office ownership')) {
          if (!selectFilters.office_ownership) {
            selectFilters.office_ownership = [];  // Initialize the array if it's undefined
          }
          selectFilters.office_ownership.push(value);
        }
      }
    });

    return selectFilters;
  }

  async getSurveyData(surveyId: any) {
    this.currentpage = 1;
    if (!this.selectedYear?.length && !this.selectedSeason?.length) {
      this.core.toast("warning", "Please select a year and season");
      return;
    }
    this.datalabel = {};
    const initialDate = this.selectedFromDate?.startDate?.format("YYYY-MM-DD");
    const finalDate = this.selectedFromDate?.endDate?.format("YYYY-MM-DD");
    const extraParams: any[] = [];

    if (+this.surveyId === 6) {
      extraParams.push({ field: "field_759", value: this.selectedOtherActivity.map((item) => item.value) });
    }
    if (+this.surveyId === 2 && this.surveyIntimationNo) {
      extraParams.push({ field: "field_779", value: [this.surveyIntimationNo] });
    }
    if (this.searchCaseId) {
      extraParams.push({ field: "case_ID", value: [this.searchCaseId] });
    }

    let locationValidity = true;
    const filterOptions = await this.getRequestData();
    const roleRestriction = this.isLimitedRole(this.user.user_role);
    const apiRequests = [
      { purpose: "get_surveyfields", survey_id: surveyId },
      {
        purpose: this.dataPurpose,
        survey_id: surveyId,
        pagination: { page_no: this.currentpage, records_per_page: this.recordsPerPage },
        states: this.selectedState?.map((d: any) => d.state_id),
        districts: roleRestriction ? [] : this.selectedDist?.map((d: any) => d.district_id),
        tehsils: roleRestriction ? [] : this.selectedBlock.map((d) => d.tehsil_id),
        crop_id: this.selectedCrop?.map((d: any) => d.crop_id),
        user_id: this.selectedUser?.map((d: any) => d.user_id),
        start_date: initialDate,
        end_date: finalDate,
        agency_id: [],
        years: [this.selectedYear],
        seasons: [this.selectedSeason],
        notified_units: this.selectednotifiedUnits.map((d) => d.notified_id),
        no_of_visit: undefined,
        crop_column: this.crop_column,
        other_columns: extraParams,
        date_type: this.dateType,
        ...filterOptions,
      },
    ].map((req: any) => {
      if (+this.user.user_role > 2 && req.purpose === this.dataPurpose) {
        if (!req.states?.length) {
          req.states = this.statesData.map((e) => e.state_id);
        }
        if (!req.districts?.length) {
          req.districts = roleRestriction ? [] : this.filter.districts.map((e) => e.district_id);
        }
        if (!req.tehsils?.length) {
          req.tehsils = roleRestriction ? [] : this.filter.tehsils.map((e) => e.tehsil_id);
        }
        if (!req.states?.length) {
          locationValidity = false;
        }
      }
      return req.purpose !== this.dataPurpose && this.fieldResponse ? this.sendFieldResponse() : this.core.data_post(req);
    });

    if (!locationValidity) {
      this.core.toast("warn", "No data is available for the selected filters");
      return;
    }

    this.resetData();
    this.loading++;
    Promise.all(apiRequests).then((results: any) => {
      this.showDataLabels = true;
      if (+results?.[0]?.["status"] === 1) {
        this.fieldResponse = this.core.clone(results[0]);
        if (this.parentSurveyId) {
          this.fields = results?.[0]?.[`fields${this.surveyId}`] || [];
          this.parentFields = results?.[0]?.[`fields${this.parentSurveyId}`] || [];
          this.fields.sort((a: any, b: any) => a.slno - b.slno);
          this.parentFields.sort((a: any, b: any) => a.slno - b.slno);
          this.fields = [...this.parentFields, ...this.fields];
        } else {
          this.fields = results?.[0]?.["fields"] || [];
          this.fields.sort((a: any, b: any) => a.slno - b.slno);
        }
        this.fields = this.fields.filter((d) => +d.display === 1);
      }
      if (+results?.[1]?.["status"] === 1) {
        if (+results?.[2]?.["status"] === 1 && results?.[1]?.["surveydata"]?.length) {
          const uniqueCases = this.core.uniqueList(results?.[2]?.["surveydata"] || [], "case_ID");
          results[1]["surveydata"] = results[1]["surveydata"].filter((d: any) => uniqueCases.includes(d.case_ID));
        }
        if (this.parentSurveyId) {
          this.surveyData = [];
          const parentRecords = results?.[1]?.["surveydata"] || [];
          if (parentRecords.length) {
            for (let index = 0; index < parentRecords.length; index++) {
              const record = parentRecords[index];
              const extraData: any = {};
              if (record?.parent) {
                for (let key in record.parent) {
                  if (key.includes("field_")) {
                    extraData[key] = record.parent[key];
                  }
                }
                this.surveyData.push({ ...record, ...extraData });
              }
            }
          }
        } else {
          this.surveyData = results?.[1]?.["surveydata"] || [];
        }
        this.locationData = results?.[1]?.["locationdata"];
        this.updateCounts(results?.[1]);
      }
      if (this.fields?.length) {
        this.generateColDef();
        this.generateRowData();
      }
    }).catch(() => {}).finally(() => {
      this.loading--;
    });
  }

  private updateCounts(response: any) {
    const countMap:any = {
      "get_pending_surveydata": "total_pending",
      "get_approved_surveydata": "total_approved",
      "get_rejected_surveydata": "total_rejected",
      "get_consolidated_surveydata": "total_uploads",
      "get_draft_surveydata": "total_draft",
      "get_view_farmer_data": "total_records"
    };
    this.toalRecord = +(response?.[countMap[this.dataPurpose]] || 1);
    if (this.dataPurpose === "get_draft_surveydata") {
      this.showDraft = true;
    }
    this.datalabel.totalApproved = response?.["total_approved"] || 0;
    this.datalabel.totalPending = response?.["total_pending"] || 0;
    this.datalabel.totalRejected = response?.["total_rejected"] || 0;
    this.datalabel.totalUploads = response?.["total_uploads"] || 0;
    this.datalabel.totalDraft = response?.["total_draft"] || 0;
    if (this.url_id === '22') {
      this.datalabel.totalUploads = response?.["total_records"] || 0;
    }
  }

  get deactiveField() {
    return (
      this.selectedYear && this.selectedSeason
    );
  }

  async onStateSelect(event: any) {
    this.districtData = [];
    this.selectedDist = [];
    this.teshilData = [];
    this.selectedTehsil = [];
    this.blockData = [];
    this.selectedBlock = [];
    if (Array.isArray(event) && event.length) {
      // For multi-select
      this.districtData = this.core.clone(event).map((state: any) => {
        state.items = this.core
          .clone(this.clientDistricts)
          .filter((dist: any) => dist.state_id == state.state_id);
        return state;
      });
    } else if (event) {
      // For single-select      
      const selectedState = this.clientDistricts.filter(
        (dist: any) => dist.state_id == event
      );
      if (selectedState) {
        this.districtData = selectedState;
      }
    }

    // this.getLocationCropData();
    // this.getUserData();
    this.resetData();
  }

  onDistSelect(event: any) {
    this.teshilData = [];
    this.selectedTehsil = [];
    this.blockData = [];
    this.selectedBlock = [];
    if (Array.isArray(event) && event.length) {
      // For multi-select
      this.teshilData = event.map((district: any) => {
        district.items = this.clientTehsils.filter(
          (tehsil: any) => tehsil.district_id == district.district_id
        );
        return district;
      });
    } else if (event) {
      // For single-select
      const selectedDistrict = this.clientTehsils.filter(
        (tehsil: any) => tehsil.district_id == event
      );
      if (selectedDistrict.length) {
        this.teshilData = selectedDistrict;
      }
    }
  
    // this.getLocationCropData();
    // this.getUserData();
    this.resetData();
  }

  onTehsilSelect(event: any) {
    this.blockData = [];
    this.selectedBlock = [];
    if (Array.isArray(event) && event.length) {
      // For multi-select
      this.blockData = event.map((tehsil: any) => {
        tehsil.items = this.clientBlocks.filter(
          (block: any) => block.tehsil_id == tehsil.tehsil_id
        );
        return tehsil;
      });
    } else if (event) {
      // For single-select
      const selectedTehsil = this.clientBlocks.filter(
        (block: any) => block.tehsil_id == event
      );
      if (selectedTehsil.length) {
        this.blockData = selectedTehsil;
      }
    }
    // this.getLocationCropData();
    // this.getUserData();
    this.resetData();
  }

  onBlockSelect(event: any) {
    this.grampanchayatData = [];
    this.selectedGrampanchayat = [];
    this.villageData = [];
    this.selectedVillage = [];
    if (Array.isArray(event) && event.length) {
      // For multi-select
      this.grampanchayatData = event.map((block: any) => {
        block.items = this.filter.grampanchayats.filter(
          (block: any) => block.block_id == block.block_id
        );
        return block;
      });
    } else if (event) {
      // For single-select
      const selectedBlock = this.filter.grampanchayats.filter(
        (block: any) => block.block_id == event
      );
      if (selectedBlock.length) {
        this.grampanchayatData = selectedBlock;
      }
    }
    // this.getLocationCropData();
    // this.getUserData();
    this.resetData();
  }

  onGrampanchayatSelect(event: any) {
    this.villageData = [];
    this.selectedVillage = [];
    if (Array.isArray(event) && event.length) {
      // For multi-select
      this.villageData = event.map((grama: any) => {
        grama.items = this.filter.villages.filter(
          (block: any) => block.grampanchayat_id == block.grampanchayat_id
        );
        return grama;
      });
    } else if (event) {
      // For single-select
      const selectedGrama = this.filter.villages.filter(
        (grama: any) => grama.grampanchayat_id == event
      );
      if (selectedGrama.length) {
        this.villageData = selectedGrama;
      }
    }
    // this.getLocationCropData();
    // this.getUserData();
    this.resetData();
  }
  
  onYearSelect(event: any) {
    // this.statesData = [];
    // this.districtData = [];
    // this.blockData = [];
    // this.selectedState = [];
    // this.selectedDist = [];
    // this.selectedBlock = [];
    // this.clientStates = [];
    // this.clientDistricts = [];
    // this.getLocationCropData();
    this.resetData();
  }

  onSeasonSelect(event: any) {
    // this.statesData = [];
    // this.districtData = [];
    // this.blockData = [];
    // this.selectedState = [];
    // this.selectedDist = [];
    // this.selectedBlock = [];
    // this.clientStates = [];
    // this.clientDistricts = [];
    // this.getLocationCropData();
    this.resetData();
  }

  onFieldSelect(event: any) {
    // this.statesData = [];
    // this.districtData = [];
    // this.blockData = [];
    // this.selectedState = [];
    // this.selectedDist = [];
    // this.selectedBlock = [];
    // this.clientStates = [];
    // this.clientDistricts = [];
    // this.getLocationCropData();
    this.resetData();
  }

  resetData() {
    this.fields = [];
    this.surveyData = [];
    this.parentFields = [];
    //this.datalabel = {};
    this.tableData = [];
    this.colDefs = [];
    this.allColDefs = [];
  }

  filePreviews: { [key: string]: any[] } = {};
  files: { [key: string]: File[] } = {};

  onFileChange(event: any, field: any) {
    const fieldName = field.name
    const files: File[] = Array.from(event.target.files);

    // Initialize previews and files array if not already done
    if (!this.filePreviews[fieldName]) this.filePreviews[fieldName] = [];
    if (!this.files[fieldName]) this.files[fieldName] = [];

    // Define max file size in bytes (e.g., 5MB)
    const maxFileSize = 5 * 1024 * 1024;

    // Limit the number of files to 3
    const currentFileCount = this.files[fieldName].length;

    if (currentFileCount >= field.maxlength) {
      this.core.toast('error', `You can only upload a maximum of ${field.maxlength} files for this field.`);
      
      // Reset the file input to avoid the user selecting more files
      const input = event.target as HTMLInputElement;
       // Only set the last valid file back if one exists
      if (files.length > 0) {
        const lastValidFile = files[files.length - 1];
        input.value = lastValidFile.name; // Set input value to the last valid file's name
      } else {
        input.value = ""; // Clear the file input field
      }

      return; // Prevent further file selection if limit is reached
    }

    // Filter out files that exceed the maximum size and are not of valid type
    files.forEach((file) => {
      // Check file size
      if (file.size > maxFileSize) {
        this.core.toast('error', `File "${file.name}" exceeds the maximum size of 5MB.`);
        return; // Skip files that are too large
      }

      // Check file type (MIME type or extension)
      const validFileTypes = ['application/pdf', 'image/jpeg', 'image/png'];
      if (!validFileTypes.includes(file.type)) {
        this.core.toast('error', `File "${file.name}" is not a valid file type. Only .pdf, .jpg, .jpeg, and .png are allowed.`);
        return; // Skip files with invalid types
      }

      // If there is space for more files (less than 3 already selected), add the file
      if (this.files[fieldName].length < 3) {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.filePreviews[fieldName].push({
            name: file.name,
            type: file.type,
            previewUrl: e.target.result,
          });
        };
        reader.readAsDataURL(file);

        // Add the file to the files array
        this.files[fieldName].push(file);
      }
    });
  }

  removeFile(fieldName: string, file: any) {
    const index = this.filePreviews[fieldName].findIndex((f) => f.name === file.name);
    if (index !== -1) {
      this.filePreviews[fieldName].splice(index, 1);
      this.files[fieldName].splice(index, 1);
    }
  }

  async submitForm(event: Event) {
    event.preventDefault();

    this.loading++;
    const formData = new FormData();

    if (this.surveyId !== null && this.surveyId !== undefined) {
      formData.append("survey_id", this.surveyId);
    }

    if (this.selectedYear !== null && this.selectedYear !== undefined) {
      formData.append("year", this.selectedYear);
    }

    if (this.selectedSeason !== null && this.selectedSeason !== undefined) {
      formData.append("season", this.selectedSeason);
    }
    
    const stateValue = Array.isArray(this.selectedState) ? this.selectedState[0] : this.selectedState;
    if (stateValue !== null && stateValue !== undefined) {
      formData.append("state_id", stateValue);
    }
    
    const distValue = Array.isArray(this.selectedDist) ? this.selectedDist[0] : this.selectedDist;
    if (distValue !== null && distValue !== undefined) {
      formData.append("dist_id", distValue);
    }
    
    const tehsilValue = Array.isArray(this.selectedTehsil) ? this.selectedTehsil[0] : this.selectedTehsil;
    if (tehsilValue !== null && tehsilValue !== undefined) {
      formData.append("tehsil_id", tehsilValue);
    }
    
    const blockValue = Array.isArray(this.selectedBlock) ? this.selectedBlock[0] : this.selectedBlock;
    if (blockValue !== null && blockValue !== undefined) {
      formData.append("block_id", blockValue);
    }
    
    const gramValue = Array.isArray(this.selectedGrampanchayat) ? this.selectedGrampanchayat[0] : this.selectedGrampanchayat;
    if (gramValue !== null && gramValue !== undefined) {
      formData.append("gp_id", gramValue);
    }
    
    const villageValue = Array.isArray(this.selectedVillage) ? this.selectedVillage[0] : this.selectedVillage;
    if (villageValue !== null && villageValue !== undefined) {
      formData.append("village_id", villageValue);
    }

    let is_email_valid = true;

    // Append dynamic fields
    this.surveyFields.forEach((field:any) => {
      if (field.type === "file" && this.files[field.name]) {
        this.files[field.name].forEach((file) => {
          formData.append(`field_${field.field_id}[]`, file); // Append as array
        });
      } else {
        const inputElement = <HTMLInputElement>document.getElementById(field.field_id);
        const value = inputElement?.value;
        if (value) {
          if (field.subtype === "email") {
            const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            if (!emailPattern.test(value)) {
              this.core.toast('error', `Please Enter a valid email`);
              is_email_valid = false;
              return;
            }
          }
          formData.append(`field_${field.field_id}`, value);
          if (field.label.toLowerCase() == 'scheme'){
            formData.append(`scheme`, value);
          } else {
            if ( this.surveyId === '8' && field.label.toLowerCase().includes('workshop type')){
              formData.append(`workshop_type`, value);   
            } else if ( this.surveyId === '9' && field.label.toLowerCase().includes('office type')){
              formData.append(`office_type`, value);   
            } else if ( this.surveyId === '9' && field.label.toLowerCase().includes('office ownership')){
              formData.append(`office_ownership`, value);   
            }
          }
        }
      }
    });

    // Flag to track form validation
    let isFormValid = true;

    this.surveyFields.forEach((field: any) => {
      if (field.required == 1) {
        let value = formData.get(`field_${field.field_id}`);
        
        // If the field is a file type, check if any files were selected
        if (field.type === 'file') {
          const files = formData.getAll(`field_${field.field_id}[]`); // Get all files for this field
          
          // If no files were selected, mark the form as invalid
          if (files.length === 0) {
            isFormValid = false;
            return
          }
        } else {
          // For other fields, check if the value is empty or null
          if (!value || value === "" || value === null) {
            if (field.show_others){
              isFormValid = false;
              return
            }
          }
        }
      }
    });
    
    // If the form is valid, proceed with submission, otherwise prevent it
    if (!isFormValid && is_email_valid) {
      this.loading--;
      this.core.toast('error', `Please fill all the mandatory fields`);
      return; // Prevent submission if validation failed
    }

    if (!is_email_valid){
      this.loading--;
      return;
    }
    
    formData.append("purpose", "upload_survey_data");

    try {
      const response:any = await this.core.post("upload_data", formData);
      this.loading--;
      if (response?.status === 1) {
        this.core.toast("success", response.msg);
        this.resetForm();
      } else {
        this.core.toast("error", response.msg);
      }
    } catch (err) {
      this.loading--;
      console.error("Error submitting form", err);
      this.core.toast("error", "Unable to submit data");
    }
  }

  resetForm() {
    this.selectedYear = "";
    this.selectedSeason = "";
    this.selectedState = [];
    this.selectedDist = [];
    this.selectedTehsil = [];
    this.selectedBlock = [];
    this.selectedGrampanchayat = [];
    this.selectedVillage = [];
    this.files = {};
    this.filePreviews = {};
  
    // Clear all file input fields
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fileInputs.forEach((input) => {
      (input as HTMLInputElement).value = ""; // Explicitly cast input to HTMLInputElement
    });
  
    // Reset survey fields
    this.surveyFields.forEach((field: any) => {
      const inputElement = document.getElementById(field.field_id) as HTMLInputElement;
      if (inputElement) {
        inputElement.value = "";
      }
    });
  }

  submitSearch(event: Event){
    event.preventDefault();
    
    const start_date = this.selectedFromDate?.startDate?.format("YYYY-MM-DD");
    const end_date = this.selectedFromDate?.endDate?.format("YYYY-MM-DD");
    const isLimited = this.isLimitedRole(this.user.user_role);
    let request = {
      purpose: this.dataPurpose,
      survey_id: this.surveyId,
      pagination: {
        page_no: this.currentpage,
        records_per_page: this.recordsPerPage,
      },
      states: this.selectedState?.map((d: any) => d.state_id),
      districts: isLimited ? [] : this.selectedDist?.map((d: any) => d.district_id),
      tehsils: isLimited ? [] : this.selectedBlock.map((d) => d.tehsil_id),
      crop_id: this.selectedCrop?.map((d: any) => d.crop_id),
      user_id: this.selectedUser?.map((d: any) => d.user_id),
      start_date: start_date,
      end_date: end_date,
      // client_id: this.user?.unit_id
      //   ? [this.user?.unit_id]
      //   : this.selectedClient,
      agency_id: [],
      years: [this.selectedYear],
      seasons: [this.selectedSeason],
      notified_units: this.selectednotifiedUnits.map((d) => d.notified_id),
      no_of_visit: undefined,
      crop_column: this.crop_column,
      date_type: this.dateType,
    }

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
      });
    const formData = new FormData();

    // Append dynamic fields
    this.surveyFields.forEach((field:any) => {
      if (field.type === "file" && this.files[field.name]) {
        this.files[field.name].forEach((file) => {
          formData.append(`field_${field.field_id}[]`, file); // Append as array
        });
      } else {
        const inputElement = <HTMLInputElement>document.getElementById(field.field_id);
        const value = inputElement?.value;
        if (value) {
          formData.append(`field_${field.field_id}`, value);
          if (field.label.toLowerCase() == 'scheme'){
            formData.append(`scheme`, value);
          } else {
            if ( this.surveyId === '8' && field.label.toLowerCase().includes('workshop type')){
              formData.append(`workshop_type`, value);   
            } else if ( this.surveyId === '9' && field.label.toLowerCase().includes('office type')){
              formData.append(`office_type`, value);   
            } else if ( this.surveyId === '9' && field.label.toLowerCase().includes('office ownership')){
              formData.append(`office_ownership`, value);   
            }
          }
        }
      }
    });
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
      let headerFields = this.url_id === '22'? JSON.parse(JSON.stringify(this.fileHeaders)) : JSON.parse(JSON.stringify(this.typeFields));
      headerFields.forEach((field: any) => {
        switch (field.type) {
          case "lkp_state":
            {
              data[field.field] =
                this.stateMap.get(data[field.field]) || data[field.field];
            }
            break;

          case "lkp_district":
            {
              data[field.field] =
                this.districtMap.get(data[field.field]) || data[field.field];
            }
            break;

          case "lkp_tehsil":
            {
              data[field.field] =
                this.tehsilMap.get(data[field.field]) || data[field.field];
            }
            break;

          case "lkp_block":
            {
              data[field.field] =
                this.blockMap.get(data[field.field]) || data[field.field];
            }
            break;

          case "lkp_grampanchayat":
            {
              data[field.field] =
                this.grampanchayatMap.get(data[field.field]) || data[field.field];
            }
            break;

          case "lkp_village":
            {
              data[field.field] =
                this.villageMap.get(data[field.field]) || data[field.field];
            }
            break;

          case "lkp_crop":
            {
              data[field.field] =
                this.cropMap.get(data[field.field]) ||
                this.cropMap.get(0 + data[field.field]) ||
                data[field.field];
            }
            break;

          case "lkp_season":
            {
              data[field.field] =
                this.seasonMap.get(data[field.field]) || data[field.field];
            }
            break;
          case "lkp_year":
            {
              data[field.field] =
                this.yearMap.get(data[field.field]) || data[field.field];
            }
            break;
          case "lkp_notified_unit":
            {
              data[field.field] =
                this.notifiedUnitMap.get(data[field.field]) ||
                data[field.field];
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
            }
            break;
            case "select":
              {
                if (this.url_id !== '22'){
                  let field_number = field.field.match(/\d+$/);
                  if (field_number) {
                    let selectField = this.surveyFields.find((item: any) => item.field_id === field_number[0]);
                    if (selectField) {
                      let option = selectField.mutiple_options.find((item: any) => item.value == data[field.field]);
                      if (option) {
                        data[field.field] = option.value;
                      } else {
                        data[field.field] = data[field.field];
                      }
                    } else {
                      console.error(`Field with field_id ${field.field} not found in surveyFields`);
                    }
                  } else {
                    console.error('No valid field number extracted from field:', field.field);
                  }
                }
              }
              break;

            default:
              {
                if (this.url_id === '22') {
                  if (field.field === 'state'){
                    data[field.field] =
                      this.stateMap.get(data.state) || data.state;
                  } else if (field.field === 'district'){
                    data[field.field] =
                      this.districtMap.get(data.district) || data.district;
                  } else if (field.field === 'tehsil'){
                    data[field.field] =
                      this.tehsilMap.get(data.tehsil) || data.tehsil;
                  } else if (field.field === 'block'){
                    data[field.field] =
                      this.blockMap.get(data.block) || data.block;
                  } else if (field.field === 'grampanchayat'){
                    data[field.field] =
                      this.grampanchayatMap.get(data.grampanchayat) || data.grampanchayat;
                  } else if (field.field === 'village'){
                    data[field.field] =
                      this.villageMap.get(data.village) || data.village;
                  } else if (field.field === 'iu_name'){
                    data[field.field] =
                      this.notifiedUnitMap.get(data.iu_name) || data.iu_name;
                  } else if (field.field === 'crop'){
                    data[field.field] =
                      this.cropMap.get(data.crop) ||
                      this.cropMap.get(0 + data.crop) ||
                      data.crop;
                  } else if (field.field === 'season'){
                    data[field.field] =
                      this.seasonMap.get(data.season) || data.season;
                  }  else if (field.field === 'int_year'){
                    data[field.field] =
                      this.yearMap.get(data.int_year) || data.int_year;
                  } 
                } 
                break;
              }

        }
      });
    });

    setTimeout(() => {
      this.pagination?.updatePagination();
    }, 1000);
  }

  generateColDef() {
    const exportExcludesTypes = ["tab", "kml", "file", "signature"];
    
    if (this.url_id !== '22'){
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
        .filter((d:any) => d.type != "tab");
      
      if (this.canViewData && this.url_id !== '22') {
        this.colDefs.unshift({
          field: `action`,
          header: `Action`,
          type: `viewbutton`,
          excludeExport: true,
        });
      }

      if (this.canApprove || this.canReject || this.canPending) {
        // this.colDefs.unshift({
        //   field: `approve`,
        //   header: `Approved`,
        //   type: `approveBox`,
        //   excludeExport: true,
        // });
      }
      // this.colDefs.push({ field: `client_name`, header: `IC Name` });
      this.colDefs.push({
        field: `agency_id`,
        header: `Agency`,
        type: "lkp_agency",
      });
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
      // this.colDefs.push({ field: `lat`, header: `Latitude` });
      // this.colDefs.push({ field: `lng`, header: `Longitude` });
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
      // this.colDefs.push({ field: `data_id`, header: `Action` });
    } else {
      let headerFields = JSON.parse(JSON.stringify(this.fileHeaders));
      this.colDefs = headerFields;
    }
    this.colDefs.unshift({ field: `sno`, header: `S No.` });

    for (let index = 0; index < this.colDefs.length; index++) {
      const col = this.colDefs[index];
      col.visibility = true;
    }
    this.allColDefs = this.core.clone(this.colDefs);
    this.typeFields = this.fields
      .filter(
        (d) =>
          d?.type.startsWith("lkp") || d?.type == "kml" || d?.type == "file" || d?.type == "select"
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
 
  settings = {
    counter: false,
    plugins: [lgZoom],
  };

  onBeforeSlide = (detail: BeforeSlideDetail): void => {
    const { index, prevIndex } = detail;
  };

  get isDataApprove() {
    return this.tableData.some((d) => d.approve);
  }
  onIntimationNumberChange(event: any) {
    this.searchObser.next(event);
  }
  onCaseIdChange(event: any) {
    this.searchObser.next(event);
  }
  onApproveSet(approveFlag: any) {
    const data = this.tableData
      .filter((d) => d.approve)
      .map((d: any, i: any) => {
        return { id: d.id };
      });
    const request = { purpose: approveFlag, survey_id: this.surveyId, data };
    //this.loading++;
    this.core
      .post(request)
      .then((response: any) => {
        if (response.status == 1) {
          this.core.toast("success", response.msg);

          // this.onPageTrigger({
          //   page_no: this.currentpage,
          //   records_per_page: this.recordsPerPage,
          // });
        } else {
          this.core.toast("error", response.msg);
        }
      })
      .catch((err) => {
        console.warn(err);
        this.core.toast("error", "Unable to update approve status");
      })
      .finally();
  }

  onColumnVisibilityChange() {
    const colDefs = [];
    for (let index = 0; index < this.allColDefs.length; index++) {
      const col = this.allColDefs[index];
      if (col.visibility) colDefs.push(col);
    }
    this.colDefs = colDefs;
  }

  downloadPromise() {
    return new Promise(async (resolve, reject) => {
      this.abortController.signal.addEventListener("abort", () => reject("Download Aborted."));
      const beginDate = this.selectedFromDate?.startDate?.format("YYYY-MM-DD");
      const closeDate = this.selectedFromDate?.endDate?.format("YYYY-MM-DD");
      const additionalCols: any[] = [];

      if (+this.surveyId === 6) {
        additionalCols.push({ field: "field_759", value: this.selectedOtherActivity.map((entry) => entry.value) });
      }
      if (+this.surveyId === 2 && this.surveyIntimationNo) {
        additionalCols.push({ field: "field_779", value: [this.surveyIntimationNo] });
      }
      if (this.searchCaseId) {
        additionalCols.push({ field: "case_ID", value: [this.searchCaseId] });
      }

      const accessLimit = this.isLimitedRole(this.user.user_role);
      const dataRequest: any = [
        {
          purpose: this.excelDownloadPurpose || this.dataPurpose,
          survey_id: this.surveyId,
          states: this.selectedState?.map((d: any) => d.state_id),
          districts: accessLimit ? [] : this.selectedDist?.map((d: any) => d.district_id),
          tehsils: accessLimit ? [] : this.selectedBlock.map((d) => d.tehsil_id),
          crop_id: this.selectedCrop?.map((d: any) => d.crop_id),
          user_id: this.selectedUser?.map((d: any) => d.user_id),
          start_date: beginDate,
          end_date: closeDate,
          agency_id: [],
          years: [this.selectedYear],
          seasons: [this.selectedSeason],
          crop_column: this.crop_column,
          other_columns: additionalCols,
          date_type: this.dateType,
          pagination: { page_no: 1, records_per_page: this.downloadRecordPerPage }
        },
      ].map((req) => {
        if (+this.user.user_role > 2 && (req.purpose === this.dataPurpose || req.purpose === this.excelDownloadPurpose)) {
          if (!req.states?.length) {
            req.states = this.statesData.map((e) => e.state_id);
          }
          if (!req.districts?.length) {
            req.districts = accessLimit ? [] : this.filter.districts.map((e) => e.district_id);
          }
          if (!req.tehsils?.length) {
            req.tehsils = accessLimit ? [] : this.filter.tehsils.map((e) => e.tehsil_id);
          }
        }
        return req;
      })[0];

      this.downloadTableRecords(dataRequest, [], resolve, reject);
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
      // const response =  this.core.post(request);
      // return {request,response};
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
          // }
        }
      })
      .catch((err) => console.log(err))
      .finally(() => {
        this.loading--;
      });
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

      let headerFields = this.url_id === '22'? JSON.parse(JSON.stringify(this.fileHeaders)) : JSON.parse(JSON.stringify(this.typeFields));
      headerFields.forEach((field: any) => {
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
            case "select":
              {
                if (this.url_id !== '22'){
                  let field_number = field.field.match(/\d+$/);
                  if (field_number) {
                    let selectField = this.surveyFields.find((item: any) => item.field_id === field_number[0]);
                    if (selectField) {
                      let option = selectField.mutiple_options.find((item: any) => item.value == data[field.field]);
                      if (option) {
                        data[field.field] = option.value;
                      } else {
                        data[field.field] = data[field.field];
                      }
                    } else {
                      console.error(`Field with field_id ${field.field} not found in surveyFields`);
                    }
                  } else {
                    console.error('No valid field number extracted from field:', field.field);
                  }
                }
              }
              break;
            default:
              {
                if (this.url_id === '22') {
                  if (field.field === 'state'){
                    data[field.field] =
                      this.stateMap.get(data.state) || data.state;
                  } else if (field.field === 'district'){
                    data[field.field] =
                      this.districtMap.get(data.district) || data.district;
                  } else if (field.field === 'tehsil'){
                    data[field.field] =
                      this.tehsilMap.get(data.tehsil) || data.tehsil;
                  } else if (field.field === 'block'){
                    data[field.field] =
                      this.blockMap.get(data.block) || data.block;
                  } else if (field.field === 'grampanchayat'){
                    data[field.field] =
                      this.grampanchayatMap.get(data.grampanchayat) || data.grampanchayat;
                  } else if (field.field === 'village'){
                    data[field.field] =
                      this.villageMap.get(data.village) || data.village;
                  } else if (field.field === 'iu_name'){
                    data[field.field] =
                      this.notifiedUnitMap.get(data.iu_name) || data.iu_name;
                  } else if (field.field === 'crop'){
                    data[field.field] =
                      this.cropMap.get(data.crop) ||
                      this.cropMap.get(0 + data.crop) ||
                      data.crop;
                  } else if (field.field === 'season'){
                    data[field.field] =
                      this.seasonMap.get(data.season) || data.season;
                  }  else if (field.field === 'int_year'){
                    data[field.field] =
                      this.yearMap.get(data.int_year) || data.int_year;
                  } 
                } 
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
  
  exportExcel(data: any, fields: any) {
    if (this.url_id === '22') {
      // Remove the object where 'field' is 'sno'
      fields = fields.filter((field:any) => field.field !== 'sno');
  
      // Add new object at the start of the array (unshift)
      fields.unshift(
          {
              field: "id",
              header: "AI ID",
              required: false,  // Corrected spelling of 'required'
              type: "number"
          }
      );
  
      // Add new objects at the end of the array (push)
      fields.push(
          {
              field: "added_by_name",
              header: "uploaded by",
              required: false,  // Corrected spelling of 'required'
              type: "text"
          },
          {
              field: "added_datetime",
              header: "upload/time",
              required: false,  // Corrected spelling of 'required'
              type: "text"
          }
      );
    }
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
    // const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(excelData);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    const sheetName = this.surveyName.replace("/", "or");
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(
      wb,
      `${moment(new Date()).format("yyyyMMDD")}_${sheetName}.xlsx`
    );
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

  async getSearchSurveyData(surveyId: any) {
    this.currentpage = 1;
    if (!this.selectedClient?.length && !this.user?.unit_id) {
      this.core.toast("warn", "Please select a client");
      return;
    }
    this.datalabel = {};
    const startDate = this.selectedFromDate?.startDate?.format("YYYY-MM-DD");
    const endDate = this.selectedFromDate?.endDate?.format("YYYY-MM-DD");
    const additionalFields: any[] = [];
    if (+this.surveyId === 6) {
      additionalFields.push({ field: "field_759", value: this.selectedOtherActivity.map((entry) => entry.value) });
    }
    if (+this.surveyId === 2 && this.surveyIntimationNo) {
      additionalFields.push({ field: "field_779", value: [this.surveyIntimationNo] });
    }
    if (this.searchCaseId) {
      additionalFields.push({ field: "case_ID", value: [this.searchCaseId] });
    }
    const filterData = await this.getRequestData();
    const apiRequest = {
      purpose: this.searchPurpose, survey_id: surveyId, agency_id: [],
      other_columns: additionalFields, pagination: { page_no: this.currentpage, records_per_page: this.recordsPerPage },
      user_id: this.selectedUser?.map((d: any) => d.user_id), start_date: startDate, end_date: endDate,
      years: [this.selectedYear], seasons: [this.selectedSeason], crop_column: this.crop_column, date_type: this.dateType,
      ...filterData,
    };
    this.loading++;
    this.showDataLabels = false;
    this.core.dashboard_post(apiRequest).then((response: any) => {
      this.handleSearchResponse(response);
    }).catch(() => {}).finally(() => {
      this.loading--;
    });
  }

  private handleSearchResponse(response: any) {
    if (+response?.["status"] === 1) {
      if (this.parentSurveyId) {
        this.surveyData = [];
        const parentRecords = response?.["surveydata"] || [];
        if (parentRecords.length) {
          for (let i = 0; i < parentRecords.length; i++) {
            const record = parentRecords[i];
            const extraInfo: any = {};
            if (record?.parent) {
              for (let key in record.parent) {
                if (key.includes("field_")) {
                  extraInfo[key] = record.parent[key];
                }
              }
              this.surveyData.push({ ...record, ...extraInfo });
            }
          }
        }
      } else {
        this.surveyData = response?.["surveydata"] || [];
      }
      this.locationData = response?.["locationdata"];
      this.updateMetrics(response);
      if (this.fields?.length) {
        this.generateColDef();
        this.generateRowData();
      }
    }
  }

  private updateMetrics(response: any) {
    if (this.dataPurpose === "get_pending_surveydata") {
      this.toalRecord = +(response?.["total_pending"] || 1);
    } else if (this.dataPurpose === "get_approved_surveydata") {
      this.toalRecord = +(response?.["total_approved"] || 1);
    } else if (this.dataPurpose === "get_rejected_surveydata") {
      this.toalRecord = +(response?.["total_rejected"] || 1);
    } else if (this.dataPurpose === "get_consolidated_surveydata") {
      this.toalRecord = +(response?.["total_uploads"] || 1);
    } else if (this.dataPurpose === "get_draft_surveydata") {
      this.toalRecord = +(response?.["total_draft"] || 1);
      this.showDraft = true;
    }
    this.datalabel.totalApproved = response?.["total_approved"] || 0;
    this.datalabel.totalPending = response?.["total_pending"] || 0;
    this.datalabel.totalRejected = response?.["total_rejected"] || 0;
    this.datalabel.totalUploads = response?.["total_uploads"] || 0;
    this.datalabel.totalDraft = response?.["total_draft"] || 0;
  }

  generateFile(url: any, filename: any) {
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link); // Required for FF
    link.click(); // This will download the data file named "my_data.csv".
    document.body.removeChild(link);
  }

  download_kml(data: any) {
    let url = this.imgUrl + data?.file_name + this.imgUrlSuffix;

    if (data?.coordinates) {
      const coordinates = JSON.parse(data.coordinates).map((d: any) =>
        d.split(",").reverse()
      );
      const kmlText = `<?xml version="1.0" encoding="UTF-8"?>
                      <kml xmlns="http://www.opengis.net/kml/2.2">
                            <Document>
                              <Placemark>
                                  <ExtendedData></ExtendedData>
                                  <Polygon>
                                    <outerBoundaryIs>
                                      <LinearRing>
                                        <coordinates>
                                          ${coordinates.join("\n")}
                                        </coordinates>
                                      </LinearRing>
                                    </outerBoundaryIs>
                                  </Polygon>
                                  </Placemark>
                                  </Document>
                        </kml>;`;
      const blob = new Blob([kmlText], { type: "text/plain" });

      // Create a download link
      const downloadLink = document.createElement("a");
      downloadLink.href = URL.createObjectURL(blob);
      downloadLink.download = `${moment().format("YYYYMMDDHHmmSS")}.kml`; // Set the filename

      // Trigger the download
      downloadLink.click();
    } else {
      this.generateFile(url, data?.file_name);
    }
  }

  isLimitedRole(role: number): boolean {
    return [3, 4].includes(+role);
  }

  onPageTrigger(env: any) {
    const fromDate = this.selectedFromDate?.startDate?.format("YYYY-MM-DD");
    const toDate = this.selectedFromDate?.endDate?.format("YYYY-MM-DD");
    this.currentpage = env.page_no;
    this.recordsPerPage = env.records_per_page;
    const supplementalCols: any[] = [];
    if (+this.surveyId === 6) {
      supplementalCols.push({ field: "field_759", value: this.selectedOtherActivity.map((element) => element.value) });
    }
    if (+this.surveyId === 2 && this.surveyIntimationNo) {
      supplementalCols.push({ field: "field_779", value: [this.surveyIntimationNo] });
    }
    if (this.searchCaseId) {
      supplementalCols.push({ field: "case_ID", value: [this.searchCaseId] });
    }
    const userLimit = this.isLimitedRole(this.user.user_role);
    const apiRequest: any = {
      purpose: this.dataPurpose, survey_id: this.surveyId, states: this.selectedState?.map((d: any) => d.state_id),
      districts: userLimit ? [] : this.selectedDist?.map((d: any) => d.district_id),
      tehsils: userLimit ? [] : this.selectedBlock.map((d) => d.tehsil_id), crop_id: this.selectedCrop?.map((d: any) => d.crop_id),
      user_id: this.selectedUser?.map((d: any) => d.user_id), start_date: fromDate, end_date: toDate, agency_id: null,
      years: [this.selectedYear], seasons: [this.selectedSeason], crop_column: this.crop_column,
      notified_units: this.selectednotifiedUnits.map((d) => d.notified_id), other_columns: supplementalCols,
      pagination: { page_no: this.currentpage, records_per_page: this.recordsPerPage }, date_type: this.dateType,
    };
    if (+this.user.user_role > 2) {
      if (!apiRequest.states?.length) {
        apiRequest.states = this.statesData.map((e) => e.state_id);
      }
      if (!apiRequest.districts?.length) {
        apiRequest.districts = userLimit ? [] : this.filter.districts.map((e) => e.district_id);
      }
      if (!apiRequest.tehsils?.length) {
        apiRequest.tehsils = userLimit ? [] : this.filter.tehsils.map((e) => e.tehsil_id);
      }
    }
    this.loading++;
    this.core.data_post(apiRequest).then((result: any) => {
      if (+result?.status === 1) {
        if (this.parentSurveyId) {
          this.surveyData = [];
          const parentRecords = result?.["surveydata"] || [];
          if (parentRecords.length) {
            for (let pos = 0; pos < parentRecords.length; pos++) {
              const parentEntry = parentRecords[pos];
              const parentDetails: any = {};
              if (parentEntry?.parent) {
                for (let key in parentEntry.parent) {
                  if (key.includes("field_")) {
                    parentDetails[key] = parentEntry.parent[key];
                  }
                }
                this.surveyData.push({ ...parentEntry, ...parentDetails });
              }
            }
          }
        } else {
          this.surveyData = result?.["surveydata"] || [];
        }
        if (this.dataPurpose === "get_pending_surveydata") {
          this.toalRecord = +(result?.["total_pending"] || 1);
        } else if (this.dataPurpose === "get_approved_surveydata") {
          this.toalRecord = +(result?.["total_approved"] || 1);
        } else if (this.dataPurpose === "get_rejected_surveydata") {
          this.toalRecord = +(result?.["total_rejected"] || 1);
        }
        this.updateTotals(result);
        this.generateRowData();
      }
    }).finally(() => {
      this.loading--;
    });
  }

  private updateTotals(response: any) {
    this.datalabel.totalApproved = response?.["total_approved"] || 0;
    this.datalabel.totalPending = response?.["total_pending"] || 0;
    this.datalabel.totalRejected = response?.["total_rejected"] || 0;
    this.datalabel.totalUploads = response?.["total_uploads"] || 0;
    this.datalabel.totalDraft = response?.["total_draft"] || 0;
  }

  open(content: any, data: any, survey: any) {

    let data_id = survey.data_id;

    if (data.type == "kml") {
      const request = {
        purpose: "get_files",
        survey_id: this.surveyId,
        type: "kml",
        data_id: data_id,
      };

      this.core.post(request).then((response: any) => {
        this.kml_files = response.files;
      });

      this.modalService
        .open(content, { ariaLabelledBy: "modal-basic-title", keyboard: false })
        .result.then(
          (result) => {
            console.log(result);
          },
          (reason) => {
            console.log(reason);
          }
        );
    }

    if (data.type == "file" && data.subtype == "image") {
      this.img_files = [];
      const request2 = {
        purpose: "get_files",
        survey_id: this.surveyId,
        type: "image",
        data_id: data_id,
        field_id: data.id,
      };

      this.core.post(request2).then((response: any) => {
        this.img_files = response.files;
        this.modalService
          .open(content, {
            ariaLabelledBy: "modal-basic-title",
            size: "xl",
            centered: true,
          })
          .result.then(
            (result) => {},
            (reason) => {}
          );
      });
    }

    if (data.type == "signature") {
      this.img_files = [];
      const request2 = {
        purpose: "get_files",
        survey_id: this.surveyId,
        type: "image",
        data_id: data_id,
        field_id: data.id,
      };

      this.core.post(request2).then((response: any) => {
        this.img_files = response.files;
        this.modalService
          .open(content, {
            ariaLabelledBy: "modal-basic-title",
            size: "sm",
            centered: true,
          })
          .result.then((result) => {});
      });
    }
  }

  onViewData(dataId: any) {
    this.detailDataId = dataId;
    this.showDetails = true;
  }

  async onFarmerFileChange(event: any) {
    if (event.target.files?.length == 1) {
      this.loading++
      const file = event.target.files[0];
      const fileData: any = await this.fileToJson(file);
      if(fileData.jsonData && fileData.jsonData.length> 8000){
        this.core.toast("warn", "This file contains more than 8,000 records.");
        this.loading--
        return;
      }
      if (fileData) {
        this.fileName = file.name;
        this.fileData = fileData.validData;
        this.totalRecords = this.fileData.length
        this.invalidFileData = fileData.invalidData;
        this.invalidTotalRecords = this.invalidFileData.length
        this.updatePageReport();
        this.invalidUpdatePageReport();        
        this.loading--
      } else {
        event.target.value = null;
      }
    }
  }
  
  updatePageReport() {
    const startRecord = (this.currentpage - 1) * this.recordsPerPage + 1;
    const endRecord = Math.min(this.currentpage * this.recordsPerPage, this.totalRecords);
    const totalPages = Math.ceil(this.totalRecords / this.recordsPerPage);

    this.page_text = `Page ${this.currentpage} of ${totalPages};\n Records ${startRecord} to ${endRecord} of ${this.totalRecords}`;
  }

  invalidOnPageTrigger(event: any) {
    this.invalidCurrentpage = event?.first / event?.rows + 1; // Calculate the current page
    this.invalidRecordsPerPage = event?.rows;
    this.invalidUpdatePageReport(); // Update report on page change
  }

  invalidUpdatePageReport() {
    const startRecord = (this.invalidCurrentpage - 1) * this.invalidRecordsPerPage + 1;
    const endRecord = Math.min(this.invalidCurrentpage * this.invalidRecordsPerPage, this.invalidTotalRecords);
    const totalPages = Math.ceil(this.invalidTotalRecords / this.invalidRecordsPerPage);

    this.invalid_page_text = `Page ${this.invalidCurrentpage} of ${totalPages};\n Records ${startRecord} to ${endRecord} of ${this.invalidTotalRecords}`;
  }


  /**
   * Method to validate csv data and convert data into json
   * @param file
   * @returns
   */
  async fileToJson(file: any) {
    return await new Promise((res, rej) => {
      const fileReader = new FileReader();
      fileReader.onload = (event: any) => {        

        //starts
          // Convert file result to Uint8Array
          const arrayBuffer = event.target.result;
          const uint8Array = new Uint8Array(arrayBuffer);
  
          // Convert Uint8Array to text
          const text = new TextDecoder().decode(uint8Array);
  
          // Parse CSV text
          const data = this.parseCsv(text);
          const fileType = file.type;
          const work_book = XLSX.utils.book_new();
          const worksheet = XLSX.utils.aoa_to_sheet(data);
          XLSX.utils.book_append_sheet(work_book, worksheet, 'Sheet1');

          // Convert the workbook to binary format
          const xlsxData = XLSX.write(work_book, { bookType: 'xlsx', type: 'array' });

          // Now you can process this XLSX data
          const work_book_from_csv = XLSX.read(xlsxData, { type: 'array', cellDates: true });
          const sheet_name = work_book_from_csv.SheetNames;
          const sheet_data = XLSX.utils.sheet_to_json(
            work_book_from_csv.Sheets[sheet_name[0]],
            { header: 1 }
          );
          
          if (sheet_data?.length) {
          const headers: any = sheet_data[0];
          const fileHeaders = this.fileHeaders.map((d) => d.header);
          const jsonData: any[] = [];
          const validData: any[] = [];
          const invalidData: any[] = [];
          const keys: any[] = [];
          const fields: any = {};
          this.fileHeaders.forEach((d) => {
            fields[d.field] = d;
            keys.push(d.field);
          });
          for (let i = 1; i < sheet_data.length; i++) {
            const data: any = sheet_data[i];
            const row: any = { errors: {}, isValid: true, remark: [] };
            for (let j = 0; j < data.length; j++) {
              let cell = data[j];

              if (cell instanceof Date) {
                cell = moment(cell).format("DD-MM-YYYY");
              }

              if (typeof cell == "string" && cell) {
                cell = cell.trim();
              }

              switch (keys[j]) {
                case "state": {
                  const val =
                    this.pairedStateMapping[
                      cell?.toLowerCase ? cell?.toLowerCase().trim() : cell
                    ];
                  if (val) {
                    row[keys[j]] = val;
                  } else {
                    row[keys[j]] = cell;
                  }
                  break;
                }
                case "district": {
                  const baseVal = cell?.toLowerCase ? cell?.toLowerCase().trim() : cell
                  const key = `${row.state}=>${baseVal}`;
                  const val =  this.pairedDistrictMapping[key];
                  if (val) {
                    row[keys[j]] = val;
                  } else {
                    row[keys[j]] = cell;
                  }
                  break;
                }
                case "tehsil": {
                  const baseVal = cell?.toLowerCase ? cell?.toLowerCase().trim() : cell
                  const key = `${row.state}=>${row.district}=>${baseVal}`;
                  const val =  this.pairedTeshilMapping[key];
                  if (val) {
                    row[keys[j]] = val;
                  } else {
                    row[keys[j]] = cell;
                  }
                  break;
                }
                case "block": {
                  const baseVal = cell?.toLowerCase ? cell?.toLowerCase() : cell;
                  const key = `${row.state}=>${row.district}=>${row.tehsil}=>${baseVal}`;
                  const val = this.pairedBlockMapping[key];
                  if (val) {
                    row[keys[j]] = val;
                  } else {
                    row[keys[j]] = cell;
                  }
                  break;
                }
                case "grampanchayat": {
                  const baseVal = cell?.toLowerCase ? cell?.toLowerCase() : cell;
                  const key = `${row.state}=>${row.district}=>${row.tehsil}=>${row.block}=>${baseVal}`;
                  const val = this.pairedGrampanchayatMapping[key];
                  if (val) {
                    row[keys[j]] = val;
                  } else {
                    row[keys[j]] = cell;
                  }
                  break;
                }
                case "village": {
                  const baseVal = cell?.toLowerCase ? cell?.toLowerCase() : cell;
                  const key = `${row.state}=>${row.district}=>${row.tehsil}=>${row.block}=>${row.grampanchayat}=>${baseVal}`;
                  const val = this.pairedVillageMapping[key];
                  if (val) {
                    row[keys[j]] = val;
                  } else {
                    row[keys[j]] = cell;
                  }
                  break;
                }
                case "iu_name": {
                  const processedCell = this.processCell(cell);
                  const val = this.pairedIuLevelMapping[processedCell];
                  row[keys[j]] = val || cell;
                  break;
                }
                case "crop": {
                  const val =
                    this.pairedCropMapping[
                      cell?.toLowerCase ? cell?.toLowerCase() : cell
                    ];
                  if (val) {
                    row[keys[j]] = val;
                  } else {
                    row[keys[j]] = cell;
                  }
                  break;
                }
                case "int_year": {
                  const val =
                    this.pairedYearMapping[
                      cell?.toLowerCase ? cell?.toLowerCase().trim() : cell
                    ];
                  if (val) {
                    row[keys[j]] = val;
                  } else {
                    row[keys[j]] = cell;
                  }
                  break;
                }
                case "season": {
                  const val =
                        this.seasonMapping[
                          cell?.toLowerCase ? cell?.toLowerCase().trim() : cell
                        ];
                  if (val) {
                    row[keys[j]] = val;
                  } else {
                    row[keys[j]] = cell;
                  }
                  break;
                }

                default: {
                  row[keys[j]] = cell;
                  break;
                }
                }
              }

              for (let j = 0; j < this.fileHeaders.length; j++) {
                const field = this.fileHeaders[j];
                if (!row[field.field] && field.default) {
                  row[field.field] = field.default;
                }
                if (!row[field.field] && field.requried) {
                  const requried =
                    typeof field.requried == "function"
                      ? field.requried(row)
                      : !field.requried;
                  if (!requried) {
                    if (!field.zeroAllowed && row[field.field] === 0) {
                      row.remark.push(`${field.header} is not allowed for zero value`);
                      row.errors[field.field] = true;
                      row.isValid = false;
                    } else if (!row[field.field] && row[field.field] !== 0) {
                      row.remark.push(`${field.header} is mandatory`);
                      row.errors[field.field] = true;
                      row.isValid = false;
                    }
                  }
                }
                if (
                  field.type == "number" &&
                  row[field.field] &&
                  isNaN(+row[field.field])
                ) {
                  row.errors[field.field] = true;
                  if (field.is_lkp) {
                    row.remark.push(
                      `${row[field.field]} value is incorrect for ${
                        field.header
                      }`
                    );
                  } else {
                    row.remark.push(
                      `${field.header} value must be in number format`
                    );
                  }
                  row.isValid = false;
                }
                if (field.type == "date" && row[field.field]) {
                  const datePattern = /^(18|19|20)\d\d-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/;
                  // const datePattern =
                  //   /^(0[1-9]|1[0-9]|2[0-9]|3[01])-(0[1-9]|1[012])-\d{4}$/;
                  if (!datePattern.test(row[field.field])) {
                    row.errors[field.field] = true;
                    row.remark.push(
                      `${field.header} value must be in "YYYY-MM-DD" date format`
                    );
                    row.isValid = false;
                  }
                }
                if (field.length && row[field.field] && row[field.field]?.length > field.length) {
                  row.errors[field.field] = true;
                    row.remark.push(
                      `${field.header} value can not exceed more than ${field.length} characters`
                    );
                    row.isValid = false;
                }
                if (field.type == 'alphanumaric' && row[field.field] && !/^[A-Z a-z 0-9]+$/.test(row[field.field])) {
                  row.errors[field.field] = true;
                    row.remark.push(
                      `${field.header} value is incorrect use only aplha numaric values`
                    );
                    row.isValid = false;
                }

              }

              jsonData.push(row);
              if (row.isValid) {
                validData.push(row);
              } else {
                invalidData.push(row);
              }
          }
          
          if (
            new Set(jsonData.map((d) => d.applicationid)).size !==
            jsonData.length
          ) {
            this.core.toast("warn", "Duplicate Application ID");
            res(null);
          }

          //Data verification logic
          else {
            res({ jsonData, validData, invalidData });
          }

        } else {
          this.core.toast("warn", "Empty file");
          res(null);
        }
      };
      fileReader.readAsArrayBuffer(file);
    });
  }

  processCell(cell: any): string {
    return cell?.toLowerCase ? cell.toLowerCase() : cell;
  }

  parseCsv(csvText: string): string[][] {
    return csvText
      .split('\n')
      .map(row => {
        const columns: string[] = [];
        let currentColumn = '';
        let insideQuotes = false;
  
        for (let i = 0; i < row.length; i++) {
          const char = row[i];
  
          if (char === '"') {
            insideQuotes = !insideQuotes;
          } else if (char === ',' && !insideQuotes) {
            columns.push(currentColumn.trim());
            currentColumn = '';
          } else {
            currentColumn += char;
          }
        }
  
        columns.push(currentColumn.trim());
  
        // If all columns are empty, return an empty array instead of null
        if (columns.every(col => col === '')) {
          return null;
        }
  
        return columns;
      })
      .filter(row => row !== null) as string[][]; // Filter out any null rows and cast to string[][]
  }
  
  isValidDate(dateString: string) {
    if (typeof dateString !== "string") {
      return false;
    }
    // Validate date format (YYYY-MM-DD)
    const regex =
      /^(?:(?:19|20)\d{2})-(?:(?:0[1-9]|1[0-2])-(?:0[1-9]|1\d|2[0-8])|(?:0[13-9]|1[0-2])-(?:29|30)|(?:0[13578]|1[02])-31)$/;
    return regex.test(dateString);
  }

  chunkArray(array: any[], size: number): any[][] {
    const result: any[][] = [];
    for (let i = 0; i < array.length; i += size) {
      result.push(array.slice(i, i + size));
    }
    return result;
  }

  
  async onSubmit() {
    this.failedUploads = [];
    const data = this.core.clone(this.fileData);
    this.modalService.open(this.progressContent, { centered: true, animation: true, keyboard: false, backdrop: 'static' });
    data.forEach((d: any) => {
      delete d.error;
    });
    this.isUploading = true;
    this.totalUploadRecords = this.fileData.length;
    const chunks = this.chunkArray(data, 500);
    const error_msg = await this.uploadChunksSequentially(chunks);
    this.fileData = [];
    this.invalidFileData = [];
    if (this.fileEle?.nativeElement?.value) {
      this.fileEle.nativeElement.value = null;
    }
    this.fileName = "";
    if (this.failedUploads.length) {
      this.core.toast("warn", "The above record's Application IDs already exist in the system!");
    } else if (error_msg) {
      this.core.toast("error", error_msg);
    } else {
      this.core.toast("success", "Upload completed successfully!");
    }
  }

  async uploadChunksSequentially(chunks: any[]): Promise<string> {
    let response_msg = '';
    let error_msg = false;
    let chunkNumber = 1;
    for (const chunk of chunks) {
      const request = { purpose: "upload_farmer_data", data: chunk };
      this.submitting++;
      try {
        const response: any = await this.core.post("upload_data", request);
        if (response?.status == 1) {
          if (response.failedUploads?.length) {
            const failedaApplication = response.failedUploads
              .map((application: any) => {
                return this.fileData.find((d) => d.intimation_id == application);
              })
              .filter((d: any) => d);
            this.failedUploads = this.failedUploads.concat(this.core.clone(failedaApplication));
          }
        } else {
          error_msg = true;
        }
        response_msg = response.msg;
      } catch (err) {
        error_msg = true;
        response_msg = "Unable to upload Insured Verification data";
      } finally {
        this.submitting--;
        this.uploadedRecords = chunkNumber * this.chunkSize;
        if (this.uploadedRecords > this.totalUploadRecords) {
          this.uploadedRecords = this.totalUploadRecords;
        }
        this.progress = parseFloat(((this.uploadedRecords / this.totalUploadRecords) * 100).toFixed(1));
        if (this.uploadedRecords >= this.totalUploadRecords) {
          this.isUploading = false;
          this.modalService.dismissAll();
        }
        chunkNumber++;
      }
    }
    return error_msg ? response_msg : '';
  }
  
  downloadInvalids() {
    const fileName = "invalid_farmer_data";
    const jsonData: any[] = this.invalidFileData.map((data) => {
      const row = [];
      for (let i = 0; i < this.fileHeaders.length; i++) {
        const field = this.fileHeaders[i];
        const cell = data[field.field];
        switch (field.field) {
          case "state": {
            row.push(this.stateMapping[cell] || cell);
            break;
          }
          case "district": {
            row.push(this.districtMapping[cell] || cell);
            break;
          }
          case "block": {
            row.push(this.blockMapping[cell] || cell);
            break;
          }
          case "ri_circle": {
            row.push(this.riCircleMapping[cell] || cell);
            break;
          }
          case "grampanchayat": {
            row.push(this.grampanchayatMapping[cell] || cell);
            break;
          }
          case "village": {
            row.push(this.villageMapping[cell] || cell);
            break;
          }
          case "iu_level": {
            row.push(this.iuLevelMapping[cell] || cell);
            break;
          }
          case "crop": {
            row.push(this.cropMapping[cell] || cell);
            break;
          }
          case "int_year": {
            row.push(this.yearMapping[cell] || cell);
            break;
          }
          case "season": {
            row.push(this.seasonMapping[cell] || cell);
            break;
          }
          default: {
            row.push(cell);
            break;
          }
          }
        }
        row.push(data.remark.join(".\n"));
        return row;
      });
      jsonData.unshift([...this.fileHeaders.map((d) => d.header), "Remark"]);
      const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(jsonData);
      const wb: XLSX.WorkBook = XLSX.utils.book_new();
      const sheetName = fileName;
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
      XLSX.writeFile(
        wb,
        `${moment(new Date()).format("yyyyMMDD")}_${fileName}.xlsx`
      );
    }

  ngOnDestroy(): void {
    this.isComponentActive = false;
    this.abortController.abort();
  }

}
