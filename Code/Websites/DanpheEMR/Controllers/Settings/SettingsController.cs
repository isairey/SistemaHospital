using System;
using System.Collections.Generic;
using System.Data;
using System.Data.Entity;
using System.Linq;
using System.Threading.Tasks;
using System.Xml;
using DanpheEMR.CommonTypes;
using DanpheEMR.Controllers.Settings.DTO;
using DanpheEMR.Core.Caching;
using DanpheEMR.Core.Configuration;
using DanpheEMR.DalLayer;
using DanpheEMR.Enums;
using DanpheEMR.Security;
using DanpheEMR.ServerModel;
using DanpheEMR.ServerModel.ClinicalModels;
using DanpheEMR.ServerModel.MasterModels;
using DanpheEMR.ServerModel.SalutationModel;
using DanpheEMR.ServerModel.WardSupplyModels;
using DanpheEMR.Services.DepartmentSettings.DTOs;
using DanpheEMR.Utilities;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using Serilog;

// For more information on enabling Web API for empty projects, visit http://go.microsoft.com/fwlink/?LinkID=397860

namespace DanpheEMR.Controllers
{

    public class SettingsController : CommonController
    {
        private readonly MasterDbContext _masterDbContext;
        private readonly RbacDbContext _rbacDbContext;
        private readonly LabDbContext _labDbContext;
        private readonly ClinicalDbContext _clinicalDbContext;

        public SettingsController(IOptions<MyConfiguration> _config) : base(_config)
        {
            _masterDbContext = new MasterDbContext(connString);
            _rbacDbContext = new RbacDbContext(connString);
            _labDbContext = new LabDbContext(connString);
            _clinicalDbContext = new ClinicalDbContext(connString);
        }
        [HttpGet]
        [Route("Salutation")]
        public IActionResult GetSalutation()
        {
            Func<object> func = () => HandleGetSalutations();
            return InvokeHttpGetFunction(func);
        }

        private object HandleGetSalutations()
        {
            var salutations = _masterDbContext.Salutations.ToList();
            return salutations;
        }


        [HttpGet]
        [Route("Departments")]
        public IActionResult GetDepartments()
        {
            //if (reqType == "departments")

            Func<object> func = () => (from d in _masterDbContext.Departments
                                       select d).OrderBy(d => d.DepartmentName).ToList();
            return InvokeHttpGetFunction(func);
        }

        [HttpGet]
        [Route("PharmacyStores")]

        public IActionResult GetPharmacyStore()
        {

            //if (reqType == "phrm-store")

            var substoreType = Enums.ENUM_StoreCategory.Substore;
            Func<object> func = () => (from s in _masterDbContext.Store
                                       where s.Category == substoreType
                                       select s).OrderBy(s => s.Name).ToList();
            return InvokeHttpGetFunction(func);
        }

        [HttpGet]
        [Route("IntegrationNames")]
        public IActionResult GetIntegrationNames()
        {
            //if (reqType == "integrationName")
            Func<object> func = () => (from i in _masterDbContext.IntegrationName
                                       select i).ToList();
            return InvokeHttpGetFunction(func);
        }
        [HttpGet]
        [Route("Countries")]
        public IActionResult GetCountries()
        {


            //if (reqType == "countries")

            Func<object> func = () => (from d in _masterDbContext.Country
                                       select d).OrderBy(c => c.CountryName).ToList();
            return InvokeHttpGetFunction(func);

        }

        [HttpGet]
        [Route("CountrySubDivisions")]
        public IActionResult GetSubDivisions()
        {


            //if (reqType == "subdivisions")

            Func<object> func = () => (from subd in _masterDbContext.CountrySubDivision
                                       select subd).ToList();
            return InvokeHttpGetFunction(func);

        }

        [HttpGet]
        [Route("Municipalities")]
        public IActionResult GetMunicipalities()
        {

            //if (reqType == "municipalities")
            Func<object> func = () => (from c in _masterDbContext.Country
                                       join d in _masterDbContext.CountrySubDivision on c.CountryId equals d.CountryId
                                       join m in _masterDbContext.Municipalities on d.CountrySubDivisionId equals m.CountrySubDivisionId
                                       select new
                                       {
                                           MunicipalityName = m.MunicipalityName,
                                           MunicipalityId = m.MunicipalityId,
                                           CountryId = m.CountryId,
                                           CountryName = c.CountryName,
                                           CountrySubDivisionName = d.CountrySubDivisionName,
                                           CountrySubDivisionId = d.CountrySubDivisionId,
                                           Type = m.Type,
                                           IsActive = m.IsActive
                                       }).ToList();
            return InvokeHttpGetFunction(func);

        }
        [HttpGet]
        [Route("Reactions")]
        public IActionResult GetReactions()
        {
            //if (reqType == "reactions")

            Func<object> func = () => (from rxn in _masterDbContext.Reactions
                                       select rxn).ToList();
            return InvokeHttpGetFunction(func);
        }

        [HttpGet]
        [Route("CoreCfgParameter")]
        public IActionResult GetCFGParameters()
        {
            //if (reqType == "cfgparameters")

            Func<object> func = () => (from param in _masterDbContext.CFGParameters
                                       select param).OrderBy(p => p.ParameterId).ToList();
            return InvokeHttpGetFunction(func);
        }

        [HttpGet]
        [Route("PrintExportConfiguration")]
        public IActionResult GetPrintExportConfiguration()
        {
            //if (reqType == "get-print-export-configuration")

            Func<object> func = () => (from config in _masterDbContext.PrintExportConfig
                                       select config).OrderBy(b => b.PrintExportSettingsId).ToList();
            return InvokeHttpGetFunction(func);
        }
        [HttpGet]
        [Route("OPDServiceItems")]
        public IActionResult OPDServiceItems()
        {
            var systemDefaultPriceCategory = _masterDbContext.PriceCategorys.FirstOrDefault(p => p.IsDefault == true);
            if (systemDefaultPriceCategory == null)
            {
                throw new InvalidOperationException("There is no default PriceCategory set in the system, Please set if first");
            }
            Func<object> func = () => GetOpdServiceItems(systemDefaultPriceCategory.PriceCategoryId);
            return InvokeHttpGetFunction(func);
        }

        [HttpGet]
        [Route("IntakeOutputType")]
        public IActionResult getIntakeOutputType()
        {
            Func<object> func = () => (from clinicalIntakeOutputParameter in _clinicalDbContext.ClinicalIntakeOutputParameters
                                       select clinicalIntakeOutputParameter
                                                                 ).ToList();
            return InvokeHttpGetFunction(func);
        }
        [HttpGet]
        [Route("IntakeOutputTypeForGrid")]
        public IActionResult getIntakeOutputTypeForGrid()
        {
            DataTable clinicalIntakeOutputParameterList = DALFunctions.GetDataTableFromStoredProc("SP_CLN_GetIntakeOutputParameters", _clinicalDbContext);
            Func<object> func = () => clinicalIntakeOutputParameterList;
            return InvokeHttpGetFunction(func);
        }
        [HttpPost]
        [Route("Salutation")]
        public IActionResult PostSalutation([FromBody] SalutationsModel salutationsData)
        {
            Func<object> func = () => AddSalutation(salutationsData);
            return InvokeHttpPostFunction(func);
        }

        [HttpPut]
        [Route("Salutation")]
        public IActionResult PutSalutation([FromBody] SalutationsModel salutationsData)
        {
            Func<object> func = () => UpdateSalutation(salutationsData);
            return InvokeHttpPutFunction(func);
        }

        private object AddSalutation(SalutationsModel salutationsData)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);

            ValidateSalutation(salutationsData);

            SalutationsModel salutationsModel = new SalutationsModel
            {
                SalutationName = salutationsData.SalutationName,
                IsActive = true,
                IsApplicableForPatients=salutationsData.IsApplicableForPatients,
                CreatedBy = currentUser.EmployeeId,
                CreatedOn = DateTime.Now
            };

            _masterDbContext.Salutations.Add(salutationsModel);
            _masterDbContext.SaveChanges();

