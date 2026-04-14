import { Injectable } from "@angular/core";
import * as _ from 'lodash';
import * as moment from "moment";
import { Observable } from "rxjs";
import { IntakeOutputParameterListModel } from "../../clinical/shared/intake-output-parameterlist.model";
import { DanpheHTTPResponse } from "../../shared/common-models";
import { ClinicalSettingsDLService } from "./clinical-settings.dl.service";
import { AddUpdateClinicalUserFieldMappingsDTO } from "./dto/add-update-userfield-mapping.dto";
import { ChiefComplain_DTO } from "./dto/chief-complaint.dto";
import { ClinicalFieldOption_DTO } from "./dto/clinical-field-option.dto";
import { ClinicalFieldQuestionaryOption_DTO } from "./dto/clinical-field-questionary-option.dto";
import { ClinicalFieldQuestionary_DTO } from "./dto/clinical-field-questionary.dto";
import { ClinicalHeadingField_DTO } from "./dto/clinical-heading-field.dto";
import { ClinicalHeadingSectionMapping_DTO } from "./dto/clinical-heading-section-mapping.dto";
import { ClinicalHeading_DTO } from "./dto/clinical-heading.dto";
import { ClinicalMasterNotes_DTO } from "./dto/clinical-master-notes.dto";
import { ClinicalNotesMapping_DTO } from "./dto/clinical-notes-mapping.dto";
import { PersonalPhrases } from "./dto/clinical-personal-phrases.model";
import { ClinicalTemplate } from "./dto/clinical-template.model";
import { IntakeTime } from "./dto/intake-time.dto";
import { Reaction } from "./reaction.model";

@Injectable()
export class ClinicalSettingsBLService {


  constructor(public _clnSetdlService: ClinicalSettingsDLService) {

  }

  public GetIntakeTimingList() {
    return this._clnSetdlService.GetIntakeTimingList()
      .map(res => { return res; });
  }
  public ActivateDeactivateIntakeTimeStatus(selectedIntakeTimingId) {
    return this._clnSetdlService.PutActivateDeactivateIntakeTimeStatus(selectedIntakeTimingId)
      .map((res: DanpheHTTPResponse) => { return res; });
  }
  public AddIntakeTime(data: IntakeTime) {
    return this._clnSetdlService.PostIntakeTime(data)
      .map(res => { return res; });
  }
  public UpdateIntakeTime(data: IntakeTime) {
    return this._clnSetdlService.PutIntakeTime(data)
      .map(res => { return res; });
  }

  public UpdateClinicalTemplate(clinicaltemplate: ClinicalTemplate) {
    let temp = _.omit(clinicaltemplate, ['DynamicTemplateValidator', '', '']);
    return this._clnSetdlService.UpdateClinicalTemplate(temp)
      .map((res: DanpheHTTPResponse) => { return res; });
  }

  public UpdateClinicalPhrases(clinicalPhrases: PersonalPhrases) {
    let temp = _.omit(clinicalPhrases, ['ClinicalMyPhrasesValidator', '', '']);
    return this._clnSetdlService.UpdateClinicalPhrases(temp)
      .map((res: DanpheHTTPResponse) => { return res; });
  }
  public AddNewTemplate(clnTemplate: ClinicalTemplate) {
    let temp = _.omit(clnTemplate, ['DynamicTemplateValidator', '', '']);
    return this._clnSetdlService.AddNewTemplate(temp)
      .map((res: DanpheHTTPResponse) => { return res; });
  }
  public GetClinicalTemplates() {
    return this._clnSetdlService.GetClinicalTemplates()
      .map((res: DanpheHTTPResponse) => { return res; });
  }


