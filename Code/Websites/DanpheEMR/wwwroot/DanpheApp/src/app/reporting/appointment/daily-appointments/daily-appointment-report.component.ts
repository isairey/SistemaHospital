import { Component } from '@angular/core';
import * as moment from 'moment/moment';
import { ReportingService } from "../../../reporting/shared/reporting-service";
import { NepaliDateInGridColumnDetail, NepaliDateInGridParams } from '../../../shared/danphe-grid/NepaliColGridSettingsModel';
import { GridEmitModel } from "../../../shared/danphe-grid/grid-emit.model";
import { DLService } from "../../../shared/dl.service";
import { MessageboxService } from '../../../shared/messagebox/messagebox.service';
import { ENUM_AppointmentTypeForReport, ENUM_FollowUpTypes, ENUM_MessageBox_Status } from '../../../shared/shared-enums';
import { RPT_SchemeDTO } from '../../shared/dto/scheme.dto';
import { RPT_APPT_DailyAppointmentReportModel } from "./daily-appointment-report.model";
import { SummaryModel } from './summaryView.model';

@Component({
  templateUrl: "./daily-appointment-report.html"
})
export class RPT_APPT_DailyAppointmentReportComponent {
  public fromDate: string = null;
  public toDate: string = null;
  public selProvider: any = "";
  public doctorList: any;
  public AppointmentType: string = "";
  public Doctor_Name: string = "";
  public filterParameters: any;
  DailyAppointmentReportColumns: Array<any> = null;
  DailyAppointmentReportData: Array<RPT_APPT_DailyAppointmentReportModel> = new Array<RPT_APPT_DailyAppointmentReportModel>();
  public CurrentDailyAppointment: RPT_APPT_DailyAppointmentReportModel = new RPT_APPT_DailyAppointmentReportModel();
  dlService: DLService = null;
  public NepaliDateInGridSettings: NepaliDateInGridParams = new NepaliDateInGridParams();
  public SummaryData: SummaryModel = new SummaryModel();
  Schemes = new Array<RPT_SchemeDTO>();
  SelectedScheme = new RPT_SchemeDTO();
  gridExportOptions = {
    fileName: 'AppointmentList' + moment().format('YYYY-MM-DD') + '.xls',
  };
  public loading: boolean = false;
  footer: any;
  AppointmentTypes = Object.values(ENUM_AppointmentTypeForReport);

  constructor(
    _dlService: DLService,
    private _messageBoxService: MessageboxService,
    private _reportingService: ReportingService) {
    this.dlService = _dlService;
    this.CurrentDailyAppointment.fromDate = moment().format('YYYY-MM-DD');
    this.CurrentDailyAppointment.toDate = moment().format('YYYY-MM-DD');
    this.NepaliDateInGridSettings.NepaliDateColumnList.push(new NepaliDateInGridColumnDetail("Date", true));
    this.loadDoctorsList();
    this.DailyAppointmentReportColumns = this._reportingService.reportGridCols.DailyAppointmentReport;
    this.Schemes = this._reportingService.SchemeList;
    this.CurrentDailyAppointment.AppointmentType = ENUM_AppointmentTypeForReport.All;
  }

