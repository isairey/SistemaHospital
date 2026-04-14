import { Component, OnInit } from '@angular/core';
import { SecurityService } from '../../security/shared/security.service';

@Component({
  selector: 'reports',
  templateUrl: './reports.component.html'
})
export class ReportsComponent implements OnInit {
  validRoutes: any;
  constructor(public securityService: SecurityService) {
    this.validRoutes = this.securityService.GetChildRoutes("ClaimManagement/Reports");
  }

  ngOnInit() {
  }

}
