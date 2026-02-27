import { Component, OnInit, ViewChild } from "@angular/core";
import * as XLSX from "xlsx";
import { CoreService } from "../utilities/core.service";
import { FilterService } from "../utilities/filter.service";
import * as moment from "moment";
import { FeatureToggleService } from "../shared/services/feature-toggle.service";
import { environment, ProjectContext } from "../../environments/environment";
import { InsightsService } from "../utilities/insights.service";

type MappingConfig = {
  nameField: string;
  idField: string;
  parentFields?: string[];
  lowerTrim?: boolean;
  hasReverse?: boolean;
  hasPaired?: boolean;
};

@Component({
  selector: "app-cce-upload",
  templateUrl: "./cce-upload.component.html",
  styleUrls: ["./cce-upload.component.css"],
})
export class CceUploadComponent implements OnInit {
  blockData: any[] = [];
  blockMapping: any;
  collapseId: string = "collapseExample";
  cropData: any[] = [];
  cropMapping: any;
  districtData: any[] = [];
  districtMapping: any;
  failedIntimations: any[] = [];
  fileData: any[] = [];
  fileHeaders: any[];
  fileName: any = "";
  grampanchayatData: any[] = [];
  grampanchayatMapping: any;
  invalidFileData: any[] = [];
  isCollapsed: boolean = true;
  isLookupLoaded = false;
  iuLevelData: any[] = [];
  iuLevelMapping: any;
  loading = 0;
  pairedBlockMapping: any;
  pairedCropMapping: any;
  pairedDistrictMapping: any;
  pairedGrampanchayatMapping: any;
  pairedIuLevelMapping: any;
  pairedRiCircleMapping: any;
  pairedSeasonMapping: any;
  pairedStateMapping: any;
  pairedVillageMapping: any;
  pairedYearMapping: any;
  riCircleData: any[] = [];
  riCircleMapping: any;
  seasonData: any[] = [];
  seasonMapping: any;
  stateData: any[] = [];
  stateMapping: any;
  villageData: any[] = [];
  villageMapping: any;
  yearData: any[] = [];
  yearMapping: any;
  projectContext: ProjectContext;
  assetsFolder: string;
  @ViewChild("fileEle") fileEle: any;

  constructor(private core: CoreService, private filter: FilterService, private featureToggle: FeatureToggleService, private insightsService: InsightsService) {
    this.projectContext = this.featureToggle.getContext() as ProjectContext;
    this.assetsFolder = environment.projectConfigs[this.projectContext].assetsFolder;
    this.fileHeaders = [
      { field: "year", header: "Year", type: "number", is_lkp: true, }, { field: "season", header: "Season", type: "number", is_lkp: true, }, { field: "state", header: "State", type: "number", is_lkp: true, }, { field: "district", header: "District", type: "number", is_lkp: true, }, { field: "taluka", header: "taluka", type: "number", is_lkp: true, }, { field: "ri_circle", header: "RI circle", type: "number", is_lkp: true, }, { field: "gp", header: "GP", type: "number", is_lkp: true, }, { field: "village", header: "Village", type: "number", is_lkp: true, }, { field: "notified_unit", header: "Notified Unit", type: "number", is_lkp: true, }, { field: "crop", header: "Crop", type: "number", is_lkp: true, }, { field: "cce_type", header: "CCE Type", }, { field: "random_no", header: "Random no", }, { field: "longitude", header: "Longitude", }, { field: "latitude", header: "Latitude", }, { field: "farmer_name", header: "Farmer Name", }, { field: "farmer_mobile_no", header: "Farmer Mobile no", type: "number", }, { field: "shape_of_cce_plot", header: "Shape of CCE plot", }, { field: "dimension_of_plot", header: "Dimension of plot", }
    ];
  }

  ngOnInit(): void {
    this.getFilterData();
  }

  getFilterData() {
    const isVillageFetched = this.filter.isvillageFetched;
    if (isVillageFetched) {
      this.fetchLookupDataImmediately();
    } else {
      this.waitForVillageDataAndFetchLookup();
    }
  }

