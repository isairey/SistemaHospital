import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output, Renderer2 } from '@angular/core';
import * as _ from 'lodash';
import * as moment from 'moment';
import { SecurityService } from '../../../security/shared/security.service';
import { MessageboxService } from '../../../shared/messagebox/messagebox.service';
import { ENUM_MessageBox_Status, ENUM_TermsApplication } from '../../../shared/shared-enums';
import { TermsConditionsMasterModel } from '../../shared/terms-conditions-master.model';

@Component({
    selector: 'terms-add',
    templateUrl: './terms-add.html',
})

export class TermsAddComponent implements OnInit {

    public showTermPage: boolean = false;
    @Input("selected-list")
    public selectedTerms: TermsConditionsMasterModel;
    @Input("allTermsLists")
    public AllTermsLists = new Array<TermsConditionsMasterModel>();
    @Input("TermsApplicationId")
    public TermsApplicationId: number = ENUM_TermsApplication.Inventory;
    public update: boolean = false;
    public CurrentTermsModel: TermsConditionsMasterModel = new TermsConditionsMasterModel();
    public TermsModelLists: Array<TermsConditionsMasterModel> = new Array<TermsConditionsMasterModel>();
    public loading: boolean = false;
    public globalListenFunc: Function;
    public ESCAPE_KEYCODE = 27;//to close the window on click of ESCape.

    @Output("callback-add")
    callbackAdd: EventEmitter<Object> = new EventEmitter<Object>();

    constructor(public _http: HttpClient,
        public securityService: SecurityService,
        public changeDetector: ChangeDetectorRef, public msgBoxServ: MessageboxService,
        public renderer2: Renderer2) {

    }


    @Input("showAddPage")
    public set value(val: boolean) {
        this.showTermPage = val;
        if (this.selectedTerms && this.selectedTerms.Text != null) {
            this.update = true;
            this.CurrentTermsModel = Object.assign(this.CurrentTermsModel, this.selectedTerms);
        }
        else {
            this.update = false;
            this.CurrentTermsModel = new TermsConditionsMasterModel();
            this.changeDetector.detectChanges();
            this.setFocusById('shortname');
        }
    }

    ngOnInit() {
        this.globalListenFunc = this.renderer2.listen('document', 'keydown', e => {
            if (e.keyCode == this.ESCAPE_KEYCODE) {
                this.Close()
            }
        });
    }
    Close() {
        this.selectedTerms = new TermsConditionsMasterModel();
        this.showTermPage = false;

    }

    AddTerms() {
        for (var i in this.CurrentTermsModel.TermsValidators.controls) {
            this.CurrentTermsModel.TermsValidators.controls[i].markAsDirty();
            this.CurrentTermsModel.TermsValidators.controls[i].updateValueAndValidity();
        }

        if (this.AllTermsLists && this.AllTermsLists.length) {
            const isShortNameAlreadyExists = this.AllTermsLists.some(a => a.ShortName.toLowerCase() === this.CurrentTermsModel.ShortName.toLowerCase());
            if (isShortNameAlreadyExists) {
                this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Notice, [`Cannot Add Terms And Condition as the Short Name "${this.CurrentTermsModel.ShortName}" already exists!`]);
                return;
            }
        }

