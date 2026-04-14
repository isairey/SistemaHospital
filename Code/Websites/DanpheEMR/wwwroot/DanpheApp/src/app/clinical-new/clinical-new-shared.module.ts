import { CommonModule } from "@angular/common";
import { HttpClientModule } from "@angular/common/http";
import { NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { BillingSharedModule } from "../billing/billing-shared.module";
import { DanpheAutoCompleteModule } from "../shared/danphe-autocomplete/danphe-auto-complete.module";
import { SharedModule } from "../shared/shared.module";
import { BookAdmissionComponent } from "./book-admission/book-admission.component";
import { ClinicalAssessmentAndPlanMainComponent } from "./clinical-assessment-and-plan/clinical-assessment-and-plan-main.component";
import { ClinicalMainComponent } from "./clinical-main.component";
import { ChildHeadingComponent } from "./clinical-overview-wrapper/clinical-overview-tab/child-heading/child-heading.component";
import { ClinicalOverviewTabComponent } from "./clinical-overview-wrapper/clinical-overview-tab/clinical-overview-tab.component";
import { FieldFormComponent } from "./clinical-overview-wrapper/clinical-overview-tab/field-form/field-form.component";
import { ClinicalOverviewWrapperComponent } from "./clinical-overview-wrapper/clinical-overview-wrapper.component";
import { TabGroupComponent } from "./dynamic-tabs/tabs/tab-group.component";
import { TabComponent } from "./dynamic-tabs/tabs/tab.component";
import { ClinicalIpdMainComponent } from "./ipd/clinical-ipd-main.component";
import { IPAdmittedPatient } from "./ipd/ipd-admitted-patient/ip-admitted-patient.component";
import { IPDischargedPatient } from "./ipd/ipd-discharged-patient/ip-discharged-patients.component";
import { ClinicalOpdMainComponent } from "./opd/clinical-opd-main.component";
import { OPDPatientVisit } from "./opd/opd-patient-visit/opd-patient-visit.component";
import { AddBirthDetailsSharedComponent } from "./reusable-component/birth-list/add-birth-details-shared/add-birth-details-shared.component";
import { AddBirthDetailsComponent } from "./reusable-component/birth-list/add-birth-details/add-birth-details.component";
import { BirthListComponent } from "./reusable-component/birth-list/birth-list.component";
import { CLN_AddBloodSugarComponent } from "./reusable-component/blood-sugar-monitoring/add-blood-sugar/cln-add-blood-sugar.component";
import { CLN_BloodSugarMonitoringComponent } from "./reusable-component/blood-sugar-monitoring/cln-blood-sugar-monitoring.component";
import { ChiefComplaintsComponent } from "./reusable-component/chief-complaints/chief-complaints.component";
import { ClinicalConsultationRequestViewPrintComponent } from "./reusable-component/clinical-consultation-requests/clinical-consultation-request-view-print/clinical-consultation-request-view-print.component";
import { ClinicalConsultationRequestsComponent } from "./reusable-component/clinical-consultation-requests/clinical-consultation-requests.component";
import { ClinicalNewRequestComponent } from "./reusable-component/clinical-consultation-requests/clinical-new-request/clinical-new-request.component";
import { ClinicalFooterSignatoriesComponent } from "./reusable-component/clinical-footer-signatories/clinical-footer-signatories.component";
import { ClinicalNotesComponent } from "./reusable-component/clinical-notes/clinical-notes.component";
import { NoteComponent } from "./reusable-component/clinical-notes/note/note.component";
import { ClinicalPatientFollowUpMainComponent } from "./reusable-component/clinical-patient-follow-up/clinical-patient-follow-up.component";
import { BirthListDataViewComponent } from "./reusable-component/data-view-components/birth-list-data-view/birth-list-data-view.component";
import { DischargeInformationtDataViewComponent } from "./reusable-component/data-view-components/discharge-information-data-view/discharge-information-data-view.component";
import { DischargeMedicationRequestDataViewComponent } from "./reusable-component/data-view-components/discharge-medication-request-data-view/discharge-medication-request-data-view.component";

import { NursingIPRequestComponent } from "../nursing/ward-billing/nursing-ip-request.component";
import { NursingWardBillingComponent } from "../nursing/ward-billing/nursing-ward-billing.component";
import { ClinicalEmergencyMainComponent } from "./emergency/clinical-emergency-main.component";
import { EmergencyPatientVisit } from "./emergency/emergency-patients/emergency-patient-visit.component";
import { ChiefComplaintsDataViewComponent } from "./reusable-component/data-view-components/chief-complaints-data-view/chief-complaint-data-view.component";
import { CLNConsultationRequestDataViewComponent } from "./reusable-component/data-view-components/clinical-consultation-request-data-view/clinical-consultation-request-data-view.component";
import { FinalDiagnosisDataViewComponent } from "./reusable-component/data-view-components/final-diagnosis-data-view/final-diagnosis-data-view.component";
import { InvestigationMainDataViewComponent } from "./reusable-component/data-view-components/investigation-data-view/investigation-data-view.component";
import { MedicationDataViewComponent } from "./reusable-component/data-view-components/medication-data-view/medication-data-view.component";
import { NurseDailyRecordDataViewComponent } from "./reusable-component/data-view-components/nurse-daily-record-data-view/nurse-daily-record-data-view.component";
import { PatientAllergyHistoryDataViewComponent } from "./reusable-component/data-view-components/patient-allergy-history-data-view/patient-allergy-history-data-view.component";
import { PatientFollowUpDataViewComponent } from "./reusable-component/data-view-components/patient-follow-up-data-view/patient-follow-up-data-view.component";
import { ProvisionalDiagnosisDataViewComponent } from "./reusable-component/data-view-components/provisional-diagnosis-data-view/provisional-diagnosis-data-view.component";
import { VitalsNewDataViewComponent } from "./reusable-component/data-view-components/vitals-new-data-view/vitals-new-data-view.component";
import { FinalDiagnosisComponent } from "./reusable-component/diagnosis/final-diagnosis/final-diagnosis.component";
import { ProvisionalDiagnosisComponent } from "./reusable-component/diagnosis/provisional-diagnosis/provisional-diagnosis.component";
import { DischargeInformationComponent } from './reusable-component/discharge-information/discharge-information.component';
import { DischargeMedicationRequestComponent } from "./reusable-component/discharge-medication-request/discharge-medication-request.component";
import { IntakeOutputAddComponent } from "./reusable-component/intake-output/intake-output-add.component";
import { IntakeOutputListComponent } from "./reusable-component/intake-output/intake-output-list.component";
import { InvestigationMainComponent } from "./reusable-component/investigation/investigation.component";
import { LabInvestigationResultsPrintComponent } from "./reusable-component/lab-investigation-result/lab-investigation-result-print/lab-investigation-result-print.component";
import { LabInvestigationResultsComponent } from "./reusable-component/lab-investigation-result/lab-investigation-result.component";
import { AddMedicationComponent } from "./reusable-component/medication/add-medication.component";
import { MedicationMainComponent } from "./reusable-component/medication/medication.component";
import { NurseDailyRecordComponent } from "./reusable-component/nurse-daily-record/nurse-daily-record.component";
import { AllergyAddComponent } from "./reusable-component/patient-allergy-history/allergy-add.component";
import { PatientAllergyHistoryComponent } from "./reusable-component/patient-allergy-history/patient-allergy-history.component";
import { PatientDetailsMainComponent } from "./reusable-component/patient-details-section/patient-details-card.component";
import { PatientOverviewDetailsComponent } from "./reusable-component/patient-overview-details/patient-overview-details.component";
import { ReusableComponent } from "./reusable-component/reusable-component.component";
import { ClinicalReusableFreeTypeElement } from "./reusable-component/reusable-elements/free-type-element/free-type-element.component";
import { FreeTypeHtmlRendererComponent } from "./reusable-component/reusable-elements/free-type-element/freetype-html-renderer.component.ts/freetype-html-renderer.component";
import { ClinicalReusableMultipleSelectionElement } from "./reusable-component/reusable-elements/multiple-selection-element/multiple-selection-element.component";
import { ClinicalReusableNumberElement } from "./reusable-component/reusable-elements/number-element/number-element.component";
import { QuestionaryWrapperComponent } from "./reusable-component/reusable-elements/questionary-wrapper/questionary-wrapper.component";
import { ReusableElementsMainComponent } from "./reusable-component/reusable-elements/reusable-elements-main.component";
import { ClinicalReusableSelectionElement } from "./reusable-component/reusable-elements/selection-element/selection-element.component";
import { SmartPrintableFormComponent } from "./reusable-component/reusable-elements/smart-printable-form/smart-printable-form.component";
import { ClinicalReusableTextElement } from "./reusable-component/reusable-elements/text-element/text-element.component";
import { SmartPrintableFormFooterComponent } from "./reusable-component/smart-printable-form-footer/smart-printable-form-footer";
import { SmartPrintableHospitalHeaderComponent } from "./reusable-component/smart-printable-hospital-header/smart-printable-hospital-header";
import { SmartPrintablePatientVitals } from "./reusable-component/smart-printable-patient-vitals-data/smart-printable-patient-vitals-data.component";
import { TprChartComponent } from "./reusable-component/tpr-chart/tpr-chart.component";
import { AddTreatmentCardexPlanComponent } from "./reusable-component/treatment-cardex-plan/add-treatment-cardex-plan/add-treatment-cardex-plan.component";
import { CLN_TreatmentCardexPlanComponent } from "./reusable-component/treatment-cardex-plan/treatment-cardex-plan.component";
import { TreatmentCardexViewComponent } from "./reusable-component/treatment-cardex-view/treatment-cardex-view.component";
import { VitalsNewComponent } from "./reusable-component/vitals-new/vitals-new.component";
import { ClinicalIPRequestComponent } from "./reusable-component/ward-request/clinical-ip-request.component";
import { WardRequestComponent } from "./reusable-component/ward-request/ward-request.component";
import { ClinicalInformationPreviewMainComponent } from "./shared/clinical-info-preview/clinical-info-preview-main.component";
import { ClinicalNoteService } from "./shared/clinical-note.service";
import { ClinicalPatientService } from "./shared/clinical-patient.service";
import { ClinicalPreTemplateMappingService } from "./shared/clinical-pretemplate-mapping.service";
import { ClinicalNoteBLService } from "./shared/clinical.bl.service";
import { ClinicalNoteDLService } from "./shared/clinical.dl.service";
import { CommaSeparatedPipe } from "./shared/comma-separated.pipe";
import { TruncatePipe } from "./shared/truncate.pipe";
import { MainTabComponent } from "./dynamic-tabs/tabs/main-tab.component";
@NgModule({
  providers: [
    ClinicalPatientService,
    ClinicalNoteDLService,
    ClinicalNoteBLService,
    ClinicalNoteService,
    ClinicalPreTemplateMappingService,
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    HttpClientModule,
    SharedModule,
    DanpheAutoCompleteModule,
    BillingSharedModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  declarations: [
    ClinicalMainComponent,
    ClinicalAssessmentAndPlanMainComponent,
    InvestigationMainComponent,
    MedicationMainComponent,
    AddMedicationComponent,
    BookAdmissionComponent,
    ChiefComplaintsComponent,
    ClinicalOpdMainComponent,
    ClinicalIpdMainComponent,
    IPAdmittedPatient,
    ReusableComponent,
    ClinicalOverviewWrapperComponent,
    TabGroupComponent,
    TabComponent,
    ClinicalOverviewTabComponent,
    ChildHeadingComponent,
    FieldFormComponent,
    IntakeOutputListComponent,
    OPDPatientVisit,
    IPDischargedPatient,
    VitalsNewComponent,
    PatientDetailsMainComponent,
    LabInvestigationResultsPrintComponent,
    LabInvestigationResultsComponent,
    ClinicalInformationPreviewMainComponent,
    ReusableElementsMainComponent,
    ClinicalReusableSelectionElement,
    ClinicalReusableTextElement,
    CLN_BloodSugarMonitoringComponent,
    CLN_AddBloodSugarComponent,
    TprChartComponent,
    IntakeOutputAddComponent,
    CLN_AddBloodSugarComponent,
    ClinicalReusableTextElement,
    ClinicalReusableMultipleSelectionElement,
    QuestionaryWrapperComponent,
    ClinicalReusableFreeTypeElement,
    ClinicalReusableNumberElement,
    WardRequestComponent,
    // NursingIPRequestComponent,
    IntakeOutputAddComponent,
    CLN_AddBloodSugarComponent,
    ClinicalReusableMultipleSelectionElement,
    QuestionaryWrapperComponent,
    ClinicalReusableFreeTypeElement,
    NurseDailyRecordComponent,
    SmartPrintableFormComponent,
    SmartPrintableFormComponent,
    CLN_TreatmentCardexPlanComponent,
    AddTreatmentCardexPlanComponent,
    TreatmentCardexViewComponent,
    PatientAllergyHistoryComponent,
    AllergyAddComponent,
    BirthListComponent,
    AddBirthDetailsComponent,
    AddBirthDetailsSharedComponent,
    TruncatePipe,
    NurseDailyRecordDataViewComponent,
    MedicationDataViewComponent,
    FinalDiagnosisDataViewComponent,
    ProvisionalDiagnosisDataViewComponent,
    FreeTypeHtmlRendererComponent,
    PatientOverviewDetailsComponent,
    CommaSeparatedPipe,
    ClinicalNotesComponent,
    NoteComponent,
    ClinicalFooterSignatoriesComponent,
    BirthListDataViewComponent,
    PatientAllergyHistoryDataViewComponent,
    VitalsNewDataViewComponent,
    InvestigationMainDataViewComponent,
    ProvisionalDiagnosisComponent,
    FinalDiagnosisComponent,
    ClinicalNewRequestComponent,
    ClinicalConsultationRequestViewPrintComponent,
    ClinicalConsultationRequestsComponent,
    ClinicalIPRequestComponent,
    DischargeMedicationRequestComponent,
    SmartPrintableHospitalHeaderComponent,
    DischargeInformationComponent,
    ClinicalPatientFollowUpMainComponent,
    PatientFollowUpDataViewComponent,
    SmartPrintablePatientVitals,
    DischargeMedicationRequestDataViewComponent,
    DischargeInformationtDataViewComponent,
    ChiefComplaintsDataViewComponent,
    NursingIPRequestComponent,
    NursingWardBillingComponent,
    ClinicalEmergencyMainComponent,
    EmergencyPatientVisit,
    SmartPrintableFormFooterComponent,
    CLNConsultationRequestDataViewComponent,
    MainTabComponent
  ],
  entryComponents: [
    ClinicalOverviewTabComponent,
    TabComponent,
    FieldFormComponent,
    ChildHeadingComponent,
    ClinicalReusableTextElement,
    InvestigationMainComponent,
    MedicationMainComponent,
    ClinicalReusableSelectionElement,
    ClinicalReusableMultipleSelectionElement,
    ChiefComplaintsComponent,
    QuestionaryWrapperComponent,
    ClinicalReusableFreeTypeElement,
    ClinicalReusableNumberElement,
    WardRequestComponent,
    TprChartComponent,
    NurseDailyRecordComponent,
    SmartPrintableFormComponent,
    LabInvestigationResultsComponent,
    CLN_BloodSugarMonitoringComponent,
    CLN_TreatmentCardexPlanComponent,
    TreatmentCardexViewComponent,
    PatientAllergyHistoryComponent,
    ClinicalInformationPreviewMainComponent,
    BirthListComponent,
    NurseDailyRecordDataViewComponent,
    MedicationDataViewComponent,
    FinalDiagnosisDataViewComponent,
    ProvisionalDiagnosisDataViewComponent,
    ClinicalNotesComponent,
    NoteComponent,
    IntakeOutputListComponent,
    VitalsNewComponent,
    ClinicalFooterSignatoriesComponent,
    BirthListDataViewComponent,
    PatientAllergyHistoryDataViewComponent,
    VitalsNewDataViewComponent,
    InvestigationMainDataViewComponent,
    ProvisionalDiagnosisComponent,
    FinalDiagnosisComponent,
    ClinicalConsultationRequestViewPrintComponent,
    ClinicalConsultationRequestsComponent,
    ClinicalIPRequestComponent,
    DischargeMedicationRequestComponent,
    DischargeInformationComponent,
    ClinicalPatientFollowUpMainComponent,
    PatientFollowUpDataViewComponent,
    SmartPrintablePatientVitals,
    DischargeMedicationRequestDataViewComponent,
    DischargeInformationtDataViewComponent,
    ChiefComplaintsDataViewComponent,
    CLNConsultationRequestDataViewComponent,
    MainTabComponent
  ],
  exports: [
    ClinicalOverviewWrapperComponent,
    ClinicalMainComponent,
    ClinicalOverviewTabComponent,
    TabComponent,
    FieldFormComponent,
    ChildHeadingComponent,
    ClinicalReusableTextElement,
    InvestigationMainComponent,
    MedicationMainComponent,
    ClinicalReusableSelectionElement,
    ClinicalReusableMultipleSelectionElement,
    ChiefComplaintsComponent,
    QuestionaryWrapperComponent,
    ClinicalReusableFreeTypeElement,
    ClinicalReusableNumberElement,
    WardRequestComponent,
    TprChartComponent,
    NurseDailyRecordComponent,
    SmartPrintableFormComponent,
    LabInvestigationResultsComponent,
    CLN_BloodSugarMonitoringComponent,
    CLN_TreatmentCardexPlanComponent,
    TreatmentCardexViewComponent,
    PatientAllergyHistoryComponent,
    ClinicalInformationPreviewMainComponent,
    BirthListComponent,
    NurseDailyRecordDataViewComponent,
    MedicationDataViewComponent,
    FinalDiagnosisDataViewComponent,
    ProvisionalDiagnosisDataViewComponent,
    ClinicalNotesComponent,
    NoteComponent,
    PatientOverviewDetailsComponent,
    TabGroupComponent,
    ReusableElementsMainComponent,
    TruncatePipe,
    AddMedicationComponent,
    FreeTypeHtmlRendererComponent,
    PatientDetailsMainComponent,
    LabInvestigationResultsPrintComponent,
    CLN_AddBloodSugarComponent,
    TreatmentCardexViewComponent,
    CLN_TreatmentCardexPlanComponent,
    AddTreatmentCardexPlanComponent,
    AllergyAddComponent,
    ClinicalFooterSignatoriesComponent,
    BirthListDataViewComponent,
    PatientAllergyHistoryDataViewComponent,
    VitalsNewDataViewComponent,
    InvestigationMainDataViewComponent,
    ProvisionalDiagnosisComponent,
    FinalDiagnosisComponent,
    ClinicalNewRequestComponent,
    ClinicalConsultationRequestViewPrintComponent,
    ClinicalConsultationRequestsComponent,
    ClinicalIPRequestComponent,
    DischargeMedicationRequestComponent,
    SmartPrintableHospitalHeaderComponent,
    DischargeInformationComponent,
    ClinicalPatientFollowUpMainComponent,
    PatientFollowUpDataViewComponent,
    SmartPrintablePatientVitals,
    DischargeMedicationRequestDataViewComponent,
    VitalsNewComponent,
    DischargeInformationtDataViewComponent,
    ChiefComplaintsDataViewComponent,
    NursingIPRequestComponent,
    NursingWardBillingComponent,
    SmartPrintableFormFooterComponent,
    CLNConsultationRequestDataViewComponent,
    MainTabComponent
  ]
})

export class ClinicalNewSharedModule { }
