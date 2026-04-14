

import { Component, OnInit } from '@angular/core';
import { SecurityService } from '../../../../security/shared/security.service';
import { DanpheHTTPResponse } from '../../../../shared/common-models';
import GridColumnSettings from '../../../../shared/danphe-grid/grid-column-settings.constant';
import { MessageboxService } from '../../../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status } from '../../../../shared/shared-enums';
import { GetOTAnaesthesiaType_DTO } from '../../../shared/dto/get-ot-anaesthesia-type.dto';
import { AnaesthesiaTypeModel } from '../../../shared/dto/ot-anaesthesiaType.model';
import { PostAnaesthesiaType_DTO } from '../../../shared/dto/ot-post-anaesthesiaType.dto';
import { OperationTheatreBLService } from '../../../shared/ot.bl.service';
import { OTService } from '../../../shared/ot.service';

@Component({
  selector: 'anaesthesia-type',
  templateUrl: './ot-manage-anaesthesia-type.component.html',

})
export class AnaesthesiaTypeComponent implements OnInit {
  AnaesthesiaType = new AnaesthesiaTypeModel();
  CurrentAnaesthesiaType = new PostAnaesthesiaType_DTO();
  SelectedAnaesthesiaType = new GetOTAnaesthesiaType_DTO();
  AnaesthesiaTypes = new Array<GetOTAnaesthesiaType_DTO>();
  AnaesthesiaGridColumns = new Array<any>();
  IsUpdate: boolean = false;

  constructor(
    private _OTBlService: OperationTheatreBLService,
    private _messageBoxService: MessageboxService,
    private _securityService: SecurityService,
    private _otService: OTService

  ) {
    let colSettings = new GridColumnSettings(this._securityService);
    this.AnaesthesiaGridColumns = colSettings.AnaesthesiaTypeListGridColumns;
    this.GetAnaesthesiaTypes();
  }

  ngOnInit(): void {
  }
  get AnaesthesiaTypeFormControls() {
    return this.AnaesthesiaType.AnaesthesiaTypeValidator.controls;
  }
  get AnaesthesiaTypeFormValue() {
    return this.AnaesthesiaType.AnaesthesiaTypeValidator.value;
  }

  GetAnaesthesiaTypes(): void {
    this._OTBlService.GetAnaesthesiaTypes()
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          if (res.Results && res.Results.length > 0) {
            this.AnaesthesiaTypes = res.Results;
            this._otService.setAnaesthesiaTypes(this.AnaesthesiaTypes);
          }
          else {
            this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`Anaesthesia is empty.`]);
          }
        }
      },
        (err: DanpheHTTPResponse) => {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Error : ${err.ErrorMessage}`]);
        });
  }

  AnaesthesiaTypeGridActions($event): void {
    switch ($event.Action) {
      case "edit":
        {
          this.IsUpdate = true;
          this.SelectedAnaesthesiaType = $event.Data;
          this.AnaesthesiaTypeFormControls.AnaesthesiaType.setValue(this.SelectedAnaesthesiaType.AnaesthesiaType);
          this.AnaesthesiaTypeFormControls.IsActive.setValue(this.SelectedAnaesthesiaType.IsActive);
        }
        break;

      default:
        break;
    }
  }

  SaveAnaesthesiaType(): void {
    if (this.AnaesthesiaTypeFormValue.AnaesthesiaType && this.AnaesthesiaTypeFormValue.AnaesthesiaType.trim() === "") {
      this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`Anaesthesia Type Can't be Empty.`]);
      return;
    }
    if (this.AnaesthesiaType.IsValidCheck(undefined, undefined)) {
      this.CurrentAnaesthesiaType.AnaesthesiaType = this.AnaesthesiaTypeFormValue.AnaesthesiaType.trim();
      this.CurrentAnaesthesiaType.IsActive = this.AnaesthesiaTypeFormValue.IsActive;
      if (!this.IsUpdate) {
        this.AddAnaesthesiaType();
      } else {
        this.CurrentAnaesthesiaType.AnaesthesiaTypeId = this.SelectedAnaesthesiaType.AnaesthesiaTypeId;
        this.UpdateAnaesthesiaType();
      }
    }
    else {
      this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Please fill mandatory field.`]);
    }
  }

  AddAnaesthesiaType(): void {
    let isDuplicate = this.AnaesthesiaTypes.some((p) => p.AnaesthesiaType.toLowerCase() === this.CurrentAnaesthesiaType.AnaesthesiaType.toLowerCase());
    if (isDuplicate) {
      this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`Duplicate Anaesthesia Type.`]);
      return;
    }
    this._OTBlService.AddAnaesthesiaType(this.CurrentAnaesthesiaType)
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this.ClearAnaesthesiaTyeFormControls();
          this.GetAnaesthesiaTypes();
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Success, [`New Anaesthesia Type Added Successfully.`]);
        }
        else {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, [`Unable to Add Anaesthesia Type.`]);
        }
      },
        (err: DanpheHTTPResponse) => {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Exception: ${err.ErrorMessage}`]);
        }
      );
  }

  UpdateAnaesthesiaType(): void {
    let isDuplicate = this.AnaesthesiaTypes.some((p) => p.AnaesthesiaType.toLowerCase() === this.CurrentAnaesthesiaType.AnaesthesiaType.toLowerCase() && p.AnaesthesiaTypeId !== this.CurrentAnaesthesiaType.AnaesthesiaTypeId);
    if (isDuplicate) {
      this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`Duplicate Anaesthesia Type.`]);
      return;
    }
    this._OTBlService.UpdateAnaesthesiaType(this.CurrentAnaesthesiaType)
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this.ClearAnaesthesiaTyeFormControls();
          this.IsUpdate = false;
          this.SelectedAnaesthesiaType = new GetOTAnaesthesiaType_DTO();
          this.GetAnaesthesiaTypes();
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Success, [`Anaesthesia Type Updated Successfully.`]);
        }
        else {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Unable to Update Anaesthesia Type.`]);
        }
      },
        (err: DanpheHTTPResponse) => {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Exception: ${err.ErrorMessage}`]);
        }
      );
  }

  GoToNextElement(event: KeyboardEvent, nextElementId: string): void {
    event.preventDefault();
    const nextElement = document.getElementById(nextElementId) as HTMLInputElement;
    if (nextElement) {
      nextElement.focus();
    }
  }

  ClearAnaesthesiaTyeFormControls(): void {
    this.AnaesthesiaType = new AnaesthesiaTypeModel();
    this.IsUpdate = false;
    this.SelectedAnaesthesiaType = new GetOTAnaesthesiaType_DTO();
  }


}
