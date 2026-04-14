import { Component } from '@angular/core';
import { Router } from '@angular/router';
import * as moment from 'moment/moment';
import { SecurityService } from '../../security/shared/security.service';
import { MessageboxService } from '../../shared/messagebox/messagebox.service';
import { ENUM_MessageBox_Status } from '../../shared/shared-enums';
import WARDGridColumns from "../shared/ward-grid-cloumns";
import { WARDReportsModel } from '../shared/ward-report.model';
import { WardSupplyBLService } from "../shared/wardsupply.bl.service";


@Component({
  selector: 'my-app',

  templateUrl: "./requisition-report.html"

})
export class WardRequisitionReportComponent {

  WardRequisitionColumn: Array<any> = null;
  WardRequisitionData: Array<any> = [];
  public wardReports: WARDReportsModel = new WARDReportsModel();
  public CurrentStoreId: number = 0;

  constructor(public wardBLService: WardSupplyBLService, public msgBoxServ: MessageboxService, public router: Router, public securityService: SecurityService) {

    try {
      this.CurrentStoreId = this.securityService.getActiveStore().StoreId;
      if (!this.CurrentStoreId) {
        this.LoadSubStoreSelectionPage();
      }
      else {
        this.WardRequisitionColumn = WARDGridColumns.WardRequsitionReport;
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
    fileName: 'WardRequisitionReport' + moment().format('YYYY-MM-DD') + '.xls',
  };

  Load() {
    this.wardBLService.GetWardRequsitionReport(this.wardReports)
      .subscribe(res => {
        if (res.Status == 'OK' && res.Results.length) {
          this.WardRequisitionData = res.Results;
          this.WardRequisitionData.forEach(w => {
            if (w.RequestedDate) {
              w.RequestedDate = moment(w.RequestedDate).format('YYYY-MM-DD');
            }
            if (w.DispatchDate) {
              w.DispatchDate = moment(w.DispatchDate).format('YYYY-MM-DD');
            }
          })
        }
        else {

          this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Notice, [res.ErrorMessage])
        }
      });

  }
}
