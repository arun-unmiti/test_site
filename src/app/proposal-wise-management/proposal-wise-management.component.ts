import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CoreService } from '../utilities/core.service';
import { FilterService } from '../utilities/filter.service';
import { UtilityService } from '../utilities/proposal-form/utility.service';
import { ProposalWiseManagementService } from '../utilities/proposal-form/proposal-wise-management.service';
import { UserDetailService } from '../auth/user-detail.service';
import lgZoom from 'lightgallery/plugins/zoom';
import { BeforeSlideDetail } from 'lightgallery/lg-events';
import * as moment from 'moment';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { FILE_HEADERS, DATE_RANGES, LOCALE_VALUE, BUTTONS_TYPE } from '../utilities/proposal-form/constants';
import { FeatureToggleService } from "../shared/services/feature-toggle.service";
import { environment, ProjectContext } from "../../environments/environment";

interface SurveyData {
  id: string;
  approve?: boolean;
  [key: string]: any;
}

@Component({
  selector: 'app-proposal-wise-management',
  templateUrl: './proposal-wise-management.component.html',
  styleUrls: ['./proposal-wise-management.component.css'],
})
export class ProposalWiseManagementComponent implements OnInit {
  @Input() url_id: any;
  @Input() surveyId: any;
  @Input() parentSurveyId: any;
  @Input() surveyName: any;
  @Input() excelDownloadPurpose: any;
  @Input() showApproveColumn = false;
  @Input() showDateType = true;
  @Input() showCrop = true;
  @Input() showInactiveUser = false;
  @Input() surveyStatus = 1;
  @Input() canViewData = true;
  @Input() dataPurpose = 'get_surveydata';
  @Input() searchPurpose = 'get_surveydata';
  @Input() canApprove = false;
  @Input() canReject = false;
  @Input() canPending = false;

  @ViewChild('pagination') pagination: any;
  @ViewChild('fileEle') fileEle: any;
  @ViewChild('progressContent') progressContent: any;

  showDateLabel = true;
  selectednotifiedUnits: any[] = [];
  stateMap = new Map();
  districtMap = new Map();
  tehsilMap = new Map();
  blockMap = new Map();
  grampanchayatMap = new Map();
  villageMap = new Map();
  cropMap = new Map();
  seasonMap = new Map();
  yearMap = new Map();
  userPhoneMap: any = {};
  showDetails = false;
  detailDataId: any;
  dataCrops: any[] = [];
  crop_column: any;
  searchObser = new Subject<string>();
  noOfVisit: any = '';
  dateType = 'datetime';
  fields: any[] = [];
  parentFields: any[] = [];
  surveyData: SurveyData[] = [];
  locationData: any[] = [];
  loading = 0;
  lookupLoader = 0;
  isFilterCollapsed = true;
  currentpage = 1;
  downloadTableData: any[] = [];
  surveyIntimationNo = '';
  recordsPerPage = 10;
  allColDefs: any[] = [];
  searchCaseId = '';
  toalRecord = 1;
  kml_files: any[] = [];
  imgUrl:any = "";
  imgUrlSuffix:any = "";
  img_files: any[] = [];
  selectedOtherActivity: any[] = [];
  selectedState: any[] = [];
  selectedDist: any[] = [];
  selectedBlock: any[] = [];
  selectedYear: any[] = [];
  selectedSeason: any[] = [];
  districts: any[] = [];
  tehsils: any[] = [];
  selectedCrop: any[] = [];
  selectedUser: any[] = [];
  user: any;
  selectedClient = ['2000'];
  colDefs: any[] = [];
  showDataLabels = true;
  fieldResponse: any;
  datalabel: any = {};
  showDraft = false;
  typeFields: any[] = [];
  tableData: SurveyData[] = [];
  selectedFromDate: any = { startDate: moment().subtract(6, 'days'), endDate: moment() };
  clientData: any[] = [];
  yearData: any[] = [];
  seasonData: any[] = [];
  statesData: any[] = [];
  cropData: any[] = [];
  usersData: any[] = [];
  surveyFields: any = [];
  fileName = '';
  survey = '2';
  fileData: any[] = [];
  invalidFileData: any[] = [];
  fileHeaders = FILE_HEADERS;
  failedUploads: any[] = [];
  submitting = 0;
  totalRecords = 0;
  invalidCurrentpage = 1;
  invalidRecordsPerPage = 10;
  invalidTotalRecords = 0;
  page_text = '';
  invalid_page_text = '';
  totalUploadRecords = 8000;
  uploadedRecords = 0;
  chunkSize = 500;
  progress = 0;
  isUploading = false;
  filePreviews: { [key: string]: any[] } = {};
  files: { [key: string]: File[] } = {};
  readonly downloadRecordPerPage = 1e4;
  isComponentActive = true;
  cropMapping: any = {};
  yearMapping: any = {};
  seasonMapping: any = {};
  pairedCropMapping: any = {};
  pairedYearMapping: any = {};
  pairedSeasonMapping: any = {};
  stateMapping: any = {};
  stateCodeMapping: any = {};
  seasonCodeMapping: any = {};
  yearCodeMapping: any = {};
  private abortController = new AbortController();
  settings = { counter: false, plugins: [lgZoom] };
  ranges = DATE_RANGES;
  localeValue = LOCALE_VALUE;
  buttonsType = BUTTONS_TYPE;
  projectContext: ProjectContext;
  assetsFolder: string;

