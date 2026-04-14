import { ChangeDetectorRef, Component, EventEmitter, Input, Output } from "@angular/core";
import { PHRMGenericModel } from "../../../pharmacy/shared/phrm-generic.model";
import { DanpheHTTPResponse } from "../../../shared/common-models";
import { MessageboxService } from '../../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponseText, ENUM_Data_Type, ENUM_MessageBox_Status } from "../../../shared/shared-enums";
import { ClinicalPatientService } from "../../shared/clinical-patient.service";
import { ClinicalNoteBLService } from "../../shared/clinical.bl.service";
import { PatientDetails_DTO } from "../../shared/dto/patient-cln-detail.dto";
import { ReactionList_DTO } from "../../shared/dto/reaction-list.dto";
import { Allergy } from "../../shared/model/allergy.model";

@Component({
  selector: "patient-allergy-add",
  templateUrl: "./allergy-add.component.html"
})

export class AllergyAddComponent {

  @Input("Selected-Allergy")
  CurrentAllergy: Allergy = new Allergy();
  ShowAllergyAddBox: boolean = false;
  AllergicGenList: Array<PHRMGenericModel> = new Array<PHRMGenericModel>();
  AllerGenSelected: PHRMGenericModel = new PHRMGenericModel();
  SelectedReaction = new ReactionList_DTO();
  ReactionList: Array<ReactionList_DTO> = new Array<ReactionList_DTO>();
  ShowValidationMsg: boolean = false;
  Loading: boolean = false;
  @Output("Callback-AddUpdate")
  CallBackAddUpdate: EventEmitter<Object> = new EventEmitter<Object>();
  SelectedPatient = new PatientDetails_DTO();
  SelectedReactionList = new Array<ReactionList_DTO>();
  SelectedReactionName: string = '';

  constructor(
    private _selectedPatientService: ClinicalPatientService,
    private _clinicalNoteBLService: ClinicalNoteBLService,
    public msgBoxServ: MessageboxService,
    public changeDetector: ChangeDetectorRef) {
    this.SelectedPatient = this._selectedPatientService.SelectedPatient;
    this.Initialize();
    this.GetReactionList();
    this.GetMedicineList();
  }
  @Input("ShowAllergyAddBox")
  public set viewpage(_viewpage: boolean) {
    if (_viewpage) {
      if (this.CurrentAllergy && this.CurrentAllergy.PatientAllergyId) {
        let currentallergy = new Allergy();
        currentallergy = Object.assign(currentallergy, this.CurrentAllergy);
        this.Initialize();
        this.CurrentAllergy = currentallergy;
        this.MapSelectedReaction();
        this.MapSelectedAllergen();
      }
      else {
        this.Initialize();
      }
    }
    this.ShowAllergyAddBox = _viewpage;
  }
  public Initialize(): void {
    this.CurrentAllergy = new Allergy();
    this.CurrentAllergy.PatientId = this.SelectedPatient.PatientId;
    this.SelectedReaction = null;
    this.AllerGenSelected = null;
    this.ShowValidationMsg = false;
  }

