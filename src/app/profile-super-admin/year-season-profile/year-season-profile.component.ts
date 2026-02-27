import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import * as moment from 'moment';

@Component({
  selector: 'app-year-season-profile',
  templateUrl: './year-season-profile.component.html',
  styleUrls: ['./year-season-profile.component.css']
})
export class YearSeasonProfileComponent implements OnInit, OnDestroy {

  @ViewChild("editModal") editModal: any;
  activeTab = 1;
  isDashboardpopupOpened = false;
  isEmailpopupOpened = false;
  @Input() dashboardData: any[] = [];
  @Input() emailData: any[] = [];

  @Input() seasons: any[] = [];
  @Input() years: any[] = [];
  @Input() surveys: any[] = [];

  yearMap: any = {};
  seasonMap: any = {};
  surveyMap: any = {};

  dashboardForm!: FormGroup;

  constructor(private modalService: NgbModal, private formBuilder: FormBuilder) { 
    
  }

  ngOnInit(): void {
    this.setMapData();
  }

  setMapData() {
    for (let i = 0; i < this.years.length; i++) {
      const data = this.years[i];
      this.yearMap[data.id] = data.year
    }
    for (let i = 0; i < this.seasons.length; i++) {
      const data = this.seasons[i];
      this.seasonMap[data.id] = data.season
    }
    for (let i = 0; i < this.surveys.length; i++) {
      const data = this.surveys[i];
      this.surveyMap[data.id] = data.name
    }
  }

  changeTab(active:number) {
    this.activeTab = active;
  }

  openDashboardEditPopUp(formData: any) {
    this.initDashboardForm(formData)
    this.isDashboardpopupOpened = true;
    this.modalService.open(this.editModal, { centered: true, animation: true, keyboard: false, backdrop: 'static',  }).closed.subscribe(() => {
      this.isDashboardpopupOpened = false;
    });
  }

  initDashboardForm(formData: any) {
    this.dashboardForm = this.formBuilder.group({
      purpose: ["update-dashboard-default"],
      survey: [formData.survey, Validators.required],
      year: [formData.year, Validators.required],
      season: [formData.season, Validators.required],
      fromDate: [moment(formData.fromDate).format('YYYY-MM-DD'), [Validators.required, this.dashboardFromDateValidator]],
      toDate: [moment(formData.toDate).format('YYYY-MM-DD'), this.dashboardToDateValidator],
    });
    this.dashboardForm.get('fromDate')?.valueChanges.subscribe(() => {
      this.dashboardForm.get('toDate')?.updateValueAndValidity({emitEvent: false});
    })
    this.dashboardForm.get('toDate')?.valueChanges.subscribe(() => {
      this.dashboardForm.get('fromDate')?.updateValueAndValidity({emitEvent: false});
    })
  }

  updateDashboardDefaults() {
    if (this.dashboardForm.valid) {

    }
    
  }

  dashboardToDateValidator = (control: AbstractControl) => {
    if (control.value && this.dashboardForm?.get('fromDate')?.value && moment(control.value).isBefore(this.dashboardForm.get('fromDate')?.value)) {
        return {dateRangeError: true}
    }
    return null;
  }

  dashboardFromDateValidator = (control: AbstractControl) => {
    if (control.value && this.dashboardForm?.get('toDate')?.value && moment(control.value).isAfter(this.dashboardForm.get('toDate')?.value)) {
        return {dateRangeError: true}
    }
    return null;
  }

  dashFormObj(field: string): AbstractControl  | null {
    return this.dashboardForm.get(field);
  }

  ngOnDestroy(): void {
    this.modalService.dismissAll();
  }

}
