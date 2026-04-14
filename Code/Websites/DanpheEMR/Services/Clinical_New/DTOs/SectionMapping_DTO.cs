using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace DanpheEMR.Services.Clinical_New.DTOs
{
    public class SectionMapping_DTO
    {
        public int? ClinicalDocumentHeadingMapId { get; set; }
        public int ClinicalHeadingId { get; set; }
        
        public List<ClinicalSectionFieldDTO> FieldList { get; set; } = new List<ClinicalSectionFieldDTO>();


    }
    public class ClinicalSectionFieldDTO
    {
        public int? ClinicalDocumentHeadingMapId { get; set; }

        public int ClinicalFieldId { get; set; }
        public int DisplaySequence { get; set; }
        
        public bool IsActive { get; set; }

    }
   
        public class ClinicalFieldsList_DTO
        {
            public int? ClinicalDocumentHeadingMapId { get; set; }
            public int FieldId { get; set; }                       
            public int DisplaySequence { get; set; }               
            public bool IsMapped { get; set; }                    
            public string FieldName { get; set; }                  
            public string InputType { get; set; }                  
            public string GroupName { get; set; }   
            public int? ClinicalHeadingId { get; set; }
        }

    
}
