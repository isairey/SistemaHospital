import { Component, OnInit } from '@angular/core';
import * as moment from 'moment';
import { DanpheHTTPResponse } from '../../../shared/common-models';
import { NepaliDateInGridColumnDetail, NepaliDateInGridParams } from '../../../shared/danphe-grid/NepaliColGridSettingsModel';
import { MessageboxService } from '../../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponses, ENUM_DateTimeFormat, ENUM_MessageBox_Status } from '../../../shared/shared-enums';
import { INVFiscalYear } from '../../shared/DTOs/INV-fiscal-year.dto';
import { SettingsService } from '../../shared/settings-service';
import { SettingsBLService } from '../../shared/settings.bl.service';

@Component({
  selector: 'app-inventory-fiscal-year',
  templateUrl: './inventory-fiscal-year.component.html',
})
export class InventoryFiscalYearComponent implements OnInit {
  INVFiscalYearList = new Array<INVFiscalYear>();
  INVFiscalYearData = new INVFiscalYear();

  InventoryFiscalYearListGridCols: typeof SettingsService.prototype.settingsGridCols.InventoryFiscalYearGridCols;
  public NepaliDateInGridSettings: NepaliDateInGridParams = new NepaliDateInGridParams();
  public ShowAddFiscalYearPage: boolean = false;

  constructor(
    private _settingsService: SettingsService,
    private _settingsBLService: SettingsBLService,
    private messageBoxService: MessageboxService,

  ) {
    this.InventoryFiscalYearListGridCols = this._settingsService.settingsGridCols.InventoryFiscalYearGridCols;
    this.NepaliDateInGridSettings.NepaliDateColumnList.push(new NepaliDateInGridColumnDetail('StartDate', true));
    this.NepaliDateInGridSettings.NepaliDateColumnList.push(new NepaliDateInGridColumnDetail('EndDate', true));
    this.GetInvFiscalyear();
  }

  ngOnInit() {
    this.INVFiscalYearData.StartDate = moment().format(ENUM_DateTimeFormat.Year_Month_Day);
    this.INVFiscalYearData.EndDate = moment().format(ENUM_DateTimeFormat.Year_Month_Day);
  }
  GetInvFiscalyear() {
    this._settingsBLService.GetInventoryFiscalYear()
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this.INVFiscalYearList = res.Results;
        }
        else {
          this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ["Failed to get Inventory fiscal year list "]);
        }
      });
  }

  AddFiscalYear() {
    if (!this.INVFiscalYearData.StartDate) {
      this.INVFiscalYearData.StartDate = moment().format(ENUM_DateTimeFormat.Year_Month_Day);
      this.INVFiscalYearData.INVFiscalYearGroup.get('StartDate').setValue(this.INVFiscalYearData.StartDate);
    }
    if (!this.INVFiscalYearData.EndDate) {
      this.INVFiscalYearData.EndDate = moment().format(ENUM_DateTimeFormat.Year_Month_Day);
      this.INVFiscalYearData.INVFiscalYearGroup.get('EndDate').setValue(this.INVFiscalYearData.EndDate);
    }
    if (this.INVFiscalYearData.StartDate === this.INVFiscalYearData.EndDate) {
      alert('Start Date and End Date cannot be the same.');
      return;
    }
    const startYear = moment(this.INVFiscalYearData.StartDate).year();
    const endYear = moment(this.INVFiscalYearData.EndDate).year();


    if (startYear === endYear) {
      alert('Start Date and End Date cannot be in the same year.');
      return;
    }
    for (let i in this.INVFiscalYearData.INVFiscalYearGroup.controls) {
      this.INVFiscalYearData.INVFiscalYearGroup.controls[i].markAsDirty();
      this.INVFiscalYearData.INVFiscalYearGroup.controls[i].updateValueAndValidity();
    }
    console.log(this.INVFiscalYearData.StartDate);
    if (this.INVFiscalYearData.IsValidCheck(undefined, undefined)) {
      let AddInentoryYear = this.INVFiscalYearData.INVFiscalYearGroup.value;
      this._settingsBLService.AddINVFiscalyear(AddInentoryYear)
        .subscribe(
          (res: DanpheHTTPResponse) => {
            if (res.Status === ENUM_DanpheHTTPResponses.OK) {
              this.messageBoxService.showMessage(ENUM_MessageBox_Status.Success, ["Added successfully."]);
              this.GetInvFiscalyear();
              this.INVFiscalYearData = new INVFiscalYear();
              this.INVFiscalYearData.INVFiscalYearGroup.get('StartDate').setValue(res.Results.StartDate);
              this.INVFiscalYearData.StartDate = moment().format(ENUM_DateTimeFormat.Year_Month_Day);
              this.INVFiscalYearData.EndDate = moment().format(ENUM_DateTimeFormat.Year_Month_Day);
              this.INVFiscalYearData.INVFiscalYearGroup.controls['FiscalYearName'].setValue(null);
              this.INVFiscalYearData.INVFiscalYearGroup.get('StartDate').setValue(res.Results.StartDate);
              this.INVFiscalYearData.INVFiscalYearGroup.get('EndDate').setValue(res.Results.EndDate);
            } else {
              this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, [res.ErrorMessage]);
              this.INVFiscalYearData.INVFiscalYearGroup.reset();
            }
          },
          (error) => {

            this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, [" failed: " + error.message]);
            this.INVFiscalYearData.INVFiscalYearGroup.reset();
          }
        );
    } else {
      this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ["Mandotory fields are required.. "]);

    }

  }
  AddNewFiscalYearPage() {
    this.ShowAddFiscalYearPage = true;
  }
  Close() {
    this.ShowAddFiscalYearPage = false;
  }
  Clear() {
    this.INVFiscalYearData.INVFiscalYearGroup.reset();
  }

}
