import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import * as moment from 'moment/moment';
import { DanpheHTTPResponse } from '../../../shared/common-models';
import { NepaliDateInGridColumnDetail, NepaliDateInGridParams } from '../../../shared/danphe-grid/NepaliColGridSettingsModel';
import { IGridFilterParameter } from '../../../shared/danphe-grid/grid-filter-parameter.interface';
import { DLService } from "../../../shared/dl.service";
import { MessageboxService } from '../../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status } from '../../../shared/shared-enums';
import { PharmacyBLService } from "../../shared/pharmacy.bl.service";
import PHRMReportsGridColumns from "../../shared/phrm-reports-grid-columns";
import { PHRMExpiryReportData_DTO } from './phrm-expiry-report-data.dto';

@Component({
  selector: 'phrm-expiry',
  templateUrl: "./phrm-expiry-report.html"
})
export class PHRMExpiryReportComponent implements OnInit {

  PHRMExpiryReportColumns: Array<any> = null;
  PHRMExpiryData: PHRMExpiryReportData_DTO[] = [];
  ItemId: number = null;
  SelectedItem: { ItemId: number, ItemName: string };
  StoreList: { StoreId: number, Name: string }[] = [];
  SelectedStore: { StoreId: number, Name: string };
  StoreId: number = null;
  FromDate: string = moment().format('YYYY-MM-DD');
  ToDate: string = moment().format('YYYY-MM-DD');
  allItemList: any[] = [];
  DateRange: string = "";
  Loading: boolean = false;
  IsNearlyExpired: boolean = false;
  IsExpired: boolean = false;
  NewPHRMExpiryData: PHRMExpiryReportData_DTO[] = [];
  GenericList: { GenericId: number, GenericName: string }[] = [];
  SelectedGeneric: { GenericId: number, GenericName: string };
  GenericId: number = null;
  GenericName: string = null;
  ItemName: string = null;
  StoreName: string = null;
  FilterParameters: IGridFilterParameter[] = [];
  NepaliDateInGridSettings: NepaliDateInGridParams = new NepaliDateInGridParams();
  TotalCostValue: number = 0;
  TotalSalesValue: number = 0;
  footer: string = '';

