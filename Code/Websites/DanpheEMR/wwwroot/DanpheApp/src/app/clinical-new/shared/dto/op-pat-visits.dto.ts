export class OPDPatientVisit_DTO {
    public PatientId: number = 0;
    public PatientCode: string;
    public Gender: string;
    public DateOfBirth: Date;
    public Name: string;
    public DepartmentName: string;
    public DepartmentId: number = 0;
    public DoctorId: number = 0;
    public Doctor: string;
    public AppointmentDate: Date;
    public AppointmentTime: string;
    public PerformerId: number = 0;

}