import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, Validators } from '@angular/forms';
import * as moment from 'moment';
import { UploadedFile_DTO } from '../../ot/shared/dto/uploaded-file.dto';
import GridColumnSettings from '../../shared/danphe-grid/grid-column-settings.constant';
import { GridEmitModel } from '../../shared/danphe-grid/grid-emit.model';
import { UploadedFile } from '../../shared/DTOs/uploaded-files-DTO';
import { MessageboxService } from '../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponseText, ENUM_MessageBox_Status } from '../../shared/shared-enums';
import { ClaimManagementBLService } from '../shared/claim-management.bl.service';
import { AddAttachmentDTO, ProcessedClaim_Dto } from '../shared/DTOs/processed-claim.dto';

@Component({
  selector: 'processed-claims',
  templateUrl: './processed-claims.component.html',
  styleUrls: ['./processed-claims.component.css']
})
export class ProcessedClaimsComponent implements OnInit {
  public fromDate: string = '';
  public toDate: string = '';
  public Loading: boolean = false;
  public ProcessedClaimList: ProcessedClaim_Dto[] = [];
  public ProcessedClaimColumn: Array<any> = null;
  public DateRange: string = "today";
  ShowUploadPopup: boolean = false;
  patientInfo: { ClaimedDate: string; ClaimCode: string; PolicyNo: string; ShortName: string; PatientCode: string; ClaimReferenceNo: string; Gender: string; Age: number; VisitType: string; VisitCode: string };
  public NewFiles = Array<File>();
  public files = Array<File>();
  public SelectedFilesForUpload: Array<UploadedFile> = new Array<UploadedFile>();
  IsFileTypeValid: boolean = true;
  IsFileSizeValid: boolean = true;
  SerializedFileData: string = null;
  FileBase64Url: string = null;
  CheckListFormArray: FormArray;
  tempUploadedFiles: Array<{ FileBase64Url: string; FileData: string }> = [];

  constructor(
    private msgBoxServ: MessageboxService,
    private _claimManagementBLService: ClaimManagementBLService,
    private fb: FormBuilder,
  ) {
    this.ProcessedClaimColumn = GridColumnSettings.ProcessedClaimColumn;
    this.CheckListFormArray = this.fb.array([]); // Initialize the FormArray
  }

  ngOnInit() {
    // Initialize the form array with controls
    this.CheckListFormArray = this.fb.array(this.SelectedFilesForUpload.map(() => this.fb.group({
      CheckListValue: ['', Validators.required]
    })));
  }

  OnFromToDateChange($event) {
    this.fromDate = $event.fromDate;
    this.toDate = $event.toDate;
  }

