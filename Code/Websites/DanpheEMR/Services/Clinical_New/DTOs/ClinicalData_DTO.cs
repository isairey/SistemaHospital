using System;
using System.Collections.Generic;

namespace DanpheEMR.Services.Clinical_New.DTOs
{
 
    public class clinicalCommonData
    {
        public int PatientId { get; set; }
        public int PatientVisitId { get; set; }
        public DateTime CreatedOn { get; set; }
        public int CreatedBy { get; set; }
        public DateTime? ModifiedOn { get; set; }
        public int? ModifiedBy { get; set; }
		public string EnteredBy { get; set; }
	}
    public class ClinicalData_DTO : clinicalCommonData
    {
        public int ClinicalInformationId { get; set; }
        public int ClinicalHeadingId { get; set; }
        public int FieldId { get; set; }
        public string InputType { get; set; }
        public string FieldValue { get; set; }
        public string Remarks { get; set; }
        public string ClinicalHeadingName { get; set; }
        public int ParentId { get; set; }
        public string HeadingDisplayName { get; set; }
        public string FieldCode { get; set; }
        public string FieldName { get; set; }
        public string FieldDisplayName { get; set; }
        public bool IsEditable { get; set; }
        public List<ClinicalOptions_DTO> ClinicalOptionsData { get; set; }
        public List<ClinicalQuestionAnswer_DTO> ClinicalAnswerData { get; set; }
        public List<ClinicalQuestionOption_DTO> ClinicalAnswerOptionData { get; set; }
    }
   
    public class ClinicalOptions_DTO : clinicalCommonData
    {
        public int ClinicalOptionRecordId { get; set; }
        public int ClinicalInformationId { get; set; }
        public int? ParentHeadingId { get; set; }
        public int FieldId { get; set; }
        public int OptionId { get; set; }
        public string Options { get; set; }
    }

    public class ClinicalQuestionAnswer_DTO : clinicalCommonData
    {
        public int ClinicalQuestionAnswerId { get; set; }
        public int ClinicalInformationId { get; set; }
        public int ClinicalHeadingId { get; set; }
        public int ParentHeadingId { get; set; }
        public int FieldId { get; set; }
        public int QuestionId { get; set; }
        public string AnswerValue { get; set; }
        public string Remarks { get; set; }
        public string AnswerType { get; set; }
        public string Question { get; set; }
    }

    public class ClinicalQuestionOption_DTO : clinicalCommonData
    {
        public int ClinicalAnswerOptionId { get; set; }
        public int ClinicalInformationId { get; set; }
        public int ClinicalHeadingId { get; set; }
        public int? ParentHeadingId { get; set; }
        public int FieldId { get; set; }
        public int QuestionId { get; set; }
        public int QuestionOptionId { get; set; }
        public string Remarks { get; set; }
        public string QuestionOption { get; set; }


    }
}
