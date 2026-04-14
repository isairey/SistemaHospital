import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { ClinicalPatientService } from "../../../../clinical-new/shared/clinical-patient.service";
import { ClinicalNoteBLService } from "../../../../clinical-new/shared/clinical.bl.service";
import { BabyBirthDetails } from "../../../../clinical-new/shared/dto/baby-birth-details.dto";
import { PatientDetails_DTO } from "../../../../clinical-new/shared/dto/patient-cln-detail.dto";
import { DanpheHTTPResponse } from "../../../../shared/common-models";
import { MessageboxService } from "../../../../shared/messagebox/messagebox.service";
import { ENUM_DanpheHTTPResponseText, ENUM_MessageBox_Status } from "../../../../shared/shared-enums";


@Component({
  selector: 'add-birth-details',
  templateUrl: 'add-birth-details.component.html'
})

export class AddBirthDetailsComponent implements OnInit {
  @Input('UpdateBirthDetails')
  UpdateBirthDetails: boolean = false;
  @Input('SelectedBabyDetails')
  SelectedBabyDetails: BabyBirthDetails = new BabyBirthDetails();
  @Output('CallBack-Update')
  UpdateEmitter = new EventEmitter<void>();
  @Output('CallBack-Close')
  CloseEmitter: EventEmitter<object> = new EventEmitter<object>();
  BirthDetail: BabyBirthDetails = new BabyBirthDetails();
  BabyBirthDetails: Array<BabyBirthDetails> = new Array<BabyBirthDetails>();
  loading: boolean = false;
  PatientVisitId: number = 0;
  SelectedPatient = new PatientDetails_DTO();
  BabyBirthCount: number = 0;
  IsUpdate: boolean = false;
  constructor(
    private _clinicalNoteBLService: ClinicalNoteBLService,
    private _clinicalPatientService: ClinicalPatientService,
    public msgBoxServ: MessageboxService,
    public changeDetector: ChangeDetectorRef) {
    this.BirthDetail = new BabyBirthDetails();
  }
  ngOnInit(): void {
    this.SelectedPatient = this._clinicalPatientService.SelectedPatient;
    if (this.SelectedPatient) {
      this.PatientVisitId = this.SelectedPatient.PatientVisitId;
    }
  }
  public Submit(): void {
    this.loading = true;
    let NewlyBabyBirthDetails: Array<BabyBirthDetails> = new Array<BabyBirthDetails>();
    NewlyBabyBirthDetails = this.BabyBirthDetails;
    this.BabyBirthCount = this.BabyBirthDetails.length;
    this.PostBirthCertificate(NewlyBabyBirthDetails);

  }

  HandleUpdateModeChanged(isUpdateMode: boolean) {
    this.IsUpdate = isUpdateMode;
  }
  /**
 * @summary Posts newly added birth certificate details to the backend service.
 * Sets PatientVisitId for each detail from the selected patient.
 * Emits close event and shows success message upon successful post.
 * @param NewBabyBirthDetails Array of BabyBirthDetails to be posted.
 */
  PostBirthCertificate(NewBabyBirthDetails): void {
    if (this.BabyBirthDetails && this.BabyBirthDetails.length > 0) {
      NewBabyBirthDetails.forEach(detail => {
        detail.PatientVisitId = this.PatientVisitId;
      });
      this._clinicalNoteBLService.PostBirthCertificateDetail(NewBabyBirthDetails)
        .finally(() => { this.loading = false; })
        .subscribe((res: DanpheHTTPResponse) => {
          if (res.Status = ENUM_DanpheHTTPResponseText.OK) {
            this.CloseEmitter.emit({ Close: false, Add: true, Edit: false });
            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Success, ['Birth Details added successfully!']);
          }
        });


    }
    else {
      this.loading = false;
      this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Warning, ["Please fill the birth details first!!!!"]);
      this.loading = false;
    }
  }

  CallBackUpdate(): void {
    this.UpdateEmitter.emit();
  }
  public Close(): void {
    if (this.BabyBirthDetails.length > 0) {
      if (confirm("Do you want to discard added birth details?")) {
        this.BirthDetail = new BabyBirthDetails();
        this.CloseEmitter.emit({ Close: true, Add: false, Edit: false });
      }
    } else {
      this.BirthDetail = new BabyBirthDetails();
      this.CloseEmitter.emit({ Close: true, Add: false, Edit: false });
    }


  }
  /**
  * @summary Event handler for submission of birth details from child components.
  * Updates the local BabyBirthDetails array with newly submitted details.
  * @param $event Array of BabyBirthDetails submitted from child component.
  */
  public OnSubmit($event: Array<BabyBirthDetails>): void {
    this.BabyBirthDetails = $event;
  }
}
