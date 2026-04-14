import { Component } from '@angular/core';
import * as moment from 'moment/moment';
import { PHRMDepositBalanceReportModel } from '../../../dispensary/shared/dispensary-deposit-balance-report.model';
import { ReportingService } from "../../../reporting/shared/reporting-service";
import { DLService } from "../../../shared/dl.service";
import { MessageboxService } from '../../../shared/messagebox/messagebox.service';
import { PharmacyBLService } from "../../shared/pharmacy.bl.service";
import PHRMReportsGridColumns from "../../shared/phrm-reports-grid-columns";
import { PHRMReportsModel } from "../../shared/phrm-reports-model";
@Component({
  selector: "my-app",
  templateUrl: "./phrm-deposit-balance-report.html"
})

export class PHRMDepositBalanceReport {                                        //"DepositBalanceReport"
  PHRMDepositBalanceReportColumn: Array<any> = null;
  PHRMDepositBalanceReportData: Array<PHRMDepositBalanceReportModel> = new Array<PHRMDepositBalanceReportModel>();
  public phrmReports: PHRMReportsModel = new PHRMReportsModel();
  dlService: DLService = null;
  public pharmacy: string = "pharmacy";

  constructor(
    public pharmacyBLService: PharmacyBLService,
    public msgBoxServ: MessageboxService,
    public reportServ: ReportingService,
    _dlService: DLService,

  ) {
    this.PHRMDepositBalanceReportColumn = PHRMReportsGridColumns.PHRMDepositBalanceReport;

    this.dlService = _dlService;
    this.Load();
  };

  //Export data grid options for excel file
  gridExportOptions = {
    fileName: 'PharmacyDepositBalanceReport_' + moment().format('YYYY-MM-DD') + '.xls',
  };

  Load() {
    this.pharmacyBLService.GetPhrmDepositBalanceReport()
      .subscribe(res => {
        if (res.Status == 'OK') {
          this.PHRMDepositBalanceReportColumn = PHRMReportsGridColumns.PHRMDepositBalanceReportColumns;;
          this.PHRMDepositBalanceReportData = res.Results;
        }
        else {

          this.msgBoxServ.showMessage("failed", [res.ErrorMessage])
        }
      });

  }

  ErrorMsg(err) {
    this.msgBoxServ.showMessage("error", ["Sorry!!! Not able export the excel file."]);
    console.log(err.ErrorMessage);
  }
}
