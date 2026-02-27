import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { NO_ERRORS_SCHEMA } from '@angular/core';

import { PaginationComponent } from './pagination.component';

describe('PaginationComponent', () => {
  let component: PaginationComponent;
  let fixture: ComponentFixture<PaginationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormsModule],
      declarations: [PaginationComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(PaginationComponent);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should be empty', () => {
      expect(component.ngOnInit()).toBeUndefined();
    });
  });

  describe('triggerPagination', () => {
    it('should emit pageTrigger with page_no and records_per_page', () => {
      const emitSpy = jest.spyOn(component.pageTrigger, 'emit');
      component.currentpage = 2;
      component.recordsPerPage = 10;
      component.triggerPagination();
      expect(emitSpy).toHaveBeenCalledWith({ page_no: 2, records_per_page: 10 });
    });
  });

  describe('updatePagination', () => {
    it('should calculate numberOfPages and set button states', () => {
      component.toalRecord = 25;
      component.recordsPerPage = 10;
      component.currentpage = 2;
      component.updatePagination();
      expect(component.numberOfPages).toEqual([1, 2, 3]);
      expect(component.isFirstButton).toBe(false);
      expect(component.isPreviousButton).toBe(false);
      expect(component.isNextButton).toBe(false);
      expect(component.isLastButton).toBe(false);
    });

    it('should disable first and previous if on first page', () => {
      component.toalRecord = 25;
      component.recordsPerPage = 10;
      component.currentpage = 1;
      component.updatePagination();
      expect(component.isFirstButton).toBe(true);
      expect(component.isPreviousButton).toBe(true);
    });

    it('should disable next and last if on last page', () => {
      component.toalRecord = 25;
      component.recordsPerPage = 10;
      component.currentpage = 3;
      component.updatePagination();
      expect(component.isNextButton).toBe(true);
      expect(component.isLastButton).toBe(true);
    });

    it('should handle 0 total records', () => {
      component.toalRecord = 0;
      component.recordsPerPage = 10;
      component.currentpage = 1;
      component.updatePagination();
      expect(component.numberOfPages).toEqual([1]);
    });
  });

  describe('onFirstClick', () => {
    it('should set currentpage to 1 and trigger pagination', () => {
      const triggerSpy = jest.spyOn(component, 'triggerPagination');
      component.onFirstClick();
      expect(component.currentpage).toBe(1);
      expect(triggerSpy).toHaveBeenCalled();
    });
  });

  describe('onPreviousClick', () => {
    it('should decrement currentpage and trigger pagination', () => {
      component.currentpage = 3;
      const triggerSpy = jest.spyOn(component, 'triggerPagination');
      component.onPreviousClick();
      expect(component.currentpage).toBe(2);
      expect(triggerSpy).toHaveBeenCalled();
    });
  });

  describe('onNextClick', () => {
    it('should increment currentpage and trigger pagination', () => {
      component.currentpage = 1;
      const triggerSpy = jest.spyOn(component, 'triggerPagination');
      component.onNextClick();
      expect(component.currentpage).toBe(2);
      expect(triggerSpy).toHaveBeenCalled();
    });
  });

  describe('onLastClick', () => {
    it('should set currentpage to last page and trigger pagination', () => {
      component.numberOfPages = [1, 2, 3];
      const triggerSpy = jest.spyOn(component, 'triggerPagination');
      component.onLastClick();
      expect(component.currentpage).toBe(3);
      expect(triggerSpy).toHaveBeenCalled();
    });
  });

  describe('onPageChange', () => {
    it('should trigger pagination', () => {
      const triggerSpy = jest.spyOn(component, 'triggerPagination');
      component.onPageChange();
      expect(triggerSpy).toHaveBeenCalled();
    });
  });

  describe('onPerRecordChange', () => {
    it('should reset currentpage to 1 and trigger pagination', () => {
      component.currentpage = 5;
      const triggerSpy = jest.spyOn(component, 'triggerPagination');
      component.onPerRecordChange();
      expect(component.currentpage).toBe(1);
      expect(triggerSpy).toHaveBeenCalled();
    });
  });
});