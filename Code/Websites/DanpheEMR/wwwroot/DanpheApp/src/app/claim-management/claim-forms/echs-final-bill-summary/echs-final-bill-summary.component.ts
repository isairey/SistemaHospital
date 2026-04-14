import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { CoreService } from '../../../core/shared/core.service';
import { DanpheHTTPResponse } from '../../../shared/common-models';
import { MessageboxService } from '../../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status } from '../../../shared/shared-enums';
import { ClaimManagementBLService } from '../../shared/claim-management.bl.service';
import { Patient_DTO } from '../../shared/DTOs/patient.dto';

@Component({
  selector: 'echs-final-bill-summary',
  templateUrl: './echs-final-bill-summary.component.html',
  styleUrls: ['./echs-final-bill-summary.component.css'],
})

export class EchsFinalBillSummaryComponent implements OnInit {
  PatientObj: Patient_DTO = new Patient_DTO();
  EnableServerSideSearch: boolean = false;
  PatientSearchMinCharacterCount: number = 0;
  SelectedClaimCode: number = 0;
  IsPatientSelected: boolean = false;
  ShowEchsFinalBillSummaryPrintPage: boolean = false;
  ClaimCodes = new Array<number>();
  IsClaimCodeValid: boolean = false;

  constructor(
    private _claimManagementBLService: ClaimManagementBLService,
    private _changeDetector: ChangeDetectorRef,
    private _coreService: CoreService,
    private _messageBoxService: MessageboxService,
  ) {
  }

  ngOnInit(): void {
    this.GetParameter();
    this.GetPatientSearchMinCharacterCountParameter();
  }

  PatientListFormatter(data: any): string {
    let html: string = "";
    html = "<font size=03>" + "[" + data["PatientCode"] + "]" + "</font>&nbsp;-&nbsp;&nbsp;<font color='blue'; size=03 ><b>" + data["ShortName"] +
      "</b></font>&nbsp;&nbsp;" + "(" + data["Age"] + '/' + data["Gender"] + ")" + "(" + data["PhoneNumber"] + ")" + '' + "</b></font>";
    return html;
  }

  AllPatientSearchAsync = (keyword: any): Observable<any[]> => {
    return this._claimManagementBLService.GetECHSPatientWithVisitInformation(keyword);
  }

  PatientInfoChanged(): void {
    this.IsPatientSelected = false;
    this.SelectedClaimCode = null;
    if (this.PatientObj && typeof (this.PatientObj) === "object") {
      this._changeDetector.detectChanges();
      this.GetInitiatedClaimCodesByPatientId();
      this.IsPatientSelected = true;
    }
  }

  GetInitiatedClaimCodesByPatientId(): void {
    this._claimManagementBLService.GetInitiatedClaimCodesByPatientId(this.PatientObj.PatientId).subscribe((res: DanpheHTTPResponse) => {
      if (res.Status === ENUM_DanpheHTTPResponses.OK) {
        if (res.Results && res.Results.length) {
          this.ClaimCodes = res.Results;
        }
        else {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Warning, [`${res.ErrorMessage}`]);
        }
      }
      else {
        this._messageBoxService.showMessage(ENUM_MessageBox_Status.Warning, [`Error : ${res.ErrorMessage}`]);
      }
    });
  }

  OnClaimCodeSelected(): void {
    if (this.SelectedClaimCode) {
      if (this.ClaimCodes.includes(this.SelectedClaimCode)) {
        this.IsClaimCodeValid = true;
      }
      else {
        this.IsClaimCodeValid = false;
      }
      this._changeDetector.detectChanges();
    }
  }

  SetFocusOn(idToSelect: string): void {
    if (document.getElementById(idToSelect)) {
      let nextEl = <HTMLInputElement>document.getElementById(idToSelect);
      nextEl.focus();
    }
  }

  GetParameter(): void {
    let parameterData = this._coreService.Parameters.find(p => p.ParameterGroupName === "Common" && p.ParameterName === "ServerSideSearchComponent").ParameterValue;
    var data = JSON.parse(parameterData);
    this.EnableServerSideSearch = data["BillingSearchPatient"];
  }

  GetPatientSearchMinCharacterCountParameter(): void {
    let param = this._coreService.Parameters.find(a => a.ParameterGroupName === 'Common' && a.ParameterName === 'PatientSearchMinCharacterCount');
    if (param) {
      let obj = JSON.parse(param.ParameterValue);
      this.PatientSearchMinCharacterCount = parseInt(obj.MinCharacterCount);
    }
  }

  ShowFinalBillSummaryReportPopUp(): void {
    this.ShowEchsFinalBillSummaryPrintPage = true;
    this._changeDetector.detectChanges();
  }

  CloseFinalBillSummaryCallBack(): void {
    this.ShowEchsFinalBillSummaryPrintPage = false;
    this.PatientObj = new Patient_DTO();
    this.IsPatientSelected = false;
    this.SelectedClaimCode = 0;
    this.ClaimCodes = new Array<number>();
    this.IsClaimCodeValid = false;
  }

}
