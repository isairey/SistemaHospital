import { Component } from "@angular/core";
import * as moment from "moment";
import { Allergy } from "../../../clinical/shared/allergy.model";
import { CoreService } from "../../../core/shared/core.service";
import { DanpheHTTPResponse } from "../../../shared/common-models";
import { CommonFunctions } from "../../../shared/common.functions";
import { MessageboxService } from "../../../shared/messagebox/messagebox.service";
import { ENUM_AdmissionStatus, ENUM_DanpheHTTPResponses, ENUM_DateReturnValues, ENUM_MessageBox_Status, ENUM_VisitType } from "../../../shared/shared-enums";
import { ClinicalPatientService } from "../../shared/clinical-patient.service";
import { ClinicalNoteBLService } from "../../shared/clinical.bl.service";
import { PatientDetails_DTO } from "../../shared/dto/patient-cln-detail.dto";


@Component({
  selector: 'patient-overview-details',
  templateUrl: './patient-overview-details.component.html'
})

export class PatientOverviewDetailsComponent {
  IsInPatient: boolean = false;
  SelectedPatient: PatientDetails_DTO = new PatientDetails_DTO();
  AllergyLists: Array<Allergy> = new Array<Allergy>();
  ConsultantDoctors: string = "";
  PatientVisitId: number = 0;
  IsOutPatientOREmergency: boolean = false;
  IsEmergencyPatient: boolean = false;
  AllergyNames: string = "";
  IsPatientContactMandatory: boolean = false;
  IsDischarged: boolean = false;
  IsOutPatient: boolean = false;
  RenderedAppointmentDateTime: string = "";
  IsExpanded: boolean = false;

  constructor(public _selectedPatientService: ClinicalPatientService,
    private _clinicalNoteBLService: ClinicalNoteBLService,
    private _msgBoxServ: MessageboxService,
    public coreService: CoreService
  ) {
    this.IsPatientContactMandatory = this.coreService.GetIsPatientContactMandatory();
  }

  ngOnInit(): void {
    if (this._selectedPatientService.SelectedPatient) {
      this.SelectedPatient = this._selectedPatientService.SelectedPatient;
      this.PatientVisitId = this.SelectedPatient.PatientVisitId;
    }

    if (this.SelectedPatient.VisitType === ENUM_VisitType.inpatient) {
      this.IsInPatient = true;
    }
    if (this.SelectedPatient.VisitType === ENUM_VisitType.outpatient || this.SelectedPatient.VisitType === ENUM_VisitType.emergency) {
      this.IsOutPatientOREmergency = true;
    }
    if (this.SelectedPatient.VisitType === ENUM_VisitType.outpatient) {
      this.IsOutPatient = true;
    }
    if (this.SelectedPatient.AdmissionStatus === ENUM_AdmissionStatus.discharged) {
      this.IsDischarged = true;
    }
    if (this.SelectedPatient.VisitType === ENUM_VisitType.emergency) {
      this.IsEmergencyPatient = true;
    }
    if (this.IsOutPatientOREmergency) {
      const appointmentParams = { data: { AppointmentDate: this.SelectedPatient.AppointmentDate, AppointmentTime: this.SelectedPatient.AppointmentTime } };
      this.RenderedAppointmentDateTime = this.AppointmentDateTimeRenderer(appointmentParams);
    }
    const ageSexParam = { data: { DateOfBirth: this.SelectedPatient.DateOfBirth, Gender: this.SelectedPatient.Gender } };
    this.SelectedPatient.Age = CommonFunctions.GetFormattedAgeSex(ageSexParam.data.DateOfBirth, ageSexParam.data.Gender);
    if (this.SelectedPatient && this.SelectedPatient.PatientId) {
      this.GetPatientAllergyList(this.SelectedPatient.PatientId);
    }
    else {
      this.AllergyLists = null;
    }
    this.GetPatientVisitConsultants(this.PatientVisitId);

  }

