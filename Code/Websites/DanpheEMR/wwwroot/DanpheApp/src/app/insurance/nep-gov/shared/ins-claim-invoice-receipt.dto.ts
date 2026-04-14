import { InsurancePendingClaim } from "../../../claim-management/shared/DTOs/ClaimManagement_PendingClaims_DTO";
import { INSClaimableBillingInvoiceItems } from "./ins-claim-bill-invoice-item.dto";
import { INSClaimableBillingInvoiceInfo_DTO, INSClaimablePharmacyInvoiceInfo_DTO } from "./ins-claim-invoice-info.dto";
import { INSClaimablePharmacyInvoiceItems } from "./ins-claim-phrm-invoice-item.dto";


export class INSClaimBillingInvoiceReceipt_DTO {
    InvoiceInfo: INSClaimableBillingInvoiceInfo_DTO = new INSClaimableBillingInvoiceInfo_DTO();
    InvoiceItems: INSClaimableBillingInvoiceItems[] = [];
    public PatientInfo: InsurancePendingClaim = new InsurancePendingClaim();
}

export class INSClaimPharmacyInvoiceReceipt_DTO {
    PatientInfo: InsurancePendingClaim = new InsurancePendingClaim();
    InvoiceInfo: INSClaimablePharmacyInvoiceInfo_DTO = new INSClaimablePharmacyInvoiceInfo_DTO();
    InvoiceItems: INSClaimablePharmacyInvoiceItems[] = []
}