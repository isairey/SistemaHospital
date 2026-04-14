import { ChangeDetectorRef, Component, EventEmitter, Output } from "@angular/core";
import { Router } from "@angular/router";
import * as moment from "moment";
import { InventoryService } from "../../../../inventory/shared/inventory.service";
import { PHRMStoreModel } from "../../../../pharmacy/shared/phrm-store.model";
import { SecurityService } from "../../../../security/shared/security.service";
import { DanpheHTTPResponse } from "../../../../shared/common-models";
import { MessageboxService } from "../../../../shared/messagebox/messagebox.service";
import { ENUM_DanpheHTTPResponses, ENUM_GRItemCategory, ENUM_MessageBox_Status } from "../../../../shared/shared-enums";
import { WardSupplyBLService } from "../../../shared/wardsupply.bl.service";
import { wardsupplyService } from "../../../shared/wardsupply.service";
import { WardInventoryReturnItemsModel } from "../ward-inventory-return-items.model";
import { IReturnableAsset, MAP_Return_FixedAsset, WardInventoryReturnModel } from "../ward-inventory-return.model";

@Component({
    selector: 'inventory-return-form',
    templateUrl: "./inventory-return-form.html"

})
export class WardSupplyInventoryReturnForm {
    public activeSubstoreId: number = 0;
    public currentRequItem: WardInventoryReturnItemsModel = new WardInventoryReturnItemsModel();
    public return: WardInventoryReturnModel = new WardInventoryReturnModel();
    public returnFinalItemsArrayObj: Array<any> = new Array<any>();
    public ItemList: any;
    public AllItemList: any;
    public CommonList: any = [];
    public rowCount: number = 0
    public checkIsItem: boolean = false;
    public index: number = 0;
    public showAddItemPopUp: boolean = false;
    public inventoryList: Array<PHRMStoreModel> = new Array<PHRMStoreModel>();
    public selectedInventory: number = 0;
    public disableReturnButton: boolean = false;
    ItemCategories: ENUM_GRItemCategory[];
    filteredItemList: any[];
    filteredItemListBySelectedInventory: any[] = [];

    constructor(
        public changeDetectorRef: ChangeDetectorRef,
        public inventoryService: InventoryService,
        public wardsupplyBLService: WardSupplyBLService,
        public securityService: SecurityService,
        public router: Router,
        public messageBoxService: MessageboxService,
        public wardsupplyService: wardsupplyService) {
        this.CheckForSubstoreActivation();
        this.GetInventoryList();
        this.ItemCategory();
        this.SetFocusById('selectInventory');
    }
    GetInventoryList() {
        this.inventoryList = this.wardsupplyService.inventoryList;
        if (this.inventoryList && this.inventoryList.length) {
            this.inventoryList = this.inventoryList.filter(i => i.IsActive === true);
        }
    }

    public ItemCategory() {
        this.ItemCategories = Object.values(ENUM_GRItemCategory).filter(p => isNaN(p as any));
    }
    OnItemCategoryChanged(indx: number) {
        var returnItem = this.return.ReturnItemsList[indx];
        this.filteredItemList = [];
        this.filteredItemList = this.GetItemListByItemCategory(returnItem.ItemCategory);
        this.SetFocusOnItemName(indx);
    }

    GetItemListByItemCategory(itmCategory: string) {
        let retItemList = this.filteredItemListBySelectedInventory.filter(item => item.ItemCategoryName === itmCategory);
        return retItemList;
    }

    myListFormatter(data: any): string {
        let html = data["ItemName"] + '|ItemCode:' + data["Code"] + '|CostPrice:' + data["CostPrice"];
        return html;
    }
    ListFormatter(data: any): string {
        let html = data["BarCodeNumber"];
        return html;
    }
    CheckForSubstoreActivation() {
        this.activeSubstoreId = this.securityService.ActiveStore.StoreId;
        this.return.SourceStoreId = this.activeSubstoreId;
        try {
            if (!this.activeSubstoreId) {
                this.router.navigate(['/WardSupply']);
            }
            else {
                this.CommonList = this.wardsupplyService.inventoryStockList;
            }
        } catch (exception) {
            this.messageBoxService.showMessage("Error", [exception]);
        }
    }

