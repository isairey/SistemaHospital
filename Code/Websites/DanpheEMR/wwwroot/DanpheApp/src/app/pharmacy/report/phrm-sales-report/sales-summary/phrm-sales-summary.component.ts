import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import * as moment from 'moment';
import { MessageboxService } from '../../../../shared/messagebox/messagebox.service';
import { PharmacyBLService } from '../../../shared/pharmacy.bl.service';
import PHRMReportsGridColumns from '../../../shared/phrm-reports-grid-columns';

@Component({
  templateUrl: './phrm-sales-summary.component.html',
})
export class PHRMSalesSummaryComponent implements OnInit {

  fromDate: string;
  toDate: string;
  salesSummaryResult: SalesSummaryReport_DTO[] = [];
  salesSummaryGrid: Array<any> = null;
  grandTotalSalesSummary: SalesSummaryReport_DTO = new SalesSummaryReport_DTO();
  public footerContent = '';
  public dateRange: string = "";
  public pharmacy: string = "pharmacy";

  public loading: boolean = false;
  constructor(public pharmacyBLService: PharmacyBLService, public msgBoxServ: MessageboxService, public changeDetector: ChangeDetectorRef) {
    this.salesSummaryGrid = PHRMReportsGridColumns.PHRMSalesSummary;
    this.fromDate = moment().format("YYYY-MM-DD");
    this.toDate = moment().format("YYYY-MM-DD");
  }

  ngOnInit() {
  }
  ngAfterViewChecked() {
    this.footerContent = document.getElementById("print_summary").innerHTML;
  }
  LoadReport() {
    this.loading = true;
    this.salesSummaryResult = [];
    this.grandTotalSalesSummary = new SalesSummaryReport_DTO();
    this.pharmacyBLService.getSalesSummaryReport(this.fromDate, this.toDate)
      .subscribe(res => {
        if (res.Status == 'OK' && res.Results.length > 0) {
          this.salesSummaryResult = res.Results;
          // let summary = this.salesSummaryResult.find(x => x.StoreName == "Total");
          // if (summary) {
          //   this.grandTotalSalesSummary = summary;
          // }
          // this.salesSummaryResult = this.salesSummaryResult.filter(x => x.StoreName !== "Total");
          this.salesSummaryResult.forEach(item => {
            this.grandTotalSalesSummary.GrossCashSales += item.GrossCashSales;
            this.grandTotalSalesSummary.CashDiscount += item.CashDiscount;
            this.grandTotalSalesSummary.CashSales += item.CashSales;
            this.grandTotalSalesSummary.GrossCashRefund += item.GrossCashRefund;
            this.grandTotalSalesSummary.CashRefundDiscount += item.CashRefundDiscount;
            this.grandTotalSalesSummary.CashSalesRefund += item.CashSalesRefund;
            this.grandTotalSalesSummary.NetCashSales += item.NetCashSales;
            this.grandTotalSalesSummary.GrossCreditSales += item.GrossCreditSales;
            this.grandTotalSalesSummary.CreditDiscount += item.CreditDiscount;
            this.grandTotalSalesSummary.CreditSales += item.CreditSales;
            this.grandTotalSalesSummary.GrossCreditRefund += item.GrossCreditRefund;
            this.grandTotalSalesSummary.CreditRefundDiscount += item.CreditRefundDiscount;
            this.grandTotalSalesSummary.CreditSalesRefund += item.CreditSalesRefund;
            this.grandTotalSalesSummary.NetCreditSales += item.NetCreditSales;
            this.grandTotalSalesSummary.NetTotalSales += item.NetTotalSales;
            this.grandTotalSalesSummary.CashInHand += item.CashInHand;
            this.grandTotalSalesSummary.CollectionFromReceivable += item.CollectionFromReceivable;
            this.grandTotalSalesSummary.CashDiscountGiven += item.CashDiscountGiven;
            this.grandTotalSalesSummary.CashDiscountReceived += item.CashDiscountReceived;
            this.grandTotalSalesSummary.DepositCollection += item.DepositCollection;
          });
          this.changeDetector.detectChanges();
          this.footerContent = document.getElementById("print_summary").innerHTML;
        }
        else {
          this.salesSummaryResult = null;
          this.msgBoxServ.showMessage("error", ["No Data is Available for Selected Record"]);
        }
        this.loading = false;
      });
  }

  //Export data grid options for excel file
  gridExportOptions = {
    fileName: 'PharmacySalesStatementReport_' + moment().format('YYYY-MM-DD') + '.xls',
  };

  OnFromToDateChange($event) {
    this.fromDate = $event ? $event.fromDate : this.fromDate;
    this.toDate = $event ? $event.toDate : this.toDate;
    this.dateRange = "<b>Date:</b>&nbsp;" + this.fromDate + "&nbsp;<b>To</b>&nbsp;" + this.toDate;
  }
}


class SalesSummaryReport_DTO {
  StoreName: string = null;

  GrossCashSales: number = 0;
  CashDiscount: number = 0;
  CashSales: number = 0;

  GrossCashRefund: number = 0;
  CashRefundDiscount: number = 0;
  CashSalesRefund: number = 0;

  NetCashSales: number = 0;


  GrossCreditSales: number = 0;
  CreditDiscount: number = 0;
  CreditSales: number = 0;

  GrossCreditRefund: number = 0;
  CreditRefundDiscount: number = 0;
  CreditSalesRefund: number = 0;
  NetCreditSales: number = 0;
  NetTotalSales: number = 0;

  CashInHand: number = 0;
  CollectionFromReceivable: number = 0;
  CashDiscountGiven: number = 0;
  CashDiscountReceived: number = 0;
  DepositCollection: number = 0;


}
