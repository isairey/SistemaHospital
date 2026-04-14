import { Component, EventEmitter, Input, Output } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { CoreService } from "../../../core/shared/core.service";
import { DanpheHTTPResponse } from "../../../shared/common-models";
import { MessageboxService } from "../../../shared/messagebox/messagebox.service";
import { ENUM_DanpheHTTPResponses, ENUM_Data_Type, ENUM_MarketingReferralPreference, ENUM_MessageBox_Status } from "../../../shared/shared-enums";
import { PatientVisitLevelReferralCommission_DTO } from "../../Shared/DTOs/patient-referral-commission.dto";
import { ReferralCommission_DTO } from "../../Shared/DTOs/referral-commission.dto";
import { ReferralParty_DTO } from "../../Shared/DTOs/referral-party.dto";
import { ReferralScheme_DTO } from "../../Shared/DTOs/referral-scheme.dto";
import { MarketingReferralBLService } from "../../Shared/marketingreferral.bl.service";

@Component({
    selector: 'mktreferral-patient-add-transaction',
    templateUrl: "./mktreferral-patient-transaction-add.component.html",
    styleUrls: ["./mktreferral-patient-transaction-add.component.css"]
})
export class MarketingReferralPatientTransactionAddComponent {
    @Input("show-add-page")
    ShowAddPage: boolean;
    @Input('selectedRowData')
    SelectedRowData: any;

    @Output("callback-close")
    CallbackClose = new EventEmitter<Object>();

    ShowIsInvoiceSelected: boolean;
    ReferralSchemeList = new Array<ReferralScheme_DTO>();
    ReferringPartyList = new Array<ReferralParty_DTO>();
    SelectedReferralScheme = new ReferralScheme_DTO();
    SelectedReferringPartyObj = new ReferralParty_DTO();
    SelectedReferringParty = new ReferralParty_DTO();
    ReferralEntryValidator: FormGroup = null;
    Remarks: string = '';
    ShowPercentageAndAmount = {
        ShowPercentage: false,
        ShowCommissionAmount: false
    };
    Amount: number = 0;
    Loading: boolean = false;
    ReferralCommissionObj = new ReferralCommission_DTO();
    AlreadyAddedCommission = new Array<ReferralCommission_DTO>();
    ReferralSchemeObj = new ReferralScheme_DTO();
    PatientReferralCommission = new PatientVisitLevelReferralCommission_DTO();
    constructor(private _messageBoxService: MessageboxService,
        private _mktReferralBLService: MarketingReferralBLService,
        private _coreService: CoreService,) {
        let _formbuilder = new FormBuilder();
        this.ReferralEntryValidator = _formbuilder.group({
            'ReferralSchemeId': ['', Validators.required],
            'ReferringPartyId': ['', Validators.required],
            'Amount': ['', [
                Validators.required,
                (control) => {
                    const value = control.value;
                    if (value !== null && value !== undefined && value < 0) {
                        return { nonNegative: true };
                    }
                    return null;
                }
            ]
            ],
        });
    }

    ngOnInit() {
        const selectedRowData = this.SelectedRowData;
        if (selectedRowData && selectedRowData.PatientVisitId) {
            this.GetReferralCommissionDetails(selectedRowData.PatientVisitId);
        }
        this.GetReferralScheme();
        this.GetReferringParty();
    }


