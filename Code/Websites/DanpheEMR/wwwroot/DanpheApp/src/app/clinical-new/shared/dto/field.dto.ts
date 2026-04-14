import { ClinicalData_DTO } from "../clinical-info-preview/dto/clinical-data.dto";
import { FieldOptions } from "./field-options.dto";
import { QuestionaryConfig } from "./questionary-config.dto";

export class Field {
    FieldId: number;
    FieldName: string;
    FieldDisplayName: string;
    FieldCode: string;
    InputType: string;
    IsAcrossVisitAvailability: boolean;
    IsDisplayTitle: boolean;
    IsActive: boolean;
    Pretemplate?: string;
    Options?: FieldOptions[];
    QuestionaryConfig: QuestionaryConfig[];
    FieldConfig?: any;
    PreviewConfig?: PreviewConfiguration = new PreviewConfiguration();

}
export class PreviewConfiguration {
    FieldData: ClinicalData_DTO[];
    IsPrintable: boolean = false;
    // IsInEditMode: boolean = false;

}
