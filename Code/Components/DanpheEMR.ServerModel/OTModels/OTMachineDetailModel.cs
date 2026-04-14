using System;
using System.ComponentModel.DataAnnotations;

namespace DanpheEMR.ServerModel.OTModels
{
    public class OTMachineDetailModel
    {
        [Key]
        public int MachineDetailId { get; set; }
        public int OTMachineId { get; set; }
        public int PatientId { get; set; }
        public int PatientVisitId { get; set; }
        public int OTBookingId { get; set; }
        public decimal Charge { get; set; }
        public int CreatedBy { get; set; }
        public DateTime CreatedOn { get; set; }
        public int? ModifiedBy { get; set; }
        public DateTime? ModifiedOn { get; set; }
        public bool IsActive { get; set; }
    }
}
