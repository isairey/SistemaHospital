import { ChangeDetectorRef, Component, EventEmitter, Input, Output, Renderer2, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Patient } from '../../../patients/shared/patient.model';
import { ImagingItemReport } from '../../shared/imaging-item-report.model';

import { Lightbox } from "angular2-lightbox";
import { CoreService } from '../../../../../src/app/core/shared/core.service';
import { SecurityService } from '../../../security/shared/security.service';
import { MessageboxService } from '../../../shared/messagebox/messagebox.service';
import { ENUM_MessageBox_Status, ENUM_TemplateStyleName } from '../../../shared/shared-enums';
import { DicomMappingModel } from "../dicom-mapping-model";
import { FooterTextsList_Dto } from '../DTOs/footer-text-list.dto';
import { ImagingItemReportDTO } from '../DTOs/imaging-item-report.dto';
import { ImagingBLService } from "../imaging.bl.service";
import { RadiologyReportTemplate } from "../radiology-report-template.model";
import { RadiologyService } from "../radiology-service";
import { ReportingDoctor } from "../reporting-doctor.model";
import { TemplateStyleModel } from '../template-style-model';


@Component({
  selector: "danphe-post-report",
  templateUrl: "./post-report.html",
  host: { '(window:keydown)': 'hotkeys($event)' }
  //,
  //styleUrls: ['themes/theme-default/DanpheStyle.css']

})
export class PostReportComponent {
  public showreport: boolean = false;
  public showDicomImageList: boolean = false;
  public oldPatientStudyIds: string[] = [];
  @Input("report")
  public report: ImagingItemReportDTO[] = [];
  SelectedReportTemplates = new Array<RadiologyReportTemplate>();
  @Input("patient")
  public patient: Patient;
  public orderStatus: string = "";
  @Output("add-report")
  addreport: EventEmitter<Object> = new EventEmitter<Object>();

  @Output("close-add-report")
  closeAddReport: EventEmitter<Object> = new EventEmitter<Object>();

  //sud-14Jan'19: Needed parameterized button list in this page to Enable/Disable Few features.
  //eg: Save/Print Button is not needed while This page is opened from ViewReport on EDIT action.
  // but those buttons are required when showing this page from Requisition List.
  @Input("buttonsList")
  public buttonsList = ["save", "submit", "print"];



  //private pathToImage: Array<string>;   
  public imgIndex: number = 0;
  public loading: boolean = false;
  public isReadOnly: boolean = false;
  public templateData: string = null;
  public album = [];
  public allImagSelect: boolean = false;
  public enableImgUpload: boolean = false;
  public enableDicomImages: boolean = false;//sud:18Aug'19--separated parameter for Dicom images.

  public reportingDoctors: Array<ReportingDoctor> = new Array<ReportingDoctor>();
  public reportTemplates: Array<RadiologyReportTemplate> = [];
  // public referredByDrList: Array<{ EmployeeId: number, FullName: string }> = [];
  public selPrescriberDr: any;
  public selectedTemplate: RadiologyReportTemplate;
  public changeReportTemplate: boolean = false;
  public changeDicomImageList: boolean = false;

  public dicomImageDatas: Array<DicomMappingModel> = new Array<DicomMappingModel>();

  public ReportValidator: FormGroup = null;
  public defaultSigEmpIdList: Array<number>;
  public hospitalCode: string = null;
  public imageUploadFolderPath: string = null;//sud:18Aug'19--for radiology image upload.
  public enableDoctorUpdateFromSignatory: boolean = false;
  public addReportWithoutSignatory: boolean = false;

  public ExtRefSettings = null;

  SelectedRefId: number = null;
  SelectedReferrerName: string = null;
  MergedReportText: string = '';
  isReportGeneratorOnlySignatory: boolean = false;
  IsPerformerMandatory: boolean = false;
  Signatories: any;
  SelectedPerformerId: number = 0;
  SelPerformerId: number = 0;
  TemplateStyleList = new Array<TemplateStyleModel>();
  SelectedTemplateStyle: TemplateStyleModel;

