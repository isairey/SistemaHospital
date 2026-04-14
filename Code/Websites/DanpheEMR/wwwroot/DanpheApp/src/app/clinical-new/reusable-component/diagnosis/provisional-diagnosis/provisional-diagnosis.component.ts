import { Component, OnInit } from '@angular/core';
import { ClinicalPatientService } from '../../../../clinical-new/shared/clinical-patient.service';
import { ClinicalNoteBLService } from '../../../../clinical-new/shared/clinical.bl.service';
import { PatientDetails_DTO } from '../../../../clinical-new/shared/dto/patient-cln-detail.dto';
import { MessageboxService } from '../../../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponses, ENUM_DiagnosisType, ENUM_MessageBox_Status } from '../../../../shared/shared-enums';
import { Field } from '../../../shared/dto/field.dto';
import { CurrentData } from '../final-diagnosis/shared/CurrentDiagnosis_DTO';
import { StoreData } from '../final-diagnosis/shared/ICDData_DTO';
import { DanpheHTTPResponse } from './../../../../shared/common-models';
import { ProvisionalSelectedList } from './Shared-file/Provisional-DiagnosisList.Model';
import { ActiveDiagnosis } from './Shared-file/active-diagnosis.dto';


@Component({
  selector: 'app-provisional-diagnosis',
  templateUrl: './provisional-diagnosis.component.html',
})
export class ProvisionalDiagnosisComponent implements OnInit {
  public CombinedDiagnosisList: Array<ActiveDiagnosis> = [];
  Field: Field;
  IsAcrossVisitAvailability: boolean = false;
  public provisionalDiagnosis: any = null;
  public icd10List: Array<any> = null;
  public selectedProvisionalDiagnosisList: Array<any> = new Array<any>();
  public DiagnosisList: ProvisionalSelectedList = new ProvisionalSelectedList();
  SelectedPatientData = new PatientDetails_DTO();
  public addedRows: Array<any> = [];

  CurrentDataList: Array<CurrentData> = new Array<CurrentData>();

  private RemovedActiveDiagnosis: Array<number> = [];

  constructor(
    private _clinicalNoteBLService: ClinicalNoteBLService,
    public msgBoxServ: MessageboxService,
    private _selectedPatient: ClinicalPatientService,
  ) {

  }
  ngOnInit() {
    if (this.Field) {
      this.IsAcrossVisitAvailability = this.Field.IsAcrossVisitAvailability;
    } else {
      this.IsAcrossVisitAvailability = false;
    }
    this.SelectedPatientData = this._selectedPatient.SelectedPatient;
    if (this.SelectedPatientData && this.SelectedPatientData.PatientId) {
      this.GetProvisionalDiagnosis(this.SelectedPatientData.PatientId, this.SelectedPatientData.PatientVisitId, this.IsAcrossVisitAvailability);
    }
    else {
      this.CurrentDataList = null;
    }
    this.GetICDList();
  }
  DiagnosisFormatter(data: any): string {
    let html = data["ICD10Code"] + '|' + data["icd10Description"];
    return html;
  }
  removeRow(index: number) {
    this.addedRows.splice(index, 1);
  }

  public MakeProvisonalDiagnosisList() {
    this.DataValidation();
    if (this.provisionalDiagnosis != undefined && typeof (this.provisionalDiagnosis) != "string") {
      if (this.selectedProvisionalDiagnosisList.length > 0) {
        let temp: Array<any> = this.selectedProvisionalDiagnosisList;
        let isICDDuplicate: boolean = false;


        if (temp.some(d => d.ICD10Id == this.provisionalDiagnosis.ICD10Id)) {
          isICDDuplicate = true;
          alert(`${this.provisionalDiagnosis.icd10Description} Already Added !`);
          this.provisionalDiagnosis = undefined;

        }
        if (isICDDuplicate == false) {
          {
            this.selectedProvisionalDiagnosisList.push(this.provisionalDiagnosis);
            this.provisionalDiagnosis = undefined;
          }
        }
      } else {
        this.selectedProvisionalDiagnosisList.push(this.provisionalDiagnosis);
        this.provisionalDiagnosis = undefined;
      }
    } else if (typeof (this.provisionalDiagnosis) == 'string') {
      alert("Enter Valid ICD10 !");
    }

  }

  DataValidation() {
    for (var i in this.DiagnosisList.ProvisionalValidator.controls) {
      this.DiagnosisList.ProvisionalValidator.controls[i].markAsDirty();
      this.DiagnosisList.ProvisionalValidator.controls[i].updateValueAndValidity();
    }
    const CheckDiagnosis = this.provisionalDiagnosis;
    if (CheckDiagnosis === null || CheckDiagnosis === undefined || CheckDiagnosis === "") {
      this.msgBoxServ.showMessage("error", ['Please select provisional ICD-11 Dignosis.']);
    }
  }

  RemoveProvisonalDiagnosis(i) {
    let temp: Array<any> = this.selectedProvisionalDiagnosisList;
    this.selectedProvisionalDiagnosisList = [];
    this.selectedProvisionalDiagnosisList = temp.filter((d, index) => index != i);

  }
  public GetICDList() {
    this._clinicalNoteBLService.GetICD_11List()
      .subscribe(res => {
        if (res.Status == 'OK') {
          this.icd10List = res.Results;
        }
        else {
          this.msgBoxServ.showMessage("error", [res.ErrorMessage]);
        }
      },
        err => {
          this.msgBoxServ.showMessage("error", ['Failed to get ICD11.. please check log for detail.']);
          this.logError(err.ErrorMessage);
        });
  }
  logError(err: any) {
    console.log(err);
  }

