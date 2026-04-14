import { Component, ElementRef, OnInit } from '@angular/core';
import * as moment from 'moment';
import { CoreService } from '../../../core/shared/core.service';
import { DanpheHTTPResponse } from '../../../shared/common-models';
import { MessageboxService } from '../../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponses, ENUM_DateTimeFormat, ENUM_MessageBox_Status, ENUM_VitalsType } from '../../../shared/shared-enums';
import { ClinicalPatientService } from '../../shared/clinical-patient.service';
import { ClinicalNoteBLService } from '../../shared/clinical.bl.service';
import { Field } from '../../shared/dto/field.dto';
import { GetClnVitalsTXN_DTO } from '../../shared/dto/get-cln-vitals-txn.dto';
import { GetClnVitals_DTO } from '../../shared/dto/get-cln-vitals.dto';
import { VitalsHeadingModel } from '../../shared/model/vitals-heading.model';


@Component({
  selector: 'nurse-daily-record',
  templateUrl: './nurse-daily-record.component.html',
})
export class NurseDailyRecordComponent implements OnInit {
  Field: Field;
  IsAcrossVisitAvailability: boolean = false;
  ShowVitalsTable: boolean = false;
  PatientVitals: any = [];
  VitalsList = new Array<VitalsHeadingModel>();
  Days: number = 10;
  FromDate: string = moment().format(ENUM_DateTimeFormat.Year_Month_Day);
  ToDate: string = moment().format(ENUM_DateTimeFormat.Year_Month_Day);
  DateHeaders: Array<string> = [];
  ShowPrintPagePopUp: boolean = false;
  Loading: boolean = false;
  GroupedMSTVitalsList = new Array<VitalsHeadingModel>();
  GroupedMSTVitals: { [key: string]: GetClnVitals_DTO[]; };
  AllMSTVitals = new Array<GetClnVitals_DTO>();
  PatientAllVitals = new Array<GetClnVitalsTXN_DTO>();

  constructor(
    private _msgBoxServ: MessageboxService,
    public CoreService: CoreService,
    private _selectedPatientServ: ClinicalPatientService,
    private _clincalBLServ: ClinicalNoteBLService,
    private _elementRef: ElementRef,
  ) {
    this.ConvertDaysToDate(this.Days);
  }

  ngOnInit() {
    this.GetMSTVitals();
    if (this.Field) {
      this.IsAcrossVisitAvailability = this.Field.IsAcrossVisitAvailability;
    } else {
      this.IsAcrossVisitAvailability = false;
    }
  }

  ConvertDaysToDate(days: number): void {
    const date = new Date();
    if (days > 1) {
      date.setDate(date.getDate() - days + 1);
    }
    this.DateHeaders = [];
    this.FromDate = moment(date).format(ENUM_DateTimeFormat.Year_Month_Day);
    const fromDate = moment(this.FromDate);
    const toDate = moment(this.ToDate).add(1, 'day');
    while (fromDate.isBefore(toDate, 'day')) {
      this.DateHeaders.push(moment(fromDate).format(ENUM_DateTimeFormat.Year_Month_Day));
      fromDate.add(1, 'days');
    }
  }


