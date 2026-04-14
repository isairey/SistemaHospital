import { ChangeDetectorRef, Component, EventEmitter, Input, Output } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import html2canvas from 'html2canvas';
import * as jsPDF from 'jspdf';
import * as _ from 'lodash';
import * as moment from 'moment';
import { PDFDocument } from "pdf-lib";
import { CoreService } from '../../core/shared/core.service';
import { INSClaimableBillingInvoiceItems } from '../../insurance/nep-gov/shared/ins-claim-bill-invoice-item.dto';
import { INSClaimableBillingInvoiceInfo_DTO, INSClaimablePharmacyInvoiceInfo_DTO } from '../../insurance/nep-gov/shared/ins-claim-invoice-info.dto';
import { INSClaimBillingInvoiceReceipt_DTO, INSClaimPharmacyInvoiceReceipt_DTO } from '../../insurance/nep-gov/shared/ins-claim-invoice-receipt.dto';
import { INSClaimablePharmacyInvoiceItems } from '../../insurance/nep-gov/shared/ins-claim-phrm-invoice-item.dto';
import { INSClaimSubmissionMultipleDocument_DTO, INSClaimSubmissionSingleDocument_DTO } from '../../insurance/nep-gov/shared/ins-claim-submission-document.dto';
import { BillablePeriod, Category, ClaimInformation, ClaimSubmitRequest, ClaimType, Coding, Diagnosis, DiagnosisCodeableConcept, Enterer, Facility, HIBConfigurationParameterModel, INSClaimResponseInfo, Identifier, IdentifierCoding, Item, Patient, PatientType, Quantity, Service, Total, Types, UnitPrice } from '../../insurance/nep-gov/shared/ins-claim.model';
import { PatientService } from '../../patients/shared/patient.service';
import { RadiologyService } from '../../radiology/shared/radiology-service';
import { SecurityService } from '../../security/shared/security.service';
import { UploadedFile } from '../../shared/DTOs/uploaded-files-DTO';
import { DanpheHTTPResponse } from '../../shared/common-models';
import { MessageboxService } from '../../shared/messagebox/messagebox.service';
import { ENUM_ClaimCategory, ENUM_ClaimExtensionUrl, ENUM_ClaimInformationCategory, ENUM_ClaimResourceType, ENUM_CreditModule, ENUM_DanpheHTTPResponseText, ENUM_DateTimeFormat, ENUM_ICDCoding, ENUM_IntegrationNames, ENUM_MessageBox_Status, ENUM_Scheme_ApiIntegrationNames, ENUM_ValidFileFormats } from '../../shared/shared-enums';
import { ClaimBillReviewDTO } from '../shared/DTOs/ClaimManagement_BillReview_DTO';
import { InsurancePendingClaim } from '../shared/DTOs/ClaimManagement_PendingClaims_DTO';
import { SubmittedClaimDTO } from '../shared/DTOs/ClaimManagement_SubmittedClaim_DTO';
import { Diagnosis_DTO } from '../shared/DTOs/diagnosis.dto';
import { DoctorNMCNo_DTO } from '../shared/DTOs/doctors-nmc.dto';
import { ClaimManagementBLService } from '../shared/claim-management.bl.service';

@Component({
  selector: 'ins-claim-scrubbing',
  templateUrl: './ins-claim-scrubbing.component.html'
})
export class InsuranceClaimScrubbingComponent {

  @Input("Claim")
  public claimDetail: InsurancePendingClaim = new InsurancePendingClaim();
  @Output("CloseClaimScrubbingPopUp")
  PopUpCloseEmitter: EventEmitter<Object> = new EventEmitter<Object>();
  public invoiceList: Array<ClaimBillReviewDTO> = new Array<ClaimBillReviewDTO>();
  PharmacyInvoicesList: Array<ClaimBillReviewDTO> = new Array<ClaimBillReviewDTO>();
  PharmacyInvoiceListForDocument: Array<ClaimBillReviewDTO> = new Array<ClaimBillReviewDTO>();
  BillingInvoiceListForDocument: Array<ClaimBillReviewDTO> = new Array<ClaimBillReviewDTO>();

  BillingInvoicesList: Array<ClaimBillReviewDTO> = new Array<ClaimBillReviewDTO>();
  public showNewDocumentUploadPopUp: boolean = false;
  public uploadedDocuments: Array<UploadedFile> = new Array<UploadedFile>();
  public selectedDocument: UploadedFile = new UploadedFile();
  public totalAmount: number = 0;
  public nonClaimableAmount: number = 0;
  public claimableAmount: number = 0;
  public fileSrc: any;
  public claimForSubmission: SubmittedClaimDTO = new SubmittedClaimDTO();
  public loading: boolean = false;
  public selectedInvoiceIndex: number = -1;
  public showImageFilePreviewPopUp: boolean = false;
  public showNonImageFilePreviewPopUp: boolean = false;
  public showBillPreviewPage: boolean = false;
  public selectedInvoice: ClaimBillReviewDTO = new ClaimBillReviewDTO();
  public showClaimPreviewPage: boolean = false;
  public confirmationTitle: string = "Confirm !";
  public confirmationMessageForSaveAsDraft: string = "Are you sure you want to Save As Draft ?";
  public confirmationMessageForSubmitClaim: string = "Are you sure you want to Submit Claim ?";
  public confirmationMessageForRevertToBillReview: string = "Are you sure you want to Revert To Bill Review ?";
  BillingInvoices: INSClaimableBillingInvoiceInfo_DTO[] = [];
  BillingInvoiceItems: INSClaimableBillingInvoiceItems[] = [];
  PharmacyInvoiceItems: INSClaimablePharmacyInvoiceItems[] = [];
  PharmacyInvoices: INSClaimablePharmacyInvoiceInfo_DTO[] = [];
  public HIBConfigurationParameter: HIBConfigurationParameterModel;
  public ClaimBillingInvoices: ClaimBillReviewDTO[] = [];
  public ClaimPharmacyInvoices: ClaimBillReviewDTO[] = [];
  public claimSubmitRequest: ClaimSubmitRequest = new ClaimSubmitRequest();
  public IsClaimReadyForSubmit: boolean = false;
  phrmInvoiceIds: string = '';
  billingInvoiceIds: string = '';
  public billingCreditModule: string = ENUM_CreditModule.Billing;
  public pharmacyCreditModule: string = ENUM_CreditModule.Pharmacy;
  showPharmacyInvoice: boolean = false;
  showBillingInvoice: boolean = false;
  documentCode: string;
  combinedPdf: any[] = [];
  PharmacyInvoice: INSClaimPharmacyInvoiceReceipt_DTO = new INSClaimPharmacyInvoiceReceipt_DTO();
  BillingInvoice: INSClaimBillingInvoiceReceipt_DTO = new INSClaimBillingInvoiceReceipt_DTO();
  IsClaimDocumentReadyForSubmit: boolean = false;
  IsClaimReadyForPayment: boolean = false;
  claimWiseReportData: Array<ClaimCodeWiseReport_DTO> = new Array<ClaimCodeWiseReport_DTO>();
  requisitionId: number = null;
  showImagingReport: boolean = false;
  IsRadiologyReportFromClaim: boolean = false;
  requisitionIdList = [];
  printReportFromGrid: boolean = false;
  verificationRequired: boolean = false;
  showGrid: boolean = false;
  showAddEditResult: boolean = false;
  showReport: boolean = false;
  showLabReport: boolean = false;
  enableResultEdit: boolean = false;
  showSummaryView: boolean = false;
  selectedDischarge: any;
  IsRadiologyReportView: boolean = false;
  IsLabReportView: boolean = false;
  IsDischargeSummaryReportView: boolean = false;
  public files = Array<File>();
  public pdfCounter: number = 0;
  IsLabDataReceived: boolean = false;
  IsCustomizeFields: boolean = false;
  RadiologyReportName: string = '';
  LabReportName: string = '';
  DischargeReportName: string = '';
  showHeader: boolean = false;
  showLabReportPopup: boolean = false;
  showDischargeSummaryViewPopup: boolean = false;
  NMCNumber: string = '';
  SelectedICDCode: Diagnosis_DTO = new Diagnosis_DTO();
  DiagnosisList: Diagnosis_DTO[] = [];
  SelectedDiagnosisList: Diagnosis_DTO[] = [];
  SelectedICDCodes: string[] = [];
  NGHISApiIntegrationName: string = ENUM_Scheme_ApiIntegrationNames.NGHIS;
  diagnosisTempData: Diagnosis[] = [];
  IsLatestHIBAPI: boolean = false;
  DoctorsNMCNoList: DoctorNMCNo_DTO[] = [];
  SelectedNMCNo: DoctorNMCNo_DTO = new DoctorNMCNo_DTO();
  SelectedNMCNoList: DoctorNMCNo_DTO[] = [];
  ShowPrintButton: boolean = true;
  ExplanationContent: string = '';
  ExplanationContents: string[] = [];
  SelectAllPharmacyInvoices: boolean = false;
  SelectAllBillingInvoices: boolean = false;
  ShowPharmacyGenerateDocumentButton: boolean = false;
  ShowBillingGenerateDocumentButton: boolean = false;
  public BillReviewClicked: boolean = true;
  IsAllPharmacyDocumentGenerated: boolean = false;
  IsAllBillingDocumentGenerated: boolean = false;
  RadiologyReportFromClaimScrubbing: boolean = false;
  constructor(
    private claimManagementBlService: ClaimManagementBLService,
    private messageBoxService: MessageboxService,
    private _securityService: SecurityService,
    private sanitizer: DomSanitizer, public patientService: PatientService, public changeDetector: ChangeDetectorRef, public coreService: CoreService,
    private radiologyService: RadiologyService

  ) {
    this.GetHIBIntegrationParameter();
    this.GetDiagnosis();
    this.GetDoctorListWithNMCNo();
    this.radiologyService.GetTemplatesStyles();

  }

