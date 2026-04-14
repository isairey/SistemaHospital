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
  selector: 'smart-printable-form-footer',
  templateUrl: './smart-printable-form-footer.html'
})

export class SmartPrintableFormFooterComponent {
  TemplateHTMLContent: SafeHtml = "";
  ShowTemplate: boolean = false;
  SelectedPatient: PatientDetails_DTO = new PatientDetails_DTO();
  TemplateCode: string = "";
  Template = new ClinicalTemplate_DTO();
  @ViewChild('smartPrintableFormContent') smartPrintableFormContent: ElementRef;


  constructor(private _selectedPatientService: ClinicalPatientService,
    private _clinicalBLService: ClinicalNoteBLService,
    private _messageBoxService: MessageboxService,
    private _domSanitizer: DomSanitizer,
  ) {
  }

  ngOnInit(): void {
    if (this._selectedPatientService.SelectedPatient) {
      this.SelectedPatient = this._selectedPatientService.SelectedPatient;
    }
    this.TemplateCode = ENUM_ClinicalHeaderType.footer;
    this.InitializeTemplate();

  }

  /**
 * Initializes the template for the selected patient by fetching the template
 * based on the template code and processing the template HTML.
 */
  InitializeTemplate(): void {
    (async (): Promise<void> => {
      try {
        this.SelectedPatient = this._selectedPatientService.SelectedPatient;
        await this.GetTemplateByTemplateCode();
        if (this.Template && this.Template.TemplateHTML) {
          this.ProcessTemplate(this.Template.TemplateHTML);
        }
      }
      catch (err) {
        this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Error: ${err.ErrorMessage}`]);
      }
    })();
  }

  /**
 * Fetches the template from the server using the template code and patient's visit ID.
 * If the template is found, it is assigned to the `Template` property.
 */
  async GetTemplateByTemplateCode(): Promise<void> {
    try {
      const res: DanpheHTTPResponse = await this._clinicalBLService.GetTemplateByTemplateCode(this.TemplateCode, this.SelectedPatient.PatientVisitId).toPromise();
      if (res.Status === ENUM_DanpheHTTPResponses.OK && res.Results) {
        this.Template = res.Results;
      }
    }
    catch (err) {
      throw new Error(err);
    }
  }

  /**
 * Processes the provided template HTML by removing curly braces, sanitizing the content,
 * and then assigning the sanitized HTML to the `TemplateHTMLContent` property for display.
 */
  ProcessTemplate(templateHTML: string): void {

    templateHTML = this.removeCurlyBraces(templateHTML);
    let sanitizedHTMLContent = this._domSanitizer.bypassSecurityTrustHtml(templateHTML);
    this.TemplateHTMLContent = sanitizedHTMLContent;
    this.ShowTemplate = true;
  }

  /**
 * Removes curly braces from the HTML content, while preserving any CSS within <style> tags.
 * This function separates CSS from the HTML, removes curly braces from the HTML, and then recombines them.
 */
  removeCurlyBraces(html: string): string {
    const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
    let cssContent = '';
    const cssMatches = html.match(styleRegex);
    if (cssMatches && cssMatches.length > 0) {
      cssContent = cssMatches.join('\n');
    }
    let htmlWithoutCss = html.replace(styleRegex, '');
    htmlWithoutCss = htmlWithoutCss.replace(/[{}]/g, '');
    const processedHtml = cssContent + '\n' + htmlWithoutCss;
    return processedHtml;
  }
}
