using DanpheEMR.Enums;
using DanpheEMR.Security;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.SignalR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace DanpheEMR.Utilities.SignalRHubs
{
    public class FonePayHub : Hub<FonePayHub>
    {
        private readonly IHubContext<FonePayHub> _hubContext;
        private readonly IHttpContextAccessor _contextAccessor;
        private static List<ConnectedUser> _connectedUsers = new List<ConnectedUser>();

        public FonePayHub(IHubContext<FonePayHub> hubContext, IHttpContextAccessor contextAccessor)
        {
            _hubContext = hubContext;
            _contextAccessor = contextAccessor;

        }

        public async override Task OnConnectedAsync()
        {
            ConnectedUser newConnectedUser = new ConnectedUser
            {
                UserId = _contextAccessor.HttpContext.Session.Get<RbacUser>(ENUM_SessionVariables.CurrentUser).UserId.ToString(),
                UserSignalRId = Context.ConnectionId
            };
            _connectedUsers.Add(newConnectedUser);
            await base.OnConnectedAsync();
        }

        public async override Task OnDisconnectedAsync(Exception ex)
        {
            List<ConnectedUser> user = _connectedUsers.Where(a => a.UserSignalRId == Context.ConnectionId).ToList();
            user.ForEach(a =>
            {
                _connectedUsers.Remove(a);
            });
            await base.OnDisconnectedAsync(ex);
        }


        public string GetConnectionId()
        {
            return Context.ConnectionId;
        }

        public void SendNotification(string id, InvoiceDetail invoiceDetail)
        {
            var ids = _connectedUsers.Where(a => a.UserId == id).Select(a => a.UserSignalRId).ToList();
            _hubContext.Clients.Clients(ids).SendAsync("InvoiceData", invoiceDetail);
        }
    }

    public class ConnectedUser
    {
        public string UserId { get; set; }
        public string UserSignalRId { get; set; }
    }
}