  ngOnInit() {
    this.GetInvoiceByClaimSubmissionId(this.claimDetail.ClaimSubmissionId);
    this.GetDocumentsByClaimCode(this.claimDetail.ClaimCode);
    this.GetClaimWiseReportData(this.claimDetail.ClaimCode);
    this.radiologyService.GetTemplatesStyles();
  }

  public GetInvoiceByClaimSubmissionId(claimSubmissionId: number): void {
    this.BillingInvoicesList = [];
    this.PharmacyInvoicesList = [];
    this.claimManagementBlService.GetInvoicesByClaimSubmissionId(claimSubmissionId)
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
          if (res.Results) {
            this.invoiceList = res.Results;
            let phrmInvoiceIdsList: Array<number> = new Array<number>();
            let billingInvoiceIdsList: Array<number> = new Array<number>();
            this.invoiceList.forEach(i => {
              if (i.CreditModule == ENUM_CreditModule.Billing) {
                this.ClaimBillingInvoices.push(i);
                if (this.BillReviewClicked) {
                  this.BillingInvoicesList.push(i);
                }
                billingInvoiceIdsList.push(i.InvoiceRefId);
              }
              if (i.CreditModule == ENUM_CreditModule.Pharmacy) {
                this.ClaimPharmacyInvoices.push(i);
                if (this.BillReviewClicked) {
                  this.PharmacyInvoicesList.push(i);
                }
                phrmInvoiceIdsList.push(i.InvoiceRefId);
              }
            });
            this.phrmInvoiceIds = phrmInvoiceIdsList.join(',');
            this.billingInvoiceIds = billingInvoiceIdsList.join(',');

            this.GetClaimableInvoicesDetailInfo(this.phrmInvoiceIds, this.billingInvoiceIds);

            this.nonClaimableAmount = 0;
            this.claimableAmount = 0;
            this.totalAmount = 0;
            let nonClaimableInvoices = _.cloneDeep(this.invoiceList.filter(a => a.IsClaimable === false));
            if (nonClaimableInvoices.length > 0) {
              this.nonClaimableAmount += nonClaimableInvoices.reduce((a, b) => a + b.TotalAmount, 0);
              this.totalAmount += nonClaimableInvoices.reduce((a, b) => a + b.TotalAmount, 0);
            }
            let claimableInvoices = _.cloneDeep(this.invoiceList.filter(a => a.IsClaimable === true));
            if (claimableInvoices.length > 0) {
              this.nonClaimableAmount += claimableInvoices.reduce((a, b) => a + b.NonClaimableAmount, 0);
              this.totalAmount += claimableInvoices.reduce((a, b) => a + b.TotalAmount, 0);
            }
            this.claimableAmount = this.totalAmount - this.nonClaimableAmount;
            this.claimDetail.ClaimedAmount = this.claimableAmount - this.nonClaimableAmount;

          }
        }
      },
        (err: DanpheHTTPResponse) => {
          this.messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Exception: ${err.ErrorMessage}`]);
        }
      );
  }

  public GetDocumentsByClaimCode(claimCode: number): void {
    this.claimManagementBlService.GetDocumentsByClaimCode(claimCode)
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponseText.OK && res.Results.length) {
          this.uploadedDocuments = res.Results;
          this.uploadedDocuments.forEach(d => {
            d.UploadedOn = moment(d.UploadedOn).format("YYYY-MM-DD");
          })
        }
      },
        (err: DanpheHTTPResponse) => {
          this.messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Exception: ${err.ErrorMessage}`]);
        }
      );
  }

  public CloseClaimScrubbingPopUp(): void {
    this.PopUpCloseEmitter.emit();
  }

  public OpenNewDocumentUploadPopUp(): void {
    this.showNewDocumentUploadPopUp = true;
  }

  public CloseNewDocumentUploadPopUp(): void {
    this.showNewDocumentUploadPopUp = false;
  }

  public GetUploadedDocument($event): void {
    if ($event) {
      $event.forEach(file => {
        this.uploadedDocuments.push(file);
      });
    }
    this.showNewDocumentUploadPopUp = false;
  }

  public RemoveDocument(index: number, file: UploadedFile): void {
    this.uploadedDocuments.splice(index, 1);
    const existingFile = this.claimWiseReportData.find(f => f.ReportName === file.FileName);
    if (existingFile) {
      existingFile.IsDocGenerated = false;
    }
    const exisitingInvoiceDocument = this.invoiceList.find(f => f.InvoiceNo === file.FileName);
    if (exisitingInvoiceDocument) {
      exisitingInvoiceDocument.IsDocumentGenerated = false;
    }
  }

  public PreviewFile(index: number, file: UploadedFile): void {
    if (file.FileId === 0) {
      this.selectedDocument = this.uploadedDocuments[index];
      this.DocumentPreview(this.selectedDocument);
    }
    else if (file.FileId > 0) {
      this.claimManagementBlService.GetDocumentForPreviewByFileId(file.FileId)
        .subscribe((res: DanpheHTTPResponse) => {
          if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
            this.selectedDocument = res.Results;
            this.DocumentPreview(this.selectedDocument);
          }
        },
          (err: DanpheHTTPResponse) => {
            this.messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Exception: ${err.ErrorMessage}`]);
          }
        );
    }
  }

  public CloseFilePreviewPopUp(): void {
    this.showNonImageFilePreviewPopUp = false;
    this.showImageFilePreviewPopUp = false;
  }

  public SubmitClaim(): void {
    if (this.claimDetail.ApiIntegrationName === this.NGHISApiIntegrationName) {
      if (!this.SelectedNMCNoList.length && this.IsLatestHIBAPI) {
        this.messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, ['Please enter a valid NMC.']);
        this.loading = false;
        return;
      }

      if (this.claimDetail.ApiIntegrationName === this.NGHISApiIntegrationName && (!this.claimSubmitRequest.diagnosis || this.claimSubmitRequest.diagnosis.length === 0)) {
        this.messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, ['Diagnosis is mandatory.']);
        this.loading = false;
        return;
      }

      if (this.claimDetail.ApiIntegrationName === this.NGHISApiIntegrationName && !this.ExplanationContents.length) {
        this.messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, ['Explanation is mandatory for Claim Submission.']);
        this.loading = false;
        return;
      }
      if (this.IsLatestHIBAPI && this.SelectedNMCNoList.length) {
        const nmcNoList: string[] = this.SelectedNMCNoList.map(item => item.NMCNo);
        this.claimSubmitRequest.nmc = nmcNoList.join(', ');


        let claimInformationList = new Array<ClaimInformation>();
        if (this.ExplanationContents.length) {
          this.ExplanationContents.forEach((content, i) => {
            let information = new ClaimInformation();
            let category = new Category();
            category.text = ENUM_ClaimInformationCategory.Explanation;
            information.category = category;
            information.sequence = i + 1;
            information.valueString = content;
            claimInformationList.push(information);
          });
        }

        this.claimSubmitRequest.information = claimInformationList;
      }
    }
    if (this.claimDetail.ClaimedAmount > 0 && this.claimDetail.ClaimedAmount <= this.claimableAmount) {
      this.loading = true;
      this.claimDetail.TotalBillAmount = this.totalAmount;
      this.claimDetail.NonClaimableAmount = this.nonClaimableAmount;
      this.claimForSubmission.files = this.uploadedDocuments;
      this.claimForSubmission.claim = this.claimDetail;
      if (this.claimDetail.ApiIntegrationName === ENUM_Scheme_ApiIntegrationNames.NGHIS) {

        this.claimForSubmission.HIBClaimSubmitPayload = this.claimSubmitRequest;
      }
      const isValid = this.CheckUploadedFilesValidation(this.claimForSubmission.files);
      if (isValid) {
        this.claimManagementBlService.SubmitClaim(this.claimForSubmission)
          .finally(() => { this.loading = false; })
          .subscribe((res: DanpheHTTPResponse) => {
            if (res.Status === ENUM_DanpheHTTPResponseText.OK && res.Results) {
              const claimResponse = res.Results;
              if (claimResponse && claimResponse.Result) {
                if (claimResponse.Result.status) {
                  this.messageBoxService.showMessage(ENUM_MessageBox_Status.Success, [`Claim successfully submitted.`]);
                  this.IsClaimDocumentReadyForSubmit = true;
                  if (this.claimForSubmission.claim.ApiIntegrationName !== ENUM_Scheme_ApiIntegrationNames.NGHIS) {
                    this.CloseClaimScrubbingPopUp();
                  }
                } else {
                  this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, [`Failed to Submit the claim with error messages as ${claimResponse.Result.message}`]);
                }

              } else {
                this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, [`Failed to Submit the claim. <br>` + res.ErrorMessage]);
              }
            }
            else {
              this.messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Unable to submit claim. ${res.ErrorMessage}`]);
            }
          },
            (err: DanpheHTTPResponse) => {
              this.messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Exception: ${err.ErrorMessage}`]);
            }
          );
      }
      else {
        this.messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Duplicate Files.`]);
        this.loading = false;
      }
    }
    else {
      this.messageBoxService.showMessage(ENUM_MessageBox_Status.Warning, [`Claimed Amount is Invalid. It must be greater than 0 and less than Claimable Amount`]);
      this.loading = false;
    }
  }

  public SetInvoiceClaimable(bill: ClaimBillReviewDTO): void {
    this.claimManagementBlService.UpdateClaimableStatusOfClaimedInvoice(bill, true)
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
          this.GetInvoiceByClaimSubmissionId(this.claimDetail.ClaimSubmissionId);
          this.messageBoxService.showMessage(ENUM_MessageBox_Status.Success, [`Invoice is successfully updated as Claimable.`]);
        }
        else {
          this.messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Unable to update claimable status of this invoice.`]);
        }
      },
        (err: DanpheHTTPResponse) => {
          this.messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Exception: ${err.ErrorMessage}`]);
        }
      );
  }

  public SetInvoiceNonClaimable(bill): void {
    this.claimManagementBlService.UpdateClaimableStatusOfClaimedInvoice(bill, false)
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
          this.GetInvoiceByClaimSubmissionId(this.claimDetail.ClaimSubmissionId);
          this.messageBoxService.showMessage(ENUM_MessageBox_Status.Success, [`Invoice is successfully updated as Non-Claimable.`]);
        }
        else {
          this.messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Unable to update claimable status of this invoice.`]);
        }
      },
        (err: DanpheHTTPResponse) => {
          this.messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Exception: ${err.ErrorMessage}`]);
        }
      );
  }

  public RevertInvoiceBackToBillReview(bill: ClaimBillReviewDTO): void {
    this.claimManagementBlService.RevertInvoiceBackToBillReview(bill)
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
          this.messageBoxService.showMessage(ENUM_MessageBox_Status.Success, [`Invoice is successfully reverted back to bill review page.`]);
          this.GetInvoiceByClaimSubmissionId(this.claimDetail.ClaimSubmissionId);
        }
        else {
          this.messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Unable to update revert invoice to bill review.`]);
        }
      },
        (err: DanpheHTTPResponse) => {
          this.messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Exception: ${err.ErrorMessage}`]);
        }
      );
  }

  public SaveClaimAsDraft(): void {
    this.loading = true;
    this.claimDetail.TotalBillAmount = this.totalAmount;
    this.claimDetail.NonClaimableAmount = this.nonClaimableAmount;
    this.claimForSubmission.files = this.uploadedDocuments;
    this.claimForSubmission.claim = this.claimDetail;
    const isValid = this.CheckUploadedFilesValidation(this.claimForSubmission.files);
    if (isValid) {
      this.claimManagementBlService.SaveClaimAsDraft(this.claimForSubmission)
        .finally(() => { this.loading = false; })
        .subscribe((res: DanpheHTTPResponse) => {
          if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
            this.messageBoxService.showMessage(ENUM_MessageBox_Status.Success, [`Insurance claim successfully Saved As Draft.`]);
            this.GetDocumentsByClaimCode(this.claimDetail.ClaimCode);
          }
          else {
            this.messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Unable to save claim in draft.`]);
          }
        },
          (err: DanpheHTTPResponse) => {
            this.messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Exception: ${err.ErrorMessage}`]);
          }
        );
    }
    else {
      this.messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Duplicate Files.`]);
      this.loading = false;
    }
  }

  public CloseBillPreviewPage(event): void {
    this.selectedInvoice = new ClaimBillReviewDTO();
    this.BillReviewClicked = false;
    this.showBillPreviewPage = false;
  }

  public OpenBillPreviewPage(index: number): void {
    this.selectedInvoice = this.invoiceList[index];
    this.selectedInvoice.PatientName = this.claimDetail.PatientName;
    this.selectedInvoice.HospitalNo = this.claimDetail.HospitalNo;
    this.selectedInvoice.AgeSex = this.claimDetail.AgeSex;
    this.showBillPreviewPage = true;
  }

  public ClaimPreview(): void {
    this.showClaimPreviewPage = true;
  }

  public CloseClaimPreviewPage(event): void {
    this.showClaimPreviewPage = false;
  }

  public DocumentPreview(selectedDocument: UploadedFile) {
    const indx = selectedDocument.BinaryData.indexOf(',');
    const binaryString = window.atob(selectedDocument.BinaryData.substring(indx + 1));
    const bytes = new Uint8Array(binaryString.length);
    const arrayBuffer = bytes.map((byte, i) => binaryString.charCodeAt(i));
    const blob = new Blob([arrayBuffer], { type: selectedDocument.FileExtension });
    this.fileSrc = this.sanitizer.bypassSecurityTrustResourceUrl(URL.createObjectURL(blob));
    if (selectedDocument.FileExtension === ENUM_ValidFileFormats.jpegImage || selectedDocument.FileExtension === ENUM_ValidFileFormats.jpgImage) {
      this.showImageFilePreviewPopUp = true;
    }
    else {
      this.showNonImageFilePreviewPopUp = true;
    }
  }

  public CheckUploadedFilesValidation(files: UploadedFile[]): boolean {
    const filenames: string[] = files.map(file => file.FileDisplayName); // Extract the filenames

    // Check if there are any duplicate filenames
    const duplicateFilenames = filenames.filter((filename, index) => filenames.indexOf(filename) !== index);
    return duplicateFilenames.length === 0;
  }

  public HandleConfirmForSaveAsDraft(): void {
    this.loading = true;
    if (this.uploadedDocuments.length > 0) {
      this.SaveClaimAsDraft();
    }
    else {
      this.loading = false;
      this.messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, ['Files Not Found']);
    }
  }

  public HandleCancel(): void {
    this.loading = false;
  }

  public HandleConfirmForSubmitClaim(): void {
    this.loading = true;
    this.SubmitClaim();
  }
  public HandleConfirmForRevertToBillReview(bill: ClaimBillReviewDTO): void {
    this.RevertInvoiceBackToBillReview(bill);
  }
  GetClaimableInvoicesDetailInfo(phrmInvoiceIds: string, billingInvoiceIds: string): void {
    this.claimManagementBlService.ClaimableInvoicesDetailInfo(phrmInvoiceIds, billingInvoiceIds).finally(() => { this.loading = false; }).subscribe((res: DanpheHTTPResponse) => {
      if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
        this.BillingInvoices = res.Results.BillingInvoices;
        this.BillingInvoiceItems = res.Results.BillingInvoiceItems;

        this.PharmacyInvoices = res.Results.PharmacyInvoices;
        this.PharmacyInvoiceItems = res.Results.PharmacyInvoiceItems;
        this.claimSubmitRequest = this.PrepareClaimSubmitRequest();
        this.IsClaimReadyForSubmit = true;
      }
      else {
        this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ['Failed to get claim code invoices detail info.']);
        this.IsClaimReadyForSubmit = false;
      }
    }, err => {
      this.messageBoxService.showMessage(ENUM_MessageBox_Status.Error, ['Failed to get claim code invoices detail info.' + err]);
      this.IsClaimReadyForSubmit = false;
    });
  }
  PrepareClaimSubmitRequest(): ClaimSubmitRequest {
    if (this.ClaimBillingInvoices && this.ClaimBillingInvoices.length) {
      this.ClaimBillingInvoices = this.ClaimBillingInvoices.sort((a, b) => a.InvoiceRefId - b.InvoiceRefId);
    }
    if (this.ClaimPharmacyInvoices && this.ClaimPharmacyInvoices.length) {
      this.ClaimPharmacyInvoices = this.ClaimPharmacyInvoices.sort((a, b) => a.InvoiceRefId - b.InvoiceRefId);
    }
    const claimSubmitRequest: ClaimSubmitRequest = new ClaimSubmitRequest();
    claimSubmitRequest.resourceType = ENUM_ClaimResourceType.ResourceType;


    let claimResponseInfo = new INSClaimResponseInfo()
    claimResponseInfo.PatientId = this.claimDetail.PatientId;
    claimResponseInfo.PatientCode = this.claimDetail.HospitalNo;
    claimResponseInfo.ClaimedDate = moment().format('YYYY-MM-DD hh:mm:ss');
    claimResponseInfo.ClaimCode = this.claimDetail.ClaimCode;

    let InvoiceNoList = [];
    if (this.ClaimBillingInvoices && this.ClaimBillingInvoices.length) {
      this.ClaimBillingInvoices.forEach((invoice) => {
        InvoiceNoList.push('BL-' + invoice.InvoiceNo);
      });
    }
    if (this.ClaimPharmacyInvoices && this.ClaimPharmacyInvoices.length) {
      this.ClaimPharmacyInvoices.forEach((invoice) => {
        InvoiceNoList.push('PH-' + invoice.InvoiceNo);
      });
    }
    claimResponseInfo.InvoiceNoCSV = InvoiceNoList.join(",");
    claimSubmitRequest.claimResponseInfo = claimResponseInfo;

    const billablePeriod: BillablePeriod = new BillablePeriod();

    billablePeriod.start = this.claimDetail.VisitCreationDate;

    if ((this.ClaimBillingInvoices && this.ClaimBillingInvoices.length > 0) || (this.ClaimPharmacyInvoices && this.ClaimPharmacyInvoices.length > 0)) {
      const lastBillingInvoice = this.ClaimBillingInvoices[this.ClaimBillingInvoices.length - 1];
      const lastPharmacyInvoice = this.ClaimPharmacyInvoices[this.ClaimPharmacyInvoices.length - 1];

      if (lastBillingInvoice && lastPharmacyInvoice) {
        const billingInvoiceDate: moment.Moment = moment(new Date(lastBillingInvoice.InvoiceDate));
        const pharmacyInvoiceDate: moment.Moment = moment(new Date(lastPharmacyInvoice.InvoiceDate));

        const currentDate: string = moment().format('DD-MM-YYYY');
        const daysDiff1: number = moment(currentDate, 'DD-MM-YYYY').diff(billingInvoiceDate, 'days');
        const daysDiff2: number = moment(currentDate, 'DD-MM-YYYY').diff(pharmacyInvoiceDate, 'days');

        billablePeriod.end = daysDiff1 < daysDiff2 ? lastBillingInvoice.InvoiceDate.toString() : lastPharmacyInvoice.InvoiceDate.toString();
      } else if (lastBillingInvoice) {
        billablePeriod.end = lastBillingInvoice.InvoiceDate.toString();
      } else if (lastPharmacyInvoice) {
        billablePeriod.end = lastPharmacyInvoice.InvoiceDate.toString();
      }
    }
    claimSubmitRequest.billablePeriod = billablePeriod;
    claimSubmitRequest.created = moment().format("YYYY-MM-DD");
    claimSubmitRequest.id = this.claimDetail.PolicyHolderUID;


    // let diagnosisArray: Diagnosis[] = [];

    // let diagnosisA = new Diagnosis();
    // diagnosisA.sequence = 1;
    // let claimCodingA = new Coding();
    // claimCodingA.code = ENUM_DefaultICDCode.Code_1A00;
    // let typeA = new ClaimType();
    // typeA.text = ENUM_ICDCoding.ICD10;
    // diagnosisA.type.push(typeA);
    // let claimDiagnosisCodeAbleConceptA = new DiagnosisCodeableConcept();
    // claimDiagnosisCodeAbleConceptA.coding.push(claimCodingA);
    // diagnosisA.diagnosisCodeableConcept = claimDiagnosisCodeAbleConceptA;
    // diagnosisArray.push(diagnosisA);



    // let diagnosisB = new Diagnosis();
    // diagnosisB.sequence = 2;
    // let claimCodingB = new Coding();
    // claimCodingB.code = ENUM_DefaultICDCode.Code_5B5G;
    // let typeB = new ClaimType();
    // typeB.text = ENUM_ICDCoding.ICD11;
    // diagnosisB.type.push(typeB);
    // let claimDiagnosisCodeAbleConceptB = new DiagnosisCodeableConcept();
    // claimDiagnosisCodeAbleConceptB.coding.push(claimCodingB);
    // diagnosisB.diagnosisCodeableConcept = claimDiagnosisCodeAbleConceptB;
    // diagnosisArray.push(diagnosisB);


    // claimSubmitRequest.diagnosis = diagnosisArray;
    // this.diagnosisTempData = diagnosisArray;

    let claimItems: Item[] = [];
    let selectedInvoiceItems = this.BillingInvoiceItems;
    let totalInvoiceItemsAmount = 0;
    if (selectedInvoiceItems && selectedInvoiceItems.length) {
      selectedInvoiceItems.forEach((items, index) => {
        let item = new Item();
        item.sequence = index + 1;
        let claimCategory = new Category();
        claimCategory.text = ENUM_ClaimCategory.Service;
        item.category = claimCategory;
        let claimProductOrService = new Service();
        claimProductOrService.text = items.ServiceCode;
        item.service = claimProductOrService;
        let quantity = new Quantity();
        quantity.value = items.Quantity;
        item.quantity = quantity;
        let unitPrice = new UnitPrice();
        unitPrice.value = items.Price;
        item.unitPrice = unitPrice;
        claimItems.push(item);
        totalInvoiceItemsAmount += items.TotalAmount;
      });
    }

    let existingSequenceCount = claimItems.length;
    if (this.PharmacyInvoiceItems && this.PharmacyInvoiceItems.length) {
      this.PharmacyInvoiceItems.forEach((items, index) => {
        let item = new Item();
        item.sequence = existingSequenceCount + index + 1;

        let claimCategory = new Category();
        claimCategory.text = ENUM_ClaimCategory.Item;
        item.category = claimCategory;

        let claimProductOrService = new Service();
        claimProductOrService.text = items.ServiceCode;
        item.service = claimProductOrService;

        let quantity = new Quantity();
        quantity.value = items.Quantity;
        item.quantity = quantity;

        let unitPrice = new UnitPrice();
        unitPrice.value = items.UnitPrice;
        item.unitPrice = unitPrice;
        claimItems.push(item);
        totalInvoiceItemsAmount += (items.UnitPrice * items.Quantity);
      });

    }
    claimSubmitRequest.item = claimItems;

    let total = new Total();
    total.value = totalInvoiceItemsAmount;
    claimSubmitRequest.total = total;

    let claimingPatient = new Patient();
    claimingPatient.reference = `Patient/${this.claimDetail.PolicyHolderUID}`;
    claimSubmitRequest.patient = claimingPatient;


    let identifiers: Identifier[] = [];

    let ACSNIdentifier = new Identifier();
    let ACSNType = new Types();
    let ACSNCodings: IdentifierCoding[] = [];
    let ACSNCoding = new IdentifierCoding();
    ACSNCoding.code = 'ACSN';
    ACSNCoding.system = 'https://hl7.org/fhir/valueset-identifier-type.html';
    ACSNCodings.push(ACSNCoding);
    ACSNType.coding = ACSNCodings;
    ACSNIdentifier.type = ACSNType;
    ACSNIdentifier.use = "usual";
    ACSNIdentifier.value = this.claimDetail.PolicyHolderUID;
    identifiers.push(ACSNIdentifier);


    let MRIdentifier = new Identifier();
    let MRType = new Types();
    let MRCodings: IdentifierCoding[] = [];
    let MRCoding = new IdentifierCoding();
    MRCoding.code = 'MR';
    MRCoding.system = 'https://hl7.org/fhir/valueset-identifier-type.html';
    MRCodings.push(MRCoding);
    MRType.coding = MRCodings;
    MRIdentifier.type = MRType;
    MRIdentifier.use = "usual";
    MRIdentifier.value = this.claimDetail.ClaimCode.toString();
    identifiers.push(MRIdentifier);

    claimSubmitRequest.identifier = identifiers;

    let patient = new Patient();
    patient.reference = `Patient/${this.claimDetail.PolicyHolderUID}`
    claimSubmitRequest.patient = patient;

    let patientType = new PatientType();
    patientType.text = this.claimDetail.VisitTypeFormatted;
    claimSubmitRequest.type = patientType;

    let facility = new Facility();
    facility.reference = `${this.HIBConfigurationParameter.Facility}`;
    claimSubmitRequest.facility = facility;

    let enterer = new Enterer();
    enterer.reference = `${this.HIBConfigurationParameter.Enterer}`;
    claimSubmitRequest.enterer = enterer;

    claimSubmitRequest.careType = this.claimDetail.CareType;
    return claimSubmitRequest;
  }
  GetHIBIntegrationParameter(): void {
    let param = this.coreService.Parameters.find(a => a.ParameterGroupName === 'GovInsurance' && a.ParameterName === 'HIBConfiguration');
    if (param) {
      this.HIBConfigurationParameter = JSON.parse(param.ParameterValue);
      if (this.HIBConfigurationParameter && this.HIBConfigurationParameter.IsLatestAPI) {
        this.IsLatestHIBAPI = this.HIBConfigurationParameter.IsLatestAPI;
      }
    }
  }
  async GenerateDocument(bill: ClaimBillReviewDTO, mergedPdf: jsPDF) {
    const { CreditModule, InvoiceNo } = bill;
    if (CreditModule === this.pharmacyCreditModule && this.PharmacyInvoices.length) {
      this.documentCode = "Product-Invoices";
      const invoice = this.PharmacyInvoices.find(i => i.InvoiceId === bill.InvoiceRefId);
      this.PharmacyInvoice.PatientInfo = this.claimDetail;
      this.PharmacyInvoice.InvoiceInfo = invoice;
      this.PharmacyInvoice.InvoiceItems = this.PharmacyInvoiceItems.filter(item => item.InvoiceId === invoice.InvoiceId);
      let reportName: string = "";
      if (this.PharmacyInvoiceListForDocument.length > 1) {
        let InvoiceCode = "PH";
        reportName = this.claimDetail.HospitalNo + "_" + this.claimDetail.ClaimCode + "_" + InvoiceCode + "_" + moment().format(ENUM_DateTimeFormat.Year_Month_Day);
      }
      else {
        reportName = this.claimDetail.HospitalNo + "_" + this.claimDetail.ClaimCode + "_" + InvoiceNo + "_" + moment().format(ENUM_DateTimeFormat.Year_Month_Day);
      }
      await this.RenderInvoiceView("printpage2", reportName, "showPharmacyInvoice", mergedPdf);
      bill.IsDocumentGenerated = true;
    }
    if (CreditModule === this.billingCreditModule && this.BillingInvoices.length) {
      const inv = this.BillingInvoices.find(i => i.BillingTransactionId === bill.InvoiceRefId);
      this.BillingInvoice.InvoiceInfo = inv;
      this.BillingInvoice.PatientInfo = this.claimDetail;
      this.BillingInvoice.InvoiceItems = this.BillingInvoiceItems.filter(item => item.BillingTransactionId === inv.BillingTransactionId);
      this.documentCode = "Service-Invoices";
      let reportName: string = "";
      if (this.BillingInvoiceListForDocument.length > 1) {
        let InvoiceCode = "BL";
        reportName = this.claimDetail.HospitalNo + "_" + this.claimDetail.ClaimCode + "_" + InvoiceCode + "_" + moment().format(ENUM_DateTimeFormat.Year_Month_Day);
      }
      else {
        reportName = this.claimDetail.HospitalNo + "_" + this.claimDetail.ClaimCode + "_" + InvoiceNo + "_" + moment().format(ENUM_DateTimeFormat.Year_Month_Day);
      }
      await this.RenderInvoiceView("billing-receipt", reportName, "showBillingInvoice", mergedPdf);
      bill.IsDocumentGenerated = true;
    }
  }
  async RenderInvoiceView(id, reportName, flagName, mergedPdf: jsPDF) {
    this[flagName] = true;
    await new Promise(resolve => setTimeout(resolve));
    await this.GenerateInvoicePDF(id, reportName, mergedPdf);
    this[flagName] = false;
  }
  private async MergeInvoicesPDFDocuments(FileName: string) {
    let uploadFiles: UploadedFile = new UploadedFile();
    const mergedPdf = await PDFDocument.create();
    const fileName = `${FileName}.pdf`;
    for (let blob of this.combinedPdf) {
      const pdfBytes = await this.readBlobAsArrayBuffer(blob);
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    }

    const mergedPdfBytes = await mergedPdf.save();
    const mergedBlob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
    const mergedFile = new File([mergedBlob], fileName, { type: 'application/pdf' });
    uploadFiles.FileDisplayName = fileName;
    uploadFiles.FileName = FileName;
    uploadFiles.Size = mergedBlob.size;
    uploadFiles.FileExtension = mergedBlob.type;
    uploadFiles.UploadedOn = moment().format(ENUM_DateTimeFormat.Year_Month_Day);
    uploadFiles.FileUploadedBy = this._securityService.loggedInUser.UserName;

    const reader = new FileReader();
    reader.readAsDataURL(mergedFile);
    reader.onload = () => {
      const tempFile = reader.result.toString();
      const indx = tempFile.indexOf(',');
      const binaryString = tempFile.substring(indx + 1);
      uploadFiles.BinaryData = binaryString;
    }
    this.uploadedDocuments.push(uploadFiles);
  }
  public readBlobAsArrayBuffer(blob: Blob): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(new Uint8Array(reader.result as ArrayBuffer));
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(blob);
    });
  }
  public ExtractInvoiceNoFromFormattedInvoiceNo(formattedInvoiceNumber: string): number {
    const regex = /(\d+)/g;
    const InvoiceNumber = formattedInvoiceNumber.match(regex);
    if (InvoiceNumber && InvoiceNumber.length > 0) {
      return Number(InvoiceNumber[InvoiceNumber.length - 1]);
    } else {
      return null;
    }
  }
  SubmitDocument() {
    if (this.uploadedDocuments && this.uploadedDocuments.length) {
      if (this.uploadedDocuments.length === 1) {
        const base64StringWithDataURL = this.uploadedDocuments[0].BinaryData as string;
        const documentPayload = new INSClaimSubmissionSingleDocument_DTO();
        documentPayload.file = base64StringWithDataURL;
        documentPayload.name = `${this.claimDetail.PatientName}_${this.claimDetail.PatientId}`
        documentPayload.PatientId = this.claimDetail.PatientId;
        documentPayload.claim_id = this.claimDetail.ClaimCode;
        this.UploadSingleClaimFile(documentPayload);
      }
      else {
        const documentPayload = new INSClaimSubmissionMultipleDocument_DTO();
        const files = new Array<string>();
        this.uploadedDocuments.forEach(doc => {
          files.push(doc.BinaryData);
        });
        documentPayload.file = files;
        documentPayload.name = `${this.claimDetail.PatientName}_${this.claimDetail.PatientId}`
        documentPayload.PatientId = this.claimDetail.PatientId;
        documentPayload.claim_id = this.claimDetail.ClaimCode;
        this.UploadMultipleClaimFile(documentPayload);
      }
    }
    else {
      this.messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, ['No Files to Upload']);
    }
  }

  UploadSingleClaimFile(claimUploadSingleFileUploadRequest: INSClaimSubmissionSingleDocument_DTO) {
    this.loading = true;
    this.claimManagementBlService.UploadSingleClaimFile(claimUploadSingleFileUploadRequest)
      .finally(() => {
        this.loading = false;
      })
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
          this.IsClaimReadyForPayment = true;
          this.messageBoxService.showMessage(ENUM_MessageBox_Status.Success, ['Claim Document Submitted Successfully']);
        }
        else {
          this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ['Failed to submit claim documents.<br>' + res.Results.data]);
        }
      },
        err => {
          this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ['Failed to submit claim documents.<br>' + err]);
        });
  }
  UploadMultipleClaimFile(claimUploadMultipleFileUploadRequest: INSClaimSubmissionMultipleDocument_DTO) {
    this.loading = true;
    this.claimManagementBlService.UploadMultipleClaimFile(claimUploadMultipleFileUploadRequest)
      .finally(() => {
        this.loading = false;
      })
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
          this.IsClaimReadyForPayment = true;
          this.messageBoxService.showMessage(ENUM_MessageBox_Status.Success, ['Claim Document Submitted Successfully']);
        }
        else {
          this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ['Failed to submit claim documents. <br>' + res.Results.data]);
        }
      },
        err => {
          this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ['Failed to submit claim documents. <br>' + err]);
        });
  }
  SetClaimReadyForPayment() {
    this.loading = true;
    if (this.claimForSubmission && this.claimForSubmission.claim) {
      this.claimManagementBlService.PrepareClaimPayment(this.claimForSubmission.claim)
        .finally(() => { this.loading = false; })
        .subscribe((res: DanpheHTTPResponse) => {
          if (res.Status === ENUM_DanpheHTTPResponseText.OK && res.Results) {
            this.messageBoxService.showMessage(ENUM_MessageBox_Status.Success, [`Claim Ready For Payment.Please Go For Payment`]);
            this.CloseClaimScrubbingPopUp();
          }
          else {
            this.messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Claim Not Ready For Payment`]);
          }
        },
          (err: DanpheHTTPResponse) => {
            this.messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Exception: ${err.ErrorMessage}`]);
          }
        );
    }
    else {
      this.messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`No Claim Found for Submit`]);
    }
  }

  public GetClaimWiseReportData(ClaimCode: number): void {
    this.claimManagementBlService.GetClaimCodeWiseReportData(ClaimCode)
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
          if (res.Results) {
            this.claimWiseReportData = res.Results;
          }
        }
      })
  }
  OpenReportDetailPage(report: ClaimCodeWiseReport_DTO): void {
    if (report.ReportOf.toUpperCase() == ENUM_IntegrationNames.Radiology) {
      this.requisitionId = Number(report.RequisitionId);
      this.showImagingReport = true;
      this.IsCustomizeFields = false;
      this.RadiologyReportFromClaimScrubbing = true
    }
    if (report.ReportOf.toUpperCase() == ENUM_IntegrationNames.LAB) {
      this.showLabReportPopup = true;
      this.ShowPrintButton = false;
      this.LabReport(report);
    }
    if (report.ReportOf == ENUM_ClaimExtensionUrl.DischargeSummary) {
      this.showSummaryView = true;
      this.showDischargeSummaryViewPopup = true;
      this.selectedDischarge = {};
      if (this.selectedDischarge) {
        this.selectedDischarge.Name = this.claimDetail.PatientName;
        this.selectedDischarge.PatientVisitId = this.claimDetail.PatientVisitId;
        this.selectedDischarge.IsSubmitted = this.claimDetail.IsSubmitted;
        this.selectedDischarge.AdmittedDate = this.claimDetail.AdmissionDate;
        this.selectedDischarge.DischargedDate = this.claimDetail.DischargeDate;
        this.selectedDischarge.Age = this.claimDetail.Age;
        this.selectedDischarge.Gender = this.claimDetail.Gender;
        this.selectedDischarge.Address = this.claimDetail.Address;
        this.selectedDischarge.Department = this.claimDetail.DepartmentName;
        this.selectedDischarge.PhoneNumber = this.claimDetail.PhoneNumber;
        this.selectedDischarge.VisitCode = this.claimDetail.VisitCode;
        this.selectedDischarge.PatientCode = this.claimDetail.HospitalNo;
        this.selectedDischarge.Ward = this.claimDetail.Ward;
        this.selectedDischarge.BedNumber = this.claimDetail.BedNumber;
      }
    }
  }
  async GenerateDocForReport(report: ClaimCodeWiseReport_DTO): Promise<Promise<Promise<void>>> {
    const { ReportOf, ReportName } = report;
    switch (ReportOf.toUpperCase()) {
      case ENUM_IntegrationNames.Radiology:
        this.requisitionId = Number(report.RequisitionId);
        this.RenderRadiologyView();
        this.IsCustomizeFields = true;
        this.RadiologyReportFromClaimScrubbing = true
        this.RadiologyReportName = ReportName;
        report.IsDocGenerated = true;
        break;

      case ENUM_IntegrationNames.LAB:
        this.requisitionIdList = [];
        this.requisitionIdList = report.RequisitionId.split(",").map(Number);
        this.ShowPrintButton = true;
        this.LabReport(report);
        this.RenderLabView();
        this.LabReportName = ReportName;
        report.IsDocGenerated = true;
        break;

      case ENUM_ClaimExtensionUrl.DischargeSummary.toUpperCase():
        this.showSummaryView = true;
        this.selectedDischarge = {};
        if (this.selectedDischarge) {
          this.selectedDischarge.Name = this.claimDetail.PatientName;
          this.selectedDischarge.PatientVisitId = this.claimDetail.PatientVisitId;
          this.selectedDischarge.IsSubmitted = this.claimDetail.IsSubmitted;
          this.selectedDischarge.AdmittedDate = this.claimDetail.AdmissionDate;
          this.selectedDischarge.DischargedDate = this.claimDetail.DischargeDate;
          this.selectedDischarge.Age = this.claimDetail.Age;
          this.selectedDischarge.Gender = this.claimDetail.Gender;
          this.selectedDischarge.Address = this.claimDetail.Address;
          this.selectedDischarge.Department = this.claimDetail.DepartmentName;
          this.selectedDischarge.PhoneNumber = this.claimDetail.PhoneNumber;
          this.selectedDischarge.VisitCode = this.claimDetail.VisitCode;
          this.selectedDischarge.PatientCode = this.claimDetail.HospitalNo;
          this.selectedDischarge.Ward = this.claimDetail.Ward;
          this.selectedDischarge.BedNumber = this.claimDetail.BedNumber;
        }
        this.DischargeReportName = ReportName;
        this.RenderDischargeView();
        report.IsDocGenerated = true;
        break;
      default:
        break;
    }
  }
  RenderLabView() {
    this.IsLabReportView = true;
  }
  RenderRadiologyView() {
    this.IsRadiologyReportView = true;
    this.IsCustomizeFields = true;
  }
  RenderDischargeView() {
    this.IsDischargeSummaryReportView = true;
  }
  async RenderRadiologyReportView(id, reportName) {
    await new Promise(resolve => setTimeout(resolve));
    this.combinedPdf = [];
    this.GenerateReportPDF(id, reportName);
    this.IsRadiologyReportView = false;
  }
  async RenderDischargeSummaryReportView(id, reportName) {
    await new Promise(resolve => setTimeout(resolve));
    this.combinedPdf = [];
    this.GenerateReportPDF(id, reportName);
    this.IsDischargeSummaryReportView = false;
  }
  async RenderLabReportView(id, reportName) {
    await new Promise(resolve => setTimeout(resolve));
    this.combinedPdf = [];
    this.GenerateReportPDF(id, reportName);
    this.IsLabReportView = false;
  }
  GetBackOnClose($event) {
    if ($event.Submit) {
      this.showImagingReport = false;
      this.requisitionId = null;
    }
  }
  public LabReport(report: ClaimCodeWiseReport_DTO) {
    // this.AssignPatientDetail();
    this.showLabReport = true;
    this.requisitionIdList = [];
    this.requisitionIdList = report.RequisitionId.split(",").map(Number);
    this.printReportFromGrid = false;
    this.verificationRequired = false;
    this.showGrid = false;
    this.showAddEditResult = false;
    this.showReport = true;
    this.enableResultEdit = false;
    this.showHeader = true;
  }

  AssignPatientDetail() {
    this.patientService.getGlobal().PatientId = this.claimDetail.PatientId;
    this.patientService.getGlobal().ShortName = this.claimDetail.PatientName;
    this.patientService.getGlobal().PatientCode = this.claimDetail.HospitalNo;
  }
  CloseReportPopUp() {
    this.showLabReport = false;
    this.showSummaryView = false;
    this.showLabReportPopup = false;
    this.showDischargeSummaryViewPopup = false;
  }

  async GenerateInvoicePDF(Id: string, ReportName: string, mergedPdf: jsPDF) {
    const dom = document.getElementById(Id);
    if (!dom) return;

    // Save original styles
    const originalStyles = {
      width: dom.style.width,
      border: dom.style.border,
      position: dom.style.position,
      top: dom.style.top,
      left: dom.style.left
    };

    // Set optimal styles for PDF generation
    dom.style.border = 'none';
    dom.style.width = '1020px';
    dom.style.position = 'fixed';  // Prevent scrolling issues
    dom.style.top = '0';
    dom.style.left = '0';

    // PDF configuration
    const pdfOptions: PdfGenerationOptions = {
      pageSize: 'a4',
      orientation: 'p',
      unit: 'in',
      format: [8.5, 11]
    };

    // Canvas configuration with viewport adjustment
    const canvasOptions = {
      useCORS: true,
      allowTaint: true,
      scrollY: 0,
      scale: 2,
      windowWidth: 1020,
      height: undefined,
      x: 0,
      y: 0,
      scrollX: 0,
      logging: false,
      removeContainer: true,
      foreignObjectRendering: false
    };

    html2canvas(dom, canvasOptions).then(async (canvas) => {
      try {
        // Get the actual content bounds
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Find the actual content boundaries by scanning the canvas
        const pixelData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        let firstContentY = this.findFirstContentPixel(pixelData, canvas.width, canvas.height);

        // Create trimmed canvas
        const trimmedCanvas = document.createElement('canvas');
        const trimmedCtx = trimmedCanvas.getContext('2d');
        if (!trimmedCtx) return;

        // Set dimensions for trimmed canvas
        trimmedCanvas.width = canvas.width;
        trimmedCanvas.height = canvas.height - firstContentY;

        // Copy only the content part to the new canvas
        trimmedCtx.drawImage(
          canvas,
          0, firstContentY,  // Source coordinates
          canvas.width, canvas.height - firstContentY,  // Source dimensions
          0, 0,  // Destination coordinates
          canvas.width, canvas.height - firstContentY   // Destination dimensions
        );

        // Calculate PDF dimensions
        const margin = 0.5;
        const pageWidth = pdfOptions.format[0];
        const pageHeight = pdfOptions.format[1];
        const contentWidth = pageWidth - (2 * margin);
        const scale = contentWidth / (trimmedCanvas.width / 72);
        const scaledHeight = (trimmedCanvas.height * scale) / 72;

        // Create PDF
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'in',
          format: 'a4'
        });

        // Add image to PDF without the white space
        pdf.addImage(
          trimmedCanvas.toDataURL('image/jpeg', 1.0),
          'JPEG',
          margin,
          margin,
          contentWidth,
          scaledHeight
        );

        // Add to combined PDF array
        const pdfBlob = pdf.output('blob');
        this.combinedPdf.push(pdfBlob);

        // Check if all invoices are processed
        let PharmacyInvoiceLength = this.PharmacyInvoicesList.filter(p => p.IsPharmacySelected === true).length;
        let BillingInvoiceLength = this.BillingInvoicesList.filter(p => p.IsBillingSelected === true).length;

        if ((this.combinedPdf.length === PharmacyInvoiceLength) || (this.combinedPdf.length === BillingInvoiceLength)) {
          await this.MergeInvoicesPDFDocuments(ReportName);
        }

      } finally {
        // Restore original styles
        dom.style.width = originalStyles.width;
        dom.style.border = originalStyles.border;
        dom.style.position = originalStyles.position;
        dom.style.top = originalStyles.top;
        dom.style.left = originalStyles.left;
      }
    });
  }
  // Helper function to find the first non-white pixel
  findFirstContentPixel(pixelData: Uint8ClampedArray, width: number, height: number): number {
    const isWhitePixel = (index: number): boolean => {
      return pixelData[index] === 255 &&
        pixelData[index + 1] === 255 &&
        pixelData[index + 2] === 255 &&
        pixelData[index + 3] === 255;
    };

    // Scan the canvas from top to bottom
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = (y * width + x) * 4;
        if (!isWhitePixel(index)) {
          // Add small offset to avoid cutting too close
          return Math.max(0, y - 10);
        }
      }
    }
    return 0;
  }
  OnLabDataReceived($event) {
    if ($event.IsDataReceived) {
      this.RenderLabReportView("id_lab_report_view", this.LabReportName);
    }
  }
  OnImgingDataReceived($event) {
    if ($event.IsDataReceived) {
      this.RenderRadiologyReportView("id_imaging_report_view", this.RadiologyReportName);
    }
  }
  OnDischargeSummaryDataReceived($event) {
    if ($event.IsDataReceived) {
      this.RenderDischargeSummaryReportView("id_discharge_summary_printpage", this.DischargeReportName);
    }
  }
  onChangeDiagnosisSelection($event) {
    this.SelectedDiagnosisList = $event;
  }

  GetDiagnosis() {
    this.claimManagementBlService.GetDiagnosis().subscribe((res: DanpheHTTPResponse) => {
      if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
        this.DiagnosisList = res.Results;
      }
    });
  }
  ICDCodeFormatter(data: any): string {
    return (`${data["ICDCode"]}(${data["ICDDescription"]})`);
  }
  RemoveSelectedICDCode(index: number): void {
    this.SelectedDiagnosisList.splice(index, 1);
    this.claimSubmitRequest.diagnosis.splice(index, 1);
  }

  OnDiagnosisSelect() {
    // Check if ICDCode is selected
    if (this.SelectedICDCode && this.SelectedICDCode.ICDCode) {
      // Check if the ICDCode is already selected
      const icdCodeAlreadySelected = this.SelectedDiagnosisList.find(a => a.ICDCode === this.SelectedICDCode.ICDCode);

      if (icdCodeAlreadySelected) {
        this.SelectedICDCode = null;
        this.messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, ['ICD Code Already Selected']);
        return;
      }

      // Add the selected ICDCode to the list
      this.SelectedDiagnosisList.push(this.SelectedICDCode);

      // Initialize an empty array for diagnosis
      const diagnosisArray: Diagnosis[] = [];

      // Check if SelectedDiagnosisList has items
      if (this.SelectedDiagnosisList.length > 0) {
        this.claimSubmitRequest.diagnosis = [];

        // Iterate over the SelectedDiagnosisList to build the diagnosis array
        this.SelectedDiagnosisList.forEach((diag, index) => {
          const diagnosis = new Diagnosis();
          // diagnosis.sequence = index + 1;
          diagnosis.sequence = 1; //According new docs sequence is always 1

          const claimDiagnosisCodeAbleConcept = new DiagnosisCodeableConcept();
          const claimCoding = new Coding();
          claimCoding.code = diag.ICDCode;
          claimDiagnosisCodeAbleConcept.coding = [claimCoding]; // Ensure `coding` is an array

          diagnosis.diagnosisCodeableConcept = claimDiagnosisCodeAbleConcept;

          const type = new ClaimType();
          type.text = index === 0 ? ENUM_ICDCoding.ICD10 : ENUM_ICDCoding.ICD11; //First diagnosis must be icd10 and other will be icd11
          diagnosis.type = [type]; // Ensure `type` is an array

          diagnosisArray.push(diagnosis);
        });
      }

      // Assign the built diagnosis array to claimSubmitRequest
      this.claimSubmitRequest.diagnosis = diagnosisArray;

      // Reset SelectedICDCode
      this.SelectedICDCode = null; // Or set it to a new Diagnosis_DTO() if that is necessary
    }
  }


  OnEnteringNMCNumber() {
    if (this.NMCNumber && this.NMCNumber.trim()) {
      this.claimSubmitRequest.nmc = this.NMCNumber;
    }
  }
  GetDoctorListWithNMCNo() {
    this.claimManagementBlService.GetDoctorListWithNMCNo().subscribe((res: DanpheHTTPResponse) => {
      if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
        this.DoctorsNMCNoList = res.Results;
        if (this.DoctorsNMCNoList && this.DoctorsNMCNoList.length) {
          const doctors = this.DoctorsNMCNoList.filter(n => n.DoctorName == this.claimDetail.ConsultingDoctor);
          if (doctors && doctors.length) {
            this.SelectedNMCNo = doctors[0];
          }
        }
      }
    });
  }
  NMCNoListFormatter(data: any): string {
    return (`${data["DoctorName"]}(${data["NMCNo"]})`);
  }
  OnNMCNoSelect() {
    if (this.SelectedNMCNo && this.SelectedNMCNo.NMCNo) {
      let icdCodeAlreadySelected = this.SelectedNMCNoList.find(a => a.NMCNo === this.SelectedNMCNo.NMCNo);
      if (icdCodeAlreadySelected) {
        this.SelectedNMCNo = null;
        this.messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, ['NMC No Already Selected']);
        return;
      }
      this.SelectedNMCNoList.push(this.SelectedNMCNo);
      this.SelectedNMCNo = new DoctorNMCNo_DTO();
    }
  }
  RemoveSelectedNMCNO(index: number): void {
    this.SelectedNMCNoList.splice(index, 1);
  }

  AddExplanation() {
    if (!this.ExplanationContent.trim()) {
      this.messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, ['Input some explanation details.']);
      return;
    }
    let isExplanationAlreadyExists = this.ExplanationContents.find(explanation => explanation === this.ExplanationContent.trim());
    if (isExplanationAlreadyExists) {
      this.messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, ['This explanation is already added.']);
      return;
    }
    this.ExplanationContents.push(this.ExplanationContent);
    this.ExplanationContent = '';
  }

  RemoveExplanation(index: number): void {
    this.ExplanationContents.splice(index, 1);
  }
  async GenerateCombinePharmacyDocument() {
    let IsDocumentGenerated: boolean = false;
    this.PharmacyInvoicesList.forEach(p => {
      if (p.IsPharmacySelected) {
        if (p.IsDocumentGenerated) {
          IsDocumentGenerated = true;
          return true;
        }
      }
      return false;
    });
    if (IsDocumentGenerated) {
      this.messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, ['Document Already Generated For the selected Invoice']);
      return;
    }
    const mergedPdf = new jsPDF('p', 'in', 'a4');
    this.combinedPdf = [];
    this.PharmacyInvoiceListForDocument = this.PharmacyInvoicesList.filter(p => p.IsPharmacySelected === true);
    for (const bill of this.PharmacyInvoiceListForDocument) {
      await this.GenerateDocument(bill, mergedPdf);
    }
    if (this.PharmacyInvoicesList.every(c => c.IsPharmacySelected === true)) {
      this.IsAllPharmacyDocumentGenerated = true;
    }
    this.PharmacyInvoicesList.forEach(p => {
      if (p.IsPharmacySelected) {
        p.IsDocumentGenerated = true;
      }
    });
  }
  async GenerateCombineBillingDocument() {
    let IsDocumentGenerated: boolean = false;
    this.BillingInvoicesList.forEach(p => {
      if (p.IsBillingSelected) {
        if (p.IsDocumentGenerated) {
          IsDocumentGenerated = true;
          return true;
        }
      }
      return false;
    });
    if (IsDocumentGenerated) {
      this.messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, ['Document Already Generated For the selected Invoice']);
      return;
    }

    const mergedPdf = new jsPDF('p', 'in', 'a4');
    this.combinedPdf = [];
    this.BillingInvoiceListForDocument = this.BillingInvoicesList.filter(p => p.IsBillingSelected === true);
    for (const bill of this.BillingInvoiceListForDocument) {
      await this.GenerateDocument(bill, mergedPdf);
    }
    if (this.BillingInvoicesList.every(c => c.IsBillingSelected === true)) {
      this.IsAllBillingDocumentGenerated = true;
    }
    this.BillingInvoicesList.forEach(p => {
      if (p.IsBillingSelected) {
        p.IsDocumentGenerated = true;
      }
    });
  }
  HandlePharmacyMainLevelCheckBox($event) {
    if ($event) {
      if (this.PharmacyInvoicesList.every(c => c.IsPharmacySelected === true)) {
        this.SelectAllPharmacyInvoices = true;
      }
      else {
        this.SelectAllPharmacyInvoices = false;
      }
      if (this.PharmacyInvoicesList.some(c => c.IsPharmacySelected === true)) {
        this.ShowPharmacyGenerateDocumentButton = true;
      }
      else {
        this.ShowPharmacyGenerateDocumentButton = false;
      }
    }
  }
  HandleBillingMainLevelCheckBox($event) {
    if ($event) {
      if (this.BillingInvoicesList.every(c => c.IsBillingSelected === true)) {
        this.SelectAllBillingInvoices = true;
      }
      else {
        this.SelectAllBillingInvoices = false;
      }
      if (this.BillingInvoicesList.some(c => c.IsBillingSelected === true)) {
        this.ShowBillingGenerateDocumentButton = true;
      }
      else {
        this.ShowBillingGenerateDocumentButton = false;
      }
    }
  }
  HandleBillWisePharmacyCheckBox($event) {
    if ($event) {
      if (this.SelectAllPharmacyInvoices) {
        this.PharmacyInvoicesList.map(p => {
          p.IsPharmacySelected = true;
        });
      }
      else {
        this.PharmacyInvoicesList.map(p => {
          p.IsPharmacySelected = false;
        });
      }
      if (this.PharmacyInvoicesList.some(c => c.IsPharmacySelected === true)) {
        this.ShowPharmacyGenerateDocumentButton = true;
      }
      else {
        this.ShowPharmacyGenerateDocumentButton = false;
      }
    }
  }
  HandleBillWiseBillingCheckBox($event) {
    if ($event) {
      if (this.SelectAllBillingInvoices) {
        this.BillingInvoicesList.map(p => {
          p.IsBillingSelected = true;
        });
      }
      else {
        this.BillingInvoicesList.map(p => {
          p.IsBillingSelected = false;
        });
      }
      if (this.BillingInvoicesList.some(c => c.IsBillingSelected === true)) {
        this.ShowBillingGenerateDocumentButton = true;
      }
      else {
        this.ShowBillingGenerateDocumentButton = false;
      }
    }
  }
  GenerateReportPDF(Id: string, ReportName: string) {
    const dom = document.getElementById(Id);
    if (!dom) return;

    // Save original styles
    const originalStyles = {
      width: dom.style.width,
      border: dom.style.border,
      position: dom.style.position,
      top: dom.style.top,
      left: dom.style.left
    };

    // Set optimal styles for PDF generation
    dom.style.border = 'none';
    dom.style.width = '1020px';
    dom.style.position = 'fixed';  // Prevent scrolling issues
    dom.style.top = '0';
    dom.style.left = '0';

    // PDF configuration
    const pdfOptions: PdfGenerationOptions = {
      pageSize: 'a4',
      orientation: 'p',
      unit: 'in',
      format: [8.5, 11]
    };

    // Canvas configuration with viewport adjustment
    const canvasOptions = {
      useCORS: true,
      allowTaint: true,
      scrollY: 0,
      scale: 2,
      windowWidth: 1020,
      height: undefined,
      x: 0,
      y: 0,
      scrollX: 0,
      logging: false,
      removeContainer: true,
      foreignObjectRendering: false
    };

    html2canvas(dom, canvasOptions).then(async (canvas) => {
      try {
        // Get the actual content bounds
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Find the actual content boundaries by scanning the canvas
        const pixelData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        let firstContentY = this.findFirstContentPixel(pixelData, canvas.width, canvas.height);

        // Create trimmed canvas
        const trimmedCanvas = document.createElement('canvas');
        const trimmedCtx = trimmedCanvas.getContext('2d');
        if (!trimmedCtx) return;

        // Set dimensions for trimmed canvas
        trimmedCanvas.width = canvas.width;
        trimmedCanvas.height = canvas.height - firstContentY;

        // Copy only the content part to the new canvas
        trimmedCtx.drawImage(
          canvas,
          0, firstContentY,  // Source coordinates
          canvas.width, canvas.height - firstContentY,  // Source dimensions
          0, 0,  // Destination coordinates
          canvas.width, canvas.height - firstContentY   // Destination dimensions
        );

        // Calculate PDF dimensions
        const margin = 0.5;
        const pageWidth = pdfOptions.format[0];
        const pageHeight = pdfOptions.format[1];
        const contentWidth = pageWidth - (2 * margin);
        const scale = contentWidth / (trimmedCanvas.width / 72);
        const scaledHeight = (trimmedCanvas.height * scale) / 72;

        // Create PDF
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'in',
          format: 'a4'
        });

        // Add image to PDF without the white space
        pdf.addImage(
          trimmedCanvas.toDataURL('image/jpeg', 1.0),
          'JPEG',
          margin,
          margin,
          contentWidth,
          scaledHeight
        );

        // Add to combined PDF array
        let pdfFileCreatedBySystem = pdf.output('blob');
        this.combinedPdf.push(pdfFileCreatedBySystem);

        await this.MergeReportPDFDocuments(pdfFileCreatedBySystem, ReportName);

      } finally {
        // Restore original styles
        dom.style.width = originalStyles.width;
        dom.style.border = originalStyles.border;
        dom.style.position = originalStyles.position;
        dom.style.top = originalStyles.top;
        dom.style.left = originalStyles.left;
      }
    });
  }
  private async MergeReportPDFDocuments(pdfBlob, FileName: string) {
    let uploadFiles: UploadedFile = new UploadedFile();
    const mergedPdf = await PDFDocument.create();
    const fileName = `${FileName}.pdf`;
    const pdfBytes = await this.readBlobAsArrayBuffer(pdfBlob);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));

    const mergedPdfBytes = await mergedPdf.save();
    const mergedBlob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
    const mergedFile = new File([mergedBlob], fileName, { type: 'application/pdf' });
    this.files.push(mergedFile);
    uploadFiles.FileDisplayName = fileName;
    uploadFiles.FileName = FileName;
    uploadFiles.Size = mergedBlob.size;
    uploadFiles.FileExtension = mergedBlob.type;
    uploadFiles.UploadedOn = moment().format(ENUM_DateTimeFormat.Year_Month_Day);
    uploadFiles.FileUploadedBy = this._securityService.loggedInUser.UserName;
    const reader = new FileReader();
    reader.readAsDataURL(mergedFile);
    reader.onload = () => {
      const tempFile = reader.result.toString();
      const indx = tempFile.indexOf(',');
      const binaryString = tempFile.substring(indx + 1);
      uploadFiles.BinaryData = binaryString;
    }
    this.uploadedDocuments.push(uploadFiles);
  }
}

export class ClaimCodeWiseReport_DTO {
  ReportOf: string = '';
  ReportName: string = '';
  ReportCreatedDate: string = '';
  RequisitionId: string = '';
  IsDocGenerated: boolean = false;
}

interface PdfGenerationOptions {
  pageSize: 'a4';
  orientation: 'p' | 'l';
  unit: 'in' | 'mm';
  format: [number, number];
}
