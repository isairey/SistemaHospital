import { ChangeDetectorRef, Component, EventEmitter, Input, Output } from "@angular/core";

import { ImagingType } from '../../../radiology/shared/imaging-type.model';
import { SecurityService } from '../../../security/shared/security.service';
import { DanpheHTTPResponse } from "../../../shared/common-models";
import { MessageboxService } from '../../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status } from "../../../shared/shared-enums";
import { SettingsBLService } from '../../shared/settings.bl.service';


@Component({
    selector: "img-type-add",
    templateUrl: "./imaging-type-add.html",
    host: { '(window:keyup)': 'hotkeys($event)' }
})

export class ImagingTypeAddComponent {
    public CurrentImagingType: ImagingType = new ImagingType();

    public showAddPage: boolean = false;
    @Input("selectedImgType")
    public selectedImgType: ImagingType;

    @Input("imgTypeList")
    public ImgTypeList = new Array<ImagingType>();

    @Output("callback-add")
    callbackAdd: EventEmitter<Object> = new EventEmitter<Object>();
    public update: boolean = false;

    constructor(public settingsBLService: SettingsBLService,
        public securityService: SecurityService,
        public msgBoxServ: MessageboxService,
        public changeDetector: ChangeDetectorRef) {
    }
    @Input("showAddPage")
    public set value(val: boolean) {
        this.showAddPage = val;
        if (this.selectedImgType) {
            this.update = true;
            this.CurrentImagingType = Object.assign(this.CurrentImagingType, this.selectedImgType);
            this.CurrentImagingType.ModifiedBy = this.securityService.GetLoggedInUser().EmployeeId;
        }
        else {
            this.CurrentImagingType = new ImagingType();
            this.CurrentImagingType.CreatedBy = this.securityService.GetLoggedInUser().EmployeeId;

            this.update = false;
        }
    }
    AddImagingType(): void {

        //marking every fields as dirty and checking validity
        for (var i in this.CurrentImagingType.ImagingTypeValidator.controls) {
            this.CurrentImagingType.ImagingTypeValidator.controls[i].markAsDirty();
            this.CurrentImagingType.ImagingTypeValidator.controls[i].updateValueAndValidity();
        }

        //Checking if Imaging Item Name already exists
        if (this.ImgTypeList && this.ImgTypeList.length) {
            const isAlreadyExists = this.ImgTypeList.some(a => a.ImagingTypeName.toLowerCase() === this.CurrentImagingType.ImagingTypeName.toLowerCase());
            if (isAlreadyExists) {
                this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Notice, [`Cannot add imaging type as the Imaging Type "${this.CurrentImagingType.ImagingTypeName}" already exists.`]);
                return;
            }
        }

        //if valid then call the BL service to do post request.
        if (this.CurrentImagingType.IsValidCheck(undefined, undefined) == true) {

            this.settingsBLService.AddImagingType(this.CurrentImagingType)
                .subscribe(
                    (res: DanpheHTTPResponse) => {
                        if (res.Status == ENUM_DanpheHTTPResponses.OK) {
                            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Success, ['Imaging Type Added Successfully']);
                            this.CallBackAddUpdate(res);
                        } else {
                            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, [`Failed to add Imaging Type!`]);
                        }
                        this.Close();
                    },
                    err => {
                        this.logError(err);
                        this.Close();
                    });
        }
    }
    UpdateImagingType(): void {

        //marking every fields as dirty and checking validity
        for (var i in this.CurrentImagingType.ImagingTypeValidator.controls) {
            this.CurrentImagingType.ImagingTypeValidator.controls[i].markAsDirty();
            this.CurrentImagingType.ImagingTypeValidator.controls[i].updateValueAndValidity();
        }

        //Checking if Imaging Item Name already exists
        if (this.ImgTypeList && this.ImgTypeList.length) {
            const isAlreadyExists = this.ImgTypeList.some(a => a.ImagingTypeName.toLowerCase() === this.CurrentImagingType.ImagingTypeName.toLowerCase() && a.ImagingTypeId !== this.CurrentImagingType.ImagingTypeId);
            if (isAlreadyExists) {
                this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Notice, [`Cannot update imaging type as the Imaging type "${this.CurrentImagingType.ImagingTypeName}" already exists.`]);
                return;
            }
        }

        //if valid then call the BL service to do post request.
        if (this.CurrentImagingType.IsValidCheck(undefined, undefined) == true) {

            this.settingsBLService.UpdateImagingType(this.CurrentImagingType)
                .subscribe(
                    (res: DanpheHTTPResponse) => {
                        if (res.Status == ENUM_DanpheHTTPResponses.OK && res.Results) {
                            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Success, ["Imaging Type Updated Successfully"]);
                            this.CallBackAddUpdate(res);
                        } else {
                            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ["Failed to update Imaging Type!"]);
                        }
                        this.Close();

                    },
                    err => {
                        this.logError(err);
                        this.Close();
                    }
                );
        }
    }
    CallBackAddUpdate(res) {
        if (res.Status == ENUM_DanpheHTTPResponses.OK) {
            this.callbackAdd.emit({ imgType: res.Results });
        }
        else {
            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, ["Check log for details"]);
            console.log(res.ErrorMessage);
        }
    }

    logError(err: any) {
        console.log(err);
    }
    Close() {
        this.selectedImgType = null;
        this.update = false;
        this.showAddPage = false;
    }
    showMessageBox(status: string, message: string) {
        this.msgBoxServ.showMessage(status, [message]);
    }
    FocusElementById(id: string) {
        window.setTimeout(function () {
            let itmNameBox = document.getElementById(id);
            if (itmNameBox) {
                itmNameBox.focus();
            }
        }, 600);
    }
    hotkeys(event) {
        if (event.keyCode == 27) {
            this.Close()
        }
    }
}
