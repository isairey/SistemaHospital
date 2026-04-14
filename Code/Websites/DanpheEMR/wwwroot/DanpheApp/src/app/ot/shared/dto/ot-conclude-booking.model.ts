import { FormBuilder, FormGroup, Validators } from "@angular/forms";

export class OTConcludeBookingModel {
    OTStartTime: string = "";
    OTConcludeTime: string = "";
    IsOnScheduledTime: boolean = true;
    OutTimeCharge: number = 0;
    ConcludeRemarks: string = "";
    IsSeroPositive: boolean = false;
    ConcludeBookingValidator: FormGroup;

    constructor() {
        const _formBuilder = new FormBuilder();
        this.ConcludeBookingValidator = _formBuilder.group({
            'OTStartTime': ['', Validators.compose([Validators.required])],
            'OTConcludeTime': ['', Validators.compose([Validators.required])],
        });
    }
}