import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SecurityService } from '../../../security/shared/security.service';
import { DanpheHTTPResponse } from '../../../shared/common-models';
import GridColumnSettings from '../../../shared/danphe-grid/grid-column-settings.constant';
import { MessageboxService } from '../../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status } from '../../../shared/shared-enums';
import { GetOTSurgery_DTO } from '../../shared/dto/get-ot-surgery.dto';
import { PostOTSurgery_DTO } from '../../shared/dto/post-ot-surgery';
import { OTSurgeryModel } from '../../shared/ot-surgery.model';
import { OperationTheatreBLService } from '../../shared/ot.bl.service';
import { OTService } from '../../shared/ot.service';

@Component({
  selector: 'ot-manage-surgery',
  templateUrl: './ot-manage-surgery.component.html',
  styleUrls: ['./ot-manage-surgery.component.css'],
})
export class ManageSurgeryComponent implements OnInit {

  OTSurgeryGridColumns = new Array<any>();
  OTSurgery = new OTSurgeryModel();
  CurrentOTSurgery = new PostOTSurgery_DTO();
  SelectedOTSurgery = new GetOTSurgery_DTO();
  OTSurgeryList = new Array<GetOTSurgery_DTO>();
  IsUpdate: boolean = false;

  constructor(
    private _OTBlService: OperationTheatreBLService,
    private _messageBoxService: MessageboxService,
    private _securityService: SecurityService,
    private _router: Router,
    private _otService: OTService
  ) {
    let colSettings = new GridColumnSettings(this._securityService);
    this.OTSurgeryGridColumns = colSettings.OTSurgeryListGridColumns;
    this.GetOTSurgeries();
  }

  ngOnInit(): void {
    this.GoToFirstElement();
  }

  get OTSurgeryFormControls() {
    return this.OTSurgery.OTSurgeryValidator.controls;
  }
  get OTSurgeryFormValue() {
    return this.OTSurgery.OTSurgeryValidator.value;
  }

  OTSurgeryGridActions($event): void {
    switch ($event.Action) {
      case "edit":
        {
          this.IsUpdate = true;
          this.SelectedOTSurgery = $event.Data;
          this.OTSurgeryFormControls.SurgeryName.setValue(this.SelectedOTSurgery.SurgeryName);
          this.OTSurgeryFormControls.SurgeryCode.setValue(this.SelectedOTSurgery.SurgeryCode);
          this.OTSurgeryFormControls.Description.setValue(this.SelectedOTSurgery.Description);
          this.OTSurgeryFormControls.IsActive.setValue(this.SelectedOTSurgery.IsActive);
        }
        break;

      case "map-surgery-checklist":
        {
          this.SelectedOTSurgery = $event.Data;
          this._otService.setSurgeryId(this.SelectedOTSurgery.SurgeryId);
          this._router.navigate(['/OperationTheatre/Settings/MapSurgeryCheckList']);
        }
        break;

      default:
        break;
    }
  }

