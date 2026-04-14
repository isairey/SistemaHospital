using DanpheEMR.DalLayer;
using DanpheEMR.Enums;
using DanpheEMR.Security;
using DanpheEMR.ServerModel.InsuranceModels;
using DanpheEMR.Services.Insurance.DTOs;
using DanpheEMR.Utilities;
using Newtonsoft.Json;
using Serilog;
using System;
using System.Data.Entity;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using static DanpheEMR.Services.Insurance.DTOs.ClaimUploadFileRequest_DTO;

namespace DanpheEMR.Services.Insurance
{
    public class HIBClaimDocService : IHIBClaimDocService
    {
        public async Task<ClaimUploadFileResponse_DTO> UploadMultipleFile(ClaimUploadMultipleFileRequest_DTO claimUploadMultipleFile, RbacUser currentUser, InsuranceDbContext _insuranceDbContext)
        {
            var responseData = new ClaimUploadFileResponse_DTO();
            bool IsSuccess = false;
            var insuranceClaimDocResponseDetails = new INS_ClaimDocResponseDetails();
            var multipleFileuploadResponse = new ClaimUploadFileResponse_DTO();
            var errorMessage = "";
            var hibClaimDocDetails = GetHibClaimDocDetailsFromParameter(_insuranceDbContext);
            if (hibClaimDocDetails == null)
            {
                Log.Error("InsuranceClaimDocApi Parameter does not exist, Please check for parameters");
                throw new InvalidOperationException("InsuranceClaimDocApi Parameter does not exist, Please check for parameters");
            }
            try
            {
                var client = new HttpClient();
                var ISO_8859_1 = Encoding.GetEncoding("ISO-8859-1");
                client.DefaultRequestHeaders.Accept.Clear();

                //Step 1: Check User
                var userCredentials = new CheckUserRequest_DTO()
                {
                    username = hibClaimDocDetails.Username,
                    password = hibClaimDocDetails.Password
                };
                var jsonContent = JsonConvert.SerializeObject(userCredentials);
                StringContent content = new StringContent(jsonContent, Encoding.UTF8, "application/json");
                var checkUserApi = hibClaimDocDetails.CheckUserAPI;
                client.BaseAddress = new Uri(checkUserApi);

                var response = await client.PostAsync(checkUserApi, content);
                if (response.IsSuccessStatusCode)
                {
                    var data = await response.Content.ReadAsStringAsync();
                    var checkUserResponse = JsonConvert.DeserializeObject<CheckUserResponse_DTO>(data);
                    Log.Information($"Check User Response: {checkUserResponse}");
                    if (checkUserResponse != null && checkUserResponse.status == ENUM_HIBClaimDocResponseStatus.success)
                    {
                        Log.Information($"User is checked in HIB claim Doc Server and access_code is read from there response.");
                        //Step 2: Create ClaimId
                        var createClaimIdRequest = new CreateClaimIdRequest_DTO()
                        {
                            claim_code = claimUploadMultipleFile.claim_id,
                            access_code = checkUserResponse.data.access_code
                        };
                        var createClaimIdRequestString = JsonConvert.SerializeObject(createClaimIdRequest);
                        var createClaimIdUrl = hibClaimDocDetails.CreateClaimIdAPI;
                        var claimIdClient = new HttpClient();
                        claimIdClient.BaseAddress = new Uri(createClaimIdUrl);
                        StringContent createClaimIdStringContent = new StringContent(createClaimIdRequestString, Encoding.UTF8, "application/json");

                        var result = await claimIdClient.PostAsync(createClaimIdUrl, createClaimIdStringContent);
                        if (result.IsSuccessStatusCode)
                        {
                            var createClaimIdResonse = await result.Content.ReadAsStringAsync();
                            var createClaimIdResponseParsed = JsonConvert.DeserializeObject<CreateClaimIdResponse_DTO>(createClaimIdResonse);
                            Log.Information($"Create Claim Id response: {createClaimIdResponseParsed}");
                            if (createClaimIdResponseParsed != null && createClaimIdResponseParsed.status == ENUM_HIBClaimDocResponseStatus.success)
                            {
                                Log.Information($"Create Claim Id Created Successfully: {createClaimIdResponseParsed}");
                                //Step 3: Upload Single File
                                var fileDetails = new ClaimUploadMultipleFileRequest_DTO()
                                {
                                    //claim_id = claimUploadMultipleFile.claim_id,
                                    claim_id = createClaimIdResponseParsed.data.id,
                                    name = claimUploadMultipleFile.name,
                                    access_code = checkUserResponse.data.access_code,
                                    file = claimUploadMultipleFile.file
                                };
                                Log.Information($"Upload Document object is prepared!");

                                var uploadFileString = JsonConvert.SerializeObject(fileDetails);
                                var multipleFileUploadApi = hibClaimDocDetails.UploadMultipleFileAPI;
                                var uploadFileClient = new HttpClient();

                                uploadFileClient.BaseAddress = new Uri(multipleFileUploadApi);
                                StringContent singleFileStringContent = new StringContent(uploadFileString, Encoding.UTF8, "application/json");

                                var fileUploadResponse = await uploadFileClient.PostAsync(multipleFileUploadApi, singleFileStringContent);
                                Log.Information($"Files with access_code is sent to HIB Server, and waiting for the response.");

                                if (fileUploadResponse.IsSuccessStatusCode)
                                {
                                    var fileUploadContent = await fileUploadResponse.Content.ReadAsStringAsync();

                                    multipleFileuploadResponse = JsonConvert.DeserializeObject<ClaimUploadFileResponse_DTO>(fileUploadContent);
                                    if (multipleFileuploadResponse != null && multipleFileuploadResponse.status == ENUM_HIBClaimDocResponseStatus.success)
                                    {
                                        Log.Information($"Files are successfully uploaded to the HIB Server.");
                                        IsSuccess = true;
                                    }
                                    else
                                    {
                                        if (multipleFileuploadResponse != null && multipleFileuploadResponse.data != null)
                                        {
                                            Log.Error($"File uploading failed with error message: {multipleFileuploadResponse.data}");
                                            errorMessage = "File upload Failed with error message:  " + multipleFileuploadResponse.data;
                                        }
                                        IsSuccess = false;

                                    }
                                }
                                else
                                {
                                    if (multipleFileuploadResponse != null && multipleFileuploadResponse.data != null)
                                    {
                                        Log.Error($"File uploading failed with error message: {multipleFileuploadResponse.data}");
                                        errorMessage = "File upload Failed with error message:  " + multipleFileuploadResponse.data;

                                    }
                                    IsSuccess = false;

                                }
                            }
                            else
                            {
                                if (createClaimIdResponseParsed != null && createClaimIdResponseParsed.data != null)
                                {
                                    Log.Error($"Create Claim Id Created failed with error message: {createClaimIdResponseParsed.data}");
                                    errorMessage = "Create Claim Id Created failed with error message: " + createClaimIdResponseParsed.data;
                                }
                                IsSuccess = false;
                            }

                        }
                        else
                        {
                            var createClaimIdFailedResonse = await result.Content.ReadAsStringAsync();
                            var createClaimIdFailedResponseParsed = JsonConvert.DeserializeObject<CreateClaimIdResponse_DTO>(createClaimIdFailedResonse);
                            if (createClaimIdFailedResponseParsed != null && createClaimIdFailedResponseParsed.data != null)
                            {
                                Log.Error($"Claim Id Generation Request failed.");
                                errorMessage = "Claim Id Generation Request Failed with error message:  " + createClaimIdFailedResponseParsed.data;
                            }
                            IsSuccess = false;
                        }
                    }
                    else
                    {
                        Log.Error($"Check User requst failed with error message: {checkUserResponse.data}");
                        IsSuccess = false;
                        errorMessage = "Invalid username or password";
                    }

                    responseData.status = IsSuccess ? ENUM_HIBClaimDocResponseStatus.success : ENUM_HIBClaimDocResponseStatus.fail;
                    responseData.data = IsSuccess ? "File uploaded Successfully" : errorMessage;
                }
                else
                {
                    Log.Error($"Check User requst failed with error message");
                    responseData.status = ENUM_HIBClaimDocResponseStatus.fail;
                    responseData.data = "Invalid username or password";
                }

                //Step 4: Save the response details, even if there is any issue
                SaveClaimDocResponseDetails_MultipleFile(claimUploadMultipleFile, currentUser, IsSuccess, insuranceClaimDocResponseDetails, multipleFileuploadResponse, _insuranceDbContext);

                return responseData;

            }
            catch (Exception ex)
            {
                Log.Error(ex.ToString());
                throw ex;
            }
        }

