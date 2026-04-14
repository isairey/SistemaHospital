using DanpheEMR.DalLayer;
using DanpheEMR.Services.Admission.DTOs;
using DanpheEMR.Services.Discharge.DTO;
using System.Threading.Tasks;

namespace DanpheEMR.Services.Admission
{
    public interface IAdmissionService
    {
        Task<PatientAdmissionSlip_DTO> GetAdmissionSlipDetails(int PatientVisitId, AdmissionDbContext _admissionDbContext);
        Task<PatientDischargeSlip_DTO> GetDischargeSlipDetails(int PatientVisitId, AdmissionDbContext _admissionDbContext);
    }
}