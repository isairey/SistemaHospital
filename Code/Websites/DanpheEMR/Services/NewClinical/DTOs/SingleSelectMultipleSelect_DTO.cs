using DanpheEMR.Controllers.Clinical_New.DTO;
using System.Collections.Generic;

namespace DanpheEMR.Services.NewClinical.DTOs
{
	public class SingleSelectMultipleSelect_DTO
	{
		public int ClinicalInformationId { get; set; }
		public int PatientId { get; set; }
		public int PatientVisitId { get; set; }
		public int ClinicalHeadingId { get; set; }
		public int? ParentHeadingId { get; set; }
		public int FieldId { get; set; }
		public string InputType { get; set; }
		public string FieldValue { get; set; }
		public string Remarks { get; set; }
		public List<OptionAnswers_DTO> OptionAnswers { get; set; }
	}
	public class PutSingleSelectMultipleSelect_DTO
	{
		public int ClinicalInformationId { get; set; }
		public int? PatientId { get; set; }
		public int? PatientVisitId { get; set; }
		public int? ClinicalHeadingId { get; set; }
		public int? ParentHeadingId { get; set; }
		public int? FieldId { get; set; }
		public string InputType { get; set; }
		public string FieldValue { get; set; }
		public string Remarks { get; set; }
		public List<OptionAnswers_DTO> OptionAnswers { get; set; }
	}
}
