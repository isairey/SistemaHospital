import { Component } from "@angular/core";
import { SecurityService } from "../../security/shared/security.service";

@Component({
    templateUrl: "./clinical-quick-phrases.component.html"
})
export class ClinicalQuickPhrasesComponents {
    validRoutes: any;
    constructor(public securityService: SecurityService) {
        //get the chld routes of AppointmentMain from valid routes available for this user.
        this.validRoutes = this.securityService.GetChildRoutes("ClinicalSettings/QuickPhrases");
    }

}
