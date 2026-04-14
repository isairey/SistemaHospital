namespace DanpheEMR.ServerModel.RadiologyModels.DTOs
{
    public class UpdateTemplateStyleRequest
    {
        public int TemplateStyleId { get; set; }
        public int TemplateId { get; set; }
        public string HeaderStyle { get; set; }
        public string FooterStyle { get; set; }
    }
}
