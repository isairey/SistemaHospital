using DanpheEMR.DalLayer;
using DanpheEMR.Security;
using DanpheEMR.Services.OT.DTOs;
using System;
using System.Collections.Generic;

namespace DanpheEMR.Services.OT
{
    public interface IOperationTheatreService
    {
        #region GET

        object GetOTBookingList(OtDbContext operationTheaterDbContext, DateTime? FromDate, DateTime? ToDate, string Status, int PrescribedBy);
        object GetOTBookingDetailsByOTBookingId(OtDbContext operationTheaterDbContext, int OTBookingId);
        object GetDiagnosesByPatientIdAndPatientVisitId(OtDbContext operationTheaterDbContext, int PatientId, int PatientVisitId);
        object GetOTBookingTeamInfo(OtDbContext operationTheaterDbContext, int OTBookingId);
        object GetOTMachines(OtDbContext operationTheaterDbContext);
        object GetPersonnelTypes(OtDbContext operationTheaterDbContext);
        object GetPersonnels(OtDbContext operationTheaterDbContext);
        object GetAnaesthesiaTypes(OtDbContext operationTheaterDbContext);
        object GetAnaesthesias(OtDbContext operationTheaterDbContext, int PriceCategoryId);
        /*object GetAnaesthesiaDetailsByOTBookingId(OtDbContext operationTheaterDbContext, int OTBookingId);*/
        object GetICDList(OtDbContext operationTheaterDbContext);
        object GetOTBillingItems(OtDbContext operationTheaterDbContext);
        object GetOTPrescribers(OtDbContext operationTheaterDbContext);
        object CheckListInputTypes(OtDbContext operationTheaterDbContext);
        object GetMSTCheckList(OtDbContext operationTheaterDbContext);
        object GetMSTCheckListBySurgeryId(OtDbContext operationTheaterDbContext, int SurgeryId);
        object GetCheckListByOTBookingId(OtDbContext operationTheaterDbContext, int OTBookingId, int SurgeryId);
        object CheckForDuplicateOTBooking(OtDbContext operationTheaterDbContext, int PatientVisitId, int SurgeryId);
        object CheckForProceduresBookedForDateCollision(OtDbContext operationTheaterDbContext, int PatientVisitId, DateTime BookedForDate);
        object GetOTSurgeries(OtDbContext operationTheaterDbContext);
        object GetMapSurgeryCheckListBySurgeryId(OtDbContext operationTheaterDbContext, int surgeryId);
        object GetTeamInfoByOTBooingId(OtDbContext operationTheaterDbContext, int OTBookingId);
        object GetImplantDetailByOTBookingId(OtDbContext operationTheaterDbContext, int OTBookingId);
        object GetMachineDetailByOTBookingId(OtDbContext operationTheaterDbContext, int OTBookingId);
        object GetAnaesthesiaDetailByOTBookingId(OtDbContext operationTheaterDbContext, int OTBookingId);
        object GetConcludeDetailByOTBookingId(OtDbContext operationTheaterDbContext, int OTBookingId);
        object GetOTSummaryReport(OtDbContext operationTheaterDbContext, bool IsOTStartDate, DateTime FromDate, DateTime ToDate, int? PrescribedBy);
        object GetOtTemplates(OtDbContext operationTheaterDbContext);
        object SaveAnaesthesiaType(RbacUser currentUser, OTPostAnaesthesiaTypeDTO otPostAnaesthesiaTypeDTO, OtDbContext operationTheaterDbContext);
        object UpdateAnaesthesiaType(RbacUser currentUser, OTPostAnaesthesiaTypeDTO otPostAnaesthesiaTypeDTO, OtDbContext operationTheaterDbContext);
        object GetAnaesthesiaServiceItems(OtDbContext operationTheaterDbContext);
        object GetOTMapAnaesthesiaServiceItems(OtDbContext operationTheaterDbContext);
        object SaveOTMapAnaesthesiaType(RbacUser currentUser, OTMapAnaesthesiaServiceItemDTO otMapAnaesthesiaServiceItemDTO, OtDbContext operationTheaterDbContext);
        object UpdateMapAnaesthesiaType(RbacUser currentUser, OTMapAnaesthesiaServiceItemDTO otMapAnaesthesiaServiceItemDTO, OtDbContext operationTheaterDbContext);
        #endregion


        #region POST

