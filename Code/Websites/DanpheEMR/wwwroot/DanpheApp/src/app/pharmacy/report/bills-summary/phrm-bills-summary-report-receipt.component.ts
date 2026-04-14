import { ChangeDetectorRef, Component, EventEmitter, Input, Output } from "@angular/core";
import { CoreService } from "../../../core/shared/core.service";
import { DispensaryService } from "../../../dispensary/shared/dispensary.service";
import { PrinterSettingsModel } from "../../../settings-new/printers/printer-settings.model";
import { MessageboxService } from "../../../shared/messagebox/messagebox.service";
import { ENUM_MessageBox_Status } from "../../../shared/shared-enums";
import { PHRMBillSummaryDetailReportData } from "../../shared/pharmacy-bill-summary-detail-report";

@Component({
    selector: 'bill-summary-report-receipt',
    templateUrl: "./phrm-bills-summary-report-receipt.component.html"
})
export class PHRMBillSummaryReportReceiptComponent {

    InvoiceLabel: string = "Pharmacy Bill Summary";
    @Output("call-back-print")
    callBackPrint: EventEmitter<object> = new EventEmitter();
    billSummaryForReceipt: Array<PHRMBillSummaryDetailReportData> = new Array<PHRMBillSummaryDetailReportData>();
    @Input('selected-bill-summary-list')
    public set billSummary(value: Array<PHRMBillSummaryDetailReportData>) {
        if (value) {
            this.billSummaryForReceipt = value;
        }
    }

    @Input() data!: { TotalSubTotal: number; TotalAmount: number; TotalDiscountAmount: number; PaymentMode: string };
    public headerDetail: { hospitalName, address, email, PANno, tel, DDA };
    public selectedPrinter: PrinterSettingsModel = new PrinterSettingsModel();
    receipt: PHRMBillSummaryDetailReportData = new PHRMBillSummaryDetailReportData();
    public openBrowserPrintWindow: boolean = false;
    public browserPrintContentObj: any = { innerHTML: '' };
    Patient = {};
    PatientAddress: string = '';
    constructor(public coreService: CoreService,
        public messageBoxService: MessageboxService,
        public _dispensaryService: DispensaryService,
        private changeDetector: ChangeDetectorRef) { }
    ngOnInit() {
        this.GetPharmacyBillingHeaderParameter();
        if (this.billSummaryForReceipt && this.billSummaryForReceipt.length && this.billSummaryForReceipt[0].PatientId > 0) {
            this.receipt = this.billSummaryForReceipt[0];
            this.Patient = {
                Addresss: this.receipt.Address,
                MunicipalityName: this.receipt.MunicipalityName,
                CountrySubDivisionName: this.receipt.CountrySubDivisionName,
                CountryName: this.receipt.CountryName,
                WardNumber: this.receipt.WardNumber
            };
            this.PatientAddress = this.coreService.SortPatientAddress(this.Patient);
        }
    }
    callBackBillPrint($event) {
        if ($event) {
            this.callBackPrint.emit();
        }
    }
    GetPharmacyBillingHeaderParameter() {
        var paramValue = this.coreService.Parameters.find(a => a.ParameterName == 'Pharmacy BillingHeader').ParameterValue;
        if (paramValue)
            this.headerDetail = JSON.parse(paramValue);
        else
            this.messageBoxService.showMessage(ENUM_MessageBox_Status.Error, ["Please enter parameter values for BillingHeader"]);
    }
    OnPrinterChanged($event) {
        this.selectedPrinter = $event;
    }
    public print(idToBePrinted: string = 'printpage') {
        this.browserPrintContentObj.innerHTML = document.getElementById(idToBePrinted).innerHTML;
        this.openBrowserPrintWindow = false;
        this.changeDetector.detectChanges();
        this.openBrowserPrintWindow = true;
    }
}