import { Injectable } from '@angular/core';
import { PatientsDLService } from '../../patients/shared/patients.dl.service';
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
import { OperationTheatreDLService } from './ot.dl.service';

@Injectable()
export class OperationTheatreBLService {
    constructor(
        public otDLService: OperationTheatreDLService,
        public patientDLService: PatientsDLService
    ) {

    }

    GetPatientsWithVisitsInfo(searchTxt, ShowIPInSearchPatient?: boolean) {
        return this.patientDLService.GetPatientsListForNewVisit(searchTxt, false, false, ShowIPInSearchPatient).map(res => { return res; });
    }

    GetAnaesthesiaServiceItems() {
        return this.otDLService.GetAnaesthesiaServiceItems().map(res => { return res; });
    }
    GetOTMapAnaesthesiaServiceItems() {
        return this.otDLService.GetOTMapAnaesthesiaServiceItems().map(res => { return res; });
    }
    //Sanjeev
    //#region GET

    GetOTMachines() {
        return this.otDLService.GetOTMachines().map(res => { return res; });
    }

    GetPersonnelTypes() {
        return this.otDLService.GetPersonnelTypes().map(res => { return res; });
    }

    GetPersonnel() {
        return this.otDLService.GetPersonnel().map(res => { return res; });
    }

    GetOTBookingList(FromDate: string, ToDate: string, Status: string, PrescribedBy: number) {
        return this.otDLService.GetOTBookingList(FromDate, ToDate, Status, PrescribedBy).map(res => { return res; });
    }

    GetOTSummaryReport(IsOTStartDate: boolean, FromDate: string, ToDate: string, PrescribedBy: number) {
        return this.otDLService.GetOTSummaryReport(IsOTStartDate, FromDate, ToDate, PrescribedBy).map(res => { return res; });
    }

    GetAnaesthesiaTypes() {
        return this.otDLService.GetAnaesthesiaTypes().map(res => { return res; });
    }

    GetAnaesthesiasByPriceCategoryId(PriceCategoryId: number) {
        return this.otDLService.GetAnaesthesiasByPriceCategoryId(PriceCategoryId).map(res => { return res; });
    }

    GetOTCheckListInputTypes() {
        return this.otDLService.GetOTCheckListInputTypes().map(res => { return res; });
    }

    GetOTMSTCheckList() {
        return this.otDLService.GetOTMSTCheckList().map(res => { return res; });
    }

    GetOTMSTCheckListBySurgeryId(surgeryId: number) {
        return this.otDLService.GetOTMSTCheckListBySurgeryId(surgeryId).map(res => { return res; });
    }

    GetDiagnosesByPatientIdAndPatientVisitId(patientId: number, patientVisitId: number) {
        return this.otDLService.GetDiagnosesByPatientIdAndPatientVisitId(patientId, patientVisitId).map(res => { return res; });
    }

    GetOTBookingDetailsByOTBookingId(otBookingId: number) {
        return this.otDLService.GetOTBookingDetailsByOTBookingId(otBookingId).map(res => { return res; });
    }

    GetICDList() {
        return this.otDLService.GetICDList().map(res => { return res; });
    }

    GetEmployeeList() {
        return this.otDLService.GetEmployeeList().map(res => { return res; });
    }

    GetOTBillingItems() {
        return this.otDLService.GetOTBillingItems().map(res => { return res; });
    }

    GetCheckListByOTBookingIdAndSurgeryId(OTBookingId: number, SurgeryId: number) {
        return this.otDLService.GetCheckListByOTBookingIdAndSurgeryId(OTBookingId, SurgeryId).map(res => { return res; });
    }

    CheckForDuplicateOTBooking(PatientVisitId: number, SurgeryId: number) {
        return this.otDLService.CheckForDuplicateOTBooking(PatientVisitId, SurgeryId).map(res => { return res; });
    }

    CheckForProceduresBookedForDateCollision(PatientVisitId: number, Procedures: string) {
        return this.otDLService.CheckForProceduresBookedForDateCollision(PatientVisitId, Procedures).map(res => { return res; });
    }

