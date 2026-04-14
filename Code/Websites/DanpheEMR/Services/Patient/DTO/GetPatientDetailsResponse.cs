using System;
namespace DanpheEMR.Services.Patient.DTO
{
    public class GetPatientDetailsResponse
    {
        public int PatientId { get; set; }
        public int? PatientVisitId { get; set; }
        public int PatientNo { get; set; }
        public string Salutation { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string MiddleName { get; set; }
        public string ShortName { get; set; }
        public string Gender { get; set; }
        public string Age { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public string PhoneNumber { get; set; }
        public string Email { get; set; }
        public string BloodGroup { get; set; }
        public int CountryId { get; set; }
        public string CountryName { get; set; }
        public int? CountrySubDivisionId { get; set; }
        public string CountrySubDivisionName { get; set; }
        public string MunicipalityName { get; set; }
        public string Occupation { get; set; }
        public bool IsActive { get; set; }
        public bool IsDobVerified { get; set; }
        public string Address { get; set; }
        public string PANNumber { get; set; }
        public bool HasInsurance { get; set; }
        public double? InsuranceBalance { get; set; }
        public string VisitType { get; set; }
        public string EthnicGroup { get; set; }
        public bool IsAdmitted { get; set; }
        public int? DiscountSchemeId{ get; set; }
        public bool? IsItemDiscountEnabled { get; set; }
        public int? SchemeId { get; set; }
        public int? PriceCategoryId { get;set; }
        public string PatientCode { get;set; }
        public string MaritalStatus { get;set; }

    }
}
