import { ChangeDetectorRef, Component, EventEmitter, Input, Output } from "@angular/core";
import { CoreService } from "../../../core/shared/core.service";
import { DanpheHTTPResponse } from "../../../shared/common-models";
import { MessageboxService } from "../../../shared/messagebox/messagebox.service";
import { ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status } from "../../../shared/shared-enums";
import { PharmacyPackage_DTO } from "../../shared/dtos/pharmacy-package-dto";
import { PHRMPackageItemModel } from "../../shared/pharmacy-package-item.model";
import { PHRMPackageModel } from "../../shared/pharmacy-package.model";
import { PharmacyBLService } from "../../shared/pharmacy.bl.service";
import { PHRMGenericModel } from "../../shared/phrm-generic.model";
import { PHRMItemMasterModel } from "../../shared/phrm-item-master.model";

@Component({
    selector: "phrm-package-add",
    templateUrl: "./phrm-package-manage-add.component.html"
})

export class PHRMPackageManageAddComponent {
    public GenericList: PHRMGenericModel[] = [];
    public FilteredGenericList: PHRMGenericModel[] = [];
    public SelectedGeneric: PHRMGenericModel = null;
    public ItemList: Array<PHRMItemMasterModel> = new Array<PHRMItemMasterModel>();
    public FilteredItemList: Array<PHRMItemMasterModel> = new Array<PHRMItemMasterModel>();
    public SelectedItem: PHRMItemMasterModel = null;
    public Package: PHRMPackageModel = new PHRMPackageModel();
    public PackageItems: Array<PHRMPackageItemModel> = new Array<PHRMPackageItemModel>()
    public PackageItemsList: Array<PHRMPackageItemModel> = new Array<PHRMPackageItemModel>()
    public PackageItem: PHRMPackageItemModel = new PHRMPackageItemModel();
    TotalPackageQuantity: number = 0;

    @Output("callback-close")
    callbackClose: EventEmitter<Object> = new EventEmitter<Object>();

    @Input("PharmacyPackageId")
    PharmacyPackageId: number = null;

    @Input("PackageList")
    public PackageList = Array<PharmacyPackage_DTO>();


    @Input("IsEditMode")
    IsEditMode: boolean = false;
    Loading: boolean = false;