  /**
   *@summary This method Retrieves a list of medicines categorized as allergens from the clinical service.
 * Filters the retrieved results to populate the component's AllergicGenList property
   */
  GetMedicineList(): void {
    this._clinicalNoteBLService.GetPhrmGenericList()
      .subscribe(
        (res: DanpheHTTPResponse) => {
          if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
            if (res.Results) {
              this.AllergicGenList = res.Results.filter(dt => dt.IsActive === true);
            }
            else {
              this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Notice, ['No Data Found! For Medicine List']);
            }
          } else {
            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, ['Failed to get Medicine List, check log for details']);

          }
        });
  }

  /**
  *@summary This method Retrieves a list of medicines categorized as allergens from the clinical service.
  */
  GetReactionList(): void {
    this._clinicalNoteBLService.GetReactionList()
      .subscribe(
        (res: DanpheHTTPResponse) => {
          if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
            if (res.Results) {
              this.ReactionList = res.Results;
            }
            else {
              this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Notice, ['No Data Found! For Reaction List']);
            }
          } else {
            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, [
              "Failed to get Reaction List, check log for details'",
            ]);

          }
        });
  }


  public OnReactionSelected(event: ReactionList_DTO): void {
    if (event && event.ReactionName) {
      this.SelectedReaction = event;
      const alreadyExists = this.SelectedReactionList.some(
        reaction => reaction.ReactionName === this.SelectedReaction.ReactionName
      );
      if (!alreadyExists) {
        this.SelectedReactionList.push(this.SelectedReaction);
        this.SelectedReactionName = '';
        this.CurrentAllergy.Reaction = this.SelectedReactionList
          .map(reaction => reaction.ReactionName)
          .join(', ');
      }
    }
  }





  public RemoveReaction(index: number): void {
    this.SelectedReactionList.splice(index, 1);
  }



  AllergyTypeOnChange(): void {
    if (this.CurrentAllergy.AllergyType == "Others") {
      this.AllerGenSelected = null;
      this.CurrentAllergy.AllergenAdvRecName = null;
      this.CurrentAllergy.AllergenAdvRecId = null;
    }

  }
  public ValidationCheck(): boolean {
    for (let i in this.CurrentAllergy.AllergyValidator.controls) {
      this.CurrentAllergy.AllergyValidator.controls[i].markAsDirty();
      this.CurrentAllergy.AllergyValidator.controls[i].updateValueAndValidity();
    }
    if (this.SelectedReactionList.length === 0) {
      this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ["Please select at least one reaction."]);
      return false;
    }
    this.IsDirtyAllergen();
    if ((this.CurrentAllergy.AllergenAdvRecName || this.CurrentAllergy.AllergenAdvRecId)
      && this.CheckSelectedReaciton()
      && this.CurrentAllergy.IsValidCheck(undefined, undefined)) {
      return true;
    }
    else
      return false;

  }
  public SubmitForm(): void {
    if (!this.Loading && this.ValidationCheck()) {
      this.Loading = true;
      if (this.CurrentAllergy.PatientAllergyId) {
        this.UpdateAllergy();
      }
      else {
        this.AddAllergy();
      }
    }
  }

  IsDirtyAllergen(): void {
    if (this.AllerGenSelected || this.CurrentAllergy.AllergenAdvRecName)
      this.ShowValidationMsg = false;
    else
      this.ShowValidationMsg = true;
  }



  /**
   * @summary Adds a new allergy for the patient and handles success/error messages.
  */
  AddAllergy(): void {
    this._clinicalNoteBLService.AddPatientAllergy(this.CurrentAllergy)
      .subscribe(
        (res: DanpheHTTPResponse) => {
          this.Loading = false;
          if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
            this.CloseAllergyAddBox(res.Results);
            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Success, [
              "Allergy Added successfully",
            ]);
          }
          else {
            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, [
              "Allergy Not Added",
            ]);
          }
        },
        err => { this.msgBoxServ.showMessage("error", [err]); });

  }


  /**
   * @summary Updates an existing allergy for the patient and handles success/error messages.
    */
  public UpdateAllergy(): void {
    this._clinicalNoteBLService.UpdatePatientAllergy(this.CurrentAllergy)
      .subscribe(
        (res: DanpheHTTPResponse) => {
          this.Loading = false;
          if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
            this.SelectedReactionList = [];
            this.SelectedReactionName = '';
            this.CurrentAllergy.Reaction = '';
            this.CloseAllergyAddBox(res.Results);
            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Success, [
              "Allergy Updated successfully",
            ]);

          }

          else {
            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, [
              "Allergy Not Updated",
            ]);
          }
        });
  }

  CloseAllergyAddBox(_allergy = null) {
    this.SelectedReactionList = [];
    this.SelectedReactionName = '';
    this.CurrentAllergy.Reaction = '';
    this.ShowAllergyAddBox = false;
    this.CallBackAddUpdate.emit({ "allergy": _allergy });
  }

  ReactionListFormatter(data: any): string {
    let html = data["ReactionCode"] + ' (' + data["ReactionName"] + ')';
    return html;
  }
  AllergenListFormatter(data: any): string {
    let html = data["GenericName"];
    return html;
  }
  public CheckSelectedReaciton(): boolean {
    if (typeof (this.SelectedReaction) != ENUM_Data_Type.Object) {
      this.SelectedReaction = undefined;
      this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ["Please select reaction from the list."]);
      return false;
    }
    return true;
  }
  public CheckAllergenSelected(): boolean {
    if (typeof (this.AllerGenSelected) != ENUM_Data_Type.Object) {
      this.AllerGenSelected = undefined;
      this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ["Please select allergen from the list."]);
      return false;
    }
    return true;
  }

  public AssignSelectedAllergen(): void {
    if (typeof (this.AllerGenSelected) == ENUM_Data_Type.Object) {
      this.CurrentAllergy.AllergenAdvRecName = this.AllerGenSelected.GenericName;
      this.CurrentAllergy.AllergenAdvRecId = this.AllerGenSelected.GenericId;
      this.ShowValidationMsg = false;
    }
  }
  public MapSelectedReaction(): void {
    if (this.CurrentAllergy.Reaction) {
      const reactionNames = this.CurrentAllergy.Reaction.split(',').map(r => r.trim());
      this.SelectedReactionList = reactionNames
        .map(name => this.ReactionList.find(reaction => reaction.ReactionName === name))
        .filter(reaction => reaction);
    } else {
      this.SelectedReactionList = [];
    }
  }




  public MapSelectedAllergen(): void {
    let allergen = this.AllergicGenList.find(a => a.GenericId == this.CurrentAllergy.AllergenAdvRecId);
    if (allergen)
      this.AllerGenSelected = allergen;
  }
}
