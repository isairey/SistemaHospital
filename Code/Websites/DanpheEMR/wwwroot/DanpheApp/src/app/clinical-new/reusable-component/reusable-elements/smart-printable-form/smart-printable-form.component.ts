import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ClinicalNoteBLService } from '../../../../clinical-new/shared/clinical.bl.service';
import { SmartPrintableFormConfig } from '../../../../clinical-new/shared/dto/dynamic-field-config.dto';
import { ClinicalTemplate_DTO } from '../../../../clinical-settings/shared/dto/get-clinical-template.dto';
import { DanpheHTTPResponse } from '../../../../shared/common-models';
import { MessageboxService } from '../../../../shared/messagebox/messagebox.service';
import { ENUM_ClinicalHeaderType, ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status } from '../../../../shared/shared-enums';
import { ClinicalPatientService } from '../../../shared/clinical-patient.service';
import { Field } from "../../../shared/dto/field.dto";
import { QuestionaryConfig } from '../../../shared/dto/questionary-config.dto';
import { IDynamicElement } from '../dynamic-field.interface';

@Component({
  selector: 'smart-printable-form',
  templateUrl: './smart-printable-form.component.html',
  styleUrls: ['./smart-printable-form.component.css'],
})
export class SmartPrintableFormComponent implements OnInit, IDynamicElement {
  Field: Field;
  Question: QuestionaryConfig;
  FieldConfig: SmartPrintableFormConfig;
  TemplateCode: string = "";
  IsPrintButton: boolean = false;
  Template = new ClinicalTemplate_DTO();
  SelectedPatient: any = {};
  TemplateHTMLContent: SafeHtml = "";
  ShowTemplate: boolean = false;
  @ViewChild('smartPrintableFormContent') smartPrintableFormContent: ElementRef;

  constructor(
    private _clinicalBLService: ClinicalNoteBLService,
    private _messageBoxService: MessageboxService,
    private _domSanitizer: DomSanitizer,
    private _selectedPatientsService: ClinicalPatientService,
  ) {
  }

  async ngOnInit(): Promise<void> {
    this.FieldConfig = this.Field.FieldConfig;
    this.Template = new ClinicalTemplate_DTO();
    this.TemplateCode = this.FieldConfig.templateCode;
    this.IsPrintButton = this.FieldConfig.IsPrintButton;
    this.InitializeTemplate();
  }

  InitializeTemplate(): void {
    (async (): Promise<void> => {
      try {
        this.SelectedPatient = this._selectedPatientsService.SelectedPatient;
        if (this.TemplateCode === ENUM_ClinicalHeaderType.vitals) {
          await this.GetVitalTemplateByTemplateCode();
        }
        else {
          await this.GetTemplateByTemplateCode();
        }
        if (this.Template && this.Template.TemplateHTML) {
          this.ProcessTemplate(this.Template.TemplateHTML);
        }
      }
      catch (err) {
        this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Error: ${err.ErrorMessage}`]);
      }
    })();
  }

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
    let sanitizedHTMLContent = this._domSanitizer.bypassSecurityTrustHtml(templateHTML);
    this.TemplateHTMLContent = sanitizedHTMLContent;
    this.ShowTemplate = true;
  }

  PrintForm(): void {
    const printContents = this.smartPrintableFormContent.nativeElement.innerHTML;
    const iframe = document.createElement('iframe');
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document.open();
    doc.write(printContents);
    doc.close();

    iframe.contentWindow.focus();
    iframe.contentWindow.print();

    document.body.removeChild(iframe);
  }
}
