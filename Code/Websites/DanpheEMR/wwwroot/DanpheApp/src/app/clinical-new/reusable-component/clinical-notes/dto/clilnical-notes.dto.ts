
export class Note {
    ClinicalNotesMasterId: number;
    ClinicalNotesCode: string;
    ClinicalNotesName: string;
    NoteDisplaySequence: number;
    IsActive: boolean = false;
    IsDefault: boolean = false;
    Fields: NoteField[];
}

export class NoteField {
    ClinicalNotesMasterId: number;
    ClinicalFieldId: number;
    FieldCode: string;
    FieldName: string;
    InputType: string;
    FieldDisplayName: string;
    SmartTemplate: string;
    FieldDisplaySequence: number;
    Questions: NoteQuestionary[];
    // FieldData :PField;
    Answers: NoteAnswers[];
    Options: NoteOptions[];
    FieldConfig: any;
    IsPrintable: boolean = false;
    IsAcrossVisitAvailability: boolean;
    IsDisplayTitle: boolean;

}

export class NoteQuestionary {
    ClinicalFieldId: number;
    QuestionId: number;
    Question: string;
    AnswerType: string;
    // QuestionData: PQuestionary;

    Answers: NoteAnswers[];
    Options: NoteOptions[];
    IsPrintable: boolean = false;
}


export class NoteAnswers {
    Answer: string;
    Remark: string;
    Date: string;
    IsPrintable: boolean = false;
}
export class NoteOptions {
    Options: string[];
    Remark: string;
    Date: string;
    IsPrintable: boolean = false;
}


