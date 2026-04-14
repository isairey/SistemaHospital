import { Component, OnInit } from '@angular/core';
import { CoreService } from '../../../core/shared/core.service';
import { DanpheHTTPResponse } from '../../../shared/common-models';
import { MessageboxService } from '../../../shared/messagebox/messagebox.service';
import { ENUM_ClinicalField_InputType, ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status, ENUM_VitalsType } from '../../../shared/shared-enums';
import { ClinicalPatientService } from '../../shared/clinical-patient.service';
import { ClinicalNoteBLService } from '../../shared/clinical.bl.service';
import { Field } from '../../shared/dto/field.dto';
import { LatestVitals } from '../../shared/dto/get-cln-latest-vitals.dto';
import { GetClnVitalsTXN_DTO } from '../../shared/dto/get-cln-vitals-txn.dto';
import { GetClnVitals_DTO } from '../../shared/dto/get-cln-vitals.dto';
import { PostClnVitalsTxn_DTO } from '../../shared/dto/post-cln-vitals-txn.dto';
import { AddVitalsObjectModel } from '../../shared/model/add-vitals-object.model';
import { VitalsHeadingModel } from '../../shared/model/vitals-heading.model';

@Component({
  selector: 'vitals-new',
  templateUrl: './vitals-new.component.html',
  styleUrls: ['./vitals-new.component.css'],
  host: { '(window:keyup)': 'hotkeys($event)' }
})

