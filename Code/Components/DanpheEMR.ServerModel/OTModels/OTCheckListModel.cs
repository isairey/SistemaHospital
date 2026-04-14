using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DanpheEMR.ServerModel.OTModels
{
    public class OTCheckListModel
    {
        [Key]
        public int TXNChecklistId { get; set; }
        public int CheckListId { get; set; }
        public string CheckListValue { get; set; }
        public int OTBookingId { get; set; }
        public int PatientId { get; set; }
        public int PatientVisitId { get; set; }
        public string Remarks { get; set; }
        public int CreatedBy { get; set; }
        public DateTime CreatedOn { get; set; }
        public int? ModifiedBy { get; set; }
        public DateTime? ModifiedOn { get; set; }
    }
}
