import { Component, EventEmitter, OnInit, Output } from "@angular/core";
import { FormBuilder, FormGroup } from "@angular/forms";
import { Event, NavigationStart, Router } from '@angular/router';
import * as moment from "moment";
import { Observable, Subscription } from "rxjs";
import { VisitService } from "../../appointments/shared/visit.service";
import { BillingCounter } from "../../billing/shared/billing-counter.model";
import { Patient_DTO } from "../../claim-management/shared/DTOs/patient.dto";
import { CoreService } from "../../core/shared/core.service";
import { PatientService } from "../../patients/shared/patient.service";
import { SecurityService } from "../../security/shared/security.service";
import { ClinicalNotes_DTO } from "../../settings-new/shared/DTOs/clinical-notes.dto";
import { Department } from "../../settings-new/shared/department.model";
import { DanpheHTTPResponse } from "../../shared/common-models";
import { DanpheCache, MasterType } from "../../shared/danphe-cache-service-utility/cache-services";
import { MessageboxService } from "../../shared/messagebox/messagebox.service";
import { RouteFromService } from "../../shared/routefrom.service";
import { ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status } from "../../shared/shared-enums";
import { ActivateBillingCounterService } from "../../utilities/shared/activate-billing-counter.service";
import { ClinicalNoteService } from "../shared/clinical-note.service";
import { ClinicalNoteBLService } from "../shared/clinical.bl.service";
import { ClinicalService } from "../shared/clinical.service";
import { ClinicalAssessmentAndPlan_DTO } from "../shared/dto/clinicalAssessmentAndPlan.dto";
import { Medication_DTO } from "../shared/dto/medication.dto";

@Component({
  selector: 'clinical-assessment-and-plan-main',
  templateUrl: './clinical-assessment-and-plan-main.component.html'
})
export class ClinicalAssessmentAndPlanMainComponent implements OnInit {
  @Output() enableInvestigationRequestChange: EventEmitter<boolean> = new EventEmitter<boolean>();
  public selectedPatient: Patient_DTO = new Patient_DTO();
  public clinicalAssessment: ClinicalAssessmentAndPlan_DTO = new ClinicalAssessmentAndPlan_DTO();
  public ICD11List = [];
  public IcdVersionDisplayName: string = "";
  public icd10Selected: { ICD10Code: string, ICD10Description: string };
  public clinicalNoteList: ClinicalNotes_DTO[];
  public ClinaicalAsssessmentPlanList: ClinicalAssessmentAndPlan_DTO[];
  public clinicalAssessmentList: ClinicalNotes_DTO[];
  public defClinicalNoteFields: ClinicalNotes_DTO[];
  public nonDefClinicalNoteFields: ClinicalNotes_DTO[];
  public loading: boolean = false;
  public Date: string = moment().format("YYYY-MM-DD");
  public SelectedICDCodes: { icd10Description: string }[] = [];
  public EnableInvestigationRequest: boolean = false;
  public EnableMedicationRequest: boolean = false;
  public ClinicalAssessmentPlanFormGroup: FormGroup = null;
  public selectedDiagnosisList: Array<any> = new Array<any>();
  public counterId: number = null;
  public counterList = new Array<BillingCounter>();
  public isCounterActivated: boolean = false;
  public currentBillingCounter: BillingCounter = new BillingCounter();
  public currentCounterName: string = "";
  public showChangeBillingCounterPopup: boolean = false;
  public patientsExistingAssessmentAndPlanList: ClinicalAssessmentAndPlan_DTO[] = [];
  public defaultPatientsNoteList: ClinicalAssessmentAndPlan_DTO[] = [];
  public nonDefaultPatientsNoteList: ClinicalAssessmentAndPlan_DTO[] = [];
  public showBookAdmission: boolean = false;
  public showPrintReport: boolean = false;
  public isBedReserved: boolean = false;
  public isBedNotReserved: boolean = false;
  public LoggedInUserDetails: any;
  public DepartmentName: string = "";
  public DoctorName: string = "";
  public EmployeeId: number = 0;
  public PriceCategoryId: number = 0;
  public DepartmentId: number = 0;
  public bedReservationInfo: any;
  public routerSubscription: Subscription;
  public NavigateToDischarge: boolean = false;
  public AssessmentAndPlansDetails: ClinicalAssessmentAndPlan_DTO = new ClinicalAssessmentAndPlan_DTO();
  public departmentList: Array<Department> = [];


