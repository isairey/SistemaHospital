import { FormBuilder, FormGroup, Validators } from "@angular/forms";

export class PatientFollowUp {
    FollowUpDays: number = 0;
    FollowUpRemarks: string = null;
    FollowUpDate: string = null;
    PatientVisitId: number = 0;
    public PatientFollowUpValidator: FormGroup;

    constructor() {

        var _formBuilder = new FormBuilder();
        this.PatientFollowUpValidator = _formBuilder.group({
            'FollowUpDays': ['', [Validators.required, Validators.min(1)]],
            'FollowUpDate': [''],
            'FollowUpRemarks': [''],
        });
    }
}