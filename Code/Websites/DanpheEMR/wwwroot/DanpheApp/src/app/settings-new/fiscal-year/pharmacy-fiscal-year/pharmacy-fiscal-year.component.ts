import { Component } from '@angular/core';
import * as moment from 'moment';

import { SecurityService } from '../../../security/shared/security.service';
import { DanpheHTTPResponse } from '../../../shared/common-models';
import { NepaliDateInGridColumnDetail, NepaliDateInGridParams } from '../../../shared/danphe-grid/NepaliColGridSettingsModel';
import { MessageboxService } from '../../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponses, ENUM_DateTimeFormat, ENUM_MessageBox_Status } from '../../../shared/shared-enums';
import { PharmacyFiscalYear_DTO } from '../../shared/DTOs/Pharmacy-fiscal-year.dto';
import { SettingsService } from '../../shared/settings-service';
import { SettingsBLService } from '../../shared/settings.bl.service';

@Component({
  selector: 'app-pharmacy-fiscal-year',
  templateUrl: './pharmacy-fiscal-year.component.html',

})
export class PharmacyFiscalYearComponent {
  PharmacyFiscalYearList = new Array<PharmacyFiscalYear_DTO>();
  PharmacyFiscalYearData = new PharmacyFiscalYear_DTO();
  PharmacyFiscalYearListGridCols: typeof SettingsService.prototype.settingsGridCols.PharmacyFiscalYearGridCols;
  public NepaliDateInGridSettings: NepaliDateInGridParams = new NepaliDateInGridParams();
  public ShowAddFiscalYearPage: boolean = false;
  constructor(
    private _settingsService: SettingsService,
    private _settingsBLService: SettingsBLService,
    private messageBoxService: MessageboxService,
    public _securityService: SecurityService,

  ) {
    this.PharmacyFiscalYearListGridCols = this._settingsService.settingsGridCols.PharmacyFiscalYearGridCols;
    this.NepaliDateInGridSettings.NepaliDateColumnList.push(new NepaliDateInGridColumnDetail('StartDate', true));
    this.NepaliDateInGridSettings.NepaliDateColumnList.push(new NepaliDateInGridColumnDetail('EndDate', true));
    this.GetPharmacyFiscalyear();
  }

  ngOnInit() {
    this.PharmacyFiscalYearData.StartDate = moment().format(ENUM_DateTimeFormat.Year_Month_Day);
    this.PharmacyFiscalYearData.EndDate = moment().format(ENUM_DateTimeFormat.Year_Month_Day);
  }

  GetPharmacyFiscalyear() {
    this._settingsBLService.GetPharmacyFiscalyear()
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this.PharmacyFiscalYearList = res.Results;
        }
        else {
          this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ["Failed to get Pharmacy fiscal year list "]);
        }
      });
  }
  AddFiscalYear() {
    if (!this.PharmacyFiscalYearData.StartDate) {
      this.PharmacyFiscalYearData.StartDate = moment().format(ENUM_DateTimeFormat.Year_Month_Day);
      this.PharmacyFiscalYearData.PharmacyYearGroup.get('StartDate').setValue(this.PharmacyFiscalYearData.StartDate);
    }
    if (!this.PharmacyFiscalYearData.EndDate) {
      this.PharmacyFiscalYearData.EndDate = moment().format(ENUM_DateTimeFormat.Year_Month_Day);
      this.PharmacyFiscalYearData.PharmacyYearGroup.get('EndDate').setValue(this.PharmacyFiscalYearData.EndDate);
    }
    if (this.PharmacyFiscalYearData.StartDate === this.PharmacyFiscalYearData.EndDate) {
      alert('Start Date and End Date cannot be the same.');
      return;
    }
    const startYear = moment(this.PharmacyFiscalYearData.StartDate).year();
    const endYear = moment(this.PharmacyFiscalYearData.EndDate).year();


    if (startYear === endYear) {
      alert('Start Date and End Date cannot be in the same year.');
      return;
    }
    for (let i in this.PharmacyFiscalYearData.PharmacyYearGroup.controls) {
      this.PharmacyFiscalYearData.PharmacyYearGroup.controls[i].markAsDirty();
      this.PharmacyFiscalYearData.PharmacyYearGroup.controls[i].updateValueAndValidity();
    }
    console.log(this.PharmacyFiscalYearData.StartDate);
    if (this.PharmacyFiscalYearData.IsValidCheck(undefined, undefined)) {
      let AddPharmacyYear = this.PharmacyFiscalYearData.PharmacyYearGroup.value;
      this._settingsBLService.AddPharmacyFiscalyear(AddPharmacyYear)
        .subscribe(
          (res: DanpheHTTPResponse) => {
            if (res.Status === ENUM_DanpheHTTPResponses.OK) {
              this.messageBoxService.showMessage(ENUM_MessageBox_Status.Success, ["Added successfully."]);
              this.GetPharmacyFiscalyear();
              this.PharmacyFiscalYearData = new PharmacyFiscalYear_DTO();
              this.PharmacyFiscalYearData.StartDate = moment().format(ENUM_DateTimeFormat.Year_Month_Day);
              this.PharmacyFiscalYearData.EndDate = moment().format(ENUM_DateTimeFormat.Year_Month_Day);
              this.PharmacyFiscalYearData.PharmacyYearGroup.controls['FiscalYearName'].setValue(null);
              this.PharmacyFiscalYearData.PharmacyYearGroup.get('StartDate').setValue(res.Results.StartDate);
              this.PharmacyFiscalYearData.PharmacyYearGroup.get('EndDate').setValue(res.Results.EndDate);
            } else {
              this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, [res.ErrorMessage]);
              this.PharmacyFiscalYearData.PharmacyYearGroup.reset();
            }
          },
          (error) => {

            this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, [" failed: " + error.message]);
            this.PharmacyFiscalYearData.PharmacyYearGroup.reset();
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
    this.PharmacyFiscalYearData.PharmacyYearGroup.reset();
  }

}
