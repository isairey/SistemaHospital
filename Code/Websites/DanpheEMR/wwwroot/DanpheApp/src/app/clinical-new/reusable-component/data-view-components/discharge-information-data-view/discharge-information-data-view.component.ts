import { Component, OnInit } from '@angular/core';
import { DischargeInformation_DTO } from '../../../../clinical-new/shared/dto/discharge-information.dto';
import { DischargeConditionType_DTO, DischargeType_DTO } from '../../../../clinical-new/shared/dto/discharge-type.dto';
import { EmployeeListDTO } from '../../../../clinical-settings/shared/dto/employee-list.dto';
import { DanpheHTTPResponse } from '../../../../shared/common-models';
import { MessageboxService } from '../../../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status } from '../../../../shared/shared-enums';
import { ClinicalNoteBLService } from '../../../shared/clinical.bl.service';
import { Field } from '../../../shared/dto/field.dto';
import { PatientDetails_DTO } from '../../../shared/dto/patient-cln-detail.dto';

@Component({
  selector: "discharge-information-data-view",
  templateUrl: "./discharge-information-data-view.component.html"
})

export class DischargeInformationtDataViewComponent implements OnInit {
  Field: Field;
  IsAcrossVisitAvailability: boolean = false;
  SelectedPatient: PatientDetails_DTO = new PatientDetails_DTO();
  PatientVisitId: number = 0;
  PatientId: number = 0;
  DischargeInfoByPatientVisit = new DischargeInformation_DTO();
  DoctorList = new Array<EmployeeListDTO>();
  DischargeTypeList = new Array<DischargeType_DTO>();
  DischargeConditionTypeList = new Array<DischargeConditionType_DTO>();
  NurseList = new Array<EmployeeListDTO>();
  Anaesthetist = new Array<EmployeeListDTO>();
  DoctorIncharge: string = '';
  CheckedBy: string = '';
  ResidentDr: string = '';
  SelectedConsultants: string = '';
  DischargeType: string = '';
  DischargeCondition: string = '';
  Nurse: string = '';
  AnaesthetistName: string = '';
  constructor(
    private _clinicalNoteBLService: ClinicalNoteBLService,
    private _msgBoxServ: MessageboxService,
  ) { }

  ngOnInit() {
    this.InitializeFields();
  }

  InitializeFields() {
    if (this.Field) {
      this.IsAcrossVisitAvailability = this.Field.IsAcrossVisitAvailability;
    } else {
      this.IsAcrossVisitAvailability = false;
    }
    if (this.Field && this.Field.FieldConfig && this.Field.FieldConfig.PreTemplatePatientDetail) {
      this.SelectedPatient = this.Field.FieldConfig.PreTemplatePatientDetail;
    }

    this.GetDischargeInfoByPatientVisit();
    this.GetDoctorListForSignatories();
    this.GetDischargeType();
    this.GetDischargeConditionType();
    this.GetNursesListForSignatories();
    this.GetAnaesthetist();
  }

