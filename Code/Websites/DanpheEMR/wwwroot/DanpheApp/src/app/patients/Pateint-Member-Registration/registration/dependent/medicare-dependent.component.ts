import { ChangeDetectorRef, Component, EventEmitter, Input, Output } from '@angular/core';
import * as moment from 'moment';
import { Observable } from 'rxjs';
import { BillingTransaction } from '../../../../billing/shared/billing-transaction.model';
import { SchemePriceCategory_DTO } from '../../../../billing/shared/dto/scheme-pricecategory.dto';
import { CoreService } from '../../../../core/shared/core.service';
import { Medicare_EmployeeDesignation_DTO } from '../../../../insurance/medicare/shared/dto/medicare-employee-designation.dto';
import { MedicalCareType, MedicareInstitute } from '../../../../insurance/medicare/shared/medicare-member.model';
import { MedicareBLService } from '../../../../insurance/medicare/shared/medicare.bl.service';
import { MedicareService } from '../../../../insurance/medicare/shared/service/medicare.service';
import { InsuranceProviderModel } from '../../../../patients/shared/insurance-provider.model';
import { MedicareDependentData, MedicareDependentModel } from '../../../../patients/shared/patient-medicare-dependent.model';
import { DepartmentsList, MedicareMemberModel, MembersData } from '../../../../patients/shared/patient-medicare-member.model';
import { PatientsBLService } from '../../../../patients/shared/patients.bl.service';
import { DanpheHTTPResponse } from '../../../../shared/common-models';
import { MessageboxService } from '../../../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponseText, ENUM_DateTimeFormat, ENUM_MessageBox_Status } from '../../../../shared/shared-enums';


@Component({
  selector: 'app-dependent',
  templateUrl: './medicare-dependent.component.html',
  styleUrls: ['./medicare-dependent.component.css']
})
export class MedicareDependentComponent {

  @Output("callback-add-dependent")
  callbackAdd: EventEmitter<Object> = new EventEmitter<Object>();
  DepartmentsList: Array<DepartmentsList> = new Array<DepartmentsList>();
  public SchemePriceCategory: SchemePriceCategory_DTO = new SchemePriceCategory_DTO();
  ShowBirthType: boolean = false;
  public CategoryScheme: BillingTransaction = new BillingTransaction();
  DesignationList: Array<Medicare_EmployeeDesignation_DTO> = [];
  MedicalCareTypeList: Array<MedicalCareType> = [];
  MedicareInstituteList: Array<MedicareInstitute> = [];
  @Input('rowData') rowData;
  DependentDetails: MedicareDependentModel = new MedicareDependentModel();
  SelectedDesignation: Medicare_EmployeeDesignation_DTO = null;
  SelectedDepartment: DepartmentsList = null;
  InvalidParentMedicareNo: boolean = false;
  SelectedInstitute: MedicareInstitute = null;
  DependantMemberData: MembersData = new MembersData();
  MembersNo: number;
  DependentData: MedicareDependentData = new MedicareDependentData();
  InsuranceProvidersList: Array<InsuranceProviderModel> = [];
  ParentDetails: MedicareMemberModel = new MedicareMemberModel();
  @Input('isUpdate') isUpdate: boolean = false;
  DisableBtn: boolean;
  //patientId: number;
  public SelectedSchemePriCeCategory: SchemePriceCategoryCustomType = { SchemeId: 0, PriceCategoryId: 0 };
  InstituteList: MedicareInstitute[];
  SelectedInsuranceProvider: InsuranceProviderModel;
  loading: boolean = false;
  public serviceBillingContext: string = "";
  MedicareType: MedicalCareType = new MedicalCareType();
  SelectedMedicareInstitute: MedicareInstitute = new MedicareInstitute();
  SelectedMedicareType: MedicalCareType = new MedicalCareType();

