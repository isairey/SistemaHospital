import { ChangeDetectorRef, Component, EventEmitter, Input, Output } from "@angular/core";
import { VisitService } from '../../../appointments/shared/visit.service';
import { IntakeOutputParameterListModel } from "../../../clinical/shared/intake-output-parameterlist.model";
import { DanpheHTTPResponse } from "../../../shared/common-models";
import { MessageboxService } from '../../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponseText, ENUM_IntakeOutputType, ENUM_MessageBox_Status } from "../../../shared/shared-enums";
import { ClinicalPatientService } from "../../shared/clinical-patient.service";
import { ClinicalNoteBLService } from "../../shared/clinical.bl.service";
import { IntakeOutput } from "../../shared/model/inatke-output.model";
@Component({
    selector: "Cln-IntakeOutput-add",
    templateUrl: "./intake-output-add.html"
})
export class IntakeOutputAddComponent {

    @Input("selected-IO")
    CurrentIntakeOutput: IntakeOutput = new IntakeOutput();
    //last balance is used to calculate the new IO balance.
    @Input("last-balance")
    lastBalance: number = 0;
    updateButton: boolean = false;
    showIOAddBox: boolean = false;
    selectedIndex: number = null;
    loading: boolean = false;
    isInputOutput: boolean = true;


    @Output("callback-ioupdate")
    callbackIoUpdate: EventEmitter<Object> = new EventEmitter<Object>();
    ClinicalIntakeOutputParamList: IntakeOutputParameterListModel[] = [];
    ClinicalIntakeListForParent: IntakeOutputParameterListModel[] = [];
    ClinicalOutputListForParent: IntakeOutputParameterListModel[] = [];
    ClinicalIntakeListForChild: IntakeOutputParameterListModel[] = [];
    ClinicalOutputListForChild: IntakeOutputParameterListModel[] = [];
    IsSubIntakeAvilable: boolean = false;
    IsSubOutputAvilable: boolean = false;
    SubOutputTypeExist: boolean = false;
    SubIntakeTypeExist: boolean = false;
    @Input("edit-IO")
    SelectedIntakeOutput: IntakeOutput = new IntakeOutput();

    @Input("isUpdate")
    IsUpdate: boolean = false;
    constructor(public visitService: VisitService,
        public changeDetector: ChangeDetectorRef,
        private _clinicalNoteBLService: ClinicalNoteBLService,
        private _msgBoxService: MessageboxService,
        private _selectedPatientService: ClinicalPatientService
    ) {
        this.GetClinicalIntakeOutputParameterList();
    }

    ngOnInit() {
        console.log(this.SelectedIntakeOutput);
        if (this.SelectedIntakeOutput && this.IsUpdate) {

            this.InitializeFormWithSelectedData();
        }
    }

    @Input("showIOAddBox")
    public set viewpage(_viewpage: boolean) {
        if (_viewpage && this.CurrentIntakeOutput) {
            if (this.CurrentIntakeOutput.InputOutputId) {
                this.CurrentIntakeOutput = Object.assign(new IntakeOutput(), this.CurrentIntakeOutput);
            }
            else {
                this.Initialize();
            }
        }

        this.showIOAddBox = _viewpage;
    }
    public Initialize() {
        this.CurrentIntakeOutput = new IntakeOutput();
    }
    public ClearOutput() {
        this.CurrentIntakeOutput.IntakeOutputType = null;
        this.CurrentIntakeOutput.IntakeOutputValue = null;
        this.ClearInputs();
    }
    public ClearIntake() {
        this.CurrentIntakeOutput.IntakeOutputType = null;
        this.CurrentIntakeOutput.IntakeOutputValue = null;
        this.ClearInputs();
    }
    public SubmitForm() {
        if (!this.loading) {
            // Remove validation for OutputType if isInputOutput is true
            if (this.isInputOutput) {
                this.CurrentIntakeOutput.IntakeOutputValidator.controls['IntakeOutputType'].clearValidators();
                this.CurrentIntakeOutput.IntakeOutputValidator.controls['IntakeOutputType'].updateValueAndValidity();
                this.CurrentIntakeOutput.IntakeOutputValidator.controls['IntakeOutputValue'].clearValidators();
                this.CurrentIntakeOutput.IntakeOutputValidator.controls['IntakeOutputValue'].updateValueAndValidity();
            }
            // Remove validation for INtakeType if isInputOutput is false
            if (!this.isInputOutput) {
                this.CurrentIntakeOutput.IntakeOutputValidator.controls['IntakeOutputType'].clearValidators();
                this.CurrentIntakeOutput.IntakeOutputValidator.controls['IntakeOutputType'].updateValueAndValidity();
                this.CurrentIntakeOutput.IntakeOutputValidator.controls['IntakeOutputValue'].clearValidators();
                this.CurrentIntakeOutput.IntakeOutputValidator.controls['IntakeOutputValue'].updateValueAndValidity();
            }
            //if valid then call the BL service to do put request.
            if (this.CurrentIntakeOutput.IntakeOutputType && this.CurrentIntakeOutput.InputOutputParameterMainId && this.CurrentIntakeOutput.IntakeOutputValue) {
                if (this.CurrentIntakeOutput.InputOutputId) {
                    // this.Update();
                }
                else {
                    this.CurrentIntakeOutput.Contents = `{"Color":"${this.CurrentIntakeOutput.Color}","Quality":"${this.CurrentIntakeOutput.Quality}"}`;
                    this.AddIntakeOutput();
                }
                this.loading = false;
            }
            else {
                this.CurrentIntakeOutput = new IntakeOutput();
                this._msgBoxService.showMessage(ENUM_MessageBox_Status.Notice, ["please fill the form!"]);
            }
        }
    }

