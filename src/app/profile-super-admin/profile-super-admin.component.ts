import { Component, OnInit, ViewChild } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FormGroup, Validators, FormControl } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CoreService } from '../utilities/core.service';
import { UserDetailService } from '../auth/user-detail.service';
import { FilterService } from '../utilities/filter.service';
import * as moment from "moment";
import { FeatureToggleService } from "../shared/services/feature-toggle.service";
import { environment, ProjectContext } from "../../environments/environment";

@Component({
  selector: 'app-profile-super-admin',
  templateUrl: './profile-super-admin.component.html',
  styleUrls: ['./profile-super-admin.component.css']
})
export class ProfileSuperAdminComponent implements OnInit {

  @ViewChild('reset') resetModal:any ;
  userImg: string = '';
  imgFile: string = '';
  userDetails: any;
  clientImg = '';
  labelDetails: any;
  altText = '';
  active = 1;
  @ViewChild("confirmationContent") confirmationContent: any;
  @ViewChild("addEmailContent") addEmailContent: any;
  @ViewChild("emailStatusContent") emailStatusContent: any;

  uploadForm = new FormGroup({
    // name: new FormControl('', [Validators.required]),
    file: new FormControl('', [Validators.required]),
    imgSrc: new FormControl('', [Validators.required])
  });
  user: any;
  yearOptions: any[] = []
  seasonOptions: any[] = []
  clientOptions: any[] = []
  agencyOptions: any[] = []
  roleOptions: any[] = []
  selectedYear: any = "";
  selectedseason: any = "";
  selectedClient: any = "";
  selectedAgency: any = "";
  selectedRoles: any[] = [];
  agencyLoading: any = 0;
  lookupLoader: any = 0;
  loading: any = 0;
  resetting: any = 0;
  dashboardLogs: any[] = [];
  emailLogs: any[] = [];
  loadingDashboardLog = 0;
  loadingEmailLog = 0;
  initiating = 0;
  cceFreams: any = '';
  rowData: any[] = [
    {sno: 1, survey_type: 'CHM', date: '02-08-2023', status: 'success', comment: '1234'},
    {sno: 2, survey_type: 'CLS', date: '02-08-2023', status: 'success', comment: '1234'},
    {sno: 3, survey_type: 'CCE', date: '02-08-2023', status: 'success', comment: '1234'},
    {sno: 4, survey_type: 'CHM', date: '02-08-2023', status: 'success', comment: '1234'},
    {sno: 5, survey_type: 'CLS', date: '02-08-2023', status: 'failed', comment: 'Run Manually'},
    {sno: 6, survey_type: 'CCE', date: '02-08-2023', status: 'Processing', comment: '1234'},
    ]
    instType: any;
    selectedEmailClient: any[] = [];
  surveys: any[] = [
    {
        "id": 1,
        "name": "Crop Health Monitoring"
    },
    {
        "id": 2,
        "name": "Crop Loss Survey"
    },
    {
        "id": 3,
        "name": "Crop Cutting Experiment"
    }
]
surveysMap: any;

emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
clientEmailObj: any = {};
clientEmails: any[] = [];
selectedEmailData: any;
clientEmailLoading = 0;
clientEmaiupdating = 0;
clientMap: any;


@ViewChild("dashboardPagination") dashboardPagination: any;
currentDashboardpage = 1;
dashboardRecordsPerPage = 10
totalDashboardRecord = 1;

@ViewChild("emailPagination") emailPagination: any;
currentemailpage = 1;
emailRecordsPerPage = 10
totalEmailRecord = 1;

defaultDashboardData: any[] = [];
defaultEmailData: any[] = [];
csrfTokenName: any;
csrfToken: any;
projectContext: ProjectContext;
assetsFolder: string;

  constructor(private modalService: NgbModal, private core: CoreService, private userDetil: UserDetailService, private filter: FilterService, private featureToggle: FeatureToggleService) { 
    this.projectContext = this.featureToggle.getContext() as ProjectContext;
    this.assetsFolder = environment.projectConfigs[this.projectContext].assetsFolder;
    if (this.projectContext === 'saksham'){
      this.selectedClient = "2000";
    }
  }

  ngOnInit(): void {
    this.getLookupLocation();
    this.getDashboardLog();
    this.getEmailLog();
    this.getClientEmails();
    this.setEmailDefault()
    this.getDashboardDefaultData();
    this.getEmailDefaultData();
    this.surveysMap = {};
    this.surveys.forEach(d => {this.surveysMap[d.id] = d.name})
    this.userDetails = this.userDetil.getUserDetail();
    this.altText = this.userDetails?.user_role == 1 ? 'Admin Profile' : 'Client Logo'
    if (![1,2].includes(+this.userDetails.user_role)) {
      this.changeTab(4)
    }
    this.getFullUserDetail();
    const config = this.featureToggle.getConfig();
    this.userImg = config.BASEUSERIMG + this.userDetails.image;
    this.roleOptions = [
      {label: 'State Admin', value: 5},
      {label: 'Cluster Admin', value: 6},
      {label: 'District Admin', value: 7},
      {label: 'Surveyor', value: 8},
    ]
    this.csrfTokenName = this.userDetil.getcsrfTokenName();
    this.csrfToken = this.userDetil.getcsrfToken();
  }

