import { ChangeDetectorRef, Component } from "@angular/core";

import { PatientService } from '../../../patients/shared/patient.service';
import { LabsBLService } from '../../shared/labs.bl.service';

import { GridEmitModel } from "../../../shared/danphe-grid/grid-emit.model";
import LabGridColumnSettings from '../../shared/lab-gridcol-settings';

import * as moment from 'moment/moment';
import { CoreService } from "../../../core/shared/core.service";
import { SecurityService } from "../../../security/shared/security.service";
import { MessageboxService } from '../../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponseText, ENUM_MessageBox_Status, LabPageAction } from "../../../shared/shared-enums";
import { LabCategoryModel } from "../../shared/lab-category.model";
import { LabSticker } from "../../shared/lab-sticker.model";
import { LabPendingResultVM, PatientLabSample } from "../../shared/lab-view.models";

@Component({
    selector: "lab-sample-receive",
    templateUrl: "./lab-sample-receive.component.html",
})

export class LabSampleReceiveComponent {
    public ShowGrid: boolean = true;
    public RequisitionIdList: Array<number> = [];
    public SampleReceiveList: Array<LabPendingResultVM>;
    public LabSampleReceiveGridColumns: Array<any> = null;
    public FromDate: string = null;
    public ToDate: string = null;
    public DateRange: string = "today";
    public CategoryIdList: Array<number> = [];
    public LabGridCols: LabGridColumnSettings;
    public CategoryList: Array<LabCategoryModel> = new Array<LabCategoryModel>();
    public TimeId: any = null;
    public IsInitialLoad: boolean = true;
    LabAction: string = 'receiveSample'
    public Loading: boolean = false;
    RequisitionId: number;
    public showInsuranceFlag: boolean = false;
    public IsLocalDate = false;
    IsEnglishCalendarType: boolean = false;

    public patientTestCSVs: Array<PatientLabSample> = new Array<PatientLabSample>();
    isAllTestSelected: boolean = true;
    showUndoOption: boolean;
    public undoFromPageAction: LabPageAction = LabPageAction.SampleReceive;
    public PatientLabInfo: LabSticker = new LabSticker();
    requisitionIdList = [];

    constructor(public patientService: PatientService, public coreService: CoreService,
        public msgBoxServ: MessageboxService,
        public changeDetector: ChangeDetectorRef,
        public labBLService: LabsBLService,
        public securityService: SecurityService) {
        this.LabGridCols = new LabGridColumnSettings(this.securityService);
        this.LabSampleReceiveGridColumns = this.LabGridCols.SampleReceiveList;
    }

