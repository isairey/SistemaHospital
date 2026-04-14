import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import * as moment from 'moment';
import { CoreService } from '../../../core/shared/core.service';
import { SecurityService } from '../../../security/shared/security.service';
import { ENUM_PrintingType, PrinterSettingsModel } from '../../../settings-new/printers/printer-settings.model';
import { NepaliCalendarService } from '../../../shared/calendar/np/nepali-calendar.service';
import { DanpheHTTPResponse } from '../../../shared/common-models';
import { MessageboxService } from '../../../shared/messagebox/messagebox.service';
import { ENUM_BillPaymentMode, ENUM_Country, ENUM_DanpheHTTPResponses, ENUM_PriceCategory, ENUM_PrintTemplateTypes } from '../../../shared/shared-enums';
import { BillingBLService } from '../../shared/billing.bl.service';
import { BillingService } from '../../shared/billing.service';
import { BilPrint_VM } from '../../shared/invoice-print-vms';
import { PrintTemplateType } from '../../shared/print-template-type.model';

@Component({
  selector: 'bil-print-discharge-statement',
  templateUrl: './bil-print-discharge-statement.component.html',
})
export class Bil_Print_DischargeStatementComponent implements OnInit {


  @Input("invoice")
  public invoice: BilPrint_VM = new BilPrint_VM();

  @Input("redirect-path-after-print")
  redirectUrlPath: string = null;

  @Input('focus-print-btn')
  public focusPrintBtn: boolean = true;


  @Output("closeDischargeBill")
  public closeDischargeBill: EventEmitter<object> = new EventEmitter<object>();

  @Input("duplicate-prints")
  public isDuplicatePrint: boolean = false;

  @Output("dischargeemmiter")
  public dischargeemmiter: EventEmitter<object> = new EventEmitter<object>()

  //public ServiceDepartmentIdFromParametes: number = 0;

  public InvoiceDisplaySettings = { ShowHeader: true, ShowQR: true, ShowHospLogo: true, HeaderType: '' };
  public InvoiceFooterNoteSettings: any = { ShowFooter: true, ShowEnglish: true, ShowNepali: false, EnglishText: "Please bring this invoice on your next visit.", NepaliText: "कृपया अर्को पटक आउँदा यो बिल अनिवार्य रुपमा लिएर आउनुहोला ।" };

  public currTime: string = "";
  public hospitalCode: string = "";
  public headerRightColLen: number = 32;
  public nline: any = '\n';

  public openBrowserPrintWindow: boolean = false;
  public browserPrintContentObj: any;
  public headerDetail: { CustomerName, Address, Email, CustomerRegLabel, CustomerRegNo, Tel };
  public ShowProviderName: boolean;
  public SSFPriceCategory: string = ENUM_PriceCategory.SSF;

  public patientQRCodeInfo = "";

  public creditPaymentMode = ENUM_BillPaymentMode.credit.toLowerCase();
  public showMunicipality: boolean;
  public CountryNepal: string = null;
  public BillingAmount = { SubTotal: 0, DiscountAmount: 0, TotalAmount: 0 }
  public PharmacyAmount = { SubTotal: 0, DiscountAmount: 0, TotalAmount: 0 }
  public loading: boolean = false;
  printContent: string = "";
  public PrintTemplateTypeSettings = new PrintTemplateType();

  @Input('show-normal-bill') showNormalBill: boolean = false;
  @Input('show-discharge-bill') showDischargeBill: boolean = false;

  public IsDetailedDischarged: boolean = false;
  public ResultFromServer = {
    PatientDetail: new DetailedDischargeBreakDown_PatientDetail(),
    AdmissionInfo: new DetailedDischargeBreakDown_AdmissionInfo(),
    BillItems: [],
    PharmacyPendingBillsItems: [],
    DepositInfo: [],
    InvoiceInfo: {},
    InvoicePrintTemplateSummary: ""
  };

  public OtherCurrencyDetail: OtherCurrencyDetail = { CurrencyCode: '', ExchangeRate: 0, BaseAmount: 0, ConvertedAmount: 0 };
  DisplayAsStatement: boolean = false;

