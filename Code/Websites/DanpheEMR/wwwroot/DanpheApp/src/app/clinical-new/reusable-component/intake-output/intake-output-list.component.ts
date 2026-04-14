import { ChangeDetectorRef, Component, ElementRef, OnInit } from "@angular/core";
import * as moment from "moment";
import { VisitService } from '../../../appointments/shared/visit.service';
import { SecurityService } from "../../../security/shared/security.service";
import { DanpheHTTPResponse } from "../../../shared/common-models";
import { NepaliDateInGridColumnDetail, NepaliDateInGridParams } from "../../../shared/danphe-grid/NepaliColGridSettingsModel";
import GridColumnSettings from "../../../shared/danphe-grid/grid-column-settings.constant";
import { GridEmitModel } from "../../../shared/danphe-grid/grid-emit.model";
import { MessageboxService } from '../../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponses, ENUM_DanpheHTTPResponseText, ENUM_IntakeOutputType, ENUM_MessageBox_Status } from "../../../shared/shared-enums";
import { ClinicalPatientService } from "../../shared/clinical-patient.service";
import { ClinicalNoteBLService } from "../../shared/clinical.bl.service";
import { Field } from "../../shared/dto/field.dto";
import { PatientDetails_DTO } from "../../shared/dto/patient-cln-detail.dto";
import { IntakeOutput } from "../../shared/model/inatke-output.model";

@Component({
  selector: 'clinical-intake-output',
  templateUrl: "./intake-output-list.component.html"
})
export class IntakeOutputListComponent implements OnInit {
  Field: Field;
  IsAcrossVisitAvailability: boolean = false;
  CurrentIntakeOutput: IntakeOutput = new IntakeOutput();
  IntakeOutputLists: Array<IntakeOutput> = new Array<IntakeOutput>();
  //last balance is used to calculate the new IO balance.
  LastBalance: number = 0;
  UpdateButton: boolean = false;
  ShowIOAddBox: boolean = false;
  SelectedIO: IntakeOutput = null;
  SelectedIndex: number = null;
  Loading: boolean = false;
  IntakeOutputGridColumns: typeof GridColumnSettings.prototype.IntakeOutput;
  FromDate: string = null;
  ToDate: string = null;
  PatientVisitId: number = null;
  ShowIntakeOutput: boolean = false;
  NepaliDateInGridSettings = new NepaliDateInGridParams();
  Update: boolean = false;
  ShowIntakeOutputPopUp: boolean = false;
  SelectedPatientDetails = new PatientDetails_DTO();
  SelectedIntakeOutput: IntakeOutput = new IntakeOutput();
  constructor(public visitService: VisitService,
    private _msgBoxService: MessageboxService,
    public changeDetector: ChangeDetectorRef,
    private _securityService: SecurityService,
    private _clinicalNoteBLService: ClinicalNoteBLService,
    private _selectedPatientService: ClinicalPatientService,
    private _elementRef: ElementRef,
  ) {

  }
  ngOnInit() {
    if (this.Field) {
      this.IsAcrossVisitAvailability = this.Field.IsAcrossVisitAvailability;
    } else {
      this.IsAcrossVisitAvailability = false;
    }
    this.PatientVisitId = this.visitService.getGlobal().PatientVisitId;
    var colSettings = new GridColumnSettings(this._securityService);
    this.IntakeOutputGridColumns = colSettings.IntakeOutput;
    this.NepaliDateInGridSettings = new NepaliDateInGridParams();
    this.NepaliDateInGridSettings.NepaliDateColumnList.push(new NepaliDateInGridColumnDetail('RecordedDate'));
    this.GetPatientIntakeOutputList();
  }