        if (this.CurrentTermsModel.IsValidCheck(undefined, undefined)) {
            if (this.areAllRequiredFieldsFilled()) {
                this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, ["Please Fill all the required Fields"]);
                return;
            }
            this.CurrentTermsModel.Text = this.CurrentTermsModel.Text.trim();
            this.CurrentTermsModel.ShortName = this.CurrentTermsModel.ShortName.trim();
            this.CurrentTermsModel.Type = this.CurrentTermsModel.Type.trim();
            this.loading = true;
            this.CurrentTermsModel.TermsApplicationEnumId = this.TermsApplicationId;
            var temp = _.omit(this.CurrentTermsModel, ['TermsValidators']);
            temp = JSON.stringify(temp);
            /*sanjit: 18May'20 : this component is used in both inventory and pharmacy and 
                there is no service that is shared by these two module,
                hence, I have written the api call directly here.*/
            this._http.post<any>("/api/InventorySettings/InventoryTerm", temp).finally(() => this.loading = false)
                .subscribe(
                    res => {
                        if (res.Status == "OK") {
                            this.msgBoxServ.showMessage("success", ['added successfully']);
                            this.CurrentTermsModel = new TermsConditionsMasterModel();
                            this.CallBackAddTerms(res);
                            this.showTermPage = false;
                        }
                    },
                    err => {
                        // log.error(err);
                        this.loading = false;
                    });

        }
    }
    UpdateTerms() {
        for (var i in this.CurrentTermsModel.TermsValidators.controls) {
            this.CurrentTermsModel.TermsValidators.controls[i].markAsDirty();
            this.CurrentTermsModel.TermsValidators.controls[i].updateValueAndValidity();
        }

        if (this.AllTermsLists && this.AllTermsLists.length) {
            const isShortNameAlreadyExists = this.AllTermsLists.some(a => a.ShortName.toLowerCase() === this.CurrentTermsModel.ShortName.toLowerCase() && a.TermsId !== this.CurrentTermsModel.TermsId);
            if (isShortNameAlreadyExists) {
                this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Notice, [`Cannot Update Terms And Condition as the Short Name "${this.CurrentTermsModel.ShortName}" already exists!`]);
                return;
            }
        }

        if (this.CurrentTermsModel.IsValidCheck(undefined, undefined)) {
            if (this.areAllRequiredFieldsFilled()) {
                this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, ["Please Fill all the required Fields"]);
                return;
            }
            this.CurrentTermsModel.Text = this.CurrentTermsModel.Text.trim();
            this.CurrentTermsModel.ShortName = this.CurrentTermsModel.ShortName.trim();
            this.CurrentTermsModel.Type = this.CurrentTermsModel.Type.trim();
            this.loading = true;
            if (this.CurrentTermsModel.CreatedOn)
                this.CurrentTermsModel.CreatedOn = moment(this.CurrentTermsModel.CreatedOn).format("YYYY-MM-DD HH:mm")
            var temp = _.omit(this.CurrentTermsModel, ['TermsValidators']);
            temp = JSON.stringify(temp);
            /*sanjit: 18May'20 : this component is used in both inventory and pharmacy and 
                there is no service that is shared by these two module,
                hence, I have written the api call directly here.*/
            this._http.put<any>("/api/InventorySettings/InventoryTerm", temp).finally(() => this.loading = false)
                .subscribe(
                    res => {
                        if (res.Status == "OK") {
                            this.msgBoxServ.showMessage("success", ['Updated successfully']);
                            this.CurrentTermsModel = new TermsConditionsMasterModel();
                            this.CallBackAddTerms(res);
                            this.showTermPage = false;
                        }
                    },
                    err => {
                        // log.error(err);
                        this.loading = false;
                    });

        }

    }
    CallBackAddTerms(res) {
        if (res.Status == "OK") {
            this.callbackAdd.emit({ terms: res.Results });
        }
        else {
            this.msgBoxServ.showMessage("error", ['Check log for details']);
            console.log(res.ErrorMessage);
        }
    }
    onChangeEditorData(data) {
        this.CurrentTermsModel.Text = data;
    }
    setFocusById(IdToBeFocused) {
        window.setTimeout(function () {
            document.getElementById(IdToBeFocused).focus();
        }, 20);
    }
    isEmpty(value: string): boolean {
        return !value;
    }

    isEmptyOrWhitespace(value: string): boolean {
        return value && !value.trim();
    }

    areAllRequiredFieldsFilled(): boolean {
        return (
            this.isEmpty(this.CurrentTermsModel.Text) ||
            this.isEmpty(this.CurrentTermsModel.ShortName) ||
            this.isEmpty(this.CurrentTermsModel.Type) ||
            this.isEmptyOrWhitespace(this.CurrentTermsModel.Text) ||
            this.isEmptyOrWhitespace(this.CurrentTermsModel.ShortName) ||
            this.isEmptyOrWhitespace(this.CurrentTermsModel.Type)
        );
    }
}