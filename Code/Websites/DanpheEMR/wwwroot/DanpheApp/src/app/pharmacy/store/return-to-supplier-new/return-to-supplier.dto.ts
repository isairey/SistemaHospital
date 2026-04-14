import { AbstractControl, FormBuilder, FormControl, FormGroup, ValidationErrors, ValidatorFn, Validators } from "@angular/forms";
import * as moment from "moment";

export class ReturnToSupplier_DTO {
    ReturnToSupplierId: number = 0;
    ReturnDate: string = moment().format('YYYY-MM-DD');
    CreditNoteId: string = '';
    SupplierId: number = 0;
    SubTotal: number = 0;
    DiscountAmount: number = 0;
    DiscountPercentage: number = 0;
    VATAmount: number = 0;
    VATPercentage: number = 0;
    TotalAmount: number = 0;
    Remarks: string = '';
    ReturnToSupplierItems: ReturnToSupplierItem_DTO[] = [];
    ReturnStatus: number = null;
    ReturnValidator: FormGroup = null;

    constructor() {
        let _formBuilder = new FormBuilder();
        this.ReturnValidator = _formBuilder.group({
            //'SupplierName': ['', [Validators.required, this.SupplierValidator]],
            'ReturnDate': ['', Validators.compose([Validators.required])],
            'CreditNoteId': ['', Validators.compose([Validators.required])],
            'VATAmount': [0, [Validators.required, Validators.min(0)]],
            'VATPercentage': [0, [Validators.required, Validators.min(0), Validators.max(100)]],
            'DiscountAmount': [0, [Validators.required, Validators.min(0)]],
            'DiscountPercentage': [0, [Validators.required, Validators.min(0), Validators.max(100)]],
            'Remarks': [null, Validators.compose([Validators.required])],
            'ReturnStatus': [null, Validators.compose([Validators.required])]
        });

    }

    public IsDirty(fieldName): boolean {
        if (fieldName == undefined)
            return this.ReturnValidator.dirty;
        else
            return this.ReturnValidator.controls[fieldName].dirty;
    }

    public IsValid(): boolean { if (this.ReturnValidator.valid) { return true; } else { return false; } }
    public IsValidCheck(fieldName, validator): boolean {

        if (fieldName == undefined)
            return this.ReturnValidator.valid;
        else {
            return !(this.ReturnValidator.hasError(validator, fieldName));
        }
    }

    // SupplierValidator(): ValidatorFn {
    //     return (control: AbstractControl): ValidationErrors | null => {

    //         const value = control.value;
    //         console.log(typeof (value));
    //         if (typeof (value) == "object") {
    //             return;
    //         }
    //         else {
    //             return { invalidSupplier: true };
    //         }
    //     }
    // }

    SupplierValidator(control: FormControl): { [key: string]: boolean } {
        if (control.value && typeof (control.value) == "object" && control.value.SupplierName != null)
            return null;
        else
            return { 'invalidSupplier': true };
    }
}

export class ReturnToSupplierItem_DTO {
    ReturnToSupplierId: number = 0;
    ItemId: number = 0;
    ItemName: string = '';
    BatchNo: string = '';
    ExpiryDate: string = '';
    Quantity: number = 0;
    ItemPrice: number = 0;
    CostPrice: number = 0;
    SalePrice: number = 0;
    ReturnCostPrice: number = 0;
    GRItemPrice: number = 0;
    ReturnRate: number = 0;
    SubTotal: number = 0;
    DiscountedAmount: number = 0;
    DiscountPercentage: number = 0;
    VATPercentage: number = 0;
    VATAmount: number = 0;
    TotalAmount: number = 0;
    ReturnRemarks: string = '';
    GenericId: number = null;
    GenericName: string = '';
    AvailableQuantity: number = 0;
    ReturnItemsValidator: FormGroup = null;


    constructor() {
        let _formBuilder = new FormBuilder();
        this.ReturnItemsValidator = _formBuilder.group({
            'ItemName': ['', Validators.compose([this.ItemNameValidator()])],
            'Quantity': [0, Validators.compose([this.IntegerValidator, this.WholeNumberValidator])],
            'ReturnRate': [0, Validators.compose([this.PositiveNumberValidator])],
            'DiscountedAmount': [0, [Validators.required, Validators.min(0)]],
            'VATAmount': [0, [Validators.required, Validators.min(0)]]
        });
    }
    public IsDirty(fieldName): boolean {
        if (fieldName == undefined)
            return this.ReturnItemsValidator.dirty;
        else
            return this.ReturnItemsValidator.controls[fieldName].dirty;
    }

    public IsValid(): boolean { if (this.ReturnItemsValidator.valid) { return true; } else { return false; } }
    public IsValidCheck(fieldName, validator): boolean {

        if (fieldName == undefined)
            return this.ReturnItemsValidator.valid;
        else
            return !(this.ReturnItemsValidator.hasError(validator, fieldName));
    }
    PositiveNumberValidator(control: FormControl): { [key: string]: boolean } {
        if (control) {
            if (control.value <= 0)
                return { 'invalidNumber': true };
        }
    }
    WholeNumberValidator(control: FormControl): { [key: string]: boolean } {
        if (control.value) {
            if (control.value % 1 != 0)
                return { 'wrongDecimalValue': true };
        }
        else
            return { 'wrongDecimalValue': true };
    }
    IntegerValidator(control: FormControl): { [key: string]: boolean } {
        if (control) {
            if (control.value <= 0)
                return { 'invalidNumber': true };
        }
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
}

export class SupplierWiseAvailableStock_DTO {
    SupplierId: number = 0;
    ItemId: number = 0;
    ItemName: string = '';
    BatchNo: string = '';
    ExpiryDate: string = '';
    CostPrice: number = 0;
    SalePrice: number = 0;
    GenericId: number = 0;
    GenericName: string = '';
    AvailableQuantity: number = 0;
    Unit: string = '';
}