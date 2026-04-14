import { Component, OnInit } from '@angular/core';
import { CoreService } from '../../../../core/shared/core.service';
import { DanpheHTTPResponse } from '../../../../shared/common-models';
import { MessageboxService } from '../../../../shared/messagebox/messagebox.service';
import { ENUM_ClinicalField_InputType, ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status, ENUM_VitalsType } from '../../../../shared/shared-enums';
import { ClinicalNoteBLService } from '../../../shared/clinical.bl.service';
import { Field } from '../../../shared/dto/field.dto';
import { LatestVitals } from '../../../shared/dto/get-cln-latest-vitals.dto';
import { GetClnVitalsTXN_DTO } from '../../../shared/dto/get-cln-vitals-txn.dto';
import { GetClnVitals_DTO } from '../../../shared/dto/get-cln-vitals.dto';
import { VitalsHeadingModel } from '../../../shared/model/vitals-heading.model';
@Component({
  selector: 'vitals-new-data-view',
  templateUrl: './vitals-new-data-view.component.html',
})

export class VitalsNewDataViewComponent implements OnInit {
  Field: Field;
  IsAcrossVisitAvailability: boolean = false;
  PatientId: number = 0;
  PatientVisitId: number = 0;
  AllMSTVitals = new Array<GetClnVitals_DTO>();
  PatientAllVitals = new Array<GetClnVitalsTXN_DTO>();
  ShowVitalsTable: boolean = false;
  ShowBiometricsTable: boolean = false;
  ShowLatestVitals: boolean = false;
  GroupedMSTVitalsList = new Array<VitalsHeadingModel>();
  GroupedVitalsList = new Array<VitalsHeadingModel>();
  GroupedBiometricsList = new Array<VitalsHeadingModel>();
  GroupedMSTVitals: { [key: string]: GetClnVitals_DTO[]; };

  VitalsType: string = "";
  GroupedPatientVitals: any;
  GroupedPatientBiometrics: any;
  ShowBMIOnLatestVitals: boolean = false;
  BMI = { BMIBiometricsName: "BMI", Unit: "Kg/m2" };
  BMI_ValueOnLatestVitals: number = 0;
  LatestPatientVitals = new Array<LatestVitals>();
  GroupedLatestPatientVitalsList = new Array<LatestVitals>();
  GroupedLatestPatientVitals: { [key: string]: LatestVitals[]; };
  InputTypes: { [key: string]: string; };
  VitalTypes: { [key: string]: string; };

  constructor(
    private _clinicalBLService: ClinicalNoteBLService,
    private _messageBoxService: MessageboxService,
    public coreService: CoreService,
  ) {
  }

  ngOnInit(): void {
    if (this.Field) {
      this.IsAcrossVisitAvailability = this.Field.IsAcrossVisitAvailability;
    } else {
      this.IsAcrossVisitAvailability = false;
    }
    this.InputTypes = Object.keys(ENUM_ClinicalField_InputType).reduce((acc, key) => {
      acc[key] = ENUM_ClinicalField_InputType[key as keyof typeof ENUM_ClinicalField_InputType];
      return acc;
    }, {} as { [key: string]: string; });
    this.VitalTypes = Object.keys(ENUM_VitalsType).reduce((acc, key) => {
      acc[key] = ENUM_VitalsType[key as keyof typeof ENUM_VitalsType];
      return acc;
    }, {} as { [key: string]: string; });
    if (this.Field && this.Field.FieldConfig && this.Field.FieldConfig.PreTemplatePatientDetail) {
      let selectedPatient = this.Field.FieldConfig.PreTemplatePatientDetail;
      if (selectedPatient) {
        this.PatientId = selectedPatient.PatientId;
        this.PatientVisitId = selectedPatient.PatientVisitId;

      }
      this.GetMSTVitals();
      this.GetVitalsByPatientIdAndPatientVisitId(this.PatientId, this.PatientVisitId, this.IsAcrossVisitAvailability);
      this.GetPatientLatestVitalsByPatientIdAndPatientVisitId(this.PatientId, this.PatientVisitId);
    }

  }

