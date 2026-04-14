export class PQuestionary {
    FieldName: string;
    Type: string;
    Answers: PAnswers[];
    Options: POptions[];
}

export class PField {
    FieldName: string;
    Type: string;
    IsAcrossVisitAvailability: boolean;
    Answers: PAnswers[];
    Options: POptions[];
    Questionary: PQuestionary[];
    FieldConfig: any;
    IsDisplayTitle: boolean;
}

export class PSection {
    SectionName: string;
    Fields: PField[];
}

export class PDocument {
    DocumentName: string;
    Sections: PSection[];
}

export class PAnswers {
    Answer: string;
    Remark: string;
    Date: string;
}
export class POptions {
    Options: string[];
    Remark: string;
    Date: string;
}

