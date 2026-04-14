import {
    FormBuilder,
    FormGroup,
    Validators
} from '@angular/forms';
export class CLN_BloodSugarMonitoring {
    BloodSugarMonitoringId: number = 0;
    PatientId: number = 0;
    PatientVisitId: number = 0;
    EntryDateTime: string = null;
    IsActive: boolean = false;
    RbsValue: number = null;
    Insulin: number = null;
    EnteredBy: string = null;
    Remarks: string = null;
    CreatedBy: number = null;
    CreatedOn: string = null;
    ModifiedOn: string = null;
    ModifiedBy: number = null;
    RecordedDate: string = null;
    RecordedTime: string = null;
    BloodSugarValidator: FormGroup = null;

    constructor() {
        const _formBuilder = new FormBuilder();
        this.BloodSugarValidator = _formBuilder.group({
            'RbsValue': ['', Validators.compose([Validators.required])],
            'Insulin': ['', Validators.compose([Validators.required])],
            'Remarks': ['']
        });
    }

    public IsDirty(fieldName): boolean {
        if (fieldName == undefined)
            return this.BloodSugarValidator.dirty;
        else
            return this.BloodSugarValidator.controls[fieldName].dirty;
    }

    public IsValid(): boolean { if (this.BloodSugarValidator.valid) { return true; } else { return false; } } public IsValidCheck(fieldName, validator): boolean {
        if (fieldName == undefined)
            return this.BloodSugarValidator.valid;
        else
            return !(this.BloodSugarValidator.hasError(validator, fieldName));
    }
}
