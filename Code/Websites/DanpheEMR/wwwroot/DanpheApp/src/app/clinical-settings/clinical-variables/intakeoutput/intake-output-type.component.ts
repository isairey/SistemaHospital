import { Component } from "@angular/core";
import { IntakeOutputParameterListModel } from "../../../clinical/shared/intake-output-parameterlist.model";
import { SettingsService } from "../../../settings-new/shared/settings-service";
import { DanpheHTTPResponse } from "../../../shared/common-models";
import { GridEmitModel } from "../../../shared/danphe-grid/grid-emit.model";
import { SettingsGridColumnSettings } from "../../../shared/danphe-grid/settings-grid-column-settings";
import { IntakeOutputVariableModel } from "../../../shared/intake-output-variable.model";
import { MessageboxService } from "../../../shared/messagebox/messagebox.service";
import { ENUM_DanpheHTTPResponseText, ENUM_MessageBox_Status } from "../../../shared/shared-enums";
import { ClinicalSettingsBLService } from "../../shared/clinical-settings.bl.service";
@Component({
    selector: "intake-output-list",
    templateUrl: "intake-output-type.component.html"
})

export class IntakeOutputTypeListComponent {

    IntakeOutputTypeList = new Array<IntakeOutputParameterListModel>();
    ShowGrid: boolean = false;
    ShowAddPage: boolean = false;
    IntakeOutputGridColumns: typeof SettingsGridColumnSettings.prototype.IntakeOutputList;
    IntakeOutputTypeListForGrid = new Array<IntakeOutputVariableModel>();
    intakeOutputData = new Array<IntakeOutputVariableModel>();
    RowData = new IntakeOutputVariableModel();
    IsUpdate: boolean = false;
    SelectedIntakeOutputData: { intakeOutputId: number, isActive: boolean } = { intakeOutputId: 0, isActive: false };



    constructor(
        private _clnSettingsBLService: ClinicalSettingsBLService,
        private _messageBoxService: MessageboxService,
        private _settingsServ: SettingsService,
    ) {
        this.IntakeOutputGridColumns = this._settingsServ.settingsGridCols.IntakeOutputList;
        this.GetClinicalIntakeOutputParameterList();

    }

    AddIntakeOutput() {
        this.ShowAddPage = true;
    }

    GetClinicalIntakeOutputParameterList() {
        this._clnSettingsBLService.GetIntakeOutputTypeListForGrid()
            .subscribe((res: DanpheHTTPResponse) => {
                if (res.Status === ENUM_DanpheHTTPResponseText.OK) {

                    this.IntakeOutputTypeListForGrid = res.Results;
                    this.intakeOutputData = this.IntakeOutputTypeListForGrid.map(item => {
                        if (item.ParentParameterValue === null || item.ParentParameterValue === undefined) {
                            item.ParentParameterValue = "N/A";
                        }
                        return item;
                    });
                }
                else {
                    this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ["Failed to get Data"], res.ErrorMessage);
                }
            });
    }


    IntakeOutputGridActions(event: GridEmitModel) {
        switch (event.Action) {
            case "edit": {
                this.RowData = event.Data;
                this.IsUpdate = true;
                this.ShowAddPage = true;
                break;
            }
            case "activateDeactivateBasedOnStatus": {
                if (event.Data != null) {
                    this.RowData = event.Data;
                    this.ActivateDeactivateReagentStatus(this.RowData);
                    this.RowData = null;
                }
                break;

            }
            default:
                break;
        }
    }
    ActivateDeactivateReagentStatus(currIntakeOutputparameter: IntakeOutputVariableModel) {
        if (currIntakeOutputparameter != null) {
            let status = currIntakeOutputparameter.IsActive === true ? false : true;
            this.SelectedIntakeOutputData.intakeOutputId = currIntakeOutputparameter.IntakeOutputId;
            this.SelectedIntakeOutputData.isActive = status;
            if (status === true) {
                currIntakeOutputparameter.IsActive = status;
                this.ChangeActiveStatus(this.SelectedIntakeOutputData.intakeOutputId);
            } else {
                if (confirm("Are you Sure want to Deactivate " + currIntakeOutputparameter.ParameterValue + ' ?')) {
                    currIntakeOutputparameter.IsActive = status;
                    this.ChangeActiveStatus(this.SelectedIntakeOutputData.intakeOutputId);
                }
            }
        }

    }


    ChangeActiveStatus(selectedIntakeOutputDataId) {
        this._clnSettingsBLService.ActivateDeactivateVariableStatus(selectedIntakeOutputDataId)
            .subscribe((res: DanpheHTTPResponse) => {
                if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
                    this.GetClinicalIntakeOutputParameterList();
                    let responseMessage = res.Results.IsActive ? "Variable is now Activated." : "Variable is now Deactivated.";
                    this._messageBoxService.showMessage(ENUM_MessageBox_Status.Success, [responseMessage]);

                }
                else {
                    this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, ['Something went wrong' + res.ErrorMessage]);
                }
            },
                err => {
                    this._messageBoxService.showMessage(ENUM_MessageBox_Status.Success, [err]);
                });

    }
    CallBackAdd() {
        this.ShowAddPage = false;
        this.IsUpdate = false;
        this.GetClinicalIntakeOutputParameterList();
    }
}
