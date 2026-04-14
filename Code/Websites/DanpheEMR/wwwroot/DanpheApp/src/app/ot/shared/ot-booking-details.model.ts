import { PostOTDiagnosis_DTO } from "./dto/post-ot-diagnosis.dto";

export class OTBookingDetailsModel {
  OTBookingId: number = 0;
  PatientId: number = null;
  PatientVisitId: number = null;
  BookedForDate: string = null;
  ICDDiagnosis: string = null;  // need to remove from model and  remove from server side model and from database table too.
  Diagnoses = new Array<PostOTDiagnosis_DTO>();
  OtherDiagnosis: string = null;
  BillingItems: string = null;
  UseAnaesthesia: boolean = false;
  Anaesthesias: string = null;
  OTMachineId: number = null;
  Remarks: string = null;
  CancellationRemarks: string = null;
  Status: string = null;
  OTExpectedDuration: number = 0;
  SurgeryId: number = 0;
  SurgeryType: string = "";
  OTPriority: string = "";
  PrescribedBy: number = 0;
  OTStartTime: string = "";
  OTConcludeTime: string = "";
  ConcludeRemarks: string = "";
  IsOnScheduledTime: boolean = true;
  IsSeroPositive: boolean = false;
  OutTimeCharge: number = 0;
  // OTTeamInfo = new Array<PostOTTeamInfo_DTO>();

  constructor() {
  }

}