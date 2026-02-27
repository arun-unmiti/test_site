import { Component, OnInit, ViewChild } from "@angular/core";
import * as XLSX from "xlsx";
import { CoreService } from "../utilities/core.service";
import { FilterService } from "../utilities/filter.service";
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import * as moment from "moment";
import { FeatureToggleService } from "../shared/services/feature-toggle.service";
import { environment, ProjectContext } from "../../environments/environment";

@Component({
  selector: "app-cls-intimation-upload",
  templateUrl: "./cls-intimation-upload.component.html",
  styleUrls: ["./cls-intimation-upload.component.css"],
})
export class ClsIntimationUploadComponent implements OnInit {
  isCollapsed: boolean = true;
  collapseId: string = "collapseExample";
  

  fileName: any = "";
  survey: any = "2";
  fileData: any[] = [];
  invalidFileData: any[] = [];
  loading = 0;
  @ViewChild("fileEle") fileEle: any;
  fileHeaders: any[];
  stateData: any[] = [];
  stateMapping: any;
  pairedStateMapping: any;
  stateCodeMapping: any;
  districtData: any[] = [];
  districtMapping: any;
  pairedDistrictMapping: any
  blockData: any[] = [];
  blockMapping: any;
  pairedBlockMapping: any
  riCircleData: any[] = [];
  riCircleMapping: any;
  pairedRiCircleMapping: any;
  grampanchayatData: any[] = [];
  grampanchayatMapping: any;
  pairedGrampanchayatMapping: any;
  villageData: any[] = [];
  villageMapping: any;
  pairedVillageMapping: any;
  iuLevelData: any[] = [];
  iuLevelMapping: any;
  pairedIuLevelMapping: any;
  cropData: any[] = [];
  cropMapping: any;
  pairedCropMapping: any;
  yearData: any[] = [];
  yearMapping: any;
  pairedYearMapping: any;
  yearCodeMapping: any;
  seasonData: any[] = [];
  seasonMapping: any;
  pairedSeasonMapping: any;
  seasonCodeMapping: any;
  isDisabled: boolean = true;
  isLookupLoaded = false;
  failedIntimations: any[] = [];
  submitting = 0;
  
  currentpage: any = 1;
  recordsPerPage: any = 10;
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
  projectContext: ProjectContext;
  assetsFolder: string;  
  
