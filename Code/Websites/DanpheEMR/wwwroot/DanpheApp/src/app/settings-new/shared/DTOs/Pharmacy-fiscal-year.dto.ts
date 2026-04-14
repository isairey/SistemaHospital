import { FormBuilder, FormGroup, Validators } from "@angular/forms";

export class PharmacyFiscalYear_DTO {
    public FiscalYearId: number = 0;
    public FiscalYearName: string = '';
    public StartDate: string;
    public EndDate: string;
    public EmployeeId: number = 0;
    public EmployeeFullName: string = '';
    public IsActive: boolean;


    PharmacyYearGroup: FormGroup;
    constructor() {
        const _formBuilder = new FormBuilder();
        this.PharmacyYearGroup = _formBuilder.group({
            'FiscalYearName': ['', Validators.compose([Validators.required])],
            'StartDate': ['', Validators.required],
            'EndDate': ['', Validators.required],

        },);
    }
    public IsValidCheck(fieldName, validator): boolean {
        if (fieldName == undefined) {
            return this.PharmacyYearGroup.valid;
        }
        else
            return !(this.PharmacyYearGroup.hasError(validator, fieldName));
    }

}