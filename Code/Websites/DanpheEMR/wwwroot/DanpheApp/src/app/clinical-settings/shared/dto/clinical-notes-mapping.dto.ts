import { FormBuilder, FormGroup } from "@angular/forms";

export class ClinicalNotesMapping_DTO {
  ClinicalMapComponentId: number = 0;
  ClinicalNotesMasterId: number = 0;
  DepartmentId: number = 0;
  EmployeeId: number = 0;
  ParentHeadingId: number = 0;
  ClinicalHeadingId: number = 0;
  FieldId: number = 0;
  SearchQuery: string = '';


  FieldList = Array<ClinicalFieldList_DTO>();
  public ClinicalNotesMappingValidator: FormGroup;

  constructor() {
    var _formBuilder = new FormBuilder();
    this.ClinicalNotesMappingValidator = _formBuilder.group({
      'EmployeeId': [''],
      'DepartmentId': [''],
      'ParentHeadingId': [''],
      'ClinicalHeadingId': [''],
      'FieldId': [''],
      'SearchQuery': [''],
      'SelectAllComponent': [''],
    });
  }

  public IsDirty(fieldName): boolean {
    if (fieldName === undefined)
      return this.ClinicalNotesMappingValidator.dirty;
    else
      return this.ClinicalNotesMappingValidator.controls[fieldName].dirty;
  }


  public IsValidCheck(fieldName, validator): boolean {

    if (fieldName === undefined) {
      return this.ClinicalNotesMappingValidator.valid;
    }
    else
      return !(this.ClinicalNotesMappingValidator.hasError(validator, fieldName));
  }

}

export class ClinicalFieldList_DTO {

  ClinicalMapComponentId: number = 0;
  ClinicalHeadingId: number = 0;
  ClinicalNotesMasterId: number = 0;
  ParentHeadingId: number = 0;
  DisplaySequence: number = 0;
  FieldId: number = 0;
  FieldName: string = null;
  IsActive: boolean;
  InputType: string = "";


}
export class FilteredMedicalComponents_DTO {
  FieldId: number = 0;
  ClinicalNotesMasterId: number = 0;
  ClinicalHeadingId: number = 0;
  FieldName: string = null;
  IsMapped: boolean = false;


}
