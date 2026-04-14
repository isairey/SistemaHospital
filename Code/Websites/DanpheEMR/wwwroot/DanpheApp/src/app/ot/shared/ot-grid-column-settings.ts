import * as moment from "moment/moment";
import { ENUM_OT_BookingStatus, ENUM_OT_CheckListInputType } from "../../shared/shared-enums";
import { UploadedFile_DTO } from "./dto/uploaded-file.dto";
export class OTGridColumnSettings {
  constructor() { }

  //#region OTBookingList
  public OTBookingList = [
    { headerName: "Hospital Number", field: "HospitalNumber", width: 150 },
    { headerName: "Patient Name", field: "PatientName", width: 250 },
    { headerName: "Age/Sex", field: "AgeSex", width: 100, },
    { headerName: "Incoming Ward", field: "IncomingWard", width: 100, },
    { headerName: "OT Scheduled Date/Time", field: "BookedForDate", width: 200, cellRenderer: this.BookedForDateTimeRenderer },
    { headerName: "Expected Duration (in hours)", field: "OTExpectedDuration", width: 100, },
    { headerName: "Surgery Name", field: "SurgeryName", width: 200 },
    { headerName: "Priority", field: "OTPriority", width: 100 },
    { headerName: "Surgery Type", field: "SurgeryType", width: 100 },
    { headerName: "BillingItems", field: "BillingItems", width: 300, },
    { headerName: "Surgeon", field: "Surgeon", width: 150 },
    { headerName: "Status", field: "Status", width: 110 },
    { headerName: "OT Concluded Date/Time", field: "OTConcludeTime", width: 200, cellRenderer: this.OTConcludeDateTimeRenderer },
    { headerName: "OT Schedule", field: "OTSchedule", width: 100 },
    { headerName: "Remarks", field: "Remarks", width: 100 },
    {
      headerName: "Actions",
      field: "",
      width: 400,
      cellRenderer: this.BookingListActionsRenderer.bind(this),
    },
  ];



  BookingListActionsRenderer(params: any): string {
    const status = params.data.Status;
    let actionsHtml = '';
    if (status) {
      if (status === ENUM_OT_BookingStatus.Cancelled || status === ENUM_OT_BookingStatus.Concluded) {
        actionsHtml += '<a danphe-grid-action="view" class="grid-action">View</a>';
      }
      else {
        actionsHtml += '<a danphe-grid-action="view-edit" class="grid-action">View/Edit</a>';
      }
    }
    if (status === ENUM_OT_BookingStatus.Booked) {
      actionsHtml += '<a danphe-grid-action="confirm" class="grid-action" style="background-color: green !important;">Confirm</a>';
    }
    else if (status === ENUM_OT_BookingStatus.Scheduled) {
      actionsHtml += '<a danphe-grid-action="check-in" class="grid-action" style="background-color: orange !important;">CheckIn</a>';
    }
    else if (status === ENUM_OT_BookingStatus.InProgress) {
      actionsHtml += '<a danphe-grid-action="conclude" class="grid-action" style="background-color: red !important;">Conclude</a>';
    }
    if (status === ENUM_OT_BookingStatus.Booked || status === ENUM_OT_BookingStatus.Scheduled || status === ENUM_OT_BookingStatus.InProgress) {
      actionsHtml += `
        <div class="dropdown" style="display:inline-block;">
          <button class="dropdown-toggle grid-btnCstm" type="button" data-toggle="dropdown">...
            <span class="caret"></span>
          </button>
          <ul class="dropdown-menu grid-ddlCstm">
      `;
      if (status !== ENUM_OT_BookingStatus.InProgress) {
        actionsHtml += '<li><a danphe-grid-action="reschedule">Reschedule</a></li>';
      }
      actionsHtml += '<li><a danphe-grid-action="cancel">Cancel</a></li>';
    }
    actionsHtml += `
      </ul>
    </div>
  `;
    return actionsHtml;
  }

  BookedForDateTimeRenderer(params) {
    return moment(params.data.BookedForDate).format("YYYY-MM-DD HH:mm A");
  }
  OTConcludeDateTimeRenderer(params) {
    return moment(params.data.OTConcludeTime).format("YYYY-MM-DD HH:mm A");
  }
  //#endregion

  //#region OTSummaryReport
  public OTSummaryReportCols = [
    { headerName: "Hospital Number", field: "HospitalNumber", width: 150 },
    { headerName: "Patient Name", field: "PatientName", width: 250 },
    { headerName: "Age/Sex", field: "AgeSex", width: 100, },
    { headerName: "Incoming Ward", field: "IncomingWard", width: 100, },
    { headerName: "OT Started Date/Time", field: "OTStartTime", width: 200, cellRenderer: this.OTSummaryScheduleDateTimeRenderer },
    { headerName: "OT Concluded Date/Time", field: "OTConcludeDateTime", width: 200, cellRenderer: this.OTSummaryConcludeDateTimeRenderer },
    { headerName: "Surgery Code", field: "SurgeryCode", width: 200 },
    { headerName: "Surgery Name", field: "SurgeryName", width: 200 },
    { headerName: "Priority", field: "Priority", width: 100 },
    { headerName: "Surgery Type", field: "SurgeryType", width: 100 },
    { headerName: "Surgeon", field: "Surgeon", width: 100 },
    { headerName: "Diagnosis", field: "Diagnosis", width: 100 },
    { headerName: "Sero Positive", field: "IsSeroPositive", width: 100 },
    { headerName: "Anaesthesias", field: "Anaesthesias", width: 100 },
    { headerName: "Machine Name", field: "MachineName", width: 100 },
    { headerName: "Machine Cost", field: "MachineCost", width: 100 },
    { headerName: "OT Schedule", field: "OTSchedule", width: 100 },
    { headerName: "Out Time Charge", field: "OutTimeCharge", width: 100 },
    { headerName: "Implants", field: "Implants", width: 100 },
    { headerName: "Implant Cost", field: "ImplantCost", width: 100 },
    { headerName: "BillingItems", field: "BillingItems", width: 300, },
    { headerName: "Surgery Amount", field: "SurgeryAmount", width: 150 },
    { headerName: "OT Remarks", field: "OTRemarks", width: 100 },
  ];


