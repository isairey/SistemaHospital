import { Component, EventEmitter, Input, Output } from "@angular/core";

//Parse, validate, manipulate, and display dates and times in JS.
import { SecurityService } from "../../../security/shared/security.service";
import { MessageboxService } from "../../../shared/messagebox/messagebox.service";
import { ENUM_MessageBox_Status } from "../../../shared/shared-enums";
import { CompanyModel } from "../shared/company/company.model";
import { CompanyService } from "../shared/company/company.service";


@Component({
    selector: "company-add",
    templateUrl: "./company-add.html",
    host: { '(window:keyup)': 'hotkeys($event)' }
})
export class CompanyAddComponent {

    @Input("selected-company")
    public CurrentCompany: CompanyModel;
    public showAddPage: boolean = false;

    public loading: boolean = false;

    @Input("companyList")
    public CompanyList = new Array<CompanyModel>();

    @Output("callback-add")
    callbackAdd: EventEmitter<Object> = new EventEmitter<Object>();

    constructor(public companyService: CompanyService, public securityService: SecurityService,
        public msgBoxServ: MessageboxService) {
    }

    @Input('showAddPage')
    public set ShowAdd(_showAdd) {
        this.showAddPage = _showAdd;
        if (this.showAddPage) {
            if (this.CurrentCompany && this.CurrentCompany.CompanyId) {
                let Company = new CompanyModel();
                this.CurrentCompany = Object.assign(Company, this.CurrentCompany);
            }
            else {
                this.CurrentCompany = new CompanyModel();
            }
        }

    }

    //adding new Company
    AddCompany() {
        //for checking validations, marking all the fields as dirty and checking the validity.
        for (var i in this.CurrentCompany.CompanyValidator.controls) {
            this.CurrentCompany.CompanyValidator.controls[i].markAsDirty();
            this.CurrentCompany.CompanyValidator.controls[i].updateValueAndValidity();
        }


        if (this.CompanyList && this.CompanyList.length) {
            const currentCompanyName = this.CurrentCompany.CompanyName ? this.CurrentCompany.CompanyName.toLowerCase() : '';
            const currentCompanyCode = this.CurrentCompany.Code ? this.CurrentCompany.Code.toLowerCase() : '';

            // Checking if CompanyName already exists
            const isCompanyNameAlreadyExists = this.CompanyList.some(a =>
                a.CompanyName && a.CompanyName.toLowerCase() === currentCompanyName
            );

            // Checking if Company Code already exists
            const isCompanyCodeAlreadyExists = this.CompanyList.some(a =>
                a.Code && a.Code.toLowerCase() === currentCompanyCode
            );

            if (isCompanyNameAlreadyExists) {
                this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Notice, [`Cannot add Company as the Company Name "${this.CurrentCompany.CompanyName}" already exists.`]);
                return;
            }

            if (isCompanyCodeAlreadyExists) {
                this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Notice, [`Cannot add Company as the Code "${this.CurrentCompany.Code}" already exists.`]);
                return;
            }
        }



        if (this.CurrentCompany.IsValidCheck(undefined, undefined)) {
            this.loading = true;
            this.companyService.AddCompany(this.CurrentCompany)
                .subscribe(
                    res => {
                        this.showMessageBox("success", "Company Added");
                        this.CurrentCompany = new CompanyModel();
                        this.callbackAdd.emit({ 'newCompany': res.Results });
                        this.loading = false;
                    },
                    err => {
                        this.logError(err);
                        this.loading = false;
                        this.FocusElementById('CompanyName');
                    });
        }
        this.FocusElementById('CompanyName');
    }

    //updating Company
    UpdateCompany() {
        //for checking validations, marking all the fields as dirty and checking the validity.
        for (var i in this.CurrentCompany.CompanyValidator.controls) {
            this.CurrentCompany.CompanyValidator.controls[i].markAsDirty();
            this.CurrentCompany.CompanyValidator.controls[i].updateValueAndValidity();
        }

        if (this.CompanyList && this.CompanyList.length) {
            // Ensuring that the properties are defined before comparing
            const currentCompanyName = this.CurrentCompany.CompanyName ? this.CurrentCompany.CompanyName.toLowerCase() : '';
            const currentCompanyCode = this.CurrentCompany.Code ? this.CurrentCompany.Code.toLowerCase() : '';

            const isCompanyNameAlreadyExists = this.CompanyList.some(a =>
                a.CompanyName && a.CompanyName.toLowerCase() === currentCompanyName &&
                a.CompanyId !== this.CurrentCompany.CompanyId
            );

            const isCompanyCodeAlreadyExists = this.CompanyList.some(a =>
                a.Code && a.Code.toLowerCase() === currentCompanyCode &&
                a.CompanyId !== this.CurrentCompany.CompanyId
            );

            if (isCompanyNameAlreadyExists) {
                this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Notice, [`Cannot Update Company as the Company Name "${this.CurrentCompany.CompanyName}" already exists.`]);
                return;
            }

            if (isCompanyCodeAlreadyExists) {
                this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Notice, [`Cannot Update Company as the Code "${this.CurrentCompany.Code}" already exists.`]);
                return;
            }
        }


        if (this.CurrentCompany.IsValidCheck(undefined, undefined)) {
            this.loading = true;
            this.companyService.UpdateCompany(this.CurrentCompany.CompanyId, this.CurrentCompany)
                .subscribe(
                    res => {
                        this.showMessageBox("success", "Company Updated");
                        this.showAddPage = false;
                        //this.CurrentCompany = new PhrmCompanyModel();
                        this.callbackAdd.emit({ 'newCompany': res.Results });
                        this.loading = false;
                    },
                    err => {
                        this.logError(err);
                        this.loading = false;
                        this.FocusElementById('CompanyName');
                    });
        }
        this.FocusElementById('CompanyName');
    }

    Close() {
        this.callbackAdd.emit();
        this.showAddPage = false;
    }

    showMessageBox(status: string, message: string) {
        this.msgBoxServ.showMessage(status, [message]);
    }

    logError(err: any) {
        console.log(err);
    }
    FocusElementById(id: string) {
        window.setTimeout(function () {
            let itmNameBox = document.getElementById(id);
            if (itmNameBox) {
                itmNameBox.focus();
            }
        }, 600);
    }
    hotkeys(event) {
        if (event.keyCode == 27) {
            this.Close()
        }
    }

}