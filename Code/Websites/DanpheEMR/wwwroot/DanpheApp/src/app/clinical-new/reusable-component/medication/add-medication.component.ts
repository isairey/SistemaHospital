import { Component, EventEmitter, Input, Output } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import * as moment from 'moment';
import { Visit } from '../../../appointments/shared/visit.model';
import { Patient_DTO } from '../../../claim-management/shared/DTOs/patient.dto';
import { CoreService } from '../../../core/shared/core.service';
import { PatientService } from "../../../patients/shared/patient.service";
import { PHRMPrescriptionItem } from '../../../pharmacy/shared/phrm-prescription-item.model';
import { DanpheHTTPResponse } from '../../../shared/common-models';
import { MessageboxService } from '../../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponses, ENUM_MedicalRoute, ENUM_MessageBox_Status } from '../../../shared/shared-enums';
import { ClinicalNoteService } from "../../shared/clinical-note.service";
import { ClinicalNoteBLService } from '../../shared/clinical.bl.service';
import { FrequencyDisplayName_DTO } from '../../shared/dto/FrequencyDisplayName.dto';
import { MedicationIntake_DTO } from '../../shared/dto/MedicationIntake.dto';
import { Medication_DTO } from '../../shared/dto/medication.dto';
import { CLNGenericModel } from '../../shared/model/cln-generic.model';

@Component({
  selector: "add-medication",
  templateUrl: "./add-medication.component.html"
})
export class AddMedicationComponent {
  @Input("SelectedPatient") SelectedPatient: Patient_DTO;

  @Input('medication-list')
  AllMedicineList: Array<{ MedicineId, MedicineName, GenericId, Dosage, TotalAvailableQuantity; }> = [];
  FilteredMedicineList: Array<{ MedicineId, MedicineName, GenericId, Dosage, TotalAvailableQuantity; }> = [];
  @Input('generic-name-list')
  GenericItems: CLNGenericModel[];

  @Input("IsDischarge-Request")
  IsDischargeRequest: boolean = false;
  @Input('is-update')
  IsUpdate: boolean = false;
  @Input('selected-item')
  SelectedMedicineItem = new Medication_DTO();
  Medication: Medication_DTO = new Medication_DTO();
  MedicationList: Medication_DTO[] = [];
  FrequencyList: Array<FrequencyDisplayName_DTO> = new Array<FrequencyDisplayName_DTO>();
  MedicationIntakeList: Array<MedicationIntake_DTO> = new Array<MedicationIntake_DTO>();
  TemporaryMedicationList: Medication_DTO[] = [];
  MedRouteList = Object.values(ENUM_MedicalRoute);
  MedicineSelected = { MedicineId: null, MedicineName: '', GenericId: null, Dosage: null };
  loading: boolean = false;
  ShowMedicationAddBox: boolean = false;
  Medications: Array<PHRMPrescriptionItem> = [];
  CurrTime: string = null;
  TempDataAdded: boolean = false;
  ViewAvailableItemQuantity: { DisplayItemStockDuringOrder: false, ShowZeroStockItem: false; };

  @Output("callback-close")
  callbackClose: EventEmitter<Object> = new EventEmitter<Object>();
  @Output("callback-add")
  callbackAdd: EventEmitter<Object> = new EventEmitter<Object>();
  currVisit: Visit = new Visit();
  MedicationValidator: FormGroup = null;


