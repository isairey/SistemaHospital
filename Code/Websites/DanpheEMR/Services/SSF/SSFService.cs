using DanpheEMR.DalLayer;
using DanpheEMR.Enums;
using DanpheEMR.Security;
using DanpheEMR.ServerModel.PatientModels;
using DanpheEMR.ServerModel.SSFModels;
using DanpheEMR.ServerModel.SSFModels.ClaimResponse;
using DanpheEMR.ServerModel.SSFModels.SSFResponse;
using DanpheEMR.Services.SSF.DTO;
using DanpheEMR.Utilities;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Org.BouncyCastle.Bcpg.OpenPgp;
using Serilog;
using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Data.SqlClient;
using System.Diagnostics;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading.Tasks;

namespace DanpheEMR.Services.SSF
{
    public class SSFService : ISSFService
    {
        public async Task<SSFPatientDetails> GetPatientDetails(SSFDbContext ssfDbContext, string patientNo)
        {
            var pdetails = new SSFPatientDetails();
            using (var client = new HttpClient())
            {
                string patientImagePath = "";
                var SSFCred = GetSSFCredentials(ssfDbContext);
                var ISO_8859_1 = Encoding.GetEncoding("ISO-8859-1");
                var svcCredentials = Convert.ToBase64String(ISO_8859_1.GetBytes(SSFCred.SSFUsername + ":" + SSFCred.SSFPassword));
                client.DefaultRequestHeaders.Add("Authorization", "Basic " + svcCredentials);
                client.DefaultRequestHeaders.Accept.Clear();
                client.DefaultRequestHeaders.Add(SSFCred.SSFRemotekey, SSFCred.SSFRemoteValue);
                client.BaseAddress = new Uri(SSFCred.SSFurl);
                var response = client.GetAsync($"Patient/?identifier={patientNo}").Result;
                if (response.IsSuccessStatusCode)
                {
                    var details = await response.Content.ReadAsStringAsync();
                    var data = JsonConvert.DeserializeObject<ServerModel.SSFModels.SSFResponse.Root>(details);
                    if (data.entry != null)
                    {
                        foreach (var dt in data.entry)
                        {
                            if (dt.resource.address != null && dt.resource.address.Count > 0)
                            {
                                foreach (var ad in dt.resource.address)
                                {
                                    pdetails.Address = ad.text;
                                }
                            }

                            pdetails.birthdate = dt.resource.birthDate;
                            pdetails.gender = dt.resource.gender;
                            pdetails.UUID = dt.resource.id;
                            if (dt.resource.name != null && dt.resource.name.Count > 0)
                            {
                                foreach (var na in dt.resource.name)
                                {
                                    pdetails.family = na.family;
                                    pdetails.name = na.given[0];
                                }
                            }

                            //foreach (var item in dt.resource.identifier)
                            //{
                            //    pdetails.UUID = item.value;
                            //}
                            if (dt.resource.photo != null && dt.resource.photo.Count > 0)
                            {
                                /*foreach (var item in dt.resource.photo)
                                {
                                    pdetails.img = item.url;
                                }*/
                                patientImagePath = dt.resource.photo[0].url.Replace("\\", "/");
                            }

                        }
                    }
                    var employerList = await GetSsfEmployerList(ssfDbContext, pdetails.UUID);
                    pdetails.ssfEmployerList = employerList;
                    if (patientImagePath != null)
                    {
                        pdetails.img = GetSsfPatientPhoto(client, patientImagePath);
                    }
                }
                else
                {
                    var details = await response.Content.ReadAsStringAsync();
                    throw new Exception(details);
                }
                return pdetails;
            }

        }

        private string GetSsfPatientPhoto(HttpClient client, string img)
        {
            var response = client.GetAsync(img).Result;
            string base64Image = "";
            if (response.IsSuccessStatusCode)
            {
                byte[] imageBytes = response.Content.ReadAsByteArrayAsync().Result;
                base64Image = Convert.ToBase64String(imageBytes);
            }
            return base64Image;
        }

        public async Task<List<EligibilityResponse>> GetElegibility(SSFDbContext ssfDbContext, string patientNo, string visitDate)
        {
            var eligibilityResponse = new List<EligibilityResponse>();
            var request = new EligibilityRequest();
            var patient = new EligibilityPatientData();
            var listExtension = new List<EligibilityExtension>();
            var extreq = new EligibilityExtension();
            extreq.url = "visitDate";
            extreq.valueString = visitDate;
            listExtension.Add(extreq);
            try
            {
                patient.reference = $"Patient/{patientNo}";
                request.patient = patient;
                request.resourceType = "CoverageEligibilityRequest";
                request.extension = listExtension;
                var client = new HttpClient();
                var SSFCred = GetSSFCredentials(ssfDbContext);
                var ISO_8859_1 = Encoding.GetEncoding("ISO-8859-1");
                var svcCredentials = Convert.ToBase64String(ISO_8859_1.GetBytes(SSFCred.SSFUsername + ":" + SSFCred.SSFPassword));
                client.DefaultRequestHeaders.Add("Authorization", "Basic " + svcCredentials);
                client.DefaultRequestHeaders.Accept.Clear();
                client.DefaultRequestHeaders.Add(SSFCred.SSFRemotekey, SSFCred.SSFRemoteValue);
                client.BaseAddress = new Uri(SSFCred.SSFurl);
                var jsonContent = JsonConvert.SerializeObject(request);
                StringContent content = new StringContent(jsonContent, Encoding.UTF8, "application/json");
                var response = await client.PostAsync($"CoverageEligibilityRequest/", content);
                if (response.IsSuccessStatusCode)
                {
                    var result = await response.Content.ReadAsStringAsync();
                    var data = JsonConvert.DeserializeObject<EligibilityRoot>(result);
                    if (data != null)
                    {
                        eligibilityResponse = ParseSSFEligibilityResponse(data, ssfDbContext);
                    }

                }
                else
                {
                    var details = await response.Content.ReadAsStringAsync();
                    throw new Exception(details);
                }
                return eligibilityResponse;
            }
            catch (Exception ee)
            {
                throw ee;
            }
        }


