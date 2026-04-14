import { Component, OnInit } from '@angular/core';
import { SecurityService } from '../../../security/shared/security.service';
import { DanpheHTTPResponse } from '../../../shared/common-models';
import GridColumnSettings from '../../../shared/danphe-grid/grid-column-settings.constant';
import { MessageboxService } from '../../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status } from '../../../shared/shared-enums';
import { GetOTPersonnelType_DTO } from '../../shared/dto/get-ot-personnel-type.dto';
import { PostPersonnelType_DTO } from '../../shared/dto/post-ot-personnel.dto';
import { PersonnelTypeModel } from '../../shared/ot-personnel-type.model';
import { OperationTheatreBLService } from '../../shared/ot.bl.service';
import { OTService } from '../../shared/ot.service';

@Component({
  selector: 'ot-manage-personnel',
  templateUrl: './ot-manage-personnel-type.component.html',
  styleUrls: ['./ot-manage-personnel-type.component.css']
})

export class ManagePersonnelComponent implements OnInit {

  PersonnelGridColumns = new Array<any>();
  PersonnelType = new PersonnelTypeModel();
  CurrentPersonnelType = new PostPersonnelType_DTO();
  SelectedPersonnelType = new GetOTPersonnelType_DTO();
  PersonnelTypes = new Array<GetOTPersonnelType_DTO>();
  IsUpdate: boolean = false;

  constructor(
    private _OTBlService: OperationTheatreBLService,
    private _messageBoxService: MessageboxService,
    private _securityService: SecurityService,
    private _otService: OTService
  ) {
    let colSettings = new GridColumnSettings(this._securityService);
    this.PersonnelGridColumns = colSettings.PersonnelTypeListGridColumns;
    this.GetPersonnelTypes();
  }

  ngOnInit() {
    this.GoToFirstElement();
  }

  get PersonnelTypeFormControls() {
    return this.PersonnelType.PersonnelTypeValidator.controls;
  }
  get PersonnelTypeFormValue() {
    return this.PersonnelType.PersonnelTypeValidator.value;
  }

  PersonnelTypeGridActions($event): void {
    switch ($event.Action) {
      case "edit":
        {
          this.IsUpdate = true;
          this.SelectedPersonnelType = $event.Data;
          this.PersonnelTypeFormControls.PersonnelType.setValue(this.SelectedPersonnelType.PersonnelType);
          this.PersonnelTypeFormControls.IsActive.setValue(this.SelectedPersonnelType.IsActive);
          this.PersonnelTypeFormControls.IsIncentiveApplicable.setValue(this.SelectedPersonnelType.IsIncentiveApplicable);
        }
        break;

      default:
        break;
    }
  }

  GetPersonnelTypes(): void {
    this._OTBlService.GetPersonnelTypes()
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          if (res.Results && res.Results.length > 0) {
            this.PersonnelTypes = res.Results;
            this._otService.setPersonnelTypes(this.PersonnelTypes);
          }
          else {
            this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`PersonnelTypes is empty.`]);
          }
        }
      },
        (err: DanpheHTTPResponse) => {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Error : ${err.ErrorMessage}`]);
        });
  }

  SavePersonnelType(): void {
    if (this.PersonnelTypeFormValue.PersonnelType && this.PersonnelTypeFormValue.PersonnelType.trim() === "") {
      this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`Personnel Type Can't be Empty.`]);
      return;
    }
    if (this.PersonnelType.IsValidCheck(undefined, undefined)) {
      this.CurrentPersonnelType.PersonnelType = this.PersonnelTypeFormValue.PersonnelType.trim();
      this.CurrentPersonnelType.IsIncentiveApplicable = this.PersonnelTypeFormValue.IsIncentiveApplicable;
      this.CurrentPersonnelType.IsActive = this.PersonnelTypeFormValue.IsActive;
      if (!this.IsUpdate) {
        this.AddPersonnelType();
      } else {
        this.CurrentPersonnelType.PersonnelTypeId = this.SelectedPersonnelType.PersonnelTypeId;
        this.UpdatePersonnelType();
      }
    }
    else {
      this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Please fill mandatory field.`]);
    }
  }

  AddPersonnelType(): void {
    let isDuplicate = this.PersonnelTypes.some((p) => p.PersonnelType.toLowerCase() === this.CurrentPersonnelType.PersonnelType.toLowerCase());
    if (isDuplicate) {
      this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`Duplicate Personnel Type.`]);
      return;
    }
    this._OTBlService.AddPersonnelType(this.CurrentPersonnelType)
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this.ClearPersonnelTyeFormControls();
          this.GetPersonnelTypes();
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Success, [`New Personnel Type Added Successfully.`]);
        }
        else {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, [`Unable to Add Personnel Type.`]);
        }
      },
        (err: DanpheHTTPResponse) => {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Exception: ${err.ErrorMessage}`]);
        }
      );
  }

  ClearPersonnelTyeFormControls(): void {
    this.PersonnelType = new PersonnelTypeModel();
    this.IsUpdate = false;
    this.SelectedPersonnelType = new GetOTPersonnelType_DTO();
  }

  UpdatePersonnelType(): void {
    let isDuplicate = this.PersonnelTypes.some((p) => p.PersonnelType.toLowerCase() === this.CurrentPersonnelType.PersonnelType.toLowerCase() && p.PersonnelTypeId !== this.CurrentPersonnelType.PersonnelTypeId);
    if (isDuplicate) {
      this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`Duplicate Personnel Type.`]);
      return;
    }
    this._OTBlService.UpdatePersonnelType(this.CurrentPersonnelType)
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this.ClearPersonnelTyeFormControls();
          this.IsUpdate = false;
          this.SelectedPersonnelType = new GetOTPersonnelType_DTO();
          this.GetPersonnelTypes();
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Success, [`PersonnelType Updated Successfully.`]);
        }
        else {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Unable to Update PersonnelType.`]);
        }
      },
        (err: DanpheHTTPResponse) => {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Exception: ${err.ErrorMessage}`]);
        }
      );
  }

  GoToFirstElement(): void {
    const nextElement = document.getElementById('id_txt_personnel_type') as HTMLInputElement;
    if (nextElement) {
      nextElement.focus();
    }
  }

  GoToNextElement(event: KeyboardEvent, nextElementId: string): void {
    event.preventDefault(); //! Sanjeev, Prevent default behavior of Enter key
    const nextElement = document.getElementById(nextElementId) as HTMLInputElement;
    if (nextElement) {
      nextElement.focus();
    }
  }

}
