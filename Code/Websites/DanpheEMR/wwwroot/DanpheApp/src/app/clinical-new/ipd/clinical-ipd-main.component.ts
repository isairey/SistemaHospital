import { Component } from "@angular/core";
import { SecurityService } from "../../security/shared/security.service";

@Component({
    selector: "cln-ipd-main",
    templateUrl: "clinical-ipd-main.component.html"
})

export class ClinicalIpdMainComponent {
    validRoutes: any;
    constructor(public securityService: SecurityService) {

        this.validRoutes = this.securityService.GetChildRoutes("Clinical/IPD");
    }
}