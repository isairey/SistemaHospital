import { Component, OnInit } from '@angular/core';
import { CoreService } from '../../../core/shared/core.service';
import { SecurityService } from '../../../security/shared/security.service';
import { DanpheHTTPResponse } from '../../../shared/common-models';
import GridColumnSettings from '../../../shared/danphe-grid/grid-column-settings.constant';
import { MessageboxService } from '../../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status } from '../../../shared/shared-enums';
import { GetOTMachine_DTO } from '../../shared/dto/get-ot-machine.dto';
import { PostOTMachine_DTO } from '../../shared/dto/post-ot-machine.dto';
import { OTMachineModel } from '../../shared/ot-machine.model';
import { OperationTheatreBLService } from '../../shared/ot.bl.service';
import { OTService } from '../../shared/ot.service';

@Component({
  selector: 'ot-manage-machines',
  templateUrl: './ot-manage-machines.component.html',
  styleUrls: ['./ot-manage-machines.component.css']
})
export class ManageMachinesComponent implements OnInit {
  OTMachineGridColumns = new Array<any>();
  OTMachine = new OTMachineModel();
  CurrentOTMachine = new PostOTMachine_DTO();
  SelectedOTMachine = new GetOTMachine_DTO();
  OTMachineList = new Array<GetOTMachine_DTO>();
  IsUpdate: boolean = false;

  constructor(
    private _OTBlService: OperationTheatreBLService,
    private _messageBoxService: MessageboxService,
    private _securityService: SecurityService,
    private _otService: OTService,
    public coreService: CoreService
  ) {
    let colSettings = new GridColumnSettings(this._securityService);
    this.OTMachineGridColumns = colSettings.OTMachineListGridColumns;
    this.GetOTMachines();
  }

  ngOnInit() {
    this.GoToFirstElement();
  }

  get OTMachineFormControls() {
    return this.OTMachine.OTMachineValidator.controls;
  }
  get OTMachineFormValue() {
    return this.OTMachine.OTMachineValidator.value;
  }

  OTMachineGridActions($event): void {
    switch ($event.Action) {
      case "edit":
        {
          this.IsUpdate = true;
          this.SelectedOTMachine = $event.Data;
          this.OTMachineFormControls.MachineName.setValue(this.SelectedOTMachine.MachineName);
          this.OTMachineFormControls.MachineCharge.setValue(this.SelectedOTMachine.MachineCharge);
          this.OTMachineFormControls.IsActive.setValue(this.SelectedOTMachine.IsActive);
        }
        break;

      default:
        break;
    }
  }

  GetOTMachines(): void {
    this._OTBlService.GetOTMachines()
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          if (res.Results && res.Results.length) {
            this.OTMachineList = res.Results;
            this._otService.setOTMachines(this.OTMachineList);
          }
          else {
            this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`OTMachine list is empty.`]);
          }
        }
      },
        (err: DanpheHTTPResponse) => {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Error : ${err.ErrorMessage}`]);
        });
  }

  SaveOTMachine(): void {
    if (this.OTMachineFormValue.MachineName && !this.OTMachineFormValue.MachineName.trim()) {
      this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`Machine Name Can't be Empty.`]);
      return;
    }
    if (this.OTMachine.IsValidCheck(undefined, undefined)) {
      this.CurrentOTMachine.MachineName = this.OTMachineFormValue.MachineName.trim();
      this.CurrentOTMachine.MachineCharge = this.OTMachineFormValue.MachineCharge ? this.OTMachineFormValue.MachineCharge : 0;
      this.CurrentOTMachine.IsActive = this.OTMachineFormValue.IsActive;
      if (!this.IsUpdate) {

        this.AddOTMachine();
      } else {
        this.CurrentOTMachine.OTMachineId = this.SelectedOTMachine.OTMachineId;
        this.UpdateOTMachine();
      }

    }
    else {
      this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Please fill mandatory field.`]);
    }
  }

  AddOTMachine(): void {
    let isDuplicate = this.OTMachineList.some((m) => m.MachineName.toLowerCase() === this.CurrentOTMachine.MachineName.toLowerCase());
    if (isDuplicate) {
      this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`Duplicate Machine.`]);
      return;
    }
    this._OTBlService.AddOTMachine(this.CurrentOTMachine)
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this.OTMachine = new OTMachineModel();
          this.GetOTMachines();
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Success, [`New OT Machine Added Successfully.`]);
        }
        else {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, [`Unable to Add OT Machine.`]);
        }
      },
        (err: DanpheHTTPResponse) => {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Exception: ${err.ErrorMessage}`]);
        }
      );
  }

  ClearOTMachineFormControls(): void {
    this.OTMachine = new OTMachineModel();
    this.IsUpdate = false;
    this.SelectedOTMachine = new GetOTMachine_DTO();
  }

  UpdateOTMachine(): void {
    let isDuplicate = this.OTMachineList.some((m) => m.MachineName.toLowerCase() === this.CurrentOTMachine.MachineName.toLowerCase() && m.OTMachineId !== this.CurrentOTMachine.OTMachineId);
    if (isDuplicate) {
      this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`Duplicate Machine.`]);
      return;
    }
    this._OTBlService.UpdateOTMachine(this.CurrentOTMachine)
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this.ClearOTMachineFormControls();
          this.IsUpdate = false;
          this.SelectedOTMachine = new GetOTMachine_DTO();
          this.GetOTMachines();
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Success, [`OT Machine Updated Successfully.`]);
        }
        else {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Unable to Update OT Machine.`]);
        }
      },
        (err: DanpheHTTPResponse) => {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Exception: ${err.ErrorMessage}`]);
        }
      );
  }

  GoToFirstElement(): void {
    const nextElement = document.getElementById('id_txt_machine_name') as HTMLInputElement;
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

  OnMachineChargeChange() {
    let machineCharge = this.OTMachineFormValue.MachineCharge;
    if (machineCharge < 0) {
      this.OTMachineFormControls.MachineCharge.setValue(0);
    }
  }

}
