import { Component } from '@angular/core';
import * as moment from 'moment';
import { PharmacyBLService } from '../../../../pharmacy/shared/pharmacy.bl.service';
import PHRMReportsGridColumns from '../../../../pharmacy/shared/phrm-reports-grid-columns';
import { MessageboxService } from '../../../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status } from '../../../../shared/shared-enums';
import { PHRMDepositBalanceReportModel } from '../../../shared/dispensary-deposit-balance-report.model';

@Component({
    selector: 'app-disp-deposit-balance-report',
    templateUrl: './disp-deposit-balance-report.component.html'
})

export class DispDepositBalanceReportComponent {
    PharmacyDepositBalanceReport = new Array<PHRMDepositBalanceReportModel>();
    DepositBalanceGridColumns: Array<any> = null;

    constructor(public pharmacyBlService: PharmacyBLService, public msgBoxServ: MessageboxService) {
        this.DepositBalanceGridColumns = PHRMReportsGridColumns.PHRMDepositBalanceReportColumns;
        this.GetDepositBalanceReport();
    }
    GetDepositBalanceReport() {
        this.pharmacyBlService.GetPhrmDepositBalanceReport()
            .subscribe(res => {
                if (res.Status === ENUM_DanpheHTTPResponses.OK && res.Results.length) {
                    this.PharmacyDepositBalanceReport = res.Results;
                }
                else {
                    this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ['No Data Available']);
                }
            });
    }
    gridExportOptions = {
        fileName: 'DepositBalanceList_' + moment().format('YYYY-MM-DD') + '.xls'
    };
}