using DanpheEMR.Controllers.Clinical_New.DTO;
using System.Collections.Generic;

namespace DanpheEMR.Services.NewClinical.DTOs
{
	public class QuestionarySingleSelectMultipleSelect_DTO
	{
		public int QuestionId { get; set; }
		public string AnswerType { get; set; }
		public string Remarks { get; set; }
		public List<QuestionaryOptionAnswers_DTO> OptionAnswers { get; set; }
	}
}
