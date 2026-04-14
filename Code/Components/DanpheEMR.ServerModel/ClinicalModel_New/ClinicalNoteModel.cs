using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DanpheEMR.ServerModel.ClinicalModels
{
    public class ClinicalNoteModel
    {
        [Key]
        public int ClinicalNoteMasterId { get; set; }
        public string DisplayName { get; set; }
        public string FieldName { get; set; }
        public int DisplayOrder { get; set; }
        public bool IsSystemDefault { get; set; }
        public int CreatedBy { get; set; }
        public DateTime CreatedOn { get; set; }
        public int? ModifiedBy { get; set; }
        public DateTime? ModifiedOn { get; set; }
    }
}