    AddIntakeOutput() {
        if (this.SubIntakeTypeExist) {
            this._msgBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`Please Select Sub Intake Type`]);
            return;
        }
        else if (this.SubOutputTypeExist) {
            this._msgBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`Please Select Sub Output Type`]);
            return;
        }
        this.CurrentIntakeOutput.PatientVisitId = this._selectedPatientService.SelectedPatient.PatientVisitId;
        this._clinicalNoteBLService.PostIntakeOutput(this.CurrentIntakeOutput)
            .subscribe((res: DanpheHTTPResponse) => {
                if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
                    this.loading = false;
                    this.ClearInputs();
                    this.CallBackAddIntakeOutput(res.Results);
                    this._msgBoxService.showMessage(ENUM_MessageBox_Status.Success, ["Added Successfully"]);
                    this.Initialize();
                    this.lastBalance = res.Results.Balance;
                }
                else {
                    this._msgBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Error occurred while updating the entries`]);
                }
            },
                err => {
                    console.log(err);
                });
    }
    CallBackAddIntakeOutput(_inputoutput) {
        this.CurrentIntakeOutput = new IntakeOutput();
        this.callbackIoUpdate.emit({ "InputOutput": _inputoutput });
    }

    public close() {
        this.showIOAddBox = false;
    }


    GetClinicalIntakeOutputParameterList() {
        this._clinicalNoteBLService.GetClinicalIntakeOutputParameterList()
            .subscribe((res: DanpheHTTPResponse) => {
                if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
                    this.ClinicalIntakeOutputParamList = res.Results;
                    this.ClinicalIntakeListForParent = this.ClinicalIntakeOutputParamList.filter(a => a.ParameterMainId == -1 && a.ParameterType === ENUM_IntakeOutputType.Intake);
                    this.ClinicalIntakeListForChild = this.ClinicalIntakeOutputParamList.filter(a => a.ParameterMainId !== -1 && a.ParameterType === ENUM_IntakeOutputType.Intake);
                    this.ClinicalOutputListForParent = this.ClinicalIntakeOutputParamList.filter(a => a.ParameterMainId == -1 && a.ParameterType === ENUM_IntakeOutputType.Output);
                    this.ClinicalOutputListForChild = this.ClinicalIntakeOutputParamList.filter(a => a.ParameterMainId !== -1 && a.ParameterType === ENUM_IntakeOutputType.Output);
                }
                else {
                    this._msgBoxService.showMessage(ENUM_MessageBox_Status.Failed, ["Failed to get Data"], res.ErrorMessage);
                }
            });
    }

    ClearInputs() //This method is used to clear IntakeType and OutputType while switching from IntakeType to OutputType and vice versa
    {
        this.IsSubIntakeAvilable = false;
        this.IsSubOutputAvilable = false;
        this.SubOutputTypeExist = false;
        this.SubIntakeTypeExist = false;
        this.CurrentIntakeOutput.IntakeOutputValidator.controls['IntakeOutputType'].setValue(null);
    }

    AssignSelectedIntakeType($event) {
        if ($event) {
            const intakeOutputId = +$event.target.value;
            this.CurrentIntakeOutput.InputOutputParameterMainId = intakeOutputId;
            const selectedIntakeType = this.ClinicalIntakeOutputParamList.find(a => a.IntakeOutputId === intakeOutputId);
            this.CurrentIntakeOutput.IntakeOutputType = selectedIntakeType.ParameterType;
            const filteredSubIntake = this.ClinicalIntakeOutputParamList.filter(a => a.ParameterMainId === intakeOutputId);
            if (filteredSubIntake && filteredSubIntake.length > 0) {
                this.IsSubIntakeAvilable = true;
                this.SubIntakeTypeExist = true;
                this.ClinicalIntakeListForChild = filteredSubIntake;
            }
            else {
                this.ClinicalIntakeListForChild = [];
                this.IsSubIntakeAvilable = false;
                this.SubIntakeTypeExist = false;
            }
        }
    }

    AssignSelectedSubIntakeType($event) {
        if ($event) {
            const intakeOutputId = +$event.target.value;
            this.CurrentIntakeOutput.InputOutputParameterChildId = intakeOutputId;
            const selectedSubIntakeType = this.ClinicalIntakeOutputParamList.find(a => a.IntakeOutputId === intakeOutputId);
            this.CurrentIntakeOutput.IntakeOutputType = selectedSubIntakeType.ParameterType;
            this.SubIntakeTypeExist = false;
        }
    }
    AssignSelectedOutputType($event) {
        if ($event) {
            const intakeOutputId = +$event.target.value;
            this.CurrentIntakeOutput.InputOutputParameterMainId = intakeOutputId;
            const selectedOutputType = this.ClinicalIntakeOutputParamList.find(a => a.IntakeOutputId === intakeOutputId);
            this.CurrentIntakeOutput.IntakeOutputType = selectedOutputType.ParameterType;
            const filteredSubOutput = this.ClinicalIntakeOutputParamList.filter(a => a.ParameterMainId === intakeOutputId);
            if (filteredSubOutput && filteredSubOutput.length > 0) {
                this.IsSubOutputAvilable = true;
                this.SubOutputTypeExist = true;
                this.ClinicalOutputListForChild = filteredSubOutput;
            }
            else {
                this.ClinicalOutputListForChild = [];
                this.IsSubOutputAvilable = false;
                this.SubOutputTypeExist = false;
            }
        }
    }
    AssignSelectedSubOutputType($event) {
        if ($event) {
            const intakeOutputId = +$event.target.value;
            this.CurrentIntakeOutput.InputOutputParameterChildId = intakeOutputId;
            const selectedSubOutPutType = this.ClinicalIntakeOutputParamList.find(a => a.IntakeOutputId === intakeOutputId);
            this.CurrentIntakeOutput.IntakeOutputType = selectedSubOutPutType.ParameterType;
            this.SubOutputTypeExist = false;
        }
    }

    InitializeFormWithSelectedData() {
        if (this.SelectedIntakeOutput) {
            this.CurrentIntakeOutput = Object.assign(new IntakeOutput(), this.SelectedIntakeOutput);
            this.CurrentIntakeOutput.IntakeOutputValidator.patchValue({
                IntakeOutputType: this.CurrentIntakeOutput.InputOutputParameterMainId,
                IntakeOutputValue: this.CurrentIntakeOutput.IntakeOutputValue,
                Unit: this.CurrentIntakeOutput.Unit,
                Color: this.CurrentIntakeOutput.Color,
                Quality: this.CurrentIntakeOutput.Quality,
                Remarks: this.CurrentIntakeOutput.Remarks
            });
            if (this.SelectedIntakeOutput.IntakeOutputType === 'Intake') {
                this.isInputOutput = true;
            } else {
                this.isInputOutput = false;
            }
        }
    }
    UpdateForm() {
        if (this.CurrentIntakeOutput && this.CurrentIntakeOutput.InputOutputId) {
            this.loading = true;

            const updatedContents = {
                Color: this.CurrentIntakeOutput.Color === "--" ? "null" : this.CurrentIntakeOutput.Color,
                Quality: this.CurrentIntakeOutput.Quality === "--" ? "null" : this.CurrentIntakeOutput.Quality
            };

            this.CurrentIntakeOutput.Contents = JSON.stringify(updatedContents);
            this.CurrentIntakeOutput.PatientVisitId = this._selectedPatientService.SelectedPatient.PatientVisitId;
            this._clinicalNoteBLService.UpdateIntakeOutput(this.CurrentIntakeOutput)
                .subscribe((res: DanpheHTTPResponse) => {
                    if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
                        this.loading = false;
                        this._msgBoxService.showMessage(ENUM_MessageBox_Status.Success, ["Updated Successfully"]);
                        this.CallBackAddIntakeOutput(res.Results);
                        this.Initialize();
                    } else {
                        this.loading = false;
                        this._msgBoxService.showMessage(ENUM_MessageBox_Status.Error, ["Error occurred while updating the entry"]);
                    }
                }, err => {
                    this.loading = false;
                    console.error(err);
                    this._msgBoxService.showMessage(ENUM_MessageBox_Status.Error, ["Failed to update. Please try again."]);
                });
        } else {
            this._msgBoxService.showMessage(ENUM_MessageBox_Status.Error, ["Invalid Intake/Output data for update"]);
        }
    }

}
