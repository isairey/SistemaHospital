import { ChangeDetectorRef, Component } from '@angular/core';
import { Router } from '@angular/router';
import * as moment from 'moment/moment';
import { CoreService } from "../../../core/shared/core.service";
import { PatientService } from '../../../patients/shared/patient.service';
import { SecurityService } from '../../../security/shared/security.service';
import { DanpheHTTPResponse } from '../../../shared/common-models';
import { GridEmitModel } from "../../../shared/danphe-grid/grid-emit.model";
import { MessageboxService } from '../../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponseText, ENUM_DanpheHTTPResponses, ENUM_LabVerificationStatus, ENUM_MessageBox_Status } from '../../../shared/shared-enums';
import LabGridColumnSettings from '../../shared/lab-gridcol-settings';
import { LabSticker } from '../../shared/lab-sticker.model';
import { LabService } from '../../shared/lab.service';
import { LabsBLService } from '../../shared/labs.bl.service';

@Component({
  selector: 'lab-pending-reports',
  templateUrl: "./lab-tests-pending-reports.html"

})
export class LabTestsPendingReports {
  public reportList: Array<any>;
  public FilteredReportList: any[] = [];
  gridColumns: Array<any> = null;
  public showAddEditResult: boolean = false;
  public showlabsticker: boolean = false;
  public showReport: boolean = false;
  public PatientLabInfo: LabSticker = new LabSticker();
  public showGrid: boolean = true;
  public requisitionIdList = [];
  public verificationRequired: boolean = false;
  public fromDate: string = null;
  public toDate: string = null;
  public dateRange: string = null;
  public pendingReportGridCol: LabPendingReportColumnSettings = null;
  //@ViewChild('searchBox') someInput: ElementRef;

  public timeId: any = null;
  public catIdList: Array<number> = [];
  public isInitialLoad: boolean = true;
  public routeAfterVerification: string;

  public loading: boolean = false;
  public VerificationStatus: string = "";
  public ShowUndoOption: boolean = false;
  public IsSelectedRowPreVerified: boolean = false;
  public IsPreVerificationEnabled: boolean = false;
  public VerificationStatusOptions = [
    {
      id: "labPendingReport_verificationStatus_all",
      value: "All",
      label: {
        value: "All",
      }
    },
    {
      id: "labPendingReport_verificationStatus_pending",
      value: "Pending",
      label: {
        value: "Pending",
      }
    },
    {
      id: "labPendingReport_verificationStatus_preVerified",
      value: "Pre-Verified",
      label: {
        value: "Pre-Verified",
      }
    }
  ];
  constructor(public labBLService: LabsBLService, public coreService: CoreService,
    public changeDetector: ChangeDetectorRef, public labService: LabService,
    public msgBoxService: MessageboxService, public router: Router,
    public patientService: PatientService, public securityService: SecurityService) {
    this.pendingReportGridCol = new LabPendingReportColumnSettings(this.securityService, this.coreService);
    this.gridColumns = this.pendingReportGridCol.PendingReportListColumnFilter(this.coreService.GetPendingReportListColumnArray());

    if (this.labService.routeNameAfterverification) {
      if (this.labService.routeNameAfterverification.toLowerCase() === 'addresult') {
        this.routeAfterVerification = 'PendingLabResults';
      } else if (this.labService.routeNameAfterverification.toLowerCase() === 'finalreports') {
        this.routeAfterVerification = 'FinalReports';
      } else if (this.labService.routeNameAfterverification.toLowerCase() === 'pendingreports') {
        this.routeAfterVerification = 'PendingReports';
      }

    }
    this.ProcessPreVerification();
  }

  ngOnInit() {
    //this.GetPendingReportList(this.fromDate, this.toDate, this.catIdList);
  }

  ngAfterViewInit() {
    document.getElementById('quickFilterInput').focus()
  }

  OnDateRangeChange($event) {
    if ($event) {
      this.fromDate = $event.fromDate;
      this.toDate = $event.toDate;
    }
  }

