using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DanpheEMR.ServerModel.ClinicalModel_New
{
    public class PatientComplaintsModel
    {
        [Key]
        public int ComplaintId { get; set; }
        public int? ChiefComplainId { get; set; }
        public int? Duration { get; set; }
        public string Notes { get; set; }
        public int PatientId { get; set; }
        public int PatientVisitId { get; set; }
        public string DurationType { get; set; }
        public bool IsLock { get; set; }
        public bool IsSuspense { get; set; }
        public DateTime CreatedOn { get; set; }
        public int CreatedBy { get; set; }
        public DateTime? ModifiedOn { get; set; }
        public int? ModifiedBy { get; set; }
        public bool IsActive { get; set; }
    }
}
