using OfficeOpenXml.FormulaParsing.Excel.Functions.DateTime;
using System.ComponentModel.DataAnnotations;

namespace DanpheEMR.Services.BillSettings.DTOs
{
    public class BillingCounter_DTO
    {
        public int CounterId { get; set; }
        public string CounterName { get; set; }
        public string CounterType { get; set; }
        public string BeginningDate { get; set; }
        public string ClosingDate { get; set; }
        public int BranchId { get; set; }
        public int CreatedBy { get; set; }
        public Date CreatedOn { get; set; }
    }
}
