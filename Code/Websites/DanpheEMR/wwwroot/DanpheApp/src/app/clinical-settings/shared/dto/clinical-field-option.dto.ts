import { FormBuilder, FormGroup, Validators } from "@angular/forms";

export class ClinicalFieldOption_DTO {
  ClinicalOptionId: number = 0;
  FieldId: number = 0;
  IsActive: boolean = true;
  Options: string = null;
  public CLNFieldOptionsValidator: FormGroup;

  constructor() {
    let _formBuilder = new FormBuilder();
    this.CLNFieldOptionsValidator = _formBuilder.group({
      'FieldId': [''],

      'Options': ['', Validators.compose([Validators.required])],




    });
  }
  public IsValidCheck(fieldName, validator): boolean {

    if (fieldName == undefined) {
      return this.CLNFieldOptionsValidator.valid;
    }
    else
      return !(this.CLNFieldOptionsValidator.hasError(validator, fieldName));
  }

}
export class CLNFieldOption_DTO {
  ClinicalOptionId: number = 0;
  FieldId: number = 0;
  Options: string = null;
  IsActive: boolean = true;
}