    GetOTBookingTeamInfo(OTBookingId: number) {
        return this.otDLService.GetOTBookingTeamInfo(OTBookingId).map(res => { return res; });
    }

    GetOTSurgeries() {
        return this.otDLService.GetOTSurgeries().map(res => { return res; });
    }

    GetOTPrescriberList() {
        return this.otDLService.GetOTPrescriberList().map(res => { return res; });
    }

    GetMapSurgeryCheckListBySurgeryId(surgeryId: number) {
        return this.otDLService.GetMapSurgeryCheckListBySurgeryId(surgeryId).map(res => { return res; });
    }

    GetPersonnelDetailsByOTBookingId(otBookingId: number) {
        return this.otDLService.GetPersonnelDetailsByOTBookingId(otBookingId).map(res => { return res; });
    }

    GetImplantDetailByOTBookingId(otBookingId: number) {
        return this.otDLService.GetImplantDetailByOTBookingId(otBookingId).map(res => { return res; });
    }

    GetMachineDetailByOTBookingId(otBookingId: number) {
        return this.otDLService.GetMachineDetailByOTBookingId(otBookingId).map(res => { return res; });
    }

    GetAnaesthesiaDetailByOTBookingId(otBookingId: number) {
        return this.otDLService.GetAnaesthesiaDetailByOTBookingId(otBookingId).map(res => { return res; });
    }

    GetConcludeDetailByOTBookingId(otBookingId: number) {
        return this.otDLService.GetConcludeDetailByOTBookingId(otBookingId).map(res => { return res; });
    }

    GetOtTemplates() {
        return this.otDLService.GetOtTemplates().map(res => { return res; });
    }
    GetOTFinancialReport(IsOTStartDate: boolean, FromDate: string, ToDate: string, SelectedPrescriberId: number) {
        return this.otDLService.GetOTFinancialReport(IsOTStartDate, FromDate, ToDate, SelectedPrescriberId).map(res => { return res; });
    }
    //#endregion

    //#region POST
    AddOTMachine(OTMachine: PostOTMachine_DTO) {
        return this.otDLService.AddOTMachine(OTMachine).map(res => { return res; });
    }

    AddPersonnelType(PersonnelType: PostPersonnelType_DTO) {
        return this.otDLService.AddPersonnelType(PersonnelType).map(res => { return res; });
    }
    AddAnaesthesiaType(AnaesthesiaType: PostAnaesthesiaType_DTO) {
        return this.otDLService.AddAnaesthesiaType(AnaesthesiaType).map(res => { return res; });
    }
    AddMapAnaesthesiaServiceitem(CurrentMapAnaesthesiaType: PostMapAnaesthesiaServiceItemDTO) {
        return this.otDLService.AddMapAnaesthesiaServiceitem(CurrentMapAnaesthesiaType).map(res => { return res; });
    }
    UpdateMapAnaesthesiaType(CurrentMapAnaesthesiaType: PostMapAnaesthesiaServiceItemDTO) {
        return this.otDLService.UpdateMapAnaesthesiaType(CurrentMapAnaesthesiaType).map(res => { return res; });
    }
    AddNewOTBooking(NewOTBooking: OTBookingDetailsModel) {
        return this.otDLService.AddNewOTBooking(NewOTBooking).map(res => { return res; });
    }

    AddOTMSTCheckList(CheckList: PostOTMSTCheckList_DTO) {
        return this.otDLService.AddOTMSTCheckList(CheckList).map(res => { return res; });
    }

    AddOTCheckList(CheckList: PostOTCheckList_DTO) {
        return this.otDLService.AddOTCheckList(CheckList).map(res => { return res; });
    }

    AddOTSurgery(surgery: PostOTSurgery_DTO) {
        return this.otDLService.AddOTSurgery(surgery).map(res => { return res; });
    }

    AddImplantDetail(patientId: number, patientVisitId: number, otBookingId: number, implant: ImplantDetail_DTO) {
        return this.otDLService.AddImplantDetail(patientId, patientVisitId, otBookingId, implant).map(res => { return res; });
    }

