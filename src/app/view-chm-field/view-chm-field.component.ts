import { Component, OnInit, ViewChild } from '@angular/core';
import * as moment from 'moment';
import { FilterService } from '../utilities/filter.service';
import { CoreService } from '../utilities/core.service';
import * as XLSX from "xlsx";
import { UserDetailService } from '../auth/user-detail.service';
import { FeatureToggleService } from "../shared/services/feature-toggle.service";
import { environment, ProjectContext } from "../../environments/environment";
import { InsightsService } from '../utilities/insights.service';

@Component({
  selector: 'app-view-chm-field',
  templateUrl: './view-chm-field.component.html',
  styleUrls: ['./view-chm-field.component.css']
})
export class ViewChmFieldComponent implements OnInit {

 
  loading: any = 0;
  lookupLoader = false;
  isFilterCollapsed = true;
  currentpage: any = 1;
  recordsPerPage: any = 10;		
  totalRecords: any = 0;
  @ViewChild("pagination") pagination: any;

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
    startDate: moment().subtract(7, "days"),
    endDate: moment(),
  };

  columns: any[] = [];
  rows: any[] = [];
  no_data: string = '';  

  ranges = {
    Today: [moment(), moment()],
    Yesterday: [moment().subtract(1, "days"), moment().subtract(1, "days")],
    "Last 7 Days": [moment().subtract(6, "days"), moment()],
    "Last 30 Days": [moment().subtract(29, "days"), moment()],
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

  localeValue = {
    format: "DD/MM/YYYY",
    displayFormat: "DD-MM-YYYY",
    separator: " - ",
    cancelLabel: "Cancel",
    applyLabel: "Okay",
  };

  maxDate: any = moment();

  stateMap: Map<any, any> = new Map()
  districtMap: Map<any, any> = new Map()
  tehsilMap: Map<any, any> = new Map()
  seasonMap: Map<any, any> = new Map()
  yearMap: Map<any, any> = new Map()

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
    this.setupFilterSubscriptions();
  }

  setupFilterSubscriptions() {
    this.lookupLoader = true;
    this.filter.fetchedDistrictData.subscribe(() => {
      this.assignFilterData();
    });

    if (this.filter.isDistrictFetched) {
      this.assignFilterData();
    }
  }

  private assignFilterData() {
    this.districts = this.filter.districts;
    this.tehsils = this.filter.tehsils;
    this.setInputData();
  }

  setInputData() {
    this.lookupLoader = false;
    this.yearData = this.filter.years
    this.seasonData = this.filter.seasons
    this.statesData = this.filter.lookupData?.states;

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
          .filter(
            (dist: any) =>   dist.state_id == state.state_id
          );
        return state;
      });
    }
  }

  onDistSelect(event: any) {
    this.blockData = [];
    this.selectedBlock = [];
    if (event?.length) {
      this.blockData = event.map((d: any) => {
        d.items = this.tehsils.filter(
          (e: any) => e.district_id == d.district_id
        );
        return d;
      });
    }
  }
  
  onTehsilSelect(event: any) {}
  
  private buildRequest(page_no: number, records_per_page: number) {
    const start_date = this.selectedFromDate?.startDate?.format("YYYY-MM-DD") || null;
    const end_date = this.selectedFromDate?.endDate?.format("YYYY-MM-DD") || null;
    const tehsilKey = this.projectContext === 'munichre' ? 'tehsil' : 'tehsils';
    const request: any = {
      purpose: 'get_chm_location',
      year: this.selectedYear,
      season: this.selectedSeason,
      state: this.selectedState.map((d) => d.state_id),
      district: this.selectedDist.map((d) => d.district_id),
      start_date,
      end_date,
      pagination: {
        page_no,
        records_per_page,
      }
    };
    request[tehsilKey] = this.selectedBlock.map((d) => d.tehsil_id);
    if (this.projectContext !== 'munichre') {
      if (![1, 2].includes(+this.currentUser.user_role)) {
        if (!request.state.length) {
          request.state = this.filter.states.map((d) => d.state_id);
        }
        if (!request.district.length) {
          request.district = this.filter.districts.map((d) => d.district_id);
        }
        if (!request[tehsilKey].length) {
          request[tehsilKey] = this.filter.tehsils.map((d) => d.tehsil_id);
        }
      }
    }
    return request;
  }

  applyFilter() {
    if (this.projectContext === 'munichre') {
      if (!this.selectedYear) {
        this.core.toast('warn', 'Year is required')
        return
      }
      if (!this.selectedSeason) {
        this.core.toast('warn', 'Season is required')
        return
      }
    }
    this.rows = [];
    this.no_data = this.rows.length < 1 ? 'No data found' : '';
    this.currentpage = 1;
    const request = this.buildRequest(this.currentpage, this.recordsPerPage);
    this.getViewCHMData(request);
  }

  getViewCHMData(request: any) {
    this.loading++
    this.core.dashboard_post(request).then((response: any) => {
      if (response?.status == 1) {
        this.totalRecords = response?.total_records || 0;
        this.rows = response?.location || []
        this.no_data = this.rows.length < 1 ? 'No data found' : '';
        for (let r = 0; r < this.rows.length; r++) {
          const row = this.rows[r];
          for (let i = 0; i < this.columns.length; i++) {
            const col = this.columns[i];
            switch (col.field) {
              case "state": {
                row[col.field] = this.stateMap.get(row[col.field]);
                break;
              }
              case "district": {
                row[col.field] = this.districtMap.get(row[col.field]);
                break;
              }
              case "year": {
                row[col.field] = this.yearMap.get(row[col.field]);
                break;
              }
              case "season": {
                row[col.field] = this.seasonMap.get(row[col.field]);
                break;
              }
              case "tehsil" : {
                row[col.field] = this.tehsilMap.get(row[col.field]);
                break;
              }
            }
          }
        }
      }
      setTimeout(() => {
        if (this.pagination) {
          this.pagination.updatePagination();
        }
      })
    }).catch(err => {
      this.insightsService.logException(err);
    }).finally( () => this.loading--)
  }

  onPageTrigger(event: any) {
    this.currentpage = event?.page_no;
    this.recordsPerPage = event?.records_per_page;    
    this.rows = [];
    const request = this.buildRequest(this.currentpage, this.recordsPerPage);
    this.getViewCHMData(request)
  }

  getColumns() {
    this.columns = [
      {
        field: "id",
        header: "ID",
      },
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
        field: "lat",
        header: "Latitude",
      },
      {
        field: "lng",
        header: "Longitude",
      },
      {
        field: "added_datetime",
        header: "Date Time",
      },
    ];
  }

  downloadExcel() {
    const request = this.buildRequest(1, this.totalRecords);
    this.loading++;
    this.core.dashboard_post(request).then((response: any) => {
      if (response?.status == 1) {
        const tempRows = response?.location || [];
        const fieldMap: { [key: string]: Map<any, any> | undefined } = {
          state: this.stateMap, district: this.districtMap,
          year: this.yearMap, season: this.seasonMap, tehsil: this.tehsilMap
        };
        tempRows.forEach((row: any) => {
          this.columns.forEach((col: any) => {
            const map = fieldMap[col.field];
            if (map) {
              row[col.field] = map.get(row[col.field]) || row[col.field];
            }
          });
        });
        const jsonData = tempRows.map((data: any) => 
          this.columns.map((col: any) => data[col.field])
        );
        jsonData.unshift(this.columns.map((d: any) => d.header));
        const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(jsonData);
        const wb: XLSX.WorkBook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "chm_field_data");
        XLSX.writeFile(wb, `${moment(new Date()).format("YYYYMMDD")}_chm_field_data.xlsx`);
      }
    }).catch((err) => {
      this.insightsService.logException(err);
    }).finally(() => this.loading--);
  } 
}
