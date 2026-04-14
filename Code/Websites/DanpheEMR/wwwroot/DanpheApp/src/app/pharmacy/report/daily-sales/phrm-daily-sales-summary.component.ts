import { ChangeDetectorRef, Component } from '@angular/core';
import * as moment from 'moment/moment';
import { DispensaryService } from '../../../dispensary/shared/dispensary.service';
import { SettingsBLService } from '../../../settings-new/shared/settings.bl.service';
import { DanpheHTTPResponse } from '../../../shared/common-models';
import { CommonFunctions } from '../../../shared/common.functions';
import { DanpheCache, MasterType } from '../../../shared/danphe-cache-service-utility/cache-services';
import { NepaliDateInGridColumnDetail, NepaliDateInGridParams } from '../../../shared/danphe-grid/NepaliColGridSettingsModel';
import { IGridFilterParameter } from '../../../shared/danphe-grid/grid-filter-parameter.interface';
import { DLService } from "../../../shared/dl.service";
import { MessageboxService } from '../../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status } from '../../../shared/shared-enums';
import { PharmacyBLService } from "../../shared/pharmacy.bl.service";
import PHRMGridColumns from "../../shared/phrm-grid-columns";
@Component({
    selector: 'my-app',
    templateUrl: "./phrm-daily-sales-summary.html"
})
export class PHRMDailySalesSummaryComponent {

    DailySalesDetailsReportColumns: Array<any> = [];
    DailySalesSummaryReportColumns: Array<any> = [];

    DailySalesDetailsReportData: PHRMDailySalesDetailsReport[] = [];

    public FromDate: string = null; public ItemName: string = "";
    public ToDate: string = null;
    public ItemList: { ItemId: number, ItemName: string }[] = [];
    public SelectedItem: { ItemId: number, ItemName: string };
    public ItemId: number = null;
    public NepaliDateInGridSettings: NepaliDateInGridParams = new NepaliDateInGridParams();
    public StoreId: number = null;
    DispensaryList: { StoreId: number, Name: string }[] = [];
    SelectedDispensary: { StoreId: number, Name: string };
    CounterList: Counter_DTO[] = [];
    UserList: { EmployeeId: number, EmployeeName: string }[] = [];
    SelectedUser: { EmployeeId: number, EmployeeName: string };
    UserId: number = null;
    CounterId: number = null;
    CounterName: string = null;
    grandTotal: any = { totalSalesQty: 0, totalStockValue: 0, totalSalesValue: 0 };
    public footerContent = '';
    public dateRange: string = "";
    public pharmacy: string = "pharmacy";
    public loading: boolean = false;
    ShowDetailView: boolean = true;
    ShowSummaryView: boolean = false;
    GenericId: number = null;
    SelectedGeneric: { GenericId: number, GenericName: string };
    GenericList: { GenericId: number, GenericName: string }[] = [];
    GenericName: string = null;
    EmployeeName: string = null;
    StoreName: string = null;
    SelectedCounter: Counter_DTO = null;
    ItemWiseSalesSummaryReportData: PHRMItemWiseSalesSummaryReport[] = [];
    TotalSalesValue: number = 0;
    footerContentSummary: string = '';
    FilterParametersForDetailView: IGridFilterParameter[] = [];
    FilterParametersForSummaryView: IGridFilterParameter[] = [];
    SalesType: string = null;

    constructor(public pharmacyBLService: PharmacyBLService, public dlService: DLService, public _dispensaryService: DispensaryService, public messageBoxService: MessageboxService, public settingBLService: SettingsBLService, public changeDetector: ChangeDetectorRef) {
        this.FromDate = moment().format("YYYY-MM-DD");
        this.ToDate = moment().format("YYYY-MM-DD");
        this.DailySalesDetailsReportColumns = PHRMGridColumns.PHRMSalesItemList;
        this.DailySalesSummaryReportColumns = PHRMGridColumns.PHRMItemWiseSalesSummaryReportColumns;
        this.GetOnlyItemNameList();
        this.NepaliDateInGridSettings.NepaliDateColumnList.push(new NepaliDateInGridColumnDetail("CreatedOn", false));
        this.LoadCounter();
        this.LoadUser();
        this.GetGenericList();
        this.GetActiveDispensaryList();
    }
    gridExportOptions = {
        fileName: 'ItemWiseSalesReport_' + moment().format('YYYY-MM-DD') + '.xls',
    };
    GetActiveDispensaryList(): void {
        this._dispensaryService.GetAllDispensaryList()
            .subscribe((res: DanpheHTTPResponse) => {
                if (res.Status === ENUM_DanpheHTTPResponses.OK) {
                    this.DispensaryList = JSON.parse(JSON.stringify(res.Results));
                    this.DispensaryList.unshift({ StoreId: null, Name: 'All' });
                }
                else {
                    console.log(res.ErrorMessage);
                }
            },
                err => {
                    console.log(err.ErrorMessage);
                });
    }
    DispensaryListFormatter(data: any): string {
        return data["Name"];
    }
    OnDispensaryChange(): void {
        if (this.SelectedDispensary && this.SelectedDispensary.StoreId) {
            this.StoreId = this.SelectedDispensary.StoreId;
            this.StoreName = this.SelectedDispensary.Name;
        }
        else {
            this.StoreId = null;
            this.StoreName = null;
        }
    }
    LoadCounter(): void {
        this.CounterList = DanpheCache.GetData(MasterType.PhrmCounter, null);
    }

