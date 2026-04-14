import { ChangeDetectorRef, Component, OnInit } from "@angular/core";
import { CurrentVisitContextVM } from "../../../appointments/shared/current-visit-context.model";
import { Visit } from "../../../appointments/shared/visit.model";
import { VisitService } from "../../../appointments/shared/visit.service";
import { BillingBLService } from "../../../billing/shared/billing.bl.service";
import { ServiceItemDetails_DTO } from "../../../billing/shared/dto/service-item-details.dto";
import { CoreService } from "../../../core/shared/core.service";
import { LabsBLService } from "../../../labs/shared/labs.bl.service";
import { Patient } from "../../../patients/shared/patient.model";
import { PatientService } from "../../../patients/shared/patient.service";
import { SecurityService } from "../../../security/shared/security.service";
import { CancelStatusHoldingModel, DanpheHTTPResponse } from "../../../shared/common-models";
import { NepaliDateInGridParams } from "../../../shared/danphe-grid/NepaliColGridSettingsModel";
import { MessageboxService } from "../../../shared/messagebox/messagebox.service";
import { ENUM_BillingType, ENUM_DanpheHTTPResponses, ENUM_Genders, ENUM_InvestigationLAB_ValueType, ENUM_MessageBox_Status, ENUM_Module, ENUM_ServiceBillingContext } from "../../../shared/shared-enums";
import { ClinicalPatientService } from "../../shared/clinical-patient.service";
import { ClinicalNoteBLService } from "../../shared/clinical.bl.service";
import { Field } from "../../shared/dto/field.dto";
import { Imaging_DTO } from "../../shared/dto/imaging.dto";
import { GroupedLabTestItemDTO, LabTestResult_DTO } from "../../shared/dto/lab-test-result.dto";
import { PatientDetails_DTO } from "../../shared/dto/patient-cln-detail.dto";
import { Requested_Item_DTO } from "../../shared/dto/requested-items.dto";
import { SelectedBillorCancel_DTO } from "../../shared/dto/SelectedBillForCancel_DTO.Model";

@Component({
  selector: 'investigation',
  templateUrl: './investigation.component.html'
})
export class InvestigationMainComponent implements OnInit {
  Field: Field;
  IsAcrossVisitAvailability: boolean = false;
  SearchString: string = null;
  SelectedPatient = new PatientDetails_DTO();
  ServiceItems = new Array<ServiceItemDetails_DTO>();
  ShowLabRequest: boolean;
  ShowImagingRequest: boolean;
  ShowRequested: boolean;
  ShowImagingReport: boolean = false;
  SelectedRequisitionId: number = null;
  EditableRediologyReport: boolean = false;
  Loading: boolean = false;
  WardPopup: boolean = false;
  PriceCategoryId: number = 0;
  SchemeId: number = 0;
  SchemePriceCategory = { SchemeId: null, PriceCategoryId: null };
  CounterId: number = null;
  LabTestItems: LabTestResult_DTO[];
  RequestedImagingItems: Array<Imaging_DTO> = new Array<Imaging_DTO>();
  RequestedTestItems: Array<Requested_Item_DTO> = new Array<Requested_Item_DTO>();
  BillingType: string = "";
  VisitType: string = "";
  GroupedLabTest: GroupedLabTestItemDTO[] = [];
  GroupedLabTestItems: GroupedLabTestItemDTO[] = [];
  SearchTerm: string = '';
  FilteredLabTestItems: GroupedLabTestItemDTO[] = [];
  readonly LabTabIndex: number = 0;
  readonly ImagingTabIndex: number = 1;
  readonly RequestedItemsTabIndex: number = 2;
  public IsCancelRuleEnabled: boolean;

