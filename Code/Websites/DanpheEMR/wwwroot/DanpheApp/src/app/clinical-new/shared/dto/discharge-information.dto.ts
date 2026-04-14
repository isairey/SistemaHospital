import { FormBuilder, FormGroup, Validators } from "@angular/forms";

export class DischargeInformation_DTO {
  DischargeInformationId: number = 0;
  DischargeTypeId: number = 0;
  SubDischargeTypeId: number = 0;
  CheckdById: number = 0;
  DoctorInchargeId: number = 0;
  ResidentDrId: number = 0;
  DischargeNurseId: number = 0;
  IsOtPatient: boolean = false;
  OperationType: string = null;
  OperationDate: string = null;
  Consultant: string = '';
  AnaesthetistId: number = 0;

  public DischargeInfoValidator: FormGroup;

  constructor() {
    const _formBuilder = new FormBuilder();
    this.DischargeInfoValidator = _formBuilder.group({
      'DischargeTypeId': ['', Validators.compose([Validators.required])],
      'DoctorInchargeId': ['', Validators.compose([Validators.required])],
      'OperationType': [''],
      'SubDischargeTypeId': [''],
      'CheckdById': [''],
      'ResidentDrId': [''],
      'DischargeNurseId': [''],
      'AnaesthetistId': [''],
      'IsOtPatient': [false],
      'OperationDate': [''],


    });
  }

  public IsValidCheck(fieldName, validator): boolean {

    if (fieldName == undefined) {
      return this.DischargeInfoValidator.valid;
    }
    else
      return !(this.DischargeInfoValidator.hasError(validator, fieldName));
  }
}
