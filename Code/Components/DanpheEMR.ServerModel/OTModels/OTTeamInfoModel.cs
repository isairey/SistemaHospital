using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DanpheEMR.ServerModel
{
    public class OTTeamInfoModel
    {
        [Key]
        public int TeamInfoId { get; set; }
        public int PersonnelTypeId { get; set; }
        public int EmployeeId { get; set; }
        public int OTBookingId { get; set; }
        public int PatientId { get; set; }
        public int PatientVisitId { get; set; }
        public int CreatedBy { get; set; }
        public DateTime CreatedOn { get; set; }
        public int? ModifiedBy { get; set; }
        public DateTime? ModifiedOn { get; set; }

    }
}
