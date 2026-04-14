using DanpheEMR.CommonTypes;
using DanpheEMR.DalLayer;
using DanpheEMR.Enums;
using DanpheEMR.ServerModel.LabModels;
using DanpheEMR.ServerModel;
using DanpheEMR.Utilities;
using DocumentFormat.OpenXml.Drawing.Diagrams;
using MailKit.Search;
using System;
using System.Collections.Generic;
using System.Data;
using System.Data.Entity;
using System.Data.SqlClient;
using System.Linq;
using System.Threading.Tasks;

namespace DanpheEMR.Services.Lab
{
    public class LabService : ILabService
    {
        public Object GetSampleCollectionList(DateTime fromDate, DateTime toDate, string labTypeName, LabDbContext labDbContext)
        {
            DanpheHTTPResponse<object> responseData = new DanpheHTTPResponse<object>();
            try
            {
                List<SqlParameter> paramList = new List<SqlParameter>() {
                        new SqlParameter("@FromDate", fromDate),
                        new SqlParameter("@ToDate", toDate),
                        new SqlParameter("@LabTypeName",labTypeName)
                    };
                DataTable dt = DALFunctions.GetDataTableFromStoredProc("SP_LAB_GetSampleCollectionList", paramList, labDbContext);
                return dt;
            }
            catch (Exception ex)
            {
                throw new Exception(ex.Message);
            }
        }
        public Object GetPendingLabResult(DateTime fromDate, DateTime toDate, string categoryIdsCSV, string labTypeName, LabDbContext labDbContext)
        {
            try
            {
                List<int> selCategoryList = DanpheJSONConvert.DeserializeObject<List<int>>(categoryIdsCSV);
                var dVendorId =  labDbContext.LabVendors.Where(vendor => vendor.IsDefault == true).Select(a => a.LabVendorId).FirstOrDefault();
                List<SqlParameter> paramList = new List<SqlParameter>() {
                        new SqlParameter("@FromDate", fromDate),
                        new SqlParameter("@ToDate", toDate),
                        new SqlParameter("@LabTypeName",labTypeName),
                        new SqlParameter("@CategoryIds", String.Join(",",selCategoryList)),
                        new SqlParameter("@DefaultVendorId",dVendorId)
                    };
                DataTable resultTable = new DataTable();
                resultTable = DALFunctions.GetDataTableFromStoredProc("SP_LAB_GetPatientListForAddResult", paramList, labDbContext);
                return resultTable;
            }
            catch (Exception ex)
            {
               throw new Exception(ex.Message);
            }
        }

        public Object GetPendingReports(DateTime fromDate, DateTime toDate, string categoryIdsCSV, string labTypeName, LabDbContext labDbContext)
        {
            try
            {
                var verificationParameter = labDbContext.AdminParameters.Where(param => param.ParameterGroupName.ToLower() == "lab" && param.ParameterName == "LabReportVerificationNeededB4Print").Select(a => a.ParameterValue).FirstOrDefault();
                var verificationObj = DanpheJSONConvert.DeserializeObject<VerificationCoreCFGModel>(verificationParameter);
                bool verificationRequired = verificationObj.EnableVerificationStep;
                List<int> selectedCategories = DanpheJSONConvert.DeserializeObject<List<int>>(categoryIdsCSV);

                List<SqlParameter> paramList = new List<SqlParameter>() {
                        new SqlParameter("@FromDate", fromDate),
                        new SqlParameter("@ToDate", toDate),
                        new SqlParameter("@VerificationRequired", verificationRequired),
                        new SqlParameter("@CategoryIdsCSV", String.Join(",",selectedCategories)),
                        new SqlParameter("@LabType",labTypeName)
                    };
                DataTable dt = DALFunctions.GetDataTableFromStoredProc("SP_LAB_PendingReports", paramList, labDbContext);
                return dt;
            }
            catch (Exception ex)
            {
                throw new Exception(ex.Message);
            }
        }

        public Object GetPatientsForReportDispatch(DateTime fromDate, DateTime toDate, string categoryIdsCSV, string labTypeName, LabDbContext labDbContext)
        {
            try
            {
                List<string> selCategoryList = DanpheJSONConvert.DeserializeObject<List<string>>(categoryIdsCSV);
                List<SqlParameter> paramList = new List<SqlParameter>() {
                        new SqlParameter("@FromDate", fromDate),
                        new SqlParameter("@ToDate", toDate),
                        new SqlParameter("@LabTypeName",labTypeName),
                         new SqlParameter("@CategoryIdCsv", String.Join(",",selCategoryList)),
                    };
                DataTable resultTable = DALFunctions.GetDataTableFromStoredProc("SP_LAB_GetPatientListForReportDispatch", paramList, labDbContext);
                return resultTable;
            }
            catch (Exception ex)
            {
                throw new Exception(ex.Message);
            }
        }
    }
}