        public async Task<ClaimUploadFileResponse_DTO> UploadSingleFile(ClaimUploadSingleFileRequest_DTO claimUploadSingleFile, RbacUser currentUser, InsuranceDbContext _insuranceDbContext)
        {
            var responseData = new ClaimUploadFileResponse_DTO();
            bool IsSuccess = false;
            var insuranceClaimDocResponseDetails = new INS_ClaimDocResponseDetails();
            var singleFileUploadResponse = new ClaimUploadFileResponse_DTO();
            var errorMessage = "";
            var hibClaimDocDetails = GetHibClaimDocDetailsFromParameter(_insuranceDbContext);
            if (hibClaimDocDetails == null)
            {
                Log.Error("InsuranceClaimDocApi Parameter does not exist, Please check for parameters");
                throw new InvalidOperationException("InsuranceClaimDocApi Parameter does not exist, Please check for parameters");
            }
            try
            {
                var client = new HttpClient();
                var ISO_8859_1 = Encoding.GetEncoding("ISO-8859-1");
                client.DefaultRequestHeaders.Accept.Clear();

                //Step 1: Check User
                var userCredentials = new CheckUserRequest_DTO()
                {
                    username = hibClaimDocDetails.Username,
                    password = hibClaimDocDetails.Password
                };
                var jsonContent = JsonConvert.SerializeObject(userCredentials);
                StringContent content = new StringContent(jsonContent, Encoding.UTF8, "application/json");
                var checkUserApi = hibClaimDocDetails.CheckUserAPI;
                client.BaseAddress = new Uri(checkUserApi);

                var response = await client.PostAsync(checkUserApi, content);
                if (response.IsSuccessStatusCode)
                {
                    var data = await response.Content.ReadAsStringAsync();
                    var checkUserResponse = JsonConvert.DeserializeObject<CheckUserResponse_DTO>(data);
                    Log.Information($"Check User Response: {checkUserResponse}");
                    if (checkUserResponse != null && checkUserResponse.status == ENUM_HIBClaimDocResponseStatus.success)
                    {
                        Log.Information($"User is checked in HIB claim Doc Server and access_code is read from there response.");
                        //Step 2: Create ClaimId
                        var createClaimIdRequest = new CreateClaimIdRequest_DTO()
                        {
                            claim_code = claimUploadSingleFile.claim_id,
                            access_code = checkUserResponse.data.access_code
                        };
                        var createClaimIdRequestString = JsonConvert.SerializeObject(createClaimIdRequest);

                        var createClaimIdUrl = hibClaimDocDetails.CreateClaimIdAPI;
                        var claimIdClient = new HttpClient();
                        claimIdClient.BaseAddress = new Uri(createClaimIdUrl);
                        StringContent createClaimIdStringContent = new StringContent(createClaimIdRequestString, Encoding.UTF8, "application/json");

                        var result = await claimIdClient.PostAsync(createClaimIdUrl, createClaimIdStringContent);
                        if (result.IsSuccessStatusCode)
                        {
                            var createClaimIdResonse = await result.Content.ReadAsStringAsync();
                            var createClaimIdResponseParsed = JsonConvert.DeserializeObject<CreateClaimIdResponse_DTO>(createClaimIdResonse);

                            if (createClaimIdResponseParsed != null && createClaimIdResponseParsed.status == ENUM_HIBClaimDocResponseStatus.success)
                            {
                                Log.Information($"Create Claim Id Created sSuccessfully: {createClaimIdResponseParsed}");
                                //Step 3: Upload Single File
                                var fileDetails = new ClaimUploadSingleFileRequest_DTO()
                                {
                                    //claim_id = claimUploadSingleFile.claim_id,
                                    claim_id = createClaimIdResponseParsed.data.id,
                                    name = claimUploadSingleFile.name,
                                    access_code = checkUserResponse.data.access_code,
                                    file = claimUploadSingleFile.file
                                };
                                Log.Information($"Upload Document object is prepared!");

                                var uploadFileClient = new HttpClient();
                                var uploadFileString = JsonConvert.SerializeObject(fileDetails);
                                var singleFileUploadApi = hibClaimDocDetails.UploadSingleFileAPI;
                                uploadFileClient.BaseAddress = new Uri(singleFileUploadApi);
                                StringContent singleFileStringContent = new StringContent(uploadFileString, Encoding.UTF8, "application/json");

                                var fileUploadResponse = await uploadFileClient.PostAsync(singleFileUploadApi, singleFileStringContent);
                                Log.Information($"Files with access_code is sent to HIB Server, and waiting for the response.");

                                if (fileUploadResponse.IsSuccessStatusCode)
                                {
                                    var fileUploadContent = await fileUploadResponse.Content.ReadAsStringAsync();

                                    singleFileUploadResponse = JsonConvert.DeserializeObject<ClaimUploadFileResponse_DTO>(fileUploadContent);
                                    if (singleFileUploadResponse != null && singleFileUploadResponse.status == ENUM_HIBClaimDocResponseStatus.success)
                                    {
                                        Log.Information($"Files are successfully uploaded to the HIB Server.");
                                        IsSuccess = true;
                                    }
                                    else
                                    {
                                        if (singleFileUploadResponse != null && singleFileUploadResponse.data != null)
                                        {
                                            Log.Error($"File uploading failed with error message: {singleFileUploadResponse.data}");
                                            errorMessage = "File upload Failed with error:   " + singleFileUploadResponse.data;
                                        }
                                        IsSuccess = false;

                                    }
                                }
                                else
                                {
                                    if (singleFileUploadResponse != null && singleFileUploadResponse.data != null)
                                    {
                                        Log.Error($"File uploading failed with error message: {singleFileUploadResponse.data}");
                                        errorMessage = "File upload Failed with error:  " + singleFileUploadResponse.data;
                                    }
                                    IsSuccess = false;

                                }
                            }
                            else
                            {
                                if (createClaimIdResponseParsed != null && createClaimIdResponseParsed.data != null)
                                {
                                    Log.Error($"File uploading failed with error message: {createClaimIdResponseParsed.data}");
                                    errorMessage = "Failed uploading with error message:" + createClaimIdResponseParsed.data;
                                }
                                IsSuccess = false;
                            }

                        }
                        else
                        {
                            var createClaimIdFailedResonse = await result.Content.ReadAsStringAsync();
                            var createClaimIdFailedResponseParsed = JsonConvert.DeserializeObject<CreateClaimIdResponse_DTO>(createClaimIdFailedResonse);

                            Log.Error($"Claim Id Generation Request failed with error message." + createClaimIdFailedResponseParsed.data);
                            IsSuccess = false;
                            errorMessage = "Claim Id Generation Request failed with error message." + createClaimIdFailedResponseParsed.data;
                        }
                    }
                    else
                    {
                        Log.Error($"Check User requst failed with error message: {checkUserResponse.data}");
                        IsSuccess = false;
                        errorMessage = "Invalid username or password";
                    }

                    responseData.status = IsSuccess ? ENUM_HIBClaimDocResponseStatus.success : ENUM_HIBClaimDocResponseStatus.fail;
                    responseData.data = IsSuccess ? "File uploaded Successfully" : errorMessage;
                }
                else
                {
                    Log.Error($"Check User requst failed with error message");
                    responseData.status = ENUM_HIBClaimDocResponseStatus.fail;
                    responseData.data = "Invalid username or password";
                }

                //Step 4: Save the response details, even if there is any issue
                SaveClaimDocResponseDetails_SingleFile(claimUploadSingleFile, currentUser, IsSuccess, insuranceClaimDocResponseDetails, singleFileUploadResponse, _insuranceDbContext);

                return responseData;
            }
            catch (Exception ex)
            {
                Log.Error(ex.ToString());
                throw ex;
            }

        }

