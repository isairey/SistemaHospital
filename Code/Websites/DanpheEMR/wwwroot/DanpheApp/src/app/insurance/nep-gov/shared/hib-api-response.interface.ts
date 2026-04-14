export interface GetPatientDetailsAndEligibilityApiResponse {
    PatientDetails: GetPatientDetailsApiResponse;
    EligibilityResponse: GetEligibilityApiResponse;
}

export interface GetPatientDetailsApiResponse {
    resourceType: string;
    entry: Entry[];
}

export interface Entry {
    fullUrl: string;
    resource: PatientResource;
}

export interface PatientResource {
    resourceType: string;
    address: Address[];
    birthDate: string;
    gender: string;
    id: string;
    name: Name[];
    telecom: Telecom[];
    identifier: Identifier[];
    extension: Extension[];
}

export interface Address {
    text: string;
    type: string;
    use: string;
}

export interface Name {
    family: string;
    given: string[];
    use: string;
}

export interface Telecom {
    system: string;
    use: string;
    value: string;
}
export interface Identifier {
    type: {
        coding: {
            code: string;
            system: string;
        }[];
    };
    use: string;
    value: string;
}

export interface Extension {
    url: string;
    valueBoolean: boolean;
    valueString: string;
    valueDecimal: number;
}

export interface GetEligibilityApiResponse {
    resourceType: string;
    insurance: Insurance[];
}
export interface Insurance {
    benefitBalance: BenefitBalance[];
    contract: Contract;
    extension: Extension[];
}

export interface BenefitBalance {
    category: {
        text: string;
    };
    financial: Financial[];
}

export interface Financial {
    allowedMoney: {
        value: number;
    };
    usedMoney: {
        value: number;
    };
}

export interface Contract {
    reference: string;
}

export interface Coding {
    code: string;
    system: string;
}

export interface Type {
    coding: Coding[];
}

export interface MaritalStatus {
    coding: Coding[];
}

export interface Resource {
    resourceType: string;
    address: Address[];
    birthDate: string;
    extension: Extension[];
    gender: string;
    id: string;
    identifier: Identifier[];
    maritalStatus: MaritalStatus;
    name: Name[];
    telecom: Telecom[];
}

export interface Link {
    relation: string;
    url: string;
}

export interface GetClaimResponse {
    resourceType: string;
    entry: Entry[];
    link: Link[];
    total: number;
    type: string;
}

export interface CappingResponseInfo {
    resourceType: string;
    type: string;
    entries: CappingEntry[];
}

export class CappingEntry {
    Code: string;
    Name: string;
    CapQtyPeriod: number;
    CapQrstPeriod: number;
    itemserv: string;
    QtyUsed: number;
    QtyRemain: number;
}
