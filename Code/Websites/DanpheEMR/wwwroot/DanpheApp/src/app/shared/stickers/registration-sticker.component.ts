import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { Router } from "@angular/router";
import * as moment from "moment";
import { CoreService } from "../../core/shared/core.service";
import { ENUM_PrintingType, PrinterSettingsModel } from "../../settings-new/printers/printer-settings.model";
import { NepaliCalendarService } from "../calendar/np/nepali-calendar.service";
import { DanpheHTTPResponse } from "../common-models";
import { CommonFunctions } from "../common.functions";
import { MessageboxService } from "../messagebox/messagebox.service";
import { ENUM_DanpheHTTPResponseText, ENUM_MessageBox_Status, ENUM_PrintSheetTemplateCodes, ENUM_PrintSheetTemplateVisitType, ENUM_VisitType, ENUM_VisitTypeFormatted } from "../shared-enums";
import { StickerBLService } from "./registration-sticker.bl.service";
import { StickerSettingsAndData } from "./shared/sticker-settings-and-data-dto.model";

@Component({
  selector: 'registration-sticker',
  templateUrl: './registration-sticker.component.html',
  styleUrls: ['./registration-sticker.component.css']
})
export class StickerComponent implements OnInit {

  @Input('patientVisitId') public PatientVisitId: number = 0;
  public StickerSettingsAndData: StickerSettingsAndData = new StickerSettingsAndData()
  public openBrowserPrintWindow: boolean = false;
  public browserPrintContentObj: any; //! Santosh, 29thMarch'23 This is any here as we do not know what data it gets
  public closePopUpAfterStickerPrint: boolean = true;
  public selectedPrinter: PrinterSettingsModel = new PrinterSettingsModel();
  public inpatientVisitType = ENUM_VisitType.inpatient;
  @Output("after-print-action")
  afterPrintAction: EventEmitter<Object> = new EventEmitter<Object>();
  public visitTime: string = "";
  public UseDynamicSticker: boolean = false;
  public DisplayPrintSheetInSticker: boolean = false;
  public PrintSheetTemplate: string = '';

  constructor(
    private stickerBLService: StickerBLService,
    private coreService: CoreService,
    private messageboxService: MessageboxService,
    public changeDetector: ChangeDetectorRef,
    public router: Router,
    public nepaliCalendarServ: NepaliCalendarService
  ) {
    this.ReadParameter();
  }

  ReadParameter(): void {
    const param = this.coreService.Parameters.find(p => p.ParameterGroupName === "Appointment" && p.ParameterName === "UseDynamicSticker");
    if (param && param.ParameterValue) {
      const paramValue = JSON.parse(param.ParameterValue);
      this.UseDynamicSticker = paramValue;
    }

    const printSheetParam = this.coreService.Parameters.find(p => p.ParameterGroupName === "Appointment" && p.ParameterName === "DisplayPrintSheetInSticker");
    if (printSheetParam && printSheetParam.ParameterValue) {
      const paramValue = JSON.parse(printSheetParam.ParameterValue);
      this.DisplayPrintSheetInSticker = paramValue;
    }
  }

  ngOnInit(): void {
    if (this.PatientVisitId > 0) {
      this.GetRegistrationStickerSettingsAndData(this.PatientVisitId);
    }
  }

