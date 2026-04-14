import { AbstractControl, FormBuilder, FormControl, FormGroup, ValidationErrors, ValidatorFn, Validators } from "@angular/forms";

export class PHRMPackageItemModel {
    PackageItemId: number = 0;
    PharmacyPackageId: number = 0;
    ItemId: number = 0;
    GenericId: number = 0;
    Quantity: number = 0;
    CreatedBy: number = 0;
    CreatedOn: string = '';
    ModifiedBy: number = null;
    ModifiedOn: string = null;
    IsActive: boolean = true;
    GenericName: string = "";
    ItemName: string = "";
    ItemCode: string = "";
    CanEditQuantity: boolean = false;
    PackageItemsValidator: FormGroup = null;
    constructor() {
        var _formBuilder = new FormBuilder();
        this.PackageItemsValidator = _formBuilder.group({
            'GenericName': ['', Validators.compose([Validators.required])],
            'ItemName': ['', Validators.compose([Validators.required, this.ItemNameValidator()])],
            'Quantity': ['', Validators.compose([Validators.required, this.positiveNumberValidator])],
        })
    }
    ItemNameValidator(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {

            const value = control.value;

            if (typeof (value) == "object") {
                return null;
            }
            return { invalidItem: true };
        }
    }
    public IsDirty(fieldName): boolean {
        if (fieldName == undefined)
            return this.PackageItemsValidator.dirty;
        else
            return this.PackageItemsValidator.controls[fieldName].dirty;
    } public IsValid(): boolean {
        if (this.PackageItemsValidator.valid) {
            return true;
        } else {
            return false;
        }
    }
    public IsValidCheck(fieldName, validator): boolean {
        if (fieldName == undefined)
            return this.PackageItemsValidator.valid;
        else
            return !(this.PackageItemsValidator.hasError(validator, fieldName));
    }
    positiveNumberValidator(control: FormControl): { [key: string]: boolean } {
        if (control) {
            if (control.value <= 0)
                return { 'invalidNumber': true };
        }

    }
}