  GetMSTVitals(): void {
    this._clinicalBLService.GetMSTVitals()
      .subscribe((res: DanpheHTTPResponse): void => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          if (res.Results && res.Results.length > 0) {
            this.AllMSTVitals = res.Results;
            this.ProcessForVitalsTableHeading();
            this.ShowVitalsTable = true;
            this.ShowBiometricsTable = true;
          }
          else {
            this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, [`MST Vitals is empty.`]);
          }
        }
        else {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, [`Failed: ${res.ErrorMessage}`]);
        }
      },
        (err: DanpheHTTPResponse): void => {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Exception: ${err.ErrorMessage}`]);
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
    this.GroupedVitalsList = this.GroupedMSTVitalsList.filter(item =>
      item.VitalsType === ENUM_VitalsType.Vitals || item.VitalsType === ENUM_VitalsType.AssessmentScale
    );
    this.GroupedVitalsList.sort((a, b) => a.DisplayOrder - b.DisplayOrder);
    // console.log(this.GroupedVitalsList);
    this.GroupedBiometricsList = this.GroupedMSTVitalsList.filter(item => item.VitalsType === ENUM_VitalsType.Biometric);
    this.GroupedBiometricsList.sort((a, b) => a.DisplayOrder - b.DisplayOrder);
    // console.log(this.GroupedBiometricsList);
  }


  GetColSpanForVitals(): number {
    return this.GroupedVitalsList.length + 1;
  }

  GetColSpanForBiometrics(): number {
    return this.GroupedBiometricsList.length + 1;
  }

  GetColSpanForLatestVitals(): number {
    return this.GroupedLatestPatientVitalsList.length + 1;
  }


  GetVitalsByPatientIdAndPatientVisitId(patientId: number, patientVisitId: number, isAcrossVisitAvailability: boolean): void {
    this._clinicalBLService.GetVitalsByPatientIdAndPatientVisitId(patientId, patientVisitId, isAcrossVisitAvailability)
      .subscribe((res: DanpheHTTPResponse): void => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          if (res.Results.length) {
            this.PatientAllVitals = res.Results;
            this.ProcessPatientAllVitals();
          }
          else {
          }
        }
        else {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, [`No vitals available for current patient.`]);
        }
      },
        (err: DanpheHTTPResponse): void => {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Exception: ${err.ErrorMessage}`]);
        }
      );
  }

  GetPatientLatestVitalsByPatientIdAndPatientVisitId(patientId: number, patientVisitId: number): void {
    this._clinicalBLService.GetPatientLatestVitalsByPatientIdAndPatientVisitId(patientId, patientVisitId)
      .subscribe((res: DanpheHTTPResponse): void => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          if (res.Results.length) {
            this.LatestPatientVitals = res.Results;
            this.GroupedLatestPatientVitals = this.LatestPatientVitals.reduce((acc, curr) => {
              const group = curr.VitalsGroup;
              if (!acc[group]) {
                acc[group] = [];
              }
              acc[group].push(curr);
              return acc;
            }, {});
            // console.log('LatestPatientVitals');
            // console.log(this.LatestPatientVitals);
            // console.log(this.GroupedLatestPatientVitals);
            const groupedArray = Object.values(this.GroupedLatestPatientVitals);
            this.GroupedLatestPatientVitalsList = new Array<LatestVitals>();
            groupedArray.forEach(element => {
              let item = new LatestVitals();
              item.DisplayOrder = element[0].DisplayOrder;
              item.CreatedOn = element[0].CreatedOn;
              item.VitalsGroup = element[0].VitalsGroup;
              item.Unit = element[0].Unit;
              if (element.length === 1) {
                item.VitalsValue = element[0].VitalsValue;
              }
              else if (element.length > 1) {
                item.VitalsValue = element.map(e => e.VitalsValue).join('/');
              }
              this.GroupedLatestPatientVitalsList.push(item);
              const containsHeight = this.GroupedLatestPatientVitalsList.some(item => item.VitalsGroup === 'Height');
              const containsWeight = this.GroupedLatestPatientVitalsList.some(item => item.VitalsGroup === 'Weight');

              if (containsHeight && containsWeight) {
                const heightVital = this.GroupedLatestPatientVitalsList.find(item => item.VitalsGroup === 'Height');
                const weightVital = this.GroupedLatestPatientVitalsList.find(item => item.VitalsGroup === 'Weight');

                if (heightVital && weightVital) {
                  const heightInCm = heightVital.VitalsValue;
                  const weightInKg = weightVital.VitalsValue;

                  const heightInMeter = Number(heightInCm) / 100;
                  const bmi = Number(weightInKg) / (heightInMeter * heightInMeter);

                  this.BMI_ValueOnLatestVitals = Math.round(bmi * 100) / 100;
                  this.ShowBMIOnLatestVitals = true;
                }
                else {
                  this.BMI_ValueOnLatestVitals = null;
                }
              }
              else {
                this.ShowBMIOnLatestVitals = false;
              }
              this.ShowLatestVitals = true;
            });
            // console.log(this.GroupedLatestPatientVitalsList);
          }
          else {
          }
        }
        else {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, [`No vitals available for current patient.`]);
        }
      },
        (err: DanpheHTTPResponse): void => {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Exception: ${err.ErrorMessage}`]);
        }
      );
  }

  ProcessPatientAllVitals(): void {
    const patientVitals = this.PatientAllVitals.filter(v => v.VitalsType === ENUM_VitalsType.Vitals || v.VitalsType === ENUM_VitalsType.AssessmentScale);
    const patientBiometrics = this.PatientAllVitals.filter(v => v.VitalsType === ENUM_VitalsType.Biometric);
    this.GroupPatientVitals(patientVitals);
    this.GroupPatientBiometrics(patientBiometrics);
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

        return {
          VitalsData: [{
            CreatedBy: null,
            CreatedOn: createdOn,
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
    this.GroupedPatientVitals = groupedArray;
    // console.log(groupedArray);
  }

  GroupPatientBiometrics(patientBiometrics: GetClnVitalsTXN_DTO[]) {
    const groupedVitalsByCreatedOn = patientBiometrics.reduce((acc, obj) => {
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

        return {
          VitalsData: [{
            CreatedBy: null,
            CreatedOn: createdOn,
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

    // console.log(groupedArray);
    this.GroupedPatientBiometrics = groupedArray;
  }

}
