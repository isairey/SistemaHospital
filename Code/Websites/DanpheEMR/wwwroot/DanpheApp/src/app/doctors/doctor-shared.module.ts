import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { PatientCurrentMedicationsComponent } from "../clinical/medications/patient-current-medications.component";
import { PatientClinicalDocumentsComponent } from "../clinical/others/patient-clinical-documents.component";
import { PatientScannedImages } from "../clinical/scanned-images/patient-scanned-images.component";
import { ProblemsBLService } from "../clinical/shared/problems.bl.service";
import { DynTemplateModule } from "../core/dyn-templates/dyn-templates.module";
import { DanpheAutoCompleteModule } from "../shared/danphe-autocomplete";
import { SharedModule } from "../shared/shared.module";
import { OPDVisitSummaryComponent } from "./opd/opd-visit-summary.component";
import { InPatientDischargeSummaryComponent } from "./patient/in-patient-discharge-summary.component";
import { PatientOverviewComponent } from "./patient/patient-overview.component";
import { PatientVisitHistoryComponent } from "./patient/patient-visit-history.component";
import { VisitSummaryCreateComponent } from "./visit/visit-summary-create.component";
import { VisitSummaryHistoryComponent } from "./visit/visit-summary-history.component";
import { VisitSummaryMainComponent } from "./visit/visit-summary-main.component";

@NgModule({
  providers: [ProblemsBLService],
  imports: [
    ReactiveFormsModule,
    FormsModule,
    CommonModule,
    RouterModule,
    SharedModule,
    DanpheAutoCompleteModule,
    DynTemplateModule,
  ],
  declarations: [
    PatientOverviewComponent,
    PatientVisitHistoryComponent,
    OPDVisitSummaryComponent,
    VisitSummaryMainComponent,
    VisitSummaryCreateComponent,
    VisitSummaryHistoryComponent,
    PatientScannedImages,
    PatientClinicalDocumentsComponent,
    PatientCurrentMedicationsComponent,
    InPatientDischargeSummaryComponent
  ],
  exports: [
    PatientOverviewComponent,
    PatientVisitHistoryComponent,
    OPDVisitSummaryComponent,
    VisitSummaryMainComponent,
    VisitSummaryCreateComponent,
    VisitSummaryHistoryComponent,
    PatientScannedImages,
    PatientClinicalDocumentsComponent,
    PatientCurrentMedicationsComponent,
    InPatientDischargeSummaryComponent
  ],
})
export class DoctorSharedModule { }
