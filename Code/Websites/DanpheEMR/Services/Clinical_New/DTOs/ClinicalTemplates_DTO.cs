using System;

namespace DanpheEMR.Services.Clinical_New.DTOs
{
    public class ClinicalTemplates_DTO
    {
        public int TemplateId { get; set; }
        public string TemplateCode { get; set; }
        public string TemplateName { get; set; }
        public string TemplateType { get; set; }
        public string TemplateHTML { get; set; }
        public bool IsActive { get; set; }
        public int CreatedBy { get; set; }
        public DateTime CreatedOn { get; set; }
        public int? ModifiedBy { get; set; }
        public DateTime? ModifiedOn { get; set; }
        public bool PrintHospitalHeader { get; set; }
        public string EditorType { get; set; }
    }
}
