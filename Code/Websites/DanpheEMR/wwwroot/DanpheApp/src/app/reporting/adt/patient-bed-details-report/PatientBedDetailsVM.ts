export class PatientBedDetailsVM {
    public PatientId: number;
    public PatientName: string;
    public HospitalCode: string;
    public IPNumber: string;
    public RequestingDepartment: string;
    public AdmittingDoctor: string;
    public Ward: string;
    public BedFeature: string;
    public Status: string;
    public AdmittedDate: Date;
    public TransinDate: Date;
    public TransOutDate: Date;

    public NoOfDays: number;

}
export class WardModel {
    public WardId: number;
    public WardName: string;
}



export class BedFeatureModel {
    public BedFeatureId: number;
    public BedFeatureName: string;
}