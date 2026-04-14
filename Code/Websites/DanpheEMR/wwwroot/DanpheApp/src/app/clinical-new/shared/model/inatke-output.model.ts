import {
    FormBuilder,
    FormGroup,
    Validators
} from '@angular/forms';
export class IntakeOutput {
    InputOutputId: number = 0;
    PatientVisitId: number = 0;
    InputOutputParameterMainId: number = 0;
    InputOutputParameterChildId: number = null;
    IntakeOutputValue: number = null;
    Balance: number = 0;
    Unit: string = "ml";
    IntakeOutputType: string = null;
    CreatedBy: number = null;
    ModifiedBy: number = null;
    CreatedOn: string = null;
    public ModifiedOn: string = null;
    Color: string = null;
    Quality: string = null;
    Remarks: string = null;
    Contents: string = null;
    RecordedDate: string = null;
    RecordedTime: string = null;
    ParameterMainValue: string = null;
    ParameterChildValue: string = null;
    IntakeOutputValidator: FormGroup = null;

    constructor() {
        var _formBuilder = new FormBuilder();
        this.IntakeOutputValidator = _formBuilder.group({
            'IntakeOutputValue': ['', Validators.compose([Validators.required])],
            'IntakeOutputType': ['', Validators.compose([Validators.required])],
            'Remarks': [''],
            'Color': [''],
            'Quality': ['']
        });
    }
    public IsDirty(fieldName): boolean {
        if (fieldName == undefined)
            return this.IntakeOutputValidator.dirty;
        else
            return this.IntakeOutputValidator.controls[fieldName].dirty;
    }

    public IsValid(): boolean { if (this.IntakeOutputValidator.valid) { return true; } else { return false; } } public IsValidCheck(fieldName, validator): boolean {
        if (fieldName == undefined)
            return this.IntakeOutputValidator.valid;
        else
            return !(this.IntakeOutputValidator.hasError(validator, fieldName));
    }
}