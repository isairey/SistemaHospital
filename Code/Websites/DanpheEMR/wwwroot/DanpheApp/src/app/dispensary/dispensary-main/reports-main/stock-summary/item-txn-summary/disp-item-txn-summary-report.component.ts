import { Component, Input } from "@angular/core";
import * as moment from "moment";
import { CoreService } from "../../../../../core/shared/core.service";
import { PharmacyBLService } from "../../../../../pharmacy/shared/pharmacy.bl.service";
import PHRMReportsGridColumns from "../../../../../pharmacy/shared/phrm-reports-grid-columns";
import { CFGParameterModel } from "../../../../../settings-new/shared/cfg-parameter.model";
import { DanpheHTTPResponse } from "../../../../../shared/common-models";
import { NepaliDateInGridColumnDetail, NepaliDateInGridParams } from "../../../../../shared/danphe-grid/NepaliColGridSettingsModel";
import { GridEmitModel } from "../../../../../shared/danphe-grid/grid-emit.model";
import { MessageboxService } from "../../../../../shared/messagebox/messagebox.service";
import { ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status } from "../../../../../shared/shared-enums";
import { DISPItemTxnSummaryReportModel } from "./disp-item-txn-summary-report.model";


@Component({
    selector: 'disp-item-txn-summary-report',
    templateUrl: './disp-item-txn-summary-report.component.html',
    styles: []
})
export class DISPItemTxnSummaryComponent {
    @Input("fromDate") public FromDate: string = '2016-01-01';
    @Input("toDate") public ToDate: string = moment().format('YYYY-MM-DD');
    @Input("itemId") public ItemId: number = null;
    @Input("itemName") public ItemName: string = '';
    showGRPopUp: boolean;
    selectedGRId: number;
    showInvoicePopUp: boolean;
    showInvoiceReturnPopUp: boolean;
    selectedInvoiceId: number;
    selectedInvoiceReturnId: number;
    showDispatchPopUp: boolean;
    selectedDispatchId: number;

    ///ItemTxn Summary Report Columns variable
    ItemTxnSummaryReportColumns: Array<any> = null;
    ///ItemTxn Summary Report Data variable
    ItemTxnSummaryReportData: DISPItemTxnSummaryReportModel[] = [];
    NepaliDateInGridSettings: NepaliDateInGridParams = new NepaliDateInGridParams();
    public pharmacy: string = "pharmacy";
    showNepaliReceipt: boolean = false;
    showNepaliGRPopUp: boolean = false;

    constructor(private _pharmacyBLService: PharmacyBLService, private msgBox: MessageboxService, public coreService: CoreService) {
        this.ItemTxnSummaryReportColumns = PHRMReportsGridColumns.PHRMItemTxnSummaryReport;
        this.NepaliDateInGridSettings.NepaliDateColumnList.push(new NepaliDateInGridColumnDetail("TransactionDate", true));
        var showNpReceiptParams = this.coreService.Parameters.find(a => a.ParameterGroupName == 'Common' && a.ParameterName == 'NepaliReceipt');
        this.checkForNepaliReceiptParameter(showNpReceiptParams);
    }
    private checkForNepaliReceiptParameter(showNpReceiptParams: CFGParameterModel) {
        if (!!showNpReceiptParams) {
            if (showNpReceiptParams.ParameterValue == true || showNpReceiptParams.ParameterValue == 'true')
                this.showNepaliReceipt = true;
        }
    }
    ngOnInit() {
        this.GetItemTxnData();
    }
    GetItemTxnData() {
        this._pharmacyBLService.GetItemTxnSummaryReport(this.FromDate, this.ToDate, this.ItemId)
            .subscribe((res: DanpheHTTPResponse) => {
                if (res.Status === ENUM_DanpheHTTPResponses.OK) {
                    this.ItemTxnSummaryReportData = res.Results as DISPItemTxnSummaryReportModel[];
                }
                else {
                    this.msgBox.showMessage(ENUM_MessageBox_Status.Failed, ["Failed to load data."]);
                }
            }, _err => {
                this.msgBox.showMessage(ENUM_MessageBox_Status.Error, ["Failed to load data."]);
            });
    }

    gridExportOptions = {
        fileName: `${this.ItemName}_Dispensary_ItemTransactionReport_${moment().format('YYYY-MM-DD')}.xls`,
    };

    ItemTxnSummaryGridAction($event: GridEmitModel) {
        switch ($event.Action) {
            case 'showPrintPopUp': {
                this.ShowRespectivePopUp($event.Data);
                break;
            }
            default:
                break;
        }
    }

    ShowRespectivePopUp(selectedItemTxnData) {
        switch (selectedItemTxnData.ReferenceNoPrefix) {
            case 'GR': {
                this.selectedGRId = selectedItemTxnData.ReferenceNo;
                if (this.showNepaliReceipt) {
                    this.showNepaliGRPopUp = true;
                }
                else {
                    this.showGRPopUp = true;
                }
                break;
            }
            case 'CGR': {
                this.selectedGRId = selectedItemTxnData.ReferenceNo;
                this.showGRPopUp = true;
                break;
            }
            case 'PH': {
                this.selectedInvoiceId = selectedItemTxnData.ReferenceNo;
                this.showInvoicePopUp = true;
                break;
            }
            case 'CR-PH': {
                this.selectedInvoiceReturnId = selectedItemTxnData.ReferenceNo;
                this.showInvoiceReturnPopUp = true;
                break;
            }
            case 'TR': {
                this.selectedDispatchId = selectedItemTxnData.ReferencePrintNo;
                if (this.showNepaliReceipt == true) {
                    this.showDispatchPopUp = true;
                }
            }
            default:
                break;
        }
    }
    OnGRPopUpClose() {
        this.showGRPopUp = false;
    }
    OnInvoicePopUpClose() {
        this.showInvoicePopUp = false;
    }

    OnInvoiceReturnPopUpClose() {
        this.showInvoiceReturnPopUp = false;
    }
    OnDispatchPopUpClose() {
        this.showDispatchPopUp = false;
    }
}
