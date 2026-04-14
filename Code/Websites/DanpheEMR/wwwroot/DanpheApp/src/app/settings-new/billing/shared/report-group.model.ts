import { FormBuilder, FormGroup, Validators } from "@angular/forms";

export class ReportGroupModel {

    DynamicReportGroupId: number;
    GroupName: string;
    CreatedBy: number = null;
    ModifiedBy: number = null;
    CreatedOn: string = null;
    ModifiedOn: string = null;
    IsActive: boolean = true;
    EmployeeName: string;
    EmployeeId: number;

    ReportGroupValidator: FormGroup = null;


    constructor() {

        const _formBuilder = new FormBuilder();
        this.ReportGroupValidator = _formBuilder.group({
            'GroupName': ['', Validators.compose([Validators.required])],
            'DynamicReportGroupId': ['']
        });
    }

    public IsDirty(fieldName): boolean {
        if (fieldName == undefined)
            return this.ReportGroupValidator.dirty;
        else
            return this.ReportGroupValidator.controls[fieldName].dirty;
    }

    public IsValid(): boolean { if (this.ReportGroupValidator.valid) { return true; } else { return false; } }
    public IsValidCheck(fieldName, validator): boolean {
        if (fieldName == undefined) {
            return this.ReportGroupValidator.valid;
        }

        else
            return !(this.ReportGroupValidator.hasError(validator, fieldName));
    }

}