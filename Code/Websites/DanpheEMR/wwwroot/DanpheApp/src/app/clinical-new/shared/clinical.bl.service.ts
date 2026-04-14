import { Injectable } from "@angular/core";
import * as _ from 'lodash';
import { Observable } from "rxjs";
import { BillingTransactionItem } from "../../billing/shared/billing-transaction-item.model";
import { CoreDLService } from "../../core/shared/core.dl.service";
import { Patient } from "../../patients/shared/patient.model";
import { DanpheHTTPResponse } from "../../shared/common-models";

import { MedicalDiagnosisDto } from "../../shared/diagnosis/dto/medical-diagnosis.dto";
import { PatientFollowUpDto } from "../reusable-component/clinical-patient-follow-up/dto/patient-follow-up.dto";
import { QSingleSelectMultipleSelect, QTextBoxFreeTypeNumber } from "./clinical-info-preview/dto/clinical-put-data.dto";
import { ClinicalNoteDLService } from "./clinical.dl.service";
import { BabyBirthDetails } from "./dto/baby-birth-details.dto";
import { BookAdmission_DTO } from "./dto/book-admission.dto";
import { ClinicalAssessmentAndPlan_DTO } from "./dto/clinicalAssessmentAndPlan.dto";
import { DischargeInformation_DTO } from "./dto/discharge-information.dto";
import { MedicationCardex_Dto } from "./dto/medication-cardex-plan.dto";
import { MedicationLog_DTO } from "./dto/medication-log.dto";
import { Medication_DTO } from "./dto/medication.dto";
import { PatientComplaints_DTO } from "./dto/patient-complaints.dto";
import { PostClnVitalsTxn_DTO } from "./dto/post-cln-vitals-txn.dto";
import { SingleSelectMultipleSelect } from "./dto/singleselect-multipleselect.dto";
import { TextBoxFreeTypeNumber } from "./dto/textbox-freetype-number.dto";
import { Allergy } from "./model/allergy.model";
import { CLN_BloodSugarMonitoring } from "./model/cln-blood-sugar-monitoring.model";
import { Cln_BloodSugar_Dto } from "./model/cln-blood-sugar.dto";
import { ConsultationRequestModel } from "./model/consultation-request.model";
import { IntakeOutput } from "./model/inatke-output.model";

@Injectable()
export class ClinicalNoteBLService {
  public PatientDetails: Patient = new Patient();
  constructor(
    public coreDLService: CoreDLService,
    public clinicalNoteDLSerivce: ClinicalNoteDLService) {

  }

  public GetICD_11List() {
    return this.clinicalNoteDLSerivce.GetICD_11List()
      .map((res: DanpheHTTPResponse) => { return res; });
  }

  GetBillingSummaryForPatient(patientId: number, patientVisitId: number) {
    return this.clinicalNoteDLSerivce.GetBillingSummaryForPatient(patientId, patientVisitId)
      .map((res: DanpheHTTPResponse) => { return res; });
  }
  public GetAllDepartmentsList() {
    return this.clinicalNoteDLSerivce.GetAllDepartments()
      .map((res: DanpheHTTPResponse) => { return res; });
  }
  public CancelItemRequest(item: BillingTransactionItem) {
    var temp = _.omit(item, [
      "ItemList",
      "BillingTransactionItemValidator",
      "Patient",
    ]);
    let data = JSON.stringify(temp);
    return this.clinicalNoteDLSerivce.CancelItemRequest(data).map((responseData) => {
      return responseData;
    });
  }
  public CancelBillRequest(item: BillingTransactionItem) {
    var temp = _.omit(item, [
      "ItemList",
      "BillingTransactionItemValidator",
      "Patient",
    ]);
    let data = JSON.stringify(temp);
    return this.clinicalNoteDLSerivce.CancelBillRequest(data).map((responseData) => {
      return responseData;
    });
  }

