using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace DanpheEMR.Services.Clinical_New.DTOs
{
    public class ClinicalMasterNotes_DTO
    {
        public int ClinicalNotesMasterId { get; set; }
        public string ClinicalNotesCode { get; set; }
        public string ClinicalNotesName { get; set; }
        public int DisplaySequence { get; set; }
        public bool IsDefault { get; set; }
        public bool IsActive { get; set; }
    }
}
