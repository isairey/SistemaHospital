export class Entry {
    fullUrl: string;
    resource: PatientResource;
}

export class PatientResource {
    resourceType: string;
    address: Address[] = [];
    birthDate: string;
    gender: string;
    name: Name[] = [];
    telecom: Telecom[] = [];
    identifier: Identifier[] = [];
    extension: Extension[] = [];
}

export class Address {
    text: string;
    type: string;
    use: string;
}

export class Name {
    family: string;
    given: string[];
    use: string;
}

export class Telecom {
    system: string;
    use: string;
    value: string;
}

export class Identifier {
    type: Types;
    use: string;
    value: string;
}

export class Extension {
    url: string;
    valueBoolean: string;
    valueString: string;
}

export class Types {
    coding: IdentifierCoding[] = [];
}

export class ClaimType {
    text: string;
}

export class TypeArray {
    type: ClaimType[];
}
export class Coding {
    code: string;
}

export class IdentifierCoding {
    code: string;
    system: string;
}

export class Insurance {
    benefitBalance: BenefitBalance[] = [];
    contract: Contract;
}

export class BenefitBalance {
    category: Category;
    financial: Financial[] = [];
}

export class Category {
    text: string;
}

export class Financial {
    allowedMoney: AllowedMoney;
    usedMoney: UsedMoney;
}

export class AllowedMoney {
    value: number;
}

export class UsedMoney {
    value: number;
}

export class Contract {
    reference: string;
}

export class Patient {
    reference: string;
}

export class EligibilityRequest {
    resourceType: string;
    patient: Patient;
}

export class MaritalStatus {
    coding: Coding[] = [];
}

export class Resource {
    resourceType: string;
    address: Address[] = [];
    birthDate: string;
    extension: Extension[] = [];
    gender: string;
    id: string;
    identifier: Identifier[] = [];
    maritalStatus: MaritalStatus;
    name: Name[] = [];
    telecom: Telecom[] = [];
}

export class Link {
    relation: string;
    url: string;
}

export class GetClaimResponse {
    resourceType: string;
    entry: Entry[] = [];
    link: Link[] = [];
    total: number;
    type: string;
}

export class DiagnosisCodeableConcept {
    coding: Coding[] = [];
}

export class Diagnosis {
    diagnosisCodeableConcept: DiagnosisCodeableConcept;
    sequence: number;
    type: ClaimType[] = [];
}

export class Reference {
    reference: string;
}

export class BillablePeriod {
    end: string;
    start: string;
}

export class Enterer {
    reference: string;
}

export class Facility {
    reference: string;
}

export class ItemCategory {
    text: string;
}

export class Quantity {
    value: number;
}

export class Service {
    text: string;
}

export class UnitPrice {
    value: number;
}

export class Item {
    category: ItemCategory;
    quantity: Quantity;
    sequence: number;
    service: Service;
    unitPrice: UnitPrice;
}

export class Total {
    value: number;
}

export class PatientType {
    text: string = null;
}

export class ClaimSubmitRequest {
    resourceType: string;
    billablePeriod: BillablePeriod;
    created: string;
    diagnosis: Diagnosis[] = [];
    enterer: Reference;
    facility: Facility;
    id: string;
    identifier: Identifier[] = [];
    item: Item[] = [];
    total: Total;
    patient: Patient;
    type: PatientType;
    claimResponseInfo: INSClaimResponseInfo = new INSClaimResponseInfo();
    nmc: string = '';
    careType: string = '';
    information: ClaimInformation[] = [];
}

export class AddItem {
    sequenceLinkId: number[] = [];
    service: Service;
}

export class OutcomeCoding {
    code: string;
}

export class Outcome {
    coding: OutcomeCoding[] = [];
    text: string;
}

export class Request {
    reference: string;
}

export class Requestor {
    identifier: Identifier;
    reference: string;
    type: string;
}

export class ClaimSubmitResponse {
    resourceType: string;
    addItem: AddItem[] = [];
    created: string;
    id: string;
    identifier: Identifier[] = [];
    item: Item[] = [];
    outcome: Outcome;
    request: Request;
}


export class HIBConfigurationParameterModel {
    IsEnabled: boolean;
    HIBUrl: string;
    HIBRemotekey: string;
    HIBRemoteValue: string;
    HIBUsername: string;
    HIBPassword: string;
    Enterer: string;
    Facility: string;
    IsLatestAPI: boolean;
}

export class INSClaimResponseInfo {
    public PatientId: number = 0;
    public PatientCode: string = "";
    public ClaimedDate: string = "";
    public ClaimCode: number = 0;
    public InvoiceNoCSV: string = "";
}

export class ClaimInformation{
    public category: Category;
    public sequence: number =0;
    public valueString: string = "";
}