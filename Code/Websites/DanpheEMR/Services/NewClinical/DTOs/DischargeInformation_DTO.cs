using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace DanpheEMR.Services.NewClinical.DTOs
{
    public class DischargeInformation_DTO
    {
        public int DischargeInformationId { get; set; }
        public int DischargeTypeId { get; set; }
        public int? SubDischargeTypeId { get; set; }
        public int? CheckdById { get; set; }
        public int DoctorInchargeId { get; set; }
        public int? ResidentDrId { get; set; }
        public int? DischargeNurseId { get; set; }
        public int PatientId { get; set; }
        public int PatientVisitId { get; set; }
        public bool IsOtPatient { get; set; }
        public string OperationType { get; set; }
        public DateTime? OperationDate { get; set; }
        public int? AnaesthetistId { get; set; }
        public List<int> SelectedConsultants { get; set; }
        public string Consultant { get; set; }


    }
}
