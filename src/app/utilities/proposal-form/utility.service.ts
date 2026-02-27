import { Injectable } from '@angular/core';
import { CoreService } from '../core.service';
import { FeatureToggleService } from '../../shared/services/feature-toggle.service';
import * as moment from 'moment';

@Injectable({
  providedIn: 'root',
})
export class UtilityService {
  constructor(
    private coreService: CoreService,
    private featureToggle: FeatureToggleService
  ) {}

  generateFile(url: string, filename: string) {
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  downloadKml(data: any) {
    const config = this.featureToggle.getConfig();
    const url = config.BASEKMLPREFIX + data?.file_name + config.BASEKMLSUFFIX;
    if (data?.coordinates) {
      const coordinates = JSON.parse(data.coordinates).map((d: any) => d.split(',').reverse());
      const kmlText = `<?xml version="1.0" encoding="UTF-8"?>
                      <kml xmlns="http://www.opengis.net/kml/2.2">
                            <Document>
                              <Placemark>
                                  <ExtendedData></ExtendedData>
                                  <Polygon>
                                    <outerBoundaryIs>
                                      <LinearRing>
                                        <coordinates>
                                          ${coordinates.join('\n')}
                                        </coordinates>
                                      </LinearRing>
                                    </outerBoundaryIs>
                                  </Polygon>
                                  </Placemark>
                                  </Document>
                        </kml>`;
      const blob = new Blob([kmlText], { type: 'text/plain' });
      const downloadLink = document.createElement('a');
      downloadLink.href = URL.createObjectURL(blob);
      downloadLink.download = `${moment().format('YYYYMMDDHHmmSS')}.kml`;
      downloadLink.click();
    } else {
      this.generateFile(url, data?.file_name);
    }
  }

  updatePageReport(component: any) {
    const startRecord = (component.currentpage - 1) * component.recordsPerPage + 1;
    const endRecord = Math.min(component.currentpage * component.recordsPerPage, component.totalRecords);
    const totalPages = Math.ceil(component.totalRecords / component.recordsPerPage);
    component.page_text = `Page ${component.currentpage} of ${totalPages}; Records ${startRecord} to ${endRecord} of ${component.totalRecords}`;
  }

  invalidUpdatePageReport(component: any) {
    const startRecord = (component.invalidCurrentpage - 1) * component.invalidRecordsPerPage + 1;
    const endRecord = Math.min(component.invalidCurrentpage * component.invalidRecordsPerPage, component.invalidTotalRecords);
    const totalPages = Math.ceil(component.invalidTotalRecords / component.invalidRecordsPerPage);
    component.invalid_page_text = `Page ${component.invalidCurrentpage} of ${totalPages}; Records ${startRecord} to ${endRecord} of ${component.invalidTotalRecords}`;
  }
}