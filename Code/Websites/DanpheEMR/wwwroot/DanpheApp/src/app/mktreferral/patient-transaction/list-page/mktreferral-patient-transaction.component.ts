import { Component } from "@angular/core";
import * as moment from "moment";
import { DanpheHTTPResponse } from "../../../shared/common-models";
import { NepaliDateInGridColumnDetail, NepaliDateInGridParams } from "../../../shared/danphe-grid/NepaliColGridSettingsModel";
import { GridEmitModel } from "../../../shared/danphe-grid/grid-emit.model";
import { MessageboxService } from "../../../shared/messagebox/messagebox.service";
import { ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status } from "../../../shared/shared-enums";
import { PatientVisitWiseReferral_DTO } from "../../Shared/DTOs/marketing-referral-patient-invoice-details.dto";
import { MarketingReferralBLService } from "../../Shared/marketingreferral.bl.service";
import { MarketingReferralService } from "../../Shared/marketingreferral.service";

@Component({
    selector: 'mktreferral-patient-transaction',
    templateUrl: "./mktreferral-patient-transaction.component.html",
    styleUrls: ["./mktreferral-patient-transaction.component.css"]
})
export class MarketingReferralPatientTransactionComponent {

    PatientVisitWiseReferralCommission = new Array<PatientVisitWiseReferral_DTO>();
    PatientVisitWiseReferralCommissionGridCols: any; //grid cols can be any here, not sure what can come.
    NepaliDateInGridSettings = new NepaliDateInGridParams();
    FromDate: string = "";
    ToDate: string = "";
    ShowAddPage: boolean = false;
    SelectedRowData = new PatientVisitWiseReferral_DTO();
    Loading: boolean = false;
    constructor(private _mktReferralBlService: MarketingReferralBLService, private _mktReferralService: MarketingReferralService, private _msgBoxServ: MessageboxService) {
        this.PatientVisitWiseReferralCommissionGridCols = this._mktReferralService.settingsGridCols.PatientVisitWiseReferralCommissionGridCols;
        this.NepaliDateInGridSettings.NepaliDateColumnList.push(new NepaliDateInGridColumnDetail('VisitDate', false));
    }

    GridActions($event: GridEmitModel): void {
        switch ($event.Action) {
            case "Yes": {
                this.ShowAddPage = true;
                this.SelectedRowData = $event.Data;
                break;
            }
            case "No": {
                this.ShowAddPage = true;
                this.SelectedRowData = $event.Data;
                break;
            }
            default:
                break;
        }
    }

    onDateChange($event): void {
        this.FromDate = $event.fromDate;
        this.ToDate = $event.toDate;

        if (this.FromDate != null && this.ToDate != null) {
            if (moment(this.FromDate).isBefore(this.ToDate) || moment(this.FromDate).isSame(this.ToDate)) {
                this.GetPatientVisitWiseReferralCommission();
            } else {
                this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ["Please enter valid range",]);
            }
        }
    }

    GetPatientVisitWiseReferralCommission(): void {
        if (this.FromDate && this.FromDate.trim() && this.ToDate && this.ToDate.trim()) {
            this._mktReferralBlService.GetPatientVisitWiseReferralCommission(this.FromDate, this.ToDate).finally(() => this.Loading = false).subscribe((res: DanpheHTTPResponse) => {
                if (res.Status === ENUM_DanpheHTTPResponses.OK && res.Results) {
                    this.PatientVisitWiseReferralCommission = res.Results;
                } else {
                    this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ["No Details Found!"]);
                }
            }, (err) => {
                console.log(err);
                this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, [`Something went wrong to fetch the details!`]);
            }
            );
        } else {
            this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Notice, [`FromDate and ToDate are required to fetch the details!`]);
        }
    }
    CloseAddPage($event): void {
        if ($event && $event.action === 'close') {
            this.ShowAddPage = false;
            this.GetPatientVisitWiseReferralCommission();
        }
    }
}