  constructor(private core: CoreService, private filter: FilterService, private modalService: NgbModal, private featureToggle: FeatureToggleService) {
    this.projectContext = this.featureToggle.getContext() as ProjectContext;
    this.assetsFolder = environment.projectConfigs[this.projectContext].assetsFolder;

    if (this.projectContext === 'saksham') {
      this.fileHeaders = [
        {
          field: "int_year",
          header: "Int Year",
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
          field: "farmer_name",
          header: "Farmer Name",
        },
        {
          field: "farmer_mobile_number",
          header: "Farmer Mobile Number",
        },
        {
          field: "state",
          header: "State",
          requried: true,
          type: "number",
          is_lkp: true,
        },
        {
          field: "district",
          header: "District",
          requried: true,
          type: "number",
          is_lkp: true,
        },
        {
          field: "block",
          header: "Block",
          type: "number",
          requried: (data: any) => data.iu_level != 3 || data.block,
          dependent: true,
          is_lkp: true,
        },
        {
          field: "ri_circle",
          header: "RICircle",
          type: "number",
          requried: (data: any) => data.iu_level != 2 || data.ri_circle,
          dependent: true,
          is_lkp: true,
        },
        {
          field: "iu_level",
          header: "IU level",
          requried: true,
          type: "number",
          is_lkp: true,
        },
        {
          field: "crop",
          header: "Crop",
          requried: true,
          type: "number",
          is_lkp: true,
        },
        {
          field: "affected_area",
          header: "Affected Area",
          requried: true,
          type: "number",
          zeroAllowed: true
        },
        {
          field: "account_no",
          header: "Account No",
          requried: true,
          type: "number",
        },
        {
          field: "bank_name",
          header: "Bank Name",
          requried: true,
        },
        {
          field: "bank_branch",
          header: "Bank Branch",
          requried: true,
        },
        {
          field: "cause_of_loss",
          header: "Cause Of Loss",
          requried: true,
        },
        {
          field: "date_of_loss",
          header: "Date Of Loss",
          requried: true,
          type: "date",
        },
        {
          field: "date_of_intimation_farmer",
          header: "Docket ID/Ticket ID",
          requried: true,
          type: 'alphanumaric',
          length: 20
        },
        {
          field: "applicationid",
          header: "Applicationid",
          requried: true,
          type: "number",
        },
        {
          field: "intimation_id",
          header: "Intimation Id",
          requried: true,
        },
        {
          field: "supplier_name",
          header: "Supplier Name",
          requried: true,
        },
        {
          field: "surveyor_appointment_date",
          header: "Surveyor Appointment Date",
          requried: true,
          type: "date",
        },
        {
          field: "survey_done_date",
          header: "Survey Done Date",
          requried: true,
          type: "date",
        },
        {
          field: "survey_upload_date",
          header: "Survey Upload Date",
          requried: true,
          type: "date",
        },
        {
          field: "loss_percent",
          header: "Loss Percent",
          requried: true,
          type: "number",
          zeroAllowed: true
        },
        {
          field: "date_of_sowing",
          header: "Date Of Sowing",
          requried: true,
          type: "date",
        },
        {
          field: "scheme_name",
          header: "Scheme Name",
          requried: true,
        },
        {
          field: "date_of_intimation",
          header: "Date Of Intimation",
          requried: true,
          type: "date",
        },
        {
          field: "survey_type",
          header: "Survey Type",
          requried: true,
          default: "Sample",
        },
      ];
    } else {
      this.fileHeaders = [
        {
          field: "int_year",
          header: "Int Year",
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
          field: "farmer_name",
          header: "Farmer Name",
        },
        {
          field: "state",
          header: "State",
          requried: true,
          type: "number",
          is_lkp: true,
        },
        {
          field: "district",
          header: "District",
          requried: true,
          type: "number",
          is_lkp: true,
        },
        {
          field: "block",
          header: "Block",
          type: "number",
          requried: true,
          dependent: true,
          is_lkp: true,
        },
        {
          field: "ri_circle",
          header: "RICircle",
          type: "number",
          requried: true,
          dependent: true,
          is_lkp: true,
        },
        {
          field: "iu_level",
          header: "IU level",
          requried: true,
          type: "number",
          is_lkp: true,
        },
        {
          field: "crop",
          header: "Crop",
          requried: true,
          type: "number",
          is_lkp: true,
        },
        {
          field: "affected_area",
          header: "Affected Area",
          requried: true,
          type: "number",
        },
        {
          field: "account_no",
          header: "Account No",
          requried: true,
          type: "number",
        },
        {
          field: "bank_name",
          header: "Bank Name",
          requried: true,
        },
        {
          field: "bank_branch",
          header: "Bank Branch",
          requried: true,
        },
        {
          field: "cause_of_loss",
          header: "Cause Of Loss",
          requried: true,
        },
        {
          field: "date_of_loss",
          header: "Date Of Loss",
          requried: true,
          type: "date",
        },
        {
          field: "date_of_intimation_farmer",
          header: "Date Of Intimation Farmer",
          requried: true,
          type: "date",
        },
        {
          field: "applicationid",
          header: "Applicationid",
          requried: true,
          type: "number",
          max: 1e+21,
        },
        {
          field: "insured_area",
          header: "Insured Area",
          requried: true,
          type: "number",
        },
        {
          field: "intimation_id",
          header: "Intimation Id",
          requried: true,
        },
        {
          field: "supplier_name",
          header: "Supplier Name",
          requried: true,
        },
        {
          field: "surveyor_appointment_date",
          header: "Surveyor Appointment Date",
          requried: true,
          type: "date",
        },
        {
          field: "survey_done_date",
          header: "Survey Done Date",
          requried: true,
          type: "date",
        },
        {
          field: "survey_upload_date",
          header: "Survey Upload Date",
          requried: true,
          type: "date",
        },
        {
          field: "loss_percent",
          header: "Loss Percent",
          requried: true,
          type: "number",
        },
        {
          field: "date_of_sowing",
          header: "Date Of Sowing",
          requried: true,
          type: "date",
        },
        {
          field: "scheme_name",
          header: "Scheme Name",
          requried: true,
        },
        {
          field: "post_harvest_date",
          header: "Post Harvest Date",
          requried: true,
          type: "date",
        },
        {
          field: "date_of_intimation",
          header: "Date Of Intimation",
          requried: true,
          type: "date",
        },
        {
          field: "survey_type",
          header: "Survey Type",
          requried: true,
          default: "Sample",
        },
      ];
    }
  }

