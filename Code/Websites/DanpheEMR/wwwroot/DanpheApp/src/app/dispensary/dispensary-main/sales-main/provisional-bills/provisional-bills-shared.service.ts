import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { PHRMInvoiceItemsModel } from '../../../../pharmacy/shared/phrm-invoice-items.model';

@Injectable({
  providedIn: 'root'
})
export class ProvisionalBillSharedService {
  // Create a subject to emit button click events
  private buttonClickSubject = new Subject<void>();

  // Observable for components to subscribe
  buttonClick$ = this.buttonClickSubject.asObservable();
  ProvisionalItemsForFinalize: PHRMInvoiceItemsModel[] = [];

  // Method to emit the button click event
  emitButtonClick() {
    this.buttonClickSubject.next();
  }

  SetProvisionalItemForFinalize(items: PHRMInvoiceItemsModel[]) {
    this.ProvisionalItemsForFinalize = items;
  }
}