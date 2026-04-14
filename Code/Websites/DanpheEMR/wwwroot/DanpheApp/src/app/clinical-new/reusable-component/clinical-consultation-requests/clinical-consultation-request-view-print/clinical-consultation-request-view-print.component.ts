import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CoreService } from '../../../../core/shared/core.service';
import { Employee } from '../../../../employee/shared/employee.model';
import { ConsultationRequestModel } from '../../../../nursing/shared/consultation-request.model';
import { ENUM_PrintingType, PrinterSettingsModel } from '../../../../settings-new/printers/printer-settings.model';
import { Department } from '../../../../settings-new/shared/department.model';
import { DanpheHTTPResponse } from '../../../../shared/common-models';
import { MessageboxService } from '../../../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status } from '../../../../shared/shared-enums';
import { ClinicalPatientService } from '../../../shared/clinical-patient.service';
import { ClinicalNoteBLService } from '../../../shared/clinical.bl.service';
import { ClinicalService } from '../../../shared/clinical.service';
import { ConsultationRequestGridDTO } from '../../../shared/dto/consultation-request-grid.dto';
import { InvoiceDisplaySetting_DTO } from '../../../shared/dto/invoice-display-setting.dto';
import { PatientDetails_DTO } from '../../../shared/dto/patient-cln-detail.dto';
@Component({
  selector: 'clinical-consultation-request-view-print',
  templateUrl: './clinical-consultation-request-view-print.component.html',
  host: { "(window:keydown)": "hotkeys($event)" },
})
export class ClinicalConsultationRequestViewPrintComponent implements OnInit {
  @Input("ShowViewPrintPopup")
  ShowViewPrintPopup: boolean = false;

  @Input("SelectedConsultationRequest")
  SelectedConsultationRequest: ConsultationRequestGridDTO = new ConsultationRequestGridDTO();

  ConsultationRequest: ConsultationRequestModel = new ConsultationRequestModel();
  PatientVisitId: number = 0;

  @Output("OnCloseViewPrintPopupClose")
  HideHideViePrintPopup: EventEmitter<boolean> = new EventEmitter<boolean>();
  DepartmentList: Array<Department> = new Array<Department>();
  DoctorList: Array<Employee> = new Array<Employee>();
  SelectedPrinter: PrinterSettingsModel = new PrinterSettingsModel();
  Loading: boolean = false;
  InvoiceDisplaySettings = new InvoiceDisplaySetting_DTO();
  HasWardBedDetails: boolean = false;
  HasIpNumber: boolean = false;
  SelectedPatient = new PatientDetails_DTO();

  constructor(
    private _clinicalNoteBLService: ClinicalNoteBLService,
    private _clinicalService: ClinicalService,
    private _messageBoxService: MessageboxService,
    private _coreService: CoreService,
    private _selectedPatientService: ClinicalPatientService,
  ) {
    this.InvoiceDisplaySettings = this._coreService.GetInvoiceDisplaySettings();
  }

  ngOnInit() {
    this.SelectedPatient = this._selectedPatientService.SelectedPatient;
    this.PatientVisitId = this._selectedPatientService.SelectedPatient.PatientVisitId;
    this.ConsultationRequest.RequestedOn = this.SelectedConsultationRequest.RequestedOn;
    this.DepartmentList = this._clinicalService.GetDepartmentList();
    this.DoctorList = this._clinicalService.GetDoctorList();
    this.HasWardBedDetails = !!(this._selectedPatientService.SelectedPatient.WardName && this._selectedPatientService.SelectedPatient.BedNumber);
    this.HasIpNumber = !!this._selectedPatientService.SelectedPatient.VisitCode;
  }

  public hotkeys(event): void {
    if (event.keyCode === 27) {
      this.CloseViewPrintPopup();
    }
  }

  public CloseViewPrintPopup(): void {
    this.ShowViewPrintPopup = false;
    this.HideHideViePrintPopup.emit(true);
  }

  public async GetAllApptDepartment() {
    try {
      const res: DanpheHTTPResponse = await this._clinicalNoteBLService.GetAllApptDepartment().toPromise();
      if (res.Status === ENUM_DanpheHTTPResponses.OK) {
        this.DepartmentList = res.Results;
      } else {
        this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, [
          "Failed to get DepartmentList.",
        ]);
      }
    } catch (error) {
      this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [
        "Failed to get DepartmentList.",
      ]);
    }
  }

  public async GetAllAppointmentApplicableDoctor() {
    try {
      const res: DanpheHTTPResponse = await this._clinicalNoteBLService.GetAllAppointmentApplicableDoctor().toPromise();
      if (res.Status === ENUM_DanpheHTTPResponses.OK) {
        this.DoctorList = res.Results;
      } else {
        this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, [
          "Failed to get DoctorList.",
        ]);
      }
    } catch (error) {
      this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [
        "Failed to get DoctorList.",
      ]);
    }
  }

  public Discard(): void {
    this.CloseViewPrintPopup();
  }

  OnPrinterChanged($event): void {
    this.SelectedPrinter = $event;
  }
  PrintConsultationForm(): void {
    this.Loading = true;

    if (!this.SelectedPrinter || this.SelectedPrinter.PrintingType === ENUM_PrintingType.browser) {
      const contentToPrint = document.getElementById("id_consultation_form");

      if (contentToPrint) {
        const printContent = contentToPrint.innerHTML;

        // Construct the document content for printing
        const documentContent = `
                <html>
                    <head>
                        <link rel="stylesheet" type="text/css" href="../../../../assets/global/plugins/bootstrap/css/bootstrap.min.css"/>
                        <style>
                        .patient-details {
                            font-size: 1.2rem;
                        }
                        .doctor-details{
                          font-size: 1.1rem;

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
}
