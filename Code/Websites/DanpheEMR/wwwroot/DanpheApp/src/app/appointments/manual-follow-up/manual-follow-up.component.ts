import { ChangeDetectorRef, Component, EventEmitter, Input, Output } from "@angular/core";
import * as _ from "lodash";
import * as moment from "moment";
import { BillingTransaction } from "../../billing/shared/billing-transaction.model";
import { RegistrationScheme_DTO } from "../../billing/shared/dto/registration-scheme.dto";
import { Patient } from "../../patients/shared/patient.model";
import { SecurityService } from "../../security/shared/security.service";
import { Department } from "../../settings-new/shared/department.model";
import { DanpheHTTPResponse } from "../../shared/common-models";
import { MessageboxService } from "../../shared/messagebox/messagebox.service";
import { ENUM_AppointmentType, ENUM_BillPaymentMode, ENUM_BillingType, ENUM_DanpheHTTPResponses, ENUM_DateTimeFormat, ENUM_InvoiceType, ENUM_MessageBox_Status, ENUM_OrderStatus, ENUM_ServiceBillingContext, ENUM_VisitType } from "../../shared/shared-enums";
import { GetPatientVisits_DTO } from "../shared/dto/patient-visit-list.dto";
import { QuickVisitVM } from "../shared/quick-visit-view.model";
import { FollowupOption } from "../shared/types/appointment-custom-types";
import { VisitBLService } from "../shared/visit.bl.service";
import { Visit } from "../shared/visit.model";
import { VisitService } from "../shared/visit.service";

@Component({
  selector: 'manual-follow-up',
  templateUrl: './manual-follow-up.component.html',
  styleUrls: ['./manual-follow-up.component.css']
})
export class ManualFollowupComponent {

  @Input('selected-followup-option')
  SelectedFollowup: FollowupOption;

  @Input('selected-patient')
  SelectedPatient = new Patient();

  @Input('patient-visits')
  SelectedPatientVisits = new Array<GetPatientVisits_DTO>();

  @Input('is-free-followup')
  IsFreeFollowupSelected: boolean = false;

  @Output('callback-manual-followup')
  CallbackManualFollowup = new EventEmitter<object>();
  SelectedDepartment: Department;
  SelectedDoctor = { DepartmentId: 0, DepartmentName: "", PerformerId: 0, PerformerName: "", ItemName: "", Price: 0, IsTaxApplicable: false, DepartmentLevelAppointment: false };
  DoctorsList: Array<{ DepartmentId: number, DepartmentName: string, PerformerId: number, PerformerName: string, ItemName: string, Price: number, IsTaxApplicable: boolean, SAARCCitizenPrice: number, ForeignerPrice: number }>;
  FilteredDocList: Array<{ DepartmentId: number, DepartmentName: string, PerformerId: number, PerformerName: string, ItemName: string, Price: number, IsTaxApplicable: boolean, SAARCCitizenPrice: number, ForeignerPrice: number }>;

  IsVisitFound: boolean = false;
  IsVisitChecked: boolean = false;
  SelectedVisit = new GetPatientVisits_DTO();
  SelectedVisitDayCount: number = 0;
  Loading: boolean = false;
  NewVisitForChangeDoctor = new Visit();
  NewBillTxn = new BillingTransaction();
  SchemePriCeCategoryFromVisit: SchemePriceCategoryCustomType = { SchemeId: 0, PriceCategoryId: 0 };
  ServiceBillingContext: string = ENUM_ServiceBillingContext.Registration;
  PaidFollowupVisitDate: string = moment().format(ENUM_DateTimeFormat.Year_Month_Day);
  PaidFollowupVisitTime: string = moment().add(5, 'minutes').format('HH:mm');

