import { Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';

import { FilterService } from '../../utilities/filter.service';
import { CoreService } from '../../utilities/core.service';
import { UserDetailService } from '../../auth/user-detail.service';
import { FeatureToggleService } from "../../shared/services/feature-toggle.service";
import { environment, ProjectContext } from "../../../environments/environment";
import { InsightsService } from '../../utilities/insights.service';

@Component({
  selector: 'app-add-agency',
  templateUrl: './add-agency.component.html',
  styleUrls: ['./add-agency.component.css']
})
export class AddAgencyComponent implements OnInit {

  private readonly  MAX_FILE_SIZE = (1024*1024) * 4;

  submitted = false;
  regForm: any;
  clients: any;
  userDetails: any;
  fileName: any;
  uploadedFile: any;
  loader = 0;
  csrfTokenName: any;
  csrfToken: any;
  projectContext: ProjectContext;
  assetsFolder: string;

  constructor(private fb: FormBuilder, private core: CoreService, private location: Location, private filter: FilterService, private userService: UserDetailService, private featureToggle: FeatureToggleService, private insightsService: InsightsService) {
    this.projectContext = this.featureToggle.getContext() as ProjectContext;
    this.assetsFolder = environment.projectConfigs[this.projectContext].assetsFolder;
  }

  ngOnInit(): void {
    this.userDetails = this.userService.getUserDetail();
    this.getClients();
    this.initForm();
    this.csrfTokenName = this.userService.getcsrfTokenName();
    this.csrfToken = this.userService.getcsrfToken();
  }

  getClients(){
    this.loader++
    const request ={ purpose : "get_all_created"}

    this.core.post("client", request).then((response: any,) => {
      if (response.status == 1) {
       this.clients = response.all_clients.filter((d:any)=> d.UNIT_STATUS == 1);
      } 
    }).catch(error => this.insightsService.logException(error)).finally(()=> {
      this.loader--
    })
  }


  initForm() {
    this.regForm = this.fb.group({
      name: ["", Validators.required],
      phone: ["", [Validators.required, Validators.minLength(10), Validators.pattern('[0-9]*')]],
      address: ["", Validators.required],
      client: [this.userDetails.unit_id || this.projectContext === 'saksham' ? "2000" : ""],
      pocname: ["", Validators.required],
      pocemail: ["", [Validators.required, Validators.email]],
    });
  }

  get f() { return this.regForm.controls; }


  createClient() {
    this.submitted = true;
    if (this.regForm.invalid) {
      return
    }

    const request: any = this.regForm.value;
    if (request?.name) {
      request.name = request.name.trim();
    }
    request.purpose = "create"
    request.agencyDocument = this.uploadedFile

    this.loader++
    this.core.post('agency', request).then((response: any) => {
      if (response.status == 1) {
        this.core.toast("success", response.msg);
        this.fileName = '';
        this.regForm.reset();
        this.initForm();
        this.submitted = false;

      } else if (response.msg) {
        this.core.toast("error", response.msg)
      } else {
        response?.name ? this.core.toast("error", response?.name) : '';
        response?.client ? this.core.toast("error", response?.client) : '';
        response?.address ? this.core.toast("error", response?.address) : '';
        response?.pocname ? this.core.toast("error", response?.pocname) : '';
        response?.pocemail ? this.core.toast("error", response?.pocemail) : '';
        response?.pocphone ? this.core.toast("error", response?.pocphone) : '';
      }
    }).catch(error => this.insightsService.logException(error)).finally(()=> this.loader--)
  }

  onFileSelected(event: any, fileUpload: any) {
    if (event?.target?.files?.length == 1) {
      if (event.target.files[0]?.size > this.MAX_FILE_SIZE)  {
        this.core.toast('warn', 'File size should not exceed 4MB');
        return
      }
      this.fileName = event.target.files[0].name;
      const file = event.target.files[0];
      const toBase64 = (file: any) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(this.uploadedFile = reader.result);
        reader.onerror = error => reject(error);
      });
      toBase64(file);
    }

  }

  back() {
    this.location.back()
  }

}
