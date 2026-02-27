import { Location } from "@angular/common";
import {
  Component,
  OnInit,
  Input,
  EventEmitter,
  Output,
  Inject,
  ElementRef,
  ViewChild,
} from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { CoreService } from "../utilities/core.service";
import { FilterService } from "../utilities/filter.service";
import lgZoom from "lightgallery/plugins/zoom";
import { BeforeSlideDetail } from "lightgallery/lg-events";
import Swal from "sweetalert2";
import { UserDetailService } from "../auth/user-detail.service";
import { jsPDF } from "jspdf";
import domtoimage from "dom-to-image";
import { NgxImageCompressService } from "ngx-image-compress";
import { GeojsonMapperService } from "../utilities/geojson-mapper.service";
import * as moment from "moment";
import { FeatureToggleService } from '../shared/services/feature-toggle.service';
import { environment, ProjectContext } from "../../environments/environment";
import { DomSanitizer, SafeUrl, SafeResourceUrl } from "@angular/platform-browser";
import { SecurityContext } from '@angular/core';

declare const toGeoJSON: any;

@Component({
  selector: "app-chm-view-details",
  templateUrl: "./chm-view-details.component.html",
  styleUrls: ["./chm-view-details.component.css"],
})
export class ChmViewDetailsComponent implements OnInit {
  private readonly MAX_FILE_SIZE = 1024 * 1024 * 5;
  missedImage: any = '';
  active = 1;
  loading = 0;
  data: any;
  parentData: any;
  fields: any[] = [];
  parentFields: any[] = [];
  tabs: any[] = [];
  parentTabs: any[] = [];
  showMedia = true;
  showSignature = true;
  mediaField: any;
  signatureField: any;
  typeFields: any[] = [];
  kml_files: any = [];
  img_files: any = [];
  @Input() survey_id: any;
  @Input() data_id: any;
  @Output() emitAction: EventEmitter<any> = new EventEmitter();
  geoJsonData: any;
  crop_column: any;
  iu_column: any;
  imgUrl:any = "";
  imgUrlSuffix:any  = "";
  farmerName: String = "";
  revisitData: any;
  loader = 0;
  sLoader = 0;
  imageLoader = 0;
  isCropLoading = 0;
  stateMap: Map<any, any> = new Map();
  stateCodeMap: Map<any, any> = new Map();
  districtMap: Map<any, any> = new Map();
  tehsilMap: Map<any, any> = new Map();
  blockMap: Map<any, any> = new Map();
  grampanchayatMap: Map<any, any> = new Map();
  villageMap: Map<any, any> = new Map();
  cropMap: Map<any, any> = new Map();
  cropCodeMap: Map<any, any> = new Map();
  seasonMap: Map<any, any> = new Map();
  seasonCodeMap: Map<any, any> = new Map();
  yearMap: Map<any, any> = new Map();
  yearCodeMap: Map<any, any> = new Map();
  notifiedUnitMap: Map<any, any> = new Map();
  soilTypeMap: Map<any, any> = new Map();
  chmDom: any;
  galleryUrl: any;
  isPdf = false;
  @ViewChild("pdfBox") pdfBox: any;
  ifscsMap: Map<any, any> = new Map();
  isEditkML = false;
  isEditable = false;
  lkpsIds: any;
  cropLkpIds: any[] = [];
  parentLkpsIds: any;
  showMap = true;
  imageURLs: any[] = [];
  parentImageURLs: any[] = [];
  deletedImages: any[] = [];
  fieldImages: any;
  parentFieldImages: any;
  gallery: any;
  showApproval = false;
  surveyIntimationField: any;
  districtField: any;
  districtIds: any[] = [];
  @Input() plannedCropData: any[] = [];
  user: any;
  @Input() isChild = false;
  @ViewChild("galleryModel") galleryModel: any;
  surveyIntimationTextData = {
    static: "",
    year: "",
    state: "",
    season: "",
    freeText: "",
  };
  typeAccept = "image/jpeg, application/pdf";
  isPrinting = 0;
  mapImgSrc: any = "";
  printingMsg: any = "";
  showMapContainer = false;
  updating = false;
  imageFields: any[] = [];
  optionField: any[] = [];
  intimationNoPrefix: any = "";
  minDate = new Date("2022-01-01").getTime();
  maxDate = new Date("2028-12-31").getTime();
  kmlUrl:any = "";
  surveyDates: any = {
    2: "field_527",
    3: "field_582",
    4: "field_709",
    7: "field_768",
  };
  csrfTokenName: any;
  csrfToken: any;
  projectContext: ProjectContext;
  assetsFolder: string;
  imageBlobs: { [id: string]: Blob } = {};
  imageBlobUrls: { [id: string]: SafeUrl | SafeResourceUrl } = {};

  constructor(
    private core: CoreService,
    private activeRoute: ActivatedRoute,
    private filter: FilterService,
    private modalService: NgbModal,
    private location: Location,
    private userDetails: UserDetailService,
    private imageCompress: NgxImageCompressService,
    @Inject(ElementRef) private element: ElementRef,
    private geoMapper: GeojsonMapperService,
    private userService: UserDetailService,
    private featureToggle: FeatureToggleService,
    private sanitizer: DomSanitizer
  ) {
    this.projectContext = this.featureToggle.getContext() as ProjectContext;
    this.assetsFolder = environment.projectConfigs[this.projectContext].assetsFolder;
    this.missedImage = `${this.assetsFolder}/images/missed_image.png`;
  }

  settings = {
    counter: false,
    plugins: [lgZoom],
  };
  onBeforeSlide = (detail: BeforeSlideDetail): void => {
    const { index, prevIndex } = detail;
    if (this.gallery) {
      this.gallery.LG.closeGallery();
      this.gallery = null;
    }
  };

  ngOnInit(): void {
    const config = this.featureToggle.getConfig();
    this.kmlUrl = config.BASEKMLPREFIX;
    this.imgUrl = config.BASEKMLPREFIX;
    this.imgUrlSuffix  = config.BASEKMLSUFFIX;

    this.user = this.userDetails.getUserDetail();
    this.setCropColumn();
    this.getFilterData();
    this.chmDom = this.element.nativeElement;
    if (this.survey_id == 1 || this.survey_id == 4) {
      this.districtField = "field_502";
      this.mediaField = 695;
    } else if (this.survey_id == 2) {
      this.districtField = "field_529";
      this.mediaField = 702;
      this.signatureField = 783;
    } else if (this.survey_id == 3 || this.survey_id == 7) {
      this.signatureField = 743;
      this.mediaField = 630;
      this.districtField = "field_586";
    }
    this.csrfTokenName = this.userService.getcsrfTokenName();
    this.csrfToken = this.userService.getcsrfToken();
  }

  setCropColumn() {
    if (this.survey_id == 1) {
      this.crop_column = "field_509";
      this.iu_column = "field_505";
    } else if (this.survey_id == 2) {
      this.crop_column = "field_539";
      this.iu_column = "field_532";
    } else if (this.survey_id == 3) {
      this.crop_column = "field_593";
      this.iu_column = "field_589";
    }
  }

  getFilterData() {
    this.loader++;
    if (this.filter.isvillageFetched) {
      this.getRouterParam();
    } else {
      this.filter.fetchedVillageData.subscribe(() => {
        this.getRouterParam();
      });
    }
  }

  async getRouterParam() {
    this.loader--;
    // await this.getPlannedCropData();
    this.setInputData();

    if (this.survey_id && this.data_id && this.isChild) {
      this.getSurveyData(this.survey_id, this.data_id);
    }

    if (!this.isChild) {
      this.activeRoute.paramMap.subscribe((param: any) => {
        this.survey_id = param.get("surveyId");
        this.data_id = param.get("id");

        if (param.get("id") && param.get("surveyId")) {
          this.getSurveyData(param.get("surveyId"), param.get("id"));
        }
      });
    }
  }

  async getPlannedCropData() {
    this.loader++;
    const request = {
      purpose: "lkp_chm_crop",
      state: [],
      district: [],
      tehsil: [],
      notifiedUnit: [],
      years: [],
      seasons: [],
    };
    await this.core
      .data_post(request)
      .then((response: any) => {
        if (response?.status == 1) {
          this.plannedCropData = response?.lkp_Karnatakacrops || [];
        }
      })
      .catch((err) => console.error(err))
      .finally(() => this.loader--);
  }

