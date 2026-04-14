import * as moment from "moment";
import { ENUM_DateTimeFormat } from "../../../shared/shared-enums";

export class MedicationCardex_Dto {
    CardexId: number = 0;
    BrandName: string = '';
    Dose: string = '';
    Strength: string = '';
    Duration: number = 0;
    Frequency: string = '';
    GenericId: string = '';
    Intake: string = '';
    IsPRN: boolean = false;
    MedicationSchedule: string = '';
    Route: string = '';
    PRNNotes: string = '';
    Prescriber: string = '';
    Remarks: string = '';
    UseAlternateMedicine: boolean = false;
    AlternateMedicine: string = '';
    CardexNote: string = '';
    PatientId: number;
    PatientVisitId: number;
    PrescriberId: number;
    ItemId: number;
    PrescriptionItemId: number;
    MedicationStartDate: string = moment().format(ENUM_DateTimeFormat.Year_Month_Day_Hour_Minute);
    MedicationEndDate: string = moment().format(ENUM_DateTimeFormat.Year_Month_Day_Hour_Minute);
}