using DanpheEMR.DalLayer;
using DanpheEMR.Security;
using DanpheEMR.Services.Clinical_New.MedicalDiagnosis.DTOs;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace DanpheEMR.Services.Clinical_New.MedicalDiagnosis
{
    public interface IMedicalDiagnosisService
    {
        Task<List<PatientMedicalDiagnosisDto>> GetPatientMedicalDiagnosis(int patientId, int patientVisitId, ClinicalDbContext clinicalDbContext);
        Task<string> SavePatientMedicalDiagnosis(List<PatientMedicalDiagnosisDto> patientMedicalDiagnoses, RbacUser currentUser, ClinicalDbContext clinicalDbContext);
    }
}