    GetReferralCommissionDetails(patientVisitId: number): void {
        this._mktReferralBLService.GetReferralCommissionDetails(patientVisitId).subscribe((res: DanpheHTTPResponse) => {
            if (res.Status === ENUM_DanpheHTTPResponses.OK && res.Results) {
                this.AlreadyAddedCommission = res.Results;
            } else {
                this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ['Failed to get Referral Commission Details']);
            }
        }, err => {
            console.log(err);
            this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, ['Something went wrong while fetching Patient Referral Commission details']);
        });
    }
    Close() {
        this.CallbackClose.emit({ 'action': 'close' });
        this.Clear();
    }

    Clear() {
        this.SelectedReferralScheme = new ReferralScheme_DTO();
        this.SelectedReferringParty = null;
        this.Remarks = "";
        this.SelectedReferringPartyObj = new ReferralParty_DTO();
        this.Amount = null;
        this.ReferralSchemeObj = new ReferralScheme_DTO();
        this.ReferralEntryValidator.reset();
    }

    OnReferringPartySelected($event): void {
        if ($event) {
            if (typeof ($event) === ENUM_Data_Type.Object) {
                const selectedReferringPartyId = $event.ReferringPartyId;
                if (selectedReferringPartyId) {
                    // if referring party does not exist then proceed further assign its value 
                    const selectedReferringParty = this.ReferringPartyList.find(p => p.ReferringPartyId === selectedReferringPartyId);
                    if (selectedReferringParty) {
                        this.SelectedReferringPartyObj.ReferringPartyName = selectedReferringParty.ReferringPartyName;
                        this.SelectedReferringPartyObj.VehicleNumber = selectedReferringParty.VehicleNumber;
                        this.SelectedReferringPartyObj.AreaCode = selectedReferringParty.AreaCode;
                        this.SelectedReferringPartyObj.GroupName = selectedReferringParty.GroupName;
                        this.SelectedReferringPartyObj.ReferringOrganizationName = selectedReferringParty.ReferringOrganizationName;
                        this.SelectedReferringPartyObj.ReferringPartyId = selectedReferringParty.ReferringPartyId;
                    }
                }
            }
            else {
                this.SelectedReferringPartyObj = new ReferralParty_DTO();
            }
        }
    }
    ReferringPartiesListFormatter(data: any): string {
        let html: string = "";
        html = "<font color='blue'; size=02 >" + data["ReferringPartyName"] + "&nbsp;&nbsp;" + ":" + "&nbsp;" + data["GroupName"].toUpperCase() + "</font>" + "&nbsp;&nbsp;";
        html += "(" + data["VehicleNumber"] + ")" + "&nbsp;&nbsp;" + data["ReferringOrganizationName"] + "&nbsp;&nbsp;";
        return html;
    }

    SaveNewReferral(): void {
        const patientReferralCommission = this.CreatePatientReferralCommission();
        if (patientReferralCommission && patientReferralCommission.PatientId && patientReferralCommission.PatientVisitId && patientReferralCommission.ReferralAmount >= 0) {
            this._mktReferralBLService.AddPatientReferralCommission(patientReferralCommission)
                .subscribe((res: DanpheHTTPResponse) => {
                    if (res.Status === ENUM_DanpheHTTPResponses.OK && res.Results) {
                        this._messageBoxService.showMessage(ENUM_MessageBox_Status.Success, ["Patient Referral Commission Added"]);
                        this.Clear();
                        this.GetReferralCommissionDetails(this.SelectedRowData.PatientVisitId);
                    }
                    else {
                        this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ["Failed to add Patient Referral Commission"]);
                    }
                }, err => {
                    console.log(err);
                    this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Something went wrong while adding Patient Referral Commission.`]);
                });
        }
    }

    CreatePatientReferralCommission(): PatientVisitLevelReferralCommission_DTO {
        let patientReferralCommission = new PatientVisitLevelReferralCommission_DTO();
        patientReferralCommission.PatientId = this.SelectedRowData.PatientId;
        patientReferralCommission.PatientVisitId = this.SelectedRowData.PatientVisitId;
        patientReferralCommission.ReferringPartyId = this.SelectedReferringPartyObj.ReferringPartyId;
        patientReferralCommission.ReferralSchemeId = this.SelectedReferralScheme.ReferralSchemeId;
        patientReferralCommission.VisitDate = this.SelectedRowData.VisitDate;
        patientReferralCommission.ReferralAmount = this.Amount;
        patientReferralCommission.Remarks = this.Remarks;
        patientReferralCommission.IsActive = true;
        return patientReferralCommission;
    }

    ConfirmDelete(referralCommissionId: number) {
        const result = window.confirm("Are you sure you want to delete this Referral commission?");

        if (result) {
            this.DeleteReferralCommission(referralCommissionId);
        } else {

        }
    }
    DeleteReferralCommission(ReferralCommissionId: number) {
        this._mktReferralBLService.DeletePatientReferralCommission(ReferralCommissionId).subscribe(
            (res: DanpheHTTPResponse) => {
                if (res.Status === ENUM_DanpheHTTPResponses.OK && res.Results) {

                    this._messageBoxService.showMessage(ENUM_MessageBox_Status.Success, ['Commission Deleted Successfully']);
                    let index = this.AlreadyAddedCommission.findIndex(a => a.ReferralCommissionId === ReferralCommissionId);
                    this.AlreadyAddedCommission.splice(index, 1);
                    this.GetReferralCommissionDetails(this.SelectedRowData.PatientVisitId);
                    this.Clear();

                } else {
                    this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Error: ${res.ErrorMessage}`]);
                }
            },
            (err: DanpheHTTPResponse) => {
                this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Error: ${err.ErrorMessage}`]);
            }
        );
    }

    OnReferralSchemeSelected(event: any) {
        if (event) {
            const referralSchemeId = +event.target.value;
            this.SelectedReferralScheme = this.ReferralSchemeList.find(scheme => scheme.ReferralSchemeId === referralSchemeId && scheme.ReferralPreference.toLowerCase() === ENUM_MarketingReferralPreference.Amount.toLowerCase());
            if (this.SelectedReferralScheme) {
                this.ReferralSchemeObj.ReferralSchemeId = this.SelectedReferralScheme.ReferralSchemeId;
                this.ReferralSchemeObj.ReferralAmount = this.SelectedReferralScheme.ReferralAmount;
                this.Amount = this.ReferralSchemeObj.ReferralAmount;
                //this.calculateAmount();
            }
        }
    }

    // calculateAmount() {
    //     const NetAmount = this.SelectedRowData.NetAmount;
    //     const percent = this.SelectedReferralScheme.ReferralPercentage;
    //     this.Amount = NetAmount * (percent / 100);
    // }

    GetReferralScheme() {
        this._mktReferralBLService.GetReferralScheme().subscribe(
            (res: DanpheHTTPResponse) => {
                if (res.Status === ENUM_DanpheHTTPResponses.OK) {
                    if (res.Results && res.Results.length > 0) {
                        const referralSchemes = res.Results;
                        this.ReferralSchemeList = referralSchemes.filter(r => r.ReferralPreference.toLowerCase() === ENUM_MarketingReferralPreference.Amount.toLowerCase());

                    } else {
                        this.ReferralSchemeList = [];
                    }
                } else {
                    this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Error: ${res.ErrorMessage}`]);
                }
            },
            (err: DanpheHTTPResponse) => {
                this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Error: ${err.ErrorMessage}`]);
            }
        );
    }
    GetReferringParty() {
        this._mktReferralBLService.GetReferringParty().subscribe(
            (res: DanpheHTTPResponse) => {
                if (res.Status === ENUM_DanpheHTTPResponses.OK) {
                    if (res.Results && res.Results.length > 0) {
                        this.ReferringPartyList = res.Results.filter(p => p.IsActive === true);
                    } else {
                        this.ReferringPartyList = [];
                    }
                } else {
                    this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Error: ${res.ErrorMessage}`]);
                }
            },
            (err: DanpheHTTPResponse) => {
                this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Error: ${err.ErrorMessage}`]);
            }
        );
    }

}