    LoadUser(): void {
        this.settingBLService.GetUserList()
            .subscribe((res: DanpheHTTPResponse) => {
                if (res.Status === ENUM_DanpheHTTPResponses.OK) {
                    this.UserList = res.Results;
                    CommonFunctions.SortArrayOfObjects(this.UserList, "EmployeeName");
                }
                else {
                    console.log(res.ErrorMessage);
                }
            },
                err => {
                    console.log(err.ErrorMessage);
                });
    }
    UserListFormatter(data: any): string {
        return data["EmployeeName"];
    }

    CounterListFormatter(data: any): string {
        return data["CounterName"];
    }
    OnUserChange(): void {
        if (this.SelectedUser && this.SelectedUser.EmployeeId) {
            this.UserId = this.SelectedUser.EmployeeId;
            this.EmployeeName = this.SelectedUser.EmployeeName;
        }
        else {
            this.UserId = null;
            this.EmployeeName = null;
        }
    }

    OnCounterChange() {
        if (this.SelectedCounter && this.SelectedCounter.CounterId) {
            this.CounterId = this.SelectedCounter.CounterId;
            this.CounterName = this.SelectedCounter.CounterName;
        }
        else {
            this.CounterId = null;
            this.CounterName = null;
        }
    }

    public GetOnlyItemNameList(): void {
        this.pharmacyBLService.getOnlyItemNameList()
            .subscribe((res: DanpheHTTPResponse) => {
                if (res.Status === ENUM_DanpheHTTPResponses.OK) {
                    this.ItemList = [];
                    this.ItemList = res.Results;
                }
                else {
                    console.log(res.ErrorMessage);
                }
            },
                err => {
                    console.log(err.ErrorMessage);

                });
    }
    onChangeItem(): void {
        if (this.SelectedItem && this.SelectedItem.ItemId) {
            this.ItemId = this.SelectedItem.ItemId;
            this.ItemName = this.SelectedItem.ItemName;
        }
        else {
            this.ItemId = null;
            this.ItemName = null;
        }
    }

    myItemListFormatter(data: any): string {
        let html = data["ItemName"];//+ " |B.No.|" + data["BatchNo"] + " |M.R.P|" + data["SalePrice"];
        return html;
    }

    GetReportData(): void {
        if (!this.FromDate && !this.ToDate) {
            this.messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, ['Please select valid date']);
            return;
        }

