import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { BillingBLService } from '../../billing/shared/billing.bl.service';
import { CoreService } from '../../core/shared/core.service';
import { Patient } from '../../patients/shared/patient.model';
import { MessageboxService } from '../../shared/messagebox/messagebox.service';
import { ENUM_MessageBox_Status } from '../../shared/shared-enums';
import { FileUpload_DTO } from '../shared/DTOs/file-upload.dto';
import { ImagingItemReport } from '../shared/imaging-item-report.model';
import { ImagingBLService } from '../shared/imaging.bl.service';


@Component({
  selector: "radadd-report",
  templateUrl: "./rad-add-report.component.html",
  styleUrls: ["./rad-add-report.component.css"],
  host: { '(window:keydown)': 'hotkeys($event)' }

})

export class Rad_AddReportComponent implements OnInit {
  FromDate: string = '';
  ToDate: string = '';
  selImgType: number;
  allValidImgTypeList: Array<number> = new Array<number>();
  PatientObj: any = '';
  selectedPatientImagingDetail: FileUpload_DTO[] = [];
  PatientSearchMinCharacterCount: number = 0;
  patientId: number = 0;
  imagingReports: Array<ImagingItemReport> = new Array<ImagingItemReport>();
  tempImagingReportsFiltered: Array<ImagingItemReport> = new Array<ImagingItemReport>();
  ImagingReportDetails: FileUpload_DTO[] = [];
  tableData: Array<any> = new Array<any>();
  patientList: Patient[] = [];
  ShowBulkFileUploadButton: boolean = false;
  ShowFileUploadPopup: boolean = false;
  selectedIndex: number;
  allKeys: Array<string>;
  IsAddFile: boolean = false;
  showreport: boolean = false;
  selIndex: number;
  selectedReport: ImagingItemReport = new ImagingItemReport();
  patientDetails: Patient;
  showUploadFile = {
    "upload_files": false,
    "remove": false,
  };
  public enableDoctorUpdateFromSignatory: boolean = false;

  public requisitionId: number = null;

  public showImagingReport: boolean = false;
  public newPerformer = { EmployeeId: null, EmployeeName: null };
  public doctorList: any;
  reqFromDate: string = null;
  reqToDate: string = null;
  subscription = new Subscription();
  ShowAddEditReportButton: boolean = false;
  ShowAddEditFileButton: boolean = false;
  selectedReports: ImagingItemReport[] = [];
  tempSelectedReports: ImagingItemReport[] = [];
  PatientIds: number[] = [];
  IsBulkAction: boolean = false;
  ShowBulkAddReportButton: boolean = false;
  BulkFileUploadButton: boolean = false;
  constructor(
    private _changeDetector: ChangeDetectorRef,
    public imagingBLService: ImagingBLService,
    public msgBoxServ: MessageboxService, private billingBlService: BillingBLService,
    private coreService: CoreService,) {
    this.GetParameters();

  }
  ngOnInit() {
    this.GetDoctorList();
  }
  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
  GetParameters() {
    this.GetPatientSearchMinCharacterCountParameter();
    this.enableDoctorUpdateFromSignatory = this.coreService.UpdateAssignedToDoctorFromAddReportSignatory();
    this.GetRadiologyFlowParameter()

  }
  GetRadiologyFlowParameter() {
    let param = this.coreService.Parameters.find(a => a.ParameterGroupName === 'Radiology' && a.ParameterName === 'RadiologyFlowConfig');
    if (param) {
      let obj = JSON.parse(param.ParameterValue);
      this.ShowAddEditReportButton = obj.AllowAddReport;
      this.ShowAddEditFileButton = obj.AllowFileUpload;
    }
  }

  OnFromToDateChange($event) {
    this.FromDate = $event.fromDate;
    this.ToDate = $event.toDate;
  }
  ImagingTypeDropdownOnChange($event) {
    this.selImgType = $event.selectedType;
    this.allValidImgTypeList = $event.typeList;
    this.GetPendingReportsAndRequisitionList(this.FromDate, this.ToDate);
  }
  PatientListFormatter(data: any): string {
    let html: string = "";
    html = "<font size=03>" + "[" + data["PatientCode"] + "]" + "</font>&nbsp;-&nbsp;&nbsp;<font color='blue'; size=03 ><b>" + data["ShortName"] +
      "</b></font>&nbsp;&nbsp;" + "(" + data["Age"] + '/' + data["Gender"] + ")" + "(" + data["PhoneNumber"] + ")" + '' + "</b></font>";
    return html;
  }

