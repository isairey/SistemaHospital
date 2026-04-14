using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Data;

namespace DanpheEMR.Services.OT.DTOs
{
    public class OTSummaryReportDTO
    {
        public int OTBookingId { get; set; }
        public int PatientVisitId { get; set; }
        public int PatientId { get; set; }
        public int PriceCategoryId { get; set; }
        public string HospitalNumber { get; set; }
        public string PatientName { get; set; }
        public string AgeSex { get; set; }
        public string IncomingWard { get; set; }
        public DateTime OTStartTime { get; set; }
        public DateTime? OTConcludeDateTime { get; set; }
        public string SurgeryCode { get; set; }
        public string SurgeryName { get; set; }
        public string Priority { get; set; }
        public string SurgeryType { get; set; }
        public string Surgeon { get; set; }
        public string Diagnosis { get; set; }
        public string Anaesthesias { get; set; }
        public string MachineName { get; set; }
        public decimal MachineCost { get; set; }
        public string OTSchedule { get; set; }
        public decimal OutTimeCharge { get; set; }
        public string Implants { get; set; }
        public float ImplantCost { get; set; }
        public string BillingItems { get; set; }
        public decimal SurgeryAmount { get; set; }
        public string OTRemarks { get; set; }
        public bool IsSeroPositive { get; set; }

        public static List<OTSummaryReportDTO> MapDataTableToSingleObject(DataTable dtHeaderDetails)
        {
            List<OTSummaryReportDTO> retObj = new List<OTSummaryReportDTO>();
            if (dtHeaderDetails != null)
            {
                string strPatData = JsonConvert.SerializeObject(dtHeaderDetails);
                List<OTSummaryReportDTO> headerList = JsonConvert.DeserializeObject<List<OTSummaryReportDTO>>(strPatData);
                retObj = headerList;
            }
            return retObj;
        }
    }
}
