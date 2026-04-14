import { FormBuilder, FormGroup } from "@angular/forms";

export class ClinicalFieldQuestionaryOption_DTO {
  QuestionOptionId: number = 0;
  QuestionOption: string = null;
  IsActive: boolean = true;

  QuestionId: number = 0;


  public CLNQuestionaryOptionValidator: FormGroup;

  constructor() {
    let _formBuilder = new FormBuilder();
    this.CLNQuestionaryOptionValidator = _formBuilder.group({

      'QuestionOption': [''],




    });
  }

}


export class ClinicalQuestionaryOption_DTO {
  QuestionId: number = 0;
  Question: string = null;
  AnswerType: string = null;

  FieldId: number = 0;
  QuestionOptions: { QuestionOption: string; }[] = [];


}
export class ClinicalFieldOptionDTO {
  QuestionOptionId: number;
  QuestionOption: string;
  IsActive: boolean;
}