  Load() {
    this.DailyAppointmentReportData = new Array<RPT_APPT_DailyAppointmentReportModel>();
    this.SummaryData = new SummaryModel();
    this.filterParameters = [
      { DisplayName: "From : ", Value: this.fromDate },
      { DisplayName: "To : ", Value: this.toDate },
    ]
    this.loading = true;//this disables the button until we get response from the api.
    if (this.CurrentDailyAppointment.fromDate != null && this.CurrentDailyAppointment.toDate != null) {
      let appointmentType: string = null;
      if (this.CurrentDailyAppointment.AppointmentType && this.CurrentDailyAppointment.AppointmentType === ENUM_AppointmentTypeForReport.FreeFollowUp) {
        appointmentType = ENUM_FollowUpTypes.FreeFollowUp;
      }
      else if (this.CurrentDailyAppointment.AppointmentType && this.CurrentDailyAppointment.AppointmentType === ENUM_AppointmentTypeForReport.PaidFollowUp) {
        appointmentType = ENUM_FollowUpTypes.PaidFollowUp;
      }
      else {
        appointmentType = this.CurrentDailyAppointment.AppointmentType;
      }
      this.dlService.Read("/Reporting/DailyAppointmentReport?FromDate="
        + this.CurrentDailyAppointment.fromDate + "&ToDate=" + this.CurrentDailyAppointment.toDate
        + "&DoctorId=" + this.CurrentDailyAppointment.DoctorId + "&AppointmentType=" + appointmentType
        + "&SchemeId=" + this.CurrentDailyAppointment.SchemeId + "&IsFreeVisit=" + this.CurrentDailyAppointment.IsFreeVisit)
        .map(res => res)
        .finally(() => { this.loading = false; })//re-enable the show-report button.
        .subscribe(res => this.Success(res),
          res => this.Error(res)
        );
    } else {
      this._messageBoxService.showMessage("error", ['Dates Provided is not Proper']);
      this.loading = false;
    }

  }
  Error(err) {
    this._messageBoxService.showMessage("error", [err]);
  }
  Success(res) {
    if (res.Status == "OK") {
      if (res.Results && res.Results.DailyAppointmentReport && res.Results.DailyAppointmentReport.length) {
        this.DailyAppointmentReportData = res.Results.DailyAppointmentReport;
        this.SummaryData = res.Results.DailyAppointmentReportSummary[0];
      }
      else {
        this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, ['Data is Not Available Between Selected Parameter ....Try Different']);
        this.DailyAppointmentReportData = new Array<RPT_APPT_DailyAppointmentReportModel>();
      }
    }
    else {
      this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, [res.ErrorMessage]);
      this.DailyAppointmentReportData = new Array<RPT_APPT_DailyAppointmentReportModel>();
    }
  }

  //on click grid export button we are catching in component an event.. 
  //and in that event we are calling the server excel export....
  OnGridExport($event: GridEmitModel) {
    this.dlService.ReadExcel("/ReportingNew/ExportToExcelDailyAppointment?FromDate="
      + this.CurrentDailyAppointment.fromDate + "&ToDate=" + this.CurrentDailyAppointment.toDate
      + "&DoctorId=" + this.CurrentDailyAppointment.DoctorId + "&AppointmentType=" + this.CurrentDailyAppointment.AppointmentType
      + "&SchemeId=" + this.CurrentDailyAppointment.SchemeId)
      .map(res => res)
      .subscribe(data => {
        let blob = data;
        let a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "DailyAppointment_" + moment().format("DD-MMM-YYYY_HHmmA") + '.xls';
        document.body.appendChild(a);
        a.click();
      },
        res => this.ErrorMsg(res));
  }
  ErrorMsg(err) {
    this._messageBoxService.showMessage("error", ["Sorry!!! Not able export the excel file."]);
    console.log(err.ErrorMessage);
  }

  loadDoctorsList() {
    this.dlService.Read("/Reporting/GetDoctorList")
      .map(res => res)
      .subscribe(res => {
        if (res.Status == "OK") {
          this.doctorList = res.Results;
        }
      });
  }

  myListFormatter(data: any): string {
    let html = data["FullName"];
    return html;
  }

  providerChanged() {
    this.CurrentDailyAppointment.DoctorId = this.selProvider ? this.selProvider.EmployeeId : null;
  }

  //Anjana:11June'20--reusable From-ToDate-In Reports..
  OnFromToDateChange($event) {
    this.fromDate = $event ? $event.fromDate : this.fromDate;
    this.toDate = $event ? $event.toDate : this.toDate;

    this.CurrentDailyAppointment.fromDate = this.fromDate;
    this.CurrentDailyAppointment.toDate = this.toDate;
  }
  ngAfterViewChecked() {
    var myElement = document.getElementById("summaryFooter");
    if (myElement) {
      this.footer = document.getElementById("summaryFooter").innerHTML;
    }
  }

  SchemeFormatter(data: any): string {
    let html = data["SchemeName"];
    return html;
  }

  OnSchemeChange(): void {
    if (this.SelectedScheme && typeof (this.SelectedScheme) === "object" && this.SelectedScheme.SchemeId) {
      this.CurrentDailyAppointment.SchemeId = this.SelectedScheme.SchemeId;
    }
    else {
      this.SelectedScheme = new RPT_SchemeDTO();
      this.CurrentDailyAppointment.SchemeId = null;
    }
  }
}
