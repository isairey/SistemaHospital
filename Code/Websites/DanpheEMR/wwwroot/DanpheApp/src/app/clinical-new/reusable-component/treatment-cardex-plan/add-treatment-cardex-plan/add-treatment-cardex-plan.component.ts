import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import * as moment from 'moment';
import { ClinicalNoteService } from '../../../../clinical-new/shared/clinical-note.service';
import { ClinicalNoteBLService } from '../../../../clinical-new/shared/clinical.bl.service';
import { EmployeeListDTO } from '../../../../clinical-settings/shared/dto/employee-list.dto';
import { CoreService } from '../../../../core/shared/core.service';
import { DanpheHTTPResponse } from '../../../../shared/common-models';
import { MessageboxService } from '../../../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponses, ENUM_DateTimeFormat, ENUM_MedicalRoute, ENUM_Medication_Status, ENUM_MessageBox_Status } from '../../../../shared/shared-enums';
import { FrequencyDisplayName_DTO } from '../../../shared/dto/FrequencyDisplayName.dto';
import { MedicationIntake_DTO } from '../../../shared/dto/MedicationIntake.dto';
import { CardexPlan_DTO } from '../../../shared/dto/cardex-plan.dto';
import { MedicationCardex_Dto } from '../../../shared/dto/medication-cardex-plan.dto';
import { PatientDetails_DTO } from '../../../shared/dto/patient-cln-detail.dto';
import { RequestedMedicationItemDto } from '../../../shared/dto/requested-medication-item.dto';
import { CLNGenericModel } from '../../../shared/model/cln-generic.model';

@Component({
  selector: 'add-treatment-cardex-plan',
  templateUrl: './add-treatment-cardex-plan.component.html',
})
export class AddTreatmentCardexPlanComponent {
  @Input("SelectedPatient") SelectedPatient: PatientDetails_DTO;
  @Input("Selected-Medication") SelectedMedication: RequestedMedicationItemDto;
  @Input("New-Cardex-Plan") IsNewPlan: boolean;

  @Output("callback-add")
  CallbackAdd: EventEmitter<Object> = new EventEmitter<Object>();
  @Input("Selected-Plan") SelectedMedicationPlan: CardexPlan_DTO;
  @Input("Update-Cardex-Plan") IsUpdateCardexPlan: boolean = false;

  @Input("Prescriber-Id") PrescribeId: number = 0;
  AllMedicineList: Array<{ MedicineId, MedicineName, GenericId, Dosage; }> = [];
  GenericItems: CLNGenericModel[];
  FrequencyList = new Array<FrequencyDisplayName_DTO>();
  MedicationIntakeList = new Array<MedicationIntake_DTO>();
  MedicineSelected = { MedicineId: null, MedicineName: '', GenericId: null, Dosage: null };
  TreatmentCardexPlanForm: FormGroup = null;
  EmployeeList = new Array<EmployeeListDTO>();
  ShowPRNNotesTextArea: boolean = false;
  MedRouteList = Object.values(ENUM_MedicalRoute);
  ShowAlterMedicineField: boolean = false;
  NewMedicationCardex = new MedicationCardex_Dto();
  CurrentMedicationCardex = new MedicationCardex_Dto();
  MedicationStatus = Object.values(ENUM_Medication_Status);
  MedicationStartDate: string = moment().format(ENUM_DateTimeFormat.Year_Month_Day_Hour_Minute);
  MedicationEndDate: string = moment().format(ENUM_DateTimeFormat.Year_Month_Day_Hour_Minute);
  CardexPlanList = new Array<CardexPlan_DTO>();

