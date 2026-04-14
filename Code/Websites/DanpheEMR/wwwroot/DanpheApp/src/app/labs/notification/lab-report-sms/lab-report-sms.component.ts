import { Component } from "@angular/core";
import html2canvas from "html2canvas";
import * as jsPDF from "jspdf";
import * as moment from "moment";
import { CoreService } from "../../../core/shared/core.service";
import { SecurityService } from "../../../security/shared/security.service";
import { DanpheHTTPResponse } from "../../../shared/common-models";
import { CommonFunctions } from "../../../shared/common.functions";
import { MessageboxService } from "../../../shared/messagebox/messagebox.service";
import { RouteFromService } from "../../../shared/routefrom.service";
import { ENUM_DanpheHTTPResponses, ENUM_DanpheHTTPResponseText, ENUM_LabOrderStatus, ENUM_MessageBox_Status } from "../../../shared/shared-enums";
import { LabReportVM } from "../../reports/lab-report-vm";
import { LabReportSendSMS_DTO, LabReportSendSMSPatientInfo_DTO } from "../../shared/DTOs/lab-report-send-sms.dto";
import { LabReportSMS_DTO } from "../../shared/DTOs/lab-report-sms.dto";
import { LabReportUploadConfigParamDTO } from "../../shared/DTOs/lab-report-upload-config-param.dto";
import { LabComponentModel } from "../../shared/lab-component-json.model";
import { LoginToTelemed } from "../../shared/labMasterData.model";
import { LabsBLService } from "../../shared/labs.bl.service";

@Component({
  selector: 'lab-report-sms',
  templateUrl: './lab-report-sms.component.html'
})
export class LabReportSMSComponent {
  public filteredPatientList: Array<LabReportSMS_DTO> = new Array<LabReportSMS_DTO>();
  public patientList: Array<LabReportSMS_DTO> = new Array<LabReportSMS_DTO>();
  public loading: boolean = false;;
  public searchString: string = null;
  public page: number = 1;
  public selectAll: boolean = false;
  public smsSentStatus: string = Sms_SendStatus.SendPending;
  public resultVerifiedOn: string = "";
  public labReportSendSMSDTO = new LabReportSendSMS_DTO();
  public showSendSMSPopUp: boolean = false;
  public labGeneralReportSMSConfig = {
    AllowToEditText: false,
    MaxCharacterLength: 0,
    SmsText: "",
    MaxPhoneNumCountInSingleBatch: 0
  };

  public labVerificationConfig = {
    EnableVerificationStep: false,
    VerificationLevel: 0,
    PreliminaryReportSignature: "",
    ShowVerifierSignature: false,
    PreliminaryReportText: ""
  }

  public showReport: boolean = false;
  public requisitionIdList = [];

  public TeleMedForm = {
    phoneNumber: "",
    firstName: "",
    lastName: "",
    email: ""
  }

  public labReportFormat: string = 'format1';
  public templateReport: Array<LabReportVM> = [];
  public singleReport: LabReportVM;
  public LabHeader: any = null;
  public showHeader: boolean = false;
  public showRangeInRangeDescription: boolean = false;
  public defaultColumns = { "Name": true, "Result": true, "Range": true, "Method": false, "Unit": true, "Remarks": false };
  public formData = new FormData();
  public Login = new LoginToTelemed();
  public TeleMedicineConfiguration: any;
  public IsTeleMedicineEnabled: boolean = false;
  public interval: any;
  public showReUploadPopup: boolean = false;
  public selectedLabReportSMS_DTO: LabReportSMS_DTO = new LabReportSMS_DTO();

  public fromDate: string = null;
  public toDate: string = null;
  public LabReportUploadConfigParam = new LabReportUploadConfigParamDTO();

  constructor(private messageBoxService: MessageboxService, public labBlService: LabsBLService,
    public coreService: CoreService, public routeFrom: RouteFromService, public labBLService: LabsBLService,
    public securityService: SecurityService) {
    this.ReadParameter();
  }

  ngOnInit() {
    this.resultVerifiedOn = moment().format("YYYY-MM-DD");//initial assign to Today's Date.
    // this.GetSMSApplicablePatientList();
  }

