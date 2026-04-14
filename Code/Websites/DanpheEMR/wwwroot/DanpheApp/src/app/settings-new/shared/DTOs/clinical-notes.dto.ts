import { FormBuilder, FormGroup, Validators } from "@angular/forms";

export class ClinicalNotes_DTO {
    public ClinicalNoteMasterId: number = 0;
    public DisplayName: string = '';
    public FieldName: string = '';
    public DisplayOrder: number = 0;
    public IsSystemDefault: boolean = false;
    public ClinicalNoteValidator: FormGroup = null;

    constructor() {
        var _formBuilder = new FormBuilder();
        this.ClinicalNoteValidator = _formBuilder.group({
            'DisplayName': ['', Validators.compose([Validators.required, Validators.maxLength(40)])],
            'FieldName': ['', Validators.compose([Validators.required, Validators.maxLength(40)])],
            'DisplayOrder': ['', Validators.compose([Validators.required])],
        });
    }

    public IsDirty(fieldName): boolean {
        if (fieldName == undefined)
            return this.ClinicalNoteValidator.dirty;
        else
            return this.ClinicalNoteValidator.controls[fieldName].dirty;
    }

    public IsValid(): boolean { if (this.ClinicalNoteValidator.valid) { return true; } else { return false; } }
    public IsValidCheck(fieldName, validator): boolean {
        if (fieldName == undefined) {
            return this.ClinicalNoteValidator.valid;
        }

        else
            return !(this.ClinicalNoteValidator.hasError(validator, fieldName));
    }


}