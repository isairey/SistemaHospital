import * as moment from "moment";
export class DischargePatientReferralModel {
    PatientReferralId: number = 0;
    PatientId: number = 0;
    PatientVisitId: number = 0;
    ReferralDate: string = moment().format("YYYY-MM-DD");
    ReferredFromDepartmentId: number = null;
    ReferredToDepartmentId: number = null;
    ReferralCenter: string = "";
    ClinicalHistory: string = "";
    CurrentDiagnosis: string = "";
    CurrentTreatments: string = "";
    ReasonForReferral: string = "";
    MedicalOfficer: string = "";
    Remarks: string = "";
    CreatedBy: number = null;
    CreatedOn: string = null;
    ModifiedBy: number = null;
    ModifiedOn: string = "";
    Age: number = null;
    Sex: number = null;
    AdmittedDate: string = null;
    DepartmentFromName: string = null;
    DepartmentToName: string = null;
    PatientName: string = null;
}
