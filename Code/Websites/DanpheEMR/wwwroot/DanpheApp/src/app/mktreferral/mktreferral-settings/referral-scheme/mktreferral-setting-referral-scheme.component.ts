import { ChangeDetectorRef, Component } from "@angular/core";
import { FormBuilder, FormControl, FormGroup, Validators } from "@angular/forms";
import { CoreService } from "../../../core/shared/core.service";
import { DanpheHTTPResponse } from "../../../shared/common-models";
import { NepaliDateInGridParams } from "../../../shared/danphe-grid/NepaliColGridSettingsModel";
import { GridEmitModel } from "../../../shared/danphe-grid/grid-emit.model";
import { MessageboxService } from "../../../shared/messagebox/messagebox.service";
import { ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status } from "../../../shared/shared-enums";
import { ReferralScheme_DTO } from "../../Shared/DTOs/referral-scheme.dto";
import { MarketingReferralBLService } from "../../Shared/marketingreferral.bl.service";
import { MarketingReferralService } from "../../Shared/marketingreferral.service";

@Component({
    selector: 'referral-scheme',
    templateUrl: './mktreferral-setting-referral-scheme.component.html',
    styleUrls: ['./mktreferral-setting-referral-scheme.component.css']
})
export class MarketingReferralSchemeSettingsComponent {
    public MarketingReferralSchemeGridCols: any;
    public NepaliDateInGridSettings = new NepaliDateInGridParams();
    public Loading: boolean;
    public referringPartyFormControl: FormControl;
    public ReferralSchemes = new Array<ReferralScheme_DTO>();
    public ReferralSchemeObj = new ReferralScheme_DTO();
    public ReferralSchemeValidator: FormGroup = null;
    public ShowAddEditPage: boolean = false;
    public ComponentMode: string = "add";
    public SelectedItem = new ReferralScheme_DTO();

    constructor(public msgBoxServ: MessageboxService,
        public changeDetector: ChangeDetectorRef,
        public mktReferralBLService: MarketingReferralBLService,
        public mktReferral: MarketingReferralService,
        public coreService: CoreService) {
        let _formbuilder = new FormBuilder();
        this.ReferralSchemeValidator = _formbuilder.group({
            'ReferralSchemeName': ['', Validators.required],
            'ReferralPercentage': [0],
            'ReferralAmount': [0],
            'ReferralPreference': ['', Validators.required],
            'Description': [''],
        });
        this.MarketingReferralSchemeGridCols = this.mktReferral.settingsGridCols.MarketingReferralSchemeGridCols;
    }

    ngOnInit() {
        this.GetReferralSchemes();
    }

