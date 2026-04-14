import { Component, ElementRef, EventEmitter, Input, Output } from "@angular/core";
import { InvoiceDisplaySetting_DTO } from "../../../../clinical-new/shared/dto/invoice-display-setting.dto";
import { PatientDetails_DTO } from "../../../../clinical-new/shared/dto/patient-cln-detail.dto";
import { CoreService } from "../../../../core/shared/core.service";
import { ENUM_PrintingType, PrinterSettingsModel } from "../../../../settings-new/printers/printer-settings.model";
import { MessageboxService } from "../../../../shared/messagebox/messagebox.service";
import { ENUM_MessageBox_Status } from "../../../../shared/shared-enums";
import { ClinicalPatientService } from "../../../shared/clinical-patient.service";


@Component({
  selector: 'lab-investigation-results-print',
  templateUrl: './lab-investigation-result-print.component.html'
})
export class LabInvestigationResultsPrintComponent {
  HeaderDetail: { CustomerName, Address, Email, CustomerRegLabel, CustomerRegNo, Tel; };
  InvoiceDisplaySettings = new InvoiceDisplaySetting_DTO();
  CurrentDate: Date;
  @Input('show-investigation-results-print-page')
  ShowInvestigationResultsPrintPage: boolean = false;

  @Input('inner-html-data')
  InnerHtmlData = { innerHTML: '' };
  ;
  @Output()
  HidePrintPage: EventEmitter<boolean> = new EventEmitter<boolean>();
  Loading: boolean = false;
  SelectedPrinter: PrinterSettingsModel = new PrinterSettingsModel();
  BrowserPrintContentObj: any;
  OpenBrowserPrintWindow: boolean = false;
  SelectedPatient = new PatientDetails_DTO();
  constructor(
    private _elementRef: ElementRef,
    private _coreService: CoreService,
    private _messageBoxService: MessageboxService,
    private _selectedPatientService: ClinicalPatientService
  ) {
    let paramValue = this._coreService.Parameters.find(a => a.ParameterName === 'BillingHeader').ParameterValue;
    if (paramValue) {
      this.HeaderDetail = JSON.parse(paramValue);
    }
    this.InvoiceDisplaySettings = this._coreService.GetInvoiceDisplaySettings();
    this.CurrentDate = new Date;
    this.SelectedPatient = this._selectedPatientService.SelectedPatient;
  }
  ngAfterViewInit() {
    this.appendInnerHtmlToDiv();
  }
  ClosePopUp() {
    this.ShowInvestigationResultsPrintPage = false;
    this.HidePrintPage.emit();
  }

  Print(): void {
    this.Loading = true;

    if (!this.SelectedPrinter || this.SelectedPrinter.PrintingType === ENUM_PrintingType.browser) {
      const contentToPrint = this._elementRef.nativeElement.querySelector('#printableContent');

      if (contentToPrint) {
        const printContent = contentToPrint.innerHTML;
        const documentContent = `
                <html>
                    <head>
                        <link rel="stylesheet" type="text/css" href="../../../../assets/global/plugins/bootstrap/css/bootstrap.min.css"/>
                        <style>
                        @media print {
                             .no-print {
                                         display: none;
                                        }
                              .border {
                                       border: 1px solid lightgray;
                                       }
                            .row {
                            display: flex;
                            flex-wrap: wrap;
                               }

                          .col {
                             flex-grow: 1;
                              padding: 0 15px;
                              box-sizing: border-box;
                              font-size: 12px;
                              width: 33%;
                             text-align: left;
                             }


                       .label-text {
                             font-weight: bold;

                                    }
                           }
                    </style>
                    </head>
                    <body onload="window.print()">${printContent}</body>
                </html>
            `;

        const iframe = document.createElement('iframe');
        document.body.appendChild(iframe);
        iframe.contentWindow.document.open();
        iframe.contentWindow.document.write(documentContent);
        iframe.contentWindow.document.close();

        setTimeout(() => {
          document.body.removeChild(iframe);
          this.Loading = false;
        }, 500);
      } else {
        this.Loading = false;
        this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, ["No content to print."]);
      }
    } else {
      this.Loading = false;
      this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, ["Printer Not Supported."]);
    }
  }
  appendInnerHtmlToDiv() {
    const div = document.getElementById('div-investigation-results');
    if (div) {
      div.innerHTML += this.InnerHtmlData;

    }
  }
}
