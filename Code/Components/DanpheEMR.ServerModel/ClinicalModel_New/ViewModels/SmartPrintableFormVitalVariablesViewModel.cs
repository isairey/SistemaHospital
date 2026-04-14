using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DanpheEMR.ServerModel.ClinicalModel_New.ViewModels
{
    public class SmartPrintableFormVitalVariablesViewModel
    {
        //Patient Details
        public int PatientVisitId { get; set; }

        //Vital Details
        public int VitalsId { get; set; }
        public string VitalsName { get; set; }
        public string VitalsType { get; set; }
        public string Unit { get; set; }
        public string VitalsGroup { get; set; }
        public string VitalsValue { get; set; }
        public string Remarks { get; set; }


        public static List<SmartPrintableFormVitalVariablesViewModel> MapDataTableToList(DataTable patVitalInfo)
        {
            List<SmartPrintableFormVitalVariablesViewModel> retList = new List<SmartPrintableFormVitalVariablesViewModel>();
            if (patVitalInfo != null)
            {
                string strPatVitalData = JsonConvert.SerializeObject(patVitalInfo);
                retList = JsonConvert.DeserializeObject<List<SmartPrintableFormVitalVariablesViewModel>>(strPatVitalData);
            }
            return retList;
        }

    }
}