  public GetClinicalPhrases() {
    return this._clnSetdlService.GetClinicalPhrases()
      .map((res: DanpheHTTPResponse) => { return res; });
  }
  public GetSharedPhrases() {
    return this._clnSetdlService.GetSharedPhrases()
      .map((res: DanpheHTTPResponse) => { return res; });
  }
  public AddNewPhrases(clnPhrases: PersonalPhrases) {
    let temp = _.omit(clnPhrases, ['ClinicalMyPhrasesValidator', '', '']);
    return this._clnSetdlService.AddNewPhrases(temp)
      .map((res: DanpheHTTPResponse) => { return res; });
  }
  public ClinicalPhrasesActivation(clnPhrases: PersonalPhrases): Observable<DanpheHTTPResponse> {
    return this._clnSetdlService.ClinicalPhrasesActivation(clnPhrases)
      .map((res: DanpheHTTPResponse) => { return res; });
  }
  public ClinicalTemplateActivation(clnFields: ClinicalTemplate): Observable<DanpheHTTPResponse> {
    return this._clnSetdlService.ClinicalTemplateActivation(clnFields)
      .map((res: DanpheHTTPResponse) => { return res; });
  }
  public ClinicalHeadingFieldActivation(clnFields: ClinicalHeadingField_DTO): Observable<DanpheHTTPResponse> {
    return this._clnSetdlService.ClinicalHeadingFieldActivation(clnFields)
      .map(res => { return res; });
  }
  public AddClinicalHeadingField(clnFeild: ClinicalHeadingField_DTO) {
    let temp = _.omit(clnFeild, ['clnHeadingFieildValidator', '', '']);
    return this._clnSetdlService.AddClinicalHeadingField(temp)
      .map(res => { return res; });
  }
  public GetAllChildClinicalHeadings() {
    return this._clnSetdlService.GetAllChildClinicalHeadings()
      .map(res => { return res; });
  }

  public GetClinicalParentHeadings() {
    return this._clnSetdlService.GetClinicalParentHeadings()
      .map(res => { return res; });
  }

  public GetClinicalHeadingFieldSetup() {
    return this._clnSetdlService.GetClinicalHeadingFieldSetup()
      .map(res => { return res; });
  }
  //
  public GetClinicalHeadingData() {
    return this._clnSetdlService.GetClinicalHeadingData()
      .map(res => { return res; });
  }
  public ClinicalHeadingActivation(clinicalHeading_DTO: ClinicalHeading_DTO): Observable<DanpheHTTPResponse> {
    return this._clnSetdlService.ClinicalHeadingActivation(clinicalHeading_DTO)
      .map((res: DanpheHTTPResponse) => { return res; });
  }
  public UpdateClinicalHeading(clinicalHeading: ClinicalHeading_DTO) {
    let temp = _.omit(clinicalHeading, ['clnHeadingValidator', '', '']);
    return this._clnSetdlService.UpdateClinicalHeading(temp)
      .map(res => { return res; });
  }
  public UpdateClinicalHeadingFieldSetup(clinicalHeadingField: ClinicalHeadingField_DTO) {
    let temp = _.omit(clinicalHeadingField, ['clnHeadingFieldValidator', '', '']);
    return this._clnSetdlService.UpdateClinicalHeadingFieldSetup(temp)
      .map(res => { return res; });
  }

  public GetICDGroups() {
    return this._clnSetdlService.GetICDGroups()
      .map(res => { return res; });
  }
  //End ICD10 Groups

  public AddReaction(CurrentReaction: Reaction) {
    let temp = _.omit(CurrentReaction, ['ReactionValidator']);
    return this._clnSetdlService.PostReaction(temp)
      .map(res => { return res; });
  }

  public GetReactions() {
    return this._clnSetdlService.GetReactions()
      .map(res => { return res; });
  }
  public UpdateReaction(CurrentReaction: Reaction) {
    if (CurrentReaction.CreatedOn)
      CurrentReaction.CreatedOn = moment(CurrentReaction.CreatedOn).format('YYYY-MM-DD HH:mm');
    if (CurrentReaction.ModifiedOn)
      CurrentReaction.ModifiedOn = moment(CurrentReaction.ModifiedOn).format('YYYY-MM-DD HH:mm');
    let temp = _.omit(CurrentReaction, ['ReactionValidator']);
    return this._clnSetdlService.PutReaction(temp)
      .map(res => { return res; });
  }

  public GetChiefComplains() {
    return this._clnSetdlService.GetChiefComplains()
      .map(res => { return res; });
  }

  public AddChiefComplains(chiefComplaint: ChiefComplain_DTO) {
    let temp = _.omit(chiefComplaint, ['chiefComplaintValidator', '', '']);
    return this._clnSetdlService.AddChiefComplains(temp)
      .map(res => { return res; });
  }

  public UpdateChiefComplains(chiefComplaint: ChiefComplain_DTO) {
    let temp = _.omit(chiefComplaint, ['chiefComplaintValidator', '', '']);
    return this._clnSetdlService.UpdateChiefComplains(temp)
      .map(res => { return res; });
  }