    OnDateRangeChange($event) {
        if ($event) {
            this.FromDate = $event.fromDate;
            this.ToDate = $event.toDate;
        }
    }
    ngOnInIt() {
        this.SetInsuranceFlagParam();
    }
    ChangeDateFormat() {
        this.IsLocalDate = !this.IsLocalDate;
    }
    SetInsuranceFlagParam() {
        let insParam = this.coreService.Parameters.find(p => p.ParameterGroupName.toLowerCase() === "lab" && p.ParameterName.toLowerCase() === "showinsurancefilterinlabpages");
        if (insParam && insParam.ParameterValue && insParam.ParameterValue.toLowerCase() === "true") {
            this.showInsuranceFlag = true;
        }
        else {
            this.showInsuranceFlag = false;
        }

    } GetSampleRecievePatientList(frmdate, ToDate, categoryIdList): void {
        this.SampleReceiveList = [];
        this.labBLService.GetSampleReceivePatientList(frmdate, ToDate, categoryIdList)
            .finally(() => { this.Loading = false })
            .subscribe(res => {
                if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
                    if (res.Results.length) {
                        this.SampleReceiveList = res.Results;
                        this.SampleReceiveList = this.SampleReceiveList.slice();
                    }
                }
                else {
                    this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, ["failed to get lab test of patient.. please check log for details."]);
                    console.log(res.ErrorMessage);
                }
            },
                (err) => {
                    this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, [`Exception: ${err.ErrorMessage}`]);
                }
            );
    }
    public SampleReceiveGridAction($event: GridEmitModel) {
        switch ($event.Action) {
            case "receiveSample": {
                this.ReceiveSampleAction($event);
                break;
            }
            case "undo": {
                this.UndoGridAction($event);
                break;
            }
            default:
                break;
        }
    }
    ReceiveSampleAction($event) {
        this.ShowGrid = false;
        this.RequisitionIdList = $event.Data.RequisitionIdCSV.split(",").map(req => +req);
        this.RequisitionId = this.RequisitionIdList[0];
        this.labBLService.GetSampleItemsByRequisitionId(this.RequisitionIdList)
            .subscribe(
                res => {
                    if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
                        if (res.Results) {
                            this.patientTestCSVs = res.Results;
                            this.isAllTestSelected = true;
                            this.patientTestCSVs.forEach(requ => {
                                if (requ.LabTestSpecimen && typeof requ.LabTestSpecimen === 'string') {
                                    requ.LabTestSpecimen = JSON.parse(requ.LabTestSpecimen);
                                }
                                this.AlterSelectAllTest();
                            });
                            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Success, [`Patient sample has been successfully fetched.`]);
                        } else {
                            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, [`Failed to receive patient sample. Please check log for details.`]);
                        }
                    } else {
                        this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, [`Error: ${res.ErrorMessage}`]);
                        console.log(res.ErrorMessage);
                    }
                },
                err => {
                    this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, [`Exception: ${err.ErrorMessage}`]);
                    console.log(err);
                }
            );
    }
    UndoGridAction($event) {
        this.requisitionIdList = [];
        this.PatientLabInfo.HospitalNumber = $event.Data.PatientCode;

        let dob = $event.Data.DateOfBirth;
        let gender: string = $event.Data.Gender;
        this.PatientLabInfo.Age = this.coreService.CalculateAge(dob);
        if (this.PatientLabInfo.Age) {
            this.PatientLabInfo.AgeSex = this.coreService.FormateAgeSex(this.PatientLabInfo.Age, gender);
        }
        this.PatientLabInfo.Sex = gender;
        this.PatientLabInfo.PatientName = $event.Data.PatientName;
        this.PatientLabInfo.RunNumber = $event.Data.SampleCode;
        this.PatientLabInfo.SampleCodeFormatted = $event.Data.SampleCodeFormatted;
        this.PatientLabInfo.VisitType = $event.Data.VisitType;
        this.PatientLabInfo.BarCodeNumber = $event.Data.BarCodeNumber;
        this.PatientLabInfo.TestName = $event.Data.LabTestCSV;

        let reqs = $event.Data.RequisitionIdCSV.split(',');
        reqs.forEach(reqId => {
            if (this.requisitionIdList && this.requisitionIdList.length) {
                if (!this.requisitionIdList.includes(+reqId)) {
                    this.requisitionIdList.push(+reqId);
                }
            }
            else {
                this.requisitionIdList.push(+reqId);
            }
        });

        this.showUndoOption = false;
        this.changeDetector.detectChanges();
        this.showUndoOption = true;
    }



    public GetTestListFilterByCategories() {
        if ((this.FromDate != null) && (this.ToDate != null) && (this.CategoryIdList.length > 0)) {
            if (moment(this.FromDate).isBefore(this.ToDate) || moment(this.FromDate).isSame(this.ToDate)) {
                this.GetSampleRecievePatientList(this.FromDate, this.ToDate, this.CategoryIdList);
            } else {
                this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, [`Selected DateRange is Invalid. Please select valid FromDate and ToDate.`]);
            }
        }
    }

    public LabCategoryOnChange($event) {
        this.CategoryIdList = [];
        this.CategoryList = [];
        if ($event && $event.length) {
            $event.forEach(v => {
                this.CategoryIdList.push(v.TestCategoryId);
                this.CategoryList.push(v);
            });
        }
        if (this.TimeId) {
            window.clearTimeout(this.TimeId);
            this.TimeId = null;
        }
        this.TimeId = window.setTimeout(() => {
            if (this.IsInitialLoad) {
                this.GetTestListFilterByCategories();
                this.IsInitialLoad = false;
            }
        }, 300);
    }
    Close() {
        this.ShowGrid = true;

    }

    public AlterSelectAllTest() {
        this.patientTestCSVs.forEach(test => {
            test.IsSelected = this.isAllTestSelected;
        });
        if (!this.isAllTestSelected)
            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Warning, ["Please select at least one test to collect sample."]);
    }

    public CheckIfAllSelected() {
        if ((this.patientTestCSVs.every(a => a.IsSelected == true))) {
            this.isAllTestSelected = true;
        }
        else if (this.patientTestCSVs.every(a => a.IsSelected == false)) {
            this.isAllTestSelected = false;
            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Warning, ["Please select at least one test to collect sample."]);
        }
        else {
            this.isAllTestSelected = false;
        }
    }
    ReceiveSample() {
        // Only selected samples should be received 
        const selectedRequisitionIds = this.patientTestCSVs
            .filter(a => a.IsSelected === true)
            .map(a => a.RequisitionId);

        this.labBLService.ReceiveSample(selectedRequisitionIds)
            .subscribe(res => {
                if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
                    if (res.Results === true) {
                        this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Success, [`Patient sample has been successfully received.`]);
                        this.GetSampleRecievePatientList(this.FromDate, this.ToDate, this.CategoryIdList);
                        this.ShowGrid = true;
                    }
                }
                else {
                    this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, [`Failed to get lab test of patient.. please check log for details.`]);
                    console.log(res.ErrorMessage);
                }
            },
                (err) => {
                    this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, [`Exception: ${err.ErrorMessage}`]);
                }
            );
    }
    ExitOutUndoCall($event) {
        if ($event.exit) {
            if ($event.exit == 'exitonsuccess') {
                this.PatientLabInfo = new LabSticker();
                this.requisitionIdList = [];
                this.GetSampleRecievePatientList(this.FromDate, this.ToDate, this.CategoryIdList);
                this.showUndoOption = false;
            }
            else if ($event.exit == 'close') {
                this.CloseUndoBox();
            }

        }
    }
    CloseUndoBox() {
        this.PatientLabInfo = new LabSticker();
        this.requisitionIdList = [];
        this.GetSampleRecievePatientList(this.FromDate, this.ToDate, this.CategoryIdList);
        this.showUndoOption = false;
    }
}

