import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import * as moment from 'moment';
import { DanpheHTTPResponse } from '../../../shared/common-models';
import { CommonFunctions } from '../../../shared/common.functions';
import { IGridFilterParameter } from '../../../shared/danphe-grid/grid-filter-parameter.interface';
import { NepaliDateInGridColumnDetail, NepaliDateInGridParams } from '../../../shared/danphe-grid/NepaliColGridSettingsModel';
import { DLService } from '../../../shared/dl.service';
import { MessageboxService } from '../../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status } from '../../../shared/shared-enums';
import { PharmacyBLService } from '../../shared/pharmacy.bl.service';
import { PHRMGenericModel } from '../../shared/phrm-generic.model';
import PHRMGridColumns from '../../shared/phrm-grid-columns';

@Component({
  selector: 'app-item-wise-purchase-report',
  templateUrl: './item-wise-purchase-report.component.html',
  styleUrls: ['./item-wise-purchase-report.component.css']
})
export class ItemWisePurchaseReportComponent implements OnInit {

  ItemWisePurchaseReportColumns: Array<any> = null;
  ItemWisePurchaseReportData: Array<any> = new Array<any>();
  public FromDate: string = null;
  public ItemName: string = null;
  public ToDate: string = null;
  public itemList: Array<any> = new Array<any>();
  public selectedItem: any;
  public itemId: number = null;
  public NepaliDateInGridSettings: NepaliDateInGridParams = new NepaliDateInGridParams();
  public storeId: number = null;
  public purchaseForm = new FormGroup({ InvoiceNo: new FormControl(''), GRNo: new FormControl('') });
  invoiceNo: number = null;
  goodReceiptNo: number = null;
  grandTotal: any = { totalPurchaseQty: 0, totPurchaseVal_VatExcluded: 0, totVatAmount: 0, totPurchaseValue: 0, totalMarginPurchase: 0, totalMarginSale: 0, totalSalesValue: 0 };
  public footerContent = '';
  public dateRange: string = "";

  public supplierId: number = null;
  public selectedSupplier: any;
  public supplierList: Array<any> = new Array<any>();
  loading: boolean;
  GenericId: number = null;
  SelectedGeneric: PHRMGenericModel = new PHRMGenericModel();
  genericList: Array<PHRMGenericModel> = new Array<PHRMGenericModel>();
  IsSummaryView: boolean = false;
  GenericList: { GenericId: null, GenericName: '' }[] = [];
  GenericName: string = null;
  GenericWisePurchaseSummaryReportData: GenericWisePurchaseSummaryReportVM[] = [];
  GenericWisePurchaseSummaryReportColumns: Array<any> = null;
  FilterParameters: IGridFilterParameter[] = [];
  SupplierName: string = null;

  constructor(public pharmacyBLService: PharmacyBLService, public dlService: DLService,
    public msgBoxServ: MessageboxService, public changeDetector: ChangeDetectorRef) {
    this.FromDate = moment().format("YYYY-MM-DD");
    this.ToDate = moment().format("YYYY-MM-DD");
    this.ItemWisePurchaseReportColumns = PHRMGridColumns.ItemWisePurchaseList;
    this.GetItemMasterlist();
    this.GetSupplierListDetails();
    this.GetGenericlist();
    this.NepaliDateInGridSettings.NepaliDateColumnList.push(new NepaliDateInGridColumnDetail("GoodReceiptDate", false));
    this.GenericWisePurchaseSummaryReportColumns = PHRMGridColumns.GenericWisePurchaseSummaryReportColumns;
  }
  ngOnInit() {
  }
  ngAfterViewChecked() {
    if (!this.IsSummaryView) {
      this.footerContent = document.getElementById("print_summary").innerHTML;
    }
  }

