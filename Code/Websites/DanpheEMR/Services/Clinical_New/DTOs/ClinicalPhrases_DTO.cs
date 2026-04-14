using System;

namespace DanpheEMR.Services.Clinical_New.DTOs
{
    public class ClinicalPhrases_DTO
    {
        public int PredefinedTemplateId { get; set; }
        public string TemplateCode { get; set; }
        public string TemplateName { get; set; }
        public string TemplateGroup { get; set; }
        public string TemplateType { get; set; }
        public string TemplateAccessibility { get; set; }
        public int CreatedBy { get; set; }
        public DateTime CreatedOn { get; set; }
        public int? ModifiedBy { get; set; }
        public DateTime? ModifiedOn { get; set; }
        public bool IsActive { get; set; }
        public string TemplateContent { get; set; }
    }
}
