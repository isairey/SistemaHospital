import {
  ChangeDetectorRef, Component, EventEmitter, Injector, Input, OnInit, Output
} from "@angular/core";
import { Router } from "@angular/router";
import { CoreService } from "../../../core/shared/core.service";
import { DanpheHTTPResponse } from "../../../shared/common-models";
import { SelectedPatientDto } from "../../../shared/diagnosis/dto/selected-patient.dto";
import { HibLiveClaimInvoiceDetails } from "../../../shared/hib-live-claim/dtos/hib-live-claim-invoice-details.dto";
import { MessageboxService } from "../../../shared/messagebox/messagebox.service";
import { ENUM_CreditModule, ENUM_DanpheHTTPResponseText, ENUM_DanpheHTTPResponses, ENUM_InvoiceType, ENUM_MessageBox_Status, ENUM_Scheme_ApiIntegrationNames } from "../../../shared/shared-enums";
import { BillingBLService } from "../../shared/billing.bl.service";
import { BilPrint_VM } from "../../shared/invoice-print-vms";

@Component({
  selector: "bil-print-invoice-main",
  templateUrl: "./bil-print-invoice-main.html",
})
export class Bil_Print_InvoiceMain_Component implements OnInit {
  @Input("invoiceNumber")
  invoiceNumber: number = null;

  @Input("fiscalYrId")
  fiscalYrId: number = null;

  @Input("bil-txn-id")
  inputBillingTxnId: number = null;

  @Input("redirect-path-after-print")
  redirectUrlPath: string = null;

  @Input("focus-print-btn")
  public focusPrintBtn: boolean = true;

  @Output("print-emitter")
  public printEmitter: EventEmitter<object> = new EventEmitter<object>();

  @Output("dischargeIp")
  public dischargePrint: EventEmitter<object> = new EventEmitter<object>();

  @Input("duplicate-print")
  public isFromDuplicatePrints: boolean = false;

  @Input('from-ADT-prints')
  public isPrintFromADT: boolean = false;

  @Input('from-visit-prints')
  public isPrintFromVisit: boolean = false;

  public invoiceInfoObj: BilPrint_VM = new BilPrint_VM();

  public invoiceType: string = null;
  public isInvoiceFound: boolean = false;

  @Input('discharge-statement-id') DischargeStatementId: number = 0;
  @Input('patient-id') PatientId: number = 0;
  @Input('patient-visit-id') PatientVisitId: number = 0;

  @Input('show-normal-bill') showNormalBill: boolean = false;
  showDischargeStatement: boolean = false;
  @Input('invoice-from')
  public InvoiceFrom: string = "";

  @Input('allow-hib-live-claim')
  public AllowHIBLiveClaim: boolean = false;
  public DischargePrintSettings: { ShowDischargeStatementPrint, ShowDischargeSlipPrint };
  SelectedLiveClaimPatient = new SelectedPatientDto();
  HibLiveClaimInvoiceDetail = new HibLiveClaimInvoiceDetails();
  ShowHibLiveClaimUI: boolean = false
  HibLiveClaimConfig = { "IsEnabled": false, "EnableManualLiveClaim": false, "EnableAutoLiveClaim": false, "EnableLiveDocumentSubmission": false };

  constructor(
    public changeDetectorRef: ChangeDetectorRef,
    public billingBlService: BillingBLService,
    public router: Router,
    public messageBoxService: MessageboxService,
    public injector: Injector,
    public coreService: CoreService
  ) {
    this.GetBillingHeaderParameter();
    this.GetHibLiveClaimParameter();
  }
  GetHibLiveClaimParameter() {
    const param = this.coreService.Parameters.find(p => p.ParameterGroupName === "GovInsurance" && p.ParameterName === "HIBLiveClaimConfig");
    if (param) {
      this.HibLiveClaimConfig = JSON.parse(param.ParameterValue);
    }
  }