  constructor(
    public msgBoxServ: MessageboxService,
    public billingBLService: BillingBLService,
    public nepaliCalendarServ: NepaliCalendarService,
    public CoreService: CoreService,
    public billingServ: BillingService,
    public changeDetector: ChangeDetectorRef,
    public router: Router,
    public securityService: SecurityService
  ) {

    this.InvoiceDisplaySettings = this.CoreService.GetInvoiceDisplaySettings();
    this.InvoiceFooterNoteSettings = this.CoreService.GetInvoiceFooterNoteSettings();
    this.hospitalCode = this.CoreService.GetHospitalCode();
    this.ShowProviderName = this.CoreService.SetShowProviderNameFlag();
    if (!this.hospitalCode) {
      this.hospitalCode = "default";
    }

    let paramValue = this.CoreService.Parameters.find(a => a.ParameterName == 'BillingHeader').ParameterValue;
    if (paramValue)
      this.headerDetail = JSON.parse(paramValue);
    this.showMunicipality = this.CoreService.ShowMunicipality().ShowMunicipality;
    this.CountryNepal = ENUM_Country.Nepal;

    this.ReadDischargeStatementConfigParameter();

  }
  ReadDischargeStatementConfigParameter() {
    const param = this.CoreService.Parameters.find(p => p.ParameterGroupName === "Billing" && p.ParameterName === "DisplayAsStatement");
    if (param) {
      const paramValue = JSON.parse(param.ParameterValue);
      this.DisplayAsStatement = paramValue;
    }
  }


  public localDateTime: string = null;
  public finalAge: string = null;
  public ipdNumber: string = null;
  public isInsurance: boolean = false;

  ngOnInit() {

    if (this.invoice) {
      this.ReadReceiptPrintDisplaySettingParameter();
      if (this.invoice.InvoiceInfo.OtherCurrencyDetail) {
        this.OtherCurrencyDetail = JSON.parse(this.invoice.InvoiceInfo.OtherCurrencyDetail);
      } else {
        this.OtherCurrencyDetail = null;
      }
      this.localDateTime = this.GetLocalDate(this.invoice.InvoiceInfo.TransactionDate);
      this.finalAge = this.CoreService.CalculateAge(this.invoice.PatientInfo.DateOfBirth);

      this.ipdNumber = this.invoice.VisitInfo.VisitCode;
      this.isInsurance = this.invoice.InvoiceInfo.IsInsuranceBilling;
      this.currTime = moment(this.invoice.InvoiceInfo.TransactionDate).format("HH:mm").toString();
      this.invoice.InvoiceInfo.UserName = this.invoice.InvoiceInfo.UserName || this.securityService.loggedInUser.UserName;
      this.AmountCalculation();
      this.patientQRCodeInfo = `Name: ${this.invoice.PatientInfo.ShortName}
            Age/Sex: ${this.invoice.PatientInfo.Age} / ${this.invoice.PatientInfo.Gender.charAt(0)}
            Hospital No: [ ${this.invoice.PatientInfo.PatientCode} ]
            Invoice No: ${this.invoice.InvoiceInfo.InvoiceNumFormatted}`;

      this.MapDataForDetailedBreakDown(this.invoice);


    }
  }

  ngAfterViewInit(): void {
    //Called after ngAfterContentInit when the component's view has been initialized. Applies to components only.
    //Add 'implements AfterViewInit' to the class.
    this.RenderDynamicReceipt();

  }

  private RenderDynamicReceipt() {
    let htmlElement = document.getElementById("id_dynamic_discharge");
    if (htmlElement) {
      let dischargeInvoiceData = document.createElement('div');
      dischargeInvoiceData.innerHTML = this.invoice.InvoicePrintTemplate;
      this.printContent = this.invoice.InvoicePrintTemplate;
      document.getElementById('id_dynamic_discharge').appendChild(dischargeInvoiceData);
      this.changeDetector.detectChanges();
    }
  }