  constructor(
    public msgBoxServ: MessageboxService,
    public lightbox: Lightbox,
    public imagingBLService: ImagingBLService, public coreService: CoreService,
    public changeDetector: ChangeDetectorRef,
    public radiologyService: RadiologyService, public renderer: Renderer2,
    private _securityService: SecurityService) {

    this.enableImgUpload = this.radiologyService.EnableImageUpload();
    this.enableDicomImages = this.radiologyService.EnableDicomImages();
    //this.GetReferredByDoctorList();
    this.hospitalCode = this.coreService.GetHospitalCode();
    if (this.hospitalCode) {
      this.hospitalCode = this.hospitalCode.toLowerCase();
    }

    this.imageUploadFolderPath = this.radiologyService.GetImageUploadFolderPath();

    this.ExtRefSettings = this.radiologyService.GetExtReferrerSettings();
    this.enableDoctorUpdateFromSignatory = this.coreService.UpdateAssignedToDoctorFromAddReportSignatory();
    this.addReportWithoutSignatory = this.coreService.AddReportWOSignatory();
    this.SelectedReportTemplates = new Array<RadiologyReportTemplate>();
    this.GetParameters();
    this.GetAllReportTemplates();
  }
  GetParameters() {
    this.GetRadiologySignatureSetting();
    this.GetRadiologyFlowParameter();
  }

  GetRadiologyFlowParameter() {
    let param = this.coreService.Parameters.find(a => a.ParameterGroupName === 'Radiology' && a.ParameterName === 'RadiologyFlowConfig');
    if (param) {
      let obj = JSON.parse(param.ParameterValue);
      this.IsPerformerMandatory = obj.IsPerformerMandatory;
    }
  }
  GetRadiologySignatureSetting(): void {
    let param = this.coreService.Parameters.find(a => a.ParameterGroupName === 'Radiology' && a.ParameterName === 'RadiologySignatureSetting');
    if (param) {
      let obj = JSON.parse(param.ParameterValue);
      this.isReportGeneratorOnlySignatory = obj;
    }
  }
  //start: sud: 2July'19: For Keyboard Shortcuts..
  globalListenFunc: () => void;
  ngOnDestroy() {
    // remove listener
    if (this.globalListenFunc) {
      this.globalListenFunc();
    }
  }

  //end: sud: 2July'19: For Keyboard Shortcuts..


  //To avoid null/undefined exceptions, set the value of buttonsList to default if it was set as null from Parent-Component.
  ngOnInit() {
    if (!this.buttonsList || this.buttonsList.length == 0) {
      this.buttonsList = ["save", "submit", "print"];
    }

    this.globalListenFunc = this.renderer.listen('document', 'keydown', e => {
      var kc = e.which || e.keyCode;
      if (e.ctrlKey && String.fromCharCode(kc).toUpperCase() == "S") {
        e.preventDefault();
        this.SaveReport();
      }
      else if (e.ctrlKey && String.fromCharCode(kc).toUpperCase() == "P") {
        e.preventDefault();
        this.SubmitAndPrintReport();
      }
    });

  }

