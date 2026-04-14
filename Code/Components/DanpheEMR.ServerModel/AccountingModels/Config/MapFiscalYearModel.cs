using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DanpheEMR.ServerModel.AccountingModels.Config
{
    public class MapFiscalYearModel
    {
        [Key]
        public int FiscalYearHospitalMapId { get; set; }
        public int FiscalYearId { get; set; }
        public int HospitalId { get; set; }
        public bool IsClosed { get; set; }
        public DateTime? ClosedOn { get; set; }
        public int? ClosedBy { get; set; }
        public string ModuleName { get; set; }
        public int CreatedBy { get; set; }
        public DateTime CreatedOn { get; set; }
        public int? ModifiedBy { get; set; }
        public DateTime? ModifiedOn { get; set; }
        public bool IsActive { get; set; }      
        public bool ReadyToClose { get; set; }      

    }
}
