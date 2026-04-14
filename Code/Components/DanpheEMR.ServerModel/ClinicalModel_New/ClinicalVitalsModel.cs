using System;
using System.ComponentModel.DataAnnotations;

namespace DanpheEMR.ServerModel.ClinicalModel_New
{
    public class ClinicalVitalsModel
    {
        [Key]
        public int VitalsId { get; set; }
        public string VitalsCode { get; set; }
        public string VitalsType { get; set; }
        public string VitalsName { get; set; }
        public string Unit { get; set; }
        public int DisplayOrder { get; set; }
        public string VitalsGroup { get; set; }
        public int CreatedBy { get; set; }
        public DateTime CreatedOn { get; set; }
        public DateTime? ModifiedOn { get; set; }
        public int? ModifiedBy { get; set; }
        public bool IsActive { get; set; }
        public string InputType { get; set; }
    }
}
