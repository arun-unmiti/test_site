// src/app/cms-management/cms-management-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CmsManagementComponent } from './cms-management.component';
import { ModuleGuard } from '../auth/module.guard';
import { RoleGuard } from '../auth/role.guard';

const allRoles = ['1', '2', '3', '4', '5', '6', '7', '8'];
const routes: Routes = [
  { path: 'workshop/create', data: { authRole: allRoles, authAgencyScreen: 'workshop', module: 'cms-management' }, canActivate: [RoleGuard, ModuleGuard], component: CmsManagementComponent },
  // Other CMS routes moved to app-routing.module.ts for consistency
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CmsManagementRoutingModule {}