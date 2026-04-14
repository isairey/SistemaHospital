using System.Net.Http.Headers;
using System.Net.Http;
using System.Text;
using System;
using System.Threading.Tasks;
using DanpheEMR.Utilities;
using Newtonsoft.Json;
using DanpheEMR.Core;
using System.Linq;
using DanpheEMR.DalLayer;
using System.Collections.Generic;
using System.Data.SqlClient;
using System.Data;
using Serilog;
using System.Net;
using DanpheEMR.Core.Parameters;
using static DanpheEMR.Services.Insurance.HIBApiResponses;
using DanpheEMR.ServerModel.PatientModels;
using System.Data.Entity;
using DanpheEMR.Enums;
using Microsoft.AspNetCore.Mvc;
using DanpheEMR.CommonTypes;
using Microsoft.AspNetCore.SignalR;
using System.Runtime.InteropServices.ComTypes;

namespace DanpheEMR.Services.Insurance
{
    public class InsuranceService : IInsuranceService
    {
        public async Task<GetPatientDetailsAndEligibilityApiResponse> GetPatientDetails(string NSHINumber, CoreDbContext coreDbContext, InsuranceDbContext insuranceDbContext)
        {
            ParameterModel HIBConfigurationParameter = GetHIBConfigurationParameter(coreDbContext);
            var HIBConfig = DanpheJSONConvert.DeserializeObject<HIBApiConfig>(HIBConfigurationParameter.ParameterValue);
            var hibCredentials = Convert.ToBase64String(Encoding.GetEncoding("ISO-8859-1").GetBytes(HIBConfig.HIBUsername + ":" + HIBConfig.HIBPassword)); var getPatientDetailsAndEligibilityApiResponse = new GetPatientDetailsAndEligibilityApiResponse();

            using (HttpClient client = new HttpClient())
            {

                ConfigureHttpClient(client, HIBConfig, hibCredentials);

                var patientDetailsResponse = client.GetAsync($"Patient/?identifier={NSHINumber}").Result;

                if (patientDetailsResponse.IsSuccessStatusCode)
                {
                    string clientResponse = await patientDetailsResponse.Content.ReadAsStringAsync();
                    getPatientDetailsAndEligibilityApiResponse.PatientDetails = DanpheJSONConvert.DeserializeObject<GetPatientDetailsApiResponse>(clientResponse);

                    using (HttpClient nestedClient = new HttpClient())
                    {
                        ConfigureHttpClient(nestedClient, HIBConfig, hibCredentials);

                        var eligibilityRequest = new EligibilityRequest();
                        eligibilityRequest.resourceType = "EligibilityRequest";
                        eligibilityRequest.patient.reference = "Patient/" + NSHINumber;

                        var jsonContent = JsonConvert.SerializeObject(eligibilityRequest);
                        StringContent content = new StringContent(jsonContent, Encoding.UTF8, "application/json");


                        try
                        {
                            var nestedClientResponse = await nestedClient.PostAsync("EligibilityRequest/", content);
                            if (nestedClientResponse.IsSuccessStatusCode)
                            {
                                var eligibilityRes = await nestedClientResponse.Content.ReadAsStringAsync();
                                getPatientDetailsAndEligibilityApiResponse.EligibilityResponse = DanpheJSONConvert.DeserializeObject<GetEligibilityApiResponse>(eligibilityRes);
                            }
                            else
                            {
                                throw new Exception("Eligibility request failed");
                            }
                        }
                        catch (Exception ex)
                        {
                            Log.Error("Eligibility request failed");
                            throw new Exception("Eligibility request failed");
                        }

                    }
                    return getPatientDetailsAndEligibilityApiResponse;
                }
            }
            throw new Exception("Failed to get API Response");
        }

        private static ParameterModel GetHIBConfigurationParameter(CoreDbContext coreDbContext)
        {
            var HIBConfigurationParameter = coreDbContext.Parameters.Where(a => a.ParameterGroupName == "GovInsurance" && a.ParameterName == "HIBConfiguration").FirstOrDefault();
            if (HIBConfigurationParameter == null)
            {
                throw new Exception("HIB Configuration Parameter Not Found");
            }

            return HIBConfigurationParameter;
        }

        private static void ConfigureHttpClient(HttpClient client, HIBApiConfig config, string hibCredentials)
        {
            client.DefaultRequestHeaders.Clear();
            client.DefaultRequestHeaders.Add("Authorization", "Basic " + hibCredentials);
            client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
            client.DefaultRequestHeaders.Add(config.HIBRemotekey, config.HIBRemoteValue);
            client.BaseAddress = new Uri(config.HIBUrl);
        }