  public PostFormFieldData(formFieldData: any) {
    return this.clinicalNoteDLSerivce.PostFormFieldData(formFieldData)
      .map(res => {
        return res;
      });
  }
  public GetQuestionaryConfig(Field: number) {
    return this.clinicalNoteDLSerivce.GetQuestionaryConfig(Field)
      .map(res => {
        return res;
      });
  }
  public GetClinicalHeadingSubHeadingField(visitType: string) {
    return this.clinicalNoteDLSerivce.GetClinicalHeadingSubHeadingField(visitType)
      .map(res => {
        return res;
      });
  }


  public GetMedicationIntake() {
    return this.clinicalNoteDLSerivce.GetMedicationIntake()
      .map((res: DanpheHTTPResponse) => { return res; });
  }
  public GetFrequencyDisplayName() {
    return this.clinicalNoteDLSerivce.GetFrequencyDisplayName()
      .map((res: DanpheHTTPResponse) => { return res; });
  }
  public SearchRegisteredPatient(searchText: string) {
    return this.clinicalNoteDLSerivce.SearchRegisteredPatient(searchText)
      .map(res => {
        return res;
      });
  }
  public PostAssessmentAndPlan(saveClinicalAssessment: ClinicalAssessmentAndPlan_DTO[]) {
    return this.clinicalNoteDLSerivce.PostAssessmentAndPlan(saveClinicalAssessment)
      .map(res => {
        return res;
      });
  }
  public getPatientsClinicalNotes(PatientId: number, PatientVisitId: number) {
    return this.clinicalNoteDLSerivce.getPatientsClinicalNotes(PatientId, PatientVisitId)
      .map(res => {
        return res;
      });
  }
  public clinicalNoteFieldList() {
    return this.clinicalNoteDLSerivce.clinicalNoteFieldList()
      .map(res => { return res; });
  }
  public GetICD10DiseaseGroup() {
    return this.clinicalNoteDLSerivce.GetICD11DiseaseGroup().map(res => { return res; });
  }
  GetServiceItems(serviceBillingContext: string, schemeId: number, priceCategoryId: number) {
    return this.clinicalNoteDLSerivce.GetServiceItems(serviceBillingContext, schemeId, priceCategoryId).map(res => {
      return res;
    });
  }
  GetLabItems(PatientId: number, PatientVisitId: number, IsAcrossVisitAvailability: boolean) {
    return this.clinicalNoteDLSerivce.GetLabItems(PatientId, PatientVisitId, IsAcrossVisitAvailability).map(res => {
      return res;
    });
  }
  GetRequestedLabItems(PatientId: number, PatientVisitId: number, IsAcrossVisitAvailability: boolean) {
    return this.clinicalNoteDLSerivce.GetRequestedLabItems(PatientId, PatientVisitId, IsAcrossVisitAvailability).map(res => {
      return res;
    });
  }
  GetRequestedImagingItems(PatientId: number, PatientVisitId: number, IsAcrossVisitAvailability: boolean) {
    return this.clinicalNoteDLSerivce.GetRequestedImagingItems(PatientId, PatientVisitId, IsAcrossVisitAvailability).map(res => {
      return res;
    });
  }
  GetMedicationList(PatientId: number, PatientVisitId: number, IsAcrossVisitAvailability: boolean) {
    return this.clinicalNoteDLSerivce.GetMedicationList(PatientId, PatientVisitId, IsAcrossVisitAvailability).map(res => {
      return res;
    });

  }

  GetDiagnoses(PatientId: number, PatientVisitId: number, DiagnosisType: string, IsAcrossVisitAvailability: boolean) {
    return this.clinicalNoteDLSerivce.GetDiagnoses(PatientId, PatientVisitId, DiagnosisType, IsAcrossVisitAvailability).map(res => {
      return res;
    });
  }