  GetPatientIntakeOutputList(): void {
    let patientVisitId = this._selectedPatientService.SelectedPatient.PatientVisitId;
    let patientId = this._selectedPatientService.SelectedPatient.PatientId;
    this._clinicalNoteBLService.GetPatientInputOutputList(patientVisitId, patientId, this.IsAcrossVisitAvailability, this.FromDate, this.ToDate)
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
          this.IntakeOutputLists = res.Results;
          const ioList = this.IntakeOutputLists;
          console.log(this.IntakeOutputLists);
          if (ioList && ioList.length > 0) {
            let balance = 0;
            ioList.forEach(item => {
              if (item.IntakeOutputType === ENUM_IntakeOutputType.Intake) {
                balance += item.IntakeOutputValue;
                item.Balance = balance;
              } else if (item.IntakeOutputType === ENUM_IntakeOutputType.Output) {
                balance = balance - item.IntakeOutputValue;
                item.Balance = balance;
              }
              // Extracting Color and Quality
              const contents = JSON.parse(item.Contents);
              item.Color = contents.Color && contents.Color !== "null" ? contents.Color : "--";
              item.Quality = contents.Quality && contents.Quality !== "null" ? contents.Quality : "--";
              // Adding RecordedDate and RecordedTime
              const { date, time } = this.formatDateTime(item.CreatedOn);
              item.RecordedDate = date;
              item.RecordedTime = time;
            });
            balance = 0;
            this.LastBalance = res.Results.lastBalance;
          }
        } else {
          this._msgBoxService.showMessage(ENUM_MessageBox_Status.Failed, ["please check log for details."], res.ErrorMessage);
        }
      });
  }
  Edit(showIntakeOutput: IntakeOutput, index: number) {
    this.ShowIOAddBox = false;
    this.changeDetector.detectChanges();
    this.ShowIOAddBox = true;
    this.SelectedIndex = index;
    this.SelectedIO = showIntakeOutput;
  }

  callbackIoUpdate() {
    this.GetPatientIntakeOutputList();
  }
  AddNewIO() {
    this.SelectedIndex = null;//reset value of selected index.
    this.CurrentIntakeOutput = new IntakeOutput();
    this.SelectedIO = this.CurrentIntakeOutput;
    this.ShowIOAddBox = false;
    this.changeDetector.detectChanges();
    this.ShowIOAddBox = true;
    this.Update = false;
  }
  OnFromToDateChange($event) {
    this.FromDate = $event ? $event.fromDate : this.FromDate;
    this.ToDate = $event ? $event.toDate : this.ToDate;
  }
  formatDateTime(dateTimeString: string) {
    const dateTime = moment(dateTimeString);
    const date = dateTime.format('YYYY-MM-DD');
    const time = dateTime.format('hh:mm A');
    return { date, time };
  }

  ShowPrintPopUp() {
    this.ShowIntakeOutputPopUp = true;
  }
  ClosePopup() {
    this.ShowIntakeOutputPopUp = false;
  }
  printIntakeOutputReport(): void {
    this.Loading = true;

    const printableContent = this._elementRef.nativeElement.querySelector('#printableContent');

    if (printableContent) {
      const printContent = printableContent.innerHTML;

      // Construct the document content for printing
      const documentContent = `
        <html>
          <head>
            <title>Print Intake Output Report</title>
            <link rel="stylesheet" type="text/css" media="print" href="../../../themes/theme-default/PrintStyle.css"/>
            <link rel="stylesheet" type="text/css" href="../../../../assets/global/plugins/bootstrap/css/bootstrap.min.css"/>
            <link rel="stylesheet" type="text/css" href="../../../themes/theme-default/DanpheStyle.css"/>
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

               .intake-output-title {
                          text-align: center;
                           margin: 10px auto 0 auto;
                          display: block;
                           width: 100%;
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
      console.error('Printable content not found.');
    }
  }

  CloseAddIntakeOutputPopUp() {
    this.ShowIOAddBox = false;
  }

  IntakeOutputComponentGridActions($event: GridEmitModel) {
    switch ($event.Action) {
      case "edit": {
        this.Update = true;
        this.SelectedIntakeOutput = $event.Data;
        this.ShowIOAddBox = false;
        this.changeDetector.detectChanges();
        this.ShowIOAddBox = true;
        break;
      }

      case "delete": {
        this.SelectedIntakeOutput = $event.Data;
        this.DeactivateIntakeOutput(this.SelectedIntakeOutput.InputOutputId);
        break;
      }
      default:
        break;
    }
  }

  DeactivateIntakeOutput(inputOutputId) {
    const message = "Are you sure you want to deactivate this patient Intake/Output?";
    if (window.confirm(message)) {
      this._clinicalNoteBLService
        .DeactivatePatientIntakeOutput(inputOutputId)
        .subscribe((res: DanpheHTTPResponse) => {
          if (res.Status === ENUM_DanpheHTTPResponses.OK) {
            this.GetPatientIntakeOutputList();
            this._msgBoxService.showMessage(ENUM_MessageBox_Status.Success, ['Patient Intake/Output Deactivated successfully']);
          } else {
            this._msgBoxService.showMessage(ENUM_MessageBox_Status.Failed, ["failed to Change status",]);
          }
        });
    }
  }

}
