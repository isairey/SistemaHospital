// PatientVisitId will be added through this code

import { ChangeDetectorRef, Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { DanpheHTTPResponse } from '../../.../../../../shared/common-models';
import { MessageboxService } from '../../.../../../../shared/messagebox/messagebox.service';
import { ENUM_ClinicalField_InputType, ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status } from "../../.../../../../shared/shared-enums";
import { Patient_DTO } from '../../../../claim-management/shared/DTOs/patient.dto';
import { SmartPrintableFormComponent } from '../../../../clinical-new/reusable-component/reusable-elements/smart-printable-form/smart-printable-form.component';
import { ClinicalService } from '../../../../clinical-new/shared/clinical.service';
import { ClinicalReusableFreeTypeElement } from '../../../reusable-component/reusable-elements/free-type-element/free-type-element.component';
import { ClinicalReusableMultipleSelectionElement } from '../../../reusable-component/reusable-elements/multiple-selection-element/multiple-selection-element.component';
import { ClinicalReusableNumberElement } from '../../../reusable-component/reusable-elements/number-element/number-element.component';
import { QuestionaryWrapperComponent } from '../../../reusable-component/reusable-elements/questionary-wrapper/questionary-wrapper.component';
import { ClinicalReusableSelectionElement } from '../../../reusable-component/reusable-elements/selection-element/selection-element.component';
import { ClinicalReusableTextElement } from '../../../reusable-component/reusable-elements/text-element/text-element.component';
import { ClinicalData_DTO, ClinicalQuestionAnswer_DTO } from '../../../shared/clinical-info-preview/dto/clinical-data.dto';
import { ClinicalPatientService } from '../../../shared/clinical-patient.service';
import { ClinicalPreTemplateMappingService } from '../../../shared/clinical-pretemplate-mapping.service';
import { ClinicalNoteBLService } from '../../../shared/clinical.bl.service';
import { ChildHeading } from '../../../shared/dto/child-heading.dto';
import { GeneralizedOption } from '../../../shared/dto/dynamic-field-config.dto';
import { FieldOptions } from '../../../shared/dto/field-options.dto';
import { Field, PreviewConfiguration } from '../../../shared/dto/field.dto';
import { ParentHeading_DTO } from '../../../shared/dto/parent-heading.dto';
import { QuestionOption } from '../../../shared/dto/question-option.dto';
import { QuestionaryConfig } from '../../../shared/dto/questionary-config.dto';
import { QuestionarySingleSelectMultipleSelect } from '../../../shared/dto/questionary-singleselect-multiple-select.dto';
import { QuestionaryTextBoxFreeTypeNumber } from '../../../shared/dto/questionary-textbox-freetype-number.dto';
import { Questionary } from '../../../shared/dto/questionary.dto';
import { SingleSelectMultipleSelect } from '../../../shared/dto/singleselect-multipleselect.dto';
import { TextBoxFreeTypeNumber } from '../../../shared/dto/textbox-freetype-number.dto';

@Component({
  selector: 'field-form',
  templateUrl: './field-form.component.html',
  styleUrls: ['./field-form.component.css']
})
export class FieldFormComponent implements OnInit, IDynamicTab {

  DataContext: { patient: Patient_DTO, data: ParentHeading_DTO } | { patient: Patient_DTO, data: ChildHeading };
  @Output()
  OpenTab: EventEmitter<{ title: string, template: any, data: any, isCloseable?: boolean }> = new EventEmitter<{ title: string, template: any, data: any, isCloseable?: boolean }>();

  Form: FormGroup = new FormGroup({});
  Fields: Field[];
  DisableSave: boolean = false;

  //to get type from string
  PreTemplateMapping: any;
  TemplateCode: string = "";
  IsSaveBtnVisible: boolean = false;
  ClinicalInformation = new Array<ClinicalData_DTO>();

  ENUMClinicalFieldInputType = ENUM_ClinicalField_InputType;
  constructor(
    public MsgBoxServ: MessageboxService,
    public ClinicalBlservice: ClinicalNoteBLService,
    public FormBuilder: FormBuilder,
    public ClinicalPretemplateMapping: ClinicalPreTemplateMappingService,
    private _clinicalBLService: ClinicalNoteBLService,
    private _selectedPatientSer: ClinicalPatientService,
    private _messageBoxService: MessageboxService,
    private _changeDetectorRef: ChangeDetectorRef,
    private _clinicalService: ClinicalService

  ) {
    this.Form = this.FormBuilder.group({});
    this.Fields = [];
    this.PreTemplateMapping = this.ClinicalPretemplateMapping.PreTemplateMapping;
  }
  VisitTypeContext: any;


  OnDiscard() {
    this.Form.reset();
  }

  Load: boolean = false;
  ngOnInit() {

    if (this.DataContext) {
      this.Load = false
      this.Fields = this.DataContext.data.Field;
      this.CreateFieldConfig()
      this.CreatePreviewConfigObjForFieldAndQuestions();
      this.Load = true;
      this.LoadPatientData();


    };

  }

  LoadPatientData(isSave: boolean = false) {
    this._clinicalBLService.GetClinicalDataByVisitId(
      this._selectedPatientSer.SelectedPatient.PatientId,
      this._selectedPatientSer.SelectedPatient.PatientVisitId,
      // this.DataContext.data.ClinicalHeadingId
      null
    ).subscribe(
      (res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {

          this.ClinicalInformation = res.Results;
          this.ProcessClinicalInfoWithFieldConfig();
          if (isSave) {
            this.MsgBoxServ.showMessage(ENUM_MessageBox_Status.Success, ['Data Saved Successfully']);
          }
        }
        else {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [res.ErrorMessage]);
        }

      },
      err => {
        this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, err);
      }
    );
  }

  //assign preview config objects to hold data and states related to fields
  CreatePreviewConfigObjForFieldAndQuestions() {
    this.Fields.forEach(field => {
      field.PreviewConfig = new PreviewConfiguration();
      if (field.InputType === ENUM_ClinicalField_InputType.Questionnaire) {
        field.QuestionaryConfig.forEach(question => {
          question.PreviewConfig = new PreviewConfiguration();
        });
      }
    });

  }
  /**
   * This Method groups clinical data with respect to field and question
   * so that it can be easily accessed in the respective clinical component
   * (dynamic types)
   */
  ProcessClinicalInfoWithFieldConfig() {
    if (!this.Fields || this.Fields.length === 0) {
      this.Fields = [];
      return;
    }

    this.Fields.forEach(field => {
      //get clinical data for the field
      const clinicalInfosForField = this.ClinicalInformation.filter(info => info.FieldId === field.FieldId);
      switch (field.InputType) {
        //For non Questionary data types data is getting stored in the PreviewConfig Object inside same field
        //--> data will be in same format as ClinicalData_DTO[]
        case ENUM_ClinicalField_InputType.Textbox:
        case ENUM_ClinicalField_InputType.FreeType:
        case ENUM_ClinicalField_InputType.Number:
          field.PreviewConfig.FieldData = clinicalInfosForField;
          break;

        case ENUM_ClinicalField_InputType.SingleSelection:
        case ENUM_ClinicalField_InputType.MultipleSelect:
          field.PreviewConfig.FieldData = clinicalInfosForField.filter(info => info.ClinicalOptionsData && info.ClinicalOptionsData.length > 0);
          break;
        //for Questionary data type
        //if question type is Textbox, FreeType or Number then data is stored in ClinicalQuestionAnswers inside the question object 
        // --> Data will get converted into -->  ClinicalQuestionAnswer_DTO[] format
        //if question type is SingleSelect, MultipleSelect then data is stored in ClinicalQuestionOptions inside the question object
        // --> Data will get converted into --> ClinicalPreviewQuestionOptions[] format
        case ENUM_ClinicalField_InputType.Questionnaire:
          if (Array.isArray(field.QuestionaryConfig))
            field.QuestionaryConfig.forEach(question => {
              switch (question.AnswerType) {
                case ENUM_ClinicalField_InputType.Textbox:
                case ENUM_ClinicalField_InputType.FreeType:
                  const questionAnsData: ClinicalQuestionAnswer_DTO[][] = clinicalInfosForField.map(cliInfo => {
                    //sets inner data editable state based on transaction editable state
                    if (Array.isArray(cliInfo.ClinicalAnswerData)) {
                      //if a transaction editable then all the ans under it are also editable 
                      cliInfo.ClinicalAnswerData.forEach(a => {
                        a.IsEditable = cliInfo.IsEditable;
                      });
                      return cliInfo.ClinicalAnswerData;
                    }
                    else
                      return [];
                  }).filter(data => data && data.length > 0);//removes empty array from the list
                  question.ClinicalQuestionAnswers = this.extractTextAnswers(questionAnsData, question.QuestionId);
                  break;

                case ENUM_ClinicalField_InputType.SingleSelection:
                case ENUM_ClinicalField_InputType.MultipleSelect:
                  let qAnswerOptions = [];
                  clinicalInfosForField.forEach(cliInfo => {
                    if (cliInfo.ClinicalAnswerOptionData && cliInfo.ClinicalAnswerOptionData.length > 0) {
                      let qans = cliInfo.ClinicalAnswerOptionData.filter(ansdata => ansdata.QuestionId == question.QuestionId);
                      if (qans.length > 0) {
                        //if a transaction editable then all the options under it are also editable 
                        qAnswerOptions.push({
                          IsEditable: cliInfo.IsEditable,
                          IsInEditMode: false,
                          QuestionOptions: qans
                        });
                      }
                    }
                  });

                  question.ClinicalQuestionOptions = qAnswerOptions;
                  break;

                default:
                  console.warn('Unsupported AnswerType:', question.AnswerType);
                  break;
              }
            });
          else
            field.QuestionaryConfig = [];
          break;
      }
    });


  }

  /**
   * converts data into ClinicalQuestionAnswer_DTO[] format
   */
  private extractTextAnswers(cliInfosForQuestion: ClinicalQuestionAnswer_DTO[][], questionId: number): any[] {
    const qAnswers = [];
    if (Array.isArray(cliInfosForQuestion))
      cliInfosForQuestion.forEach(cliInfo => {
        if (Array.isArray(cliInfo)) {
          const qans = cliInfo.find(ansdata => ansdata.QuestionId === questionId);
          if (qans) {
            qAnswers.push(qans);
          }
        }
      });
    return qAnswers;
  }


  /*
    1. Creates form controls and form groups at the run time as per requirement
    2. Creates a list configuration objects which will get passed to the dynamic field
    these controls will bind to the dynamic field HTML Controls and can be accessed in this code to retrieve input values
  */
  CreateFieldConfig() {
    this.Fields.forEach(field => {
      let controlName = `${field.FieldId}`;
      switch (field.InputType) {

        case ENUM_ClinicalField_InputType.Textbox:
          this.Form.addControl(controlName, new FormControl(''));
          field.FieldConfig = {
            type: ClinicalReusableTextElement,
            key: controlName,
            label: field.FieldDisplayName,
            form: this.Form,
          };
          this.IsSaveBtnVisible = true;
          break;

        case ENUM_ClinicalField_InputType.FreeType:
          this.Form.addControl(controlName, new FormControl(''));
          field.FieldConfig = {
            type: ClinicalReusableFreeTypeElement,
            key: controlName,
            label: field.FieldDisplayName,
            form: this.Form,
          };
          this.IsSaveBtnVisible = true;
          break;

        case ENUM_ClinicalField_InputType.Number:
          this.Form.addControl(controlName, new FormGroup({
            number: new FormControl(''),
            remark: new FormControl(''),
          }));

          field.FieldConfig = {
            type: ClinicalReusableNumberElement,
            key: controlName,
            label: field.FieldDisplayName,
            form: this.Form,
          };
          this.IsSaveBtnVisible = true;
          break;

        case ENUM_ClinicalField_InputType.SingleSelection:
          this.Form.addControl(controlName, new FormGroup({
            option: new FormControl(''),
            remark: new FormControl(''),
          }));

          field.FieldConfig = {
            type: ClinicalReusableSelectionElement,
            key: controlName,
            label: field.FieldDisplayName,
            form: this.Form,
            options: this.getOptionsFromFieldOptions(field.Options),
          };
          this.IsSaveBtnVisible = true;
          break;

        case ENUM_ClinicalField_InputType.MultipleSelect:
          this.Form.addControl(controlName, new FormGroup({
            option: new FormControl(''),
            remark: new FormControl(''),
          }));

          field.FieldConfig = {
            type: ClinicalReusableMultipleSelectionElement,
            key: controlName,
            label: field.FieldDisplayName,
            form: this.Form,
            options: this.getOptionsFromFieldOptions(field.Options),
          };
          this.IsSaveBtnVisible = true;
          break;

        case ENUM_ClinicalField_InputType.SmartTemplate:
          field.FieldConfig = {
            type: this.PreTemplateMapping[field.Pretemplate],
            form: this.Form,
          };
          break;

        case ENUM_ClinicalField_InputType.Questionnaire:
          this.Form.addControl(controlName, new FormGroup({}));
          let group = this.Form.get(controlName) as FormGroup;
          this.GetQuestionaryConfig(field.QuestionaryConfig, group);

          field.FieldConfig = {
            type: QuestionaryWrapperComponent,
            key: controlName,
            label: field.FieldDisplayName,
            form: this.Form,
            questionaryConfig: null
          };
          this.IsSaveBtnVisible = true;
          break;

        case ENUM_ClinicalField_InputType.SmartPrintableForm:
          field.FieldConfig = {
            type: SmartPrintableFormComponent,
            IsPrintButton: true,
            templateCode: field.Options[0].Options      //! Sanjeev: Here, index 0 of list OPtions is used because there can be only one template for one section.
          };
          break;
      }
    })

  }

  /**     
  * 1. Creates form controls and form groups at the run time as per requirement
  * 2. Creates a list configuration objects which will get passed to the dynamic field
  *  these controls will bind to the dynamic field HTML Controls and can be accessed in this code to retrieve input values
  */

  GetQuestionaryConfig(questionaryConfig: QuestionaryConfig[], group: FormGroup) {
    let questionFields = [];

    questionaryConfig.forEach(question => {
      let controlName = `${question.QuestionId}`;
      switch (question.AnswerType) {

        case ENUM_ClinicalField_InputType.Textbox:
          group.addControl(controlName, new FormControl(''));
          question.FieldConfig = {
            type: ClinicalReusableTextElement,
            key: controlName,
            label: question.Question,
            form: group,
          };
          break;

        case ENUM_ClinicalField_InputType.FreeType:
          group.addControl(controlName, new FormControl(''));
          question.FieldConfig = {
            type: ClinicalReusableFreeTypeElement,
            key: controlName,
            label: question.Question,
            form: group,
          };
          break;

        case ENUM_ClinicalField_InputType.Number:
          group.addControl(controlName, new FormGroup({
            number: new FormControl(''),
            remark: new FormControl(''),
          }));

          question.FieldConfig = {
            type: ClinicalReusableNumberElement,
            key: controlName,
            label: question.Question,
            form: group,
          };
          break;

        case ENUM_ClinicalField_InputType.SingleSelection:
          group.addControl(controlName, new FormGroup({
            option: new FormControl(''),
            remark: new FormControl(''),
          }));

          question.FieldConfig = {
            type: ClinicalReusableSelectionElement,
            key: controlName,
            label: question.Question,
            form: group,
            options: this.GetOptionsFromQuestionOptions(question.Options),
          };
          break;

        case ENUM_ClinicalField_InputType.MultipleSelect:
          group.addControl(controlName, new FormGroup({
            option: new FormControl(''),
            remark: new FormControl(''),
          }));

          question.FieldConfig = {
            type: ClinicalReusableMultipleSelectionElement,
            key: controlName,
            label: question.Question,
            form: group,
            options: this.GetOptionsFromQuestionOptions(question.Options),
          };
          break;

      }
    });

  }


  /*
  1. Converts options to a generalized form (for reusable element)
  */
  getOptionsFromFieldOptions(fieldOptions: FieldOptions[]): GeneralizedOption[] {
    let Options: { label: string, value: string }[];
    Options = fieldOptions.map(option => ({ label: option.Options, value: `${option.ClinicalOptionId}` }));
    return Options;
  }
  GetOptionsFromQuestionOptions(questionOptions: QuestionOption[]): GeneralizedOption[] {
    let Options: { label: string, value: string }[];
    Options = questionOptions.map(option => ({ label: option.QuestionOptionText, value: `${option.QuestionOptionId}` }));
    return Options;
  }







  /*
  Following code reads data from the dynamic form and converts to required format, then sends data to api
  1. TextBox, FreeType and Number are treated equal
  2. SingleSelection and MultipleSelection are treated equal because of the same transaction table
  */

  OnSubmitDynamicFormData() {
    this.DisableSave = true;
    let data: {
      textBoxFreeTypeNumber: TextBoxFreeTypeNumber[],
      singleSelectMultipleSelect: SingleSelectMultipleSelect[],
      questionary: Questionary[]
    } = this.GetFormFieldData();

    this.PostFormFieldData(data);
  }

  PostFormFieldData(formFieldData: {
    textBoxFreeTypeNumber: TextBoxFreeTypeNumber[],
    singleSelectMultipleSelect: SingleSelectMultipleSelect[],
    questionary: Questionary[]
  }) {

    //Check if there is any data present in questionary type fields
    const hasValidQuestionaryData = formFieldData.questionary.some(question => {
      const hasValidFieldValue = question.QuestionaryData.singleSelectMultipleSelect.length > 0 ||
        question.QuestionaryData.textBoxFreeTypeNumber.length > 0;
      return hasValidFieldValue;
    });

    //Check if there is any data present in main fields
    const hasValidData = formFieldData.textBoxFreeTypeNumber.length > 0 ||
      formFieldData.singleSelectMultipleSelect.length > 0 ||
      hasValidQuestionaryData;

    //if there is no data present the show warning message
    if (!hasValidData) {
      this.MsgBoxServ.showMessage(ENUM_MessageBox_Status.Warning, ['No Data to Save.']);
      this.DisableSave = false;
      return;
    }
    this.ClinicalBlservice.PostFormFieldData(formFieldData).subscribe(
      (res) => {
        if (res.Status == ENUM_DanpheHTTPResponses.OK) {
          // this.MsgBoxServ.showMessage(ENUM_MessageBox_Status.Success, ['Data Saved Successfully']);
          this.OnDiscard();
          this.LoadPatientData(true);
        } else {
          this.MsgBoxServ.showMessage(ENUM_MessageBox_Status.Error, [res.ErrorMessage]);
        }

        this.DisableSave = false;
      },
      (err) => {
        this.MsgBoxServ.showMessage(ENUM_MessageBox_Status.Error, [err.ErrorMessage]);
        this.DisableSave = false;
      }
    );
  }


  /**
   * reads data from form object  and creates objects in required format for Main fields
   */
  GetFormFieldData(): {
    textBoxFreeTypeNumber: TextBoxFreeTypeNumber[],
    singleSelectMultipleSelect: SingleSelectMultipleSelect[],
    questionary: Questionary[]
  } {
    // let clinicalInformationList = [];
    let textBoxFreeTypeNumber: TextBoxFreeTypeNumber[] = [];
    let singleSelectMultipleSelect: SingleSelectMultipleSelect[] = [];
    let questionary: Questionary[] = [];

    this.Fields.forEach(element => {

      let InformationBase = {
        ClinicalInformationId: 0,
        PatientId: this.DataContext.patient.PatientId,
        PatientVisitId: this.DataContext.patient.PatientVisitId,
        ClinicalHeadingId: this.DataContext.data.ClinicalHeadingId,
        ParentHeadingId: this.DataContext.data.ParentId,
        FieldId: element.FieldId,
        InputType: element.InputType
      }
      let controlName = `${element.FieldId}`;
      switch (element.InputType) {
        case ENUM_ClinicalField_InputType.Number:
          if (this.Form.get(`${controlName}.number`).value !== "" && this.Form.get(`${controlName}.number`).value !== null)
            textBoxFreeTypeNumber.push(
              {
                ...InformationBase,
                FieldValue: this.Form.get(`${controlName}.number`).value,
                Remarks: this.Form.get(`${controlName}.remark`).value
              }
            );
          break;

        case ENUM_ClinicalField_InputType.Textbox:
          if (this.Form.get(`${controlName}`).value)
            textBoxFreeTypeNumber.push(
              {
                ...InformationBase,
                FieldValue: this.Form.get(`${controlName}`).value.trim(),
                Remarks: '',
              }
            );
          break;

        case ENUM_ClinicalField_InputType.FreeType:
          if (this.Form.get(`${controlName}`).value && this._clinicalService.CheckValidContent(this.Form.get(`${controlName}`).value))
            textBoxFreeTypeNumber.push(
              {
                ...InformationBase,
                FieldValue: this.Form.get(`${controlName}`).value.trim(),
                Remarks: '',
              }
            );
          break;

        case ENUM_ClinicalField_InputType.SingleSelection:
          if (this.Form.get(`${controlName}.option`).value)
            singleSelectMultipleSelect.push(
              {
                ...InformationBase,
                FieldValue: '',
                Remarks: this.Form.get(`${controlName}.remark`).value,
                OptionAnswers: [{
                  ClinicalOptionRecordId: 0,
                  OptionId: this.Form.get(`${controlName}.option`).value
                }]
              }
            );
          break;

        case ENUM_ClinicalField_InputType.MultipleSelect:
          if (this.Form.get(`${controlName}.option`).value)
            singleSelectMultipleSelect.push(
              {
                ...InformationBase,
                FieldValue: '',
                Remarks: this.Form.get(`${controlName}.remark`).value,
                OptionAnswers: this.Form.get(`${controlName}.option`).value.map(x => ({ ClinicalOptionRecordId: 0, OptionId: x }))

              }
            );
          break;

        case ENUM_ClinicalField_InputType.Questionnaire:
          questionary.push(
            {
              ...InformationBase,
              FieldValue: '',
              Remarks: '',
              QuestionaryData: this.GetQuestionaryData(element),
            }
          );
          break;

        case ENUM_ClinicalField_InputType.SmartTemplate:
          {
            // console.log(element);
            break;
          }
      }

    });

    let data: {
      textBoxFreeTypeNumber: TextBoxFreeTypeNumber[],
      singleSelectMultipleSelect: SingleSelectMultipleSelect[],
      questionary: Questionary[]
    } = {
      textBoxFreeTypeNumber: textBoxFreeTypeNumber,
      singleSelectMultipleSelect: singleSelectMultipleSelect,
      questionary: questionary
    }
    return data;
  }


  //reads data form Form and creates objects in required format for Questionary fields
  GetQuestionaryData(field: Field) {
    let textBoxFreeTypeNumber: QuestionaryTextBoxFreeTypeNumber[] = [];
    let singleSelectMultipleSelect: QuestionarySingleSelectMultipleSelect[] = [];


    field.QuestionaryConfig.forEach(element => {

      let controlName = `${element.FieldId}.${element.QuestionId}`
      switch (element.AnswerType) {

        case ENUM_ClinicalField_InputType.Number:
          if (this.Form.get(`${controlName}.number`).value !== "" && this.Form.get(`${controlName}.number`).value !== null)
            textBoxFreeTypeNumber.push(
              {
                ClinicalQuestionAnswerId: 0,
                QuestionId: element.QuestionId,
                AnswerType: element.AnswerType,
                AnswerValue: this.Form.get(`${controlName}.number`).value,
                Remarks: this.Form.get(`${controlName}.remark`).value,
              }
            );
          break;

        case ENUM_ClinicalField_InputType.Textbox:
          if (this.Form.get(`${controlName}`).value)
            textBoxFreeTypeNumber.push(
              {
                ClinicalQuestionAnswerId: 0,
                QuestionId: element.QuestionId,
                AnswerType: element.AnswerType,
                AnswerValue: this.Form.get(`${controlName}`).value.trim(),
                Remarks: '',
              }
            );
          break;

        case ENUM_ClinicalField_InputType.FreeType:
          if (this.Form.get(`${controlName}`).value && this._clinicalService.CheckValidContent(this.Form.get(`${controlName}`).value))
            textBoxFreeTypeNumber.push(
              {
                ClinicalQuestionAnswerId: 0,
                QuestionId: element.QuestionId,
                AnswerType: element.AnswerType,
                AnswerValue: this.Form.get(`${controlName}`).value.trim(),
                Remarks: '',
              }
            );
          break;

        case ENUM_ClinicalField_InputType.SingleSelection:
          if (this.Form.get(`${controlName}.option`).value)
            singleSelectMultipleSelect.push(
              {

                QuestionId: element.QuestionId,
                AnswerType: element.AnswerType,
                Remarks: this.Form.get(`${controlName}.remark`).value,
                OptionAnswers: [{ ClinicalAnswerOptionId: 0, QuestionOptionId: this.Form.get(`${controlName}.option`).value }]
              }
            );
          break;

        case ENUM_ClinicalField_InputType.MultipleSelect:
          if (this.Form.get(`${controlName}.option`).value)
            singleSelectMultipleSelect.push(
              {
                QuestionId: element.QuestionId,
                Remarks: this.Form.get(`${controlName}.remark`).value,
                AnswerType: element.AnswerType,
                OptionAnswers: this.Form.get(`${controlName}.option`).value.map(x => ({ ClinicalAnswerOptionId: 0, QuestionOptionId: x }))
              }
            );
          break;
      }

    });

    let questionaryData: {
      textBoxFreeTypeNumber: QuestionaryTextBoxFreeTypeNumber[],
      singleSelectMultipleSelect: QuestionarySingleSelectMultipleSelect[],
    } = {
      textBoxFreeTypeNumber: textBoxFreeTypeNumber,
      singleSelectMultipleSelect: singleSelectMultipleSelect,
    }
    return questionaryData
  }

  /**
   * This method destroys the instances of smart template components and recreates them
   */
  PreTemplateReloader: boolean = true;
  OnRefresh() {
    this.LoadPatientData();
    console.log('reload Pre template and Field Data');
    this.PreTemplateReloader = false;

    // Force change detection
    this._changeDetectorRef.detectChanges();

    // Delay to ensure proper reloading
    setTimeout(() => {
      this.PreTemplateReloader = true;
      this._changeDetectorRef.detectChanges();
    }, 0);
  }
}
