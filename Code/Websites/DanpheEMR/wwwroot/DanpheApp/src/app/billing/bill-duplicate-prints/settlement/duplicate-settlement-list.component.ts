import { Component } from '@angular/core';
import { CoreService } from '../../../core/shared/core.service';
import { DanpheHTTPResponse } from '../../../shared/common-models';
import GridColumnSettings from '../../../shared/danphe-grid/grid-column-settings.constant';
import { NepaliDateInGridColumnDetail, NepaliDateInGridParams } from '../../../shared/danphe-grid/NepaliColGridSettingsModel';
import { MessageboxService } from '../../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponseText } from '../../../shared/shared-enums';
import { BillSettlementModel } from "../../shared/bill-settlement.model";
import { BillingBLService } from '../../shared/billing.bl.service';

@Component({
  templateUrl: './duplicate-settlement-list.html',
  host: { '(window:keydown)': 'hotkeys($event)' }

})

// App Component class
export class BIL_DuplicatePrint_SettlementListComponent {
  public settlementInfo: BillSettlementModel;
  public showReceipt: boolean = false;
  public settlMntList: Array<BillSettlementModel> = [];
  public settlmntGridCols: any;
  public NepaliDateInGridSettings: NepaliDateInGridParams = new NepaliDateInGridParams();
  public SettlementId: number = 0;

  constructor(
    public billingBLService: BillingBLService,
    public msgBoxServ: MessageboxService,
    public coreService: CoreService) {
    this.settlmntGridCols = GridColumnSettings.SettlementDuplicateColumns;
    this.NepaliDateInGridSettings.NepaliDateColumnList.push(new NepaliDateInGridColumnDetail('CreatedOn', true));
    this.GetSettlementsList();
  }

  GetSettlementsList() {
    this.billingBLService.GetAllSettlements()
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
          this.settlMntList = res.Results;
          if (this.settlMntList && this.settlMntList.length > 0) {
            this.settlMntList = this.GetPatientsWithConsistentAge();
          }
        }
      });
  }
  GetPatientsWithConsistentAge() {
    return this.settlMntList.map(st => {
      st.Patient.Age = this.coreService.CalculateAge(st.Patient.DateOfBirth);
      return st;
    });
  }

  DuplicateReceiptGridActions($event) {
    switch ($event.Action) {
      case "showDetails":
        {
          this.SettlementId = $event.Data.SettlementId;
          this.showReceipt = true;
          // let settlmntId = $event.Data.SettlementId;

          // this.billingBLService.GetSettlementInfoBySettlmentId(settlmntId)
          //   .subscribe((res: DanpheHTTPResponse) => {

          //     this.settlementInfo = res.Results;
          //     this.settlementInfo.Patient.CountrySubDivisionName = this.settlementInfo.Patient.CountrySubDivision.CountrySubDivisionName;
          //     this.showReceipt = true;
          //   });

        }
        break;
      default:
        break;
    }
  }
  ShowGridView() {
    this.GetSettlementsList();
    this.showReceipt = false;
    this.settlementInfo = null;
  }

  hotkeys(event) {
    if (event.keyCode === 27) {
      this.ShowGridView();
    }
  }

}
