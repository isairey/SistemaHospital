namespace DanpheEMR.Services.NewClinical.DTOs
{
	public class TextBoxFreeTypeNumber_DTO
	{
		public int? ClinicalInformationId { get; set; }
		public int PatientId { get; set; }
		public int PatientVisitId { get; set; }
		public int ClinicalHeadingId { get; set; }
		public int? ParentHeadingId { get; set; }
		public int FieldId { get; set; }
		public string InputType { get; set; }
		public string FieldValue { get; set; }
		public string Remarks { get; set; }
	}
	public class PutTextBoxFreeTypeNumber_DTO
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

	public class DeleteTextBoxFreeTypeNumber_DTO
	{
		public int ClinicalInformationId { get; set; }

	}
}
