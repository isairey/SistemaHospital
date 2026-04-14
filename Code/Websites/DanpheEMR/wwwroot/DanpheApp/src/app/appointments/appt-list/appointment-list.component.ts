import { Component } from '@angular/core';
import { Router } from '@angular/router';
import * as moment from 'moment/moment';
import { Patient } from '../../patients/shared/patient.model';
import { PatientService } from '../../patients/shared/patient.service';
import { DanpheHTTPResponse } from "../../shared/common-models";
import GridColumnSettings from '../../shared/danphe-grid/grid-column-settings.constant';
import { GridEmitModel } from "../../shared/danphe-grid/grid-emit.model";
import { NepaliDateInGridColumnDetail, NepaliDateInGridParams } from '../../shared/danphe-grid/NepaliColGridSettingsModel';
import { MessageboxService } from '../../shared/messagebox/messagebox.service';
import { RouteFromService } from '../../shared/routefrom.service';
import { ENUM_APP_RouteFrom, ENUM_DanpheHTTPResponseText } from '../../shared/shared-enums';
import { AppointmentBLService } from '../shared/appointment.bl.service';
import { Appointment } from '../shared/appointment.model';
import { AppointmentService } from '../shared/appointment.service';
import { VisitBLService } from "../shared/visit.bl.service";
import { VisitService } from '../shared/visit.service';
@Component({
  templateUrl: "./list-appointment.html"
})
export class AppointmentListComponent {
  appointments: Array<Appointment> = new Array<Appointment>();
  beforeDateFormat: Array<Appointment> = new Array<Appointment>();
  afterDateFormat: Array<Appointment> = new Array<Appointment>();
  searchAppointment: Appointment = new Appointment();
  public defaultDoctor = {
    PerformerName: "All Doctors",
    PerformerId: 0
  };
  public selDoctor: any = this.defaultDoctor;
  appointmentGridColumns: Array<any> = null;
  selectedDoctor: Array<any> = new Array<any>();
  NepaliDateInGridSettings: NepaliDateInGridParams = new NepaliDateInGridParams();

  selectedAppointment: Appointment = new Appointment();
  public showReason: boolean = false;
  public fromDate: string = '';
  public performerId: number = 0;
  public toDate: string = '';
  public showDetails: boolean = false;
  public editAppoint: boolean = false;
  reason: string = null;
  public visitType: string = "";
  public showSummary: boolean = false;
  public summary = {
    NewPatient: 0,
    FollowUpPatient: 0,
    Revisit: 0
  };
  ShowInpatientMessage: boolean = false;
  constructor(
    private _appointmentBLService: AppointmentBLService,
    private _appointmentService: AppointmentService,
    private _visitBLService: VisitBLService,
    private _visitService: VisitService,
    private _msgBoxServ: MessageboxService,
    private _routeFromService: RouteFromService,
    private _router: Router,
    private _patientService: PatientService
  ) {
    //needs to clear previously selected appointment
    this.fromDate = moment().format('YYYY-MM-DD');
    this.toDate = moment().format('YYYY-MM-DD');
    this._appointmentService.CreateNewGlobal();
    this.LoadAppointmentList();
    this.getDocts();
    this.appointmentGridColumns = GridColumnSettings.AppointmentSearch;
    this.NepaliDateInGridSettings.NepaliDateColumnList.push(
      new NepaliDateInGridColumnDetail("AppointmentDate", false)
    );
  }
  ngAfterViewInit() {
    document.getElementById('quickFilterInput').focus();
  }

  //loads all the list of appointment
  LoadAppointmentList(): void {
    this._appointmentBLService.LoadAppointmentList(this.fromDate, this.toDate, this.performerId)
      .subscribe(res => {
        if (res.Status == "OK") {
          this.appointments = res.Results;
          this.calculateSummary(this.appointments);
          this.beforeDateFormat = new Array<Appointment>();
          this.appointments.forEach(a => { this.beforeDateFormat.push(Object.assign({}, a)) });//deep copy
          for (var i = 0; i < this.beforeDateFormat.length; i++) {
            let appdate;
            let date: string = this.beforeDateFormat[i].AppointmentDate;
            appdate = moment(date).format('YYYY-MM-DD');
            this.beforeDateFormat[i].AppointmentDate = appdate;
            let HHmmss = this.beforeDateFormat[i].AppointmentTime.split(':');
            let appTimeHHmm = "";
            if (HHmmss.length > 1) {
              //add hours and then minute to 00:00 and then format to 12hrs hh:mm AM/PM format. 
              //using 00:00:00 time so that time part won't have any impact after adding.
              appTimeHHmm = moment("2017-01-01 00:00:00").add(HHmmss[0], 'hours').add(HHmmss[1], 'minutes').format('hh:mm A');
              this.beforeDateFormat[i].AppointmentTime = appTimeHHmm;
            }
          }
          this.filterByVisitType();
          this.afterDateFormat = this.beforeDateFormat;
          this.showSummary = true;
        }
        else {
          this._msgBoxServ.showMessage("failed", [res.ErrorMessage])
          //alert("Failed ! " + res.ErrorMessage);
        }
      });
  }

