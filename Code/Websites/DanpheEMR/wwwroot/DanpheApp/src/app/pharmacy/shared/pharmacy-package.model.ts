import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { PHRMPackageItemModel } from "./pharmacy-package-item.model";

export class PHRMPackageModel {
    PharmacyPackageId: number = 0;
    PackageCode: string = '';
    PharmacyPackageName: string = '';
    Description: string = '';
    CreatedBy: number = 0;
    CreatedOn: string = '';
    ModifiedBy: number = null;
    ModifiedOn: string = null;
    IsActive: boolean = true;
    PackageValidator: FormGroup = null;
    PackageItems: Array<PHRMPackageItemModel> = new Array<PHRMPackageItemModel>();

    constructor() {
        var _formBuilder = new FormBuilder();
        this.PackageValidator = _formBuilder.group({
            'PharmacyPackageName': ['', Validators.compose([Validators.required])],
            'PackageCode': ['', Validators.compose([Validators.required])]
        })
    }
    public IsDirty(fieldName): boolean {
        if (fieldName == undefined)
            return this.PackageValidator.dirty;
        else
            return this.PackageValidator.controls[fieldName].dirty;
    }


    public IsValid(): boolean {
        if (this.PackageValidator.valid) {
            return true;
        } else {
            return false;
        }
    }

    public IsValidCheck(fieldName, validator): boolean {
        if (fieldName == undefined)
            return this.PackageValidator.valid;
        else
            return !(this.PackageValidator.hasError(validator, fieldName));
    }
}