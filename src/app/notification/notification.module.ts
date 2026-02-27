import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationsComponent } from './notifications/notifications.component';
import { RouterModule, Routes } from '@angular/router';
import { MultiSelectModule } from 'primeng/multiselect';
import { FormsModule } from '@angular/forms';
import { CascadeSelectModule } from 'primeng/cascadeselect';
import { InputTextareaModule } from 'primeng/inputtextarea';

const routes: Routes = [
  {path:'', component:NotificationsComponent}
]

@NgModule({
  declarations: [
    NotificationsComponent
  ],
  imports: [
    CommonModule,
    MultiSelectModule,
    FormsModule,
    InputTextareaModule,
    CascadeSelectModule,
    RouterModule.forChild(routes)
  ]
})
export class NotificationModule { }
