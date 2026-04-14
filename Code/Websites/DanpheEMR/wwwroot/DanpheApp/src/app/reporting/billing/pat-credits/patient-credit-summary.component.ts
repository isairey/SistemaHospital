import { Component } from '@angular/core';
import * as moment from 'moment/moment';
import { ReportingService } from "../../../reporting/shared/reporting-service";
import { GridEmitModel } from "../../../shared/danphe-grid/grid-emit.model";
import { NepaliDateInGridColumnDetail, NepaliDateInGridParams } from '../../../shared/danphe-grid/NepaliColGridSettingsModel';
import { DLService } from "../../../shared/dl.service";
import { MessageboxService } from '../../../shared/messagebox/messagebox.service';
import { RPT_BIL_PatientCreditSummaryModel } from './patient-credit-summary.model';

@Component({
  templateUrl: "./patient-credit-summary.html"
})
export class RPT_BIL_PatientCreditSummaryComponent {
  public TodayDate: string = null;
  public dateRange: string = "";
  public patientName: string = "";
  public billing: string = "billing";
  public patientCreditSummary: RPT_BIL_PatientCreditSummaryModel = new RPT_BIL_PatientCreditSummaryModel();
  public NepaliDateInGridSettings: NepaliDateInGridParams = new NepaliDateInGridParams();
  patientCreditSummaryColumns: Array<any> = null;
  patientCreditSummaryData: Array<any> = new Array<any>();
  dlService: DLService = null;

  public loading: boolean = false;

  constructor(
    _dlService: DLService,
    public msgBoxServ: MessageboxService,
    public reportServ: ReportingService) {
    this.dlService = _dlService;
    this.patientCreditSummaryColumns = this.reportServ.reportGridCols.PatientCreditSummaryColumns;

    this.TodayDate = moment().format('DD-MM-YYYY');;
    this.patientCreditSummary.fromDate = moment().format('YYYY-MM-DD');
    this.patientCreditSummary.toDate = moment().format('YYYY-MM-DD');
    this.NepaliDateInGridSettings.NepaliDateColumnList.push(new NepaliDateInGridColumnDetail("CreatedOn", false));
    //this.Load();
  }

  gridExportOptions = {
    fileName: 'CreditSummary_' + moment().format('YYYY-MM-DD') + '.xls'
  };

  Load()
  //{
  //    this.dlService.Read("/BillingReports/PatientCreditBillSummary")
  //        .map(res => res)
  //        .subscribe(res => this.Success(res),
  //        res => this.Error(res));
  //}
  {
    if (this.patientCreditSummary.fromDate != null && this.patientCreditSummary.toDate != null) {
      this.dlService.Read("/BillingReports/PatientCreditBillSummary?FromDate="
        + this.patientCreditSummary.fromDate + "&ToDate=" + this.patientCreditSummary.toDate)
        .map(res => res)
        .finally(() => { this.loading = false; })
        .subscribe(res => this.Success(res),
          res => this.Error(res));
    } else {
      this.msgBoxServ.showMessage("notice-message", ["dates are not proper."]);
    }
  }
  Error(err) {
    this.msgBoxServ.showMessage("error", [err]);
  }
  Success(res) {
    if (res.Status == "OK" && res.Results.length > 0) {
      this.patientCreditSummaryData = res.Results.map(
        a => {
          return {
            ...a,
            CreatedOn: a.CreatedOn.split('T')[0]  // Splitting the date and keeping only the date portion
          };
        }
      );
    }
    else if (res.Status == "OK" && res.Results.length == 0) {
      this.msgBoxServ.showMessage("notice-message", ['No credit record is available.'])
      this.patientCreditSummaryData = res.Results;
    }
    else {
      this.msgBoxServ.showMessage("failed", [res.ErrorMessage]);
    }
  }

  //on click grid export button we are catching in component an event.. 
  //and in that event we are calling the server excel export....
  OnGridExport($event: GridEmitModel) {
    switch ($event.Action) {
      default:
        break;
    }
  }


  ErrorMsg(err) {
    this.msgBoxServ.showMessage("error", ["Sorry!!! Not able export the excel file."]);
    console.log(err.ErrorMessage);
  }
  //Anjana:11June'20--reusable From-ToDate-In Reports..
  OnFromToDateChange($event) {
    this.patientCreditSummary.fromDate = $event.fromDate;
    this.patientCreditSummary.toDate = $event.toDate;
    this.dateRange = "<b>Date:</b>&nbsp;" + this.patientCreditSummary.fromDate + "&nbsp;<b>To</b>&nbsp;" + this.patientCreditSummary.toDate;
  }
}
