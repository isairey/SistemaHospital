import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { IntakeOutputParameterListModel } from "../../clinical/shared/intake-output-parameterlist.model";
import { DanpheHTTPResponse } from "../../shared/common-models";
import { AddUpdateClinicalUserFieldMappingsDTO } from "./dto/add-update-userfield-mapping.dto";
import { ChiefComplain_DTO } from "./dto/chief-complaint.dto";
import { ClinicalFieldOption_DTO } from "./dto/clinical-field-option.dto";
import { ClinicalFieldQuestionaryOption_DTO } from "./dto/clinical-field-questionary-option.dto";
import { ClinicalFieldQuestionary_DTO } from './dto/clinical-field-questionary.dto';
import { ClinicalHeadingField_DTO } from "./dto/clinical-heading-field.dto";
import { ClinicalHeadingSectionMapping_DTO } from "./dto/clinical-heading-section-mapping.dto";
import { ClinicalHeading_DTO } from "./dto/clinical-heading.dto";
import { ClinicalMasterNotes_DTO } from "./dto/clinical-master-notes.dto";
import { ClinicalNotesMapping_DTO } from "./dto/clinical-notes-mapping.dto";
import { PersonalPhrases } from "./dto/clinical-personal-phrases.model";
import { ClinicalTemplate } from "./dto/clinical-template.model";
import { IntakeTime } from "./dto/intake-time.dto";