  constructor(public medicareBlService: MedicareBLService,
    public coreService: CoreService,
    public medicareService: MedicareService,
    private patientBLService: PatientsBLService,
    public changeDetector: ChangeDetectorRef, public msgBoxService: MessageboxService) {
    this.GetAllDesignations();
    this.GetAllDepartments();
    this.GetAllInsuranceProvidersList();
    this.GetAllMedicareTypes();
    this.GetAllMedicareInstitutes();


  }
  ngOnInit() {
    this.InstituteList = this.medicareService.medicareInstituteList
    if (this.isUpdate) {
      this.SelectedSchemePriCeCategory.SchemeId = this.rowData.SchemeId;
      this.SelectedSchemePriCeCategory.PriceCategoryId = this.rowData.PriceCategoryId;
      this.GetAllMedicareTypes().then(() => {
        this.SetMedicareDependent();
      });
    } else {
      this.DependantMemberData = null;
    }
  }


  public GetAllMedicareTypes(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.patientBLService.GetAllMedicareTypes().subscribe(
        (res: DanpheHTTPResponse) => {
          if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
            this.MedicalCareTypeList = res.Results;
            resolve();
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

  SetMedicareDependent() {
    this.MembersNo = this.rowData.MedicareNo;
    this.DependentDetails.DependentMemberNo = this.rowData.MedicareNo;
    this.DependentDetails.ParentName = this.rowData.Employee;
    this.DependentDetails.Age = this.rowData.Age;
    this.DependentDetails.DateOfBirth = this.rowData.DateOfBirth;
    this.ShowBirthType = true;
    this.DependentDetails.Gender = this.rowData.Gender;
    this.DependentDetails.MedicareTypeId = (this.rowData.MedicareTypeId === 0 || this.rowData.MedicareTypeId == null) ? null : this.rowData.MedicareTypeId;
    this.DependentDetails.MedicareTypeName = this.rowData.Category;
    this.DependentDetails.InsuranceProviderId = (this.rowData.InsuranceProviderId === 0 || this.rowData.InsuranceProviderId == null) ? null : this.rowData.InsuranceProviderId;
    this.DependentDetails.Remarks = this.rowData.Remarks;
    this.DependentDetails.Relation = this.rowData.Relation.toLowerCase();
    this.DependentDetails.MedicareMemberId = this.rowData.MedicareMemberId;
    this.DependentDetails.MedicareTypeName = (this.rowData.Category === 0 || this.rowData.Category == null) ? null : this.rowData.Category;
    let obj = this.MedicalCareTypeList.find(x => x.MedicareTypeName === this.DependentDetails.MedicareTypeName);
    this.SelectedMedicareType = obj;
    this.DependentDetails.HospitalNo = this.rowData.HospitalNo;
    this.DependentDetails.InsurancePolicyNo = this.rowData.InsurancePolicyNo;
    this.DependentDetails.MemberNo = this.rowData.MedicareNo;
    this.DependentDetails.LedgerId = this.rowData.LedgerId;

    this.DependentDetails.ParentMedicareMemberId = this.rowData.ParentMedicareMemberId;
    //this.DependentDetails.DepartmentId = this.rowData.DepartmentId;
    this.DependentDetails.DepartmentId = (this.rowData.DepartmentId === 0 || this.rowData.DepartmentId == null) ? null : this.rowData.DepartmentId;
    this.DependentDetails.DesignationId = (this.rowData.DesignationId === 0 || this.rowData.DesignationId == null) ? null : this.rowData.DesignationId;
    //this.DependentDetails.DesignationId = this.rowData.DesignationId;
    this.DependentDetails.PatientId = this.rowData.PatientId;
    this.DependentDetails.FullName = this.rowData.Name;
    this.DependentDetails.IsActive = this.rowData.IsActive;
    this.DependentDetails.MedicareStartDate = this.rowData.MedicareStartDate;
    this.DependentDetails.MedicareEndDate = this.rowData.MedicareEndDate;
    this.SelectedDesignation = this.DesignationList.find(x => x.DesignationId === this.rowData.DesignationId);
    this.DependentDetails.MedicareInstituteCode = (this.rowData.Institution === 0 || this.rowData.Institution == null) ? null : this.rowData.Institution;
    this.SelectedInstitute = this.InstituteList.find(x => x.MedicareInstituteCode === this.rowData.Institution);

    if (this.SelectedInstitute && this.SelectedInstitute.MedicareInstituteCode) {
      this.DependentDetails.MedicareInstituteCode = this.SelectedInstitute.MedicareInstituteCode;
    } else {
      this.DependentDetails.MedicareInstituteCode = null;
    }
    this.SelectedInsuranceProvider = this.InsuranceProvidersList.find(x => x.InsuranceProviderId === this.rowData.InsuranceProviderId);
    this.SelectedDepartment = this.DepartmentsList.find(x => x.DepartmentId === this.rowData.DepartmentId);
    //this.DependentDetails.MedicareInstituteCode = this.SelectedInstitute.MedicareInstituteCode;
    let med = this.MedicareInstituteList.find(a => a.MedicareInstituteCode === this.DependentDetails.MedicareInstituteCode);
    this.SelectedMedicareInstitute = med;
    if (!this.SelectedMedicareInstitute) {
      // Handle case where no matching institute is found
      this.SelectedMedicareInstitute = null;
    }
    if (this.rowData && this.rowData.InsuranceProviderId) {
      this.SelectedInsuranceProvider = this.InsuranceProvidersList.find(
        x => x.InsuranceProviderId === this.rowData.InsuranceProviderId
      ) || null;
    } else {
      this.SelectedInsuranceProvider = null;
    }
    this.DependentDetails.MedicareDependentValidator.controls['MedicareStartDate'].setValue(this.rowData.MedicareStartDate);
    this.DependentDetails.MedicareDependentValidator.controls['MedicareStartDate'].disable();
    this.DependentDetails.MedicareDependentValidator.controls['MedicareEndDate'].setValue(this.rowData.MedicareEndDate);
    this.DependentDetails.MedicareDependentValidator.controls['MedicareEndDate'].disable();
    this.DependentDetails.MedicareDependentValidator.controls['PatientId'].setValue(this.rowData.PatientId);
    this.DependentDetails.MedicareDependentValidator.controls['FullName'].setValue(this.rowData.Name);
    this.DependentDetails.MedicareDependentValidator.controls['HospitalNo'].setValue(this.rowData.HospitalNo);
    this.DependentDetails.MedicareDependentValidator.controls['InsuranceProviderId'].setValue(this.rowData.InsuranceProviderId);
    this.DependentDetails.MedicareDependentValidator.controls['Relation'].setValue(this.rowData.Relation.toLowerCase());

    this.DependentDetails.MedicareDependentValidator.controls['Remarks'].setValue(this.rowData.Remarks);
    this.changeDetector.detectChanges();
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
  OnSchemePriceCategoryChanged(schemePriceObj: SchemePriceCategory_DTO): void {
    if (schemePriceObj.SchemeId && schemePriceObj.PriceCategoryId) {
      this.SchemePriceCategory = schemePriceObj;
      this.CategoryScheme.Remarks = this.SchemePriceCategory.SchemeName;
    }
  }
  Close() {
    this.callbackAdd.emit(true);
  }
  GetAllInsuranceProvidersList(): void {
    this.patientBLService.GetAllInsuranceProviderList().subscribe(
      (res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
          this.InsuranceProvidersList = res.Results;
        }
      }
    );
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

  GetAllMedicareInstitutes(): void {
    this.patientBLService.GetAllMedicareInstitutes().subscribe(
      (res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
          this.MedicareInstituteList = res.Results;
        }
      }
    );
  }
  OnSubmit(): void {
    if (this.ValidateMedicareDependentDetails()) {
      if (this.DependentDetails) {
        this.DependentDetails.SchemeId = this.SchemePriceCategory.SchemeId;
        this.DependentDetails.PriceCategoryId = this.SchemePriceCategory.PriceCategoryId;
        if (this.isUpdate === true) {
          this.patientBLService.PutMedicareDependentDetails(this.DependentDetails).subscribe(
            (res: DanpheHTTPResponse) => {
              if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
                this.isUpdate = false;
                this.msgBoxService.showMessage(ENUM_MessageBox_Status.Success, ['Details has been Updated Successfully']);
                this.callbackAdd.emit(true);
                this.Close();
              }
              else {
                this.msgBoxService.showMessage(ENUM_MessageBox_Status.Error, ['Unable to Update member Details']);
              }
            },
            (err: DanpheHTTPResponse) => {
              this.msgBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Something went wrong ${err.ErrorMessage}`]);
            });
        }
        else {

          this.patientBLService.PostMedicareDependentDetails(this.DependentDetails).subscribe(
            (res: DanpheHTTPResponse) => {
              if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
                this.msgBoxService.showMessage(ENUM_MessageBox_Status.Success, ['Member has been added Successfully']);
                this.callbackAdd.emit(true);
                this.Close();
              } else {
                //this.msgBoxService.showMessage(ENUM_MessageBox_Status.Error, ['Could not add Member']);
                this.msgBoxService.showMessage(ENUM_MessageBox_Status.Error, [res.ErrorMessage]);
              }
            },
            (err: DanpheHTTPResponse) => {
              this.msgBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Something went wrong ${err.ErrorMessage}`]);
            });
        }
        this.ResetVariables();
      }
      else {
        this.msgBoxService.showMessage(ENUM_MessageBox_Status.Notice, ['Selected Medicare Type is Not-Mappped to Ledger']);
      }
    }
  }

