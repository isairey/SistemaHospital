import { DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import * as moment from 'moment';
import { Observable } from 'rxjs';
import { DiagnosisModel } from '../../../clinical-new/shared/model/cln-diagnosis.model';
import { CoreService } from '../../../core/shared/core.service';
import { DanpheHTTPResponse } from '../../../shared/common-models';
import { MessageboxService } from '../../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponses, ENUM_DiagnosisType, ENUM_MessageBox_Status, ENUM_OT_BookingStatus, ENUM_OT_Priority, ENUM_OT_SurgeryType } from '../../../shared/shared-enums';
import { GetOTAnaesthesiaType_DTO } from '../../shared/dto/get-ot-anaesthesia-type.dto';
import { GetOTAnaesthesia_DTO } from '../../shared/dto/get-ot-anaesthesia.dto';
import { GetOTBillingItem_DTO } from '../../shared/dto/get-ot-billing-item.dto';
import { GetOTBookingDetails_DTO } from '../../shared/dto/get-ot-booking-details.dto';
import { GET_OT_ICD_DTO } from '../../shared/dto/get-ot-icd.dto';
import { GetOTMachine_DTO } from '../../shared/dto/get-ot-machine.dto';
import { GetOTPersonnelType_DTO } from '../../shared/dto/get-ot-personnel-type.dto';
import { GetOTPersonnel_DTO } from '../../shared/dto/get-ot-personnel.dto';
import { GetOTSurgery_DTO } from '../../shared/dto/get-ot-surgery.dto';
import { GetOTTeamInfo_DTO } from '../../shared/dto/get-ot-team-info.dto';
import { OTPrescriber_DTO } from '../../shared/dto/ot-prescriber-dto';
import { PostOTDiagnosis_DTO } from '../../shared/dto/post-ot-diagnosis.dto';
import { OTBookingDetailsModel } from '../../shared/ot-booking-details.model';
import { OperationTheatreBLService } from '../../shared/ot.bl.service';
import { OTService } from '../../shared/ot.service';

@Component({
    selector: 'ot-booking-add',
    templateUrl: './ot-booking-add.component.html',
    styleUrls: ['./ot-booking-add.component.css'],
    host: { '(window:keyup)': 'hotkeys($event)' }
})
export class OTBookingAddComponent implements OnInit {

    @Input("ShowAddNewBookingPage") ShowAddNewBookingPage: boolean = false;
    ShowNewBookingPage: boolean = false;
    @Input("IsUpdate") IsUpdate: boolean = false;
    @Input("IsCancelled") IsCancelled: boolean = false;
    SelectedOTBooking = new GetOTBookingDetails_DTO();
    @Input("OTBookingId") OTBookingId: number = 0;
    @Output() CallBackAddClose: EventEmitter<Object> = new EventEmitter<Object>();
    IsPatientSelected: boolean = false;
    OTMachineList = new Array<GetOTMachine_DTO>();
    PersonnelTypes = new Array<GetOTPersonnelType_DTO>();
    AnaesthesiaTypeList = new Array<GetOTAnaesthesiaType_DTO>();
    AnaesthesiaList = new Array<GetOTAnaesthesia_DTO>();
    PatientObject: any = null; //to do : make dto or patient model
    SelectedPatient: any = null;
    PersonnelList = new Array<GetOTPersonnel_DTO>();
    ICDList = new Array<GET_OT_ICD_DTO>();
    FilteredICDList = new Array<GET_OT_ICD_DTO>();
    CurrentDiagnosis = new GET_OT_ICD_DTO();
    CurrentSurgery = new GetOTSurgery_DTO();
    CurrentPrescriber = new OTPrescriber_DTO();
    OTBillingItems = new Array<GetOTBillingItem_DTO>();
    FilteredOTBillingItems = new Array<GetOTBillingItem_DTO>();
    CurrentBillingItem = new GetOTBillingItem_DTO();
    NewOTBooking = new OTBookingDetailsModel();
    SelectedDiagnosisList = new Array<DiagnosisModel>();
    SelectedBillingItems = new Array<GetOTBillingItem_DTO>();
    CurrentPersonnelType = { PersonnelTypeName: "", PersonnelTypeId: 0 };
    CurrentAnaesthesia = new GetOTAnaesthesia_DTO();
    CurrentPersonnel = new GetOTPersonnel_DTO();
    CurrentOTMachine = new GetOTMachine_DTO();
    SelectedAnaesthesiaList = new Array<GetOTAnaesthesia_DTO>();
    SelectedPersonnelList = new Array<GetOTPersonnel_DTO>();
    FilteredAnaesthesiaList = new Array<GetOTAnaesthesia_DTO>();
    ValidationMessages = new Array<String>();
    PriceCategoryId: number = null;
    BackDateError: boolean = false;
    IsFutureDateEnabled: boolean = true;
    GoToDatePick: boolean = false;
    loading: boolean = false;
    confirmationTitle: string = "Confirm !";
    confirmationMessageForNew: string = "Are you sure you want to Add OT Booking?";
    confirmationMessageForUpdate: string = "Are you sure you want to Update OT Booking?";
    OTTeamInfo = new Array<GetOTTeamInfo_DTO>();
    ICDVersion: string = "";
    FilteredSurgeryList = new Array<GetOTSurgery_DTO>();
    SurgeryList = new Array<GetOTSurgery_DTO>();
    OTPrescriberList = new Array<OTPrescriber_DTO>();
    SurgeryTypes: { SurgeryTypeName: string }[];
    CurrentSurgeryType: { SurgeryTypeName: string };
    Priorities: { PriorityTypeName: string }[];
    CurrentPriority: { PriorityTypeName: string } = { PriorityTypeName: '' };
    @Input('is-view-only') IsViewOnly: boolean = false;
    StatusCancelled: ENUM_OT_BookingStatus.Cancelled;
    ShowCancellationRemarks: boolean = false;
    OldSurgeryId: number = 0;
    PatientDiagnoses = new Array<DiagnosisModel>();
    IsOPERSelected: boolean = false;
    IsIPSelected: boolean = true;
    @Input('ShowSearchFilter')
    ShowSearchFilter: boolean = true;
    constructor(
        private _otBLService: OperationTheatreBLService,
        private _messageBoxService: MessageboxService,
        private _changeDetector: ChangeDetectorRef,
        private _datePipe: DatePipe,
        public coreService: CoreService,
        private _otService: OTService
    ) {
    }

    ngOnInit() {
        // this.ShowSearchFilter = true;
        console.log('ShowSearchFilter value:', this.ShowSearchFilter);

        this.SurgeryTypes = Object.values(ENUM_OT_SurgeryType).map((value, index) => {
            return { SurgeryTypeName: value };
        });
        this.Priorities = Object.values(ENUM_OT_Priority).map((value, index) => {
            return { PriorityTypeName: value };
        });
        if (this.ShowAddNewBookingPage === true) {
            this.ShowNewBookingPage = true;
        }
        if (!this.IsUpdate) {
            let priority = this.Priorities.find(s => s.PriorityTypeName === ENUM_OT_Priority.Normal);
            if (priority) {
                this.CurrentPriority = priority;
                this.NewOTBooking.OTPriority = this.CurrentPriority.PriorityTypeName;
            }
        }
        if (this.IsUpdate) {
            this.InitializeBooking();
        }
    }

    InitializeBooking(): void {
        (async () => {
            try {
                this.GetICDList();
                this.GetOTBillingItems();
                this.GetOTSurgeries();
                this.GetOTPrescriberList();

                if (this.IsUpdate) {
                    if (!this.OTBookingId) {
                        this._messageBoxService.showMessage(ENUM_MessageBox_Status.Warning, [`Invalid OTBookingID.`]);
                    }
                    await this.GetOTBookingDetailsByOTBookingId();
                    await this.GetDiagnosesByPatientIdAndPatientVisitId(this.SelectedOTBooking.PatientId, this.SelectedOTBooking.PatientVisitId)
                    if (this.SelectedOTBooking.Status === ENUM_OT_BookingStatus.Cancelled) {
                        this.ShowCancellationRemarks = true;
                    }
                    this.SelectedOTBooking.BookedForDate = moment(this.SelectedOTBooking.BookedForDate).format('YYYY-MM-DD HH:mm A');
                    Object.assign(this.NewOTBooking, this.SelectedOTBooking);
                    this.AssignDataForUpdate();
                }
                else {
                    const currentDate = new Date();
                    this.NewOTBooking.BookedForDate = this._datePipe.transform(currentDate, 'yyyy-MM-ddTHH:mm');
                }

                if (this.ShowAddNewBookingPage === true) {
                    this.ShowNewBookingPage = true;
                }
            } catch (err) {
                this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Error: ${err.ErrorMessage}`]);
            }
        })();
    }

    ngAfterViewInit() {
        this.GoToSearchPatient();
    }

    HandleDateSelection(): void {
        // !    As per the hospital requirement, removing the Date Validation for OT Bookings
        // const bookedForDate = new Date(this.NewOTBooking.BookedForDate);
        // const currentDate = new Date(this.GetCurrentDate());
        // if (bookedForDate < currentDate) {
        //     this.BackDateError = true;
        // } else {
        //     this.BackDateError = false;
        // }
    }

    GetCurrentDate(): string {
        const currentDate = new Date();
        return this._datePipe.transform(currentDate, 'yyyy-MM-ddTHH:mm');
    }

    AssignDataForUpdate(): void {
        this.AssignDiagnosisForUpdate();
        this.AssignBillingItemsForUpdate();
        this.AssignSurgeryForUpdate();
        this.AssignSurgeryTypeForUpdate();
        this.AssignPriorityForUpdate();
        this.AssignPrescriberForUpdate();
        this.SelectedPatient = this.SelectedOTBooking.PatientName;
    }

    AssignBillingItemsForUpdate(): void {
        let selectedBillingItems: Array<{ ServiceItemId: number, ItemName: string }>;
        try {
            selectedBillingItems = JSON.parse(this.NewOTBooking.BillingItems);
        } catch (error) {
            console.error('Error parsing JSON:', error);
        }
        selectedBillingItems.forEach(p => {
            let proc = new GetOTBillingItem_DTO();
            proc = this.OTBillingItems.find(d => d.ItemName.toLowerCase() === p.ItemName.toLowerCase());
            if (proc && proc.ServiceItemId !== null) {
                this.SelectedBillingItems.push(proc);
            }
        });
    }

    AssignSurgeryForUpdate(): void {
        if (this.NewOTBooking.SurgeryId) {
            let surgery = this.SurgeryList.find(s => s.SurgeryId === this.NewOTBooking.SurgeryId);
            if (surgery) {
                this.CurrentSurgery = surgery;
                this.OldSurgeryId = surgery.SurgeryId;
            }
        }
    }

    AssignSurgeryTypeForUpdate(): void {
        if (this.NewOTBooking.SurgeryId) {
            let surgeryType = this.SurgeryTypes.find(s => s.SurgeryTypeName === this.NewOTBooking.SurgeryType);
            if (surgeryType) {
                this.CurrentSurgeryType = surgeryType;
            }
        }
    }

    AssignPriorityForUpdate(): void {
        if (this.NewOTBooking.OTPriority) {
            let priority = this.Priorities.find(s => s.PriorityTypeName === this.NewOTBooking.OTPriority);
            if (priority) {
                this.CurrentPriority = priority;
            }
        }
    }

    AssignPrescriberForUpdate(): void {
        if (this.NewOTBooking.PrescribedBy) {
            let prescriber = this.OTPrescriberList.find(s => s.PrescriberId === this.NewOTBooking.PrescribedBy);
            if (prescriber) {
                this.CurrentPrescriber = prescriber;
            }
        }
    }

    AssignDiagnosisForUpdate(): void {
        let patientDiagnoses = this.PatientDiagnoses.filter(s => s.IsActive);
        if (patientDiagnoses.length) {
            patientDiagnoses.forEach(diagnosis => {
                const matchedICD = this.ICDList.find(icd => icd.ICDId === diagnosis.ICDId);
                if (matchedICD) {
                    this.SelectedDiagnosisList.push(diagnosis);
                }
            });
        }
        // let selectedDiagnosisList = this.NewOTBooking.ICDDiagnosis.split(',').map(diagnosis => diagnosis.trim());
        // selectedDiagnosisList.forEach(a => {
        //     let diag = new GET_OT_ICD_DTO();
        //     diag = this.ICDList.find(d => d.ICDDescription.toLowerCase() === a.toLowerCase());
        //     if (diag && diag.ICDId !== null) {
        //         this.SelectedDiagnosisList.push(diag);
        //     }
        // });
    }

    hotkeys(event): void {
        if (event.keyCode === 27) {
            this.CloseBookingPage();
        }
    }

    CloseBookingPage(): void {
        this.ShowNewBookingPage = false;
        this.CallBackAddClose.emit();
    }

    logError(err: any): void {
        console.log(err);
    }

    GoToSearchPatient(): void {
        const nextElement = document.getElementById('search_PatientList') as HTMLInputElement;
        if (nextElement) {
            nextElement.focus();
        }
    }

    GoToNext(idToSelect: string) {
        const nextElement = document.getElementById(idToSelect) as HTMLInputElement;
        if (nextElement) {
            nextElement.focus();
        }
    }

    GoToField(): void {
        setTimeout(() => {
            const nextElement = document.getElementById("id_txt_ICDDiagnosis") as HTMLInputElement;
            if (nextElement) {
                nextElement.focus();
            }
        }, 1000);
    }

    GoToNextElement(event: KeyboardEvent, nextElementId: string): void {
        event.preventDefault(); //! Sanjeev, Prevent default behavior of Enter key
        const nextElement = document.getElementById(nextElementId) as HTMLInputElement;
        if (nextElement) {
            nextElement.focus();
        }
    }

    AllPatientSearchAsync = (keyword: any): Observable<any[]> => {
        return this._otBLService.GetPatientsWithVisitsInfo(keyword, this.IsIPSelected);
    }

    PatientListFormatter(data: any): string {
        let html: string = "";
        html = "<font size=03>" + "[" + data["PatientCode"] + "]" + "</font>&nbsp;-&nbsp;&nbsp;<font color='blue'; size=03 ><b>" + data["ShortName"] +
            "</b></font>&nbsp;&nbsp;" + "(" + data["Age"] + '/' + data["Gender"] + ")" + '' + "</b></font>";
        return html;
    }

    AddCurrentExistingPatient(): void {
        if (typeof (this.SelectedPatient) !== 'string') {
            if (this.SelectedPatient.PatientId && this.SelectedPatient.PatientVisitId) {
                this.NewOTBooking.PatientId = this.SelectedPatient.PatientId;
                this.NewOTBooking.PatientVisitId = this.SelectedPatient.PatientVisitId;
                this.PriceCategoryId = this.SelectedPatient.PriceCategoryId;
                this.InitializeBooking();
                this.IsPatientSelected = true;
                this.GoToField();
            }
            else {
                this._messageBoxService.showMessage(ENUM_MessageBox_Status.Warning, [`Selected Patient doesn't have Visit.`]);
                this.SelectedPatient = null;
            }
        }
    }

    PatientInfoChanged(): void {
        if (this.PatientObject && typeof (this.PatientObject) === "object") {
            this._changeDetector.detectChanges();
            this.SelectedPatient = this.PatientObject;
            this.GoToNext('btn_billRequest'); //to be changed
        }
    }

    async GetOTBookingDetailsByOTBookingId(): Promise<void> {
        try {
            const res: DanpheHTTPResponse = await this._otBLService.GetOTBookingDetailsByOTBookingId(this.OTBookingId).toPromise();
            if (res.Status === ENUM_DanpheHTTPResponses.OK && res.Results) {
                this.SelectedOTBooking = res.Results;
            }
            else {
                this.SelectedOTBooking = new GetOTBookingDetails_DTO();
                this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`BookingDetails is empty.`]);
            }
        }
        catch (err) {
            throw new Error(err);
        }
    }

    async GetDiagnosesByPatientIdAndPatientVisitId(patientId: number, patientVisitId: number): Promise<void> {
        try {
            const res: DanpheHTTPResponse = await this._otBLService.GetDiagnosesByPatientIdAndPatientVisitId(patientId, patientVisitId).toPromise();
            if (res.Status === ENUM_DanpheHTTPResponses.OK && res.Results) {
                this.PatientDiagnoses = res.Results;
            }
            else {
                this.PatientDiagnoses = new Array<DiagnosisModel>();
                this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`BookingDetails is empty.`]);
            }
        }
        catch (err) {
            throw new Error(err);
        }
    }

    GetICDList(): void {
        let icdList = this._otService.getICDList();
        if (icdList && icdList.length) {
            this.ICDList = icdList;
            this.FilteredICDList = icdList.filter(item => item.IsActive);
            const icdVersion = this.FilteredICDList[0].ICDVersion;
            this.ICDVersion = icdVersion ? `Select Diagnosis (${icdVersion})` : "Select Diagnosis";
        }
    }

    GetOTBillingItems(): void {
        let otBillingItems = this._otService.getOTBillingItems();
        if (otBillingItems && otBillingItems.length) {
            this.OTBillingItems = otBillingItems;
            this.FilteredOTBillingItems = otBillingItems.filter(item => item.IsActive);
        }
    }

    GetOTMachines(): void {
        let otMachines = this._otService.getOTMachines();
        if (otMachines && otMachines.length) {
            this.OTMachineList = otMachines.filter(machine => machine.IsActive);
        }
    }

    GetOTSurgeries(): void {
        let otSurgeries = this._otService.getOTSurgeries();
        if (otSurgeries && otSurgeries.length) {
            this.SurgeryList = otSurgeries;
            this.FilteredSurgeryList = otSurgeries.filter(s => s.IsActive);
        }
    }

    GetOTPrescriberList(): void {
        let otPrescriberList = this._otService.getOTPrescriberList();
        if (otPrescriberList && otPrescriberList.length) {
            this.OTPrescriberList = otPrescriberList;
        }
    }

    FocusOutFromDatePicker(event: any) {
        if (event) {
            this.GoToDatePick = false;
            this.GoToNext('Diagnosis');   //to be changed
        }
    }

    DiagnosisFormatter(data: any): string {
        let html = data["ICDDescription"];
        return html;
    }

    OTBillingItemFormatter(data: any): string {
        let html = data["ItemName"];
        return html;
    }

    SurgeryFormatter(data: any): string {
        let html = data["SurgeryName"];
        return html;
    }

    PrescriberFormatter(data: any): string {
        let html = data["PrescriberName"];
        return html;
    }

    SurgeryTypeFormatter(data: any): string {
        let html = data["SurgeryTypeName"];
        return html;
    }

    PriorityFormatter(data: any): string {
        let html = data["PriorityTypeName"];
        return html;
    }

    OnDiagnosisSelect(): void {
        if (this.CurrentDiagnosis && typeof (this.CurrentDiagnosis) === "object" && this.CurrentDiagnosis.ICDId) {
            if (!this.SelectedDiagnosisList.some((d) => d.ICDId === this.CurrentDiagnosis.ICDId)) {
                let diag = new DiagnosisModel();
                let patDiagOld = this.PatientDiagnoses.find((d) => d.ICDId === this.CurrentDiagnosis.ICDId);
                if (patDiagOld && patDiagOld.DiagnosisId) {
                    diag.DiagnosisId = patDiagOld.DiagnosisId;
                }
                else {
                    diag.DiagnosisId = 0;
                }
                diag.DiagnosisCode = this.CurrentDiagnosis.ICDCode;
                diag.ICDId = this.CurrentDiagnosis.ICDId;
                diag.DiagnosisCodeDescription = this.CurrentDiagnosis.ICDDescription;
                this.SelectedDiagnosisList.push(diag);
                // this.SelectedDiagnosisList.push(this.CurrentDiagnosis);
            }
            else {
                this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`Already Added.`]);
            }
            this.CurrentDiagnosis = new GET_OT_ICD_DTO();
        }
    }

    OnSurgerySelect(): void {
        if (this.CurrentSurgery && typeof (this.CurrentSurgery) === "object" && this.CurrentSurgery.SurgeryId) {
            this.CheckForDuplicateOTBooking();
        }
        else {
            if (this.OldSurgeryId && this.IsUpdate) {
                let surgery = this.SurgeryList.find(s => s.SurgeryId === this.OldSurgeryId);
                if (surgery) {
                    this.CurrentSurgery = surgery;
                }
            }
            else {
                this.CurrentSurgery = new GetOTSurgery_DTO();
                this.NewOTBooking.SurgeryId = 0;
            }
        }
    }

    CheckForDuplicateOTBooking(): void {
        this._otBLService.CheckForDuplicateOTBooking(this.NewOTBooking.PatientVisitId, this.CurrentSurgery.SurgeryId)
            .subscribe((res: DanpheHTTPResponse): void => {
                if (res.Status === ENUM_DanpheHTTPResponses.OK) {
                    // if (res.Results === false) {
                    //     this.NewOTBooking.SurgeryId = this.CurrentSurgery.SurgeryId;
                    // }
                    // else {
                    //     this.CurrentSurgery = new GetOTSurgery_DTO();
                    //     this.NewOTBooking.SurgeryId = 0;
                    //     this._messageBoxService.showMessage(ENUM_MessageBox_Status.Warning, [`Patient can't have same Surgery multiple times in a single visit.`]);
                    // }
                    if (res.Results) {
                        if (res.Results === ENUM_OT_BookingStatus.Cancelled || res.Results === ENUM_OT_BookingStatus.Concluded) {
                            this.NewOTBooking.SurgeryId = this.CurrentSurgery.SurgeryId;
                        }
                        else if (res.Results === ENUM_OT_BookingStatus.Scheduled || res.Results === ENUM_OT_BookingStatus.InProgress) {
                            this.NewOTBooking.SurgeryId = this.CurrentSurgery.SurgeryId;
                            this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`Booking for the selected surgery is already ${res.Results} for this visit.`]);
                        }
                        else if (res.Results === ENUM_OT_BookingStatus.Booked) {
                            this.CurrentSurgery = new GetOTSurgery_DTO();
                            this.NewOTBooking.SurgeryId = 0;
                            this._messageBoxService.showMessage(ENUM_MessageBox_Status.Warning, [`Booking for the selected surgery is already ${ENUM_OT_BookingStatus.Booked} for this visit.`]);
                        }
                    }
                    else if (res.Results === null) {
                        this.NewOTBooking.SurgeryId = this.CurrentSurgery.SurgeryId;
                    }
                }
                else {
                    this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, [`Exception: ${res.ErrorMessage}`]);
                    this.CurrentSurgery = new GetOTSurgery_DTO();
                    this.NewOTBooking.SurgeryId = 0;
                }
            },
                (err: DanpheHTTPResponse): void => {
                    this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Exception: ${err.ErrorMessage}`]);
                    this.CurrentSurgery = new GetOTSurgery_DTO();
                    this.NewOTBooking.SurgeryId = 0;
                }
            );
    }

    OnPrescriberSelect(): void {
        if (this.CurrentPrescriber && typeof (this.CurrentPrescriber) === "object" && this.CurrentPrescriber.PrescriberId) {
            this.NewOTBooking.PrescribedBy = this.CurrentPrescriber.PrescriberId;
        }
        else {
            this.CurrentPrescriber = new OTPrescriber_DTO();
            this.NewOTBooking.PrescribedBy = 0;
        }
    }

    OnSurgeryTypeSelect(): void {
        if (this.CurrentSurgeryType && typeof (this.CurrentSurgeryType) === "object") {
            this.NewOTBooking.SurgeryType = this.CurrentSurgeryType.SurgeryTypeName;
        }
        else {
            this.CurrentSurgeryType = { SurgeryTypeName: '' };
            this.NewOTBooking.SurgeryType = "";
        }
    }

    OnPrioritySelect(): void {
        if (this.CurrentPriority && typeof (this.CurrentPriority) === "object") {
            this.NewOTBooking.OTPriority = this.CurrentPriority.PriorityTypeName;
        }
        else {
            this.CurrentPriority = { PriorityTypeName: '' };
            this.NewOTBooking.OTPriority = "";
        }
    }

    OnBillingItemSelect(): void {
        if (this.CurrentBillingItem && typeof (this.CurrentBillingItem) === "object" && this.CurrentBillingItem.ServiceItemId) {
            if (!this.SelectedBillingItems.some((p) => p.ServiceItemId === this.CurrentBillingItem.ServiceItemId)) {
                this.SelectedBillingItems.push(this.CurrentBillingItem);
                this.CurrentBillingItem = null;
            }
            else {
                this.CurrentBillingItem = null;
                this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`Already Added.`]);
            }
        }
    }

    RemoveDiagnosis(index: number): void {
        this.SelectedDiagnosisList.splice(index, 1);
    }

    RemoveBillingItem(index: number): void {
        this.SelectedBillingItems.splice(index, 1);
    }

    CheckValidation(): boolean {
        let isValid: boolean = true;
        this.ValidationMessages = new Array<string>();
        if (!this.NewOTBooking.OTExpectedDuration) {
            isValid = false;
            this.ValidationMessages.push(`Enter valid Expectation Duration.`);
        }
        //! September-17th, 2024 : Making Billing Items optional.
        // if (!this.SelectedBillingItems.length) {
        //     isValid = false;
        //     this.ValidationMessages.push(`At least one Billing Item is mandatory.`);
        // }
        if (!this.NewOTBooking.SurgeryId) {
            isValid = false;
            this.ValidationMessages.push(`Surgery Name is mandatory.`);
        }
        if (!this.NewOTBooking.SurgeryType || (this.NewOTBooking.SurgeryType && !this.NewOTBooking.SurgeryType.trim().length)) {
            isValid = false;
            this.ValidationMessages.push(`Surgery Type is mandatory.`);
        }
        if (!this.NewOTBooking.OTPriority || (this.NewOTBooking.OTPriority && !this.NewOTBooking.OTPriority.trim().length)) {
            isValid = false;
            this.ValidationMessages.push(`Priority is mandatory.`);
        }
        if (!this.NewOTBooking.PrescribedBy) {
            isValid = false;
            this.ValidationMessages.push(`Surgeon is mandatory.`);
        }
        return isValid;
    }

    AssignDiagnosis(): void {
        // this.NewOTBooking.ICDDiagnosis = this.SelectedDiagnosisList.map(diagnosis => diagnosis.ICDDescription).join(', ');
        this.NewOTBooking.Diagnoses = new Array<PostOTDiagnosis_DTO>();
        this.SelectedDiagnosisList.forEach(diag => {
            let diagnosis = new PostOTDiagnosis_DTO();
            diagnosis.DiagnosisId = diag.DiagnosisId;
            diagnosis.ICDId = diag.ICDId;
            diagnosis.DiagnosisCode = diag.DiagnosisCode;
            diagnosis.DiagnosisCodeDescription = diag.DiagnosisCodeDescription;
            diagnosis.DiagnosisType = ENUM_DiagnosisType.FinalDiagnosis;
            diagnosis.IsCauseOfDeath = false;
            diagnosis.Remarks = `Diagnosis added from OT Booking.`;
            diagnosis.ModificationHistory = `${diagnosis.ModificationHistory}`;
            this.NewOTBooking.Diagnoses.push(diagnosis);
        });
    }

    AssignBillingItems(): void {
        this.NewOTBooking.BillingItems = JSON.stringify(
            this.SelectedBillingItems.map(item => ({
                ServiceItemId: item.ServiceItemId,
                ItemName: item.ItemName
            }))
        );
    }

    SaveOTBooking(): void {
        if (!this.IsUpdate) {
            this.HandleDateSelection();
            if (this.BackDateError) {
                return;
            }
        }
        if (this.CheckValidation() === false) {
            const messages = this.ValidationMessages.map(message => `${message}\n`);
            this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, messages);
            return;
        }
        this.AssignDiagnosis();
        this.AssignBillingItems();
        this.NewOTBooking.Status = ENUM_OT_BookingStatus.Booked;
        if (!this.IsUpdate) {
            this._otBLService.CheckForProceduresBookedForDateCollision(this.NewOTBooking.PatientVisitId, this.NewOTBooking.BookedForDate)
                .subscribe((res: DanpheHTTPResponse): void => {
                    if (res.Status === ENUM_DanpheHTTPResponses.OK) {
                        if (res.Results === false) {
                            this.PostOTBooking();
                        }
                        else if (res.Results === true) {
                            this._messageBoxService.showMessage(ENUM_MessageBox_Status.Warning, [`This Patient has another booking at the same time.`]);
                            return;
                        }
                    }
                    else if (res.Results === true) {
                        this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, [`Exception: ${res.ErrorMessage}`]);
                    }
                },
                    (err: DanpheHTTPResponse) => {
                        this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Exception: ${err.ErrorMessage}`]);
                    }
                );
        }
        if (this.IsUpdate) {
            this.UpdateOTBooking();
        }

    }

    PostOTBooking(): void {
        this.loading = true;
        this._otBLService.AddNewOTBooking(this.NewOTBooking)
            .finally(() => {
                this.loading = false;
            })
            .subscribe((res: DanpheHTTPResponse) => {
                if (res.Status === ENUM_DanpheHTTPResponses.OK) {
                    this.CallBackAddClose.emit(true);
                    this._messageBoxService.showMessage(ENUM_MessageBox_Status.Success, [`New OT Booking Added Successfully.`]);
                }
                else {
                    this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, [`Unable to Add New OT Booking.`]);
                }
            },
                (err: DanpheHTTPResponse) => {
                    this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Exception: ${err.ErrorMessage}`]);
                }
            );
    }

    UpdateOTBooking(): void {
        this.loading = true;
        this._otBLService.UpdateOTBooking(this.NewOTBooking)
            .finally(() => {
                this.loading = false;
            })
            .subscribe((res: DanpheHTTPResponse) => {
                if (res.Status === ENUM_DanpheHTTPResponses.OK) {
                    this.CallBackAddClose.emit(res.Results);
                    this._messageBoxService.showMessage(ENUM_MessageBox_Status.Success, [`OT Booking Updated Successfully.`]);
                }
                else {
                    this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, [`Unable to Update OT Booking.`]);
                }
            },
                (err: DanpheHTTPResponse) => {
                    this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Exception: ${err.ErrorMessage}`]);
                }
            );
    }

    handleConfirm(): void {
        this.SaveOTBooking();
    }

    handleCancel(): void {
        this.loading = false;
    }

    OnExpectedDurationChange(): void {
        if (this.NewOTBooking && this.NewOTBooking.OTExpectedDuration < 0) {
            this.NewOTBooking.OTExpectedDuration = 0;
        }
    }
    onIPSelected() {
        this.IsOPERSelected = !this.IsIPSelected;
    }

    onOPERSelected() {
        this.IsIPSelected = !this.IsOPERSelected;
    }

}


