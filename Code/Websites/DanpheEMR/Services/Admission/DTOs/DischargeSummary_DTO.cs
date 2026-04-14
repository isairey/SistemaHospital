using DanpheEMR.ServerModel.AdmissionModels;
using DanpheEMR.ServerModel;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System;

namespace DanpheEMR.Services.Admission.DTOs
{
    public class DischargeSummary_DTO
    {
        public int DischargeSummaryId { get; set; }
        public int PatientVisitId { get; set; }
        public int DischargeTypeId { get; set; }
        public int? DoctorInchargeId { get; set; }
        public string OperativeProcedure { get; set; }
        public string OperativeFindings { get; set; }
        public int? AnaesthetistsId { get; set; }
        public string Diagnosis { get; set; }
        public string CaseSummary { get; set; }
        public string Condition { get; set; }
        public string TreatmentDuringHospitalStay { get; set; }
        public string HospitalReport { get; set; }
        public string SpecialNotes { get; set; }
        public string Medications { get; set; }
        public string Allergies { get; set; }
        public string Activities { get; set; }
        public string Diet { get; set; }
        public string RestDays { get; set; }
        public string FollowUp { get; set; }
        public string Others { get; set; }
        public int? ResidenceDrId { get; set; }
        public int CreatedBy { get; set; }
        public DateTime CreatedOn { get; set; }
        public int? ModifiedBy { get; set; }
        public DateTime? ModifiedOn { get; set; }
        public bool? IsSubmitted { get; set; }
        public bool? IsDischargeCancel { get; set; }
        public string LabTests { get; set; }
        public int? DischargeConditionId { get; set; }
        public int? DeliveryTypeId { get; set; }
        public int? BabyBirthConditionId { get; set; }
        public int? DeathTypeId { get; set; }
        public string DeathPeriod { get; set; }
        public string DischargeOrder { get; set; }
        [NotMapped]
        public virtual List<DischargeSummaryMedication> DischargeSummaryMedications { get; set; }
        [NotMapped]
        public virtual List<BabyBirthDetailsModel> BabyBirthDetails { get; set; }

        public int? NotesId { get; set; }
        public string ChiefComplaint { get; set; }
        public string PendingReports { get; set; }
        public string HospitalCourse { get; set; }
        public string PresentingIllness { get; set; }
        public string ProcedureNts { get; set; }
        public string SelectedImagingItems { get; set; }
        public string OtherDiagnosis { get; set; }
        public string ProvisionalDiagnosis { get; set; }

        [NotMapped]
        public List<ADTDischargeSummaryConsultantModel> DischargeSummaryConsultants { get; set; }

        public string BabyWeight { get; set; } 
        public int? CheckedBy { get; set; } 
        public string ClinicalFindings { get; set; }
        public string PastHistory { get; set; }
        public int? DischargeSummaryTemplateId { get; set; }
        public string HistoryOfPresentingIllness { get; set; }
        public string ObstetricHistory { get; set; }
        public string RelevantMaternalHistory { get; set; }
        public string IndicationForAdmission { get; set; }
        public string RespiratorySystem { get; set; }
        public string CardiovascularSystem { get; set; }
        public string GastrointestinalAndNutrition { get; set; }
        public string Renal { get; set; }
        public string NervousSystem { get; set; }
        public string Metabolic { get; set; }
        public string Sepsis { get; set; }
        public string CongenitalAnomalies { get; set; }
        public string Reflexes { get; set; }
        public string MedicationsReceivedInNICUNursery { get; set; }
        public string Discussion { get; set; }
    }
}