    private InitializeReturnItems() {
        this.currentRequItem = new WardInventoryReturnItemsModel();
        this.currentRequItem.ItemCategory = ENUM_GRItemCategory.Consumables;
        this.filteredItemList = this.filteredItemListBySelectedInventory.filter(a => a.ItemCategoryName == this.currentRequItem.ItemCategory)
        this.return.ReturnItemsList.push(this.currentRequItem);
        this.SetFocusOnItemName(0);
        this.return.TargetStoreId = this.selectedInventory;
        this.return.SourceStoreId = this.activeSubstoreId;
    }
    AddRowRequest() {
        for (let i = 0; i < this.return.ReturnItemsList.length; i++) {
            for (let a in this.return.ReturnItemsList[i].ReturnItemValidator.controls) {
                this.return.ReturnItemsList[i].ReturnItemValidator.controls[a].markAsDirty();
                this.return.ReturnItemsList[i].ReturnItemValidator.controls[a].updateValueAndValidity();
            }
        }
        this.rowCount++;
        this.currentRequItem = new WardInventoryReturnItemsModel();
        this.currentRequItem.ItemCategory = ENUM_GRItemCategory.Consumables;
        this.filteredItemList = [];
        this.filteredItemList = this.filteredItemListBySelectedInventory.filter(a => a.ItemCategoryName == this.currentRequItem.ItemCategory)
        this.return.ReturnItemsList.push(this.currentRequItem);
        let nextInputIndex = this.return.ReturnItemsList.length - 1
        this.SetFocusOnItemName(nextInputIndex);
    }
    public SetFocusOnItemName(index: number) {
        let elementToBeFocused = 'itemName' + index;
        this.SetFocusById(elementToBeFocused);
    }
    public SetFocusById(id: string) {
        window.setTimeout(function () {
            let elementToBeFocused = document.getElementById(id);
            if (elementToBeFocused) {
                elementToBeFocused.focus();
            }
        }, 600);
    }

