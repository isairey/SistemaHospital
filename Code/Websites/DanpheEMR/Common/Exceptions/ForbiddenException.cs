using Application.Common.Exceptions;
using System.Net;

namespace DanpheEMR.Common.Exceptions
{
    public class ForbiddenException : CustomException
    {
        public ForbiddenException(string message) : base(message, null, HttpStatusCode.Forbidden)
        {
        }
    }
}
