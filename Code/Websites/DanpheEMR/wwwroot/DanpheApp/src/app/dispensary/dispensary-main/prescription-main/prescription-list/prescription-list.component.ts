import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Patient } from '../../../../patients/shared/patient.model';
import { PatientService } from '../../../../patients/shared/patient.service';
import { PharmacyBLService } from '../../../../pharmacy/shared/pharmacy.bl.service';
import { PHRMGenericModel } from '../../../../pharmacy/shared/phrm-generic.model';
import { PHRMPrescriptionItem } from '../../../../pharmacy/shared/phrm-prescription-item.model';
import { PHRMPrescription } from '../../../../pharmacy/shared/phrm-prescription.model';
import { DanpheHTTPResponse } from '../../../../shared/common-models';
import { GridEmitModel } from '../../../../shared/danphe-grid/grid-emit.model';
import { MessageboxService } from '../../../../shared/messagebox/messagebox.service';
import { RouteFromService } from '../../../../shared/routefrom.service';
import { ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status } from '../../../../shared/shared-enums';
import DispensaryGridColumns from '../../../shared/dispensary-grid.column';

@Component({
  selector: 'app-prescription-list',
  templateUrl: './prescription-list.component.html',
  styleUrls: ['./prescription-list.component.css'],
  host: { '(window:keydown)': 'hotkeys($event)' }
})
export class PrescriptionListComponent implements OnInit {