  constructor(
    private coreService: CoreService,
    private filterService: FilterService,
    private ngbModalService: NgbModal,
    private userDetailService: UserDetailService,
    private proposalService: ProposalWiseManagementService,
    private utilityService: UtilityService,
    private featureToggle: FeatureToggleService
  ) {
    this.projectContext = this.featureToggle.getContext() as ProjectContext;
    this.assetsFolder = environment.projectConfigs[this.projectContext].assetsFolder;
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

  get deactiveField() {
    return this.selectedYear.length && this.selectedSeason.length;
  }

  get isDataApprove() {
    return this.tableData.some((d) => d.approve);
  }

  ngOnInit(): void {
    const config = this.featureToggle.getConfig();
    this.imgUrl = config.BASEKMLPREFIX;
    this.imgUrlSuffix  = config.BASEKMLSUFFIX;
    this.user = this.userDetailService.getUserDetail();
    this.proposalService.getFilterData(this);
    this.proposalService.getSurveyFields(this);
  }

  applyFilter() {
    this.showDateLabel = false;
    this.searchCaseId = '';
    this.surveyIntimationNo = '';
    this.getSurveyData(this.surveyId);
  }

  resetData() {
    this.fields = [];
    this.surveyData = [];
    this.parentFields = [];
    this.tableData = [];
    this.colDefs = [];
    this.allColDefs = [];
  }

  onCropSelect(event: any) {
    this.resetData();
  }

  onYearSelect(event: any) {
    this.resetData();
  }

  onSeasonSelect(event: any) {
    this.resetData();
  }

  onBeforeSlide(detail: BeforeSlideDetail) {
    // No-op
  }

  onIntimationNumberChange(event: any) {
    this.searchObser.next(event);
  }

  onCaseIdChange(event: any) {
    this.searchObser.next(event);
  }

  async onApproveSet(approveFlag: string) {
    const data = this.tableData.filter((d) => d.approve).map((d) => ({ id: d.id }));
    try {
      const response: any = await this.coreService.post({ purpose: approveFlag, survey_id: this.surveyId, data });
      this.coreService.toast(response.status === 1 ? 'success' : 'error', response.msg);
    } catch {
      this.coreService.toast('error', 'Unable to update approve status');
    }
  }

  onColumnVisibilityChange() {
    this.colDefs = this.allColDefs.filter((col) => col.visibility);
  }

  async downloadTable() {
    this.loading++;
    try {
      const data: any = await this.proposalService.downloadTable(this);
      if (data?.length) {
        this.downloadTableData = data;
        this.proposalService.exportExcel(this, data, this.colDefs);
      }
    } catch {
      this.coreService.toast('error', 'Unable to Download');
    } finally {
      this.loading--;
    }
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

  async open(content: any, data: any, survey: any) {
    const request = {
      purpose: 'get_files',
      survey_id: this.surveyId,
      type: data.type === 'kml' ? 'kml' : 'image',
      data_id: survey.data_id,
      field_id: data.type !== 'kml' ? data.id : undefined,
    };
    const modalOptions = {
      ariaLabelledBy: 'modal-basic-title',
      keyboard: data.type === 'kml',
      size: data.type === 'file' ? 'xl' : data.type === 'signature' ? 'sm' : undefined,
      centered: data.type !== 'kml',
    };
    if (['kml', 'file', 'signature'].includes(data.type) && !(data.type === 'file' && data.subtype !== 'image')) {
      this.coreService.post(request).then((response: any) => {
        if (data.type === 'kml') {
          this.kml_files = response.files;
        } else {
          this.img_files = response.files;
        }
        this.ngbModalService.open(content, modalOptions).result.then(() => {}, () => {});
      });
    }
  }

  onViewData(dataId: any) {
    this.detailDataId = dataId;
    this.showDetails = true;
  }

  async onProductFileChange(event: any) {
    if (event.target.files?.length !== 1){
      return;
    }
    this.loading++;
    const file = event.target.files[0];
    const fileData: any = await this.proposalService.fileToJson(this, file);
    if (fileData?.jsonData?.length > 8000) {
      this.coreService.toast('warn', 'This file contains more than 8,000 records.');
      this.loading--;
      return;
    }
    if (fileData) {
      this.fileName = file.name;
      this.fileData = fileData.validData;
      this.totalRecords = this.fileData.length;
      this.invalidFileData = fileData.invalidData;
      this.invalidTotalRecords = this.invalidFileData.length;
      this.utilityService.updatePageReport(this);
      this.utilityService.invalidUpdatePageReport(this);
      this.files[this.fileName] = [file];
      this.filePreviews[this.fileName] = fileData.jsonData;
    } else {
      event.target.value = null;
    }
    this.loading--;
  }

  invalidOnPageTrigger(event: any) {
    this.invalidCurrentpage = event?.first / event?.rows + 1;
    this.invalidRecordsPerPage = event?.rows;
    this.utilityService.invalidUpdatePageReport(this);
  }

  async onSubmit() {
    this.failedUploads = [];
    const data = this.coreService.clone(this.fileData);
    this.ngbModalService.open(this.progressContent, { centered: true, keyboard: false, backdrop: 'static' });
    data.forEach((d: any) => delete d.error);
    this.isUploading = true;
    this.totalUploadRecords = this.fileData.length;
    const error_msg = await this.proposalService.uploadChunksSequentially(this, data);
    this.fileData = [];
    this.invalidFileData = [];
    if (this.fileEle?.nativeElement?.value){
      this.fileEle.nativeElement.value = null;
    }
    this.fileName = '';
    this.ngbModalService.dismissAll();
    this.isUploading = false;
    this.coreService.toast(
      this.failedUploads.length ? 'warn' : error_msg ? 'error' : 'success',
      this.failedUploads.length
        ? "The above record's Application IDs already exist in the system!"
        : error_msg || 'Upload completed successfully!'
    );
  }

  download_kml(data: any) {
    this.utilityService.downloadKml(data);
  }

  downloadInvalids() {
    this.proposalService.downloadInvalids(this);
  }

  async getSurveyData(surveyId: any) {
    await this.proposalService.getSurveyData(this, surveyId);
  }

  async getSearchSurveyData(surveyId: any) {
    await this.proposalService.getSearchSurveyData(this, surveyId);
  }

  async onPageTrigger(env: any) {
    await this.proposalService.onPageTrigger(this, env);
  }

  ngOnDestroy() {
    this.isComponentActive = false;
    this.abortController.abort();
  }
}