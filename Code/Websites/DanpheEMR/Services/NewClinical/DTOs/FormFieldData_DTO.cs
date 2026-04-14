using DanpheEMR.Controllers.Clinical_New.DTO;
using System.Collections.Generic;

namespace DanpheEMR.Services.NewClinical.DTOs
{
	public class FormFieldData_DTO
	{
		public List<TextBoxFreeTypeNumber_DTO> textBoxFreeTypeNumber { get; set; }
		public List<SingleSelectMultipleSelect_DTO> singleSelectMultipleSelect { get; set; }
		public List<Questionary_DTO> questionary { get; set; }
	}
}
