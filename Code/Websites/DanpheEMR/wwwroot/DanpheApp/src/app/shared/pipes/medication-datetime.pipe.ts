import { Pipe, PipeTransform } from '@angular/core';
import * as moment from 'moment';

@Pipe({
  name: 'MedicationDateTime'
})
export class MedicationDateTimePipe implements PipeTransform {

  /**
   * @summary Transforms the medication date and time into a readable format.
   * @description This method checks if the medication date is today, yesterday, or a different date, and formats the output accordingly.
   * If both `medicationDate` and `medicationTime` are missing, it returns 'Not Started'.
   *
   * @param medicationDate The date of the medication (string, format: 'YYYY-MM-DD').
   * @param medicationTime The time of the medication (string, format: 'HH:mm').
   * @returns A formatted string representing the medication date and time.
   * */
  transform(medicationDate: string, medicationTime: string): string {
    if (!medicationDate && !medicationTime) {
      return 'Not Started';
    }
    const date = new Date(medicationDate);
    if (this.IsToday(date)) {
      return `Today ${this.FormatTime(medicationTime)}`;
    } else if (this.IsYesterday(date)) {
      return `Yesterday ${this.FormatTime(medicationTime)}`;
    } else {
      return `${this.FormatDate(date)} ${this.FormatTime(medicationTime)}`;
    }
  }

  /**
 * @summary Checks if the given date is today.
 * @description This method compares the provided date with the current date and returns `true` if they match, otherwise `false`.
 *
 * @param date The date to be checked (Date object).
 * @returns `true` if the date is today, otherwise `false`.
 * */
  IsToday(date: Date): boolean {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  /**
 * @summary Checks if the given date is yesterday.
 * @description This method compares the provided date with the date of yesterday and returns `true` if they match, otherwise `false`.
 *
 * @param date The date to be checked (Date object).
 * @returns `true` if the date is yesterday, otherwise `false`.
 **/
  IsYesterday(date: Date): boolean {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return date.toDateString() === yesterday.toDateString();
  }

  /**
 * @summary Formats a date into a string (YYYY-MM-DD).
 * @description This method converts a Date object into a string with the format 'YYYY-MM-DD'.
 *
 * @param date The date to be formatted (Date object).
 * @returns A string representing the formatted date in 'YYYY-MM-DD' format.
 * */
  FormatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * @summary Formats a given time string into a 12-hour format with AM/PM.
   * @description This method takes a time string in 24-hour format (HH:mm),
   *              validates it, and converts it into a 12-hour format (hh:mm A).
   *              If the input is invalid, it returns "Invalid Time".
   * @param time The time string in 24-hour format (e.g., "14:30").
   * @returns A string representing the formatted time in 12-hour format with AM/PM (e.g., "02:30 PM").
   *          Returns "Invalid Time" if the input is not a valid time.
   */
  FormatTime(time: string): string {
    const timeMoment = moment(time, 'HH:mm');
    if (timeMoment.isValid()) {
      return timeMoment.format('hh:mm A');
    } else {
      return 'Invalid Time';
    }
  }
}
