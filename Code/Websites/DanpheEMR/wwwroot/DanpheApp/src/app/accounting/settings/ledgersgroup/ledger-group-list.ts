import { ChangeDetectorRef, Component } from "@angular/core";
import GridColumnSettings from '../../../shared/danphe-grid/grid-column-settings.constant';
import { GridEmitModel } from "../../../shared/danphe-grid/grid-emit.model";
import { MessageboxService } from '../../../shared/messagebox/messagebox.service';
import { ENUM_MessageBox_Status } from "../../../shared/shared-enums";
import { AccountingService } from "../../shared/accounting.service";
import { AccountingSettingsBLService } from '../shared/accounting-settings.bl.service';
import { ledgerGroupModel } from '../shared/ledgerGroup.model';

@Component({
    selector: 'ledgergroup-list',
    templateUrl: './ledger-group-list.html',
})
export class LedgerGroupListComponent {
    public ledgerGroupList: Array<ledgerGroupModel> = new Array<ledgerGroupModel>();
    public showLedgerGroupList: boolean = true;
    public ledgerGroupGridColumns: Array<any> = null;
    public showAddPage: boolean = false;
    public selectedLedgerGroup: ledgerGroupModel;
    public index: number;
    public update: boolean = false;
    constructor(public accountingSettingsBLService: AccountingSettingsBLService,
        public msgBox: MessageboxService,
        public changeDetector: ChangeDetectorRef,
        public accountingService: AccountingService) {
        this.ledgerGroupGridColumns = GridColumnSettings.ledgerGroupList;
        this.getLedgerGroupList();
    }
    public getLedgerGroupList() {
        if (!!this.accountingService.accCacheData.LedgerGroups && this.accountingService.accCacheData.LedgerGroups.length > 0) {//mumbai-team-june2021-danphe-accounting-cache-change
            this.ledgerGroupList = this.accountingService.accCacheData.LedgerGroups;//mumbai-team-june2021-danphe-accounting-cache-change
            this.ledgerGroupList = this.ledgerGroupList.slice();//mumbai-team-june2021-danphe-accounting-cache-change
            this.showLedgerGroupList = true;
        }
    }

    AddLedgerGroup() {
        this.update = false;
        this.showAddPage = false;
        this.changeDetector.detectChanges();
        this.showAddPage = true;
    }

    CallBackAdd($event) {
        this.getLedgerGroupList();//mumbai-team-june2021-danphe-accounting-cache-change
        this.showAddPage = false;
        this.selectedLedgerGroup = null;
        this.index = null;
    }
    LedgerGroupGridActions($event: GridEmitModel) {
        switch ($event.Action) {
            case "activateDeactivateBasedOnStatus": {
                if ($event.Data != null) {
                    this.selectedLedgerGroup = null;
                    this.index = $event.RowIndex;//mumbai-team-june2021-danphe-accounting-cache-change
                    this.selectedLedgerGroup = $event.Data;
                    this.ActivateDeactivateLedgerStatus(this.selectedLedgerGroup);
                    this.showLedgerGroupList = true;
                    this.selectedLedgerGroup = null;
                }
                break;
            }
            case "edit": {
                if ($event.Data != null) {
                    this.update = true;
                    this.showAddPage = false;
                    this.selectedLedgerGroup = null;
                    this.changeDetector.detectChanges();
                    //this.index = $event.RowIndex;
                    this.selectedLedgerGroup = $event.Data;
                    this.changeDetector.detectChanges();
                    this.showLedgerGroupList = true;
                    this.showAddPage = true;
                }
                break;
            }
            default:
                break;
        }
    }

    ActivateDeactivateLedgerStatus(selectedLedgerGrp: ledgerGroupModel) {
        if (selectedLedgerGrp != null) {
            let status = selectedLedgerGrp.IsActive == true ? false : true;
            let msg = status == true ? 'Activate' : 'Deactivate';
            if (confirm("Are you Sure want to " + msg + ' ' + selectedLedgerGrp.LedgerGroupName + ' ?')) {

                selectedLedgerGrp.IsActive = status;
                //we want to update the ISActive property in table there for this call is necessry
                this.accountingSettingsBLService.UpdateLedgerGrpIsActive(selectedLedgerGrp)
                    .subscribe(
                        res => {
                            if (res.Status == "OK") {
                                let responseMessage = res.Results.IsActive ? "is now activated." : "is now Deactivated.";
                                this.msgBox.showMessage(ENUM_MessageBox_Status.Success, [res.Results.LedgerGroupName + ' ' + responseMessage]);
                                //This for send to callbackadd function to update data in list
                                this.getLedgerGroupList();
                            }
                            else {
                                this.msgBox.showMessage(ENUM_MessageBox_Status.Error, ['Something wrong' + res.ErrorMessage]);
                            }
                        },
                        err => {
                            this.logError(err);
                        });
            }

        }

    }
    logError(err: any) {
        console.log(err);
    }

}
