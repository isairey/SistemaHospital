export class AddBedReservation_DTO {
    PatientId: number = 0;
    PatientVisitId: number = 0;
    WardId: number = 0;
    BedFeatureId: number = 0;
    BedId: number = 0;
    CareTakerId: number = 0;
    PrimaryCareTakerName: string = "";
    PrimaryCareTakerContact: string = "";
    SecondaryCareTakerName: string = "";
    SecondaryCareTakerContact: string = "";
}