using System.Collections.Generic;

namespace DanpheEMR.Services.OT.DTOs
{
    public class OTPostCheckListDTO
    {
        public int OTBookingId { get; set; }
        public int PatientId { get; set; }
        public int PatientVisitId { get; set; }
        public List<CheckList> CheckList { get; set; }
    }

    public class CheckList
    {
        public int TXNChecklistId { get; set; }
        public int CheckListId { get; set; }
        public string CheckListValue { get; set; }
        public string Remarks { get; set; }
    }
}
