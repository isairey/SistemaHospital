import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DanpheHTTPResponse } from '../../shared/common-models';
import { OTConcludeBookingModel } from './dto/ot-conclude-booking.model';
import { PostAnaesthesiaType_DTO } from './dto/ot-post-anaesthesiaType.dto';
import { PostOTCheckList_DTO } from './dto/post-ot-checklist.dto';
import { ImplantDetail_DTO } from './dto/post-ot-implant-detail.dto';
import { PostOTMachineDetail_DTO } from './dto/post-ot-machine-detail.dto';
import { PostOTMachine_DTO } from './dto/post-ot-machine.dto';
import { PostMapAnaesthesiaServiceItemDTO } from './dto/post-ot-map-anaeshtesia-serviceItem.dto';
import { PostOTMapSurgeryCheckList_DTO } from './dto/post-ot-map-surgery-checklist';
import { PostOTMSTCheckList_DTO } from './dto/post-ot-mst-checklist.dto';
import { PostPersonnelType_DTO } from './dto/post-ot-personnel.dto';
import { PostOTSurgery_DTO } from './dto/post-ot-surgery';
import { PostOTTeamInfo_DTO } from './dto/post-ot-team-info.dto';
import { OTBookingDetailsModel } from './ot-booking-details.model';
@Injectable()
export class OperationTheatreDLService {
    public http: HttpClient;
    public options = { headers: new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' }) };
    public optionJson = { headers: new HttpHeaders({ 'Content-Type': 'application/json' }) };

    constructor(
        public _http: HttpClient
    ) {
        this.http = _http;
    }

    GetOTMapAnaesthesiaServiceItems(): Observable<DanpheHTTPResponse> {
        return this.http.get<DanpheHTTPResponse>(`/api/OperationTheatre/OTMapAnaesthesiaServiceItems`)
    }
    GetAnaesthesiaServiceItems(): Observable<DanpheHTTPResponse> {
        return this.http.get<DanpheHTTPResponse>(`/api/OperationTheatre/AnaesthesiaServiceItems`)
    }

    //Sanjeev
    //#region GET
    GetOTMachines(): Observable<DanpheHTTPResponse> {
        return this.http.get<DanpheHTTPResponse>("/api/OperationTheatre/OTMachines");
    }

    GetPersonnelTypes(): Observable<DanpheHTTPResponse> {
        return this.http.get<DanpheHTTPResponse>("/api/OperationTheatre/PersonnelTypes");
    }

    GetPersonnel(): Observable<DanpheHTTPResponse> {
        return this.http.get<DanpheHTTPResponse>("/api/OperationTheatre/Personnel");
    }

    GetOTBookingList(FromDate: string, ToDate: string, Status: string, PrescribedBy: number): Observable<DanpheHTTPResponse> {
        return this.http.get<DanpheHTTPResponse>(`/api/OperationTheatre/BookingInfo?FromDate=${FromDate}&ToDate=${ToDate}&Status=${Status}&PrescribedBy=${PrescribedBy}`)
    }

    GetOTSummaryReport(IsOTStartDate: boolean, FromDate: string, ToDate: string, PrescribedBy: number): Observable<DanpheHTTPResponse> {
        return this.http.get<DanpheHTTPResponse>(`/api/OperationTheatre/OTSummaryReport?IsOTStartDate=${IsOTStartDate}&FromDate=${FromDate}&ToDate=${ToDate}&PrescribedBy=${PrescribedBy}`)
    }

    GetAnaesthesiaTypes(): Observable<DanpheHTTPResponse> {
        return this.http.get<DanpheHTTPResponse>(`/api/OperationTheatre/AnaesthesiaTypes`)
    }

    GetAnaesthesiasByPriceCategoryId(PriceCategoryId: number): Observable<DanpheHTTPResponse> {
        return this.http.get<DanpheHTTPResponse>(`/api/OperationTheatre/Anaesthesias?PriceCategoryId=${PriceCategoryId}`, this.options)
    }

    GetOTCheckListInputTypes(): Observable<DanpheHTTPResponse> {
        return this.http.get<DanpheHTTPResponse>(`/api/OperationTheatre/CheckListInputTypes`, this.options)
    }

    GetOTBookingDetailsByOTBookingId(otBookingId: number): Observable<DanpheHTTPResponse> {
        return this.http.get<DanpheHTTPResponse>(`/api/OperationTheatre/OTBookingDetailsByOTBookingId?OTBookingId=${otBookingId}`, this.options)
    }

    GetDiagnosesByPatientIdAndPatientVisitId(patientId: number, patientVisitId: number): Observable<DanpheHTTPResponse> {
        return this.http.get<DanpheHTTPResponse>(`/api/OperationTheatre/DiagnosesByPatientIdAndPatientVisitId?PatientId=${patientId}&PatientVisitId=${patientVisitId}`, this.options)
    }

    GetOTMSTCheckList(): Observable<DanpheHTTPResponse> {
        return this.http.get<DanpheHTTPResponse>(`/api/OperationTheatre/MSTCheckList`, this.options)
    }

    GetOTMSTCheckListBySurgeryId(surgeryId: number): Observable<DanpheHTTPResponse> {
        return this.http.get<DanpheHTTPResponse>(`/api/OperationTheatre/MSTCheckListBySurgeryId?SurgeryId=${surgeryId}`, this.options)
    }

    GetICDList(): Observable<DanpheHTTPResponse> {
        return this.http.get<DanpheHTTPResponse>("/api/OperationTheatre/ICD");
    }

    GetEmployeeList(): Observable<DanpheHTTPResponse> {
        return this.http.get<DanpheHTTPResponse>("/api/EmployeeSettings/Employees");
    }

    GetOTBillingItems(): Observable<DanpheHTTPResponse> {
        return this.http.get<DanpheHTTPResponse>("/api/OperationTheatre/OTBillingItems");
    }

    GetCheckListByOTBookingIdAndSurgeryId(OTBookingId: number, SurgeryId: number): Observable<DanpheHTTPResponse> {
        return this.http.get<DanpheHTTPResponse>(`/api/OperationTheatre/CheckListByOTBookingId?OTBookingId=${OTBookingId}&SurgeryId=${SurgeryId}`, this.options);
    }

    CheckForDuplicateOTBooking(PatientVisitId: number, SurgeryId: number): Observable<DanpheHTTPResponse> {
        return this.http.get<DanpheHTTPResponse>(`/api/OperationTheatre/CheckForDuplicateOTBooking?PatientVisitId=${PatientVisitId}&SurgeryId=${SurgeryId}`, this.options);
    }

    CheckForProceduresBookedForDateCollision(PatientVisitId: number, BookedForDate: string): Observable<DanpheHTTPResponse> {
        return this.http.get<DanpheHTTPResponse>(`/api/OperationTheatre/CheckForProceduresBookedForDateCollision?PatientVisitId=${PatientVisitId}&BookedForDate=${BookedForDate}`, this.options);
    }

    GetOTBookingTeamInfo(OTBookingId: number): Observable<DanpheHTTPResponse> {
        return this.http.get<DanpheHTTPResponse>(`/api/OperationTheatre/OTBookingTeamInfo?OTBookingId=${OTBookingId}`, this.options);
    }

    GetOTSurgeries(): Observable<DanpheHTTPResponse> {
        return this.http.get<DanpheHTTPResponse>("/api/OperationTheatre/OTSurgeries");
    }

    GetOTPrescriberList(): Observable<DanpheHTTPResponse> {
        return this.http.get<DanpheHTTPResponse>("/api/OperationTheatre/OTPrescribers");
    }

    GetMapSurgeryCheckListBySurgeryId(surgeryId: number): Observable<DanpheHTTPResponse> {
        return this.http.get<DanpheHTTPResponse>(`/api/OperationTheatre/MapSurgeryCheckListItemsBySurgeryId?surgeryId=${surgeryId}`, this.options);
    }

    GetPersonnelDetailsByOTBookingId(otBookingId: number): Observable<DanpheHTTPResponse> {
        return this.http.get<DanpheHTTPResponse>(`/api/OperationTheatre/TeamInfoByOTBooingId?OTBookingId=${otBookingId}`, this.options);
    }

    GetImplantDetailByOTBookingId(otBookingId: number): Observable<DanpheHTTPResponse> {
        return this.http.get<DanpheHTTPResponse>(`/api/OperationTheatre/ImplantDetailByOTBookingId?OTBookingId=${otBookingId}`, this.options);
    }

    GetMachineDetailByOTBookingId(otBookingId: number): Observable<DanpheHTTPResponse> {
        return this.http.get<DanpheHTTPResponse>(`/api/OperationTheatre/MachineDetailByOTBookingId?OTBookingId=${otBookingId}`, this.options);
    }

    GetConcludeDetailByOTBookingId(otBookingId: number): Observable<DanpheHTTPResponse> {
        return this.http.get<DanpheHTTPResponse>(`/api/OperationTheatre/ConcludeDetailByOTBookingId?OTBookingId=${otBookingId}`, this.options);
    }

    GetAnaesthesiaDetailByOTBookingId(otBookingId: number): Observable<DanpheHTTPResponse> {
        return this.http.get<DanpheHTTPResponse>(`/api/OperationTheatre/AnaesthesiaDetailByOTBookingId?OTBookingId=${otBookingId}`, this.options);
    }

    GetOtTemplates(): Observable<DanpheHTTPResponse> {
        return this.http.get<DanpheHTTPResponse>(`/api/OperationTheatre/OtTemplates`, this.options);
    }
    GetOTFinancialReport(IsOTStartDate: boolean, FromDate: string, ToDate: string, SelectedPrescriberId: number) {
        return this.http.get<DanpheHTTPResponse>(`/api/OperationTheatre/OTFinancialReport?IsOTStartDate=${IsOTStartDate}&FromDate=${FromDate}&ToDate=${ToDate}&PrescribedBy=${SelectedPrescriberId}`, this.options);
    }
    //#endregion

    //#region POST
    AddOTMachine(OTMachine: PostOTMachine_DTO): Observable<DanpheHTTPResponse> {
        return this.http.post<DanpheHTTPResponse>("/api/OperationTheatre/OTMachine", OTMachine, this.optionJson);
    }

    AddPersonnelType(PersonnelType: PostPersonnelType_DTO): Observable<DanpheHTTPResponse> {
        return this.http.post<DanpheHTTPResponse>("/api/OperationTheatre/PersonnelType", PersonnelType, this.optionJson);
    }
    AddAnaesthesiaType(AnaesthesiaType: PostAnaesthesiaType_DTO): Observable<DanpheHTTPResponse> {
        return this.http.post<DanpheHTTPResponse>("/api/OperationTheatre/AnaesthesiaType", AnaesthesiaType, this.optionJson);
    }
    AddMapAnaesthesiaServiceitem(CurrentMapAnaesthesiaType: PostMapAnaesthesiaServiceItemDTO): Observable<DanpheHTTPResponse> {
        return this.http.post<DanpheHTTPResponse>("/api/OperationTheatre/OTMapAnaesthesiaServiceItems", CurrentMapAnaesthesiaType, this.optionJson);
    }
    AddNewOTBooking(NewOTBooking: OTBookingDetailsModel): Observable<DanpheHTTPResponse> {
        return this.http.post<DanpheHTTPResponse>("/api/OperationTheatre/OTBooking", NewOTBooking, this.optionJson);
    }

    AddOTMSTCheckList(CheckList: PostOTMSTCheckList_DTO): Observable<DanpheHTTPResponse> {
        return this.http.post<DanpheHTTPResponse>("/api/OperationTheatre/MSTCheckList", CheckList, this.optionJson);
    }

    AddOTCheckList(CheckList: PostOTCheckList_DTO): Observable<DanpheHTTPResponse> {
        return this.http.post<DanpheHTTPResponse>("/api/OperationTheatre/CheckList", CheckList, this.optionJson);
    }

    AddOTSurgery(surgery: PostOTSurgery_DTO): Observable<DanpheHTTPResponse> {
        return this.http.post<DanpheHTTPResponse>("/api/OperationTheatre/OTSurgery", surgery, this.optionJson);
    }

    AddImplantDetail(patientId: number, patientVisitId: number, otBookingId: number, Implant: ImplantDetail_DTO): Observable<DanpheHTTPResponse> {
        return this.http.post<DanpheHTTPResponse>(`/api/OperationTheatre/ImplantDetail?PatientId=${patientId}&PatientVisitId=${patientVisitId}&OTBookingId=${otBookingId}`, Implant, this.optionJson);
    }

    AddMachineDetail(Machine: PostOTMachineDetail_DTO): Observable<DanpheHTTPResponse> {
        return this.http.post<DanpheHTTPResponse>(`/api/OperationTheatre/MachineDetail`, Machine, this.optionJson);
    }
    //#endregion

    //#region PUT
    UpdateOTMachine(OTMachine: PostOTMachine_DTO): Observable<DanpheHTTPResponse> {
        return this.http.put<DanpheHTTPResponse>("/api/OperationTheatre/OTMachine", OTMachine, this.optionJson);
    }

    UpdatePersonnelType(PersonnelType: PostPersonnelType_DTO): Observable<DanpheHTTPResponse> {
        return this.http.put<DanpheHTTPResponse>("/api/OperationTheatre/PersonnelType", PersonnelType, this.optionJson);
    }
    UpdateAnaesthesiaType(AnaesthesiaType: PostAnaesthesiaType_DTO): Observable<DanpheHTTPResponse> {
        return this.http.put<DanpheHTTPResponse>("/api/OperationTheatre/AnaesthesiaType", AnaesthesiaType, this.optionJson);
    }
    UpdateMapAnaesthesiaType(CurrentMapAnaesthesiaType: PostMapAnaesthesiaServiceItemDTO): Observable<DanpheHTTPResponse> {
        return this.http.put<DanpheHTTPResponse>("/api/OperationTheatre/OTMapAnaesthesiaServiceItems", CurrentMapAnaesthesiaType, this.optionJson);
    }

    UpdateOTBooking(OTBooking: OTBookingDetailsModel): Observable<DanpheHTTPResponse> {
        return this.http.put<DanpheHTTPResponse>("/api/OperationTheatre/OTBooking", OTBooking, this.optionJson);
    }

    CancelOTBooking(oTBookingId: number, cancellationRemarks: string): Observable<DanpheHTTPResponse> {
        return this.http.put<DanpheHTTPResponse>(`/api/OperationTheatre/BookingCancellation?OTBookingId=${oTBookingId}&CancellationRemarks=${cancellationRemarks}`, this.options);
    }

    ConfirmOTBooking(oTBookingId: number): Observable<DanpheHTTPResponse> {
        return this.http.put<DanpheHTTPResponse>(`/api/OperationTheatre/ConfirmOTBooking?OTBookingId=${oTBookingId}`, this.options);
    }

    CheckInOTBooking(oTBookingId: number): Observable<DanpheHTTPResponse> {
        return this.http.put<DanpheHTTPResponse>(`/api/OperationTheatre/CheckInOTBooking?OTBookingId=${oTBookingId}`, this.options);
    }

    UpdateOTMSTCheckList(CheckList: PostOTMSTCheckList_DTO): Observable<DanpheHTTPResponse> {
        return this.http.put<DanpheHTTPResponse>("/api/OperationTheatre/MSTCheckList", CheckList, this.optionJson);
    }

    RescheduleOTBooking(oTBookingId: number, rescheduledDate: string): Observable<DanpheHTTPResponse> {
        return this.http.put<DanpheHTTPResponse>(`/api/OperationTheatre/RescheduleOTBooking?OTBookingId=${oTBookingId}&RescheduledDate=${rescheduledDate}`, this.options);
    }

    SaveLookUp(lookUp: string, checkListId: number): Observable<DanpheHTTPResponse> {
        return this.http.put<DanpheHTTPResponse>(`/api/OperationTheatre/SaveLookUp?lookUp=${lookUp}&checkListId=${checkListId}`, this.options);
    }

    UpdateOTCheckList(CheckList: PostOTCheckList_DTO): Observable<DanpheHTTPResponse> {
        return this.http.put<DanpheHTTPResponse>("/api/OperationTheatre/CheckList", CheckList, this.optionJson);
    }

    UpdateOTSurgery(surgery: PostOTSurgery_DTO): Observable<DanpheHTTPResponse> {
        return this.http.put<DanpheHTTPResponse>("/api/OperationTheatre/OTSurgery", surgery, this.optionJson);
    }

    UpdatePersonnelDetails(otTeamInfo: Array<PostOTTeamInfo_DTO>, otBookingId: number, patientId: number, patientVisitId: number): Observable<DanpheHTTPResponse> {
        return this.http.put<DanpheHTTPResponse>(`/api/OperationTheatre/PersonnelDetails?OTBookingId=${otBookingId}&PatientId=${patientId}&PatientVisitId=${patientVisitId}`, otTeamInfo, this.optionJson);
    }

    UpdateAnaesthesiaDetails(otBookingId: number, useAnaesthesia: boolean, anaesthesias: string): Observable<DanpheHTTPResponse> {
        return this.http.put<DanpheHTTPResponse>(`/api/OperationTheatre/AnaesthesiaDetails?OTBookingId=${otBookingId}&UseAnaesthesia=${useAnaesthesia}&AnaesthesiaDetails=${anaesthesias}`, this.optionJson);
    }

    UpdateOTMachineByOTBookingId(otBookingId: number, otMachineId: number): Observable<DanpheHTTPResponse> {
        return this.http.put<DanpheHTTPResponse>(`/api/OperationTheatre/OTMachineByOTBookingId?OTBookingId=${otBookingId}&OTMachineId=${otMachineId}`, this.optionJson);
    }

    DeactivateImplantDetail(otBookingId: number, implantDetailId: number): Observable<DanpheHTTPResponse> {
        return this.http.put<DanpheHTTPResponse>(`/api/OperationTheatre/DeactivateImplantDetail?OTBookingId=${otBookingId}&ImplantDetailId=${implantDetailId}`, this.optionJson);
    }

    DeactivateMachineDetail(otBookingId: number, machineDetailId: number): Observable<DanpheHTTPResponse> {
        return this.http.put<DanpheHTTPResponse>(`/api/OperationTheatre/DeactivateMachineDetail?OTBookingId=${otBookingId}&MachineDetailId=${machineDetailId}`, this.optionJson);
    }

    ConcludeOTBooking(otBookingId: number, concludeBooking: OTConcludeBookingModel): Observable<DanpheHTTPResponse> {
        return this.http.put<DanpheHTTPResponse>(`/api/OperationTheatre/ConcludeOTBooking?OTBookingId=${otBookingId}`, concludeBooking, this.optionJson);
    }

    MapSurgeryCheckList(mapSurgeryCheckList: PostOTMapSurgeryCheckList_DTO): Observable<DanpheHTTPResponse> {
        return this.http.put<DanpheHTTPResponse>("/api/OperationTheatre/MapSurgeryCheckList", mapSurgeryCheckList, this.optionJson);
    }
    //#endregion
}