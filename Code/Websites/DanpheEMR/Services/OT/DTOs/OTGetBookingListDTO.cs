using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Data;

namespace DanpheEMR.Services.OT.DTOs
{
    public class OTGetBookingListDTO
    {
        public int OTBookingId { get; set; }
        public string HospitalNumber { get; set; }
        public string PatientName { get; set; }
        public string AgeSex { get; set; }
        public string IncomingWard { get; set; }
        public DateTime BookedForDate { get; set; }
        public string SurgeryName { get; set; }
        public string OTPriority { get; set; }
        public string SurgeryType { get; set; }
        public string BillingItems { get; set; }
        public string Surgeon { get; set; }
        public string Status { get; set; }
        public DateTime? OTConcludeTime { get; set; }
        public string OTSchedule {  get; set; }
        public string Remarks { get; set; }
        public decimal? OTExpectedDuration { get; set; }

        public int PatientId { get; set; }
        public int PatientVisitId { get; set; }

        public static List<OTGetBookingListDTO> MapDataTableToSingleObject(DataTable dtHeaderDetails)
        {
            List<OTGetBookingListDTO> retObj = new List<OTGetBookingListDTO>();
            if (dtHeaderDetails != null)
            {
                string strPatData = JsonConvert.SerializeObject(dtHeaderDetails);
                List<OTGetBookingListDTO> headerList = JsonConvert.DeserializeObject<List<OTGetBookingListDTO>>(strPatData);
                retObj = headerList;
            }
            return retObj;
        }

    }
}
