import { Visit } from "../../../appointments/shared/visit.model";
import { Patient } from "../../../patients/shared/patient.model";

export class FreeVisit_DTO {
    public Patient = new Patient();
    public Visit = new Visit();
}