  public ProvisionalItemsDetails: Array<any> = [];
  public CurrPatVisitContext: CurrentVisitContextVM = null;
  public NursingCancellationRule: CancelStatusHoldingModel = new CancelStatusHoldingModel();
  public NursingWardBillingColumns: NursingWardBillingColumns[];
  public NepaliDateInGridSettings: NepaliDateInGridParams = new NepaliDateInGridParams();
  public SelectedBillForCancel: SelectedBillorCancel_DTO = new SelectedBillorCancel_DTO();
  public CancelRemarks: string = null;
  ShowConfirmationBox: boolean = false;
  SelIndexForCancel: number;
  public HidePriceCol: boolean = true;
  public CurrentVisit: Visit = new Visit();
  public loading = false;
  public CurrentPatient: Patient = new Patient();
  PatientId: number = 0;
  PatientVisitId: number = 0;
  constructor(

    private _securityService: SecurityService,
    private _msgBoxServ: MessageboxService,

    private _clinicalBlservice: ClinicalNoteBLService,
    private _coreService: CoreService,
    private _selectedPatientService: ClinicalPatientService,
    private _changeDetector: ChangeDetectorRef,
    public _labBLService: LabsBLService,
    public _billingBLService: BillingBLService,
    public patientService: PatientService,
    public clinicalNoteBLService: ClinicalNoteBLService,
    public changeDetector: ChangeDetectorRef,
    public visitService: VisitService,

  ) {
    this.SelectedPatient = _selectedPatientService.SelectedPatient;
    this.CounterId = this._securityService.getLoggedInCounter().CounterId;
    this.CurrentPatient = this.patientService.globalPatient;
    this.CurrentVisit = this.visitService.globalVisit;
  }


  ngOnInit() {
    if (this.Field) {
      this.IsAcrossVisitAvailability = this.Field.IsAcrossVisitAvailability;
    } else {
      this.IsAcrossVisitAvailability = false;
    }
    if (this.SelectedPatient && this.SelectedPatient.PatientId) {
      this.PatientId = this.SelectedPatient.PatientId;
      this.PatientVisitId = this.SelectedPatient.PatientVisitId;
      this.SchemeId = this.SelectedPatient.SchemeId;
      this.PriceCategoryId = this.SelectedPatient.PriceCategoryId;
      this.SchemePriceCategory.SchemeId = this.SelectedPatient.SchemeId;
      this.SchemePriceCategory.PriceCategoryId = this.SelectedPatient.PriceCategoryId;
      this.getLabItems(this.SelectedPatient.PatientId, this.SelectedPatient.PatientVisitId, this.IsAcrossVisitAvailability);
      this.getRequestedItems(this.SelectedPatient.PatientId, this.SelectedPatient.PatientVisitId, this.IsAcrossVisitAvailability);
      this.getRequestedImagingItems(this.SelectedPatient.PatientId, this.SelectedPatient.PatientId, this.IsAcrossVisitAvailability);
      this.GetServiceItemsBySchemeIdAndPriceCategoryId(ENUM_ServiceBillingContext.OpBilling, this.SchemeId, this.PriceCategoryId);
      this.GetPatientProvisionalItems(
        this.SelectedPatient.PatientId,
        this.SelectedPatient.PatientVisitId
      );
      this.GetCurrentVisitContext();
      if (this.SelectedPatient.VisitType === null) {
        this.BillingType = ENUM_BillingType.outpatient;
        this.VisitType = ENUM_BillingType.outpatient;
      }
      else {
        this.BillingType = this.SelectedPatient.VisitType.toLowerCase();
        this.VisitType = this.SelectedPatient.VisitType.toLowerCase();
      }
      this.updateView(this.RequestedItemsTabIndex);
    }
    else {
      this.LabTestItems = null;
      this.RequestedTestItems = null;
      this.RequestedImagingItems = null;
    }
  }
  MapLabTestItemToGroup(item: LabTestResult_DTO): GroupedLabTestItemDTO {
    return {
      Category: item.TestCategoryName,
      Items: [item]
    };
  }

  SearchLabTestItems(event: string): void {
    this.FilteredLabTestItems = this.LabTestItems.filter(item =>
      item.ComponentName.toLowerCase().includes(this.SearchTerm.toLowerCase())
    )
      .map(item => this.MapLabTestItemToGroup(item));

    if (event.trim() === '') {
      this.GroupedLabTest = this.GroupedLabTestItems;
      return;
    }

    this.FilteredLabTestItems.sort((a, b) => {
      if (a.Category < b.Category) return -1;
      if (a.Category > b.Category) return 1;
      return 0;
    });
    this.GroupedLabTest = this.FilteredLabTestItems;
  }

