import { ChangeDetectorRef, Component } from "@angular/core";
import { DanpheHTTPResponse } from "../../../shared/common-models";
import { GridEmitModel } from "../../../shared/danphe-grid/grid-emit.model";
import { MessageboxService } from "../../../shared/messagebox/messagebox.service";
import { ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status } from "../../../shared/shared-enums";
import { ClinicalNotes_DTO } from "../../shared/DTOs/clinical-notes.dto";
import { SettingsService } from '../../shared/settings-service';
import { SettingsBLService } from '../../shared/settings.bl.service';

@Component({
    selector: "clinical-note-list",
    templateUrl: "./clinical-note-list.html"
})

export class ClinicalNoteListComponent {
    public showRxnAddPage: boolean = false;
    public showAllClinicalNoteList: boolean = false;
    public clinicalNoteGridColumns: Array<any> = null;
    public clinicalNoteList: Array<ClinicalNotes_DTO> = new Array<ClinicalNotes_DTO>();
    public selectedID: null;
    public clinicalNotes: ClinicalNotes_DTO = new ClinicalNotes_DTO();
    public selectedclinicalNote: ClinicalNotes_DTO;
    public Update: boolean = false;
    public cancel: boolean = false;
    constructor(
        public settingsServ: SettingsService,
        public settingBlServ: SettingsBLService,
        public msgBoxServ: MessageboxService,
        public changeDetector: ChangeDetectorRef) {
        this.clinicalNoteGridColumns = this.settingsServ.settingsGridCols.ClinicalNoteList;
        this.getClinicalNoteList();
    }



    getClinicalNoteList() {
        this.settingBlServ.clinicalNoteList()
            .subscribe(res => {
                if (res.Status == 'OK') {
                    this.clinicalNoteList = res.Results;
                }
            });
        this.showAllClinicalNoteList = true;
    }

    ClinicalNoteGridActions($event: GridEmitModel) {

        switch ($event.Action) {
            case "edit": {
                this.clinicalNotes.ClinicalNoteValidator.reset();
                this.selectedID = $event.Data.ClinicalNoteMasterId;
                this.changeDetector.detectChanges();
                this.clinicalNotes = Object.assign(this.clinicalNotes, $event.Data);
                this.Update = true;
                this.cancel = true;
            }
            default:
                break;
        }
    }

    ShowAddReaction() {
        this.showRxnAddPage = false;
        this.changeDetector.detectChanges();
        this.showRxnAddPage = true;
    }

    CallBackAdd($event) {
        this.clinicalNoteList.push($event.reaction);
        if (this.selectedID != null) {

            let i = this.clinicalNoteList.findIndex(a => a.ClinicalNoteMasterId == this.selectedID);
            this.clinicalNoteList.splice(i, 1);
        }
        this.clinicalNoteList = this.clinicalNoteList.slice();
        this.changeDetector.detectChanges();
        this.showRxnAddPage = false;
        this.selectedclinicalNote = null;
        this.selectedID = null;
    }
    public SetFocusById(id: string) {
        window.setTimeout(function () {
            let elementToBeFocused = document.getElementById(id);
            if (elementToBeFocused) {
                elementToBeFocused.focus();
            }
        }, 600);
    }
    public AddClinicalNote() {
        for (var i in this.clinicalNotes.ClinicalNoteValidator.controls) {
            this.clinicalNotes.ClinicalNoteValidator.controls[i].markAsDirty();
            this.clinicalNotes.ClinicalNoteValidator.controls[i].updateValueAndValidity();
            this.SetFocusById('DisplayName');
        }

        if (this.clinicalNotes.IsValidCheck(undefined, undefined)) {
            this.settingBlServ.AddClinicalNote(this.clinicalNotes)
                .subscribe((res: DanpheHTTPResponse) => {
                    if (res.Status == ENUM_DanpheHTTPResponses.OK) {
                        this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Success, ["Saved successfully"]);
                        this.getClinicalNoteList();
                        this.ResetForm();
                    } else {
                        this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ["failed to save successfully"]);
                        this.logError(res.ErrorMessage);
                        this.SetFocusById('DisplayName');
                    }

                },
                    err => {
                        this.logError(err);
                    });
        }
    }
    logError(err: any) {
        console.log(err);
    }
    ResetForm() {
        this.clinicalNotes.ClinicalNoteValidator.reset();
        this.clinicalNotes.DisplayName = '';
        this.clinicalNotes.FieldName = '';
        this.clinicalNotes.DisplayOrder = 0;
    }
    ClearClinicalNote() {
        this.ResetForm();
    }
    UpdateClinicalNote() {
        for (var i in this.clinicalNotes.ClinicalNoteValidator.controls) {
            this.clinicalNotes.ClinicalNoteValidator.controls[i].markAsDirty();
            this.clinicalNotes.ClinicalNoteValidator.controls[i].updateValueAndValidity();
            this.SetFocusById('DisplayName');
        }

        if (this.clinicalNotes.IsValidCheck(undefined, undefined)) {
            this.settingBlServ.UpdateClinicalNote(this.clinicalNotes)
                .subscribe((res: DanpheHTTPResponse) => {
                    if (res.Status == ENUM_DanpheHTTPResponses.OK) {
                        this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Success, ["Updated successfully"]);
                        this.getClinicalNoteList();
                        this.ResetForm();
                        this.Update = false;
                    } else {
                        this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ["failed to Update successfully"]);
                        this.logError(res.ErrorMessage);
                        this.SetFocusById('DisplayName');
                    }

                },
                    err => {
                        this.logError(err);
                    });
        }
    }
    CancelUpdateClinicalNote() {
        this.Update = false;
        this.ResetForm();
    }
}
