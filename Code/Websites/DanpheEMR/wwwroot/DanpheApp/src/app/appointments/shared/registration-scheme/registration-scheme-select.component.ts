import { Component, EventEmitter, Input, Output } from "@angular/core";
import * as moment from "moment";
import { Subject, Subscription } from "rxjs-compat";
import { BillingService } from "../../../billing/shared/billing.service";
import { BillingSubScheme_DTO } from "../../../billing/shared/dto/bill-subscheme.dto";
import { PatientScheme_DTO } from "../../../billing/shared/dto/patient-scheme.dto";
import { RegistrationScheme_DTO } from "../../../billing/shared/dto/registration-scheme.dto";
import { SchemeParameters } from "../../../billing/shared/scheme-parameter.model";
import { CoreService } from "../../../core/shared/core.service";
import { Eligibility, GovInsurancePatientVM } from "../../../insurance/nep-gov/shared/gov-ins-patient.view-model";
import { Extension, GetPatientDetailsAndEligibilityApiResponse } from "../../../insurance/nep-gov/shared/hib-api-response.interface";
import { GovInsuranceBlService } from "../../../insurance/nep-gov/shared/insurance.bl.service";
import { SSFEligibility, SSFSchemeTypeSubProduct, SsfEmployerCompany } from "../../../insurance/ssf/shared/SSF-Models";
import { SsfDataStatus_DTO, SsfService } from "../../../insurance/ssf/shared/service/ssf.service";
import { BillingScheme_DTO } from "../../../settings-new/billing/shared/dto/billing-scheme.dto";
import { PriceCategory } from "../../../settings-new/shared/price.category.model";
import { DanpheHTTPResponse } from "../../../shared/common-models";
import { DanpheCache, MasterType } from "../../../shared/danphe-cache-service-utility/cache-services";
import { MessageboxService } from "../../../shared/messagebox/messagebox.service";
import { ENUM_AddressType, ENUM_DanpheHTTPResponseText, ENUM_DanpheHTTPResponses, ENUM_DanpheSSFSchemes, ENUM_InsuranceIdentifierWithSBCode, ENUM_MessageBox_Status, ENUM_SSFSchemeTypeSubProduct, ENUM_SSF_EligibilityType, ENUM_Scheme_ApiIntegrationNames, ENUM_ServiceBillingContext } from "../../../shared/shared-enums";
import { NewClaimCode_DTO } from "../dto/new-claim-code.dto";
import { PatientMemberInfo_DTO } from "../dto/patient-member-info.dto";
import { MedicareMemberVsMedicareBalanceVM } from "../medicare-model";
import { VisitBLService } from "../visit.bl.service";

@Component({
  selector: "registration-scheme-select",
  templateUrl: "./registration-scheme-select.component.html"
})
export class RegistrationSchemeSelectComponent {

  public currentRegSchemeDto: RegistrationScheme_DTO = new RegistrationScheme_DTO();
  public currentSchemeParams: SchemeParameters = new SchemeParameters();

  public IsPatientMembershipInfoLoaded: boolean = false;
  public SsfEmployer: Array<SsfEmployerCompany> = new Array<SsfEmployerCompany>();
  public SelectedSsfEmployer: SsfEmployerCompany = new SsfEmployerCompany();


  @Input("patient-id")
  currentPatientId: number = 0;

  @Input("selected-scheme-priceCategory")
  selectedSchemePriceCategory: SchemePriceCategoryCustomType = { SchemeId: 0, PriceCategoryId: 0 };

  @Input("service-billing-context")
  public serviceBillingContext: string = ENUM_ServiceBillingContext.OpBilling;

  @Input("policy-no")
  public policyNo: string = "";

  @Output("on-change")
  public regSchemeChangeEmitter: EventEmitter<RegistrationScheme_DTO> = new EventEmitter<RegistrationScheme_DTO>();

  public ssfSubscription: Subscription = new Subscription();
  public NSHISubscription: Subscription = new Subscription();

  public currentSchemeId: number = 0;
  public old_SchemeId: number = 0;
  public new_SchemeId: number = 0; //We need these to Check when SchemeChangeEvent is Fired.

  public currentPriceCategoryId: number = 0;
  public old_PriceCategoryId: number = 0;
  public new_PriceCategoryId: number = 0; //We need these to Check when PriceCategoryChangeEvent from Scheme.
  public patientMemberInfo = new PatientMemberInfo_DTO();
  public NewClaimCodeObj = new NewClaimCode_DTO();
  public BillingSubSchemes = new Array<BillingSubScheme_DTO>();
  public SelectedSubScheme = new BillingSubScheme_DTO();
  public DisplaySubSchemeSelection: boolean = false;
  public loading: boolean = false;
  public IsClaimSuccessful: boolean = false;
  public IsSsfEmployerAssigned: boolean = false;
  public FetchSsfDetailLocally: boolean = false;
  public PatientImage: string = null;
  public DisplayMembershipLoadButton: boolean = false;
  public insPatient: GovInsurancePatientVM = new GovInsurancePatientVM();
  public insurancePatientInfo: GetPatientDetailsAndEligibilityApiResponse;
  public IsHIBApiIntegrated: boolean = false;
  public Country_All: any = null;
  public insProviderList: Array<any> = [];
  public LoadFromHIBServer: boolean = false;
  public IsNSHIParameterEnabled: boolean = false;
  public eligibility: Eligibility = new Eligibility();
  public NSHISubject: Subject<GovInsurancePatientVM> = new Subject<GovInsurancePatientVM>();
  public SchemeTypeSubProduct = new Array<SSFSchemeTypeSubProduct>();
  public SelectedSubProduct: string = "";
  IsClaimSubmitted: boolean = false;
  CopaymentSetting: CopaymentSettings = new CopaymentSettings();
  constructor(public visitBlService: VisitBLService, public msgBoxService: MessageboxService, public ssfService: SsfService, public coreService: CoreService, public billingService: BillingService, public insuranceBLService: GovInsuranceBlService) {
    //this.currentRegSchemeDto.SchemeId = 4;//this is default-hardcoded.. need to change this soon..
    this.GetSsfDataAsObservable();
    this.GetNSHIDataAsObservable();
    this.GetInsuranceProviderList();
    this.GetHIBIntegrationParameter();
    this.GetInsCopaymentConfigurationParameter();
    this.Country_All = DanpheCache.GetData(MasterType.Country, null);
  }

