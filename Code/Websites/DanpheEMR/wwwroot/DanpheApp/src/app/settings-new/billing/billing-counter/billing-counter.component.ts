import { Component, OnInit } from '@angular/core';
import { CoreService } from '../../../core/shared/core.service';
import { SecurityService } from '../../../security/shared/security.service';
import { User } from '../../../security/shared/user.model';
import { DanpheHTTPResponse } from '../../../shared/common-models';
import { SettingsGridColumnSettings } from '../../../shared/danphe-grid/settings-grid-column-settings';
import { MessageboxService } from '../../../shared/messagebox/messagebox.service';
import { ENUM_BillingCounterType, ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status } from '../../../shared/shared-enums';
import { SettingsBLService } from '../../shared/settings.bl.service';
import { Bill_Counter } from '../shared/dto/bill-counter.dto';



@Component({
  selector: 'app-billing-counter',
  templateUrl: './billing-counter.component.html',

})
export class BillingCounterComponent implements OnInit {

  BillingCounter = new Bill_Counter();
  BillinCounterList = new Array<Bill_Counter>();
  ShowAddNewPage: boolean = false;
  SetCLNHeadingGridColumns: SettingsGridColumnSettings = null;
  BillingCounterFieldGridCols: typeof SettingsGridColumnSettings.prototype.BillingCounterGridCols;
  CurrentUser: User = new User();
  IsAdmin: Boolean = false;
  SelectedCounter = new Bill_Counter();
  CounterId: number = 0;
  CounterTypes = Object.values(ENUM_BillingCounterType);
  constructor(
    private _settingsBLService: SettingsBLService,
    private messageBoxService: MessageboxService,
    private coreService: CoreService,
    public _securityService: SecurityService,
  ) {

    this.SetCLNHeadingGridColumns = new SettingsGridColumnSettings(this.coreService.taxLabel, this._securityService);
    this.BillingCounterFieldGridCols = this.SetCLNHeadingGridColumns.BillingCounterGridCols;
    this.GetBillingCounter();

    this.CurrentUser = this._securityService.GetLoggedInUser() as User;

    if (this.CurrentUser != null) {

      this.IsAdmin = this.CurrentUser.IsSystemAdmin;
    }
  }

  ngOnInit() {
  }
  GetBillingCounter() {
    this._settingsBLService.GetBillingCounter()
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this.BillinCounterList = res.Results;
        }
        else {
          this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ["Failed to get Billing Counter "]);
        }
      });
  }
  AddBillingCounter() {
    if (!this.IsAdmin) {
      this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ["Only Admin has permission"]);
      return;
    }
    for (let i in this.BillingCounter.BillCounterGroup.controls) {
      this.BillingCounter.BillCounterGroup.controls[i].markAsDirty();
      this.BillingCounter.BillCounterGroup.controls[
        i
      ].updateValueAndValidity();
    }

    const Beginning_Date_String = this.BillingCounter.BillCounterGroup.get('BeginningDate').value;
    const Closing_Date_String = this.BillingCounter.BillCounterGroup.get('ClosingDate').value;




    if (this.BillingCounter.IsValidCheck(undefined, undefined)) {
      let updatedValue = this.BillingCounter.BillCounterGroup.value;
      console.log("updateValue", updatedValue);
      this._settingsBLService.AddBillingCounter(updatedValue)
        .subscribe(
          (res: DanpheHTTPResponse) => {
            if (res.Status === ENUM_DanpheHTTPResponses.OK) {
              this.messageBoxService.showMessage(ENUM_MessageBox_Status.Success, ["Added successfully."]);
              this.GetBillingCounter();
              this.BillingCounter = new Bill_Counter();
              this.BillingCounter.BillCounterGroup.reset();
            } else {
              this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, [res.ErrorMessage]);
              this.BillingCounter.BillCounterGroup.reset();
            }
          },
          (error) => {

            this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ["Subscription failed: " + error.message]);
          }
        );
    } else {
      this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ["Mandotory fields are required.. "]);
    }
  }
  BillingCounterGridActions($event): void {
    switch ($event.Action) {
      case "activateDeactivateBasedOnStatus": {
        if (!this.IsAdmin) {
          this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ["Only Admin has permission"]);
          return;
        }
        this.SelectedCounter = $event.Data;
        this.ActivateDeactivateBillingCounter(this.SelectedCounter);
        break;
      }

      case "activateDeactivateBasedOnStatus": {
        if (!this.IsAdmin) {
          this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ["Only Admin has permission"]);
          return;
        }
        this.SelectedCounter = $event.Data;
        this.ActivateDeactivateBillingCounter(this.SelectedCounter);
        break;
      }

      default:
        break;
    }


  }
  ActivateDeactivateBillingCounter(SelectedCounter) {
    const message = SelectedCounter.IsActive ? "Are you sure you want to deactivate this Billing Counter?" : "Are you sure you want to activate this Billing Counter?";
    if (window.confirm(message)) {
      this._settingsBLService
        .ActivateDeactivateBillingCounter(SelectedCounter)
        .subscribe((res: DanpheHTTPResponse) => {
          if (res.Status === ENUM_DanpheHTTPResponses.OK) {
            this.GetBillingCounter();
            this.messageBoxService.showMessage(ENUM_MessageBox_Status.Success, ['Billing Counter Status updated successfully']);
          } else {
            this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ["failed to Change status",]);
          }
        });
    }
  }
  AddBillingCounterPage() {
    this.ShowAddNewPage = true;
  }
  Close() {
    this.ShowAddNewPage = false;
    this.BillingCounter.BillCounterGroup.reset();
  }
}
