import { Component, OnInit } from '@angular/core';
import * as moment from 'moment/moment';
import { BillingBLService } from '../../../billing/shared/billing.bl.service';
import { ServiceItemsDetailsForReport_DTO } from '../../../billing/shared/dto/bill-report-service-items-details.dto';
import { CoreService } from "../../../core/shared/core.service";
import { BillServiceItemSchemeSetting_DTO } from '../../../settings-new/billing/shared/dto/bill-service-item-scheme-setting.dto';
import { BillingScheme_DTO } from '../../../settings-new/billing/shared/dto/billing-scheme.dto';
import { ServiceDepartment } from '../../../settings-new/shared/service-department.model';
import { SettingsBLService } from '../../../settings-new/shared/settings.bl.service';
import { DanpheHTTPResponse } from '../../../shared/common-models';
import { CommonFunctions } from '../../../shared/common.functions';
import { IGridFilterParameter } from '../../../shared/danphe-grid/grid-filter-parameter.interface';
import { DLService } from "../../../shared/dl.service";
import { MessageboxService } from '../../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponses } from '../../../shared/shared-enums';
import { ItemwiseCopayReport_DTO } from '../../shared/dto/item-wise-copay-report.dto';
import { ReportingService } from "../../shared/reporting-service";

@Component({
  selector: 'itemwise-copay-report',
  templateUrl: './itemwise-copay-report.html'
})
export class RPT_BIL_ItemWiseCopaymentReportComponent implements OnInit {

  public fromDate: string = null;
  public toDate: string = null;
  public dateRange: string = "";
  //below variables are for calcuation of summary amounts.
  public tot_CashSales: number = 0;
  public tot_CreditSales: number = 0;
  public tot_ReturnCreditSales: number = 0;

  public tot_NetSales: number = 0;
  public ServiceDepartmentList: Array<ServiceDepartment> = new Array<ServiceDepartment>();
  public AdvanceFilterPopup: boolean = false;
  ItemWiseCopaymentData: Array<ItemwiseCopayReport_DTO> = new Array<ItemwiseCopayReport_DTO>();

  public footerContent = '';
  public tot_CoPayCreditAmount: number = 0;
  public tot_CoPayCashAmount: number = 0;
  public tot_RetCoPayCashAmount: number = 0;
  public tot_NetCoPayCreditAmount: number = 0;
  public tot_NetCoPayCashAmount: number = 0;
  public tot_RetCoPayCreditAmount: number = 0;
  public FilterParameters: IGridFilterParameter[] = [];
  public selectedServiceDepartmet: string = '';
  public ItemName: string = "";
  public selectedDepartment = new BillServiceItemSchemeSetting_DTO();
  public ServiceDepartmentIds: number[] = [];
  public SchemeList = new Array<BillingScheme_DTO>();
  public selectedSchemePriceCategory: SchemePriceCategoryCustomType = { SchemeId: 0, PriceCategoryId: 0 };
  public SchemeIds: number[] = [];
  public AdvanceFilterType = { BillingType: '', PolicyNo: '', IsCopay: false, ServiceItemIds: '' };
  public ServiceItems = new Array<ServiceItemsDetailsForReport_DTO>();
  public selectedItem: ServiceItemsDetailsForReport_DTO = new ServiceItemsDetailsForReport_DTO();
  ItemWiseCopayReportGridCols: unknown;
  SelectedScheme = new BillServiceItemSchemeSetting_DTO();
  constructor(
    public dlService: DLService,
    public msgBoxServ: MessageboxService,
    public coreService: CoreService,
    public reportServ: ReportingService,
    public settingsBLService: SettingsBLService,
    public billingBlService: BillingBLService

  ) {
    this.ItemWiseCopayReportGridCols = typeof (this.reportServ.reportGridCols.ItemWiseCopaymentReport);
    this.ItemWiseCopayReportGridCols = this.reportServ.reportGridCols.ItemWiseCopaymentReport;

    this.GetAllDepartmentList();
    this.SchemeList = this.coreService.SchemeList;
    if (this.SchemeList && this.SchemeList.length > 0) {
      this.SchemeList = this.SchemeList.filter(scheme => scheme.IsCoPayment === true);
    }

    this.GetItemsList();
  }
  ngOnInit() {
    // this.getServiceItemList();
  }
  ngAfterViewChecked() {
    if (document.getElementById("dvSummary_ItemWiseCopaymentReport") !== null)
      this.footerContent = document.getElementById("dvSummary_ItemWiseCopaymentReport").innerHTML;
  }

  gridExportOptions = {
    fileName: 'IncomeSegregation_' + moment().format('YYYY-MM-DD') + '.xls'
  };

  public loading: boolean = false;