  OTSummaryScheduleDateTimeRenderer(params) {
    return moment(params.data.OTStartTime).format("YYYY-MM-DD HH:mm A");
  }
  OTSummaryConcludeDateTimeRenderer(params) {
    return moment(params.data.OTConcludeDateTime).format("YYYY-MM-DD HH:mm A");
  }
  //#endregion

  //#region OTCheckList
  public OTCheckList = [
    { headerName: "CheckListName", field: "CheckListName", width: 200 },
    { headerName: "Display Name", field: "DisplayName", width: 200 },
    { headerName: "Input Type", field: "InputType", width: 200, },
    { headerName: "Display Sequence", field: "DisplaySequence", width: 100, },
    { headerName: "Is Active", field: "IsActive", width: 100, },
    { headerName: "Is Mandatory", field: "IsMandatory", width: 100, },
    {
      headerName: "Actions",
      field: "",
      width: 150,
      cellRenderer: this.CheckListListActionsRenderer.bind(this),
    },
  ];

  CheckListListActionsRenderer(params: any): string {
    const status = params.data.Status;
    let actionsHtml = '';
    actionsHtml += '<a danphe-grid-action="edit" class="grid-action">Edit</a>';
    if (params.data.InputType === ENUM_OT_CheckListInputType.SingleSelection || params.data.InputType === ENUM_OT_CheckListInputType.MultipleSelection) {
      actionsHtml += `
    <a danphe-grid-action="add-lookup" class="grid-action">Add LookUp</a>`;
    }
    return actionsHtml;
  }
  //#endregion


  public OTBookingCheckList = [
    { headerName: "CheckList DisplayName", field: "DisplayName", width: 200 },
    { headerName: "Value", field: "CheckListValue", width: 200, cellRenderer: this.BookingCheckListValueActionsRenderer.bind(this), },
    { headerName: "Remarks", field: "Remarks", width: 200, },
    {
      headerName: "Actions",
      field: "",
      width: 200,
      cellRenderer: this.BookingCheckListActionsRenderer.bind(this),
    },
  ];

  BookingCheckListValueActionsRenderer(params: any): string {
    if (!params.data.CheckListValue || (params.data.CheckListValue && !params.data.CheckListValue.trim())) {
      return;
    }
    const inputType = params.data.InputType;
    const checkListValue = params.data.CheckListValue;
    if (inputType === ENUM_OT_CheckListInputType.File) {
      let fileData: UploadedFile_DTO = JSON.parse(checkListValue);
      return fileData.FileName;
    }
    else {
      return checkListValue;
    }
  }

  BookingCheckListActionsRenderer(params: any): string {
    if (!params.data.CheckListValue || (params.data.CheckListValue && !params.data.CheckListValue.trim())) {
      return;
    }
    const inputType = params.data.InputType;
    let actionsHtml = '';
    if (inputType === ENUM_OT_CheckListInputType.File) {
      actionsHtml += '<a danphe-grid-action="preview" class="grid-action">Preview</a>';
    }
    return actionsHtml;
  }
  //#region OTFinancialReport
  public OTFinancialReportCols = [
    { headerName: "Hospital Number", field: "HospitalNumber", width: 150 },
    { headerName: "Patient Name", field: "PatientName", width: 250 },
    { headerName: "Surgery Code", field: "SurgeryCode", width: 200 },
    { headerName: "Surgery Name", field: "SurgeryName", width: 200 },
    { headerName: "Priority", field: "Priority", width: 100 },
    { headerName: "Surgery Type", field: "SurgeryType", width: 100 },
    { headerName: "OT Schedule", field: "OTSchedule", width: 150 },
    { headerName: "Out Time Charge", field: "OutTimeCharge", width: 150 },
    { headerName: "Sero Positive", field: "IsSeroPositive", width: 120, valueFormatter: (params: any) => (params.value ? "TRUE" : "FALSE") },
    { headerName: "Surgeon", field: "Surgeon", width: 200 },
    { headerName: "Anesthesiologists", field: "Anesthesiologists", width: 250 },
    { headerName: "Anaesthesias", field: "Anaesthesias", width: 250, },
    { headerName: "Machine Name", field: "MachineName", width: 200 },
    { headerName: "Machine Cost", field: "MachineCost", width: 150 },
    { headerName: "Implants", field: "Implants", width: 200 },
    { headerName: "Implant Cost", field: "ImplantCost", width: 150 },
    { headerName: "Billing Items", field: "BillingItems", width: 300 },
    { headerName: "Surgery Amount", field: "SurgeryAmount", width: 150 },
    { headerName: "OT Remarks", field: "OTRemarks", width: 200 }
  ];

  //#endregion

}