  ngOnInit(): void {
    if (this.fiscalYrId && this.invoiceNumber) {
      this.invoiceType = null; //reset invoicetype.

      this.LoadInvoiceForPrint(this.invoiceNumber, this.fiscalYrId, this.inputBillingTxnId);
    }
    if (this.DischargeStatementId && this.PatientId && this.PatientVisitId) {
      this.GetDischargeStatementInfo(this.PatientId, this.DischargeStatementId, this.PatientVisitId)
    }
  }

  LoadInvoiceForPrint(invoiceNo: number, fiscalYrId, billingTxnId) {
    this.billingBlService
      .GetInvoiceDetailsForDuplicatePrint(invoiceNo, fiscalYrId, billingTxnId)
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this.invoiceInfoObj = res.Results;
          this.isInvoiceFound =
            this.invoiceInfoObj && this.invoiceInfoObj.IsInvoiceFound;
          if (this.isInvoiceFound) {
            this.invoiceType = this.invoiceInfoObj.InvoiceInfo.InvoiceType;
            if (this.invoiceInfoObj.InvoiceInfo.ApiIntegrationName === ENUM_Scheme_ApiIntegrationNames.NGHIS && this.HibLiveClaimConfig && this.HibLiveClaimConfig.IsEnabled && this.HibLiveClaimConfig.EnableManualLiveClaim) {
              this.SelectedLiveClaimPatient.PatientId = this.invoiceInfoObj.PatientInfo.PatientId;
              this.SelectedLiveClaimPatient.PatientCode = this.invoiceInfoObj.PatientInfo.PatientCode;
              this.SelectedLiveClaimPatient.PatientName = this.invoiceInfoObj.PatientInfo.ShortName;
              this.SelectedLiveClaimPatient.PatientVisitId = this.invoiceInfoObj.VisitInfo.PatientVisitId;
              this.SelectedLiveClaimPatient.PerformerId = this.invoiceInfoObj.VisitInfo.ConsultingDoctorId;

              this.HibLiveClaimInvoiceDetail.InvoiceId = this.invoiceInfoObj.InvoiceInfo.BillingTransactionId;
              this.HibLiveClaimInvoiceDetail.ModuleName = ENUM_CreditModule.Billing;
              this.HibLiveClaimInvoiceDetail.ApiIntegrationName = this.invoiceInfoObj.InvoiceInfo.ApiIntegrationName;
              this.HibLiveClaimInvoiceDetail.InvoiceFrom = this.InvoiceFrom;
              this.ShowHibLiveClaimUI = this.AllowHIBLiveClaim;
            }
          }
        }
      });
  }

  DuplicatePrintCallBack(data) {
    if (data.Close == "close") {
      this.isInvoiceFound = false;
      this.printEmitter.emit({ Close: "close" });
      this.dischargePrint.emit({ Close: "close" });
    }
  }

  GetDischargeStatementInfo(PatientId: number, DischargeStatementId: number, PatientVisitId: number) {
    this.billingBlService.GetDischrageStatement(PatientId, DischargeStatementId, PatientVisitId).subscribe((res: DanpheHTTPResponse) => {
      if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
        this.invoiceInfoObj = res.Results;
        if (this.invoiceInfoObj.InvoiceInfo.TransactionDate === null) {
          this.invoiceInfoObj.InvoiceInfo.TransactionDate = this.invoiceInfoObj.VisitInfo.DischargeDate;
        }
        //this.invoiceInfoObj.InvoiceInfo.InvoiceNumFormatted = 'DS-' + this.invoiceInfoObj.DischargeInfo.StatementNo;
        this.isInvoiceFound = true;
        this.invoiceType = ENUM_InvoiceType.inpatientDischarge;//'ip-discharge';
        this.showDischargeStatement = true;

      }

    });
  }

  public GetBillingHeaderParameter(): void {
    const param = this.coreService.Parameters.find(a => a.ParameterName === 'DischargePrintSettings');
    const paramValue = param ? param.ParameterValue : null;
    if (paramValue)
      this.DischargePrintSettings = JSON.parse(paramValue);
    else
      this.messageBoxService.showMessage(ENUM_MessageBox_Status.Error, ["Please enter parameter values for DischargePrintSettings"]);
  }
}