  InvoiceDisplayProperties = {
    bil_InvoiceNo: 0,
    bil_FiscalYrId: 0,
    bil_BilTxnId: 0
  }
  ShowPrintingPopup: boolean = false;
  ShowOpdSticker: boolean = false;
  ShowInvoice: boolean = false;
  NewPatientVisitId: number = 0;
  ChangedDoctor: boolean = false;
  allowDoctorChange: boolean = false;
  HasChangeDoctorPermission: boolean = false;
  DepartmentList: Department[] = [];

  constructor(private _visitBlService: VisitBLService,
    private _visitService: VisitService,
    private _msgBoxService: MessageboxService,
    private _changeDetector: ChangeDetectorRef,
    public securityService: SecurityService,
  ) {
    this.DoctorsList = this._visitService.ApptApplicableDoctorsList;
    this.FilteredDocList = this._visitService.ApptApplicableDoctorsList;
    this.DepartmentList = this._visitService.ApptApplicableDepartmentList;
    this.HasChangeDoctorPermission = this.securityService.HasPermission("btn-appointment-change-followup-doctor") ? true : false;

  }

  ngOnInit() {
    this._visitService.appointmentType = ENUM_AppointmentType.followup;
    this.SelectedVisit = this._visitService.CreateNewGlobal() as unknown as GetPatientVisits_DTO;
  }

  Close() {
    this.CallbackManualFollowup.emit();
  }

  EmitAfterSuccessFullFollowup() {
    this.CallbackManualFollowup.emit({ success: true });
  }

  MyDepartmentListFormatter(data: any): string {
    let html = data["DepartmentName"];
    return html;
  }

  AssignSelectedDepartment() {
    if (this.SelectedDepartment) {
      this.FilteredDocList = this.DoctorsList.filter(doc => doc.DepartmentId === this.SelectedDepartment.DepartmentId);
    }
  }

  DocListFormatter(data: any): string {
    let html = data["PerformerName"];
    return html;
  }

  AssignSelectedDoctor() {
    if (this.SelectedDoctor) {
      const departmentId = this.SelectedDoctor.DepartmentId;
      this.SelectedDepartment = this.DepartmentList.find(d => d.DepartmentId === departmentId);
      this.SelectedVisit.PerformerId = this.SelectedDoctor.PerformerId;
      this.SelectedVisit.PerformerName = this.SelectedDoctor.PerformerName;
      if (!this.IsFreeFollowupSelected) {
        setTimeout(() => {
          this._visitService.TriggerBillChangedEvent({ ChangeType: "Doctor", SelectedDoctor: this.SelectedDoctor });
        }, 500);
      }
    }
  }


  CheckPreviousVisit() {
    if (this.SelectedDepartment && this.SelectedDoctor) {
      const visit = this.SelectedPatientVisits.find(v => v.DepartmentId === this.SelectedDepartment.DepartmentId && v.PerformerId === this.SelectedDoctor.PerformerId && (v.AppointmentType !== ENUM_AppointmentType.followup && v.AppointmentType !== ENUM_AppointmentType.referral)); //! Cannot do followup from followup appointment type
      if (visit) {
        this.SelectedVisit = visit;
        this.SelectedVisit.PerformerId = visit.PerformerId;
        this.SelectedVisit.ParentVisitId = visit.PatientVisitId;
        this.SelectedVisit.DepartmentId = visit.DepartmentId;
        this.SelectedVisitDayCount = moment(moment().format('YYYY-MM-DD')).diff(moment(this.SelectedVisit.VisitDate), 'days');
        this.IsVisitChecked = true;
        this.IsVisitFound = true;
        this.allowDoctorChange = false; // Reset change doctor flag
        this.NewBillTxn.SchemeId = this.SelectedVisit.SchemeId;
        this._visitService.ParentVisitInfo = this.SelectedVisit;
        const clonedSelectedVisit = _.cloneDeep(this.SelectedVisit);
        this.SchemePriCeCategoryFromVisit.SchemeId = clonedSelectedVisit.SchemeId;
        this.SchemePriCeCategoryFromVisit.PriceCategoryId = clonedSelectedVisit.PriceCategoryId;
        this._changeDetector.detectChanges();
        if (!this.IsFreeFollowupSelected) {

          setTimeout(() => {
            this._visitService.TriggerBillChangedEvent({ ChangeType: "Doctor", SelectedDoctor: this.SelectedDoctor });
          }, 500);

        }
      } else {
        this.IsVisitChecked = true;
        this.IsVisitFound = false;
      }
      this._changeDetector.detectChanges();
    }
  }

