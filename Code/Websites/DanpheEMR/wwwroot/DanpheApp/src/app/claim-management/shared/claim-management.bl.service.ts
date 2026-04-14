import { Injectable } from '@angular/core';
import * as _ from 'lodash';
import { INSClaimSubmissionMultipleDocument_DTO, INSClaimSubmissionSingleDocument_DTO } from '../../insurance/nep-gov/shared/ins-claim-submission-document.dto';
import { HibLiveClaimDTO } from '../../shared/hib-live-claim/dtos/hib-live-claim.dto';
import { ClaimBillReviewDTO } from './DTOs/ClaimManagement_BillReview_DTO';
import { InsuranceClaimPayment } from './DTOs/ClaimManagement_ClaimPayment_DTO';
import { InsurancePendingClaim } from './DTOs/ClaimManagement_PendingClaims_DTO';
import { SubmittedClaimDTO } from './DTOs/ClaimManagement_SubmittedClaim_DTO';
import { BillingCreditBillItem_DTO } from './DTOs/billing-credit-bill-item.dto';
import { PharmacyCreditBillItem_DTO } from './DTOs/pharmacy-credit-bill-item.dto';
import { AddAttachmentDTO } from './DTOs/processed-claim.dto';
import { ClaimManagementDLService } from './claim-management.dl.service';

@Injectable()

export class ClaimManagementBLService {

  constructor(
    private claimManagementDLService: ClaimManagementDLService
  ) { }

  //#region Get
  GetInsuranceApplicableCreditOrganizations() {
    return this.claimManagementDLService.GetInsuranceApplicableCreditOrganizations()
      .map(res => { return res })
  }

  GetBillReviewList(FromDate: string, ToDate: string, CreditOrganizationId: number, patientId: number) {
    return this.claimManagementDLService.GetClaimReviewList(FromDate, ToDate, CreditOrganizationId, patientId)
      .map(res => { return res });
  }

  CheckClaimCode(claimCode: number, patientVisitId: number, creditOrganizationId: number, ApiIntegrationName: string, patientId: number) {
    return this.claimManagementDLService.CheckClaimCode(claimCode, patientVisitId, creditOrganizationId, ApiIntegrationName, patientId)
      .map(res => { return res });
  }

  GetClaimSubmissionPendingList(CreditOrganizationId: number) {
    return this.claimManagementDLService.GetClaimSubmissionPendingList(CreditOrganizationId)
      .map(res => { return res });
  }

  GetInvoicesByClaimSubmissionId(ClaimSubmissionId: number) {
    return this.claimManagementDLService.GetInvoicesByClaimSubmissionId(ClaimSubmissionId)
      .map(res => { return res });
  }

  GetDocumentForPreviewByFileId(FileId: number) {
    return this.claimManagementDLService.GetDocumentForPreviewByFileId(FileId)
      .map(res => { return res });
  }

  GetDocumentsByClaimCode(ClaimCode: number) {
    return this.claimManagementDLService.GetDocumentsByClaimCode(ClaimCode)
      .map(res => { return res });
  }

  GetPaymentPendingClaims(CreditOrganizationId: number) {
    return this.claimManagementDLService.GetPaymentPendingClaims(CreditOrganizationId)
      .map(res => { return res });
  }

  GetInsurancePayments(claimSubmissionId: number) {
    return this.claimManagementDLService.GetInsurancePayments(claimSubmissionId)
      .map(res => { return res });
  }

  ClaimDetailsForPreview(claimSubmissionId: number) {
    return this.claimManagementDLService.ClaimDetailsForPreview(claimSubmissionId)
      .map(res => { return res });
  }

  GetBillingCreditNotesByBillingTransactionId(BillingTransactionId: number) {
    return this.claimManagementDLService.GetBillingCreditNotesByBillingTransactionId(BillingTransactionId)
      .map(res => { return res });
  }

  GetPharmacyCreditNotesByInvoiceId(InvoiceId: number) {
    return this.claimManagementDLService.GetPharmacyCreditNotesByInvoiceId(InvoiceId)
      .map(res => { return res });
  }