@Injectable()
export class ClinicalSettingsDLService {
  public http: HttpClient;
  public optionsJson = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  };
  public options = { headers: new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' }) };
  public jsonOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  };
  constructor(
    public _http: HttpClient
  ) {
    this.http = _http;
  }
  public GetIntakeTimingList() {
    return this.http.get<DanpheHTTPResponse>("/api/ClinicalSettings/IntakeTiming", this.options);
  }

  public PutActivateDeactivateIntakeTimeStatus(selectedIntakeTimingId) {
    return this.http.put<DanpheHTTPResponse>(`/api/ClinicalSettings/activate-deactivate-intaketiming?selectedIntakeTimingId=${selectedIntakeTimingId}`, this.jsonOptions);
  }

  public PostIntakeTime(data: IntakeTime) {
    let value = JSON.stringify(data);
    return this.http.post<DanpheHTTPResponse>("/api/ClinicalSettings/PostIntakeTime", value, this.jsonOptions);
  }
  public PutIntakeTime(data: IntakeTime) {
    let value = JSON.stringify(data);
    return this.http.put<DanpheHTTPResponse>("/api/ClinicalSettings/UpdateIntakeTime", value, this.jsonOptions);
  }
  public UpdateClinicalTemplate(clinicaltemplate: ClinicalTemplate): Observable<DanpheHTTPResponse> {
    return this.http.put<DanpheHTTPResponse>(`/api/ClinicalSettings/ClinicalTemplate`, clinicaltemplate, this.optionsJson);
  }

  public UpdateClinicalPhrases(clinicalPhrases: PersonalPhrases): Observable<DanpheHTTPResponse> {
    return this.http.put<DanpheHTTPResponse>(`/api/ClinicalSettings/ClinicalPhrases`, clinicalPhrases, this.optionsJson);
  }
  public AddNewTemplate(clnTemplate) {
    return this.http.post<DanpheHTTPResponse>("/api/ClinicalSettings/ClinicalTemplate", clnTemplate, this.jsonOptions);
  }
  public GetClinicalPhrases() {
    return this.http.get<DanpheHTTPResponse>("/api/ClinicalSettings/ClinicalPhrases");
  }
  public AddNewPhrases(clnTemplate) {
    return this.http.post<DanpheHTTPResponse>("/api/ClinicalSettings/ClinicalPhrases", clnTemplate, this.jsonOptions);
  }
  GetSharedPhrases() {
    return this.http.get<DanpheHTTPResponse>("/api/ClinicalSettings/ClinicalSharedPhrases");
  }

  public ClinicalPhrasesActivation(clnPhrases: PersonalPhrases): Observable<DanpheHTTPResponse> {
    return this.http.put<DanpheHTTPResponse>(`/api/ClinicalSettings/ClinicalPhrasesActivation?PredefinedTemplateId=${clnPhrases.PredefinedTemplateId}`, this.optionsJson);
  }
  public GetClinicalTemplates() {
    return this.http.get<DanpheHTTPResponse>("/api/ClinicalSettings/ClinicalTemplates");
  }
  public ClinicalTemplateActivation(clnFields: ClinicalTemplate): Observable<DanpheHTTPResponse> {
    return this.http.put<DanpheHTTPResponse>(`/api/ClinicalSettings/ClinicalTemplateActivation?templateId=${clnFields.TemplateId}`, this.optionsJson);
  }
  public ClinicalHeadingFieldActivation(clnFields: ClinicalHeadingField_DTO): Observable<DanpheHTTPResponse> {
    return this.http.put<DanpheHTTPResponse>(`/api/ClinicalSettings/ClinicalHeadingFieldActivation?fieldId=${clnFields.FieldId}`, this.optionsJson);
  }
  public AddClinicalHeadingField(clnFeild) {
    return this.http.post<any>("/api/ClinicalSettings/ClinicalHeadingFieldSetup", clnFeild, this.jsonOptions);
  }
  public GetAllChildClinicalHeadings() {
    return this.http.get<DanpheHTTPResponse>("/api/ClinicalSettings/ClinicalHeadingField");
  }
  public GetClinicalParentHeadings() {
    return this.http.get<DanpheHTTPResponse>("/api/ClinicalSettings/ClinicalParentHeadingField");
  }
  public GetClinicalHeadingFieldSetup() {
    return this.http.get<DanpheHTTPResponse>("/api/ClinicalSettings/ClinicalHeadingFieldSetup");
  }
  public UpdateClinicalHeadingFieldSetup(clinicalHeadingField) {
    return this.http.put<DanpheHTTPResponse>("/api/ClinicalSettings/ClinicalHeadingFieldSetup", clinicalHeadingField, this.jsonOptions);
  }


  //public ClinicalFieldActivation(chiefComplaint: ClinicalHeadingField_DTO): Observable<DanpheHTTPResponse> {
  // return this.http.put<DanpheHTTPResponse>(`/api/ClinicalSettings/ClinicalHeadingFieldActivation?chiefComplainId=${chiefComplaint.ChiefComplainId}`, this.optionsJson);
  // }
  //




  public GetClinicalHeadingData() {
    return this.http.get<DanpheHTTPResponse>("/api/ClinicalSettings/ClinicalHeading");
  }
  public ClinicalHeadingActivation(clinicalHeading_DTO: ClinicalHeading_DTO): Observable<DanpheHTTPResponse> {
    return this.http.put<DanpheHTTPResponse>(`/api/ClinicalSettings/ClinicalHeadingActivation?clinicalHeadingId=${clinicalHeading_DTO.ClinicalHeadingId}`, this.optionsJson);
  }
  public UpdateClinicalHeading(clinicalHeading) {
    return this.http.put<DanpheHTTPResponse>("/api/ClinicalSettings/ClinicalHeadingUpdate", clinicalHeading, this.jsonOptions);
  }

  public GetICDGroups() {
    return this.http.get<any>("/api/Settings/GetICD10Groups");
  }
  public PostReaction(reaction) {
    let data = JSON.stringify(reaction);
    return this.http.post<any>("/api/Settings/Reaction", data, this.options);
  }
  public GetReactions() {
    return this.http.get<any>("/api/Settings/Reactions");
  }
  public PutReaction(reaction) {
    return this.http.put<any>("/api/Settings/Reaction", reaction, this.options);

  }

  public GetChiefComplains() {
    return this.http.get<DanpheHTTPResponse>("/api/ClinicalSettings/ChiefComplains");
  }

  public AddChiefComplains(chiefComplain) {
    return this.http.post<DanpheHTTPResponse>("/api/ClinicalSettings/ChiefComplain", chiefComplain, this.jsonOptions);

  }
  public UpdateChiefComplains(chiefComplaint) {
    return this.http.put<DanpheHTTPResponse>("/api/ClinicalSettings/ChiefComplainsUpdate", chiefComplaint, this.jsonOptions);
  }

  public ChiefComplainsActivation(chiefComplain: ChiefComplain_DTO): Observable<DanpheHTTPResponse> {
    return this.http.put<DanpheHTTPResponse>(`/api/ClinicalSettings/ChiefComplainsActivation?chiefComplainId=${chiefComplain.ChiefComplainId}`, this.optionsJson);
  }
  GetClinicalFieldMappings() {
    return this.http.get<DanpheHTTPResponse>("/api/ClinicalSettings/ClinicalFieldMappings");
  }
  GetDepartmentList() {
    return this.http.get<DanpheHTTPResponse>("/api/ClinicalSettings/DepartmentList");
  }
  GetEmployeeList() {
    return this.http.get<DanpheHTTPResponse>("/api/ClinicalSettings/EmployeeList");
  }
  LoadFields(selectedEmployeeId: number, selectedDepartmentId: number, selectedClinicalHeadingId: number) {
    return this.http.get<DanpheHTTPResponse>(`/api/ClinicalSettings/ClnUserFieldList?selectedEmployeeId=${selectedEmployeeId}&selectedDepartmentId=${selectedDepartmentId}&selectedClinicalHeadingId=${selectedClinicalHeadingId}`);
  }
  AddUpdateUserFieldMappings(userFieldMappings: AddUpdateClinicalUserFieldMappingsDTO) {
    console.log(userFieldMappings);
    return this.http.post<DanpheHTTPResponse>("/api/ClinicalSettings/ClinicalFieldMappings", userFieldMappings, this.jsonOptions);
  }


  public GetClinicalFieldQuestionary() {
    return this.http.get<DanpheHTTPResponse>("/api/ClinicalSettings/ClinicalFieldsQuestionary");
  }
  public AddClinicalFieldQuestionary(clinicalFieldQuestionary) {
    return this.http.post<DanpheHTTPResponse>("/api/ClinicalSettings/ClinicalFieldQuestionary", clinicalFieldQuestionary, this.jsonOptions);

  }


  public ClinicalFieldQuestionaryActivation(clinicalFieldQuestionary: ClinicalFieldQuestionary_DTO): Observable<DanpheHTTPResponse> {
    return this.http.put<DanpheHTTPResponse>(`/api/ClinicalSettings/ClinicalFieldQuestionaryActivation?questionId=${clinicalFieldQuestionary.QuestionId}`, this.optionsJson);
  }
  public GetClinicalFieldsQuestionaryOption() {
    return this.http.get<DanpheHTTPResponse>("/api/ClinicalSettings/ClinicalFieldsQuestionaryOption");
  }

  public ClinicalFieldQuestionaryOptionActivation(clinicalFieldQuestionaryOption: ClinicalFieldQuestionaryOption_DTO): Observable<DanpheHTTPResponse> {
    return this.http.put<DanpheHTTPResponse>(`/api/ClinicalSettings/ClinicalFieldQuestionaryOptionActivation?questionOptionId=${clinicalFieldQuestionaryOption.QuestionOptionId}`, this.optionsJson);
  }







  public PutActivateDeactivateVariableStatus(selectedIntakeOutputDataId) {
    return this.http.put<DanpheHTTPResponse>(`/api/ClinicalSettings/activate-deactivate-intakeoutput-variables?selectedIntakeOutputDataId=${selectedIntakeOutputDataId}`, this.jsonOptions);
  }
  public GetIntakeOutputTypeListForGrid() {
    return this.http.get<DanpheHTTPResponse>("/api/ClinicalSettings/IntakeOutputTypeForGrid", this.options);
  }
  public GetIntakeOutputTypeList() {
    return this.http.get<DanpheHTTPResponse>("/api/ClinicalSettings/IntakeOutputType", this.options);
  }
  public PostIntakeOutputVariable(data: IntakeOutputParameterListModel) {
    let value = JSON.stringify(data);
    return this.http.post<DanpheHTTPResponse>("/api/ClinicalSettings/PostIntakeOutputVariable", value, this.jsonOptions);
  }
  public PutIntakeOutputVariable(data: IntakeOutputParameterListModel) {
    let value = JSON.stringify(data);
    return this.http.put<DanpheHTTPResponse>("/api/ClinicalSettings/UpdateIntakeOutputVariable", value, this.jsonOptions);
  }
  public GetClinicalFieldOption() {
    return this.http.get<DanpheHTTPResponse>("/api/ClinicalSettings/ClinicalFieldsOption");
  }

  public AddClinicalFieldOptions(clinicalFieldOption) {
    return this.http.post<DanpheHTTPResponse>("/api/ClinicalSettings/ClinicalFieldOption", clinicalFieldOption, this.jsonOptions);

  }
  public UpdateClinicalFieldOption(clinicalFieldOption_DTO) {
    return this.http.put<DanpheHTTPResponse>("/api/ClinicalSettings/ClinicalFieldOptionUpdate", clinicalFieldOption_DTO, this.jsonOptions);
  }

  public ClinicalFieldOptionActivation(clinicalFieldOption_DTO: ClinicalFieldOption_DTO): Observable<DanpheHTTPResponse> {
    return this.http.put<DanpheHTTPResponse>(`/api/ClinicalSettings/ClinicalFieldOptionActivation?clinicalOptionId=${clinicalFieldOption_DTO.ClinicalOptionId}`, this.optionsJson);
  }
  GetPreTemplateComponentList() {
    return this.http.get<DanpheHTTPResponse>("/api/ClinicalSettings/PreTemplateComponentList", this.options);
  }

  public AddClinicalHeading(clinicalHeading) {
    return this.http.post<DanpheHTTPResponse>("/api/ClinicalSettings/ClinicalHeading", clinicalHeading, this.jsonOptions);
  }
  GetAllClinicalTemplates() {
    return this.http.get<DanpheHTTPResponse>("/api/ClinicalSettings/SmartPrintableTemplates", this.options);
  }
  public GetClinicalMasterNotes() {
    return this.http.get<DanpheHTTPResponse>("/api/ClinicalSettings/ClinicalNotes");
  }
  public AddClinicalMasterNotes(clinicalNotes) {
    return this.http.post<DanpheHTTPResponse>("/api/ClinicalSettings/PostClinicalNotes", clinicalNotes, this.jsonOptions);
  }
  public UpdateClinicalMasterNotes(clinicalNotes) {
    return this.http.put<DanpheHTTPResponse>("/api/ClinicalSettings/PutClinicalNotes", clinicalNotes, this.jsonOptions);
  }
  LoadClinicalNotesMapping(selectedEmployeeId: number, selectedDepartmentId: number, selectedClinicalNotesMasterId: number, ChildHeadingId: number, ParentHeadingId: number) {
    return this.http.get<DanpheHTTPResponse>(`/api/ClinicalSettings/GetMedicalComponentList?selectedEmployeeId=${selectedEmployeeId}&selectedDepartmentId=${selectedDepartmentId}&selectedClinicalNotesMasterId=${selectedClinicalNotesMasterId}&ChildHeadingId=${ChildHeadingId}$ParentHeadingId=${ParentHeadingId}`);
  }
  ClinicalNotesMappings(userFieldMappings: ClinicalNotesMapping_DTO) {
    let value = JSON.stringify(userFieldMappings);
    return this.http.post<DanpheHTTPResponse>("/api/ClinicalSettings/ClinicalNotesMappings", value, this.jsonOptions);
  }
  GetFilteredMedicalComponentList(selectedEmployeeId: number, selectedDepartmentId: number, selectedClinicalNotesMasterId: number, parentHeadingId: number, childHeadingId: number, fieldId: number) {
    return this.http.get<DanpheHTTPResponse>(`/api/ClinicalSettings/GetFilteredMedicalComponentList?selectedEmployeeId=${selectedEmployeeId}&selectedDepartmentId=${selectedDepartmentId}&selectedClinicalNotesMasterId=${selectedClinicalNotesMasterId}&parentHeadingId=${parentHeadingId}&childHeadingId=${childHeadingId}&fieldId=${fieldId}`);
  }
  ClinicalNotesActivation(clinicalMasterNotes: ClinicalMasterNotes_DTO): Observable<DanpheHTTPResponse> {
    return this.http.put<DanpheHTTPResponse>(`/api/ClinicalSettings/ClinicalNotesActivation?clinicalNotesMasterId=${clinicalMasterNotes.ClinicalNotesMasterId}`, this.optionsJson);
  }
  AddSectionMapping(sectionMappings: ClinicalHeadingSectionMapping_DTO) {
    let value = JSON.stringify(sectionMappings);
    return this.http.post<DanpheHTTPResponse>("/api/ClinicalSettings/SectionMappings", value, this.jsonOptions);
  }
  GetClinicalSectionMapping(ClinicalHeadingId: number) {
    return this.http.get<DanpheHTTPResponse>(`/api/ClinicalSettings/GetClinicalSectionMapping?ClinicalHeadingId=${ClinicalHeadingId}`);
  }

  GetFilteredMedicalComponentListForSectionMapping(sectionIdToUse: number, selectedInputType: string, selectedGroupName: string) {
    return this.http.get<DanpheHTTPResponse>(`/api/ClinicalSettings/GetFilteredClinicalSectionMapping?ClinicalHeadingId=${sectionIdToUse}&InputType=${encodeURIComponent(selectedInputType)}&GroupName=${encodeURIComponent(selectedGroupName)}`);
  }

}