  public ChiefComplainsActivation(chiefComplain: ChiefComplain_DTO): Observable<DanpheHTTPResponse> {
    return this._clnSetdlService.ChiefComplainsActivation(chiefComplain)
      .map(res => { return res; });
  }
  GetClinicalFieldMappings() {
    return this._clnSetdlService.GetClinicalFieldMappings()
      .map((res: DanpheHTTPResponse) => { return res; });
  }
  GetDepartmentList() {
    return this._clnSetdlService.GetDepartmentList()
      .map((res: DanpheHTTPResponse) => { return res; });
  }
  GetEmployeeList() {
    return this._clnSetdlService.GetEmployeeList()
      .map((res: DanpheHTTPResponse) => { return res; });
  }
  LoadFields(selectedEmployeeId: number, selectedDepartmentId: number, selectedClinicalHeadingId: number) {
    return this._clnSetdlService.LoadFields(selectedEmployeeId, selectedDepartmentId, selectedClinicalHeadingId)
      .map((res: DanpheHTTPResponse) => { return res; });
  }
  AddUpdateUserFieldMappings(userFieldMappings: AddUpdateClinicalUserFieldMappingsDTO) {
    return this._clnSetdlService.AddUpdateUserFieldMappings(userFieldMappings)
      .map((res: DanpheHTTPResponse) => { return res; });
  }



  public GetClinicalFieldQuestionary() {
    return this._clnSetdlService.GetClinicalFieldQuestionary()
      .map((res: DanpheHTTPResponse) => { return res; });

  }

  public AddClinicalFieldQuestionary(ClinicalQuestionaryOption_DTO) {
    let temp = _.omit(ClinicalQuestionaryOption_DTO, ['CLNFieldQuestionaryValidator', '', '']);
    return this._clnSetdlService.AddClinicalFieldQuestionary(temp)
      .map((res: DanpheHTTPResponse) => { return res; });
  }




  public ClinicalFieldQuestionaryActivation(clinicalFieldQuestionary: ClinicalFieldQuestionary_DTO): Observable<DanpheHTTPResponse> {
    return this._clnSetdlService.ClinicalFieldQuestionaryActivation(clinicalFieldQuestionary)
      .map((res: DanpheHTTPResponse) => { return res; });
  }

  public GetClinicalFieldsQuestionaryOption() {
    return this._clnSetdlService.GetClinicalFieldsQuestionaryOption()
      .map((res: DanpheHTTPResponse) => { return res; });
  }

  public ClinicalFieldQuestionaryOptionActivation(clinicalFieldQuestionaryOption: ClinicalFieldQuestionaryOption_DTO): Observable<DanpheHTTPResponse> {
    return this._clnSetdlService.ClinicalFieldQuestionaryOptionActivation(clinicalFieldQuestionaryOption)
      .map((res: DanpheHTTPResponse) => { return res; });
  }




  public GetIntakeOutputTypeListForGrid() {
    return this._clnSetdlService.GetIntakeOutputTypeListForGrid()
      .map((res: DanpheHTTPResponse) => { return res; });
  }
  public ActivateDeactivateVariableStatus(selectedIntakeOutputDataId) {
    return this._clnSetdlService.PutActivateDeactivateVariableStatus(selectedIntakeOutputDataId)
      .map((res: DanpheHTTPResponse) => { return res; });
  }
  public GetIntakeOutputTypeList() {
    return this._clnSetdlService.GetIntakeOutputTypeList()
      .map(res => { return res; });
  }
  public AddIntakeOutputVariable(data: IntakeOutputParameterListModel) {
    return this._clnSetdlService.PostIntakeOutputVariable(data)
      .map(res => { return res; });
  }
  public UpdateIntakeOutputVariable(data: IntakeOutputParameterListModel) {
    return this._clnSetdlService.PutIntakeOutputVariable(data)
      .map(res => { return res; });
  }

  public GetClinicalFieldOption() {
    return this._clnSetdlService.GetClinicalFieldOption()
      .map((res: DanpheHTTPResponse) => { return res; });
  }

  public AddClinicalFieldOptions(clinicalFieldOption: ClinicalFieldOption_DTO) {
    let temp = _.omit(clinicalFieldOption, ['CLNFieldOptionsValidator', '', '']);
    return this._clnSetdlService.AddClinicalFieldOptions(temp)
      .map((res: DanpheHTTPResponse) => { return res; });
  }
  public UpdateClinicalFieldOption(clinicalFieldOption_DTO: ClinicalFieldOption_DTO) {
    let temp = _.omit(clinicalFieldOption_DTO, ['CLNFieldOptionsValidator', '', '']);
    return this._clnSetdlService.UpdateClinicalFieldOption(temp)
      .map((res: DanpheHTTPResponse) => { return res; });
  }