  GetBillingCreditBillItems(BillingTransactionId: number) {
    return this.claimManagementDLService.GetBillingCreditBillItems(BillingTransactionId)
      .map(res => res);
  }

  GetPharmacyCreditBillItems(PharmacyInvoiceId: number) {
    return this.claimManagementDLService.GetPharmacyCreditBillItems(PharmacyInvoiceId)
      .map(res => res);
  }

  GetApiIntegrationNameByOrganizationId(OrganizationId: number) {
    return this.claimManagementDLService.GetApiIntegrationNameByOrganizationId(OrganizationId)
      .map(res => res);
  }

  GetInitiatedClaimCodesByPatientId(patientId: number) {
    return this.claimManagementDLService.GetInitiatedClaimCodesByPatientId(patientId).map(res => res);
  }

  GetFinalBillSummaryByClaimCode(claimCode: number) {
    return this.claimManagementDLService.GetFinalBillSummaryByClaimCode(claimCode).map(res => res);
  }


  //Hitting Other Controller than Claim Management
  GetBankList() {
    return this.claimManagementDLService.GetBankList()
      .map(res => { return res });
  }

  GetInvoiceReceiptByInvoiceId(invoiceId: number) {
    return this.claimManagementDLService.GetInvoiceReceiptByInvoiceId(invoiceId).map(res => res);
  }

  GetPharmacySaleReturnInvoiceItemsByInvoiceId(invoiceId: number) {
    return this.claimManagementDLService.GetPharmacySaleReturnInvoiceItemsByInvoiceId(invoiceId)
      .map(res => { return res });
  }

  GetPatientsWithVisitsInfo(searchTxt) {
    return this.claimManagementDLService.GetPatientsWithVisitsInfo(searchTxt)
      .map(res => res);
  }
  //#endregion


  //#region Post
  SendBillForClaimScrubbing(bills: Array<ClaimBillReviewDTO>) {
    return this.claimManagementDLService.SendBillForClaimScrubbing(bills)
      .map(res => { return res });
  }

  SubmitClaim(claimDTO: SubmittedClaimDTO) {
    return this.claimManagementDLService.SubmitClaim(claimDTO)
      .map(res => { return res });
  }

  AddInsuranceClaimPayment(claimPaymentObject: InsuranceClaimPayment) {
    return this.claimManagementDLService.AddInsuranceClaimPayment(claimPaymentObject)
      .map(res => { return res });
  }
  //#endregion


  //#region Put
  UpdateClaimableStatus(bills: Array<ClaimBillReviewDTO>, claimableStatus: boolean) {
    return this.claimManagementDLService.UpdateClaimableStatus(bills, claimableStatus)
      .map(res => { return res });
  }

  UpdateClaimableStatusOfClaimedInvoice(bill: ClaimBillReviewDTO, claimableStatus: boolean) {
    return this.claimManagementDLService.UpdateClaimableStatusOfClaimedInvoice(bill, claimableStatus)
      .map(res => { return res });
  }

  RevertInvoiceBackToBillReview(bill: ClaimBillReviewDTO) {
    return this.claimManagementDLService.RevertInvoiceBackToBillReview(bill)
      .map(res => { return res });
  }

  SaveClaimAsDraft(claimDTO: SubmittedClaimDTO) {
    return this.claimManagementDLService.SaveClaimAsDraft(claimDTO)
      .map(res => { return res });
  }

  UpdateClaimableCode(bills: Array<ClaimBillReviewDTO>, claimCode: number) {
    return this.claimManagementDLService.UpdateClaimableCode(bills, claimCode)
      .map(res => { return res });
  }

  UpdateApprovedAndRejectedAmount(claimDTO: InsurancePendingClaim) {
    return this.claimManagementDLService.UpdateApprovedAndRejectedAmount(claimDTO)
      .map(res => { return res });
  }

  ConcludeClaim(claimSubmissionId: number) {
    return this.claimManagementDLService.ConcludeClaim(claimSubmissionId)
      .map(res => { return res });
  }

