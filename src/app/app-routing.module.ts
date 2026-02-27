// src/app/app-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ChmDashboardComponent } from './chm-dashboard/chm-dashboard.component';
import { CceDashboardComponent } from './cce-dashboard/cce-dashboard.component';
import { RoleGuard } from './auth/role.guard';
import { RouteGuard } from './auth/route.guard';
import { RouteChildGuard } from './auth/route-child.guard';
import { ModuleGuard } from './auth/module.guard';
import { MainpageComponent } from './mainpage/mainpage.component';
import { LoginComponent } from './login/login.component';
import { SendEmailComponent } from './send-email/send-email.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { PrivacyPolicyComponent } from './privacy-policy/privacy-policy.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { HomeComponent } from './home/home.component';
import { DataComponent } from './data/data.component';
import { ApprovedDataComponent } from './approved-data/approved-data.component';
import { RejectedDataComponent } from './rejected-data/rejected-data.component';
import { SurveyWiseDataComponent } from './survey-wise-data/survey-wise-data.component';
import { ChangePasswordComponent } from './change-password/change-password.component';
import { ProfileSuperAdminComponent } from './profile-super-admin/profile-super-admin.component';
import { ManpowerattendanceComponent } from './manpowerattendance/manpowerattendance.component';
import { KmlViewComponent } from './kml-view/kml-view.component';
import { BlukDataStatusChangeComponent } from './bluk-data-status-change/bluk-data-status-change.component';
import { EmailGeneraterComponent } from './email-generater/email-generater.component';
import { ClsDashboardComponent } from './cls-dashboard/cls-dashboard.component';
import { ClsIntimationUploadComponent } from './cls-intimation-upload/cls-intimation-upload.component';
import { ChmFieldDataUploadComponent } from './chm-field-data-upload/chm-field-data-upload.component';
import { CceUploadComponent } from './cce-upload/cce-upload.component';
import { ViewChmFieldComponent } from './view-chm-field/view-chm-field.component';
import { ViewClsIntimationComponent } from './view-cls-intimation/view-cls-intimation.component';
import { ViewCceImplementationComponent } from './view-cce-implementation/view-cce-implementation.component';
import { ChmMlDataComponent } from './chm-ml-data/chm-ml-data.component';
import { TransferSurveyComponent } from './transfer-survey/transfer-survey.component';
import { CmsManagementComponent } from './cms-management/cms-management.component';
import { ProposalManagementComponent } from './proposal-management/proposal-management.component';
import { SurveyDataComponent } from './survey-data/survey-data.component';