  GenericName() {
    return this.clinicalNoteDLSerivce.GenericName().map(res => {
      return res;
    });
  }
  // GetWards() {
  //   return this.clinicalNoteDLSerivce.GetWards().map(res => {
  //     return res;
  //   });
  // }
  public GetDocDptAndWardList(patId: number, visitId: number) {
    return this.clinicalNoteDLSerivce.GetDocDptAndWardList(patId, visitId)
      .map(res => { return res; });
  }
  public GetWardBedFeatures(wardId: number, priceCategoryId: number) {
    return this.clinicalNoteDLSerivce.GetWardBedFeatures(wardId, priceCategoryId)
      .map(res => { return res; });
  }
  public GetAvailableBed(WardId, BedFeatureId) {
    return this.clinicalNoteDLSerivce.GetAvailableBed(WardId, BedFeatureId)
      .map(res => { return res; });
  }
  public GetReservedBedList() {
    return this.clinicalNoteDLSerivce.GetReservedBedList()
      .map(res => { return res; });
  }
  public GetAvailableBeds(wardId: number, bedFeatureId: number) {
    return this.clinicalNoteDLSerivce.GetAvailableBeds(wardId, bedFeatureId)
      .map(res => { return res; });
  }
  AllMedicationsItems() {
    return this.clinicalNoteDLSerivce.AllMedicationsItems().map((res: DanpheHTTPResponse) => {
      return res;
    });
  }
  PostMedication(medication: Medication_DTO[]) {
    return this.clinicalNoteDLSerivce.PostMedication(medication).map(res => {
      return res;
    });
  }
  BookAdmission(admission: BookAdmission_DTO) {
    return this.clinicalNoteDLSerivce.BookAdmission(admission).map(res => {
      return res;
    });
  }
  PutMedication(medication: Medication_DTO) {
    return this.clinicalNoteDLSerivce.PutMedication(medication).map(res => {
      return res;
    });
  }
  public GetICDList() {
    return this.clinicalNoteDLSerivce.GetICDList()
      .map(res => { return res; });
  }
  public GetPatientsWithVisitsInfo(searchTxt) {
    return this.clinicalNoteDLSerivce.GetPatientsWithVisitsInfo(searchTxt)
      .map(res => res);
  }
  public GetDepartments() {
    return this.clinicalNoteDLSerivce.GetDepartments()
      .map(res => res);
  }

  public GetDepartmentsList() {
    return this.clinicalNoteDLSerivce.GetDepartmentsList()
      .map(res => res);
  }

  public GetDoctorsList() {
    return this.clinicalNoteDLSerivce.GetDoctorsList()
      .map(res => res);
  }
  public GetDischargedPatientsList(fromDate, toDate, hospitalNumber, departmentId, filterStatus, wardId) {
    return this.clinicalNoteDLSerivce.GetDischargedPatientsList(fromDate, toDate, hospitalNumber, departmentId, filterStatus, wardId)
      .map((res: DanpheHTTPResponse) => { return res; });
  }
  public PostIntakeOutput(currentIntakeOutput: IntakeOutput) {
    let clonedObject = _.cloneDeep(currentIntakeOutput);
    let temp = _.omit(clonedObject, ['IntakeOutputValidator']);
    return this.clinicalNoteDLSerivce.PostInputOutput(temp)
      .map(res => res);
  }
  public GetClinicalIntakeOutputParameterList() {
    return this.clinicalNoteDLSerivce.GetClinicalIntakeOutputParameterList()
      .map(res => { return res; });
  }
  public GetPatientInputOutputList(patientVisitId: number, patientId: number, isAcrossVisitAvailability: boolean, fromDate: string, toDate: string) {
    return this.clinicalNoteDLSerivce.GetPatientInputOutputList(patientVisitId, patientId, isAcrossVisitAvailability, fromDate, toDate)
      .map(res => res);
  }

  public GetAdmittedPatientsList(departmentId, admittingDoctorId, selectedWardId) {
    return this.clinicalNoteDLSerivce.GetAdmittedPatientsList(departmentId, admittingDoctorId, selectedWardId)
      .map((res: DanpheHTTPResponse) => { return res; });
  }
  public GetPatientVisitsList(hospitalNumber, isHospitalNumber, departmentId, employeeId, fromDate, toDate) {
    return this.clinicalNoteDLSerivce.GetPatientVisitsList(hospitalNumber, isHospitalNumber, departmentId, employeeId, fromDate, toDate)
      .map((res: DanpheHTTPResponse) => { return res; });
  }

  GetMSTVitals() {
    return this.clinicalNoteDLSerivce.GetMSTVitals().map(res => { return res; });
  }

