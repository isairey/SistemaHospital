import { ChangeDetectorRef, Component, EventEmitter, Input, Output } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { AdmissionModel } from "../../adt/shared/admission.model";
import { BedReservationInfo } from "../../adt/shared/bed-reservation-info.model";
import { Bed } from "../../adt/shared/bed.model";
import { BedFeature } from "../../adt/shared/bedfeature.model";
import { PatientBedInfo } from "../../adt/shared/patient-bed-info.model";
import { Ward } from "../../adt/shared/ward.model";
import { Patient_DTO } from "../../claim-management/shared/DTOs/patient.dto";
import { CoreService } from "../../core/shared/core.service";
import { EmergencyService } from "../../emergency/shared/emergency.service";
import { DanpheHTTPResponse } from "../../shared/common-models";
import { MessageboxService } from "../../shared/messagebox/messagebox.service";
import { ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status } from "../../shared/shared-enums";
import { ClinicalNoteBLService } from "../shared/clinical.bl.service";
import { BookAdmission_DTO } from "../shared/dto/book-admission.dto";

@Component({
    selector: "book-admission",
    templateUrl: "./book-admission.component.html"
})
export class BookAdmissionComponent {
    @Input("SelectedPatient") SelectedPatient: Patient_DTO;
    @Input("DoctorName") DoctorName: string;
    @Input("DepartmentName") DepartmentName: string;
    @Input("PriceCategoryId") PriceCategoryId: number;
    @Input("DoctorId") DoctorId: number;
    @Input("DepartmentId") DepartmentId: number;
    @Output("callback-close")
    public callbackClose: EventEmitter<Object> = new EventEmitter<Object>();
    @Output("is-bed-reserved")
    public isBedReserved: EventEmitter<Object> = new EventEmitter<Object>();
    public AdmissionCases: [];
    public admission: BookAdmission_DTO = new BookAdmission_DTO();
    public loading: boolean = false;
    public wardList: Ward[] = [];
    public selectedWard: Ward = new Ward();
    public bedFeatureList: BedFeature[] = [];
    public OriginalBedFeatureList: BedFeature[] = [];
    public disableFeature: boolean = true;
    public CurrentPatientBedInfo: PatientBedInfo = new PatientBedInfo();
    public bedList: Bed[] = [];
    public disableBed: boolean = true;
    public CurrentBedReservation: BedReservationInfo = new BedReservationInfo();
    public CurrentAdmission: AdmissionModel = new AdmissionModel();
    public reservedBedIdByPat: number = null;
    public deptList: any = [];
    public doctorList: any = [];
    public filteredDocList: any = [];
    public patientVisitId: number = 0;
    public patientId: number = 0;
    public PatientPriceCategoryId: number = 0;
    public selectedBedfeature: BedFeature = new BedFeature();
    public selectedBed: Bed = new Bed();
    public reservedBedList: BookAdmission_DTO[] = [];
    public bedIsAlreadyReserved: boolean = false;
    ExistingBedName: string;
    ExistingBedFeatureName: string;
    ExistingWardName: string;
    public BedReservationValidator: FormGroup = null;
    public availableBedList: Bed[] = [];

    constructor(
        private _coreService: CoreService,
        private _emergencyService: EmergencyService,
        public coreService: CoreService,
        public msgBoxServ: MessageboxService,
        public clinicalBlservice: ClinicalNoteBLService,
        public changeDetector: ChangeDetectorRef,


    ) {
        this.AdmissionCases = this.coreService.GetAdmissionCases();
        this.GetReservedBedList();
        const _formBuilder = new FormBuilder();
        this.BedReservationValidator = _formBuilder.group({
            'Case': ['', Validators.required],
            'AdmittingDoctor': ['', Validators.required],
            'DepartmentName': ['', Validators.required],
            'WardName': ['', Validators.required],
            'BedFeatureName': ['', [Validators.required]],
            'BedCode': ['', Validators.required],
            'AdmissionNote': [''],

        });
    }
    ngOnInit() {
        this.admission.DepartmentName = this.DepartmentName;
        this.admission.AdmittingDoctor = this.DoctorName;
        this.BedReservationValidator.patchValue({
            'AdmittingDoctor': this.admission.AdmittingDoctor,
            'DepartmentName': this.admission.DepartmentName,
        });
        this.admission.AdmittingDoctorId = this.DoctorId;
        this.admission.DepartmentId = this.DepartmentId;
        this.PatientPriceCategoryId = this.PriceCategoryId;
        this.patientId = this.SelectedPatient.PatientId;
        this.patientVisitId = this.SelectedPatient.PatientVisitId;
        this.GetDocDptAndWardList();
        this.CheckExistingReservedBed();
        this.GetAvailableBed(this.selectedWard.WardId, this.selectedBedfeature.BedFeatureId);

    }
    ngOnChanges() {
        this.admission.DepartmentName = this.DepartmentName;
        this.admission.AdmittingDoctor = this.DoctorName;
    }
    CheckExistingReservedBed() {
        const bedIsReserved = this.reservedBedList.find(a => a.PatientId === this.SelectedPatient.PatientId);
        if (bedIsReserved) {
            this.bedIsAlreadyReserved = true;
            this.ExistingBedName = bedIsReserved.BedCode;
            this.ExistingBedFeatureName = bedIsReserved.BedFeatureName;
            this.ExistingWardName = bedIsReserved.WardName;

            const reservationInfo = {
                isBedAlreadyReserved: this.bedIsAlreadyReserved,
                bedName: this.ExistingBedName,
                bedFeatureName: this.ExistingBedFeatureName,
                wardName: this.ExistingWardName,
            };
            this.isBedReserved.emit(reservationInfo);
        } else {
            this.bedIsAlreadyReserved = false;
        }

    }

