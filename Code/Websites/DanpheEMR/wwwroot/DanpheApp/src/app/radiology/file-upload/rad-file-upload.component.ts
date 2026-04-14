import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { BillingBLService } from '../../billing/shared/billing.bl.service';
import { CoreService } from '../../core/shared/core.service';
import { SecurityService } from '../../security/shared/security.service';
import { User } from '../../security/shared/user.model';
import { DanpheHTTPResponse } from '../../shared/common-models';
import { MessageboxService } from '../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status } from '../../shared/shared-enums';
import { FileUpload_DTO } from '../shared/DTOs/file-upload.dto';
import { ImagingBLService } from '../shared/imaging.bl.service';


@Component({
  selector: "rad-file-upload",
  templateUrl: "./rad-file-upload.component.html",
  styleUrls: ["./rad-file-upload.component.css"]
})

export class Rad_FileUploadComponent implements OnInit {
  newPerformer = { EmployeeId: null, EmployeeName: '' };
  @Input("patientImagingDetail")
  public patientImagingDetail: FileUpload_DTO[] = [];
  @Input("is-Add-File")
  public isAddFile: boolean;
  @Input("doctor-List")
  public doctorList: any;
  @Input("selected-imaging-report")
  RadFileUploadValidator: FormGroup;
  @Output() callBackClose = new EventEmitter<void>();
  Uploadedfile: any;
  fileSrc: SafeResourceUrl;
  FileName: string = "";
  ShowFilePreviewPopUp: boolean = false;
  LoggedInUser: User = new User();
  IsPerformerMandatory: boolean = false;


  constructor(private billingBlService: BillingBLService,
    public imagingBLService: ImagingBLService,
    public security: SecurityService,
    public coreService: CoreService,
    public msgBoxServ: MessageboxService,
    private _sanitizer: DomSanitizer,
    public changeDetector: ChangeDetectorRef,
    private fb: FormBuilder) {
    this.GetRadiologyFlowParameter();
    this.LoggedInUser = this.security.GetLoggedInUser();
    // this.SetReportingDoctor();

  }
  SetReportingDoctor() {
    if (this.IsPerformerMandatory) {
      const performer = this.patientImagingDetail[0];
      if (performer.PerformerId) {
        // Set to performer's details
        this.RadFileUploadValidator.get('ReportingDoctor').setValue({
          EmployeeId: performer.PerformerId,
          EmployeeName: performer.PerformerName,
        });
        this.RadFileUploadValidator.get('DisplayReportingDoctor').setValue(performer.PerformerName);
        this.RadFileUploadValidator.get('DisplayReportingDoctorId').setValue(performer.PerformerId);
        this.newPerformer.EmployeeId = performer.PerformerId;
        this.newPerformer.EmployeeName = performer.PerformerName;
      } else {
        // Set to logged-in user's details
        this.RadFileUploadValidator.get('ReportingDoctor').setValue({
          EmployeeId: this.LoggedInUser.Employee.EmployeeId,
          EmployeeName: this.LoggedInUser.Employee.FullName,
        });
        this.RadFileUploadValidator.get('DisplayReportingDoctor').setValue(this.LoggedInUser.Employee.FullName);
        this.RadFileUploadValidator.get('DisplayReportingDoctorId').setValue(this.LoggedInUser.Employee.EmployeeId);
        this.newPerformer.EmployeeId = this.LoggedInUser.Employee.EmployeeId;
        this.newPerformer.EmployeeName = this.LoggedInUser.Employee.FullName;
      }
    } else {
      // Clear fields when performer is not mandatory
      this.RadFileUploadValidator.get('ReportingDoctor').setValue({
        EmployeeId: null,
        EmployeeName: '',
      });
      this.RadFileUploadValidator.get('DisplayReportingDoctor').setValue('');
      this.RadFileUploadValidator.get('DisplayReportingDoctorId').setValue(null);
      this.newPerformer.EmployeeId = null;
      this.newPerformer.EmployeeName = '';
    }
  }



