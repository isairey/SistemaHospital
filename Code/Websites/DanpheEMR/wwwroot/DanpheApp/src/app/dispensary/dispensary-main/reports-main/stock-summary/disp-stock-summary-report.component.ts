import { ChangeDetectorRef, Component } from "@angular/core";
import * as moment from "moment";
import { PHRMStockSummaryReportModel } from "../../../../pharmacy/shared/Phrm-Stock-summary-report-model";
import { PharmacyBLService } from "../../../../pharmacy/shared/pharmacy.bl.service";
import { PHRMReportsModel } from "../../../../pharmacy/shared/phrm-reports-model";
import { DanpheHTTPResponse } from "../../../../shared/common-models";
import { GridEmitModel } from "../../../../shared/danphe-grid/grid-emit.model";
import { DLService } from "../../../../shared/dl.service";
import { MessageboxService } from "../../../../shared/messagebox/messagebox.service";
import { ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status } from "../../../../shared/shared-enums";
import { DispensaryService } from "../../../shared/dispensary.service";


@Component({
    selector: 'disp-stock-summary-report',
    templateUrl: "./disp-stock-summary-report.component.html"
})
export class DISPStockSummaryReportComponent {

    StockSummaryReportColumns: Array<any> = null;
    StockSummaryReportData: Array<PHRMStockSummaryReportModel> = new Array<PHRMStockSummaryReportModel>();
    GrandTotalReportData: PHRMStockSummaryReportModel = new PHRMStockSummaryReportModel();
    dynamicQtyColumList: Array<DynamicColumnModel> = new Array<DynamicColumnModel>();
    showDataGrid: boolean = false;
    showItemTxnDetail: boolean = false;
    SelectedItemId: number = null;
    SelectedItemName: string = '';
    footerContent = '';
    dateRange: string = "";
    StoreList: { StoreId: number, Name: string }[] = [];
    StockSummaryReportList: Array<PHRMStockSummaryReportModel> = new Array<PHRMStockSummaryReportModel>();
    SelectedStore: { StoreId: number, Name: string };
    pharmacy: string = "pharmacy";
    loading: boolean = false;
    preselectedColList: any[] = [];
    GenericList: { GenericId: number, GenericName: string }[] = [];
    SelectedGeneric: { GenericId: number, GenericName: string };
    GenericId: number = null;
    GenericName: string = null;
    FromDate: string = null;
    ToDate: string = null;
    FiscalYearId: number = null;
    StoreId: number = null;
    ItemList: { ItemId: number, ItemName: string }[] = [];
    SelectedItem: { ItemId: number, ItemName: string }

