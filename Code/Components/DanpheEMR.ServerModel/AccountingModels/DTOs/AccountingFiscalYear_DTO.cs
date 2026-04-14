using System.ComponentModel.DataAnnotations.Schema;
using System;

namespace DanpheEMR.Services.Accounting.DTOs
{
    public class AccountingFiscalYear_DTO
    {
        public int FiscalYearId { get; set; }
        public string FiscalYearName { get; set; }
        public string NpFiscalYearName { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string Description { get; set; }
        public DateTime CreatedOn { get; set; }
        public int CreatedBy { get; set; }
        public bool IsActive { get; set; }
        public string nStartDate { get; set; }
        public string nEndDate { get; set; }
        public bool? IsClosed { get; set; }
        public int? ClosedBy { get; set; }
        public DateTime? ClosedOn { get; set; }
        public bool? ReadyToClose { get; set; }
        public string Remark { get; set; }
        public bool? showreopen { get; set; }
        public int HospitalId { get; set; }
        public DateTime? CurrentDate { get; set; }
    }
}
