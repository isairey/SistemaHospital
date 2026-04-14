import { ChangeDetectorRef, Component, EventEmitter, Input, Output } from '@angular/core';
import * as moment from 'moment';
import { Observable } from 'rxjs-compat';
import { BillingTransaction } from '../../../../billing/shared/billing-transaction.model';
import { SchemePriceCategory_DTO } from '../../../../billing/shared/dto/scheme-pricecategory.dto';
import { CoreService } from '../../../../core/shared/core.service';
import { MedicarePatient_DTO } from '../../../../insurance/medicare/shared/dto/mecicare-patient-dto';
import { Medicare_EmployeeDesignation_DTO } from '../../../../insurance/medicare/shared/dto/medicare-employee-designation.dto';
import { MedicareBLService } from '../../../../insurance/medicare/shared/medicare.bl.service';
import { MedicareService } from '../../../../insurance/medicare/shared/service/medicare.service';
import { DepartmentsList, MedicalCareType, MedicareInstitute, MedicareMemberModel, MembersData } from '../../../../patients/shared/patient-medicare-member.model';
import { PatientsBLService } from '../../../../patients/shared/patients.bl.service';
import { DanpheHTTPResponse } from '../../../../shared/common-models';
import { MessageboxService } from '../../../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponseText, ENUM_DateTimeFormat, ENUM_MessageBox_Status, ENUM_Relation } from '../../../../shared/shared-enums';
import { InsuranceProviderModel } from '../../../shared/insurance-provider.model';


@Component({
  selector: 'app-patient-medicare-member',
  templateUrl: './patient-medicare-member.component.html',
  styleUrls: ['./patient-medicare-member.component.css']
})
export class PatientMedicareMemberComponent {

  @Input() selectedPatient: MembersData = new MembersData();
  @Input() AssisgnMember: boolean;

  @Output("callback-add-member")
  CallBackAddMember: EventEmitter<Object> = new EventEmitter<Object>();

  ShowAddMemberPage: boolean = false;
  DepartmentsList: Array<DepartmentsList> = new Array<DepartmentsList>();
  showAddDepartmentPage: boolean;
  @Input('isEditForm') isUpdate: boolean = false;
  showAddEmployeeRolePage: boolean = false;
  DesignationList: Array<Medicare_EmployeeDesignation_DTO> = [];
  MedicalCareTypeList: Array<MedicalCareType> = [];
  MedicareInstituteList: Array<MedicareInstitute> = [];
  InsuranceProvidersList: Array<InsuranceProviderModel> = [];
  @Input('rowData') rowData;
  MemberDetails: MedicareMemberModel = new MedicareMemberModel();
  MedicareType: MedicalCareType = new MedicalCareType();
  SelectedDesignation: Medicare_EmployeeDesignation_DTO = new Medicare_EmployeeDesignation_DTO();
  SelectedDepartment: DepartmentsList = null;
  SelectedInstitute: MedicareInstitute = null;
  SelectedMedicareType: MedicalCareType = new MedicalCareType();
  MemberData: MembersData = new MembersData();

