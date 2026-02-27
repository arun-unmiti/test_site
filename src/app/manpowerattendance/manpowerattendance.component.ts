import { Component, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { CoreService } from "../utilities/core.service";
import { FilterService } from "../utilities/filter.service";
import * as moment from "moment";
import {
  DateAdapter,
  MAT_DATE_FORMATS,
  MAT_DATE_LOCALE,
} from "@angular/material/core";
import * as d3 from "d3";
import * as topojson from "topojson";
import * as L from "leaflet";
import "leaflet.markercluster";
import "leaflet-groupedlayercontrol";
import "leaflet.heat";
import { UserDetailService } from "../auth/user-detail.service";
import { FeatureToggleService } from "../shared/services/feature-toggle.service"; // Import FeatureToggleService
import { environment, ProjectContext } from "../../environments/environment"; // Import environment

export const MY_FORMATS = {
  parse: {
    dateInput: "LL",
  },
  display: {
    dateInput: "LL",
    monthYearLabel: "MMM YYYY",
    dateA11yLabel: "LL",
    monthYearA11yLabel: "MMMM YYYY",
  },
};

@Component({
  selector: "app-manpowerattendance",
  templateUrl: "./manpowerattendance.component.html",
  styleUrls: ["./manpowerattendance.component.css"],
  providers: [{ provide: MAT_DATE_FORMATS, useValue: MY_FORMATS }],
})
export class ManpowerattendanceComponent implements OnInit, OnDestroy {
  active = 1;
  selectedFromDate: any = { startDate: moment().subtract(6, "days"), endDate: moment() };
  localeValue = { format: "DD/MM/YYYY", displayFormat: "DD-MM-YYYY", separator: " - ", cancelLabel: "Cancel", applyLabel: "Okay" };

  selectedClient: any;
  selectedState: any[] = [];
  selectedDist: any[] = [];
  stateCountData: any[] = [];
  selectedEnumerator: any;
  model = {
    left: true,
    middle: false,
    right: false,
  };

  label: any = {};
  maxSurvey = 0;
  minSurvey = 0;
  loader = 0;

  locationData: any;
  userData: any[] = [];
  clientData: any[] = [];
  statesData: any[] = [];
  districtData: any[] = [];

  private map: any;
  cluster: any[] = [];
  lastLatLong: any;
  selectedUsers: any[] = [];
  userDetail: any;
  selectedUserIdArray: any[] = [];
  surveyColors: any = {};

  ranges = {
    Today: [moment(), moment()],
    Yesterday: [moment().subtract(1, "days"), moment().subtract(1, "days")],
    "Last 7 Days": [moment().subtract(6, "days"), moment()],
    "Last 30 Days": [moment().subtract(29, "days"), moment()],
    "This Month": [moment().startOf("month"), moment().endOf("month")],
    "Last Month": [moment().subtract(1, "month").startOf("month"), moment().subtract(1, "month").endOf("month")],
    "Last 3 Month": [moment().subtract(3, "month").startOf("month"), moment().subtract(1, "month").endOf("month")],
  };

  districts: any[] = [];
  clientStates: any[] = [];
  clientDistricts: any[] = [];
  showMap: boolean = true;
  stateDataLoading = 0;
  countryGeoJson: any;

  projectContext: ProjectContext; // Add projectContext
  assetsFolder: string; // Add assetsFolder

  constructor(
    private core: CoreService,
    private filter: FilterService,
    private userService: UserDetailService,
    private featureToggle: FeatureToggleService // Inject FeatureToggleService
  ) {
    this.projectContext = this.featureToggle.getContext() as ProjectContext; // Initialize projectContext
    this.assetsFolder = environment.projectConfigs[this.projectContext].assetsFolder; // Initialize assetsFolder
  }

  ngOnInit(): void {
    this.label = {};
    this.userDetail = this.userService.getUserDetail();
    if (this.assetsFolder === 'munichre') {
      this.selectedClient = [{ UNIT_ID: "2000" }];
    }
    this.initData();
  }

  initData() {
    this.loader++;
    if (this.filter.isDataFetched) {
      if (this.userDetail?.unit_id) {
        this.selectedClient = [{ UNIT_ID: this.userDetail.unit_id }];
        this.onClientSelect(this.selectedClient);
      }
      this.setInputData();
      this.loader--;
    } else {
      this.filter.fetchedLookupData.subscribe(() => {
        if (!this.statesData?.length) {
          if (this.userDetail?.unit_id) {
            this.selectedClient = [{ UNIT_ID: this.userDetail.unit_id }];
            this.onClientSelect(this.selectedClient);
          }
          this.setInputData();
          this.loader--;
        }
      });
    }
  }

  ngAfterViewInit(): void {
    this.surveyColors["totalSurvey"] = "#11f0cb";
    this.initMap();
  }

  clearData() {}

  initMap() {
    const street = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 18 });

    const satellite = L.tileLayer("https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}", {
      subdomains: ["mt0", "mt1", "mt2", "mt3"],
      maxZoom: 18,
    });

    this.map = L.map("mapk", {
      center: [20.5937, 78.9629],
      layers: [street],
      zoom: 8,
    });

    const home = {
      lat: 78.9629,
      lng: 20.5937,
      zoom: 8,
    };

    const stateChangingButton = (L as any).easyButton({
      states: [
        {
          stateName: "zoom-to-home",
          icon: "fa-home",
          title: "Zoom To Home",
          onClick: function (btn: any, map: any) {
            map.setView([20.5937, 78.9629], 4);
            btn.state("zoom-to-home");
          },
        },
      ],
    });
    stateChangingButton.addTo(this.map);

    const baseLayers = {
      Street: street,
      Satellite: satellite,
    };
    const module: any = L;
    module.control.groupedLayers(baseLayers).addTo(this.map);
    this.generateBoundries();

    this.map.setView([20.5937, 78.9629], 4);
  }

  generateBoundries() {
    const markerClusters = L.markerClusterGroup({});
    this.map.addLayer(markerClusters);
    d3.json(`${this.assetsFolder}/maps/india.topojson`) // Use dynamic assetsFolder
      .then((topology: any) => {
        let countryGeoJson: any = topojson.feature(topology, topology.objects["collection"]);
        const geoJsonProp = {
          style: (_: any) => {
            return { color: "grey", weight: "1" };
          },
          pointToLayer: (_: any, latLng: any) => L.marker(latLng),
        };
        let markers = L.geoJSON(countryGeoJson, Object.assign(geoJsonProp));
        markerClusters.addLayer(markers);
        this.map.fitBounds(markers.getBounds());
        this.countryGeoJson = countryGeoJson;
      })
      .catch((err) => {
        console.error(err);
      });
  }

  setInputData() {
    this.clientData = this.filter?.clients || [];
    this.statesData = this.filter?.states || [];
    this.districts = this.filter?.districts || [];
    this.setDefaultLocation();
    if (this.statesData?.length) {
      this.applyFilter();
    }
  }

  setDefaultLocation() {
    const location = this.userService.getLocation();
    if (location?.states) {
      this.selectedState = this.statesData;
      this.onStateSelect(this.selectedState);
      if (location?.districts) {
        this.selectedDist = this.districts;
        this.onDistSelect(this.selectedDist);
      }
    }
  }

  async onClientSelect(event: any) {
    this.statesData = [];
    this.districtData = [];
    this.selectedState = [];
    this.selectedDist = [];
    this.clientStates = [];
    this.clientDistricts = [];

    if (event?.length) {
      [this.clientStates, this.clientDistricts] = await this.filter.getClientWiseLocation(event);
    }
    this.statesData = this.core.clone(this.filter.states).filter((item: any) => (!this.clientStates?.length || this.clientStates.includes(item.state_id)));
  }

  async onStateSelect(event: any) {
    this.districtData = [];
    this.selectedDist = [];
    if (event?.length) {
      this.districtData = this.core.clone(event).map((state: any) => {
        state.items = this.core.clone(this.filter.districts).filter(
          (dist: any) => (!this.clientDistricts?.length || this.clientDistricts.includes(dist.district_id)) && dist.state_id == state.state_id
        );
        return state;
      });
    }
  }

  onDistSelect(env: any) {}

  applyFilter() {
    this.label = {};
    this.maxSurvey = 0;
    this.minSurvey = 0;
    const start_date = this.selectedFromDate?.startDate?.format("YYYY-MM-DD");
    const end_date = this.selectedFromDate?.endDate?.format("YYYY-MM-DD");
    const request = {
      purpose: "get_manpower_dashboard_total",
      states: this.selectedState.map((d) => d.state_id),
      districts: this.selectedDist.map((d) => d.district_id),
      client_id: this.selectedClient?.map((d: any) => d.UNIT_ID),
      start_date,
      end_date,
    };

    if (!request.states?.length) {
      request.states = this.statesData.map((d) => d.state_id);
    }
    if (!request.districts?.length) {
      request.districts = this.districts.map((d) => d.district_id);
    }
    this.loader++;
    if (this.map?.eachLayer) {
      this.map.eachLayer((l: any) => {
        if (l.options.id && l.options.id.indexOf("country-") === 0) {
          this.map.removeLayer(l);
        }
      });
    }
    this.core.post(request).then((response: any) => {
      if (response?.status == 1) {
        this.label = response.total || {};
        this.getStateData(request);
      }
    }).catch((err) => {
      console.error(err);
    }).finally(() => this.loader--);
  }

  getStateData(request: any) {}

  countryBubbleMap() {
    if (this.countryGeoJson?.features?.length && this.stateCountData?.length) {
      for (let i = 0; i < this.countryGeoJson.features.length; i++) {
        const feature = this.countryGeoJson.features[i];
        feature.properties.no_of_cce = null;
        feature.properties.no_of_chm = null;
        feature.properties.no_of_cls = null;
        feature.properties.totalSurvey = null;
        if (feature.properties?.stateId) {
          const state = this.stateCountData.find((d) => d.state_id == feature.properties.stateId);
          if (state) {
            feature.properties.no_of_cce = state.no_of_cce;
            feature.properties.no_of_chm = state.no_of_chm;
            feature.properties.no_of_cls = state.no_of_cls;
            feature.properties.totalSurvey = state.totalSurvey;
          }
        }
      }
    }
    let tooltip: any;
    const model: any = L;
    let bubbles = model.d3SvgOverlay(
      (selection: any, projection: any) => {
        let pScale = projection.scale > 1 ? 1 : projection.scale;
        const bubbleScale = d3
          .scaleLinear()
          .range([3, 10])
          .domain([this.minSurvey, this.maxSurvey]);
        let locationGroup = selection
          .selectAll("circle")
          .data(this.countryGeoJson.features);
        for (let survey of Object.keys(this.surveyColors)) {
          locationGroup
            .enter()
            .append("circle")
            .attr("d", (d: any) => projection.pathFromGeojson(d))
            .attr("cx", (d: any) => projection.pathFromGeojson.centroid(d)[0])
            .attr("cy", (d: any) => projection.pathFromGeojson.centroid(d)[1])
            .attr("id", (d: any) =>
              d.properties.state
                ? `state_${survey}_${d.properties.state}`
                : null
            )
            .attr("style", "z-index:2000;pointer-events:visiblePainted !important")
            .attr("fill", this.surveyColors[survey])
            .attr("stroke", "black")
            .attr("stroke-width", "0.2px")
            .attr("fill-opacity", 1/2)
            .attr("r", (d: any) =>
              d.properties.state
                ? bubbleScale(d.properties[survey]) / pScale
                : 0
            )
            .on("mouseenter", (d: any, e: any) => {
              if (d.properties.state) {
                d3.select(`circle#state_${survey}_${d.properties.state}`).attr("cursor", "pointer");
                tooltip = projection.layer
                  .bindTooltip(this.shwToolTip(d.properties))
                  .openTooltip(
                    L.latLng(
                      projection.layerPointToLatLng(
                        projection.pathFromGeojson.centroid(d)
                      )
                    )
                  );
              }
            })
            .on("mouseleave", (d: any, e: any) => {
              if (d.properties.state) tooltip.closeTooltip();
            })
            .on("click", (d: any, e: any) => {
              this.label = {};
              if (d.properties.state) {
                const state = this.stateCountData.find((e) => e.state_id == d.properties.stateId);
                if (state) {
                  this.label = state;
                }
              }
            });
        }
      },
      { id: "country-bubble" }
    );
    if (bubbles?.addTo) bubbles?.addTo(this.map);
    this.map.setView([20.5937, 78.9629], 4);
  }

  shwToolTip(data: any, isDist?: any) {
    return `<div class="d-flex">
               <div><strong>${isDist ? data.district : data.state}</strong></div>
            </div>
            <div class="d-flex">
              <div><strong>No. of CHM</strong></div>
              <div><strong>:</strong></div>
              <div><strong>${data.no_of_chm}</strong></div>
            </div>
            <div class="d-flex">
              <div><strong>No. of CLS</strong></div>
              <div><strong>:</strong></div>
              <div><strong>${data.no_of_cls}</strong></div>
            </div>
            <div class="d-flex">
              <div><strong>No. of CCE</strong></div>
              <div><strong>:</strong></div>
              <div><strong>${data.no_of_cce}</strong></div>
            </div>`;
  }

  ngOnDestroy(): void {
    this.core.terminateAPICalls();
  }
}