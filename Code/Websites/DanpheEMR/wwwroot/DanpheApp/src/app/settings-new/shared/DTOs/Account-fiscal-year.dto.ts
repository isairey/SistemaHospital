import { FormBuilder, FormGroup, Validators } from "@angular/forms";

export class AccountFiscalYear {
    public FiscalYearId: number = 0;
    public FiscalYearName: string = '';
    public StartDate: string;
    public EndDate: string;
    public EmployeeId: number = 0;
    public EmployeeFullName: string = '';
    public IsActive: boolean;
    public HospitalId: number = 0;

    AccountFiscalYearGroup: FormGroup;
    constructor() {
        const _formBuilder = new FormBuilder();
        this.AccountFiscalYearGroup = _formBuilder.group({
            'FiscalYearName': ['', Validators.compose([Validators.required])],
            'StartDate': ['', Validators.required],
            'EndDate': ['', Validators.required],
            'HospitalId': ['', Validators.required],
        },);
    }
    public IsValidCheck(fieldName, validator): boolean {
        if (fieldName == undefined) {
            return this.AccountFiscalYearGroup.valid;
        }
        else
            return !(this.AccountFiscalYearGroup.hasError(validator, fieldName));
    }

}