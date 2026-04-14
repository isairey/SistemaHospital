using DanpheEMR.DalLayer;

namespace DanpheEMR.Services.Emergency
{
    public interface IEmergencyService
    {
        object EmergencyPatients(int selectedCase, EmergencyDbContext _emergencyDbContext);
    }
}