  GetProvisionalDiagnosis(PatientId: number, PatientVisitId: number, IsAcrossVisitAvailability: boolean) {
    this._clinicalNoteBLService.GetDiagnoses(PatientId, PatientVisitId, ENUM_DiagnosisType.ProvisionalDiagnosis, IsAcrossVisitAvailability)
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK && res.Results) {
          this.CurrentDataList = res.Results;

          this.CombinedDiagnosisList = this.CurrentDataList.map((diagnosis) => {
            return {
              Id: diagnosis.DiagnosisId,
              DisplayDiagnosis: `(${diagnosis.DiagnosisCode}) ${diagnosis.DiagnosisCodeDescription}`,
              Remarks: diagnosis.Remarks,
              IsCauseOfDeath: diagnosis.IsCauseOfDeath
            };
          });

        }
        else {
          //this.msgBoxServ.showMessage("error", [res.ErrorMessage]);
        }
      },
        err => {
          this.msgBoxServ.showMessage("error", ['Failed to get Final Diagnosis data.']);
          this.logError(err.ErrorMessage);
        });
  }

  addNewRow() {

    if (this.provisionalDiagnosis != undefined && typeof (this.provisionalDiagnosis) != "string") {
      let isICDDuplicate: boolean = false;

      if (this.addedRows.some(row => row.ICDDataList.some(d => d.ICD10Id == this.provisionalDiagnosis.ICD10Id))) {
        isICDDuplicate = true;
        alert(`${this.provisionalDiagnosis.icd10Description} Already Added !`);
        this.provisionalDiagnosis = undefined;
      }

      if (!isICDDuplicate) {

        const newRow: StoreData = {
          ICDDataList: [this.provisionalDiagnosis],
          Remark: this.DiagnosisList.ProvisionalValidator.controls['Remarks'].value,
          IsCauseOfDeath: false,
        };
        this.addedRows.push(newRow);

        this.DiagnosisList.ProvisionalValidator.controls['Remarks'].reset();
        this.provisionalDiagnosis = undefined;
      }
    } else if (typeof (this.provisionalDiagnosis) == 'string') {
      alert("Enter Valid ICD10 !");
    }
  }
  AddDiagnosis() {
    if ((this.addedRows == null || this.addedRows.length <= 0) && (!Array.isArray(this.RemovedActiveDiagnosis) || this.RemovedActiveDiagnosis.length <= 0)) {
      this.msgBoxServ.showMessage("error", ['Please select data...']);
    }
    if (this.addedRows != null && this.addedRows.length > 0) {
      let PostDiagnosisData = this.addedRows.map(row => {
        return {
          DiagnosisCode: row.ICDDataList[0].ICD10Code,
          ICDId: row.ICDDataList[0].ICD10Id,
          DiagnosisCodeDescription: row.ICDDataList[0].icd10Description,
          IsCauseOfDeath: row.IsCauseOfDeath,
          Remarks: row.Remark,
          PatientId: this.SelectedPatientData.PatientId,
          PatientVisitId: this.SelectedPatientData.PatientVisitId,
          DiagnosisType: ENUM_DiagnosisType.ProvisionalDiagnosis
        };
      });

      this._clinicalNoteBLService.AddDiagnosis(PostDiagnosisData)
        .subscribe((res: DanpheHTTPResponse) => {
          if (res.Status === ENUM_DanpheHTTPResponses.OK && res.Results) {
            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Success, ["Added Successfully"]);
            this.GetProvisionalDiagnosis(this.SelectedPatientData.PatientId, this.SelectedPatientData.PatientVisitId, this.IsAcrossVisitAvailability);
            this.addedRows = [];
          }
          else {
            this.msgBoxServ.showMessage("error", [res.ErrorMessage]);
          }
        },
          err => {
            this.msgBoxServ.showMessage("error", ['Failed to save..']);
            this.logError(err.ErrorMessage);
          });
    }
    if (Array.isArray(this.RemovedActiveDiagnosis) && this.RemovedActiveDiagnosis.length > 0) {
      this.DeactivateDiagnosis(this.RemovedActiveDiagnosis);
    }

  }

  RemoveActiveDiagnosis(diagnosisId: number): void {
    if (diagnosisId > 0) {
      this.RemovedActiveDiagnosis.push(diagnosisId);
      this.CombinedDiagnosisList = this.CombinedDiagnosisList.filter(diagnosis => diagnosis.Id !== diagnosisId);
    }
  }

  DeactivateDiagnosis(list: Array<number>): void {
    const resetRemoveListGetFinalDiagnosis = () => {
      this.RemovedActiveDiagnosis = [];
      this.GetProvisionalDiagnosis(this.SelectedPatientData.PatientId, this.SelectedPatientData.PatientVisitId, this.IsAcrossVisitAvailability);
    }
    if (Array.isArray(list) && list.length > 0) {
      this._clinicalNoteBLService.DeactivateDiagnosis(list)
        .subscribe((res: DanpheHTTPResponse) => {
          if (res.Status === ENUM_DanpheHTTPResponses.OK && res.Results) {
            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Success, ["Removed Successfully"]);
            resetRemoveListGetFinalDiagnosis();
          }
          else {
            resetRemoveListGetFinalDiagnosis();
            this.msgBoxServ.showMessage("error", [res.ErrorMessage]);
          }
        },
          err => {
            resetRemoveListGetFinalDiagnosis();
            this.msgBoxServ.showMessage("error", ['Failed to save..']);
            this.logError(err.ErrorMessage);
          });
    }
  }

}
