import { Component } from "@angular/core";
import { Observable } from "rxjs";
import { BillingBLService } from "../../billing/shared/billing.bl.service";
import { DanpheHTTPResponse } from "../../shared/common-models";
import { MessageboxService } from "../../shared/messagebox/messagebox.service";
import { ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status } from "../../shared/shared-enums";
import { AdtExchangeBed_DTO } from "../shared/DTOs/adt-post-exchange-bed.dto";
import { ADT_BLService } from "../shared/adt.bl.service";
import { Bed } from "../shared/bed.model";

@Component({
    selector: 'exchange-bed',
    templateUrl: './adt-exchange-bed.component.html',
    styleUrls: ['./adt-exchange-bed.component.css']
})


export class AdtExchangeBedComponent {
    SelectedPatient: any;
    CurrentBedInformation = {
        WardName: "",
        BedFeatureName: "",
        BedCode: "",
        BedNumber: "",
        BedId: 0,
        IsAvailable: false
    };

    DesiredBedInformation = {
        WardName: "",
        BedFeatureName: "",
        BedCode: "",
        BedNumber: "",
        BedId: 0,
        IsAvailable: false
    };
    AllBedsByBedFeature = new Array<Bed>();
    SelectedDesiredBed = new Bed();

    BedOccupyingPatient = {
        PatientId: 0,
        PatientVisitId: 0,
        PatientName: ""
    };

    constructor(private _billingBlService: BillingBLService, private _adtBlService: ADT_BLService, private _msgBoxService: MessageboxService) {

    }
    AdmittedPatientSearch = (keyword: any): Observable<any[]> => {
        return this._billingBlService.GetIpdPatientsWithVisitsInfo(keyword);
    };
    AdmittedPatientListFormatter(data): string {
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

    OnPatientChanged(): void {
        if (this.SelectedPatient) {
            console.log(this.SelectedPatient);
            if (this.SelectedPatient.WardId && this.SelectedPatient.BedFeatureId) {
                this.GetBedsByWardAndBedFeature(this.SelectedPatient.WardId, this.SelectedPatient.BedFeatureId);
            }
            this.CurrentBedInformation.WardName = this.SelectedPatient.WardName;
            this.CurrentBedInformation.BedFeatureName = this.SelectedPatient.BedFeatureName;
            this.CurrentBedInformation.BedCode = this.SelectedPatient.BedCode;
            this.CurrentBedInformation.BedNumber = this.SelectedPatient.BedNumber;
            this.CurrentBedInformation.BedId = this.SelectedPatient.BedId;

            this.DesiredBedInformation = JSON.parse(JSON.stringify(this.CurrentBedInformation));
            this.DesiredBedInformation.BedId = 0;
            this.DesiredBedInformation.BedCode = "";
            this.DesiredBedInformation.BedNumber = "";
        }
    }
    GetBedsByWardAndBedFeature(wardId: number, bedFeatureId: number) {
        if (wardId && bedFeatureId) {
            this._adtBlService.GetBedsByBedFeature(wardId, bedFeatureId).subscribe((res: DanpheHTTPResponse) => {
                if (res.Status === ENUM_DanpheHTTPResponses.OK && res.Results) {
                    const allBedsByBedFeature = res.Results;
                    this.AllBedsByBedFeature = allBedsByBedFeature.filter(b => b.BedId !== this.SelectedPatient.BedId);

                } else {
                    this._msgBoxService.showMessage(ENUM_MessageBox_Status.Failed, ["Failed to get the Beds"]);
                }
            }, err => {
                console.log(err);
                this._msgBoxService.showMessage(ENUM_MessageBox_Status.Error, ["Something went wrong while fetching the Beds"]);
            });
        }
    }

    OnDesiredBedSelected($event): void {
        if ($event) {
            const bedId = +$event.target.value;
            const selectedBed = this.AllBedsByBedFeature.find(b => b.BedId === bedId);
            if (selectedBed) {

                // Clearing the previous patient data
                this.BedOccupyingPatient = { PatientId: 0, PatientVisitId: 0, PatientName: "" };

                this.SelectedDesiredBed = selectedBed;
                this.DesiredBedInformation.BedId = selectedBed.BedId;
                this.DesiredBedInformation.BedCode = selectedBed.BedCode;
                this.DesiredBedInformation.BedNumber = selectedBed.BedNumber;


                if (selectedBed.IsOccupied || selectedBed.IsReserved) {
                    this.DesiredBedInformation.IsAvailable = false;
                    this.GetPatientOccupyingTheBed(selectedBed.BedId, this.SelectedPatient.WardId, this.SelectedPatient.BedFeatureId);

                } else {
                    this.DesiredBedInformation.IsAvailable = true;
                }
            }
        }
    }
    GetPatientOccupyingTheBed(bedId: number, wardId: any, bedFeatureId: any) {
        this._adtBlService.GetPatientOccupyingTheBed(bedId, wardId, bedFeatureId).subscribe((res: DanpheHTTPResponse) => {
            if (res.Status === ENUM_DanpheHTTPResponses.OK && res.Results) {
                this.BedOccupyingPatient = res.Results;
            }
        }, err => {
            console.log(err);
            this._msgBoxService.showMessage(ENUM_MessageBox_Status.Error, ["Something went wring while fetching patient information"]);
        });
    }

    SaveBedExchangeTransaction(): void {
        if (this.SelectedDesiredBed && this.SelectedDesiredBed.IsReserved) {
            this._msgBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`Bed is already Reserved by someone, Release the bed to perform Exchange`]);
            return;
        }