  RequestData() {
    this.WardPopup = true;
  }
  ClosePopUp() {
    this.WardPopup = false;
  }
  GetServiceItemsBySchemeIdAndPriceCategoryId(serviceBillingContext: string, SchemeId: number, PriceCategoryId: number): void {
    this._clinicalBlservice.GetServiceItems(serviceBillingContext, SchemeId, PriceCategoryId)
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK && res.Results) {
          this.ServiceItems = res.Results;
        }
      },
        err => {
          console.log(err);
        }
      );
  }
  updateView(tabIndex: number) {
    this.ShowLabRequest = false;
    this.ShowImagingRequest = false;
    this.ShowRequested = false;

    if (tabIndex === this.LabTabIndex) {
      this.ShowLabRequest = true;
      this.getLabItems(this.SelectedPatient.PatientId, this.SelectedPatient.PatientVisitId, this.IsAcrossVisitAvailability);
    } else if (tabIndex === this.ImagingTabIndex) {
      this.ShowImagingRequest = true;
      this.getRequestedImagingItems(this.SelectedPatient.PatientId, this.SelectedPatient.PatientVisitId, this.IsAcrossVisitAvailability);

    } else if (tabIndex === this.RequestedItemsTabIndex) {
      this.ShowRequested = true;
      this.getRequestedItems(this.SelectedPatient.PatientId, this.SelectedPatient.PatientVisitId, this.IsAcrossVisitAvailability);
    }
  }
  getLabItems(PatientId: number, PatientVisitId: number, IsAcrossVisitAvailability: boolean) {
    this._clinicalBlservice.GetLabItems(PatientId, PatientVisitId, IsAcrossVisitAvailability)
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK && res.Results) {
          this.LabTestItems = res.Results.map(item => {
            item['ReferenceRange'] = this.GetReferenceRange(item);
            return item;
          });
          let groupedLabTestItems = this.GroupLabTestItemsByCategory(this.LabTestItems);
          this.GroupedLabTest = Array.from(groupedLabTestItems.entries()).map(([Category, Items]) => ({ Category, Items }));
          this.GroupedLabTestItems = this.GroupedLabTest;
        }
      },
        err => {
          console.log(err);
        }
      );
  }
  GetReferenceRange(item: LabTestResult_DTO): string {
    let age = this._coreService.CalculateAge(this._selectedPatientService.SelectedPatient.DateOfBirth);
    let formattedAge = parseInt(age.replace(/\D/g, ''), 10) || 0;
    const gender = this._selectedPatientService.SelectedPatient.Gender.toLowerCase();
    if (item.ValueType === ENUM_InvestigationLAB_ValueType.number) {
      if (formattedAge < 16) {
        return item.ChildRange || item.Range;
      } else {
        if (gender === ENUM_Genders.Male) {
          return item.MaleRange || item.Range;
        } else if (gender === ENUM_Genders.Female) {
          return item.FemaleRange || item.Range;
        } else {
          return item.Range;
        }
      }
    }
    else if (item.ValueType === ENUM_InvestigationLAB_ValueType.text) {
      return item.RangeDescription;
    }
    return '';
  }



  GroupLabTestItemsByCategory(labTestItems: LabTestResult_DTO[]): Map<string, LabTestResult_DTO[]> {
    let grouped = new Map<string, LabTestResult_DTO[]>();
    labTestItems.forEach(item => {
      let category = item.TestCategoryName;
      if (!grouped.has(category)) {
        grouped.set(category, []);
      }
      grouped.get(category).push(item);
    });
    return grouped;
  }
  getRequestedImagingItems(PatientId: number, PatientVisitId: number, IsAcrossVisitAvailability: boolean) {
    this._clinicalBlservice.GetRequestedImagingItems(PatientId, PatientVisitId, IsAcrossVisitAvailability)
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK && res.Results) {
          this.RequestedImagingItems = res.Results;
        }
        else {
          this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ['Unable To get ImagingItems']);
        }
      },
        (err) => {
          this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, [`Unable To Get  ImagingItems Please Check The Console.`]);
          console.log(err);
        }
      );
  }
  getRequestedItems(PatientId: number, PatientVisitId: number, IsAcrossVisitAvailability: boolean) {
    this._clinicalBlservice.GetRequestedLabItems(PatientId, PatientVisitId, IsAcrossVisitAvailability)
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK && res.Results) {
          this.RequestedTestItems = res.Results;
        }
      },
        err => {
          console.log(err);
        }
      );
  }
  CallBackAdd($event) {
    if ($event && $event.action === "save") {
      this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Success, ["Requested Successfully"]);
      this.WardPopup = false;
      this.getRequestedItems(this.SelectedPatient.PatientId, this.SelectedPatient.PatientVisitId, this.IsAcrossVisitAvailability);
      this.getLabItems(this.SelectedPatient.PatientId, this.SelectedPatient.PatientVisitId, this.IsAcrossVisitAvailability);
      this.getRequestedImagingItems(this.SelectedPatient.PatientId, this.SelectedPatient.PatientVisitId, this.IsAcrossVisitAvailability);

    }
  }
  ViewReport(report: Imaging_DTO): void {
    this.ShowImagingReport = false;
    this.SelectedRequisitionId = null;
    this._changeDetector.detectChanges();
    this.SelectedRequisitionId = report.ImagingRequisitionId;
    this.ShowImagingReport = true;
    this.EditableRediologyReport = false;
  }


  public GetCurrentVisitContext() {
    this._labBLService
      .GetDataOfInPatient(
        this.SelectedPatient.PatientId,
        this.SelectedPatient.PatientVisitId
      )
      .subscribe(
        (res) => {
          if (res.Status === ENUM_DanpheHTTPResponses.OK && res.Results.Current_WardBed) {
            this.CurrPatVisitContext = res.Results;
          } else {
            this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, [
              "Problem! Cannot get the Current Visit Context ! ",
            ]);
          }
        },
        (err) => {
          console.log(err.ErrorMessage);
        }
      );
  }

  GetPatientProvisionalItems(patientId: number, patientVisitId: number) {
    let module = ENUM_Module.NURSING;
    this._billingBLService.GetInPatientProvisionalItemList(patientId, patientVisitId, module)
      .subscribe((res) => {

        if (this.IsCancelRuleEnabled) {
          res.Results.BillItems.forEach(val => {
            if (val.IntegrationName && (val.IntegrationName.toLowerCase() === 'lab' || val.IntegrationName.toLowerCase() === 'radiology')) {
              if ((val.IntegrationName.toLowerCase() === 'lab' && this.NursingCancellationRule.labStatus.includes(val.OrderStatus))
                || (val.IntegrationName.toLowerCase() === 'radiology' && this.NursingCancellationRule.radiologyStatus.includes(val.OrderStatus))) {
                val.AllowCancellation = true;
              }
            }
          });
        }



        this.ProvisionalItemsDetails = res.Results.BillItems;

        this.patientService.globalPatient.DateOfBirth = res.Results.Patient.DateOfBirth;
        this.patientService.globalPatient.BloodGroup = res.Results.Patient.BloodGroup;
        this.patientService.globalPatient.CountryId = res.Results.Patient.CountryId;
        this.patientService.globalPatient.CountrySubDivisionId =
          res.Results.Patient.CountrySubDivisionId;
        this.patientService.globalPatient.CountrySubDivisionName =
          res.Results.Patient.CountrySubDivisionName;
        this.patientService.globalPatient.PhoneNumber = res.Results.Patient.PhoneNumber;

      });
  }

  OnNewIpRequestClosed() {
    this.GetPatientProvisionalItems(
      this.SelectedPatient.PatientId,
      this.SelectedPatient.PatientVisitId
    );
  }
  CancelRequestedItem(reqitem: Requested_Item_DTO) {
    const confirmCancel = confirm(`Are you sure you want to cancel ${reqitem.TestName}?`);
    if (confirmCancel) {
      this._clinicalBlservice.CancelRequestedItem(this.PatientId, this.PatientVisitId, reqitem.RequisitionId, reqitem.Type)
        .subscribe((res: DanpheHTTPResponse) => {
          if (res.Status === ENUM_DanpheHTTPResponses.OK) {
            this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Success, ['Request cancelled successfully.']);
            this.getRequestedItems(this.SelectedPatient.PatientId, this.SelectedPatient.PatientVisitId, this.IsAcrossVisitAvailability);
            this._changeDetector.detectChanges();
          } else {
            this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, [res.ErrorMessage]);
          }
        });
    }
  }
}
