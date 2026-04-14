import { ChangeDetectorRef, Component, EventEmitter, Input, Output } from "@angular/core";
import * as moment from 'moment/moment';
import { DischargeSummaryMedication } from "../../adt/shared/discharge-summary-medication.model";
import { MessageboxService } from '../../shared/messagebox/messagebox.service';
import { DischargeSummaryBLService } from '../shared/discharge-summary.bl.service';
//import { CommonFunctions } from "../../shared/common.functions";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import { forkJoin, of } from "rxjs";
import { Observable } from "rxjs/Rx";
import { catchError } from "rxjs/internal/operators/catchError";
import { BabyBirthDetails } from "../../adt/shared/baby-birth-details.model";
import { CoreService } from "../../core/shared/core.service";
import { SecurityService } from "../../security/shared/security.service";
import { ENUM_PrintingType, PrinterSettingsModel } from "../../settings-new/printers/printer-settings.model";
import { NepaliCalendarService } from "../../shared/calendar/np/nepali-calendar.service";
import { DanpheHTTPResponse } from "../../shared/common-models";
import { ENUM_DanpheHTTPResponses, ENUM_DateTimeFormat, ENUM_DischargeSummaryDisplayLabels, ENUM_DischargeType, ENUM_MessageBox_Status } from "../../shared/shared-enums";
import { DischargeSummaryConsultantViewModel } from "../add-view-summary/view-templates/consultant-view-model";
import { DischargeSummaryViewModel } from "../add-view-summary/view-templates/discharge-summary-view-model";
import { DischargeSummaryFieldSettingsVM } from "../view-model/discharge-summary-field-setting-VM.model";
import { TemplateFieldDTO } from "../view-model/template-field-dto";

@Component({
    selector: 'discharge-summary-view',
    templateUrl: './discharge-summary-view.html'
})
export class DischargeSummaryViewComponent {
    public dischargeSummaryViewModel: DischargeSummaryViewModel = new DischargeSummaryViewModel();
    @Input("selectedADT")
    public selectedADT: any;

    @Input("templateId")
    public templateId: number;
    public showSummaryView: boolean = false;
    public allMedications: Array<DischargeSummaryMedication> = new Array<DischargeSummaryMedication>();
    public consultants: Array<DischargeSummaryConsultantViewModel> = new Array<DischargeSummaryConsultantViewModel>();

    public labTestId: Array<number> = null;
    public medicationFrequency: Array<any> = new Array<any>();
    public DischargeCondition: string;
    public deliveryTypeList: any;
    public babybirthCondition: any;
    public deathTypeList: any;
    public MedicationType: string;
    public oldMedicinesCon: any;
    public oldStoppedMed: any;
    public selectedBaby: BabyBirthDetails = new BabyBirthDetails();

    public AddedTests: Array<any> = new Array<any>();
    public labTests: Array<any> = new Array<any>();
    public imagingItems: Array<any> = new Array<any>();
    public ShowDoctorsSignatureImage: boolean = false;
    public IsFinalSubmited: boolean = false;
    public TemplateTypeName: string = 'Discharge Summary';
    public selectedPrinter: PrinterSettingsModel = new PrinterSettingsModel();
    public browserPrintContentObj: any;
    public openBrowserPrintWindow: boolean = false;
    public loading: boolean = false;
    public headerDetail: { CustomerName, Address, Email, CustomerRegLabel, CustomerRegNo, Tel };
    public InvoiceDisplaySettings: any = { ShowHeader: true, ShowQR: true, ShowHospLogo: true, ShowPriceCategory: false };
    @Output('EditRecordEvent') sendData: EventEmitter<any> = new EventEmitter<any>();
    hasEditDischargeSummaryPermission: boolean = false;
    public IsEditMode: boolean;
    public receivedData: any;
    public dynamicTemplateContent: Array<any> = [];
    public innerHtml: any;
    formattedData: any;
    mergedObj: any;
    hospitalStayDate: number;
    dischargeCondition: any;
    StayDays: number = 0;
    public loadingScreen: boolean = false;
    DischargeSummaryHeaderSettings: { ShowDischargeSummaryHeader: boolean, HeaderGap: number, FooterGap: number }
    dischSumFieldSettings: DischargeSummaryFieldSettingsVM = new DischargeSummaryFieldSettingsVM();
    selectedTemplateFileds: Array<TemplateFieldDTO> = [];
    @Output("call-back-after-discharge-summary-report-response")
    callbackResponseDataEmitter: EventEmitter<object> = new EventEmitter<object>();

    constructor(public dischargeSummaryBLService: DischargeSummaryBLService,
        public msgBoxServ: MessageboxService,
        public coreService: CoreService,
        private sanitizer: DomSanitizer,
        public securityService: SecurityService,
        public nepaliDateService: NepaliCalendarService,
        private changeDetector: ChangeDetectorRef) {
        let paramValue = this.coreService.Parameters.find(a => a.ParameterName === 'BillingHeader').ParameterValue;
        this.hasEditDischargeSummaryPermission = this.securityService.HasPermission('btn-edit-discharge-summary-after-final-submit');
        if (paramValue) {
            this.headerDetail = JSON.parse(paramValue);
        }
        this.InvoiceDisplaySettings = this.coreService.GetInvoiceDisplaySettings();
        // this.AssignDischargeSummaryFormat();
        this.GetParameterValue();
        this.DischargeSummaryHeaderSettings = this.GetShowDischargeSummaryHeaderParameterValue();
    }

    @Input("showSummaryView")
    public set value(val: boolean) {
        if (val && this.selectedADT) {
            this.IsFinalSubmited = this.selectedADT.IsSubmitted;
            var reqs: Observable<any>[] = [];
            this.loadingScreen = true;
            reqs.push(this.dischargeSummaryBLService.GetDischargeSummary(this.selectedADT.PatientVisitId).pipe(
                catchError((err) => {
                    // Handle specific error for this call
                    return of(err.error);
                }
                )
            ));
            reqs.push(this.dischargeSummaryBLService.GetLabRequestsByPatientVisit(this.selectedADT.PatientId, this.selectedADT.PatientVisitId).pipe(
                catchError((err) => {
                    // Handle specific error for this call
                    return of(err.error);
                }
                )
            ));
            reqs.push(this.dischargeSummaryBLService.GetImagingReportsReportsByVisitId(this.selectedADT.PatientVisitId).pipe(
                catchError((err) => {
                    // Handle specific error for this call
                    return of(err.error);
                }
                )
            ));

            forkJoin(reqs).subscribe(result => {
                this.GetDischargeSummary(result[0]);
                this.GetLabRequests(result[1]);
                this.GetImagingResults(result[2]);
                this.LoadTemplateFields(this.dischargeSummaryViewModel.patDischargeSummary.DischargeSummaryTemplateId);
                this.LoadTemplate(this.dischargeSummaryViewModel.patDischargeSummary.DischargeSummaryTemplateId); //Bikesh: 24-july'23 loading htmlContent from database on the basis of discharge-summary-templateId
                this.AssignSelectedLabTests();
                this.AssignSelectedImagings();
                this.showSummaryView = true;
            });
            this.FormatDates();
        }
    }