  setInputData() {
    // lkp_state mapping
    for (let indx = 0; indx < this.filter.states.length; indx++) {
      const item = this.filter.states[indx];
      this.stateMap.set(item.state_id, item.state_name);
      this.stateCodeMap.set(item.state_id, item.code);
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

    // lkp_crop mapping
    for (let indx = 0; indx < this.filter.crops.length; indx++) {
      const item = this.filter.crops[indx];
      this.cropMap.set(item.crop_code, item.crop_name);
      this.cropCodeMap.set(+item.crop_code, item.id);
    }

    // lkp_season mapping
    for (let indx = 0; indx < this.filter.seasons.length; indx++) {
      const item = this.filter.seasons[indx];
      this.seasonMap.set(item.id, item.season_name);
      this.seasonCodeMap.set(item.id, item.season_code);
    }

    // lkp_year mapping
    for (let indx = 0; indx < this.filter.years.length; indx++) {
      const item = this.filter.years[indx];
      this.yearMap.set(item.id, item.year);
      this.yearCodeMap.set(item.id, item.year_code);
    }

    // lkp_notifieldUnit mapping
    for (let indx = 0; indx < this.filter.notifiedUnits.length; indx++) {
      const item = this.filter.notifiedUnits[indx];
      this.notifiedUnitMap.set(item.notified_id, item.notified_unit_name);
    }
    // lkp_soil_type mapping
    for (let indx = 0; indx < this.filter.soilTypes.length; indx++) {
      const item = this.filter.soilTypes[indx];
      this.soilTypeMap.set(item.SOIL_TYPE_ID, item.SOIL_TYPE_DESC);
    }
    // lkp_ifsc mapping
    for (let indx = 0; indx < this.filter.ifscs.length; indx++) {
      const item = this.filter.ifscs[indx];
      this.ifscsMap.set(item.IFSC_CODE, item.IFSC_CODE);
    }
  }

  async getSurveyData(surveyId: any, data_id: any) {
    this.parentData = [];
    this.parentFields = [];
    this.parentTabs = [];
    this.fields = [];
    this.data = null;
    this.tabs = [];
    this.imageURLs = [];
    this.fieldImages = [];
    this.showMap = false;
    const requests = [
      // { purpose: "get_surveyfields_all", survey_id: surveyId },
      { purpose: "get_surveyfields", survey_id: surveyId },
      {
        purpose: "get_surveydata_details",
        survey_id: surveyId,
        data_id: data_id,
      },
    ].map((d) => this.core.data_post(d));
    this.sLoader++;
    // this.loader++;
    Promise.all(requests)
      .then(async (responses: any[]) => {
        this.showMap = true;
        this.farmerName =
          responses[1].surveydata["field_507"] ||
          responses[1].surveydata["field_536"] ||
          responses[1].surveydata["field_597"];
        const districtId = responses[1].surveydata[this.districtField];
        this.districtIds = [districtId];
        if (responses[1].surveydata.case_ID) {
          this.revisitData = responses[1].surveydata;
        }
        if (responses?.every((d) => d.status == 1)) {
          this.fields =
            responses?.[0]?.fields ||
            responses?.[0]?.["fields" + surveyId] ||
            [];
          for (let i = 0; i < this.fields.length; i++) {
            const field = this.fields[i];
            if (
              [570, 577, 578, 579, 558, 557, 556].includes(+field.field_id) ||
              [555].includes(+field.parent_id)
            ) {
              field.required = 1;
              if (![570, 577, 578, 579].includes(+field.field_id)) {
                field.requiredBankDetails = true;
              }
            }
            /**
             * re editable basic details in CLS
             */
            // if ([697].includes(+field.parent_id)) {
            //   field.noEditable = true
            // }
            if ([953, 526, 707, 528, 529, 530].includes(+field.field_id)) {
              field.noEditable = true;
            }
          }
          if (this.survey_id == 4) {
            this.parentFields = responses?.[0]?.["fields" + "1"] || [];
          }
          const imageFields = this.fields
            .filter(
              (d) =>
                this.fields.find((e) => e.field_id == d.parent_id)?.type ==
                "tab"
            )
            .filter(
              (field) => field.type == "file" && field.subtype == "image"
            );
          this.imageFields = imageFields;
          // Loading images for survey
          if (!this.imageURLs?.length) {
            this.getImagesData(this.imageFields);
          }
          this.data = responses?.[1]?.surveydata;
          this.generateParentFieldData();
          this.lkpsIds = {};
          this.cropLkpIds = [];
          for (let i = 0; i < this.fields.length; i++) {
            const field = this.fields[i];
            if (field.type.startsWith("lkp_")) {
              this.lkpsIds[field.type] = field.field_id;
              if (field.type == "lkp_crop") {
                this.cropLkpIds.push(field.field_id);
              }
            }
          }
          if (this.fields?.length) {
            this.fields.sort((a: any, b: any) => a.slno - b.slno);
            const tabFields = this.fields.filter((d) => d.type == "tab");
            if (!tabFields?.length) {
              tabFields.push({ type: "tab", field_id: "dummy" });
              for (let i = 0; i < this.fields.length; i++) {
                const field = this.fields[i];
                field.parent_id = field.parent_id ? field.parent_id : "dummy";
              }
            }
            const optionFields: any[] = [];
            const tabIds = tabFields.map((d) => d.field_id);
            let isCropOptionsFetched = false;
            for (let i = 0; i < this.fields.length; i++) {
              const field = this.fields[i];
              field.required = field.required == 1 ? true : false;
              if (["select", "radio-group"].includes(field.type)) {
                field.options = []; // await this.getFormFieldMultipleData(field.field_id);
                field.optionMap = {};
                optionFields.push(field);
              } else if (field.type.startsWith("lkp_") || field.type === "product_crop") {
                switch (field.type) {
                  case "lkp_state":
                    {
                      field.optionMap = {};
                      field.options = [...this.stateMap].map((d) => {
                        field.optionMap[d[0]] = d[1];
                        return { label: d[1], value: d[0] };
                      });
                    }
                    break;
                  case "lkp_district":
                    {
                      field.options = [];
                      field.optionMap = {};
                      for (
                        let indx = 0;
                        indx < this.filter.districts.length;
                        indx++
                      ) {
                        const item = this.filter.districts[indx];
                        if (
                          item.state_id ==
                          this.data["field_" + this.lkpsIds["lkp_state"]]
                        ) {
                          field.options.push({
                            value: item.district_id,
                            label: item.district_name,
                          });
                          field.optionMap[item.district_id] =
                            item.district_name;
                        }
                      }
                    }
                    break;
                  case "lkp_block":
                    {
                      field.options = [];
                      field.optionMap = {};
                      for (
                        let indx = 0;
                        indx < this.filter.blocks.length;
                        indx++
                      ) {
                        const item = this.filter.blocks[indx];
                        if (
                          item.tehsil_id ==
                          this.data["field_" + this.lkpsIds["lkp_tehsil"]]
                        ) {
                          field.options.push({
                            value: item.block_id,
                            label: item.block_name,
                          });
                          field.optionMap[item.block_id] = item.block_name;
                        }
                      }
                    }
                    break;
                  case "lkp_village":
                    {
                      field.options = [];
                      field.optionMap = {};
                      for (
                        let indx = 0;
                        indx < this.filter.villages.length;
                        indx++
                      ) {
                        const item = this.filter.villages[indx];
                        if (
                          item.grampanchayat_id ==
                          this.data[
                            "field_" + this.lkpsIds["lkp_grampanchayat"]
                          ]
                        ) {
                          field.options.push({
                            value: item.village_id,
                            label: item.village_name,
                          });
                          field.optionMap[item.village_id] = item.village_name;
                        }
                      }
                    }
                    break;
                  case "lkp_crop":
                    {
                      if (isCropOptionsFetched) {
                        field.optionMap = {};
                        field.options = this.plannedCropData.map((d: any) => {
                          field.optionMap[d.crop_id] = d.crop;
                          return {
                            label: d.crop,
                            value: +d.crop_id,
                            notified_unit: d.notified_unit,
                          };
                        });
                      } else {
                        isCropOptionsFetched = true;
                        this.getCropOptions();
                      }
                    }
                    break;
                  case "product_crop":
                    this.setProductCropOptions(field);
                    break;
                  case "lkp_tehsil":
                    {
                      field.options = [];
                      field.optionMap = {};
                      for (
                        let indx = 0;
                        indx < this.filter.tehsils.length;
                        indx++
                      ) {
                        const item = this.filter.tehsils[indx];
                        if (
                          item.district_id ==
                          this.data["field_" + this.lkpsIds["lkp_district"]]
                        ) {
                          field.options.push({
                            value: item.tehsil_id,
                            label: item.tehsil_name,
                          });
                          field.optionMap[item.tehsil_id] = item.tehsil_name;
                        }
                      }
                    }
                    break;
                  case "lkp_grampanchayat":
                    {
                      field.options = [];
                      field.optionMap = {};
                      for (
                        let indx = 0;
                        indx < this.filter.grampanchayats.length;
                        indx++
                      ) {
                        const item = this.filter.grampanchayats[indx];
                        if (
                          item.block_id ==
                          this.data["field_" + this.lkpsIds["lkp_block"]]
                        ) {
                          field.options.push({
                            value: item.grampanchayat_id,
                            label: item.grampanchayat_name,
                          });
                          field.optionMap[item.grampanchayat_id] =
                            item.grampanchayat_name;
                        }
                      }
                    }
                    break;
                  case "lkp_season":
                    {
                      field.optionMap = {};
                      field.options = [...this.seasonMap].map((d) => {
                        field.optionMap[d[0]] = d[1];
                        return { label: d[1], value: d[0] };
                      });
                    }
                    break;
                  case "lkp_year":
                    {
                      field.optionMap = {};
                      field.options = [...this.yearMap].map((d) => {
                        field.optionMap[d[0]] = d[1];
                        return { label: d[1], value: d[0] };
                      });
                    }
                    break;
                  case "lkp_notified_unit":
                    {
                      field.optionMap = {};
                      field.options = [...this.notifiedUnitMap].map((d) => {
                        field.optionMap[d[0]] = d[1];
                        return { label: d[1], value: d[0] };
                      });
                    }
                    break;
                  case "lkp_soil_type":
                    {
                      field.optionMap = {};
                      field.options = [...this.soilTypeMap].map((d) => {
                        field.optionMap[d[0]] = d[1];
                        return { label: d[1], value: d[0] };
                      });
                    }
                    break;
                  case "lkp_ifsc":
                    {
                      field.optionMap = {};
                      field.options = [...this.ifscsMap].map((d) => {
                        field.optionMap[d[0]] = d[1];
                        return { label: d[1], value: d[0] };
                      });
                    }
                    break;
                }
              } else if (field.type == "survey_intimation_no") {
                this.surveyIntimationField = field.field_id;
                if (this.data["field_" + field.field_id]) {
                  const surveyIntmationData =
                    this.data["field_" + field.field_id].split("-");
                  this.surveyIntimationTextData.static =
                    surveyIntmationData[0] || "INT";
                  this.surveyIntimationTextData.year =
                    surveyIntmationData[1] || "";
                  this.surveyIntimationTextData.state =
                    surveyIntmationData[2] || "";
                  this.surveyIntimationTextData.season =
                    surveyIntmationData[3] || "";
                  this.surveyIntimationTextData.freeText =
                    surveyIntmationData[4] || "";

                  this.intimationNoPrefix = `${this.surveyIntimationTextData.static}-${this.surveyIntimationTextData.year}-${this.surveyIntimationTextData.state}-${this.surveyIntimationTextData.season}`;
                }
              }
              field.childs = [];
              if (field.parent_id && !tabIds.includes(field.parent_id)) {
                const parentField = this.fields.find(
                  (e) => e.field_id == field.parent_id
                );
                if (parentField) {
                  if (!parentField.childs) {
                    parentField.childs = [];
                  }
                  if (!parentField.childValues) {
                    parentField.childValues = [];
                  }
                  parentField.childValues.push(
                    ...field.parent_value.split("&#44;")
                  );
                  parentField.childs.push(field);
                  if (parentField.type == "lkp_crop") {
                    // parentField.showChild = parentField.childValues.includes(
                    //   this.cropCodeMap.get(
                    //     +this.data[`field_` + parentField.field_id]
                    //   )
                    // );

                    parentField.showChild =
                      parentField.childValues.includes(
                        this.data[`field_` + parentField.field_id]
                      ) && this.data["field_501"] == 15;
                  } else {
                    parentField.showChild = parentField.childValues.includes(
                      this.data[`field_` + parentField.field_id]
                    );
                  }
                }
              }
              if (field.parent_value) {
                field.parent_value = field.parent_value.split("&#44;");
              }
            }
            this.optionField = optionFields;
            // this.getOPtionFields(optionFields); // Top Survey one
            this.tabs = this.core.clone(tabFields).map((d: any) => {
              d.childs =
                this.fields.filter((e) => e.parent_id == d.field_id) || [];
              return d;
            });

            for (let i = 0; i < this.fields.length; i++) {
              const field = this.fields[i];
              this.validateDateFields(field);
            }
          }

          const allKeys = Object.keys(this.data);
          for (let i = 0; i < allKeys.length; i++) {
            const key = allKeys[i];
            if (this.data[key] && typeof this.data[key] == "string") {
              this.data[key] = this.data[key].trim();
            }
          }

          if (this.tabs?.length) {
            this.active = this.tabs[0].field_id;
          }
          // this.generateColDef();
          // this.generateRowData();
        }
        // generateParentFi
      })
      .catch((err) => {
        console.warn(err);
      })
      .finally(() => {
        // this.loader--;
        this.sLoader--;
      });
  }

  private setProductCropOptions(field: any): void {
    field.optionMap = {};
    field.options = this.filter.productCrops.map((d: any) => {
      field.optionMap[d.crop_code] = d.crop_name;
      return {
        label: d.crop_name,
        value: +d.crop_code,
      };
    });
  }

  getOPtionFields(fields: any[]) {
    if (fields?.length) {
      const request = {
        purpose: "get_surveyfield_multiple",
        survey_id: this.survey_id,
        field_id: fields.map((d) => d.field_id),
      };
      this.core
        .data_post(request)
        .then((response: any) => {
          if (response?.status == 1) {
            for (let i = 0; i < fields.length; i++) {
              const field = fields[i];
              field.options = response?.multiple_fields.filter(
                (d: any) => d.field_id == field.field_id
              );
              field.optionMap = {};
              for (let mi = 0; mi < field.options.length; mi++) {
                const option = field.options[mi];
                field.optionMap[option.value] = option.label;
              }

              setTimeout(() => {
                if (field.type == "radio-group" || field.type == "select") {
                  const elements = this.chmDom.querySelectorAll(
                    `[data-field-id="field_${field.field_id}"]`
                  );
                  if (elements?.length) {
                    elements.forEach((element: any) => {
                      if (field.type == "select") {
                        element.value = this.data[`field_${field.field_id}`];
                      } else {
                        element.value =
                          element.getAttribute("data-option-value");
                        element.checked =
                          this.data[`field_${field.field_id}`] == element.value;
                      }
                    });
                  }
                }
              }, 500);
            }
          }
        })
        .catch((err) => console.error(err))
        .finally(() => {
          this.optionField = [];
        });
    }
  }

  generateColDef() {
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
  }

  generateRowData() {
    this.typeFields.forEach((field: any) => {
      switch (field.type) {
        case "lkp_state":
          {
            this.data[field.field] =
              this.stateMap.get(this.data[field.field]) ||
              this.data[field.field];
          }
          break;

        case "lkp_district":
          {
            this.data[field.field] =
              this.districtMap.get(this.data[field.field]) ||
              this.data[field.field];
          }
          break;

        case "lkp_block":
          {
            this.data[field.field] =
              this.blockMap.get(this.data[field.field]) ||
              this.data[field.field];
          }
          break;

        case "lkp_village":
          {
            this.data[field.field] =
              this.villageMap.get(this.data[field.field]) ||
              this.data[field.field];
          }
          break;

        case "lkp_crop":
          {
            this.data[field.field] =
              this.cropMap.get(this.data[field.field]) ||
              this.cropMap.get(0 + this.data[field.field]) ||
              this.data[field.field];
          }
          break;

        case "lkp_tehsil":
          {
            this.data[field.field] =
              this.tehsilMap.get(this.data[field.field]) ||
              this.data[field.field];
          }
          break;

        case "lkp_grampanchayat":
          {
            this.data[field.field] =
              this.grampanchayatMap.get(this.data[field.field]) ||
              this.data[field.field];
          }
          break;

        case "lkp_season":
          {
            this.data[field.field] =
              this.seasonMap.get(this.data[field.field]) ||
              this.data[field.field];
          }
          break;
        case "lkp_year":
          {
            this.data[field.field] =
              this.yearMap.get(this.data[field.field]) ||
              this.data[field.field];
          }
          break;
        case "lkp_notified_unit":
          {
            this.data[field.field] =
              this.notifiedUnitMap.get(this.data[field.field]) ||
              this.data[field.field];
          }
          break;
      }
    });
  }

  async getImagesData(fields: any[]): Promise<void> {
    const isMunichRe = this.projectContext === 'munichre';
    const fieldIds = this.fields.filter((d) => d.subtype === 'image' || d.type === 'signature').map((field: any) => field.field_id);
    const imageRequest = {
      purpose: 'get_files_array', survey_id: this.survey_id, type: 'image', data_id: this.data_id, field_id: fieldIds,
    };
    this.imageLoader++;
    try {
      const response: any = await this.core.data_post(imageRequest);
      if (response.status !== 1) {
        return;
      }
      this.imageURLs = (response.files || []).map((img: any) => ({
        ...img,
        type: img.file_name?.toLowerCase().endsWith('.pdf') ? 'pdf' : 'img',
        timestamp: Date.now(),
      }));
      this.fieldImages = this.groupImagesByField(this.imageURLs);
      if (isMunichRe) {
        await Promise.all(
          Object.entries(this.fieldImages).map(([fieldId, images]) =>
            this.fetchImageBlobs(images as any[], fieldId)
          )
        );
      }
      this.showApproval = fields.every(
        (d: any) => this.fieldImages[d.field_id]?.length
      );
    } catch (err: any) {
      this.core.toast('error', `Error in getImagesData: ${err?.message || 'Unexpected error'}`);
    } finally {
      this.imageLoader--;
    }
  }

  private groupImagesByField(images: any[]): Record<string, any[]> {
    const grouped: Record<string, any[]> = {};
    const unique = images.filter(
      (img, idx, self) =>
        idx === self.findIndex((i) => i.file_name === img.file_name && i.field_id === img.field_id)
    );
    for (const img of unique) {
      if (!grouped[img.field_id]) {
        grouped[img.field_id] = [];
      }
      grouped[img.field_id].push(img);
    }
    return grouped;
  }

  async generateParentFieldData() {
    if (this.parentFields?.length) {
      const imageFields = this.parentFields
        .filter(
          (d) =>
            this.parentFields.find((e) => e.field_id == d.parent_id)?.type ==
            "tab"
        )
        .filter((field) => field.type == "file" && field.subtype == "image");

      this.parentData = this.data?.parent || {};

      this.getParentImagesData(imageFields);

      this.parentLkpsIds = {};
      for (let i = 0; i < this.parentFields.length; i++) {
        const field = this.parentFields[i];
        if (field.type.startsWith("lkp_")) {
          this.parentLkpsIds[field.type] = field.field_id;
        }
      }
      this.parentFields.sort((a: any, b: any) => a.slno - b.slno);
      const tabFields = this.parentFields.filter((d) => d.type == "tab");
      if (!tabFields?.length) {
        tabFields.push({ type: "tab", field_id: "dummy" });
        for (let i = 0; i < this.parentFields.length; i++) {
          const field = this.parentFields[i];
          field.parent_id = field.parent_id ? field.parent_id : "dummy";
        }
      }

      const tabIds = tabFields.map((d) => d.field_id);
      const optionFields: any[] = [];
      for (let i = 0; i < this.parentFields.length; i++) {
        const field = this.parentFields[i];
        field.required = field.required == 1 ? true : false;
        if (["select", "radio-group"].includes(field.type)) {
          field.options = []; // await this.getFormFieldMultipleData(field.field_id);
          field.optionMap = {};
          for (let mi = 0; mi < field.options.length; mi++) {
            const option = field.options[mi];
            field.optionMap[option.value] = option.label;
          }
        } else if (field.type.startsWith("lkp_")) {
          switch (field.type) {
            case "lkp_state":
              {
                field.optionMap = {};
                field.options = [...this.stateMap].map((d) => {
                  field.optionMap[d[0]] = d[1];
                  return { label: d[1], value: d[0] };
                });
              }
              break;
            case "lkp_district":
              {
                field.options = [];
                field.optionMap = {};
                for (
                  let indx = 0;
                  indx < this.filter.districts.length;
                  indx++
                ) {
                  const item = this.filter.districts[indx];
                  if (
                    item.state_id ==
                    this.parentData["field_" + this.parentLkpsIds["lkp_state"]]
                  ) {
                    field.options.push({
                      value: item.district_id,
                      label: item.district_name,
                    });
                    field.optionMap[item.district_id] = item.district_name;
                  }
                }
              }
              break;
            case "lkp_block":
              {
                field.options = [];
                field.optionMap = {};
                for (let indx = 0; indx < this.filter.blocks.length; indx++) {
                  const item = this.filter.blocks[indx];
                  if (
                    item.tehsil_id ==
                    this.parentData["field_" + this.parentLkpsIds["lkp_tehsil"]]
                  ) {
                    field.options.push({
                      value: item.block_id,
                      label: item.block_name,
                    });
                    field.optionMap[item.block_id] = item.block_name;
                  }
                }
              }
              break;
            case "lkp_village":
              {
                field.options = [];
                field.optionMap = {};
                for (let indx = 0; indx < this.filter.villages.length; indx++) {
                  const item = this.filter.villages[indx];
                  if (
                    item.grampanchayat_id ==
                    this.parentData[
                      "field_" + this.parentLkpsIds["lkp_grampanchayat"]
                    ]
                  ) {
                    field.options.push({
                      value: item.village_id,
                      label: item.village_name,
                    });
                    field.optionMap[item.village_id] = item.village_name;
                  }
                }
              }
              break;
            case "lkp_crop":
              {
                field.optionMap = {};
                field.options = [...this.cropMap].map((d) => {
                  field.optionMap[d[0]] = d[1];
                  return { label: d[1], value: +d[0] };
                });
              }
              break;
            case "lkp_tehsil":
              {
                field.options = [];
                field.optionMap = {};
                for (let indx = 0; indx < this.filter.tehsils.length; indx++) {
                  const item = this.filter.tehsils[indx];
                  if (
                    item.district_id ==
                    this.parentData[
                      "field_" + this.parentLkpsIds["lkp_district"]
                    ]
                  ) {
                    field.options.push({
                      value: item.tehsil_id,
                      label: item.tehsil_name,
                    });
                    field.optionMap[item.tehsil_id] = item.tehsil_name;
                  }
                }
              }
              break;
            case "lkp_grampanchayat":
              {
                field.options = [];
                field.optionMap = {};
                for (
                  let indx = 0;
                  indx < this.filter.grampanchayats.length;
                  indx++
                ) {
                  const item = this.filter.grampanchayats[indx];
                  if (
                    item.block_id ==
                    this.parentData["field_" + this.parentLkpsIds["lkp_block"]]
                  ) {
                    field.options.push({
                      value: item.grampanchayat_id,
                      label: item.grampanchayat_name,
                    });
                    field.optionMap[item.grampanchayat_id] =
                      item.grampanchayat_name;
                  }
                }
              }
              break;
            case "lkp_season":
              {
                field.optionMap = {};
                field.options = [...this.seasonMap].map((d) => {
                  field.optionMap[d[0]] = d[1];
                  return { label: d[1], value: d[0] };
                });
              }
              break;
            case "lkp_year":
              {
                field.optionMap = {};
                field.options = [...this.yearMap].map((d) => {
                  field.optionMap[d[0]] = d[1];
                  return { label: d[1], value: d[0] };
                });
              }
              break;
            case "lkp_notified_unit":
              {
                field.optionMap = {};
                field.options = [...this.notifiedUnitMap].map((d) => {
                  field.optionMap[d[0]] = d[1];
                  return { label: d[1], value: d[0] };
                });
              }
              break;
            case "lkp_soil_type":
              {
                field.optionMap = {};
                field.options = [...this.soilTypeMap].map((d) => {
                  field.optionMap[d[0]] = d[1];
                  return { label: d[1], value: d[0] };
                });
              }
              break;
            case "lkp_ifsc":
              {
                field.optionMap = {};
                field.options = [...this.ifscsMap].map((d) => {
                  field.optionMap[d[0]] = d[1];
                  return { label: d[1], value: d[0] };
                });
              }
              break;
          }
        } else if (field.type == "survey_intimation_no") {
          this.surveyIntimationField = field.field_id;
          if (this.parentData["field_" + field.field_id]) {
            const surveyIntmationData =
              this.parentData["field_" + field.field_id].split("-");
            this.surveyIntimationTextData.static =
              surveyIntmationData[0] || "INT";
            this.surveyIntimationTextData.year = surveyIntmationData[1] || "";
            this.surveyIntimationTextData.state = surveyIntmationData[2] || "";
            this.surveyIntimationTextData.season = surveyIntmationData[3] || "";
            this.surveyIntimationTextData.freeText =
              surveyIntmationData[4] || "";
            this.intimationNoPrefix = `${this.surveyIntimationTextData.static}-${this.surveyIntimationTextData.year}-${this.surveyIntimationTextData.state}-${this.surveyIntimationTextData.season}`;
          }
        }
        field.childs = [];
        if (field.parent_id && !tabIds.includes(field.parent_id)) {
          const parentField = this.parentFields.find(
            (e) => e.field_id == field.parent_id
          );
          if (parentField) {
            if (!parentField.childs) {
              parentField.childs = [];
            }
            if (!parentField.childValues) {
              parentField.childValues = [];
            }
            parentField.childValues.push(...field.parent_value.split("&#44;"));
            parentField.childs.push(field);
            if (parentField.type == "lkp_crop") {
              // parentField.showChild = parentField.childValues.includes(
              //   this.cropCodeMap.get(
              //     +this.parentData[`field_` + parentField.field_id]
              //   )
              // );
              parentField.showChild =
                parentField.childValues.includes(
                  this.data[`field_` + parentField.field_id]
                ) && this.data["field_501"] == 15;
            } else {
              parentField.showChild = parentField.childValues.includes(
                this.parentData[`field_` + parentField.field_id]
              );
            }
          }
        }
        if (field.parent_value) {
          field.parent_value = field.parent_value.split("&#44;");
        }
      }
      this.getOPtionFields(optionFields);
      this.parentTabs = this.core.clone(tabFields).map((d: any) => {
        d.childs =
          this.parentFields.filter((e) => e.parent_id == d.field_id) || [];
        return d;
      });
    }
  }

  async getParentImagesData(fields: any): Promise<void> {
    const fieldIds = this.parentFields.filter((d) => d.subtype === "image" || d.type === "signature").map((field: any) => field.field_id);
    const imageRequest = {
      purpose: "get_files_array", survey_id: this.survey_id == 4 ? "1" : "3",
      type: "image", data_id: this.parentData.data_id, field_id: fieldIds,
    };
    try {
      const response: any = await this.core.data_post(imageRequest);
      if (response.status !== 1) {
        return;
      }
      this.parentImageURLs = response.files || [];
      this.parentImageURLs.forEach((img: any) => {
        img.type = img.file_name?.toLowerCase().endsWith(".pdf") ? "pdf" : "img";
      });
      this.parentFieldImages = this.parentImageURLs.reduce((acc: any, img: any) => {
        if (!acc[img.field_id]) {
          acc[img.field_id] = [];
        }
        acc[img.field_id].push(img);
        return acc;
      }, {});
      if (this.projectContext === "munichre") {
        for (const fieldId of Object.keys(this.parentFieldImages)) {
          const images = this.parentFieldImages[fieldId];
          await this.fetchImageBlobs(images, fieldId);
        }
      }
      this.showApproval = fields.every(
        (d: any) => this.parentFieldImages[d.field_id]?.length
      );
    } catch (err: any) {
      const message = err?.message || "An unexpected error occurred";
      this.core.toast("error", `Error in getParentImagesData: ${message}`);
    }
  }

  async fetchImageBlobs(images: any[], field_id: any) {
    for (const img of images) {
      const fileNameLower = img.file_name.toLowerCase();
      const isPdf = fileNameLower.endsWith('.pdf');
      const fileUrl = `${this.imgUrl}${img.file_name}`;
      if (isPdf) {
        try {
          const blob = await this.core.fetchAzureBlob(fileUrl);
          img.type = 'pdf';
          const blobUrl = URL.createObjectURL(blob);
          this.imageBlobs[img.id] = blob;
          this.imageBlobUrls[img.id] = this.sanitizer.bypassSecurityTrustResourceUrl(blobUrl);
        } catch (error) {
          img.type = 'pdf';
          this.imageBlobUrls[img.id] = this.sanitizer.bypassSecurityTrustResourceUrl(fileUrl);
        }
        continue;
      }
      try {
        const blob = await this.core.fetchAzureBlob(fileUrl);
        img.type = blob.type || 'image/jpeg';
        const blobUrl = URL.createObjectURL(blob);
        this.imageBlobs[img.id] = blob;
        this.imageBlobUrls[img.id] = this.sanitizer.bypassSecurityTrustUrl(blobUrl);
      } catch (error) {
        img.isMissed = true;
        img.type = 'image/jpeg';
        this.imageBlobUrls[img.id] = this.missedImage;
      }
    }
  }

  async download_kml(data: any): Promise<void> {
    if (!data?.file_name) {
      this.core.toast("warn", "No KML file provided");
      return;
    }
    if (this.projectContext === 'munichre') {
      try {
        const config = this.featureToggle.getConfig();
        const fileUrl = `${config.BASEKMLPREFIX}${data.file_name}`;
        const blob = await this.core.fetchAzureBlob(fileUrl);
        const safeUrl: SafeUrl = this.sanitizer.bypassSecurityTrustUrl(URL.createObjectURL(blob));
        this.generateFile(safeUrl, data.file_name);
        this.core.toast("success", "KML file downloaded successfully");
      } catch (err: any) {
        this.core.toast("error", "Failed to download KML file");
      } finally {
        this.modalService.dismissAll();
      }
    } else {
      try {
        const url = `${this.imgUrl}${data.file_name}${this.imgUrlSuffix || ''}`;
        this.generateFile(url, data.file_name);
      } finally {
        this.modalService.dismissAll();
      }
    }
  }

  generateFile(url: any, filename: any) {
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("target", "_blank");
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link); // Required for FF
    link.click(); // This will download the data file named "my_data.csv".
    document.body.removeChild(link);
  }