  //patientId: number;
  ShowBirthType: boolean = false;
  MedicareTypeId: number;
  DisableBtn: boolean = true;
  InstituteList: MedicareInstitute[];
  SelectedMedicareInstitute: MedicareInstitute = new MedicareInstitute();
  SelectedInsuranceProvider: InsuranceProviderModel = new InsuranceProviderModel();
  //medicarePatients: any;
  MedicareTypeName: string = "";
  MedicarePatientList: Array<MedicarePatient_DTO> = new Array<MedicarePatient_DTO>();
  //selectedDate: string = moment().format(ENUM_DateTimeFormat.Year_Month_Day);
  public SchemePriceCategory: SchemePriceCategory_DTO = new SchemePriceCategory_DTO();
  public CategoryScheme: BillingTransaction = new BillingTransaction();
  public serviceBillingContext: string = "";
  public SelectedSchemePriCeCategory: SchemePriceCategoryCustomType = { SchemeId: 0, PriceCategoryId: 0 };
  constructor(public medicareBlService: MedicareBLService, public coreService: CoreService,
    private patientBLService: PatientsBLService,
    public changeDetector: ChangeDetectorRef, public msgBoxService: MessageboxService, public medicareService: MedicareService) {

    this.GetAllDesignations();
    this.GetAllDepartments();
    this.GetAllInsuranceProvidersList();
    this.GetAllMedicareTypes();
    this.GetAllMedicareInstitutes();
  }
  ngOnInit() {
    if (this.AssisgnMember == true) {
      this.isUpdate = false;
      // this.changeDetector.detectChanges();
      if (this.selectedPatient && this.selectedPatient.PatientCode) {

        this.MemberData = this.selectedPatient;
        if (this.MemberData) {
          this.MemberData.MedicareStartDate = moment().format(ENUM_DateTimeFormat.Year_Month_Day);
          this.MemberDetails.MedicareMemberValidator.controls['Age'].setValue(this.MemberData.Age);
          this.MemberDetails.MedicareMemberValidator.controls['Age'].disable();
          this.MemberDetails.MedicareMemberValidator.controls['Gender'].setValue(this.MemberData.Gender);
          this.MemberDetails.MedicareMemberValidator.controls['Gender'].disable();
          this.MemberDetails.MedicareMemberValidator.controls['MedicareStartDate'].setValue(this.MemberData.MedicareStartDate);
          this.MemberDetails.MedicareMemberValidator.controls['MedicareStartDate'].disable();
          this.changeDetector.markForCheck();
        }

      }
    }
    else {
      this.MemberData = null;
    }
    this.GetMedicarePatients()
    this.MemberDetails.MedicareStartDate = moment().format(ENUM_DateTimeFormat.Year_Month_Day);
    this.MemberDetails.MedicareEndDate = moment().format(ENUM_DateTimeFormat.Year_Month_Day);

    this.InstituteList = this.medicareService.medicareInstituteList

    if (this.isUpdate) {
      this.SelectedSchemePriCeCategory.SchemeId = this.rowData.SchemeId;
      this.SelectedSchemePriCeCategory.PriceCategoryId = this.rowData.PriceCategoryId;
      this.GetAllInsuranceProvidersList().then(() => {
        this.SetMedicareMember();
      });
    }
  }


