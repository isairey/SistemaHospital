using DanpheEMR.ServerModel;
using DanpheEMR.Services.ClaimManagement.DTOs;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Data;

namespace DanpheEMR.Services.OT.DTOs
{
    public class OTGetOTBookingDetailsDTO
    {
        public int OTBookingId { get; set; }
        public string HospitalNumber { get; set; }
        public string PatientName { get; set; }
        public string AgeSex { get; set; }
        public int PatientId { get; set; }
        public int PatientVisitId { get; set; }
        public int PriceCategoryId { get; set; }
        public DateTime BookedForDate { get; set; }
        public string ICDDiagnosis { get; set; }
        public string OtherDiagnosis { get; set; }
        public string BillingItems { get; set; }
        public bool UseAnaesthesia { get; set; }
        public string Anaesthesias { get; set; }
        public string OTMachineIds { get; set; }
        public int CreatedBy { get; set; }
        public DateTime CreatedOn { get; set; }
        public int? ModifiedBy { get; set; }
        public DateTime? ModifiedOn { get; set; }
        public string CancellationRemarks { get; set; }
        public string Remarks { get; set; }
        public string Status { get; set; }
        public string SurgeryName { get; set; }
        public int SurgeryId { get; set; }
        public decimal OTExpectedDuration { get; set; }
        public string SurgeryType { get; set; }
        public string OTPriority { get; set; }
        public int PrescribedBy { get; set; }
        public string PatientCode { get; set; }
        public string PhoneNumber { get; set; }
        public string Address { get; set; }
        public bool IsSeroPositive { get; set; }
        public string VisitType { get; set; }
        public string VisitCode { get; set; }
        public string BedCode { get; set; }
        public string WardName { get; set; }
        public DateTime? OTConcludeTime { get; set; }
        public DateTime? OTStartTime { get; set; }
        public string ConcludeRemarks { get; set; }
        public bool IsOnScheduledTime { get; set; }
        public Decimal? OutTimeCharge { get; set; }
        public string MunicipalityName { get; set; }
        public string CountrySubDivisionName { get; set; }
        public string CountryName { get; set; }

        public string WardNumber { get; set; }


        public static List<OTGetOTBookingDetailsDTO> MapDataTableToSingleObject(DataTable dtHeaderDetails)
        {
            List<OTGetOTBookingDetailsDTO> retObj = new List<OTGetOTBookingDetailsDTO>();
            if (dtHeaderDetails != null)
            {
                string strPatData = JsonConvert.SerializeObject(dtHeaderDetails);
                List<OTGetOTBookingDetailsDTO> headerList = JsonConvert.DeserializeObject<List<OTGetOTBookingDetailsDTO>>(strPatData);
                retObj = headerList;
            }
            return retObj;
        }

    }
}
