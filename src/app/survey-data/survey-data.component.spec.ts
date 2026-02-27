import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { NO_ERRORS_SCHEMA } from '@angular/core';

import { SurveyDataComponent } from './survey-data.component';
import { UserDetailService } from '../auth/user-detail.service';

describe('SurveyDataComponent', () => {
  let component: SurveyDataComponent;
  let fixture: ComponentFixture<SurveyDataComponent>;
  let router: Router;
  let userService: any;

  const mockUser = { user_role: '1' };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      declarations: [SurveyDataComponent],
      providers: [
        {
          provide: UserDetailService,
          useValue: { getUserDetail: jest.fn(() => mockUser) }
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(SurveyDataComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    userService = TestBed.inject(UserDetailService);
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  describe('Route Configuration - initalizeValues()', () => {

    it('should load correct config for /chm/pending', () => {
      Object.defineProperty(router, 'url', { get: () => '/chm/pending' });
      component = TestBed.createComponent(SurveyDataComponent).componentInstance;

      expect(component.title).toBe('Pending Crop Health Monitoring');
      expect(component.surveyId).toBe('1');
      expect(component.canApprove).toBe(true);
      expect(component.canReject).toBe(true);
      expect(component.canPending).toBe(false);
      expect(component.showCrop).toBe(true);
      expect(component.showDateType).toBe(false);
    });

    it('should load correct config for /chm/approved', () => {
      Object.defineProperty(router, 'url', { get: () => '/chm/approved' });
      component = TestBed.createComponent(SurveyDataComponent).componentInstance;

      expect(component.title).toBe('Approved Crop Health Monitoring');
      expect(component.canApprove).toBe(false);
      expect(component.canReject).toBe(false);
      expect(component.canPending).toBe(false);
      expect(component.showDateType).toBe(true);
    });

    it('should load correct config for /cls/approved (role-based reject/pending)', () => {
      Object.defineProperty(router, 'url', { get: () => '/cls/approved' });
      component = TestBed.createComponent(SurveyDataComponent).componentInstance;

      expect(component.title).toBe('Approved Crop Loss Survey');
      expect(component.canApprove).toBe(false);
      expect(component.canReject).toBe(true);   // since role = 1
      expect(component.canPending).toBe(true);
    });

    it('should load correct config for /revisit-chm/approved', () => {
      Object.defineProperty(router, 'url', { get: () => '/revisit-chm/approved' });
      component = TestBed.createComponent(SurveyDataComponent).componentInstance;

      expect(component.surveyName).toBe('Revisit CHM');
      expect(component.surveyId).toBe('4');
      expect(component.parentSurveyId).toBe(1);
    });

    it('should load correct config for /cce/draft', () => {
      Object.defineProperty(router, 'url', { get: () => '/cce/draft' });
      component = TestBed.createComponent(SurveyDataComponent).componentInstance;

      expect(component.title).toBe('Surveyor Draft data (Crop Cutting Experiment)');
      expect(component.surveyStatus).toBe(0);
      expect(component.canViewData).toBe(false);
      expect(component.showInactiveUser).toBe(true);
    });

    it('should load correct config for /multipicking/pending', () => {
      Object.defineProperty(router, 'url', { get: () => '/multipicking/pending' });
      component = TestBed.createComponent(SurveyDataComponent).componentInstance;

      expect(component.surveyId).toBe('7');
      expect(component.parentSurveyId).toBe(3);
      expect(component.canApprove).toBe(true);
    });
  });

  describe('setSurveyDetails()', () => {
    it('should correctly assign all properties from param object', () => {
      const param = {
        title: "Test Title",
        surveyName: "Test Survey",
        dataPurpose: "get_test",
        searchPurpose: "search_test",
        surveyId: "99",
        canApprove: true,
        canReject: false,
        canPending: true,
        parentSurveyId: 5,
        showApproveColumn: true,
        excelDownloadPurpose: "get_excel",
        showDateType: true,
        showCrop: false,
        showInactiveUser: true,
        surveyStatus: 1,
        canViewData: true
      };

      component.setSurveyDetails(param);

      expect(component.title).toBe("Test Title");
      expect(component.surveyId).toBe("99");
      expect(component.canApprove).toBe(true);
      expect(component.canReject).toBe(false);
      expect(component.parentSurveyId).toBe(5);
      expect(component.showCrop).toBe(false);
    });
  });

  describe('User Role Handling', () => {
    it('should set canReject & canPending = false for role 5 in approved routes', () => {
      userService.getUserDetail.mockReturnValue({ user_role: '5' });
      Object.defineProperty(router, 'url', { get: () => '/cls/approved' });

      component = TestBed.createComponent(SurveyDataComponent).componentInstance;

      expect(component.canReject).toBe(false);
      expect(component.canPending).toBe(false);
    });
  });
});