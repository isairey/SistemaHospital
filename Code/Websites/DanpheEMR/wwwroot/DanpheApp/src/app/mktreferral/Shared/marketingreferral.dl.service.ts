import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { DanpheHTTPResponse } from "../../shared/common-models";
import { PatientVisitLevelReferralCommission_DTO } from "./DTOs/patient-referral-commission.dto";
import { ReferralCommission_DTO } from "./DTOs/referral-commission.dto";
import { ReferringOrganization_DTO } from "./DTOs/referral-organization.dto";
import { ReferralParty_DTO } from "./DTOs/referral-party.dto";
import { ReferralScheme_DTO } from "./DTOs/referral-scheme.dto";


@Injectable()
export class MarketingReferralDLService {
    public optionsJson = {
        headers: new HttpHeaders({ 'Content-Type': 'application/json' })
    };
    constructor(public http: HttpClient) {

    }

    public GetInvoiceList(fromDate, toDate): Observable<DanpheHTTPResponse> {
        return this.http.get<DanpheHTTPResponse>(`/api/MarketingReferral/Invoices?FromDate=${fromDate}&ToDate=${toDate}`, this.optionsJson);
    }
    public GetMarketingReferralDetailReport(fromDate, toDate, referringPartyId, referringGroupId, areaCode, referringOrganizationId): Observable<DanpheHTTPResponse> {
        return this.http.get<DanpheHTTPResponse>(`/api/MarketingReferral/MarketingReferralReport?FromDate=${fromDate}&ToDate=${toDate}&referringPartyId=${referringPartyId}&referringPartyGroupId=${referringGroupId}&areaCode=${areaCode}&referringOrganizationId=${referringOrganizationId}`, this.optionsJson);
    }
    public GetBillDetails(billTransactionId): Observable<DanpheHTTPResponse> {
        return this.http.get<DanpheHTTPResponse>(`/api/MarketingReferral/BillDetails?billTransactionId=${billTransactionId}`, this.optionsJson);
    }
    public GetReferralScheme(): Observable<DanpheHTTPResponse> {
        return this.http.get<DanpheHTTPResponse>("/api/MarketingReferral/ReferralScheme", this.optionsJson);
    }
    public GetReferringParty(): Observable<DanpheHTTPResponse> {
        return this.http.get<DanpheHTTPResponse>("/api/MarketingReferral/ReferringParty", this.optionsJson);
    }
    public GetReferringPartyGroup(): Observable<DanpheHTTPResponse> {
        return this.http.get<DanpheHTTPResponse>("/api/MarketingReferral/ReferringPartyGroup", this.optionsJson);
    }
    public GetReferringOrganization(): Observable<DanpheHTTPResponse> {
        return this.http.get<DanpheHTTPResponse>("/api/MarketingReferral/ReferringOrganization", this.optionsJson);
    }
    public GetAlreadyAddedCommission(BillingTransactionId): Observable<DanpheHTTPResponse> {
        return this.http.get<DanpheHTTPResponse>(`/api/MarketingReferral/AlreadyAddedCommission?BillingTransactionId=${BillingTransactionId}`, this.optionsJson);
    }
    public DeleteReferralCommission(ReferralCommissionId): Observable<DanpheHTTPResponse> {
        return this.http.delete<DanpheHTTPResponse>(`/api/MarketingReferral/ReferralCommission?ReferralCommissionId=${ReferralCommissionId}`, this.optionsJson);
    }
    public SaveNewReferral(referralComission_DTO: ReferralCommission_DTO): Observable<DanpheHTTPResponse> {
        return this.http.post<DanpheHTTPResponse>("/api/MarketingReferral/NewReferralComission", referralComission_DTO, this.optionsJson);
    }
    public SaveReferringOrganization(referringOrganization_DTO: ReferringOrganization_DTO): Observable<DanpheHTTPResponse> {
        return this.http.post<DanpheHTTPResponse>("/api/MarketingReferral/NewReferringOrganization", referringOrganization_DTO, this.optionsJson);
    }
    public SaveReferringParty(referralParty_DTO: ReferralParty_DTO): Observable<DanpheHTTPResponse> {
        return this.http.post<DanpheHTTPResponse>("/api/MarketingReferral/NewReferringParty", referralParty_DTO, this.optionsJson);
    }
    public UpdateReferringOrganization(referringOrganization_DTO: ReferringOrganization_DTO): Observable<DanpheHTTPResponse> {
        return this.http.put<DanpheHTTPResponse>("/api/MarketingReferral/ReferringOrganization", referringOrganization_DTO, this.optionsJson);
    }
    public UpdateReferringParty(referringParty_DTO: ReferralParty_DTO): Observable<DanpheHTTPResponse> {
        return this.http.put<DanpheHTTPResponse>("/api/MarketingReferral/ReferringParty", referringParty_DTO, this.optionsJson);
    }
    public ActivateDeactivateOrganization(selectedItem): Observable<DanpheHTTPResponse> {
        return this.http.put<DanpheHTTPResponse>("/api/MarketingReferral/ActivateDeactivateOrganization", selectedItem, this.optionsJson);
    }
    public ActivateDeactivateParty(selectedItem): Observable<DanpheHTTPResponse> {
        return this.http.put<DanpheHTTPResponse>("/api/MarketingReferral/ActivateDeactivateParty", selectedItem, this.optionsJson);
    }
    public GetMasterDataForFilter(): Observable<DanpheHTTPResponse> {
        return this.http.get<DanpheHTTPResponse>("/api/MarketingReferral/GetMasterDataForFilter", this.optionsJson);
    }
    public GetPatientVisitWiseReferralCommission(fromDate: string, toDate: string): Observable<DanpheHTTPResponse> {
        return this.http.get<DanpheHTTPResponse>(`/api/MarketingReferral/GetPatientVisitWiseReferralCommission?fromDate=${fromDate}&toDate=${toDate}`, this.optionsJson);
    }
    public SaveReferralScheme(referralScheme: ReferralScheme_DTO): Observable<DanpheHTTPResponse> {
        return this.http.post<DanpheHTTPResponse>(`/api/MarketingReferral/ReferralScheme`, referralScheme, this.optionsJson);
    }
    public UpdateReferralScheme(referralScheme: ReferralScheme_DTO): Observable<DanpheHTTPResponse> {
        return this.http.put<DanpheHTTPResponse>(`/api/MarketingReferral/ReferralScheme`, referralScheme, this.optionsJson);
    }
    public ActivateDeactivateReferralScheme(referralScheme: ReferralScheme_DTO): Observable<DanpheHTTPResponse> {
        return this.http.put<DanpheHTTPResponse>(`/api/MarketingReferral/ActivateDeactivateReferralScheme?referralSchemeId=${referralScheme.ReferralSchemeId}`, this.optionsJson);
    }
    public AddPatientReferralCommission(patientReferralCommission: PatientVisitLevelReferralCommission_DTO): Observable<DanpheHTTPResponse> {
        return this.http.post<DanpheHTTPResponse>(`/api/MarketingReferral/PatientReferralCommission`, patientReferralCommission, this.optionsJson);
    }
    public GetReferralCommissionDetails(patientVisitId: number): Observable<DanpheHTTPResponse> {
        return this.http.get<DanpheHTTPResponse>(`/api/MarketingReferral/GetPatientReferralCommissionDetails?patientVisitId=${patientVisitId}`, this.optionsJson);
    }

    public DeletePatientReferralCommission(ReferralCommissionId): Observable<DanpheHTTPResponse> {
        return this.http.put<DanpheHTTPResponse>(`/api/MarketingReferral/PatientReferralCommission?patientReferralCommissionId=${ReferralCommissionId}`, this.optionsJson);
    }
}