        public async Task<GetEligibilityApiResponse> CheckEligibility(string NSHINumber, CoreDbContext coreDbContext)
        {
            ParameterModel HIBConfigurationParameter = GetHIBConfigurationParameter(coreDbContext);
            var HIBConfig = DanpheJSONConvert.DeserializeObject<HIBApiConfig>(HIBConfigurationParameter.ParameterValue);
            var hibCredentials = Convert.ToBase64String(Encoding.GetEncoding("ISO-8859-1").GetBytes(HIBConfig.HIBUsername + ":" + HIBConfig.HIBPassword));

            using (HttpClient client = new HttpClient())
            {
                ConfigureHttpClient(client, HIBConfig, hibCredentials);

                var eligibilityRequest = new EligibilityRequest();
                eligibilityRequest.resourceType = "EligibilityRequest";
                eligibilityRequest.patient.reference = "Patient/" + NSHINumber;

                var jsonContent = JsonConvert.SerializeObject(eligibilityRequest);
                StringContent content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

                try
                {
                    var nestedClientResponse = await client.PostAsync("EligibilityRequest/", content);
                    if (nestedClientResponse.IsSuccessStatusCode)
                    {
                        var eligibilityRes = await nestedClientResponse.Content.ReadAsStringAsync();
                        return DanpheJSONConvert.DeserializeObject<GetEligibilityApiResponse>(eligibilityRes);
                    }
                    else
                    {
                        throw new Exception("Eligibility request failed");
                    }
                }
                catch (Exception ex)
                {
                    Log.Error(ex.Message);
                    throw new Exception("Eligibility request failed");
                }

            }
        }
        public async Task<PatientSchemeMapModel> GetNHSIPatientDetailLocally(InsuranceDbContext _insuranceDbContext, int patientId, int schemeId)
        {
            var patientSchemeMap = new PatientSchemeMapModel();
            patientSchemeMap = await _insuranceDbContext.PatientSchemeMaps.FirstOrDefaultAsync(a => a.PatientId == patientId && a.SchemeId == schemeId);
            return patientSchemeMap;
        }
        public DataSet GetClaimableInvoicesDetailInfo(string phrmInvoiceIds, string billingInvoiceIds, InsuranceDbContext insuranceDbContext)
        {
            List<SqlParameter> paramList = new List<SqlParameter>() { new SqlParameter("@PhrmTxnIds", phrmInvoiceIds),
             new SqlParameter("@BillTxnIds", billingInvoiceIds)
            };

            DataSet claimableInvoiceInfo = DALFunctions.GetDatasetFromStoredProc("SP_GovIns_ClaimableInvoicesDetailInfo", paramList, insuranceDbContext);
            return claimableInvoiceInfo;
        }
        public bool CheckIfClaimSubmitted(long claimCode, InsuranceDbContext _insuranceDbContext)
        {
            //Not checking ResponseStatus, We should use new claimCode every day which is why we do not check the success status
            var claimResponse = (from i in _insuranceDbContext.InsuranceClaim.Where(ins => ins.ClaimCode == claimCode)
                                 join response in _insuranceDbContext.insuranceClaimAPIResponses on i.ClaimSubmissionId equals response.ClaimSubmissionId
                                 select new
                                 {
                                     ClaimedDate = i.ClaimSubmittedOn,
                                     ClaimResponseId = response.ClaimApiResponseId
                                 }).FirstOrDefault();

            if (claimResponse != null)
            {
                int dayDiff = (int)(DateTime.Now.Date - claimResponse.ClaimedDate.Date).TotalDays;

                if (dayDiff > 1)
                {
                    return true;
                }
            }
            return false;
        }
        public object DoctorsListWithNMCNo(InsuranceDbContext _insuranceDbContext)
        {
            var doctorsList = (from d in _insuranceDbContext.Employee.Where(e => e.Salutation == ENUM_EmployeeSalutation.Dr && e.MedCertificationNo != null)
                               select new
                               {
                                   NMCNo = d.MedCertificationNo,
                                   DoctorName = d.FullName,
                                   EmployeeId = d.EmployeeId
                               }).ToList();
            return doctorsList;
        }

        /// <summary>
        /// This method fetch capping information of an Insuree by Membership Number from HIB Api
        /// </summary>
        /// <param name="NSHINumber"></param>
        /// <param name="coreDbContext"></param>
        /// <returns>This method returns all the capping information of a particular insuree</returns>
        /// <exception cref="Exception"></exception>
        public async Task<CappingResponseInfo> GetCappingResponseByCHFID(string NSHINumber, CoreDbContext coreDbContext)
        {
            ParameterModel HIBConfigurationParameter = GetHIBConfigurationParameter(coreDbContext);
            var HIBConfig = DanpheJSONConvert.DeserializeObject<HIBApiConfig>(HIBConfigurationParameter.ParameterValue);
            var hibCredentials = Convert.ToBase64String(Encoding.GetEncoding("ISO-8859-1").GetBytes(HIBConfig.HIBUsername + ":" + HIBConfig.HIBPassword));

            using (HttpClient client = new HttpClient())
            {

                ConfigureHttpClient(client, HIBConfig, hibCredentials);
                try
                {
                    var cappingResponseInfo = new CappingResponseInfo();
                    var CappingResponse = await client.GetAsync($"cap-validation?CHFID={NSHINumber}");

                    if (CappingResponse.IsSuccessStatusCode)
                    {
                        string clientResponse = await CappingResponse.Content.ReadAsStringAsync();
                        Log.Information($"Capping Entries of PolicyNo({NSHINumber}) is as following: {clientResponse}");
                        cappingResponseInfo = DanpheJSONConvert.DeserializeObject<CappingResponseInfo>(clientResponse);
                    }
                    else
                    {
                        string res = await CappingResponse.Content.ReadAsStringAsync();
                        Log.Error($"Failed to get capping validation information: {res}");
                    }
                    return cappingResponseInfo;
                }
                catch (Exception ex)
                {
                    Log.Error($"Capping Request Failed: {ex}");
                    throw new Exception($"Capping Request Failed: {ex}");
                }
            }
            throw new Exception("Failed to get API Response");
        }
    }
}
