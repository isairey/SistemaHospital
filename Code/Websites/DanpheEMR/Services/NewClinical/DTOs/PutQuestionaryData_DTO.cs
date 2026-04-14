namespace DanpheEMR.Services.NewClinical.DTOs
{
	public class QuestionaryData
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
	}

	public class QTextBoxFreeTypeNumber_DTO : QuestionaryData
	{
		public QuestionaryTextBoxFreeTypeNumber_DTO TextBoxFreeTypeNumberData { get; set; }
	}

	public class QSingleSelectMultipleSelect_DTO : QuestionaryData
	{
		public QuestionarySingleSelectMultipleSelect_DTO QuestionarySingleSelectMultipleSelectData { get; set; }
	}
}
