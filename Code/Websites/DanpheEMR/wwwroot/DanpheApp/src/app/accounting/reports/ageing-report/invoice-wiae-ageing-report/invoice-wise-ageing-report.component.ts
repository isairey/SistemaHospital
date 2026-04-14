import { Component } from "@angular/core";
import { DanpheHTTPResponse } from "../../../../shared/common-models";
import { MessageboxService } from "../../../../shared/messagebox/messagebox.service";
import { ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status } from "../../../../shared/shared-enums";
import { SectionModel } from "../../../settings/shared/section.model";
import { AccountingService } from "../../../shared/accounting.service";
import { AgeingReportDetailView_DTO } from "../../shared/DTOs/ageing-report-detail.dto";
import { AccountingReportsBLService } from "../../shared/accounting-reports.bl.service";

@Component({
    selector: 'invoice-wise-ageing-report',
    templateUrl: './invoice-wise-ageing-report.component.html',
})
export class InvoiceWiseAgeingReportComponent {
    SectionList: Array<SectionModel> = new Array<SectionModel>();
    SectionId: number = -1;
    IsVendorBillWiseAgeing: boolean = false;
    NumberOfAgeingInterval: number = 4;
    DurationOfAgeingInterval: number = 30;
    Loading: boolean = false;
    AgeingReportData: Array<any> = new Array<any>();
    TableHeader: any;
    ShowDetail: boolean = false;
    GoodReceiptDetail: Array<AgeingReportDetailView_DTO> = new Array<AgeingReportDetailView_DTO>();
    SearchString: string = '';

    GoodReceiptSummary = {
        TotalAmount: 0,
        PaidAmount: 0,
        DueAmount: 0
    }
    constructor(private _accountingService: AccountingService, private _accountingReportBlService: AccountingReportsBLService, private _messageBoxService: MessageboxService) {
        this.SectionList = this._accountingService.accCacheData.Sections;
        let pharmacySection = 3;
        let inventorySection = 1;
        this.SectionList = this.SectionList.filter(sec => sec.SectionId === pharmacySection || sec.SectionId === inventorySection);
        this._accountingService.getCoreparameterValue();
    }

    LoadAgeingReportData() {
        let sectionIdList: Array<number> = new Array<number>();
        if (this.SectionId === -1) {
            sectionIdList = this.SectionList.map(a => { return a.SectionId });
        }
        else {
            sectionIdList.push(this.SectionId);
        }
        let sectionIds = JSON.stringify(sectionIdList).replace(/\[|\]/g, "")
        if (!(sectionIds && sectionIds.length > 0)) {
            this._messageBoxService.showMessage(ENUM_MessageBox_Status.Warning, [`No Section is mapped with current account section. Please map and try again...`]);
            return;
        }
        this.Loading = true;
        this.AgeingReportData = [];

        this._accountingReportBlService.GetAgeingReport(this.NumberOfAgeingInterval, this.DurationOfAgeingInterval, sectionIds, this.IsVendorBillWiseAgeing)
            .subscribe({
                next: (res: DanpheHTTPResponse) => {
                    if (res.Status === ENUM_DanpheHTTPResponses.OK && res.Results && res.Results.length > 0) {
                        this.AgeingReportData = res.Results;
                        this.TableHeader = Object.keys(this.AgeingReportData[0]);
                        this.TableHeader = this.TableHeader.filter(a => a !== "SectionId" && a !== "SupplierId");
                    }
                },
                error: (err: DanpheHTTPResponse) => {
                    this.Loading = false;
                    console.log(err);
                },
                complete: () => {
                    this.Loading = false;
                }
            });
    }

    Print(tableId) {
        this._accountingService.Print(tableId)

    }
    ExportToExcel(tableId) {
        this._accountingService.ExportToExcel(tableId);
    }

    OnTableCellClicked(header: any, supplierId: number, sectionId: number) {
        try {
            if (this.Loading) {
                return;
            }
            this.Loading = true;
            const datePattern = /\d{4}-\d{2}-\d{2}/g;
            const matchingDates = header.match(datePattern);
            let fromDate = matchingDates && matchingDates.length > 0 ? matchingDates[0] : "";
            let toDate = matchingDates && matchingDates.length > 1 ? matchingDates[1] : "";

            this._accountingReportBlService.GetAgeingReportDetailView(sectionId, fromDate, toDate, supplierId, this.IsVendorBillWiseAgeing)
                .subscribe({
                    next: (res: DanpheHTTPResponse) => {
                        if (res.Status === ENUM_DanpheHTTPResponses.OK && res.Results && res.Results.length > 0) {
                            this.GoodReceiptDetail = res.Results;
                            console.table(this.GoodReceiptDetail);
                            this.GoodReceiptSummary.TotalAmount = this.GoodReceiptDetail.reduce((acc, gr) => (acc + gr.TotalAmount), 0);
                            this.GoodReceiptSummary.PaidAmount = this.GoodReceiptDetail.reduce((acc, gr) => (acc + gr.PaidAmount), 0);
                            this.GoodReceiptSummary.DueAmount = this.GoodReceiptDetail.reduce((acc, gr) => (acc + gr.DueAmount), 0);
                            this.ShowDetail = true;
                        }
                    },
                    error: (err: DanpheHTTPResponse) => {
                        this.Loading = false;
                        console.log(err);
                    },
                    complete: () => {
                        this.Loading = false;
                    }
                });
        }
        catch {
            this.Loading = false;
        }
    }

    CloseDetail() {
        this.ShowDetail = false;
    }
}