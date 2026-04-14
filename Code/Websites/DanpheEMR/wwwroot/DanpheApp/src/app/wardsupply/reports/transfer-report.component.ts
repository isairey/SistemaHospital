import { Component } from '@angular/core';
import { Router } from '@angular/router';
import * as moment from 'moment/moment';
import { SecurityService } from '../../security/shared/security.service';
import { IGridFilterParameter } from '../../shared/danphe-grid/grid-filter-parameter.interface';
import { MessageboxService } from '../../shared/messagebox/messagebox.service';
import { ENUM_MessageBox_Status } from '../../shared/shared-enums';
import WARDGridColumns from "../shared/ward-grid-cloumns";
import { WARDReportsModel } from '../shared/ward-report.model';
import { WardSupplyBLService } from "../shared/wardsupply.bl.service";


@Component({
  selector: 'my-app',

  templateUrl: "./transfer-report.html"

})
export class WardTransferReportComponent {

  public calType: string = "";
  public status: string = "";
  public CurrentStoreId: number = 0;
  WardTransferReportColumn: Array<any> = null;
  WardTransferData: Array<any> = new Array<WARDReportsModel>();
  public wardReports: WARDReportsModel = new WARDReportsModel();
  dateRange: string;
  FilterParameters: IGridFilterParameter[] = [];

  constructor(public wardBLService: WardSupplyBLService, public msgBoxServ: MessageboxService,
    public router: Router, public securityService: SecurityService) {
    try {
      this.CurrentStoreId = this.securityService.getActiveStore().StoreId;
      if (!this.CurrentStoreId) {
        this.LoadSubStoreSelectionPage();
      }
      else {
        this.WardTransferReportColumn = WARDGridColumns.WardTransferReport;
        this.wardReports.FromDate = moment().format('YYYY-MM-DD');
        this.wardReports.ToDate = moment().format('YYYY-MM-DD');
        this.wardReports.StoreId = this.CurrentStoreId;
      }
    } catch (exception) {
      this.msgBoxServ.showMessage("Error", [exception]);
    }
  };

  LoadSubStoreSelectionPage() {
    this.router.navigate(['/WardSupply/Pharmacy']);
  }

  //Export data grid options for excel file
  gridExportOptions = {
    fileName: 'WardTransferReport' + moment().format('YYYY-MM-DD') + '.xls',
  };

  Load() {
    this.FilterParameters = [
      { DisplayName: "DateRange", Value: this.dateRange }
    ]
    this.wardBLService.GetWardTransferReport(this.wardReports)
      .subscribe(res => {
        if (res.Status == 'OK' && res.Results.length) {
          this.WardTransferData = res.Results;
          this.WardTransferData.forEach(t => {
            if (t.Date) {
              t.Date = moment(t.Date).format('YYYY-MM-DD');
            }
          })
        }
        else {

          this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Notice, ["No Data Found"])
        }
      });

  }
  ngAfterViewChecked() {
    this.dateRange = "<b>From:</b>&nbsp;" + this.wardReports.FromDate + "&nbsp;<b>To:</b>&nbsp;" + this.wardReports.ToDate;
  }

}
