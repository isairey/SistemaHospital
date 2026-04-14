import { ChangeDetectorRef, Component, EventEmitter, Input, Output } from '@angular/core';
import { CoreService } from '../../../../core/shared/core.service';
import { MessageboxService } from '../../../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponseText, ENUM_Genders } from './../../../../shared/shared-enums';

import { ClinicalPatientService } from '../../../../clinical-new/shared/clinical-patient.service';
import { ClinicalNoteBLService } from '../../../../clinical-new/shared/clinical.bl.service';
import { BabyBirthCondition_DTO, BirthCertificateNumbers_DTO } from '../../../../clinical-new/shared/dto/baby-birth-condition.dto';
import { BabyBirthDetails } from '../../../../clinical-new/shared/dto/baby-birth-details.dto';
import { PatientDetails_DTO } from '../../../../clinical-new/shared/dto/patient-cln-detail.dto';
import { Employee } from '../../../../employee/shared/employee.model';
import { DanpheHTTPResponse } from '../../../../shared/common-models';
import { DanpheCache, MasterType } from '../../../../shared/danphe-cache-service-utility/cache-services';
import { ENUM_MessageBox_Status } from '../../../../shared/shared-enums';

@Component({
  selector: 'add-birth-details-shared',
  templateUrl: 'add-birth-details-shared.html'
})
export class AddBirthDetailsSharedComponent {

  @Input('UpdateBirthDetails')
  UpdateBirthDetails: boolean = false;
  @Input('SelectedBabyDetails')
  SelectedBabyDetails: BabyBirthDetails = new BabyBirthDetails();
  @Output('CallBack-Update')
  UpdateEmitter = new EventEmitter<void>();
  @Output('CallBack-Close')
  CloseEmitter: EventEmitter<object> = new EventEmitter<object>();

  @Output('on-submit')
  AddEmitter: EventEmitter<object> = new EventEmitter<object>();

  @Output('UpdateMode-Changed')
  UpdateModeChanged = new EventEmitter<boolean>();
  MotherPatientId: number = 0;
  BirthDetail: BabyBirthDetails = new BabyBirthDetails();
  BabyBirthDetails: Array<BabyBirthDetails> = new Array<BabyBirthDetails>();
  BirthConditionList: Array<BabyBirthCondition_DTO> = new Array<BabyBirthCondition_DTO>();
  IsEditMode: boolean = false;
  SelectedPatient: PatientDetails_DTO = new PatientDetails_DTO();
  ProviderList: Array<Employee> = new Array<Employee>();
  BirthTypeList: Array<any> = new Array<any>();
  IssuedSignatory: Employee = new Employee();
  CertifiedBy: Employee = new Employee();
  SelectedBirthCertIndex: number = -1;
  Loading: boolean = false;
  AllNewBirthDetails: Array<BabyBirthDetails> = new Array<BabyBirthDetails>();
  DuplicateCertificateNumber: boolean = false;
  AllBirthCertificateNumbers: Array<BirthCertificateNumbers_DTO> = Array<BirthCertificateNumbers_DTO>();
  CertificateNoBeforeEdit: number;
  IsUpdateMode: boolean = false;

  constructor(
    private _clinicalPatientService: ClinicalPatientService,
    private _clinicalNoteBLService: ClinicalNoteBLService,
    public msgBoxServ: MessageboxService,
    public changeDetector: ChangeDetectorRef,
    public coreService: CoreService) {
    this.SelectedBabyDetails = new BabyBirthDetails();
    this.SelectedBabyDetails.BirthConditionId = null;
    this.GetBabyBirthCondition();
    this.GetAllBirthCertificateNumbers();

  }

