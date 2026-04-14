import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { Patient } from '../../patients/shared/patient.model';
import { PharmacyBLService } from '../../pharmacy/shared/pharmacy.bl.service';
import { DanpheHTTPResponse } from '../../shared/common-models';
import { MessageboxService } from '../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponseText, ENUM_MessageBox_Status, ENUM_Scheme_ApiIntegrationNames } from '../../shared/shared-enums';
import { ClaimBillReviewDTO } from '../shared/DTOs/ClaimManagement_BillReview_DTO';
import { ClaimManagementBLService } from '../shared/claim-management.bl.service';
import { ClaimManagementService } from '../shared/claim-management.service';

@Component({
  selector: 'ins-bill-list',
  templateUrl: './ins-bill-list.component.html',
  host: { '(window:keyup)': 'hotkeys($event)' },
})

export class InsuranceBillListComponent implements OnInit {
  FromDate: string = "";
  ToDate: string = "";
  CreditOrganizationId: number = 0;
  BillReviewListFiltered = new Array<ClaimBillReviewDTO>();
  BillReviewListAll = new Array<ClaimBillReviewDTO>();
  BillListForClaimCodeAssignment = new Array<ClaimBillReviewDTO>();
  BillForClaimScrubbing = new Array<ClaimBillReviewDTO>();
  loading: boolean = false;
  SearchString: string = null;
  Page: number = 1;
  IsSomeNonClaimableInvoice: boolean = false;
  ShowSendToClaimScrubbing: boolean = false;
  ShowNonClaimableInvoice: boolean = false;
  ShowSetClaimCodePopUp: boolean = false;
  ShowBillPreviewPopUp: boolean = false;
  IsSomeClaimableInvoice: boolean = false;
  SelectAll: boolean = false;
  NewClaimCode: number = 0;
  IsClaimCodeValid: boolean = false;
  ShowBillPreviewPage: boolean = false;
  SelectedBill = new ClaimBillReviewDTO;
  confirmationTitle: string = "Confirm !";
  confirmationMessageForClaimScrubbing: string = "Are you sure you want to send selected invoices for Claim Scrubbing?";
  confirmationMessageForSetClaimable: string = "Are you sure you want to set selected invoices Claimable?";
  confirmationMessageForSetNonClaimable: string = "Are you sure you want to set selected invoices Non-Claimable?";
  VisitType: string = '';
  BillReviewFilteredOriginalList = new Array<ClaimBillReviewDTO>();
  SearchProperty: string = 'MemberNo';
  public SelectedPatient: Patient = null;
  patientId: number = null;
  ShowDocumentReceivePopUp: boolean = false;
  IsDocumentReceived: boolean = false;
  Remarks: string = '';
  VisitTypes = [
    { value: '', label: 'All' },
    { value: 'inpatient', label: 'InPatient' },
    { value: 'outpatient', label: 'OutPatient' },
    { value: 'emergency', label: 'Emergency' }]
  CurrentApiIntegrationName: string = '';
  IsBillsSelected: boolean = false;
  DocumentSatus = [
    { value: '', label: 'All' },
    { value: 'Received', label: 'Received' },
    { value: 'Not Received', label: 'Not Received' }
  ]
  SelectedDocumentStatus: string = '';
  constructor(
    private _claimManagementBLService: ClaimManagementBLService,
    private _messageBoxService: MessageboxService,
    public _claimManagementService: ClaimManagementService,
    private _router: Router,
    private _changeDetector: ChangeDetectorRef,
    public pharmacyBLService: PharmacyBLService
  ) {
    let activeCreditOrganization = _claimManagementService.getActiveInsuranceProvider();
    if (activeCreditOrganization) {
      this.CreditOrganizationId = activeCreditOrganization.OrganizationId;
    }
    else {
      this._router.navigate(["/ClaimManagement/SelectInsuranceProvider"])
    }
    this.CurrentApiIntegrationName = _claimManagementService.CurrentApiIntegrationName;
  }

  ngOnInit(): void {
  }

  hotkeys(event): void {
    if (event.keyCode === 27) {
      if (this.ShowSetClaimCodePopUp) {
        this.CloseSetClaimCodePopUp();
      }
    }
  }

