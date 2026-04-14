import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import * as moment from "moment";
import { ClinicalTemplate_DTO } from '../../../../clinical-settings/shared/dto/get-clinical-template.dto';
import { GetOTBookingDetails_DTO } from '../../../../ot/shared/dto/get-ot-booking-details.dto';
import { OperationTheatreBLService } from '../../../../ot/shared/ot.bl.service';
import { DanpheHTTPResponse } from '../../../../shared/common-models';
import { MessageboxService } from '../../../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status } from '../../../../shared/shared-enums';

@Component({
  selector: 'consent-form',
  templateUrl: './consent-form.component.html',
  styleUrls: ['./consent-form.component.css'],
})
export class ConsentFormComponent implements OnInit {

  @Input('ShowConsentForm') ShowConsentForm: boolean = false;
  @Input('SelectedOTBooking') SelectedOTBooking = new GetOTBookingDetails_DTO();
  TemplateList = new Array<ClinicalTemplate_DTO>();
  ShowConsentFormPage: boolean = false;
  loading: boolean = false;
  SelectedTemplate = new ClinicalTemplate_DTO();
  TemplateHTMLContent: SafeHtml = '';
  ShowConsent: boolean = false;
  @ViewChild('consentForm') consentForm: ElementRef;
  IsTemplateSelected: boolean = false;

  constructor(
    private _otBLService: OperationTheatreBLService,
    private _messageBoxService: MessageboxService,
    private _domSanitizer: DomSanitizer,
  ) {

  }

  ngOnInit(): void {
    this.Initialize();
  }

  Initialize(): void {
    (async (): Promise<void> => {
      try {
        await this.GetOtTemplates();
        if (this.ShowConsentForm) {
          this.ShowConsentFormPage = true;
        }
      }
      catch (err) {
        this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Error: ${err.ErrorMessage}`]);
      }
    })();
  }

  async GetOtTemplates(): Promise<void> {
    try {
      const res: DanpheHTTPResponse = await this._otBLService.GetOtTemplates().toPromise();
      if (res.Status === ENUM_DanpheHTTPResponses.OK && res.Results) {
        this.TemplateList = res.Results;
      }
      else {
        this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`TemplateList is empty.`]);
      }
    }
    catch (err) {
      throw new Error(err);
    }
  }

  OnTemplateSelect(templateId: any): void {
    if (templateId) {
      this.IsTemplateSelected = true;
      templateId = Number(templateId);
      let template = this.TemplateList.find(t => t.TemplateId === templateId);
      if (template) {
        this.SelectedTemplate = template;
        let updatedHTMLContent = this.ReplacePlaceholders(template.TemplateHTML);
        let sanitizedHTMLContent = this._domSanitizer.bypassSecurityTrustHtml(updatedHTMLContent);
        this.TemplateHTMLContent = sanitizedHTMLContent;
        this.ShowConsent = true;
      }
    }
    else {
      this.IsTemplateSelected = false;
    }
  }

  ReplacePlaceholders(templateHTML: string): string {
    return templateHTML
      .replace('{{PatientName}}', this.SelectedOTBooking.PatientName)
      .replace('{{CurrentDate}}', moment().format("YYYY-MM-DD"));
  }

  PrintConsentForm(): void {
    this.loading = true;
    let printContents = this.consentForm.nativeElement.innerHTML;
    const iframe = document.createElement('iframe');
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document.open();
    doc.write(printContents);
    doc.close();

    iframe.contentWindow.focus();
    iframe.contentWindow.print();

    document.body.removeChild(iframe);
    this.loading = false;
  }
}