  GetMSTVitals(): void {
    this._clincalBLServ.GetMSTVitals()
      .subscribe((res: DanpheHTTPResponse): void => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          if (res.Results && res.Results.length > 0) {
            this.AllMSTVitals = res.Results;
            this.ProcessForVitalsTableHeading();
            this.ShowVitalsTable = true;
            this.LoadReport();
          }
          else {
            this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, [`MST Vitals is empty.`]);
          }
        }
        else {
          this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, [`Failed: ${res.ErrorMessage}`]);
        }
      },
        (err: DanpheHTTPResponse): void => {
          this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, [`Exception: ${err.ErrorMessage}`]);
        }
      );
  }
  LoadReport() {
    let patientId = this._selectedPatientServ.SelectedPatient.PatientId;
    let patientVisitId = this._selectedPatientServ.SelectedPatient.PatientVisitId;
    this.GetVitalsByPatientIdAndPatientVisitId(patientId, patientVisitId, this.IsAcrossVisitAvailability);
  }


  GetVitalsByPatientIdAndPatientVisitId(patientId: number, patientVisitId: number, isAcrossVisitAvailability: boolean): void {
    this._clincalBLServ.GetVitalsForNurseDailyRecord(this.FromDate, this.ToDate, patientId, patientVisitId, isAcrossVisitAvailability)
      .subscribe((res: DanpheHTTPResponse): void => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          if (res.Results.length) {
            this.PatientAllVitals = res.Results;
            this.ProcessPatientAllVitals();
          }
          else {
            this.PatientAllVitals = [];
            this.ProcessPatientAllVitals();
          }
        }
        else {
          this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, [`No vitals available for current patient.`]);
        }
      },
        (err: DanpheHTTPResponse): void => {
          this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, [`Exception: ${err.ErrorMessage}`]);
        }
      );
  }

  ProcessForVitalsTableHeading(): void {
    this.GroupedMSTVitals = this.AllMSTVitals.reduce((acc, curr) => {
      const group = curr.VitalsGroup;
      if (!acc[group]) {
        acc[group] = [];
      }
      acc[group].push(curr);
      return acc;
    }, {});
    const groupedArray = Object.values(this.GroupedMSTVitals);
    this.GroupedMSTVitalsList = new Array<VitalsHeadingModel>();
    groupedArray.forEach(element => {
      let item = new VitalsHeadingModel();
      item.VitalsName = element[0].VitalsGroup;
      item.DisplayOrder = element[0].DisplayOrder;
      item.VitalsType = element[0].VitalsType;
      item.InputType = element[0].InputType;
      item.Unit = element[0].Unit;
      this.GroupedMSTVitalsList.push(item);
    });
    this.GroupedMSTVitalsList.sort((a, b) => a.DisplayOrder - b.DisplayOrder);
    this.VitalsList = this.GroupedMSTVitalsList.filter(item => item.VitalsType === ENUM_VitalsType.Vitals || item.VitalsType === ENUM_VitalsType.AssessmentScale);
    this.VitalsList.sort((a, b) => a.DisplayOrder - b.DisplayOrder);
  }

  ProcessPatientAllVitals(): void {
    const patientVitals = this.PatientAllVitals.filter(v => v.VitalsType === ENUM_VitalsType.Vitals || v.VitalsType === ENUM_VitalsType.AssessmentScale);

    this.GroupPatientVitals(patientVitals);
  }

  GroupPatientVitals(patientVitals: GetClnVitalsTXN_DTO[]) {
    const groupedVitalsByCreatedOn = patientVitals.reduce((acc, obj) => {
      const key = obj.CreatedOn;
      if (!acc[key]) {
        acc[key] = {};
      }
      if (!acc[key][obj.VitalsGroup]) {
        acc[key][obj.VitalsGroup] = [];
      }
      acc[key][obj.VitalsGroup].push(obj);
      return acc;
    }, {});

    const groupedArray = Object.keys(groupedVitalsByCreatedOn).map(createdOn => {
      const vitalsGroups = Object.keys(groupedVitalsByCreatedOn[createdOn]).map(vitalsGroup => {
        const vitalsData = groupedVitalsByCreatedOn[createdOn][vitalsGroup];

        const concatenatedVitalsValue = vitalsData
          .filter(data => data.VitalsValue && data.VitalsValue !== '' && data.VitalsValue !== null && data.VitalsValue !== undefined)
          .map(data => data.VitalsValue)
          .join('/');
        const { date, time } = this.formatDateTime(createdOn);
        return {
          VitalsData: [{
            CreatedBy: null,
            CreatedOn: createdOn,
            Date: date,
            Time: time,
            IsActive: null,
            ModifiedBy: null,
            ModifiedOn: null,
            OtherVariable: null,
            PatientId: null,
            PatientVisitId: null,
            Remarks: null,
            TxnVitalsId: null,
            Unit: vitalsData[0].Unit,
            VitalsGroup: vitalsGroup,
            VitalsId: null,
            VitalsValue: concatenatedVitalsValue,
            DisplayOrder: vitalsData[0].DisplayOrder,
            VitalType: vitalsData[0].VitalsType
          }]
        };
      }).sort((a, b) => a.VitalsData[0].DisplayOrder - b.VitalsData[0].DisplayOrder);

      return {
        VitalsGroupsByCreatedOn: vitalsGroups
      };
    });
    this.PatientVitals = groupedArray;
    let HeaderLength = this.VitalsList.length;
    this.PatientVitals.forEach(record => {
      if (record.VitalsGroupsByCreatedOn.length !== HeaderLength) {
        let len = record.VitalsGroupsByCreatedOn.length;
        for (let x = (len + 1); x <= HeaderLength; x++) {
          record.VitalsGroupsByCreatedOn.push(
            {
              VitalsData: [{
                CreatedBy: null,
                CreatedOn: null,
                IsActive: null,
                ModifiedBy: null,
                ModifiedOn: null,
                OtherVariable: null,
                PatientId: null,
                PatientVisitId: null,
                Remarks: null,
                TxnVitalsId: null,
                Unit: null,
                VitalsGroup: null,
                VitalsId: null,
                VitalsValue: null,
                DisplayOrder: null,
                VitalType: null
              }]
            }
          );
        }
      }
    }
    );
  }
  printVitals(): void {
    this.Loading = true;

    const printableContent = this._elementRef.nativeElement.querySelector('#printableContent');

    if (printableContent) {
      const printContent = printableContent.innerHTML;

      // Construct the document content for printing
      const documentContent = `
                <html>
                    <head>
                        <title>Print Nurse's Daily Record</title>
                        <link rel="stylesheet" type="text/css" media="print" href="../../../themes/theme-default/PrintStyle.css"/>
                        <link rel="stylesheet" type="text/css" href="../../../../assets/global/plugins/bootstrap/css/bootstrap.min.css"/>
                        <link rel="stylesheet" type="text/css" href="../../../themes/theme-default/DanpheStyle.css" />
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
                                       th,td{
                                       font-size: 11px;
                                       }
                                       @media print {
                       .nurse-daily-record-title {
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

    }
  }
  ShowPrintPopUp() {
    this.ShowPrintPagePopUp = true;
  }
  ClosePopup() {
    this.ShowPrintPagePopUp = false;
  }

  formatDateTime(dateTimeString: string) {
    const dateTime = moment(dateTimeString);
    const date = dateTime.format('YYYY-MM-DD');
    const time = dateTime.format('hh:mm A');
    return { date, time };
  }
}