  editKMLFile() {
    this.isEditkML = true;
  }

  back() {
    if (this.isChild) {
      this.emitAction.emit();
    } else {
      this.location.back();
    }
  }

  validateData(event: any) {
    let isValid = this.fields
      .filter(
        (field: any) => !["tab", "file", "kml", "header"].includes(field.type)
      )
      .every((field: any) => {
        if (field.required == 1 && !event[`field_${field.field_id}`]) {
          if (
            (!field.parent_value ||
              this.data[`field_${field.parent_id}`] == field.parent_value) &&
            !(this.data["field_501"] != 15 && [10420208, 22122400].includes(+field.parent_value))
          ) {
            this.core.toast("warn", `${field.label} is required.`);
            return false;
          }
        }
        if (field?.type == "date" && event[`field_${field.field_id}`]) {
          if (!/^\d{4}-\d{2}-\d{2}$/.test(event[`field_${field.field_id}`])) {
            this.core.toast("warn", `${field.label} is invalid.`);
            return false;
          }
          const currentDate = new Date(
            event[`field_${field.field_id}`]
          ).getTime();
          if (currentDate < this.minDate || currentDate > this.maxDate) {
            this.core.toast(
              "warn",
              `Invalid date is selected for ${field.label}.`
            );
            return false;
          }
        }
        if (
          field?.maxlength &&
          event[`field_${field.field_id}`] &&
          event[`field_${field.field_id}`]?.length > +field.maxlength
        ) {
          this.core.toast(
            "warn",
            `${field.label} value should not exceed ${field.maxlength} charecter.`
          );
          return false;
        }
        if (
          field?.max &&
          event[`field_${field.field_id}`] &&
          +event[`field_${field.field_id}`] > +field.max
        ) {
          this.core.toast(
            "warn",
            `${field.label} value should not be greater than ${field.max}.`
          );
          return false;
        }
        return true;
      });
    if (isValid && event[this.surveyDates[this.survey_id]]) {
      const surveyTime = new Date(
        event[this.surveyDates[this.survey_id]]
      ).setHours(0, 0, 0, 0);
      const submittedTime = new Date(event["datetime"]).setHours(0, 0, 0, 0);
      if (surveyTime > submittedTime) {
        const survey_date_filed: any =
          this.fields.find(
            (d) => `field_${d.field_id}` == this.surveyDates[this.survey_id]
          ) || {};
        const label =
          survey_date_filed.display_name ||
          survey_date_filed.label ||
          "Survey Date";
        this.core.toast(
          `warn`,
          `${label} should not be more than submitted date (${moment(
            event["datetime"]
          ).format("DD-MMM-YYYY")})`
        );
        return false;
      }
    }
    if (isValid && this.survey_id == 2) {
      const intimation_no = this.projectContext === 'munichre' ? 9 : 8
      if (this.surveyIntimationTextData.freeText?.length != intimation_no) {
        this.core.toast("warn", `Invalid intimation number`);
        return false;
      }
      if ([1, 2, 3, 4].includes(+this.user?.user_role)) {
        if (this.intimationNoPrefix?.length != 14) {
          this.core.toast("warn", `Invalid intimation number`);
          return false;
        }
        if (this.surveyIntimationTextData.static != "INT") {
          this.core.toast("warn", `Invalid prefix in intimation number`);
          return false;
        }
        if (this.surveyIntimationTextData.year?.length != 4) {
          this.core.toast("warn", `Invalid year in intimation number`);
          return false;
        }
        if (
          this.surveyIntimationTextData.year !=
          this.yearCodeMap.get(this.data["field_953"])
        ) {
          this.core.toast("warn", `Invalid year code in intimation number`);
          return false;
        }
        if (this.surveyIntimationTextData.state?.length != 2) {
          this.core.toast("warn", `Invalid state in intimation number`);
          return false;
        }
        if (
          this.surveyIntimationTextData.state !=
          this.stateCodeMap.get(this.data["field_528"])
        ) {
          this.core.toast("warn", `Invalid state code in intimation number`);
          return false;
        }
        if (this.surveyIntimationTextData.season?.length != 2) {
          this.core.toast("warn", `Invalid season in intimation number`);
          return false;
        }
        if (
          this.surveyIntimationTextData.season !=
          this.seasonCodeMap.get(this.data["field_526"])
        ) {
          this.core.toast("warn", `Invalid season code in intimation number`);
          return false;
        }
      }
      if (this.data["field_720"] == "No loss") {
        if (this.data["field_548"] != 0) {
          this.core.toast(
            "warn",
            'Damaged/Affected Area (Hect) value must be 0 if Survey type is "no loss"'
          );
          return false;
        }
        if (this.data["field_550"] != 0) {
          this.core.toast(
            "warn",
            'Loss % value must be 0 if Survey type is "no loss"'
          );
          return false;
        }
      }
    }

    // if (isValid && this.survey_id == 2) {
    //   const data = {
    //     survey_date: this.data['field_527'] ?  new Date(this.data['field_527']).getTime() : null,
    //     sowing_date: this.data['field_541'] ?  new Date(this.data['field_541']).getTime() : null,
    //     harvest_date: this.data['field_542'] ?  new Date(this.data['field_542']).getTime() : null,
    //     intimation_date: this.data['field_524'] ?  new Date(this.data['field_524']).getTime() : null,
    //     loss_date: this.data['field_553'] ?  new Date(this.data['field_553']).getTime() : null,
    //   };
    //   if (data.sowing_date && data.survey_date && data.sowing_date > data.survey_date) {
    //     this.core.toast("warn", `Sowing date should be before Survey's date.`);
    //     return false
    //   }

    //   if (data.harvest_date && data.sowing_date && data.harvest_date < data.sowing_date) {
    //     this.core.toast("warn", `Harvest date should be after sowing date.`);
    //     return false
    //   }

    //   if (data.survey_date && data.sowing_date && data.intimation_date && !(data.intimation_date < data.survey_date || data.intimation_date > data.sowing_date)) {
    //     this.core.toast("warn", `Intimation date should be after sowing date and on or before survey's date.`);
    //     return false
    //   }

    //   if (data.loss_date && data.sowing_date && data.intimation_date && (data.loss_date < data.sowing_date || data.loss_date > data.intimation_date)) {
    //     this.core.toast("warn", `Loss date should be on or before Intimation date and after sowing date`);
    //     return false
    //   }

    //   // if (this.data['field_527'] && this.data['field_541']) {
    //   //   if (new Date(this.data['field_541']).getTime() > new Date(this.data['field_527']).getTime()) {
    //   //     this.core.toast("warn", `Sowing date should be before Survey's date.`);
    //   //   }
    //   //   if (this.data['field_542']) {
    //   //     if(new Date(this.data['field_542']).getTime() < new Date(this.data['field_541']).getTime()) {
    //   //       this.core.toast("warn", `Harvest date should be after sowing date`);
    //   //     }
    //   //   }
    //   //     if (this.data['field_524']) {
    //   //       if(new Date(this.data['field_524']).getTime() < new Date(this.data['field_541']).getTime() || new Date(this.data['field_524']).getTime() > new Date(this.data['field_527']).getTime()) {
    //   //         this.core.toast("warn", `Harvest date should be after sowing date`);
    //   //       }

    //   //       if (this.data['field_553']) {
    //   //         if(new Date(this.data['field_553']).getTime() < new Date(this.data['524']).getTime() || new Date(this.data['field_553']).getTime() > new Date(this.data['field_527']).getTime()) {
    //   //           this.core.toast("warn", `Harvest date should be after sowing date`);
    //   //         }
    //   //       }
    //   //     }
    //   // }
    // }
    return isValid;
  }

