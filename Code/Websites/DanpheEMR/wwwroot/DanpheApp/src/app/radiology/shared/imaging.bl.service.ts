import { Injectable } from '@angular/core';
import { BillItemRequisition } from '../../billing/shared/bill-item-requisition.model';
import { BillingDLService } from '../../billing/shared/billing.dl.service';
import { SecurityService } from '../../security/shared/security.service';
import { ImagingItemReport } from '../shared/imaging-item-report.model';
import { ImagingItemRequisition } from './imaging-item-requisition.model';
import { ImagingDLService } from './imaging.dl.service';


import * as _ from 'lodash';
import * as moment from 'moment/moment';
import { BillingTransactionItem } from '../../billing/shared/billing-transaction-item.model';
import { InPatientLabTest } from '../../labs/shared/InpatientLabTest';
import { CommonEmailModel } from '../../shared/DTOs/common-email_DTO';
import { FileUpload_DTO } from './DTOs/file-upload.dto';
//Note: mapping is done here by blservice, component will only do the .subscribe().
@Injectable()
export class ImagingBLService {
  constructor(public imagingDLService: ImagingDLService,
    public billingDLService: BillingDLService,
    public securityService: SecurityService) {
  }


  public GetFilmTypeData() {
    return this.imagingDLService.GetFilmTypeData()
      .map((responseData) => {
        return responseData;
      });
  }

  //this returns a promise, the calling component can subscribe and do the needful
  //get the items by type
  //imaging-requisition.component
  public GetItemsByType(typeId: number) {
    return this.imagingDLService.GetItemsByType(typeId)
      .map((responseData) => {
        return responseData;
      });
  }
  //imaging-requisition.component
  //gets selected patient's requisitions despite of the status.
  //Method below is commented as it is not in use.
  // public GetPatientImagingRequisitions(patientId: number, orderStatus: string) {
  //   return this.imagingDLService.GetPatientImagingRequisitions(patientId, orderStatus)
  //     .map(res => { return res });

  // }
  //imaging-requisition.component
  //gets types of imaging in radiology
  public GetImagingTypes() {
    return this.imagingDLService.GetImagingTypes().map(res => { return res });
  }
  //imaging-report.component
  //gets all the active requisitions and pending reports
  public GetImagingReqsAndReportsByStatus(fromDate: string, toDate: string, typeList: Array<number>) {
    var reqOrderStatus = "active";
    var reportOrderStatus = "active";
    let typeListStr = JSON.stringify(typeList);
    return this.imagingDLService.GetImagingReqsAndReportsByStatus(reqOrderStatus, reportOrderStatus, typeListStr, fromDate, toDate)
      .map(res => { return res });
  }
  //get pending reports and requisition for Add report page 
  public GetPendingReportsandRequisition(fromDate: string, toDate: string, typeList: Array<number>) {
    var reqOrderStatus = "pending";
    var reportOrderStatus = "pending";
    let typeListStr = JSON.stringify(typeList);
    return this.imagingDLService.GetPendingReportsandRequisition(reqOrderStatus, reportOrderStatus, typeListStr, fromDate, toDate)
      .map(res => { return res });
  }



  //imaging-result.component
  //gets reports of selected patient
  //Method below is commented as it is not in use.
  // public GetPatientReports(patientId) {
  //   var reportOrderStatus = "final";
  //   return this.imagingDLService.GetPatientReports(patientId, reportOrderStatus)
  //     .map(res => { return res });
  // }

  //gets dicom Image list
  public GetDicomImageList(PatientStudyId) {
    return this.imagingDLService.GetDicomImageList(PatientStudyId)
      .map(res => { return res });
  }
  //imaging-result.component
  //gets reports of selected patient
  public GetAllImagingReports(frmDate, toDate, typeList: Array<number>) {
    var reportOrderStatus: string = "final";
    let typeStr = JSON.stringify(typeList);
    return this.imagingDLService.GetAllImagingReports(reportOrderStatus, frmDate, toDate, typeStr)
      .map(res => { return res });
  }
  public GetImagingReportByRequisitionId(requisitionId: number) {
    return this.imagingDLService.GetImagingReportByRequisitionId(requisitionId)
      .map(res => { return res });
  }

  public GetDoctorsList() {
    return this.billingDLService.GetDoctorsList()
      .map(res => res);
  }

