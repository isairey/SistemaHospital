import { Component } from '@angular/core';
import { SecurityService } from '../../security/shared/security.service';

@Component({
  selector: 'app-clinical-notes',
  templateUrl: './clinical-notes.component.html',
})
export class ClinicalNotesComponent {

  validRoutes: any;
  constructor(public securityService: SecurityService) {
    this.validRoutes = this.securityService.GetChildRoutes("ClinicalSettings/ClinicalNotes");
  }

}
