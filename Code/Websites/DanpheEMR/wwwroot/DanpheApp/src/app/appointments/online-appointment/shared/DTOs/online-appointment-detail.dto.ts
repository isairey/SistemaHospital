export interface OnlineAppointmentDetail_DTO {
  PatientId: string
  VisitId: string
  SchedulingId: string
  VisitDate: string
  HospitalId: string
  DepartmentId: string
  DoctorId: string
  VisitEndTime: string
  ContactNumber: string
  PatientName: string
  Gender: string
  DateOfBirth: string
  TreatmentAdvice: string
  Medication: string
  DoctorName: string
  BookingTime?: string
  PaymentStatus: string
  FollowUp: any
  Status: string
  IsActive: boolean
  HospitalIdentifier: string
  DepartmentName: string
  VisitType: string
  Address: string
  PaymentMethod: string
}