  constructor(public patientService: PatientService,
    private _coreService: CoreService,
    private _clinicalBlService: ClinicalNoteBLService,
    private _msgBoxServ: MessageboxService,
    private _clinicalService: ClinicalNoteService
  ) {
    this.CurrTime = moment().format('YYYY-MM-DD HH:mm:ss');
    const _formBuilder = new FormBuilder();
    this.MedicationValidator = _formBuilder.group({
      'ItemName': ['', Validators.compose([Validators.required])],
      'GenericName': [''],
      'Dosage': [''],
      'Strength': ['', [Validators.required, Validators.min(0)]],
      'Route': ['', Validators.compose([Validators.required])],
      'FrequencyAbbreviation': ['', Validators.compose([Validators.required])],
      'Remarks': [''],
      'IsPRN': [false],
      'TimingOfMedicineTake': ['', Validators.compose([Validators.required])],
      'PRNNotes': [''],
      'HowManyDays': [''],
      'ItemId': [''],
      'GenericId': [''],
      'PatientId': [''],
    });
    this.MedicationList = this.MedicationList || [];
    this.GetFrequencyDisplayName();
    this.GetMedicationIntake();
    console.log(this.MedRouteList);
  }
  ngOnInit() {
    this.FilteredMedicineList = this.AllMedicineList;
    if (this.IsUpdate && this.SelectedMedicineItem) {
      try {
        if (this.AllMedicineList && this.AllMedicineList.length > 0) {
          let selectedItem = this.AllMedicineList.find(a => a.MedicineId === this.SelectedMedicineItem.ItemId);
          let selectedMedicine = {
            GenericName: this.SelectedMedicineItem.GenericName || '',
            Strength: this.SelectedMedicineItem.Strength || '',
            Dosage: this.SelectedMedicineItem.Dosage || '',
            Route: this.SelectedMedicineItem.Route || '',
            FrequencyAbbreviation: this.SelectedMedicineItem.FrequencyAbbreviation || '',
            Remarks: this.SelectedMedicineItem.Notes || '',
            IsPRN: this.SelectedMedicineItem.IsPRN || false,
            TimingOfMedicineTake: this.SelectedMedicineItem.TimingOfMedicineTake || '',
            PRNNotes: this.SelectedMedicineItem.PRNNotes || '',
            HowManyDays: this.SelectedMedicineItem.HowManyDays || '',
            MedicineId: this.SelectedMedicineItem.ItemId || '',
            GenericId: this.SelectedMedicineItem.GenericId || '',
            PatientId: this.SelectedMedicineItem.PatientId || '',
            ItemId: selectedItem.MedicineId || '',
            ItemName: selectedItem.MedicineName || '',
          };
          this.MedicationValidator.patchValue(selectedMedicine);
        }
      } catch (error) {
        this._msgBoxServ.showMessage[ENUM_MessageBox_Status.Error, 'getting error while patching the value', error];
      }
    }
  }
  ngOnChanges() {
    if (this.SelectedPatient && this.SelectedPatient) {
      this.Medication.PatientId = this.SelectedPatient.PatientId;
      this.Medication.PatientVisitId = this.SelectedPatient.PatientVisitId;
    }

  }
  AddToTemporaryList(): void {
    if (this.MedicationValidator.valid) {
      const newMedication: Medication_DTO = this.MedicationValidator.value;

      const isDuplicate = this.TemporaryMedicationList.some(
        temp => temp.GenericId === newMedication.GenericId && temp.ItemName === newMedication.ItemName
      );
      if (!isDuplicate) {
        this.TemporaryMedicationList.push(newMedication);
        this.TempDataAdded = true;
        this.FilteredMedicineList = [...this.AllMedicineList];
        this.MedicationValidator.reset();
        this.MedicationValidator.get('IsPRN').setValue(false);
      } else {
        this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ['Order already exists in the list.']);
      }
    } else {
      this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ['Please fill in all required details before proceeding.']);
    }
  }

  GetFrequencyDisplayName() {
    this._clinicalBlService.GetFrequencyDisplayName()
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this.FrequencyList = res.Results;
        }
        else {
          console.error(res.ErrorMessage);
        }

      });
  }
  GetMedicationIntake() {
    this._clinicalBlService.GetMedicationIntake()
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this.MedicationIntakeList = res.Results;
        }
        else {
          console.error(res.ErrorMessage);
        }

      });
  }
  OnGenericNameSelected() {
    let selectedGeneric = this.MedicationValidator.get("GenericName").value;
    if (selectedGeneric && selectedGeneric.GenericId) {
      this.FilteredMedicineList = this.AllMedicineList.filter((a) => a.GenericId === selectedGeneric.GenericId);
    }
    else {
      this.FilteredMedicineList = this.AllMedicineList;
    }
  }
  onMedicationSelected(selectedMedication: any): void {
    if (selectedMedication && selectedMedication.MedicineId !== this.MedicineSelected.MedicineId) {
      this.MedicineSelected = {
        MedicineId: selectedMedication.MedicineId,
        MedicineName: selectedMedication.MedicineName,
        GenericId: selectedMedication.GenericId,
        Dosage: selectedMedication.Dosage
      };

      this.MedicationValidator.patchValue({
        ItemId: this.MedicineSelected.MedicineId,
        GenericId: this.MedicineSelected.GenericId,
        ItemName: this.MedicineSelected.MedicineName,
        Dosage: this.MedicineSelected.Dosage
      });

      const matchingGenericName = this.GenericItems.find(item => item.GenericId === this.MedicineSelected.GenericId);
      if (matchingGenericName) {
        this.MedicationValidator.get('GenericName').setValue(matchingGenericName.GenericName);
        this.MedicationValidator.get('GenericId').setValue(matchingGenericName.GenericId);

      } else {
        this.MedicationValidator.get('GenericName').setValue('');
        this.MedicationValidator.get('GenericId').setValue('');

      }
      this.AssignValue();
    }
  }
  AssignValue() {
    this.MedicationList = [];
    this.MedicationList.push(...this.TemporaryMedicationList);
    this.MedicationList.forEach(item => {
      item.PatientId = this.SelectedPatient.PatientId;
      item.PatientVisitId = this.SelectedPatient.PatientVisitId;
      item.IsDischargeRequest = this.IsDischargeRequest;
    });

  }
  AddMedication(): void {
    this.loading = false;
    this.MedicationList = [];
    this.AssignValue();
    if (this.MedicationList.length > 0) {
      this._clinicalBlService.PostMedication(this.MedicationList).subscribe((res: DanpheHTTPResponse) => {
        if (res.Status == ENUM_DanpheHTTPResponses.OK) {
          this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Success, ["Order Requested successfully"]);
          this.MedicationValidator.reset();
          this.callbackClose.emit();
          this.callbackAdd.emit();
          this._clinicalService.TriggerRefreshMedicationList();
        } else {
          this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ['Unable to Order Medication.']);
        }
      });
    }
    else {
      this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Notice, ['Please add at least one Medicine in the list.']);
    }

  }
  public Update() {
    this.Medication = this.MedicationValidator.value;
    this.Medication.PrescriptionItemId = this.SelectedMedicineItem.PrescriptionItemId;
    this.Medication.PatientId = this.SelectedMedicineItem.PatientId;
    this.Medication.PatientVisitId = this.SelectedMedicineItem.PatientVisitId;
    this.Medication.IsDischargeRequest = false;
    this._clinicalBlService.PutMedication(this.Medication).subscribe((res: DanpheHTTPResponse) => {
      this.loading = false;
      if (res.Status === ENUM_DanpheHTTPResponses.OK) {
        this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Success, ["Updated Successfully."]);
        this.callbackAdd.emit();
        this._clinicalService.TriggerRefreshMedicationList();

      }
      else {
        this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ['Unable to update home medication.']);
      }
    });
  }
  myListFormatter(data: any): string {
    let html = "";
    if (data.TotalAvailableQuantity === 0) {
      html = `<font color='crimson';>${data["MedicineName"]}</font>`;
    }
    else {
      html = data["MedicineName"];
    }
    return html;
  }
  GenericNameFormatter(data: any): string {
    let html = data["GenericName"];
    return html;
  }
  Discard() {
    this.MedicationValidator.reset();
  }

  //to remove one medicine from the list of medicines.
  RemoveMedicineItem(index: number) {
    if (this.TemporaryMedicationList && this.TemporaryMedicationList.length > index) {
      this.TemporaryMedicationList.splice(index, 1);
    }
  }
  AddNewMedicineItem() {
    this.MedicationList.push({} as Medication_DTO);
  }
  GetDefaultMedItem(): PHRMPrescriptionItem {
    let defItem = new PHRMPrescriptionItem();
    defItem.ItemName = "--Any--";
    defItem.ItemId = 0;
    defItem.Dosage = "N/A";
    return defItem;
  }
  public FocusOnInputField(id: string) {
    this._coreService.FocusInputById(id);
  }
  ViewAvailableItemQuantityParameter() {
    let Parameter = this._coreService.Parameters;
    let clinicalParam = Parameter.find(a => a.ParameterGroupName === "Clinical" && a.ParameterName === "ShowAvailableItemQuantity");
    if (clinicalParam) {
      this.ViewAvailableItemQuantity = JSON.parse(clinicalParam.ParameterValue);
    }
  }
}
