import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import * as moment from 'moment';
import { CoreService } from '../../../core/shared/core.service';
import { DanpheHTTPResponse } from '../../../shared/common-models';
import { MessageboxService } from '../../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status, ENUM_OT_BookingStatus, ENUM_VisitType } from '../../../shared/shared-enums';
import { GetOTAnaesthesiaType_DTO } from '../../shared/dto/get-ot-anaesthesia-type.dto';
import { GetOTAnaesthesia_DTO } from '../../shared/dto/get-ot-anaesthesia.dto';
import { GetOTBookingDetails_DTO } from '../../shared/dto/get-ot-booking-details.dto';
import { GetOTMachine_DTO } from '../../shared/dto/get-ot-machine.dto';
import { GetOTPersonnelType_DTO } from '../../shared/dto/get-ot-personnel-type.dto';
import { GetOTPersonnel_DTO } from '../../shared/dto/get-ot-personnel.dto';
import { GetOTSurgery_DTO } from '../../shared/dto/get-ot-surgery.dto';
import { GetOTTeamInfo_DTO } from '../../shared/dto/get-ot-team-info.dto';
import { OTMachineDetail_DTO } from '../../shared/dto/ot-machine-detail.dto';
import { OTPrescriber_DTO } from '../../shared/dto/ot-prescriber-dto';
import { ImplantDetail_DTO } from '../../shared/dto/post-ot-implant-detail.dto';
import { PostOTMachineDetail_DTO } from '../../shared/dto/post-ot-machine-detail.dto';
import { PostOTTeamInfo_DTO } from '../../shared/dto/post-ot-team-info.dto';
import { ImplantDetailModel } from '../../shared/ot-implant-detail.model';
import { OperationTheatreBLService } from '../../shared/ot.bl.service';
import { OTService } from '../../shared/ot.service';

@Component({
  selector: 'ot-booking-details',
  templateUrl: './ot-booking-details.component.html',
  styleUrls: ['./ot-booking-details.component.css'],
})

export class OTBookingDetailsComponent implements OnInit {

