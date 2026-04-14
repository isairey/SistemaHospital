import { Component } from '@angular/core';
import { SettingsService } from '../../../settings-new/shared/settings-service';
import { DanpheHTTPResponse } from '../../../shared/common-models';
import { SettingsGridColumnSettings } from '../../../shared/danphe-grid/settings-grid-column-settings';
import { MessageboxService } from '../../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponseText, ENUM_MessageBox_Status } from '../../../shared/shared-enums';
import { ClinicalSettingsBLService } from '../../shared/clinical-settings.bl.service';
import { IntakeTime } from '../../shared/dto/intake-time.dto';

@Component({
  selector: 'app-intake-timing',
  templateUrl: './intake-timing.component.html',
  styleUrls: ['./intake-timing.component.css']
})
export class IntakeTimingComponent {
  IntakeTimeList = new Array<IntakeTime>();
  IntakeTimingGridColumns: typeof SettingsGridColumnSettings.prototype.IntakeTimingList;
  RowData = new IntakeTime();
  SelectedIntakeTimingData: { MedicationIntakeId: number, isActive: boolean } = { MedicationIntakeId: 0, isActive: false };
  ShowAddPage: boolean = false;
  IsUpdate: boolean = false;
  CurrentIntakeTime = new IntakeTime();

  constructor(
    private _clnSettingsBLService: ClinicalSettingsBLService,
    private _messageBoxService: MessageboxService,
    private _settingsServ: SettingsService,
  ) {
    this.IntakeTimingGridColumns = this._settingsServ.settingsGridCols.IntakeTimingList;
    this.GetClinicalIntakeTimingList();
  }


  GetClinicalIntakeTimingList() {
    this._clnSettingsBLService.GetIntakeTimingList()
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
          this.IntakeTimeList = res.Results;
        }
        else {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ["Failed to get Data"], res.ErrorMessage);
        }
      });
  }

  IntakeOutputGridActions(event) {
    switch (event.Action) {
      case "edit": {
        this.RowData = event.Data;
        this.CurrentIntakeTime = new IntakeTime();
        this.IsUpdate = true;
        this.CurrentIntakeTime.IntakeCode = this.RowData.IntakeCode;
        this.CurrentIntakeTime.IntakeDisplayName = this.RowData.IntakeDisplayName;
        this.CurrentIntakeTime.IntakeNumber = this.RowData.IntakeNumber;
        this.CurrentIntakeTime.MedicationIntakeId = this.RowData.MedicationIntakeId;
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
  AddIntakeTiming() {
    this.ShowAddPage = true;
    this.CurrentIntakeTime = new IntakeTime();
  }

  ActivateDeactivateStatus(currIntakeTiming: IntakeTime) {
    if (currIntakeTiming != null) {
      this.SelectedIntakeTimingData.MedicationIntakeId = currIntakeTiming.MedicationIntakeId;
      if (confirm("Are you Sure want to Deactivate " + currIntakeTiming.IntakeDisplayName + ' ?')) {
        this.ChangeActiveStatus(this.SelectedIntakeTimingData.MedicationIntakeId);
      }
    }

  }


  ChangeActiveStatus(selectedIntakeTimingId) {
    this._clnSettingsBLService.ActivateDeactivateIntakeTimeStatus(selectedIntakeTimingId)
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
          this.GetClinicalIntakeTimingList();
          let responseMessage = res.Results.IsActive ? "IntakeTime is now Activated." : "IntakeTime is now Deactivated.";
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
  Add() {
    if (this.CurrentIntakeTime.IntakeCode && this.CurrentIntakeTime.IntakeDisplayName) {

      this._clnSettingsBLService.AddIntakeTime(this.CurrentIntakeTime)
        .subscribe((res: DanpheHTTPResponse) => {
          if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
            this._messageBoxService.showMessage(ENUM_MessageBox_Status.Success, [`IntakeTime Added Successfully.`]);
            this.Close();
            this.GetClinicalIntakeTimingList();
          } else {
            this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [res.ErrorMessage]);
            this.logError(res.ErrorMessage)
          }

        },
          err => {
            this.logError(err);
          });
    }
    else {
      this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`Please fill all mandatory fields.`]);
    }

  }
  Update() {
    if (this.CurrentIntakeTime.MedicationIntakeId && this.CurrentIntakeTime.IntakeCode && this.CurrentIntakeTime.IntakeDisplayName) {
      this._clnSettingsBLService.UpdateIntakeTime(this.CurrentIntakeTime)
        .subscribe((res: DanpheHTTPResponse) => {
          if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
            this._messageBoxService.showMessage(ENUM_MessageBox_Status.Success, [`IntakeTime Data Updated`]);
            this.Close();
            this.GetClinicalIntakeTimingList();
          } else {
            this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [res.ErrorMessage]);
            this.logError(res.ErrorMessage)
          }

        },
          err => {
            this.logError(err);
          });
    }
    else {
      this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`Please fill all mandatory fields.`]);
    }
  }
  Close() {
    this.IsUpdate = false;
    this.ShowAddPage = false;
    this.CurrentIntakeTime = null;
  }
  logError(err: any) {
    console.log(err);
  }

}
