import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DanpheHTTPResponse } from '../../../shared/common-models';
import { MessageboxService } from '../../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status } from '../../../shared/shared-enums';
import { InventorySettingBLService } from '../shared/inventory-settings.bl.service';
import { ConsumptionType } from './consumption-type.model';
@Component({
    selector: 'consumption-type',
    templateUrl: './consumption-type.component.html'
})
export class ConsumptionTypeComponent implements OnInit {
    @Input('consumption-type')
    ConsumptionType: ConsumptionType = new ConsumptionType();

    @Input("ConsumptionTypes")
    public ConsumptionTypes = new Array<ConsumptionType>();
    consumptionTypeForm: FormGroup;
    submitted = false;
    showAddPage: boolean = false;
    @Output('call-back-popup-close')
    CallBackClosePopup: EventEmitter<Object> = new EventEmitter<Object>();
    Loading: boolean = false;
    @Input('is-edit-mode') IsEditMode: boolean = false;
    constructor(private formBuilder: FormBuilder, private inventorySettingService: InventorySettingBLService, private messageBoxService: MessageboxService) {
        this.consumptionTypeForm = this.formBuilder.group({
            ConsumptionTypeId: [0],
            ConsumptionTypeName: ['', Validators.required],
            IsActive: []
        });
    }
    ngOnInit() {
        this.consumptionTypeForm.setValue({
            ConsumptionTypeId: this.ConsumptionType.ConsumptionTypeId,
            ConsumptionTypeName: this.ConsumptionType.ConsumptionTypeName,
            IsActive: this.ConsumptionType.IsActive
        });
    }
    get ConsumptionFormControl() {
        return this.consumptionTypeForm.controls;
    }
    Save() {
        this.submitted = true;
        if (this.consumptionTypeForm.invalid) {
            return;
        }

        if (this.ConsumptionTypes && this.ConsumptionTypes.length) {
            const isConsumptionTypeNameAlreadyExists = this.ConsumptionTypes.some(a => a.ConsumptionTypeName.toLowerCase() === this.ConsumptionType.ConsumptionTypeName.toLowerCase());
            if (isConsumptionTypeNameAlreadyExists) {
                this.messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`Cannot Add New Consumption Type as Consumption Type Name "${this.ConsumptionType.ConsumptionTypeName}" already exists.`]);
                return;
            }
        }
        if (this.consumptionTypeForm.valid) {
            this.ConsumptionType = Object.assign({}, this.ConsumptionType, this.consumptionTypeForm.value);
            this.Loading = true;
            this.inventorySettingService.SaveConsumptionType(this.ConsumptionType).finally(() => {
                this.Loading = false;
            }).subscribe((res: DanpheHTTPResponse) => {
                if (res.Status === ENUM_DanpheHTTPResponses.OK) {
                    this.messageBoxService.showMessage(ENUM_MessageBox_Status.Success, ['Consumption type saved successfully']);
                    this.CallBackClosePopup.emit({ action: 'add', data: res.Results });

                }
                else {
                    this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ['Failed to save consumption type.']);
                }
            },
                err => {
                    console.log(err.ErrorMessage);
                });
        }
    }
    Update() {
        if (this.ConsumptionTypes && this.ConsumptionTypes.length) {
            const isConsumptionTypeNameAlreadyExists = this.ConsumptionTypes.some(a => a.ConsumptionTypeName.toLowerCase() === this.ConsumptionType.ConsumptionTypeName.toLowerCase() && a.ConsumptionTypeId !== this.ConsumptionType.ConsumptionTypeId);
            if (isConsumptionTypeNameAlreadyExists) {
                this.messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`Cannot Update New Consumption Type as Consumption Type Name "${this.ConsumptionType.ConsumptionTypeName}" already exists!`]);
                return;
            }
        }

        if (this.consumptionTypeForm.valid) {
            this.ConsumptionType = Object.assign({}, this.ConsumptionType, this.consumptionTypeForm.value);
            this.inventorySettingService.UpdateConsumptionType(this.ConsumptionType).finally(() => {
                this.Loading = false;
            }).subscribe((res: DanpheHTTPResponse) => {
                if (res.Status === ENUM_DanpheHTTPResponses.OK) {
                    this.CallBackClosePopup.emit({ action: 'update', data: res.Results });
                    this.messageBoxService.showMessage(ENUM_MessageBox_Status.Success, ['Consumption type saved successfully']);

                }
                else {
                    this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ['Failed to save consumption type.']);
                }
            },
                err => {
                    console.log(err.ErrorMessage);
                });
        }
    }
    Close() {
        this.CallBackClosePopup.emit();
    }


}