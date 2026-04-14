using DanpheEMR.DalLayer;
using DanpheEMR.Security;
using DanpheEMR.ServerModel.MedicareModels;
using DanpheEMR.Services.Patient.DTO;
using DanpheEMR.ViewModel.Medicare;
using System.Threading.Tasks;

namespace DanpheEMR.Services.Patient
{
    public interface IPatientService
    {
        Task<PatientDetailByPatientCodeDTO> GetPatientDetailByPatientCodeAsync(string patientCode, PatientDbContext patientDbContext);
        object GetMedicarePatientList(MedicareDbContext _medicareDbContext);
        Task<object> GetDesignations(MedicareDbContext medicareDbContext);
        Task<object> GetInsuranceProviders(MedicareDbContext medicareDbContext);
        Task<object> GetAllMedicareInstitutes(MedicareDbContext medicareDbContext);
        Task<object> GetDepartments(MedicareDbContext medicareDbContext);
        Task<object> GetMedicareTypes(MedicareDbContext medicareDbContext);
        Task<object> GetMedicareMemberByPatientId(MedicareDbContext medicareDbContext, int PatientId);
        MedicareMember SaveMedicareMemberDetails(MedicareDbContext medicareDbContext, MedicareMemberDto medicareMemberDto, RbacUser currentUser);
        MedicareMember UpdateMedicareMemberDetails(MedicareDbContext medicareDbContext, MedicareMemberDto medicareMemberDto, RbacUser currentUser);
        Task<object> GetDependentMedicareMemberByPatientId(MedicareDbContext medicareDbContext, int PatientId);
        Task<object> GetMedicareMemberByMedicareNo(MedicareDbContext medicareDbContext, string medicareNo);
        Task<object> GetPatientById(int patientId, PatientDbContext patientDbContext);
    }
}