  getLookupLocation () {
    this.lookupLoader++;
    if (this.filter.isLoactionFetched) {
      this.getLocationsData();
    } else {
      this.filter.fetchedLocationData.subscribe(() => {
        this.getLocationsData();
      });
    }
  }

  getDashboardLog () {
    if (this.loadingDashboardLog) return;
    this.loadingDashboardLog++;
    this.dashboardLogs = [];
    this.core.post('result', {purpose: 'get_job_details', type: 'Dashboard', pagination: {
      page_no: this.currentDashboardpage,
      records_per_page: this.dashboardRecordsPerPage,
    },}).then((res: any) => {
      if (res?.status == 1) {
        const dashboardLogs = res.jobs;
        if (dashboardLogs?.length) {
          const surveyName: any = {1: 'CHM', 2: 'CLS', 3: 'CCE'};
          for (let i = 0; i < dashboardLogs.length; i++) {
            const log = dashboardLogs[i];
            log.sno = i+1;
            log.date = moment(log.added_datetime).format('DD-MM-YYYY');
            log.status = log.job_status
            log.survey_type = surveyName[log.survey_id] || '';
          }
          this.dashboardLogs = dashboardLogs;
          this.totalDashboardRecord = res.total_jobs;
          setTimeout(() => {
            if(this.dashboardPagination) {
              this.dashboardPagination.updatePagination();
            }
          })
        }
      }
    }).catch(err => {
      console.error(err)
    }).finally(() => {
      this.loadingDashboardLog--;
    }) 
  }

  getEmailLog () {
    if (this.loadingEmailLog) return;
    this.loadingEmailLog++;
    this.emailLogs = [];
    this.core.post('result', {purpose: 'get_job_details', type: 'Email'}).then((res: any) => {
      if (res?.status == 1) {
        const emailLogs = res.jobs;
        if (emailLogs?.length) {
          const surveyName: any = {1: 'CHM', 2: 'CLS', 3: 'CCE'};
          for (let i = 0; i < emailLogs.length; i++) {
            const log = emailLogs[i];
            log.sno = i+1;
            log.date = moment(log.added_datetime).format('DD-MM-YYYY');
            log.status = log.job_status
            log.survey_type = surveyName[log.survey_id] || '';
          }
          this.emailLogs = emailLogs;
          this.totalEmailRecord = res.total_jobs;
          setTimeout(() => {
            if(this.emailPagination) {
              this.emailPagination.updatePagination();
            }
          })
        }
      }
    }).catch(err => {
      console.error(err)
    }).finally(() => {
      this.loadingEmailLog--;
    })
  }

  getLocationsData() {
    this.lookupLoader--;
    this.yearOptions = this.filter.years;
    this.seasonOptions = this.filter.seasons;
    this.clientOptions = this.filter.clients;
    this.clientMap = {};
    this.clientOptions.forEach((d:any) => {this.clientMap[d.UNIT_ID] = d.UNIT_NAME})
  }


  openConfirmation(survey_id: any, type: any) {
    this.cceFreams = '';
    this.instType = {type,survey_id};
    let endPoint = '';
    if (survey_id == 1) {
      this.instType.name = 'Crop Health Monitoring';
      endPoint = type === 'email' ? 'chmmail' : 'chmdashboard'
    } else if (survey_id == 2) {
      endPoint = type === 'email' ? 'clsmail' : 'clsdashboard'
      this.instType.name = 'Crop Loss Survey'
    } else if (survey_id == 3) {
      this.instType.name = 'Crop Cutting Experiment'
      endPoint = type === 'email' ? location.href.replace('profile', 'send-email') : 'ccedashboard'
    }
    this.instType.title = (this.instType.name || '') + (type == 'email' ? ' Email' : ' Dashboard');
    if (this.projectContext === 'saksham') {
      this.selectedEmailClient = [{UNIT_ID:'2000'}]
    }
    this.modalService.open(this.confirmationContent, {ariaLabelledBy: 'modal-basic-title'}).result.then((result) => {
      if (result == 'yes') {
        this.initiating++;
        if (type == 'email' && survey_id == 3) {
          const freams = [];
          for (let i = 0; i < this.selectedEmailClient.length; i++) {
            const client = this.selectedEmailClient[i];
            const path = endPoint+'/'+client.UNIT_ID;
            // this.core.getSelf(path).then();
            freams.push(`<iframe src="${path}"></iframe>`);
          }
          this.cceFreams = freams.join('\n');
        } else {
          if (type == 'email') {
            for (let i = 0; i < this.selectedEmailClient.length; i++) {
              const client = this.selectedEmailClient[i];
              const path = endPoint+'?client='+client.UNIT_ID;
              this.core.get(path).then();
            }
          } else {
            this.core.get(endPoint).then();
          }
        }
      this.initiating--;
      this.selectedEmailClient = [];
      this.core.toast("success", this.instType.title + ' initiated successfully');
      }
    });
  }