  constructor(
    public msgBoxServ: MessageboxService,
    public clinicalBlservice: ClinicalNoteBLService,
    public coreService: CoreService,
    public router: Router,
    public routeFromService: RouteFromService,
    private activateBillingCounterService: ActivateBillingCounterService,
    public securityService: SecurityService,
    private clinicalNoteService: ClinicalNoteService,
    private _formValidator: FormBuilder,
    public clinicalService: ClinicalService,
    public patientService: PatientService,
    public visitService: VisitService,
  ) {
    this.routeFromService.RouteFrom = "Clinical";
    this.IcdVersionDisplayName = this.coreService.Parameters.find(p => p.ParameterGroupName == "Common" && p.ParameterName == "IcdVersionDisplayName").ParameterValue;
    this.GetICDList();
    this.getClinicalNoteFieldList();
    this.counterId = this.securityService.getLoggedInCounter().CounterId;
    this.LoggedInUserDetails = this.securityService.loggedInUser.Employee;
    this.GetDepartmentList();
    this.LoadCounter();

  }
  ngOnInit() {
    this.LoadEmployeeDetails();
    this.routerSubscription = this.router.events.subscribe((event: Event) => {
      if (event instanceof NavigationStart) {
        this.loading = true;
      } else {
        this.loading = false;
      }
    });

  }
  GetDepartmentList() {
    this.clinicalBlservice.GetDepartments().subscribe(
      (res) => {
        if (res.Status == "OK") {
          this.departmentList = res.Results;
        } else {
          this.msgBoxServ.showMessage("Error", [res.ErrorMessage]);
        }
      },
      (err) => {
        this.msgBoxServ.showMessage("Error", [err.ErrorMessage]);
      }
    );
  }
  LoadEmployeeDetails() {
    this.EmployeeId = this.LoggedInUserDetails.EmployeeId;
    this.DoctorName = this.LoggedInUserDetails.FullName;
    this.DepartmentId = this.LoggedInUserDetails.DepartmentId;

    // setTimeout(() => {
    //     let Department = this.coreService.Masters.Departments.find(d => d.DepartmentId === this.DepartmentId);
    //     if (Department) {
    //         this.DepartmentName = Department.DepartmentName;
    //     }
    // }, 1000);
  }
  public AllPatientSearchAsync = (keyword: any): Observable<any[]> => {
    return this.clinicalBlservice.SearchRegisteredPatient(keyword);
  };
  public LoadCounter(): void {
    let allCounters: Array<BillingCounter>;
    allCounters = DanpheCache.GetData(MasterType.BillingCounter, null);
    if (allCounters && allCounters.length) {
      this.counterList = allCounters.filter(counter => counter.CounterType === null || counter.CounterType === "BILLING");
      this.isCounterActivated = false;
      if (this.currentBillingCounter && this.currentBillingCounter.CounterId) {
        this.isCounterActivated = true;
        let currentCounter = this.counterList.find(counter => counter.CounterId === this.currentBillingCounter.CounterId);
        if (currentCounter) {
          this.currentCounterName = currentCounter.CounterName;
          this.activateBillingCounterService.setActiveBillingCounter(currentCounter);
          this.securityService.setLoggedInCounter(currentCounter);
        }
      }
    }
    this.showChangeBillingCounterPopup = true;
  }
  emitSelectedPatientData() {
    this.clinicalNoteService.setSelectedPatient(this.selectedPatient);
  }
  PatientListFormatter(data: any): string {
    let html: string = "";
    html =
      "<font size=03>" +
      "[" +
      data["PatientCode"] +
      "]" +
      "</font>&nbsp;-&nbsp;&nbsp;<font color='blue'; size=03 ><b>" +
      data["ShortName"] +
      "</b></font>&nbsp;&nbsp;" +
      "(" +
      data["Age"] +
      "/" +
      data["Gender"] +
      ")" +
      "" +
      "</b></font>";
    return html;
  }
  GoToNextInput(nextInputId: string) {
    const nextInput = document.getElementById(nextInputId);
    if (nextInput) {
      nextInput.focus();
    }
  } public GetICDList() {
    this.clinicalBlservice.GetICDList()
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this.ICD11List = res.Results;
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
  logError(err: any) {
    console.log(err);
  }
  ICDListFormatter(data: any): string {
    let html;
    if (!data.ValidForCoding) {
      html = "<b>" + data["ICD10Code"] + " | " + data["icd10Description"].split(',')[0].trim() + "</b>";
    }
    else
      html = data["ICD10Code"] + "  " + data["icd10Description"];
    return html;
  }
  loadICDs(selectedItem: any) {
    if (this.ICD11List.length > 0 && selectedItem) {
      if (typeof selectedItem === 'object') {
        let IcdCodesContainer: string = "";

        const isAlreadySelected = this.SelectedICDCodes.some(item => item.icd10Description === selectedItem.icd10Description);

        if (!isAlreadySelected) {
          this.SelectedICDCodes.push(selectedItem);
        } else {
          this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Warning, ['Already Selected']);
        }

        let icdDescriptions = this.SelectedICDCodes.map(a => a.icd10Description);
        if (icdDescriptions && icdDescriptions.length) {
          IcdCodesContainer = icdDescriptions.join(',');
        }
        this.ClinicalAssessmentPlanFormGroup.get('ICDCodes').setValue('');
      }
    }
  }


