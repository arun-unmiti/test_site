import { Component, OnInit } from '@angular/core';
import { Router } from "@angular/router";
import { UserDetailService } from "../auth/user-detail.service";

@Component({
  selector: 'app-cms-management',
  templateUrl: './cms-management.component.html'
})
export class CmsManagementComponent implements OnInit {
  url_id: any = "";
  title: any = "";
  surveyName: any = "";
  dataPurpose: any = "";
  surveyId: any = "";
  canApprove: any = "";
  canReject: any = "";
  canPending: any = "";
  parentSurveyId: any = "";
  showApproveColumn: any = "";
  excelDownloadPurpose: any = "";
  showDateType: any = "";
  user: any;
  showCrop: any;
  showInactiveUser: any;
  surveyStatus: any;
  canViewData: any;
  searchPurpose: any = "";

  constructor(private route: Router,private userService: UserDetailService) {
    this.user = this.userService.getUserDetail();
    this.initalizeValues(this.route.url);
  }

  ngOnInit(): void {
  }

  initalizeValues(url: any) {
    let param = {}
    switch(url) {
      case "/workshop/create": {
        param = {"url_id": "1", "title":"Create Workshop Data","surveyName":"Workshop Management","dataPurpose":"","searchPurpose":"search_pending_surveydata","surveyId":"8","canApprove":true,"canReject":true,"canPending":false,"parentSurveyId":null,"showApproveColumn":false,"excelDownloadPurpose":"get_pending_exceldata","showDateType":false,"showCrop":true,"showInactiveUser":false,"surveyStatus":1,"canViewData":true};
        break;
      }  case "/workshop/pending": {
        param = {"url_id": "2", "title":"Pending Workshop Data","surveyName":"Workshop Management","dataPurpose":"get_pending_surveydata","searchPurpose":"search_pending_surveydata","surveyId":"8","canApprove":true,"canReject":true,"canPending":false,"parentSurveyId":null,"showApproveColumn":false,"excelDownloadPurpose":"get_pending_exceldata","showDateType":false,"showCrop":true,"showInactiveUser":false,"surveyStatus":1,"canViewData":true};
        break;
      } case "/workshop/approved": {
        param = {"url_id": "3", "title":"Approved Workshop Data","surveyName":"Workshop Management","dataPurpose":"get_approved_surveydata","searchPurpose":"search_approved_surveydata","surveyId":"8","canApprove":false,"canReject":[1,2,3,4].includes(+this.user?.user_role),"canPending":[1,2,3,4].includes(+this.user?.user_role),"parentSurveyId":null,"showApproveColumn":false,"excelDownloadPurpose":"get_approved_exceldata","showDateType":true,"showCrop":true,"showInactiveUser":false,"surveyStatus":1,"canViewData":true};
        break;
      } case "/workshop/rejected": {
        param = {"url_id": "4", "title":"Rejected Workshop Data","surveyName":"Workshop Management","dataPurpose":"get_rejected_surveydata","searchPurpose":"search_rejected_surveydata","surveyId":"8","canApprove":true,"canReject":false,"canPending":[1,2,3,4].includes(+this.user?.user_role),"parentSurveyId":null,"showApproveColumn":false,"excelDownloadPurpose":"get_rejected_exceldata","showDateType":true,"showCrop":true,"showInactiveUser":false,"surveyStatus":1,"canViewData":true};
        break;
      } case "/workshop/alldata": {
        param = {"url_id": "5", "title":"All Workshop data","surveyName":"Workshop Management","dataPurpose":"get_consolidated_surveydata","searchPurpose":"search_consolidated_surveydata","surveyId":"8","canApprove":false,"canReject":false,"canPending":false,"parentSurveyId":null,"showApproveColumn":true,"excelDownloadPurpose":"get_consolidated_exceldata","showDateType":true,"showCrop":true,"showInactiveUser":false,"surveyStatus":1,"canViewData":true};
        break;
      } case "/infra/create": {
        param = {"url_id": "6", "title":"Create Infrastructure Data","surveyName":"Infra Management","dataPurpose":"","searchPurpose":"search_pending_surveydata","surveyId":"9","canApprove":true,"canReject":true,"canPending":false,"parentSurveyId":null,"showApproveColumn":false,"excelDownloadPurpose":"get_pending_exceldata","showDateType":false,"showCrop":true,"showInactiveUser":false,"surveyStatus":1,"canViewData":true};
        break;
      }  case "/infra/pending": {
        param = {"url_id": "7", "title":"Pending Infrastructure data","surveyName":"Infra Management","dataPurpose":"get_pending_surveydata","searchPurpose":"search_pending_surveydata","surveyId":"9","canApprove":true,"canReject":true,"canPending":false,"parentSurveyId":null,"showApproveColumn":false,"excelDownloadPurpose":"get_pending_exceldata","showDateType":false,"showCrop":true,"showInactiveUser":false,"surveyStatus":1,"canViewData":true};
        break;
      } case "/infra/approved": {
        param = {"url_id": "8", "title":"Approved Infrastructure data","surveyName":"Infra Management","dataPurpose":"get_approved_surveydata","searchPurpose":"search_approved_surveydata","surveyId":"9","canApprove":false,"canReject":[1,2,3,4].includes(+this.user?.user_role),"canPending":[1,2,3,4].includes(+this.user?.user_role),"parentSurveyId":null,"showApproveColumn":false,"excelDownloadPurpose":"get_approved_exceldata","showDateType":true,"showCrop":true,"showInactiveUser":false,"surveyStatus":1,"canViewData":true};
        break;
      } case "/infra/rejected": {
        param = {"url_id": "9", "title":"Rejected Infrastructure data","surveyName":"Infra Management","dataPurpose":"get_rejected_surveydata","searchPurpose":"search_rejected_surveydata","surveyId":"9","canApprove":true,"canReject":false,"canPending":[1,2,3,4].includes(+this.user?.user_role),"parentSurveyId":null,"showApproveColumn":false,"excelDownloadPurpose":"get_rejected_exceldata","showDateType":true,"showCrop":true,"showInactiveUser":false,"surveyStatus":1,"canViewData":true};
        break;
      } case "/infra/alldata": {
        param = {"url_id": "10", "title":"All Infrastructure data","surveyName":"Infra Management","dataPurpose":"get_consolidated_surveydata","searchPurpose":"search_consolidated_surveydata","surveyId":"9","canApprove":false,"canReject":false,"canPending":false,"parentSurveyId":null,"showApproveColumn":true,"excelDownloadPurpose":"get_consolidated_exceldata","showDateType":true,"showCrop":true,"showInactiveUser":false,"surveyStatus":1,"canViewData":true};
        break;
      } case "/gro/create": {
        param = {"url_id": "11", "title":"Create GRO","surveyName":"GRO Management","dataPurpose":"","searchPurpose":"search_pending_surveydata","surveyId":"10","canApprove":true,"canReject":true,"canPending":false,"parentSurveyId":null,"showApproveColumn":false,"excelDownloadPurpose":"get_pending_exceldata","showDateType":false,"showCrop":true,"showInactiveUser":false,"surveyStatus":1,"canViewData":true};
        break;
      }  case "/gro/pending": {
        param = {"url_id": "12", "title":"Pending GRO data","surveyName":"GRO Management","dataPurpose":"get_pending_surveydata","searchPurpose":"search_pending_surveydata","surveyId":"10","canApprove":true,"canReject":true,"canPending":false,"parentSurveyId":null,"showApproveColumn":false,"excelDownloadPurpose":"get_pending_exceldata","showDateType":false,"showCrop":true,"showInactiveUser":false,"surveyStatus":1,"canViewData":true};
        break;
      } case "/gro/approved": {
        param = {"url_id": "13", "title":"Approved GRO data","surveyName":"GRO Management","dataPurpose":"get_approved_surveydata","searchPurpose":"search_approved_surveydata","surveyId":"10","canApprove":false,"canReject":[1,2,3,4].includes(+this.user?.user_role),"canPending":[1,2,3,4].includes(+this.user?.user_role),"parentSurveyId":null,"showApproveColumn":false,"excelDownloadPurpose":"get_approved_exceldata","showDateType":true,"showCrop":true,"showInactiveUser":false,"surveyStatus":1,"canViewData":true};
        break;
      } case "/gro/rejected": {
        param = {"url_id": "14", "title":"Rejected GRO data","surveyName":"GRO Management","dataPurpose":"get_rejected_surveydata","searchPurpose":"search_rejected_surveydata","surveyId":"10","canApprove":true,"canReject":false,"canPending":[1,2,3,4].includes(+this.user?.user_role),"parentSurveyId":null,"showApproveColumn":false,"excelDownloadPurpose":"get_rejected_exceldata","showDateType":true,"showCrop":true,"showInactiveUser":false,"surveyStatus":1,"canViewData":true};
        break;
      } case "/gro/alldata": {
        param = {"url_id": "15", "title":"All GRO data","surveyName":"GRO Management","dataPurpose":"get_consolidated_surveydata","searchPurpose":"search_consolidated_surveydata","surveyId":"10","canApprove":false,"canReject":false,"canPending":false,"parentSurveyId":null,"showApproveColumn":true,"excelDownloadPurpose":"get_consolidated_exceldata","showDateType":true,"showCrop":true,"showInactiveUser":false,"surveyStatus":1,"canViewData":true};
        break;
      } case "/manpower/create": {
        param = {"url_id": "16", "title":"Create Manpower","surveyName":"Manpower Management","dataPurpose":"","searchPurpose":"search_pending_surveydata","surveyId":"11","canApprove":true,"canReject":true,"canPending":false,"parentSurveyId":null,"showApproveColumn":false,"excelDownloadPurpose":"get_pending_exceldata","showDateType":false,"showCrop":true,"showInactiveUser":false,"surveyStatus":1,"canViewData":true};
        break;
      }  case "/manpower/pending": {
        param = {"url_id": "17", "title":"Pending Manpower data","surveyName":"Manpower Management","dataPurpose":"get_pending_surveydata","searchPurpose":"search_pending_surveydata","surveyId":"11","canApprove":true,"canReject":true,"canPending":false,"parentSurveyId":null,"showApproveColumn":false,"excelDownloadPurpose":"get_pending_exceldata","showDateType":false,"showCrop":true,"showInactiveUser":false,"surveyStatus":1,"canViewData":true};
        break;
      } case "/manpower/approved": {
        param = {"url_id": "18", "title":"Approved Manpower data","surveyName":"Manpower Management","dataPurpose":"get_approved_surveydata","searchPurpose":"search_approved_surveydata","surveyId":"11","canApprove":false,"canReject":[1,2,3,4].includes(+this.user?.user_role),"canPending":[1,2,3,4].includes(+this.user?.user_role),"parentSurveyId":null,"showApproveColumn":false,"excelDownloadPurpose":"get_approved_exceldata","showDateType":true,"showCrop":true,"showInactiveUser":false,"surveyStatus":1,"canViewData":true};
        break;
      } case "/manpower/rejected": {
        param = {"url_id": "19", "title":"Rejected Manpower data","surveyName":"Manpower Management","dataPurpose":"get_rejected_surveydata","searchPurpose":"search_rejected_surveydata","surveyId":"11","canApprove":true,"canReject":false,"canPending":[1,2,3,4].includes(+this.user?.user_role),"parentSurveyId":null,"showApproveColumn":false,"excelDownloadPurpose":"get_rejected_exceldata","showDateType":true,"showCrop":true,"showInactiveUser":false,"surveyStatus":1,"canViewData":true};
        break;
      } case "/manpower/alldata": {
        param = {"url_id": "20", "title":"All Manpower data","surveyName":"Manpower Management","dataPurpose":"get_consolidated_surveydata","searchPurpose":"search_consolidated_surveydata","surveyId":"11","canApprove":false,"canReject":false,"canPending":false,"parentSurveyId":null,"showApproveColumn":true,"excelDownloadPurpose":"get_consolidated_exceldata","showDateType":true,"showCrop":true,"showInactiveUser":false,"surveyStatus":1,"canViewData":true};
        break;
      } case "/farmer/upload": {
        param = {"url_id": "21", "title":"Upload Insured Verification data","surveyName":"Insured Verification","dataPurpose":"","searchPurpose":"search_pending_surveydata","surveyId":"12","canApprove":true,"canReject":true,"canPending":false,"parentSurveyId":null,"showApproveColumn":false,"excelDownloadPurpose":"get_pending_exceldata","showDateType":false,"showCrop":true,"showInactiveUser":false,"surveyStatus":1,"canViewData":true};
        break;
      } case "/farmer/view": {
        param = {"url_id": "22", "title":"View Insured Verification data","surveyName":"Insured Verification","dataPurpose":"get_view_farmer_data","searchPurpose":"search_view_surveydata","surveyId":"12","canApprove":true,"canReject":true,"canPending":false,"parentSurveyId":null,"showApproveColumn":false,"excelDownloadPurpose":"get_view_exceldata","showDateType":false,"showCrop":true,"showInactiveUser":false,"surveyStatus":1,"canViewData":true};
        break;
      } case "/farmer/pending": {
        param = {"url_id": "23", "title":"Pending Insured Verification data","surveyName":"Insured Verification","dataPurpose":"get_pending_surveydata","searchPurpose":"search_pending_surveydata","surveyId":"12","canApprove":true,"canReject":true,"canPending":false,"parentSurveyId":null,"showApproveColumn":false,"excelDownloadPurpose":"get_pending_exceldata","showDateType":false,"showCrop":true,"showInactiveUser":false,"surveyStatus":1,"canViewData":true};
        break;
      } case "/farmer/approved": {
        param = {"url_id": "24", "title":"Approved Insured Verification data","surveyName":"Insured Verification","dataPurpose":"get_approved_surveydata","searchPurpose":"search_approved_surveydata","surveyId":"12","canApprove":false,"canReject":[1,2,3,4].includes(+this.user?.user_role),"canPending":[1,2,3,4].includes(+this.user?.user_role),"parentSurveyId":null,"showApproveColumn":false,"excelDownloadPurpose":"get_approved_exceldata","showDateType":true,"showCrop":true,"showInactiveUser":false,"surveyStatus":1,"canViewData":true};
        break;
      } case "/farmer/rejected": {
        param = {"url_id": "25", "title":"Rejected Insured Verification data","surveyName":"Insured Verification","dataPurpose":"get_rejected_surveydata","searchPurpose":"search_rejected_surveydata","surveyId":"12","canApprove":true,"canReject":false,"canPending":[1,2,3,4].includes(+this.user?.user_role),"parentSurveyId":null,"showApproveColumn":false,"excelDownloadPurpose":"get_rejected_exceldata","showDateType":true,"showCrop":true,"showInactiveUser":false,"surveyStatus":1,"canViewData":true};
        break;
      } case "/farmer/alldata": {
        param = {"url_id": "26", "title":"All Insured Verification data","surveyName":"Insured Verification","dataPurpose":"get_consolidated_surveydata","searchPurpose":"search_consolidated_surveydata","surveyId":"12","canApprove":false,"canReject":false,"canPending":false,"parentSurveyId":null,"showApproveColumn":true,"excelDownloadPurpose":"get_consolidated_exceldata","showDateType":true,"showCrop":true,"showInactiveUser":false,"surveyStatus":1,"canViewData":true};
        break;
      } case "/beneficiaryFarmer/pending": {
        param = {"url_id": "27", "title":"Pending Beneficiary data","surveyName":"Beneficiary Verification","dataPurpose":"get_pending_surveydata","searchPurpose":"search_pending_surveydata","surveyId":"14","canApprove":true,"canReject":true,"canPending":false,"parentSurveyId":null,"showApproveColumn":false,"excelDownloadPurpose":"get_pending_exceldata","showDateType":false,"showCrop":true,"showInactiveUser":false,"surveyStatus":1,"canViewData":true};
        break;
      } case "/beneficiaryFarmer/approved": {
        param = {"url_id": "28", "title":"Approved Beneficiary data","surveyName":"Beneficiary Verification","dataPurpose":"get_approved_surveydata","searchPurpose":"search_approved_surveydata","surveyId":"14","canApprove":false,"canReject":[1,2,3,4].includes(+this.user?.user_role),"canPending":[1,2,3,4].includes(+this.user?.user_role),"parentSurveyId":null,"showApproveColumn":false,"excelDownloadPurpose":"get_approved_exceldata","showDateType":true,"showCrop":true,"showInactiveUser":false,"surveyStatus":1,"canViewData":true};
        break;
      } case "/beneficiaryFarmer/rejected": {
        param = {"url_id": "29", "title":"Rejected Beneficiary data","surveyName":"Beneficiary Verification","dataPurpose":"get_rejected_surveydata","searchPurpose":"search_rejected_surveydata","surveyId":"14","canApprove":true,"canReject":false,"canPending":[1,2,3,4].includes(+this.user?.user_role),"parentSurveyId":null,"showApproveColumn":false,"excelDownloadPurpose":"get_rejected_exceldata","showDateType":true,"showCrop":true,"showInactiveUser":false,"surveyStatus":1,"canViewData":true};
        break;
      } case "/beneficiaryFarmer/alldata": {
        param = {"url_id": "30", "title":"All Beneficiary data","surveyName":"Beneficiary Verification","dataPurpose":"get_consolidated_surveydata","searchPurpose":"search_consolidated_surveydata","surveyId":"14","canApprove":false,"canReject":false,"canPending":false,"parentSurveyId":null,"showApproveColumn":true,"excelDownloadPurpose":"get_consolidated_exceldata","showDateType":true,"showCrop":true,"showInactiveUser":false,"surveyStatus":1,"canViewData":true};
        break;
      }
    }
    this.setSurveyDetails(param);
  }

  setSurveyDetails(param: any) {
    this.url_id = param.url_id;
    this.title = param.title;
    this.surveyName = param.surveyName;
    this.dataPurpose = param.dataPurpose;
    this.surveyId = param.surveyId;
    this.canApprove = param.canApprove;
    this.canReject = param.canReject;
    this.canPending = param.canPending;
    this.parentSurveyId = param.parentSurveyId;
    this.showApproveColumn = param.showApproveColumn;
    this.excelDownloadPurpose = param.excelDownloadPurpose;
    this.showDateType = param.showDateType;
    this.showCrop = param.showCrop;
    this.showInactiveUser = param.showInactiveUser;
    this.surveyStatus = param.surveyStatus;
    this.canViewData = param.canViewData;
    this.searchPurpose = param.searchPurpose;
  }


}
