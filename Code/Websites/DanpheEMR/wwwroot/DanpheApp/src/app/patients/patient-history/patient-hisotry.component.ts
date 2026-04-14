import { ChangeDetectorRef, Component, Input } from '@angular/core';
import { Lightbox } from 'angular2-lightbox';
import * as moment from 'moment/moment';
import { CoreService } from "../../core/shared/core.service";
import { CommonFunctions } from '../../shared/common.functions';
import { MessageboxService } from '../../shared/messagebox/messagebox.service';
import { Enum_PatientHistoryViewCategory } from '../../shared/shared-enums';
import { PatientFilesModel } from '../shared/patient-files.model';
import { PatientsBLService } from '../shared/patients.bl.service';
@Component({
    selector: "patient-history",
    templateUrl: "./patient-history.html"
})
export class PatientHistoryComponent {
    patientId: number = 0;
    labHistory: any;
    imagingHistory: any;
    billingHistory: any;
    visitHistory: any;
    drugDetails: any;
    uploadedDocuments: any;
    admissionHistory: any;
    showVisitDetails: boolean = true;
    showAdmissionDetails: boolean = false;
    showDrugDetails: boolean = false;
    showLabDetails: boolean = false;
    showRadiologyDetails: boolean = false;
    showBillDetails: boolean = false;
    showDocumentsDetails: boolean = false;
    showPatientHistory: boolean = false;
    showuploadedDocuments: boolean = false;
    showImage: boolean = false;
    isShowUploadMode: boolean = false;
    isShowListMode: boolean = false;
    showUploadFiles: boolean = false;
    album = [];
    @Input("selectedPatient") selectedPatient: any;

    /////For Binding the Image to Popup box 
    PopupImageData: PatientFilesModel = new PatientFilesModel();

    totalBillAmount: number = 0;
    paidAmount: number = 0;
    cancelledBillAmount: number = 0;
    unpaidBillAmount: number = 0;
    returnedAmount: number = 0;
    depositAmount: number = 0;
    discountAmount: number = 0;
    balance: number = 0;
    checkouttimeparameter: string;
    ShowSalesSummary: boolean = false;

    constructor(public patientBLService: PatientsBLService, public lightbox: Lightbox, public changeDetector: ChangeDetectorRef,
        public msgBoxServ: MessageboxService, public coreService: CoreService) {
        this.checkouttimeparameter = this.coreService.Parameters.find(p => p.ParameterGroupName == "ADT" && p.ParameterName == "CheckoutTime").ParameterValue;
    }

    @Input("showPatientHistory")
    public set value(val: boolean) {
        this.showPatientHistory = val;
        if (this.showPatientHistory) {
            this.getPatientVisitList();
            this.getDrugHistory();
            this.getAdmissionHistory();
            this.getLabResult();
            this.getImagingResult();
            this.getBillingHistory();
            this.changeDetector.detectChanges();
            this.isShowUploadMode = false;
            this.isShowListMode = true;
            this.patientId = this.selectedPatient.PatientId;
        }
    }

    public getLabResult() {
        this.patientBLService.GetPatientLabReport(this.selectedPatient.PatientId)
            .subscribe(res => {
                if (res.Status == 'OK') {
                    if (res.Results)
                        this.labHistory = res.Results;
                    this.labHistory = this.labHistory.filter(a => a.Components.length > 0);
                }
                else {
                    this.msgBoxServ.showMessage("error", [res.ErrorMessage]);
                }
            },
                err => {
                    this.msgBoxServ.showMessage("error", ["Failed to get Lab Results"]);
                });
    }
    public getAdmissionHistory() {
        this.patientBLService.GetAdmissionHistory(this.selectedPatient.PatientId)
            .subscribe(res => {
                if (res.Status == 'OK') {
                    if (res.Results)
                        this.admissionHistory = res.Results;
                    var adt = this.admissionHistory;
                    this.calculateDays();
                }
                else {
                    this.msgBoxServ.showMessage("error", [res.ErrorMessage]);
                }
            },
                err => {
                    this.msgBoxServ.showMessage("error", ["Failed to get Lab Results"]);
                });
    }
    public calculateDays() {
        this.admissionHistory.forEach(adt => {
            adt.BedInformations.forEach(bed => {
                //calculate days
                var duration = CommonFunctions.calculateADTBedDuration(bed.StartDate, bed.EndDate, this.checkouttimeparameter);
                if (duration.days > 0 && duration.hours)
                    bed.Days = duration.days + ' + ' + duration.hours + ' hour';
                else if (duration.days && !duration.hours)
                    bed.Days = duration.days;
                else if (!duration.days && duration.hours)
                    bed.Days = duration.hours + ' hour';
                bed.Action = bed.Action.charAt(0).toUpperCase() + bed.Action.slice(1);
            });
        });
    }
    public getPatientVisitList() {
        this.patientBLService.GetPatientVisitList(this.selectedPatient.PatientId)
            .subscribe(res => {
                if (res.Status == 'OK') {
                    if (res.Results) {
                        this.visitHistory = res.Results;
                        //this is for formatting the time to show properly in html(to show properly to the client)....
                        this.visitHistory.forEach(visit => {
                            visit.VisitTime = moment(visit.VisitTime, "hhmm").format('hh:mm A');
                        });
                    }
                }
                else {
                    this.msgBoxServ.showMessage("error", [res.ErrorMessage]);
                }
            },
                err => {
                    this.msgBoxServ.showMessage("error", ["Failed to get Visit History"]);
                });
    }

