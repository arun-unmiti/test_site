import { Conditional } from "@angular/compiler";
import { AfterViewInit, Component, OnInit, ViewChild } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { isArray } from "highcharts";
import { UserDetailService } from "src/app/auth/user-detail.service";
import { CoreService } from "src/app/utilities/core.service";
import { FilterService } from "src/app/utilities/filter.service";
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import { FeatureToggleService } from "../../shared/services/feature-toggle.service";
import { environment, ProjectContext } from "../../../environments/environment";
import { ReCaptchaV3Service } from 'ng-recaptcha';

@Component({
  selector: "app-addusers",
  templateUrl: "./addusers.component.html",
  styleUrls: ["./addusers.component.css"],
})
export class AddusersComponent implements OnInit {

  userForm: any;

  roles: any[] = [];
  agencies :any[]= [];
  user_designation: any[] = [];
  loading = 0;
  isStateLoading = 0;
  submitted = false;
  clients: any[] = [];
  allAgencies: any[] = [];
  userDetails: any;
  selected_clients:any;
  statesData: any[] = [];
  selectedState: any[] = [];
  singleState: any = '';
  districtData: any[] = [];
  selectedDist: any[] = [];
  singleDist: any = '';
  tehsilsData: any[] = [];
  blockData: any[] = [];
  clientStates: any[] = [];
  clientDistricts: any[] = [];
  clientTehsils: any[] = [];
  selectedBlock: any[] = [];
  selectedtehsil: any[] = [];
  isLoadingLocation = 0;
  allDistricts: any[] = [];
  allTehsils: any[] = [];
  allBlocks: any[] = [];

  selectedYear: any = '';
  yearData: any[] = [];
  selectedSeason: any = '';
  seasonData: any[] = [];
  hideRoleType = false;		
  csrfTokenName: any;
  csrfToken: any;

  @ViewChild("confirmationContent") confirmationContent: any;
  projectContext: ProjectContext;
  assetsFolder: string;

  constructor(private fb: FormBuilder, private core: CoreService, private filter: FilterService, private userService: UserDetailService, private modalService: NgbModal, private featureToggle: FeatureToggleService, private recaptchaV3Service: ReCaptchaV3Service) {
    this.projectContext = this.featureToggle.getContext() as ProjectContext;
    this.assetsFolder = environment.projectConfigs[this.projectContext].assetsFolder;
  }

  ngOnInit(): void {
    this.userDetails = this.userService.getUserDetail();
    this.initForm();
    this.loadLocation();
    this.userRole();		
    this.csrfTokenName = this.userService.getcsrfTokenName();
    this.csrfToken = this.userService.getcsrfToken();
  }

  /**
   * Method to load lookup location
   */
  loadLocation() {
    this.isLoadingLocation++;
    if (this.filter.isLoactionFetched) {
      this.addLocation();
    } else {
      this.filter.fetchedLocationData.subscribe(() => {
        this.addLocation();
      });
    }
  }

  /**
   * method to assign lookup location to class variables
   */
  addLocation() {
    this.yearData = this.core.clone(this.filter.years);
    this.seasonData = this.core.clone(this.filter.seasons);
    // this.statesData = this.core.clone(this.filter.states);
    // this.allDistricts = this.core.clone(this.filter.districts);
    // this.allTehsils = this.core.clone(this.filter.tehsils);
    // this.allBlocks = this.core.clone(this.filter.blocks);
    // this.setDefaultLocation();
    this.isLoadingLocation--;
  }

  onStateChange(event: any) {
    this.districtData = [];
    this.tehsilsData = [];
    this.blockData = [];
    this.selectedDist = [];
    this.selectedtehsil = [];
    this.selectedBlock = [];
    const defaultDist: any[] = [];
    if (event?.length) {
      this.districtData =
        this.core.clone(event).map((state: any) => {
          const result: any = {
            state_name: state.state_name,
            state_id: state.state_id,
            items: [],
          };
          result.items = this.clientDistricts.filter((district: any) =>  district.state_id == state.state_id)
          defaultDist.push(...result.items);
          return result;
        }) || [];

        if ([5].includes(+this.userForm.get('user_role').value)) {
          this.selectedDist = defaultDist?.length ? this.core.clone(defaultDist) : [];
          this.singleDist = defaultDist?.length == 1 ? defaultDist[0].district_id : '';
          if (this.selectedDist?.length) {
            this.onDistrictChange(this.selectedDist)
          }
        }

    }
  }
  
