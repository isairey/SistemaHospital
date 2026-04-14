import { Component, EventEmitter, Input, OnInit, Output, SimpleChanges } from '@angular/core';
import { ClinicalSettingsBLService } from '../../../../clinical-settings/shared/clinical-settings.bl.service';
import { ClinicalMasterNotes_DTO } from '../../../../clinical-settings/shared/dto/clinical-master-notes.dto';
import { CoreService } from '../../../../core/shared/core.service';
import { DanpheHTTPResponse } from '../../../../shared/common-models';
import { MessageboxService } from '../../../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponseText, ENUM_EscapeKey, ENUM_MessageBox_Status } from '../../../../shared/shared-enums';
import { ClinicalNoteInfo } from '../../../shared/dto/clinical-note-info.dto';

@Component({
  selector: 'add-update-clinical-notes',
  templateUrl: './add-update-clinical-notes.component.html',
  host: { '(window:keydown)': 'hotkeys($event)' }
})
export class AddUpdateClinicalNotesComponent implements OnInit {
  @Output("callback-add")
  CallbackAdd: EventEmitter<Object> = new EventEmitter<Object>();
  @Input("Clinical-Master-Notes")
  CLNMasterNotes = new ClinicalMasterNotes_DTO();
  @Input("update")
  UpdateClinicalNotes: boolean = false;
  @Input("show-Add-New-Page")
  ShowNewClinicalNotesPage: boolean = false;
  @Input("clinical-notes-info")
  ClinicalNotesInfo: Array<ClinicalNoteInfo> = new Array<ClinicalNoteInfo>();
  ClinicalMasterNotes = new ClinicalMasterNotes_DTO();

  constructor(
    private _clnSetblService: ClinicalSettingsBLService,
    private msgBoxServ: MessageboxService,
    public coreService: CoreService,

  ) { }

  ngOnInit() {

  }
  ngOnChanges(changes: SimpleChanges) {
    if (changes['CLNMasterNotes']) {
      this.SetValue();

    }
    if (changes['ClinicalNotesInfo']) {
      this.SetClinicalNotesInfo();
    }

  }
  SetClinicalNotesInfo() {
    this.ClinicalMasterNotes.ClinicalNotesInfo = this.ClinicalNotesInfo;
  }

  Close() {
    this.ClinicalMasterNotes = new ClinicalMasterNotes_DTO();
    this.CallbackAdd.emit({ action: "close", data: null });
  }
  /**
 * @summary Adds a new clinical note by sending data to the server.
 * Validates the form before making the request.
 */
  AddClinicalMasterNotes(): void {
    for (let i in this.ClinicalMasterNotes.ClinicalNotesValidator.controls) {
      this.ClinicalMasterNotes.ClinicalNotesValidator.controls[i].markAsDirty();
      this.ClinicalMasterNotes.ClinicalNotesValidator.controls[
        i
      ].updateValueAndValidity();
    }

    if (this.ClinicalMasterNotes.IsValidCheck(undefined, undefined)) {
      let updatedValue = this.ClinicalMasterNotes.ClinicalNotesValidator.value;

      this._clnSetblService.AddClinicalMasterNotes(updatedValue).subscribe(
        (res: DanpheHTTPResponse) => {
          if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Success, [
              "Clinical Notes Added",
            ]);

            this.ClinicalMasterNotes = new ClinicalMasterNotes_DTO();
          } else {
            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, [
              "failed to and or update clinical notes mapping",
            ]);
          }

        },
      );


    }
  }

  SetValue() {
    if (this.CLNMasterNotes && this.CLNMasterNotes.ClinicalNotesMasterId !== 0) {
      this.ClinicalMasterNotes.ClinicalNotesMasterId = this.CLNMasterNotes.ClinicalNotesMasterId;
      this.ClinicalMasterNotes.ClinicalNotesValidator.patchValue({
        ClinicalNotesName: this.CLNMasterNotes.ClinicalNotesName,
        ClinicalNotesCode: this.CLNMasterNotes.ClinicalNotesCode,
        DisplaySequence: this.CLNMasterNotes.DisplaySequence,
        IsDefault: this.CLNMasterNotes.IsDefault,

      });
    }
  }
  /**
 * @summary Updates an existing clinical note by sending updated data to the server.
 * Validates the form before making the request.
 */
  UpdateClinicalMasterNotes(): void {
    for (let i in this.ClinicalMasterNotes.ClinicalNotesValidator.controls) {
      this.ClinicalMasterNotes.ClinicalNotesValidator.controls[i].markAsDirty();
      this.ClinicalMasterNotes.ClinicalNotesValidator.controls[i].updateValueAndValidity();
    }

    if (this.ClinicalMasterNotes.IsValidCheck(undefined, undefined)) {

      let updatedValue = this.ClinicalMasterNotes.ClinicalNotesValidator.value;
      updatedValue.ClinicalNotesMasterId = this.CLNMasterNotes.ClinicalNotesMasterId;

      this._clnSetblService
        .UpdateClinicalMasterNotes(updatedValue)
        .subscribe((res: DanpheHTTPResponse) => {
          if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Success, [
              " Clinical Notes Updated.",
            ]);
            this.ClinicalMasterNotes = new ClinicalMasterNotes_DTO();

          } else {
            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, [
              "failed to update the Clinical Notes",
            ]);
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
  public hotkeys(event: KeyboardEvent) {
    if (event.key === ENUM_EscapeKey.EscapeKey) {
      this.Close();
    }
  }
}