  getClientEmails() {
    this.clientEmailLoading++;
    this.clientEmails = [];
    const request = {
      "purpose": "get_all_email"
      }
    this.core.post('auto_email',request).then((response: any) => {
      if (response?.status == 1) {
        const clientEmails = response?.emails || [];
        for (let i = 0; i < clientEmails.length; i++) {
          const data = clientEmails[i];
          data.checkbox = `email-status-${i+1}`
          data.status = data.status == 1;
        }
        this.clientEmails = clientEmails;
      }
    }).catch(err => {
      console.error(err);
    }).finally(() => this.clientEmailLoading--)
  }

  openAddEmail() {
    this.modalService.open(this.addEmailContent, {ariaLabelledBy: 'modal-basic-title'}).result.then((result) => {
      if (result !== 'yes') {
        this.setEmailDefault();
      }
    })
  }

  updateEmailStatus(event: any, data: any) {
    this.selectedEmailData = data;
    this.modalService.open(this.emailStatusContent, {ariaLabelledBy: 'modal-basic-title'}).result.then((result) => {
      if (result == 'yes') {
        const request = {
          "purpose": 'update_cron_email',
          "id": data.id,
          "status": event ? "1" : "0"
          }
          this.selectedEmailData = null
          this.clientEmaiupdating++;
          this.core.post('auto_email',request).then((response: any) => {
            if (response?.status == 1) {
              this.core.toast("success", response?.msg);
            } else {
              this.core.toast("warn", response?.msg);
              data.status = !event;
            }
          }).catch(err => {
            this.core.toast("error", "Unable to update email status");
            data.status = !event;
            console.error(err);
          }).finally(() => {
            this.clientEmaiupdating--
          })

       
      } else {
        data.status = !event;
      }
    })
  }

  setEmailDefault() {
    this.clientEmailObj = {email: '', type: '', survey: '', client: this.projectContext === 'saksham' ? '2000' : ''};
  }

  getDashboardDefaultData() {
    this.defaultDashboardData = [
      {survey: "1", year: "5", season: "2", fromData: new Date(), toData: new Date()},
      {survey: "2", year: "5", season: "2", fromData: new Date(), toData: new Date()},
      {survey: "3", year: "5", season: "2", fromData: new Date(), toData: new Date()}
    ];
  }

  getEmailDefaultData() {
    this.defaultEmailData = [];
  }

  getEmailPath(path: string) {
    const addr = ['auto_email'];
    if (path) {
      addr.push(path);
    }
    return addr.join('/');
  }

  open(content: any, user?: any) {
    this.modalService.open(content, { ariaLabelledBy: 'modal-basic-title' }).result.then((result) => {
      
    }, (reason) => {
      
    });
  }

  onAddEmail(modal: any)  {
    if (!this.clientEmailObj?.email || 
      !this.emailRegex.test(this.clientEmailObj?.email) ||
      !this.clientEmailObj?.type ||
      !this.clientEmailObj?.survey ||
      !this.clientEmailObj?.client
      ) {
        this.core.toast('warn', 'Invalid data')
        return;
      }
    const request = {purpose: 'add_cron_email', ...this.clientEmailObj};
    this.clientEmaiupdating++;
          this.core.post('auto_email',request).then((response: any) => {
            if (response?.status == 1) {
              this.core.toast("success", response?.msg);
              this.getClientEmails();
              modal.close('yes')
              this.setEmailDefault();
            } else {
              this.core.toast("warn", response?.msg);
            }
          }).catch(err => {
            this.core.toast("error", "Unable to update addd email");
            console.error(err);
          }).finally(() => {
            this.clientEmaiupdating--
          })

  }


  // onFileChanged(event:any) {
  //   const file = event.target.files[0]
  //  
  // }

  get uf() {
    return this.uploadForm.controls;
  }

  onImageChange(e: any) {
    const reader = new FileReader();

    if (e.target.files && e.target.files.length) {
      const [file] = e.target.files;
      reader.readAsDataURL(file);

      reader.onload = () => {
        this.imgFile = reader.result as string;
        this.uploadForm.patchValue({
          imgSrc: reader.result
        });

      };
    }
  }

