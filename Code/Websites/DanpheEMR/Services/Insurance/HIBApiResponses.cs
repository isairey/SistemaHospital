using System;
using System.Collections.Generic;

namespace DanpheEMR.Services.Insurance
{
    public class HIBApiResponses
    {

        public class GetPatientDetailsAndEligibilityApiResponse
        {
            public GetPatientDetailsApiResponse PatientDetails { get; set; }
            public GetEligibilityApiResponse EligibilityResponse { get; set; }
        }
        public class GetPatientDetailsApiResponse
        {
            public string resourceType { get; set; }
            public List<Entry> entry { get; set; }
        }

        public class Entry
        {
            public string fullUrl { get; set; }
            public PatientResource resource { get; set; }
        }

        public class PatientResource
        {
            public string resourceType { get; set; }
            public List<Address> address { get; set; }
            public string birthDate { get; set; }
            public string gender { get; set; }
            public List<Name> name { get; set; }
            public List<Telecom> telecom { get; set; }
            public List<Identifier> identifier { get; set; }
            public List<Extension> extension { get; set; }
            public string id { get; set; }
        }

        public class Address
        {
            public string text { get; set; }
            public string type { get; set; }
            public string use { get; set; }
        }

        public class Name
        {
            public string family { get; set; }
            public List<string> given { get; set; }
            public string use { get; set; }
        }

        public class Telecom
        {
            public string system { get; set; }
            public string use { get; set; }
            public string value { get; set; }
        }
        public class Identifier
        {
            public Type type { get; set; }
            public string use { get; set; }
            public string value { get; set; }
        }
        public class Extension
        {
            public string url { get; set; }
            public string valueBoolean { get; set; }
            public string valueDecimal { get; set; }
            public string valueString { get; set; }
        }

        public class Type
        {
            public List<IdentifierCoding> coding { get; set; }
        }

        public class HibClaimType
        {
            public string text { get; set; }
        }

        public class Coding
        {
            public string code { get; set; }
        }

        public class IdentifierCoding
        {
            public string code { get; set; }
            public string system { get; set; }
        }

        public class GetEligibilityApiResponse
        {
            public List<Extension> extension { get; set; }
            public string resourceType { get; set; }
            public List<Insurance> insurance { get; set; }
        }

        public class Insurance
        {
            public List<BenefitBalance> benefitBalance { get; set; }
            public Contract contract { get; set; }
            public List<Extension> extension { get; set; }
        }

        public class BenefitBalance
        {
            public Category category { get; set; }
            public List<Financial> financial { get; set; }
        }

        public class Category
        {
            public string text { get; set; }
        }

        public class Financial
        {
            public AllowedMoney allowedMoney { get; set; }
            public UsedMoney usedMoney { get; set; }
        }

        public class AllowedMoney
        {
            public decimal value { get; set; }
        }

        public class UsedMoney
        {
            public decimal value { get; set; }
        }

        public class Contract
        {
            public string reference { get; set; }
        }
        public class Patient
        {
            public string reference { get; set; }
        }

        public class EligibilityRequest
        {
            public string resourceType { get; set; }
            public Patient patient { get; set; } = new Patient();
        }

        public class MaritalStatus
        {
            public List<Coding> coding { get; set; }
        }



        public class Resource
        {
            public string resourceType { get; set; }
            public List<Address> address { get; set; }
            public string birthDate { get; set; }
            public List<Extension> extension { get; set; }
            public string gender { get; set; }
            public string id { get; set; }
            public List<Identifier> identifier { get; set; }
            public MaritalStatus maritalStatus { get; set; }
            public List<Name> name { get; set; }
            public List<Telecom> telecom { get; set; }
        }


        public class Link
        {
            public string relation { get; set; }
            public string url { get; set; }
        }

        public class GetClaimResponse
        {
            public string resourceType { get; set; }
            public List<Entry> entry { get; set; }
            public List<Link> link { get; set; }
            public int total { get; set; }
            public string type { get; set; }
        }



