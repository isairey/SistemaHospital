import { ChangeDetectorRef, Component } from '@angular/core';
import { ClinicalSettingsBLService } from '../../../../clinical-settings/shared/clinical-settings.bl.service';
import { ClinicalTemplate } from '../../../../clinical-settings/shared/dto/clinical-template.model';
import { SecurityService } from '../../../../security/shared/security.service';

import { CoreService } from '../../../../core/shared/core.service';
import { DanpheHTTPResponse } from '../../../../shared/common-models';
import { GridEmitModel } from '../../../../shared/danphe-grid/grid-emit.model';
import { SettingsGridColumnSettings } from '../../../../shared/danphe-grid/settings-grid-column-settings';
import { MessageboxService } from '../../../../shared/messagebox/messagebox.service';
import { ENUM_ClinicalPhrases_EditorType, ENUM_DanpheHTTPResponses, ENUM_EscapeKey, ENUM_MessageBox_Status, ENUM_TemplateType } from '../../../../shared/shared-enums';

@Component({
  selector: 'app-manage-template',
  templateUrl: './manage-template.component.html',
  styleUrls: ['./manage-template.component.css'],
  host: { '(window:keydown)': 'Hotkeys($event)' }

})
export class ManageTemplateComponent {
  TemplateList = new Array<ClinicalTemplate>();
  public ShowGrid: boolean = true;
  public TemplateGridColumns: typeof SettingsGridColumnSettings.prototype.ClinicalTemplateGrid;
  public SetCLNHeadingGridColumns: SettingsGridColumnSettings = null;
  public SelectedItem = new ClinicalTemplate();
  public ShowAddEditPage: boolean = false;
  public IsUpdate: boolean = false;
  public CurrentTemplate: ClinicalTemplate = new ClinicalTemplate();
  public IsValidTemplate: boolean = true;
  public CLNCurrentTemplate: ClinicalTemplate = new ClinicalTemplate();
  public ShowCKEditorGrid: boolean = false;

  TemplateOptions = Object.values(ENUM_ClinicalPhrases_EditorType);
  TemplateTypes: string[] = Object.keys(ENUM_TemplateType);

  constructor(private _clnSetblService: ClinicalSettingsBLService,
    public securityService: SecurityService,
    private msgBoxServ: MessageboxService,
    public coreService: CoreService,
    public changeDetector: ChangeDetectorRef,

  ) {
    this.SetCLNHeadingGridColumns = new SettingsGridColumnSettings(this.coreService.taxLabel, this.securityService);
    this.TemplateGridColumns = this.SetCLNHeadingGridColumns.ClinicalTemplateGrid;
    this.GetClinicalTemplates();
  }