    public getImagingResult() {
        this.patientBLService.GetPatientImagingReports(this.selectedPatient.PatientId)
            .subscribe(res => {
                if (res.Status == 'OK') {
                    if (res.Results.length)
                        this.imagingHistory = res.Results;
                }
                else {
                    this.msgBoxServ.showMessage("error", [res.ErrorMessage]);

                }
            },
                err => {
                    this.msgBoxServ.showMessage("error", ["Failed to get Imaging Results"]);

                });
    }
    public getBillingHistory() {
        this.patientBLService.GetPatientBillHistory(this.selectedPatient.PatientCode)
            .subscribe(res => {
                if (res.Status == 'OK') {
                    if (res.Results) {
                        this.billingHistory = res.Results;
                        this.CalculateTotal();
                    }
                }
                else {
                    this.msgBoxServ.showMessage("error", [res.ErrorMessage]);
                }
            },
                err => {
                    this.msgBoxServ.showMessage("error", ["Failed to get BillingHistory"]);
                });
    }
    public getDrugHistory() {
        this.patientBLService.GetPatientDrugList(this.selectedPatient.PatientId)
            .subscribe(res => {
                if (res.Status == 'OK') {
                    if (res.Results) {
                        this.drugDetails = res.Results;
                    }
                }
                else {
                    this.msgBoxServ.showMessage("error", [res.ErrorMessage]);
                }
            },
                err => {
                    this.msgBoxServ.showMessage("error", ["Failed to get BillingHistory"]);
                });
    }
    Close() {
        this.showImage = false;
        this.showPatientHistory = true;
    }
    public updateView(category: number): void {
        this.showVisitDetails = (category == Enum_PatientHistoryViewCategory.VisitDetails);
        this.showAdmissionDetails = (category == Enum_PatientHistoryViewCategory.AdmissionDetails);
        this.showDrugDetails = (category == Enum_PatientHistoryViewCategory.DrugDetails);
        this.showLabDetails = (category == Enum_PatientHistoryViewCategory.LadDetails);
        this.showRadiologyDetails = (category == Enum_PatientHistoryViewCategory.RadiologyDetails);
        this.showBillDetails = (category == Enum_PatientHistoryViewCategory.BillingDetails);
        this.showDocumentsDetails = (category == Enum_PatientHistoryViewCategory.DocumentsDetails);
        this.ShowSalesSummary = (category == Enum_PatientHistoryViewCategory.SalesSummaryReport);
    }
    public CalculateTotal() {
        if (this.billingHistory.paidBill.length) {
            this.billingHistory.paidBill.forEach(bill => {
                this.paidAmount = this.paidAmount + bill.SubTotal;
                this.discountAmount = this.discountAmount + bill.Discount;
            });
        }
        if (this.billingHistory.unpaidBill.length) {
            this.billingHistory.unpaidBill.forEach(bill => {
                this.unpaidBillAmount = this.unpaidBillAmount + bill.SubTotal;
                this.discountAmount = this.discountAmount + bill.Discount;
            });
        }
        if (this.billingHistory.returnBill) {
            this.billingHistory.returnBill.forEach(bill => {
                this.returnedAmount = this.returnedAmount + bill.ReturnedAmount;
                this.discountAmount = this.discountAmount + bill.Discount;
            });

        }
        if (this.billingHistory.deposits) {
            this.billingHistory.deposits.forEach(bill => {
                if (bill.TransactionType == "Deposit")
                    this.depositAmount = this.depositAmount + bill.Amount;
                else
                    this.depositAmount = this.depositAmount - bill.Amount;
            });

        }
        if (this.billingHistory.cancelBill) {
            this.billingHistory.cancelBill.forEach(bill => {
                this.cancelledBillAmount = this.cancelledBillAmount + bill.CancelledAmount;
                this.discountAmount = this.discountAmount + bill.Discount;
            });

        }
        this.totalBillAmount = this.paidAmount + this.unpaidBillAmount + this.returnedAmount + this.cancelledBillAmount;
        this.balance = this.depositAmount - this.unpaidBillAmount;
        this.ParseAmounts();
    }

    public ParseAmounts() {
        this.paidAmount = CommonFunctions.parseAmount(this.paidAmount);
        this.returnedAmount = CommonFunctions.parseAmount(this.returnedAmount);
        this.depositAmount = CommonFunctions.parseAmount(this.depositAmount);
        this.cancelledBillAmount = CommonFunctions.parseAmount(this.cancelledBillAmount);
        this.totalBillAmount = CommonFunctions.parseAmount(this.totalBillAmount);
        this.balance = CommonFunctions.parseAmount(this.balance);
        this.discountAmount = CommonFunctions.parseAmount(this.discountAmount);
    }
}