  public ClinicalFieldOptionActivation(clinicalFieldOption_DTO: ClinicalFieldOption_DTO): Observable<DanpheHTTPResponse> {
    return this._clnSetdlService.ClinicalFieldOptionActivation(clinicalFieldOption_DTO)
      .map((res: DanpheHTTPResponse) => { return res; });
  }
  public AddClinicalHeading(clinicalHeading: ClinicalHeading_DTO) {
    let temp = _.omit(clinicalHeading, ['clnHeadingValidator', '', '']);
    return this._clnSetdlService.AddClinicalHeading(temp)
      .map((res: DanpheHTTPResponse) => { return res; });
  }
  GetPreTemplateComponentList() {
    return this._clnSetdlService.GetPreTemplateComponentList()
      .map((res: DanpheHTTPResponse) => { return res; });
  }
  GetAllClinicalTemplates() {
    return this._clnSetdlService.GetAllClinicalTemplates()
      .map((res: DanpheHTTPResponse) => { return res; });
  }

  public GetClinicalMasterNotes() {
    return this._clnSetdlService.GetClinicalMasterNotes()
      .map((res: DanpheHTTPResponse) => { return res; });
  }
  public AddClinicalMasterNotes(clinicalNotes: ClinicalMasterNotes_DTO) {
    let temp = _.omit(clinicalNotes, ['ClinicalNotesValidator', '', '']);
    return this._clnSetdlService.AddClinicalMasterNotes(temp)
      .map(res => { return res; });
  }
  public UpdateClinicalMasterNotes(clinicalNotes: ClinicalMasterNotes_DTO) {
    let temp = _.omit(clinicalNotes, ['ClinicalNotesValidator', '', '']);
    return this._clnSetdlService.UpdateClinicalMasterNotes(temp)
      .map(res => { return res; });
  }
  LoadClinicalNotesMapping(selectedEmployeeId: number, selectedDepartmentId: number, selectedClinicalNotesMasterId: number, ChildHeadingId: number, ParentHeadingId: number) {
    return this._clnSetdlService.LoadClinicalNotesMapping(selectedEmployeeId, selectedDepartmentId, selectedClinicalNotesMasterId, ChildHeadingId, ParentHeadingId)
      .map((res: DanpheHTTPResponse) => { return res; });
  }
  ClinicalNotesMappings(userFieldMappings: ClinicalNotesMapping_DTO) {
    let temp = _.omit(userFieldMappings, ['ClinicalNotesMappingValidator', '', '']);
    return this._clnSetdlService.ClinicalNotesMappings(temp)
      .map((res: DanpheHTTPResponse) => { return res; });
  }
  GetFilteredMedicalComponentList(selectedEmployeeId: number, selectedDepartmentId: number, selectedClinicalNotesMasterId: number, parentHeadingId: number, childHeadingId: number, fieldId: number) {
    return this._clnSetdlService.GetFilteredMedicalComponentList(selectedEmployeeId, selectedDepartmentId, selectedClinicalNotesMasterId, parentHeadingId, childHeadingId, fieldId)
      .map((res: DanpheHTTPResponse) => { return res; });

  }

  public ClinicalNotesActivation(clinicalMasterNotes: ClinicalMasterNotes_DTO): Observable<DanpheHTTPResponse> {
    return this._clnSetdlService.ClinicalNotesActivation(clinicalMasterNotes)
      .map((res: DanpheHTTPResponse) => { return res; });
  }
  public AddSectionMapping(sectionMappings: ClinicalHeadingSectionMapping_DTO) {
    return this._clnSetdlService.AddSectionMapping(sectionMappings)
      .map((res: DanpheHTTPResponse) => { return res; });
  }
  GetClinicalSectionMapping(ClinicalHeadingId: number) {
    return this._clnSetdlService.GetClinicalSectionMapping(ClinicalHeadingId)
      .map((res: DanpheHTTPResponse) => { return res; });
  }
  GetFilteredMedicalComponentListForSectionMapping(sectionIdToUse: number, selectedInputType: string, selectedGroupName: string) {
    return this._clnSetdlService.GetFilteredMedicalComponentListForSectionMapping(sectionIdToUse, selectedInputType, selectedGroupName)
      .map((res: DanpheHTTPResponse) => { return res; });

  }
}

