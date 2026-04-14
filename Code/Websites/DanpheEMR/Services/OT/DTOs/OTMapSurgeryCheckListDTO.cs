using System.Collections.Generic;

namespace DanpheEMR.Services.OT.DTOs
{
    public class OTMapSurgeryCheckListDTO
    {
        public List<OTMapSurgeryCheckListItems> MapSurgeryCheckListItems { get; set; }
        public int SurgeryId { get; set; }
    }

    public class OTMapSurgeryCheckListItems
    {
        public int SurgeryCheckListId { get; set; }
        public int SurgeryId { get; set; }
        public int CheckListId { get; set; }
        public int DisplaySequence { get; set; }
        public bool IsMandatory { get; set; }
        public bool IsActive { get; set; }
    }
}
