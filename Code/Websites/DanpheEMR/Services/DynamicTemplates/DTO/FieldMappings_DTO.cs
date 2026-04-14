namespace DanpheEMR.Services.DynamicTemplates.DTO
{
    public class FieldMappings_DTO
    {
        public int FieldMasterId { get; set; }
        public string FieldName { get; set; }
        public int TemplateId { get; set; }
        public string TemplateName { get; set; }
        public bool IsMandatory { get; set; }
        public string DisplayLabelAtForm { get; set; }
        public string DisplayLabelAtPrint { get; set; }
        public bool IsActive { get; set; }
        public bool IsMapped { get; set; }
        public int? EnterSequence { get; set; }
    }
}
