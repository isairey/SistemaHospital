
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DanpheHTTPResponse } from '../common-models';
@Injectable(
    {
        providedIn: 'root'
    }
)
export class StickerDLService {
    public http: HttpClient;
    public options = {
        headers: new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' })
    };
    public jsonOptions = {
        headers: new HttpHeaders({ 'Content-Type': 'application/json' })
    }
    constructor(_http: HttpClient) {
        this.http = _http;
    }
    public GetRegistrationStickerSettingsAndData(PatientVisitId: number) {
        return this.http.get<DanpheHTTPResponse>(`/api/Stickers/RegistrationStickerSettingsAndData?PatientVisitId=${PatientVisitId}`, this.options);
    }

    public GetTemplateByTemplateCode(templateCode: string, patientVisitId: number): Observable<DanpheHTTPResponse> {
        return this.http.get<DanpheHTTPResponse>(`/api/NewClinical/Template?templateCode=${templateCode}&patientVisitId=${patientVisitId}`, this.options);
    }
}