    ngOnInit() {
        this.CalculateHospitalStayDay();
        if (this.selectedADT) {
            this.selectedADT.Age = this.coreService.CalculateAge(this.selectedADT.DateOfBirth);
            this.selectedADT.AgeSex = this.coreService.FormateAgeSex(this.selectedADT.Age, this.selectedADT.Gender)
            if (this.selectedADT.FullName) {
                this.selectedADT.Name = this.selectedADT.FullName;
            }
            if (this.selectedADT.ContactNo) {
                this.selectedADT.PhoneNumber = this.selectedADT.ContactNo;
            }
        }
    }

    replacePlaceholdersWithData(htmlContent: string, data: any): string {  //Bikesh: 25-july'23 this is used for  replacing placeholder of provided htmlContent 
        return htmlContent.replace(/{{(.*?)}}/g, (match, placeholder) => {
            const propertyKeys = placeholder.split('.');
            let value = data;

            for (const key of propertyKeys) {
                if (value && value.hasOwnProperty(key)) {
                    value = value[key];
                } else {
                    // If any nested property doesn't exist or value is null, return an empty string
                    return '';
                }
            }
            // If the value is null or undefined, return an empty string
            return (value !== null && value !== undefined) ? value : '';
        });
    }

    getUpdatedContent(): SafeHtml {
        const sanitizedHtml = this.sanitizer.bypassSecurityTrustHtml(
            this.replacePlaceholdersWithData(this.innerHtml.changingThisBreaksApplicationSecurity, this.mergedObj)
        );
        return sanitizedHtml;
    }

