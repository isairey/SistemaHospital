import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { CoreDLService } from "../../core/shared/core.dl.service";
import { DanpheHTTPResponse } from "../../shared/common-models";
import { PatientVisitLevelReferralCommission_DTO } from "./DTOs/patient-referral-commission.dto";
import { ReferralCommission_DTO } from "./DTOs/referral-commission.dto";
import { ReferringOrganization_DTO } from "./DTOs/referral-organization.dto";
import { ReferralParty_DTO } from "./DTOs/referral-party.dto";
import { ReferralScheme_DTO } from "./DTOs/referral-scheme.dto";
import { MarketingReferralDLService } from "./marketingreferral.dl.service";


@Injectable()
export class MarketingReferralBLService {
    constructor(public coreDLService: CoreDLService, public mktreferralDLService: MarketingReferralDLService) {

    }
    public GetInvoiceList(fromDate, toDate): Observable<DanpheHTTPResponse> {
        return this.mktreferralDLService.GetInvoiceList(fromDate, toDate)
            .map(res => {
                return res;
            });
    }
    public GetMarketingReferralDetailReport(fromDate, toDate, referringPartyId, referringGroupId, areaCode, referringOrganizationId): Observable<DanpheHTTPResponse> {
        return this.mktreferralDLService.GetMarketingReferralDetailReport(fromDate, toDate, referringPartyId, referringGroupId, areaCode, referringOrganizationId)
            .map(res => {
                return res;
            });
    }
    public GetBillDetails(billTransactionId): Observable<DanpheHTTPResponse> {
        return this.mktreferralDLService.GetBillDetails(billTransactionId)
            .map(res => {
                return res;
            });
    }
    public GetReferralScheme(): Observable<DanpheHTTPResponse> {
        return this.mktreferralDLService.GetReferralScheme()
            .map(res => {
                return res;
            });
    }

    public GetReferringParty(): Observable<DanpheHTTPResponse> {
        return this.mktreferralDLService.GetReferringParty()
            .map(res => {
                return res;
            });
    }
    public GetReferringPartyGroup(): Observable<DanpheHTTPResponse> {
        return this.mktreferralDLService.GetReferringPartyGroup()
            .map(res => {
                return res;
            });
    }
    public GetReferringOrganization(): Observable<DanpheHTTPResponse> {
        return this.mktreferralDLService.GetReferringOrganization()
            .map(res => {
                return res;
            });
    }
    public GetAlreadyAddedCommission(BillingTransactionId): Observable<DanpheHTTPResponse> {
        return this.mktreferralDLService.GetAlreadyAddedCommission(BillingTransactionId)
            .map(res => {
                return res;
            });
    }
    public DeleteReferralCommission(ReferralCommissionId): Observable<DanpheHTTPResponse> {
        return this.mktreferralDLService.DeleteReferralCommission(ReferralCommissionId)
            .map(res => {
                return res;
            });
    }
    public SaveNewReferral(referralComission_DTO: ReferralCommission_DTO): Observable<DanpheHTTPResponse> {
        return this.mktreferralDLService.SaveNewReferral(referralComission_DTO)
            .map(res => {
                return res;
            });
    }
    public SaveReferringOrganization(referringOrganization_DTO: ReferringOrganization_DTO): Observable<DanpheHTTPResponse> {
        return this.mktreferralDLService.SaveReferringOrganization(referringOrganization_DTO)
            .map(res => {
                return res;
            });
    }
    public SaveReferringParty(referralParty_DTO: ReferralParty_DTO): Observable<DanpheHTTPResponse> {
        return this.mktreferralDLService.SaveReferringParty(referralParty_DTO)
            .map(res => {
                return res;
            });
    }
    public UpdateReferringOrganization(referringOrganization_DTO: ReferringOrganization_DTO): Observable<DanpheHTTPResponse> {
        return this.mktreferralDLService.UpdateReferringOrganization(referringOrganization_DTO)
            .map(res => {
                return res;
            });
    }
    public UpdateReferringParty(referringparty_DTO: ReferralParty_DTO): Observable<DanpheHTTPResponse> {
        return this.mktreferralDLService.UpdateReferringParty(referringparty_DTO)
            .map(res => {
                return res;
            });
    }
    public ActivateDeactivateOrganization(selectedItem): Observable<DanpheHTTPResponse> {
        return this.mktreferralDLService.ActivateDeactivateOrganization(selectedItem)
            .map(res => {
                return res;
            });
    }
    public ActivateDeactivateParty(selectedItem): Observable<DanpheHTTPResponse> {
        return this.mktreferralDLService.ActivateDeactivateParty(selectedItem)
            .map(res => {
                return res;
            });
    }

    public GetMasterDataForFilter(): Observable<DanpheHTTPResponse> {
        return this.mktreferralDLService.GetMasterDataForFilter()
            .map(res => {
                return res;
            });
    }

    public GetPatientVisitWiseReferralCommission(fromDate: string, toDate: string): Observable<DanpheHTTPResponse> {
        return this.mktreferralDLService.GetPatientVisitWiseReferralCommission(fromDate, toDate)
            .map(res => { return res; });
    }

    public SaveReferralScheme(referralScheme: ReferralScheme_DTO): Observable<DanpheHTTPResponse> {
        return this.mktreferralDLService.SaveReferralScheme(referralScheme)
            .map(res => { return res; });
    }
    public UpdateReferralScheme(referralScheme: ReferralScheme_DTO): Observable<DanpheHTTPResponse> {
        return this.mktreferralDLService.UpdateReferralScheme(referralScheme)
            .map(res => { return res; });
    }
    public ActivateDeactivateReferralScheme(referralScheme: ReferralScheme_DTO): Observable<DanpheHTTPResponse> {
        return this.mktreferralDLService.ActivateDeactivateReferralScheme(referralScheme)
            .map(res => { return res; });
    }
    public AddPatientReferralCommission(patientVisitLevelReferralCommission: PatientVisitLevelReferralCommission_DTO): Observable<DanpheHTTPResponse> {
        return this.mktreferralDLService.AddPatientReferralCommission(patientVisitLevelReferralCommission)
            .map(res => { return res; });
    }
    public GetReferralCommissionDetails(patientVisitId: number): Observable<DanpheHTTPResponse> {
        return this.mktreferralDLService.GetReferralCommissionDetails(patientVisitId)
            .map(res => { return res; });
    }
    public DeletePatientReferralCommission(referralCommissionId: number): Observable<DanpheHTTPResponse> {
        return this.mktreferralDLService.DeletePatientReferralCommission(referralCommissionId)
            .map(res => { return res; });
    }
}
