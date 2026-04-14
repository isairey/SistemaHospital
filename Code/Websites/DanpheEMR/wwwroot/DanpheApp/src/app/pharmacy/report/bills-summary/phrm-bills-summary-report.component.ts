import { ChangeDetectorRef, Component } from "@angular/core";
import { Observable } from "rxjs";
import { GridEmitModel } from "../../../shared/danphe-grid/grid-emit.model";
import { MessageboxService } from "../../../shared/messagebox/messagebox.service";
import { ENUM_DanpheHTTPResponseText, ENUM_MessageBox_Status } from "../../../shared/shared-enums";
import { PHRMBillSummaryReportModel } from "../../shared/pharmacy-bill-summary-report.model";
import { PharmacyBLService } from "../../shared/pharmacy.bl.service";
import { PHRMPatient } from "../../shared/phrm-patient.model";
import PHRMReportsGridColumns from "../../shared/phrm-reports-grid-columns";

@Component({
    selector: 'bill-summary',
    templateUrl: "./phrm-bills-summary-report.component.html"
})
export class PHRMBillSummaryReportComponent {
    SearchedPatient: PHRMPatient = null;
    PatientId: number = null;
    PatientName: string = '';
    loading: boolean = false;
    VisitType: string = null;
    billSummaryReportData: Array<PHRMBillSummaryReportModel> = new Array<PHRMBillSummaryReportModel>();
    PHRMBillsSummaryReportColumns: Array<any> = null;
    showPrintButton: boolean = false;
    showBillDetailView: boolean = false;
    PatientVisitId: number = 0;
    selectedBillSummaryData: PHRMBillSummaryReportModel = new PHRMBillSummaryReportModel();
    ShowDischargeStatementBillReport: boolean = true;

    constructor(public pharmacyBLService: PharmacyBLService, public messageBoxService: MessageboxService, public changeDetector: ChangeDetectorRef) {
        this.PHRMBillsSummaryReportColumns = PHRMReportsGridColumns.PHRMBillSummaryReport;

    }
    public AllPatientSearchAsync = (keyword: any): Observable<any[]> => {
        return this.pharmacyBLService.GetPatients(keyword, false);
    }
    OnPatientChanged() {
        if (this.SearchedPatient && this.SearchedPatient.PatientId) {
            this.PatientId = this.SearchedPatient.PatientId;
            this.PatientName = this.SearchedPatient.ShortName;
        }
        else {
            this.PatientId = null;
            this.PatientName = null;
        }
    }
    patientListFormatter(data: any): string {
        let html = `${data["ShortName"]} [ ${data['PatientCode']} ]`;
        return html;
    }
    LoadReport() {
        this.loading = true;
        this.pharmacyBLService.GetVisitWiseBillsSummaryReport(this.PatientId, this.VisitType, this.ShowDischargeStatementBillReport).finally(() => {
            this.loading = false;
        }).subscribe(res => {
            if (res.Status === ENUM_DanpheHTTPResponseText.OK && res.Results.length) {
                this.billSummaryReportData = res.Results;
                this.SearchedPatient = null;
                this.PatientId = null;
                this.VisitType = null;
                this.changeDetector.detectChanges();
            }
            else {
                this.messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, ["No Data is Available for Selected Record"]);
                this.billSummaryReportData = null;
                this.SearchedPatient = null;
                this.PatientId = null;
                this.VisitType = null;
                this.changeDetector.detectChanges();

            }
        });
    }
    VisitTypes = [
        { value: null, label: 'All' },
        { value: 'inpatient', label: 'Inpatient' },
        { value: 'outpatient', label: 'Outpatient' },
        { value: 'emergency', label: 'Emergency' }
    ];
    SaleInvoiceGridActions($event: GridEmitModel) {
        switch ($event.Action) {
            case "detail": {
                if ($event.Data != null) {
                    this.selectedBillSummaryData = $event.Data;
                    this.PatientVisitId = this.selectedBillSummaryData.PatientVisitId;
                    if (this.PatientVisitId > 0) {
                        this.showBillDetailView = true;
                    }
                }
                break;
            }
            default:
                break;
        }
    }
    Close() {
        this.showBillDetailView = false;
    }
}