    GetReferralSchemes() {
        this.mktReferralBLService.GetReferralScheme().subscribe(
            (res: DanpheHTTPResponse) => {
                if (res.Status === ENUM_DanpheHTTPResponses.OK) {
                    if (res.Results && res.Results.length > 0) {
                        this.ReferralSchemes = res.Results;
                    } else {
                        this.ReferralSchemes = [];
                    }
                } else {
                    this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, [`Error: ${res.ErrorMessage}`]);
                }
            },
            (err: DanpheHTTPResponse) => {
                this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, [`Error: ${err.ErrorMessage}`]);
            }
        );
    }
    Close() {
        this.ShowAddEditPage = false;
        this.ComponentMode = 'add';
        this.ReferralSchemeObj = new ReferralScheme_DTO();
    }
    GoToNextInput(nextInputId: string) {
        const nextInput = document.getElementById(nextInputId);
        if (nextInput) {
            nextInput.focus();
        }
    }
    ShowAddNewPage() {
        this.SelectedItem = null;
        this.ReferralSchemeObj = new ReferralScheme_DTO();
        this.ShowAddEditPage = true;
    }
    ReferralSchemesGridAction($event: GridEmitModel) {
        switch ($event.Action) {
            case "edit": {
                this.ComponentMode = 'edit'
                this.SelectedItem = $event.Data;
                this.ReferralSchemeObj = this.SelectedItem;
                // this.ReferralSchemeObj.ReferralPreference = this.SelectedItem.ReferralPreference;
                this.ReferralSchemeValidator.get('ReferralPreference').setValue(this.SelectedItem.ReferralPreference);
                this.ShowAddEditPage = true;
                break;
            }

            case "activateReferralScheme": {
                this.SelectedItem = $event.Data;
                this.ActivateDeactivateReferralScheme(this.SelectedItem);
                break;
            }

            case "deactivateReferralScheme": {
                this.SelectedItem = $event.Data;
                this.ActivateDeactivateReferralScheme(this.SelectedItem);
                break;
            }
            default:
                break;
        }
    }
    ActivateDeactivateReferralScheme(selectedItem: ReferralScheme_DTO) {
        const message = selectedItem.IsActive ? "Are you sure you want to deactivate this Organization?" : "Are you sure you want to activate this Organization?";
        if (window.confirm(message)) {
            this.mktReferralBLService
                .ActivateDeactivateReferralScheme(selectedItem)
                .subscribe((res: DanpheHTTPResponse) => {
                    if (res.Status === ENUM_DanpheHTTPResponses.OK) {
                        this.GetReferralSchemes();
                        this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Success, ['Referral Scheme Status updated successfully']);
                    } else {
                        this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ["failed to Change status",]);
                    }
                });
        }
    }
    Save() {
        this.Loading = true;
        for (let i in this.ReferralSchemeValidator.controls) {
            this.ReferralSchemeValidator.controls[i].markAsDirty();
            this.ReferralSchemeValidator.controls[i].updateValueAndValidity();
        }
        if (this.IsValidCheck(undefined, undefined) && this.CheckPercentageValidation(this.ReferralSchemeObj)) {
            this.mktReferralBLService
                .SaveReferralScheme(this.ReferralSchemeObj)
                .subscribe(
                    (res: DanpheHTTPResponse) => {
                        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
                            if (res.Results) {
                                this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Success, [`Successfully saved Organization.`]);
                                this.Loading = false;
                                this.GetReferralSchemes();
                                this.Close();
                            }
                        } else {
                            this.Loading = false;
                            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, [`Error: ${res.ErrorMessage}`,]);
                        }
                    },
                    (err: DanpheHTTPResponse) => {
                        this.Loading = false;
                        this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, [`Error: ${err.ErrorMessage}`,]);
                    }
                );
        } else {
            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, [`There are validation error with the data, Please correct them.`])
        }
        this.Loading = false;
    }
    public IsValidCheck(fieldName, validator): boolean {
        if (fieldName == undefined) {
            return this.ReferralSchemeValidator.valid;
        }
        else
            return !(this.ReferralSchemeValidator.hasError(validator, fieldName));
    }
    Update() {
        this.Loading = true;
        for (let i in this.ReferralSchemeValidator.controls) {
            this.ReferralSchemeValidator.controls[i].markAsDirty();
            this.ReferralSchemeValidator.controls[i].updateValueAndValidity();
        }
        if (this.IsValidCheck(undefined, undefined) && this.CheckPercentageValidation(this.ReferralSchemeObj)) {
            this.mktReferralBLService
                .UpdateReferralScheme(this.ReferralSchemeObj)
                .subscribe(
                    (res: DanpheHTTPResponse) => {
                        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
                            if (res.Results) {
                                this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Success, [`Organization Updated Successfully`]);
                                this.Loading = false;
                                this.GetReferralSchemes();
                                this.Close();
                            }
                        } else {
                            this.Loading = false;
                            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, [`Failed to Update`]);
                        }
                    },
                    (err: DanpheHTTPResponse) => {
                        this.Loading = false;
                        this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, [`Error: ${err.ErrorMessage}`,]);
                    }
                );
        } else {
            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, [`There are validation error with the data, Please correct them.`])
        }
        this.Loading = false;
    }

    CheckPercentageValidation(referralScheme: ReferralScheme_DTO): boolean {
        if (referralScheme) {
            if (referralScheme.ReferralPercentage < 0 || referralScheme.ReferralPercentage > 100) {
                return false;
            } else {
                return true;
            }
        }
    }

    OnReferralPreferenceChange($event): void {
        if ($event) {
            const referralPreference = $event.target.value;
            this.ReferralSchemeObj.ReferralPreference = referralPreference;
            this.ReferralSchemeValidator.controls['ReferralPreference'].setValue(this.ReferralSchemeObj.ReferralPreference);
        }
    }
}