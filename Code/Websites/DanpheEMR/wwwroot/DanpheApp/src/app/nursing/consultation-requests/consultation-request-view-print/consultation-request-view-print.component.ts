import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { VisitService } from '../../../appointments/shared/visit.service';
import { CoreService } from '../../../core/shared/core.service';
import { Employee } from '../../../employee/shared/employee.model';
import { PatientService } from '../../../patients/shared/patient.service';
import { ENUM_PrintingType, PrinterSettingsModel } from '../../../settings-new/printers/printer-settings.model';
import { Department } from '../../../settings-new/shared/department.model';
import { DanpheHTTPResponse } from '../../../shared/common-models';
import { MessageboxService } from '../../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status } from '../../../shared/shared-enums';
import { ConsultationRequestModel } from '../../shared/consultation-request.model';
import { ConsultationRequestGridDTO } from '../../shared/dto/consultation-request-grid.dto';
import { NursingService } from '../../shared/nursing-service';
import { NursingBLService } from '../../shared/nursing.bl.service';
@Component({
  selector: 'consultation-request-view-print',
  templateUrl: './consultation-request-view-print.component.html',
  host: { "(window:keydown)": "hotkeys($event)" },
})
export class ConsultationRequestViewPrintComponent implements OnInit {
  @Input("ShowViewPrintPopup")
  public ShowViewPrintPopup: boolean = false;

  @Input("SelectedConsultationRequest")
  public SelectedConsultationRequest: ConsultationRequestGridDTO = new ConsultationRequestGridDTO();

  public ConsultationRequest: ConsultationRequestModel = new ConsultationRequestModel();
  public PatientVisitId: number = 0;

  @Output("OnCloseViewPrintPopupClose")
  public HideHideViePrintPopup: EventEmitter<boolean> = new EventEmitter<boolean>();
  public DepartmentList: Array<Department> = new Array<Department>();
  public DoctorList: Array<Employee> = new Array<Employee>();
  public selectedPrinter: PrinterSettingsModel = new PrinterSettingsModel();
  public openBrowserPrintWindow: boolean = false;
  public browserPrintContentObj: any;
  public loading: boolean = false;
  public InvoiceDisplaySettings: any = { ShowHeader: true, ShowQR: true, ShowHospLogo: true, ShowPriceCategory: false };
  public HasWardBedDetails: boolean = false;
  public HasIpNumber: boolean = false;
  constructor(
    private nursingBLService: NursingBLService,
    private messageBoxService: MessageboxService,
    private visitService: VisitService,
    private changeDetector: ChangeDetectorRef,
    private coreService: CoreService,
    public patientService: PatientService,
    public _nursingService: NursingService
  ) {
    this.InvoiceDisplaySettings = this.coreService.GetInvoiceDisplaySettings();
  }

  ngOnInit() {
    this.PatientVisitId = this.visitService.getGlobal().PatientVisitId;
    this.ConsultationRequest.RequestedOn = this.SelectedConsultationRequest.RequestedOn;
    this.DepartmentList = this._nursingService.GetDepartmentList();
    this.DoctorList = this._nursingService.GetDoctorList();
    let patient = this.patientService.globalPatient;
    this.HasWardBedDetails = !!(patient.WardName && patient.BedNo);
    this.HasIpNumber = !!patient.VisitCode;
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
      const res: DanpheHTTPResponse = await this.nursingBLService.GetAllApptDepartment().toPromise();
      if (res.Status === ENUM_DanpheHTTPResponses.OK) {
        this.DepartmentList = res.Results;
      } else {
        this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, [
          "Failed to get DepartmentList.",
        ]);
      }
    } catch (error) {
      this.messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [
        "Failed to get DepartmentList.",
      ]);
    }
  }

  public async GetAllAppointmentApplicableDoctor() {
    try {
      const res: DanpheHTTPResponse = await this.nursingBLService.GetAllAppointmentApplicableDoctor().toPromise();
      if (res.Status === ENUM_DanpheHTTPResponses.OK) {
        this.DoctorList = res.Results;
      } else {
        this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, [
          "Failed to get DoctorList.",
        ]);
      }
    } catch (error) {
      this.messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [
        "Failed to get DoctorList.",
      ]);
    }
  }

  public Discard(): void {
    this.CloseViewPrintPopup();
  }

  OnPrinterChanged($event): void {
    this.selectedPrinter = $event;
  }
  PrintConsultationForm(): void {
    this.loading = true;

    if (!this.selectedPrinter || this.selectedPrinter.PrintingType === ENUM_PrintingType.browser) {
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
          this.loading = false;
        }, 500);
      } else {
        this.loading = false;
        this.messageBoxService.showMessage(ENUM_MessageBox_Status.Error, ["No content to print."]);
      }
    } else {
      this.loading = false;
      this.messageBoxService.showMessage(ENUM_MessageBox_Status.Error, ["Printer Not Supported."]);
    }
  }
}
