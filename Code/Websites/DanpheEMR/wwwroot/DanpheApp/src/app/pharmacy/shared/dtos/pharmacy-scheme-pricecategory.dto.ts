import { ENUM_BillPaymentMode } from "../../../shared/shared-enums";
import { IPharmacySchemeCreditLimit } from "../interfaces/pharmacy-credit-limit.interface";

export class PharmacySchemePriceCategory_DTO {

    public ServiceBillingContext: string = "";
    public SchemeId: number = 0;
    public SchemeName: string = "";
    public PriceCategoryId: number = 0;
    public CreditLimitObj: IPharmacySchemeCreditLimit = {
        OpCreditLimit: 0,
        IpCreditLimit: 0,
        GeneralCreditLimit: 0
    };
    public IsDiscountApplicable: boolean = false;
    public DiscountPercent: number = 0;
    public IsDiscountEditable: boolean = false;
    public IsCreditApplicable: boolean = false;
    public IsCreditOnlyScheme: boolean = false;
    public DefaultCreditOrganizationId: number = 0;
    public DefaultPaymentMode: string = ENUM_BillPaymentMode.cash;
    public IsCoPayment: boolean = false;
    public IsValid: boolean = true;
    public ValidationMessage: Array<string> = [];//make this as Object which can pass array of messages.
    public ClaimCode: number = null;
    public IsPharmacyRateDifferent: boolean = false;
    public CoPaymentCashPercent: number = 0;
    public CoPaymentCreditPercent: number = 0;
    public IsSystemDefault: boolean = false;
    public AllowProvisionalBilling: boolean = false;
    public DefaultPriceCategoryId: number = 0;
    public SchemeApiIntegrationName: string = '';
    public IsGeneralCreditLimited: boolean = false;
    public IsCreditLimited: boolean = false;
    public IsPharmacyCappingApplicable: boolean = false;
    public IsPharmacySalePriceEditable: boolean = false;
    public UseCappingAPI: boolean = false;

}