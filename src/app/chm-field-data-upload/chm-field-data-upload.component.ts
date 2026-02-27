import { Component, OnInit, ViewChild } from "@angular/core";
import * as XLSX from "xlsx";
import { CoreService } from "../utilities/core.service";
import { FilterService } from "../utilities/filter.service";
import * as moment from "moment";
import { FeatureToggleService } from "../shared/services/feature-toggle.service";
import { environment, ProjectContext } from "../../environments/environment";
import { UserDetailService } from "../auth/user-detail.service";

@Component({
  selector: "app-chm-field-data-upload",
  templateUrl: "./chm-field-data-upload.component.html",
  styleUrls: ["./chm-field-data-upload.component.css"],
})
export class ChmFieldDataUploadComponent implements OnInit {
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
  districtData: any[] = [];
  districtMapping: any;
  pairedDistrictMapping: any;
  blockData: any[] = [];
  blockMapping: any;
  pairedBlockMapping: any;
  yearData: any[] = [];
  yearMapping: any;
  pairedYearMapping: any;
  seasonData: any[] = [];
  seasonMapping: any;
  pairedSeasonMapping: any;
  isDisabled: boolean = true;
  isLookupLoaded = false;
  failedIntimations: any[] = [];
  csrfTokenName: any;
  csrfToken: any;
  projectContext: ProjectContext;
  assetsFolder: string;

  constructor(
    private core: CoreService,
    private filter: FilterService,
    private featureToggle: FeatureToggleService,
    private userService: UserDetailService
  ) {
    this.projectContext = this.featureToggle.getContext() as ProjectContext;
    this.assetsFolder = environment.projectConfigs[this.projectContext].assetsFolder;
    this.fileHeaders = [
      {
        field: "year",
        header: "Year",
      },
      {
        field: "season",
        header: "Season",
      },
      {
        field: "state",
        header: "State",
      },
      {
        field: "district",
        header: "District",
      },
      {
        field: "tehsil",
        header: "Block",
      },
      {
        field: "latitude",
        header: "Latitude",
      },
      {
        field: "longitude",
        header: "Longitude",
      },
    ];
  }

  ngOnInit(): void {
    this.getFilterData();
    this.csrfTokenName = this.userService.getcsrfTokenName();
    this.csrfToken = this.userService.getcsrfToken();
  }

  /**
   * Method to fetch filter data
   */
  getFilterData() {
    const is_village_fetched = this.filter.isvillageFetched;
    if (is_village_fetched) {
      this.get_lookup_data();
    } else {
      this.filter.fetchedLocationData.subscribe(() => this.get_lookup_data());
    }
  }