  onKMLAction(event: any) {
    if (event?.purpose == "geojson-update") {
      this.geoJsonData = event.geoJsonData;
      return;
    }
    if (event?.purpose == "cancel") {
      this.isEditkML = false;
      this.isEditable = !this.isEditable;
      this.imageFields = [];
      // this.showMedia = false;
      // this.showSignature = false;
      this.geoJsonData = null;
      this.isEditable = false;
      this.showApproval = false;
      this.getSurveyData(this.survey_id, this.data_id);
    }
    if (event?.purpose == "update-kml") {
      if (this.updating) {
        return;
      }
      this.updating = true;
      if (this.data?.field_779 && typeof this.data.field_779 == "string") {
        this.data.field_779 = this.data.field_779.trim();
      }
      if (!this.validateData(this.core.clone(this.data))) {
        this.updating = false;
        return;
      }
      if (this.survey_id) {
        this.updating = false;
        // alert('Success')
        // return
      }
      event.purpose = undefined;
      event.field_id = this.fields.find((d) => d.type == "kml")?.field_id;
      delete this.data.undefined
      const data = this.core.clone(this.data);
      if (data?.field_779 && typeof data.field_779 == "string") {
        data.field_779 = data.field_779.trim();
      }

      ["client_name", "first_name", "last_name", "lat", "lng"].forEach(
        (d) => (data[d] = undefined)
      );
      const new_images: any = Object.keys(this.fieldImages).map((k) =>
        this.fieldImages[k].filter((d: any) => !d.id)
      );
      const requst = {
        data,
        kml_file: event,
        new_images: [], // new_images.flat(),
        deleted_images: [], //this.deletedImages,
        survey_id: this.survey_id,
        purpose: "update_survey_data",
      };
      // if (1 < 2) {
      //   return
      // }
      this.loader++;
      this.core
        .post(requst)
        .then((response: any) => {
          if (response?.status == 1) {
            this.core.toast("success", response.msg);
            this.imageFields = [];
            // this.showMedia = false;
            // this.showSignature = false;
            this.geoJsonData = null;
            this.isEditable = false;
            this.showApproval = false;
            this.getSurveyData(this.survey_id, this.data_id);
          } else {
            this.core.toast("error", response.msg);
          }
        })
        .catch((err) => {
          this.core.toast("error", "Unable to update");
        })
        .finally(() => {
          this.loader--;
          this.updating = false;
        });
    }
  }

