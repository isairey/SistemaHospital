import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { DanpheHTTPResponse } from "../../../../shared/common-models";
import { MessageboxService } from '../../../../shared/messagebox/messagebox.service';
import { ENUM_ClinicalField_InputType, ENUM_DanpheHTTPResponseText, ENUM_DanpheHTTPResponses, ENUM_EscapeKey, ENUM_MessageBox_Status } from '../../../../shared/shared-enums';
import { ClinicalSettingsBLService } from '../../../shared/clinical-settings.bl.service';
import { ClinicalSettingsService } from '../../../shared/clinical-settings.service';
import { ClinicalHeadingField_DTO } from '../../../shared/dto/clinical-heading-field.dto';
import { ClinicalTemplateDTO } from '../../../shared/dto/clinical-printable-template.dto';
import { PreTemplate_DTO } from '../../../shared/dto/pre-template-list.dto';
import { ClinicalOption } from '../../../shared/model/clinical-field-option.model';
@Component({
  selector: "add-clinical-heading-field",
  templateUrl: './add-clinical-heading-field.component.html',
  host: { '(window:keydown)': 'hotkeys($event)' }
})
export class AddClinicalHeadingFieldComponent implements OnInit {
  @Input('cln-heading-to-edit')
  ClinicalField: ClinicalHeadingField_DTO = new ClinicalHeadingField_DTO();
  ClinicalHeadingField: ClinicalHeadingField_DTO = new ClinicalHeadingField_DTO();
  @Output("callback-add")
  CallbackAdd: EventEmitter<Object> = new EventEmitter<Object>();
  @Output("callback-close")
  CallbackClose: EventEmitter<Object> = new EventEmitter<Object>();
  @Input('Update')
  Update: boolean = false;
  InputTypes: { name: string, value: string; }[];
  HeadingsList: Array<ClinicalHeadingField_DTO> = new Array<ClinicalHeadingField_DTO>();
  ShowChoosePretemplate: boolean = false;
  ShowPrintableFormOption: boolean = false;
  PreTemplateList = new Array<PreTemplate_DTO>();
  SmartPrintableTemplateList = new Array<ClinicalTemplateDTO>();
  FieldOPtionList = new Array<ClinicalOption>();
  SelectedPreTemplate = new ClinicalOption();

  GroupNameBackup: string = '';

  constructor(
    private _clnblService: ClinicalSettingsBLService,
    private _msgBoxServ: MessageboxService,
    private _clinicalSettingService: ClinicalSettingsService

  ) {

    this.GetPreTemplateComponentList();
    this.GetFieldOptionList();
    this.GetAllClinicalTemplates();
  }
  ngOnInit() {
    if (this.Update) {
      this.ClinicalHeadingField.CLNHeadingFieldValidator.controls['IsDisplayTitle'].setValue(this.ClinicalField.IsDisplayTitle);
    } else {
      this.ClinicalHeadingField.CLNHeadingFieldValidator.controls['IsDisplayTitle'].setValue(true);
    }
    this.SetValue();
    this.InputTypes = this._clinicalSettingService.GetEnumEntries(ENUM_ClinicalField_InputType);
  }
  SetValue() {
    if (this.ClinicalField && this.ClinicalField.FieldId !== 0) {
      if (this.ClinicalField.InputType === ENUM_ClinicalField_InputType.SmartTemplate) {
        this.ShowChoosePretemplate = true;
        if (this.ClinicalField.OptionValue) {
          this.ClinicalHeadingField.CLNHeadingFieldValidator.patchValue({
            OptionValue: this.ClinicalField.OptionValue
          });
        }
      }
      else if (this.ClinicalField.InputType === ENUM_ClinicalField_InputType.SmartPrintableForm) {
        this.ShowPrintableFormOption = true;
        if (this.ClinicalField.OptionValue) {
          this.ClinicalHeadingField.CLNHeadingFieldValidator.patchValue({
            OptionValue: this.ClinicalField.OptionValue
          });
        }
      }
      this.ClinicalHeadingField.CLNHeadingFieldValidator.patchValue({
        InputType: this.ClinicalField.InputType,
        FieldName: this.ClinicalField.FieldName,
        IsIPD: this.ClinicalField.IsIPD,
        IsOPD: this.ClinicalField.IsOPD,
        IsEmergency: this.ClinicalField.IsEmergency,
        GroupName: this.ClinicalField.GroupName,
        IsAcrossVisitAvailability: this.ClinicalField.IsAcrossVisitAvailability

      });
    } else if (this.ClinicalField) {
      if (this.ClinicalField.InputType === ENUM_ClinicalField_InputType.SmartTemplate) {
        this.ShowChoosePretemplate = true;
        if (this.ClinicalField.OptionValue) {
          this.ClinicalHeadingField.CLNHeadingFieldValidator.patchValue({
            OptionValue: this.ClinicalField.OptionValue
          });
        }
      }
      else if (this.ClinicalField.InputType === ENUM_ClinicalField_InputType.SmartPrintableForm) {
        this.ShowPrintableFormOption = true;
        if (this.ClinicalField.OptionValue) {
          this.ClinicalHeadingField.CLNHeadingFieldValidator.patchValue({
            OptionValue: this.ClinicalField.OptionValue
          });
        }
      }
      this.ClinicalHeadingField.CLNHeadingFieldValidator.patchValue({
        InputType: this.ClinicalField.InputType,
        FieldName: this.ClinicalField.FieldName,
        IsIPD: this.ClinicalField.IsIPD,
        IsOPD: this.ClinicalField.IsOPD,
        IsEmergency: this.ClinicalField.IsEmergency
      });

    }

  }

