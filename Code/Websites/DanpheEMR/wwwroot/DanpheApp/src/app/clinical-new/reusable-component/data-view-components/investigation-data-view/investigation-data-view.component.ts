import { Component, OnInit } from "@angular/core";
import { ServiceItemDetails_DTO } from "../../../../billing/shared/dto/service-item-details.dto";
import { ClinicalPatientService } from "../../../../clinical-new/shared/clinical-patient.service";
import { CoreService } from "../../../../core/shared/core.service";
import { SecurityService } from "../../../../security/shared/security.service";
import { DanpheHTTPResponse } from "../../../../shared/common-models";
import { MessageboxService } from "../../../../shared/messagebox/messagebox.service";
import { ENUM_DanpheHTTPResponses, ENUM_Genders, ENUM_InvestigationLAB_ValueType, ENUM_MessageBox_Status, ENUM_OrderStatus, ENUM_ServiceBillingContext } from "../../../../shared/shared-enums";
import { ClinicalNoteBLService } from "../../../shared/clinical.bl.service";
import { Field } from "../../../shared/dto/field.dto";
import { Imaging_DTO } from "../../../shared/dto/imaging.dto";
import { GroupedLabTestItemDTO, LabTestResult_DTO } from "../../../shared/dto/lab-test-result.dto";
import { PatientDetails_DTO } from "../../../shared/dto/patient-cln-detail.dto";
import { Requested_Item_DTO } from "../../../shared/dto/requested-items.dto";

@Component({
  selector: 'investigation-data-view',
  templateUrl: './investigation-data-view.component.html'
})
export class InvestigationMainDataViewComponent implements OnInit {
  Field: Field;
  IsAcrossVisitAvailability: boolean = false;
  SearchString: string = null;
  SelectedPatient = new PatientDetails_DTO();
  ServiceItems = new Array<ServiceItemDetails_DTO>();
  PriceCategoryId: number = 0;
  SchemeId: number = 0;
  SchemePriceCategory = { SchemeId: null, PriceCategoryId: null };
  CounterId: number = null;
  LabTestItems: LabTestResult_DTO[];
  RequestedImagingItems: Array<Imaging_DTO> = new Array<Imaging_DTO>();
  RequestedTestItems: Array<Requested_Item_DTO> = new Array<Requested_Item_DTO>();
  BillingType: string = "";
  GroupedLabTest: GroupedLabTestItemDTO[] = [];

  SearchTerm: string = '';

  constructor(

    private _securityService: SecurityService,
    private _msgBoxServ: MessageboxService,

    private _clinicalBlservice: ClinicalNoteBLService,
    private _coreService: CoreService,
    private _selectedPatientService: ClinicalPatientService,


  ) {

  }


  ngOnInit() {

    if (this.Field) {
      this.IsAcrossVisitAvailability = this.Field.IsAcrossVisitAvailability;
    } else {
      this.IsAcrossVisitAvailability = false;
    }
    if (this.Field && this.Field.FieldConfig && this.Field.FieldConfig.PreTemplatePatientDetail) {
      this.SelectedPatient = this.Field.FieldConfig.PreTemplatePatientDetail;
    }
    this.CounterId = this._securityService.getLoggedInCounter().CounterId;
    if (this.SelectedPatient && this.SelectedPatient.PatientId) {
      this.SchemeId = this.SelectedPatient.SchemeId;
      this.PriceCategoryId = this.SelectedPatient.PriceCategoryId;
      this.SchemePriceCategory.SchemeId = this.SelectedPatient.SchemeId;
      this.SchemePriceCategory.PriceCategoryId = this.SelectedPatient.PriceCategoryId;
      this.getLabItems(this.SelectedPatient.PatientId, this.SelectedPatient.PatientVisitId, this.IsAcrossVisitAvailability);
      this.getRequestedItems(this.SelectedPatient.PatientId, this.SelectedPatient.PatientVisitId, this.IsAcrossVisitAvailability);
      this.getRequestedImagingItems(this.SelectedPatient.PatientId, this.SelectedPatient.PatientVisitId, this.IsAcrossVisitAvailability);
      this.GetServiceItemsBySchemeIdAndPriceCategoryId(ENUM_ServiceBillingContext.OpBilling, this.SchemeId, this.PriceCategoryId);
    }
    else {
      this.LabTestItems = null;
      this.RequestedTestItems = null;
      this.RequestedImagingItems = null;
    }
  }
  MapLabTestItemToGroup(item: LabTestResult_DTO): GroupedLabTestItemDTO {
    return {
      Category: item.TestCategoryName,
      Items: [item]
    };
  }