  onEditDetail() {
    if (!this.imageURLs?.length) {
      this.getImagesData(this.imageFields);
    }
    if (this.optionField?.length) {
      this.getOPtionFields(this.optionField);
    }
    this.isEditable = !this.isEditable;
    for (let i = 0; i < this.fields.length; i++) {
      const field = this.fields[i];
      if (field.type == "radio-group") {
        const elements = this.chmDom.querySelectorAll(
          `[data-field-id="field_${field.field_id}"]`
        );
        if (elements?.length) {
          elements.forEach((element: any) => {
            element.value = element.getAttribute("data-option-value");
            element.checked =
              this.data[`field_${field.field_id}`] == element.value;
          });
        }
      } else if (field.type == "survey_intimation_no") {
        if (this.surveyIntimationField) {
          this.data[`field_${this.surveyIntimationField}`] = [
            this.surveyIntimationTextData.static,
            this.surveyIntimationTextData.year,
            this.surveyIntimationTextData.state,
            this.surveyIntimationTextData.season,
            this.surveyIntimationTextData.freeText,
          ].join("-");
          const element = this.chmDom.querySelector(
            `[data-field-id="field_${field.field_id}"]`
          );
          if (element) {
            element.value = this.surveyIntimationTextData.freeText;
          }
        }
      } else {
        const element = this.chmDom.querySelector(
          `[data-field-id="field_${field.field_id}"]`
        );
        if (element) {
          element.value = this.data[`field_${field.field_id}`];
        }
      }
    }
    this.showMap = false;
    this.delay(() => (this.data = this.core.clone(this.data)));
    setTimeout(() => {
      this.showMap = true;
    }, 100);
  }

  async getFormFieldMultipleData(fieldId: any) {
    const request = {
      purpose: "get_surveyfield_multiple",
      survey_id: this.survey_id,
      field_id: fieldId,
    };
    return (
      (await this.core.data_post(request).then((response: any) => {
        if (response?.status == 1) {
          return response.multiple_fields.map((d: any) => ({
            label: d.label,
            value: d.value,
          }));
        } else {
          return [];
        }
      })) || []
    );
  }

  onFiedChange(event: any, fieldType: any, fieldId: any) {
    const currentField = this.fields.find((d) => d.field_id == fieldId);

    if (currentField.subtype === 'email') {
      let value = event.target.value;      
      const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailPattern.test(value)) {
        this.core.toast('error', `Please Enter a valid email`);
        event.target.value = this.data[`field_${currentField.field_id}`]
        return;
      }
    } else if (currentField.subtype === 'phone'){
      let value = event.target.value;
      const maxPhoneLength = value.includes('+91') ? 13 : 10;
      if (value.length > maxPhoneLength) {
        this.core.toast('error', `Phone number cannot exceed 10 digits.`);
        event.target.value = this.data[`field_${currentField.field_id}`];
        return;
      }
    }

    if (typeof event == "object") {
      if (fieldType == "survey_intimation_no") {
        this.surveyIntimationTextData.freeText = event.target.value;
        this.data[`field_${this.surveyIntimationField}`] = [
          this.surveyIntimationTextData.static,
          this.surveyIntimationTextData.year,
          this.surveyIntimationTextData.state,
          this.surveyIntimationTextData.season,
          this.surveyIntimationTextData.freeText,
        ].join("-");
      } else {
        this.data[`field_${currentField.field_id}`] = event.target.value;
      }
    }

    if (
      currentField.subtype == "phone" &&
      !this.data[`field_${currentField.field_id}`]?.startsWith("+91")
    ) {
      this.data[`field_${currentField.field_id}`] =
        "+91" + this.data[`field_${currentField.field_id}`];
      const element = this.chmDom.querySelector(
        `[data-field-id="field_${currentField.field_id}"]`
      );
      if (element) {
        element.value = this.data[`field_${currentField.field_id}`];
      }
    }

    if (currentField.subtype == "survey_intimation_no") {
      this.data[`field_${currentField.field_id}`] = [
        this.surveyIntimationTextData.static,
        this.surveyIntimationTextData.year,
        this.surveyIntimationTextData.state,
        this.surveyIntimationTextData.season,
        this.surveyIntimationTextData.freeText,
      ].join("-");
    }
    if (fieldId == "720" && event?.target?.value == "No loss") {
      this.data[`field_548`] = "0";
      this.data[`field_550`] = "0";
      this.chmDom
        .querySelectorAll("#input_548,#input_550")
        .forEach((d: any) => (d.value = "0"));
    }
    switch (fieldType) {
      case "lkp_state":
        {
          this.onStateChange(event.target.value, fieldType);
          if (this.surveyIntimationField) {
            this.surveyIntimationTextData.state = this.stateCodeMap.get(
              event.target.value
            );
            this.data[`field_${this.surveyIntimationField}`] = [
              this.surveyIntimationTextData.static,
              this.surveyIntimationTextData.year,
              this.surveyIntimationTextData.state,
              this.surveyIntimationTextData.season,
              this.surveyIntimationTextData.freeText,
            ].join("-");
          }
        }
        break;
      case "lkp_district":
        {
          this.onDistrictChange(event.target.value, fieldType);
        }
        break;
      case "lkp_tehsil":
        {
          this.onTehsilChange(event.target.value, fieldType);
        }
        break;
      case "lkp_block":
        {
          this.onBlockChange(event.target.value, fieldType);
        }
        break;
      case "lkp_grampanchayat":
        {
          this.onGrampanchayatChange(event.target.value, fieldType);
        }
        break;
      case "lkp_village":
        {
          this.clearCrops();
        }
        break;
      case "lkp_year":
        {
          this.clearCrops();
          if (this.surveyIntimationField) {
            this.surveyIntimationTextData.year = this.yearCodeMap.get(
              event.target.value
            );
            this.data[`field_${this.surveyIntimationField}`] = [
              this.surveyIntimationTextData.static,
              this.surveyIntimationTextData.year,
              this.surveyIntimationTextData.state,
              this.surveyIntimationTextData.season,
              this.surveyIntimationTextData.freeText,
            ].join("-");
          }
        }
        break;
      case "lkp_season":
        {
          this.clearCrops();
          if (this.surveyIntimationField) {
            this.surveyIntimationTextData.season = this.seasonCodeMap.get(
              event.target.value
            );
            this.data[`field_${this.surveyIntimationField}`] = [
              this.surveyIntimationTextData.static,
              this.surveyIntimationTextData.year,
              this.surveyIntimationTextData.state,
              this.surveyIntimationTextData.season,
              this.surveyIntimationTextData.freeText,
            ].join("-");
          }
        }
        break;
      case "lkp_crop":
        {
          if (`field_${fieldId}` == this.crop_column) {
            const field = this.fields.find(
              (d) => `field_${d.field_id}` == this.iu_column
            );
            if (field) {
              const notifiedUnit =
                currentField.options.find(
                  (d: any) =>
                    d.value == this.data["field_" + currentField.field_id]
                )?.notified_unit || "";
              this.data[this.iu_column] = notifiedUnit;
              field.value = notifiedUnit;
              const iu_input = this.chmDom.querySelector(
                `#input_${field.field_id}`
              );
              if (iu_input) {
                iu_input.value = notifiedUnit;
              }
            }
          }
        }
        break;
    }
    setTimeout(() => {
      this.validateDateFields(currentField, true);
    });
    if (currentField.childValues?.length) {
      if (currentField.type == "lkp_crop") {
        currentField.showChild = currentField.childValues.includes(
          this.cropCodeMap.get(+event.target.value)
        );
      } else {
        currentField.showChild = currentField.childValues.includes(
          event.target.value
        );
      }
    }