    constructor(public messageBoxService: MessageboxService, public pharmacyBLService: PharmacyBLService, public coreService: CoreService, public changeDetector: ChangeDetectorRef) {
        this.GetGenericList();
        this.GetItemMasterList();
    }
    ngOnInit() {
        if (this.PharmacyPackageId > 0) {
            this.GetPackageById(this.PharmacyPackageId);
        }
    }
    AddPackage() {
        let check: boolean = true;

        if (this.PackageItem.IsValidCheck(undefined, undefined) == false) {
            for (let a in this.PackageItem.PackageItemsValidator.controls) {
                this.PackageItem.PackageItemsValidator.controls[a].markAsDirty();
                this.PackageItem.PackageItemsValidator.controls[a].updateValueAndValidity();
            }
            check = false;
        }
        if (check) {
            let IsDuplicate = this.PackageItemsList.some(p => p.ItemId === this.PackageItem.ItemId && p.GenericId === this.PackageItem.GenericId);
            if (IsDuplicate) {
                this.messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, ["Cannot add duplicate item"]);
                return;
            }
            this.PackageItemsList.push(this.PackageItem);
            this.TotalPackageQuantity = this.PackageItemsList.reduce((a, b) => a + b.Quantity, 0);
            //Clear all 
            this.PackageItem = new PHRMPackageItemModel();
            this.SelectedGeneric = null;
            this.SelectedItem = null;
            this.FilteredItemList = this.ItemList;
        }
        else {
            this.messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, ["Invalid Data"]);
        }
    }
    SavePackage() {
        this.Package.PackageItems = this.PackageItemsList;
        let CheckIsValid = true;
        let errorMessages: string[] = [];
        if (this.Package.IsValidCheck(undefined, undefined) == false) {
            for (let a in this.Package.PackageValidator.controls) {
                this.Package.PackageValidator.controls[a].markAsDirty();
                this.Package.PackageValidator.controls[a].updateValueAndValidity();
            }
            CheckIsValid = false;
            errorMessages.push(`Fill all the required fields`);
        }

        if (!this.Package.PackageItems.length) {
            CheckIsValid = false;
            errorMessages.push(`Add some package items then proceed again.`);
        }

        for (let i = 0; i < this.Package.PackageItems.length; i++) {
            if (this.Package.PackageItems[i].IsValidCheck(undefined, undefined) == false) {

                for (let a in this.Package.PackageItems[i].PackageItemsValidator.controls) {
                    this.Package.PackageItems[i].PackageItemsValidator.controls[a].markAsDirty();
                    this.Package.PackageItems[i].PackageItemsValidator.controls[a].updateValueAndValidity();
                    if (this.Package.PackageItems[i].PackageItemsValidator.controls[a].invalid) {
                        errorMessages.push(`${a} is not valid for item ${i + 1}.`)
                    }
                }
                CheckIsValid = false;
            }
            if (this.Package.PackageItems[i].ItemId == null) {
                CheckIsValid = false;
                errorMessages.push(`Item ${i + 1} is not a valid item.`);
            }
        }

        if (this.PackageList && this.PackageList.length) {
            const isPackageNameAlreadyExixts = this.PackageList.some(a => a.PharmacyPackageName.toLowerCase() === this.Package.PharmacyPackageName.toLowerCase());
            const isPackageCodeAlreadyExixts = this.PackageList.some(a => a.PackageCode.toLowerCase() === this.Package.PackageCode.toLowerCase());
            if (isPackageNameAlreadyExixts) {
                this.messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`Cannot add Medicine Package as the Package Name "${this.Package.PharmacyPackageName}" already exists!`]);
                return;
            }

            if (isPackageCodeAlreadyExixts) {
                this.messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`Cannot add Medicine Package as the Package Code "${this.Package.PackageCode}" already exists!`]);
                return;
            }
        }

        if (CheckIsValid == true) {
            if (this.Package && this.Package.PackageCode.trim() && this.Package.PharmacyPackageName.trim() && this.Package.PackageItems.length) {
                this.Loading = true;
                this.pharmacyBLService.PostPharmacyPackageBilling(this.Package).finally(() => { this.Loading = false; })
                    .subscribe(
                        (res: DanpheHTTPResponse) => {
                            if (res.Status == ENUM_DanpheHTTPResponses.OK) {
                                this.messageBoxService.showMessage(ENUM_MessageBox_Status.Success, ['Package Saved Successfully']);
                                this.callbackClose.emit(true);
                            }
                            else {
                                this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ['Failed to Save Package <br>' + res.ErrorMessage]);
                            }
                        },
                        err => {
                            this.messageBoxService.showMessage(ENUM_MessageBox_Status.Error, ['Failed to Save Package <br>' + err]);
                        });
            }
            else {
                this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ['Please Fill Required Fields']);
            }
        }
        else {
            this.messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, errorMessages);
        }
    }
    RemovePackageItem(index: number) {
        if (index >= 0) {
            this.PackageItemsList.splice(index, 1);
            if (this.PackageItemsList.length) {
                this.TotalPackageQuantity = this.PackageItemsList.reduce((a, b) => a + b.Quantity, 0);
            }
            else {
                this.TotalPackageQuantity = 0;
            }
        }
    }
    EditPackage(index: number) {
        if (this.PackageItemsList.length) {
            const item = this.PackageItemsList.find((_, i) => i === index);
            if (item) {
                item.CanEditQuantity = true;
            }
        }
    }
    GetGenericList(): void {
        this.pharmacyBLService.GetGenericListWithoutPriceCategory()
            .subscribe((res: DanpheHTTPResponse) => {
                if (res.Status === ENUM_DanpheHTTPResponses.OK && res.Results.length) {
                    this.GenericList = res.Results;
                    this.FilteredGenericList = this.GenericList;
                }
                else {
                    this.messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, ["Generics not found"]);
                }
            },
                err => {
                    this.messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, ["Generics not found"]);
                });
    }
    public GetItemMasterList(): void {
        this.pharmacyBLService.GerItemListWithGenericId()
            .subscribe((res: DanpheHTTPResponse) => {
                if (res.Status === ENUM_DanpheHTTPResponses.OK && res.Results.length) {
                    this.ItemList = res.Results;
                    this.FilteredItemList = this.ItemList;
                }
                else {
                    this.messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, ["Items not found"]);
                }
            });
    }
    phrmGenericListFormatter(data: any): string {
        let html = "";
        if (data["GenericId"]) {
            html = `<font color='blue'; size=03 >${data["GenericName"]}</font>`;
        }
        return html;
    }
    phrmItemListFormatter(data: any): string {
        let html = "";
        html = `<font color='blue'; size=03 >${data["ItemName"]}</font>`;
        return html;
    }
    AssignSelectedGenName($event) {
        if ($event && $event.GenericId > 0) {
            this.SelectedItem = null;
            this.changeDetector.detectChanges();
            this.PackageItem.GenericId = $event.GenericId;
            this.PackageItem.GenericName = $event.GenericName;
            this.PackageItem.ItemCode = $event.ItemCode;
            if (this.ItemList.length) {
                this.FilteredItemList = this.ItemList.filter(i => i.GenericId === $event.GenericId);
            }
        }
        else {
            this.FilteredItemList = this.ItemList;
            this.PackageItem.PackageItemsValidator.controls['GenericName'].setValue(null);
        }
    }
    onItemSelect($event) {
        if ($event && $event.ItemId > 0) {
            this.SelectedGeneric = null;
            this.changeDetector.detectChanges();
            this.PackageItem.ItemId = $event.ItemId;
            this.PackageItem.ItemName = $event.ItemName;
            if (this.GenericList.length) {
                this.SelectedGeneric = this.GenericList.find(g => g.GenericId === $event.GenericId);
                this.PackageItem.GenericId = this.SelectedGeneric.GenericId;
                this.PackageItem.GenericName = this.SelectedGeneric.GenericName;
                this.PackageItem.ItemCode = this.SelectedGeneric.ItemCode;
                this.PackageItem.PackageItemsValidator.controls['GenericName'].setValue(this.PackageItem.GenericName);
            }
        }
        else {
            this.FilteredGenericList = this.GenericList;
        }
    }
    GetPackageById(pharmacyPackageId) {
        this.PackageItemsList = new Array<PHRMPackageItemModel>();
        this.TotalPackageQuantity = 0;
        this.pharmacyBLService.GetPackageById(pharmacyPackageId)
            .subscribe((res: DanpheHTTPResponse) => {
                if (res.Status === ENUM_DanpheHTTPResponses.OK && res.Results) {
                    let tempPackage = new PHRMPackageModel();
                    tempPackage = res.Results;
                    this.Package.PharmacyPackageId = tempPackage.PharmacyPackageId;
                    this.Package.Description = tempPackage.Description;
                    this.Package.PackageValidator.controls['PackageCode'].setValue(tempPackage.PackageCode);
                    this.Package.PackageValidator.controls['PharmacyPackageName'].setValue(tempPackage.PharmacyPackageName);

                    if (tempPackage.PackageItems && tempPackage.PackageItems.length) {
                        tempPackage.PackageItems.forEach(item => {
                            let PackageItem: PHRMPackageItemModel = new PHRMPackageItemModel();
                            let Item: PHRMItemMasterModel = new PHRMItemMasterModel();
                            Item.ItemId = item.ItemId;
                            Item.ItemName = item.ItemName;
                            Item.ItemCode = item.ItemCode;

                            PackageItem.PackageItemsValidator.controls['GenericName'].setValue(item.GenericName);
                            PackageItem.PackageItemsValidator.controls['ItemName'].setValue(Item);
                            PackageItem.PackageItemsValidator.controls['Quantity'].setValue(item.Quantity);

                            PackageItem.ItemCode = item.ItemCode;
                            PackageItem.ItemId = item.ItemId;
                            PackageItem.IsActive = item.IsActive;
                            PackageItem.Quantity = item.Quantity;
                            PackageItem.GenericId = item.GenericId;
                            PackageItem.GenericName = item.GenericName;
                            PackageItem.PharmacyPackageId = item.PharmacyPackageId;
                            PackageItem.ItemName = item.ItemName;
                            PackageItem.PackageItemId = item.PackageItemId;
                            this.Package.PackageItems.push(PackageItem);
                            this.PackageItemsList.push(PackageItem);
                        });

                        if (this.PackageItemsList.length) {
                            this.TotalPackageQuantity = this.PackageItemsList.reduce((a, b) => a + b.Quantity, 0);
                        }
                    }
                }
                else {
                    this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ['Failed to get package information. <br>' + res.ErrorMessage]);
                }
            });
    }
    UpdatePackage() {
        this.Package.PackageItems = this.PackageItemsList;
        let CheckIsValid = true;
        let errorMessages: string[] = [];
        if (this.Package.IsValidCheck(undefined, undefined) == false) {

            for (let a in this.Package.PackageValidator.controls) {
                this.Package.PackageValidator.controls[a].markAsDirty();
                this.Package.PackageValidator.controls[a].updateValueAndValidity();
            }
            CheckIsValid = false;
        }
        for (let i = 0; i < this.Package.PackageItems.length; i++) {
            if (this.Package.PackageItems[i].IsValidCheck(undefined, undefined) == false) {

                for (let a in this.Package.PackageItems[i].PackageItemsValidator.controls) {
                    this.Package.PackageItems[i].PackageItemsValidator.controls[a].markAsDirty();
                    this.Package.PackageItems[i].PackageItemsValidator.controls[a].updateValueAndValidity();
                    if (this.Package.PackageItems[i].PackageItemsValidator.controls[a].invalid) {
                        errorMessages.push(`${a} is not valid for item ${i + 1}.`)
                    }
                }
                CheckIsValid = false;
            }
            if (this.Package.PackageItems[i].ItemId == null) {
                CheckIsValid = false;
                errorMessages.push(`Item ${i + 1} is not a valid item.`);
            }
        }

        if (this.PackageList && this.PackageList.length) {
            const isPackageNameAlreadyExixts = this.PackageList.some(a => a.PharmacyPackageName.toLowerCase() === this.Package.PharmacyPackageName.toLowerCase() && a.PharmacyPackageId !== this.Package.PharmacyPackageId);
            const isPackageCodeAlreadyExixts = this.PackageList.some(a => a.PackageCode.toLowerCase() === this.Package.PackageCode.toLowerCase() && a.PharmacyPackageId !== this.Package.PharmacyPackageId);
            if (isPackageNameAlreadyExixts) {
                this.messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`Cannot update Medicine Package as the Package Name "${this.Package.PharmacyPackageName}" already exists!`]);
                return;
            }

            if (isPackageCodeAlreadyExixts) {
                this.messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`Cannot update Medicine Package as the Package Code "${this.Package.PackageCode}" already exists!`]);
                return;
            }
        }

        if (CheckIsValid == true) {
            if (this.Package && this.Package.PackageCode.trim() && this.Package.PharmacyPackageName.trim() && this.Package.PackageItems.length) {
                this.Loading = true;
                this.pharmacyBLService.UpdatePackage(this.Package).finally(() => { this.Loading = false; })
                    .subscribe(
                        (res: DanpheHTTPResponse) => {
                            if (res.Status == ENUM_DanpheHTTPResponses.OK) {
                                this.messageBoxService.showMessage(ENUM_MessageBox_Status.Success, ['Package Updated Successfully']);
                                this.callbackClose.emit(true);
                            }
                            else {
                                this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ['Failed to Update Package <br>' + res.ErrorMessage]);
                            }
                        },
                        err => {
                            this.messageBoxService.showMessage(ENUM_MessageBox_Status.Error, ['Failed to Update Package <br>' + err]);
                        });
            }
            else {
                this.messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, ['Please Fill Required Fields']);
            }
        }
        else {
            this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, errorMessages);
        }
    }
    OnQuantityEditing() {
        this.TotalPackageQuantity = this.PackageItemsList.reduce((a, b) => a + b.Quantity, 0);
    }
}