  public GetAllDepartments(): void {
    this.patientBLService.GetAllDepartment().subscribe(
      (res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
          this.DepartmentsList = res.Results;
        }
      }
    );
  }
  SetMedicareMember() {
    this.MemberDetails.PatientId = this.rowData.PatientId;
    //this.MemberDetails.DesignationId = this.rowData.DesignationId;
    this.MemberDetails.DesignationId = (this.rowData.DesignationId === 0 || this.rowData.DesignationId == null) ? null : this.rowData.DesignationId;
    this.MemberDetails.Age = this.rowData.Age;
    this.ShowBirthType = true;
    this.MemberDetails.Gender = this.rowData.Gender;
    this.MemberDetails.DateOfBirth = this.rowData.DateOfBirth;
    this.MemberDetails.FullName = this.rowData.Name;
    this.MemberDetails.Remarks = this.rowData.Remarks;
    this.MemberDetails.InsurancePolicyNo = this.rowData.InsurancePolicyNo;
    this.SelectedDesignation = this.DesignationList.find(x => x.DesignationId === this.rowData.DesignationId);
    this.SelectedInstitute = this.MedicareInstituteList.find(x => x.MedicareInstituteCode === this.rowData.Institution);
    this.SelectedDepartment = this.DepartmentsList.find(x => x.DepartmentId === this.rowData.DepartmentId);
    this.MemberDetails.MedicareStartDate = this.rowData.MedicareStartDate;
    this.MemberDetails.MedicareEndDate = this.rowData.MedicareEndDate;
    this.MemberDetails.DepartmentId = (this.rowData.DepartmentId === 0 || this.rowData.DepartmentId == null) ? null : this.rowData.DepartmentId;
    this.MemberDetails.MedicareTypeId = (this.rowData.MedicareTypeId === 0 || this.rowData.MedicareTypeId == null) ? null : this.rowData.MedicareTypeId;
    this.MemberDetails.MedicareTypeName = this.rowData.Category;
    this.MemberDetails.MedicareMemberId = this.rowData.MedicareMemberId;
    let obj = this.MedicalCareTypeList.find(x => x.MedicareTypeId === this.MemberDetails.MedicareTypeId);
    this.SelectedMedicareType = obj;
    this.MemberDetails.MemberNo = this.rowData.MedicareNo;
    this.MemberDetails.HospitalNo = this.rowData.HospitalNo;
    //this.MemberDetails.InsuranceProviderId = this.rowData.InsuranceProviderId;
    this.MemberDetails.InsuranceProviderId = (this.rowData.InsuranceProviderId === 0 || this.rowData.InsuranceProviderId == null) ? null : this.rowData.InsuranceProviderId;
    this.MemberDetails.InsuranceProviderId = (this.rowData.InsuranceProviderId === 0 || this.rowData.InsuranceProviderId == null) ? "" : this.rowData.InsuranceProviderId;

    if (this.SelectedInstitute && this.SelectedInstitute.MedicareInstituteCode) {
      this.MemberDetails.MedicareInstituteCode = this.SelectedInstitute.MedicareInstituteCode;
    } else {
      this.MemberDetails.MedicareInstituteCode = null;
    }

    let med = this.MedicareInstituteList.find(a => a.MedicareInstituteCode === this.MemberDetails.MedicareInstituteCode);
    this.SelectedMedicareInstitute = med;
    this.MemberDetails.IsIpLimitExceeded = this.rowData.IsIpLimitExceeded;
    this.MemberDetails.IsOpLimitExceeded = this.rowData.IsOpLimitExceeded;
    this.MemberDetails.IsActive = this.rowData.IsActive;
    this.MemberDetails.MedicareMemberValidator.controls['DesignationId'].setValue(this.MemberDetails.DesignationId);
    this.MemberDetails.MedicareMemberValidator.controls['DepartmentId'].setValue(this.MemberDetails.DepartmentId);
    this.MemberDetails.MedicareMemberValidator.controls['InsuranceProviderId'].setValue(this.MemberDetails.InsuranceProviderId);
    this.MemberDetails.MedicareMemberValidator.controls['Age'].setValue(this.rowData.Age);
    this.MemberDetails.MedicareMemberValidator.controls['Age'].disable();
    this.MemberDetails.MedicareMemberValidator.controls['Gender'].setValue(this.rowData.Gender);
    this.MemberDetails.MedicareMemberValidator.controls['Gender'].disable();
    this.MemberDetails.MedicareMemberValidator.controls['MedicareStartDate'].setValue(this.rowData.MedicareStartDate);
    this.MemberDetails.MedicareMemberValidator.controls['MedicareStartDate'].disable();
    this.MemberDetails.MedicareMemberValidator.controls['PatientId'].setValue(this.rowData.PatientId);
    //this.MemberDetails.MedicareMemberValidator.controls['MedicareInstituteCode'].setValue(this.SelectedInstitute.MedicareInstituteCode);
    this.MemberDetails.MedicareMemberValidator.controls['MemberNo'].setValue(this.rowData.MedicareNo);
    this.MemberDetails.MedicareMemberValidator.controls['MemberNo'].disable();
    //this.MemberDetails.MedicareMemberValidator.controls['MedicareTypeId'].setValue(this.rowData.MedicareTypeId);
    this.MemberDetails.MedicareMemberValidator.controls['FullName'].setValue(this.rowData.Name);
    this.MemberDetails.MedicareMemberValidator.controls['FullName'].disable();
    this.MemberDetails.MedicareMemberValidator.controls['HospitalNo'].setValue(this.rowData.HospitalNo);
    this.MemberDetails.MedicareMemberValidator.controls['Remarks'].setValue(this.rowData.Remarks);

    this.DisableBtn = false;
    this.AssisgnMember
    this.changeDetector.detectChanges();
  }
  Close() {
    this.ShowAddMemberPage = false;
    this.CallBackAddMember.emit(true);
  }
  OnSchemePriceCategoryChanged(schemePriceObj: SchemePriceCategory_DTO): void {
    if (schemePriceObj.SchemeId && schemePriceObj.PriceCategoryId) {
      this.SchemePriceCategory = schemePriceObj;
      this.CategoryScheme.Remarks = this.SchemePriceCategory.SchemeName;
    }
  }
  public GetAllDesignations(): void {
    this.patientBLService.GetAllDesignations().subscribe(
      (res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
          this.DesignationList = res.Results;
        }
      }
    );
  }
  public GetAllMedicareTypes(): void {
    this.patientBLService.GetAllMedicareTypes().subscribe(
      (res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
          this.MedicalCareTypeList = res.Results;
        }
      }
    );
  }
  public GetMedicarePatients(): void {
    this.patientBLService.GetMedicarePatientList().subscribe(
      (res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
          this.MedicarePatientList = res.Results;
        }
        else {
          this.msgBoxService.showMessage(ENUM_MessageBox_Status.Failed, ['Failed To Load Data' + res.ErrorMessage]);
        }
      },
      err => {
        this.msgBoxService.showMessage(ENUM_MessageBox_Status.Error, [err]);
      });
  }

  GetAllMedicareInstitutes(): void {
    this.patientBLService.GetAllMedicareInstitutes().subscribe(
      (res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
          this.MedicareInstituteList = res.Results;
        }
      }
    );
  }


  GetAllInsuranceProvidersList(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.patientBLService.GetAllInsuranceProviderList().subscribe(
        (res: DanpheHTTPResponse) => {
          if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
            this.InsuranceProvidersList = res.Results;
            resolve(); // Resolve the promise after data is loaded
          } else {
            reject('Failed to load InsuranceProvidersList');
          }
        },
        (err) => {
          reject(err);
        }
      );
    });
  }


  GetMemberDetailsByPatientId(patientId: number): void {
    this.patientBLService.GetMedicareMemberDetailByPatientId(patientId).subscribe(
      (res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
          const memberDetail = res.Results;

          this.DisableBtn = false;
          Object.assign(this.MemberDetails, memberDetail);

          this.MemberDetails.MedicareStartDate = memberDetail.MedicareStartDate || null;
          this.MemberDetails.DepartmentId = memberDetail.DepartmentId;
          this.MemberDetails.MedicareTypeId = memberDetail.MedicareTypeId;
          this.SelectedInstitute = this.MedicareInstituteList.find(x => x.MedicareInstituteCode === memberDetail.MedicareInstituteCode);
          this.SelectedDesignation = this.DesignationList.find(x => x.DesignationId === memberDetail.DesignationId);
          this.SelectedDepartment = this.DepartmentsList.find(x => x.DepartmentId === memberDetail.DepartmentId);
          this.MemberDetails.MedicareMemberValidator.controls["MedicareTypeId"].setValue(memberDetail.MedicareTypeId);
          this.MemberDetails.MedicareMemberValidator.controls["Remarks"].setValue(memberDetail.Remarks);
          this.MemberDetails.MedicareMemberValidator.controls["DesignationId"].setValue(memberDetail.DesignationId);
          this.MemberDetails.MedicareMemberValidator.controls["DepartmentId"].setValue(memberDetail.DepartmentId);
          this.MemberDetails.MedicareMemberValidator.controls["MedicareInstituteCode"].setValue(memberDetail.MedicareInstituteCode);
          this.MemberDetails.MedicareMemberValidator.controls["InsuranceProviderId"].setValue(memberDetail.InsuranceProviderId);
          this.MemberDetails.MedicareMemberValidator.controls["MemberNo"].setValue(memberDetail.MemberNo);
          this.isUpdate = true;
        } else {
          this.DisableBtn = true;
          this.isUpdate = false;
          this.msgBoxService.showMessage(ENUM_MessageBox_Status.Error, ['Unable to get member details Check Console']);
        }
      },
      (err: DanpheHTTPResponse) => {
        this.msgBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Something went wrong! ${err.ErrorMessage}`]);
      }
    )
  }


  OnSubmit(): void {
    this.MemberDetails.DepartmentId = this.MemberDetails.MedicareMemberValidator.controls['DepartmentId'].value;
    this.MemberDetails.DesignationId = this.MemberDetails.MedicareMemberValidator.controls['DesignationId'].value;
    this.MemberDetails.InsuranceProviderId = this.MemberDetails.MedicareMemberValidator.controls['InsuranceProviderId'].value;
    if (!this.MemberDetails.MedicareStartDate) {
      this.MemberDetails.MedicareStartDate = moment().format(ENUM_DateTimeFormat.Year_Month_Day);
    }
    if (!this.MemberDetails.MedicareEndDate) {
      this.MemberDetails.MedicareEndDate = moment().format(ENUM_DateTimeFormat.Year_Month_Day);
    }
    if (this.MemberDetails.MedicareInstituteCode === '') {
      this.MemberDetails.MedicareInstituteCode = null;
    }

    this.MemberDetails.SchemeId = this.SchemePriceCategory.SchemeId;
    this.MemberDetails.PriceCategoryId = this.SchemePriceCategory.PriceCategoryId;

    if (this.MemberDetails) {
      this.MemberDetails.MedicareMemberValidator.controls['MedicareStartDate'].setValue(this.MemberDetails.MedicareStartDate);
      this.MemberDetails.MedicareMemberValidator.controls['MedicareEndDate'].setValue(this.MemberDetails.MedicareEndDate);
      this.MemberDetails.FullName = this.MemberDetails.MedicareMemberValidator.get("FullName").value;

      if (this.ValidateMedicareMemberDetails()) {
        if (this.isUpdate) {
          this.patientBLService.PutMedicareMemberDetails(this.MemberDetails)
            .finally(() => this.DisableBtn = false)
            .subscribe(
              (res: DanpheHTTPResponse) => {
                if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
                  this.DisableBtn = true;
                  this.ResetVariables();
                  this.msgBoxService.showMessage(ENUM_MessageBox_Status.Success, ['Member Details has been Updated Successfully']);
                  this.CallBackAddMember.emit(true);
                  this.Close();
                  this.GetMedicarePatients();
                } else {
                  this.msgBoxService.showMessage(ENUM_MessageBox_Status.Error, ['Unable to Update member Details']);
                }
              }
            );
        } else {
          this.patientBLService.PostMedicareMemberDetails(this.MemberDetails)
            .finally(() => this.DisableBtn = false)
            .subscribe(
              (res: DanpheHTTPResponse) => {
                if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
                  this.DisableBtn = true;
                  this.ResetVariables();
                  this.msgBoxService.showMessage(ENUM_MessageBox_Status.Success, ['Member has been added Successfully']);
                  this.CallBackAddMember.emit(true);
                  this.Close();
                  this.GetMedicarePatients();
                } else {
                  this.msgBoxService.showMessage(ENUM_MessageBox_Status.Error, [`something went wrong. ${res.ErrorMessage}`]);
                  // this.msgBoxService.showMessage(ENUM_MessageBox_Status.Failed, ['Something went wrong!, Could not add a member']);
                }
              },
              (err: DanpheHTTPResponse) => {
                this.msgBoxService.showMessage(ENUM_MessageBox_Status.Error, [`something went wrong. ${err.ErrorMessage}`]);
              }
            );
        }
      } else {
        this.msgBoxService.showMessage(ENUM_DanpheHTTPResponseText.Failed, ['Validation error!']);
      }
    }
    else {
      this.msgBoxService.showMessage(ENUM_MessageBox_Status.Notice, ['Selected Medicare Type is Not-Mappped to Ledger']);
    }
  }


  private ResetVariables(): void {
    this.MemberDetails = new MedicareMemberModel();
    this.MemberData = null;
    this.MedicareType = null;
    this.SelectedDesignation = null;
    this.SelectedDepartment = null;
    this.SelectedInstitute = null;
  }

  AddDepartment(): void {
    this.showAddDepartmentPage = true;
  }
  AddEmployeeRole(): void {
    this.showAddEmployeeRolePage = true;
  }
  CallBackAddDepartment($event): void {
    if ($event) {
      if ($event.action === "add" && $event.department) {
        const department = {
          DepartmentCode: $event.department.DepartmentCode,
          DepartmentId: $event.department.DepartmentId,
          DepartmentName: $event.department.DepartmentName
        }

        this.DepartmentsList.push(department);
      }
      else if ($event.action === "add" && $event.department === null) {
        this.msgBoxService.showMessage(ENUM_MessageBox_Status.Error, ["Unable To add Department."]);
      }
      this.changeDetector.detectChanges();
      this.showAddDepartmentPage = false;
      this.DepartmentsList = this.DepartmentsList.slice();
    }

  }
  CallBackAddEmployeeRole($event): void {
    if ($event) {
      if ($event.employee) {
        {
          const designations = {
            DesignationName: $event.employee.EmployeeRoleName,
            DesignationId: $event.employee.EmployeeRoleId
          }

          this.DesignationList.push(designations);
        }
        this.changeDetector.detectChanges();
        this.showAddEmployeeRolePage = false;
      }
      this.DesignationList = this.DesignationList.slice();
    }
  }
  public AllPatientSearchAsync = (keyword: any): Observable<any[]> => {
    return this.patientBLService.GetPatientsWithVisitsInfo(keyword);
  }
  SelectMember(): void {
    let registeredName = this.MedicarePatientList.some(item => item.HospitalNo === this.MemberData.PatientCode);
    if (registeredName) {
      this.msgBoxService.showMessage(ENUM_MessageBox_Status.Error, ["Member is already registered"]);
    }
    else {
      this.DisableBtn = false;
      this.MemberDetails = new MedicareMemberModel();
      this.MemberDetails.Age = this.MemberData.Age ? +this.MemberData.Age.substring(0, (this.MemberData.Age.length - 1)) : 0;
      this.SelectedDepartment = null;
      this.SelectedDesignation = null;
      this.SelectedInstitute = null;
      this.MemberDetails.PatientId = this.MemberData.PatientId;
      this.MemberDetails.HospitalNo = this.MemberData.PatientCode;
      this.MemberDetails.DateOfBirth = this.MemberData.DateOfBirth;
      this.ShowBirthType = true;
      this.MemberDetails.Gender = this.MemberData.Gender;
      this.MemberDetails.Relation = ENUM_Relation.Self;
      this.MemberDetails.MedicareMemberValidator.controls["Age"].setValue(this.MemberDetails.Age);
      this.MemberDetails.MedicareMemberValidator.controls["Gender"].setValue(this.MemberDetails.Gender);
      this.MemberDetails.MedicareMemberValidator.controls["PatientId"].setValue(this.MemberData.PatientId);
      this.MemberDetails.MedicareMemberValidator.controls["HospitalNo"].setValue(this.MemberData.PatientCode);
      this.MemberDetails.MedicareMemberValidator.controls["FullName"].setValue(this.MemberData.ShortName);
      if (this.MemberData.MedicareMemberNo !== null) {
        if (this.AssisgnMember == true) {
          this.isUpdate = false;
        } else {
          this.isUpdate = true;
        }
        if (this.AssisgnMember == false) {
          this.GetMemberDetailsByPatientId(this.MemberData.PatientId);
        }
      }
    }
  }

  AssignSelectedDesignation() {
    this.MemberDetails.DesignationId = this.SelectedDesignation.DesignationId;
  }


  AssignSelectedDepartment() {
    this.MemberDetails.DepartmentId = this.SelectedDepartment.DepartmentId;
  }
  AssignSelectedInstitute() {
    this.MemberDetails.MedicareInstituteCode = this.SelectedMedicareInstitute.MedicareInstituteCode;
  }
  AssignSelectedMedicareType() {
    const selectedMedicare = this.MedicalCareTypeList.find(
      x => x.MedicareTypeId === this.SelectedMedicareType.MedicareTypeId
    );
    if (selectedMedicare) {
      this.MemberDetails.MedicareTypeId = selectedMedicare.MedicareTypeId;
      this.MemberDetails.LedgerId = selectedMedicare.LedgerId;
      this.MemberDetails.MedicareTypeName = selectedMedicare.MedicareTypeName;
    } else {
      console.error('SelectedMedicareTypeId not found in MedicalCareTypeList');
    }
  }
  ValidateMedicareMemberDetails(): boolean {
    for (let i in this.MemberDetails.MedicareMemberValidator.controls) {
      this.MemberDetails.MedicareMemberValidator.controls[i].markAsDirty();
      this.MemberDetails.MedicareMemberValidator.controls[i].updateValueAndValidity();
    }
    if (this.MemberDetails.IsValidCheck(undefined, undefined)) {
      return true;
    } else {
      return false;
    }
  }
  PatientListFormatter(data: any): string {
    let html: string = "";
    html = "<font size=03>" + "[" + data["PatientCode"] + "]" + "</font>&nbsp;-&nbsp;&nbsp;<font color='blue'; size=03 ><b>" + data["ShortName"] +
      "</b></font>&nbsp;&nbsp;" + "(" + data["Age"] + '/' + data["Gender"] + ")" + '' + "</b></font>";
    return html;
  }


  public GetFormattedAgeLabel(dateOfBirth): string {

    let currentDate = moment().format(ENUM_DateTimeFormat.Year_Month_Day);
    let years = moment(currentDate).diff(moment(dateOfBirth).format(ENUM_DateTimeFormat.Year_Month_Day), 'years');
    let totMonths = moment(currentDate).diff(moment(dateOfBirth).format(ENUM_DateTimeFormat.Year_Month_Day), 'months');
    let totDays = moment(currentDate).diff(moment(dateOfBirth).format(ENUM_DateTimeFormat.Year_Month_Day), 'days');
    if (years >= 1) {
      return 'Years';
    }
    else if (totMonths < 1) {
      if (Number(totDays) == 0)
        totDays = 1;
      return 'Days';
    }
    else {
      return 'Months';
    }

  }
}
