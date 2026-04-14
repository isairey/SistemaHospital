import { DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { CoreService } from '../../../../core/shared/core.service';
import { OTConcludeBookingModel } from '../../../../ot/shared/dto/ot-conclude-booking.model';
import { OperationTheatreBLService } from '../../../../ot/shared/ot.bl.service';
import { DanpheHTTPResponse } from '../../../../shared/common-models';
import { MessageboxService } from '../../../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status, ENUM_OT_BookingStatus } from '../../../../shared/shared-enums';

@Component({
  selector: 'ot-conclude-detail',
  templateUrl: './ot-conclude-detail.component.html',
  styleUrls: ['./ot-conclude-detail.component.css'],
})

export class OTConcludeDetailComponent implements OnInit {

  @Input('booked-for-date') BookedForDate: string = "";
  @Input('ot-booking-id') OTBookingId: number = 0;
  @Input('is-view-only') IsViewOnly: boolean = false;
  @Output() CallBackCloseConcludeBooking: EventEmitter<Object> = new EventEmitter<Object>();
  @Output() CallBackEditBookingFromConcludePage: EventEmitter<Object> = new EventEmitter<Object>();
  ConcludeBooking = new OTConcludeBookingModel();
  confirmationTitle: string = "Confirm !";
  confirmationMessage: string = "Are you sure you want to update Conclude Details?";
  loading: boolean = false;
  ShowConcludeDetail: boolean = false;
  ConcludeBookingValidator: FormGroup;
  FutureOTStartDateError: boolean = false;
  FutureOTConcludeDateError: boolean = false;
  OTStartDateError: boolean = false;

  constructor(
    public coreService: CoreService,
    private _otBLService: OperationTheatreBLService,
    private _messageBoxService: MessageboxService,
    private _datePipe: DatePipe,
  ) {
    this.ConcludeBooking = new OTConcludeBookingModel();
    this.ConcludeBookingValidator = this.ConcludeBooking.ConcludeBookingValidator;
    // this.IsViewOnly = false; //! As of now making all the fields editable by the user.
  }

  ngOnInit(): void {

    (async () => {
      try {
        await this.GetConcludeDetailByOTBookingId();
        // if (this.IsViewOnly) {
        //   await this.GetConcludeDetailByOTBookingId();
        // } {
        //   this.ShowConcludeDetail = true;
        // }
      } catch (err) {
        this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Error: ${err.ErrorMessage}`]);
      }
    })();
  }

  FocusOutFromDatePicker(event: any): void {
    if (event) {
      // this.GoToDatePick = false;
      this.GoToNext('some_id');   //to be changed
    }
  }

  GoToNext(idToSelect: string) {
    const nextElement = document.getElementById(idToSelect) as HTMLInputElement;
    if (nextElement) {
      nextElement.focus();
    }
  }

  HandleDateSelection(): void {
    // ! It'll be used later. Don't remove code.
    // if (!this.ConcludeBookingValidator.get('OTStartTime').value) {
    //   return;
    // }
    // const otBookedForDate = new Date(this.BookedForDate);
    // const otStartDateTime = new Date(this.ConcludeBookingValidator.get('OTStartTime').value);
    // const otConcludeDateTime = new Date(this.ConcludeBooking.OTConcludeTime ? this.ConcludeBooking.OTConcludeTime : this.GetCurrentDate());
    // const currentDateTime = new Date(this.GetCurrentDate());
    // this.OTStartDateError = false;
    // this.FutureOTConcludeDateError = false;
    // if (otStartDateTime > currentDateTime) {
    //   this.FutureOTStartDateError = true;
    // }
    // else {
    //   this.FutureOTStartDateError = false;
    // }
    // if (otConcludeDateTime > currentDateTime) {
    //   this.FutureOTConcludeDateError = true;
    // }
    // else {
    //   this.FutureOTConcludeDateError = false;
    // }
    // if ((otConcludeDateTime < otStartDateTime) || (otStartDateTime < otBookedForDate)) {
    //   this.OTStartDateError = true;
    // }
    // else {
    //   this.OTStartDateError = false;
    // }
  }

  GetCurrentDate(): string {
    const currentDate = new Date();
    return this._datePipe.transform(currentDate, 'yyyy-MM-ddTHH:mm');
  }

  handleConfirm(): void {
    this.loading = true;
    // ! Done for removing date validation while Concluding OT Booking.
    // if (this.FutureOTStartDateError || this.FutureOTConcludeDateError || this.OTStartDateError) {
    //   this.loading = false;
    //   this._messageBoxService.showMessage(ENUM_MessageBox_Status.Warning, [`Date/Time Validation Error.`]);
    //   return;
    // }
    this.ConcludeOTBooking();
  }

  handleCancel(): void {
    this.loading = false;
  }

  ConcludeOTBooking(): void {
    this.ConcludeBooking.OTStartTime = this.ConcludeBookingValidator.get('OTStartTime').value;
    this._otBLService.ConcludeOTBooking(this.OTBookingId, this.ConcludeBooking)
      .finally((): void => {
        this.loading = false;
      })
      .subscribe((res: DanpheHTTPResponse): void => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          if (res.Results && res.Results.toLowerCase() === ENUM_OT_BookingStatus.Concluded.toLocaleLowerCase()) {
            this.CallBackCloseConcludeBooking.emit(res.Results);
          }
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Success, [`Conclude Detail Updated Successfully.`]);
        }
        else {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, [`Unable to Conclude Booking.`]);
        }
      },
        (err: DanpheHTTPResponse): void => {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Exception: ${err.ErrorMessage}`]);
        }
      );
  }

  async GetConcludeDetailByOTBookingId(): Promise<void> {
    try {
      const res: DanpheHTTPResponse = await this._otBLService.GetConcludeDetailByOTBookingId(this.OTBookingId).toPromise();
      if (res.Status === ENUM_DanpheHTTPResponses.OK) {
        if (res.Results) {
          this.ConcludeBooking = res.Results;
          // this.ConcludeBooking.OTStartTime = this.BookedForDate;
          this.ConcludeBooking.OTStartTime = this.ConcludeBooking.OTStartTime ? this.ConcludeBooking.OTStartTime : this.BookedForDate;
          this.ConcludeBooking.OTConcludeTime = this.ConcludeBooking.OTConcludeTime ? this.ConcludeBooking.OTConcludeTime : this.GetCurrentDate();
          this.ShowConcludeDetail = true;
        }
        else {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`Conclude detail is empty.`]);
        }
      }
    }
    catch (err) {
      throw new Error(err);
    }
  }

  EditBookingDetailsFromConcludePage(): void {
    this.ShowConcludeDetail = false;
    this.CallBackEditBookingFromConcludePage.emit({ EditBookingDetailsFromConcludePage: true });
  }

}