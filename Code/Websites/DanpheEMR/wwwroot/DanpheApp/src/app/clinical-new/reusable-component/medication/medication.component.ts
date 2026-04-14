import { Component, Input, OnInit } from "@angular/core";
import * as moment from "moment";
import { CoreService } from "../../../core/shared/core.service";
import { DanpheHTTPResponse } from "../../../shared/common-models";
import { MessageboxService } from "../../../shared/messagebox/messagebox.service";
import { ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status, Enum_PrescriptionOrderStatus } from "../../../shared/shared-enums";
import { ClinicalNoteService } from "../../shared/clinical-note.service";
import { ClinicalPatientService } from "../../shared/clinical-patient.service";
import { ClinicalNoteBLService } from "../../shared/clinical.bl.service";
import { Field } from "../../shared/dto/field.dto";
import { Medication_DTO } from "../../shared/dto/medication.dto";
import { PatientDetails_DTO } from "../../shared/dto/patient-cln-detail.dto";
import { CLNGenericModel } from "../../shared/model/cln-generic.model";

@Component({
  selector: 'medication',
  templateUrl: './medication.component.html'
})
export class MedicationMainComponent implements OnInit {
  Field: Field;
  IsAcrossVisitAvailability: boolean = false;

  @Input("IsDischarge-Request")
  IsDischargeRequest: boolean = false;
  SelectedPatient: PatientDetails_DTO;
  Loading: boolean = false;
  Date: string = moment().format("YYYY-MM-DD");
  ShowLabRequest: boolean;
  ShowImagingRequest: boolean;
  MedicationPopup: boolean = false;
  ShowMedicationAddBox: boolean = false;
  ShowRequested: boolean;
  EditMedication: Medication_DTO;
  RequestedMedicationList: Medication_DTO[];
  FilteredMedicationList: Medication_DTO[];
  ShowMedicationUpdateBox: boolean = false;
  SelectedMedicineItem = new Medication_DTO();
  GenericItems: CLNGenericModel[];
  ViewAvailableItemQuantity: { DisplayItemStockDuringOrder: false, ShowZeroStockItem: false; };

  AllMedicineList: Array<{ MedicineId, MedicineName, GenericId, Dosage, TotalAvailableQuantity; }> = [];
  FilteredMedicineList: Array<{ MedicineId, MedicineName, GenericId, Dosage, TotalAvailableQuantity; }> = [];


  constructor(
    private _clinicalBlService: ClinicalNoteBLService,
    private _coreService: CoreService,
    private _selectedPatientService: ClinicalPatientService,
    private _msgBoxServ: MessageboxService,
    private _clinicalService: ClinicalNoteService

  ) {
    this.ViewAvailableItemQuantityParameter();
    this.GetGenericNameList();
    this.LoadAllMedicationsItems();
  }
  ngOnInit() {
    if (this.Field) {
      this.IsAcrossVisitAvailability = this.Field.IsAcrossVisitAvailability;
    } else {
      this.IsAcrossVisitAvailability = false;
    }
    this.SelectedPatient = this._selectedPatientService.SelectedPatient;
    if (this.SelectedPatient && this.SelectedPatient.PatientId) {
      this.GetMedicationList(this.SelectedPatient.PatientId, this.SelectedPatient.PatientVisitId, this.IsAcrossVisitAvailability);
    }
    else {
      this.RequestedMedicationList = null;
    }
    this._clinicalService.RefreshMedicationList$.subscribe(() => {
      if (this.SelectedPatient && this.SelectedPatient.PatientId && this.SelectedPatient.PatientVisitId) {
        this.GetMedicationList(this.SelectedPatient.PatientId, this.SelectedPatient.PatientVisitId, this.IsAcrossVisitAvailability);
      }
    });
  }

