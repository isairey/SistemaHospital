namespace DanpheEMR.Controllers.Admission.DTOs
{
    public class AddPatientVisitConsultants_DTO
    {
        public string VisitType { get; set; }
        public int ConsultantId { get; set; }
        public bool IsPrimaryConsultant { get; set; }
    }
}