        private void SaveClaimDocResponseDetails_SingleFile(ClaimUploadSingleFileRequest_DTO claimUploadSingleFile, RbacUser currentUser, bool IsSuccess, INS_ClaimDocResponseDetails insuranceClaimDocResponseDetails, ClaimUploadFileResponse_DTO singleFileUploadResponse, InsuranceDbContext _insuranceDbContext)
        {
            //save the details in GovIns_ClaimDocResponseDetails table
            //check if there is already added data in the table for this claimCode
            var currentDateTime = DateTime.Now;
            var claimDocDetailIsAlreadyAdded = _insuranceDbContext.InsuranceClaimDocResponseDetails.FirstOrDefault(a => a.PatientId == claimUploadSingleFile.PatientId && a.ClaimCode.ToString() == claimUploadSingleFile.claim_id);
            if (claimDocDetailIsAlreadyAdded != null)
            {
                claimDocDetailIsAlreadyAdded.ReUploadedDate = currentDateTime;
                if (IsSuccess)
                {
                    claimDocDetailIsAlreadyAdded.ResponseDate = currentDateTime;
                }
                claimDocDetailIsAlreadyAdded.ReUploadedBy = currentUser.EmployeeId;
                claimDocDetailIsAlreadyAdded.ResponseStatus = IsSuccess;

                _insuranceDbContext.Entry(claimDocDetailIsAlreadyAdded).State = EntityState.Modified;
                _insuranceDbContext.SaveChanges();
            }
            else
            {
                insuranceClaimDocResponseDetails.PatientId = claimUploadSingleFile.PatientId;
                insuranceClaimDocResponseDetails.ClaimCode = Int64.Parse(claimUploadSingleFile.claim_id);
                insuranceClaimDocResponseDetails.UploadedDate = currentDateTime;
                if (IsSuccess)
                {
                    insuranceClaimDocResponseDetails.ResponseDate = currentDateTime;
                }
                if (singleFileUploadResponse != null && singleFileUploadResponse.data != null)
                {
                    insuranceClaimDocResponseDetails.ResponseData = singleFileUploadResponse.data.ToString();

                }
                insuranceClaimDocResponseDetails.UploadedBy = currentUser.EmployeeId;
                insuranceClaimDocResponseDetails.ResponseStatus = IsSuccess;
                _insuranceDbContext.InsuranceClaimDocResponseDetails.Add(insuranceClaimDocResponseDetails);
                _insuranceDbContext.SaveChanges();
            }
        }

