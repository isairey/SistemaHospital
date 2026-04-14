import { Component, EventEmitter, Input, Output } from "@angular/core";
import 'rxjs/Rx';
import { CoreService } from "../../../core/shared/core.service";
import { MessageboxService } from "../../../shared/messagebox/messagebox.service";
import { ENUM_MessageBox_Status } from "../../../shared/shared-enums";
import { LabTestRequisition } from "../../shared/lab-requisition.model";
import { LabSticker } from "../../shared/lab-sticker.model";
import { LabsBLService } from "../../shared/labs.bl.service";


@Component({
    selector: 'undo-samplecode',
    templateUrl: "./undo-labsamplecode.html",
    styles: ['.tbl-max{max-height: 350px;}']
})

export class UndoLabSampleCode {
    @Input("showUndoOption")
    public showUndoOption: boolean;

    @Input("requisitionIdList")
    public requisitionIdList: Array<number>;
    @Input("undoFromPageAction")
    public undoFromPageAction: string;

    @Input("PatientLabInfo")
    public patientinfos: LabSticker = new LabSticker();

    @Output("callback-Add") sendDataBack: EventEmitter<object> = new EventEmitter<object>();

    public allLabRequisitions: Array<LabTestRequisition> = new Array<LabTestRequisition>();
    public loading: boolean = false;

    constructor(public msgBoxServ: MessageboxService, public coreService: CoreService, public labBLService: LabsBLService) {

    }

    ngOnInit() {
        if (this.requisitionIdList && this.requisitionIdList.length > 0) {
            this.GetAllRequisitionsFromIdList(this.requisitionIdList);
        }
    }

    public GetAllRequisitionsFromIdList(reqIdList: Array<number>) {
        //LabTestRequisition
        this.labBLService.GetLabRequisitionsFromReqIdList(this.requisitionIdList)
            .subscribe(res => {
                if (res.Status == "OK") {
                    this.allLabRequisitions = res.Results;
                    this.allLabRequisitions.forEach(req => {
                        req["IsSelected"] = true;
                    });
                }
            });
    }

    public UndoSampleCode(allRequisitionList: Array<LabTestRequisition>) {
        var reqIdList: Array<number> = new Array<number>();
        allRequisitionList.forEach(val => {
            if (val["IsSelected"] == true) {
                reqIdList.push(val.RequisitionId);
            }
        });

        if (reqIdList && reqIdList.length > 0) {
            this.labBLService.UndoSampleCode(reqIdList, this.undoFromPageAction)
                .subscribe(res => {
                    if (res.Status == 'OK') {
                        this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Success, ["Sample Code Reset Successfully done"]);
                        this.loading = false;
                        this.sendDataBack.emit({ exit: 'exitonsuccess' });
                    }
                });
        }
        else {
            this.msgBoxServ.showMessage('Alert', ["Please select atleast one Test!"]);
            this.loading = false;
        }


    }

    CloseUndoBox() {
        this.sendDataBack.emit({ exit: 'close' });
    }

}
