import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import * as moment from 'moment';
import { CoreService } from '../../../../core/shared/core.service';
import { Patient } from '../../../../patients/shared/patient.model';
import { PatientService } from '../../../../patients/shared/patient.service';
import { PharmacyDepositHead_DTO } from '../../../../pharmacy/shared/dtos/pharmacy-deposit-head.dto';
import { PHRMEmployeeCashTransaction } from '../../../../pharmacy/shared/pharmacy-employee-cash-transaction';
import { PharmacyBLService } from '../../../../pharmacy/shared/pharmacy.bl.service';
import { PharmacyService } from '../../../../pharmacy/shared/pharmacy.service';
import { SecurityService } from '../../../../security/shared/security.service';
import { CallbackService } from '../../../../shared/callback.service';
import { DanpheHTTPResponse } from '../../../../shared/common-models';
import { CommonFunctions } from '../../../../shared/common.functions';
import { MessageboxService } from '../../../../shared/messagebox/messagebox.service';
import { RouteFromService } from '../../../../shared/routefrom.service';
import { ENUM_BillDepositType, ENUM_BillPaymentMode, ENUM_DanpheHTTPResponses } from '../../../../shared/shared-enums';
import { DispensaryService } from '../../../shared/dispensary.service';
import { DepositInfo_DTO } from '../../sales-main/deposit-receipt/phrm-deposit-list.component';
import { PHRMDepositModel } from './phrm-deposit.model';
@Component({
  selector: 'app-patient-deposit-add',
  templateUrl: './patient-deposit-add.component.html',
})
export class PatientDepositAddComponent implements OnInit {

  public ShowDepositAdd: boolean = false;
  public currentCounterId: number = null;
  public currentCounterName: string = null;
  loading: boolean = false;
  public PaymentData: boolean = false;
  public ShowPrint: boolean = false;
  @Input("deposit-data")
  public selectedPatient: Patient = new Patient();
  @Input("isAddDepositTxn")
  public isAddDepositTxn: boolean = false;

  @Output("callback-add")
  callbackAdd: EventEmitter<Object> = new EventEmitter<Object>();

  public depositData: PHRMDepositModel = new PHRMDepositModel();
  public printDepositData: PHRMDepositModel = new PHRMDepositModel();
  public DepositPrintData: DepositInfo_DTO = new DepositInfo_DTO();
  public currentFiscalYear: any;
  public user = this.securityService.GetLoggedInUser().UserName;
  public MstPaymentModes: any = [];
  public pharmacyEmployeeCashTransaction: PHRMEmployeeCashTransaction = new PHRMEmployeeCashTransaction();
  DepositHeadList: PharmacyDepositHead_DTO[] = [];
  SelectedDepositHead: PharmacyDepositHead_DTO = new PharmacyDepositHead_DTO();
  constructor(public securityService: SecurityService, private _dispensaryService: DispensaryService,
    public pharmacyService: PharmacyService,
    public pharmacyBLService: PharmacyBLService,
    public router: Router,
    public routeFromService: RouteFromService,
    public patientService: PatientService,
    public callbackService: CallbackService,
    public messageBoxService: MessageboxService,
    public coreService: CoreService) {

    this.MstPaymentModes = this.coreService.masterPaymentModes;
    this.Initialize();
    this.GetDepositHead();
  }

  ngOnInit() {
  }
  @Input("showDepositAdd")
  public set ShowAdd(_showAdd) {
    this.ShowDepositAdd = _showAdd;

    if (this.ShowDepositAdd) {
      let temp = this.selectedPatient;
      this.Initialize();
      if (this.selectedPatient) {
        this.currentCounterId = this.securityService.getPHRMLoggedInCounter().CounterId;
        if (this.currentCounterId < 1) {
          this.router.navigate(['/Dispensary/ActivateCounter']);
          this.callbackService.CallbackRoute = '/Dispensary/Patient/List'
        }
        this.GetPatientDeposit(this.selectedPatient.PatientId);
      }
    }
  }
  Initialize() {

    this.loading = false;
    this.depositData = new PHRMDepositModel();
    this.depositData.CounterId = this.securityService.getLoggedInCounter().CounterId;
    this.depositData.TransactionType = ENUM_BillDepositType.Deposit;
    this.depositData.PaymentMode = ENUM_BillPaymentMode.cash;
  }

