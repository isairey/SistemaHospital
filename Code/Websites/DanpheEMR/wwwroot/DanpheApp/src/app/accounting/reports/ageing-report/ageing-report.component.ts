import { Component } from "@angular/core";
import { SecurityService } from "../../../security/shared/security.service";

@Component({
    selector: 'ageing-report',
    templateUrl: './ageing-report.component.html',
})
export class AgeingReportComponent {
    validRoutes: any;

    constructor(private _securityService: SecurityService) {
        this.validRoutes = this._securityService.GetChildRoutes("Accounting/Reports/AgeingReport");
    }

}