  PatientInfoChanged() {
    if (this.PatientObj && typeof (this.PatientObj) === "object") {
      this.patientId = this.PatientObj.PatientId;
      this._changeDetector.detectChanges();
      // this.selectedPatientImagingDetail.push(this.PatientObj);
    } else {
      this.PatientObj = '';
      this.selectedPatientImagingDetail = [];
    }

  }
  LoadDetails() {
    if (this.PatientObj) {
      // this.selectedPatientImagingDetail.push(this.PatientObj);
      if (this.PatientObj) {
        this.tableData = this.tempImagingReportsFiltered.filter(item =>
          item.Patient.PatientId === this.PatientObj.PatientId
        );
      }
      else {
        this.GetReportList();
      }
    } else {
      this.GetPendingReportsAndRequisitionList(this.FromDate, this.ToDate);
    }
  }
  GetReportList() {
    this.tableData = this.tempImagingReportsFiltered;
    this.ReformatPatientReportDetails(this.tableData);
  }
  ReformatPatientReportDetails(data) {
    data.forEach((item, index) => {
      if (index < this.tableData.length) {
        this.tableData[index].CreatedOn = item.CreatedOn;
        this.tableData[index].ScannedOn = item.ScannedOn;
        this.tableData[index].HospitalNo = item.Patient.PatientCode;
        this.tableData[index].PatientName = item.Patient.ShortName;
        this.tableData[index].Age = item.Patient.Age;
        this.tableData[index].Gender = item.Patient.Gender;
        this.tableData[index].PrescriberName = item.PrescriberName;
        this.tableData[index].ReportingDoctorId = item.ReportingDoctorId;
        this.tableData[index].ImagingTypeName = item.ImagingTypeName;
        this.tableData[index].ImagingItemName = item.ImagingItemName;
      }
    })
  }
  /**
   * @summary Get parameter details
   */
  GetPatientSearchMinCharacterCountParameter(): void {
    let param = this.coreService.Parameters.find(a => a.ParameterGroupName === 'Common' && a.ParameterName === 'PatientSearchMinCharacterCount');
    if (param) {
      let obj = JSON.parse(param.ParameterValue);
      this.PatientSearchMinCharacterCount = parseInt(obj.MinCharacterCount);
    }
  }
  GetPatientFileUploadButtonParameter(): void {
    let param = this.coreService.Parameters.find(a => a.ParameterGroupName === 'Radiology' && a.ParameterName === 'DisplayFileUploadButtonInRadiologyAddReport');
    if (param) {
      let obj = JSON.parse(param.ParameterValue);
      this.BulkFileUploadButton = obj;
    }
  }
  /**
   *
   * @param FromDate
   * @param ToDate
   * @param allValidImgTypeList
   * @returns List of patients request details
   * @summary get patients report list and patient information, Use that patient information and make a separate array to search patient list
   */
  GetPendingReportsAndRequisitionList(FromDate, ToDate): void {
    if ((this.selImgType > 0) || (this.selImgType == -1)) {
      this.imagingBLService.GetPendingReportsandRequisition(FromDate, ToDate, this.allValidImgTypeList)
        .subscribe(res => {
          if (res.Status == "OK") {
            this.imagingReports = res.Results;
            this.tempImagingReportsFiltered = this.imagingReports;
            this.patientList = Array.from(
              this.tempImagingReportsFiltered.map(report => report.Patient).reduce((acc, patient) => {
                acc.set(patient.PatientId, patient);
                return acc;
              }, new Map()).values()
            );
            this.GetReportList();
            console.log(this.patientList);
            this._changeDetector.detectChanges();
            if (this.tempImagingReportsFiltered && this.tempImagingReportsFiltered.length > 0) {
              this.tempImagingReportsFiltered.map(TIR => {
                TIR.Patient.Age = this.coreService.CalculateAge(TIR.Patient.DateOfBirth);
              });
            }
          }
          else
            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, [res.ErrorMessage]);
        });
    }
  }

  BulkAddEditReportPopup() {
    this.IsBulkAction = true;
    this.tempSelectedReports = [];
    const selectedPatientsRecord = this.tableData.filter(row => row.IsSelected);
    if (selectedPatientsRecord.length > 0) {
      this.tempSelectedReports.push(...selectedPatientsRecord);
      this.selectedIndex = null; // No specific index for bulk operation
      this.GetImagingReportContent(this.tempSelectedReports, this.selectedIndex);
    } else {
      alert('Please select any records with the same patient.');
    }
  }

  AddEditReportPopup(selectedReport, selIndex) {
    this.IsBulkAction = false;

    this.tempSelectedReports = [];
    if (selectedReport) {
      this.tempSelectedReports.push(selectedReport);
      this.selectedIndex = selIndex;
    }
    this.GetImagingReportContent(this.tempSelectedReports, selIndex);
  }
  /**
   *
   * @param patient
   * @param index
   */
  createPatientDetail(patient: any): FileUpload_DTO {
    return {
      PatientId: patient.PatientId,
      ImagingReportId: patient.ImagingReportId,
      ImagingItemName: patient.ImagingItemName,
      PatientFileId: patient.PatientFileId,
      ImagingRequisitionId: patient.ImagingRequisitionId,
      PatientCode: patient.Patient.PatientCode,
      OrderStatus: patient.OrderStatus,
      PerformerName: patient.PerformerName,
      PerformerId: patient.PerformerId,
    };
  }

  FileUpload(patient: any, index?: number) {
    if (patient) {
      const patientDetail = this.createPatientDetail(patient);
      this.selectedPatientImagingDetail.push(patientDetail);
      this.ImagingReportDetails.push(patientDetail);
      this.selectedIndex = index;
      this.IsAddFile = true;
      this.ShowFileUploadPopup = true;
    }
  }

  BulkFileUpload() {
    const selectedPatients = this.tableData.filter(row => row.IsSelected);
    if (selectedPatients.length > 0) {
      this.selectedPatientImagingDetail = selectedPatients.map(this.createPatientDetail);
      selectedPatients.forEach(patient => {
        this.ImagingReportDetails.push(this.createPatientDetail(patient));
      });
      this.IsAddFile = true;
      this.ShowFileUploadPopup = true;
    } else {
      alert('Please select at least two records with the same Patient for bulk upload.');
      this.ShowFileUploadPopup = false;
    }
  }

  ManageFileUpload(patient: any, index: number) {
    if (patient) {
      const patientDetail = this.createPatientDetail(patient);
      this.selectedPatientImagingDetail.push(patientDetail);
      this.ImagingReportDetails.push(patientDetail);
      this.selectedIndex = index;
      this.IsAddFile = false;
      this.ShowFileUploadPopup = true;
    }
  }


  CloseUpload() {
    this.PatientObj = '';
    this.ShowFileUploadPopup = false;
    this.ImagingReportDetails = [];
    this.selectedPatientImagingDetail = [];
    this.tableData.forEach(row => row.IsSelected = false);
    this.PatientIds = [];
    this.ShowBulkAddReportButton = false;
    this.ShowBulkFileUploadButton = false;
    this.GetPendingReportsAndRequisitionList(this.FromDate, this.ToDate);

  }
  CallBackForClose(event) {
    this.CloseUpload();
    if (event && event.close) {
      this.allKeys.forEach(k => this.showUploadFile[k] = false);

    }
  }
  /**
   *
   * @param index
   */
  onCheckboxChange(index: number) {
    this.GetPatientFileUploadButtonParameter();
    const selectedPatient = this.tableData[index];
    const newPatientVisitId = selectedPatient.PatientVisitId; // Change to PatientVisitId

    if (selectedPatient.IsSelected) {
      let hasConflict = false;

      // Check for conflicts: if different PatientVisitId is selected
      this.tableData.forEach((patient, i) => {
        if (i !== index && patient.IsSelected && patient.PatientVisitId !== newPatientVisitId) { // Compare PatientVisitId
          if (this.PatientIds.includes(patient.PatientVisitId)) { // Check PatientVisitId conflict
            hasConflict = true;
          }
        }
      });

      if (hasConflict) {
        this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, ['Please select checkboxes with the same Patient Visit']);
        setTimeout(() => {
          this.tableData[index].IsSelected = false;
        });
      } else {
        this.PatientIds = [...this.PatientIds, newPatientVisitId]; // Add PatientVisitId
      }
    } else {
      const visitIndex = this.PatientIds.indexOf(newPatientVisitId);
      if (visitIndex > -1) {
        this.PatientIds.splice(visitIndex, 1); // Remove PatientVisitId
      }
    }

    const hasSelectedPatients = this.PatientIds.length > 0;
    if (this.ShowBulkFileUploadButton !== hasSelectedPatients) {
      this.ShowBulkFileUploadButton = hasSelectedPatients;
    }
    if (this.ShowBulkAddReportButton !== hasSelectedPatients) {
      this.ShowBulkAddReportButton = hasSelectedPatients;
    }
  }


  /**
   *
   * @param data
   * @param selIndex
   */

  // GetImagingReportContent(data: any[], selIndex) {
  //   let arrlength = data.length - 1;
  //   data.forEach((selReport, index) => {
  //     let isRequisitionReport = false; // flag for checking if the report is from requisition or from the report table

  //     isRequisitionReport = (selReport.ImagingReportId > 0) ? false : true;
  //     let id = (isRequisitionReport) ? selReport.ImagingItemId : selReport.ImagingReportId;

  //     function hasReportProperty(selReport: any): selReport is { report: { ImagingReportId: number; ImagingRequisitionId: number } } {
  //       return selReport && selReport.report !== undefined;
  //     }

  //     // if (hasReportProperty(selReport)) {
  //     //   id = (isRequisitionReport)
  //     //     ? selReport.report.ImagingRequisitionId
  //     //     : selReport.report.ImagingReportId;
  //     // }
  //     this.imagingBLService.GetImagingReportContent(isRequisitionReport, id)
  //       .subscribe(res => {
  //         if (res.Status == "OK") {
  //           if (res.Results) {
  //             if (!isRequisitionReport) {
  //               selReport.ScannedOn = res.Results.ScannedOn;
  //             }
  //             selReport.ImageFullPath = res.Results.ImageFullPath;
  //             selReport.ImageName = res.Results.ImageName;
  //             selReport.ReportText = res.Results.ReportText;
  //             selReport.ReportTemplateId = res.Results.ReportTemplateId;
  //             selReport.TemplateName = res.Results.TemplateName;
  //             selReport.FooterTextsList = res.Results.footerNotesList;
  //           }
  //           this.ShowAddReport(selReport, index, arrlength);
  //         } else {
  //           this.msgBoxServ.showMessage("failed", [res.ErrorMessage]);
  //         }
  //       });
  //   });
  // }
  // /**
  //  *
  //  * @param selReport
  //  * @param selIndex
  //  * @param arrlength
  //  */
  // ShowAddReport(selReport, selIndex, arrlength: number): void {
  //   this.selIndex = selIndex;
  //   this.showreport = false;
  //   selReport.ReportingDoctorId = selReport.PrescriberId != 0 ? selReport.PrescriberId : null;
  //   this.selectedReport = new ImagingItemReport();
  //   if (!this.IsBulkAction) {
  //     this.selectedReports = [];
  //   }
  //   this.selectedReports.push(selReport);
  //   this.patientDetails = selReport.Patient;
  //   this._changeDetector.detectChanges();
  //   if (arrlength == selIndex) {
  //     this.showreport = true;
  //   }
  // }
  GetImagingReportContent(data: any[], selIndex) {
    let arrlength = data.length - 1;
    let completedRequests = 0; // counter to track completed requests

    data.forEach((selReport, index) => {
      let isRequisitionReport = false; // flag for checking if the report is from requisition or from the report table

      isRequisitionReport = (selReport.ImagingReportId > 0) ? false : true;
      let id = (isRequisitionReport) ? selReport.ImagingItemId : selReport.ImagingReportId;

      function hasReportProperty(selReport: any): selReport is { report: { ImagingReportId: number; ImagingRequisitionId: number } } {
        return selReport && selReport.report !== undefined;
      }

      // Asynchronous API call
      this.imagingBLService.GetImagingReportContent(isRequisitionReport, id)
        .subscribe(res => {
          if (res.Status == "OK") {
            if (res.Results) {
              if (!isRequisitionReport) {
                selReport.ScannedOn = res.Results.ScannedOn;
              }
              selReport.ImageFullPath = res.Results.ImageFullPath;
              selReport.ImageName = res.Results.ImageName;
              selReport.ReportText = res.Results.ReportText;
              selReport.ReportTemplateId = res.Results.ReportTemplateId;
              selReport.TemplateName = res.Results.TemplateName;
              selReport.FooterTextsList = res.Results.footerNotesList;
            }
            // Call ShowAddReport and pass the index
            this.ShowAddReport(selReport, index, arrlength);
          } else {
            this.msgBoxServ.showMessage("failed", [res.ErrorMessage]);
          }

          // Increment completed requests counter
          completedRequests++;

          // If all requests are completed, show the report
          if (completedRequests === data.length) {
            this.showreport = true;
          }
        });
    });
  }

  /**
   * Shows the selected report and pushes it into the selectedReports array.
   * @param selReport The selected report object
   * @param selIndex The index of the current report in the array
   * @param arrlength The total length of the array
   */
  ShowAddReport(selReport, selIndex, arrlength: number): void {
    this.selIndex = selIndex;
    this.showreport = false;
    selReport.ReportingDoctorId = selReport.PrescriberId != 0 ? selReport.PrescriberId : null;
    this.selectedReport = new ImagingItemReport();
    if (!this.IsBulkAction) {
      this.selectedReports = [];
    }
    this.selectedReports.push(selReport);
    this.patientDetails = selReport.Patient;
    this._changeDetector.detectChanges();
  }

  GetBackOnClose($event) {
    if ($event.Submit) {
      this.GetPendingReportsAndRequisitionList(this.reqFromDate, this.reqToDate);
    }
  }
  GetDoctorList(): void {
    this.newPerformer = null;
    this.billingBlService.GetProviderList()
      .subscribe(res => this.CallBackGenerateDoctor(res));
  }
  /**
   *
   * @param res
   */
  CallBackGenerateDoctor(res) {
    if (res.Status == "OK") {
      this.doctorList = [];
      this.doctorList.push({ EmployeeId: null, EmployeeName: 'No Doctor' });
      //format return list into Key:Value form, since it searches also by the property name of json.
      if (res && res.Results) {
        res.Results.forEach(a => {
          this.doctorList.push(a);
        });
      }
    }
    else {
      this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, ["Not able to get Doctor list"]);
      console.log(res.ErrorMessage)
    }
  }
  SanitizeFooterText(selReport: ImagingItemReport[]) {
    selReport.map(report => {
      if (report.FooterTextsList && report.FooterTextsList.length > 0) {
        // Filter the FooterTextsList to keep only the checked footer
        const checkedFooter = report.FooterTextsList.find(footer => footer.IsChecked === true);

        // If a checked footer is found, set the FooterTextsList to contain only this footer
        if (checkedFooter) {
          report.FooterTextsList = [checkedFooter];
          report.SelectedFooterTemplateId = checkedFooter.SelectedFooterTemplateId;
        } else {
          // If no footer is checked, clear the FooterTextsList
          report.FooterTextsList = [];
          report.SelectedFooterTemplateId = null;
        }
      }
      return report;
    });
  }
  /**
   *
   * @param $event
   */
  AddReport($event): void {
    try {
      let filesToUpload = $event.reportFiles;
      let selReport: ImagingItemReport[] = $event.report;
      let isUpdate: boolean = selReport.some(report =>
        report.ImagingReportId !== undefined &&
        report.ImagingReportId !== 0
      );
      this.SanitizeFooterText(selReport);
      let orderStatus: string = $event.orderStatus;
      if (filesToUpload.length || selReport) {
        this.imagingBLService.AddImgItemReport(filesToUpload, selReport, orderStatus, this.enableDoctorUpdateFromSignatory)
          .subscribe(res => {
            if (res.Status == "OK") {
              this.showreport = false;
              this.selectedReports = [];
              this.ShowBulkAddReportButton = false;
              this.ShowBulkFileUploadButton = false;

              if (Array.isArray(res.Results)) {
                res.Results.forEach(result => {
                  if (result.OrderStatus === "final") {
                    this.showreport = false;
                    this.ViewReport(result.ImagingRequisitionId);
                  }
                });
              } else if (typeof res.Results === 'object' && res.Results !== null) {
                if (res.Results.OrderStatus === "final") {
                  this.showreport = false;
                  this.ViewReport(res.Results.ImagingRequisitionId);
                }
              }
              if (isUpdate)
                this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Success, ["Report Updated Successfully"]);
              else
                this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Success, ["Report Added Successfully"]);
            }
            else
              this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, [res.ErrorMessage]);
          });
      }
    } catch (exception) {
      this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, ['check console log for detail error..!']);
      console.log(exception);
    }
    this.GetPendingReportsAndRequisitionList(this.FromDate, this.ToDate);

  }
  ViewReport(requisitionId: number): void {
    this.showImagingReport = false;
    this.requisitionId = null;
    this._changeDetector.detectChanges();
    this.requisitionId = requisitionId;
    this.showImagingReport = true;
  }
  CloseAddReport($event) {
    if ($event) {
      this.selectedReports = [];
      this.PatientIds = [];
      this.ShowBulkAddReportButton = false;
      this.ShowBulkFileUploadButton = false;
      this.tableData.forEach(row => row.IsSelected = false);

    }
  }
  hotKeys(event) {
    if (event.keyCode === 27) {
      this.CloseAddReport(event);
    }
  }
}

