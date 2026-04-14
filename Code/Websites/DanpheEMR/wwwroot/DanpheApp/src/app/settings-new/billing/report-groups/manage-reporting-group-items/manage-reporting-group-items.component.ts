import { Component, EventEmitter, Input, Output } from "@angular/core";
import { BillItemPrice } from "../../../../billing/shared/billitem-price.model";
import { SecurityService } from "../../../../security/shared/security.service";
import { ReportingItemServiceItemMapping_DTO } from "../../../../settings-new/shared/DTOs/reporting-item-service-item-mapping.dto";
import { ReportGroupServiceItemMappingModel } from "../../../../settings-new/shared/report-group-service-item-mapping.model";
import { SettingsBLService } from "../../../../settings-new/shared/settings.bl.service";
import { DanpheHTTPResponse } from "../../../../shared/common-models";
import { MessageboxService } from "../../../../shared/messagebox/messagebox.service";
import { ENUM_DanpheHTTPResponses, ENUM_Data_Type, ENUM_MessageBox_Status } from "../../../../shared/shared-enums";
import { ServiceDepartment_DTO } from "../../shared/dto/service-department.dto";
import { ReportGroupModel } from "../../shared/report-group.model";

@Component({
    selector: 'manage-report-group-item',
    templateUrl: './manage-reporting-group-items.component.html',

})


export class ManageReportGroupComponent {
    @Output("callback-manage") callbackManage = new EventEmitter<boolean>();

    @Input("selectedReportGroupItem")
    SelectedReportGroupItem: ReportGroupModel;
    ServiceItemList: Array<ReportingItemServiceItemMapping_DTO> = [];
    AlreadyMappedServiceItems: Array<ReportGroupServiceItemMappingModel> = [];
    FilteredServiceItemList: Array<ReportingItemServiceItemMapping_DTO> = [];
    SelectedReportGroupServiceItemMapping: Array<ReportGroupServiceItemMappingModel> = new Array<ReportGroupServiceItemMappingModel>();
    SelectedItem: BillItemPrice;
    ServiceDepartmentList: Array<ServiceDepartment_DTO> = new Array<ServiceDepartment_DTO>();
    SelectedDepartment: ServiceDepartment_DTO = null;
    SelectedDynamicReportGroupId: number;
    IsAllSelected: boolean = false;

    constructor(public settingsBLService: SettingsBLService,
        public securityService: SecurityService,
        public msgBoxServ: MessageboxService) {
    }

    ngOnInit() {
        if (this.SelectedReportGroupItem) {
            this.SelectedDynamicReportGroupId = this.SelectedReportGroupItem.DynamicReportGroupId;
            this.GetBillingServiceItemList();
            this.GetAlreadyMappedServiceItems();
            this.GetActiveServiceDepartmentList()
        }

    }