  ngOnChanges() {
    this.billingService.TriggerBillingServiceContextEvent(this.serviceBillingContext);
  }

  ngOnInit() {
    this.currentRegSchemeDto.SchemeId = this.selectedSchemePriceCategory.SchemeId;
    this.currentRegSchemeDto.PriceCategoryId = this.selectedSchemePriceCategory.PriceCategoryId;

    this.GetSchemeTypeSubProduct();

  }
  GetSchemeTypeSubProduct() {
    let arrayOfSSFSchemeSubProduct = Object.keys(ENUM_SSFSchemeTypeSubProduct).map((name) => {
      return {
        name,
        value: ENUM_SSFSchemeTypeSubProduct[name as keyof typeof ENUM_SSFSchemeTypeSubProduct],
      };
    });

    arrayOfSSFSchemeSubProduct = arrayOfSSFSchemeSubProduct.filter(a => isNaN(+(a.name)) === true);

    this.SchemeTypeSubProduct = arrayOfSSFSchemeSubProduct;
  }

  selectSSFSchemeTypeSubProduct($event): void {
    if ($event) {
      const subProduct = $event.target.value;
      this.SelectedSubProduct = subProduct;
      this.currentRegSchemeDto.PatientScheme.OtherInfo = this.SelectedSubProduct;
      this.CheckValidationAndEmit();
    }
  }

  OnSchemeChanged(scheme: BillingScheme_DTO) {
    if (scheme) {
      this.ResetCurrentSchemeObj();
      this.currentRegSchemeDto.MemberNo = null;
      this.currentRegSchemeDto.HasSubScheme = scheme.HasSubScheme;
      this.DisplaySubSchemeSelection = scheme.HasSubScheme;
      this.BillingSubSchemes = scheme.SubSchemes;
      this.currentRegSchemeDto.SubSchemes = scheme.SubSchemes;
      this.old_SchemeId = this.currentRegSchemeDto.SchemeId;
      this.new_SchemeId = scheme.SchemeId;

      if (scheme.IsClaimCodeAutoGenerate) {
        const param = this.coreService.Parameters.find(a => a.ParameterGroupName === 'Insurance' && a.ParameterName === 'ClaimCodeAutoGenerateSettings');
        if (param) {
          const paramValue = JSON.parse(param.ParameterValue);
          const schemeId = paramValue ? paramValue.SchemeId : null;
          if (schemeId === scheme.SchemeId && paramValue.EnableAutoGenerate) {
            this.GetLatestClaimCode(scheme.DefaultCreditOrganizationId);
          }
        }
      }
      if (this.old_SchemeId !== this.new_SchemeId) {
        this.old_PriceCategoryId = this.currentRegSchemeDto.PriceCategoryId;
        this.new_PriceCategoryId = scheme.DefaultPriceCategoryId;
        if (this.old_PriceCategoryId && this.old_PriceCategoryId !== this.new_PriceCategoryId) {

          alert("This will change Price Category as well");
          //Scheme Initialization will again be called from PriceCategoryChanges.. So no need to call here..
          // this.currentPriceCategoryId = this.new_PriceCategoryId;
          this.currentRegSchemeDto.PriceCategoryId = this.new_PriceCategoryId;
          this.selectedSchemePriceCategory.PriceCategoryId = this.new_PriceCategoryId;
          this.new_PriceCategoryId = this.old_PriceCategoryId;
          this.AssignSchemeParametersToCurrentContext(scheme);
          this.AssignSelectedSchemePropertiesToCurrentContext(scheme);

        }
        else {
          this.InitializeNewSchemeSelection(scheme);
        }
      }
      else {
        this.InitializeNewSchemeSelection(scheme);
      }
      if (scheme && scheme.ApiIntegrationName === null || (scheme.ApiIntegrationName && (scheme.ApiIntegrationName !== ENUM_Scheme_ApiIntegrationNames.SSF && scheme.ApiIntegrationName !== ENUM_Scheme_ApiIntegrationNames.Medicare))) {
        this.LoadMemberInformationByScheme(scheme.SchemeId, this.currentPatientId);
      }
      if (scheme && scheme.ApiIntegrationName === ENUM_Scheme_ApiIntegrationNames.SSF) {
        if (this.currentPatientId) {
          this.FetchSsfDetailLocally = true;
          this.DisplayMembershipLoadButton = true;
          this.IsNSHIParameterEnabled = false;
          this.loadFromSSFServer = true;
          this.currentRegSchemeDto.MemberNo = this.policyNo;
          this.LoadSSFPatientInformation();
        } else {
          this.IsClaimSuccessful = true;
        }
      }
      if (scheme && scheme.ApiIntegrationName === ENUM_Scheme_ApiIntegrationNames.NGHIS) {
        if (this.IsHIBApiIntegrated) {
          this.IsNSHIParameterEnabled = true;
        }
        else {
          this.msgBoxService.showMessage(ENUM_MessageBox_Status.Notice, ["Please Enable HIB Confifuration Parameter"]);
        }
      }
    }
  }

