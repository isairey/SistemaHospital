namespace DanpheEMR.Services.NewClinical.DTOs
{
	public class QuestionaryTextBoxFreeTypeNumber_DTO
	{
		public int? ClinicalQuestionAnswerId { get; set; }
		public int QuestionId { get; set; }
		public string AnswerType { get; set; }
		public string AnswerValue { get; set; }
		public string Remarks { get; set; }
	}
}