  OnFromToDateChange($event): void {
    if ($event) {
      this.fromDate = $event.fromDate;
      this.toDate = $event.toDate;
    }
  }
  public ReadParameter() {
    this.LabHeader = this.coreService.GetLabReportHeaderSetting();
    this.showRangeInRangeDescription = this.coreService.EnableRangeInRangeDescriptionStep();
    this.showHeader = this.LabHeader.showLabReportHeader;
    let param = this.coreService.Parameters.find(a => a.ParameterGroupName === 'LAB' && a.ParameterName === 'LabGeneralReportSMSSettings');
    if (param) {
      let paramValue = JSON.parse(param.ParameterValue);
      this.labGeneralReportSMSConfig = paramValue;
      this.labGeneralReportSMSConfig.AllowToEditText = paramValue.AllowToEditText === "true" ? true : false;
    }
    this.labReportSendSMSDTO.SMSText = this.labGeneralReportSMSConfig.SmsText;
    this.labReportSendSMSDTO.MaxPhoneNumCountInSingleBatch = +this.labGeneralReportSMSConfig.MaxPhoneNumCountInSingleBatch;

    let verificationParam = this.coreService.Parameters.find(a => a.ParameterGroupName === 'LAB' && a.ParameterName === 'LabReportVerificationNeededB4Print');
    if (verificationParam) {
      this.labVerificationConfig = JSON.parse(verificationParam.ParameterValue);
    }
    this.labReportFormat = this.coreService.GetLabReportFormat();

    const labReportUploadConfigParam = this.coreService.Parameters.find(a => a.ParameterGroupName === "LAB" && a.ParameterName === "LabReportUploadConfig");
    if (labReportUploadConfigParam) {
      const paramValue = labReportUploadConfigParam.ParameterValue;
      if (paramValue) {
        this.LabReportUploadConfigParam = JSON.parse(paramValue);
      }
    }

    if (this.LabReportUploadConfigParam.EnableFileUpload && this.LabReportUploadConfigParam.UsePatientPortal) {
      let TeleMedicineConfig = this.coreService.Parameters.find(p => p.ParameterGroupName == "TeleMedicine" && p.ParameterName == "DanpheConfigurationForTeleMedicine");
      if (TeleMedicineConfig) {
        this.TeleMedicineConfiguration = JSON.parse(TeleMedicineConfig.ParameterValue);
        this.Login.PhoneNumber = this.TeleMedicineConfiguration.PhoneNumber;
        this.Login.Password = this.TeleMedicineConfiguration.Password;
        this.IsTeleMedicineEnabled = JSON.parse(this.TeleMedicineConfiguration.IsTeleMedicineEnabled);
        if (this.IsTeleMedicineEnabled) {
          this.TeleMedLogin();
          this.interval = setInterval(() => {
            this.TeleMedLogin();
          }, this.TeleMedicineConfiguration.TokenExpiryTimeInMS)
        }
      }
    }
  }

  public TeleMedLogin() {
    this.labBLService.TeleMedLogin(this.TeleMedicineConfiguration.TeleMedicineBaseUrl, this.Login).subscribe(res => {
      let token = res.token;
      sessionStorage.removeItem('TELEMED_Token');
      sessionStorage.setItem('TELEMED_Token', token);
    },
      err => {
        console.log(err.ErrorMessage);
      }
    );
  }

  ngOnDestroy() {
    if (this.interval)
      clearInterval(this.interval);
  }

