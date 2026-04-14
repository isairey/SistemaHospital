import { Component } from '@angular/core';
import * as moment from 'moment/moment';
import { DanpheHTTPResponse } from '../../../shared/common-models';
import { IGridFilterParameter } from '../../../shared/danphe-grid/grid-filter-parameter.interface';
import { NepaliDateInGridColumnDetail, NepaliDateInGridParams } from '../../../shared/danphe-grid/NepaliColGridSettingsModel';
import { MessageboxService } from '../../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status } from '../../../shared/shared-enums';
import { PharmacyBLService } from "../../shared/pharmacy.bl.service";
import PHRMReportsGridColumns from "../../shared/phrm-reports-grid-columns";
import { PHRMReportsModel } from "../../shared/phrm-reports-model";
import { PHRMSupplierModel } from '../../shared/phrm-supplier.model';

@Component({
    templateUrl: "./phrm-return-to-supplier-report.html"

})
export class PHRMReturnToSupplierReportComponent {
    PHRMReturnToSupplierReportColumn: Array<any> = null;
    PHRMReturnToSupplierReportData: Array<any> = new Array<PHRMReportsModel>();
    public phrmReports: PHRMReportsModel = new PHRMReportsModel();
    public NepaliDateInGridSettings: NepaliDateInGridParams = new NepaliDateInGridParams();
    public dateRange: string = "";
    public pharmacy: string = "pharmacy";
    public title: string = "Return To Supplier Report";
    public loading: boolean;
    public msgserv: MessageboxService;
    public supplierList: Array<PHRMSupplierModel> = new Array<PHRMSupplierModel>();
    //selSupplier: {SupplierId: number, SupplierName: string};
    public SupplierId: number = null;
    public SupplierName: string = '';
    public SelectedSupplier: PHRMSupplierModel = new PHRMSupplierModel();
    SummaryData: ReturnToSupplierReportSummary = new ReturnToSupplierReportSummary();
    FooterContent: string;
    FooterContentForDetailReport: string;
    ReturnToSupplierReportFilterParameters: IGridFilterParameter[] = [];
    constructor(public pharmacyBLService: PharmacyBLService, public msgBoxServ: MessageboxService) {
        this.PHRMReturnToSupplierReportColumn = PHRMReportsGridColumns.PHRMReturnToSupplierReport;
        this.phrmReports.FromDate = moment().format('YYYY-MM-DD');
        this.phrmReports.ToDate = moment().format('YYYY-MM-DD');
        this.NepaliDateInGridSettings.NepaliDateColumnList.push(new NepaliDateInGridColumnDetail("Date", false));
        this.GetSupplierList();
    };

    //Export data grid options for excel file
    gridExportOptions = {
        fileName: 'PharmacyReturnToSupplierReport_' + moment().format('YYYY-MM-DD') + '.xls',
    };
    GetSupplierList() {
        this.pharmacyBLService.GetSupplierList()
            .subscribe((res: DanpheHTTPResponse) => {
                if (res.Status === ENUM_DanpheHTTPResponses.OK) {
                    this.supplierList = res.Results;
                    this.supplierList = this.supplierList.filter(suplr => suplr.IsActive == true);
                }
                else {
                    this.msgserv.showMessage(ENUM_MessageBox_Status.Failed, ['Failed to get SupplierList.' + res.ErrorMessage]);
                }
            },
                err => {
                    this.msgserv.showMessage(ENUM_MessageBox_Status.Error, ['Failed to get SupplierList.' + err.ErrorMessage]);
                }
            )
    }
    SupplierListFormatter(data: any): string {
        let html = data["SupplierName"];
        return html;
    }

    Load() {
        this.loading = true;
        this.ReturnToSupplierReportFilterParameters = [
            { DisplayName: "Supplier Name:", Value: this.SupplierName == '' ? 'All' : this.SupplierName }
        ];
        this.SummaryData = new ReturnToSupplierReportSummary();
        this.pharmacyBLService.GetPHRMReturnToSupplierReport(this.phrmReports, this.SupplierId)
            .subscribe((res: DanpheHTTPResponse) => {
                if (res.Status === ENUM_DanpheHTTPResponses.OK) {

                    this.PHRMReturnToSupplierReportData = res.Results;
                    this.SummaryData.SubTotal = this.PHRMReturnToSupplierReportData.reduce((a, b) => a + b.SubTotal, 0);
                    this.SummaryData.DiscountAmount = this.PHRMReturnToSupplierReportData.reduce((a, b) => a + b.DiscountAmount, 0);
                    this.SummaryData.VATAmount = this.PHRMReturnToSupplierReportData.reduce((a, b) => a + b.VATAmount, 0);
                    this.SummaryData.TotalAmount = this.PHRMReturnToSupplierReportData.reduce((a, b) => a + b.TotalAmount, 0);
                    this.SelectedSupplier = null;
                    this.SupplierId = null;
                    this.SupplierName = "";

                }
                else {

                    this.msgBoxServ.showMessage(ENUM_DanpheHTTPResponses.Failed, [res.ErrorMessage])
                }
                this.loading = false;
            });
    }

    OnSupplierSelected() {
        if (this.SelectedSupplier && this.SelectedSupplier.SupplierId) {
            this.SupplierId = this.SelectedSupplier.SupplierId;
            this.SupplierName = this.SelectedSupplier.SupplierName;
        }
        else {
            this.SupplierId = null;
            this.SupplierName = '';
        }
    }

    OnFromToDateChange($event) {
        this.phrmReports.FromDate = $event ? $event.fromDate : this.phrmReports.FromDate;
        this.phrmReports.ToDate = $event ? $event.toDate : this.phrmReports.ToDate;
        this.dateRange = "<b>Date:</b>&nbsp;" + this.phrmReports.FromDate + "&nbsp;<b>To</b>&nbsp;" + this.phrmReports.ToDate;
    }


    ngAfterViewChecked() {
        if (document.getElementById("return_to_supplier_detail_report_print_summary") != null) {
            this.FooterContentForDetailReport = document.getElementById("return_to_supplier_detail_report_print_summary").innerHTML;
        }
    }

}

class ReturnToSupplierReportSummary {
    SubTotal: number = 0;
    DiscountAmount: number = 0;
    VATAmount: number = 0;
    TotalAmount: number = 0;
}