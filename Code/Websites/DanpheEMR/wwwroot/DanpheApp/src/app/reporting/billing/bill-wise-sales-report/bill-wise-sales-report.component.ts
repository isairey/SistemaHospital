import { Component, OnInit } from '@angular/core';
import * as moment from 'moment';
import { SettingsBLService } from '../../../settings-new/shared/settings.bl.service';
import { DanpheHTTPResponse } from '../../../shared/common-models';
import { CommonFunctions } from '../../../shared/common.functions';
import { NepaliDateInGridColumnDetail, NepaliDateInGridParams } from '../../../shared/danphe-grid/NepaliColGridSettingsModel';
import { DLService } from '../../../shared/dl.service';
import { MessageboxService } from '../../../shared/messagebox/messagebox.service';
import { ENUM_BillPaymentMode, ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status, ENUM_VisitType } from '../../../shared/shared-enums';
import { BillSummary_DTO } from '../../shared/dto/bill-summary.dto';
import { BillWiseSalesReport_DTO } from '../../shared/dto/bill-wise-sales-report.dto';
import { ReportingService } from '../../shared/reporting-service';

@Component({
  selector: 'bill-wise-sales-report',
  templateUrl: './bill-wise-sales-report.component.html',
  styleUrls: ['./bill-wise-sales-report.component.css'],
})
export class RPT_BIL_BillWiseSalesReportComponent implements OnInit {
  FromDate: string = "";
  ToDate: string = "";
  DateRange: string = "";
  NepaliDateInGridSettings = new NepaliDateInGridParams();
  ReportGridColumns = new Array<any>();
  SchemeList = new Array<{ SchemeId: number, SchemeName: string }>();
  SelectedScheme = { SchemeId: 0, SchemeName: "" };
  VisitTypes: Array<string> = Object.values(ENUM_VisitType);
  SelectedVisitType: string = "";
  PaymentModes: Array<string> = Object.values(ENUM_BillPaymentMode);
  SelectedPaymentMode: string = "";
  BillWiseSalesReportData = new Array<BillWiseSalesReport_DTO>();
  gridExportOptions: any;
  FooterContent: string = '';
  PolicyNo: string = '';
  Summary = {
    Cash: new BillSummary_DTO(),
    CashReturn: new BillSummary_DTO(),
    Credit: new BillSummary_DTO(),
    CreditReturn: new BillSummary_DTO(),
    GrossSales: 0,
    TotalDiscount: 0,
    TotalSalesReturn: 0,
    TotalReturnDiscount: 0,
    NetSales: 0,
    TotalSalesQty: 0,
    TotalReturnSalesQty: 0,
    NetQuantity: 0
  }

  constructor(
    private _reportingService: ReportingService,
    private _settingsBLService: SettingsBLService,
    private _messageBoxService: MessageboxService,
    private _dlService: DLService
  ) {
    this.VisitTypes.unshift('all');
    this.SelectedVisitType = this.VisitTypes[0];
    this.PaymentModes.unshift('all');
    this.SelectedPaymentMode = this.PaymentModes[0];
    this.ReportGridColumns = this._reportingService.reportGridCols.BillWiseSalesReportGridColumns;
    this.NepaliDateInGridSettings.NepaliDateColumnList.push(new NepaliDateInGridColumnDetail('TransactionDate', false));
  }

  ngOnInit(): void {
    this.LoadSchemeList();
    this.LoadExportOptions();
  }

  LoadExportOptions(): void {
    this.gridExportOptions = {
      fileName: 'BillWiseSalesReport' + ((this.FromDate && this.ToDate) ? '_' + (moment(this.FromDate).format('YYYY-MM-DD') + '_' + moment(this.ToDate).format('YYYY-MM-DD') + '_') : '') + '.xls',
    };
  }

  OnFromToDateChange($event): void {
    if ($event) {
      this.FromDate = $event.fromDate;
      this.ToDate = $event.toDate;
      this.DateRange = ("<b>Date:</b>&nbsp;" + this.FromDate + "&nbsp;<b>To</b>&nbsp;" + this.ToDate);
    }
  }

