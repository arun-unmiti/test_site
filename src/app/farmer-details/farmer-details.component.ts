import { Component, OnInit, ViewChild, Input } from "@angular/core";
import { LightGallery } from "lightgallery/lightgallery";
import lgZoom from 'lightgallery/plugins/zoom';
import { BeforeSlideDetail } from 'lightgallery/lg-events';
import { OwlOptions } from "ngx-owl-carousel-o";
import { CoreService } from "../utilities/core.service";
import { FilterService } from "../utilities/filter.service";
import * as moment from "moment";
// import { Lookup } from "../chm-dashboard/lookup";
import { FeatureToggleService } from '../shared/services/feature-toggle.service';
import { environment, ProjectContext } from '../../environments/environment';
import { DomSanitizer } from '@angular/platform-browser';
import { InsightsService } from "../utilities/insights.service";

@Component({
  selector: "app-farmer-details",
  templateUrl: "./farmer-details.component.html",
  styleUrls: ["./farmer-details.component.css"],
})
export class FarmerDetailsComponent implements OnInit {
  height = "605px";
  heightKLM = "555px";
  active = 1;

  private lightGallery!: LightGallery;

  @ViewChild("map") leafletMap: any;
  @ViewChild("kmlMap") kmlMap: any;
  locationData: any[] = [];
  @Input() surveyData: any[] = [];
  @Input() surveyLocation: any[] = [];
  @Input() surveyId: any;

  tabs: any[] = [];

  customOptions: OwlOptions = {
    loop: true,
    mouseDrag: false,
    touchDrag: false,
    pullDrag: false,
    dots: false,
    navSpeed: 600,
    navText: [
      "<div class='nav-button owl-prev'>‹</div>",
      "<div class='nav-button owl-next'>›</div>",
    ],
    responsive: {
      0: {
        items: 1,
      },
      400: {
        items: 1,
      },
      760: {
        items: 4,
      },
      1000: {
        items: 6,
      },
    },
    nav: true,
  };
  showMap: boolean = true;
  selectedFarmer: any = {};
  fields: any[] = [];
  basicTab: any;
  mediaTab: any;
  tablesTab: any[] = [];
  kmlFileInfo: any[] = [];
  lat: any;
  lng: any;
  imageFiles: any[] = [];
  imgUrl:any = "";
  imgUrlSuffix:any  = "";
  settings = {
    counter: false,
    plugins: [lgZoom]
  };
  loading: any = 0;
  states: any[] =[];
  districts: any[] =[];
  tehsils: any[] =[];
  crops: any[] =[];
  stateMap: Map<any,any> = new Map<any, any>();
  districtMap: Map<any,any> = new Map<any, any>();
  tehsilMap: Map<any,any> = new Map<any, any>();
  cropsMap: Map<any,any> = new Map<any, any>();
  blockMap: Map<any,any> = new Map<any, any>();
  fieldsMap: Map<any,any> = new Map<any, any>();
  executeDetail: any;
  isAllImgMissed: boolean = false;
  projectContext: ProjectContext;
  assetsFolder: string;

  // tempLookup: Lookup = new Lookup();

  // images = [944, 1011, 984].map((n) => `https://picsum.photos/id/${n}/900/500`);
  constructor(private core: CoreService, private filter: FilterService, private featureToggle: FeatureToggleService, private sanitizer: DomSanitizer, private insightsService: InsightsService) {
    this.projectContext = this.featureToggle.getContext() as ProjectContext;
    this.assetsFolder = environment.projectConfigs[this.projectContext].assetsFolder;

    const config = this.featureToggle.getConfig();
    this.imgUrl = config.BASEKMLPREFIX;
    this.imgUrlSuffix = config.BASEKMLSUFFIX;
  }

  ngOnInit(): void {
    this.locationData = this.surveyLocation;
    this.getSurveyFields();
    this.getLocationsData();
    // this.getTempLookup();
  }

  // getTempLookup() {
  //   this.states = this.tempLookup.states;
  //   this.districts = this.tempLookup.district;
  //   this.tehsils = this.tempLookup.tehsil;
  //   this.crops = this.tempLookup.crops;
  //   this.stateMap = this.tempLookup.stateMap;
  //   this.districtMap = this.tempLookup.districtMap;
  //   this.tehsilMap = this.tempLookup.tehsilMap;
  //   this.blockMap = this.tempLookup.blockMap;
  //   this.cropsMap = this.tempLookup.cropsMap;
  // }

  getLocationsData() {
    this.states = this.core.clone(this.filter.states);
    this.districts = this.core.clone(this.filter.districts);
    this.tehsils = this.core.clone(this.filter.tehsils);
    this.crops = this.core.clone(this.filter.crops)

    this.states.forEach(d => this.stateMap.set(d.state_id, d.state_name));
    this.districts.forEach(d => this.districtMap.set(d.district_id, d.district_name));
    this.tehsils.forEach(d => this.tehsilMap.set(d.tehsil_id, d.tehsil_name));
    this.filter.crops.forEach(d => this.cropsMap.set(d.crop_code, d.crop_name));
    this.filter.blocks.forEach(d => this.blockMap.set(d.block_id, d.block_name));
  }

