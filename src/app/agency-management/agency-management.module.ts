import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';
import { NgbModule, NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { CheckboxModule } from 'primeng/checkbox';
import { DropdownModule } from 'primeng/dropdown';
import { MultiSelectModule } from 'primeng/multiselect';
import { TableModule } from 'primeng/table';
import { MapAgencyComponent } from '../user-management/map-agency/map-agency.component';
import { AddAgencyComponent } from './add-agency/add-agency.component';
import { AgencyManagementComponent } from './agency-management/agency-management.component';
import { RoleGuard } from '../auth/role.guard';

const agencyAccessRoles = ["1", "2", "3", "4"]
const routes: Routes = [
  { path: 'add-agency',  data: {authRole: agencyAccessRoles}, canActivate: [RoleGuard], component: AddAgencyComponent },
  { path: 'agency-mangement',  data: {authRole: agencyAccessRoles}, canActivate: [RoleGuard], component: AgencyManagementComponent },
  {path: 'map-agency',  data: {authRole: agencyAccessRoles}, canActivate: [RoleGuard], component: MapAgencyComponent},
]

@NgModule({
  declarations: [
    AddAgencyComponent,
    AgencyManagementComponent,
    MapAgencyComponent
  ],
  imports: [
    CommonModule,
    DropdownModule,
    NgbModule,
    NgbNavModule,
    FormsModule,
    TableModule,
    CheckboxModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
    AutoCompleteModule,
    MultiSelectModule
  ],
})
export class AgencyManagementModule { }
