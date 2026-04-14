export class MedicalDiagnosisDto {
  DiagnosisId: number = 0;
  ICD10ID: number = 0;
  PatientId: number = 0;
  PatientVisitId: number = 0;
  DiagnosisCode: string = '';
  DiagnosisCodeDescription: string = '';
  DiagnosisType: string = '';
  IsCauseOfDeath: boolean = false;
  Remarks: string;
  ModificationHistory: string = '';
  IsActive: boolean = false;
}