  GetVitalsByPatientIdAndPatientVisitId(patientId: number, patientVisitId: number, isAcrossVisitAvailability: boolean) {
    return this.clinicalNoteDLSerivce.GetVitalsByPatientIdAndPatientVisitId(patientId, patientVisitId, isAcrossVisitAvailability).map(res => { return res; });
  }

  GetVitalsByPatientIdAndPatientVisitIdForTPRGraph(patientId: number, patientVisitId: number, isAcrossVisitAvailability: boolean, noOfDays: number) {
    return this.clinicalNoteDLSerivce.GetVitalsByPatientIdAndPatientVisitIdForTPRGraph(patientId, patientVisitId, isAcrossVisitAvailability, noOfDays).map(res => { return res; });
  }

  GetOutputDetailsByPatientVisitId(patientVisitId: number, patientId: number, isAcrossVisitAvailability: boolean, noOfDays: number) {
    return this.clinicalNoteDLSerivce.GetOutputDetailsByPatientVisitId(patientVisitId, patientId, isAcrossVisitAvailability, noOfDays).map(res => { return res; });
  }

  GetPatientLatestVitalsByPatientIdAndPatientVisitId(patientId: number, patientVisitId: number) {
    return this.clinicalNoteDLSerivce.GetPatientLatestVitalsByPatientIdAndPatientVisitId(patientId, patientVisitId).map(res => { return res; });
  }

  AddVitals(newVitalsData: Array<PostClnVitalsTxn_DTO>) {
    return this.clinicalNoteDLSerivce.AddVitals(newVitalsData).map(res => { return res; });
  }
  public GetInvestigationResults(FromDate, ToDate, patientId, patientVisitId, labTestIds, isAcrossVisitAvailability: boolean, TestCount) {
    return this.clinicalNoteDLSerivce
      .GetInvestigationResults(FromDate, ToDate, patientId, patientVisitId, labTestIds, isAcrossVisitAvailability, TestCount)
      .map((res: DanpheHTTPResponse) => {
        return res;
      });
  }
  public GetLabTestsList() {
    return this.clinicalNoteDLSerivce.GetLabTestsList()
      .map((res: DanpheHTTPResponse) => res);
  }
  GetClinicalDataByVisitId(patientId: number, patientVisitId: number, clinicalHeadingId: number) {
    return this.clinicalNoteDLSerivce.GetClinicalDataByVisitId(patientId, patientVisitId, clinicalHeadingId).map((res: DanpheHTTPResponse) => { return res; });

  }
  public GetPatientBloodSugarList(PatientId: number, PatientVisitId: number, IsAcrossVisitAvailability: boolean) {
    return this.clinicalNoteDLSerivce.GetPatientBloodSugarList(PatientId, PatientVisitId, IsAcrossVisitAvailability)
      .map((res: DanpheHTTPResponse) => res);
  }
  public PostBloodSugar(currentInputOutput: CLN_BloodSugarMonitoring) {
    let temp = _.omit(currentInputOutput, ['BloodSugarValidator', 'PatientInfo', 'EnteredBy']);
    return this.clinicalNoteDLSerivce.PostBloodSugar(temp)
      .map((res: DanpheHTTPResponse) => res);
  }
  public GetVitalsForNurseDailyRecord(FromDate: string, ToDate: string, patientId: number, patientVisitId: number, isAcrossVisitAvailability: boolean) {
    return this.clinicalNoteDLSerivce
      .GetVitalsForNurseDailyRecord(FromDate, ToDate, patientId, patientVisitId, isAcrossVisitAvailability)
      .map((res: DanpheHTTPResponse) => {
        return res;
      });
  }

  GetTemplateByTemplateCode(templateCode: string, patientVisitId: number) {
    return this.clinicalNoteDLSerivce.GetTemplateByTemplateCode(templateCode, patientVisitId).map(res => { return res; });
  }

