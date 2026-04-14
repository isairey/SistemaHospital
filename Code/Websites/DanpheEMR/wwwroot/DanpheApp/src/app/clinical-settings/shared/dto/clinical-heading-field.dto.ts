import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ClinicalSettingsService } from "../clinical-settings.service";

export class ClinicalHeadingField_DTO {
  FieldId: number = 0;
  FieldName: string = null;
  FieldDisplayName: string = null;
  InputType: string = null;
  ClinicalHeadingId: number = 0;
  IsActive: boolean = true;
  ParentClinicalHeadingName: string = null;
  ClinicalHeadingName: string = null;
  ParentHeadingId: number = 0;
  ParentId: number = 0;
  IsIPD: boolean = true;
  IsOPD: boolean = true;
  IsEmergency: boolean = true;
  OptionValue: string = null;
  GroupName: string = null;
  IsAcrossVisitAvailability: boolean = false;
  IsDisplayTitle: boolean = false;



  public CLNHeadingFieldValidator: FormGroup;
  constructor() {
    const _clinicalSettingsService = new ClinicalSettingsService();
    let _formBuilder = new FormBuilder();
    this.CLNHeadingFieldValidator = _formBuilder.group({
      'FieldName': ['', Validators.compose([Validators.required])],
      'InputType': ['', Validators.compose([Validators.required])],
      // 'ClinicalHeadingId': ['', Validators.compose([Validators.required])],
      //'ParentHeadingId': ['', Validators.compose([Validators.required])],
      'OptionValue': [''],
      'IsIPD': [this.IsIPD],
      'IsOPD': [this.IsOPD],
      'IsEmergency': [this.IsEmergency],
      'GroupName': [''],
      'IsAcrossVisitAvailability': [false],
      'IsDisplayTitle': [],
    }, {
      validator: _clinicalSettingsService.AtLeastOneVisitSelected
    });
  }
  public IsValidCheck(fieldName, validator): boolean {

    if (fieldName == undefined) {
      return this.CLNHeadingFieldValidator.valid;
    }
    else
      return !(this.CLNHeadingFieldValidator.hasError(validator, fieldName));
  }
}