    DeleteAction(index) {
        var reqItem = this.return.ReturnItemsList[index];
        this.DeleteRow(index);
    }
    DeleteRow(index) {
        try {
            this.return.ReturnItemsList.splice(index, 1);
            this.returnFinalItemsArrayObj.splice(index, 1);
            if (this.return.ReturnItemsList.length == 0) {
                this.AddRowRequest();
            }
        }
        catch (exception) {
            this.messageBoxService.showMessage("Error", [exception]);
        }
    }
    SelectItemFromSearchBox(Item: any, index) {
        if (typeof Item === "object" && !Array.isArray(Item) && Item !== null) {
            if (this.return.ReturnItemsList.some(item => item.ItemId === Item.ItemId && item.Code === Item.Code && item.CostPrice == Item.CostPrice)) {
                this.return.ReturnItemsList[index].SelectedItem = null;
                this.messageBoxService.showMessage("Warning", ["Item already exists in the list. Please select different item."])
                return;
            }
            this.return.ReturnItemsList[index].BarCodeNumberList = [];
            if (Item.IsFixedAsset) {
                this.return.ReturnItemsList[index].BarCodeNumberList = this.GetBarCodesByItemIdAndStoreId(this.activeSubstoreId, Item.ItemId);
            }
            if (Item.ItemId > 0) {
                this.return.ReturnItemsList[index].Id = Item.Id;
                this.return.ReturnItemsList[index].ItemId = Item.ItemId;
                this.return.ReturnItemsList[index].ItemName = Item.ItemName;
                this.return.ReturnItemsList[index].VendorName = Item.VendorName;
                this.return.ReturnItemsList[index].Code = Item.Code;
                this.return.ReturnItemsList[index].IsFixedAsset = Item.IsFixedAsset
                this.return.ReturnItemsList[index].AvailableQuantity = Item.AvailableQuantity
                this.return.ReturnItemsList[index].BatchNo = Item.BatchNo
                this.return.ReturnItemsList[index].ExpiryDate = Item.ExpiryDate;
                this.return.ReturnItemsList[index].CostPrice = Item.CostPrice;
            }

        }

    }
    onBarcodeChanged($event: IReturnableAsset[], index: number) {
        this.return.ReturnItemsList[index].ReturnAssets = $event.map(a => new MAP_Return_FixedAsset(a.StockId));
        this.return.ReturnItemsList[index].ReturnQuantity = $event.length;
    }
    AddReturn() {
        var CheckIsValid = true;
        if (!this.return.Remarks || this.return.Remarks.trim() === '') {
            this.messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, ['Please provide remarks']);
            return;
        }
        if (!this.selectedInventory || this.selectedInventory == 0) {
            this.messageBoxService.showMessage("error", ['Please select inventory for return']);
            return;
        }
        if (this.return.ReturnItemsList.length > 0) {
            this.return.ReturnStatus = "active";
            for (let i = 0; i < this.return.ReturnItemsList.length; i++) {
                this.return.ReturnItemsList[i].CreatedBy = this.securityService.GetLoggedInUser().EmployeeId;
            }
            for (let i = 0; i < this.return.ReturnItemsList.length; i++) {
                if (!this.return.ReturnItemsList[i].ItemName) {
                    this.messageBoxService.showMessage("error", ['Please select Item name for return']);
                    return;
                }
                if (this.return.ReturnItemsList[i].ReturnQuantity <= 0) {
                    this.messageBoxService.showMessage("error", ['Return Quantity must be greater then zero']);
                    return;
                }


            }
            if (this.return.IsValidCheck(undefined, undefined) == false) {
                for (let a in this.return.ReturnValidator.controls) {
                    this.return.ReturnValidator.controls[a].markAsDirty();
                    this.return.ReturnValidator.controls[a].updateValueAndValidity();
                }
                CheckIsValid = false;
            }
            for (let i = 0; i < this.return.ReturnItemsList.length; i++) {
                if (this.return.ReturnItemsList[i].IsValidCheck(undefined, undefined) == false) {

                    for (var a in this.return.ReturnItemsList[i].ReturnItemValidator.controls) {
                        this.return.ReturnItemsList[i].ReturnItemValidator.controls[a].markAsDirty();
                        this.return.ReturnItemsList[i].ReturnItemValidator.controls[a].updateValueAndValidity();
                    }
                    CheckIsValid = false;
                }
            }
            if (CheckIsValid == false) {
                this.messageBoxService.showMessage("error", ['Please fix values and try again.']);
                return;
            }
            this.disableReturnButton = true;
            this.wardsupplyBLService.PostToWardInventoryReturn(this.return).finally(() => { this.disableReturnButton = false })
                .subscribe(
                    res => {
                        if (res.Status == 'OK') {
                            this.ReloadStock();
                            this.messageBoxService.showMessage("success", ["Return is Generated and Saved"]);
                            this.changeDetectorRef.detectChanges();
                            this.return.ReturnItemsList = new Array<WardInventoryReturnItemsModel>();
                            this.return = new WardInventoryReturnModel();
                            this.currentRequItem = new WardInventoryReturnItemsModel();
                            this.return.ReturnItemsList.push(this.currentRequItem);
                            this.RouteToViewDetail(res.Results);
                        }
                        else {

                            this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ['Failed to add Return. <br>' + res.ErrorMessage]);
                            this.logError(res.ErrorMessage);
                            //  this.returnList();
                        }
                    },
                    err => {
                        this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ['Failed to add Return. <br>' + err.ErrorMessage]);
                        this.logError(err.ErrorMessage);
                        // this.returnList();
                    });
        }
    }



    Cancel() {
        this.return.ReturnItemsList = new Array<WardInventoryReturnItemsModel>();
        this.return = new WardInventoryReturnModel();
        this.currentRequItem = new WardInventoryReturnItemsModel()
        this.return.ReturnItemsList.push(this.currentRequItem);
        this.returnList();
    }
    logError(err: any) {
        console.log(err);
    }

    RouteToViewDetail(reqId: number) {
        this.wardsupplyService.ReturnId = reqId;
        this.wardsupplyService.isModificationAllowed = true;
        this.returnList();
    }
    AddItemPopUp(i) {
        this.showAddItemPopUp = false;
        this.index = i;
        this.changeDetectorRef.detectChanges();
        this.showAddItemPopUp = true;
    }

    OnNewItemAdded($event) {
        this.showAddItemPopUp = false;
        var item = $event.item;
        this.ItemList.push({
            "ItemId": item.ItemId, "ItemName": item.ItemName, StandardRate: item.StandardRate, VAT: item.VAT
        });
        this.currentRequItem = new WardInventoryReturnItemsModel();
        this.return.ReturnItemsList.splice(this.index, 1, this.currentRequItem);
        this.return.ReturnItemsList[this.index].SelectedItem = item;
    }

    GoToNextInput(idToSelect: string, Item?: any, index?: number) {
        if (document.getElementById(idToSelect)) {
            let nextEl = <HTMLInputElement>document.getElementById(idToSelect);
            nextEl.focus();
            nextEl.select();
        }
        else {
            this.DeleteRow(index)
            idToSelect = 'remarks';
            if (document.getElementById(idToSelect)) {
                let nextEl = <HTMLInputElement>document.getElementById(idToSelect);
                nextEl.focus();
                nextEl.select();
            }
        }
    }
    public get IsReqDateValid() {
        return this.inventoryService.allFiscalYearList.some(fy => (fy.IsClosed == null || fy.IsClosed == false) && moment(this.return.ReturnDate).isBetween(fy.StartDate, fy.EndDate)) as Boolean;
    }
    @Output("callback-new-req")
    callbackNewReq: EventEmitter<Object> = new EventEmitter<Object>();

    returnList() {
        this.wardsupplyService.ReturnId = 0;
        this.callbackNewReq.emit({ showNewReq: false });
    }
    OnInventoryChange() {
        let inventory = null;
        if (!this.selectedInventory) {
            this.return.TargetStoreId = null;
        }
        else if (this.selectedInventory) {
            inventory = this.inventoryList.find(a => a.StoreId == this.selectedInventory);
        }
        if (inventory) {
            this.return.TargetStoreId = inventory.StoreId;
            //No need to filter by Storeid coz we have single inventory to return.
            //this.AllItemList = this.CommonList.filter(i => i.StoreId == this.selectedInventory);
            //this.filteredItemListBySelectedInventory=this.AllItemList.filter(i => i.StoreId == this.selectedInventory);
            this.filteredItemListBySelectedInventory = this.CommonList.filter(a => a.StoreId == this.selectedInventory);
            if (this.return.ReturnItemsList.length > 0) {
                this.return.ReturnItemsList = [];
            }
            this.InitializeReturnItems();

        }
        else {
            this.return.TargetStoreId = null;
        }
    }
    OnPressedEnterKeyInItemField(index) {
        if (this.return.ReturnItemsList[index].SelectedItem != null && this.return.ReturnItemsList[index].ItemId != null) {

            this.SetFocusById(`barCodeNumber${index}`);
        }
        else {
            this.return.ReturnItemsList.splice(index, 1);
            this.SetFocusById('remarks');


        }
    }


    ReloadStock() {
        this.wardsupplyBLService.GetInventoryStockByStoreId(this.activeSubstoreId)
            .subscribe(res => {
                if (res.Status == "OK") {
                    this.wardsupplyService.inventoryStockList = res.Results;
                }
                else {
                    console.log(res.ErrorMessage);
                }
            })
    }

    GetBarCodesByItemIdAndStoreId(subStoreId: number, itemId: number): any {
        this.wardsupplyBLService.GetBarCodesOfCapitalItemByItemIdAndSubStoreId(subStoreId, itemId)
            .subscribe((res: DanpheHTTPResponse) => {
                if (res.Status === ENUM_DanpheHTTPResponses.OK) {
                    return res.Results;
                }
                else {
                    console.log(res.ErrorMessage);
                }
            }, err => {
                console.log(err);
            })
    }


}