  /**
   * Method to add lookup values
   */
  get_lookup_data() {
    this.isLookupLoaded = true;
    this.stateData = this.filter.states;
    this.stateMapping = {};
    this.pairedStateMapping = {};
    this.stateData.forEach((state) => {
      const stateName = state.state_name.trim().toLowerCase();
      this.stateMapping[stateName] = state.state_id;
      this.pairedStateMapping[stateName] = state.state_id;
      this.stateMapping[state.state_id] = state.state_name;
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
    this.pairedBlockMapping = {};
    this.blockData.forEach((tehsil) => {
      const tehsilName = tehsil.tehsil_name.trim().toLowerCase();
      this.blockMapping[tehsilName] = tehsil.tehsil_id;
      this.pairedBlockMapping[`${tehsil.state_id}=>${tehsil.district_id}=>${tehsilName}`] = tehsil.tehsil_id;
      this.blockMapping[tehsil.tehsil_id] = tehsil.tehsil_name;
    });
    this.yearData = this.filter.years;
    this.yearMapping = {};
    this.pairedYearMapping = {};
    this.yearData.forEach((year) => {
      this.yearMapping[year.year_code] = year.id;
      this.pairedYearMapping[year.year_code] = year.id;
      this.yearMapping[year.id] = year.year_code;
    });
    this.seasonData = this.filter.seasons;
    this.seasonMapping = {};
    this.pairedSeasonMapping = {};
    this.seasonData.forEach((season) => {
      const seasonName = season.season_name.trim().toLowerCase();
      this.seasonMapping[seasonName] = season.id;
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

  /**
   * Method to validate csv data and convert data into json
   * @param file
   * @returns
   */
  async fileToJson(file: any) {
    return await new Promise((res, rej) => {
      const fileReader = new FileReader();
      fileReader.onload = (event: any) => {
        const data = new Uint8Array(event.target.result);
        const work_book = XLSX.read(data, { type: "array" });
        const sheet_name = work_book.SheetNames;
        const sheet_data = XLSX.utils.sheet_to_json(
          work_book.Sheets[sheet_name[0]],
          { header: 1 }
        );
        if (sheet_data?.length) {
          const headers: any = sheet_data[0];
          const fileHeaders = this.fileHeaders.map((d) => d.header);
          if (
            headers?.length !== fileHeaders.length ||
            !fileHeaders.every(
              (d: any, i: any) => headers[i]?.toLowerCase() == d?.toLowerCase()
            )
          ) {
            this.core.toast("warn", "Invalid file data");
            res(null);
          } else {
            const jsonData: any[] = [];
            const validData: any[] = [];
            const invalidData: any[] = [];
            const coordinate: any = {};
            const coordinateData: any = {};
            const keys = this.fileHeaders.map((d) => d.field);
            for (let i = 1; i < sheet_data.length; i++) {
              const data: any = sheet_data[i];
              const row: any = { errors: {}, remark: [], cordinate: ''};
              if (data.length != fileHeaders.length) {
                this.core.toast("warn", "Invalid file data");
                res(null);
                break;
              } else {
                for (let j = 0; j < data.length; j++) {
                  let cell = data[j];

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
                        row.errors[keys[j]] = true;
                        if (cell) {
                          row.remark.push('Invalid value for state');
                        } else {
                          row.remark.push('State is mandatory');
                        }
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
                        row.errors[keys[j]] = true;
                        if (cell) {
                          row.remark.push('Invalid value for district');
                        } else {
                          row.remark.push('District is mandatory');
                        }
                      }
                      break;
                    }
                    case "tehsil": {
                      const baseVal = cell?.toLowerCase ? cell?.toLowerCase() : cell;
                      const key = `${row.state}=>${row.district}=>${baseVal}`;
                      const val = this.pairedBlockMapping[key];
                      if (val) {
                        row[keys[j]] = val;
                      } else {
                        row[keys[j]] = cell;
                        row.errors[keys[j]] = true;
                        if (cell) {
                          row.remark.push('Invalid value for block');
                        } else {
                          row.remark.push('Block is mandatory');
                        }
                      }
                      break;
                    }
                    case "year": {
                      const val =
                    this.pairedYearMapping[
                      cell?.toLowerCase ? cell?.toLowerCase().trim() : cell
                    ];
                      if (val) {
                        row[keys[j]] = val;
                      } else {
                        row[keys[j]] = cell;
                        row.errors[keys[j]] = true;
                        if (cell) {
                          row.remark.push('Invalid value for year');
                        } else {
                          row.remark.push('Year is mandatory');
                        }
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
                        row.errors[keys[j]] = true;
                        if (cell) {
                          row.remark.push('Invalid value for season');
                        } else {
                          row.remark.push('Season is mandatory');
                        }
                      }
                      break;
                    }
                    case "latitude": {
                      if (!cell || (cell.trim && cell.trim().length === 0) || isNaN(+cell)) {
                        row.errors[keys[j]] = true;
                        row[keys[j]] = cell;
                        if (cell) {
                          row.remark.push('Invalid value for latitude');
                        } else {
                          row.remark.push('Latitude is mandatory');
                        }
                      } else {
                        row[keys[j]] = cell;
                      }
                      break;
                    }
                    case "longitude": {
                      if (!cell || (cell.trim && cell.trim().length === 0) || isNaN(+cell)) {
                        row[keys[j]] = cell;
                        row.errors[keys[j]] = true;
                        if (cell) {
                          row.remark.push('Invalid value for longitude');
                        } else {
                          row.remark.push('Longitude is mandatory');
                        }
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
                row.cordinate = `${row.latitude},${row.longitude}`;
                if (!coordinate[row.cordinate]) {
                  coordinate[row.cordinate] = 0;
                  coordinateData[row.cordinate] = [];
                }
                if (!row.errors.latitude || !row.errors.longitude) {
                  coordinate[row.cordinate]++;
                  coordinateData[row.cordinate].push(i);
                }
                row.record_index = i+1;
                jsonData.push(row);
              }
            }
            Object.keys(coordinate).forEach(cor => {
              if (coordinate[cor] > 1) {
                coordinateData[cor].forEach((k:any) => {
                  const dupData = jsonData[k-1];
                  dupData.errors['latitude'] = true;
                  dupData.errors['longitude'] = true;
                  dupData.remark.push('Duplicate coordinate');
                })
              }
            })
            jsonData.forEach(row => {
              if (!Object.keys(row.errors).length) {
                validData.push(row);
              } else {
                invalidData.push(row);
              }
            })
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

  /**
   * Submit method
   */
  onSubmit() {
    this.fileData.forEach((d) => delete d.errors);
    const request = { purpose: "upload_chm_location", data: this.fileData };
    this.core
      .post(request)
      .then((response: any) => {
        if (response?.status == 1) {
          if (response.failedIntimations?.length) {
            const failedIntimation = response.failedIntimations
              .map((intimation: any) => {
                return this.fileData.find((d) => d.intimation_id == intimation);
              })
              .filter((d: any) => d);
            this.failedIntimations = this.core.clone(failedIntimation);
          }
          this.fileData = [];
          this.invalidFileData = [];
          if (this.fileEle?.nativeElement?.value) {
            this.fileEle.nativeElement.value = null;
          }
          this.fileName = "";
          this.core.toast("success", response.msg);
        } else {
          this.core.toast("error", response.msg);
        }
      })
      .catch((err) => {
        this.core.toast("error", "Unable to upload intimation data");
      })
      .finally();
  }

  /**
   * Method to download invalid records
   */
  downloadInvalids() {
    const fileName = "invalid_records";
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
          case "tehsil": {
            row.push(this.blockMapping[cell] || cell);
            break;
          }
          case "year": {
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
      row.push(data.remark.join())
      row.push(data.record_index)
      return row;
    });
    jsonData.unshift(this.fileHeaders.map((d) => d.header));
    jsonData[0].push('Error');
    jsonData[0].push('Record SNo');
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
   * Download Failed Data
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
          case "tehsil": {
            row.push(this.blockMapping[cell] || cell);
            break;
          }
          case "year": {
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
}