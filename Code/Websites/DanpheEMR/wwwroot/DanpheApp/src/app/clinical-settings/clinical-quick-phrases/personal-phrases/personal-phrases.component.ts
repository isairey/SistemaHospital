import { ChangeDetectorRef, Component, ViewChild } from "@angular/core";
import { ClinicalService } from "../../../clinical-new/shared/clinical.service";
import { CoreService } from "../../../core/shared/core.service";
import { SecurityService } from "../../../security/shared/security.service";
import { DanpheHTTPResponse } from "../../../shared/common-models";
import { GridEmitModel } from "../../../shared/danphe-grid/grid-emit.model";
import { SettingsGridColumnSettings } from "../../../shared/danphe-grid/settings-grid-column-settings";
import { DanpheSummernoteComponent } from "../../../shared/danphe-summer-note/danphe-summernote.component";
import { MessageboxService } from "../../../shared/messagebox/messagebox.service";
import { ENUM_ClinicalPhrases_EditorType, ENUM_DanpheHTTPResponses, ENUM_EscapeKey, ENUM_MessageBox_Status, ENUM_PhrasesAccessibility } from "../../../shared/shared-enums";
import { ClinicalSettingsBLService } from "../../shared/clinical-settings.bl.service";
import { PersonalPhrases_DTO } from "../../shared/dto/clinical-personal-phrases.dto";
import { PersonalPhrases } from "../../shared/dto/clinical-personal-phrases.model";

@Component({
    selector: 'personal-phrases',
    templateUrl: './personal-phrases.component.html',
    host: { '(window:keydown)': 'Hotkeys($event)' }
})

export class PersonalPhrasesComponent {
    @ViewChild(DanpheSummernoteComponent) Summernote: DanpheSummernoteComponent;
    EditorOptions = Object.values(ENUM_ClinicalPhrases_EditorType);
    PhrasesAccessibility = Object.values(ENUM_PhrasesAccessibility);
    public ShowGrid: boolean = true;
    public ShowAddEditPage: boolean = false;
    public IsUpdate: boolean = false;
    public ShowSummerNoteGrid: boolean = false;
    public IsValidTemplate: boolean = true;
    Phrases: PersonalPhrases = new PersonalPhrases()
    SelectedPhrase = new PersonalPhrases();

    PersonalPhrase_DTO: PersonalPhrases_DTO = new PersonalPhrases_DTO();
    CurrentPhrase: PersonalPhrases = new PersonalPhrases()
    PersonalPhrasesGridColumns: typeof SettingsGridColumnSettings.prototype.ClinicalPersonalPhrasesGrid;
    public SetCLNHeadingGridColumns: SettingsGridColumnSettings = null;
    PhrasesList = new Array<PersonalPhrases>();
    constructor(
        private _clnSetblService: ClinicalSettingsBLService,
        private _msgBoxServ: MessageboxService,
        public coreService: CoreService,
        public changeDetector: ChangeDetectorRef,
        public securityService: SecurityService,
        private _clinicalService: ClinicalService
    ) {
        this.SetCLNHeadingGridColumns = new SettingsGridColumnSettings(this.coreService.taxLabel, this.securityService);
        this.PersonalPhrasesGridColumns = this.SetCLNHeadingGridColumns.ClinicalPersonalPhrasesGrid;
        this.GetClinicalPersonalPhrases();
    }

    AddPhrases() {
        try {

            this.ShowAddEditPage = true;
            this.IsUpdate = false;
            this.Phrases = new PersonalPhrases()
        } catch (exception) {
            this.ShowCatchErrMessage(exception);
        }
    }