  Close() {
    this.showReason = false;
    this.showDetails = false;
    this.reason = null;
  }
  //gridPrintOptions
  gridExportOptions = {
    fileName: 'AppointmentList_' + moment().format('YYYY-MM-DD') + '.xls',
  };


  DocListFormatter(data: any): string {
    let html = data["PerformerName"];
    return html;
  }

  AddReason() {
    if (this.reason != null && this.reason != '') {
      this.selectedAppointment.CancelledRemarks = this.reason;

      var val = window.confirm("You're about to cancel an appointment, are you sure ?");
      //if user clicks on OK  then a will be true. else it'll be false. 
      if (val) {
        var AppointmentTime;
        this.selectedAppointment.AppointmentStatus = "cancelled";
        this.selectedAppointment.AppointmentTime = this.appointments.find(a => a.AppointmentId === this.selectedAppointment.AppointmentId).AppointmentTime;
        this._appointmentBLService.UpdateAppointmentStatus(this.selectedAppointment)
          .subscribe(res => {
            if (res.Status == "OK") {
              this.showReason = false;
              this.LoadAppointmentList();
              this._msgBoxServ.showMessage("notification", ['You have cancelled an appointment']);
            }
            else {
              this._msgBoxServ.showMessage("failed", [res.ErrorMessage]);

            }
          });
      }
      else {
        this.showReason = false;
      }
    } else {
      this._msgBoxServ.showMessage("failed", ['Please write reason to cancel']);
    }
  }


