import { Injectable } from '@angular/core';
import { AbstractControl, ValidationErrors } from '@angular/forms';
import { ENUM_Data_Type } from '../../shared/shared-enums';

@Injectable({
  providedIn: 'root'
})
export class ClinicalSettingsService {
  /**
   * Converts an enum object into an array of name-value pairs.
   * 
   * This method takes an enum object and returns an array of objects, 
   * each containing the name and value of an enum member. It filters out 
   * reverse mappings that TypeScript adds for numeric enums.
   * 
   * @param {any} enumObj - The enum object to convert.
   * @returns {Array<{name: string, value: string}>} An array of objects, each containing:
   *   - name: The name of the enum member as a string.
   *   - value: the value of the enum member as a string
   * 
   * @example
   * // Given an enum:
   * enum ExampleEnum {
   *   A = "xyz",
   *   B = "Abc",
   *   C = "Bikesh"
   * }
   * 
   * // Usage:
   * const entries = GetEnumEntries(ExampleEnum);
   * // Result:
   * // [
   * //   { name: 'A', value: "xyz" },
   * //   { name: 'B', value: "abc" },
   * //   { name: 'C', value: "Bikesh" }
   * // ]
   */
  GetEnumEntries(enumObj: any): { name: string, value: string }[] {
    return Object.keys(enumObj)
      .filter(key => typeof enumObj[key] === ENUM_Data_Type.String)
      .map(key => ({ name: key, value: enumObj[key] }));
  }
  AtLeastOneVisitSelected(group: AbstractControl): ValidationErrors | null {
    const isIPD = group.get('IsIPD').value;
    const isOPD = group.get('IsOPD').value;
    const isEmergency = group.get('IsEmergency').value;

    if (isIPD || isOPD || isEmergency) {
      return null;
    } else {
      return { atLeastOneRequired: true };
    }
  }
}
