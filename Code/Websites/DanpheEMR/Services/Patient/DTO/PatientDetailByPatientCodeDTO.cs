using System;

namespace DanpheEMR.Services.Patient.DTO
{
    public class PatientDetailByPatientCodeDTO
    {
        public int PatientId { get; set; }
        public string PatientCode { get; set; }
        public string FirstName { get; set; }
        public string MiddleName { get; set; }
        public string LastName { get; set; }
        public DateTime DateOfBirth { get; set; }
        public string Gender { get; set; }
        public string Email { get; set; }
        public string PhoneNumber { get; set; }
        public string BloodGroup { get; set; }
        public string Address { get; set; }
        public string CountryName{ get; set; }
        public string CountrySubDivisionName { get; set; }
        public string MunicipalityName { get; set; }
    }
}
