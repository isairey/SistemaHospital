
/*
This service holds object having string and component type mapping. the string should be matched
with the database component and it is mandatory to register that component here as well.
*/
import { Injectable } from "@angular/core";
import { BirthListComponent } from "../reusable-component/birth-list/birth-list.component";
import { CLN_BloodSugarMonitoringComponent } from "../reusable-component/blood-sugar-monitoring/cln-blood-sugar-monitoring.component";
import { ChiefComplaintsComponent } from "../reusable-component/chief-complaints/chief-complaints.component";
import { ClinicalConsultationRequestsComponent } from "../reusable-component/clinical-consultation-requests/clinical-consultation-requests.component";
import { ClinicalPatientFollowUpMainComponent } from "../reusable-component/clinical-patient-follow-up/clinical-patient-follow-up.component";
import { BirthListDataViewComponent } from "../reusable-component/data-view-components/birth-list-data-view/birth-list-data-view.component";
import { ChiefComplaintsDataViewComponent } from "../reusable-component/data-view-components/chief-complaints-data-view/chief-complaint-data-view.component";
import { CLNConsultationRequestDataViewComponent } from "../reusable-component/data-view-components/clinical-consultation-request-data-view/clinical-consultation-request-data-view.component";
import { DischargeInformationtDataViewComponent } from "../reusable-component/data-view-components/discharge-information-data-view/discharge-information-data-view.component";
import { DischargeMedicationRequestDataViewComponent } from "../reusable-component/data-view-components/discharge-medication-request-data-view/discharge-medication-request-data-view.component";
import { FinalDiagnosisDataViewComponent } from "../reusable-component/data-view-components/final-diagnosis-data-view/final-diagnosis-data-view.component";
import { InvestigationMainDataViewComponent } from "../reusable-component/data-view-components/investigation-data-view/investigation-data-view.component";
import { MedicationDataViewComponent } from "../reusable-component/data-view-components/medication-data-view/medication-data-view.component";
import { NurseDailyRecordDataViewComponent } from "../reusable-component/data-view-components/nurse-daily-record-data-view/nurse-daily-record-data-view.component";
import { PatientAllergyHistoryDataViewComponent } from "../reusable-component/data-view-components/patient-allergy-history-data-view/patient-allergy-history-data-view.component";
import { PatientFollowUpDataViewComponent } from "../reusable-component/data-view-components/patient-follow-up-data-view/patient-follow-up-data-view.component";
import { ProvisionalDiagnosisDataViewComponent } from "../reusable-component/data-view-components/provisional-diagnosis-data-view/provisional-diagnosis-data-view.component";
import { VitalsNewDataViewComponent } from "../reusable-component/data-view-components/vitals-new-data-view/vitals-new-data-view.component";
import { FinalDiagnosisComponent } from "../reusable-component/diagnosis/final-diagnosis/final-diagnosis.component";
import { ProvisionalDiagnosisComponent } from "../reusable-component/diagnosis/provisional-diagnosis/provisional-diagnosis.component";
import { DischargeInformationComponent } from "../reusable-component/discharge-information/discharge-information.component";
import { DischargeMedicationRequestComponent } from "../reusable-component/discharge-medication-request/discharge-medication-request.component";
import { IntakeOutputListComponent } from "../reusable-component/intake-output/intake-output-list.component";
import { InvestigationMainComponent } from "../reusable-component/investigation/investigation.component";
import { LabInvestigationResultsComponent } from "../reusable-component/lab-investigation-result/lab-investigation-result.component";
import { MedicationMainComponent } from "../reusable-component/medication/medication.component";
import { NurseDailyRecordComponent } from "../reusable-component/nurse-daily-record/nurse-daily-record.component";
import { PatientAllergyHistoryComponent } from "../reusable-component/patient-allergy-history/patient-allergy-history.component";
import { SmartPrintableFormComponent } from "../reusable-component/reusable-elements/smart-printable-form/smart-printable-form.component";
import { TprChartComponent } from "../reusable-component/tpr-chart/tpr-chart.component";
import { CLN_TreatmentCardexPlanComponent } from "../reusable-component/treatment-cardex-plan/treatment-cardex-plan.component";
import { TreatmentCardexViewComponent } from "../reusable-component/treatment-cardex-view/treatment-cardex-view.component";
import { VitalsNewComponent } from "../reusable-component/vitals-new/vitals-new.component";
import { WardRequestComponent } from "../reusable-component/ward-request/ward-request.component";


@Injectable()
export class ClinicalPreTemplateMappingService {
  PreTemplateMapping: any = {
    'ChiefComplaintsComponent': ChiefComplaintsComponent,
    'IntakeOutputListComponent': IntakeOutputListComponent,
    'InvestigationMainComponent': InvestigationMainComponent,
    'MedicationMainComponent': MedicationMainComponent,
    'VitalsNewComponent': VitalsNewComponent,
    'TprChartComponent': TprChartComponent,
    'NurseDailyRecordComponent': NurseDailyRecordComponent,
    'ClinicalConsultationRequestsComponent': ClinicalConsultationRequestsComponent,
    'WardRequestComponent': WardRequestComponent,
    'LabInvestigationResultsComponent': LabInvestigationResultsComponent,
    'CLN_BloodSugarMonitoringComponent': CLN_BloodSugarMonitoringComponent,
    'CLN_TreatmentCardexPlanComponent': CLN_TreatmentCardexPlanComponent,
    'TreatmentCardexViewComponent': TreatmentCardexViewComponent,
    'PatientAllergyHistoryComponent': PatientAllergyHistoryComponent,
    'BirthListComponent': BirthListComponent,
    'DischargeMedicationRequestComponent': DischargeMedicationRequestComponent,
    'ProvisionalDiagnosisComponent': ProvisionalDiagnosisComponent,
    'FinalDiagnosisComponent': FinalDiagnosisComponent,
    'DischargeInformationComponent': DischargeInformationComponent,
    'ClinicalPatientFollowUpMainComponent': ClinicalPatientFollowUpMainComponent
  };

  PreTemplateDataViewMapping: any = {
    'NurseDailyRecordComponent': NurseDailyRecordDataViewComponent,
    'MedicationMainComponent': MedicationDataViewComponent,
    'VitalsNewComponent': VitalsNewDataViewComponent,
    'InvestigationMainComponent': InvestigationMainDataViewComponent,
    'PatientAllergyHistoryComponent': PatientAllergyHistoryDataViewComponent,
    'BirthListComponent': BirthListDataViewComponent,
    'ClinicalPatientFollowUpMainComponent': PatientFollowUpDataViewComponent,
    'DischargeMedicationRequestComponent': DischargeMedicationRequestDataViewComponent,
    'DischargeInformationComponent': DischargeInformationtDataViewComponent,
    'FinalDiagnosisComponent': FinalDiagnosisDataViewComponent,
    'ProvisionalDiagnosisComponent': ProvisionalDiagnosisDataViewComponent,
    'ChiefComplaintsComponent': ChiefComplaintsDataViewComponent,
    'SmartPrintableFormComponent': SmartPrintableFormComponent,
    'ClinicalConsultationRequestsComponent': CLNConsultationRequestDataViewComponent
  };
}
