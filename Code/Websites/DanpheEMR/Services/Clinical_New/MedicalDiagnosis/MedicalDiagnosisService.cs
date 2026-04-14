using DanpheEMR.DalLayer;
using DanpheEMR.Security;
using DanpheEMR.ServerModel.ClinicalModels;
using DanpheEMR.Services.Clinical_New.MedicalDiagnosis.DTOs;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Linq;
using System.Threading.Tasks;

namespace DanpheEMR.Services.Clinical_New.MedicalDiagnosis
{
    public class MedicalDiagnosisService : IMedicalDiagnosisService
    {
        private readonly ILogger<MedicalDiagnosisService> _logger;

        public MedicalDiagnosisService(ILogger<MedicalDiagnosisService> logger)
        {
            _logger = logger;
        }
        public async Task<List<PatientMedicalDiagnosisDto>> GetPatientMedicalDiagnosis(int patientId, int patientVisitId, ClinicalDbContext clinicalDbContext)
        {
            if (patientId == 0)
            {
                _logger.LogError($"{nameof(patientId)} is required to read Medical Diagnosis");
                throw new InvalidOperationException($"{nameof(patientId)} is required to read Medical Diagnosis");
            }

            if (patientVisitId == 0)
            {
                _logger.LogError($"{nameof(patientVisitId)} is required to read Medical Diagnosis");
                throw new InvalidOperationException($"{nameof(patientVisitId)} is required to read Medical Diagnosis");
            }

            var diagnosis = await clinicalDbContext.cln_diagnosis
                                             .Where(d => d.PatientId == patientId && d.PatientVisitId == patientVisitId)
                                             .Select(d => new PatientMedicalDiagnosisDto
                                             {
                                                 DiagnosisId = d.DiagnosisId,
                                                 PatientId = d.PatientId,
                                                 ICD10ID = d.ICDId,
                                                 PatientVisitId = d.PatientVisitId,
                                                 DiagnosisCode = d.DiagnosisCode,
                                                 DiagnosisCodeDescription = d.DiagnosisCodeDescription,
                                                 DiagnosisType = d.DiagnosisType,
                                                 IsCauseOfDeath = d.IsCauseOfDeath,
                                                 Remarks = d.Remarks,
                                                 ModificationHistory = d.ModificationHistory,
                                                 IsActive = (bool)d.IsActive
                                             }).ToListAsync();
            return diagnosis;
        }

        public async Task<string> SavePatientMedicalDiagnosis(List<PatientMedicalDiagnosisDto> patientMedicalDiagnoses, RbacUser currentUser, ClinicalDbContext clinicalDbContext)
        {
            if (patientMedicalDiagnoses == null || !patientMedicalDiagnoses.Any())
            {
                _logger.LogError("patientMedicalDiagnoses cannot be null or empty to save patient medical diagnosis");
                throw new ArgumentException("patientMedicalDiagnoses cannot be null or empty", nameof(patientMedicalDiagnoses));
            }

            try
            {
                DateTime currentDateTime = DateTime.UtcNow;
                int patientId = patientMedicalDiagnoses[0].PatientId;
                int patientVisitId = patientMedicalDiagnoses[0].PatientVisitId;

                var existingDiagnoses = await clinicalDbContext.cln_diagnosis
                    .Where(d => d.PatientId == patientId && d.PatientVisitId == patientVisitId && d.IsActive)
                    .ToListAsync();

                var newDiagnosisCodes = new HashSet<string>(patientMedicalDiagnoses.Select(d => d.DiagnosisCode));

                foreach (var existingDiagnosis in existingDiagnoses)
                {
                    if (!newDiagnosisCodes.Contains(existingDiagnosis.DiagnosisCode))
                    {
                        existingDiagnosis.IsActive = false;
                        existingDiagnosis.ModifiedBy = currentUser.EmployeeId;
                        existingDiagnosis.ModifiedOn = currentDateTime;
                    }
                }

                var diagnosesToAdd = new List<DiagnosisModel>();
                foreach (var diagFromClient in patientMedicalDiagnoses)
                {
                    if (!existingDiagnoses.Any(ed => ed.DiagnosisCode == diagFromClient.DiagnosisCode))
                    {
                        diagnosesToAdd.Add(new DiagnosisModel
                        {
                            PatientId = diagFromClient.PatientId,
                            PatientVisitId = diagFromClient.PatientVisitId,
                            DiagnosisType = diagFromClient.DiagnosisType,
                            DiagnosisCode = diagFromClient.DiagnosisCode,
                            DiagnosisCodeDescription = diagFromClient.DiagnosisCodeDescription,
                            ICDId = diagFromClient.ICD10ID,
                            CreatedBy = currentUser.EmployeeId,
                            CreatedOn = currentDateTime,
                            IsActive = true
                        });
                    }
                }

                clinicalDbContext.cln_diagnosis.AddRange(diagnosesToAdd);
                await clinicalDbContext.SaveChangesAsync();

                return "Patient Medical Diagnosis Saved Successfully.";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving patient medical diagnosis");
                throw;
            }
        }
    }
}
