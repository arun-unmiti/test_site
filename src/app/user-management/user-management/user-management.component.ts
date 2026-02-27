import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ModalDismissReasons, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { UserDetailService } from 'src/app/auth/user-detail.service';
import { CoreService } from 'src/app/utilities/core.service';
import { FilterService } from 'src/app/utilities/filter.service';
import { Table } from 'primeng/table';
import { FeatureToggleService } from "../../shared/services/feature-toggle.service";
import { environment, ProjectContext } from "../../../environments/environment";

@Component({
  selector: 'app-user-management',
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.css']
})
export class UserManagementComponent implements OnInit {
  @ViewChild('dt') dt: any;

  value8: any;
  userList: any[] = [];
  allUsersList: any[] = [];

  selectedUser: any = {};

  closeResult = '';
  roles: any[] = [];

  agencies: any[] = [];
  query: any;
  userDetail: any;
  downloading = false;
  clients: any[] = [];
  states: any[] = [];
  loader = 0;
  lookupLoader = 0;
  isStateLoading = 0;
  agencyLoading = 0;
  update_loader = 0;
  districts: any[] = [];
  blocks: any[] = [];

  clientStates: any[] = [];
  clientDistricts: any[] = [];
  clientTehsils: any[] = [];
  clientBlock: any[] = [];

  selectedState: any[] = [];
  selectedDistrict: any[] = [];
  selectedBlock: any[] = [];
  mobileNumber: string = '';
  selectedRole: any = '';
  selectedStatus: any = '';
  selectedAgency: any[] = [];

  districtOptions: any[] = []
  blockOptions: any[] = [];

  selectedUserIdArray: any[] = []
  bulk_status: any = ''
  bulk_msg: any = '';
  allChecked: boolean = false;
  clientAgencies: any[] = [];
  clientAgency: any[] = [];
  first = 0;

  districtData:any[] =[];

  isFilterCollapsed = true;

  selectedYear: any = '';
  yearData: any[] = [];
  selectedSeason: any = '';
  seasonData: any[] = [];
  singleClient: any = '';
  clientData: any[] = [];
  isMandentory = false;		
  csrfTokenName: any;
  csrfToken: any;
  projectContext: ProjectContext;
  assetsFolder: string; 




  constructor(private fb: FormBuilder, private core: CoreService, private modalService: NgbModal, private userService: UserDetailService, private filter: FilterService, private featureToggle: FeatureToggleService) {
    this.projectContext = this.featureToggle.getContext() as ProjectContext;
    this.assetsFolder = environment.projectConfigs[this.projectContext].assetsFolder;
   }

  ngOnInit(): void {
    this.userDetail = this.userService.getUserDetail();
    if (this.userDetail.unit_id) {
      this.singleClient = this.userDetail.unit_id;
    }
    if (['5','6','7'].includes(this.userDetail.user_role)) {
      this.isMandentory = true;
    }
    this.userRole();
    // this.getAgencues()
    this.lookupLoader++;
    if (this.filter.isLoactionFetched) {
      this.setFilterValue()
    } else {
      this.filter.fetchedLocationData.subscribe(() => {
        this.setFilterValue();
      })
    }
    this.csrfTokenName = this.userService.getcsrfTokenName();
    this.csrfToken = this.userService.getcsrfToken();
  }

  userRole() {
    const request = { purpose: 'get_roles' };
    this.core.post('users', request).then((response: any) => {
      if (response?.status == 1) {

        if (this.userDetail.user_role == 1) {
          this.roles = response.all_roles || [];
        } else {
          this.roles = response.all_roles.find((d: any) => d.role_id == this.userDetail.user_role)?.can_add || []
        }

        // if (this.userDetail?.unit_id && this.userDetail.user_role == 3) {
        //   this.roles = response.all_roles?.filter((d: any) => d.role_id > 4) || [];
        // } else if (this.userDetail?.unit_id && this.userDetail.user_role == 4) {
        //   this.roles = response.all_roles?.filter((d: any) => d.role_id > 4) || [];
        // } else {
        //   this.roles = response.all_roles || []
        // }

        // this.roles = response.all_roles || [];
      }
    }).catch(error => console.error(error))
  }

