using DanpheEMR.Controllers.Clinical_New.DTO;
using System.Collections.Generic;

namespace DanpheEMR.Services.NewClinical.DTOs
{
	public class QuestionaryData_DTO
	{
		public List<QuestionaryTextBoxFreeTypeNumber_DTO> textBoxFreeTypeNumber { get; set; }
		public List<QuestionarySingleSelectMultipleSelect_DTO> singleSelectMultipleSelect { get; set; }
	}
}
