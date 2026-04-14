using System;
using System.ComponentModel.DataAnnotations;

namespace DanpheEMR.ServerModel.ClinicalModel_New
{
   public class ChiefComplainsModel
    {
        [Key]

        public int ChiefComplainId { get; set; }
        public string MedicalCode { get; set; }
        public string ChiefComplain { get; set; }
        public string Remarks { get; set; }
        public bool IsActive { get; set; }
        public int CreatedBy { get; set; }
        public DateTime CreatedOn { get; set; }
        public int? ModifiedBy { get; set; }
        public DateTime? ModifiedOn { get; set; }
    }
}