            return salutationsModel;
        }

        private object UpdateSalutation(SalutationsModel salutationsData)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);

            ValidateSalutation(salutationsData, true);

            SalutationsModel existingData = _masterDbContext.Salutations
                .FirstOrDefault(x => x.SalutationId == salutationsData.SalutationId);

            if (existingData == null)
            {
                Log.Error($"Salutations with ID {salutationsData.SalutationId} not found.");
                throw new InvalidOperationException("Record not found.");
            }

            existingData.SalutationName = salutationsData.SalutationName;
            existingData.IsApplicableForPatients = salutationsData.IsApplicableForPatients;
            existingData.ModifiedBy = currentUser.EmployeeId;
            existingData.ModifiedOn = DateTime.Now;

            _masterDbContext.SaveChanges();

            return  existingData;
        }

        private void ValidateSalutation(SalutationsModel salutationsData, bool isUpdate = false)
        {
            if (salutationsData == null)
            {
                Log.Error("Salutations value is not provided.");
                throw new InvalidOperationException("No salutation data provided.");
            }

            salutationsData.SalutationName = salutationsData.SalutationName?.Trim();

            bool isSalutationExists = _masterDbContext.Salutations
                .Any(m => m.SalutationName == salutationsData.SalutationName &&
                         (!isUpdate || m.SalutationId != salutationsData.SalutationId));

            if (isSalutationExists)
            {
                Log.Error($"SalutationName '{salutationsData.SalutationName}' already exists.");
                throw new InvalidOperationException("Salutation Name already exists.");
            }
        }


        [HttpPut]
        [Route("activate-deactivate-salutation")]
        public IActionResult ActivateDeactivateSalutationStatus([FromBody] int selectedId)
        {
            Func<object> func = () => ChangeActiveDeactivateStatus(selectedId);
            return InvokeHttpPostFunction(func);
        }

        private object ChangeActiveDeactivateStatus(int selectedId)
        {
            SalutationsModel existingData = _masterDbContext.Salutations.FirstOrDefault(x => x.SalutationId == selectedId);
            if (existingData != null)
            {
                existingData.IsActive = !existingData.IsActive;
                _masterDbContext.SaveChanges();
              
                return existingData;
            }
            else
            {
                throw new Exception("Null Value is not Allowed");
            }

        }

        [HttpPost]
        [Route("PostIntakeOutputVariable")]
        public IActionResult postIntakeOutputVariable([FromBody] ClinicalIntakeOutputParameterModel clinicalIntakeOutput)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>("currentuser");
            ClinicalIntakeOutputParameterModel clinicalIntakeOutputParameterModel = new ClinicalIntakeOutputParameterModel();
            if (clinicalIntakeOutput == null)
            {
                throw new Exception("Null values cannot be added");
            }
            clinicalIntakeOutputParameterModel.ParameterType = clinicalIntakeOutput.ParameterType;
            clinicalIntakeOutputParameterModel.ParameterValue = clinicalIntakeOutput.ParameterValue;
            if (clinicalIntakeOutput.ParameterMainId == 0)
            {
                var nonParentParameterValue = -1;
                clinicalIntakeOutputParameterModel.ParameterMainId = nonParentParameterValue;
            }
            else
            {
                clinicalIntakeOutputParameterModel.ParameterMainId = clinicalIntakeOutput.ParameterMainId;
            }
            clinicalIntakeOutputParameterModel.IsActive = true;
            clinicalIntakeOutputParameterModel.CreatedBy = currentUser.EmployeeId;
            clinicalIntakeOutputParameterModel.CreatedOn = DateTime.Now;
            _clinicalDbContext.ClinicalIntakeOutputParameters.Add(clinicalIntakeOutputParameterModel);
            _clinicalDbContext.SaveChanges();
            Func<object> func = () => clinicalIntakeOutputParameterModel.IntakeOutputId;
            return InvokeHttpPostFunction(func);
        }
        [HttpPut]
        [Route("activate-deactivate-intakeoutput-variables")]
        public IActionResult ActivateDeactivateIntakeOutputVariable([FromBody] ClinicalIntakeOutputParameterModel clinicalIntakeOutputParameterModel)
        {
            ClinicalIntakeOutputParameterModel existingData = _clinicalDbContext.ClinicalIntakeOutputParameters.FirstOrDefault(x => x.IntakeOutputId == clinicalIntakeOutputParameterModel.IntakeOutputId);
            if (existingData != null)
            {
                existingData.IsActive = clinicalIntakeOutputParameterModel.IsActive;
                _clinicalDbContext.SaveChanges();
                Func<object> func = () => existingData;
                return InvokeHttpPostFunction(func);
            }
            else
            {
                throw new Exception("Null Value is not Allowed");
            }
        }
        [HttpPut]
        [Route("UpdateIntakeOutputVariable")]
        public IActionResult UpdateIntakeOutputVariable([FromBody] ClinicalIntakeOutputParameterModel clinicalIntakeOutputParameterModel)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>("currentuser");
            ClinicalIntakeOutputParameterModel existingData = _clinicalDbContext.ClinicalIntakeOutputParameters.FirstOrDefault(x => x.IntakeOutputId == clinicalIntakeOutputParameterModel.IntakeOutputId);
            if (existingData != null)
            {
                existingData.ParameterType = clinicalIntakeOutputParameterModel.ParameterType;
                existingData.ParameterValue = clinicalIntakeOutputParameterModel.ParameterValue;
                existingData.ParameterMainId = clinicalIntakeOutputParameterModel.ParameterMainId;
                existingData.ModifiedBy = currentUser.EmployeeId;
                existingData.ModifiedOn = DateTime.Now;
                _clinicalDbContext.SaveChanges();
                Func<object> func = () => existingData;
                return InvokeHttpPostFunction(func);
            }
            else
            {
                throw new Exception("Null Value is not Allowed");
            }
        }
        private object GetOpdServiceItems(int defaultPriceCategoryId)
        {
            var opdServiceItems = (from servItem in _masterDbContext.BillingServiceItems
                                   join servDep in _masterDbContext.ServiceDepartments
                                   on servItem.ServiceDepartmentId equals servDep.ServiceDepartmentId
                                   join priceCatServItm in _masterDbContext.PriceCategoryServiceItems
                                   on new { serviceItemId = servItem.ServiceItemId, priceCategoryId = defaultPriceCategoryId } equals new { serviceItemId = priceCatServItm.ServiceItemId, priceCategoryId = priceCatServItm.PriceCategoryId }
                                   where servItem.IsActive == true && priceCatServItm.IsActive == true
                                   select new OPDServiceItemDTO
                                   {
                                       ServiceItemId = servItem.ServiceItemId,
                                       ServiceItemName = servItem.ItemName,
                                       IntegrationName = servItem.IntegrationName,
                                       ServiceDepartmentId = servDep.ServiceDepartmentId,
                                       IsActive = servItem.IsActive,
                                       Price = priceCatServItm.Price,
                                       ItemCode = priceCatServItm.ItemLegalCode
                                   }).Where(item => item.IntegrationName == ENUM_IntegrationNames.OPD && item.IsActive == true).ToList();
            return opdServiceItems;
        }

        [HttpGet("GetICD10Groups")]
        public IActionResult GetICD10Groups()
        {
            var context = new MasterDbContext(connString);
            var responseData = new DanpheHTTPResponse<object>();


            try
            {
                var ResultList = (from rptGrp in context.ICD10ReportingGroups
                                  join dGrp in context.ICD10DiseaseGroups on rptGrp.ReportingGroupId equals dGrp.ReportingGroupId into dg
                                  from diseaseGrp in dg.DefaultIfEmpty()
                                  select new
                                  {
                                      rptGrp.ReportingGroupId,
                                      ReportingGroup_SN = rptGrp.SerialNumber,
                                      rptGrp.ReportingGroupName,
                                      DiseaseGroup_SN = diseaseGrp.SerialNumber,
                                      DiseaseGroup_ICD = diseaseGrp.ICDCode,
                                      diseaseGrp.DiseaseGroupName,
                                      //ICD10_Code='',
                                      //ICD10_Name = ''

                                  });


                responseData.Status = "OK";
                responseData.Results = ResultList;
            }
            catch (Exception)
            {
                responseData.Status = "Failed";
            }
            return Ok(responseData);
        }

        [HttpGet]
        [Route("~/api/Settings/GetStoreVerifiers/{StoreId}")]
        public IActionResult GetStoreVerifiers([FromRoute] int StoreId)
        {
            var context = new RbacDbContext(connString);
            var responseData = new DanpheHTTPResponse<object>();


            try
            {
                var StoreVerificationMapList = context.StoreVerificationMapModel.Where(svm => svm.StoreId == StoreId && svm.IsActive == true).OrderBy(svmf => svmf.VerificationLevel).ToList();
                if (StoreVerificationMapList != null)
                {
                    foreach (StoreVerificationMapModel StoreVerifier in StoreVerificationMapList)
                    {
                        StoreVerifier.NewRoleName = "";
                        StoreVerifier.RoleId = context.RolePermissionMaps.FirstOrDefault(rp => rp.PermissionId == StoreVerifier.PermissionId && rp.IsActive == true).RoleId;
                    }
                }
                responseData.Status = "OK";
                responseData.Results = StoreVerificationMapList;
            }
            catch (Exception)
            {
                responseData.Status = "Failed";
            }
            return Ok(responseData);
        }

        [HttpGet]
        [Route("~/api/Settings/BillingCreditOrganization")]
        public async Task<IActionResult> GetBillingCreditOrganization()
        {

            MasterDbContext masterDBContext = new MasterDbContext(connString);
            var responseData = new DanpheHTTPResponse<object>();
            try
            {


                var BillingCreditOrganizations = await (from billingorganization in masterDBContext.BillingCreditOrganization

                                                        select new
                                                        {
                                                            billingorganization.OrganizationName,
                                                            billingorganization.OrganizationId,
                                                            billingorganization.IsActive
                                                        }).OrderByDescending(organization => organization.OrganizationName).ToListAsync();

                if (BillingCreditOrganizations == null || BillingCreditOrganizations.Count() == 0)
                {
                    responseData.Status = ENUM_DanpheHttpResponseText.Failed;
                    responseData.ErrorMessage = "No orgnization found.";
                }
                responseData.Status = ENUM_DanpheHttpResponseText.OK;
                responseData.Results = BillingCreditOrganizations;

            }
            catch (Exception ex)
            {

                responseData.Status = ENUM_DanpheHttpResponseText.Failed;
                responseData.ErrorMessage = ex.Message + " exception details:" + ex.ToString();
            }
            return Ok(responseData);
        }


        [HttpGet]
        [Route("~/api/Settings/PharmacyCreditOrganization")]
        public async Task<IActionResult> GetPharmacyCreditOrganization()
        {

            MasterDbContext masterDBContext = new MasterDbContext(connString);
            var responseData = new DanpheHTTPResponse<object>();
            try
            {


                var creditOrganizations = await (from organization in masterDBContext.PharmacyCreditOrganizations

                                                 select new
                                                 {
                                                     organization.OrganizationName,
                                                     organization.OrganizationId,
                                                     organization.IsActive
                                                 }).OrderByDescending(organization => organization.OrganizationName).ToListAsync();

                if (creditOrganizations == null || creditOrganizations.Count() == 0)
                {
                    responseData.Status = ENUM_DanpheHttpResponseText.Failed;
                    responseData.ErrorMessage = "No orgnization found.";
                }
                responseData.Status = ENUM_DanpheHttpResponseText.OK;
                responseData.Results = creditOrganizations;

            }
            catch (Exception ex)
            {
                responseData.Status = ENUM_DanpheHttpResponseText.Failed;
                responseData.ErrorMessage = "Failed to obtain Credit Organization.";
                return BadRequest(responseData);
            }
            return Ok(responseData);
        }



        [HttpGet]
        [Route("PriceCategories")]

        public IActionResult GetPriceCategories()
        {

            Func<object> func = () => PriceCategoriesList();
            return InvokeHttpGetFunction(func);


        }
        private object PriceCategoriesList()
        {
            var priceCategoryList = DanpheCache.Get("master-pricecategory");
            if (priceCategoryList == null)
            {
                priceCategoryList = _masterDbContext.PriceCategorys.ToList<PriceCategoryModel>();
                DanpheCache.Add("master-pricecategory", priceCategoryList, DateTime.Now.AddMinutes(20));
            }
            return priceCategoryList;
        }


        #region This is used to update the payment mode settings..
        [HttpPut]
        [Route("UpdatePaymentModeSettings")]
        public async Task<string> UpdatePaymentModeSettings()
        {
            DanpheHTTPResponse<object> responseData = new DanpheHTTPResponse<object>();//type 'object' since we have variable return types
            MasterDbContext masterDbContext = new MasterDbContext(connString);
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>("currentuser");
            try
            {
                string strPaymentsMode = this.ReadPostData();
                List<CfgPaymentModesSettings> cfgPaymentModesSettings = DanpheJSONConvert.DeserializeObject<List<CfgPaymentModesSettings>>(strPaymentsMode);
                var PaymentPageId = cfgPaymentModesSettings.Select(a => a.PaymentPageId).FirstOrDefault();
                var rowsToUpdate = await masterDbContext.CfgPaymentModesSettings.Where(a => a.PaymentPageId == PaymentPageId).ToListAsync();
                //var rowToUpdate = await masterDbContext.CfgPaymentModesSettings.Where(a => a.PaymentModeSettingsId == cfgPaymentModesSettings.PaymentModeSettingsId).FirstOrDefaultAsync();
                for (int i = 0; i < rowsToUpdate.Count; i++)
                {
                    rowsToUpdate[i].ShowPaymentDetails = cfgPaymentModesSettings[i].ShowPaymentDetails;
                    rowsToUpdate[i].IsRemarksMandatory = cfgPaymentModesSettings[i].IsRemarksMandatory;
                    rowsToUpdate[i].DisplaySequence = cfgPaymentModesSettings[i].DisplaySequence;
                    rowsToUpdate[i].IsActive = cfgPaymentModesSettings[i].IsActive;
                    rowsToUpdate[i].ModifiedBy = currentUser.EmployeeId;
                    rowsToUpdate[i].ModifiedOn = System.DateTime.Now;

                    masterDbContext.Entry(rowsToUpdate[i]).Property(p => p.ShowPaymentDetails).IsModified = true;
                    masterDbContext.Entry(rowsToUpdate[i]).Property(p => p.IsRemarksMandatory).IsModified = true;
                    masterDbContext.Entry(rowsToUpdate[i]).Property(p => p.DisplaySequence).IsModified = true;
                    masterDbContext.Entry(rowsToUpdate[i]).Property(p => p.IsActive).IsModified = true;
                    masterDbContext.Entry(rowsToUpdate[i]).Property(p => p.ModifiedBy).IsModified = true;
                    masterDbContext.Entry(rowsToUpdate[i]).Property(p => p.ModifiedOn).IsModified = true;
                }
                /*                rowToUpdate.ShowPaymentDetails = cfgPaymentModesSettings.ShowPaymentDetails;
                                rowToUpdate.IsRemarksMandatory = cfgPaymentModesSettings.IsRemarksMandatory;
                                rowToUpdate.DisplaySequence = cfgPaymentModesSettings.DisplaySequence;
                                rowToUpdate.IsActive = cfgPaymentModesSettings.IsActive;
                                rowToUpdate.ModifiedBy = currentUser.EmployeeId;
                                rowToUpdate.ModifiedOn = System.DateTime.Now;

                                masterDbContext.Entry(rowToUpdate).Property(p => p.ShowPaymentDetails).IsModified = true;
                                masterDbContext.Entry(rowToUpdate).Property(p => p.IsRemarksMandatory).IsModified = true;
                                masterDbContext.Entry(rowToUpdate).Property(p => p.DisplaySequence).IsModified = true;
                                masterDbContext.Entry(rowToUpdate).Property(p => p.IsActive).IsModified = true;
                                masterDbContext.Entry(rowToUpdate).Property(p => p.ModifiedBy).IsModified = true;
                                masterDbContext.Entry(rowToUpdate).Property(p => p.ModifiedOn).IsModified = true;*/

                masterDbContext.SaveChanges();

                responseData.Status = "OK";
                responseData.Results = rowsToUpdate;
            }
            catch (Exception ex)
            {
                responseData.Status = "Failed";
                responseData.ErrorMessage = ex.Message + " exception details:" + ex.ToString();
            }

            return DanpheJSONConvert.SerializeObject(responseData, true);
        }
        #endregion

        #region It fetches the Payment modes data..
        [HttpGet]
        [Route("GetPaymentModes")]
        public async Task<string> GetPaymentModes()
        {
            DanpheHTTPResponse<object> responseData = new DanpheHTTPResponse<object>();//type 'object' since we have variable return types
            MasterDbContext masterDbContext = new MasterDbContext(connString);
            try
            {
                var PaymentModes = await masterDbContext.PaymentModes.ToListAsync();
                responseData.Status = "OK";
                responseData.Results = PaymentModes;

            }
            catch (Exception ex)
            {
                responseData.Status = "Failed";
                responseData.ErrorMessage = ex.Message + " exception details:" + ex.ToString();
            }

            return DanpheJSONConvert.SerializeObject(responseData, true);
        }
        #endregion

        #region Fetch all the PaymentModes Sub-categories from the cfgPaymentModesSettings table for different modules and different pages..
        [HttpGet]
        [Route("GetPaymentModeSettings")]
        public async Task<string> GetPaymentModeSettings()
        {
            DanpheHTTPResponse<object> responseData = new DanpheHTTPResponse<object>();//type 'object' since we have variable return types
            MasterDbContext masterDbContext = new MasterDbContext(connString);
            try
            {
                //var PaymentModeSettings = await masterDbContext.CfgPaymentModesSettings.Include(a => a.PaymentPages).ToListAsync();
                var PaymentModeSettings = await masterDbContext.CfgPaymentModesSettings.ToListAsync();
                responseData.Status = "OK";
                responseData.Results = PaymentModeSettings;

            }
            catch (Exception ex)
            {
                responseData.Status = "Failed";
                responseData.ErrorMessage = ex.Message + " exception details:" + ex.ToString();
            }

            return DanpheJSONConvert.SerializeObject(responseData, true);
        }
        #endregion

        #region This handles Activate/Deactivate of Service Department.
        [HttpPut]
        [Route("UpdateServiceDepartmentStatus")]
        public async Task<string> UpdateServiceDepartmentStatus()
        {
            DanpheHTTPResponse<object> responseData = new DanpheHTTPResponse<object>();//type 'object' since we have variable return types
            MasterDbContext masterDbContext = new MasterDbContext(connString);
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>("currentuser");
            try
            {
                string strServiceDepartment = this.ReadPostData();
                ServiceDepartmentModel serviceDepartment = DanpheJSONConvert.DeserializeObject<ServiceDepartmentModel>(strServiceDepartment);

                var rowToUpdate = await masterDbContext.ServiceDepartments.Where(a => a.ServiceDepartmentId == serviceDepartment.ServiceDepartmentId).FirstOrDefaultAsync();

                rowToUpdate.IsActive = serviceDepartment.IsActive;
                rowToUpdate.ModifiedBy = currentUser.EmployeeId;
                rowToUpdate.ModifiedOn = System.DateTime.Now;

                masterDbContext.Entry(rowToUpdate).Property(p => p.IsActive).IsModified = true;
                masterDbContext.Entry(rowToUpdate).Property(p => p.ModifiedBy).IsModified = true;
                masterDbContext.Entry(rowToUpdate).Property(p => p.ModifiedOn).IsModified = true;
                await masterDbContext.SaveChangesAsync();

                responseData.Status = "OK";
                responseData.Results = rowToUpdate;
            }
            catch (Exception ex)
            {

                responseData.Status = "Failed";
                responseData.ErrorMessage = ex.Message + " exception details:" + ex.ToString();
            }
            return DanpheJSONConvert.SerializeObject(responseData, true);

        }

        #endregion

        [HttpPost]
        [Route("Department")]
        public IActionResult PostDepartment()
        {
            //if (reqType == "department")
            string ipDataStr = this.ReadPostData();
            Func<object> func = () => SaveDepartment(ipDataStr);
            return InvokeHttpPostFunction(func);

        }



        [HttpPost]
        [Route("PharmacyStore")]
        public IActionResult PostStore()
        {
            //if (reqType == "store")
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            string ipDataStr = this.ReadPostData();
            Func<object> func = () => SaveStore(ipDataStr, currentUser);
            return InvokeHttpPostFunction(func);

        }



        [HttpPost]
        [Route("Country")]
        public IActionResult PostCountry()
        {
            //if (reqType == "country")
            string ipDataStr = this.ReadPostData();
            Func<object> func = () => SaveCountry(ipDataStr);
            return InvokeHttpPostFunction(func);
        }


        [HttpPost]
        [Route("CountrySubDivision")]
        public IActionResult PostSubDivision()
        {
            //if (reqType == "subdivision")

            string ipDataStr = this.ReadPostData();
            Func<object> func = () => SaveSubDivision(ipDataStr);
            return InvokeHttpPostFunction(func);
        }


        [HttpPost]
        [Route("Municipality")]
        public IActionResult PostMunicipality()
        {
            // if (reqType == "municipality")
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            string ipDataStr = this.ReadPostData();
            Func<object> func = () => SaveMunicipality(ipDataStr, currentUser);
            return InvokeHttpPostFunction(func);
        }

        [HttpPost]
        [Route("Reaction")]
        public IActionResult PostReaction()
        {
            //if (reqType == "reaction")
            string ipDataStr = this.ReadPostData();
            Func<object> func = () => SaveReaction(ipDataStr);
            return InvokeHttpPostFunction(func);
        }


        [HttpPost]
        [Route("LabTest")]
        public IActionResult PostLabItem()
        {
            //if (reqType == "lab-item")
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            string ipDataStr = this.ReadPostData();
            Func<object> func = () => SaveLabItem(ipDataStr, currentUser);
            return InvokeHttpPostFunction(func);
        }

        [HttpPost]
        [Route("Bank")]
        public IActionResult PostBank()
        {
            //if (reqType == "post-bank")
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            string ipDataStr = this.ReadPostData();
            Func<object> func = () => SaveBank(ipDataStr, currentUser);
            return InvokeHttpPostFunction(func);
        }



        [HttpPost]
        [Route("PrintExportConfiguration")]
        public IActionResult PostPrintExportConfiguration()
        {
            //if (reqType == "post-print-export-configuration")

            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            string ipDataStr = this.ReadPostData();
            Func<object> func = () => SavePrintExportConfiguration(ipDataStr, currentUser);
            return InvokeHttpPostFunction(func);
        }
        [HttpPost]
        [Route("PriceCategory")]
        public IActionResult AddPriceCategories([FromBody] PriceCategoryDTO priceCategoryDTO)
        {
            //[Route("~/api/Settings/PostPriceCategory")]
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => PostPriceCategories(priceCategoryDTO, currentUser);
            return InvokeHttpPostFunction(func);


        }
        private object PostPriceCategories(PriceCategoryDTO priceCategoryDTO, RbacUser currentUser)
        {
            if (priceCategoryDTO == null)
            {
                throw new Exception("Null value cannot be added");
            }
            else
            {
                PriceCategoryModel priceCategory = new PriceCategoryModel();
                priceCategory.CreatedBy = currentUser.EmployeeId;
                priceCategory.CreatedOn = System.DateTime.Now;
                priceCategory.PriceCategoryId = priceCategoryDTO.PriceCategoryId;
                priceCategory.PriceCategoryName = priceCategoryDTO.PriceCategoryName;
                priceCategory.Description = priceCategoryDTO.Description;
                priceCategory.PriceCategoryCode = priceCategoryDTO.PriceCategoryCode;
                priceCategory.IsDefault = priceCategoryDTO.IsDefault;
                priceCategory.ShowInAdmission = priceCategoryDTO.ShowInAdmission;
                priceCategory.ShowInRegistration = priceCategoryDTO.ShowInRegistration;
                priceCategory.IsActive = true;
                //priceCategory.IsRateDifferent = false;
                //priceCategory.IsCoPayment = false;
                _masterDbContext.PriceCategorys.Add(priceCategory);
                _masterDbContext.SaveChanges();

          
                var priceCategories = _masterDbContext.PriceCategorys.ToList<PriceCategoryModel>();
                
                string key = "master-pricecategory";
                
                DanpheCache.RemoveCache(key);

                DanpheCache.Add(key, priceCategories, DateTime.Now.AddMinutes(20));
               
                return priceCategory;
            }
        }

        [HttpPut]
        [Route("Department")]
        public IActionResult PutDepartment()

        {
            // if (reqType == "department")
            string ipDataStr = this.ReadPostData();
            Func<object> func = () => UpdateDepartment(ipDataStr);
            return InvokeHttpPutFunction(func);

        }

        [HttpPut]
        [Route("StoreActivation")]
        public IActionResult PutStoreActivation()
        {
            // if (reqType == "storeActivation")
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            string ipDataStr = this.ReadPostData();
            Func<object> func = () => UpdatestoreActivation(ipDataStr, currentUser);
            return InvokeHttpPutFunction(func);
        }

        [HttpPut]
        [Route("PharmacyStore")]
        public IActionResult PutStore()
        {
            //if (reqType == "store")
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            string ipDataStr = this.ReadPostData();
            Func<object> func = () => UpdatPharmacyStore(ipDataStr, currentUser);
            return InvokeHttpPutFunction(func);
        }

        [HttpPut]
        [Route("Country")]
        public IActionResult PutCountry()
        {
            //if (reqType == "country")
            string ipDataStr = this.ReadPostData();
            Func<object> func = () => UpdatCountry(ipDataStr);
            return InvokeHttpPutFunction(func);
        }



        [HttpPut]
        [Route("MunicipalityStatus")]
        public IActionResult PutMunicipalityStatus(int municipalityId)
        {

            // if (reqType == "municipalityStatusUpdate")
            //string munIdStr = this.ReadQueryStringData("municipalityId");
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            string ipDataStr = this.ReadPostData();
            Func<object> func = () => UpdatMunicipalityStatus(municipalityId, currentUser);
            return InvokeHttpPutFunction(func);
        }


        [HttpPut]
        [Route("CountrySubDivision")]
        public IActionResult PutSubDivision()
        {

            //  if (reqType == "subdivision")
            string ipDataStr = this.ReadPostData();
            Func<object> func = () => UpdatCountrySubDivision(ipDataStr);
            return InvokeHttpPutFunction(func);
        }


        [HttpPut]
        [Route("Reaction")]
        public IActionResult PutReaction()
        {

            // if (reqType == "reaction")
            string ipDataStr = this.ReadPostData();
            Func<object> func = () => UpdateReaction(ipDataStr);
            return InvokeHttpPutFunction(func);
        }



        [HttpPut]
        [Route("CoreCfgParameter")]
        public IActionResult PutCFGParameter()
        {

            // if (reqType == "update-parameter")
            string ipDataStr = this.ReadPostData();
            Func<object> func = () => UpdateCFGParameter(ipDataStr);
            return InvokeHttpPutFunction(func);
        }


        [HttpPut]
        [Route("Bank")]
        public IActionResult PutBank()
        {

            // if (reqType == "put-bank")
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            string ipDataStr = this.ReadPostData();
            Func<object> func = () => UpdateBank(ipDataStr, currentUser);
            return InvokeHttpPutFunction(func);
        }

        [HttpPut]
        [Route("PrintExportConfiguration")]
        public IActionResult PutPrintExportConfiguration()
        {

            //if (reqType == "put-print-export-configuration")
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            string ipDataStr = this.ReadPostData();
            Func<object> func = () => UpdatePrintExportConfiguration(ipDataStr, currentUser);
            return InvokeHttpPutFunction(func);
        }

        [HttpGet]
        [Route("GetPriceCategories")]
        public IActionResult GetPriceCategory()
        {
            Func<object> func = () => GetPriceCategoriesFromCache();
            return InvokeHttpGetFunction(func);
        }

        private object GetPriceCategoriesFromCache()
        {
            var priceCategoryList = DanpheCache.Get("master-pricecategory");
            if (priceCategoryList == null)
            {
                priceCategoryList = _masterDbContext.PriceCategorys.ToList<PriceCategoryModel>();
                DanpheCache.Add("master-pricecategory", priceCategoryList, DateTime.Now.AddMinutes(20));
            }
            return priceCategoryList;
        }

        #region This handles Update of Price Category.
        [HttpPut]
        [Route("PriceCategory")]

        public IActionResult UpdatePriceCategory([FromBody] PriceCategoryDTO priceCategoryDTO)
        {
            //[Route("~/api/Settings/UpdatePriceCategory")]
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => PutPriceCategories(priceCategoryDTO, currentUser);
            return InvokeHttpPutFunction(func);


        }

        private object PutPriceCategories(PriceCategoryDTO priceCategoryDTO, RbacUser currentUser)
        {

            if (priceCategoryDTO == null)
            {
                throw new Exception("Null value cannot be added");
            }
            else
            {
                var rowToUpdate = _masterDbContext.PriceCategorys.Where(a => a.PriceCategoryId == priceCategoryDTO.PriceCategoryId).FirstOrDefault();
                rowToUpdate.PriceCategoryName = priceCategoryDTO.PriceCategoryName;
                rowToUpdate.PriceCategoryCode = priceCategoryDTO.PriceCategoryCode;
                rowToUpdate.Description = priceCategoryDTO.Description;
                rowToUpdate.ShowInRegistration = priceCategoryDTO.ShowInRegistration;
                rowToUpdate.ShowInAdmission = priceCategoryDTO.ShowInAdmission;
                rowToUpdate.IsDefault = priceCategoryDTO.IsDefault;
                rowToUpdate.IsPharmacyRateDifferent = priceCategoryDTO.IsPharmacyRateDifferent;
                rowToUpdate.ModifiedBy = currentUser.EmployeeId;
                rowToUpdate.ModifiedOn = DateTime.Now;

                _masterDbContext.SaveChanges();
                var updatedPriceCategories = _masterDbContext.PriceCategorys.ToList<PriceCategoryModel>();
                string key = "master-pricecategory";
                DanpheCache.RemoveCache(key);
                DanpheCache.Add(key, updatedPriceCategories, DateTime.Now.AddMinutes(20)); // cache expiry time

                return priceCategoryDTO;
            }
        }

        #endregion

        [HttpPut]
        [Route("~/api/Settings/PriceCategoryActivation")]
        public async Task<IActionResult> ActivatePriceCategory(int PriceCategoryId, bool IsActive)
        {
            DanpheHTTPResponse<object> responseData = new DanpheHTTPResponse<object>();
            MasterDbContext masterDbContext = new MasterDbContext(connString);
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>("currentuser");
            try
            {
                var rowToUpdate = await masterDbContext.PriceCategorys.Where(a => a.PriceCategoryId == PriceCategoryId).FirstOrDefaultAsync();
                if (rowToUpdate == null)
                {
                    responseData.Status = ENUM_DanpheHttpResponseText.Failed;
                    responseData.ErrorMessage = "Price category not found.";
                    return NotFound(responseData);
                }
                rowToUpdate.IsActive = IsActive;
                await masterDbContext.SaveChangesAsync();
                string Key = "master-pricecategory";
                DanpheCache.RemoveCache(Key);
                var updatedPriceCategories = await masterDbContext.PriceCategorys.ToListAsync();
                DanpheCache.Add(Key, updatedPriceCategories, DateTime.Now.AddMinutes(20));
                responseData.Status = ENUM_DanpheHttpResponseText.OK;
                responseData.Results = rowToUpdate;
            }
            catch (Exception ex)
            {
                responseData.Status = ENUM_DanpheHttpResponseText.Failed;
                responseData.ErrorMessage = ex.Message + " exception details:" + ex.ToString();
            }
            return Ok(responseData);

        }
        private object SaveDepartment(string ipDataStr)
        {

            DepartmentModel deptModel = DanpheJSONConvert.DeserializeObject<DepartmentModel>(ipDataStr);
            bool departmentExist = _masterDbContext.Departments.Any(x => x.DepartmentName == deptModel.DepartmentName);
            if (!departmentExist)
            {
                deptModel.CreatedOn = System.DateTime.Now;
                _masterDbContext.Departments.Add(deptModel);
                _masterDbContext.SaveChanges();

                if (deptModel.ServiceItemsList != null && deptModel.ServiceItemsList.Count > 0)
                {
                    UpdateBillItemsOfDepartment(deptModel, _masterDbContext);
                }


            }
            return deptModel;
        }
        private object SaveStore(string ipDataStr, RbacUser currentUser)
        {
            using (var dbContextTransaction = _rbacDbContext.Database.BeginTransaction())
            {
                try
                {
                    PHRMStoreModel storeModel = DanpheJSONConvert.DeserializeObject<PHRMStoreModel>(ipDataStr);
                    //create permission so that admin can create substore access right to the user

                    //add permission in store table
                    storeModel.PermissionId = SubstoreBL.CreatePermissionForStore(storeModel.Name, currentUser, _rbacDbContext);
                    //create store after creating permission
                    storeModel = SubstoreBL.CreateStore(storeModel, _rbacDbContext);

                    //create permission for each verifier
                    if (storeModel.StoreVerificationMapList != null)
                    {
                        int CurrentVerificationLevel = 1;
                        int MaxVerificationLevel = storeModel.MaxVerificationLevel;
                        foreach (var storeVerificationMap in storeModel.StoreVerificationMapList)
                        {
                            SubstoreBL.CreateAndMapVerifiersWithStore(storeVerificationMap, storeModel, CurrentVerificationLevel, MaxVerificationLevel, currentUser, _rbacDbContext);
                            CurrentVerificationLevel++;
                        }
                    }
                    dbContextTransaction.Commit();
                    return storeModel;


                }
                catch (Exception ex)
                {
                    dbContextTransaction.Rollback();
                    throw ex;
                }
            }
        }

        private object SaveCountry(string ipDataStr)
        {

            CountryModel countryModel = DanpheJSONConvert.DeserializeObject<CountryModel>(ipDataStr);
            countryModel.CreatedOn = System.DateTime.Now;
            _masterDbContext.Country.Add(countryModel);
            _masterDbContext.SaveChanges();
            return countryModel;

        }
        private object SaveSubDivision(string ipDataStr)
        {
            CountrySubDivisionModel subDivisionModel = DanpheJSONConvert.DeserializeObject<CountrySubDivisionModel>(ipDataStr);
            subDivisionModel.CreatedOn = System.DateTime.Now;
            _masterDbContext.CountrySubDivision.Add(subDivisionModel);
            _masterDbContext.SaveChanges();
            return subDivisionModel;
        }

        private object SaveReaction(string ipDataStr)
        {

            ReactionModel rxnModel = DanpheJSONConvert.DeserializeObject<ReactionModel>(ipDataStr);
            rxnModel.CreatedOn = System.DateTime.Now;

            bool rxnExists = _masterDbContext.Reactions.Any((rxn => rxn.ReactionName.Equals(rxnModel.ReactionName) || rxn.ReactionCode.Equals(rxnModel.ReactionCode)));

            if (rxnExists)
            {

                throw new Exception("Rxn with Duplicate Name or Code cannot be Added");
            }
            else
            {
                _masterDbContext.Reactions.Add(rxnModel);
                _masterDbContext.SaveChanges();

            }
            return rxnModel;
        }

        private object SaveMunicipality(string ipDataStr, RbacUser currentUser)
        {

            MunicipalityModel model = DanpheJSONConvert.DeserializeObject<MunicipalityModel>(ipDataStr);
            if (model.MunicipalityId > 0)
            {
                var selectedMun = _masterDbContext.Municipalities.Where(m => m.MunicipalityId == model.MunicipalityId).FirstOrDefault();
                selectedMun.CountryId = model.CountryId;
                selectedMun.CountrySubDivisionId = model.CountrySubDivisionId;
                selectedMun.MunicipalityName = model.MunicipalityName;
                selectedMun.Type = model.Type;
                selectedMun.ModifiedOn = System.DateTime.Now;
                selectedMun.ModifiedBy = currentUser.EmployeeId;
                _masterDbContext.Entry(selectedMun).State = EntityState.Modified;
                _masterDbContext.Entry(selectedMun).Property(x => x.CountryId).IsModified = true;
                _masterDbContext.Entry(selectedMun).Property(x => x.CountrySubDivisionId).IsModified = true;
                _masterDbContext.Entry(selectedMun).Property(x => x.MunicipalityName).IsModified = true;
                _masterDbContext.Entry(selectedMun).Property(x => x.ModifiedBy).IsModified = true;
                _masterDbContext.Entry(selectedMun).Property(x => x.ModifiedOn).IsModified = true;
                _masterDbContext.Entry(selectedMun).Property(x => x.Type).IsModified = true;
            }
            else
            {
                model.CreatedOn = System.DateTime.Now;
                model.CreatedBy = currentUser.EmployeeId;
                _masterDbContext.Municipalities.Add(model);
            }
            _masterDbContext.SaveChanges();
            return model;
        }


        private object SaveLabItem(string ipDataStr, RbacUser currentUser)
        {

            LabTestModel labItem = DanpheJSONConvert.DeserializeObject<LabTestModel>(ipDataStr);

            using (var dbContextTransaction = _labDbContext.Database.BeginTransaction())
            {
                try
                {
                    labItem.CreatedOn = DateTime.Now;
                    labItem.CreatedBy = currentUser.EmployeeId;
                    //set default reporttemplateid if its not provided from client-side.
                    if (labItem.ReportTemplateId == 0)
                    {
                        var defTemplate = _labDbContext.LabReportTemplates
                            .Where(rep => rep.IsDefault && rep.IsDefault).FirstOrDefault();
                        if (defTemplate != null)
                        {
                            labItem.ReportTemplateId = defTemplate.ReportTemplateID;
                        }
                    }

                    //make Lab test code and procedure code here after savechanges()
                    _labDbContext.LabTests.Add(labItem);
                    _labDbContext.SaveChanges();
                    labItem.LabTestCode = "L-" + labItem.LabTestId.ToString("D6");//make LabTest code with 0 leading 
                    labItem.ProcedureCode = "LAB-" + labItem.LabTestId.ToString("D6");//making Procedure code with 0 leading vaues                                        
                    _labDbContext.SaveChanges();
                    dbContextTransaction.Commit();
                }
                catch (Exception ex)
                {
                    dbContextTransaction.Rollback();
                    throw ex;
                }
            }
            return labItem;

        }
        private object SaveBank(string ipDataStr, RbacUser currentUser)
        {

            BanksModel bankDetail = DanpheJSONConvert.DeserializeObject<BanksModel>(ipDataStr);

            bankDetail.CreatedBy = currentUser.EmployeeId;
            bankDetail.CreatedOn = DateTime.Now;

            _masterDbContext.Banks.Add(bankDetail);
            _masterDbContext.SaveChanges();
            return bankDetail;
        }

        private object SavePrintExportConfiguration(string ipDataStr, RbacUser currentUser)
        {

            PrintExportConfigModel printExportConfigModel = DanpheJSONConvert.DeserializeObject<PrintExportConfigModel>(ipDataStr);
            printExportConfigModel.CreatedBy = currentUser.EmployeeId;
            printExportConfigModel.CreatedOn = DateTime.Now;
            _masterDbContext.PrintExportConfig.Add(printExportConfigModel);
            _masterDbContext.SaveChanges();
            return printExportConfigModel;

        }
        private object UpdateDepartment(string ipDataStr)
        {
            DepartmentModel clientDept = DanpheJSONConvert.DeserializeObject<DepartmentModel>(ipDataStr);
            _masterDbContext.Departments.Attach(clientDept);
            _masterDbContext.Entry(clientDept).State = EntityState.Modified;
            _masterDbContext.Entry(clientDept).Property(x => x.CreatedOn).IsModified = false;
            _masterDbContext.Entry(clientDept).Property(x => x.CreatedBy).IsModified = false;
            clientDept.ModifiedOn = System.DateTime.Now;
            if (clientDept.ServiceItemsList != null && clientDept.ServiceItemsList.Count > 0)
            {
                UpdateBillItemsOfDepartment(clientDept, _masterDbContext);
            }
            _masterDbContext.SaveChanges();
            return clientDept;

        }
        private object UpdatestoreActivation(string ipDataStr, RbacUser currentUser)
        {
            using (var dbContextTransaction = _rbacDbContext.Database.BeginTransaction())
            {
                try
                {
                    int storeId = DanpheJSONConvert.DeserializeObject<int>(ipDataStr);
                    Boolean NewActiveStatus = SubstoreBL.ActivateDeactivateStore(storeId, currentUser, _rbacDbContext);
                    //take the NewActiveStatus and set it to all the permission
                    //change the permission as well.
                    SubstoreBL.ActivateDeactivateAllStorePermission(storeId, NewActiveStatus, currentUser, _rbacDbContext);
                    dbContextTransaction.Commit();
                }
                catch (Exception ex)
                {
                    dbContextTransaction.Rollback();
                    throw ex;
                }
            }
            return true;
        }

        private object UpdatPharmacyStore(string ipDataStr, RbacUser currentUser)
        {

            using (var dbContextTransaction = _rbacDbContext.Database.BeginTransaction())
            {
                try
                {
                    PHRMStoreModel store = DanpheJSONConvert.DeserializeObject<PHRMStoreModel>(ipDataStr);
                    if (SubstoreBL.CheckForStoreDuplication(store.Name, store.StoreId, _rbacDbContext))
                    {
                        Exception ex = new Exception("Substore Already Exists.");
                        throw ex;
                    }
                    var OldStoreName = _rbacDbContext.Store.AsNoTracking().FirstOrDefault(a => a.StoreId == store.StoreId).Name.ToString();
                    var NewStoreName = store.Name;
                    //change the permission first as well.
                    if (OldStoreName != NewStoreName)
                    {
                        SubstoreBL.UpdateStorePermissionName(NewStoreName, store.PermissionId, currentUser, _rbacDbContext);

                        SubstoreBL.UpdateStoreVerifierPermission(store, currentUser, _rbacDbContext);
                    }
                    //if new verification level is added.
                    var OldMaxVerificationLevel = _rbacDbContext.Store.AsNoTracking().FirstOrDefault(a => a.StoreId == store.StoreId).MaxVerificationLevel;
                    var NewMaxVerificationLevel = store.MaxVerificationLevel;
                    if (NewMaxVerificationLevel > OldMaxVerificationLevel)
                    {
                        //create the new verification level and necessary permission level
                        foreach (StoreVerificationMapModel storeVerificationMapModel in store.StoreVerificationMapList)
                        {
                            if (storeVerificationMapModel.VerificationLevel > OldMaxVerificationLevel)
                            {
                                SubstoreBL.CreateAndMapVerifiersWithStore(storeVerificationMapModel, store, ++OldMaxVerificationLevel, NewMaxVerificationLevel, currentUser, _rbacDbContext);
                            }
                        }
                    }
                    SubstoreBL.UpdateRoleForVerifiers(store, currentUser, _rbacDbContext);
                    _rbacDbContext.Store.Attach(store);
                    _rbacDbContext.Entry(store).State = EntityState.Modified;
                    _rbacDbContext.Entry(store).Property(x => x.CreatedOn).IsModified = false;
                    _rbacDbContext.Entry(store).Property(x => x.CreatedBy).IsModified = false;
                    store.ModifiedOn = System.DateTime.Now;
                    store.ModifiedBy = currentUser.EmployeeId;

                    _rbacDbContext.SaveChanges();
                    dbContextTransaction.Commit();
                    return store;
                }
                catch (Exception ex)
                {
                    dbContextTransaction.Rollback();
                    throw ex;
                }


            }
        }
        private object UpdatCountry(string ipDataStr)
        {

            CountryModel countryInfo = DanpheJSONConvert.DeserializeObject<CountryModel>(ipDataStr);
            _masterDbContext.Country.Attach(countryInfo);
            _masterDbContext.Entry(countryInfo).State = EntityState.Modified;
            _masterDbContext.Entry(countryInfo).Property(x => x.CreatedOn).IsModified = false;
            _masterDbContext.Entry(countryInfo).Property(x => x.CreatedBy).IsModified = false;
            countryInfo.ModifiedOn = System.DateTime.Now;
            _masterDbContext.SaveChanges();

            return countryInfo;
        }

        private object UpdatMunicipalityStatus(int municipalityId, RbacUser currentUser)
        {

            //int municipalityId = Convert.ToInt32(munIdStr);
            var selMunicipality = _masterDbContext.Municipalities.Where(m => m.MunicipalityId == municipalityId).FirstOrDefault();
            selMunicipality.IsActive = !selMunicipality.IsActive;
            selMunicipality.ModifiedBy = currentUser.EmployeeId;
            selMunicipality.ModifiedOn = System.DateTime.Now;
            _masterDbContext.Entry(selMunicipality).State = EntityState.Modified;
            _masterDbContext.Entry(selMunicipality).Property(x => x.ModifiedOn).IsModified = true;
            _masterDbContext.Entry(selMunicipality).Property(x => x.ModifiedBy).IsModified = true;
            _masterDbContext.Entry(selMunicipality).Property(x => x.IsActive).IsModified = true;
            _masterDbContext.SaveChanges();
            return selMunicipality;
        }

        private object UpdatCountrySubDivision(string ipDataStr)
        {

            CountrySubDivisionModel subdivInfo = DanpheJSONConvert.DeserializeObject<CountrySubDivisionModel>(ipDataStr);
            _masterDbContext.CountrySubDivision.Attach(subdivInfo);
            _masterDbContext.Entry(subdivInfo).State = EntityState.Modified;
            _masterDbContext.Entry(subdivInfo).Property(x => x.CreatedOn).IsModified = false;
            _masterDbContext.Entry(subdivInfo).Property(x => x.CreatedBy).IsModified = false;
            subdivInfo.ModifiedOn = System.DateTime.Now;
            _masterDbContext.SaveChanges();
            return subdivInfo;
        }

        private object UpdateReaction(string ipDataStr)
        {


            ReactionModel rxnInfo = DanpheJSONConvert.DeserializeObject<ReactionModel>(ipDataStr);
            bool rxnExists = _masterDbContext.Reactions.Any(rxn =>
                                            (rxn.ReactionName.Equals(rxnInfo.ReactionName) || rxn.ReactionCode.Equals(rxnInfo.ReactionCode))
                                            && !rxn.ReactionId.Equals(rxnInfo.ReactionId));

            if (!rxnExists)
            {
                _masterDbContext.Reactions.Attach(rxnInfo);
                _masterDbContext.Entry(rxnInfo).State = EntityState.Modified;
                _masterDbContext.Entry(rxnInfo).Property(x => x.CreatedOn).IsModified = false;
                _masterDbContext.Entry(rxnInfo).Property(x => x.CreatedBy).IsModified = false;
                rxnInfo.ModifiedOn = System.DateTime.Now;
                _masterDbContext.SaveChanges();
                return rxnInfo;
            }
            else
            {
                throw new Exception("Rxn with Duplicate Name or Code cannot be Added");

            }

        }

        private object UpdateCFGParameter(string ipDataStr)
        {

            CfgParameterModel parameter = DanpheJSONConvert.DeserializeObject<CfgParameterModel>(ipDataStr);
            var parmToUpdate = (from paramData in _masterDbContext.CFGParameters
                                where paramData.ParameterId == parameter.ParameterId
                                //no need of below comparision since parameter id is Primary Key and we can compare only to it.
                                //&& paramData.ParameterName == parameter.ParameterName
                                //&& paramData.ParameterGroupName == parameter.ParameterGroupName
                                select paramData
                                ).FirstOrDefault();

            parmToUpdate.ParameterValue = parameter.ParameterValue;
            _masterDbContext.Entry(parmToUpdate).Property(p => p.ParameterValue).IsModified = true;
            _masterDbContext.SaveChanges();
            return parmToUpdate;

        }

        private object UpdateBank(string ipDataStr, RbacUser currentUser)
        {
            BanksModel bankDetail = DanpheJSONConvert.DeserializeObject<BanksModel>(ipDataStr);
            bankDetail.ModifiedBy = currentUser.EmployeeId;
            bankDetail.ModifiedOn = DateTime.Now;

            _masterDbContext.Banks.Attach(bankDetail);

            _masterDbContext.Entry(bankDetail).Property(x => x.BankName).IsModified = true;
            _masterDbContext.Entry(bankDetail).Property(x => x.BankShortName).IsModified = true;
            _masterDbContext.Entry(bankDetail).Property(x => x.Description).IsModified = true;
            _masterDbContext.Entry(bankDetail).Property(x => x.IsActive).IsModified = true;
            _masterDbContext.Entry(bankDetail).Property(x => x.ModifiedBy).IsModified = true;
            _masterDbContext.Entry(bankDetail).Property(x => x.ModifiedOn).IsModified = true;

            _masterDbContext.SaveChanges();
            return bankDetail;
        }
        private object UpdatePrintExportConfiguration(string ipDataStr, RbacUser currentUser)
        {

            PrintExportConfigModel printExportConfigModel = DanpheJSONConvert.DeserializeObject<PrintExportConfigModel>(ipDataStr);
            printExportConfigModel.ModifiedBy = currentUser.EmployeeId;
            printExportConfigModel.ModifiedOn = DateTime.Now;
            _masterDbContext.PrintExportConfig.Attach(printExportConfigModel);
            _masterDbContext.Entry(printExportConfigModel).Property(x => x.SettingName).IsModified = true;
            _masterDbContext.Entry(printExportConfigModel).Property(x => x.PageHeaderText).IsModified = true;
            _masterDbContext.Entry(printExportConfigModel).Property(x => x.ReportDescription).IsModified = true;
            _masterDbContext.Entry(printExportConfigModel).Property(x => x.ModuleName).IsModified = true;
            _masterDbContext.Entry(printExportConfigModel).Property(x => x.ShowHeader).IsModified = true;
            _masterDbContext.Entry(printExportConfigModel).Property(x => x.ShowFooter).IsModified = true;
            _masterDbContext.Entry(printExportConfigModel).Property(x => x.ShowEnDate).IsModified = true;
            _masterDbContext.Entry(printExportConfigModel).Property(x => x.ShowFilterDateRange).IsModified = true;
            _masterDbContext.Entry(printExportConfigModel).Property(x => x.ShowNpDate).IsModified = true;
            _masterDbContext.Entry(printExportConfigModel).Property(x => x.ShowOtherFilterVariables).IsModified = true;
            _masterDbContext.Entry(printExportConfigModel).Property(x => x.ShowPrintExportDateTime).IsModified = true;
            _masterDbContext.Entry(printExportConfigModel).Property(x => x.ShowUserName).IsModified = true;
            _masterDbContext.Entry(printExportConfigModel).Property(x => x.IsActive).IsModified = true;
            _masterDbContext.Entry(printExportConfigModel).Property(x => x.ModifiedBy).IsModified = true;
            _masterDbContext.Entry(printExportConfigModel).Property(x => x.ModifiedOn).IsModified = true;
            _masterDbContext.SaveChanges();
            return printExportConfigModel;
        }
        private string ConvertXMLToJson(string itemXml)
        {
            //return empty json-array if input xml is empty or null
            if (string.IsNullOrEmpty(itemXml))
            {
                return "[]";
            }
            else
            {
                XmlDocument doc = new XmlDocument();
                doc.LoadXml(itemXml);
                return JsonConvert.SerializeXmlNode(doc, Newtonsoft.Json.Formatting.None, true);
            }
        }


        private void UpdateBillItemsOfDepartment(DepartmentModel currDepartment, MasterDbContext masterDbContext)
        {

            List<BillServiceItemModel> itemList = currDepartment.ServiceItemsList;
            //BillingDbContext bilDbContext = new BillingDbContext(connString);
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>("currentuser");

            itemList.ForEach(itm =>
            {
                //check if  current billingitem is already there.
                //add new if not exists, update if already exists.

                //case: 1 - Employee and Items are Fresh new, Employee is just added.
                //in this case: ItemId will always be Zero.
                if (itm.IntegrationItemId == 0)
                {
                    //Item Doesn't exist. add it.
                    itm.IntegrationItemId = currDepartment.DepartmentId;
                    //itm.ProcedureCode = currDepartment.DepartmentId.ToString();
                    masterDbContext.BillingServiceItems.Add(itm);
                    masterDbContext.SaveChanges();
                }
                else
                {
                    //Case:2 : Employee already existsm, search for the billItem.

                    BillServiceItemModel itmFromServer = masterDbContext.BillingServiceItems
                                                .Where(b => b.ServiceDepartmentId == itm.ServiceDepartmentId && itm.IntegrationItemId == b.IntegrationItemId).FirstOrDefault();



                    //case: 2.1: Item is not adde in billitemprice table.
                    // add a new item.
                    if (itmFromServer == null)
                    {
                        if (itm.ServiceDepartmentId == 0 && !String.IsNullOrEmpty(itm.ServiceDepartmentName))
                        {
                            itm.ServiceDepartmentId = masterDbContext.ServiceDepartments
                                                .Where(b => b.ServiceDepartmentName == itm.ServiceDepartmentName).FirstOrDefault().ServiceDepartmentId;
                        }
                        itm.IntegrationItemId = currDepartment.DepartmentId;
                        //itm.ProcedureCode = currDepartment.DepartmentId.ToString();
                        masterDbContext.BillingServiceItems.Add(itm);
                        masterDbContext.SaveChanges();
                    }
                    else
                    {
                        //case: 2.2: Item is already there in BillItemPrice table, Update It.

                        itmFromServer.ItemName = itm.ItemName;
                        //itmFromServer.Price = itm.Price; //Krishna , 13thMarch'23 Need to revise this later
                        //itmFromServer.EHSPrice = itm.EHSPrice;
                        //itmFromServer.SAARCCitizenPrice = itm.SAARCCitizenPrice;
                        //itmFromServer.ForeignerPrice = itm.ForeignerPrice;
                        //itmFromServer.InsForeignerPrice = itm.InsForeignerPrice;
                        //itmFromServer.IsEHSPriceApplicable = itm.IsEHSPriceApplicable;
                        //itmFromServer.IsSAARCPriceApplicable = itm.IsSAARCPriceApplicable;
                        //itmFromServer.IsForeignerPriceApplicable = itm.IsForeignerPriceApplicable;
                        //itmFromServer.IsInsForeignerPriceApplicable = itm.IsInsForeignerPriceApplicable;
                        //itmFromServer.IsZeroPriceAllowed = itm.IsZeroPriceAllowed;
                        itmFromServer.ModifiedBy = currentUser.EmployeeId;
                        itmFromServer.ModifiedOn = DateTime.Now;
                        itmFromServer.IsActive = itm.IsActive;

                        masterDbContext.Entry(itmFromServer).Property(b => b.ItemName).IsModified = true;
                        //masterDbContext.Entry(itmFromServer).Property(b => b.Price).IsModified = true;  //Krishna , 13thMarch'23 Need to revise this later
                        //masterDbContext.Entry(itmFromServer).Property(b => b.EHSPrice).IsModified = true;
                        //masterDbContext.Entry(itmFromServer).Property(b => b.SAARCCitizenPrice).IsModified = true;
                        //masterDbContext.Entry(itmFromServer).Property(b => b.ForeignerPrice).IsModified = true;
                        //masterDbContext.Entry(itmFromServer).Property(b => b.InsForeignerPrice).IsModified = true;
                        //masterDbContext.Entry(itmFromServer).Property(b => b.IsEHSPriceApplicable).IsModified = true;
                        //masterDbContext.Entry(itmFromServer).Property(b => b.IsSAARCPriceApplicable).IsModified = true;
                        //masterDbContext.Entry(itmFromServer).Property(b => b.IsForeignerPriceApplicable).IsModified = true;
                        //masterDbContext.Entry(itmFromServer).Property(b => b.IsInsForeignerPriceApplicable).IsModified = true;
                        //masterDbContext.Entry(itmFromServer).Property(b => b.IsZeroPriceAllowed).IsModified = true;
                        masterDbContext.Entry(itmFromServer).Property(b => b.ModifiedOn).IsModified = true;
                        masterDbContext.Entry(itmFromServer).Property(b => b.ModifiedBy).IsModified = true;
                        masterDbContext.Entry(itmFromServer).Property(b => b.IsActive).IsModified = true;

                        masterDbContext.SaveChanges();

                    }
                }
            });

        }
        [HttpPost]
        [Route("NursingWardSupplyMap")]
        public IActionResult PostNursingWardStoreMap([FromBody] List<WardSubStoresMap_DTO> wardSubStoresMapDTO)
        {
            Func<object> func = () => SaveNursingWardStoreMap(wardSubStoresMapDTO);
            return InvokeHttpPostFunction(func);

        }
        private object SaveNursingWardStoreMap(List<WardSubStoresMap_DTO> wardSubStoresMapDTO)
        {
            var currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            wardSubStoresMapDTO.ForEach(map =>
            {
                map.CreatedOn = DateTime.Now;
                map.CreatedBy = currentUser.EmployeeId;
            });
            List<WardSubStoresMAPModel> wardSubStoresMAPModel = JsonConvert.DeserializeObject<List<WardSubStoresMAPModel>>(JsonConvert.SerializeObject(wardSubStoresMapDTO));
            _masterDbContext.WardSubStoresMapDetails.AddRange(wardSubStoresMAPModel);
            _masterDbContext.SaveChanges();
            return wardSubStoresMAPModel;
        }
        [HttpGet]
        [Route("NursingWardSupplyMap")]
        public IActionResult GetNursingWardStoreMap()
        {
            Func<object> func = () => GetNursingWardStoreMappingData();
            return InvokeHttpPostFunction(func);

        }
        private object GetNursingWardStoreMappingData()
        {
            var MapData = (from map in _masterDbContext.WardSubStoresMapDetails
                           join store in _masterDbContext.Store on map.StoreId equals store.StoreId
                           join ward in _masterDbContext.Ward on map.WardId equals ward.WardId
                           select new
                           {
                               WardSubStoresMapId = map.WardSubStoresMapId,
                               StoreId = map.StoreId,
                               StoreName = store.Name,
                               WardId = map.WardId,
                               WardName = ward.WardName,
                               CreatedOn = map.CreatedOn
                           }).ToList().OrderByDescending(a => a.CreatedOn).GroupBy(a => a.WardId);

            var MappingData = (from map in MapData
                               select new
                               {
                                   WardSubStoresMapId = map.Select(b => b.WardSubStoresMapId).FirstOrDefault(),
                                   StoreId = map.Select(b => b.StoreId).FirstOrDefault(),
                                   StoreName = string.Join(",", map.Select(p => p.StoreName)),
                                   WardId = map.Select(b => b.WardId).FirstOrDefault(),
                                   WardName = map.Select(b => b.WardName).FirstOrDefault(),

                               }
                             ).ToList();
            return MappingData;
        }
        [HttpGet]
        [Route("NursingWardSupplyMapByWardId")]
        public IActionResult GetNursingWardStoreMapByWardId(int WardId)
        {
            Func<object> func = () => GetNursingWardStoreMappingDataByWardId(WardId);
            return InvokeHttpPostFunction(func);

        }
        private object GetNursingWardStoreMappingDataByWardId(int WardId)
        {
            var mapped = (from map in _masterDbContext.WardSubStoresMapDetails.Where(r => r.WardId == WardId)
                          join store in _masterDbContext.Store on map.StoreId equals store.StoreId
                          join ward in _masterDbContext.Ward on map.WardId equals ward.WardId
                          select new
                          {
                              WardSubStoresMapId = map.WardSubStoresMapId,
                              StoreId = map.StoreId,
                              StoreName = store.Name,
                              WardId = map.WardId,
                              WardName = ward.WardName,
                              IsDefault = map.IsDefault,
                              IsActive = map.IsActive,
                              CreatedOn = map.CreatedOn,
                              CreatedBy = map.CreatedBy
                          }).ToList();

            return mapped;
        }
        [HttpPut]
        [Route("NursingWardSupplyMap")]
        public IActionResult UpdateSubstoreWardDetail([FromBody] List<WardSubStoresMap_DTO> wardSubStoresMapDTO)
        {
            Func<object> func = () => UpdateSubstoreWardDetails(wardSubStoresMapDTO);
            return InvokeHttpPostFunction(func);
        }
        private object UpdateSubstoreWardDetails(List<WardSubStoresMap_DTO> wardSubStoresMap)
        {
            var currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);

            wardSubStoresMap.ForEach(map =>
            {
                map.ModifiedOn = DateTime.Now;
                map.ModifiedBy = currentUser.EmployeeId;
            });
            List<WardSubStoresMAPModel> wardSubstoresMapDetails = JsonConvert.DeserializeObject<List<WardSubStoresMAPModel>>(JsonConvert.SerializeObject(wardSubStoresMap));
            List<WardSubStoresMAPModel> wardSubstoreToUpdate = wardSubstoresMapDetails.Where(i => i.WardId == wardSubstoresMapDetails[0].WardId).ToList();
            wardSubstoreToUpdate.ForEach(itm =>
            {
                _masterDbContext.WardSubStoresMapDetails.Attach(itm);
                _masterDbContext.Entry(itm).Property(x => x.IsActive).IsModified = true;
                _masterDbContext.Entry(itm).Property(x => x.IsDefault).IsModified = true;
                _masterDbContext.Entry(itm).Property(x => x.ModifiedBy).IsModified = true;
                _masterDbContext.Entry(itm).Property(x => x.ModifiedOn).IsModified = true;
                _masterDbContext.SaveChanges();
            });
            return wardSubstoreToUpdate;

        }
    }
}