    ClinicalPersonalPhrasesGridActions($event: GridEmitModel) {
        switch ($event.Action) {
            case "edit": {
                this.IsUpdate = true;
                this.PersonalPhrase_DTO = null;
                this.ShowAddEditPage = false;
                this.changeDetector.detectChanges();
                this.PersonalPhrase_DTO = $event.Data;
                if (this.Phrases) {
                    this.ShowAddEditPage = true;
                    this.Phrases.ClinicalMyPhrasesValidator.patchValue({
                        TemplateName: this.PersonalPhrase_DTO.TemplateName,
                        TemplateCode: this.PersonalPhrase_DTO.TemplateCode,
                        TemplateType: this.PersonalPhrase_DTO.TemplateType,
                        TemplateGroup: this.PersonalPhrase_DTO.TemplateGroup,
                        TemplateAccessibility: this.PersonalPhrase_DTO.TemplateAccessibility
                    });
                    this.Phrases.TemplateContent = this.PersonalPhrase_DTO.TemplateContent;
                    this.OnEditorOptionChange(this.PersonalPhrase_DTO.TemplateType);
                }
                break;
            }
            case "activateClinicalTemplateSetting":
            case "deactivateClinicalTemplateSetting": {
                this.SelectedPhrase = $event.Data;
                this.ActivateDeactivatePersonalPhrases(this.SelectedPhrase);
                break;
            }
            default:
                break;
        }
    }
    Close() {
        try {
            this.ShowAddEditPage = false;
            this.IsUpdate = false;
            this.Phrases = new PersonalPhrases();
            this.ShowSummerNoteGrid = false;
        } catch (exception) {
            this.ShowCatchErrMessage(exception);
        }
    }
    ShowCatchErrMessage(exception) {
        if (exception) {
            let ex: Error = exception;
            this._msgBoxServ.showMessage(ENUM_DanpheHTTPResponses.Failed, ["Check error in Console log !"]);
            console.error(ex);
        }
    }
    OnEditorOptionChange(option: string) {
        if (option === ENUM_ClinicalPhrases_EditorType.Editor) {
            this.ShowSummerNoteGrid = true;
        } else if (option === ENUM_ClinicalPhrases_EditorType.SimpleText) {
            this.ShowSummerNoteGrid = false;
        }
    }
    AddPersonalPhrases() {
        try {
            if (this.IsValidModelCheck()) {
                const templateData = this.Phrases.ClinicalMyPhrasesValidator.value;
                if (this.Phrases.TemplateContent && this._clinicalService.CheckValidContent(this.Phrases.TemplateContent)) {
                    const templatePayload = {
                        ...templateData,
                        TemplateContent: this.Phrases.TemplateContent,

                    };
                    if (this.CheckForDuplicateTemplates(templatePayload)) {
                        return;
                    }
                    this._clnSetblService.AddNewPhrases(templatePayload)
                        .subscribe((res: DanpheHTTPResponse) => {
                            if (res.Status === ENUM_DanpheHTTPResponses.OK) {
                                this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Success, [
                                    "Template added successfully.",
                                ]);
                                this.GetClinicalPersonalPhrases();
                                this.Phrases.ClinicalMyPhrasesValidator.markAsPristine();
                                this.Phrases.ClinicalMyPhrasesValidator.markAsUntouched();
                                this.Phrases.ClinicalMyPhrasesValidator.patchValue({
                                    TemplateName: '',
                                    TemplateCode: ''
                                });
                                this.Phrases.TemplateContent = '';
                                this.Summernote.ResetContent();
                            }
                            else {
                                this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, [res.ErrorMessage]);
                            }
                        },

                            (err: any) => {
                                if (err && err.error && err.error.ErrorMessage) {
                                    const errorMessage = err.error.ErrorMessage;
                                    this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, [errorMessage]);
                                } else {
                                    console.error('Error occurred during HTTP request:', err);
                                }
                            });
                } else {
                    this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ["Please Add Field Content Correctly."]);
                }
            }
            else {
                this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ["Please Add Mandatory Field Correctly."]);
            }
        } catch (exception) {
            this.ShowCatchErrMessage(exception);
        }
    }
    UpdatePersonalPhrases() {
        try {
            if (this.IsValidModelCheck()) {
                const templateData = this.Phrases.ClinicalMyPhrasesValidator.value
                if (this.Phrases.TemplateContent && this._clinicalService.CheckValidContent(this.Phrases.TemplateContent)) {

                    const templatePayload = {
                        ...templateData,
                        TemplateContent: this.Phrases.TemplateContent,
                        PredefinedTemplateId: this.PersonalPhrase_DTO.PredefinedTemplateId,
                    };
                    if (this.CheckForDuplicateTemplates(templatePayload)) {
                        return;
                    }
                    this._clnSetblService.UpdateClinicalPhrases(templatePayload)
                        .subscribe((res: DanpheHTTPResponse) => {
                            if (res.Status === ENUM_DanpheHTTPResponses.OK) {

                                this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Success, [
                                    "Updated Successfully.",
                                ]);
                                this.GetClinicalPersonalPhrases();
                                this.Phrases.ClinicalMyPhrasesValidator.markAsPristine();
                                this.Phrases.ClinicalMyPhrasesValidator.markAsUntouched();
                            }
                        },
                            err => this.logError(err));
                } else {
                    this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ["Please Add Field Content Correctly."]);
                }
            }
            else {
                this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ["Please Add Mandatory Fields Correctly."]);
            }
        } catch (exception) {
            this.ShowCatchErrMessage(exception);
        }
    }

    IsValidModelCheck(): boolean {
        try {
            //marking every fields as dirty and checking validity
            for (var i in this.Phrases.ClinicalMyPhrasesValidator.controls) {
                this.Phrases.ClinicalMyPhrasesValidator.controls[i].markAsDirty();
                this.Phrases.ClinicalMyPhrasesValidator.controls[i].updateValueAndValidity();
            }
            if ((this.Phrases.IsValidCheck(undefined, undefined) == true) && this.Phrases.TemplateContent.length > 0) {
                this.IsValidTemplate = true;
                return true;
            } else {
                if (this.Phrases.TemplateContent.length <= 0) {
                    this.IsValidTemplate = false;
                }
                return false;
            }
        } catch (exception) {
            this.ShowCatchErrMessage(exception);
        }
    }

    GetClinicalPersonalPhrases() {
        this._clnSetblService.GetClinicalPhrases()
            .subscribe((res: DanpheHTTPResponse) => {
                if (res.Status === ENUM_DanpheHTTPResponses.OK) {
                    this.PhrasesList = res.Results;
                    this.ShowGrid = true;
                }
                else {
                    console.error(res.ErrorMessage);
                }

            });
    }

    ActivateDeactivatePersonalPhrases(selectedItem: PersonalPhrases) {

        const message = selectedItem.IsActive ? "Are you sure you want to deactivate this Phrase?" : "Are you sure you want to activate this Phrase?";
        if (window.confirm(message)) {
            this._clnSetblService
                .ClinicalPhrasesActivation(selectedItem)
                .subscribe((res: DanpheHTTPResponse) => {
                    if (res.Status === ENUM_DanpheHTTPResponses.OK) {
                        this.GetClinicalPersonalPhrases();
                        this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Success, ['clinical Phrase Status updated successfully']);
                    } else {
                        this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ["failed to Change status",]);
                    }
                });
        }
    }

    OnChangeEditorData(data) {
        try {
            this.Phrases.TemplateContent = data;
        } catch (exception) {
            this.ShowCatchErrMessage(exception);
        }
    }
    logError(err: any) {
        console.error(err);
        this._msgBoxServ.showMessage(ENUM_DanpheHTTPResponses.Failed, [err]);
    }

    Hotkeys(event: KeyboardEvent) {
        if (event.key === ENUM_EscapeKey.EscapeKey) {
            if (this.ShowAddEditPage) {
                this.Close();
            }
        }
    }

    CheckForDuplicateTemplates(templatePayload): boolean {
        const isDuplicateCode = this.PhrasesList.some(template =>
            template.TemplateCode.toLocaleLowerCase() === templatePayload.TemplateCode.toLocaleLowerCase() &&
            template.PredefinedTemplateId !== templatePayload.PredefinedTemplateId
        );
        const isDuplicateName = this.PhrasesList.some(template =>
            template.TemplateName.toLocaleLowerCase() === templatePayload.TemplateName.toLocaleLowerCase() &&
            template.PredefinedTemplateId !== templatePayload.PredefinedTemplateId
        );

        if (isDuplicateName) {
            this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, [
                `TemplateName "${templatePayload.TemplateName}" is already present.`,
            ]);
            return true;
        }

        if (isDuplicateCode) {
            this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, [
                `TemplateCode "${templatePayload.TemplateCode}" is already present.`,
            ]);
            return true;
        }

        return false;
    }
}