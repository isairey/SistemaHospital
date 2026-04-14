import { ChangeDetectorRef, Component, EventEmitter, Input, Output } from "@angular/core";
import { CommonFunctions } from "../../../shared/common.functions";
import { MessageboxService } from "../../../shared/messagebox/messagebox.service";
import { ENUM_DanpheHTTPResponseText, ENUM_MessageBox_Status } from "../../../shared/shared-enums";
import { PHRMBillSummaryDetailReportData } from "../../shared/pharmacy-bill-summary-detail-report";
import { PharmacyBLService } from "../../shared/pharmacy.bl.service";
import PHRMReportsGridColumns from "../../shared/phrm-reports-grid-columns";

@Component({
    selector: 'bill-summary-detail',
    templateUrl: "./phrm-bills-summary-report-detail.component.html"
})
export class PHRMBillSummaryReportDetailComponent {

    PaymentMode: string = null;
    PHRMBillsSummaryReportDetailColumns: Array<any> = null;

    @Input('PatientVisitId')
    PatientVisitId: number = 0;
    TotalSubTotal: number = 0;
    TotalDiscountAmount: number = 0;
    TotalAmount: number = 0;
    loading: boolean = false;
    showBillSummaryInvoice: boolean = false;
    billSummaryDetailList: Array<PHRMBillSummaryDetailReportData> = new Array<PHRMBillSummaryDetailReportData>();
    @Output("callback-close")
    callbackClose: EventEmitter<Object> = new EventEmitter<Object>();
    billSummaryForReceipt: Array<PHRMBillSummaryDetailReportData> = new Array<PHRMBillSummaryDetailReportData>();
    TotalSummaryValue = {};
    ShowPrintSummaryButton: boolean = true;
    IsMainLevelCheckBoxChecked: boolean = true;

    constructor(public pharmacyBLService: PharmacyBLService, public messageBoxService: MessageboxService, public changeDetector: ChangeDetectorRef) {
        this.PHRMBillsSummaryReportDetailColumns = PHRMReportsGridColumns.PHRMBillSummaryReport;

    }
    ngOnInit() {
        if (this.PatientVisitId > 0) {
            this.LoadReport();
        }
    }
    PaymentModes = [
        { value: null, label: 'All' },
        { value: 'cash', label: 'Cash' },
        { value: 'credit', label: 'Credit' }
    ];
    LoadReport() {
        this.pharmacyBLService.GetVisitWiseBillsDetailSummaryReport(this.PaymentMode, this.PatientVisitId).subscribe(res => {
            if (res.Status === ENUM_DanpheHTTPResponseText.OK && res.Results.length) {
                this.billSummaryDetailList = res.Results;
                this.billSummaryDetailList.forEach(b => {
                    b.IsbillChecked = true;
                });
                this.TotalSubTotal = this.billSummaryDetailList.reduce((a, b) => (a + b.SubTotal), 0);
                this.TotalAmount = this.billSummaryDetailList.reduce((a, b) => (a + b.TotalAmount), 0);
                this.TotalDiscountAmount = this.billSummaryDetailList.reduce((a, b) => (a + b.DiscountAmount), 0);

                this.TotalSubTotal = CommonFunctions.parseAmount(this.TotalSubTotal, 4);
                this.TotalAmount = CommonFunctions.parseAmount(this.TotalAmount, 4);
                this.TotalDiscountAmount = CommonFunctions.parseAmount(this.TotalDiscountAmount, 4);

                if (this.TotalAmount == 0) {
                    this.ShowPrintSummaryButton = false;
                }
                else {
                    this.ShowPrintSummaryButton = true;
                }
                this.changeDetector.detectChanges();
            }
            else {
                this.messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, ["No Data is Available for Selected Record"]);
                this.billSummaryDetailList = null;
                this.TotalSubTotal = 0;
                this.TotalDiscountAmount = 0;
                this.TotalAmount = 0;
                this.ShowPrintSummaryButton = false;
                this.changeDetector.detectChanges();
            }
        });
    }
    OnPaymentModeChanged() {
        if (this.PatientVisitId > 0) {
            this.LoadReport();
        }
    }
    GoBack() {
        this.callbackClose.emit();
    }
    PrintReport() {
        if (this.billSummaryDetailList && this.billSummaryDetailList.length) {
            this.showBillSummaryInvoice = true;
            this.billSummaryForReceipt = this.billSummaryDetailList.filter(c => c.IsbillChecked);
            let PaymentMode: string = '';
            const distinctPaymentModes = Array.from(new Set(this.billSummaryForReceipt.map(r => r.PaymentMode)));
            PaymentMode = distinctPaymentModes.join('&');
            this.TotalSummaryValue = {
                TotalSubTotal: this.TotalSubTotal,
                TotalAmount: this.TotalAmount,
                TotalDiscountAmount: this.TotalDiscountAmount,
                PaymentMode: PaymentMode
            };
        }
    }
    OnCheckedBill($event) {
        if ($event) {
            if (this.billSummaryDetailList.some(x => x.IsbillChecked === false)) {
                this.IsMainLevelCheckBoxChecked = false;
            }
            if (this.billSummaryDetailList.every(x => x.IsbillChecked === true)) {
                this.IsMainLevelCheckBoxChecked = true;
            }
            this.OnMainLevelDataChanged();
        }
    }
    OnMainLevelCheckBoxChecked($event) {
        if ($event) {
            if (this.IsMainLevelCheckBoxChecked) {
                if (this.billSummaryDetailList && this.billSummaryDetailList.length) {
                    this.billSummaryDetailList.map(i => i.IsbillChecked = true);
                    this.OnMainLevelDataChanged();
                }
            }
            else {
                this.billSummaryDetailList.map(i => i.IsbillChecked = false);
                this.OnMainLevelDataChanged();
            }
        }
    }
    OnInvoicePopUpClose() {
        this.showBillSummaryInvoice = false;
    }
    OnMainLevelDataChanged() {
        if (this.billSummaryDetailList && this.billSummaryDetailList.length) {
            this.TotalSubTotal = this.billSummaryDetailList.filter(c => c.IsbillChecked).reduce((a, b) => (a + b.SubTotal), 0);
            this.TotalAmount = this.billSummaryDetailList.filter(c => c.IsbillChecked).reduce((a, b) => (a + b.TotalAmount), 0);
            this.TotalDiscountAmount = this.billSummaryDetailList.filter(c => c.IsbillChecked).reduce((a, b) => (a + b.DiscountAmount), 0);

            this.TotalSubTotal = CommonFunctions.parseAmount(this.TotalSubTotal, 4);
            this.TotalAmount = CommonFunctions.parseAmount(this.TotalAmount, 4);
            this.TotalDiscountAmount = CommonFunctions.parseAmount(this.TotalDiscountAmount, 4);
        }
        if (this.TotalAmount === 0) {
            this.ShowPrintSummaryButton = false;
        }
        else {
            this.ShowPrintSummaryButton = true;
        }
        this.changeDetector.detectChanges();
    }
}