  GetServiceItemsBySchemeIdAndPriceCategoryId(serviceBillingContext: string, SchemeId: number, PriceCategoryId: number): void {
    this._clinicalBlservice.GetServiceItems(serviceBillingContext, SchemeId, PriceCategoryId)
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK && res.Results) {
          this.ServiceItems = res.Results;
        }
      },
        err => {
          console.log(err);
        }
      );
  }
  getLabItems(PatientId: number, PatientVisitId: number, IsAcrossVisitAvailability: boolean) {
    this._clinicalBlservice.GetLabItems(PatientId, PatientVisitId, IsAcrossVisitAvailability)
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK && res.Results) {
          this.LabTestItems = res.Results.map(item => {
            item['ReferenceRange'] = this.GetReferenceRange(item);
            return item;
          });
          let groupedLabTestItems = this.GroupLabTestItemsByCategory(this.LabTestItems);
          this.GroupedLabTest = Array.from(groupedLabTestItems.entries()).map(([Category, Items]) => ({ Category, Items })) as Array<GroupedLabTestItemDTO>;
        }
      },
        err => {
          console.log(err);
        }
      );
  }
  GetReferenceRange(item: LabTestResult_DTO): string {
    let age = this._coreService.CalculateAge(this._selectedPatientService.SelectedPatient.DateOfBirth);
    let formattedAge = parseInt(age.replace(/\D/g, ''), 10) || 0;
    const gender = this._selectedPatientService.SelectedPatient.Gender.toLowerCase();
    if (item.ValueType === ENUM_InvestigationLAB_ValueType.number) {
      if (formattedAge < 16) {
        return item.ChildRange || item.Range;
      } else {
        if (gender === ENUM_Genders.Male) {
          return item.MaleRange || item.Range;
        } else if (gender === ENUM_Genders.Female) {
          return item.FemaleRange || item.Range;
        } else {
          return item.Range;
        }
      }
    }
    else if (item.ValueType === ENUM_InvestigationLAB_ValueType.text) {
      return item.RangeDescription;
    }
    return '';
  }






  GroupLabTestItemsByCategory(labTestItems: LabTestResult_DTO[]): Map<string, LabTestResult_DTO[]> {
    let grouped = new Map<string, LabTestResult_DTO[]>();
    labTestItems.forEach(item => {
      let category = item.TestCategoryName;
      if (!grouped.has(category)) {
        grouped.set(category, []);
      }
      grouped.get(category).push(item);
    });
    return grouped;
  }
  getRequestedImagingItems(PatientId: number, PatientVisitId: number, IsAcrossVisitAvailability: boolean) {
    this._clinicalBlservice.GetRequestedImagingItems(PatientId, PatientVisitId, IsAcrossVisitAvailability)
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK && res.Results) {
          this.RequestedImagingItems = res.Results;
          this.RequestedImagingItems = this.RequestedImagingItems.filter(item => item.OrderStatus === ENUM_OrderStatus.Final);
        }
        else {
          this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ['Unable To get ImagingItems']);
        }
      },
        (err) => {
          this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, [`Unable To Get  ImagingItems Please Check The Console.`]);
          console.log(err);
        }
      );
  }
  getRequestedItems(PatientId: number, PatientVisitId: number, IsAcrossVisitAvailability: boolean) {
    this._clinicalBlservice.GetRequestedLabItems(PatientId, PatientVisitId, IsAcrossVisitAvailability)
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK && res.Results) {
          this.RequestedTestItems = res.Results;
        }
      },
        err => {
          console.log(err);
        }
      );
  }

}
