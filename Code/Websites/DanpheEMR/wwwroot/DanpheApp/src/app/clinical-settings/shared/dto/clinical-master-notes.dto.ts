import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from "@angular/forms";
import { ClinicalNoteInfo } from "./clinical-note-info.dto";

export class ClinicalMasterNotes_DTO {
  ClinicalNotesMasterId: number = 0;
  ClinicalNotesCode: string = null;
  ClinicalNotesName: string = null;
  DisplaySequence: number = 0;
  IsDefault: boolean;
  IsActive: boolean = true;
  public ClinicalNotesValidator: FormGroup;
  ClinicalNotesInfo: Array<ClinicalNoteInfo> = new Array<ClinicalNoteInfo>();


  constructor() {
    var _formBuilder = new FormBuilder();
    this.ClinicalNotesValidator = _formBuilder.group({
      'ClinicalNotesName': ['', Validators.compose([Validators.required])],
      'ClinicalNotesCode': ['', Validators.compose([Validators.required])],
      'DisplaySequence': ['', Validators.compose([Validators.required, Validators.min(1)])],
      'IsDefault': [false, this.isDefaultValidator.bind(this)]


    });
  }

  isDefaultValidator(control: AbstractControl): ValidationErrors | null {
    if (control.value) { // Only validate if the current IsDefault is checked
      const isAnyOtherDefault = this.ClinicalNotesInfo
        .some(note => note.ClinicalNoteId !== this.ClinicalNotesMasterId && note.IsDefault);
      
      if (isAnyOtherDefault) {
        return { multipleDefaults: 'Only one clinical note can be set as default' };
      }
    }
    return null;
  }

  public IsDirty(fieldName): boolean {
    if (fieldName === undefined)
      return this.ClinicalNotesValidator.dirty;
    else
      return this.ClinicalNotesValidator.controls[fieldName].dirty;
  }


  public IsValidCheck(fieldName, validator): boolean {

    if (fieldName === undefined) {
      return this.ClinicalNotesValidator.valid;
    }
    else
      return !(this.ClinicalNotesValidator.hasError(validator, fieldName));
  }

}
