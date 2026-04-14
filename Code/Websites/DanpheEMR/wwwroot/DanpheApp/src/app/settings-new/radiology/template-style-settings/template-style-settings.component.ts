import { Component } from '@angular/core';
import { RadiologyTemplateStyleDto } from '../../../radiology/shared/DTOs/radiology-template-style.dto';
import { RadiologyReportTemplate } from '../../../radiology/shared/radiology-report-template.model';
import { TemplateStyleModel } from '../../../radiology/shared/template-style-model';
import { DanpheHTTPResponse } from '../../../shared/common-models';
import { GridEmitModel } from '../../../shared/danphe-grid/grid-emit.model';
import { NepaliDateInGridColumnDetail, NepaliDateInGridParams } from '../../../shared/danphe-grid/NepaliColGridSettingsModel';
import { SettingsGridColumnSettings } from '../../../shared/danphe-grid/settings-grid-column-settings';
import { MessageboxService } from '../../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status } from '../../../shared/shared-enums';
import { SettingsService } from '../../shared/settings-service';
import { SettingsBLService } from '../../shared/settings.bl.service';

@Component({
  selector: 'app-template-style-settings',
  templateUrl: './template-style-settings.component.html',
  host: { '(window:keydown)': 'hotkeys($event)' }
})
export class TemplateStyleSettingsComponent {
  TemplateStyleList = new Array<TemplateStyleModel>();
  TemplateStyleGridColumns: typeof SettingsGridColumnSettings.prototype.TemplateStyleList;
  ShowPopup: boolean = false;
  RadTemplateNameList = new Array<RadiologyReportTemplate>();
  NewTemplateStyleObj = new TemplateStyleModel();
  IsUpdate: boolean = false;
  NepaliDateInGridSettings: NepaliDateInGridParams = new NepaliDateInGridParams();
  SelectedTemplateStyleId: number;
  DefaultRadiologyTemplateCode = "Default";
  DefaultRadiologyTemplate = new RadiologyReportTemplate();
  constructor(
    private _settingsServ: SettingsService,
    private _messageBoxService: MessageboxService,
    private _settingsBLService: SettingsBLService,
  ) {
    this.NepaliDateInGridSettings.NepaliDateColumnList.push(new NepaliDateInGridColumnDetail('CreatedOn', true));
    this.TemplateStyleGridColumns = this._settingsServ.settingsGridCols.TemplateStyleList;
    this.GetTemplateStyleList();
    this.GetRADReportTemplateList();
  }
  public hotkeys(event) {
    if (event.keyCode == 27) { //ESC
      this.ClosePopUp();
    }
  }
  GetTemplateStyleList() {
    try {
      this._settingsBLService.GetTemplateStyleList()
        .subscribe(
          (res: DanpheHTTPResponse) => {
            if (res.Status === ENUM_DanpheHTTPResponses.OK) {
              if (res.Results.length > 0) {
                this.TemplateStyleList = res.Results;
              }
              else {
                this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, ["Record not found"]);
              }
            }
          },
          err => {
            this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ["Check log for error message."]);
            this.LogError(err.ErrorMessage);
          });
    } catch (exception) {
      this.ShowCatchErrMessage(exception);
    }
  }
  GetRADReportTemplateList() {
    try {
      this._settingsBLService.GetActiveReportTemplatesList().subscribe(
        (res: DanpheHTTPResponse) => {
          if (res.Status === ENUM_DanpheHTTPResponses.OK) {
            if (res.Results.length > 0) {
              this.RadTemplateNameList = res.Results;
            }
            else {
              this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, ["Record not found"]);
            }
          }
        },
        err => {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ["Check log for error message."]);
          this.LogError(err.ErrorMessage);
        });
    } catch (exception) {
      this.ShowCatchErrMessage(exception);
    }
  }
  SelectDefaultRadiologyTemplate() {
    if (this.RadTemplateNameList && this.RadTemplateNameList.length > 0) {
      this.DefaultRadiologyTemplate = this.RadTemplateNameList.find(a => (a.TemplateCode).toLowerCase() === (this.DefaultRadiologyTemplateCode).toLowerCase());
      this.NewTemplateStyleObj.TemplateStyleFormValidator.get('TemplateId').setValue(this.DefaultRadiologyTemplate.TemplateId);
    }
  }
  LogError(err: string) {
    console.log(err);
  }
  ShowCatchErrMessage(exception) {
    if (exception) {
      let ex: Error = exception;
      this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, ["Check error in Console log !"]);
      console.log("Error Messsage =>  " + ex.message);
      console.log("Stack Details =>   " + ex.stack);
    }
  }
  NewTemplateStyle(): void {
    this.ShowPopup = true;
    this.IsUpdate = false;
    this.NewTemplateStyleObj.TemplateStyleFormValidator.reset();
    this.SelectDefaultRadiologyTemplate();
  }
  ClosePopUp() {
    this.ShowPopup = false;
    this.IsUpdate = false;
  }
  DiscardTemplate() {
    this.NewTemplateStyleObj.TemplateStyleFormValidator.reset();
    if (this.IsUpdate) {
      this.ShowPopup = false;
      this.IsUpdate = false;
    }
  }
  AddTemplateStyle() {
    let newTemplateStyle = this.NewTemplateStyleObj.TemplateStyleFormValidator.value;
    if (this.TemplateStyleList && this.TemplateStyleList.length > 0) {
      let isTemplateStyleIdExists = this.TemplateStyleList.some(item => item.TemplateId === newTemplateStyle.TemplateId);
      if (isTemplateStyleIdExists) {
        let selectedTemplate = this.RadTemplateNameList.find((temp) => temp.TemplateId === newTemplateStyle.TemplateId)
        this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`Template stye for  "${selectedTemplate.TemplateName}" Template  already exists!`]);
        return;
      }
    }
    this._settingsBLService.AddNewTemplateStyle(newTemplateStyle).subscribe((res: DanpheHTTPResponse) => {
      if (res.Status === ENUM_DanpheHTTPResponses.OK) {
        this._messageBoxService.showMessage(ENUM_MessageBox_Status.Success, ['New Template Style Added sucessfully.']);
        this.NewTemplateStyleObj.TemplateStyleFormValidator.reset();
        this.ShowPopup = false;
        this.GetTemplateStyleList();
      }
      else {
        this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, [`Failed to add new template style: ${res.ErrorMessage}`]);
      }
    })
  }
  UpdateIsActiveStatus(templateStyleId: number) {
    this._settingsBLService.UpdateIsActiveStatus(templateStyleId).subscribe((res: DanpheHTTPResponse) => {
      if (res.Status === ENUM_DanpheHTTPResponses.OK) {
        this._messageBoxService.showMessage(ENUM_MessageBox_Status.Success, ['Active Status changed.']);
        this.GetTemplateStyleList();
      }
      else {
        this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ['Failed to change Active Status.']);
      }
    })
  }
  UpdateTemplateStyle(): void {
    let updatedTemplateStyle = new RadiologyTemplateStyleDto();
    updatedTemplateStyle = this.NewTemplateStyleObj.TemplateStyleFormValidator.value;
    updatedTemplateStyle.TemplateStyleId = this.SelectedTemplateStyleId;
    this._settingsBLService.UpdateTemplateStyle(updatedTemplateStyle).subscribe((res: DanpheHTTPResponse) => {
      if (res.Status === ENUM_DanpheHTTPResponses.OK) {
        this._messageBoxService.showMessage(ENUM_MessageBox_Status.Success, ['Template style Updated.']);
        this.ShowPopup = false;
        this.GetTemplateStyleList();
      } else {
        this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ['Failed to Update Template Style.']);
      }
    });
  }
  TemplateGridActions($event: GridEmitModel) {
    switch ($event.Action) {
      case 'edit': {
        this.ShowPopup = true;
        this.IsUpdate = true;
        this.SelectedTemplateStyleId = $event.Data.TemplateStyleId;
        this.NewTemplateStyleObj.TemplateStyleFormValidator.patchValue($event.Data);
      }
        break;
      case 'deactivate': {
        this.UpdateIsActiveStatus($event.Data.TemplateStyleId);
      }
        break;
      case 'activate': {
        this.UpdateIsActiveStatus($event.Data.TemplateStyleId);
      }
        break;
      default:
        break;
    }
  }
}