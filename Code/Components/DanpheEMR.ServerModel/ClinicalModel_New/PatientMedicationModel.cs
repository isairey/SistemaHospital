using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DanpheEMR.ServerModel.ClinicalModel_New
{
    public class PatientMedicationModel
    {
        [Key]
        public int PatientMedicationId { get; set; }
        public int CardexplanId { get; set; }
        public DateTime MedicationTakenDate { get; set; }
        public TimeSpan MedicationTakenTime { get; set; }
        public string Comment { get; set; }
        public int CreatedBy { get; set; }
        public DateTime CreatedOn { get; set; }
        public int? ModifiedBy { get; set; }
        public DateTime? ModifiedOn { get; set; }
        public bool IsActive { get; set; }
    }
}
