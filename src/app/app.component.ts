import { Component, HostListener, OnInit } from '@angular/core';
import { UserDetailService } from './auth/user-detail.service';
import { CoreService } from './utilities/core.service';
import { FeatureToggleService } from './shared/services/feature-toggle.service';
import { ProjectContext } from '../environments/environment';
import { InsightsService } from './utilities/insights.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  projects: ProjectContext[] = ['saksham', 'munichre'];
  selectedProject: ProjectContext;

  constructor(
    private userService: UserDetailService,
    private core: CoreService,
    private featureToggle: FeatureToggleService,
    private insightService: InsightsService
  ) {
    this.selectedProject = this.featureToggle.getContext();
    this.core.checkSessionTime();
    const config = this.featureToggle.getConfig();
    this.insightService.logPageView(`${config.title} Application Started`);
    // Subscribe to context changes
    this.featureToggle.featureContext$.subscribe(context => {
      this.selectedProject = context;
      this.featureToggle.setFaviconAndTitle();
    });
  }

  ngOnInit(): void {
    this.featureToggle.initializeUserContext();
    this.featureToggle.setFaviconAndTitle();
    this.tokenTimer();
  }

  switchContext(context: ProjectContext) {
    this.featureToggle.setContext(context);
  }

  @HostListener('document:keyup', ['$event'])
  @HostListener('document:click', ['$event'])
  @HostListener('document:wheel', ['$event'])
  @HostListener('document:mouseover')
  tokenTimer() {
    const user = this.userService.getUserDetail();
    if (user?.user_id) {
      this.userService.resetCount();
    }
  }
}