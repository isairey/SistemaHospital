import { Component } from '@angular/core';
import * as moment from 'moment';
import { CoreService } from '../../../core/shared/core.service';
import { LoginToTelemed } from '../../../labs/shared/labMasterData.model';
import GridColumnSettings from '../../../shared/danphe-grid/grid-column-settings.constant';
import { NepaliDateInGridColumnDetail, NepaliDateInGridParams } from '../../../shared/danphe-grid/NepaliColGridSettingsModel';
import { MessageboxService } from '../../../shared/messagebox/messagebox.service';
import { ENUM_DateTimeFormat, ENUM_MessageBox_Status } from '../../../shared/shared-enums';
import { AppointmentBLService } from '../../shared/appointment.bl.service';
import { OnlineAppointmentDetail_DTO } from '../shared/DTOs/online-appointment-detail.dto';
@Component({
  templateUrl: "./online-appt-completed.html"
})
export class OnlineAppointmentCompletedListComponent {
  public onlineAppointmentList: Array<OnlineAppointmentDetail_DTO> = new Array<OnlineAppointmentDetail_DTO>();
  public teleMedicineConfiguration: any;
  public Login = new LoginToTelemed();
  public isTeleMedicineEnabled: boolean = false;
  public onlineAppointmentListFiltered: Array<OnlineAppointmentDetail_DTO> = new Array<OnlineAppointmentDetail_DTO>();
  public onlineAppointmentGridColumns: any;
  public NepaliDateInGridSettings: NepaliDateInGridParams = new NepaliDateInGridParams();
  public fromDate: any;
  public toDate: any;
  public loading: boolean = false;
  public initialLoad: boolean = true;
  constructor(public appointmentBLService: AppointmentBLService,
    public msgBoxService: MessageboxService, public coreService: CoreService) {
    this.getParameter();
    this.onlineAppointmentGridColumns = GridColumnSettings.OnlineAppointmentList;
    this.NepaliDateInGridSettings.NepaliDateColumnList.push(new NepaliDateInGridColumnDetail("VisitDate", false));
  }

  ngOnInit() {

  }

  OnFromToDateChange($event) {
    this.fromDate = $event.fromDate;
    this.toDate = $event.toDate;
  }

  getParameter() {
    let TeleMedicineConfig = this.coreService.Parameters.find(p => p.ParameterGroupName === "TeleMedicine" && p.ParameterName === "DanpheConfigurationForTeleMedicine").ParameterValue;
    this.teleMedicineConfiguration = JSON.parse(TeleMedicineConfig);
  }

  gridExportOptions = {
    fileName:
      "OnlineAppointmentCompletedList" + moment().format(ENUM_DateTimeFormat.Year_Month_Day) + ".xls",
  };

  getOnlineAppointmentData() {
    this.initialLoad = false;
    this.onlineAppointmentList = [];
    this.onlineAppointmentListFiltered = [];
    this.appointmentBLService.getOnlineAppointmentData<OnlineAppointmentDetail_DTO[]>(this.teleMedicineConfiguration.TeleMedicineBaseUrl, this.fromDate, this.toDate).subscribe(res => {
      if (res.IsSuccess) {
        this.onlineAppointmentList = res.Results;
        this.onlineAppointmentList = this.onlineAppointmentList.filter(a => a.IsActive);
        this.filterData();
      }
      else {
        this.onlineAppointmentList = [];
        this.onlineAppointmentListFiltered = [];
      }
    },
      err => {
        this.msgBoxService.showMessage(ENUM_MessageBox_Status.Error, ["Unable to fetch online appointment data."]);
      },
      () => {
        this.loading = false;
      });
  }

  filterData() {
    if (this.onlineAppointmentList && this.onlineAppointmentList.length > 0) {
      this.onlineAppointmentListFiltered = this.onlineAppointmentList.filter(a => a.Status !== "initiated");
    }
  }
}
