import { Component } from "@angular/core";
import { DanpheHTTPResponse } from "../../../shared/common-models";
import { MessageboxService } from "../../../shared/messagebox/messagebox.service";
import { ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status } from "../../../shared/shared-enums";
import { PrintTemplateSettings_DTO } from "../../shared/DTOs/print-templates-settings.dto";
import { SettingsService } from "../../shared/settings-service";
import { SettingsBLService } from "../../shared/settings.bl.service";

@Component({
    selector: 'list-print-template-settings',
    templateUrl: './list-print-templates-settings.component.html',
    styleUrls: ['./list-print-templates-settings.component.css']
})
export class ListPrintTemplateComponent {

    public ShowAddNewPrintTemplate: boolean = false;
    public SelectedPrintTemplate = new PrintTemplateSettings_DTO();
    public PrintTemplatesGridCols: unknown;
    public PrintTemplates = new Array<PrintTemplateSettings_DTO>();
    public IsAddNewPrintTemplate: boolean = false;
    public IsAddMode: boolean = true;

    constructor(private _settingsBlService: SettingsBLService, private _settingsService: SettingsService, private _msgBoxService: MessageboxService) {
        this.PrintTemplatesGridCols = typeof (this._settingsService.settingsGridCols.PrintTemplatesGridCols);
        this.PrintTemplatesGridCols = this._settingsService.settingsGridCols.PrintTemplatesGridCols;

        this.GetAllPrintTemplates();
    }

    GetAllPrintTemplates(): void {
        this._settingsBlService.GetAllPrintTemplates().subscribe((res: DanpheHTTPResponse) => {
            if (res.Status === ENUM_DanpheHTTPResponses.OK) {
                this.PrintTemplates = res.Results;
                this.PrintTemplatesGridCols = this._settingsService.settingsGridCols.PrintTemplatesGridCols;
            }
            else {
                this._msgBoxService.showMessage(ENUM_MessageBox_Status.Failed, ["Failed to load Print Templates"]);
            }
        });
    }

    AddNewPrintTemplate(): void {
        this.ShowAddNewPrintTemplate = true;
        this.IsAddMode = true;
    }

    PrintTemplatesGridAction($event): void {
        switch ($event.Action) {
            case "edit": {
                this.SelectedPrintTemplate = $event.Data;
                this.ShowAddNewPrintTemplate = true;
                this.IsAddMode = false;
                break;
            }
            case "activateDeactivateBasedOnStatus": {
                this.ActivateDeactivatePrintTemplate($event.Data);
                break;
            }
            default:
                break;
        }
    }

    CallbackAddUpdatePrintTemplate($event): void {
        this.SelectedPrintTemplate = new PrintTemplateSettings_DTO();
        if ($event && $event.action === "close") {
            this.ShowAddNewPrintTemplate = false;
        }
        if ($event && $event.success === true) {
            this.GetAllPrintTemplates();
        }
    }

    ActivateDeactivatePrintTemplate(selectedPrintTemplate: PrintTemplateSettings_DTO): void {
        if (selectedPrintTemplate && selectedPrintTemplate.PrintTemplateSettingsId) {
            this._settingsBlService.ActivateDeactivatePrintTemplate(selectedPrintTemplate.PrintTemplateSettingsId).subscribe((res: DanpheHTTPResponse) => {
                if (res.Status === ENUM_DanpheHTTPResponses.OK) {
                    if (res.Results) {
                        this._msgBoxService.showMessage(ENUM_MessageBox_Status.Success, [`Print Template is successfully activated`]);
                    } else {
                        this._msgBoxService.showMessage(ENUM_MessageBox_Status.Success, [`Print Template is successfully deactivated`]);
                    }
                    this.GetAllPrintTemplates();
                } else {

                }
            }, err => {
                console.error(err);
                this._msgBoxService.showMessage(ENUM_MessageBox_Status.Error, [err]);
            });
        }
    }
}