  GetLatestClaimCode(creditOrganizationId: number): void {
    this.visitBlService.GetLatestClaimCodeForAutoGeneratedClaimCodes(creditOrganizationId).subscribe((res: DanpheHTTPResponse) => {
      if (res.Status === ENUM_DanpheHTTPResponses.OK) {
        this.NewClaimCodeObj = res.Results;
        if (this.NewClaimCodeObj && !this.NewClaimCodeObj.IsMaxLimitReached) {
          this.currentRegSchemeDto.ClaimCode = this.NewClaimCodeObj.NewClaimCode;
        }
        if (this.NewClaimCodeObj && this.NewClaimCodeObj.IsMaxLimitReached) {
          this.msgBoxService.showMessage(ENUM_MessageBox_Status.Warning, ["ClaimCode reached Maximum limit"]);
        }
      } else {
        this.msgBoxService.showMessage(ENUM_MessageBox_Status.Failed, ["Couldn't generate ClaimCode."])
      }
    });
  }
  LoadMemberInformationByScheme(schemeId: number, currentPatientId: number): void {
    this.visitBlService.getMemberInfoByScheme(schemeId, currentPatientId).subscribe((res: DanpheHTTPResponse) => {
      if (res.Status === ENUM_DanpheHTTPResponses.OK) {
        this.patientMemberInfo = res.Results;
        if (this.patientMemberInfo) {
          this.currentRegSchemeDto.MemberNo = this.patientMemberInfo.MemberNo;
          if (!this.currentRegSchemeDto.IsClaimCodeAutoGenerate) {
            this.currentRegSchemeDto.ClaimCode = this.patientMemberInfo.LatestClaimCode;
          }
          if (this.currentRegSchemeDto.IsCreditLimited) {
            this.currentRegSchemeDto.CreditLimitObj.OpCreditLimit = this.patientMemberInfo.OpCreditLimit;
            this.currentRegSchemeDto.CreditLimitObj.IpCreditLimit = this.patientMemberInfo.IpCreditLimit;
          }
          if (this.currentRegSchemeDto.IsGeneralCreditLimited) {
            this.currentRegSchemeDto.CreditLimitObj.GeneralCreditLimit = this.patientMemberInfo.GeneralCreditLimit;
            this.currentRegSchemeDto.CreditLimitObj.OpCreditLimit = 0;
            this.currentRegSchemeDto.CreditLimitObj.IpCreditLimit = 0;
          }
          this.currentRegSchemeDto.PatientScheme = this.GetPatientSchemeForCurrentContext(this.patientMemberInfo);
        } else {
          if (this.currentRegSchemeDto.IsGeneralCreditLimited) {
            this.currentRegSchemeDto.PatientScheme.GeneralCreditLimit = this.currentRegSchemeDto.CreditLimitObj.GeneralCreditLimit;
          }
        }
        this.CheckAndProceedToEmit();
      }
    }, err => {
      console.log(err);
    });
  }

  ResetCurrentSchemeObj() {
    this.currentRegSchemeDto.MemberNo = null;
    this.currentRegSchemeDto.ClaimCode = null;
    this.currentRegSchemeDto.CreditLimitObj = {
      OpCreditLimit: 0,
      IpCreditLimit: 0,
      GeneralCreditLimit: 0
    }
  }
  InitializeNewSchemeSelection(scheme: BillingScheme_DTO) {
    this.currentRegSchemeDto = new RegistrationScheme_DTO();
    this.AssignSchemeParametersToCurrentContext(scheme);
    this.AssignSelectedSchemePropertiesToCurrentContext(scheme);
    this.LoadPatientExistingSchemeInfo(scheme);//required to Pre-Load MedicareInformation..
    this.CheckValidationAndEmit();
  }

  //Later this should use PriceCategoryDTO instead of using PriceCategoryModel
  OnPriceCategoryChange(priceCat: PriceCategory) {
    if (priceCat) {
      this.currentRegSchemeDto.PriceCategoryId = priceCat.PriceCategoryId;
    }

    this.CheckValidationAndEmit();
  }

  AssignSelectedSchemePropertiesToCurrentContext(schemeObj: BillingScheme_DTO) {
    if (schemeObj) {
      this.currentRegSchemeDto.SchemeId = schemeObj.SchemeId;
      this.currentRegSchemeDto.SchemeName = schemeObj.SchemeName;
      this.currentRegSchemeDto.IsCoPayment = schemeObj.IsCoPayment;
      this.currentRegSchemeDto.IsCreditApplicable = schemeObj.IsCreditApplicable;
      this.currentRegSchemeDto.IsCreditOnlyScheme = schemeObj.IsCreditOnlyScheme;
      this.currentRegSchemeDto.IsClaimCodeAutoGenerate = schemeObj.IsClaimCodeAutoGenerate;
      this.currentRegSchemeDto.IsDiscountApplicable = schemeObj.IsDiscountApplicable;
      this.currentRegSchemeDto.IsDiscountEditable = schemeObj.IsDiscountEditable;
      this.currentRegSchemeDto.SchemeApiIntegrationName = schemeObj.ApiIntegrationName;
      this.currentRegSchemeDto.DefaultCreditOrganizationId = schemeObj.DefaultCreditOrganizationId;
      this.currentRegSchemeDto.DefaultPaymentMode = schemeObj.DefaultPaymentMode;
      this.currentRegSchemeDto.PriceCategoryId = schemeObj.DefaultPriceCategoryId;
      this.currentRegSchemeDto.PriceCategoryName = schemeObj.DefaultPriceCategoryName;
      this.currentRegSchemeDto.IsCreditLimited = schemeObj.IsCreditLimited;
      this.currentRegSchemeDto.IsGeneralCreditLimited = schemeObj.IsGeneralCreditLimited;
      this.currentRegSchemeDto.IsMemberNumberCompulsory = schemeObj.IsMemberNumberCompulsory;
      this.currentRegSchemeDto.DiscountPercent = schemeObj.DiscountPercent;
      if (schemeObj.IsGeneralCreditLimited) {
        this.currentRegSchemeDto.CreditLimitObj.GeneralCreditLimit = schemeObj.GeneralCreditLimit;
      }
      this.currentRegSchemeDto.PatientScheme = new PatientScheme_DTO();
    }
  }

  AssignSchemeParametersToCurrentContext(scheme: BillingScheme_DTO) {
    this.currentSchemeParams = SchemeParameters.GetSchemeParamSettings(scheme.FieldSettingParamName);
  }

  LoadPatientExistingSchemeInfo(schemeObj: BillingScheme_DTO) {
    if (schemeObj && schemeObj.ApiIntegrationName == ENUM_Scheme_ApiIntegrationNames.Medicare) {
      this.LoadMedicarePatientInformation(this.currentPatientId);
    }
  }

