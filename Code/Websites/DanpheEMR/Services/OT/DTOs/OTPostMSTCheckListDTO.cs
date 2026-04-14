using System;

namespace DanpheEMR.Services.OT.DTOs
{
    public class OTPostMSTCheckListDTO
    {
        public int CheckListId { get; set; }

        public int? ServiceItemId { get; set; }

        public string CheckListName { get; set; }

        public string DisplayName { get; set; }

        public string InputType { get; set; }

        public bool IsMandatory { get; set; }

        public int DisplaySequence { get; set; }

        //public string LookUp { get; set; }

        public bool IsActive { get; set; }
    }
}
