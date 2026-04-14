import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import * as moment from 'moment/moment';
import { CoreService } from '../../../core/shared/core.service';
import { Patient } from '../../../patients/shared/patient.model';
import { SecurityService } from '../../../security/shared/security.service';
import { MessageboxService } from '../../../shared/messagebox/messagebox.service';
import { ENUM_MessageBox_Status } from '../../../shared/shared-enums';
import { ERGetConsentForm_DTO } from '../../shared/dto/er-get-consent-form.dto';
import { EmergencyPatientModel } from '../../shared/emergency-patient.model';
import { EmergencyBLService } from '../../shared/emergency.bl.service';
import { UploadCosentFormModel } from '../../shared/upload-consent-form.Model';

@Component({
  selector: 'upload-consent',
  templateUrl: "./upload-consent.component.html",
  host: { '(window:keyup)': 'hotkeys($event)' }
})

export class uploadConsentAcionComponent {
  @Input("ERPatientId")
  public ERPatientId: any;

  @Input("patientDetail")
  public patientDetail: Patient = new Patient;
  @ViewChild("fileInput") fileInput;

  public loading: boolean = false;
  @Output("callBackClose")
  public callBackFileUploadClose: EventEmitter<Object> = new EventEmitter<Object>();

  public uploadedDocumentslist: Array<ERGetConsentForm_DTO> = new Array<ERGetConsentForm_DTO>();
  public selectedFile: UploadCosentFormModel = new UploadCosentFormModel();
  public selectedERPatientToEdit: EmergencyPatientModel = new EmergencyPatientModel();
  fileSrc: SafeResourceUrl;
  FileName: string = "";
  ShowImageFilePreviewPopUp: boolean = false;
  IsInitialLoad: boolean = false;

  constructor(public securityService: SecurityService,
    public coreService: CoreService,
    public emergencyBLService: EmergencyBLService,
    public msgBoxServ: MessageboxService,
    private _sanitizer: DomSanitizer
  ) {

  }
  ngOnInit() {
    this.IsInitialLoad = true;
    this.GetConsentFormUploadList();
  }
  SubmitFiles() {
    try {
      this.loading = true;
      ///Takes Files 
      let files = null;
      files = this.fileInput.nativeElement.files;
      //Check Validation 
      for (var i in this.selectedFile.FileUploadValidator.controls) {
        this.selectedFile.FileUploadValidator.controls[i].markAsDirty();
        this.selectedFile.FileUploadValidator.controls[i].updateValueAndValidity();
      }
      if (this.selectedFile && !this.selectedFile.DisplayName && this.selectedFile.DisplayName.trim().length == 0) {
        this.loading = false;
        this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, ["Please Enter display name"]); return;
      }
      if (this.selectedFile && this.selectedFile.DisplayName && this.selectedFile.DisplayName.trim().length > 0) {
        let duplicateName = this.uploadedDocumentslist.find(x => x.DisplayName == this.selectedFile.DisplayName)
        if (!!duplicateName) {
          this.loading = false;
          this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, ["Duplicate File name not allowed"]);
          return;
        }
      }

