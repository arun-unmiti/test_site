import 'zone.js/bundles/zone-testing-bundle.umd.js';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModule, NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MessageService } from 'primeng/api';
import { UserDetailService } from '../../auth/user-detail.service';

import { EditComponentComponent } from './edit-component.component';

// Mock Services
class MockUserDetailService {
  getcsrfTokenName = jest.fn(() => 'mock_csrf_name');
  getcsrfToken = jest.fn(() => 'mock_csrf_token');
}

class MockNgbModal {
  open = jest.fn().mockReturnValue({
    result: Promise.resolve('Save click'),
  });
}

class MockMessageService {}

describe('EditComponentComponent', () => {
  let component: EditComponentComponent;
  let fixture: ComponentFixture<EditComponentComponent>;
  let userService: any;
  let modalService: any;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EditComponentComponent],
      imports: [NgbModule, HttpClientTestingModule, FormsModule, ReactiveFormsModule],
      providers: [
        { provide: MessageService, useClass: MockMessageService },
        { provide: UserDetailService, useClass: MockUserDetailService },
        { provide: NgbModal, useClass: MockNgbModal },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(EditComponentComponent);
    component = fixture.componentInstance;
    userService = TestBed.inject(UserDetailService);
    modalService = TestBed.inject(NgbModal);
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should set csrfTokenName and csrfToken', () => {
      component.ngOnInit();
      expect(component.csrfTokenName).toBe('mock_csrf_name');
      expect(component.csrfToken).toBe('mock_csrf_token');
      expect(userService.getcsrfTokenName).toHaveBeenCalled();
      expect(userService.getcsrfToken).toHaveBeenCalled();
    });
  });

  describe('open', () => {
    it('should open modal and set closeResult on success', async () => {
      const content = 'mock_content';
      modalService.open.mockReturnValue({
        result: Promise.resolve('Save click'),
      });
      component.open(content);
      expect(modalService.open).toHaveBeenCalledWith(content, { ariaLabelledBy: 'modal-basic-title' });
      await modalService.open.mock.calls[0][0].result;
      expect(component.closeResult).toBe('Closed with: Save click');
    });

    it('should open modal and set closeResult on dismiss', async () => {
      const content = 'mock_content';
      modalService.open.mockReturnValue({
        result: Promise.reject(ModalDismissReasons.ESC),
      });
      component.open(content);
      expect(modalService.open).toHaveBeenCalledWith(content, { ariaLabelledBy: 'modal-basic-title' });
      try {
        await modalService.open.mock.calls[0][0].result;
      } catch (e) {
        // ignored
      }
      expect(component.closeResult).toBe('Dismissed by pressing ESC');
    });
  });

  describe('getDismissReason', () => {
    it('should return reason for ESC', () => {
      const reason = component['getDismissReason'](ModalDismissReasons.ESC);
      expect(reason).toBe('by pressing ESC');
    });

    it('should return reason for BACKDROP_CLICK', () => {
      const reason = component['getDismissReason'](ModalDismissReasons.BACKDROP_CLICK);
      expect(reason).toBe('by clicking on a backdrop');
    });

    it('should return reason for other', () => {
      const reason = component['getDismissReason']('custom');
      expect(reason).toBe('with: custom');
    });
  });
});