  ngOnInit(): void {
    this.getFilterData();
  }

  /**
   * Method to fetch filter data
   */
  getFilterData() {
    if (this.filter.isvillageFetched) {
      this.getLookupData();
    } else {
      this.filter.fetchedVillageData.subscribe(() => {
        this.getLookupData();
      });
    }
  }

  /**
   * Method to add lookup values
   */
  getLookupData() {
    this.isLookupLoaded = true;
    this.stateData = this.filter.states;
    this.stateMapping = {};
    this.pairedStateMapping = {};
    this.stateCodeMapping = {};
    this.stateData.forEach((state) => {
      const stateName = state.state_name.trim().toLowerCase();
      this.stateMapping[stateName] = state.state_id;
      this.stateMapping[state.state_id] = state.state_name;
      this.stateCodeMapping[state.code] = state.state_id;
      this.pairedStateMapping[stateName] = state.state_id;
    });
      this.districtData = this.filter.districts;
      this.districtMapping = {};
      this.pairedDistrictMapping = {};
      this.districtData.forEach((district) => {
      const districtName = district.district_name.trim().toLowerCase();
      this.districtMapping[districtName] = district.district_id;
      this.pairedDistrictMapping[`${district.state_id}=>${districtName}`] = district.district_id;
        this.districtMapping[district.district_id] = district.district_name;
      });
      this.blockData = this.filter.tehsils;
      this.blockMapping = {};
      this.pairedBlockMapping = {}
      this.blockData.forEach((tehsil) => {
        const tehsilName = tehsil.tehsil_name.trim().toLowerCase();
        this.blockMapping[tehsilName] = tehsil.tehsil_id;
        this.pairedBlockMapping[`${tehsil.state_id}=>${tehsil.district_id}=>${tehsilName}`] = tehsil.tehsil_id;
        this.blockMapping[tehsil.tehsil_id] = tehsil.tehsil_name;
      });
      this.riCircleData = this.filter.blocks;
      this.riCircleMapping = {};
      this.pairedRiCircleMapping = {};
      this.riCircleData.forEach((block) => {
        const blockName = block.block_name.trim().toLowerCase();
        this.riCircleMapping[blockName] = block.block_id;
        this.pairedRiCircleMapping[`${block.state_id}=>${block.district_id}=>${block.tehsil_id}=>${blockName}`] = block.block_id;
        this.riCircleMapping[block.block_id] = block.block_name;
      });
      this.grampanchayatData = this.filter.grampanchayats;
      this.grampanchayatMapping = {};
      this.pairedGrampanchayatMapping = {};
      this.grampanchayatData.forEach((grampanchayat) => {
        const gpName = grampanchayat.grampanchayat_name.trim().toLowerCase();
        this.grampanchayatMapping[gpName] = grampanchayat.grampanchayat_id;
        this.pairedGrampanchayatMapping[`${grampanchayat.state_id}=>${grampanchayat.district_id}=>${grampanchayat.tehsil_id}=>${grampanchayat.block_id}=>${gpName}`] = grampanchayat.grampanchayat_id;
        this.grampanchayatMapping[grampanchayat.grampanchayat_id] = grampanchayat.grampanchayat_name;
      });
      this.villageData = this.filter.villages;
      this.villageMapping = {};
      this.pairedVillageMapping = {};
      this.villageData.forEach((village) => {
        const villageName = village.village_name.trim().toLowerCase();
        this.villageMapping[villageName] = village.village_id;
        this.pairedVillageMapping[`${village.state_id}=>${village.district_id}=>${village.tehsil_id}=>${village.block_id}=>${village.grampanchayat_id}=>${villageName}`] = village.village_id;
        this.villageMapping[village.village_id] = village.village_name;
      });
      this.iuLevelData = this.filter.notifiedUnits;
      this.iuLevelMapping = {};
      this.pairedIuLevelMapping = {};
      this.iuLevelData.forEach((iuLevel) => {
        const iuName = iuLevel.notified_unit_name.trim().toLowerCase();
        this.iuLevelMapping[iuName] = iuLevel.notified_id;
        this.pairedIuLevelMapping[iuName] = iuLevel.notified_id;
        this.iuLevelMapping[iuLevel.notified_id] = iuLevel.notified_unit_name;
      });
      this.cropData = this.filter.crops;
      this.cropMapping = {};
      this.pairedCropMapping = {};
      this.cropData.forEach((crop) => {
        const cropName = crop.crop_name.trim().toLowerCase();
        this.cropMapping[cropName] = crop.crop_code;
        this.pairedCropMapping[cropName] = crop.crop_code;
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
        const seasonName = season.season_name.trim().toLowerCase();
        this.seasonMapping[seasonName] = season.id;
        this.seasonCodeMapping[season.season_code] = season.id;
        this.pairedSeasonMapping[seasonName] = season.id;
        this.seasonMapping[season.id] = season.season_name;
      });
  }