        if (this.SelectedDesiredBed && this.SelectedDesiredBed.IsOccupied) {
            this._msgBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`Bed is Occupied by ${this.BedOccupyingPatient.PatientName}, Release the bed to perform Exchange`]);
            return;
        }

        const adtExchangeBed = new AdtExchangeBed_DTO();
        adtExchangeBed.BedFeatureId = this.SelectedPatient.BedFeatureId;
        adtExchangeBed.WardId = this.SelectedPatient.WardId;
        adtExchangeBed.CurrentBedId = this.CurrentBedInformation.BedId;
        adtExchangeBed.DesiredBedId = this.DesiredBedInformation.BedId;
        adtExchangeBed.IsDesiredBedOccupied = this.SelectedDesiredBed.IsOccupied;
        adtExchangeBed.IsDesiredBedReserved = this.SelectedDesiredBed.IsReserved;
        adtExchangeBed.PatientId = this.SelectedPatient.PatientId;
        adtExchangeBed.PatientVisitId = this.SelectedPatient.PatientVisitId;
        adtExchangeBed.BedOccupiedByPatientId = this.BedOccupyingPatient.PatientId;
        adtExchangeBed.BedOccupiedByPatientVisitId = this.BedOccupyingPatient.PatientVisitId;

        if (this.CheckValidations(adtExchangeBed)) {
            this._adtBlService.ExchangeBed(adtExchangeBed).subscribe((res: DanpheHTTPResponse) => {
                if (res.Status === ENUM_DanpheHTTPResponses.OK && res.Results) {
                    this.ResetExchangeBedPage();
                    this._msgBoxService.showMessage(ENUM_MessageBox_Status.Success, ['Bed Exchanged Successful!']);
                } else {
                    this._msgBoxService.showMessage(ENUM_MessageBox_Status.Failed, ["Something went wrong while Exchanging Bed"]);
                }
            }, err => {
                console.log(err);
                this._msgBoxService.showMessage(ENUM_MessageBox_Status.Error, ["Something went wrong while Exchanging Bed"]);

            });
        } else {
            this._msgBoxService.showMessage(ENUM_MessageBox_Status.Failed, ["Exchange Rule is not satisfied!"]);
        }

    }

    CheckValidations(adtBedExchange: AdtExchangeBed_DTO): boolean {
        if (adtBedExchange) {
            if (!adtBedExchange.BedFeatureId || !adtBedExchange.CurrentBedId || !adtBedExchange.DesiredBedId || !adtBedExchange.PatientId || !adtBedExchange.PatientVisitId || !adtBedExchange.WardId) {
                return false;
            } else {
                return true;
            }
        } else {
            return false;
        }
    }
    DiscardBedExchangeTransaction(): void {
        this.ResetExchangeBedPage();
    }

    ResetExchangeBedPage(): void {
        this.SelectedPatient = null;
        this.DesiredBedInformation = {
            WardName: "",
            BedFeatureName: "",
            BedCode: "",
            BedNumber: "",
            BedId: 0,
            IsAvailable: false
        }
        this.CurrentBedInformation = {
            WardName: "",
            BedFeatureName: "",
            BedCode: "",
            BedNumber: "",
            BedId: 0,
            IsAvailable: false
        }
        this.BedOccupyingPatient = {
            PatientId: 0,
            PatientVisitId: 0,
            PatientName: ""
        };

        this.AllBedsByBedFeature = new Array<Bed>();
    }
}