import { HTTP_INTERCEPTORS, HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ENUM_LocalStorageKeys } from '../shared-enums';

const TOKEN_HEADER_KEY = 'Authorization';


@Injectable({
  providedIn: 'root'
})
export class AuthTokenInterceptor implements HttpInterceptor {

  constructor(private router: Router) { }
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    let authReq = req;
    const token = localStorage.getItem(ENUM_LocalStorageKeys.LoginTokenName);
    //! Krishna, 6thFeb'24, Below logic is added to bypass the urls mentioned in the array below.
    //! The issue it is solving is while hitting TeleMedicine server Danphe's Jwt token was getting injected instead of TeleMedicine's token,
    //! This is a temporary solution, Later hit the TeleMedicine server through Danphe's Server not from client and remove below logic.
    const bypassUrl = ['/api/doctor/getPatientListByAdmin/', '/api/patient/UpdateVisitStatus/', '/api/patient/UpdatePaidStatus/', '/api/LabReport/'];
    const requestUrl = req.url;
    let bypassThisUrl = false;
    bypassUrl.forEach(u => {
      if (requestUrl.includes(u)) {
        bypassThisUrl = true;
      }
    });
    if (token != null && token.trim() && bypassThisUrl === false) {
      authReq = req.clone({ headers: req.headers.set(TOKEN_HEADER_KEY, 'Bearer ' + token) });
    }
    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        const unAuthorizedStatusCode = 401;
        // DevN : (temp solution, we need to distinguish internal and external urls. Danphe Urls contains 2 colon(:), while that for telmedicine is 1.)
        const maxColonInUrl = 2;
        if (error.status === unAuthorizedStatusCode && (error.url.split(':').length - 1) === maxColonInUrl) {
          // Clear the token and redirect to login
          this.LogoutFromApplication();
        } else if (error.status === unAuthorizedStatusCode && (error.message.includes("DanpheSessionExpired"))) {
          this.LogoutFromApplication();
        }
        return throwError(error);
      })
    );
  }

  LogoutFromApplication() {

    //* remove loginJwtToken from localStorage
    localStorage.removeItem(ENUM_LocalStorageKeys.LoginTokenName);

    //removing landing page from session
    sessionStorage.removeItem("isLandingVisited");
    localStorage.removeItem('isLandingVisitedNewTab');
    localStorage.removeItem('selectedLabCategory');
    //when logged out from one tab, add a key : logout-event to local storage, which will be continuously listened by other windows.
    localStorage.setItem('logout-event', 'logout' + Math.random());
    //after setting localstorage, redirect to Logout page.
    window.location.href = '/Account/Logout';

  }
}

export const authInterceptorProviders = [
  { provide: HTTP_INTERCEPTORS, useClass: AuthTokenInterceptor, multi: true }
];
