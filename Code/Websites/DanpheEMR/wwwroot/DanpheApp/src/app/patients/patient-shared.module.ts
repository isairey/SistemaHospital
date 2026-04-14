import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { DanpheAutoCompleteModule } from "../shared/danphe-autocomplete";
import { SharedModule } from "../shared/shared.module";
import { PatientDuplicateWarningBox } from "./duplicate-warning/patient-duplicate-warning-box.component";
import { PatientsBLService } from "./shared/patients.bl.service";

@NgModule({
  providers: [
    PatientsBLService
  ],
  imports: [ReactiveFormsModule,
    FormsModule,
    CommonModule,
    RouterModule,
    SharedModule,
    DanpheAutoCompleteModule
  ],
  declarations: [
    PatientDuplicateWarningBox,
  ],
  exports: [
    CommonModule,
    FormsModule,
    RouterModule,

    PatientDuplicateWarningBox
  ]
})

export class PatientSharedModule {

}