export class VitalsNewComponent implements OnInit {
  Field: Field;
  IsAcrossVisitAvailability: boolean = false;
  PatientId: number = 0;
  PatientVisitId: number = 0;
  AllMSTVitals = new Array<GetClnVitals_DTO>();
  MSTVitals = new Array<AddVitalsObjectModel>();
  MSTBiometrics = new Array<AddVitalsObjectModel>();
  PatientAllVitals = new Array<GetClnVitalsTXN_DTO>();
  ShowVitalsTable: boolean = false;
  ShowBiometricsTable: boolean = false;
  ShowAddVitals: boolean = false;
  ShowAddBiometrics: boolean = false;
  ShowLatestVitals: boolean = false;
  GroupedMSTVitalsList = new Array<VitalsHeadingModel>();
  GroupedVitalsList = new Array<VitalsHeadingModel>();
  GroupedBiometricsList = new Array<VitalsHeadingModel>();
  GroupedMSTVitals: { [key: string]: GetClnVitals_DTO[]; };
  GroupedVitals: { [key: string]: GetClnVitals_DTO[]; };
  GroupedBiometrics: { [key: string]: GetClnVitals_DTO[]; };
  AddVitalsObject = new Array<AddVitalsObjectModel>();
  NewVitalsData = new Array<PostClnVitalsTxn_DTO>();
  loading: boolean = false;
  VitalsType: string = "";
  GroupedPatientVitals: any;
  GroupedPatientBiometrics: any;
  ShowBMIOnAddNewVitals: boolean = false;
  ShowBMIOnLatestVitals: boolean = false;
  BMI = { BMIBiometricsName: "BMI", Unit: "Kg/m2" };
  BMI_ValueOnAddNewVitals: number = 0;
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
    private _selectedPatientsService: ClinicalPatientService
  ) {
    this.InputTypes = Object.keys(ENUM_ClinicalField_InputType).reduce((acc, key) => {
      acc[key] = ENUM_ClinicalField_InputType[key as keyof typeof ENUM_ClinicalField_InputType];
      return acc;
    }, {} as { [key: string]: string; });
    this.VitalTypes = Object.keys(ENUM_VitalsType).reduce((acc, key) => {
      acc[key] = ENUM_VitalsType[key as keyof typeof ENUM_VitalsType];
      return acc;
    }, {} as { [key: string]: string; });
  }

  ngOnInit(): void {
    if (this.Field) {
      this.IsAcrossVisitAvailability = this.Field.IsAcrossVisitAvailability;
    } else {
      this.IsAcrossVisitAvailability = false;
    }
    let selectedPatient = this._selectedPatientsService.SelectedPatient;
    if (selectedPatient) {
      this.PatientId = selectedPatient.PatientId;
      this.PatientVisitId = selectedPatient.PatientVisitId;
    }
    this.GetMSTVitals();
    this.GetVitalsByPatientIdAndPatientVisitId(this.PatientId, this.PatientVisitId, this.IsAcrossVisitAvailability);
    this.GetPatientLatestVitalsByPatientIdAndPatientVisitId(this.PatientId, this.PatientVisitId);
  }

  hotkeys(event: any): void {
    if (event.keyCode === 27) {
      if (this.VitalsType === ENUM_VitalsType.Vitals) {
        this.CloseAddVitalsPage();
      }
      else if (this.VitalsType === ENUM_VitalsType.Biometric) {
        this.CloseAddBiometricsPage();
      }
    }
  }

  GetMSTVitals(): void {
    this._clinicalBLService.GetMSTVitals()
      .subscribe((res: DanpheHTTPResponse): void => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          if (res.Results && res.Results.length > 0) {
            this.AllMSTVitals = res.Results;
            this.InitializeForAddVitals();
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

  InitializeForAddVitals(): void {
    this.CreatePostObject();
    this.InitializeVitalsLabelAndInputField();

  }

  CreatePostObject(): void {
    this.AddVitalsObject = new Array<AddVitalsObjectModel>();
    this.AllMSTVitals.forEach(element => {
      const vital = new AddVitalsObjectModel();
      vital.PatientId = this.PatientId;
      vital.PatientVisitId = this.PatientVisitId;
      vital.VitalsValue = "";
      vital.VitalsName = element.VitalsName;
      vital.VitalsType = element.VitalsType;
      vital.VitalsId = element.VitalsId;
      vital.Unit = element.Unit;
      vital.OtherVariable = "";
      vital.Remarks = "";
      vital.DisplayOrder = element.DisplayOrder;
      vital.VitalsGroup = element.VitalsGroup;
      vital.InputType = element.InputType;
      vital.IsActive = true;
      this.AddVitalsObject.push(vital);
    });
    this.MSTVitals = this.AddVitalsObject.filter(v => v.VitalsType === ENUM_VitalsType.Vitals || v.VitalsType === ENUM_VitalsType.AssessmentScale);
    this.MSTBiometrics = this.AddVitalsObject.filter(v => v.VitalsType === ENUM_VitalsType.Biometric);
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
    console.log(this.GroupedVitalsList);
    this.GroupedBiometricsList = this.GroupedMSTVitalsList.filter(item => item.VitalsType === ENUM_VitalsType.Biometric);
    this.GroupedBiometricsList.sort((a, b) => a.DisplayOrder - b.DisplayOrder);
    console.log(this.GroupedBiometricsList);
  }

  InitializeVitalsLabelAndInputField(): void {
    const sortedVitals = this.MSTVitals.sort((a, b) => a.DisplayOrder - b.DisplayOrder);
    const sortedBiometrics = this.MSTBiometrics.sort((a, b) => a.DisplayOrder - b.DisplayOrder);

    this.GroupedVitals = sortedVitals.reduce((acc, curr) => {
      const group = curr.VitalsGroup;
      if (!acc[group]) {
        acc[group] = [];
      }
      acc[group].push(curr);
      return acc;
    }, {});

    this.GroupedBiometrics = sortedBiometrics.reduce((acc, curr) => {
      const group = curr.VitalsGroup;
      if (!acc[group]) {
        acc[group] = [];
      }
      acc[group].push(curr);
      return acc;
    }, {});

    // Check if GroupedBiometrics contains 'Height' and 'Weight'
    let vitalsNames: string[] = [];
    Object.values(this.GroupedBiometrics).forEach(biometrics => {
      biometrics.forEach(biometric => {
        vitalsNames.push(biometric.VitalsName);
      });
    });

    if (vitalsNames.includes('Height') && vitalsNames.includes('Weight')) {
      this.ShowBMIOnAddNewVitals = true;
    } else {
      this.ShowBMIOnAddNewVitals = false;
    }
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

  GetGroupKeys(): string[] {
    return Object.keys(this.GroupedMSTVitals);
  }

  GetObjectKeys(obj): string[] {
    console.log(`Label : ${Object.keys(obj)}`);
    return Object.keys(obj);
  }

  SaveVitals(): void {
    console.log(this.GroupedVitals);
    let vitalsWithNumberInputType = new Array<AddVitalsObjectModel>();
    if (this.VitalsType === ENUM_VitalsType.Vitals) {
      vitalsWithNumberInputType = this.AddVitalsObject.filter(v => v.InputType === ENUM_ClinicalField_InputType.Number && v.VitalsType === ENUM_VitalsType.Vitals);
    }
    else if (this.VitalsType === ENUM_VitalsType.Biometric) {
      vitalsWithNumberInputType = this.AddVitalsObject.filter(v => v.InputType === ENUM_ClinicalField_InputType.Number && v.VitalsType === ENUM_VitalsType.Biometric);
    }
    let isValid = false;
    if (vitalsWithNumberInputType) {
      if (this.AddVitalsObject) {
        const vitalsToCheck = [
          { name: "Pain Score (At Rest)", key: "Pain Score (At Rest)", minValue: 0, maxValue: 10 },
          { name: "Pain Score (With Movement)", key: "Pain Score (With Movememt)", minValue: 0, maxValue: 10 },
          { name: "Sedation Score", key: "Sedation Score", minValue: 0, maxValue: 10 },
        ];

        const invalidVitals: string[] = [];
        vitalsToCheck.forEach((vitals) => {
          const vitalsObject = this.AddVitalsObject.find((item) => item.VitalsName === vitals.key);
          const vitalsValue = vitalsObject && vitalsObject.VitalsValue;

          const numericValue = vitalsValue ? Number(vitalsValue) : 0;
          if (numericValue < vitals.minValue || numericValue > vitals.maxValue) {
            invalidVitals.push(vitals.name);
          }
        });

        if (invalidVitals.length > 0) {
          invalidVitals.forEach((vitalsName) => {
            this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`${vitalsName} exceeds 10.`]);
          });
          return;
        }
      }
      isValid = vitalsWithNumberInputType.some(item => (item.VitalsValue.toString()).trim() !== '');
    }
    if (!isValid) {
      this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`At least one vitals entry is mandatory.`]);
      return;
    }
    this.AssignDataForPost();
    this.PostVitals();
  }

  AssignDataForPost(): void {
    if (this.AddVitalsObject) {
      if (this.VitalsType === ENUM_VitalsType.Vitals) {
        this.AddVitalsObject = this.AddVitalsObject.filter(v => v.VitalsType === ENUM_VitalsType.Vitals || v.VitalsType === ENUM_VitalsType.AssessmentScale);
      }
      else if (this.VitalsType === ENUM_VitalsType.Biometric) {
        this.AddVitalsObject = this.AddVitalsObject.filter(v => v.VitalsType === ENUM_VitalsType.Biometric);
      }
    }
    if (this.AddVitalsObject.length) {
      this.AddVitalsObject.forEach(addVitalsItem => {
        const newVitalsItem: PostClnVitalsTxn_DTO = new PostClnVitalsTxn_DTO();
        newVitalsItem.PatientId = addVitalsItem.PatientId;
        newVitalsItem.PatientVisitId = addVitalsItem.PatientVisitId;
        newVitalsItem.VitalsId = addVitalsItem.VitalsId;
        newVitalsItem.VitalsValue = addVitalsItem.VitalsValue ? addVitalsItem.VitalsValue : null;
        newVitalsItem.Unit = addVitalsItem.Unit;
        newVitalsItem.OtherVariable = addVitalsItem.OtherVariable;
        newVitalsItem.Remarks = addVitalsItem.Remarks;
        newVitalsItem.IsActive = addVitalsItem.IsActive;
        this.NewVitalsData.push(newVitalsItem);
      });
    }
  }

  PostVitals(): void {
    this.loading = true;
    this._clinicalBLService.AddVitals(this.NewVitalsData)
      .finally((): void => {
        this.loading = false;
        this.NewVitalsData = new Array<PostClnVitalsTxn_DTO>();
        this.GetVitalsByPatientIdAndPatientVisitId(this.PatientId, this.PatientVisitId, this.IsAcrossVisitAvailability);
        this.GetPatientLatestVitalsByPatientIdAndPatientVisitId(this.PatientId, this.PatientVisitId);
        if (this.VitalsType === ENUM_VitalsType.Vitals) {
          this.CloseAddVitalsPage();
        }
        else if (this.VitalsType === ENUM_VitalsType.Biometric) {
          this.CloseAddBiometricsPage();
        }
      })
      .subscribe((res: DanpheHTTPResponse): void => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          if (this.VitalsType === ENUM_VitalsType.Vitals) {
            this._messageBoxService.showMessage(ENUM_MessageBox_Status.Success, [`New Vitals Added Successfully.`]);
          }
          else if (this.VitalsType === ENUM_VitalsType.Biometric) {
            this._messageBoxService.showMessage(ENUM_MessageBox_Status.Success, [`New Biometrics Added Successfully.`]);
          }
          this.InitializeForAddVitals();
          this.BMI_ValueOnAddNewVitals = 0;
        }
        else {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, [`Unable to Add New Vitals.`]);
        }
      },
        (err: DanpheHTTPResponse): void => {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Exception: ${err.ErrorMessage}`]);
        }
      );
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
            console.log('LatestPatientVitals');
            console.log(this.LatestPatientVitals);
            console.log(this.GroupedLatestPatientVitals);
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
            console.log(this.GroupedLatestPatientVitalsList);
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

  GroupPatientVitals(patientVitals: GetClnVitalsTXN_DTO[]): void {
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
    console.log(groupedArray);
  }

  GroupPatientBiometrics(patientBiometrics: GetClnVitalsTXN_DTO[]): void {
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

    console.log(groupedArray);
    this.GroupedPatientBiometrics = groupedArray;
  }

  ShowAddVitalsPage(): void {
    this.InitializeForAddVitals();
    this.VitalsType = ENUM_VitalsType.Vitals;
    this.ShowAddVitals = true;
  }
  ShowAddBiometricsPage(): void {
    this.InitializeForAddVitals();
    this.BMI_ValueOnAddNewVitals = 0;
    this.VitalsType = ENUM_VitalsType.Biometric;
    this.ShowAddBiometrics = true;
  }

  CloseAddVitalsPage(): void {
    this.VitalsType = "";
    this.ShowAddVitals = false;
  }
  CloseAddBiometricsPage(): void {
    this.VitalsType = "";
    this.ShowAddBiometrics = false;
  }

  ClearValues(): void {
    if (this.VitalsType === ENUM_VitalsType.Vitals) {
      for (let key of Object.keys(this.GroupedVitals)) {
        for (let vital of this.GroupedVitals[key]) {
          vital.VitalsValue = '';
        }
      }
    }
    if (this.VitalsType === ENUM_VitalsType.Biometric) {
      for (let key of Object.keys(this.GroupedBiometrics)) {
        for (let vital of this.GroupedBiometrics[key]) {
          vital.VitalsValue = '';
        }
      }
      this.BMI_ValueOnAddNewVitals = 0;
    }
  }

  OnVitalsInput(vital: any): void {
    if (vital.InputType !== ENUM_ClinicalField_InputType.Number) {
      return;
    }
    // Ensure that negative values are set to zero
    if (vital.VitalsValue < 0) {
      vital.VitalsValue = 0;
    }

    if (this.VitalsType === ENUM_VitalsType.Biometric) {
      const heightVital = this.GroupedBiometrics['Height'] ? this.GroupedBiometrics['Height'][0] : null;
      const weightVital = this.GroupedBiometrics['Weight'] ? this.GroupedBiometrics['Weight'][0] : null;

      if (heightVital && Number(heightVital.VitalsValue) >= 0 && weightVital && Number(weightVital.VitalsValue) >= 0) {
        const heightInCm = heightVital.VitalsValue;
        const weightInKg = weightVital.VitalsValue;

        const heightInMeter = Number(heightInCm) / 100;
        const bmi = Number(weightInKg) / (heightInMeter * heightInMeter);

        this.BMI_ValueOnAddNewVitals = Math.round(bmi * 100) / 100;
      } else {
        this.BMI_ValueOnAddNewVitals = null;
      }
    }
  }

}
