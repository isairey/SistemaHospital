import { Component } from '@angular/core';

import { BillingBLService } from '../../shared/billing.bl.service';

import { BillingDeposit } from "../../shared/billing-deposit.model";

import GridColumnSettings from '../../../shared/danphe-grid/grid-column-settings.constant';
import { GridEmitModel } from "../../../shared/danphe-grid/grid-emit.model";

import { CoreService } from '../../../core/shared/core.service';
import { DanpheHTTPResponse } from '../../../shared/common-models';
import { NepaliDateInGridColumnDetail, NepaliDateInGridParams } from '../../../shared/danphe-grid/NepaliColGridSettingsModel';
import { MessageboxService } from '../../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponseText } from '../../../shared/shared-enums';

@Component({
  templateUrl: './duplicate-deposit-list.html',
  host: { '(window:keydown)': 'hotkeys($event)' }
})

// App Component class
export class BIL_DuplicatePrint_DepositListComponent {

  public deposit: BillingDeposit;
  public showReceipt: boolean = false;
  public depositList;
  public duplicateBillGrid: Array<any> = null;
  public NepaliDateInGridSettings: NepaliDateInGridParams = new NepaliDateInGridParams();
  public AdmissionDate = "";
  public AdmissionCase = "";

  constructor(
    public BillingBLService: BillingBLService,
    public msgBoxServ: MessageboxService,
    public coreService: CoreService) {
    this.duplicateBillGrid = GridColumnSettings.DuplicateDepositReceiptList;
    this.NepaliDateInGridSettings.NepaliDateColumnList.push(new NepaliDateInGridColumnDetail('CreatedOn', true));
    this.GetDepositList();
  }

  GetDepositList() {
    this.BillingBLService.GetDepositList()
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
          this.depositList = res.Results;
          if (this.depositList && this.depositList.length > 0) {
            this.depositList = this.GetPatientsWithConsistentAge();
          }
        }
      });
  }

  GetPatientsWithConsistentAge() {
    return this.depositList.map(patient => {
      patient.Age = this.coreService.CalculateAge(patient.DateOfBirth);
      return patient;
    });
  }


  DuplicateReceiptGridActions($event: GridEmitModel) {
    switch ($event.Action) {
      case "showDetails":
        {
          this.deposit = $event.Data;
          this.AdmissionCase = $event.Data.AdmissionCase ? $event.Data.AdmissionCase : null;
          this.AdmissionDate = $event.Data.AdmissionDate ? $event.Data.AdmissionDate : null;
          this.showReceipt = true;

        }
        break;
      default:
        break;
    }
  }

  //ShowGridView() {
  //  this.GetDepositList();
  //  this.showReceipt = false;
  //  this.deposit = null;
  //}

  CloseDepositReceiptPopUp() {
    this.showReceipt = false;
    this.deposit = null;
  }

  CallBackCloseRecipt($event) {
    this.CloseDepositReceiptPopUp()
  }

  public hotkeys(event) {
    if (event.keyCode == 27) {//key->ESC
      this.CloseDepositReceiptPopUp();
    }
  }
}