  private ResetVariables(): void {
    this.DependentDetails = new MedicareDependentModel();
    this.DependantMemberData = null;
    this.SelectedDesignation = null;
    this.SelectedDepartment = null;
    this.SelectedInstitute = null;
    this.MembersNo = null;
  }

  public AllPatientSearchAsync = (keyword: any): Observable<any[]> => {
    return this.patientBLService.GetPatientsWithVisitsInfo(keyword);
  }

  SelectParentMember() {
    this.DependentDetails.MedicareDependentValidator.controls["ParentMedicareMemberId"].setValue(this.DependentData.MedicareMemberNo);
    this.DependentDetails.MedicareDependentValidator.controls["ParentFullName"].setValue(this.DependentData.ShortName);
  }
  SelectDependentMember(): void {
    this.DisableBtn = false;
    this.DependentDetails.MedicareDependentValidator.controls["PatientId"].setValue(this.DependantMemberData.PatientId);
    this.DependentDetails.MedicareDependentValidator.controls["HospitalNo"].setValue(this.DependantMemberData.PatientCode);
    this.DependentDetails.MedicareDependentValidator.controls["FullName"].setValue(this.DependantMemberData.ShortName);
    this.DependentDetails.Age = this.DependantMemberData.Age ? +this.DependantMemberData.Age.substring(0, (this.DependantMemberData.Age.length - 1)) : 0;
    this.ShowBirthType = true;
    this.DependentDetails.PatientId = this.DependantMemberData.PatientId;
    this.DependentDetails.HospitalNo = this.DependantMemberData.PatientCode;
    this.DependentDetails.DateOfBirth = this.DependantMemberData.DateOfBirth ? new Date(this.DependantMemberData.DateOfBirth) : null;
    this.DependentDetails.FullName = this.DependantMemberData.ShortName;
    this.DependentDetails.Gender = this.DependantMemberData.Gender;
    if (this.DependantMemberData.MedicareMemberNo !== null) {
      this.isUpdate = true;
      this.GetMemberDetailsByPatientId(this.DependantMemberData.PatientId);
    }
  }

