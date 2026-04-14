import { Component } from '@angular/core';
import * as moment from 'moment';
import { SecurityService } from '../../../security/shared/security.service';
import { DanpheHTTPResponse } from '../../../shared/common-models';
import { NepaliDateInGridColumnDetail, NepaliDateInGridParams } from '../../../shared/danphe-grid/NepaliColGridSettingsModel';
import { MessageboxService } from '../../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponses, ENUM_DateTimeFormat, ENUM_MessageBox_Status } from '../../../shared/shared-enums';
import { ACC_Hospital } from '../../shared/DTOs/Acc_Hospital.dto';
import { AccountFiscalYear } from '../../shared/DTOs/Account-fiscal-year.dto';
import { SettingsService } from '../../shared/settings-service';
import { SettingsBLService } from '../../shared/settings.bl.service';

@Component({
  selector: 'app-accounting-fiscal-year',
  templateUrl: './accounting-fiscal-year.component.html',
})
export class AccountingFiscalYearComponent {
  AccountFiscalYearList = new Array<AccountFiscalYear>();
  HospitalData = new ACC_Hospital();
  AccountFiscalYearData = new AccountFiscalYear();
  AccountFiscalYearListGridCols: typeof SettingsService.prototype.settingsGridCols.AccountFiscalYearGridCols;
  public NepaliDateInGridSettings: NepaliDateInGridParams = new NepaliDateInGridParams();
  public ShowAddFiscalYearPage: boolean = false;

  constructor(
    private _settingsService: SettingsService,
    private _settingsBLService: SettingsBLService,
    private messageBoxService: MessageboxService,
    public _securityService: SecurityService,
  ) {
    this.AccountFiscalYearListGridCols = this._settingsService.settingsGridCols.AccountFiscalYearGridCols;
    this.NepaliDateInGridSettings.NepaliDateColumnList.push(new NepaliDateInGridColumnDetail('StartDate', true));
    this.NepaliDateInGridSettings.NepaliDateColumnList.push(new NepaliDateInGridColumnDetail('EndDate', true));
    this.GetAccountFiscalyear();
    this.GetHospitalAccount();
  }
  GetHospitalAccount() {
    this._settingsBLService.GetHospitalAccount()
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this.HospitalData = res.Results;
        }
        else {
          this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ["Failed to get Account Hospital info  "]);
        }
      });
  }



  ngOnInit() {
    this.AccountFiscalYearData.StartDate = moment().format(ENUM_DateTimeFormat.Year_Month_Day);
    this.AccountFiscalYearData.EndDate = moment().format(ENUM_DateTimeFormat.Year_Month_Day);
  }

  GetAccountFiscalyear() {
    this._settingsBLService.GetAccountFiscalyear()
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this.AccountFiscalYearList = res.Results;
        }
        else {
          this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ["Failed to get Account fiscal year list "]);
        }
      });
  }

  AddFiscalYear() {
    if (!this.AccountFiscalYearData.StartDate) {
      this.AccountFiscalYearData.StartDate = moment().format(ENUM_DateTimeFormat.Year_Month_Day);
      this.AccountFiscalYearData.AccountFiscalYearGroup.get('StartYear').setValue(this.AccountFiscalYearData.StartDate);
    }
    if (!this.AccountFiscalYearData.EndDate) {
      this.AccountFiscalYearData.EndDate = moment().format(ENUM_DateTimeFormat.Year_Month_Day);
      this.AccountFiscalYearData.AccountFiscalYearGroup.get('EndYear').setValue(this.AccountFiscalYearData.EndDate);
    }
    if (this.AccountFiscalYearData.StartDate === this.AccountFiscalYearData.EndDate) {
      alert('Start Date and End Date cannot be the same.');
      return;
    }
    const startYear = moment(this.AccountFiscalYearData.StartDate).year();
    const endYear = moment(this.AccountFiscalYearData.EndDate).year();


    if (startYear === endYear) {
      alert('Start Date and End Date cannot be in the same year.');
      return;
    }
    for (let i in this.AccountFiscalYearData.AccountFiscalYearGroup.controls) {
      this.AccountFiscalYearData.AccountFiscalYearGroup.controls[i].markAsDirty();
      this.AccountFiscalYearData.AccountFiscalYearGroup.controls[i].updateValueAndValidity();
    }

    if (this.AccountFiscalYearData.IsValidCheck(undefined, undefined)) {
      let AddAccountingYear = this.AccountFiscalYearData.AccountFiscalYearGroup.value;
      this._settingsBLService.AddAccountFiscalyear(AddAccountingYear)
        .subscribe(
          (res: DanpheHTTPResponse) => {
            if (res.Status === ENUM_DanpheHTTPResponses.OK) {
              this.messageBoxService.showMessage(ENUM_MessageBox_Status.Success, ["Added successfully."]);
              this.GetAccountFiscalyear();
              this.AccountFiscalYearData = new AccountFiscalYear();
              this.AccountFiscalYearData.StartDate = moment().format(ENUM_DateTimeFormat.Year_Month_Day);
              this.AccountFiscalYearData.EndDate = moment().format(ENUM_DateTimeFormat.Year_Month_Day);
              this.AccountFiscalYearData.AccountFiscalYearGroup.controls['FiscalYearName'].setValue(null);
              this.AccountFiscalYearData.AccountFiscalYearGroup.controls['HospitalId'].setValue(null);
              this.AccountFiscalYearData.AccountFiscalYearGroup.get('StartDate').setValue(res.Results.StartDate);
              this.AccountFiscalYearData.AccountFiscalYearGroup.get('EndDate').setValue(res.Results.EndDate);

            } else {
              this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, [res.ErrorMessage]);
              this.AccountFiscalYearData.AccountFiscalYearGroup.reset();
            }
          },
          (error) => {

            this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, [" failed: " + error.message]);
            this.AccountFiscalYearData.AccountFiscalYearGroup.reset();
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
    this.AccountFiscalYearData.AccountFiscalYearGroup.reset();
  }
}
