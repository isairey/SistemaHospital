import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs-compat';
import { CoreService } from '../../core/shared/core.service';
import { INSClaimSubmissionMultipleDocument_DTO, INSClaimSubmissionSingleDocument_DTO } from '../../insurance/nep-gov/shared/ins-claim-submission-document.dto';
import { SecurityService } from '../../security/shared/security.service';
import { DanpheHTTPResponse } from '../../shared/common-models';
import { HibLiveClaimDTO } from '../../shared/hib-live-claim/dtos/hib-live-claim.dto';
import { ClaimBillReviewDTO } from './DTOs/ClaimManagement_BillReview_DTO';
import { InsuranceClaimPayment } from './DTOs/ClaimManagement_ClaimPayment_DTO';
import { InsurancePendingClaim } from './DTOs/ClaimManagement_PendingClaims_DTO';
import { SubmittedClaimDTO } from './DTOs/ClaimManagement_SubmittedClaim_DTO';
import { BillingCreditBillItem_DTO } from './DTOs/billing-credit-bill-item.dto';
import { PharmacyCreditBillItem_DTO } from './DTOs/pharmacy-credit-bill-item.dto';
import { AddAttachmentDTO } from './DTOs/processed-claim.dto';

@Injectable()
export class ClaimManagementDLService {
  options = {
    headers: new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' })
  };
  optionJson = { headers: new HttpHeaders({ 'Content-Type': 'application/json' }) };
  constructor(
    public http: HttpClient,
    public coreService: CoreService,
    public securityService: SecurityService
  ) { }


  //#region Get APIs
  GetInsuranceApplicableCreditOrganizations(): Observable<DanpheHTTPResponse> {
    return this.http.get<DanpheHTTPResponse>("/api/ClaimManagement/InsuranceApplicableCreditOrganizations", this.options);
  }

  GetClaimReviewList(FromDate: string, ToDate: string, CreditOrganizationId: number, patientId: number): Observable<DanpheHTTPResponse> {
    return this.http.get<DanpheHTTPResponse>(`/api/ClaimManagement/BillReview?FromDate=${FromDate}&ToDate=${ToDate}&CreditOrganizationId=${CreditOrganizationId}&PatientId=${patientId}`, this.options);
  }

  CheckClaimCode(claimCode: number, patientVisitId: number, creditOrganizationId: number, ApiIntegrationName: string, PatientId: number): Observable<DanpheHTTPResponse> {
    return this.http.get<DanpheHTTPResponse>(`/api/ClaimManagement/IsClaimCodeAvailable?ClaimCode=${claimCode}&PatientVisitId=${patientVisitId}&CreditOrganizationId=${creditOrganizationId}&ApiIntegrationName=${ApiIntegrationName}&PatientId=${PatientId}`, this.options);
  }

  GetClaimSubmissionPendingList(CreditOrganizationId: number): Observable<DanpheHTTPResponse> {
    return this.http.get<DanpheHTTPResponse>(`/api/ClaimManagement/PendingClaims?CreditOrganizationId=${CreditOrganizationId}`, this.options);
  }

  GetInvoicesByClaimSubmissionId(ClaimSubmissionId: number): Observable<DanpheHTTPResponse> {
    return this.http.get<DanpheHTTPResponse>(`/api/ClaimManagement/Claim/Invoices?ClaimSubmissionId=${ClaimSubmissionId}`, this.options);
  }

  GetDocumentForPreviewByFileId(FileId: number): Observable<DanpheHTTPResponse> {
    return this.http.get<DanpheHTTPResponse>(`/api/ClaimManagement/Claim/PreviewDocument?FileId=${FileId}`, this.options);
  }

  GetDocumentsByClaimCode(ClaimCode: number): Observable<DanpheHTTPResponse> {
    return this.http.get<DanpheHTTPResponse>(`/api/ClaimManagement/Claim/Documents?ClaimCode=${ClaimCode}`, this.options);
  }

