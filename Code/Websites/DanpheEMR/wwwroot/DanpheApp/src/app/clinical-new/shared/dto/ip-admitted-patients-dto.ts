export class IPDAdmittedPatient_DTO {
    public PatientId: number = 0;
    public PatientCode: string;
    public Gender: string;
    public DateOfBirth: Date;
    public Name: string;
    public VisitCode: string;
    public DeparmentName: string;
    public DepartmentId: number = 0;
    public AdmittingDoctorId: number = 0;
    public AdmittingDoctorName: string;
    public AdmittedDate: Date;
    public PatientVisitId: number = 0;
    public WardBed: string;
    public Department: string;
}