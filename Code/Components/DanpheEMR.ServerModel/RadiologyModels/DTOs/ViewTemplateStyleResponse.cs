using System;
namespace DanpheEMR.ServerModel.RadiologyModels.DTOs
{
    public class ViewTemplateStyleResponse
    {
        public int TemplateStyleId { get; set; }
        public string TemplateName { get; set; }
        public string TemplateCode { get; set; }
        public int TemplateId { get; set; }
        public string HeaderStyle { get; set; }
        public string FooterStyle { get; set; }
        public bool IsActive { get; set; }
    }
}
