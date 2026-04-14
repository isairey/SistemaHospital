namespace DanpheEMR.ServerModel.RadiologyModels.DTOs
{
    public class AddTemplateStyleRequest
    {
        public int TemplateId { get; set; }
        public string HeaderStyle { get; set; }
        public string FooterStyle { get; set; }
    }
}
