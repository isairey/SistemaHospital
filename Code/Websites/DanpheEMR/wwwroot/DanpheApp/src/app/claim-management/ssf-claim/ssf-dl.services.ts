import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { from } from "rxjs";
import { mergeMap } from "rxjs/operators";
import { DanpheHTTPResponse } from "../../shared/common-models";
import { CheckBookingStatus_DTO } from "./DTOs/ssf-claim-booking-status-request.dto";

@Injectable()
export class SsfDlService {

  constructor(private _httpClient: HttpClient) {
  }
  public jsonOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  };
  public GetPharmacyInvoices(PharmacyInvoiceIds: number[]) {
    return from(PharmacyInvoiceIds).pipe(
      mergeMap(id => this._httpClient.get(`/api/Pharmacy/GetInvoiceReceiptByInvoiceId/${id}`))
    );
  }

  public CheckClaimBookingStatus(checkClaimBookingStatus: CheckBookingStatus_DTO) {
    return this._httpClient.post<DanpheHTTPResponse>("/api/SSF/CheckBookingStatus", checkClaimBookingStatus, this.jsonOptions);
  }
}
