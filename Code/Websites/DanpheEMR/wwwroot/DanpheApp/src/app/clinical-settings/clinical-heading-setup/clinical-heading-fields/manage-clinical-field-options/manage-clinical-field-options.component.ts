import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ClinicalSettingsBLService } from '../../../../clinical-settings/shared/clinical-settings.bl.service';
import { CLNFieldOption_DTO, ClinicalFieldOption_DTO } from '../../../../clinical-settings/shared/dto/clinical-field-option.dto';
import { ClinicalFieldOptionDTO, ClinicalFieldQuestionaryOption_DTO } from '../../../../clinical-settings/shared/dto/clinical-field-questionary-option.dto';
import { ClinicalFieldQuestionary_DTO } from '../../../../clinical-settings/shared/dto/clinical-field-questionary.dto';
import { ClinicalHeadingField_DTO } from '../../../../clinical-settings/shared/dto/clinical-heading-field.dto';
import { CoreService } from '../../../../core/shared/core.service';
import { SecurityService } from '../../../../security/shared/security.service';
import { DanpheHTTPResponse } from '../../../../shared/common-models';
import { GridEmitModel } from '../../../../shared/danphe-grid/grid-emit.model';
import { SettingsGridColumnSettings } from '../../../../shared/danphe-grid/settings-grid-column-settings';
import { MessageboxService } from '../../../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponseText, ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status } from '../../../../shared/shared-enums';


@Component({
  selector: "manage-clinical-field-options",
  templateUrl: './manage-clinical-field-options.component.html'

})
export class ManageClinicalFieldOptions implements OnInit {
  CLNFieldOption = new ClinicalFieldOption_DTO();
  ClinicalFieldOptions: ClinicalFieldOption_DTO[] = [];
  SelectedClinicalOption = new ClinicalFieldOption_DTO();
  CLNFieldOptions: CLNFieldOption_DTO[] = [];
  ClinicalFieldOption = new ClinicalFieldOption_DTO();
  UpdateOptions: boolean = false;
  @Input('Show-FieldQuestionaryOptions')
  ShowFieldQuestionaryOptions: boolean;

  @Output('clinicalField-OptionsData')
  clinicalFieldOptionsData = new EventEmitter<Array<{ QuestionOption: string; }>>();

  @Output() closePopup: EventEmitter<void> = new EventEmitter<void>();

  @Input('Show-Flex') ShowFlex: boolean;
  @Input('Update') Update: boolean;
  public SetCLNQuestionaryOptionGridColumns: SettingsGridColumnSettings = null;

  public ClinicalQuestionaryOptionGridColumns: typeof SettingsGridColumnSettings.prototype.ClinicalQuestionOptionsGridColumns;
  public ClinicalFieldOptionGridColumns: typeof SettingsGridColumnSettings.prototype.ClinicalFieldOptionList;

  CLNFieldQuestionaryOptions = new Array<ClinicalFieldQuestionaryOption_DTO>();

  @Input('Selected-FieldOption')
  SelectedFieldOption: ClinicalHeadingField_DTO;
  public CLNFieldQuestionaryOptionsAdd: ClinicalFieldOptionDTO[] = [];
  public SelectedQuestionOption: ClinicalFieldOptionDTO = { QuestionOption: "", QuestionOptionId: 0, IsActive: true };

  @Input('Clinical-Field')
  ClinicalField: ClinicalFieldQuestionary_DTO = new ClinicalFieldQuestionary_DTO();
  Loading: boolean = false;

  @Output("Close-Popup")
  ClosePopup: EventEmitter<void> = new EventEmitter<void>();
  SelectedItem = new ClinicalFieldQuestionaryOption_DTO();

  ClinicalQuestionaryOption = new ClinicalFieldQuestionaryOption_DTO();
  ClinicalOption = new ClinicalFieldQuestionaryOption_DTO();
  ShowUpdate: boolean;

  constructor(public _clnSetblService: ClinicalSettingsBLService,
    private msgBoxServ: MessageboxService,
    public coreService: CoreService,
    public securityService: SecurityService,
    public changeDetector: ChangeDetectorRef
  ) {

    this.SetCLNQuestionaryOptionGridColumns = new SettingsGridColumnSettings(this.coreService.taxLabel, this.securityService);
    this.ClinicalQuestionaryOptionGridColumns = this.SetCLNQuestionaryOptionGridColumns.ClinicalQuestionOptionsGridColumns;
    this.ClinicalFieldOptionGridColumns = this.SetCLNQuestionaryOptionGridColumns.ClinicalFieldOptionList;

    this.GetClinicalFieldsQuestionaryOption();


  }

