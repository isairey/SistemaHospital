import { Component, OnInit } from "@angular/core";
import { FormGroup } from "@angular/forms";
import { DanpheHTTPResponse } from "../../../../shared/common-models";
import { MessageboxService } from "../../../../shared/messagebox/messagebox.service";
import { ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status } from "../../../../shared/shared-enums";
import { ClinicalData_DTO, ClinicalQuestionAnswer_DTO } from "../../../shared/clinical-info-preview/dto/clinical-data.dto";
import { QTextBoxFreeTypeNumber } from "../../../shared/clinical-info-preview/dto/clinical-put-data.dto";
import { ClinicalPatientService } from "../../../shared/clinical-patient.service";
import { ClinicalNoteBLService } from "../../../shared/clinical.bl.service";
import { Field } from "../../../shared/dto/field.dto";
import { QuestionaryConfig } from "../../../shared/dto/questionary-config.dto";
import { TextBoxFreeTypeNumber } from "../../../shared/dto/textbox-freetype-number.dto";
import { IDynamicElement } from "../dynamic-field.interface";


@Component({
    selector: "number-element",
    templateUrl: "./number-element.component.html",
    styleUrls: ["../reusable-elements.component.css"]
})
export class ClinicalReusableNumberElement implements OnInit, IDynamicElement {
    Field: Field;
    Question: QuestionaryConfig;
    IsQuestion: boolean = false;
    // FieldConfig: NumberConfig;
    NestedFormGroup: FormGroup;
    FormControlNumber: string;
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
            this.FormControlNumber = 'number'
            this.FormControlRemark = 'remark'
        } else if (this.Field) {
            this.NestedFormGroup = this.Field.FieldConfig.form.get(`${this.Field.FieldConfig.key}`) as FormGroup;
            this.FormControlNumber = 'number'
            this.FormControlRemark = 'remark'
        }

    }

    EditField(field: Field, data: ClinicalData_DTO) {

        this.ResetForm(this.Field.FieldConfig.form);

        field.FieldConfig.form.get(`${field.FieldId}.number`).patchValue(data.FieldValue);
        field.FieldConfig.form.get(`${field.FieldId}.remark`).patchValue(data.Remarks);
        this.EditingFieldData = data;
        this.EditMode = true;

    }


    EditMode = false;
    EditingFieldData: ClinicalData_DTO;


    UpdateFieldValue() {
        let textBoxFreeTypeNumber = new TextBoxFreeTypeNumber();


        textBoxFreeTypeNumber = {
            ClinicalInformationId: this.EditingFieldData.ClinicalInformationId,
            PatientId: this._selectedPatientSer.SelectedPatient.PatientId,
            PatientVisitId: this._selectedPatientSer.SelectedPatient.PatientId,
            ClinicalHeadingId: null,
            ParentHeadingId: null,
            FieldId: null,
            InputType: null,
            FieldValue: this.Field.FieldConfig.form.get(`${this.Field.FieldId}.number`).value,
            Remarks: this.Field.FieldConfig.form.get(`${this.Field.FieldId}.remark`).value.trim()
        };
        if (textBoxFreeTypeNumber.FieldValue) {
            this._clinicalBLService.PutFieldTextBoxFreeTypeNumber(textBoxFreeTypeNumber).subscribe(
                (res: DanpheHTTPResponse) => {
                    if (res.Status === ENUM_DanpheHTTPResponses.OK) {
                        let updatedVal: TextBoxFreeTypeNumber = res.Results;

                        this.EditingFieldData.FieldValue = updatedVal.FieldValue;
                        this.EditingFieldData.Remarks = updatedVal.Remarks;
                        this.EditMode = false;
                        this.ResetForm(this.Field.FieldConfig.form);
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

        let textBoxFreeTypeNumber = {
            ClinicalInformationId: data.ClinicalInformationId,
        };

        this._clinicalBLService.DeleteFieldTextBoxFreeTypeNumber(textBoxFreeTypeNumber).subscribe(
            (res: DanpheHTTPResponse) => {
                if (res.Status === ENUM_DanpheHTTPResponses.OK) {

                    if (Array.isArray(field.PreviewConfig.FieldData) && data) {
                        field.PreviewConfig.FieldData = field.PreviewConfig.FieldData.filter(d => d.ClinicalInformationId !== data.ClinicalInformationId);
                    }
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

    EditingQuestionData: ClinicalQuestionAnswer_DTO;




    EditQuestionField(question: QuestionaryConfig, answer: ClinicalQuestionAnswer_DTO) {
        this.ResetForm(this.Question.FieldConfig.form);
        // question.ClinicalQuestionAnswers.forEach(answer => {
        //     answer.IsInEditMode = false;
        // });
        question.FieldConfig.form.get(`${question.QuestionId}.number`).patchValue(answer.AnswerValue);
        question.FieldConfig.form.get(`${question.QuestionId}.remark`).patchValue(answer.Remarks);
        this.EditMode = true;
        this.EditingQuestionData = answer;
    }
    UpdateQuestionFieldValue() {
        let textBoxFreeTypeNumber = new QTextBoxFreeTypeNumber();


        textBoxFreeTypeNumber = {
            ClinicalInformationId: this.EditingQuestionData.ClinicalInformationId,
            PatientId: this._selectedPatientSer.SelectedPatient.PatientId,
            PatientVisitId: this._selectedPatientSer.SelectedPatient.PatientVisitId,
            ClinicalHeadingId: null,
            ParentHeadingId: null,
            FieldId: null,
            InputType: null,
            FieldValue: '',
            Remarks: '',
            TextBoxFreeTypeNumberData: null,
        };
        textBoxFreeTypeNumber.TextBoxFreeTypeNumberData = {
            ClinicalQuestionAnswerId: this.EditingQuestionData.ClinicalQuestionAnswerId,
            QuestionId: this.Question.QuestionId,
            AnswerType: this.Question.AnswerType,
            AnswerValue: this.Question.FieldConfig.form.get(`${this.Question.QuestionId}.number`).value,
            Remarks: this.Question.FieldConfig.form.get(`${this.Question.QuestionId}.remark`).value.trim(),
        };

        if (textBoxFreeTypeNumber.TextBoxFreeTypeNumberData.AnswerValue) {
            this._clinicalBLService.PutQFieldTextBoxFreeTypeNumber(textBoxFreeTypeNumber).subscribe(
                (res: DanpheHTTPResponse) => {
                    if (res.Status === ENUM_DanpheHTTPResponses.OK) {
                        let updatedVal: QTextBoxFreeTypeNumber = res.Results;
                        this.EditingQuestionData.AnswerValue = updatedVal.TextBoxFreeTypeNumberData.AnswerValue;
                        this.EditingQuestionData.Remarks = updatedVal.TextBoxFreeTypeNumberData.Remarks;
                        this.EditMode = false;
                        this.ResetForm(this.Question.FieldConfig.form);
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

    DeleteQuestionFieldValue(question: QuestionaryConfig, answer: ClinicalQuestionAnswer_DTO) {
        this._clinicalBLService.DeleteQFieldTextBoxFreeTypeNumber(answer.ClinicalQuestionAnswerId).subscribe(
            (res: DanpheHTTPResponse) => {
                if (res.Status === ENUM_DanpheHTTPResponses.OK) {

                    if (Array.isArray(question.ClinicalQuestionAnswers) && answer) {
                        question.ClinicalQuestionAnswers = question.ClinicalQuestionAnswers.filter(d => d.ClinicalQuestionAnswerId !== answer.ClinicalQuestionAnswerId);
                    }
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