import { FormBuilder, FormGroup, Validators } from "@angular/forms";

export class AnaesthesiaTypeModel {

    AnaesthesiaTypeId: number = 0;
    AnaesthesiaType: string = "";
    CreatedOn: string = "";
    CreatedBy: number = 0;
    ModifiedOn: string = "";
    ModifiedBy: number = 0;
    IsActive: boolean = false;
    AnaesthesiaTypeValidator: FormGroup = null;

    constructor() {
        let _formBuilder = new FormBuilder();
        this.AnaesthesiaTypeValidator = _formBuilder.group({
            'AnaesthesiaType': [null, Validators.compose([Validators.required])],
            'IsActive': [true, Validators.compose([Validators.required])],
        });
    }

    IsDirty(fieldName): boolean {
        if (fieldName === undefined) {
            return this.AnaesthesiaTypeValidator.dirty;
        }
        else {
            return this.AnaesthesiaTypeValidator.controls[fieldName].dirty;
        }
    }

    IsValid(fieldName, validator): boolean {
        if (this.AnaesthesiaTypeValidator.valid) {
            return true;
        }
        if (fieldName === undefined) {
            return this.AnaesthesiaTypeValidator.valid;
        }
        else {
            return !(this.AnaesthesiaTypeValidator.hasError(validator, fieldName));
        }
    }

    IsValidCheck(fieldName, validator): boolean {
        if (this.AnaesthesiaTypeValidator.valid) {
            return true;
        }
        if (fieldName === undefined) {
            return this.AnaesthesiaTypeValidator.valid;
        }
        else {
            return !(this.AnaesthesiaTypeValidator.hasError(validator, fieldName));
        }
    }
}