import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CoreService } from '../../../../../core/shared/core.service';
import { PharmacyBLService } from '../../../../../pharmacy/shared/pharmacy.bl.service';
import { PharmacyService } from '../../../../../pharmacy/shared/pharmacy.service';
import { SecurityService } from '../../../../../security/shared/security.service';
import { NepaliCalendarService } from '../../../../../shared/calendar/np/nepali-calendar.service';
import { DanpheHTTPResponse } from '../../../../../shared/common-models';
import { CommonFunctions } from '../../../../../shared/common.functions';
import { MessageboxService } from '../../../../../shared/messagebox/messagebox.service';

@Component({
  selector: 'app-settlement-receipt',
  templateUrl: './settlement-receipt.component.html',
  styleUrls: ['./settlement-receipt.component.css'],
  host: { '(window:keydown)': 'hotkeys($event)' }
})
export class SettlementReceiptComponent implements OnInit {

  // @Input("settlementInfo")
  // public settlementInfo: PHRMSettlementModel;

  @Input("settlementId")
  public settlementId: number = null;
  @Input("showReceipt")
  public showReceipt: boolean;
  public localDate: string;
  //public currencyUnit: string;
  public totalCrAmount: number = 0;

  @Output("close-receipt")
  public receiptClosed: EventEmitter<boolean> = new EventEmitter<boolean>();
  public setlmntToDisplay: any = {};
  PatientInfo: any = {};
  SalesInfo: any[] = [];
  SettlementInfo: any = {};
  SalesReturnInfo: any[] = [];
  CashDiscountReturnInfo: any[] = [];
  DepositInfo: any[] = [];

  public SalesTotal: number = 0;
  public SalesReturnTotal: number = 0;
  public NetAmount: number = 0;
  public CashDiscount: number = 0;
  public PaidAmount: number = 0;
  public PayableAmount: number = 0;

  public EnableEnglishCalendarOnly: boolean = false;
  public DepositRefund: number = 0;
  public GrandTotal: number = 0;
  public RefundAmount: number = 0;

  constructor(public msgBoxService: MessageboxService,
    public pharmacyBLService: PharmacyBLService,
    public nepaliCalendarServ: NepaliCalendarService,
    public pharmacyService: PharmacyService,

    public coreService: CoreService,

    public securityService: SecurityService) {
    this.GetCalendarParameter();

  }

  GetCalendarParameter(): void {
    const param = this.coreService.Parameters.find(p => p.ParameterGroupName === "Common" && p.ParameterName === "EnableEnglishCalendarOnly");
    if (param && param.ParameterValue) {
      const paramValue = JSON.parse(param.ParameterValue);
      this.EnableEnglishCalendarOnly = paramValue;
    }
  }
  ngOnInit() {
    //this.currencyUnit = this.pharmacyService.currencyUnit;
    // if (this.settlementInfo) {
    //   this.localDate = this.GetLocalDate(this.settlementInfo.CreatedOn);
    //   if (this.settlementInfo.PHRMInvoiceTransactions) {
    //     this.settlementInfo.PHRMInvoiceTransactions.forEach(bil => {
    //       this.totalCrAmount += bil.TotalAmount;
    //     });
    //     this.totalCrAmount = CommonFunctions.parseAmount(this.totalCrAmount);
    //   }
    // }

    if (this.settlementId >= 0) {
      this.GetSettlementReceiptDetails();
    }

    // this.settlementInfo.Patient.ShortName = this.settlementInfo.Patient.FirstName
    //   + " " + (this.settlementInfo.Patient.MiddleName == null ? "" : this.settlementInfo.Patient.MiddleName)
    //   + " " + (this.settlementInfo.Patient.LastName);
  }

  GetSettlementReceiptDetails() {
    this.pharmacyBLService.GetPHRMSettlementDuplicateDetails(this.settlementId)
      .subscribe((res: DanpheHTTPResponse) => {
        this.setlmntToDisplay = res.Results;
        this.PatientInfo = this.setlmntToDisplay.PatientInfo;
        this.SettlementInfo = this.setlmntToDisplay.SettlementInfo;
        this.SalesInfo = this.setlmntToDisplay.SalesInfo;
        this.SalesReturnInfo = this.setlmntToDisplay.SalesReturn;
        this.CashDiscountReturnInfo = this.setlmntToDisplay.CashDiscountReturn;
        this.DepositInfo = this.setlmntToDisplay.DepositInfo;
        this.localDate = this.GetLocalDate(this.setlmntToDisplay.SettlementDate);
        this.showReceipt = true;
        this.CalculateTotals();
        if (this.PatientInfo) {
          this.PatientInfo.Age = this.coreService.CalculateAge(this.PatientInfo.DateOfBirth);
        }
      },
        err => {
          this.msgBoxService.showMessage("failed", [err.ErrorMessage]);
        }
      );
  }

  CalculateTotals() {
    if (this.SalesInfo && this.SalesInfo.length) {
      this.SalesInfo.forEach(a => {
        this.SalesTotal += a.Amount;
      });
      this.SalesTotal = CommonFunctions.parsePhrmAmount(this.SalesTotal);
    }
    if (this.SalesReturnInfo && this.SalesReturnInfo.length) {
      this.SalesReturnInfo.forEach(b => {
        this.SalesReturnTotal += b.Amount;
      });
    }

    this.NetAmount = CommonFunctions.parsePhrmAmount(this.SalesTotal - this.SalesReturnTotal);
    this.CashDiscount = this.SettlementInfo.CashDiscountGiven ? this.SettlementInfo.CashDiscountGiven : 0;
    this.PayableAmount = CommonFunctions.parsePhrmAmount(this.NetAmount - this.CashDiscount);
    this.GrandTotal = this.NetAmount - this.CashDiscount;
    if (this.DepositInfo && this.DepositInfo.length) {
      this.DepositInfo = this.DepositInfo.filter(d => d.TransactionType === 'Deposit Deducted');
      this.DepositInfo.forEach(a => {
        if (this.GrandTotal > a.DepositAmount) {
          this.PaidAmount = this.GrandTotal - a.DepositAmount;
        }
        else {
          this.DepositRefund = a.DepositAmount - this.GrandTotal;
        }
      });
    } else {
      this.PaidAmount = this.GrandTotal;
    }


  }
  GetLocalDate(engDate: string): string {
    if (this.EnableEnglishCalendarOnly) {
      return null;
    } else {
      let npDate = this.nepaliCalendarServ.ConvertEngToNepDateString(engDate);
      // return npDate + " BS";
      return `(${npDate} BS)`;
    }
  }
  print() {
    let popupWinindow;
    var printContents = document.getElementById("printpage").innerHTML;
    popupWinindow = window.open('', '_blank', 'width=600,height=700,scrollbars=no,menubar=no,toolbar=no,location=no,status=no,titlebar=no');
    popupWinindow.document.open();
    popupWinindow.document.write('<html><head><link rel="stylesheet" type="text/css" href="../../themes/theme-default/DanpheStyle.css" /></head><body onload="window.print()">' + printContents + '</body></html>');
    popupWinindow.document.close();
    this.pharmacyBLService.UpdateSettlementPrintCount(this.SettlementInfo.SettlementId)
      .subscribe(res => {

      });
  }

  CloseReceipt() {
    this.showReceipt = false;
    // this.settlementInfo = new PHRMSettlementModel();
    this.SettlementInfo = {};
    this.receiptClosed.emit(true);
  }
  public hotkeys(event) {
    if (event.keyCode === 27) {
      this.CloseReceipt();
    }
  }

}
