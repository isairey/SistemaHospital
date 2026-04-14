using System;
using System.ComponentModel.DataAnnotations;

namespace DanpheEMR.ServerModel.OTModels
{
    public class OTMapSurgeryCheckListModel
    {
        [Key]
        public int SurgeryCheckListId { get; set; }
        public int SurgeryId { get; set; }
        public int CheckListId { get; set; }
        public int DisplaySequence { get; set; }
        public bool IsMandatory { get; set; }
        public int CreatedBy { get; set; }
        public DateTime CreatedOn { get; set; }
        public int? ModifiedBy { get; set; }
        public DateTime? ModifiedOn { get; set; }
        public bool IsActive { get; set; }
    }
}
