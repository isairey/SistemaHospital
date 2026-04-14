import { Component } from "@angular/core";
import { SecurityService } from "../../security/shared/security.service";

@Component({
    templateUrl: "./clinical-heading-setup-component.html"
})
export class ClinicalHeadingSetupComponent {
    validRoutes: any;
    constructor(public securityService: SecurityService) {
        //get the chld routes of AppointmentMain from valid routes available for this user. 
        this.validRoutes = this.securityService.GetChildRoutes("ClinicalSettings/ClinicalHeadingSetup");
    }

}