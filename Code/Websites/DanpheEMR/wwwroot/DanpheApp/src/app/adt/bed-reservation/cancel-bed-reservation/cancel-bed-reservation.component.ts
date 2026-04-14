import { Component } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { CoreService } from "../../../core/shared/core.service";
import { SecurityService } from "../../../security/shared/security.service";
import { DanpheHTTPResponse } from "../../../shared/common-models";
import { NepaliDateInGridParams } from "../../../shared/danphe-grid/NepaliColGridSettingsModel";
import { GridEmitModel } from "../../../shared/danphe-grid/grid-emit.model";
import { MessageboxService } from "../../../shared/messagebox/messagebox.service";
import { ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status } from "../../../shared/shared-enums";
import { CancelBedReservation_DTO } from "../../shared/DTOs/cancel-bed-reservation.dto";
import { ADTGridColumnSettings } from "../../shared/adt-grid-column-settings";
import { ADT_BLService } from "../../shared/adt.bl.service";
import { BedReservationInfo } from "../../shared/bed-reservation-info.model";

@Component({
  templateUrl: "./cancel-bed-reservation.component.html"
})

export class AdtCancelBedReservationComponent {
  public reservedBedListGridColumns: typeof ADTGridColumnSettings.prototype.ReservedBedList;
  public reservedList: Array<BedReservationInfo> = [];
  public NepaliDateInGridSettings: NepaliDateInGridParams = new NepaliDateInGridParams();
  public adtGriColumns: ADTGridColumnSettings = null;
  public loading: boolean = false;
  public cancleDialogBox: boolean = false;
  public reservationDetails: CancelBedReservation_DTO = new CancelBedReservation_DTO();
  public BedReservationCancellationValidator: FormGroup = null;
  public ReservedBedInfoId: number = 0;

  constructor(private admissionBLService: ADT_BLService,
    private msgBoxServ: MessageboxService,
    private coreService: CoreService,
    private securityService: SecurityService,

  ) {
    this.adtGriColumns = new ADTGridColumnSettings(this.coreService, this.securityService);
    this.reservedBedListGridColumns = this.adtGriColumns.ReservedBedList;
    const _formBuilder = new FormBuilder();
    this.BedReservationCancellationValidator = _formBuilder.group({
      'CancellationRemarks': ['', Validators.required],
    });
    this.GetReservedBedList();
  }

  Cancel() {
    this.reservationDetails.CancellationRemarks = this.BedReservationCancellationValidator.get('CancellationRemarks').value;
    for (var i in this.BedReservationCancellationValidator.controls) {
      this.BedReservationCancellationValidator.controls[i].markAsDirty();
      this.BedReservationCancellationValidator.controls[i].updateValueAndValidity();
    }
    if (this.IsValidCheck(undefined, undefined)) {
      this.admissionBLService.CancelBedReservation(this.reservationDetails).finally(() => this.loading = false)
        .subscribe((res: DanpheHTTPResponse) => {
          if (res.Status == ENUM_DanpheHTTPResponses.OK) {
            if (res.Results) {
              this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Success, ["Reserved Bed Is Cancelled"]);
              this.GetReservedBedList();
              this.BedReservationCancellationValidator.get('CancellationRemarks').setValue('');
              this.cancleDialogBox = false;
            }
            else {
              this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ["Unable to Cancel Reserved Bed"]);

            }
          } else {
            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ["Unable to Cancel Reserved Bed"]);
          }
        },
          err => {
            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, [err.ErrorMessage]);
          });

    } else {
      this.loading = false;
      this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Warning, ['Please Enter Remarks ']);
    }
  }
  ReservedListGridActions($event: GridEmitModel) {
    switch ($event.Action) {
      case "cancel": {
        this.cancleDialogBox = true;
        this.reservationDetails = $event.Data;
        break;

      }
    }
  }
  GetReservedBedList() {
    this.admissionBLService.GetReservedBedList()
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status == ENUM_DanpheHTTPResponses.OK) {
          this.reservedList = res.Results;
          // this.allItemList = res.Results;
        }
        else {
          this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, [res.ErrorMessage]);
        }
      },
        err => {
          this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, [err.ErrorMessage]);
        });
  }
  ClosePopUp() {
    this.cancleDialogBox = false;
  }
  public IsValidCheck(fieldName, validator): boolean {
    if (fieldName == undefined) {
      return this.BedReservationCancellationValidator.valid;
    }
    else
      return !(this.BedReservationCancellationValidator.hasError(validator, fieldName));
  }
}
