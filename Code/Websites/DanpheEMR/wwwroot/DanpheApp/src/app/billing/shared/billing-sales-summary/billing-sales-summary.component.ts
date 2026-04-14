import { Component, Input, OnInit } from '@angular/core';
import { Visit } from '../../../appointments/shared/visit.model';
import { Patient } from '../../../patients/shared/patient.model';
import { DanpheHTTPResponse } from '../../../shared/common-models';
import { MessageboxService } from '../../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponseText, ENUM_MessageBox_Status, ENUM_ServiceBillingContext } from '../../../shared/shared-enums';
import { BillingBLService } from '../billing.bl.service';
import { BillingService } from '../billing.service';
import { BillingSalesSummaryReportDto } from '../dto/bill-sales-summary.dto';

@Component({
  selector: 'billing-sales-summary',
  templateUrl: './billing-sales-summary.component.html',
  styleUrls: ['./billing-sales-summary.component.css']
})
export class BillingSalesSummaryComponent implements OnInit {
  @Input("patient")
  SelectedPatient: Patient;
  PatientVisits = new Array<Visit>();
  SelectedVisitId: number = 0;
  SelectedSchemePriceCategory: SchemePriceCategoryCustomType = { SchemeId: null, PriceCategoryId: null };
  SelectedBillingType: string = "all";
  BillingSalesSummaryList: BillingSalesSummaryReportDto[] = [];

  ServiceBillingContext: string = ENUM_ServiceBillingContext.OpBilling;
  ShowSchemeFilter: boolean = false;
  IsDataLoaded: boolean = false;

  ShowBillingSalesSummaryPrintPage: boolean = false;

  constructor(
    private _billingBLService: BillingBLService,
    private _messageBoxService: MessageboxService,
    private _billingService: BillingService) {
  }

  ngOnInit() {
    if (this.SelectedPatient && this.SelectedPatient.PatientId) {
      this.GetPatientVisits();
    }
  }
  GetPatientVisits() {
    this._billingBLService.GetPatientVisits(this.SelectedPatient.PatientId)
      .subscribe(
        (res: DanpheHTTPResponse) => {
          if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
            this.PatientVisits = res.Results;
            if (!this.PatientVisits || this.PatientVisits.length === 0) {
              this._messageBoxService.showMessage[ENUM_MessageBox_Status.Notice, "No Visits found for the selected Patient."];
            }
          }
          else {
            this._messageBoxService.showMessage[ENUM_MessageBox_Status.Failed, "Failed to get Visits for Selected Patient."]
          }
        },
        (error) => {
          console.error("Error in Getting Patient Visits:", error);
          this._messageBoxService.showMessage[ENUM_MessageBox_Status.Failed, "An error occurred while fetching patient visits. Please check log for details."];
        }
      );
  }

  OnSchemeChanged($event) {
    if ($event && $event.SchemeId && this.ShowSchemeFilter) {
      this.SelectedSchemePriceCategory.SchemeId = $event.SchemeId;
    }
    else {
      this.SelectedSchemePriceCategory.SchemeId = null;
    }
  }
  OnPriceCategoryChange($event) {
    if ($event && $event.PriceCategoryId) {
      this.SelectedSchemePriceCategory.PriceCategoryId = $event.PriceCategoryId;
    }
  }
  LoadBillingSalesReport() {
    this._billingBLService.GetBillingSalesSummaryReport(this.SelectedPatient.PatientId, this.SelectedVisitId, this.SelectedBillingType, this.SelectedSchemePriceCategory.SchemeId, this.SelectedSchemePriceCategory.PriceCategoryId).subscribe(
      (res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
          this.BillingSalesSummaryList = res.Results;
          this.IsDataLoaded = true;

        }
        else {
          this._messageBoxService.showMessage[ENUM_MessageBox_Status.Failed, "Failed to get summary report."];
          this.IsDataLoaded = false;

        }
        (error) => {
          console.error("Error occurred while loading the sales summary report:", error);
          this._messageBoxService.showMessage[ENUM_MessageBox_Status.Failed, "An error occurred while loading the sales summary report. Please check for logs."];
        }
      })
  }
  OnShowSchemeFilter() {
    this.ShowSchemeFilter = !this.ShowSchemeFilter;
    if (this.ShowSchemeFilter) {
      this._billingService.TriggerBillingServiceContextEvent(this.ServiceBillingContext);
    }
    else {
      this.SelectedSchemePriceCategory.SchemeId = null;
      this.SelectedSchemePriceCategory.PriceCategoryId = null;
    }
  }

  PrintBillingSalesSummary() {
    this.ShowBillingSalesSummaryPrintPage = true;
  }

  public HidePrintBillingSalesSummary() {
    this.ShowBillingSalesSummaryPrintPage = false;
    this.LoadBillingSalesReport();
  }



}