  RemoveDiagnosis(index: number) {
    this.SelectedICDCodes.splice(index, 1);
  }
  getClinicalNoteFieldList() {
    this.clinicalBlservice.clinicalNoteFieldList()
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status == ENUM_DanpheHTTPResponses.OK) {
          this.clinicalNoteList = res.Results;
          const IsSystemDefaultTrue = this.clinicalNoteList.filter(item => item.IsSystemDefault === true);
          if (IsSystemDefaultTrue) {
            this.defClinicalNoteFields = IsSystemDefaultTrue;
          }
          const IsSystemDefaultfalseList = this.clinicalNoteList.filter(item => item.IsSystemDefault === false);
          if (IsSystemDefaultfalseList) {
            this.nonDefClinicalNoteFields = IsSystemDefaultfalseList;
          }
          const nonDefaultDynamicControls = {};
          this.nonDefClinicalNoteFields.forEach(f => {
            nonDefaultDynamicControls[f.FieldName] = [''];
          });

          const defaultDynamicControls = {};
          this.defClinicalNoteFields.forEach(f => {
            defaultDynamicControls[f.FieldName] = [''];
          });

          const staticControls = {
            // 'ClinicalNotesMasterId': [''],
            // 'DefaultNoteValue': [''],
            // 'ICDCode': ['']
          };

          const allControls = { ...staticControls, ...nonDefaultDynamicControls, ...defaultDynamicControls };
          this.ClinicalAssessmentPlanFormGroup = this._formValidator.group(allControls);
        }
      });
  }

  ngOnDestroy() {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }
  Discharge() {
    if (this.selectedPatient.PatientId && this.selectedPatient.IsAdmitted) {
      this.NavigateToDischarge = true;
      this.visitService.SetPatientVisitId(this.selectedPatient.PatientVisitId);
      this.visitService.SetPatientDetails(this.selectedPatient);
      this.visitService.SetPatientsAssessmentAndPlans(this.patientsExistingAssessmentAndPlanList);
      this.visitService.SetPatientFromClinical(this.NavigateToDischarge);
      let patvisid = this.clinicalService.PatientVisitId;

      this.loading = true;

      this.router.navigate(['/ADTMain/DischargedList']).then(() => {
        this.loading = false;
      });
    } else {
      this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Notice, [
        'Please Select the Patient for Discharge',
      ]);
    }
  }
  AssignSelectedPatient() {
    this.clinicalAssessment.PatientId = this.selectedPatient.PatientId;
    this.clinicalAssessment.VisitId = this.selectedPatient.PatientVisitId;
    if (this.clinicalAssessment.PatientId) {
      this.PriceCategoryId = this.selectedPatient.PriceCategoryId;
      this.DoctorName = this.selectedPatient.PerformerName;
      this.DepartmentId = this.selectedPatient.DepartmentId;
      if (this.DepartmentId) {
        const foundDepartment = this.departmentList.find(dep => dep.DepartmentId === this.DepartmentId);
        if (foundDepartment) {
          this.DepartmentName = foundDepartment.DepartmentName;
        } else {
          console.error(`Department with ID ${this.DepartmentId} not found.`);
        }
      }

      this.EnableInvestigationRequest = true;
      this.EnableMedicationRequest = true;
      this.getPatientsClinicalNotes();
    }
    else {
      this.EnableInvestigationRequest = false;
      this.EnableMedicationRequest = false;
      this.nonDefaultPatientsNoteList.forEach(note => {
        this.ClinicalAssessmentPlanFormGroup.controls[note.FieldName].setValue('');
      });
      this.defaultPatientsNoteList.forEach(note => {
        this.ClinicalAssessmentPlanFormGroup.controls[note.FieldName].setValue('');
      });
      this.SelectedICDCodes = [];

    }
  }


  AssignValue() {
    this.AssignSelectedPatient();
    this.ClinaicalAsssessmentPlanList = [];
    this.nonDefClinicalNoteFields.forEach(f => {
      const clinicalAssessmentFromData = this.ClinicalAssessmentPlanFormGroup.value;
      let clinicalAssessmentData = new ClinicalAssessmentAndPlan_DTO();
      clinicalAssessmentData.PatientId = this.selectedPatient.PatientId;
      clinicalAssessmentData.VisitId = this.selectedPatient.PatientVisitId;
      clinicalAssessmentData.ClinicalNotesMasterId = f.ClinicalNoteMasterId;
      clinicalAssessmentData.NotesValues = clinicalAssessmentFromData[f.FieldName] ? clinicalAssessmentFromData[f.FieldName] : '';
      this.ClinaicalAsssessmentPlanList.push(clinicalAssessmentData);
    })
    this.defClinicalNoteFields.forEach(f => {

      const clinicalAssessmentFromData = this.ClinicalAssessmentPlanFormGroup.value;
      let clinicalAssessmentData = new ClinicalAssessmentAndPlan_DTO();
      clinicalAssessmentData.PatientId = this.selectedPatient.PatientId;
      clinicalAssessmentData.VisitId = this.selectedPatient.PatientVisitId;
      clinicalAssessmentData.ClinicalNotesMasterId = f.ClinicalNoteMasterId;

      if (f.FieldName !== 'ICDCodes') {
        clinicalAssessmentData.NotesValues = clinicalAssessmentFromData[f.FieldName] ? clinicalAssessmentFromData[f.FieldName] : '';
      }
      else {
        clinicalAssessmentData.NotesValues = this.SelectedICDCodes.map(code => code.icd10Description).join(',');
      }
      this.ClinaicalAsssessmentPlanList.push(clinicalAssessmentData);
    })


    this.SaveData(this.ClinaicalAsssessmentPlanList);
  }
  SaveData(plans: ClinicalAssessmentAndPlan_DTO[]) {
    this.loading = true;
    if (this.selectedPatient.PatientId) {
      for (var i in this.ClinicalAssessmentPlanFormGroup.controls) {
        this.ClinicalAssessmentPlanFormGroup.controls[i].markAsDirty();
        this.ClinicalAssessmentPlanFormGroup.controls[i].updateValueAndValidity();
      }
      if (this.IsValidCheck(undefined, undefined)) {
        this.clinicalBlservice.PostAssessmentAndPlan(plans).finally(() => this.loading = false)
          .subscribe((res: DanpheHTTPResponse) => {
            if (res.Status === ENUM_DanpheHTTPResponses.OK) {
              if (res.Results) {
                this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Success, ["Notes Added Successfully"]);
                this.getPatientsClinicalNotes();
              }
            }
            else {
              this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ["Failed To Add Assessment and Plan"]);
            }
          },
            err => {
              this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, [err.ErrorMessage]);
            });
      }
    }
    else {
      this.loading = false;
      this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Notice, ['Please select Patient and Assements and Plans'])
    }
  }
  getPatientsClinicalNotes() {
    this.loading = true;
    this.clinicalBlservice.getPatientsClinicalNotes(this.selectedPatient.PatientId, this.selectedPatient.PatientVisitId).finally(() => this.loading = false)
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          if (res.Results) {
            this.patientsExistingAssessmentAndPlanList = res.Results;
            const IsSystemDefaultTrue = this.patientsExistingAssessmentAndPlanList.filter(item => item.IsSystemDefault === true);
            if (IsSystemDefaultTrue) {
              this.defaultPatientsNoteList = IsSystemDefaultTrue;
            }
            const IsSystemDefaultfalseList = this.patientsExistingAssessmentAndPlanList.filter(item => item.IsSystemDefault === false);
            if (IsSystemDefaultfalseList) {
              this.nonDefaultPatientsNoteList = IsSystemDefaultfalseList;
            }
            this.nonDefaultPatientsNoteList.forEach(note => {
              this.ClinicalAssessmentPlanFormGroup.controls[note.FieldName].setValue(note.NotesValues);
            });
            this.defaultPatientsNoteList.forEach(note => {
              this.ClinicalAssessmentPlanFormGroup.controls[note.FieldName].setValue(note.NotesValues);
              if (note.FieldName === 'ICDCodes') {
                let SelectedICDCodesCSV: string = note.NotesValues;
                const SelectedICDCodes = SelectedICDCodesCSV.split(',').filter(code => code.trim() !== '');
                if (SelectedICDCodes && SelectedICDCodes.length) {
                  this.SelectedICDCodes = [];
                  let selectedICDCodes = [];
                  SelectedICDCodes.forEach(a => {
                    selectedICDCodes.push({ icd10Description: a });
                  })
                  this.SelectedICDCodes = selectedICDCodes;
                  this.ClinicalAssessmentPlanFormGroup.controls[note.FieldName].setValue('');
                }
              }
            });


          }
        }
        else {
          this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ["This Patient does not have any existing assessment and plan "]);
        }
      },
        err => {
          this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, [err.ErrorMessage]);
        });
  }

  Admission() {
    if (this.selectedPatient.PatientId) {

      this.showBookAdmission = true;
    }
    else {
      this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Notice, ['Please Select the Patient for Admission']);
    }
  }
  PrintReport() {

    if (this.selectedPatient.PatientId) {
      this.patientsExistingAssessmentAndPlanList = [];
      this.RequestedTestItems = [];
      this.RequestedMedicationList = [];
      this.getRequestedItems(this.selectedPatient.PatientId, this.selectedPatient.PatientVisitId);
      // this.getRequestedImagingItems(this.selectedPatient.PatientId, this.selectedPatient.PatientVisitId);
      this.GetMedicationList(this.selectedPatient.PatientId, this.selectedPatient.PatientVisitId);
      this.getPatientsClinicalNotes();
      setTimeout(() => {
        this.print();
      }, 2000);

    }
    else {
      this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Notice, ['Please Select the Patient for Print']);
    }
  }
  print() {
    var iframe = document.createElement('iframe');
    document.body.appendChild(iframe);
    var stylesheet = `
        <style>
.complaindata
{
border:1px solid;
padding:5px;
margin-top: 20px;
}
.investigationDiv
{
border: 1px solid;
    margin: 20px 0px 0px 12px;
    padding: 8px;
}
.complaindata b
{
	border-footer:1px solid;
}
.complaindataContainer
{

}
.patientTable
{
	width:100%;
	border:1px solid;
}
.patientTable td
{

}
.MedicationTable
{
	width:100%;
	border:1px solid;
}
.heading {
font-weight:bold;
border:1px solid;
}
.Medication{
}
@media print
{
@page
{
size: A4;
margin: 30mm 3mm 3mm 3mm;
}
}
</style>
        `
    var patientData = `
        <table class="patientTable">
        <tr>
            <td>Patient Name :${this.selectedPatient.ShortName}</td>
            <td>Hospital No  : ${this.selectedPatient.PatientCode}</td>
        </tr>
        <tr>
        <td>Age/Sex  :${this.selectedPatient.Age}</td>
         <td>Contact No :${this.selectedPatient.PhoneNumber}</td>
        </tr>
        <tr>
        <td> Address : ${this.selectedPatient.Address}</td>
        </tr>
        </table>
        `;
    var clinicalInformation = "";// document.getElementById("clinicalData").innerHTML;
    if (this.patientsExistingAssessmentAndPlanList.length > 0) {
      this.patientsExistingAssessmentAndPlanList.forEach(f => {
        if (f.NotesValues && f.NotesValues.length) {
          clinicalInformation += `
                <div class="complaindata">
                <b> ${f.DisplayName} </b>
                    <div>

                    ${f.NotesValues}
                    </div>
                </div>
                `;
        }

      })
    }

    var InvestigationRequest = "";
    var MedicationRequest = "";

    if (this.RequestedTestItems.length > 0) {
      InvestigationRequest += "<b>Investigation</b>";
      this.RequestedTestItems.forEach(f => {

        InvestigationRequest += `

       <li>${f.TestName}</li>

        `;

      });
    }
    if (this.RequestedMedicationList.length > 0) {
      MedicationRequest += "<b>Medicaiton/Advice </b>";
      MedicationRequest += `<table class="MedicationTable"><tr class="heading">
        <td>Medicine Name</td>
        <td>Frequency</td>
        <td>Doses</td>
        <td>Duration</td>
        </tr>`;
      this.RequestedMedicationList.forEach(f => {
        MedicationRequest += `
            <tr>
        <td>${f.ItemName}</td>
        <td>${f.Frequency}</td>
        <td>${f.Dosage}</td>
        <td>${f.HowManyDays}</td>
        </tr>
            `;
      });
      MedicationRequest += "</table>";
    }
    //combine all declare variables
    let documentContent = `<html><head>
        ${stylesheet}
        </head>
        <body onload="window.print()">
        ${patientData}
        <div style="display: flex;">
        <div class="complaindataContainer" style="Width:70%;">${clinicalInformation}</div>
        <div  class="investigationDiv" style="Width:28%"> <ol>${InvestigationRequest}</ol></div>
        </div>
        <div class="Medication"> ${MedicationRequest}</div>
        <br>
      <b>  FollowUp  : ${this.Date}</b>

        <div style="text-align:right">
        ------------------------------
		<br>
        <span>Consultant Doctor </span>
        <br>
        <b>${this.LoggedInUserDetails.LongSignature}</b>
        </div>
        </body>
        </html>
        `;
    iframe.contentWindow.document.open();
    iframe.contentWindow.document.write(documentContent);
    iframe.contentWindow.document.close();
    //clear all objects
    setTimeout(function () {
      document.body.removeChild(iframe);
    }, 500);
  }

  public RequestedMedicationList = new Array<Medication_DTO>();
  public RequestedTestItems: Array<any>;
  //  public RequestedImagingItems: Array<ImagingItemReport> = new Array<ImagingItemReport>();
  // getRequestedImagingItems(PatientId: number, PatientVisitId: number) {
  //     this.clinicalBlservice.GetRequestedImagingItems(PatientId, PatientVisitId)
  //         .subscribe((res: DanpheHTTPResponse) => {
  //             if (res.Status === ENUM_DanpheHTTPResponses.OK && res.Results) {
  //                 this.RequestedImagingItems = res.Results;
  //             }
  //         },
  //             err => {
  //                 console.log(err);
  //             }
  //         );
  // }
  getRequestedItems(PatientId: number, PatientVisitId: number) {
    this.clinicalBlservice.GetRequestedLabItems(PatientId, PatientVisitId, false)
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK && res.Results) {
          this.RequestedTestItems = res.Results;
        }
        // else {
        //     this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ["Lab Requisition Items Not Found"]);
        // }
      },
        err => {
          console.log(err);
        }
      );
  }

  GetMedicationList(PatientId: number, patientVisitId: number) {
    this.clinicalBlservice.GetMedicationList(PatientId, patientVisitId, false)
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK && res.Results) {
          this.RequestedMedicationList = res.Results;
        }
      },
        err => {
          console.log(err);
        }
      );
  }

  ClosePopUp() {
    this.showBookAdmission = false;
    this.isBedReserved = false;
  }
  CallBackClose() {
    this.ClosePopUp();
  }
  BedReservedDetails(reservationInfo: any) {
    this.isBedReserved = true;
    this.isBedNotReserved = false;
    this.bedReservationInfo = reservationInfo;

  }
  CallBackAdd() {
  }
  public IsValidCheck(fieldName, validator): boolean {
    if (fieldName == undefined) {
      return this.ClinicalAssessmentPlanFormGroup.valid;
    }
    else
      return !(this.ClinicalAssessmentPlanFormGroup.hasError(validator, fieldName));
  }
}