  RequestMedication() {
    this.ShowMedicationAddBox = true;
  }
  ClosePopUp() {
    this.ShowMedicationAddBox = false;
    this.ShowMedicationUpdateBox = false;
  }
  CallBackAddUpdate() {
    this.GetMedicationList(this.SelectedPatient.PatientId, this.SelectedPatient.PatientVisitId, this.IsAcrossVisitAvailability);
    this.ClosePopUp();
  }
  GetMedicationList(PatientId: number, PatientVisitId: number, IsAcrossVisitAvailability: boolean) {
    this._clinicalBlService.GetMedicationList(PatientId, PatientVisitId, IsAcrossVisitAvailability)
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK && res.Results) {
          this.RequestedMedicationList = res.Results;
          this.FilterMedicationList();
        }
      },
        err => {
          console.log(err);
        }
      );
  }
  FilterMedicationList() {
    if (this.RequestedMedicationList && this.RequestedMedicationList.length > 0) {
      if (this.IsDischargeRequest) {
        this.FilteredMedicationList = this.RequestedMedicationList.filter(item => item.IsDischargeRequest);
      } else {
        this.FilteredMedicationList = this.RequestedMedicationList.filter(item => !item.IsDischargeRequest);
      }
    }
  }

  updateView(tabIndex: number) {
    this.ShowRequested = false;
    if (tabIndex === 0) {
      this.ShowRequested = true;
    }
  }
  GetGenericNameList() {
    this._clinicalBlService.GenericName().subscribe((res: DanpheHTTPResponse) => {
      if (res.Status === ENUM_DanpheHTTPResponses.OK) {
        this.GenericItems = res.Results;
      }
      else {
        this._msgBoxServ.showMessage[ENUM_MessageBox_Status.Failed, 'Unable to load Generic name list.'];
      }

    });
  }
  LoadAllMedicationsItems(): void {
    this._clinicalBlService.AllMedicationsItems().subscribe((res: DanpheHTTPResponse) => {
      if (res.Status == ENUM_DanpheHTTPResponses.OK) {
        this.AllMedicineList = [];
        if (res.Results && res.Results.length > 0) {
          if (this.ViewAvailableItemQuantity.DisplayItemStockDuringOrder && this.ViewAvailableItemQuantity.ShowZeroStockItem) {
            res.Results.forEach(a => {
              this.AllMedicineList.push({
                MedicineId: a.Item.ItemId,
                MedicineName: `${a.Item.ItemName} (Avl Qty: ${a.TotalAvailableQuantity})`,
                GenericId: a.Item.GenericId,
                Dosage: a.Item.Dosage,
                TotalAvailableQuantity: a.TotalAvailableQuantity
              });
            });
          }
          else if (this.ViewAvailableItemQuantity.DisplayItemStockDuringOrder && !this.ViewAvailableItemQuantity.ShowZeroStockItem) {
            res.Results.forEach(a => {
              if (a.TotalAvailableQuantity > 0) {
                this.AllMedicineList.push({
                  MedicineId: a.Item.ItemId,
                  MedicineName: `${a.Item.ItemName} (Avl Qty: ${a.TotalAvailableQuantity})`,
                  GenericId: a.Item.GenericId,
                  Dosage: a.Item.Dosage,
                  TotalAvailableQuantity: a.TotalAvailableQuantity

                });
              }
            });
          }
          else if (!this.ViewAvailableItemQuantity.DisplayItemStockDuringOrder && !this.ViewAvailableItemQuantity.ShowZeroStockItem) {
            res.Results.forEach(a => {
              if (a.TotalAvailableQuantity > 0) {
                this.AllMedicineList.push({
                  MedicineId: a.Item.ItemId,
                  MedicineName: a.Item.ItemName,
                  GenericId: a.Item.GenericId,
                  Dosage: a.Item.Dosage,
                  TotalAvailableQuantity: a.TotalAvailableQuantity
                });
              }
            });
          }
          else if (!this.ViewAvailableItemQuantity.DisplayItemStockDuringOrder && this.ViewAvailableItemQuantity.ShowZeroStockItem) {
            res.Results.forEach(a => {
              this.AllMedicineList.push({
                MedicineId: a.Item.ItemId,
                MedicineName: a.Item.ItemName,
                GenericId: a.Item.GenericId,
                Dosage: a.Item.Dosage,
                TotalAvailableQuantity: a.TotalAvailableQuantity
              });
            });

          }
        }
        this.FilteredMedicineList = this.AllMedicineList;
      }
      else {
        this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ['Failed to Load Medication List.'], res.ErrorMessage);
      }
    });
  }
  ViewAvailableItemQuantityParameter() {
    let Parameter = this._coreService.Parameters;
    let clinicalParam = Parameter.find(a => a.ParameterGroupName === "Clinical" && a.ParameterName === "ShowAvailableItemQuantity");
    if (clinicalParam) {
      this.ViewAvailableItemQuantity = JSON.parse(clinicalParam.ParameterValue);
    }
  }
  EditMedicationItem(selectedItem: Medication_DTO): void {
    if (selectedItem && selectedItem.IsAddedToPlan || selectedItem.OrderStatus !== Enum_PrescriptionOrderStatus.Active) {
      this.CheckEditValidation(selectedItem);
    }
    else {
      this.SelectedMedicineItem = selectedItem;
      this.ShowMedicationUpdateBox = !this.ShowMedicationUpdateBox;
    }
  } RemoveMedicationItem(selectedItem: Medication_DTO): void {
    if (!selectedItem || !selectedItem.PrescriptionItemId) {
      this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Warning, ['Invalid medication item selected.']);
      return;
    }
    if (selectedItem && selectedItem.IsAddedToPlan || selectedItem.OrderStatus !== Enum_PrescriptionOrderStatus.Active) {
      this.CheckRemoveValidation(selectedItem);
    }
    else {
      this._clinicalBlService.RemoveMedication(selectedItem.PrescriptionItemId).subscribe(
        (res: DanpheHTTPResponse) => {
          if (res.Status === ENUM_DanpheHTTPResponses.OK) {
            this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Success, ['Medication item removed successfully.']);
            this.GetMedicationList(this.SelectedPatient.PatientId, this.SelectedPatient.PatientVisitId, this.IsAcrossVisitAvailability);
          } else {
            this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ['Failed to remove medication item.']);
          }
        },
        (err) => {
          this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ['An unexpected error occurred. Please try again later.']);
        }
      );
    }
  }
  CheckEditValidation(selectedItem: Medication_DTO) {
    if (selectedItem.OrderStatus === Enum_PrescriptionOrderStatus.Discarded) {
      this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Notice, ['This item cannot be edited because it has been discarded by the dispensary..']);
    }
    else if (selectedItem.OrderStatus === Enum_PrescriptionOrderStatus.Final) {
      this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Notice, ['This item cannot be edited because it has been finalized and dispatched by the dispensary.']);
    }
    else if (selectedItem.OrderStatus === Enum_PrescriptionOrderStatus.Partial) {
      this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Notice, ['This item cannot be edited because it has been partially dispatched by the dispensary']);
    }
    else {
      this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Notice, ['This item cannot be edited as it is already included in the Cardex plan.']);
    }
  }
  CheckRemoveValidation(selectedItem: Medication_DTO) {
    if (selectedItem.OrderStatus === Enum_PrescriptionOrderStatus.Discarded) {
      this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Notice, ['This item cannot be removed because it has been discarded by the dispensary.']);
    }
    else if (selectedItem.OrderStatus === Enum_PrescriptionOrderStatus.Final) {
      this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Notice, ['This item cannot be removed because it has been finalized and dispatched by the dispensary.']);
    }
    else if (selectedItem.OrderStatus === Enum_PrescriptionOrderStatus.Partial) {
      this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Notice, ['This item cannot be removed because it has been partially dispatched by the dispensary.']);
    }
    else if (selectedItem.IsAddedToPlan) {
      this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Notice, ['This item cannot be removed as it is already part of a treatment plan (Cardex).']);
    }
    else {
      this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Notice, ['This item is not eligible for removal.']);
    }
  }
}
