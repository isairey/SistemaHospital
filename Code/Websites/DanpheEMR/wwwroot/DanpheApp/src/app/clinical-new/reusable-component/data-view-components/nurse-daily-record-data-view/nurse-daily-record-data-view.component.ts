import { Component, ElementRef, OnInit } from '@angular/core';
import * as moment from 'moment';
import { CoreService } from '../../../../core/shared/core.service';
import { DanpheHTTPResponse } from '../../../../shared/common-models';
import { MessageboxService } from '../../../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status, ENUM_VitalsType } from '../../../../shared/shared-enums';
import { ClinicalNoteBLService } from '../../../shared/clinical.bl.service';
// import { NurseDailyRecordDataViewConfig } from '../../../shared/dto/dynamic-field-config.dto';
import { Field } from '../../../shared/dto/field.dto';
import { GetClnVitalsTXN_DTO } from '../../../shared/dto/get-cln-vitals-txn.dto';
import { GetClnVitals_DTO } from '../../../shared/dto/get-cln-vitals.dto';
import { VitalsHeadingModel } from '../../../shared/model/vitals-heading.model';



@Component({
  selector: 'nurse-daily-record-data-view',
  templateUrl: './nurse-daily-record-data-view.component.html',
})
export class NurseDailyRecordDataViewComponent implements OnInit {


  Field: Field;
  // FieldConfig: DataViewConfig;
  IsAcrossVisitAvailability: boolean = false;
  ShowVitalsTable: boolean = false;
  PatientVitals: any = [];
  VitalsList = new Array<VitalsHeadingModel>();
  // Days: number = 10;
  FromDate: string;
  ToDate: string;
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
    private _clincalBLServ: ClinicalNoteBLService,
    private _elementRef: ElementRef,
  ) {
  }

  ngOnInit() {
    if (this.Field) {
      this.IsAcrossVisitAvailability = this.Field.IsAcrossVisitAvailability;
    } else {
      this.IsAcrossVisitAvailability = false;
    }
    this.GetMSTVitals();
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
    let patientId = this.Field.FieldConfig.PreTemplatePatientDetail.PatientId;
    let patientVisitId = this.Field.FieldConfig.PreTemplatePatientDetail.PatientVisitId;
    this.GetVitalsByPatientIdAndPatientVisitId(patientId, patientVisitId);
  }


  GetVitalsByPatientIdAndPatientVisitId(patientId: number, patientVisitId: number): void {
    this._clincalBLServ.GetVitalsForNurseDailyRecord(this.FromDate, this.ToDate, patientId, patientVisitId, this.IsAcrossVisitAvailability)
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

  formatDateTime(dateTimeString: string) {
    const dateTime = moment(dateTimeString);
    const date = dateTime.format('YYYY-MM-DD');
    const time = dateTime.format('hh:mm A');
    return { date, time };
  }
}
