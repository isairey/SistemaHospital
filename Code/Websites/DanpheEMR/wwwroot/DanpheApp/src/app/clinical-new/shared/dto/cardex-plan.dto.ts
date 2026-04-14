import * as moment from "moment";
import { ENUM_DateTimeFormat } from "../../../shared/shared-enums";

export class CardexPlan_DTO {
  CardexId: number;
  PrescriptionItemId: number | null;
  MedicationItemId: number;
  ItemId: number;
  ItemName: string;
  GenericName: string;
  PrescriberId: number;
  PatientId: number;
  PatientVisitId: number;
  FrequencyAbbreviation: string;
  Duration: number;
  RouteOfAdministration: string;
  MedicationSchedule: string;
  IsPRN: boolean = false;
  PRNNotes: string;
  Doses: string;
  Strength: string;
  CardexNote: string;
  Status: string;
  AlternateMedicine: string | null;
  CreatedBy: number;
  CreatedOn: Date;
  ModifiedBy: number | null;
  ModifiedOn: Date | null;
  MedicationStartDate: string = moment().format(ENUM_DateTimeFormat.Year_Month_Day_Hour_Minute);
  MedicationEndDate: string = moment().format(ENUM_DateTimeFormat.Year_Month_Day_Hour_Minute);
  IsActive: boolean;
  IsAddedToPlan: boolean = false;
  OrderStatus: string;
  Prescriber: string;
  Notes: string;
  IsDischargeRequest: boolean = false;

}