  public GetItemMasterlist(): void {
    try {
      this.pharmacyBLService.GetItemMasterList()
        .subscribe(res => {
          this.itemList = res.Results;
        });
    }
    catch (exception) {
      this.ShowCatchErrMessage(exception);
    }
  }
  public GetGenericlist(): void {
    try {
      this.pharmacyBLService.GetGenericListWithoutPriceCategory()
        .subscribe(res => {
          this.GenericList = res.Results;
        });
    }
    catch (exception) {
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
  public GetGenericList() {
    this.pharmacyBLService.GetGenericListWithoutPriceCategory()
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this.genericList = res.Results;
        } else {
          this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ["Failed to load Generics."]);
        }
      }, err => {
        this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, ["Failed to load Generics." + err]);
      });
  }
  OnChangeGeneric() {
    if (this.SelectedGeneric && this.SelectedGeneric.GenericId > 0) {
      this.GenericId = this.SelectedGeneric.GenericId;
      this.GenericName = this.SelectedGeneric.GenericName;
    }
    else {
      this.GenericId = null;
      this.GenericName = null;
    }
  }
  GenericListFormatter(data): string {
    let html = data["GenericName"];
    return html;
  }

  onChangeItem($event) {
    try {
      if ($event.ItemId > 0) {
        this.itemId = this.selectedItem.ItemId;
      }
      else {
        this.itemId = null;
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
        this.itemId = null;
      }
    }
    catch (exception) {
      this.ShowCatchErrMessage(exception);
    }
  }
  CheckProperSelectedGeneric() {
    try {
      if ((typeof this.SelectedGeneric !== 'object') || (typeof this.SelectedGeneric === "undefined") || (typeof this.SelectedGeneric === null)) {
        this.SelectedGeneric = null;
        this.GenericId = null;
      }
    }
    catch (exception) {
      this.ShowCatchErrMessage(exception);
    }
  }
  myItemListFormatter(data: any): string {
    let html = data["ItemName"];//+ " |B.No.|" + data["BatchNo"] + " |M.R.P|" + data["SalePrice"];
    return html;
  }

  GetReportData() {
    if (this.FromDate == null || this.ToDate == null) {
      this.msgBoxServ.showMessage("Notice", ["Please Provide Valid Date."]);
      return;
    }
    else {
      this.loading = true;
      this.invoiceNo = this.purchaseForm.get('InvoiceNo').value == "" ? null : this.purchaseForm.get('InvoiceNo').value;
      this.goodReceiptNo = this.purchaseForm.get('GRNo').value == "" ? null : this.purchaseForm.get('GRNo').value;
      this.ItemWisePurchaseReportData = [];
      this.grandTotal = { totalPurchaseQty: 0, totalPurchaseValue: 0 };
      this.FilterParameters = [
        { DisplayName: "DateRange:", Value: this.dateRange },
        { DisplayName: "ItemName:", Value: this.ItemName == null ? 'All' : this.ItemName },
        { DisplayName: "GenericName:", Value: this.GenericName == null ? 'All' : this.GenericName },
        { DisplayName: "Supplier Name:", Value: this.SupplierName == null ? 'All' : this.SupplierName },
      ];
      this.pharmacyBLService.GetItemWisePurchaseReport(this.FromDate, this.ToDate, this.itemId, this.invoiceNo, this.goodReceiptNo, this.supplierId, this.GenericId)
        .finally(() => {
          this.loading = false;
          this.ResetFields();
        })
        .subscribe(res => {
          if (res.Status == 'OK' && res.Results.length > 0) {
            this.ItemWisePurchaseReportData = res.Results;
            this.ItemWisePurchaseReportData.forEach(i => {

              i.MarginPurchasePercentage = CommonFunctions.parseAmount(i.MarginPurchasePercentage, 4);
              i.MarginSalesPercentage = CommonFunctions.parseAmount(i.MarginSalesPercentage, 4);
              i.MarginPurchaseAmount = CommonFunctions.parseAmount(i.MarginPurchaseAmount, 4);
              i.MarginSalesAmount = CommonFunctions.parseAmount(i.MarginSalesAmount, 4);

              i.MarginPurchase = i.MarginPurchasePercentage + "% , " + i.MarginPurchaseAmount;
              i.MarginSales = i.MarginSalesPercentage + "% , " + i.MarginSalesAmount;
              i.SalesValue = i.SalePrice * i.ReceivedQuantity;
            });

            this.grandTotal.totalPurchaseQty = this.ItemWisePurchaseReportData.reduce((a, b) => a + b.ReceivedQuantity, 0);
            this.grandTotal.totPurchaseVal_VatExcluded = this.ItemWisePurchaseReportData.reduce((a, b) => a + b.SubTotal, 0);
            this.grandTotal.totVatAmount = this.ItemWisePurchaseReportData.reduce((a, b) => a + b.VATAmount, 0);
            this.grandTotal.totPurchaseValue = this.ItemWisePurchaseReportData.reduce((a, b) => a + b.TotalAmount, 0);
            this.grandTotal.totalMarginPurchase = this.ItemWisePurchaseReportData.reduce((a, b) => a + b.MarginPurchaseAmount, 0);
            this.grandTotal.totalMarginSale = this.ItemWisePurchaseReportData.reduce((a, b) => a + b.MarginSalesAmount, 0);
            this.grandTotal.totalSalesValue = this.ItemWisePurchaseReportData.reduce((a, b) => a + b.SalesValue, 0);
            this.changeDetector.detectChanges();
            this.footerContent = document.getElementById("print_summary").innerHTML;
          } else {
            this.ItemWisePurchaseReportData = null;
            this.msgBoxServ.showMessage("Notice-Message", ["Could not find records."])
          }
          this.loading = false;

        });
    }
  }
  OnFromToDateChange($event) {
    if ($event) {
      this.FromDate = $event.fromDate;
      this.ToDate = $event.toDate;
      this.dateRange = "<b>Date:</b>&nbsp;" + this.FromDate + "&nbsp;<b>To</b>&nbsp;" + this.ToDate;
    }
  }
  gridExportOptions = {
    fileName: 'PharmacyItemWisePurchaseReport_' + moment().format('YYYY-MM-DD') + '.xls',
  };

  //start: sud/ramesh/sanjit:4Sept'21--Adding suppliers in the same report..
  public GetSupplierListDetails(): void {
    try {
      this.pharmacyBLService.GetSupplierList()
        .subscribe(res => this.CallBackGetSupplierTypeList(res));
    }
    catch (exception) {
      this.ShowCatchErrMessage(exception);
    }
  }

  CallBackGetSupplierTypeList(res) {
    try {
      if (res.Status == 'OK') {
        if (res.Results) {
          this.supplierList = new Array<any>();
          this.supplierList = res.Results;
        }
      }
      else {
        err => {
          this.msgBoxServ.showMessage("failed", ['failed to get items..']);
        }
      }
    }
    catch (exception) {
      this.ShowCatchErrMessage(exception);
    }
  }



  mySupplierListFormatter(data: any): string {
    let html = data["SupplierName"];
    return html;
  }


  public SupplierSrchBoxOnFocusOut($event) {
    let supp = null;
    // check if user has given proper input string for item name
    //or has selected object properly from the dropdown list.
    if (this.selectedSupplier) {
      if (typeof (this.selectedSupplier) == 'string' && this.supplierList.length) {
        supp = this.supplierList.find(a => a.SupplierName.toLowerCase() == this.selectedSupplier.toLowerCase());
      }
      else if (typeof (this.selectedSupplier) == 'object') {
        supp = this.selectedSupplier;
      }
      if (supp) {
        this.supplierId = this.selectedSupplier.SupplierId;
      }
      else
        this.supplierId = null;
    }
    else {
      this.supplierId = null;
    }

  }


  LoadItemWiseSummaryReport() {
    if (!this.FromDate || !this.ToDate) {
      this.msgBoxServ.showMessage("Notice", ["Please Provide Valid Date."]);
      return;
    }
    this.loading = true;
    this.GenericWisePurchaseSummaryReportData = [];
    this.FilterParameters = [
      { DisplayName: "DateRange:", Value: this.dateRange },
      { DisplayName: "GenericName:", Value: this.GenericName == null ? 'All' : this.GenericName },
      { DisplayName: "Supplier Name:", Value: this.SupplierName == null ? 'All' : this.SupplierName },
    ];
    this.pharmacyBLService.GetGenericWisePurchaseSummaryReport(this.FromDate, this.ToDate, this.GenericId, this.supplierId).finally(() => {
      this.loading = false;
      this.ResetFields();
    }).subscribe((res: DanpheHTTPResponse) => {
      if (res.Status === ENUM_DanpheHTTPResponses.OK) {
        this.GenericWisePurchaseSummaryReportData = res.Results;
        this.GenericWisePurchaseSummaryReportData.forEach(i => {
          i.MarginPurchasePercentage = CommonFunctions.parseAmount(i.MarginPurchasePercentage, 4);
          i.MarginPurchaseAmount = CommonFunctions.parseAmount(i.MarginPurchaseAmount, 4);
          i.MarginPurchase = i.MarginPurchasePercentage + "% , " + i.MarginPurchaseAmount;
        });

      }
      else {
        this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ["Failed to get Generic Wise Purchase Summary Report."]);
      }
    }, err => {
      this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, ["Failed to get Generic Wise Purchase Summary Report." + err]);
    });
  }
  gridExportForGenericWisePurchaseSummaryReportOptions = {
    fileName: 'PharmacyGenericWisePurchaseSummaryReport' + moment().format('YYYY-MM-DD') + '.xls',
  };

  OnViewChange() {
    this.ResetFields();
  }


  private ResetFields() {
    this.SelectedGeneric = null;
    this.GenericId = null;
    this.GenericName = null;
    this.selectedItem = null;
    this.itemId = null;
    this.ItemName = null;
    this.selectedSupplier = null;
    this.supplierId = null;
    this.SupplierName = null;
    this.selectedItem = null;
  }



}

class GenericWisePurchaseSummaryReportVM {
  GenericName: string;
  Unit: string;
  PurchaseRate: number;
  Quantity: number;
  SupplierName: string;
  MarginPurchase: string = '';
  MarginPurchaseAmount: number = 0;
  MarginPurchasePercentage: number = 0;
}

