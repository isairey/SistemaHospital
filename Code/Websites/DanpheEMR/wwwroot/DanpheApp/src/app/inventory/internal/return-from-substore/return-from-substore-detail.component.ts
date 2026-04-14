import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { DanpheHTTPResponse } from "../../../shared/common-models";
import { MessageboxService } from "../../../shared/messagebox/messagebox.service";
import { ENUM_DanpheHTTPResponseText, ENUM_MessageBox_Status } from "../../../shared/shared-enums";
import { InventoryBLService } from "../../shared/inventory.bl.service";
import { ReturnItem } from "./return-item.model";
@Component({
    selector: 'return-from-substore-detail',
    templateUrl: './return-from-substore-detail.component.html',
    styles: [],
    host: { '(window:keydown)': 'hotkeys($event)' }
})
export class ReturnFromSubstoreDetailComponent implements OnInit {

    @Input('StoreId')
    StoreId: number;
    @Input('ItemId')
    ItemId: number;
    @Input('showReceiveStockPopUp')
    showReceiveStockPopUp: boolean = false;
    ReturnId: number = null;
    IsReceived: boolean = false;
    @Output("callback")
    ReturnIdEmit: EventEmitter<Object> = new EventEmitter<Object>();
    @Input('showViewPopUp')
    showViewPopUp: boolean = false;
    @Output("callback-close")
    callbackClose: EventEmitter<Object> = new EventEmitter<Object>();
    public ReturnedItemList: Array<ReturnItem> = new Array<ReturnItem>();
    ReceivedRemarks: string = '';
    SourceStore: string = '';
    ReceivedByName: string = '';
    ReceivedOn: string = '';
    public ReturnFromSubstoreValidator: FormGroup = null;

    @Input('ReturnId')
    public set value(ReturnId: number) {
        if (ReturnId > 0) {
            this.GetReturnFromSubstoreItems(ReturnId);
        }
    }
    constructor(public messageBoxService: MessageboxService, public inventoryBLService: InventoryBLService, public formBuilder: FormBuilder,

    ) {
    }
    ngOnInit(): void {
        this.ReturnFromSubstoreValidator = this.formBuilder.group({
            ReceivingRemarks: ['', Validators.required]
        });
    }
    ReceiveIncomingStock() {
        if (this.ReturnFromSubstoreValidator.valid) {
            if (this.ReturnedItemList.length > 0) {
                let ReturnId = this.ReturnedItemList[0].ReturnId;
                let ReceivedRemarks = this.ReturnFromSubstoreValidator.get('ReceivingRemarks').value;
                this.ReceivedRemarks = ReceivedRemarks;
                this.UpdateIncomingStock(ReturnId, ReceivedRemarks);
                this.Cancel();
            }
        }
        else {
            this.messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, ['Remarks is mandatory']);
        }
    }
    Cancel() {
        this.callbackClose.emit();
    }
    UpdateIncomingStock(ReturnId: number, ReceivedRemarks: string) {
        this.inventoryBLService.ReceiveRetunedItems(ReturnId, ReceivedRemarks)
            .subscribe((res: DanpheHTTPResponse) => {
                if (res.Status == ENUM_DanpheHTTPResponseText.OK && res.Results != null) {
                    this.ReturnId = res.Results;
                    this.IsReceived = true;
                    this.ReturnIdEmit.emit(this.ReturnId);
                    this.messageBoxService.showMessage(ENUM_MessageBox_Status.Success, ["Received"]);
                    this.ReceivedRemarks = '';
                    this.Cancel();

                }
                else {
                    this.messageBoxService.showMessage(ENUM_MessageBox_Status.Error, ["Unable to receive item"]);
                }
            })
    }
    GetReturnFromSubstoreItems(ReturnId: number) {
        this.ReturnedItemList = [];
        this.inventoryBLService.GetReturnFromSubstoreItems(ReturnId)
            .subscribe((res: DanpheHTTPResponse) => {
                if (res.Status == ENUM_DanpheHTTPResponseText.OK && res.Results.length > 0) {
                    this.ReturnedItemList = res.Results;
                    this.ReceivedByName = this.ReturnedItemList[0].ReceivedByName;
                    this.ReceivedOn = this.ReturnedItemList[0].ReceivedOn;
                    this.SourceStore = this.ReturnedItemList[0].SourceStore;
                    this.ReceivedRemarks = this.ReturnedItemList[0].ReceivedRemarks;
                }
                else {
                    this.messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, ["There is no Returned Items available"]);
                }
            })
    }

    hotkeys(event): void {
        if (event.keyCode === 27) {
            this.Cancel();
        }
    }

}