  public GetAllApptDepartment(): Observable<DanpheHTTPResponse> {
    return this.clinicalNoteDLSerivce.GetAllApptDepartment().map((responseData) => {
      return responseData;
    });
  }
  public GetAllAppointmentApplicableDoctor(): Observable<DanpheHTTPResponse> {
    return this.clinicalNoteDLSerivce.GetAllAppointmentApplicableDoctor().map((responseData) => {
      return responseData;
    });
  }
  public GetConsultationRequestsByPatientVisitId(PatientId: number, PatientVisitId: number, IsAcrossVisitAvailability: boolean): Observable<DanpheHTTPResponse> {
    return this.clinicalNoteDLSerivce.GetConsultationRequestsByPatientVisitId(PatientId, PatientVisitId, IsAcrossVisitAvailability).map((responseData) => {
      return responseData;
    });
  }
  public AddNewConsultationRequest(newConsultationRequest: ConsultationRequestModel): Observable<DanpheHTTPResponse> {
    return this.clinicalNoteDLSerivce.AddNewConsultationRequest(newConsultationRequest).map((responseData) => {
      return responseData;
    });
  }

  public ResponseConsultationRequest(responseConsultationRequest: ConsultationRequestModel): Observable<DanpheHTTPResponse> {
    return this.clinicalNoteDLSerivce.ResponseConsultationRequest(responseConsultationRequest).map((responseData) => {
      return responseData;
    });
  }


  GetEmployeeList() {
    return this.clinicalNoteDLSerivce.GetEmployeeList()
      .map((res: DanpheHTTPResponse) => { return res; });
  }
  AddToCardexPlan(NewMedicationCardex) {
    return this.clinicalNoteDLSerivce.AddToCardexPlan(NewMedicationCardex)
      .map((res: DanpheHTTPResponse) => { return res; });
  }

  AddDiagnosis(PostDiagnosisData: any) {
    return this.clinicalNoteDLSerivce.AddDiagnosis(PostDiagnosisData)
      .map((res: DanpheHTTPResponse) => { return res; });
  }

  GetTreatmentCardexPlanList(PatientId: number, PatientVisitId: number) {
    return this.clinicalNoteDLSerivce.GetTreatmentCardexPlanList(PatientId, PatientVisitId).map((res: DanpheHTTPResponse) => {
      return res;
    });
  }

  GetPatientVisitsByPatientId(patientId: number) {
    return this.clinicalNoteDLSerivce.GetPatientVisitsByPatientId(patientId).map((res: DanpheHTTPResponse) => res);
  }

  PutFieldTextBoxFreeTypeNumber(textBoxFreeTypeNumber: TextBoxFreeTypeNumber) {
    return this.clinicalNoteDLSerivce.PutFieldTextBoxFreeTypeNumber(textBoxFreeTypeNumber).map((res: DanpheHTTPResponse) => res);
  }
  DeleteFieldTextBoxFreeTypeNumber(textBoxFreeTypeNumber) {
    return this.clinicalNoteDLSerivce.DeleteFieldTextBoxFreeTypeNumber(textBoxFreeTypeNumber).map((res: DanpheHTTPResponse) => res);
  }
  DeleteFieldSingleSelectMultipleSelect(singleSelectMultipleSelect: number[]) {
    return this.clinicalNoteDLSerivce.DeleteFieldSingleSelectMultipleSelect(singleSelectMultipleSelect).map((res: DanpheHTTPResponse) => res);
  }
  PutFieldSingleSelectMultipleSelect(singleSelectMultipleSelect: SingleSelectMultipleSelect) {
    return this.clinicalNoteDLSerivce.PutFieldSingleSelectMultipleSelect(singleSelectMultipleSelect).map((res: DanpheHTTPResponse) => res);
  }
  UpdateCurrentCardexPlan(UpdatedMedicationCardex: MedicationCardex_Dto) {
    return this.clinicalNoteDLSerivce.UpdateCurrentCardexPlan(UpdatedMedicationCardex)
      .map((res: DanpheHTTPResponse) => { return res; });
  }

