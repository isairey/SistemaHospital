import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { DanpheHTTPResponse } from "../../../shared/common-models";
import { MessageboxService } from "../../../shared/messagebox/messagebox.service";
import { ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status } from "../../../shared/shared-enums";
import { RegistrationSticker_DTO } from "../../shared/DTOs/registration-sticker.dto";
import { RegistrationStickerSettingsModel } from "../../shared/registration-sticker-settings-model";
import { SettingsBLService } from "../../shared/settings.bl.service";

@Component({
    selector: "registration-sticker-add",
    templateUrl: "./registration-sticker-add.component.html",
})
export class RegistrationStickerAddComponent implements OnInit {
    @Input("selected-row")
    public SelectedRow: RegistrationStickerSettingsModel;

    @Input("update")
    public IsUpdate: boolean = false;
    @Output("callback-add")
    public callbackAdd: EventEmitter<Object> = new EventEmitter<Object>();
    public CurrentRegistrationStickerData: RegistrationStickerSettingsModel = new RegistrationStickerSettingsModel();
    public SelectedRegistrationData: RegistrationSticker_DTO = new RegistrationSticker_DTO();
    constructor(public settingsBLService: SettingsBLService, public messageBoxService: MessageboxService,) {

    }

    ngOnInit() {
        this.IsUpdate = false;
        if (this.SelectedRow) {
            this.IsUpdate = true;
            const value = this.CurrentRegistrationStickerData.RegistrationStickerValidator.controls;
            Object.keys(this.SelectedRow).forEach(data => {
                if (value[data]) {
                    value[data].setValue(this.SelectedRow[data]);
                }
            });
        }
    }

    Close() {
        this.IsUpdate = false;
        this.callbackAdd.emit();
    }

    CheckValidations(): boolean {
        let isValid: boolean = true;
        for (var i in this.CurrentRegistrationStickerData.RegistrationStickerValidator.controls) {
            this.CurrentRegistrationStickerData.RegistrationStickerValidator.controls[i].markAsDirty();
            this.CurrentRegistrationStickerData.RegistrationStickerValidator.controls[i].updateValueAndValidity();
        }
        isValid = this.CurrentRegistrationStickerData.IsValidCheck(undefined, undefined);
        return isValid;
    }

    Add() {
        if (this.CheckValidations()) {
            this.SelectedRegistrationData = this.CurrentRegistrationStickerData.RegistrationStickerValidator.value;
            this.settingsBLService.AddRegistrationStickerData(this.SelectedRegistrationData)
                .subscribe(
                    (res: DanpheHTTPResponse) => {
                        if (res.Status == ENUM_DanpheHTTPResponses.OK) {
                            this.messageBoxService.showMessage(ENUM_MessageBox_Status.Success, ['Registration Sticker  details added Successfully']);
                            this.Close();
                        }
                        else {
                            this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ["Failed to add Registration Sticker  details, check log for details"]);
                        }
                    },
                    err => {
                        this.logError(err);

                    });
        }
        else {
            this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ["Please Provide Valid Inputs."]);
        }
    }
    logError(ErrorMessage: any) {
        throw new Error("Method not implemented.");
    }

    Update() {
        if (this.CheckValidations()) {
            this.SelectedRegistrationData = this.CurrentRegistrationStickerData.RegistrationStickerValidator.value;
            this.settingsBLService.UpdateRegistrationStickerData(this.SelectedRegistrationData)
                .subscribe(
                    (res: DanpheHTTPResponse) => {
                        if (res.Status == ENUM_DanpheHTTPResponses.OK) {
                            this.messageBoxService.showMessage(ENUM_MessageBox_Status.Success, ['Registration Sticker  details updated Successfully']);
                            this.Close();
                        }
                        else {
                            this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ["Failed to update Registration Sticker details, check log for details"]);
                        }

                    },
                    err => {
                        this.logError(err);
                    });
        }
        else {
            this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ["Please Provide Valid Inputs"]);
        }
    }
}