        private static List<EligibilityResponse> ParseSSFEligibilityResponse(EligibilityRoot data, SSFDbContext ssfDbContext)
        {
            var elegibilityResponse = new List<EligibilityResponse>();
            decimal allowMoney = 0;
            decimal usedMoney = 0;
            var extension = new List<EligibilityExtension>();
            var insurance = data.insurance;

            var medicalSchemeName = GetCoreParameterValueByKeyName_String(ssfDbContext, "SSF", "SsfSearchStringForSchemeNames", "Medical"); //Krishna, 27thFeb'23 this is hardcoded value
            var accidentalSchemeName = GetCoreParameterValueByKeyName_String(ssfDbContext, "SSF", "SsfSearchStringForSchemeNames", "Accidental"); //Krishna, 27thFeb'23 this is hardcoded value

            //Krishna, 27thFeb'23 Below logic is used to find the index of Medical/Accidental Schemes coming from SSF Server
            var indexForAccident = insurance.FindIndex(ins =>
                ins.extension.Any(e => String.IsNullOrEmpty(e.valueString) ? "".Like(accidentalSchemeName) : e.valueString.Like(accidentalSchemeName))
            );

            var indexForMedical = insurance.FindIndex(ins =>
                ins.extension.Any(e => String.IsNullOrEmpty(e.valueString) ? "".Like(medicalSchemeName) : e.valueString.Like(medicalSchemeName))
            );


            //Krishna, 27thFeb'23 throw exception in case of issue like index not found.
            if (indexForMedical <= -1 || indexForAccident <= -1)
            {
                throw new Exception("Scheme Search KeyWord not matched.");
            }

            //accident and other information 
            var accident = insurance[indexForAccident];
            var accidentext = accident.extension[0];
            var accidentitem = accident.item[0];
            var accbenifit = accidentitem.benefit;
            foreach (var acc in accbenifit)
            {
                usedMoney = acc.usedMoney.value;
                allowMoney = acc.allowedMoney.value;
            }
            elegibilityResponse.Add(new EligibilityResponse
            {
                Inforce = accident.inforce,
                SsfSchemeName = accidentext.valueString.ToString(),
                AccidentBalance = allowMoney,
                UsedMoney = usedMoney,
                OpdBalance = 0,
                IPBalance = 0,
                SsfEligibilityType = ENUM_SSF_EligibilityType.Accident
            });

            //Medical and other information
            var medicaldata = insurance[indexForMedical];
            var medicaltext = medicaldata.extension[0];
            var medicalOP = medicaldata.extension[1];
            var medicalIP = medicaldata.extension[2];
            var medicalitemitem = medicaldata.item[0];
            var medicalbenifit = medicalitemitem.benefit;
            foreach (var acc in medicalbenifit)
            {
                usedMoney = acc.usedMoney.value;
                allowMoney = acc.allowedMoney.value;
            }
            elegibilityResponse.Add(new EligibilityResponse
            {
                Inforce = medicaldata.inforce,
                SsfSchemeName = medicaltext.valueString.ToString(),
                AccidentBalance = 0,
                UsedMoney = usedMoney,
                OpdBalance = Convert.ToDecimal(medicalOP.valueString),
                IPBalance = Convert.ToDecimal(medicalIP.valueString),
                SsfEligibilityType = ENUM_SSF_EligibilityType.Medical
            });
            return elegibilityResponse;
        }

        public async Task<List<List<Company>>> GetEmployerList(SSFDbContext ssfDbContext, string SSFPatientUUID)
        {
            var company = new List<List<Company>>();
            using (var client = new HttpClient())
            {
                var SSFCred = GetSSFCredentials(ssfDbContext);
                var ISO_8859_1 = Encoding.GetEncoding("ISO-8859-1");
                var svcCredentials = Convert.ToBase64String(ISO_8859_1.GetBytes(SSFCred.SSFUsername + ":" + SSFCred.SSFPassword));
                client.DefaultRequestHeaders.Add("Authorization", "Basic " + svcCredentials);
                //client.DefaultRequestHeaders.Accept.Clear();
                client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("*/*"));
                client.DefaultRequestHeaders.Connection.Add("keep-alive");

                client.DefaultRequestHeaders.Add(SSFCred.SSFRemotekey, SSFCred.SSFRemoteValue);
                client.BaseAddress = new Uri(SSFCred.SSFurl);
                var response = client.GetAsync($"Employee/{SSFPatientUUID}/").Result;
                if (response.IsSuccessStatusCode)
                {
                    var details = await response.Content.ReadAsStringAsync();
                    var data = JsonConvert.DeserializeObject<EmployerRoot>(details);
                    company = data.company;
                }
                else
                {
                    var details = await response.Content.ReadAsStringAsync();
                    throw new Exception(details);
                }
            }
            return company;
        }

