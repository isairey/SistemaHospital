using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Data;

namespace DanpheEMR.ViewModel.Clinical
{
    public static class ClinicalDataVM
    {
        public static List<T> MapDataTableToJsonData<T>(DataTable clinicalField)
        {
            List<T> retObj = new List<T>();
            if (clinicalField != null)
            {
                string strClinicalData = JsonConvert.SerializeObject(clinicalField);
                //Datatable contains array, we need to deserialize int?o list then take the first one.
                List<T> clinicalFieldList = JsonConvert.DeserializeObject<List<T>>(strClinicalData);
                if (clinicalFieldList != null && clinicalFieldList.Count > 0)
                {
                    retObj = clinicalFieldList;
                }
            }
            return retObj;
        }
    }

    public class clinicalCommonDataVM
    {
        public int PatientId { get; set; }
        public int PatientVisitId { get; set; }
        public DateTime CreatedOn { get; set; }
        public int CreatedBy { get; set; }
        public DateTime? ModifiedOn { get; set; }
        public int? ModifiedBy { get; set; }
        public string EnteredBy { get; set; }

	}
    public class ClinicalInformationVM : clinicalCommonDataVM
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

    }

    public class ClinicalOptions : clinicalCommonDataVM
    {
        public int ClinicalOptionRecordId { get; set; }
        public int ClinicalInformationId { get; set; }
        public int ParentHeadingId { get; set; }
        public int FieldId { get; set; }
        public int OptionId { get; set; }
        public string Options { get; set; }
    }

    public class ClinicalQuestionAnswer : clinicalCommonDataVM
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

    public class ClinicalQuestionOption : clinicalCommonDataVM
    {
        public int ClinicalAnswerOptionId { get; set; }
        public int ClinicalInformationId { get; set; }
        public int ClinicalHeadingId { get; set; }
        public int ParentHeadingId { get; set; }
        public int FieldId { get; set; }
        public int QuestionId { get; set; }
        public int QuestionOptionId { get; set; }
        public string Remarks { get; set; }
        public string QuestionOption { get; set; }


    }
}
