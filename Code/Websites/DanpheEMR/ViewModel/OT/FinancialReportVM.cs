using Newtonsoft.Json;
using System.Collections.Generic;
using System.Data;

namespace DanpheEMR.ViewModel.OT
{
    public class FinancialReportVM
    {
        public string HospitalNumber { get; set; }
        public string PatientName { get; set; }
        public string SurgeryCode { get; set; }
        public string SurgeryName { get; set; }
        public string Priority { get; set; }
        public string SurgeryType { get; set; }
        public string OTSchedule { get; set; }
        public decimal OutTimeCharge { get; set; }
        public bool IsSeroPositive { get; set; }
        public string Surgeon { get; set; }
        public string Anaesthesias { get; set; }
        public string MachineName { get; set; }
        public decimal MachineCost { get; set; }
        public string Implants { get; set; }
        public decimal ImplantCost { get; set; }
        public string BillingItems { get; set; }
        public decimal SurgeryAmount { get; set; }
        public string OTRemarks { get; set; }
        public string Anesthesiologists { get; set; }
        public static List<FinancialReportVM> MapDataTableToSingleObject(DataTable dtHeaderDetails)
        {
            List<FinancialReportVM> retObj = new List<FinancialReportVM>();
            if (dtHeaderDetails != null)
            {
                string strData = JsonConvert.SerializeObject(dtHeaderDetails);
                retObj = JsonConvert.DeserializeObject<List<FinancialReportVM>>(strData);
            }
            return retObj;
        }
    }
}