  GetPatientDeposit(patientId: number): void {
    this.pharmacyBLService.GetDepositFromPatient(patientId)
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status == "OK") {
          if (res.Results.length)
            this.CalculateDepositBalance(res);
        }
        else {
          this.messageBoxService.showMessage("failed", ["Unable to get deposit detail"]);
          console.log(res.ErrorMessage);
        }
      });
  }

  CalculateDepositBalance(res) {
    let depositAmount = 0;
    let returnDepositAmount = 0;
    let depositDeductAmount = 0;
    for (var i = 0; i < res.Results.length; i++) {
      if (res.Results[i].TransactionType === ENUM_BillDepositType.Deposit) {
        depositAmount = res.Results[i].InAmount;
      }
      else if (res.Results[i].TransactionType === ENUM_BillDepositType.ReturnDeposit) {
        returnDepositAmount = res.Results[i].OutAmount;
      }
      else if (res.Results[i].TransactionType === ENUM_BillDepositType.DepositDeduct) {
        depositDeductAmount = res.Results[i].OutAmount;
      }
    }
    this.depositData.DepositBalance = CommonFunctions.parseAmount(depositAmount - depositDeductAmount - returnDepositAmount);
  }

  onPaymentModeChange() {
    if (this.depositData.PaymentMode !== ENUM_BillPaymentMode.cash) {
      this.depositData.UpdateValidator('on', 'PaymentDetails', 'required');
    } else {
      this.depositData.UpdateValidator('off', 'PaymentDetails', 'required');
    }
  }

  SubmitDeposit(showReceipt: boolean) {
    //to store counter Id
    this.depositData.CounterId = this.currentCounterId;
    this.depositData.CreatedOn = moment().format('YYYY-MM-DD');
    this.depositData.CreatedBy = this.securityService.GetLoggedInUser().EmployeeId;
    this.depositData.CareOf = this.depositData.CareOf.trim();
    this.depositData.CareOfContact = this.depositData.CareOfContact.trim();

    if (this.depositData.TransactionType) {
      if (this.depositData.DepositAmount > 0) {
        if (this.depositData.TransactionType === ENUM_BillDepositType.ReturnDeposit && this.depositData.DepositAmount > this.depositData.DepositBalance) {
          this.messageBoxService.showMessage("failed", ["Return Amount should not be greater than deposit Amount"]);
          return;
        }

        if (this.depositData && !this.depositData.CareOf) {
          this.messageBoxService.showMessage("failed", [this.depositData.TransactionType + " Depositor Name is mandatory!"]);
          return;
        }

        if (this.depositData.TransactionType === ENUM_BillDepositType.ReturnDeposit && this.depositData.Remarks == '') {
          this.messageBoxService.showMessage("failed", ["Remarks is mandatory for deposit return."]);
          return;
        }
        if (this.depositData && this.depositData.CareOfContact) {
          const regex = /^[0-9+\-()]+$/;
          const careOfContact = this.depositData.CareOfContact;
          if (!regex.test(careOfContact)) {
            this.messageBoxService.showMessage("failed", ["Contact Information should only contain numbers or Special Character"]);
            return;
          }
        }
        for (let b in this.depositData.DepositValidator.controls) {
          this.depositData.DepositValidator.controls[b].markAsDirty();
          this.depositData.DepositValidator.controls[b].updateValueAndValidity();
        }
        if (this.depositData.IsValid(undefined, undefined)) {

          if (this.depositData.TransactionType === ENUM_BillDepositType.Deposit) {
            this.depositData.DepositBalance = this.depositData.DepositBalance + this.depositData.DepositAmount;
            this.depositData.InAmount = this.depositData.DepositAmount;
            this.depositData.OutAmount = 0;
          }
          else {
            this.depositData.DepositBalance = this.depositData.DepositBalance - this.depositData.DepositAmount;
            this.depositData.OutAmount = this.depositData.DepositAmount;
            this.depositData.InAmount = 0;
          }
          this.depositData.PHRMEmployeeCashTransactions = this.TempEmployeeCashTransaction;

          this.loading = true;
          this.depositData.PatientId = this.selectedPatient.PatientId;
          this.depositData.VisitType = this.selectedPatient.VisitType;
          this.depositData.PatientVisitId = this.selectedPatient.PatientVisitId;
          this.depositData.StoreId = this._dispensaryService.activeDispensary.StoreId;
          this.pharmacyBLService.PostPharmacyDeposit(this.depositData)
            .finally(() => this.loading = false)
            .subscribe(
              res => {
                if (res.Status == "OK") {
                  if (this.depositData.TransactionType === ENUM_BillDepositType.Deposit) {
                    //deposit add 
                    this.messageBoxService.showMessage("success", ["Deposit of " + this.depositData.DepositAmount + " added successfully."]);
                  }
                  else {
                    //deposit return
                    this.messageBoxService.showMessage("success", [this.depositData.DepositAmount + " returned successfully."]);
                  }
                  this.depositData.DepositBalance = res.Results.DepositBalance;

                  if (!showReceipt) {
                    this.Close();
                  }

                  if (showReceipt) {
                    this.DepositPrintData = res.Results;
                    this.DepositPrintData.PaymentMode = ENUM_BillPaymentMode.cash //Deposit default payment mode is cash
                    this.DepositPrintData.PaymentDetails = this.depositData.PaymentDetails;
                    // if (this.printDepositData.TransactionType === ENUM_BillDepositType.Deposit) {
                    //   this.printDepositData.DepositAmount = this.printDepositData.InAmount;
                    // }
                    // if (this.printDepositData.TransactionType === ENUM_BillDepositType.ReturnDeposit) {
                    //   this.printDepositData.DepositAmount = this.printDepositData.OutAmount;
                    // }
                    this.ShowDepositAdd = false;
                    this.ShowPrint = true;
                  }

                  this.Initialize();
                }
                else {
                  this.messageBoxService.showMessage("failed", ["Cannot complete the transaction. <br>" + res.ErrorMessage]);
                }
              },
              err => {
                this.messageBoxService.showMessage("failed", ["Cannot complete the transaction. <br>" + err]);
              });
        }
        else {
          this.messageBoxService.showMessage("failed", ["* field are mandatory!"]);
          this.loading = false;
        }
      } else {
        this.messageBoxService.showMessage("failed", [this.depositData.TransactionType + " Amount must be greater than 0"]);
      }
    }
    else {
      this.messageBoxService.showMessage("failed", ["Please Select Deposit Type"])
    }
  }
  Print() {
    this.pharmacyBLService.UpdateDepositPrintCount(this.printDepositData).subscribe(
      res => {
        if (res.Status == "OK") {
          let popupWindow;
          var printContents = document.getElementById("printpage").innerHTML;
          popupWindow = window.open('', '_blank', 'width=600,height=700,scrollbars=no,menubar=no,toolbar=no,location=no,status=no,titlebar=no');
          popupWindow.document.open();
          let documentContent = "<html><head>";
          documentContent += '<link rel="stylesheet" type="text/css" media="print" href="../../../themes/theme-default/DanphePrintStyle.css"/>';
          documentContent += '<link rel="stylesheet" type="text/css" href="../../../themes/theme-default/DanpheStyle.css"/>';
          documentContent += '<link rel="stylesheet" type="text/css" href="../../../assets/global/plugins/bootstrap/css/bootstrap.min.css"/>';
          documentContent += '</head>';
          documentContent += '<body onload="window.print()">' + printContents + '</body></html>'
          popupWindow.document.write(documentContent);
          popupWindow.document.close();
          this.Close();
        } else {
          this.messageBoxService.showMessage("failed", ["Please try again"]);
          this.loading = false;
        }
      });

  }
  Close() {
    this.ShowDepositAdd = false;
    this.ShowPrint = false;
    this.callbackAdd.emit({ 'result': "Deposit added successfully" });
  }
  public TempEmployeeCashTransaction: Array<PHRMEmployeeCashTransaction> = new Array<PHRMEmployeeCashTransaction>();
  PaymentModeChanges($event) {
    this.depositData.PaymentMode = $event.PaymentMode.toLowerCase();
    this.depositData.PaymentDetails = $event.PaymentDetails;

    if (this.TempEmployeeCashTransaction && !this.TempEmployeeCashTransaction.length) {
      let obj = this.MstPaymentModes.find(a => a.PaymentSubCategoryName.toLowerCase() == this.depositData.PaymentMode.toLocaleLowerCase());
      let empCashTxnObj = new PHRMEmployeeCashTransaction();
      empCashTxnObj.InAmount = this.depositData.DepositBalance + this.depositData.DepositAmount;
      empCashTxnObj.OutAmount = 0;
      empCashTxnObj.PaymentModeSubCategoryId = obj.PaymentSubcategoryId;
      empCashTxnObj.ModuleName = "Dispensary";
      this.TempEmployeeCashTransaction.push(empCashTxnObj);
    }

  }
  MultiplePaymentCallBack($event) {
    if ($event && $event.MultiPaymentDetail) {
      this.TempEmployeeCashTransaction = new Array<PHRMEmployeeCashTransaction>();
      this.TempEmployeeCashTransaction = $event.MultiPaymentDetail;
    }
    this.depositData.PaymentDetails = $event.PaymentDetail;
  }

  GetDepositHead() {
    this.pharmacyBLService.GetDepositHead()
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this.DepositHeadList = res.Results;
          const defaultDepositHead = this.DepositHeadList.find(f => f.IsDefault === true);
          if (defaultDepositHead) {
            this.depositData.DepositHeadId = defaultDepositHead.DepositHeadId;
          }
        }
      });
  }

  OnDepositHeadChange($event, IdToBeFocused: string) {
    if (this.SelectedDepositHead && this.SelectedDepositHead.DepositHeadId) {
      this.depositData.DepositHeadId = this.SelectedDepositHead.DepositHeadId;
      this.SetFocusById(IdToBeFocused);
    } else {
      this.SelectedDepositHead.DepositHeadId = null;
    }

  }
  SetFocusById(IdToBeFocused: string) {
    window.setTimeout(function () {
      let elemToFocus = document.getElementById(IdToBeFocused)
      if (elemToFocus != null && elemToFocus != undefined) {
        elemToFocus.focus();
      }
    }, 100);
  }
}
