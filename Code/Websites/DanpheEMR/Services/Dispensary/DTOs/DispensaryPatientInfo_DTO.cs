using DanpheEMR.ServerModel.BillingModels;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Reflection;

namespace DanpheEMR.Services.Dispensary.DTOs
{
    public class DispensaryPatientInfo_DTO
    {
        public int PatientId { get; set; }
        public string PatientCode { get; set; }
        public string Gender { get; set; }
        public string PhoneNumber { get; set; }
        public string PANNumber { get; set; }
        public string FirstName { get; set; }
        public string MiddleName { get; set; }
        public string LastName { get; set; }
        public string Age { get; set; }
        public string Address { get; set; }
        public string ShortName { get; set; }
        public string CountrySubDivisionName { get; set; }
        public string CountryName { get; set; }
        public string MunicipalityName { get; set; }
        public Int16? WardNumber { get; set; }
        public DateTime DateOfBirth { get; set; }
        public string Ins_NshiNumber { get; set; }
        public int? PatientVisitId { get; set; }
        public int? PrescriberId { get; set; }
        public DateTime? VisitDate { get; set; }
        public string VisitType { get; set; }
        public int? SchemeId { get; set; }
        public string SchemeName { get; set; }
        public int? PriceCategoryId { get; set; }
        public long? ClaimCode { get; set; }
        public string PolicyNo { get; set; }
        public long? LatestClaimCode { get; set; }
        public decimal GeneralCreditLimit { get; set; }
        public decimal IpCreditLimit { get; set; }
        public double OpCreditLimit { get; set; }
        public bool IsAdmitted { get; set; }

        public static DispensaryPatientInfo_DTO ConvertDataTableToPatientInfoObject(DataTable patInfo)
        {
            DispensaryPatientInfo_DTO retObj = new DispensaryPatientInfo_DTO();
            if (patInfo != null)
            {
                string pat = JsonConvert.SerializeObject(patInfo);
                List<DispensaryPatientInfo_DTO> patList = JsonConvert.DeserializeObject<List<DispensaryPatientInfo_DTO>>(pat);
                if (patList != null && patList.Count > 0)
                {
                    retObj = patList.First();
                }
            }
            return retObj;
        }
    }
}