  upload() {
    // this.httpClient.post('http://localhost:8888/file-upload.php', this.uploadForm.value)
    //   .subscribe(response => {
    //     alert('Image has been uploaded.');
    //   })

    const request = {
      // "purpose": "set_profile_image",
      "purpose": "set_client_image",
      "client_id": this.userDetails.unit_id,
      "base64": this.uploadForm.value.imgSrc
    }


    this.core.post('users', request).then((response: any) => {
      if (response.status == 1) {
        this.userDetil.setUserImg(response.filename);
        this.userDetails = this.userDetil.getUserDetail();
        const config = this.featureToggle.getConfig();     
        this.userImg = config.BASEUSERIMG + this.userDetails.image;
      }

    })


    this.modalService.dismissAll();
  }

  getFullUserDetail() {
    const request = {"purpose":"get_user_details","user_id": this.userDetails.user_id}
    this.core.post('users', request).then((response: any) => {
      if (response?.status == 1) {
        this.user = response.user_details;
        this.generateUserLabel();
      }
    }).catch(err => {
      console.error(err)
    }).finally();
  }

  onYearChange(){
    this.getAgencyData();
  }

  onSeasonChange() {
    this.getAgencyData();
  }

  
  onClientChange() {
    this.getAgencyData();
  }


  getAgencyData() {
    this.selectedAgency = "";
    this.agencyOptions = [];
    if (this.selectedClient && this.selectedYear && this.selectedseason) {
      const request = {"purpose":"get_all","client_id":this.selectedClient, 'year': this.selectedYear, 'season': this.selectedseason};
      this.agencyLoading++;
      this.core.dashboard_post('agency',request).then((response: any) => {
        if (response?.status == 1) {
            this.agencyOptions = response.all_agencies || [];
            this.agencyOptions.push({agency_id: '0', agency_name: 'Self'});
        }
      }).catch(err => {
        console.log(err);
      }).finally(() => {
        this.agencyLoading--;
      })
    }
  }

  generateUserLabel() {
    this.labelDetails = {}
    this.labelDetails.name = `${this.user.first_name} ${this.user.last_name}`;
    this.labelDetails.roleName = this.user.role_name;
    if (this.user.phone) {
      this.labelDetails.phoneNumber = this.user.phone.slice(2).padEnd(5,'X') + this.user.phone.slice(-2).padStart(5,'X');
    } else {
      this.labelDetails.phoneNumber = 'NA';
    }
      this.labelDetails.email = this.user.email_id ? this.user.email_id : 'NA';
  }

  hasRoleImg(...roles: any[]) {
    if (this.user?.role_id) {
      return roles.includes(+this.user.role_id) ? `${this.assetsFolder}/images/tick.png` : `${this.assetsFolder}/images/close.png`
    }
    return '';
  }


  openResetConfirmation(content: any) {
    if (!this.selectedYear) {
      this.core.toast("warn", "Please select year");
      return;
    }
    if (!this.selectedseason) {
      this.core.toast("warn", "Please select season");
      return;
    }
    if (!this.selectedClient) {
      this.core.toast("warn", "Please select client");
      return;
    }
    if (!this.selectedAgency) {
      this.core.toast("warn", "Please select agency");
      return;
    }
		this.modalService.open(content, { centered: true, animation: true, keyboard: false, backdrop: 'static',  });
	}

  submitDefault(modal: any) {
    const request = {
      purpose: "reset_user_mapping",
      client: this.selectedClient,
      agency: this.selectedAgency,
      season: this.selectedseason,
      year: this.selectedYear,
      roles: this.selectedRoles?.length ? this.selectedRoles : this.roleOptions.map(d => d.value)
    };
    this.resetting++;
    this.core
      .post("users", request)
      .then((response: any) => {
        if (response?.status == 1) {
          this.selectedAgency = "";
          this.selectedClient= this.projectContext === 'saksham' ? "2000" : "";
          this.selectedYear = "";
          this.selectedseason = "";
          this.selectedRoles = [];
          this.agencyOptions = [];
          this.core.toast("success", response.msg);
          modal.close('success')
        } else {
          this.core.toast("error", response.msg);
        }
      })
      .catch((err) => {
        console.error(err);
        this.core.toast("error", "Unable to reset mapping");
      })
      .finally(() => this.resetting--);
  }

  changeTab(tabId: any) {
    if (tabId != this.active) {
      this.active = tabId;
    }
  }


  onDashboardPageTrigger(env: any) {
    this.currentDashboardpage = env.page_no;
    this.dashboardRecordsPerPage = env.records_per_page;
    this.getDashboardLog();
  }

  onEmailPageTrigger(env: any) {
    this.currentemailpage = env.page_no;
    this.emailRecordsPerPage = env.records_per_page;
    this.getEmailLog();
  }

}