  ngOnInit() {
    if (!this.isAddFile) {
      this.GetPatientFileDetail();
    }
    this.RadFileUploadValidator = this.fb.group({
      File: [null, Validators.required],
      // FileName: ['', Validators.required],
      Remarks: [''],
      ReportingDoctor: ['', Validators.required],
      ReportingDoctorId: [''],
      DisplayReportingDoctor: [''],
      DisplayReportingDoctorId: [''],
      PatientCode: [''],
    });
    this.SetReportingDoctor();

    this.RadFileUploadValidator.get('PatientCode').setValue(this.patientImagingDetail[0].PatientCode);
  }


  onFileChange(event: any) {
    const fileInput = event.target.files[0];
    if (fileInput) {
      this.RadFileUploadValidator.patchValue({
        File: fileInput
      });
      this.RadFileUploadValidator.get('File').updateValueAndValidity();
    }
  }
  GetPatientFileDetail() {
    this.imagingBLService.GetPatientFileDetail(this.patientImagingDetail)
      .subscribe({
        next: (res: DanpheHTTPResponse) => {
          if (res.Status === ENUM_DanpheHTTPResponses.OK) {
            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Success, ['File fetched successfully']);
            this.Uploadedfile = res.Results;
            this.updateFormFields(this.Uploadedfile);
          } else {
            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, ['Failed to fetch file']);
          }
        },
        error: (err) => {
          this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, err.errorMessage);
        }
      });
  }
  OnReportingDoctorChange() {
    // Check if newPerformer is an object, otherwise clear the form control
    // this.newPerformer.EmployeeId = 0;
    // this.newPerformer.EmployeeName = '';
    if (typeof (this.newPerformer) === 'object') {
      this.RadFileUploadValidator.get('ReportingDoctor').setValue({
        EmployeeId: this.newPerformer.EmployeeId,
        EmployeeName: this.newPerformer.EmployeeName
      });
    }
    else if (this.newPerformer == "") {
      // Handle the case where the field is cleared or newPerformer is not an object
      this.RadFileUploadValidator.get('ReportingDoctor').reset({
        EmployeeId: null,
        EmployeeName: ''
      });
    }
  }


  updateFormFields(fileData: any) {
    if (!this.RadFileUploadValidator.get('File').value) {
      this.RadFileUploadValidator.get('File').setValue(fileData.file);
    }
    this.RadFileUploadValidator.get('Remarks').setValue(fileData.file.Description || '');
    if (fileData.fileDetails) {
      let doctor = this.doctorList.find(d => d.EmployeeId === fileData.fileDetails.PerformerId);
      if (doctor) {
        // Update the selectedDoctor object
        this.newPerformer = {
          EmployeeId: doctor.EmployeeId,
          EmployeeName: doctor.EmployeeName
        };
        // Update the form controls
        this.RadFileUploadValidator.get('ReportingDoctor').setValue({
          EmployeeId: doctor.EmployeeId,
          EmployeeName: doctor.EmployeeName
        });
        this.RadFileUploadValidator.get('DisplayReportingDoctor').setValue(doctor.EmployeeName);
        this.RadFileUploadValidator.get('DisplayReportingDoctorId').setValue(doctor.EmployeeId);
        this.changeDetector.detectChanges();
      }
    }
  }
  ReportingDoctorValidator() {
    if (this.IsPerformerMandatory) {
      const reportingDoctor = this.RadFileUploadValidator.get('ReportingDoctor').value;

      if (typeof reportingDoctor === 'object' && reportingDoctor !== null) {
        if (!reportingDoctor.EmployeeId || !reportingDoctor.EmployeeName) {
          this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, ['Reporting Doctor is required.']);
          return false;
        }
      } else {
        const reportingDoctorName = this.RadFileUploadValidator.get('DisplayReportingDoctor').value;
        const reportingDoctorId = this.RadFileUploadValidator.get('DisplayReportingDoctorId').value;
        if (!reportingDoctorId || !reportingDoctorName) {
          this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, ['Reporting Doctor is required.']);
          return false;
        }
      }
    }
    return true;
  }

  Update() {
    Object.keys(this.RadFileUploadValidator.controls).forEach(field => {
      const control = this.RadFileUploadValidator.get(field);
      if (control) {
        control.markAsTouched();
      }
    });
    const isReportingDoctorValid = this.ReportingDoctorValidator();
    if (!isReportingDoctorValid) {
      return;
    } if (this.RadFileUploadValidator.valid) {
      this.imagingBLService.UpdateRadiologyFile(this.patientImagingDetail, this.RadFileUploadValidator.value)
        .subscribe({
          next: (res) => {
            if (res.Status === "OK") {
              this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Success, ['File Updated successfully']);
              this.callBackClose.emit();

            } else {
              this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, ['Failed to Updated file']);
            }
          },
          error: (err) => {
            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, err.ErrorMessage);
          }
        });
    } else {
      console.warn('Form is invalid.');
    }

  }
  SaveAndSubmit() {
    this.patientImagingDetail[0].OrderStatus = 'final';
    if (this.isAddFile) {
      this.Save();
    } else {
      this.Update();
    }
  }
  Save() {
    Object.keys(this.RadFileUploadValidator.controls).forEach(field => {
      const control = this.RadFileUploadValidator.get(field);
      if (control) {
        control.markAsTouched();
      }
    });
    const isReportingDoctorValid = this.ReportingDoctorValidator();
    if (!isReportingDoctorValid) {
      return;
    } if (this.RadFileUploadValidator.valid) {
      this.imagingBLService.UploadRadiologyFile(this.patientImagingDetail, this.RadFileUploadValidator.value)
        .subscribe({
          next: (res) => {
            if (res.Status === ENUM_DanpheHTTPResponses.OK) {
              this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Success, ['File Uploaded successfully']);
              this.callBackClose.emit();

            } else {
              this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, ['Failed to Upload file']);
            }
          },
          error: (err) => {
            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, err.ErrorMessage);
          }
        });
    } else {
      console.warn('Form is invalid.');
    }

  }

  IsFieldValid(fieldName: string, validator: string): boolean {
    const control = this.RadFileUploadValidator.get(fieldName);
    return control ? control.hasError(validator) && (control.dirty || control.touched) : false;

  }

  PerformerListFormatter(data: any): string {
    let html = data["EmployeeName"];
    // let html = data["EmployeeName"] + ' [ ' + data['EmployeeId']
    return html;
  }

  updateFileName(input) {
    var fileName = input.files[0].name;
    document.getElementById('fileName').textContent = fileName;
  }


  public DocumentPreview(selectedDocument: any) {
    const indx = selectedDocument.file.BinaryData.indexOf(',');
    const binaryString = window.atob(selectedDocument.file.BinaryData.substring(indx + 1));
    const bytes = new Uint8Array(binaryString.length);
    const arrayBuffer = bytes.map((byte, i) => binaryString.charCodeAt(i));
    const blob = new Blob([arrayBuffer], { type: "application/pdf" });
    this.fileSrc = this._sanitizer.bypassSecurityTrustResourceUrl(URL.createObjectURL(blob));
    this.ShowFilePreviewPopUp = true;

  }
  CloseFilePreviewPopUp(): void {
    this.ShowFilePreviewPopUp = false;
  }
  GetRadiologyFlowParameter() {
    let param = this.coreService.Parameters.find(a => a.ParameterGroupName === 'Radiology' && a.ParameterName === 'RadiologyFlowConfig');
    if (param) {
      let obj = JSON.parse(param.ParameterValue);
      this.IsPerformerMandatory = obj.IsPerformerMandatory;
    }
  }
}