  ReadReceiptPrintDisplaySettingParameter() {
    let currParam = this.CoreService.Parameters.find(a => a.ParameterGroupName === "Common" && a.ParameterName === "UseDynamicInvoicePrint");
    if (currParam && currParam.ParameterValue) {
      const paramValue = JSON.parse(currParam.ParameterValue) as Array<PrintTemplateType>;
      this.PrintTemplateTypeSettings.Enable = false;
      if (paramValue && this.invoice.InvoiceInfo.PrintTemplateType) {
        const dischargeStatementParamValue = paramValue.find(p => JSON.parse(this.invoice.InvoiceInfo.PrintTemplateType).includes(p.PrintType));
        if (dischargeStatementParamValue) {
          this.PrintTemplateTypeSettings = dischargeStatementParamValue;
        }
        //!Manual Change Detection is done here in order to reflect the changes of dynamic print receipts, if not done, the dom element is not rendered and will face issues in rendering the receipt.
        this.changeDetector.detectChanges();
      }
    }
  }
  private MapDataForDetailedBreakDown(invoice: BilPrint_VM) {
    //Map PatientDetail
    this.ResultFromServer.PatientDetail.HospitalNo = invoice.PatientInfo.PatientCode;
    this.ResultFromServer.PatientDetail.PatientName = invoice.PatientInfo.ShortName;
    this.ResultFromServer.PatientDetail.DateOfBirth = invoice.PatientInfo.DateOfBirth;
    this.ResultFromServer.PatientDetail.PhoneNumber = invoice.PatientInfo.PhoneNumber;

    this.ResultFromServer.PatientDetail.CountryName = invoice.PatientInfo.CountryName;
    this.ResultFromServer.PatientDetail.CountrySubDivisionName = invoice.PatientInfo.CountrySubDivisionName;
    this.ResultFromServer.PatientDetail.MunicipalityName = invoice.PatientInfo.MunicipalityName;
    this.ResultFromServer.PatientDetail.WardNumber = invoice.PatientInfo.WardNumber;
    this.ResultFromServer.PatientDetail.Address = invoice.PatientInfo.Address;

    this.ResultFromServer.PatientDetail.PolicyNo = invoice.PatientInfo.PolicyNo;
    this.ResultFromServer.PatientDetail.Gender = invoice.PatientInfo.Gender;
    this.ResultFromServer.PatientDetail.InpatientNo = invoice.VisitInfo.VisitCode;
    // this.ResultFromServer.PatientDetail.SchemeName = invoice.PatientInfo.PolicyNo;
    this.ResultFromServer.AdmissionInfo.RoomType = invoice.VisitInfo.WardName;
    this.ResultFromServer.AdmissionInfo.AdmissionDate = invoice.VisitInfo.AdmissionDate;
    this.ResultFromServer.AdmissionInfo.DischargeDate = invoice.VisitInfo.DischargeDate;
    this.ResultFromServer.AdmissionInfo.AdmittingDoctor = invoice.VisitInfo.ConsultingDoctor;

    this.ResultFromServer.PharmacyPendingBillsItems = invoice.PharmacyInvoiceItems;
    this.ResultFromServer.BillItems = invoice.InvoiceItems;
    if (invoice.DepositList && invoice.DepositList.length > 0) {
      invoice.DepositList.forEach((dep, index) => {
        this.ResultFromServer.DepositInfo[index] = dep;
        this.ResultFromServer.DepositInfo[index].TransactionType = dep.TransactionType;
      });
    }

    this.ResultFromServer.InvoiceInfo = invoice.InvoiceInfo;
    this.ResultFromServer.InvoicePrintTemplateSummary = invoice.InvoicePrintTemplateSummary
  }

  AmountCalculation() {
    let subTotal = 0;
    let discount = 0;
    let totalAmount = 0;
    if (this.invoice.InvoiceItems.length > 0) {
      subTotal += this.invoice.InvoiceItems.reduce((acc, item) => acc + item.SubTotal, 0)
      discount += this.invoice.InvoiceItems.reduce((acc, item) => acc + item.DiscountAmount, 0)
      totalAmount += this.invoice.InvoiceItems.reduce((acc, item) => acc + item.TotalAmount, 0)

      this.BillingAmount.SubTotal = subTotal;
      this.BillingAmount.DiscountAmount = discount;
      this.BillingAmount.TotalAmount = totalAmount;
    }
    if (this.invoice.PharmacyInvoiceItems.length > 0) {
      this.invoice.PharmacyInvoiceItems.forEach(invitm => invitm.DiscountAmount = invitm.TotalDisAmt);
      subTotal += this.invoice.PharmacyInvoiceItems.reduce((acc, item) => acc + item.SubTotal, 0)
      discount += this.invoice.PharmacyInvoiceItems.reduce((acc, item) => acc + item.DiscountAmount, 0)
      totalAmount += this.invoice.PharmacyInvoiceItems.reduce((acc, item) => acc + item.TotalAmount, 0)

      this.PharmacyAmount.SubTotal = this.invoice.PharmacyInvoiceItems.reduce((acc, item) => acc + item.SubTotal, 0);
      this.PharmacyAmount.DiscountAmount = this.invoice.PharmacyInvoiceItems.reduce((acc, item) => acc + item.DiscountAmount, 0);
      this.PharmacyAmount.TotalAmount = this.invoice.PharmacyInvoiceItems.reduce((acc, item) => acc + item.TotalAmount, 0);
    }
    this.invoice.InvoiceInfo.SubTotal = subTotal;
    this.invoice.InvoiceInfo.DiscountAmount = discount;
    this.invoice.InvoiceInfo.TotalAmount = totalAmount;
    //this.invoice.InvoiceInfo.Tender = totalAmount;
    if ((this.invoice.InvoiceInfo.TotalAmount > this.invoice.InvoiceInfo.DepositAvailable) && (this.invoice.InvoiceInfo.PaymentMode != 'credit') && (this.invoice.InvoiceInfo.DepositUsed > 0)) {
      this.invoice.InvoiceInfo.ToBePaid = this.invoice.InvoiceInfo.TotalAmount - this.invoice.InvoiceInfo.DepositAvailable;
    } else {
      this.invoice.InvoiceInfo.ToBePaid = this.invoice.InvoiceInfo.TotalAmount;
    }

  }
  GetLocalDate(engDate: string): string {
    let npDate = this.nepaliCalendarServ.ConvertEngToNepDateString(engDate);
    return npDate + " BS";
  }


