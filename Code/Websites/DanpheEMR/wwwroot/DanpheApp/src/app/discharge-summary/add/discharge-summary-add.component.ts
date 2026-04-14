
import { animate, style, transition, trigger } from "@angular/animations";
import { ChangeDetectorRef, Component, EventEmitter, Input, Output } from "@angular/core";
import { FormBuilder, FormControl, FormGroup, Validators } from "@angular/forms";
import { Router } from '@angular/router';
import * as moment from 'moment/moment';
import { forkJoin } from "rxjs";
import { Observable } from "rxjs/Rx";
import { of } from "rxjs/internal/observable/of";
import { catchError } from "rxjs/operators";
import { AdmissionModel } from "../../adt/shared/admission.model";
import { DischargeSummaryConsultant } from "../../adt/shared/discharge-summary-consultant.model";
import { DischargeSummaryMedication } from "../../adt/shared/discharge-summary-medication.model";
import { DischargeSummary } from "../../adt/shared/discharge-summary.model";
import { DischargeType } from "../../adt/shared/discharge-type.model";
import { VisitService } from "../../appointments/shared/visit.service";
import { CoreService } from "../../core/shared/core.service";
import { Employee } from '../../employee/shared/employee.model';
import { LabTest } from '../../labs/shared/lab-test.model';
import { SecurityService } from '../../security/shared/security.service';
import { SettingsBLService } from "../../settings-new/shared/settings.bl.service";
import { DanpheHTTPResponse } from "../../shared/common-models";
import { CommonFunctions } from "../../shared/common.functions";
import { MessageboxService } from '../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponses, ENUM_Data_Type, ENUM_DischargeType, ENUM_Genders, ENUM_MessageBox_Status, ENUM_RecoveredDischargeConditions } from "../../shared/shared-enums";
import { DischargeSummaryBLService } from '../shared/discharge-summary.bl.service';
import { DischargeSummaryFieldSettingsVM } from "../view-model/discharge-summary-field-setting-VM.model";
import { TemplateFieldDTO } from "../view-model/template-field-dto";

