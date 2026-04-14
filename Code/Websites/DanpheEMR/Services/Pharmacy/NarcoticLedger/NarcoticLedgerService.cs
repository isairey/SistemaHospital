using System;
using System.Collections.Generic;
using System.Data;
using System.Data.Entity;
using System.Data.SqlClient;
using System.Linq;
using System.Threading.Tasks;
using DanpheEMR.DalLayer;
using DanpheEMR.Services.Pharmacy.DTOs;
using Microsoft.EntityFrameworkCore.Extensions.Internal;
using Microsoft.Extensions.Logging;
namespace DanpheEMR.Services.Pharmacy.NarcoticLedger
{
    public class NarcoticLedgerService : INarcoticLedgerService
    {
        private ILogger<NarcoticLedgerService> _logger;
        public NarcoticLedgerService(ILogger<NarcoticLedgerService> logger)
        {
            _logger = logger;
        }

        public async Task<object> GetAllGenericItemList(PharmacyDbContext _pharmacyDbContext)
        {
            var result = await _pharmacyDbContext.PHRMGenericModel
                                     .Select(generic => new PHRMGenericsDTO
                                     {
                                         GenericId = generic.GenericId,
                                         GenericName = generic.GenericName
                                     })
                                     .ToListAsync();
            return result;
        }
        public async Task<object> GetAllCompanyList(PharmacyDbContext _pharmacyDbContext)
        {
            var result = await _pharmacyDbContext.PHRMCompany
                                     .Select(company => new PHRMCompanyDTO
                                     {
                                         CompanyId = company.CompanyId,
                                         CompanyName = company.CompanyName
                                     })
                                     .ToListAsync();
            return result;
        }
        public async Task<object> GetAllSupplierList(PharmacyDbContext _pharmacyDbContext)
        {
            var result = await _pharmacyDbContext.PHRMSupplier
                                     .Select(supplier => new PHRMSupplierDTO
                                     {
                                         SupplierId = supplier.SupplierId,
                                         SupplierName = supplier.SupplierName
                                     })
                                     .ToListAsync();
            return result;
        }

        public async Task<object> GetNarcoticLedger(int? genericId, int? supplierId, int? companyId, DateTime fromDate, DateTime toDate, PharmacyDbContext _pharmacyDbContext)
        {
            try
            {
                if (fromDate != null && toDate != null)
                {
                    List<SqlParameter> paramList = new List<SqlParameter>() {
                        new SqlParameter("@GenericId", genericId),
                        new SqlParameter("@SupplierId", supplierId),
                        new SqlParameter("@CompanyId", companyId),
                        new SqlParameter("@FromDate", fromDate),
                        new SqlParameter("@ToDate", toDate)

                    };

                    DataTable narcoticLedger = DALFunctions.GetDataTableFromStoredProc("SP_PHRM_NarcoticLedger", paramList, _pharmacyDbContext);
                    if (narcoticLedger == null)
                    {
                        throw new Exception("narcotic ledger is empty");
                    }
                    return narcoticLedger;
                }
                else
                {

                    throw new ArgumentException("Invalid Date");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex.ToString());
                throw ex;
            }
        }
    }
}