  /**
   * @summary Renders a human-readable date string based on the input date.
   * Differentiates between today, yesterday, and other dates.
   * @param value The date string to format.
   * @param dateFormat The format to render the date string in.
   * @returns A formatted date string.
   */
  DateRenderer(value: string, dateFormat: string): string {
    let currDate = moment().format(dateFormat);
    let diff = moment(currDate)
      .diff(moment(value).format(dateFormat), 'days')
      .toString();

    const todayDiff = 0;
    const yesterdayDiff = 1;

    if (parseInt(diff) === todayDiff) {
      return ENUM_DateReturnValues.Today;
    } else if (parseInt(diff) === yesterdayDiff) {
      return ENUM_DateReturnValues.Yesterday;
    } else {
      return moment(value).format(dateFormat);
    }
  }

  /**
 * @summary Retrieves patient allergy list from clinical note BL service.
 * Updates local AllergyLists and SelectedPatient.Allergies if successful.
 * Shows error message if retrieval fails.
 * @param PatientId The ID of the patient to fetch allergies for.
 */
  GetPatientAllergyList(PatientId: number): void {
    this._clinicalNoteBLService.GetPatientAllergyList(PatientId)
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK && res.Results) {
          this.AllergyLists = res.Results;
          this.AllergyNames = this.FormatAllergenNames(this.AllergyLists);
        } else {
          this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, ["Failed. please check log for details."], res.ErrorMessage);
        }
      });
  }

  /**
 * @summary Formats a list of allergen names into a single comma-separated string.
 * @param allergyList The list of allergies to format.
 * @returns A formatted string of allergen names.
 */
  FormatAllergenNames(allergyList: any[]): string {
    if (allergyList && allergyList.length > 0) {
      return allergyList.map(allergy => allergy.AllergenAdvRecName).join(', ');
    }
    return '';
  }

  /**
   * @summary Retrieves patient visit consultants from clinical note BL service.
   * Updates local ConsultantDoctors with a list of consultant names.
   * @param PatientVisitId The ID of the patient visit to fetch consultants for.
   */
  GetPatientVisitConsultants(PatientVisitId: number): void {
    if (PatientVisitId) {
      this._clinicalNoteBLService.GetPatientVisitConsultants(PatientVisitId)
        .subscribe((res: DanpheHTTPResponse) => {
          if (res.Status === ENUM_DanpheHTTPResponses.OK) {
            const consultants = res.Results;
            if (consultants && consultants.length > 0) {
              const nonPrimaryConsultants = consultants.filter(c => c.IsPrimaryConsultant === false);
              this.ConsultantDoctors = (nonPrimaryConsultants && nonPrimaryConsultants.length > 0)
                ? nonPrimaryConsultants.map(nc => nc.ConsultantName)
                : [];
            }
          } else {
            this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, [`Cannot load the consultants ${res.ErrorMessage}`]);
          }
        },
          err => {
            console.log(err.ErrorMessage);
            this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, ["Failed to load consultants."]);
          });
    }
  }

  /**
   * @summary Renders a combined appointment date and time string.
   * @param params Object containing AppointmentDate and AppointmentTime as strings.
   * @returns A formatted appointment date and time string or 'Invalid date' if invalid.
   */
  AppointmentDateTimeRenderer(params: { data: { AppointmentDate: string; AppointmentTime: string; }; }): string {
    const appointmentDate = moment(params.data.AppointmentDate, moment.ISO_8601);
    const appointmentTime = moment(params.data.AppointmentTime, "HH:mm:ss");
    if (appointmentDate.isValid() && appointmentTime.isValid()) {
      const combinedDateTime = moment(`${appointmentDate.format('YYYY-MM-DD')} ${appointmentTime.format('HH:mm:ss')}`);
      return combinedDateTime.isValid() ? combinedDateTime.format('YYYY-MM-DD hh:mm a') : 'Invalid date';
    } else {
      return 'Invalid date';
    }
  }


  ToggleExpanded() {
    this.IsExpanded = !this.IsExpanded;
  }

}
