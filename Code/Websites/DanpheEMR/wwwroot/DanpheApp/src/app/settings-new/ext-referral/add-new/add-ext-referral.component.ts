import { Component, EventEmitter, Input, Output, Renderer2 } from "@angular/core";
import { CoreService } from "../../../core/shared/core.service";
import { GeneralFieldLabels } from "../../../shared/DTOs/general-field-label.dto";
import { DanpheHTTPResponse } from "../../../shared/common-models";
import { MessageboxService } from "../../../shared/messagebox/messagebox.service";
import { ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status } from "../../../shared/shared-enums";
import { ExternalReferralModel } from "../../shared/external-referral.model";
import { SettingsService } from "../../shared/settings-service";
import { SettingsBLService } from "../../shared/settings.bl.service";

@Component({
  selector: "ext-referral-add",
  templateUrl: "./add-ext-referral.html",
  host: { '(window:keydown)': 'hotkeys($event)' }
})

export class AddExternalReferralComponent {

  @Input('ref-to-edit') SelRefToEdit: ExternalReferralModel = null;
  @Output("callback-add") CallBackAddReferral = new EventEmitter<Object>();
  CompleteExternalRefList = new Array<ExternalReferralModel>();
  ExternalRefList = new Array<ExternalReferralModel>();
  ExternalRef = new ExternalReferralModel();
  ESCAPE_KEYCODE: number = 27;//to close the window on click of ESCape.
  GlobalListenFunc: Function;
  IsAddNewRef: boolean = true;

  public GeneralFieldLabel = new GeneralFieldLabels();


  constructor(public settingsServ: SettingsService, public _settingsBlService: SettingsBLService, public coreService: CoreService,
    public _messageBoxService: MessageboxService, public renderer: Renderer2) {
    this.GeneralFieldLabel = coreService.GetFieldLabelParameter();
    let abc = 0;
    this.GeneralFieldLabel = coreService.GetFieldLabelParameter();
    this.SetFocusById('referrerName');
    this.GlobalListenFunc = this.renderer.listen('document', 'keydown', e => {
      if (e.keyCode == this.ESCAPE_KEYCODE) {
        this.CloseAddReferralPage();
      }
    });
  }
  s
  ngOnInit() {
    //this is case for edit.
    if (this.SelRefToEdit && this.SelRefToEdit.ExternalReferrerId) {

      this.ExternalRef = Object.assign(new ExternalReferralModel(), this.SelRefToEdit);
      this.IsAddNewRef = false;
    }
    else {
      this.IsAddNewRef = true;
    }
  }

  AddReferral(): void {
    for (var i in this.ExternalRef.ExternalRefValidator.controls) {
      this.ExternalRef.ExternalRefValidator.controls[i].markAsDirty();
      this.ExternalRef.ExternalRefValidator.controls[i].updateValueAndValidity();
    }
    if (this.ExternalRef.IsValidCheck(undefined, undefined)) {
      this._settingsBlService.AddExtReferrer(this.ExternalRef)
        .subscribe((res: DanpheHTTPResponse): void => {
          if (res.Status === ENUM_DanpheHTTPResponses.OK) {
            this.CallBackAddReferral.emit({ action: "add", data: res.Results });
            this.ExternalRef = new ExternalReferralModel();
            this._messageBoxService.showMessage(ENUM_MessageBox_Status.Success, ["New External Referral Added Successfully."]);
          }
          else {
            this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, [`${res.ErrorMessage}`]);
            this.SetFocusById('referrerName');
          }
        });
    }
    else {
      this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ["some data are invalid."]);
    }
  }

  UpdateReferral(): void {
    for (var i in this.ExternalRef.ExternalRefValidator.controls) {
      this.ExternalRef.ExternalRefValidator.controls[i].markAsDirty();
      this.ExternalRef.ExternalRefValidator.controls[i].updateValueAndValidity();
    }
    if (this.ExternalRef.IsValidCheck(undefined, undefined)) {
      this._settingsBlService.UpdateExtReferrer(this.ExternalRef)
        .subscribe((res: DanpheHTTPResponse) => {
          if (res.Status === ENUM_DanpheHTTPResponses.OK) {
            this.CallBackAddReferral.emit({ action: "edit", data: res.Results });
            this.ExternalRef = new ExternalReferralModel();
            this._messageBoxService.showMessage(ENUM_MessageBox_Status.Success, ["External Referral Updated Successfully."]);
          }
          else {
            this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, [`${res.ErrorMessage}`]);
            this.SetFocusById('referrerName');
          }


        });
    }
    else {
      alert("some data are invalid");
    }
  }

  CloseAddReferralPage(): void {
    this.ExternalRef = new ExternalReferralModel();
    this.CallBackAddReferral.emit({ action: "close", data: null });
  }

  SetFocusById(id: string) {
    window.setTimeout(function () {
      let elementToBeFocused = document.getElementById(id);
      if (elementToBeFocused) {
        elementToBeFocused.focus();
      }
    }, 100);
  }

  hotkeys(event): void {
    if (event.keyCode === 27) {
      this.CloseAddReferralPage();
    }
  }
}
