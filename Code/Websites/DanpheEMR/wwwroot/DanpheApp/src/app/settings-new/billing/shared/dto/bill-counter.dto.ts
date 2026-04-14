import { FormBuilder, FormGroup, Validators } from "@angular/forms";

export class Bill_Counter {
    public CounterId: number = 0;
    public CounterName: string = '';
    public CounterType: string = '';
    public BeginningDate: string = '';
    public ClosingDate: string = '';
    public BranchId: number = 0;


    BillCounterGroup: FormGroup;

    constructor() {
        const _formBuilder = new FormBuilder();
        this.BillCounterGroup = _formBuilder.group({
            'CounterName': ['', Validators.compose([Validators.required])],
            'CounterType': [''],
            'BeginningDate': [''],
            'ClosingDate': [''],
        },);
    }
    public IsValidCheck(fieldName, validator): boolean {
        if (fieldName == undefined) {
            return this.BillCounterGroup.valid;
        }
        else
            return !(this.BillCounterGroup.hasError(validator, fieldName));
    }

}