  ngOnInit(): void {
    this.ProviderList = DanpheCache.GetData(MasterType.Employee, null);
    this.GetBirthType();
    this.SelectedPatient = this._clinicalPatientService.SelectedPatient;

    if (this.SelectedPatient && this.SelectedPatient.PatientId) {
      this.MotherPatientId = this.SelectedPatient.PatientId;
      this.GetBabyDetailsListByMotherPatientId();
    }
    if (this.UpdateBirthDetails) {
      this.UpdateCertifiedAndIssuedSignatory();
    } else {
      this.SelectedBabyDetails = new BabyBirthDetails();
    }

  }
  /**
    * @summary Updates the certified and issued signatory employees based on selected baby details.
    */
  UpdateCertifiedAndIssuedSignatory(): void {
    if (this.ProviderList && this.SelectedBabyDetails) {
      this.CertifiedBy = this.ProviderList.find(p => p.EmployeeId === this.SelectedBabyDetails.CertifiedBy) || new Employee;
      this.IssuedSignatory = this.ProviderList.find(p => p.EmployeeId === this.SelectedBabyDetails.IssuedBy) || new Employee;
      this.changeDetector.detectChanges();
    }
  }
  ValidateBirthDetails(): boolean {
    for (let i in this.BirthDetail.BabyBirthDetailsValidator.controls) {
      this.BirthDetail.BabyBirthDetailsValidator.controls[i].markAsDirty();
      this.BirthDetail.BabyBirthDetailsValidator.controls[i].updateValueAndValidity();
    }
    if (this.BirthDetail.IsValidCheck(undefined, undefined)) {
      return true;
    } else {
      return false;
    }
  }
  public Close(): void {
    if (this.BabyBirthDetails.length > 0) {
      if (confirm("Do you want to discard added birth details?")) {
        this.SelectedBabyDetails = new BabyBirthDetails();
        this.CloseEmitter.emit({ Close: true, Add: false, Edit: false });
      }
    } else {
      this.SelectedBabyDetails = new BabyBirthDetails();
      this.CloseEmitter.emit({ Close: true, Add: false, Edit: false });
    }


  }
  /**
    * @summary Adds a new birth detail to the list after validation.
    * Displays warning messages if the selected patient is male or if the mother patient ID is not set.
    */
  public AddBirthDetailToList(): void {
    let IsDataValid: boolean;
    if (this.SelectedPatient && this.SelectedPatient.Gender.toLowerCase() === ENUM_Genders.Male) {
      this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Warning, ["Birth Records cannot be added for Male Patients"]);
      IsDataValid = false;
      this.Loading = false;
      return;
    }

    this.SelectedBabyDetails.CertifiedBy = this.CertifiedBy.EmployeeId;
    this.SelectedBabyDetails.IssuedBy = this.IssuedSignatory.EmployeeId;

