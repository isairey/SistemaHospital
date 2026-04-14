import { ChangeDetectorRef, Component, Input } from "@angular/core";
import { CurrentVisitContextVM } from "../../../appointments/shared/current-visit-context.model";
import { Visit } from "../../../appointments/shared/visit.model";
import { VisitService } from "../../../appointments/shared/visit.service";
import { BillingBLService } from "../../../billing/shared/billing.bl.service";
import { CoreService } from "../../../core/shared/core.service";
import { InPatientLabTest } from "../../../labs/shared/InpatientLabTest";
import { LabsBLService } from "../../../labs/shared/labs.bl.service";
import { Patient } from "../../../patients/shared/patient.model";
import { PatientService } from "../../../patients/shared/patient.service";
import { CancelStatusHoldingModel } from "../../../shared/common-models";
import { DanpheCache, MasterType } from "../../../shared/danphe-cache-service-utility/cache-services";
import { NepaliDateInGridColumnDetail, NepaliDateInGridParams } from "../../../shared/danphe-grid/NepaliColGridSettingsModel";
import { GridEmitModel } from "../../../shared/danphe-grid/grid-emit.model";
import { MessageboxService } from "../../../shared/messagebox/messagebox.service";
import { ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status, ENUM_Module } from "../../../shared/shared-enums";
import { ClinicalPatientService } from "../../shared/clinical-patient.service";
import { ClinicalNoteBLService } from "../../shared/clinical.bl.service";
import { SelectedBillorCancel_DTO } from "../../shared/dto/SelectedBillForCancel_DTO.Model";

@Component({
    selector: "Ward-Request",
    templateUrl: "./ward-request.component.html",
    styles: [
        `
      .mar-btm-25 {
        margin-bottom: 25px;
      }
    `,
    ],
})
export class WardRequestComponent {
    @Input("isPopUp") public isPopUp: boolean = false;
    public ProvisionalItemsDetails: Array<any> = [];

    public CurrentPatient: Patient = new Patient();
    public CurrentVisit: Visit = new Visit();
    public AllBillItems: Array<any>;
    public inPatientId: number = null;
    public inPatientVisitId: number = null;
    public showNewIpRequestPopup: boolean = false;
    public showPatientSearch: boolean = true;
    public loading = false;

    public NursingCounterId: number = null;
    public CurrPatVisitContext: CurrentVisitContextVM = null;
    //public NursingWardBillingColumns: any;
    public NursingWardBillingColumns: NursingWardBillingColumns[];
    public NepaliDateInGridSettings: NepaliDateInGridParams = new NepaliDateInGridParams();
    showConfirmationBox: boolean = false;
    public selectedBillForCancel: SelectedBillorCancel_DTO = new SelectedBillorCancel_DTO();
    public cancelRemarks: string = null;
    public selIndexForCancel: number;

    public overallCancellationRule: any;
    public NursingCancellationRule: CancelStatusHoldingModel = new CancelStatusHoldingModel();
    public isCancelRuleEnabled: boolean;


    public NursingCancellationNumber: number = 0;
    public HidePriceCol: boolean = true;
    @Input("price-category-id")
    public PriceCategoryId: number = 0;


    constructor(
        public selectedPatientService: ClinicalPatientService,
        public billingBLService: BillingBLService,
        public patientService: PatientService,
        public visitService: VisitService,
        public changeDetector: ChangeDetectorRef,
        public msgBoxServ: MessageboxService,
        public clinicalNoteBLService: ClinicalNoteBLService,
        public labBLService: LabsBLService,
        public coreService: CoreService
    ) {

        this.overallCancellationRule = this.coreService.GetIpBillCancellationRule();

        if (this.overallCancellationRule && this.overallCancellationRule.Enable) {
            this.isCancelRuleEnabled = this.overallCancellationRule.Enable;
            this.NursingCancellationRule.labStatus = this.overallCancellationRule.LabItemsInNursing;
            this.NursingCancellationRule.radiologyStatus = this.overallCancellationRule.ImagingItemsInNursing;
        }


        this.GridColumnSettings();


        this.CurrentPatient = this.patientService.globalPatient;
        this.CurrentVisit = this.visitService.globalVisit;

        if (this.selectedPatientService.SelectedPatient.PatientId && this.selectedPatientService.SelectedPatient.PatientVisitId) {
            this.GetPatientProvisionalItems(
                this.selectedPatientService.SelectedPatient.PatientId,
                this.selectedPatientService.SelectedPatient.PatientVisitId
            );
            this.GetCurrentVisitContext();
        } else {
        }

        this.GetBillingItems();
        this.GetBillingCounterForNursing();
        this.NepaliDateInGridSettings.NepaliDateColumnList.push(
            new NepaliDateInGridColumnDetail("RequisitionDate", true)
        );
    }