  GetPaymentPendingClaims(CreditOrganizationId: number): Observable<DanpheHTTPResponse> {
    return this.http.get<DanpheHTTPResponse>(`/api/ClaimManagement/PaymentPendingClaims?CreditOrganizationId=${CreditOrganizationId}`, this.options);
  }

  GetInsurancePayments(claimSubmissionId: number): Observable<DanpheHTTPResponse> {
    return this.http.get<DanpheHTTPResponse>(`/api/ClaimManagement/InsurancePayments?ClaimSubmissionId=${claimSubmissionId}`, this.options);
  }

  ClaimDetailsForPreview(claimSubmissionId: number): Observable<DanpheHTTPResponse> {
    return this.http.get<any>(`/api/ClaimManagement/ClaimDetails?ClaimSubmissionId=${claimSubmissionId}`, this.options);
  }

  GetBillingCreditNotesByBillingTransactionId(BillingTransactionId: number): Observable<DanpheHTTPResponse> {
    return this.http.get<DanpheHTTPResponse>(`/api/ClaimManagement/BillingCreditNotes?BillingTransactionId=${BillingTransactionId}`, this.options);
  }

  GetPharmacyCreditNotesByInvoiceId(InvoiceId: number): Observable<DanpheHTTPResponse> {
    return this.http.get<DanpheHTTPResponse>(`/api/ClaimManagement/PharmacyCreditNotes?InvoiceId=${InvoiceId}`, this.options);
  }

  GetBillingCreditBillItems(BillingTransactionId: number) {
    return this.http.get<any>(`/api/ClaimManagement/BillingCreditBillItems?BillingTransactionId=${BillingTransactionId}`, this.options);
  }

  GetPharmacyCreditBillItems(PharmacyInvoiceId: number) {
    return this.http.get<any>(`/api/ClaimManagement/PharmacyCreditBillItems?PharmacyInvoiceId=${PharmacyInvoiceId}`, this.options);
  }

  GetApiIntegrationNameByOrganizationId(OrganizationId: number) {
    return this.http.get<any>(`/api/ClaimManagement/ApiIntegrationNameByOrganizationId?OrganizationId=${OrganizationId}`, this.options);
  }

  GetInitiatedClaimCodesByPatientId(patientId: number): Observable<DanpheHTTPResponse> {
    return this.http.get<DanpheHTTPResponse>(`/api/ClaimManagement/InitiatedClaimCodesByPatientId?PatientId=${patientId}`)
  }

  GetFinalBillSummaryByClaimCode(claimCode: number): Observable<DanpheHTTPResponse> {
    return this.http.get<DanpheHTTPResponse>(`/api/ClaimManagement/FinalBillSummaryByClaimCode?ClaimCode=${claimCode}`)
  }

  //Other Controller Get APIs

  GetBankList(): Observable<DanpheHTTPResponse> {
    return this.http.get<DanpheHTTPResponse>(`/api/Billing/Banks`, this.options);
  }

  // GetInvoiceDetailsForDuplicatePrint(invoiceNumber: number, fiscalYrId: number, billingTxnId: number) {
  //     return this.http.get<any>("/api/Billing/InvoiceInfo?invoiceNo=" + invoiceNumber + "&fiscalYearId=" + fiscalYrId + "&billingTransactionId=" + billingTxnId, this.options);
  // }

  GetInvoiceReceiptByInvoiceId(invoiceId: number) {
    return this.http.get<any>(`/api/PharmacySales/InvoiceReceiptByInvoiceId?InvoiceId=${invoiceId}`, this.options);
  }

  GetPharmacySaleReturnInvoiceItemsByInvoiceId(invoiceId: number): Observable<DanpheHTTPResponse> {
    return this.http.get<any>("/api/PharmacySalesReturn/CreditNotesInfo?invoiceId=" + invoiceId, this.options);
  }

  GetPatientsWithVisitsInfo(searchTxt) {
    return this.http.get<any>(`/api/Patient/PatientWithVisitInfo?search=${searchTxt}&showIpPatinet=${true}`, this.options);
  }
  //#endregion


