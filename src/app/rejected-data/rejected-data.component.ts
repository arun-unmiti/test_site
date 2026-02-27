import { Component, OnInit } from '@angular/core';
import { CoreService } from '../utilities/core.service';
import { InsightsService } from '../utilities/insights.service';

@Component({
  selector: 'app-rejected-data',
  templateUrl: './rejected-data.component.html',
  styleUrls: ['./rejected-data.component.css']
})
export class RejectedDataComponent implements OnInit {

  surveys: any[] = [];
  loading = 0;

  constructor(private core: CoreService, private insightsService: InsightsService) {}

  active = 0;
  ngOnInit(): void {
    this.getSurveryData();
  }

  getSurveryData() {
    const request = { purpose: "get_surveys" };
    this.loading++;
    this.core.post(request).then((response: any) => {
      if (response?.status) {
        this.surveys = response.surveys || [];
      }
    }).catch((error) => this.insightsService.logException(error)).finally(() => this.loading--)
  }
}