  ngOnInit(): void {
    if (this.ShowFieldQuestionaryOptions) {
      this.GetClinicalFieldOption();
    }

    this.UpdateOptionsData();
    this.SetValue();
    this.clinicalFieldOptionsData.emit(this.CLNFieldQuestionaryOptionsAdd);
    this.SetOptionValue();

  }
  public GetClinicalFieldsQuestionaryOption() {

    this._clnSetblService.GetClinicalFieldsQuestionaryOption()
      .subscribe(
        (res: DanpheHTTPResponse) => {
          if (res.Status === ENUM_DanpheHTTPResponses.OK) {
            if (res.Results) {
              this.CLNFieldQuestionaryOptions = res.Results;
              this.Loading = false;
              this.GetFilteredOptions();
            } else {
              this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Notice, ['No Data Found! For Questionnaire Options']);
              this.Loading = false;

            }

          }
          else {
            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ['Failed to get Questionnaire options, check log for details']);
            this.Loading = false;
          }

        });

  }

  GetFilteredOptions() {

    let questionId = this.ClinicalField.QuestionId;
    if (this.CLNFieldQuestionaryOptions && this.CLNFieldQuestionaryOptions.length > 0) {
      this.CLNFieldQuestionaryOptions
        .filter(option => option.QuestionId === questionId)
        .forEach(option => {
          this.CLNFieldQuestionaryOptionsAdd.push({
            QuestionOption: option.QuestionOption,
            QuestionOptionId: option.QuestionOptionId,
            IsActive: option.IsActive
          });
        });
    }
    this.UpdateOptionsData();
  }

  ClinicalQuestionaryOptionGridActions($event: GridEmitModel) {
    switch ($event.Action) {
      case "edit": {

        this.ShowUpdate = true;
        let index = this.CLNFieldQuestionaryOptionsAdd.findIndex(option => option.QuestionOption === $event.Data.QuestionOption);

        if (index !== -1) {
          this.SelectedQuestionOption = this.CLNFieldQuestionaryOptionsAdd[index];
        }

        this.ClinicalOption.CLNQuestionaryOptionValidator.patchValue({
          QuestionOption: this.SelectedQuestionOption.QuestionOption,
          QuestionOptionId: this.SelectedQuestionOption.QuestionOptionId
        });

        break;


      }
      case "deactivateClinicalFieldQuestionaryOption": {
        this.SelectedItem = $event.Data;
        this.ActivateClinicalFieldQuestionaryOption(this.SelectedItem);
        break;
      }

      case "activateClinicalFieldQuestionaryOption": {
        this.SelectedItem = $event.Data;
        this.ActivateClinicalFieldQuestionaryOption(this.SelectedItem);
        break;
      }

      default:
        break;

    }
  }
  ActivateClinicalFieldQuestionaryOption(selectedItem: ClinicalFieldQuestionaryOption_DTO) {

    const message = selectedItem.IsActive ? "Are you sure you want to deactivate this Clinical Heading Field Questionnaire? " : "Are you sure you want to activate this Clinical Heading Field Questionnaire?";
    if (window.confirm(message)) {
      this._clnSetblService
        .ClinicalFieldQuestionaryOptionActivation(selectedItem)
        .subscribe((res: DanpheHTTPResponse) => {
          if (res.Status === ENUM_DanpheHTTPResponses.OK) {
            this.CLNFieldQuestionaryOptionsAdd = [];
            this.GetClinicalFieldsQuestionaryOption();
            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Success, ['clinical field Questionnaire Option Status updated successfully']);
          } else {
            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ["Failed to update the Status of Clinical Questionnaire Option",]);
          }
        });
    }
  }

  SetValue() {
    if (this.ClinicalQuestionaryOption && this.ClinicalQuestionaryOption.QuestionOptionId !== 0) {
      this.ClinicalOption.CLNQuestionaryOptionValidator.patchValue({
        QuestionOption: this.ClinicalQuestionaryOption.QuestionOption,
      });
    }
  }


  AddClinicalFieldQuestionaryOption() {
    let questionOptionControl = this.ClinicalOption.CLNQuestionaryOptionValidator.get('QuestionOption');
    if (questionOptionControl && questionOptionControl.value && questionOptionControl.value.trim()) {
      let questionOptionValue = questionOptionControl.value.trim();
      const isDuplicate = this.CLNFieldQuestionaryOptionsAdd.some(option => option.QuestionOption.toLowerCase() === questionOptionValue.toLowerCase());
      if (isDuplicate) {
        this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, ["Duplicate options are not allowed"]);
      } else {
        let newOption = {
          QuestionOptionId: 0,
          QuestionOption: questionOptionValue,
          IsActive: true
        };
        this.CLNFieldQuestionaryOptionsAdd.push(newOption);
        this.ResetForm();
        this.UpdateOptionsData();
        this.clinicalFieldOptionsData.emit(this.CLNFieldQuestionaryOptionsAdd);
      }
    } else {
      this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, ["Invalid or empty QuestionOption control or value"]);

    }
  }
  UpdateOptionsData() {
    this.CLNFieldQuestionaryOptionsAdd = [...this.CLNFieldQuestionaryOptionsAdd];
  }
  UpdateClinicalQuestionaryOptions() {
    let questionOptionControl = this.ClinicalOption.CLNQuestionaryOptionValidator.get('QuestionOption');
    if (questionOptionControl && questionOptionControl.value && questionOptionControl.value.trim()) {
      let questionOptionValue = questionOptionControl.value.trim();

      const isDuplicate = this.CLNFieldQuestionaryOptionsAdd.some(option => option.QuestionOption.toLowerCase() === questionOptionValue.toLowerCase() && option.QuestionOptionId !== this.SelectedQuestionOption.QuestionOptionId);
      if (isDuplicate) {
        this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, ["This Option Already Added"]);
      } else {
        let index = this.CLNFieldQuestionaryOptionsAdd.findIndex((item) => item.QuestionOptionId === this.SelectedQuestionOption.QuestionOptionId);
        let obj = { QuestionOption: questionOptionValue, QuestionOptionId: this.SelectedQuestionOption.QuestionOptionId, IsActive: this.SelectedQuestionOption.IsActive };
        this.CLNFieldQuestionaryOptionsAdd[index] = obj;
        this.ResetForm();
        this.UpdateOptionsData();
        this.clinicalFieldOptionsData.emit(this.CLNFieldQuestionaryOptionsAdd);
        this.ShowUpdate = false;
      }
    } else {
      this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, ["Invalid or empty QuestionOption control or value"]);
    }
  }
  Close() {
    this.closePopup.emit();
  }
  ResetForm() {
    this.ClinicalOption.CLNQuestionaryOptionValidator.reset();
    this.ClinicalOption.QuestionOption = '';

  }
  ClearClinicalQuestionaryOptions() {
    this.ResetForm();
  }



  public GetClinicalFieldOption() {
    this._clnSetblService.GetClinicalFieldOption().subscribe(
      (res: any) => {
        if (res.Status === 'OK') {
          if (res.Results) {
            this.ClinicalFieldOptions = res.Results;
            this.Loading = false;
            this.GetFilteredFieldOptions();
          } else {
            this.msgBoxServ.showMessage('Notice', ['No Data Found! For Filed Options']);
            this.Loading = false;
          }
        } else {
          this.msgBoxServ.showMessage('Failed', ['Failed to get Field options, check log for details']);
          this.Loading = false;
        }
      }
    );
  }

  GetFilteredFieldOptions() {
    let fieldId = this.SelectedFieldOption.FieldId;
    this.CLNFieldOptions = [];
    if (this.ClinicalFieldOptions && this.ClinicalFieldOptions.length > 0) {
      this.ClinicalFieldOptions.filter(option => option.FieldId === fieldId)
        .forEach(option => {
          this.CLNFieldOptions.push({
            Options: option.Options,
            ClinicalOptionId: option.ClinicalOptionId,
            FieldId: option.FieldId,
            IsActive: option.IsActive
          });
        });
    }
  }

  ClinicalFieldOptionGridActions($event: GridEmitModel) {
    switch ($event.Action) {
      case "edit": {
        this.UpdateOptions = true;
        this.CLNFieldOption = $event.Data;
        this.SetOptionValue();
        this.changeDetector.detectChanges();
        break;
      }
      case "deactivateClinicalFieldOption": {
        this.SelectedClinicalOption = $event.Data;
        this.ActivateClinicalFieldOption(this.SelectedClinicalOption);
        break;
      }

      case "activateClinicalFieldOption": {
        this.SelectedClinicalOption = $event.Data;
        this.ActivateClinicalFieldOption(this.SelectedClinicalOption);
        break;
      }
    }
  }

  ActivateClinicalFieldOption(selectedItem: ClinicalFieldOption_DTO) {

    const message = selectedItem.IsActive ? "Are you sure you want to deactivate this Clinical Field Option? " : "Are you sure you want to activate this Clinical Field Option?";
    if (window.confirm(message)) {
      this._clnSetblService
        .ClinicalFieldOptionActivation(selectedItem)
        .subscribe((res: DanpheHTTPResponse) => {
          if (res.Status === ENUM_DanpheHTTPResponses.OK) {
            this.GetClinicalFieldOption();
            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Success, ['clinical field Option Status updated successfully']);
          } else {
            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ["Failed to update the Status of Clinical Field Option",]);
          }
        });
    }
  }
  SetOptionValue() {
    if (this.CLNFieldOption && this.CLNFieldOption.ClinicalOptionId !== 0) {
      this.UpdateOptions = true;

      this.ClinicalFieldOption.CLNFieldOptionsValidator.patchValue({
        Options: this.CLNFieldOption.Options,
        FieldId: this.ClinicalField.FieldId,
      });
    }

  }

  ResetOptionForm() {
    this.ClinicalFieldOption.CLNFieldOptionsValidator.reset();

  }
  ClearClinicalFieldOption() {
    this.ResetOptionForm();
  }
  AddClinicalFieldOptions() {

    for (let i in this.ClinicalFieldOption.CLNFieldOptionsValidator.controls) {
      this.ClinicalFieldOption.CLNFieldOptionsValidator.controls[i].markAsDirty();
      this.ClinicalFieldOption.CLNFieldOptionsValidator.controls[
        i
      ].updateValueAndValidity();
    }

    if (this.ClinicalFieldOption.IsValidCheck(undefined, undefined)) {
      let updatedValue = this.ClinicalFieldOption.CLNFieldOptionsValidator.value;
      updatedValue.FieldId = this.SelectedFieldOption.FieldId;

      this._clnSetblService.AddClinicalFieldOptions(updatedValue).subscribe(
        (res: DanpheHTTPResponse) => {
          if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Success, [
              "Clinical filed Option Added",
            ]);

            this.ResetOptionForm();
            this.GetClinicalFieldOption();


          } else {
            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, [
              "Clinical filed Option not Added",
            ]);
          }
        },
        (err) => {
          this.logError(err);
        }
      );
    } else {
      this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, [
        "some data are invalid.",
      ]);
    }

  }

  logError(err: any) {
    this.msgBoxServ.showMessage(ENUM_DanpheHTTPResponses.Failed, [err]);
  }

  UpdateClinicalFieldOption() {
    for (let i in this.ClinicalFieldOption.CLNFieldOptionsValidator.controls) {
      this.ClinicalFieldOption.CLNFieldOptionsValidator.controls[i].markAsDirty();
      this.ClinicalFieldOption.CLNFieldOptionsValidator.controls[i].updateValueAndValidity();
    }

    if (this.ClinicalFieldOption.IsValidCheck(undefined, undefined)) {

      let updatedValue = this.ClinicalFieldOption.CLNFieldOptionsValidator.value;
      updatedValue.ClinicalOptionId = this.CLNFieldOption.ClinicalOptionId;
      updatedValue.FieldId = this.SelectedFieldOption.FieldId;

      this._clnSetblService
        .UpdateClinicalFieldOption(updatedValue)
        .subscribe((res: DanpheHTTPResponse) => {
          if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Success, [
              "ClinicalFiled Option Updated successfully.",
            ]);
            this.ResetOptionForm();
            this.GetClinicalFieldOption();
            this.UpdateOptions = false;

          } else {
            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, [
              "failed to update ClinicalFiled Option",
            ]);
          }

        });

    }
  }
}
