using System;
using System.ComponentModel.DataAnnotations;

namespace DanpheEMR.ServerModel.OTModels
{
    public class OTImplantDetailModel
    {
        [Key]
        public int ImplantDetailId { get; set; }
        public int PatientId { get; set; }
        public int PatientVisitId { get; set; }
        public int OTBookingId { get; set; }
        public string ImplantName { get; set; }
        public int? Quantity { get; set; }
        public decimal? Charge { get; set; }
        public string Remarks { get; set; }
        public int CreatedBy { get; set; }
        public DateTime CreatedOn { get; set; }
        public int? ModifiedBy { get; set; }
        public DateTime? ModifiedOn { get; set; }
        public bool IsActive { get; set; }
    }
}