  Load() {
    this.ItemWiseCopaymentData = [];
    this.ServiceDepartmentIds = !!this.ServiceDepartmentIds ? this.ServiceDepartmentIds : null;
    this.SchemeIds = !!this.SchemeIds ? this.SchemeIds : null;

    if (this.fromDate != null && this.toDate != null) {
      this.dlService.Read("/BillingReports/ItemWiseCopaymentReport?FromDate="
        + this.fromDate + "&ToDate=" + this.toDate + "&PolicyNo=" + this.AdvanceFilterType.PolicyNo + "&IsCopay=" + this.AdvanceFilterType.IsCopay +
        "&BillingType=" + this.AdvanceFilterType.BillingType + "&SchemeIds=" + this.SchemeIds + "&ServiceItemIds=" + this.AdvanceFilterType.ServiceItemIds + "&ServiceDepartmentIds=" + this.ServiceDepartmentIds)
        .map(res => res)
        .finally(() => { this.loading = false; })
        .subscribe(res => this.Success(res),
          res => this.Error(res));
      this.FilterParameters = [
        { DisplayName: "Service Department", Value: this.selectedServiceDepartmet !== '' ? this.selectedServiceDepartmet : 'All' },
        { DisplayName: "DateRange", Value: `<b>From:</b>&nbsp;${this.fromDate}&nbsp;<b>To:</b>&nbsp;${this.toDate}` },
      ];
    }
    else {
      this.msgBoxServ.showMessage("error", ['Dates Provided is not Proper']);
    }
    this.CloseAdvanceFilter();

  }
  Error(err) {
    this.msgBoxServ.showMessage("error", [err]);
  }

  Success(res) {
    if (res.Status == "OK" && res.Results.length > 0) {
      this.ItemWiseCopayReportGridCols = this.reportServ.reportGridCols.ItemWiseCopaymentReport;
      this.ItemWiseCopaymentData = res.Results;
      this.CalculateSummaryAmounts(this.ItemWiseCopaymentData);
      this.FormatAmountsForGrid(this.ItemWiseCopaymentData);//pass this data for formatting.
      this.LoadExportOptions();

    }
    else if (res.Status === ENUM_DanpheHTTPResponses.OK && res.Results.length === 0) {
      this.msgBoxServ.showMessage("notice-message", ["No Data is Available For Selcted Parameter"]);
      this.ItemWiseCopayReportGridCols = this.reportServ.reportGridCols.ItemWiseCopaymentReport;
      this.ItemWiseCopaymentData = res.Results;
    }
    else {
      this.msgBoxServ.showMessage("failed", [res.ErrorMessage]);
    }
  }

  //Function to parse each amount properites
  public FormatAmountsForGrid(ipDataArr: Array<any>) {
    if (ipDataArr && ipDataArr.length) {
      ipDataArr.forEach(itm => {
        itm.CashSales = CommonFunctions.parseAmount(itm.CashSales);
        itm.TotalSalesQty = CommonFunctions.parseAmount(itm.TotalSalesQty);
        itm.NetSales = CommonFunctions.parseAmount(itm.NetSales);
        itm.ReturnCreditSales = CommonFunctions.parseAmount(itm.ReturnCreditSales);
        itm.NetSales = CommonFunctions.parseAmount(itm.NetSales);
        itm.ReturnQty = CommonFunctions.parseAmount(itm.ReturnQty);
        itm.NetQuantity = CommonFunctions.parseAmount(itm.NetQuantity);
        itm.TotalCoPayCashAmount = CommonFunctions.parseAmount(itm.TotalCoPayCashAmount);
        itm.TotalCoPayCreditAmount = CommonFunctions.parseAmount(itm.TotalCoPayCreditAmount);
        itm.RetCoPayCashAmount = CommonFunctions.parseAmount(itm.RetCoPayCashAmount);
        itm.RetCopayCreditAmount = CommonFunctions.parseAmount(itm.RetCopayCreditAmount);
        itm.NetCoPayCashAmount = CommonFunctions.parseAmount(itm.NetCoPayCashAmount);
        itm.NetCoPayCreditAmount = CommonFunctions.parseAmount(itm.NetCoPayCreditAmount);

      });
    }
  }

