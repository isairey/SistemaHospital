import { Component, OnInit } from "@angular/core";
import * as moment from "moment";
import { Observable } from "rxjs";
import { PharmacyBLService } from "../../../pharmacy/shared/pharmacy.bl.service";
import { PHRMPatient } from "../../../pharmacy/shared/phrm-patient.model";
import GridColumnSettings from "../../../shared/danphe-grid/grid-column-settings.constant";
import { MessageboxService } from "../../../shared/messagebox/messagebox.service";
import { ENUM_DanpheHTTPResponses } from "../../../shared/shared-enums";
import { ClaimDocumentReceivedReport_DTO } from "../../shared/DTOs/claim-document-received-report.dto";
import { ClaimManagementBLService } from "../../shared/claim-management.bl.service";

@Component({
    selector: 'reports',
    templateUrl: './ins-claim-document-received-report.component.html'
})
export class ClaimDocumentReceivedReportComponent implements OnInit {
    FromDate: string = '';
    ToDate: string = '';
    loading: boolean = false;
    claimDocumentReceivedList: Array<ClaimDocumentReceivedReport_DTO> = new Array<ClaimDocumentReceivedReport_DTO>();
    ClaimCode: number = null;
    InvoiceNo: string = '';
    ClaimDocumentReceivedReportColumn: Array<any> = null;
    SelectedPatient: PHRMPatient = null;
    PatientId: number = null;
    constructor(public claimManagementBlService: ClaimManagementBLService, public pharmacyBlService: PharmacyBLService, public messageBoxService: MessageboxService) {
        this.ClaimDocumentReceivedReportColumn = GridColumnSettings.ClaimDocumentReceivedReportColumn
    }
    ngOnInit(): void {
    }

    OnFromToDateChange($event) {
        this.FromDate = $event ? $event.fromDate : this.FromDate;
        this.ToDate = $event ? $event.toDate : this.ToDate;
    }
    Load() {
        this.claimDocumentReceivedList = [];
        this.claimManagementBlService.GetClaimDocumentReceivedReport(this.FromDate, this.ToDate, this.PatientId, this.ClaimCode, this.InvoiceNo).finally(() => { this.loading = false; })
            .subscribe(res => {
                if (res.Status == ENUM_DanpheHTTPResponses.OK) {
                    this.claimDocumentReceivedList = res.Results;
                }
            });
    }
    public AllPatientSearchAsync = (keyword: any): Observable<any[]> => {
        return this.pharmacyBlService.GetPatients(keyword, false);
    }
    OnPatientSelect() {
        if (this.SelectedPatient && this.SelectedPatient.PatientCode) {
            this.PatientId = this.SelectedPatient.PatientId;
        }
        else {
            this.PatientId = null;
        }
    }
    OnClaimCodeChanged() {
        if (!this.ClaimCode) {
            this.ClaimCode = null;
        }
    }
    OnInvoiceNoChanged() {
        if (!this.InvoiceNo) {
            this.InvoiceNo = '';
        }
    }
    PatientListFormatterByPatientName(data: any): string {
        let html = `[${data['PatientCode']}] | ${data["ShortName"]}`;
        return html;
    }
    gridExportOptions = {
        fileName: 'ClaimDocumentReceivedReport_' + moment().format('YYYY-MM-DD') + '.xls',
    };
}