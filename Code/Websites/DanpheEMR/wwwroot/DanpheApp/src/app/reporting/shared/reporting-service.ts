import { Injectable } from '@angular/core';
import { CoreService } from "../../core/shared/core.service";
import { BillingScheme_DTO } from '../../settings-new/billing/shared/dto/billing-scheme.dto';
import { SettingsBLService } from '../../settings-new/shared/settings.bl.service';
import { DanpheHTTPResponse } from '../../shared/common-models';
import { ReportGridColumnSettings } from '../../shared/danphe-grid/report-grid-column-settings.constant';
import { ENUM_DanpheHTTPResponses } from '../../shared/shared-enums';
import { RPT_SchemeDTO } from './dto/scheme.dto';
@Injectable()
export class ReportingService {
    public reportGridCols: ReportGridColumnSettings;
    public SchemeList = new Array<RPT_SchemeDTO>();

    constructor(public coreService: CoreService,
        private _settingBLService: SettingsBLService) {
        this.reportGridCols = new ReportGridColumnSettings(this.coreService.taxLabel, coreService)
    }

    public GetSchemesForReport(): void {
        this._settingBLService.GetSchemesForReport().subscribe((res: DanpheHTTPResponse) => {
            if (res.Status === ENUM_DanpheHTTPResponses.OK) {
                this.setSchemeList(res.Results);
            }
        });
    }
    public setSchemeList(schemes: Array<BillingScheme_DTO>): void {
        this.SchemeList = schemes;
    }


}
