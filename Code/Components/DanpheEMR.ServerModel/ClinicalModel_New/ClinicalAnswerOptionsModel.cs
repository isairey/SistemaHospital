using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DanpheEMR.ServerModel.ClinicalModel_New
{
	public class ClinicalAnswerOptionsModel
	{
		[Key]
		public int ClinicalAnswerOptionId {get; set;}
		public int ClinicalInformationId {get; set;}  
		public int PatientId {get; set;}
		public int PatientVisitId {get; set;} 
		public int ClinicalHeadingId {get; set;}
		public int? ParentHeadingId {get; set;}
		public int FieldId {get; set;}
		public int QuestionId {get; set;} 
		public int QuestionOptionId {get; set;}
		public string Remarks {get; set;}
		public DateTime CreatedOn {get; set;}
		public int CreatedBy {get; set;}  
		public DateTime? ModifiedOn {get; set;}
		public int? ModifiedBy {get; set;} 
		public bool IsActive{get; set;}
		public ClinicalInformationsModel ClinicalInformationsModel { get; set; }

	}
}