  CheckAndProceedToEmit(): void {
    if (this.currentSchemeParams.EnterMemberNumber || this.currentSchemeParams.EnterClaimCode) {
      if (this.currentRegSchemeDto.MemberNo || this.currentRegSchemeDto.ClaimCode) {
        this.CheckValidationAndEmit();
      }
    }


  }
  OnMemberNumberChange() {
    console.log("Member number changed..");
    this.currentRegSchemeDto.PatientScheme.PolicyNo = this.currentRegSchemeDto.MemberNo;
    this.currentRegSchemeDto.PatientScheme.SchemeId = this.currentRegSchemeDto.SchemeId;
  }

  //! Krishna, 16thMarch'23, Below ids are hardcoded, if needed to change please look for them in html file of this component and change there as well.
  GoToNextElementFromMemberNoElement() {
    if (this.currentSchemeParams.ShowMembershipLoadButton) {
      this.SetFocusById('id_load_memberInfo');
    } else if (this.currentSchemeParams.EnterClaimCode) {
      this.SetFocusById('id_txt_claimCode');
    } else {
      this.SetFocusById('id_emit_button');
    }
  }

  //! Krishna, 16thMarch'23, Below ids are hardcoded, if needed to change please look for them in html file of this component and change there as well.
  GoToNextElementFromClaimCodeNoElement() {
    if (this.currentSchemeParams.ShowMembershipLoadButton) {
      this.SetFocusById('id_load_memberInfo');
    }
  }
  SetFocusById(id: string) {
    let Timer = setTimeout(() => {
      if (document.getElementById(id)) {
        let nextEl = <HTMLInputElement>document.getElementById(id);
        nextEl.focus();
        clearTimeout(Timer);
      }
    }, 100)
  }

  CheckValidationAndEmit() {

    // Validation check for compulsory MemberNo 
    if (this.currentRegSchemeDto.IsMemberNumberCompulsory) {
      const policyNo = this.currentRegSchemeDto.MemberNo;
      if (!policyNo || policyNo.trim() === "") {
        this.msgBoxService.showMessage(
          ENUM_MessageBox_Status.Warning,
          [`Member Number is required to register ${this.currentRegSchemeDto.SchemeName} Scheme's Patient!`]
        );
        return;
      }
    }
    //Assign default PatientScheme if it's empty in CurrentRegScheme Dto
    if (!this.currentRegSchemeDto.PatientScheme || !this.currentRegSchemeDto.PatientScheme.SchemeId) {
      this.currentRegSchemeDto.PatientScheme = new PatientScheme_DTO();
      this.currentRegSchemeDto.PatientScheme = this.GetPatientSchemeForCurrentContext_Common();
    }
    if (this.currentRegSchemeDto.SchemeId && this.currentRegSchemeDto.SchemeName) {
      this.regSchemeChangeEmitter.emit(this.currentRegSchemeDto);
    }
  }

  LoadMemberInformationClicked() {
    //Load MemberInformation from API as needed then Emit data ..
    console.log("LoadMemberInformationClicked..");
    this.loading = true;
    this.IsPatientMembershipInfoLoaded = false;//this will be set true from the respective APIs.
    if (this.currentRegSchemeDto.SchemeApiIntegrationName == ENUM_Scheme_ApiIntegrationNames.SSF) {
      this.LoadSSFPatientInformation();
    }
    //this.loading = false;
  }
  LoadMedicarePatientInformation(patientId: number): void {
    this.visitBlService.getMedicareMemberDetail(patientId).subscribe((res: DanpheHTTPResponse) => {
      if (res.Status === ENUM_DanpheHTTPResponses.OK) {
        console.log(res.Results);
        if (res.Results !== null) {
          const medicareMemberDetail: MedicareMemberVsMedicareBalanceVM = res.Results;
          this.currentRegSchemeDto.MemberNo = medicareMemberDetail.MemberNo;
          this.currentRegSchemeDto.CreditLimitObj.OpCreditLimit = medicareMemberDetail.OpBalance;
          this.currentRegSchemeDto.CreditLimitObj.IpCreditLimit = medicareMemberDetail.IpBalance;

          this.currentRegSchemeDto.IsValid = this.Medicare_IsEligibleForOpBilling(medicareMemberDetail);
          if (this.currentRegSchemeDto.IsValid) {
            this.currentRegSchemeDto.PatientScheme = this.Medicare_GetPatientSchemeForCurrentContext(medicareMemberDetail);
          }
          else {
            this.currentRegSchemeDto.ValidationMessage.push("Medicare balance Exceeded. Cannot Proceed for billing");
          }
          //!Krishna, To emit automatically if information is loaded.
          this.CheckValidationAndEmit();
        }
        else {
          console.log("Couldn't Find Medicare Member Detail of Current Patient.");
        }
      }
    }, err => {
      this.msgBoxService.showMessage(ENUM_DanpheHTTPResponses.Failed, ["Could not fetch the Medicare Member Detail"]);
    });
  }

  Medicare_IsEligibleForOpBilling(medicareMemberDetail: MedicareMemberVsMedicareBalanceVM): boolean {
    if (medicareMemberDetail && !medicareMemberDetail.IsOpLimitExceeded) {
      return true;
    }
    else {
      return false;
    }
  }

  Medicare_GetPatientSchemeForCurrentContext(medicareMemberDetail: MedicareMemberVsMedicareBalanceVM): PatientScheme_DTO {
    let retObj: PatientScheme_DTO = new PatientScheme_DTO();
    retObj.SchemeId = this.currentRegSchemeDto.SchemeId;
    retObj.PatientCode = medicareMemberDetail.HospitalNo;
    retObj.PatientId = medicareMemberDetail.PatientId;
    retObj.PolicyNo = medicareMemberDetail.MemberNo;
    retObj.OpCreditLimit = medicareMemberDetail.OpBalance;
    retObj.IpCreditLimit = medicareMemberDetail.IpBalance;

    return retObj;
  }

