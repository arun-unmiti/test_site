import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { UserDetailService } from "../auth/user-detail.service";

@Component({
  selector: "app-survey-data",
  templateUrl: "./survey-data.component.html",
  styleUrls: ["./survey-data.component.css"],
})
export class SurveyDataComponent implements OnInit {
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
      case "/chm/draft": {
        param = {"title":"Surveyor Draft data (Crop Health Monitoring)","surveyName":"Crop Health Monitoring","dataPurpose":"get_draft_surveydata","searchPurpose":"search_draft_surveydata","surveyId":"1","canApprove":false,"canReject":false,"canPending":false,"parentSurveyId":null,"showApproveColumn":false,"excelDownloadPurpose":"get_draft_exceldata","showDateType":false,"showCrop":false,"showInactiveUser":true,"surveyStatus":0,"canViewData":false}
        break;
      } case "/chm/pending": {
        param = {"title":"Pending Crop Health Monitoring","surveyName":"Crop Health Monitoring","dataPurpose":"get_pending_surveydata","searchPurpose":"search_pending_surveydata","surveyId":"1","canApprove":true,"canReject":true,"canPending":false,"parentSurveyId":null,"showApproveColumn":false,"excelDownloadPurpose":"get_pending_exceldata","showDateType":false,"showCrop":true,"showInactiveUser":false,"surveyStatus":1,"canViewData":true};
        break;
      } case "/chm/approved": {
        param = {"title":"Approved Crop Health Monitoring","surveyName":"Crop Health Monitoring","dataPurpose":"get_approved_surveydata","searchPurpose":"search_approved_surveydata","surveyId":"1","canApprove":false,"canReject":false,"canPending":false,"parentSurveyId":null,"showApproveColumn":false,"excelDownloadPurpose":"get_approved_exceldata","showDateType":true,"showCrop":true,"showInactiveUser":false,"surveyStatus":1,"canViewData":true};
        break;
      } case "/chm/rejected": {
        param = {"title":"Rejected Crop Health Monitoring","surveyName":"Crop Health Monitoring","dataPurpose":"get_rejected_surveydata","searchPurpose":"search_rejected_surveydata","surveyId":"1","canApprove":true,"canReject":false,"canPending":false,"parentSurveyId":null,"showApproveColumn":false,"excelDownloadPurpose":"get_rejected_exceldata","showDateType":true,"showCrop":true,"showInactiveUser":false,"surveyStatus":1,"canViewData":true};
        break;
      } case "/chm/alldata": {
        param = {"title":"All Crop Health Monitoring","surveyName":"Crop Health Monitoring","dataPurpose":"get_consolidated_surveydata","searchPurpose":"search_consolidated_surveydata","surveyId":"1","canApprove":false,"canReject":false,"canPending":false,"parentSurveyId":null,"showApproveColumn":true,"excelDownloadPurpose":"get_consolidated_exceldata","showDateType":true,"showCrop":true,"showInactiveUser":false,"surveyStatus":1,"canViewData":true};
        break;
      } case "/revisit-chm/pending": {
        param = {"title":"Pending Revisit CHM","surveyName":"Revisit CHM","dataPurpose":"get_pending_surveydata","searchPurpose":"search_pending_surveydata","surveyId":"4","canApprove":true,"canReject":true,"canPending":false,"parentSurveyId":1,"showApproveColumn":false,"excelDownloadPurpose":"get_pending_exceldata","showDateType":false,"showCrop":true,"showInactiveUser":false,"surveyStatus":1,"canViewData":true};
        break;
      } case "/revisit-chm/approved": {
        param = {"title":"Approved Revisit CHM","surveyName":"Revisit CHM","dataPurpose":"get_approved_surveydata","searchPurpose":"search_approved_surveydata","surveyId":"4","canApprove":false,"canReject":[1,2,3,4].includes(+this.user?.user_role),"canPending":[1,2,3,4].includes(+this.user?.user_role),"parentSurveyId":1,"showApproveColumn":false,"excelDownloadPurpose":"get_approved_exceldata","showDateType":true,"showCrop":true,"showInactiveUser":false,"surveyStatus":1,"canViewData":true};
        break;
      } case "/revisit-chm/rejected": {
        param = {"title":"Rejected Revisit CHM","surveyName":"Revisit CHM","dataPurpose":"get_rejected_surveydata","searchPurpose":"search_rejected_surveydata","surveyId":"4","canApprove":true,"canReject":false,"canPending":[1,2,3,4].includes(+this.user?.user_role),"parentSurveyId":1,"showApproveColumn":false,"excelDownloadPurpose":"get_rejected_exceldata","showDateType":true,"showCrop":true,"showInactiveUser":false,"surveyStatus":1,"canViewData":true};
        break;
      } case "/revisit-chm/alldata": {
        param = {"title":"All Revisit CHM","surveyName":"Revisit CHM","dataPurpose":"get_consolidated_surveydata","searchPurpose":"search_consolidated_surveydata","surveyId":"4","canApprove":false,"canReject":false,"canPending":false,"parentSurveyId":1,"showApproveColumn":true,"excelDownloadPurpose":"get_consolidated_exceldata","showDateType":true,"showCrop":true,"showInactiveUser":false,"surveyStatus":1,"canViewData":true};
        break;
      } case "/cls/draft": {
        param = {"title":"Surveyor Draft data (Crop Loss Survey)","surveyName":"Crop Loss Survey","dataPurpose":"get_draft_surveydata","searchPurpose":"search_draft_surveydata","surveyId":"2","canApprove":false,"canReject":false,"canPending":false,"parentSurveyId":null,"showApproveColumn":false,"excelDownloadPurpose":"get_draft_exceldata","showDateType":false,"showCrop":false,"showInactiveUser":true,"surveyStatus":0,"canViewData":false};
        break;
      } case "/cls/pending": {
        param = {"title":"Pending Crop Loss Survey","surveyName":"Crop Loss Survey","dataPurpose":"get_pending_surveydata","searchPurpose":"search_pending_surveydata","surveyId":"2","canApprove":true,"canReject":true,"canPending":false,"parentSurveyId":null,"showApproveColumn":false,"excelDownloadPurpose":"get_pending_exceldata","showDateType":false,"showCrop":true,"showInactiveUser":false,"surveyStatus":1,"canViewData":true};
        break;
      } case "/cls/approved": {
        param = {"title":"Approved Crop Loss Survey","surveyName":"Crop Loss Survey","dataPurpose":"get_approved_surveydata","searchPurpose":"search_approved_surveydata","surveyId":"2","canApprove":false,"canReject":[1,2,3,4].includes(+this.user?.user_role),"canPending":[1,2,3,4].includes(+this.user?.user_role),"parentSurveyId":null,"showApproveColumn":false,"excelDownloadPurpose":"get_approved_exceldata","showDateType":true,"showCrop":true,"showInactiveUser":false,"surveyStatus":1,"canViewData":true};
        break;
      } case "/cls/rejected": {
        param = {"title":"Rejected Crop Loss Survey","surveyName":"Crop Loss Survey","dataPurpose":"get_rejected_surveydata","searchPurpose":"search_rejected_surveydata","surveyId":"2","canApprove":true,"canReject":false,"canPending":[1,2,3,4].includes(+this.user?.user_role),"parentSurveyId":null,"showApproveColumn":false,"excelDownloadPurpose":"get_rejected_exceldata","showDateType":true,"showCrop":true,"showInactiveUser":false,"surveyStatus":1,"canViewData":true};
        break;
      } case "/cls/alldata": {
        param = {"title":"All Crop Loss Survey","surveyName":"Crop Loss Survey","dataPurpose":"get_consolidated_surveydata","searchPurpose":"search_consolidated_surveydata","surveyId":"2","canApprove":false,"canReject":false,"canPending":false,"parentSurveyId":null,"showApproveColumn":true,"excelDownloadPurpose":"get_consolidated_exceldata","showDateType":true,"showCrop":true,"showInactiveUser":false,"surveyStatus":1,"canViewData":true};
        break;
      } case "/cce/draft": {
        param = {"title":"Surveyor Draft data (Crop Cutting Experiment)","surveyName":"Crop Cutting Experiment","dataPurpose":"get_draft_surveydata","searchPurpose":"search_draft_surveydata","surveyId":"3","canApprove":false,"canReject":false,"canPending":false,"parentSurveyId":null,"showApproveColumn":false,"excelDownloadPurpose":"get_draft_exceldata","showDateType":false,"showCrop":false,"showInactiveUser":true,"surveyStatus":0,"canViewData":false};
        break;
      } case "/cce/pending": {
        param = {"title":"Pending Crop Cutting Experiment","surveyName":"Crop Cutting Experiment","dataPurpose":"get_pending_surveydata","searchPurpose":"search_pending_surveydata","surveyId":"3","canApprove":true,"canReject":true,"canPending":false,"parentSurveyId":null,"showApproveColumn":false,"excelDownloadPurpose":"get_pending_exceldata","showDateType":false,"showCrop":true,"showInactiveUser":false,"surveyStatus":1,"canViewData":true};
        break;
      } case "/cce/approved": {
        param = {"title":"Approved Crop Cutting Experiment","surveyName":"Crop Cutting Experiment","dataPurpose":"get_approved_surveydata","searchPurpose":"search_approved_surveydata","surveyId":"3","canApprove":false,"canReject":[1,2,3,4].includes(+this.user?.user_role),"canPending":[1,2,3,4].includes(+this.user?.user_role),"parentSurveyId":null,"showApproveColumn":false,"excelDownloadPurpose":"get_approved_exceldata","showDateType":true,"showCrop":true,"showInactiveUser":false,"surveyStatus":1,"canViewData":true};
        break;
      } case "/cce/rejected": {
        param = {"title":"Rejected Crop Cutting Experiment","surveyName":"Crop Cutting Experiment","dataPurpose":"get_rejected_surveydata","searchPurpose":"search_rejected_surveydata","surveyId":"3","canApprove":true,"canReject":false,"canPending":[1,2,3,4].includes(+this.user?.user_role),"parentSurveyId":null,"showApproveColumn":false,"excelDownloadPurpose":"get_rejected_exceldata","showDateType":true,"showCrop":true,"showInactiveUser":false,"surveyStatus":1,"canViewData":true};
        break;
      } case "/cce/alldata": {
        param = {"title":"All Crop Cutting Experiment","surveyName":"Crop Cutting Experiment","dataPurpose":"get_consolidated_surveydata","searchPurpose":"search_consolidated_surveydata","surveyId":"3","canApprove":false,"canReject":false,"canPending":false,"parentSurveyId":null,"showApproveColumn":true,"excelDownloadPurpose":"get_consolidated_exceldata","showDateType":true,"showCrop":true,"showInactiveUser":false,"surveyStatus":1,"canViewData":true};
        break;
      } case "/multipicking/pending": {
        param = {"title":"Pending Two step/Multipicking","surveyName":"Two step/Multipicking","dataPurpose":"get_pending_surveydata","searchPurpose":"search_pending_surveydata","surveyId":"7","canApprove":true,"canReject":true,"canPending":false,"parentSurveyId":3,"showApproveColumn":false,"excelDownloadPurpose":"get_pending_exceldata","showDateType":false,"showCrop":true,"showInactiveUser":false,"surveyStatus":1,"canViewData":true};
        break;
      } case "/multipicking/approved": {
        param = {"title":"Approved Two step/Multipicking","surveyName":"Two step/Multipicking","dataPurpose":"get_approved_surveydata","searchPurpose":"search_approved_surveydata","surveyId":"7","canApprove":false,"canReject":[1,2,3,4].includes(+this.user?.user_role),"canPending":[1,2,3,4].includes(+this.user?.user_role),"parentSurveyId":3,"showApproveColumn":false,"excelDownloadPurpose":"get_approved_exceldata","showDateType":true,"showCrop":true,"showInactiveUser":false,"surveyStatus":1,"canViewData":true};
        break;
      } case "/multipicking/rejected": {
        param = {"title":"Rejected Two step/Multipicking","surveyName":"Two step/Multipicking","dataPurpose":"get_rejected_surveydata","searchPurpose":"search_rejected_surveydata","surveyId":"7","canApprove":true,"canReject":false,"canPending":[1,2,3,4].includes(+this.user?.user_role),"parentSurveyId":3,"showApproveColumn":false,"excelDownloadPurpose":"get_rejected_exceldata","showDateType":true,"showCrop":true,"showInactiveUser":false,"surveyStatus":1,"canViewData":true};
        break;
      } case "/multipicking/alldata": {
        param = {"title":"All Two step/Multipicking","surveyName":"Two step/Multipicking","dataPurpose":"get_consolidated_surveydata","searchPurpose":"search_consolidated_surveydata","surveyId":"7","canApprove":false,"canReject":false,"canPending":false,"parentSurveyId":3,"showApproveColumn":true,"excelDownloadPurpose":"get_consolidated_exceldata","showDateType":true,"showCrop":true,"showInactiveUser":false,"surveyStatus":1,"canViewData":true};
        break;
      } case "/other-activity/pending": {
        param = {"title":"Pending Other Activity","surveyName":"Other Activity","dataPurpose":"get_pending_surveydata","searchPurpose":"search_pending_surveydata","surveyId":"6","canApprove":true,"canReject":true,"canPending":false,"parentSurveyId":null,"showApproveColumn":false,"excelDownloadPurpose":"get_pending_exceldata","showDateType":false,"showCrop":true,"showInactiveUser":false,"surveyStatus":1,"canViewData":true};
        break;
      } case "/other-activity/approved": {
        param = {"title":"Approved Other Activity","surveyName":"Other Activity","dataPurpose":"get_approved_surveydata","searchPurpose":"search_approved_surveydata","surveyId":"6","canApprove":false,"canReject":[1,2,3,4].includes(+this.user?.user_role),"canPending":[1,2,3,4].includes(+this.user?.user_role),"parentSurveyId":null,"showApproveColumn":false,"excelDownloadPurpose":"get_approved_exceldata","showDateType":true,"showCrop":true,"showInactiveUser":false,"surveyStatus":1,"canViewData":true};
        break;
      } case "/other-activity/rejected": {
        param = {"title":"Rejected Other Activity","surveyName":"Other Activity","dataPurpose":"get_rejected_surveydata","searchPurpose":"search_rejected_surveydata","surveyId":"6","canApprove":true,"canReject":false,"canPending":[1,2,3,4].includes(+this.user?.user_role),"parentSurveyId":null,"showApproveColumn":false,"excelDownloadPurpose":"get_rejected_exceldata","showDateType":true,"showCrop":true,"showInactiveUser":false,"surveyStatus":1,"canViewData":true};
        break;
      } case "/other-activity/alldata": {
        param = {"title":"All Approved Other Activity","surveyName":"Other Activity","dataPurpose":"get_consolidated_surveydata","searchPurpose":"search_consolidated_surveydata","surveyId":"6","canApprove":false,"canReject":false,"canPending":false,"parentSurveyId":null,"showApproveColumn":true,"excelDownloadPurpose":"get_consolidated_exceldata","showDateType":true,"showCrop":true,"showInactiveUser":false,"surveyStatus":1,"canViewData":true};
        break;
      }
    }
    this.setSurveyDetails(param);
  }

  setSurveyDetails(param: any) {
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