    ngOnInit() { }

    GridColumnSettings() {
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
            if (data.ShowPrice == true) {
                this.HidePriceCol = false;
            } else {
                this.HidePriceCol = true;
            }

        }

        this.NursingWardBillingColumns = [
            {
                headerName: "Requested Date",
                field: "RequisitionDate",
                width: 80,
            },
            {
                headerName: "ProvisionalReceiptNo",
                field: "ProvisionalReceiptNo",
                width: 100,
                cellRenderer: WardRequestComponent.ProvisionalReceitNoRenderer
            },
            {
                headerName: "Department",
                field: "ServiceDepartmentName",
                width: 100,
            },
            {
                headerName: "Item Name",
                width: 100,
                field: "ItemName"
            },
            {
                headerName: "Performer",
                width: 100,
                field: "PerformerName",
            },
            { headerName: "Qty", field: "Quantity", width: 30 },
            { headerName: "Sub Total", field: "SubTotal", width: 30, hide: this.HidePriceCol },
            { headerName: "Added By", field: "RequestingUserName", width: 80 },
            { headerName: "Status", field: "OrderStatus", width: 80 },
            { headerName: "Action", cellRenderer: this.GetActionList, width: 80 },
        ];
    }

    static ProvisionalReceitNoRenderer(params) {
        let data: string = 'PR/' + params.data.ProvisionalReceiptNo;
        return data;
    }

    GetActionList(params) {
        if (params.data.AllowCancellation) {
            return `<a danphe-grid-action="cancel" class="grid-action btn btn-danger">
              Cancel
           </a>`;
        } else {
            return `<span title="Can't Cancel">Cannot cancel</span>`;
        }
    }

    public GetCurrentVisitContext() {
        this.labBLService
            .GetDataOfInPatient(
                this.selectedPatientService.SelectedPatient.PatientId,
                this.selectedPatientService.SelectedPatient.PatientVisitId
            )
            .subscribe(
                (res) => {
                    if (res.Status === ENUM_DanpheHTTPResponses.OK && res.Results.Current_WardBed) {
                        this.CurrPatVisitContext = res.Results;
                    } else {
                        this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, [
                            "Problem! Cannot get the Current Visit Context ! ",
                        ]);
                    }
                },
                (err) => {
                    console.log(err.ErrorMessage);
                }
            );
    }

    GetBillingCounterForNursing() {
        let allBilCntrs: Array<any>;
        allBilCntrs = DanpheCache.GetData(MasterType.BillingCounter, null);
        let nursingCounter = allBilCntrs.filter(
            (cnt) => cnt.CounterType == "NURSING"
        );
        if (nursingCounter) {
            this.NursingCounterId = nursingCounter.find(
                (cntr) => cntr.CounterId
            ).CounterId;
        }

    }

    GetPatientProvisionalItems(patientId: number, patientVisitId: number) {
        let module = ENUM_Module.NURSING;
        this.billingBLService.GetInPatientProvisionalItemList(patientId, patientVisitId, module)
            .subscribe((res) => {

                if (this.isCancelRuleEnabled) {
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

    public CloseOrderView() {
        this.showNewIpRequestPopup = false;
    }
    public GetBillingItems() {
        this.billingBLService.GetBillItemList().subscribe(
            (res) => {
                if (res.Status === ENUM_DanpheHTTPResponses.OK) {
                    if (res.Results.length) {
                        this.AllBillItems = res.Results;
                        this.AllBillItems = this.AllBillItems.filter(
                            (val) => val.ServiceDepartmentName != "EMERGENCY"
                        );
                    } else {
                        this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, [
                            "unable to get items for searchbox.. check logs for more details.",
                        ]);
                        console.log(res.ErrorMessage);
                    }
                }
            },
            (err) => {
                console.log(err.ErrorMessage);
            }
        );
    }

    AddNewIpRequest() {
        if (this.NursingCounterId) {
            this.showNewIpRequestPopup = false;
            this.showPatientSearch = true;
            this.changeDetector.detectChanges();
            this.showNewIpRequestPopup = true;
            this.showPatientSearch = false;
        } else {
            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, [
                "Please Try again Later as Nursing Counter not found.",
            ]);
        }
    }

    OnNewIpRequestClosed() {
        this.GetPatientProvisionalItems(
            this.selectedPatientService.SelectedPatient.PatientId,
            this.selectedPatientService.SelectedPatient.PatientVisitId
        );
    }

    cancelRequest(billTransactionItem, index: number) {
        let labItem: InPatientLabTest = new InPatientLabTest();

        billTransactionItem.CancelRemarks = this.cancelRemarks.trim();
        console.log(billTransactionItem);
        if (
            billTransactionItem.CancelRemarks &&
            billTransactionItem.CancelRemarks.length
        ) {
            if (billTransactionItem) {
                var cancelLabTestOfCurrentPatient = window.confirm(
                    "Are You Sure You want to cancel this item for this Patient?"
                );

                if (cancelLabTestOfCurrentPatient) {
                    billTransactionItem.CounterId = this.NursingCounterId;
                    billTransactionItem.ItemIntegrationName = billTransactionItem.IntegrationName;
                    if (
                        billTransactionItem.ItemIntegrationName &&
                        billTransactionItem.ItemIntegrationName == "radiology"
                    ) {
                        this.clinicalNoteBLService
                            .CancelItemRequest(billTransactionItem)
                            .subscribe((res) => {
                                if (res.Status === ENUM_DanpheHTTPResponses.OK) {
                                    this.ProvisionalItemsDetails.splice(index, 1);
                                    this.ProvisionalItemsDetails.slice();
                                    this.changeDetector.detectChanges();
                                    this.msgBoxServ.showMessage("success", [
                                        "This item is Cancelled",
                                    ]);
                                    this.showConfirmationBox = false;
                                    this.GetPatientProvisionalItems(
                                        this.selectedPatientService.SelectedPatient.PatientId,
                                        this.selectedPatientService.SelectedPatient.PatientVisitId
                                    );
                                    this.loading = false;

                                } else {
                                    this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ["Please Try later"]);
                                    this.loading = false;
                                }
                            });
                    } else if (
                        billTransactionItem.ItemIntegrationName &&
                        billTransactionItem.ItemIntegrationName.toLowerCase() ==
                        "lab"
                    ) {


                        this.clinicalNoteBLService
                            .CancelItemRequest(billTransactionItem)
                            .subscribe((res) => {
                                if (res.Status === ENUM_DanpheHTTPResponses.OK) {
                                    this.ProvisionalItemsDetails.splice(index, 1);
                                    this.ProvisionalItemsDetails.slice();
                                    this.changeDetector.detectChanges();
                                    this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Success, [
                                        "This item is Cancelled",
                                    ]);
                                    this.showConfirmationBox = false;
                                    this.GetPatientProvisionalItems(
                                        this.selectedPatientService.SelectedPatient.PatientId,
                                        this.selectedPatientService.SelectedPatient.PatientVisitId
                                    );
                                    this.loading = false;
                                } else {
                                    this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ["Please Try later"]);
                                    this.loading = false;
                                }
                            });
                    } else {
                        this.clinicalNoteBLService
                            .CancelBillRequest(billTransactionItem)
                            .subscribe((res) => {
                                if (res.Status === ENUM_DanpheHTTPResponses.OK) {
                                    this.ProvisionalItemsDetails.splice(index, 1);
                                    this.ProvisionalItemsDetails.slice();
                                    this.changeDetector.detectChanges();
                                    this.msgBoxServ.showMessage("success", [
                                        "This item is Cancelled",
                                    ]);
                                    this.showConfirmationBox = false;
                                    this.GetPatientProvisionalItems(
                                        this.CurrentPatient.PatientId,
                                        this.CurrentVisit.PatientVisitId
                                    );
                                    this.loading = false;
                                } else {
                                    this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ["Please Try later"]);
                                    this.loading = false;
                                }
                            });
                    }
                }
            }
        } else {
            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, [
                "Please Write Cancellation Remarks",
            ]);
        }
    }

    NursingWardBillingGridActions($event: GridEmitModel) {
        this.selectedBillForCancel = null;
        switch ($event.Action) {
            case "cancel":
                {
                    this.cancelRemarks = "";
                    this.selectedBillForCancel = $event.Data;
                    this.selIndexForCancel = this.ProvisionalItemsDetails.findIndex(
                        (p) =>
                            p.BillingTransactionItemId ==
                            this.selectedBillForCancel.BillingTransactionItemId
                    );
                    if (this.selectedBillForCancel && this.selIndexForCancel > -1) {
                        this.showConfirmationBox = true;
                    }
                }
                break;
            default:
                break;
        }
    }
}
