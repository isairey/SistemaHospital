import { ChangeDetectorRef, Component } from '@angular/core';
import * as _ from 'lodash';
import * as moment from 'moment';
import { CoreService } from '../../../core/shared/core.service';
import { DanpheHTTPResponse } from '../../../shared/common-models';
import { CommonFunctions } from '../../../shared/common.functions';
import { MessageboxService } from '../../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponseText, ENUM_ExternalLab_SampleStatus, ENUM_MessageBox_Status, LabPageAction } from '../../../shared/shared-enums';
import { ExternalLabStatus_DTO } from '../../shared/DTOs/external-lab-sample-satatus.dto';
import { LabSticker } from '../../shared/lab-sticker.model';
import { LabTest } from '../../shared/lab-test.model';
import { PatLabInfoVM } from '../../shared/labTestListWithVendors.model';
import { LabsBLService } from '../../shared/labs.bl.service';
import { LabVendorsModel } from '../vendors-settings/lab-vendors.model';

@Component({
   templateUrl: './internal-test-list.html',
   styles: [` .tbl-container {position: relative;}
    .btnvendor{position:absolute;top:-50px;right:0px;}
.highlightbg{background: #8cc5dd; color: #fff;}
.table tbody tr td{padding: 5px 8px;}`]
})
export class InternalTestListComponent {

   //private patLabInfo = { PatientName: "Sud", TestName: "CBC", VendorName: "External" };

   public patLabInfoList: Array<PatLabInfoVM> = [];
   PatientLabInfo: LabSticker = new LabSticker();
   public showVendorSelectButton: boolean = false;
   public showVendorSelectPopup: boolean = false;
   public selectedReqList: Array<number> = [];
   public dispatchConfirmationTitle: string = "Confirm !";
   public dispatchConfirmationMessage: string = 'Are you sure want to Dispatch these Samples to ?';
   public receiveConfirmationTitle: string = "Confirm !";
   public receiveConfirmationMessage: string = "Are you sure you want to Receive Report?";
   public searchString: string = null;
   public FromDate: string;
   public ToDate: string;
   public HospitalNo: string = "";
   public PatientName: string = "";
   public SelectedExternalLabStatus: string = ENUM_ExternalLab_SampleStatus.SampleCollected;
   public SelectedVendorId: number = 0;
   public LabTestCSV: Array<number> = [];
   public VendorList: Array<LabVendorsModel> = [];
   public LabTestList: Array<LabTest> = [];
   public PreSelectedLabTest: Array<any> = [];
   public Loading: boolean = false;
   public ShowReceiveButton: boolean = false;
   public Page: number = 1;
   selectAll: boolean = false;
   ExternalLabStatus = Object.values(ENUM_ExternalLab_SampleStatus);
   public SelectedVendorName: any;
   public IsDispatch: boolean = false;
   public IsReceive: boolean = false;
   public ReceivedReport: boolean = true;
   public ShowHeader: boolean = false;
   public ExternalLabDataStatus: ExternalLabStatus_DTO = new ExternalLabStatus_DTO();
   public ExternalLabReportStatusHeader: any;
   public printDate: string = null;
   public verificationRequired: boolean;
   public showStickerButton: boolean = false;
   public showUndoOption: boolean = false;
   public showLabStickerPopUp: boolean = false;
   public showUndoButton: boolean = false;
   public requisitionIdList = [];
   public HasUndoPermission: boolean;
   public undoFromPageAction: LabPageAction = LabPageAction.ExternalLab;

   constructor(public msgBox: MessageboxService, public labBLService: LabsBLService, public changeDetector: ChangeDetectorRef, public coreService: CoreService) {
      this.LoadAllVendors();
      this.GetOutSourceTestList();

      let param = this.coreService.Parameters.find(a => a.ParameterGroupName.toLowerCase() == 'common' && a.ParameterName == 'CustomerHeader');

      if (param) {
         this.ExternalLabReportStatusHeader = JSON.parse(param.ParameterValue);
      }
      this.printDate = moment().toString();
      this.verificationRequired = this.coreService.EnableVerificationStep();
      this.HasUndoPermission = this.labBLService.securityService.HasPermission("btn-lab-undo-receive-sample") ? true : false;
   }