  GetChiefComplains() {
    return this.clinicalNoteDLSerivce.GetChiefComplains()
      .map(res => { return res; });
  }
  AddPatientComplaints(Complaints_DTO) {
    return this.clinicalNoteDLSerivce.AddPatientComplaints(Complaints_DTO)
      .map((res: DanpheHTTPResponse) => { return res; });
  }
  GetPatientComplaint(patientId: number, patientVisitId: number, isAcrossVisitAvailability: boolean) {
    return this.clinicalNoteDLSerivce.GetPatientComplaint(patientId, patientVisitId, isAcrossVisitAvailability).map(res => { return res; });
  }
  UpdatePatientComplaints(PatientComplaints: PatientComplaints_DTO) {
    return this.clinicalNoteDLSerivce.UpdatePatientComplaints(PatientComplaints).map((res: DanpheHTTPResponse) => res);
  }
  DeactivatePatientComplaint(patientComplaint: PatientComplaints_DTO): Observable<DanpheHTTPResponse> {
    return this.clinicalNoteDLSerivce.DeactivatePatientComplaint(patientComplaint)
      .map(res => { return res; });
  }
  PutQFieldTextBoxFreeTypeNumber(textBoxFreeTypeNumber: QTextBoxFreeTypeNumber) {
    return this.clinicalNoteDLSerivce.PutQFieldTextBoxFreeTypeNumber(textBoxFreeTypeNumber).map((res: DanpheHTTPResponse) => res);
  }
  DeleteQFieldTextBoxFreeTypeNumber(id: number) {
    return this.clinicalNoteDLSerivce.DeleteQFieldTextBoxFreeTypeNumber(id).map((res: DanpheHTTPResponse) => res);
  }
  PutQFieldSingleSelectMultipleSelect(singleSelectMultipleSelect: QSingleSelectMultipleSelect) {
    return this.clinicalNoteDLSerivce.PutQFieldSingleSelectMultipleSelect(singleSelectMultipleSelect).map((res: DanpheHTTPResponse) => res);
  }
  DeleteQFieldSingleSelectMultipleSelect(options: number[]) {
    return this.clinicalNoteDLSerivce.DeleteQFieldSingleSelectMultipleSelect(options).map((res: DanpheHTTPResponse) => res);
  }
  GetPatientActiveMedications(patientId: number, patientVisitId: number, isAcrossVisitAvailability: boolean) {
    return this.clinicalNoteDLSerivce.GetPatientActiveMedications(patientId, patientVisitId, isAcrossVisitAvailability)
      .map((res: DanpheHTTPResponse) => { return res; });
  }
  AddMedicationEntry(medicationEntryLog: MedicationLog_DTO) {
    return this.clinicalNoteDLSerivce.AddMedicationEntry(medicationEntryLog)
      .map((res: DanpheHTTPResponse) => { return res; });
  }
  GetSelectedMedicationHistoryLogs(cardexPlanId: number) {
    return this.clinicalNoteDLSerivce.GetSelectedMedicationHistoryLogs(cardexPlanId)
      .map((res: DanpheHTTPResponse) => { return res; });
  }
  GetAllMedicationLogList(patientId: number, patientVisitId: number, isAcrossVisitAvailability: boolean) {
    return this.clinicalNoteDLSerivce.GetAllMedicationLogList(patientId, patientVisitId, isAcrossVisitAvailability)
      .map((res: DanpheHTTPResponse) => { return res; });
  }
  GetSelectedPatientMedicationList(patientId: number, patientVisitId: number, isAcrossVisitAvailability: boolean) {
    return this.clinicalNoteDLSerivce.GetSelectedPatientMedicationList(patientId, patientVisitId, isAcrossVisitAvailability)
      .map((res: DanpheHTTPResponse) => { return res; });
  }
  public GetBirthList(patientId: number, patientVisitId: number, isAcrossVisitAvailability: boolean) {
    return this.clinicalNoteDLSerivce.GetBirthList(patientId, patientVisitId, isAcrossVisitAvailability)
      .map((res: DanpheHTTPResponse) => { return res; });
  }
  public GetBabyDetailsListByMotherPatientId(patientId: any) {
    return this.clinicalNoteDLSerivce.GetBabyDetailsListByMotherPatientId(patientId)
      .map((res: DanpheHTTPResponse) => { return res; });
  }

