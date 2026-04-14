using System;
using System.ComponentModel.DataAnnotations;

namespace DanpheEMR.ServerModel.MasterModels
{
    public class MasterFiscalYearModel
    {
        [Key]
        public int FiscalYearId { get; set; }

        public string FiscalYearName { get; set; }

        public DateTime StartDate_AD { get; set; }

        public DateTime EndDate_AD { get; set; }

        public string StartDate_BS { get; set; }

        public string EndDate_BS { get; set; }

        public string NpFiscalYrName { get; set; }
    }
}