  AssignSelectedDesignation(): void {
    this.DependentDetails.MedicareDependentValidator.controls["DesignationId"].setValue(this.SelectedDesignation.DesignationId);
  }
  AssignSelectedDepartment(): void {
    this.DependentDetails.DepartmentId = this.SelectedDepartment.DepartmentId;
    this.DependentDetails.MedicareDependentValidator.controls["DepartmentId"].setValue(this.SelectedDepartment.DepartmentId);
  }

  ValidateMedicareDependentDetails() {
    for (let i in this.DependentDetails.MedicareDependentValidator.controls) {
      this.DependentDetails.MedicareDependentValidator.controls[i].markAsDirty();
      this.DependentDetails.MedicareDependentValidator.controls[i].updateValueAndValidity();
    }
    if (this.DependentDetails.IsValidCheck(undefined, undefined)) {
      return true;
    } else {
      return false;
    }
  }
  SearchMedicareMemByParentMedicareNo(): void {
    this.InvalidParentMedicareNo = false;
    this.patientBLService.GetMedicareMemberDetailByMedicareNumber(this.MembersNo).subscribe(
      (res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
          this.ParentDetails = res.Results;
          if (this.ParentDetails) {
            this.SelectedSchemePriCeCategory.SchemeId = this.ParentDetails.SchemeId;
            this.SelectedSchemePriCeCategory.PriceCategoryId = this.ParentDetails.PriceCategoryId;
            this.DependentDetails.MedicareStartDate = this.ParentDetails.MedicareStartDate;
            this.DependentDetails.MedicareEndDate = this.ParentDetails.MedicareEndDate;
            Object.assign(this.DependentDetails, this.ParentDetails);
            this.DependentDetails.IsDependent = true;
            this.DependentDetails.ParentName = this.ParentDetails.FullName;
            this.DependentDetails.FullName = '';
            this.DependentDetails.Remarks = '';
            this.DependentDetails.ParentMedicareMemberId = this.ParentDetails.MedicareMemberId;
            this.DependentDetails.IsActive = true;
            this.SelectedMedicareInstitute = this.InstituteList.find(x => x.MedicareInstituteCode === this.ParentDetails.MedicareInstituteCode);
            this.SelectedMedicareType = this.MedicalCareTypeList.find(x => x.MedicareTypeId === this.ParentDetails.MedicareTypeId);

            const medicareType = this.MedicalCareTypeList.find(
              (type) => type.MedicareTypeId === this.ParentDetails.MedicareTypeId
            );
            if (medicareType) {
              this.DependentDetails.MedicareTypeName = medicareType.MedicareTypeName;
              this.DependentDetails.LedgerId = medicareType.LedgerId;
            }

          }
          else {
            this.msgBoxService.showMessage(ENUM_MessageBox_Status.Warning, ["No record found. Please check Parent Medicare No"]);
            this.DependentDetails.MedicareDependentValidator.invalid;
          }
        }
        else if (res.Status === ENUM_DanpheHTTPResponseText.Failed) {
          this.msgBoxService.showMessage(ENUM_MessageBox_Status.Warning, ["No record found. Please check Parent Medicare No"]);
          this.DependentDetails.MedicareDependentValidator.invalid;
        }
        else {
          this.InvalidParentMedicareNo = true;
          this.msgBoxService.showMessage(ENUM_MessageBox_Status.Error, ["Something went wrong please check logs."]);
        }
      },
      (err: DanpheHTTPResponse) => {
        this.msgBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Something went wrong! ${err.ErrorMessage}`]);
      });
  }
  GetMemberDetailsByPatientId(patientId: number): void {
    this.DisableBtn = true;
    this.patientBLService.GetMedicareDependentMemberDetailByPatientId(patientId).subscribe(
      (res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
          let dependentMedicareMember = res.Results ? res.Results.MedicareDependent : null;
          let parentMedicareMember = res.Results ? res.Results.ParentMedicareMember : null;
          this.DisableBtn = false;
          if (dependentMedicareMember) {
            Object.assign(this.DependentDetails, dependentMedicareMember);
            this.MembersNo = parentMedicareMember.ParentMedicareNumber;
            this.DependentDetails.ParentName = parentMedicareMember.ParentMedicareMemberName;
            this.DependentDetails.MedicareStartDate = dependentMedicareMember.MedicareStartDate;
            this.DependentDetails.DepartmentId = dependentMedicareMember.DepartmentId;
            this.DependentDetails.MedicareTypeId = dependentMedicareMember.MedicareTypeId;
            this.SelectedInstitute = this.MedicareInstituteList.find(x => x.MedicareInstituteCode === dependentMedicareMember.MedicareInstituteCode);
            this.SelectedDesignation = this.DesignationList.find(x => x.DesignationId === dependentMedicareMember.DesignationId);
            this.SelectedDepartment = this.DepartmentsList.find(x => x.DepartmentId === dependentMedicareMember.DepartmentId);
            this.DependentDetails.MedicareDependentValidator.controls["Remarks"].setValue(dependentMedicareMember.Remarks);
            this.DependentDetails.MedicareDependentValidator.controls["Relation"].setValue(dependentMedicareMember.Relation);
          }
        }
        else if (res.Status === ENUM_DanpheHTTPResponseText.Failed) {
          this.msgBoxService.showMessage(ENUM_MessageBox_Status.Warning, ['This patient has already been registered as dependent.Please select another one.']);
          this.DisableBtn = true;
          this.isUpdate = false;
        }
        else {
          this.msgBoxService.showMessage(ENUM_MessageBox_Status.Error, ['Unable to get member details Check Console']);
          this.DisableBtn = true;
          this.isUpdate = false;
        }
      },
      (err: DanpheHTTPResponse) => {
        this.msgBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Something went wrong! ${err.ErrorMessage}`]);
      });
  }

  PatientListFormatter(data: any): string {
    let html: string = "";
    html = "<font size=03>" + "[" + data["PatientCode"] + "]" + "</font>&nbsp;-&nbsp;&nbsp;<font color='blue'; size=03 ><b>" + data["ShortName"] +
      "</b></font>&nbsp;&nbsp;" + "(" + data["Age"] + '/' + data["Gender"] + ")" + '' + "</b></font>";
    return html;
  }
  ParentMemberListFormatter(data: any): string {
    let html: string = "";
    html = "<font size=03>" + "[" + data["MedicareMemberNo"] + "]" + "</font>&nbsp;-&nbsp;&nbsp;<font color='blue'; size=03 ><b>" + data["ShortName"] +
      "</b></font>&nbsp;&nbsp;" + "(" + data["Age"] + '/' + data["Gender"] + ")" + '' + "</b></font>";
    return html;
  }


  AssignSelectedMedicareType() {
    this.DependentDetails.MedicareTypeId = this.SelectedMedicareType.MedicareTypeId;
    this.DependentDetails.LedgerId = this.MedicalCareTypeList.find(x => x.MedicareTypeId === this.SelectedMedicareType.MedicareTypeId).LedgerId;
    this.DependentDetails.MedicareTypeName = this.MedicalCareTypeList.find(x => x.MedicareTypeId === this.SelectedMedicareType.MedicareTypeId).MedicareTypeName;
  }
  MedicareTypeListFormatter(data: any): string {
    let html: string = ""
    html = data["MedicareTypeName"];
    return html;
  }
  AssignSelectedInstitute() {
    if (this.SelectedMedicareInstitute.MedicareInstituteCode) {
      this.DependentDetails.MedicareInstituteCode = this.SelectedMedicareInstitute.MedicareInstituteCode;
    }
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

