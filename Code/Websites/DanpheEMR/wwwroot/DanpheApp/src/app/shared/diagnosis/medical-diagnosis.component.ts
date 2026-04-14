import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from "@angular/core";
import { Subscription } from "rxjs";
import { BillingBLService } from "../../billing/shared/billing.bl.service";
import { ICDData } from "../../clinical-new/reusable-component/diagnosis/final-diagnosis/shared/ICDData_DTO";
import { ClinicalNoteBLService } from "../../clinical-new/shared/clinical.bl.service";
import { DanpheHTTPResponse } from "../common-models";
import { MessageboxService } from "../messagebox/messagebox.service";
import { ENUM_DanpheHTTPResponses, ENUM_DiagnosisType, ENUM_MessageBox_Status } from "../shared-enums";
import { MedicalDiagnosisDto } from "./dto/medical-diagnosis.dto";
import { SelectedPatientDto } from "./dto/selected-patient.dto";

@Component({
  selector: 'medical-diagnosis',
  templateUrl: './medical-diagnosis.component.html',
  styleUrls: ['./medical-diagnosis.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MedicalDiagnosisComponent {

  @Input('selected-patient')
  SelectedPatient = new SelectedPatientDto();
  MedicalComponentSubscriptions = new Subscription();
  MasterICD = new Array<ICDData>();
  ProvisionalDiagnosis = new Array<MedicalDiagnosisDto>();
  FinalDiagnosis = new Array<MedicalDiagnosisDto>();
  SelectedProvisionalDiagnosis: any;
  SelectedFinalDiagnosis: any;
  loading: boolean = false;

  constructor(
    private _billingBlService: BillingBLService,
    private _clinicalBlService: ClinicalNoteBLService,
    private _msgBoxService: MessageboxService,
    private _changeDetectorRef: ChangeDetectorRef) {
    this.GetMasterICD();
  }

  ngOnInit(): void {
    if (this.SelectedPatient && this.SelectedPatient.PatientVisitId)
      this.GetPatientCurrentVisit(this.SelectedPatient.PatientId, this.SelectedPatient.PatientVisitId);
  }

  GetMasterICD(): void {
    this.MedicalComponentSubscriptions.add(
      this._clinicalBlService.GetICD_11List().subscribe((res: DanpheHTTPResponse) => {
        if (res && res.Status === ENUM_DanpheHTTPResponses.OK) {
          this.MasterICD = res.Results;
          this._changeDetectorRef.detectChanges();
        } else {
          this._msgBoxService.showMessage(ENUM_MessageBox_Status.Failed, ['Failed Response Received From Server while reading Master ICD records.']);
        }
      }, err => {
        console.error(err);
        this._msgBoxService.showMessage(ENUM_MessageBox_Status.Error, ['Something Went Wrong while reading ICD records.']);
      })
    );
  }
  GetPatientCurrentVisit(patientId: number, patientVisitId: number): void {
    this.MedicalComponentSubscriptions.add(
      this._billingBlService.GetPatientWithVisitInformation(patientId, patientVisitId).subscribe((res: DanpheHTTPResponse) => {
        if (res && res.Status === ENUM_DanpheHTTPResponses.OK && res.Results) {
          const currentVisitContext = res.Results;
          this.SelectedPatient.PerformerId = currentVisitContext.PerformerId;
          this.SelectedPatient.Performer = currentVisitContext.PerformerName;
          this.SelectedPatient.PatientName = currentVisitContext.PatientName;
          this.SelectedPatient.PatientCode = currentVisitContext.PatientCode;

          this._changeDetectorRef.detectChanges();
          this.GetMedicalDiagnosis(this.SelectedPatient.PatientId, this.SelectedPatient.PatientVisitId);
        } else {
          this._msgBoxService.showMessage(ENUM_MessageBox_Status.Notice, ['There is no Current Visit Context for the patient']);
        }
      }, err => {
        console.error(err);
        this._msgBoxService.showMessage(ENUM_MessageBox_Status.Error, ['Something Went Wrong while reading Current Visit Context for the patient']);
      })
    );
  }
  GetMedicalDiagnosis(patientId: number, patientVisitId: number): void {
    this.MedicalComponentSubscriptions.add(
      this._clinicalBlService.GetPatientMedicalDiagnosis(patientId, patientVisitId).subscribe((res: DanpheHTTPResponse) => {
        if (res && res.Status === ENUM_DanpheHTTPResponses.OK) {
          const diagnosis: Array<MedicalDiagnosisDto> = res.Results;
          if (diagnosis) {
            if (diagnosis && diagnosis.length) {
              this.ProvisionalDiagnosis = diagnosis.filter(d => d.DiagnosisType === ENUM_DiagnosisType.ProvisionalDiagnosis && d.IsActive);
              this.FinalDiagnosis = diagnosis.filter(d => d.DiagnosisType === ENUM_DiagnosisType.FinalDiagnosis && d.IsActive);
              this._changeDetectorRef.detectChanges();
            } else {
              this.ProvisionalDiagnosis = [];
              this.FinalDiagnosis = [];
            }
          }
        } else {
          this._msgBoxService.showMessage(ENUM_MessageBox_Status.Notice, ['Cannot Load Medical Diagnosis for the patient']);
        }
      }, err => {
        console.error(err);
        this._msgBoxService.showMessage(ENUM_MessageBox_Status.Error, ['Something Went Wrong while reading Current Visit Context for the patient']);
      })
    );
  }

  MedicalDiagnosisListFormatter(data: any) {
    let html = data["ICD10Code"] + '|' + data["icd10Description"];
    return html;
  }

  OnProvisionalDiagnosisSelected(): void {
    if (this.SelectedProvisionalDiagnosis) {
      const icdCodeAlreadySelected = this.ProvisionalDiagnosis.some(a => a.DiagnosisCode === this.SelectedProvisionalDiagnosis.ICDCode);

      if (icdCodeAlreadySelected) {
        this.SelectedProvisionalDiagnosis = null;
        this._msgBoxService.showMessage(ENUM_MessageBox_Status.Notice, ['ICD Code Already Selected']);
        return;
      }
      const icd = this.MasterICD.find(d => d.ICD10Id === this.SelectedProvisionalDiagnosis.ICD10Id);
      if (icd) {
        const newProvisionalDiagnosis = new MedicalDiagnosisDto();
        newProvisionalDiagnosis.DiagnosisType = ENUM_DiagnosisType.ProvisionalDiagnosis;
        newProvisionalDiagnosis.IsActive = true;
        newProvisionalDiagnosis.DiagnosisCode = icd.ICD10Code;
        newProvisionalDiagnosis.DiagnosisCodeDescription = icd.icd10Description;
        newProvisionalDiagnosis.ICD10ID = icd.ICD10Id;
        newProvisionalDiagnosis.IsCauseOfDeath = false;
        newProvisionalDiagnosis.PatientId = this.SelectedPatient.PatientId;
        newProvisionalDiagnosis.PatientVisitId = this.SelectedPatient.PatientVisitId;
        this.ProvisionalDiagnosis.push(newProvisionalDiagnosis);
        this.SelectedProvisionalDiagnosis = null;
      }
    }
  }

  OnFinalDiagnosisSelected(): void {
    if (this.SelectedFinalDiagnosis) {
      const icdCodeAlreadySelected = this.FinalDiagnosis.some(a => a.DiagnosisCode === this.SelectedProvisionalDiagnosis.ICDCode);

      if (icdCodeAlreadySelected) {
        this.SelectedFinalDiagnosis = null;
        this._msgBoxService.showMessage(ENUM_MessageBox_Status.Notice, ['ICD Code Already Selected']);
        return;
      }
      const icd = this.MasterICD.find(d => d.ICD10Id === this.SelectedFinalDiagnosis.ICD10Id);
      if (icd) {
        const newFinalDiagnosis = new MedicalDiagnosisDto();
        newFinalDiagnosis.DiagnosisType = ENUM_DiagnosisType.FinalDiagnosis;
        newFinalDiagnosis.IsActive = true;
        newFinalDiagnosis.DiagnosisCode = icd.ICD10Code;
        newFinalDiagnosis.DiagnosisCodeDescription = icd.icd10Description;
        newFinalDiagnosis.ICD10ID = icd.ICD10Id;
        newFinalDiagnosis.IsCauseOfDeath = false;
        newFinalDiagnosis.PatientId = this.SelectedPatient.PatientId;
        newFinalDiagnosis.PatientVisitId = this.SelectedPatient.PatientVisitId;
        this.FinalDiagnosis.push(newFinalDiagnosis);
        this.SelectedFinalDiagnosis = null;
      }
    }
  }

  RemoveSelectedProvisionalDiagnosis(index: number): void {
    this.ProvisionalDiagnosis.splice(index, 1);
  }

  RemoveSelectedFinalDiagnosis(index: number): void {
    this.FinalDiagnosis.splice(index, 1);
  }

  SaveMedicalDiagnosis(): void {
    const medicalDiagnosis = [...this.ProvisionalDiagnosis, ...this.FinalDiagnosis];
    this.MedicalComponentSubscriptions.add(
      this._clinicalBlService.SavePatientMedicalDiagnosis(medicalDiagnosis)
        .finally(() => this.loading = false)
        .subscribe((res: DanpheHTTPResponse) => {
          if (res && res.Status && res.Results) {
            this._msgBoxService.showMessage(ENUM_MessageBox_Status.Success, ['Patient Medical Diagnosis Saved successfully.']);
          } else {
            this._msgBoxService.showMessage(ENUM_MessageBox_Status.Failed, ['Something Went Wrong while saving Medical Diagnosis for the patient']);
          }
        }, err => {
          console.error(err);
          this._msgBoxService.showMessage(ENUM_MessageBox_Status.Error, ['Something Went Wrong while saving Medical Diagnosis for the patient']);
        })
    );
  }
  ngOnDestroy(): void {
    this.MedicalComponentSubscriptions.unsubscribe();
  }
}
