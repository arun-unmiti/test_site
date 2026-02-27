import { TestBed, inject } from '@angular/core/testing';
import { FeatureToggleService } from '../shared/services/feature-toggle.service';
import { MenuItemService } from './menuitems';
import { environment, ProjectContext, ProjectConfig } from '../../environments/environment';

describe('MenuItemService', () => {
  let service: MenuItemService;
  let featureToggle: jest.Mocked<FeatureToggleService>;

  beforeEach(() => {
    featureToggle = {
      getContext: jest.fn().mockReturnValue('munichre'),
      getConfig: jest.fn().mockReturnValue({
        enabledModules: ['chm', 'client_management'],
        BASEURI: '',
        BASEKMLPREFIX: '',
        BASEUSERIMG: '',
        config: '',
        assetsFolder: '',
        BASEKMLSUFFIX: '',
        BASEUSERIMGPREFIX: '',
        BASEUSERIMGSUFFIX: '',
        BASEUSERIMGEXTENSION: '',
        BASEKMLEXTENSION: '',
        ASSET_PATH: '',
        storage: '',
        favicon: '',
        title: '',
        logo: '',
      } as unknown as ProjectConfig),
    } as any;

    TestBed.configureTestingModule({
      providers: [
        MenuItemService,
        { provide: FeatureToggleService, useValue: featureToggle },
      ],
    });

    service = TestBed.inject(MenuItemService);
  });

  it('should create the component', () => {
    expect(service).toBeTruthy();
  });

  describe('constructor', () => {
    it('should set assetsFolder based on context', () => {
      featureToggle.getContext.mockReturnValue('munichre');
      const svc = new MenuItemService(featureToggle);
      expect(svc['assetsFolder']).toBe(environment.projectConfigs.munichre.assetsFolder);
    });
  });

  describe('getSideMenuItems', () => {
    it('should call authorizeMenu with menuItemLists', () => {
      const authorizeMenuSpy = jest.spyOn(service as any, 'authorizeMenu').mockReturnValue([]);
      service.getSideMenuItems('1', '2000', ['chm']);
      expect(authorizeMenuSpy).toHaveBeenCalledWith(expect.any(Array), '1', '2000', ['chm']);
    });
  });

  describe('authorizeMenu', () => {
    beforeEach(() => {
      featureToggle.getContext.mockReturnValue('munichre');
      featureToggle.getConfig.mockReturnValue({
        enabledModules: ['chm', 'client_management'],
        BASEURI: '',
        BASEKMLPREFIX: '',
        BASEUSERIMG: '',
        config: '',
        assetsFolder: '',
        BASEKMLSUFFIX: '',
        BASEUSERIMGPREFIX: '',
        BASEUSERIMGSUFFIX: '',
        BASEUSERIMGEXTENSION: '',
        BASEKMLEXTENSION: '',
        ASSET_PATH: '',
        storage: '',
        favicon: '',
        title: '',
        logo: '',
      } as unknown as ProjectConfig); // Mock full ProjectConfig to fix type error
    });

    it('should skip menus without link or children after filtering', () => {
      const menus = [
        {
          menu_name: "Empty Parent",
          link: "",
          children: [
            {
              menu_name: "Child",
              link: "/child",
              auth_role: ['2'],
              agency_screen_id: "child",
            },
          ],
          auth_role: [],
          agency_screen_id: "",
        },
      ];
      const result = (service as any).authorizeMenu(menus, '1', '2000', []);
      expect(result.length).toBe(0);
    });

    it('should handle recursion for children', () => {
      const menus = [
        {
          menu_name: "Parent",
          link: "",
          children: [
            {
              menu_name: "Child1",
              link: "/child1",
              auth_role: [],
              agency_screen_id: "",
            },
            {
              menu_name: "Child2",
              link: "/child2",
              auth_role: ['2'],
              agency_screen_id: "",
            },
          ],
          auth_role: [],
          agency_screen_id: "",
        },
      ];
      const result = (service as any).authorizeMenu(menus, '1', '2000', []);
      expect(result[0].children.length).toBe(1);
      expect(result[0].children[0].menu_name).toBe('Child1');
    });

    it('should filter based on enabledModules', () => {
      featureToggle.getConfig.mockReturnValue({
        enabledModules: [],
        BASEURI: '',
        BASEKMLPREFIX: '',
        BASEUSERIMG: '',
        config: '',
        assetsFolder: '',
        BASEKMLSUFFIX: '',
        BASEUSERIMGPREFIX: '',
        BASEUSERIMGSUFFIX: '',
        BASEUSERIMGEXTENSION: '',
        BASEKMLEXTENSION: '',
        ASSET_PATH: '',
        storage: '',
        favicon: '',
        title: '',
        logo: '',
      } as unknown as ProjectConfig); // Use 'unknown as ProjectConfig' to satisfy all properties
      const menus = [
        {
          menu_name: "CHM",
          link: "/chm",
          children: null,
          auth_role: [],
          agency_screen_id: "chm",
        },
      ];
      const result = (service as any).authorizeMenu(menus, '1', '2000', ['chm']);
      expect(result.length).toBe(0);
    });

    it('should include Create Client if munichre and enabled', () => {
      featureToggle.getContext.mockReturnValue('munichre');
      featureToggle.getConfig.mockReturnValue({
        enabledModules: ['client_management'],
        BASEURI: '',
        BASEKMLPREFIX: '',
        BASEUSERIMG: '',
        config: '',
        assetsFolder: '',
        BASEKMLSUFFIX: '',
        BASEUSERIMGPREFIX: '',
        BASEUSERIMGSUFFIX: '',
        BASEUSERIMGEXTENSION: '',
        BASEKMLEXTENSION: '',
        ASSET_PATH: '',
        storage: '',
        favicon: '',
        title: '',
        logo: '',
      } as unknown as ProjectConfig); // Use 'unknown as ProjectConfig' to satisfy all properties
      const menus = [
        {
          menu_name: "Client Management",
          link: "",
          children: [
            {
              menu_name: "Create Client",
              link: "/client/add-client",
              auth_role: [],
              agency_screen_id: "",
            },
          ],
          auth_role: [],
          agency_screen_id: "",
        },
      ];
      const result = (service as any).authorizeMenu(menus, '1', '2000', []);
      expect(result[0].children.length).toBe(1);
      expect(result[0].children[0].menu_name).toBe('Create Client');
    });
  });

  describe('menuItemLists', () => {
    beforeEach(() => {
      featureToggle.getContext.mockReturnValue('munichre');
      featureToggle.getConfig.mockReturnValue({
        enabledModules: ['chm', 'client_management'],
        BASEURI: '',
        BASEKMLPREFIX: '',
        BASEUSERIMG: '',
        config: '',
        assetsFolder: '',
        BASEKMLSUFFIX: '',
        BASEUSERIMGPREFIX: '',
        BASEUSERIMGSUFFIX: '',
        BASEUSERIMGEXTENSION: '',
        BASEKMLEXTENSION: '',
        ASSET_PATH: '',
        storage: '',
        favicon: '',
        title: '',
        logo: '',
      } as unknown as ProjectConfig); // Use 'unknown as ProjectConfig' to satisfy all properties
    });

    it('should return menu items with conditions', () => {
      const items = (service as any).menuItemLists;
      expect(items.length).toBeGreaterThan(0);
      expect(items[0].menu_name).toBe('Dashboard');
      // Check for conditional Create Client
      const clientManagement = items.find((m: any) => m.menu_name === 'Client Management');
      expect(clientManagement.children.some((c: any) => c.menu_name === 'Create Client')).toBe(true);
    });

    it('should exclude Create Client if not munichre', () => {
      featureToggle.getContext.mockReturnValue('saksham');
      const items = (service as any).menuItemLists;
      const clientManagement = items.find((m: any) => m.menu_name === 'Client Management');
      expect(clientManagement.children.some((c: any) => c.menu_name === 'Create Client')).toBe(false);
    });

    it('should exclude Create Client if module disabled', () => {
      featureToggle.getConfig.mockReturnValue({
        enabledModules: [],
        BASEURI: '',
        BASEKMLPREFIX: '',
        BASEUSERIMG: '',
        config: '',
        assetsFolder: '',
        BASEKMLSUFFIX: '',
        BASEUSERIMGPREFIX: '',
        BASEUSERIMGSUFFIX: '',
        BASEUSERIMGEXTENSION: '',
        BASEKMLEXTENSION: '',
        ASSET_PATH: '',
        storage: '',
        favicon: '',
        title: '',
        logo: '',
      } as unknown as ProjectConfig); // Use 'unknown as ProjectConfig' to satisfy all properties
      const items = (service as any).menuItemLists;
      const clientManagement = items.find((m: any) => m.menu_name === 'Client Management');
      expect(clientManagement.children.some((c: any) => c.menu_name === 'Create Client')).toBe(false);
    });
  });
});