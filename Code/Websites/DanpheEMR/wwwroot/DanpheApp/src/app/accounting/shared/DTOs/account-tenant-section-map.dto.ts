import { SectionModel } from "../../settings/shared/section.model";

export class AccountTenantSectionMap_DTO {
    public HospitalName: string = "";
    public HospitalShortCode: string = "";
    public SectionName: string = "";
    public SectionCode: string = "";
    public IsActive: boolean = true;
}

export class AccountTenantMapWrapper_DTO {
    public Maps: Array<AccountTenantSectionMap_DTO> = new Array<AccountTenantSectionMap_DTO>();
    public SectionList: Array<SectionModel> = new Array<SectionModel>();
}

export class AddAccountTenantPost_DTO {
    public HospitalName: string = "";
    public HospitalShortCode: string = "";
    public SectionIds: string = "";
}