import { Component, OnInit } from '@angular/core';
import { Router } from "@angular/router";
import { UserDetailService } from "../auth/user-detail.service";

@Component({
  selector: 'app-proposal-management',
  templateUrl: './proposal-management.component.html'
})
export class ProposalManagementComponent {

  proposal_url_id: any = "";
  proposal_title: any = "";
  proposal_surveyName: any = "";
  proposal_dataPurpose: any = "";
  proposal_surveyId: any = "";
  proposal_canApprove: any = "";
  proposal_canReject: any = "";
  proposal_canPending: any = "";
  proposal_parentSurveyId: any = "";
  proposal_showApproveColumn: any = "";
  proposal_excelDownloadPurpose: any = "";
  proposal_showDateType: any = "";
  proposal_surveyStatus: any;
  proposal_showCrop: any;
  proposal_searchPurpose: any = "";
  proposal_user: any;
  proposal_canViewData: any;
  proposal_showInactiveUser: any;

  constructor(private route: Router,private userDetaiService: UserDetailService) {
    this.proposal_user = this.userDetaiService.getUserDetail();
    this.propInitalizeValues(this.route.url);
  }

  propInitalizeValues(url: any) {
    const config = new Map([
        ['/proposal/upload', {url_id: '21', title: 'Upload Proposal Verification data', surveyName: 'Proposal Verification', dataPurpose: '', searchPurpose: 'search_pending_surveydata', surveyId: '13', canApprove: true, canReject: true, canPending: false, parentSurveyId: null, showApproveColumn: false, excelDownloadPurpose: 'get_pending_exceldata', showDateType: false, showCrop: true, showInactiveUser: false, surveyStatus: 1, canViewData: true }],
        ['/proposal/view', {url_id: '22', title: 'View Proposal Verification data', surveyName: 'Proposal Verification', dataPurpose: 'get_view_product_details', searchPurpose: 'search_view_surveydata', surveyId: '13', canApprove: true, canReject: true, canPending: false, parentSurveyId: null, showApproveColumn: false, excelDownloadPurpose: 'get_product_exceldata', showDateType: false, showCrop: true, showInactiveUser: false, surveyStatus: 1, canViewData: true }],
        ['/proposal/pending', {url_id: '23', title: 'Pending Proposal Verification data', surveyName: 'Proposal Verification', dataPurpose: 'get_pending_surveydata', searchPurpose: 'search_pending_surveydata', surveyId: '13', canApprove: true, canReject: true, canPending: false, parentSurveyId: null, showApproveColumn: false, excelDownloadPurpose: 'get_pending_exceldata', showDateType: false, showCrop: true, showInactiveUser: false, surveyStatus: 1, canViewData: true }],
        ['/proposal/approved', {url_id: '24', title: 'Approved Proposal Verification data', surveyName: 'Proposal Verification', dataPurpose: 'get_approved_surveydata', searchPurpose: 'search_approved_surveydata', surveyId: '13', canApprove: false, canReject: [1, 2, 3, 4].includes(+this.proposal_user?.user_role), canPending: [1, 2, 3, 4].includes(+this.proposal_user?.user_role), parentSurveyId: null, showApproveColumn: false, excelDownloadPurpose: 'get_approved_exceldata', showDateType: true, showCrop: true, showInactiveUser: false, surveyStatus: 1, canViewData: true }],
        ['/proposal/rejected', {url_id: '25', title: 'Rejected Proposal Verification data', surveyName: 'Proposal Verification', dataPurpose: 'get_rejected_surveydata', searchPurpose: 'search_rejected_surveydata', surveyId: '13', canApprove: true, canReject: false, canPending: [1, 2, 3, 4].includes(+this.proposal_user?.user_role), parentSurveyId: null, showApproveColumn: false, excelDownloadPurpose: 'get_rejected_exceldata', showDateType: true, showCrop: true, showInactiveUser: false, surveyStatus: 1, canViewData: true }],
        ['/proposal/alldata', {url_id: '26', title: 'All Proposal Verification data', surveyName: 'Proposal Verification', dataPurpose: 'get_consolidated_surveydata', searchPurpose: 'search_consolidated_surveydata', surveyId: '13', canApprove: false, canReject: false, canPending: false, parentSurveyId: null, showApproveColumn: true, excelDownloadPurpose: 'get_consolidated_exceldata', showDateType: true, showCrop: true, showInactiveUser: false, surveyStatus: 1, canViewData: true }]
    ]);

    const param = config.get(url) || {};
    this.setProposalDetails(param);
  }

  setProposalDetails(param: any) {
    ({
        url_id: this.proposal_url_id,
        title: this.proposal_title,
        surveyName: this.proposal_surveyName,
        dataPurpose: this.proposal_dataPurpose,
        surveyId: this.proposal_surveyId,
        canApprove: this.proposal_canApprove,
        canReject: this.proposal_canReject,
        canPending: this.proposal_canPending,
        parentSurveyId: this.proposal_parentSurveyId,
        showApproveColumn: this.proposal_showApproveColumn,
        excelDownloadPurpose: this.proposal_excelDownloadPurpose,
        showDateType: this.proposal_showDateType,
        showCrop: this.proposal_showCrop,
        showInactiveUser: this.proposal_showInactiveUser,
        surveyStatus: this.proposal_surveyStatus,
        canViewData: this.proposal_canViewData,
        searchPurpose: this.proposal_searchPurpose
    } = param);
  }

}