        //Krishna, 15thMarch'23 This is a new method to get the SSFEmployerList after patient Detail is loaded this method will get hit to fetch the list of employer,
        //code is same as the GetEmployerList() method (Not implementation of any interface method)
        private async Task<List<List<Company>>> GetSsfEmployerList(SSFDbContext ssfDbContext, string SSFPatientUUID)
        {
            var company = new List<List<Company>>();
            using (var client = new HttpClient())
            {
                var SSFCred = GetSSFCredentials(ssfDbContext);
                var ISO_8859_1 = Encoding.GetEncoding("ISO-8859-1");
                var svcCredentials = Convert.ToBase64String(ISO_8859_1.GetBytes(SSFCred.SSFUsername + ":" + SSFCred.SSFPassword));
                client.DefaultRequestHeaders.Add("Authorization", "Basic " + svcCredentials);
                //client.DefaultRequestHeaders.Accept.Clear();
                client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("*/*"));
                client.DefaultRequestHeaders.Connection.Add("keep-alive");

                client.DefaultRequestHeaders.Add(SSFCred.SSFRemotekey, SSFCred.SSFRemoteValue);
                client.BaseAddress = new Uri(SSFCred.SSFurl);
                var response = client.GetAsync($"Employee/{SSFPatientUUID}/").Result;
                if (response.IsSuccessStatusCode)
                {
                    var details = await response.Content.ReadAsStringAsync();
                    var data = JsonConvert.DeserializeObject<EmployerRoot>(details);
                    company = data.company;
                }
                else
                {
                    var details = await response.Content.ReadAsStringAsync();
                    throw new Exception(details);
                }
            }
            return company;
        }

        public async Task<SSFClaimSubmissionOutput> SubmitClaim(SSFDbContext ssfDbContext, ClaimRoot claimRoot, SSFClaimResponseInfo responseInfo)
        {
            try
            {
                var client = new HttpClient();
                var SSFCred = GetSSFCredentials(ssfDbContext);
                var ISO_8859_1 = Encoding.GetEncoding("ISO-8859-1");
                var svcCredentials = Convert.ToBase64String(ISO_8859_1.GetBytes(SSFCred.SSFUsername + ":" + SSFCred.SSFPassword));
                client.DefaultRequestHeaders.Add("Authorization", "Basic " + svcCredentials);
                client.DefaultRequestHeaders.Accept.Clear();
                client.DefaultRequestHeaders.Add(SSFCred.SSFRemotekey, SSFCred.SSFRemoteValue);
                client.BaseAddress = new Uri(SSFCred.SSFurl);
                var jsonContent = JsonConvert.SerializeObject(claimRoot);
                StringContent content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

                Log.Information($"Header is prepared to submit to the ssf server, for patient, {claimRoot.patient.reference} with claimCode {claimRoot.clientClaimId}");
                Log.Information($"Claim Object we are sending to ssf server, for patient, {claimRoot.patient.reference} with claimCode {claimRoot.clientClaimId} is \n {jsonContent}");

                var response = await client.PostAsync($"Claim/", content);
                var result = "";
                var errorResult = new ErrorRoot();
                var errorMessage = "";
                SSFClaimResponse serializeData = new SSFClaimResponse();
                string responseStatus = ENUM_Danphe_HTTP_ResponseStatus.Failed;
                if (response.IsSuccessStatusCode)
                {
                    result = await response.Content.ReadAsStringAsync();

                    Log.Information($"The Response received from SSF Server is, for patient, {claimRoot.patient.reference} with claimCode {claimRoot.clientClaimId} is \n {result}");

                    serializeData = JsonConvert.DeserializeObject<SSFClaimResponse>(result);
                    responseStatus = ENUM_Danphe_HTTP_ResponseStatus.OK;
                }
                else
                {
                    Log.Warning($"Claim Submission falied, for patient, {claimRoot.patient.reference} with claimCode {claimRoot.clientClaimId} ");

                    responseStatus = ENUM_Danphe_HTTP_ResponseStatus.Failed;
                    if (response.Content.Headers.ContentType?.MediaType != "text/html")
                    {
                        var errorString = await response.Content.ReadAsStringAsync();
                        Log.Warning($"Claim Submission falied, for patient, {claimRoot.patient.reference} with claimCode {claimRoot.clientClaimId} and Error Response received as, \n {errorString} ");
                        dynamic errorJson = JsonConvert.DeserializeObject(errorString);
                        if (errorJson != null && errorJson.issue.Count > 0) {
                            if (errorJson.issue[0].details.text is string)
                            {
                                var tempErrorMsg = errorJson.issue[0].details.text;
                                errorMessage += tempErrorMsg + ",";
                                
                            }
                            else
                            {
                                errorResult = JsonConvert.DeserializeObject<ErrorRoot>(errorString);
                                if (errorResult != null && errorResult.issue.Count > 0)
                                {
                                    errorResult.issue.ForEach(a =>
                                    {
                                        var tempErrorMsg = $"({a.details.text.errorCode}) {a.details.text.message}";
                                        errorMessage += tempErrorMsg + ",";
                                    });
                                }
                            }
                        }
                        errorMessage = errorMessage.Substring(0, errorMessage.Length - 1);
                    }
                    else
                    {
                        var errorString = await response.Content.ReadAsStringAsync();
                        errorMessage = errorString;
                        Log.Warning($"Claim Submission falied, for patient, {claimRoot.patient.reference} with claimCode {claimRoot.clientClaimId} and Error Response received as, \n {errorString} ");

                    }

                }

                List<SSFClaimResponseDetails> claimResponseList = new List<SSFClaimResponseDetails>();
                var PreviousClaimResponse = ssfDbContext.SSFClaimResponseDetail.Where(a => a.ClaimCode == responseInfo.ClaimCode).FirstOrDefault();

                string claimReferenceNo = null;
                if (serializeData.identifier != null)
                {
                    var indexOfClaimReferenceObject = serializeData.identifier.FindIndex(a => a.type.coding.Any(b => b.code.ToLower() == "mr")); //Krishna, 15thMay'23, This is to get the ClaimReferenceNo Object's index from identifier object 
                    claimReferenceNo = serializeData.identifier[indexOfClaimReferenceObject].value; //After getting indexOf ClaimReferenceNo's index we use that index to get ClaimReferenceNo
                }

                if (PreviousClaimResponse != null)
                {
                    //PreviousClaimResponse.ClaimReferenceNo = serializeData.id;
                    PreviousClaimResponse.ClaimReferenceNo = claimReferenceNo != null ? claimReferenceNo : serializeData.id;//Keeping it like this incase if claimReferenceNo is not found there will be uuid which can be used to find ClaimReferenceNo later.
                    PreviousClaimResponse.ClaimStatus = serializeData.status;
                    PreviousClaimResponse.ResponseData = result;
                    PreviousClaimResponse.ResponseStatus = response.IsSuccessStatusCode;
                    PreviousClaimResponse.ClaimedDate = DateTime.Now;
                    PreviousClaimResponse.ResponseDate = DateTime.Now;
                    PreviousClaimResponse.ClaimCount += 1;
                    await ssfDbContext.SaveChangesAsync();

                    Log.Information($"Claim Response from SSF Server is updated in our database,for patient, {claimRoot.patient.reference} with claimCode {claimRoot.clientClaimId} ");

                }
                else
                {
                    var item = new SSFClaimResponseDetails()
                    {
                        InvoiceNoCSV = responseInfo.InvoiceNoCSV,
                        PatientId = responseInfo.PatientId,
                        PatientCode = responseInfo.PatientCode,
                        ClaimCode = responseInfo.ClaimCode,
                        ClaimedDate = responseInfo.ClaimedDate,
                        ResponseData = result,
                        ClaimRequestDate = responseInfo.ClaimedDate,
                        ClaimStatus = serializeData.status,
                        ResponseDate = responseInfo.ClaimedDate,
                        ResponseStatus = response.IsSuccessStatusCode,
                        //ClaimReferenceNo = serializeData.id,
                        ClaimReferenceNo = claimReferenceNo != null ? claimReferenceNo : serializeData.id,//Keeping it like this incase if claimReferenceNo is not found there will be uuid which can be used to find ClaimReferenceNo later.
                        ClaimCount = 1
                    };
                    claimResponseList.Add(item);
                    ssfDbContext.SSFClaimResponseDetail.AddRange(claimResponseList);
                    await ssfDbContext.SaveChangesAsync();
                    Log.Information($"Claim Response from SSF Server is added in our database,for patient, {claimRoot.patient.reference} with claimCode {claimRoot.clientClaimId} ");

                }

                //Krishna, this will update the IsClaimed Status of Booking List for this specific Claim
                if (response.IsSuccessStatusCode)
                {
                    var claimBookings = ssfDbContext.SSFClaimBookings.Where(a => a.LatestClaimCode.ToString() == claimRoot.clientClaimId).ToList();
                    if (claimBookings != null && claimBookings.Count > 0)
                    {
                        claimBookings.ForEach(book =>
                        {
                            book.IsClaimed = true;
                        });
                        await ssfDbContext.SaveChangesAsync();
                        Log.Information($"Claim Status is updated in our database,for patient, {claimRoot.patient.reference} with claimCode {claimRoot.clientClaimId} ");
                    }
                }


                SSFClaimSubmissionOutput outputResult = new SSFClaimSubmissionOutput
                {
                    ResponseStatus = responseStatus,
                    ErrorMessage = errorMessage
                };
                return outputResult;
            }
            catch (Exception ex)
            {
                Log.Error($"Exception is thrown during claim Submission process for SSF Patient, {claimRoot.patient.reference} with claimCode {claimRoot.clientClaimId}");
                throw new Exception($"Exception is thrown during claim Submission process for SSF Patient, {claimRoot.patient.reference} with claimCode {claimRoot.clientClaimId}, exception details is, \n {ex.ToString()}"); ;
            }
        }

        public async Task<EmployerRoot> GetClaimDetail(SSFDbContext ssfDbContext, string ClaimUUID)
        {
            using (var client = new HttpClient())
            {
                var SSFCred = GetSSFCredentials(ssfDbContext);
                var ISO_8859_1 = Encoding.GetEncoding("ISO-8859-1");
                var svcCredentials = Convert.ToBase64String(ISO_8859_1.GetBytes(SSFCred.SSFUsername + ":" + SSFCred.SSFPassword));
                client.DefaultRequestHeaders.Add("Authorization", "Basic " + svcCredentials);
                client.DefaultRequestHeaders.Accept.Clear();
                client.DefaultRequestHeaders.Add(SSFCred.SSFRemotekey, SSFCred.SSFRemoteValue);
                client.BaseAddress = new Uri(SSFCred.SSFurl);
                var response = client.GetAsync($"Claim/{ClaimUUID}/").Result;
                if (response.IsSuccessStatusCode)
                {
                    var details = await response.Content.ReadAsStringAsync();
                    var data = JsonConvert.DeserializeObject<EmployerRoot>(details);
                }
            }
            return new EmployerRoot();
        }

        public SSFCredentials GetSSFCredentials(SSFDbContext ssfDbContext)
        {
            SSFCredentials cred = new SSFCredentials();
            cred.SSFurl = GetCoreParameterValueByKeyName_String(ssfDbContext, "SSF", "SSFConfiguration", "SSFurl");
            cred.SSFUsername = GetCoreParameterValueByKeyName_String(ssfDbContext, "SSF", "SSFConfiguration", "SSFUsername");
            cred.SSFPassword = GetCoreParameterValueByKeyName_String(ssfDbContext, "SSF", "SSFConfiguration", "SSFPassword");
            cred.SSFRemotekey = GetCoreParameterValueByKeyName_String(ssfDbContext, "SSF", "SSFConfiguration", "SSFRemotekey");
            cred.SSFRemoteValue = GetCoreParameterValueByKeyName_String(ssfDbContext, "SSF", "SSFConfiguration", "SSFRemoteValue");
            return cred;
        }
        public static string GetCoreParameterValueByKeyName_String(SSFDbContext ssfDbContext, string paramGroup, string paramName, string keyNameOfJsonObj)
        {
            string retValue = null;

            var param = ssfDbContext.AdminParameters.Where(a => a.ParameterGroupName == paramGroup && a.ParameterName == paramName).FirstOrDefault();
            if (param != null)
            {
                string paramValueStr = param.ParameterValue;
                var data = DanpheJSONConvert.DeserializeObject<JObject>(paramValueStr);
                if (data != null)
                {
                    return data[keyNameOfJsonObj].Value<string>();
                }
            }

            return retValue;
        }
        public async Task<bool> IsClaimed(SSFDbContext ssfDbContext, long claimCode, int patientId)
        {
            var isClaimed = false;
            try
            {
                if(patientId == 0 || patientId == null)
                {
                    throw new Exception("Patient Detail is not provided to check Claim Status");
                }

                if(claimCode == null || claimCode == 0)
                {
                    isClaimed = false;
                }
                else
                {
                    var ssfClaimResponse = await ssfDbContext.SSFClaimResponseDetail.FirstOrDefaultAsync(ssfResDet => ssfResDet.PatientId == patientId && ssfResDet.ClaimCode == claimCode);
                    if (ssfClaimResponse != null && ssfClaimResponse.ResponseStatus == true)
                    {
                        isClaimed = true;
                    }
                }                
            }
            catch (Exception)
            {
                throw;
            }

            return isClaimed;
        }

        public async Task<PatientSchemeMapModel> GetSSFPatientDetailLocally(SSFDbContext sSFDbContext, int patientId, int schemeId)
        {
            try
            {
                var patientSchemeMap = new PatientSchemeMapModel();
                patientSchemeMap = await sSFDbContext.PatientSchemeMaps.FirstOrDefaultAsync(a => a.PatientId == patientId && a.SchemeId == schemeId); //PatientSchemeMaps Model has been removed.
                return patientSchemeMap;
            }
            catch (Exception)
            {
                throw;
            }
        }

        public async Task<ClaimBookingResponse> BookClaim(SSFDbContext ssfDbContext, ClaimBookingRoot_DTO claimBooking_DTO, RbacUser currentUser)
        {
            try
            {
                var client = new HttpClient();
                var SSFCred = GetSSFCredentials(ssfDbContext);
                var ISO_8859_1 = Encoding.GetEncoding("ISO-8859-1");
                var svcCredentials = Convert.ToBase64String(ISO_8859_1.GetBytes(SSFCred.SSFUsername + ":" + SSFCred.SSFPassword));
                client.DefaultRequestHeaders.Add("Authorization", "Basic " + svcCredentials);
                client.DefaultRequestHeaders.Accept.Clear();
                client.DefaultRequestHeaders.Add(SSFCred.SSFRemotekey, SSFCred.SSFRemoteValue);
                client.BaseAddress = new Uri(SSFCred.SSFurl);
                var claimBookingObj = PrepareClaimBooking(claimBooking_DTO);
                var jsonContent = JsonConvert.SerializeObject(claimBookingObj);
                StringContent content = new StringContent(jsonContent, Encoding.UTF8, "application/json");
                //var response = await client.PostAsync($"BookingService/", content);

                Log.Information($"Header information is prepared to submit claim booking details, for patient {claimBooking_DTO.Patient} with claimCode {claimBooking_DTO.LatestClaimCode}");
                Log.Information($"Claim Booking Object we are sending to SSF Server, for patient {claimBooking_DTO.Patient} with claimCode {claimBooking_DTO.LatestClaimCode} is \n {jsonContent}");

                var response = await client.PostAsync(ENUM_SSF_ApiEndPoints.BookingService, content);
                var result = "";
                var errorResult = new ErrorRoot();
                var errorMessage = "";
                ClaimBookingResponseRoot serializeData = new ClaimBookingResponseRoot();
                string responseStatus = ENUM_Danphe_HTTP_ResponseStatus.Failed;

                if (response.IsSuccessStatusCode)
                {
                    result = await response.Content.ReadAsStringAsync();

                    Log.Information($"Claim Booking Response is received from SSF Server, for patient {claimBooking_DTO.Patient} with claimCode {claimBooking_DTO.LatestClaimCode} and Response is \n {result}");

                    serializeData = JsonConvert.DeserializeObject<ClaimBookingResponseRoot>(result);
                    responseStatus = ENUM_Danphe_HTTP_ResponseStatus.OK;
                }
                else
                {
                    Log.Warning($"Claim Booking failed, for patient {claimBookingObj.Patient} with claimCode {claimBookingObj.client_claim_id} for invoice {claimBookingObj.client_invoice_no}");

                    responseStatus = ENUM_Danphe_HTTP_ResponseStatus.Failed;
                    if (response.Content.Headers.ContentType?.MediaType != "text/html")
                    {
                        var errorString = await response.Content.ReadAsStringAsync();

                        Log.Warning($"Claim Booking failed, for patient {claimBookingObj.Patient} with claimCode {claimBookingObj.client_claim_id} for invoice {claimBookingObj.client_invoice_no} with response \n {errorString}");

                        dynamic errorJson = JsonConvert.DeserializeObject(errorString);
                        if (errorJson != null && errorJson.issue.Count > 0)
                        {
                            if (errorJson.issue[0].details.text is string)
                            {
                                var tempErrorMsg = errorJson.issue[0].details.text;
                                errorMessage += tempErrorMsg + ",";

                            }
                            else
                            {
                                errorResult = JsonConvert.DeserializeObject<ErrorRoot>(errorString);
                                if (errorResult != null && errorResult.issue.Count > 0)
                                {
                                    errorResult.issue.ForEach(a =>
                                    {
                                        var tempErrorMsg = $"({a.details.text.errorCode}) {a.details.text.message}";
                                        errorMessage += tempErrorMsg + ",";
                                    });
                                }
                            }
                        }
                        errorMessage = errorMessage.Substring(0, errorMessage.Length - 1);
                    }
                    else
                    {
                        var errorString = await response.Content.ReadAsStringAsync();
                        errorMessage = errorString;
                        Log.Warning($"Claim Booking failed, for patient {claimBookingObj.Patient} with claimCode {claimBookingObj.client_claim_id} for invoice {claimBookingObj.client_invoice_no} with response \n {errorString}");
                    }
                }

                SaveClaimBookingResponse(ssfDbContext, result, responseStatus, claimBooking_DTO, currentUser);

                ClaimBookingResponse outputResult = new ClaimBookingResponse
                {
                    ResponseStatus = responseStatus,
                    ErrorMessage = errorMessage
                };
                return outputResult;
            }
            catch (Exception ex)
            {
                Log.Error($"Exception is thrown while bokking claim,for patient {claimBooking_DTO.Patient} with claimCode {claimBooking_DTO.LatestClaimCode}, exception details is, \n {ex.Message} "); ;
                throw new Exception($"Exception is thrown while bokking claim,for patient {claimBooking_DTO.Patient} with claimCode {claimBooking_DTO.LatestClaimCode}, exception details is, \n {ex.Message} ");
            }
        }

        private ClaimBooking PrepareClaimBooking(ClaimBookingRoot_DTO claimBookingRoot)
        {
            ClaimBooking claimBooking = new ClaimBooking();
            if (claimBookingRoot.IsAccidentCase)
            {
                if (claimBookingRoot.IsCreditNote)
                {
                    claimBooking.bookedAmount = -(float)claimBookingRoot.bookedAmount;
                }
                claimBooking.bookedAmount = (float)claimBookingRoot.bookedAmount; //(int)claimBookingRoot.bookedAmount;
                claimBooking.Patient = claimBookingRoot.Patient;
                claimBooking.scheme = ENUM_SSF_SchemeTypes.Accident;
                claimBooking.subProduct = claimBookingRoot.subProduct;
                claimBooking.client_claim_id = claimBookingRoot.LatestClaimCode.ToString();
                claimBooking.client_invoice_no = String.IsNullOrEmpty(claimBookingRoot.BillingInvoiceNo) ? claimBookingRoot.PharmacyInvoiceNo : claimBookingRoot.BillingInvoiceNo;
            }
            else
            {
                if (claimBookingRoot.IsCreditNote)
                {
                    claimBooking.bookedAmount = -(float)claimBookingRoot.bookedAmount;
                }
                claimBooking.bookedAmount = (float)claimBookingRoot.bookedAmount; //(int)(claimBookingRoot.bookedAmount);
                claimBooking.Patient = claimBookingRoot.Patient;
                claimBooking.scheme = ENUM_SSF_SchemeTypes.Medical;
                claimBooking.subProduct = claimBookingRoot.subProduct;
                claimBooking.client_claim_id = claimBookingRoot.LatestClaimCode.ToString();
                claimBooking.client_invoice_no = String.IsNullOrEmpty(claimBookingRoot.BillingInvoiceNo) ? claimBookingRoot.PharmacyInvoiceNo : claimBookingRoot.BillingInvoiceNo;
            }
            return claimBooking;
        }

        private void SaveClaimBookingResponse(SSFDbContext ssfDbContext, string result, string responseStatus, ClaimBookingRoot_DTO claimBooking_DTO, RbacUser currentUser)
        {
            if (responseStatus == ENUM_Danphe_HTTP_ResponseStatus.OK)
            {
                SaveSuccesfulClaimBooking(ssfDbContext, result, claimBooking_DTO, currentUser);
                Log.Information($"Claim Booking Response is saved successfully in our database after successful Claim Booking, for patient {claimBooking_DTO.Patient} with ClaimCode {claimBooking_DTO.LatestClaimCode}");
            }
            else
            {
                SaveUnsuccessfulClaimBooking(ssfDbContext, currentUser, claimBooking_DTO);
                Log.Warning($"Claim Booking Response is saved successfully in our database after failed Claim Booking, for patient {claimBooking_DTO.Patient} with ClaimCode {claimBooking_DTO.LatestClaimCode}");
            }
        }


        private void SaveSuccesfulClaimBooking(SSFDbContext ssfDbContext, string result, ClaimBookingRoot_DTO claimBooking_DTO, RbacUser currentUser)
        {

            SSFClaimBookingModel claimBooking = new SSFClaimBookingModel();
            if (String.IsNullOrEmpty(claimBooking_DTO.BillingInvoiceNo))
            {
                claimBooking = ssfDbContext.SSFClaimBookings.Where(a => a.PharmacyInvoiceNo == claimBooking_DTO.PharmacyInvoiceNo).FirstOrDefault();
            }
            else
            {
                claimBooking = ssfDbContext.SSFClaimBookings.Where(a => a.BillingInvoiceNo == claimBooking_DTO.BillingInvoiceNo).FirstOrDefault();
            }

            if (claimBooking != null)
            {
                claimBooking.ReBookedBy = currentUser.EmployeeId;
                claimBooking.ReBookingDate = DateTime.Now;
                claimBooking.ResponseData = result;
                claimBooking.BookingResponseDate = DateTime.Now;
                claimBooking.BookingStatus = true;

                ssfDbContext.Entry(claimBooking).State = EntityState.Modified;
                ssfDbContext.SaveChanges();
            }
            else
            {
                SSFClaimBookingModel claimBookingService = new SSFClaimBookingModel();
                claimBookingService.PatientId = claimBooking_DTO.PatientId;
                claimBookingService.HospitalNo = claimBooking_DTO.HospitalNo;
                claimBookingService.PolicyNo = claimBooking_DTO.PolicyNo;
                claimBookingService.LatestClaimCode = claimBooking_DTO.LatestClaimCode;
                claimBookingService.ResponseData = result;
                claimBookingService.BillingInvoiceNo = claimBooking_DTO.BillingInvoiceNo;
                claimBookingService.PharmacyInvoiceNo = claimBooking_DTO.PharmacyInvoiceNo;
                claimBookingService.BookingRequestDate = DateTime.Now;
                claimBookingService.BookingResponseDate = DateTime.Now;
                claimBookingService.BookedBy = currentUser.EmployeeId;
                claimBookingService.BookingStatus = true;
                claimBookingService.IsClaimed = false;
                claimBookingService.IsActive = true;

                ssfDbContext.SSFClaimBookings.Add(claimBookingService);
                ssfDbContext.SaveChanges();
            }
        }

        private void SaveUnsuccessfulClaimBooking(SSFDbContext ssfDbContext, RbacUser currentUser, ClaimBookingRoot_DTO claimBooking_DTO)
        {
            SSFClaimBookingModel claimBooking = new SSFClaimBookingModel();
            if (String.IsNullOrEmpty(claimBooking_DTO.BillingInvoiceNo))
            {
                claimBooking = ssfDbContext.SSFClaimBookings.Where(a => a.PharmacyInvoiceNo == claimBooking_DTO.PharmacyInvoiceNo).FirstOrDefault();
            }
            else
            {
                claimBooking = ssfDbContext.SSFClaimBookings.Where(a => a.BillingInvoiceNo == claimBooking_DTO.BillingInvoiceNo).FirstOrDefault();
            }

            if (claimBooking != null)
            {
                claimBooking.ReBookedBy = currentUser.EmployeeId;
                claimBooking.ReBookingDate = DateTime.Now;
                claimBooking.ResponseData = "";
                claimBooking.BookingStatus = false;

                ssfDbContext.Entry(claimBooking).State = EntityState.Modified;
                ssfDbContext.SaveChanges();
            }
            else
            {
                SSFClaimBookingModel booking = new SSFClaimBookingModel();
                booking.PatientId = claimBooking_DTO.PatientId;
                booking.HospitalNo = claimBooking_DTO.HospitalNo;
                booking.PolicyNo = claimBooking_DTO.PolicyNo;
                booking.LatestClaimCode = claimBooking_DTO.LatestClaimCode;
                booking.ResponseData = "";
                booking.BillingInvoiceNo = claimBooking_DTO.BillingInvoiceNo;
                booking.PharmacyInvoiceNo = claimBooking_DTO.PharmacyInvoiceNo;
                booking.BookingRequestDate = DateTime.Now;
                booking.BookedBy = currentUser.EmployeeId;
                booking.BookingStatus = false;
                booking.IsClaimed = false;
                booking.IsActive = true;

                ssfDbContext.SSFClaimBookings.Add(booking);
                ssfDbContext.SaveChanges();
            }
        }

        public async Task<object> GetClaimBookingDetail(SSFDbContext sSFDbContext, Int64 claimCode)
        {
            var claimBooking = await sSFDbContext.SSFClaimBookings
                                            .Where(a => a.LatestClaimCode == claimCode && a.IsActive == true && a.IsClaimed == false)
                                            .Select(s => new
                                            {
                                                PatientId = s.PatientId,
                                                HospitalNo = s.HospitalNo,
                                                PolicyNo = s.PolicyNo,
                                                LatestClaimCode = s.LatestClaimCode,
                                                BillingInvoiceNo = s.BillingInvoiceNo,//$"BL{ s.BillingInvoiceNo}",
                                                PharmacyInvoiceNo = s.PharmacyInvoiceNo, //$"PH{s.PharmacyInvoiceNo}",
                                                BookingStatus = s.BookingStatus,
                                            }).ToListAsync();
            return claimBooking;
        }

        public async Task<object> CheckClaimBookingStatus(SSFDbContext sSFDbContext, CheckBookingStauts_DTO checkBookingStauts)
        {
            using (var client = new HttpClient())
            {
                try
                {
                    var SSFCred = GetSSFCredentials(sSFDbContext);
                    var ISO_8859_1 = Encoding.GetEncoding("ISO-8859-1");
                    var svcCredentials = Convert.ToBase64String(ISO_8859_1.GetBytes(SSFCred.SSFUsername + ":" + SSFCred.SSFPassword));
                    client.DefaultRequestHeaders.Add("Authorization", "Basic " + svcCredentials);
                    client.DefaultRequestHeaders.Accept.Clear();
                    client.DefaultRequestHeaders.Add(SSFCred.SSFRemotekey, SSFCred.SSFRemoteValue);
                    client.BaseAddress = new Uri(SSFCred.SSFurl);
                    var payload = GeneratePayloadToCheckBookingStatus(checkBookingStauts);
                    var jsonContent = JsonConvert.SerializeObject(payload);
                    StringContent content = new StringContent(jsonContent, Encoding.UTF8, "application/json");
                    var response = client.PostAsync($"Request", content).Result;
                    if (response.IsSuccessStatusCode)
                    {
                        var details = await response.Content.ReadAsStringAsync();
                        if (details != null)
                        {
                            var bookingDetails = JsonConvert.DeserializeObject<ClaimBookingDetailsFromSSFServer_Root_DTO>(details);
                            if (bookingDetails != null)
                            {
                                return bookingDetails;
                            }
                            else
                            {
                                throw new Exception("Could not deserialize the content received from SSF Server with our custom classes");
                            }
                        }
                        else
                        {
                            throw new Exception($"{response}");
                        }
                    }
                    else
                    {
                        throw new Exception($"The request to SSF Server could not succeed \n {response}");
                    }
                }
                catch (Exception ex)
                {
                    throw ex;
                }
                
            }
        }

        private CheckBookingStauts_DTO GeneratePayloadToCheckBookingStatus(CheckBookingStauts_DTO checkBookingStauts)
        {
            var payload = new CheckBookingStauts_DTO
            {
                resourceType = "ExtraJson",
                payload = new CheckBookingStatus_Payload
                {
                    cmd_action = "action.bookingHistory",
                    chfid = checkBookingStauts.payload.chfid
                }
            };
            return payload;
        }

        public async Task<string> GetSSFSubProduct(SSFDbContext sSFDbContext, Int64 claimCode)
        {
            var visit = await sSFDbContext.Visits.FirstOrDefaultAsync(a => a.ClaimCode == claimCode);
            if(visit != null)
            {
                return visit.OtherInfo;
            }
            else
            {
                return string.Empty;
            }
        }

        public async Task<object> AddAttachments(SSFDbContext sSFDbContext, AddAttachmentDTO addAttachment)
        {
            try
            {
                var client = new HttpClient();
                var SSFCred = GetSSFCredentials(sSFDbContext);
                var ISO_8859_1 = Encoding.GetEncoding("ISO-8859-1");
                var svcCredentials = Convert.ToBase64String(ISO_8859_1.GetBytes(SSFCred.SSFUsername + ":" + SSFCred.SSFPassword));
                client.DefaultRequestHeaders.Add("Authorization", "Basic " + svcCredentials);
                client.DefaultRequestHeaders.Accept.Clear();
                client.DefaultRequestHeaders.Add(SSFCred.SSFRemotekey, SSFCred.SSFRemoteValue);
                client.BaseAddress = new Uri(SSFCred.SSFurl);
                var jsonContent = JsonConvert.SerializeObject(addAttachment);
                StringContent content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

                Log.Information($"Header information is prepared to submit attachment, for claim code {addAttachment.claim}.");
                Log.Information($"Claim Attachment Object we are sending to SSF Server,for claim code {addAttachment.claim} is \n {jsonContent}");

                var response = await client.PostAsync(ENUM_SSF_ApiEndPoints.AddAttachment, content);
                var errorResult = new AttachmentErrorRoot();
                string errorMessage = string.Empty;
                string responseStatus = ENUM_Danphe_HTTP_ResponseStatus.Failed;
                var responseContent = await response.Content.ReadAsStringAsync();

                if (response.StatusCode == System.Net.HttpStatusCode.Created) // 201 Created
                {
                    return responseContent;
                    
                }
                else
                {
                    try
                    {
                        errorResult = JsonConvert.DeserializeObject<AttachmentErrorRoot>(responseContent);
                        if (errorResult != null && errorResult.issue.Count > 0)
                        {
                            errorResult.issue.ForEach(a =>
                            {
                                var tempErrorMsg = $"({a.details.text})";
                                errorMessage += tempErrorMsg + ",";
                            });
                        }

                        Log.Warning($"Failed to add attachment for claim {addAttachment.claim}. Error: {errorMessage}");
                        throw new InvalidOperationException(errorMessage);
                        //return new
                        //{
                        //    Status = ENUM_Danphe_HTTP_ResponseStatus.Failed,
                        //    Results = errorResult,
                        //    Message = errorMessage
                        //};
                    }
                    catch (JsonException jsonEx)
                    {
                        Log.Error($"Failed to parse error response for claim {addAttachment.claim}. Response: {responseContent}. Error: {jsonEx.Message}");

                        return new
                        {
                            Status = ENUM_Danphe_HTTP_ResponseStatus.Failed,
                            Results = responseContent,
                            Message = "Failed to process server response"
                        };
                    }
                }
            }
            catch (Exception ex)
            {
                Log.Error($"Exception is thrown while adding attachment for claim, {addAttachment.claim}, exception details is, \n {ex.Message} ");
                throw new Exception($"Exception is thrown while adding attachment for claim,  {addAttachment.claim}, exception details is, \n {ex.Message} ");
            }
        }
        //public async Task<object> GetSubmittedClaims(SSFDbContext sSFDbContext, string FromDate, string ToDate)
        //{
           
        //}
        public async Task<object> GetSubmittedClaims(SSFDbContext sSFDbContext, string FromDate, string ToDate)
        {
            List<SqlParameter> paramList = new List<SqlParameter>() {
                        new SqlParameter("@FromDate", FromDate),
                        new SqlParameter("@ToDate", ToDate)
                    };
            var submittedClaims = DALFunctions.GetDataTableFromStoredProc("SP_SSF_SubmittedClaims", paramList, sSFDbContext);
            return submittedClaims;
        }
    }
}
