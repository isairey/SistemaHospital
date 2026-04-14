import { Component } from "@angular/core";
import { SecurityService } from "../../security/shared/security.service";



@Component({
    selector: "cln-opd-main",
    templateUrl: "./clinical-opd-main.component.html",
})
export class ClinicalOpdMainComponent {
    validRoutes: any;
    constructor(public securityService: SecurityService) {

        this.validRoutes = this.securityService.GetChildRoutes("Clinical/OPD");
    }
}