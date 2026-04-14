import { Component } from '@angular/core';
import * as moment from 'moment/moment';
import { CoreService } from "../../../core/shared/core.service";
import { ServiceDepartment } from '../../../settings-new/shared/service-department.model';
import { CommonFunctions } from '../../../shared/common.functions';
import { IGridFilterParameter } from '../../../shared/danphe-grid/grid-filter-parameter.interface';
import { DLService } from "../../../shared/dl.service";
import { MessageboxService } from '../../../shared/messagebox/messagebox.service';
import { ReportingService } from "../../shared/reporting-service";

@Component({
    selector: 'service-department-wise-copayment-report',
    templateUrl: './service-department-wise-copayment-report.html',
})
export class RPT_BIL_ServiceDepartmentWiseCopaymentReportComponent {

    public fromDate: string = null;
    public toDate: string = null;
    public selBillingTypeName: string = "all";
    public dateRange: string = "";
    //below variables are for calcuation of summary amounts.
    public tot_CashSales: number = 0;
    public tot_CreditSales: number = 0;
    public tot_ReturnCreditSales: number = 0;

    public tot_NetSales: number = 0;
    public ServiceDepartment: any = null;
    public ServiceDepartmentList: Array<ServiceDepartment> = new Array<ServiceDepartment>();

    ServiceDepartmentWiseCopaymentReport
        : Array<any> = null;

    DepartmentWiseCopaymentData: Array<any> = new Array<any>();


    public footerContent = '';
    public tot_NetQuantity: number = 0;
    public tot_ReturnQuantity: number = 0;
    public tot_CoPayCreditAmount: number = 0;
    public tot_CoPayCashAmount: number = 0;
    public tot_RetCoPayCashAmount: number = 0;
    public tot_NetCoPayCreditAmount: number = 0;
    public tot_NetCoPayCashAmount: number = 0;
    public tot_RetCoPayCreditAmount: number = 0;
    public FilterParameters: IGridFilterParameter[] = [];
    public serviceDepartmentId: number = 0;
    public selectedServiceDepartmet: string = '';

    constructor(
        public dlService: DLService, public msgBoxServ: MessageboxService, public coreService: CoreService, public reportServ: ReportingService) {
        this.ServiceDepartmentWiseCopaymentReport
            = this.reportServ.reportGridCols.ServiceDepartmentWiseCopaymentReport;
        this.GetAllDepartmentList();

    }

    ngAfterViewChecked() {
        if (document.getElementById("dvSummary_ServiceDepartmentWiseCopaymentReport") !== null)
            this.footerContent = document.getElementById("dvSummary_ServiceDepartmentWiseCopaymentReport").innerHTML;
    }

    gridExportOptions = {
        fileName: 'IncomeSegregation_' + moment().format('YYYY-MM-DD') + '.xls'
    };

    public loading: boolean = false;

    Load() {

        this.DepartmentWiseCopaymentData = [];
        this.serviceDepartmentId = !!this.ServiceDepartment ? this.ServiceDepartment.ServiceDepartmentId : null;
        if (this.serviceDepartmentId != null) {
            let selectedSerciceDepartmet = this.ServiceDepartmentList.find(a => a.ServiceDepartmentId == this.serviceDepartmentId);
            if (selectedSerciceDepartmet) {
                this.selectedServiceDepartmet = selectedSerciceDepartmet.ServiceDepartmentName;
            }
        }
        if (this.fromDate != null && this.toDate != null) {
            this.dlService.Read("/BillingReports/ServiceDepartmentWiseCopaymentReport?FromDate="
                + this.fromDate + "&ToDate=" + this.toDate + "&ServiceDepartmentId=" + this.serviceDepartmentId)
                .map(res => res)
                .finally(() => { this.loading = false; })
                .subscribe(res => this.Success(res),
                    res => this.Error(res));
            this.FilterParameters = [
                { DisplayName: "Service Department", Value: this.selectedServiceDepartmet !== '' ? this.selectedServiceDepartmet : 'All' },
                { DisplayName: "DateRange", Value: `<b>From:</b>&nbsp;${this.fromDate}&nbsp;<b>To:</b>&nbsp;${this.toDate}` },
            ]
        }
        else {
            this.msgBoxServ.showMessage("error", ['Dates Provided is not Proper']);
        }

    }
    Error(err) {
        this.msgBoxServ.showMessage("error", [err]);
    }

    Success(res) {
        if (res.Status == "OK" && res.Results.length > 0) {

            this.DepartmentWiseCopaymentData = res.Results;
            this.CalculateSummaryAmounts(this.DepartmentWiseCopaymentData);
            this.FormatAmountsForGrid(this.DepartmentWiseCopaymentData);//pass this data for formatting.
            this.LoadExportOptions();

        }
        else if (res.Status == "OK" && res.Results.length == 0) {
            this.msgBoxServ.showMessage("notice-message", ["No Data is Available For Selcted Parameter"]);

            this.DepartmentWiseCopaymentData = res.Results;
        }
        else {
            this.msgBoxServ.showMessage("failed", [res.ErrorMessage]);
        }
    }