  GetOTSurgeries(): void {
    this._OTBlService.GetOTSurgeries()
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          if (res.Results && res.Results.length) {
            this.OTSurgeryList = res.Results;
            this._otService.setOTSurgeries(this.OTSurgeryList);
          }
          else {
            this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`OTSurgery list is empty.`]);
          }
        }
      },
        (err: DanpheHTTPResponse) => {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Error : ${err.ErrorMessage}`]);
        });
  }

  SaveOTSurgery(): void {
    if (this.CheckValidation() === false) {
      return;
    }
    if (this.OTSurgeryFormValue.SurgeryName && this.OTSurgeryFormValue.SurgeryName.trim() === "") {
      this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`Surgery Name Can't be Empty.`]);
      return;
    }
    if (this.OTSurgery.IsValidCheck(undefined, undefined)) {
      this.CurrentOTSurgery.SurgeryName = this.OTSurgeryFormValue.SurgeryName.trim();
      this.CurrentOTSurgery.SurgeryCode = this.OTSurgeryFormValue.SurgeryCode.trim();
      this.CurrentOTSurgery.Description = this.OTSurgeryFormValue.Description ? this.OTSurgeryFormValue.Description.trim() : null;
      this.CurrentOTSurgery.IsActive = this.OTSurgeryFormValue.IsActive;
      if (!this.IsUpdate) {
        this.AddOTSurgery();
      }
      else {
        this.CurrentOTSurgery.SurgeryId = this.SelectedOTSurgery.SurgeryId;
        this.UpdateOTSurgery();
      }

    }
    else {
      this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Please fill mandatory field.`]);
    }
  }

  CheckValidation(): boolean {
    let isValid: boolean = true;
    if (this.OTSurgeryFormValue.SurgeryName && this.OTSurgeryFormValue.SurgeryName.trim() === "") {
      this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`Surgery Name Can't be Empty.`]);
      isValid = false;
    }
    if (this.OTSurgeryFormValue.SurgeryCode && this.OTSurgeryFormValue.SurgeryCode.trim() === "") {
      this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`Surgery Code Can't be Empty.`]);
      isValid = false;
    }
    return isValid;
  }

  AddOTSurgery(): void {
    if (this.CheckDuplication() === true) {
      return;
    }
    this._OTBlService.AddOTSurgery(this.CurrentOTSurgery)
      .subscribe((res: DanpheHTTPResponse): void => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this.OTSurgery = new OTSurgeryModel();
          this.GetOTSurgeries();
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Success, [`New OT Surgery Added Successfully.`]);
        }
        else {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, [`Unable to Add OT Surgery.`]);
        }
      },
        (err: DanpheHTTPResponse) => {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Exception: ${err.ErrorMessage}`]);
        }
      );
  }

  ClearOTSurgeryFormControls(): void {
    this.OTSurgery = new OTSurgeryModel();
    this.IsUpdate = false;
    this.SelectedOTSurgery = new GetOTSurgery_DTO();
  }

  UpdateOTSurgery(): void {
    if (this.CheckDuplication() === true) {
      return;
    }
    this._OTBlService.UpdateOTSurgery(this.CurrentOTSurgery)
      .subscribe((res: DanpheHTTPResponse): void => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this.ClearOTSurgeryFormControls();
          this.IsUpdate = false;
          this.SelectedOTSurgery = new GetOTSurgery_DTO();
          this.GetOTSurgeries();
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Success, [`OT Surgery Updated Successfully.`]);
        }
        else {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Unable to Update OT Surgery.`]);
        }
      },
        (err: DanpheHTTPResponse) => {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Exception: ${err.ErrorMessage}`]);
        }
      );
  }

  CheckDuplication(): boolean {
    let isDuplicate = false;

    let isSurgeryNameDuplicate = this.OTSurgeryList.some((m) => m.SurgeryName.toLowerCase() === this.CurrentOTSurgery.SurgeryName.toLowerCase() && m.SurgeryId !== this.CurrentOTSurgery.SurgeryId);
    if (isSurgeryNameDuplicate) {
      this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`Duplicate Surgery Name.`]);
      isSurgeryNameDuplicate = true;
    }
    let isSurgeryCodeDuplicate = this.OTSurgeryList.some((m) => m.SurgeryCode.toLowerCase() === this.CurrentOTSurgery.SurgeryCode.toLowerCase() && m.SurgeryId !== this.CurrentOTSurgery.SurgeryId);
    if (isSurgeryCodeDuplicate) {
      this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`Duplicate Surgery Code.`]);
      isSurgeryCodeDuplicate = true;
    }
    if (isSurgeryNameDuplicate || isSurgeryCodeDuplicate) {
      return true;
    }
    else {
      return false;
    }
  }

  GoToFirstElement(): void {
    const nextElement = document.getElementById('id_txt_Surgery_name') as HTMLInputElement;
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
