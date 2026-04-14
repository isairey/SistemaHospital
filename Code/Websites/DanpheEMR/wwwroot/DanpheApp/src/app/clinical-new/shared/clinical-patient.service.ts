import { Injectable } from "@angular/core";
import { PatientDetails_DTO } from "./dto/patient-cln-detail.dto";

@Injectable()
export class ClinicalPatientService {
  SelectedPatient: PatientDetails_DTO;
  public GlobalPatient = new PatientDetails_DTO();
  GetGlobal(): PatientDetails_DTO {
    return this.GlobalPatient;
  }
}
