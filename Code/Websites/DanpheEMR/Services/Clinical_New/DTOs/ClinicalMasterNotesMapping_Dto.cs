using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace DanpheEMR.Services.Clinical_New.DTOs
{
    public class ClinicalMasterNotesMapping_Dto
    {
       public int ClinicalMapComponentId { get; set; }
        public int? DepartmentId { get; set; }
       public int ClinicalNotesMasterId { get; set; }
        public List<ClinicalNotesFieldDTO> FieldList { get; set; }
        public int? EmployeeId { get; set; }
    }
        public class ClinicalNotesFieldDTO
         {
            public int? ClinicalMapComponentId { get; set; }
            public int DisplaySequence { get; set; }
            public int FieldId { get; set; }
            public string FieldName { get; set; }
            public bool IsActive { get; set; }

        }

    
}
