using System.Net;

namespace Application.Common.Exceptions
{
    public class UnAuthorizedException : CustomException
    {
        public UnAuthorizedException(string message) : base(message, null, HttpStatusCode.Unauthorized)
        {
        }
    }
}
