import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { RouterTestingModule } from '@angular/router/testing';
import { NgbDropdownModule, NgbCollapseModule } from '@ng-bootstrap/ng-bootstrap';
import { SidebarModule } from 'primeng/sidebar';
import { PrimeNGConfig } from 'primeng/api';
import { FormsModule } from '@angular/forms';
import { SecurityContext } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { MainpageComponent } from './mainpage.component';
import { UserDetailService } from '../auth/user-detail.service';
import { FeatureToggleService } from '../shared/services/feature-toggle.service';
import { MenuItemService } from './menuitems';
import { CoreService } from '../utilities/core.service';
import { DomSanitizer } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { environment, ProjectContext } from '../../environments/environment';

interface MenuItem {
  menu_name: string;
  link?: string;
  icon: string;
  children?: MenuItem[];
  isCollase?: boolean;
}

const mockUserDetailService = {
  getUserDetail: jest.fn(() => ({ screens: {}, user_role: 0, unit_id: '', first_name: 'Test', last_name: 'User', client_logo: 'logo.png' })),
  onUserUpdate: { subscribe: jest.fn() },
  logout: jest.fn(),
};

const mockFeatureToggleService = {
  getContext: jest.fn(() => 'saksham' as ProjectContext),
  getConfig: jest.fn(() => ({ BASECLIENTIMG: 'baseimg/', BASECLIENTIMGSUFFIX: '.png' })),
  initializeUserContext: jest.fn(() => Promise.resolve()),
};

const mockMenuItemService = {
  getSideMenuItems: jest.fn<MenuItem[], [number, string, string[]]>(() => []),
};

const mockCoreService = {
  fetchAzureBlob: jest.fn(() => Promise.resolve(new Blob(['']))),
  toast: jest.fn(),
};

const mockDomSanitizer = {
  bypassSecurityTrustUrl: jest.fn(() => 'mock-url'),
  sanitize: jest.fn((context: SecurityContext, value: any) => {
    if (typeof value === 'string') {
      return value;
    }
    return value;
  }),
};

