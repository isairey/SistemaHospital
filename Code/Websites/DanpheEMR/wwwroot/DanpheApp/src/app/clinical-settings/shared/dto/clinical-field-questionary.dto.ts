import { FormBuilder, FormGroup, Validators } from "@angular/forms";

export class ClinicalFieldQuestionary_DTO {
  QuestionId: number = 0;
  Question: string = null;
  AnswerType: string = null;

  IsActive: boolean = true;
  FieldId: number = 0;
  FieldName: string = null;

  QuestionOptions: string[] = [];
  public CLNFieldQuestionaryValidator: FormGroup;

  constructor() {
    let _formBuilder = new FormBuilder();
    this.CLNFieldQuestionaryValidator = _formBuilder.group({
      'FieldId': [''],

      'Question': ['', Validators.compose([Validators.required])],
      'AnswerType': ['', Validators.compose([Validators.required])],




    });
  }
  public IsValidCheck(fieldName, validator): boolean {

    if (fieldName == undefined) {
      return this.CLNFieldQuestionaryValidator.valid;
    }
    else
      return !(this.CLNFieldQuestionaryValidator.hasError(validator, fieldName));
  }

}
export class ClinicalFieldQuestionaryOptionAddDTO {
  QuestionOptionId: number;
  QuestionOption: string;
}

export class CLNFieldQuestionary_DTO {
  QuestionId: number = 0;
  FieldId: number = 0;
  Question: string = null;
  IsActive: boolean = true;
  AnswerType: string = null;

}



