import { ChangeDetectorRef, Component, ElementRef, OnInit } from '@angular/core';
import { DanpheHTTPResponse } from '../../../../../src/app/shared/common-models';
import { SecurityService } from '../../../security/shared/security.service';
import { User } from '../../../security/shared/user.model';
import { ENUM_PrintingType, PrinterSettingsModel } from '../../../settings-new/printers/printer-settings.model';
import { NepaliDateInGridColumnDetail, NepaliDateInGridParams } from '../../../shared/danphe-grid/NepaliColGridSettingsModel';
import GridColumnSettings from '../../../shared/danphe-grid/grid-column-settings.constant';
import { GridEmitModel } from '../../../shared/danphe-grid/grid-emit.model';
import { MessageboxService } from '../../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status } from '../../../shared/shared-enums';
import { ClinicalPatientService } from '../../shared/clinical-patient.service';
import { ClinicalNoteBLService } from '../../shared/clinical.bl.service';
import { Field } from '../../shared/dto/field.dto';
import { PatientDetails_DTO } from '../../shared/dto/patient-cln-detail.dto';
import { CLN_BloodSugarMonitoring } from '../../shared/model/cln-blood-sugar-monitoring.model';

@Component({
  selector: 'cln-blood-sugar-monitoring',
  templateUrl: './cln-blood-sugar-monitoring.component.html'
})
export class CLN_BloodSugarMonitoringComponent implements OnInit {

  Field: Field;
  IsAcrossVisitAvailability: boolean = false;
  PatientId: number = 0;
  CurrentBloodSugar: CLN_BloodSugarMonitoring = new CLN_BloodSugarMonitoring();

  SelectedBloodSugar: CLN_BloodSugarMonitoring = new CLN_BloodSugarMonitoring();
  BloodSugarMonitoringList: Array<CLN_BloodSugarMonitoring> = new Array<CLN_BloodSugarMonitoring>();
  showBloodSugarAddBox: boolean = false;
  selectedIndex: number = null;
  loading: boolean = false;
  bloodSugarMonitoringGridColumns: Array<any> = null;
  patientVisitId: number = null;
  showBloodSugarMonitoringList: boolean = false;
  NepaliDateInGridSettings = new NepaliDateInGridParams();
  ShowSugarMonitoringPopUp: boolean = false;
  SelectedPatientDetails = new PatientDetails_DTO();
  selectedPrinter: PrinterSettingsModel = new PrinterSettingsModel();
  BrowserPrintContent: string = "";
  openBrowserPrintWindow: boolean = false;
  UpdateBloodSugar: boolean = false;
  CurrentUser: User = new User();
  constructor(
    private _changeDetector: ChangeDetectorRef,
    private _securityService: SecurityService,
    private _clinicalNoteBLService: ClinicalNoteBLService,
    private _selectedPatientService: ClinicalPatientService,
    private _messageBoxService: MessageboxService,
    private _elementRef: ElementRef,
    public changeDetector: ChangeDetectorRef,
    public securityService: SecurityService

  ) {
    this.CurrentUser = this.securityService.GetLoggedInUser() as User;
  }

  ngOnInit() {
    if (this.Field) {
      this.IsAcrossVisitAvailability = this.Field.IsAcrossVisitAvailability;
    } else {
      this.IsAcrossVisitAvailability = false;
    }
    let colSettings = new GridColumnSettings(this._securityService);
    this.bloodSugarMonitoringGridColumns = colSettings.BloodSugar;
    this.NepaliDateInGridSettings = new NepaliDateInGridParams();
    this.NepaliDateInGridSettings.NepaliDateColumnList.push(new NepaliDateInGridColumnDetail('CreatedOn'));
    this.SelectedPatientDetails = this._selectedPatientService.SelectedPatient;
    this.patientVisitId = this._selectedPatientService.SelectedPatient.PatientVisitId;
    this.PatientId = this._selectedPatientService.SelectedPatient.PatientId;
    this.GetPatientBloodSugarList();
  }
  AddNewBloodSugar(): void {
    this.selectedIndex = null;
    this.CurrentBloodSugar = new CLN_BloodSugarMonitoring();
    this.showBloodSugarAddBox = false;
    this._changeDetector.detectChanges();
    this.showBloodSugarAddBox = true;
    this.UpdateBloodSugar = false;
  }