  //gets all the imaging types
  // Method below is commented as it has no references
  // public GetImagingType() {
  //   return this.imagingDLService.GetImagingType()
  //     .map(res => { return res });
  // }
  public GetEmpPreference(employeeId) {

    return this.imagingDLService.GetEmpPreference(employeeId)
      .map(res => { return res })
  }
  //public GetReportingDoctor(imagingTypeId) {

  //    return this.imagingDLService.GetReportingDoctor(imagingTypeId)
  //        .map(res => { return res })
  //}
  //get ReportText, imageNames, imageFolderpath by Id from imgRequisition or imgReport table
  public GetImagingReportContent(isRequisitionReport, id) {
    try {
      return this.imagingDLService.GetImagingReportContent(isRequisitionReport, id)
        .map(res => { return res });
    } catch (exception) {
      throw exception;
    }
  }
  public GetAllReportTemplates() {
    return this.imagingDLService.GetAllReportTemplates()
      .map(res => { return res })
  }
  public GetDoctorList() {
    return this.imagingDLService.GetDoctorList()
      .map(res => { return res })
  };
  //Get scanned imaging files list for add to report
  //get data from pac server
  GetImgFileList(fromDate: string, toDate: string) {
    try {
      return this.imagingDLService.GetImgFileList(fromDate, toDate)
        .map(res => { return res });
    } catch (exception) {
      throw exception;
    }
  }
  //get report text by Imaging report id from report table
  //Method below is commented as it is not in use.
  // GetReportTextByImagingReportId(ImagingReportId) {
  //   try {
  //     return this.imagingDLService.GetReportTextByImagingReportId(ImagingReportId)
  //       .map(res => { return res });
  //   } catch (exception) {
  //     throw exception;
  //   }
  // }
  //Get dicom viewer url and open dicom viewer
  //Method below is commented as it is not in use.
  // GetDICOMViewerByImgRptId(ImagingReportId, PatientStudyId) {
  //   try {
  //     return this.imagingDLService.GetDICOMViewerByImgRptId(ImagingReportId, PatientStudyId)
  //       .map(res => { return res });
  //   } catch (exception) {
  //     throw exception;
  //   }
  // }
  //imaging-requisition.component 
  //post requisition items
  public PostRequestItems(reqItemList: Array<ImagingItemRequisition>) {
    return this.imagingDLService.PostRequestItems(reqItemList)
      .map((responseData) => {
        return responseData;
      });
  }

  //imaging-report.component 
  //posts the report of an item
  public PostItemReport(itemReport: ImagingItemReport) {
    return this.imagingDLService.PostItemReport(itemReport)
      .map(res => { return res });
  }

  //imaging-requisition.component
  //Posts to BillingRequisitionTable after posting to imagingRequisitionTable
  public PostToBilling(reqItemList: Array<ImagingItemRequisition>) {
    let currentUser: number = 1;//logged in doctor
    let billItems: Array<BillItemRequisition> = new Array<BillItemRequisition>();

    reqItemList.forEach(img => {
      billItems.push({
        BillItemRequisitionId: 0,
        ItemId: img.ImagingItemId,
        RequisitionId: img.ImagingRequisitionId,
        ItemName: img.ImagingItemName,
        ProcedureCode: img.ProcedureCode,
        //RequestedBy: currentUser,
        ServiceDepartmentId: 0,
        PatientId: img.PatientId,
        PatientVisitId: img.PatientVisitId,
        ServiceDepartment: img.ImagingTypeName,
        DepartmentName: "Radiology",
        Quantity: 1,
        PerformerId: img.PrescriberId,
        CreatedBy: this.securityService.GetLoggedInUser().EmployeeId,
        CreatedOn: moment().format('YYYY-MM-DD'),
        Price: 0,//check for proper price and change it later.
        AssignedTo: img.PrescriberId//need to change this later on.. sud: 20may
      });
    });
    return this.billingDLService.PostBillingItemRequisition(billItems)
      .map(res => res)
  }
  //imaging-report.component
  //post report 
  public AddImgItemReport(filesToUpload, imgReports: ImagingItemReport[], orderStatus: string, enableProviderUpdate: boolean) {
    let input = new FormData();
    let localFolder: string;
    let fileNames: string[] = [];
    let processedReports = imgReports.map((report, index) => {
      localFolder = "Radiology\\" + report.ImagingTypeName;
      report.ImageName = ""; // Make it empty since we're replacing the existing images every time.
      let uploadedImgCount = 0;

      if (report.ImageName) {
        uploadedImgCount = report.ImageName.split(";").length;
      }

      if (filesToUpload && filesToUpload[index]) {
        for (let i = 0; i < filesToUpload[index].length; i++) {
          let splitImagetype = filesToUpload[index][i].type.split("/");
          let imageExtension = splitImagetype[1];
          // FileName = PatientId_ImagingItemName_PatientVisitId_CurrentDateTime_Counter.imageExtension
          let fileName = report.PatientId + "_" + report.ImagingItemId + "_" + report.PatientVisitId + "_" + moment().format('YYYY-MM-DD_HHmm') + "_" + (i + uploadedImgCount) + "." + imageExtension;
          fileNames.push(fileName); // Store filenames
          input.append("uploads", filesToUpload[index][i], fileName);
        }
      }

      // Omit Patient and return the processed report
      return _.omit(report, ['Patient']);
    });

    let reportDetails = JSON.stringify(processedReports);
    input.append("reportDetails", reportDetails);
    input.append("localFolder", localFolder);
    input.append("orderStatus", orderStatus);
    input.append("enableProviderEditInBillTxnItem", enableProviderUpdate ? "true" : "false");

    // If any of the reports have an ImagingReportId, assume it's an update
    if (imgReports.some(report => !!report.ImagingReportId)) {
      return this.imagingDLService.PutImgItemReport(input)
        .map(res => res);
    } else {
      return this.imagingDLService.PostImgItemReport(input)
        .map(res => res);
    }

  }


