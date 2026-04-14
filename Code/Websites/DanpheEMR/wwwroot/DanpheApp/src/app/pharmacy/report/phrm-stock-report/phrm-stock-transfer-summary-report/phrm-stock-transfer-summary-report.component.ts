import * as moment from "moment";
import { PharmacyBLService } from "../../../shared/pharmacy.bl.service";
import { DanpheHTTPResponse } from "../../../../shared/common-models";
import { ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status } from "../../../../shared/shared-enums";
import { MessageboxService } from "../../../../shared/messagebox/messagebox.service";
import { PHRMStoreModel } from "../../../shared/phrm-store.model";
import { PHRMGenericModel } from "../../../shared/phrm-generic.model";
import PHRMReportsGridColumns from "../../../shared/phrm-reports-grid-columns";
import { Component } from "@angular/core";
import { IGridFilterParameter } from "../../../../shared/danphe-grid/grid-filter-parameter.interface";

@Component({
    selector: 'phrm-stock-transfer-summary',
    templateUrl: './phrm-stock-transfer-summary-report.component.html',
})
export class PHRMStockTransferSummaryReportComponent {
    FromDate: string = moment().format('YYYY-MM-DD');
    ToDate: string = moment().format('YYYY-MM-DD');
    SourceStoreList: { StoreId: null, Name: '' }[] = [];
    TargetStoreList: { StoreId: null, Name: '' }[] = [];
    DateRange: string = '';
    GenericList: { GenericId: null, GenericName: '' }[] = []
    SelectedGeneric: { GenericId: 0, GenericName: '' } = null;
    SelectedSourceStore: { StoreId: null, Name: '' } = null;
    SelectedTargetStore: { StoreId: null, Name: '' } = null;
    SourceStoreId: number = null;
    TargetStoreId: number = null;
    GenericId: number = null;
    PHRMStockTransferredSummaryData: PHRMStockTransferReportVM[] = [];
    PHRMStockTransferSummaryReportColumns: { headerName: string; field: string; width: number; }[];
    loading: boolean = false;
    SourceStoreName: string = null;
    TargetStoreName: string;
    GenericName: string;
    FilterParameters: IGridFilterParameter[] = [];


    constructor(public pharmacyBLService: PharmacyBLService, public messageBoxService: MessageboxService) {
        this.PHRMStockTransferSummaryReportColumns = PHRMReportsGridColumns.PHRMStockTransferSummaryReportColumns;
        this.GetActiveStore();
        this.GetGenericList();
    }

    OnFromToDateChange($event) {
        this.FromDate = $event ? $event.fromDate : this.FromDate;
        this.ToDate = $event ? $event.toDate : this.ToDate;
        this.DateRange = "<b>Date:</b>&nbsp;" + this.FromDate + "&nbsp;<b>To</b>&nbsp;" + this.ToDate;
    }

    GetActiveStore() {
        this.pharmacyBLService.GetActiveStore()
            .subscribe((res: DanpheHTTPResponse) => {
                if (res.Status === ENUM_DanpheHTTPResponses.OK) {
                    this.SourceStoreList = res.Results;
                    this.TargetStoreList = res.Results;
                }
                else {
                    this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ["Failed to load stores."]);
                }
            }, err => {
                this.messageBoxService.showMessage(ENUM_MessageBox_Status.Error, ["Failed to load stores." + err]);
            });
    }

    public GetGenericList() {
        this.pharmacyBLService.GetGenericList()
            .subscribe((res: DanpheHTTPResponse) => {
                if (res.Status === ENUM_DanpheHTTPResponses.OK) {
                    this.GenericList = res.Results;
                } else {
                    this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ["Failed to load Generics."]);
                }
            }, err => {
                this.messageBoxService.showMessage(ENUM_MessageBox_Status.Error, ["Failed to load Generics." + err]);
            });
    }

    GenericListFormatter(data): string {
        let html = data["GenericName"];
        return html;
    }

    OnChangeGeneric() {
        if (this.SelectedGeneric && this.SelectedGeneric.GenericId) {
            this.GenericId = this.SelectedGeneric.GenericId;
            this.GenericName = this.SelectedGeneric.GenericName;
        }
        else {
            this.GenericId = null;
            this.GenericName = null;
        }
    }

    OnSourceStoreChange() {
        if (this.SelectedSourceStore) {
            this.SourceStoreId = this.SelectedSourceStore.StoreId;
            this.SourceStoreName = this.SelectedSourceStore.Name;
        }
        else {
            this.SourceStoreId = null;
            this.SourceStoreName = null;
        }
    }

    OnTargetStoreChange() {
        if (this.SelectedTargetStore) {
            this.TargetStoreId = this.SelectedTargetStore.StoreId;
            this.TargetStoreName = this.SelectedTargetStore.Name;
        }
        else {
            this.TargetStoreId = null;
            this.TargetStoreName = null;
        }
    }

    LoadReport() {
        if (!this.FromDate || !this.ToDate) {
            this.messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, ['Enter Valid Date']);
            return;
        }
        this.FilterParameters = [
            { DisplayName: 'Date Range:', Value: this.DateRange },
            { DisplayName: 'Generic Name:', Value: this.GenericName },
            { DisplayName: 'Source Store:', Value: this.SourceStoreName },
            { DisplayName: 'Target Store:', Value: this.TargetStoreName },
        ]
        this.loading = true;
        this.PHRMStockTransferredSummaryData = [];
        this.pharmacyBLService.GetStockTransferSummaryReport(this.FromDate, this.ToDate, this.GenericId, this.SourceStoreId, this.TargetStoreId)
            .finally(() => {
                this.loading = false;
                this.ResetInputsValues();
            })
            .subscribe((res: DanpheHTTPResponse) => {
                if (res.Status === ENUM_DanpheHTTPResponses.OK) {
                    this.PHRMStockTransferredSummaryData = res.Results;
                }
                else {
                    this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ["Failed to get Stock Transfer Summary Report."]);
                }
            },
                err => {
                    this.messageBoxService.showMessage(ENUM_MessageBox_Status.Error, ["Failed to get Stock Transfer Summary Report." + err]);
                })
    }

    gridExportOptions = {
        fileName: 'PharmacyStockTransferSummaryReport_' + moment().format('YYYY-MM-DD') + '.xls',
    };


    private ResetInputsValues() {
        this.SelectedGeneric = null;
        this.GenericId = null;
    }
}

class PHRMStockTransferReportVM {
    GenericName: string;
    CostPrice: number;
    MRP: number;
    TransferQuantity: number;
    Unit: string;
    TransferredFrom: string;
    TransferredTo: string;
    Amount: number;
}