    if (
      [
        "lkp_state",
        "lkp_district",
        "lkp_tehsil",
        "lkp_block",
        "lkp_grampanchayat",
        "lkp_year",
        "lkp_season",
        "lkp_village",
      ].includes(fieldType)
    ) {
      this.getCropOptions();
    }
  }

  onIntimationPrefixChange() {
    this.intimationNoPrefix =
      this.chmDom.querySelector("#intimationNoPrefix")?.value || "";
    const intimationNo = this.intimationNoPrefix.split("-");
    this.surveyIntimationTextData.static = intimationNo[0] || "";
    this.surveyIntimationTextData.year = intimationNo[1] || "";
    this.surveyIntimationTextData.state = intimationNo[2] || "";
    this.surveyIntimationTextData.season = intimationNo[3] || "";
    this.surveyIntimationTextData.freeText =
      this.chmDom.querySelector(`#input_${this.surveyIntimationField}`).value ||
      "";
    this.data[`field_${this.surveyIntimationField}`] = [
      this.surveyIntimationTextData.static,
      this.surveyIntimationTextData.year,
      this.surveyIntimationTextData.state,
      this.surveyIntimationTextData.season,
      this.surveyIntimationTextData.freeText,
    ].join("-");
  }

  applyLocationLkpOptions(fieldType: any) {
    const districtChange = () => {
      const field = this.fields.find((d) => d.type == "lkp_district");
      if (field) {
        field.options = [];
        field.optionMap = {};
        for (let indx = 0; indx < this.filter.districts.length; indx++) {
          const item = this.filter.districts[indx];
          if (
            item.state_id == this.data["field_" + this.lkpsIds["lkp_state"]]
          ) {
            field.options.push({
              value: item.district_id,
              label: item.district_name,
            });
            field.optionMap[item.district_id] = item.district_name;
          }
        }
      }
      const tehsilField = this.fields.find((d) => d.type == "lkp_tehsil");
      if (tehsilField) {
        tehsilField.options = [];
        tehsilField.optionMap = {};
      }
      const blockField = this.fields.find((d) => d.type == "lkp_block");
      if (blockField) {
        blockField.options = [];
        blockField.optionMap = {};
      }
      const grampanchayatField = this.fields.find(
        (d) => d.type == "lkp_grampanchayat"
      );
      if (grampanchayatField) {
        grampanchayatField.options = [];
        grampanchayatField.optionMap = {};
      }
      const villageField = this.fields.find((d) => d.type == "lkp_village");
      if (villageField) {
        villageField.options = [];
        villageField.optionMap = {};
      }
    };
    const tehsilChange = () => {
      const field = this.fields.find((d) => d.type == "lkp_tehsil");
      if (field) {
        {
          field.options = [];
          field.optionMap = {};
          for (let indx = 0; indx < this.filter.tehsils.length; indx++) {
            const item = this.filter.tehsils[indx];
            if (
              item.district_id ==
              this.data["field_" + this.lkpsIds["lkp_district"]]
            ) {
              field.options.push({
                value: item.tehsil_id,
                label: item.tehsil_name,
              });
              field.optionMap[item.tehsil_id] = item.tehsil_name;
            }
          }
        }
      }
      const blockField = this.fields.find((d) => d.type == "lkp_block");
      if (blockField) {
        blockField.options = [];
        blockField.optionMap = {};
      }
      const grampanchayatField = this.fields.find(
        (d) => d.type == "lkp_grampanchayat"
      );
      if (grampanchayatField) {
        grampanchayatField.options = [];
        grampanchayatField.optionMap = {};
      }
      const villageField = this.fields.find((d) => d.type == "lkp_village");
      if (villageField) {
        villageField.options = [];
        villageField.optionMap = {};
      }
    };
    const blockChange = () => {
      const field = this.fields.find((d) => d.type == "lkp_block");
      if (field) {
        field.options = [];
        field.optionMap = {};
        for (let indx = 0; indx < this.filter.blocks.length; indx++) {
          const item = this.filter.blocks[indx];
          if (
            item.tehsil_id == this.data["field_" + this.lkpsIds["lkp_tehsil"]]
          ) {
            field.options.push({
              value: item.block_id,
              label: item.block_name,
            });
            field.optionMap[item.block_id] = item.block_name;
          }
        }
      }
      const grampanchayatField = this.fields.find(
        (d) => d.type == "lkp_grampanchayat"
      );
      if (grampanchayatField) {
        grampanchayatField.options = [];
        grampanchayatField.optionMap = {};
      }
      const villageField = this.fields.find((d) => d.type == "lkp_village");
      if (villageField) {
        villageField.options = [];
        villageField.optionMap = {};
      }
    };
    const grampanchayatChange = () => {
      const field = this.fields.find((d) => d.type == "lkp_grampanchayat");
      if (field) {
        field.options = [];
        field.optionMap = {};
        for (let indx = 0; indx < this.filter.grampanchayats.length; indx++) {
          const item = this.filter.grampanchayats[indx];
          if (
            item.block_id == this.data["field_" + this.lkpsIds["lkp_block"]]
          ) {
            field.options.push({
              value: item.grampanchayat_id,
              label: item.grampanchayat_name,
            });
            field.optionMap[item.grampanchayat_id] = item.grampanchayat_name;
          }
        }
      }
      const villageField = this.fields.find((d) => d.type == "lkp_village");
      if (villageField) {
        villageField.options = [];
        villageField.optionMap = {};
      }
    };
    const villageChange = () => {
      const field = this.fields.find((d) => d.type == "lkp_village");
      if (field) {
        field.options = [];
        field.optionMap = {};
        for (let indx = 0; indx < this.filter.villages.length; indx++) {
          const item = this.filter.villages[indx];
          if (
            item.grampanchayat_id ==
            this.data["field_" + this.lkpsIds["lkp_grampanchayat"]]
          ) {
            field.options.push({
              value: item.village_id,
              label: item.village_name,
            });
            field.optionMap[item.village_id] = item.village_name;
          }
        }
      }
    };
    // for (let index = 0; index < this.fields.length; index++) {
    if (fieldType) {
      switch (fieldType) {
        case "lkp_state":
          {
            districtChange();
          }
          break;
        case "lkp_district":
          {
            tehsilChange();
          }
          break;
        case "lkp_block":
          {
            grampanchayatChange();
          }
          break;
        case "lkp_village":
          {
            // villageChange(field)
          }
          break;
        case "lkp_tehsil":
          {
            blockChange();
          }
          break;
        case "lkp_grampanchayat":
          {
            villageChange();
          }
          break;
      }
    }
    // }
  }

  onStateChange(event: any, fieldType: any) {
    this.data[`field_${this.lkpsIds["lkp_district"]}`] = "";
    this.data[`field_${this.lkpsIds["lkp_tehsil"]}`] = "";
    this.data[`field_${this.lkpsIds["lkp_block"]}`] = "";
    this.data[`field_${this.lkpsIds["lkp_grampanchayat"]}`] = "";
    this.data[`field_${this.lkpsIds["lkp_village"]}`] = "";
    this.clearCrops();
    this.applyLocationLkpOptions(fieldType);
  }
  onDistrictChange(event: any, fieldType: any) {
    this.data[`field_${this.lkpsIds["lkp_tehsil"]}`] = "";
    this.data[`field_${this.lkpsIds["lkp_block"]}`] = "";
    this.data[`field_${this.lkpsIds["lkp_grampanchayat"]}`] = "";
    this.data[`field_${this.lkpsIds["lkp_village"]}`] = "";
    this.clearCrops();
    this.applyLocationLkpOptions(fieldType);
  }
  onTehsilChange(event: any, fieldType: any) {
    this.data[`field_${this.lkpsIds["lkp_block"]}`] = "";
    this.data[`field_${this.lkpsIds["lkp_grampanchayat"]}`] = "";
    this.data[`field_${this.lkpsIds["lkp_village"]}`] = "";
    this.clearCrops();
    this.applyLocationLkpOptions(fieldType);
  }
  onBlockChange(event: any, fieldType: any) {
    this.data[`field_${this.lkpsIds["lkp_grampanchayat"]}`] = "";
    this.data[`field_${this.lkpsIds["lkp_village"]}`] = "";
    this.clearCrops();
    this.applyLocationLkpOptions(fieldType);
  }
  onGrampanchayatChange(event: any, fieldType: any) {
    this.data[`field_${this.lkpsIds["lkp_village"]}`] = "";
    this.clearCrops();
    this.applyLocationLkpOptions(fieldType);
  }

  clearCrops() {
    for (let i = 0; i < this.cropLkpIds.length; i++) {
      const lkp_id = this.cropLkpIds[i];
      this.data[`field_${lkp_id}`] = "";
      const field = this.fields.find((d) => d.field_id == lkp_id);
      if (field) {
        field.value = "";
        field.options = [];
      }
    }
    this.data[this.iu_column] = "";
    const field = this.fields.find(
      (d) => `field_${d.field_id}` == this.iu_column
    );
    if (field) {
      field.value = "";
      const iu_input = this.chmDom.querySelector(`#input_${field.field_id}`);
      if (iu_input) {
        iu_input.value = "";
      }
    }
  }

  getCropOptions(field?: any) {
    const year = this.data[`field_${this.lkpsIds["lkp_year"]}`];
    const season = this.data[`field_${this.lkpsIds["lkp_season"]}`];
    const state = this.data[`field_${this.lkpsIds["lkp_state"]}`];
    const dist = this.data[`field_${this.lkpsIds["lkp_district"]}`];
    const request = {
      purpose: "lkp_chm_crop",
      state: state ? [state] : [],
      district: dist ? [dist] : [],
      tehsil: [],
      notifiedUnit: [],
      years: year ? [year] : [],
      seasons: season ? [season] : [],
    };
    // this.isCropLoading++;
    // this.core
    //   .data_post(request)
    //   .then((response: any) => {
    if (this.plannedCropData?.length) {
      // this.plannedCropData = response?.lkp_Karnatakacrops || [];
      const cropOptions = (this.plannedCropData || []).filter((d) => {
        return (
          d.state_id == state &&
          d.dist_id == dist &&
          d.year == year &&
          d.season == season
        );
      });
      if (field) {
        field.optionMap = {};
        field.options = cropOptions.map((d: any) => {
          field.optionMap[d.crop_id] = d.crop;
          return {
            label: d.crop,
            value: +d.crop_id,
            notified_unit: d.notified_unit,
          };
        });
      } else {
        for (let i = 0; i < this.cropLkpIds.length; i++) {
          const fieldData = this.fields.find(
            (d) => d.field_id == this.cropLkpIds[i]
          );
          if (fieldData) {
            fieldData.optionMap = {};
            fieldData.options = cropOptions.map((d: any) => {
              fieldData.optionMap[d.crop_id] = d.crop;
              return {
                label: d.crop,
                value: +d.crop_id,
                notified_unit: d.notified_unit,
              };
            });
          }
        }
      }
    }
    // })
    // .catch((err) => console.error(err))
    // .finally(() => this.isCropLoading--);
  }

  async onNewImageAdded(event: any, field_id: any) {
    if (!event?.target?.files?.length) {
      return;
    }

    const files = Array.from(event.target.files) as File[];
    if (files.some(f => f.size > this.MAX_FILE_SIZE)) {
      this.core.toast('warn', 'File size should not exceed 5MB');
      return;
    }

    const fieldImages = this.fieldImages[field_id]
      ? this.core.clone(this.fieldImages[field_id])
      : [];

    this.fieldImages[field_id] = null;
    this.loader++;

    try {
      if (this.projectContext === 'munichre') {
        for (const file of files) {
          const { blob, type, tempId, tempBlobUrl } = await this.processFile(file, field_id, fieldImages);
          await this.uploadFile(blob, type, tempId, tempBlobUrl, field_id, fieldImages);
        }
      }
      else {
        for (const file of files) {
          await this.processAndUploadFile(file, field_id, fieldImages);
        }
      }
    } catch (e) {
      this.core.toast('error', 'Error processing files');
    } finally {
      this.loader--;
      this.fieldImages[field_id] = fieldImages;
    }
  }

  private async processFile(file: File, field_id: any, fieldImages: any[]) {
    const type = file.name.toLowerCase().endsWith('.pdf') ? 'pdf' : 'img';
    let blob: File | Blob = file;
    if (type === 'img') {
      const dataUrl = await this.readFileAsDataUrl(file);
      const compressedDataUrl:any = await this.imageCompresser(dataUrl);
      blob = await fetch(compressedDataUrl).then(res => res.blob());
      blob = new File([blob], file.name.toLowerCase(), { type: blob.type });
    }
    const tempId = `temp_${Date.now()}_${Math.random()}`;
    const tempBlobUrl = URL.createObjectURL(blob);
    const newImg = {
      id: tempId,
      file_name: file.name.toLowerCase(),
      field_id,
      data_id: this.data_id,
      file_type: 'image',
      type,
      blink: true,
      timestamp: Date.now(),
    };
    fieldImages.push(newImg);
    this.imageBlobUrls[tempId] = this.sanitizer.bypassSecurityTrustUrl(tempBlobUrl);
    this.fieldImages[field_id] = fieldImages;   // keep UI in sync while uploading
    return { blob, type, tempId, tempBlobUrl };
  }

  private async uploadFile(
    blob: File | Blob,
    type: string,
    tempId: string,
    tempBlobUrl: string,
    field_id: any,
    fieldImages: any[]
  ) {
    const formData = new FormData();
    formData.append('survey_id', this.survey_id);
    formData.append('file', blob);
    formData.append('field_id', field_id);
    formData.append('data_id', this.data_id);
    formData.append('file_type', 'image');
    formData.append('type', type);
    formData.append('purpose', 'add_survey_file');

    try {
      const response: any = await this.core.post('data', formData);
      if (response?.status === 1) {
        this.core.toast('success', response.msg);
        const serverImg = { ...response.file, type, timestamp: Date.now(), blink: true };
        const idx = fieldImages.findIndex(img => img.id === tempId);
        if (idx > -1) {
          fieldImages[idx] = serverImg;
        }
        const fileUrl = this.imgUrl + serverImg.file_name;
        try {
          const serverBlob = await this.core.fetchAzureBlob(fileUrl);
          this.imageBlobUrls[serverImg.id] = this.sanitizer.bypassSecurityTrustUrl(
            URL.createObjectURL(serverBlob)
          );
        } catch {
          this.core.toast('warn', 'Failed to fetch server image');
          serverImg.isMissed = true;
          this.imageBlobUrls[serverImg.id] = this.missedImage;
        }
      } else {
        this.core.toast('error', response.msg);
        fieldImages.splice(fieldImages.findIndex(img => img.id === tempId), 1);
      }
    } catch {
      this.core.toast('error', 'Unable to add file');
      fieldImages.splice(fieldImages.findIndex(img => img.id === tempId), 1);
    } finally {
      URL.revokeObjectURL(tempBlobUrl);
      delete this.imageBlobUrls[tempId];
      this.fieldImages[field_id] = fieldImages;
    }
  }

  private async processAndUploadFile(file: File, field_id: any, fieldImages: any[]) {
    if (file.name.toLowerCase().endsWith('.pdf')) {
      fieldImages.push({
        file_name: '',
        field_id,
        data_id: this.data_id,
        file_type: 'image',
        type: 'pdf',
        blink: true,
      });
    }
    const reader = new FileReader();
    reader.onload = async (env: any) => await this.handleFileRead(env, file, field_id, fieldImages);
    reader.readAsDataURL(file);
  }

  private async handleFileRead(env: any, file: File, field_id: any, fieldImages: any[]) {
    const type = env.currentTarget.result.startsWith('data:application/pdf;') ? 'pdf' : 'img';
    let compressedFile: any = env.currentTarget.result;
    if (type === 'img') {
      compressedFile = await this.imageCompresser(env.currentTarget.result);
    }
    const si = compressedFile.indexOf(':');
    const ei = compressedFile.indexOf(';');
    const mime = compressedFile.substring(si + 1, ei);

    const blobImg = await fetch(compressedFile).then(r => r.blob());
    const newFile = new File([blobImg], file.name.toLowerCase(), { type: mime });

    const formData = new FormData();
    formData.append('survey_id', this.survey_id);
    formData.append('file', newFile);
    formData.append('field_id', field_id);
    formData.append('data_id', this.data_id);
    formData.append('file_type', 'image');
    formData.append('type', type);
    formData.append('purpose', 'add_survey_file');

    // Remove PDF placeholder if present
    if (type === 'pdf') {
      fieldImages.pop();
    }

    const tempImg = { file_name: compressedFile, field_id, data_id: this.data_id, file_type: 'image', type, blink: true };
    fieldImages.push(tempImg);

    try {
      const response: any = await this.core.post('data', formData);
      fieldImages.pop();                     // remove temp entry
      if (response?.status === 1) {
        this.core.toast('success', response.msg);
        response.file.type = type;
        response.file.timestamp = Date.now();
        fieldImages.push(response.file);
      } else {
        this.core.toast('error', response.msg);
      }
    } catch {
      this.core.toast('error', 'Unable to add file');
      fieldImages.pop();
    }
  }
  
  private readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  }

  async onNewImageUpdated(event: any, imgData: any) {
    if (event?.target?.files?.length !== 1) {
      return;
    }
    if (Array.from(event.target.files).some((d: any) => d.size > this.MAX_FILE_SIZE)) {
      this.core.toast('warn', 'File size should not exceed 5MB');
      return;
    }

    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = async (env: any) => await this.handleImageUpdate(env, file, imgData);
    reader.readAsDataURL(file);
  }

  private async handleImageUpdate(env: any, file: File, imgData: any) {
    const type = env.currentTarget.result.startsWith('data:application/pdf;') ? 'pdf' : 'img';
    let compressedFile: any = env.currentTarget.result;
    if (type === 'img') {
      compressedFile = await this.imageCompresser(env.currentTarget.result);
    }

    const si = compressedFile.indexOf(':');
    const ei = compressedFile.indexOf(';');
    const mime = compressedFile.substring(si + 1, ei);

    const blobImg = await fetch(compressedFile).then(r => r.blob());
    const newFile = new File([blobImg], file.name.toLowerCase(), { type: mime });

    const formData = new FormData();
    formData.append('survey_id', this.survey_id);
    formData.append('file', newFile);
    formData.append('field_id', imgData.field_id);
    formData.append('data_id', this.data_id);
    formData.append('file_type', 'image');
    formData.append('file_id', imgData.file_id);
    formData.append('id', imgData.id);
    formData.append('type', type);
    formData.append('purpose', 'update_survey_file');

    try {
      const response: any = await this.core.post('data', formData);
      if (response?.status === 1) {
        this.core.toast('success', response.msg);
        imgData.isMissed = false;
        imgData.type = type;
        imgData.timestamp = Date.now();
      } else {
        this.core.toast('error', response.msg);
      }
    } catch {
      this.core.toast('error', 'Unable to update file');
    }
  }

  async imageCompresser(file: any) {
    return await new Promise((res, rej) => {
      this.imageCompress
        .compressFile(file, 1, 50, 50) // 50% ratio, 50% quality
        .then((compressedImage) => {
          res(compressedImage);
        });
    });
  }

  onImageAddClick(imageInput: any) {
    imageInput.value = null;
    imageInput.click();
  }

  async onDeleteClick(event: Event, gallery: any, indx: number, field_id: any): Promise<void> {
    const confirmation = await this.confirmDelete(event, gallery, indx, field_id);
    if (!confirmation) {
      return;
    }
    const { img, isPDF } = confirmation;
    const isMunichRe = this.projectContext === 'munichre';
    await this.executeDelete(img.id, indx, field_id, isMunichRe);
  }

  private async confirmDelete(event: Event, gallery: any, indx: number, field_id: any): Promise<{ confirmed: boolean; img: any; isPDF: boolean } | null> {
    event.stopPropagation();
    event.preventDefault();
    this.gallery = gallery;
    this.gallery?.LG?.closeGallery();
    const images = this.fieldImages[field_id];
    if (!images?.length) {
      return null;
    }
    const img = images[indx];
    if (!img?.id) {
      return null;
    }
    const isMunichRe = this.projectContext === 'munichre';
    const isPDF = img.type?.toLowerCase() === 'pdf' || img.file_name?.toLowerCase().endsWith('.pdf');
    let previewUrl = './assets/images/pdf-icon.png';
    if (!isPDF) {
      if (isMunichRe) {
        const safeUrlObj = this.imageBlobUrls[img.id] as SafeUrl;
        previewUrl = this.sanitizer.sanitize(SecurityContext.URL, safeUrlObj) || this.missedImage;
      } else {
        previewUrl = `${this.imgUrl}${img.file_name}${this.imgUrlSuffix}`;
      }
    }
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to delete the ${isPDF ? 'PDF' : 'Image'}?`,
      showCancelButton: true,
      confirmButtonColor: '#497ba2',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
      imageUrl: previewUrl,
      imageWidth: 400,
      imageHeight: 200,
    });
    return result.isConfirmed ? { confirmed: true, img, isPDF } : null;
  }

  private async executeDelete(deleteId: number, indx: number, field_id: any, isMunichRe: boolean): Promise<void> {
    const request = { purpose: 'delete_survey_file', file_id: deleteId };
    this.loader++;
    try {
      const response: any = await this.core.post(request);
      if (response?.status === 1) {
        this.core.toast('success', response.msg);
        const deletedImage = this.fieldImages[field_id].splice(indx, 1);
        this.deletedImages.push(...deletedImage.map((d: any) => ({ id: d.id })));
        if (isMunichRe && this.imageBlobUrls[deleteId]) {
          const rawUrl = this.sanitizer.sanitize(SecurityContext.URL, this.imageBlobUrls[deleteId]);
          if (rawUrl) {
            URL.revokeObjectURL(rawUrl);
          }
          delete this.imageBlobUrls[deleteId];
        }
      } else {
        this.core.toast('error', response.msg || 'Failed to delete file');
      }
    } catch (err) {
      this.core.toast('error', 'Unable to remove file');
    } finally {
      this.loader--;
    }
  }

  async getKMLFile(url: any) {
    // const header = { responseType: "text" };
    return await fetch(url)
      .then((response) => response.text())
      // this.http.get(url).toPromise()
      .then((response: any) => {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(response, "text/xml");
        if (
          xmlDoc.getElementsByTagName("outerBoundaryIs").length &&
          xmlDoc.getElementsByTagName("innerBoundaryIs").length
        ) {
          Array.from(xmlDoc.getElementsByTagName("innerBoundaryIs")).forEach(
            (d) => d.remove()
          );
        }
        return toGeoJSON.kml(xmlDoc);
      })
      .catch((err) => {
        return {};
      });
  }

  async getKMLData() {
    const request = {
      purpose: "get_files",
      survey_id: this.survey_id,
      type: "kml",
      data_id: this.data.data_id,
    };
    this.loader++;
    let kmlFileInfo = null;
    await this.core
      .data_post(request)
      .then(async (response: any) => {
        if (response?.status == 1) {
          if (response?.files?.length) {
            [kmlFileInfo] = response.files;
            if (kmlFileInfo.coordinates) {
              this.geoJsonData = this.geoMapper.stringToGeojson(
                kmlFileInfo.coordinates
              );
            } else {
              const url = this.kmlUrl + kmlFileInfo?.file_name;
              const geoJsonData = await this.getKMLFile(url);
              this.geoJsonData = geoJsonData.features;
            }
            // this.action.emit({purpose: 'geojson-update', geoJsonData: this.geoJsonData})
            // if (this.geoJsonData) {
            //   const coordinates = this.geoJsonData.find((d: any) => d.geometry)?.geometry.coordinates?.find((d: any) => d.length)?.find((d: any) => d.length);
            //   if (coordinates?.length) {
            //     this.lat = coordinates[1];
            //     this.lng = coordinates[0];
            //   }

            // }
          }
          setTimeout(() => {
            this.showMap = true;
          });
        } else {
          this.core.toast("error", response.message);
        }
      })
      .catch((err) => {
        this.core.toast("error", "unable to fetch kml details");
      })
      .finally(() => this.loader--);
  }

  async updateStatus(purpose: any) {
    if (purpose == "approve_data") {
      if (!this.validateData(this.data)) {
        return;
      }
      const imageFields = this.fields
        .filter(
          (d) =>
            this.fields.find((e) => e.field_id == d.parent_id)?.type == "tab"
        )
        .filter((field) => field.type == "file" && field.subtype == "image");
      const canApprove = imageFields.every(
        (d: any) => !d.required || this.fieldImages[d.field_id]?.length
      );
      if (!canApprove) {
        this.core.toast(
          "warn",
          "Please make sure the mandatory image fields have at-least one image!"
        );
        return;
      }
      let missedImg = "";
      for (const key in this.fieldImages) {
        if (
          this.fieldImages[key]?.length &&
          this.fieldImages[key].some((img: any) => img.isMissed)
        ) {
          const label = this.fields.find((f) => f.field_id == key)?.label || "";
          missedImg = `${label} field has unsynced image(s). Please reupload a proper image.`;
          break;
        }
      }
      if (missedImg) {
        this.core.toast("warn", missedImg);
        return;
      }
      if (!this.geoJsonData) {
        await this.getKMLData();
        if (!this.geoJsonData && !['8', '9', '10', '11'].includes(this.survey_id.toString())) {
          this.core.toast(
            "warn",
            "KML is missing, please make sure user has synced KML."
          );
          return;
        }
      }
      if (this.survey_id == 2) {
        let errorMsg = "";
        for (let i = 0; i < this.fields.length; i++) {
          const field = this.fields[i];
          if (
            field.requiredBankDetails &&
            !this.data["field_" + field.field_id]
          ) {
            errorMsg = `${field.label} is requrired.`;
            break;
          }
        }
        if (!errorMsg) {
          const intimation_no = this.projectContext === 'munichre' ? 9 : 8
          if (this.surveyIntimationTextData.freeText?.length != intimation_no) {
            errorMsg = `Invalid intimation number`;
          }
          if ([1, 2, 3, 4].includes(+this.user?.user_role)) {
            if (this.intimationNoPrefix?.length != 14) {
              errorMsg = `Invalid intimation number`;
            }
            if (this.surveyIntimationTextData.static != "INT") {
              errorMsg = `Invalid prefix in intimation number`;
            }
            if (this.surveyIntimationTextData.year?.length != 4) {
              errorMsg = `Invalid year in intimation number`;
            }
            if (
              this.surveyIntimationTextData.year !=
              this.yearCodeMap.get(this.data["field_953"])
            ) {
              errorMsg = `Invalid year code in intimation number`;
            }
            if (this.surveyIntimationTextData.state?.length != 2) {
              errorMsg = `Invalid state in intimation number`;
            }
            if (
              this.surveyIntimationTextData.state !=
              this.stateCodeMap.get(this.data["field_528"])
            ) {
              errorMsg = `Invalid state code in intimation number`;
            }
            if (this.surveyIntimationTextData.season?.length != 2) {
              errorMsg = `Invalid season in intimation number`;
            }
            if (
              this.surveyIntimationTextData.season !=
              this.seasonCodeMap.get(this.data["field_526"])
            ) {
              errorMsg = `Invalid season code in intimation number`;
            }
          }
        }
        if (!errorMsg && this.data["field_720"] == "No loss") {
          if (!errorMsg && this.data["field_548"] != 0) {
            errorMsg =
              'Damaged/Affected Area (Hect) value must be 0 if Survey type is "no loss"';
          }
          if (!errorMsg && this.data["field_550"] != 0) {
            errorMsg = 'Loss % value must be 0 if Survey type is "no loss"';
          }
        }

        if (errorMsg) {
          this.core.toast("warn", errorMsg);
          return;
        }
      }
    }
    if (this.survey_id == 3) {
    }
    let confirmButtonText = "";
    if (purpose == "approve_data") {
      confirmButtonText = "Yes, Approve it";
    } else if (purpose == "reject_data") {
      confirmButtonText = "Yes, Reject it";
    } else {
      confirmButtonText = "Yes, Revert it";
    }
    Swal.fire({
      title: "Are you sure?",
      text: "You want to update the status?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#497ba2",
      cancelButtonColor: "#d33",
      confirmButtonText,
    }).then((result) => {
      if (result.isConfirmed) {
        const request = {
          purpose,
          survey_id: this.survey_id,
          data: [{ id: this.data.id }],
        };
        this.loader++;
        this.core
          .post(request)
          .then((response: any) => {
            if (response.status == 1) {
              this.core.toast("success", response.msg);
              if (this.isChild) {
                this.emitAction.emit();
              }
            } else {
              this.core.toast("error", response.msg);
            }
          })
          .catch((err) => {
            this.core.toast("error", "Unable to update approve status");
          })
          .finally(() => this.loader--);
      }
    });
  }

  delay(param: any) {
    new Promise((resolve) => resolve(param)).then(param());
  }

  validateDateFields(tab: any, isChanged?: any) {
    if (tab.childs?.length) {
      for (let i = 0; i < tab.childs.length; i++) {
        const child = tab.childs[i];
        child.disabled = true;
        child.invalid = false;
        if (
          this.data[`field_${tab.field_id}`] &&
          ((tab.type != "lkp_crop" &&
            child.parent_value?.includes(this.data[`field_${tab.field_id}`])) ||
            (tab.type == "lkp_crop" &&
              this.data["field_501"] == 15 &&
              child.parent_value?.includes(this.data[`field_${tab.field_id}`])))
        ) {
          child.disabled = false;
        }

        if (
          !this.data["field_" + child.field_id] &&
          child.required &&
          !child.disabled
        ) {
          child.invalid = true;
        }

        if (isChanged) {
          this.data[`field_${child.field_id}`] = null;
          const element = this.chmDom.querySelector(
            `[data-field-id="field_${child.field_id}"]`
          );
          if (element) {
            element.value = null;
          }
        }

        if (child?.childs?.length) {
          this.validateDateFields(child);
        }
      }
    }
    tab.invalid =
      !this.data["field_" + tab.field_id] && tab.required && !tab.disabled;
    if (tab.type != "tab") {
      tab.showChildern = tab.childs.some((child: any) => {
        return !child.disabled;
      });
      tab.showChild = tab.showChildern;
    }
  }

  lazyLoadImage() {
    const images = this.chmDom.querySelectorAll("[data-src]");
    const preloadImages = (img: any) => {
      const src = img.getAttribute("data-src");
      if (!src) {
        return;
      }
      img.src = src;
    };
    const imageOPtions = {};
    const imagesObserver = new IntersectionObserver(
      (entries: any, imgObserver: any) => {
        entries.forEach((entry: any) => {
          if (!entry.isIntersecting) {
            return;
          } else {
            preloadImages(entry.target);
            imgObserver.unobserve(entry.target);
          }
        });
      },
      imageOPtions
    );

    images.forEach((image: any) => {
      imagesObserver.observe(image);
    });
  }

  openInGallery(url: string | SafeUrl | SafeResourceUrl, fileType: string = '') {
    this.isPdf = false;
    if (this.projectContext === 'munichre') {
      const urlString = typeof url === 'string' ? url : this.sanitizer.sanitize(SecurityContext.URL, url) || '';
      this.isPdf = fileType === 'application/pdf' || urlString.toLowerCase().endsWith('.pdf') || urlString.toLowerCase().includes('.pdf?');
      if (this.isPdf && !urlString.startsWith('blob:') && !urlString.startsWith('data:')) {
        this.galleryUrl = this.sanitizer.bypassSecurityTrustResourceUrl(urlString);
      } else {
        this.galleryUrl = url;
      }
      const modalRef = this.modalService.open(this.galleryModel, {
        size: 'xl', scrollable: true, centered: true, windowClass: 'dark-modal'
      });
      if (this.isPdf) {
        this.openPdfInNewTab();
      }
    } else {
      const lowerUrl = typeof url === 'string' ? url.toLowerCase() : '';
      this.isPdf = lowerUrl.startsWith('data:application/pdf;') || lowerUrl.endsWith('.pdf') || lowerUrl.includes('.pdf?');
      this.galleryUrl = this.isPdf ? this.sanitizer.bypassSecurityTrustHtml( `<iframe class="w-100" src="${url}" height="800"></iframe>` ) : url;
      this.modalService.open(this.galleryModel, {
        size: 'xl', scrollable: true, centered: true, windowClass: 'dark-modal',
      });
    }
  }

  openPdfInNewTab() {
    const rawUrl = this.sanitizer.sanitize(SecurityContext.URL, this.galleryUrl);
    if (rawUrl) {
      window.open(rawUrl, '_blank');
    } else {
      this.core.toast('error', 'Failed to extract raw URL for new tab');
    }
  }

  onImageError(imageData: any) {
    if (imageData) {
      imageData.isMissed = true;
    }
  }

  toggleZoom(event: any) {
    if (event?.target) {
      event?.target?.classList?.toggle("w-100");
    }
  }

  exportPDF() {
    this.printingMsg = "Generating PDF, please wait...";
    setTimeout(() => {
      const content = this.element.nativeElement.querySelector("div");
      const width =
        Math.max(
          ...Array.from(content.querySelectorAll("table")).map(
            (d: any) => d.clientWidth
          )
        ) + 250;
      const height = content.clientHeight + 500;
      const map =
        this.element.nativeElement.querySelector(".leaflet-container");
      const option = {
        width: map?.clientWidth,
        height: map?.clientHeight,
        quality: 0.5,
      };
      const removePrinting = () => {
        this.isPrinting--;
        this.printingMsg = "";
      };
      const downloadPDF = () => {
        setTimeout(() => {
          this.printingMsg = "Downloading PDF, please wait...";
          const doc = new jsPDF("l", "mm", [width, height]);
          doc.html(content, {
            callback: function (doc) {
              doc.save("report.pdf");
              removePrinting();
            },
            x: 10,
            y: 10,
            margin: 100,
          });
        });
      };
      if (map) {
        domtoimage.toJpeg(map, option).then((res) => {
          this.isPrinting++;
          this.mapImgSrc = res;
          downloadPDF();
        });
      } else {
        this.isPrinting++;
        downloadPDF();
      }
    });
  }

  async makeSvgDataUri(node: any, width: any, height: any) {
    return Promise.resolve(node)
      .then(function (node) {
        node.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");
        return new XMLSerializer().serializeToString(node);
      })
      .then((data: any) => data.replace(/#/g, "%23").replace(/\n/g, "%0A"))
      .then(function (xhtml) {
        return (
          '<foreignObject x="0" y="0" width="100%" height="100%">' +
          xhtml +
          "</foreignObject>"
        );
      })
      .then(function (foreignObject) {
        return (
          '<svg xmlns="http://www.w3.org/2000/svg" width="' +
          width +
          '" height="' +
          height +
          '">' +
          foreignObject +
          "</svg>"
        );
      })
      .then(function (svg) {
        return "data:image/svg+xml;charset=utf-8," + svg;
      });
  }

  onlyNumberKeyDown(event: any): any | void {
    const actionKeys = ["KeyV", "KeyC", "KeyX", "KeyA"];
    const allowedKeys = [
      "Tab",
      "Shift",
      "Control",
      "Home",
      "End",
      "PageUp",
      "PageDown",
      "ArrowLeft",
      "ArrowRight",
      "ArrowUp",
      "ArrowDown",
      "Backspace",
    ].concat(Array.from({ length: 12 }, (_, i) => `F${i + 1}`));

    if ((event.ctrlKey || event.metaKey) && actionKeys.includes(event.code)) {
      return;
    }

    if (allowedKeys.includes(event.key) || allowedKeys.includes(event.code)) {
      return;
    }

    if (
      !(event.key >= 0 && event.key <= 9) &&
      !(event.key >= "0" && event.key <= "9")
    ) {
      event.stopPropagation();
      event.preventDefault();
      return false;
    }
  }

  showMediaImages() {
    this.showMedia = true;
    this.getImagesData(this.imageFields);
  }
  showSignatureImages() {
    this.showSignature = true;
    this.getImagesData(this.imageFields);
  }
}
