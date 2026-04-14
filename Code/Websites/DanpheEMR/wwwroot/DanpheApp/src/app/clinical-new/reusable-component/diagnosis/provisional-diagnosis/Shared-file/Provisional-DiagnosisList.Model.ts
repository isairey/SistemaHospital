import {
    FormBuilder,
    FormGroup,
    Validators
} from '@angular/forms';

export class ProvisionalSelectedList {
    Active: boolean = false;
    ICD10Code: string = '';
    ICD10Id: number = 0;
    icd10Description: string = '';
    Diagnosis: string = '';
    provisonalDiagnosis: string = '';
    Remarks: string = '';
    public ProvisionalValidator: FormGroup = null;


    constructor() {

        var _formBuilder = new FormBuilder();
        this.ProvisionalValidator = _formBuilder.group({
            provisonalDiagnosis: ['', Validators.required],
            Remarks: [''],
        });
    }
    public IsDirty(fieldName): boolean {
        if (fieldName == undefined)
            return this.ProvisionalValidator.dirty;
        else
            return this.ProvisionalValidator.controls[fieldName].dirty;
    }
    public IsValid(): boolean { if (this.ProvisionalValidator.valid) { return true; } else { return false; } } public IsValidCheck(fieldName, validator): boolean {
        if (fieldName == undefined)
            return this.ProvisionalValidator.valid;
        else
            return !(this.ProvisionalValidator.hasError(validator, fieldName));
    }

}