const allRoles = ['1', '2', '3', '4', '5', '6', '7', '8'];
const routes: Routes = [
  {
    path: '',
    component: MainpageComponent,
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      { path: 'data', data: { authRole: allRoles }, canActivate: [RoleGuard], component: DataComponent },
      { path: 'approved-data', data: { authRole: allRoles }, canActivate: [RoleGuard], component: ApprovedDataComponent },
      { path: 'rejected-data', data: { authRole: allRoles }, canActivate: [RoleGuard], component: RejectedDataComponent },
      { path: 'survey-data/:id', data: { authRole: allRoles }, canActivate: [RoleGuard], component: SurveyWiseDataComponent },
      { path: 'change-password', data: { authRole: allRoles }, canActivate: [RoleGuard], component: ChangePasswordComponent },
      { path: 'profile', data: { authRole: allRoles }, canActivate: [RoleGuard], component: ProfileSuperAdminComponent },
      { path: 'manpowerattendance', data: { authRole: allRoles }, canActivate: [RoleGuard], component: ManpowerattendanceComponent },
      { path: 'kml-view', data: { authRole: allRoles, authAgencyScreen: 'kml_view' }, canActivate: [RoleGuard], component: KmlViewComponent },
      { path: 'transfer-user-data', data: { authRole: ['1', '2'], authAgencyScreen: 'transfer-user-data' }, canActivate: [RoleGuard], component: TransferSurveyComponent },
      { path: 'chmdashboard', data: { authRole: allRoles, authAgencyScreen: 'chmdashboard' }, canActivate: [RoleGuard], component: ChmDashboardComponent },
      { path: 'ccedashboard', data: { authRole: allRoles, authAgencyScreen: 'ccedashboard' }, canActivate: [RoleGuard], component: CceDashboardComponent },
      { path: 'clsdashboard', data: { authRole: allRoles, authAgencyScreen: 'clsdashboard' }, canActivate: [RoleGuard], component: ClsDashboardComponent },
      { path: 'home', data: { authRole: allRoles }, canActivate: [RoleGuard], component: HomeComponent },
      { path: 'chm/draft', data: { authRole: allRoles, authAgencyScreen: 'chm' }, canActivate: [RoleGuard], component: SurveyDataComponent },
      { path: 'chm/pending', data: { authRole: allRoles, authAgencyScreen: 'chm' }, canActivate: [RoleGuard], component: SurveyDataComponent },
      { path: 'chm/approved', data: { authRole: allRoles, authAgencyScreen: 'chm' }, canActivate: [RoleGuard], component: SurveyDataComponent },
      { path: 'chm/rejected', data: { authRole: allRoles, authAgencyScreen: 'chm' }, canActivate: [RoleGuard], component: SurveyDataComponent },
      { path: 'chm/alldata', data: { authRole: allRoles, authAgencyScreen: 'chm' }, canActivate: [RoleGuard], component: SurveyDataComponent },
      { path: 'revisit-chm/pending', data: { authRole: allRoles, authAgencyScreen: 'revisit_chm' }, canActivate: [RoleGuard], component: SurveyDataComponent },
      { path: 'revisit-chm/approved', data: { authRole: allRoles, authAgencyScreen: 'revisit_chm' }, canActivate: [RoleGuard], component: SurveyDataComponent },
      { path: 'revisit-chm/rejected', data: { authRole: allRoles, authAgencyScreen: 'revisit_chm' }, canActivate: [RoleGuard], component: SurveyDataComponent },
      { path: 'revisit-chm/alldata', data: { authRole: allRoles, authAgencyScreen: 'revisit_chm' }, canActivate: [RoleGuard], component: SurveyDataComponent },
      { path: 'cls/draft', data: { authRole: allRoles, authAgencyScreen: 'cls' }, canActivate: [RoleGuard], component: SurveyDataComponent },
      { path: 'cls/pending', data: { authRole: allRoles, authAgencyScreen: 'cls' }, canActivate: [RoleGuard], component: SurveyDataComponent },
      { path: 'cls/approved', data: { authRole: allRoles, authAgencyScreen: 'cls' }, canActivate: [RoleGuard], component: SurveyDataComponent },
      { path: 'cls/rejected', data: { authRole: allRoles, authAgencyScreen: 'cls' }, canActivate: [RoleGuard], component: SurveyDataComponent },
      { path: 'cls/alldata', data: { authRole: allRoles, authAgencyScreen: 'cls' }, canActivate: [RoleGuard], component: SurveyDataComponent },
      { path: 'cce/draft', data: { authRole: allRoles, authAgencyScreen: 'cce' }, canActivate: [RoleGuard], component: SurveyDataComponent },
      { path: 'cce/pending', data: { authRole: allRoles, authAgencyScreen: 'cce' }, canActivate: [RoleGuard], component: SurveyDataComponent },
      { path: 'cce/approved', data: { authRole: allRoles, authAgencyScreen: 'cce' }, canActivate: [RoleGuard], component: SurveyDataComponent },
      { path: 'cce/rejected', data: { authRole: allRoles, authAgencyScreen: 'cce' }, canActivate: [RoleGuard], component: SurveyDataComponent },
      { path: 'cce/alldata', data: { authRole: allRoles, authAgencyScreen: 'cce' }, canActivate: [RoleGuard], component: SurveyDataComponent },
      { path: 'chm/bulk-update', data: { authRole: ['1', '2', '3', '4'] }, canActivate: [RoleGuard], component: BlukDataStatusChangeComponent },
      { path: 'cls/bulk-update', data: { authRole: ['1', '2', '3', '4'] }, canActivate: [RoleGuard], component: BlukDataStatusChangeComponent },
      { path: 'cce/bulk-update', data: { authRole: ['1', '2', '3', '4'] }, canActivate: [RoleGuard], component: BlukDataStatusChangeComponent },
      { path: 'multipicking/pending', data: { authRole: allRoles, authAgencyScreen: 'multipicking' }, canActivate: [RoleGuard], component: SurveyDataComponent },
      { path: 'multipicking/approved', data: { authRole: allRoles, authAgencyScreen: 'multipicking' }, canActivate: [RoleGuard], component: SurveyDataComponent },
      { path: 'multipicking/rejected', data: { authRole: allRoles, authAgencyScreen: 'multipicking' }, canActivate: [RoleGuard], component: SurveyDataComponent },
      { path: 'multipicking/alldata', data: { authRole: allRoles, authAgencyScreen: 'multipicking' }, canActivate: [RoleGuard], component: SurveyDataComponent },
      { path: 'other-activity/pending', data: { authRole: allRoles, authAgencyScreen: 'other_activity' }, canActivate: [RoleGuard], component: SurveyDataComponent },
      { path: 'other-activity/approved', data: { authRole: allRoles, authAgencyScreen: 'other_activity' }, canActivate: [RoleGuard], component: SurveyDataComponent },
      { path: 'other-activity/rejected', data: { authRole: allRoles, authAgencyScreen: 'other_activity' }, canActivate: [RoleGuard], component: SurveyDataComponent },
      { path: 'other-activity/alldata', data: { authRole: allRoles, authAgencyScreen: 'other_activity' }, canActivate: [RoleGuard], component: SurveyDataComponent },
      { path: 'generate-email', data: { authRole: ['1', '2'] }, canActivate: [RoleGuard], component: EmailGeneraterComponent },
      { path: 'generate-email-excel', data: { authRole: ['1', '2'] }, canActivate: [RoleGuard], component: EmailGeneraterComponent },
      { path: 'chm-ml-data', data: { authRole: ['1', '2'] }, canActivate: [RoleGuard], component: ChmMlDataComponent },
      { path: 'cls-intimation-upload', data: { authRole: ['1', '2', '3', '4', '5'] }, canActivate: [RoleGuard], component: ClsIntimationUploadComponent },
      { path: 'view-cls-intimation', data: { authRole: ['1', '2', '3', '4', '5', '6', '7'], authAgencyScreen: 'external_cls_view' }, canActivate: [RoleGuard], component: ViewClsIntimationComponent },
      { path: 'chm-field-data-upload', data: { authRole: ['1', '2', '3', '4', '5'] }, canActivate: [RoleGuard], component: ChmFieldDataUploadComponent },
      { path: 'view-chm-field-data', data: { authRole: ['1', '2', '3', '4', '5', '6', '7'], authAgencyScreen: 'external_chm_view' }, canActivate: [RoleGuard], component: ViewChmFieldComponent },
      { path: 'cce-implementation-upload', data: { authRole: ['1', '2', '3', '4', '5'] }, canActivate: [RoleGuard], component: CceUploadComponent },
      { path: 'view-cce-implementation', data: { authRole: ['1', '2', '3', '4', '5', '6', '7'], authAgencyScreen: 'external_cce_view' }, canActivate: [RoleGuard], component: ViewCceImplementationComponent },
      { path: 'workshop/create', data: { authRole: allRoles, authAgencyScreen: 'workshop', module: 'cms-management' }, canActivate: [RoleGuard, ModuleGuard], component: CmsManagementComponent },
      { path: 'workshop/pending', data: { authRole: allRoles, authAgencyScreen: 'workshop', module: 'cms-management' }, canActivate: [RoleGuard, ModuleGuard], component: CmsManagementComponent },
      { path: 'workshop/approved', data: { authRole: allRoles, authAgencyScreen: 'workshop', module: 'cms-management' }, canActivate: [RoleGuard, ModuleGuard], component: CmsManagementComponent },
      { path: 'workshop/rejected', data: { authRole: allRoles, authAgencyScreen: 'workshop', module: 'cms-management' }, canActivate: [RoleGuard, ModuleGuard], component: CmsManagementComponent },
      { path: 'workshop/alldata', data: { authRole: allRoles, authAgencyScreen: 'workshop', module: 'cms-management' }, canActivate: [RoleGuard, ModuleGuard], component: CmsManagementComponent },
      { path: 'infra/create', data: { authRole: allRoles, authAgencyScreen: 'infra', module: 'cms-management' }, canActivate: [RoleGuard, ModuleGuard], component: CmsManagementComponent },
      { path: 'infra/pending', data: { authRole: allRoles, authAgencyScreen: 'infra', module: 'cms-management' }, canActivate: [RoleGuard, ModuleGuard], component: CmsManagementComponent },
      { path: 'infra/approved', data: { authRole: allRoles, authAgencyScreen: 'infra', module: 'cms-management' }, canActivate: [RoleGuard, ModuleGuard], component: CmsManagementComponent },
      { path: 'infra/rejected', data: { authRole: allRoles, authAgencyScreen: 'infra', module: 'cms-management' }, canActivate: [RoleGuard, ModuleGuard], component: CmsManagementComponent },
      { path: 'infra/alldata', data: { authRole: allRoles, authAgencyScreen: 'infra', module: 'cms-management' }, canActivate: [RoleGuard, ModuleGuard], component: CmsManagementComponent },
      { path: 'gro/create', data: { authRole: allRoles, authAgencyScreen: 'gro', module: 'cms-management' }, canActivate: [RoleGuard, ModuleGuard], component: CmsManagementComponent },
      { path: 'gro/pending', data: { authRole: allRoles, authAgencyScreen: 'gro', module: 'cms-management' }, canActivate: [RoleGuard, ModuleGuard], component: CmsManagementComponent },
      { path: 'gro/approved', data: { authRole: allRoles, authAgencyScreen: 'gro', module: 'cms-management' }, canActivate: [RoleGuard, ModuleGuard], component: CmsManagementComponent },
      { path: 'gro/rejected', data: { authRole: allRoles, authAgencyScreen: 'gro', module: 'cms-management' }, canActivate: [RoleGuard, ModuleGuard], component: CmsManagementComponent },
      { path: 'gro/alldata', data: { authRole: allRoles, authAgencyScreen: 'gro', module: 'cms-management' }, canActivate: [RoleGuard, ModuleGuard], component: CmsManagementComponent },
      { path: 'manpower/create', data: { authRole: allRoles, authAgencyScreen: 'manpower', module: 'cms-management' }, canActivate: [RoleGuard, ModuleGuard], component: CmsManagementComponent },
      { path: 'manpower/pending', data: { authRole: allRoles, authAgencyScreen: 'manpower', module: 'cms-management' }, canActivate: [RoleGuard, ModuleGuard], component: CmsManagementComponent },
      { path: 'manpower/approved', data: { authRole: allRoles, authAgencyScreen: 'manpower', module: 'cms-management' }, canActivate: [RoleGuard, ModuleGuard], component: CmsManagementComponent },
      { path: 'manpower/rejected', data: { authRole: allRoles, authAgencyScreen: 'manpower', module: 'cms-management' }, canActivate: [RoleGuard, ModuleGuard], component: CmsManagementComponent },
      { path: 'manpower/alldata', data: { authRole: allRoles, authAgencyScreen: 'manpower', module: 'cms-management' }, canActivate: [RoleGuard, ModuleGuard], component: CmsManagementComponent },
      { path: 'farmer/upload', data: { authRole: allRoles, authAgencyScreen: 'farmer', module: 'cms-management' }, canActivate: [RoleGuard, ModuleGuard], component: CmsManagementComponent },
      { path: 'farmer/view', data: { authRole: allRoles, authAgencyScreen: 'farmer', module: 'cms-management' }, canActivate: [RoleGuard, ModuleGuard], component: CmsManagementComponent },
      { path: 'farmer/pending', data: { authRole: allRoles, authAgencyScreen: 'farmer', module: 'cms-management' }, canActivate: [RoleGuard, ModuleGuard], component: CmsManagementComponent },
      { path: 'farmer/approved', data: { authRole: allRoles, authAgencyScreen: 'farmer', module: 'cms-management' }, canActivate: [RoleGuard, ModuleGuard], component: CmsManagementComponent },
      { path: 'farmer/rejected', data: { authRole: allRoles, authAgencyScreen: 'farmer', module: 'cms-management' }, canActivate: [RoleGuard, ModuleGuard], component: CmsManagementComponent },
      { path: 'farmer/alldata', data: { authRole: allRoles, authAgencyScreen: 'farmer', module: 'cms-management' }, canActivate: [RoleGuard, ModuleGuard], component: CmsManagementComponent },
      { path: 'beneficiaryFarmer/pending', data: { authRole: allRoles, authAgencyScreen: 'beneficiaryFarmer', module: 'cms-management' }, canActivate: [RoleGuard, ModuleGuard], component: CmsManagementComponent },
      { path: 'beneficiaryFarmer/approved', data: { authRole: allRoles, authAgencyScreen: 'beneficiaryFarmer', module: 'cms-management' }, canActivate: [RoleGuard, ModuleGuard], component: CmsManagementComponent },
      { path: 'beneficiaryFarmer/rejected', data: { authRole: allRoles, authAgencyScreen: 'beneficiaryFarmer', module: 'cms-management' }, canActivate: [RoleGuard, ModuleGuard], component: CmsManagementComponent },
      { path: 'beneficiaryFarmer/alldata', data: { authRole: allRoles, authAgencyScreen: 'beneficiaryFarmer', module: 'cms-management' }, canActivate: [RoleGuard, ModuleGuard], component: CmsManagementComponent },
      { path: 'proposal/upload', data: { authRole: allRoles, authAgencyScreen: 'proposal', module: 'cms-management' }, canActivate: [RoleGuard, ModuleGuard], component: ProposalManagementComponent },
      { path: 'proposal/view', data: { authRole: allRoles, authAgencyScreen: 'proposal', module: 'cms-management' }, canActivate: [RoleGuard, ModuleGuard], component: ProposalManagementComponent },
      { path: 'proposal/pending', data: { authRole: allRoles, authAgencyScreen: 'proposal', module: 'cms-management' }, canActivate: [RoleGuard, ModuleGuard], component: ProposalManagementComponent },
      { path: 'proposal/approved', data: { authRole: allRoles, authAgencyScreen: 'proposal', module: 'cms-management' }, canActivate: [RoleGuard, ModuleGuard], component: ProposalManagementComponent },
      { path: 'proposal/rejected', data: { authRole: allRoles, authAgencyScreen: 'proposal', module: 'cms-management' }, canActivate: [RoleGuard, ModuleGuard], component: ProposalManagementComponent },
      { path: 'proposal/alldata', data: { authRole: allRoles, authAgencyScreen: 'proposal', module: 'cms-management' }, canActivate: [RoleGuard, ModuleGuard], component: ProposalManagementComponent },
      { path: 'client', data: { module: 'user-management' }, loadChildren: () => import('./client-management/client-management.module').then(m => m.ClientManagementModule), canActivateChild: [RouteChildGuard, ModuleGuard] },
      { path: 'agency', data: { module: 'user-management' }, loadChildren: () => import('./agency-management/agency-management.module').then(m => m.AgencyManagementModule), canActivateChild: [RouteChildGuard, ModuleGuard] },
      { path: 'users', data: { module: 'user-management' }, loadChildren: () => import('./user-management/user-management.module').then(m => m.UserManagementModule), canActivateChild: [RouteChildGuard, ModuleGuard] },
      { path: 'notifications', data: { module: 'notification' }, loadChildren: () => import('./notification/notification.module').then(m => m.NotificationModule), canActivateChild: [RouteChildGuard, ModuleGuard] },
    ],
    canActivate: [RouteGuard],
    canActivateChild: [RouteChildGuard],
  },
  { path: 'login', component: LoginComponent, canActivate: [RouteGuard] },
  { path: 'send-email', component: SendEmailComponent },
  { path: 'send-email/:client_id', component: SendEmailComponent },
  { path: 'send-rabi-email', component: SendEmailComponent },
  { path: 'send-rabi-email/:client_id', component: SendEmailComponent },
  { path: 'reset-password', component: ResetPasswordComponent, canActivate: [RouteGuard] },
  { path: 'privacy_policy', component: PrivacyPolicyComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: '**', redirectTo: 'home' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule],
})
export class AppRoutingModule {}