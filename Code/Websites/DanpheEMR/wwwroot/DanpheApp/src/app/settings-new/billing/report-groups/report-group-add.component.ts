import { Component, EventEmitter, Input, Output } from '@angular/core';
import * as moment from 'moment';
import { SecurityService } from '../../../security/shared/security.service';
import { DanpheHTTPResponse } from '../../../shared/common-models';
import { MessageboxService } from '../../../shared/messagebox/messagebox.service';
import { ENUM_Add_UpdateAction, ENUM_DanpheHTTPResponses, ENUM_EscapeKey, ENUM_MessageBox_Status } from '../../../shared/shared-enums';
import { SettingsBLService } from '../../shared/settings.bl.service';
import { ReportGroupModel } from '../shared/report-group.model';


@Component({
  selector: 'report-group-add',
  templateUrl: './report-group-add.component.html',
  host: { '(window:keydown)': 'hotkeys($event)' }
})

export class ReportGroupComponent {

  public currentReportGroup: ReportGroupModel = new ReportGroupModel();

  @Input("selectedItem")
  public selectedItem: ReportGroupModel;
  @Output("callback-add")
  callbackAdd: EventEmitter<Object> = new EventEmitter<Object>();

  @Input("report-group-list")
  public ReportGroupList: Array<ReportGroupModel>;

  public ShowAddNewPage: boolean = false;
  public Update: boolean = false;
  constructor(
    public _securityService: SecurityService,
    private _msgBoxServ: MessageboxService,
    private _settingsBLService: SettingsBLService,
  ) {
  }
  ngOnInit() {

    if (this.selectedItem) {
      this.Update = true;
      this.currentReportGroup = Object.assign(this.currentReportGroup, this.selectedItem);
      this.currentReportGroup.ReportGroupValidator.patchValue({
        GroupName: this.selectedItem.GroupName,
        DynamicReportGroupId: this.selectedItem.DynamicReportGroupId
      });
    }
    else {
      this.currentReportGroup.ReportGroupValidator.reset();
      this.currentReportGroup = new ReportGroupModel();
      this.currentReportGroup.CreatedBy = this._securityService.GetLoggedInUser().EmployeeId;
      this.currentReportGroup.CreatedOn = moment().format('YYYY-MM-DD HH:mm:ss');
      this.Update = false;
    }
  }
  Close() {
    this.currentReportGroup = new ReportGroupModel;
    this.currentReportGroup.ReportGroupValidator.reset();
    this.selectedItem = null;
    this.callbackAdd.emit({ action: "close", item: null });
    this.Update = false;
  }

  public hotkeys(event: KeyboardEvent) {
    if (event.key === ENUM_EscapeKey.EscapeKey) {
      this.Close()
    }
  }

  AddReportGroup() {
    if (!this.CheckValidations()) {
      return;
    }
    const reportGroupName = {
      GroupName: this.currentReportGroup.ReportGroupValidator.value.GroupName
    };
    this._settingsBLService.AddReportGroup(reportGroupName)
      .subscribe(
        (res: DanpheHTTPResponse) => {
          if (res.Status === ENUM_DanpheHTTPResponses.OK) {
            this.CallBackAddUpdate(res.Results);
            this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Success, ["Added successfully."]);
          }
          else {
            this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, [res.ErrorMessage]);
          }
        });
  }
  UpdateReportGroup() {
    if (!this.CheckValidations()) {
      return;
    }
    this._settingsBLService.UpdateReportGroup(this.currentReportGroup.ReportGroupValidator.value)
      .subscribe(
        (res: DanpheHTTPResponse) => {
          if (res.Status === ENUM_DanpheHTTPResponses.OK) {
            this.CallBackAddUpdate(res.Results);
            this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Success, ["Report Group Updated Successfully"]);
          }
          else {
            this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, [res.ErrorMessage]);
          }
        });
  }

  CallBackAddUpdate(freeService: ReportGroupModel) {
    let updatedItem: ReportGroupModel = freeService;
    var item: ReportGroupModel = new ReportGroupModel();
    item.DynamicReportGroupId = updatedItem.DynamicReportGroupId;
    this.callbackAdd.emit({ action: this.Update ? ENUM_Add_UpdateAction.Update : ENUM_Add_UpdateAction.Add, item: item });
  }

  CheckValidations(): boolean {
    let isValid: boolean = true;
    if (this.currentReportGroup.ReportGroupValidator.controls['GroupName'].invalid) {
      this.currentReportGroup.ReportGroupValidator.controls['GroupName'].markAsDirty();
      this.currentReportGroup.ReportGroupValidator.controls['GroupName'].updateValueAndValidity();
      this._msgBoxServ.showMessage("failed", ["Group Name is required."]);
      isValid = false;
    }
    for (var i in this.currentReportGroup.ReportGroupValidator.controls) {
      if (this.currentReportGroup.ReportGroupValidator.controls[i].invalid) {
        this.currentReportGroup.ReportGroupValidator.controls[i].markAsDirty();
        this.currentReportGroup.ReportGroupValidator.controls[i].updateValueAndValidity();
        isValid = false;
      }
    }

    if (this.currentReportGroup.DynamicReportGroupId === 0) {
      this._msgBoxServ.showMessage("failed", ["Please Select Report Name."]);
      isValid = false;
    }

    return isValid;
  }
}