using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.AspNetCore.Mvc;
using DanpheEMR.ServerModel;
using DanpheEMR.DalLayer;
using System.Data.Entity;
using Microsoft.Extensions.Options;
using DanpheEMR.Utilities;
using DanpheEMR.Core.Configuration;
using DanpheEMR.Security;
using Microsoft.AspNetCore.Http;
using DanpheEMR.Enums;
using Newtonsoft.Json;
using DanpheEMR.Controllers.Radiology.DTO;
using System.Threading.Tasks;
using DanpheEMR.Services.Radiology;
using DanpheEMR.ServerModel.RadiologyModels.DTOs;
using FluentValidation;

namespace DanpheEMR.Controllers
{

    public class RadiologySettingsController : CommonController
    {
        private readonly MasterDbContext _masterDbContext;
        private readonly RadiologyDbContext _radiologyDbContext;
        private readonly BillingDbContext _billingDbContext;
        private readonly IRadiologySettingService _radiologySettingService;
        private readonly RbacDbContext _rbacDbContext;


        public RadiologySettingsController(IRadiologySettingService radiologySettingService ,IOptions<MyConfiguration> _config) : base(_config)
        {
            _masterDbContext = new MasterDbContext(connString);
            _radiologyDbContext = new RadiologyDbContext(connString);
            _billingDbContext = new BillingDbContext(connString);
            _radiologySettingService = radiologySettingService;
            _rbacDbContext = new RbacDbContext(connString);
        }

        #region Get APIs

        /// <summary>
        /// Retrieves a list of all template styles.
        /// </summary>
        /// <remarks>
        /// This API fetches a list of template styles, including details such as template name, header style, footer style, 
        /// creation details, and active status. It joins relevant tables to provide comprehensive information for each template style.
        /// </remarks>
        /// <returns>
        /// <response code="200">Returns a list of all template styles.</response>
        /// <response code="500">An internal server error occurred during the operation.</response>
        /// </returns>
        /// <exception cref="Exception">Thrown when an unexpected error occurs during the data retrieval process.</exception>
        /// <returns>The templateStyleList from the database.</returns>

        [HttpGet]
        [Route("TemplateStyle")]
        public async Task<IActionResult>GetTemplateStyleList()
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<Task<object>> func = () =>  _radiologySettingService.GetTemplateStyleList( _radiologyDbContext);
            return await InvokeHttpGetFunctionAsync(func);
        }

        [HttpGet]
        [Route("ImagingItems")]
        public IActionResult GetImagingItems()
        {
            //if (reqType == "get-rad-imaging-item")
            Func<object> func = () => (from i in _radiologyDbContext.ImagingItems.Include("ImagingTypes")
                                       select new
                                       {
                                           ImagingTypeName = i.ImagingTypes.ImagingTypeName,
                                           ImagingTypeId = i.ImagingTypes.ImagingTypeId,
                                           ImagingItemName = i.ImagingItemName,
                                           ImagingItemId = i.ImagingItemId,
                                           ProcedureCode = i.ProcedureCode,
                                           IsActive = i.IsActive,
                                           CreatedOn = i.CreatedOn,
                                           CreatedBy = i.CreatedBy,
                                           TemplateId = i.TemplateId,
                                           IsValidForReporting = i.IsValidForReporting
                                       }).OrderBy(i => i.ImagingTypeName).ToList();
            return InvokeHttpGetFunction(func);
        }

        [HttpGet]
        [Route("ImagingTypes")]
        public IActionResult GetImagingTypes()
        {
            //if (reqType == "get-rad-imaging-type")
            Func<object> func = () => _radiologyDbContext.ImagingTypes.OrderBy(i => i.ImagingTypeName).ToList();
            return InvokeHttpGetFunction(func);
        }

        [HttpGet]
        [Route("ReportTemplates")]
        public IActionResult GetReportTemplates()
        {
            //if (reqType == "get-rad-report-template")
            Func<object> func = () => (from rTemplate in _radiologyDbContext.RadiologyReportTemplate
                                       select new
                                       {
                                           TemplateId = rTemplate.TemplateId,
                                           ModuleName = rTemplate.ModuleName,
                                           TemplateCode = rTemplate.TemplateCode,
                                           TemplateName = rTemplate.TemplateName,
                                           CreatedBy = rTemplate.CreatedBy,
                                           FooterNote = rTemplate.FooterNote,
                                           IsActive = rTemplate.IsActive
                                       }).OrderBy(t => t.TemplateName).ToList();
            return InvokeHttpGetFunction(func);
        }

