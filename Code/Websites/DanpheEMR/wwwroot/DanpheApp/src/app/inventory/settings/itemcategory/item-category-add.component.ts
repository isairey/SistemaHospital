
import { ChangeDetectorRef, Component, EventEmitter, Input, Output } from "@angular/core";

import { InventorySettingBLService } from "../shared/inventory-settings.bl.service";
import { ItemCategoryModel } from '../shared/item-category.model';

import { SecurityService } from '../../../security/shared/security.service';
//Parse, validate, manipulate, and display dates and times in JS.
import { MessageboxService } from '../../../shared/messagebox/messagebox.service';
import { ENUM_MessageBox_Status } from "../../../shared/shared-enums";


@Component({
    selector: 'itemcategory-add',
    templateUrl: './item-category-add.html'

})
export class ItemCategoryAddComponent {
    public showAddPage: boolean = false;
    @Input("selectedItemCategory")
    public selectedItemCategory: ItemCategoryModel;
    @Input("itemcategoryList")
    public ItemCategoryList = new Array<ItemCategoryModel>();
    @Output("callback-add")
    callbackAdd: EventEmitter<Object> = new EventEmitter<Object>();
    public update: boolean = false;
    public loading: boolean = false;

    public CurrentItemCategory: ItemCategoryModel;
    public completeitemcategorylist: Array<ItemCategoryModel> = new Array<ItemCategoryModel>();
    public itemcategorylist: Array<ItemCategoryModel> = new Array<ItemCategoryModel>();

    constructor(
        public invSettingBL: InventorySettingBLService,
        public securityService: SecurityService,
        public changeDetector: ChangeDetectorRef, public msgBoxServ: MessageboxService) {
    }
    @Input("showAddPage")
    public set value(val: boolean) {
        this.showAddPage = val;
        if (this.selectedItemCategory) {
            this.update = true;
            this.CurrentItemCategory = Object.assign(this.CurrentItemCategory, this.selectedItemCategory);
            this.CurrentItemCategory.CreatedBy = this.securityService.GetLoggedInUser().EmployeeId;
            this.itemcategorylist = this.itemcategorylist.filter(itemcategory => (itemcategory.ItemCategoryId != this.selectedItemCategory.ItemCategoryId));
        }
        else {
            this.CurrentItemCategory = new ItemCategoryModel();
            this.CurrentItemCategory.CreatedBy = this.securityService.GetLoggedInUser().EmployeeId;
            this.update = false;
        }
    }

    //adding new department
    AddItemCategory() {
        //for checking validations, marking all the fields as dirty and checking the validity.
        for (var i in this.CurrentItemCategory.ItemCategoryValidator.controls) {
            this.CurrentItemCategory.ItemCategoryValidator.controls[i].markAsDirty();
            this.CurrentItemCategory.ItemCategoryValidator.controls[i].updateValueAndValidity();
        }

        if (this.ItemCategoryList && this.ItemCategoryList.length) {
            const isItemCategoryNameAlreadyExists = this.ItemCategoryList.some(a => a.ItemCategoryName.toLowerCase() === this.CurrentItemCategory.ItemCategoryName.toLowerCase());
            if (isItemCategoryNameAlreadyExists) {
                this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Notice, [`Cannot Add ItemCategory as the ItemCategory Name "${this.CurrentItemCategory.ItemCategoryName}" already exists.`]);
                return;
            }
        }

        if (this.CurrentItemCategory.IsValidCheck(undefined, undefined)) {
            this.loading = true;
            this.invSettingBL.AddItemCategory(this.CurrentItemCategory)
                .subscribe(
                    res => {
                        this.showMessageBox("success", "ItemCategory Added");
                        this.CurrentItemCategory = new ItemCategoryModel();
                        this.CallBackAddItemCategory(res)
                        this.loading = false;
                    },
                    err => {
                        this.logError(err);
                        this.loading = false;
                    });
        }
    }
    //adding new department
    Update() {
        //for checking validations, marking all the fields as dirty and checking the validity.
        for (var i in this.CurrentItemCategory.ItemCategoryValidator.controls) {
            this.CurrentItemCategory.ItemCategoryValidator.controls[i].markAsDirty();
            this.CurrentItemCategory.ItemCategoryValidator.controls[i].updateValueAndValidity();
        }

        if (this.ItemCategoryList && this.ItemCategoryList.length) {
            const isItemCategoryNameAlreadyExists = this.ItemCategoryList.some(a => a.ItemCategoryName.toLowerCase() === this.CurrentItemCategory.ItemCategoryName.toLowerCase() && a.ItemCategoryId !== this.CurrentItemCategory.ItemCategoryId);
            if (isItemCategoryNameAlreadyExists) {
                this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Notice, [`Cannot Update ItemCategory as the ItemCategory Name "${this.CurrentItemCategory.ItemCategoryName}" already exists.`]);
                return;
            }
        }

        if (this.CurrentItemCategory.IsValidCheck(undefined, undefined)) {
            this.loading = true;
            this.invSettingBL.UpdateItemCategory(this.CurrentItemCategory)
                .subscribe(
                    res => {
                        this.showMessageBox("success", "ItemCategory List Updated");
                        this.CurrentItemCategory = new ItemCategoryModel();
                        this.CallBackAddItemCategory(res)
                        this.loading = false;
                    },
                    err => {
                        this.logError(err);
                        this.loading = false;
                    });
        }
    }

    Close() {
        this.selectedItemCategory = null;
        this.update = false;
        this.itemcategorylist = this.completeitemcategorylist;
        this.showAddPage = false;
    }

    //after adding Vendor is succesfully added  then this function is called.
    CallBackAddItemCategory(res) {
        if (res.Status == "OK") {
            this.callbackAdd.emit({ itemcategory: res.Results });
        }
        else {
            this.showMessageBox("error", "Check log for details");
            console.log(res.ErrorMessage);
        }
    }
    showMessageBox(status: string, message: string) {
        this.msgBoxServ.showMessage(status, [message]);
    }

    logError(err: any) {
        console.log(err);
    }
}