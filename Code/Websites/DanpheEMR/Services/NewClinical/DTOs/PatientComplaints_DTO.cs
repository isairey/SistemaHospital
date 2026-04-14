using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace DanpheEMR.Services.NewClinical.DTOs
{
    public class PatientComplaints_DTO
    {
        public int ComplaintId { get; set; }
        public int? ChiefComplainId { get; set; }
        public int? Duration { get; set; }
        public string Notes { get; set; }
        public int PatientId { get; set; }
        public int PatientVisitId { get; set; }
        public string DurationType { get; set; }
        public bool IsLock { get; set; } 
        public bool IsSuspense { get; set; }
        public DateTime CreatedOn { get; set; }
        public int CreatedBy { get; set; }
        public DateTime? ModifiedOn { get; set; }
        public int? ModifiedBy { get; set; }
        public bool IsActive { get; set; }
    }
}
