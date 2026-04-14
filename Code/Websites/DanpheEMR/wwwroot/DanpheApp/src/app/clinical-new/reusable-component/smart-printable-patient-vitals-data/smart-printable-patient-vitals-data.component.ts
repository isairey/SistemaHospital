import { Component, ElementRef, ViewChild } from "@angular/core";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import { ClinicalTemplate_DTO } from "../../../clinical-settings/shared/dto/get-clinical-template.dto";
import { DanpheHTTPResponse } from "../../../shared/common-models";
import { MessageboxService } from "../../../shared/messagebox/messagebox.service";
import { ENUM_ClinicalHeaderType, ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status } from "../../../shared/shared-enums";
import { ClinicalPatientService } from "../../shared/clinical-patient.service";
import { ClinicalNoteBLService } from "../../shared/clinical.bl.service";
import { PatientDetails_DTO } from "../../shared/dto/patient-cln-detail.dto";

@Component({
    selector: 'smart-printable-patient-vitals',
    templateUrl: './smart-printable-patient-vitals-data.component.html'
})
export class SmartPrintablePatientVitals {

    TemplateHTMLContent: SafeHtml = "";
    ShowTemplate: boolean = false;
    SelectedPatient: PatientDetails_DTO = new PatientDetails_DTO();
    TemplateCode: string = "";
    Template = new ClinicalTemplate_DTO();

    @ViewChild('smartPrintableFormContent') smartPrintableFormContent: ElementRef;

    constructor(
        private _selectedPatientService: ClinicalPatientService,
        private _clinicalBLService: ClinicalNoteBLService,
        private _messageBoxService: MessageboxService,
        private _domSanitizer: DomSanitizer,
    ) {

    }
    ngOnInit(): void {
        if (this._selectedPatientService.SelectedPatient) {
            this.SelectedPatient = this._selectedPatientService.SelectedPatient;
        }
        this.TemplateCode = ENUM_ClinicalHeaderType.vitals;
        this.InitializeTemplate();
    }

    InitializeTemplate(): void {
        (async (): Promise<void> => {
            try {
                this.SelectedPatient = this._selectedPatientService.SelectedPatient;
                await this.GetVitalTemplateByTemplateCode();
                if (this.Template && this.Template.TemplateHTML) {
                    this.ProcessTemplate(this.Template.TemplateHTML);
                }
            }
            catch (err) {
                this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Error: ${err.ErrorMessage}`]);
            }
        })();
    }

    async GetVitalTemplateByTemplateCode(): Promise<void> {
        try {
            const res: DanpheHTTPResponse = await this._clinicalBLService.GetVitalTemplateByTemplateCode(this.TemplateCode, this.SelectedPatient.PatientVisitId).toPromise();
            if (res.Status === ENUM_DanpheHTTPResponses.OK && res.Results) {
                this.Template = res.Results;
            }
            else {
                this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`Template not found.`]);
            }
        }
        catch (err) {
            throw new Error(err);
        }
    }

    ProcessTemplate(templateHTML: string): void {

        templateHTML = this.removeCurlyBraces(templateHTML);
        let sanitizedHTMLContent = this._domSanitizer.bypassSecurityTrustHtml(templateHTML);
        this.TemplateHTMLContent = sanitizedHTMLContent;
        this.ShowTemplate = true;
    }

    removeCurlyBraces(html: string): string {
        // Step 1: Extract CSS inside <style> tags
        const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
        let cssContent = '';
        const cssMatches = html.match(styleRegex);

        if (cssMatches && cssMatches.length > 0) {
            cssContent = cssMatches.join('\n');
        }

        // Step 2: Remove the <style> tags and CSS content from the HTML
        let htmlWithoutCss = html.replace(styleRegex, '');

        // Step 3: Remove curly braces from the remaining HTML content
        htmlWithoutCss = htmlWithoutCss.replace(/[{}]/g, '');

        // Step 4: Combine the original CSS content with the cleaned HTML content
        const processedHtml = cssContent + '\n' + htmlWithoutCss;

        return processedHtml;
    }
}