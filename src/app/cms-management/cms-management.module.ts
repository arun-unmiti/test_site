// src/app/cms-management/cms-management.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CmsManagementRoutingModule } from './cms-management-routing.module';
import { CmsManagementComponent } from './cms-management.component';
import { FeatureToggleService } from '../shared/services/feature-toggle.service';

@NgModule({
  declarations: [CmsManagementComponent],
  imports: [CommonModule, CmsManagementRoutingModule],
})
export class CmsManagementModule {
  constructor(private featureToggle: FeatureToggleService) { }
}