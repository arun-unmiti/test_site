import { Injectable } from "@angular/core";
import { FeatureToggleService } from "../shared/services/feature-toggle.service";
import { ProjectContext, environment } from "../../environments/environment";

@Injectable()
export class MenuItemService {
  private assetsFolder: string;

  constructor(private featureToggle: FeatureToggleService) {
    const projectContext = this.featureToggle.getContext() as ProjectContext;
    this.assetsFolder = environment.projectConfigs[projectContext].assetsFolder;
  }

  /**
   * Method to get list of menus
   * @param role_id
   * @param client_id
   * @param screens
   * @returns
   */
  public getSideMenuItems(role_id: any, client_id: any, screens: any) {
    return this.authorizeMenu(this.menuItemLists, role_id, client_id, screens);
  }

  /**
   * Method to authorize menus
   * @param menus
   * @param role_id
   * @param client_id
   * @param screens
   * @returns
   */
  private authorizeMenu(menus: any, role_id: any, client_id: any, screens: any) {
    const menuItems: any[] = [];
    const enabledModules = this.featureToggle.getConfig().enabledModules;
    const projectContext = this.featureToggle.getContext() as ProjectContext;
    for (let i = 0; i < menus.length; i++) {
      const menu = menus[i];
      const moduleMapping: { [key: string]: string } = {
        chmdashboard: "chm", clsdashboard: "cls", ccedashboard: "cce", chm: "chm", revisit_chm: "chm", cls: "cls", cce: "cce", multipicking: "multipicking", other_activity: "other_activity", external_chm_view: "chm", external_cls_view: "cls", external_cce_view: "cce", workshop: "cms-management", infra: "cms-management", gro: "cms-management", manpower: "cms-management", farmer: "farmer_verification", beneficiaryFarmer: "beneficiary_verification", proposal: "proposal_form", user_management: "user-management", client_management: "client_management", agency_management: "agency_management", notification: "notification", kml_view: "kml_view",
      };
      const menuModule = moduleMapping[menu.agency_screen_id] || null;
      const isModuleEnabled = !menuModule || enabledModules.includes(menuModule);
      if (menu.link === "/client/add-client" && (projectContext !== 'munichre' || !enabledModules.includes("client_management"))) {
        continue;
      }
      if (menu.children?.length) {
        menu.children = this.authorizeMenu(menu.children, role_id, client_id, screens);
      }
      if ((menu?.auth_role?.length && !menu.auth_role.includes(role_id)) || (menu?.auth_client?.length && !menu.auth_client.includes(client_id)) ||
        (screens?.length && menu?.agency_screen_id && !screens.includes(menu.agency_screen_id)) || !isModuleEnabled) {
        continue;
      }
      if (menu?.link || menu?.children?.length) {
        menuItems.push(menu);
      }
    }
    return menuItems;
  }