@Component({
  selector: 'discharge-summary-add',
  animations: [
    trigger(
      'enterAnimation', [
      transition(':enter', [
        style({ transform: 'translateY(30%)', opacity: 0 }),
        animate('1000ms', style({ transform: 'translateY(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        style({ transform: 'translateY(0)', opacity: 1 }),
        animate('500ms', style({ transform: 'translateY(10%)', opacity: 0 }))
      ])
    ]
    )
  ],
  templateUrl: './discharge-summary-add.html',
})
export class DischargeSummaryAddComponent {
  // public CurrentDischargeSummary_VM: DischargeSummary = new DischargeSummary();
  public CurrentDischargeSummary_VM: TempDischargeTemplate = new TempDischargeTemplate();

  public dischSumFieldSettings: DischargeSummaryFieldSettingsVM = new DischargeSummaryFieldSettingsVM();

  @Input("selectedDischarge")
  public selectedDischarge: any;

  public admission: AdmissionModel = new AdmissionModel();
  public dischargeTypeList: Array<DischargeType> = new Array<DischargeType>();
  public providerList: Array<Employee> = new Array<Employee>();
  public AnasthetistsList: Array<Employee> = new Array<Employee>();
  public LabTestList: Array<LabTest> = new Array<LabTest>();
  public labResults: any;
  public labRequests: Array<any> = new Array<any>();
  public AddedTests: Array<any> = new Array<any>();
  public AddedConsultants: Array<any> = new Array<any>();
  public AddedImgTests: Array<any> = new Array<any>();
  public imagingResults: Array<any> = new Array<any>();
  public IsSelectTest: boolean = false;
  public update: boolean = false;
  public showSummaryView: boolean = false;
  public showDischargeSummary: boolean = false;
  public disablePrint: boolean = false;
  public showUnpaidPopupBox: boolean = false;//to display the Alert-Box when trying to discharge with pending bills.
  @Input("fromClinical")
  public fromClinical: boolean = false;

  public selectedConsultants: Array<DischargeSummaryConsultant> = new Array<DischargeSummaryConsultant>();
  public selectedConsultantsDetail: DischargeSummaryConsultant = new DischargeSummaryConsultant();
  public selectedConsultantsDetails: Array<any> = new Array<any>();
  public consultant: any = null;
  public drIncharge: any = null;
  public labtest: any = null;
  public diagnosis: any = null;
  public provisionalDiagnosis: any = null;
  public anasthetists: any = null;
  public residenceDr: any = null;
  public icdsID: Array<number> = new Array<number>();
  public labTests: Array<any> = new Array<any>();
  public icd10List: Array<any> = null;
  public medicationtype: number = null;
  // public IsOldMedication:boolean = false;
  public Medication: DischargeSummaryMedication = new DischargeSummaryMedication();


  public medicationFrequency: Array<any> = new Array<any>();
  public dischargeCondition: Array<any> = new Array<any>();
  public FilteredDischargeConditions: Array<any> = new Array<any>();
  public deliveryTypeList: Array<any> = new Array<any>();
  public babybirthCondition: Array<any> = new Array<any>();
  public DischargeConditionType: boolean = false;
  public DeliveryType: boolean = false;
  public deathTypeList: Array<any> = new Array<any>();
  public Isdeath: boolean = false;
  public NoOfBabies: number = 1;
  public emptyMed: boolean = true;
  //public CurrentBabyBirthDeails: BabyBirthDetails = new BabyBirthDetails();
  public showBabyDetails: boolean = false;
  today: string;
  //public tempBabyBirthDetails: Array<BabyBirthDetails> = new Array<BabyBirthDetails>();
  public deathType: any = null;
  //public selectedBaby: BabyBirthDetails = new BabyBirthDetails();
  //public showBirthCertificate: boolean = false;
  public selectUnselectAllLabTests: boolean = false;
  public CurrentFiscalYear: string = null;
  public NewMedications: Array<DischargeSummaryMedication> = new Array<DischargeSummaryMedication>();
  public OldMedications: Array<DischargeSummaryMedication> = new Array<DischargeSummaryMedication>();
  public StoppedOldMedications: Array<DischargeSummaryMedication> = new Array<DischargeSummaryMedication>();
  public DeathCertificateNumber: string = null;
  public dischargeSummaryClassObj = { col9: "col-md-9 col-xs-12", col12: "col-md-12" }
  //public sendableData: any;
  @Output("sendData") sendData: EventEmitter<any> = new EventEmitter<any>();
  @Output("CallBackFromAdd") callback: EventEmitter<any> = new EventEmitter<any>();
  public selectedDiagnosisList: Array<any> = new Array<any>();
  public selectedProviDiagnosisList: Array<any> = new Array<any>();
  public IsReportWithResult: boolean = false;
  public showChooseTestResultPopup: boolean = false;
  public complusoryDoctorIncharge: boolean = true;
  imagingItems: any[];
  IsFishTailtemplate: boolean = false;
  InvalidConsultant: boolean = false;
  public loadingScreen: boolean = false;
  public CheckedBy: any;
  public UserList: any;
  icdVersionDisplay: any;
  public drInchargeId: number;
  public dischargeSummaryTemplates: Array<any> = [];
  public dynamicTemplateContent: Array<any> = [];
  public TemplateTypeName: string = 'Discharge Summary';
  public selectedTemplateFields: Array<TemplateFieldDTO> = [];
  // public showTestsWithoutResult: boolean = true;
  // stringifiedDiagnosisList: string;
  selectedTemplateObj: any;
  TemplateId: number = null;
  public selectedDischargeTypeName: string;
  ShowBabyWeight: boolean = false;
  StayDays: number = 0;
  currentModuleName: any;
  public loadHtmlfordischaregeSummary: string = "";
  public TemplatesFromServer = new Array<TemplateField_DTO>();
  public BabyWeight: string;
  public DischargeType: string = null;
  public DischargeCondition: string = null;
  public FindingValue: string = '';
  public FieldsToExclude = {
    Investigations: false,
    LabTests: false,
    Imagings: false,
    Medications: false,
  };
  @Input('IsERPatient')
  IsERPatient: boolean = false;

  constructor(public dischargeSummaryBLService: DischargeSummaryBLService,
    public securityService: SecurityService,
    public msgBoxServ: MessageboxService,
    public changeDetector: ChangeDetectorRef,
    public coreService: CoreService,
    public router: Router, public visitService: VisitService,
    public settingsBLService: SettingsBLService,
    private formBuilder: FormBuilder
  ) {
    this.GetProviderList();
    this.GetDischargeType();
    this.GetAnasthetistsEmpList();
    this.GetFiscalYear();
    this.AssignDischargeSummaryFormat();
    this.CheckDoctorInchargeSettings();
    this.GetUsers();
    this.icdVersionDisplay = this.coreService.Parameters.find(p => p.ParameterGroupName == "Common" && p.ParameterName == "IcdVersionDisplayName").ParameterValue;
    // if (!this.showDischargeSummary) {
    //   this.GetDischargeSummaryTemplates(this.TemplateTypeName);
    // }
    this.currentModuleName = this.securityService.currentModule;
    console.log('Current Moduel', this.currentModuleName);

  }

  ngOnInit() {
    let globalVisitInfo = this.visitService.getGlobal();
    if (!this.selectedDischarge.VisitCode) {
      this.selectedDischarge.VisitCode = globalVisitInfo.VisitCode;
    }
    if (this.selectedDischarge.DateOfBirth) {
      this.selectedDischarge.Age = this.coreService.CalculateAge(this.selectedDischarge.DateOfBirth);
    }
  }

  @Input("showDischargeSummary")
  public set value(val: boolean) {
    this.showDischargeSummary = val;
    if (this.selectedDischarge && this.showDischargeSummary) {
      this.LoadAllFunctions();
    }
  }
  public AssignDischargeSummaryFormat() {
    let param = this.coreService.Parameters.find(f => f.ParameterName == "DischargeSummaryPrintFormat");
    if (param && param.ParameterValue == 'Fishtail_Hospital_Format')
      this.IsFishTailtemplate = true;
    else
      this.IsFishTailtemplate = false;
  }

  LoadAllFunctions() {
    this.loadingScreen = true;
    var reqs: Observable<any>[] = [];
    reqs.push(this.dischargeSummaryBLService.GetDischargeSummary(this.selectedDischarge.PatientVisitId).pipe(
      catchError((err) => {
        // Handle specific error for this call
        return of(err.error);
      }
      )
    ));
    reqs.push(this.dischargeSummaryBLService.GetLabRequestsByPatientVisit(this.selectedDischarge.PatientId, this.selectedDischarge.PatientVisitId).pipe(
      catchError((err) => {
        // Handle specific error for this call
        return of(err.error);
      }
      )
    ));
    reqs.push(this.dischargeSummaryBLService.GetImagingReportsReportsByVisitId(this.selectedDischarge.PatientVisitId).pipe(
      catchError((err) => {
        // Handle specific error for this call
        return of(err.error);
      }
      )
    ));
    this.GetDischargeSummaryTemplates(this.TemplateTypeName);

    forkJoin(reqs).subscribe(result => {
      this.GetDischargeSummary(result[0]);
      this.GetLabRequests(result[1]);
      this.GetImagingResults(result[2]);
      this.AssignSelectedLabTests();
      this.AssignSelectedImagings();
      this.CalculateHospitalStayDays();

    });

    this.GetICDList();
    this.GetAllTests();
    this.medicationtype = 0;
    // this.AddMedicine(0);
    // this.AddMedicine(1);
    // this.AddMedicine(2);
    // this.GetMedicationFrequency();
    this.AddedTests = [];
    this.CheckDeathType();
    this.GetDischargeConditions();
    this.GetDeliveryTypes();
    //this.GetBabyBirthCondition();
    this.GetDeathType();
    this.today = moment().format('YYYY-MM-DD');
  }

  focusOut() {
    this.DataValidation();
    if (this.CurrentDischargeSummary_VM.IsValidCheck(undefined, undefined)) {
      this.GenerateDischargeSummaryData();
      this.sendData.emit(this.CurrentDischargeSummary_VM);
    }
  }

  CheckDeathType() {
    this.deathType = this.coreService.CheckDeathType();
  }


  public GetDischargeType() {
    this.dischargeSummaryBLService.GetDischargeType()
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this.dischargeTypeList = res.Results;
        } else {
          this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, [res.ErrorMessage]);
        }
      },
        err => {
          this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, ['Failed to get discharge type.. please check log for details.']);
          this.logError(err.ErrorMessage);
        });
  }
  public GetProviderList() {
    this.dischargeSummaryBLService.GetProviderList()
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this.providerList = res.Results;
        } else {
          this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, [res.ErrorMessage]);
        }
      },
        err => {
          this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, ['Failed to get Doctors list.. please check log for details.']);
          this.logError(err.ErrorMessage);
        });
  }
  public GetDeathType() {
    this.dischargeSummaryBLService.GetDeathType()
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this.deathTypeList = res.Results;
        } else {
          this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, [res.ErrorMessage]);
          console.error(res.ErrorMessage);
        }
      })
  }
  public GetAnasthetistsEmpList() {
    this.dischargeSummaryBLService.GetAnasthetistsEmpList()
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this.AnasthetistsList = res.Results;
        }
        else {
          this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, ["Failed to get Anasthetist-Doctor list.. please check the log for details."]);
          this.logError(res.ErrorMessage);
        }
      },
        err => {
          this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, ['Failed to get Anasthetist-Doctors list.. please check log for details.']);
          this.logError(err.ErrorMessage);
        });
  }

  public GetICDList() {
    this.dischargeSummaryBLService.GetICDList()
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this.icd10List = res.Results;
          // this.icd10List.forEach(a=>{
          //     this.icdsID.push(a.ICD10Id);
          // });
        }
        else {
          this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, [res.ErrorMessage]);
        }
      },
        err => {
          this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, ['Failed to get ICD11.. please check log for detail.']);
          this.logError(err.ErrorMessage);
        });
  }
  public GetLabResults() {
    this.dischargeSummaryBLService.GetLabReportByVisitId(this.selectedDischarge.PatientVisitId)
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this.labResults = res.Results;
        } else {
          this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, [res.ErrorMessage]);
        }
      },
        err => {
          this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, ['Failed to get lab results.. please check log for detail.']);
          this.logError(err.ErrorMessage);
        });
  }
  public GetAllTests() {
    this.dischargeSummaryBLService.GetAllTests()
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this.LabTestList = res.Results;
        } else {
          this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, [res.ErrorMessage]);
        }
      },
        err => {
          this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, ['Failed to get lab results.. please check log for detail.']);
          this.logError(err.ErrorMessage);
        });

  }

  public GetDischargeConditions() {
    this.dischargeSummaryBLService.GetDischargeConditions()
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this.dischargeCondition = res.Results;
        } else {
          this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, [res.ErrorMessage]);
        }
      },
        err => {
          this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, ['Failed to get Discharge Conditions.. please check log for detail.']);
          this.logError(err.ErrorMessage);
        });
  }
  private GetDeliveryTypes() {
    this.dischargeSummaryBLService.GetDeliveryType()
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this.deliveryTypeList = res.Results;
        } else {
          this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, [res.ErrorMessage]);
          console.error(res.ErrorMessage);
        }
      })
  }

  //Gets only the requests, Use Results once We implement the Labs-Module for data entry. -- sud: 9Aug'17
  public GetLabRequests(res) {
    // this.dischargeSummaryBLService.GetLabRequestsByPatientVisit(this.selectedDischarge.PatientId, this.selectedDischarge.PatientVisitId)
    //   .subscribe(res => {
    //     if (res.Status == 'OK') {
    //       this.labRequests = res.Results;

    //       // Below code helps to find which test is selected to show result in Reports.
    //       // if any labRequests is found in labTests then that test is selected to show its results and its component's results.
    //       if (this.labRequests.length > 0) {
    //         this.labRequests.forEach(a => {
    //           var check = this.labTests.includes(a.TestId);
    //           if (check) {

    //             if (a.labComponents.length == 1) {
    //               a.IsSelectTest = true;
    //             }
    //             else if (a.labComponents.length > 1) {
    //               let selectedComponentCount: number = 0;
    //               a.labComponents.forEach(c => {

    //                 this.labTests.forEach(lt => {
    //                   var cCheck = lt.labComponents.includes(c.ComponentName);
    //                   if (cCheck) {
    //                     c.IsCmptSelected = true;
    //                     selectedComponentCount = +selectedComponentCount;
    //                   }
    //                 });

    //               });
    //               if (selectedComponentCount == a.labComponents.length) {
    //                 a.IsSelectTest = true;
    //               }
    //             }
    //           }
    //         });
    //       }
    //       // this.AssignLabTests();
    //     }
    //     else {
    //       this.msgBoxServ.showMessage("error", [res.ErrorMessage]);
    //     }
    //   },
    //     err => {
    //       this.msgBoxServ.showMessage("error", ['Failed to get lab results.. please check log for detail.']);
    //       this.logError(err.ErrorMessage);
    //     });



    if (res.Status === ENUM_DanpheHTTPResponses.OK) {
      this.labRequests = res.Results;

      // this.AssignLabTests();
    }
    else {
      this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, [res.ErrorMessage]);
    }
  }

  AssignSelectedLabTests() {
    // Below code helps to find which test is selected to show result in Reports.
    // if any labRequests is found in labTests then that test is selected to show its results and its component's results.


    this.AddedTests = [];

    if (this.labRequests.length > 0) {
      this.labRequests.forEach(a => {

        let tempLabTests: any = this.labTests.filter(lbtst => lbtst.TestId == a.TestId);
        let selectedLabTest: any = tempLabTests[0];

        if (selectedLabTest) {

          var aCheck = this.AddedTests.some(lt => lt.TestId == selectedLabTest.TestId);

          if (!aCheck) {

            // a.IsSelectTest = true;
            if (a.labComponents && a.labComponents.length == 1) {
              a.IsSelectTest = true;
              this.AddedTests.push({ TestId: a.TestId, TestName: a.TestName, labComponents: [] });
            }
            else if (a.labComponents && a.labComponents.length > 1) {

              var cmptArray: Array<any> = new Array<any>();

              a.labComponents.forEach(c => {

                if (selectedLabTest.labComponents && selectedLabTest.labComponents.length) {
                  var cCheck = selectedLabTest.labComponents.some(ltc => ltc.ComponentName == c.ComponentName);
                  if (cCheck) {
                    cmptArray.push({ ComponentName: c.ComponentName });
                    c.IsCmptSelected = true;
                  }
                }
              });

              this.AddedTests.push({ TestId: a.TestId, TestName: a.TestName, labComponents: cmptArray });

            }
            let selectedComponentCount: number = 0;
            this.AddedTests.forEach(at => {
              if (at.TestId == a.TestId) {
                selectedComponentCount = at.labComponents.length;
              }
            });
            if (selectedComponentCount == a.labComponents.length) {
              a.IsSelectTest = true;
            }
            // else {
            //   a.IsSelectTest = false;
            // }


            this.IsReportWithResult = true;
          }

        }
      });
    }
    var temp: any = this.labRequests;
    // for newly added tests which doesnot has any results
    this.labTests.forEach(a => {
      let check = this.labRequests.some(f => a.TestId == f.TestId);
      if (!check) {
        this.AddedTests.push(a);
      }
    });
  }

  GetMedicationFrequency() {
    this.dischargeSummaryBLService.GetMedicationFrequency()
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this.medicationFrequency = res.Results;
        }
        else {
          this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, [res.ErrorMessage]);
        }
      },
        err => {
          this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, ['Failed to get medication frequencies. please check log for detail.']);
          this.logError(err.ErrorMessage);
        });
  }
  public GetImagingResults(res) {
    // this.dischargeSummaryBLService.GetImagingReportsReportsByVisitId(this.selectedDischarge.PatientVisitId)
    //   .subscribe(res => {

    //   },
    //     err => {
    //       this.msgBoxServ.showMessage("error", ['Failed to get imaging results.. please check log for details.'], err.ErrorMessage);
    //     });

    if (res.Status === ENUM_DanpheHTTPResponses.OK) {
      if (res.Results.length)
        this.imagingResults = res.Results;
    } else {
      this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, ["Failed to get Imaigng Results. Check log for detail"]);
      this.logError(res.ErrorMessage);
    }
  }
  //for doctor's list
  myListFormatter(data: any): string {
    let html = data["FullName"];
    return html;
  }
  //for anaesthetist doctor's list
  ListFormatter(data: any): string {
    let html = data["FullName"];
    return html;
  }

  labTestFormatter(data: any): string {
    let html = data["LabTestName"];
    return html;
  }

  dischargeTypeListFormatter(data: any): string {
    let html = data["DischargeTypeName"];
    return html;
  }
  DiagnosisFormatter(data: any): string {
    let html = data["ICD10Code"] + '|' + data["icd10Description"];
    return html;
  }
  //below methods loadConsultant(),loadDrIncharge(),loadAnasthetists(),loadResidenceDr() will set the EmployeeId for respective drs
  loadConsultant() {

    //  this.selectedConsultants = this.consultant ? this.consultant.EmployeeId : null;


  }

  loadDrIncharge() {
    if (this.drIncharge && typeof (this.drIncharge) == "string") {
      this.CurrentDischargeSummary_VM.DoctorInchargeId = this.drInchargeId;
    } else {
      this.CurrentDischargeSummary_VM.DoctorInchargeId = this.drIncharge ? this.drIncharge.EmployeeId : this.drInchargeId;
    }
  }


  //* Below method validates the doctorIncharge, if it is set or not. Krishna, 15thDec'22
  validateDrIncharge(): void {
    if (!(this.drIncharge && this.drIncharge.EmployeeId)) {
      this.CurrentDischargeSummary_VM.DoctorInchargeId = null;
      this.CurrentDischargeSummary_VM.DischargeSummaryValidator.get('DoctorInchargeId').setValue(null);
      this.CurrentDischargeSummary_VM.UpdateValidator("on", "DoctorInchargeId", "required");
    }
  }
  anaesthesistId: number = null;
  loadAnasthetists() {
    if (this.anasthetists && typeof (this.anasthetists) == "string") {
      this.CurrentDischargeSummary_VM.AnaesthetistsId = this.anaesthesistId;
    } else {
      this.CurrentDischargeSummary_VM.AnaesthetistsId = this.anasthetists ? this.anasthetists.EmployeeId : null;
    }
  }

  residenceDrId: number = null;
  loadResidenceDr() {
    if (this.residenceDr && typeof (this.residenceDr) == "string") {
      this.CurrentDischargeSummary_VM.ResidenceDrId = this.residenceDrId;
    } else {
      this.CurrentDischargeSummary_VM.ResidenceDrId = this.residenceDr ? this.residenceDr.EmployeeId : null;
    }
  }

  loadICDs() {
    this.CurrentDischargeSummary_VM.Diagnosis = this.diagnosis ? this.diagnosis.icd10Description : null;
    this.CurrentDischargeSummary_VM.ProvisionalDiagnosis = this.provisionalDiagnosis ? this.provisionalDiagnosis.icd10Description : null;
  }
  LoadTemplateId() {
    this.CurrentDischargeSummary_VM.DischargeSummaryTemplateId = this.TemplateId;
  }

  loadlabTest() {
    var temp = this.labtest ? this.labtest.LabTestId : null;
    if (temp > 0) {
      var check = this.AddedTests.filter(a => a.TestId == temp);
      if (!check.length) {
        this.AddedTests.push({ TestId: temp, TestName: this.labtest.LabTestName, labComponents: [] });
      } else {
        alert(`${this.labtest.TestName} Already Added !`);
        this.labtest = undefined;
      }
      this.labtest = '';
    }
  }
  SetDischargeSummaryData(res) {
    //! map the data from model to form controller
    const formControls = this.CurrentDischargeSummary_VM.TempDischargeSummaryValidator.controls;
    //let formControls: any;
    Object.keys(res.Results.DischargeSummary).forEach(key => {
      if (key in formControls) {
        // if (key === 'HistoryOfPresentingIllness') {
        //   formControls[key].setValue(res.Results.DischargeSummary[key].value);
        // } else {
        formControls[key].setValue(this.CurrentDischargeSummary_VM[key]);
        // }
      }
    });
    if (this.CurrentDischargeSummary_VM.DischargeTypeId) {
      const selectedDischargeType = this.dischargeTypeList.filter(a => a.DischargeTypeId == this.CurrentDischargeSummary_VM.DischargeTypeId)
      if (selectedDischargeType) {
        this.DischargeType = selectedDischargeType[0].DischargeTypeName;
      }
    }

    if (this.CurrentDischargeSummary_VM.DischargeTypeId) {
      this.FilteredDischargeConditions = this.dischargeCondition.filter(a => a.DischargeTypeId == this.CurrentDischargeSummary_VM.DischargeTypeId);
      if (this.FilteredDischargeConditions.length > 0) {
        this.DischargeConditionType = true;
        const dischargeCondition = this.FilteredDischargeConditions.find(a => a.DischargeConditionId == this.CurrentDischargeSummary_VM.DischargeConditionId);
        this.DischargeCondition = dischargeCondition && dischargeCondition.Condition;
        if (this.DischargeCondition === ENUM_DischargeType.Delivery) {
          this.ShowBabyWeight = true;
          if (this.dischSumFieldSettings.BabyWeight) {
            this.dischSumFieldSettings.BabyWeight.Show = true;
            this.BabyWeight = this.CurrentDischargeSummary_VM.BabyWeight;
          }
        }
      }
    }
    if (this.CurrentDischargeSummary_VM.DeliveryTypeId) {
      this.DeliveryType = true;
    }
    else if (this.CurrentDischargeSummary_VM.DeathTypeId) {
      this.Isdeath = true;
    }
    if (this.CurrentDischargeSummary_VM && this.CurrentDischargeSummary_VM.Diagnosis) {
      this.selectedDiagnosisList = JSON.parse(this.CurrentDischargeSummary_VM.Diagnosis);
    }
    if (this.CurrentDischargeSummary_VM && this.CurrentDischargeSummary_VM.ProvisionalDiagnosis) {
      this.selectedProviDiagnosisList = JSON.parse(this.CurrentDischargeSummary_VM.ProvisionalDiagnosis);
      this.provisionalDiagnosis = undefined;
    }
    if (res.Results.Consultants && res.Results.Consultants.length) {
      this.selectedConsultants = res.Results.Consultants;
      this.selectedConsultants.forEach(a =>
        a.FullName = a.consultantName
      );
      this.consultant = ''

    }
    //if (res.Results.BabyBirthDetails.length) {
    //  this.CurrentDischargeSummary_VM.BabyBirthDetails = new Array<BabyBirthDetails>();
    //  res.Results.BabyBirthDetails.forEach(a => {
    //    this.CurrentBabyBirthDeails = Object.assign(this.CurrentBabyBirthDeails, a);
    //    this.CurrentDischargeSummary_VM.BabyBirthDetails.push(this.CurrentBabyBirthDeails);
    //  });
    //  this.CurrentDischargeSummary_VM.BabysFathersName = this.CurrentDischargeSummary_VM.BabyBirthDetails[0].FathersName;
    //  this.CurrentDischargeSummary_VM.BabyBirthDetails.forEach(a => {
    //    a.BirthDate = moment(a.BirthDate).format('YYYY-MM-DD');
    //    this.tempBabyBirthDetails.push(a);
    //  });
    //  this.NoOfBabies = res.Results.BabyBirthDetails.length;
    //  this.showBabyDetails = true;
    //}
    if (res.Results.DischargeSummary.CheckedBy) {
      const checkedByUser = this.UserList.find(a => a.EmployeeId === res.Results.DischargeSummary.CheckedBy);
      this.CheckedBy = checkedByUser.EmployeeName;
      this.CurrentDischargeSummary_VM.CheckedById = checkedByUser.EmployeeId;
    }
    if (res.Results.Medications && res.Results.Medications.length) {
      this.CurrentDischargeSummary_VM.DischargeSummaryMedications = new Array<DischargeSummaryMedication>();
      this.NewMedications = new Array<DischargeSummaryMedication>();
      res.Results.Medications.forEach(a => {
        this.Medication = new DischargeSummaryMedication();
        if (a.OldNewMedicineType == 0) {
          this.Medication = Object.assign(this.Medication, a);
          this.NewMedications.push(this.Medication);
        }
        // else if (a.OldNewMedicineType == 1) {
        //   this.Medication = Object.assign(this.Medication, a);
        //   this.OldMedications.push(this.Medication);
        // }
        // else {
        //   this.Medication = Object.assign(this.Medication, a);
        //   this.StoppedOldMedications.push(this.Medication);
        // }
      });
      if (!this.NewMedications.length)
        this.AddMedicine(0);
      // if (!this.OldMedications.length)
      //   this.AddMedicine(1);
      // if (!this.StoppedOldMedications.length)
      //   this.AddMedicine(2);
    }
    else {
      this.AddMedicine(0);
      // this.AddMedicine(1);
      // this.AddMedicine(2);
    }
    if (this.CurrentDischargeSummary_VM.LabTests && this.CurrentDischargeSummary_VM.LabTests != null) {

      // this.labTestId = new Array<number>();

      // this.labTestId = this.CurrentDischargeSummary_VM.LabTests.split(",").map(Number);
      this.labTests = new Array<any>();
      this.AddedTests = this.labTests = JSON.parse(this.CurrentDischargeSummary_VM.LabTests);
    }

    if (this.CurrentDischargeSummary_VM.SelectedImagingItems && this.CurrentDischargeSummary_VM.SelectedImagingItems != null) {
      this.imagingItems = new Array<any>();
      this.imagingItems = JSON.parse(this.CurrentDischargeSummary_VM.SelectedImagingItems);
      this.AddedImgTests = this.imagingItems;
    }

    if (this.CurrentDischargeSummary_VM.DischargeSummaryConsultants && this.CurrentDischargeSummary_VM.DischargeSummaryConsultants.length > 0) {
      this.CurrentDischargeSummary_VM.DischargeSummaryConsultants.forEach(a => {
        this.selectedConsultants.push(a);
      });
      // this.GenerateConsultantsData();
    }
    // this.consultant = res.Results.ConsultantName;
    if (this.providerList && this.providerList.length) {
      const doctorIncharge = this.providerList.find(p => p.EmployeeId === res.Results.DoctorInchargeId);
      if (doctorIncharge) {
        this.drIncharge = doctorIncharge.FullName;
        this.drInchargeId = doctorIncharge.EmployeeId;
        // this.CurrentDischargeSummary_VM.DischargeSummaryValidator.get('DoctorInchargeId').setValue(doctorIncharge.EmployeeId);
      }

      const residenceDoctor = this.providerList.find(p => p.EmployeeId === res.Results.ResidenceDrId);
      if (residenceDoctor) {
        this.residenceDrId = residenceDoctor.EmployeeId;
        this.residenceDr = residenceDoctor.FullName;
        // this.CurrentDischargeSummary_VM.DischargeSummaryValidator.get('ResidenceDrId').setValue(residenceDoctor.EmployeeId);
      }
    }
    // this.drIncharge = res.Results.DoctorInchargeName;
    this.drInchargeId = this.CurrentDischargeSummary_VM.DoctorInchargeId;

    if (this.AnasthetistsList && this.AnasthetistsList.length) {
      const anaesthetists = this.AnasthetistsList.find(a => a.EmployeeId === res.Results.AnaesthetistsId);
      if (anaesthetists) {
        this.anaesthesistId = anaesthetists.EmployeeId;
        this.anasthetists = anaesthetists.FullName;
        // this.CurrentDischargeSummary_VM.DischargeSummaryValidator.get('AnaesthetistsId').setValue(anaesthetists.EmployeeId);
      }
    }
  }
  //discharge summary
  async GetDischargeSummary(res) {
    if (res.Status === ENUM_DanpheHTTPResponses.OK) {
      this.loadingScreen = true;
      if (res.Results) {
        // this.CurrentDischargeSummary_VM = new TempDischargeTemplate();
        if (res.Results.DischargeSummary) {
          this.CurrentDischargeSummary_VM = Object.assign(this.CurrentDischargeSummary_VM, res.Results.DischargeSummary);
        }
        else {
          this.CurrentDischargeSummary_VM = Object.assign(this.CurrentDischargeSummary_VM, res.Results);
        }
        // if (this.CurrentDischargeSummary_VM.DischargeSummaryTemplateId) {
        //   this.selectedTemplateObj = this.dischargeSummaryTemplates.find(a => a.TemplateId === this.CurrentDischargeSummary_VM.DischargeSummaryTemplateId)
        //   if (this.selectedTemplateObj && this.selectedTemplateObj.TemplateId) {
        //     await this.LoadTemplateFields(this.selectedTemplateObj.TemplateId);
        //   }
        // }

        await this.LoadTemplateFieldsIfNeeded(this.CurrentDischargeSummary_VM.DischargeSummaryTemplateId);
        let formGroupConfig = {};
        if (this.TemplatesFromServer && this.TemplatesFromServer.length) {
          this.TemplatesFromServer.forEach(field => {
            formGroupConfig[field.FieldName] = [''];
          });
          this.CurrentDischargeSummary_VM.TempDischargeSummaryValidator = this.formBuilder.group(formGroupConfig);
          console.log('TempDischargeSummaryValidator', this.CurrentDischargeSummary_VM.TempDischargeSummaryValidator);

        }
        this.SetDischargeSummaryData(res);

        this.update = true;
      }
      else {
        this.update = false;
        this.CurrentDischargeSummary_VM = new TempDischargeTemplate();
        this.CurrentDischargeSummary_VM.PatientVisitId = this.selectedDischarge.PatientVisitId;
        this.CurrentDischargeSummary_VM.PatientId = this.selectedDischarge.patientId;
        this.CurrentDischargeSummary_VM.CreatedBy = this.securityService.GetLoggedInUser().EmployeeId;
        //default residence doctor will be current logged in user.
        //Ashim: 15Dec2017 : RResidenceDr is not mandatory
        //this.CurrentDischargeSummary_VM.ResidenceDrId = this.securityService.GetLoggedInUser().EmployeeId;
        this.CurrentDischargeSummary_VM.CreatedOn = moment().format('YYYY-MM-DD HH:mm');
        this.AddMedicine(0);
        this.AddMedicine(1);
        this.AddMedicine(2);
        this.AddConsultant();
      }

    } else {
      this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Notice, [res.ErrorMessage]);
      this.CurrentDischargeSummary_VM.DischargeSummaryMedications = new Array<DischargeSummaryMedication>();
      this.NewMedications = new Array<DischargeSummaryMedication>();
      if (!this.NewMedications.length)
        this.AddMedicine(0);
    }
    this.loadingScreen = false;
  }

  async LoadTemplateFieldsIfNeeded(templateId: number): Promise<void> {
    if (templateId) {
      this.selectedTemplateObj = this.dischargeSummaryTemplates.find(a => a.TemplateId === templateId);
      if (this.selectedTemplateObj && this.selectedTemplateObj.TemplateId) {
        await this.LoadTemplateFields(this.selectedTemplateObj.TemplateId);
      }
    }
  }

  DataValidation() {
    this.CheckValidation();
    this.CurrentDischargeSummary_VM.DischargeSummaryMedications = new Array<DischargeSummaryMedication>();
    for (var i in this.CurrentDischargeSummary_VM.TempDischargeSummaryValidator.controls) {
      this.CurrentDischargeSummary_VM.TempDischargeSummaryValidator.controls[i].markAsDirty();
      this.CurrentDischargeSummary_VM.TempDischargeSummaryValidator.controls[i].updateValueAndValidity();
      //this.CurrentDischargeSummary_VM.DischargeSummaryValidator.controls[i].checkIsMendatory();
      // this.CurrentDischargeSummary_VM.DischargeSummaryMedications[i].DischargeSummaryMedicationValidator.controls['Medicine'].disable();
    }

  }

  GenerateDischargeSummaryData() {

    this.GenerateMedicationData();

    this.GenerateInvestigationData();
    this.GenerateConsultantsData();
    // for multiple diagnosis
    if (this.selectedDiagnosisList.length >= 0) {
      let tempString = JSON.stringify(this.selectedDiagnosisList);
      this.CurrentDischargeSummary_VM.Diagnosis = tempString;
    }

    // for multiple provisional diagnosis
    if (this.selectedProviDiagnosisList.length >= 0) {
      let tempString = JSON.stringify(this.selectedProviDiagnosisList);
      this.CurrentDischargeSummary_VM.ProvisionalDiagnosis = tempString;
    }

    // Generating selected Imaging items
    this.CurrentDischargeSummary_VM.SelectedImagingItems = JSON.stringify(this.AddedImgTests);
  }

  GenerateInvestigationData() {
    this.labTests = new Array<any>();
    this.CurrentDischargeSummary_VM.LabTests = '';
    if (this.AddedTests.length > 0) {
      this.AddedTests.forEach(a => {
        this.labTests.push(a);
      });
    }
    this.CurrentDischargeSummary_VM.LabTests = JSON.stringify(this.labTests);
  }

  GenerateMedicationData() {

    if (this.NewMedications.length > 0) {
      this.NewMedications.forEach(a => {
        if (a.Medicine) {
          this.CurrentDischargeSummary_VM.DischargeSummaryMedications.push(a);

        }
      });
    }
  }

  AssignValues() {
    // Dynamically map form controls to the model properties
    const formControls = this.CurrentDischargeSummary_VM.TempDischargeSummaryValidator.controls;
    Object.keys(formControls).forEach(key => {
      if (key in formControls) {
        if (key === 'HistoryOfPresentingIllness') {
          this.CurrentDischargeSummary_VM.PresentingIllness = formControls[key].value;
        }
        else if (key !== 'ProvisionalDiagnosis' && key !== 'LabTests') {
          this.CurrentDischargeSummary_VM[key] = formControls[key].value;
        }
      }
    });
    this.CurrentDischargeSummary_VM.DischargeSummaryTemplateId = this.selectedTemplateObj.TemplateId;
    this.CurrentDischargeSummary_VM.PatientVisitId = this.selectedDischarge.PatientVisitId;
    this.CurrentDischargeSummary_VM.CreatedBy = this.selectedDischarge.CreatedBy;
    this.CurrentDischargeSummary_VM.CreatedOn = this.selectedDischarge.CreatedOn;
    if (this.CheckedBy) {
      if (typeof this.CheckedBy === 'object') {
        this.CurrentDischargeSummary_VM.CheckedBy = this.CheckedBy.EmployeeId;
      } else {
        this.CurrentDischargeSummary_VM.CheckedBy = this.CurrentDischargeSummary_VM.CheckedById;
      }
    } else {
      this.CurrentDischargeSummary_VM.CheckedBy = null;
    }
    this.CurrentDischargeSummary_VM.DischargeSummaryId = this.CurrentDischargeSummary_VM.DischargeSummaryId ? this.CurrentDischargeSummary_VM.DischargeSummaryId : this.selectedDischarge.DischargeSummaryId;
    const dischargeSummary = new TempDischargeTemplate();

  }


  PostDischargeSummary() {
    this.AssignValues();
    if (this.CurrentDischargeSummary_VM.DischargeSummaryId == null) {
      this.CurrentDischargeSummary_VM.DischargeSummaryId = 0;
    }
    this.dischargeSummaryBLService.PostDischargeSummary(this.CurrentDischargeSummary_VM)
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Success, ["Discharge Summary Saved"]);
          this.showDischargeSummary = false;
          this.showSummaryView = true;
          this.update = true;
          this.CurrentDischargeSummary_VM.DischargeSummaryId = res.Results.DischargeSummaryId;
          this.sendData.emit({ Status: ENUM_DanpheHTTPResponses.OK });
          let callBackSummaryData: DischargeSummary = res.Results;
          this.CallBackAddUpdate(callBackSummaryData);

        }
        else {
          this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, ["Check log for errors"]);
          this.logError(res.ErrorMessage);
        }
      },
        err => {
          this.logError(err);

        });
  }

  PutDischargeSummary() {
    this.CurrentDischargeSummary_VM.ModifiedBy = this.securityService.GetLoggedInUser().EmployeeId;
    this.CurrentDischargeSummary_VM.ModifiedOn = moment().format('YYYY-MM-DD HH:mm');

    if (this.CurrentDischargeSummary_VM.DischargeConditionId) {
      this.FilteredDischargeConditions = this.dischargeCondition.filter(a => a.DischargeTypeId == this.CurrentDischargeSummary_VM.DischargeConditionId);
      if (this.FilteredDischargeConditions.length > 0) {
        this.DischargeConditionType = true;
      }
    }
    this.AssignValues();
    this.CurrentDischargeSummary_VM.DischargeSummaryTemplateId = this.selectedTemplateObj.TemplateId;
    this.dischargeSummaryBLService.UpdateDischargeSummary(this.CurrentDischargeSummary_VM)
      .subscribe(
        (res: DanpheHTTPResponse) => {
          if (res.Status === ENUM_DanpheHTTPResponses.OK) {
            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Success, ["Discharge Summary Updated"]);
            let UpdatedDischargeSummary: DischargeSummary = res.Results;
            this.showDischargeSummary = false;
            this.CallBackAddUpdate(UpdatedDischargeSummary);
            this.sendData.emit({ data: "res", Status: "Ok" });
          }
          else {
            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ["Check log for errors"]);
            this.logError(res.ErrorMessage);
          }
        },
        err => {
          this.logError(err);
        });
  }

  Save() {

    this.DataValidation();
    this.CheckForConsultantValidation();

    if (this.CurrentDischargeSummary_VM.IsValidCheck(undefined, undefined) && this.InvalidConsultant == false) {


      this.GenerateDischargeSummaryData();

      this.PostDischargeSummary();

    }
    else {
      this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ["Enter Mandatory fields"]);
    }
  }

  Update() {

    this.DataValidation();
    this.CheckForConsultantValidation();
    if (this.CurrentDischargeSummary_VM.IsValidCheck(undefined, undefined) && this.InvalidConsultant == false) {

      this.GenerateDischargeSummaryData();

      this.PutDischargeSummary();

    }
    else {
      this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ["Enter all Mandatory Fields"]);
    }
  }

  CallBackAddUpdate(dischargeSummary: DischargeSummary) {
    dischargeSummary.DischargeSummaryTemplateId = this.selectedTemplateObj.TemplateId //Passing selected templateId Bikesh-24th-july'23
    this.CurrentDischargeSummary_VM = Object.assign(this.CurrentDischargeSummary_VM, dischargeSummary);
    this.callback.emit(this.CurrentDischargeSummary_VM);

  }

  SubmitAndViewSummary() {
    var view: boolean;
    view = window.confirm("You won't be able to make further changes. Do you want to continue?");
    if (view) {
      this.CurrentDischargeSummary_VM.IsSubmitted = true;
      this.Update();
      this.showDischargeSummary = false;
      this.showSummaryView = true;
    }
  }

  logError(err: any) {
    console.log(err);
  }

  onChange($event) {
    this.icdsID = [];
    $event.forEach(a => {
      this.icdsID.push(a.ICD10Id);
    });
  }
  LabTestSelection(index: number) {
    try {
      if (this.labRequests[index].IsSelectTest) {

        // let check = this.AddedTests.some(a => a.TestId == this.labRequests[index].TestId);
        // if (!check) {
        //   this.AddedTests.push({ TestId: this.labRequests[index].TestId, TestName: this.labRequests[index].TestName, labComponents: [] });

        //   if (this.labRequests[index].labComponents.length > 1) {

        //     let addedIndex: number;
        //     this.AddedTests.forEach((f, i) => {
        //       if (f.TestId == this.labRequests[index].TestId) {
        //         addedIndex = i;
        //       }
        //     });

        //     this.labRequests[index].labComponents.forEach((c, ci) => {
        //       if (ci > 0) {
        //         this.AddedTests[addedIndex].labComponents.push({ ComponentName: c.ComponentName });
        //       }
        //     });

        //   }
        // } else {

        // }

        let check = this.AddedTests.some(a => a.TestId == this.labRequests[index].TestId);
        // Removing already existed lab test
        if (check) {
          let selectedTestId = this.labRequests[index].TestId;

          this.AddedTests.forEach((v, i) => {
            if (v.TestId == selectedTestId) {
              this.AddedTests.splice(i, 1);
              this.selectUnselectAllLabTests = false;
            }
          });

          if (this.labRequests[index].labComponents.length > 1) {
            this.labRequests[index].labComponents.forEach(c => {
              c.IsCmptSelected = false;
            });
          }

        }

        //Adding lab test with all the sub components
        if (this.labRequests[index].labComponents.length > 1) {

          let cmptArrary: Array<any> = new Array<any>();
          this.labRequests[index].labComponents.forEach((c) => {
            cmptArrary.push({ ComponentName: c.ComponentName });
          });
          this.AddedTests.push({ TestId: this.labRequests[index].TestId, TestName: this.labRequests[index].TestName, labComponents: cmptArrary });
        } else {
          this.AddedTests.push({ TestId: this.labRequests[index].TestId, TestName: this.labRequests[index].TestName, labComponents: [] });
        }

        if (this.labRequests[index].labComponents.length > 1) {
          this.labRequests[index].labComponents.forEach(c => {
            c.IsCmptSelected = true;
          });
        }
        this.selectUnselectAllLabTests = true;
      }
      else {
        let selectedTestId = this.labRequests[index].TestId;

        this.AddedTests.forEach((v, i) => {
          if (v.TestId == selectedTestId) {
            this.AddedTests.splice(i, 1);
            this.selectUnselectAllLabTests = false;
          }
        });

        if (this.labRequests[index].labComponents.length > 1) {
          this.labRequests[index].labComponents.forEach(c => {
            c.IsCmptSelected = false;
          });
        }
        this.selectUnselectAllLabTests = false;
      }
    } catch (ex) {
      // this.ShowCatchErrMessage(ex);
    }
  }

  RemoveAddedTest(index: number) {
    let selectedTestId = this.AddedTests[index].TestId;
    this.labRequests.forEach((v, i) => {
      if (v.TestId == selectedTestId) {
        this.labRequests[i].IsSelectTest = false;
      }
    })

    this.AddedTests.splice(index, 1);
    this.selectUnselectAllLabTests = false;

  }


  AddMedicine(val) {
    try {

      var newMedicine = new DischargeSummaryMedication();
      newMedicine.FrequencyId = 0;
      if (val == 0) {
        newMedicine.OldNewMedicineType = 0;
        if (this.NewMedications.length == 0) {
          this.NewMedications.push(newMedicine);
        } else {
          if (this.NewMedications[this.NewMedications.length - 1].Medicine) {
            this.NewMedications.push(newMedicine);
            // Focus to newly created medication input field
            let latestId = this.NewMedications.length - 1;
            this.FocusOnInputField(latestId);
          } else {
            alert("First Enter the medication in exising field!");
          }
        }
      }
      else if (val == 1) {
        newMedicine.OldNewMedicineType = 1;
        this.OldMedications.push(newMedicine);
      }
      else if (val == 2) {
        newMedicine.OldNewMedicineType = 2;
        this.StoppedOldMedications.push(newMedicine);
      }

    } catch (ex) {
      //this.ShowCatchErrMessage(ex);
    }
  }
  RemoveMedicine(index, type) {
    try {
      // this.CurrentDischargeSummary_VM.DischargeSummaryMedications.splice(index, 1);
      if (type == 0) {
        this.NewMedications.splice(index, 1);
      }
      else if (type == 1) {
        this.OldMedications.splice(index, 1);
      }
      else {
        this.StoppedOldMedications.splice(index, 1);
      }
      if (this.NewMedications.length == 0)
        this.AddMedicine(0);
      else if (this.OldMedications.length == 0)
        this.AddMedicine(1);
      else if (this.StoppedOldMedications.length == 0)
        this.AddMedicine(2);
    }
    catch {

    }
  }

  public CheckValidation() {
    if (this.CurrentDischargeSummary_VM) {
      this.CurrentDischargeSummary_VM.UpdateValidator("off", "DischargeCondition", "required");
      if (this.DischargeConditionType) {
        //set validator on
        this.CurrentDischargeSummary_VM.UpdateValidator("on", "DischargeCondition", "required");

      }
      if (this.complusoryDoctorIncharge == false)
        this.CurrentDischargeSummary_VM.UpdateValidator("off", "DoctorIncharge", "required");
      else
        this.CurrentDischargeSummary_VM.UpdateValidator("on", "DoctorIncharge", "required");

      // if (this.Isdeath == false)
      //   this.CurrentDischargeSummary_VM.UpdateValidator("off", "DeathTypeId", "required");
      // else
      //   this.CurrentDischargeSummary_VM.UpdateValidator("on", "DeathTypeId", "required");

      this.dischSumFieldSettings.Anesthetists.IsMandatory ? this.CurrentDischargeSummary_VM.UpdateValidator("on", "Anesthetists", "required") : this.CurrentDischargeSummary_VM.UpdateValidator("off", "Anesthetists", "required");
      this.dischSumFieldSettings.ResidentDr.IsMandatory ? this.CurrentDischargeSummary_VM.UpdateValidator("on", "ResidentDr", "required") : this.CurrentDischargeSummary_VM.UpdateValidator("off", "ResidentDr", "required");
      this.dischSumFieldSettings.BabyWeight.IsMandatory ? this.CurrentDischargeSummary_VM.UpdateValidator("on", "BabyWeight", "required") : this.CurrentDischargeSummary_VM.UpdateValidator("off", "BabyWeight", "required");
      this.dischSumFieldSettings.SelectDiagnosis.IsMandatory ? this.CurrentDischargeSummary_VM.UpdateValidator("on", "SelectDiagnosis", "required") : this.CurrentDischargeSummary_VM.UpdateValidator("off", "SelectDiagnosis", "required");
      this.dischSumFieldSettings.ProvisionalDiagnosis.IsMandatory ? this.CurrentDischargeSummary_VM.UpdateValidator("on", "ProvisionalDiagnosis", "required") : this.CurrentDischargeSummary_VM.UpdateValidator("off", "ProvisionalDiagnosis", "required");
      // this.dischSumFieldSettings.OtherDiagnosis.IsMandatory ? this.CurrentDischargeSummary_VM.UpdateValidator("on", "DiagnosisFreeText", "required") : this.CurrentDischargeSummary_VM.UpdateValidator("off", "DiagnosisFreeText", "required");
      this.dischSumFieldSettings.ClinicalFindings.IsMandatory ? this.CurrentDischargeSummary_VM.UpdateValidator("on", "ClinicalFindings", "required") : this.CurrentDischargeSummary_VM.UpdateValidator("off", "ClinicalFindings", "required");
      this.dischSumFieldSettings.ChiefComplaint.IsMandatory ? this.CurrentDischargeSummary_VM.UpdateValidator("on", "ChiefComplaint", "required") : this.CurrentDischargeSummary_VM.UpdateValidator("off", "ChiefComplaint", "required");
      this.dischSumFieldSettings.HistoryOfPresentingIllness.IsMandatory ? this.CurrentDischargeSummary_VM.UpdateValidator("on", "HistoryOfPresentingIllness", "required") : this.CurrentDischargeSummary_VM.UpdateValidator("off", "HistoryOfPresentingIllness", "required");
      this.dischSumFieldSettings.PastHistory.IsMandatory ? this.CurrentDischargeSummary_VM.UpdateValidator("on", "PastHistory", "required") : this.CurrentDischargeSummary_VM.UpdateValidator("off", "PastHistory", "required");
      this.dischSumFieldSettings.CaseSummary.IsMandatory ? this.CurrentDischargeSummary_VM.UpdateValidator("on", "CaseSummary", "required") : this.CurrentDischargeSummary_VM.UpdateValidator("off", "CaseSummary", "required");
      this.dischSumFieldSettings.ProcedureNts.IsMandatory ? this.CurrentDischargeSummary_VM.UpdateValidator("on", "ProcedureNts", "required") : this.CurrentDischargeSummary_VM.UpdateValidator("off", "ProcedureNts", "required");
      this.dischSumFieldSettings.OperativeFindings.IsMandatory ? this.CurrentDischargeSummary_VM.UpdateValidator("on", "OperativeFindings", "required") : this.CurrentDischargeSummary_VM.UpdateValidator("off", "OperativeFindings", "required");
      this.dischSumFieldSettings.HospitalReport.IsMandatory ? this.CurrentDischargeSummary_VM.UpdateValidator("on", "HospitalReport", "required") : this.CurrentDischargeSummary_VM.UpdateValidator("off", "HospitalReport", "required");
      this.dischSumFieldSettings.HospitalCourse.IsMandatory ? this.CurrentDischargeSummary_VM.UpdateValidator("on", "HospitalCourse", "required") : this.CurrentDischargeSummary_VM.UpdateValidator("off", "HospitalCourse", "required");
      // this.dischSumFieldSettings.TreatmentDuringHospitalStay.IsMandatory ? this.CurrentDischargeSummary_VM.UpdateValidator("on", "Treatment", "required") : this.CurrentDischargeSummary_VM.UpdateValidator("off", "Treatment", "required");
      this.dischSumFieldSettings.Condition.IsMandatory ? this.CurrentDischargeSummary_VM.UpdateValidator("on", "Condition", "required") : this.CurrentDischargeSummary_VM.UpdateValidator("off", "Condition", "required");
      this.dischSumFieldSettings.PendingReports.IsMandatory ? this.CurrentDischargeSummary_VM.UpdateValidator("on", "PendingReports", "required") : this.CurrentDischargeSummary_VM.UpdateValidator("off", "PendingReports", "required");
      this.dischSumFieldSettings.SpecialNotes.IsMandatory ? this.CurrentDischargeSummary_VM.UpdateValidator("on", "SpecialNotes", "required") : this.CurrentDischargeSummary_VM.UpdateValidator("off", "SpecialNotes", "required");
      this.dischSumFieldSettings.Allergies.IsMandatory ? this.CurrentDischargeSummary_VM.UpdateValidator("on", "Allergies", "required") : this.CurrentDischargeSummary_VM.UpdateValidator("off", "Allergies", "required");
      this.dischSumFieldSettings.Activities.IsMandatory ? this.CurrentDischargeSummary_VM.UpdateValidator("on", "Activities", "required") : this.CurrentDischargeSummary_VM.UpdateValidator("off", "Activities", "required");
      this.dischSumFieldSettings.Diet.IsMandatory ? this.CurrentDischargeSummary_VM.UpdateValidator("on", "Diet", "required") : this.CurrentDischargeSummary_VM.UpdateValidator("off", "Diet", "required");
      this.dischSumFieldSettings.RestDays.IsMandatory ? this.CurrentDischargeSummary_VM.UpdateValidator("on", "RestDays", "required") : this.CurrentDischargeSummary_VM.UpdateValidator("off", "RestDays", "required");
      this.dischSumFieldSettings.FollowUp.IsMandatory ? this.CurrentDischargeSummary_VM.UpdateValidator("on", "FollowUp", "required") : this.CurrentDischargeSummary_VM.UpdateValidator("off", "FollowUp", "required");
      this.dischSumFieldSettings.Others.IsMandatory ? this.CurrentDischargeSummary_VM.UpdateValidator("on", "Others", "required") : this.CurrentDischargeSummary_VM.UpdateValidator("off", "Others", "required");
      this.dischSumFieldSettings.ObstetricHistory.IsMandatory ? this.CurrentDischargeSummary_VM.UpdateValidator("on", "ObstetricHistory", "required") : this.CurrentDischargeSummary_VM.UpdateValidator("off", "ObstetricHistory", "required");
      this.dischSumFieldSettings.RelevantMaternalHistory.IsMandatory ? this.CurrentDischargeSummary_VM.UpdateValidator("on", "RelevantMaternalHistory", "required") : this.CurrentDischargeSummary_VM.UpdateValidator("off", "RelevantMaternalHistory", "required");
      this.dischSumFieldSettings.IndicationForAdmission.IsMandatory ? this.CurrentDischargeSummary_VM.UpdateValidator("on", "IndicationForAdmission", "required") : this.CurrentDischargeSummary_VM.UpdateValidator("off", "IndicationForAdmission", "required");
      this.dischSumFieldSettings.RespiratorySystem.IsMandatory ? this.CurrentDischargeSummary_VM.UpdateValidator("on", "RespiratorySystem", "required") : this.CurrentDischargeSummary_VM.UpdateValidator("off", "RespiratorySystem", "required");
      this.dischSumFieldSettings.CardiovascularSystem.IsMandatory ? this.CurrentDischargeSummary_VM.UpdateValidator("on", "CardiovascularSystem", "required") : this.CurrentDischargeSummary_VM.UpdateValidator("off", "CardiovascularSystem", "required");
      this.dischSumFieldSettings.GastrointestinalAndNutrition.IsMandatory ? this.CurrentDischargeSummary_VM.UpdateValidator("on", "GastrointestinalAndNutrition", "required") : this.CurrentDischargeSummary_VM.UpdateValidator("off", "GastrointestinalAndNutrition", "required");
      this.dischSumFieldSettings.Renal.IsMandatory ? this.CurrentDischargeSummary_VM.UpdateValidator("on", "Renal", "required") : this.CurrentDischargeSummary_VM.UpdateValidator("off", "Renal", "required");
      this.dischSumFieldSettings.NervousSystem.IsMandatory ? this.CurrentDischargeSummary_VM.UpdateValidator("on", "NervousSystem", "required") : this.CurrentDischargeSummary_VM.UpdateValidator("off", "NervousSystem", "required");
      this.dischSumFieldSettings.Metabolic.IsMandatory ? this.CurrentDischargeSummary_VM.UpdateValidator("on", "Metabolic", "required") : this.CurrentDischargeSummary_VM.UpdateValidator("off", "Metabolic", "required");
      this.dischSumFieldSettings.Sepsis.IsMandatory ? this.CurrentDischargeSummary_VM.UpdateValidator("on", "Sepsis", "required") : this.CurrentDischargeSummary_VM.UpdateValidator("off", "Sepsis", "required");
      this.dischSumFieldSettings.CongenitalAnomalies.IsMandatory ? this.CurrentDischargeSummary_VM.UpdateValidator("on", "CongenitalAnomalies", "required") : this.CurrentDischargeSummary_VM.UpdateValidator("off", "CongenitalAnomalies", "required");
      this.dischSumFieldSettings.Reflexes.IsMandatory ? this.CurrentDischargeSummary_VM.UpdateValidator("on", "Reflexes", "required") : this.CurrentDischargeSummary_VM.UpdateValidator("off", "Reflexes", "required");
      this.dischSumFieldSettings.MedicationsReceivedInNICUNursery.IsMandatory ? this.CurrentDischargeSummary_VM.UpdateValidator("on", "MedicationsReceivedInNICUNursery", "required") : this.CurrentDischargeSummary_VM.UpdateValidator("off", "MedicationsReceivedInNICUNursery", "required");
      this.dischSumFieldSettings.Discussion.IsMandatory ? this.CurrentDischargeSummary_VM.UpdateValidator("on", "Discussion", "required") : this.CurrentDischargeSummary_VM.UpdateValidator("off", "Discussion", "required");


    }
  }



  public GetFiscalYear() {
    this.dischargeSummaryBLService.GetCurrentFiscalYear()
      .subscribe(res => {
        if (res.Status == "OK") {
          this.CurrentFiscalYear = res.Results;
        } else {
          this.msgBoxServ.showMessage("error", [res.ErrorMessage]);
          console.log(res.ErrorMessage);
        }
      });
  }
  // OnChangeDischargeType(newtype) {
  //   this.DischargeConditionType = false;
  //   this.DeliveryType = false;
  //   this.showBabyDetails = false;
  //   this.Isdeath = false;
  //   this.CurrentDischargeSummary_VM.DeliveryTypeId = null;
  //   //this.CurrentDischargeSummary_VM.BabyBirthConditionId = null;
  //   this.CurrentDischargeSummary_VM.DeathTypeId = null;
  //   //this.CurrentDischargeSummary_VM.DeathPeriod = null;
  //   this.FilteredDischargeConditions = new Array<any>();
  //   this.CurrentDischargeSummary_VM.DischargeTypeId = +this.CurrentDischargeSummary_VM.DischargeTypeId;
  //   newtype = +newtype;
  //   this.FilteredDischargeConditions = this.dischargeCondition.filter(a => a.DischargeTypeId === newtype);
  //   var tempCheckDeath = this.deathTypeList.filter(a => a.DischargeTypeId === newtype);
  //   if (this.FilteredDischargeConditions.length > 0) {
  //     this.DischargeConditionType = true;
  //   }
  //   if (tempCheckDeath.length > 0) {
  //     this.Isdeath = true;
  //     //this.GenerateDeathCertificateNumber();
  //     //this.CurrentDischargeSummary_VM.DeathPeriod = tempCheckDeath[0].DischargeTypeName;
  //   }

  //   //* Bikesh, 128thSept'23, Below logic will filter DischargeConditions for Recovered Discharge Type only. This will remove Delivery option if patient is male.
  //   const selectedType = this.dischargeTypeList.find(type => type.DischargeTypeId === +this.CurrentDischargeSummary_VM.DischargeTypeId);
  //   if (selectedType && selectedType.DischargeTypeName.toLowerCase() === ENUM_DischargeType.Recovered.toLowerCase() && this.selectedDischarge.Gender.toLowerCase() === ENUM_Genders.Male.toLowerCase()) {
  //     this.FilteredDischargeConditions = this.FilteredDischargeConditions.filter(a => a.Condition.toLowerCase() !== ENUM_RecoveredDischargeConditions.Delivery.toLowerCase());
  //   }

  // }
  OnChangeDischargeType(newtype) {
    this.DischargeConditionType = false;
    this.DeliveryType = false;
    this.showBabyDetails = false;
    this.Isdeath = false;
    this.CurrentDischargeSummary_VM.DeliveryTypeId = null;
    //this.CurrentDischargeSummary_VM.BabyBirthConditionId = null;
    this.CurrentDischargeSummary_VM.DeathTypeId = null;
    //this.CurrentDischargeSummary_VM.DeathPeriod = null;
    this.FilteredDischargeConditions = new Array<any>();
    const FilteredDischargeType = this.dischargeTypeList.filter(a => a.DischargeTypeName === newtype);
    if (FilteredDischargeType) {
      this.CurrentDischargeSummary_VM.DischargeTypeId = FilteredDischargeType[0].DischargeTypeId;
    }
    // this.CurrentDischargeSummary_VM.DischargeTypeId = +this.CurrentDischargeSummary_VM.DischargeTypeId;
    // newtype = +newtype;
    this.FilteredDischargeConditions = this.dischargeCondition.filter(a => a.DischargeTypeId === this.CurrentDischargeSummary_VM.DischargeTypeId);
    var tempCheckDeath = this.deathTypeList.filter(a => a.DischargeTypeId === this.CurrentDischargeSummary_VM.DischargeTypeId);
    if (this.FilteredDischargeConditions.length > 0) {
      this.DischargeConditionType = true;
    }
    if (tempCheckDeath.length > 0) {
      this.Isdeath = true;
      //this.GenerateDeathCertificateNumber();
      //this.CurrentDischargeSummary_VM.DeathPeriod = tempCheckDeath[0].DischargeTypeName;
    }

    //* Bikesh, 128thSept'23, Below logic will filter DischargeConditions for Recovered Discharge Type only. This will remove Delivery option if patient is male.
    const selectedType = this.dischargeTypeList.find(type => type.DischargeTypeId === +this.CurrentDischargeSummary_VM.DischargeTypeId);
    if (selectedType && selectedType.DischargeTypeName.toLowerCase() === ENUM_DischargeType.Recovered.toLowerCase() && this.selectedDischarge.Gender.toLowerCase() === ENUM_Genders.Male.toLowerCase()) {
      this.FilteredDischargeConditions = this.FilteredDischargeConditions.filter(a => a.Condition.toLowerCase() !== ENUM_RecoveredDischargeConditions.Delivery.toLowerCase());
    }

  }
  OnChangeDischargeConditionType(condition: any) {
    this.DeliveryType = false;
    this.ShowBabyWeight = false;
    // Find the selected discharge condition
    const selectedFilterDischargeCondition = this.FilteredDischargeConditions.find(a => a.Condition === condition);
    if (selectedFilterDischargeCondition && selectedFilterDischargeCondition.Condition.toLowerCase() === ENUM_RecoveredDischargeConditions.Delivery.toLowerCase()) {
      this.ShowBabyWeight = true;
    }
    this.CurrentDischargeSummary_VM.DischargeConditionId = selectedFilterDischargeCondition.DischargeConditionId;

    // Check if the condition exists in the delivery type list
    const check = this.deliveryTypeList.find(a => a.DischargeConditionId === selectedFilterDischargeCondition.DischargeConditionId);
    if (check) {
      this.DeliveryType = true;
    }

  }


  public MakeDiagnosisList() {
    // console.log(this.diagnosis);
    if (this.diagnosis != undefined && typeof (this.diagnosis) != ENUM_Data_Type.String) {
      if (this.selectedDiagnosisList.length > 0) {
        let temp: Array<any> = this.selectedDiagnosisList;
        let isICDDuplicate: boolean = false;


        if (temp.some(d => d.ICD10Id == this.diagnosis.ICD10Id)) {
          isICDDuplicate = true;
          alert(`${this.diagnosis.icd10Description} Already Added !`);
          this.diagnosis = undefined;

        }
        if (isICDDuplicate == false) {
          {
            this.selectedDiagnosisList.push(this.diagnosis);
            this.diagnosis = undefined;
          }
        }
      } else {
        this.selectedDiagnosisList.push(this.diagnosis);
        this.diagnosis = undefined;
      }
    } else if (typeof (this.diagnosis) === ENUM_Data_Type.String) {
      alert("Enter Valid ICD10 !");
    }
  }
  RemoveDiagnosis(i) {
    let temp: Array<any> = this.selectedDiagnosisList;
    this.selectedDiagnosisList = [];
    this.selectedDiagnosisList = temp.filter((d, index) => index != i);
  }

  public MakeProvisionalDiagnosisList() {
    // console.log(this.diagnosis);
    if (this.provisionalDiagnosis != undefined && typeof (this.provisionalDiagnosis) != ENUM_Data_Type.String) {
      if (this.selectedProviDiagnosisList.length > 0) {
        let temp: Array<any> = this.selectedProviDiagnosisList;
        let isICDDuplicate: boolean = false;


        if (temp.some(d => d.ICD10Id == this.provisionalDiagnosis.ICD10Id)) {
          isICDDuplicate = true;
          alert(`${this.provisionalDiagnosis.icd10Description} Already Added !`);
          this.provisionalDiagnosis = undefined;

        }
        if (isICDDuplicate == false) {
          {
            this.selectedProviDiagnosisList.push(this.provisionalDiagnosis);
            this.provisionalDiagnosis = undefined;
          }
        }
      } else {
        this.selectedProviDiagnosisList.push(this.provisionalDiagnosis);
        this.provisionalDiagnosis = undefined;
      }
    } else if (typeof (this.provisionalDiagnosis) === ENUM_Data_Type.String) {
      alert("Enter Valid ICD10 !");
    }
  }
  RemoveProvisonalDiagnosis(i) {
    let temp: Array<any> = this.selectedProviDiagnosisList;
    this.selectedProviDiagnosisList = [];
    this.selectedProviDiagnosisList = temp.filter((d, index) => index != i);
  }
  LabTestComponentSelection(index: number, ci: number, cName: string) {
    try {
      let selectedTest = this.labRequests[index];
      if (selectedTest.labComponents[ci].IsCmptSelected) {
        let check = this.AddedTests.some(a => a.TestId == selectedTest.TestId);
        if (!check) {
          this.AddedTests.push({ TestId: selectedTest.TestId, TestName: selectedTest.TestName, labComponents: [{ ComponentName: cName }] });
        }
        else { // else, already added
          this.AddedTests.forEach((v, i) => {
            if (v.TestId == selectedTest.TestId) {
              // this.AddedTests.splice(i, 1);
              let checkComp = v.labComponents.some(c => c.ComponentName == cName);
              if (!checkComp) {
                v.labComponents.push({ ComponentName: cName });
              }
            }
          });
        }

      } else {
        this.AddedTests.forEach((v, i) => {
          if (v.TestId == selectedTest.TestId) {
            // this.AddedTests.splice(i, 1);
            let checkComp = v.labComponents.some(c => c.ComponentName == cName);
            if (checkComp) {
              v.labComponents.splice(ci, 1);
              this.selectUnselectAllLabTests = false;
            }
          }
        });
      }
      let selectedComponentCount: number = 0;

      this.AddedTests.forEach(at => {
        if (at.TestId == selectedTest.TestId) {
          selectedComponentCount = at.labComponents.length;
        }
      });

      if (selectedComponentCount == selectedTest.labComponents.length) {
        this.labRequests[index].IsSelectTest = true;
        this.selectUnselectAllLabTests = true;
      } else {
        this.labRequests[index].IsSelectTest = false;
        this.selectUnselectAllLabTests = false;

      }

    } catch (ex) {
      // this.ShowCatchErrMessage(ex);
    }
  }

  ImagingSelection(index: number) {

    if (this.imagingResults[index] && this.imagingResults[index].IsImagingSelected) {
      var check = this.AddedImgTests.some(im => im == this.imagingResults[index].ImagingItemId);
      if (!check) {
        this.AddedImgTests.push(this.imagingResults[index].ImagingItemId);
      }
    } else {
      var check = this.AddedImgTests.some(im => im == this.imagingResults[index].ImagingItemId);
      if (check) {
        this.AddedImgTests.forEach((v, i) => {
          if (v == this.imagingResults[index].ImagingItemId) {
            this.AddedImgTests.splice(i, 1);
            this.selectUnselectAllLabTests = false;
          }
        });
      }
    }
  }

  AssignSelectedImagings() {
    if (this.imagingResults.length && this.imagingItems) {
      this.imagingResults.forEach(a => {
        var check = this.imagingItems.some(im => im == a.ImagingItemId);
        if (check) {
          a.IsImagingSelected = true;
        }
      });
    }
  }


  AllLabTestSelection() {
    try {
    }
    catch (ex) {
      // this.ShowCatchErrMessage(ex);
    }
  }

  LabTestsSelectUnselectALL() {
    if (this.selectUnselectAllLabTests && this.labRequests && this.labRequests.length > 0) { // Select all

      this.labRequests.forEach((lr, index) => {
        // lr.labConponents.forEach(lc=>{
        //   lc.IsCmpSelected = true;          
        // });
        lr.IsSelectTest = true;
        this.LabTestSelection(index);
      });
    }

    else if (this.selectUnselectAllLabTests == false && this.labRequests && this.labRequests.length > 0) {

      this.labRequests.forEach((lr, index) => {
        lr.IsSelectTest = false;
        this.LabTestSelection(index);
      });
    }

  }

  OnMedicineEnterKeyClick() {
    this.AddMedicine(0);
  }

  AddConsultant() {
    var newConsultant = new DischargeSummaryConsultant();
    if (this.consultant && typeof this.consultant === ENUM_Data_Type.Object) {
      let tempSelectedConsultants = this.selectedConsultants;
      let duplicateConsultant: boolean = false;
      tempSelectedConsultants.forEach(a => {
        if (a.consultantId == this.consultant.EmployeeId) {
          alert(`The consultant is already Added !`);
          this.consultant = "";
          duplicateConsultant = true;
          return;
        }
      });
      if (duplicateConsultant == false) {
        newConsultant = Object.assign(
          {

            FullName: this.consultant.FullName,
            consultantDepartmentName: this.consultant.consultantDepartmentName,
            consultantLongSignature: this.consultant.consultantLongSignature,
            consultantNMC: this.consultant.consultantNMC,
            consultantSignImgPath: this.consultant.consultantSignImgPath,
            dischargeSummaryId: 0,
            consultantId: this.consultant.EmployeeId,
            //DischargeSummaryId
            PatientVisitId: 0,
            PatientId: 0,
            consultantName: this.consultant.FullName
          }
        );
      }

      try {
        if (duplicateConsultant == false) {
          if (this.selectedConsultants.length == 0) {
            this.selectedConsultants.push(newConsultant);
            if (newConsultant) {
              this.InvalidConsultant = false;
            }
            this.consultant = '';
          } else {
            if (this.selectedConsultants[this.selectedConsultants.length - 1].consultantId) {
              this.selectedConsultants.push(newConsultant);
            } else {
              alert("Please select a consultant Doctor");
            }
            this.selectedConsultants.forEach(a =>
              a.FullName = a.consultantName
            );
            this.consultant = '';
          }

        }
      } catch (ex) {
        //this.ShowCatchErrMessage(ex);
      }
    }
    else {
      this.consultant = '';
      this.InvalidConsultant = true;
    }
  }
  RemoveConsultant(i) {
    let temp: Array<any> = this.selectedConsultants;
    this.selectedConsultants = [];
    this.selectedConsultants = temp.filter((d, index) => index != i)
  }

  public FocusOnInputField(i: number) {
    window.setTimeout(function () {
      let itmNameBox = document.getElementById("MedicineInput" + i);
      if (itmNameBox) {
        itmNameBox.focus();
      }
    }, 600);
  }

  GenerateConsultantsData() {
    if (this.selectedConsultants.length > 0) {
      // this.CurrentDischargeSummary_VM.DischargeSummaryConsultants = [];
      this.CurrentDischargeSummary_VM.DischargeSummaryConsultants = [];
      // this.selectedConsultants.forEach(d => {
      //   if (d.EmployeeId && d.EmployeeId != 0) {
      //     let selectedConsultant = JSON.parse(JSON.stringify(this.selectedConsultantsDetail));
      //     // this.selectedConsultants[1].ConsultantId = d.EmployeeId;
      //     this.CurrentDischargeSummary_VM.DischargeSummaryConsultants.push(selectedConsultant);
      //   }

      // });
      this.CurrentDischargeSummary_VM.DischargeSummaryConsultants = Object.assign(this.selectedConsultants);

    }
  }
  CheckForConsultantValidation() {
    if (this.selectedConsultants.length < 1) {
      this.InvalidConsultant = true;
    } else {
      this.InvalidConsultant = false;
    }
  }
  CheckDoctorInchargeSettings() {
    //check for compulsion of Doctor Incharge
    let param = this.coreService.Parameters.find(lang => lang.ParameterName == 'IsDoctorInchargeMandatory' && lang.ParameterGroupName == 'DischargeSummary');
    if (param) {
      this.complusoryDoctorIncharge = JSON.parse(param.ParameterValue);
    }
  }

  // Krishna, 17th,May'22, Fishtail Specific Changes
  GetUsers() {
    this.settingsBLService.GetUserList()
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this.UserList = res.Results;
          CommonFunctions.SortArrayOfObjects(this.UserList, "EmployeeName");
        }
        else {
          console.error(res.ErrorMessage);
        }

      });
  }

  userListFormatter(data: any): string {
    let html = data["EmployeeName"];
    return html;
  }
  CheckedByChanged() {
    this.CurrentDischargeSummary_VM.CheckedBy = this.CheckedBy.EmployeeId;
  }
  GetDischargeSummaryTemplates(TemplateTypeName: string) {
    this.dischargeSummaryBLService.GetDischargeSummaryTemplates(TemplateTypeName)
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this.dischargeSummaryTemplates = res.Results;
          if (this.dischargeSummaryTemplates.length && this.dischargeSummaryTemplates.find(a => a.IsDefault === true)) {
            this.selectedTemplateObj = this.dischargeSummaryTemplates.find(a => a.IsDefault === true);
            if (this.selectedTemplateObj.TemplateId) {
              this.LoadTemplateFields(this.selectedTemplateObj.TemplateId);
            }
          }
        } else {
          this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, [res.ErrorMessage]);
        }
      },
        err => {
          this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, ['Failed to get discharge type.. please check log for details.']);
          this.logError(err.ErrorMessage);
        });
  }

  OnTemplateSelected() {
    if (this.selectedTemplateObj) {
      this.LoadTemplateFields(this.selectedTemplateObj.TemplateId)

    }
  }

  async LoadTemplateFields(TemplateId: number): Promise<void> {
    try {
      const res = await this.dischargeSummaryBLService.LoadTemplateFields(TemplateId).toPromise();
      if (res.Status === ENUM_DanpheHTTPResponses.OK) {
        this.TemplatesFromServer = res.Results; // Set the templates from server
        this.selectedTemplateFields = res.Results; // Set the selected template fields

        let template = this.selectedTemplateFields.map(field => ({
          control: field.FieldName,
          required: field.IsMandatory
        }));

        this.CurrentDischargeSummary_VM.ConfigureValidator(template); // Configure the validator
        this.SelectedTemplateFiledsTransformData(); // Transform the data
        this.changeDetector.detectChanges(); // Manually trigger change detection

        return; // Resolve the promise after the data is processed
      } else {
        throw new Error('Failed to load template fields'); // Throw error if the status is not OK
      }
    } catch (error) {
      console.error('Error during LoadTemplateFields:', error);
      throw new Error('An error occurred while executing the command definition. See the inner exception for details.'); // Throw detailed error message
    }
  }
  DisplayFields(summaryData: any): boolean {
    return summaryData.IsActive &&
      (summaryData.FieldName !== 'DischargeCondition' ||
        (this.DischargeConditionType && this.dischSumFieldSettings && this.dischSumFieldSettings.DischargeCondition && this.dischSumFieldSettings.DischargeCondition.Show)) &&
      (summaryData.FieldName !== 'BabyWeight' || (this.dischSumFieldSettings && this.dischSumFieldSettings.BabyWeight && this.dischSumFieldSettings.BabyWeight.Show && this.ShowBabyWeight)) &&
      summaryData.FieldName !== 'Investigations' &&
      summaryData.FieldName !== 'Medications' &&
      summaryData.FieldName !== 'Imagings' &&
      summaryData.FieldName !== 'LabTests';
  }
  //Bikesh:3-Aug-023 extracting selectedTemplateFileds properties
  SelectedTemplateFiledsTransformData() {
    this.dischSumFieldSettings = new DischargeSummaryFieldSettingsVM();
    if (this.selectedTemplateFields && this.selectedTemplateFields.length > 0) {
      for (const item of this.selectedTemplateFields) {
        const fieldName = item.FieldName;
        const show = item.IsActive;
        const isMandatory = item.IsMandatory;
        const DisplayLabelAtForm = item.DisplayLabelAtForm;
        const DisplayLabelAtPrint = item.DisplayLabelAtPrint;

        this.UpdateFieldSettings(fieldName, show, isMandatory, DisplayLabelAtForm, DisplayLabelAtPrint);

      }
      this.AssignAssessmentAndPlan();

    }
  }
  UpdateFieldSettings(fieldName: string, show: boolean, isMandatory: boolean, DisplayLabelAtForm: string, DisplayLabelAtPrint: string) {
    if (fieldName in this.dischSumFieldSettings) {
      this.dischSumFieldSettings[fieldName].Show = show;
      this.dischSumFieldSettings[fieldName].IsMandatory = isMandatory;
      this.dischSumFieldSettings[fieldName].DisplayLabelAtForm = DisplayLabelAtForm;
      this.dischSumFieldSettings[fieldName].DisplayLabelAtPrint = DisplayLabelAtPrint;
    }
  }

  //! Bikesh, 18thSept'23, Below methods are kept to remove the issue from HTML file only, Please remove if not needed after verifying.
  Close(): void {

  }

  DischargeWithPendingBills(): void {

  }
  AssignAssessmentAndPlan() {
    for (let i = 0; i < this.selectedTemplateFields.length; i++) {
      for (let j = 0; j < this.visitService.patientsAssessmentAndPlans.length; j++) {
        if (this.selectedTemplateFields[i].FieldName === this.visitService.patientsAssessmentAndPlans[j].FieldName) {
          // Assuming NotesValues is an array and you want the first value
          const valueToAssign = this.visitService.patientsAssessmentAndPlans[j].NotesValues;

          // Assign the value to CurrentDischargeSummary_VM
          this.CurrentDischargeSummary_VM[this.selectedTemplateFields[i].FieldName] = valueToAssign;

          console.log('Assigned Details are: ', valueToAssign);
        }
      }
    }
  }
  CalculateHospitalStayDays() {
    const currentDate: Date = new Date();
    // const millisecondsPerDay = 1000 * 60 * 60 * 24; // Number of milliseconds in a day
    let admittedDate: Date;
    let dischargedDate: Date;

    if (this.selectedDischarge && this.selectedDischarge.AdmittedDate) {
      admittedDate = new Date(this.selectedDischarge.AdmittedDate);
    } else {
      admittedDate = currentDate;
    }
    if (this.selectedDischarge && this.selectedDischarge.DischargedDate) {
      dischargedDate = new Date(this.selectedDischarge.DischargedDate);
    } else {
      dischargedDate = currentDate;
    }
    // const millisecondsDifference = dischargedDate.getTime() - admittedDate.getTime();
    // this.StayDays = Math.ceil(millisecondsDifference / millisecondsPerDay);
    this.StayDays = moment(dischargedDate).diff(admittedDate, "day");
    if (this.StayDays === 0) {
      this.StayDays = 1;
    }
  }
  LoadDischargeSummary() {


  }
}

