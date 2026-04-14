import { Injectable } from '@angular/core';
import { Employee } from '../../employee/shared/employee.model';
import { Department } from '../../settings-new/shared/department.model';

@Injectable({
  providedIn: 'root'
})
export class ClinicalService {
  public PatientVisitId: number = null;
  public DepartmentList = new Array<Department>();
  public DoctorList = new Array<Employee>();

  public SetPatientVisitId(patientVisitId: number) {
    this.PatientVisitId = patientVisitId;
  }
  public GetPatientVisitId(): number {
    return this.PatientVisitId;
  }
  public GetDepartmentList(): Array<Department> {
    return this.DepartmentList;
  }
  public SetDepartmentList(Department: Array<Department>) {
    this.DepartmentList = Department;;
  }
  public GetDoctorList(): Array<Employee> {
    return this.DoctorList;
  }
  public SetDoctorList(Employee: Array<Employee>) {
    this.DoctorList = Employee;
  }

  /**
 * CheckValidContent(input)
 * This method takes the input of free type (SummerNote) HTML content.
 * It performs the following actions:
 * 1. Removes all HTML tags.
 * 2. Replaces non-breaking spaces (`&nbsp;`) with an empty string.
 * 3. Removes all whitespace characters.
 * Finally, it checks whether the cleaned content consists of any meaningful string value
 * or if it is empty and returns a boolean accordingly.
 */

  CheckValidContent(input: string): boolean {
    if (!input) {
      return false;
    }
    const cleanedInput = input
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, '')
      .replace(/\s+/g, '');
    return cleanedInput.length > 0;
  }
}
