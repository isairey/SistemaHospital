import { ChangeDetectorRef, Component, EventEmitter, Input, Output, Renderer2, SecurityContext } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { Lightbox } from 'angular2-lightbox';
import * as moment from 'moment/moment';
import { CoreService } from '../../../../../src/app/core/shared/core.service';
import { Patient } from '../../../patients/shared/patient.model';
import { SecurityService } from '../../../security/shared/security.service';
import { DicomService } from '../../../shared/danphe-dicom-viewer/shared/dicom.service';
import { DLService } from "../../../shared/dl.service";
import { MessageboxService } from '../../../shared/messagebox/messagebox.service';
import { ImagingReportViewModel } from '../../shared/imaging-item-report.model';
import { ImagingBLService } from "../imaging.bl.service";
import { RadiologyService } from '../radiology-service';

import { HttpClient } from '@angular/common/http';
import html2canvas from 'html2canvas';
import * as jsPDF from 'jspdf';
import { DanpheHTTPResponse } from '../../../shared/common-models';
import { CommonEmailSetting_DTO } from '../../../shared/DTOs/common-email-setting.dto';
import { CommonEmailModel } from '../../../shared/DTOs/common-email_DTO';
import { ENUM_DanpheHTTPResponses, ENUM_DanpheHTTPResponseText, ENUM_MessageBox_Status, ENUM_TemplateStyleName } from '../../../shared/shared-enums';
import { ImageAttachmentModel } from '../rad-email.model';
import { TemplateStyleModel } from '../template-style-model';

@Component({
  selector: "danphe-view-imaging-report",
  templateUrl: "./view-report.html",
  styleUrls: ['./rad-view-report.style.css']
})
export class ViewReportComponent {

  public report: ImagingReportViewModel = new ImagingReportViewModel();
  //requisitionId used instead of reportId because we're using using this component in patientoverview page where getting list of requisitions.
  @Input("requisitionId")
  public requisitionId: number = null;
  @Input("Editable")
  public Editable = true;
  public displayFullSizeImage: boolean = false;
  public album = [];
  public reportHtml;
  public enableImageUpload: boolean = false;
  public enableDicomImages: boolean = false;//sud:18Aug'19--separated param for dicom.
  public reportHeader: any;
  public showStudy: boolean = false;

  @Output("on-report-edit")
  onReportEdit: EventEmitter<Object> = new EventEmitter<Object>();

  @Input("print-without-preview")
  printWithoutPreview: boolean = false;

  @Input('create-report-for-claim')
  public CreateReportForClaim: boolean = false;

  ShowChangePrescriberPopUp: boolean = false;

  public doctorSelected: any;
  public hospitalCode: string = null;
  public topHeightInReportClass: string = '';

  public loggedInUserId: number = null;
  public showDigitalSignatureImage: boolean = false; // Set initial state to false
  public showEmailDataBox: boolean = false;
  public radEmail: CommonEmailModel = new CommonEmailModel();
  public loading: boolean = false;
  public emailSettings: CommonEmailSetting_DTO = new CommonEmailSetting_DTO();

  public imageUploadFolderPath: string = null;//sud:18Aug'19--for radiology image upload.

  public ExtRefSettings = null;
  public enableDoctorUpdateFromSignatory: boolean = false;

  printDetails: any;
  showPrint: boolean;
  public PrintFooterGap: number = 0;
  @Input("reportViewFromClaimManagement")
  reportViewFromClaimManagement: boolean = false;
  @Output("callback-After-imaging-report-Response") callbackResponse: EventEmitter<object> = new EventEmitter<object>();
  public DisplaySignatureOnRight: boolean = false;

  public PrintCount: number = 0;
  public ShowPrintCount: boolean = false;
  RadiologyReportMarginSettings = {
    "MarginTop": 0,
    "MarginRight": 0,
    "MarginBottom": 0,
    "MarginLeft": 0,
  };
  ChangeReferrer: boolean = false;
  ShowChangeReferrerPopUp: boolean = false;
  SelectedRefId: number = null;
  SelectedReferrerName: string = null;
  PatientHeaderOnAllPages: boolean = false;
  SignatoriesOnAllPages: boolean = false
  IsSignatureAtBottomOfLastPage: boolean = false;
  @Input("RadiologyReportFromClaimScrubbing")
  RadiologyReportFromClaimScrubbing: boolean = false;

  PACSServerConfiguration = {
    EnablePACSServer: "false",
    BaseURL: ""
  }
  selectedTemplateStyle: TemplateStyleModel;
  TemplateStyleList = new Array<TemplateStyleModel>();