  GetPatientSchemeForCurrentContext(patientMemberInfo: PatientMemberInfo_DTO): PatientScheme_DTO {
    let retObj: PatientScheme_DTO = new PatientScheme_DTO();
    retObj.SchemeId = this.currentRegSchemeDto.SchemeId;
    retObj.PatientId = patientMemberInfo.PatientId;
    retObj.PolicyNo = patientMemberInfo.MemberNo;
    retObj.OpCreditLimit = patientMemberInfo.OpCreditLimit;
    retObj.IpCreditLimit = patientMemberInfo.IpCreditLimit;
    retObj.GeneralCreditLimit = patientMemberInfo.GeneralCreditLimit;
    retObj.PolicyHolderUID = this.insPatient.PolicyHolderUID;

    return retObj;
  }

  public loadFromSSFServer: boolean = false;
  LoadSSFPatientInformation() {

    if ((!this.currentPatientId || this.DisplayMembershipLoadButton) && this.loadFromSSFServer) {
      this.ssfService.GetSsfPatientDetailAndEligibilityFromSsfServer(this.currentRegSchemeDto.MemberNo, this.loadFromSSFServer);
    }
    else {
      this.DisplayMembershipLoadButton = false;
      this.currentRegSchemeDto.MemberNo = this.policyNo;
      this.ssfService.GetSsfPatientDetailAndEligibilityLocally(this.currentPatientId, this.currentRegSchemeDto.SchemeId);
    }
  }
  async LoadNGHISPatientInformation() {
    if (this.currentPatientId <= 0) {
      if ((this.IsNSHIParameterEnabled) && this.LoadFromHIBServer) {
        if (this.currentRegSchemeDto.MemberNo && this.currentRegSchemeDto.MemberNo.trim()) {

          this.insuranceBLService.GetPatientDetailsAndEligibilityFromHIBServer(this.currentRegSchemeDto.MemberNo).finally(() => this.loading = false).subscribe((res: DanpheHTTPResponse) => {
            if (res.Status === ENUM_DanpheHTTPResponses.OK) {
              this.TransformApiResponseDataToPatientObjet(res.Results);
            }
          });
        }
      }
    }
    if (this.currentPatientId > 0) {
      //const isClaimSubmitted = await this.CheckIfClaimSubmitted(this.currentRegSchemeDto.MemberNo);
      // if (isClaimSubmitted) {
      this.GetEligibilityFromAPI(this.currentRegSchemeDto.MemberNo);
      // } else {
      //  this.GetNHSIpatientInformationLocally(this.currentRegSchemeDto.SchemeId, this.currentPatientId);
      //}
    }
  }
  GetNHSIpatientInformationLocally(SchemeId: number, PatientId: number) {
    this.insuranceBLService.GetNHSIPatientDetailLocally(SchemeId, PatientId).subscribe((res: DanpheHTTPResponse) => {
      if (res.Status === ENUM_DanpheHTTPResponses.OK && res.Results) {
        this.insPatient = new GovInsurancePatientVM();
        this.insPatient.eligibilityInfo.AllowedMoney = res.Results.GeneralCreditLimit;
        this.insPatient.IsPatientInformationLoaded = true;
        this.insPatient.IsPatientEligibilityLoaded = true;
        this.currentRegSchemeDto.CreditLimitObj.GeneralCreditLimit = this.insPatient.eligibilityInfo.AllowedMoney;
        this.insPatient.eligibilityInfo.RegistrationCase = res.Results.RegistrationCase;
        this.insPatient.PolicyHolderUID = res.Results.PolicyHolderUID;
        this.insPatient.eligibilityInfo.CoPayCashPercent = res.Results.CoPayPercent;
        this.insPatient.eligibilityInfo.IsCoPayment = res.Results.CoPayPercent ? true : false;
        this.insPatient.Ins_FirstServicePoint = res.Results.Ins_FirstServicePoint;
        this.NSHISubject.next(this.insPatient);
      }
    });
  }
  GetEligibilityFromAPI(NSHI: string) {
    this.insuranceBLService.CheckEligibility(NSHI).subscribe((res: DanpheHTTPResponse) => {
      if (res.Status === ENUM_DanpheHTTPResponses.OK && res.Results) {
        this.insPatient = new GovInsurancePatientVM();
        let AllowedMoney = res.Results.insurance && res.Results.insurance[0] && res.Results.insurance[0].benefitBalance && res.Results.insurance[0].benefitBalance[0] && res.Results.insurance[0].benefitBalance[0].financial && res.Results.insurance[0].benefitBalance[0].financial[0] && res.Results.insurance[0].benefitBalance[0].financial[0].allowedMoney && res.Results.insurance[0].benefitBalance[0].financial[0].allowedMoney.value;
        this.insPatient.eligibilityInfo.AllowedMoney = AllowedMoney;
        this.insPatient.IsPatientInformationLoaded = true;
        this.insPatient.IsPatientEligibilityLoaded = true;
        this.currentRegSchemeDto.CreditLimitObj.GeneralCreditLimit = AllowedMoney;
        const extension: Extension = res.Results.insurance[0] && res.Results.insurance[0].extension;
        if (extension && extension.url === "https://hib.gov.np/fhir/FHIE+extension+Copayment") {
          this.insPatient.eligibilityInfo.CoPayCashPercent = extension.valueDecimal * 100;
          if (this.insPatient.eligibilityInfo.CoPayCashPercent) {
            this.insPatient.eligibilityInfo.IsCoPayment = true;
          }
          else {
            this.insPatient.eligibilityInfo.IsCoPayment = false;
          }

          if (this.CopaymentSetting && this.CopaymentSetting.IsEnabled && this.insPatient.eligibilityInfo.IsCoPayment) {
            this.insPatient.eligibilityInfo.CoPayCashPercent = this.CopaymentSetting.CoPaymentCashPercent;
          }
        }

        const externalExtensions: Extension[] = res.Results.extension;
        if (externalExtensions && externalExtensions.length) {
          let firstServicePointExtension = externalExtensions.find(e => e.url === "https://hib.gov.np/fhir/FHIE+extension+Profile+FSP");
          if (firstServicePointExtension) {
            this.insPatient.Ins_FirstServicePoint = firstServicePointExtension.valueString;
          }

          let imageURLExtension = externalExtensions.find(e => e.url === "https://hib.gov.np/fhir/FHIE+extension+Profile+Photo+Url");
          if (imageURLExtension) {
            this.insPatient.PatientImageURL = imageURLExtension.valueString;
            this.PatientImage = this.insPatient.PatientImageURL;
          }
          else {
            this.PatientImage = '';
          }
        }

        if (this.currentRegSchemeDto && this.currentRegSchemeDto.PatientScheme && (!this.currentRegSchemeDto.PatientScheme.PolicyHolderUID || this.currentRegSchemeDto.PatientScheme.PolicyHolderUID === null)) {
          this.insuranceBLService.GetPatientDetailsAndEligibilityFromHIBServer(this.currentRegSchemeDto.MemberNo).finally(() => this.loading = false).subscribe((res: DanpheHTTPResponse) => {
            if (res.Status === ENUM_DanpheHTTPResponses.OK && res.Results) {
              const patientResource = res.Results.PatientDetails.entry[0].resource;
              const policyHolderUID = patientResource.id;
              console.log(policyHolderUID);
              this.insPatient.PolicyHolderUID = policyHolderUID;
              this.currentRegSchemeDto.PatientScheme.PolicyHolderUID = policyHolderUID;
              this.currentRegSchemeDto.NSHIPatientDetail.PolicyHolderUID = policyHolderUID;
              console.log(this.insPatient);

              this.CheckAndProceedToEmit();
            }
          });
        }

        this.NSHISubject.next(this.insPatient);
      }
    });
  }
  async TransformApiResponseDataToPatientObjet(res: GetPatientDetailsAndEligibilityApiResponse): Promise<void> {
    if (!res.PatientDetails.entry || res.PatientDetails.entry.length === 0) {
      this.msgBoxService.showMessage(ENUM_MessageBox_Status.Failed, ['Failed to get Patient Information from Server.']);
      return;
    }
    const patientResource = res.PatientDetails.entry[0].resource;

    if (!patientResource.name || patientResource.name.length === 0) {
      this.msgBoxService.showMessage(ENUM_MessageBox_Status.Failed, ['Failed to get Patient Information from Server.']);
      return;
    }

    if (!res.EligibilityResponse && !res.EligibilityResponse.insurance) {
      this.msgBoxService.showMessage(ENUM_MessageBox_Status.Failed, ['This patient is not eligible. No balance information is available for this patient.']);
      return;
    }


    const FistNameAndMiddleName = patientResource.name && patientResource.name[0] && patientResource.name[0].given && patientResource.name[0].given[0].split(' ');
    const CapitalizedFistNameAndMiddleName = FistNameAndMiddleName.map(this.CapitalizeFirstLetter);
    this.insPatient.IsPatientInformationLoaded = true;
    this.insPatient.IsPatientEligibilityLoaded = true;

    this.insPatient.FirstName = CapitalizedFistNameAndMiddleName[0] ? CapitalizedFistNameAndMiddleName[0] : '';
    this.insPatient.MiddleName = CapitalizedFistNameAndMiddleName.slice(1).join(' ');

    const LastNames = patientResource.name && patientResource.name[0] && patientResource.name[0].family && patientResource.name[0].family.split(' ');
    const CapitalizedLastNames = LastNames.map(this.CapitalizeFirstLetter);

    this.insPatient.LastName = CapitalizedLastNames.join(' ');

    const physicalAddress = patientResource.address && patientResource.address.find(a => a.type === ENUM_AddressType.Physical);
    this.insPatient.Address = physicalAddress && physicalAddress.text || '';

    const telecom = patientResource.telecom && patientResource.telecom[0];
    this.insPatient.PhoneNumber = telecom && telecom.value || '';

    const email = patientResource.telecom && patientResource.telecom[1];
    this.insPatient.Email = email && email.value.trim() || '';

    this.insPatient.DateOfBirth = patientResource.birthDate || '';
    this.insPatient.Age = this.CalculateAge(this.insPatient.DateOfBirth);


    this.insPatient.Gender = this.CapitalizeFirstLetter(patientResource.gender);

    const identifierWithSBCode = patientResource.identifier.find(item => {
      return item.type.coding.some(coding => coding.code === ENUM_InsuranceIdentifierWithSBCode.SB);
    });
    this.insPatient.Ins_NshiNumber = identifierWithSBCode && identifierWithSBCode.value || '';

    this.insPatient.AgeUnit = 'Y';

    const PolicyHolderUID = patientResource.id;
    this.insPatient.PolicyHolderUID = PolicyHolderUID;

    const RegistrationCase = res.EligibilityResponse && res.EligibilityResponse.insurance && res.EligibilityResponse.insurance[0] && res.EligibilityResponse.insurance[0].benefitBalance && res.EligibilityResponse.insurance[0].benefitBalance[0] && res.EligibilityResponse.insurance[0].benefitBalance[0].category && res.EligibilityResponse.insurance[0].benefitBalance[0].category.text;
    this.insPatient.eligibilityInfo.RegistrationCase = RegistrationCase;

    const allowedMoney = res.EligibilityResponse && res.EligibilityResponse.insurance && res.EligibilityResponse.insurance[0] && res.EligibilityResponse.insurance[0].benefitBalance && res.EligibilityResponse.insurance[0].benefitBalance[0] && res.EligibilityResponse.insurance[0].benefitBalance[0].financial && res.EligibilityResponse.insurance[0].benefitBalance[0].financial[0] && res.EligibilityResponse.insurance[0].benefitBalance[0].financial[0].allowedMoney && res.EligibilityResponse.insurance[0].benefitBalance[0].financial[0].allowedMoney.value;

    this.insPatient.eligibilityInfo.AllowedMoney = allowedMoney;
    this.currentRegSchemeDto.CreditLimitObj.GeneralCreditLimit = allowedMoney;

    const extension: Extension = res.EligibilityResponse && res.EligibilityResponse.insurance && res.EligibilityResponse.insurance[0].extension && res.EligibilityResponse.insurance[0].extension[0];

    const firstServicePointExtension: Extension = patientResource && patientResource.extension && patientResource.extension.find(e => e.url === "https://hib.gov.np/fhir/FHIE+extension+Profile+FSP");
    const districtExtension: Extension = patientResource && patientResource.extension && patientResource.extension.find(e => e.url === "https://hib.gov.np/fhir/FHIE+extension+Profile+District");
    if (extension && extension.url === "https://hib.gov.np/fhir/FHIE+extension+Copayment") {
      this.insPatient.eligibilityInfo.CoPayCashPercent = extension.valueDecimal * 100;
      if (this.insPatient.eligibilityInfo.CoPayCashPercent) {
        this.insPatient.eligibilityInfo.IsCoPayment = true;
      }
      else {
        this.insPatient.eligibilityInfo.IsCoPayment = false;
      }

      if (this.CopaymentSetting && this.CopaymentSetting.IsEnabled && this.insPatient.eligibilityInfo.IsCoPayment) {
        this.insPatient.eligibilityInfo.CoPayCashPercent = this.CopaymentSetting.CoPaymentCashPercent;
      }
    }
    if (districtExtension) {
      this.insPatient.CountrySubDivisionName = districtExtension.valueString;
    }
    if (firstServicePointExtension) {
      this.insPatient.Ins_FirstServicePoint = firstServicePointExtension.valueString;
    }
    const patientImageURLExtension: Extension = patientResource && patientResource.extension && patientResource.extension.find(e => e.url === "https://hib.gov.np/fhir/FHIE+extension+Profile+Photo+Url");

    if (patientImageURLExtension) {
      this.insPatient.PatientImageURL = patientImageURLExtension.valueString;
      this.PatientImage = this.insPatient.PatientImageURL;

    }
    this.NSHISubject.next(this.insPatient);
  }