        public class DiagnosisCodeableConcept
        {
            public List<Coding> coding { get; set; }
        }

        public class Diagnosis
        {
            public DiagnosisCodeableConcept diagnosisCodeableConcept { get; set; }
            public int sequence { get; set; }
            public List<HibClaimType> type { get; set; }
        }

        public class Reference
        {
            public string reference { get; set; }
        }

        public class BillablePeriod
        {
            public string end { get; set; }
            public string start { get; set; }
        }

        public class Enterer
        {
            public string reference { get; set; }
        }

        public class Facility
        {
            public string reference { get; set; }
        }

        public class ItemCategory
        {
            public string text { get; set; }
        }

        public class Quantity
        {
            public int value { get; set; }
        }

        public class Service
        {
            public string text { get; set; }
        }

        public class UnitPrice
        {
            public decimal value { get; set; }
        }

        public class Item
        {
            public ItemCategory category { get; set; }
            public Quantity quantity { get; set; }
            public int sequence { get; set; }
            public Service service { get; set; }
            public UnitPrice unitPrice { get; set; }
        }

        public class Total
        {
            public decimal value { get; set; }
        }

        public class PatientType
        {
            public string text { get; set; }
        }

        public class ClaimSubmitRequest
        {
            public string resourceType { get; set; }
            public BillablePeriod billablePeriod { get; set; }
            public string created { get; set; }
            public List<Diagnosis> diagnosis { get; set; }
            public Reference enterer { get; set; }
            public Facility facility { get; set; }
            public string id { get; set; }
            public List<Identifier> identifier { get; set; }
            public List<Item> item { get; set; }
            public Total total { get; set; }
            public Patient patient { get; set; }
            public PatientType type { get; set; }
            public string nmc { get; set; }
            public string careType { get; set; }
            public List<ClaimInformation> information { get; set; }
        }

        public class AddItem
        {
            public List<int> sequenceLinkId { get; set; }
            public Service service { get; set; }
        }

        public class OutcomeCoding
        {
            public string code { get; set; }
        }

        public class Outcome
        {
            public List<OutcomeCoding> coding { get; set; }
            public string text { get; set; }
        }

        public class Request
        {
            public string reference { get; set; }
        }

        public class Requestor
        {
            public Identifier identifier { get; set; }
            public string reference { get; set; }
            public string type { get; set; }
        }


        public class ClaimSubmitResponse
        {
            public string resourceType { get; set; }
            public List<AddItem> addItem { get; set; }
            public string created { get; set; }
            public string id { get; set; }
            public List<Identifier> identifier { get; set; }
            public List<Item> item { get; set; }
            public Outcome outcome { get; set; }
            public Request request { get; set; }
        }

        public class INSClaimResponseInfo
        {
            public int PatientId { get; set; }
            public string PatientCode { get; set; }
            public DateTime ClaimedDate { get; set; }
            public int ClaimCode { get; set; }
            public string InvoiceNoCSV { get; set; }
        }

        public class Details
        {
            public string text { get; set; }
        }

        public class Issue
        {
            public string code { get; set; }
            public Details details { get; set; }
            public string severity { get; set; }
        }

        public class ErrorRoot
        {
            public string resourceType { get; set; }
            public List<Issue> issue { get; set; }
        }

        public class ClaimInformation
        {
            public Category category { get; set; }
            public int sequence { get; set; }
            public string valueString { get; set; }

        }

        public class CappingResponseInfo
        {
            public string resourceType { get; set; } = string.Empty;
            public string type { get; set; } = string.Empty;
            public List<CappingEntry> entries { get; set; }
        }

        public class CappingEntry
        {
            public string Code { get; set; } = string.Empty;
            public string Name { get; set; } = string.Empty;
            public decimal? CapQtyPeriod { get; set; }
            public decimal? CapQrstPeriod { get; set; }
            public string itemserv { get; set; } = string.Empty;
            public decimal? QtyUsed { get; set; }
            public decimal? QtyRemain { get; set; }

        }
    }
}
