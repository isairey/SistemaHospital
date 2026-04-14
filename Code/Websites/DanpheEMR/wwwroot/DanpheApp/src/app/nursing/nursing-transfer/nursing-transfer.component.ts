import { Component } from "@angular/core";
import { Router } from "@angular/router";
import { ADT_BLService } from "../../adt/shared/adt.bl.service";
import { VisitService } from "../../appointments/shared/visit.service";
import { PatientService } from "../../patients/shared/patient.service";
import { SecurityService } from "../../security/shared/security.service";
import { DanpheHTTPResponse } from "../../shared/common-models";
import { MessageboxService } from "../../shared/messagebox/messagebox.service";
import { ENUM_DanpheHTTPResponses } from "../../shared/shared-enums";
import { NursingBLService } from "../shared/nursing.bl.service";

@Component({
  templateUrl: "./nursing-transfer.html",
})
export class NursingTransferComponent {
  public showTransferInPopUp: boolean = false;
  public showTransferPage: boolean = false;
  public selectedBedInfo: {
    PatientAdmissionId;
    PatientId;
    PatientVisitId;
    MSIPAddressInfo;
    PatientCode;
    DischargedDate;
    Name;
    AdmittingDoctor;
    BedInformation: {
      BedId;
      PatientBedInfoId;
      Ward;
      BedFeature;
      BedCode;
      BedNumber;
      BedFeatureId;
      AdmittedDate;
      WardId;
      StartedOn;
    };
  };

  patientId: any;
  visitId: any;

  //constructor of class
  constructor(
    public securityServ: SecurityService,
    public visitservice: VisitService,
    public patientservice: PatientService,
    public msgBoxServ: MessageboxService,
    public nursingBlService: NursingBLService,
    public admissionBLService: ADT_BLService,
    public router: Router
  ) {
    this.patientId = this.patientservice.globalPatient.PatientId;
    this.visitId = this.visitservice.globalVisit.PatientVisitId;
  }

  ngOnInit() {
    this.LoadDepartments();
    this.GetADTPatientByPatVisitId();
  }

  GetADTPatientByPatVisitId() {
    this.nursingBlService.GetADTDataByVisitId(this.visitId).subscribe(
      (res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK && res.Results) {
          const adtInformation = res.Results;
          if (adtInformation && adtInformation.length === 1) {
            this.selectedBedInfo = res.Results[0];
          }
          this.showTransferPage = true;
        } else {
          this.msgBoxServ.showMessage("error", [res.ErrorMessage]);
        }
      },
      (err) => {
        this.msgBoxServ.showMessage("error", [err.ErrorMessage]);
      }
    );
  }

  TransferUpgrade($event) {
    this.router.navigate(["/Nursing/InPatient"]);
  }

  public allDepartments: Array<any> = [];
  public LoadDepartments() {
    this.admissionBLService.GetDepartments()
      .subscribe((res: DanpheHTTPResponse) => {
        this.allDepartments = res.Results;

      });
  }
}