    AddMachineDetail(machine: PostOTMachineDetail_DTO) {
        return this.otDLService.AddMachineDetail(machine).map(res => { return res; });
    }
    //#endregion

    //#region PUT
    UpdateOTMachine(OTMachine: PostOTMachine_DTO) {
        return this.otDLService.UpdateOTMachine(OTMachine).map(res => { return res; });
    }

    UpdatePersonnelType(PersonnelType: PostPersonnelType_DTO) {
        return this.otDLService.UpdatePersonnelType(PersonnelType).map(res => { return res; });
    }
    UpdateAnaesthesiaType(AnaesthesiaType: PostAnaesthesiaType_DTO) {
        return this.otDLService.UpdateAnaesthesiaType(AnaesthesiaType).map(res => { return res; });
    }

    UpdateOTBooking(OTBooking: OTBookingDetailsModel) {
        return this.otDLService.UpdateOTBooking(OTBooking).map(res => { return res; });
    }

    CancelOTBooking(oTBookingId: number, cancellationRemarks: string) {
        return this.otDLService.CancelOTBooking(oTBookingId, cancellationRemarks).map(res => { return res; });
    }

    ConfirmOTBooking(oTBookingId: number) {
        return this.otDLService.ConfirmOTBooking(oTBookingId).map(res => { return res; });
    }

    CheckInOTBooking(oTBookingId: number) {
        return this.otDLService.CheckInOTBooking(oTBookingId).map(res => { return res; });
    }

    UpdateOTMSTCheckList(CheckList: PostOTMSTCheckList_DTO) {
        return this.otDLService.UpdateOTMSTCheckList(CheckList).map(res => { return res; });
    }

    RescheduleOTBooking(oTBookingId: number, rescheduledDate: string) {
        return this.otDLService.RescheduleOTBooking(oTBookingId, rescheduledDate).map(res => { return res; });
    }

    SaveLookUp(lookUp: string, checkListId: number) {
        return this.otDLService.SaveLookUp(lookUp, checkListId).map(res => { return res; });
    }

    UpdateOTCheckList(CheckList: PostOTCheckList_DTO) {
        return this.otDLService.UpdateOTCheckList(CheckList).map(res => { return res; });
    }

    UpdateOTSurgery(surgery: PostOTSurgery_DTO) {
        return this.otDLService.UpdateOTSurgery(surgery).map(res => { return res; });
    }

    UpdatePersonnelDetails(otTeamInfo: Array<PostOTTeamInfo_DTO>, otBookingId: number, patientId: number, patientVisitId: number) {
        return this.otDLService.UpdatePersonnelDetails(otTeamInfo, otBookingId, patientId, patientVisitId).map(res => { return res; });
    }

    UpdateAnaesthesiaDetails(otBookingId: number, useAnaesthesia: boolean, anaesthesias: string) {
        return this.otDLService.UpdateAnaesthesiaDetails(otBookingId, useAnaesthesia, anaesthesias).map(res => { return res; });
    }

    UpdateOTMachineByOTBookingId(otBookingId: number, otMachineId: number) {
        return this.otDLService.UpdateOTMachineByOTBookingId(otBookingId, otMachineId).map(res => { return res; });
    }

    DeactivateImplantDetail(otBookingId: number, implantDetailId: number) {
        return this.otDLService.DeactivateImplantDetail(otBookingId, implantDetailId).map(res => { return res; });
    }

    DeactivateMachineDetail(otBookingId: number, machineDetailId: number) {
        return this.otDLService.DeactivateMachineDetail(otBookingId, machineDetailId).map(res => { return res; });
    }

    ConcludeOTBooking(otBookingId: number, concludeBooking: OTConcludeBookingModel) {
        return this.otDLService.ConcludeOTBooking(otBookingId, concludeBooking).map(res => { return res; });
    }

    MapSurgeryCheckList(mapSurgeryCheckList: PostOTMapSurgeryCheckList_DTO) {
        return this.otDLService.MapSurgeryCheckList(mapSurgeryCheckList).map(res => { return res; });
    }
    //#endregion
}
