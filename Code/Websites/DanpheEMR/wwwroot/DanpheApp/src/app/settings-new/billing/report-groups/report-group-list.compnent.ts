import { ChangeDetectorRef, Component } from "@angular/core";
import { CoreService } from '../../../core/shared/core.service';
import { SecurityService } from "../../../security/shared/security.service";
import { DanpheHTTPResponse } from "../../../shared/common-models";
import { GridEmitModel } from "../../../shared/danphe-grid/grid-emit.model";
import { SettingsGridColumnSettings } from '../../../shared/danphe-grid/settings-grid-column-settings';
import { MessageboxService } from "../../../shared/messagebox/messagebox.service";
import { ENUM_Add_UpdateAction, ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status } from "../../../shared/shared-enums";
import { SettingsBLService } from "../../shared/settings.bl.service";
import { ReportGroupModel } from "../shared/report-group.model";

@Component({
    selector: 'report-group-list',
    templateUrl: './report-group-list.component.html',

})


export class ReportGroupListComponent {

    ReportGroupList: Array<ReportGroupModel> = new Array<ReportGroupModel>();
    SelectedReportGroupItem: ReportGroupModel;
    SelectedItem: ReportGroupModel;
    ReportGroupFieldGridCols: typeof SettingsGridColumnSettings.prototype.ReportGroupFieldGridCols;
    SetCLNHeadingGridColumns: SettingsGridColumnSettings = null;
    ShowAddPage: boolean = false;
    ShowGrid: boolean = false;
    ShowManageItem: boolean = false;
    ItemId: number = null;
    Index: number;
    UnmappedServiceItemsTooltip: string;

    constructor(
        public changeDetector: ChangeDetectorRef,
        private _coreService: CoreService,
        private _securityService: SecurityService,
        private _settingsBLService: SettingsBLService,
        private _msgBoxServ: MessageboxService,
    ) {
        this.SetCLNHeadingGridColumns = new SettingsGridColumnSettings(this._coreService.taxLabel, this._securityService);
        this.ReportGroupFieldGridCols = this.SetCLNHeadingGridColumns.ReportGroupFieldGridCols;
    }
    ngOnInit() {
        this.UnmappedServiceItemsTooltip = 'Display Those Service items that are not mapped to any Reports';
        this.GetReportGroupList();
    }
    AddReportGroup() {
        this.ShowAddPage = true;
        this.SelectedItem = null;
        this.changeDetector.detectChanges();
    }

    ReportGroupGridActions($event: GridEmitModel) {
        switch ($event.Action) {
            case "edit": {
                this.SelectedItem = null;
                this.Index = $event.RowIndex;
                this.ShowAddPage = false;
                this.changeDetector.detectChanges();
                this.SelectedItem = $event.Data;
                console.log(this.SelectedItem);
                this.ShowAddPage = true;
                break;
            }
            case "activateReportGroupTemplateSetting":
            case "deactivateReportGroupTemplateSetting": {
                this.SelectedItem = $event.Data;
                this.ActivateDeactivatePersonalPhrases(this.SelectedItem);
                break;
            }
            case "manageReportingItem": {
                if ($event.Data != null) {
                    this.SelectedItem = null;
                    this.changeDetector.detectChanges();
                    this.ShowManageItem = false;
                    this.SelectedItem = $event.Data;
                    this.ShowManageItem = true;
                    this.ShowGrid = false;

                    break;

                }
                break;
            }
            default:
                break;
        }
    }

    CallBackAdd($event) {

        let action = $event.action;

        if (action == ENUM_Add_UpdateAction.Add || action == ENUM_Add_UpdateAction.Update) {

            let itmIndex = this.ReportGroupList.findIndex(a => a.DynamicReportGroupId == $event.item.DynamicReportGroupId);

            if (itmIndex < 0) {
                this.ReportGroupList.splice(0, 0, $event.item);
            }
            else {
                this.ReportGroupList.splice(itmIndex, 1, $event.item);
            }
        }
        this.ReportGroupList = this.ReportGroupList.slice();
        this.changeDetector.detectChanges();
        this.GetReportGroupList();
        this.ShowAddPage = false;
        this.ItemId = null;
        this.SelectedItem = null;
        this.Index = null;
    }

    public GetReportGroupList() {
        this._settingsBLService.GetReportGroup()
            .subscribe((res: DanpheHTTPResponse) => {
                if (res.Status === ENUM_DanpheHTTPResponses.OK) {
                    this.ReportGroupList = res.Results;
                    this.ShowGrid = true;
                }
                else {
                    this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, [res.ErrorMessage]);
                }

            });
    }

    ActivateDeactivatePersonalPhrases(selectedItem: ReportGroupModel) {

        const message = selectedItem.IsActive ? "Are you sure you want to deactivate this Report Group?" : "Are you sure you want to activate Report Group?";
        if (window.confirm(message)) {
            this._settingsBLService
                .ReportGroupActivation(selectedItem)
                .subscribe((res: DanpheHTTPResponse) => {
                    if (res.Status === ENUM_DanpheHTTPResponses.OK) {
                        this.GetReportGroupList();
                        this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Success, ['Report Group Status updated successfully']);
                    } else {
                        this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ["failed to Change status",]);
                    }
                });
        }
    }


    HideManage(event): void {
        this.ShowManageItem = false;
        this.ShowGrid = true;
        this.SelectedItem = null;
        this.changeDetector.detectChanges();
    }
}