  GetDoctorListForSignatories() {
    this._clinicalNoteBLService.GetDoctorListForSignatories().subscribe((res: DanpheHTTPResponse) => {
      if (res.Status === ENUM_DanpheHTTPResponses.OK) {
        this.DoctorList = res.Results;
        this.SetDoctorNames();
      } else {
        this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ['Error while getting Doctor List.']);
      }
    });
  }
  GetNursesListForSignatories() {
    this._clinicalNoteBLService.GetNursesListForSignatories().subscribe((res: DanpheHTTPResponse) => {
      if (res.Status === ENUM_DanpheHTTPResponses.OK) {
        this.NurseList = res.Results;
        this.SetDoctorNames();
      } else {
        this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ['Error while getting Doctor List.']);
      }
    });
  }
  GetAnaesthetist() {
    this._clinicalNoteBLService.GetAnaesthetist().subscribe((res: DanpheHTTPResponse) => {
      if (res.Status === ENUM_DanpheHTTPResponses.OK) {
        this.Anaesthetist = res.Results;
        this.SetDoctorNames();
      } else {
        this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ['Error while getting Doctor List.']);
      }
    });
  }

  GetDischargeType() {
    this._clinicalNoteBLService.GetDischargeType().subscribe((res: DanpheHTTPResponse) => {
      if (res.Status === ENUM_DanpheHTTPResponses.OK) {
        this.DischargeTypeList = res.Results;
        this.SetDischargeTypeName();
      } else {
        this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ['Error while getting Discharge Types.']);
      }
    });
  }

  GetDischargeConditionType() {
    this._clinicalNoteBLService.GetDischargeConditionType().subscribe((res: DanpheHTTPResponse) => {
      if (res.Status === ENUM_DanpheHTTPResponses.OK) {
        this.DischargeConditionTypeList = res.Results;
        this.SetDischargeConditionName();
      } else {
        this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ['Error while getting Discharge Condition Types.']);
      }
    });
  }



  public GetDischargeInfoByPatientVisit() {
    this.PatientVisitId = this.SelectedPatient.PatientVisitId;
    this.PatientId = this.SelectedPatient.PatientId;
    this._clinicalNoteBLService.GetDischargeInfoByPatientVisit(this.PatientId, this.PatientVisitId, this.IsAcrossVisitAvailability).subscribe((res: DanpheHTTPResponse) => {
      if (res.Status === ENUM_DanpheHTTPResponses.OK) {
        this.DischargeInfoByPatientVisit = res.Results;
        this.SetDoctorNames();
        this.SetDischargeTypeName();
        this.SetDischargeConditionName();
      } else {
        this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ['Error while getting Discharge Info.']);
      }
    });
  }

  SetDischargeTypeName() {
    if (this.DischargeInfoByPatientVisit && this.DischargeTypeList.length > 0) {
      const dischargeType = this.DischargeTypeList.find(dt => dt.DischargeTypeId === this.DischargeInfoByPatientVisit.DischargeTypeId);
      this.DischargeType = dischargeType ? dischargeType.DischargeTypeName : '';
    }
  }

  SetDischargeConditionName() {
    if (this.DischargeInfoByPatientVisit && this.DischargeConditionTypeList.length > 0) {
      const dischargeCondition = this.DischargeConditionTypeList.find(dc => dc.DischargeConditionId === this.DischargeInfoByPatientVisit.SubDischargeTypeId);
      this.DischargeCondition = dischargeCondition ? dischargeCondition.Condition : '';
    }
  }



  SetDoctorNames() {
    if (this.DischargeInfoByPatientVisit && this.DoctorList.length > 0) {
      const doctorIncharge = this.DoctorList.find(d => d.EmployeeId === this.DischargeInfoByPatientVisit.DoctorInchargeId);
      this.DoctorIncharge = doctorIncharge ? doctorIncharge.EmployeeName : '';

      const checkedBy = this.DoctorList.find(d => d.EmployeeId === this.DischargeInfoByPatientVisit.CheckdById);
      this.CheckedBy = checkedBy ? checkedBy.EmployeeName : '';

      const residentDr = this.DoctorList.find(d => d.EmployeeId === this.DischargeInfoByPatientVisit.ResidentDrId);
      this.ResidentDr = residentDr ? residentDr.EmployeeName : '';

      const anaesthetist = this.Anaesthetist.find(d => d.EmployeeId === this.DischargeInfoByPatientVisit.AnaesthetistId);
      this.AnaesthetistName = anaesthetist ? anaesthetist.EmployeeName : '';

      const nurseList = this.NurseList.find(d => d.EmployeeId === this.DischargeInfoByPatientVisit.DischargeNurseId);
      this.Nurse = nurseList ? nurseList.EmployeeName : '';

      if (this.DischargeInfoByPatientVisit.Consultant) {
        const consultantIds = JSON.parse(this.DischargeInfoByPatientVisit.Consultant).consultants;
        const consultantNames = consultantIds.map(id => {
          const consultant = this.DoctorList.find(d => d.EmployeeId === id);
          return consultant ? consultant.EmployeeName : '';
        });
        this.SelectedConsultants = consultantNames.join(', ');
      }
    }
  }
}