  CreateManualFollowup() {
    if (this.IsFreeFollowupSelected) {
      this.CreateFreeFollowup();
    } else {

      this.CreatePaidFollowup();
    }
  }

  CreateFreeFollowup() {
    this.NewVisitForChangeDoctor = this._visitService.CreateNewGlobal();
    if (!this.SelectedDoctor || this.SelectedDoctor.toString() === "") {
      return this._msgBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Please select doctor`]);
    }
    if (this.SelectedVisit) {
      this.NewVisitForChangeDoctor.PerformerId = this.SelectedVisit.PerformerId;
      this.NewVisitForChangeDoctor.PerformerName = this.SelectedVisit.PerformerName;
      this.NewVisitForChangeDoctor.DepartmentId = this.SelectedVisit.DepartmentId;
      this.NewVisitForChangeDoctor.PatientId = this.SelectedVisit.PatientId;
      this.NewVisitForChangeDoctor.PriceCategoryId = this.SelectedVisit.PriceCategoryId;
      this.NewVisitForChangeDoctor.SchemeId = this.SelectedVisit.SchemeId;
    }
    this.Loading = true;

    //! Need to create a separate API to create Free Follow up visit.
    const isManualFreeFollowup: boolean = true;
    this._visitBlService.PostFreeFollowupVisit(this.NewVisitForChangeDoctor, this.SelectedVisit.PatientVisitId, isManualFreeFollowup)
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this._msgBoxService.showMessage(ENUM_MessageBox_Status.Success, ["Followup created successfully."]);
          this.Loading = false;
          this.EmitAfterSuccessFullFollowup();
        }
        else {
          this._msgBoxService.showMessage(ENUM_MessageBox_Status.Failed, [res.ErrorMessage]);
          console.log(res.ErrorMessage);
          this.Loading = false;
        }
      }, err => {
        console.log(err);
      });
  }

  CreatePaidFollowup() {
    this.Loading = true;
    if (this.PaidFollowupVisitDate < moment().format('YYYY-MM-DD')) {
      this._msgBoxService.showMessage(ENUM_MessageBox_Status.Failed, ["Followup date should be greater than current date."]);
      return;
    }
    if (this.PaidFollowupVisitTime < moment().format('HH:mm:ss')) {
      this._msgBoxService.showMessage(ENUM_MessageBox_Status.Failed, ["Followup time should be greater than current time."]);
      return;
    }
    if (this.NewBillTxn && this.NewBillTxn.BillingTransactionItems && this.NewBillTxn.BillingTransactionItems.length > 0) {
      let quickVisitPaidFollowup = new QuickVisitVM();
      const hasZeroPriceAllowedItem = this.NewBillTxn.BillingTransactionItems.some(item => item.IsZeroPriceAllowed);
      if (!hasZeroPriceAllowedItem) {
        const hasValidPrice = this.NewBillTxn.BillingTransactionItems.every(item => item.Price > 0);

        if (!hasValidPrice) {
          this._msgBoxService.showMessage(ENUM_MessageBox_Status.Failed, ['Cannot create a visit for items where zero pricing is not permitted and price is less than or equal to zero.']);
          this.Loading = false;
          return;
        }
      }
      try {
        this.NewBillTxn.BillingTransactionItems[0].PatientId = this.SelectedVisit.PatientId;
        this.NewBillTxn.BillingTransactionItems[0].VisitType = ENUM_VisitType.outpatient;
        this.NewBillTxn.BillingTransactionItems[0].BillingType = ENUM_BillingType.outpatient;
        this.NewBillTxn.InvoiceType = ENUM_InvoiceType.outpatient;

        quickVisitPaidFollowup.BillingTransaction = this.NewBillTxn;
        quickVisitPaidFollowup.Visit = this.SelectedVisit as unknown as Visit; //! This maps the SelectedVisit to Visit, To assign the values from different type of variable to different type.
        quickVisitPaidFollowup.Visit.TicketCharge = this.NewBillTxn.TotalAmount;
        quickVisitPaidFollowup.Visit.AppointmentType = ENUM_AppointmentType.followup;
        quickVisitPaidFollowup.Visit.VisitType = ENUM_VisitType.outpatient;
        quickVisitPaidFollowup.Visit.ParentVisitId = this.SelectedVisit.PatientVisitId;
        quickVisitPaidFollowup.Visit.VisitDate = this.PaidFollowupVisitDate;
        quickVisitPaidFollowup.Visit.VisitTime = this.PaidFollowupVisitTime;

        quickVisitPaidFollowup.BillingTransaction.BillingTransactionItems.forEach(a => {
          a.OrderStatus = ENUM_OrderStatus.Active;
        });

        if (quickVisitPaidFollowup.BillingTransaction.PaymentMode.toLowerCase() !== ENUM_BillPaymentMode.credit.toLowerCase()) {
          quickVisitPaidFollowup.BillingTransaction.OrganizationId = null;
          quickVisitPaidFollowup.BillingTransaction.OrganizationName = null;
        }

        this._visitBlService.PostPaidFollowupVisit(quickVisitPaidFollowup)
          .finally(() => this.Loading = false)
          .subscribe((res: DanpheHTTPResponse) => {
            if (res.Status === ENUM_DanpheHTTPResponses.OK && res.Results) {
              console.log(res);
              this._msgBoxService.showMessage(ENUM_MessageBox_Status.Success, [`Followup Created Successfully.`]);

              this.InvoiceDisplayProperties.bil_BilTxnId = res.Results.BillingTransaction ? res.Results.BillingTransaction.BillingTransactionId : 0;
              this.InvoiceDisplayProperties.bil_FiscalYrId = res.Results.BillingTransaction ? res.Results.BillingTransaction.FiscalYearId : 0;
              this.InvoiceDisplayProperties.bil_InvoiceNo = res.Results.BillingTransaction ? res.Results.BillingTransaction.InvoiceNo : 0;
              this.NewPatientVisitId = res.Results.Visit ? res.Results.Visit.PatientVisitId : 0;
              this.ShowInvoice = true;
              this.ShowOpdSticker = true;
              this.ShowPrintingPopup = true;

            }
            else {
              this._msgBoxService.showMessage(ENUM_MessageBox_Status.Failed, [res.ErrorMessage]);
              console.log(res.ErrorMessage);
              this.Loading = false;
            }
          });
      } catch (error) {
        this._msgBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Something Went wrong, Please check the logs for more detailed error!`]);
        console.log(error);
      }

    }
  }

  OnRegistrationSchemeChanged(scheme: RegistrationScheme_DTO) {
    if (scheme && scheme.SchemeId && scheme.PriceCategoryId) {
      this._visitService.TriggerSchemeChangeEvent(scheme);
    }
  }

  CloseInvoicePrint() {
    this.ShowInvoice = false;
    this.ShowOpdSticker = false;
    this.ShowPrintingPopup = false;
    this.EmitAfterSuccessFullFollowup();
  }
  OnDoctorChange() {
    this.allowDoctorChange = this.ChangedDoctor;
    this.AssignSelectedDepartment();
    if (!this.ChangedDoctor) {
      // Revert to original doctor details if the checkbox is unchecked
      // this.NewBillTxn.PerformerId = this.parentVisit.PerformerId;
      // this.NewBillTxn.PerformerName = this.parentVisit.PerformerName;
      console.log('Reverted to original doctor details:', this.NewBillTxn);
    }
  }
}
