import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { PatientService } from '../../../../../patients/shared/patient.service';
import { DispensaryService } from '../../../../shared/dispensary.service';
import { ProvisionalBillSharedService } from '../provisional-bills-shared.service';

@Component({
  selector: 'provisional-bills-action',
  templateUrl: './provisional-bills-action.component.html',
  styleUrls: ['./provisional-bills-action.component.css']
})
export class ProvisionalBillsActionComponent implements OnInit {
  @Output('back-to-provisional-bills') BackToProvisionalBills: EventEmitter<object> = new EventEmitter<object>()
  buttonClickSubscription: Subscription;

  constructor(private _dispensaryService: DispensaryService, private sharedService: ProvisionalBillSharedService, private router: Router, public patientService: PatientService) {
    this.buttonClickSubscription = this.sharedService.buttonClick$.subscribe(() => {
      this.Back();
    });
  }

  ngOnInit() {
  }

  Back() {
    this.router.navigate(['/Dispensary/Sale/CreditBills']);
    this.BackToProvisionalBills.emit();
  }

  ngOnDestroy() {
    this.patientService.CreateNewGlobal();
    this._dispensaryService.SetPatientIdAndVisitIdForProvisionalView(0, 0, '');
    if (this.buttonClickSubscription) {
      this.buttonClickSubscription.unsubscribe();
    }
    // this.router.navigate(['/Dispensary/Sale/CreditBills']);

  }
}
