import { FormBuilder, FormGroup, Validators } from "@angular/forms";

export class OTMapAnaesthesiaServiceItem {
    ServiceItemId: number = 0;
    ItemName: string = '';
    AnaesthesiaTypeId: number = 0;
    AnaesthesiaType: string = "";
    IsActive: boolean = false;
    AnaesthesiaId: number = 0;

    MapAnaesthesiaValidator: FormGroup = null;
    constructor() {
        let _formBuilder = new FormBuilder();
        this.MapAnaesthesiaValidator = _formBuilder.group({
            'AnaesthesiaTypeId': [null, Validators.compose([Validators.required])],
            'ServiceItemId': [null, Validators.compose([Validators.required])],
            'IsActive': [true, Validators.compose([Validators.required])],
        });
    }

    IsDirty(fieldName): boolean {
        if (fieldName === undefined) {
            return this.MapAnaesthesiaValidator.dirty;
        }
        else {
            return this.MapAnaesthesiaValidator.controls[fieldName].dirty;
        }
    }

    IsValid(fieldName, validator): boolean {
        if (this.MapAnaesthesiaValidator.valid) {
            return true;
        }
        if (fieldName === undefined) {
            return this.MapAnaesthesiaValidator.valid;
        }
        else {
            return !(this.MapAnaesthesiaValidator.hasError(validator, fieldName));
        }
    }

    IsValidCheck(fieldName, validator): boolean {
        if (this.MapAnaesthesiaValidator.valid) {
            return true;
        }
        if (fieldName === undefined) {
            return this.MapAnaesthesiaValidator.valid;
        }
        else {
            return !(this.MapAnaesthesiaValidator.hasError(validator, fieldName));
        }
    }
}