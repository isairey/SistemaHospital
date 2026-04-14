export class DiagnosisModel {
    DiagnosisId: number = 0;
    ICDId: number = 0;
    PatientId: number = 0;
    PatientVisitId: number = 0;
    DiagnosisCodeDescription: string = "";
    DiagnosisCode: string = "";
    DiagnosisType: string = "";
    IsCauseOfDeath: boolean = false;
    Remarks: string = "";
    ModificationHistory: string = "";
    CreatedBy: number = 0;
    ModifiedBy: number = 0;
    CreatedOn: string = "";
    ModifiedOn: string = "";
    IsActive: boolean = false;
}