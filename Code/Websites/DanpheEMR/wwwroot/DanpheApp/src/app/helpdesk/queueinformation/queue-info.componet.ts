import { Component } from "@angular/core";
import * as moment from "moment";
import { CoreService } from "../../core/shared/core.service";
import { MessageboxService } from "../../shared/messagebox/messagebox.service";
import { ENUM_MessageBox_Status } from "../../shared/shared-enums";
import { HelpDeskBLService } from "../shared/helpdesk.bl.service";


@Component({
  templateUrl: "./queue-info.component.html",
  styleUrls: ['./css/queue-info.component.css']
  // './scss/_footer.scss', './scss/_header.scss', './scss/_mixin.scss', './scss/_queuelist.scss', './scss/_variables.scss', './scss/style.scss'
})

export class HlpDskQueueInfoComponent {
  public queueLevel: string = '';
  public department: any;
  public doctor: { DoctorId: 0, EmployeeId: 0, FullName: '', DepartmentName: '', DepartmentId: 0 };
  public visitGridColumns: any;
  public visits: Array<any> = [];
  public selectedDepartmentId: number = 0;
  public selectedDoctorId: number = 0;
  public DepartmentList: any;
  public DoctorList: any;
  public intervalId: any;
  public labelContainer: any;
  public refreshInterval: any;
  public noticeText: any;
  public selectedDoctorIds: number[] = [];
  SelectedDoctors: any;
  SelectedDepartment: any;
  public SelectedDoctorDetails: { DoctorName: string; DepartmentName: string; }[] = [];

  queuePatientList: any[];
  public earliestPatient;
  nextUpcomingPatient: any;
  public upcomingPatients;
  doctorsWithPatients: any[];
  currentYear: string = '';
  constructor(public coreService: CoreService, public helpdeskBlService: HelpDeskBLService,
    public msgBoxService: MessageboxService) {
    this.currentYear = moment().format("YYYY");
    this.getParamter();
    this.getDoctorList();
    this.getDepartmentList();
  }
  ngOnInit() {
    if (this.queueLevel == "department") {
      this.getDepartmentList();
    }
    else if (this.queueLevel == "doctor") {
      this.getDoctorList();

    }
    else if (this.queueLevel == "hospital") {
      var notice = this.coreService.Parameters.find(a => a.ParameterGroupName == "Helpdesk" && a.ParameterName == "HospitalNotice").ParameterValue;
      if (notice) {
        this.noticeText = JSON.parse(notice);
      }

      this.getAppointmentData();
      this.intervalId = setInterval(() => {
        this.getAppointmentData();
      }, this.refreshInterval);
    }
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  getParamter() {
    let parameterData = this.coreService.Parameters.find(p => p.ParameterGroupName == "Appointment" && p.ParameterName == "QueueLevel").ParameterValue;
    this.queueLevel = parameterData;
    let refreshTime = this.coreService.Parameters.find(p => p.ParameterGroupName == "QueueManagement" && p.ParameterName == "QueueRefreshInterval").ParameterValue;
    this.refreshInterval = refreshTime;
    let labelData = this.coreService.Parameters.find(p => p.ParameterGroupName == "Helpdesk" && p.ParameterName == "OPDQueueDisplaySettings").ParameterValue;
    if (labelData) {
      this.labelContainer = JSON.parse(labelData);
    }
  }
  getDepartmentList() {
    this.helpdeskBlService.GetAllApptDepartment().subscribe(res => {
      if (res.Status == "OK") {
        this.DepartmentList = res.Results;
      }
    });
  }

  getDoctorList() {
    this.helpdeskBlService.GetAllAppointmentApplicableDoctor().subscribe(res => {
      if (res.Status == "OK") {
        this.DoctorList = res.Results;
      }
    });
  }
  proceed() {
    if (this.selectedDoctorIds && this.selectedDoctorIds.length > 0) {
      this.getAppointmentData();
    } else {
      this.msgBoxService.showMessage(ENUM_MessageBox_Status.Warning, ['Please select atleast one Doctor to proceed']);
    }
  }
  getAppointmentData() {
    this.helpdeskBlService.GetAppointmentData(this.selectedDepartmentId, this.selectedDoctorIds, true).subscribe(res => {
      if (res.Status == "OK") {
        this.visits = res.Results;
        this.PatientQueueDetails(this.selectedDoctorIds);
      }
    },
      err => { }
    );
  }
  DepartmentListFormatter(data) {
    let html = data["DepartmentName"];
    return html;
  }

  fiterByDepartment() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    let dept = this.department;
    if (dept && typeof (dept) == 'object') {
      this.selectedDepartmentId = dept.DepartmentId;
    }
    else {
      this.visits = [];
      this.selectedDepartmentId = 0;
      this.msgBoxService.showMessage("notice", ["Please select valid department from list."]);
      return 0;
    }
    this.getAppointmentData();
    this.intervalId = setInterval(() => {
      this.getAppointmentData();
    }, this.refreshInterval);
  }