  //#region Post APIs
  SendBillForClaimScrubbing(bills: Array<ClaimBillReviewDTO>): Observable<DanpheHTTPResponse> {
    return this.http.post<DanpheHTTPResponse>(`/api/ClaimManagement/InsuranceClaim`, bills, this.optionJson);
  }

  SubmitClaim(claimDTO: SubmittedClaimDTO): Observable<DanpheHTTPResponse> {
    return this.http.post<DanpheHTTPResponse>(`/api/ClaimManagement/SubmitClaim`, claimDTO, this.optionJson);
  }

  AddInsuranceClaimPayment(claimPaymentObject: InsuranceClaimPayment): Observable<DanpheHTTPResponse> {
    return this.http.post<DanpheHTTPResponse>(`/api/ClaimManagement/InsuranceClaimPayment`, claimPaymentObject, this.optionJson);
  }
  //#endregion


  //#region Put APIs
  UpdateClaimableStatus(bills: Array<ClaimBillReviewDTO>, claimableStatus: boolean): Observable<DanpheHTTPResponse> {
    return this.http.put<DanpheHTTPResponse>(`/api/ClaimManagement/ClaimableStatus?claimableStatus=${claimableStatus}`, bills, this.optionJson);
  }

  UpdateClaimableStatusOfClaimedInvoice(bill: ClaimBillReviewDTO, claimableStatus: boolean): Observable<DanpheHTTPResponse> {
    return this.http.put<DanpheHTTPResponse>(`/api/ClaimManagement/Claim/Invoice/ClaimableStatus?claimableStatus=${claimableStatus}`, bill, this.optionJson);
  }

  RevertInvoiceBackToBillReview(bill: ClaimBillReviewDTO): Observable<DanpheHTTPResponse> {
    return this.http.put<DanpheHTTPResponse>(`/api/ClaimManagement/RevertToBillReview`, bill, this.optionJson);
  }

  SaveClaimAsDraft(claimDTO: SubmittedClaimDTO): Observable<DanpheHTTPResponse> {
    return this.http.put<DanpheHTTPResponse>(`/api/ClaimManagement/SaveClaimAsDraft`, claimDTO, this.optionJson);
  }

  UpdateClaimableCode(bills: Array<ClaimBillReviewDTO>, claimCode: number): Observable<DanpheHTTPResponse> {
    return this.http.put<DanpheHTTPResponse>(`/api/ClaimManagement/ClaimCode?claimCode=${claimCode}`, bills, this.optionJson);
  }

  UpdateApprovedAndRejectedAmount(claimDTO: InsurancePendingClaim): Observable<DanpheHTTPResponse> {
    return this.http.put<DanpheHTTPResponse>(`/api/ClaimManagement/ClaimApprovedAndRejectedAmount`, claimDTO, this.optionJson);
  }

  ConcludeClaim(claimSubmissionId: number): Observable<DanpheHTTPResponse> {
    return this.http.put<DanpheHTTPResponse>(`/api/ClaimManagement/ConcludeClaim?ClaimSubmissionId=${claimSubmissionId}`, this.options);
  }

  RevertClaimBackToClaimScrubbing(claimSubmissionId: number): Observable<DanpheHTTPResponse> {
    return this.http.put<DanpheHTTPResponse>(`/api/ClaimManagement/RevertToClaimScrubbing?ClaimSubmissionId=${claimSubmissionId}`, this.options);
  }

  UpdateBillingCreditItemClaimableStatus(BillingCreditBillItem: BillingCreditBillItem_DTO): Observable<DanpheHTTPResponse> {
    return this.http.put<DanpheHTTPResponse>(`/api/ClaimManagement/BillingCreditItemClaimableStatus`, BillingCreditBillItem, this.optionJson);
  }