  onSingleStateChange(event: any) {
    this.selectedState = this.statesData.filter(data => data.state_id == event)
    this.onStateChange(this.selectedState);
  }
  
  onDistrictChange(event: any) {
    this.tehsilsData = [];
    this.blockData = [];
    this.selectedtehsil = [];
    this.selectedBlock = [];
    const defaultTehsil: any[] = [];
    if (event?.length) {
      this.tehsilsData = event.map((district: any)=> {
        const result: any = {district_id: district.district_id, district_name: district.district_name};
        result.items = this.clientTehsils.filter((d: any) => d.district_id == district.district_id);
        defaultTehsil.push(...result.items);
        return result;
      });
    }
    this.selectedtehsil = defaultTehsil?.length ? this.core.clone(defaultTehsil) : [];
  }
  
  onSingleDistrictChange(event: any) {
    this.selectedDist = this.clientDistricts.filter(data => data.district_id == event)
    this.onDistrictChange(this.selectedDist);
  }
  
  onTehsilChange(event: any) {
    this.blockData = [];
    this.selectedBlock = [];
    if (event?.length) {
      this.blockData = event.map((tehsil: any)=> {
        const result: any = {tehsil_id: tehsil.tehsil_id, tehsil_name: tehsil.tehsil_name};
        result.items = this.allBlocks.filter((d: any) => d.tehsil_id == tehsil.tehsil_id);
        return result;
      });
    }

  }
  
  onBlockChange(event: any) {}

  setDefaultLocation() {
    const location = this.userService.getLocation();
    if (location?.states) {
      this.singleState = this.statesData?.[0]?.state_id;
      this.onSingleStateChange(this.singleState);
      if (location?.districts) {
        this.selectedDist = this.allDistricts;
        this.onDistrictChange(this.selectedDist)
      }
    }
  }

  userRole() {
    const calls = [
      this.core.post('users', { purpose: 'get_roles' }),
      this.core.post('agency', { purpose: 'get_all_created' })
    ]

    if (!this.userDetails?.unit_id) {
      calls.push(this.core.post('client', { purpose: "get_all_created" }));
    }

    Promise.all(calls).then((response: any) => {

      if (response[0]?.status == 1) {
        if (this.userDetails.user_role == 1) {
          this.roles = response[0].all_roles || [];
        } else {
          this.roles = response[0].all_roles.find((d: any) => d.role_id == this.userDetails.user_role)?.can_add || []
        }
      }
      if (response[1]?.status == 1) {
        this.allAgencies = response[1].all_agencies?.filter((d: any) => d.status == 1) || [];
        if (this.userDetails?.user_role == 7) {
          this.allAgencies = this.allAgencies.filter(d => !this.userDetails.agency_id || d.agency_id == this.userDetails.agency_id);
        }
        if (this.userDetails?.unit_id) {
          this.onClientChange(this.userDetails.unit_id)
        }
      }
      if (response[2]?.status == 1) {
        this.clients = response[2]?.all_clients?.filter((d: any) => d.UNIT_STATUS == 1) || []
      }
    }).catch().finally(() => {
      this.initForm();
    })

  }

  initForm() {
    let roleType = '';
    if (['7'].includes(this.userDetails?.user_role) && this.userDetails?.agency_id) {
      this.hideRoleType = true;
    }
    this.userForm = this.fb.group({
      first_name: ["", Validators.required],
      last_name: ["", Validators.required],
      email: ["", [Validators.email]],
      phone: ["", [Validators.required, Validators.minLength(10), Validators.pattern('[0-9]*')]],
      emp_id: ["", [Validators.required]],
      password: ["", [Validators.required, Validators.pattern('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*_=+-]).{8,}$')]],
      cpassword: ["", [Validators.required]],
      user_role: ["", Validators.required],
      client: [this.userDetails?.unit_id || "", Validators.required],
      roleType: [roleType],
      agency: [""],
      designation: [""]
    });
    if (this.userDetails?.unit_id) {
      this.onClientChange(this.userDetails.unit_id)
    }
  }