  getDocts() {
    this._visitBLService.GetVisitDoctors()
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status == "OK") {
          this._visitService.ApptApplicableDoctorsList = res.Results;
          // var defaultProvider = new Object({ PerformerId: 0, PerformerName: 'All Doctors' });
          var withoutProvider = new Object({ PerformerId: -1, PerformerName: 'No Doctor' });
          this.selectedDoctor = res.Results;
          this.selectedDoctor.splice(0, 0, withoutProvider);
          this.selectedDoctor.unshift(this.defaultDoctor);
          // this.selectedDoctor.splice(0, 0, defaultProvider);
        }
      });
  }

  public AssignSelectedDoctor() {
    try {
      this.performerId = this.selDoctor.PerformerId;
    } catch (ex) {
      this.ShowCatchErrMessage(ex);
    }
  }

  ShowCatchErrMessage(ex: any) {
    throw new Error("Error in loading Doctor list.");
  }

  providerChanged() {
    this.performerId = this.selDoctor ? this.selDoctor.PerformerId : 0;
  }

  AppointmentGridActions($event: GridEmitModel) {
    switch ($event.Action) {
      //checkin is 'add visit'--for reference
      case "checkin":
        {
          let selAppt = $event.Data;
          let pat = this._patientService.CreateNewGlobal();
          let aptPat = this._appointmentService.CreateNewGlobal();
          this._routeFromService.RouteFrom = ENUM_APP_RouteFrom.Appointment.toLowerCase();
          if (selAppt.PatientId) {
            pat.Appointment = $event.Data;
            this._appointmentBLService.GetPatientById(selAppt.PatientId)
              .subscribe(res => {
                if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
                  let retPatient: Patient = res.Results;
                  if (retPatient.IsAdmitted) {
                    this.ShowInpatientMessage = true;
                    return;
                  }
                  else {
                    pat.PatientId = retPatient.PatientId;
                    pat.PatientCode = retPatient.PatientCode;
                    pat.FirstName = retPatient.FirstName;
                    pat.LastName = retPatient.LastName;
                    pat.MiddleName = retPatient.MiddleName;
                    pat.DateOfBirth = moment(retPatient.DateOfBirth).format('YYYY-MM-DD');
                    pat.CountrySubDivisionId = retPatient.CountrySubDivisionId;
                    pat.CountrySubDivisionName = retPatient.CountrySubDivisionName;
                    pat.Gender = retPatient.Gender;
                    pat.Age = retPatient.Age;
                    pat.Email = retPatient.Email;
                    pat.PhoneNumber = retPatient.PhoneNumber;
                    pat.ShortName = retPatient.ShortName;
                    pat.Salutation = retPatient.Salutation;
                    pat.CountryId = retPatient.CountryId;
                    pat.IsDobVerified = retPatient.IsDobVerified;
                    pat.WardNumber = retPatient.WardNumber;
                    //pat.MembershipTypeId = retPatient.MembershipTypeId;
                    pat.Address = retPatient.Address;

                    aptPat.AppointmentId = $event.Data.AppointmentId;
                    aptPat.PatientId = $event.Data.PatientId ? $event.Data.PatientId : 0;
                    aptPat.FirstName = $event.Data.FirstName;
                    aptPat.LastName = $event.Data.LastName;
                    aptPat.Gender = $event.Data.Gender;
                    aptPat.Age = $event.Data.Age;
                    aptPat.ContactNumber = $event.Data.ContactNumber;
                    aptPat.AppointmentDate = $event.Data.AppointmentDate;
                    aptPat.AppointmentTime = $event.Data.AppointmentTime;
                    aptPat.PerformerId = $event.Data.PerformerId;
                    aptPat.PerformerName = $event.Data.PerformerName;
                    aptPat.AppointmentStatus = $event.Data.AppointmentStatus;
                    aptPat.AppointmentType = $event.Data.AppointmentType;
                    aptPat.Reason = $event.Data.Reason;
                    aptPat.DepartmentId = $event.Data.DepartmentId;
                    pat.EthnicGroup = retPatient.EthnicGroup;
                    pat.MaritalStatus = retPatient.MaritalStatus;
                  }
                }
                this._router.navigate(['/Appointment/Visit']);
              }
                ,
                err => {
                  this._msgBoxServ.showMessage("error", ["failed to get selected patient"]);
                  //alert('failed to get selected patient');

                });
          }
          else {
            pat.FirstName = selAppt.FirstName;
            pat.LastName = selAppt.LastName;
            pat.MiddleName = selAppt.MiddleName;
            pat.Gender = selAppt.Gender;
            pat.Age = selAppt.Age;
            pat.PhoneNumber = selAppt.ContactNumber;
            console.log(pat);

            aptPat.AppointmentId = selAppt.AppointmentId;
            aptPat.PatientId = selAppt.PatientId ? $event.Data.PatientId : 0;
            aptPat.FirstName = selAppt.FirstName;
            aptPat.LastName = selAppt.LastName;
            aptPat.Gender = selAppt.Gender;
            aptPat.Age = selAppt.Age;
            aptPat.ContactNumber = selAppt.ContactNumber;
            aptPat.AppointmentDate = selAppt.AppointmentDate;
            aptPat.AppointmentTime = selAppt.AppointmentTime;
            aptPat.PerformerId = selAppt.PerformerId;
            aptPat.PerformerName = selAppt.PerformerName;
            aptPat.DepartmentId = selAppt.DepartmentId;


            this._router.navigate(['/Appointment/Visit']);

          }




          //assign appointment props to appt service


          //this.appointmentBLService.InitiateVisit($event.Data, '/Appointment/Visit');

        }
        break;

      //case "admit":
      //    {
      //        this.appointmentBLService.InitiateVisit($event.Data, '/Appointment/CreateAdmission');
      //    }
      //    break;

      case "cancel":
        {
          this.selectedAppointment = $event.Data;
          this.reason = null;
          this.showReason = true;
        }
        break;
      case "details":
        {
          this.selectedAppointment = $event.Data;
          //   this.reason = null;
          //  this.showDetails = true;
        }
        break;

      case "edit":
        {
          this.selectedAppointment = $event.Data;
          this.selectedAppointment.AppointmentTime = this.appointments.find(a => a.AppointmentId === this.selectedAppointment.AppointmentId).AppointmentTime;
          this._appointmentService.globalAppointment = this.selectedAppointment;
          this._routeFromService.RouteFrom = ENUM_APP_RouteFrom.AppointmentList;
          this._router.navigate(['/Appointment/CreateAppointment']);
        }
        break;

      default:
        break;
    }
  }

  calculateSummary(data: any) {
    let originalData = Object.assign(data);
    this.summary.NewPatient = originalData.filter(a => a.AppointmentType.toLowerCase() == 'new').length;
    this.summary.FollowUpPatient = originalData.filter(a => a.AppointmentType.toLowerCase() == 'followup').length;
    this.summary.Revisit = originalData.filter(a => a.AppointmentType.toLowerCase() == 'revisit').length;
  }

  filterByVisitType() {
    this.afterDateFormat = this.beforeDateFormat.filter(a => a.AppointmentType.toLocaleLowerCase() == this.visitType.toLocaleLowerCase());
    if (this.visitType == "")
      this.afterDateFormat = this.beforeDateFormat;
  }
  OnFromToDateChange($event) {
    this.fromDate = $event.fromDate;
    this.toDate = $event.toDate;
  }
}
