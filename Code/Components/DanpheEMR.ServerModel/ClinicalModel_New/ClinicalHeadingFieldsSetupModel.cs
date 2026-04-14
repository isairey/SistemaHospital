using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DanpheEMR.ServerModel.ClinicalModel_New
{
    public class ClinicalHeadingFieldsSetupModel
    {
        [Key]
        public int FieldId { get; set; }
        public string FieldCode { get; set; }
        public string FieldName { get; set; }
        public string FieldDisplayName { get; set; }
        public string InputType { get; set; }
        public int CreatedBy { get; set; }
        public DateTime CreatedOn { get; set; }
        public DateTime? ModifiedOn { get; set; }
        public int? ModifiedBy { get; set; }
        public bool IsActive { get; set; }
        public bool IsIPD { get; set; }
        public bool IsOPD { get; set; }
        public bool IsEmergency { get; set; }
        public string GroupName { get; set; }
        public bool IsAcrossVisitAvailability { get; set; }
        public bool IsDisplayTitle { get; set; }
    }
}