  /**
   * Getter method for menu list items
   */
  private get menuItemLists() {
    const isMunichre = this.featureToggle.getContext() === 'munichre';
    const enabledModules = this.featureToggle.getConfig().enabledModules;
    const iconPath = `${this.assetsFolder}/images/`;

    return [
      {
        menu_name: "Dashboard",
        link: "/home",
        children: null,
        icon: `${iconPath}dashboard.png`,
        auth_role: [],
        agency_screen_id: "",
      },
      {
        menu_name: "Overview",
        link: "/manpowerattendance",
        children: null,
        icon: `${iconPath}overview.png`,
        auth_role: [],
        agency_screen_id: "",
      },
      {
        menu_name: "Crop Health Monitoring",
        link: "/chmdashboard",
        children: null,
        icon: `${iconPath}CrophealthSelected.svg`,
        auth_role: [],
        agency_screen_id: "chmdashboard",
      },
      {
        menu_name: "Crop Loss Survey",
        link: "/clsdashboard",
        children: null,
        icon: `${iconPath}CroplossSelected.svg`,
        auth_role: [],
        agency_screen_id: "clsdashboard",
      },
      {
        menu_name: "Crop Cutting Experiments",
        link: "/ccedashboard",
        children: null,
        icon: `${iconPath}CropcuttingSelected.svg`,
        auth_role: [],
        agency_screen_id: "ccedashboard",
      },
      {
        menu_name: "Data",
        link: "",
        children: [
          {
            menu_name: "CHM",
            link: "",
            children: [
              {
                menu_name: "Draft",
                link: "/chm/draft",
                children: null,
                icon: `${iconPath}draft.png`,
                auth_role: [],
                agency_screen_id: "chm",
              },
              {
                menu_name: "Pending",
                link: "/chm/pending",
                children: null,
                icon: `${iconPath}pending.png`,
                auth_role: [],
                agency_screen_id: "chm",
              },
              {
                menu_name: "Approved",
                link: "/chm/approved",
                children: null,
                icon: `${iconPath}approval-data.png`,
                auth_role: [],
                agency_screen_id: "chm",
              },
              {
                menu_name: "Rejected",
                link: "/chm/rejected",
                children: null,
                icon: `${iconPath}reject-data.png`,
                auth_role: [],
                agency_screen_id: "chm",
              },
              {
                menu_name: "All Data",
                link: "/chm/alldata",
                children: null,
                icon: `${iconPath}all-data.png`,
                auth_role: [],
                agency_screen_id: "chm",
              },
            ],
            icon: `${iconPath}CrophealthSelected.svg`,
            isCollase: true,
            auth_role: [],
            agency_screen_id: "chm",
          },
          {
            menu_name: "Revisit CHM",
            link: "",
            children: [
              {
                menu_name: "Pending",
                link: "/revisit-chm/pending",
                children: null,
                icon: `${iconPath}pending.png`,
                auth_role: [],
                agency_screen_id: "revisit_chm",
              },
              {
                menu_name: "Approved",
                link: "/revisit-chm/approved",
                children: null,
                icon: `${iconPath}approval-data.png`,
                auth_role: [],
                agency_screen_id: "revisit_chm",
              },
              {
                menu_name: "Rejected",
                link: "/revisit-chm/rejected",
                children: null,
                icon: `${iconPath}reject-data.png`,
                auth_role: [],
                agency_screen_id: "revisit_chm",
              },
              {
                menu_name: "All Data",
                link: "/revisit-chm/alldata",
                children: null,
                icon: `${iconPath}all-data.png`,
                auth_role: [],
                agency_screen_id: "revisit_chm",
              },
            ],
            icon: `${iconPath}CrophealthSelected.svg`,
            isCollase: true,
            auth_role: [],
            agency_screen_id: "revisit_chm",
          },
          {
            menu_name: "CLS",
            link: "",
            children: [
              {
                menu_name: "Draft",
                link: "/cls/draft",
                children: null,
                icon: `${iconPath}draft.png`,
                auth_role: [],
                agency_screen_id: "cls",
              },
              {
                menu_name: "Pending",
                link: "/cls/pending",
                children: null,
                icon: `${iconPath}pending.png`,
                auth_role: [],
                agency_screen_id: "cls",
              },
              {
                menu_name: "Approved",
                link: "/cls/approved",
                children: null,
                icon: `${iconPath}approval-data.png`,
                auth_role: [],
                agency_screen_id: "cls",
              },
              {
                menu_name: "Rejected",
                link: "/cls/rejected",
                children: null,
                icon: `${iconPath}reject-data.png`,
                auth_role: [],
                agency_screen_id: "cls",
              },
              {
                menu_name: "All Data",
                link: "/cls/alldata",
                children: null,
                icon: `${iconPath}all-data.png`,
                auth_role: [],
                agency_screen_id: "cls",
              },
            ],
            icon: `${iconPath}CroplossSelected.svg`,
            isCollase: true,
            auth_role: [],
            agency_screen_id: "cls",
          },
          {
            menu_name: "CCE",
            link: "",
            children: [
              {
                menu_name: "Draft",
                link: "/cce/draft",
                children: null,
                icon: `${iconPath}draft.png`,
                auth_role: [],
                agency_screen_id: "cce",
              },
              {
                menu_name: "Pending",
                link: "/cce/pending",
                children: null,
                icon: `${iconPath}pending.png`,
                auth_role: [],
                agency_screen_id: "cce",
              },
              {
                menu_name: "Approved",
                link: "/cce/approved",
                children: null,
                icon: `${iconPath}approval-data.png`,
                auth_role: [],
                agency_screen_id: "cce",
              },
              {
                menu_name: "Rejected",
                link: "/cce/rejected",
                children: null,
                icon: `${iconPath}reject-data.png`,
                auth_role: [],
                agency_screen_id: "cce",
              },
              {
                menu_name: "All Data",
                link: "/cce/alldata",
                children: null,
                icon: `${iconPath}all-data.png`,
                auth_role: [],
                agency_screen_id: "cce",
              },
            ],
            icon: `${iconPath}CropcuttingSelected.svg`,
            isCollase: true,
            auth_role: [],
            agency_screen_id: "cce",
          },
          {
            menu_name: "Two Step / Multipicking",
            link: "",
            children: [
              {
                menu_name: "Pending",
                link: "/multipicking/pending",
                children: null,
                icon: `${iconPath}pending.png`,
                auth_role: [],
                agency_screen_id: "multipicking",
              },
              {
                menu_name: "Approved",
                link: "/multipicking/approved",
                children: null,
                icon: `${iconPath}approval-data.png`,
                auth_role: [],
                agency_screen_id: "multipicking",
              },
              {
                menu_name: "Rejected",
                link: "/multipicking/rejected",
                children: null,
                icon: `${iconPath}reject-data.png`,
                auth_role: [],
                agency_screen_id: "multipicking",
              },
              {
                menu_name: "All Data",
                link: "/multipicking/alldata",
                children: null,
                icon: `${iconPath}all-data.png`,
                auth_role: [],
                agency_screen_id: "multipicking",
              },
            ],
            icon: `${iconPath}DataSelected.svg`,
            isCollase: true,
            auth_role: [],
            agency_screen_id: "multipicking",
          },
          {
            menu_name: "Other Activity",
            link: "",
            children: [
              {
                menu_name: "Pending",
                link: "/other-activity/pending",
                children: null,
                icon: `${iconPath}pending.png`,
                auth_role: [],
                agency_screen_id: "other_activity",
              },
              {
                menu_name: "Approved",
                link: "/other-activity/approved",
                children: null,
                icon: `${iconPath}approval-data.png`,
                auth_role: [],
                agency_screen_id: "other_activity",
              },
              {
                menu_name: "Rejected",
                link: "/other-activity/rejected",
                children: null,
                icon: `${iconPath}reject-data.png`,
                auth_role: [],
                agency_screen_id: "other_activity",
              },
              {
                menu_name: "All Data",
                link: "/other-activity/alldata",
                children: null,
                icon: `${iconPath}all-data.png`,
                auth_role: [],
                agency_screen_id: "other_activity",
              },
            ],
            icon: `${iconPath}DataSelected.svg`,
            isCollase: true,
            auth_role: [],
            agency_screen_id: "other_activity",
          },
        ],
        icon: `${iconPath}DataSelected.svg`,
        isCollase: true,
        auth_role: ["1", "2", "3", "4", "5", "6", "7", "8"],
        agency_screen_id: "",
      },
      {
        menu_name: "External Data Upload",
        link: "",
        children: [
          {
            menu_name: "CHM",
            link: "",
            children: [
              {
                menu_name: "CHM Bulk Bucket Change",
                link: "/chm/bulk-update",
                auth_role: ["1", "2", "3", "4"],
                icon: `${iconPath}bulk-data.png`,
                agency_screen_id: "chm",
              },
              {
                menu_name: "Upload CHM Field",
                link: "/chm-field-data-upload",
                auth_role: ["1", "2", "3", "4"],
                icon: `${iconPath}upload-data.png`,
                agency_screen_id: "chm",
              },
              {
                menu_name: "View CHM Field",
                link: "/view-chm-field-data",
                auth_role: isMunichre ? ["1", "2", "3", "4"] : ["1", "2", "3", "4", "5", "6", "7"],
                icon: `${iconPath}view-files.png`,
                agency_screen_id: "external_chm_view",
              },
            ],
            isCollase: true,
            icon: `${iconPath}CrophealthSelected.svg`,
            agency_screen_id: "chm",
          },
          {
            menu_name: "CLS",
            link: "",
            children: [
              {
                menu_name: "CLS Bulk Bucket Change",
                link: "/cls/bulk-update",
                auth_role: ["1", "2", "3", "4"],
                icon: `${iconPath}bulk-data.png`,
                agency_screen_id: "cls",
              },
              {
                menu_name: "Upload CLS Intimation",
                link: "/cls-intimation-upload",
                auth_role: ["1", "2", "3", "4"],
                icon: `${iconPath}upload-data.png`,
                agency_screen_id: "cls",
              },
              {
                menu_name: "View CLS Intimation",
                link: "/view-cls-intimation",
                auth_role: isMunichre ? ["1", "2", "3", "4"] : ["1", "2", "3", "4", "5", "6", "7"],
                icon: `${iconPath}view-files.png`,
                agency_screen_id: "external_cls_view",
              },
            ],
            isCollase: true,
            icon: `${iconPath}CroplossSelected.svg`,
            agency_screen_id: "cls",
          },
          {
            menu_name: "CCE",
            link: "",
            children: [
              {
                menu_name: "CCE Bulk Bucket Change",
                link: "/cce/bulk-update",
                auth_role: ["1", "2", "3", "4"],
                icon: `${iconPath}bulk-data.png`,
                agency_screen_id: "cce",
              },
              {
                menu_name: "Upload CCE",
                link: "/cce-implementation-upload",
                auth_role: ["1", "2", "3", "4"],
                icon: `${iconPath}upload-data.png`,
                agency_screen_id: "cce",
              },
              {
                menu_name: "View CCE",
                link: "/view-cce-implementation",
                auth_role: isMunichre ? ["1", "2", "3", "4"] : ["1", "2", "3", "4", "5", "6", "7"],
                icon: `${iconPath}view-files.png`,
                agency_screen_id: "external_cce_view",
              },
            ],
            isCollase: true,
            icon: `${iconPath}CropcuttingSelected.svg`,
            agency_screen_id: "cce",
          },
        ],
        icon: `${iconPath}cloud (2).png`,
        isCollase: true,
        auth_role: isMunichre ? ["1", "2", "3", "4"] : ["1", "2", "3", "4", "5", "6", "7"],
        agency_screen_id: "",
      },
      {
        menu_name: "CMS Compliance",
        link: "",
        children: [
          {
            menu_name: "Workshop Management",
            link: "",
            children: [
              {
                menu_name: "Create Workshop Data",
                link: "/workshop/create",
                children: null,
                icon: `${iconPath}add.png`,
                auth_role: [],
                agency_screen_id: "workshop",
              },
              {
                menu_name: "Pending",
                link: "/workshop/pending",
                children: null,
                icon: `${iconPath}pending.png`,
                auth_role: [],
                agency_screen_id: "workshop",
              },
              {
                menu_name: "Approved",
                link: "/workshop/approved",
                children: null,
                icon: `${iconPath}approval-data.png`,
                auth_role: [],
                agency_screen_id: "workshop",
              },
              {
                menu_name: "Rejected",
                link: "/workshop/rejected",
                children: null,
                icon: `${iconPath}reject-data.png`,
                auth_role: [],
                agency_screen_id: "workshop",
              },
              {
                menu_name: "All Workshop data",
                link: "/workshop/alldata",
                children: null,
                icon: `${iconPath}all-data.png`,
                auth_role: [],
                agency_screen_id: "workshop",
              },
            ],
            icon: `${iconPath}workshop.png`,
            isCollase: true,
            auth_role: [],
            agency_screen_id: "workshop",
          },
          {
            menu_name: "Infra Management",
            link: "",
            children: [
              {
                menu_name: "Create Infrastructure Data",
                link: "/infra/create",
                children: null,
                icon: `${iconPath}add.png`,
                auth_role: [],
                agency_screen_id: "infra",
              },
              {
                menu_name: "Pending",
                link: "/infra/pending",
                children: null,
                icon: `${iconPath}pending.png`,
                auth_role: [],
                agency_screen_id: "infra",
              },
              {
                menu_name: "Approved",
                link: "/infra/approved",
                children: null,
                icon: `${iconPath}approval-data.png`,
                auth_role: [],
                agency_screen_id: "infra",
              },
              {
                menu_name: "Rejected",
                link: "/infra/rejected",
                children: null,
                icon: `${iconPath}reject-data.png`,
                auth_role: [],
                agency_screen_id: "infra",
              },
              {
                menu_name: "All Infrastructure data",
                link: "/infra/alldata",
                children: null,
                icon: `${iconPath}all-data.png`,
                auth_role: [],
                agency_screen_id: "infra",
              },
            ],
            icon: `${iconPath}infrastructure-management.png`,
            isCollase: true,
            auth_role: [],
            agency_screen_id: "infra",
          },
          {
            menu_name: "GRO Management",
            link: "",
            children: [
              {
                menu_name: "Create GRO Data",
                link: "/gro/create",
                children: null,
                icon: `${iconPath}add.png`,
                auth_role: [],
                agency_screen_id: "gro",
              },
              {
                menu_name: "Pending",
                link: "/gro/pending",
                children: null,
                icon: `${iconPath}pending.png`,
                auth_role: [],
                agency_screen_id: "gro",
              },
              {
                menu_name: "Approved",
                link: "/gro/approved",
                children: null,
                icon: `${iconPath}approval-data.png`,
                auth_role: [],
                agency_screen_id: "gro",
              },
              {
                menu_name: "Rejected",
                link: "/gro/rejected",
                children: null,
                icon: `${iconPath}reject-data.png`,
                auth_role: [],
                agency_screen_id: "gro",
              },
              {
                menu_name: "All GRO data",
                link: "/gro/alldata",
                children: null,
                icon: `${iconPath}all-data.png`,
                auth_role: [],
                agency_screen_id: "gro",
              },
            ],
            icon: `${iconPath}DataSelected.svg`,
            isCollase: true,
            auth_role: [],
            agency_screen_id: "gro",
          },
          {
            menu_name: "Manpower Management",
            link: "",
            children: [
              {
                menu_name: "Create Manpower Data",
                link: "/manpower/create",
                children: null,
                icon: `${iconPath}add.png`,
                auth_role: [],
                agency_screen_id: "manpower",
              },
              {
                menu_name: "Pending",
                link: "/manpower/pending",
                children: null,
                icon: `${iconPath}pending.png`,
                auth_role: [],
                agency_screen_id: "manpower",
              },
              {
                menu_name: "Approved",
                link: "/manpower/approved",
                children: null,
                icon: `${iconPath}approval-data.png`,
                auth_role: [],
                agency_screen_id: "manpower",
              },
              {
                menu_name: "Rejected",
                link: "/manpower/rejected",
                children: null,
                icon: `${iconPath}reject-data.png`,
                auth_role: [],
                agency_screen_id: "manpower",
              },
              {
                menu_name: "All Manpower data",
                link: "/manpower/alldata",
                children: null,
                icon: `${iconPath}all-data.png`,
                auth_role: [],
                agency_screen_id: "manpower",
              },
            ],
            icon: `${iconPath}manpower-management.png`,
            isCollase: true,
            auth_role: [],
            agency_screen_id: "manpower",
          },
        ],
        icon: `${iconPath}compliance.png`,
        isCollase: true,
        auth_role: ["1", "2", "3", "4", "5", "6", "7", "8"],
        agency_screen_id: "",
      },
      {
        menu_name: "Farmer Verification",
        link: "",
        children: [
          {
            menu_name: "Insured verification",
            link: "",
            children: [
              {
                menu_name: "Upload Farmer Data",
                link: "/farmer/upload",
                children: null,
                icon: `${iconPath}upload-data.png`,
                auth_role: [],
                agency_screen_id: "farmer",
              },
              {
                menu_name: "View Farmer Data",
                link: "/farmer/view",
                children: null,
                icon: `${iconPath}view-files.png`,
                auth_role: [],
                agency_screen_id: "farmer",
              },
              {
                menu_name: "Pending",
                link: "/farmer/pending",
                children: null,
                icon: `${iconPath}pending.png`,
                auth_role: [],
                agency_screen_id: "farmer",
              },
              {
                menu_name: "Approved",
                link: "/farmer/approved",
                children: null,
                icon: `${iconPath}approval-data.png`,
                auth_role: [],
                agency_screen_id: "farmer",
              },
              {
                menu_name: "Rejected",
                link: "/farmer/rejected",
                children: null,
                icon: `${iconPath}reject-data.png`,
                auth_role: [],
                agency_screen_id: "farmer",
              },
              {
                menu_name: "All Farmer data",
                link: "/farmer/alldata",
                children: null,
                icon: `${iconPath}all-data.png`,
                auth_role: [],
                agency_screen_id: "farmer",
              },
            ],
            icon: `${iconPath}upload-data.png`,
            isCollase: true,
            auth_role: [],
            agency_screen_id: "farmer",
          },
          {
            menu_name: "Beneficiary verification",
            link: "",
            children: [
              {
                menu_name: "Pending",
                link: "/beneficiaryFarmer/pending",
                children: null,
                icon: `${iconPath}pending.png`,
                auth_role: [],
                agency_screen_id: "beneficiaryFarmer",
              },
              {
                menu_name: "Approved",
                link: "/beneficiaryFarmer/approved",
                children: null,
                icon: `${iconPath}approval-data.png`,
                auth_role: [],
                agency_screen_id: "beneficiaryFarmer",
              },
              {
                menu_name: "Rejected",
                link: "/beneficiaryFarmer/rejected",
                children: null,
                icon: `${iconPath}reject-data.png`,
                auth_role: [],
                agency_screen_id: "beneficiaryFarmer",
              },
              {
                menu_name: "All Beneficiary data",
                link: "/beneficiaryFarmer/alldata",
                children: null,
                icon: `${iconPath}all-data.png`,
                auth_role: [],
                agency_screen_id: "beneficiaryFarmer",
              },
            ],
            icon: `${iconPath}upload-data.png`,
            isCollase: true,
            auth_role: [],
            agency_screen_id: "beneficiaryFarmer",
          },
        ],
        icon: `${iconPath}verification.png`,
        isCollase: true,
        auth_role: ["1", "2", "3", "4", "5", "6", "7", "8"],
        agency_screen_id: "",
      },
      {
        menu_name: "Proposal Form",
        link: "",
        children: [
          {
            menu_name: "Upload Product Details",
            link: "/proposal/upload",
            children: null,
            icon: `${iconPath}upload-data.png`,
            auth_role: [],
            agency_screen_id: "proposal",
          },
          {
            menu_name: "View Product Details",
            link: "/proposal/view",
            children: null,
            icon: `${iconPath}view-files.png`,
            auth_role: [],
            agency_screen_id: "proposal",
          },
          {
            menu_name: "Pending",
            link: "/proposal/pending",
            children: null,
            icon: `${iconPath}pending.png`,
            auth_role: [],
            agency_screen_id: "proposal",
          },
          {
            menu_name: "Approved",
            link: "/proposal/approved",
            children: null,
            icon: `${iconPath}approval-data.png`,
            auth_role: [],
            agency_screen_id: "proposal",
          },
          {
            menu_name: "Rejected",
            link: "/proposal/rejected",
            children: null,
            icon: `${iconPath}reject-data.png`,
            auth_role: [],
            agency_screen_id: "proposal",
          },
          {
            menu_name: "All Proposal Form data",
            link: "/proposal/alldata",
            children: null,
            icon: `${iconPath}all-data.png`,
            auth_role: [],
            agency_screen_id: "proposal",
          },
        ],
        icon: `${iconPath}verification.png`,
        isCollase: true,
        auth_role: ["1", "2", "3", "4", "5", "6", "7", "8"],
        agency_screen_id: "",
      },
      {
        menu_name: "Transfer User Data",
        link: "/transfer-user-data",
        auth_role: ["1", "2"],
        icon: `${iconPath}transfer-user-data.png`,
        agency_screen_id: "",
      },
      {
        menu_name: "User Management",
        link: "",
        children: [
          {
            menu_name: "Create User",
            link: "/users/add-user",
            children: null,
            icon: "fa fa-user-plus",
            auth_role: [],
            agency_screen_id: "user_management",
          },
          {
            menu_name: "Manage User",
            link: "/users/user-mangement",
            children: null,
            icon: "fa fa-users",
            auth_role: [],
            agency_screen_id: "user_management",
          },
          {
            menu_name: "Map Users",
            link: "/users/map",
            children: null,
            icon: "fa fa-puzzle-piece",
            auth_role: [],
            agency_screen_id: "user_management",
          },
        ],
        icon: `${iconPath}ManpowermanagementSelected.svg`,
        isCollase: true,
        auth_role: ["1", "2", "3", "4", "5", "6", "7", "8"],
        agency_screen_id: "user_management",
      },
      {
        menu_name: "Client Management",
        link: "",
        children: [
          ...(isMunichre && enabledModules.includes("client_management") ? [{
            menu_name: "Create Client",
            link: "/client/add-client",
            children: null,
            icon: "fa fa-user-plus",
            auth_role: [],
            agency_screen_id: "",
          }] : []),
          {
            menu_name: "Manage Clients",
            link: "/client/client-mangement",
            children: null,
            icon: "fa fa-users",
            auth_role: [],
            agency_screen_id: "",
          },
          {
            menu_name: "Map Clients",
            link: "/client/map-client",
            children: null,
            icon: "fa fa-users",
            auth_role: [],
            agency_screen_id: "",
          },
        ],
        icon: `${iconPath}ManpowermanagementSelected.svg`,
        isCollase: true,
        auth_role: ["1", "2"],
        agency_screen_id: "",
      },
      {
        menu_name: "Agency Management",
        link: "",
        children: [
          {
            menu_name: "Create Agency",
            link: "/agency/add-agency",
            children: null,
            icon: "fa fa-user-plus",
            auth_role: [],
            agency_screen_id: "",
          },
          {
            menu_name: "Manage Agencies",
            link: "/agency/agency-mangement",
            children: null,
            icon: "fa fa-users",
            auth_role: [],
            agency_screen_id: "",
          },
          {
            menu_name: "Map Agencies",
            link: "/agency/map-agency",
            children: null,
            icon: "fa fa-users",
            auth_role: [],
            agency_screen_id: "",
          },
        ],
        icon: `${iconPath}ManpowermanagementSelected.svg`,
        isCollase: true,
        auth_role: ["1", "2", "3", "4"],
        agency_screen_id: "",
      },
      {
        menu_name: "KML View",
        link: "/kml-view",
        children: null,
        icon: `${iconPath}CroplossSelected.svg`,
        auth_role: [],
        agency_screen_id: "kml_view",
      },
      {
        menu_name: "Notification",
        link: "/notifications",
        children: null,
        icon: `${iconPath}CroplossSelected.svg`,
        auth_role: ["1", "2", "3", "4"],
        agency_screen_id: "",
      },
    ];
  }
}