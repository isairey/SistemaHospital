import { Component } from "@angular/core";
import { CoreService } from "../../../core/shared/core.service";
import { SecurityService } from "../../../security/shared/security.service";
import { GridEmitModel } from "../../../shared/danphe-grid/grid-emit.model";
import { SettingsGridColumnSettings } from "../../../shared/danphe-grid/settings-grid-column-settings";
import { MessageboxService } from "../../../shared/messagebox/messagebox.service";
import { ENUM_DanpheHTTPResponseText, ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status } from "../../../shared/shared-enums";
import { RegistrationStickerSettingsModel } from "../../shared/registration-sticker-settings-model";
import { SettingsBLService } from "../../shared/settings.bl.service";

@Component({
    selector: "registration-sticker-list",
    templateUrl: "./registration-sticker-list.component.html",
})
export class RegistrationStickerListComponent {
    public ShowAddPage: boolean = false;
    public ShowGrid: boolean = false;
    public RegistrationStickerData: Array<RegistrationStickerSettingsModel> = new Array<RegistrationStickerSettingsModel>();
    public RegistrationStickerGridColumns: Array<any> = null;
    public RegistrationStickerDataGriColumns: SettingsGridColumnSettings = null;
    public SelectedRow: RegistrationStickerSettingsModel;
    public Index: number = 0;
    public Update: boolean = false;
    public stickerData: { registrationStickerSettingsId: number, isActive: boolean } = { registrationStickerSettingsId: 0, isActive: false }

    constructor(public settingsBLService: SettingsBLService, public messageBoxService: MessageboxService, public coreService: CoreService,
        public securityService: SecurityService) {
        this.GetRegistrationStickerSettingsData();
        this.RegistrationStickerDataGriColumns = new SettingsGridColumnSettings(this.coreService.taxLabel, this.securityService);
        this.RegistrationStickerGridColumns = this.RegistrationStickerDataGriColumns.RegistrationStickerList;
    }

    AddBillingItem() {
        this.Update = false;
        this.SelectedRow = null;
        this.ShowAddPage = true;
    }

    CallBackAdd() {
        this.Update = false;
        this.SelectedRow = null;
        this.ShowAddPage = false;
        this.GetRegistrationStickerSettingsData();
    }
    public GetRegistrationStickerSettingsData() {
        this.settingsBLService.GetRegistrationStickerSettingsData()
            .subscribe(res => {
                if (res.Status === ENUM_DanpheHTTPResponses.OK) {
                    this.RegistrationStickerData = res.Results;
                    this.ShowGrid = true;
                }
                else {
                    this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ['Failed to get Registration Sticker Data, check log for details']);
                }

            });
    }

    RegistrationStickerGridActions($event: GridEmitModel) {
        switch ($event.Action) {
            case "edit": {
                this.SelectedRow = null;
                this.Index = $event.RowIndex;
                this.ShowAddPage = false;
                this.SelectedRow = $event.Data;
                this.ShowAddPage = true;
                this.Update = true;
                break;
            }
            case "activateDeactivateRegistrationSticker": {
                if ($event.Data != null) {
                    this.SelectedRow = null;
                    this.SelectedRow = $event.Data;
                    this.ActivateDeactivateRegistrationStickerStatus(this.SelectedRow);
                }
                break;
            }

            default:
                break;
        }
    }







    ActivateDeactivateRegistrationStickerStatus(currStickerData: RegistrationStickerSettingsModel) {
        if (currStickerData !== null) {
            let status = currStickerData.IsActive === true ? false : true;
            this.stickerData.registrationStickerSettingsId = currStickerData.RegistrationStickerSettingsId;
            this.stickerData.isActive = status;
            if (status === true) {
                currStickerData.IsActive = status;
                this.ChangeActiveStatus(this.stickerData);
            } else {
                if (confirm("Are you Sure want to Deactivate " + this.SelectedRow.StickerName + '?')) {
                    currStickerData.IsActive = status;
                    this.ChangeActiveStatus(this.stickerData);
                }
            }
        }

    }

    ChangeActiveStatus(stickerData) {
        this.settingsBLService.ActivateDeactivateRegistrationStickerStatus(stickerData.registrationStickerSettingsId, stickerData.isActive)
            .subscribe(
                res => {
                    if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
                        this.GetRegistrationStickerSettingsData();
                        let responseMessage = res.Results.IsActive ? "Registration Sticker is now Activated." : "Registration Sticker is now Deactivated.";
                        this.messageBoxService.showMessage(ENUM_MessageBox_Status.Success, [responseMessage]);

                    }
                    else {
                        this.messageBoxService.showMessage(ENUM_MessageBox_Status.Error, ['Something went wrong' + res.ErrorMessage]);
                    }
                },
                err => {
                    this.messageBoxService.showMessage(ENUM_MessageBox_Status.Success, [err]);
                });

    }
}