import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import * as _ from "lodash";
import { MedicarePatient_DTO } from '../../../insurance/medicare/shared/dto/mecicare-patient-dto';
import { MedicareDependentModel } from '../../../insurance/medicare/shared/dto/medicare-dependent.model';
import { MedicalCareType } from '../../../insurance/medicare/shared/medicare-member.model';
import { MedicareBLService } from '../../../insurance/medicare/shared/medicare.bl.service';
import { MedicareService } from '../../../insurance/medicare/shared/service/medicare.service';
import { SecurityService } from '../../../security/shared/security.service';
import { DanpheHTTPResponse } from '../../../shared/common-models';
import GridColumnSettings from '../../../shared/danphe-grid/grid-column-settings.constant';
import { MessageboxService } from '../../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponseText, ENUM_MessageBox_Status } from '../../../shared/shared-enums';
import { MembersData } from '../../shared/patient-medicare-member.model';
import { PatientsBLService } from '../../shared/patients.bl.service';

@Component({
  templateUrl: './medicare-registration-main-patient.component.html'
})
export class MedicareRegistrationMainPatientComponent implements OnInit {
  //validRoutes: any;
  DependentDetails: MedicareDependentModel = new MedicareDependentModel();
  MemberDetails: MembersData = new MembersData();
  ShowAddDependentPage: boolean = false;
  isEditForm: boolean = false;
  ShowAddMemberPage: boolean = false;
  MedicarePatientGridColumns: typeof GridColumnSettings.medicarePatientModuleList;
  MedicarePatients: Array<MedicarePatient_DTO> = new Array<MedicarePatient_DTO>();
  Index: number;
  TotalMedicare: number;
  ActiveMedicare: number;
  InActiveMedicare: number;
  ShowInactiveMembers: boolean = false;
  ShowEditDependentPage: boolean = false;
  ShowEditMemberPage: boolean = false;
  ShowMedicarePatientList: boolean = true;
  //filteredMedicarePatients: any[] = [];
  IsInitialLoad: boolean = true;
  public MedicarePatientsList: Array<MedicarePatient_DTO> = new Array<MedicarePatient_DTO>();
  public CopiedMedicarePatientsList: Array<MedicarePatient_DTO> = new Array<MedicarePatient_DTO>();
  CategoryList: Array<MedicalCareType> = new Array<MedicalCareType>();
  SelectedCategoryList = [];

  SelectedCategories: string = '';

  constructor(public medicareBlService: MedicareBLService, public securityService: SecurityService,
    private patientBLService: PatientsBLService,
    public changeDetector: ChangeDetectorRef, private messageboxService: MessageboxService, public medicareService: MedicareService,) {
    this.MedicarePatientGridColumns = GridColumnSettings.medicarePatientModuleList;
    this.GetMedicarePatients();
  }

  ngOnInit() {
    if (this.IsInitialLoad) {
      this.AssignDesignationList();
      this.AssingnInsuranceProvider();
      this.AsssignMedicareInstitute()
      this.AssingDepartments();
      this.AssignMedicareType();
      this.IsInitialLoad = false;
    }
  }

  public AssignMedicareType() {
    this.patientBLService.GetAllMedicareTypes().subscribe(
      (res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
          this.medicareService.medicalCareTypeList = res.Results;
          let Categories = res.Results;


          Categories.forEach((p) => {
            let val = _.cloneDeep(p);
            this.SelectedCategoryList.push(val);
          });
          this.CategoryList = Categories;
        }
      }
    );
  }

  public AssignDesignationList() {
    this.patientBLService.GetAllDesignations().subscribe(
      (res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
          this.medicareService.designationList = res.Results;
        }
      }
    );
  }
  gridExportOptions = {
    fileName: 'MedicareRegistrationReport' + '.xls',
  };

  public AssingDepartments() {
    this.patientBLService.GetAllDepartment().subscribe(
      (res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
          this.medicareService.departmentList = res.Results;
        }
      }
    );
  }

  public AsssignMedicareInstitute() {
    this.patientBLService.GetAllMedicareInstitutes().subscribe(
      (res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
          this.medicareService.medicareInstituteList = res.Results;
        }
      }
    );
  }

  public AssingnInsuranceProvider(): void {
    this.patientBLService.GetAllInsuranceProviderList().subscribe(
      (res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
          this.medicareService.insuranceProvidersList = res.Results;
        }
      }
    );
  }

  public GetMedicarePatients(): void {
    this.patientBLService.GetMedicarePatientList().subscribe(
      (res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
          this.MedicarePatients = res.Results;
          this.MedicarePatients.forEach(a => {
            a.Age = this.getAgeFromDateOfBirth(a.DateOfBirth);
          });
          this.MedicarePatientsList = this.MedicarePatients;
          this.CopiedMedicarePatientsList = this.MedicarePatientsList;

        }
        else {
          this.messageboxService.showMessage(ENUM_MessageBox_Status.Failed, ['Failed To Load Data' + res.ErrorMessage]);
        }
      },
      err => {
        this.messageboxService.showMessage(ENUM_MessageBox_Status.Error, [err]);
      });
  }

  getAgeFromDateOfBirth(dateofbirth: any) {

    let today = new Date();

    let birthDate = new Date(dateofbirth);

    let age = today.getFullYear() - birthDate.getFullYear();

    let m = today.getMonth() - birthDate.getMonth();

    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {

      age--;

    }

    return age;

  }
  AddMedicareDependent() {
    this.Index = null;
    this.changeDetector.detectChanges();
    this.ShowAddDependentPage = true;
    this.isEditForm = false;
  }
  AddMedicareMember() {
    this.isEditForm = false;
    this.Index = null;
    this.changeDetector.detectChanges();
    this.ShowAddMemberPage = true;
  }

  CallBackAdd($event) {
    this.ShowAddDependentPage = false;
    this.GetMedicarePatients();
  }
  CallBackAddMember($event) {
    this.ShowAddMemberPage = false;
    this.GetMedicarePatients();
  }
  MedicarePatientsGridAction($event) {
    {
      let rowAction = $event.Action;
      let rowData = $event.Data;
      if (rowAction === 'medicarePatient' && rowData.IsDependent) {
        this.DependentDetails = rowData;
        this.ShowAddDependentPage = true;
        this.isEditForm = true;

      }
      else if (rowAction === 'medicarePatient' && !rowData.IsDependent) {
        this.MemberDetails = rowData;
        this.ShowAddMemberPage = true;
        this.isEditForm = true;
      }
      else {
      }
    }
  }

  openAddMemberModal(_rowData) {
    this.Index = null;
    this.changeDetector.detectChanges();
    this.ShowAddMemberPage = true;
  }

  openAddDependentModal(_rowData) {
    this.Index = null;
    this.changeDetector.detectChanges();
    this.ShowAddDependentPage = true;
  }
  ToggleMedicareMemberList(isActive) {
    if (isActive === 'true') {
      this.MedicarePatientsList = this.MedicarePatients.filter(med => med.IsActive === true);
    }
    else if (isActive === 'false') {
      this.MedicarePatientsList = this.MedicarePatients.filter(med => med.IsActive === false);
    }
    else {
      this.MedicarePatientsList = this.MedicarePatients;
    }
  }
  AssignCategories(event) {
    const mediCareType = event.map(x => x.MedicareTypeName);
    this.SelectedCategories = mediCareType;
    this.MedicarePatientsList = this.CopiedMedicarePatientsList;
    const filteredPatientsList = this.MedicarePatientsList.filter(item => this.SelectedCategories.includes(item.Category));
    this.MedicarePatientsList = filteredPatientsList;
  }
}