  CapitalizeFirstLetter(input: string): string {
    if (input) {
      return input.charAt(0).toUpperCase() + input.slice(1);
    }
    else {
      return '';
    }
  }

  CalculateAge(dob: string) {
    if (dob) {
      let dobYear: number = Number(moment(dob).format("YYYY"));
      if (dobYear > 1920) {
        return String(Number(moment().format("YYYY")) - Number(moment(dob).format("YYYY")));
      }
    }
  }
  GetSsfDataAsObservable() {
    this.ssfSubscription = this.ssfService.ReturnSsfData().subscribe(res => {
      let ssfData = new SsfDataStatus_DTO();
      ssfData = res;
      if (ssfData.isPatientInformationLoaded && ssfData.isPatientEligibilityLoaded && ssfData.isEmployerListLoaded) {
        //making these below two variable true for ssf to make user load balance every time.
        this.IsClaimSuccessful = true;//ssfData.IsClaimSuccessful;
        this.DisplayMembershipLoadButton = true;//this.IsClaimSuccessful;
        if (ssfData.ssfPatientDetail.img !== null) {
          this.PatientImage = `data:image/jpeg;base64,${ssfData.ssfPatientDetail.img}`;
        } else {
          this.PatientImage = null;
        }

        this.AssignSsfPatientData(ssfData);
        this.CheckValidationAndEmit();
        this.loading = false;
        this.FetchSsfDetailLocally = false;
      } else {
        this.DisplayMembershipLoadButton = true;
      }
    });
  }
  SFFEmployerListFormatter(data) {
    return data["name"];
  }

