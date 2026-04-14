import { Component, OnInit } from "@angular/core";
import { FormGroup } from "@angular/forms";
import { DanpheHTTPResponse } from "../../../../shared/common-models";
import { MessageboxService } from "../../../../shared/messagebox/messagebox.service";
import { ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status } from "../../../../shared/shared-enums";
import { ClinicalData_DTO, ClinicalOptions_DTO, ClinicalQuestionOption_DTO } from "../../../shared/clinical-info-preview/dto/clinical-data.dto";
import { QSingleSelectMultipleSelect } from "../../../shared/clinical-info-preview/dto/clinical-put-data.dto";
import { ClinicalPatientService } from "../../../shared/clinical-patient.service";
import { ClinicalNoteBLService } from "../../../shared/clinical.bl.service";
import { Field } from "../../../shared/dto/field.dto";
import { QuestionaryConfig } from "../../../shared/dto/questionary-config.dto";
import { SingleSelectMultipleSelect } from "../../../shared/dto/singleselect-multipleselect.dto";
import { IDynamicElement } from "../dynamic-field.interface";

@Component({
    selector: 'multiple-selection-element',
    templateUrl: './multiple-selection-element.component.html',
    styleUrls: ["../reusable-elements.component.css"]
})
export class ClinicalReusableMultipleSelectionElement implements OnInit, IDynamicElement {
    Field: Field;
    // FieldConfig: MultipleSelectConfig;
    Question: QuestionaryConfig;
    IsQuestion: boolean = false;
    NestedFormGroup: FormGroup;
    FormControlOption: string;
    FormControlRemark: string;
    constructor(
        private _messageBoxService: MessageboxService,
        private _selectedPatientSer: ClinicalPatientService,
        private _clinicalBLService: ClinicalNoteBLService,
    ) {

    }
    ngOnInit() {
        if (this.Question) {
            this.IsQuestion = true;
            this.NestedFormGroup = this.Question.FieldConfig.form.get(`${this.Question.FieldConfig.key}`) as FormGroup;
            this.FormControlOption = 'option'
            this.FormControlRemark = 'remark'
        } else if (this.Field) {
            this.NestedFormGroup = this.Field.FieldConfig.form.get(`${this.Field.FieldConfig.key}`) as FormGroup;
            this.FormControlOption = 'option'
            this.FormControlRemark = 'remark'
        }
    }
    EditMode = false;
    EditingFieldData: ClinicalData_DTO;
    EditField(field: Field, data: ClinicalData_DTO) {
        this.ResetForm(this.Field.FieldConfig.form);

        let options = data.ClinicalOptionsData.map(option => { return `${option.OptionId}`; });
        field.FieldConfig.form.get(`${field.FieldId}.option`).patchValue(options);
        field.FieldConfig.form.get(`${field.FieldId}.remark`).patchValue(data.Remarks);
        this.EditingFieldData = data;
        this.EditMode = true;

    }
    UpdateFieldValue() {
        let singleSelectMultipleSelect = new SingleSelectMultipleSelect();

        singleSelectMultipleSelect = {
            ClinicalInformationId: this.EditingFieldData.ClinicalInformationId,
            PatientId: this._selectedPatientSer.SelectedPatient.PatientId,
            PatientVisitId: this._selectedPatientSer.SelectedPatient.PatientId,
            ClinicalHeadingId: null,
            ParentHeadingId: null,
            FieldId: null,
            InputType: null,
            FieldValue: '',
            Remarks: this.Field.FieldConfig.form.get(`${this.Field.FieldId}.remark`).value,
            OptionAnswers: null
        };
        singleSelectMultipleSelect.OptionAnswers = this.Field.FieldConfig.form.get(`${this.Field.FieldId}.option`).value ?
            this.Field.FieldConfig.form.get(`${this.Field.FieldId}.option`).value.map(x => ({ ClinicalOptionRecordId: 0, OptionId: x })) :
            [];
        if (singleSelectMultipleSelect.OptionAnswers.length > 0) {
            this._clinicalBLService.PutFieldSingleSelectMultipleSelect(singleSelectMultipleSelect).subscribe(
                (res: DanpheHTTPResponse) => {
                    if (res.Status === ENUM_DanpheHTTPResponses.OK) {
                        if (res.Results) {
                            let updatedOptions: ClinicalOptions_DTO[] = res.Results;
                            this.EditingFieldData.Remarks = singleSelectMultipleSelect.Remarks;
                            updatedOptions.forEach(option => {
                                option.Options = this.Field.Options.find(opt => opt.ClinicalOptionId === option.OptionId) ? this.Field.Options.find(opt => opt.ClinicalOptionId === option.OptionId).Options : null;
                            });

                            this.EditingFieldData.ClinicalOptionsData = updatedOptions;
                            this.EditMode = false;
                            this.ResetForm(this.Field.FieldConfig.form);
                        } else {
                            this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ["Updated Option List is Empty"]);
                        }
                        this._messageBoxService.showMessage(ENUM_MessageBox_Status.Success, ["Updated the field successfully"]);
                    }
                    else {
                        this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ["Failed to update the field"]);
                    }
                },
                err => {
                    this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ["Failed to update the field"]);
                    console.error(err);
                }
            );
        } else {
            this._messageBoxService.showMessage(ENUM_MessageBox_Status.Warning, ["Data Can't be empty!"]);
        }
    }

    DeleteFieldValue(field: Field, data: ClinicalData_DTO) {
        let OptionAnswers = data.ClinicalOptionsData.map(option => option.ClinicalOptionRecordId)

        this._clinicalBLService.DeleteFieldSingleSelectMultipleSelect(OptionAnswers).subscribe(
            (res: DanpheHTTPResponse) => {
                if (res.Status === ENUM_DanpheHTTPResponses.OK) {

                    data.ClinicalOptionsData = [];
                    this._messageBoxService.showMessage(ENUM_MessageBox_Status.Success, ["Data deleted successfully"]);
                }
                else {
                    this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ["Failed to delete data"]);
                }
            },
            err => {
                this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ["Failed to delete data"]);
                console.error(err);
            }
        );

    }
    CancelUpdate() {
        this.EditMode = false;
        this.EditingFieldData = null;
        this.ResetForm(this.Field.FieldConfig.form);
    }
    ResetForm(form) {
        form.reset();
    }



    EditingQuestionData: ClinicalQuestionOption_DTO[];

    EditQuestionField(question: QuestionaryConfig, options: { IsInEditMode: boolean, QuestionOptions: ClinicalQuestionOption_DTO[]; }) {
        this.ResetForm(this.Question.FieldConfig.form);

        let qoptions = options.QuestionOptions.map(option => { return `${option.QuestionOptionId}`; });
        question.FieldConfig.form.get(`${question.QuestionId}.option`).patchValue(qoptions);
        question.FieldConfig.form.get(`${question.QuestionId}.remark`).patchValue(options.QuestionOptions[0].Remarks);
        this.EditMode = true;
        this.EditingQuestionData = options.QuestionOptions;

    }
    UpdateQuestionFieldValue() {
        let singleSelectMultipleSelect = new QSingleSelectMultipleSelect();
        singleSelectMultipleSelect = {
            ClinicalInformationId: this.EditingQuestionData[0].ClinicalInformationId,
            PatientId: this._selectedPatientSer.SelectedPatient.PatientId,
            PatientVisitId: this._selectedPatientSer.SelectedPatient.PatientVisitId,
            ClinicalHeadingId: null,
            ParentHeadingId: null,
            FieldId: null,
            InputType: null,
            FieldValue: '',
            Remarks: '',
            QuestionarySingleSelectMultipleSelectData: null,
        };

        singleSelectMultipleSelect.QuestionarySingleSelectMultipleSelectData = {
            QuestionId: this.Question.QuestionId,
            AnswerType: this.Question.AnswerType,
            Remarks: this.Question.FieldConfig.form.get(`${this.Question.QuestionId}.remark`).value,
            OptionAnswers: this.Question.FieldConfig.form.get(`${this.Question.QuestionId}.option`).value ?
                this.Question.FieldConfig.form.get(`${this.Question.QuestionId}.option`).value.map(x => ({ ClinicalAnswerOptionId: 0, QuestionOptionId: x })) :
                []
        };

        if (singleSelectMultipleSelect.QuestionarySingleSelectMultipleSelectData.OptionAnswers.length > 0) {
            this._clinicalBLService.PutQFieldSingleSelectMultipleSelect(singleSelectMultipleSelect).subscribe(
                (res: DanpheHTTPResponse) => {
                    if (res.Status === ENUM_DanpheHTTPResponses.OK) {

                        if (res.Results) {
                            let updatedOptions: ClinicalQuestionOption_DTO[] = res.Results;

                            updatedOptions.forEach(option => {
                                option.QuestionOption = this.Question.Options.find(opt => opt.QuestionOptionId === option.QuestionOptionId) ?
                                    this.Question.Options.find(opt => opt.QuestionOptionId === option.QuestionOptionId).QuestionOptionText : null;
                            });
                            // while (this.EditingQuestionData.length > 0) {
                            //     this.EditingQuestionData.pop();
                            // }
                            this.EditingQuestionData.length = 0;
                            updatedOptions.forEach(option => {
                                this.EditingQuestionData.push(option);
                            })
                            this.EditMode = false;
                            this.ResetForm(this.Question.FieldConfig.form);
                            this._messageBoxService.showMessage(ENUM_MessageBox_Status.Success, ["Updated the field successfully"]);
                        } else {
                            this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ["Updated Option List is Empty"]);
                        }

                    }
                    else {
                        this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ["Failed to update the field"]);
                    }
                },
                err => {
                    this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ["Failed to update the field"]);
                    console.error(err);
                }
            );
        } else {
            this._messageBoxService.showMessage(ENUM_MessageBox_Status.Warning, ["Data Can't be empty!"]);
        }
    }

    DeleteQuestionFieldValue(question: QuestionaryConfig, options: { IsInEditMode: boolean, QuestionOptions: ClinicalQuestionOption_DTO[]; }) {

        let OptionAnswers = options.QuestionOptions.map(option => option.ClinicalAnswerOptionId)
        this._clinicalBLService.DeleteQFieldSingleSelectMultipleSelect(OptionAnswers).subscribe(
            (res: DanpheHTTPResponse) => {
                if (res.Status === ENUM_DanpheHTTPResponses.OK) {

                    options.QuestionOptions = [];
                    this._messageBoxService.showMessage(ENUM_MessageBox_Status.Success, ["Data deleted successfully"]);
                }
                else {
                    this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ["Failed to delete data"]);
                }
            },
            err => {
                this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ["Failed to delete data"]);
                console.error(err);
            }
        );

    }

    CancelQuestionUpdate() {
        this.EditMode = false;
        this.EditingQuestionData = null;
        this.ResetForm(this.Question.FieldConfig.form);
    }
}

