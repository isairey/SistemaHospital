import { Component } from '@angular/core';
import { CoreService } from '../../../core/shared/core.service';
import { DanpheHTTPResponse } from '../../../shared/common-models';
import { SettingsGridColumnSettings } from '../../../shared/danphe-grid/settings-grid-column-settings';
import { MessageboxService } from '../../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponseText, ENUM_MessageBox_Status } from '../../../shared/shared-enums';
import { Salutation } from '../../shared/DTOs/Salutation.Model';
import { SettingsService } from '../../shared/settings-service';
import { SettingsBLService } from '../../shared/settings.bl.service';

@Component({
  selector: 'app-emp-salutation',
  templateUrl: './emp-salutation.component.html',
  styleUrls: ['./emp-salutation.component.css']
})
export class EmpSalutationComponent {
  SalutationGridList: Array<Salutation> = new Array<Salutation>();
  CurrentSalutation = new Salutation();
  SelectedSalutationData = new Salutation();
  SalutationGridColumns: typeof SettingsGridColumnSettings.prototype.EmployeeSalutation;
  ShowAddPage: boolean = false;
  IsUpdate: boolean = false;
  RowData = new Salutation();
  constructor(
    private _settingsServ: SettingsService,

    private _messageBoxService: MessageboxService,
    private settingsBLService: SettingsBLService,
    private _coreService: CoreService

  ) {
    this.SalutationGridColumns = this._settingsServ.settingsGridCols.EmployeeSalutation;

    this.SalutationGridList = this._coreService.SalutationData;

  }


  AddEmployeeSalutation() {
    this.ShowAddPage = true;
    this.CurrentSalutation = new Salutation();
  }
  EmpSalutationGridAction(event) {
    switch (event.Action) {
      case "edit": {
        this.RowData = event.Data;
        this.CurrentSalutation = new Salutation();
        this.CurrentSalutation.SalutationName = this.RowData.SalutationName;
        this.CurrentSalutation.SalutationId = this.RowData.SalutationId;
        this.CurrentSalutation.IsActive = this.RowData.IsActive;
        this.CurrentSalutation.IsApplicableForPatients = this.RowData.IsApplicableForPatients;
        this.IsUpdate = true;
        this.ShowAddPage = true;
        break;
      }
      case "activateDeactivateBasedOnStatus": {
        if (event.Data != null) {
          this.RowData = event.Data;
          this.ActivateDeactivateStatus(this.RowData);
          this.RowData = null;
        }
        break;

      }
      default:
        break;
    }

  }

  Add() {
    if (this.CurrentSalutation.SalutationName) {

      this.settingsBLService.AddSalutation(this.CurrentSalutation)
        .subscribe((res: DanpheHTTPResponse) => {
          if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
            this._messageBoxService.showMessage(ENUM_MessageBox_Status.Success, [`Salutation Added Successfully.`]);
            this.Close();
            this.SalutationGridList = [...this.SalutationGridList, res.Results];
            this._coreService.AddSalutationData(res.Results);

          } else {
            this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [res.ErrorMessage]);
            this.logError(res.ErrorMessage)
          }

        },
          (err: any) => { // Explicitly typing err
            let errorMessage = 'An unexpected error occurred.';

            if (err && err.error && Array.isArray(err.error.Messages) && err.error.Messages.length > 0) {
              errorMessage = err.error.Messages[0]; // Extract first error message
            }

            this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [errorMessage]);
            this.logError(errorMessage);
          });
    }
    else {
      this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`Please fill all mandatory fields.`]);
    }

  }
  Update() {
    if (this.CurrentSalutation.SalutationId && this.CurrentSalutation.SalutationName) {
      this.settingsBLService.UpdateSalutation(this.CurrentSalutation)
        .subscribe((res: DanpheHTTPResponse) => {
          if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
            this._messageBoxService.showMessage(ENUM_MessageBox_Status.Success, [`Salutation is Updated`]);
            this.Close();
            this.SalutationGridList = this.SalutationGridList.map(salutation =>
              salutation.SalutationId === res.Results.SalutationId ? res.Results : salutation
            );
            this._coreService.UpdateSalutationData(res.Results);
          } else {
            this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [res.ErrorMessage]);
            this.logError(res.ErrorMessage)
          }

        },
          (err: any) => { // Explicitly typing err
            let errorMessage = 'An unexpected error occurred.';

            if (err && err.error && Array.isArray(err.error.Messages) && err.error.Messages.length > 0) {
              errorMessage = err.error.Messages[0]; // Extract first error message
            }

            this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [errorMessage]);
            this.logError(errorMessage);
          }

        );
    }
    else {
      this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`Please fill all mandatory fields.`]);
    }
  }
  showMessageBox(status: string, message: string) {
    this._messageBoxService.showMessage(status, [message]);
  }
  ActivateDeactivateStatus(currentSalutation: Salutation) {
    if (currentSalutation != null) {
      this.SelectedSalutationData.SalutationId = currentSalutation.SalutationId;
      if (confirm("Are you Sure want to Deactivate " + currentSalutation.SalutationName + ' ?')) {
        this.ChangeActiveStatus(this.SelectedSalutationData.SalutationId);
      }
    }

  }


  ChangeActiveStatus(selectedId) {
    this.settingsBLService.ActivateDeactivateSalutation(selectedId)
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
          this.SalutationGridList = this.SalutationGridList.map(salutation =>
            salutation.SalutationId === res.Results.SalutationId ? res.Results : salutation
          );
          this._coreService.UpdateSalutationData(res.Results);
          let responseMessage = res.Results.IsActive ? "Salutation is now Activated." : "Salutation is now Deactivated.";
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Success, [responseMessage]);

        }
        else {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, ['Something went wrong' + res.ErrorMessage]);
        }
      },
        (err: any) => {
          let errorMessage = 'An unexpected error occurred.';

          if (err && err.error && Array.isArray(err.error.Messages) && err.error.Messages.length > 0) {
            errorMessage = err.error.Messages[0];
          }

          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [errorMessage]);
          this.logError(errorMessage);
        }

      );

  }
  Close() {
    this.IsUpdate = false;
    this.ShowAddPage = false;
    this.CurrentSalutation = null;
  }
  logError(err: any) {
    console.log(err);
  }

}
