using System;

namespace DanpheEMR.Services.NewClinical.DTOs
{
    public class Imaging_DTO
    {
        public int? ImagingItemId { get; set; }
        public string ImagingItemName { get; set; }
        public DateTime? CreatedOn { get; set; }
        public int ImagingRequisitionId { get; set; }
        public string OrderStatus { get; set; }
    }
}
