import { Component, OnInit, ViewChild } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Table } from 'primeng/table';
import { UserDetailService } from 'src/app/auth/user-detail.service';
import { CoreService } from 'src/app/utilities/core.service';
import { FilterService } from 'src/app/utilities/filter.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FeatureToggleService } from 'src/app/shared/services/feature-toggle.service';
import { environment, ProjectContext } from "../../../environments/environment";
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { InsightsService } from 'src/app/utilities/insights.service';

@Component({
  selector: 'app-client-management',
  templateUrl: './client-management.component.html',
  styleUrls: ['./client-management.component.css']
})
export class ClientManagementComponent implements OnInit {
  @ViewChild('dt') dt: Table | undefined;
  clientList: any[] = [];
  query: any;
  downloading = false;
  selectedClient: any = {};
  clientForm: FormGroup;
  loader = 0;
  errorImg: any = '';
  newProfileImage: any;
  csrfTokenName: any;
  csrfToken: any;
  projectContext: ProjectContext;
  assetsFolder: string; 

  constructor(
    private modalService: NgbModal,
    private core: CoreService,
    private filter: FilterService,
    private featureToggle: FeatureToggleService,
    private userService: UserDetailService,
    private fb: FormBuilder,
    private sanitizer: DomSanitizer,
    private insightsService: InsightsService
  ) {
    this.projectContext = this.featureToggle.getContext() as ProjectContext;
    this.assetsFolder = environment.projectConfigs[this.projectContext].assetsFolder;
    this.clientForm = this.fb.group({
      client_id: [''],
      name: ['', Validators.required],
      phone: ['', Validators.required],
      address: ['', Validators.required],
      pocname: ['', Validators.required],
      pocemail: ['', [Validators.required, Validators.email]],
      pocphone: [''],
      csrf_token: [''] // Add CSRF token to form
    });
  }

  ngOnInit(): void {
    this.getClients();
    this.csrfTokenName = this.userService.getcsrfTokenName();
    this.csrfToken = this.userService.getcsrfToken();
    this.clientForm.patchValue({ csrf_token: this.csrfToken });
  }

  async getClients(): Promise<void> {
    this.loader++;
    const request = { purpose: 'get_all_created' };
    const config = this.featureToggle.getConfig();
    const isMunichRe = this.projectContext === 'munichre';
    try {
      const response: any = await this.core.post('client', request);
      if (response?.status !== 1) {
        return;
      }
      const clients = response.all_clients.map((client: any, index: number) => ({ ...client, sno: index + 1, statusResult: this.getStatus(client.UNIT_STATUS), safeLogoUrl: null }));
      if (!isMunichRe) {
        this.clientList = clients;
        return;
      }
      const updatedClients = await Promise.all(
        clients.map(async (client:any) => {
          if (!client.company_logo) {
            return client;
          }
          try {
            const imageUrl = `${config.BASECLIENTIMG}${client.company_logo}`;
            const blob = await this.core.fetchAzureBlob(imageUrl);
            const objectUrl = URL.createObjectURL(blob);
            client.safeLogoUrl = this.sanitizer.bypassSecurityTrustUrl(objectUrl);
          } catch {
            client.safeLogoUrl = null;
          }
          return client;
        })
      );
      this.clientList = updatedClients;
    } catch (err: any) {
      this.insightsService.logException(err);
      this.core.toast('error', 'Failed to load client list');
    } finally {
      this.loader--;
    }
  }

  getImgUrl(url: any) {
    const config = this.featureToggle.getConfig();
    return (config.BASECLIENTIMG || '') + url + (config.BASECLIENTIMGSUFFIX || '');
  }

  getErrImgUrl(event: any) {
    const config = this.featureToggle.getConfig();
    event.target.src = `${config.BASECLIENTIMG || ''}default.png${config.BASECLIENTIMGSUFFIX || ''}`;
  }

  exportTable(element: any, fileName: any) {
    this.downloading = true;
    setTimeout(() => {
      this.core.downloadTable(element, fileName);
      this.downloading = false;
    }, 100);
  }

  open(content: any, user?: any) {
    this.newProfileImage = null;
    this.loader++;
    const request = { purpose: 'get_details', client_id: user.UNIT_ID };
    this.core.post('client', request).then((response: any) => {
      if (response.status == 1) {
        this.selectedClient.client_id = response.client.UNIT_ID;
        this.selectedClient.name = response.client.UNIT_NAME;
        this.selectedClient.phone = response.client.phone;
        this.selectedClient.address = response.client.address;
        this.selectedClient.pocname = response.client.poc_name;
        this.selectedClient.pocemail = response.client.poc_email;
        this.selectedClient.pocphone = response.client.poc_phone;
        this.selectedClient.client = response.client.client?.UNIT_ID;
      }
    }).catch((error) => this.insightsService.logException(error)).finally(() => {
      this.loader--;
    });
    const modalRef = this.modalService.open(content, { ariaLabelledBy: 'modal-basic-title' });
    modalRef.result.then(
      (result) => {
        this.selectedClient = {};
      },
      (reason) => {
        this.selectedClient = {};
      }
    );
  }

  update() {
    const request = this.selectedClient;
    request.purpose = 'update';
    request.new_client_image = this.newProfileImage;
    this.loader++;
    this.core.post('client', request).then((response: any) => {
      if (response.status == 1) {
        this.core.toast('success', response.msg);
        this.getClients();
        this.modalService.dismissAll();
      }
    }).catch((error) => this.insightsService.logException(error)).finally(() => {
      this.loader--;
    });
  }

  changeStatus(client: any, status: any) {
    const request = {
      purpose: 'change_client_status',
      UNIT_ID: client.UNIT_ID,
      UNIT_STATUS: status
    };

    this.loader++;
    this.core.post('client', request).then((response: any) => {
      if (response.status == 1) {
        this.core.toast('success', response.msg);
        this.getClients();
      } else {
        this.core.toast('error', response.msg);
      }
    }).catch((error) => this.insightsService.logException(error)).finally(() => {
      this.loader--;
    });
  }

  getStatus(status: any) {
    return status == 2 ? 'Pending Approval' : status == 1 ? 'Active' : 'In-active';
  }

  applyFilterGlobal($event: any, stringVal: any) {
    this.dt?.filterGlobal(($event.target as HTMLInputElement).value, 'contains');
  }

  getEventValue($event: any): string {
    return $event.target.value;
  }

  onClientProfileChange(event: any, inputField: any) {
    this.newProfileImage = null;
    if (event?.target?.files?.length) {
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.onload = (env: any) => {
        this.newProfileImage = env.currentTarget.result;
      };
      reader.readAsDataURL(file);
    }
  }
}