  @Input('ot-booking-id') OTBookingId: number = 0;
  @Input('is-view-only') IsViewOnly: boolean = false;
  @Input('IsCancelled') IsCancelled: boolean = false;
  @Input('isUpdate') IsUpdate: boolean = false;
  ShowBookingDetails: boolean = false;
  ShowPersonnelDetails: boolean = false;
  ShowOTCheckListDetails: boolean = false;
  ShowAnaesthesiaDetails: boolean = false;
  ShowInstrumentDetails: boolean = false;
  SelectedOTBooking = new GetOTBookingDetails_DTO();
  SurgeryList = new Array<GetOTSurgery_DTO>();
  FilteredSurgeryList = new Array<GetOTSurgery_DTO>();
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
    VisitType: string;
    VisitCode: string;
    BedCode: string;
    WardName: string;
    MunicipalityName: string;
    CountrySubDivisionName: string;
    CountryName: string;
    WardNumber: number;
  };
  OTPrescriberList = new Array<OTPrescriber_DTO>();
  PersonnelList = new Array<GetOTPersonnel_DTO>();
  PersonnelTypes = new Array<GetOTPersonnelType_DTO>();
  CurrentPersonnel = new GetOTPersonnel_DTO();
  CurrentPersonnelType = { PersonnelTypeName: "", PersonnelTypeId: 0 };
  SelectedPersonnelList = new Array<GetOTPersonnel_DTO>();
  confirmationTitle: string = "Confirm !";
  confirmationMessageForPersonnel: string = "Are you sure you want to Update Personnel Details?";
  confirmationMessageForAnaesthesia: string = "Are you sure you want to Update Anaesthesia Details?";
  confirmationMessageForInstrument: string = "Are you sure you want to Update Instrument Details?";
  loading: boolean = false;
  CurrentTeamInfo = new Array<PostOTTeamInfo_DTO>();
  OTTeamInfo = new Array<GetOTTeamInfo_DTO>();
  ShowCheckListPage: boolean = false;
  ShowConcludeDetail: boolean = false;
  AnaesthesiaTypeList = new Array<GetOTAnaesthesiaType_DTO>();
  AnaesthesiaList = new Array<GetOTAnaesthesia_DTO>();
  FilteredAnaesthesiaList = new Array<GetOTAnaesthesia_DTO>();
  PriceCategoryId: number = 0;
  CurrentAnaesthesia = new GetOTAnaesthesia_DTO();
  SelectedAnaesthesiaList = new Array<GetOTAnaesthesia_DTO>();
  AnaesthesiaDetails: {
    UseAnaesthesia: boolean,
    Anaesthesias: string  //! Sanjeev will be used later
  };
  OTMachineList = new Array<GetOTMachine_DTO>();
  CurrentOTMachine = new GetOTMachine_DTO();
  SelectedOTMachine = new PostOTMachineDetail_DTO();
  ImplantList = new Array<ImplantDetailModel>();
  CurrentImplant = new ImplantDetailModel();
  SelectedImplantListDto = new Array<ImplantDetail_DTO>();
  SelectedMachineListDto = new Array<OTMachineDetail_DTO>();
  StatusConcluded = ENUM_OT_BookingStatus.Concluded;
  // StatusCancelled = ENUM_OT_BookingStatus.Cancelled;
  InpatientVisitType = ENUM_VisitType.inpatient;
  ShowConsentForm: boolean = false;

  constructor(
    private _otBLService: OperationTheatreBLService,
    private _messageBoxService: MessageboxService,
    private _changeDetector: ChangeDetectorRef,
    public coreService: CoreService,
    private _otService: OTService
  ) {

  }

  ngOnInit(): void {
    this.GetPersonnelTypes();
    this.GetPersonnel();
    this.InitializeBookingDetails();
  }

  InitializeBookingDetails(): void {
    (async () => {
      try {
        if (this.IsUpdate) {
          if (!this.OTBookingId) {
            this._messageBoxService.showMessage(ENUM_MessageBox_Status.Warning, [`Invalid OTBookingId.`]);
          }
          this.GetOTSurgeries();
          this.GetOTPrescriberList();
          await this.GetOTBookingDetailsByOTBookingId();
          this.SelectedOTBooking.BookedForDate = moment(this.SelectedOTBooking.BookedForDate).format('YYYY-MM-DD HH:mm A');
          this.ShowBookingDetails = true;
          this.ShowConcludeDetail = true;
        }
      } catch (err) {
        this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Error: ${err.ErrorMessage}`]);
      }
    })();
  }

  UpdateView(subNavTabIndex: number): void {
    this.ShowBookingDetails = false;
    this.ShowPersonnelDetails = false;
    this.ShowOTCheckListDetails = false;
    this.ShowAnaesthesiaDetails = false;
    this.ShowInstrumentDetails = false;
    this.ShowConsentForm = false;
    if (subNavTabIndex === 0) {
      this.ShowBookingDetails = true;
    }
    if (subNavTabIndex === 1) {
      this.InitializePersonnelDetails();
      this.ShowPersonnelDetails = true;
    }
    if (subNavTabIndex === 2) {
      this.ShowOTCheckListDetails = true;
      this.ShowCheckListPage = true;
    }
    if (subNavTabIndex === 3) {
      this.InitializeAnaesthesiaDetails();
      this.ShowAnaesthesiaDetails = true;
    }
    if (subNavTabIndex === 4) {
      this.InitializeInstrumentDetails();
      this.ShowInstrumentDetails = true;
    }
    if (subNavTabIndex === 5) {
      this.ShowConsentForm = true;
    }
  }

  InitializePersonnelDetails(): void {
    (async (): Promise<void> => {
      try {
        this.SelectedPersonnelList = new Array<GetOTPersonnel_DTO>();
        await this.GetPersonnelDetailsByOTBookingId();
        this.AssignPersonnelForUpdate();
      }
      catch (err) {
        this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Error: ${err.ErrorMessage}`]);
      }
    })();
  }

  InitializeAnaesthesiaDetails(): void {
    (async (): Promise<void> => {
      try {
        this.AnaesthesiaTypeList = new Array<GetOTAnaesthesiaType_DTO>();
        this.SelectedAnaesthesiaList = new Array<GetOTAnaesthesia_DTO>();
        this.PriceCategoryId = this.SelectedOTBooking.PriceCategoryId;
        this.GetAnaesthesiaTypes();
        await this.GetAnaesthesiasByPriceCategoryId();
        this.AssignAnaesthesiaForUpdate();
      }
      catch (err) {
        this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Error: ${err.ErrorMessage}`]);
      }
    })();
  }

  InitializeInstrumentDetails(): void {
    (async (): Promise<void> => {
      try {
        this.ImplantList = new Array<ImplantDetailModel>();
        this.CurrentOTMachine = new GetOTMachine_DTO();
        this.CurrentImplant = new ImplantDetailModel();
        this.SelectedImplantListDto = new Array<ImplantDetail_DTO>();
        this.GetOTMachines();
        await this.GetMachineDetailByOTBookingId();
        await this.GetImplantDetailByOTBookingId();
        this.AssignMachineForUpdate();
        if (this.ImplantList.length) {
          this.AssignImplantDetailsForUpdate();
        }
      }
      catch (err) {
        this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Error: ${err.ErrorMessage}`]);
      }
    })();
  }

  AssignAnaesthesiaForUpdate(): void {
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
        anaesthesia = this.AnaesthesiaList.find(d => d.ItemName.toLowerCase() === p.ItemName.toLowerCase());
        if (anaesthesia && anaesthesia.ServiceItemId !== null) {
          this.SelectedAnaesthesiaList.push(anaesthesia);
        }
      });
    }
  }

  AssignInstrumentForUpdate() {
    this.AssignInstrumentForUpdate();
  }

  AssignMachineForUpdate(): void {
    this.CurrentOTMachine = new GetOTMachine_DTO();
    if (this.SelectedOTBooking.OTMachineId) {
      let machine = this.OTMachineList.find(m => m.OTMachineId === this.SelectedOTBooking.OTMachineId);
      if (machine) {
        this.CurrentOTMachine = machine;
      }
    }
  }

  AssignImplantDetailsForUpdate(): void {
    this.SelectedImplantListDto = new Array<ImplantDetail_DTO>();
    this.ImplantList.forEach(implant => {
      let imp = new ImplantDetail_DTO();
      imp.ImplantDetailId = implant.ImplantDetailId;
      imp.ImplantName = implant.ImplantName;
      imp.Quantity = implant.Quantity;
      imp.Charge = implant.Charge;
      imp.Remarks = implant.Remarks;
      imp.IsActive = implant.IsActive;
      imp.PatientId = implant.PatientId;
      imp.PatientVisitId = implant.PatientVisitId;
      imp.OTBookingId = implant.OTBookingId;
      this.SelectedImplantListDto.push(imp);
    });
  }

  GetOTMachines(): void {
    let otMachines = this._otService.getOTMachines();
    if (otMachines && otMachines.length) {
      this.OTMachineList = otMachines.filter(machine => machine.IsActive);
    }
  }

  async GetImplantDetailByOTBookingId(): Promise<void> {
    try {
      const res: DanpheHTTPResponse = await this._otBLService.GetImplantDetailByOTBookingId(this.SelectedOTBooking.OTBookingId).toPromise();
      if (res.Status === ENUM_DanpheHTTPResponses.OK) {
        if (res.Results && res.Results.length > 0) {
          const implants = res.Results;
          if (implants && implants.length) {
            this.ImplantList = implants.filter(i => i.IsActive);
          }
        }
        else {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`ImplantDetail is empty.`]);
        }
      }
    }
    catch (err) {
      throw new Error(err);
    }
  }

  async GetMachineDetailByOTBookingId(): Promise<void> {
    try {
      const res: DanpheHTTPResponse = await this._otBLService.GetMachineDetailByOTBookingId(this.SelectedOTBooking.OTBookingId).toPromise();
      if (res.Status === ENUM_DanpheHTTPResponses.OK) {
        if (res.Results && res.Results.length > 0) {
          const machineDetail = res.Results;
          if (machineDetail && machineDetail.length) {
            this.SelectedMachineListDto = machineDetail.filter(i => i.IsActive);
          }
        }
        else {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`MachineDetail is empty.`]);
        }
      }
    }
    catch (err) {
      throw new Error(err);
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
        this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`BookingDetails is empty.`]);
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

  async GetAnaesthesiasByPriceCategoryId(): Promise<void> {
    try {
      if (this.PriceCategoryId !== null) {
        const res: DanpheHTTPResponse = await this._otBLService.GetAnaesthesiasByPriceCategoryId(this.PriceCategoryId).toPromise();
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          if (res.Results && res.Results.length) {
            this.AnaesthesiaList = res.Results;
            this.FilteredAnaesthesiaList = res.Results;
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
      VisitType: otBooking.VisitType,
      VisitCode: otBooking.VisitCode,
      BedCode: otBooking.BedCode,
      WardName: otBooking.WardName,
      MunicipalityName: otBooking.MunicipalityName,
      CountrySubDivisionName: otBooking.CountrySubDivisionName,
      CountryName: otBooking.CountryName,
      WardNumber: otBooking.WardNumber
    };
    this.SelectedOTBooking.OTPriority = otBooking.OTPriority;
    this.SelectedOTBooking.PrescribedBy = otBooking.PrescribedBy;
    this.SelectedOTBooking.SurgeryId = otBooking.SurgeryId;
    this.SelectedOTBooking.SurgeryType = otBooking.SurgeryType;
    this.SelectedOTBooking.OTExpectedDuration = otBooking.OTExpectedDuration;
    this.SelectedOTBooking.OtherDiagnosis = otBooking.OtherDiagnosis;
    this.SelectedOTBooking.Remarks = otBooking.Remarks;
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

  GetOTSurgeries(): void {
    let otSurgeries = this._otService.getOTSurgeries();
    if (otSurgeries && otSurgeries.length) {
      this.SurgeryList = otSurgeries;
      this.FilteredSurgeryList = otSurgeries.filter(s => s.IsActive);
    }
  }

  GetOTPrescriberList(): void {
    let otPrescriberList = this._otService.getOTPrescriberList();
    if (otPrescriberList && otPrescriberList.length) {
      this.OTPrescriberList = otPrescriberList;
    }
  }

  GetPersonnelTypes(): void {
    let personnelTypes = this._otService.getOTPersonnelTypes();
    if (personnelTypes && personnelTypes.length) {
      this.PersonnelTypes = personnelTypes.filter(pType => pType.IsActive);
    }
  }

  GetPersonnel(): void {
    let personnel = this._otService.getOTPersonnel();
    if (personnel && personnel.length) {
      this.PersonnelList = personnel.filter(personnel => personnel.IsActive);
    }
  }


  async GetPersonnelDetailsByOTBookingId(): Promise<void> {
    try {
      const res: DanpheHTTPResponse = await this._otBLService.GetPersonnelDetailsByOTBookingId(this.SelectedOTBooking.OTBookingId).toPromise();
      if (res.Status === ENUM_DanpheHTTPResponses.OK) {
        const teamInfo = res.Results;
        if (teamInfo && teamInfo.length) {
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


  CallBackFromOtBookingAdd($event): void {
    let updatedOTDetails = $event;
    if (updatedOTDetails && updatedOTDetails.PatientName) {
      this.AssignBookingDetails(updatedOTDetails);
    }
  }

  PersonnelTypeFormatter(data: any): string {
    let html = data["PersonnelType"];
    return html;
  }

  PersonnelFormatter(data: any): string {
    let html = data["FullName"];

    return html;
  }

  AnaesthesiaFormatter(data: any): string {
    let html = data["ItemName"];
    return html;
  }

  MachineFormatter(data: any): string {
    let html = data["MachineName"];
    return html;
  }

  OnUseAnaesthesiaSelected(): void {
    this.SelectedOTBooking.UseAnaesthesia = !this.SelectedOTBooking.UseAnaesthesia;
    if (this.SelectedOTBooking.UseAnaesthesia === false) {
      this.SelectedAnaesthesiaList = new Array<GetOTAnaesthesia_DTO>();
    }
  }

  OnPersonnelSelect($event): void {
    if (this.CurrentPersonnel && typeof (this.CurrentPersonnel) === "object" && this.CurrentPersonnel.EmployeeId !== null) {
      if (this.CurrentPersonnelType === null || this.CurrentPersonnelType.PersonnelTypeId === 0 || this.CurrentPersonnelType.PersonnelTypeName === "") {
        this.CurrentPersonnel = new GetOTPersonnel_DTO();
        this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`Select PersonnelType first`]);
        return;
      }
      if (!this.SelectedPersonnelList.some((a) => a.EmployeeId === this.CurrentPersonnel.EmployeeId)) {
        this.CurrentPersonnel.PersonnelTypeName = this.CurrentPersonnelType.PersonnelTypeName;
        this.CurrentPersonnel.PersonnelTypeId = this.CurrentPersonnelType.PersonnelTypeId;
        this.SelectedPersonnelList.push(this.CurrentPersonnel);
      }
      else {
        this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`Already Added.`]);
      }
      this.CurrentPersonnel = new GetOTPersonnel_DTO();
    }
  }

  OnPersonnelTypeSelect($event): void {
    if ($event) {
      const personnelTypeId = +$event.target.value;
      let personnelType = this.PersonnelTypes.find(p => p.PersonnelTypeId === personnelTypeId);
      if (personnelType) {
        this.CurrentPersonnelType.PersonnelTypeName = personnelType.PersonnelType;
        this.CurrentPersonnelType.PersonnelTypeId = personnelType.PersonnelTypeId;
      }
      else {
        this.CurrentPersonnelType.PersonnelTypeId = 0
        this.CurrentPersonnelType.PersonnelTypeName = "";
      }
    }
  }

  OnOTMachineSelect($event): void {
    if (this.CurrentOTMachine && typeof (this.CurrentOTMachine) === "object" && this.CurrentOTMachine.OTMachineId) {
      if (!this.SelectedMachineListDto.some((p) => p.OTMachineId === this.CurrentOTMachine.OTMachineId)) {
        this.SelectedOTMachine.OTMachineId = this.CurrentOTMachine.OTMachineId;
        this.SelectedOTMachine.Charge = this.CurrentOTMachine.MachineCharge;
        this.SelectedOTMachine.IsActive = true;
        this.SelectedOTMachine.OTBookingId = this.SelectedOTBooking.OTBookingId;
        this.SelectedOTMachine.PatientId = this.SelectedOTBooking.PatientId;
        this.SelectedOTMachine.PatientVisitId = this.SelectedOTBooking.PatientVisitId;
      }
      else {
        this.CurrentOTMachine = new GetOTMachine_DTO();
        this.SelectedOTMachine = new PostOTMachineDetail_DTO();
        this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`Already Added.`]);
      }
    }
    else {
      this.CurrentOTMachine = new GetOTMachine_DTO();
      this.SelectedOTMachine = new PostOTMachineDetail_DTO();
    }
  }

  SaveImplant(): void {
    if (this.CurrentImplant && this.CurrentImplant.ImplantName && this.CurrentImplant.ImplantName.trim().length) {
      if (!this.CurrentImplant.Quantity) {
        this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`Enter valid Implant Quantity.`]);
        return;
      }
      let implant = new ImplantDetail_DTO();
      implant.ImplantDetailId = this.CurrentImplant.ImplantDetailId;
      implant.ImplantName = this.CurrentImplant.ImplantName;
      implant.Quantity = this.CurrentImplant.Quantity;
      implant.Charge = this.CurrentImplant.Charge;
      implant.Remarks = this.CurrentImplant.Remarks;
      this.AddImplantDetail(implant);
    }
    else {
      this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`Please enter implant name.`]);
    }
  }

  SaveMachine(): void {
    if (this.CurrentOTMachine && this.CurrentOTMachine.OTMachineId) {
      if (this.CurrentOTMachine.MachineCharge === null || this.CurrentOTMachine.MachineCharge === undefined) {
        this._messageBoxService.showMessage(ENUM_MessageBox_Status.Warning, [`Enter Valid Machine Charge.`]);
        return;
      }
      let machine = new PostOTMachineDetail_DTO();
      machine.OTMachineId = this.CurrentOTMachine.OTMachineId;
      machine.Charge = this.CurrentOTMachine.MachineCharge;
      machine.PatientId = this.SelectedOTBooking.PatientId;
      machine.PatientVisitId = this.SelectedOTBooking.PatientVisitId;
      machine.OTBookingId = this.SelectedOTBooking.OTBookingId;
      this.AddMachineDetail(machine);
    }
    else {
      this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`Please Machine.`]);
    }
  }

  ClearImplant(): void {
    this.CurrentImplant = new ImplantDetailModel();
  }

  ClearMachine(): void {
    this.CurrentOTMachine = new GetOTMachine_DTO();
  }

  RemovePersonnel(index: number): void {
    this.SelectedPersonnelList.splice(index, 1);
  }

  RemoveImplant(index: number, implantDetailId: number): void {
    this.DeactivateImplantDetail(index, implantDetailId);
  }


  RemoveMachine(index: number, machineDetailId: number): void {
    this.DeactivateMachineDetail(index, machineDetailId);
  }

  GoToNextElement(event: KeyboardEvent, nextElementId: string): void {
    event.preventDefault(); //! Sanjeev, Prevent default behavior of Enter key
    const nextElement = document.getElementById(nextElementId) as HTMLInputElement;
    if (nextElement) {
      nextElement.focus();
    }
  }

  handleConfirmForPersonnelDetails(): void {
    this.loading = true;
    this.AssignPersonnel();
    this.UpdatePersonnelDetails();
  }

  handleConfirmForAnaesthesiaDetails(): void {
    this.loading = true;
    if (!this.SelectedOTBooking.UseAnaesthesia) {
      this.UpdateAnaesthesiaDetails();
    }
    else {
      if (this.SelectedAnaesthesiaList.length) {
        this.AssignAnaesthesias();
        this.UpdateAnaesthesiaDetails();
      }
      else {
        this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`Select at least 0ne Anaesthesia.`]);
        this.loading = false;
      }
    }
  }


  handleConfirmForMachine(): void {
    this.loading = true;
    if (!this.SelectedOTBooking.OTMachineId) {
      this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`Please select Machine.`]);
    }
    else {
      this.UpdateOTMachineByOTBookingId();
    }
  }

  DeactivateImplantDetail(index: number, implantDetailId: number): void {
    const otBookingId = this.SelectedOTBooking.OTBookingId;
    this._otBLService.DeactivateImplantDetail(otBookingId, implantDetailId)
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          if (res.Results && res.Results.ImplantDetailId) {
            this.SelectedImplantListDto.splice(index, 1);
          }
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Success, [`Removed Implant Successfully.`]);
        }
        else {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, [res.ErrorMessage]);
        }

      },
        (err: DanpheHTTPResponse) => {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Exception: ${err.ErrorMessage}`]);
        }
      );
  }

  DeactivateMachineDetail(index: number, machineDetailId: number): void {
    const otBookingId = this.SelectedOTBooking.OTBookingId;
    this._otBLService.DeactivateMachineDetail(otBookingId, machineDetailId)
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          if (res.Results && res.Results.MachineDetailId) {
            this.SelectedMachineListDto.splice(index, 1);
          }
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Success, [`Removed Machine Successfully.`]);
        }
        else {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, [res.ErrorMessage]);
        }

      },
        (err: DanpheHTTPResponse) => {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Exception: ${err.ErrorMessage}`]);
        }
      );
  }

  UpdateOTMachineByOTBookingId(): void {
    this._otBLService.UpdateOTMachineByOTBookingId(this.SelectedOTBooking.OTBookingId, this.SelectedOTBooking.OTMachineId)
      .finally(() => { this.loading = false; })
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Success, [`Updated OTMachine Successfully.`]);
        }
        else {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, [res.ErrorMessage]);
        }

      },
        (err: DanpheHTTPResponse) => {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Exception: ${err.ErrorMessage}`]);
        }
      );
  }

  AddMachineDetail(machineDetail: PostOTMachineDetail_DTO): void {
    this._otBLService.AddMachineDetail(machineDetail)
      .finally(() => { this.loading = false; })
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          if (res.Results && res.Results.MachineDetailId) {
            // machine.MachineDetailId = res.Results.MachineDetailId;
            let newMachineDetail = new OTMachineDetail_DTO();
            newMachineDetail = res.Results;
            let machine = this.OTMachineList.find(m => m.OTMachineId === newMachineDetail.OTMachineId);
            if (machine) {
              newMachineDetail.MachineName = machine.MachineName;
            }
            this.SelectedMachineListDto.push(newMachineDetail);
            this.CurrentOTMachine = new GetOTMachine_DTO();
          }
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Success, [`Implant Updated Successfully.`]);
        }
        else {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, [res.ErrorMessage]);
        }

      },
        (err: DanpheHTTPResponse) => {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Exception: ${err.ErrorMessage}`]);
        }
      );
  }

  AddImplantDetail(implant: ImplantDetail_DTO): void {
    const patientId = this.SelectedOTBooking.PatientId;
    const patientVisitId = this.SelectedOTBooking.PatientVisitId;
    const otBookingId = this.SelectedOTBooking.OTBookingId;
    this._otBLService.AddImplantDetail(patientId, patientVisitId, otBookingId, implant)
      .finally(() => { this.loading = false; })
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          if (res.Results && res.Results.ImplantDetailId) {
            implant.ImplantDetailId = res.Results.ImplantDetailId;
            this.SelectedImplantListDto.push(implant);
            this.CurrentImplant = new ImplantDetailModel();
          }
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Success, [`Implant Updated Successfully.`]);
        }
        else {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, [res.ErrorMessage]);
        }

      },
        (err: DanpheHTTPResponse) => {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Exception: ${err.ErrorMessage}`]);
        }
      );
  }

  UpdateAnaesthesiaDetails(): void {
    this._otBLService.UpdateAnaesthesiaDetails(this.SelectedOTBooking.OTBookingId, this.SelectedOTBooking.UseAnaesthesia, this.SelectedOTBooking.Anaesthesias)
      .finally((): void => {
        this.loading = false;
      })
      .subscribe((res: DanpheHTTPResponse): void => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Success, [`Anaesthesia Details Updated Successfully.`]);
        }
        else {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, [`Unable to Update Anaesthesia Details.`]);
        }
      },
        (err: DanpheHTTPResponse) => {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Exception: ${err.ErrorMessage}`]);
        }
      );
  }

  AssignAnaesthesias(): void {
    this.SelectedOTBooking.Anaesthesias = JSON.stringify(
      this.SelectedAnaesthesiaList.map(item => ({
        ServiceItemId: item.ServiceItemId,
        ItemName: item.ItemName
      }))
    );
  }

  handleCancel(): void {

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

  AssignPersonnel(): void {
    this.CurrentTeamInfo = this.SelectedPersonnelList.map(personnel => {
      return {
        TeamInfoId: 0,
        PersonnelTypeId: personnel.PersonnelTypeId,
        EmployeeId: personnel.EmployeeId
      };
    });
  }

  UpdatePersonnelDetails(): void {
    this._otBLService.UpdatePersonnelDetails(this.CurrentTeamInfo, this.SelectedOTBooking.OTBookingId, this.SelectedOTBooking.PatientId, this.SelectedOTBooking.PatientVisitId)
      .finally(() => {
        this.loading = false;
      })
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Success, [`Personnel Details Updated Successfully.`]);
        }
        else {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, [`Unable to Update Personnel Details.`]);
        }
      },
        (err: DanpheHTTPResponse) => {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Exception: ${err.ErrorMessage}`]);
        }
      );
  }

  OnAnaesthesiaTypeSelect($event): void {
    if ($event) {
      const anaesthesiaTypeId = +$event.target.value;
      this.FilterAnaesthesiaList(anaesthesiaTypeId);
    }
  }

  FilterAnaesthesiaList(anaesthesiaTypeId: number): void {
    this.FilteredAnaesthesiaList = this.AnaesthesiaList.filter(item => item.AnaesthesiaTypeId === anaesthesiaTypeId);
  }

  OnAnaesthesiaSelect($event): void {
    if (this.CurrentAnaesthesia && typeof (this.CurrentAnaesthesia) === "object" && this.CurrentAnaesthesia.AnaesthesiaTypeId !== null) {
      if (!this.SelectedAnaesthesiaList.some((a) => a.ServiceItemId === this.CurrentAnaesthesia.ServiceItemId)) {
        this.SelectedAnaesthesiaList.push(this.CurrentAnaesthesia);
      }
      else {
        this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`Already Added.`]);
      }
      this.CurrentAnaesthesia = new GetOTAnaesthesia_DTO();
    }
  }

  RemoveAnaesthesia(index: number): void {
    this.SelectedAnaesthesiaList.splice(index, 1);
  }

  OnImplantQuantityChange(): void {
    if (this.CurrentImplant && this.CurrentImplant.Quantity < 0) {
      this.CurrentImplant.Quantity = 0;
    }
  }

  OnImplantChargeChange(): void {
    if (this.CurrentImplant && this.CurrentImplant.Charge < 0) {
      this.CurrentImplant.Charge = 0;
    }
  }

  OnMachineChargeChange(): void {
    if (this.CurrentOTMachine && this.CurrentOTMachine.MachineCharge < 0) {
      this.CurrentOTMachine.MachineCharge = 0;
    }
  }

  GetColorForStatus(status: string): string {
    if (status) {
      switch (status) {
        case `${ENUM_OT_BookingStatus.Booked}`:
          return `#ffa500`; //  orange
        case `${ENUM_OT_BookingStatus.Scheduled}`:
          return `#60b860`; //  green
        case `${ENUM_OT_BookingStatus.InProgress}`:
          return `#049adc`; //  blue
        case `${ENUM_OT_BookingStatus.Concluded}`:
          return `#e7505a`; //  red
        case `${ENUM_OT_BookingStatus.Cancelled}`:
          return `#e7505a`; //  red
        default:
          return `white`; //  default color
      }
    }
  }

}
