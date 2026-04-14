import { Component } from "@angular/core";
import { DanpheHTTPResponse } from "../../../shared/common-models";
import GridColumnSettings from "../../../shared/danphe-grid/grid-column-settings.constant";
import { GridEmitModel } from "../../../shared/danphe-grid/grid-emit.model";
import { MessageboxService } from "../../../shared/messagebox/messagebox.service";
import { ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status } from "../../../shared/shared-enums";
import { InventorySettingBLService } from "../shared/inventory-settings.bl.service";
import { ConsumptionType } from "./consumption-type.model";

@Component({
    selector: 'app-consumption-type',
    templateUrl: './consumption-type-list.component.html'
})
export class ConsumptionTypeListComponent {
    ShowAddConsumptionPopupPage: boolean = false;
    ConsumptionTypes: ConsumptionType[] = [];
    ConsumptionTypeGridColumns: Array<any> = [];
    ConsumptionType: ConsumptionType = new ConsumptionType();
    RowIndex: number = 0;
    IsEditMode: boolean = false;
    constructor(private inventorySettingBLService: InventorySettingBLService, private messageBoxService: MessageboxService) {
        this.ConsumptionTypeGridColumns = GridColumnSettings.ConsumptionTypeGridColumns;

    }
    ngOnInit() {
        this.GetConsumptionTypes();
    }
    OpenAddConsumptionTypePopupPage() {
        this.ShowAddConsumptionPopupPage = true;
        this.IsEditMode = false;
    }
    CloseAddConsumptionTypePopupPage($event) {
        if ($event && $event.data) {
            switch ($event.action) {
                case 'add':
                    this.ConsumptionTypes.unshift($event.data);
                    this.ConsumptionTypes = this.ConsumptionTypes.slice();
                    break;
                case 'update':
                    this.ConsumptionTypes.splice(this.RowIndex, 1, $event.data);
                    this.ConsumptionTypes = this.ConsumptionTypes.slice();
            }
        }
        this.ConsumptionType = new ConsumptionType();
        this.ShowAddConsumptionPopupPage = false;
        this.RowIndex = 0;
    }

    GetConsumptionTypes() {
        this.inventorySettingBLService.GetConsumptionTypes().subscribe((res: DanpheHTTPResponse) => {
            if (res.Status === ENUM_DanpheHTTPResponses.OK) {
                this.ConsumptionTypes = res.Results;
            }
        },
            err => {
                console.log(err.ErrorMessage);
            })
    }

    ConsumptionTypeGridActions($event: GridEmitModel) {
        this.RowIndex = $event.RowIndex;
        switch ($event.Action) {
            case "edit": {
                this.ConsumptionType = $event.Data;
                this.ShowAddConsumptionPopupPage = true;
                this.IsEditMode = true;
                break;
            }
            case "deActivate": {
                let consumptionTypeId = $event.Data.ConsumptionTypeId;
                this.ActivateDeActivateConsumptionType(consumptionTypeId, false);
                break;

            }
            case "activate": {
                let consumptionTypeId = $event.Data.ConsumptionTypeId;
                this.ActivateDeActivateConsumptionType(consumptionTypeId, true);
                break;
            }
            default:
                break;
        }
    }
    ActivateDeActivateConsumptionType(consumptionTypeId: number, flag: boolean) {
        this.inventorySettingBLService
            .ActivateDeActiveConsumptionType(consumptionTypeId, flag)
            .subscribe((res: DanpheHTTPResponse) => {
                if (res.Status === ENUM_DanpheHTTPResponses.OK) {
                    this.ConsumptionTypes.splice(this.RowIndex, 1, res.Results);
                    this.ConsumptionTypes = this.ConsumptionTypes.slice();
                    if (res.Results.IsActive) {
                        this.messageBoxService.showMessage(ENUM_MessageBox_Status.Success, ['Successfully activated'])
                    }
                    else {
                        this.messageBoxService.showMessage(ENUM_MessageBox_Status.Success, ['Successfully Deactivated'])
                    }
                }
                else {
                    this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ['Failed to perform operation. ' + res.ErrorMessage]);
                }
            },
                err => {
                    console.log(err);
                })
    }

}