        object SaveOTMachine(RbacUser currentUser, OTMachineDTO otMachineDTO, OtDbContext operationTheaterDbContext);
        object SavePersonnelType(RbacUser currentUser, OTPersonnelTypeDTO otPersonnelTypeDTO, OtDbContext operationTheaterDbContext);
        object SaveNewOTBooking(RbacUser currentUser, OTBookingDetailsDTO otBookingDTO, OtDbContext operationTheaterDbContext);
        object SaveMSTCheckList(RbacUser currentUser, OTPostMSTCheckListDTO otMSTCheckListDTO, OtDbContext operationTheaterDbContext);
        object SaveCheckList(RbacUser currentUser, OTPostCheckListDTO otCheckListDTO, OtDbContext operationTheaterDbContext);
        object SaveOTSurgery(RbacUser currentUser, OTSurgeryDTO otSurgeryDTO, OtDbContext operationTheaterDbContext);
        object SaveImplantDetail(RbacUser currentUser, OTPostImplantDetailDTO Implant, int PatientId, int PatientVisitId, int OTBookingId, OtDbContext operationTheaterDbContext);
        object SaveMachineDetail(RbacUser currentUser, OTPostMachineDetailDTO machine, OtDbContext operationTheaterDbContext);

        #endregion


        #region PUT

        object UpdateOTMachine(RbacUser currentUser, OTMachineDTO otMachineDTO, OtDbContext operationTheaterDbContext);
        object UpdatePersonnelType(RbacUser currentUser, OTPersonnelTypeDTO otPersonnelTypeDTO, OtDbContext operationTheaterDbContext);
        object UpdateOTBooking(RbacUser currentUser, OTBookingDetailsDTO otBookingDTO, OtDbContext operationTheaterDbContext);
        object UpdateAnaesthesiaDetails(RbacUser currentUser, int OTBookingId, bool UseAnaesthesia, string AnaesthesiaDetails, OtDbContext operationTheaterDbContext);
        object CancelOTBooking(RbacUser currentUser, int otBookingId, string cancellationRemarks, OtDbContext operationTheaterDbContext);
        object ConfirmOTBooking(RbacUser currentUser, int otBookingId, OtDbContext operationTheaterDbContext);
        object CheckInOTBooking(RbacUser currentUser, int otBookingId, OtDbContext operationTheaterDbContext);
        object RescheduleOTBooking(RbacUser currentUser, int otBookingId, DateTime rescheduledDate, OtDbContext operationTheaterDbContext);
        object UpdateMSTCheckList(RbacUser currentUser, OTPostMSTCheckListDTO otMSTCheckListDTO, OtDbContext operationTheaterDbContext);
        object SaveLookUp(RbacUser currentUser, int checkListId, string lookUp, OtDbContext operationTheaterDbContext);
        object UpdateCheckList(RbacUser currentUser, OTPostCheckListDTO otCheckListDTO, OtDbContext operationTheaterDbContext);
        object UpdateOTSurgery(RbacUser currentUser, OTSurgeryDTO otSurgeryDTO, OtDbContext operationTheaterDbContext);
        object MapSurgeryCheckList(RbacUser currentUser, OTMapSurgeryCheckListDTO otMapSurgeryCheckListDTO, OtDbContext operationTheaterDbContext);
        object UpdatePersonnelDetails(RbacUser currentUser, List<OTPostTeamInfoDTO> TeamInfoList, int OTBookingId, int PatientId, int PatientVisitId, OtDbContext operationTheaterDbContext);
        /*object UpdateOTMachineByOTBookingId(RbacUser currentUser, int OTBookingId, int OTMachineId, OtDbContext operationTheaterDbContext);*/
        object DeactivateImplantDetail(RbacUser currentUser, int OTBookingId, int ImplantDetailId, OtDbContext operationTheaterDbContext);
        object DeactivateMachineDetail(RbacUser currentUser, int OTBookingId, int MachineDetailId, OtDbContext operationTheaterDbContext);
        object ConcludeOTBooking(RbacUser currentUser, int OTBookingId, OTConcludeBookingDTO oTConcludeBookingDTO, OtDbContext operationTheaterDbContext);
        object GetOTFinancialReport(OtDbContext operationTheaterDbContext, bool isOTStartDate, DateTime fromDate, DateTime toDate, int? prescribedBy);

        #endregion
    }
}
