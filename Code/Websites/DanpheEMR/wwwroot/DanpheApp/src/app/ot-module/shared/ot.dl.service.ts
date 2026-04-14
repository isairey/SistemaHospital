import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PostOTMachine_DTO } from '../../ot/shared/dto/post-ot-machine.dto';
import { DanpheHTTPResponse } from '../../shared/common-models';
@Injectable()
export class OperationTheatreDLService {
  public http: HttpClient;
  public options = { headers: new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' }) };
  public optionJson = { headers: new HttpHeaders({ 'Content-Type': 'application/json' }) };

  constructor(
    public _http: HttpClient
  ) {
    this.http = _http;
  }

  public GetEmployeeList() {
    return this.http.get<any>("/api/EmployeeSettings/Employees");
  }

  public GetIcdList() {
    return this.http.get<any>("/api/Admission?reqType=get-icd10-list");
  }

  public GetAllOTBookingDetails() {
    return this.http.get<any>("/api/OperationTheatre/BookingInfo")
  }

  public PostNewBookingDetails(d) {
    let data = JSON.stringify(d);
    return this.http.post<any>("/api/OperationTheatre/BookOperationTheatre", data, this.options);
  }

  public PutBookingDetails(data) {
    let strData = JSON.stringify(data);
    return this.http.put<any>("/api/OperationTheatre/BookingInfo", strData, this.options);
  }

  //Sanjeev
  GetOTMachines() {
    return this.http.get<DanpheHTTPResponse>("/api/OperationTheatre/OTMachines");
  }

  AddOTMachine(OTMachine: PostOTMachine_DTO): Observable<DanpheHTTPResponse> {
    return this.http.post<DanpheHTTPResponse>("/api/OperationTheatre/OTMachine", OTMachine, this.optionJson);
  }

  UpdateOTMachine(OTMachine: PostOTMachine_DTO): Observable<DanpheHTTPResponse> {
    return this.http.put<DanpheHTTPResponse>("/api/OperationTheatre/OTMachine", OTMachine, this.optionJson);
  }
}