    FormatDates() {
        this.selectedADT.DOB = moment(this.selectedADT.DateOfBirth).format('YYYY-MM-DD');
        // this.selectedADT.AdmittedDate = moment(this.selectedADT.AdmittedDate).format('YYYY-MM-DD hh:mm');
        if (this.selectedADT.DischargedDate) {
            this.selectedADT.PatDischargedDate = `${moment(this.selectedADT.DischargedDate).format('YYYY-MM-DD hh:mm')} AD ` + `(${this.GetLocalDate(this.selectedADT.DischargedDate)})`;
        }
        else {
            this.selectedADT.DischargedDate = "";
        }
        if (this.selectedADT.AdmittedDate) {
            this.selectedADT.patAdmittedDate = `${moment(this.selectedADT.AdmittedDate).format('YYYY-MM-DD hh:mm')} AD ` + `(${this.GetLocalDate(this.selectedADT.AdmittedDate)})`;
        }
        else {
            this.selectedADT.AdmittedDate = "";
        }

    }
    GetLocalDate(engDate: string): string {
        let npDate = this.nepaliDateService.ConvertEngToNepaliFormatted(engDate, ENUM_DateTimeFormat.Year_Month_Day_Hour_Minute);
        return npDate + " BS";
    }
    GetMedicationFrequency() {
        this.dischargeSummaryBLService.GetMedicationFrequency()
            .subscribe((res: DanpheHTTPResponse) => {
                if (res.Status === ENUM_DanpheHTTPResponses.OK) {
                    this.medicationFrequency = res.Results;
                }
                else {
                    this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, [res.ErrorMessage]);
                }
            },
                err => {
                    this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, ['Failed to get medication frequencies. please check log for detail.']);
                    this.logError(err.ErrorMessage);
                });
    }

    GetDischargeSummary(res) {
        //this.dischargeSummaryViewModel.selectedADT = this.selectedADT;
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
            this.loadingScreen = true;
            if (res.Results) {
                if (res.Results.DischargeSummary && !res.Results.DischargeSummary.IsSubmitted) {
                    this.IsFinalSubmited = false;
                }
                else {
                    this.IsFinalSubmited = true;
                }
                this.dischargeSummaryViewModel = res.Results;
                this.dischargeSummaryViewModel.patDischargeSummary = res.Results.DischargeSummary;
                this.dischargeSummaryViewModel.patDischargeSummary.DischargeCondition = res.Results.DischargeConditionType;
                this.dischargeSummaryViewModel.patDischargeSummary.DeathType = res.Results.DeathType;
                this.dischargeSummaryViewModel.patDischargeSummary.DeliveryType = res.Results.DeliveryType;
                this.dischargeSummaryViewModel.patDischargeSummary.DoctorIncharge = res.Results.DoctorInchargeName;
                this.dischargeSummaryViewModel.patDischargeSummary.CreatedOn = moment(res.Results.CreatedOn).format("YYYY-MM-DD HH:mm A");
                this.dischargeSummaryViewModel.patDischargeSummary.DischargeType = res.Results.DischargeType;
                this.dischargeSummaryViewModel.patDischargeSummary.CheckedBy = res.Results.CheckedBy;
                this.dischargeSummaryViewModel.selectedADT = this.selectedADT;
                //this.dischargeSummaryViewModel.selectedADT.Address = res.Results.Address;
                this.dischargeSummaryViewModel.selectedADT.DepartmentName = res.Results.DepartmentName;

                //Bikesh: 30-jul-23' this will calculate current age of the patient 
                this.dischargeSummaryViewModel.patDischargeSummary.Age = Math.floor((Date.now() - new Date(this.selectedADT.DOB).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
                this.dischargeSummaryViewModel.patDischargeSummary.CreatedBy = res.Results.CreatedBy;
                this.dischargeSummaryViewModel.patDischargeSummary.DoctorIncharge = res.Results.DoctorInchargeName;
                this.dischargeSummaryViewModel.patDischargeSummary.DrInchargeNMC = res.Results.DrInchargeNMC;
                this.dischargeSummaryViewModel.patDischargeSummary.CheckedByNMC = res.Results.CheckedByNMC;
                this.dischargeSummaryViewModel.patDischargeSummary.Anaesthetists = res.Results.Anaesthetists;


                if ((this.dischargeSummaryViewModel.patDischargeSummary.LabTests && this.dischargeSummaryViewModel.patDischargeSummary.LabTests != null)) {
                    this.labTests = new Array<any>();
                    this.labTests = JSON.parse(this.dischargeSummaryViewModel.patDischargeSummary.LabTests);
                    this.dischargeSummaryViewModel.LabTests = this.labTests;
                }

                if (res.Results.Medications.length) {
                    res.Results.Medications.forEach(a => {
                        let Medication = new DischargeSummaryMedication();
                        Medication = Object.assign(Medication, a);
                        this.allMedications.push(Medication);
                    });
                    // this.allMedications = this.allMedications.filter(a => a.FrequencyId > 0)
                    this.allMedications = this.allMedications.filter(a => a.FrequencyId == 0);
                    //    this.allMedications.forEach(a=>{
                    //        a.Type = this.medicationFrequency.find(s=> a.FrequencyId==s.FrequencyId).Type;
                    //    })
                    this.dischargeSummaryViewModel.newMedicines = this.allMedications.filter(a => a.OldNewMedicineType == 0);
                    // this.oldMedicinesCon = this.allMedications.filter(a => a.OldNewMedicineType == 1);
                    // this.oldStoppedMed = this.allMedications.filter(a => a.OldNewMedicineType == 2);
                }
                if (this.dischargeSummaryViewModel.patDischargeSummary && this.dischargeSummaryViewModel.patDischargeSummary.Diagnosis) {
                    this.dischargeSummaryViewModel.selectedDiagnosisList = JSON.parse(this.dischargeSummaryViewModel.patDischargeSummary.Diagnosis);
                }
                if (this.dischargeSummaryViewModel.patDischargeSummary && this.dischargeSummaryViewModel.patDischargeSummary.ProvisionalDiagnosis) {
                    this.dischargeSummaryViewModel.selectedProviDiagnosisList = JSON.parse(this.dischargeSummaryViewModel.patDischargeSummary.ProvisionalDiagnosis);
                }

                if (this.dischargeSummaryViewModel.patDischargeSummary.SelectedImagingItems != null) {
                    this.imagingItems = new Array<any>();
                    this.imagingItems = JSON.parse(this.dischargeSummaryViewModel.patDischargeSummary.SelectedImagingItems);
                }
            }
            this.loadingScreen = false;
        }
        else {
            this.showSummaryView = false;

            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, [res.ErrorMessage]);
        }

    }


    LoadTemplate(TemplateId: number) {
        this.dischargeSummaryBLService.LoadTemplate(TemplateId)
            .subscribe((res: DanpheHTTPResponse) => {
                if (res.Status === ENUM_DanpheHTTPResponses.OK) {
                    this.dynamicTemplateContent = res.Results;
                    this.innerHtml = this.sanitizer.bypassSecurityTrustHtml(res.Results.PrintContentHTML)
                    // console.log(this.innerHtml);
                }

            })
    }

    //Gets only the requests, Use Results once We implement the Labs-Module for data entry. -- sud: 9Aug'17
    public GetLabRequests(res) {
        // this.dischargeSummaryBLService.GetLabRequestsByPatientVisit(this.selectedADT.PatientId, this.selectedADT.PatientVisitId)
        //     .subscribe(res => {
        //         if (res.Status == 'OK') {
        //             this.dischargeSummaryViewModel.labRequests = res.Results;
        //         }
        //         else {
        //             this.msgBoxServ.showMessage("error", [res.ErrorMessage]);
        //         }
        //     },
        //         err => {
        //             this.msgBoxServ.showMessage("error", ['Failed to get lab results.. please check log for detail.']);
        //             this.logError(err.ErrorMessage);
        //         });

        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
            this.dischargeSummaryViewModel.labRequests = res.Results;
        }
        else {
            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, [res.ErrorMessage]);
        }
    }

    public GetImagingResults(res) {
        // this.dischargeSummaryBLService.GetImagingReportsReportsByVisitId(this.selectedADT.PatientVisitId)
        //     .subscribe(res => {

        //     },
        //         err => {
        //             this.msgBoxServ.showMessage("error", ['Failed to get imaging results.. please check log for details.'], err.ErrorMessage);
        //         });

        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
            if (res.Results.length)
                this.dischargeSummaryViewModel.imagingResults = res.Results;
        } else {
            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, ["Failed to get Imaigng Results. Check log for detail"]);
            this.logError(res.ErrorMessage);
        }
    }

    logError(err: any) {
        console.log(err);
    }


    AssignSelectedLabTests() {
        // Below code helps to find which test is selected to show result in Reports.
        // if any labRequests is found in labTests then that test is selected to show its results and its component's results.


        this.AddedTests = [];

        if (this.dischargeSummaryViewModel.labRequests.length > 0) {
            this.dischargeSummaryViewModel.labRequests.forEach(a => {

                let tempLabTests: any = this.labTests.filter(lbtst => lbtst.TestId == a.TestId);
                let selectedLabTest: any = tempLabTests[0];

                if (selectedLabTest) {

                    let aCheck = this.AddedTests.some(lt => lt.TestId == selectedLabTest.TestId);

                    if (!aCheck) {

                        // a.IsSelectTest = true;
                        if (a.labComponents && a.labComponents.length == 1) {
                            a.IsSelectTest = true;
                            this.AddedTests.push({ TestId: a.TestId, TestName: a.TestName, labComponents: [] });
                        }
                        else if (a.labComponents && a.labComponents.length > 1) {

                            const cmptArray: Array<any> = new Array<any>();

                            a.labComponents.forEach(c => {

                                if (selectedLabTest.labComponents && selectedLabTest.labComponents.length) {
                                    let cCheck = selectedLabTest.labComponents.some(ltc => ltc.ComponentName == c.ComponentName);
                                    if (cCheck) {
                                        cmptArray.push({ ComponentName: c.ComponentName });
                                        c.IsCmptSelected = true;
                                    } else {
                                        c.IsCmptSelected = false;
                                    }
                                }
                            });

                            this.AddedTests.push({ TestId: a.TestId, TestName: a.TestName, labComponents: cmptArray });

                        }
                        let selectedComponentCount: number = 0;
                        this.AddedTests.forEach(at => {
                            if (at.TestId == a.TestId) {
                                selectedComponentCount = at.labComponents.length;
                            }
                        });
                        if (selectedComponentCount == a.labComponents.length) {
                            a.IsSelectTest = true;
                        }
                        else {
                            a.IsSelectTest = false;
                            a.IsChildSelected = true;
                        }
                    }

                } else {
                    a.IsSelectTest = false;
                }
            });
        }
        // for newly added tests which doesnot has any results
        this.dischargeSummaryViewModel.NewPendingTests = [];
        this.labTests.forEach(a => {
            let check = this.dischargeSummaryViewModel.labRequests.some(f => a.TestId == f.TestId);
            if (!check) {
                this.AddedTests.push(a);
                this.dischargeSummaryViewModel.NewPendingTests.push(a);
            }
        });
    }

    AssignSelectedImagings() {
        if (this.dischargeSummaryViewModel.imagingResults && this.dischargeSummaryViewModel.imagingResults.length) {
            this.dischargeSummaryViewModel.imagingResults.forEach(a => {
                let check = this.imagingItems.some(im => im == a.ImagingItemId);
                if (check) {
                    a.IsImagingSelected = true;
                }
            });
        }
    }

    public GetParameterValue() {
        let parameter = this.coreService.Parameters.find(p => p.ParameterName === "ShowDoctorsSignatureImageInDischargeSummary" && p.ParameterGroupName == "Discharge Summary");
        if (parameter && parameter.ParameterValue && parameter.ParameterValue === "true") {
            this.ShowDoctorsSignatureImage = true;
        } else {
            this.ShowDoctorsSignatureImage = false;
        }
    }
    public GetShowDischargeSummaryHeaderParameterValue() {
        let parameter = this.coreService.Parameters.find(p => p.ParameterName === "ShowDischargeSummaryHeader" && p.ParameterGroupName === "DischargeSummary");
        if (parameter && parameter.ParameterValue) {
            let currentParam = JSON.parse(parameter.ParameterValue);
            return currentParam;
        }
    }

    public AllowEditFromView($event) {
        this.IsEditMode = $event;
        this.sendData.emit(this.IsEditMode);
    }

    ReFormatDischargeSummary(DischargeTypeName: string): any {   // Bikesh: 26-jul'23Reformating conditional labels for dynamic Discharge summary
        if (DischargeTypeName == ENUM_DischargeType.Recovered) {
            this.dischargeSummaryViewModel.patDischargeSummary.DischargeCondition = `<strong>${this.dischSumFieldSettings.DischargeCondition.DisplayLabelAtPrint}</strong> ${this.dischargeSummaryViewModel.DischargeConditionType}`;
        }
        else if (DischargeTypeName == ENUM_DischargeType.Lama) {
            this.dischargeSummaryViewModel.patDischargeSummary.DischargeCondition = `<strong>${this.dischSumFieldSettings.DischargeCondition.DisplayLabelAtPrint}</strong> ${this.dischargeSummaryViewModel.DischargeConditionType}`;
        }
        else if (DischargeTypeName == ENUM_DischargeType.Death) {
            this.dischargeSummaryViewModel.patDischargeSummary.DischargeCondition = `<strong>${this.dischSumFieldSettings.DischargeCondition.DisplayLabelAtPrint}</strong> ${this.dischargeSummaryViewModel.DischargeConditionType}`;
            this.dischargeSummaryViewModel.patDischargeSummary.DeathType = `${ENUM_DischargeSummaryDisplayLabels.DeathPeriod}${this.dischargeSummaryViewModel.DeathType} Hours`;
        }

        // reformationg Selected Diagnosis 
        if (this.dischargeSummaryViewModel.selectedDiagnosisList && this.dischargeSummaryViewModel.selectedDiagnosisList.length > 0) {
            this.dischargeSummaryViewModel.patDischargeSummary.SelectedDiagnosis = `<div style="margin-left:0px; margin-right:0px;"><strong>${this.dischSumFieldSettings.SelectDiagnosis.DisplayLabelAtPrint}</strong> ${this.dischargeSummaryViewModel.selectedDiagnosisList
                .map(item => item.icd10Description)
                .join(', ')}</div><br>`;
        }
        else {
            this.dischargeSummaryViewModel.patDischargeSummary.SelectedDiagnosis = "";
        }

        // reformationg selected provisional Diagnosis list 
        if (this.dischargeSummaryViewModel.selectedProviDiagnosisList && this.dischargeSummaryViewModel.selectedProviDiagnosisList.length > 0) {
            this.dischargeSummaryViewModel.patDischargeSummary.ProvisionalDiagnosis = `<div style="margin-left:0px; margin-right:0px;"> <strong>${this.dischSumFieldSettings.ProvisionalDiagnosis.DisplayLabelAtPrint}</strong> ${this.dischargeSummaryViewModel.selectedProviDiagnosisList
                .map(item => item.icd10Description)
                .join(', ')}</div> <br>`;
        }
        else {
            this.dischargeSummaryViewModel.patDischargeSummary.ProvisionalDiagnosis = "";
        }

        if (this.dischargeSummaryViewModel.newMedicines && this.dischargeSummaryViewModel.newMedicines.length > 0) {
            this.dischargeSummaryViewModel.patDischargeSummary.Medications = `<strong>${this.dischSumFieldSettings.Medications.DisplayLabelAtPrint}</strong> <div style='border: 1px solid #000; padding: 10px;'><ul>`; // Start a bordered container and an unordered list
            this.dischargeSummaryViewModel.newMedicines.forEach((item) => {
                this.dischargeSummaryViewModel.patDischargeSummary.Medications += `<li>${item.Medicine}</li>`; // Create list items
            });
            this.dischargeSummaryViewModel.patDischargeSummary.Medications += "</ul></div><br>"; // Close the unordered list and the bordered container
        } else {
            this.dischargeSummaryViewModel.patDischargeSummary.Medications = "";
        }

        if (this.dischargeSummaryViewModel.LabTests && this.dischargeSummaryViewModel.LabTests.length > 0) {
            this.dischargeSummaryViewModel.patDischargeSummary.LabTests = `<strong>${this.dischSumFieldSettings.Investigations.DisplayLabelAtPrint}
            </strong> <br> <strong>${this.dischSumFieldSettings.LabTests.DisplayLabelAtPrint}</strong> 
            <div style='border: 1px solid #000; padding: 10px;'><ul>`; // Start a bordered container and an unordered list
            this.dischargeSummaryViewModel.LabTests.forEach((item) => {
                this.dischargeSummaryViewModel.patDischargeSummary.LabTests += `<li>${item.TestName}</li>`; // Create list items
            });
            this.dischargeSummaryViewModel.patDischargeSummary.LabTests += "</ul></div><br>"; // Close the unordered list and the bordered container
        } else {
            this.dischargeSummaryViewModel.patDischargeSummary.LabTests = "";
        }


        if (this.dischargeSummaryViewModel.Consultants && this.dischargeSummaryViewModel.Consultants.length > 0) {
            this.dischargeSummaryViewModel.patDischargeSummary.Consultants = `<div style="margin-left:0px; margin-right:0px;"> <strong>${this.dischSumFieldSettings.Consultant.DisplayLabelAtPrint}</strong> ${this.dischargeSummaryViewModel.Consultants.map(item => item.consultantName)
                .join(', ')} </div> <br>`;
        }
        if (this.dischargeSummaryViewModel.Consultants && this.dischargeSummaryViewModel.Consultants.length > 0) {
            this.dischargeSummaryViewModel.patDischargeSummary.ConsultantsSign = this.dischargeSummaryViewModel.Consultants.map(consultant => `
            <div style="display: inline-block; margin-right: 10px;">
            <p style="margin: 0; font-weight: bold;">-----------------</p>
            <p style="margin: 0px 0;">Consultant:</p>
            <p style="margin: 0;">${consultant.consultantName}</p>
            <p style="margin: 0;">NMC NO.: ${consultant.consultantNMC}</p>
            <p style="margin: 0;">Department: ${consultant.consultantDepartmentName}</p>
        </div>`).join('');
        }

        else {
            this.dischargeSummaryViewModel.patDischargeSummary.Consultants = "";
        }

        if (this.dischargeSummaryViewModel.Consultants && this.dischargeSummaryViewModel.Consultants.length > 0) {
            this.dischargeSummaryViewModel.patDischargeSummary.Consultant = this.dischargeSummaryViewModel.Consultants[0].consultantName;
            if (this.ShowDoctorsSignatureImage && this.dischargeSummaryViewModel.Consultants[0].consultantSignImgPath) {
                const imagePath = this.dischargeSummaryViewModel.Consultants[0].consultantSignImgPath;
                this.dischargeSummaryViewModel.patDischargeSummary.ConsultantSignImgPath = `<img src="${imagePath}" style="height: 80px;" />`
            }

        }
        if (this.dischargeSummaryViewModel.Consultants && this.dischargeSummaryViewModel.Consultants.length > 0) {
            this.dischargeSummaryViewModel.patDischargeSummary.ConsultantNMC = this.dischargeSummaryViewModel.Consultants[0].consultantNMC;
            this.dischargeSummaryViewModel.patDischargeSummary.ConsultantDepartment = this.dischargeSummaryViewModel.Consultants[0].consultantDepartmentName;

        }
        if (this.hospitalStayDate) {
            this.dischargeSummaryViewModel.patDischargeSummary.hospitalStayDate = this.hospitalStayDate + 'Days';
        }
        if (this.dischargeSummaryViewModel.Anesthetists) {
            this.dischargeSummaryViewModel.patDischargeSummary.Anesthetists = `<div style="margin-left:0px; margin-right:0px;"> <strong>${this.dischSumFieldSettings.Anesthetists.DisplayLabelAtPrint}</strong> ${this.dischargeSummaryViewModel.Anesthetists}</div>`;

        }
        if (this.dischargeSummaryViewModel.ResidenceDrName) {
            this.dischargeSummaryViewModel.patDischargeSummary.ResidenceDrName = `<div style="margin-left:0px; margin-right:0px;"> <strong>${this.dischSumFieldSettings.ResidentDr.DisplayLabelAtPrint}</strong> ${this.dischargeSummaryViewModel.ResidenceDrName} </div> <br>`;
        }
        if (this.dischargeSummaryViewModel.BabyWeight) {
            this.dischargeSummaryViewModel.patDischargeSummary.BabyWeight = `<div style="margin-left:0px; margin-right:0px;"> <strong>${this.dischSumFieldSettings.BabyWeight.DisplayLabelAtPrint}</strong> ${this.dischargeSummaryViewModel.BabyWeight} </div> <br>`;
        }
        if (this.dischargeSummaryViewModel.patDischargeSummary.OtherDiagnosis) {
            this.dischargeSummaryViewModel.patDischargeSummary.OtherDiagnosis = `<div style="margin-left:0px; margin-right:0px;"> <strong>${this.dischSumFieldSettings.OtherDiagnosis.DisplayLabelAtPrint}</strong> ${this.dischargeSummaryViewModel.patDischargeSummary.OtherDiagnosis}</div> <br>`;
        }
        if (this.dischargeSummaryViewModel.patDischargeSummary.ClinicalFindings) {
            this.dischargeSummaryViewModel.patDischargeSummary.ClinicalFindings = `<div style="margin-left:0px; margin-right:0px;"> <strong>${this.dischSumFieldSettings.ClinicalFindings.DisplayLabelAtPrint}</strong> ${this.dischargeSummaryViewModel.patDischargeSummary.ClinicalFindings}</div> <br>`;
        }
        if (this.dischargeSummaryViewModel.patDischargeSummary.ChiefComplaint) {
            this.dischargeSummaryViewModel.patDischargeSummary.ChiefComplaint = `<div style="margin-left:0px; margin-right:0px;"> <strong>${this.dischSumFieldSettings.ChiefComplaint.DisplayLabelAtPrint}</strong> ${this.dischargeSummaryViewModel.patDischargeSummary.ChiefComplaint} </div> <br>`;
        }
        if (this.dischargeSummaryViewModel.patDischargeSummary.HistoryOfPresentingIllness) {
            this.dischargeSummaryViewModel.patDischargeSummary.HistoryOfPresentingIllness = `<div style="margin-left:0px; margin-right:0px;"> <strong>${this.dischSumFieldSettings.HistoryOfPresentingIllness.DisplayLabelAtPrint}</strong> ${this.dischargeSummaryViewModel.patDischargeSummary.HistoryOfPresentingIllness} </div> <br>`;
        }
        if (this.dischargeSummaryViewModel.patDischargeSummary.PastHistory) {
            this.dischargeSummaryViewModel.patDischargeSummary.PastHistory = `<div style="margin-left:0px; margin-right:0px;"> <strong>${this.dischSumFieldSettings.PastHistory.DisplayLabelAtPrint}</strong> ${this.dischargeSummaryViewModel.patDischargeSummary.PastHistory} </div>  <br>`;
        }
        if (this.dischargeSummaryViewModel.patDischargeSummary.CaseSummary) {
            this.dischargeSummaryViewModel.patDischargeSummary.CaseSummary = `<div style="margin-left:0px; margin-right:0px;"> <strong>${this.dischSumFieldSettings.CaseSummary.DisplayLabelAtPrint}</strong> ${this.dischargeSummaryViewModel.patDischargeSummary.CaseSummary} </div> <br>`;
        }
        if (this.dischargeSummaryViewModel.patDischargeSummary.ProcedureNts) {
            this.dischargeSummaryViewModel.patDischargeSummary.ProcedureNts = `<div style="margin-left:0px; margin-right:0px;"> <strong>${this.dischSumFieldSettings.ProcedureNts.DisplayLabelAtPrint}</strong> ${this.dischargeSummaryViewModel.patDischargeSummary.ProcedureNts} </div>  <br>`;
        }
        if (this.dischargeSummaryViewModel.patDischargeSummary.OperativeFindings) {
            this.dischargeSummaryViewModel.patDischargeSummary.OperativeFindings = `<div style="margin-left:0px; margin-right:0px;"> <strong>${this.dischSumFieldSettings.OperativeFindings.DisplayLabelAtPrint}</strong>${this.dischargeSummaryViewModel.patDischargeSummary.OperativeFindings}</div>  <br>`;
        }
        if (this.dischargeSummaryViewModel.patDischargeSummary.HospitalReport) {
            this.dischargeSummaryViewModel.patDischargeSummary.HospitalReport = `<div style="margin-left:0px; margin-right:0px;"> <strong>${this.dischSumFieldSettings.HospitalReport.DisplayLabelAtPrint}</strong>${this.dischargeSummaryViewModel.patDischargeSummary.HospitalReport}</div> <br>`;
        }
        if (this.dischargeSummaryViewModel.patDischargeSummary.HospitalCourse) {
            this.dischargeSummaryViewModel.patDischargeSummary.HospitalCourse = `<div style="margin-left:0px; margin-right:0px;"> <strong>${this.dischSumFieldSettings.HospitalCourse.DisplayLabelAtPrint}</strong>${this.dischargeSummaryViewModel.patDischargeSummary.HospitalCourse}</div>  <br>`;
        }
        if (this.dischargeSummaryViewModel.patDischargeSummary.TreatmentDuringHospitalStay) {
            this.dischargeSummaryViewModel.patDischargeSummary.TreatmentDuringHospitalStay = `<div style="margin-left:0px; margin-right:0px;"> <strong>${this.dischSumFieldSettings.TreatmentDuringHospitalStay.DisplayLabelAtPrint}</strong>${this.dischargeSummaryViewModel.patDischargeSummary.TreatmentDuringHospitalStay} </div>  <br>`;
        }
        if (this.dischargeSummaryViewModel.patDischargeSummary.Condition) {
            this.dischargeSummaryViewModel.patDischargeSummary.Condition = `<div style="margin-left:0px; margin-right:0px;"> <strong>${this.dischSumFieldSettings.Condition.DisplayLabelAtPrint}</strong>${this.dischargeSummaryViewModel.patDischargeSummary.Condition}</div>  <br>`;
        }
        if (this.dischargeSummaryViewModel.patDischargeSummary.PendingReports) {
            this.dischargeSummaryViewModel.patDischargeSummary.PendingReports = `<div style="margin-left:0px; margin-right:0px;"> <strong>${this.dischSumFieldSettings.PendingReports.DisplayLabelAtPrint}</strong>${this.dischargeSummaryViewModel.patDischargeSummary.PendingReports} </div>  <br>`;
        }
        if (this.dischargeSummaryViewModel.patDischargeSummary.SpecialNotes) {
            this.dischargeSummaryViewModel.patDischargeSummary.SpecialNotes = `<div style="margin-left:0px; margin-right:0px;"> <strong>${this.dischSumFieldSettings.SpecialNotes.DisplayLabelAtPrint}</strong>${this.dischargeSummaryViewModel.patDischargeSummary.SpecialNotes} </div> <br> `;
        }
        if (this.dischargeSummaryViewModel.patDischargeSummary.Allergies) {
            this.dischargeSummaryViewModel.patDischargeSummary.Allergies = `<div style="margin-left:0px; margin-right:0px;"> <strong>${this.dischSumFieldSettings.Allergies.DisplayLabelAtPrint}</strong>${this.dischargeSummaryViewModel.patDischargeSummary.Allergies} </div>  <br>`;
        }
        if (this.dischargeSummaryViewModel.patDischargeSummary.Activities) {
            this.dischargeSummaryViewModel.patDischargeSummary.Activities = `<div style="margin-left:0px; margin-right:0px;"> <strong>${this.dischSumFieldSettings.Activities.DisplayLabelAtPrint}</strong>${this.dischargeSummaryViewModel.patDischargeSummary.Activities} </div>  <br>`;
        }
        if (this.dischargeSummaryViewModel.patDischargeSummary.Diet) {
            this.dischargeSummaryViewModel.patDischargeSummary.Diet = `<div style="margin-left:0px; margin-right:0px;"> <strong>${this.dischSumFieldSettings.Diet.DisplayLabelAtPrint}</strong>${this.dischargeSummaryViewModel.patDischargeSummary.Diet} </div> <br>`;
        }
        if (this.dischargeSummaryViewModel.patDischargeSummary.RestDays) {
            this.dischargeSummaryViewModel.patDischargeSummary.RestDays = `<div style="margin-left:0px; margin-right:0px;"> <strong>${this.dischSumFieldSettings.RestDays.DisplayLabelAtPrint}</strong>${this.dischargeSummaryViewModel.patDischargeSummary.RestDays} Days </div>  <br>`;
        }
        if (this.dischargeSummaryViewModel.patDischargeSummary.FollowUp) {
            this.dischargeSummaryViewModel.patDischargeSummary.FollowUp = `<div style="margin-left:0px; margin-right:0px;"> <strong>${this.dischSumFieldSettings.FollowUp.DisplayLabelAtPrint}</strong>${this.dischargeSummaryViewModel.patDischargeSummary.FollowUp} Days </div> <br>`;
        }
        if (this.dischargeSummaryViewModel.patDischargeSummary.Others) {
            this.dischargeSummaryViewModel.patDischargeSummary.Others = `<div style="margin-left:0px; margin-right:0px;"> <strong>${this.dischSumFieldSettings.Others.DisplayLabelAtPrint}</strong> ${this.dischargeSummaryViewModel.patDischargeSummary.Others} </div> <br>`;
        }
        if (this.dischargeSummaryViewModel.patDischargeSummary.DischargeOrder) {
            this.dischargeSummaryViewModel.patDischargeSummary.DischargeOrder = `<div style="margin-left:0px; margin-right:0px;"> <strong>${this.dischSumFieldSettings.DischargeOrder.DisplayLabelAtPrint}</strong> ${this.dischargeSummaryViewModel.patDischargeSummary.DischargeOrder} </div> <br>`;
        }
        if (this.dischargeSummaryViewModel.patDischargeSummary.DoctorIncharge) {
            this.dischargeSummaryViewModel.patDischargeSummary.DoctorIncharge = `<div style="margin-left:0px; margin-right:0px;"> <strong>${this.dischSumFieldSettings.DoctorIncharge.DisplayLabelAtPrint}</strong> ${this.dischargeSummaryViewModel.patDischargeSummary.DoctorIncharge} </div> <br>`;
        }
        if (this.dischargeSummaryViewModel.patDischargeSummary.Anaesthetists) {
            this.dischargeSummaryViewModel.patDischargeSummary.Anaesthetists = `<div style="margin-left:0px; margin-right:0px;"> <strong>${this.dischSumFieldSettings.Anesthetists.DisplayLabelAtPrint}</strong> ${this.dischargeSummaryViewModel.patDischargeSummary.Anaesthetists} </div> <br>`;
        }
        if (this.dischargeSummaryViewModel.patDischargeSummary.ObstetricHistory) {
            this.dischargeSummaryViewModel.patDischargeSummary.ObstetricHistory = `<div style="margin-left:0px; margin-right:0px;"> <strong>${this.dischSumFieldSettings.ObstetricHistory.DisplayLabelAtPrint}</strong> ${this.dischargeSummaryViewModel.patDischargeSummary.ObstetricHistory} </div> <br>`;
        }
        if (this.dischargeSummaryViewModel.patDischargeSummary.RelevantMaternalHistory) {
            this.dischargeSummaryViewModel.patDischargeSummary.RelevantMaternalHistory = `<div style="margin-left:0px; margin-right:0px;"> <strong>${this.dischSumFieldSettings.RelevantMaternalHistory.DisplayLabelAtPrint}</strong> ${this.dischargeSummaryViewModel.patDischargeSummary.RelevantMaternalHistory} </div> <br>`;
        }
        if (this.dischargeSummaryViewModel.patDischargeSummary.IndicationForAdmission) {
            this.dischargeSummaryViewModel.patDischargeSummary.IndicationForAdmission = `<div style="margin-left:0px; margin-right:0px;"> <strong>${this.dischSumFieldSettings.IndicationForAdmission.DisplayLabelAtPrint}</strong> ${this.dischargeSummaryViewModel.patDischargeSummary.IndicationForAdmission} </div> <br>`;
        }
        if (this.dischargeSummaryViewModel.patDischargeSummary.RespiratorySystem) {
            this.dischargeSummaryViewModel.patDischargeSummary.RespiratorySystem = `<div style="margin-left:0px; margin-right:0px;"> <strong>${this.dischSumFieldSettings.RespiratorySystem.DisplayLabelAtPrint}</strong> ${this.dischargeSummaryViewModel.patDischargeSummary.RespiratorySystem} </div> <br>`;
        }
        if (this.dischargeSummaryViewModel.patDischargeSummary.CardiovascularSystem) {
            this.dischargeSummaryViewModel.patDischargeSummary.CardiovascularSystem = `<div style="margin-left:0px; margin-right:0px;"> <strong>${this.dischSumFieldSettings.CardiovascularSystem.DisplayLabelAtPrint}</strong> ${this.dischargeSummaryViewModel.patDischargeSummary.CardiovascularSystem} </div> <br>`;
        }
        if (this.dischargeSummaryViewModel.patDischargeSummary.GastrointestinalAndNutrition) {
            this.dischargeSummaryViewModel.patDischargeSummary.GastrointestinalAndNutrition = `<div style="margin-left:0px; margin-right:0px;"> <strong>${this.dischSumFieldSettings.GastrointestinalAndNutrition.DisplayLabelAtPrint}</strong> ${this.dischargeSummaryViewModel.patDischargeSummary.GastrointestinalAndNutrition} </div> <br>`;
        }
        if (this.dischargeSummaryViewModel.patDischargeSummary.Renal) {
            this.dischargeSummaryViewModel.patDischargeSummary.Renal = `<div style="margin-left:0px; margin-right:0px;"> <strong>${this.dischSumFieldSettings.Renal.DisplayLabelAtPrint}</strong> ${this.dischargeSummaryViewModel.patDischargeSummary.Renal} </div> <br>`;
        }
        if (this.dischargeSummaryViewModel.patDischargeSummary.NervousSystem) {
            this.dischargeSummaryViewModel.patDischargeSummary.NervousSystem = `<div style="margin-left:0px; margin-right:0px;"> <strong>${this.dischSumFieldSettings.NervousSystem.DisplayLabelAtPrint}</strong> ${this.dischargeSummaryViewModel.patDischargeSummary.NervousSystem} </div> <br>`;
        }
        if (this.dischargeSummaryViewModel.patDischargeSummary.Metabolic) {
            this.dischargeSummaryViewModel.patDischargeSummary.Metabolic = `<div style="margin-left:0px; margin-right:0px;"> <strong>${this.dischSumFieldSettings.Metabolic.DisplayLabelAtPrint}</strong> ${this.dischargeSummaryViewModel.patDischargeSummary.Metabolic} </div> <br>`;
        }
        if (this.dischargeSummaryViewModel.patDischargeSummary.Sepsis) {
            this.dischargeSummaryViewModel.patDischargeSummary.Sepsis = `<div style="margin-left:0px; margin-right:0px;"> <strong>${this.dischSumFieldSettings.Sepsis.DisplayLabelAtPrint}</strong> ${this.dischargeSummaryViewModel.patDischargeSummary.Sepsis} </div> <br>`;
        }
        if (this.dischargeSummaryViewModel.patDischargeSummary.CongenitalAnomalies) {
            this.dischargeSummaryViewModel.patDischargeSummary.CongenitalAnomalies = `<div style="margin-left:0px; margin-right:0px;"> <strong>${this.dischSumFieldSettings.CongenitalAnomalies.DisplayLabelAtPrint}</strong> ${this.dischargeSummaryViewModel.patDischargeSummary.CongenitalAnomalies} </div> <br>`;
        }
        if (this.dischargeSummaryViewModel.patDischargeSummary.Reflexes) {
            this.dischargeSummaryViewModel.patDischargeSummary.Reflexes = `<div style="margin-left:0px; margin-right:0px;"> <strong>${this.dischSumFieldSettings.Reflexes.DisplayLabelAtPrint}</strong> ${this.dischargeSummaryViewModel.patDischargeSummary.Reflexes} </div> <br>`;
        }
        if (this.dischargeSummaryViewModel.patDischargeSummary.MedicationsReceivedInNICUNursery) {
            this.dischargeSummaryViewModel.patDischargeSummary.MedicationsReceivedInNICUNursery = `<div style="margin-left:0px; margin-right:0px;"> <strong>${this.dischSumFieldSettings.MedicationsReceivedInNICUNursery.DisplayLabelAtPrint}</strong> ${this.dischargeSummaryViewModel.patDischargeSummary.MedicationsReceivedInNICUNursery} </div> <br>`;
        }
        if (this.dischargeSummaryViewModel.patDischargeSummary.Discussion) {
            this.dischargeSummaryViewModel.patDischargeSummary.Discussion = `<div style="margin-left:0px; margin-right:0px;"> <strong>${this.dischSumFieldSettings.Discussion.DisplayLabelAtPrint}</strong> ${this.dischargeSummaryViewModel.patDischargeSummary.Discussion} </div> <br>`;
        }
        if (this.dischargeSummaryViewModel.patDischargeSummary.CheckedBy) {
            this.dischargeSummaryViewModel.patDischargeSummary.CheckedBy = `<div style="margin-left:0px; margin-right:0px;"> <strong>${this.dischSumFieldSettings.CheckedBy.DisplayLabelAtPrint}</strong> ${this.dischargeSummaryViewModel.patDischargeSummary.CheckedBy} </div> <br>`;
        }
        if (this.ShowDoctorsSignatureImage && this.dischargeSummaryViewModel.DrInchargeSignImgPath) {
            const drImageSignPath = this.dischargeSummaryViewModel.DrInchargeSignImgPath;
            this.dischargeSummaryViewModel.patDischargeSummary.DrInchargeSignImgPath = `<img src="${drImageSignPath}" style="height: 80px;" />`
        }
        if (this.StayDays) {
            this.dischargeSummaryViewModel.patDischargeSummary.StayDays = this.StayDays;
        }

        this.formattedData = this.RestructureData(this.dischargeSummaryViewModel.patDischargeSummary);
        this.mergedObj = { ...this.formattedData, ...this.dischargeSummaryViewModel.selectedADT, ...this.dischargeSummaryViewModel.selectedADT.BedInformation }   //Bikesh: 24-july-2023 merging multiple object to single object 
        // console.log(this.mergedObj);

    }

    RestructureData(data: any): any {       // Bikesh:24th-july-'23 restructuring all incoming data to implement placeholder replacement logic
        const flattenedData = this.Flatten(data);
        return { ...flattenedData, ...data };
    }

    Flatten(obj: any, parentKey = '', sep = '_'): any {
        const flattenedObj: any = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                const newKey = parentKey ? parentKey + sep + key : key;
                if (typeof obj[key] === 'object' && obj[key] !== null) {
                    const flatObject = this.Flatten(obj[key], newKey, sep);
                    Object.assign(flattenedObj, flatObject);
                } else {
                    flattenedObj[newKey] = obj[key];
                }
            }
        }
        return flattenedObj;
    }
    // 3-jan-2024: bikesh here we not using global print because header and other things are customizable over there and their impact is in all invoices
    // public Print(): void {
    //     this.loading = true;
    //     if (!this.selectedPrinter || this.selectedPrinter.PrintingType === ENUM_PrintingType.browser) {
    //         this.browserPrintContentObj = document.getElementById("id_discharge_summary_printpage");
    //         this.openBrowserPrintWindow = false;
    //         this.changeDetector.detectChanges();
    //         this.openBrowserPrintWindow = true;
    //         this.loading = false;

    //     }
    //     else {
    //         this.loading = false;
    //         this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, ["Printer Not Supported."]);
    //     }
    // }

    public GetInvoiceDisplaySettings() {
        let StrParam = this.coreService.Parameters.find((a) =>
            a.ParameterGroupName === "Billing" &&
            a.ParameterName === "InvoiceDisplaySettings"
        );
        if (StrParam && StrParam.ParameterValue) {
            let currParam = JSON.parse(StrParam.ParameterValue);
            return currParam;
        }
    }

    public CalculateHospitalStayDay() {
        let date1 = new Date(this.selectedADT.DischargedDate);
        let date2 = new Date(this.selectedADT.AdmittedDate);
        this.hospitalStayDate = Math.floor((Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate()) - Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate())) / (1000 * 60 * 60 * 24));

    }

    LoadTemplateFields(TemplateId: number) {
        this.dischargeSummaryBLService.LoadTemplateFields(TemplateId).subscribe((res: DanpheHTTPResponse) => {
            if (res.Status === ENUM_DanpheHTTPResponses.OK) {
                this.selectedTemplateFileds = res.Results;
                this.CalculateHospitalStayDays();
                this.SelectedTemplateFiledsTransformData();
                this.callbackResponseDataEmitter.emit({ IsDataReceived: true });
            }
        })
    }

    //Bikesh:3-Aug-023 extracting selectedTemplateFileds properties
    SelectedTemplateFiledsTransformData() {
        this.dischSumFieldSettings = new DischargeSummaryFieldSettingsVM();
        if (this.selectedTemplateFileds && this.selectedTemplateFileds.length > 0) {
            for (const item of this.selectedTemplateFileds) {
                const fieldName = item.FieldName;
                const show = item.IsActive;
                const isMandatory = item.IsMandatory;
                const DisplayLabelAtPrint = item.DisplayLabelAtPrint;
                const DisplayLabelAtForm = item.DisplayLabelAtForm;
                this.UpdateFieldSettings(fieldName, show, isMandatory, DisplayLabelAtForm, DisplayLabelAtPrint);
            }
            this.ReFormatDischargeSummary(this.dischargeSummaryViewModel.DischargeType);
        }
    }
    UpdateFieldSettings(fieldName: string, show: boolean, isMandatory: boolean, DisplayLabelAtForm: string, DisplayLabelAtPrint: string) {
        if (fieldName in this.dischSumFieldSettings) {
            this.dischSumFieldSettings[fieldName].Show = show;
            this.dischSumFieldSettings[fieldName].IsMandatory = isMandatory;
            this.dischSumFieldSettings[fieldName].DisplayLabelAtForm = DisplayLabelAtForm;
            this.dischSumFieldSettings[fieldName].DisplayLabelAtPrint = DisplayLabelAtPrint;
        }
    }
    public Print(): void {
        this.loading = true;

        if (!this.selectedPrinter || this.selectedPrinter.PrintingType === ENUM_PrintingType.browser) {
            const contentToPrint = document.getElementById("id_discharge_summary_printpage");

            if (contentToPrint) {
                const printContent = contentToPrint.innerHTML;

                // Rest of your print logic
                const documentContent = `
              <html>
                <head>
                <style>
                @page{
                    margin-top:${this.DischargeSummaryHeaderSettings.HeaderGap}px;
                    margin-bottom:${this.DischargeSummaryHeaderSettings.FooterGap}px;
                }
                </style>               
                  <link rel="stylesheet" type="text/css" href="../../../themes/theme-default/DischargeSummaryPrintFormat.css">
                </head>
                <body onload="window.print()">${printContent}</body>
              </html>
            `;

                const iframe = document.createElement('iframe');
                document.body.appendChild(iframe);
                iframe.contentWindow.document.open();
                iframe.contentWindow.document.write(documentContent);
                iframe.contentWindow.document.close();

                setTimeout(() => {
                    document.body.removeChild(iframe);
                    this.loading = false;
                }, 500);
            } else {
                this.loading = false;
                this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, ["No content to print."]);
            }
        } else {
            this.loading = false;
            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, ["Printer Not Supported."]);
        }
    }
    CalculateHospitalStayDays() {
        const currentDate: Date = new Date();
        // const millisecondsPerDay = 1000 * 60 * 60 * 24; // Number of milliseconds in a day
        let admittedDate: Date;
        let dischargedDate: Date;

        if (this.selectedADT && this.selectedADT.AdmittedDate) {
            admittedDate = new Date(this.selectedADT.AdmittedDate);
        } else {
            admittedDate = currentDate;
        }
        if (this.selectedADT && this.selectedADT.DischargedDate) {
            dischargedDate = new Date(this.selectedADT.DischargedDate);
        } else {
            dischargedDate = currentDate;
        }
        // const millisecondsDifference = dischargedDate.getTime() - admittedDate.getTime();
        // this.StayDays = Math.ceil(millisecondsDifference / millisecondsPerDay);
        this.StayDays = moment(dischargedDate).diff(admittedDate, "day");
        if (this.StayDays === 0) {
            this.StayDays = 1;
        }
    }

}
