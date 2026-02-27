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
import { AddClientComponent } from './add-client/add-client.component';
import { ClientManagementComponent } from './client-management/client-management.component';
import { MapClientComponent } from './map-client/map-client.component';
import { RoleGuard } from '../auth/role.guard';
import { FeatureToggleService } from '../shared/services/feature-toggle.service';
import { environment, ProjectContext } from "../../environments/environment";

const clientAccessRole = ["1", "2"];

const routes: Routes = [
{ path: 'client-mangement', data: {authRole: clientAccessRole}, canActivate: [RoleGuard], component: ClientManagementComponent },
{path: 'map-client', data: {authRole: clientAccessRole}, canActivate: [RoleGuard], component: MapClientComponent},
]

@NgModule({
  declarations: [
    AddClientComponent,
    ClientManagementComponent,
    MapClientComponent
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
  ]
})
export class ClientManagementModule {
  constructor(featureToggle: FeatureToggleService) {
    const projectContext = featureToggle.getContext() as ProjectContext;
    if (projectContext === 'munichre') {
      routes.push({
        path: 'add-client',
        data: { authRole: clientAccessRole },
        canActivate: [RoleGuard],
        component: AddClientComponent
      });
    }
  }
 }