        [HttpGet]
        [Route("ReportTemplate")]
        public IActionResult GetReportTemplate(int templateId)
        {
            //if (reqType == "get-rad-report-template-byid")
            Func<object> func = () => (from rTemplate in _radiologyDbContext.RadiologyReportTemplate
                                       where rTemplate.TemplateId == templateId
                                       select rTemplate).FirstOrDefault();
            return InvokeHttpGetFunction(func);
        }

        #endregion

        #region Post APIs
        /// <summary>
        /// Creates a new template style.
        /// </summary>
        /// <remarks>
        /// This endpoint allows the creation of a new template style for a radiology template. 
        /// It validates the request payload and checks for duplicate entries before saving to the database.
        /// </remarks>
        /// <param name="addTemplateStyleRequest">An object containing the details of the template style to be created.</param>
        /// <response code="200">Successfully created the template style.</response>
        /// <response code="400">Validation errors or duplicate template style detected.</response>
        /// <response code="500">An internal server error occurred during the operation.</response>
        /// <exception cref="InvalidOperationException">Thrown when a template style with the same TemplateId already exists.</exception>
        /// <exception cref="ValidationException">Thrown when the input validation fails for the request payload.</exception>
        /// <exception cref="Exception">Thrown when an unexpected error occurs during the process.</exception>
        /// <returns>The ID of the newly created template style.</returns>
        [HttpPost]
        [Route("TemplateStyle")]
        public async Task<ActionResult> PostTemplateStyle([FromBody] AddTemplateStyleRequest addTemplateStyleRequest)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<Task<object>> func = async () => await _radiologySettingService.PostTemplateStyle(addTemplateStyleRequest, currentUser, _radiologyDbContext);
            return await InvokeHttpPostFunctionAsync(func);
        }

        [HttpPost]
        [Route("ImagingItem")]
        public IActionResult PostImagingItem([FromBody] ImagingItemDTO imagingItem_dto)
        {
            //if (reqType == "post-rad-imaging-item")
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => SaveImagingItem(imagingItem_dto, currentUser);
            return InvokeHttpPostFunction(func);
        }

        [HttpPost]
        [Route("ImagingType")]
        public IActionResult PostImagingType()
        {
            //if (reqType == "post-rad-imaging-type")
            string ipDataStr = this.ReadPostData();
            Func<object> func = () => SaveImagingType(ipDataStr);
            return InvokeHttpPostFunction(func);
        }

        [HttpPost]
        [Route("ReportTemplate")]
        public IActionResult PostReportTemplate()
        {
            //if (reqType == "post-rad-report-template")
            string ipDataStr = this.ReadPostData();
            Func<object> func = () => SaveReportTemplete(ipDataStr);
            return InvokeHttpPostFunction(func);
        }

        #endregion

        #region Put APIs
        /// <summary>
        /// Updates an existing template style.
        /// </summary>
        /// <remarks>
        /// This endpoint updates the header and footer styles of an existing radiology template style. 
        /// It validates the request payload before applying changes and ensures the updated data is valid.
        /// </remarks>
        /// <param name="updateTemplateStyleRequest">An object containing the details of the template style to be updated.</param>
        /// <response code="200">Successfully updated the template style.</response>
        /// <response code="400">Validation errors in the request payload or template style not found.</response>
        /// <response code="404">The specified template style does not exist.</response>
        /// <response code="500">An internal server error occurred during the operation.</response>
        /// <exception cref="ValidationException">Thrown when input validation fails for the request payload.</exception>
        /// <exception cref="Exception">Thrown when an unexpected error occurs during the process.</exception>
        /// <returns>The updated `UpdateTemplateStyleRequest` object.</returns>

        [HttpPut]
        [Route("TemplateStyle")]
        public async Task<IActionResult> PutTemplateStyle([FromBody] UpdateTemplateStyleRequest updateTemplateStyleRequest)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _radiologySettingService.PutTemplateStyle(updateTemplateStyleRequest, currentUser, _radiologyDbContext);
            return await InvokeHttpPutFunctionAsync(func);
        }
        /// <summary>
        /// Updates the active status of a template style.
        /// </summary>
        /// <remarks>
        /// This API is used to toggle the active status of a radiology template style. 
        /// It modifies the `IsActive` property of the template style and ensures the updated data is valid.
        /// </remarks>
        /// <param name="templateStyleId">The ID of the template style whose active status needs to be updated.</param>
        /// <returns>
        /// <response code="200">Returns the `templateStyleId` upon successfully updating the active status.</response>
        /// <response code="400">Returns validation errors if the input data is invalid or the template style is not found.</response>
        /// <response code="500">An internal server error occurred during the operation.</response>
        /// </returns>
        /// <exception cref="ValidationException">Thrown when input validation fails for the request payload or the active status update is invalid.</exception>
        /// <exception cref="Exception">Thrown when an unexpected error occurs during the process.</exception>
        /// <returns>The `templateStyleId` indicating the template style whose active status was updated.</returns>
        
        [HttpPut]
        [Route("ActiveStatus")]
        public async Task<IActionResult> PutActiveStatus( int templateStyleId)
        {
            RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
            Func<object> func = () => _radiologySettingService.PutActiveStatus(templateStyleId, currentUser,_radiologyDbContext);
            return await InvokeHttpPutFunctionAsync(func);
        }
        [HttpPut]
        [Route("ImagingItem")]
        public IActionResult PutImagingItem()
        {
            //if (reqType == "put-rad-imaging-item")
            string ipDataStr = this.ReadPostData();
            Func<object> func = () => UpdateImagingItem(ipDataStr);
            return InvokeHttpPutFunction(func);
        }

        [HttpPut]
        [Route("ImagingType")]
        public IActionResult PutImagingType()
        {
            //if (reqType == "put-rad-imaging-type")
            string ipDataStr = this.ReadPostData();
            Func<object> func = () => UpdateImagingType(ipDataStr);
            return InvokeHttpPutFunction(func);
        }

        [HttpPut]
        [Route("ReportTemplate")]
        public IActionResult PutReportTemplate()
        {
            //if (reqType == "put-rad-report-template")
            string ipDataStr = this.ReadPostData();
            Func<object> func = () => UpdateReportTemplate(ipDataStr);
            return InvokeHttpPutFunction(func);
        }

        #endregion
        private object SaveImagingItem(ImagingItemDTO imagingItem_dto, RbacUser currentUser)
        {
            using (var dbContextTransaction = _radiologyDbContext.Database.BeginTransaction())
            {
                try
                {
                    RadiologyImagingItemModel radImgItem = DanpheJSONConvert.DeserializeObject<RadiologyImagingItemModel>(JsonConvert.SerializeObject(imagingItem_dto));
                    radImgItem.CreatedOn = DateTime.Now;
                    radImgItem.CreatedBy = currentUser.EmployeeId;

                    _radiologyDbContext.ImagingItems.Add(radImgItem);
                    _radiologyDbContext.SaveChanges();

                    BillServiceItemModel billServiceItem = new BillServiceItemModel();
                    {
                        billServiceItem.ItemName = radImgItem.ImagingItemName;
                        billServiceItem.ItemCode = radImgItem.ProcedureCode;
                        billServiceItem.IntegrationName = ENUM_IntegrationNames.Radiology;
                        billServiceItem.DefaultDoctorList = "[]";
                        Int64 ImagingItemId = radImgItem.ImagingItemId;//ImagingItemId comes only after this model is saved to database
                        if (string.IsNullOrEmpty(billServiceItem.ItemCode))
                        {
                            billServiceItem.ItemCode = "RAD-" + radImgItem.ImagingItemId.ToString("D6");
                        }
                        billServiceItem.ServiceDepartmentId = imagingItem_dto.ServiceDepartmentId ?? default(int); //typecase for default int
                                                                                                                   //billServiceItem.Price = 0;
                        billServiceItem.IntegrationItemId = Convert.ToInt32(radImgItem.ImagingItemId);
                        //billServiceItem.IsTaxApplicable = radImgItem.IsTaxApplicable.HasValue ? radImgItem.IsTaxApplicable.Value : false;
                        billServiceItem.CreatedBy = currentUser.EmployeeId;
                        billServiceItem.CreatedOn = System.DateTime.Now;
                        billServiceItem.IsActive = true;
                        billServiceItem.IsValidForReporting = radImgItem.IsValidForReporting;
                    }
                    if (string.IsNullOrEmpty(radImgItem.ProcedureCode))
                    {
                        string ITM = imagingItem_dto.ImagingItemName.Length >= 3 ? imagingItem_dto.ImagingItemName.Substring(0, 3) : imagingItem_dto.ImagingItemName;
                        radImgItem.ProcedureCode = ITM + radImgItem.ImagingItemId.ToString("D6");
                    }
                    _radiologyDbContext.Entry(radImgItem).Property(t => t.ProcedureCode).IsModified = true;
                    _radiologyDbContext.BillServiceItems.Add(billServiceItem);
                    _radiologyDbContext.SaveChanges();
                    dbContextTransaction.Commit();
                    return radImgItem;
                }
                catch (Exception ex)
                {
                    dbContextTransaction.Rollback();
                    throw (ex);
                }
            }
        }

        private object SaveImagingType(string ipDataStr)
        {
            try
            {
                RadiologyImagingTypeModel radImgType = DanpheJSONConvert.DeserializeObject<RadiologyImagingTypeModel>(ipDataStr);
                radImgType.CreatedOn = DateTime.Now;
                _radiologyDbContext.ImagingTypes.Add(radImgType);
                RbacUser currentUser = HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser);
                var application = _rbacDbContext.Applications.FirstOrDefault(a => a.ApplicationCode == "RAD-IMG-TYPE");
                var radPermission = new RbacPermission
                {
                    PermissionName = "Radiology-" + radImgType.ImagingTypeName + "-selection-Category",
                    Description = "auto-generated after Imaging Type creation",
                    ApplicationId = application.ApplicationId,
                    CreatedBy = currentUser.EmployeeId,
                    CreatedOn = DateTime.Now,
                    IsActive = true
                };
                RBAC.CreatePermission(radPermission, _rbacDbContext);
                _radiologyDbContext.SaveChanges();
                return radImgType;
            }
            catch (Exception ex)
            {

                throw new Exception("An error occurred while adding imaging type, with Exception Details: {ex}", ex);
            }
        }

        private object SaveReportTemplete(string ipDataStr)
        {
            RadiologyReportTemplateModel clientRadRptTemplateData = DanpheJSONConvert.DeserializeObject<RadiologyReportTemplateModel>(ipDataStr);
            clientRadRptTemplateData.CreatedOn = DateTime.Now;
            _radiologyDbContext.RadiologyReportTemplate.Add(clientRadRptTemplateData);
            _radiologyDbContext.SaveChanges();
            return clientRadRptTemplateData;
        }

        private object UpdateImagingItem(string ipDataStr)
        {
            //First update radiology item, then billing item.
            RadiologyImagingItemModel clientImgItem = DanpheJSONConvert.DeserializeObject<RadiologyImagingItemModel>(ipDataStr);
            _masterDbContext.ImagingItems.Attach(clientImgItem);
            _masterDbContext.Entry(clientImgItem).State = EntityState.Modified;
            _masterDbContext.Entry(clientImgItem).Property(x => x.CreatedOn).IsModified = false;
            _masterDbContext.Entry(clientImgItem).Property(x => x.CreatedBy).IsModified = false;
            _masterDbContext.Entry(clientImgItem).Property(x => x.TemplateId).IsModified = true;
            clientImgItem.ModifiedOn = DateTime.Now;
            _masterDbContext.SaveChanges();

            //disable/enable radiology billing item from radiology
            //update IsActive to Billing Item as well. Other fields are not required now, so we can add later on as required.

            var srvDpt = (from srv in _masterDbContext.ServiceDepartments
                          where srv.IntegrationName.ToLower() == "radiology"
                          join imgTyp in _masterDbContext.ImagingTypes
                          on srv.ServiceDepartmentName equals imgTyp.ImagingTypeName

                          where imgTyp.ImagingTypeId == clientImgItem.ImagingTypeId
                          select srv).FirstOrDefault();

            if (srvDpt != null)
            {
                BillServiceItemModel billItemPrice = _billingDbContext.BillServiceItems.Where(a => a.IntegrationItemId == clientImgItem.ImagingItemId && a.ServiceDepartmentId == srvDpt.ServiceDepartmentId).FirstOrDefault<BillServiceItemModel>();
                billItemPrice.IsActive = clientImgItem.IsActive.HasValue ? clientImgItem.IsActive.Value : false;

                _billingDbContext.Entry(billItemPrice).Property(x => x.IsActive).IsModified = true;
                _billingDbContext.SaveChanges();
            }
            return clientImgItem;
        }

        private object UpdateImagingType(string ipDataStr)
        {
            RadiologyImagingTypeModel clientImgType = DanpheJSONConvert.DeserializeObject<RadiologyImagingTypeModel>(ipDataStr);
            _masterDbContext.ImagingTypes.Attach(clientImgType);
            _masterDbContext.Entry(clientImgType).State = EntityState.Modified;
            _masterDbContext.Entry(clientImgType).Property(x => x.CreatedOn).IsModified = false;
            _masterDbContext.Entry(clientImgType).Property(x => x.CreatedBy).IsModified = false;
            clientImgType.ModifiedOn = DateTime.Now;
            _masterDbContext.SaveChanges();
            return clientImgType;
        }

        private object UpdateReportTemplate(string ipDataStr)
        {
            RadiologyReportTemplateModel clientRadRptTemplateData = DanpheJSONConvert.DeserializeObject<RadiologyReportTemplateModel>(ipDataStr);
            _radiologyDbContext.RadiologyReportTemplate.Attach(clientRadRptTemplateData);
            _radiologyDbContext.Entry(clientRadRptTemplateData).State = EntityState.Modified;
            _radiologyDbContext.Entry(clientRadRptTemplateData).Property(x => x.CreatedOn).IsModified = false;
            _radiologyDbContext.Entry(clientRadRptTemplateData).Property(x => x.CreatedBy).IsModified = false;
            clientRadRptTemplateData.ModifiedOn = DateTime.Now;
            _radiologyDbContext.SaveChanges();
            return clientRadRptTemplateData;
        }

        #region reqType(Get)
        /*[HttpGet]
        public string Get(string department,
            string servDeptName,
            string reqType,
            int providerId,
            int patientId,
            int employeeId,
            DateTime requestDate,
            int roleId,
            int userId,
            int bedId,
            int itemId,
            int serviceDeptId,
            string status,
            int templateId,
            bool ShowIsActive,
            bool showInactiveItems = false)
        {
            MasterDbContext masterDbContext = new MasterDbContext(connString);
            RadiologyDbContext radioDbContext = new RadiologyDbContext(connString);
            DanpheHTTPResponse<object> responseData = new DanpheHTTPResponse<object>();

            try
            {
                if (reqType == "get-rad-imaging-item")
                {
                    var imgItemList = (from i in radioDbContext.ImagingItems.Include("ImagingTypes")
                                       select new
                                       {
                                           ImagingTypeName = i.ImagingTypes.ImagingTypeName,
                                           ImagingTypeId = i.ImagingTypes.ImagingTypeId,
                                           ImagingItemName = i.ImagingItemName,
                                           ImagingItemId = i.ImagingItemId,
                                           ProcedureCode = i.ProcedureCode,
                                           IsActive = i.IsActive,
                                           CreatedOn = i.CreatedOn,
                                           CreatedBy = i.CreatedBy,
                                           TemplateId = i.TemplateId,
                                           IsValidForReporting = i.IsValidForReporting
                                       }).OrderBy(i => i.ImagingTypeName).ToList();
                    responseData.Status = "OK";
                    responseData.Results = imgItemList;
                }
                else if (reqType == "get-rad-imaging-type")
                {
                    var imgTypeList = radioDbContext.ImagingTypes.OrderBy(i => i.ImagingTypeName).ToList();
                    responseData.Status = "OK";
                    responseData.Results = imgTypeList;
                }
                else if (reqType == "get-rad-report-template")
                {
                    var radReportTemplateList = (from rTemplate in radioDbContext.RadiologyReportTemplate
                                                 select new
                                                 {
                                                     TemplateId = rTemplate.TemplateId,
                                                     ModuleName = rTemplate.ModuleName,
                                                     TemplateCode = rTemplate.TemplateCode,
                                                     TemplateName = rTemplate.TemplateName,
                                                     CreatedBy = rTemplate.CreatedBy,
                                                     FooterNote = rTemplate.FooterNote,
                                                     IsActive = rTemplate.IsActive
                                                 }).OrderBy(t => t.TemplateName).ToList();
                    responseData.Status = "OK";
                    responseData.Results = radReportTemplateList;
                }

                else if (reqType == "get-rad-report-template-byid")
                {
                    var radReportTemplate = (from rTemplate in radioDbContext.RadiologyReportTemplate
                                             where rTemplate.TemplateId == templateId
                                             select rTemplate).FirstOrDefault();
                    responseData.Status = "OK";
                    responseData.Results = radReportTemplate;
                }

            }
            catch (Exception ex)
            {
                responseData.Status = "Failed";
                responseData.ErrorMessage = ex.Message + " exception details:" + ex.ToString();
            }
            return DanpheJSONConvert.SerializeObject(responseData, true);
        }*/
        #endregion

        #region reqType(Post)
        /*// POST api/values
        [HttpPost]
        public string Post()
        {

            DanpheHTTPResponse<object> responseData = new DanpheHTTPResponse<object>();//type 'object' since we have variable return types
            responseData.Status = "OK";//by default status would be OK, hence assigning at the top
            RadiologyDbContext radioDbContext = new RadiologyDbContext(connString);
            try
            {
                string serviceDepartment = this.ReadQueryStringData("serviceDepartment");
                int itemId = ToInt(this.ReadQueryStringData("itemId"));
                string reqType = this.ReadQueryStringData("reqType");
                string str = this.ReadPostData();
                RbacUser currentUser = HttpContext.Session.Get<RbacUser>("currentuser");

                if (reqType == "post-rad-imaging-item")
                {
                    RadiologyImagingItemModel radImgItem = DanpheJSONConvert.DeserializeObject<RadiologyImagingItemModel>(str);
                    radImgItem.CreatedOn = DateTime.Now;
                    radImgItem.CreatedBy = currentUser.EmployeeId;
                    radioDbContext.ImagingItems.Add(radImgItem);
                    radioDbContext.SaveChanges();
                    responseData.Results = radImgItem;
                    responseData.Status = "OK";
                }
                else if (reqType == "post-rad-imaging-type")
                {
                    RadiologyImagingTypeModel radImgType = DanpheJSONConvert.DeserializeObject<RadiologyImagingTypeModel>(str);
                    radImgType.CreatedOn = DateTime.Now;
                    radioDbContext.ImagingTypes.Add(radImgType);
                    radioDbContext.SaveChanges();
                    responseData.Results = radImgType;
                    responseData.Status = "OK";
                }
                else if (reqType == "post-rad-report-template")
                {
                    RadiologyReportTemplateModel clientRadRptTemplateData = DanpheJSONConvert.DeserializeObject<RadiologyReportTemplateModel>(str);
                    clientRadRptTemplateData.CreatedOn = System.DateTime.Now;
                    radioDbContext.RadiologyReportTemplate.Add(clientRadRptTemplateData);
                    radioDbContext.SaveChanges();
                    responseData.Results = clientRadRptTemplateData;
                    responseData.Status = "OK";
            }

            }
            catch (Exception ex)
            {
                responseData.Status = "Failed";
                responseData.ErrorMessage = ex.Message + " exception details:" + ex.ToString();

            }


            return DanpheJSONConvert.SerializeObject(responseData, true);
        }*/
        #endregion

        #region reqType(Put)
        /*// PUT api/values/5
        [HttpPut]
        public string Put()
        {
            string reqType = this.ReadQueryStringData("reqType");
            DanpheHTTPResponse<object> responseData = new DanpheHTTPResponse<object>();
            string str = this.ReadPostData();
            MasterDbContext masterDBContext = new MasterDbContext(connString);
            RadiologyDbContext radioDbContext = new RadiologyDbContext(connString);

            RbacUser currentUser = HttpContext.Session.Get<RbacUser>("currentuser");

            try
            {
                if (reqType == "put-rad-imaging-type")
                {

                    RadiologyImagingTypeModel clientImgType = DanpheJSONConvert.DeserializeObject<RadiologyImagingTypeModel>(str);
                    masterDBContext.ImagingTypes.Attach(clientImgType);
                    masterDBContext.Entry(clientImgType).State = EntityState.Modified;
                    masterDBContext.Entry(clientImgType).Property(x => x.CreatedOn).IsModified = false;
                    masterDBContext.Entry(clientImgType).Property(x => x.CreatedBy).IsModified = false;
                    clientImgType.ModifiedOn = System.DateTime.Now;
                    masterDBContext.SaveChanges();
                    responseData.Results = clientImgType;
                    responseData.Status = "OK";
                }
                else if (reqType == "put-rad-imaging-item")
                {
                    //First update radiology item. then billing item.
                    RadiologyImagingItemModel clientImgItem = DanpheJSONConvert.DeserializeObject<RadiologyImagingItemModel>(str);
                    masterDBContext.ImagingItems.Attach(clientImgItem);
                    masterDBContext.Entry(clientImgItem).State = EntityState.Modified;
                    masterDBContext.Entry(clientImgItem).Property(x => x.CreatedOn).IsModified = false;
                    masterDBContext.Entry(clientImgItem).Property(x => x.CreatedBy).IsModified = false;
                    masterDBContext.Entry(clientImgItem).Property(x => x.TemplateId).IsModified = true;
                    clientImgItem.ModifiedOn = System.DateTime.Now;
                    masterDBContext.SaveChanges();

                    //sud:24Sept'19--to disable/enable radiology billing item from radiology
                    //update IsActive to Billing Item as well. Other fields are not required now, so we can add later on as required.

                    var srvDpt = (from srv in masterDBContext.ServiceDepartments
                                  where srv.IntegrationName.ToLower() == "radiology"
                                  join imgTyp in masterDBContext.ImagingTypes
                                  on srv.ServiceDepartmentName equals imgTyp.ImagingTypeName

                                  where imgTyp.ImagingTypeId == clientImgItem.ImagingTypeId
                                  select srv).FirstOrDefault();

                    if(srvDpt != null)
                    {
                        BillingDbContext billingDbContext = new BillingDbContext(connString);
                        BillItemPrice billItemPrice = billingDbContext.BillItemPrice.Where(a => a.ItemId == clientImgItem.ImagingItemId && a.ServiceDepartmentId == srvDpt.ServiceDepartmentId).FirstOrDefault<BillItemPrice>();
                        billItemPrice.IsActive = clientImgItem.IsActive;

                        billingDbContext.Entry(billItemPrice).Property(x => x.IsActive).IsModified = true;
                        billingDbContext.SaveChanges();
                    }


                    responseData.Results = clientImgItem;
                    responseData.Status = "OK";
                }
                else if (reqType == "put-rad-report-template")
                {
                    RadiologyReportTemplateModel clientRadRptTemplateData = DanpheJSONConvert.DeserializeObject<RadiologyReportTemplateModel>(str);
                    radioDbContext.RadiologyReportTemplate.Attach(clientRadRptTemplateData);
                    radioDbContext.Entry(clientRadRptTemplateData).State = EntityState.Modified;
                    radioDbContext.Entry(clientRadRptTemplateData).Property(x => x.CreatedOn).IsModified = false;
                    radioDbContext.Entry(clientRadRptTemplateData).Property(x => x.CreatedBy).IsModified = false;
                    clientRadRptTemplateData.ModifiedOn = System.DateTime.Now;
                    radioDbContext.SaveChanges();
                    responseData.Results = clientRadRptTemplateData;
                    responseData.Status = "OK";
                }
            }
            catch (Exception ex)
            {
                responseData.Status = "Failed";
                responseData.ErrorMessage = ex.Message + " exception details:" + ex.ToString();
            }
            return DanpheJSONConvert.SerializeObject(responseData, true);
        }*/
        #endregion

        #region reqType(Delete)
        /*// DELETE api/values/5
        [HttpDelete("{id}")]
        public void Delete(int id)
        {
        }*/
        #endregion

    }
}