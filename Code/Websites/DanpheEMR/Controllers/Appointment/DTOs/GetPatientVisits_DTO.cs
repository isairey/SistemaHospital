using System;

namespace DanpheEMR.Controllers.Appointment.DTOs
{
    public class GetPatientVisits_DTO
    {
        public int PatientId { get; set; }
        public string PatientCode { get; set; }
        public string FirstName { get; set; }
        public string MiddleName { get; set; }
        public string LastName { get; set; }
        public string ShortName { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public string Age { get; set; }
        public string PhoneNumber { get; set; }
        public string Gender { get; set; }
        public int CountryId { get; set; }
        public int? CountrySubDivisionId { get; set; }
        public int? MunicipalityId { get; set; }
        public int? WardNumber { get; set; }
        public string CountrySubDivisionName { get; set; }
        public string MunicipalityName { get; set; }
        public string PANNumber { get; set; }
        public string Address { get; set; }
        public string IDCardNumber { get; set; }
        public string DependentId { get; set; }
        public string Posting { get; set; }
        public string Rank { get; set; }
        public int PatientVisitId { get; set; }
        public string VisitCode { get; set; }
        public int? ParentVisitId { get; set; }
        public int? PerformerId { get; set; }
        public string PerformerName { get; set; }
        public int? ReferredById { get; set; }
        public DateTime VisitDate { get; set; }
        public bool IsAdmitted { get; set; }
        public DateTime? AdmittingDate { get; set; }
        public DateTime? DischargeDate { get; set; }
        public TimeSpan? VisitTime { get; set; }
        public int DepartmentId { get; set; }
        public string Department { get; set; }
        public string VisitType { get; set; }
        public string AppointmentType { get; set; }
        public int DaysPassed { get; set; }
        public int MaxAllowedFollowUpDays { get; set; }
        public int MaxAllowedReferralDays { get; set; }
        public int SchemeId { get; set; }
        public string SchemeName { get; set; }
        public int? QueueNo { get; set; }
        public bool IsVisitContinued { get; set; }
        public string BillingStatus { get; set; }
        public string PolicyNo { get; set; }
        public int PriceCategoryId { get; set; }
        public bool IsFreeVisit { get; set; }
        public string CareTakerName { get; set; }
        public string RelationWithCareTaker { get; set; }
        public string CareTakerContact { get; set; }
        public string MaritalStatus { get; set; }
        public string EthnicGroup { get; set; }
        public string ApiIntegrationName { get; set; }
    }
}
