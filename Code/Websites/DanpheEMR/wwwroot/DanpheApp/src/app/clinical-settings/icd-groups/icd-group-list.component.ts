import { ChangeDetectorRef, Component } from "@angular/core";
import { SettingsService } from '../../settings-new/shared/settings-service';
import { DanpheHTTPResponse } from "../../shared/common-models";
import { ENUM_DanpheHTTPResponses } from "../../shared/shared-enums";
import { ClinicalSettingsBLService } from "../shared/clinical-settings.bl.service";
import { ICDGroupListDTO } from "../shared/dto/icd-group-list.dto";

@Component({
    selector: "icd-group-list",
    templateUrl: "./icd-group-list.html"
})

export class ICDGroupListComponent {
    public showAllList: boolean = false;
    public icdGroupColumns: unknown;
    public icdGroupList = Array<ICDGroupListDTO>();
    // public selectedID: null;

    constructor(public settingsServ: SettingsService, public cliSetBLService: ClinicalSettingsBLService, public changeDetector: ChangeDetectorRef) {
        this.icdGroupColumns = this.settingsServ.settingsGridCols.ICDGroupList;
        this.GetICDGroupList();
    }



    GetICDGroupList() {
        this.cliSetBLService.GetICDGroups()
            .subscribe((res: DanpheHTTPResponse) => {
                if (res.Status === ENUM_DanpheHTTPResponses.OK && res.Results && res.Results.length) {
                    this.icdGroupList = res.Results;
                }
            });
        this.showAllList = true;
    }
}
