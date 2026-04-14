using System.Collections.Generic;
using System.Net;
using Application.Common.Exceptions;

namespace DanpheEMR.Common.Exceptions
{
    public class SessionExpiredException : CustomException
    {
        public SessionExpiredException(string message) : base(message, null, HttpStatusCode.Unauthorized)
        {
        }
    }
}
