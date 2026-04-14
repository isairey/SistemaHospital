namespace DanpheEMR.Controllers.Stickers.DTOs
{
    public class UpdatePrintTemplateSettings_DTO
    {
        public int PrintTemplateSettingsId { get; set; }
        public string PrintType { get; set; }
        public string FieldSettingsName { get; set; }
        public string PrintTemplateMainFormat { get; set; }
        public string PrintTemplateDetailsFormat { get; set; }
        public string PrinterType { get; set; }
        public string VisitType { get; set; }
        public bool IsActive { get; set; }
    }
}