  GetPatientBloodSugarList(): void {
    this._clinicalNoteBLService.GetPatientBloodSugarList(this.PatientId, this.patientVisitId, this.IsAcrossVisitAvailability)
      .subscribe({
        next: (res: DanpheHTTPResponse) => {
          if (res.Status === ENUM_DanpheHTTPResponses.OK) {
            if (Array.isArray(res.Results) && res.Results.length > 0) {
              this.BloodSugarMonitoringList = res.Results
                .map((item: any) => {
                  const createdOnDate = new Date(item.CreatedOn);
                  if (isNaN(createdOnDate.getTime())) {
                    // Handle invalid date format
                    return {
                      ...item,
                      RecordedDate: 'Invalid Date',
                      RecordedTime: 'Invalid Time'
                    };
                  } else {
                    return {
                      ...item,
                      RecordedDate: createdOnDate.toDateString(),
                      RecordedTime: createdOnDate.toLocaleTimeString()
                    };
                  }
                });
              this.showBloodSugarMonitoringList = true;
            } else {
              // Handle case where res.Results is null, undefined, or an empty array
              this.BloodSugarMonitoringList = [];
              this.showBloodSugarMonitoringList = false;
            }
          } else {
            this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ["Failed. please check log for details."], res.ErrorMessage);
          }
        },
        error: (error) => {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ["Failed to retrieve blood sugar monitoring list."], error);
        }
      });
  }
  CallBackBloodSugarUpdate(): void {
    this.GetPatientBloodSugarList();
  }
  ShowPrintPopUp() {
    this.ShowSugarMonitoringPopUp = true;
  }
  ClosePopup() {
    this.ShowSugarMonitoringPopUp = false;
  }
  PrintBloodSugarMonitoringReport(): void {
    this.loading = true;

    if (!this.selectedPrinter || this.selectedPrinter.PrintingType === ENUM_PrintingType.browser) {
      const contentToPrint = this._elementRef.nativeElement.querySelector('#printableContent');

      if (contentToPrint) {
        const printContent = contentToPrint.innerHTML;

        // Construct the document content for printing
        const documentContent = `
                    <html>
                        <head>
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
                  .blood-sugar-monitoring-title{
                    text-align: center;
                           margin: 10px auto 0 auto;
                          display: block;
                           width: 100%;
                  }
                }
                             .wrapper {
                                        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                                        padding: 20px;
                                        background-color: white;
                                        border-radius: 8px;
                                        margin-bottom: 20px;
                                        }

                            .heading {
                                        margin-left: -15px;
                                      }
                            </style>
                        <link rel="stylesheet" type="text/css" media="print" href="../../../themes/theme-default/PrintStyle.css"/>
                        <link rel="stylesheet" type="text/css" href="../../../../assets/global/plugins/bootstrap/css/bootstrap.min.css"/>
                        <link rel="stylesheet" type="text/css" href="../../../themes/theme-default/DanpheStyle.css" />
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
        this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, ["No content to print."]);
      }
    } else {
      this.loading = false;
      this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, ["Printer Not Supported."]);
    }
  }
  CloseAddBloodSugarPopUp() {
    this.showBloodSugarAddBox = false;
    this.UpdateBloodSugar = false;
  }

  BloodSugarComponentGridActions($event: GridEmitModel) {
    switch ($event.Action) {
      case "edit": {
        this.SelectedBloodSugar = $event.Data;
        this.UpdateBloodSugar = true;
        this.showBloodSugarAddBox = true;
        this.changeDetector.detectChanges();
        break;
      }

      case "delete": {
        this.SelectedBloodSugar = $event.Data;
        this.DeactivatePatientBloodSugar(this.SelectedBloodSugar.BloodSugarMonitoringId);
        break;
      }
      default:
        break;
    }
  }

  DeactivatePatientBloodSugar(selectedItem) {
    const message = "Are you sure you want to deactivate this patient complaint?";
    if (window.confirm(message)) {
      this._clinicalNoteBLService
        .DeactivatePatientBloodSugar(selectedItem)
        .subscribe((res: DanpheHTTPResponse) => {
          if (res.Status === ENUM_DanpheHTTPResponses.OK) {
            this._messageBoxService.showMessage(ENUM_MessageBox_Status.Success, ['Patient Blood Sugar Deactivated successfully']);
            this.GetPatientBloodSugarList();
          } else {
            this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ["failed to Change status",]);
          }
        });
    }
  }

}