  LoadSchemeList(): void {
    this._settingsBLService.GetSchemeList()
      .subscribe(res => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this.SchemeList = res.Results;
          CommonFunctions.SortArrayOfObjects(this.SchemeList, "SchemeName");
        }
        else {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, [res.ErrorMessage]);
        }
      });
  }

  SchemeListFormatter(data: any): string {
    return data["SchemeName"];
  }

  LoadReport(): void {
    this.BillWiseSalesReportData = new Array<BillWiseSalesReport_DTO>();
    // this.SummaryData = new SummaryModel();
    if (this.FromDate && this.ToDate) {
      this._dlService.Read(`/BillingReports/BillWiseSalesReport?FromDate=${this.FromDate}&ToDate=${this.ToDate}&VisitType=${this.SelectedVisitType}&PaymentMode=${this.SelectedPaymentMode}&SchemeId=${this.SelectedScheme.SchemeId}&PolicyNo= ${this.PolicyNo}`)
        .map((res: DanpheHTTPResponse) => res)
        .subscribe(res => this.Success(res),
          (res: DanpheHTTPResponse) => this.Error(res)
        );
    } else {
      this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ['Dates Provided is not Proper']);
    }

  }

  Error(err: DanpheHTTPResponse): void {
    this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [err.ErrorMessage]);
  }

  Success(res: DanpheHTTPResponse): void {
    if (res.Status === ENUM_DanpheHTTPResponses.OK) {
      if (res.Results && res.Results && res.Results.length) {
        this.BillWiseSalesReportData = res.Results;
        this.LoadExportOptions();
        this.CalculateSummary();
      }
      else {
        this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, ['Data is Not Available Between Selected Parameter ....Try Different']);
        this.BillWiseSalesReportData = new Array<BillWiseSalesReport_DTO>();
      }
    }
    else {
      this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, [res.ErrorMessage]);
      this.BillWiseSalesReportData = new Array<BillWiseSalesReport_DTO>();
    }
  }

  CalculateSummary() {
    this.Summary.Cash = new BillSummary_DTO();
    this.Summary.CashReturn = new BillSummary_DTO();
    this.Summary.Credit = new BillSummary_DTO();
    this.Summary.CreditReturn = new BillSummary_DTO();

    this.Summary.GrossSales = this.Summary.TotalDiscount = this.Summary.TotalSalesReturn = this.Summary.TotalReturnDiscount =
      this.Summary.NetSales = this.Summary.TotalSalesQty = this.Summary.TotalReturnSalesQty = this.Summary.NetQuantity = 0;


    if (this.BillWiseSalesReportData && this.BillWiseSalesReportData.length > 0) {

      this.BillWiseSalesReportData.forEach(itm => {
        switch (itm.TransactionType) {
          case "CashSales": {
            this.Summary.Cash.SubTotal += itm.SubTotal;
            this.Summary.Cash.Discount += itm.DiscountAmount;
            this.Summary.Cash.TotalAmount += itm.TotalAmount;
            break;
          }
          case "CashSalesReturn": {
            this.Summary.CashReturn.SubTotal += itm.SubTotal;
            this.Summary.CashReturn.Discount += itm.DiscountAmount;
            this.Summary.CashReturn.TotalAmount += itm.TotalAmount;
            break;
          }
          case "CreditSales": {
            this.Summary.Credit.SubTotal += itm.SubTotal;
            this.Summary.Credit.Discount += itm.DiscountAmount;
            this.Summary.Credit.TotalAmount += itm.TotalAmount;
            break;
          }
          case "CreditSalesReturn": {
            this.Summary.CreditReturn.SubTotal += itm.SubTotal;
            this.Summary.CreditReturn.Discount += itm.DiscountAmount;
            this.Summary.CreditReturn.TotalAmount += itm.TotalAmount;
            break;
          }
          default:
            break;
        }
      });

      this.Summary.GrossSales = this.Summary.Cash.SubTotal + this.Summary.Credit.SubTotal;
      this.Summary.TotalDiscount = this.Summary.Cash.Discount + this.Summary.Credit.Discount;
      this.Summary.TotalSalesReturn = this.Summary.CashReturn.SubTotal + this.Summary.CreditReturn.SubTotal;
      this.Summary.TotalReturnDiscount = this.Summary.CashReturn.Discount + this.Summary.CreditReturn.Discount;
      this.Summary.NetQuantity = this.Summary.TotalSalesQty - this.Summary.TotalReturnSalesQty;
      this.Summary.NetSales = this.Summary.GrossSales - this.Summary.TotalDiscount - this.Summary.TotalSalesReturn + this.Summary.TotalReturnDiscount;
    }

  }

  ngAfterViewChecked(): void {
    if (document.getElementById("dvSummary_BillWiseSalesReport") !== null)
      this.FooterContent = document.getElementById("dvSummary_BillWiseSalesReport").innerHTML;
  }
}