  GetClinicalTemplates() {
    this._clnSetblService.GetClinicalTemplates()
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this.TemplateList = res.Results;
          this.ShowGrid = true;
        }
        else {
          console.error(res.ErrorMessage);
        }

      });
  }
  NewTemplate() {
    try {

      this.ShowAddEditPage = true;
      this.IsUpdate = false;
      this.CurrentTemplate = new ClinicalTemplate();
    } catch (exception) {
      this.ShowCatchErrMessage(exception);
    }
  }
  Close() {
    try {
      this.ShowAddEditPage = false;
      this.IsUpdate = false;
      this.CurrentTemplate = new ClinicalTemplate();
      this.ShowCKEditorGrid = false;
    } catch (exception) {
      this.ShowCatchErrMessage(exception);
    }
  }
  OnChangeEditorData(data) {
    try {
      this.CurrentTemplate.TemplateHTML = data;
    } catch (exception) {
      this.ShowCatchErrMessage(exception);
    }
  }
  OnTemplateOptionChange(option: string) {
    if (option === ENUM_ClinicalPhrases_EditorType.Editor) {
      this.ShowCKEditorGrid = true;
    } else {

      this.ShowCKEditorGrid = false;
    }
  }

  ClinicalTemplateGridActions($event: GridEmitModel) {
    switch ($event.Action) {
      case "edit": {
        this.IsUpdate = true;
        this.CLNCurrentTemplate = null;
        this.ShowAddEditPage = false;
        this.changeDetector.detectChanges();
        this.CLNCurrentTemplate = $event.Data;
        if (this.CurrentTemplate) {
          this.ShowAddEditPage = true;
          this.CurrentTemplate.DynamicTemplateValidator.patchValue({
            TemplateName: this.CLNCurrentTemplate.TemplateName,
            TemplateType: this.CLNCurrentTemplate.TemplateType ? this.CLNCurrentTemplate.TemplateType : "",
            TemplateCode: this.CLNCurrentTemplate.TemplateCode,
            TemplateHTML: this.CLNCurrentTemplate.TemplateHTML,
            PrintHospitalHeader: this.CLNCurrentTemplate.PrintHospitalHeader,
            TemplateId: this.CLNCurrentTemplate.TemplateId,
            EditorType: this.CLNCurrentTemplate.EditorType

            // Patch values for other form controls as needed
          });
          this.CurrentTemplate.TemplateHTML = this.CLNCurrentTemplate.TemplateHTML;
          this.OnTemplateOptionChange(this.CLNCurrentTemplate.EditorType);
        }
        break;
      }
      case "deactivateClinicalTemplateSetting": {
        this.SelectedItem = $event.Data;
        this.ActivateClinicalField(this.SelectedItem);
        break;
      }

      case "activateClinicalTemplateSetting": {
        this.SelectedItem = $event.Data;
        this.ActivateClinicalField(this.SelectedItem);
        break;
      }
      default:
        break;
    }

  }
  ActivateClinicalField(selectedItem: ClinicalTemplate) {

    const message = selectedItem.IsActive ? "Are you sure you want to deactivate this Clinical Template?" : "Are you sure you want to activate this Clinical Template?";
    if (window.confirm(message)) {
      this._clnSetblService
        .ClinicalTemplateActivation(selectedItem)
        .subscribe((res: DanpheHTTPResponse) => {
          if (res.Status === ENUM_DanpheHTTPResponses.OK) {
            this.GetClinicalTemplates();
            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Success, ['clinical template Status updated successfully']);
          } else {
            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ["failed to Change status",]);
          }
        });
    }
  }

  IsValidModelCheck(): boolean {
    try {
      //marking every fields as dirty and checking validity
      for (var i in this.CurrentTemplate.DynamicTemplateValidator.controls) {
        this.CurrentTemplate.DynamicTemplateValidator.controls[i].markAsDirty();
        this.CurrentTemplate.DynamicTemplateValidator.controls[i].updateValueAndValidity();
      }
      if ((this.CurrentTemplate.IsValidCheck(undefined, undefined) == true) && this.CurrentTemplate.TemplateHTML.length > 0) {
        this.IsValidTemplate = true;
        return true;
      } else {
        if (this.CurrentTemplate.TemplateHTML.length <= 0) {
          this.IsValidTemplate = false;
        }
        return false;
      }
    } catch (exception) {
      this.ShowCatchErrMessage(exception);
    }
  }
  AddNewTemplate(): void {
    try {
      if (this.IsValidModelCheck()) {
        const templateData = this.CurrentTemplate.DynamicTemplateValidator.value;
        const templatePayload = {
          ...templateData,
          TemplateHTML: this.CurrentTemplate.TemplateHTML,

        };

        this._clnSetblService.AddNewTemplate(templatePayload)
          .subscribe((res: DanpheHTTPResponse) => {
            if (res.Status === ENUM_DanpheHTTPResponses.OK) {
              this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Success, [
                "Template added successfully.",
              ]);
              this.GetClinicalTemplates();
              this.Close();
            }
            else {
              this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, [res.ErrorMessage]);
            }
          },

            (err: any) => {
              if (err && err.error && err.error.ErrorMessage) {
                const errorMessage = err.error.ErrorMessage;
                this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, [errorMessage]);
              } else {
                console.error('Error occurred during HTTP request:', err);
              }
            });
      }
    } catch (exception) {
      this.ShowCatchErrMessage(exception);
    }
  }
  Update(): void {
    try {
      if (this.IsValidModelCheck()) {
        const templateData = this.CurrentTemplate.DynamicTemplateValidator.value;
        const templatePayload = {
          ...templateData,
          TemplateHTML: this.CurrentTemplate.TemplateHTML,
          TemplateId: this.CLNCurrentTemplate.TemplateId,
        };
        this.CheckForDuplicateTemplates(templatePayload);
        this._clnSetblService.UpdateClinicalTemplate(templatePayload)
          .subscribe((res: DanpheHTTPResponse) => {
            if (res.Status === ENUM_DanpheHTTPResponses.OK) {

              this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Success, [
                "Updated Successfully.",
              ]);
              this.GetClinicalTemplates();
              this.Close();
            }
          },
            err => this.logError(err));
      }
    } catch (exception) {
      this.ShowCatchErrMessage(exception);
    }
  }
  ShowCatchErrMessage(exception) {
    if (exception) {
      let ex: Error = exception;
      this.msgBoxServ.showMessage(ENUM_DanpheHTTPResponses.Failed, ["Check error in Console log !"]);
      console.error(ex);
    }
  }

  logError(err: any) {
    console.error(err);
    this.msgBoxServ.showMessage(ENUM_DanpheHTTPResponses.Failed, [err]);
  }
  SetFocusById(name: string, index: number): void {
    let htmlObj = document.getElementById(`${name}${index}`);
    if (htmlObj) {
      htmlObj.focus();
    }
  }
  public FocusElementById(id: string) {
    window.setTimeout(function () {
      let itmNameBox = document.getElementById(id);
      if (itmNameBox) {
        itmNameBox.focus();
      }
    }, 600);
  }
  public Hotkeys(event: KeyboardEvent) {
    if (event.key === ENUM_EscapeKey.EscapeKey) {
      this.ShowAddEditPage = false;
    }
  }

  CheckForDuplicateTemplates(templatePayload): boolean {
    const isDuplicateCode = this.TemplateList.some(template =>
      template.TemplateCode.toLocaleLowerCase() === templatePayload.TemplateCode.toLocaleLowerCase() &&
      template.TemplateId !== templatePayload.TemplateId
    );
    const isDuplicateName = this.TemplateList.some(template =>
      template.TemplateName.toLocaleLowerCase() === templatePayload.TemplateName.toLocaleLowerCase() &&
      template.TemplateId !== templatePayload.TemplateId
    );

    if (isDuplicateName) {
      this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, [
        `TemplateName "${templatePayload.TemplateName}" is already present.`,
      ]);
      return true;
    }

    if (isDuplicateCode) {
      this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, [
        `TemplateCode "${templatePayload.TemplateCode}" is already present.`,
      ]);
      return true;
    }

    return false;
  }

}
