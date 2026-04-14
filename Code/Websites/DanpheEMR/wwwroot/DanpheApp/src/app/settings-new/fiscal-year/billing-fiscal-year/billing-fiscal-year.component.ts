import { Component } from '@angular/core';
import * as moment from 'moment';
import { CoreService } from '../../../core/shared/core.service';
import { SecurityService } from '../../../security/shared/security.service';
import { DanpheHTTPResponse } from '../../../shared/common-models';
import { NepaliDateInGridColumnDetail, NepaliDateInGridParams } from '../../../shared/danphe-grid/NepaliColGridSettingsModel';
import { SettingsGridColumnSettings } from '../../../shared/danphe-grid/settings-grid-column-settings';
import { MessageboxService } from '../../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponses, ENUM_DateTimeFormat, ENUM_MessageBox_Status } from '../../../shared/shared-enums';
import { BillFiscalYear } from '../../shared/DTOs/Bill-fiscal-year.dto';
import { SettingsService } from '../../shared/settings-service';
import { SettingsBLService } from '../../shared/settings.bl.service';

@Component({
  selector: 'app-billing-fiscal-year',
  templateUrl: './billing-fiscal-year.component.html',

})
export class BillingFiscalYearComponent {
  BillFiscalYearList = new Array<BillFiscalYear>();
  BillFiscalYearData = new BillFiscalYear();
  SetBillFiscalYearColumns: SettingsGridColumnSettings = null;
  public NepaliDateInGridSettings: NepaliDateInGridParams = new NepaliDateInGridParams();
  BillingFiscalYearListGridCols: typeof SettingsService.prototype.settingsGridCols.BillFiscalYearGridCols;
  public ShowAddFiscalYearPage: boolean = false;
  constructor(
    private _settingsService: SettingsService,
    private _settingsBLService: SettingsBLService,
    private messageBoxService: MessageboxService,
    private coreService: CoreService,
    public _securityService: SecurityService,
  ) {
    this.BillingFiscalYearListGridCols = this._settingsService.settingsGridCols.BillFiscalYearGridCols;
    this.NepaliDateInGridSettings.NepaliDateColumnList.push(new NepaliDateInGridColumnDetail('StartYear', true));
    this.NepaliDateInGridSettings.NepaliDateColumnList.push(new NepaliDateInGridColumnDetail('EndYear', true));
    this.GetBillFiscalyear();
  }

  ngOnInit() {
    this.BillFiscalYearData.StartYear = moment().format(ENUM_DateTimeFormat.Year_Month_Day);
    this.BillFiscalYearData.EndYear = moment().format(ENUM_DateTimeFormat.Year_Month_Day);
  }
  GetBillFiscalyear() {
    this._settingsBLService.GetBillFiscalyear()
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this.BillFiscalYearList = res.Results;
        }
        else {
          this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ["Failed to get billing fiscal year list "]);
        }
      });
  }

  AddFiscalYear() {
    if (!this.BillFiscalYearData.StartYear) {
      this.BillFiscalYearData.StartYear = moment().format(ENUM_DateTimeFormat.Year_Month_Day);
      this.BillFiscalYearData.BillFiscalYearGroup.get('StartYear').setValue(this.BillFiscalYearData.StartYear);
    }
    if (!this.BillFiscalYearData.EndYear) {
      this.BillFiscalYearData.EndYear = moment().format(ENUM_DateTimeFormat.Year_Month_Day);
      this.BillFiscalYearData.BillFiscalYearGroup.get('EndYear').setValue(this.BillFiscalYearData.EndYear);
    }
    if (this.BillFiscalYearData.StartYear === this.BillFiscalYearData.EndYear) {
      alert('Start Date and End Date cannot be the same.');
      return;
    }
    const startYear = moment(this.BillFiscalYearData.StartYear).year();
    const endYear = moment(this.BillFiscalYearData.EndYear).year();


    if (startYear === endYear) {
      alert('Start Date and End Date cannot be in the same year.');
      return;
    }
    for (let i in this.BillFiscalYearData.BillFiscalYearGroup.controls) {
      this.BillFiscalYearData.BillFiscalYearGroup.controls[i].markAsDirty();
      this.BillFiscalYearData.BillFiscalYearGroup.controls[i].updateValueAndValidity();
    }

    if (this.BillFiscalYearData.IsValidCheck(undefined, undefined)) {
      let AddBillingYear = this.BillFiscalYearData.BillFiscalYearGroup.value;
      this._settingsBLService.AddBillFiscalyear(AddBillingYear)
        .subscribe(
          (res: DanpheHTTPResponse) => {
            if (res.Status === ENUM_DanpheHTTPResponses.OK) {
              this.messageBoxService.showMessage(ENUM_MessageBox_Status.Success, ["Added successfully."]);
              this.GetBillFiscalyear();
              this.BillFiscalYearData = new BillFiscalYear();

              this.BillFiscalYearData.BillFiscalYearGroup.get('StartYear').setValue(res.Results.StartYear);
              this.BillFiscalYearData.StartYear = moment().format(ENUM_DateTimeFormat.Year_Month_Day);
              this.BillFiscalYearData.EndYear = moment().format(ENUM_DateTimeFormat.Year_Month_Day);
              this.BillFiscalYearData.BillFiscalYearGroup.controls['FiscalYearName'].setValue(null);
              this.BillFiscalYearData.BillFiscalYearGroup.get('StartYear').setValue(res.Results.StartYear);
              this.BillFiscalYearData.BillFiscalYearGroup.get('EndYear').setValue(res.Results.EndYear);
            } else {
              this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, [res.ErrorMessage]);
              this.BillFiscalYearData.BillFiscalYearGroup.reset();
            }
          },
          (error) => {

            this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, [" failed: " + error.message]);
            this.BillFiscalYearData.BillFiscalYearGroup.reset();
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
    this.BillFiscalYearData.BillFiscalYearGroup.reset();
  }
}