  GetBillReviewList(): void {
    this.BillReviewListFiltered = new Array<ClaimBillReviewDTO>();
    this.loading = true;
    this._claimManagementBLService.GetBillReviewList(this.FromDate, this.ToDate, this.CreditOrganizationId, this.patientId)
      .finally(() => { this.loading = false; })
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
          if (res.Results && res.Results.length) {
            this.BillReviewListFiltered = this.BillReviewListAll = res.Results;
            if (!this.ShowNonClaimableInvoice) {
              this.BillReviewListFiltered = this.BillReviewListAll.filter(a => a.IsClaimable);
            }
            if (this.SelectAll) {
              this.BillReviewListFiltered.filter(a => a.IsClaimable).forEach(bil => { bil.IsSelected = true });
              this.IsBillsSelected = true;
            }
            if (this.VisitType.trim()) {
              this.BillReviewListFiltered = this.BillReviewListAll.filter(v => v.VisitType == this.VisitType);
            }
            if (this.SelectedDocumentStatus.trim()) {
              this.BillReviewListFiltered = this.BillReviewListAll.filter(v => v.DocumentStatus == this.SelectedDocumentStatus);
            }
            this.BillReviewFilteredOriginalList = this.BillReviewListFiltered;
          }
          else {
            this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`No Data Available In Given Date Range.`]);
          }
        }
      },
        (err: DanpheHTTPResponse) => {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Error : ${err.ErrorMessage}`]);
        })
  }

  OnFromToDateChange($event): void {
    if ($event) {
      this.FromDate = $event.fromDate;
      this.ToDate = $event.toDate;
    }
  }

  CheckValidationForClaimScrubbing(): void {
    let selectedItems = this.BillReviewListFiltered.filter(a => a.IsClaimable && a.IsSelected);
    if (selectedItems && selectedItems.length) {
      let item = selectedItems.find(a => a.IsSelected);
      if (selectedItems.every(a => (a.IsSelected && a.PatientId === item.PatientId && a.SchemeId === item.SchemeId && a.MemberNo === item.MemberNo && a.ClaimCode === item.ClaimCode))) {
        const patientVisitId = selectedItems[0].PatientVisitId;
        const creditOrganizationId = selectedItems[0].CreditOrganizationId;
        const patientId = selectedItems[0].PatientId;
        this._claimManagementBLService.CheckClaimCode(item.ClaimCode, patientVisitId, creditOrganizationId, this.CurrentApiIntegrationName, patientId)
          .subscribe((res: DanpheHTTPResponse) => {
            if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
              if (res.Results) {
                this.BillForClaimScrubbing = selectedItems;
                this.SendClaimScrubbing();
              }
              else {
                this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`Claim Code already assigned to a visit. Cannot assign same claim code for multiple visits.`])
                this.loading = false;
              }
            }
          });
      }
      else {
        this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`PatientName, SchemeName, MemberNo and ClaimCode should be same for the selected invoices in order to send it for claim scrubbing.`]);
        this.loading = false;
      }
    }
    else {
      this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`Please select at least one Claimable invoice from the list.`])
      this.loading = false;;
    }
  }

  SendClaimScrubbing(): void {
    if (this.BillForClaimScrubbing.length) {
      this._claimManagementBLService.SendBillForClaimScrubbing(this.BillForClaimScrubbing)
        .finally(() => {
          this.BillForClaimScrubbing = [];
          this.GetBillReviewList();
        })
        .subscribe((res: DanpheHTTPResponse) => {
          if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
            this._messageBoxService.showMessage(ENUM_MessageBox_Status.Success, [`Invoices successfully send for claim scrubbing.`]);
          }
          else {
            this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Unable to send invoices for claim scrubbing.`]);
          }
        },
          (err: DanpheHTTPResponse) => {
            this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Exception: ${err.ErrorMessage}`]);
          });
    }
  }

  OpenSetClaimCodePopUp(): void {
    let selectedItems = this.BillReviewListFiltered.filter(a => a.IsClaimable && a.IsSelected);
    if (selectedItems && selectedItems.length) {
      const hasSamePatientVisitId = selectedItems.every((item, _, array) => item.PatientVisitId === array[0].PatientVisitId && item.PatientId === array[0].PatientId);
      //! ECHS bills are excluded because same Claim Code can be set for multiple visit.
      if (!hasSamePatientVisitId && this.CurrentApiIntegrationName !== ENUM_Scheme_ApiIntegrationNames.ECHS) {
        this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`Can't set claim code for invoices of different visits.`]);
        return;
      }
      let item = selectedItems.find(a => a.IsSelected);
      if (selectedItems.every(a => (a.IsSelected && a.PatientId === item.PatientId && a.SchemeId === item.SchemeId))) {
        this.BillListForClaimCodeAssignment = selectedItems;
        this.ShowSetClaimCodePopUp = true;
      }
      else {
        this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`PatientName and SchemeName should be same for the selected invoices in order to assign claim code.`]);
      }
    }
    else {
      this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`Please select at least one Claimable invoice from the list.`]);
    }
  }

  CloseSetClaimCodePopUp(): void {
    this.ShowSetClaimCodePopUp = false;
    this.BillListForClaimCodeAssignment = [];
    this.NewClaimCode = 0;
    this.IsClaimCodeValid = false;
    this.BillReviewListFiltered.forEach(x => x.IsSelected = false);
    this.ShowHideMainlLevelButtonHideShow();
  }

  OpenShowBillPreviewPopUp(): void {
    this.ShowBillPreviewPopUp = true;
  }

  SetInvoiceNonClaimable(): void {
    const selectedBills = this.BillReviewListFiltered.filter(a => a.IsSelected);
    this._claimManagementBLService.UpdateClaimableStatus(selectedBills, false)
      .finally(() => {
        this.IsSomeNonClaimableInvoice = false;
        this.loading = false;
      })
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Success, [`Selected invoices is successfully set non-claimable.`]);
          this.GetBillReviewList();
        }
        else {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, [`Unable to update claimable status of the invoices.`]);
        }
      },
        (err: DanpheHTTPResponse) => {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, [`Exception ${err.ErrorMessage}`]);
        });
  }

  HandleShowNonClaimableInvoiceCheckbox(event): void {
    if (event && event.currentTarget.checked) {
      this.BillReviewListFiltered = this.BillReviewListAll.filter(a => !a.IsClaimable);
    }
    else {
      this.BillReviewListFiltered = this.BillReviewListAll.filter(a => a.IsClaimable);
    }
    if (this.VisitType.trim()) {
      this.BillReviewListFiltered = this.BillReviewListFiltered.filter(v => v.VisitType === this.VisitType);
    }
    this.BillReviewFilteredOriginalList = this.BillReviewListFiltered;
  }

  HandleBillWiseCheckBox(event): void {
    if (event && event.currentTarget.checked) {
      this.BillReviewListFiltered.forEach(bil => { bil.IsSelected = true });
      // this.searchString = "";
    }
    else {
      this.BillReviewListFiltered.forEach(bil => { bil.IsSelected = false });
    }
    this.ShowHideMainlLevelButtonHideShow();
  }

  HandleMainLevelCheckBox(event): void {
    if (event) {
      if (!event.currentTarget.checked) {
        this.SelectAll = false;
      }
      else {
        let allBillsChecked = this.BillReviewListFiltered.every(b => b.IsSelected);
        if (allBillsChecked) {
          this.SelectAll = true;
        }
      }
      this.ShowHideMainlLevelButtonHideShow();
    }
  }

  CheckClaimCode(): void {
    if (this.NewClaimCode > 0 && this.NewClaimCode.toString().length <= 14) {
      let patientVisitId = this.BillListForClaimCodeAssignment.length ? this.BillListForClaimCodeAssignment[0].PatientVisitId : 0;
      let creditOrganizationId = this.BillListForClaimCodeAssignment.length ? this.BillListForClaimCodeAssignment[0].CreditOrganizationId : 0;
      let patientId = this.BillListForClaimCodeAssignment.length ? this.BillListForClaimCodeAssignment[0].PatientId : 0;
      if (patientVisitId) {
        this._claimManagementBLService.CheckClaimCode(this.NewClaimCode, patientVisitId, creditOrganizationId, this.CurrentApiIntegrationName, patientId).subscribe((res: DanpheHTTPResponse) => {
          if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
            if (res.Results) {
              this.IsClaimCodeValid = true;
            }
            else {
              this.IsClaimCodeValid = false;
              this._messageBoxService.showMessage(ENUM_MessageBox_Status.Warning, [`This ClaimCode is already used.`]);
            }
          }
        },
          (err: DanpheHTTPResponse) => {
            this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, [`Exception : ${err.ErrorMessage}`]);
          });
      }
      else {
        this._messageBoxService.showMessage(ENUM_MessageBox_Status.Warning, [`New ClaimCode ${this.NewClaimCode} is not valid.`]);
      }
    }
    else {
      this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`Invalid Claim Code, It must be number greater than 0, upto max 14 digit, Please Check It.`]);
    }
  }

  ClaimCodeChange(): void {
    this.IsClaimCodeValid = false;
  }

  UpdateClaimCode(): void {
    if (this.IsClaimCodeValid && this.BillListForClaimCodeAssignment.length) {
      this._claimManagementBLService.UpdateClaimableCode(this.BillListForClaimCodeAssignment, this.NewClaimCode).subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Success, [`ClaimCode successfully updated.`]);
          this.CloseSetClaimCodePopUp();
          this.GetBillReviewList();
        }
        else {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, [`Exception: ${res.ErrorMessage}`]);
        }
      },
        (err: DanpheHTTPResponse) => {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Exception: ${err.ErrorMessage}`]);
        });
    }
  }

  SelectInvoice(event, bill: ClaimBillReviewDTO): void {
    if (event && event.srcElement.localName === "a") {
      return;
    }
    let index = this.BillReviewListFiltered.findIndex(a => a.CreditStatusId === bill.CreditStatusId && a.InvoiceRefId === bill.InvoiceRefId);
    if (index >= 0) {
      if (this.BillReviewListFiltered[index].IsSelected) {
        this.BillReviewListFiltered[index].IsSelected = false;
      }
      else {
        this.BillReviewListFiltered[index].IsSelected = true;
      }
      let allBillsChecked = this.BillReviewListFiltered.every(b => b.IsSelected);
      if (allBillsChecked) {
        this.SelectAll = true;
      }
      else {
        this.SelectAll = false;
      }
      this.ShowHideMainlLevelButtonHideShow();
    }
  }

  SetInvoiceClaimable(): void {
    const selectedBills = this.BillReviewListFiltered.filter(a => a.IsSelected);
    this._claimManagementBLService.UpdateClaimableStatus(selectedBills, true)
      .finally(() => {
        this.IsSomeClaimableInvoice = false;
        this.loading = false;
      })
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Success, [`Selected invoices is successfully set claimable.`]);
          this.GetBillReviewList();
        }
        else {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, [`Unable to update claimable status of the invoices.`]);
        }
      },
        (err: DanpheHTTPResponse) => {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, [`Exception ${err.ErrorMessage}`]);
        });
  }

  BillPreview(bill): void {
    this.ShowBillPreviewPage = true;
    this.SelectedBill = bill;
    this._changeDetector.detectChanges();
  }

  HideBillPreviewPage(data): void {
    if (data === true) {
      this.ShowBillPreviewPage = false;
      this.GetBillReviewList();
    }
  }

  HandleConfirmForSendForClaimScrubbing(): void {
    this.loading = true;
    this.CheckValidationForClaimScrubbing();
  }

  HandleCancelForSendForClaimScrubbing(): void {
    this.BillForClaimScrubbing = [];
    this.loading = false;
  }

  HandleConfirmForSetNonClaimable(): void {
    this.loading = true;
    if (this.BillReviewListFiltered.some(a => a.IsSelected)) {
      this.IsSomeNonClaimableInvoice = true;
    }
    else {
      this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`Please select at least one invoice from the list.`]);
      this.loading = false;
    }
    if (this.IsSomeNonClaimableInvoice) {
      this.SetInvoiceNonClaimable();
    }
  }

  HandleCancelForSetNonClaimable(): void {
  }

  HandleConfirmForSetClaimable(): void {
    this.loading = true;
    if (this.BillReviewListFiltered.some(a => a.IsSelected)) {
      this.IsSomeClaimableInvoice = true;
    }
    else {
      this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`Please select at least one invoice from the list.`]);
      this.loading = false;
    }
    if (this.IsSomeClaimableInvoice) {
      this.SetInvoiceClaimable();
    }
  }

  HandleCancelForSetClaimable(): void {
  }

  //!Nirmala: 11April'24
  /*
   Below method is responsible to handle the MainLevel Checkbox scenarios where it checks all the Listed Invoices even after
   filtering the list using search box. Now, When the list is filtered using search box we do not check all the searched items
   instead we unselect all the items and hide the main level check box from the UI and rerender it when search box is cleared.
   This solves a logical issue where all the items were being selected while sending to claim scrubbing.
  */

  HandleSearch(): void {
    if (this.BillReviewFilteredOriginalList && this.BillReviewFilteredOriginalList.length) {
      this.BillReviewFilteredOriginalList.map(b => b.IsSelected = false);
      this.SelectAll = false;
      if (!this.SearchString || (this.SearchString && !this.SearchString.trim())) {
        this.SelectAll = false;
        this.BillReviewListFiltered = this.BillReviewFilteredOriginalList;
      }
      else {
        const searchStringLower = this.SearchString.toLowerCase();
        this.BillReviewListFiltered = this.BillReviewFilteredOriginalList.filter(a =>
          a.HospitalNo.toLowerCase().includes(searchStringLower) ||
          a.InvoiceNo.toLowerCase().includes(searchStringLower) ||
          (a.ClaimCode !== null && a.ClaimCode !== undefined && a.ClaimCode.toString().includes(this.SearchString)) ||
          a.PatientName.toLowerCase().includes(searchStringLower)
        );
      }
    }
  }
  public AllPatientSearchAsync = (keyword: any): Observable<any[]> => {
    return this.pharmacyBLService.GetPatients(keyword, false);
  }
  OnPatientSelect() {
    if (this.SelectedPatient && this.SelectedPatient.PatientId) {
      this.patientId = this.SelectedPatient.PatientId;
    }
    else {
      this.patientId = null;
    }
    if (this.SelectedPatient && !this.SelectedPatient.PatientId) {
      this.SelectedPatient = null;
      this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, ['Please select a Patient from dropdown']);
    }
  }

  PatientListFormatterByPatientCode(data: any): string {
    let html = `[${data['PatientCode']}] | ${data["ShortName"]}`;
    return html;
  }

  PatientListFormatterByPatientName(data: any): string {
    let html = `[${data['PatientCode']}] | ${data["ShortName"]}`;
    return html;
  }
  PatientListFormatterByMemberNumber(data: any): string {
    let html = `${data["MemberNo"]} | ${data["ShortName"]}`;
    return html;
  }
  CloseDocumentReceivePopUp() {
    this.BillListForClaimCodeAssignment = [];
    this.Remarks = '';
    this.ShowDocumentReceivePopUp = false;
    this.BillReviewListFiltered.forEach(x => x.IsSelected = false);
    this.ShowHideMainlLevelButtonHideShow();
  }
  UpdateBillDocumentReceivedStatus(): void {
    if (this.BillListForClaimCodeAssignment.length) {
      this.BillListForClaimCodeAssignment.forEach(c => {
        if (this.IsDocumentReceived) {
          c.IsDocumentReceived = true;
          c.Remarks = this.Remarks;
        }
        else {
          c.IsDocumentReceived = false;
          c.Remarks = this.Remarks;
        }
      });
      this._claimManagementBLService.UpdateDocumentUpdateStatus(this.BillListForClaimCodeAssignment).subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Success, [`ClaimCode successfully updated.`]);
          this.CloseDocumentReceivePopUp();
          this.GetBillReviewList();
        }
      },
        (err: DanpheHTTPResponse) => {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Exception: ${err.ErrorMessage}`]);
        });
    }
  }
  OpenDocumentReceivedPopUp(): void {
    let selectedItems = this.BillReviewListFiltered.filter(a => a.IsClaimable && a.IsSelected);
    if (selectedItems && selectedItems.length) {
      let item = selectedItems.find(a => a.IsSelected);
      if (selectedItems.every(a => (a.IsSelected && a.PatientId === item.PatientId && a.SchemeId === item.SchemeId))) {
        this.BillListForClaimCodeAssignment = selectedItems;
        this.ShowDocumentReceivePopUp = true;
        this.Remarks = selectedItems[0].Remarks;
        this.IsDocumentReceived = true;
      }
      else {
        this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`PatientName and SchemeName should be same for the selected invoices.`]);
      }
    }
    else {
      this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`Please select at least one Claimable invoice from the list.`]);
    }
  }
  onDocumentReceiveStatusChange(receivedStatus: boolean) {
    this.IsDocumentReceived = receivedStatus;
  }
  ShowHideMainlLevelButtonHideShow() {
    this.IsBillsSelected = this.BillReviewListFiltered.some(b => b.IsSelected);
  }
}
