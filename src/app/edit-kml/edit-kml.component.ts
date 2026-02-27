import { HttpClient } from '@angular/common/http';
import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { CoreService } from '../utilities/core.service';
import * as geoJsonArea from '@mapbox/geojson-area';
import { GeojsonMapperService } from '../utilities/geojson-mapper.service';
import { FeatureToggleService } from '../shared/services/feature-toggle.service';
import { environment, ProjectContext } from '../../environments/environment';
import { InsightsService } from '../utilities/insights.service';

declare const tokml: any;
declare const toGeoJSON: any;

@Component({
  selector: 'app-edit-kml',
  templateUrl: './edit-kml.component.html',
  styleUrls: ['./edit-kml.component.css']
})
export class EditKmlComponent implements OnInit {

  loader = 0;
  @ViewChild('leafletMap') leafletMap: any;
  @Output() action: EventEmitter<any> = new EventEmitter();
  @Input() survey_id: any;
  @Input() data: any;
  @Input() editableMap = false;
  kmlUrl:any = "";
  kmlUrlSuffix:any  = "";
  data_id: any;
  kmlFileInfo: any;
  @Input() geoJsonData: any;
  lat: any;
  lng: any;
  showMap = false;
  topoJsonName = "all_districts.topojson";
  @Input() areaIds: any[]= []
  projectContext: ProjectContext;
  assetsFolder: string;

  constructor(private core: CoreService, private http: HttpClient, private geoMapper: GeojsonMapperService, private featureToggle: FeatureToggleService, private insightsService: InsightsService) { 
    this.projectContext = this.featureToggle.getContext() as ProjectContext;
    this.assetsFolder = environment.projectConfigs[this.projectContext].assetsFolder;
  }

  ngOnInit(): void {
    const config = this.featureToggle.getConfig();
    this.kmlUrl = config.BASEKMLPREFIX;
    this.kmlUrlSuffix  = config.BASEKMLSUFFIX;
    if (this.data && this.survey_id) {
      this.data_id = this.data.data_id;
      this.lat = +this.data.lat;
      this.lng = +this.data.lng;
    
      this.getKMLData();
    }
  }

  async onAction(purpose: any) {
    const requst: any = {purpose}
    if (purpose == 'update-kml') {
      if(this.leafletMap) {
        const layers: any = Object.values(this.leafletMap.map._layers).filter((d: any) => this.leafletMap.drawLayerId.includes(d._leaflet_id));
        const features = layers.map((d: any) => d.toGeoJSON(15)?.features).filter((d: any) => d).flat();
        if (!features?.length) {
          this.core.toast('warn', 'Please draw KML area')
          return
        }
        if (features?.length > 1) {
          this.core.toast('warn', 'Invalid KML area')
          return
        }
        features.forEach((d: any) => {
          d.properties = this.geoJsonData?.[0]?.properties || {name: this.data.case_ID + '.kml'}
        });

        const coordinates = features[0].geometry.coordinates
        const geoJson: any = {
          type: "FeatureCollection",
          features
        };
        const  coordinatesText = this.geoMapper.coordinateToString(coordinates);
        const nm = this.geoMapper.computeArea(coordinates)*0.00024710538;
        const nmh = (nm / 2.471).toFixed(2);
        // const kmlData = tokml(geoJson);
        // const blobObject =  new Blob([kmlData], {type: 'text/xml'});
        // requst.file = await this.getBase64Data(blobObject);
        requst.plot_data_id = this.data_id;
        requst.survey_id = this.survey_id;
        requst.latlng = this.getLatLng(geoJson);
        requst.measured_area = nmh + ' Hectare'; 
        requst.coordinates = coordinatesText;
        requst.name = this.data.case_ID;
        if (requst?.name?.trim().endsWith('.kml')) {
          requst.name = requst.name.trim().slice(0,-4);
        }
        // requst.kml_file_data = requst.file?.substring(requst.file?.indexOf('base64')+7) || '';
        // const getGeomentory = geoJsonArea.geometry;
        // requst.measured_area = getGeomentory(geoJson.features.find((d: any) => d).geometry);
        // if (requst.measured_area) {
        //   requst.measured_area = +(requst.measured_area / 4047).toFixed(3) + " Acres";
        // }
      }
    }
    this.action.emit(requst)
  }

  getKMLData() {
    if (this.geoJsonData) {
      const coordinates = this.geoJsonData.find((d: any) => d.geometry)?.geometry.coordinates?.find((d: any) => d.length)?.find((d: any) => d.length);
      if (coordinates?.length) {
        this.lat = coordinates[1];
        this.lng = coordinates[0];
      }
      setTimeout(() => {
        this.showMap = true;
      })
      return
    }
    const request = { "purpose": "get_files", "survey_id": this.survey_id, "type": "kml", "data_id": this.data_id }
    this.loader++;
    this.core.data_post(request).then(async (response: any) => {
      if (response?.status == 1) {
        if (response?.files?.length) {
          [this.kmlFileInfo] = response.files;
          if (this.kmlFileInfo.coordinates) {
            this.geoJsonData = this.geoMapper.stringToGeojson(this.kmlFileInfo.coordinates);
          } else {
            let url: string;
            if (this.projectContext === 'munichre') {
              url = this.kmlUrl + this.kmlFileInfo?.file_name;
            } else {
              url = this.kmlUrl + this.kmlFileInfo?.file_name + this.kmlUrlSuffix;
            }
            const geoJsonData = await this.getKMLFile(url);
            this.geoJsonData = geoJsonData.features;
          }
          this.action.emit({purpose: 'geojson-update', geoJsonData: this.geoJsonData})
          if (this.geoJsonData) {
            const coordinates = this.geoJsonData.find((d: any) => d.geometry)?.geometry.coordinates?.find((d: any) => d.length)?.find((d: any) => d.length);
            if (coordinates?.length) {
              this.lat = coordinates[1];
              this.lng = coordinates[0];
            }
          }
        }
        setTimeout(() => {
          this.showMap = true;
        })
      } else {
        this.core.toast("error",response.message)
      }
    }).catch(err => {
      this.insightsService.logException(err);
      this.core.toast("error","unable to fetch kml details")
    }).finally(() => this.loader--)
  }

  async getKMLFile(url: any) {
    // const header = { responseType: "text" };
    return await fetch(url).then(response => response.text())
    // this.http.get(url).toPromise()
    .then((response: any) => {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(response, "text/xml");
      if (xmlDoc.getElementsByTagName("outerBoundaryIs").length && xmlDoc.getElementsByTagName("innerBoundaryIs").length) {
        Array.from(xmlDoc.getElementsByTagName("innerBoundaryIs")).forEach(d => d.remove())
      }
      return toGeoJSON.kml(xmlDoc);
    }).catch(err => {
      this.insightsService.logException(err);
      return {};
    });
  }


  async getBase64Data(blobData: any) {
    return await new Promise((res,rej) => {
      const reader = new FileReader();
        reader.readAsDataURL(blobData); 
        reader.onloadend = function() {
          res(reader.result);
        }
    })
  }

  getLatLng(geoJson: any) {
    try {
      return geoJson.features
                              ?.find((d:any) => d).geometry.coordinates
                              ?.find((d:any) => d)
                              ?.find((d:any) => d)
                              ?.filter((d:any[],i: any) => i < 2)
                              ?.join(',')?.split(',')
                              ?.reverse()?.join() || '';

    } catch(e) {
      return '';
    }
  }

}
