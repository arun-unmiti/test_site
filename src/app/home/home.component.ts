import { Component, OnInit } from '@angular/core';
import { UserDetailService } from '../auth/user-detail.service';
import { FeatureToggleService } from '../shared/services/feature-toggle.service';
import { ProjectContext } from '../../environments/environment';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  dataLinks: any[] = [];
  screens: any[] = [];
  showLinks = true;
  projectContext: ProjectContext;
  projectTitle: string;

  constructor(
    private userService: UserDetailService,
    private featureToggle: FeatureToggleService
  ) {
    this.projectContext = this.featureToggle.getContext() as ProjectContext;
    // Set projectTitle based on projectContext
    switch (this.projectContext) {
      case 'saksham':
        this.projectTitle = 'Saksham';
        break;
      case 'munichre':
        this.projectTitle = 'MR Capture';
        break;
      default:
        this.projectTitle = 'App';
    }

    const user = this.userService.getUserDetail();
    const userScreen = user.screens || {};
    this.screens = Object.keys(userScreen).filter((screen: any) => !['added_by', 'status'].includes(screen) && userScreen[screen] == 1);
    if (this.screens?.length) {
      this.showLinks = ['chm', 'revisit_chm', 'cls', 'cce', 'multipicking', 'other_activity'].some(e => this.screens.includes(e));
    }
    this.dataLinks = [
      {
        title: 'Pending', links: [
          { label: 'Crop Health Monitoring', link: '/chm/pending', authAgencyId: 'chm' },
          { label: 'Revisit CHM', link: '/revisit-chm/pending', authAgencyId: 'revisit_chm' },
          { label: 'Crop Loss Survey', link: '/cls/pending', authAgencyId: 'cls' },
          { label: 'Crop Cutting Experiment', link: '/cce/pending', authAgencyId: 'cce' },
          { label: 'Two step/Multipicking', link: '/multipicking/pending', authAgencyId: 'multipicking' },
          { label: 'Other Activity', link: '/other-activity/pending', authAgencyId: 'other_activity' },
        ]
      },
      {
        title: 'Approved', links: [
          { label: 'Crop Health Monitoring', link: '/chm/approved', authAgencyId: 'chm' },
          { label: 'Revisit CHM', link: '/revisit-chm/approved', authAgencyId: 'revisit_chm' },
          { label: 'Crop Loss Survey', link: '/cls/approved', authAgencyId: 'cls' },
          { label: 'Crop Cutting Experiment', link: '/cce/approved', authAgencyId: 'cce' },
          { label: 'Two step/Multipicking', link: '/multipicking/approved', authAgencyId: 'multipicking' },
          { label: 'Other Activity', link: '/other-activity/approved', authAgencyId: 'other_activity' },
        ]
      },
      {
        title: 'Rejected', links: [
          { label: 'Crop Health Monitoring', link: '/chm/rejected', authAgencyId: 'chm' },
          { label: 'Revisit CHM', link: '/revisit-chm/rejected', authAgencyId: 'revisit_chm' },
          { label: 'Crop Loss Survey', link: '/cls/rejected', authAgencyId: 'cls' },
          { label: 'Crop Cutting Experiment', link: '/cce/rejected', authAgencyId: 'cce' },
          { label: 'Two step/Multipicking', link: '/multipicking/rejected', authAgencyId: 'multipicking' },
          { label: 'Other Activity', link: '/other-activity/rejected', authAgencyId: 'other_activity' },
        ]
      },
    ];
  }

  title = 'Dashboard';

  ngOnInit(): void {
  }
}