  onBeforeSlide = (detail: BeforeSlideDetail): void => {
    const { index, prevIndex } = detail;
  };

  onInit = (detail: any): void => {
    this.lightGallery = detail.instance;
  };

  getSurveyFields() {
    if (this.surveyId) {
      const request = { purpose: "get_surveyfields", survey_id: this.surveyId };
      this.core.post(request).then((response: any) => {
        if (response?.status == 1) {
          this.fields = response.fields || [];
          this.fields.forEach(d => this.fieldsMap.set(`field_${d.field_id}`, d.label));
          this.tabs = this.fields
            .filter((d: any) => d.type == "tab")
            .map((d: any) => {
              return {
                type: d.type,
                label: d.label,
                field_id: d.field_id,
                childern: this.fields.filter(
                  (e: any) => e.parent_id == d.field_id
                ),
              };
            });
          this.basicTab = this.tabs.find(
            (d: any) => d.label == "Basic details"
          );
          this.mediaTab = this.tabs.find((d: any) => d.label == "Media Upload");
          this.tablesTab = this.tabs.filter(
            (d: any) => !["Basic details", "Media Upload"].includes(d.label)
          );
        }
      });
    }
  }

  getData(field: any) {
    if (this.selectedFarmer?.id) {
      return this.selectedFarmer["field_" + field.field_id] || 'NA';
    }
    return "NA";
  }

  refreshMap() {
    this.showMap = false;
    setTimeout(() => {
      this.locationData = this.surveyLocation;
      this.showMap = true;
    });
  }

  clearDetail() {
    this.imageFiles = [];
    this.kmlFileInfo = [];
    this.tabs = [];
    this.basicTab = null;
    this.tablesTab = [];
    this.selectedFarmer = {};
    this.executeDetail = null;
    this.isAllImgMissed = false;
    this.refreshMap();
  }


  generateKML() {
    this.leafletMap.generateKML();
  }

  async onPointClick(env: any) {
    this.selectedFarmer = {};
    this.kmlFileInfo = [];
    if (env) {
      this.selectedFarmer =
        this.core.clone(this.surveyData.find((d: any) => d.data_id == env.data_id) || {});
      this.lat = parseFloat(this.selectedFarmer.lat);
      this.lng = parseFloat(this.selectedFarmer.lng);
      await this.generateRowData();
      this.getKMLFiles();
      this.getImageFiles();
      this.getExecuteDetail()
    }
  }

  getKMLFiles() {
    const kmlRequest = {
      purpose: "get_files",
      survey_id: this.surveyId,
      type: "kml",
      data_id: this.selectedFarmer.data_id,
    };
    this.core
      .post(kmlRequest)
      .then((response: any) => {
        if (response?.status == 1) {
          this.kmlFileInfo = response.files || [];
          if (this.kmlMap) {
            this.kmlMap.resetMap(this.kmlFileInfo);
          }
        }
        setTimeout(() => {
          if (this.kmlMap) {
            this.kmlMap.map?.setView(
              [
                parseFloat(this.selectedFarmer.lat),
                parseFloat(this.selectedFarmer.lng),
              ],
              18
            );
          }
        }, 2000);
      })
      .catch((err) => {
          this.insightsService.logException(err);
          this.core.toast('warn', err)
        })
      .finally();
  }
  
  getImageFiles() {
    const isMunichRe = this.projectContext === 'munichre';
    const children = this.mediaTab.children || this.mediaTab.childern || []; // Handle possible typo
    const imageRequests = children.filter((d: any) => d.type === "file" && d.subtype === "image").map((d: any) =>
        this.core.post({ purpose: "get_files", survey_id: this.surveyId, type: "image", data_id: this.selectedFarmer.data_id, field_id: d.field_id })
      );
    this.isAllImgMissed = false;
    Promise.all(imageRequests).then((responses: any[]) => {
        if (!responses?.length) {
          return;
        }
        const allSuccessful = responses.every((d: any) => d.status === 1);
        if (!allSuccessful) {
          return;
        }
        const files = responses.map((d: any) => d.files).reduce((acc, curr) => acc.concat(curr), []);
        if (isMunichRe) {
          const imagePromises = files.map((file: any) =>
            this.core.fetchAzureBlob(this.imgUrl + file.file_name).then(blob => ({ ...file, safeUrl: this.sanitizer.bypassSecurityTrustUrl(URL.createObjectURL(blob)) }))
          );
          Promise.all(imagePromises).then((processedImages: any[]) => {
            this.imageFiles = processedImages;
          });
        } else {
          this.imageFiles = files.map((file: any) => ({ ...file, file_url: this.imgUrl + file.file_name }));
        }
      })
      .catch(err => {
        this.insightsService.logException(err);
        if (!isMunichRe) {
          this.core.toast('warn', err);
        }
      });
  }

