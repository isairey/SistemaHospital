export class PatientComplaints_DTO {
  ComplaintId: number;
  PatientId: number;
  PatientVisitId: number;
  ChiefComplainId: number;
  ChiefComplain: string;
  Duration: number;
  DurationType: string;
  Notes: string;
  IsLock: boolean = false;
  IsSuspense: boolean = false;
  IsActive: boolean = true;

}
