import {
    FormBuilder,
    FormGroup
} from '@angular/forms';
export class ICDDiagnonsis {
    Active: boolean = false;
    Diagnosis: string = '';
    ICD10Code: string = '';
    ICD10Id: number = 0;
    icd10Description: string = '';
    IsCauseOfDeath: boolean = false;
    provisonalDiagnosis: any;
    public FinalDiagnosisValidator: FormGroup = null;
    Remarks: string = '';

    constructor() {

        var _formBuilder = new FormBuilder();
        this.FinalDiagnosisValidator = _formBuilder.group({
            IsCauseOfDeath: [false],
            Remarks: [''],
        });
    }
    public IsDirty(fieldName): boolean {
        if (fieldName == undefined)
            return this.FinalDiagnosisValidator.dirty;
        else
            return this.FinalDiagnosisValidator.controls[fieldName].dirty;
    }
    public IsValid(): boolean { if (this.FinalDiagnosisValidator.valid) { return true; } else { return false; } } public IsValidCheck(fieldName, validator): boolean {
        if (fieldName == undefined)
            return this.FinalDiagnosisValidator.valid;
        else
            return !(this.FinalDiagnosisValidator.hasError(validator, fieldName));
    }

}