  UpdatePharmacyCreditItemClaimableStatus(PharmacyCreditBillItem: PharmacyCreditBillItem_DTO): Observable<DanpheHTTPResponse> {
    return this.http.put<DanpheHTTPResponse>(`/api/ClaimManagement/PharmacyCreditItemClaimableStatus`, PharmacyCreditBillItem, this.optionJson);
  }

  UpdateInsuranceClaimPayment(claimPaymentObject: InsuranceClaimPayment): Observable<DanpheHTTPResponse> {
    return this.http.put<DanpheHTTPResponse>(`/api/ClaimManagement/InsuranceClaimPayment`, claimPaymentObject, this.optionJson);
  }
  //#endregion

  GetECHSPatientWithVisitInformation(searchText: string) {
    return this.http.get<any>(`/api/ClaimManagement/ECHSPatientWithVisitInformation?search=${searchText}`, this.optionJson);
  }
  ClaimableInvoicesDetailInfo(phrmInvoiceIds: string, billingInvoiceIds: string) {
    return this.http.get<any>(`/api/HIB/ClaimableInvoicesDetailInfo?phrmInvoiceIds=${phrmInvoiceIds}&billingInvoiceIds=${billingInvoiceIds}`, this.options);
  }
  UploadSingleClaimFile(claimUploadSingleFileUploadRequest: INSClaimSubmissionSingleDocument_DTO) {
    return this.http.post(`/api/InsuranceClaimDocument/UploadSingleFile`, claimUploadSingleFileUploadRequest, this.optionJson);
  }
  UploadMultipleClaimFile(claimUploadMultipleFileUploadRequest: INSClaimSubmissionMultipleDocument_DTO) {
    return this.http.post(`/api/InsuranceClaimDocument/UploadMultipleFile`, claimUploadMultipleFileUploadRequest, this.optionJson);
  }
  PrepareClaimPayment(claim: InsurancePendingClaim): Observable<DanpheHTTPResponse> {
    return this.http.put<DanpheHTTPResponse>(`/api/ClaimManagement/SetClaimReadyForPayment`, claim, this.optionJson);
  }
  GetDiagnosis() {
    return this.http.get(`/api/ClaimManagement/Diagnosis`, this.options);
  }
  DoctorListWithNMCNo() {
    return this.http.get(`/api/HIB/DoctorListWithNMCNo`, this.options);
  }
  GetClaimCodeWiseReports(ClaimCode: number) {
    return this.http.get<DanpheHTTPResponse>(`/api/ClaimManagement/Claim/Reports?ClaimCode=${ClaimCode}`, this.options);
  }
  SubmitHibLiveClaim(hibLiveClaim: HibLiveClaimDTO) {
    return this.http.post<DanpheHTTPResponse>(`/api/HibLiveClaim/SubmitHibLiveClaim`, hibLiveClaim, this.optionJson);
  }
  UpdateDocumentUpdateStatus(bills: Array<ClaimBillReviewDTO>): Observable<DanpheHTTPResponse> {
    return this.http.put<DanpheHTTPResponse>(`/api/ClaimManagement/UpdateDocumentReceivedStatus`, bills, this.optionJson);
  }
  GetSubmittedClaims(fromDate: string, toDate: string) {
    return this.http.get<any>("/api/SSF/SubmittedClaims?FromDate=" + fromDate + "&ToDate=" + toDate, this.optionJson);
  }
  UploadDocument(addAttachment: AddAttachmentDTO) {
    return this.http.post<any>("/api/SSF/Attachments", addAttachment, this.optionJson);
  }
  GetClaimDocumentReceivedReport(FromDate: string, ToDate: string, PatientId: number, ClaimCode: number, InvoiceNo: string) {
    return this.http.get<any>("/api/ClaimManagement/Claim/ClaimDocumentReceivedReport?FromDate=" + FromDate + "&ToDate=" + ToDate + "&PatientId=" + PatientId + "&ClaimCode=" + ClaimCode + "&InvoiceNo=" + InvoiceNo, this.optionJson);
  }
}
