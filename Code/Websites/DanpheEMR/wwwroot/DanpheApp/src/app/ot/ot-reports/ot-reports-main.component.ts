import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SecurityService } from '../../security/shared/security.service';

@Component({
  selector: 'ot-reports',
  templateUrl: './ot-reports-main.component.html',
  styleUrls: ['./ot-reports-main.component.css'],
})
export class OTReportsMainComponent implements OnInit {

  validRoutes: any;
  showReportItems: boolean = true;
  selectedItem: string;

  constructor(
    private _securityService: SecurityService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.validRoutes = this._securityService.GetChildRoutes("OperationTheatre/Reports");
  }

  ngOnInit(): void {
    this.selectedItem = this.route.snapshot.paramMap.get('id');
  }

}
