import { Component } from '@angular/core';
import { ClinicalPatientService } from '../../../../clinical-new/shared/clinical-patient.service';
import { PatientDetails_DTO } from '../../../../clinical-new/shared/dto/patient-cln-detail.dto';
import { DanpheHTTPResponse } from '../../../../shared/common-models';
import { MessageboxService } from '../../../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponses, ENUM_DiagnosisType, ENUM_MessageBox_Status } from '../../../../shared/shared-enums';
import { ClinicalNoteBLService } from '../../../shared/clinical.bl.service';
import { Field } from '../../../shared/dto/field.dto';
import { ActiveDiagnosis } from '../provisional-diagnosis/Shared-file/active-diagnosis.dto';
import { CurrentData } from './shared/CurrentDiagnosis_DTO';
import { ICDData, StoreData } from './shared/ICDData_DTO';
import { ICDDiagnonsis } from './shared/ICDfinal-diagnosis.Model';


@Component({
  selector: 'app-final-diagnosis',
  templateUrl: './final-diagnosis.component.html',
})
export class FinalDiagnosisComponent {
  public CombinedDiagnosisList: Array<ActiveDiagnosis> = [];
  Field: Field;
  IsAcrossVisitAvailability: boolean = false;
  public provisionalDiagnosis: ICDData = new ICDData();
  public icd10List: Array<ICDData>;
  public selectedProvisionalDiagnosisList: Array<ICDData> = new Array<ICDData>();
  public DiagnosisList: ICDDiagnonsis = new ICDDiagnonsis();
  public addedRows: Array<any> = [];
  SelectedPatinetData = new PatientDetails_DTO();
  PatientId: number = 0;
  PatientVisitId: number = 0;
  CurrentDataList: Array<CurrentData> = new Array<CurrentData>();
  IsPrimaryDiagnosis: boolean = true;
  DiagnosisLimit: boolean = false;
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
    this.GetICDList();
    this.SelectedPatinetData = this._selectedPatient.SelectedPatient;
    if (this.SelectedPatinetData && this.SelectedPatinetData.PatientId) {
      this.GetFinalDiagnosis(this.SelectedPatinetData.PatientId, this.SelectedPatinetData.PatientVisitId, this.IsAcrossVisitAvailability);
    }
    else {
      this.CurrentDataList = null;
    }
    this.IsPrimaryDiagnosis = true;
    if (this.SelectedPatinetData) {
      this.PatientId = this.SelectedPatinetData.PatientId;
      this.PatientVisitId = this.SelectedPatinetData.PatientVisitId;
    }
  }
  DiagnosisFormatter(data: any): string {
    let html = data["ICD10Code"] + '|' + data["icd10Description"];
    return html;
  }

  RemoveProvisionalDiagnosis(i) {
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
  GetFinalDiagnosis(PatientId: number, PatientVisitId: number, IsAcrossVisitAvailability: boolean) {
    this._clinicalNoteBLService.GetDiagnoses(PatientId, PatientVisitId, ENUM_DiagnosisType.FinalDiagnosis, IsAcrossVisitAvailability)
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK && res.Results) {
          this.CurrentDataList = res.Results;
          // if (this.CurrentDataList) {
          //   this.DiagnosisList.FinalDiagnosisValidator.controls['IsCauseOfDeath'].setValue(true);
          // }
          if (Array.isArray(this.CurrentDataList) && this.CurrentDataList.some(item => item.IsCauseOfDeath)) {
            this.DiagnosisList.FinalDiagnosisValidator.controls['IsCauseOfDeath'].setValue(true);
            this.DiagnosisLimit = true;
          }


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
          // this.msgBoxServ.showMessage("error", [res.ErrorMessage]);
        }
      },
        err => {
          this.msgBoxServ.showMessage("error", ['Failed to get Final Diagnosis data.']);
          this.logError(err.ErrorMessage);
        });
  }

  logError(err: any) {
    console.log(err);
  }
  Remove() {
    this.selectedProvisionalDiagnosisList = [];
    this.addedRows = [];
  }
  addNewRow() {
    if (this.DiagnosisLimit && this.addedRows.length > 0 && this.DiagnosisList.FinalDiagnosisValidator.controls['IsCauseOfDeath'].value === true) {
      alert("Diagnosis limit reached. You cannot add more than one row.");
      this.DiagnosisList.FinalDiagnosisValidator.controls['IsCauseOfDeath'].setValue(false);
      return;
    }
    if (this.addedRows.length == 0) {
      this.DiagnosisLimit = false;
    }
    if (this.provisionalDiagnosis != undefined && typeof (this.provisionalDiagnosis) != "string") {
      let isICDDuplicate: boolean = false;

      if (this.addedRows.some(row => row.ICDDataList.some(d => d.ICD10Id == this.provisionalDiagnosis.ICD10Id))) {
        isICDDuplicate = true;
        alert(`${this.provisionalDiagnosis.icd10Description} Already Added !`);
        this.provisionalDiagnosis = undefined;
      }

      if (!isICDDuplicate) {
        let isCauseOfDeath = this.DiagnosisList.FinalDiagnosisValidator.controls['IsCauseOfDeath'].value;
        if (isCauseOfDeath == null || isCauseOfDeath == undefined) {
          isCauseOfDeath = false;
        }
        const newRow: StoreData = {
          ICDDataList: [this.provisionalDiagnosis],
          Remark: this.DiagnosisList.FinalDiagnosisValidator.controls['Remarks'].value,
          IsCauseOfDeath: this.DiagnosisList.FinalDiagnosisValidator.controls['IsCauseOfDeath'].value
        };
        if (newRow.IsCauseOfDeath === true) {
          this.DiagnosisLimit = true;
          this.DiagnosisList.FinalDiagnosisValidator.controls['IsCauseOfDeath'].setValue(false);
        }
        this.addedRows.push(newRow);

        this.DiagnosisList.FinalDiagnosisValidator.controls['Remarks'].reset();
        this.provisionalDiagnosis = undefined;
        this.IsPrimaryDiagnosis = false;
      }
    } else if (typeof (this.provisionalDiagnosis) == 'string') {
      alert("Enter Valid ICD10 !");
    }

  }
  removeRow(index: number) {
    if (this.addedRows[index].IsCauseOfDeath === true) {
      this.DiagnosisLimit = false;
    }
    this.addedRows.splice(index, 1);
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
          PatientId: this.SelectedPatinetData.PatientId,
          PatientVisitId: this.SelectedPatinetData.PatientVisitId,
          DiagnosisType: ENUM_DiagnosisType.FinalDiagnosis
        };
      });
      if (
        Array.isArray(this.CurrentDataList) &&
        this.CurrentDataList.some(item => item.IsCauseOfDeath) &&
        Array.isArray(PostDiagnosisData) && PostDiagnosisData.some(item => item.IsCauseOfDeath)
      ) {
        // Both arrays have at least one item with IsCauseOfDeath as true
        this.msgBoxServ.showMessage("error", ['Primary Diagnosis is active for this visit.']);
        return;
      }
      this._clinicalNoteBLService.AddDiagnosis(PostDiagnosisData)
        .subscribe((res: DanpheHTTPResponse) => {
          if (res.Status === ENUM_DanpheHTTPResponses.OK && res.Results) {
            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Success, ["Added Successfully"]);
            this.GetFinalDiagnosis(this.SelectedPatinetData.PatientId, this.SelectedPatinetData.PatientVisitId, this.IsAcrossVisitAvailability);
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
      this.GetFinalDiagnosis(this.SelectedPatinetData.PatientId, this.SelectedPatinetData.PatientVisitId, this.IsAcrossVisitAvailability);
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
