using Newtonsoft.Json;
using System.Collections.Generic;
using System;
using System.Data;
using System.Linq;

namespace DanpheEMR.Services.Insurance
{
    public class InsurancePatientVM
    {
        public int PatientId { get; set; }
        public string PatientCode { get; set; }
        public string FirstName { get; set; }
        public string MiddleName { get; set; }
        public string LastName { get; set; }
        public string ShortName { get; set; }
        public string PatientNameLocal { get; set; }
        public string Age { get; set; }
        public string Gender { get; set; }
        public string BloodGroup { get; set; }
        public string PhoneNumber { get; set; }
        public string DateOfBirth { get; set; }
        public string Address { get; set; }
        public int? CountryId { get; set; }
        public string CountryName { get; set; }
        public int? CountrySubDivisionId { get; set; }
        public string CountrySubDivisionName { get; set; }
        public int? MunicipalityId { get; set; }
        public string MunicipalityName { get; set; }
        public string CreatedOn { get; set; }
        public string Ins_NshiNumber { get; set; }
        public string Ins_LatestClaimCode { get; set; }
        public bool? Ins_HasInsurance { get; set; }
        public decimal? Ins_InsuranceBalance { get; set; }
        public decimal? InitialBalance { get; set; }
        public string PANNumber { get; set; }
        public bool? IsOutdoorPat { get; set; }
        public int? MembershipTypeId { get; set; }
        public string MembershipTypeName { get; set; }
        public decimal? MembershipDiscountPercent { get; set; }
        public bool IsAdmitted { get; set; }
        public int? InsuranceProviderId { get; set; }
        public DateTime? ClaimCodeGeneratedOn { get; set; }
        public string AdmissionStatus { get; set; }
        public DateTime? DischargeDate { get; set; }
        public string VisitType { get; set; }


        public static InsurancePatientVM MapDataTableToSingleObject(DataTable insPatData)
        {
            InsurancePatientVM retObj = null;
            if (insPatData != null && insPatData.Rows.Count > 0)
            {
                retObj = new InsurancePatientVM();
                string strSettlData = JsonConvert.SerializeObject(insPatData);
                List<InsurancePatientVM> insPatientList = JsonConvert.DeserializeObject<List<InsurancePatientVM>>(strSettlData);
                if (insPatientList != null && insPatientList.Count > 0)
                {
                    retObj = insPatientList.First();
                }
            }
            return retObj;
        }
    }
}
