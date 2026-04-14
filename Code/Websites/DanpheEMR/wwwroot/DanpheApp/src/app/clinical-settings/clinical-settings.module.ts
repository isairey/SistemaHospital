import { CommonModule } from "@angular/common";
import { HttpClientModule } from "@angular/common/http";
import { NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { ADT_DLService } from "../adt/shared/adt.dl.service";
import { AppointmentDLService } from "../appointments/shared/appointment.dl.service";
import { VisitDLService } from "../appointments/shared/visit.dl.service";
import { BillingSharedModule } from "../billing/billing-shared.module";
import { ClinicalNewSharedModule } from "../clinical-new/clinical-new-shared.module";
import { MedicationBLService } from "../clinical/shared/medication.bl.service";
import { EmergencyService } from "../emergency/shared/emergency.service";
import { OrderService } from "../orders/shared/order.service";
import { DanpheAutoCompleteModule } from "../shared/danphe-autocomplete/danphe-auto-complete.module";
import { SharedModule } from "../shared/shared.module";
import { AddChiefComplainsComponent } from "./clinical-components/chief-complains/add-chief-complains/add-chief-complains.component";
import { ChiefComplainsComponent } from "./clinical-components/chief-complains/chief-complains.component";
import { ClinicalComponentsListComponent } from "./clinical-components/clinical-components-list.component";
import { AddUpdateFieldMappingsComponent } from './clinical-field-mapping/add-update-field-mappings/add-update-field-mappings.component';
import { ClinicalFieldMappingComponent } from './clinical-field-mapping/clinical-field-mapping.component';
import { AddClinicalHeadingFieldComponent } from './clinical-heading-setup/clinical-heading-fields/add-clinical-heading-field/add-clinical-heading-field.component';
import { ClinicalHeadingFieldsComponent } from "./clinical-heading-setup/clinical-heading-fields/clinical-heading-fields.component";
import { ManageClinicalFieldOptions } from "./clinical-heading-setup/clinical-heading-fields/manage-clinical-field-options/manage-clinical-field-options.component";
import { ManageClinicalFieldQuestionary } from "./clinical-heading-setup/clinical-heading-fields/manage-clinical-field-questionary/manage-clinical-field-questionary.component";
import { ClinicalHeadingSetupComponent } from "./clinical-heading-setup/clinical-heading-setup-component";
import { ClinicalHeadingSetupListComponent } from "./clinical-heading-setup/clinical-heading-setup-list/clinical-heading-setup-list.component";
import { UpdateClinicalHeadingComponent } from "./clinical-heading-setup/clinical-heading-setup-list/update-clinical-heading/update-clinical-heading.component";
import { ClinicalNotesComponent } from './clinical-notes/clinical-notes.component';
import { AddUpdateClinicalNotesComponent } from './clinical-notes/manage-clinical-notes/add-update-clinical-notes/add-update-clinical-notes.component';
import { ClinicalComponentMappingComponent } from './clinical-notes/manage-clinical-notes/clinical-component-mapping/clinical-component-mapping.component';
import { ManageClinicalNotesComponent } from './clinical-notes/manage-clinical-notes/manage-clinical-notes.component';
import { ClinicalQuickPhrasesComponents } from "./clinical-quick-phrases/clinical-quick-phrases.component";
import { PersonalPhrasesComponent } from "./clinical-quick-phrases/personal-phrases/personal-phrases.component";
import { SharedPhrasesComponent } from "./clinical-quick-phrases/shared-phrases/shared-phrases.component";
import { ClinicalSettingsRoutingModule } from "./clinical-settings-routing.module";
import { ClinicalSettingsComponent } from "./clinical-settings.component";
import { ClinicalTemplateComponent } from "./clinical-template/clinical-template.component";
import { ManageTemplateComponent } from './clinical-template/manage-template/manage-template/manage-template.component';
import { ClinicalVariablesComponent } from './clinical-variables/clinical-variables.component';
import { IntakeOutputAddComponent } from "./clinical-variables/intakeoutput/intake-output-add.component";
import { IntakeOutputTypeListComponent } from "./clinical-variables/intakeoutput/intake-output-type.component";
import { ICDGroupListComponent } from "./icd-groups/icd-group-list.component";
import { ReactionAddComponent } from "./reactions/reaction-add.component";
import { ReactionListComponent } from "./reactions/reaction-list.component";
import { ClinicalSettingsBLService } from "./shared/clinical-settings.bl.service";
import { ClinicalSettingsDLService } from "./shared/clinical-settings.dl.service";
import { IntakeTimingComponent } from './clinical-variables/intake-timing/intake-timing.component';


@NgModule({
  providers: [

    VisitDLService,
    AppointmentDLService,
    ADT_DLService,
    MedicationBLService,
    OrderService,
    EmergencyService,
    ClinicalSettingsBLService,
    ClinicalSettingsDLService,

  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    HttpClientModule,
    SharedModule,
    DanpheAutoCompleteModule,
    BillingSharedModule,
    ClinicalSettingsRoutingModule,
    ClinicalNewSharedModule

  ],
  declarations: [
    ClinicalSettingsComponent,
    ClinicalHeadingSetupComponent,
    ICDGroupListComponent,
    ReactionAddComponent,
    ReactionListComponent,
    UpdateClinicalHeadingComponent,
    ClinicalHeadingSetupListComponent,
    ClinicalComponentsListComponent,
    ChiefComplainsComponent,
    AddChiefComplainsComponent,
    AddUpdateFieldMappingsComponent,
    AddClinicalHeadingFieldComponent,
    ClinicalHeadingFieldsComponent,
    ClinicalFieldMappingComponent,
    ClinicalTemplateComponent,
    ManageTemplateComponent,
    ManageClinicalFieldQuestionary,
    ManageClinicalFieldOptions,
    ClinicalVariablesComponent,
    IntakeOutputTypeListComponent,
    IntakeOutputAddComponent,
    ClinicalNotesComponent,
    ManageClinicalNotesComponent,
    AddUpdateClinicalNotesComponent,
    ClinicalComponentMappingComponent,
    PersonalPhrasesComponent,
    ClinicalQuickPhrasesComponents,
    SharedPhrasesComponent,
    IntakeTimingComponent,
  ],
})
export class ClinicalSettingsModule { }
