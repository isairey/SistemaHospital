import * as moment from "moment";
import { ENUM_DateTimeFormat } from "../../../shared/shared-enums";

export class PatientMedication_DTO {
  CardexId: number;
  MedicationItemId: number;
  PatientId: number;
  PatientVisitId: number;
  PrescriberId: number;
  FrequencyAbbreviation: string;
  Duration: number;
  RouteOfAdministration: string;
  MedicationSchedule: string;
  IsPRN: boolean;
  PRNNotes: string;
  Doses: string;
  Strength: string;
  CardexNote: string;
  Status: string;
  GenericName: string;
  ItemName: string;
  ItemId: number;
  AlternativeItemName: string;
  CreatedBy: number;
  CreatedOn: Date;
  ModifiedBy: number | null;
  ModifiedOn: Date | null;
  PatientMedicationId: number | null;
  MedicationTakenDate: string | null;
  MedicationTakenTime: string | null;
  Comment: string;
  MedicationCreatedBy: number | null;
  MedicationCreatedOn: Date | null;
  EntryBy: string;
  IsActiveMedication: boolean = false;
  MedicationStartDate: string = moment().format(ENUM_DateTimeFormat.Year_Month_Day_Hour_Minute);
  MedicationEndDate: string = moment().format(ENUM_DateTimeFormat.Year_Month_Day_Hour_Minute);
}