export class TemplateField_DTO {
  DischargeTypeId: number;
  FieldName: string;
  IsMandatory: boolean;
  IsActive: boolean;
  IsCompulsoryField: boolean;
  DisplayLabelAtForm: string;
  EnterSequence: number;
}
export class TempDischargeTemplate {
  public DischargeSummaryId: number = 0;
  public PatientVisitId: number = null;
  public DischargeTypeId: number = null;
  public DoctorInchargeId: number = null;
  public OperativeProcedure: string = null;
  public OperativeFindings: string = null;
  public AnaesthetistsId: number = null;
  public Anaesthetists: string = null;
  public Diagnosis: string;
  public CaseSummary: string = null;
  public Condition: string = null;
  public TreatmentDuringHospitalStay: string = null;
  public HospitalReport: string = null;
  public Treatment: string = null;
  public HistologyReport: string = null;
  public SpecialNotes: string = null;
  public Medications: string = null;
  public Allergies: string = null;
  public Activities: string = null;
  public Diet: string = null;
  public RestDays: string = null;
  public FollowUp: string = null;
  public Others: string = null;
  public ResidenceDrId: number = null;

  public CreatedBy: number = null;
  public ModifiedBy: number = null;

  public CreatedOn: string = null;
  public ModifiedOn: string = null;
  public IsSubmitted: boolean = false;
  public DischargeSummaryValidator: FormGroup = null;
  public LabTests: string = null;
  public DischargeSummaryMedications: Array<DischargeSummaryMedication> = new Array<DischargeSummaryMedication>();
  // public DischargeSummaryConsultants: Array<DischargeSummaryConsultant> = new Array<DischargeSummaryConsultant>();
  public DischargeSummaryConsultants: Array<DischargeSummaryConsultant> = new Array<DischargeSummaryConsultant>();
  //public BabyBirthDetails : Array<BabyBirthDetails> = new Array<BabyBirthDetails>();
  public DischargeConditionId: number = null;
  public DeliveryTypeId: number = null;
  //public BabyBirthConditionId: number = null;
  public DeathTypeId: number = null;
  //public BabysFathersName: string = null;
  //public DeathCertificateNumber: string =null;
  public PatientId: any;
  public FiscalYearName: string = null;
  //public DeathPeriod: string = null;