  constructor(public pharmacyBLService: PharmacyBLService, public dlService: DLService, public messageBoxService: MessageboxService, public changeDetector: ChangeDetectorRef) {
    this.PHRMExpiryReportColumns = PHRMReportsGridColumns.PHRMExpiryReport;
    this.NepaliDateInGridSettings.NepaliDateColumnList.push(new NepaliDateInGridColumnDetail("ExpiryDate", false));

    this.GetItemList();
    this.GetGenericList();
    this.GetActiveStore();
  }
  ngOnInit() {

  }
  GetItemList() {
    this.pharmacyBLService.GetItemList()
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this.allItemList = res.Results;
        }
        else {
          this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ["Failed to load item data." + res.ErrorMessage]);
        }
      }, (err) => {
        this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ["Failed to load item data." + err.ErrorMessage]);
      });
  }

  GetActiveStore() {
    this.pharmacyBLService.GetActiveStore()
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this.StoreList = res.Results;
        }
        else {
          console.log('Failed to load store list');
        }
      });
  }

  GetReportData() {
    if (this.FromDate == null || this.ToDate == null) {
      this.messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, ['Please select valid date']);
    }

    this.FilterParameters = [
      { DisplayName: 'DateRange', Value: this.DateRange },
      { DisplayName: 'GenericName', Value: this.GenericName != null ? this.GenericName : 'All' },
      { DisplayName: 'ItemName', Value: this.ItemName != null ? this.ItemName : 'All' },
      { DisplayName: 'StoreName', Value: this.StoreName != null ? this.StoreName : 'All' },
    ]
    this.Loading = true;
    this.pharmacyBLService.GetExpiryReport(this.ItemId, this.GenericId, this.StoreId, this.FromDate, this.ToDate).finally(() => {
      this.Loading = false;
      this.ResetInputFields();
    }).subscribe(res => {
      if (res.Status == ENUM_DanpheHTTPResponses.OK) {
        this.PHRMExpiryData = res.Results;
        this.NewPHRMExpiryData = res.Results;
        this.CalculateSummary();

      }
      else {
        this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ["Failed to retrieve data"]);
      }
    });

  }
  private ResetInputFields() {
    this.IsNearlyExpired = false;
    this.IsExpired = false;
    this.SelectedGeneric = null;
    this.SelectedItem = null;
    this.SelectedStore = null;
    this.StoreId = null;
    this.ItemId = null;
    this.GenericId = null;
  }

  ShowNearlyExpiredItem() {
    this.IsExpired = false;
    let date = new Date();
    let dateNow = moment(date.setMonth(date.getMonth() + 0)).format('YYYY-MM-DD');
    let dateThreeMonth = moment(date.setMonth(date.getMonth() + 3)).format('YYYY-MM-DD');
    if (this.IsNearlyExpired == true) {
      this.PHRMExpiryData = this.NewPHRMExpiryData.filter(a => moment(a.ExpiryDate).format('YYYY-MM-DD') < dateThreeMonth && moment(a.ExpiryDate).format('YYYY-MM-DD') > dateNow);
    } else {
      this.PHRMExpiryData = this.NewPHRMExpiryData;
    }
    this.CalculateSummary();
  }
  ShowExpiredItem() {
    this.IsNearlyExpired = false;
    let date = new Date();
    let dateNow = moment(date.setMonth(date.getMonth() + 0)).format('YYYY-MM-DD');
    if (this.IsExpired == true) {
      this.PHRMExpiryData = this.NewPHRMExpiryData.filter(a => moment(a.ExpiryDate).format('YYYY-MM-DD') <= dateNow);
    } else {
      this.PHRMExpiryData = this.NewPHRMExpiryData;
    }
    this.CalculateSummary();
  }

  ItemListFormatter(data: any): string {
    let html = data["ItemName"];
    return html;
  }

  GenericListFormatter(data: any): string {
    let html = data["GenericName"];
    return html;
  }
  StoreListFormatter(data: any): string {
    let html = data["Name"];
    return html;
  }

  onItemSelect() {
    if (this.SelectedItem) {
      this.ItemId = this.SelectedItem.ItemId;
      this.ItemName = this.SelectedItem.ItemName;
    }
    else {
      this.ItemId = null;
      this.ItemName = null;
    }
  }

  OnGenericSelect() {
    if (this.SelectedGeneric) {
      this.GenericId = this.SelectedGeneric.GenericId;
      this.GenericName = this.SelectedGeneric.GenericName;
    }
    else {
      this.GenericId = null;
      this.GenericName = null;
    }
  }
  OnStoreSelect() {
    if (this.SelectedStore) {
      this.StoreId = this.SelectedStore.StoreId;
      this.StoreName = this.SelectedStore.Name;
    }
    else {
      this.StoreId = null;
      this.StoreName = null;
    }
  }

  OnFromToDateChange($event) {
    if ($event) {
      this.FromDate = $event.fromDate;
      this.ToDate = $event.toDate;
    }
  }

  GetGenericList() {
    this.pharmacyBLService.GetGenericList()
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this.GenericList = res.Results;
        } else {
          console.log('Failed to get generic list');
        }
      });
  }

  ngAfterViewChecked() {
    this.DateRange = "<b>From:</b>&nbsp;" + this.FromDate + "&nbsp;<b>To</b>&nbsp;" + this.ToDate;
    if (document.getElementById("expiry-print_summary")) {
      this.footer = document.getElementById("expiry-print_summary").innerHTML;
    }
  }
  gridExportOptions = {

    fileName: 'Pharmacy_ExpiryReport_' + moment().format('YYYY-MM-DD') + '.xls',
  };


  CalculateSummary() {
    if (this.PHRMExpiryData && this.PHRMExpiryData.length) {
      this.TotalCostValue = this.PHRMExpiryData.reduce((a, b) => a + b.TotalCostValue, 0);
      this.TotalSalesValue = this.PHRMExpiryData.reduce((a, b) => a + b.TotalSalesValue, 0);
    }
    else {
      this.TotalCostValue = 0;
      this.TotalSalesValue = 0;
    }
  }


}
