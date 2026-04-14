import { Component } from '@angular/core';
import { SecurityService } from '../../security/shared/security.service';

@Component({
  selector: 'app-clinical-variables',
  templateUrl: './clinical-variables.component.html',
  styleUrls: ['./clinical-variables.component.css']
})
export class ClinicalVariablesComponent {
  validRoutes: any;
  constructor(public securityService: SecurityService) {
    this.validRoutes = this.securityService.GetChildRoutes("ClinicalSettings/ClinicalVariables");
  }
}
