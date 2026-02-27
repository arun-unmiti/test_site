import { Component, OnInit, ViewChild } from '@angular/core';
import * as moment from 'moment';
import { FilterService } from '../utilities/filter.service';
import { CoreService } from '../utilities/core.service';
import * as XLSX from 'xlsx';
import { UserDetailService } from '../auth/user-detail.service';
import { FeatureToggleService } from '../shared/services/feature-toggle.service';
import { environment, ProjectContext } from '../../environments/environment';
import { InsightsService } from '../utilities/insights.service';

@Component({
  selector: 'app-view-cls-intimation',
  templateUrl: './view-cls-intimation.component.html',
  styleUrls: ['./view-cls-intimation.component.css'],
})
export class ViewClsIntimationComponent implements OnInit {
  loading: any = 0;
  lookupLoader = false;
  isFilterCollapsed = true;
  currentpage: any = 1;
  recordsPerPage: any = 10;
  totalRecords: any = 0;
  selectedYear: any = '';
  yearData: any[] = [];
  selectedSeason: any = '';
  seasonData: any[] = [];
  selectedState: any[] = [];
  statesData: any[] = [];
  districts: any[] = [];
  selectedDist: any[] = [];
  districtData: any[] = [];
  tehsils: any[] = [];
  selectedBlock: any[] = [];
  blockData: any[] = [];
  selectedFromDate: any = {
    startDate: moment().subtract(7, 'days'),
    endDate: moment(),
  };
  ranges = {
    Today: [moment(), moment()],
    Yesterday: [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
    'Last 7 Days': [moment().subtract(6, 'days'), moment()],
    'Last 30 Days': [moment().subtract(29, 'days'), moment()],
    'This Month': [moment().startOf('month'), moment().endOf('month')],
    'Last Month': [
      moment().subtract(1, 'month').startOf('month'),
      moment().subtract(1, 'month').endOf('month'),
    ],
    'Last 3 Month': [
      moment().subtract(3, 'month').startOf('month'),
      moment().subtract(1, 'month').endOf('month'),
    ],
  };
  localeValue = {
    format: 'DD/MM/YYYY',
    displayFormat: 'DD-MM-YYYY',
    separator: ' - ',
    cancelLabel: 'Cancel',
    applyLabel: 'Okay',
  };
  maxDate: any = moment();
  columns: any[] = [];
  rows: any[] = [];
  no_data: string = '';
  downloadRecords: any[] = [];
  stateMap: Map<any, any> = new Map();
  districtMap: Map<any, any> = new Map();
  tehsilMap: Map<any, any> = new Map();
  blockMap: Map<any, any> = new Map();
  grampanchayatMap: Map<any, any> = new Map();
  villageMap: Map<any, any> = new Map();
  seasonMap: Map<any, any> = new Map();
  yearMap: Map<any, any> = new Map();
  cropMap: Map<any, any> = new Map();
  notifiedUnitMap: Map<any, any> = new Map();
  preApplied = false;
  @ViewChild('pagination') pagination: any;
  currentUser: any;
  projectContext: ProjectContext;
  assetsFolder: string;
  constructor(private filter: FilterService, private core: CoreService, private userService: UserDetailService, private featureToggle: FeatureToggleService, private insightsService: InsightsService) {
    this.projectContext = this.featureToggle.getContext() as ProjectContext;
    this.assetsFolder = environment.projectConfigs[this.projectContext].assetsFolder;
  }
  ngOnInit(): void {
    this.currentUser = this.userService.getUserDetail();
    this.getColumns();
    this.configureFilterData();
  }
  configureFilterData() {
    this.lookupLoader = true;
    const handleDistrictFetched = () => {
      this.districts = this.filter.districts;
      this.tehsils = this.filter.tehsils;
      this.setInputData();
    };

    if (this.filter.isDistrictFetched) {
      handleDistrictFetched();
    } else {
      this.filter.fetchedDistrictData.subscribe(handleDistrictFetched);
    }

    const handleVillageFetched = () => {
      this.setVilageData();
      if (this.preApplied) {
        this.loading--;
        this.preApplied = false;
        this.applyFilter();
      }
    };

    if (this.filter.isvillageFetched) {
      handleVillageFetched();
    } else {
      this.filter.fetchedVillageData.subscribe(handleVillageFetched);
    }
  }
  setInputData() {
    this.lookupLoader = false;
    this.yearData = this.filter.years;
    this.seasonData = this.filter.seasons;
    this.statesData = this.filter.lookupData?.states;
    for (let indx = 0; indx < this.filter.states.length; indx++) {
      const item = this.filter.states[indx];
      this.stateMap.set(item.state_id, item.state_name);
    }
    for (let indx = 0; indx < this.filter.districts.length; indx++) {
      const item = this.filter.districts[indx];
      this.districtMap.set(item.district_id, item.district_name);
    }
    for (let indx = 0; indx < this.filter.tehsils.length; indx++) {
      const item = this.filter.tehsils[indx];
      this.tehsilMap.set(item.tehsil_id, item.tehsil_name);
    }
    for (let indx = 0; indx < this.filter.blocks.length; indx++) {
      const item = this.filter.blocks[indx];
      this.blockMap.set(item.block_id, item.block_name);
    }
    for (let indx = 0; indx < this.filter.seasons.length; indx++) {
      const item = this.filter.seasons[indx];
      this.seasonMap.set(item.id, item.season_name);
    }
    for (let indx = 0; indx < this.filter.years.length; indx++) {
      const item = this.filter.years[indx];
      this.yearMap.set(item.id, item.year);
    }
    for (let indx = 0; indx < this.filter.crops.length; indx++) {
      const item = this.filter.crops[indx];
      this.cropMap.set(+item.crop_code, item.crop_name);
    }
    for (let indx = 0; indx < this.filter.notifiedUnits.length; indx++) {
      const item = this.filter.notifiedUnits[indx];
      this.notifiedUnitMap.set(item.notified_id, item.notified_unit_name);
    }
  }
  setVilageData() {
    for (let indx = 0; indx < this.filter.grampanchayats.length; indx++) {
      const item = this.filter.grampanchayats[indx];
      this.grampanchayatMap.set(item.grampanchayat_id, item.grampanchayat_name);
    }
    for (let indx = 0; indx < this.filter.villages.length; indx++) {
      const item = this.filter.villages[indx];
      this.villageMap.set(item.village_id, item.village_name);
    }
  }
  onYearSelect(event: any) {}
  onSeasonSelect(event: any) {}
  onStateSelect(event: any) {
    this.districtData = [];
    this.blockData = [];
    this.selectedDist = [];
    this.selectedBlock = [];
    if (event?.length) {
      this.districtData = this.core.clone(event).map((state: any) => {
        state.items = this.core
          .clone(this.districts)
          .filter((dist: any) => dist.state_id == state.state_id);
        return state;
      });
    }
  }
  onDistSelect(event: any) {
    this.blockData = [];
    this.selectedBlock = [];
    if (event?.length) {
      this.blockData = event.map((d: any) => {
        d.items = this.tehsils.filter((e: any) => e.district_id == d.district_id);
        return d;
      });
    }
  }
  onTehsilSelect(event: any) {}
  applyFilter() {
    if (!this.selectedYear) {
      this.core.toast('warn', 'Year is required');
      return;
    }
    if (!this.selectedSeason) {
      this.core.toast('warn', 'Season is required');
      return;
    }
    this.rows = [];
    this.no_data = this.rows.length < 1 ? 'No data found' : '';
    const start_date = this.selectedFromDate?.startDate?.format('YYYY-MM-DD') || null;
    const end_date = this.selectedFromDate?.endDate?.format('YYYY-MM-DD') || null;
    const request = {
      purpose: 'get_cls_intimation_data',
      year: this.selectedYear,
      season: this.selectedSeason,
      state: this.selectedState.map((d) => d.state_id),
      district: this.selectedDist.map((d) => d.district_id),
      block: this.selectedBlock.map((d) => d.tehsil_id),
      start_date,
      end_date,
      pagination: {
        page_no: this.currentpage,
        records_per_page: this.recordsPerPage,
      },
    };
    this.currentpage = 1;
    if (this.projectContext === 'saksham' && ![1, 2].includes(+this.currentUser.user_role)) {
      if (!request.state.length) {
        request.state = this.filter.states.map((d) => d.state_id);
      }
      if (!request.district.length) {
        request.district = this.filter.districts.map((d) => d.district_id);
      }
      if (!request.block.length) {
        request.block = this.filter.tehsils.map((d) => d.tehsil_id);
      }
    }
    this.getIntimationData(request);
  }
  getIntimationData(request: any) {
    this.loading++;
    if (!this.filter.villages?.length) {
      this.preApplied = true;
      return;
    }
    this.core.dashboard_post(request).then((response: any) => {
      if (response?.status == 1) {
        this.totalRecords = response?.total_records || 0;
        this.rows = response?.intimation_data || [];
        this.no_data = this.rows.length < 1 ? 'No data found' : '';
        if (this.rows?.length) {
          const fieldMap: { [key: string]: Map<any, any> | undefined } = {
            state: this.stateMap, district: this.districtMap, block: this.tehsilMap,
            ri_circle: this.blockMap, grampanchayat: this.grampanchayatMap,
            village: this.villageMap, iu_level: this.notifiedUnitMap,
            crop: this.cropMap, int_year: this.yearMap, season: this.seasonMap
          };
          this.rows.forEach((row: any) => {
            this.columns.forEach((col: any) => {
              const map = fieldMap[col.field];
              if (map) {
                const map_value = map.get(col.field === 'crop' ? +row[col.field] : row[col.field]) || row[col.field];
                row[col.field] = map_value;
              }
            });
          });
        }
        setTimeout(() => this.pagination?.updatePagination(), 1000);
      }
    }).catch(err => {
      this.insightsService.logException(err);
    }).finally(() => this.loading--);
  }
  onPageTrigger(event: any) {
    this.currentpage = event?.page_no;
    this.recordsPerPage = event?.records_per_page;
    this.rows = [];
    this.no_data = this.rows.length < 1 ? 'No data found' : '';
    const start_date = this.selectedFromDate?.startDate?.format('YYYY-MM-DD') || null;
    const end_date = this.selectedFromDate?.endDate?.format('YYYY-MM-DD') || null;
    const request = { purpose: 'get_cls_intimation_data', year: this.selectedYear, season: this.selectedSeason, state: this.selectedState.map((d) => d.state_id),
      district: this.selectedDist.map((d) => d.district_id), block: this.selectedBlock.map((d) => d.tehsil_id), start_date, end_date, pagination: { page_no: this.currentpage, records_per_page: this.recordsPerPage },
    };
    this.getIntimationData(request);
  }
  getColumns() {
    const commonColumns = [
      { field: 'int_year', header: 'Int Year' }, { field: 'season', header: 'Season' }, { field: 'farmer_name', header: 'Farmer Name' }, { field: 'state', header: 'State' }, { field: 'district', header: 'District' }, { field: 'block', header: 'Block' }, { field: 'ri_circle', header: 'RICircle' }, { field: 'iu_level', header: 'IU level' }, { field: 'crop', header: 'Crop' }, { field: 'affected_area', header: 'Affected Area' }, { field: 'account_no', header: 'Account No' }, { field: 'bank_name', header: 'Bank Name' }, { field: 'bank_branch', header: 'Bank Branch' }, { field: 'cause_of_loss', header: 'Cause Of Loss' }, { field: 'date_of_loss', header: 'Date Of Loss' },
      {
        field: 'date_of_intimation_farmer',
        header: this.projectContext === 'saksham' ? 'Docket ID/Ticket ID' : 'Date Of Intimation Farmer',
      },
      { field: 'applicationid', header: 'Applicationid' }, { field: 'intimation_id', header: 'Intimation Id' }, { field: 'supplier_name', header: 'Supplier Name' }, { field: 'surveyor_appointment_date', header: 'Surveyor Appointment Date' }, { field: 'survey_done_date', header: 'Survey Done Date' }, { field: 'survey_upload_date', header: 'Survey Upload Date' }, { field: 'loss_percent', header: 'Loss Percent' }, { field: 'date_of_sowing', header: 'Date Of Sowing' }, { field: 'scheme_name', header: 'Scheme Name' }, { field: 'date_of_intimation', header: 'Date Of Intimation' }, { field: 'survey_type', header: 'Survey Type', default: 'Sample' },
    ];
    const contextColumns: { [key in ProjectContext]: any[] } = {
      saksham: [
        { field: 'farmer_mobile_number', header: 'Farmer Mobile Number', insertAfter: 'farmer_name' },
      ],
      munichre: [
        { field: 'insured_area', header: 'Insured Area', insertAfter: 'applicationid' },
        { field: 'post_harvest_date', header: 'Post Harvest Date', insertBefore: 'date_of_intimation' },
      ],
    };
    this.columns = [...commonColumns];
    const additionalColumns = contextColumns[this.projectContext] || [];
    additionalColumns.forEach((col) => {
      if (col.insertAfter) {
        const index = this.columns.findIndex((c) => c.field === col.insertAfter) + 1;
        this.columns.splice(index, 0, { field: col.field, header: col.header });
      } else if (col.insertBefore) {
        const index = this.columns.findIndex((c) => c.field === col.insertBefore);
        this.columns.splice(index, 0, { field: col.field, header: col.header });
      } else {
        this.columns.push({ field: col.field, header: col.header });
      }
    });
  }
  downloadExcel() {
    const start_date = this.selectedFromDate?.startDate?.format('YYYY-MM-DD') || null;
    const end_date = this.selectedFromDate?.endDate?.format('YYYY-MM-DD') || null;
    const request = {
      purpose: 'get_cls_intimation_data',
      year: this.selectedYear,
      season: this.selectedSeason,
      state: this.selectedState.map((d) => d.state_id),
      district: this.selectedDist.map((d) => d.district_id),
      block: this.selectedBlock.map((d) => d.tehsil_id),
      start_date,
      end_date,
      pagination: this.projectContext === 'saksham' ? { page_no: this.currentpage, records_per_page: this.totalRecords } : undefined,
    };
    this.loading++;
    this.core.dashboard_post(request).then((response: any) => {
      if (response?.status !== 1) {
        return;
      }
      this.totalRecords = response?.total_records || 0;
      const rows = response?.intimation_data || [];
      if (rows.length) {
        this.processRows(rows);
      }
      this.generateExcel(rows);
    }).catch(err => {
      this.insightsService.logException(err);
    }).finally(() => this.loading--);
  }
  private processRows(rows: any[]) {
    const mappings: { [key: string]: any } = {
      state: this.stateMap,
      district: this.districtMap,
      block: this.tehsilMap,
      ri_circle: this.blockMap,
      grampanchayat: this.grampanchayatMap,
      village: this.villageMap,
      iu_level: this.notifiedUnitMap,
      crop: this.cropMap,
      int_year: this.yearMap,
      season: this.seasonMap
    };
    rows.forEach((row) => {
      this.columns.forEach((col: any) => {
        if (mappings[col.field]) {
          row[col.field] = mappings[col.field].get(row[col.field]) || row[col.field];
        }
      });
    });
  }
  private generateExcel(rows: any[]) {
    const fileName = 'cls_intimations';
    let excel_columns = JSON.parse(JSON.stringify(this.columns));
    if (this.projectContext === 'saksham') {
      excel_columns.unshift({ field: 'id', header: 'AI ID' });
      excel_columns.push({ field: 'added_by_name', header: 'uploaded by' }, { field: 'added_datetime', header: 'upload/time' });
    }
    const mappings: { [key: string]: any } = {
      state: (cell: any) => this.filter.states.find((s) => s.state_id == cell)?.state_name || cell,
      district: (cell: any) => this.districts.find((d) => d.district_id == cell)?.district_name || cell,
      block: (cell: any) => this.tehsils.find((t) => t.tehsil_id == cell)?.tehsil_name || cell,
      crop: (cell: any) => this.cropMap.get(cell) || cell,
      iu_level: (cell: any) => this.notifiedUnitMap.get(cell) || cell,
      ri_circle: (cell: any) => this.blockMap.get(cell) || cell,
      int_year: (cell: any) => this.yearData.find((y) => y.id == cell)?.year || cell,
      season: (cell: any) => this.seasonData.find((s) => s.id == cell)?.season_name || cell
    };
    const jsonData = rows.map((data: any) => {
      return excel_columns.map((field: any) => {
        let cell = data[field.field];
        if (this.projectContext === 'munichre' && !['id', 'added_by_name', 'added_datetime'].includes(field.field) && mappings[field.field]) {
          cell = mappings[field.field](cell);
        }
        return cell;
      });
    });
    jsonData.unshift(excel_columns.map((d: any) => d.header));
    const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(jsonData);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, fileName);
    XLSX.writeFile(wb, `${moment(new Date()).format('YYYYMMDD')}_${fileName}.xlsx`);
  }
}