  getUserData(params: any = {}) {
    this.loader++

    const calls = [
      { purpose: Object.keys(params).length ? 'userslist' : 'get_users_witout_status', ...params },
      { purpose: 'get_agencies', client_id : this.userDetail?.unit_id  },
      { purpose: Object.keys(params).length ? 'userslist' : 'get_all_usersLocationInfo', ...params },
    ].map((d, i) => d.purpose === 'userslist' ? this.core.post(d) : this.core.post('users', d));

    Promise.all(calls).then((response: any) => {
      if (+response[0]?.status === 1) {
        if(this.userDetail?.unit_id){
          const  userList= response[0].users || response[0].userdata || [];
          this.userList = userList.filter((d:any)=> +d.role_id > +this.userDetail.user_role)
        }else{
          this.userList = response[0].users || response[0].userdata || [];
        }
        this.userList.forEach((d: any, i: any) => {
          d.sno = i + 1;
          d.checked = false;
          d.statusName = this.getStatus(d.status);
          d.fullName = `${d.first_name} ${d.last_name}`;
         })
      }

      if (+response[2]?.status === 1) {
        this.allUsersList = response[2].users || response[2].userdata || [];
        this.allUsersList.forEach((d: any, i: any) => {
          d.statusName = this.getStatus(d.status);
          d.fullName = `${d.first_name} ${d.last_name}`;
         })
      }

    }).finally(() => {
        this.loader--
      })
  }

  setFilterValue() {
    this.lookupLoader--;
    this.clients = this.filter.clients;
    this.yearData = this.filter.years;
    this.seasonData = this.filter.seasons;
    this.clientData = this.filter.clients;
    if (!this.isMandentory) {
      this.clientStates = this.core.clone(this.filter.states);
      this.clientDistricts = this.core.clone(this.filter.districts);
      this.clientTehsils = this.core.clone(this.filter.tehsils);
      this.clientBlock = this.core.clone(this.filter.blocks);
    }
    this.states = this.clientStates;
    this.districts = this.clientDistricts;
    this.blocks = this.clientTehsils
    this.setDefaultLocation()
    if (['1','2','3','4'].includes(this.userDetail?.user_role)) {
      this.onSearch();
    }
  }

  async onStateChange(event: any) {
    this.districtOptions = [];
    this.blockOptions = [];
    this.selectedDistrict = [];
    this.selectedBlock = [];

    if (event?.length) {
      this.districtOptions = this.core.clone(event).map((state: any) => {
        state.items = this.core.clone(this.clientDistricts).filter((dist: any) => dist.state_id == state.state_id)
        return state
      })
    }
  }


  async getDistrictData(values: any) {

    this.districtData = [];
    
    // const values = this.selectedState?.map((d:any) => d.state_id);
    const promises = values.map((d: any) => {
      const request = {
        purpose: "get_locations",
        location_type: "lkp_district",
        location_id: d,
      };
      return this.core.post(request);
    });
    await Promise.all(promises).then((res) => {
      res.forEach((d: any) => {
        if (d.status == 1) {
          this.districtData.push(...d.lkp_district);
          
        }
      });
    });    
  }

  onDistrictChange(event: any) {
    this.selectedBlock = [];
    if (event?.length) {
      this.blockOptions = this.core.clone(event).map((d: any) => {
        d.items = this.clientTehsils.filter(
          (e: any) => e.district_id == d.district_id
        );
        return d;
      });
    }
  }