  AssignSSFEmployerDetail(data) {
    if (this.SelectedSsfEmployer) {
      this.currentRegSchemeDto.PatientScheme.PolicyHolderEmployerName = this.SelectedSsfEmployer.name;
      this.currentRegSchemeDto.PatientScheme.PolicyHolderEmployerID = this.SelectedSsfEmployer.E_SSID;
      this.IsSsfEmployerAssigned = true;
      this.CheckValidationAndEmit();
    }
  }

  AssignSsfPatientData(ssfData: SsfDataStatus_DTO) {
    this.SsfEmployer = ssfData.employerList;
    if (!this.currentRegSchemeDto.MemberNo) {
      this.currentRegSchemeDto.MemberNo = ssfData.MemberNo;
    }
    const ssfPatientDetail = ssfData.ssfPatientDetail;
    if (ssfPatientDetail && ssfPatientDetail.FirstName) {
      this.currentRegSchemeDto.ssfPatientDetail = ssfPatientDetail;
    }
    if (!(ssfData.patientEligibility && ssfData.patientEligibility.length)) {
      this.currentRegSchemeDto.IsPatientEligibleForService = false;
      this.DisplayMembershipLoadButton = true;
      this.SsfEmployer = new Array<SsfEmployerCompany>();
      this.msgBoxService.showMessage(ENUM_MessageBox_Status.Failed, [`Patient is not eligible for SSF Services. Please check in SSF Portal and try again!`]);
      return;
    } else {
      this.currentRegSchemeDto.IsPatientEligibleForService = true;
    }
    let eligibility = new Array<SSFEligibility>();
    //! Below SSF-Medical is hard coded, need revision
    if (this.currentRegSchemeDto.SchemeName.toLowerCase() === ENUM_DanpheSSFSchemes.Medical.toLowerCase()) {
      eligibility = ssfData.patientEligibility.filter(a => a.SsfEligibilityType.toLowerCase() === ENUM_SSF_EligibilityType.Medical.toLowerCase());
    } else {
      eligibility = ssfData.patientEligibility.filter(a => a.SsfEligibilityType.toLowerCase() === ENUM_SSF_EligibilityType.Accident.toLowerCase());
    }
    if (eligibility && eligibility.length && this.currentRegSchemeDto.SchemeName.toLowerCase() === ENUM_DanpheSSFSchemes.Medical.toLowerCase()) {
      this.currentRegSchemeDto.CreditLimitObj.OpCreditLimit = eligibility[0].OpdBalance;
      this.currentRegSchemeDto.CreditLimitObj.IpCreditLimit = eligibility[0].IPBalance;
      ssfData.RegistrationCase = eligibility[0].SsfEligibilityType;
      this.currentRegSchemeDto.PatientScheme = this.Ssf_GetPatientSchemeForCurrentContext(ssfData);
    } else if (eligibility && eligibility.length && this.currentRegSchemeDto.SchemeName.toLowerCase() !== ENUM_DanpheSSFSchemes.Medical.toLowerCase()) {
      this.currentRegSchemeDto.CreditLimitObj.GeneralCreditLimit = eligibility[0].AccidentBalance;
      ssfData.RegistrationCase = eligibility[0].SsfEligibilityType;
      this.currentRegSchemeDto.PatientScheme = this.Ssf_GetPatientSchemeForCurrentContext(ssfData);
    } else {
      this.currentRegSchemeDto.IsPatientEligibleForService = false;
      this.DisplayMembershipLoadButton = true;
      this.SsfEmployer = new Array<SsfEmployerCompany>();
      this.msgBoxService.showMessage(ENUM_MessageBox_Status.Failed, [`Patient is not eligible for SSF Services. Please check in SSF Portal and try again!`]);
      return;
    }


  }

