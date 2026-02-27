import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserDetailService } from '../auth/user-detail.service';
import { CoreService } from '../utilities/core.service';
import { InsightsService } from '../utilities/insights.service';

@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.css']
})
export class ChangePasswordComponent implements OnInit {

  currentPassword: any;
  newPassword: any;
  confirmPassword: any;
  userForm: FormGroup = new FormGroup({});
  loading = 0;
  csrfTokenName: any;
  csrfToken: any;

  constructor(private fb: FormBuilder, private core: CoreService, private userService: UserDetailService, private insightsService: InsightsService) { 
    
  }

  ngOnInit(): void {
    this.initForm()
    this.csrfTokenName = this.userService.getcsrfTokenName();
    this.csrfToken = this.userService.getcsrfToken();
  }

  initForm() {
    this.userForm = this.fb.group({
      currentPassword: ["", Validators.required],
      newPassword: ["", [Validators.required, Validators.pattern('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*_=+-]).{8,}$')]],
      confirmPassword: ["", Validators.required],
      csrf_token: ["", Validators.nullValidator],
    });
  }

  getForm(field: any) {
    return this.userForm.get(field)
  }

  onUpdate() {
    this.userForm.markAllAsTouched();
    const formData = this.userForm.value;
    if (!formData.currentPassword) {
      this.core.toast('warn', 'Current Password is required');
      return
    }
    if (!formData.newPassword) {
      this.core.toast('warn', 'New Password is required');
      return
    }
    if (!formData.confirmPassword) {
      this.core.toast('warn', 'Confirm Password is required');
      return
    }
    if (this.getForm('newPassword')?.errors?.pattern) {
      this.core.toast('warn', 'New Password must be atleast 8 digit with upper case , lower case and special symbol');
      return
    }
    if (formData.currentPassword == formData.newPassword) {
      this.core.toast('warn', 'Current Password and New Password should not be same');
      return;
    }
    if (formData.confirmPassword != formData.newPassword) {
      this.core.toast('warn', 'New Password and Confirm Password should be same');
      return;
    }
    const user = this.userService.getUserDetail()
    const request = {purpose: 'changepassword', "old": this.userService.AESEncrypt(formData.currentPassword), "new": this.userService.AESEncrypt(formData.newPassword), id: user.user_id};
    this.loading++;
    this.core.post('auth/changepassword',request).then((response:any) => {
      if (response?.status == 1) {
        this.core.toast('success', response.msg);
        this.userService.logout();
      } else {
        this.core.toast('error', response.msg);
      }
    }).catch(err => {
      this.insightsService.logException(err);
      this.core.toast('error', 'Unable to update password')
    }).finally(() => this.loading--)

  }

}
