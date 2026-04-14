import { DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import * as moment from 'moment';
import { CoreService } from '../../../core/shared/core.service';
import { DanpheHTTPResponse } from '../../../shared/common-models';
import { MessageboxService } from '../../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status, ENUM_OT_BookingStatus } from '../../../shared/shared-enums';
import { GetOTAnaesthesiaType_DTO } from '../../shared/dto/get-ot-anaesthesia-type.dto';
import { GetOTAnaesthesia_DTO } from '../../shared/dto/get-ot-anaesthesia.dto';
import { GetOTBookingDetails_DTO } from '../../shared/dto/get-ot-booking-details.dto';
import { GetOTMachine_DTO } from '../../shared/dto/get-ot-machine.dto';
import { GetOTPersonnel_DTO } from '../../shared/dto/get-ot-personnel.dto';
import { GetOTSurgery_DTO } from '../../shared/dto/get-ot-surgery.dto';
import { GetOTTeamInfo_DTO } from '../../shared/dto/get-ot-team-info.dto';
import { AnaesthesiaDetail_DTO } from '../../shared/dto/ot-anaesthesia-detail.dto';
import { OTConcludeBookingModel } from '../../shared/dto/ot-conclude-booking.model';
import { OTMachineDetail_DTO } from '../../shared/dto/ot-machine-detail.dto';
import { OTPrescriber_DTO } from '../../shared/dto/ot-prescriber-dto';
import { ImplantDetailModel } from '../../shared/ot-implant-detail.model';
import { OperationTheatreBLService } from '../../shared/ot.bl.service';
import { OTService } from '../../shared/ot.service';

@Component({
  selector: 'ot-conclude-booking',
  templateUrl: './ot-conclude-booking.component.html',
  styleUrls: ['./ot-conclude-booking.component.css'],
  host: { '(window:keyup)': 'hotkeys($event)' }
})

export class OTConcludeBookingComponent implements OnInit {

  @Input('ot-booking-id') OTBookingId: number = 0;
  // @Input('price-category-id') PriceCategoryId: number = 0;
  // @Input('machine-id') OTMachineId: number = 0;
  OTMachineName: string = "";
  // @Input('use-anaesthesia') UseAnaesthesia: boolean = false;
  // @Input('booked-for-date') BookedForDate: string = "";
  @Output() CallBackCloseConcludePage: EventEmitter<Object> = new EventEmitter<Object>();
  @Output() CallBackEditBookingFromConcludePage: EventEmitter<Object> = new EventEmitter<Object>();
  BookingDetails: {
    PatientName: string;
    PatientCode: string;
    AgeSex: string;
    PhoneNumber: string;
    SurgeryName: string;
    SurgeryType: string;
    BookedForDate: string;
    Prescriber: string;
    Priority: string;
    Status: string;
    Address: string;
    MunicipalityName: string;
    CountrySubDivisionName: string;
    CountryName: string;
    WardNumber: number;
  };
  ShowConcludePage: boolean = false;
  SelectedOTBooking = new GetOTBookingDetails_DTO();
  SurgeryList = new Array<GetOTSurgery_DTO>();
  FilteredSurgeryList = new Array<GetOTSurgery_DTO>();
  OTPrescriberList = new Array<OTPrescriber_DTO>();
  OTTeamInfo = new Array<GetOTTeamInfo_DTO>();
  PersonnelList = new Array<GetOTPersonnel_DTO>();
  SelectedPersonnelList = new Array<GetOTPersonnel_DTO>();
  SelectedAnaesthesiaList = new Array<GetOTAnaesthesia_DTO>();
  AnaesthesiaList = new Array<GetOTAnaesthesia_DTO>();
  AnaesthesiaDetailList = new Array<AnaesthesiaDetail_DTO>();
  AnaesthesiaTypeList = new Array<GetOTAnaesthesiaType_DTO>();
  OTMachineList = new Array<GetOTMachine_DTO>();
  SelectedImplantList = new Array<ImplantDetailModel>();
  SelectedMachineList = new Array<OTMachineDetail_DTO>();
  ConcludeBooking = new OTConcludeBookingModel();
  loading: boolean = false;
  confirmationTitle: string = "Confirm !";
  confirmationMessage: string = "Are you sure you want to Conclude Booking?";

  constructor(
    private _otBLService: OperationTheatreBLService,
    private _messageBoxService: MessageboxService,
    private _changeDetector: ChangeDetectorRef,
    public coreService: CoreService,
    private _datePipe: DatePipe,
    private _otService: OTService
  ) {
  }


  ngOnInit(): void {
    this.ConcludeBooking.OTStartTime = moment(this.SelectedOTBooking.BookedForDate).format('YYYY-MM-DD HH:mm A');
    this.InitializeConcludeBooking();
  }
  CloseConcludePage(): void {
    this.ShowConcludePage = false;
    this.CallBackCloseConcludePage.emit("close");
  }

  hotkeys(event): void {
    if (event.keyCode === 27) {
      this.CloseConcludePage();
    }
  }

  FocusOutFromDatePicker(event: any) {
    if (event) {
      // this.GoToDatePick = false;
      this.GoToNext('Diagnosis');   //to be changed
    }
  }

  GoToNext(idToSelect: string) {
    const nextElement = document.getElementById(idToSelect) as HTMLInputElement;
    if (nextElement) {
      nextElement.focus();
    }
  }

  HandleDateSelection(): void {
    const bookedForDate = new Date(this.SelectedOTBooking.BookedForDate);
    const currentDate = new Date(this.GetCurrentDate());
    // if (bookedForDate < currentDate) {
    //   this.BackDateError = true;
    // } else {
    //   this.BackDateError = false;
    // }
  }

  GetCurrentDate(): string {
    const currentDate = new Date();
    return this._datePipe.transform(currentDate, 'yyyy-MM-ddTHH:mm');
  }


  InitializeConcludeBooking(): void {
    (async () => {
      try {
        this.GetOTSurgeries();
        this.GetOTPrescriberList();
        this.GetPersonnel();
        this.GetAnaesthesiaTypes();
        this.GetOTMachines();
        await this.GetOTBookingDetailsByOTBookingId();
        await this.GetPersonnelDetailsByOTBookingId();
        this.AssignPersonnelForUpdate();
        await this.GetAnaesthesiasByPriceCategoryId();
        if (this.SelectedOTBooking.UseAnaesthesia) {
          this.AssignAnaesthesia();
        }
        if (this.SelectedOTBooking.OTMachineId) {
          let machine = this.OTMachineList.find(machine => machine.OTMachineId === this.SelectedOTBooking.OTMachineId);
          if (machine) {
            this.OTMachineName = machine.MachineName;
          }
        }
        await this.GetMachineDetailByOTBookingId();
        await this.GetImplantDetailByOTBookingId();
        this.ShowConcludePage = true;
      }
      catch (err) {
        this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Error: ${err.ErrorMessage}`]);
      }
    })();
  }

  GetOTMachines(): void {
    let otMachines = this._otService.getOTMachines();
    if (otMachines && otMachines.length) {
      this.OTMachineList = otMachines.filter(machine => machine.IsActive);
    }
  }

  async GetMachineDetailByOTBookingId(): Promise<void> {
    try {
      const res: DanpheHTTPResponse = await this._otBLService.GetMachineDetailByOTBookingId(this.SelectedOTBooking.OTBookingId).toPromise();
      if (res.Status === ENUM_DanpheHTTPResponses.OK) {
        if (res.Results && res.Results.length > 0) {
          const machineDetail = res.Results;
          if (machineDetail && machineDetail.length) {
            this.SelectedMachineList = machineDetail.filter(i => i.IsActive);
          }
        }
        else {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`Machine detail is empty.`]);
        }
      }
    }
    catch (err) {
      throw new Error(err);
    }
  }

  async GetImplantDetailByOTBookingId(): Promise<void> {
    try {
      const res: DanpheHTTPResponse = await this._otBLService.GetImplantDetailByOTBookingId(this.SelectedOTBooking.OTBookingId).toPromise();
      if (res.Status === ENUM_DanpheHTTPResponses.OK) {
        if (res.Results && res.Results.length > 0) {
          const implants = res.Results;
          if (implants && implants.length) {
            this.SelectedImplantList = implants.filter(i => i.IsActive);
          }
        }
        else {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`Implant detail is empty.`]);
        }
      }
    }
    catch (err) {
      throw new Error(err);
    }
  }


  GetAnaesthesiaTypes(): void {
    let anaesthesiaTypes = this._otService.getAnaesthesiaTypes();
    if (anaesthesiaTypes && anaesthesiaTypes.length) {
      this.AnaesthesiaTypeList = anaesthesiaTypes.filter(a => a.IsActive);
    }
  }

  async GetOTBookingDetailsByOTBookingId(): Promise<void> {
    try {
      const res: DanpheHTTPResponse = await this._otBLService.GetOTBookingDetailsByOTBookingId(this.OTBookingId).toPromise();
      if (res.Status === ENUM_DanpheHTTPResponses.OK && res.Results) {
        this.SelectedOTBooking = res.Results;
        this.AssignBookingDetails(this.SelectedOTBooking);
      }
      else {
        this.SelectedOTBooking = new GetOTBookingDetails_DTO();
        this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`Booking detail is empty.`]);
      }
    }
    catch (err) {
      throw new Error(err);
    }
  }

  AssignBookingDetails(otBooking: any): void {
    this.BookingDetails = {
      PatientName: otBooking.PatientName,
      PatientCode: otBooking.PatientCode,
      AgeSex: otBooking.AgeSex,
      PhoneNumber: otBooking.PhoneNumber,
      SurgeryName: this.AssignSurgeryName(otBooking.SurgeryId),
      SurgeryType: otBooking.SurgeryType,
      BookedForDate: moment(otBooking.BookedForDate).format('YYYY-MM-DD HH:mm A'),
      Prescriber: this.AssignPrescriberName(otBooking.PrescribedBy),
      Priority: otBooking.OTPriority,
      Status: otBooking.Status,
      Address: otBooking.Address,
      MunicipalityName: otBooking.MunicipalityName,
      CountrySubDivisionName: otBooking.CountrySubDivisionName,
      CountryName: otBooking.CountryName,
      WardNumber: otBooking.WardNumber
    };
  }

  AssignSurgeryName(surgeryId: number): string {
    let surgery = this.SurgeryList.find(s => s.SurgeryId === surgeryId);
    if (surgery) {
      return surgery.SurgeryName;
    }
    else {
      this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`Invalid SurgeryId.`]);
      return "";
    }
  }

  AssignPrescriberName(prescribedBy: number): string {
    let prescriber = this.OTPrescriberList.find(s => s.PrescriberId === prescribedBy);
    if (prescriber) {
      return prescriber.PrescriberName;
    }
    else {
      this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`Invalid PrescriberId.`]);
      return "";
    }
  }

  GetPersonnel(): void {
    let personnel = this._otService.getOTPersonnel();
    if (personnel && personnel.length) {
      this.PersonnelList = personnel.filter(personnel => personnel.IsActive);
    }
  }

  GetOTPrescriberList(): void {
    let otPrescriberList = this._otService.getOTPrescriberList();
    if (otPrescriberList && otPrescriberList.length) {
      this.OTPrescriberList = otPrescriberList;
    }
  }

  async GetAnaesthesiasByPriceCategoryId(): Promise<void> {
    try {
      if (this.SelectedOTBooking.PriceCategoryId !== null) {
        const res: DanpheHTTPResponse = await this._otBLService.GetAnaesthesiasByPriceCategoryId(this.SelectedOTBooking.PriceCategoryId).toPromise();
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          if (res.Results && res.Results.length > 0) {
            this.AnaesthesiaList = res.Results;
          }
          else {
            this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`No Anaesthesias Available.`]);
          }
        }
      }
    }
    catch (err) {
      throw new Error(err);
    }
  }

  AssignAnaesthesia(): void {
    let selectedAnaesthesias: Array<{ ServiceItemId: number, ItemName: string }>;
    if (this.SelectedOTBooking.Anaesthesias) {
      try {
        selectedAnaesthesias = JSON.parse(this.SelectedOTBooking.Anaesthesias);
      }
      catch (error) {
        console.error('Error parsing JSON:', error);
      }
      selectedAnaesthesias.forEach(p => {
        let anaesthesia = new GetOTAnaesthesia_DTO();
        anaesthesia = this.AnaesthesiaList.find(d => d.ServiceItemId === p.ServiceItemId);
        if (anaesthesia && anaesthesia.ServiceItemId !== null) {
          let anaesthesiaType = this.AnaesthesiaTypeList.find(type => type.AnaesthesiaTypeId === anaesthesia.AnaesthesiaTypeId)
          if (anaesthesiaType && anaesthesiaType.AnaesthesiaTypeId) {
            let anaesthesiaDetail = new AnaesthesiaDetail_DTO();
            anaesthesiaDetail.AnaesthesiaTypeId = anaesthesiaType.AnaesthesiaTypeId;
            anaesthesiaDetail.AnaesthesiaTypeName = anaesthesiaType.AnaesthesiaType;
            anaesthesiaDetail.AnaesthesiaId = anaesthesia.AnaesthesiaId;
            anaesthesiaDetail.AnaesthesiaName = anaesthesia.ItemName;
            this.AnaesthesiaDetailList.push(anaesthesiaDetail);
          }
        }
      });
    }
  }

  GetOTSurgeries(): void {
    let otSurgeries = this._otService.getOTSurgeries();
    if (otSurgeries && otSurgeries.length) {
      this.SurgeryList = otSurgeries;
      this.FilteredSurgeryList = otSurgeries.filter(s => s.IsActive);
    }
  }

  async GetPersonnelDetailsByOTBookingId(): Promise<void> {
    try {
      const res: DanpheHTTPResponse = await this._otBLService.GetPersonnelDetailsByOTBookingId(this.SelectedOTBooking.OTBookingId).toPromise();
      if (res.Status === ENUM_DanpheHTTPResponses.OK) {
        const teamInfo = res.Results;
        if (teamInfo.length) {
          this.OTTeamInfo = teamInfo;
        }
      }
      else {
        this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, [res.ErrorMessage]);
      }
    }
    catch (err) {
      throw new Error(err);
    }
  }

  AssignPersonnelForUpdate(): void {
    let otTeamInfo = this.OTTeamInfo;
    if (otTeamInfo.length) {
      otTeamInfo.forEach(emp => {
        let personnel = new GetOTPersonnel_DTO();
        personnel = this.PersonnelList.find(p => p.EmployeeId === emp.EmployeeId);
        if (personnel && personnel.EmployeeId !== null) {
          personnel.PersonnelTypeId = emp.PersonnelTypeId; //! This is required because if Some xyz Doctor is Assigned as Surgeon during OT Booking, but we need to filter the personnel from PersonneList which is coming from Employee Table.
          personnel.PersonnelTypeName = emp.PersonnelType;
          this.SelectedPersonnelList.push(personnel);
        }
      });
    }
  }

  CallBackCloseConcludeBooking($event): void {
    if ($event && $event.toLocaleLowerCase() === ENUM_OT_BookingStatus.Concluded.toLowerCase()) {
      this.CloseConcludePage();
    }
  }

  EditBookingDetailsFromConcludePage($event): void {
    if ($event && $event.EditBookingDetailsFromConcludePage) {
      this.ShowConcludePage = false;
      this.CallBackEditBookingFromConcludePage.emit({ EditBookingDetailsFromConcludePage: true });
    }
  }

}
