import { ChangeDetectorRef, Component, EventEmitter, Input, Output } from "@angular/core";
import { CoreService } from '../../../core/shared/core.service';
import { Patient } from '../../../patients/shared/patient.model';
import { ENUM_PrintingType, PrinterSettingsModel } from "../../../settings-new/printers/printer-settings.model";
import { MessageboxService } from '../../../shared/messagebox/messagebox.service';
import { ENUM_MessageBox_Status } from "../../../shared/shared-enums";
import { BillingSalesSummaryReportDto } from "../dto/bill-sales-summary.dto";

@Component({
  selector: 'print-billing-sales-summary',
  templateUrl: './print-billing-sales-summary.component.html',
  styleUrls: ['./billing-sales-summary.component.css']
})
export class PrintBillingSalesSummaryComponent {

  @Input('show-billing-sales-summary-printpage')
  ShowBillingSalesSummaryPrintPage: boolean = false;


  @Input('billing-sales-summary-list')
  BillingSalesSummaryList: BillingSalesSummaryReportDto[] = [];

  @Input('SelectedPatient')
  SelectedPatient: Patient;

  @Output('hide-print-billing-sales-summary') HidePrintBillingSalesSummary: EventEmitter<boolean> = new EventEmitter<boolean>();

  HeaderDetail: { CustomerName, Address, Email, CustomerRegLabel, CustomerRegNo, Tel };
  InvoiceDisplaySettings: any = { ShowHeader: true, ShowQR: true, ShowHospLogo: true, ShowPriceCategory: false };

  SelectedPrinter: PrinterSettingsModel = new PrinterSettingsModel();
  BrowserPrintContentObj: any;
  OpenBrowserPrintWindow: boolean = false;
  Loading: boolean = false;

  CurrentDate: Date;

  constructor(
    private _changeDetector: ChangeDetectorRef,

    private _messageBoxService: MessageboxService,
    private _coreService: CoreService


  ) {
    let paramValue = this._coreService.Parameters.find(a => a.ParameterName === 'BillingHeader').ParameterValue;
    if (paramValue) {
      this.HeaderDetail = JSON.parse(paramValue);
    }
    this.InvoiceDisplaySettings = this._coreService.GetInvoiceDisplaySettings();
    this.CurrentDate = new Date;
  }

  public CloseBillingSalesSummaryPrintPagePopUp(): void {
    this.ShowBillingSalesSummaryPrintPage = false;
    this.HidePrintBillingSalesSummary.emit();
  }

  public Print(): void {
    this.Loading = true;
    if (!this.SelectedPrinter || this.SelectedPrinter.PrintingType === ENUM_PrintingType.browser) {
      this.BrowserPrintContentObj = document.getElementById("id_sales_summary_sheet");
      this.OpenBrowserPrintWindow = false;
      this._changeDetector.detectChanges();
      this.OpenBrowserPrintWindow = true;
      this.Loading = false;


    }
    else {
      this.Loading = false;
      this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, ["Printer Not Supported."]);
    }
  }



}