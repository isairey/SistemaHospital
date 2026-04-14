using DanpheEMR.ServerModel;

namespace DanpheEMR.Controllers.Appointment.DTOs
{
    public class FreeVisit_DTO
    {
        public PatientModel Patient { get; set; }
        public VisitModel Visit { get; set; }
    }
}