  fetchLookupDataImmediately() {
    this.getLookupData();
  }

  waitForVillageDataAndFetchLookup() {
    this.filter.fetchedVillageData.subscribe(() => {
      this.getLookupData();
    });
  }

  getLookupData() {
    this.initializeLookupData();
    this.buildAllMappings();
  }

  private initializeLookupData(): void {
    this.isLookupLoaded = true;
    this.stateData = this.filter.states;
    this.districtData = this.filter.districts;
    this.blockData = this.filter.tehsils;
    this.riCircleData = this.filter.blocks;
    this.grampanchayatData = this.filter.grampanchayats;
    this.villageData = this.filter.villages;
    this.iuLevelData = this.filter.notifiedUnits;
    this.cropData = this.filter.crops;
    this.yearData = this.filter.years;
    this.seasonData = this.filter.seasons;
  }

  private buildAllMappings(): void {
    const setMapping = ( data: any[], config: MappingConfig, mappingProp: keyof CceUploadComponent, pairedProp: keyof CceUploadComponent
    ) => {
      const { mapping, pairedMapping } = this.buildMappings(data, config);
      (this as any)[mappingProp] = mapping;
      (this as any)[pairedProp] = pairedMapping;
    };
    setMapping( this.stateData, { nameField: 'state_name', idField: 'state_id', parentFields: [], lowerTrim: true, hasReverse: true, hasPaired: true }, 'stateMapping', 'pairedStateMapping' );
    setMapping( this.districtData, { nameField: 'district_name', idField: 'district_id', parentFields: ['state_id'], lowerTrim: true, hasReverse: true, hasPaired: true }, 'districtMapping', 'pairedDistrictMapping' );
    setMapping( this.blockData, { nameField: 'tehsil_name', idField: 'tehsil_id', parentFields: ['state_id', 'district_id'], lowerTrim: true, hasReverse: true, hasPaired: true }, 'blockMapping', 'pairedBlockMapping' );
    setMapping( this.riCircleData, { nameField: 'block_name', idField: 'block_id', parentFields: ['state_id', 'district_id', 'tehsil_id'], lowerTrim: true, hasReverse: true, hasPaired: true }, 'riCircleMapping', 'pairedRiCircleMapping' );
    setMapping( this.grampanchayatData, { nameField: 'grampanchayat_name', idField: 'grampanchayat_id', parentFields: ['state_id', 'district_id', 'tehsil_id', 'block_id'], lowerTrim: true, hasReverse: true, hasPaired: true }, 'grampanchayatMapping', 'pairedGrampanchayatMapping' );
    setMapping( this.villageData, { nameField: 'village_name', idField: 'village_id', parentFields: ['state_id', 'district_id', 'tehsil_id', 'block_id', 'grampanchayat_id'], lowerTrim: true, hasReverse: true, hasPaired: true }, 'villageMapping', 'pairedVillageMapping' );
    setMapping( this.iuLevelData, { nameField: 'notified_unit_name', idField: 'notified_id', parentFields: [], lowerTrim: true, hasReverse: true, hasPaired: true }, 'iuLevelMapping', 'pairedIuLevelMapping' );
    setMapping( this.cropData, { nameField: 'crop_name', idField: 'crop_code', parentFields: [], lowerTrim: true, hasReverse: true, hasPaired: true }, 'cropMapping', 'pairedCropMapping' );
    setMapping( this.yearData, { nameField: 'year_code', idField: 'id', parentFields: [], lowerTrim: false, hasReverse: true, hasPaired: true }, 'yearMapping', 'pairedYearMapping' );
    setMapping( this.seasonData, { nameField: 'season_name', idField: 'id', parentFields: [], lowerTrim: true, hasReverse: true, hasPaired: true }, 'seasonMapping', 'pairedSeasonMapping' );
  }

