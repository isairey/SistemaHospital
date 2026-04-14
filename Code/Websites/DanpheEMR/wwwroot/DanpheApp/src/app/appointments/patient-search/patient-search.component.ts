
import { ChangeDetectorRef, Component, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import * as moment from 'moment/moment';
import { Observable } from 'rxjs';
import { AppointmentService } from '../../appointments/shared/appointment.service';
import { BillingBLService } from '../../billing/shared/billing.bl.service';
import { CoreService } from '../../core/shared/core.service';
import { Patient } from "../../patients/shared/patient.model";
import { PatientService } from '../../patients/shared/patient.service';
import { DanpheHTTPResponse } from '../../shared/common-models';
import { CommonFunctions } from '../../shared/common.functions';
import GridColumnSettings from '../../shared/danphe-grid/grid-column-settings.constant';
import { GridEmitModel } from "../../shared/danphe-grid/grid-emit.model";
import { NepaliDateInGridColumnDetail, NepaliDateInGridParams } from '../../shared/danphe-grid/NepaliColGridSettingsModel';
import { MessageboxService } from '../../shared/messagebox/messagebox.service';
import { APIsByType } from '../../shared/search.service';
import { ENUM_AppointmentType, ENUM_DanpheHTTPResponses, ENUM_ManageVisitsGridActions, ENUM_MessageBox_Status, ENUM_Scheme_ApiIntegrationNames, ENUM_VisitType } from '../../shared/shared-enums';
import { APFPatientData } from '../shared/APFPatientData.model';
import { AppointmentBLService } from '../shared/appointment.bl.service';
import { GetPatientVisits_DTO } from '../shared/dto/patient-visit-list.dto';
import { FollowupOption, VisitTypeOption } from '../shared/types/appointment-custom-types';
import { VisitBLService } from '../shared/visit.bl.service';
import { Visit } from '../shared/visit.model';
import { VisitService } from '../shared/visit.service';
import { Rank_ApfHospital } from '../visit/visit-patient-info.component';

@Component({
  templateUrl: "./search-patient.html",
  styleUrls: ['./patient-search.component.css'],
  host: { '(window:keydown)': 'hotkeys($event)' }
})

export class PatientSearchComponent {

  patients: Array<Patient> = new Array<Patient>();
  public patient: Patient = new Patient();
  searchmodel: Patient = new Patient();
  public patGirdDataApi: string = "";
  //start: for angular-grid
  AppointmentpatientGridColumns: Array<any> = null;
  //start: for angular-grid
  searchText: string = '';
  public showInpatientMessage: boolean = false;
  public enableServerSideSearch: boolean = false;
  public wardBedInfo: any = null;
  public APFUrl: string = '';
  public IsAPFIntegrationEnabled: boolean = false;
  public ApfPatientDetails: APFPatientData = new APFPatientData();
  public SearchPatientUsingHospitalNo: boolean = false;
  public IsHospitalNoSearch: boolean = false; //This flag is send to server.
  public IsIdCardNoSearch: boolean = false; //This flag is send to server.
  public SearchPatientUsingIdCardNo: boolean = false;
  public RankList: Rank_ApfHospital[];
  public PatientObj: any = null;
  PatientObjForSearchFilterOption: any = null;
  PatientSearchMinCharacterCount: number = 0;
  SelectedPatientVisits = new Array<GetPatientVisits_DTO>();
  OutPatientVisitList = new Array<GetPatientVisits_DTO>();
  InPatientVisitList = new Array<GetPatientVisits_DTO>();
  OutPatientVisitListGridCols: typeof GridColumnSettings.OutPatientVisitListGridCols;
  InPatientVisitListGridCols: typeof GridColumnSettings.InPatientVisitListGridCols;
  ShowPatientPanel: boolean = false;
  SelectedPatient = new Patient();
  NepaliDateInGridSettingsOutpatient: NepaliDateInGridParams = new NepaliDateInGridParams();
  NepaliDateInGridSettingsInpatient: NepaliDateInGridParams = new NepaliDateInGridParams();



  FollowUpOptions: Array<FollowupOption> = [
    { id: 1, code: "free", value: "Free FollowUp" },
    { id: 2, code: "paid", value: "Paid FollowUp" }
  ];

  VisitTypeOptions: Array<VisitTypeOption> = [
    { id: 1, value: "Outpatient & ER Visits", displayOutpatient: true, displayInPatient: false },
    { id: 2, value: "Inpatient Visits", displayOutpatient: false, displayInPatient: true }
  ];

  DisplayOutpatientVisits: boolean = false;
  DisplayInpatientVisits: boolean = false;

  ActiveTab: number = 0;
  SelectedVisit = new Visit();
  ShowOpdSticker: boolean = false;
  ShowReferralPopup: boolean = false;
  ShowFollowupPage: boolean = false;
  MaxLastVisitDaysVisitTypeWise =
    {
      outpatient: 7,
      inpatient: 30
    };
  MaxLastVisitDays: number = 0;
  MaxInternalReferralDays: number = 0;
  DisplayFollowupPopup: boolean = false;
  SelectedFollowupOption: FollowupOption;

  @ViewChild('btnManualFollowup', { read: ElementRef })
  ManualFollowupBtn: ElementRef;
  IsFreeFollowupOptionSelected: boolean = false;
  SelectedSearchOption: string = "PolicyNo"; //DefaultValue
  SearchPatientByFilterOptionPlaceholder: string = "Search Patient By Policy/Member No."; //DefaultValue
  constructor(
    private _patientService: PatientService,
    public appointmentService: AppointmentService,
    public router: Router, public appointmentBLService: AppointmentBLService,
    public msgBoxServ: MessageboxService, public coreService: CoreService, public visitService: VisitService,
    public visitBlService: VisitBLService,
    private _billingBlService: BillingBLService,//! Krishna, remove this later
    private _changeDetector: ChangeDetectorRef
  ) {
    this.getParameter();
    this.loadMaximumLastVisitDays();
    this.Load("");
    this._patientService.CreateNewGlobal();
    this.appointmentService.CreateNewGlobal();
    this.OutPatientVisitListGridCols = GridColumnSettings.OutPatientVisitListGridCols;
    this.InPatientVisitListGridCols = GridColumnSettings.InPatientVisitListGridCols;
    this.AppointmentpatientGridColumns = GridColumnSettings.AppointmentPatientSearch;
    this.patGirdDataApi = APIsByType.PatientListForRegNewVisit
    this.RankList = this.visitService.RankList;
    this.NepaliDateInGridSettingsOutpatient.NepaliDateColumnList.push(
      new NepaliDateInGridColumnDetail("VisitDate", false)
    );
    this.NepaliDateInGridSettingsInpatient.NepaliDateColumnList.push(
      new NepaliDateInGridColumnDetail("AdmittingDate", false)
    ); this.NepaliDateInGridSettingsInpatient.NepaliDateColumnList.push(
      new NepaliDateInGridColumnDetail("DischargeDate", false)
    );
  }

  loadMaximumLastVisitDays() {
    let param = this.coreService.Parameters.find(p => p.ParameterGroupName === "Appointment" && p.ParameterName === "MaximumLastVisitDays");

    if (param) {
      const paramValue = JSON.parse(param.ParameterValue);
      if (paramValue) {
        this.MaxLastVisitDaysVisitTypeWise = paramValue;
      }

    }

    const maxInternalReferralDays = this.coreService.Parameters.find(p => p.ParameterGroupName === "Appointment" && p.ParameterName === "InternalReferralDays");
    if (maxInternalReferralDays) {
      this.MaxInternalReferralDays = maxInternalReferralDays.ParameterValue;
    }
  }
  ngAfterViewInit() {
    // document.getElementById('quickFilterInput').focus();
    this.FocusOnElementById('id_search_patient');
  }

  private FocusOnElementById(id: string) {
    let element = document.getElementById(id);
    if (element) {
      element.focus();
    }
  }

  serverSearchTxt(searchTxt) {
    let searchTextData = searchTxt;
    if (this.isStringJson(searchTextData)) {
      searchTextData = JSON.parse(searchTextData);
      if (searchTextData && searchTextData.text && searchTextData.searchUsingHospitalNo) {
        this.searchText = searchTextData.text;
        this.IsHospitalNoSearch = searchTextData.searchUsingHospitalNo;
        this.IsIdCardNoSearch = false;
        this.Load(this.searchText);
      } else if (searchTextData && searchTextData.text && searchTextData.searchUsingIdCardNo) {
        this.searchText = searchTextData.text;
        this.IsIdCardNoSearch = searchTextData.searchUsingIdCardNo;
        this.IsHospitalNoSearch = false;
        this.Load(this.searchText);
      } else {
        this.searchText = searchTextData;
        this.IsHospitalNoSearch = false;
        this.IsIdCardNoSearch = false;
        this.Load(this.searchText);
      }
    } else {
      this.searchText = searchTextData;
      this.IsHospitalNoSearch = false;
      this.IsIdCardNoSearch = false;
      this.Load(this.searchText);
    }
  }

  isStringJson(str) {
    try {
      JSON.parse(str);
    } catch (e) {
      return false;
    }
    return true;
  }
  getParameter() {
    this.GetPatientSearchMinCharacterCountParameter();
    let parameterData = this.coreService.Parameters.find(p => p.ParameterGroupName === "Common" && p.ParameterName === "ServerSideSearchComponent").ParameterValue;
    var data = JSON.parse(parameterData);
    this.enableServerSideSearch = data["PatientSearchPatient"];
    let param = this.coreService.Parameters.find(a => a.ParameterGroupName === 'Appointment' && a.ParameterName === 'APFUrlForPatientDetail');
    if (param) {
      let obj = JSON.parse(param.ParameterValue);
      this.APFUrl = obj.BaseURL;
      this.IsAPFIntegrationEnabled = JSON.parse(obj.EnableAPFPatientRegistrtion);
    }

    let parameterToSearchUsingHospNo = this.coreService.Parameters.find(a => a.ParameterGroupName === "Appointment" && a.ParameterName === "SearchPatientUsingHospitalNo");
    if (parameterToSearchUsingHospNo) {
      let obj = JSON.parse(parameterToSearchUsingHospNo.ParameterValue);
      this.SearchPatientUsingHospitalNo = obj.SearchPatientUsingHospitalNumber;
      this.IsHospitalNoSearch = false;
    }
    let parameterToSearchUsingIdCardNo = this.coreService.Parameters.find(a => a.ParameterGroupName === "Appointment" && a.ParameterName === "SearchPatientUsingIdCardNo");
    if (parameterToSearchUsingIdCardNo) {
      let obj = JSON.parse(parameterToSearchUsingIdCardNo.ParameterValue);
      this.SearchPatientUsingIdCardNo = obj.SearchPatientUsingIdCardNo;
      this.IsIdCardNoSearch = false;
    }


  }
  Load(searchText): void {
    this.appointmentBLService.GetPatientsListForNewVisit(searchText, this.IsHospitalNoSearch, this.IsIdCardNoSearch)
      .subscribe(res => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this.patients = res.Results;
        }
        else {
          //alert(res.ErrorMessage);
          this.msgBoxServ.showMessage("error", [res.ErrorMessage]);

        }
      },
        err => {
          //alert('failed to get  patients');
          this.msgBoxServ.showMessage("error", ["failed to get  patients"]);

        });
  }

  public getIdCardNumber(data) {
    this.visitBlService.GetAPIPatientDetail(this.APFUrl, data.IDCardNumber).subscribe(res => {
      this.ApfPatientDetails = res;
    },
      err => {
      })
  }

  //ashim: 22Aug2018 : Removed unnecessary server call to get patient details
  SelectPatient(event, _patient) {
    let pat = this._patientService.getGlobal();
    Object.keys(_patient).forEach(property => {
      if (property in pat) {
        pat[property] = _patient[property];
      }
    });
    pat.DateOfBirth = moment(pat.DateOfBirth).format('YYYY-MM-DD');
    if (this.IsAPFIntegrationEnabled && this.ApfPatientDetails.id) {
      pat.Rank = this.ApfPatientDetails.rank;
      pat.Posting = this.ApfPatientDetails.posting;
    }
    else {
      pat.Rank = _patient.Rank;
      pat.Posting = _patient.Posting;
    }
    pat.SSFPolicyNo = _patient.SSFPolicyNo;
    pat.PolicyNo = _patient.PolicyNo;
    pat.MedicareMemberNo = _patient.MedicareMemberNo;
    pat.MaritalStatus = _patient.MaritalStatus;
    pat.Email = _patient.Email;
    pat.CareTaker.CareTakerName = _patient.CareTakerName;
    pat.CareTaker.CareTakerContact = _patient.CareTakerContact;
    pat.CareTaker.RelationWithPatient = _patient.RelationWithCareTaker;
    pat.PriceCategoryId = _patient.PriceCategoryId;
    pat.SchemeId = _patient.SchemeId;
    // Selected PriceCategoryId From latest Visit 
    //sud:6Sept'21--Pls don't remove below (appointmenttype)--it causes issue during refer/followup.
    if ((this.OutPatientVisitList && this.OutPatientVisitList.length) || (this.InPatientVisitList && this.InPatientVisitList.length)) {
      this.visitService.appointmentType = ENUM_AppointmentType.revisit;
    } else {
      this.visitService.appointmentType = ENUM_AppointmentType.new;
    }
    this.router.navigate(["/Appointment/Visit"]);

  }
  logError(err: any) {
    this.msgBoxServ.showMessage("error", [err]);
    console.log(err);
  }

  AppointmentPatientGridActions($event: GridEmitModel) {

    switch ($event.Action) {
      case ENUM_ManageVisitsGridActions.Referral: {
        if (this.SelectedPatient.IsAdmitted) {
          this.showInpatientMessage = true;
        } else {
          this.ReferPatient($event);
        }
        break;
      }
      case ENUM_ManageVisitsGridActions.Sticker: {
        this.SelectedVisit = $event.Data;
        this.ShowOpdSticker = true;
        break;
      }
      case ENUM_ManageVisitsGridActions.FollowUp: {
        if (this.SelectedPatient.IsAdmitted) {
          this.showInpatientMessage = true;
        } else {
          this.PatientFollowUp($event);
        }
        break;
      }
      default:
        break;
    }
  }

  private PatientFollowUp($event: GridEmitModel) {
    let selectedVisit = Object.create($event.Data);
    let todaysDate = moment().format('YYYY-MM-DD');
    let visitDate;
    if (selectedVisit && selectedVisit.VisitType === ENUM_VisitType.outpatient) {
      visitDate = moment($event.Data.VisitDate).format('YYYY-MM-DD');
      this.MaxLastVisitDays = this.MaxLastVisitDaysVisitTypeWise.outpatient;
    } else {
      visitDate = moment($event.Data.DischargeDate).format('YYYY-MM-DD');
      this.MaxLastVisitDays = this.MaxLastVisitDaysVisitTypeWise.inpatient;
    }
    if (moment().diff(moment(visitDate), 'days') > this.MaxLastVisitDays) {
      let goToPaidFollowup = window.confirm("Free followup days has passed. This will be a paid appointment.");
      if (goToPaidFollowup) {
        this.visitService.appointmentType = ENUM_AppointmentType.revisit; //"New";
        let selPat = selectedVisit.Patient;
        let pat = this._patientService.getGlobal();
        Object.keys(selPat).forEach(property => {
          if (property in pat) {
            pat[property] = selPat[property];
          }
        });
        pat.DateOfBirth = moment(pat.DateOfBirth).format('YYYY-MM-DD');
        this.router.navigate(["/Appointment/Visit"]);
      }
    }
    else {
      //only today's or past visit can be followed up, future visit cannot be followed up.
      //we can improve followup logic by allowing followup for only those visits that has visit status as final.
      //all visits has status as inititated for now so using this logic.
      if ((moment(visitDate).diff(todaysDate)) < 0) {
        //those visits that are already transfered or followed up(incase provider is not changed) cannot be continued.
        //only the leaf visit can be transfered or followd up
        // this.selectedIndex = $event.RowIndex;
        this.SelectedVisit = $event.Data;

        //start: sud: 20June'19--decide whether to go for paid followup or free.//this may not be needed.
        let isPaidFollowupEnabled = false;
        let paidFollUpParam = this.coreService.Parameters.find(p => p.ParameterGroupName === "Appointment" && p.ParameterName === "EnablePaidFollowup");
        if (paidFollUpParam) {
          isPaidFollowupEnabled = paidFollUpParam.ParameterValue == "true" ? true : false;
        }
        this.ShowFollowupPage = false;
        this._changeDetector.detectChanges();
        this.ShowFollowupPage = true;

        //end: sud: 20June'19--decide whether to go for paid followup or free.
      }
      else {
        this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ["Only past visit can be followed up."]);
      }

    }
  }

  private ReferPatient($event: GridEmitModel) {
    let selectedVisit = Object.create($event.Data);
    let todaysdate = moment().format('YYYY-MM-DD');
    let visitdate = moment($event.Data.VisitDate).format('YYYY-MM-DD');

    if ((moment(visitdate).diff(todaysdate)) <= 0) {

      this.SelectedVisit = selectedVisit;
      this.visitService.appointmentType = ENUM_AppointmentType.referral; //"Referral";
      this.visitService.ParentVisitInfo = selectedVisit;
      this.AssignPatientToGlobal($event.Data);

      //start: sud: 3June'19--Decide whether to go for paid-referral or free-referral.
      let isRefChargeApplicable = false;
      let refChargeParam = this.coreService.Parameters.find(p => p.ParameterGroupName === "Billing" && p.ParameterName === "ReferralChargeApplicable");
      if (refChargeParam) {
        isRefChargeApplicable = JSON.parse(refChargeParam.ParameterValue);
      }

      if (isRefChargeApplicable) {
        if (this.visitService.appointmentType == ENUM_AppointmentType.referral || this.SelectedVisit.ApiIntegrationName === ENUM_Scheme_ApiIntegrationNames.SSF || this.SelectedVisit.ApiIntegrationName === ENUM_Scheme_ApiIntegrationNames.NGHIS) {
          this.ShowReferralPopup = true;
        } else {
          this.router.navigate(['/Appointment/Visit']);
        }
      }
      else {
        this.ShowReferralPopup = true;
      }
      //end: sud: 3June'19--Decide whether to go for paid-referral or free-referral.
    }
    else {
      this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ["Only past or today's visit can be referred to another doctor."]);
    }
  }

  AssignPatientToGlobal(_patient) {
    let patient = this._patientService.CreateNewGlobal();
    Object.keys(_patient).forEach(property => {
      if (property in patient) {
        patient[property] = _patient[property];
      }
    });

    patient.IDCardNumber = _patient.IDCardNumber;
    patient.DependentId = _patient.DependentId;
    const age = CommonFunctions.GetFormattedAge(_patient.DateOfBirth);
    patient.Age = age ? age.replace(/\s/g, "") : null;
    patient.PhoneNumber = _patient.PhoneNumber;
    patient.Rank = _patient.Rank;
    patient.Posting = _patient.Posting;
    patient.SSFPolicyNo = _patient.PolicyNo;
    patient.PolicyNo = _patient.PolicyNo;
    patient.LatestVisitId = _patient.PatientVisitId
    patient.PriceCategoryId = _patient.PriceCategoryId;
    patient.SchemeId = _patient.SchemeId;
    patient.CareTaker.CareTakerName = _patient.CareTakerName;
    patient.CareTaker.CareTakerContact = _patient.CareTakerContact;
    patient.CareTaker.RelationWithPatient = _patient.RelationWithCareTaker;

  }

  FreeReferralPopupOnClose($event) {
    if ($event.action == "free-referral") {
      //unshift adds to the top of the array.
      let newRefVis = $event.data;
      let parentVisId = newRefVis.ParentVisitId;
      let parVisObj = this.OutPatientVisitList.find(v => v.PatientVisitId == parentVisId);
      if (parVisObj) {
        //  parVisObj.IsVisitContinued = true;
      }

      this.OutPatientVisitList.unshift($event.data);
      //returns fresh copy of the array, inorder to notify angular some change is made in the array.
      this.OutPatientVisitList = this.OutPatientVisitList.slice();
      this.GetPatientVisitList(this.SelectedPatient.PatientId);
      this._changeDetector.detectChanges();
    }

    this.ShowReferralPopup = false;

  }

  FollowupPopupOnClose($event) {
    this.ShowFollowupPage = false;
    if ($event.action == "free-followup") {
      //unshift adds to the top of the array.
      let newFolVisit = $event.data;
      let parentVisId = newFolVisit.ParentVisitId;
      let parVisObj = this.OutPatientVisitList.find(v => v.PatientVisitId == parentVisId); //Need to look into Ip Visit list as well;
      if (parVisObj) {
        //parVisObj.IsVisitContinued = true;
      }

      this.ShowOpdSticker = false;
      this._changeDetector.detectChanges();
      this.SelectedVisit = this.visitService.CreateNewGlobal();
      this.SelectedVisit.PatientVisitId = newFolVisit.PatientVisitId;
      this.SelectedVisit.QueueNo = newFolVisit.QueueNo;
      this.SelectedVisit.PatientId = newFolVisit.PatientId;

      this.GetPatientVisitList(newFolVisit.PatientId);
      //! Need to make sure whether to show Invoice for free follow up
      /*   if (newFolVisit.BillingTransaction) {
          this.bil_InvoiceNo = newFolVisit.BillingTransaction.InvoiceNo;
          this.bil_FiscalYrId = newFolVisit.BillingTransaction.FiscalYearId;
          this.bil_BilTxnId = newFolVisit.BillingTransaction.BillingTransactionId;
        }
        this.ShowOpdSticker = true;
        const visit = this.mapVisitData($event.data);
        this.OutPatientVisitList.unshift(visit);
        //returns fresh copy of the array, inorder to notify angular some change is made in the array.
        this.visits = this.visits.slice();
        this.changeDetector.detectChanges(); */
    }
  }

  Close_OPD_Sticker_Popup() {
    this.ShowOpdSticker = false;
  }

  NewPatientAppointment() {

    //sud:6Sept'21--Pls don't remove below (appointmenttype)--it causes issue during referral...
    this.visitService.appointmentType = "New";
    this.router.navigate(["/Appointment/Visit"]);
  }

  //this function is hotkeys when pressed by user
  hotkeys(event) {
    if (event.altKey) {
      event.preventDefault();
      switch (event.keyCode) {
        case 78: {// => ALT+N comes here
          this.NewPatientAppointment();
          break;
        }
        case 67: {// => ALT+C
          this.CheckIn();
          break;
        }
        case 70: {// => ALT+F
          this.FocusOnElementById('id_patient_filter_by_option');
          break;
        }
        case 77: {// => ALT+M
          this.DoManualFollowUp();
          break;
        }
        case 83: {// => ALT+S
          this.FocusOnElementById('id_search_patient');
          break;
        }
        default:
          break;
      }
    }
    if (event.keyCode === 27) {
      this.CloseOpdStickerPopUp();
    }
  }

  //

  PatientListFormatter(data: any): string {
    let html: string = "";
    html = "<font size=03>" + "[" + data["PatientCode"] + "]" + "</font>&nbsp;-&nbsp;&nbsp;<font color='blue'; size=03 ><b>" + data["ShortName"] +
      "</b></font>&nbsp;&nbsp;" + "(" + data["Age"] + '/' + data["Gender"] + ")" + "(" + data["PhoneNumber"] + ")" + '' + "</b></font>";
    return html;
  }

  public AllPatientSearchAsync = (keyword: any): Observable<any[]> => {
    return this._billingBlService.GetPatientsWithVisitsInfo(keyword);
  }

  GetPatientSearchMinCharacterCountParameter(): void {
    let param = this.coreService.Parameters.find(a => a.ParameterGroupName === 'Common' && a.ParameterName === 'PatientSearchMinCharacterCount');
    if (param) {
      let obj = JSON.parse(param.ParameterValue);
      this.PatientSearchMinCharacterCount = parseInt(obj.MinCharacterCount);
    }
  }

  PatientInfoChanged() {
    //It should make an API call that will bring all its recent visits
    //After all the recent visits are listed, Allow user to do either to check-in or create follow up visit (either it be free/paid)

    if (this.PatientObj && typeof (this.PatientObj) === "object") {
      this.ShowPatientPanel = false;
      this.DisplayOutpatientVisits = false;
      this.DisplayInpatientVisits = false;
      this._changeDetector.detectChanges();
      this.SelectedPatient = this.PatientObj;
      const patientId: number = this.PatientObj.PatientId;
      this.GetPatientVisitList(patientId);
      this.ShowPatientPanel = true;
      this.DisplayOutpatientVisits = true;
    }

  }

  private GetPatientVisitList(patientId: number) {
    this.visitBlService.GetPatientVisitsDetails(patientId).subscribe((res: DanpheHTTPResponse) => {
      if (res && res.Status === ENUM_DanpheHTTPResponses.OK) {
        const patientVisitList = res.Results;
        this.SelectedPatientVisits = patientVisitList;
        if (patientVisitList && patientVisitList.length) {
          this.OutPatientVisitList = patientVisitList.filter(v => v.VisitType === ENUM_VisitType.outpatient || v.VisitType === ENUM_VisitType.emergency || v.VisitType === ENUM_VisitType.outdoor);
          this.InPatientVisitList = patientVisitList.filter(v => v.VisitType === ENUM_VisitType.inpatient);
          (this.InPatientVisitList && this.InPatientVisitList.length) && this.InPatientVisitList.map(p => p.MaxAllowedFollowUpDays = this.MaxLastVisitDaysVisitTypeWise.inpatient);
          // (this.OutPatientVisitList && this.OutPatientVisitList.length) && this.OutPatientVisitList.map(p => p.MaxAllowedFollowUpDays = this.MaxLastVisitDaysVisitTypeWise.outpatient);

          if (this.OutPatientVisitList && this.OutPatientVisitList.length) {
            this.OutPatientVisitList.forEach(visit => {
              visit.MaxAllowedFollowUpDays = this.MaxLastVisitDaysVisitTypeWise.outpatient;
              visit.MaxAllowedReferralDays = this.MaxInternalReferralDays;
            });
          }
          this._changeDetector.detectChanges();
        }
      } else {
      }
    }, err => {
      console.error(err);
    });
  }

  SelectFollowUpOption(option: FollowupOption) {
    if (this.SelectedPatient && this.SelectedPatient.PatientId) {
      if (this.SelectedPatient.IsAdmitted) {
        this.showInpatientMessage = true;
      } else {
        if (option && option.id) {
          const selectedFollowupOption = this.FollowUpOptions.find(o => o.id === option.id);
          if (selectedFollowupOption) {
            this.SelectedFollowupOption = selectedFollowupOption;
            this.DisplayFollowupPopup = true;
            this.IsFreeFollowupOptionSelected = (selectedFollowupOption.code === "free");

          }
        }
      }
    }
  }

  SelectVisitTypeTab(tab: { id: number, value: string }, index: number) {
    if (tab && tab.id) {
      this.ActiveTab = index;
      const tabSelected = this.VisitTypeOptions.find(t => t.id === tab.id);
      if (tabSelected) {
        this.DisplayOutpatientVisits = tabSelected.displayOutpatient;
        this.DisplayInpatientVisits = tabSelected.displayInPatient;
      }
    }
  }

  CheckIn() {
    if (this.SelectedPatient && this.SelectedPatient.PatientId) {
      if (this.SelectedPatient.IsAdmitted) {
        this.showInpatientMessage = true;
      } else {
        if (this.IsAPFIntegrationEnabled) {
          this.getIdCardNumber(this.SelectedPatient);

        }
        this.SelectPatient(null, this.SelectedPatient)
      }
    }
  }

  DoManualFollowUp() {
    if (this.ManualFollowupBtn) {
      this.ManualFollowupBtn.nativeElement.click();
    }
  }
  CloseManualFollowup($event) {
    this.DisplayFollowupPopup = false;
    this.SelectedFollowupOption = null;
    if ($event && $event.success) {
      this.GetPatientVisitList(this.SelectedPatient.PatientId);
    }
  }

  /**
   * @summary This method is responsible to identify which option is selected to filter patients.
   * @param $event Is the event generated by html Select element to identify which option is selected.
   */
  SelectFilterOption($event): void {
    if ($event) {
      const selectedOption = $event.target.value;
      this.SelectedSearchOption = selectedOption;
      this.SearchPatientByFilterOptionPlaceholder = `Search Patient By ${this.SelectedSearchOption}`;
      this.FocusOnElementById('id_search_by_filter_options');
    }
  }

  public SearchPatientByFilterOption = (keyword: any): Observable<any[]> => {
    if (this.SelectedSearchOption) {
      return this.visitBlService.GetPatientVisitsBySearchFilterOption(this.SelectedSearchOption, keyword);
    } else {
      return this.visitBlService.GetPatientVisitsBySearchFilterOption(this.SelectedSearchOption, keyword);
    }
  }
  SearchFilterPatientInfoChanged() {
    if (this.PatientObjForSearchFilterOption && typeof (this.PatientObjForSearchFilterOption) === "object") {
      this.ShowPatientPanel = false;
      this.DisplayOutpatientVisits = false;
      this.DisplayInpatientVisits = false;
      this._changeDetector.detectChanges();
      this.SelectedPatient = this.PatientObjForSearchFilterOption;
      const patientId: number = this.PatientObjForSearchFilterOption.PatientId;
      this.GetPatientVisitList(patientId);
      this.ShowPatientPanel = true;
      this.DisplayOutpatientVisits = true;
    }
  }

  CloseOpdStickerPopUp() {
    this.DisplayFollowupPopup = false;
    this.ShowOpdSticker = false;
  }
}