  public selectedPrinter: PrinterSettingsModel = new PrinterSettingsModel();
  OnPrinterChanged($event) {
    this.selectedPrinter = $event;
  }

  AfterDuplicatePrint() {
    //this.dischargeemmiter.emit({ Close: "close" });
  }

  public printReceipt() {
    this.loading = true;
    //Open 'Browser Print' if printer not found or selected printing type is Browser.
    if (!this.selectedPrinter || this.selectedPrinter.PrintingType === ENUM_PrintingType.browser) {
      // this.browserPrintContentObj = this.printContent;
      // this.openBrowserPrintWindow = false;
      // this.changeDetector.detectChanges();
      // this.openBrowserPrintWindow = true;
      this.GenerateDynamicInvoicePrintBrowser(this.printContent);
      this.loading = false;
    }
  }

  GenerateDynamicInvoicePrintBrowser(dataToPrint: string) {
    let iframe = document.createElement('iframe');
    document.body.appendChild(iframe);
    iframe.contentWindow.document.open();
    iframe.contentWindow.document.write(dataToPrint);
    iframe.contentWindow.document.close();

    setTimeout(function () {
      document.body.removeChild(iframe);
    }, 500);


    this.UpdatePrintCount();
  }

  print() {
    this.loading = true;
    //Open 'Browser Print' if printer not found or selected printing type is Browser.
    this.browserPrintContentObj = document.getElementById("id_dvDischargeBillPrintPage");
    this.openBrowserPrintWindow = false;
    this.changeDetector.detectChanges();
    this.openBrowserPrintWindow = true;
    // this.UpdatePrintCount(); //This method to update print count is already called from success of print from template.
    this.loading = false;
  }

  UpdatePrintCount(): void {
    if (this.DisplayAsStatement) {
      this.billingBLService.PutDischargeStatementPrintCount(this.invoice.InvoiceInfo.DischargeStatementId).subscribe((res: DanpheHTTPResponse) => {
        if (res.Status !== ENUM_DanpheHTTPResponses.OK) {
          console.log("Failed to Update Print Count for Discharge Statement.");
        }
      })
    } else {
      let printCount = this.invoice.InvoiceInfo.PrintCount + 1;
      this.billingBLService.PutPrintCount(printCount, this.invoice.InvoiceInfo.BillingTransactionId)
        .subscribe((res: DanpheHTTPResponse): void => {
          if (res.Status !== ENUM_DanpheHTTPResponses.OK) {
            console.log("Failed to Update Print Count.");
          }
        });
    }
  }

  public ShowDetailedBreakDown: boolean = false;
  SwitchEstimationView($event) {
    if ($event) {
      this.IsDetailedDischarged = !this.IsDetailedDischarged;
      //this.changeDetector.detectChanges();
      this.ReadReceiptPrintDisplaySettingParameter();
      this.changeDetector.detectChanges();
      if (this.PrintTemplateTypeSettings.PrintType === ENUM_PrintTemplateTypes.IpDischargeStatement) {
        this.RenderDynamicReceipt();
      }
    }
  }

}

export class DetailedDischargeBreakDown_PatientDetail {
  HospitalNo: string = "";
  PatientName: string = "";
  PhoneNumber: string = "";
  DateOfBirth: string = "";
  CountryName: string = "";
  CountrySubDivisionName: string = "";
  MunicipalityName: string = "";
  WardNumber: number = 0;
  Address: string = "";
  PolicyNo: string = "";
  InpatientNo: string = "";
  SchemeName: string = "";
  Gender: string = "";
}

export class DetailedDischargeBreakDown_AdmissionInfo {
  RoomType: string = "";
  AdmissionDate: string = "";
  DischargeDate: string = "";
  AdmittingDoctor: string = "";
}