    Submit() {
        console.log(this.SelectedReportGroupServiceItemMapping);
        let serviceItemMappings = this.SelectedReportGroupServiceItemMapping.map(item => {
            return {
                DynamicReportGroupId: this.SelectedDynamicReportGroupId,
                ServiceItemId: item.ServiceItemId
            };
        });


        let unselectedItems = this.AlreadyMappedServiceItems
            .filter(item => !this.SelectedReportGroupServiceItemMapping.some(sel => sel.ServiceItemId === item.ServiceItemId))
            .map(item => {
                return {
                    DynamicReportGroupId: null,
                    ServiceItemId: item.ServiceItemId
                };
            });

        // Combined the selected and unselected item mappings into one array
        let finalMappings = serviceItemMappings.concat(unselectedItems);

        if (finalMappings.length > 0) {
            this.settingsBLService.MapServiceItemsToReportGroup(finalMappings)
                .subscribe(res => {
                    if (res.Status === ENUM_DanpheHTTPResponses.OK) {
                        this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Success, ['Items successfully mapped/unmapped to the report group.']);
                        this.GetAlreadyMappedServiceItems(); // Refresh the already mapped items
                    } else {
                        this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, [res.ErrorMessage]);
                    }
                }, err => {
                    this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, ['Failed to map/unmap items.'], err.ErrorMessage);
                });
        } else {
            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Warning, ['Please select at least one service item to map/unmap.']);
        }
    }


    SelectItemSearchBox(selectedItem: BillItemPrice) {
        if (typeof selectedItem === ENUM_Data_Type.Object && !Array.isArray(selectedItem) && selectedItem !== null) {
            let isMapped = this.AlreadyMappedServiceItems.some(mappedItem => mappedItem.ServiceItemId === selectedItem.BillItemPriceId);

            if (!isMapped) {
                let check = false;
                for (let sel of this.SelectedReportGroupServiceItemMapping) {
                    if (sel.ServiceItemId === selectedItem.BillItemPriceId) {
                        check = true;
                        break;
                    }
                }
                if (!check) {
                    selectedItem.IsSelected = true;
                    this.ServiceItemEventHandler(selectedItem);
                    this.ChangeMainListSelectStatus(selectedItem.BillItemPriceId, true);
                } else {
                    this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, ["This item is already added"]);
                }
            } else {
                this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, ["This item is already mapped to another report group"]);
            }
        }
        this.SelectedItem = null;
    }

    GetAlreadyMappedServiceItems() {
        this.settingsBLService.GetMappedServiceItemsByReportGroupId(this.SelectedDynamicReportGroupId)
            .subscribe((res: DanpheHTTPResponse) => {
                if (res.Status === ENUM_DanpheHTTPResponses.OK) {
                    if (res.Results && res.Results.length > 0) {
                        this.AlreadyMappedServiceItems = res.Results;
                        console.log(this.AlreadyMappedServiceItems);

                        this.SelectedReportGroupServiceItemMapping = this.AlreadyMappedServiceItems.map(item => ({
                            ServiceItemId: item.ServiceItemId,
                            ItemName: item.ItemName,
                            ServiceDepartmentName: item.ServiceDepartmentName,
                            IsSelected: true,
                            DynamicReportGroupId: this.SelectedDynamicReportGroupId,
                            IsActive: true,
                            ServiceDepartmentId: item.ServiceDepartmentId
                        }));

                        this.GetBillingServiceItemList();
                    } else {
                        this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Warning, ['No mapped items found for this report group.']);
                    }
                } else {
                    this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, [res.ErrorMessage]);
                }
            }, err => {
                this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, ['Failed to load already mapped items.'], err.ErrorMessage);
            });
    }

    myListFormatter(data: any): string {
        let html = data["ItemName"];
        return html;
    }

    DepartmentListFormatter(data: any): string {
        return data["ServiceDepartmentName"] ? data["ServiceDepartmentName"] : 'Unnamed Department';
    }
    GetBillingServiceItemList() {
        this.settingsBLService.GetActiveServiceItemList()
            .subscribe((res: DanpheHTTPResponse) => {
                if (res.Status === ENUM_DanpheHTTPResponses.OK) {
                    if (res.Results && res.Results.length > 0) {
                        this.ServiceItemList = res.Results
                            .map(item => {
                                let isMappedToOtherGroup = this.AlreadyMappedServiceItems.some(mappedItem =>
                                    mappedItem.ServiceItemId === item.ServiceItemId &&
                                    mappedItem.DynamicReportGroupId !== this.SelectedDynamicReportGroupId
                                );


                                if (item.DynamicReportGroupId === null || item.DynamicReportGroupId === this.SelectedDynamicReportGroupId) {
                                    item.IsSelected = this.AlreadyMappedServiceItems.some(mappedItem =>
                                        mappedItem.ServiceItemId === item.ServiceItemId &&
                                        mappedItem.DynamicReportGroupId === this.SelectedDynamicReportGroupId
                                    );
                                    return item;
                                }


                                return null;
                            })
                            .filter(item => item !== null);
                        this.FilteredServiceItemList = this.ServiceItemList;
                    }
                } else {
                    this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, [res.ErrorMessage]);
                }
            },
                err => {
                    this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, ['Failed to fetch service items list.'], err.ErrorMessage);
                });
    }

    GetActiveServiceDepartmentList() {
        this.settingsBLService.GetServiceDepartments()
            .subscribe((res: DanpheHTTPResponse) => {
                if (res.Status === ENUM_DanpheHTTPResponses.OK) {
                    if (res.Results && res.Results.length > 0) {
                        this.ServiceDepartmentList = res.Results.filter(sevDemp => sevDemp.IsActive === true);
                        console.log(this.ServiceDepartmentList);
                    }
                } else {
                    this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, [res.ErrorMessage]);
                }
            },
                err => {
                    this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, ['Failed to fetch service items list.'], err.ErrorMessage);
                });
    }
    GetActiveServiceItemList() {
        this.settingsBLService.GetActiveServiceItemList()
            .subscribe((res: DanpheHTTPResponse) => {
                if (res.Status === ENUM_DanpheHTTPResponses.OK) {
                    if (res.Results && res.Results.length > 0) {
                        this.ServiceItemList = res.Results
                    }
                } else {
                    this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, [res.ErrorMessage]);
                }
            },
                err => {
                    this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, ['Failed to fetch service items list.'], err.ErrorMessage);
                });
    }
    selectItem(item) {
        item.IsSelected = !item.IsSelected;
        this.ServiceItemEventHandler(item);
    }
    ServiceItemEventHandler(item) {
        if (item.IsSelected) {
            let existingItem = this.SelectedReportGroupServiceItemMapping.find(x => x.ServiceItemId === item.ServiceItemId);
            if (!existingItem) {
                let isMappedToOtherGroup = this.AlreadyMappedServiceItems.some(mappedItem =>
                    mappedItem.ServiceItemId === item.ServiceItemId &&
                    mappedItem.DynamicReportGroupId !== this.SelectedDynamicReportGroupId
                );

                if (!isMappedToOtherGroup) {
                    this.SelectedReportGroupServiceItemMapping.push({
                        ServiceItemId: item.ServiceItemId,
                        ItemName: item.ItemName,
                        ServiceDepartmentName: item.ServiceDepartmentName,
                        IsSelected: true,
                        DynamicReportGroupId: this.SelectedDynamicReportGroupId,
                        IsActive: false,
                        ServiceDepartmentId: item.ServiceDepartmentId
                    });
                } else {
                    this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, ['This service item is already mapped to another report group.']);
                    item.IsSelected = false;
                }
            }
        } else {
            this.SelectedReportGroupServiceItemMapping = this.SelectedReportGroupServiceItemMapping.filter(x => x.ServiceItemId !== item.ServiceItemId);
        }
        const allFilteredSelected = this.FilteredServiceItemList.every(x => x.IsSelected);
        this.IsAllSelected = allFilteredSelected;

        console.log("Updated selected items list:", this.SelectedReportGroupServiceItemMapping);
    }

    ChangeMainListSelectStatus(itemId: number, val: boolean) {
        for (let item of this.ServiceItemList) {
            if (item.ServiceItemId === itemId) {
                item.IsSelected = val;
                break;
            }
        }
    }
    FilterDepartmentSearchBox(selectedDepartment: ServiceDepartment_DTO) {
        if (selectedDepartment && selectedDepartment.ServiceDepartmentId) {
            this.SelectedDepartment = selectedDepartment;
            this.FilteredServiceItemList = this.ServiceItemList.filter(
                item => item.ServiceDepartmentId === selectedDepartment.ServiceDepartmentId
            );
        } else {
            this.SelectedDepartment = null;
            this.FilteredServiceItemList = this.ServiceItemList;
        }
        this.IsAllSelected = this.FilteredServiceItemList.length > 0 &&
            this.FilteredServiceItemList.every(item => item.IsSelected);
    }
    ToggleAllSelections(isAllSelected: boolean) {
        if (this.FilteredServiceItemList.length > 0) {
            this.FilteredServiceItemList.forEach(item => {
                item.IsSelected = isAllSelected;
                this.ServiceItemEventHandler(item);
            });

            if (!this.SelectedDepartment) {
                this.ServiceItemList.forEach(item => {
                    item.IsSelected = isAllSelected;
                });
            }
        } else {
            this.IsAllSelected = false;
        }

    }
    HideManage(): void {
        this.callbackManage.emit();
    }
}