  onSearch() {
    if (this.isMandentory) {
      if (!this.selectedYear) {
        this.core.toast("warn", "Please select year");
        return;
      }
      if (!this.selectedSeason) {
        this.core.toast("warn", "Please select season");
        return;
      }
    }
    if (['5','6'].includes(this.userDetail.user_role)) {
      if (!this.selectedRole) {
        this.core.toast('warn', "Please select role type");
        return;
      }

      if (this.selectedRole == 2 && !this.selectedAgency?.length) {
        this.core.toast('warn', 'Please select agency');
        return;
      }
    }

    this.userList = []
    this.resetTable();
    const request: any = {
      phone: this.mobileNumber,
      states: this.selectedState.map((d: any) => d.state_id),
      districts: this.selectedDistrict.map((d: any) => d.district_id),
      tehsils: this.selectedBlock.map((d: any) => d.tehsil_id),
      roll: this.selectedRole || undefined,
      agencies: this.userDetail?.agency_id ? [this.userDetail?.agency_id] : this.selectedAgency.map(d => d.agency_id),
      client_id: this.userDetail?.unit_id || this.singleClient || undefined,
      year: this.selectedYear || undefined,
      season: this.selectedSeason || undefined,
      status: this.selectedStatus || undefined,
      purpose: 'userslist'
    }

    if (+this.userDetail.user_role > 4) {
      request.states  = request.states?.length == 0 ? this.states.map((d: any) => d.state_id) : request.states;
      request.districts  = request.districts?.length == 0 ?  this.clientDistricts.map((d: any) => d.district_id) : request.districts;
      request.tehsils  = request.tehsils?.length == 0 ?  this.clientTehsils.map((d: any) => d.tehsil_id) : request.tehsils;
    }

    if (!request.states.length) {
     delete request.states;
    }
    if (!request.districts.length) {
     delete request.districts;
    }
    if (!request.tehsils.length) {
     delete request.tehsils;
    }

    if (this.userDetail?.user_role == 7) {
      if (this.userDetail?.agency_id) {
        request.roll = '2'; // search only off-roll surveyour
      } else {
        request.roll = undefined; // does not consider roll in search
      }
    }

    if (!request.year && !request.season && !request.roll && !request.agencies?.length && !request.states?.length && !request.districts?.length && !request.tehsils?.length && !request.status && (this.projectContext === 'munichre' ? !request.phone : true) && (this.projectContext !== 'munichre' || !request.client_id || +this.userDetail?.user_role > 2)) {
      this.getUserData();
      return;
    }
    this.loader++

    this.core.post(request).then((response: any) => {
      if (response?.status == 1) {
        if (this.userDetail?.unit_id) {
          // this.userList = response.users || response.userdata?.filter((d: any) => d.role_id > 4) || []
          const  userList= response.users || response.userdata || [];
          this.userList = userList.filter((d:any)=> +d.role_id > +this.userDetail.user_role)
        } else {
          this.userList = response.users || response.userdata || [];
        }

        this.userList.forEach((d: any, i: any) => {
          d.sno = i + 1;
          d.checked = false;
          d.statusName = this.getStatus(d.status);
          d.fullName = `${d.first_name} ${d.last_name}`;
         })

        this.userList = this.userList.filter(d => this.userDetail.user_role != d.role_id)
      }
    }).catch(err => {
      this.core.toast('error', 'Unable to fetch users')
    }).finally(() => { this.loader-- })

  }

  setStatus(status: any) {


    this.loader++
    const request = {
      // purpose: 'bulk_user_status_update',
      purpose: 'change_user_status',
      status,
      // data: this.userList.map(d => {
      // user_id: this.selectedUserIdArray.map(d => {
      //   return d
      // })
      user_id: this.userList.filter(d => d.role_id != 1 && d.checked).map(d => d.user_id)
      // data: this.selectedUserIdArray.map(d=> user_id: d)
    };

    this.core.post("users", request).then((response: any) => {
      if (response?.status == 1) {
        this.core.toast('success', response?.msg)
        // this.userList.forEach(d => d.status == status)
        this.selectedUserIdArray = []
        this.allChecked = false;
        this.onSearch();
      } else {
        this.core.toast('error', response?.msg)
      }
    })
      .catch(err => {
        this.core.toast('error', 'Unable to update status')
      })
      .finally(() => this.loader--)
    this.modalService.dismissAll();
  }

