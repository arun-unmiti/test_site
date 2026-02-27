import { Component, OnInit } from "@angular/core";
import { CoreService } from "../utilities/core.service";
import { FeatureToggleService } from '../shared/services/feature-toggle.service';
import { environment, ProjectContext } from '../../environments/environment';
import { InsightsService } from "../utilities/insights.service";

@Component({
  selector: "app-data",
  templateUrl: "./data.component.html",
  styleUrls: ["./data.component.css"],
})
export class DataComponent implements OnInit {

  surveys: any[] = [];
  loading = 0;
  projectContext: ProjectContext;
  assetsFolder: string;

  // active = 1;

  // model = {
  //   left: true,
  //   middle: false,
  //   right: false
  // };

  constructor(private core: CoreService, private featureToggle: FeatureToggleService, private insightsService: InsightsService) {
    this.projectContext = this.featureToggle.getContext() as ProjectContext;
    this.assetsFolder = environment.projectConfigs[this.projectContext].assetsFolder;
  }

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