  DoctorListFormatter(data) {
    let html = data["FullName"];
    return html;
  }

  fiterByDoctor() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    let doc = this.doctor;
    if (doc && typeof (doc) == 'object') {
      this.selectedDoctorId = doc.EmployeeId;
    }
    else {
      this.visits = [];
      this.selectedDoctorId = 0;
      this.msgBoxService.showMessage("notice", ["Please select valid doctor from list."]);
      return 0;
    }
    this.getAppointmentData();
    this.intervalId = setInterval(() => {
      this.getAppointmentData();
    }, this.refreshInterval);
  }
  multiFiterByDoctor(selDoctorsFromDropdown) {
    this.clearIntervalAndReset();

    if (selDoctorsFromDropdown && selDoctorsFromDropdown.length > 0) {
      this.updateDoctorDetails(selDoctorsFromDropdown);
      this.selectedDoctorIds = selDoctorsFromDropdown.map(doctor => doctor.EmployeeId);

      this.setIntervalForAppointmentData();
    } else {
      this.handleNoValidDoctorSelection();
    }
  }
  clearIntervalAndReset() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    this.visits = [];
    this.selectedDoctorIds = [];
    this.SelectedDoctorDetails = null;
  }
  updateDoctorDetails(selDoctorsFromDropdown) {
    this.SelectedDoctorDetails = selDoctorsFromDropdown.map(doc => {
      const departmentId = doc.DepartmentId;
      const department = this.DepartmentList.find(dep => dep.DepartmentId === departmentId);

      return {
        DoctorName: doc.FullName,
        DepartmentId: departmentId,
        DepartmentName: department ? department.DepartmentName : '',
      };
    });
  }
  setIntervalForAppointmentData() {
    this.intervalId = setInterval(() => {
      this.getAppointmentData();
    }, this.refreshInterval);
  }
  handleNoValidDoctorSelection() {
    this.clearIntervalAndReset();
    this.SelectedDoctorDetails = null;
    this.doctorsWithPatients = [];
    this.msgBoxService.showMessage("notice", ["Please select at least one valid doctor from the list."]);
  }
  public PatientQueueDetails(selectedDoctorIds) {
    this.doctorsWithPatients = [];
    this.SelectedDoctorDetails = [];

    if (!selectedDoctorIds || selectedDoctorIds.length === 0) {
      return;
    }

    selectedDoctorIds.forEach(doctorId => {
      const doctorWithPatients = {
        doctorId: doctorId,
        earliestPatient: null,
        nextUpcomingPatient: null,
        upcomingPatients: []
      };

      const doctorVisits = this.visits.filter(p => p.ProviderId === doctorId);

      if (doctorVisits.length > 0) {
        doctorWithPatients.earliestPatient = this.findEarliestPatient(doctorVisits);
        doctorWithPatients.nextUpcomingPatient = this.findNextPatient(doctorVisits);
        doctorWithPatients.upcomingPatients = this.findNextUpcomingPatients(doctorVisits, 3);

        this.doctorsWithPatients.push(doctorWithPatients);
      } else {
      }
    });
    const doctorsWithNoPatients = selectedDoctorIds.filter(doctorId => {
      const doctorVisits = this.visits.filter(p => p.ProviderId === doctorId);
      return doctorVisits.length === 0;
    });

    if (doctorsWithNoPatients.length > 0) {
      this.msgBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`Some Selected Doctor(s) have no patients.`]);
    }

    if (this.doctorsWithPatients.length > 0) {
      this.SelectedDoctorDetails = this.doctorsWithPatients.map(doctor => ({
        DoctorName: doctor.earliestPatient ? doctor.earliestPatient.FullName : doctor.nextUpcomingPatient.FullName,
        DepartmentName: doctor.earliestPatient ? doctor.earliestPatient.DepartmentName : doctor.nextUpcomingPatient.DepartmentName,
      }));
    }
  }

  public findEarliestPatient(visits) {
    if (visits && visits.length > 0) {
      visits.sort((a, b) => a.QueueNo - b.QueueNo);
      return visits[0];
    } else {
      return null;
    }
  }

  public findNextPatient(visits) {
    if (visits && visits.length > 1) {
      return visits[1];
    } else {
      return null;
    }
  }

  public findNextUpcomingPatients(visits, count): any[] {
    if (visits && visits.length > 1) {
      return visits.slice(2, + count);
    } else {
      return [];
    }
  }
}  
