import { ChangeDetectorRef, Component } from "@angular/core";
import { SettingsService } from "../../settings-new/shared/settings-service";
import { DanpheHTTPResponse } from "../../shared/common-models";
import { GridEmitModel } from "../../shared/danphe-grid/grid-emit.model";
import { ENUM_DanpheHTTPResponses } from "../../shared/shared-enums";
import { ClinicalSettingsBLService } from "../shared/clinical-settings.bl.service";
import { Reaction } from "../shared/reaction.model";

@Component({
    selector: "reaction-list",
    templateUrl: "./reaction-list.html"
})

export class ReactionListComponent {
    public showRxnAddPage: boolean = false;
    public showAllRxnList: boolean = false;
    public reactionGridColumns: unknown;
    public reactionList: Array<Reaction> = new Array<Reaction>();
    public selectedReaction: Reaction;
    public selectedID: null;

    constructor(public settingsServ: SettingsService, public cliSetBLService: ClinicalSettingsBLService, public changeDetector: ChangeDetectorRef) {
        this.reactionGridColumns = this.settingsServ.settingsGridCols.ReactionList;
        this.getReactionList();
    }



    getReactionList() {
        this.cliSetBLService.GetReactions()
            .subscribe((res: DanpheHTTPResponse) => {
                if (res.Status === ENUM_DanpheHTTPResponses.OK && res.Results) {
                    this.reactionList = res.Results;
                }
            });
        this.showAllRxnList = true;
    }

    ReactionGridActions($event: GridEmitModel) {

        switch ($event.Action) {
            case "edit": {
                this.selectedReaction = null;
                this.selectedID = $event.Data.ReactionId;
                this.showRxnAddPage = false;
                this.changeDetector.detectChanges();
                this.selectedReaction = $event.Data;
                this.showRxnAddPage = true;
            }
            default:
                break;
        }
    }

    ShowAddReaction() {
        this.showRxnAddPage = false;
        this.changeDetector.detectChanges();
        this.showRxnAddPage = true;
    }

    CallBackAdd($event) {
        this.reactionList.push($event.reaction);
        if (this.selectedID != null) {

            let i = this.reactionList.findIndex(a => a.ReactionId == this.selectedID);
            this.reactionList.splice(i, 1);
        }
        this.reactionList = this.reactionList.slice();
        this.changeDetector.detectChanges();
        this.showRxnAddPage = false;
        this.selectedReaction = null;
        this.selectedID = null;
    }

}