  constructor(
    private _clinicalBlservice: ClinicalNoteBLService,
    private _msgBoxServ: MessageboxService,
    public coreService: CoreService,
    private formBuilder: FormBuilder,
    private _clinicalService: ClinicalNoteService

  ) {
    this.GetGenericItemList();
    this.GetFrequencyList();
    this.GetMedicationIntakeTypes();
  }
  ngOnInit() {
    this.TreatmentCardexPlanForm = this.formBuilder.group({
      BrandName: [''],
      GenericName: [{ value: '', disabled: true }, Validators.required],
      Doses: [''],
      Strength: ['', Validators.required],
      Route: ['', Validators.required],
      Frequency: ['', Validators.required],
      Duration: [0, Validators.required],
      CardexNote: [''],
      UseAlternateMedicine: [false],
      IsPRN: [false],
      PRNNotes: [''],
      ItemName: [''],
      Remarks: [''],
      GenericId: [''],
      MedicationSchedule: [''],
      AlternateMedicine: [''],
      Prescriber: [''],
      Status: ['', Validators.required]
    });
    // this.GetEmployeeList();
    this.LoadAllMedicationsItems();
    if (this.IsNewPlan) {
      this.TreatmentCardexPlanForm.reset();
      this.SelectedMedication = new RequestedMedicationItemDto();
    }
    if (this.SelectedPatient.PatientId && this.SelectedPatient.PatientVisitId) {
      this.GetTreatmentCardexPlanList();
    }
    const newStatus = ENUM_Medication_Status.Active;
    this.TreatmentCardexPlanForm.patchValue({
      Status: newStatus
    });

  }
  get StatusControl() {
    return this.TreatmentCardexPlanForm.value;
  }
  LoadAllMedicationsItems(): void {
    this._clinicalBlservice.AllMedicationsItems()
      .subscribe(
        (res: DanpheHTTPResponse) => {
          if (res.Status == ENUM_DanpheHTTPResponses.OK) {
            this.AllMedicineList = [];
            res.Results.forEach(a => {
              this.AllMedicineList.push({
                MedicineName: a.Item.ItemName,
                MedicineId: a.Item.ItemId,
                GenericId: a.Item.GenericId,
                Dosage: a.Item.Dosage
              });
            });
            if (this.SelectedMedication || this.SelectedMedicationPlan) {
              this.PatchToTreatmentCardexPlan();
            }
          }
          else {
            this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ['Failed to Load Medication List.'], res.ErrorMessage);
          }
        });
  }
  GetGenericItemList() {
    this._clinicalBlservice.GenericName()
      .subscribe(
        (res: DanpheHTTPResponse) => {
          if (res.Status == ENUM_DanpheHTTPResponses.OK) {
            this.GenericItems = res.Results;
          }
          else {
            this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ['Failed to Load Generic Name List.'], res.ErrorMessage);
          }
        });
  }
  GetFrequencyList() {
    this._clinicalBlservice.GetFrequencyDisplayName()
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this.FrequencyList = res.Results;
        }
        else {
          console.error(res.ErrorMessage);
        }

      });
  }
  GetMedicationIntakeTypes() {
    this._clinicalBlservice.GetMedicationIntake()
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this.MedicationIntakeList = res.Results;
        }
        else {
          console.error(res.ErrorMessage);
        }

      });
  }
  GetTreatmentCardexPlanList() {
    this._clinicalBlservice.GetTreatmentCardexPlanList(this.SelectedPatient.PatientId, this.SelectedPatient.PatientVisitId)
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this.CardexPlanList = res.Results;
        }
      });
  }
  FocusOnInputField(id: string) {
    this.coreService.FocusInputById(id);
  }
  OnMedicationSelected(selectedMedication: any): void {
    if (selectedMedication && selectedMedication.MedicineId !== this.MedicineSelected.MedicineId) {
      this.MedicineSelected = {
        MedicineId: selectedMedication.MedicineId,
        MedicineName: selectedMedication.MedicineName,
        GenericId: selectedMedication.GenericId,
        Dosage: selectedMedication.Dosage
      };

      this.TreatmentCardexPlanForm.patchValue({
        ItemId: this.MedicineSelected.MedicineId,
        GenericId: this.MedicineSelected.GenericId,
        ItemName: this.MedicineSelected.MedicineName,
        Dosage: this.MedicineSelected.Dosage
      });

      const matchingGenericName = this.GenericItems.find(item => item.GenericId === this.MedicineSelected.GenericId);
      if (matchingGenericName) {
        this.TreatmentCardexPlanForm.get('GenericName').patchValue(matchingGenericName.GenericName || '');
        this.TreatmentCardexPlanForm.get('GenericId').setValue(matchingGenericName.GenericId);

      } else {
        this.TreatmentCardexPlanForm.get('GenericName').setValue('');
        this.TreatmentCardexPlanForm.get('GenericId').setValue('');

      }
    } else {
      this.MedicineSelected = { MedicineId: null, MedicineName: '', GenericId: null, Dosage: null };
      this.TreatmentCardexPlanForm.patchValue({
        ItemId: null,
        GenericId: null,
        ItemName: '',
        Dosage: null
      });
      this.TreatmentCardexPlanForm.get('GenericName').setValue('');
    }
  }
  MyListFormatter(data: any): string {
    let html = data["MedicineName"];
    return html;
  }
  PatchToTreatmentCardexPlan() {
    if (this.SelectedMedication) {
      this.TreatmentCardexPlanForm.patchValue({
        'Doses': this.SelectedMedication.Doses,
        'Strength': this.SelectedMedication.Strength,
        'Route': this.SelectedMedication.RouteOfAdministration,
        'Frequency': this.SelectedMedication.FrequencyAbbreviation,
        'MedicationSchedule': this.SelectedMedication.MedicationSchedule,
        'Duration': this.SelectedMedication.Duration,
        'Remarks': this.SelectedMedication.Notes,
        'IsPRN': this.SelectedMedication.IsPRN,
        'PRNNotes': this.SelectedMedication.PRNNotes,
      });
      this.ShowPRNNotesTextArea = this.SelectedMedication.IsPRN;
      this.TreatmentCardexPlanForm.get('ItemName').patchValue(this.SelectedMedication.ItemName);
      this.TreatmentCardexPlanForm.get('GenericName').patchValue(this.SelectedMedication.GenericName);
      this.TreatmentCardexPlanForm.get('Prescriber').patchValue(this.SelectedMedication.Prescriber);

    }
    else if (this.SelectedMedicationPlan) {
      this.TreatmentCardexPlanForm.patchValue({
        'Doses': this.SelectedMedicationPlan.Doses,
        'Strength': this.SelectedMedicationPlan.Strength,
        'Route': this.SelectedMedicationPlan.RouteOfAdministration,
        'Frequency': this.SelectedMedicationPlan.FrequencyAbbreviation,
        'MedicationSchedule': this.SelectedMedicationPlan.MedicationSchedule,
        'Duration': this.SelectedMedicationPlan.Duration,
        'Remarks': this.SelectedMedicationPlan.Notes,
        'IsPRN': this.SelectedMedicationPlan.IsPRN,
        'PRNNotes': this.SelectedMedicationPlan.PRNNotes,
        'Status': this.SelectedMedicationPlan.Status,
        'CardexNote': this.SelectedMedicationPlan.CardexNote,
        'AlternateMedicine': this.SelectedMedicationPlan.AlternateMedicine,
      });
      this.ShowPRNNotesTextArea = this.SelectedMedicationPlan.IsPRN;
      this.TreatmentCardexPlanForm.get('ItemName').patchValue(this.SelectedMedicationPlan.ItemName);
      this.TreatmentCardexPlanForm.get('GenericName').patchValue(this.SelectedMedicationPlan.GenericName);
      this.TreatmentCardexPlanForm.get('Prescriber').patchValue(this.SelectedMedicationPlan.Prescriber);
      if (this.SelectedMedicationPlan.AlternateMedicine) {
        let useAlternate = true;
        this.TreatmentCardexPlanForm.get('UseAlternateMedicine').patchValue(useAlternate);
        this.ShowAlterMedicineField = true;
      }
      else {
        this.ShowAlterMedicineField = false;
      }
      if (this.SelectedMedicationPlan.MedicationStartDate) {
        this.MedicationStartDate = this.SelectedMedicationPlan.MedicationStartDate;
        this.MedicationEndDate = moment(this.SelectedMedicationPlan.MedicationStartDate, ENUM_DateTimeFormat.Year_Month_Day_Hour_Minute)
          .clone() // Create a new moment object to avoid modifying the original
          .add(this.SelectedMedicationPlan.Duration, 'days')
          .format(ENUM_DateTimeFormat.Year_Month_Day_Hour_Minute);
      }
    }
  }
  AddNewPlan() {
    if (this.MedicineSelected && this.MedicineSelected.MedicineId) {
      this.NewMedicationCardex.ItemId = this.MedicineSelected.MedicineId;
    }
    else {
      this.NewMedicationCardex.ItemId = this.SelectedMedication.MedicationItemId;
    }
    const isItemInCardex = this.CardexPlanList.some(item => item.MedicationItemId === this.NewMedicationCardex.ItemId && item.Status !== "Not In Plan");

    if (isItemInCardex) {
      const confirmed = window.confirm('Selected Medicine already exists in the Cardex Plan! Are you sure you want to add it again?');
      if (confirmed) {
        this.AddToCardexPlan();
      }
    } else {
      this.AddToCardexPlan();
    }
  }
  public IsValidCheck(fieldName?: string, validator?: string): boolean {
    if (!fieldName) {
      return this.TreatmentCardexPlanForm.valid;
    } else {
      return !this.TreatmentCardexPlanForm.controls[fieldName].hasError(validator);
    }
  }
  AddToCardexPlan() {
    for (let i in this.TreatmentCardexPlanForm.controls) {
      this.TreatmentCardexPlanForm.controls[i].markAsDirty();
      this.TreatmentCardexPlanForm.controls[
        i
      ].updateValueAndValidity();
    }
    if (this.TreatmentCardexPlanForm.valid) {

      let medicationCardex = this.TreatmentCardexPlanForm.value;
      this.NewMedicationCardex = medicationCardex;
      this.NewMedicationCardex.PatientId = this.SelectedPatient.PatientId;
      this.NewMedicationCardex.PatientVisitId = this.SelectedPatient.PatientVisitId;
      this.NewMedicationCardex.PrescriberId = this.PrescribeId;
      this.NewMedicationCardex.MedicationStartDate = this.MedicationStartDate;
      this.NewMedicationCardex.MedicationEndDate = this.MedicationEndDate;
      if (this.MedicineSelected && this.MedicineSelected.MedicineId) {
        this.NewMedicationCardex.ItemId = this.MedicineSelected.MedicineId;
      }
      else {
        this.NewMedicationCardex.ItemId = this.SelectedMedication.MedicationItemId;
      }
      if (this.SelectedMedication && this.SelectedMedication.PrescriptionItemId) {
        this.NewMedicationCardex.PrescriptionItemId = this.SelectedMedication.PrescriptionItemId;
      }
      if (!this.NewMedicationCardex.IsPRN) {
        this.NewMedicationCardex.IsPRN = false;
      }
      if (!this.NewMedicationCardex.UseAlternateMedicine) {
        this.NewMedicationCardex.UseAlternateMedicine = false;
      }
      this._clinicalBlservice.AddToCardexPlan(this.NewMedicationCardex).subscribe({
        next: (res: DanpheHTTPResponse) => {
          if (res.Status === ENUM_DanpheHTTPResponses.OK) {
            this.NewMedicationCardex = res.Results;
            this._msgBoxServ.showMessage(
              ENUM_MessageBox_Status.Success,
              ['New Medication Cardex Added Successfully.']
            );
            this._clinicalService.TriggerRefreshMedicationList();
            this.CallbackAdd.emit(res.Results);
            this.TreatmentCardexPlanForm.reset();
          } else {
            this._msgBoxServ.showMessage(
              ENUM_MessageBox_Status.Failed,
              [res.ErrorMessage]
            );
          }
        },
        error: (err) => {
          this._msgBoxServ.showMessage(
            ENUM_MessageBox_Status.Failed,
            ['An error occurred while adding the Medication Cardex. Please try again.']
          );
          console.error(err);
        },
      });
    } else {
      this._msgBoxServ.showMessage(
        ENUM_MessageBox_Status.Failed,
        ['Please fill all mandatory fields before submitting.']
      );
    }
  }


  UpdateCurrentCardexPlan() {
    for (let control in this.TreatmentCardexPlanForm.controls) {
      if (this.TreatmentCardexPlanForm.controls.hasOwnProperty(control)) {
        this.TreatmentCardexPlanForm.controls[control].markAsDirty();
        this.TreatmentCardexPlanForm.controls[control].updateValueAndValidity();
      }
    }
    if (this.TreatmentCardexPlanForm.valid) {
      let medicationCardex = this.TreatmentCardexPlanForm.value;
      this.CurrentMedicationCardex = medicationCardex;

      this.CurrentMedicationCardex.CardexId = this.SelectedMedicationPlan.CardexId;
      this.CurrentMedicationCardex.PatientId = this.SelectedPatient.PatientId;
      this.CurrentMedicationCardex.PatientVisitId = this.SelectedPatient.PatientVisitId;
      this.CurrentMedicationCardex.PrescriberId = this.SelectedMedicationPlan.PrescriberId;
      this.CurrentMedicationCardex.MedicationStartDate = this.MedicationStartDate;
      this.CurrentMedicationCardex.MedicationEndDate = this.MedicationEndDate;

      if (this.SelectedMedicationPlan) {
        this.CurrentMedicationCardex.ItemId = this.SelectedMedicationPlan.MedicationItemId;
        this.CurrentMedicationCardex.PrescriptionItemId = this.SelectedMedicationPlan.PrescriptionItemId;
      }

      this._clinicalBlservice.UpdateCurrentCardexPlan(this.CurrentMedicationCardex).subscribe({
        next: (res: DanpheHTTPResponse) => {
          if (res.Status === ENUM_DanpheHTTPResponses.OK) {
            this.CurrentMedicationCardex = res.Results;
            this._msgBoxServ.showMessage(
              ENUM_MessageBox_Status.Success,
              ['Medication Cardex Updated Successfully.']
            );
            this.CallbackAdd.emit(res.Results);
            this.TreatmentCardexPlanForm.reset();
          } else {
            this._msgBoxServ.showMessage(
              ENUM_MessageBox_Status.Failed,
              [res.ErrorMessage]
            );
          }
        },
        error: (err) => {
          this._msgBoxServ.showMessage(
            ENUM_MessageBox_Status.Failed,
            ['An error occurred while updating the Medication Cardex. Please try again.']
          );
          console.error(err);
        },
      });
    } else {
      this._msgBoxServ.showMessage(
        ENUM_MessageBox_Status.Failed,
        ['Please fill all mandatory fields before submitting.']
      );
    }
  }


  IsPRNCheck() {
    this.ShowPRNNotesTextArea = !this.ShowPRNNotesTextArea;
  }
  IsUseAlternateMedicine() {
    this.ShowAlterMedicineField = !this.ShowAlterMedicineField;
  }
  OnChangeDuration() {
    let duration = this.TreatmentCardexPlanForm.get('Duration').value;
    let startDate = moment(this.MedicationStartDate, ENUM_DateTimeFormat.Year_Month_Day_Hour_Minute);
    if (duration === null || duration === undefined || duration <= 0) {
      this.MedicationEndDate = startDate.format(ENUM_DateTimeFormat.Year_Month_Day_Hour_Minute);
    } else {
      this.MedicationEndDate = startDate
        .clone() // Create a new moment object to avoid modifying the original
        .add(duration, 'days')
        .format(ENUM_DateTimeFormat.Year_Month_Day_Hour_Minute);
    }
  }
  OnChangeDates() {
    let startDate = moment(this.MedicationStartDate, ENUM_DateTimeFormat.Year_Month_Day_Hour_Minute);
    let endDate = moment(this.MedicationEndDate, ENUM_DateTimeFormat.Year_Month_Day_Hour_Minute);
    if (this.MedicationStartDate && this.MedicationEndDate) {
      let duration = endDate.diff(startDate, 'days');
      this.TreatmentCardexPlanForm.patchValue({ Duration: duration });
    } else if (this.MedicationStartDate) {
      this.MedicationEndDate = startDate.format(ENUM_DateTimeFormat.Year_Month_Day_Hour_Minute);
    }
  }
}
