using System;

namespace DanpheEMR.Services.OT.DTOs
{
    public class OTGetBookingCheckListDTO
    {
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
        /*public string CheckListName { get; set; }*/
        public string DisplayName { get; set; }
        public string InputType { get; set; }
    }
}
