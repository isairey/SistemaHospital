import { QuestionaryOptionAnswers } from "./questionary-option-answers.dto";

export class QuestionarySingleSelectMultipleSelect {
    QuestionId: number;
    AnswerType: string;
    Remarks: string;
    OptionAnswers: QuestionaryOptionAnswers[];
}