import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output
} from "@angular/core";

import * as moment from "moment/moment";
import { CurrentVisitContextVM } from "../../../appointments/shared/current-visit-context.model";
import { BillingMasterBlService } from "../../../billing/shared/billing-master.bl.service";
import { BillingTransactionItem } from "../../../billing/shared/billing-transaction-item.model";
import { BillingTransaction } from "../../../billing/shared/billing-transaction.model";
import { BillingBLService } from "../../../billing/shared/billing.bl.service";
import { BillingService } from "../../../billing/shared/billing.service";
import { SchemePriceCategory_DTO } from "../../../billing/shared/dto/scheme-pricecategory.dto";
import { ServiceItemDetails_DTO } from "../../../billing/shared/dto/service-item-details.dto";
import { PatientBillingContextVM } from "../../../billing/shared/patient-billing-context-vm";
import { CoreService } from "../../../core/shared/core.service";
import { LabsBLService } from "../../../labs/shared/labs.bl.service";
import { Patient } from "../../../patients/shared/patient.model";
import { SecurityService } from "../../../security/shared/security.service";
import { ServiceDepartmentVM } from "../../../shared/common-masters.model";
import { DanpheHTTPResponse } from "../../../shared/common-models";
import { DLService } from "../../../shared/dl.service";
import { MessageboxService } from "../../../shared/messagebox/messagebox.service";
import { ENUM_BillingStatus, ENUM_DanpheHTTPResponseText, ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status, ENUM_OrderStatus, ENUM_ServiceBillingContext, ENUM_VisitType } from "../../../shared/shared-enums";
import { ClinicalNoteBLService } from "../../shared/clinical.bl.service";
import { Departments_DTO } from "../../shared/dto/Deparment-list.dto";


@Component({
  selector: "clinical-ip-request",
  templateUrl: "./clinical-ip-request.html",
})
export class ClinicalIPRequestComponent implements OnChanges {

  public BillItems: Array<any> = [];

  @Input("patientId")
  public patientId: number;
  @Input("visitId")
  public visitId: number;
  @Input("counterId")
  public CounterID: number;
  @Input("visitType")
  public VisitTypes: string;
  @Input("billingType")
  public BillingTypes: string;

  public PastTests: Array<any> = [];
  //departmentsList: Array<any> = [];
  DepartmentsList = new Array<Departments_DTO>();
  BillingDetails: { TotalDepositAmount: number, TotalPendingBillAmount: number, RemainingBalanceAmount: number };

  @Input("past-tests")
  set SetPastTests(value: Array<any>) {
    this.PastTest(value);
  }

  public CurrentTests: Array<any> = [];

  @Output("emit-billItemReq")
  public EmitBillItemReq: EventEmitter<Object> = new EventEmitter<Object>();

  public ShowIpBillRequest: boolean = true;

  @Input("department")
  //public department: string = null;


  @Input("requestingDepartment")
  public RequestingDepartmentId: number;
  public ServiceDeptList: Array<ServiceDepartmentVM>;
  public DoctorsList: Array<any> = [];

  public BillingTransactions: BillingTransaction;

  //seleted items
  public SelectedItems = [];
  public SelectedServDepts: Array<any> = [];
  public SelectedAssignedToDr: Array<any> = [];
  public SelectedRequestedByDr: Array<any> = [];

  public InpatientList: Array<Patient>;
  public VisitList: Array<any>;

  public Loading = false;
  public TaxDetail = { taxPercent: 0, taxId: 0 };
  public CurrBillingContext: PatientBillingContextVM = null;


  public CurrPatVisitContext: CurrentVisitContextVM = null;
  public SearchByItemCode: boolean = true;

  public BillRequestDoubleEntryWarningTimeHrs: number = 0;
  public PastTestList: any = [];
  public PastTestList_ForDuplicate: any = [];
  public IsRequestedByDrMandatory: boolean = true;
  public LabTypeName: string = "op-lab";
  public ShowHidePrice: boolean = false;
  public TotalAmounts: number = 0;
  public SchemePriCeCategoryFromVisit: SchemePriceCategoryCustomType = { SchemeId: 0, PriceCategoryId: 0 };
  public ServiceBillingContext: string = ENUM_ServiceBillingContext.IpBilling;
  public ServiceItems = new Array<ServiceItemDetails_DTO>();
  ConfirmationTitle: string = "Confirm !";
  ConfirmationMessage: string = "Are you sure you want to request selected items?";

  constructor(
    public labBLService: LabsBLService,
    public msgBoxServ: MessageboxService,
    public securityService: SecurityService,
    public changeDetectorRef: ChangeDetectorRef,
    public billingBLService: BillingBLService,
    public billingService: BillingService,
    public coreService: CoreService,
    public clinicalNoteBLService: ClinicalNoteBLService,
    public dlService: DLService,
    private billingMasterBlService: BillingMasterBlService
  ) {
    this.BillingTransactions = new BillingTransaction();
    this.ServiceDeptList = this.coreService.Masters.ServiceDepartments;
    this.ServiceDeptList = this.ServiceDeptList.filter(
      (a) => a.ServiceDepartmentName != "OPD"
    );
    this.SearchByItemCode = this.coreService.UseItemCodeItemSearch();


    this.BillRequestDoubleEntryWarningTimeHrs =
      this.coreService.LoadIPBillRequestDoubleEntryWarningTimeHrs();
    let param = this.coreService.Parameters.find(
      (p) =>
        p.ParameterGroupName == "Common" &&
        p.ParameterName == "RequestedByDrSettings"
    ).ParameterValue;
    if (param) {
      let paramValue = JSON.parse(param);
      this.IsRequestedByDrMandatory = paramValue.NursingWardRequest.IsMandatory;
    }

    if (this.coreService.labTypes.length == 1) {
      this.LabTypeName = this.coreService.labTypes[0].LabTypeName;
      console.log(this.LabTypeName);
    }
    this.GetParametersToShowHidePriceCol();
    this.GetAllDepartmentsList();
  }

