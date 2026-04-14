using DanpheEMR.DalLayer;
using Newtonsoft.Json;
using System.Collections.Generic;
using System.Data;

namespace DanpheEMR.ViewModel.Clinical
{
	public class ClinicalNoteMapVM
	{
		public int ClinicalNotesMasterId { get; set; }
		public string ClinicalNotesCode { get; set; }
		public string ClinicalNotesName { get; set; }
		public int? NoteDisplaySequence { get; set; }
		public bool IsDefault { get; set; }
		public int ClinicalFieldId { get; set; }
		public int? EmployeeId { get; set; }
		public int? DepartmentId { get; set; }
		public int? FieldDisplaySequence { get; set; }
		public string FieldCode { get; set; }
		public string FieldName { get; set; }
		public string InputType { get; set; }
		public string SmartTemplate { get; set; }
		public string FieldDisplayName { get; set; }
		public bool IsAcrossVisitAvailability { get; set; }
        public int? QuestionId { get; set; }
		public string Question { get; set; }
		public string AnswerType { get; set; }
		public bool IsDisplayTitle { get; set; }

		public static List<ClinicalNoteMapVM> MapDataTableToSingleObject(DataTable clinicalNote)
		{
			List<ClinicalNoteMapVM> retObj = new List<ClinicalNoteMapVM>();
			if (clinicalNote != null)
			{
				string strClinicalData = JsonConvert.SerializeObject(clinicalNote);
				//Datatable contains array, we need to deserialize int?o list then take the first one.
				List<ClinicalNoteMapVM> clinicalNoteList = JsonConvert.DeserializeObject<List<ClinicalNoteMapVM>>(strClinicalData);
				if (clinicalNoteList != null && clinicalNoteList.Count > 0)
				{
					retObj = clinicalNoteList;
				}
			}
			return retObj;
		}
	}
}