  GetPatientAllergyList(PatientId: number) {
    return this.clinicalNoteDLSerivce.GetPatientAllergyList(PatientId).map(res => {
      return res;
    });
  }
  GetPhrmGenericList() {
    return this.clinicalNoteDLSerivce.GetPhrmGenericList()
      .map(res => { return res; });
  }
  GetReactionList() {
    return this.clinicalNoteDLSerivce.GetMasterReactionList()
      .map(res => res);
  }
  AddPatientAllergy(currentAllergy: Allergy) {
    var temp = _.omit(currentAllergy, ['AllergyValidator']);
    return this.clinicalNoteDLSerivce.AddPatientAllergy(temp)
      .map(res => res);
  }
  UpdatePatientAllergy(currentAllergy: Allergy) {
    let temp = _.omit(currentAllergy, ['AllergyValidator', '', '']);
    return this.clinicalNoteDLSerivce.UpdatePatientAllergy(temp)
      .map((res: DanpheHTTPResponse) => { return res; });
  }
  public UpdateBirthDetail(birthDetails: BabyBirthDetails) {
    let temp = _.omit(birthDetails, ['BabyBirthDetailsValidator', '', '']);
    return this.clinicalNoteDLSerivce.UpdateBirthDetail(temp)
      .map((res: DanpheHTTPResponse) => { return res; });
  }
  public GetBabyBirthCondition() {
    return this.clinicalNoteDLSerivce.GetBabyBirthCondition()
      .map((res: DanpheHTTPResponse) => { return res; });
  }
  public GetAllBirthCertificateNumbers() {
    return this.clinicalNoteDLSerivce.GetAllBirthCertificateNumbers()
      .map((res: DanpheHTTPResponse) => { return res; });
  }

  public PostBirthCertificateDetail(birthDet: Array<BabyBirthDetails>) {
    let temp: Array<BabyBirthDetails> = [];
    birthDet.forEach(a => { temp.push(_.omit(a, ['BabyBirthDetailsValidator'])); });
    let data = JSON.stringify(temp);
    return this.clinicalNoteDLSerivce.PostBirthCertificateDetail(data)
      .map(res => { return res; });
  }
  public GetPatientVisitConsultants(patientVisitId: number) {
    return this.clinicalNoteDLSerivce.GetPatientVisitConsultants(patientVisitId)
      .map((res: DanpheHTTPResponse) => { return res; });
  }

  public GetUserWiseNotes() {
    return this.clinicalNoteDLSerivce.GetUserWiseNotes()
      .map((res: DanpheHTTPResponse) => {
        return res;
      });
  }

  GetDoctorListForSignatories() {
    return this.clinicalNoteDLSerivce.GetDoctorListForSignatories()
      .map((res: DanpheHTTPResponse) => { return res; });
  }
  GetNursesListForSignatories() {
    return this.clinicalNoteDLSerivce.GetNursesListForSignatories()
      .map((res: DanpheHTTPResponse) => { return res; });
  }
  GetDischargeType() {
    return this.clinicalNoteDLSerivce.GetDischargeType()
      .map((res: DanpheHTTPResponse) => { return res; });
  }
  GetDischargeConditionType() {
    return this.clinicalNoteDLSerivce.GetDischargeConditionType()
      .map((res: DanpheHTTPResponse) => { return res; });
  }
  GetOperationType() {
    return this.clinicalNoteDLSerivce.GetOperationType()
      .map((res: DanpheHTTPResponse) => { return res; });
  }
  AddDischargeInformation(dischargeInformation: DischargeInformation_DTO) {
    var temp = _.omit(dischargeInformation, ['DischargeInfoValidator']);
    return this.clinicalNoteDLSerivce.AddDischargeInformation(temp)
      .map((res: DanpheHTTPResponse) => { return res; });
  }
  GetDischargeInfoByPatientVisit(PatientId: number, PatientVisitId: number, isAcrossVisitAvailability: boolean) {
    return this.clinicalNoteDLSerivce.GetDischargeInfoByPatientVisit(PatientId, PatientVisitId, isAcrossVisitAvailability)
      .map((res: DanpheHTTPResponse) => { return res; });


  }
  GetAnaesthetist() {
    return this.clinicalNoteDLSerivce.GetAnaesthetist()
      .map((res: DanpheHTTPResponse) => { return res; });
  }
  AddPatientFollowUpDays(FollowUpPatient: PatientFollowUpDto) {
    return this.clinicalNoteDLSerivce.AddPatientFollowUpDays(FollowUpPatient)
      .map((res: DanpheHTTPResponse) => { return res; });
  }

