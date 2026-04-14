import { Component } from "@angular/core";
import { CoreService } from "../../../core/shared/core.service";
import { SecurityService } from "../../../security/shared/security.service";
import { NepaliCalendarService } from "../../../shared/calendar/np/nepali-calendar.service";
import { DanpheHTTPResponse } from "../../../shared/common-models";
import { MessageboxService } from "../../../shared/messagebox/messagebox.service";
import { ENUM_DanpheHTTPResponseText, ENUM_MessageBox_Status } from "../../../shared/shared-enums";
import { Hospital_DTO } from "../../settings/shared/dto/hospitals.dto";
import { AccountingService } from "../../shared/accounting.service";
import { AccountingReportsBLService } from "../shared/accounting-reports.bl.service";
import { CustomerHeader } from "../subledger-report/subledger-report-vm";

@Component({
    templateUrl: "./account-head-detail-report.component.html",
    styleUrls: ['./account-head-detail-report.css']
})
export class AccountHeadDetailReportComponent {

    public Data: Array<any> = null;
    public ShowSubLedger: boolean = false;
    public ShowButton: boolean = false;
    public Loading: boolean = false;
    public DateRange: string = ``;
    public HeaderDetail: CustomerHeader = new CustomerHeader();
    public HospitalList: Array<Hospital_DTO> = new Array<Hospital_DTO>();
    public SelectedHospital: number = 0;
    public HospitalId: number = 0;
    public subLedgerAndCostCenterSetting = {
        "EnableSubLedger": false,
        "EnableCostCenter": false
    };
    public ActiveHospital: number = 0;

    constructor(public accReportBLService: AccountingReportsBLService, public accountingService: AccountingService,
        public securityService: SecurityService,
        public coreService: CoreService,
        public msgBoxServ: MessageboxService,
        public nepaliCalendarServ: NepaliCalendarService) {
        this.ReadParameter()
        this.accountingService.getCoreparameterValue();
        this.CheckAndAssignHospital();

    }
    CheckAndAssignHospital() {
        this.ActiveHospital = this.securityService.AccHospitalInfo.ActiveHospitalId;
        this.HospitalList = this.accountingService.accCacheData.Hospitals ? this.accountingService.accCacheData.Hospitals : [];
        if (this.HospitalList.length === 1) {
            this.SelectedHospital = this.HospitalList[0].HospitalId;
        } else {
            this.SelectedHospital = this.ActiveHospital;
        }
    }
    ReadParameter() {
        var paramValue = this.coreService.Parameters.find(a => a.ParameterGroupName === `Common` && a.ParameterName === `CustomerHeader`).ParameterValue;
        if (paramValue) {
            this.HeaderDetail = JSON.parse(paramValue);
        }
        let subLedgerParma = this.coreService.Parameters.find(a => a.ParameterGroupName === "Accounting" && a.ParameterName === "SubLedgerAndCostCenter");
        if (subLedgerParma) {
            this.subLedgerAndCostCenterSetting = JSON.parse(subLedgerParma.ParameterValue);
        }
    }
    LoadData() {
        this.Loading = true;
        this.HospitalId = this.SelectedHospital;
        if (this.CheckValidation()) {
            this.accReportBLService.GetAccountHeadDetailReport(this.HospitalId)
                .finally(() => { this.Loading = false; })
                .subscribe((res: DanpheHTTPResponse) => {
                    if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
                        this.Data = res.Results;
                        this.ShowButton = true;
                    }
                })
        }
        else {
            this.Loading = false;
        }
    }
    CheckValidation(): boolean {
        let flag = true;
        if (!this.HospitalId) {
            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Warning, ['Please select Account Section']);
            flag = false;
        }
        return flag;
    }
    Print(tableId) {
        this.accountingService.Print(tableId, this.DateRange)

    }
    ExportToExcel(tableId) {
        this.accountingService.ExportToExcel(tableId, this.DateRange);
    }
}