  //It save prescriptionid with prescription itmes details for local data access
  PrescriptionListData = new Array<{ PrescriptionId: number, PrescriptionItems: Array<PHRMPrescriptionItem> }>();
  CurrentPrescription = new PHRMPrescription();
  Patient: Patient = new Patient();
  GenericList = new Array<PHRMGenericModel>();
  PrescriptionGridColumns: Array<any> = null;
  ShowPreItemsPopup: boolean = false;
  IsShowPrescriptionDetail: boolean = false;
  BlockDispatch: boolean = false;
  constructor(
    private _patientService: PatientService,
    private _routeFromService: RouteFromService,
    private _router: Router,
    private _pharmacyBLService: PharmacyBLService,
    private _msgBoxServ: MessageboxService,
    public changeDetector: ChangeDetectorRef
  ) {
    this.GetGenericList();
    this.LoadPrescriptions();
    this.PrescriptionGridColumns = DispensaryGridColumns.PHRMPrescriptionList;
  }
  ngOnInit() {
  }
  //Load prescription list
  LoadPrescriptions(): void {
    try {
      this._pharmacyBLService.GetPrescriptionList()
        .subscribe(res => {
          if (res.Status === ENUM_DanpheHTTPResponses.OK) {
            this.PrescriptionListData = res.Results;
          }
          else {
            this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, [res.ErrorMessage]);
          }
        },
          err => {
            this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, ["failed to get  patients"]);

          });
    } catch (exception) {
      this.ShowCatchErrMessage(exception);
    }

  }
  logError(err: any) {
    this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, [err]);
    console.log(err);
  }
  //Grid actions fires this method
  PrescriptionGridActions($event: GridEmitModel) {
    try {
      switch ($event.Action) {
        case "view": {
          this.CurrentPrescription = $event.Data;
          this._pharmacyBLService.GetPrescriptionItems(this.CurrentPrescription.PatientId, this.CurrentPrescription.PrescriberId, this.CurrentPrescription.PrescriptionId)
            .subscribe(res => {
              if (res.Status === ENUM_DanpheHTTPResponses.OK && res.Results.length > 0) {
                this.CurrentPrescription.PHRMPrescriptionItems = res.Results;
                this.CurrentPrescription.PHRMPrescriptionItems.forEach(item => {
                  const genericItem = this.GenericList.find(g => g.GenericId === item.GenericId);
                  if (genericItem) {
                    item.GenericName = genericItem.GenericName;
                  }
                });
                this.BlockDispatch = this.CurrentPrescription.PHRMPrescriptionItems.every(a => a.IsAvailable == false);
              } else {
                this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, [res.ErrorMessage]);
              }
            }, err => { });
          this.IsShowPrescriptionDetail = true;
          break;
        }
        default:
          break;
      }
    } catch (exception) {
      this.ShowCatchErrMessage(exception);
    }

  }

  Dispatch() {
    this._pharmacyBLService.UpdatePrescriptionItemStatus(this.CurrentPrescription.PatientId)
      .subscribe(res => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Success, ["Prescription Item is dispatched"]);
          this.IsShowPrescriptionDetail = false;
          this.LoadPrescriptions();
        }
        else {
          this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, [res.ErrorMessage]);
        }
      },
        err => {
          this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, ["failed to dispatch"]);

        });
  }
  // Dispatch() {
  //   this.pharmacyService.PatientId = this.currentPrescription.PatientId;
  //   this.pharmacyService.PrescriberId = this.currentPrescription.PrescriberId;
  //   //get patient details by pat id and set to patient service for sale use
  //   this.pharmacyBLService.GetPatientByPatId(this.pharmacyService.PatientId)
  //     .subscribe(res => {
  //       if (res.Status == 'OK') {
  //         this.CallBackAfterPatGet(res.Results);
  //       }
  //       else {
  //         this.msgBoxServ.showMessage("error", [res.ErrorMessage]);
  //       }
  //     },
  //       err => {
  //         this.msgBoxServ.showMessage("error", ["failed to get  patients"]);

  //       });
  // }
  ////Method to get patient details by Patient Id for set value to patient service
  public CallBackAfterPatGet(results) {
    try {
      this.SetPatServiceData(results);
      this._routeFromService.RouteFrom = "prescription";
      this._router.navigate(['/Dispensary/Sale/New']);
    } catch (exception) {
      this.ShowCatchErrMessage(exception);
    }

  }
  //Method for assign value to patient service
  public SetPatServiceData(selectedPatientData) {
    try {
      if (selectedPatientData) {
        var globalPatient = this._patientService.getGlobal();
        globalPatient.PatientId = selectedPatientData.PatientId;
        globalPatient.PatientCode = selectedPatientData.PatientCode;
        globalPatient.ShortName = selectedPatientData.ShortName;
        globalPatient.DateOfBirth = selectedPatientData.DateOfBirth;
        globalPatient.Gender = selectedPatientData.Gender;
        globalPatient.IsOutdoorPat = selectedPatientData.IsOutdoorPat;
        globalPatient.PhoneNumber = selectedPatientData.PhoneNumber;
        globalPatient.FirstName = selectedPatientData.FirstName;
        globalPatient.MiddleName = selectedPatientData.MiddleName;
        globalPatient.LastName = selectedPatientData.LastName;
        globalPatient.Age = selectedPatientData.Age;
        globalPatient.Address = selectedPatientData.Address;
      }
    } catch (exception) {
      this.ShowCatchErrMessage(exception);
    }

  }
  //This function only for show catch messages
  ShowCatchErrMessage(exception) {
    try {
      if (exception) {
        let ex: Error = exception;
        console.log("Error Messsage =>  " + ex.message);
        console.log("Stack Details =>   " + ex.stack);
      }
    } catch (exception) {
      let ex: Error = exception;
      console.log("Error Messsage =>  " + ex.message);
      console.log("Stack Details =>   " + ex.stack);
    }
  }
  Close() {
    this.CurrentPrescription = new PHRMPrescription();
    this.IsShowPrescriptionDetail = false;
  }
  print() {
    let popupWinindow;
    var printContents = document.getElementById("printpage").innerHTML;
    popupWinindow = window.open('', '_blank', 'width=600,height=700,scrollbars=no,menubar=no,toolbar=no,location=no,status=no,titlebar=no');
    popupWinindow.document.open();
    popupWinindow.document.write('<html><head><link rel="stylesheet" type="text/css" href="../../themes/theme-default/ReceiptList.css" /></head><style>.printStyle {border: dotted 1px;margin: 10px 100px;}.print-border-top {border-top: dotted 1px;}.print-border-bottom {border-bottom: dotted 1px;}.print-border {border: dotted 1px;}.center-style {text-align: center;}.border-up-down {border-top: dotted 1px;border-bottom: dotted 1px;}</style><body onload="window.print()">' + printContents + '</html>');
    popupWinindow.document.close();
  }
  GetGenericList(): void {
    this._pharmacyBLService.GetGenericList().subscribe((res: DanpheHTTPResponse) => {
      if (res.Status == ENUM_DanpheHTTPResponses.OK) {
        this.GenericList = res.Results;
      }
      else {
        this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ['Failed to Load Generic Name List.'], res.ErrorMessage);
      }
    });
  }

  public hotkeys(event) {
    if (event.keyCode === 27) {
      this.Close();
    }
  }

}