  ngOnInit() {
    this.ItemsListFormatter = this.ItemsListFormatter.bind(this);
    //Asynchronous (incase if user )
    if (this.patientId && this.visitId) {
      this.billingBLService
        .GetPatientCurrentVisitContext(this.patientId, this.visitId)
        .subscribe((res: DanpheHTTPResponse) => {
          if (res.Status === ENUM_DanpheHTTPResponses.OK && res.Results) {
            this.CurrPatVisitContext = res.Results;
            this.SchemePriCeCategoryFromVisit.SchemeId = this.CurrPatVisitContext.SchemeId;
            this.SchemePriCeCategoryFromVisit.PriceCategoryId = this.CurrPatVisitContext.PriceCategoryId;
          } else {
            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ["Problem! Cannot get the Current Visit Context ! "], res.ErrorMessage);
          }
        });

      this.SetLabTypeNameInLocalStorage();
    }

    this.ResetServiceDepartmentList();
    // this.PastTest(this.pastTests);
    window.setTimeout(function () {
      document.getElementById("items-box0").focus();
    }, 1000);

    //this.InitiateComponent();
    this.GetBillingSummaryForPatient();
  }

  GetParametersToShowHidePriceCol() {
    let moduleName = "Nursing";
    let param = this.coreService.Parameters.find(
      (p) =>
        p.ParameterGroupName == "Common" &&
        p.ParameterName == "WardBillingColumnSettings"
    );
    if (param) {
      let paramValue = JSON.parse(param.ParameterValue);
      let data = paramValue.find(
        (a) => a.Module.toLowerCase() == moduleName.toLowerCase()
      );
      this.ShowHidePrice = data ? data.ShowPrice : this.ShowHidePrice;
    }
  }

  PastTest($event) {
    this.PastTestList = $event;
  }

  //sud:11Nov'19--Don't show service department if there's no item in it..
  public ResetServiceDepartmentList() {
    if (this.coreService.Masters.ServiceDepartments && this.BillItems && this.BillItems.length > 0) {
      this.ServiceDeptList = [];
      this.coreService.Masters.ServiceDepartments.forEach((srv) => {
        if (this.BillItems.find((itm) => itm.ServiceDepartmentId == srv.ServiceDepartmentId)) {
          this.ServiceDeptList.push(srv);
        }
      });
      //exclude opd items..
      this.ServiceDeptList = this.ServiceDeptList.filter((a) => a.IntegrationName != "OPD");
    }
  }

  public InitiateComponent() {
    this.SelectedItems = [];
    this.SelectedAssignedToDr = [];
    this.SelectedServDepts = [];
    this.SelectedRequestedByDr = [];
    this.VisitList = [];

    this.AddNewBillTxnItemRow();

    this.LoadPatientBillingContext(this.patientId);
    this.GetPatientVisitList(this.patientId);
    this.GetDoctorsList();
  }

  public SubmitBillingTransaction(): void {

    let module = "nursing";
    if (this.Loading) {

      this.Loading = true;
      this.SetBillingTxnDetails();
      if (this.CheckValidations()) {
        // this.PostToDepartmentRequisition();
        this.PostProvisionalDepartmentRequisition();
        this.GetBillingSummaryForPatient();
      } else {
        this.Loading = false;
      }
    }
  }
  public SetBillingTxnDetails() {
    let currentVisit = this.VisitList.find(
      (visit) => visit.PatientVisitId == this.visitId
    );
    this.BillingTransactions.SchemeId = this.SchemePriCeCategoryFromVisit.SchemeId;
    this.BillingTransactions.PatientVisitId = this.visitId;
    this.BillingTransactions.BillingTransactionItems.forEach((txnItem) => {
      txnItem.PatientVisitId = this.visitId;

      txnItem.PatientId = this.patientId;
      txnItem.CounterId = this.CounterID;

      txnItem.RequestingDeptId = this.CurrBillingContext ? this.CurrBillingContext.RequestingDeptId : null;

      txnItem.BillingType = this.BillingTypes;
      txnItem.VisitType = this.VisitTypes; //If we use this for OutPatient Then We must modify it dynamically

      txnItem.BillStatus = ENUM_BillingStatus.provisional; // "provisional";

      txnItem.CreatedOn = moment().format("YYYY-MM-DD HH:mm:ss");
      txnItem.CreatedBy = this.securityService.GetLoggedInUser().EmployeeId;
      txnItem.CounterDay = moment().format("YYYY-MM-DD");

      txnItem.SubTotal = txnItem.Price * txnItem.Quantity;
      txnItem.DiscountAmount = 0;
      txnItem.DiscountPercent = 0;
      txnItem.DiscountPercentAgg = 0;
      txnItem.TotalAmount = txnItem.SubTotal - txnItem.DiscountAmount;
      txnItem.TaxPercent = 0;
      txnItem.OrderStatus = ENUM_OrderStatus.Active;

      let taxInfo1 = this.coreService.Parameters.find((a) => a.ParameterName == "TaxInfo");
      if (taxInfo1) {
        let taxInfoStr = taxInfo1.ParameterValue;
        let taxInfo = JSON.parse(taxInfoStr);
        txnItem.TaxPercent = taxInfo.TaxPercent;
        this.TaxDetail.taxId = taxInfo.TaxId;


      }

      this.BillingTransactions.TaxId = this.TaxDetail.taxId;

      //anjana/7-oct-2020: EMR:2695
      let currItmMaster = this.BillItems.find((itm) => itm.ServiceDepartmentId == txnItem.ServiceDepartmentId && itm.ServiceItemId == txnItem.ServiceItemId);
      if (currItmMaster) {
        txnItem.IsTaxApplicable = currItmMaster.TaxApplicable;
      }
      if (txnItem.IsTaxApplicable) {
        txnItem.TaxableAmount = txnItem.TotalAmount;
        txnItem.NonTaxableAmount = 0;
        txnItem.Tax = txnItem.TotalAmount * (txnItem.TaxPercent / 100);
      } else {
        txnItem.TaxableAmount = 0;
        txnItem.NonTaxableAmount = txnItem.TotalAmount;
      }
    });
  }

  public CheckValidations(): boolean {
    let isFormValid = true;
    //for inpatient visitid is compulsory, for other it's not.  (sud:12Nov'19--needs revision.)
    let isVisitIdValid =
      this.VisitTypes.toLowerCase() != ENUM_VisitType.inpatient ||
      (this.VisitTypes.toLowerCase() == ENUM_VisitType.inpatient &&
        this.visitId);

    if (this.patientId && isVisitIdValid) {
      if (
        this.CheckSelectionFromAutoComplete() &&
        this.BillingTransactions.BillingTransactionItems.length
      ) {
        for (
          var i = 0;
          i < this.BillingTransactions.BillingTransactionItems.length;
          i++
        ) {
          if (this.BillingTransactions.BillingTransactionItems[i].Price < 0) {
            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, [
              "The price of some items is less than zero ",
            ]);
            this.Loading = false;
            isFormValid = false;
            break;
          }

          let currTxnItm = this.BillingTransactions.BillingTransactionItems[i];
          for (var valCtrls in currTxnItm.BillingTransactionItemValidator
            .controls) {
            currTxnItm.BillingTransactionItemValidator.controls[
              valCtrls
            ].markAsDirty();
            currTxnItm.BillingTransactionItemValidator.controls[
              valCtrls
            ].updateValueAndValidity();
          }

          if (this.IsRequestedByDrMandatory == false) {
            currTxnItm.UpdateValidator("off", "PrescriberId", "required");
          } else {
            currTxnItm.UpdateValidator("on", "PrescriberId", "required");
          }
        }

        for (
          var i = 0;
          i < this.BillingTransactions.BillingTransactionItems.length;
          i++
        ) {
          let currTxnItm_1 = this.BillingTransactions.BillingTransactionItems[i];
          currTxnItm_1.BillingTransactionItemValidator.controls[
            "Price"
          ].disable();
          //break loop if even a single txn item is invalid.
          if (!currTxnItm_1.IsValidCheck(undefined, undefined)) {
            isFormValid = false;
            break;
          }
        }
      } else {
        isFormValid = false;
      }
    } else {
      this.msgBoxServ.showMessage("failed", ["Invalid Patient/Visit Id."]);
      isFormValid = false;
    }

    return isFormValid;
  }

  public CheckSelectionFromAutoComplete(): boolean {
    if (this.BillingTransactions.BillingTransactionItems.length) {
      for (let itm of this.BillingTransactions.BillingTransactionItems) {
        if (!itm.IsValidSelDepartment) {
          this.msgBoxServ.showMessage("failed", ["Select item from list."]);
          this.Loading = false;
          return false;
        }
      }
      return true;
    }
  }

  PostProvisionalDepartmentRequisition(): void {
    this.billingBLService.ProceedToBillingTransaction(this.BillingTransactions, this.BillingTransactions.BillingTransactionItems, "active", "provisional", false, this.CurrPatVisitContext)
      .finally((): void => {
        this.Loading = false;
      })
      .subscribe((res: DanpheHTTPResponse): void => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK && res.Results) {
          this.ResetAllRowData();
          this.msgBoxServ.showMessage("success", ["Items Requested"]);
          //check if we can send back the response data so that page below don't have to do server call again.
          this.EmitBillItemReq.emit({ action: "save", data: null });
        }
        else {
          this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ["Unable to complete transaction."]);
          console.log(res.ErrorMessage)
          this.Loading = false;
        }
      });
  }

  public LoadPatientBillingContext(patientId) {
    this.billingBLService
      .GetPatientBillingContext(patientId)
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this.CurrBillingContext = res.Results;

          if (!this.BillingTypes || this.BillingTypes.trim() == "") {
            //this.billingService.BillingType = "inpatient";
            this.BillingTypes = "inpatient";
          }
        }
      });
  }

  public GetPatientVisitList(patientId: number) {
    this.labBLService.GetPatientVisitsProviderWise(patientId).subscribe(
      (res) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          if (res.Results.length) {
            this.VisitList = res.Results;

            let doc = this.DoctorsList.find(
              (a) => a.EmployeeId == this.VisitList[0].PerformerId
            );

            if (doc) {
              this.SelectedRequestedByDr[0] = doc.FullName;
              this.AssignRequestedByDoctor(0);
            }
          } else {
            console.log(res.ErrorMessage);
          }
        }
      },
      (err) => {
        this.msgBoxServ.showMessage("Failed", [
          "unable to get PatientVisit list.. check log for more details.",
        ]);
        console.log(err.ErrorMessage);
      }
    );
  }
  public GetDoctorsList() {
    this.billingBLService.GetDoctorsList().subscribe(
      (res) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          if (res.Results.length) {
            this.DoctorsList = res.Results;
            let Obj = new Object();
            Obj["EmployeeId"] = null; //change by Yub -- 23rd Aug '18
            Obj["FullName"] = "SELF";
            this.DoctorsList.push(Obj);

            this.BillingTransactions.BillingTransactionItems[0].AssignedDoctorList = this.DoctorsList;
          } else {
            console.log(res.ErrorMessage);
          }
        }
      },
      (err) => {
        this.msgBoxServ.showMessage("Failed", [
          "unable to get Doctors list.. check log for more details.",
        ]);
        console.log(err.ErrorMessage);
      }
    );
  }

  GetServiceDeptNameById(servDeptId: number): string {
    if (this.ServiceDeptList) {
      let srvDept = this.ServiceDeptList.find(
        (a) => a.ServiceDepartmentId == servDeptId
      );
      return srvDept ? srvDept.ServiceDepartmentName : null;
    }
  }

  public AssignSelectedItem(index) {
    let item = null;

    if (this.SelectedItems[index]) {
      if (typeof this.SelectedItems[index] == "string" && this.BillingTransactions.BillingTransactionItems[index].ItemList.length) {
        item = this.BillingTransactions.BillingTransactionItems[index].ItemList.find((a) => a.ItemName != null && a.ItemName.toLowerCase() == this.SelectedItems[index].toLowerCase());
      } else if (typeof this.SelectedItems[index] == "object")
        item = this.SelectedItems[index];
      if (item) {

        this.BillingTransactions.BillingTransactionItems[index].ItemId = item.ItemId;
        this.BillingTransactions.BillingTransactionItems[index].ServiceItemId = item.ServiceItemId;
        this.BillingTransactions.BillingTransactionItems[index].IntegrationItemId = item.IntegrationItemId;
        this.BillingTransactions.BillingTransactionItems[index].ItemName = item.ItemName;
        this.BillingTransactions.BillingTransactionItems[index].ProcedureCode = item.ProcedureCode;
        this.BillingTransactions.BillingTransactionItems[index].Price = item.Price;
        this.BillingTransactions.BillingTransactionItems[index].DiscountSchemeId = item.SchemeId;
        this.BillingTransactions.BillingTransactionItems[index].PriceCategoryId = item.PriceCategoryId;

        //add also the servicedepartmentname property of the item; needed since most of the filtering happens on this value

        this.BillingTransactions.BillingTransactionItems[index].ServiceDepartmentName = this.GetServiceDeptNameById(item.ServiceDepartmentId);
        this.BillingTransactions.BillingTransactionItems[index].ServiceDepartmentId = item.ServiceDepartmentId;
        this.SelectedServDepts[index] = this.BillingTransactions.BillingTransactionItems[index].ServiceDepartmentName;
        this.BillingTransactions.BillingTransactionItems[index].IsValidSelDepartment = true;
        this.BillingTransactions.BillingTransactionItems[index].IsValidSelItemName = true;

        this.BillingTransactions.BillingTransactionItems[index].IsDoctorMandatory = item.IsDoctorMandatory; //sud:6Feb'19--need to verify once.

        this.FilterBillItems(index);
        this.CheckItemProviderValidation(index);
        if (!this.SelectedAssignedToDr[index]) {
          this.ResetDoctorListOnItemChange(item, index);
        }
      } else
        this.BillingTransactions.BillingTransactionItems[index].IsValidSelItemName = false;
      if (!item && !this.SelectedServDepts[index]) {
        this.BillingTransactions.BillingTransactionItems[index].ItemList = this.BillItems;
      }
      this.CheckForDoubleEntry();
    } else {
      this.BillingTransactions.BillingTransactionItems[index].IsDoubleEntry_Now = false;
      this.BillingTransactions.BillingTransactionItems[index].IsDoubleEntry_Past = false;
    }
    this.calculateTotalAmount();
  }

  public AssignSelectedDoctor(index) {
    let doctor = null;

    if (this.SelectedAssignedToDr[index]) {
      if (
        typeof this.SelectedAssignedToDr[index] == "string" &&
        this.DoctorsList.length
      ) {
        doctor = this.DoctorsList.find(
          (a) =>
            a.FullName.toLowerCase() ==
            this.SelectedAssignedToDr[index].toLowerCase()
        );
      } else if (typeof this.SelectedAssignedToDr[index] == "object")
        doctor = this.SelectedAssignedToDr[index];
      if (doctor) {
        this.BillingTransactions.BillingTransactionItems[index].PerformerId = doctor.EmployeeId;
        this.BillingTransactions.BillingTransactionItems[index].PerformerName = doctor.FullName;
        this.BillingTransactions.BillingTransactionItems[
          index
        ].IsvalidSelPerformerDr = true;
      } else
        this.BillingTransactions.BillingTransactionItems[
          index
        ].IsvalidSelPerformerDr = false;
    } else
      this.BillingTransactions.BillingTransactionItems[
        index
      ].IsvalidSelPerformerDr = true;
  }

  public AssignRequestedByDoctor(index) {
    let doctor = null;

    if (this.SelectedRequestedByDr[index]) {
      if (
        typeof this.SelectedRequestedByDr[index] == "string" &&
        this.DoctorsList.length
      ) {
        doctor = this.DoctorsList.find(
          (a) =>
            a.FullName.toLowerCase() ==
            this.SelectedRequestedByDr[index].toLowerCase()
        );
      } else if (typeof this.SelectedRequestedByDr[index] == "object") {
        doctor = this.SelectedRequestedByDr[index];
      }

      if (doctor) {
        this.BillingTransactions.BillingTransactionItems[index].PrescriberId = doctor.EmployeeId;
        this.BillingTransactions.BillingTransactionItems[index].PrescriberName = doctor.FullName;
        this.BillingTransactions.BillingTransactionItems[
          index
        ].IsValidSelPrescriberDr = true;
      } else {
        this.BillingTransactions.BillingTransactionItems[
          index
        ].IsValidSelPrescriberDr = false;
      }
    } else {
      this.BillingTransactions.BillingTransactionItems[
        index
      ].IsValidSelPrescriberDr = true;
    }
  }


  ServiceDeptOnChange(index) {
    let srvDeptObj = null;

    if (typeof this.SelectedServDepts[index] == "string") {
      if (this.ServiceDeptList.length && this.SelectedServDepts[index])
        srvDeptObj = this.ServiceDeptList.find(
          (a) =>
            a.ServiceDepartmentName.toLowerCase() ==
            this.SelectedServDepts[index].toLowerCase()
        );
    } else if (typeof this.SelectedServDepts[index] == "object") {
      srvDeptObj = this.SelectedServDepts[index];
    }


    if (srvDeptObj) {
      if (
        srvDeptObj.ServiceDepartmentId !=
        this.BillingTransactions.BillingTransactionItems[index]
          .ServiceDepartmentId
      ) {
        this.ResetSelectedRow(index);
        this.BillingTransactions.BillingTransactionItems[
          index
        ].ServiceDepartmentId = srvDeptObj.ServiceDepartmentId;
      }
      this.FilterBillItems(index);
      this.BillingTransactions.BillingTransactionItems[
        index
      ].IsValidSelDepartment = true;
    }
    //else raise an invalid flag
    else {
      this.BillingTransactions.BillingTransactionItems[index].ItemList =
        this.BillItems;
      this.BillingTransactions.BillingTransactionItems[
        index
      ].IsValidSelDepartment = false;
    }
  }
  public FilterBillItems(index) {
    if (
      this.BillingTransactions.BillingTransactionItems[index].ServiceDepartmentId
    ) {
      if (
        this.BillingTransactions.BillingTransactionItems.length &&
        this.BillItems.length
      ) {
        let srvDeptId =
          this.BillingTransactions.BillingTransactionItems[index]
            .ServiceDepartmentId;
        if (this.BillingTransactions.BillingTransactionItems[index].ServiceItemId === null)
          this.ResetSelectedRow(index);
        this.BillingTransactions.BillingTransactionItems[index].ItemList =
          this.BillItems.filter((a) => a.ServiceDepartmentId == srvDeptId);

        let servDeptName = this.GetServiceDeptNameById(srvDeptId);
        if (
          this.BillingTransactions.BillingTransactionItems[index] &&
          this.BillingTransactions.BillingTransactionItems[index]
            .IsDoctorMandatory
        ) {
          this.BillingTransactions.BillingTransactionItems[
            index
          ].UpdateValidator("on", "PerformerId", "required");
        } else {
          this.BillingTransactions.BillingTransactionItems[
            index
          ].UpdateValidator("off", "PerformerId", null);
        }
      }
    } else {
      let billItems = this.BillItems.filter(
        (a) => a.ServiceDepartmentName != "OPD"
      );
      this.BillingTransactions.BillingTransactionItems[index].ItemList =
        billItems;
    }
  }

  //end: autocomplete assign functions  and item filter logic

  ResetAllRowData() {
    //this.showIpBillRequest = false;
    this.SelectedItems = [];
    this.SelectedAssignedToDr = [];
    this.SelectedServDepts = [];
    //this.selectedRequestedByDr = [];
    this.VisitList = [];
    this.BillingTransactions = new BillingTransaction();
    this.AddNewBillTxnItemRow();
    this.AssignRequestedByDoctor(0);
  }

  //----start: add/delete rows-----
  ResetSelectedRow(index) {
    this.SelectedItems[index] = null;
    this.SelectedAssignedToDr[index] = null;
    this.BillingTransactions.BillingTransactionItems[index] =
      this.NewBillingTransactionItem();
  }

  AddNewBillTxnItemRow(index = null) {

    if (index !== null
      && (!this.BillingTransactions.BillingTransactionItems[index] || !(this.BillingTransactions.BillingTransactionItems[index] && this.BillingTransactions.BillingTransactionItems[index].ServiceItemId))) {
      if (index !== 0) {
        this.BillingTransactions.BillingTransactionItems.splice(index, 1);
      }
      return;
    }
    let billItem = this.NewBillingTransactionItem();
    billItem.EnableControl("Price", false);
    this.BillingTransactions.BillingTransactionItems.push(billItem);
    this.PastTests.push(billItem);
    if (index !== null) {
      let new_index = this.BillingTransactions.BillingTransactionItems.length - 1;
      this.SelectedRequestedByDr[new_index] = this.SelectedRequestedByDr[index];
      this.AssignRequestedByDoctor(new_index);
      window.setTimeout(function () {
        document.getElementById("items-box" + new_index).focus();
      }, 200);
    }
  }

  SetFocusById(index: number): void {
    if (!this.SelectedItems[index]) {
      this.coreService.FocusInputById('id_btn_itemRequest_nursing_ip');
    }
  }

  NewBillingTransactionItem(index = null): BillingTransactionItem {
    let billItem = new BillingTransactionItem();
    billItem.Quantity = 1;
    billItem.ItemList = this.BillItems;
    return billItem;
  }

  deleteRow(index: number) {
    this.BillingTransactions.BillingTransactionItems.splice(index, 1);
    this.BillingTransactions.BillingTransactionItems.slice();
    this.SelectedItems.splice(index, 1);
    this.SelectedItems.slice();
    if (
      index == 0 &&
      this.BillingTransactions.BillingTransactionItems.length == 0
    ) {
      this.AddNewBillTxnItemRow();
      this.changeDetectorRef.detectChanges();
    }

    this.CheckForDoubleEntry();
    this.calculateTotalAmount();
  }
  srvDeptValidationMap = [
    { ServDeptName: "USG", IsMandatory: true, ExcludedItems: [] },
    { ServDeptName: "CT Scan", IsMandatory: true, ExcludedItems: [] },
    {
      ServDeptName: "Dental",
      IsMandatory: false,
      ExcludedItems: [
        "[1] IOPAR (x-Ray)",
        "[2A] Dental extractions (Permanent)",
        "[4A] Scaling and Polishing (Gross)",
        "[4B] Scaling and Polishing (Deep)",
      ],
    },
    { ServDeptName: "ULTRASOUND", IsMandatory: true, ExcludedItems: [] },
    {
      ServDeptName: "ULTRASOUND COLOR DOPPLER",
      IsMandatory: true,
      ExcludedItems: [],
    },
    {
      ServDeptName: "NON INVASIVE CARDIO VASCULAR INVESTIGATIONS",
      IsMandatory: true,
      ExcludedItems: [],
    },
    { ServDeptName: "PHYSIOTHERAPY", IsMandatory: true, ExcludedItems: [] },

    {
      ServDeptName: "General Surgery Charges",
      IsMandatory: false,
      ExcludedItems: ["PAC"],
    },
    { ServDeptName: "Lab", IsMandatory: false, ExcludedItems: ["PAP Smear"] },
    {
      ServDeptName: "Ortho Procedures",
      IsMandatory: false,
      ExcludedItems: ["Plaster A (lower Extremity)", "Injection Steroid"],
    },
    {
      ServDeptName: "Biopsy",
      IsMandatory: false,
      ExcludedItems: [
        "B 5-10 blocks",
        "C Single Block Gallbladder,small lumps",
      ],
    },
    {
      ServDeptName: "OBS/GYN Surgery",
      IsMandatory: false,
      ExcludedItems: ["Hydrotobation"],
    },
    {
      ServDeptName: "OT",
      IsMandatory: true,
      ExcludedItems: ["OT Theatre Charge"],
    }, //ot theater charge goes to hospital..
    {
      ServDeptName: "Other",
      IsMandatory: false,
      ExcludedItems: [
        "Dressing Charge (Large)",
        "Dressing Charge (Medium)",
        "Dressing Charge (Small)",
        "Endoscopy",
        "General Round Charge",
        "ICU  Round Charge (New)",
        "ICU Round Charge",
        "Procedure Charge",
        "Suture out",
        "Sututre In (Large)",
        "Sututre In (small)",
        "Colonoscopy",
        "Intubation Charge",
      ],
    },
  ];
  //returns whether doctor is mandatory for current combination of serv-dept and it's item.
  IsDoctorMandatory(serviceDeptName: string, itemName: string): boolean {
    let isDocMandatory = false;
    let dptItmMap = this.srvDeptValidationMap;
    //go inside only when serviceDeptName is provided.
    if (serviceDeptName) {
      //check if provided serviceDeptName is present in our map--default is false.
      let curMap = dptItmMap.find((s) => s.ServDeptName == serviceDeptName);
      if (curMap) {
        //check if serviceDeptName is in mandatory map or non-mandatory map.
        if (curMap.IsMandatory) {
          isDocMandatory = true; //default true for Mandatory srv-depts
          //false when provided item is excluded from mandatory service department
          if (curMap.ExcludedItems.find((itm) => itm == itemName)) {
            isDocMandatory = false;
          }
        } else if (curMap.IsMandatory == false) {
          isDocMandatory = false; //default false for NON-Mandatory srv-depts
          //true when provided item is excluded from non-mandatory service department
          if (curMap.ExcludedItems.find((itm) => itm == itemName)) {
            isDocMandatory = true;
          }
        }
      } else {
        isDocMandatory = false;
      }
    }
    return isDocMandatory;
  }


  CheckItemProviderValidation(index: number) {
    this.BillingTransactions.BillingTransactionItems[index].UpdateValidator(
      "off",
      "PerformerId",
      null
    );
  }

  //start: list formatters

  ItemsListFormatter(data: any): string {
    let html: string = "";
    if (this.SearchByItemCode) {
      html = data["ItemCode"] + "&nbsp;&nbsp;" + data["ItemName"] + "&nbsp;&nbsp;";
      html += "(<i>" + data["ServiceDepartmentName"] + "</i>)";
    } else {
      html = data["ServiceItemId"] + "&nbsp;&nbsp;" + data["ItemName"] + "&nbsp;&nbsp;";
      html += "(<i>" + data["ServiceDepartmentName"] + "</i>)";
    }

    return html;
  }

  DoctorListFormatter(data: any): string {
    return data["FullName"];
  }
  ServiceDeptListFormatter(data: any): string {
    return data["ServiceDepartmentName"];
  }
  patientListFormatter(data: any): string {
    let html = data["ShortName"] + " [ " + data["PatientCode"] + " ]";
    return html;
  }
  //start: list formatters

  Cancel() {
    this.EmitBillItemReq.emit({ action: "close", data: null });
  }

  OnPriceCategoryChange($event) {
    let billingPropertyName = $event.propertyName;
    let billingCategoryName = $event.categoryName;

    if (this.BillItems != null && this.BillItems.length > 0) {
      this.BillItems.forEach((itm) => {
        itm.Price = itm[billingPropertyName] ? itm[billingPropertyName] : 0;
        itm.PriceCategory = billingCategoryName;
      });
    }

    if (
      this.BillingTransactions.BillingTransactionItems &&
      this.BillingTransactions.BillingTransactionItems.length > 0
    ) {
      this.BillingTransactions.BillingTransactionItems.forEach((txnItm) => {
        let currBillItem = this.BillItems.find(
          (billItem) =>
            billItem.ServiceItemId == txnItm.ServiceItemId &&
            billItem.ServiceDepartmentId == txnItm.ServiceDepartmentId
        );
        if (currBillItem) {
          txnItm.Price = currBillItem[billingPropertyName]
            ? currBillItem[billingPropertyName]
            : 0;
          txnItm.PriceCategory = billingCategoryName;
        }
      });
    }
  }

  ResetDoctorListOnItemChange(item, index) {
    if (item) {
      let docArray = null;
      let currItemPriceCFG = this.BillItems.find(
        (a) =>
          a.ItemId == item.ItemId &&
          a.ServiceDepartmentId == item.ServiceDepartmentId
      );
      if (currItemPriceCFG) {
        let docJsonStr = currItemPriceCFG.DefaultDoctorList;
        if (docJsonStr) {
          docArray = JSON.parse(docJsonStr);
        }
      }
      if (docArray && docArray.length > 1) {
        this.BillingTransactions.BillingTransactionItems[
          index
        ].AssignedDoctorList = [];

        docArray.forEach((docId) => {
          let currDoc = this.DoctorsList.find((d) => d.EmployeeId == docId);
          if (currDoc) {
            this.SelectedAssignedToDr[index] = null;
            this.BillingTransactions.BillingTransactionItems[
              index
            ].AssignedDoctorList.push(currDoc);
          }
        });
      } else if (docArray && docArray.length == 1) {
        let currDoc = this.DoctorsList.find((d) => d.EmployeeId == docArray[0]);
        if (currDoc) {
          this.SelectedAssignedToDr[index] = currDoc.FullName;
          this.AssignSelectedDoctor(index);
        }
      } else {
        this.SelectedAssignedToDr[index] = null;
        this.BillingTransactions.BillingTransactionItems[
          index
        ].AssignedDoctorList = this.DoctorsList;
      }
    }
  }

  assignDocterlist(row, i) {
    if (row.ItemId == 0) {
      this.BillingTransactions.BillingTransactionItems[i].AssignedDoctorList =
        this.DoctorsList;
    }
  }

  HasDoubleEntryInPast() {
    if (this.PastTestList && this.PastTestList.length > 0) {
      var currDate = moment().format("YYYY-MM-DD HH:mm:ss");
      if (
        this.BillRequestDoubleEntryWarningTimeHrs &&
        this.BillRequestDoubleEntryWarningTimeHrs != 0
      ) {
        this.PastTestList.forEach((a) => {
          //var diff = moment.duration(a.CreatedOn.diff(currDate));
          if (
            this.DateDifference(currDate, a.CreatedOn) <
            this.BillRequestDoubleEntryWarningTimeHrs
          ) {
            this.PastTestList_ForDuplicate.push(a);
          }
        });
      }
    }
  }

  CheckForDoubleEntry() {
    this.BillingTransactions.BillingTransactionItems.forEach((itm) => {
      if (
        this.BillingTransactions.BillingTransactionItems.filter(
          (a) =>
            a.ServiceDepartmentId == itm.ServiceDepartmentId &&
            a.ServiceItemId == itm.ServiceItemId
        ).length > 1
      ) {
        itm.IsDoubleEntry_Now = true;
        //this.msgBoxServ.showMessage('warning', ["This item is already entered"]);
      } else {
        itm.IsDoubleEntry_Now = false;
      }
      this.HasDoubleEntryInPast();
      if (
        this.PastTestList_ForDuplicate &&
        this.PastTestList_ForDuplicate.find(
          (a) =>
            a.ServiceDepartmentId == itm.ServiceDepartmentId &&
            a.ItemId == itm.ItemId
        )
      ) {
        itm.IsDoubleEntry_Past = true;
        //this.msgBoxServ.showMessage('warning', ["This item is already entered"]);
      } else {
        itm.IsDoubleEntry_Past = false;
      }
    });
  }

  public DateDifference(currDate, startDate): number {


    var diffHrs = moment(currDate, "YYYY/MM/DD HH:mm:ss").diff(
      moment(startDate, "YYYY/MM/DD HH:mm:ss"),
      "hours"
    );
    return diffHrs;
  }

  public OnLabTypeChange() {
    this.BillingTransactions.BillingTransactionItems.forEach((item) => {
      item.LabTypeName = this.LabTypeName;
    });
    this.FilterBillItems(0);

    if (this.LabTypeName) {
      if (localStorage.getItem("NursingSelectedLabTypeName")) {
        localStorage.removeItem("NursingSelectedLabTypeName");
      }
      localStorage.setItem("NursingSelectedLabTypeName", this.LabTypeName);
      let ptr = this.coreService.labTypes.find(
        (p) => p.DisplayName == this.LabTypeName
      );
    } else {
      this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, ["Please select Lab Type Name."]);
    }
  }

  SetLabTypeNameInLocalStorage() {
    let labtypeInStorage = localStorage.getItem("NursingSelectedLabTypeName");
    if (this.coreService.labTypes.length == 1) {
      localStorage.setItem("NursingSelectedLabTypeName", this.coreService.labTypes[0].LabTypeName);
      return;
    } else if (this.coreService.labTypes.length == 0) {
      localStorage.setItem("NursingSelectedLabTypeName", 'op-lab');
      return;
    }
    if (labtypeInStorage) {
      let selectedLabType = this.coreService.labTypes.find(
        (val) => val.LabTypeName == labtypeInStorage
      );
      if (selectedLabType) {
        this.LabTypeName = labtypeInStorage;
      } else {
        localStorage.removeItem("NursingSelectedLabTypeName");
        let defaultLabType = this.coreService.labTypes.find(
          (type) => type.IsDefault == true
        );
        if (!defaultLabType) {
          this.LabTypeName = this.coreService.labTypes[0].LabTypeName;
        } else {
          this.LabTypeName = defaultLabType.LabTypeName;
        }
        localStorage.setItem(
          "NursingSelectedLabTypeName",
          this.LabTypeName
        );
      }
    } else {
      let defaultLabType = this.coreService.labTypes.find(
        (type) => type.IsDefault == true
      );
      if (!defaultLabType) {
        this.LabTypeName = this.coreService.labTypes[0].LabTypeName;
      } else {
        this.LabTypeName = defaultLabType.LabTypeName;
      }
    }
  }

  calculateTotalAmount() {
    this.TotalAmounts = this.BillingTransactions.BillingTransactionItems.reduce(function (acc, obj) { return acc + ((obj.Price * obj.Quantity)); }, 0);

  }

  public GetAllDepartmentsList() {
    this.clinicalNoteBLService.GetAllDepartmentsList().subscribe((res: DanpheHTTPResponse) => {
      if (res.Status === ENUM_DanpheHTTPResponses.OK) {
        this.DepartmentsList = res.Results;
        //console.log(this.DepartmentsList)
      }
      else {
        this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ["Unable to get Departmets List"]);
      }
    });
  }

  public GetBillingSummaryForPatient() {
    this.clinicalNoteBLService.GetBillingSummaryForPatient(this.patientId, this.visitId).subscribe((res: DanpheHTTPResponse) => {
      if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
        console.log(res);

        const results = res;

        // Extract TotalDepositAmount and TotalPendingBillAmount
        const totalDepositAmount = results.Results.TotalDepositAmount;
        const totalPendingBillAmount = results.Results.TotalPendingBillAmount;

        // Calculate RemainingBalanceAmount
        this.BillingDetails = {
          TotalDepositAmount: totalDepositAmount,
          TotalPendingBillAmount: totalPendingBillAmount,
          RemainingBalanceAmount: totalDepositAmount - totalPendingBillAmount
        };
      }
    })
  }
  ngOnChanges() {
    this.GetBillingSummaryForPatient();
  }
  public old_priceCategoryId: number = null;
  OnSchemePriceCategoryChanged(scheme: SchemePriceCategory_DTO): void {
    if (scheme) {
      if (this.old_priceCategoryId !== scheme.PriceCategoryId) {
        this.old_priceCategoryId = scheme.PriceCategoryId;
        this.GetServiceItems(scheme.SchemeId, scheme.PriceCategoryId);
      }
    }
  }

  GetServiceItems(schemeId: number, priceCategoryId: number): void {
    this.billingMasterBlService.GetServiceItems(ENUM_ServiceBillingContext.IpBilling, schemeId, priceCategoryId).subscribe((res: DanpheHTTPResponse) => {
      if (res.Status === ENUM_DanpheHTTPResponses.OK && res.Results) {
        this.ServiceItems = res.Results;
        this.BillItems = this.ServiceItems;
        this.InitiateComponent();
      }
    });
  }

  handleConfirm(): void {
    this.Loading = true;
    this.SubmitBillingTransaction();
  }

  handleCancel(): void {
    this.Loading = false;
  }
}
