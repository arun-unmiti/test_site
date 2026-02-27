import { Component, OnInit } from '@angular/core';
import { OwlOptions } from 'ngx-owl-carousel-o';
import { PrimeNGConfig } from 'primeng/api';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { FeatureToggleService } from '../shared/services/feature-toggle.service';
import { UserDetailService } from '../auth/user-detail.service';
import { MenuItemService } from './menuitems';
import { CoreService } from '../utilities/core.service';
import { environment, ProjectContext } from '../../environments/environment';
import { Router } from '@angular/router'; // Added for navigation

@Component({
  selector: 'app-mainpage',
  templateUrl: './mainpage.component.html',
  styleUrls: ['./mainpage.component.css'],
  providers: [MenuItemService],
})
export class MainpageComponent implements OnInit {
  imgFile: SafeUrl | string | null = '';
  title = 'Main Page';
  isMenuCollapsed = true;
  isSideNavOpen = false;
  active = 1;
  surveys: any[] = [];
  sideMenus: any[] = [];
  isShorterMenu = false;
  summariesViewType = true;
  collapseImage: string;
  notcollapseImage: string;
  userDetail: any;
  visibleSidebar2: boolean = false; // Ensure boolean type
  projectContext: ProjectContext;
  assetsFolder: string;

  constructor(
    private primengConfig: PrimeNGConfig,
    private userService: UserDetailService,
    private menuService: MenuItemService,
    private featureToggle: FeatureToggleService,
    private core: CoreService,
    private sanitizer: DomSanitizer,
    private router: Router // Added for navigation
  ) {
    this.projectContext = this.featureToggle.getContext() as ProjectContext;
    this.assetsFolder = environment.projectConfigs[this.projectContext].assetsFolder;
    this.collapseImage = `${this.assetsFolder}/images/Navbarcollapse.svg`;
    this.notcollapseImage = `${this.assetsFolder}/images/Nav_bar_close.svg`;

    const user = typeof this.userService.getUserDetail === 'function'
      ? this.userService.getUserDetail()
      : { screens: {}, user_role: 0, unit_id: '' };
    const userScreen = user?.screens || {};
    const screens = Object.keys(userScreen).filter(
      (screen: any) => !['added_by', 'status'].includes(screen) && userScreen[screen] == 1
    );
    this.sideMenus = this.menuService.getSideMenuItems(user?.user_role, user?.unit_id, screens);
  }

  async ngOnInit(): Promise<void> {
    this.primengConfig.ripple = true;
    this.featureToggle.initializeUserContext();
    this.userDetail = typeof this.userService.getUserDetail === 'function'
      ? this.userService.getUserDetail()
      : { screens: {}, user_role: 0, unit_id: '' };
    await this.setClientLogo();

    this.userService.onUserUpdate.subscribe(async () => {
      this.userDetail = typeof this.userService.getUserDetail === 'function'
        ? this.userService.getUserDetail()
        : { screens: {}, user_role: 0, unit_id: '' };
      await this.setClientLogo();
    });
  }

  async setClientLogo(): Promise<void> {
    const config = this.featureToggle.getConfig();
    if (this.projectContext === 'munichre') {
      try {
        if (this.userDetail?.client_logo) {
          const imageUrl = `${config.BASECLIENTIMG}${this.userDetail.client_logo}`;
          const blob = await this.core.fetchAzureBlob(imageUrl);
          this.imgFile = this.sanitizer.bypassSecurityTrustUrl(URL.createObjectURL(blob));
        } else {
          this.imgFile = null;
        }
      } catch (err) {
        this.imgFile = null;
      }
    } else {
      this.imgFile = (config.BASECLIENTIMG || '') + (this.userDetail?.client_logo || '') + (config.BASECLIENTIMGSUFFIX || '');
    }
  }

  onImageError(event: Event): void {
    (event.target as HTMLImageElement).src = `${this.assetsFolder}/images/default-logo.png`;
  }

  toggleMenuItems(menus: any, index: any): void {
    for (let i = 0; i < menus.length; i++) {
      const menu = menus[i];
      if (i === index) {
        menu.isCollase = !menu.isCollase;
      } else {
        menu.isCollase = true;
      }
    }
  }

  onNavbarCollapseClcik(): void {
    this.isShorterMenu = !this.isShorterMenu;
    this.collapseImage = this.isShorterMenu
      ? `${this.assetsFolder}/images/Nav_bar_close.svg`
      : `${this.assetsFolder}/images/Navbarcollapse.svg`;
  }

  logout(): void {
    this.userService.logout();
  }

  setSummaryView(env: any): void {
    if (env !== this.summariesViewType) {
      this.summariesViewType = env;
    }
  }

  onViewProfile(): void {
    // Navigate to profile page or handle profile view logic
    this.router.navigate(['/profile']);
    this.visibleSidebar2 = false; // Close sidebar after navigation
  }

  customOptions: OwlOptions = {
    loop: true,
    mouseDrag: false,
    touchDrag: false,
    pullDrag: false,
    dots: false,
    navSpeed: 600,
    navText: [
      "<div class='nav-button owl-prev'>‹</div>",
      "<div class='nav-button owl-next'>›</div>",
    ],
    responsive: {
      0: { items: 1 },
      400: { items: 2 },
      760: { items: 3 },
      1000: { items: 4 },
    },
    nav: true,
  };
}