import { ChangeDetectorRef, Component } from '@angular/core';
import * as moment from 'moment';
import { CoreService } from '../../../core/shared/core.service';
import { CommonFunctions } from '../../../shared/common.functions';
import { IGridFilterParameter } from '../../../shared/danphe-grid/grid-filter-parameter.interface';
import { NepaliDateInGridColumnDetail, NepaliDateInGridParams } from '../../../shared/danphe-grid/NepaliColGridSettingsModel';
import { DLService } from '../../../shared/dl.service';
import { MessageboxService } from '../../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status } from '../../../shared/shared-enums';
import { PharmacyCompany_DTO } from '../../shared/dtos/pharmacy-company.dto';
import { PharmacyGeneric_DTO } from '../../shared/dtos/pharmacy-generic.dto';
import { PHRMNarcoticLedger_DTO } from '../../shared/dtos/pharmacy-narcotic-ledger.dto';
import { PharmacySupplier_DTO } from '../../shared/dtos/pharmacy-supplier.dto';
import { PharmacyBLService } from '../../shared/pharmacy.bl.service';
import { PharmacyService } from '../../shared/pharmacy.service';
import PHRMReportsGridColumns from '../../shared/phrm-reports-grid-columns';


@Component({
    templateUrl: "./phrm-narcotics-stock-ledger.html"
})
export class NarcoticStockLedgerComponent {
    public NarcoticDetails: Array<PHRMNarcoticLedger_DTO> = new Array<PHRMNarcoticLedger_DTO>();
    public AllGenericList: Array<PharmacyGeneric_DTO> = new Array<PharmacyGeneric_DTO>();
    public AllCompanyList: Array<PharmacyCompany_DTO> = new Array<PharmacyCompany_DTO>();
    public AllSupplierList: Array<PharmacySupplier_DTO> = new Array<PharmacySupplier_DTO>();
    public NarcoticsledgerReportGridColumns: typeof PHRMReportsGridColumns.PharmacyNarcoticStockLedgerComponentColumns;
    public FilterParameters: IGridFilterParameter[] = [];
    public NepaliDateInGridSettings: NepaliDateInGridParams = new NepaliDateInGridParams();
    public FromDate: string = "";
    public ToDate: string = "";
    public DateRange: string = "";
    public CompanyName: string = "";
    public SupplierName: string = "";
    public GenericName: string = "";
    public SelectedGeneric: PHRMNarcoticLedger_DTO = new PHRMNarcoticLedger_DTO();
    public SelectedCompany: PHRMNarcoticLedger_DTO = null;
    public SelectedSupplier: PHRMNarcoticLedger_DTO = new PHRMNarcoticLedger_DTO();
    public PrintContentObj: any = { innerHTML: '' };
    public openBrowserPrintWindow: boolean = false;
    public loading: boolean = false;
    public GenericId: number = null;
    public SupplierId: number = null;
    public CompanyId: number = null;
    constructor(public coreservice: CoreService, public pharmacyService: PharmacyService, public pharmacyBLService: PharmacyBLService, public dlService: DLService,
        public msgBoxServ: MessageboxService, private changeDetector: ChangeDetectorRef) {
        this.NarcoticsledgerReportGridColumns = PHRMReportsGridColumns.PharmacyNarcoticStockLedgerComponentColumns;
        this.GetAllGenericList();
        this.GetAllCompanyList();
        this.GetAllSupplierList();
        this.FromDate = moment().format("YYYY-MM-DD");
        this.ToDate = moment().format("YYYY-MM-DD");
        // this.NepaliDateInGridSettings.NepaliDateColumnList.push(new NepaliDateInGridColumnDetail("MfgDate", false));
        this.NepaliDateInGridSettings.NepaliDateColumnList.push(new NepaliDateInGridColumnDetail("ExpiryDate", false));
        this.NepaliDateInGridSettings.NepaliDateColumnList.push(new NepaliDateInGridColumnDetail("RecordDate", false));
        this.NepaliDateInGridSettings.NepaliDateColumnList.push(new NepaliDateInGridColumnDetail("DispensedDate", false));
    }
    gridExportOptions = {
        fileName: 'NarcoticsStockLedger' + moment().format('YYYY-MM-DD') + '.xls',
    };
    ngAfterViewChecked() {
        this.DateRange = "<b>From:</b>&nbsp;" + this.FromDate + "&nbsp;<b>To:</b>&nbsp;" + this.ToDate;
    }
    public GetAllGenericList(): void {
        this.pharmacyBLService.GetAllGenericItemsList()
            .subscribe(res => {
                if (res.Status == ENUM_DanpheHTTPResponses.OK) {
                    this.AllGenericList = res.Results;
                }
                else {
                    this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ["Failed to load ledger data."]);
                }
            }, () => {
                this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ["Failed to load ledger data."]);
            });
    }
    public GetAllSupplierList(): void {
        this.pharmacyBLService.GetAllSupplier()
            .subscribe(res => {
                if (res.Status == ENUM_DanpheHTTPResponses.OK) {
                    this.AllSupplierList = res.Results;
                }
                else {
                    this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ["Failed to load ledger data."]);
                }
            }, () => {
                this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ["Failed to load ledger data."]);
            });
    }
    public GetAllCompanyList(): void {
        this.pharmacyBLService.GetAllCompanyList()
            .subscribe(res => {
                if (res.Status == ENUM_DanpheHTTPResponses.OK) {
                    this.AllCompanyList = res.Results;
                }
                else {
                    this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ["Failed to load ledger data."]);
                }
            }, () => {
                this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ["Failed to load ledger data."]);
            });
    }



    GetAllNarcotics() {
        this.FilterParameters = [
            { DisplayName: "DateRange", Value: this.DateRange },
            { DisplayName: "Name of Drug in Generic Name", Value: this.GenericName },
            { DisplayName: "TradeName", Value: this.SupplierName },
            { DisplayName: "Name of Manufacturer", Value: this.CompanyName }
        ]
        if (this.FromDate == null || this.ToDate == null) {
            this.msgBoxServ.showMessage("Notice", ["Please Provide Valid Date."]);
            return;
        }
        if (this.CompanyId == null) {
            this.msgBoxServ.showMessage("Notice", ["Please Provide Valid Manufacturer."]);
            return;
        }
        if (this.GenericId == null) {
            this.msgBoxServ.showMessage("Notice", ["Please Provide Valid Generic Name."]);
            return;
        }
        this.pharmacyBLService.GetNarcoticsLedger(this.GenericId, this.SupplierId, this.CompanyId, this.FromDate, this.ToDate)
            .subscribe(res => {
                if (res.Status == ENUM_DanpheHTTPResponses.OK) {
                    this.NarcoticDetails = res.Results;
                }
                else {
                    this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ["Failed to load ledger data."]);
                }
            }, () => {
                this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ["Failed to load ledger data."]);
            });

    }
    OnFromToDateChange($event) {
        if ($event) {
            this.FromDate = $event.fromDate;
            this.ToDate = $event.toDate;
            this.DateRange = "<b>Date:</b>&nbsp;" + this.FromDate + "&nbsp;<b>To</b>&nbsp;" + this.ToDate;
        }
    }
    myGenericListFormatter(data: any): string {
        let html = data["GenericName"];
        return html;
    }
    mySupplierListFormatter(data: any): string {
        let html = data["SupplierName"];
        return html;
    }
    myCompanyListFormatter(data: any): string {
        let html = data["CompanyName"];
        return html;
    }
    onChangeGeneric($event) {
        try {
            if ($event.GenericId != null) {
                this.GenericId = $event.GenericId;
                this.GenericName = $event.GenericName;
            }
            else {
                this.GenericId = null;
            }
        }
        catch (exception) {
            this.ShowCatchErrMessage(exception);
        }
    }
    onChangeSupplier($event) {
        try {
            if ($event.SupplierId != null) {
                this.SupplierId = $event.SupplierId;
                this.SupplierName = $event.SupplierName;
            }
            else {
                this.SupplierId = null;
            }
        }
        catch (exception) {
            this.ShowCatchErrMessage(exception);
        }
    }
    onChangeCompany($event) {
        try {
            if ($event.CompanyId != null) {
                this.CompanyId = $event.CompanyId;
                this.CompanyName = $event.CompanyName;
            }
            else {
                this.CompanyId = null;
            }
        }
        catch (exception) {
            this.ShowCatchErrMessage(exception);
        }
    }
    ShowCatchErrMessage(exception) {
        if (exception) {
            let ex: Error = exception;
            console.log("Error Messsage =>  " + ex.message);
            console.log("Stack Details =>   " + ex.stack);
        }
    }
    public Print(idToBePrinted: string = 'narcotic-table') {
        const printHeader = `
        <div class="print-header">
            <h4 style="text-align: center;">Retailer’s Record For Narcotics and Psychotropic Medicines</h4>
             <p>Date: ${this.DateRange}</p>
        </div>
    `;
        this.PrintContentObj.innerHTML = printHeader + document.getElementById(idToBePrinted).innerHTML;
        // this.PrintContentObj.innerHTML = document.getElementById(idToBePrinted).innerHTML;
        this.openBrowserPrintWindow = false;
        this.changeDetector.detectChanges();
        this.openBrowserPrintWindow = true;
    }
    ExportToExcel() {
        const data = document.getElementById('narcotic-table');
        let workSheetName = 'Narcotic Ledger';
        let Heading = 'Retailer’s Record For Narcotics and Psychotropic Medicines';
        let filename = 'NarcoticReport';
        let tableId = document.getElementById('narcotic-table')
        CommonFunctions.ConvertHTMLTableToExcelForPharmacy(tableId, this.FromDate, this.ToDate, workSheetName,
            Heading, filename);

    }

}

