// src/app/shared/components/agency-management/agency-management.component.ts
import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CoreService } from 'src/app/utilities/core.service';
import { UserDetailService } from 'src/app/auth/user-detail.service';
import { FilterService } from 'src/app/utilities/filter.service';
import * as moment from 'moment';
import * as FileSaver from 'file-saver';
import { FeatureToggleService } from "src/app/shared/services/feature-toggle.service";
import { environment, ProjectContext } from "../../../environments/environment";
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { InsightsService } from 'src/app/utilities/insights.service';

@Component({
  selector: 'app-agency-management',
  templateUrl: './agency-management.component.html',
  styleUrls: ['./agency-management.component.css']
})
export class AgencyManagementComponent implements OnInit {
  agencyList: any[] = [];
  query: any;
  downloading = false;
  selectedAgency: any = {};
  clients: any;
  userDetails: any;
  loader = 0;
  projectContext: ProjectContext;
  assetsFolder: string;

  constructor(
    private core: CoreService,
    private modalService: NgbModal,
    private filter: FilterService,
    private userService: UserDetailService,
    private featureToggle: FeatureToggleService,
    private sanitizer: DomSanitizer,
    private insightsService: InsightsService
  ) {
    this.projectContext = this.featureToggle.getContext() as ProjectContext;
    this.assetsFolder = environment.projectConfigs[this.projectContext].assetsFolder;
  }

  ngOnInit(): void {
    this.userDetails = this.userService.getUserDetail();
    this.getAgencies();
    if (this.filter.isDataFetched) {
      this.clients = this.filter.clients;
    } else {
      this.filter.fetchedLookupData.subscribe(() => {
        this.clients = this.filter.clients;
      });
    }
  }

  getAgencies() {
    this.loader++;
    const request = { purpose: 'get_all_created', client_id: this.userDetails?.unit_id || (this.projectContext === 'saksham' ? '2000' : undefined) };

    this.core.post('agency', request).then((response: any) => {
      if (response.status == 1) {
        this.agencyList = response.all_agencies || [];
        this.agencyList.forEach((d: any, i: any) => {
          d.sno = i + 1;
          d.clientName = d.client?.UNIT_NAME;
          d.statusName = this.getStatus(d.status);
        });
      } else {
        this.agencyList = [];
      }
    }).catch((error) => {
      this.insightsService.logException(error);
      this.agencyList = [];
    }).finally(() => {
      this.loader--;
    });
  }

  open(content: any, user?: any) {
    this.selectedAgency = {};
    this.loader++;
    const request = { purpose: 'get_details', agency_id: user.agency_id };
    this.core.post('agency', request).then((response: any) => {
      if (response.status == 1) {
        this.selectedAgency.agency_id = response.agency.agency_id;
        this.selectedAgency.name = response.agency.agency_name;
        this.selectedAgency.phone = response.agency.phone;
        this.selectedAgency.address = response.agency.address;
        this.selectedAgency.pocname = response.agency.poc_name;
        this.selectedAgency.pocemail = response.agency.poc_email;
        this.selectedAgency.pocphone = response.agency.poc_phone;
        this.selectedAgency.client = response.agency.client?.UNIT_ID;
      }
    }).catch((error) => this.insightsService.logException(error)).finally(() => {
      this.loader--;
    });
    this.modalService.open(content, { ariaLabelledBy: 'modal-basic-title' }).result.then(() => {});
  }

  exportTable(data: any, fileName: any) {
    const fields = [
      { field: 'sno', header: 'S.No.' },
      { field: 'agency_name', header: 'Agency Name' },
      ...(this.projectContext === 'munichre' ? [{ field: 'clientName', header: 'Client' }] : []),
      { field: 'address', header: 'Address' },
      { field: 'phone', header: 'Contact No.' },
      { field: 'poc_name', header: 'POC Name' },
      { field: 'poc_email', header: 'POC Email' },
      { field: 'statusName', header: 'Status' },
    ];
    this.core.exportExcel(data, fields, fileName);
  }

  update() {
    const request = this.selectedAgency;
    request.purpose = 'update';

    this.loader++;
    this.core.post('agency', request).then((response: any) => {
      if (response.status == 1) {
        this.core.toast('success', response.msg);
        this.getAgencies();
        this.modalService.dismissAll();
      }
    }).catch((error) => this.insightsService.logException(error)).finally(() => {
      this.loader--;
    });
  }

  getStatus(status: any) {
    return status == 2 ? 'Pending Approval' : status == 1 ? 'Active' : 'In-active';
  }

  changeStatus(agency: any, status: any) {
    const request = {
      purpose: 'change_agency_status',
      agency_id: agency.agency_id,
      status: status
    };

    this.loader++;
    this.core.post('agency', request).then((response: any) => {
      if (response.status == 1) {
        this.core.toast('success', response.msg);
        this.getAgencies();
      } else {
        this.core.toast('error', response.msg);
      }
    }).catch((error) => this.insightsService.logException(error)).finally(() => {
      this.loader--;
    });
  }

  async viewDocument(agency: any, filename: string = 'test') {
    const config = this.featureToggle.getConfig();
    if (!agency?.document) {
      this.core.toast('warn', 'No document available for this agency');
      return;
    }
    const fileExtension = agency.document.split('.').pop() || 'pdf';
    const fullFileName = `${filename}.${fileExtension}`;
    try {
      let fileUrl = (config.BASEAGENCY || '') + agency.document;
      if (this.projectContext === 'munichre') {
        const blob = await this.core.fetchAzureBlob(fileUrl);
        const objectUrl = URL.createObjectURL(blob);
        const safeUrl: SafeUrl = this.sanitizer.bypassSecurityTrustUrl(objectUrl);
        this.downloadFile(safeUrl as string, fullFileName);
        URL.revokeObjectURL(objectUrl);
      } else {
        fileUrl += config.BASEAGENCYSUFFIX || '';
        this.openLinkInNewTab(fileUrl);
      }
    } catch (err: any) {
      this.insightsService.logException(err);
      this.core.toast('error', 'Failed to load agency document');
    }
  }

  private downloadFile(url: string, filename: string) {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  private openLinkInNewTab(url: string) {
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  getEventValue($event: any): string {
    return $event.target.value;
  }
}