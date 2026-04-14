using DanpheEMR.Core;
using DanpheEMR.Core.Parameters;
using DanpheEMR.ServerModel;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using System.Threading.Tasks;

namespace DanpheEMR.Utilities
{
    public class CommonFunctions
    {
        public static List<LabTestComponentResult> MapMachineResultsToComponentResults(List<MachineResultsVM> machineData)
        {
            List<LabTestComponentResult> data = new List<LabTestComponentResult>();
            foreach (var item in machineData)
            {
                var singleItem = new LabTestComponentResult();
                singleItem.RequisitionId = item.RequisitionId;
                singleItem.LabTestId = item.LabTestId;
                singleItem.Value = item.Value;
                singleItem.Unit = item.Component.Unit;
                singleItem.Range = item.Component.Range;
                singleItem.RangeDescription = item.Component.RangeDescription;
                singleItem.ComponentName = item.Component.ComponentName;
                singleItem.Method = item.Component.Method;
                singleItem.IsAbnormal = item.IsAbnormal;
                singleItem.TemplateId = item.TemplateId;
                singleItem.CreatedBy = item.CreatedBy;
                singleItem.CreatedOn = item.CreatedOn;
                singleItem.ComponentId = item.Component.ComponentId;
                singleItem.IsActive = true;
                singleItem.ResultGroup = 1;

                data.Add(singleItem);
            }
            return data;
        }
        public static List<DoseNumber> GetDosesNumberArray()
        {
            var data = new List<DoseNumber>();
            data.Add(new DoseNumber { Id = 1, NumberInfo = "1st" });
            data.Add(new DoseNumber { Id = 2, NumberInfo = "2nd" });
            data.Add(new DoseNumber { Id = 3, NumberInfo = "3rd" });
            data.Add(new DoseNumber { Id = 4, NumberInfo = "4th" });
            data.Add(new DoseNumber { Id = 5, NumberInfo = "5th" });
            data.Add(new DoseNumber { Id = 6, NumberInfo = "6th" });
            data.Add(new DoseNumber { Id = 7, NumberInfo = "7th" });
            data.Add(new DoseNumber { Id = 8, NumberInfo = "8th" });
            data.Add(new DoseNumber { Id = 9, NumberInfo = "9th" });
            data.Add(new DoseNumber { Id = 10, NumberInfo = "10th" });
            return data;
        }

        public static int GetCoreParameterIntValue(CoreDbContext coreDbContext, string groupName, string paramterName)
        {
            var paraValue = coreDbContext.Parameters.Where(a => a.ParameterGroupName == groupName && a.ParameterName == paramterName).FirstOrDefault().ParameterValue;
            return (paraValue == null) ? 0 : Convert.ToInt32(paraValue);
        }

        public static string GetCoreParameterStringValue(CoreDbContext coreDbContext, string groupName, string paramterName)
        {
            var paraValue = coreDbContext.Parameters.Where(a => a.ParameterGroupName == groupName && a.ParameterName == paramterName).FirstOrDefault().ParameterValue;
            return (paraValue == null) ? "" : paraValue;
        }

        public static bool GetCoreParameterBoolValue(CoreDbContext coreDbContext, string groupName, string paramterName)
        {
            var paraValue = coreDbContext.Parameters.Where(a => a.ParameterGroupName == groupName && a.ParameterName == paramterName).FirstOrDefault().ParameterValue;
            return (paraValue == null) ? false : Convert.ToBoolean(paraValue);
        }

        [Obsolete("")]
        public static bool GetCoreParameterBoolValue(CoreDbContext coreDbContext, string groupName, string paramterName, string keyName)
        {
            var paraValue = coreDbContext.Parameters.Where(a => a.ParameterGroupName == groupName && a.ParameterName == paramterName).FirstOrDefault().ParameterValue;
            var data = DanpheJSONConvert.DeserializeObject<JObject>(paraValue);
            return (data == null) ? false : ((data[keyName].Value<string>()) == null) ? false : Convert.ToBoolean(data[keyName].Value<string>());
        }


