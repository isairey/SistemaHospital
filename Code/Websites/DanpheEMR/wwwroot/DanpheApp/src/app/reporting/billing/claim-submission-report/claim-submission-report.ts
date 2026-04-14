import { Component } from '@angular/core';
import * as moment from 'moment';
import { NepaliDateInGridColumnDetail, NepaliDateInGridParams } from '../../../shared/danphe-grid/NepaliColGridSettingsModel';
import GridColumnSettings from '../../../shared/danphe-grid/grid-column-settings.constant';
import { DLService } from '../../../shared/dl.service';
import { MessageboxService } from '../../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status } from '../../../shared/shared-enums';
import { ClaimSubmissionReport_DTO } from './claim-submission-report-dto';


@Component({
    templateUrl: "./claim-submission-report.html"
})
export class RPT_BIL_ClaimSubmissionReportComponent {

    public FromDate: string = "";
    public ToDate: string = "";
    public dateRange: string = "";
    public IsDateValid: boolean = true;
    public loading: boolean = false;
    public showReport: boolean = false;
    public ClaimSubmissionReportGridCol: Array<any> = null;
    public NepaliDateInGridSettings = new NepaliDateInGridParams();
    public ClaimSubmissionReportData = new Array<ClaimSubmissionReport_DTO>();

    constructor(
        public dlService: DLService,
        public msgBoxServ: MessageboxService,
    ) {
        this.ClaimSubmissionReportGridCol = GridColumnSettings.ClaimSubmissionReportGridCol;
        this.NepaliDateInGridSettings.NepaliDateColumnList.push(new NepaliDateInGridColumnDetail("TransactionDate", false));
    }


    OnFromToDateChange($event) {
        this.FromDate = $event ? $event.fromDate : this.FromDate;
        this.ToDate = $event ? $event.toDate : this.ToDate;
        this.dateRange = "<b>Date:</b>&nbsp;" + this.FromDate + "&nbsp;<b>To</b>&nbsp;" + this.ToDate;

    }

    DateValidCheck() {
        if (this.ToDate && this.FromDate) {
            var currDate = moment().format('YYYY-MM-DD');
            if ((moment(this.ToDate).diff(currDate) > 0) ||
                (moment(this.ToDate) < moment(this.FromDate))) {
                this.IsDateValid = false;
            }
            else {
                this.IsDateValid = true;
            }
        }
    }

    LoadClaimSubmissionReportSummary() {
        if (this.IsDateValid) {
            this.dlService.Read("/BillingReports/ClaimSubmissionReport?FromDate=" + this.FromDate + "&ToDate=" + this.ToDate)
                .map(res => res)
                .finally(() => { this.loading = false; })
                .subscribe(res => {
                    if (res.Status === ENUM_DanpheHTTPResponses.OK) {
                        this.ClaimSubmissionReportData = res.Results;
                    }
                    else {
                        this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Notice, ['Data Not Available for Selected Parameters...']);
                    }
                });
            this.showReport = true;
        }
    }


    gridExportOptions = {
        fileName: 'Claim Submission Report' + moment().format('YYYY-MM-DD') + '.xls'
    };
}