  GetFieldOptionList() {
    this._clnblService.GetClinicalFieldOption().subscribe(res => {
      if (res.Status === ENUM_DanpheHTTPResponses.OK) {
        this.FieldOPtionList = res.Results;
      }
      else {
        this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ['Failed to get Clinical Field Options, check log for details']);
      }
    });
  }


  Close() {
    this.ClinicalHeadingField = new ClinicalHeadingField_DTO();
    this.CallbackAdd.emit({ action: "close", data: null });
  }

  AddClinicalHeadingField() {
    this.GroupNameBackup = this.ClinicalHeadingField.GroupName;

    for (let i in this.ClinicalHeadingField.CLNHeadingFieldValidator.controls) {
      this.ClinicalHeadingField.CLNHeadingFieldValidator.controls[i].markAsDirty();
      this.ClinicalHeadingField.CLNHeadingFieldValidator.controls[i].updateValueAndValidity();
    }

    if (this.ClinicalHeadingField.IsValidCheck(undefined, undefined)) {
      let updatedValue = this.ClinicalHeadingField.CLNHeadingFieldValidator.value;
      updatedValue.DisplayName = updatedValue.FieldName;
      const { FieldName, ...payloadWithoutFieldName } = updatedValue;
      const payloadWithBothNames = {
        ...payloadWithoutFieldName,
        FieldName: updatedValue.FieldName,
        DisplayName: updatedValue.DisplayName
      };

      this._clnblService.AddClinicalHeadingField(payloadWithBothNames).subscribe(
        (res: DanpheHTTPResponse) => {
          if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
            this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Success, [
              "Clinical Field Added",
            ]);
            this.ClinicalHeadingField = new ClinicalHeadingField_DTO();
            this.ClinicalHeadingField.GroupName = this.GroupNameBackup;


            this.ClinicalHeadingField = new ClinicalHeadingField_DTO();

          } else {
            this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, [res.ErrorMessage]);
          }
        },
        (err) => {
          this.LogError(err);
        }
      );
    } else {
      this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, [
        "some data are invalid.",
      ]);
    }
  }

  UpdateClinicalHeadingFieldSetup() {
    for (let i in this.ClinicalHeadingField.CLNHeadingFieldValidator.controls) {
      this.ClinicalHeadingField.CLNHeadingFieldValidator.controls[i].markAsDirty();
      this.ClinicalHeadingField.CLNHeadingFieldValidator.controls[i].updateValueAndValidity();
    }
    if (this.ClinicalHeadingField.IsValidCheck(undefined, undefined)) {
      let updatedValue = this.ClinicalHeadingField.CLNHeadingFieldValidator.value;
      updatedValue.FieldId = this.ClinicalField.FieldId;

      const { FieldName, ...payloadWithoutFieldName } = updatedValue;
      const payloadWithBothNames = {
        ...payloadWithoutFieldName,
        FieldName: updatedValue.FieldName,
        FieldDisplayName: updatedValue.FieldName // Assuming FieldName should be FieldDisplayName
      };

      this._clnblService.UpdateClinicalHeadingFieldSetup(payloadWithBothNames)
        .subscribe((res: DanpheHTTPResponse) => {
          if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
            this.CallbackAdd.emit({ action: "edit", data: res.Results });
            this.ClinicalHeadingField = new ClinicalHeadingField_DTO();
            this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Success, ["Updated."]);
          }
          else {
            this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ["failed to update"]);
            this.SetFocusById('ClinicalHeading_DTO');
          }
        });
    }
  }

  LogError(err: any) {
    console.log(err);
  }
  public SetFocusById(id: string) {
    window.setTimeout(function () {
      let elementToBeFocused = document.getElementById(id);
      if (elementToBeFocused) {
        elementToBeFocused.focus();
      }
    }, 200);

  }
  OnSelectInputType($event) {
    let selectedInputType = $event;
    if (selectedInputType && selectedInputType === ENUM_ClinicalField_InputType.SmartTemplate) {
      this.ShowChoosePretemplate = true;
      this.ShowPrintableFormOption = false;
    }
    else if (selectedInputType && selectedInputType === ENUM_ClinicalField_InputType.SmartPrintableForm) {
      this.ShowPrintableFormOption = true;
      this.ShowChoosePretemplate = false;
    }
    else {
      this.ShowChoosePretemplate = false;
      this.ShowPrintableFormOption = false;
    }
  }
  GetPreTemplateComponentList() {
    this._clnblService.GetPreTemplateComponentList().subscribe((res: DanpheHTTPResponse) => {
      if (res.Status === ENUM_DanpheHTTPResponses.OK) {
        if (res.Results && res.Results.length > 0) {
          this.PreTemplateList = res.Results;
        }
      }
      else {
        this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ['Failed to get Pre-Defined Component list.']);
      }
    });
  }
  GetAllClinicalTemplates() {
    this._clnblService.GetAllClinicalTemplates().subscribe((res: DanpheHTTPResponse) => {
      if (res.Status === ENUM_DanpheHTTPResponses.OK) {
        if (res.Results && res.Results.length > 0) {
          this.SmartPrintableTemplateList = res.Results;
        }
      }
      else {
        this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ['Failed to get printable template list.']);
      }
    });
  }

  public hotkeys(event: KeyboardEvent) {
    if (event.key === ENUM_EscapeKey.EscapeKey) {
      this.ClinicalHeadingField = new ClinicalHeadingField_DTO();
      this.CallbackAdd.emit({ action: "close", data: null });
    }
  }
}
