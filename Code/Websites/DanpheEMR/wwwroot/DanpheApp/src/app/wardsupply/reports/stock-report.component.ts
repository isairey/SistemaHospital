import { Component } from '@angular/core';
import { Router } from '@angular/router';
import * as moment from 'moment/moment';
import { SecurityService } from '../../security/shared/security.service';
import { GridEmitModel } from "../../shared/danphe-grid/grid-emit.model";
import { DLService } from '../../shared/dl.service';
import { MessageboxService } from '../../shared/messagebox/messagebox.service';
import { ENUM_MessageBox_Status } from '../../shared/shared-enums';
import WARDGridColumns from "../shared/ward-grid-cloumns";
import { WardSupplyBLService } from "../shared/wardsupply.bl.service";


@Component({
  selector: 'my-app',

  templateUrl: "./stock-report.html"

})
export class WardStockReportComponent {

  public calType: string = "";

  public status: string = "";
  WardStockReportColumns: Array<any> = null;
  WardStockReportData: Array<any> = new Array<any>();
  itemList: Array<any> = new Array<any>();
  public selectedItem: any;
  public itemId: number = null;
  public CurrentStoreId: number = 0;

  constructor(public wardsupplyBLService: WardSupplyBLService,
    public dlService: DLService,
    public msgBoxServ: MessageboxService,
    public securityService: SecurityService,
    public router: Router) {

    try {
      this.CurrentStoreId = this.securityService.getActiveStore().StoreId;
      if (!this.CurrentStoreId) {
        this.LoadSubStoreSelectionPage();
      }
      else {
        this.WardStockReportColumns = WARDGridColumns.WardStockReport;
        this.getItemList();
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
    fileName: 'WardStockReport' + moment().format('YYYY-MM-DD') + '.xls',
  };

  public getItemList() {
    try {
      this.wardsupplyBLService.GetAllWardItemsStockDetailsList(this.CurrentStoreId)
        .subscribe(res => {
          if (res.Status == "OK") {
            if (res.Results.length) {
              this.itemList = [];
              this.itemList = res.Results;
            }
            else {
              this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Notice, ["Failed to get StockDetailsList."]);
            }
          }
        });

    } catch (exception) {
      this.ShowCatchErrMessage(exception);
    }
  }
  ShowCatchErrMessage(exception) {
    if (exception) {
      let ex: Error = exception;
      console.log("Error Messsage =>  " + ex.message);
      console.log("Stack Details =>   " + ex.stack);
    }
  }
  onChangeItem($event) {
    try {
      if ($event.ItemId > 0) {
        this.itemId = this.selectedItem.ItemId;
      }
      else {
        this.itemId = 0;
      }
    }
    catch (exception) {
      this.ShowCatchErrMessage(exception);
    }
  }
  CheckProperSelectedItem() {
    try {
      if ((typeof this.selectedItem !== 'object') || (typeof this.selectedItem === "undefined") || (typeof this.selectedItem === null)) {
        this.selectedItem = null;
        this.itemId = 0;
      }
    }
    catch (exception) {
      this.ShowCatchErrMessage(exception);
    }
  }
  //////Function Call on Button Click of Report
  GetReportData() {
    this.wardsupplyBLService.GetStockItemsReport(this.itemId, this.CurrentStoreId)
      .subscribe(res => {
        if (res.Status == 'OK' && res.Results.length > 0) {
          ////Assign report Column from GridConstant to PHRMStockItemsReportColumns
          this.WardStockReportColumns = WARDGridColumns.WardStockReport;
          ////Assign  Result to PHRMStockItemsReportData
          this.WardStockReportData = res.Results;
          this.WardStockReportData.forEach(w => {
            if (w.ExpiryDate) {
              w.ExpiryDate = moment(w.ExpiryDate).format('YYYY-MM-DD');
            }
          });
        }
        if (res.Status == 'OK' && res.Results.length == 0) {
          this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Notice, ["No Data is Available for Selected Record"]);
        }

      });

  }

  myItemListFormatter(data: any): string {
    let html = data["ItemName"] + " | " + data["GenericName"];
    return html;
  }

  ////on click grid export button we are catching in component an event.. 
  ////and in that event we are calling the server excel export....
  OnGridExport($event: GridEmitModel) {

    let summaryHeader = "Stock Items Report";
    this.dlService.ReadExcel("/WardSupplyReport/ExportToExcelPHRMStockItemsReport?ItemId=" + this.itemId
      + "&SummaryHeader=" + summaryHeader)
      .map(res => res)
      .subscribe(data => {
        let blob = data;
        let a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "StockItemsReport_" + moment().format("DD-MMM-YYYY_HHmmA") + '.xls';
        document.body.appendChild(a);
        a.click();
      },

        res => this.ErrorMsg(res));
  }
  ErrorMsg(err) {
    this.msgBoxServ.showMessage("error", ["Sorry!!! Not able export the excel file."]);
    console.log(err.ErrorMessage);
  }
}