        this.loading = true;
        this.ShowDetailView = true;
        this.ShowSummaryView = false;
        this.FilterParametersForDetailView = [
            { DisplayName: 'Date Range:', Value: this.dateRange },
            { DisplayName: 'ItemName:', Value: this.ItemName === null ? 'All' : this.ItemName },
            { DisplayName: 'GenericName:', Value: this.GenericName === null ? 'All' : this.GenericName },
            { DisplayName: 'Store Name:', Value: this.StoreName === null ? 'All' : this.StoreName },
            { DisplayName: 'Counter Name:', Value: this.CounterName === null ? 'All' : this.CounterName },
            { DisplayName: 'User:', Value: this.EmployeeName === null ? 'All' : this.EmployeeName },
            { DisplayName: 'Sales Type:', Value: this.SalesType === null ? 'All' : this.SalesType },
        ]
        this.pharmacyBLService.GetDailySalesSummaryReport(this.FromDate, this.ToDate, this.ItemId, this.StoreId, this.CounterId, this.UserId, this.GenericId, this.SalesType)
            .finally(() => {
                this.loading = false;
                this.ResetFields();
            })
            .subscribe((res: DanpheHTTPResponse) => {
                if (res.Status === ENUM_DanpheHTTPResponses.OK) {
                    this.DailySalesDetailsReportData = [];
                    this.DailySalesDetailsReportData = res.Results;
                    if (this.DailySalesDetailsReportData && this.DailySalesDetailsReportData.length) {
                        this.grandTotal.totalSalesQty = this.DailySalesDetailsReportData.reduce((a, b) => a + b.Quantity, 0);
                        this.grandTotal.totalSalesValue = this.DailySalesDetailsReportData.reduce((a, b) => a + b.TotalAmount, 0);
                        this.grandTotal.totalStockValue = this.DailySalesDetailsReportData.reduce((a, b) => a + b.StockValue, 0);
                    }
                    else {
                        this.grandTotal = { totalSalesQty: 0, totalStockValue: 0, totalSalesValue: 0 };
                    }
                    this.changeDetector.detectChanges();
                    this.footerContent = document.getElementById("item_wise_sales_report_print_summary").innerHTML;
                } else {
                    this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, [res.ErrorMessage])
                }

            });
    }

    private ResetFields() {
        this.GenericId = null;
        this.GenericName = null;
        this.SelectedGeneric = null;
        this.ItemId = null;
        this.ItemName = null;
        this.SelectedItem = null;
        this.StoreId = null;
        this.StoreName = null;
        this.SelectedDispensary = null;
        this.CounterId = null;
        this.CounterName = null;
        this.SelectedCounter = null;
        this.UserId = null;
        this.EmployeeName = null;
        this.SelectedUser = null;
    }

    OnFromToDateChange($event) {
        this.FromDate = $event ? $event.fromDate : this.FromDate;
        this.ToDate = $event ? $event.toDate : this.ToDate;
        this.dateRange = "<b>Date:</b>&nbsp;" + this.FromDate + "&nbsp;<b>To</b>&nbsp;" + this.ToDate;
    }

    GenericListFormatter(data): string {
        let html = data["GenericName"];
        return html;
    }

    GetGenericList(): void {
        this.pharmacyBLService.GetGenericListWithoutPriceCategory()
            .subscribe(res => {
                if (res.Status === ENUM_DanpheHTTPResponses.OK) {
                    this.GenericList = res.Results;
                }
                else {
                    console.log(res.ErrorMessage);
                }
            },
                err => {
                    console.log(err.ErrorMessage);
                });
    }

    OnChangeGeneric(): void {
        if (this.SelectedGeneric && this.SelectedGeneric.GenericId) {
            this.GenericId = this.SelectedGeneric.GenericId;
            this.GenericName = this.SelectedGeneric.GenericName;
        }
        else {
            this.GenericId = null;
            this.GenericName = null;
        }
    }

    GetSummaryDetails(): void {
        this.ShowSummaryView = true;
        this.ShowDetailView = false;
        this.loading = true;
        this.FilterParametersForSummaryView = [
            { DisplayName: 'Date Range:', Value: this.dateRange },
            { DisplayName: 'ItemName:', Value: this.ItemName === null ? 'All' : this.ItemName },
            { DisplayName: 'GenericName:', Value: this.GenericName === null ? 'All' : this.GenericName },
            { DisplayName: 'Store Name:', Value: this.StoreName === null ? 'All' : this.StoreName },
            { DisplayName: 'Counter Name:', Value: this.CounterName === null ? 'All' : this.CounterName },
            { DisplayName: 'User:', Value: this.EmployeeName === null ? 'All' : this.EmployeeName },
        ]

        this.pharmacyBLService.GetItemWiseSalesSummaryReport(this.FromDate, this.ToDate, this.ItemId, this.StoreId, this.CounterId, this.UserId, this.GenericId)
            .finally(() => {
                this.loading = false;
                this.ResetFields();
            })
            .subscribe((res: DanpheHTTPResponse) => {
                if (res.Status === ENUM_DanpheHTTPResponses.OK) {
                    this.ItemWiseSalesSummaryReportData = res.Results;
                    this.TotalSalesValue = 0;
                    if (this.ItemWiseSalesSummaryReportData && this.ItemWiseSalesSummaryReportData.length > 0) {
                        this.TotalSalesValue = this.ItemWiseSalesSummaryReportData.reduce((a, b) => a + b.SalesValue, 0);
                    }
                    this.footerContentSummary = document.getElementById("phrm_item_wise_sales_summary_report_print_summary").innerHTML;

                }
                else {
                    this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ['Failed to retrieve data']);
                    console.log(res.ErrorMessage);
                }
            },
                err => {
                    this.messageBoxService.showMessage(ENUM_MessageBox_Status.Error, ['Failed to retrieve data']);
                    console.log(err.ErrorMessage);
                })
    }
    salesTypes = [
        { value: null, label: 'All' },
        { value: 'Sales', label: 'Sales' },
        { value: 'SalesReturn', label: 'Sales Return' }]
}

class PHRMDailySalesDetailsReport {
    InvoicePrintId: string = '';
    GenericName: string = '';
    ItemName: string = '';
    PatientName: string = '';
    BatchNo: string = '';
    ExpiryDate: string = '';
    Quantity: number = 0;
    Unit: string = '';
    Price: number = 0;
    SalePrice: number = 0;
    StockValue: number = 0;
    TotalAmount: number = 0;
    CreatedOn: string = '';
    StoreName: string = '';
    CounterName: string = '';
    CreatedByName: string = '';
    TransactionType: string = '';
    Remark: string = '';
    PurchaseRate: number = 0;
    DiscountAmount: number = 0;
    MRP: number = 0;
    CostPrice: number = 0;
}

class Counter_DTO {
    CounterId: number = null;
    CounterName: string = null;
}

class PHRMItemWiseSalesSummaryReport {
    GenericName: string = null;
    ItemName: string = null;
    BatchNo: string = null;
    ExpiryDate: string = null;
    Unit: string = null
    SalesQty: number = 0;
    SalePrice: number = 0;
    SubTotal: number = 0;
    DiscountAmount: number = 0;
    TotalAmount: number = 0;
    ReturnQty: number = 0;
    ReturnSubTotal: number = 0;
    ReturnDiscountAmount: number = 0;
    ReturnTotalAmount: number = 0;
    SalesValue: number = 0;

}






