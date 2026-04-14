import { Component, ElementRef, OnInit, ViewChild } from "@angular/core";
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

import * as $ from 'jquery';
import 'summernote/dist/summernote-lite.js';
import { ClinicalService } from "../../../../clinical-new/shared/clinical.service";
import { FocusedElementService } from "../../../../shared/global-search/shared/focused-element.service";
@Component({
    selector: "free-type-element",
    templateUrl: "./free-type-element.component.html",
    styleUrls: ["../reusable-elements.component.css"]

})
export class ClinicalReusableFreeTypeElement implements OnInit, IDynamicElement {

    Field: Field;
    Question: QuestionaryConfig;
    IsQuestion: boolean = false;
    // FieldConfig: FreeTypeConfig;
    formControlName: string;
    @ViewChild('summernote') summernote: ElementRef;
    EditMode = false;
    EditingFieldData: ClinicalData_DTO;

    EditingQuestionData: ClinicalQuestionAnswer_DTO;

    IsQuestionary: boolean = false;

    private isUpdatingFromEditor = false;
    private isUpdatingFromForm = false;
    constructor(
        private _messageBoxService: MessageboxService,
        private _selectedPatientSer: ClinicalPatientService,
        private _clinicalBLService: ClinicalNoteBLService,
        private _focusedElementService: FocusedElementService,
        private _clinicalService: ClinicalService
    ) {

    }
    ngOnInit() {
        if (this.Question) {
            this.IsQuestion = true;
            this.formControlName = `${this.Question.FieldConfig.key}`;
        } else if (this.Field) {
            this.formControlName = `${this.Field.FieldConfig.key}`;
        }

    }

    ngAfterViewInit() {
        const editor = $(this.summernote.nativeElement);

        editor.summernote({
            placeholder: '',
            // tabsize: 2,
            // height: '300px',
            minHeight: '200px',
            maxHeight: null,
            disableDragAndDrop: true,
            toolbar: [
                ['misc', ['codeview']],
                ['font', ['bold', 'italic', 'underline', 'strikethrough']],
                ['fontsize', ['fontname', 'fontsize', 'color']],
                ['insert', ['table', 'hr']],
                ['custom', ['saveBtn']],
                ['para', ['style', 'ul', 'ol', 'paragraph']]

            ]
        });
        editor.summernote('code', '');

        if (!this.IsQuestion) {
            this.InitializeEditor(this.Field.FieldConfig.form);
        } else {
            this.InitializeEditor(this.Question.FieldConfig.form);
        }
    }


    /**
     * Initializes a Summernote editor and synchronizes it with an Angular form control.
     * 
     * @param {Object} form - The Angular form containing the control to be synchronized.
     */
    InitializeEditor(form) {
        const editor = $(this.summernote.nativeElement);
        form.get(this.formControlName).setValue(editor.summernote('code'));

        editor.on('summernote.change', (we, contents, $editable) => {
            if (!this.isUpdatingFromForm) {
                this.isUpdatingFromEditor = true;
                form.get(this.formControlName).setValue(contents);
                this.isUpdatingFromEditor = false;
            }
        });

        form.get(this.formControlName).valueChanges.subscribe(value => {
            if (!this.isUpdatingFromEditor) {
                this.isUpdatingFromForm = true;
                if (!value) {
                    editor.summernote('reset');
                } else {
                    editor.summernote('code', value);
                }
                this.isUpdatingFromForm = false;
            }
        });

        editor.on('summernote.focus', () => {
            this._focusedElementService.SetSummernoteRef(editor);
        });
    }

    EditField(field: Field, data: ClinicalData_DTO) {
        this.EditMode = true;
        field.FieldConfig.form.get(`${field.FieldId}`).patchValue(data.FieldValue);
        this.EditingFieldData = data;
    }






    UpdateFieldValue() {
        let field = this.Field;
        let data = this.EditingFieldData;
        let textBoxFreeTypeNumber = new TextBoxFreeTypeNumber();
        textBoxFreeTypeNumber = {
            ClinicalInformationId: data.ClinicalInformationId,
            PatientId: this._selectedPatientSer.SelectedPatient.PatientId,
            PatientVisitId: this._selectedPatientSer.SelectedPatient.PatientVisitId,
            ClinicalHeadingId: data.ClinicalHeadingId,
            ParentHeadingId: data.ParentId,
            FieldId: field.FieldId,
            InputType: field.InputType,
            FieldValue: field.FieldConfig.form.get(`${field.FieldId}`).value.trim(),
            Remarks: '',
        };

        if (textBoxFreeTypeNumber.FieldValue && this._clinicalService.CheckValidContent(textBoxFreeTypeNumber.FieldValue)) {
            this._clinicalBLService.PutFieldTextBoxFreeTypeNumber(textBoxFreeTypeNumber).subscribe(
                (res: DanpheHTTPResponse) => {
                    if (res.Status === ENUM_DanpheHTTPResponses.OK) {
                        let updatedVal: TextBoxFreeTypeNumber = res.Results;
                        data.FieldValue = updatedVal.FieldValue;
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
        }
        else {
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



    EditQuestionField(question: QuestionaryConfig, answer: ClinicalQuestionAnswer_DTO) {
        this.EditMode = true;
        question.FieldConfig.form.get(`${question.QuestionId}`).patchValue(answer.AnswerValue);
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
            AnswerValue: this.Question.FieldConfig.form.get(`${this.Question.QuestionId}`).value.trim(),
            Remarks: '',
        };

        if (textBoxFreeTypeNumber.TextBoxFreeTypeNumberData.AnswerValue && textBoxFreeTypeNumber.TextBoxFreeTypeNumberData.AnswerValue !== '<p><br></p>') {
            this._clinicalBLService.PutQFieldTextBoxFreeTypeNumber(textBoxFreeTypeNumber).subscribe(
                (res: DanpheHTTPResponse) => {
                    if (res.Status === ENUM_DanpheHTTPResponses.OK) {
                        let updatedVal: QTextBoxFreeTypeNumber = res.Results;
                        this.EditingQuestionData.AnswerValue = updatedVal.TextBoxFreeTypeNumberData.AnswerValue;
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