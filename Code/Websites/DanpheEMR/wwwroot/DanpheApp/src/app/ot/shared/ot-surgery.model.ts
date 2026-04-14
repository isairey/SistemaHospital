import { FormBuilder, FormGroup, Validators } from "@angular/forms";

export class OTSurgeryModel {

    SurgeryId: number = 0;
    SurgeryName: string = '';
    SurgeryCode: string = '';
    Description: string = '';
    IsActive: boolean = false;
    OTSurgeryValidator: FormGroup = null;

    constructor() {
        let _formBuilder = new FormBuilder();
        this.OTSurgeryValidator = _formBuilder.group({
            'SurgeryName': ['', Validators.compose([Validators.required])],
            'SurgeryCode': ['', Validators.compose([Validators.required])],
            'Description': ['',],
            'IsActive': [true, Validators.compose([Validators.required])],
        });
    }

    IsDirty(fieldName): boolean {
        if (fieldName === undefined) {
            return this.OTSurgeryValidator.dirty;
        }
        else {
            return this.OTSurgeryValidator.controls[fieldName].dirty;
        }
    }

    IsValid(fieldName, validator): boolean {
        if (this.OTSurgeryValidator.valid) {
            return true;
        }
        if (fieldName === undefined) {
            return this.OTSurgeryValidator.valid;
        }
        else {
            return !(this.OTSurgeryValidator.hasError(validator, fieldName));
        }
    }

    IsValidCheck(fieldName, validator): boolean {
        if (this.OTSurgeryValidator.valid) {
            return true;
        }
        if (fieldName === undefined) {
            return this.OTSurgeryValidator.valid;
        }
        else {
            return !(this.OTSurgeryValidator.hasError(validator, fieldName));
        }
    }
}