  BackToGrid() {
    this.showGrid = true;
    this.FilteredReportList = [];
    //reset patient on header;
    this.requisitionIdList = [];
    this.patientService.CreateNewGlobal();
    this.GetPendingReportList(this.fromDate, this.toDate, this.catIdList);
  }
  GetPendingReportList(frmdate, todate, categoryList) {
    this.reportList = [];
    this.labBLService.GetLabTestPendingReports(frmdate, todate, categoryList)
      .finally(() => {
        this.loading = false;
        this.ShowUndoOption = false;
      })//re-enable button after response comes back.
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
          this.reportList = res.Results;
          this.reportList = this.reportList.slice();
          this.FilteredReportList = this.reportList;
          if (this.IsPreVerificationEnabled) {
            this.FilterByVerificationStatus();
          }
        }
        else {
          this.msgBoxService.showMessage(ENUM_MessageBox_Status.Failed, ['Unable to get Final Report List']);
          console.log(res.ErrorMessage);
        }
      });
  }
  GridActions($event: GridEmitModel) {

    switch ($event.Action) {
      case "ViewDetails":
        {
          this.ViewDetail($event);
        }
        break;

      case "verify":
        {
          this.requisitionIdList = [];

          if ($event.Data.signatureUpdated) {

            let reqs = $event.Data.RequisitionIdsCSV.split(',');
            reqs.forEach(reqId => {
              if (this.requisitionIdList && this.requisitionIdList.length) {
                if (!this.requisitionIdList.includes(+reqId)) {
                  this.requisitionIdList.push(+reqId);
                }
              }
              else {
                this.requisitionIdList.push(+reqId);
              }
            });

            var finalConfirmation = window.confirm("Are You sure you want to verify these tests, without viewing its result ?");

            if (finalConfirmation) {
              this.VerifyTestsDirectlyFromList();
            }
          }
          else {
            this.ViewDetail($event);
          }

        }
        break;

      case "labsticker":
        {
          this.requisitionIdList = [];
          this.PatientLabInfo.HospitalNumber = $event.Data.PatientCode;
          let dob = $event.Data.DateOfBirth;
          let gender: string = $event.Data.Gender;
          this.PatientLabInfo.Age = this.coreService.CalculateAge(dob);
          if (this.PatientLabInfo.Age) {
            this.PatientLabInfo.AgeSex = this.coreService.FormateAgeSex(this.PatientLabInfo.Age, gender);
          }
          this.PatientLabInfo.Sex = gender;
          this.PatientLabInfo.PatientName = $event.Data.PatientName;
          this.PatientLabInfo.RunNumber = $event.Data.SampleCode;
          this.PatientLabInfo.SampleCodeFormatted = $event.Data.SampleCodeFormatted;
          this.PatientLabInfo.VisitType = $event.Data.VisitType;
          this.PatientLabInfo.BarCodeNumber = $event.Data.BarCodeNumber;
          this.PatientLabInfo.TestName = $event.Data.LabTestCSV;

          let reqs = $event.Data.RequisitionIdsCSV.split(',');
          reqs.forEach(reqId => {
            if (this.requisitionIdList && this.requisitionIdList.length) {
              if (!this.requisitionIdList.includes(+reqId)) {
                this.requisitionIdList.push(+reqId);
              }
            }
            else {
              this.requisitionIdList.push(+reqId);
            }
          });

          if (this.PatientLabInfo.VisitType.toLowerCase() === 'inpatient') {
            this.PatientLabInfo.VisitType = 'IP';
          } else if (this.PatientLabInfo.VisitType.toLowerCase() === 'outpatient') {
            this.PatientLabInfo.VisitType = 'OP';
          } else if (this.PatientLabInfo.VisitType.toLowerCase() === 'emergency') {
            this.PatientLabInfo.VisitType = 'ER';
          }



          this.showlabsticker = false;
          this.changeDetector.detectChanges();
          this.showlabsticker = true;


        }
        break;
      case "undo":
        {
          this.IsSelectedRowPreVerified = false;
          this.requisitionIdList = [];
          this.ShowUndoOption = true;
          let reqs = $event.Data.RequisitionIdsCSV.split(',');
          reqs.forEach(reqId => {
            if (this.requisitionIdList && this.requisitionIdList.length) {
              if (!this.requisitionIdList.includes(+reqId)) {
                this.requisitionIdList.push(+reqId);
              }
            }
            else {
              this.requisitionIdList.push(+reqId);
            }
          });
          this.IsSelectedRowPreVerified = ($event.Data.VerificationStatus === ENUM_LabVerificationStatus.PreVerified);
        }

        break;
      default:
        break;
    }
  }

  public ViewDetail($event) {
    this.requisitionIdList = [];
    this.patientService.getGlobal().PatientId = $event.Data.PatientId;
    this.patientService.getGlobal().ShortName = $event.Data.PatientName;
    this.patientService.getGlobal().PatientCode = $event.Data.PatientCode;
    this.patientService.getGlobal().DateOfBirth = $event.Data.DateOfBirth;
    this.patientService.getGlobal().Gender = $event.Data.Gender;
    this.patientService.getGlobal().Ins_HasInsurance = $event.Data.HasInsurance;

    //this is removed because it didnt show the two diff. RequisitionID of same TestName of single patient Twice
    //this.requisitionIdList = $event.Data.Tests.map(test => { return test.RequisitionId });
    let reqs = $event.Data.RequisitionIdsCSV.split(',');
    reqs.forEach(reqId => {
      if (this.requisitionIdList && this.requisitionIdList.length) {
        if (!this.requisitionIdList.includes(+reqId)) {
          this.requisitionIdList.push(+reqId);
        }
      }
      else {
        this.requisitionIdList.push(+reqId);
      }
    });

    this.showGrid = false;
    this.showAddEditResult = false;
    this.showReport = true;
    this.verificationRequired = this.coreService.EnableVerificationStep();
    if (this.verificationRequired) {
      this.coreService.FocusInputById('btnVerify')
    }
  }



  VerifyTestsDirectlyFromList() {
    this.labBLService.VerifyAllLabTestsDirectly(this.requisitionIdList)
      .subscribe(res => {
        if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
          this.GetPendingReportList(this.fromDate, this.toDate, this.catIdList);
          if (this.routeAfterVerification && this.routeAfterVerification.trim() && this.routeAfterVerification.trim().length > 0) {
            let route = '/Lab/' + this.routeAfterVerification;
            this.router.navigate([route]);
          }
        }
      });
  }

  ExitOutCall($event) {
    if ($event.exit) {
      this.PatientLabInfo = new LabSticker();
      this.requisitionIdList = [];
      this.showlabsticker = false;
    }
  }

  CloseSticker() {
    this.PatientLabInfo = new LabSticker();
    this.requisitionIdList = [];
    this.showlabsticker = false;
  }

  public CallBackBackToGrid($event) {
    if ($event.backtogrid) {
      this.BackToGrid();
    }
  }


  public GetTestListFilterByCategories() {
    if ((this.fromDate != null) && (this.toDate != null) && (this.catIdList.length > 0)) {
      if (moment(this.fromDate).isBefore(this.toDate) || moment(this.fromDate).isSame(this.toDate)) {
        this.GetPendingReportList(this.fromDate, this.toDate, this.catIdList);
      } else {
        this.msgBoxService.showMessage(ENUM_MessageBox_Status.Failed, ['Please enter valid From date and To date']);
      }
    }
  }

  public LabCategoryOnChange($event) {
    // this.isInitialLoad = false;
    this.catIdList = [];
    // this.reportList = [];
    if ($event && $event.length) {
      $event.forEach(v => {
        this.catIdList.push(v.TestCategoryId);
      })
    }
    if (this.timeId) {
      window.clearTimeout(this.timeId);
      this.timeId = null;
    }
    this.timeId = window.setTimeout(() => {
      if (this.isInitialLoad) {
        this.GetTestListFilterByCategories();
        this.isInitialLoad = false;
      }
    }, 500);
  }

  public FilterByVerificationStatus() {
    if (this.VerificationStatus === ENUM_LabVerificationStatus.Pending) {
      this.FilteredReportList = this.reportList.filter(a => a.VerificationStatus === ENUM_LabVerificationStatus.Pending);
    }
    else if (this.VerificationStatus === ENUM_LabVerificationStatus.PreVerified) {
      this.FilteredReportList = this.reportList.filter(a => a.VerificationStatus === ENUM_LabVerificationStatus.PreVerified);
    }
    else if (this.VerificationStatus === ENUM_LabVerificationStatus.All) {
      this.FilteredReportList = this.reportList;
    }
    else {
      this.FilteredReportList = [];
    }
  }

  CloseUndoConfirmationBox() {
    this.requisitionIdList = [];
    this.ShowUndoOption = false;
  }

  UndoPendingReport() {
    this.loading = true;
    this.labBLService.UndoPendingReport(this.requisitionIdList)
      .finally(() => {
        this.loading = false;
      })
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this.msgBoxService.showMessage(ENUM_MessageBox_Status.Success, [`Undo operation for this report is successfully completed.`]);
          this.GetPendingReportList(this.fromDate, this.toDate, this.catIdList);
        } else {
          this.ShowUndoOption = false;
          this.msgBoxService.showMessage(ENUM_MessageBox_Status.Error, ['Unable to undo selected report.']);
        }
      }, (err: DanpheHTTPResponse) => {
        this.ShowUndoOption = false;
        this.msgBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Exception: ${err.ErrorMessage}`]);
      });
  }

  public ProcessPreVerification() {
    const maxVerificationPermissionCount = 3;
    let param = this.coreService.Parameters.find(val => val.ParameterName === "LabReportVerificationNeededB4Print" && val.ParameterGroupName === "LAB");
    if (param) {
      let paramValue = JSON.parse(param.ParameterValue);
      if (paramValue) {
        this.IsPreVerificationEnabled = JSON.parse(paramValue.EnablePreVerification);
      }
    }
    if (!this.securityService.HasPermission('radio-filter-lab-verification-status-pending')) {
      let index = this.VerificationStatusOptions.findIndex(a => a.id === "labPendingReport_verificationStatus_pending");
      if (index >= 0) {
        this.VerificationStatusOptions.splice(index, 1);
      }
    }
    if (!this.securityService.HasPermission('radio-filter-lab-verification-status-pre-verified')) {
      let index = this.VerificationStatusOptions.findIndex(a => a.id === "labPendingReport_verificationStatus_preVerified");
      if (index >= 0) {
        this.VerificationStatusOptions.splice(index, 1);
      }
    }
    if (this.VerificationStatusOptions.length !== maxVerificationPermissionCount) {
      let index = this.VerificationStatusOptions.findIndex(a => a.id === "labPendingReport_verificationStatus_all");
      if (index >= 0) {
        this.VerificationStatusOptions.splice(index, 1);
      }
    }
    this.VerificationStatus = this.VerificationStatusOptions.length === maxVerificationPermissionCount ? ENUM_LabVerificationStatus.PreVerified : this.VerificationStatusOptions.length > 0 ? this.VerificationStatusOptions[0].value : "";
  }

  ngOnDestroy(): void {
    this.patientService.CreateNewGlobal();
  }
}


export class LabPendingReportColumnSettings {
  static IsVerificatioStepEnabled: boolean = true;
  static HasVerificationStepEnabled: boolean = false;
  static securityServ: any;

  constructor(public securityService: SecurityService, public coreService: CoreService) {
    LabPendingReportColumnSettings.IsVerificatioStepEnabled = this.coreService.EnableVerificationStep();
    LabPendingReportColumnSettings.HasVerificationStepEnabled = this.securityService.HasPermission('lab-verifier');
    LabPendingReportColumnSettings.securityServ = this.securityService;
    new LabGridColumnSettings(this.securityService);
  }



  public PendingReportListColumnFilter(columnObj: any): Array<any> {
    let LabTestPendingReportList: Array<any> = [
      { headerName: "Hospital No.", field: "PatientCode", width: 80 },
      { headerName: "Patient Name", field: "PatientName", width: 130 },
      { headerName: "Age/Sex", field: "", width: 90, cellRenderer: LabGridColumnSettings.NewAgeSexRendererPatient },
      { headerName: "Phone Number", field: "PhoneNumber", width: 100 },
      { headerName: "Test Name", field: "LabTestCSV", width: 170 },
      { headerName: "Requesting Dept.", field: "WardName", width: 70 },
      { headerName: "Run No.", field: "SampleCodeFormatted", width: 60 },
      { headerName: "Bar Code", field: "BarCodeNumber", width: 70 },
      { headerName: "Status", field: "VerificationStatus", width: 70 },
      {
        headerName: "Action",
        field: "",
        width: 200,
        cellRenderer: LabPendingReportColumnSettings.VerifyRenderer,
      }
    ];
    var filteredColumns = [];
    if (columnObj) {
      for (var prop in columnObj) {
        if (columnObj[prop] == true || columnObj[prop] == 1) {
          var headername: string = prop;
          var ind = LabTestPendingReportList.find(val => val.headerName.toLowerCase().replace(/ +/g, "") == headername.toLowerCase().replace(/ +/g, ""));
          if (ind) {
            filteredColumns.push(ind);
          }
        }
      }
      if (filteredColumns.length) {
        return filteredColumns;
      } else {
        return LabTestPendingReportList;
      }
    }
    else {
      return LabTestPendingReportList;
    }

  }

  static VerifyRenderer(params) {
    let template = "";
    if (LabPendingReportColumnSettings.securityServ.HasPermission("btn-pending-reports-view")) {
      template += `<a danphe-grid-action="ViewDetails" class="grid-action">
                 View Details
            </a>`
    }

    if (LabPendingReportColumnSettings.securityServ.HasPermission("btn-pending-reports-sticker")) {
      template += `<a danphe-grid-action="labsticker" class="grid-action"><i class="glyphicon glyphicon-print"></i> Sticker</a>
        `
    }

    // if (LabPendingReportColumnSettings.IsPreVerificationEnabled && LabPendingReportColumnSettings.HasPermissionOfPreVerification && params.data.Tests.some(a => a.IsPreVerified === false)) {
    //   template += `<a danphe-grid-action="pre-verify" class="grid-action">Pre-Verify</a>`
    // }
    // else {
    //   if (LabPendingReportColumnSettings.IsVerificatioStepEnabled && LabPendingReportColumnSettings.HasVerificationStepEnabled) {
    //     template = template + `<a danphe-grid-action="verify" class="grid-action">Verify</a>`;
    //   }
    // }



    template += `<div class="dropdown" style="display:inline-block;">
    <button class="dropdown-toggle grid-btnCstm" type="button" data-toggle="dropdown">...
      <span class="caret"></span></button>
      <ul class="dropdown-menu grid-ddlCstm">`;

    if (LabGridColumnSettings.securityServ.HasPermission("btn-pending-report-undo")) {
      template += `<li><a danphe-grid-action="undo">Undo</a></li>`;
    }

    template += `</ul></div>`;
    return template;
  }


}
