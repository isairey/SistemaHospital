import { DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import * as moment from 'moment';
import { Subscription } from 'rxjs';
import { DanpheHTTPResponse } from '../../shared/common-models';
import { NepaliDateInGridColumnDetail, NepaliDateInGridParams } from '../../shared/danphe-grid/NepaliColGridSettingsModel';
import { MessageboxService } from '../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status, ENUM_OT_BookingStatus } from '../../shared/shared-enums';
import { GetOTTeamInfo_DTO } from '../shared/dto/get-ot-team-info.dto';
import { GetOTBookingList_DTO } from '../shared/dto/ot-get-booking-list.dto';
import { OTPrescriber_DTO } from '../shared/dto/ot-prescriber-dto';
import { OTGridColumnSettings } from '../shared/ot-grid-column-settings';
import { OperationTheatreBLService } from '../shared/ot.bl.service';
import { OTService } from '../shared/ot.service';

@Component({
  selector: 'ot-booking-list',
  templateUrl: './ot-booking-list.component.html',
  styleUrls: ['./ot-booking-list.component.css'],
  host: { '(window:keyup)': 'hotkeys($event)' }
})
export class OTBookingListComponent implements OnInit, OnDestroy {

  ShowAddNewBookingPage: boolean = false;
  ShowTeamInfoPage: boolean = false;
  ShowCancellationPage: boolean = false;
  SelectedOTBooking = new GetOTBookingList_DTO();
  OTBookingListColumns = new Array<any>();
  OTGridColumns = new OTGridColumnSettings();
  OTBookingList = new Array<GetOTBookingList_DTO>();
  IsUpdate: boolean = false;
  IsCancelled: boolean = false;
  RescheduledDate: string = null;
  IsReschedule: boolean = false;
  GoToDatePick: boolean = false;
  BackDateError: boolean = false;
  ShowReschedulePage: boolean = false;
  ShowConcludePage: boolean = false;
  IsFutureDateEnabled: boolean = true;
  OldBookedForDate: string = null;
  ShowCheckListPage: boolean = false;
  OT_BookingStatus_Booked = ENUM_OT_BookingStatus.Booked;
  OT_BookingStatus_Cancelled = ENUM_OT_BookingStatus.Cancelled;
  OT_BookingStatus_Concluded = ENUM_OT_BookingStatus.Concluded;
  IsDateFilter: boolean = false;
  FromDate: string = "";
  ToDate: string = "";
  Status: string = 'All';
  loading: boolean = false;
  OTTeamInfo = new Array<GetOTTeamInfo_DTO>();
  OTBookingStatusList = new Array<string>();
  ShowBookingList: boolean = true;
  ShowBookingDetail: boolean = false;
  IsViewOnly: boolean = false;
  gridExportOptions: any;
  DateRange: string = "";
  NepaliDateInGridSettings = new NepaliDateInGridParams();
  CancellationRemarks: string = "";
  OTPrescriberList = new Array<OTPrescriber_DTO>();
  CurrentPrescriber = new OTPrescriber_DTO();
  PrescribedBy: number = 0;
  PrescriberListSubscription: Subscription;
  ReportHeader: string = "";

  constructor(
    private _otBlService: OperationTheatreBLService,
    private _messageBoxService: MessageboxService,
    private _datePipe: DatePipe,
    private _otService: OTService,
    private _changeDetector: ChangeDetectorRef
  ) {
    this.OTBookingListColumns = this.OTGridColumns.OTBookingList;
    this.NepaliDateInGridSettings = new NepaliDateInGridParams();
    this.NepaliDateInGridSettings.NepaliDateColumnList.push(new NepaliDateInGridColumnDetail('BookedForDate', true));
    this.NepaliDateInGridSettings.NepaliDateColumnList.push(new NepaliDateInGridColumnDetail('OTConcludeTime', true));
  }

  ngOnInit() {
    this.OTBookingStatusList = Object.values(ENUM_OT_BookingStatus);
    this.OTBookingStatusList.unshift("All");
    this.LoadExportOptions();
    this.GetOTPrescriberList();

    /* During this Initial Load, this.GetOTPrescriberList(); does not assign any values to OTPrescriberList because the data is not loaded in service.
    We could make the method async in service but that impacts on performance. OR We could call that method in this component,
    but frequent switching between navigation tab call the API unnecessarily.
    */
    this.PrescriberListSubscription = this._otService.prescriberList.subscribe((message: string) => {
      if (message === 'Prescriber List Loaded') {
        this.GetOTPrescriberList();
      }
    });
  }

  ngOnDestroy() {
    this.PrescriberListSubscription.unsubscribe();
  }

  hotkeys(event): void {
    if (event.keyCode === 27) {
      if (this.ShowReschedulePage) {
        this.CloseReschedulePage();
      }
      else if (this.ShowCancellationPage) {
        this.CloseCancellationPage();
      }
      else if (this.ShowTeamInfoPage) {
        this.CloseTeamInfoPage();
      }
    }
  }

  PrescriberFormatter(data: any): string {
    let html = data["PrescriberName"];
    return html;
  }

  OnPrescriberSelect(): void {
    if (this.CurrentPrescriber && typeof (this.CurrentPrescriber) === "object" && this.CurrentPrescriber.PrescriberId) {
      this.PrescribedBy = this.CurrentPrescriber.PrescriberId;
    }
    else {
      this.CurrentPrescriber = new OTPrescriber_DTO();
      this.PrescribedBy = 0;
    }
  }

  LoadExportOptions() {
    this.gridExportOptions = {
      fileName: 'OT_Booking_List' + ((this.IsDateFilter === true && this.FromDate && this.ToDate) ? '_' + (moment(this.FromDate).format('YYYY-MM-DD') + '_' + moment(this.ToDate).format('YYYY-MM-DD') + '_') : '') + '.xls',
    };
  }

  CloseTeamInfoPage(): void {
    this.ShowTeamInfoPage = false;
    this.OTTeamInfo = new Array<GetOTTeamInfo_DTO>();
  }

  OnConcludePageClose(): void {
    this.ShowConcludePage = false;
    this.GetOTBookingList();
  }

  CloseCancellationPage(): void {
    this.ShowCancellationPage = false
  }

  CloseReschedulePage(): void {
    this.ShowReschedulePage = false
  }

  CloseConcludePage(): void {
    this.ShowConcludePage = false
  }

  AddNewOTBooking(): void {
    this.IsUpdate = false;
    this.ShowAddNewBookingPage = true;
  }

  GetBackFromOtBookingAdd(event: boolean): void {
    this.ShowAddNewBookingPage = false;
    this.SelectedOTBooking = new GetOTBookingList_DTO();
    if (event) {
      this.GetOTBookingList();
    }
  }

  GetOTBookingList(): void {
    let fromDate = this.FromDate;
    let toDate = this.ToDate;
    if (!this.IsDateFilter) {
      fromDate = null;
      toDate = null;
    }
    this.loading = true;
    this._otBlService.GetOTBookingList(fromDate, toDate, this.Status, this.PrescribedBy)
      .finally(() => {
        this.loading = false;
        this.IsCancelled = false;
        this.ReportHeader = `<b>Status:</b>&nbsp;${this.Status}<br>${this.CurrentPrescriber && this.CurrentPrescriber.PrescriberName ? `<b>Surgeon:</b>&nbsp;${this.CurrentPrescriber.PrescriberName}<br>` : ''}`;
      })
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          if (res.Results && res.Results.length > 0) {
            this.OTBookingList = res.Results;
            this.LoadExportOptions();
            this.ConvertOTBillingItemsFromJsonToSerializedString();
          }
          else {
            this.OTBookingList = new Array<GetOTBookingList_DTO>();
            this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`OTBooking list is empty.`]);
          }
        }
      })
  }

  ConvertOTBillingItemsFromJsonToSerializedString(): void {
    this.OTBookingList.forEach(book => {

      // book.BookedForDate = moment(book.BookedForDate).format("YYYY-MM-DD HH:mm A");
      // if (book.OTConcludeTime) {
      //   book.OTConcludeTime = moment(book.OTConcludeTime).format("YYYY-MM-DD HH:mm A");
      // }

      //Change Billing Items into String
      //We could do this in grid-col-settings, but it reflects on in Grid, not in pdf and excel files
      if (book.BillingItems && book.BillingItems.trim().length) {
        let stringifiedBillingItems = "";
        let serializedBillingItems: string = book.BillingItems;
        try {
          const jsonBillingItems = JSON.parse(serializedBillingItems);
          if (jsonBillingItems.length) {
            jsonBillingItems.forEach((a, index): void => {
              stringifiedBillingItems += a.ItemName;
              if (index < jsonBillingItems.length - 1) {
                stringifiedBillingItems += ", ";
              }
            });
          }
        }
        catch (error) {
          console.error('Error parsing Billing Items to JSON:', error);
        }
        finally {
          book.BillingItems = stringifiedBillingItems;
        }
      }
    });
  }

  GetOTPrescriberList(): void {
    let otPrescriberList = this._otService.getOTPrescriberList();
    if (otPrescriberList && otPrescriberList.length) {
      this.OTPrescriberList = otPrescriberList;
    }
  }

  PatientListFormatter(data: any): string {
    let html = data["ShortName"] + ' [ ' + data['PatientCode'] + ' ]' + ' - ' + data['Age'] + ' - ' + ' ' + data['Gender'] + ' - ' + ' ' + data['PhoneNumber'];
    return html;
  }

  OTBookingListGidActions(data): void {
    this.IsViewOnly = false;
    switch (data.Action) {
      case "cancel":
        {
          this.SelectedOTBooking = data.Data;
          this.ShowCancellationPage = true;
          break;
        }
      case "view-edit":
        {
          this.SelectedOTBooking = data.Data;
          this.ShowBookingList = false;
          this.ShowBookingDetail = true;
          this.IsUpdate = true;
          break;
        }
      case "view":
        {
          this.SelectedOTBooking = data.Data;
          this.ShowBookingList = false;
          this.ShowBookingDetail = true;
          this.IsUpdate = true;
          // this.IsViewOnly = true;    //! Sanjeev'  As of now letting user Edit Booking Details even after the Booking Conclude, As per the requirement.
          if (this.SelectedOTBooking.Status === ENUM_OT_BookingStatus.Cancelled) {
            this.IsCancelled = true;
          }
          break;
        }
      case "reschedule":
        {
          this.SelectedOTBooking = data.Data;
          this.OldBookedForDate = moment(this.SelectedOTBooking.BookedForDate).format('YYYY-MM-DD HH:mm A');
          this.ShowReschedulePage = true;
          break;
        }
      case "confirm":
        {
          this.SelectedOTBooking = data.Data;
          // !  As per the hospital requirement, removing the date validation for confirming the OT Booking
          // const bookedForDate = new Date(this.SelectedOTBooking.BookedForDate);
          // const currentDate = new Date(this.GetCurrentDate());
          // if (currentDate > bookedForDate) {
          //   this._messageBoxService.showMessage(ENUM_MessageBox_Status.Warning, [`Unable to Confirm OT Booking! Booked date has already passed.`])
          //   return;
          // }
          this.Confirmation('confirm');
          break;
        }
      case "check-in":
        {
          this.SelectedOTBooking = data.Data;
          // !  As per the hospital requirement, removing the date validation for check-in the OT Booking
          // const bookedForDate = new Date(this.SelectedOTBooking.BookedForDate);
          // const currentDate = new Date(this.GetCurrentDate());
          // if (currentDate > bookedForDate) {
          //   this._messageBoxService.showMessage(ENUM_MessageBox_Status.Warning, [`Unable to Check-In OT Booking! Booked Date has already passed.`])
          //   return;
          // }
          this.Confirmation('check-in');
          break;
        }
      case "conclude":
        {
          this.SelectedOTBooking = data.Data;
          this.ShowConcludePage = true;
          break;
        }
    }
  }

  Confirmation(action: string): void {
    const result = window.confirm(`Are you sure you want to ${action} for ${this.SelectedOTBooking.PatientName}?`);
    if (result) {
      if (action === 'confirm') {
        this.ConfirmOTBooking();
      }
      else if (action === 'check-in') {
        this.CheckInOTBooking();
      }
    }
    else {
      this.SelectedOTBooking = new GetOTBookingList_DTO();
    }
  }

  CancelOTBooking(): void {
    if (!this.CancellationRemarks || (this.CancellationRemarks && !this.CancellationRemarks.trim().length)) {
      this._messageBoxService.showMessage(ENUM_MessageBox_Status.Warning, [`Cancellation Remarks is mandatory.`]);
      return;
    }
    this._otBlService.CancelOTBooking(this.SelectedOTBooking.OTBookingId, this.CancellationRemarks)
      .finally((): void => {
        this.CancellationRemarks = "";
      })
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this.CloseCancellationPage();
          this.SelectedOTBooking = new GetOTBookingList_DTO();
          this.GetOTBookingList();
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Success, [`Booking Cancelled Successfully.`]);
        }
        else {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, [`Unable to cancel Booking.`]);
        }
      },
        (err: DanpheHTTPResponse) => {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Exception: ${err.ErrorMessage}`]);
        }
      );
  }

  ConfirmOTBooking(): void {
    this._otBlService.ConfirmOTBooking(this.SelectedOTBooking.OTBookingId)
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this.GetOTBookingList();
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Success, [`Booking Confirmed.`]);
        }
        else {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, [`Unable to Confirm Booking.`]);
        }
      },
        (err: DanpheHTTPResponse) => {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Exception: ${err.ErrorMessage}`]);
        }
      );
  }

  CheckInOTBooking(): void {
    this._otBlService.CheckInOTBooking(this.SelectedOTBooking.OTBookingId)
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this.GetOTBookingList();
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Success, [`Checked In Successfully.`]);
        }
        else {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, [`Unable to Confirm Booking.`]);
        }
      },
        (err: DanpheHTTPResponse) => {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Exception: ${err.ErrorMessage}`]);
        }
      );
  }

  FocusOutFromDatePicker(event: any): void {
    if (event) {
      this.GoToDatePick = false;
      this.GoToNext('Diagnosis');   //to be changed
    }
  }

  GoToNext(idToSelect: string): void {
    if (document.getElementById(idToSelect)) {
      let nextEl = <HTMLInputElement>document.getElementById(idToSelect);
      nextEl.focus();
    }
  }

  HandleDateSelection(): void {
    const bookedForDate = new Date(this.RescheduledDate);
    const currentDate = new Date(this.GetCurrentDate());
    if (bookedForDate < currentDate) {
      this.BackDateError = true;
    } else {
      this.BackDateError = false;
    }
  }

  GetCurrentDate(): string {
    const currentDate = new Date();
    return this._datePipe.transform(currentDate, 'yyyy-MM-ddTHH:mm');
  }

  RescheduleOTBookingDate(): void {
    this.HandleDateSelection();
    if (this.BackDateError) {
      return;
    }
    this._otBlService.CheckForProceduresBookedForDateCollision(this.SelectedOTBooking.PatientVisitId, this.RescheduledDate)
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          if (res.Results === false) {
            this.PostRescheduleOTBookingDate();
          }
          else if (res.Results === true) {
            this._messageBoxService.showMessage(ENUM_MessageBox_Status.Warning, [`This Patient has another booking at the same time.`]);
            return;
          }
        }
        else if (res.Results === true) {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, [`Exception: ${res.ErrorMessage}`]);
        }
      },
        (err: DanpheHTTPResponse) => {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Exception: ${err.ErrorMessage}`]);
        }
      );
  }

  PostRescheduleOTBookingDate(): void {
    this._otBlService.RescheduleOTBooking(this.SelectedOTBooking.OTBookingId, this.RescheduledDate,)
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this.CloseReschedulePage();
          this.SelectedOTBooking = new GetOTBookingList_DTO();
          this.GetOTBookingList();
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Success, [`OT Booking Rescheduled Successfully.`]);
        }
        else {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, [`Unable to Reschedule OT Booking.`]);
        }
      },
        (err: DanpheHTTPResponse) => {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Exception: ${err.ErrorMessage}`]);
        }
      );
  }

  OnCheckListCallBack(): void {
    this.ShowCheckListPage = false;
    this.SelectedOTBooking = new GetOTBookingList_DTO();
  }

  OnBookingStatusChange(event): void {
    let status = event.target.value;
    if (status) {
      this.Status = status;
    }
  }

  OnFromToDateChange($event): void {
    if ($event) {
      this.FromDate = $event.fromDate;
      this.ToDate = $event.toDate;
      this.DateRange = (this.IsDateFilter ? ("<b>Date:</b>&nbsp;" + this.FromDate + "&nbsp;<b>To</b>&nbsp;" + this.ToDate) : "");
    }
  }

  OnDateFilterChange($event: any): void {
    this.DateRange = (this.IsDateFilter ? ("<b>Date:</b>&nbsp;" + this.FromDate + "&nbsp;<b>To</b>&nbsp;" + this.ToDate) : "");
  }

  BackToOTBookingList(): void {
    this.ShowBookingList = true;
    this.ShowBookingDetail = false;
    //! Sanjeev' Either to show the earlier load list or not still to confirm and handle. AND reset necessary objects
    this.SelectedOTBooking = new GetOTBookingList_DTO();
    this.GetOTBookingList();
  }

  EditBookingDetailsFromConcludePage($event): void {
    if ($event && $event.EditBookingDetailsFromConcludePage) {
      this.ShowConcludePage = false;
      this.IsUpdate = true;
      this.ShowBookingList = false;
      this.ShowBookingDetail = true;
    }
  }

}