  //   public AddImgItemReport(filesToUpload, imgReports: ImagingItemReport[], orderStatus: string, enableProviderUpdate: boolean) {
  //     const observables = imgReports.map(rep => {
  //         let input = new FormData();
  //         let localFolder: string = "Radiology\\" + rep.ImagingTypeName;
  //         let fileName: string;
  //         rep.ImageName = ""; // Make it empty since we're replacing the existing images every time.
  //         let omitted = _.omit(rep, ['Patient']);
  //         let reportDetails = JSON.stringify(omitted);
  //         let uploadedImgCount = 0;

  //         if (rep.ImageName) {
  //             uploadedImgCount = rep.ImageName.split(";").length;
  //         }

  //         if (filesToUpload) {
  //             for (let i = 0; i < filesToUpload.length; i++) {
  //                 let splitImagetype = filesToUpload[i].type.split("/");
  //                 let imageExtension = splitImagetype[1];
  //                 fileName = `${rep.PatientId}_${rep.ImagingItemId}_${rep.PatientVisitId}_${moment().format('YYYY-MM-DD_HHmm')}_${i + uploadedImgCount}.${imageExtension}`;
  //                 input.append("uploads", filesToUpload[i], fileName);
  //             }
  //         }

  //         input.append("enableProviderEditInBillTxnItem", enableProviderUpdate ? "true" : "false");
  //         input.append("reportDetails", reportDetails);
  //         input.append("localFolder", localFolder);
  //         input.append("orderStatus", orderStatus);

  //         if (rep.ImagingReportId) {
  //             return this.imagingDLService.PutImgItemReport(input);
  //         } else {
  //             return this.imagingDLService.PostImgItemReport(input);
  //         }
  //     });

  //     return forkJoin(observables);
  // }


  public sendEmail(email: CommonEmailModel) {
    let data: CommonEmailModel = new CommonEmailModel();
    data = Object.assign(data, email);
    var omited = _.omit(data, ['EmailValidator']);
    return this.imagingDLService.SendEmail(omited)
      .map(res => res);
  }



  //attach Imaging files with report
  AddImagingPatientStudyToReport(reportData: ImagingItemReport) {
    try {
      reportData.Patient = null;
      if (reportData.ImagingReportId)
        return this.imagingDLService.PutPatientStudy(reportData)
          .map(res => res);
      //else post the item
      else
        return this.imagingDLService.PostPatientStudy(reportData)
          .map(res => res);
    } catch (exception) {
      throw exception;
    }
  }
  //delete imaging report selected images by ImagingReportId
  DeleteImgsByImgingRptId(reportModelData) {
    try {
      return this.imagingDLService.DeleteImgsByImagingRptId(reportModelData)
        .map(res => res);
    } catch (exception) {
      throw exception;
    }
  }



