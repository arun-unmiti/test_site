import { HttpClient } from "@angular/common/http";
import { Component, OnInit, ViewChild } from "@angular/core";
import { CoreService } from "../utilities/core.service";
import { FilterService } from "../utilities/filter.service";
import * as moment from "moment";
import * as XLSX from "xlsx";
import { UserDetailService } from "../auth/user-detail.service";
import { LeafletmapComponent } from "../leafletmap/leafletmap.component";
import { GeojsonMapperService } from "../utilities/geojson-mapper.service";
import { FeatureToggleService } from "../shared/services/feature-toggle.service";
import { environment, ProjectContext } from "../../environments/environment";

// import toGeoJSON from  '@mapbox/togeojson';
declare const toGeoJSON: any;
// declare const omnivore: any;
// declare const togeojson: any;
// declare kml = require();

@Component({
  selector: "app-kml-view",
  templateUrl: "./kml-view.component.html",
  styleUrls: ["./kml-view.component.css"],
})
export class KmlViewComponent implements OnInit {
  @ViewChild("leafletMap") leafletMap: LeafletmapComponent | any;
  blocks: any[] = [];
  selectedForm: any = "";
  allBlocks: any[] = [];
  allTehsils: any[] = [];
  selectedBlock: any[] = [];
  kmls: any[] = [];
  states: any[] = [];
  districts: any[] = [];
  tehsilOptions: any[] = [];
  clientData: any[] = [];
  usersData: any[] = [];
  cropsData: any[] = [];
  approvedStatusData: any[] = [];
  approvedStatusFlag: any = {};
  allDistricts: any[] = [];
  singleState: any = "";
  selectedState: any[] = [];
  selectedDistrict: any[] = [];
  selectedTehsil: any[] = []
  selectedClient: any[] = [];
  selectedCrop: any[] = [];
  selectedApprovedStatus: any = ''; 
  selectedUser: any[] = [];
  selectedFromDate: any = {
    startDate: moment().subtract(7, "days"),
    endDate: moment(),
  };
  localeValue = {
    format: "DD/MM/YYYY",
    displayFormat: "DD-MM-YYYY",
    separator: " - ",
    cancelLabel: "Cancel",
    applyLabel: "Okay",
  };
  showMap = false;
  survey: any;
  surveydata: any[] = [];
  fields: any[] = [];
  colDefs: any[] = [];
  typeFields: any[] = [];
  tableData: any[] = [];
  loading = 0;
  isLoadedData = false;
  kmlUrl:any = "";
  kmlUrlSuffix:any = "";
  height = "535px";
  userDetails: any;
  geoJsonData: any[] = [];
  notAvaliable: any[] = [];
  geoJsonLoading = 0;
  clientStates: any[] = [];
  clientDistricts: any[] = [];
  clientTehsils: any[] = [];
  feildMap: Map<any, any> = new Map();
  surveyTextData: any = {};
  feildTypeMap: Map<any, any> = new Map();

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
  userIdMap: Map<any, any> = new Map();
  dataCrops: any[] = [];
  isSearched: boolean = false;
  topoJsonName = "all_districts.topojson";
  districtField: any;
  districtIds: any[] = [];

  singleClient: any = '';
  selectedYear: any = '';
  selectedSeason: any = '';
  yearData: any[] = [];
  seasonData: any[] = [];
  agencyData: any[] = [];
  selectedAgency: any[] = [];
  agencyLoading: any = 0;
  isStateLoading: any = 0;
  lookupLoader: any = 0;
  isFilterCollapsed = true;
  kmlPreparation = 0;
  @ViewChild("kmlProgress") kmlProgress: any
  dataDownloadStatus: any;
  preApplied = false;
  projectContext: ProjectContext;
  assetsFolder: string;

  constructor(
    private core: CoreService,
    private filter: FilterService,
    private http: HttpClient,
    private userService: UserDetailService,
    private geoMapper: GeojsonMapperService,
    private featureToggle: FeatureToggleService
  ) {
    this.projectContext = this.featureToggle.getContext() as ProjectContext;
    this.assetsFolder = environment.projectConfigs[this.projectContext].assetsFolder;
    if (this.projectContext === 'saksham') {
      this.selectedClient = ['2000'];
      this.singleClient = '2000';
    }
  }