        //Sud: 30Apr'20--For reusability across modules..
        //Returns the 'string' value of Key inside a JsonObject.. Note: Works only for FirstLevel Keys, not for the keys inside two or more level..
        //default return value is null
        public static string GetCoreParameterValueByKeyName_String(CoreDbContext coreDbContext, string paramGroup, string paramName, string keyNameOfJsonObj)
        {
            string retValue = null;

            ParameterModel param = coreDbContext.Parameters.Where(a => a.ParameterGroupName == paramGroup && a.ParameterName == paramName).FirstOrDefault();
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


        //Sud: 30Apr'20--For reusability across modules..
        //Returns the 'boolean' value of Key inside a JsonObject.. Note: Works only for FirstLevel Keys, not for the keys inside two or more level..
        //default return value is false..
        public static bool GetCoreParameterValueByKeyName_Boolean(CoreDbContext coreDbContext, string paramGroup, string paramName, string keyNameOfJsonObj)
        {
            bool retValue = false;//this is default.
            //we have to consider condition like parameter not found, parametervalue not found, KeyNotFound.. etc.. 
            ParameterModel param = coreDbContext.Parameters.Where(a => a.ParameterGroupName == paramGroup && a.ParameterName == paramName).FirstOrDefault();
            if (param != null)
            {
                string paramValueStr = param.ParameterValue;
                JObject paramvalueJson = DanpheJSONConvert.DeserializeObject<JObject>(paramValueStr);
                if (paramvalueJson != null)
                {
                    string strValueOfKey = paramvalueJson[keyNameOfJsonObj].Value<string>();
                    if (!string.IsNullOrEmpty(strValueOfKey))
                    {
                        retValue = Convert.ToBoolean(strValueOfKey);
                    }
                }
            }

            return retValue;
        }


        //Sud: 30Apr'20--For reusability across modules..
        //Returns the 'boolean' value of Key inside a JsonObject.. Note: Works only for FirstLevel Keys, not for the keys inside two or more level..
        //default return value is false..
        public static int GetCoreParameterValueByKeyName_Int(CoreDbContext coreDbContext, string paramGroup, string paramName, string keyNameOfJsonObj)
        {
            int retValue = 0;//default is zero
            //we have to consider condition like parameter not found, parametervalue not found, KeyNotFound.. etc.. 
            ParameterModel param = coreDbContext.Parameters.Where(a => a.ParameterGroupName == paramGroup && a.ParameterName == paramName).FirstOrDefault();
            if (param != null)
            {
                string paramValueStr = param.ParameterValue;
                JObject paramvalueJson = DanpheJSONConvert.DeserializeObject<JObject>(paramValueStr);
                if (paramvalueJson != null)
                {
                    string strValueOfKey = paramvalueJson[keyNameOfJsonObj].Value<string>();
                    if (!string.IsNullOrEmpty(strValueOfKey))
                    {
                        retValue = Convert.ToInt32(strValueOfKey);
                    }
                }
            }

            return retValue;
        }

        //inprogress..
        public static int GetCoreParameterValueByKeyName_IntArray(CoreDbContext coreDbContext, string paramGroup, string paramName, string keyNameOfJsonObj)
        {
            int retValue = 0;//default is zero
            //we have to consider condition like parameter not found, parametervalue not found, KeyNotFound.. etc.. 
            ParameterModel param = coreDbContext.Parameters.Where(a => a.ParameterGroupName == paramGroup && a.ParameterName == paramName).FirstOrDefault();
            if (param != null)
            {
                string paramValueStr = param.ParameterValue;
                JObject paramvalueJson = DanpheJSONConvert.DeserializeObject<JObject>(paramValueStr);
                if (paramvalueJson != null)
                {
                    string strValueOfKey = paramvalueJson[keyNameOfJsonObj].Value<string>();
                    if (!string.IsNullOrEmpty(strValueOfKey))
                    {
                        retValue = Convert.ToInt32(strValueOfKey);
                    }
                }
            }

            return retValue;
        }

        private static DataTable ToDataTable<T>(List<T> data)
        {
            var dataTable = new DataTable();

            var properties = typeof(T).GetProperties();

            foreach (var prop in properties)
            {
                var type = Nullable.GetUnderlyingType(prop.PropertyType) ?? prop.PropertyType;
                dataTable.Columns.Add(prop.Name, type);
            }

            foreach (var item in data)
            {
                var row = dataTable.NewRow();
                foreach (var prop in properties)
                {
                    row[prop.Name] = prop.GetValue(item) ?? DBNull.Value;
                }
                dataTable.Rows.Add(row);
            }

            return dataTable;
        }

        /// <summary>
        /// This method bulk insert the data into targeted table.
        /// </summary>
        /// <typeparam name="T"></typeparam>
        /// <param name="tableName"></param>
        /// <param name="data"></param>
        /// <param name="connString"></param>
        /// <exception cref="Exception"></exception>
        public static void BulkInsert<T>(string tableName, List<T> data, string connString)
        {
            using (var connection = new SqlConnection(connString))
            {
                connection.Open();
                using (var transaction = connection.BeginTransaction())
                {
                    try
                    {
                        using (var bulkCopy = new SqlBulkCopy(connection, SqlBulkCopyOptions.Default, transaction))
                        {
                            bulkCopy.DestinationTableName = tableName;

                            var properties = typeof(T).GetProperties();
                            foreach (var prop in properties)
                            {
                                bulkCopy.ColumnMappings.Add(prop.Name, prop.Name);
                            }

                            // Convert data to DataTable and write to server
                            bulkCopy.WriteToServer(ToDataTable(data));
                        }
                        // Commit the transaction if everything is successful
                        transaction.Commit();
                    }
                    catch (Exception ex)
                    {
                        transaction.Rollback();
                        throw new Exception("Bulk insert failed. Transaction has been rolled back.", ex);
                    }
                }
            }
        }




    }
}