  //start: sud-5Feb'18--For Ward Billing--



  //To Update Tables to cancel the LabTest Request for Inpatient
  CancelInpatientCurrentLabTest(currentInpatientLabTest: InPatientLabTest) {
    let data = JSON.stringify(currentInpatientLabTest);
    return this.imagingDLService.CancelInpatientCurrentLabTest(data)
      .map(res => { return res });
  }

  public CancelRadRequest(item: BillingTransactionItem) {
    var temp = _.omit(item, ['ItemList', 'BillingTransactionItemValidator', 'Patient']);
    let data = JSON.stringify(temp);
    return this.imagingDLService.CancelRadRequest(data)
      .map((responseData) => {
        return responseData;
      });
  }
  public CancelBillRequest(item: BillingTransactionItem) {
    var temp = _.omit(item, ['ItemList', 'BillingTransactionItemValidator', 'Patient']);
    let data = JSON.stringify(temp);
    return this.imagingDLService.CancelBillRequest(data)
      .map((responseData) => {
        return responseData;
      });
  }

  //start: sud:5Feb'19--for radiology ward billing
  public GetRadiologyBillingItems() {
    return this.imagingDLService.GetRadiologyBillingItems()
      .map(res => res);
  }
  //end: sud:5Feb'19--for radiology ward billing

  //end: sud-5Feb'18--For Ward Billing--

  //Update ReferredBy Doctor
  PutDoctor(prescriberId: number, prescriberName: string, reqId: number) {
    return this.imagingDLService.PutDoctor(prescriberId, prescriberName, reqId)
      .map(res => { return res });
  }

  PutScannedDetails(reqId) {
    return this.imagingDLService.PutScannedDetails(reqId)
      .map(res => { return res });
  }
  GetPrintCount(requisitionId: number) {
    return this.imagingDLService.GetPrintCount(requisitionId)
      .map(res => { return res });
  }
  UpdateReferrer(referredById: number, referredByName: string, reqId: number) {
    return this.imagingDLService.UpdateReferrer(referredById, referredByName, reqId)
      .map(res => { return res });
  }
  // UploadRadiologyFile(patientDetail: Patient, fileToUpload: PatientFilesModel) {
  //   try {
  //     const fileDetails: FileUpload_DTO = {
  //       PatientDetails: patientDetail,
  //       FileDetails: fileToUpload
  //     };
  //     return this.imagingDLService.UploadRadiologyFile(fileDetails).map((res) => {
  //       return res;
  //     });
  //   }
  //   catch (exception) {
  //     throw exception;
  //   }
  // }
  UploadRadiologyFile(patientDetail: FileUpload_DTO[], fileToUpload: any) {
    try {
      const formToPost = new FormData();

      formToPost.append("patientReportDetail", JSON.stringify(patientDetail));
      formToPost.append("fileToUpload", JSON.stringify(fileToUpload));
      if (fileToUpload.File) {
        formToPost.append("file", fileToUpload.File);
      }
      console.log(formToPost)
      return this.imagingDLService.UploadRadiologyFile(formToPost).map((res) => {
        return res;
      });
    }
    catch (exception) {
      throw exception;
    }
  }
  UpdateRadiologyFile(patientDetail: FileUpload_DTO[], fileToUpload: any) {
    try {
      const formToPost = new FormData();

      formToPost.append("patientReportDetail", JSON.stringify(patientDetail));
      formToPost.append("fileToUpload", JSON.stringify(fileToUpload));
      if (fileToUpload.File) {
        formToPost.append("file", fileToUpload.File);
      }
      console.log(formToPost)
      return this.imagingDLService.UpdateRadiologyFile(formToPost).map((res) => {
        return res;
      });
    }
    catch (exception) {
      throw exception;
    }
  }
  GetPatientFileDetail(patientDetail: FileUpload_DTO[]) {
    try {
      return this.imagingDLService.GetPatientFileDetail(patientDetail).map((res) => {
        return res;
      });
    }
    catch (exception) {
      throw exception;
    }
  }

  GetTemplatesStyles() {
    try {
      return this.imagingDLService.GetTemplatesStyles().map((res) => {
        return res;
      });
    }
    catch (exception) {
      throw exception;
    }
  }


}

