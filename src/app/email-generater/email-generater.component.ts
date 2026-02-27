import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import * as moment from "moment";
import * as XLSX from "xlsx";
import { UserDetailService } from "../auth/user-detail.service";
import { CoreService } from "../utilities/core.service";
import { FilterService } from "../utilities/filter.service";

@Component({
  selector: "app-email-generater",
  templateUrl: "./email-generater.component.html",
  styleUrls: ["./email-generater.component.css"],
})
export class EmailGeneraterComponent implements OnInit {
  allData: any[] = [];
  surveyData: any[] = [];
  revisitData: any[] = [];
  clientData: any[] = [];
  statesData: any[] = [];
  districts: any[] = [];
  clientMap: Map<any, any> = new Map();
  stateMap: Map<any, any> = new Map();
  districtMap: Map<any, any> = new Map();
  tehsilMap: Map<any, any> = new Map();
  blockMap: Map<any, any> = new Map();
  grampanchayatMap: Map<any, any> = new Map();
  villageMap: Map<any, any> = new Map();
  cropMap: Map<any, any> = new Map();
  notifiedMap: Map<any, any> = new Map();
  yearMap: Map<any, any> = new Map();
  seasonMap: Map<any, any> = new Map();
  message: any = '';
  selectedClient: any = '';
  disableSelect = true;
  exportType: any = '';
  exportButtonText: any = '';
  fieldsData: any[] = [];
  surveyDataWithLabel: any[] = [];
  endData = moment().format('YYYY-MM-DD'); // moment().subtract(1, "days").format('YYYY-MM-DD');
  startDate = '2022-06-01';
  season: any = '2';
  year: any[] = ['3'];
  allIUs: any[] = [];
  revisitMap: Map<any, any> = new Map();
  seasonList: any[] = [
    {value: '1', label: `Rabi (2022-10-01 - ${moment().format('YYYY-MM-DD')})`},
    {value: '2', label: `Kharif (2022-06-01 - ${moment().format('YYYY-MM-DD')})`}
  ]

  constructor(private core: CoreService, private filter: FilterService, private userService: UserDetailService, private route: Router) {}

  ngOnInit(): void {
    const user = this.userService.getUserDetail();
    if ([1,2].includes(+user.user_role)) {
      this.exportType = this.route.url === '/generate-email-excel' ? 'excel' : 'email';
      this.exportButtonText = this.exportType === 'excel' ? 'Download Excel' : 'Send Email';
      this.getFilterData();
      return;
    }
    this.route.navigate(['/']);
  }

  getFilterData() {
    this.message = 'Locations are Loading. Please wait...';
    if (this.filter.isDistrictFetched) {
      this.setInputData();
    } else {
      this.filter.fetchedDistrictData.subscribe(() => {
        this.setInputData();
      });
    }
  }

