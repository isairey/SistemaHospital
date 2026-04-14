import { FormBuilder, FormGroup, Validators } from "@angular/forms";

export class INVFiscalYear {
    public FiscalYearId: number = 0;
    public FiscalYearName: string = '';
    public StartDate: string;
    public EndDate: string;
    public EmployeeId: number = 0;
    public EmployeeFullName: string = '';
    public IsActive: boolean;


    INVFiscalYearGroup: FormGroup;
    constructor() {
        const _formBuilder = new FormBuilder();
        this.INVFiscalYearGroup = _formBuilder.group({
            'FiscalYearName': ['', Validators.compose([Validators.required])],
            'StartDate': ['', Validators.required],
            'EndDate': ['', Validators.required],

        },);
    }
    public IsValidCheck(fieldName, validator): boolean {
        if (fieldName == undefined) {
            return this.INVFiscalYearGroup.valid;
        }
        else
            return !(this.INVFiscalYearGroup.hasError(validator, fieldName));
    }

}