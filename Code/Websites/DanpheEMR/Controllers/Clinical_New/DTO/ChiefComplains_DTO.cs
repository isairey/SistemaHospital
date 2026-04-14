using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace DanpheEMR.Controllers.Clinical_New.DTO
{
    public class ChiefComplains_DTO
    {
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
