import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CoreService } from '../../../core/shared/core.service';
import { SecurityService } from "../../../security/shared/security.service";
import { DanpheHTTPResponse } from '../../../shared/common-models';
import { GridEmitModel } from '../../../shared/danphe-grid/grid-emit.model';
import { NepaliDateInGridColumnDetail, NepaliDateInGridParams } from '../../../shared/danphe-grid/NepaliColGridSettingsModel';
import { SettingsGridColumnSettings } from '../../../shared/danphe-grid/settings-grid-column-settings';
import { MessageboxService } from '../../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status } from '../../../shared/shared-enums';
import { ClinicalPatientService } from '../../shared/clinical-patient.service';
import { ClinicalNoteBLService } from '../../shared/clinical.bl.service';
import { BabyBirthDetails } from '../../shared/dto/baby-birth-details.dto';
import { Field } from '../../shared/dto/field.dto';
import { PatientDetails_DTO } from '../../shared/dto/patient-cln-detail.dto';

@Component({
  selector: "birth-list",
  templateUrl: "./birth-list.html"
})

export class BirthListComponent implements OnInit {
  Field: Field;
  IsAcrossVisitAvailability: boolean = false;
  public BirthList: Array<BabyBirthDetails> = new Array<BabyBirthDetails>();

  SelectedBabyDetails: BabyBirthDetails = new BabyBirthDetails();

  public ShowAddNewBirthDetails: boolean = false;

  public NepaliDateInGridSettings: NepaliDateInGridParams = new NepaliDateInGridParams();
  SelectedPatient: PatientDetails_DTO = new PatientDetails_DTO();
  PatientVisitId: number = 0;
  PatientId: number = 0;
  public UpdateBirthDetails: boolean = false;
  BabyBirthListGridColumns: Array<any> = null;
  SetCLNHeadingGridColumns: SettingsGridColumnSettings = null;
  constructor(
    private _clinicalNoteBLService: ClinicalNoteBLService,

    private _clinicalPatientService: ClinicalPatientService,

    public securityService: SecurityService,
    public changeDetector: ChangeDetectorRef,
    public msgBoxServ: MessageboxService,
    public coreService: CoreService) {



  }

  ngOnInit() {
    this.SetCLNHeadingGridColumns = new SettingsGridColumnSettings(
      this.coreService.taxLabel,
      this.securityService
    );
    if (this.Field) {
      this.IsAcrossVisitAvailability = this.Field.IsAcrossVisitAvailability;
    } else {
      this.IsAcrossVisitAvailability = false;
    }
    this.BabyBirthListGridColumns = this.SetCLNHeadingGridColumns.ClinicalBabyBirthList;
    this.SelectedPatient = this._clinicalPatientService.SelectedPatient;
    this.NepaliDateInGridSettings.NepaliDateColumnList.push(new NepaliDateInGridColumnDetail('BirthDate', false));
    this.GetAllTheBirthList();
  }



  /**
   * @summary Retrieves the list of births for the selected patient's visit from the clinical note BL service.
   * @param PatientVisitId The ID of the patient's visit to fetch birth details for current visitt.
   */
  public GetAllTheBirthList() {
    this.PatientVisitId = this.SelectedPatient.PatientVisitId;
    this.PatientId = this.SelectedPatient.PatientId;
    this._clinicalNoteBLService.GetBirthList(this.PatientId, this.PatientVisitId, this.IsAcrossVisitAvailability).
      subscribe((res: DanpheHTTPResponse) => {
        if (res.Status == ENUM_DanpheHTTPResponses.OK) {
          this.BirthList = res.Results;
        } else {
          this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ['Error Occured while getting Birth List. Please Try again Later']);
        }
      });
  }

  GridActions($event: GridEmitModel) {
    switch ($event.Action) {

      case "edit":
        {
          this.SelectedBabyDetails = new BabyBirthDetails();
          this.ShowAddNewBirthDetails = false;
          this.changeDetector.detectChanges();

          this.SelectedBabyDetails = $event.Data;
          this.ShowAddNewBirthDetails = true;

          this.UpdateBirthDetails = true;

          break;
        }
      default:
        break;
    }
  }
  CallBackClose(data) {
    if (data && data.Close) {
      this.ShowAddNewBirthDetails = false;
    } else if (data && (data.Add || data.Edit)) {
      this.ShowAddNewBirthDetails = false;
      this.GetAllTheBirthList();
    }
  }
  CallBackUpdate() {
    this.GetAllTheBirthList();
  }
  ShowAddNewBirthDetailsPage() {
    this.ShowAddNewBirthDetails = false;
    this.UpdateBirthDetails = false;
    this.ShowAddNewBirthDetails = true;
  }
}