  public GetSMSApplicablePatientList(): void {
    this.selectAll = false;
    this.filteredPatientList = new Array<LabReportSMS_DTO>();
    this.labReportSendSMSDTO.PatientInfo = [];
    this.loading = true;
    this.labBlService.GetAllSMSApplicablePatientList(this.fromDate, this.toDate)
      .finally(() => { this.loading = false; })
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
          if (res.Results && res.Results.length > 0) {
            this.patientList = res.Results;
            this.ProcessData();
            this.OnSMSSendStatusChange();
          }
          else {
            this.patientList = this.filteredPatientList = [];
            this.messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`No Data Available for Given Date`]);
          }
        }
      },
        (err: DanpheHTTPResponse) => {
          this.messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Error : ${err.ErrorMessage}`]);
        })
  }

  public ProcessData() {
    this.patientList.forEach(pat => {
      let splitedTests = pat.TestNamesCSV.split(",");
      let verifiedTests = splitedTests.filter(a => this.labVerificationConfig.EnableVerificationStep ? a.includes(ENUM_LabOrderStatus.ReportGenerated) : a.includes(ENUM_LabOrderStatus.ReportGenerated) || a.includes(ENUM_LabOrderStatus.ResultAdded));
      let pendingTests = splitedTests.filter(a => this.labVerificationConfig.EnableVerificationStep ? a.includes(ENUM_LabOrderStatus.Pending) || a.includes(ENUM_LabOrderStatus.ResultAdded) : a.includes(ENUM_LabOrderStatus.Pending));
      let VTests = verifiedTests.map(a => {
        return a.substring(0, a.indexOf(";"));
      });
      pat.VerifiedTestNamesCSV = VTests.join(",");
      let PTests = pendingTests.map(b => {
        return b.substring(0, b.indexOf(";"));
      });
      pat.PendingTestNamesCSV = PTests.join(",");

      let splitedRequisitions = pat.RequisitionsCSV.split(",");
      let verifiedRequsitions = splitedRequisitions.filter(a => this.labVerificationConfig.EnableVerificationStep ? a.includes(ENUM_LabOrderStatus.ReportGenerated) : a.includes(ENUM_LabOrderStatus.ReportGenerated) || a.includes(ENUM_LabOrderStatus.ResultAdded));
      let VRequsitions = verifiedRequsitions.map(a => {
        return a.substring(0, a.indexOf(";"));
      });
      pat.VerifiedRequisitionsCSV = VRequsitions.join(",");
    });
  }

  public SendLabReportSMS(): void {
    this.loading = true;
    if (this.labReportSendSMSDTO.PatientInfo.length > 0) {
      this.labBlService.SendGeneralLabReportSMS(this.labReportSendSMSDTO)
        .finally(() => {
          this.CloseSendSMSPopUp();
          this.GetSMSApplicablePatientList();
          this.loading = false;
        })
        .subscribe((res: DanpheHTTPResponse) => {
          if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
            this.messageBoxService.showMessage(ENUM_MessageBox_Status.Success, [`Lab Report SMS is Successfully Send.`]);
          }
          else {
            this.messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Unable to Send SMS Notification.`]);
          }
        },
          (err: DanpheHTTPResponse) => {
            this.messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Exception: ${err.ErrorMessage}`]);
          });
    }
  }

  public OpenSendSMSPopUp(): void {
    this.showSendSMSPopUp = true;
  }

  public CloseSendSMSPopUp(): void {
    this.ReadParameter();
    this.showSendSMSPopUp = false;
  }
  public HandleSelectAllCheckBox(event) {
    if (event && event.currentTarget.checked) {
      this.labReportSendSMSDTO.PatientInfo = [];
      this.filteredPatientList.filter(a => a.IsSmsSend == false && a.IsPhoneNumberValid == true).slice(0, 500).forEach((item, index) => {
        item.IsSelected = true;
        let patDetail = new LabReportSendSMSPatientInfo_DTO();
        patDetail.patientId = item.PatientId;
        patDetail.PhoneNumber = item.PhoneNumber;
        patDetail.LabRequisitions = item.VerifiedRequisitionsCSV.split(",").map(Number);
        this.labReportSendSMSDTO.PatientInfo.push(patDetail);
      });
    }
    else {
      this.filteredPatientList.map(a => a.IsSelected = false);
      this.labReportSendSMSDTO.PatientInfo = [];
    }
  }

  public SelectPatient(event, patInfo: LabReportSMS_DTO) {
    if (event) {
      if (event && event.srcElement.localName === "button") {
        return;
      }
      let index = this.labReportSendSMSDTO.PatientInfo.findIndex(a => a.patientId === patInfo.PatientId);
      if (index >= 0) {
        this.labReportSendSMSDTO.PatientInfo.splice(index, 1);
      }
      else {
        if (this.labReportSendSMSDTO.PatientInfo.length < 500) {
          let item = this.filteredPatientList.find(a => a.PatientId === patInfo.PatientId);
          let patDetail = new LabReportSendSMSPatientInfo_DTO();
          if (item.IsSmsSend === false && item.IsPhoneNumberValid) {
            patDetail.patientId = item.PatientId;
            patDetail.PhoneNumber = item.PhoneNumber;
            patDetail.LabRequisitions = item.VerifiedRequisitionsCSV.split(",").map(Number);
            this.labReportSendSMSDTO.PatientInfo.push(patDetail);
          }
        }
        else {
          this.messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`You are only allowed to select only top 500 patient at a time to send SMS.`]);
        }
      }

      if (this.labReportSendSMSDTO.PatientInfo.length < 500) {
        let indx = this.filteredPatientList.findIndex(a => a.PatientId === patInfo.PatientId);
        if (indx >= 0 && this.filteredPatientList[indx].IsSmsSend === false && this.filteredPatientList[indx].IsPhoneNumberValid) {
          this.filteredPatientList[indx].IsSelected = !this.filteredPatientList[indx].IsSelected;
        }
        this.selectAll = (this.filteredPatientList.every(a => a.IsSelected === true)) ? true : false;
      }
    }
  }

  public OnSMSSendStatusChange() {
    this.selectAll = false;
    this.filteredPatientList.map(a => a.IsSelected = false);
    this.labReportSendSMSDTO.PatientInfo = [];
    if (this.smsSentStatus !== Sms_SendStatus.SendPending) {
      this.filteredPatientList = this.patientList.filter(a => a.IsSmsSend === true);
    }
    else {
      this.filteredPatientList = this.patientList.filter(a => a.IsSmsSend === false);
    }
  }

  public closeConfirmationPopUp() {
    this.showReUploadPopup = false;
  }

  public OnUploadButtonClicked(patInfo: LabReportSMS_DTO) {
    this.selectedLabReportSMS_DTO = patInfo;
    if (this.selectedLabReportSMS_DTO.RequisitionIdPlusReportIdCSV === null || this.selectedLabReportSMS_DTO.VerifiedRequisitionsCSV === "") {
      this.messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`Lab Report is not generated, please try agein later.`]);
      return;
    }
    else if (this.selectedLabReportSMS_DTO.IsFileUploaded) {
      this.showReUploadPopup = true;
      return
    }
    else {
      this.LoadLabReports();
    }
  }

  public LoadLabReports() {
    this.coreService.loading = true;
    this.showReUploadPopup = false;
    let patInfo = this.selectedLabReportSMS_DTO;
    let reqs = [];
    let RequsitionReportPair = patInfo.RequisitionIdPlusReportIdCSV.split(',');
    RequsitionReportPair = RequsitionReportPair.filter(a => a.length > a.indexOf(';') + 1 && patInfo.VerifiedRequisitionsCSV.includes(a.substring(0, a.indexOf(";"))));
    if (RequsitionReportPair && RequsitionReportPair.length < 1) {
      this.messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`Lab Report is not generated, please try agein later.`]);
      this.coreService.loading = false;
      return;
    }
    const result = {};
    RequsitionReportPair.forEach(pair => {
      const [number, group] = pair.split(';');
      if (!result[group]) {
        result[group] = [];
      }
      result[group].push(parseInt(number));
    });

    reqs = Object.values(result);
    this.labBLService.GetReportFromListOfReqIdList(reqs)
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponseText.OK && res.Results) {
          this.templateReport = res.Results;
          this.MapSequence();
          this.singleReport = this.templateReport[0];
          this.showReport = true;
          if (this.LabReportUploadConfigParam && this.LabReportUploadConfigParam.EnableFileUpload && this.LabReportUploadConfigParam.UsePatientPortal) {
            this.UploadToTeleMedicine(patInfo);
          } else if (this.LabReportUploadConfigParam && this.LabReportUploadConfigParam.EnableFileUpload && this.LabReportUploadConfigParam.UseGoogleDriveUpload) {
            this.requisitionIdList = patInfo.VerifiedRequisitionsCSV.split(",").map(Number);
            setTimeout(() => {
              this.UploadReportToGoogleDrive(patInfo);
            }, 500)
          }
        }
        else {
          this.messageBoxService.showMessage(ENUM_MessageBox_Status.Error, ["Unable to get lab reports."]);
          console.log(res.ErrorMessage);
        }

      }, (err) => {
        this.loading = false;
        console.log(err.ErrorMessage);
      });
  }

  public CloseReportPopUP() {
    this.showReport = false;
    this.coreService.loading = false;
  }

  public UploadToTeleMedicine(item: LabReportSMS_DTO) {
    let index = item.PatientName.indexOf(" ");
    this.TeleMedForm.firstName = item.PatientName.substring(0, index);
    this.TeleMedForm.lastName = item.PatientName.substring(index + 1, item.PatientName.length).trim();
    this.TeleMedForm.phoneNumber = item.PhoneNumber;
    this.TeleMedForm.email = null;
    this.requisitionIdList = item.VerifiedRequisitionsCSV.split(",").map(Number);
    for (let i = 0; i < this.templateReport.length; i++) {
      setTimeout(() => {
        this.UploadLabReportToTeleMedicine(i, this.templateReport.length);
        this.singleReport = this.templateReport[i + 1];
      }, 500);
    }
  }

  public UploadLabReportToTeleMedicine(counter: number, reportCount: number) {
    let dom = document.getElementById("lab-report-main");
    dom.style.border = "none";
    let domWidth = dom.style.width;
    dom.style.width = "1020px";
    html2canvas(dom, {
      useCORS: true,
      allowTaint: true,
      scrollY: 0
    }).then((canvas) => {
      const image = { type: 'jpeg', quality: 2 };
      const margin = [0.5, 0.5];
      let imgWidth = 8.5;
      let pageHeight: number = 11;
      let innerPageHeight = pageHeight - margin[1] * 2;
      let innerPageWidth = imgWidth - margin[0] * 2;
      let pxFullHeight = canvas.height;
      let pxPageHeight = Math.floor(canvas.width * (pageHeight / imgWidth));
      let nPages = Math.ceil(pxFullHeight / pxPageHeight);
      pageHeight = innerPageHeight;
      let pageCanvas = document.createElement('canvas');
      let pageCtx = pageCanvas.getContext('2d');
      pageCanvas.width = canvas.width;
      pageCanvas.height = pxPageHeight;
      let pdf = new jsPDF('p', 'in', 'a4');
      for (let page = 0; page < nPages; page++) {
        if (page === nPages - 1 && pxFullHeight % pxPageHeight !== 0) {
          pageCanvas.height = pxFullHeight % pxPageHeight;
          pageHeight = (pageCanvas.height * innerPageWidth) / pageCanvas.width;
        }
        let w = pageCanvas.width;
        let h = pageCanvas.height;
        pageCtx.fillStyle = 'white';
        pageCtx.fillRect(0, 0, w, h);
        pageCtx.drawImage(canvas, 5, page * pxPageHeight, w, h, 0, 0, w, h);
        if (page > 0)
          pdf.addPage();
        let imgData = pageCanvas.toDataURL('image/' + image.type, image.quality);
        pdf.addImage(imgData, image.type, margin[1], margin[0], innerPageWidth, pageHeight);
      }
      dom.style.width = domWidth;
      let binary = pdf.output();
      const byteNumber = new Array(binary.length);
      for (let i = 0; i < byteNumber.length; i++) {
        byteNumber[i] = binary.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumber);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      let fileName = `${this.TeleMedForm.firstName}_${this.TeleMedForm.lastName}_Lab_Report${counter + 1}.pdf`;
      const file = new File([blob], fileName, { type: 'application/pdf' });
      this.formData.append("Files", file, file.name);

      if (counter + 1 === reportCount) {
        this.labBLService.uploadFile(this.TeleMedicineConfiguration.TeleMedicineBaseUrl, this.TeleMedForm, this.formData)
          .finally(() => {
            this.formData = new FormData();
            this.CloseReportPopUP();
          })
          .subscribe((res) => {
            if (res) {
              this.messageBoxService.showMessage(ENUM_MessageBox_Status.Success, ['Lab Report is Successfully Uploaded.']);
              this.labBLService.UpdateFileUploadStatus(this.requisitionIdList).subscribe((response: DanpheHTTPResponse) => {
                if (response.Status === ENUM_DanpheHTTPResponseText.OK) {
                  this.GetSMSApplicablePatientList();
                }
              });
            }
          }, err => {
            this.loading = false;
            this.messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Something went wrong. Unable to upload lab report !!!. ${err.ErrorMessage}`]);
          });
      }
    });
  }

  public MapSequence() {
    this.templateReport.forEach(rep => {
      let dob = rep.Lookups.DOB;
      let patGender = rep.Lookups.Gender;
      let patAge = CommonFunctions.GetFormattedAge(dob);
      patAge = patAge.toUpperCase();

      let indicator: string = 'normal';
      if (patAge.includes('Y')) {
        let ageArr = patAge.split('Y');
        let actualAge = Number(ageArr[0]);
        if (actualAge > 16) {
          if (patGender.toLowerCase() == 'male') {
            indicator = 'male';
          } else if (patGender.toLowerCase() == 'female') {
            indicator = 'female';
          } else {

          }
        }
        else {
          indicator = 'child';
        }
      }
      else {
        indicator = 'child';
      }

      if (rep.Columns) {
        rep.Columns = JSON.parse(rep.Columns);
        rep = LabReportVM.AssignControlTypesToComponent(rep);
      }

      rep.Templates.forEach(tmplates => {
        tmplates.TemplateColumns = tmplates.TemplateColumns ? JSON.parse(tmplates.TemplateColumns) : this.defaultColumns;

        tmplates.Tests.forEach(test => {
          if (test.HasNegativeResults) {
            test.ShowNegativeCheckbox = true;
          } else {
            test.ShowNegativeCheckbox = false;
          }
          let componentJson: Array<LabComponentModel> = new Array<LabComponentModel>();
          test.ComponentJSON.forEach(cmp => {
            if (this.showRangeInRangeDescription) {
              if (indicator == 'male') {
                if (cmp.MaleRange && cmp.MaleRange.trim() != '' && cmp.MaleRange.length && cmp.MaleRange.trim().toLowerCase() != 'nan-nan') {
                  cmp.RangeDescription = cmp.MaleRange;
                }
              } else if (indicator == 'female') {
                if (cmp.FemaleRange && cmp.FemaleRange.trim() != '' && cmp.FemaleRange.length && cmp.FemaleRange.trim().toLowerCase() != 'nan-nan') {
                  cmp.RangeDescription = cmp.FemaleRange;
                }
              } else if (indicator == 'child') {
                if (cmp.ChildRange && cmp.ChildRange.trim() != '' && cmp.ChildRange.length && cmp.ChildRange.trim().toLowerCase() != 'nan-nan') {
                  cmp.RangeDescription = cmp.ChildRange;
                }
              }
            }
            if (cmp.DisplaySequence == null) {
              cmp.DisplaySequence = 100;
            }
          });

          test.ComponentJSON.sort(function (a, b) { return a.DisplaySequence - b.DisplaySequence });

          test.Components.forEach(result => {

            if (!result.IsNegativeResult) {
              let seq = test.ComponentJSON.find(obj => obj.ComponentName == result.ComponentName);
              if (seq) {
                result.DisplaySequence = seq.DisplaySequence;
                result.IndentationCount = seq.IndentationCount;
              } else {
                result.IndentationCount = 0;
              }
            } else {
              test.IsNegativeResult = result.IsNegativeResult;
              test.NegativeResultText = result.Remarks;
              if (rep.Templates.length == 1 && rep.Templates[0].Tests.length == 1) {
                rep.Columns.Unit = false;
                rep.Columns.Range = false;
                rep.Columns.Method = false;
                rep.Columns.Remarks = false;
              }
            }
          });
          test.Components.sort(function (a, b) { return a.DisplaySequence - b.DisplaySequence });
        });
      });
    });
  }

  public UploadReportToGoogleDrive(patInfo: LabReportSMS_DTO) {
    this.loading = true;
    const marginTop = 100;
    var dom = document.getElementById("lab-report-main");
    dom.style.border = "none";
    dom.style.paddingTop = marginTop + "px";
    dom.style.display = "flex";
    dom.style.width = "1000px";

    const reportWidth = dom.clientWidth;
    const reportHeight = dom.clientHeight + marginTop;
    const elementWidth = 800;

    html2canvas(dom, {
      scrollX: 0,
      scrollY: 0,
      x: 0,
      y: 10,
      width: reportWidth + 150,
      height: reportHeight + 50,
      windowWidth: reportWidth - 20,
      windowHeight: reportHeight - 20
    }).then((canvas) => {
      const FILEURI = canvas.toDataURL('image/png');
      let PDF = new jsPDF('p', 'pt', 'a2');

      let height = canvas.height * elementWidth / canvas.width;

      PDF.addImage(FILEURI, 'PNG', 0, 0);

      window.setTimeout(() => {
        var binary = PDF.output();
        var data = binary ? btoa(binary) : "";



        this.labBlService.UploadToGoogleDrive(data, this.requisitionIdList[0]).finally(() => this.loading = false).subscribe(res => {
          if (res.Status === ENUM_DanpheHTTPResponses.OK) {
            this.messageBoxService.showMessage(ENUM_MessageBox_Status.Success, [res.Results.Result.Results]);

            let dt = this.requisitionIdList.find(p => p.RequisitionId == this.requisitionIdList[0]);
            if (dt) { dt.IsFileUploaded = true; }
            this.GetSMSApplicablePatientList();

            this.showReport = false;
            this.loading = false;
            this.CloseReportPopUP();
          } else {
            this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ["Unable to upload lab report."]);
            this.showReport = false;
            this.loading = false;
            this.CloseReportPopUP();
          }
        }, (err) => {
          this.loading = false;
          this.CloseReportPopUP();
          console.log(err.ErrorMessage);
          this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ["Unable to upload lab report. Please try later."]);
        });

      }, 500)
    });
  }
}

export enum Sms_SendStatus {
  SendSuccess = "SMS_Sent",
  SendPending = "SMS_Not_Sent"
}
