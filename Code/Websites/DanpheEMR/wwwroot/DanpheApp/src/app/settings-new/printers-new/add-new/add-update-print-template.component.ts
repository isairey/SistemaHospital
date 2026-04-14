import { Component, EventEmitter, Input, Output } from "@angular/core";
import { DanpheHTTPResponse } from "../../../shared/common-models";
import { MessageboxService } from "../../../shared/messagebox/messagebox.service";
import { ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status } from "../../../shared/shared-enums";
import { AddPrintTemplateSettings_DTO } from "../../shared/DTOs/print-template-settings-new.dto";
import { PrintTemplateSettings_DTO } from "../../shared/DTOs/print-templates-settings.dto";
import { SettingsBLService } from "../../shared/settings.bl.service";

@Component({
    selector: 'print-template-settings',
    templateUrl: './add-update-print-template.component.html',
    styleUrls: ['./add-update-print-template.component.css']
})
export class PrintTemplateSettingsComponent {

    @Input('print-template-to-edit')
    public SelectedPrintTemplate = new PrintTemplateSettings_DTO();

    @Input('is-add-new-print-template')
    public IsAddNewPrintTemplate: boolean = true;

    @Output("callback-add")
    public CallbackPrintTemplate = new EventEmitter<Object>();
    PrintTemplateSettings = new AddPrintTemplateSettings_DTO();
    UpdatePrintTemplateSettings = new PrintTemplateSettings_DTO();
    isFreeTextDisplay: boolean = false;

    constructor(private _settingsBlService: SettingsBLService, private _msgBoxService: MessageboxService) {

    }

    ngOnInit(): void {
        if (!this.IsAddNewPrintTemplate && this.SelectedPrintTemplate && this.SelectedPrintTemplate.PrintTemplateSettingsId) {
            this.PrintTemplateSettings.PrintType = this.SelectedPrintTemplate.PrintType;
            this.PrintTemplateSettings.VisitType = this.SelectedPrintTemplate.VisitType;
            this.PrintTemplateSettings.PrinterType = this.SelectedPrintTemplate.PrinterType;
            this.PrintTemplateSettings.FieldSettingsName = this.SelectedPrintTemplate.FieldSettingsName;
            this.PrintTemplateSettings.PrintTemplateMainFormat = this.SelectedPrintTemplate.PrintTemplateMainFormat;
        }
    }
    SavePrintFormat(): void {
        if (this.PrintTemplateSettings) {
            if (!this.IsValidPrintTemplate(this.PrintTemplateSettings)) {
                this._msgBoxService.showMessage(ENUM_MessageBox_Status.Failed, [`Mandatory Fields are required to be added!`]);
                return
            }
            //! Appending this style to make the font-family same in every case;
            this.PrintTemplateSettings.PrintTemplateMainFormat = `<style>  body {  font-family: Quicksand, "Open Sans", sans-serif, "Nunito Sans"  }  </style> \n ${this.PrintTemplateSettings.PrintTemplateMainFormat}`;

            this._settingsBlService.SavePrintFormat(this.PrintTemplateSettings).subscribe((res: DanpheHTTPResponse) => {
                if (res.Status === ENUM_DanpheHTTPResponses.OK && res.Results) {
                    this._msgBoxService.showMessage(ENUM_MessageBox_Status.Success, [`A new Print Template is created Successfully!`]);
                    this.CallbackPrintTemplate.emit({ action: 'close', success: true });
                } else {
                    this._msgBoxService.showMessage(ENUM_MessageBox_Status.Failed, [`Failed to create a new Print Template!`]);
                }
            }, err => {
                console.error(err);
                this._msgBoxService.showMessage(ENUM_MessageBox_Status.Error, [err])
            });
        }
    }
    IsValidPrintTemplate(printTemplate: AddPrintTemplateSettings_DTO) {
        let isValid = false;
        if (!printTemplate.PrintType || !(printTemplate.PrintType && printTemplate.PrintType.trim())) {
            isValid = false;
        } else if (!printTemplate.VisitType || !(printTemplate.VisitType && printTemplate.VisitType.trim())) {
            isValid = false;
        } else if (!printTemplate.PrinterType || !(printTemplate.PrinterType && printTemplate.PrinterType.trim())) {
            isValid = false;
        } else if (!printTemplate.FieldSettingsName || !(printTemplate.FieldSettingsName && printTemplate.FieldSettingsName.trim())) {
            isValid = false;
        } else if (!printTemplate.PrintTemplateMainFormat || !(printTemplate.PrintTemplateMainFormat && printTemplate.PrintTemplateMainFormat.trim())) {
            isValid = false;
        } else {
            isValid = true;
        }
        return true;

    }

    UpdatePrintTemplate(): void {
        if (this.PrintTemplateSettings && this.SelectedPrintTemplate) {
            this.UpdatePrintTemplateSettings = this.SelectedPrintTemplate;
            this.UpdatePrintTemplateSettings.PrintTemplateMainFormat = `<style>  body {  font-family: Quicksand, "Open Sans", sans-serif, "Nunito Sans"  }  </style> \n ${this.PrintTemplateSettings.PrintTemplateMainFormat}`;

            if (!this.IsValidPrintTemplate(this.UpdatePrintTemplateSettings)) {
                this._msgBoxService.showMessage(ENUM_MessageBox_Status.Failed, [`Mandatory Fields are required to be added!`]);
                return
            }
            this._settingsBlService.UpdatePrintTemplate(this.UpdatePrintTemplateSettings).subscribe((res: DanpheHTTPResponse) => {
                if (res.Status === ENUM_DanpheHTTPResponses.OK && res.Results) {
                    this._msgBoxService.showMessage(ENUM_MessageBox_Status.Success, [`Print Template is updated Successfully!`]);
                    this.CallbackPrintTemplate.emit({ action: 'close', success: true });
                } else {
                    this._msgBoxService.showMessage(ENUM_MessageBox_Status.Failed, [`Failed to update Print Template!`]);
                }
            }, err => {
                console.error(err);
                this._msgBoxService.showMessage(ENUM_MessageBox_Status.Error, [err])
            });

        }
    }

    OnChangeEditorData($event): void {
        if ($event) {
            let printTemplateMainFormat = $event;
            this.PrintTemplateSettings.PrintTemplateMainFormat = "";
            this.PrintTemplateSettings.PrintTemplateMainFormat = printTemplateMainFormat;
        }
    }

    Close(): void {
        this.SelectedPrintTemplate = new PrintTemplateSettings_DTO();
        this.CallbackPrintTemplate.emit({ "action": "close" })
    }
}
