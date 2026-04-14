import { FormBuilder, FormGroup, Validators } from "@angular/forms";
export class ClinicalHeading_DTO {
  ClinicalHeadingId: number = 0;
  ClinicalHeadingName: string = null;
  DisplayName: string = null;
  DisplayOrder: number = 0;
  IsDefault: boolean = false;
  IsActive: boolean = false;
  ParentId: number = 0;
  Code: string = null;
  ParentHeadingName: string = null;
  HeadingType: string = null;
  //IsActive: boolean = false;

  public CLNHeadingValidator: FormGroup;

  constructor() {
    const _formBuilder = new FormBuilder();
    this.CLNHeadingValidator = _formBuilder.group({
      'ClinicalHeadingName': ['', Validators.compose([Validators.required])],
      'DisplayName': ['', Validators.compose([Validators.required])],
      'DisplayOrder': ['', Validators.compose([Validators.required, Validators.min(1)])],
      'ParentId': [''],
      'IsDefault': [false],
      'IsActive': [false]
      //'HeadingType': ['', Validators.required],


    });
  }

  public IsValidCheck(fieldName, validator): boolean {

    if (fieldName == undefined) {
      return this.CLNHeadingValidator.valid;
    }
    else
      return !(this.CLNHeadingValidator.hasError(validator, fieldName));
  }
}
export class ParentHeading_DTO {
  ParentId: number = 0;
  ParentHeadingName: string = null;

}

