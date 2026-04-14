namespace DanpheEMR.Services.NewClinical.DTOs
{
	public class GetClinicalPharse_DTO
	{
		public int PredefinedTemplateId { get; set; }
		public string TemplateName{get; set; }
		public string TemplateCode{get; set; }
		public string TemplateGroup{get; set; }
		public string TemplateType{get; set; }
		public string TemplateContent{get; set; }
	}
}
