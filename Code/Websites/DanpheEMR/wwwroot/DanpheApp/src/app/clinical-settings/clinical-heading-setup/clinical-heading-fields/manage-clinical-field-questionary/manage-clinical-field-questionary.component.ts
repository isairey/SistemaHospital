import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ClinicalSettingsBLService } from '../../../../clinical-settings/shared/clinical-settings.bl.service';

import { ClinicalQuestionaryOption_DTO } from '../../../../clinical-settings/shared/dto/clinical-field-questionary-option.dto';
import { CLNFieldQuestionary_DTO, ClinicalFieldQuestionaryOptionAddDTO, ClinicalFieldQuestionary_DTO } from '../../../../clinical-settings/shared/dto/clinical-field-questionary.dto';
import { ClinicalHeadingField_DTO } from '../../../../clinical-settings/shared/dto/clinical-heading-field.dto';
import { CoreService } from '../../../../core/shared/core.service';
import { SecurityService } from '../../../../security/shared/security.service';
import { DanpheHTTPResponse } from '../../../../shared/common-models';
import { GridEmitModel } from '../../../../shared/danphe-grid/grid-emit.model';
import { SettingsGridColumnSettings } from '../../../../shared/danphe-grid/settings-grid-column-settings';
import { MessageboxService } from '../../../../shared/messagebox/messagebox.service';
import { ENUM_ClinicalFieldQuestionaryOption_DynamicGrid, ENUM_ClinicalFieldQuestionary_AnswerType, ENUM_DanpheHTTPResponseText, ENUM_DanpheHTTPResponses, ENUM_EscapeKey, ENUM_MessageBox_Status } from '../../../../shared/shared-enums';



@Component({
  selector: "manage-clinical-field-questionary",
  templateUrl: './manage-clinical-field-questionary.component.html',
  host: { '(window:keydown)': 'hotkeys($event)' }
})
export class ManageClinicalFieldQuestionary implements OnInit {


  @Input('Selected-FieldName') SelectedFieldName: ClinicalHeadingField_DTO;

  @Output("callback-add")
  CallbackAdd: EventEmitter<Object> = new EventEmitter<Object>();

  @Output("callback-close")
  CallbackClose: EventEmitter<Object> = new EventEmitter<Object>();
  @Output() closePopup: EventEmitter<void> = new EventEmitter<void>();

  public ClinicalQuestionaryGridColumns: typeof SettingsGridColumnSettings.prototype.ClinicalFieldQuestionaryGridColumns;
  public SetCLNQuestionaryGridColumns: SettingsGridColumnSettings = null;
  ClinicalHeadingFields = new Array<ClinicalHeadingField_DTO>();
  Loading: boolean = false;
  Update: boolean;
  ShowFlex: boolean = false;

  SelectedAnswerType = false;
  SelectedItem = new ClinicalFieldQuestionary_DTO();
  ClinicalField = new ClinicalFieldQuestionary_DTO();
  ClinicalFieldQuestionary = new ClinicalFieldQuestionary_DTO();
  AnswerType = Object.values(ENUM_ClinicalFieldQuestionary_AnswerType);
  DynamicGridForOption = Object.values(ENUM_ClinicalFieldQuestionary_AnswerType);
  GridClass = ENUM_ClinicalFieldQuestionaryOption_DynamicGrid.GridClass;
  PrimaryGridClass = ENUM_ClinicalFieldQuestionaryOption_DynamicGrid.PrimaryGridClass;
  SecondaryGridClass = ENUM_ClinicalFieldQuestionaryOption_DynamicGrid.SecondaryGridClass;
  DefaultFormGridClass = ENUM_ClinicalFieldQuestionaryOption_DynamicGrid.DefaultFormGridClass;
  CLNFieldQuestionary = new Array<ClinicalFieldQuestionary_DTO>();
  CLNFieldQuestion: CLNFieldQuestionary_DTO[] = [];
  public CLNFieldQuestionaryOptionsAdd: ClinicalFieldQuestionaryOptionAddDTO[] = [];

  constructor(public _clnSetblService: ClinicalSettingsBLService,
    private msgBoxServ: MessageboxService,
    public coreService: CoreService,
    public securityService: SecurityService,
    public changeDetector: ChangeDetectorRef
  ) {

    this.SetCLNQuestionaryGridColumns = new SettingsGridColumnSettings(this.coreService.taxLabel, this.securityService);
    this.ClinicalQuestionaryGridColumns = this.SetCLNQuestionaryGridColumns.ClinicalFieldQuestionaryGridColumns;
    this.GetClinicalFieldQuestionary();
    this.GetClinicalHeadingFieldSetup();
  }
  ngOnInit(): void {
    this.SetValue();
  }