  onLevelChange(event: any) {

    this.singleState = '';
    this.selectedState = [];
    this.singleDist = '';
    this.selectedDist = [];
    this.selectedtehsil = [];
    this.statesData = [];
    this.districtData = [];
    this.tehsilsData = [];

    if ([1,2,3,4].includes(+event)) {
      this.selectedState = [];
    }
    if ([1,2,3,4,5,6].includes(+event)) {
      this.selectedDist = [];
    }
    this.selectedtehsil = [];
    this.selectedBlock = [];
    this.singleState = "";
    this.singleDist = "";
    if ([1,2].includes(+event)) {
      this.userForm.get('client').setValue('');
    }
    if (this.projectContext === 'saksham') {
      this.userForm.get('client').setValue('2000');
    }
    this.userForm.get('roleType').setValue('');
    this.userForm.get('agency').setValue('');
    this.userForm.controls["roleType"].clearValidators()
    if (['7', '8'].includes(this.userForm.get('user_role').value)) {
      this.userForm.controls["roleType"].setValidators(Validators.required)
    if (this.projectContext === 'saksham') {
      this.onClientChange('2000')
    }
    }
    if (this.hideRoleType) {
      this.userForm.controls["roleType"].setValue('2');
      this.onTypeChange('2');
    }
    this.userForm.controls["roleType"].updateValueAndValidity()

  }

  onTypeChange(event: any) {
    this.selectedYear = '';
    this.selectedSeason = '';
    this.singleState = '';
    this.selectedState = [];
    this.singleDist = '';
    this.selectedDist = [];
    this.userForm.get('agency').setValue('');
    this.userForm.controls["agency"].clearValidators()
    if (['7', '8'].includes(this.userForm.get('user_role').value) && this.userForm.get('roleType').value == 2) {
      this.userForm.controls["agency"].setValidators(Validators.required)
    }
    if (this.hideRoleType) {
      this.userForm.get('agency').setValue(this.userDetails.agency_id);
    }
    this.userForm.controls["agency"].updateValueAndValidity()
  }

  props(ele: any) {
    return this.userForm?.get(ele);
  }

  get f() { return this.userForm.controls; }

  createUser() {
    if (this.userForm.invalid) this.core.toast("error", "Please check mandatory fields");

    this.submitted = true;
    if (this.userForm.invalid) {
      return;
    }

    this.userForm.markAllAsTouched();
    if (this.userForm.valid) {
      const reg = this.userForm.value;

      if (reg.password != reg.cpassword) {
        this.core.toast("warn", "Password and Confirm Password must be similar");
        return;
      }
      if (['5','6','7', '8'].includes(reg.user_role)) {
        if (!this.selectedYear) {
          this.core.toast("warn", "Please assign year to user");
          return;
        }
        if (!this.selectedSeason) {
          this.core.toast("warn", "Please assign season to user");
          return;
        }
        if (!this.selectedState?.length) {
          this.core.toast("warn", "Please assign locations to user");
          return;
        }
        if (!this.selectedDist?.length) {
          this.core.toast("warn", "Please assign locations to user");
          return;
        }
        if (!this.selectedtehsil?.length && ['8'].includes(reg.user_role)) {
          this.core.toast("warn", "Please assign locations to user");
          return;
        }
      }
      const request = this.core.clone(this.userForm.value);
      request.purpose = 'create_user';
      request.agency = request.roleType == 2 ? request.agency : null;
      request.client = this.projectContext === 'munichre' ? this.selected_clients.length == 1 ? this.selected_clients[0] : this.selected_clients : '2000';
      request.states = this.selectedState.map(d => d.state_id);
      request.districts = this.selectedDist.map(d => d.district_id);
      request.tehsils = this.selectedtehsil.map(d => d.tehsil_id);
      request.year = this.selectedYear;
      request.season = this.selectedSeason;
      if(request.user_role == 4) {
        request.client = [request.client]
      }
      request.password = this.userService.AESEncrypt(request.password);
      request.cpassword = this.userService.AESEncrypt(request.cpassword);
      if (['1','2','3','4', '5', '6'].includes(request?.user_role)) {
        request.roleType = '1';
      }

      this.loading++;
      this.core.post('users', request).then((response: any) => {
        if (response.status == 1) {
          this.core.toast("success", response.msg);
          this.userForm.reset();
          this.initForm();
        } else if (response.status == 0) {
          if (response.active_account == 1) {
            this.openConfirmation(this.confirmationContent, response?.user_id)
          } else {
            this.core.toast("error", response.phone || response.email || response.username || response.msg || 'Unable to create user');
          }
          return
        }
      }).catch(err => {
        this.core.toast('error', "Unable to create user");
      }).finally(() => this.loading--);
      this.submitted = false;
    }
  }


