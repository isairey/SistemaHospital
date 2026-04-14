using Newtonsoft.Json;
using System.Collections.Generic;
using System.Data;

namespace DanpheEMR.DalLayer
{
    public class ClinicalFieldMapVM
    {

        public int? EmployeeId { get; set; }
        public int? DepartmentId { get; set; }
        public int? ClinicalHeadingId { get; set; }
        public int? ParentClinicalHeadingId { get; set; }
        public string ParentHeading { get; set; }
        public string ParentHeadingDisplayName { get; set; }
        public int? ParentHeadingDisplaySeq { get; set; }
        public bool? ParentHeadingIsDefault { get; set; }


		public int? ChildHeadingId { get; set; }
        public string ChildHeading { get; set; }
        public string ChildHeadingDisplayName { get; set; }
        public int? ChildHeadingDisplaySeq { get; set; }
        public bool? ChildHeadingIsDefault { get; set; }

		public int? FieldId { get; set; }
        public string FieldCode { get; set; }
        public string FieldName { get; set; }
        public string FieldInputType { get; set; }

        public string FieldDisplayName { get; set; }
        public int FieldDisplaySequence { get; set; }

		public bool IsAcrossVisitAvailability { get; set; }
        public bool IsDisplayTitle { get; set; }

		public int? OptionId { get; set; }
        public string Option { get; set; }
        public int? QuestionId { get; set; }

        public string Question { get; set; }
        public string AnswerType { get; set; }
        public int? QuestionOptionId { get; set; }
        public string QuestionOption { get; set; }

        public static List<ClinicalFieldMapVM> MapDataTableToSingleObject(DataTable clinicalField)
        {
            List<ClinicalFieldMapVM> retObj = new List<ClinicalFieldMapVM>();
            if (clinicalField != null)
            {
                string strClinicalData = JsonConvert.SerializeObject(clinicalField);
                //Datatable contains array, we need to deserialize int?o list then take the first one.
                List<ClinicalFieldMapVM> clinicalFieldList = JsonConvert.DeserializeObject<List<ClinicalFieldMapVM>>(strClinicalData);
                if (clinicalFieldList != null && clinicalFieldList.Count > 0)
                {
                    retObj = clinicalFieldList;
                }
            }
            return retObj;
        }
    }
}