    GetReservedBedList() {
        this.clinicalBlservice.GetReservedBedList()
            .subscribe(res => {
                if (res.Status === ENUM_DanpheHTTPResponses.OK) {
                    this.reservedBedList = res.Results;
                    this.CheckExistingReservedBed();
                } else {
                    this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ['No Reserve Bed Found', res.ErrorMessage]);
                }
            });
    }
    GetAvailableBed(WardId: number, BedFeatureId: number) {
        this.clinicalBlservice.GetAvailableBed(this.selectedWard.WardId, this.selectedBedfeature.BedFeatureId)
            .subscribe(res => {
                if (res.Status === ENUM_DanpheHTTPResponses.OK) {
                    this.bedList = res.Results;
                    if (this.selectedWard.WardId) {
                        this.availableBedList = this.bedList.filter(a => a.IsReserved === false && a.IsOccupied === false && a.IsActive === true && a.WardId == this.selectedWard.WardId)
                    }
                } else {
                    this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ['Bed List is empty', res.ErrorMessage]);
                }
            });
    }
    OnCaseSelected($event) {
        if ($event) {
            this.admission.Case = $event.target.value;
        }

    }
    public GetDocDptAndWardList() {
        this.clinicalBlservice.GetDocDptAndWardList(this.patientId, this.patientVisitId)
            .subscribe(res => {
                if (res.Status === ENUM_DanpheHTTPResponses.OK) {
                    this.doctorList = res.Results.DoctorList;
                    this.filteredDocList = res.Results.DoctorList;
                    this.deptList = res.Results.DepartmentList;
                    this.wardList = res.Results.WardList;
                    // this.deptList.unshift({ "Key": 0, "Value": "All" });

                    if (res.Results.BedReservedForCurrentPat &&
                        res.Results.BedReservedForCurrentPat.ReservedBedInfoId > 0) {
                        this.CurrentBedReservation = Object.assign(new BedReservationInfo(), res.Results.BedReservedForCurrentPat);
                        // this.SetParametersFromReservation();
                    }

                } else {
                    this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ['There is some error, cant get the data !', res.ErrorMessage]);
                }
            });
    }

    public FocusOnInputField(id: string) {
        this._coreService.FocusInputById(id);
    }
    // GetwardList() {
    //     this.clinicalBlservice.GetWards()
    //         .subscribe(res => {
    //             if (res.Status === ENUM_DanpheHTTPResponses.OK) {
    //                 if (res.Results.length) {
    //                     this.wardList = res.Results;
    //                 }
    //                 else {
    //                     this.msgBoxServ.showMessage("failed", ["Failed  to get ward list"]);
    //                     console.log(res.Errors);
    //                 }
    //             }
    //         });
    // }

    OnWardSelected($event) {
        if ($event) {
            this.selectedWard.WardId = $event;
            this.WardChanged(this.selectedWard.WardId);
        }
    }
    public WardChanged(wardId: number, useDataFromReservation: boolean = false) {
        if (wardId) {
            this.disableFeature = false;
            //!useDataFromReservation ? this.CurrentPatientBedInfo.BedFeatureId = null : this.CurrentPatientBedInfo.BedFeatureId;
            this.CurrentPatientBedInfo.BedFeatureId = null;
            this.bedList = null;
            this.CurrentPatientBedInfo.BedPrice = null;
            this.clinicalBlservice.GetWardBedFeatures(wardId, this.PatientPriceCategoryId)
                .subscribe(res => {
                    if (res.Status === ENUM_DanpheHTTPResponses.OK) {
                        if (res.Results.length) {
                            this.bedFeatureList = res.Results;
                            this.OriginalBedFeatureList = res.Results;
                            //!useDataFromReservation ? this.CurrentPatientBedInfo.BedFeatureId = this.bedFeatureList[0].BedFeatureId : this.CurrentBedReservation.BedFeatureId;
                            !useDataFromReservation ? this.CurrentPatientBedInfo.BedFeatureId = null : this.CurrentBedReservation.BedFeatureId;
                            this.changeDetector.detectChanges();
                            this.GetAvailableBed(wardId, this.CurrentPatientBedInfo.BedFeatureId);
                        }
                        else {
                            this.msgBoxServ.showMessage("failed", ["No bed features available"]);
                            this.bedList = null;
                            this.CurrentPatientBedInfo.BedId = 0;
                        }
                    } else {
                        this.msgBoxServ.showMessage("error", [res.ErrorMessage]);
                    }
                },
                    err => {
                        this.msgBoxServ.showMessage("error", ["Failed to get available beds. " + err.ErrorMessage]);
                    });
        }
        else {
            this.bedFeatureList = null;
            this.bedList = null;
        }

    }
    OnBedFeatureSelected($event) {
        if ($event) {
            this.selectedBedfeature.BedFeatureId = $event;
            this.GetAvailableBed(this.selectedWard.WardId, this.selectedBedfeature.BedFeatureId);
        }

    }
    // public GetAvailableBed(wardId: number, bedFeatureId: number) {
    //     if (wardId && bedFeatureId) {
    //         this.CurrentPatientBedInfo.BedId = null; //default
    //         this.bedList = null;
    //         var selectedFeature = this.bedFeatureList.find(a => a.BedFeatureId == bedFeatureId);
    //         this.CurrentPatientBedInfo.BedPrice = selectedFeature.BedPrice;
    //         this.disableBed = false;
    //         this.clinicalBlservice.GetAvailableBeds(wardId, bedFeatureId)
    //             .subscribe((res: DanpheHTTPResponse) => {
    //                 if (res.Status == ENUM_DanpheHTTPResponses.OK) {
    //                     if (res.Results.availableBeds.length) {
    //                         this.bedList = res.Results.availableBeds;
    //                         this.availableBedList= 
    //                         //this.InitializeBedBillItem(res.Results.BedbillItm)
    //                     }
    //                     else {
    //                         this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ["No beds are available for this type."]);
    //                         this.bedList = null;
    //                         this.CurrentPatientBedInfo.BedId = 0;
    //                     }
    //                 } else {
    //                     this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, [res.ErrorMessage]);
    //                 }
    //             },
    //                 err => {
    //                     this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ["Failed to get available beds. " + err.ErrorMessage]);
    //                 });
    //     }
    //     else {
    //         this.bedList = null;
    //     }
    // }
    OnBedSelected($event) {
        if ($event) {
            this.selectedBed.BedId = $event;
        }
    }
    // AssignValues() {
    //     this.admission.WardId = this.selectedWard.WardId;
    //     this.admission.BedFeatureId = this.selectedBedfeature.BedFeatureId;
    //     this.admission.BedId = this.selectedBed.BedId;
    //     this.admission.PatientId = this.patientId;
    //     this.admission.PatientVisitId = this.patientVisitId;
    //     this.admission.DepartmentId = this.DepartmentId;
    //     this.BedReservationValidator.patchValue({
    //         'AdmissionNote': this.admission.AdmissionNote,
    //     });
    //     this.BookAdmission();
    // }
    AssignValues() {

        this.admission.WardId = this.selectedWard.WardId;
        this.admission.BedFeatureId = this.selectedBedfeature.BedFeatureId;
        this.admission.BedId = this.selectedBed.BedId;
        this.admission.PatientId = this.patientId;
        this.admission.PatientVisitId = this.patientVisitId;
        this.admission.DepartmentId = this.DepartmentId;
        this.admission.AdmissionNotes = this.BedReservationValidator.get('AdmissionNote').value;
        this.BedReservationValidator.patchValue({
            'AdmissionNote': this.admission.AdmissionNotes,
        });
        this.BookAdmission();
        //  else {
        //         this.loading = false;
        //         this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Warning, ['Please Enter all required fields ']);
        //     }
    }

    BookAdmission() {
        for (var i in this.BedReservationValidator.controls) {
            this.BedReservationValidator.controls[i].markAsDirty();
            this.BedReservationValidator.controls[i].updateValueAndValidity();
        }
        if (this.IsValidCheck(undefined, undefined)) {
            this.clinicalBlservice.BookAdmission(this.admission).finally(() => this.loading = false)
                .subscribe((res: DanpheHTTPResponse) => {
                    if (res.Status == ENUM_DanpheHTTPResponses.OK) {
                        if (res.Results) {
                            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Success, ["Bed Is reserved"]);
                            this.callbackClose.emit();

                        }
                        else {
                            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ["Unable To Book Admission"]);

                        }
                    } else {
                        this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ["Failed to Book Admission"]);
                    }
                },
                    err => {
                        this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ["Failed to Book Admission" + err.ErrorMessage]);
                    });

        } else {
            this.loading = false;
            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Warning, ['Please Enter all required fields ']);
        }
    }
    public IsValidCheck(fieldName, validator): boolean {
        if (fieldName == undefined) {
            return this.BedReservationValidator.valid;
        }
        else
            return !(this.BedReservationValidator.hasError(validator, fieldName));
    }
}