import { ClaimSubmitRequest } from "../../../insurance/nep-gov/shared/ins-claim.model";
import { UploadedFile } from "../../../shared/DTOs/uploaded-files-DTO";
import { InsurancePendingClaim } from "./ClaimManagement_PendingClaims_DTO";

export class SubmittedClaimDTO {
    public claim: InsurancePendingClaim = new InsurancePendingClaim();
    public files: Array<UploadedFile> = new Array<UploadedFile>();
    public HIBClaimSubmitPayload: ClaimSubmitRequest = new ClaimSubmitRequest();
}