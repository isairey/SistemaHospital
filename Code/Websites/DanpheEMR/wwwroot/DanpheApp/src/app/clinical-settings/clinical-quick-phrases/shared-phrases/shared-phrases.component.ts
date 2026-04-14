import { ChangeDetectorRef, Component } from "@angular/core";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import { CoreService } from "../../../core/shared/core.service";
import { SecurityService } from "../../../security/shared/security.service";
import { DanpheHTTPResponse } from "../../../shared/common-models";
import { GridEmitModel } from "../../../shared/danphe-grid/grid-emit.model";
import { SettingsGridColumnSettings } from "../../../shared/danphe-grid/settings-grid-column-settings";
import { MessageboxService } from "../../../shared/messagebox/messagebox.service";
import { ENUM_DanpheHTTPResponses, ENUM_EscapeKey } from "../../../shared/shared-enums";
import { ClinicalSettingsBLService } from "../../shared/clinical-settings.bl.service";
import { PersonalPhrases } from "../../shared/dto/clinical-personal-phrases.model";
import { SharedPhrases_DTO } from "../../shared/dto/clinical-shared-phrases.dto";

@Component({
    selector: 'shared-phrases',
    templateUrl: './shared-phrases.component.html',
    host: { '(window:keydown)': 'Hotkeys($event)' }
})

export class SharedPhrasesComponent {
    SharedPhraseGridColumns: typeof SettingsGridColumnSettings.prototype.SharedPhraseGridColumns;
    public SetCLNHeadingGridColumns: SettingsGridColumnSettings = null;
    SharedPhrasesList = new Array<SharedPhrases_DTO>();
    SharedPhrase: SharedPhrases_DTO = new SharedPhrases_DTO();
    public ShowGrid: boolean = true;
    public ShowAddEditPage: boolean = false;

    public IsValidTemplate: boolean = true;
    Phrases: PersonalPhrases = new PersonalPhrases();
    SafeTemplateContent: SafeHtml = '';
    constructor(
        private _clnSetblService: ClinicalSettingsBLService,
        private _msgBoxServ: MessageboxService,
        public coreService: CoreService,
        public changeDetector: ChangeDetectorRef,
        public securityService: SecurityService,
        private _sanitizer: DomSanitizer
    ) {
        this.SetCLNHeadingGridColumns = new SettingsGridColumnSettings(this.coreService.taxLabel, this.securityService);
        this.SharedPhraseGridColumns = this.SetCLNHeadingGridColumns.SharedPhraseGridColumns;
        this.GetSharedPhrases();
    }

    ClinicalSharedPhraseGridActions($event: GridEmitModel) {
        switch ($event.Action) {
            case "view": {
                this.SharedPhrase = null;
                this.ShowAddEditPage = false;
                this.changeDetector.detectChanges();
                this.SharedPhrase = $event.Data;
                if (this.Phrases) {
                    this.ShowAddEditPage = true;
                    this.Phrases.ClinicalMyPhrasesValidator.patchValue({
                        TemplateName: this.SharedPhrase.TemplateName,
                        TemplateCode: this.SharedPhrase.TemplateCode,
                        TemplateType: this.SharedPhrase.TemplateType,
                        TemplateGroup: this.SharedPhrase.TemplateGroup,
                        TemplateAccessibility: this.SharedPhrase.TemplateAccessibility
                    });
                    this.SafeTemplateContent = this.SanitizeHTML(this.SharedPhrase.TemplateContent);
                }
                break;
            }
            default:
                break;
        }
    }

    SanitizeHTML(Content: string): SafeHtml {
        return this._sanitizer.bypassSecurityTrustHtml(Content);
    }
    Close() {
        try {
            this.ShowAddEditPage = false;
            this.SharedPhrase = new SharedPhrases_DTO();
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
    GetSharedPhrases() {
        this._clnSetblService.GetSharedPhrases()
            .subscribe((res: DanpheHTTPResponse) => {
                if (res.Status === ENUM_DanpheHTTPResponses.OK) {
                    this.SharedPhrasesList = res.Results;
                    this.ShowGrid = true;
                }
                else {
                    console.error(res.ErrorMessage);
                }

            });
    }
    Hotkeys(event: KeyboardEvent) {
        if (event.key === ENUM_EscapeKey.EscapeKey) {
            if (this.ShowAddEditPage) {
                this.Close();
            }
        }
    }
}