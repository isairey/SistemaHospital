import { ChangeDetectorRef, Component, EventEmitter, Input, Output } from "@angular/core";


import * as moment from 'moment/moment';
import { DepositInfo_DTO } from "../phrm-deposit-list.component";
import { ENUM_BillDepositType, ENUM_DateTimeFormat } from "../../../../../shared/shared-enums";
import { MessageboxService } from "../../../../../shared/messagebox/messagebox.service";
import { CoreService } from "../../../../../core/shared/core.service";
import { NepaliCalendarService } from "../../../../../shared/calendar/np/nepali-calendar.service";
import { CommonFunctions } from "../../../../../shared/common.functions";
import { PrinterSettingsModel } from "../../../../../settings-new/printers/printer-settings.model";
import { BillingBLService } from "../../../../../billing/shared/billing.bl.service";

@Component({
  selector: 'phrm-deposit-receipt',
  templateUrl: './phrm-deposit-receipt.component.html',
  styles: [`table.pat-data-tbl tbody tr td{
    border: none !important;
  }`]
})

export class PHRMDepositReceiptComponent {
  @Input("deposit")
  Deposit: DepositInfo_DTO = new DepositInfo_DTO();

  @Input("showReceipt") ShowReceipt: boolean;

  @Input('admissionDate') AdmissionDate: string = null;

  @Input('admissionCase') public AdmissionCase: string = null;

  @Output("callback-close") CallbackClose: EventEmitter<Object> = new EventEmitter<Object>();
  DateTimeNow: string = moment().format(ENUM_DateTimeFormat.Year_Month_Day_Hour_Minute);
  DepositFlag: boolean = false;
  LocalDate: string;
  DateOfAdmissionLocalDate: string;
  DepositType: string = '';
  PrintDetails: any;
  selectedPrinter: PrinterSettingsModel = new PrinterSettingsModel();

  public OpenBrowserPrintWindow: boolean = false;
  public BrowserPrintContentObj: any;
  public DefaultFocusPrint: string = null;
  public ClosePopUpAfterInvoicePrint: boolean = true;
  public HeaderDetail: { hospitalName, address, email, tel };
  public InvoiceDisplaySettings = { ShowHeader: true, ShowQR: true, ShowHospLogo: true, ShowPriceCategory: false, HeaderType: '' };


  constructor(public messageBoxService: MessageboxService,
    public CoreService: CoreService,
    public NepaliCalendarService: NepaliCalendarService,
    public ChangeDetector: ChangeDetectorRef,
    public BillingBLService: BillingBLService) {

    this.InvoiceDisplaySettings = this.CoreService.GetInvoiceDisplaySettings();
    let paramValue = this.CoreService.Parameters.find(a => a.ParameterName === 'CustomerHeader').ParameterValue;
    if (paramValue) {
      this.HeaderDetail = JSON.parse(paramValue);
    }
  }

  ngOnInit() {
    if (this.Deposit) {
      this.Deposit.InAmount = CommonFunctions.parseAmount(this.Deposit.InAmount);
      this.Deposit.OutAmount = CommonFunctions.parseAmount(this.Deposit.OutAmount);
      this.LocalDate = this.GetLocalDate(this.Deposit.CreatedOn);
      this.DateOfAdmissionLocalDate = this.AdmissionDate ? this.GetLocalDate(this.AdmissionDate) : null;
      this.DepositType = this.Deposit.TransactionType == ENUM_BillDepositType.Deposit ? this.Deposit.TransactionType : ENUM_BillDepositType.ReturnDeposit;
      if (this.DepositType == ENUM_BillDepositType.ReturnDeposit) {
        this.DepositFlag = true;
      }
      else {
        this.DepositFlag = false;
      }
      this.ChangeDetector.detectChanges();

      let adtVal = this.CoreService.Parameters.find(p => p.ParameterGroupName == 'ADT' && p.ParameterName == 'AdmissionPrintSettings');
      let params = JSON.parse(adtVal && adtVal.ParameterValue);
      if (params) {
        this.DefaultFocusPrint = params.DefaultFocus;
        this.ClosePopUpAfterInvoicePrint = params.closePopUpAfterInvoicePrint;
      }
      this.SetFocusOnButton('btn_PrintReceipt');
    }
  }

  GetLocalDate(engDate: string): string {
    let npDate = this.NepaliCalendarService.ConvertEngToNepDateString(engDate);
    return npDate + " BS";
  }


  Print() {
    this.OpenBrowserPrintWindow = false;
    this.ChangeDetector.detectChanges();
    this.PrintDetails = document.getElementById("print-phrm-deposit-receipt-page");
    this.OpenBrowserPrintWindow = true;
  }
  CallBackBillPrint() {
    this.BillingBLService.UpdateDepositPrintCount(this.Deposit.DepositId)
      .subscribe().unsubscribe();

    this.Close();
  }
  SetFocusOnButton(idToSelect: string) {
    if (document.getElementById(idToSelect)) {
      let nextEl = <HTMLInputElement>document.getElementById(idToSelect);
      nextEl.focus();
    }
  }

  Close() {
    this.CallbackClose.emit({});
  }

  OnPrinterChanged($event) {
    this.selectedPrinter = $event;
  }


  FocusOnPrint() {
    this.ChangeDetector.detectChanges();
    if (this.Deposit) {
      let btnObj = document.getElementById('btnAdtSticker');
      if (btnObj && this.DefaultFocusPrint.toLowerCase() == 'deposit') {
        btnObj.focus();
      }
    }
  }
}