  Ssf_GetPatientSchemeForCurrentContext(ssfData: SsfDataStatus_DTO): PatientScheme_DTO {
    let retObj: PatientScheme_DTO = new PatientScheme_DTO();
    retObj.SchemeId = this.currentRegSchemeDto.SchemeId;
    retObj.PolicyNo = this.currentRegSchemeDto.MemberNo;
    retObj.LatestClaimCode = ssfData.LatestClaimCode;
    this.currentRegSchemeDto.ClaimCode = retObj.LatestClaimCode;
    retObj.OpCreditLimit = this.currentRegSchemeDto.CreditLimitObj.OpCreditLimit;
    retObj.IpCreditLimit = this.currentRegSchemeDto.CreditLimitObj.IpCreditLimit;
    retObj.GeneralCreditLimit = this.currentRegSchemeDto.CreditLimitObj.GeneralCreditLimit;
    retObj.RegistrationCase = ssfData.RegistrationCase;
    retObj.PolicyHolderUID = ssfData.ssfPatientDetail.PolicyHolderUID;
    return retObj;
  }


  GetPatientSchemeForCurrentContext_Common(): PatientScheme_DTO {
    let retObj: PatientScheme_DTO = new PatientScheme_DTO();
    retObj.SchemeId = this.currentRegSchemeDto.SchemeId;
    retObj.PatientCode = null;
    retObj.PatientId = null;
    retObj.LatestClaimCode = this.currentRegSchemeDto.ClaimCode;
    retObj.PolicyNo = this.currentRegSchemeDto.MemberNo;
    retObj.OpCreditLimit = this.currentRegSchemeDto.CreditLimitObj.OpCreditLimit;
    retObj.OpCreditLimit = this.currentRegSchemeDto.CreditLimitObj.IpCreditLimit;
    return retObj;
  }


  ngOnDestroy() {
    this.ssfSubscription.unsubscribe();
    this.NSHISubscription.unsubscribe();
  }

  SubSchemeListFormatter(data) {
    return data["SubSchemeName"];
  }

  AssignSelectedSubScheme($event: BillingSubScheme_DTO): void {
    if ($event && $event.SubSchemeId) {
      this.currentRegSchemeDto.HasSubScheme = true;
      this.currentRegSchemeDto.SubSchemeId = $event.SubSchemeId;
      this.CheckValidationAndEmit();
    }
  }
  GetHIBIntegrationParameter(): void {
    let param = this.coreService.Parameters.find(a => a.ParameterGroupName === 'GovInsurance' && a.ParameterName === 'HIBConfiguration');
    if (param) {
      let HIBConfigurationParameter = JSON.parse(param.ParameterValue);
      this.IsHIBApiIntegrated = HIBConfigurationParameter.IsEnabled;
    }
  }
  public GetInsuranceProviderList() {
    this.insuranceBLService.GetInsuranceProviderList()
      .subscribe(res => {
        if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
          if (res.Results.length) {
            this.insProviderList = res.Results;
            this.insPatient.InsuranceProviderId = this.insProviderList[0].InsuranceProviderId;
            this.insPatient.Ins_InsuranceProviderId = this.insProviderList[0].InsuranceProviderId;
          }
          else {
            console.log(res.ErrorMessage);
          }
        }
      });
  }
  ReturnNSHIData() {
    return this.NSHISubject.asObservable();
  }

  GetNSHIDataAsObservable() {
    this.NSHISubscription = this.ReturnNSHIData().subscribe(res => {
      let NSHIPatientDetail = new GovInsurancePatientVM();
      NSHIPatientDetail = res;
      if (NSHIPatientDetail.IsPatientInformationLoaded && NSHIPatientDetail.IsPatientEligibilityLoaded) {
        this.AssignNSHIPatientData(NSHIPatientDetail);
        this.CheckValidationAndEmit();
      }
    });
  }
  AssignNSHIPatientData(NSHIData: GovInsurancePatientVM) {
    if (NSHIData) {
      this.currentRegSchemeDto.NSHIPatientDetail = NSHIData;
    }
  }

  async CheckIfClaimSubmitted(NSHINumber: string): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      this.insuranceBLService.CheckIfClaimSubmitted(NSHINumber).subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK && res.Results) {
          if (res.Results > 0) {
            this.IsClaimSubmitted = true;
            resolve(this.IsClaimSubmitted);
          }
        }
        this.IsClaimSubmitted = false;
        resolve(this.IsClaimSubmitted);
      });
    });
  }

  GetInsCopaymentConfigurationParameter() {
    let copaymentConfigurationParameter = this.coreService.Parameters.find(a => a.ParameterGroupName == "Insurance" && a.ParameterName == "CoPaymentConfiguration");
    if (copaymentConfigurationParameter) {
      this.CopaymentSetting = JSON.parse(copaymentConfigurationParameter.ParameterValue)
    }
  }
}

class CopaymentSettings {
  IsEnabled: boolean = false;
  CoPaymentCreditPercent: number = 0;
  CoPaymentCashPercent: number = 0;
}



