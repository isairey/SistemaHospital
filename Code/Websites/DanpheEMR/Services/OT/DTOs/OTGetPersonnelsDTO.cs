using System;

namespace DanpheEMR.Services.OT.DTOs
{
    public class OTGetPersonnelsDTO
    {
        public int EmployeeId { get; set; }
        public string Salutation { get; set; }
        public string FirstName { get; set; }
        public string MiddleName { get; set; }
        public string LastName { get; set; }
        public string FullName { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public DateTime? DateOfJoining { get; set; }
        public string ContactNumber { get; set; }
        public string ContactAddress { get; set; }
        public string Email { get; set; }
        public string Gender { get; set; }
        public short? Extension { get; set; }
        public short? SpeedDial { get; set; }
        public string OfficeHour { get; set; }
        public string RoomNo { get; set; }
        public bool IsActive { get; set; }
        public string MedCertificationNo { get; set; }
        public string Signature { get; set; }
        public string LongSignature { get; set; }
        public int? DepartmentId { get; set; }
        public string DepartmentName { get; set; }
        public int? EmployeeRoleId { get; set; }
        public string EmployeeRoleName { get; set; }
        public int? EmployeeTypeId { get; set; }
        public string EmployeeTypeName { get; set; }
        public bool? IsAppointmentApplicable { get; set; }
        public string LabSignature { get; set; }
        public DateTime? CreatedOn { get; set; }
        public int? CreatedBy { get; set; }
        public string SignatoryImageName { get; set; }
        public int? DisplaySequence { get; set; }
        public double? TDSPercent { get; set; }
        public string PANNumber { get; set; }
        public bool? IsIncentiveApplicable { get; set; }
        public string RadiologySignature { get; set; }
        public string BloodGroup { get; set; }
        public string NursingCertificationNo { get; set; }
        public string HealthProfessionalCertificationNo { get; set; }
        public string DriverLicenseNo { get; set; }
        public int? OpdNewPatientServiceItemId { get; set; }
        public int? FollowupServiceItemId { get; set; }
        public int? OpdOldPatientServiceItemId { get; set; }
        public int? InternalReferralServiceItemId { get; set; }
        public int? PersonnelTypeId { get; set; }
        public string PersonnelTypeName { get; set; }
    }
}
