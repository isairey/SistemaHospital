using DanpheEMR.ServerModel.BillingModels;
using Newtonsoft.Json;
using System.Collections.Generic;
using System.Data;
using System.Linq;

namespace DanpheEMR.Controllers.NewClinical
{
    public class ClinicalFieldVM
    {
        public int EmployeeId { get; set; }
        public int DepartmentId { get; set; }
        public int ParentClinicalHeadingId { get; set; }
        public string ParentHeading { get; set; }
        public string ParentHeadingDisplayName { get; set; }
        public int ParentHeadingDisplaySeq { get; set; }

        public int ChildHeadingId { get; set; }
        public string ChildHeading { get; set; }
        public string ChildHeadingDisplayName { get; set; }
        public int ChildHeadingDisplaySeq { get; set; }
        public int FieldId { get; set; }
        public string FieldCode { get; set; }
        public string FieldName { get; set; }
        public string FieldInputType { get; set; }

        public string FieldDisplayName { get; set; }
        public int OptionId { get; set; }
        public string Option { get; set; }
        public int QuestionId { get; set; }

        public string Question { get; set; }
        public string AnswerType { get; set; }
        public int QuestionOptionId { get; set; }
        public string QuestionOption { get; set; }

        public static ClinicalFieldVM MapDataTableToSingleObject(DataTable clinicalField)
        {
            ClinicalFieldVM retObj = new ClinicalFieldVM();
            if (clinicalField != null)
            {
                string strClinicalData = JsonConvert.SerializeObject(clinicalField);
                //Datatable contains array, we need to deserialize into list then take the first one.
                List<ClinicalFieldVM> clinicalFieldList = JsonConvert.DeserializeObject<List<ClinicalFieldVM>>(strClinicalData);
                if (clinicalFieldList != null && clinicalFieldList.Count > 0)
                {
                    retObj = clinicalFieldList.First();
                }
            }
            return retObj;
        }
    }
}
