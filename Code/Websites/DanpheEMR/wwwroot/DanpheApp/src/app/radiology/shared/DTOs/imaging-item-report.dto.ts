import { FooterTextsList_Dto } from "./footer-text-list.dto";

export class ImagingItemReportDTO {
    PatientId: number = 0;
    ReportTemplateId: number = null;
    TemplateName: string = null;
    ImagingReportId: number = 0;
    ImagingRequisitionId: number = 0;
    ImagingItemName: string = '';
    ImagingTypeName: string = '';
    CreatedOn: string = null; // ISO date string
    BillingDate: string = null; // Nullable date
    ReportText: string = null;
    ImageName: string = null;
    PhoneNumber: string = '';
    PatientCode: string = '';
    PatientName: string = '';
    Address: string = '';
    Signatories: string = null;
    DateOfBirth: string = null; // ISO date string
    ScannedOn: string = null; // Nullable date
    Gender: string = '';
    PatientStudyId: string = null;
    PrescriberName: string = '';
    Muncipality: string = null;
    CountrySubDivision: string = null;
    PrescriberId: number = null;
    PerformerId: number = null;
    PerformerName: string = '';
    ReferredById: number = null;
    ReferredByName: string = null;
    Indication: string = null;
    RadiologyNo: string = null;
    SignatoryImageBase64: string = null;
    FooterText: string = null;
    currentLoggedInUserSignature: string = null;
    HasInsurance: boolean = false;
    IsActive: boolean = true;
    PatientNameLocal: string = null;
    PrintCount: number = 0;
    PatientFileId: number = 0;
    ReportTemplateIdsCSV: string = null;
    FooterTextsList: FooterTextsList_Dto[] = [];
    Age: string = null;
    ReportingDoctorNamesFromSignatories: string = null;
    ReportingDoctorId: number = null;
    PatientVisitId: number = 0;
    ProviderNameInBilling: string = null;
    ProviderName: string = null;
    PerformerNameInBilling: string = null;
    PerformerIdInBilling: any;
    ImageFullPath: string = "";
    SelectedFooterTemplateId: number = 0;

}
