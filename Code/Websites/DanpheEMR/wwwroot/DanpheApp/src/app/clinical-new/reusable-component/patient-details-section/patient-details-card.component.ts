import { Component, ElementRef, ViewChild } from "@angular/core";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import { ClinicalTemplate_DTO } from "../../../clinical-settings/shared/dto/get-clinical-template.dto";
import { CoreService } from "../../../core/shared/core.service";
import { DanpheHTTPResponse } from "../../../shared/common-models";
import { MessageboxService } from "../../../shared/messagebox/messagebox.service";
import { ENUM_ClinicalHeaderType, ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status, ENUM_VisitType } from "../../../shared/shared-enums";
import { ClinicalPatientService } from "../../shared/clinical-patient.service";
import { ClinicalNoteBLService } from "../../shared/clinical.bl.service";
import { PatientDetails_DTO } from "../../shared/dto/patient-cln-detail.dto";



@Component({
  selector: 'patient-details-card',
  templateUrl: './patient-details-card.component.html'
})

export class PatientDetailsMainComponent {
  TemplateHTMLContent: SafeHtml = "";
  ShowTemplate: boolean = false;
  SelectedPatient: PatientDetails_DTO = new PatientDetails_DTO();
  TemplateCode: string = "";
  Template = new ClinicalTemplate_DTO();
  @ViewChild('smartPrintableFormContent') smartPrintableFormContent: ElementRef;
  PatientAddress: string = "";

  constructor(private _selectedPatientService: ClinicalPatientService,
    private _clinicalBLService: ClinicalNoteBLService,
    private _messageBoxService: MessageboxService,
    private _domSanitizer: DomSanitizer,
    private _coreService: CoreService

  ) {
  }

  ngOnInit(): void {
    if (this._selectedPatientService.SelectedPatient) {
      this.SelectedPatient = this._selectedPatientService.SelectedPatient;
      this.PatientAddress = this._coreService.SortPatientAddress(this.SelectedPatient);

    }

    this.Template = new ClinicalTemplate_DTO();
    if (this.SelectedPatient.VisitType === ENUM_VisitType.inpatient) {
      this.TemplateCode = ENUM_ClinicalHeaderType.inpatient;
    } else if (this.SelectedPatient.VisitType === ENUM_VisitType.outpatient) {
      this.TemplateCode = ENUM_ClinicalHeaderType.outpatient;
    } else if (this.SelectedPatient.VisitType == ENUM_VisitType.emergency) {
      this.TemplateCode = ENUM_ClinicalHeaderType.emergency;
    }
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
      else {
        this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`Template not found.`]);
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
    templateHTML = templateHTML.replace("{{PatientAddress}}", this.PatientAddress);
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