    //Function to parse each amount properites 
    public FormatAmountsForGrid(ipDataArr: Array<any>) {
        if (ipDataArr && ipDataArr.length) {
            ipDataArr.forEach(itm => {
                itm.CashSales = CommonFunctions.parseAmount(itm.CashSales);
                itm.TotalSalesQty = CommonFunctions.parseAmount(itm.TotalSalesQty);
                itm.NetSales = CommonFunctions.parseAmount(itm.NetSales);
                itm.ReturnCreditSales = CommonFunctions.parseAmount(itm.ReturnCreditSales);
                itm.NetSales = CommonFunctions.parseAmount(itm.NetSales);
                itm.ReturnQty = CommonFunctions.parseAmount(itm.ReturnQty);
                itm.NetQuantity = CommonFunctions.parseAmount(itm.NetQuantity);
                itm.TotalCoPayCashAmount = CommonFunctions.parseAmount(itm.TotalCoPayCashAmount);
                itm.TotalCoPayCreditAmount = CommonFunctions.parseAmount(itm.TotalCoPayCreditAmount);
                itm.RetCoPayCashAmount = CommonFunctions.parseAmount(itm.RetCoPayCashAmount);
                itm.RetCopayCreditAmount = CommonFunctions.parseAmount(itm.RetCopayCreditAmount);
                itm.NetCoPayCashAmount = CommonFunctions.parseAmount(itm.NetCoPayCashAmount);
                itm.NetCoPayCreditAmount = CommonFunctions.parseAmount(itm.NetCoPayCreditAmount);

            });
        }
    }

    public CalculateSummaryAmounts(ipDataArr: Array<any>) {
        //resetting all Sum variables to ZERO.
        this.tot_CreditSales = this.tot_ReturnCreditSales = this.tot_ReturnCreditSales = this.tot_NetSales = this.tot_CoPayCreditAmount = this.tot_CoPayCashAmount = this.tot_RetCoPayCashAmount = this.tot_RetCoPayCreditAmount = this.tot_NetCoPayCreditAmount = this.tot_NetCoPayCashAmount = 0;

        if (ipDataArr && ipDataArr.length) {
            ipDataArr.forEach(itm => {
                this.tot_CreditSales += itm.GrossSales;
                this.tot_ReturnCreditSales += itm.ReturnCreditSales;
                this.tot_NetSales += itm.NetSales;
                this.tot_NetQuantity += itm.NetQuantity;
                this.tot_ReturnQuantity += itm.ReturnQty;
                this.tot_CoPayCreditAmount += itm.TotalCoPayCreditAmount;
                this.tot_CoPayCashAmount += itm.TotalCoPayCashAmount;
                this.tot_RetCoPayCashAmount += itm.RetCoPayCashAmount;
                this.tot_RetCoPayCreditAmount += itm.RetCopayCreditAmount;
                this.tot_NetCoPayCreditAmount += itm.NetCoPayCreditAmount;
                this.tot_NetCoPayCashAmount += itm.NetCoPayCashAmount;
            });
            this.tot_CreditSales = CommonFunctions.parseAmount(this.tot_CreditSales);
            this.tot_ReturnCreditSales = CommonFunctions.parseAmount(this.tot_ReturnCreditSales);
            this.tot_NetSales = CommonFunctions.parseAmount(this.tot_NetSales);
            this.tot_NetQuantity = CommonFunctions.parseAmount(this.tot_NetQuantity);
            this.tot_ReturnQuantity = CommonFunctions.parseAmount(this.tot_ReturnQuantity);
            this.tot_CoPayCreditAmount = CommonFunctions.parseAmount(this.tot_CoPayCreditAmount);
            this.tot_CoPayCashAmount = CommonFunctions.parseAmount(this.tot_CoPayCashAmount);
            this.tot_RetCoPayCashAmount = CommonFunctions.parseAmount(this.tot_RetCoPayCashAmount);
            this.tot_RetCoPayCreditAmount = CommonFunctions.parseAmount(this.tot_RetCoPayCreditAmount);
            this.tot_NetCoPayCreditAmount = CommonFunctions.parseAmount(this.tot_NetCoPayCreditAmount);
            this.tot_NetCoPayCashAmount = CommonFunctions.parseAmount(this.tot_NetCoPayCashAmount);
        }

    }

    public ServiceDepartmentListFormatter(data: any): string {
        return data["ServiceDepartmentName"];
    }
    //on click grid export button we are catching in component an event.. 
    //and in that event we are calling the server excel export....
    // OnGridExport($event: GridEmitModel) {
    //     this.dlService.ReadExcel("/ReportingNew/ExportToExcelIncomeSegregation?FromDate="
    //         + this.fromDate + "&ToDate=" + this.toDate)
    //         .map(res => res)
    //         .subscribe(data => {
    //             let blob = data;
    //             let a = document.createElement("a");
    //             a.href = URL.createObjectURL(blob);
    //             a.download = "IncomeSegregation_" + moment().format("DD-MMM-YYYY_HHmmA") + '.xls';
    //             document.body.appendChild(a);
    //             a.click();
    //         },

    //             res => this.ErrorMsg(res));
    // }
    LoadExportOptions() {

        this.gridExportOptions = {
            fileName: 'ServiceDepartmentWiseCopaymentReport' + moment().format('YYYY-MM-DD') + '.xls',
        };
    }
    ErrorMsg(err) {
        this.msgBoxServ.showMessage("error", ["Sorry!!! Not able export the excel file."]);
        console.log(err.ErrorMessage);
    }


    //-reusable From-ToDate-In Reports..
    OnFromToDateChange($event) {
        this.fromDate = $event ? $event.fromDate : this.fromDate;
        this.toDate = $event ? $event.toDate : this.toDate;
        this.dateRange = "<b>Date:</b>&nbsp;" + this.fromDate + "&nbsp;<b>To</b>&nbsp;" + this.toDate;
    }
    private GetAllDepartmentList() {
        this.dlService.Read("/BillingReports/GetAllDepartmentList")
            .map(res => res)
            .subscribe(res => {
                if (res.Status == "OK") {
                    this.ServiceDepartmentList = res.Results;
                }
                else {
                    this.msgBoxServ.showMessage("Notice-Message", ["Failed to load department list."]);
                }
            }, err => {
                console.log(err);
                this.msgBoxServ.showMessage("Failed", ["Failed to load department list."]);
            });
    }

}