  getExecuteDetail() {
    const request = {purpose: 'get_user_details', user_id: this.selectedFarmer.user_id};
    this.core.post('users',request).then((response: any) => {
      if (response?.status == 1) {
        this.executeDetail = response.user_details;
      }
    }).catch(err => {
        this.insightsService.logException(err);
        this.core.toast('warn', err)
      }).finally()
  }

  
  async getGrampanchayatMap() {
    const blockField = this.fields.find((d: any) => d.type == 'lkp_block')?.field_id;
    const panchayatMap = new Map();
    const existingBlockIds = this.filter.grampanchayats.map((d: any) => d.block_id);
    const blockIds = [this.selectedFarmer].filter((d: any) => d[`field_${blockField}`] && !existingBlockIds.includes(d[`field_${blockField}`])).map((d: any) => d[`field_${blockField}`]);
    if (blockIds?.length) {
      await this.filter.getGrampanchayatData(blockIds);
    }
    this.filter.grampanchayats.forEach(d => panchayatMap.set(d.grampanchayat_id, d.grampanchayat_name));
    return panchayatMap;
  }


  async getVillageMap() {
    const panchayatField = this.fields.find((d: any) => d.type == 'lkp_grampanchayat')?.field_id;
    const villageMap = new Map();
    const existingPanchayatIds = this.filter.villages.map((d: any) => d.grampanchayat_id);
    const panchayatIds = [this.selectedFarmer].filter((d: any) => d[`field_${panchayatField}`] && !existingPanchayatIds.includes(d[`field_${panchayatField}`])).map((d: any) => d[`field_${panchayatField}`]);
    if (panchayatIds?.length) {
      await this.filter.getVillageData(panchayatIds);
    }
    this.filter.villages.forEach(d => villageMap.set(d.village_id, d.village_name));
    return villageMap;
  }

  async generateRowData() {
    this.loading++
    const panchayatMap = await this.getGrampanchayatMap();
    const villageMap = await this.getVillageMap();
    this.loading--
      this.fields.forEach((field: any) => {
        const fieldCol = `field_${field.field_id}`;
        switch (field.type) {
          case "lkp_state":
            {
              this.selectedFarmer[fieldCol] = this.stateMap.get(this.selectedFarmer[fieldCol]);
            }
            break;

          case "lkp_district":
            {
              this.selectedFarmer[fieldCol] = this.districtMap.get(this.selectedFarmer[fieldCol]);;
            }
            break;

          case "lkp_block":
            {
              this.selectedFarmer[fieldCol] = this.blockMap.get(this.selectedFarmer[fieldCol]);;
            }
            break;

          case "lkp_village":
            {
              this.selectedFarmer[fieldCol] = villageMap.get(this.selectedFarmer[fieldCol]);
            }
            break;

          case "lkp_crop":
            {
              this.selectedFarmer[fieldCol] = this.cropsMap.get(this.selectedFarmer[fieldCol]);
            }
            break;

          case "lkp_tehsil":
            {
              this.selectedFarmer[fieldCol] = this.tehsilMap.get(this.selectedFarmer[fieldCol]);
            }
            break;

          case "lkp_grampanchayat":
            {
              this.selectedFarmer[fieldCol] = panchayatMap.get(this.selectedFarmer[fieldCol]) || this.selectedFarmer[fieldCol];
            }
            break;
        }
      });
      

  }

  onNoImage(env: any, data: any) {
    data.missedImage = true;
    this.isAllImgMissed = this.imageFiles.every((d: any) => d.missedImage);
  }

  downloadFile() {
   if(this.kmlMap) {
    const data = this.kmlMap.generateKML();
    const cropData: any = {}
    this.fields.forEach(d => cropData[this.fieldsMap.get(`field_${d.field_id}`)] = this.selectedFarmer[`field_${d.field_id}`]);
    if (data?.geoJson?.features) {
      data.geoJson.features.forEach((d: any) => d.properties = Object.assign(d.properties, cropData))
      this.downloadTextFile('Munich_Re', JSON.stringify(data.geoJson, null, 4));
    }
   }
  }

  downloadTextFile(name: any, data: any) {
    const timeStamp = moment().format('YYYYMMDD');
    const fileex = '.geojson';
    const link = document.createElement("a");
    link.setAttribute("href", 'data:text/plain;charset=utf-8,' + encodeURIComponent(data));
    link.setAttribute("download", `${timeStamp}_${name}${fileex}`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link); 
    link.click(); 
    document.body.removeChild(link);
  };
}
