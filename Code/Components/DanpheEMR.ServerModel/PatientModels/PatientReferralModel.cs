using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DanpheEMR.ServerModel.PatientModels
{
    public class PatientReferralModel
    {
        [Key]
        public int PatientReferralId { get; set; }
        public int PatientId { get; set; }
        public int PatientVisitId { get; set; }
        public DateTime? ReferralDate { get; set; }
        public int? ReferredFromDepartmentId { get; set; }
        public int? ReferredToDepartmentId { get; set; }
        public string ReferralCenter { get; set; }
        public string ClinicalHistory { get; set; }
        public string CurrentDiagnosis { get; set; }
        public string CurrentTreatments { get; set; }
        public string ReasonForReferral { get; set; }
        public string MedicalOfficer { get; set; }
        public string Remarks { get; set; }
        public DateTime? CreatedOn { get; set; }
        public int? CreatedBy { get; set; }
        public int? ModifiedBy { get; set; }
        public DateTime? ModifiedOn { get; set; }
    }
}

