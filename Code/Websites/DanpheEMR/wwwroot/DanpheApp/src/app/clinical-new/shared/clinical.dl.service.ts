import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { DanpheHTTPResponse } from "../../shared/common-models";

import { MedicalDiagnosisDto } from "../../shared/diagnosis/dto/medical-diagnosis.dto";
import { PatientFollowUpDto } from "../reusable-component/clinical-patient-follow-up/dto/patient-follow-up.dto";
import { QSingleSelectMultipleSelect, QTextBoxFreeTypeNumber } from "./clinical-info-preview/dto/clinical-put-data.dto";
import { MedicationCardex_Dto } from "./dto/medication-cardex-plan.dto";
import { MedicationLog_DTO } from "./dto/medication-log.dto";
import { Medication_DTO } from "./dto/medication.dto";
import { PatientComplaints_DTO } from "./dto/patient-complaints.dto";
import { PostClnVitalsTxn_DTO } from "./dto/post-cln-vitals-txn.dto";
import { SingleSelectMultipleSelect } from "./dto/singleselect-multipleselect.dto";
import { TextBoxFreeTypeNumber } from "./dto/textbox-freetype-number.dto";
import { ConsultationRequestModel } from "./model/consultation-request.model";

@Injectable()
export class ClinicalNoteDLService {
  public optionsJson = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  };

  public options = {
    headers: new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' })
  };



  constructor(public http: HttpClient) {
  }
  GetBillingSummaryForPatient(patientId: number, patientVisitId: number) {
    return this.http.get<DanpheHTTPResponse>("/api/NewClinical/GetBillingDetails/" + patientId + "/" + patientVisitId);
  }

  public GetAllDepartments() {
    return this.http.get<DanpheHTTPResponse>("/api/NewClinical/GetAllDepartments");
  }
  public CancelItemRequest(data: string) {
    return this.http.put<any>("/api/Billing/CancelInpatientItemFromWard", data, this.options);
  }
  public CancelBillRequest(data: string) {
    return this.http.put<any>(
      "/api/Billing/CancelOutpatientProvisionalItem",
      data,
      this.options
    );
  }
  public GetMedicationIntake() {
    return this.http.get<DanpheHTTPResponse>("/api/NewClinical/MedicationIntake");
  }
  public GetFrequencyDisplayName() {
    return this.http.get<DanpheHTTPResponse>("/api/NewClinical/FrequencyDisplayName");
  }
  public GetDischargedPatientsList(fromDate, toDate, hospitalNumber, departmentId, filterStatus, wardId) {
    return this.http.get<DanpheHTTPResponse>(
      "/api/NewClinical/DischargedPatients?FromDate=" +
      fromDate +
      "&ToDate=" +
      toDate +
      "&HospitalNumber=" +
      hospitalNumber +
      "&DepartmentId=" +
      departmentId +
      "&FilterStatus=" +
      filterStatus +
      "&WardId=" +
      wardId,

      this.options
    );
  }
  public GetICD_11List() {
    return this.http.get<DanpheHTTPResponse>("/api/NewClinical/ICD10", this.options);
  }

  public PostFormFieldData(formFieldData): Observable<DanpheHTTPResponse> {
    return this.http.post<DanpheHTTPResponse>("/api/NewClinical/PostFormFieldData", formFieldData, this.optionsJson);
  }
  public GetQuestionaryConfig(FieldId: number) {
    return this.http.get<any>(`/api/NewClinical/GetQuestionaryConfig?FieldId=${FieldId}`, this.optionsJson);
  }
  public GetClinicalHeadingSubHeadingField(visitType: string) {
    return this.http.get<DanpheHTTPResponse>(`/api/NewClinical/GetClinicalHeadingSubHeadingField/${visitType}`, this.options);
  }
  public GetAdmittedPatientsList(DepartmentId, AdmittngDoctorId, WardId) {
    return this.http.get<DanpheHTTPResponse>(
      "/api/NewClinical/AdmittedPatients?DepartmentId=" + DepartmentId +
      "&AdmittngDoctorId=" + AdmittngDoctorId +
      "&WardId=" + WardId,
      this.options);
  }
  public SearchRegisteredPatient(searchTxt) {
    return this.http.get<any>(`/api/Patient/PatientWithVisitInfo?search=${searchTxt}&showIpPatinet=${true}`, this.options);
  }
  public PostAssessmentAndPlan(saveClinicalAssessment) {
    return this.http.post<DanpheHTTPResponse>("/api/ClinicalSettings/ClinicalAssessmentAndPlan", saveClinicalAssessment, this.optionsJson);
  }
  public getPatientsClinicalNotes(PatientId: number, PatientVisitId: number) {
    return this.http.get<DanpheHTTPResponse>(`/api/ClinicalSettings/ClinicalNoteAndAssessmentPlan?PatientId=${PatientId}&PatientVisitId=${PatientVisitId}`, this.optionsJson);
  }
  // public GetWards() {
  //   return this.http.get<any>("/api/Admission/Wards", this.options);
  // }
  public GetWardBedFeatures(wardId: number, priceCategoryId: number) {
    return this.http.get<any>(
      `/api/ClinicalSettings/Ward/BedFeatures?wardId=${wardId}&priceCategoryId=${priceCategoryId}`,
      this.options
    );
  }
  public GetDocDptAndWardList(patId: number, visitId: number) {
    return this.http.get<any>(
      "/api/ClinicalSettings/DoctorDeparmentAndWardInfo?patientId=" +
      patId +
      "&patientVisitId=" +
      visitId,
      this.options
    );
  }
  public GetAvailableBeds(wardId: number, bedFeatureId: number) {
    return this.http.get<any>("/api/Admission/AvailableBeds?" + "bedFeatureId=" + bedFeatureId + "&wardId=" + wardId, this.options);
  }
  public clinicalNoteFieldList() {
    return this.http.get<DanpheHTTPResponse>("/api/ClinicalSettings/ClinicalNote");
  }
  public GetICD11DiseaseGroup() {
    return this.http.get<any>("/api/MedicalRecords/ICD10DiseaseGroup");
  }
  GetServiceItems(serviceBillingContext: string, schemeId: number, priceCategoryId: number) {
    return this.http.get<DanpheHTTPResponse>(`/api/BillingMaster/ServiceItems?serviceBillingContext=${serviceBillingContext}&schemeId=${schemeId}&priceCategoryId=${priceCategoryId}`, this.optionsJson);
  }
  GetLabItems(PatientId: number, PatientVisitId: number, IsAcrossVisitAvailability: boolean) {
    return this.http.get<DanpheHTTPResponse>(`/api/ClinicalSettings/LabItems?PatientId=${PatientId}&PatientVisitId=${PatientVisitId}&IsAcrossVisitAvailability=${IsAcrossVisitAvailability}`, this.optionsJson);
  }
  GetRequestedLabItems(PatientId: number, PatientVisitId: number, IsAcrossVisitAvailability: boolean) {
    return this.http.get<DanpheHTTPResponse>(`/api/ClinicalSettings/RequestedItems?PatientId=${PatientId}&PatientVisitId=${PatientVisitId}&IsAcrossVisitAvailability=${IsAcrossVisitAvailability}`, this.optionsJson);
  }
  GetRequestedImagingItems(PatientId: number, PatientVisitId: number, IsAcrossVisitAvailability: boolean) {
    return this.http.get<DanpheHTTPResponse>(`/api/NewClinical/RequestedImagingItems?PatientId=${PatientId}&PatientVisitId=${PatientVisitId}&IsAcrossVisitAvailability=${IsAcrossVisitAvailability}`, this.optionsJson);
  }
  GetMedicationList(PatientId: number, PatientVisitId: number, IsAcrossVisitAvailability: boolean) {
    return this.http.get<DanpheHTTPResponse>(`/api/ClinicalSettings/RequestedMedicationItems?PatientId=${PatientId}&PatientVisitId=${PatientVisitId}&IsAcrossVisitAvailability=${IsAcrossVisitAvailability}`, this.optionsJson);
  }
  GetDiagnoses(PatientId: number, PatientVisitId: number, DiagnosisType: string, IsAcrossVisitAvailability: boolean) {
    return this.http.get<DanpheHTTPResponse>(`/api/NewClinical/Diagnoses?PatientId=${PatientId}&PatientVisitId=${PatientVisitId}&DiagnosisType=${DiagnosisType}&IsAcrossVisitAvailability=${IsAcrossVisitAvailability}`, this.optionsJson);
  }

  GenericName() {
    return this.http.get<DanpheHTTPResponse>('/api/PharmacySettings/Generics', this.options).map(res => res);
  }
  AllMedicationsItems() {
    return this.http.get<DanpheHTTPResponse>('/api/NewClinical/ItemsWithTotalAvailableQuantity', this.options).map((res: DanpheHTTPResponse) => res);
  }
  PostMedication(medicationlist): Observable<DanpheHTTPResponse> {
    return this.http.post<DanpheHTTPResponse>("/api/ClinicalSettings/Medication", medicationlist, this.optionsJson);
  }
  BookAdmission(admission): Observable<DanpheHTTPResponse> {
    return this.http.post<DanpheHTTPResponse>("/api/ClinicalSettings/BookAdmission", admission, this.optionsJson);
  }
  PutMedication(medicaiton: Medication_DTO) {
    return this.http.put<DanpheHTTPResponse>(`/api/ClinicalSettings/Medication`, medicaiton, this.optionsJson);
  }
  RemoveMedication(PrescriptionItemId: number) {
    return this.http.put<DanpheHTTPResponse>(`/api/ClinicalSettings/DeactivatePrescriptionItem?prescriptionItemId=${PrescriptionItemId}`, this.optionsJson);

  }
  public GetICDList() {
    return this.http.get<DanpheHTTPResponse>("/api/Admission/ICD10", this.options);
  }
  public GetAvailableBed(WardId: number, BedFeatureId: number) {
    return this.http.get<DanpheHTTPResponse>(`/api/ClinicalSettings/BedList?WardId=${WardId}&BedFeatureId=${BedFeatureId}`, this.options);
  }
  public GetReservedBedList() {
    return this.http.get<DanpheHTTPResponse>("/api/ClinicalSettings/ReservedBedList", this.options);
  }
  public GetPatientsWithVisitsInfo(searchTxt) {
    return this.http.get<DanpheHTTPResponse>("/api/Patient/PatientWithVisitInfo?search=" + searchTxt, this.options);
  }
  public GetDepartments() {
    return this.http.get<DanpheHTTPResponse>("/api/Master/AppointmentApplicableDepartments", this.options);
  }
  public PostInputOutput(currentInputOutput): Observable<DanpheHTTPResponse> {
    return this.http.post<DanpheHTTPResponse>("/api/NewClinical/IntakeOutput", currentInputOutput, this.optionsJson);
  }
  public GetClinicalIntakeOutputParameterList() {
    return this.http.get<DanpheHTTPResponse>("/api/NewClinical/GetClinicalIntakeOutputParameter", this.options);
  }
  public GetPatientInputOutputList(patientVisitId: number, patientId: number, isAcrossVisitAvailability: boolean, fromDate: string, toDate: string) {
    return this.http.get<DanpheHTTPResponse>("/api/NewClinical/IntakeOutput?patientVisitId=" + patientVisitId + "&patientId=" + patientId + "&isAcrossVisitAvailability=" + isAcrossVisitAvailability + "&fromDate=" + fromDate + "&toDate=" + toDate, this.options);
  }

  public GetDepartmentsList() {
    return this.http.get<DanpheHTTPResponse>("/api/NewClinical/Departments", this.options);
  }

  public GetDoctorsList() {
    return this.http.get<DanpheHTTPResponse>("/api/NewClinical/AppointmentApplicableDoctorsList");
  }
  public GetPatientVisitsList(hospitalNumber, IsHospitalNoSearch, departmentId, employeeId, fromDate, toDate) {
    return this.http.get<DanpheHTTPResponse>("/api/NewClinical/PatientVisits?HospitalNumber=" + hospitalNumber + "&IsHospitalNoSearch=" +
      IsHospitalNoSearch +
      "&DepartmentId=" +
      departmentId +
      "&DoctorId=" +
      employeeId +
      "&FromDate=" +
      fromDate +
      "&ToDate=" +
      toDate,
      this.options);
  }
  GetMSTVitals(): Observable<DanpheHTTPResponse> {
    return this.http.get<DanpheHTTPResponse>(`/api/NewClinical/MSTVitals`, this.options);
  }

  GetVitalsByPatientIdAndPatientVisitId(patientId: number, patientVisitId: number, isAcrossVisitAvailability: boolean): Observable<DanpheHTTPResponse> {
    return this.http.get<DanpheHTTPResponse>(`/api/NewClinical/Vitals?patientId=${patientId}&patientVisitId=${patientVisitId}&isAcrossVisitAvailability=${isAcrossVisitAvailability}`, this.options);
  }

  GetOutputDetailsByPatientVisitId(patientVisitId: number, patientId: number, isAcrossVisitAvailability: boolean, noOfDays: number): Observable<DanpheHTTPResponse> {
    return this.http.get<DanpheHTTPResponse>(`/api/NewClinical/Output?patientVisitId=${patientVisitId}&patientId=${patientId}&isAcrossVisitAvailability=${isAcrossVisitAvailability}&noOfDays=${noOfDays}`, this.options);
  }

  GetVitalsByPatientIdAndPatientVisitIdForTPRGraph(patientId: number, patientVisitId: number, isAcrossVisitAvailability: boolean, noOfDays: number): Observable<DanpheHTTPResponse> {
    return this.http.get<DanpheHTTPResponse>(`/api/NewClinical/PatientVitalsForTPRGraph?patientId=${patientId}&patientVisitId=${patientVisitId}&isAcrossVisitAvailability=${isAcrossVisitAvailability}&noOfDays=${noOfDays}`, this.options);
  }

  GetPatientLatestVitalsByPatientIdAndPatientVisitId(patientId: number, patientVisitId: number): Observable<DanpheHTTPResponse> {
    return this.http.get<DanpheHTTPResponse>(`/api/NewClinical/PatientLatestVitals?patientId=${patientId}&patientVisitId=${patientVisitId}`, this.options);
  }

  AddVitals(newVitalsData: Array<PostClnVitalsTxn_DTO>): Observable<DanpheHTTPResponse> {
    return this.http.post<DanpheHTTPResponse>("/api/NewClinical/Vitals", newVitalsData, this.optionsJson);
  }
  public GetInvestigationResults(FromDate, ToDate, patientId, patientVisitId, labTestIds, isAcrossVisitAvailability: boolean, TestCount) {
    return this.http.get<DanpheHTTPResponse>(`/api/NewClinical/InvestigationResults?fromDate=${FromDate}&toDate=${ToDate}&patientId=${patientId}&patientVisitId=${patientVisitId}&labTestIds=${labTestIds}&isAcrossVisitAvailability=${isAcrossVisitAvailability}&TestCount=${TestCount}`, this.options);
  }

  public GetLabTestsList() {
    return this.http.get<DanpheHTTPResponse>("/api/NewClinical/LabTests");
  }
  GetPatientBloodSugarList(patientId: number, patientVisitId: number, isAcrossVisitAvailability: boolean) {
    return this.http.get<DanpheHTTPResponse>(`/api/NewClinical/BloodSugar?PatientId=${patientId}&PatientVisitId=${patientVisitId}&IsAcrossVisitAvailability=${isAcrossVisitAvailability}`, this.options);
  }
  PostBloodSugar(currentInputOutput) {
    return this.http.post<DanpheHTTPResponse>("/api/NewClinical/BloodSugar", currentInputOutput, this.optionsJson);
  }
  GetClinicalDataByVisitId(patientId: number, patientVisitId: number, clinicalHeadingId: number): Observable<DanpheHTTPResponse> {
    return this.http.get<DanpheHTTPResponse>(`/api/NewClinical/GetClinicalDataByVisitId?patientId=${patientId}&patientVisitId=${patientVisitId}&clinicalHeadingId=${clinicalHeadingId}`, this.optionsJson);
  }
  public GetVitalsForNurseDailyRecord(FromDate: string, ToDate: string, patientId: number, patientVisitId: number, isAcrossVisitAvailability: boolean) {
    return this.http.get<DanpheHTTPResponse>(`/api/NewClinical/GetVitalsForNurseDailyRecord?fromDate=${FromDate}&toDate=${ToDate}&patientId=${patientId}&patientVisitId=${patientVisitId}&isAcrossVisitAvailability=${isAcrossVisitAvailability}`, this.options);
  }
  GetEmployeeList() {
    return this.http.get<DanpheHTTPResponse>("/api/ClinicalSettings/EmployeeList");
  }
  AddToCardexPlan(NewMedicationCardex) {
    return this.http.post<DanpheHTTPResponse>("/api/NewClinical/TreatmentCardexPlan", NewMedicationCardex, this.optionsJson);
  }

  AddDiagnosis(PostDiagnosisData: any) {
    return this.http.post<DanpheHTTPResponse>("/api/NewClinical/Diagnosis", PostDiagnosisData, this.optionsJson);
  }

  GetTreatmentCardexPlanList(PatientId: number, PatientVisitId: number) {
    return this.http.get<DanpheHTTPResponse>(`/api/NewClinical/MedicationCardexList?patientId=${PatientId}&patientVisitId=${PatientVisitId}`);
  }

  GetTemplateByTemplateCode(templateCode: string, patientVisitId: number): Observable<DanpheHTTPResponse> {
    return this.http.get<DanpheHTTPResponse>(`/api/NewClinical/Template?templateCode=${templateCode}&patientVisitId=${patientVisitId}`, this.options);
  }

  public GetAllApptDepartment(): Observable<DanpheHTTPResponse> {
    return this.http.get<DanpheHTTPResponse>(`/api/NewClinical/Departments`);
  }
  public GetAllAppointmentApplicableDoctor(): Observable<DanpheHTTPResponse> {
    return this.http.get<DanpheHTTPResponse>(`/api/NewClinical/AppointmentApplicableDoctorsList`);
  }
  public GetConsultationRequestsByPatientVisitId(PatientId: number, PatientVisitId: number, IsAcrossVisitAvailability: boolean): Observable<DanpheHTTPResponse> {
    return this.http.get<DanpheHTTPResponse>(`/api/NewClinical/ConsultationRequestsByPatientVisitId?PatientId=${PatientId}&PatientVisitId=${PatientVisitId}&IsAcrossVisitAvailability=${IsAcrossVisitAvailability}`, this.options);
  }
  public AddNewConsultationRequest(newConsultationRequest: ConsultationRequestModel): Observable<DanpheHTTPResponse> {
    return this.http.post<DanpheHTTPResponse>(`/api/NewClinical/AddNewConsultationRequest`, newConsultationRequest, this.optionsJson);
  }

  public ResponseConsultationRequest(responseConsultationRequest: ConsultationRequestModel): Observable<DanpheHTTPResponse> {
    return this.http.put<DanpheHTTPResponse>(`/api/NewClinical/ResponseConsultationRequest`, responseConsultationRequest, this.optionsJson);
  }


  GetPatientVisitsByPatientId(patientId: number): Observable<DanpheHTTPResponse> {
    return this.http.get<DanpheHTTPResponse>(`/api/NewClinical/GetPatientVisitsByPatientId?patientId=${patientId}`, this.optionsJson);
  }
  PutFieldTextBoxFreeTypeNumber(textBoxFreeTypeNumber: TextBoxFreeTypeNumber): Observable<DanpheHTTPResponse> {
    return this.http.put<DanpheHTTPResponse>(`/api/NewClinical/PutFieldTextBoxFreeTypeNumber`, textBoxFreeTypeNumber, this.optionsJson);
  }
  DeleteFieldTextBoxFreeTypeNumber(textBoxFreeTypeNumber: any): Observable<DanpheHTTPResponse> {
    return this.http.post<DanpheHTTPResponse>(`/api/NewClinical/DeleteFieldTextBoxFreeTypeNumber`, textBoxFreeTypeNumber, this.optionsJson);
  }
  DeleteFieldSingleSelectMultipleSelect(singleSelectMultipleSelect: number[]): Observable<DanpheHTTPResponse> {
    return this.http.put<DanpheHTTPResponse>(`/api/NewClinical/DeleteFieldSingleSelectMultipleSelect`, singleSelectMultipleSelect, this.optionsJson);
  }
  PutFieldSingleSelectMultipleSelect(singleSelectMultipleSelect: SingleSelectMultipleSelect): Observable<DanpheHTTPResponse> {
    return this.http.put<DanpheHTTPResponse>(`/api/NewClinical/PutFieldSingleSelectMultipleSelect`, singleSelectMultipleSelect, this.optionsJson);
  }
  UpdateCurrentCardexPlan(UpdatedMedicationCardex: MedicationCardex_Dto) {
    return this.http.put<DanpheHTTPResponse>("/api/NewClinical/TreatmentCardexPlan", UpdatedMedicationCardex, this.optionsJson);
  }

  GetChiefComplains() {
    return this.http.get<DanpheHTTPResponse>("/api/NewClinical/GetChiefComplaints");
  }
  AddPatientComplaints(Complaints_DTO) {
    return this.http.post<DanpheHTTPResponse>("/api/NewClinical/PostPatientComplaints", Complaints_DTO);
  }
  GetPatientComplaint(patientId: number, patientVisitId: number, isAcrossVisitAvailability: boolean): Observable<DanpheHTTPResponse> {
    return this.http.get<DanpheHTTPResponse>(`/api/NewClinical/GetPatientComplaints?patientId=${patientId}&patientVisitId=${patientVisitId}&isAcrossVisitAvailability=${isAcrossVisitAvailability}`, this.options);
  }
  UpdatePatientComplaints(PatientComplaints: PatientComplaints_DTO): Observable<DanpheHTTPResponse> {
    return this.http.put<DanpheHTTPResponse>(`/api/NewClinical/PutPatientComplaints`, PatientComplaints, this.optionsJson);
  }
  DeactivatePatientComplaint(patientComplaint: PatientComplaints_DTO): Observable<DanpheHTTPResponse> {
    return this.http.put<DanpheHTTPResponse>(`/api/NewClinical/DeactivatePatientComplaint?complaintId=${patientComplaint.ComplaintId}`, this.optionsJson);
  }
  PutQFieldTextBoxFreeTypeNumber(textBoxFreeTypeNumber: QTextBoxFreeTypeNumber): Observable<DanpheHTTPResponse> {
    return this.http.put<DanpheHTTPResponse>(`/api/NewClinical/PutQFieldTextBoxFreeTypeNumber`, textBoxFreeTypeNumber, this.optionsJson);
  }
  DeleteQFieldTextBoxFreeTypeNumber(id: number): Observable<DanpheHTTPResponse> {
    return this.http.put<DanpheHTTPResponse>(`/api/NewClinical/DeleteQFieldTextBoxFreeTypeNumber`, id, this.optionsJson);
  }
  PutQFieldSingleSelectMultipleSelect(singleSelectMultipleSelect: QSingleSelectMultipleSelect): Observable<DanpheHTTPResponse> {
    return this.http.put<DanpheHTTPResponse>(`/api/NewClinical/PutQFieldSingleSelectMultipleSelect`, singleSelectMultipleSelect, this.optionsJson);
  }
  DeleteQFieldSingleSelectMultipleSelect(options: number[]): Observable<DanpheHTTPResponse> {
    return this.http.put<DanpheHTTPResponse>(`/api/NewClinical/DeleteQFieldSingleSelectMultipleSelect`, options, this.optionsJson);
  }
  GetPatientActiveMedications(patientId: number, patientVisitId: number, isAcrossVisitAvailability: boolean) {
    return this.http.get<DanpheHTTPResponse>(`/api/NewClinical/PatientActiveMedications?patientId=${patientId}&patientVisitId=${patientVisitId}&isAcrossVisitAvailability=${isAcrossVisitAvailability}`);
  }
  AddMedicationEntry(medicationEntryLog: MedicationLog_DTO) {
    return this.http.post<DanpheHTTPResponse>(`/api/NewClinical/MedicationEntry`, medicationEntryLog, this.optionsJson);
  }
  GetSelectedMedicationHistoryLogs(cardexPlanId: number) {
    return this.http.get<DanpheHTTPResponse>(`/api/NewClinical/SelectedMedicationHistoryLog?CardexPlanId=${cardexPlanId}`);
  }
  GetAllMedicationLogList(patientId: number, patientVisitId: number, isAcrossVisitAvailability: boolean) {
    return this.http.get<DanpheHTTPResponse>(`/api/NewClinical/PatientMedicationHistoryLog?patientId=${patientId}&patientVisitId=${patientVisitId}&isAcrossVisitAvailability=${isAcrossVisitAvailability}`);
  }
  GetSelectedPatientMedicationList(patientId: number, patientVisitId: number, isAcrossVisitAvailability: boolean) {
    return this.http.get<DanpheHTTPResponse>(`/api/NewClinical/SelectedPatientItemList?patientId=${patientId}&patientVisitId=${patientVisitId}&isAcrossVisitAvailability=${isAcrossVisitAvailability}`);
  }
  public GetBirthList(patientId: number, patientVisitId: number, isAcrossVisitAvailability: boolean) {
    return this.http.get<DanpheHTTPResponse>(`/api/NewClinical/Births?patientId=${patientId}&patientVisitId=${patientVisitId}&IsAcrossVisitAvailability=${isAcrossVisitAvailability}`, this.optionsJson);
  }
  public GetBabyDetailsListByMotherPatientId(patientId) {
    return this.http.get<DanpheHTTPResponse>(`/api/NewClinical/BabyDetails?patientId=${patientId}`);
  }

  GetPatientAllergyList(PatientId: number) {
    return this.http.get<DanpheHTTPResponse>(`/api/NewClinical/PatientAllergies?PatientId=${PatientId}`, this.optionsJson);
  }

  GetPhrmGenericList() {
    return this.http.get<DanpheHTTPResponse>("/api/PharmacySettings/Generics");
  }
  GetMasterReactionList() {
    return this.http.get<DanpheHTTPResponse>("/api/Master/Reactions", this.options);
  }

  AddPatientAllergy(currentAllergy) {
    let data = JSON.stringify(currentAllergy);
    return this.http.post<DanpheHTTPResponse>("/api/NewClinical/PostAllergy", data, this.optionsJson);
  }
  UpdatePatientAllergy(currentAllergy) {
    return this.http.put<DanpheHTTPResponse>("/api/NewClinical/PutAllergy", currentAllergy, this.optionsJson);
  }
  UpdateBirthDetail(birthDetails) {
    return this.http.put<DanpheHTTPResponse>("/api/NewClinical/UpdateBirthDetails", birthDetails, this.optionsJson);
  }
  GetBabyBirthCondition() {
    return this.http.get<DanpheHTTPResponse>("/api/NewClinical/BabyBirthCondition", this.optionsJson);
  }
  public GetAllBirthCertificateNumbers() {
    return this.http.get<DanpheHTTPResponse>("/api/NewClinical/BirthCertificateNumbers");
  }
  public PostBirthCertificateDetail(data: string) {
    return this.http.post<DanpheHTTPResponse>("/api/NewClinical/PostBirthDetails", data, this.optionsJson);
  }

  public GetPatientVisitConsultants(patientVisitId: number) {
    return this.http.get<DanpheHTTPResponse>(`/api/NewClinical/PatientVisitConsultants?patientVisitId=${patientVisitId}`, this.optionsJson);
  }

  public GetUserWiseNotes() {
    return this.http.get<DanpheHTTPResponse>(`/api/NewClinical/GetUserWiseNotes`, this.options);
  }

  GetDoctorListForSignatories() {
    return this.http.get<DanpheHTTPResponse>("/api/NewClinical/DoctorSignatoriesList");
  }
  GetNursesListForSignatories() {
    return this.http.get<DanpheHTTPResponse>("/api/NewClinical/NurseSignatoriesList");
  }
  GetDischargeType() {
    return this.http.get<DanpheHTTPResponse>("/api/NewClinical/DischargeType");
  }

  GetDischargeConditionType() {
    return this.http.get<DanpheHTTPResponse>("/api/NewClinical/DischargeConditionType");
  }
  GetOperationType() {
    return this.http.get<DanpheHTTPResponse>("/api/NewClinical/OperationType");
  }
  AddDischargeInformation(dischargeInformation) {
    let data = JSON.stringify(dischargeInformation);
    return this.http.post<DanpheHTTPResponse>("/api/NewClinical/DischargeInformation", data, this.optionsJson);
  }
  GetDischargeInfoByPatientVisit(PatientId: number, PatientVisitId: number, isAcrossVisitAvailability: boolean) {
    return this.http.get<DanpheHTTPResponse>(`/api/NewClinical/GetDischargeInformation?PatientId=${PatientId}&PatientVisitId=${PatientVisitId}&IsAcrossVisitAvailability=${isAcrossVisitAvailability}`,
      this.optionsJson
    );

  }
  GetAnaesthetist() {
    return this.http.get<DanpheHTTPResponse>("/api/NewClinical/GetAnaesthetist");
  }
  AddPatientFollowUpDays(FollowUpPatient: PatientFollowUpDto) {
    return this.http.post<DanpheHTTPResponse>("/api/NewClinical/PatientFollowUpDays", FollowUpPatient, this.optionsJson);
  }

  GetPatientFollowUpDetails(PatientId: number, PatientVisitId: number, IsAcrossVisitAvailability: boolean) {
    return this.http.get<DanpheHTTPResponse>(`/api/NewClinical/PatientFollowUpDays?PatientId=${PatientId}&PatientVisitId=${PatientVisitId}&IsAcrossVisitAvailability=${IsAcrossVisitAvailability}`, this.optionsJson);
  }

  GetVitalTemplateByTemplateCode(TemplateCode: string, PatientVisitId: number): Observable<DanpheHTTPResponse> {
    return this.http.get<DanpheHTTPResponse>(`/api/NewClinical/VitalTemplate?templateCode=${TemplateCode}&patientVisitId=${PatientVisitId}`, this.options);
  }
  GetClinicalPhrases(): Observable<DanpheHTTPResponse> {
    return this.http.get<DanpheHTTPResponse>(`/api/NewClinical/ClinicalPhrases`, this.options);
  }
  GetPatientMedicalDiagnosis(patientId: number, patientVisitId: number): Observable<DanpheHTTPResponse> {
    return this.http.get<DanpheHTTPResponse>(`/api/ClinicalDiagnosis/PatientMedicalDiagnosis?patientId=${patientId}&patientVisitId=${patientVisitId}`, this.optionsJson);
  }
  SavePatientMedicalDiagnosis(patientMedicalDiagnosis: Array<MedicalDiagnosisDto>): Observable<DanpheHTTPResponse> {
    return this.http.post<DanpheHTTPResponse>(`/api/ClinicalDiagnosis/SavePatientDiagnosis`, patientMedicalDiagnosis, this.optionsJson);
  }
  DeactivateDiagnosis(idList: Array<number>): Observable<DanpheHTTPResponse> {
    return this.http.post<DanpheHTTPResponse>(`/api/NewClinical/DeactivateDiagnosis`, idList, this.optionsJson);
  }
  GetERPatientVisitsList(employeeId, fromDate, toDate, filterBy) {
    return this.http.get<DanpheHTTPResponse>("/api/NewClinical/ERPatientVisits?DoctorId=" + employeeId +
      "&FromDate=" +
      fromDate +
      "&ToDate=" +
      toDate +
      "&FilterBy=" +
      filterBy,
      this.options);
  }

  public GetWardList() {
    return this.http.get<DanpheHTTPResponse>("/api/NewClinical/GetWardList");
  }
  UpdateBloodSugar(currentInputOutput) {
    return this.http.put<DanpheHTTPResponse>("/api/NewClinical/BloodSugar", currentInputOutput, this.optionsJson);
  }
  DeactivatePatientAllergy(patientComplaint): Observable<DanpheHTTPResponse> {
    return this.http.put<DanpheHTTPResponse>(`/api/NewClinical/DeactivatePatientAllergy?patientId=${patientComplaint.PatientId}&PatientAllergyId=${patientComplaint.PatientAllergyId}`, this.optionsJson);
  }

  public UpdateIntakeOutput(currentInputOutput): Observable<DanpheHTTPResponse> {
    return this.http.put<DanpheHTTPResponse>("/api/NewClinical/IntakeOutput", currentInputOutput, this.optionsJson);
  }
  DeactivatePatientIntakeOutput(inputOutputId): Observable<DanpheHTTPResponse> {
    return this.http.put<DanpheHTTPResponse>(`/api/NewClinical/DeactivatePatientIntakeOutput?inputOutputId=${inputOutputId}`, this.optionsJson);
  }

  DeactivatePatientBloodSugar(BloodSugarMonitoringId): Observable<DanpheHTTPResponse> {
    return this.http.put<DanpheHTTPResponse>(`/api/NewClinical/DeactivatePatientBloodSugar?bloodSugarMonitoringId=${BloodSugarMonitoringId}`, this.optionsJson);
  }
  CancelRequestedItem(PatientId: number, PatientVisitId: number, RequisitionId: number, Type: string) {
    return this.http.put<DanpheHTTPResponse>(`/api/NewClinical/CancelRequestedItem?PatientId=${PatientId}&PatientVisitId=${PatientVisitId}&RequisitionId=${RequisitionId}&Type=${Type}`, this.optionsJson
    );
  }

}