  open(content: any, user: any, contentPurpose?: any) {
    this.selectedUser = {};
    if (contentPurpose === 'reset_password' || contentPurpose === 'reset_2fa') {
      this.selectedUser = user;
    } else {
      const request = { purpose: 'get_user_details', "user_id": user.user_id }
  
      const calls = [
        { purpose: 'get_user_details', "user_id": user.user_id },
        { purpose: 'get_agencies', client_id : this.userDetail?.unit_id  }
      ].map((d) => this.core.post('users', d));
  
      Promise.all(calls).then((response: any) => {
        if (response[0]?.status == 1) {
          this.selectedUser.email = response[0].user_details.email_id;
          this.selectedUser.fname = response[0].user_details.first_name;
          this.selectedUser.lname = response[0].user_details.last_name;
          this.selectedUser.username = response[0].user_details.username;
          this.selectedUser.emp_id = response[0].user_details.emp_id;
          this.selectedUser.client_id = response[0].user_details.agency?.client_id;
          this.selectedUser.phone = response[0].user_details.phone || "";
          this.selectedUser.designation = response[0].user_details.designation || "";
          this.selectedUser.user_id = response[0].user_details.user_id;
          this.selectedUser.role = response[0].user_details.role_id;
          // this.selectedUser.role_type = response[0].user_details.role_type;
          this.selectedUser.role_type = response[0].user_details.employee_type;
          this.selectedUser.agency_id = response[0].user_details.agency?.agency_id;
        }
        if (response[1]?.status == 1) {
          this.clientAgencies = response[1].all_agencies || []
          this.onClientChange(this.selectedUser.client_id, true);
        }
      }).catch().finally()

    }

    this.modalService.open(content, { ariaLabelledBy: 'modal-basic-title', size: contentPurpose ? 'sm' : 'lg' }).result.then((result) => {
      this.closeResult = `Closed with: ${result}`;

    }, (reason) => {
      this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
    });
  }