    IsDataValid = this.ValidateBirthDetails();
    if (this.Loading == false && IsDataValid == true) {

      if (this.IsEditMode && this.SelectedBirthCertIndex > -1) {
        this.BabyBirthDetails[this.SelectedBirthCertIndex] = this.SelectedBabyDetails;
      } else if (this.SelectedBirthCertIndex == -1) {

        let newObj = Object.assign({}, this.SelectedBabyDetails);
        this.BabyBirthDetails.push(newObj);
        let NewlyBabyBirthDetails: Array<BabyBirthDetails> = new Array<BabyBirthDetails>();
        NewlyBabyBirthDetails = this.BabyBirthDetails;
        NewlyBabyBirthDetails.forEach(a => (a.PatientId = this.MotherPatientId));
        NewlyBabyBirthDetails = NewlyBabyBirthDetails.filter(a => a.BabyBirthDetailsId == 0);
        this.AllNewBirthDetails = NewlyBabyBirthDetails;
        this.AddEmitter.emit(NewlyBabyBirthDetails);
      }
      let tempDate = this.SelectedBabyDetails.BirthDate;

      let tempFather = this.SelectedBabyDetails.FathersName;
      let tempTime = this.SelectedBabyDetails.BirthTime;
      let tempBirthTypeNumber = this.SelectedBabyDetails.BirthNumberType;
      let tempBirthType = this.SelectedBabyDetails.BirthType;
      let tempIssuedBy = this.IssuedSignatory;
      let tempCertified = this.CertifiedBy;
      this.SelectedBabyDetails = new BabyBirthDetails();

      this.CertifiedBy = tempCertified;
      this.IssuedSignatory = tempIssuedBy;
      this.SelectedBabyDetails.BirthNumberType = tempBirthTypeNumber;
      this.SelectedBabyDetails.BirthType = tempBirthType;
      this.SelectedBabyDetails.BirthTime = tempTime;
      this.SelectedBabyDetails.BirthDate = tempDate;
      this.SelectedBabyDetails.BabyBirthDetailsValidator.get('BirthDate').setValue(this.SelectedBabyDetails.BirthDate);
      this.SelectedBabyDetails.BabyBirthDetailsValidator.get('BirthTime').setValue(this.SelectedBabyDetails.BirthTime);

      this.changeDetector.detectChanges();

      this.SelectedBabyDetails.FathersName = tempFather;
      this.SelectedBirthCertIndex = -1;
      this.IsEditMode = false;
      this.Loading = false;
    } else {
      this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Warning, ["Invalid fields! Some Birth Details Missing!"]);
    }
  }

  /**
      * @summary Updates the birth details based on the selected baby details for patient's current visit.
      */
  UpdateBirthDetail(): void {
    for (let i in this.BirthDetail.BabyBirthDetailsValidator.controls) {
      this.BirthDetail.BabyBirthDetailsValidator.controls[i].markAsDirty();
      this.BirthDetail.BabyBirthDetailsValidator.controls[i].updateValueAndValidity();
    }

    if (this.BirthDetail.IsValidCheck(undefined, undefined)) {
      let updatedValue = this.BirthDetail.BabyBirthDetailsValidator.value;
      updatedValue.BabyBirthDetailsId = this.SelectedBabyDetails.BabyBirthDetailsId;
      updatedValue.CertificateNumber = this.SelectedBabyDetails.CertificateNumber;
      updatedValue.BirthNumberType = this.SelectedBabyDetails.BirthNumberType;
      updatedValue.FathersName = this.SelectedBabyDetails.FathersName;
      updatedValue.BirthType = this.SelectedBabyDetails.BirthType;
      updatedValue.IssuedBy = this.IssuedSignatory.EmployeeId;
      updatedValue.CertifiedBy = this.CertifiedBy.EmployeeId;
      this._clinicalNoteBLService.UpdateBirthDetail(updatedValue)
        .subscribe((res: DanpheHTTPResponse) => {
          if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Success, [
              "Birth Details Updated.",
            ]);
            this.UpdateEmitter.emit();

            this.SelectedBabyDetails = new BabyBirthDetails();
            this.CertifiedBy = null;
            this.IssuedSignatory = null;


          } else {
            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, [
              "failed to update the Birth Details",
            ]);
          }
        });

    }
  }
  /**
  * @summary Retrieves baby birth condition details.
  */
  public GetBirthType(): void {
    let birthTypeList = this.coreService.GetBirthType();
    this.BirthTypeList = birthTypeList.map(birthType => { return { type: birthType, IsSelected: false }; });
  }
  public OnChangeIssuedSignatory() {
  }
  public OnChangeCertifiedSignatory() {
  }


  /**
   * @summary updates the birth details in BirthList which are based on PatientId.
   */
  public SaveBirthDetail(): void {
    this.Loading = true;
    let IsDataValid: boolean = this.ValidateBirthDetails();

    if (IsDataValid) {
      if (this.SelectedBabyDetails.BabyBirthDetailsId && this.SelectedBabyDetails.BabyBirthDetailsId > 0) {
        this.SelectedBabyDetails.IssuedBy = this.IssuedSignatory.EmployeeId;
        this.SelectedBabyDetails.CertifiedBy = this.CertifiedBy.EmployeeId;
        this._clinicalNoteBLService.UpdateBirthDetail(this.SelectedBabyDetails).subscribe(res => {
          if (res.Status == 'OK') {
            this.BabyBirthDetails[this.SelectedBirthCertIndex] = this.SelectedBabyDetails;
            this.SelectedBabyDetails = new BabyBirthDetails();
            this.SelectedBirthCertIndex = -1;
            this.IsEditMode = false;
            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Success, ["Birth Detail is Updated."]);
            this.IsUpdateMode = false;
            this.UpdateModeChanged.emit(this.IsUpdateMode);

            this.UpdateEmitter.emit();
            this.CertifiedBy = null;
            this.IssuedSignatory = null;
          }
        });
      } else {
        this.BabyBirthDetails[this.SelectedBirthCertIndex] = this.SelectedBabyDetails;
        let NewlyBabyBirthDetails: Array<BabyBirthDetails> = new Array<BabyBirthDetails>();
        NewlyBabyBirthDetails = this.BabyBirthDetails.filter(a => a.BabyBirthDetailsId == 0);
        this.AddEmitter.emit(NewlyBabyBirthDetails);
        this.SelectedBabyDetails = new BabyBirthDetails();
        this.SelectedBirthCertIndex = -1;
        this.IsEditMode = false;
        this.IsUpdateMode = false;
        this.UpdateModeChanged.emit(this.IsUpdateMode);


      }
      this.Loading = false;
    }
    else {
      this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Warning, ["Invalid Inputs"]);
      this.Loading = false;
    }
  }


  /**
   * @summary Initiates editing of the birth details at the specified index.
   * Sets the selected birth certificate index and enters edit mode.
   * Emits edit mode change event.
   * Copies the selected birth details to the editing form.
   * @param brthIndex Index of the birth details to edit.
   */
  public EditCurrentBirthDetail(brthIndex: number): void {
    this.SelectedBirthCertIndex = brthIndex;
    let currBrth = this.BabyBirthDetails[brthIndex];
    this.CertificateNoBeforeEdit = null;
    if (currBrth) {
      this.IsEditMode = true;

      this.SelectedBabyDetails = Object.assign(new BabyBirthDetails(), currBrth);
      this.CertificateNoBeforeEdit = this.SelectedBabyDetails.CertificateNumber;
      this.CertifiedBy = this.ProviderList.find(p => p.EmployeeId === this.SelectedBabyDetails.CertifiedBy) || new Employee;
      this.IssuedSignatory = this.ProviderList.find(p => p.EmployeeId === this.SelectedBabyDetails.IssuedBy) || new Employee;
      this.IsUpdateMode = currBrth.BabyBirthDetailsId > 0;
      this.UpdateModeChanged.emit(this.IsUpdateMode);
    }
  }
  /**
   * @summary Removes the birth details at the specified index from the list.
   * Emits updated list of baby birth details after removal.
   * @param brthIndex Index of the birth details to remove.
   */
  public RemoveCurrentBirthDetail(brthIndex: number) {
    this.BabyBirthDetails.splice(brthIndex, 1);
    let NewlyBabyBirthDetails: Array<BabyBirthDetails> = new Array<BabyBirthDetails>();
    NewlyBabyBirthDetails = this.BabyBirthDetails;
    this.AddEmitter.emit(NewlyBabyBirthDetails);
  }


  /**
 *@summary Fetches birth details for the selected mother patient ID from the backend service.
 * @param motherPatientId The ID of the mother patient for whom to fetch baby birth details.
 */
  public GetBabyDetailsListByMotherPatientId(): void {
    this.Loading = false;
    this._clinicalNoteBLService.GetBabyDetailsListByMotherPatientId(this.MotherPatientId)
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status == ENUM_DanpheHTTPResponseText.OK) {
          this.BabyBirthDetails = new Array<BabyBirthDetails>();
          this.BabyBirthDetails = res.Results;

        }
      }
      );
  }
  /**
   * @summary Retrieves the list of baby birth conditions from the backend service.
   */
  public GetBabyBirthCondition(): void {
    this._clinicalNoteBLService.GetBabyBirthCondition()
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status == ENUM_DanpheHTTPResponseText.OK) {
          this.BirthConditionList = res.Results;

        }
        else {
          this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, [res.ErrorMessage]);
        }
      },
        err => {
          this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, [err.ErrorMessage]);
        });
  }
  /**
   * @summary Checks for duplication of the selected baby's birth certificate number among existing and new birth details.
   * Sets `DuplicateCertificateNumber` flag based on duplication status.
   */
  public BirthCertificateNumberDuplicationCheck(): void {
    this.DuplicateCertificateNumber = undefined;
    let a = this.AllBirthCertificateNumbers.some(a => a.CertificateNumber == this.SelectedBabyDetails.CertificateNumber);
    let b = this.AllNewBirthDetails.some(b => b.CertificateNumber == this.SelectedBabyDetails.CertificateNumber);
    if (this.SelectedBabyDetails.CertificateNumber && (a || b)) {
      if (this.CertificateNoBeforeEdit != this.SelectedBabyDetails.CertificateNumber) {
        this.DuplicateCertificateNumber = true;
      }

    } else {
      this.DuplicateCertificateNumber = false;

    }
  }
  /**
    * @summary Retrieves all available birth certificate numbers from the backend service.
  */
  public GetAllBirthCertificateNumbers(): void {
    this._clinicalNoteBLService.GetAllBirthCertificateNumbers()
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status == ENUM_DanpheHTTPResponseText.OK) {
          this.AllBirthCertificateNumbers = res.Results;
        }
      }
      );
  }

  public myListFormatter(data: any): string {
    let html = data["FullName"];
    return html;
  }

  public CancelUpdate(): void {
    this.SelectedBabyDetails = new BabyBirthDetails();
    this.CertifiedBy = null;
    this.IssuedSignatory = null;
    this.IsEditMode = false;
  }

}