  ngOnInit(): void {
    this.userDetails = this.userService.getUserDetail();
    // this.getSavedData(true)
    this.getFilterData();
    this.getLocationCropData();
    const config = this.featureToggle.getConfig();
    this.kmlUrl = config.BASEKMLPREFIX;
    this.kmlUrlSuffix = config.BASEKMLSUFFIX;
  }

  getApprovedStatusData() {
    this.approvedStatusData = [
      {label: "Pending", value: null},
      {label: "Approved", value: "1"},
    ]
    this.approvedStatusFlag = {"0": "Rejected"};
    this.approvedStatusData.forEach(d => this.approvedStatusFlag[d.value] = d.label);
  }

  getFilterData() {
    this.lookupLoader++;
    if (this.filter.isLoactionFetched) {
      this.addFilterData();
      // this.getKMLData();
    } else {
      this.filter.fetchedLocationData.subscribe(() => {
        this.addFilterData();
        // this.getKMLData();
      });
    }

    if (this.filter.isvillageFetched) {
      this.setVilageData();
    } else {
        this.filter.fetchedVillageData.subscribe(() => {
          this.setVilageData();
          if (this.preApplied) {
            this.loading--;
            this.preApplied = false;
            this.search();
          }
        })
    }

    this.getApprovedStatusData();
  }

  getKMLData() {
    this.loading++;
    if (!this.filter.villages?.length) {
      this.preApplied = true;
      return;
    }
    this.clearMapDetail();
    const fieldsRequests = {
      purpose: "get_surveyfields",
      survey_id: this.selectedForm,
    };
    this.dataDownloadStatus = {};
    let selectedApprovedStatus = this.selectedApprovedStatus;
    if (selectedApprovedStatus === '') {
      selectedApprovedStatus = undefined;
    } else if (selectedApprovedStatus == 'null') {
      selectedApprovedStatus = null;
    }
    const request: any = { 
      purpose: "get_allkmls",
      states: [this.singleState],
      districts: this.selectedDistrict.map((d) => d.district_id),
      blocks: this.selectedBlock.map((d) => d.block_id),
      crops: this.selectedCrop.map((d) => d.crop_id),
      approved_reject: selectedApprovedStatus,
      tehsils: this.selectedTehsil.map((d) => d.tehsil_id),
      client_id: this.userDetails?.user_role == 1 
        ? (this.projectContext === 'munichre' 
          ? this.selectedClient.map(d => d.UNIT_ID) 
          : [this.selectedClient[0]]) 
        : [this.userDetails.unit_id],
      agency_id: this.selectedAgency.includes('0') ? [] : this.selectedAgency,
      years: [this.selectedYear],
      seasons: [this.selectedSeason],
      start_date: this.selectedFromDate?.startDate?.format("yyyy-MM-DD"),
      end_date: this.selectedFromDate?.endDate?.format("yyyy-MM-DD"),
      form_id: this.selectedForm
    };
    if (request.form_id == 1) {
      request.crop_column = "field_509";
    } else if (request.form_id == 2) {
      request.crop_column = "field_539";
    } else if (request.form_id == 3) {
      request.crop_column = "field_593";
    }
    this.isSearched = true;
    Promise.all([this.core.post(fieldsRequests), this.core.webserivce_post(request)])
      .then((responses: any) => {
        if (responses?.[0]?.status == 1) {
          const fieldResponse = responses?.[0] || {};
          this.fields = fieldResponse?.fields || fieldResponse?.fields4 || fieldResponse?.fields7 || [];
          for (let indx = 0; indx < this.fields.length; indx++) {
            this.feildMap.set(
              `field_${this.fields[indx]?.field_id}`,
              this.fields[indx]?.label
            );
            if (this.fields[indx]?.type?.startsWith("lkp_")) {
              this.feildTypeMap.set(
                `field_${this.fields[indx]?.field_id}`,
                this.fields[indx]?.type
              );
            }
          }
          // if (['approved_reject'].includes()) {}
          this.feildTypeMap.set('approved_reject', 'approved_reject');
          this.feildTypeMap.set('approved_reject_by', 'approved_reject_by');
        }

        if (responses?.[1]?.status == 1) {
          this.surveydata = responses?.[1]?.surveydata || [];
          this.surveyTextData = this.generateLkpLable(
            this.core.clone(this.surveydata)
          );
          this.kmls = responses?.[1]?.kmldata || [];
          if (this.kmls?.length) {
            this.geoJsonLoading = 1
            // this.callPromise(this.generateGeoJson).then();
            setTimeout(() => this.generateGeoJson(), 100);
          }
        }
      })
      .catch((err) => console.error(err))
      .finally(() => this.loading--);
  }

