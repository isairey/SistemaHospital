import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { Component } from '@angular/core';
import * as moment from 'moment/moment';
import { CoreService } from '../../../core/shared/core.service';
import { DanpheHTTPResponse } from '../../../shared/common-models';
import GridColumnSettings from '../../../shared/danphe-grid/grid-column-settings.constant';
import { GridEmitModel } from "../../../shared/danphe-grid/grid-emit.model";
import { NepaliDateInGridColumnDetail, NepaliDateInGridParams } from '../../../shared/danphe-grid/NepaliColGridSettingsModel';
import { DanpheLoadingInterceptor } from '../../../shared/danphe-loader-intercepter/danphe-loading.services';
import { MessageboxService } from '../../../shared/messagebox/messagebox.service';
import { RouteFromService } from '../../../shared/routefrom.service';
import { ENUM_DanpheHTTPResponseText } from '../../../shared/shared-enums';
import { BillingBLService } from '../../shared/billing.bl.service';
import { BillingService } from '../../shared/billing.service';

@Component({
  templateUrl: './duplicate-credit-note-list.html',
  providers: [{
    provide: HTTP_INTERCEPTORS,
    useClass: DanpheLoadingInterceptor,
    multi: true,
  }],
  host: { '(window:keydown)': 'hotkeys($event)' }
})

// App Component class
export class BIL_DuplicatePrint_CreditNoteListComponent {

  public CreditNoteList: Array<any> = [];
  public duplicateInvoiceReturnPrintGridColumns: Array<any> = null;

  public fromDate: string = null;
  public toDate: string = null;
  public dateRange: string = null;
  public NepaliDateInGridSettings: NepaliDateInGridParams = new NepaliDateInGridParams();

  public showPrintPage: boolean = false;
  public selCreditNote = null;

  constructor(
    public BillingBLService: BillingBLService,
    public msgBoxServ: MessageboxService,
    public billingService: BillingService,
    public coreService: CoreService, public routeFromService: RouteFromService) {
    this.dateRange = "last1Week";
    this.NepaliDateInGridSettings.NepaliDateColumnList.push(new NepaliDateInGridColumnDetail('CRNDate', false));
    this.duplicateInvoiceReturnPrintGridColumns = GridColumnSettings.DuplicateInvoiceReturnList;
  }


  GetInvoiceListForDuplicatebill() {
    this.BillingBLService.GetInvoiceReturnDetailsForDuplicatebill(this.fromDate, this.toDate)
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
          this.CreditNoteList = res.Results;
          if (this.CreditNoteList && this.CreditNoteList.length > 0) {
            this.CreditNoteList = this.GetPatientsWithConsistentAge();
          }
        }
      });
  }
  GetPatientsWithConsistentAge() {
    return this.CreditNoteList.map(patient => {
      patient.Age = this.coreService.CalculateAge(patient.DateOfBirth);
      return patient;
    });
  }

  DuplicateInvoiceReturnGridActions($event: GridEmitModel) {
    switch ($event.Action) {
      case "showDetails":
        {
          var data = $event.Data;
          this.selCreditNote = data;
          this.showPrintPage = true;
        }
        break;
      default:
        break;
    }
  }

  onGridDateChange($event) {
    this.fromDate = $event.fromDate;
    this.toDate = $event.toDate;
    if (this.fromDate != null && this.toDate != null) {
      if (moment(this.fromDate).isBefore(this.toDate) || moment(this.fromDate).isSame(this.toDate)) {
        this.GetInvoiceListForDuplicatebill();
      } else {
        this.msgBoxServ.showMessage("failed", ['Please enter valid From date and To date']);
      }
    }
  }

  ClosePrintPage() {
    this.selCreditNote = null;
    this.showPrintPage = false;
  }

  hotkeys(event) {
    if (event.keyCode === 27) {
      this.ClosePrintPage();
    }
  }

}
