import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl } from '@angular/forms';
import * as moment from 'moment';

import { YearSeasonProfileComponent } from './year-season-profile.component';

// ✅ Mock NgbModal
const mockNgbModal = {
  open: jest.fn(() => ({ closed: { subscribe: jest.fn() } })),
  dismissAll: jest.fn(),
};

describe('YearSeasonProfileComponent', () => {
  let component: YearSeasonProfileComponent;
  let fixture: ComponentFixture<YearSeasonProfileComponent>;
  let modalService: any;
  let formBuilder: FormBuilder;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [YearSeasonProfileComponent],
      imports: [FormsModule, ReactiveFormsModule, NgbModule, CommonModule],
      providers: [
        FormBuilder,
        { provide: NgbModal, useValue: mockNgbModal },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(YearSeasonProfileComponent);
    component = fixture.componentInstance;
    modalService = TestBed.inject(NgbModal);
    formBuilder = TestBed.inject(FormBuilder);
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should call setMapData', () => {
      const setMapDataSpy = jest.spyOn(component, 'setMapData');
      component.ngOnInit();
      expect(setMapDataSpy).toHaveBeenCalled();
    });
  });

  describe('changeTab', () => {
    it('should set activeTab', () => {
      component.changeTab(2);
      expect(component.activeTab).toBe(2);
    });
  });

  describe('openDashboardEditPopUp', () => {
    it('should initialize form and open modal', () => {
      const formData = { survey: 1, year: 1, season: 1, fromDate: new Date(), toDate: new Date() };
      const initDashboardFormSpy = jest.spyOn(component, 'initDashboardForm');
      component.openDashboardEditPopUp(formData);
      expect(initDashboardFormSpy).toHaveBeenCalledWith(formData);
      expect(component.isDashboardpopupOpened).toBe(true);
      expect(modalService.open).toHaveBeenCalled();
    });
  });

  describe('initDashboardForm', () => {
    it('should initialize dashboardForm with formData', () => {
      const formData = { survey: 1, year: 1, season: 1, fromDate: new Date(), toDate: new Date() };
      component.initDashboardForm(formData);
      expect(component.dashboardForm.value.survey).toBe(1);
      expect(component.dashboardForm.value.year).toBe(1);
      expect(component.dashboardForm.value.season).toBe(1);
    });
  });

  describe('updateDashboardDefaults', () => {
    it('should do nothing if form invalid', () => {
      component.dashboardForm = { valid: false } as any;
      expect(component.updateDashboardDefaults()).toBeUndefined();
    });

    it('should handle valid form', () => {
      component.dashboardForm = { valid: true } as any;
      expect(component.updateDashboardDefaults()).toBeUndefined();
    });
  });

  describe('dashboardToDateValidator', () => {
    beforeEach(() => {
      component.dashboardForm = formBuilder.group({
        fromDate: ['2023-01-01'],
        toDate: ['']
      });
    });

    it('should return null if valid', () => {
      const control = new FormControl('2023-01-02');
      expect(component.dashboardToDateValidator(control)).toBeNull();
    });

    it('should return error if invalid', () => {
      const control = new FormControl('2022-12-31');
      expect(component.dashboardToDateValidator(control)).toEqual({ dateRangeError: true });
    });
  });

  describe('dashboardFromDateValidator', () => {
    beforeEach(() => {
      component.dashboardForm = formBuilder.group({
        fromDate: [''],
        toDate: ['2023-01-02']
      });
    });

    it('should return null if valid', () => {
      const control = new FormControl('2023-01-01');
      expect(component.dashboardFromDateValidator(control)).toBeNull();
    });

    it('should return error if invalid', () => {
      const control = new FormControl('2023-01-03');
      expect(component.dashboardFromDateValidator(control)).toEqual({ dateRangeError: true });
    });
  });

  describe('dashFormObj', () => {
    it('should return form control', () => {
      component.dashboardForm = { get: jest.fn().mockReturnValue({}) } as any;
      expect(component.dashFormObj('field')).toEqual({});
    });
  });

  describe('ngOnDestroy', () => {
    it('should call dismissAll', () => {
      component.ngOnDestroy();
      expect(modalService.dismissAll).toHaveBeenCalled();
    });
  });
});