  setInputData() {
    this.clientData = this.filter.lookupData?.clients;
    this.statesData = this.filter.lookupData?.states;
    this.districts = this.filter.districts;
    this.message = 'Location fetched successfully';
    setTimeout(() => this.message = '', 500)
    for (let i = 0; i < this.clientData.length; i++) {
      const client = this.clientData[i];
      this.clientMap.set(client.UNIT_ID, client.UNIT_NAME)
    }
    for (let i = 0; i < this.statesData.length; i++) {
      const state = this.statesData[i];
      this.stateMap.set(state.state_id, state.state_name)
    }
    for (let i = 0; i < this.districts.length; i++) {
      const district = this.districts[i];
      this.districtMap.set(district.district_id, district.district_name)
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
    for (let i = 0; i < this.filter.crops.length; i++) {
      const crop = this.filter.crops[i];
      this.cropMap.set(+crop.crop_code, crop.crop_name)
    }
    for (let i = 0; i < this.filter.notifiedUnits.length; i++) {
      const notifiedUnit = this.filter.notifiedUnits[i];
      this.notifiedMap.set(notifiedUnit.notified_id, notifiedUnit.notified_unit_name)
    }
    for (let i = 0; i < this.filter.years.length; i++) {
      const year = this.filter.years[i];
      this.yearMap.set(year.id, year.year)
    }
    for (let i = 0; i < this.filter.seasons.length; i++) {
      const season = this.filter.seasons[i];
      this.seasonMap.set(season.id, season.season_name)
    }
    this.disableSelect = !this.clientData.length;
    // this.getPlanandCCEData();
  }

  onSeasonChange(event: any) {
    if (event == 1) {
      this.startDate = '2022-10-01';
    } else {
      this.startDate = '2022-06-01';
    }
  }

  async getPlanandCCEData() {
    this.allIUs = [];
    this.allData = [];
    this.fieldsData = [];
    this.surveyData = [];
    this.surveyDataWithLabel = [];
    this.disableSelect = true
    const clients: any[] = this.selectedClient ? [this.selectedClient] : this.filter.clients.map(d => d.UNIT_ID);
    let distIds: any[] = [];
    let states: any[] = [];
    await this.core.dashboard_post('result/get_all_client_district',  {client_id: clients}).then((res: any) => {
      if (res.status ==1 ) {
        distIds = res.districts;
        states = res.states;
      }
    }).catch((err) => console.error(err));
    
    this.clearDetails();
    this.message = 'Loading CCE and Plan data. Please wait...';
    const planRequest = {
      purpose: "get_chm_data",
      state: states,
      district: distIds,
      tehsil: [],
      crop: [],
      seasons: [this.season],
      years: this.year,
      notified_units: [],
      client_id: clients
    };

    const cceRevisitRequest = {
      purpose: "get_surveydata",
      survey_id: "7",
      states: states,
      districts: distIds,
      tehsils: [],
      start_date: this.startDate,
      end_date: this.endData,
      crop_id: [],
      seasons: [this.season],
      years: this.year,
      notified_units: [],
      client_id: clients,
      user_id: [],
    };

    const cceRequest = {
      purpose: "get_surveydata",
      survey_id: "3",
      crop_column: "field_593",
      states: states,
      districts: distIds,
      tehsils: [],
      start_date: this.startDate,
      end_date: this.endData,
      crop_id: [],
      seasons: [this.season],
      years: this.year,
      notified_units: [],
      client_id: clients,
      user_id: [],
    };

    const cceFieldsRequest = {purpose:"get_surveyfields",survey_id:"3",}

    const promises: any[] = [planRequest, cceRevisitRequest, cceRequest];
    if (this.exportType === 'excel') {
      promises.push(cceFieldsRequest);
    }

    Promise.all(promises.map((d) => this.core.dashboard_post(d)))
      .then((responses: any) => {
        if (responses?.[0]?.status == 1) {
          // const distIds =this.districts.map((d: any) => d.district_id)
          // this.allData = (responses[0]?.allData || []).filter((d: any) => !distIds?.length || distIds.includes(d.dist_id));
          const allData = (responses[0]?.allData || []);
          for (let i = 0; i < allData.length; i++) {
            const result = allData[i];
            // && ![20708000,20708001,20708002].includes(+result.crop)
            if (+(result.no_of_CCEs_planned || 0) > 0 ) {
              result.state_name = this.stateMap.get(result.state_id);
              result.dist_name = this.districtMap.get(result.dist_id);
              result.tehsil_name = this.tehsilMap.get(result.tehsil_id);
              result.notified_unit_name = this.notifiedMap.get(result.notified_unit)
              if (result.notified_unit == 1) {
                result.gp_notified_area_name = (this.grampanchayatMap.get(result.gp_notified_area) || result.gp_notified_area);
              } else if (result.notified_unit == 2) {
                result.gp_notified_area_name = (this.blockMap.get(result.gp_notified_area) || result.gp_notified_area);
              } else if (result.notified_unit == 3) {
                result.gp_notified_area_name = (this.tehsilMap.get(result.gp_notified_area) || result.gp_notified_area);
              } else if (result.notified_unit == 4) {
                result.gp_notified_area_name = (this.villageMap.get(result.gp_notified_area) || result.gp_notified_area);
              } else if (result.notified_unit == 5) {
                result.gp_notified_area_name = (this.districtMap.get(result.gp_notified_area) || result.gp_notified_area);
              }
              result.crop_name = this.cropMap.get(+result.crop)
              result.year_name = this.yearMap.get(result.year)
              result.season_name = this.seasonMap.get(result.season)
              this.allData.push(result)
            }

          }

          this.allIUs = [
            ...new Set(
              this.allData.map(
                (d: any) =>
                `${d.gp_notified_area}=>${d.notified_unit}=>${d.crop}=>${d.state_id}=>${d.dist_id}=>${d.year}=>${d.season}`
              )
            ),
          ];
        }
        if (responses?.[1]?.status == 1) {
          const revisitData = (responses[1].surveydata || []).sort((a: any,b: any) => a.datetime.localeCompare(b.datetime));
          for (let i = 0; i < revisitData.length; i++) {
            const data = revisitData[i];
            if (!this.revisitMap.get(data.case_ID)) {
              this.revisitMap.set(data.case_ID, [])
            }
            this.revisitMap.set(data.case_ID, [...this.revisitMap.get(data.case_ID), data])
          }
          this.revisitData = revisitData;
        }
        if (responses?.[2]?.status == 1) {
          const surveyData = responses[2].surveydata || [];
          for (let i = 0; i < surveyData.length; i++) {
            const data = surveyData[i];
            // if (![20708000,20708001,20708002].includes(+data.field_593)) {
              data.revisit = 1;
              data.dry_weight = null
              if (data.field_623?.toLowerCase().trim() === 'single step') {
                if (!(data.field_627 === '' || data.field_627 === null)) {
                  data.dry_weight = +data.field_627
                  this.surveyData.push(data)
                }
              } else {
                const revisitData = this.revisitMap.get(data.case_ID);
                data.revisit = revisitData?.length;
                if (revisitData?.length) {
                  const all_weights: any[] = [+(data.field_624 || data.field_651)];
                  let revist_cycle = 1
                  if (data.field_585 == 7) {
                    revist_cycle = 2
                  }
                  if (revisitData.length > revist_cycle) {
                    revist_cycle = revisitData.length;
                  }
                  for (let j = 0; j < revist_cycle; j++) {
                    const revisit_data = revisitData[j];
                    if (revisit_data) {
                      if (revisit_data.field_780?.toLowerCase().trim() === 'dry weight') {
                        all_weights.push(+revisit_data.field_769)
                      } else {
                        all_weights.push(+revisit_data.field_781)
                      }
                    } else {
                      all_weights.push(Math.min(...all_weights))
                    }
                  }
                  data.dry_weight = all_weights.reduce((a: any,b: any) => +a + +b)
                  this.surveyData.push(data);
                }
              }
            // }
          }
          // this.surveyData = (responses[2].surveydata || []).filter((d: any) => ![20708000,20708001,20708002].includes(+d.field_593) && );
        }
        if (responses?.[3]?.status == 1) {
            this.fieldsData = responses?.[3].fields;
            if (this.surveyData?.length) {
              const surveyDataWithLabel: any[]=[]
              for (let i = 0; i < this.surveyData.length; i++) {
                const surveyData = this.surveyData[i];
                const datawithLabel: any = {"Id": surveyData.id, "Data Id": surveyData.data_id, "Case Id": surveyData.case_ID};
                for (let fi = 0; fi < this.fieldsData.length; fi++) {
                  const field = this.fieldsData[fi];
                  datawithLabel[field.display_name || field.label] = surveyData[`field_${field.field_id}`]
                  if (+field.field_id === 585) {
                    datawithLabel["state name"] = this.stateMap.get(surveyData.field_585) || surveyData.field_585;
                }
                if (+field.field_id === 586) {
                    datawithLabel["district name"] = this.districtMap.get(surveyData.field_586) || surveyData.field_586;
                }
                if (+field.field_id === 587) {
                    datawithLabel["tehsil name"] = this.tehsilMap.get(surveyData.field_587) || surveyData.field_587;
                }
                if (+field.field_id === 588) {
                    datawithLabel["block name"] = this.blockMap.get(surveyData.field_588) || surveyData.field_588;
                }
                if (+field.field_id === 591) {
                    datawithLabel["grampanchayat name"] = this.grampanchayatMap.get(surveyData.field_591) || surveyData.field_591;
                }
                if (+field.field_id === 592) {
                    datawithLabel["village name"] = this.villageMap.get(surveyData.field_592) || surveyData.field_592;
                }
                if (+field.field_id === 593) {
                    datawithLabel["crop name"] = this.cropMap.get(+surveyData.field_593) || surveyData.field_593;
                }
                if (+field.field_id === 583) {
                    datawithLabel["year name"] = this.yearMap.get(surveyData.field_583) || surveyData.field_583;
                }
                if (+field.field_id === 584) {
                    datawithLabel["season name"] = this.seasonMap.get(surveyData.field_584) || surveyData.field_584;
                }

                // datawithLabel["First_Step"] = surveyData.first_step;
                // datawithLabel["Second_Step"] = surveyData.second_step;
                // datawithLabel["Third_Step"] = surveyData.third_step;
                datawithLabel["Dry_Weight"] = surveyData.dry_weight;

              }
              surveyDataWithLabel.push(datawithLabel);
              }
              this.surveyDataWithLabel = surveyDataWithLabel;
            }
        }
        this.message = 'CCE and Plandata are loaded';
        this.message = 'Calculating IU data, Please wait...';
        this.generateData();
      })
      .catch((err) => {
        this.message = 'Unable to load CCE and Plan data';
        this.disableSelect = false
      })
      .finally(() => {});
  }

  generateData() {
    
    const getMaxDate = (surveyData: any[]) => {
      if (!surveyData?.length) {
        return null;
      }
      return Math.max(...surveyData.map(d => new Date(new Date(d.datetime).setHours(0,0,0,0)).getTime()))
    }
    const getMinDate = (surveyData: any[]) => {
      if (!surveyData?.length) {
        return null;
      }
      return Math.min(...surveyData.map(d => new Date(new Date(d.datetime).setHours(0,0,0,0)).getTime()))
    }

    // if (1 === 1) {
    //   return
    // }
   

    const getAreaWeight = (data: any, plotSize: any): any[] => {
      if (!data?.length) {
        return [0, 0];
      }

      const areaWeght = data.map((d: any) => {
        const result = { area: 0, weight: 0 };
        result.area = plotSize;
        result.weight = Number(d.dry_weight || 0);
        return result;
      });
      const area = areaWeght
        .map((d: any) => +(d.area || 0))
        .reduce((a: any, b: any) => a + b, 0);
      const weight = areaWeght
        .map((d: any) => +(d.weight || 0))
        .reduce((a: any, b: any) => a + b, 0);

      return [area || 0, weight || 0];
    };

    const totalCalc = {'total_exposure': 0, 'total_planned_exposure': 0, 'total_co-witness': 0, 'claim_amount': 0, 'gross_premium': 0}
    const iu_crop_level_data: any[] = [];

    const totData = this.allIUs.map((ele: any) => {
      const result: any = {};
      const notifyInfo = ele.split("=>").map((d: any) => d.trim());
      result.data = this.allData.find(
        (d) =>
          d.gp_notified_area == notifyInfo[0] &&
          d.notified_unit == notifyInfo[1] &&
          d.crop == notifyInfo[2] &&
          d.state_id == notifyInfo[3] &&
          d.dist_id == notifyInfo[4] &&
          d.year == notifyInfo[5] &&
          d.season == notifyInfo[6]
      );
      result.surveyData = this.surveyData.filter(
        (e: any) =>
          result.data.crop == e.field_593 &&
          result.data.state_id == e.field_585 &&
          result.data.notified_unit == e.field_589 &&
          result.data.dist_id == e.field_586 &&
          result.data.year == e.field_583 &&
          result.data.season == e.field_584 &&
          ((result.data.notified_unit == 1 &&
            result.data.gp_notified_area == e.field_591) ||
            (result.data.notified_unit == 2 &&
              result.data.gp_notified_area == e.field_588) ||
            (result.data.notified_unit == 3 &&
              result.data.gp_notified_area == e.field_587) ||
            (result.data.notified_unit == 4 &&
              result.data.gp_notified_area == e.field_592) ||
            (result.data.notified_unit == 5 &&
              result.data.gp_notified_area == e.field_586))
      );
      result.state_id = result.data.state_id;
      result.state_name = result.data.state_name;
      result.dist_id = result.data.dist_id;
      result.dist_name = result.data.dist_name;
      result.tehsil_id = result.data.tehsil_id;
      result.tehsil_name = result.data.tehsil_name
      result.notified_unit = result.data.notified_unit;
      result.notified_unit_name = result.data.notified_unit_name;
      result.gp_notified_area = result.data.gp_notified_area;
      result.gp_notified_area_name = result.data.gp_notified_area_name;
      result.crop = result.data.crop;
      result.crop_name = result.data.crop_name
      result.threshold_yield = +result.data.threshold_yield || 0;
      result.draige_factor = +result.data.draige_factor || 0;
      result.gross_premium = +result.data.gross_premium || 0;
      result.sum_insured = +result.data.sum_insured || 0;
      result.expected = +result.data.expected_yield || 0;
      result.no_of_CCEs_planned = +result.data.no_of_CCEs_planned || 0;
      result.season = result.data.season;
      result.season_name = result.data.season_name
      result.year = result.data.year;
      result.year = result.data.year
      result.date_of_sowing = result.data.date_of_sowing;
      result.date_of_loss = result.data.date_of_loss;
      result.no_of_survey = result.surveyData.length;
      result.no_of_survey_revisit = result.surveyData.map((d: any) => d.revisit).reduce((a:any,b:any) => a+b,0);
      result.exposure_covered = 0;
      result.partially_completed = 0;
      result.full_completed = 0;
      result.partially_completed = 0;
      result.yet_to_start = 0;
      [result.area, result.dry_weight] = getAreaWeight(
        result.surveyData,
        +result.data.cce_plot_size
      );
      result.actual_yeild = this.actialYield(
        result.surveyData,
        result.draige_factor,
        +result.data.cce_plot_size
      );
      result.claim_amount = 0;
      result.deficiency = 0;
      result.partial_exposure_covered = 0;
      result.partial_claim_amount = 0;
      result.partial_deficiency = 0;
      result.partial_gross_premium = 0;
      result.no_of_survey_pending = Math.max(
        result.no_of_CCEs_planned - result.no_of_survey,
        0
      );

      result.survey_date = null;
      result.start_date = null;
      result.end_date = null;

      if (result.no_of_survey == 0) {
        result.yet_to_start = 1;
      } else if (
        result.no_of_survey >= Number(result.no_of_CCEs_planned || 0)
      ) {
        if (result.threshold_yield > result.actual_yeild) {
          result.deficiency =
            (result.threshold_yield - result.actual_yeild) /
            result.threshold_yield;
        }
        result.exposure_covered = result.sum_insured;
        result.full_completed = 1;
        result.claim_amount = result.deficiency * result.sum_insured;
        result.actual_loss_ratio = this.divide(
          result.claim_amount,
          result.gross_premium
        );
        result.survey_date = result.surveyData[
          result.no_of_survey - 1
        ].datetime?.substring(0, 10);
        result.start_date = getMinDate(result.surveyData)
        result.end_date = getMaxDate(result.surveyData)
      } else {
        result.partially_completed = 1;
        result.survey_date = result.surveyData[
          result.no_of_survey - 1
        ].datetime?.substring(0, 10);
        result.start_date = getMinDate(result.surveyData)
        result.end_date = getMaxDate(result.surveyData)
      }
      if (result.no_of_survey != 0) {
        if (result.threshold_yield > result.actual_yeild) {
          result.partial_deficiency =
            (result.threshold_yield - result.actual_yeild) /
            result.threshold_yield;
        }
        result.partial_exposure_covered = result.sum_insured;
        result.partial_claim_amount =
          result.partial_deficiency * result.sum_insured;
        result.partial_gross_premium = result.gross_premium;
        result.partial_loss_ratio = this.divide(
          result.partial_claim_amount,
          result.gross_premium
        );
        result.survey_date = result.surveyData[
          result.no_of_survey - 1
        ].datetime?.substring(0, 10);
        result.start_date = getMinDate(result.surveyData)
        result.end_date = getMaxDate(result.surveyData)
      }
      if (!result.full_completed) {
        const avgArea = this.divide(
          10000,
          this.divide(result.area, result.no_of_survey)
        );
        const sum_actual_yield =
          result.dry_weight * avgArea * result.draige_factor;
        const allExpectedYield = result.no_of_survey_pending * result.expected;
        const avg_actual_yield = this.divide(
          sum_actual_yield + allExpectedYield,
          result.no_of_CCEs_planned
        );
        const deficiency =
          result.threshold_yield > avg_actual_yield
            ? this.divide(
                result.threshold_yield - avg_actual_yield,
                result.threshold_yield
              )
            : 0;
        const claim = deficiency * result.sum_insured;
        result.expected_deficiency = deficiency;
        result.expected_claim = claim;
        result.expected_loss_ratio = this.divide(claim, result.gross_premium);
      } else {
        result.expected_loss_ratio = 0;
      }
      totalCalc.total_exposure += result.sum_insured;
      if (+result.no_of_survey > 0) {
        totalCalc["total_co-witness"] += result.sum_insured;
      }
      if (+result.no_of_CCEs_planned > 0) {
        totalCalc.total_planned_exposure += result.sum_insured;
      }
      totalCalc.claim_amount += result.partial_claim_amount || 0;
      totalCalc.gross_premium += result.partial_gross_premium || 0;
      if (((result.partial_loss_ratio || 0) * 100) > 70 && result.sum_insured >= 1e7 && result.no_of_CCEs_planned > 0 && result.no_of_survey < result.no_of_CCEs_planned) {
        iu_crop_level_data.push(result);
      }
      return result;
    });
    
    const dateData = this.generateDateWiseData(totData);
    const stateData = this.generateStateData(totData)
    // const districtData = this.generateDistrictData(totData)
    const stateDistCropData = this.generateStateDistrictCropData(totData)

  const jsonData: any = {...this.generateYesterdayData(totData)}
  jsonData['till_date'] = moment().subtract(1, "days").format('DD-MM-YYYY');
  jsonData['total_exposure'] = totalCalc.total_exposure;
  jsonData['total_planned_exposure'] = totalCalc.total_planned_exposure;
  jsonData['total_co-witness'] = totalCalc["total_co-witness"];
  jsonData['loss_ratio'] = this.divide(totalCalc.claim_amount, totalCalc.gross_premium);
  
  jsonData['portfolio_summary'] = dateData.map(data => {
    return {date: data.date, fully_completed: data.full_completed_sum_insured, partially_completed: data.partially_completed_sum_insured, yet_to_start: data.yet_to_start_sum_insured, loss_ratio: data.partial_loss_ratio * 100}
  });

  jsonData['state_summary'] = stateData.filter(data => data.no_of_survey > 0).map(data => {
    return {state: data.state_name, fully_completed: data.full_completed_sum_insured, partially_completed: data.partially_completed_sum_insured, yet_to_start: data.yet_to_start_sum_insured, loss_ratio: data.partial_loss_ratio * 100}
  });

  jsonData['concern_district'] = stateDistCropData.map(data => {
    return {state: data.state_name, district: data.district_name, crop: data.crop_name, fully_completed: data.full_completed_sum_insured, partially_completed: data.partially_completed_sum_insured, yet_to_start: data.yet_to_start_sum_insured, loss_ratio: data.partial_loss_ratio * 100}
  });

  jsonData['IU_crop_level'] = iu_crop_level_data.map(data => {
    let iu = '';
    if (data.notified_unit == 1) {
      iu = this.grampanchayatMap.get(data.gp_notified_area) || data.notified_unit
    } else if (data.notified_unit == 2) {
      iu = this.blockMap.get(data.gp_notified_area) || data.notified_unit
    } else if (data.notified_unit == 3) {
      iu = this.tehsilMap.get(data.gp_notified_area) || data.notified_unit
    } else if (data.notified_unit == 4) {
      iu = this.villageMap.get(data.gp_notified_area) || data.notified_unit
    } else if (data.notified_unit == 5) {
      iu = this.districtMap.get(data.gp_notified_area) || data.notified_unit
    }
    let  no_of_CCEs_planned =  data.no_of_CCEs_planned;
    if ([20708000,20708001,20708002].includes(+data.crop)) {
      if (data.state_id == 7) {
        no_of_CCEs_planned *= 3;
      } else {
        no_of_CCEs_planned *= 2;
      }
    }
    return {state: this.stateMap.get(data.state_id), district: this.districtMap.get(data.dist_id), crop: this.cropMap.get(+data.crop), iu, no_of_CCEs_planned, 'no_of_cce-witnessed': data.no_of_survey, loss_ratio: data.partial_loss_ratio * 100, }
  });

  if (this.selectedClient) {
    jsonData['client_id'] = this.selectedClient;
    jsonData['client_name'] = this.clientMap.get(this.selectedClient);
  }

  this.message = 'IU data calculated successfully.';
  
  if (this.exportType === 'excel') {
    this.downloadExcel(
      {name: 'SurveyData', data: this.surveyDataWithLabel},
      {name: 'Two_Step_or_Multipicking_Data', data: this.revisitData},
      {name: 'PlannedData', data: this.allData},
      {name: 'IUData', data: totData},
      {name: 'portfolio_summary', data: jsonData['portfolio_summary']},
      {name: 'state_summary', data: jsonData['state_summary']},
      {name: 'concern_district', data: jsonData['concern_district']},
      {name: 'district_level_cce', data: jsonData['district_level_cce']},
      {name: 'IU_crop_level', data: jsonData['IU_crop_level']},
      );
    this.disableSelect = false
  } else if (this.exportType === 'email') {
    this.message = 'Sending e-mail with calculated data, Please wait...';
     this.core.post('result/generate_email', jsonData).then((response: any) => {
      this.message = 'E-mail sent successfully.'
     }).catch((err) => {
      console.error(err);
      this.message = 'Unable to send e-mail.'
     }).finally(() => this.disableSelect = false)
  }
  }

  generateDateWiseData(totData: any[]) {
    const dates = [];
    const dateData = [];
    for(let i = 1; i<=7; i++) {
      const date = moment().subtract(i, "days").format('YYYY-MM-DD');
      const surveyData = this.surveyData.filter(d => +d.datetime?.substring(0, 10).replace(/-/g,'') <= +date.replace(/-/g,''));
      dates.push(date);
      const data = {
        date: moment(date).format('DD-MM-YYYY'),
        claim_amount: 0,
        gross_premium: 0,
        partially_completed: 0,
        full_completed: 0,
        yet_to_start: 0,
        actual_loss_ratio: 0,
        full_completed_sum_insured: 0,
        partially_completed_sum_insured: 0,
        yet_to_start_sum_insured: 0,
        partial_claim_amount: 0,
        partial_loss_ratio: 0,
        partial_gross_premium: 0,
        total_gross_premium: 0,
      };
      for (let index = 0; index < this.allIUs.length; index++) {
        const ele = this.allIUs[index];
        const result: any = {};
        const notifyInfo = ele.split("=>").map((d: any) => d.trim());
        result.data = this.allData.find(
          (d) =>
            d.gp_notified_area == notifyInfo[0] &&
            d.notified_unit == notifyInfo[1] &&
            d.crop == notifyInfo[2] &&
            d.state_id == notifyInfo[3] &&
            d.dist_id == notifyInfo[4] &&
            d.year == notifyInfo[5] &&
            d.season == notifyInfo[6]
        );
        result.surveyData = surveyData.filter(
          (e: any) =>
            result.data.crop == e.field_593 &&
            result.data.state_id == e.field_585 &&
            result.data.notified_unit == e.field_589 &&
            result.data.dist_id == e.field_586 &&
            result.data.year == e.field_583 &&
            result.data.season == e.field_584 &&
            ((result.data.notified_unit == 1 &&
              result.data.gp_notified_area == e.field_591) ||
              (result.data.notified_unit == 2 &&
                result.data.gp_notified_area == e.field_588) ||
              (result.data.notified_unit == 3 &&
                result.data.gp_notified_area == e.field_587) ||
              (result.data.notified_unit == 4 &&
                result.data.gp_notified_area == e.field_592) ||
              (result.data.notified_unit == 5 &&
                result.data.gp_notified_area == e.field_586))
        );

        result.draige_factor = +result.data.draige_factor || 0;
        result.sum_insured = +result.data.sum_insured || 0;
        result.threshold_yield = +result.data.threshold_yield || 0;
        result.gross_premium = +result.data.gross_premium || 0;
        data.total_gross_premium += result.gross_premium;
        result.no_of_CCEs_planned = +result.data.no_of_CCEs_planned || 0;
        result.deficiency = 0;
        result.yet_to_start = 0;
        result.full_completed = 0;
        result.partially_completed = 0;
        result.partial_claim_amount = 0;
        result.no_of_survey = result.surveyData.length;

        result.actual_yeild = this.actialYield(
          result.surveyData,
          result.draige_factor,
          +result.data.cce_plot_size
        );

        if (result.no_of_survey == 0) {
          result.yet_to_start = 1;
          data.yet_to_start++;
          data.yet_to_start_sum_insured += result.sum_insured;
        } else if (
          result.no_of_survey >= Number(result.no_of_CCEs_planned || 0)
        ) {
          if (result.threshold_yield > result.actual_yeild) {
            result.deficiency =
              (result.threshold_yield - result.actual_yeild) /
              result.threshold_yield;
          }
          result.exposure_covered = result.sum_insured;
          data.full_completed++
          data.full_completed_sum_insured += result.sum_insured;
          result.full_completed = 1;
          result.claim_amount = result.deficiency * result.sum_insured;
          data.claim_amount += result.claim_amount;
          result.actual_loss_ratio = this.divide(
            result.claim_amount,
            result.gross_premium
          );
          result.survey_date = result.surveyData[
            result.no_of_survey - 1
          ].datetime?.substring(0, 10);
        } else {
          result.partially_completed = 1;
          data.partially_completed++;
          data.partially_completed_sum_insured += result.sum_insured;
          result.survey_date = result.surveyData[
            result.no_of_survey - 1
          ].datetime?.substring(0, 10);
        }
        if (result.no_of_survey != 0) {
          if (result.threshold_yield > result.actual_yeild) {
            result.partial_deficiency =
              (result.threshold_yield - result.actual_yeild) /
              result.threshold_yield;
          }
          result.partial_exposure_covered = result.sum_insured;
          result.partial_claim_amount =
            result.partial_deficiency * result.sum_insured;
          result.partial_gross_premium = result.gross_premium;
          result.partial_loss_ratio = this.divide(
            result.partial_claim_amount,
            result.gross_premium
          );
          data.partial_claim_amount += result.partial_claim_amount || 0;
          data.partial_gross_premium += result.partial_gross_premium || 0;
        }
      }
      // for (let indx = 0; indx < totData.length; indx++) {
      //   const info = totData[indx];
      //   data.total_gross_premium += info.gross_premium;
      //   const surveys = info.surveyData;
      //   if (surveys.length) {
      //     const firstDate: any = info.start_date;
      //     const lastDate : any= info.end_date;
      //     if (firstDate && date >= lastDate) {
      //       if (surveys.length >= info.no_of_CCEs_planned) {
      //         data.full_completed += 1;
      //         data.full_completed_sum_insured += info.sum_insured;
      //         data.claim_amount += info.claim_amount
      //         data.gross_premium += info.gross_premium
      //       } else {
      //         data.partially_completed += 1;
      //         data.partially_completed_sum_insured += info.sum_insured;
      //         data.partial_claim_amount += info.partial_claim_amount
      //         data.partial_gross_premium += info.partial_gross_premium
      //       }

      //     }
      //     else {
      //       data.yet_to_start += 1;
      //       data.yet_to_start_sum_insured += info.sum_insured;
      //     }
      //   } else {
      //     data.yet_to_start += 1;
      //     data.yet_to_start_sum_insured += info.sum_insured;
      //   }
      // }
      data.actual_loss_ratio = this.divide(
        data.claim_amount,
        data.gross_premium
      );
      data.partial_loss_ratio = this.divide(
        data.partial_claim_amount,
        data.partial_gross_premium
      );
      dateData.push(data)
    }
    return dateData
  }

  generateStateData(totData: any[]) {
    const states = [
      ...new Set(totData.map((data) => data.state_id)),
    ].map((stateId) => {
      const data = {
        state_id: stateId,
        state_name: this.stateMap.get(stateId),
        threshold_yield: 0,
        draige_factor: 0,
        gross_premium: 0,
        sum_insured: 0,
        expected: 0,
        no_of_CCEs_planned: 0,
        no_of_survey: 0,
        area: 0,
        dry_weight: 0,
        exposure_covered: 0,
        partially_completed: 0,
        full_completed: 0,
        yet_to_start: 0,
        actual_yeild: 0,
        deficiency: 0,
        no_of_survey_pending: 0,
        expected_loss_ratio: 0,
        claim_amount: 0,
        actual_loss_ratio: 0,
        total_count: 0,
        lossCount: 0,
        noLossCount: 0,
        expected_claim: 0,
        total_gross_premium: 0,
        full_completed_sum_insured: 0,
        partially_completed_sum_insured: 0,
        yet_to_start_sum_insured: 0,
        partial_claim_amount: 0,
        partial_loss_ratio: 0,
        partial_gross_premium: 0
      };
      for (let indx = 0; indx < totData.length; indx++) {
        const info = totData[indx];
        if (info.state_id == data.state_id) {
          data.total_count++
          data.state_id = info.state_id;
          data.threshold_yield += info.threshold_yield;
          data.draige_factor += info.draige_factor;
          data.sum_insured += info.sum_insured;
          data.expected += info.expected;
          data.no_of_CCEs_planned += info.no_of_CCEs_planned;
          data.no_of_survey += info.no_of_survey;
          data.exposure_covered += info.exposure_covered;
          data.partially_completed += info.partially_completed;
          data.full_completed += info.full_completed;
          data.yet_to_start += info.yet_to_start;
          data.area += info.area;
          data.dry_weight += info.dry_weight;
          data.no_of_survey_pending += info.no_of_survey_pending;
          data.actual_yeild += info.actual_yeild;
          data.expected_claim += info.expected_claim || 0;
          data.total_gross_premium += info.gross_premium;

          if (info.full_completed) {
            data.gross_premium += info.gross_premium;
            data.deficiency += info.deficiency || 0;
            data.claim_amount += info.claim_amount || 0;
            data.full_completed_sum_insured += info.sum_insured;
          }

          if (info.partially_completed) {
            data.partially_completed_sum_insured += info.sum_insured;
          }

          if (info.yet_to_start) {
            data.yet_to_start_sum_insured += info.sum_insured;
          }

          data.partial_claim_amount += +(info.partial_claim_amount || 0);
          if (!info.yet_to_start) {
            data.partial_gross_premium += info.gross_premium;
          }

          if (data.claim_amount > 0) {
            data.lossCount++
          } else {
            data.noLossCount++
          }
        }
      }
      data.actual_loss_ratio = this.divide(
        data.claim_amount,
        data.gross_premium
      );

      data.partial_loss_ratio = this.divide(
        data.partial_claim_amount,
        data.partial_gross_premium
      );

      data.expected_loss_ratio = this.divide((data.expected_claim + data.claim_amount), data.total_gross_premium )
        return data;
    });
    states.sort((a,b) => b.sum_insured - a.sum_insured);
    return states
  }

  generateDistrictData(totData: any[]) {
    const states = [
      ...new Set(totData.map((data) => data.dist_id)),
    ].map((dist_id) => {
      const data = {
        dist_id,
        district_name: this.districtMap.get(dist_id),
        state_name: '',
        threshold_yield: 0,
        draige_factor: 0,
        gross_premium: 0,
        sum_insured: 0,
        expected: 0,
        no_of_CCEs_planned: 0,
        no_of_survey: 0,
        area: 0,
        dry_weight: 0,
        exposure_covered: 0,
        partially_completed: 0,
        full_completed: 0,
        yet_to_start: 0,
        actual_yeild: 0,
        deficiency: 0,
        no_of_survey_pending: 0,
        expected_loss_ratio: 0,
        claim_amount: 0,
        actual_loss_ratio: 0,
        total_count: 0,
        lossCount: 0,
        noLossCount: 0,
        expected_claim: 0,
        total_gross_premium: 0,
        full_completed_sum_insured: 0,
        partially_completed_sum_insured: 0,
        yet_to_start_sum_insured: 0,
        partial_claim_amount: 0,
        partial_loss_ratio: 0,
        partial_gross_premium: 0,
        season_partial_claim_amount: 0,
        season_gross_premium: 0,
        season_partial_loss_ratio: 0,
      };
      for (let indx = 0; indx < totData.length; indx++) {
        const info = totData[indx];
        if (info.dist_id == data.dist_id) {
          data.state_name = this.stateMap.get(info.state_id)
          data.total_count++
          data.dist_id = info.dist_id;
          data.threshold_yield += info.threshold_yield;
          data.draige_factor += info.draige_factor;
          data.sum_insured += info.sum_insured;
          data.expected += info.expected;
          data.no_of_CCEs_planned += info.no_of_CCEs_planned;
          data.no_of_survey += info.no_of_survey;
          data.exposure_covered += info.exposure_covered;
          data.partially_completed += info.partially_completed;
          data.full_completed += info.full_completed;
          data.yet_to_start += info.yet_to_start;
          data.area += info.area;
          data.dry_weight += info.dry_weight;
          data.no_of_survey_pending += info.no_of_survey_pending;
          data.actual_yeild += info.actual_yeild;
          data.expected_claim += info.expected_claim || 0;
          data.total_gross_premium += info.gross_premium;
          data.season_partial_claim_amount += info.season_partial_claim_amount || 0;
          data.season_gross_premium += info.season_gross_premium || 0;

          if (info.full_completed) {
            data.gross_premium += info.gross_premium;
            data.deficiency += info.deficiency || 0;
            data.claim_amount += info.claim_amount || 0;
            data.full_completed_sum_insured += info.sum_insured;
          }

          if (info.partially_completed) {
            data.partially_completed_sum_insured += info.sum_insured;
          }

          if (info.yet_to_start) {
            data.yet_to_start_sum_insured += info.sum_insured;
          }

          data.partial_claim_amount += +(info.partial_claim_amount || 0);
          if (!info.yet_to_start) {
            data.partial_gross_premium += info.gross_premium;
          }

          if (!info.yet_to_start) {
            const val = +info.partial_claim_amount > 0;
            if (+info.partial_claim_amount > 0) {
              data.lossCount += info.no_of_survey
            } else {
              data.noLossCount += info.no_of_survey
            }
          } else {
            data.noLossCount += info.no_of_survey;
          }
        }
      }
      data.actual_loss_ratio = this.divide(
        data.claim_amount,
        data.gross_premium
      );

      data.partial_loss_ratio = this.divide(
        data.partial_claim_amount,
        data.partial_gross_premium
      );
      data.season_partial_loss_ratio = this.divide(
        data.season_partial_claim_amount,
        data.season_gross_premium
      );

      data.expected_loss_ratio = this.divide((data.expected_claim + data.claim_amount), data.total_gross_premium )
        return data;
    }).filter(d => d.no_of_survey > 0);
    states.sort((a,b) => b.sum_insured - a.sum_insured);
    return states
  }

  generateStateDistrictCropData(totData: any[]) {
    const states = [
      ...new Set(totData.map((data) => `${data.state_id}=>${data.dist_id}=>${data.crop}`)),
    ].map((elements) => {
      const [state_id, dist_id, crop] = elements.split('=>')
      const data = {
        state_id,
        dist_id,
        crop,
        state_name: this.stateMap.get(state_id),
        district_name: this.districtMap.get(dist_id),
        crop_name: this.cropMap.get(+crop),
        threshold_yield: 0,
        draige_factor: 0,
        gross_premium: 0,
        sum_insured: 0,
        expected: 0,
        no_of_CCEs_planned: 0,
        no_of_survey: 0,
        area: 0,
        dry_weight: 0,
        exposure_covered: 0,
        partially_completed: 0,
        full_completed: 0,
        yet_to_start: 0,
        actual_yeild: 0,
        deficiency: 0,
        no_of_survey_pending: 0,
        expected_loss_ratio: 0,
        claim_amount: 0,
        actual_loss_ratio: 0,
        total_count: 0,
        lossCount: 0,
        noLossCount: 0,
        expected_claim: 0,
        total_gross_premium: 0,
        full_completed_sum_insured: 0,
        partially_completed_sum_insured: 0,
        yet_to_start_sum_insured: 0,
        partial_claim_amount: 0,
        partial_loss_ratio: 0,
        partial_gross_premium: 0
      };
      for (let indx = 0; indx < totData.length; indx++) {
        const info = totData[indx];
        if (info.state_id == data.state_id && info.dist_id == data.dist_id && info.crop == data.crop) {
          data.total_count++
          data.state_id = info.state_id;
          data.threshold_yield += info.threshold_yield;
          data.draige_factor += info.draige_factor;
          data.sum_insured += info.sum_insured;
          data.expected += info.expected;
          data.no_of_CCEs_planned += info.no_of_CCEs_planned;
          data.no_of_survey += info.no_of_survey;
          data.exposure_covered += info.exposure_covered;
          data.partially_completed += info.partially_completed;
          data.full_completed += info.full_completed;
          data.yet_to_start += info.yet_to_start;
          data.area += info.area;
          data.dry_weight += info.dry_weight;
          data.no_of_survey_pending += info.no_of_survey_pending;
          data.actual_yeild += info.actual_yeild;
          data.expected_claim += info.expected_claim || 0;
          data.total_gross_premium += info.gross_premium;

          if (info.full_completed) {
            data.gross_premium += info.gross_premium;
            data.deficiency += info.deficiency || 0;
            data.claim_amount += info.claim_amount || 0;
            data.full_completed_sum_insured += info.sum_insured;
          }

          if (info.partially_completed) {
            data.partially_completed_sum_insured += info.sum_insured;
          }

          if (info.yet_to_start) {
            data.yet_to_start_sum_insured += info.sum_insured;
          }

          data.partial_claim_amount += +(info.partial_claim_amount || 0);
          if (!info.yet_to_start) {
            data.partial_gross_premium += info.gross_premium;
          }

          if (data.claim_amount > 0) {
            data.lossCount++
          } else {
            data.noLossCount++
          }
        }
      }
      data.actual_loss_ratio = this.divide(
        data.claim_amount,
        data.gross_premium
      );

      data.partial_loss_ratio = this.divide(
        data.partial_claim_amount,
        data.partial_gross_premium
      );

      data.expected_loss_ratio = this.divide((data.expected_claim + data.claim_amount), data.total_gross_premium )
        return data;
    });
    states.sort((a,b) => b.partial_loss_ratio - a.partial_loss_ratio);
    return states.filter((state,i) => (state.partial_loss_ratio *100) > 50 && i < 15);
  }

  generateYesterdayData(allTotData: any) {
    const yesterdayDate = moment().subtract(1, "days").format('YYYY-MM-DD');
    const surveyData = this.surveyData.filter(d => d.datetime?.substring(0, 10) === yesterdayDate);
    const getMaxDate = (surveyData: any[]) => {
      if (!surveyData?.length) {
        return null;
      }
      return Math.max(...surveyData.map(d => new Date(new Date(d.datetime).setHours(0,0,0,0)).getTime()))
    }
    const getMinDate = (surveyData: any[]) => {
      if (!surveyData?.length) {
        return null;
      }
      return Math.min(...surveyData.map(d => new Date(new Date(d.datetime).setHours(0,0,0,0)).getTime()))
    }
   

    const getAreaWeight = (data: any, plotSize: any): any[] => {
      if (!data?.length) {
        return [0, 0];
      }

      const areaWeght = data.map((d: any) => {
        const result = { area: 0, weight: 0 };
        result.area = plotSize;
        result.weight = Number(d.dry_weight || 0);
        return result;
      });
      const area = areaWeght
        .map((d: any) => +(d.area || 0))
        .reduce((a: any, b: any) => a + b, 0);
      const weight = areaWeght
        .map((d: any) => +(d.weight || 0))
        .reduce((a: any, b: any) => a + b, 0);

      return [area || 0, weight || 0];
    };

    const totalCalc = {'total_exposure': 0, 'total_co-witness': 0, 'claim_amount': 0, 'gross_premium': 0, "loss_ratio": 0}
    const iu_crop_level_data: any[] = [];
    
    const totData = this.allIUs.map((ele: any, index: number) => {
      const result: any = {};
      const notifyInfo = ele.split("=>").map((d: any) => d.trim());
      result.data = this.allData.find(
        (d) =>
          d.gp_notified_area == notifyInfo[0] &&
          d.notified_unit == notifyInfo[1] &&
          d.crop == notifyInfo[2] &&
          d.state_id == notifyInfo[3] &&
          d.dist_id == notifyInfo[4] &&
          d.year == notifyInfo[5] &&
          d.season == notifyInfo[6]
      );
      result.surveyData = surveyData.filter(
        (e: any) =>
          result.data.crop == e.field_593 &&
          result.data.state_id == e.field_585 &&
          result.data.notified_unit == e.field_589 &&
          result.data.dist_id == e.field_586 &&
          result.data.year == e.field_583 &&
          result.data.season == e.field_584 &&
          ((result.data.notified_unit == 1 &&
            result.data.gp_notified_area == e.field_591) ||
            (result.data.notified_unit == 2 &&
              result.data.gp_notified_area == e.field_588) ||
            (result.data.notified_unit == 3 &&
              result.data.gp_notified_area == e.field_587) ||
            (result.data.notified_unit == 4 &&
              result.data.gp_notified_area == e.field_592) ||
            (result.data.notified_unit == 5 &&
              result.data.gp_notified_area == e.field_586))
      );
      result.state_id = result.data.state_id;
      result.dist_id = result.data.dist_id;
      result.tehsil_id = result.data.tehsil_id;
      result.gp_notified_area = result.data.gp_notified_area;
      result.notified_unit = result.data.notified_unit;
      result.crop = result.data.crop;
      result.threshold_yield = +result.data.threshold_yield || 0;
      result.draige_factor = +result.data.draige_factor || 0;
      result.gross_premium = +result.data.gross_premium || 0;
      result.sum_insured = +result.data.sum_insured || 0;
      result.expected = +result.data.expected_yield || 0;
      result.no_of_CCEs_planned = +result.data.no_of_CCEs_planned || 0;
      result.season = result.data.season;
      result.year = result.data.year;
      result.date_of_sowing = result.data.date_of_sowing;
      result.date_of_loss = result.data.date_of_loss;
      result.no_of_survey = result.surveyData.length;
      result.exposure_covered = 0;
      result.partially_completed = 0;
      result.full_completed = 0;
      result.partially_completed = 0;
      result.yet_to_start = 0;
      [result.area, result.dry_weight] = getAreaWeight(
        result.surveyData,
        +result.data.cce_plot_size
      );
      result.actual_yeild = this.actialYield(
        result.surveyData,
        result.draige_factor,
        +result.data.cce_plot_size
      );
      result.claim_amount = 0;
      result.deficiency = 0;
      result.partial_exposure_covered = 0;
      result.partial_claim_amount = 0;
      result.partial_deficiency = 0;
      result.no_of_survey_pending = Math.max(
        result.no_of_CCEs_planned - result.no_of_survey,
        0
      );

      result.survey_date = null;
      result.start_date = null;
      result.end_date = null;

      if (result.no_of_survey == 0) {
        result.yet_to_start = 1;
      } else if (
        result.no_of_survey >= Number(result.no_of_CCEs_planned || 0)
      ) {
        if (result.threshold_yield > result.actual_yeild) {
          result.deficiency =
            (result.threshold_yield - result.actual_yeild) /
            result.threshold_yield;
        }
        result.exposure_covered = result.sum_insured;
        result.full_completed = 1;
        result.claim_amount = result.deficiency * result.sum_insured;
        result.actual_loss_ratio = this.divide(
          result.claim_amount,
          result.gross_premium
        );
        result.survey_date = result.surveyData[
          result.no_of_survey - 1
        ].datetime?.substring(0, 10);
        result.start_date = getMinDate(result.surveyData)
        result.end_date = getMaxDate(result.surveyData)
      } else {
        result.partially_completed = 1;
        result.survey_date = result.surveyData[
          result.no_of_survey - 1
        ].datetime?.substring(0, 10);
        result.start_date = getMinDate(result.surveyData)
        result.end_date = getMaxDate(result.surveyData)
      }
      if (result.no_of_survey != 0) {
        if (result.threshold_yield > result.actual_yeild) {
          result.partial_deficiency =
            (result.threshold_yield - result.actual_yeild) /
            result.threshold_yield;
        }
        result.partial_exposure_covered = result.sum_insured;
        result.partial_claim_amount =
          result.partial_deficiency * result.sum_insured;
        result.partial_gross_premium = result.gross_premium;
        result.partial_loss_ratio = this.divide(
          result.partial_claim_amount,
          result.gross_premium
        );
        result.survey_date = result.surveyData[
          result.no_of_survey - 1
        ].datetime?.substring(0, 10);
        result.start_date = getMinDate(result.surveyData)
        result.end_date = getMaxDate(result.surveyData)
      }
      if (!result.full_completed) {
        const avgArea = this.divide(
          10000,
          this.divide(result.area, result.no_of_survey)
        );
        const sum_actual_yield =
          result.dry_weight * avgArea * result.draige_factor;
        const allExpectedYield = result.no_of_survey_pending * result.expected;
        const avg_actual_yield = this.divide(
          sum_actual_yield + allExpectedYield,
          result.no_of_CCEs_planned
        );
        const deficiency =
          result.threshold_yield > avg_actual_yield
            ? this.divide(
                result.threshold_yield - avg_actual_yield,
                result.threshold_yield
              )
            : 0;
        const claim = deficiency * result.sum_insured;
        result.expected_deficiency = deficiency;
        result.expected_claim = claim;
        result.expected_loss_ratio = this.divide(claim, result.gross_premium);
      } else {
        result.expected_loss_ratio = 0;
      }
      totalCalc.total_exposure += result.sum_insured;
      if (result.no_of_survey > 0) {
        totalCalc["total_co-witness"] += result.sum_insured;
      }
      totalCalc.claim_amount += result.partial_claim_amount || 0;
      totalCalc.gross_premium += result.partial_gross_premium || 0;
      if (((result.partial_loss_ratio || 0) * 100) > 75 && result.sum_insured >= 1e7 && result.no_of_CCEs_planned > 0 && result.no_of_CCEs_planned < result.no_of_survey) {
        iu_crop_level_data.push(result);
      }
      result.season_partial_claim_amount = allTotData[index].partial_claim_amount;
      result.season_gross_premium = allTotData[index].partial_gross_premium;
      return result;
    });
    const jsonData: any = {}
    const districtData = this.generateDistrictData(totData)
    jsonData['yesterday_date'] = moment().subtract(1, "days").format('DD-MM-YYYY');
    jsonData['yesterday_total_exposure'] = totalCalc.total_exposure;
    jsonData['yesterday_total_co-witness'] = totalCalc["total_co-witness"];
    jsonData['yesterday_loss_ratio'] = this.divide(totalCalc.claim_amount, totalCalc.gross_premium);
    jsonData['district_level_cce'] = districtData.filter(d => d.no_of_survey > 0).map(data => {
      return {date: moment().subtract(1, "days").format('DD-MM-YYYY'), state: data.state_name, district: data.district_name, 'no_of_cce-witnessed': data.no_of_survey, loss_reported: data.lossCount, no_loss_reported: data.noLossCount, loss_ratio: data.season_partial_loss_ratio * 100, }
    });
    return jsonData
  }

  clearDetails() {
    this.surveyData = [];
    this.allData = [];
  }

  downloadExcel(...jsonData: any) {
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    for (let i = 0; i < jsonData.length; i++) {
      const json = jsonData[i];
      if (json.data[0]) {
        const excelData: any[] = [];
        const keys = Object.keys(json.data[0]).filter(k => (json.data[0][k] == null || typeof json.data[0][k] != 'object'));
        excelData.push(keys);
        for (let d = 0; d < json.data.length; d++) {
          const data = json.data[d];
          excelData.push(keys.map(k => data[k]))
        }
        const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(excelData);
        XLSX.utils.book_append_sheet(wb, ws, json.name);
      }
    }
    XLSX.writeFile(
      wb,
      `${moment(new Date()).format("YYYYMMDD")}_CCE_Email_Data.xlsx`
    );
  }

  divide = (numerator: number, denominator: number) =>
    denominator == 0 ? 0 : numerator / denominator;

  actialYield = (data: any[], draige_factor: number, plotSize: any) => {
      if (!data?.length) {
        return 0;
      }

      const areaWeght = data
        .map((d) => {
          const result = { area: 0, weight: 0 };
          result.area = plotSize;
          result.weight = Number(d.dry_weight || 0);
          return result.area
            ? (10000 / result.area) * result.weight * draige_factor
            : 0;
        })
        .reduce((a: any, b: any) => a + b, 0);
      if (areaWeght) return areaWeght / data.length;
      return 0;
    };
}
