import { Component, EventEmitter, Input, Output } from "@angular/core";
import { DanpheHTTPResponse } from "../../../../shared/common-models";
import { MessageboxService } from "../../../../shared/messagebox/messagebox.service";
import {
  ENUM_DanpheHTTPResponseText,
  ENUM_EscapeKey,
  ENUM_MessageBox_Status,
} from "../../../../shared/shared-enums";
import { ClinicalSettingsBLService } from "../../../shared/clinical-settings.bl.service";
import { ChiefComplain_DTO } from "../../../shared/dto/chief-complaint.dto";

@Component({
  selector: "add-chief-complains",
  templateUrl: "./add-chief-complains.component.html",
  host: { '(window:keydown)': 'hotkeys($event)' }
})
export class AddChiefComplainsComponent {
  PreviousComplaintName: string = '';
  @Output("callback-add")
  CallbackAdd: EventEmitter<Object> = new EventEmitter<Object>();
  @Output("callback-close")
  CallbackClose: EventEmitter<Object> = new EventEmitter<Object>();
  public isAddNewPriceCategory: boolean = true;
  @Input("chief-complain-to-edit")
  ChiefComplains: ChiefComplain_DTO = new ChiefComplain_DTO();
  CLNChiefComplain: ChiefComplain_DTO = new ChiefComplain_DTO();
  @Input("update")
  UpdateChiefComplain: boolean = false;
  ShowNewChiefComplainPage: boolean = false;
  @Input("show-Add-New-Page")
  public set value(val: boolean) {
    this.ShowNewChiefComplainPage = val;
    if (this.ChiefComplains && this.ChiefComplains.ChiefComplainId !== 0) {
      this.UpdateChiefComplain = true;

      this.CLNChiefComplain.chiefComplainValidator.patchValue({
        ChiefComplain: this.ChiefComplains.ChiefComplain,
        MedicalCode: this.ChiefComplains.MedicalCode,
        Remarks: this.ChiefComplains.Remarks,

      });
    } else {
      this.UpdateChiefComplain = false;
    }
  }
  constructor(
    public _clnSetblService: ClinicalSettingsBLService,
    public msgBoxServ: MessageboxService
  ) { }

  Close() {
    this.CLNChiefComplain = new ChiefComplain_DTO();
    this.CallbackAdd.emit({ action: "close", data: null });
  }

  public hotkeys(event: KeyboardEvent) {
    if (event.key === ENUM_EscapeKey.EscapeKey) {
      this.CLNChiefComplain = new ChiefComplain_DTO();
      this.CallbackAdd.emit({ action: "close", data: null });
    }
  }

  ngOnInit() { }
  AddChiefComplains() {
    for (let i in this.CLNChiefComplain.chiefComplainValidator.controls) {
      this.CLNChiefComplain.chiefComplainValidator.controls[i].markAsDirty();
      this.CLNChiefComplain.chiefComplainValidator.controls[
        i
      ].updateValueAndValidity();
    }

    if (this.CLNChiefComplain.IsValidCheck(undefined, undefined)) {
      let updatedValue = this.CLNChiefComplain.chiefComplainValidator.value;
      updatedValue.Remarks = this.CLNChiefComplain.chiefComplainValidator.get('Remarks').value;

      this._clnSetblService.AddChiefComplains(updatedValue).subscribe(
        (res: DanpheHTTPResponse) => {
          if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Success, [
              "Chief Complaint Added",
            ]);

            this.CLNChiefComplain = new ChiefComplain_DTO();
          } else {
            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, [res.ErrorMessage]);
          }

        },
        (err: any) => {
          if (err.error.ErrorMessage) {
            const errorMessage = err.error.ErrorMessage;
            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, [errorMessage]);
          } else {
            console.error('Error occurred during HTTP request:', err);
          }
        });

    } else {
      this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, [
        "some data are invalid.",
      ]);
    }
  }
  logError(err: any) {
    console.log(err);
  }
  GenerateMedicalCode() {
    const complaintName = this.CLNChiefComplain.chiefComplainValidator.value.ChiefComplain;
    if (complaintName && complaintName !== this.PreviousComplaintName) {
      const prefix = complaintName.substring(0, 3).toUpperCase();
      const randomNumber = Math.floor(Math.random() * 9000) + 1000;
      this.CLNChiefComplain.chiefComplainValidator.patchValue({
        MedicalCode: `${prefix}${randomNumber}`,
      });

      this.PreviousComplaintName = complaintName;
    }
  }
  OnComplaintNameChange() {
    if (this.CLNChiefComplain.chiefComplainValidator.dirty) {
      this.GenerateMedicalCode();
    }
  }



  UpdateChiefComplains() {
    for (let i in this.CLNChiefComplain.chiefComplainValidator.controls) {
      this.CLNChiefComplain.chiefComplainValidator.controls[i].markAsDirty();
      this.CLNChiefComplain.chiefComplainValidator.controls[i].updateValueAndValidity();
    }

    if (this.CLNChiefComplain.IsValidCheck(undefined, undefined)) {

      let updatedValue = this.CLNChiefComplain.chiefComplainValidator.value;
      updatedValue.ChiefComplainId = this.ChiefComplains.ChiefComplainId;
      updatedValue.Remarks = this.CLNChiefComplain.chiefComplainValidator.get('Remarks').value;

      this._clnSetblService
        .UpdateChiefComplains(updatedValue)
        .subscribe((res: DanpheHTTPResponse) => {
          if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Success, [
              "Updated.",
            ]);
          } else {
            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, [
              "failed to update",
            ]);
            this.SetFocusById("ChiefComplain_DTO");
          }
        });

    }
  }


  public SetFocusById(id: string) {
    window.setTimeout(function () {
      let elementToBeFocused = document.getElementById(id);
      if (elementToBeFocused) {
        elementToBeFocused.focus();
      }
    }, 200);
  }
}
