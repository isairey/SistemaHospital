using DocumentFormat.OpenXml.Office2010.ExcelAc;
using System.Collections.Generic;

namespace DanpheEMR.Services.Clinical_New.DTOs
{
	public class Note
	{
		public int ClinicalNotesMasterId { get; set; }
		public string ClinicalNotesCode { get; set; }
		public string ClinicalNotesName { get; set; }
		public int? NoteDisplaySequence { get; set; }
		public bool IsDefault { get; set; }
		public List<NoteField> Fields { get; set; }
	}

	public class NoteField
	{
		public int ClinicalNotesMasterId { get; set; }
		public int ClinicalFieldId { get; set; }
		public string FieldCode { get; set; }
		public string FieldName { get; set; }
		public string InputType { get; set; }
		public string SmartTemplate { get; set; }
		public string FieldDisplayName { get; set; }
		public int? FieldDisplaySequence { get; set; }
		public bool IsAcrossVisitAvailability { get; set; }
		public bool IsDisplayTitle { get; set; }

        public List<NoteQuestionary> Questions { get; set; }

	}

	public class NoteQuestionary
	{
		public int? ClinicalFieldId { get; set; }
		public int? QuestionId { get; set; }
		public string Question { get; set; }
		public string AnswerType { get; set; }
	}

}
