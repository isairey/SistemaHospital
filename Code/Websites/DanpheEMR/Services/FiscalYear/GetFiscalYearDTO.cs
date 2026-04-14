using System;

namespace DanpheEMR.Services.FiscalYear
{
    public class GetFiscalYearDTO
    {
        public int FiscalYearId { get; set; }
        public string FiscalYearName { get; set; }
        public DateTime StartYear { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndYear { get; set; }
        public DateTime EndDate { get; set; }
        public int? CreatedBy { get; set; }
        public bool IsActive { get; set; }
        public int? EmployeeId { get; set; }
        public string EmployeeFullName { get; set; }
    }
}
