import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import * as moment from 'moment/moment';
import { ReportingService } from "../../../reporting/shared/reporting-service";
import { Department } from '../../../settings-new/shared/department.model';
import { DanpheHTTPResponse } from '../../../shared/common-models';
import { CommonFunctions } from '../../../shared/common.functions';
import { DLService } from "../../../shared/dl.service";
import { MessageboxService } from '../../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status } from '../../../shared/shared-enums';
import { DepartmentWiseAppointmentReportSummary_DTO } from '../../shared/dto/dept-wise-appt-rpt-summary.dto';
import { RPT_SchemeDTO } from '../../shared/dto/scheme.dto';
import { DynamicReport } from '../../shared/dynamic-report.model';

@Component({
  templateUrl: "./deptwise-appointment-report.html"
})

export class RPT_APPT_DeptWiseAppointmentReportComponent {
  public fromDate: string = null;
  public toDate: string = null;
  public departmentName: any;
  //public doctorList: any;
  DepartmentWiseAppointmentReportColumns: Array<any> = null;
  DepartmentWiseAppointmentReportData: Array<any> = new Array<DynamicReport>();
  dynamicColumns: Array<string> = new Array<string>();
  public CurrentDepartmentAppointment: DynamicReport = new DynamicReport();
  dlService: DLService = null;
  http: HttpClient = null;
  public departmentList: Array<Department>;
  DepartmentWiseAppointmentReportSummary = new DepartmentWiseAppointmentReportSummary_DTO();
  public selGenderName: string = "all";
  // public summaryHtml: string = null;

  gridExportOptions = {
    fileName: 'DepartmentwiseAppointmentList_' + moment().format('YYYY-MM-DD') + '.xls',
    //displayColumns: ['PatientCode', 'ShortName', 'Gender', 'MiddleName', 'DateOfBirth', 'PhoneNumber']

  };
  Schemes = new Array<RPT_SchemeDTO>();
  SelectedScheme = new RPT_SchemeDTO();

  constructor(
    _http: HttpClient,
    _dlService: DLService,
    private _messageBoxService: MessageboxService,
    private _reportingService: ReportingService) {
    this.http = _http;
    this.dlService = _dlService;
    this.CurrentDepartmentAppointment.fromDate = moment().format('YYYY-MM-DD');
    this.CurrentDepartmentAppointment.toDate = moment().format('YYYY-MM-DD');
    this.GetDepartments();
    this.DepartmentWiseAppointmentReportColumns = this._reportingService.reportGridCols.RPT_APPT_DepartmentWiseAppointmentCounts;
    this.Schemes = this._reportingService.SchemeList;
  }


  Load() {
    if (this.CurrentDepartmentAppointment.fromDate != null && this.CurrentDepartmentAppointment.toDate != null) {
      //reset all values to zero on button click.
      this.DepartmentWiseAppointmentReportSummary = new DepartmentWiseAppointmentReportSummary_DTO();
      this.DepartmentWiseAppointmentReportData = [];
      let deptId = 0;
      if (this.CurrentDepartmentAppointment && this.CurrentDepartmentAppointment.departmentName && this.CurrentDepartmentAppointment.departmentName.DepartmentId) {
        deptId = this.CurrentDepartmentAppointment.departmentName.DepartmentId;
      }


      this.dlService.Read("/Reporting/DepartmentWiseAppointmentReport?FromDate="
        + this.CurrentDepartmentAppointment.fromDate + "&ToDate=" + this.CurrentDepartmentAppointment.toDate + "&DepartmentId=" + deptId + "&gender=" + this.selGenderName
        + "&SchemeId=" + this.CurrentDepartmentAppointment.SchemeId + "&IsFreeVisit=" + this.CurrentDepartmentAppointment.IsFreeVisit)
        .map((res: DanpheHTTPResponse) => res)
        .subscribe(res => this.Success(res),
          res => this.Error(res));
    } else {
      this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, ['Dates Provided is not Proper']);
    }

  }

  Error(err) {
    this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [err]);
  }
  Success(res) {
    if (res.Status === ENUM_DanpheHTTPResponses.OK) {


      if (res.Results) {
        this.DepartmentWiseAppointmentReportData = res.Results.DepartmentWiseAppointmentReport;
        this.DepartmentWiseAppointmentReportSummary = res.Results.DepartmentWiseAppointmentReportSummary[0];
      }
      else {
        this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, ['Data is Not Available Between Selected dates...Try Different Dates']);
      }
    }
    else {
      this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, [res.ErrorMessage]);
    }
  }

  //Anjana:11June'20--reusable From-ToDate-In Reports..
  OnFromToDateChange($event) {
    this.fromDate = $event ? $event.fromDate : this.fromDate;
    this.toDate = $event ? $event.toDate : this.toDate;

    this.CurrentDepartmentAppointment.fromDate = this.fromDate;
    this.CurrentDepartmentAppointment.toDate = this.toDate;
  }

  public LoadDeptList() {
    // this.dlService.Read("/BillingReports/LoadDeptListFromFN")
    //     .map(res => res)
    //     .subscribe(res => {
    //         if (res.Status == "OK") {
    //           this.servDeptsList = res.Results;
    //           CommonFunctions.SortArrayOfObjects(this.servDeptsList, "ServiceDepartmentName");//this sorts the servDeptsList by ServiceDepartmentName.
    //         }
    //         else
    //             this.msgBoxServ.showMessage('notice-message', ["Failed to load Service departments"]);
    //     });
  }

  myListFormatter(data: any): string {
    let html = data["DepartmentName"];
    return html;
  }

  departmentChanged() {
    this.CurrentDepartmentAppointment.departmentName = this.CurrentDepartmentAppointment.departmentName ? this.CurrentDepartmentAppointment.departmentName : "";
  }

  GetDepartments() {
    this.dlService.GetDepartment()
      .subscribe(res => {
        if (res.Status == "OK")
          this.departmentList = res.Results;
        CommonFunctions.SortArrayOfObjects(this.departmentList, "DepartmentName");
      });
  }

  SchemeFormatter(data: any): string {
    let html = data["SchemeName"];
    return html;
  }

  OnSchemeChange(): void {
    if (this.SelectedScheme && typeof (this.SelectedScheme) === "object" && this.SelectedScheme.SchemeId) {
      this.CurrentDepartmentAppointment.SchemeId = this.SelectedScheme.SchemeId;
    }
    else {
      this.SelectedScheme = new RPT_SchemeDTO();
      this.CurrentDepartmentAppointment.SchemeId = null;
    }
  }
}









