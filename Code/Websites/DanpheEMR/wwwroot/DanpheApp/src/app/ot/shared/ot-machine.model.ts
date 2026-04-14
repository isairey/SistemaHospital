import { FormBuilder, FormGroup, Validators } from "@angular/forms";

export class OTMachineModel {

    OTMachineId: number = 0;
    MachineName: string = '';
    MachineCharge: number = 0;
    IsActive: boolean = false;
    OTMachineValidator: FormGroup = null;

    constructor() {
        let _formBuilder = new FormBuilder();
        this.OTMachineValidator = _formBuilder.group({
            'MachineName': ['', Validators.compose([Validators.required])],
            'MachineCharge': [0, Validators.compose([Validators.required, Validators.min(0)])],
            'IsActive': [true, Validators.compose([Validators.required])],
        });
    }

    IsDirty(fieldName): boolean {
        if (fieldName === undefined) {
            return this.OTMachineValidator.dirty;
        }
        else {
            return this.OTMachineValidator.controls[fieldName].dirty;
        }
    }

    IsValid(fieldName, validator): boolean {
        if (this.OTMachineValidator.valid) {
            return true;
        }
        if (fieldName === undefined) {
            return this.OTMachineValidator.valid;
        }
        else {
            return !(this.OTMachineValidator.hasError(validator, fieldName));
        }
    }

    IsValidCheck(fieldName, validator): boolean {
        if (this.OTMachineValidator.valid) {
            return true;
        }
        if (fieldName === undefined) {
            return this.OTMachineValidator.valid;
        }
        else {
            return !(this.OTMachineValidator.hasError(validator, fieldName));
        }
    }
}