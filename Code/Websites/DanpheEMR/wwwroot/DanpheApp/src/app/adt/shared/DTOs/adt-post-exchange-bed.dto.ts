export class AdtExchangeBed_DTO {
    PatientId: number = 0;
    PatientVisitId: number = 0;
    WardId: number = 0;
    BedFeatureId: number = 0;
    CurrentBedId: number = 0;
    DesiredBedId: number = 0;
    IsDesiredBedOccupied: boolean = false;
    IsDesiredBedReserved: boolean = false;
    BedOccupiedByPatientId: number = null;
    BedOccupiedByPatientVisitId: number = null;
}