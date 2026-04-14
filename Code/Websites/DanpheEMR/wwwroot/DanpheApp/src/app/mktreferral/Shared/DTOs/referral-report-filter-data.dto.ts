import { ReferringOrganization_DTO } from "./referral-organization.dto";
import { ReferralPartyGroup_DTO } from "./referral-party-group.dto";

export class ReferralReportsFilterData_DTO {
    public ReferringPartyGroup = new Array<ReferralPartyGroup_DTO>();
    public ReferringOrganizations = new Array<ReferringOrganization_DTO>();
}