  public ChiefComplaint: string = null;
  public PendingReports: string = null;
  public HospitalCourse: string = null;
  public PresentingIllness: string = null;
  public ProcedureNts: string = null;
  public SelectedImagingItems: string = null;
  public DischargeType: string = null;
  public ProvisionalDiagnosis: string;
  public DiagnosisFreeText: string;
  public BabyWeight: string;
  public ClinicalFindings: string;
  public PastHistory: string = null;
  public PhysicalExamination: string = null;

  public DischargeSummaryTemplateId: number;
  public DischargeCondition: string;
  public DeathType: string;
  public BabyBirthCondition: string;
  public DeliveryType: string;
  public DoctorIncharge: string;
  public Age: number;
  public SelectedDiagnosis: string;
  public Anesthetists: string;
  public ResidenceDrName: string;
  public CheckedBy: any;
  public Consultants: string;
  public Consultant: string;
  public hospitalStayDate: string;
  public DrInchargeNMC: string;
  public ConsultantNMC: string;
  public ConsultantsSign: string;
  public ConsultantSignImgPath: string;
  public DrInchargeSignImgPath: string;
  public DischargeOrder: string;
  public AdviceOnDischarge: string;
  public StayDays: number = 0;
  public TempDischargeSummaryValidator: FormGroup = null;
  public CheckedById: number = 0;
  public ObstetricHistory: string;
  public RelevantMaternalHistory: string;
  public IndicationForAdmission: string;
  public RespiratorySystem: string;
  public CardiovascularSystem: string;
  public GastrointestinalAndNutrition: string;
  public Renal: string;
  public NervousSystem: string;
  public Metabolic: string;
  public Sepsis: string;
  public CongenitalAnomalies: string;
  public Reflexes: string;
  public MedicationsReceivedInNICUNursery: string;
  public Discussion: string;
  public ConfigureValidator(formControls: { control: string, required: boolean }[]) {
    formControls.forEach(controlData => {
      // Check if the field name contains 'Consultant' and skip validation if it does
      if (controlData.control.includes('Consultant')) {
        this.TempDischargeSummaryValidator.addControl(controlData.control, new FormControl(''));
      } else {
        const validators = controlData.required ? [Validators.required] : [];
        this.TempDischargeSummaryValidator.addControl(controlData.control, new FormControl('', validators));
      }
    });
  }