  constructor(public imagingBLService: ImagingBLService, public coreService: CoreService,
    public radiologyService: RadiologyService, public securityService: SecurityService,
    public messageBoxService: MessageboxService,
    public lightbox: Lightbox, public dlService: DLService,
    public sanitizer: DomSanitizer,
    public changeDetector: ChangeDetectorRef,
    public _router: Router,
    public _dicomService: DicomService, public renderer: Renderer2, public http: HttpClient

  ) {
    this.report.ReportText = "";
    this.enableImageUpload = this.radiologyService.EnableImageUpload();
    this.enableDicomImages = this.radiologyService.EnableDicomImages();
    this.reportHeader = this.radiologyService.ReportHeader;
    this.hospitalCode = this.coreService.GetHospitalCode();
    this.loggedInUserId = this.securityService.loggedInUser.EmployeeId;
    let emailSettings = this.coreService.GetCommonEmailSettings();
    if (emailSettings) {
      let redSetting = emailSettings.find(a => a.UsedBy === "Radiology");
      if (redSetting && redSetting.SenderEmail) {
        this.emailSettings = redSetting;
      }
      else {
        this.emailSettings = emailSettings.find(a => a.UsedBy === "Common");
      }
    }
    this.enableDoctorUpdateFromSignatory = this.coreService.UpdateAssignedToDoctorFromAddReportSignatory();

    if (this.hospitalCode && this.hospitalCode.toLowerCase() == 'mnk') {
      this.topHeightInReportClass = 'mnk-rad-hdr-gap default-radheader-gap';
    }
    else {
      this.topHeightInReportClass = 'rad-hdr-gap default-radheader-gap';
    }


    this.imageUploadFolderPath = this.radiologyService.GetImageUploadFolderPath();
    this.ExtRefSettings = this.radiologyService.GetExtReferrerSettings();
    this.RptHdrSettng = this.ReportHeaderPatientNameSettings();
    this.FetchParameters();

    let pacsServerParam = this.coreService.Parameters.find(param => param.ParameterGroupName === "Radiology" && param.ParameterName === "PACSServerConfiguration");
    if (pacsServerParam) {
      let paramValue = JSON.parse(pacsServerParam.ParameterValue)
      if (paramValue) {
        this.PACSServerConfiguration = paramValue;
        this.PACSServerConfiguration.EnablePACSServer = JSON.parse(this.PACSServerConfiguration.EnablePACSServer);
      }
    }
  }

  FetchParameters() {
    this.AddGapInPrintPage();
    this.GetParamForSignatureDisplay();
    this.HideShowPrintCount();
    this.GetParamForRadiologyReportMargin();
    this.GetRadiologyReportDisplayConfig();
  }

  //start: sud: 2July'19: For Keyboard Shortcuts..
  globalListenFunc: () => void;
  ngOnDestroy() {
    // remove listener
    if (this.globalListenFunc) {
      this.globalListenFunc();
    }
  }

  ngAfterViewInit() {
    //CTRL+P  -> FOR Printing.
    this.globalListenFunc = this.renderer.listen('document', 'keydown', e => {
      var kc = e.which || e.keyCode;
      if (e.ctrlKey && String.fromCharCode(kc).toUpperCase() == "P") {
        e.preventDefault();
        this.PrintReportHTML();

      }
      //else if (e.ctrlKey && String.fromCharCode(kc).toUpperCase() == "E") {
      //  e.preventDefault();
      //  this.EditReport();
      //}
    });

  }

  public showImagingReport: boolean = false;
  public isReportLoadCompleted: boolean = false;

  ngOnInit() {
    if (this.requisitionId) {
      this.GetImagingReport(this.printWithoutPreview);
    }
  }

  ngAfterViewChecked() {
    var doc = document.getElementById("print_page_end");
    // this is callback method. so,print function called while condition is matched.
    if (doc && this.printWithoutPreview && this.isReportLoadCompleted) {
      this.PrintReportHTML();
      this.isReportLoadCompleted = false;
    }
  }


