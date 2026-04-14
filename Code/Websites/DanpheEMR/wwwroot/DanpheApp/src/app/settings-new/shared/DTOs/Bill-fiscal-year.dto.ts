import { FormBuilder, FormGroup, Validators } from "@angular/forms";

export class BillFiscalYear {
    public FiscalYearId: number = 0;
    public FiscalYearName: string = '';
    public StartYear: string;
    public EndYear: string;
    public EmployeeId: number = 0;
    public EmployeeFullName: string = '';
    public IsActive: boolean;

    BillFiscalYearGroup: FormGroup;
    constructor() {
        const _formBuilder = new FormBuilder();
        this.BillFiscalYearGroup = _formBuilder.group({
            'FiscalYearName': ['', Validators.compose([Validators.required])],
            'StartYear': ['', Validators.required],
            'EndYear': ['', Validators.required],
        },);
    }
    public IsValidCheck(fieldName, validator): boolean {
        if (fieldName == undefined) {
            return this.BillFiscalYearGroup.valid;
        }
        else
            return !(this.BillFiscalYearGroup.hasError(validator, fieldName));
    }

}