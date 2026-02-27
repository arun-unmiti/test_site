import {
  Component,
  OnInit,
  AfterViewInit,
  Input,
  EventEmitter,
  Output,
  ViewChild,
} from "@angular/core";
import { environment, ProjectContext } from "src/environments/environment"; // Import environment and ProjectContext
import * as L from "leaflet";
import "leaflet.markercluster";
import "leaflet-groupedlayercontrol";
import "leaflet-easybutton";
import "leaflet.heat";
import "leaflet-draw";
import * as d3 from 'd3';
import { FeatureToggleService } from '../shared/services/feature-toggle.service';
import * as topojson from 'topojson';
import * as moment from "moment";
import { CoreService } from "../utilities/core.service";

declare const omnivore: any;
declare const tokml: any;

@Component({
  selector: "app-leafletmap",
  templateUrl: "./leafletmap.component.html",
  styleUrls: ["./leafletmap.component.css"],
})
export class LeafletmapComponent implements OnInit {
  @Input() uniqueId: any;
  @ViewChild("mapContent") mapContent: any;
  map: any;
  mapId = Math.random() * Math.random();
  @Input() height: any = "500px";
  @Input() width = "100%";
  @Input() lat = 20.5937;
  @Input() lng = 78.9629;
  @Input() zoomView = 4;
  @Input() locationData: any;
  mapData: any;
  @Input() mapType = "points";
  @Input() editableMap = false;
  @Input() showpopup = true;
  topoJsonURL: string; // Will be initialized with assetsFolder
  @Input() topoJsonName = "india.topojson";
  marks: any[] = [];
  pipeLines: any;
  @Output() pointClick: EventEmitter<any> = new EventEmitter<any>();
  @Output() getgeoJson: EventEmitter<any> = new EventEmitter<any>();
  drawLayerId: any[] = [];
  drawLayerMap: Map<any, any> = new Map();
  geoJsonLayer: any[] = [];
  @Input() areaIds: any[] = [];
  projectContext: ProjectContext; // Add projectContext
  assetsFolder: string; // Add assetsFolder

  constructor(private core: CoreService, private featureToggle: FeatureToggleService) {
    this.projectContext = this.featureToggle.getContext() as ProjectContext; // Initialize projectContext
    this.assetsFolder = environment.projectConfigs[this.projectContext].assetsFolder; // Initialize assetsFolder
    this.topoJsonURL = `${this.assetsFolder}/maps/`; // Use dynamic assetsFolder
  }

  ngOnInit(): void {
    this.mapData = this.locationData;
    setTimeout(() => this.initMap(), 1000);
  }

  resetMap(mapData: any) {
    this.map?.remove();
    this.mapData = mapData;
    this.initMap();
  }

  initMap() {
    const street = L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      { maxZoom: 20 }
    );

