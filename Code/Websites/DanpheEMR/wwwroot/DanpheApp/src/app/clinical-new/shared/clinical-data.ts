import { Injectable } from "@angular/core";
import { Subject } from "rxjs";

@Injectable()
export class ClinicalDataService {
    private invokeMethodSubject = new Subject<void>();

    RefreshDataOnSave$ = this.invokeMethodSubject.asObservable();

    RefreshDataOnSave() {
        this.invokeMethodSubject.next();
    }

}