        private void SaveClaimDocResponseDetails_MultipleFile(ClaimUploadMultipleFileRequest_DTO claimUploadMultipleFiles, RbacUser currentUser, bool IsSuccess, INS_ClaimDocResponseDetails insuranceClaimDocResponseDetails, ClaimUploadFileResponse_DTO singleFileUploadResponse, InsuranceDbContext _insuranceDbContext)
        {
            //save the details in GovIns_ClaimDocResponseDetails table
            //check if there is already added data in the table for this claimCode
            var currentDateTime = DateTime.Now;
            var claimDocDetailIsAlreadyAdded = _insuranceDbContext.InsuranceClaimDocResponseDetails.FirstOrDefault(a => a.PatientId == claimUploadMultipleFiles.PatientId && a.ClaimCode.ToString() == claimUploadMultipleFiles.claim_id);
            if (claimDocDetailIsAlreadyAdded != null)
            {
                claimDocDetailIsAlreadyAdded.ReUploadedDate = currentDateTime;
                if (IsSuccess)
                {
                    claimDocDetailIsAlreadyAdded.ResponseDate = currentDateTime;
                }
                claimDocDetailIsAlreadyAdded.ReUploadedBy = currentUser.EmployeeId;
                claimDocDetailIsAlreadyAdded.ResponseStatus = IsSuccess;

                _insuranceDbContext.Entry(claimDocDetailIsAlreadyAdded).State = EntityState.Modified;
                _insuranceDbContext.SaveChanges();
                Log.Information($"Claim Document Response is successfully saved in our server.");
            }
            else
            {
                insuranceClaimDocResponseDetails.PatientId = claimUploadMultipleFiles.PatientId;
                insuranceClaimDocResponseDetails.ClaimCode = Int64.Parse(claimUploadMultipleFiles.claim_id);
                insuranceClaimDocResponseDetails.UploadedDate = currentDateTime;
                if (IsSuccess)
                {
                    insuranceClaimDocResponseDetails.ResponseDate = currentDateTime;
                }
                insuranceClaimDocResponseDetails.ResponseData = singleFileUploadResponse.data.ToString();
                insuranceClaimDocResponseDetails.UploadedBy = currentUser.EmployeeId;
                insuranceClaimDocResponseDetails.ResponseStatus = IsSuccess;
                _insuranceDbContext.InsuranceClaimDocResponseDetails.Add(insuranceClaimDocResponseDetails);
                _insuranceDbContext.SaveChanges();
                Log.Information($"Claim Document Response is successfully saved in our server.");
            }
        }

        private ClaimDocAPIConfig_DTO GetHibClaimDocDetailsFromParameter(InsuranceDbContext _insuranceDbContext)
        {
            var param = _insuranceDbContext.CFGParameters.FirstOrDefault(p => p.ParameterGroupName == "Insurance" && p.ParameterName == "InsuranceClaimDocApi");
            var parameterValue = new object();
            if (param != null)
            {
                var paramValue = DanpheJSONConvert.DeserializeObject<ClaimDocAPIConfig_DTO>(param.ParameterValue);
                return paramValue;
            }
            else
            {
                return null;
            }
        }
    }
}
