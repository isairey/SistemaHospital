using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace DanpheEMR.Services.NewClinical.DTOs
{
    public class ClinicalPatientVisitConsultantsView_DTO
    {
        public int PatientVisitConsultantId { get; set; }
        public int PatientVisitId { get; set; }
        public int PatientId { get; set; }
        public string VisitType { get; set; }
        public int ConsultantId { get; set; }
        public bool IsPrimaryConsultant { get; set; }
        public bool IsChargeApplicable { get; set; }
        public int? PatientBedInfoId { get; set; }
        public bool IsActive { get; set; }
        public string ConsultantName { get; set; }
        public string DepartmentName { get; set; }
    }
}
