using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DanpheEMR.ServerModel.OTModels
{
    public class OTMSTCheckListModel
    {
        [Key]
        public int CheckListId { get; set; }

        public int? ServiceItemId { get; set; }

        public string CheckListName { get; set; }

        public string DisplayName { get; set; }

        public string InputType { get; set; }

        public bool IsMandatory { get; set; }

        public int DisplaySequence { get; set; }

        public string LookUp { get; set; }

        public int CreatedBy { get; set; }

        public DateTime CreatedOn { get; set; }

        public int? ModifiedBy { get; set; }

        public DateTime? ModifiedOn { get; set; }

        public bool IsActive { get; set; }
    }
}
