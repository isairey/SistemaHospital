using DanpheEMR.DalLayer;
using System;
using System.Threading.Tasks;

namespace DanpheEMR.Services.Lab
{
    public interface ILabService
    {
        Object GetSampleCollectionList(DateTime fromDate, DateTime toDate, string labTypeName, LabDbContext labDbContext);
        Object GetPendingLabResult(DateTime fromDate, DateTime toDate, string categoryIdsCSV, string labTypeName, LabDbContext labDbContext);
        Object GetPendingReports(DateTime fromDate, DateTime toDate, string categoryIdsCSV, string labTypeName, LabDbContext labDbContext);
        Object GetPatientsForReportDispatch(DateTime fromDate, DateTime toDate, string categoryIdsCSV, string labTypeName, LabDbContext labDbContext);
    }
}
