using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DanpheEMR.ServerModel.ClinicalModel_New
{
    public class DischargeInformationModel
    {
        [Key]
        public int DischargeInformationId { get; set; }
        public int DischargeTypeId { get; set; }
        public int? SubDischargeTypeId { get; set; }
        public int PatientId { get; set; }
        public int PatientVisitId { get; set; }
        public int? CheckdById { get; set; }
        public int DoctorInchargeId { get; set; }
        public int? ResidentDrId { get; set; }
        public int? DischargeNurseId { get; set; }
        public bool IsOtPatient { get; set; }
        public string OperationType { get; set; }
        public DateTime? OperationDate { get; set; }
        public string Consultant { get; set; }
        public int? AnaesthetistId { get; set; }
        public int CreatedBy { get; set; }
        public int? ModifiedBy { get; set; }
        public DateTime CreatedOn { get; set; }
        public DateTime? ModifiedOn { get; set; }
       public bool IsActive { get; set; }
    }
}
