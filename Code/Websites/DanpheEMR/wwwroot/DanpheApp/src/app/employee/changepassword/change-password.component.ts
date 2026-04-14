import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';

import { SecurityService } from '../../security/shared/security.service';

import { Router } from '@angular/router';
import { CoreService } from '../../core/shared/core.service';
import { MessageboxService } from '../../shared/messagebox/messagebox.service';
import { ChangePasswordModel } from '../shared/change-password.model';
import { EmployeeBLService } from '../shared/employee.bl.service';

@Component({
    templateUrl: "../../view/employee-view/ChangePassword.html" //"/EmployeeView/ChangePassword"
})
export class ChangePasswordComponent {
    public http: HttpClient;
    public needsPasswordUpdate: boolean = false;
    public currentPassModel: ChangePasswordModel = new ChangePasswordModel();
    constructor(public securityService: SecurityService, _http: HttpClient
        , public employeeBLService: EmployeeBLService
        , public msgBoxServ: MessageboxService
        , public router: Router,
        public coreservice: CoreService) {
        this.http = _http;
        this.currentPassModel.UserName = this.securityService.GetLoggedInUser().UserName;
        this.needsPasswordUpdate = this.securityService.GetLoggedInUser().NeedsPasswordUpdate;


    }

    ChangePassword() {

        //// checking validation on Property
        for (var i in this.currentPassModel.ChangePasswordValidator.controls) {
            this.currentPassModel.ChangePasswordValidator.controls[i].markAsDirty();
            this.currentPassModel.ChangePasswordValidator.controls[i].updateValueAndValidity();
        }

        if (this.currentPassModel.IsValidCheck(undefined, undefined)) {
            this.employeeBLService.UpdateCurrentPassword(this.currentPassModel)
                .subscribe(
                    res => {
                        var res1 = JSON.parse(res);
                        if (res1.Status == 'OK') {
                            this.securityService.GetLoggedInUser().NeedsPasswordUpdate = false;
                            this.msgBoxServ.showMessage("success", ["Password Updated Successfuly"]);
                            this.ClearChangePasswordData();
                            this.router.navigate(['/Employee/ProfileMain/UserProfile']);
                        }
                        else {
                            ////pointer come into this part when current password entered are different then Actual Db Store Password
                            this.logError(res1.ErrorMessage);
                            this.msgBoxServ.showMessage("error", ["Entered Current Password is Wrong"]);
                            this.ClearChangePasswordData();
                        }

                    },
                    err => {
                        this.logError(err);
                        this.msgBoxServ.showMessage("error", ["failed to update. please check log for details."]);
                    }


                );

        }
    }

    ///this method is to clear the property during cancel click and during route after success and Error
    ClearChangePasswordData() {

        // Resetting the form controls to ensure no validation errors remain
        const passwordControl = this.currentPassModel.ChangePasswordValidator.controls['Password'];
        const newPasswordControl = this.currentPassModel.ChangePasswordValidator.controls['NewPassword'];
        const confirmPasswordControl = this.currentPassModel.ChangePasswordValidator.controls['ConfirmPassword'];

        // Clearing values for each control
        passwordControl.setValue('');
        newPasswordControl.setValue('');
        confirmPasswordControl.setValue('');

        // Clearing any validation errors
        passwordControl.setErrors(null);
        newPasswordControl.setErrors(null);
        confirmPasswordControl.setErrors(null);

    }




    logError(err: any) {
        console.log(err);
    }

}