  allowOnlyNumbers(event: KeyboardEvent) {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
    }
  }

  confirm(content: any, status: any) {
    this.bulk_status = status
    this.bulk_msg = status == 1 ? 'active' : 'inactive'
    this.modalService.open(content, { ariaLabelledBy: 'modal-basic-title', size: 'lg' }).result.then((result) => {
      this.closeResult = `Closed with: ${result}`;

    }, (reason) => {
      this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
    });
  }
  private getDismissReason(reason: any): string {
    if (reason === ModalDismissReasons.ESC) {
      return 'by pressing ESC';
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return 'by clicking on a backdrop';
    } else {
      return `with: ${reason}`;
    }
  }

  onChange(event: any) {
    this.selectedUser.agency_id = ''
  }

  update() {

    const request: any = this.selectedUser
    if (isNaN(request.phone) || request.phone.length < 10) {
      this.core.toast('error', "Enter valid Mobile Number")
      return
    }
    if (!request.emp_id?.trim()) {
      this.core.toast('error', "Enter Employee Id")
      return
    }
    if (!['7', '8'].includes(request.role)) {
      delete request.role_type;
      delete request.agency_id;
    }
    if (['1','2'].includes(request.role)) {
      delete request.client_id;
    }
    request.agency_id = !request.agency_id ? null : request.agency_id;

    request.purpose = "update_user_details"

    this.update_loader++;
    this.core.post("users", request).then((response: any,) => {
      if (response.status == 1) {
        this.core.toast('success', response.msg);
        this.onSearch();
        this.modalService.dismissAll();
        this.selectedUser = {};
      } else if (response.status == 0 && response.email) {
        this.core.toast('error', response.email);
        // return
      } else if (response.status == 0 && response.phone) {
        this.core.toast('error', response.phone);
        // return
      } else if (response.status == 0 && response.client_id) {
        this.core.toast('error', response.phone);
        // return
      } else {
        this.core.toast("error", "something went wrong");
        return
      }
    }).catch((err) => {
      console.log(err);
    }).finally(() => this.update_loader--);


  }

  // changeStatus(user: any) {
  //   const status = user.status == "0" ? "1" : "0";

  //   const request = {
  //     "purpose": "change_user_status",
  //     "user_id": user.user_id,
  //     "status": status
  //   }
  //   this.core.post("users", request).then((response: any,) => {
  //     if (response.status == 1) {
  //       this.core.toast('success', response.msg);
  //       this.onSearch();
  //     } else {
  //       this.core.toast("error", response.msg);
  //     }
  //   })
  // }

  changeStatus(user: any, status: any) {
    // const status = agency.status == "0" ? "1" : "0";

    const request = {
      "purpose": "change_user_status",
      "user_id": user.user_id,
      "status": status
    }

    this.loader++;
    this.core.post("users", request).then((response: any,) => {
      if (response.status == 1) {
        this.core.toast('success', response.msg);
        this.onSearch();
      } else {
        this.core.toast("error", response.msg);
      }
    }).catch((err) => {
      this.core.toast('error', 'Unable to change status')
    }).finally(() => this.loader--)
  }

  resetPassword(user: any) {

    const request = {
      "purpose": "reset_user_password",
      "user_id": user.user_id,
    }
    this.core.post("users", request).then((response: any,) => {
      if (response.status == 1) {
        this.core.toast('success', response.msg);
        this.onSearch();
      } else if (response.status == 0 && response.email) {
        this.core.toast('error', response.email);
        return
      } else if (response.status == 0 && response.phone) {
        this.core.toast('error', response.phone);
        return
      } else {
        this.core.toast("error", "something went wrong");
        return
      }
    })

    this.modalService.dismissAll();
  }

  // New method for Reset 2FA
  reset2FA() {
    const request = {
      purpose: 'reset2fa',
      user_id: this.selectedUser.user_id,
      login_id: this.userDetail.user_id,
      login_role: this.userDetail.user_role
    };

    this.loader++;
    this.core.post('users', request).then((response: any) => {
      if (response.status == 1) {
        this.core.toast('success', response.msg || '2FA reset successful');
        this.onSearch(); // Refresh list if needed
      } else {
        this.core.toast('error', response.msg || 'Failed to reset 2FA');
      }
    }).catch(() => {
      this.core.toast('error', 'Error resetting 2FA');
    }).finally(() => {
      this.loader--;
      this.modalService.dismissAll();
    });
  }

  exportTable(data: any,  fileName: any) {
    let fields = []
    if (this.projectContext === 'munichre') {
      fields = [
        {field: 'user_id', header: 'User Id'},
        {field: 'fullName', header: 'Full name'},
        {field: 'statusName', header: 'Status'},
        {field: 'role_name', header: 'Role'},
      ]
    } else {
      fields = [
        {field: 'user_id', header: 'User Id'},
        {field: 'fullName', header: 'Full name'},
        {field: 'email_id', header: 'Email id'},
        {field: 'phone', header: 'Contact number'},
        {field: 'role_name', header: 'Role'},
        {field: 'designation', header: 'Designation'},
        {field: 'emp_id', header: 'Employee ID'},
        {field: 'employee_type', header: 'Employee Type'},
        {field: 'added_by', header: 'Added by user id'},
        {field: 'added_datetime', header: 'Added date and time'},
        {field: 'statusName', header: 'Status'}
      ]
    }
    this.core.exportExcel(data, fields, fileName);
    // this.downloading = true;
    // setTimeout(() => {
    //   this.downloading = false;
    // }, 100);
  }

  async exportAllUsers() { 
    if (this.projectContext === 'munichre') {
      try {
        this.loader++;
        const response: any = await this.core.post( 'userreport', { purpose: 'generateuserreport' });
        const blob = response.body;
        let filename = 'users_audit_report.zip';
        const contentDisposition = response.headers.get('content-disposition');
        if (contentDisposition) {
          const match = contentDisposition.match(/filename="(.+?)"/) || contentDisposition.match(/filename=([^;]+)/);
          if (match && match[1]) {
            filename = match[1].trim();
          }
        }
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } catch (err: any) {
        throw new Error(`Failed to download file: ${err.message}`);
      } finally {
        this.loader--;
      }
    } else {
      const  fields = [
        {field: 'user_id', header: 'User Id'}, {field: 'fullName', header: 'Full name'}, {field: 'email_id', header: 'Email id'}, {field: 'phone', header: 'Contact number'}, {field: 'status', header: 'Status'}, {field: 'role_name', header: 'Role'},
        {field: 'createdby', header: 'Created By'}, {field: 'added_datetime', header: 'Create Date'}, {field: 'year', header: 'year'}, {field: 'season_name', header: 'Season'}, {field: 'state_name', header: 'State'}, {field: 'district_name', header: 'District'},
        {field: 'tehsil_name', header: 'Tehsil'}, {field: 'createdby', header: 'Created By'}, {field: 'approvedDate', header: 'Approved Date'}, {field: 'approvedBy', header: 'Approved By'}, {field: 'approvedRole', header: 'Approver Role'},
      ]
      this.core.exportExcel(this.allUsersList, fields, 'AllUsers');
    }
  }

  // applyFilterGlobal($event: any, stringVal: any) {
  //   this.dt?.filterGlobal(($event.target as HTMLInputElement).value, 'contains');
  // }

  getEventValue($event: any): string {
    return $event.target.value;
  }
  clear(table: Table) {
    table.clear();
  }

  onSelectUser(selected: any) {
    this.allChecked = this.userList.filter((data: any) => data.role_id != 1).every((data: any) => data.checked)
    let user: any = selected.user_id.toString();
    if (this.selectedUserIdArray.includes(user)) {
      const index = this.selectedUserIdArray.indexOf(user);
      if (index > -1) {
        this.selectedUserIdArray.splice(index, 1);
      }
    } else {
      this.selectedUserIdArray.push(user);
    }
  }

  getStatus(status: any) {
    return status == 2 ? "Pending Approval" : status == 1 ? 'Active' : 'In-active'
  }

  onAllChecked(event: any) {
    this.userList.filter((data: any) => data.role_id != 1).forEach((data: any) => data.checked = event)
  }

  get canActiveInActive() {
    return this.userList.filter((data: any) => data.role_id != 1).some((data: any) => data.checked)
  }

  OnRoleTypeChange(event: any) {
    if (!['7'].includes(this.userDetail?.user_role)) {
      this.selectedAgency = [];
    }
    this.userList = [];
    this.states = [];
    this.selectedState = [];
    this.districtOptions = [];
    this.selectedDistrict = [];
    this.blockOptions = [];
    this.selectedBlock = [];
    if (event == 1) {
      this.loadAgencyLocation();
    }
  }

  onClientChange(event: any, isNotFilter?: any) {
    if (!isNotFilter) {
      this.userList = [];
    }
    this.clientAgency = []
    if (event) {
      this.clientAgency = this.clientAgencies.filter((d: any) => d.client?.UNIT_ID == event && (!this.userDetail?.agency_id || d.agency_id == this.userDetail?.agency_id));
    }
  }

  resetTable() {
    // if (this.dt) {
    //   Object.keys(this.dt.filters).forEach((field: any) => {
    //     if (this.dt?.filters?.[field]?.value) this.dt.filters[field].value = ''
    //   });
    //   this.dt.reset();
    // }
    this.first = 0;
  }

  getAgencues() {
    this.loader++
    this.core.post('users', { purpose: 'get_agencies', client_id : this.userDetail?.unit_id }).then((response: any) => {
      if (response.status == 1) {
        this.agencies = response.all_agencies || []
      }
    }).catch(err => {
      console.log(err);
    }).finally(() => this.loader--)
  }

  setDefaultLocation() {
    const location = this.userService.getLocation();
    if (location?.states) {
      this.selectedState = this.states;
      this.onStateChange(this.selectedState);
      if (location?.districts) {
        this.selectedDistrict = this.core.clone(this.districts);
        this.onDistrictChange(this.selectedDistrict)
      }
    }

    if (['7'].includes(this.userDetail?.user_role)) {
      if (this.userDetail.agency_id) {
        this.selectedAgency = [this.userDetail.agency_id];
      } else {
        this.selectedRole == '1';
      }
    }
  }

  onYearSelect(event: any) {
    this.userList = [];
    this.agencies = [];
    this.states = [];
    this.selectedState = [];
    this.districtOptions = [];
    this.selectedDistrict = [];
    this.blockOptions = [];
    this.selectedBlock = [];

    if (!['7'].includes(this.userDetail?.user_role)) {
      this.selectedAgency = [];
      this.selectedRole = '';
    }

    this.getAgencyData();
  }
  onSeasonSelect(event: any) {
    this.userList = [];
    this.agencies = [];
    this.states = [];
    this.selectedState = [];
    this.districtOptions = [];
    this.selectedDistrict = [];
    this.blockOptions = [];
    this.selectedBlock = [];

    if (!['7'].includes(this.userDetail?.user_role)) {
      this.selectedAgency = [];
      this.selectedRole = '';
    }
    this.getAgencyData();
  }
  onSingleClinetChange(event: any) {
    this.userList = [];
    this.agencies = [];
    this.states = [];
    this.selectedState = [];
    this.districtOptions = [];
    this.selectedDistrict = [];
    this.blockOptions = [];
    this.selectedBlock = [];

    if (!['7'].includes(this.userDetail?.user_role)) {
      this.selectedAgency = [];
      this.selectedRole = '';
    }
    this.getAgencyData();
  }

  async loadAgencyLocation(agency: any = 0) {
    const request = {
      client: this.singleClient, agency, year: this.selectedYear, season: this.selectedSeason
    }
    this.isStateLoading++
    const location: any = await this.filter.getAgencyWiseLocation(request, this.userDetail);
    this.isStateLoading--;
    this.clientStates = location.states || [];
    this.clientDistricts = location.districts;
    this.clientTehsils = location.tehsils;

    this.states = this.clientStates;

  }


  getAgencyData() {
    if (this.singleClient && this.selectedYear && this.selectedSeason) {
      const request = {"purpose":"get_all","client_id":this.singleClient, 'year': this.selectedYear, 'season': this.selectedSeason};
      this.agencyLoading++;
      this.core.dashboard_post('agency',request).then((response: any) => {
        if (response?.status == 1) {
            this.agencies = response.all_agencies || [];
            if (['7'].includes(this.userDetail.user_role)) {
              if (this.userDetail?.agency_id) {
                const agencies = this.agencies.filter(d => d.agency_id == this.userDetail?.agency_id);
                this.onAgencyChange(agencies);
              } else {
                this.selectedRole = '1';
                this.OnRoleTypeChange(1);
              }
            }
        }
      }).catch(err => {
        console.log(err);
      }).finally(() => {
        this.agencyLoading--;
      })
    }
  }

  async onAgencyChange(event: any) {
    this.userList = [];
    this.states = [];
    this.selectedState = [];
    this.districtOptions = [];
    this.selectedDistrict = [];
    this.blockOptions = [];
    this.selectedBlock = [];
    await this.loadAgencyLocation(event.map((d: any) => d.agency_id));
  }

  get isRoleValid() {
    return !(this.selectedYear && this.selectedSeason && this.singleClient);
  }

  get isAgencyValid() {
    return !(this.selectedYear && this.selectedSeason && this.singleClient && this.selectedRole == 2);
  }

  get isLocationValid () {
    return !(this.selectedYear && this.selectedSeason && this.singleClient && (this.selectedRole == 1 || this.selectedAgency?.length));
  }
}
