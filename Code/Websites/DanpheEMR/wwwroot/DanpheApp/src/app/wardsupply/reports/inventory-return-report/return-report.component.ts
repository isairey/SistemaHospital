import { Component } from "@angular/core";
import { InventoryBLService } from "../../../inventory/shared/inventory.bl.service";
import { PHRMStoreModel } from "../../../pharmacy/shared/phrm-store.model";
import { SecurityService } from "../../../security/shared/security.service";
import { DanpheHTTPResponse } from "../../../shared/common-models";
import { MessageboxService } from "../../../shared/messagebox/messagebox.service";
import { ENUM_DanpheHTTPResponseText, ENUM_GRItemCategory, ENUM_MessageBox_Status } from "../../../shared/shared-enums";
import { InventoryWardItem_DTO } from "../../inventory-wardsupply/requisition/shared/inventory-wardd-item.dto";
import WARDGridColumns from "../../shared/ward-grid-cloumns";
import { WardReturnReportModel } from "../../shared/ward-return-report.model";
import { WardSupplyBLService } from "../../shared/wardsupply.bl.service";

@Component({
    selector: 'return-report',
    templateUrl: "./return-report.component.html"
})
export class WardInventoryReturnReportComponent {
    ReturnList: Array<WardReturnReportModel> = new Array<WardReturnReportModel>();
    FromDate: string = '';
    ToDate: string = '';
    SourceStoreId: number = null;
    TargetStoreId: number = null;
    ItemCategoryId: number = null;
    ItemId: number = null;
    loading: boolean = false;
    WardReturnColumn: Array<any> = null;
    public inventoryList: PHRMStoreModel[] = [];
    ItemCategories: ENUM_GRItemCategory[];
    ItemList: InventoryWardItem_DTO[] = [];
    selectedInventory: PHRMStoreModel = null;
    ItemCategory: ENUM_GRItemCategory = ENUM_GRItemCategory.Consumables;
    selectedItem: InventoryWardItem_DTO = null;

    constructor(public wardBLService: WardSupplyBLService, public msgBoxServ: MessageboxService, public securityService: SecurityService, public InventoryBLService: InventoryBLService) {
        this.WardReturnColumn = WARDGridColumns.WardInventoryReturnReportList;
        this.SourceStoreId = this.securityService.getActiveStore().StoreId;
        this.GetAllInventory();
        this.LoadItemCategory();
        this.LoadItemList();
    }
    OnFromToDateChange($event) {
        if ($event) {
            this.FromDate = $event.fromDate;
            this.ToDate = $event.toDate;
        }
    }
    Load() {
        this.loading = true;
        this.ReturnList = [];
        this.wardBLService.GetWardInventoryReturnReport(this.FromDate, this.ToDate, this.SourceStoreId, this.TargetStoreId, this.ItemCategory, this.ItemId).finally(() => this.loading = false).
            subscribe((res: DanpheHTTPResponse) => {
                if (res.Status === ENUM_DanpheHTTPResponseText.OK && res.Results.length) {
                    this.ReturnList = res.Results;
                }
                else {
                    this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Notice, [res.ErrorMessage])
                }
            });

    }
    GetAllInventory() {
        this.wardBLService.GetInventoryList().subscribe(res => {
            if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
                this.inventoryList = res.Results;
            }
            else {
                this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ["Failed to load inventory list"]);
            }
        }, err => {
            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ["Failed to load inventory list"]);
        });
    }
    public LoadItemCategory() {
        this.ItemCategories = Object.values(ENUM_GRItemCategory).filter(p => isNaN(p as any));
    }
    LoadItemList(): void {
        this.ItemList = [];
        this.InventoryBLService.GetItemList()
            .subscribe((res: DanpheHTTPResponse) => {
                if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
                    if (res.Results && res.Results.length) {
                        this.ItemList = res.Results;
                    }
                }
            },
                err => {
                    this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ['failed to get Item.. please check log for details.']);
                });
    }
    OnInventoryChange() {
        let inventory = null;
        if (!this.selectedInventory) {
            this.TargetStoreId = null;
        }
        else if (typeof (this.selectedInventory) == 'string') {
            inventory = this.inventoryList.find(a => a.Name.toLowerCase() == this.selectedInventory.Name.toLowerCase());
        }
        else if (typeof (this.selectedInventory) == "object") {
            inventory = this.selectedInventory;
        }
        if (inventory) {
            this.TargetStoreId = inventory.StoreId;
        }
        else {
            this.TargetStoreId = null;
        }
    }
    InventoryListFormatter(data: any): string {
        return data["Name"];
    }
    ItemListFormatter(data: any): string {
        return data["ItemName"];
    }
    OnItemChange() {
        let item = null;
        if (!this.selectedItem) {
            this.ItemId = null;
        }
        else if (typeof (this.selectedItem) == 'string') {
            item = this.ItemList.find(a => a.ItemName.toLowerCase() == this.selectedItem.ItemName.toLowerCase());
        }
        else if (typeof (this.selectedItem) == "object") {
            item = this.selectedItem;
        }
        if (item) {
            this.ItemId = item.ItemId;
        }
        else {
            this.ItemId = null;
        }
    }
}