  public GetRegistrationStickerSettingsAndData(PatientVisitId): void {
    this.stickerBLService.GetRegistrationStickerSettingsAndData(PatientVisitId).subscribe((res: DanpheHTTPResponse) => {
      if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
        this.StickerSettingsAndData.RegistrationStickerSettings = res.Results.StickerSettings;
        this.StickerSettingsAndData.VisitStickerData = res.Results.StickerData;
        this.StickerSettingsAndData.StickerTemplates = res.Results.StickerTemplates;
        if (this.StickerSettingsAndData.StickerTemplates) {
          const browserTemplate = this.StickerSettingsAndData.StickerTemplates.find(a => a.PrinterType === ENUM_PrintingType.browser);
          if (browserTemplate && document.getElementById('id_dynamic_registration_sticker') && this.UseDynamicSticker) {
            let sticker = document.createElement('div');
            sticker.innerHTML = browserTemplate.PrintFormat;
            document.getElementById('id_dynamic_registration_sticker').appendChild(sticker);
          }
        }
        this.visitTime = moment(this.StickerSettingsAndData.VisitStickerData.VisitDateTime).format('hh:mm A');
        this.ChoosePrintSheetTemplate();
      }
      else {
        this.messageboxService.showMessage(ENUM_MessageBox_Status.Failed, ["Cannot load Sticker data and Settings"]);
      }
    },
      err => {
        this.messageboxService.showMessage(ENUM_MessageBox_Status.Error, [err]);
      })
  }


  public print(): void {
    let dataToPrint = undefined;
    if (this.UseDynamicSticker) {
      dataToPrint = this.MakeReceipt();
    }
    this.coreService.loading = true;
    if (!this.selectedPrinter || this.selectedPrinter.PrintingType === ENUM_PrintingType.browser) {
      if (this.UseDynamicSticker) {
        this.GenerateStickerPrintBrowser(dataToPrint);
        this.coreService.loading = false;
      } else {
        this.browserPrintContentObj = document.getElementById("id_registration_sticker_printpage");
        this.openBrowserPrintWindow = false;
        this.changeDetector.detectChanges();
        this.openBrowserPrintWindow = true;
        this.coreService.loading = false;
        this.changeDetector.detectChanges();
      }
    } else if (this.selectedPrinter.PrintingType === ENUM_PrintingType.dotmatrix) {
      //-----qz-tray start----->
      this.coreService.QzTrayObject.websocket.connect()
        .then(() => {
          return this.coreService.QzTrayObject.printers.find();
        })
        .then(() => {
          var config = this.coreService.QzTrayObject.configs.create(this.selectedPrinter.PrinterName);
          let printOutType = "reg-sticker";
          let dataToPrint = this.MakeReceipt();
          return this.coreService.QzTrayObject.print(config, CommonFunctions.GetEpsonPrintDataForPage(dataToPrint, this.selectedPrinter.mh, this.selectedPrinter.ml, this.selectedPrinter.ModelName, printOutType));

        })
        .catch(function (e) {
          console.error(e);
        })
        .finally(() => {
          this.coreService.loading = false;
          this.afterPrintAction.emit();
          return this.coreService.QzTrayObject.websocket.disconnect();
        });
      //-----qz-tray end----->
    }
    else {
      this.messageboxService.showMessage(ENUM_MessageBox_Status.Error, ["Printer Not Supported."]);
      this.coreService.loading = true;
      return;
    }
  }
  GenerateStickerPrintBrowser(dataToPrint: string) {
    let iframe = document.createElement('iframe');
    document.body.appendChild(iframe);
    let documentContent = "<html><head>";
    documentContent += '</head>';
    documentContent += '<body onload="window.print()">' + dataToPrint + '</body></html>'
    let htmlToPrint = '' + '<style type="text/css">' + '.table_data {' + 'border-spacing:0px' + '}' + '</style>';
    htmlToPrint += documentContent;
    iframe.contentWindow.document.open();
    iframe.contentWindow.document.write(htmlToPrint);
    iframe.contentWindow.document.close();

    setTimeout(function () {
      document.body.removeChild(iframe);
    }, 500);
  }
  OnPrinterChanged($event) {
    this.selectedPrinter = $event;
  }

  MakeReceipt() {
    let newline = '\n';
    let finalDataToPrint = "";
    if (this.UseDynamicSticker) {
      //! making changes to print templates 
      if (this.StickerSettingsAndData.StickerTemplates && this.StickerSettingsAndData.StickerTemplates.length > 0) {
        if (!this.selectedPrinter || this.selectedPrinter.PrintingType === ENUM_PrintingType.browser) {
          const stickerTemplateForBrowser = this.StickerSettingsAndData.StickerTemplates.find(s => s.PrinterType === ENUM_PrintingType.browser);
          if (stickerTemplateForBrowser) {
            finalDataToPrint = stickerTemplateForBrowser.PrintFormat;
          }
        }
        else if (this.selectedPrinter.PrintingType === ENUM_PrintingType.dotmatrix) {
          const stickerTemplateForDotmatrix = this.StickerSettingsAndData.StickerTemplates.find(s => s.PrinterType === ENUM_PrintingType.dotmatrix);
          if (stickerTemplateForDotmatrix) {
            finalDataToPrint = stickerTemplateForDotmatrix.PrintFormat;
          }
        }
      }
    } else {
      let departmentName = this.StickerSettingsAndData.VisitStickerData.DepartmentName;
      let visitTypeFormatted = this.StickerSettingsAndData.VisitStickerData.VisitTypeFormatted;
      let performerName = this.StickerSettingsAndData.VisitStickerData.PerformerName;
      let hospitalNo = this.StickerSettingsAndData.VisitStickerData.HospitalNumber;
      let visitDateLabel = this.StickerSettingsAndData.RegistrationStickerSettings.VisitDateLabel;
      let visitDate = moment(this.StickerSettingsAndData.VisitStickerData.VisitDateTime).format('YYYY-MM-DD');
      let patientName = this.StickerSettingsAndData.VisitStickerData.PatientName;
      let dateOfBirth = this.StickerSettingsAndData.VisitStickerData.DateOfBirth;
      let gender = this.StickerSettingsAndData.VisitStickerData.Gender;
      let ageSex = CommonFunctions.GetFormattedAgeSex(dateOfBirth, gender);
      let showPatContactNo = this.StickerSettingsAndData.RegistrationStickerSettings.ShowPatContactNo;
      let phoneNo = this.StickerSettingsAndData.VisitStickerData.PatientPhoneNumber;
      let address = this.StickerSettingsAndData.VisitStickerData.PatientAddress;
      let showMemberNo = this.StickerSettingsAndData.RegistrationStickerSettings.ShowMemberNo;
      let memberNoLabel = this.StickerSettingsAndData.RegistrationStickerSettings.MemberNoLabel;
      let memberNo = this.StickerSettingsAndData.VisitStickerData.MemberNo;
      let showClaimCode = this.StickerSettingsAndData.RegistrationStickerSettings.ShowClaimCode;
      let claimCode = this.StickerSettingsAndData.VisitStickerData.ClaimCode;
      let showSchemeCode = this.StickerSettingsAndData.RegistrationStickerSettings.ShowSchemeCode;
      let schemeCode = this.StickerSettingsAndData.VisitStickerData.SchemeCode;
      let showIpdNo = this.StickerSettingsAndData.RegistrationStickerSettings.ShowIpdNumber;
      let IpdNo = this.StickerSettingsAndData.VisitStickerData.VisitCode;
      let showWardBedNo = this.StickerSettingsAndData.RegistrationStickerSettings.ShowWardBedNo;
      let bedNo = this.StickerSettingsAndData.VisitStickerData.BedNumber;
      let wardName = this.StickerSettingsAndData.VisitStickerData.WardName;
      let visitType = this.StickerSettingsAndData.RegistrationStickerSettings.VisitType;
      let appointmentType = this.StickerSettingsAndData.VisitStickerData.AppointmentType;
      let userName = this.StickerSettingsAndData.VisitStickerData.UserName;
      let showRegistrationCharge = this.StickerSettingsAndData.RegistrationStickerSettings.ShowRegistrationCharge;
      let ticketCharge = this.StickerSettingsAndData.VisitStickerData.TicketCharge;
      let showQueueNo = this.StickerSettingsAndData.RegistrationStickerSettings.ShowQueueNo;
      let queueNoLabel = this.StickerSettingsAndData.RegistrationStickerSettings.QueueNoLabel;
      let queueNo = this.StickerSettingsAndData.VisitStickerData.QueueNo;
      let localDate = `${this.nepaliCalendarServ.ConvertEngToNepDateString(this.StickerSettingsAndData.VisitStickerData.VisitDateTime)} BS`;
      // let visitTime = moment(this.StickerSettingsAndData.VisitStickerData.VisitDateTime).format('hh:mm');
      let visitTime = this.visitTime;//moment(this.StickerSettingsAndData.VisitStickerData.VisitDateTime).format('hh:mm A');

      finalDataToPrint += `${departmentName} `;
      finalDataToPrint += visitTypeFormatted ? `/${visitTypeFormatted}` : ``;
      finalDataToPrint += performerName ? `/${performerName}` : ``;
      finalDataToPrint += newline;

      finalDataToPrint += `Hospital No.: ${hospitalNo}   `;
      // finalDataToPrint += `${visitDateLabel}: ${visitDateTime}`;
      finalDataToPrint += newline;

      finalDataToPrint += `Patient:${patientName}  ${ageSex}`
      finalDataToPrint += newline;

      let contactAndAddress = showPatContactNo ? `Contact:(${phoneNo})  ${address}` : ``;
      finalDataToPrint += contactAndAddress;
      finalDataToPrint += contactAndAddress !== `` ? newline : ``;

      finalDataToPrint += showMemberNo ? `${memberNoLabel}${memberNo}   ` : ``;
      finalDataToPrint += showClaimCode ? `Claim#${claimCode}   ` : ``;
      finalDataToPrint += showSchemeCode ? `Type:${schemeCode}   ` : ``;
      finalDataToPrint += (showClaimCode || showSchemeCode) ? newline : ``;

      finalDataToPrint += showIpdNo ? `IP No:${IpdNo}   ` : ``;
      finalDataToPrint += showWardBedNo ? `Ward/Bed:${wardName}/${bedNo}` : ``;
      finalDataToPrint += (showIpdNo || showWardBedNo) ? newline : ``;

      finalDataToPrint += visitType !== ENUM_VisitType.inpatient ? `${appointmentType}   ` : ``;
      finalDataToPrint += showRegistrationCharge ? `Reg.Charge:${ticketCharge}   ` : ``;
      finalDataToPrint += showQueueNo ? `${queueNoLabel}: ${queueNo}` : ``;
      finalDataToPrint += newline;
      finalDataToPrint += `User:${userName} `;
      finalDataToPrint += `${visitDateLabel}: ${visitDate}(${localDate}) ${visitTime}`;
    }
    return finalDataToPrint
  }

  PrintSheet() {
    let documentContent = "<html><head>";
    documentContent += '</head>';
    documentContent += '<body onload="window.print()">' + this.PrintSheetTemplate + '</body></html>'
    const iframe = document.createElement('iframe');
    document.body.appendChild(iframe);
    iframe.contentWindow.document.open();
    iframe.contentWindow.document.write(documentContent);
    iframe.contentWindow.document.close();

    setTimeout(function () {
      document.body.removeChild(iframe);
    }, 500);
  }


  ChoosePrintSheetTemplate() {
    if (this.StickerSettingsAndData && this.StickerSettingsAndData.VisitStickerData && this.StickerSettingsAndData.VisitStickerData.VisitTypeFormatted) {
      switch (this.StickerSettingsAndData.VisitStickerData.VisitTypeFormatted) {
        case ENUM_VisitTypeFormatted.Inpatient:
          this.SetPrintSheetTemplate(ENUM_PrintSheetTemplateVisitType.Inpatient, this.StickerSettingsAndData.VisitStickerData.DepartmentCode);
          break;
        case ENUM_VisitTypeFormatted.Outdoor:
        case ENUM_VisitTypeFormatted.Outpatient:
          this.SetPrintSheetTemplate(ENUM_PrintSheetTemplateVisitType.Outpatient, this.StickerSettingsAndData.VisitStickerData.DepartmentCode);
          break;
        case ENUM_VisitTypeFormatted.Emergency:
          this.SetPrintSheetTemplate(ENUM_PrintSheetTemplateVisitType.Emergency, '');
          break;
      }
    }

  }
  SetPrintSheetTemplate(department: string, departmentCode: string) {
    //if department code is present then load department template else load default template
    //if department template is not present then load default template

    const defaultTemplateCode = (ENUM_PrintSheetTemplateCodes.TemplatePrefix + "_" + department + "_" + ENUM_PrintSheetTemplateCodes.DefaultTemplateSuffix);
    const departmentTemplateCode = (ENUM_PrintSheetTemplateCodes.TemplatePrefix + "_" + department + "_" + departmentCode);
    (async (): Promise<void> => {
      try {
        if (this.DisplayPrintSheetInSticker) {
          if (departmentCode) {
            await this.GetTemplateByTemplateCode(departmentTemplateCode, this.PatientVisitId);
            if (!this.PrintSheetTemplate) {
              await this.GetTemplateByTemplateCode(defaultTemplateCode, this.PatientVisitId);
            }
          }
          else
            await this.GetTemplateByTemplateCode(defaultTemplateCode, this.PatientVisitId);
        }
      } catch (err) {
        this.messageboxService.showMessage(ENUM_MessageBox_Status.Error, [`Error: ${err.ErrorMessage}`]);
      }
    })();
  }

  async GetTemplateByTemplateCode(templateCode: string, patientVistId: number): Promise<void> {
    try {
      const res: DanpheHTTPResponse = await this.stickerBLService.GetTemplateByTemplateCode(templateCode, patientVistId).toPromise();
      if (res.Status === ENUM_DanpheHTTPResponseText.OK && res.Results) {
        if (res.Results && res.Results.TemplateHTML)
          this.PrintSheetTemplate = res.Results.TemplateHTML;
        else
          this.PrintSheetTemplate = '';
      }
    }
    catch (err) {
      this.messageboxService.showMessage(ENUM_MessageBox_Status.Error, [err]);
    }
  }

  public GetSortedPatientAddress(patientData: any): string {
    return this.coreService.SortPatientAddress(patientData);
  }
}
