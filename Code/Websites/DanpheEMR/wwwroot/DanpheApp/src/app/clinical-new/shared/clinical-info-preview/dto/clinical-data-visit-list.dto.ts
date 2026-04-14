export interface ClinicalDataVisitListDTO {
    VisitCode: string;
    VisitDate: Date;
    PatientVisitId: number;
    PatientId: number;
    VisitStatus: string;
    IsClinicalDataEditable: boolean;
}