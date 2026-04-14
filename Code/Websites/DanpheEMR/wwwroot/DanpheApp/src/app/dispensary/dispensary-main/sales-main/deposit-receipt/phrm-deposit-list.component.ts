import { Component } from "@angular/core";
import * as moment from "moment";
import { CoreService } from "../../../../core/shared/core.service";
import { PharmacyBLService } from "../../../../pharmacy/shared/pharmacy.bl.service";
import PHRMGridColumns from "../../../../pharmacy/shared/phrm-grid-columns";
import { PHRMStoreModel } from "../../../../pharmacy/shared/phrm-store.model";
import { DanpheHTTPResponse } from "../../../../shared/common-models";
import { NepaliDateInGridColumnDetail, NepaliDateInGridParams } from "../../../../shared/danphe-grid/NepaliColGridSettingsModel";
import { MessageboxService } from "../../../../shared/messagebox/messagebox.service";
import { ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status } from "../../../../shared/shared-enums";
import { DispensaryService } from "../../../shared/dispensary.service";

@Component({
    selector: 'phrm-deposit-list',
    templateUrl: './phrm-deposit-list.component.html',
    host: { '(window:keydown)': 'hotkeys($event)' }
})
export class PHRMDepositListComponent {
    Loading: boolean = false;
    DepositListGridColumns: Array<any> = [];
    DepositList: DepositInfo_DTO[] = [];
    NepaliDateInGridSettings: NepaliDateInGridParams = new NepaliDateInGridParams();
    ShowDepositReceipts: boolean = false;
    DepositInfo: DepositInfo_DTO = new DepositInfo_DTO();
    FromDate: string = moment().format('YYYY-MM-DD');
    ToDate: string = moment().format('YYYY-MM-DD');
    public CurrentActiveDispensary: PHRMStoreModel;

    constructor(public coreService: CoreService, public pharmacyBLService: PharmacyBLService, public messageBoxService: MessageboxService, public dispensaryService: DispensaryService) {
        this.DepositListGridColumns = PHRMGridColumns.PharmacyDepositReceiptList;
        this.NepaliDateInGridSettings.NepaliDateColumnList.push(new NepaliDateInGridColumnDetail('CreatedOn', false));
        this.CurrentActiveDispensary = this.dispensaryService.activeDispensary;
    }

    OnDateRangeChange($event) {
        this.FromDate = $event.fromDate;
        this.ToDate = $event.toDate;
    }
    LoadDepositList() {
        if (!this.FromDate || !this.ToDate) {
            this.messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, ['Select Valid Date Range.']);
            return;
        }
        this.Loading = true;
        this.DepositList = [];
        this.pharmacyBLService.GetDeposits(this.FromDate, this.ToDate, this.CurrentActiveDispensary.StoreId)
            .finally(() => this.Loading = false)
            .subscribe((res: DanpheHTTPResponse) => {
                if (res.Status === ENUM_DanpheHTTPResponses.OK) {
                    this.DepositList = res.Results;
                }
                else {
                    this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ['Failed to load deposits. <br>' + res.ErrorMessage]);
                }
            },
                err => {
                    this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ['Failed to load deposits. <br>' + err]);
                });
    }

    DepositListGridActions($event) {
        switch ($event.Action) {
            case "view": {
                if ($event.Data != null) {
                    this.DepositInfo = $event.Data;
                    this.ShowDepositReceipts = true;
                }
                break;
            }

            default:
                break;
        }
    }

    Close() {
        this.ShowDepositReceipts = false;
    }

    Print() {

    }

    CallBackCloseDepositReceiptPopup() {
        this.Close();
    }

    public hotkeys(event) {
        if (event.keyCode === 27) {
            this.Close();
        }
    }

}


export class DepositInfo_DTO {
    DepositId: number = 0;
    PatientId: number = 0;
    InAmount: number = 0;
    OutAmount: number = 0;
    TransactionType: string = '';
    ReceiptNo: number = 0;
    FiscalYear: string = '';
    CreatedOn: string = '';
    ShortName: string = '';
    DepositAmount: number = 0;
    PatientCode: string = '';
    DepositBalance: number = 0;
    Remarks: string = '';
    PaymentMode: string = '';
    PaymentDetails: string = '';
    UserName: string = '';
    Gender: string = '';
    PhoneNumber: string = '';
    Address: string = '';
    MunicipalityName: string = '';
    CountrySubDivisionName: string = '';
    CountryName: string = '';
    DateOfBirth: string = '';
    ModuleName: string = '';
    PrintCount: number = 0;
    Amount: number = 0;
    CareOf: string = '';
    CareOfContact: string = '';
    WardNumber: number = 0;
}