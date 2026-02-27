import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserManagementComponent } from './user-management/user-management.component';
import { DropdownModule } from "primeng/dropdown";
import { NgbModule, NgbNav, NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { AddusersComponent } from './addusers/addusers.component';
import { UserMapComponent } from './user-map/user-map.component';
import { EditComponentComponent } from './edit-component/edit-component.component';
import { AutoCompleteModule } from "primeng/autocomplete";
import { SearchPipe } from '../search.pipe';
import {MultiSelectModule} from 'primeng/multiselect';
import { TableModule } from 'primeng/table';
import { CheckboxModule } from 'primeng/checkbox';
import { LiveUsersComponent } from './live-users/live-users.component';
import { RoleGuard } from '../auth/role.guard';
import { LoaderModule } from '../utilities/loader/loader.module';

const allRoles = ['1', '2', '3', '4', '5', '6', '7', '8']
const routes: Routes = [
  { path: 'user-mangement', data: {authRole: allRoles, authAgencyScreen: 'user_management'}, canActivate: [RoleGuard], component: UserManagementComponent },
  { path: 'add-user', data: {authRole: allRoles, authAgencyScreen: 'user_management'}, canActivate: [RoleGuard], component: AddusersComponent },
  { path: 'map', data: {authRole: allRoles, authAgencyScreen: 'user_management'}, canActivate: [RoleGuard], component: UserMapComponent },
  {path: 'live-users', data: {authRole: ['1','2']}, canActivate: [RoleGuard], component: LiveUsersComponent},
]



@NgModule({
  declarations: [
    UserManagementComponent,
    AddusersComponent,
    UserMapComponent,
    EditComponentComponent,
    SearchPipe,
    LiveUsersComponent,
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
    LoaderModule,
    RouterModule.forChild(routes),
    AutoCompleteModule,
    MultiSelectModule
  ],
  providers: [RoleGuard],
  exports: [SearchPipe]
})
export class UserManagementModule { }
