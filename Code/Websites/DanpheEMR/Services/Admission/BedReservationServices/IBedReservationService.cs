using DanpheEMR.Controllers.Admission.DTOs;
using DanpheEMR.DalLayer;
using DanpheEMR.Security;

namespace DanpheEMR.Services.Admission.BedReservationServices
{
    public interface IBedReservationService
    {
        object ReserveBed(AdmissionDbContext admissionDbContext,AddBedReservation_DTO addBedReservation, RbacUser currentUser);
    }
}