  @Input("showreport")
  public set value(val: boolean) {
    try {
      this.showreport = val;
      if (this.showreport) {
        this.oldPatientStudyIds = this.report.map(rep => rep.PatientStudyId);
        console.log('report detail', this.report);

        // Set prescriber and other properties
        this.selectedPrescriberId = this.report[0].PrescriberId;
        this.selectedPrescriberName = this.report[0].PrescriberName || "Self";
        this.SelectedRefId = this.report[0].ReferredById;
        this.SelectedReferrerName = this.report[0].ReferredByName;
        this.SelPerformerId = this.SelectedPerformerId = this.report[0].PerformerId;
        this.SelectedPerformerName = this.report[0].PerformerName;
        this.Signatories = this.report[0].Signatories;
        // Get the FooterTextsList from the response
        // this.report[0].FooterTextsList = this.report[0].FooterTextsList || [];
        this.GetTemplateStyleByTemplateId(this.report[0].ReportTemplateId);

        // Ensure FooterTextsList is an array
        this.report[0].FooterTextsList = this.report[0].FooterTextsList || [];
        const validItems = this.report[0].FooterTextsList.filter((item: any) =>
          (typeof item === 'string' && item.trim() !== '') ||
          (typeof item === 'object' && item !== null && typeof item.Text === 'string' && item.Text.trim() !== '')
        );
        const validTextCount = validItems.length;
        const selectedIndex = validItems.findIndex((item: any) =>
          typeof item === 'object' && item.SelectedFooterTemplateId && item.SelectedFooterTemplateId !== 0
        );
        if (validTextCount > 0) {
          this.report[0].FooterTextsList = validItems.map((item: any, index: number) => ({
            Text: typeof item === 'string' ? item.trim() : (item.Text ? item.Text.trim() : ''),
            IsChecked: validTextCount === 1 ? true : index === selectedIndex,
            SelectedFooterTemplateId: typeof item === 'object' ? (item.SelectedFooterTemplateId || 0) : 0
          }));
        } else {
          this.report[0].FooterTextsList = [];
        }

        this.selPrescriberDr = {
          EmployeeId: this.report[0].ReportingDoctorId,
          FullName: this.report[0].ProviderName || 'Self'
        };

        // Fetch report templates before processing them
        this.GetAllReportTemplates().then(() => {
          this.setSelectedReportTemplates(); // Call the function to set SelectedReportTemplates
        });

        if (this.isReportGeneratorOnlySignatory) {
          this.defaultSigEmpIdList = [this._securityService.GetLoggedInUser().EmployeeId];
        } else {
          this.defaultSigEmpIdList = this.coreService.GetDefEmpIdForRadSignatories();
        }

        this.setValidator();
        this.changeReportTemplate = false;
        this.changeDicomImageList = false;
        this.MakeImgAlbum();
      }
    } catch (exception) {
      this.ShowCatchErrMessage(exception);
    }
  }
  private setSelectedReportTemplates() {
    this.SelectedReportTemplates = this.report
      .reduce((acc, rep) => {
        if (rep.ReportTemplateIdsCSV) {
          const templateIds = rep.ReportTemplateIdsCSV.split(',').map(Number);
          return acc.concat(templateIds);
        } else if (rep.ReportTemplateId) {
          return acc.concat(rep.ReportTemplateId);
        }
        return acc;
      }, [] as number[])
      .map(templateId => this.reportTemplates.find(a => a.TemplateId === templateId))
      .filter(Boolean); // Remove undefined values

    // Set FooterTextsList based on conditions
    if (this.report[0].FooterTextsList.length === 0 && this.SelectedReportTemplates.length === 1) {
      const footerNote = this.SelectedReportTemplates[0].FooterNote;
      if (footerNote) { // Check if footerNote is valid
        this.report[0].FooterTextsList = [{
          SelectedFooterTemplateId: this.SelectedReportTemplates[0].TemplateId,
          Text: footerNote,
          IsChecked: true // Initially checked
        }];
      }
    }
  }

  //using validation logic here instead of model. because we're not initializing new ImnagingItemReport() but
  //direclty getting the report model from server side which don't have validation.
  public setValidator() {
    var _formBuilder = new FormBuilder();
    this.ReportValidator = _formBuilder.group({
      'Signatories': ['', Validators.compose([])],
    });
  }


  // public setReferredByDr() {
  //   if (this.report.ProviderName)
  //     this.selReferredByDr = this.referredByDrList.find(a => a.FullName == this.report.ProviderName);
  //   else
  //     this.selReferredByDr = this.referredByDrList.find(a => a.FullName == "Self");
  // }


