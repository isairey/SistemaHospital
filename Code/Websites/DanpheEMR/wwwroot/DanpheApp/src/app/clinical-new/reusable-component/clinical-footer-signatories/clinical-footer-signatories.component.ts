import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { EmployeeListDTO } from '../../../clinical-settings/shared/dto/employee-list.dto';
import { SecurityService } from '../../../security/shared/security.service';
import { User } from '../../../security/shared/user.model';
import { DanpheHTTPResponse } from '../../../shared/common-models';
import { ENUM_DanpheHTTPResponses } from '../../../shared/shared-enums';
import { ClinicalNoteBLService } from '../../shared/clinical.bl.service';

@Component({
  selector: 'clinical-footer-signatories',
  templateUrl: './clinical-footer-signatories.component.html',
  styleUrls: ['./clinical-footer-signatories.component.css']
})
export class ClinicalFooterSignatoriesComponent implements OnInit {
  @Output('Doctor-Selected')
  DoctorSelected = new EventEmitter<EmployeeListDTO[]>();

  @Output('Nurse-Selected')
  NurseSelected = new EventEmitter<EmployeeListDTO>();

  @Output('CheckedBy-Selected')
  SelectedCheckedBy = new EventEmitter<EmployeeListDTO>();
  @Output('PreparedBy-Selected')
  SelectedPreparedBy = new EventEmitter<EmployeeListDTO>();
  EmployeeList = new Array<EmployeeListDTO>();
  NursesList = new Array<EmployeeListDTO>();
  SelectedRequestToDoctor = new EmployeeListDTO();
  SelectedRequestToDoctorList: EmployeeListDTO[] = [];
  SelectedRequestToNurse = new EmployeeListDTO();
  CurrentUser: User = new User();
  SelectedRequestToPreparedBy = new EmployeeListDTO();
  SelectedRequestToCheckedBy = new EmployeeListDTO();
  constructor(
    private _clinicalBlService: ClinicalNoteBLService,
    public securityService: SecurityService,
  ) {
    this.GetDoctorListForSignatories();
    this.GetNursesListForSignatories();
  }

  ngOnInit() {
    this.CurrentUser = this.securityService.GetLoggedInUser() as User;
  }


  /**
     @summary
      * Retrieves a list of doctors eligible for signatories and sets the current doctor based on the user's details.
     If no doctor is currently selected (`SelectedRequestToDoctor.EmployeeId` is not set) and there is a current user with an employee record:
   *    - Finds a doctor in the `EmployeeList` whose `EmployeeId` and `EmployeeRoleId` match those of the current user.
   *    - If a matching doctor is found, sets `SelectedRequestToDoctor` to this doctor and calls `OnDoctorChange` to handle any further updates.

     */
  GetDoctorListForSignatories(): void {
    this._clinicalBlService.GetDoctorListForSignatories()
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this.EmployeeList = res.Results;
          if (!this.SelectedRequestToDoctor.EmployeeId && this.CurrentUser.Employee) {
            const matchedDoctor = this.EmployeeList.find(doctor =>
              doctor.EmployeeId === this.CurrentUser.Employee.EmployeeId &&
              doctor.EmployeeRoleId === this.CurrentUser.Employee.EmployeeRoleId);

            if (matchedDoctor) {
              this.SelectedRequestToDoctorList = [matchedDoctor];
              this.OnDoctorChange(this.SelectedRequestToDoctorList);
            }
          }
          if (!this.SelectedRequestToCheckedBy.EmployeeId && this.CurrentUser.Employee) {
            const matchedDoctor = this.EmployeeList.find(checkedBy =>
              checkedBy.EmployeeId === this.CurrentUser.Employee.EmployeeId &&
              checkedBy.EmployeeRoleId === this.CurrentUser.Employee.EmployeeRoleId);

            if (matchedDoctor) {
              this.SelectedRequestToCheckedBy = matchedDoctor;
              this.OnCheckedByChange();
            }
          }
          if (!this.SelectedRequestToPreparedBy.EmployeeId && this.CurrentUser.Employee) {
            const matchedDoctor = this.EmployeeList.find(preparedBy =>
              preparedBy.EmployeeId === this.CurrentUser.Employee.EmployeeId &&
              preparedBy.EmployeeRoleId === this.CurrentUser.Employee.EmployeeRoleId);

            if (matchedDoctor) {
              this.SelectedRequestToPreparedBy = matchedDoctor;
              this.OnPreparedByChange();
            }
          }
        }
      });
  }


  public myListFormatter(data: any): string {
    let html = data["EmployeeName"];
    return html;
  }
  OnDoctorChange(selectedDoctors: EmployeeListDTO[]) {
    this.SelectedRequestToDoctorList = selectedDoctors;
    this.DoctorSelected.emit(this.SelectedRequestToDoctorList);
  }

  OnNurseChange() {
    this.NurseSelected.emit(this.SelectedRequestToNurse);
  }
  OnCheckedByChange() {
    this.SelectedCheckedBy.emit(this.SelectedRequestToCheckedBy);
  }
  OnPreparedByChange() {
    this.SelectedPreparedBy.emit(this.SelectedRequestToPreparedBy);
  }


  /**
    @summary
* Retrieves a list of nurses eligible for signatories and selects a nurse based on the current user's details.
     If no nurse is currently selected (`SelectedRequestToNurse.EmployeeId` is not set) and there is a current user with an employee record:
*    - Finds a nurse in the `NursesList` whose `EmployeeId` and `EmployeeRoleId` match those of the current user.
*    - If a matching nurse is found, sets `SelectedRequestToNurse` to this nurse and calls `OnNurseChange` to handle any further updates.
*/
  GetNursesListForSignatories(): void {
    this._clinicalBlService.GetNursesListForSignatories()
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this.NursesList = res.Results;
          if (!this.SelectedRequestToNurse.EmployeeId && this.CurrentUser.Employee) {
            const matchedNurse = this.NursesList.find(nurse =>
              nurse.EmployeeId === this.CurrentUser.Employee.EmployeeId &&
              nurse.EmployeeRoleId === this.CurrentUser.Employee.EmployeeRoleId);

            if (matchedNurse) {
              this.SelectedRequestToNurse = matchedNurse;
              this.OnNurseChange();
            }
          }
        }
      });
  }

}
