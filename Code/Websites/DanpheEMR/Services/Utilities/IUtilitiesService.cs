using DanpheEMR.DalLayer;
using DanpheEMR.Security;
using DanpheEMR.Services.Utilities.DTOs;
using System;
using System.Threading.Tasks;

namespace DanpheEMR.Services.Utilities
{
    public interface IUtilitiesService
    {
        object SaveSchemeRefundTransaction(RbacUser currentUser, SchemeRefund_DTO schemeRefundDTO, UtilitiesDbContext utilitiesDbContext);
        object GetSchemeRefundTransaction(UtilitiesDbContext utilitiesDbContext, DateTime fromDate, DateTime toDate);
         object GetSchemeRefundById(UtilitiesDbContext utilitiesDbContext, int receiptNo );

        object SaveVisitSchemeChange(RbacUser currentUser, VisitSchemeChangeHistory_DTO visitSchemeChangeHistory_DTO, UtilitiesDbContext utilitiesDbContext);
        object SaveOrganizationDeposit(RbacUser currentUser, OrganizationDeposit_DTO organizationDeposit_DTO, UtilitiesDbContext utilitiesDbContext);
        decimal GetOrganizationDepositBalance(UtilitiesDbContext utilitiesDbContext, int OrganizationId);
        object GetOrganizationDepositDetails(UtilitiesDbContext utilitiesDbContext, int DepositId);
        object GetPatientSchemeRefunds(UtilitiesDbContext utilitiesDbContext, int patientId);

        /// <summary>
        /// Changes the policy number for a specified patient and scheme.
        /// </summary>
        /// <param name="currentUser">The currently authenticated user performing the operation.</param>
        /// <param name="changePolicyNumber">The DTO containing the patient ID, scheme ID, and the new policy number.</param>
        /// <param name="utilitiesDbContext">The database context for accessing utility-related data.</param>
        /// <returns>
        /// A Task representing the asynchronous operation. The task result contains the number of database changes or 
        /// a status indicator.
        /// </returns>
        /// <exception cref="NotFoundException">Thrown when the patient scheme mapping is not found.</exception>
        /// <exception cref="InvalidOperationException">Thrown when input validation fails.</exception>
        /// <exception cref="Exception">Thrown for any other unexpected errors during the operation.</exception>
        Task<object> ChangePolicyNumber(RbacUser currentUser, ChangePolicyNumberDTO changePolicyNumber, UtilitiesDbContext utilitiesDbContext);

    }
}
