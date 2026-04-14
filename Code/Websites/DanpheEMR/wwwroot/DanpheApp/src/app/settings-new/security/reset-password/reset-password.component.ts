import { ChangeDetectorRef, Component, EventEmitter, Input, Output } from "@angular/core";
import * as moment from 'moment/moment';
import { SecurityService } from '../../../security/shared/security.service';
import { User } from "../../../security/shared/user.model";
import { MessageboxService } from '../../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status } from "../../../shared/shared-enums";
import { SettingsBLService } from '../../shared/settings.bl.service';

@Component({
  selector: "reset-password",
  templateUrl: "./reset-password.html",
  host: { '(window:keydown)': 'KeysPressed($event)' }

})
export class ResetPasswordComponent {

  public CurrentUser: User = new User();
  public showResetPassPage: boolean = false;
  public reset: boolean = false;

  @Input("selected-ResetPass-Item")
  public selectedResetPassItem: User;

  @Output("callback-add")
  callbackAdd: EventEmitter<Object> = new EventEmitter<Object>();

  constructor(
    public settingsBLService: SettingsBLService,
    public securityService: SecurityService,
    public msgBoxServ: MessageboxService,
    public changeDetector: ChangeDetectorRef) {
    this.GoToNextInput("newpass");
  }

  ngOnInit() {
    if (this.selectedResetPassItem) {
      this.reset = true;
      this.CurrentUser = new User();
      this.CurrentUser = Object.assign(this.CurrentUser, this.selectedResetPassItem);
      this.CurrentUser.IsActive = this.selectedResetPassItem.IsActive;
      this.CurrentUser.ModifiedBy = this.securityService.GetLoggedInUser().EmployeeId;
      this.CurrentUser.UserId = this.selectedResetPassItem.UserId;
      this.CurrentUser.UserName = this.selectedResetPassItem.UserName;
      this.CurrentUser.NeedsPasswordUpdate = true;
      this.CurrentUser.ModifiedOn = moment().format('YYYY-MM-DD HH:mm');

    }
    else {
      this.CurrentUser = new User();
      this.CurrentUser.CreatedBy = this.securityService.GetLoggedInUser().EmployeeId;
      this.CurrentUser.CreatedOn = moment().format('YYYY-MM-DD HH:mm');
      this.reset = false;
    }
  }

  ResetPassword(): void {


    this.CurrentUser.RemoveValidators(["EmployeeId", "UserName", "Email"])
    //// checking validation on Property
    for (var i in this.CurrentUser.UserProfileValidator.controls) {
      this.CurrentUser.UserProfileValidator.controls[i].markAsDirty();
      this.CurrentUser.UserProfileValidator.controls[i].updateValueAndValidity();
    }

    if (this.CurrentUser.IsValidCheck(undefined, undefined)) {
      ///if Current user is valid then only we modify the property by Loggin userid and Date by Current date property
      this.CurrentUser.ModifiedBy = this.securityService.GetLoggedInUser().EmployeeId;
      this.CurrentUser.ModifiedOn = moment().format('YYYY-MM-DD HH:mm');

      this.settingsBLService.UpdatePassword(this.CurrentUser)
        .subscribe(
          res => {
            if (res.Status === ENUM_DanpheHTTPResponses.OK) {
              this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Success, ['Password Reset Successfully.']);
              this.showResetPassPage = false;
              this.CurrentUser = new User();
              this.callbackAdd.emit({});

            }
            else {
              this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, ["Something Wrong" + res.ErrorMessage]);
              this.logError(res.ErrorMessage);
            }

          },
          err => {
            this.logError(err);

          });
    }
  }


  ///this method is to clear the property during cancel click and during route after success and Error
  ClearData() {
    this.CurrentUser.Password = "";
    this.CurrentUser.ConfirmPassword = "";
    this.Close();
  }

  logError(err: any) {
    console.log(err);
  }
  Close() {
    this.selectedResetPassItem = null;
    this.reset = false;
    //this.showResetPassPage = false;
    this.callbackAdd.emit({});
  }
  GoToNextInput(id: string) {
    window.setTimeout(function () {
      let itmNameBox = document.getElementById(id);
      if (itmNameBox) {
        itmNameBox.focus();
      }
    }, 600);
  }
  KeysPressed(event) {
    if (event.keyCode == 27) { // For ESCAPE_KEY =>close pop up
      this.Close();
    }
  }

}
