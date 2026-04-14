using System;

namespace DanpheEMR.Services.Clinical_New.DTOs
{
    public class BookAdmission_DTO
    {
        public string Case { get; set; }
        public string DepartmentName { get; set; }
        public int DepartmentId { get; set; }
        public string AdmittingDoctor { get; set; }
        public int AdmittingDoctorId { get; set; }
        public string WardName { get; set; }
        public int WardId { get; set; }
        public int BedFeatureId { get; set; }
        public string BedFeature { get; set; }
        public int BedId { get; set; }
        public string Bed { get; set; }
        public string AdmissionNotes { get; set; }
        public DateTime? AutoCancelledOn { get;  set; }
        public int PatientId { get;  set; }
        public int PatientVisitId { get;  set; }
    }
}