  RevertClaimBackToClaimScrubbing(claimSubmissionId: number) {
    return this.claimManagementDLService.RevertClaimBackToClaimScrubbing(claimSubmissionId)
      .map(res => { return res });
  }

  UpdateBillingCreditItemClaimableStatus(BillingCreditBillItem: BillingCreditBillItem_DTO) {
    let temp = _.omit(BillingCreditBillItem, ['ItemName', 'Quantity', 'TotalAmount']);
    return this.claimManagementDLService.UpdateBillingCreditItemClaimableStatus(temp)
      .map(res => res);
  }

  UpdatePharmacyCreditItemClaimableStatus(PharmacyCreditBillItem: PharmacyCreditBillItem_DTO) {
    let temp = _.omit(PharmacyCreditBillItem, ['ItemName', 'Quantity', 'TotalAmount']);
    return this.claimManagementDLService.UpdatePharmacyCreditItemClaimableStatus(temp)
      .map(res => res);
  }

  UpdateInsuranceClaimPayment(claimPaymentObject: InsuranceClaimPayment) {
    return this.claimManagementDLService.UpdateInsuranceClaimPayment(claimPaymentObject)
      .map(res => { return res });
  }
  //#endregion
  GetECHSPatientWithVisitInformation(searchTxt) {
    return this.claimManagementDLService.GetECHSPatientWithVisitInformation(searchTxt)
      .map(res => res);
  }
  ClaimableInvoicesDetailInfo(phrmInvoiceIds: string, billingInvoiceIds: string) {
    return this.claimManagementDLService.ClaimableInvoicesDetailInfo(phrmInvoiceIds, billingInvoiceIds).map((responseData) => {
      return responseData;
    });
  }
  UploadSingleClaimFile(claimUploadSingleFileUploadRequest: INSClaimSubmissionSingleDocument_DTO) {
    return this.claimManagementDLService.UploadSingleClaimFile(claimUploadSingleFileUploadRequest).map((responseData) => {
      return responseData;
    });
  }
  UploadMultipleClaimFile(claimUploadMultipleFileUploadRequest: INSClaimSubmissionMultipleDocument_DTO) {
    return this.claimManagementDLService.UploadMultipleClaimFile(claimUploadMultipleFileUploadRequest).map((responseData) => {
      return responseData;
    });
  }
  PrepareClaimPayment(claim: InsurancePendingClaim) {
    return this.claimManagementDLService.PrepareClaimPayment(claim)
      .map(res => { return res });
  }
  GetDiagnosis() {
    return this.claimManagementDLService.GetDiagnosis().map((responseData) => {
      return responseData;
    });
  }
  GetDoctorListWithNMCNo() {
    return this.claimManagementDLService.DoctorListWithNMCNo().map((responseData) => {
      return responseData;
    });
  }
  GetClaimCodeWiseReportData(ClaimCode: number) {
    return this.claimManagementDLService.GetClaimCodeWiseReports(ClaimCode)
      .map(res => res);
  }

  SubmitHibLiveClaim(hibLiveClaim: HibLiveClaimDTO) {
    return this.claimManagementDLService.SubmitHibLiveClaim(hibLiveClaim)
      .map(res => res);
  }
  UpdateDocumentUpdateStatus(bills: Array<ClaimBillReviewDTO>) {
    return this.claimManagementDLService.UpdateDocumentUpdateStatus(bills)
      .map(res => { return res });
  }
  GetSubmittedClaims(fromDate: string, toDate: string) {
    return this.claimManagementDLService.GetSubmittedClaims(fromDate, toDate).map(res => {
      return res;
    });
  }
  UploadDocument(addAttachment: AddAttachmentDTO) {
    return this.claimManagementDLService.UploadDocument(addAttachment).map(res => {
      return res;
    });
  }
  GetClaimDocumentReceivedReport(FromDate: string, ToDate: string, PatientId: number, ClaimCode: number, InvoiceNo: string) {
    return this.claimManagementDLService.GetClaimDocumentReceivedReport(FromDate, ToDate, PatientId, ClaimCode, InvoiceNo).map(res => {
      return res;
    });
  }
}
