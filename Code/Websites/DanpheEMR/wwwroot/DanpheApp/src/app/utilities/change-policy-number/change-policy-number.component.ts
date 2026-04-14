import { Component } from "@angular/core";
import { Observable } from "rxjs";
import { Patient_DTO } from "../../claim-management/shared/DTOs/patient.dto";
import { BillingScheme_DTO } from "../../settings-new/billing/shared/dto/billing-scheme.dto";
import { DanpheHTTPResponse } from "../../shared/common-models";
import { MessageboxService } from "../../shared/messagebox/messagebox.service";
import { ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status } from "../../shared/shared-enums";
import { ChangePolicyNumberDTO } from "../shared/DTOs/change-policy-number.dto";
import { UtilitiesBLService } from "../shared/utilities.bl.service";

@Component({
  selector: 'change-policy-number',
  templateUrl: './change-policy-number.component.html'
})
export class ChangePolicyNumberComponent {
  NewPolicyNumber: string = '';
  Schemes = new Array<BillingScheme_DTO>();

  SelectedPatient = new Patient_DTO();
  SelectedScheme = new BillingScheme_DTO();

  ChangePolicyNumber = new ChangePolicyNumberDTO();

  constructor(private _utilitiesBlService: UtilitiesBLService,
    private _messageBoxService: MessageboxService
  ) { }
  ngOnInit(): void {
    this.GetSchemes();
  }

  GetSchemes(): void {
    this._utilitiesBlService.GetBillingSchmes().subscribe(
      (res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this.Schemes = res.Results;
        } else {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Error: ${res.ErrorMessage}`]);
        }
      }, (err) => {
        this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Failed To Load Schemes!`]);
      }
    );
  }

  public AllPatientSearchAsync = (keyword: any): Observable<any[]> => {
    return this._utilitiesBlService.SearchRegisteredPatient(keyword);
  };

  PatientListFormatter(data: any): string {
    let html: string = "";
    html =
      "<font size=03>" +
      "[" +
      data["PatientCode"] +
      "]" +
      "</font>&nbsp;-&nbsp;&nbsp;<font color='blue'; size=03 ><b>" +
      data["ShortName"] +
      "</b></font>&nbsp;&nbsp;" +
      "(" +
      data["Age"] +
      "/" +
      data["Gender"] +
      ")" +
      "" +
      "</b></font>";
    return html;
  }
  UpdatePolicyNumber(): void {
    if (this.SelectedPatient && this.SelectedPatient.PatientId && this.SelectedScheme && this.SelectedScheme.SchemeId && this.NewPolicyNumber && this.NewPolicyNumber.trim()) {
      this.ChangePolicyNumber.PatientId = this.SelectedPatient.PatientId;
      this.ChangePolicyNumber.SchemeId = this.SelectedScheme.SchemeId;
      this.ChangePolicyNumber.PolicyNumber = this.NewPolicyNumber;

      this._utilitiesBlService.UpdatePolicyNumber(this.ChangePolicyNumber).subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK && res.Results) {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Success, [`Successfully Update Policy Number of the selected Patient!`]);
          this.ResetVariables();
        } else {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Error: ${res.ErrorMessage}`,]);
        }
      }, err => {
        console.error(err);
        this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Failed to update Policy Number!`]);
      });
    }
  }

  ResetVariables(): void {
    this.SelectedPatient = new Patient_DTO();
    this.SelectedScheme = new BillingScheme_DTO();
    this.ChangePolicyNumber = new ChangePolicyNumberDTO();
    this.NewPolicyNumber = "";
  }

}