  /**
   * Method get triggered upon input file click
   * @param element
   */
  onFileEleClick(element: any) {
    this.fileEle.nativeElement.value = null;
    this.fileName = "";
  }

  /**
   * Method get trigger when input file change
   * @param event '
   */
  async onFileChange(event: any) {
    if (event.target.files?.length == 1) {
      this.loading++
      const file = event.target.files[0];
      const fileData: any = await this.fileToJson(file);
      if (fileData) {
        if (this.projectContext === 'saksham' && fileData.jsonData && fileData.jsonData.length > 8000) {
          this.core.toast("warn", "This file contains more than 8,000 records.");
          this.loading--
          return;
        }
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

  /**
   * Method to validate csv data and convert data into json
   * @param file
   * @returns
   */
  async fileToJson(file: any) {
    return new Promise((res, rej) => {
      const fileReader = new FileReader();
      fileReader.onload = (event: any) => {
        const text = new TextDecoder().decode(new Uint8Array(event.target.result));
        const file_data = this.parseCsv(text);
        if (!file_data?.length) {
          this.core.toast("warn", "Empty file");
          return res(null);
        }
        const work_book = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(work_book, XLSX.utils.aoa_to_sheet(file_data), 'Sheet1');
        const sheet_data = XLSX.utils.sheet_to_json(
          XLSX.read(XLSX.write(work_book, { bookType: 'xlsx', type: 'array' }), { type: 'array', cellDates: true }).Sheets['Sheet1'],
          { header: 1 }
        );
        if (!sheet_data?.length || !this.checkFileValidity(sheet_data)) {
          this.core.toast("warn", "Empty or invalid file");
          return res(null);
        }
        const fields = this.buildFields();
        const mappings = this.buildMappings();
        const { jsonData, validData, invalidData } = this.processSheetData(sheet_data, fields, mappings);
        if (new Set(jsonData.map((d) => d.intimation_id)).size !== jsonData.length) {
          this.core.toast("warn", "Duplicate intimation id");
          return res(null);
        }
        res({ jsonData, validData, invalidData });
      };
      fileReader.readAsArrayBuffer(file);
    });
  }

  private buildFields() {
    return this.fileHeaders.reduce((fields: any, d: any) => {
      fields[d.field] = d;
      return fields;
    }, {});
  }

  private buildMappings() {
    return {
      state: this.pairedStateMapping, district: this.pairedDistrictMapping, block: this.pairedBlockMapping,
      ri_circle: this.pairedRiCircleMapping, grampanchayat: this.pairedGrampanchayatMapping,
      village: this.pairedVillageMapping, iu_level: this.pairedIuLevelMapping,
      crop: this.pairedCropMapping, int_year: this.pairedYearMapping, season: this.seasonMapping
    };
  }

  private processSheetData(sheet_data: any[], fields: any, mappings: any) {
    const jsonData: any[] = [];
    const validData: any[] = [];
    const invalidData: any[] = [];
    const keys = this.fileHeaders.map((d: any) => d.field);
    for (let i = 1; i < sheet_data.length; i++) {
      const row = this.processRow(sheet_data[i], keys, mappings);
      this.validateRow(row, fields, validData, invalidData);
      jsonData.push(row);
    }
    return { jsonData, validData, invalidData };
  }

  private processRow(data: any, keys: string[], mappings: any) {
    const row: any = { errors: {}, isValid: true, remark: [] };
    data.forEach((cell: any, j: number) => {
      cell = cell instanceof Date ? moment(cell).format("DD-MM-YYYY") : typeof cell === "string" && cell ? cell.trim() : cell;
      const key = keys[j];
      if (mappings[key]) {
        const baseVal = cell?.toLowerCase ? cell.toLowerCase().trim() : cell;
        let mapKey: string;
        if (key === 'district') {
          mapKey = `${row.state}=>${baseVal}`;
        } else if (key === 'block') {
          mapKey = `${row.state}=>${row.district}=>${baseVal}`;
        } else if (key === 'ri_circle') {
          mapKey = `${row.state}=>${row.district}=>${row.block}=>${baseVal}`;
        } else if (key === 'grampanchayat') {
          mapKey = `${row.state}=>${row.district}=>${row.block}=>${row.ri_circle}=>${baseVal}`;
        } else if (key === 'village') {
          mapKey = `${row.state}=>${row.district}=>${row.block}=>${row.ri_circle}=>${row.grampanchayat}=>${baseVal}`;
        } else {
          mapKey = baseVal;
        }
        row[key] = mappings[key][mapKey] || cell;
      } else {
        row[key] = cell;
      }
    });
    return row;
  }

  private validateRow(row: any, fields: any, validData: any[], invalidData: any[]) {
    this.fileHeaders.forEach((field: any) => {
      if (!row[field.field] && field.default) {
        row[field.field] = field.default;
      }
      if (!row[field.field] && field.requried) {
        const required = typeof field.requried === "function" ? field.requried(row) : field.requried;
        if (required) {
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
      this.validateFieldType(row, field);
    });
    this.validateIntimationId(row);
    if (row.isValid) {
      validData.push(row);
    } else {
      invalidData.push(row);
    }
  }

  private validateFieldType(row: any, field: any) {
    if (field.type === "number" && row[field.field]) {
      if (isNaN(+row[field.field])) {
        row.errors[field.field] = true;
        row.remark.push(field.is_lkp ? `${row[field.field]} value is incorrect for ${field.header}` : `${field.header} value must be in number format`);
        row.isValid = false;
      } else if (field.max && +row[field.field] > field.max) {
        row.errors[field.field] = true;
        row.remark.push(`${field.header} value cannot exceed ${field.max}`);
        row.isValid = false;
      }
    } else if (field.type === "date" && row[field.field]) {
      const datePattern = this.projectContext === 'saksham' ? /^(18|19|20)\d\d-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/ : /^(0[1-9]|1[0-9]|2[0-9]|3[01])-(0[1-9]|1[012])-\d{4}$/;
      const dateFormat = this.projectContext === 'saksham' ? "YYYY-MM-DD" : "DD-MM-YYYY";
      if (!datePattern.test(row[field.field])) {
        row.errors[field.field] = true;
        row.remark.push(`${field.header} value must be in "${dateFormat}" date format`);
        row.isValid = false;
      }
    } else if (field.length && row[field.field] && row[field.field]?.length > field.length) {
      row.errors[field.field] = true;
      row.remark.push(`${field.header} value can not exceed more than ${field.length} characters`);
      row.isValid = false;
    } else if (field.type === 'alphanumaric' && row[field.field] && !/^[A-Z a-z 0-9]+$/.test(row[field.field])) {
      row.errors[field.field] = true;
      row.remark.push(`${field.header} value is incorrect use only aplha numaric values`);
      row.isValid = false;
    }
  }

  private validateIntimationId(row: any) {
    if (row.intimation_id) {
      const intLength = this.projectContext === 'saksham' ? 23 : 24;
      const seqLength = this.projectContext === 'saksham' ? 8 : 9;
      const value = row.intimation_id.trim().split('-');
      if (row.intimation_id.trim().length !== intLength || value.length !== 5 || value[0] !== 'INT' ||
          this.yearCodeMapping[value[1]] !== row.int_year || this.stateCodeMapping[value[2]] !== row.state ||
          this.seasonCodeMapping[value[3]] !== row.season || value[4]?.length !== seqLength || isNaN(+value[4])) {
        row.remark.push(`Invalid Intimation id`);
        row.errors.intimation_id = true;
        row.isValid = false;
      }
    }
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
    const datePattern = this.projectContext === 'saksham' ? /^(18|19|20)\d\d-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/ : /^(?:(?:19|20)\d{2})-(?:(?:0[1-9]|1[0-2])-(?:0[1-9]|1\d|2[0-8])|(?:0[13-9]|1[0-2])-(?:29|30)|(?:0[13578]|1[02])-31)$/;
    return datePattern.test(dateString);
  }

  checkFileValidity(sheet_data: any[]){
    if(sheet_data.length < 2){
      this.core.toast("warn", "This file has no data, Please upload valid data.");
      this.loading--;
      return false;
    }
    const headers: any[] = sheet_data[0];
    if(!headers || headers.length != this.fileHeaders.length || headers.some((d: string, i: number)=>{
      return d != this.fileHeaders[i].header;
    })){      
      this.core.toast("warn", "Wrong type of file, Please check the template.");
      return false;
    } 
    return true;
  }

  chunkArray(array: any[], size: number): any[][] {
    const result: any[][] = [];
    for (let i = 0; i < array.length; i += size) {
      result.push(array.slice(i, i + size));
    }
    return result;
  }

  async onSubmit() {
    this.failedIntimations = [];
    const data = this.core.clone(this.fileData);
    data.forEach((d: any) => delete d.errors);
    if (this.projectContext === 'saksham') {
      this.modalService.open(this.progressContent, { centered: true, animation: true, keyboard: false, backdrop: 'static' });
      this.isUploading = true;
      this.totalUploadRecords = data.length;
      const chunks = this.chunkArray(data, 500);
      const error_msg = await this.uploadChunksSequentially(chunks);
      this.resetFileData();
      if (this.failedIntimations.length) {
        this.core.toast("warn", "The above record's intimation IDs already exist in the system!");
      } else if (error_msg) {
        this.core.toast("error", error_msg);
      } else {
        this.core.toast("success", "Upload completed successfully!");
      }
    } else {
      data.forEach((d: any) => {
        ['date_of_intimation', 'date_of_intimation_farmer', 'date_of_loss', 'date_of_sowing', 'post_harvest_date', 'survey_done_date', 'survey_upload_date', 'surveyor_appointment_date'].forEach(field => {
          d[field] = this.convertIndToUsDate(d[field]);
        });
      });
      const request = { purpose: "upload_cls_intimation", data };
      try {
        const response: any = await this.core.post(request);
        if (response?.status === 1) {
          if (response.failedIntimations?.length) {
            this.failedIntimations = this.core.clone(response.failedIntimations.map((intimation: any) => this.fileData.find((d) => d.intimation_id == intimation)).filter((d: any) => d));
          }
          this.resetFileData();
          this.core.toast(data.length === this.failedIntimations.length ? "warn" : "success", data.length === this.failedIntimations.length ? "The above record's intimation IDs already exist in the system!" : response.msg);
        } else {
          this.core.toast("error", response.msg);
        }
      } catch (err) {
        this.core.toast("error", "Unable to upload intimation data");
      }
    }
  }

  private resetFileData() {
    this.fileData = [];
    this.invalidFileData = [];
    if (this.fileEle?.nativeElement?.value) {
      this.fileEle.nativeElement.value = null;
    }
    this.fileName = "";
  }

  async uploadChunksSequentially(chunks: any[]): Promise<string> {
    let response_msg = '';
    let error_msg = false;
    let chunkNumber = 1;
    for (const chunk of chunks) {
      const request = { purpose: "upload_cls_intimation", data: chunk };
      this.submitting++;
      try {
        const response: any = await this.core.post(request);
        if (response?.status == 1) {
          if (response.failedIntimations?.length) {
            const failedIntimation = response.failedIntimations
              .map((intimation: any) => {
                return this.fileData.find((d) => d.intimation_id == intimation);
              })
              .filter((d: any) => d);
            this.failedIntimations = this.failedIntimations.concat(this.core.clone(failedIntimation));
          }
        } else {
          error_msg = true;
        }
        response_msg = response.msg;
      } catch (err) {
        error_msg = true;
        response_msg = "Unable to upload intimation data";
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

  /**
   * method to download invalid records
   */
  downloadInvalids() {
    const fileName = "invalid_intimations";
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

  /**
   * Method to clear failed data
   */
  clearFailed() {
    this.failedIntimations = [];
  }

  /**
   * Download Failded Data
   *
   */
  /**
   * method to download invalid records
   */
  downloadFaileds() {
    const fileName = "Failed_intimations";
    const jsonData: any[] = this.failedIntimations.map((data) => {
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
      return row;
    });
    jsonData.unshift(this.fileHeaders.map((d) => d.header));
    const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(jsonData);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    const sheetName = fileName;
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(
      wb,
      `${moment(new Date()).format("yyyyMMDD")}_${fileName}.xlsx`
    );
  }

  /**
   * Method to convert date format
   */
  convertIndToUsDate(date: any) {
    return moment(date, 'DD-MM-YYYY').format('YYYY-MM-DD');
  }

  onPageTrigger(event: any) {
    this.currentpage = event?.first / event?.rows + 1; // Calculate the current page
    this.recordsPerPage = event?.rows;
    this.updatePageReport(); // Update report on page change
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

}