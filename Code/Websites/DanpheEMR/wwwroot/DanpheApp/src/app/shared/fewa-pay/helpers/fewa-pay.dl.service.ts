import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { DanpheHTTPResponse } from "../../common-models";
import { FewaPayTransactionLogDTO } from "../dtos/fewa-pay-transaction-log.dto";

@Injectable({
  providedIn: 'root'
})
/** FewaPayDLService is responsible to keep the endpoint calls only for FewaPay releated APIs */
export class FewaPayDLService {
  private headerOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  };

  /**EndPoint that is responsible to save the FewaPay transaction logs */
  private SaveLogsEndPoint = `/api/FewaPay/SaveLogs`;

  constructor(private _httpClient: HttpClient) { }

  /**
   *
   * @param transactionLog It is the FewaPayTransactionLogDTO object that is to be sent to the server to save transaction log
   * @returns Observable of DanpheHTTPResponse
   */
  SaveFewaPayTransactionLogs(transactionLog: FewaPayTransactionLogDTO): Observable<DanpheHTTPResponse> {
    return this._httpClient.post<DanpheHTTPResponse>(this.SaveLogsEndPoint, transactionLog, this.headerOptions).map(res => res);
  }
}