  LoadDetails(fromdate, toDate): void {
    this._claimManagementBLService.GetSubmittedClaims(fromdate, toDate)
      .finally(() => { this.Loading = false })
      .subscribe(res => {
        if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
          if (res.Results.length) {
            this.ProcessedClaimList = res.Results;
          }
        }
        else {
          this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, ["failed to get submitted claims.. please check log for details."]);
          console.log(res.ErrorMessage);
        }
      },
        (err) => {
          this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, [`Exception: ${err.ErrorMessage}`]);
        }
      );
  }

  public GridAction($event: GridEmitModel) {
    switch ($event.Action) {
      case "Upload": {
        this.UploadDocument($event.Data);
        break;
      }
      default:
        break;
    }
  }

  UploadDocument(patInfo) {
    this.patientInfo = patInfo;
    this.ShowUploadPopup = true;
  }

  ClosDocumentUploadPopUp() {
    this.ShowUploadPopup = false;
    this.files = [];
    this.NewFiles = [];
    this.SelectedFilesForUpload = [];
  }

  public SelectFiles(event: any): void {
    if (event) {
      this.NewFiles = Array.from(event.target.files);

      // Filter only valid PDF and image files
      const validFiles = this.NewFiles.filter(file =>
        file.type === 'application/pdf' || file.type.startsWith('image/')
      );

      if (validFiles.length === 0) {
        console.error("No valid files selected. Please upload only PDFs or image files.");
        return;
      }

      if (this.CheckForValidFileFormat(validFiles)) {
        this.files = [...this.files, ...validFiles];
        this.SelectedFilesForUpload = [];

        this.files.forEach(file => {
          let document = new UploadedFile();
          document.FileDisplayName = file.name;
          document.FileExtension = file.type;
          document.Size = file.size;
          document.SizeInString = this.formatFileSize(file.size);
          document.UploadedOn = moment().format('YYYY-MM-DD');
          document.Type = file.type;

          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => {
            const tempFile = reader.result.toString();
            const indx = tempFile.indexOf(',');
            const binaryString = tempFile.substring(indx + 1);
            document.BinaryData = binaryString;
          };

          this.SelectedFilesForUpload.push(document);
        });

        this.CheckListFormArray = this.fb.array(this.SelectedFilesForUpload.map(() => this.fb.group({
          CheckListValue: ['', Validators.required]
        })));
      }
    }
  }

  formatFileSize(size: number): string {
    if (size < 1024) {
      return size + ' bytes';
    } else if (size < 1048576) {
      return (size / 1024).toFixed(2) + ' KB';
    } else {
      return (size / 1048576).toFixed(2) + ' MB';
    }
  }

  public RemoveSelectedDocument(index: number): void {
    this.files.splice(index, 1);
    this.SelectedFilesForUpload.splice(index, 1);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
    this.CheckListFormArray.removeAt(index);
  }

  public CheckForValidFileFormat(filesFromUser: Array<File>): Boolean {
    let isValidFile = false;
    const files = Array.from(filesFromUser);
    const validFileFormats = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    for (let item of files) {
      if (validFileFormats.includes(item.type) && item.type !== "") {
        isValidFile = true;
      } else {
        isValidFile = false;
        this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Warning, ["Some File format is not valid (Allowed file formats are: PDF, JPEG, JPG, PNG)."]);
        break;
      }
    }
    return isValidFile;
  }

  public UploadFile(): void {
    if (this.SelectedFilesForUpload.length === 0) {
      this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Warning, ["No files selected for upload."]);
      return;
    }

    const documents = this.SelectedFilesForUpload.map((file, index) => {
      this.CheckFileValidation(file);
      if (!this.IsFileTypeValid || !this.IsFileSizeValid) {
        return null;
      }
      const fileData = {
        filename: file.FileDisplayName,
        mime: file.FileExtension,
        title: file.FileDisplayName,
        date: moment().format('YYYY-MM-DD'),
        isRolledBack: true,
        document: file.BinaryData
      };
      this.SerializedFileData = JSON.stringify(fileData);
      this.FileBase64Url = `data:${file.FileExtension};base64,${file.BinaryData}`;
      this.CheckListFormArray.at(index).get('CheckListValue').setValue(this.SerializedFileData);
      this.tempUploadedFiles[index] = {
        FileBase64Url: this.FileBase64Url,
        FileData: this.SerializedFileData
      };
      return fileData;
    }).filter(file => file !== null);

    const addAttachment: AddAttachmentDTO = {
      claim: this.patientInfo.ClaimCode,
      documents: documents
    };
    if (this.IsFileTypeValid === true && this.IsFileSizeValid === true) {
      this.Loading = true;
      this._claimManagementBLService.UploadDocument(addAttachment)
        .finally(() => { this.Loading = false })
        .subscribe({
          next: (res) => {
            if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
              this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Success, ["Files uploaded successfully."]);
              this.ClosDocumentUploadPopUp();
            } else {
              this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, [res.Results]);
            }
          },
          error: (error) => {
            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, ["Failed to upload files."]);
            console.error('Error uploading files:', error);
          }
        });
    }

  }

  CheckFileValidation(file: UploadedFile_DTO): void {
    this.IsFileTypeValid = true;
    this.IsFileSizeValid = true;
    const acceptedImageTypes: string[] = ['image/jpeg', 'image/jpg', 'image/png'];
    const acceptedFileTypes: string[] = ['application/pdf'];
    const isImage: boolean = acceptedImageTypes.includes(file.Type);
    const isFile: boolean = acceptedFileTypes.includes(file.Type);

    if (!isImage && !isFile) {
      this.IsFileTypeValid = false;
      return this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Notice, ["Please ensure that only image files (JPEG, JPG, PNG) or PDF files are accepted."]);
    }

    // Check if the individual file size exceeds 3 MB
    if (file.Size > 3145728) { // 3 MB in bytes
      this.IsFileSizeValid = false;
      return this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Notice, ["Each file must be less than 3 MB."]);
    }

    // Calculate the total size of all selected files
    const totalSize = this.files.reduce((acc, curr) => acc + curr.size, 0);
    if (totalSize > 3145728) { // 3 MB in bytes
      this.IsFileSizeValid = false;
      return this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Notice, ["The combined file size must be less than 3 MB."]);

    }


  }
}