   public GetAllTestListForExternalLabs() {
      this.patLabInfoList = [];
      this.selectAll = false;
      this.ShowReceiveButton = false;
      this.showVendorSelectButton = false;
      this.showStickerButton = false;
      this.showUndoButton = false;
      this.SelectedVendorName = this.VendorList.find(a => a.LabVendorId === this.SelectedVendorId)
      if (this.SelectedExternalLabStatus === ENUM_ExternalLab_SampleStatus.SampleCollected) {
         this.dispatchConfirmationMessage = 'Are you sure want to Dispatch these Samples to ' + this.SelectedVendorName.VendorName + '  ?';
      }
      else if (this.SelectedExternalLabStatus === ENUM_ExternalLab_SampleStatus.SampleDispatched) {
         this.receiveConfirmationMessage = 'Are you sure want to Receive these Samples from ' + this.SelectedVendorName.VendorName + '  ?';
      }
      if (this.LabTestCSV.length > 0) {
         this.Loading = true;
         this.labBLService.GetAllTestsForExternalLabs(this.LabTestCSV, this.FromDate, this.ToDate, this.PatientName, this.HospitalNo, this.SelectedVendorId, this.SelectedExternalLabStatus)
            .finally(() => {
               //this.CheckForRowSelection();
               this.Loading = false;
            })
            .subscribe(res => {
               if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
                  if (res.Results && res.Results.length > 0) {
                     this.patLabInfoList = res.Results;
                     this.ReceivedReport = this.patLabInfoList.every(a => a.ExternalLabSampleStatus === ENUM_ExternalLab_SampleStatus.ReportReceived)
                  }
                  else {
                     this.patLabInfoList = [];
                     this.msgBox.showMessage(ENUM_MessageBox_Status.Notice, [`No record found for supplied filter criteria...`]);
                  }
               } else {
                  this.msgBox.showMessage(ENUM_MessageBox_Status.Error, [`Unable to load Outsource requisition detail. !`]);
               }
            });
      }
      else {
         this.msgBox.showMessage(ENUM_MessageBox_Status.Notice, [`Please select at least on Lab TestName from the list.`]);
      }
   }

   ShowVendorSelection() {

      this.selectedReqList = [];//empty this array before sending the list to popup.

      this.patLabInfoList.forEach(val => {
         if (val.IsSelected) {
            this.selectedReqList.push(val.RequisitionId);
         }
      });

      this.showVendorSelectPopup = true;
   }


   CheckForRowSelection() {
      this.showVendorSelectButton = false;
      this.showStickerButton = false;
      this.showUndoButton = false;
      let isSelected = this.patLabInfoList.some((item) => item.IsSelected === true);

      const patLabInfos = this.patLabInfoList.filter((item) => item.IsSelected === true);
      this.ExternalLabDataStatus.RequisitionIds = [];
      patLabInfos.forEach(itm => {
         this.ExternalLabDataStatus.RequisitionIds.push(itm.RequisitionId);
         this.PatientLabInfo.PatientName = itm.PatientName;
         this.PatientLabInfo.HospitalNumber = itm.HospitalNo;
         this.PatientLabInfo.Age = this.coreService.CalculateAge(itm.DateOfBirth);
         this.PatientLabInfo.AgeSex = this.coreService.FormateAgeSex(this.PatientLabInfo.Age, itm.Gender);
         this.PatientLabInfo.BarCodeNumber = itm.BarCodeNumber;
         this.PatientLabInfo.SampleCodeFormatted = itm.SampleCodeFormatted;
      })
      if (this.ExternalLabDataStatus.RequisitionIds.length === 1) {
         this.showStickerButton = true;
         this.showUndoButton = true;
      }
      else {
         this.showStickerButton = false;
         this.showUndoButton = false;
      }
      if (isSelected) {
         if (this.SelectedExternalLabStatus === ENUM_ExternalLab_SampleStatus.SampleCollected) {
            this.showVendorSelectButton = true;
         }
         else if (this.SelectedExternalLabStatus === ENUM_ExternalLab_SampleStatus.SampleDispatched) {
            this.ShowReceiveButton = true;
         }
         else {
            this.showVendorSelectButton = false;
            this.ShowReceiveButton = false;
            this.IsReceive = false;
         }
      }
      else {
         this.showVendorSelectButton = false;
         this.ShowReceiveButton = false;
         this.showStickerButton = false;
         this.showUndoButton = false;
         this.IsReceive = false;
      }

   }

   OnVendorAssigned($event) {
      console.log($event.RequisitionList);
      this.showVendorSelectPopup = false;
      this.showVendorSelectButton = false;
      this.changeDetector.detectChanges();
      this.GetAllTestListForExternalLabs();
      console.log("Vendors assigned successfully.");
   }

   OnVendorSelectPopupClosed($event) {
      this.showVendorSelectPopup = false;
   }

   SelectUnselectRow(selTest) {
      selTest.IsSelected = !selTest.IsSelected;
      if (selTest.IsSelected) {
         this.showVendorSelectButton = true;
      } else {
         this.CheckForRowSelection();
      }
   }

   public OnDateRangeChange($event) {
      if ($event) {
         this.FromDate = $event.fromDate;
         this.ToDate = $event.toDate;
      }
   }


   LoadAllVendors() {
      this.labBLService.GetLabVendors()
         .subscribe((res: DanpheHTTPResponse) => {
            if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
               if (res.Results && res.Results.length > 0) {
                  this.VendorList = res.Results;
                  this.VendorList = this.VendorList.filter(vendor => vendor.IsExternal === true && vendor.IsActive === true);
                  this.SelectedVendorId = this.VendorList[0].LabVendorId;
               }
            }
            else {
               this.msgBox.showMessage(ENUM_MessageBox_Status.Error, ["Couldn't Load External Vendors."]);
            }
         });
   }

   GetOutSourceTestList() {
      this.labBLService.GetOutsourceApplicableTests()
         .subscribe((res: DanpheHTTPResponse) => {
            if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
               if (res.Results && res.Results.length > 0) {
                  this.LabTestList = res.Results;
                  this.LabTestCSV = [];
                  this.LabTestList.forEach((p) => {
                     let val = _.cloneDeep(p);
                     this.PreSelectedLabTest.push(val);
                     this.LabTestCSV.push(val.LabTestId);
                  });
               }
            }
            else {
               this.msgBox.showMessage(ENUM_MessageBox_Status.Error, ["Unable to load Outsource Test list."]);
            }
         });
   }

   AssignTestList(event) {
      this.LabTestCSV = [];
      if (event) {
         event.forEach(test => {
            this.LabTestCSV.push(test.LabTestId);
         });
      }
   }

   selectAllRows() {
      for (let lab of this.patLabInfoList) {
         lab.IsSelected = this.selectAll;
      }
      this.CheckForRowSelection();
   }

   toggleRowSelection(lab: any) {
      lab.IsSelected = !lab.IsSelected;
      this.checkSelectAllStatus();
      this.CheckForRowSelection();
   }

   checkSelectAllStatus() {
      this.selectAll = this.patLabInfoList.every(lab => lab.IsSelected);
   }
   ConfirmDispatch() {
      this.IsDispatch = false;
      this.ExternalLabDataStatus.SelectedExternalLabStatusType = ENUM_ExternalLab_SampleStatus.SampleDispatched;
      this.labBLService.UpdateExternalLabStatus(this.ExternalLabDataStatus)
         .subscribe(
            (res: DanpheHTTPResponse) => {
               if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
                  this.msgBox.showMessage(ENUM_MessageBox_Status.Success, ['External Lab Sample Is Dispatched to   ' + this.SelectedVendorName.VendorName + ' ']);
                  this.ExternalLabDataStatus.SelectedExternalLabStatusType = ENUM_ExternalLab_SampleStatus.SampleDispatched;
                  this.GetAllTestListForExternalLabs();
                  this.IsDispatch = true;
                  this.showVendorSelectButton = false;
                  this.showStickerButton = false;
                  this.showUndoButton = false;
                  this.ExternalLabDataStatus.RequisitionIds = [];
                  this.ExternalLabDataStatus.SelectedExternalLabStatusType = "";
               }
               else {
                  this.msgBox.showMessage(ENUM_MessageBox_Status.Error, ["Unable to Dispatch External Lab Sample Status."]);
                  this.IsDispatch = true;
               }
            },
            (err: DanpheHTTPResponse) => {
               this.msgBox.showMessage(ENUM_MessageBox_Status.Error, [err.ErrorMessage]);
               this.IsDispatch = true;
            });
   }

   CancelDispatch() {

   }
   ConfirmReceive() {
      this.IsReceive = false;
      this.ExternalLabDataStatus.SelectedExternalLabStatusType = ENUM_ExternalLab_SampleStatus.ReportReceived;
      this.labBLService.UpdateExternalLabStatus(this.ExternalLabDataStatus)
         .subscribe(
            (res: DanpheHTTPResponse) => {
               if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
                  this.msgBox.showMessage(ENUM_MessageBox_Status.Success, ['External Lab Report Is Received from   ' + this.SelectedVendorName.VendorName + ' ']);
                  this.ExternalLabDataStatus.SelectedExternalLabStatusType = ENUM_ExternalLab_SampleStatus.ReportReceived;
                  this.GetAllTestListForExternalLabs();
                  this.IsReceive = false;
                  this.ShowReceiveButton = false;
                  this.ExternalLabDataStatus.RequisitionIds = [];
                  this.ExternalLabDataStatus.SelectedExternalLabStatusType = "";
               }
               else {
                  this.msgBox.showMessage(ENUM_MessageBox_Status.Error, ["Unable to Receive External Lab Report."]);
                  this.IsReceive = false;
               }
            },
            (err: DanpheHTTPResponse) => {
               this.msgBox.showMessage(ENUM_MessageBox_Status.Error, [err.ErrorMessage]);
               this.IsReceive = false;
            });
   }
   CancelReceive() {

   }
   ChangeStatus() {
      this.patLabInfoList = [];
      this.selectAll = false;
      this.IsReceive = false;
      this.ShowReceiveButton = false;
      this.showVendorSelectButton = false;
      this.showStickerButton = false;
      this.showUndoButton = false;
   }
   ClearList() {
      this.patLabInfoList = [];
      this.ShowReceiveButton = false;
      this.showVendorSelectButton = false;
      this.showStickerButton = false;
      this.showUndoButton = false;
      this.selectAll = false;
   }


   public Print() {
      this.ShowHeader = true;

      setTimeout(() => {
         let popupWinindow;
         if (document.getElementById("externalLabReportStatusHeader_id")) {
            var printContents = document.getElementById("externalLabReportStatusHeader_id").innerHTML;
         }

         popupWinindow = window.open('', '_blank', 'width=600,height=700,scrollbars=no,menubar=no,toolbar=no,location=no,status=no,titlebar=no');
         popupWinindow.document.open();
         var documentContent = `<html><head>
                             <style>
                             .externalLabReportStatusHeader div[class*="col-"]{
                               height: 100%;
                               min-height: 67px;
                               display: flex;
                               justify-content: flex-end;
                               flex-direction: column;
                               border: none;
                               font-size: 9px;
                             }
                             .externalLabReportStatusHeader .row {
                               display: flex;
                               width: 100%;
                               justify-content: space-between;
                             }
                             .headerDate {
                               width: 37% !important;
                             }
                             .headerHospName {
                               width: 40% !important;
                               word-wrap: break-word;
                             }
                             .headerPrintDate {
                               width: 23% !important;
                             }</style>`;


         documentContent += `<link rel="stylesheet" type="text/css" href="../../../../../../themes/theme-default/DanphePrintStyle.css" /></head>`;

         documentContent += '<body class="lab-rpt4moz" onload="window.print()">' + printContents + '</body></html>';
         popupWinindow.document.write(documentContent);
         popupWinindow.document.close();
         this.ShowHeader = false;
      }, 100)

   }
   Export() {
      this.ShowHeader = true;
      setTimeout(() => {
         CommonFunctions.ConvertHTMLTableToExcel('externalLabReportStatusHeader_id', "", "", "", "", "");
         this.ShowHeader = false;
      }, 100)

   }
   ShowStickerPopUp() {
      this.showLabStickerPopUp = true;
   }
   public CloseAfterPrint($event) {
      if ($event.exit) {
         this.showLabStickerPopUp = false;
      }
   }
   CloseSticker() {
      this.PatientLabInfo = new LabSticker();
      this.ExternalLabDataStatus.RequisitionIds = [];
      this.patLabInfoList.forEach(item => {
         item.IsSelected = false;
      });
      this.showLabStickerPopUp = false;
      this.showStickerButton = false;

   }
   ShowUndoOption() {
      // this.CheckForRowSelection();
      // const patLabInfos = this.patLabInfoList.filter((item) => item.IsSelected === true);
      // const allRequisitionIds = patLabInfos.map(item => item.RequisitionId).reduce((acc, val) => acc.concat(val), []);
      // allRequisitionIds.forEach(reqId => {
      //    if (this.requisitionIdList && this.requisitionIdList.length) {
      //       if (!this.requisitionIdList.includes(+reqId)) {
      //          this.requisitionIdList.push(+reqId);
      //       }
      //    } else {
      //       this.requisitionIdList.push(+reqId);
      //    }
      // });

      this.showUndoOption = false;
      this.changeDetector.detectChanges();
      this.showUndoOption = true;

   }
   ExitOutUndoCall($event) {
      if ($event.exit) {
         if ($event.exit == 'exitonsuccess') {
            this.PatientLabInfo = new LabSticker();
            this.requisitionIdList = [];
            this.GetAllTestListForExternalLabs();
            //  this.GetPendingLabResults(this.fromDate, this.toDate, this.catIdList);
            this.showUndoOption = false;
         }
         else if ($event.exit == 'close') {
            this.CloseUndoBox();
         }

      }
   }
   CloseUndoBox() {
      this.PatientLabInfo = new LabSticker();
      this.requisitionIdList = [];
      this.GetAllTestListForExternalLabs();
      // this.GetPendingLabResults(this.fromDate, this.toDate, this.catIdList);
      this.showUndoOption = false;
   }
}