  // public GetAllReportTemplates() {
  //   this.imagingBLService.GetAllReportTemplates()
  //     .subscribe(res => {
  //       if (res.Status == "OK") {
  //         this.reportTemplates = res.Results;
  //         this.changeReportTemplate = true;
  //         this.selectedTemplate = this.reportTemplates.find(a => a.TemplateId == this.report[0].ReportTemplateId);
  //       }
  //       else {
  //         this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ["Failed to get Report Templates. Check Log"]);
  //         console.log(res.ErrorMessage);
  //       }
  //     });
  // }
  public GetAllReportTemplates(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.imagingBLService.GetAllReportTemplates()
        .subscribe(res => {
          if (res.Status == "OK") {
            this.reportTemplates = res.Results;
            this.changeReportTemplate = true;
            this.selectedTemplate = this.reportTemplates.find(a => a.TemplateId == this.report[0].ReportTemplateId);
            resolve(); // Resolve the promise
          } else {
            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ["Failed to get Report Templates. Check Log"]);
            console.log(res.ErrorMessage);
            reject(); // Reject if there's an error
          }
        });
    });
  }
  private GetAllDicomImageList() {

    this.changeDicomImageList = false;
    this.imagingBLService.GetDicomImageList(this.oldPatientStudyIds)
      .subscribe(res => {

        if (res.Status == "OK" && res.Results) {


          this.dicomImageDatas = res.Results;
          if (this.dicomImageDatas.length > 0) {
            this.changeDicomImageList = true;
          } else {
            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Notice, ['There is no uploaded dicom images or all files are mapped with Patient.']);
          }
        }
        else {
          this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ["failed to get Patient Images" + res.ErrorMessage]);
        }
      });
  }



  AddDicomImage() {
    this.report[0].PatientStudyId = this.dicomImageDatas.filter(s => s.IsMapped == true).map(k => k.PatientStudyId).join(',');
    //this.report.MappedOldStudyId = this.dicomImageDatas.filter(s => s.IsSelected == true).map(k => k.PatientStudyId).join(',');
    this.changeDicomImageList = false;

  }

  //this for make image album for show in lightbox
  public MakeImgAlbum() {
    try {
      if (this.report[0].ImageName) {
        let albumTemp = [];
        //this.album = [];
        let imageNames = this.report[0].ImageName.split(";");
        imageNames.forEach(imgName => {

          //let imgPath = this.imageUploadFolderPath + this.report.ImagingTypeName + "/" + imgName;
          // let imgPath = "/app/fileuploads/Radiology/" + this.report.ImagingTypeName + "/" + imgName;
          let imgPath = "/fileuploads/Radiology/" + this.report[0].ImagingTypeName + "/" + imgName;
          //const image = {
          //  src: imgPath,
          //  caption: imgName,
          //  thumb: null,
          //  isActive: false
          //}

          //this.album.push(image);

          this.ConvertImgSrcUrlToBase64(imgPath, function (dataUri) {
            // Do whatever you'd like with the Data URI!

            let image = {
              src: dataUri,
              caption: imgName,
              thumb: null,
              isActive: false
            }

            albumTemp.push(image);

          });

        });

        this.album = albumTemp;
      }
    } catch (exception) {
      this.ShowCatchErrMessage(exception);
    }
  }
  //<input type='file' binds the selected files to this fileInput
  @ViewChild("fileInput") fileInput;
  //calls addReport function of imaging-requistion.component
  //orderStatus is either 'final' or 'pending' depending on submit button click or save button click.

  SaveReport() {
    this.AddReport("pending");
  }

  SubmitAndPrintReport() {
    this.AddReport("final");
    //this.PrintReportHTML();
  }
  AddReport(orderStatus) {
    try {
      // Step 1: Validate mandatory fields
      const isValidationSuccessful = this.CheckValidations();
      if (!isValidationSuccessful) {
        return;
      }

      let files = [];
      let isValidSignature = false;

      // Step 2: Process each report item
      this.report.forEach(reportItem => {
        // Populate report item with default or selected values
        reportItem.PrescriberName = this.selectedPrescriberName || 'self';
        reportItem.PrescriberId = this.selectedPrescriberId || 0;
        reportItem.PerformerName = this.SelectedPerformerName || '';
        reportItem.PerformerId = this.SelectedPerformerId || 0;
        reportItem.ReferredById = this.SelectedRefId;
        reportItem.ReferredByName = this.SelectedReferrerName;
        reportItem.Signatories = this.Signatories;

        // Handle report template assignments
        if (this.SelectedReportTemplates && this.SelectedReportTemplates.length > 0) {
          reportItem.ReportTemplateIdsCSV = this.SelectedReportTemplates.map(template => template.TemplateId).join(',');
          reportItem.ReportTemplateId = this.SelectedReportTemplates.length === 1
            ? this.SelectedReportTemplates[0].TemplateId
            : null;
        } else {
          reportItem.ReportTemplateIdsCSV = null;
          reportItem.ReportTemplateId = null;
        }

        // Validate signatories if no reporting doctors exist
        if (!this.reportingDoctors.length) {
          this.UpdateValidator("off", "Signatories", "required");
        }

        // Update and validate controls
        Object.keys(this.ReportValidator.controls).forEach(control => {
          const controlItem = this.ReportValidator.controls[control];
          controlItem.markAsDirty();
          controlItem.updateValueAndValidity();
        });

        // Validate signature
        if (this.CheckIfSignatureValid()) {
          isValidSignature = true;

          // Handle image uploads if enabled
          if (this.enableImgUpload && this.album.length > 0) {
            let count = 1;
            this.album.forEach(img => {
              const singleFile = this.ConvertDataURLtoFile(img.src, `img_${count}`);
              files.push(singleFile);
              count++;
            });
          }

          // Update performer details from signatory if enabled
          if (this.enableDoctorUpdateFromSignatory) {
            const signData = JSON.parse(reportItem.Signatories);
            if (signData && signData.length === 1) {
              reportItem.PerformerIdInBilling = signData[0].EmployeeId;
              reportItem.PerformerNameInBilling = signData[0].EmployeeFullName;
            } else {
              reportItem.PerformerIdInBilling = null;
              reportItem.PerformerNameInBilling = null;
            }
          }

          // Sanitize footer texts if present
          if (reportItem.FooterTextsList.length) {
            reportItem.FooterTextsList = this.sanitizeFooterTextsList(reportItem.FooterTextsList);
            const selectedFooter = reportItem.FooterTextsList.find(footer => footer.IsChecked);
            reportItem.SelectedFooterTemplateId = selectedFooter ? selectedFooter.SelectedFooterTemplateId : null;
          }
        } else {
          this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ['Please enter a valid signature.']);
          return;
        }
      });

      // Step 3: Emit report if valid signature is present
      if (isValidSignature) {
        this.addreport.emit({ reportFiles: files, report: this.report, orderStatus: orderStatus, selectedTemplateStyle: this.SelectedTemplateStyle });
      }
    } catch (exception) {
      // Handle exceptions
      this.ShowCatchErrMessage(exception);
      this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, ['Please check console log for details']);
    }
  }
  CheckValidations(): boolean {
    // If performer is mandatory, validate its presence
    if (this.IsPerformerMandatory && (!this.SelectedPerformerId || this.SelectedPerformerId === 0)) {
      this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Notice, ['Performer is mandatory.']);
      this.loading = false;
      return false;
    }

    // Validate report templates
    if (!this.report[0].ReportTemplateId && !this.report[0].ReportTemplateIdsCSV) {
      this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ['Please select a report template.']);
      this.loading = false;
      return false;
    }
    if (!this.SelectedTemplateStyle) {
      this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ['No Template style found for print page, Please select a template style from setting.']);
      this.loading = false;
      return false;
    }

    // If all validations pass
    return true;
  }
  // Sanitize Footer Texts List
  sanitizeFooterTextsList(footerTextsList: FooterTextsList_Dto[]) {
    return footerTextsList.map(item => {
      const sanitizedText = item.Text.trim();
      return {
        Text: sanitizedText,
        IsChecked: item.IsChecked,
        SelectedFooterTemplateId: item.SelectedFooterTemplateId
      };
    });
  }

  Close() {
    try {
      if (this.report) {
        var close: boolean;
        close = window.confirm('Changes will be discarded. Do you want to close anyway?');
        if (!close)
          return;
      }
      this.album = [];
      //this.report = null;
      this.report = [];
      this.showreport = false;
      this.templateData = null;
      this.isReadOnly = false;
      this.closeAddReport.emit(close)
    } catch (exception) {
      this.ShowCatchErrMessage(exception);
    }

  }

  ClosePat() {
    this.changeDicomImageList = false;
  }

  //get report template data from ckEditor onChange
  onChangeEditorData(data) {
    try {
      this.report.forEach(reportItem => {
        reportItem.ReportText = data;
      });
    } catch (exception) {
      this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, ["Please check log for details error"]);
      this.ShowCatchErrMessage(exception);
    }
  }

  open(index: number): void {
    try {
      // open lightbox
      this.lightbox.open(this.album, index);
    } catch (exception) {
      this.ShowCatchErrMessage(exception);
    }
  }
  //Fires when user click select all for delete
  SelectImageCheckboxOnChange() {
    try {
      //all selected check
      let flag = true;
      this.album.forEach(x => {
        if (!x.isActive) {
          flag = false;
        }
      });
      this.allImagSelect = (flag == true) ? true : false;
      //this.SelectDeselectAllImages();
    } catch (exception) {
      this.ShowCatchErrMessage(exception);
    }

  }

  //when user check or uncheck AllImages checkbox  fires this method
  SelectDeselectAllImages() {
    try {
      if (this.allImagSelect) {
        this.album.forEach(x => {
          if (x.isActive == false)
            x.isActive = true;
        });
      } else {
        this.album.forEach(x => {
          if (x.isActive == true)
            x.isActive = false;
        });
      }
    } catch (exception) {
      this.ShowCatchErrMessage(exception);
    }
  }

  //delete user selected saved images
  DeleteImagesAndSave(orderStatus) {
    try {
      //uploadedImgCount = imgReport.ImageName.split(";").length;
      //fruits.join(";");  
      let countImgs = this.album.filter(x => x.isActive == true).length;
      if (countImgs) {

        this.loading = true;
        let reportNewForDel: ImagingItemReport = new ImagingItemReport();
        let images = [];
        this.album.forEach(img => {
          if (img.isActive == false)
            images.push(img.caption);
        });

        var deleteImages: boolean;
        deleteImages = window.confirm('Are you sure you want to delete selected images ?');
        if (!deleteImages)
          return;
        reportNewForDel = Object.assign(reportNewForDel, this.report);
        reportNewForDel.ImageName = images.join(";");
        reportNewForDel.Patient = null;
        reportNewForDel.ReportText = null; //for less call load, we don't want to update report text in delete images call                
        this.imagingBLService.DeleteImgsByImgingRptId(reportNewForDel)
          .subscribe(res => {
            this.loading = false;
            if (res.Status == "OK") {
              this.CallBackDeleteImages(res.Results);
            }
            else {
              this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, [res.ErrorMessage]);
              this.loading = false;
            }
          });
      }
      else {
        this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Notice, ["Please select image to delete."]);
      }

    }
    catch (exception) {
      this.ShowCatchErrMessage(exception);
    }
  }


  CallBackDeleteImages(result) {
    try {
      this.loading = false;
      if (result) {
        this.report[0].ImageFullPath = result.ImageFullPath;
        this.report[0].ImageName = result.ImageName;
        this.MakeImgAlbum();//make image album after img deleted
        this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Success, ["Image(s) successfully deleted."]);
      }
    } catch (exception) {
      throw exception;
    }
  }
  //This function only for show catch messages
  ShowCatchErrMessage(exception) {
    if (exception) {
      this.loading = false;
      let ex: Error = exception;
      this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, ["Check error in Console log !"]);
      console.log("Error Messsage =>  " + ex.message);
      console.log("Stack Details =>   " + ex.stack);
    }
  }

  public AssignSelectedReport() {
    if (this.selectedTemplate && this.selectedTemplate.TemplateId) {
      let isTemplateAlreadySelected = this.SelectedReportTemplates.some(
        t => t.TemplateId === this.selectedTemplate.TemplateId
      );
      if (isTemplateAlreadySelected) {
        this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Notice, ["This template is already selected."]);
        return;
      }
    }
    // Using this condition check since this function was called even during initialization.
    if (this.report[0].ReportTemplateId !== this.selectedTemplate.TemplateId) {
      if (this.report[0].ReportText) {
        const change = window.confirm('Are you sure you want to Add this template ?');
        if (!change) {
          this.selectedTemplate = this.reportTemplates.find(a => a.TemplateId === this.report[0].ReportTemplateId);
          return;
        }
      }

      // Add the selected template to the list
      this.SelectedReportTemplates.push(this.selectedTemplate);
      this.GetTemplateStyleByTemplateId(this.selectedTemplate.TemplateId);

      if (this.SelectedReportTemplates && this.SelectedReportTemplates.length) {
        this.report.forEach((rep, index) => {
          // Update ReportText and TemplateName for each report
          rep.ReportText = this.report[index].ReportText.concat(this.selectedTemplate.TemplateHTML);
          rep.TemplateName = this.report[index].TemplateName
            ? this.report[index].TemplateName.concat(', ' + this.selectedTemplate.TemplateName)
            : this.selectedTemplate.TemplateName;
          rep.ReportTemplateId = this.SelectedReportTemplates[0].TemplateId;

          // Handle FooterTextsList for each report
          if (this.selectedTemplate.FooterNote) {
            // Check if a footer with the same TemplateId already exists
            const existingFooter = this.report[index].FooterTextsList.find(
              footer => footer.SelectedFooterTemplateId === this.selectedTemplate.TemplateId
            );

            if (!existingFooter) {
              // Add the new footer since it doesn't already exist
              this.report[index].FooterTextsList.push({
                SelectedFooterTemplateId: this.selectedTemplate.TemplateId,
                Text: this.selectedTemplate.FooterNote,
                IsChecked: this.SelectedReportTemplates.length === 1 // Check only the first selected template
              });
            }
          }

          // Ensure only the first selected footer remains checked
          const firstSelectedTemplateId = this.SelectedReportTemplates[0].TemplateId;
          this.report[index].FooterTextsList.forEach(footer => {
            footer.IsChecked = footer.SelectedFooterTemplateId === firstSelectedTemplateId;
          });

          console.log(this.report[index].FooterTextsList);
        });
      } else {
        // Handle the first template assignment
        this.report[0].ReportText = this.selectedTemplate.TemplateHTML;
        this.report[0].TemplateName = this.selectedTemplate.TemplateName;
        this.report[0].ReportTemplateId = this.selectedTemplate.TemplateId;

        // Add or update the footer in FooterTextsList
        if (this.selectedTemplate.FooterNote) {
          const existingFooter = this.report[0].FooterTextsList.find(
            footer => footer.SelectedFooterTemplateId === this.selectedTemplate.TemplateId
          );

          if (!existingFooter) {
            this.report[0].FooterTextsList.push({
              SelectedFooterTemplateId: this.selectedTemplate.TemplateId,
              Text: this.selectedTemplate.FooterNote,
              IsChecked: this.SelectedReportTemplates.length === 1 // Check only the first selected template
            });
          }
        }

        // Ensure only the first selected footer remains checked
        const firstSelectedTemplateId = this.SelectedReportTemplates[0].TemplateId;
        this.report[0].FooterTextsList.forEach(footer => {
          footer.IsChecked = footer.SelectedFooterTemplateId === firstSelectedTemplateId;
        });
      }
    }
  }


  ReportTempListFormatter(data: any): string {
    return data["TemplateName"];
  }

  public AssignPrescriberDr() {
    this.report[0].PrescriberName = this.selectedPrescriberName;
    this.report[0].PrescriberId = this.selectedPrescriberId;
    this.report[0].ReferredById = this.SelectedRefId;
    this.report[0].ReferredByName = this.SelectedReferrerName;
  }


  //validation check if the item is selected from the list
  public CheckIfSignatureValid(): boolean {
    if (!this.addReportWithoutSignatory) {
      if (this.report[0].Signatories) {
        var signatureList = JSON.parse(this.report[0].Signatories);
        if (!(signatureList && signatureList.length)) {
          this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ["Please select at least one signature from the list."]);
          return false;
        }
        var validSignature = signatureList.find(a => a.Signature != null);
        if (validSignature) {
          return true;
        }
        else {
          this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ["Please select valid signature from the list."]);
          return false;
        }
        // for(var i=0; i<signatureList.length; i++){
        //     if(signatureList[i].length){
        //       if (!(signatureList && signatureList.length && signatureList.Signature.length)) {
        //         this.msgBoxServ.showMessage("failed", ["Please select at least one signatory from the list."]);
        //         return false;
        //       }
        //       return true;
        //     }else {
        //       this.msgBoxServ.showMessage("failed", ["Please insert Radiology Signature from Settings before adding report."]);
        //       return false;
        //     }
        // }
      } else {
        this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ["Please select at least one signatory from the list."]);
        return false;
      }
    } else {
      if (this.report[0].Signatories) {
        var signatureList = JSON.parse(this.report[0].Signatories);
        if (!(signatureList && signatureList.length)) {
          this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, [
            "Please select at least one signatory from the list.",
          ]);
          return false;
        }
        return true;
      } else {
        this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ["Please select at least one signatory from the list."]);
        return false;
      }
    }

  }


  //using validation logic here instead of model. because we're not initializing new ImnagingItemReport() but
  //direclty getting the report model from server side which don't have validation.
  public IsDirty(fieldName): boolean {
    if (fieldName == undefined)
      return this.ReportValidator.dirty;
    else
      return this.ReportValidator.controls[fieldName].dirty;
  }
  public IsValidCheck(fieldName, validator): boolean {
    if (fieldName == undefined) {
      return this.ReportValidator.valid;
    }
    else
      return !(this.ReportValidator.hasError(validator, fieldName));
  }
  public UpdateValidator(onOff: string, formControlName: string, validatorType: string) {
    let validator = null;
    if (validatorType == 'required' && onOff == "on") {
      validator = Validators.compose([Validators.required]);
    }
    else {
      validator = Validators.compose([]);
    }
    this.ReportValidator.controls[formControlName].validator = validator;
    this.ReportValidator.controls[formControlName].markAsUntouched();
    this.ReportValidator.controls[formControlName].updateValueAndValidity();
  }

  onShortCutPressed($event) {

    console.log('shortcut pressed');
    console.log($event);

    if ($event.name == "CTRL+S") {
      this.SaveReport();
    }
    else if ($event.name == "CTRL+P") {
      this.SubmitAndPrintReport();
    }

  }

  //prat: 13sep2019 for internal and external referrer 
  public defaultExtRef: boolean = true;
  selectedPrescriberId: number = null;
  selectedPrescriberName: string = null;
  SelectedPerformerName: string = null;

  OnPrescriberChanged($event) {
    this.selectedPrescriberId = $event.ReferrerId; //EmployeeId comes as ReferrerId from select referrer component.
    this.selectedPrescriberName = $event.ReferrerName;//EmployeeName comes as ReferrerName from select referrer component.
  }
  //end: Pratik: 12Sept'19--For External Referrals

  OnPerformerChanged($event) {
    this.SelectedPerformerId = $event.ReferrerId;
    this.SelectedPerformerName = $event.ReferrerName;
  }

  OnReferrerChanged($event) {
    this.SelectedRefId = $event.ReferrerId;
    this.SelectedReferrerName = $event.ReferrerName;
  }

  public fileChangeEvent(fileInput: any) {
    //this.album = [];
    if (fileInput.target.files && fileInput.target.files.length > 0) {

      let albumTemp = this.album;//since we can't access this.album inside the reader.onload function because of this-that issue of javascript/typescript.
      for (var i = 0; i < fileInput.target.files.length; i++) {

        let currFile = fileInput.target.files[i];
        //console.log();

        var reader = new FileReader();
        //reader["FileName"] = currFile.name;//adding a new property to reader object so that we can access it later inside onload funciton.
        //this.album
        reader.onload = function (e: any) {
          let imgDataUrl = e.target.result;
          let image = {
            src: imgDataUrl,
            caption: e.target.FileName,
            thumb: null,
            isActive: false
          }

          albumTemp.push(image);

        }
        reader.readAsDataURL(currFile);
      }

      this.fileInput.nativeElement.value = "";

      this.album = albumTemp;

    }
  }

  RemoveSingleImage(indx) {
    this.album.splice(indx, 1);
  }

  public ConvertDataURLtoFile(dataurl, filename) {
    var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
      bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
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
    };

    image.src = url;
  }



  //ImageReArrange_Drop(event: CdkDragDrop<string[]>) {
  //  moveItemInArray(this.album, event.previousIndex, event.currentIndex);
  //}

  // hotkeys(event: any): void {
  //   if (event.keyCode === 27) {
  //     this.Close();
  //   }
  // }
  ClearTemplateDetails() {
    const confirmed = window.confirm("Are you sure you want to clear the content?");
    if (confirmed) {
      // if (this.selectedTemplate) {
      if (this.report && this.report.length) {
        this.report.forEach((rep) => {
          // Clear the necessary properties for each report
          rep.ReportTemplateId = 0;
          rep.ReportTemplateIdsCSV = '';
          rep.TemplateName = '';
          rep.ReportText = '';
          rep.FooterTextsList = [];
          rep.FooterText = '';
        });

        // Reset the selected template
        this.selectedTemplate = null;
      }


      this.SelectedReportTemplates = [];
    }
  }
  OnFooterSelected(selectedFooterNote: FooterTextsList_Dto) {
    this.report[0].FooterTextsList.forEach(footer => footer.IsChecked = false);
    selectedFooterNote.IsChecked = true;

    this.report[0].SelectedFooterTemplateId = selectedFooterNote.IsChecked ? this.selectedTemplate.TemplateId : null;
  }
  public GetTemplateStyleByTemplateId(templateReportId: number | undefined | null): void {
    this.TemplateStyleList = this.radiologyService.TemplateStyleList;
    if (this.TemplateStyleList && this.TemplateStyleList.length) {
      this.selectTemplate(templateReportId);
    } else {
      this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Notice, ["There is no template style. Please select one from setting."])
    }
    return;

  }
  selectTemplate(templateReportId: number | undefined | null) {
    if (!this.TemplateStyleList || this.TemplateStyleList.length === 0) {
      this.SelectedTemplateStyle = null;
      return;
    }
    const tempStyle = this.TemplateStyleList.find(temp => (temp.TemplateId === templateReportId && temp.IsActive === true) || null);
    if (tempStyle) {
      this.SelectedTemplateStyle = tempStyle;
    } else {
      this.SelectedTemplateStyle = this.TemplateStyleList.find(temp => temp.IsActive === true && temp.TemplateCode.toLocaleLowerCase() === ENUM_TemplateStyleName.Default);
    }
  }
}


