import { FormBuilder, FormGroup, Validators } from "@angular/forms";

export class OTCheckListModel {
    CheckListId: number = 0;
    ServiceItemId: number = null; //! Sanjeev: Currently, it is not in use. Later on it will used to billing and incentive.
    CheckListName: string = null;
    DisplayName: string = null;
    InputType: string = null;
    IsMandatory: boolean = false;
    DisplaySequence: number = null;
    LookUp: string = null;
    IsActive: boolean = false;
    OTCheckListValidator: FormGroup = null;


    constructor() {
        let _formBuilder = new FormBuilder();
        this.OTCheckListValidator = _formBuilder.group({
            'ServiceItemId': [], //!Sanjeev: Later when ServiceItemId is used, change it to null
            'CheckListName': [null, Validators.compose([Validators.required])],
            'DisplayName': [null, Validators.compose([Validators.required])],
            'InputType': [null, Validators.compose([Validators.required])],
            'IsMandatory': [false, Validators.compose([Validators.required])],
            'DisplaySequence': [null, Validators.compose([Validators.required])],
            'LookUp': [],
            'IsActive': [true, Validators.compose([Validators.required])],
        });
    }

    IsDirty(fieldName): boolean {
        if (fieldName === undefined) {
            return this.OTCheckListValidator.dirty;
        }
        else {
            return this.OTCheckListValidator.controls[fieldName].dirty;
        }
    }

    IsValid(fieldName, validator): boolean {
        if (this.OTCheckListValidator.valid) {
            return true;
        }
        if (fieldName === undefined) {
            return this.OTCheckListValidator.valid;
        }
        else {
            return !(this.OTCheckListValidator.hasError(validator, fieldName));
        }
    }

    IsValidCheck(fieldName, validator): boolean {
        if (this.OTCheckListValidator.valid) {
            return true;
        }
        if (fieldName === undefined) {
            return this.OTCheckListValidator.valid;
        }
        else {
            return !(this.OTCheckListValidator.hasError(validator, fieldName));
        }
    }
}