  constructor() {

    var _formBuilder = new FormBuilder();
    this.TempDischargeSummaryValidator = _formBuilder.group({});

    // var _formBuilder = new FormBuilder();
    // this.TempDischargeSummaryValidator = _formBuilder.group({
    //   'DischargeType': ['', Validators.compose([Validators.required])],
    //   // 'Consultant': ['', Validators.compose([Validators.required])],
    //   'DischargeCondition': ['', Validators.compose([Validators.required])],
    //   'DoctorIncharge': ['', Validators.compose([Validators.required])],
    //   'Anesthetists': [''],
    //   'ResidentDr': [''],
    //   'BabyWeight': [''],
    //   'SelectDiagnosis': [''],
    //   'ProvisonalDiagnosis': [''],
    //   'SelectedDiagnosis': [''],
    //   'OtherDiagnosis': [''],
    //   'ClinicalFindings': [''],
    //   'CheifComplain': [''],
    //   'HistoryOfPresentingIllness': [''],
    //   'PastHistory': [''],
    //   'CaseSummery': [''],
    //   'Procedure': [''],
    //   'OperativeFindings': [''],
    //   'HospitalReport': [''],
    //   'HospitalCourse': [''],
    //   'TreatmentDuringHospitalStay': [''],
    //   'ConditionOnDischarge': [''],
    //   'PendingReports': [''],
    //   'SpecialNotes': [''],
    //   'Allergies': [''],
    //   'Activities': [''],
    //   'Diet': [''],
    //   'RestDays': [''],
    //   'FollowUP': [''],
    //   'Others': [''],
    //   'CheckedBy': [''],
    //   'Investigations': [''],
    //   'LabTests': [''],
    //   'Imgaings': [''],
    //   'Medications': [''],
    //   'DischargeOrder': ['']
    // });

  }
  public IsDirty(fieldName): boolean {
    if (fieldName == undefined)
      return this.TempDischargeSummaryValidator.dirty;
    else
      return this.TempDischargeSummaryValidator.controls[fieldName].dirty;
  }

  public IsValid(): boolean {
    if (this.TempDischargeSummaryValidator.valid) {
      return true;
    }
    else {
      return false;
    }
  }
  public IsValidCheck(fieldName, validator): boolean {
    if (fieldName == undefined)
      return this.TempDischargeSummaryValidator.valid;
    else
      return !(this.TempDischargeSummaryValidator.hasError(validator, fieldName));
  }
  //Dynamically add validator

  public UpdateValidator(onOff: string, formControlName: string, validatorType: string) {
    if (!this.TempDischargeSummaryValidator.controls[formControlName]) {
      return;
    }

    const control = this.TempDischargeSummaryValidator.controls[formControlName];

    if (validatorType === 'required') {
      control.setValidators(onOff === "on" ? [Validators.required] : []);
      control.updateValueAndValidity();
    }
  }


}