  public CalculateSummaryAmounts(ipDataArr: Array<any>) {
    //resetting all Sum variables to ZERO.
    this.tot_CreditSales = this.tot_ReturnCreditSales = this.tot_ReturnCreditSales = this.tot_NetSales = this.tot_CoPayCreditAmount = this.tot_CoPayCashAmount = this.tot_RetCoPayCashAmount = this.tot_RetCoPayCreditAmount = this.tot_NetCoPayCreditAmount = this.tot_NetCoPayCashAmount = 0;

    if (ipDataArr && ipDataArr.length) {
      ipDataArr.forEach(itm => {
        if (itm.BillingType === 'CreditSales') {
          this.tot_CreditSales += itm.TotalAmount;
          this.tot_CoPayCreditAmount += itm.CoPayCreditAmount;
          this.tot_CoPayCashAmount += itm.CoPayCashAmount;
        }
        if (itm.BillingType === 'ReturnCreditSales') {
          this.tot_ReturnCreditSales += itm.TotalAmount;
          this.tot_RetCoPayCreditAmount += itm.CoPayCreditAmount;
          this.tot_RetCoPayCashAmount += itm.CoPayCashAmount;
        }

      });
      this.tot_NetSales = this.tot_CreditSales - this.tot_ReturnCreditSales;
      this.tot_NetCoPayCashAmount = this.tot_CoPayCashAmount - this.tot_RetCoPayCashAmount;
      this.tot_NetCoPayCreditAmount = this.tot_CoPayCreditAmount - this.tot_RetCoPayCreditAmount;
      this.tot_CreditSales = CommonFunctions.parseAmount(this.tot_CreditSales);
      this.tot_ReturnCreditSales = CommonFunctions.parseAmount(this.tot_ReturnCreditSales);
      this.tot_CoPayCreditAmount = CommonFunctions.parseAmount(this.tot_CoPayCreditAmount);
      this.tot_CoPayCashAmount = CommonFunctions.parseAmount(this.tot_CoPayCashAmount);
      this.tot_RetCoPayCreditAmount = CommonFunctions.parseAmount(this.tot_RetCoPayCreditAmount);
      this.tot_RetCoPayCashAmount = CommonFunctions.parseAmount(this.tot_RetCoPayCashAmount);
      this.tot_NetSales = CommonFunctions.parseAmount(this.tot_NetSales);
      this.tot_NetCoPayCashAmount = CommonFunctions.parseAmount(this.tot_NetCoPayCashAmount);
      this.tot_NetCoPayCreditAmount = CommonFunctions.parseAmount(this.tot_NetCoPayCreditAmount);
    }

  }

  LoadExportOptions() {

    this.gridExportOptions = {
      fileName: 'ItemWiseCopaymentReport' + moment().format('YYYY-MM-DD') + '.xls',
    };
  }
  ErrorMsg(err) {
    this.msgBoxServ.showMessage("error", ["Sorry!!! Not able export the excel file."]);
    console.log(err.ErrorMessage);
  }


  //-reusable From-ToDate-In Reports..
  OnFromToDateChange($event) {
    this.fromDate = $event ? $event.fromDate : this.fromDate;
    this.toDate = $event ? $event.toDate : this.toDate;
    this.dateRange = "<b>Date:</b>&nbsp;" + this.fromDate + "&nbsp;<b>To</b>&nbsp;" + this.toDate;
  }
  GetAllDepartmentList() {
    this.dlService.Read("/BillingReports/GetAllDepartmentList")
      .map(res => res)
      .subscribe(res => {
        if (res.Status == "OK") {
          this.ServiceDepartmentList = res.Results;
        }
        else {
          this.msgBoxServ.showMessage("Notice-Message", ["Failed to load department list."]);
        }
      }, err => {
        console.log(err);
        this.msgBoxServ.showMessage("Failed", ["Failed to load department list."]);
      });
  }

  SelectDepartment($event) {
    if ($event) {
      this.selectedDepartment = new BillServiceItemSchemeSetting_DTO();
      let ServiceDepartmentIds = $event.map((a) => a.ServiceDepartmentId);
      this.ServiceDepartmentIds = ServiceDepartmentIds.join(',');
    }
  }
  SelectScheme($event) {
    if ($event) {
      this.SelectedScheme = new BillServiceItemSchemeSetting_DTO();
      let schemeIds = $event.map((a) => a.SchemeId);
      this.SchemeIds = schemeIds.join(',');
    }
  }

  CloseAdvanceFilter() {
    if (this.AdvanceFilterPopup === true) {
      // this.SchemeId = 0;
    }
    this.AdvanceFilterPopup = false;
    // Reinitialize the values to the default state
    // this.ServiceDepartmentIds = [];
    this.AdvanceFilterType = { BillingType: '', PolicyNo: '', IsCopay: false, ServiceItemIds: '' };
    ;

  }
  AdvanceSearch() {
    this.AdvanceFilterPopup = true;
  }
  GetItemsList() {
    this.billingBlService.GetMasterServiceItems().subscribe((res: DanpheHTTPResponse) => {
      if (res.Status === ENUM_DanpheHTTPResponses.OK) {
        this.ServiceItems = res.Results;
      } else {
        this.msgBoxServ.showMessage(ENUM_DanpheHTTPResponses.Failed, ['No items found']);
      }
    }, (error) => {
      console.log('Error retrieving items list:', error.message);
    });
  }
  SelectItems($event) {
    if ($event) {
      this.selectedItem = new ServiceItemsDetailsForReport_DTO();
      let Items = $event.map((a) => a.ServiceItemId);
      this.AdvanceFilterType.ServiceItemIds = Items.join(',');

    }
  }
}