    constructor(public pharmacyBLService: PharmacyBLService, public dlService: DLService, public messageBoxService: MessageboxService, public dispensaryService: DispensaryService, public changeDetector: ChangeDetectorRef,
    ) {
        let previouslySavedProvisionalSettingsJSON = localStorage.getItem("PHRM_StockSummary_IncludeProvisional");
        if (previouslySavedProvisionalSettingsJSON) {
            let previouslySavedProvisionalSettings: 0 | 1 = JSON.parse(previouslySavedProvisionalSettingsJSON);
            this.includeProvisionalSalesInReport = previouslySavedProvisionalSettings;
        }

        this.AssignGridColDefaults();
        this.GetItemList();
        this.GetGenericList();
        this.CreateDynamicColumnList()
        this.showDataGrid = true;
        let activatedDispensary = this.dispensaryService.activeDispensary
        if (activatedDispensary) {
            this.StoreId = activatedDispensary.StoreId;
        }
    }
    ngAfterViewChecked() {
        if (document.getElementById("print_dis_stock_summary")) {
            this.footerContent = document.getElementById("print_dis_stock_summary").innerHTML;
        }
    }
    GetItemList() {
        this.pharmacyBLService.GetItemList()
            .subscribe((res: DanpheHTTPResponse) => {
                if (res.Status === ENUM_DanpheHTTPResponses.OK) {
                    this.ItemList = res.Results;
                }
                else {
                    this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ["Failed to load item data."]);
                }
            }, () => {
                this.messageBoxService.showMessage(ENUM_MessageBox_Status.Error, ["Failed to load item data."]);
            });
    }
    public CreateDynamicColumnList(includeProvisional = true, overwriteSavedCols: boolean = false) {
        if (includeProvisional == true) {
            this.dynamicQtyColumList.push({ headerName: "Opening Qty", field: "OpeningQty_WithProvisional", width: 150 });
            this.dynamicQtyColumList.push({ headerName: "Opening Value", field: "OpeningValue_WithProvisional", width: 150 });
        }
        else {
            this.dynamicQtyColumList.push({ headerName: "Opening Qty", field: "OpeningQty", width: 150 });
            this.dynamicQtyColumList.push({ headerName: "Opening Value", field: "OpeningValue", width: 150 });
        }

        if (includeProvisional == true) {
            this.dynamicQtyColumList.push({ headerName: "Provisional Qty", field: "ProvisionalQty", width: 150 });
            this.dynamicQtyColumList.push({ headerName: "Provisional Value", field: "ProvisionalValue", width: 150 });
        }

        if (includeProvisional == true) {
            this.dynamicQtyColumList.push({ headerName: "Closing Value", field: "ClosingValue_WithProvisional", width: 150 });
            this.dynamicQtyColumList.push({ headerName: "Closing Qty", field: "ClosingQty_WithProvisional", width: 150 });
        }
        else {
            this.dynamicQtyColumList.push({ headerName: "Closing Value", field: "ClosingValue", width: 150 });
            this.dynamicQtyColumList.push({ headerName: "Closing Qty", field: "ClosingQty", width: 150 });
        }

        this.dynamicQtyColumList.push({ headerName: "Purchase Qty", field: "PurchaseQty", width: 150 });
        this.dynamicQtyColumList.push({ headerName: "Purchase Value", field: "PurchaseValue", width: 150 });
        this.dynamicQtyColumList.push({ headerName: "Purchase Return Qty", field: "PurchaseReturnQty", width: 150 });
        this.dynamicQtyColumList.push({ headerName: "Purchase Return Value", field: "PurchaseReturnValue", width: 200 });
        this.dynamicQtyColumList.push({ headerName: "Sales Qty", field: "SalesQty", width: 150 });
        this.dynamicQtyColumList.push({ headerName: "Sales Value", field: "SalesValue", width: 150 });
        this.dynamicQtyColumList.push({ headerName: "SaleReturn Qty", field: "SaleReturnQty", width: 150 });
        this.dynamicQtyColumList.push({ headerName: "SaleReturn Value", field: "SaleReturnValue", width: 150 });
        this.dynamicQtyColumList.push({ headerName: "Consumption Qty", field: "ConsumptionQty", width: 150 });
        this.dynamicQtyColumList.push({ headerName: "Consumption Value", field: "ConsumptionValue", width: 150 });
        this.dynamicQtyColumList.push({ headerName: "Write-off Qty", field: "WriteOffQty", width: 150 });
        this.dynamicQtyColumList.push({ headerName: "Write-off Value", field: "WriteOffValue", width: 150 });
        this.dynamicQtyColumList.push({ headerName: "StockManageIn Qty", field: "StockManageInQty", width: 150 });
        this.dynamicQtyColumList.push({ headerName: "StockManageIn Value", field: "StockManageInValue", width: 150 });
        this.dynamicQtyColumList.push({ headerName: "StockManageOut Qty", field: "StockManageOutQty", width: 150 });
        this.dynamicQtyColumList.push({ headerName: "StockManageOut Value", field: "StockManageOutValue", width: 150 });
        this.dynamicQtyColumList.push({ headerName: "TransferIn Value", field: "TransferInValue", width: 150 });
        this.dynamicQtyColumList.push({ headerName: "TransferIn Qty", field: "TransferInQty", width: 150 });
        this.dynamicQtyColumList.push({ headerName: "TransferOut Value", field: "TransferOutValue", width: 150 });
        this.dynamicQtyColumList.push({ headerName: "TransferOut Qty", field: "TransferOutQty", width: 150 });




        // * preselected column list
        // * get the columns saved in the local storage
        const previouslySavedColsJSON = localStorage.getItem("PHRM_StockSummary_SelectedColumns");
        if (previouslySavedColsJSON && !overwriteSavedCols) {
            const previouslySavedCols: any[] = JSON.parse(previouslySavedColsJSON);
            this.preselectedColList.push(...previouslySavedCols);
        }
        else {

            if (includeProvisional == true) {
                this.preselectedColList.push({ headerName: "Opening Value", field: "OpeningValue_WithProvisional", width: 150 });
            } else {
                this.preselectedColList.push({ headerName: "Opening Value", field: "OpeningValue", width: 150 });

            }
            this.preselectedColList.push({ headerName: "Purchase Value", field: "PurchaseValue", width: 150 });
            this.preselectedColList.push({ headerName: "Purchase Return Value", field: "PurchaseReturnValue", width: 200 });
            this.preselectedColList.push({ headerName: "Sales Value", field: "SalesValue", width: 150 });
            if (includeProvisional == true) {
                this.preselectedColList.push({ headerName: "Provisional Value", field: "ProvisionalValue", width: 150 });
            }
            this.preselectedColList.push({ headerName: "SaleReturn Value", field: "SaleReturnValue", width: 150 });
            this.preselectedColList.push({ headerName: "Write-off Value", field: "WriteOffValue", width: 150 });
            this.preselectedColList.push({ headerName: "Consumption Value", field: "ConsumptionValue", width: 150 });
            if (includeProvisional == true) {
                this.preselectedColList.push({ headerName: "Closing Value", field: "ClosingValue_WithProvisional", width: 150 });
            }
            else {
                this.preselectedColList.push({ headerName: "Closing Value", field: "ClosingValue", width: 150 });
            }
        }
    }
    onChangeColumnSelection($event) {
        this.showDataGrid = false;
        // * remove all qty columns
        this.dynamicQtyColumList.forEach(element => {
            let startIndex = this.StockSummaryReportColumns.findIndex(s => s.field == element.field);
            if (startIndex != -1) {
                this.StockSummaryReportColumns.splice(startIndex, 1);
            }
        });
        // * add only selected
        if ($event.length > 0) {
            let selectedColumns = new Array<DynamicColumnModel>()
            selectedColumns = $event;
            selectedColumns.forEach(col => {
                this.StockSummaryReportColumns.push(col);
            });
        }
        this.changeDetector.detectChanges();
        this.showDataGrid = true;

        // * save the columns to local storage
        localStorage.setItem("PHRM_StockSummary_SelectedColumns", JSON.stringify($event));
        localStorage.setItem("PHRM_StockSummary_IncludeProvisional", this.includeProvisionalSalesInReport.toString());

    }
    gridExportOptions = {
        fileName: 'StockSummaryReport_' + moment().format('YYYY-MM-DD') + '.xls',
    };
    OnClickShowReport() {
        this.GetReportData();
    }
    GetReportData() {
        if (this.FromDate == null || this.ToDate == null) {
            this.messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, ['Please Provide Valid Date.']);
            return;
        }
        else {
            this.loading = true;
            this.StockSummaryReportList = [];
            this.StockSummaryReportData = [];
            this.GrandTotalReportData = new PHRMStockSummaryReportModel();
            let phrmReports: PHRMReportsModel = new PHRMReportsModel();
            phrmReports.FromDate = this.FromDate;
            phrmReports.ToDate = this.ToDate;
            phrmReports.FiscalYearId = this.FiscalYearId;
            phrmReports.StoreId = this.StoreId;
            phrmReports.ItemId = this.SelectedItemId;
            phrmReports.GenericId = this.GenericId;
            this.pharmacyBLService.GetStockSummaryReport(phrmReports).finally(() => {
                this.loading = false;
                this.ClearInputFields();
            }).subscribe((res: DanpheHTTPResponse) => {
                if (res.Status === ENUM_DanpheHTTPResponses.OK) {
                    this.StockSummaryReportList = []
                    this.StockSummaryReportData = [];
                    this.GrandTotalReportData = new PHRMStockSummaryReportModel();
                    this.StockSummaryReportList = res.Results.StkSummary;
                    this.StockSummaryReportData = res.Results.StkSummary;
                    this.GrandTotalReportData = res.Results.GrandTotal;
                }
                else {
                    this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ['Failed to retrieve information']);
                }
            },
                err => {
                    this.messageBoxService.showMessage(ENUM_MessageBox_Status.Error, ['Failed to retrieve information' + err.ErrorMessage]);
                });
        }

    }
    private ClearInputFields() {
        this.GenericId = null;
        this.SelectedItemId = null;
        this.SelectedItem = null;
        this.SelectedGeneric = null;
        this.SelectedStore = null;
        this.StoreId = null;
    }

    StockSummaryGridAction($event: GridEmitModel) {
        switch ($event.Action) {
            case "itemTxnDetail": {
                this.SelectedItemId = $event.Data.ItemId;
                this.SelectedItemName = $event.Data.ItemName;
                this.showItemTxnDetail = true;
                break;
            }
            default:
                break;
        }
    }
    OnChangeItem() {
        if (this.SelectedItem && this.SelectedItem.ItemId > 0) {
            this.SelectedItemId = this.SelectedItem.ItemId;
            this.SelectedItemName = this.SelectedItem.ItemName;
        }
        else {
            this.SelectedItemId = null;
            this.SelectedItemName = null;
        }
    }

    onChangeStore() {
        if (this.SelectedStore) {
            this.StoreId = this.SelectedStore.StoreId;
        }
        else {
            this.StoreId = null;
        }
    }
    HideItemTxnSummary() {
        this.SelectedItemId = null;
        this.SelectedItemName = null;
        this.showItemTxnDetail = false;
    }

    ErrorMsg(err) {
        this.messageBoxService.showMessage(ENUM_MessageBox_Status.Error, ["Sorry!!! Not able export the excel file." + err.ErrorMessage]);
        console.log(err.ErrorMessage);
    }
    validDate: boolean = true;
    OnDateChange(event) {
        if (event) {
            this.FromDate = event.fromDate;
            this.ToDate = event.toDate;
            this.FiscalYearId = event.fiscalYearId;
            this.dateRange = "<b>Date:</b>&nbsp;" + this.FromDate + "&nbsp;<b>To</b>&nbsp;" + this.ToDate;
            this.validDate = true;
        }
        else {
            this.FromDate = null;
            this.ToDate = null;
            this.validDate = false;
        }
    }
    ItemListFormatter(data: any): string {
        return data["ItemName"];
    }

    StoreListFormatter(data: any): string {
        return data["Name"];
    }
    private AssignGridColDefaults(includeProvisional = true, overwriteSavedCols: boolean = false) {

        this.StockSummaryReportColumns = [
            { headerName: "Store", field: "StoreName", width: 200 },
            { headerName: "Generic Name", field: "GenericName", width: 200 },
            { headerName: "Item Name", field: "ItemName", width: 200, cellRenderer: this.GetItemAction },
            { headerName: "Unit", field: "UOMName", width: 150 },
            { headerName: "Batch", field: "BatchNo", width: 150 },
            { headerName: "Expiry", field: "ExpiryDate", width: 200, cellRenderer: this.DateOfExpiry },
            { headerName: "CP", field: "CostPrice", width: 150 },
            { headerName: "SP", field: "SalePrice", width: 150 },
        ]

        // *get the columns saved in the local storage
        let previouslySavedColsJSON = localStorage.getItem("PHRM_StockSummary_SelectedColumns");
        if (previouslySavedColsJSON && !overwriteSavedCols) {
            let previouslySavedCols = JSON.parse(previouslySavedColsJSON);
            const data = this.ArrayUnique(this.StockSummaryReportColumns, previouslySavedCols);
            this.StockSummaryReportColumns = data;
        }
        else {
            if (includeProvisional) {
                this.StockSummaryReportColumns.push({ headerName: "Opening Value", field: "OpeningValue_WithProvisional", width: 150 });
            }
            else {
                this.StockSummaryReportColumns.push({ headerName: "Opening Value", field: "OpeningValue", width: 150 });
            }
            this.StockSummaryReportColumns.push(...
                [
                    { headerName: "Purchase Value", field: "PurchaseValue", width: 150 },
                    { headerName: "Purchase Return Value", field: "PurchaseReturnValue", width: 200 },
                    { headerName: "Sales Value", field: "SalesValue", width: 150 }
                ]);
            if (includeProvisional == true)
                this.StockSummaryReportColumns.push({ headerName: "Provisonal Value", field: "ProvisionalValue", width: 150 });
            this.StockSummaryReportColumns.push(...[
                { headerName: "SaleReturn Value", field: "SaleReturnValue", width: 150 },
                { headerName: "Write-off Value", field: "WriteOffValue", width: 150 },
                { headerName: "Consumption Value", field: "ConsumptionValue", width: 150 }]);
            if (includeProvisional == true) {
                this.StockSummaryReportColumns.push({ headerName: "Closing Value", field: "ClosingValue_WithProvisional", width: 150 });
            }
            else {
                this.StockSummaryReportColumns.push({ headerName: "Closing Value", field: "ClosingValue", width: 150 });
            }
        }
    }
    GetItemAction(params) {
        return `<a danphe-grid-action="itemTxnDetail">
                   ${params.data.ItemName}
                 </a>`;
    }
    DateOfExpiry(params) {
        let expiryDate: Date = params.data.ExpiryDate;
        let expiryDate1 = new Date(params.data.ExpiryDate)
        let date = new Date();
        let dateNow = date.setMonth(date.getMonth() + 0);
        let dateThreeMonth = date.setMonth(date.getMonth() + 3);
        let expDate = expiryDate1.setMonth(expiryDate1.getMonth() + 0);

        if (expDate <= dateNow) {
            return "<span style='background-color:red;color:white'>" + moment(expiryDate).format('YYYY-MM-DD') + "(" + "Exp" + ")";
        }
        if (expDate < dateThreeMonth && expDate > dateNow) {

            return "<span style='background-color:yellow;color:black'>" + moment(expiryDate).format('YYYY-MM-DD') + "(" + "N. Exp" + ")";
        }
        if (expDate > dateThreeMonth) {

            return "<span style='background-color:white;color:black'>" + moment(expiryDate).format('YYYY-MM-DD') + "</span>";
        }


    }
    /**
     * Boolean value that decides to include provisional sales qty and value in grid and summary. 
     * By default, provisional sale is included
     * @description created by Sanjit
     */
    includeProvisionalSalesInReport: 0 | 1 = 1;
    onIncludeProvisionalSettingsChanged() {
        if (this.includeProvisionalSalesInReport) {
            this.AssignGridColDefaults(true, true);
            this.CreateDynamicColumnList(true, true);
        }
        else {
            this.AssignGridColDefaults(false, true);
            this.CreateDynamicColumnList(false, true);
        }

        localStorage.setItem("PHRM_StockSummary_SelectedColumns", JSON.stringify(this.StockSummaryReportColumns));
        localStorage.setItem("PHRM_StockSummary_IncludeProvisional", this.includeProvisionalSalesInReport.toString());
    }
    // * Rohit:  This function helps to get array with unique values
    ArrayUnique(originalArray, manipulatedArray): [] {
        for (let i = 0; i < manipulatedArray.length; i++) {
            if (!originalArray.find(a => a.headerName === manipulatedArray[i].headerName)) {
                originalArray.push(manipulatedArray[i]);
            }
        }
        return originalArray;
    }


    public GetGenericList() {
        this.pharmacyBLService.GetGenericListWithoutPriceCategory()
            .subscribe((res: DanpheHTTPResponse) => {
                if (res.Status === ENUM_DanpheHTTPResponses.OK) {
                    this.GenericList = res.Results;
                } else {
                    console.log('Failed to get generic list');
                }
            });
    }

    GenericListFormatter(data): string {
        let html = data["GenericName"];
        return html;
    }

    OnGenericSelect() {
        if (this.SelectedGeneric) {
            this.GenericId = this.SelectedGeneric.GenericId;
            this.GenericName = this.SelectedGeneric.GenericName;
        }
        else {
            this.GenericId = null;
            this.GenericName = null;
        }
    }
}

class DynamicColumnModel {
    public headerName: string = "";
    public field: string = "";
    public width: number = 70; //default width set to 70    
}