  public GetImagingReport(printWoPreview: boolean = false) {
    this.imagingBLService.GetImagingReportByRequisitionId(this.requisitionId)
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK && res.Results) {
          this.report = res.Results;
          if (this.report) {
            this.report.Age = this.coreService.CalculateAge(this.report.DateOfBirth);
          }
          this.GetTemplateStyleByTemplateId(this.report.ReportTemplateId);

          // IMPORTANT: sanitizer.bypassSecurity : Needed to retain style/css of innerHTML !! --sud:12Apr'18'
          const rptText = res.Results.ReportText;
          this.report.ReportText = this.sanitizer.bypassSecurityTrustHtml(rptText);

          this.report.Signatories = JSON.parse(this.report.Signatories);

          if (this.report.FooterTextsList.length) {
            const selectedId = this.report.SelectedFooterTemplateId || null;
            this.report.FooterTextsList.forEach(f => {
              f.IsChecked = selectedId ? f.SelectedFooterTemplateId === selectedId : false;
            });
          }

          console.log('Footer Texts List:', this.report.FooterTextsList);

          this.SetPatHeaderOnLoad();
          this.SetImagePath();
          this.showImagingReport = true;
          this.isReportLoadCompleted = true;
          this.printWithoutPreview = printWoPreview;
          this.callbackResponse.emit({ IsDataReceived: true });
          this.changeDetector.detectChanges();
        } else {
          this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, [res.ErrorMessage]);
          console.log(res.ErrorMessage);
        }
      }, error => {
        this.messageBoxService.showMessage(ENUM_MessageBox_Status.Error, ["Failed to fetch imaging report."]);
        console.error('Error fetching imaging report:', error);
      });
  }
  public SetImagePath() {
    //ImageName contains names of multiple images seperated by ';'
    //split the string ImageName into array pathToImage.
    if (this.report.ImageName) {
      this.album = [];
      let groupOf3Img = [];//push 3 images at a time to this variable, and push the array in album variable above.

      let imageNames = this.report.ImageName.split(";");
      imageNames.forEach(imgName => {

        // let imgPath = "/app/fileuploads/Radiology/" + this.report.ImagingTypeName + "/" + imgName;
        let imgPath = "/fileuploads/Radiology/" + this.report.ImagingTypeName + "/" + imgName;
        //let imgPath = this.imageUploadFolderPath + this.report.ImagingTypeName + "/" + imgName;

        const image = {
          src: imgPath,
          caption: imgName,
          thumb: null
        }

        groupOf3Img.push(image);
        //if groupOf3Img is full (length=3) then push it to album[] and clear it again.
        if (groupOf3Img.length == 3) {
          this.album.push(groupOf3Img);
          groupOf3Img = [];
        }

      });

      //push remaining images to album[] array, if any (there may be 1 or 2 images (max) since they won't be pushed inside loop.)
      if (groupOf3Img.length > 0) {
        this.album.push(groupOf3Img);
      }

    }
    this.showImagingReport = true;
  }

  OpenLightBox(vIndex: number, hIndex: number): void {
    // open lightbox
    this.lightbox.open(this.album[vIndex], hIndex);
  }

  Close() {
    this.report = null;
    this.requisitionId = null;
    this.showImagingReport = false;
    this.album = [];
    this.onReportEdit.emit({ Submit: true });
  }
  UpdatePrintCount() {
    this.imagingBLService.GetPrintCount(this.requisitionId)
      .subscribe(res => {
        if (res.Status == ENUM_DanpheHTTPResponseText.OK && res.Results) {
          this.PrintCount = res.Results;
        }
        else {
          this.messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [res.ErrorMessage]);
          console.log(res.ErrorMessage);
        }

      });
  }
  getCheckedFooterTexts(): string {
    if (this.report.FooterTextsList && this.report.FooterTextsList.length > 0) {
      const checkedFooterTexts = this.report.FooterTextsList
        .filter(footerText => footerText.IsChecked)
        .map(footerText => `<tr><td>${footerText.Text}</td></tr>`)
        .join('');

      if (checkedFooterTexts) {
        return `<div class="col-md-12 col-xs-12"><table>${checkedFooterTexts}</table></div>`;
      }
    }

    return '';
  }
  onFooterTextChecked(index: number) {
    this.report.FooterTextsList.forEach((footer, i) =>
      footer.IsChecked = i === index ? !footer.IsChecked : false);
    this.report.SelectedFooterTemplateId = this.report.FooterTextsList[index].IsChecked
      ? this.report.FooterTextsList[index].SelectedFooterTemplateId
      : null;
  }
  PrintReportHTML() {
    this.UpdatePrintCount();
    const footerContent = this.getCheckedFooterTexts();

    const moveElementsToLastPage = () => {
      const footerSectionElement = document.querySelector('.ftr-lst-sctn-lp') as HTMLElement;
      const printPageElement = document.getElementById("printpage");
      if (printPageElement) {
        const lastPageContainer = document.createElement('div');
        lastPageContainer.style.position = 'absolute';
        lastPageContainer.style.width = '100%';
        if (footerSectionElement) {
          const footerContainer = document.createElement('div');
          footerContainer.style.position = 'fixed';
          footerContainer.style.width = '100%';
          footerContainer.style.bottom = '0px';
          footerContainer.innerHTML = footerContent;
          lastPageContainer.appendChild(footerContainer);
          footerSectionElement.remove();
        } else {
          console.error("Element with class 'footer-list-section' not found.");
        }
        printPageElement.appendChild(lastPageContainer);
      } else {
        console.error("Element with ID 'printpage' not found.");
      }
    };
    if (!this.SignatoriesOnAllPages) {
      moveElementsToLastPage();
    } else {
      const footerSectionElement = document.querySelector('.footer-list-section') as HTMLElement;
      if (footerSectionElement) {
        footerSectionElement.innerHTML = footerContent;
      }
    }
    var printContents = document.getElementById("printpage").innerHTML;
    let documentContent = "<html>";
    if (!this.selectedTemplateStyle) {
      this.messageBoxService.showMessage(ENUM_MessageBox_Status.Warning, ["No template styles found, Please Add Template Styles from Setting."]);
    }
    let headerStyle = this.selectedTemplateStyle.HeaderStyle;
    let footerStyle = this.selectedTemplateStyle.FooterStyle;
    documentContent += '<body>' + headerStyle + printContents + footerStyle + '</body></html>';
    this.printDetails = documentContent;
    this.showPrint = true;
    this.showImagingReport = false;
  }
  callBackPrint() {
    setTimeout(() => {
      this.printDetails = null;
      this.showPrint = false;
    }, 300);
  }

  //method to show dicomImages according to PatientStudyId..
  ViewScannedImages() {

    try {
      if (this.report.PatientStudyId) {
        this.showStudy = false;
        this.changeDetector.detectChanges();
        this._dicomService.patientStudyId = this.report.PatientStudyId;
        this.showStudy = true;
      } else {
        this.messageBoxService.showMessage("notice", ['Mapped Images not found.']);
      }
    } catch (exception) {
      console.log(exception);
      this.messageBoxService.showMessage("error", ['Error details check in console log']);
    }

  }

  //start: sud-14Jan'19--For Edit Reports

  public showEditReportWindow: boolean = false;
  public reportToEdit: ImagingReportViewModel = null;
  public tempReportToEdit: ImagingReportViewModel[] = [];
  public currentPatient: Patient = null;
  EditReport() {

    this.reportToEdit = Object.assign({}, this.report);
    this.reportToEdit.PrescriberId = this.report.PrescriberId;
    this.reportToEdit.ReferredById = this.report.ReferredById;

    this.currentPatient = <Patient>{
      PatientId: this.report.PatientId,
      ShortName: this.report.PatientName,
      Address: this.report.Address,
      PhoneNumber: this.report.PhoneNumber,
      DateOfBirth: this.report.DateOfBirth,
      Gender: this.report.Gender,
      PatientCode: this.report.PatientCode

    };

    this.selectedPrescriberName = this.reportToEdit.PrescriberName;
    this.selectedPrescriberId = this.reportToEdit.PrescriberId;
    this.showEditReportWindow = false;
    this.showImagingReport = true;
    this.changeDetector.detectChanges();
    this.showImagingReport = false;
    this.reportToEdit.Signatories = JSON.stringify(this.report.Signatories);
    this.reportToEdit.ReportText = this.sanitizer.sanitize(SecurityContext.HTML, this.report.ReportText);
    this.tempReportToEdit.push(this.reportToEdit);
    this.showEditReportWindow = true;

  }


  footerText: Array<any> = [];

  //post report called from post-report component using event emitter.
  UpdatePatientReport($event): void {

    try {

      let selReport = $event.report;
      this.selectedTemplateStyle = $event.selectedTemplateStyle;
      let printReport = false;
      let isUpdate: boolean = false;
      if ($event.orderStatus == "print") {
        printReport = true;
        $event.orderStatus = "pending";
      }
      this.footerText = selReport[0].FooterTextsList;

      if (selReport.ImagingReportId)
        isUpdate = true;
      let orderStatus = $event.orderStatus;
      //now we're getting report files separately.
      let filesToUpload = $event.reportFiles;
      this.album = [];//need to empty the album since it's showing duplicate images: sud:21Oct'19

      //filesToUpload,selReport,OrderStatus
      this.imagingBLService.AddImgItemReport(filesToUpload, selReport, orderStatus, this.enableDoctorUpdateFromSignatory)
        .subscribe(res => {

          if (res.Status == "OK") {
            this.showEditReportWindow = true;
            this.showImagingReport = false;
            this.changeDetector.detectChanges();
            this.report = new ImagingReportViewModel();//reset the value of current report, it'll be loaded again from function below..
            this.showEditReportWindow = false;
            this.showImagingReport = true;
            this.GetImagingReport(true);//assigning printWithoutPreview argument true to print after view page loaded completly.
          }

        });

    } catch (exception) {
      //this.msgBoxServ.showMessage("error", ['check console log for detail error..!']);
      console.log(exception);
    }

  }


  OpenChangeDocPopup() {
    this.ShowChangePrescriberPopUp = false;
    this.selectedPrescriberId = null;
    this.changeDetector.detectChanges();
    this.ShowChangePrescriberPopUp = true;
  }
  OpenChangeReferrerPopUp() {
    this.changeDetector.detectChanges();
    this.ShowChangeReferrerPopUp = true;
  }



  closeReferrerPopup() {
    this.ShowChangePrescriberPopUp = false;
    this.ShowChangeReferrerPopUp = false;
  }



  UpdatePrescriberByDr() {

    if (!this.selectedPrescriberId && !this.selectedPrescriberName) {
      this.messageBoxService.showMessage("failed", ["No Doctor Selected or Written."]);
    }
    else {
      if (this.requisitionId) {
        //if selected refId is null or undefined or empty then make it zero (see previous logic)
        if (!this.selectedPrescriberId) {
          this.selectedPrescriberId = 0;
        }

        if (this.selectedPrescriberName && this.selectedPrescriberName.trim() != '') {
          this.imagingBLService.PutDoctor(this.selectedPrescriberId, this.selectedPrescriberName, this.requisitionId)
            .subscribe(res => {
              if (res.Status == "OK") {
                this.report["PrescriberName"] = res.Results;
                this.messageBoxService.showMessage("success", ["Doctor Updated"]);
                this.doctorSelected = '';
              }
              else {
                this.doctorSelected = '';
                this.messageBoxService.showMessage("failed", ["Doctor Name cannot be Updated in your Lab Report"]);
              }
            });
        }
        else {
          this.messageBoxService.showMessage("failed", ["No Doctor Selected or Written."]);
          this.doctorSelected = '';
        }

      }
      else {
        this.messageBoxService.showMessage("failed", ["There is no requisitions !!"]);
      }
    }

    this.ShowChangePrescriberPopUp = false;

  }

  handleImageError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    imgElement.style.display = 'none'; // Hide the image logo, if not found iin the given path 
  }

  CloseSendEmailPopUp() {
    this.showEmailDataBox = false;
  }

  ProcessSendingData() {
    this.loading = false;

    this.radEmail = new CommonEmailModel();

    if (this.emailSettings.PdfContent) {
      var dom = document.getElementById("printpage");
      dom.style.border = "none";
      html2canvas(dom, {
        useCORS: true,
        allowTaint: true,
        scrollY: 0
      }).then((canvas) => {
        const image = { type: 'jpeg', quality: 2 };
        const margin = [0.5, 0.5];
        var imgWidth = 8.5;
        var pageHeight = 11;
        var innerPageWidth = imgWidth - margin[0] * 2;
        var innerPageHeight = pageHeight - margin[1] * 2;
        var pxFullHeight = canvas.height;
        var pxPageHeight = Math.floor(canvas.width * (pageHeight / imgWidth));
        var nPages = Math.ceil(pxFullHeight / pxPageHeight);
        var pageHeight = innerPageHeight;
        var pageCanvas = document.createElement('canvas');
        var pageCtx = pageCanvas.getContext('2d');
        pageCanvas.width = canvas.width;
        pageCanvas.height = pxPageHeight;
        var pdf = new jsPDF('p', 'in', 'a4');
        for (var page = 0; page < nPages; page++) {
          if (page === nPages - 1 && pxFullHeight % pxPageHeight !== 0) {
            pageCanvas.height = pxFullHeight % pxPageHeight;
            pageHeight = (pageCanvas.height * innerPageWidth) / pageCanvas.width;
          }
          var w = pageCanvas.width;
          var h = pageCanvas.height;
          pageCtx.fillStyle = 'white';
          pageCtx.fillRect(0, 0, w, h);
          pageCtx.drawImage(canvas, 5, page * pxPageHeight, w, h, 0, 0, w, h);
          if (page > 0)
            pdf.addPage();
          var imgData = pageCanvas.toDataURL('image/' + image.type, image.quality);
          pdf.addImage(imgData, image.type, margin[1], margin[0], innerPageWidth, pageHeight);
        }
        var binary = pdf.output();
        this.radEmail.PdfBase64 = btoa(binary);
        this.radEmail.AttachmentFileName = this.report.PatientName + "-" + moment().format("YYMMDDHHmm") + '.pdf';
      });
    }

    this.radEmail.SendHtml = this.emailSettings.TextContent;
    this.radEmail.SendPdf = this.emailSettings.PdfContent;
    //this.radEmail.SenderTitle = this.emailSettings.SenderTitle;
    this.radEmail.SenderEmailAddress = this.emailSettings.SenderEmail;
    this.radEmail.Subject = 'Report of ' + this.report.PatientName;
    this.radEmail.SmtpServer = this.emailSettings.SmtpServer;
    this.radEmail.Password = this.emailSettings.Password;
    this.radEmail.PortNo = this.emailSettings.PortNo;
    this.radEmail.EmailApiKey = this.emailSettings.EmailApiKey;

    this.LoadEmailAttachments_Images();


  }


  public attachmentImages = [];

  public LoadEmailAttachments_Images() {
    if (this.report.ImageName) {
      this.attachmentImages = [];
      let albumTemp = [];
      let imageNames = this.report.ImageName.split(";");
      let count: number = 1;
      let patName = this.report.PatientName;
      let todayDate = moment().format("YYYYMMDD_HHmmss");
      imageNames.forEach(imgName => {
        let imgPath = "/fileuploads/Radiology/" + this.report.ImagingTypeName + "/" + imgName;
        this.ConvertImgSrcUrlToBase64(imgPath, function (dataUri) {
          let img: ImageAttachmentModel = new ImageAttachmentModel();
          //we've to send only the base64 content. dataUri format includes the string: data:image/png.. in its value so we're replacing it with empty string.
          img.src = dataUri;//this will be used to show preview on email box.
          img.ImageBase64 = dataUri.replace("data:image/png;base64,", "");
          img.ImageName = patName + "_" + todayDate + "_" + count.toString();
          img.IsSelected = true;
          ////everytime count increases, re-assign to preview image count.
          count++;
          albumTemp.push(img);
        });
      });

      //this.attachmentImages = albumTemp;
      this.radEmail.ImageAttachments_Preview = albumTemp;
      this.email_previewImage_Count = imageNames.length;
    }
  }



  public ConvertImgSrcUrlToBase64(url, callback) {
    let image = new Image();
    image.onload = function () {
      var canvas = document.createElement('canvas');
      canvas.width = image.width; // or 'width' if you want a special/scaled size //this.naturalWidth
      canvas.height = image.height; // or 'height' if you want a special/scaled size //this.naturalHeight
      canvas.getContext('2d').drawImage(image, 0, 0);
      // Get raw image data
      callback(canvas.toDataURL('image/png'));
      //callback(canvas.toDataURL(''));
    };

    image.src = url;
  }


  public email_showImagePreview: boolean = false;
  public email_previewImage_Src: string = null;
  public email_previewImage_Count: number = 0;



  email_imagePreview_onMouseOver(imgObj): void {
    this.email_previewImage_Src = imgObj.src;
    this.email_showImagePreview = true;
  }

  email_imagePreview_onMouseOut(): void {
    this.email_showImagePreview = false;
  }

  ImgPreviewChkOnChange() {
    this.email_previewImage_Count = this.radEmail.ImageAttachments_Preview.filter(a => a.IsSelected == true).length;
  }

  public SendEmail() {
    if (this.emailSettings.TextContent) {
      //we have to take only text content, image won't be sent.
      var itemDiv = document.getElementById("rptContentNoImage").innerHTML;
      let data = this.sanitizer.sanitize(SecurityContext.HTML, itemDiv);

      this.radEmail.HtmlContent = data;
    }


    if (this.radEmail && (this.radEmail.SendHtml || this.radEmail.SendPdf)) {
      this.radEmail.EmailList = new Array<string>();
      for (var valCtrls in this.radEmail.EmailValidator.controls) {
        this.radEmail.EmailValidator.controls[valCtrls].markAsDirty();
        this.radEmail.EmailValidator.controls[valCtrls].updateValueAndValidity();
      }

      if (this.radEmail.IsValidCheck(undefined, undefined)) {

        var emailList = this.radEmail.EmailAddress.split(";");
        var allEmailIsValid = true;

        emailList.forEach(value => {
          if (value) {//if user provides semicolon after Only one Email, split will create two objects in array, second with empty space.
            if (this.ValidateEmail(value)) {
              this.radEmail.EmailList.push(value);
            } else {
              allEmailIsValid = false;
            }
          }
        });

        if (allEmailIsValid) {
          //console.log(this.radEmail);
          //remove unselected images before sending.
          this.radEmail.ImageAttachments = this.radEmail.ImageAttachments_Preview.filter(a => a.IsSelected == true);

          if (this.radEmail.ImageAttachments.length > 5) {
            this.messageBoxService.showMessage("error", ["Cannot attach more than 5 images, please remove some and send again."]);
            this.loading = false;
            return;
          }

          this.imagingBLService.sendEmail(this.radEmail)
            .subscribe(res => {
              if (res.Status == "OK") {
                this.messageBoxService.showMessage('success', ['Email sent successfuly.']);
                this.loading = false;
                this.CloseSendEmailPopUp();
              } else {
                this.messageBoxService.showMessage('failed', ['Email could not be sent, please try later.']);
                this.loading = false;
              }
            });
        } else {
          this.messageBoxService.showMessage('error', ['Invalid EmailAddress entered, Please correct it.']);
          this.loading = false;
        }
      } else {
        this.loading = false;
      }
    } else {
      this.messageBoxService.showMessage('failed', ['Email Sending Parameter has all the types of Email to send made False.']);
      this.loading = false;
    }
  }

  public ValidateEmail(email): boolean {
    var reg = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return reg.test(email);
  }


  //prat: 20sep2019 for internal and external referrer 
  public defaultExtRef: boolean = false;
  selectedPrescriberId: number = null;
  selectedPrescriberName: string = null;

  OnPrescriberChanged($event) {
    this.selectedPrescriberId = $event.ReferrerId; //EmployeeId comes as ReferrerId from select referrer component.
    this.selectedPrescriberName = $event.ReferrerName;//EmployeeName comes as ReferrerName from select referrer component.
  }
  //end: Pratik: 20Sept'19--For External Referrals


  //start: Pratik:20Sept show Patient Name of Report Header in Local Language
  public isLocalNameSelected: boolean = false;
  public PatientNameToDisplay: string = null;


  SetPatHeaderOnLoad() {

    if (this.RptHdrSettng.LocalNameEnabled) {
      if (this.RptHdrSettng.DefaultLocalLang) {
        this.isLocalNameSelected = true;//if default local language then  isLocalName should be true
        if (this.report.PatientNameLocal) {
          this.PatientNameToDisplay = this.report.PatientNameLocal;
        }
        else {
          this.switchLocalLang();
        }
      }
      else {
        this.PatientNameToDisplay = this.report.PatientName;
      }

    }
    else {
      this.PatientNameToDisplay = this.report.PatientName;
    }
  }


  public switchLocalLang() {
    this.isLocalNameSelected = !this.isLocalNameSelected;

    if (this.isLocalNameSelected) {
      if (this.report.PatientNameLocal) {
        this.PatientNameToDisplay = this.report.PatientNameLocal;
      }
      else {
        this.messageBoxService.showMessage("notice", ["Patient Name not found in LOCAL Language."]);
        this.isLocalNameSelected = false;
      }
    }
    else {
      this.PatientNameToDisplay = this.report.PatientName;
    }
  }

  public RptHdrSettng = { LocalNameEnabled: true, DefaultLocalLang: true };//this is default value for rptHdr
  public ReportHeaderPatientNameSettings() {
    var currParam = this.coreService.Parameters.find(a => a.ParameterGroupName == "Radiology" && a.ParameterName == "ReportHeaderPatientNameSettings");
    if (currParam && currParam.ParameterValue) {
      return JSON.parse(currParam.ParameterValue);
    }
    else {
      return { LocalNameEnabled: false, DefaultLocalLang: false };
    }
  }
  //end: Pratik:20Sept show Patient Name of Report Header in Local Language

  // maintain footer gaps in print page 
  public AddGapInPrintPage() {
    const currParam = this.coreService.Parameters.find(
      (a) => a.ParameterGroupName === "Radiology" && a.ParameterName === "RadiologyPrintFooterGap"
    );

    if (currParam && currParam.ParameterValue) {
      let parmaValue = JSON.parse(currParam.ParameterValue);
      this.PrintFooterGap = parmaValue.FooterGap;
    } else {
      this.PrintFooterGap = 0;
    }
  }
  GetParamForSignatureDisplay() {
    const currParam = this.coreService.Parameters.find(
      (a) => a.ParameterGroupName === "Radiology" && a.ParameterName === "DisplayRadiologySignatureOnRight");
    if (currParam && currParam.ParameterValue) {
      this.DisplaySignatureOnRight = JSON.parse(currParam.ParameterValue);
    }
    else {
      this.DisplaySignatureOnRight = false;
    }
  }
  GetParamForRadiologyReportMargin() {
    const currParam = this.coreService.Parameters.find(
      (a) => a.ParameterGroupName === "Radiology" && a.ParameterName === "RadiologyReportMarginSettings");
    if (currParam && currParam.ParameterValue) {
      this.RadiologyReportMarginSettings = JSON.parse(currParam.ParameterValue);
    }
    else {
      this.RadiologyReportMarginSettings = {
        "MarginTop": 0,
        "MarginRight": 0,
        "MarginBottom": 0,
        "MarginLeft": 0,
      };
    }
  }
  HideShowPrintCount() {
    const currParam = this.coreService.Parameters.find(
      (a) => a.ParameterGroupName === "Radiology" && a.ParameterName === "ShowPrintCount");
    if (currParam && currParam.ParameterValue) {
      this.ShowPrintCount = JSON.parse(currParam.ParameterValue);
    }
    else {
      this.ShowPrintCount = false;
    }
  }
  OnReferrerChanged($event) {
    this.SelectedRefId = $event.ReferrerId;
    this.SelectedReferrerName = $event.ReferrerName;

  }
  UpdateReferredBy() {
    if (!this.SelectedRefId && !this.SelectedReferrerName) {
      this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ["No Doctor Selected or Written."]);
    }
    else {
      if (this.requisitionId) {
        if (this.SelectedRefId && this.SelectedReferrerName.trim() != '') {
          this.imagingBLService.UpdateReferrer(this.SelectedRefId, this.SelectedReferrerName, this.requisitionId)
            .subscribe((res: DanpheHTTPResponse) => {
              if (res.Status === ENUM_DanpheHTTPResponses.OK) {
                this.report["ReferredByName"] = res.Results;
                this.messageBoxService.showMessage(ENUM_MessageBox_Status.Success, ["Referrer Updated Successfully."]);
              }
              else {
                this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ["Referrer Name cannot be Updated in your Lab Report"]);
              }
            });
        }
        else {
          this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ["No Referrer Selected or Written."]);
        }
      }
      else {
        this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ["There is no requisitions !!"]);
      }
    }
    this.ShowChangeReferrerPopUp = false;
  }
  GetRadiologyReportDisplayConfig() {
    const currParam = this.coreService.Parameters.find(
      (a) => a.ParameterGroupName === "Radiology" && a.ParameterName === "RadiologyReportDisplayConfig");
    if (currParam.ParameterValue) {
      const parsValue = JSON.parse(currParam.ParameterValue);
      this.PatientHeaderOnAllPages = !!parsValue.PatientHeaderOnAllPages;
      this.SignatoriesOnAllPages = !!parsValue.SignatoriesOnAllPages;
      this.IsSignatureAtBottomOfLastPage = !!parsValue.IsSignatureAtBottomOfLastPage;
    }
  }

  public GetTemplateStyleByTemplateId(templateReportId: number | undefined | null): void {
    this.TemplateStyleList = this.radiologyService.TemplateStyleList;
    if (this.TemplateStyleList && this.TemplateStyleList.length) {
      this.selectTemplate(templateReportId);
    } else {
      this.messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, ["There is no template style. Please select one from setting."])
    }
    return;

  }

  selectTemplate(templateReportId: number | undefined | null) {
    if (!this.TemplateStyleList || this.TemplateStyleList.length === 0) {
      this.selectedTemplateStyle = null;
      return;
    }
    const tempStyle = this.TemplateStyleList.find(temp => (temp.TemplateId === templateReportId && temp.IsActive === true) || null);
    if (tempStyle) {
      this.selectedTemplateStyle = tempStyle;
    } else {
      this.selectedTemplateStyle = this.TemplateStyleList.find(temp => temp.IsActive === true && temp.TemplateCode.toLocaleLowerCase() === ENUM_TemplateStyleName.Default);
    }
  }

}

