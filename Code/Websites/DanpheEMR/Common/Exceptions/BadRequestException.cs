using System.Collections.Generic;
using System.Net;
using Application.Common.Exceptions;

namespace DanpheEMR.Common.Exceptions
{
    public class BadRequestException : CustomException
    {
        public BadRequestException(string message) : base(message, null, HttpStatusCode.BadRequest)
        {
        }
    }
}
