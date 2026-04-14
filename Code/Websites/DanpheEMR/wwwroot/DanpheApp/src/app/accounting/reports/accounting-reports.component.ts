import { Component } from "@angular/core";
import { SecurityService } from "../../security/shared/security.service";
import { CodeDetailsModel } from "../../shared/code-details.model";
import { MessageboxService } from "../../shared/messagebox/messagebox.service";
import { ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status } from "../../shared/shared-enums";
import { LedgerModel } from "../settings/shared/ledger.model";
import { ledgerGroupModel } from "../settings/shared/ledgerGroup.model";
import { SubLedgerModel } from "../settings/shared/sub-ledger.model";
import { AccountingBLService } from "../shared/accounting.bl.service";
import { AccountingService } from "../shared/accounting.service";
import { AccountingReportsBLService } from "./shared/accounting-reports.bl.service";


@Component({
    templateUrl: "./accounting-reports-main.html"
})
export class AccountingReportsComponent {
    public AllLedgers: LedgerModel[] = [];
    public AllLedgerGroups: ledgerGroupModel[] = [];
    public AllSubLedgers: SubLedgerModel[] = [];
    validRoutes: any;
    public AllCodeDetails: CodeDetailsModel[] = [];
    constructor(public securityService: SecurityService, public msgBoxServ: MessageboxService, private accReportService: AccountingService,
        public accountingBLService: AccountingBLService, public accReportBLService: AccountingReportsBLService) {
        this.validRoutes = this.securityService.GetChildRoutes("Accounting/Reports");
        this.GetAllLedgerGroups();
        this.GetAllLedgers();
        this.GetAllSubLedger();
        this.GetAllCodeDetails();
        this.GetAllSections();
    }
    GetAllLedgerGroups() {
        this.accReportBLService.GetAllLedgerGroups()
            .subscribe(res => {
                if (res.Status === ENUM_DanpheHTTPResponses.OK && res.Results.length) {
                    this.AllLedgerGroups = res.Results;
                    this.accReportService.SetAllLedgerGroup(this.AllLedgerGroups);

                }
                else {
                    this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Notice, ["no record found."]);
                }

            });
    }
    GetAllLedgers() {
        this.accReportBLService.GetAllLedgers()
            .subscribe(res => {
                if (res.Status === ENUM_DanpheHTTPResponses.OK && res.Results.length) {
                    this.AllLedgers = res.Results;
                    this.accReportService.SetAllLedgers(this.AllLedgers);

                }
                else {
                    this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Notice, ["no record found."]);
                }

            });
    }
    GetAllSubLedger() {
        this.accReportBLService.GetAllSubLedger()
            .subscribe(res => {
                if (res.Status === ENUM_DanpheHTTPResponses.OK && res.Results.length) {
                    this.AllSubLedgers = res.Results;
                    this.accReportService.SetAllSubLedgers(this.AllSubLedgers);

                }
                else {
                    this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Notice, ["no record found."]);
                }

            });
    }

    GetAllCodeDetails() {
        this.accReportBLService.GetAllCodeDetails()
            .subscribe(res => {
                if (res.Status === ENUM_DanpheHTTPResponses.OK && res.Results.length) {
                    this.AllCodeDetails = res.Results;
                    this.accReportService.SetAllCodeDetails(this.AllCodeDetails);

                }
                else {
                    this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Notice, ["no record found."]);
                }

            });
    }

    GetAllSections() {
        this.accReportBLService.GetAllSections()
            .subscribe(res => {
                if (res.Status === ENUM_DanpheHTTPResponses.OK && res.Results.length) {
                    let sections = res.Results;
                    this.accReportService.SetAllSections(sections);
                }
                else {
                    this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Notice, ["no record found."]);
                }
            });
    }
}