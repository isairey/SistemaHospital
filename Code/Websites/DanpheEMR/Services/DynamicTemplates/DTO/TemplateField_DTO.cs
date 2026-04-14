namespace DanpheEMR.Services.DynamicTemplates.DTO
{
    public class TemplateField_DTO
    {
        public int DischargeTypeId { get; set; }
        public string FieldName { get; set; }
        public bool IsMandatory { get; set; }
        public bool IsActive { get; set; }
        public bool IsCompulsoryField { get; set; }
        public string DisplayLabelAtPrint { get; set; }
        public string DisplayLabelAtForm { get; set; }
        public int EnterSequence { get; set; }
    }
}