  GetPatientFollowUpDetails(PatientId: number, PatientVisitId: number, IsAcrossVisitAvailability: boolean) {
    return this.clinicalNoteDLSerivce.GetPatientFollowUpDetails(PatientId, PatientVisitId, IsAcrossVisitAvailability)
      .map((res: DanpheHTTPResponse) => { return res; });
  }
  GetVitalTemplateByTemplateCode(TemplateCode: string, PatientVisitId: number) {
    return this.clinicalNoteDLSerivce.GetVitalTemplateByTemplateCode(TemplateCode, PatientVisitId).map(res => { return res; });
  }
  GetClinicalPhrases() {
    return this.clinicalNoteDLSerivce.GetClinicalPhrases().map((res: DanpheHTTPResponse) => { return res; });
  }

  GetPatientMedicalDiagnosis(patientId: number, patientVisitId: number) {
    return this.clinicalNoteDLSerivce.GetPatientMedicalDiagnosis(patientId, patientVisitId).map(res => { return res; });
  }

  SavePatientMedicalDiagnosis(patientMedicalDiagnosis: Array<MedicalDiagnosisDto>) {
    return this.clinicalNoteDLSerivce.SavePatientMedicalDiagnosis(patientMedicalDiagnosis).map(res => { return res; });
  }
  DeactivateDiagnosis(idList: Array<number>) {
    return this.clinicalNoteDLSerivce.DeactivateDiagnosis(idList).map(res => { return res; });
  }
  GetERPatientVisitsList(employeeId, fromDate, toDate, filterBy) {
    return this.clinicalNoteDLSerivce.GetERPatientVisitsList(employeeId, fromDate, toDate, filterBy)
      .map((res: DanpheHTTPResponse) => { return res; });
  }
  RemoveMedication(PrescriptionItemId: number) {
    return this.clinicalNoteDLSerivce.RemoveMedication(PrescriptionItemId).map((res: DanpheHTTPResponse) => {
      return res;
    });
  }
  public GetWardList() {
    return this.clinicalNoteDLSerivce.GetWardList()
      .map((res: DanpheHTTPResponse) => { return res; });
  }

  public UpdateBloodSugar(currentInputOutput: Cln_BloodSugar_Dto) {
    let temp = currentInputOutput;
    return this.clinicalNoteDLSerivce.UpdateBloodSugar(temp)
      .map((res: DanpheHTTPResponse) => res);
  }

  DeactivatePatientBloodSugar(BloodSugarMonitoringId): Observable<DanpheHTTPResponse> {
    return this.clinicalNoteDLSerivce.DeactivatePatientBloodSugar(BloodSugarMonitoringId)
      .map(res => { return res; });
  }

  DeactivatePatientAllergy(patientAllergy: Allergy): Observable<DanpheHTTPResponse> {
    var temp = _.omit(patientAllergy, ['AllergyValidator']);
    return this.clinicalNoteDLSerivce.DeactivatePatientAllergy(temp)
      .map(res => { return res; });
  }
  public UpdateIntakeOutput(currentIntakeOutput: IntakeOutput) {
    let clonedObject = _.cloneDeep(currentIntakeOutput);
    let temp = _.omit(clonedObject, ['IntakeOutputValidator']);
    return this.clinicalNoteDLSerivce.UpdateIntakeOutput(temp)
      .map(res => res);
  }

  DeactivatePatientIntakeOutput(inputOutputId): Observable<DanpheHTTPResponse> {
    return this.clinicalNoteDLSerivce.DeactivatePatientIntakeOutput(inputOutputId)
      .map(res => { return res; });
  }
  CancelRequestedItem(PatientId: number, PatientVisitId: number, RequisitionId: number, Type: string) {
    return this.clinicalNoteDLSerivce.CancelRequestedItem(PatientId, PatientVisitId, RequisitionId, Type)
      .map((res: DanpheHTTPResponse) => { return res; });
  }

}
