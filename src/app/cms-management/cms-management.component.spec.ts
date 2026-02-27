import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Router } from '@angular/router';

import { CmsManagementComponent } from './cms-management.component';
import { UserDetailService } from '../auth/user-detail.service';

// Mock services
class MockUserDetailService {
  getUserDetail = jest.fn().mockReturnValue({ user_role: '1' });
}

describe('CmsManagementComponent', () => {
  let component: CmsManagementComponent;
  let fixture: ComponentFixture<CmsManagementComponent>;
  let mockRouter: any;
  let mockUserDetailService: any;

  beforeEach(async () => {
    mockRouter = {
      url: '/workshop/create'
    };

    mockUserDetailService = new MockUserDetailService();

    await TestBed.configureTestingModule({
      declarations: [CmsManagementComponent],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: UserDetailService, useValue: mockUserDetailService }
      ],
      schemas: [NO_ERRORS_SCHEMA] // ignores unknown elements, bindings
    }).compileComponents();

    fixture = TestBed.createComponent(CmsManagementComponent);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  describe('constructor', () => {
    it('should set user from userDetailService', () => {
      expect(component.user).toEqual({ user_role: '1' });
    });
  });

  describe('initalizeValues', () => {
    const testCases = [
      { url: '/workshop/create', expected: { url_id: '1', title: 'Create Workshop Data', surveyName: 'Workshop Management', dataPurpose: '', searchPurpose: 'search_pending_surveydata', surveyId: '8', canApprove: true, canReject: true, canPending: false, parentSurveyId: null, showApproveColumn: false, excelDownloadPurpose: 'get_pending_exceldata', showDateType: false, showCrop: true, showInactiveUser: false, surveyStatus: 1, canViewData: true } },
      { url: '/workshop/pending', expected: { url_id: '2', title: 'Pending Workshop Data', surveyName: 'Workshop Management', dataPurpose: 'get_pending_surveydata', searchPurpose: 'search_pending_surveydata', surveyId: '8', canApprove: true, canReject: true, canPending: false, parentSurveyId: null, showApproveColumn: false, excelDownloadPurpose: 'get_pending_exceldata', showDateType: false, showCrop: true, showInactiveUser: false, surveyStatus: 1, canViewData: true } },
      { url: '/workshop/approved', expected: { url_id: '3', title: 'Approved Workshop Data', surveyName: 'Workshop Management', dataPurpose: 'get_approved_surveydata', searchPurpose: 'search_approved_surveydata', surveyId: '8', canApprove: false, canReject: true, canPending: true, parentSurveyId: null, showApproveColumn: false, excelDownloadPurpose: 'get_approved_exceldata', showDateType: true, showCrop: true, showInactiveUser: false, surveyStatus: 1, canViewData: true } },
      { url: '/workshop/rejected', expected: { url_id: '4', title: 'Rejected Workshop Data', surveyName: 'Workshop Management', dataPurpose: 'get_rejected_surveydata', searchPurpose: 'search_rejected_surveydata', surveyId: '8', canApprove: true, canReject: false, canPending: true, parentSurveyId: null, showApproveColumn: false, excelDownloadPurpose: 'get_rejected_exceldata', showDateType: true, showCrop: true, showInactiveUser: false, surveyStatus: 1, canViewData: true } },
      { url: '/workshop/alldata', expected: { url_id: '5', title: 'All Workshop data', surveyName: 'Workshop Management', dataPurpose: 'get_consolidated_surveydata', searchPurpose: 'search_consolidated_surveydata', surveyId: '8', canApprove: false, canReject: false, canPending: false, parentSurveyId: null, showApproveColumn: true, excelDownloadPurpose: 'get_consolidated_exceldata', showDateType: true, showCrop: true, showInactiveUser: false, surveyStatus: 1, canViewData: true } },
      { url: '/infra/create', expected: { url_id: '6', title: 'Create Infrastructure Data', surveyName: 'Infra Management', dataPurpose: '', searchPurpose: 'search_pending_surveydata', surveyId: '9', canApprove: true, canReject: true, canPending: false, parentSurveyId: null, showApproveColumn: false, excelDownloadPurpose: 'get_pending_exceldata', showDateType: false, showCrop: true, showInactiveUser: false, surveyStatus: 1, canViewData: true } },
      { url: '/infra/pending', expected: { url_id: '7', title: 'Pending Infrastructure data', surveyName: 'Infra Management', dataPurpose: 'get_pending_surveydata', searchPurpose: 'search_pending_surveydata', surveyId: '9', canApprove: true, canReject: true, canPending: false, parentSurveyId: null, showApproveColumn: false, excelDownloadPurpose: 'get_pending_exceldata', showDateType: false, showCrop: true, showInactiveUser: false, surveyStatus: 1, canViewData: true } },
      { url: '/infra/approved', expected: { url_id: '8', title: 'Approved Infrastructure data', surveyName: 'Infra Management', dataPurpose: 'get_approved_surveydata', searchPurpose: 'search_approved_surveydata', surveyId: '9', canApprove: false, canReject: true, canPending: true, parentSurveyId: null, showApproveColumn: false, excelDownloadPurpose: 'get_approved_exceldata', showDateType: true, showCrop: true, showInactiveUser: false, surveyStatus: 1, canViewData: true } },
      { url: '/infra/rejected', expected: { url_id: '9', title: 'Rejected Infrastructure data', surveyName: 'Infra Management', dataPurpose: 'get_rejected_surveydata', searchPurpose: 'search_rejected_surveydata', surveyId: '9', canApprove: true, canReject: false, canPending: true, parentSurveyId: null, showApproveColumn: false, excelDownloadPurpose: 'get_rejected_exceldata', showDateType: true, showCrop: true, showInactiveUser: false, surveyStatus: 1, canViewData: true } },
      { url: '/infra/alldata', expected: { url_id: '10', title: 'All Infrastructure data', surveyName: 'Infra Management', dataPurpose: 'get_consolidated_surveydata', searchPurpose: 'search_consolidated_surveydata', surveyId: '9', canApprove: false, canReject: false, canPending: false, parentSurveyId: null, showApproveColumn: true, excelDownloadPurpose: 'get_consolidated_exceldata', showDateType: true, showCrop: true, showInactiveUser: false, surveyStatus: 1, canViewData: true } },
      { url: '/gro/create', expected: { url_id: '11', title: 'Create GRO', surveyName: 'GRO Management', dataPurpose: '', searchPurpose: 'search_pending_surveydata', surveyId: '10', canApprove: true, canReject: true, canPending: false, parentSurveyId: null, showApproveColumn: false, excelDownloadPurpose: 'get_pending_exceldata', showDateType: false, showCrop: true, showInactiveUser: false, surveyStatus: 1, canViewData: true } },
      { url: '/gro/pending', expected: { url_id: '12', title: 'Pending GRO data', surveyName: 'GRO Management', dataPurpose: 'get_pending_surveydata', searchPurpose: 'search_pending_surveydata', surveyId: '10', canApprove: true, canReject: true, canPending: false, parentSurveyId: null, showApproveColumn: false, excelDownloadPurpose: 'get_pending_exceldata', showDateType: false, showCrop: true, showInactiveUser: false, surveyStatus: 1, canViewData: true } },
      { url: '/gro/approved', expected: { url_id: '13', title: 'Approved GRO data', surveyName: 'GRO Management', dataPurpose: 'get_approved_surveydata', searchPurpose: 'search_approved_surveydata', surveyId: '10', canApprove: false, canReject: true, canPending: true, parentSurveyId: null, showApproveColumn: false, excelDownloadPurpose: 'get_approved_exceldata', showDateType: true, showCrop: true, showInactiveUser: false, surveyStatus: 1, canViewData: true } },
      { url: '/gro/rejected', expected: { url_id: '14', title: 'Rejected GRO data', surveyName: 'GRO Management', dataPurpose: 'get_rejected_surveydata', searchPurpose: 'search_rejected_surveydata', surveyId: '10', canApprove: true, canReject: false, canPending: true, parentSurveyId: null, showApproveColumn: false, excelDownloadPurpose: 'get_rejected_exceldata', showDateType: true, showCrop: true, showInactiveUser: false, surveyStatus: 1, canViewData: true } },
      { url: '/gro/alldata', expected: { url_id: '15', title: 'All GRO data', surveyName: 'GRO Management', dataPurpose: 'get_consolidated_surveydata', searchPurpose: 'search_consolidated_surveydata', surveyId: '10', canApprove: false, canReject: false, canPending: false, parentSurveyId: null, showApproveColumn: true, excelDownloadPurpose: 'get_consolidated_exceldata', showDateType: true, showCrop: true, showInactiveUser: false, surveyStatus: 1, canViewData: true } },
      { url: '/manpower/create', expected: { url_id: '16', title: 'Create Manpower', surveyName: 'Manpower Management', dataPurpose: '', searchPurpose: 'search_pending_surveydata', surveyId: '11', canApprove: true, canReject: true, canPending: false, parentSurveyId: null, showApproveColumn: false, excelDownloadPurpose: 'get_pending_exceldata', showDateType: false, showCrop: true, showInactiveUser: false, surveyStatus: 1, canViewData: true } },
      { url: '/manpower/pending', expected: { url_id: '17', title: 'Pending Manpower data', surveyName: 'Manpower Management', dataPurpose: 'get_pending_surveydata', searchPurpose: 'search_pending_surveydata', surveyId: '11', canApprove: true, canReject: true, canPending: false, parentSurveyId: null, showApproveColumn: false, excelDownloadPurpose: 'get_pending_exceldata', showDateType: false, showCrop: true, showInactiveUser: false, surveyStatus: 1, canViewData: true } },
      { url: '/manpower/approved', expected: { url_id: '18', title: 'Approved Manpower data', surveyName: 'Manpower Management', dataPurpose: 'get_approved_surveydata', searchPurpose: 'search_approved_surveydata', surveyId: '11', canApprove: false, canReject: true, canPending: true, parentSurveyId: null, showApproveColumn: false, excelDownloadPurpose: 'get_approved_exceldata', showDateType: true, showCrop: true, showInactiveUser: false, surveyStatus: 1, canViewData: true } },
      { url: '/manpower/rejected', expected: { url_id: '19', title: 'Rejected Manpower data', surveyName: 'Manpower Management', dataPurpose: 'get_rejected_surveydata', searchPurpose: 'search_rejected_surveydata', surveyId: '11', canApprove: true, canReject: false, canPending: true, parentSurveyId: null, showApproveColumn: false, excelDownloadPurpose: 'get_rejected_exceldata', showDateType: true, showCrop: true, showInactiveUser: false, surveyStatus: 1, canViewData: true } },
      { url: '/manpower/alldata', expected: { url_id: '20', title: 'All Manpower data', surveyName: 'Manpower Management', dataPurpose: 'get_consolidated_surveydata', searchPurpose: 'search_consolidated_surveydata', surveyId: '11', canApprove: false, canReject: false, canPending: false, parentSurveyId: null, showApproveColumn: true, excelDownloadPurpose: 'get_consolidated_exceldata', showDateType: true, showCrop: true, showInactiveUser: false, surveyStatus: 1, canViewData: true } },
      { url: '/farmer/upload', expected: { url_id: '21', title: 'Upload Insured Verification data', surveyName: 'Insured Verification', dataPurpose: '', searchPurpose: 'search_pending_surveydata', surveyId: '12', canApprove: true, canReject: true, canPending: false, parentSurveyId: null, showApproveColumn: false, excelDownloadPurpose: 'get_pending_exceldata', showDateType: false, showCrop: true, showInactiveUser: false, surveyStatus: 1, canViewData: true } },
      { url: '/farmer/view', expected: { url_id: '22', title: 'View Insured Verification data', surveyName: 'Insured Verification', dataPurpose: 'get_view_farmer_data', searchPurpose: 'search_view_surveydata', surveyId: '12', canApprove: true, canReject: true, canPending: false, parentSurveyId: null, showApproveColumn: false, excelDownloadPurpose: 'get_view_exceldata', showDateType: false, showCrop: true, showInactiveUser: false, surveyStatus: 1, canViewData: true } },
      { url: '/farmer/pending', expected: { url_id: '23', title: 'Pending Insured Verification data', surveyName: 'Insured Verification', dataPurpose: 'get_pending_surveydata', searchPurpose: 'search_pending_surveydata', surveyId: '12', canApprove: true, canReject: true, canPending: false, parentSurveyId: null, showApproveColumn: false, excelDownloadPurpose: 'get_pending_exceldata', showDateType: false, showCrop: true, showInactiveUser: false, surveyStatus: 1, canViewData: true } },
      { url: '/farmer/approved', expected: { url_id: '24', title: 'Approved Insured Verification data', surveyName: 'Insured Verification', dataPurpose: 'get_approved_surveydata', searchPurpose: 'search_approved_surveydata', surveyId: '12', canApprove: false, canReject: true, canPending: true, parentSurveyId: null, showApproveColumn: false, excelDownloadPurpose: 'get_approved_exceldata', showDateType: true, showCrop: true, showInactiveUser: false, surveyStatus: 1, canViewData: true } },
      { url: '/farmer/rejected', expected: { url_id: '25', title: 'Rejected Insured Verification data', surveyName: 'Insured Verification', dataPurpose: 'get_rejected_surveydata', searchPurpose: 'search_rejected_surveydata', surveyId: '12', canApprove: true, canReject: false, canPending: true, parentSurveyId: null, showApproveColumn: false, excelDownloadPurpose: 'get_rejected_exceldata', showDateType: true, showCrop: true, showInactiveUser: false, surveyStatus: 1, canViewData: true } },
      { url: '/farmer/alldata', expected: { url_id: '26', title: 'All Insured Verification data', surveyName: 'Insured Verification', dataPurpose: 'get_consolidated_surveydata', searchPurpose: 'search_consolidated_surveydata', surveyId: '12', canApprove: false, canReject: false, canPending: false, parentSurveyId: null, showApproveColumn: true, excelDownloadPurpose: 'get_consolidated_exceldata', showDateType: true, showCrop: true, showInactiveUser: false, surveyStatus: 1, canViewData: true } },
      { url: '/beneficiaryFarmer/pending', expected: { url_id: '27', title: 'Pending Beneficiary data', surveyName: 'Beneficiary Verification', dataPurpose: 'get_pending_surveydata', searchPurpose: 'search_pending_surveydata', surveyId: '14', canApprove: true, canReject: true, canPending: false, parentSurveyId: null, showApproveColumn: false, excelDownloadPurpose: 'get_pending_exceldata', showDateType: false, showCrop: true, showInactiveUser: false, surveyStatus: 1, canViewData: true } },
      { url: '/beneficiaryFarmer/approved', expected: { url_id: '28', title: 'Approved Beneficiary data', surveyName: 'Beneficiary Verification', dataPurpose: 'get_approved_surveydata', searchPurpose: 'search_approved_surveydata', surveyId: '14', canApprove: false, canReject: true, canPending: true, parentSurveyId: null, showApproveColumn: false, excelDownloadPurpose: 'get_approved_exceldata', showDateType: true, showCrop: true, showInactiveUser: false, surveyStatus: 1, canViewData: true } },
      { url: '/beneficiaryFarmer/rejected', expected: { url_id: '29', title: 'Rejected Beneficiary data', surveyName: 'Beneficiary Verification', dataPurpose: 'get_rejected_surveydata', searchPurpose: 'search_rejected_surveydata', surveyId: '14', canApprove: true, canReject: false, canPending: true, parentSurveyId: null, showApproveColumn: false, excelDownloadPurpose: 'get_rejected_exceldata', showDateType: true, showCrop: true, showInactiveUser: false, surveyStatus: 1, canViewData: true } },
      { url: '/beneficiaryFarmer/alldata', expected: { url_id: '30', title: 'All Beneficiary data', surveyName: 'Beneficiary Verification', dataPurpose: 'get_consolidated_surveydata', searchPurpose: 'search_consolidated_surveydata', surveyId: '14', canApprove: false, canReject: false, canPending: false, parentSurveyId: null, showApproveColumn: true, excelDownloadPurpose: 'get_consolidated_exceldata', showDateType: true, showCrop: true, showInactiveUser: false, surveyStatus: 1, canViewData: true } },
      // If there are more URLs, add them here
    ];

    testCases.forEach(({ url, expected }) => {
      it(`should set correct values for url: ${url}`, () => {
        mockRouter.url = url;
        mockUserDetailService.getUserDetail.mockReturnValue({ user_role: '1' });

        component = new CmsManagementComponent(mockRouter, mockUserDetailService);

        expect(component.url_id).toBe(expected.url_id);
        expect(component.title).toBe(expected.title);
        expect(component.surveyName).toBe(expected.surveyName);
        expect(component.dataPurpose).toBe(expected.dataPurpose);
        expect(component.searchPurpose).toBe(expected.searchPurpose);
        expect(component.surveyId).toBe(expected.surveyId);
        expect(component.canApprove).toBe(expected.canApprove);
        expect(component.canReject).toBe(expected.canReject);
        expect(component.canPending).toBe(expected.canPending);
        expect(component.parentSurveyId).toBe(expected.parentSurveyId);
        expect(component.showApproveColumn).toBe(expected.showApproveColumn);
        expect(component.excelDownloadPurpose).toBe(expected.excelDownloadPurpose);
        expect(component.showDateType).toBe(expected.showDateType);
        expect(component.showCrop).toBe(expected.showCrop);
        expect(component.showInactiveUser).toBe(expected.showInactiveUser);
        expect(component.surveyStatus).toBe(expected.surveyStatus);
        expect(component.canViewData).toBe(expected.canViewData);
      });
    });

    it('should handle different user roles for canReject and canPending', () => {
      mockRouter.url = '/workshop/approved';
      mockUserDetailService.getUserDetail.mockReturnValue({ user_role: '5' }); // Not in [1,2,3,4]

      component = new CmsManagementComponent(mockRouter, mockUserDetailService);

      expect(component.canReject).toBe(false);
      expect(component.canPending).toBe(false);
    });
  });

  describe('ngOnInit', () => {
    it('should do nothing', () => {
      // ngOnInit is empty, so just call it
      expect(() => component.ngOnInit()).not.toThrow();
    });
  });
});