  addFilterData() {
    this.lookupLoader--;
    this.states = this.core.clone(this.filter.states);
    this.allDistricts = this.core.clone(this.filter.districts);
    this.allTehsils = this.core.clone(this.filter.tehsils);
    this.allBlocks = this.core.clone(this.filter.blocks);
    this.clientData = this.filter.lookupData?.clients;
    this.yearData = this.filter.years;
    this.seasonData = this.filter.seasons;
    this.setDefaultLocation();
    const setMap = (items: any[], map: Map<any, string>, idKey: string, nameKey: string, convertIdToNumber = false) => {
      items.forEach(item => map.set(convertIdToNumber ? +item[idKey] : item[idKey], nameKey === 'full_name' ? `${item.first_name} ${item.last_name}` : item[nameKey]));
    };
    setMap(this.filter.states, this.stateMap, 'state_id', 'state_name');
    setMap(this.filter.districts, this.districtMap, 'district_id', 'district_name');
    setMap(this.filter.tehsils, this.tehsilMap, 'tehsil_id', 'tehsil_name');
    setMap(this.filter.blocks, this.blockMap, 'block_id', 'block_name');
    setMap(this.filter.crops, this.cropMap, 'crop_code', 'crop_name', true);
    setMap(this.filter.seasons, this.seasonMap, 'id', 'season_name');
    setMap(this.filter.years, this.yearMap, 'id', 'year');
    setMap(this.filter.notifiedUnits, this.notifiedUnitMap, 'notified_id', 'notified_unit_name');
    setMap(this.filter.users, this.userIdMap, 'user_id', 'full_name');
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

  onSingleClientChange(event: any) {
    this.selectedClient = this.projectContext === 'munichre' ? this.clientData.filter(d => d.UNIT_ID == event) :['2000'];
    this.onClientSelect(this.selectedClient);
  }

  callPromise(func: Function) {
    return new Promise((res,rej) => {
      func();
      res(null);
    })
  }

  async onClientSelect(event: any) {
    this.agencyData = [];
    this.selectedAgency = [];
    this.states = [];
    this.singleState = "";
    this.selectedState = [];
    this.clientStates = [];
    this.clientDistricts = [];

    this.districts = [];
    this.selectedState = [];
    this.selectedDistrict = [];
    this.getLocationCropData();

    if (!['7'].includes(this.userDetails?.user_role) && this.singleClient && this.selectedYear && this.selectedSeason) {
      this.getAgencyData();
    }
    // if (event?.length) {
    //   const request = {client: event.map((d: any) => d.UNIT_ID), year: this.selectedYear, season: this.selectedSeason};
    //  const reses =  await this.filter.getAgencyWiseLocation(request, this.userDetails);
    //   // [this.clientStates, this.clientDistricts] =
    // }
    // this.states = this.core
    //   .clone(this.filter.states)
    //   .filter(
    //     (item: any) =>
    //       !this.clientStates?.length ||
    //       this.clientStates.includes(item.state_id)
    //   );
  }

  getLocationCropData() {
    this.selectedCrop = [];
    const request = {
      purpose: "lkp_chm_crop",
      state: this.selectedState.map((d) => d.state_id),
      district: this.selectedDistrict.map((d) => d.district_id),
      tehsil: [],
      notifiedUnit: [],
    };

    if (this.dataCrops?.length) {
      const cropsData = this.core.clone(
        this.dataCrops.filter((d) => {
          return (
            (!request.state.length || request.state.includes(d.state_id)) &&
            (!request.district.length || request.district.includes(d.dist_id))
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
    this.loading++;
    this.core
      .post(request)
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
      .finally(() => this.loading--);
  }

  onSurveyChange(event: any) {
    if (event == 1) {
      this.districtField = "field_502";
    } else if (event == 2) {
      this.districtField = "field_529";
    } else if (event == 3) {
      this.districtField = "field_586";
    }
  }

  onSingleStateChange(env: any) {
    this.selectedState = this.states.filter((data) => data.state_id == env);
    this.onStateChange(this.selectedState);
  }

  onStateChange(env: any) {
    this.districts = [];
    this.tehsilOptions = [];
    this.blocks = [];
    this.selectedDistrict = [];
    this.selectedBlock = [];
    this.getLocationCropData();
    if (env?.length) {
      this.districts =
        this.core.clone(env).map((state: any) => {
          const result: any = {
            state_name: state.state_name,
            state_id: state.state_id,
            items: [],
          };
          result.items = this.clientDistricts.filter(
            (district: any) =>  district.state_id == state.state_id
          );
          // .map((district: any) => {
          //   return {
          //     district_name: district.district_name,
          //     district_id: district.district_id,
          //   };
          // });
          return result;
        }) || [];
    }
  }

  onDistrictChange(env: any) {
    this.tehsilOptions = [];
    this.blocks = [];
    this.selectedBlock = [];
    this.getLocationCropData();
    if (env?.length) {
      this.tehsilOptions = env.map((district: any) => {
        const result: any = {
          district_id: district.district_id,
          district_name: district.district_name,
        };
        result.items = this.clientTehsils.filter(
          (d: any) => d.district_id == district.district_id
        );
        return result;
      });
    }
  }

  search() {
    this.kmls = [];
    this.geoJsonData = [];
    if (!this.selectedForm) {
      this.core.toast("warn", "Please select form");
      return;
    }
    if (this.selectedState?.length != 1) {
      this.core.toast("warn", "Please select state");
      return;
    }
    
    // if (!this.selectedFromDate?.startDate || !this.selectedFromDate?.endDate) {
    //   this.core.toast('warn', "Please select date");
    //   return;
    // }
    // const diff = this.selectedFromDate?.endDate.diff(
    //   this.selectedFromDate?.startDate,
    //   "days"
    // );
    // if (diff > 6) {
    //   this.core.toast('warn', "Date range should not be more than 7 days");
    //   return;
    // }
    // if (this.selectedForm == 3) {
    //   this.getSavedData();
    // } else {
    // }
    this.getKMLData();
  }

  closePopup() {
    this.height = "600px";
    this.tableData = [];
  }

  mapPointClick(env: any) {}

  generateColDef() {
    this.colDefs = this.fields.map((field: any) => {
      return {
        field: `field_${field.field_id}`,
        header: field.label,
        type: field.type,
        id: field.field_id,
      };
    });
    this.typeFields = this.fields
      .filter((d) => d?.type.startsWith("lkp"))
      .map((d) => {
        return { type: d.type, field: `field_${d.field_id}` };
      });
    this.typeFields.push({type: 'approved_reject', field: 'approved_reject'})
  }

  generateRowData() {
    this.tableData = this.core.clone(this.surveydata);
    this.tableData.forEach((data: any, i: any) => {
      data.sno = i + 1;
      this.typeFields.forEach((field: any) => {
        switch (field.type) {
          case "lkp_state":
            {
              data[field.field] = this.filter.states.find(
                (d: any) => d.state_id == data[field.field]
              )?.state_name;
            }
            break;

          case "lkp_district":
            {
              data[field.field] = this.filter.districts.find(
                (d: any) => d.district_id == data[field.field]
              )?.district_name;
            }
            break;

          case "lkp_block":
            {
              data[field.field] = this.filter.blocks.find(
                (d: any) => d.block_id == data[field.field]
              )?.block_name;
            }
            break;

          case "lkp_crop":
            {
              data[field.field] = this.filter.crops.find(
                (d) => d.crop_code == data[field.field]
              )?.crop_name;
            }
            break;

          case "lkp_tehsil":
            {
              data[field.field] = this.filter.tehsils.find(
                (d: any) => d.tehsil_id == data[field.field]
              )?.tehsil_name;
            }
            break;

          default:
            break;
        }
      });
    });
  }

  clearMapDetail() {
    this.survey = {};
    this.surveydata = [];
    this.fields = [];
    this.colDefs = [];
    this.typeFields = [];
    this.tableData = [];
  }

  generateGeoJson = () => {
    // this.loading++;
    const fileData: any = Array.from(
      new Set(this.kmls.map((d: any) => d.file_name))
    ).map((file: any) => {
      const result: any = {};
      result.file_name = file;
      result.info = this.kmls.filter((f: any) => f.file_name === file);
      if (result?.info?.length) {
        result.coordinates = result.info[0].coordinates;
      }
      return result;
    });
    // const allPromises = fileData.map((d: any) => this.fetchKML(d));
    this.kmlPreparation  = 1;
    // this.showMap = true;
    new Promise((res,rej) => {
      const allGeojson: any = [];
      let responseLoaded = 0;
        const currentPromises = fileData.map((d: any) => this.fetchKML(d));
        Promise.all(currentPromises)
      .then((response: any) => {
        if (response?.length) {
          const geoJsonData = [];
          for (let i = 0; i < response.length; i++) {
            const data = response[i];
            // setTimeout(() => {
              this.kmlPreparation = Math. round(((i +1) / response.length) * 100);
              if (this.kmlPreparation >= 100) {
                this.kmlPreparation = 0;
              }
              // if (this.kmlProgress) {
              //   this.kmlProgress.nativeElement.style.width = `${this.kmlPreparation}%`;
              // }
              // })
            if(data?.response) {
              let geoData: any = {};
              try {
                if (data.type == 'geojson') {
                  geoData = {features: data.response}
                } else {
                  geoData = toGeoJSON.kml(data.response);
                }
                if (geoData?.features?.length) {
                  geoData?.features.forEach((d: any) => {
                    if (!d.properties) d.properties = {};
                    const surveyTextData = this.surveyTextData[data.request.info[0].plot_data_id];
                    let properties = surveyTextData;
                    if (properties) {
                      this.dataDownloadStatus[properties.id] = true;
                      properties = Object.assign(
                        properties,
                        properties?.all_kmls?.[0] || {}
                      );
                      delete properties.all_kmls;
                    }
                    delete properties.name;
                    d.properties = properties;
                    // for (let key in properties) {
                    //   d.properties[this.feildMap.get(key) || key] =
                    //   properties[key];
                    // }
                  });
                }
              } catch(err) {
                geoData = null;
              } finally {
                if (geoData) {
                  geoJsonData.push(...geoData.features)
                }
              }
            }
          }
            allGeojson.push(...geoJsonData);
            responseLoaded++
            res(allGeojson)
        }
      })
      .catch((e) => {
        console.error(e);
      }).finally(() => {
        this.kmlPreparation = 0;
      })

    }).then((response: any) => {
      this.geoJsonData = response;
          if (response?.length) {
            this.showMap = false;
            this.kmlPreparation  = 0;
            // setTimeout(() => (this.showMap = true), 500);
          }
    }).catch().finally(() => {
      setTimeout(() => this.geoJsonLoading = 0);
    });
  }

  downloadGeoJson() {
    this.generateFile(this.geoJsonData);
  }

  generateFile(features: any) {
    const geoJson = {
      type: "FeatureCollection",
      features: features,
    };
    const blob = new Blob([JSON.stringify(geoJson, null, 2)], {
      type: "application/geojson;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `${moment().format("yyyyMMDD")}_Munichre.geojson`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link); // Required for FF
    link.click(); // This will download the data file named "my_data.csv".
    document.body.removeChild(link);
  }

  fetchKML(fileDetail: any): Promise<any> {
    return new Promise(async (resolve) => {
      try {
        if (fileDetail.coordinates) {
          const geoJson = this.geoMapper.stringToGeojson(fileDetail.coordinates);
          resolve({ response: geoJson, request: fileDetail, type: 'geojson' });
          return;
        }
        if (fileDetail?.file_name) {
          const url = this.projectContext === 'munichre'
            ? this.kmlUrl + fileDetail.file_name
            : this.kmlUrl + fileDetail.file_name + this.kmlUrlSuffix;
          let textResponse: string | null = null;
          if (this.projectContext === 'munichre') {
            const blob = await this.core.fetchAzureBlob(url);
            textResponse = await blob.text();
          } else {
            const response = await fetch(url);
            textResponse = await response.text();
          }
          if (textResponse) {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(textResponse, 'text/xml');
            resolve({ response: xmlDoc, request: fileDetail });
          } else {
            resolve({ response: null, request: fileDetail });
          }
          return;
        }
        resolve({ request: fileDetail });
      } catch (err) {
        this.notAvaliable.push(`${fileDetail?.kml_id}${fileDetail?.file_name}`);
        resolve({ request: fileDetail });
      }
    });
  }

  generateLkpLable(surveyData: any): any {
    const sData: any = {};
    const districtsIds: any[] = [];
    for (let indx = 0; indx < surveyData.length; indx++) {
      const surData = surveyData[indx];
      if (!districtsIds.includes(surData[this.districtField])) {
        districtsIds.push(surData[this.districtField]);
      }
      const data: any = {};
      for (let key in surData) {
        if (this.feildTypeMap.get(key)) {
          switch (this.feildTypeMap.get(key)) {
            case "lkp_state":
              {
                data[this.feildMap.get(key) || key] =
                  this.stateMap.get(surData[key]) || surData[key];
              }
              break;

            case "lkp_district":
              {
                data[this.feildMap.get(key) || key] =
                  this.districtMap.get(surData[key]) || surData[key];
              }
              break;

            case "lkp_block":
              {
                data[this.feildMap.get(key) || key] =
                  this.blockMap.get(surData[key]) || surData[key];
              }
              break;

            case "lkp_village":
              {
                data[this.feildMap.get(key) || key] =
                  this.villageMap.get(surData[key]) || surData[key];
              }
              break;

            case "lkp_crop":
              {
                data[this.feildMap.get(key) || key] =
                  this.cropMap.get(surData[key]) ||
                  this.cropMap.get(0 + surData[key]) ||
                  surData[key];
              }
              break;

            case "lkp_tehsil":
              {
                data[this.feildMap.get(key) || key] =
                  this.tehsilMap.get(surData[key]) || surData[key];
              }
              break;

            case "lkp_grampanchayat":
              {
                data[this.feildMap.get(key) || key] =
                  this.grampanchayatMap.get(surData[key]) || surData[key];
              }
              break;

            case "lkp_season":
              {
                data[this.feildMap.get(key) || key] =
                  this.seasonMap.get(surData[key]) || surData[key];
              }
              break;
            case "lkp_year":
              {
                data[this.feildMap.get(key) || key] =
                  this.yearMap.get(surData[key]) || surData[key];
              }
              break;
            case "lkp_notified_unit":
              {
                data[this.feildMap.get(key) || key] =
                  this.notifiedUnitMap.get(surData[key]) || surData[key];
              }
              break;
            case "approved_reject":
              {
                data[this.feildMap.get(key) || key] =
                 this.approvedStatusFlag[surData[key]] || surData[key];
              }
              break;
            case "approved_reject_by":
              {
                data[this.feildMap.get(key) || key] =
                 this.userIdMap.get(surData[key]) || surData[key];
              }
              break;
            case "user_id":
              {
                data[this.feildMap.get(key) || key] =
                this.userIdMap.get(surData[key]) || surData[key];
              }
              break;
            default:
              break;
          }
        } else {
          data[this.feildMap.get(key) || key] = surData[key];
        }
        if (key?.startsWith('field_') || [
          "client_id",
          "client_name",
          "agency_id",
          "state_id",
          "dist_id",
          "tehsil_id",
          "block_id",
          "gp_id",
          "village_id",
          "name",
          "ip_address"
      ].includes(key)) {
          delete data[key]
        }
      }
      this.dataDownloadStatus[data.id] = false
      sData[data.data_id] = data;
    }
    this.districtIds = districtsIds;
    return sData;
  }

  ranges = {
    Today: [moment(), moment()],
    Yesterday: [moment().subtract(1, "days"), moment().subtract(1, "days")],
    "Last 7 Days": [moment().subtract(6, "days"), moment()],
    "Last 15 Days": [moment().subtract(14, "days"), moment()],
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

  setDefaultLocation() {
    if (this.userDetails?.unit_id) {
      this.singleClient = this.userDetails?.unit_id;
      this.selectedClient = this.projectContext === 'munichre' ? this.clientData.filter(d => d.UNIT_ID == this.singleClient) : ['2000'];
    }
    if (['7'].includes(this.userDetails?.user_role)) {
      this.selectedAgency = [this.userDetails.agency_id || '0'];
    }
    // const location = this.userService.getLocation();
    // if (location?.states) {
    //   this.singleState = this.states?.[0]?.state_id;
    //   this.onSingleStateChange(this.singleState);
    //   this.onStateChange(this.selectedState);
    //   if (location?.districts) {
    //     this.selectedDistrict = this.allDistricts;
    //     this.onDistrictChange(this.selectedDistrict);
    //   }
    // }
  }

  getSavedData(isAll?: any) {
    this.clearMapDetail();
    this.loading++;
    this.isLoadedData = false;
    if (isAll) {
      // this.showMap = true
    }
    const request = {
      purpose: "kml_1",
      states: isAll ? this.states?.map(d => d.state_id) : [this.singleState],
      district: isAll ? this.allDistricts.map(d => d.district_id) : this.selectedDistrict?.map(d => d.district_id),
      blocks: [],
      crops: [],
      client: this.projectContext === 'munichre' ? (this.userDetails?.unit_id ? [this.userDetails.unit_id] : this.selectedClient.map((d) => d.UNIT_ID)) : ['2000'],
      start_date: this.selectedFromDate?.startDate?.format("yyyy-MM-DD"),
      end_date: this.selectedFromDate?.endDate?.format("yyyy-MM-DD"),
      form_id: this.selectedForm,
    };
    this.core.post(request).then((response: any) => {
      if (response?.status == 1) {
        this.geoJsonData = response.data.map((d: any) => JSON.parse(d.kml_data.replaceAll("\\", "")))
        this.kmls = response.data;
      }
    }).catch(err => {
      console.error(err);
    }).finally(() => {
      this.loading--;
      // this.showMap = true 
      if (isAll) {
        this.isLoadedData = true;
      }
    });
  }

  getAgencyData() {
    if (this.singleClient && this.selectedYear && this.selectedSeason) {
      const request = {"purpose":"get_all","client_id":this.singleClient, 'year': this.selectedYear, 'season': this.selectedSeason};
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

  async loadAgencyLocation(agency: any) {

    const request = {
      client: this.singleClient, agency, year: this.selectedYear, season: this.selectedSeason
    }
    this.isStateLoading++
    const location: any = await this.filter.getAgencyWiseLocation(request, this.userDetails);
    this.isStateLoading--;
    this.clientStates = location.states || [];
    this.clientDistricts = location.districts;
    this.clientTehsils = location.tehsils;

    this.states = this.clientStates;

  }

  onYearSelect(env: any) {
    if (!['7'].includes(this.userDetails?.user_role)) {
      this.selectedAgency = [];
      this.agencyData = [];
  }
  this.singleState = '';
  this.districts = [];
  this.tehsilOptions = [];
  this.blocks = [];
  this.selectedDistrict = [];
  this.selectedBlock = [];
  this.selectedTehsil = [];
  this.getLocationCropData();
  if (!['7'].includes(this.userDetails?.user_role) && this.singleClient && this.selectedYear && this.selectedSeason) {
    this.getAgencyData();
  }
  if (['7'].includes(this.userDetails?.user_role) && this.selectedYear && this.selectedSeason) {
    this.onAgencyChange(this.selectedAgency)
  }
  }

  onSeasonSelect(env: any) {
    if (!['7'].includes(this.userDetails?.user_role)) {
        this.selectedAgency = [];
        this.agencyData = [];
    }
    this.singleState = '';
    this.districts = [];
    this.tehsilOptions = [];
    this.blocks = [];
    this.selectedTehsil = [];
    this.selectedDistrict = [];
    this.selectedBlock = [];
    this.getLocationCropData();
    if (!['7'].includes(this.userDetails?.user_role) && this.singleClient && this.selectedYear && this.selectedSeason) {
      this.getAgencyData();
    }
    if (['7'].includes(this.userDetails?.user_role) && this.selectedYear && this.selectedSeason) {
      this.onAgencyChange(this.selectedAgency)
    }
  }

  onAgencyChange(event: any) {
    this.singleState = '';
    this.districts = [];
    this.tehsilOptions = [];
    this.blocks = [];
    this.selectedDistrict = [];
    this.selectedBlock = [];
    this.selectedTehsil = [];
    this.clientStates = [];
    this.clientDistricts = [];
    if (event) {
      this.loadAgencyLocation(event)
    }
    this.getLocationCropData();
    // this.resetData();
  }

  downloadStatus(){
    const sheetName = 'kml_status'
    const textData = Object.values(this.surveyTextData).map((data: any) => [data.id, data.data_id, data.case_ID, data.user_id, `${data.first_name} ${data.last_name}`, this.dataDownloadStatus[data.id] ? 'YES': 'NO']);
    textData.unshift(['AI ID', 'DATA ID', 'CASE ID', 'USER ID', 'USER NAME', 'AVALIABLE STATUS']);
    const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(textData);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(
      wb,
      `${moment(new Date()).format("YYYYMMDD")}_${sheetName}.xlsx`
    );
  }

  get deactiveField() {
    return this.selectedYear && this.selectedSeason && this.selectedAgency?.length;
  }
}
