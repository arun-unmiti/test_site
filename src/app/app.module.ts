import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NgbModule, NgbNav, NgbNavModule, NgbAccordionModule } from '@ng-bootstrap/ng-bootstrap';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CarouselModule } from 'ngx-owl-carousel-o';
import { TabViewModule } from 'primeng/tabview';
import { ChartModule, HIGHCHARTS_MODULES } from 'angular-highcharts';
import * as more from 'highcharts/highcharts-more.src';
import * as exporting from 'highcharts/modules/exporting.src';
import * as exportData from 'highcharts/modules/export-data.src';
import { InputNumberModule } from 'primeng/inputnumber';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { CalendarModule } from 'primeng/calendar';
import { ChipsModule } from 'primeng/chips';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { SidebarModule } from 'primeng/sidebar';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, MAT_DATE_FORMATS } from '@angular/material/core';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
import { MatFormFieldModule } from '@angular/material/form-field';
import { LightgalleryModule } from 'lightgallery/angular';
import { ImageCropperModule } from 'ngx-image-cropper';
import { NgxImageCompressService } from 'ngx-image-compress';
import { CascadeSelectModule } from 'primeng/cascadeselect';
import { LoaderModule } from './utilities/loader/loader.module';
import { AngularFireModule } from '@angular/fire';
import { AngularFireAnalyticsModule, ScreenTrackingService } from '@angular/fire/analytics';
import { AngularFireAuthModule } from '@angular/fire/auth';
import { AngularFirestoreModule } from '@angular/fire/firestore';
import { NgOtpInputModule } from 'ng-otp-input';
import { AccordionModule } from 'primeng/accordion';
import { environment } from '../environments/environment';
import { FeatureToggleService } from './shared/services/feature-toggle.service';
import { CoreService } from './utilities/core.service';
import { FilterService } from 'primeng/api';
import { UserDetailService } from './auth/user-detail.service';
import { RouteGuard } from './auth/route.guard';
import { RouteChildGuard } from './auth/route-child.guard';
import { RoleGuard } from './auth/role.guard';
import { ModuleGuard } from './auth/module.guard';
import { HttpAPIInterceptor } from './utilities/http.interceptor';
import { SafePipe } from './safe.pipe';
import { ProfileSuperAdminComponent } from './profile-super-admin/profile-super-admin.component';
import { ChangePasswordComponent } from './change-password/change-password.component';
import { DataComponent } from './data/data.component';
import { LeafletmapComponent } from './leafletmap/leafletmap.component';
import { LoginComponent } from './login/login.component';
import { MainpageComponent } from './mainpage/mainpage.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { ChmViewDetailsComponent } from './chm-view-details/chm-view-details.component';
import { KmlViewComponent } from './kml-view/kml-view.component';
import { SurveyWiseDataComponent } from './survey-wise-data/survey-wise-data.component';
import { PaginationComponent } from './pagination/pagination.component';
import { UserManagementModule } from './user-management/user-management.module';
import { FarmerDetailsComponent } from './farmer-details/farmer-details.component';
import { ChmDashboardComponent } from './chm-dashboard/chm-dashboard.component';
import { CceDashboardComponent } from './cce-dashboard/cce-dashboard.component';
import { ApprovedDataComponent } from './approved-data/approved-data.component';
import { RejectedDataComponent } from './rejected-data/rejected-data.component';
import { ClsDashboardComponent } from './cls-dashboard/cls-dashboard.component';
import { EditKmlComponent } from './edit-kml/edit-kml.component';
import { ManpowerattendanceComponent } from './manpowerattendance/manpowerattendance.component';
import { BajajExcelDownloadComponent } from './bajaj-excel-download/bajaj-excel-download.component';
import { HomeComponent } from './home/home.component';
import { SurveyDataComponent } from './survey-data/survey-data.component';
import { EmailGeneraterComponent } from './email-generater/email-generater.component';
import { SendEmailComponent } from './send-email/send-email.component';
import { BlukDataStatusChangeComponent } from './bluk-data-status-change/bluk-data-status-change.component';
import { ClsIntimationUploadComponent } from './cls-intimation-upload/cls-intimation-upload.component';
import { ChmFieldDataUploadComponent } from './chm-field-data-upload/chm-field-data-upload.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { CceUploadComponent } from './cce-upload/cce-upload.component';
import { ViewChmFieldComponent } from './view-chm-field/view-chm-field.component';
import { ViewClsIntimationComponent } from './view-cls-intimation/view-cls-intimation.component';
import { ViewCceImplementationComponent } from './view-cce-implementation/view-cce-implementation.component';
import { PrivacyPolicyComponent } from './privacy-policy/privacy-policy.component';
import { ChmMlDataComponent } from './chm-ml-data/chm-ml-data.component';
import { TransferSurveyComponent } from './transfer-survey/transfer-survey.component';
import { YearSeasonProfileComponent } from './profile-super-admin/year-season-profile/year-season-profile.component';
import { CmsManagementComponent } from './cms-management/cms-management.component';
import { CmsWiseManagementComponent } from './cms-wise-management/cms-wise-management.component';
import { ProposalManagementComponent } from './proposal-management/proposal-management.component';
import { ProposalWiseManagementComponent } from './proposal-wise-management/proposal-wise-management.component';
import { RecaptchaV3Module, RECAPTCHA_V3_SITE_KEY } from 'ng-recaptcha';
import { NgxQRCodeModule } from 'ngx-qrcode2';