  OnAnswerTypeSelected(AnswerType: string) {
    this.ShowFlex = AnswerType === 'Single Selection' || AnswerType === 'Multiple Select';
    if (this.ShowFlex) {
      this.GridClass = ENUM_ClinicalFieldQuestionaryOption_DynamicGrid.SecondaryGridClass;
      this.PrimaryGridClass = ENUM_ClinicalFieldQuestionaryOption_DynamicGrid.GridClass;
      this.DefaultFormGridClass = ENUM_ClinicalFieldQuestionaryOption_DynamicGrid.SecondaryGridClass;
    } else {
      this.DefaultFormGridClass = ENUM_ClinicalFieldQuestionaryOption_DynamicGrid.DefaultFormGridClass;
      this.PrimaryGridClass = ENUM_ClinicalFieldQuestionaryOption_DynamicGrid.PrimaryGridClass;
    }
  }
  OnClinicalFieldOptionsAdded(options: ClinicalFieldQuestionaryOptionAddDTO[]) {
    this.CLNFieldQuestionaryOptionsAdd = options;
  }
  public GetClinicalFieldQuestionary() {
    this._clnSetblService.GetClinicalFieldQuestionary()
      .subscribe(
        (res: DanpheHTTPResponse) => {
          if (res.Status === ENUM_DanpheHTTPResponses.OK) {
            if (res.Results) {
              this.CLNFieldQuestionary = res.Results;
              this.Loading = false;
              this.GetFilteredClinicalFieldQuestionary();
            } else {
              this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Notice, ['No Data Found!']);
              this.Loading = false;
            }

          }
          else {
            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ['Failed to get Questionnaire, check log for details']);
            this.Loading = false;
          }

        });
  }
  GetFilteredClinicalFieldQuestionary() {
    let fieldId = this.SelectedFieldName.FieldId;
    this.CLNFieldQuestion = [];
    if (this.CLNFieldQuestionary && this.CLNFieldQuestionary.length > 0) {
      this.CLNFieldQuestionary.filter(option => option.FieldId === fieldId)
        .forEach(option => {
          this.CLNFieldQuestion.push({
            Question: option.Question,
            FieldId: option.FieldId,
            IsActive: option.IsActive,
            AnswerType: option.AnswerType,
            QuestionId: option.QuestionId
          });
        });
    }
  }
  GetClinicalHeadingFieldSetup() {
    this._clnSetblService.GetClinicalHeadingFieldSetup().subscribe(res => {
      if (res.Status === ENUM_DanpheHTTPResponses.OK) {
        this.ClinicalHeadingFields = res.Results;
      }
      else {
        this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ['Failed to get Clinical Field data, check log for details']);
      }
    });
  }
  ClinicalFieldQuestionaryGridActions($event: GridEmitModel) {
    switch ($event.Action) {
      case "edit": {
        this.Update = true;

        this.ClinicalField = $event.Data;
        this.ShowFlex = this.ClinicalField.AnswerType === 'Single Selection' || this.ClinicalField.AnswerType === 'Multiple Select';
        if (this.ShowFlex) {
          this.GridClass = ENUM_ClinicalFieldQuestionaryOption_DynamicGrid.SecondaryGridClass;
          this.PrimaryGridClass = ENUM_ClinicalFieldQuestionaryOption_DynamicGrid.GridClass;
          this.DefaultFormGridClass = ENUM_ClinicalFieldQuestionaryOption_DynamicGrid.SecondaryGridClass;
          this.SelectedAnswerType = true;

        } else {
          this.GridClass = ENUM_ClinicalFieldQuestionaryOption_DynamicGrid.GridClass;
          this.DefaultFormGridClass = ENUM_ClinicalFieldQuestionaryOption_DynamicGrid.DefaultFormGridClass;
          this.PrimaryGridClass = ENUM_ClinicalFieldQuestionaryOption_DynamicGrid.PrimaryGridClass;
          this.SelectedAnswerType = false;
        }
        this.SelectedFieldName = this.ClinicalHeadingFields.find(field => field.FieldId === this.ClinicalField.FieldId);

        this.SetValue();
        this.changeDetector.detectChanges();

        break;
      }

      case "deactivateClinicalFieldQuestionary": {
        this.SelectedItem = $event.Data;
        this.ActivateClinicalFieldQuestionary(this.SelectedItem);
        break;
      }

      case "activateClinicalFieldQuestionary": {
        this.SelectedItem = $event.Data;
        this.ActivateClinicalFieldQuestionary(this.SelectedItem);
        break;
      }
      default:
        break;

    }

  }

  ActivateClinicalFieldQuestionary(selectedItem: ClinicalFieldQuestionary_DTO) {

    const message = selectedItem.IsActive ? "Are you sure you want to deactivate this Clinical Heading Field Questionnaire? " : "Are you sure you want to activate this Clinical Heading Field Questionnaire?";
    if (window.confirm(message)) {
      this._clnSetblService
        .ClinicalFieldQuestionaryActivation(selectedItem)
        .subscribe((res: DanpheHTTPResponse) => {
          if (res.Status === ENUM_DanpheHTTPResponses.OK) {
            this.GetClinicalFieldQuestionary();
            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Success, ['clinical field Questionnaire Status updated successfully']);
          } else {
            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ["failed to Change status",]);
          }
        });
    }
  }
  SetValue() {
    if (this.ClinicalField && this.ClinicalField.QuestionId !== 0) {
      const matchingField = this.ClinicalHeadingFields.find(field => field.FieldId === this.ClinicalField.FieldId);

      this.ClinicalFieldQuestionary.CLNFieldQuestionaryValidator.patchValue({
        FieldId: matchingField ? matchingField.FieldId : '',
        Question: this.ClinicalField.Question,
        AnswerType: this.ClinicalField.AnswerType,
      });
    }

  }

  AddClinicalFieldQuestionary() {
    if (!this.ShowFlex) {
      this.GridClass = ENUM_ClinicalFieldQuestionaryOption_DynamicGrid.GridClass;
      this.PrimaryGridClass = ENUM_ClinicalFieldQuestionaryOption_DynamicGrid.PrimaryGridClass;
    }
    if (this.ShowFlex && this.CLNFieldQuestionaryOptionsAdd.length == 0) {
      this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, [
        "Options are Compulsory for Single selection or Multiple select Answer Type",
      ]);
      return;
    }

    for (let i in this.ClinicalFieldQuestionary.CLNFieldQuestionaryValidator.controls) {
      this.ClinicalFieldQuestionary.CLNFieldQuestionaryValidator.controls[i].markAsDirty();
      this.ClinicalFieldQuestionary.CLNFieldQuestionaryValidator.controls[
        i
      ].updateValueAndValidity();
    }

    if (this.ClinicalFieldQuestionary.IsValidCheck(undefined, undefined)) {

      let updatedValue: ClinicalQuestionaryOption_DTO = {

        QuestionId: this.ClinicalField.QuestionId ? this.ClinicalField.QuestionId : 0,
        Question: this.ClinicalFieldQuestionary.CLNFieldQuestionaryValidator.value.Question,
        AnswerType: this.ClinicalFieldQuestionary.CLNFieldQuestionaryValidator.value.AnswerType,
        FieldId: this.SelectedFieldName.FieldId,

        QuestionOptions: this.CLNFieldQuestionaryOptionsAdd.map(option => ({
          QuestionOptionId: option.QuestionOptionId ? option.QuestionOptionId : 0,
          QuestionOption: option.QuestionOption

        })),
      };

      this._clnSetblService.AddClinicalFieldQuestionary(updatedValue).subscribe(
        (res: DanpheHTTPResponse) => {
          if (res.Status == 'Failed') {
            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, [
              res.ErrorMessage,
            ]);
            return;
          }
          if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Success, [
              "Questionnaire Record Added Successfully",

            ]);
            this.GetClinicalFieldQuestionary();

            this.ClinicalFieldQuestionary = new ClinicalFieldQuestionary_DTO();
            this.ShowFlex = false;
            this.GridClass = ENUM_ClinicalFieldQuestionaryOption_DynamicGrid.GridClass;
            this.PrimaryGridClass = ENUM_ClinicalFieldQuestionaryOption_DynamicGrid.PrimaryGridClass;
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
  public hotkeys(event: KeyboardEvent) {
    if (event.key === ENUM_EscapeKey.EscapeKey) {
      this.closePopup.emit();
    }
  }
  Close() {
    this.closePopup.emit();
  }
  ResetForm() {
    this.ClinicalFieldQuestionary.CLNFieldQuestionaryValidator.reset();

  }
  ClearClinicalQuestionary() {
    this.ResetForm();
    this.ShowFlex = false;
    this.GridClass = ENUM_ClinicalFieldQuestionaryOption_DynamicGrid.GridClass;
    this.DefaultFormGridClass = ENUM_ClinicalFieldQuestionaryOption_DynamicGrid.DefaultFormGridClass;
    this.PrimaryGridClass = ENUM_ClinicalFieldQuestionaryOption_DynamicGrid.PrimaryGridClass;
  }
}
