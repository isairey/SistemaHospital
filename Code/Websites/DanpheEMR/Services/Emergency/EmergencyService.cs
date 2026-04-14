using DanpheEMR.DalLayer;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;

namespace DanpheEMR.Services.Emergency
{
    public class EmergencyService : IEmergencyService
    {
        private readonly ILogger<EmergencyService> _logger;

        public EmergencyService(ILogger<EmergencyService> logger)
        {
            _logger = logger;
        }

        public object EmergencyPatients(int selectedCase, EmergencyDbContext _emergencyDbContext)
        {
            try
            {
                List<SqlParameter> paramList = new List<SqlParameter>
                {
                    new SqlParameter("@SelectedCase", selectedCase)
                };
                DataTable emergencyPatients = DALFunctions.GetDataTableFromStoredProc("SP_Emergency_GetEmergencyPatients", paramList, _emergencyDbContext);
                return emergencyPatients;
            }
            catch (SqlException sqlEx)
            {
                _logger.LogError(sqlEx, "Error while executing stored procedure SP_Emergency_GetEmergencyPatients", selectedCase);
                throw new Exception("Database error: Unable to fetch emergency patient list.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error occurred while processing the request", selectedCase);
                throw new Exception("An unexpected error occurred while processing your request. Please try again later.");
            }
        }
    }
}