    const satellite = L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      maxZoom: 20,
    });

    const id = this.mapContent?.nativeElement?.id;
    if (!this.map) {
      this.map = L.map(id, {
        center: [this.lat, this.lng],
        layers: [satellite],
        zoom: this.zoomView,
      });

      const stateChangingButton = L.easyButton({
        states: [{
          stateName: 'zoom-to-home',
          icon: 'fa-home',
          title: 'Zoom To Home',
          onClick: (btn, map) => {
            map.setView([this.lat || 20.5937, this.lng || 78.9629], this.zoomView || 4);
            btn.state('zoom-to-home');
          }
        }]
      });
      stateChangingButton.addTo(this.map);

      const baseLayers = {
        'Satellite': satellite,
        'Street': street,
      };
      const module: any = L;
      module.control.groupedLayers(baseLayers).addTo(this.map);
      this.generateBoundries();
    }

    if (this.mapData) {
      if (this.mapType == "points") {
        this.mapPoints();
      } else if (this.mapType == "heat") {
        this.mapHeat();
      } else if (this.mapType == "pipeline") {
        this.pipeLineMap();
      } else if (this.mapType == "kml") {
        this.kmlMap();
      } else if (this.mapType == 'geoJson') {
        this.geoJsonMap();
      }
    }
    if (this.editableMap) {
      this.editLayer();
    }
    setTimeout(() => {
      this.map.setView([this.lat || 20.5937, this.lng || 78.9629], this.zoomView || 4);
    }, 500);
  }

  cluster: any = L.markerClusterGroup();
  lastLatLong: any = null;
  mapPoints() {
    if (this.cluster) {
      this.cluster.clearLayers();
      this.map.removeLayer(this.cluster);
    } else {
      this.cluster = L.markerClusterGroup();
    }

    this.mapData.forEach((location: any) => {
      if (parseFloat(location.lat) && parseFloat(location.lng)) {
        let marker = L.marker([location.lat, location.lng], {
          icon: L.icon({
            iconUrl: `${this.assetsFolder}/icons/marker-icon.png`, // Use dynamic assetsFolder
            iconSize: [10, 10],
          }),
        });

        if (this.showpopup) {
          marker.bindPopup(`<div>
            <b>Address</b> : <br>${location.address}<br><br>
            <b>Data ID</b>: <br>${location.data_id}<br><br>
            <b>Location ID</b>: <br>${location.location_id}
          </div>`);
        }

        marker.addEventListener('click', () => {
          this.pointClick.emit(location);
        });

        this.cluster.addLayer(marker);
        this.lastLatLong = [location.lat, location.lng];
      }
    });
    this.map.addLayer(this.cluster);
  }

  mapHeat() {
    const heat = L.heatLayer([], {
      radius: 20,
      max: 1.0,
      blur: 15,
      gradient: {
        0.0: "red",
        0.5: "yellow",
        1.0: "green",
      },
      minOpacity: 0.7,
    }).addTo(this.map);

    if (this.cluster) {
      this.cluster.clearLayers();
      this.map.removeLayer(this.cluster);
    } else {
      this.cluster = L.markerClusterGroup();
    }

    this.mapData.forEach((location: any) => {
      if (parseFloat(location.lat) && parseFloat(location.lng)) {
        heat.addLatLng([location.lat, location.lng, location.loss_percent]);
      }
    });

    this.map.addLayer(this.cluster);
  }

  pipeLineMap() {
    const userColor = "green";
    if (this.marks?.length) {
      this.marks.forEach((d: any) => d.remove());
    }
    if (this.pipeLines) {
      this.pipeLines.remove();
      this.pipeLines = null;
    }
    this.mapData.forEach((d: any) => {
      let marker = L.marker([d.lat, d.lng], {
        icon: new L.DivIcon({
          className: "custom-div-icon",
          html: `<div style='background-color:${userColor};' class='marker-pin'><i class="material-icons">${d.dayIndex}</i></div>`,
          iconSize: [30, 42],
          iconAnchor: [15, 42],
        }),
      }).addTo(this.map);
      if (this.showpopup) {
        marker.bindPopup(`
          <div class="container p-3">
              <strong>User Id</strong>: <span>${d.user_id}</span><br/>
              <strong>Time</strong>: <span>${d.date_time}</span><br/>
              <strong>Status</strong>: <span>${d.status}</span><br/>
              <strong>Position</strong>: <span>${d.dayIndex}/${this.mapData.length}</span><br/>
          </div>
        `);
      }
      
      this.marks.push(marker);
    });
    let latLngPoints = this.mapData.map((d: any) => [d.lat, d.lng]);
    this.pipeLines = L.polyline(latLngPoints)
      .setStyle({ color: userColor })
      .addTo(this.map);
  }

  async kmlMap() {
    const isMunichRe = this.projectContext === 'munichre';
    for (const kml of this.mapData) {
      try {
        let kmlTextOrUrl: string;
        if (isMunichRe) {
          const blob = await this.core.fetchAzureBlob(this.getkmlUrl(kml.file_name));
          kmlTextOrUrl = await blob.text();
        } else {
          kmlTextOrUrl = this.getkmlUrl(kml.file_name);
        }
        const point = isMunichRe
          ? omnivore.kml.parse(kmlTextOrUrl)
          : omnivore.kml(kmlTextOrUrl);
        point
          .addTo(this.map)
          .on('click', () => this.pointClick.emit({ type: 'kml', data: kml }));
        point.bringToFront();
        this.drawLayerId.push(point._leaflet_id);
        this.drawLayerMap.set(point._leaflet_id, kml.kml_id);
      } catch (err: any) {
        const message = err?.message || 'An unexpected error occurred';
        this.core.toast('error', `Failed to load KML ${kml.file_name}: ${message}`);
      }
    }
  }

  geoJsonMap() {
    const geoJsonLayer: any[] = [];
    const pointClick = this.pointClick;
    function onEachFeature(feature: any, layer: any) {
      layer.on('click', () => {
        pointClick.emit(feature);
      });
      layer.bringToBack();
      geoJsonLayer.push(layer);
    }
    const geoJson: any = {
      type: "FeatureCollection",
      features: this.mapData,
    };

    const mapModule: any = L;
    const layers = mapModule.geoJSON([geoJson], {
      onEachFeature: onEachFeature,
      style: function (feature: any) {
        return feature.properties && feature.properties.style;
      },
    });
    if (!this.editableMap) {
      layers.addTo(this.map);
    }
    this.geoJsonLayer = geoJsonLayer;
  }

  getkmlUrl(file: string) {
    const config = this.featureToggle.getConfig();
    return this.projectContext === 'munichre'
      ? `${config.BASEKMLPREFIX}${file}`
      : `${config.BASEKMLPREFIX}${file}${config.BASEKMLSUFFIX}`;
  }

  generateBoundries() {
    const markerClusters = L.markerClusterGroup({});
    this.map.addLayer(markerClusters);
    d3.json(`${this.topoJsonURL}${this.topoJsonName}`)
      .then((topology: any) => {
        let countryGeoJson: any = topojson.feature(topology, topology.objects['collection']);
        const geoJsonProp = {
          style: (_: any) => {
            if (this.areaIds.includes(_?.properties?.district_Id + '')) {
              return { color: "yellow", weight: "1" };
            }
            return { color: "grey", weight: "1" };
          },
          pointToLayer: (_: any, latLng: any) => L.marker(latLng),
        };
        let markers = L.geoJSON(countryGeoJson, Object.assign(geoJsonProp));
        markerClusters.addLayer(markers)
          .bringToBack();
        this.map.fitBounds(markers.getBounds());
        markers.bringToBack();
      })
      .catch(err => {
        console.error(err);
      });
  }

  editLayer() {
    const editableLayers = new L.FeatureGroup();
    this.map.addLayer(editableLayers);
    if (this.geoJsonLayer?.length) {
      this.geoJsonLayer.forEach(d => editableLayers.addLayer(d));
    }

    const MyCustomMarker = L.Icon.extend({
      options: {
        shadowUrl: null,
        iconAnchor: new L.Point(12, 12),
        iconSize: new L.Point(24, 24),
        iconUrl: `${this.assetsFolder}/icons/marker-icon.png` // Use dynamic assetsFolder
      }
    });

    this.drawLayerId.push(editableLayers.getLayerId(editableLayers));

    const options = {
      position: 'topleft',
      draw: {
        polygon: {
          allowIntersection: true,
          drawError: {
            color: '#e1e100',
            message: '<strong>Oh snap!<strong> you can\'t draw that!'
          },
          shapeOptions: {
            color: '#3f88e0'
          }
        },
        polyline: false,
        circle: false,
        rectangle: false,
        circlemarker: false,
        marker: false,
      },
      edit: {
        featureGroup: editableLayers,
        remove: true
      }
    };

    const mapModule: any = L;
    const drawControl = new mapModule.Control.Draw(options);
    this.map.addControl(drawControl);

    this.map.on(mapModule.Draw.Event.CREATED, function (e: any) {
      const type = e.layerType,
        layer = e.layer;
      editableLayers.addLayer(layer);
    });

    this.map.on('draw:edited', function (e: any) {
      var layers = e.layers;
      layers.eachLayer(function (layer: any) {
        // Do whatever you want; most likely save back to db
      });
    });
  }

  generateKML() {
    const drawLayers: any[] = [];
    this.map.eachLayer((e: any) => {
      if (e.toGeoJSON && this.drawLayerId.includes(e._leaflet_id))
        drawLayers.push(e);
    }, '');
    const geoJson: any = { "type": "FeatureCollection", "features": [] };

    const kmlids: any[] = [];
    drawLayers.forEach(d => {
      const geoJsonData = d.toGeoJSON();
      if (geoJsonData?.features) {
        const kmlId = this.drawLayerMap.get(d._leaflet_id);
        const features = d.toGeoJSON().features;
        if (features?.length) {
          features.forEach((d: any) => d.properties.kml_id = kmlId);
          if (!kmlids.includes(kmlId)) {
            geoJson.features.push(...features);
            kmlids.push(kmlId);
          }
        }
      }
    });
    return { geoJson, tokml };
  }

  downloadTextFile(name: any, data: any) {
    const timeStamp = moment().format('YYYYMMDD');
    const fileex = '.kml';
    const link = document.createElement("a");
    link.setAttribute("href", 'data:text/plain;charset=utf-8,' + encodeURIComponent(data));
    link.setAttribute("download", `${timeStamp}_${name}${fileex}`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}