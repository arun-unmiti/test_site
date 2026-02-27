import { Component, OnInit } from "@angular/core";
import * as moment from "moment";
import { FilterService } from "../utilities/filter.service";
import { CoreService } from "../utilities/core.service";
import * as XLSX from "xlsx";
import { UserDetailService } from "../auth/user-detail.service";
import { FeatureToggleService } from "../shared/services/feature-toggle.service";
import { environment, ProjectContext } from "../../environments/environment";

@Component({
  selector: "app-view-cce-implementation",
  templateUrl: "./view-cce-implementation.component.html",
  styleUrls: ["./view-cce-implementation.component.css"],
})
export class ViewCceImplementationComponent implements OnInit {
  loading: any = 0;
  lookupLoader = false;
  isFilterCollapsed = true;
  currentpage: any = 1;
  recordsPerPage: any = 10;

  selectedYear: any = "";
  yearData: any[] = [];
  selectedSeason: any = "";
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

  columns: any[] = [];
  rows: any[] = [];
  no_data: string = '';  

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
  riCircleMap: Map<any, any> = new Map();

  currentUser: any;
  projectContext: ProjectContext;
  assetsFolder: string;

  constructor(private filter: FilterService, private core: CoreService, private userService: UserDetailService, private featureToggle: FeatureToggleService) {
    this.projectContext = this.featureToggle.getContext() as ProjectContext;
    this.assetsFolder = environment.projectConfigs[this.projectContext].assetsFolder;
  }

  ngOnInit(): void {
    this.currentUser = this.userService.getUserDetail();
    this.getColumns();
    this.initializeFilterData();
  }

  initializeFilterData() {
    this.lookupLoader = true;
    if (this.filter.isDistrictFetched) {
      this.districts = this.filter.districts;
      this.tehsils = this.filter.tehsils;
      this.setInputData();
    } else {
      this.filter.fetchedDistrictData.subscribe(() => {
        this.districts = this.filter.districts;
        this.tehsils = this.filter.tehsils;
        this.setInputData();
      });
    }
  }

  setInputData() {
    this.lookupLoader = false;
    this.yearData = this.filter.years;
    this.seasonData = this.filter.seasons;
    this.statesData = this.filter.lookupData?.states;
    const setMap = (items: any[], map: Map<any, any>, idKey: string, nameKey: string, convertIdToNumber = false) => {
      items.forEach(item => map.set(convertIdToNumber ? +item[idKey] : item[idKey], item[nameKey]));
    };
    setMap(this.filter.states, this.stateMap, 'state_id', 'state_name');
    setMap(this.filter.districts, this.districtMap, 'district_id', 'district_name');
    setMap(this.filter.tehsils, this.tehsilMap, 'tehsil_id', 'tehsil_name');
    setMap(this.filter.blocks, this.blockMap, 'block_id', 'block_name');
    setMap(this.filter.grampanchayats, this.grampanchayatMap, 'grampanchayat_id', 'grampanchayat_name');
    setMap(this.filter.villages, this.villageMap, 'village_id', 'village_name');
    setMap(this.filter.seasons, this.seasonMap, 'id', 'season_name');
    setMap(this.filter.years, this.yearMap, 'id', 'year');
    setMap(this.filter.crops, this.cropMap, 'crop_code', 'crop_name', true);
    setMap(this.filter.notifiedUnits, this.notifiedUnitMap, 'notified_id', 'notified_unit_name');
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
        d.items = this.tehsils.filter(
          (e: any) => e.district_id == d.district_id
        );
        return d;
      });
    }
  }

  onTehsilSelect(event: any) {}

  applyFilter() {
    const start_date =
      this.selectedFromDate?.startDate?.format("YYYY-MM-DD") || null;
    const end_date =
      this.selectedFromDate?.endDate?.format("YYYY-MM-DD") || null;
    const request = {
      purpose: "get_cce_implementation",
      year: this.selectedYear,
      season: this.selectedSeason,
      state: this.selectedState.map((d) => d.state_id),
      district: this.selectedDist.map((d) => d.district_id),
      taluka: this.selectedBlock.map((d) => d.tehsil_id),

      start_date,
      end_date,
      pagination: {
        page_no: this.currentpage,
        records_per_page: this.recordsPerPage,
      },
    };
    if(![1, 2].includes(+this.currentUser.user_role)){
      if(!request.state.length){
        request.state = this.filter.states.map((d) => d.state_id);
      }
      if(!request.district.length){
        request.district = this.filter.districts.map((d) => d.district_id);
      }
      if(!request.taluka.length){
        request.taluka = this.filter.tehsils.map((d) => d.tehsil_id);
      }
    }
    this.loading++;
    this.core
      .dashboard_post(request)
      .then((response: any) => {
        if (response?.status == 1) {
          this.rows = response?.implementation || [];
          this.no_data = this.rows.length<1 ? 'No data found' : '';
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
                case "taluka": {
                  row[col.field] = this.tehsilMap.get(row[col.field]);
                  break;
                }
                case "ri_circle": {
                  row[col.field] = this.blockMap.get(row[col.field]);
                  break;
                }
                case "gp": {
                  row[col.field] = this.grampanchayatMap.get(row[col.field]);
                  break;
                }
                case "village": {
                  row[col.field] = this.villageMap.get(row[col.field]);
                  break;
                }
                case "notified_unit": {
                  row[col.field] = this.notifiedUnitMap.get(row[col.field]);
                  break;
                }
                case "crop": {
                  row[col.field] = this.cropMap.get(+row[col.field]);
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
              }
            }
          }
        }
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => this.loading--);
  }

  getColumns() {
    this.columns = [
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
        header: "DISTRICT",
      },
      {
        field: "taluka",
        header: "TALUKA",
      },
      {
        field: "ri_circle",
        header: "RI circle",
      },
      {
        field: "notified_area",
        header: "Notified area",
      },
      {
        field: "gp",
        header: "GP",
      },
      {
        field: "village",
        header: "Village",
      },

      {
        field: "notified_unit",
        header: "Notified Unit",
      },
      {
        field: "crop",
        header: "Crop",
      },
      {
        field: "cce_type",
        header: "CCE Type",
      },

      {
        field: "random_no",
        header: "Random no",
      },

      {
        field: "longitude",
        header: "Longitude",
      },
      {
        field: "latitude",
        header: "Latitude",
      },
      {
        field: "farmer_name",
        header: "Farmer Name",
      },
      {
        field: "farmer_mobile",
        header: "Farmer Mobile no",
      },
      {
        field: "shape_of_cce_plot",
        header: "Shape of CCE plot",
      },
      {
        field: "dimension_of_plot",
        header: "Dimension of plot",
      },
    ];
  }

  downloadExcel() {
    const fileName = "cce_implementation";
    const jsonData: any[] = this.rows.map((data) => {
      const row = [];
      for (let i = 0; i < this.columns.length; i++) {
        const field = this.columns[i];
        const cell = data[field.field];
        row.push(cell);
      }
      return row;
    });
    jsonData.unshift(this.columns.map((d) => d.header));
    const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(jsonData);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    const sheetName = fileName;
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(
      wb,
      `${moment(new Date()).format("YYYYMMDD")}_${fileName}.xlsx`
    );
  }
}
