import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

/**
 * @summary  This is a service to manage the current time period selection for the application.
 * 
 * This service provides a reactive way to handle time period changes
 * (e.g., daily, weekly, monthly, yearly) using RxJS BehaviorSubject.
 */

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  /** 
  * @summary - BehaviorSubject holds the current time period.
  * @default 'daily'
  */
  private timePeriodSource = new BehaviorSubject<string>('daily');

  /** 
  * @summary - Observable for the current time period.
  * Components can subscribe to this to get updates whenever the time period changes.
  */
  CurrentTimePeriod$ = this.timePeriodSource.asObservable();

  /**
     * @summary -  This function updates the current time period and notifies all subscribers.
     * @param period - This is the new time period to set (e.g., 'daily', 'weekly', 'monthly', 'yearly').
     */
  ChangeTimePeriod(period: string) {
    this.timePeriodSource.next(period);
  }

}