  onClientChange(event: any) {
    this.userForm.get('roleType').setValue('');
    this.userForm.get('agency').setValue('');
    this.agencies = [];

    this.singleState = '';
    this.selectedState = [];
    this.singleDist = '';
    this.selectedDist = [];
    this.selectedtehsil = [];
    this.statesData = [];
    this.districtData = [];
    this.tehsilsData = [];


      this.selected_clients =  isArray(event) ? event?.map((d:any)=> d.UNIT_ID) : [event];

    if (event) {
        this.agencies = this.selected_clients.map((client:any)=> {
          return this.allAgencies.filter(d=> d.client.UNIT_ID == client)
          })?.flat()
    }
  }

  open(content: any) {
    const formValue = this.userForm.value;
    // formValue.roleType == 2 ? [formValue.agency]
    if(['7','8'].includes(formValue.user_role)) {
      if (!formValue.roleType) {
        this.core.toast('warn', 'Please select Role Type');
        return;
      }
      if (formValue.roleType == 2 && ! formValue.agency) {
        this.core.toast('warn', 'Please select Agency');
        return;
      }
    }
    this.modalService.open(content, {ariaLabelledBy: 'modal-basic-title'}).result.then((result) => {
    });
  }

  openConfirmation(content: any, user_id: any) {
    this.modalService.open(content, {ariaLabelledBy: 'modal-basic-title'}).result.then((result) => {
      if (result === 'yes') {
        this.recaptchaV3Service.execute('deactivate_user').subscribe({
          next: (token: string) => {
            this.core.post('users',{ purpose: 'deactivate_user', user_id, platform: 'web', captcha_token: token }).then((res: any) => {
              if (res?.status == 1) {
                this.createUser();
              } else {
                this.core.toast('error', res?.message)
              }
            }).catch(err => {
              this.core.toast('error', 'Unable to deactivate user')
            })
          },
          error: (err) => {
            this.core.toast('error', 'reCAPTCHA verification failed. Please try again.');
          }
        });
      }
    });
  }

  onAgencyChange(event: any) {
    this.singleState = '';
    this.selectedState = [];
    this.singleDist = '';
    this.selectedDist = [];
    this.selectedtehsil = [];
    this.statesData = [];
    this.districtData = [];
    this.tehsilsData = [];
  }

  onYearSelect(event: any) {
    this.singleState = '';
    this.selectedState = [];
    this.singleDist = '';
    this.selectedDist = [];
    this.selectedtehsil = [];
    this.statesData = [];
    this.districtData = [];
    this.tehsilsData = [];
    this.loadAgencyLocation();
  }
  onSeasonSelect(event: any) {
    this.singleState = '';
    this.selectedState = [];
    this.singleDist = '';
    this.selectedDist = [];
    this.selectedtehsil = [];
    this.statesData = [];
    this.districtData = [];
    this.tehsilsData = [];
    this.loadAgencyLocation();
  }

  async loadAgencyLocation() {
    if (this.selectedYear && this.selectedSeason) {
      const formValue = this.userForm.value;
      const client = this.projectContext === 'munichre' ? this.selected_clients.length == 1 ? this.selected_clients[0] : this.selected_clients : '2000';
      const agency = formValue.roleType == 2 && ['7','8'].includes(formValue.user_role) ? [formValue.agency] : '0';
      const request = {
        client, agency, year: this.selectedYear, season: this.selectedSeason
      }
      this.isStateLoading++
      const location: any = await this.filter.getAgencyWiseLocation(request, this.userDetails);
      this.isStateLoading--;
      this.clientStates = location.states || [];
      this.clientDistricts = location.districts;
      this.clientTehsils = location.tehsils;
      this.statesData = this.clientStates;
      // this.onStateChange(this.statesData);
    }

  }

}
