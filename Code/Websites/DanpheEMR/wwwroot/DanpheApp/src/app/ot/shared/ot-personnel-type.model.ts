import { FormBuilder, FormGroup, Validators } from "@angular/forms";

export class PersonnelTypeModel {

    PersonnelTypeId: number = 0;
    PersonnelType: string = null;
    IsIncentiveApplicable: boolean = false;
    IsActive: boolean = false;
    PersonnelTypeValidator: FormGroup = null;

    constructor() {
        let _formBuilder = new FormBuilder();
        this.PersonnelTypeValidator = _formBuilder.group({
            'PersonnelType': [null, Validators.compose([Validators.required])],
            'IsIncentiveApplicable': [false, Validators.compose([Validators.required])],
            'IsActive': [true, Validators.compose([Validators.required])],
        });
    }

    IsDirty(fieldName): boolean {
        if (fieldName === undefined) {
            return this.PersonnelTypeValidator.dirty;
        }
        else {
            return this.PersonnelTypeValidator.controls[fieldName].dirty;
        }
    }

    IsValid(fieldName, validator): boolean {
        if (this.PersonnelTypeValidator.valid) {
            return true;
        }
        if (fieldName === undefined) {
            return this.PersonnelTypeValidator.valid;
        }
        else {
            return !(this.PersonnelTypeValidator.hasError(validator, fieldName));
        }
    }

    IsValidCheck(fieldName, validator): boolean {
        if (this.PersonnelTypeValidator.valid) {
            return true;
        }
        if (fieldName === undefined) {
            return this.PersonnelTypeValidator.valid;
        }
        else {
            return !(this.PersonnelTypeValidator.hasError(validator, fieldName));
        }
    }
}