@NgModule({
  declarations: [
    AppComponent,
    ProfileSuperAdminComponent,
    ChangePasswordComponent,
    DataComponent,
    LeafletmapComponent,
    LoginComponent,
    MainpageComponent,
    ResetPasswordComponent,
    ChmViewDetailsComponent,
    KmlViewComponent,
    SurveyWiseDataComponent,
    PaginationComponent,
    FarmerDetailsComponent,
    ChmDashboardComponent,
    CceDashboardComponent,
    ApprovedDataComponent,
    RejectedDataComponent,
    ClsDashboardComponent,
    EditKmlComponent,
    ManpowerattendanceComponent,
    SafePipe,
    BajajExcelDownloadComponent,
    HomeComponent,
    SurveyDataComponent,
    EmailGeneraterComponent,
    SendEmailComponent,
    BlukDataStatusChangeComponent,
    ClsIntimationUploadComponent,
    ChmFieldDataUploadComponent,
    ForgotPasswordComponent,
    CceUploadComponent,
    ViewChmFieldComponent,
    ViewClsIntimationComponent,
    ViewCceImplementationComponent,
    PrivacyPolicyComponent,
    ChmMlDataComponent,
    TransferSurveyComponent,
    YearSeasonProfileComponent,
    CmsManagementComponent,
    CmsWiseManagementComponent,
    ProposalManagementComponent,
    ProposalWiseManagementComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    NgbModule,
    NgbNavModule,
    NgbAccordionModule,
    CarouselModule,
    TabViewModule,
    FormsModule,
    ReactiveFormsModule,
    ChartModule,
    InputNumberModule,
    AutoCompleteModule,
    CalendarModule,
    ChipsModule,
    SidebarModule,
    DropdownModule,
    MultiSelectModule,
    InputTextareaModule,
    BrowserAnimationsModule,
    InputTextModule,
    HttpClientModule,
    LightgalleryModule,
    ToastModule,
    MatDatepickerModule,
    MatNativeDateModule,
    TableModule,
    ButtonModule,
    CheckboxModule,
    NgxDaterangepickerMd.forRoot(),
    MatFormFieldModule,
    UserManagementModule,
    ImageCropperModule,
    CascadeSelectModule,
    LoaderModule,
    AngularFireModule.initializeApp(JSON.parse(atob(environment.projectConfigs[environment.featureContext].config))),
    AngularFireAnalyticsModule,
    AngularFireAuthModule,
    AngularFirestoreModule,
    NgOtpInputModule,
    AccordionModule,
    RecaptchaV3Module,
    NgxQRCodeModule
  ],
  exports: [
    SafePipe
  ],
  providers: [
    RouteGuard,
    RouteChildGuard,
    RoleGuard,
    ModuleGuard,
    UserDetailService,
    MessageService,
    CoreService,
    FilterService,
    NgxImageCompressService,
    ScreenTrackingService,
    FeatureToggleService,
    {
      provide: MAT_DATE_FORMATS,
      useValue: {
        parse: {
          dateInput: ['l', 'LL'],
        },
        display: {
          dateInput: 'L',
          monthYearLabel: 'MMM YYYY',
          dateA11yLabel: 'LL',
          monthYearA11yLabel: 'MMMM YYYY',
        },
      },
    },
    { provide: HIGHCHARTS_MODULES, useFactory: () => [more, exporting, exportData] },
    { provide: HTTP_INTERCEPTORS, useClass: HttpAPIInterceptor, multi: true },
    {
      provide: RECAPTCHA_V3_SITE_KEY,
      useValue: environment.projectConfigs[environment.featureContext].RECAPTCHA_SITE_KEY
    }
  ],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppModule { }