namespace DanpheEMR.Controllers.Stickers.DTOs
{
    public class AddPrintTemplate_DTO
    {
        public string PrintType { get; set; }
        public string VisitType { get; set; }
        public string FieldSettingsName { get; set; }
        public string PrinterType { get; set; }
        public string PrintTemplateMainFormat { get; set; }
        public string PrintTemplateDetailsFormat { get; set; }
    }
}
