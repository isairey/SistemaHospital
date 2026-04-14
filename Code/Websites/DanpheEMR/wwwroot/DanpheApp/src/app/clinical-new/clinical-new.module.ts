import { NgModule } from "@angular/core";
import { ADT_DLService } from "../adt/shared/adt.dl.service";
import { AppointmentDLService } from "../appointments/shared/appointment.dl.service";
import { VisitDLService } from "../appointments/shared/visit.dl.service";
import { ClinicalSharedModule } from "../clinical/clinical-shared-module";
import { IOAllergyVitalsBLService } from "../clinical/shared/io-allergy-vitals.bl.service";
import { MedicationBLService } from "../clinical/shared/medication.bl.service";
import { EmergencyService } from "../emergency/shared/emergency.service";
import { NursingBLService } from "../nursing/shared/nursing.bl.service";
import { NursingDLService } from "../nursing/shared/nursing.dl.service";
import { OrderService } from "../orders/shared/order.service";
import { ClinicalNewRoutingModule } from "./clinical-new-routing.module";
import { ClinicalNewSharedModule } from "./clinical-new-shared.module";
import { ChartsService } from "./shared/charts.service";
import { ClinicalDataService } from "./shared/clinical-data";
import { ClinicalPatientService } from "./shared/clinical-patient.service";
import { ClinicalService } from "./shared/clinical.service";
import { TabRefreshService } from "./shared/tab-refresh.service";
@NgModule({
  providers: [
    VisitDLService,
    AppointmentDLService,
    ADT_DLService,
    MedicationBLService,
    OrderService,
    EmergencyService,
    ClinicalService,
    ClinicalPatientService,
    ChartsService,
    IOAllergyVitalsBLService,
    NursingBLService,
    NursingDLService,
    ClinicalDataService,
    TabRefreshService
  ],
  imports: [
    ClinicalNewRoutingModule,
    ClinicalNewSharedModule,
    ClinicalSharedModule
  ],
})
export class ClinicalNewModule { }
