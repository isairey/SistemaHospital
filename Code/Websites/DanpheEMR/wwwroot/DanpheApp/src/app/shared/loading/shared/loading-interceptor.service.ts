import { HTTP_INTERCEPTORS, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { finalize } from "rxjs/operators";
import { LoadingService } from "./loading.service";

@Injectable()
export class LoadingInterceptor implements HttpInterceptor {
  constructor(private _loadingService: LoadingService) { }
  intercept(req: HttpRequest<any>, handler: HttpHandler): Observable<HttpEvent<any>> {
    const bypassUrl = ['/api/Notification/UserNotifications'];
    const requestUrl = req.url;
    let bypassThisUrl = false;

    bypassUrl.forEach(u => {
      if (requestUrl.includes(u)) {
        bypassThisUrl = true;
      }
    });

    if (bypassThisUrl === false) {
      this._loadingService.showLoader();
    }
    return handler.handle(req).pipe(
      finalize(() => this._loadingService.hideLoader())
    );
  }
}
export const loadingInterceptorProviders = [
  { provide: HTTP_INTERCEPTORS, useClass: LoadingInterceptor, multi: true }
];
