import { FormBuilder, FormGroup, Validators } from "@angular/forms";

export class ChiefComplain_DTO {
  ChiefComplainId: number = 0;
  MedicalCode: string = null;
  ChiefComplain: string = null;
  Remarks: string = null;
  IsActive: boolean = false;

  public chiefComplainValidator: FormGroup;

  constructor() {
    var _formBuilder = new FormBuilder();
    this.chiefComplainValidator = _formBuilder.group({
      'ChiefComplain': ['', Validators.compose([Validators.required])],
      'MedicalCode': ['', Validators.compose([Validators.required])],
      'Remarks': ['']


    });
  }
  public IsDirty(fieldName): boolean {
    if (fieldName === undefined)
      return this.chiefComplainValidator.dirty;
    else
      return this.chiefComplainValidator.controls[fieldName].dirty;
  }


  public IsValidCheck(fieldName, validator): boolean {

    if (fieldName === undefined) {
      return this.chiefComplainValidator.valid;
    }
    else
      return !(this.chiefComplainValidator.hasError(validator, fieldName));
  }
}