      if (this.ValidateFileSize(files)) {
        if (files.length) {
          if (this.selectedFile && this.selectedFile.FileType != ".pdf") {
            this.selectedFile.FileName = this.selectedFile.DisplayName + "_" + moment().format('DDMMYY');
            this.selectedFile.PatientId = this.patientDetail.PatientId;
            this.selectedFile.ERPatientId = this.ERPatientId;
            console.log(this.selectedFile);
            console.log(files);
            this.AddReport(files, this.selectedFile);
            this.loading = false;
          }
        }
        else {
          this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, ["Please Select Report File "]);
          this.loading = false;
        }
      }
    } catch (ex) {
      this.ShowCatchErrMessage(ex);
    }

  }
  //This function only for show catch messages
  public ShowCatchErrMessage(exception) {
    if (exception) {
      let ex: Error = exception;
      this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, ["Check error in Console log !"]);
      this.Close();
    }

    this.loading = false;
  }
  Close() {
    this.callBackFileUploadClose.emit({ close: true });
    console.log('Event emitted with data:', { close: true });

  }
  public ValidateFileSize(files) {
    let flag = true;
    let errorMsg = [];
    errorMsg.push("files size must be less than 10 mb");
    if (files) {
      for (let i = 0; i < files.length; i++) {
        if (files[i].size > 10485000) {
          flag = false;
          errorMsg.push(files[i].name);
        }
      }
      if (flag == false) {
        this.msgBoxServ.showMessage("notice", errorMsg);
        this.loading = false;
      }
      return flag;
    }
  }
  AddReport(filesToUpload, selFile): void {
    this.loading = true;
    try {
      ///Read Files and patientFilesModel Data to Some Variable           
      if (filesToUpload.length || selFile) {
        this.emergencyBLService.UploadConsentForm(filesToUpload, selFile)
          .subscribe(res => {
            if (res.Status == "OK") {
              this.selectedFile = new UploadCosentFormModel();
              this.fileInput.Value = null;
              this.fileInput.nativeElement.value = "";
              this.GetConsentFormUploadList();
              this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Success, ['File Uploded']);
              this.loading = false;
            }
            else {
              this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, [res.ErrorMessage]);
              this.loading = false;
            }
          },
            err => { this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, [err.ErrorMessage]); this.loading = false; }
          );
      }
    } catch (exception) {
      this.ShowCatchErrMessage(exception);
    }
  }
  RemoveFile(Fileid) {
    this.emergencyBLService.DeleteFile(Fileid).subscribe((res) => {
      if (res.Status == 'OK') {
        console.log(this.uploadedDocumentslist);
        this.uploadedDocumentslist = this.uploadedDocumentslist.filter(p => (p.FileId != Fileid)).slice();
        this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Success, ['File successfully removed']);
      }
    }, err => {
      this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ['Failed to Remove File']);
    });
  }
  GetConsentFormUploadList(): void {
    this.emergencyBLService.GetConsentFormUploadList(this.ERPatientId)
      .subscribe((res) => {
        if (res.Status == 'OK') {
          this.uploadedDocumentslist = res.Results.allFileList;
          if (res.Results.filesNotFoundCount && this.IsInitialLoad) {
            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Notice, [`Additional ${res.Results.filesNotFoundCount} Patient File(s) can't be retrieved from the current location.`]);
            this.IsInitialLoad = false;
          }
          console.log(`Uploaded files are: ${this.uploadedDocumentslist}`);
        }
      }, err => {
        this.msgBoxServ.showMessage('failed', ['Failed to Load Patient Consent File List']);
      });
  }

  /**
   * 
   * @param file : Object of ERGetConsentForm_DTO
   * @returns void
   * @description created by Sanjeev on 9th-Jul-2024 : It is used to convert Image Binary Data into Image And Download that Image 
   */
  DownloadConsent(file: ERGetConsentForm_DTO): void {
    if (file && file.BinaryData) {
      const base64Data = file.BinaryData.split(',')[1];
      if (base64Data) {
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        const blob = new Blob([bytes], { type: file.FileType });
        const fileName = `${file.DisplayName}${file.FileType}`;
        const linkSource = file.BinaryData;
        const downloadLink = document.createElement('a');

        downloadLink.href = linkSource;
        downloadLink.download = fileName;
        downloadLink.href = URL.createObjectURL(blob);
        downloadLink.click();
      }
    }
  }

  downloadFile(data: Blob) {
    const downloadedFile = new Blob([data], { type: data.type });
    const a = document.createElement('a');
    a.setAttribute('style', 'display:none;');
    const url = window.URL.createObjectURL(downloadedFile);
    document.body.appendChild(a);
    a.download = url;
    a.href = URL.createObjectURL(downloadedFile);
    a.target = '_blank';
    a.click();
    document.body.removeChild(a);
  }

  /**
   * 
   * @param file : Object of ERGetConsentForm_DTO
   * @returns void
   * @description It is used to convert Image Binary Data into Image And Preview that Image 
   */
  PreviewConsent(file: ERGetConsentForm_DTO): void {
    if (file && file.BinaryData) {
      const base64Data = file.BinaryData.split(',')[1];
      if (base64Data) {
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: file.FileType });
        this.fileSrc = this._sanitizer.bypassSecurityTrustResourceUrl(URL.createObjectURL(blob));
        this.FileName = file.DisplayName;
        this.ShowImageFilePreviewPopUp = true;
      }
    }
  }

  CloseFilePreviewPopUp(): void {
    this.ShowImageFilePreviewPopUp = false;
  }

  hotkeys(event): void {
    if (event.keyCode === 27) {
      if (this.ShowImageFilePreviewPopUp) {
        this.CloseFilePreviewPopUp();
      }
    }
  }
}