describe('MainpageComponent', () => {
  let component: MainpageComponent;
  let fixture: ComponentFixture<MainpageComponent>;
  let primengConfig: PrimeNGConfig;
  let router: Router;

  beforeAll(() => {
    Object.defineProperty(global, 'URL', {
      value: {
        createObjectURL: jest.fn(() => 'blob-url'),
      },
      configurable: true,
    });
  });

  beforeEach(async () => {
    (global.URL as any).createObjectURL = jest.fn(() => 'blob-url');

    await TestBed.configureTestingModule({
      declarations: [MainpageComponent],
      imports: [
        RouterTestingModule.withRoutes([{ path: '', component: MainpageComponent }]),
        NgbDropdownModule,
        NgbCollapseModule,
        SidebarModule,
        FormsModule,
        NoopAnimationsModule,
      ],
      providers: [
        { provide: PrimeNGConfig, useValue: { ripple: true } },
        { provide: UserDetailService, useValue: mockUserDetailService },
        { provide: FeatureToggleService, useValue: mockFeatureToggleService },
        { provide: MenuItemService, useValue: mockMenuItemService },
        { provide: CoreService, useValue: mockCoreService },
        { provide: DomSanitizer, useValue: mockDomSanitizer },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .overrideComponent(MainpageComponent, {
      remove: { providers: [MenuItemService] },
      add: { providers: [{ provide: MenuItemService, useValue: mockMenuItemService }] }
    })
    .compileComponents();

    fixture = TestBed.createComponent(MainpageComponent);
    component = fixture.componentInstance;
    primengConfig = TestBed.inject(PrimeNGConfig);
    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate');
  });

  it('should create the component', fakeAsync(() => {
    fixture.detectChanges();
    tick();
    expect(component).toBeTruthy();
  }));

  it('should set ripple to true on ngOnInit', fakeAsync(() => {
    fixture.detectChanges();
    tick();
    expect(primengConfig.ripple).toBe(true);
  }));

  it('should initialize userDetail and sideMenus in constructor', () => {
    fixture.detectChanges();
    expect(component.userDetail).toBeDefined();
    expect(component.sideMenus.length).toBe(0);
  });

  it('should call setClientLogo on ngOnInit', fakeAsync(() => {
    const setClientLogoSpy = jest.spyOn(component, 'setClientLogo');
    fixture.detectChanges();
    tick();
    expect(setClientLogoSpy).toHaveBeenCalled();
  }));

  it('should subscribe to onUserUpdate and call setClientLogo', fakeAsync(() => {
    const setClientLogoSpy = jest.spyOn(component, 'setClientLogo');
    const subscribeSpy = jest.spyOn(mockUserDetailService.onUserUpdate, 'subscribe').mockImplementation((cb) => cb());
    fixture.detectChanges();
    tick();
    expect(subscribeSpy).toHaveBeenCalled();
    expect(setClientLogoSpy).toHaveBeenCalledTimes(2);
  }));

  it('should set imgFile to sanitized URL for munichre context', async () => {
    (component as any).projectContext = 'munichre';
    (component as any).userDetail = { client_logo: 'test-logo.png' };
    const mockBlob = new Blob(['test']);
    mockCoreService.fetchAzureBlob.mockResolvedValue(mockBlob);
    await component.setClientLogo();
    expect(mockDomSanitizer.bypassSecurityTrustUrl).toHaveBeenCalledWith('blob-url');
    expect(component.imgFile).toBe('mock-url');
  });

  it('should set imgFile to null on error in setClientLogo', async () => {
    (component as any).projectContext = 'munichre';
    (component as any).userDetail = { client_logo: 'invalid.png' };
    mockCoreService.fetchAzureBlob.mockRejectedValue(new Error('Error'));
    await component.setClientLogo();
    expect(component.imgFile).toBeNull();
  });

  it('should set imgFile to constructed URL for non-munichre context', async () => {
    (component as any).projectContext = 'saksham';
    (component as any).userDetail = { client_logo: 'test-logo.png' };
    await component.setClientLogo();
    expect(component.imgFile).toBe('baseimg/test-logo.png.png');
  });

  it('should set default logo on image error', () => {
    const event = { target: { src: '' } } as any;
    component.onImageError(event);
    expect(event.target.src).toBe(`${component.assetsFolder}/images/default-logo.png`);
  });

  it('should toggle menu items correctly', () => {
    const mockMenus = [
      { isCollase: true },
      { isCollase: true },
    ];
    component.toggleMenuItems(mockMenus, 0);
    expect(mockMenus[0].isCollase).toBe(false);
    expect(mockMenus[1].isCollase).toBe(true);
  });

  it('should toggle shorter menu and update images', () => {
    component.onNavbarCollapseClcik();
    expect(component.isShorterMenu).toBe(true);
    expect(component.collapseImage).toContain('Nav_bar_close.svg');
  });

  it('should call logout on logout click', () => {
    component.logout();
    expect(mockUserDetailService.logout).toHaveBeenCalled();
  });

  it('should set summariesViewType if different', () => {
    component.summariesViewType = true;
    component.setSummaryView(false);
    expect(component.summariesViewType).toBe(false);
  });

  it('should not set summariesViewType if same', () => {
    component.summariesViewType = true;
    component.setSummaryView(true);
    expect(component.summariesViewType).toBe(true);
  });

  it('should navigate to profile and close sidebar on view profile', () => {
    component.onViewProfile();
    expect(router.navigate).toHaveBeenCalledWith(['/profile']);
    expect(component.visibleSidebar2).toBe(false);
  });

  // Additional tests

  describe('template interactions', () => {
    it('should render side menus recursively', () => {
      mockMenuItemService.getSideMenuItems.mockReturnValue([
        { menu_name: 'Menu1', link: '/menu1', icon: 'fa icon1' },
        { menu_name: 'Menu2', icon: 'fa icon-menu2', children: [{ menu_name: 'SubMenu', link: '/submenu', icon: 'fa icon2' }] },
      ]);
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelectorAll('li').length).toBeGreaterThan(0);
    });

    it('should handle navbar collapse click', () => {
      fixture.detectChanges();
      component.onNavbarCollapseClcik();
      expect(component.isShorterMenu).toBe(true);
      expect(component.collapseImage).toContain('Nav_bar_close.svg');
      component.onNavbarCollapseClcik();
      expect(component.isShorterMenu).toBe(false);
      expect(component.collapseImage).toContain('Navbarcollapse.svg');
    });

    it('should render client logo based on context', () => {
      (component as any).projectContext = 'saksham';
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.navbar-brand img')?.getAttribute('src')).toContain('saksham_logo.png');
    });
  });

  describe('error handling', () => {
    it('should set imgFile to null if no client_logo', async () => {
      (component as any).projectContext = 'munichre';
      (component as any).userDetail = { client_logo: null };
      await component.setClientLogo();
      expect(component.imgFile).toBeNull();
    });
  });
});