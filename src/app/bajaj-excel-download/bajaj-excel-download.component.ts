// src/app/bajaj-excel-download/bajaj-excel-download.component.ts
import { Component, OnInit } from '@angular/core';
import { CoreService } from '../utilities/core.service';
import { FeatureToggleService } from '../shared/services/feature-toggle.service';

@Component({
  selector: 'app-bajaj-excel-download',
  templateUrl: './bajaj-excel-download.component.html',
  styleUrls: ['./bajaj-excel-download.component.css']
})
export class BajajExcelDownloadComponent implements OnInit {
  surveyFile: any = '';

  constructor(
    private core: CoreService,
    private featureToggle: FeatureToggleService
  ) {}

  ngOnInit(): void {}

  downloadExcel(anchor: any) {
    if (!this.surveyFile) {
      this.core.toast('warn', 'Please select survey');
    }
    if (anchor) {
      anchor.href = (this.featureToggle.getConfig().BASEDATAURI || '') + this.surveyFile;
      anchor.click();
    }
  }
}