import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { PrintTemplateType } from '../../../billing/shared/print-template-type.model';
import { CoreService } from '../../../core/shared/core.service';
import { ENUM_PrintingType, PrinterSettingsModel } from '../../../settings-new/printers/printer-settings.model';
import { DanpheHTTPResponse } from '../../../shared/common-models';
import { MessageboxService } from '../../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status, ENUM_VisitType } from '../../../shared/shared-enums';
import { ClaimManagementBLService } from '../claim-management.bl.service';
import { PatientDetailForFinalBillSummaryReport_DTO } from '../DTOs/final-bill-summary-rpt-patient-detail.dto';

@Component({
  selector: 'echs-final-billing-summary-print',
  templateUrl: './echs-final-billing-summary-print.component.html',
  styleUrls: ['./echs-final-billing-summary-print.component.css'],
  host: { '(window:keydown)': 'hotkeys($event)' }
})
export class EchsFinalBillingSummaryPrintComponent implements OnInit {

  PrintTemplateTypeSettings = new PrintTemplateType();
  InvoiceDisplaySettings: any = { ShowHeader: true, ShowQR: true, ShowHospLogo: true, ShowPriceCategory: false, HeaderType: '' };
  HeaderDetail: { CustomerName, Address, Email, CustomerRegLabel, CustomerRegNo, Tel };
  ServiceDepartment: string[] = ['Hospital Charge (Hospital Breakup Bill Amount)', 'Pharmacy Charge (Summary Amount with Credit Note Deduction)', 'Emergency Charge']
  loading: boolean = false;
  ShowFinalBillSummaryPage: boolean = false;
  @Output('closeFinalBillSummaryCallBack')
  CloseFinalBillSummaryCallBack: EventEmitter<object> = new EventEmitter<object>();
  @Input('selectedClaimCode')
  SelectedClaimCode: number = 0;
  PatientDetails = new PatientDetailForFinalBillSummaryReport_DTO();
  ChargeDetails: { BillingCharge: 0, PharmacyCharge: 0, EmergencyCharge: 0, GrandTotal: 0 };
  MappedServiceDepartmentCharge: { ServiceDepartment: string; Charge: number }[];
  InpatientVisitType = ENUM_VisitType.inpatient;
  SelectedPrinter: PrinterSettingsModel = new PrinterSettingsModel();

  constructor(
    private _claimManagementBLService: ClaimManagementBLService,
    private _messageBoxService: MessageboxService,
    private _coreService: CoreService,
  ) {
    this.InvoiceDisplaySettings = this._coreService.GetInvoiceDisplaySettings();
    let param = this._coreService.Parameters.find(a => a.ParameterName === 'BillingHeader' && a.ParameterGroupName === 'BILL');
    if (param && param.ParameterValue) {
      this.HeaderDetail = JSON.parse(param.ParameterValue);
    }
  }

  ngOnInit(): void {
    (async (): Promise<void> => {
      try {
        await this.GetFinalBillSummaryByClaimCode(this.SelectedClaimCode);
        this.ShowFinalBillSummaryPage = true;
      } catch (err) {
        this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Error: ${err.ErrorMessage}`]);
      }
    })();
  }

  async GetFinalBillSummaryByClaimCode(claimCode: number): Promise<void> {
    try {
      const res: DanpheHTTPResponse = await this._claimManagementBLService.GetFinalBillSummaryByClaimCode(claimCode).toPromise();
      if (res.Status === ENUM_DanpheHTTPResponses.OK) {
        if (res.Results) {
          this.PatientDetails = res.Results.PatientDetails[0];
          this.ChargeDetails = res.Results.ChargeDetails[0];
          this.MappedServiceDepartmentCharge = this.MapServiceDepartmentCharge();

        } else {
          this.PatientDetails = new PatientDetailForFinalBillSummaryReport_DTO();
          this.ChargeDetails = { BillingCharge: 0, PharmacyCharge: 0, EmergencyCharge: 0, GrandTotal: 0 };
          this.MappedServiceDepartmentCharge = [];
        }
      }
    } catch (err) {
      this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Error : ${err.ErrorMessage}`]);
    }
  }

  MapServiceDepartmentCharge(): { ServiceDepartment: string; Charge: number }[] {
    return this.ServiceDepartment.map((department) => {
      let key = '';
      if (department.includes('Hospital Charge')) {
        key = 'HospitalCharge';
      } else if (department.includes('Pharmacy Charge')) {
        key = 'PharmacyCharge';
      } else if (department.includes('Emergency Charge')) {
        key = 'EmergencyCharge';
      }
      return { ServiceDepartment: department, Charge: this.ChargeDetails[key] };
    });
  }


  CloseFinalBillSummaryReport(): void {
    this.ShowFinalBillSummaryPage = false;
    this.CloseFinalBillSummaryCallBack.emit();
  }

  Print(): void {
    this.loading = true;
    if (!this.SelectedPrinter || this.SelectedPrinter.PrintingType === ENUM_PrintingType.browser) {
      const printContent = document.getElementById('final_bill_summary_report').innerHTML;
      const printWindow = window.open('', '', 'height=600,width=800');
      if (printWindow && printContent) {
        printWindow.document.open();
        printWindow.document.write(`
        <html>
        <head>
          <title>Print Report</title>
          <style>
                            @page {
                                size: A5 landscape;
                                margin-top: 8px;
                                margin-bottom: 10px;
                                margin-left: 20px;
                                font-size: 70%;
                                scale: 70%;
                                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                            }

                            body {
                                font-size: 12px;
                                margin: 0;
                                padding: 0;
                                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                            }

                            table td,
                            table th {
                                padding: 0;
                                font-size: 10px;
                            }

                            .column {
                                float: left;
                                padding: 5px;
                            }

                            .box-body {
                                padding: 0px 10px 0 10px;
                            }

                            .c_name {
                                font-size: 10pt !important;
                                margin-bottom: 0;
                                margin-top: 0;
                            }

                            .c_paragraphs {
                                font-size: 8pt !important;
                                margin: 0 0 0 0;
                                padding: 0;
                            }

                            table {
                                width: 100%;
                                border-collapse: collapse;
                                margin-bottom: 30px;
                            }

                            table td,
                            table th {
                                text-align: left;
                                vertical-align: top !important;
                            }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
        </html>
      `);
        printWindow.document.close();
        printWindow.print();
      }
    }
    else {
      this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, ["Printer Not Supported."]);
    }
    this.loading = false;
  }

  hotkeys(event): void {
    if (event.keyCode === 27) {
      this.CloseFinalBillSummaryReport();
    }
  }
}