  private buildMappings(data: any[], config: MappingConfig) {
    const { nameField, idField, parentFields = [], lowerTrim = true, hasReverse = true, hasPaired = true } = config;
    const mapping: any = {};
    let pairedMapping: any = null;
    if (hasPaired) {
      pairedMapping = {};
    }
    data.forEach((item: any) => {
      let nameKey = item[nameField];
      if (lowerTrim && typeof nameKey === 'string') {
        nameKey = nameKey.trim().toLowerCase();
      }
      mapping[nameKey] = item[idField];
      if (hasReverse) {
        mapping[item[idField]] = item[nameField];
      }
      if (hasPaired) {
        let pairedKey = nameKey;
        if (parentFields.length > 0) {
          const parentStr = parentFields.map(pf => item[pf]).join('=>');
          pairedKey = `${parentStr}=>${nameKey}`;
        }
        pairedMapping[pairedKey] = item[idField];
      }
    });
    return { mapping, pairedMapping };
  }

  downloadInvalids() {
    const fileName = "Failed_CCE_implmentation";
    const fileHeader = [...this.fileHeaders, { field: "remark", header: "Remark" }];
    const jsonData = this.invalidFileData.map((data: any) => {
      const row = fileHeader.map((field: any) => {
        const cell = data[field.field];
        const mappings: { [key: string]: any } = {
          state: this.stateMapping,
          district: this.districtMapping,
          taluka: this.blockMapping,
          ri_circle: this.riCircleMapping,
          gp: this.grampanchayatMapping,
          village: this.villageMapping,
          notified_unit: this.iuLevelMapping,
          crop: this.cropMapping,
          year: this.yearMapping,
          season: this.seasonMapping
        };
        if (field.field === "remark") {
          return cell?.length ? cell.join(',\n') : "";
        }
        return mappings[field.field] ? mappings[field.field][cell] || cell : cell;
      });
      return row;
    });
    jsonData.unshift(fileHeader.map((d: any) => d.header));
    const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(jsonData);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, fileName);
    XLSX.writeFile(wb, `${moment(new Date()).format("yyyyMMDD")}_${fileName}.xlsx`);
  }

  onSubmit() {
    const data = this.core.clone(this.fileData);
    data.forEach((d: any) => {
      delete d.errors;
      delete d.isValid;
      delete d.remark;
    });
    const request = { purpose: "upload_cce_implementation", data };
    this.loading++;
    this.core
      .post(request)
      .then((response: any) => {
        if (response?.status == 1) {
          this.fileData = [];
          this.invalidFileData = [];
          if (this.fileEle?.nativeElement?.value) {
            this.fileEle.nativeElement.value = null;
          }
          this.fileName = "";
          this.core.toast("success", response.msg);
        } else {
          this.core.toast("error", response.msg)
        }
      }).catch((err) => {
        this.insightsService.logException(err);
      }).finally(() => {
        this.loading--;
      })
  }
  clearFailed() {}

  onFileEleClick(element: any) {
    this.fileEle.nativeElement.value = null;
    this.fileName = "";
  }

  async onFileChange(event: any) {
    if (event.target.files?.length == 1) {
      const file = event.target.files[0];
      const fileData: any = await this.fileToJson(file);
      if (fileData) {
        this.fileName = file.name;
        this.fileData = fileData.validData;
        this.invalidFileData = fileData.invalidData;
      } else {
        event.target.value = null;
      }
    }
  }

  async fileToJson(file: any) {
    return new Promise((res, rej) => {
      const fileReader = new FileReader();
      fileReader.onload = (event: any) => {
        const file_data = new Uint8Array(event.target.result);
        const work_book = XLSX.read(file_data, { type: "array" });
        const sheet_data = XLSX.utils.sheet_to_json(work_book.Sheets[work_book.SheetNames[0]], { header: 1 });
        if (!sheet_data?.length) {
          this.core.toast("warn", "Empty file");
          return res(null);
        }
        const headers = sheet_data[0];
        const fields = this.initializeFields();
        const keys = this.fileHeaders.map((d: any) => d.field);
        const mappings: { [key: string]: any } = {
          state: this.pairedStateMapping,
          district: this.pairedDistrictMapping,
          taluka: this.pairedBlockMapping,
          ri_circle: this.pairedRiCircleMapping,
          gp: this.pairedGrampanchayatMapping,
          village: this.pairedVillageMapping,
          notified_unit: this.pairedIuLevelMapping,
          crop: this.pairedCropMapping,
          year: this.pairedYearMapping,
          season: this.pairedSeasonMapping
        };
        const { jsonData, validData, invalidData } = this.processSheetData(sheet_data, keys, fields, mappings);
        res({ jsonData, validData, invalidData });
      };
      fileReader.readAsArrayBuffer(file);
    });
  }

  private initializeFields(): any {
    const fields: any = {};
    this.fileHeaders.forEach((d: any) => { fields[d.field] = d });
    return fields;
  }

  private processSheetData(sheet_data: any[], keys: string[], fields: any, mappings: any): { jsonData: any[], validData: any[], invalidData: any[] } {
    const jsonData: any[] = [];
    const validData: any[] = [];
    const invalidData: any[] = [];
    for (let i = 1; i < sheet_data.length; i++) {
      const row = this.processRow(sheet_data[i], keys, mappings);
      this.validateRow(row, fields, validData, invalidData);
      jsonData.push(row);
    }
    return { jsonData, validData, invalidData };
  }

  private processRow(data: any[], keys: string[], mappings: any): any {
    const row: any = { errors: {}, isValid: true, remark: [] };
    data.forEach((cell: any, j: number) => {
      cell = typeof cell === "string" && cell ? cell.trim() : cell;
      const key = keys[j];
      if (mappings[key]) {
        const baseVal = cell?.toLowerCase ? cell.toLowerCase().trim() : cell;
        const mapKey = this.getMapKey(key, row, baseVal);
        row[key] = mappings[key][mapKey] || cell;
      } else {
        row[key] = cell;
      }
    });
    return row;
  }

  private getMapKey(key: string, row: any, baseVal: any): string {
    if (key === 'district') {
      return `${row.state}=>${baseVal}`;
    }
    if (key === 'taluka') {
      return `${row.state}=>${row.district}=>${baseVal}`;
    }
    if (key === 'ri_circle') {
      return `${row.state}=>${row.district}=>${row.taluka}=>${baseVal}`;
    }
    if (key === 'gp') {
      return `${row.state}=>${row.district}=>${row.taluka}=>${row.ri_circle}=>${baseVal}`;
    }
    if (key === 'village') {
      return `${row.state}=>${row.district}=>${row.taluka}=>${row.ri_circle}=>${row.gp}=>${baseVal}`;
    }
    return baseVal;
  }

  private validateRow(row: any, fields: any, validData: any[], invalidData: any[]) {
    this.fileHeaders.forEach((field: any) => {
      if (!row[field.field] && field.default) {
        row[field.field] = field.default;
      }
      if (!row[field.field] && field.requried) {
        const required = typeof field.requried === "function" ? field.requried(row) : !field.requried;
        if (!required) {
          row.errors[field.field] = true;
          row.remark.push(`${field.header} is mandatory`);
          row.isValid = false;
        }
      }
      if (field.type === "number" && row[field.field] && isNaN(+row[field.field])) {
        row.errors[field.field] = true;
        row.remark.push(
          field.is_lkp
            ? `${row[field.field]} value is incorrect for ${field.header}`
            : `${field.header} value must be in number format`
        );
        row.isValid = false;
      }
      if (field.type === "date" && row[field.field]) {
        const datePattern = /^(0[1-9]|1[0-9]|2[0-9]|3[01])-(0[1-9]|1[012])-\d{4}$/;
        if (!datePattern.test(row[field.field])) {
          row.errors[field.field] = true;
          row.remark.push(`${field.header} value must be in "DD-MM-YYYY" date format`);
          row.isValid = false;
        }
      }
    });
    if (row.isValid) {
      validData.push(row);
    } else {
      invalidData.push(row);
    }
  }
}