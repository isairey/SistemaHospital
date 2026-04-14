import { Component, OnInit } from '@angular/core';
import * as moment from 'moment';
import { CoreService } from '../../../core/shared/core.service';
import { DanpheHTTPResponse } from '../../../shared/common-models';
import { MessageboxService } from '../../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponses, ENUM_DateTimeFormat, ENUM_Genders, ENUM_InvestigationLAB_ValueType, ENUM_MessageBox_Status } from '../../../shared/shared-enums';
import { ClinicalPatientService } from '../../shared/clinical-patient.service';
import { ClinicalNoteDLService } from '../../shared/clinical.dl.service';
import { Field } from '../../shared/dto/field.dto';
import { LabInvestigationResultsView_DTO } from '../../shared/dto/lab-investigation-result-view-dto';
import { LabInvestigationResult_DTO } from '../../shared/dto/lab-investigation-result.dto';
import { LabTestsList_Dto } from '../../shared/dto/lab-test-list.dto';
import { PatientDetails_DTO } from '../../shared/dto/patient-cln-detail.dto';

@Component({
  selector: 'lab-investigation-result',
  templateUrl: './lab-investigation-result.component.html'
})
export class LabInvestigationResultsComponent implements OnInit {
  Field: Field;
  IsAcrossVisitAvailability: boolean = false;
  Days: number = 10;
  FromDate: string = moment().format(ENUM_DateTimeFormat.Year_Month_Day);
  ToDate: string = moment().format(ENUM_DateTimeFormat.Year_Month_Day);
  InvestigationResultList: Array<LabInvestigationResult_DTO> = [];
  ShowPrintPage: boolean = false;
  InvestigationResultViewList: Array<LabInvestigationResultsView_DTO> = new Array<LabInvestigationResultsView_DTO>();
  DateHeaders: Array<string> = [];
  IsInvalidInput: boolean = false;
  IsNumValid: boolean = true;
  DivContentObj: any = { innerHTML: '' };
  LabTests: Array<LabTestsList_Dto> = new Array<LabTestsList_Dto>();
  PreselectLabTest: Array<LabTestsList_Dto> = new Array<LabTestsList_Dto>();
  SelectedLabTestIds = new LabTestsList_Dto();
  LabTestIds: number[] = [];
  FilteredDateHeaders: string[] = [];
  FilteredInvestigationResultViewList: Array<LabInvestigationResultsView_DTO> = new Array<LabInvestigationResultsView_DTO>();
  TestCount: number = 10;
  SelectedPatient: PatientDetails_DTO = new PatientDetails_DTO();

  constructor(
    public coreService: CoreService,
    private _selectedPatientService: ClinicalPatientService,
    private _clinicalNoteDLSerivce: ClinicalNoteDLService,
    private _msgBoxServ: MessageboxService,
  ) {

  }

  ngOnInit() {
    if (this.Field) {
      this.IsAcrossVisitAvailability = this.Field.IsAcrossVisitAvailability;
    } else {
      this.IsAcrossVisitAvailability = false;
    }
    if (!this.IsAcrossVisitAvailability) {
      this.ConvertDaysToDate(this.Days);
    }
    if (this.Field && this.Field.FieldConfig && this.Field.FieldConfig.PreTemplatePatientDetail) {
      this.SelectedPatient = this.Field.FieldConfig.PreTemplatePatientDetail;
    }
    this.LoadReport();
    this.GetLabTestsList();
  }
  validateInput() {
    if (this.Days < 1 || this.Days > 20) {
      this.IsInvalidInput = true;
    } else {
      this.IsInvalidInput = false;
    }
  }
  LabTestOnChange($event) {
    if ($event) {
      this.SelectedLabTestIds = new LabTestsList_Dto();
      this.LabTestIds = $event.map((a) => a.LabTestId);
    }
  }
  GetLabTestsList(): void {
    this._clinicalNoteDLSerivce
      .GetLabTestsList()
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this.LabTests = res.Results;
          this.PreselectLabTest = this.LabTests.filter(a => a.IsSelected === true);
        } else {
          this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ["Cannot Load the Lab Test List",]);
        }
      });
  }
  ConvertDaysToDate(days: number): void {
    if (this.IsAcrossVisitAvailability) return;

    this.IsNumValid = true;
    if (days >= 1 && days <= 20) {
      const date = new Date();
      if (days > 1) {
        date.setDate(date.getDate() - days + 1);
      }
      this.DateHeaders = [];
      this.FromDate = moment(date).format(ENUM_DateTimeFormat.Year_Month_Day);
      const fromDate = moment(this.FromDate);
      const toDate = moment(this.ToDate).add(1, 'day');
      while (fromDate.isBefore(toDate, 'day')) {
        this.DateHeaders.push(moment(fromDate).format(ENUM_DateTimeFormat.Year_Month_Day));
        fromDate.add(1, 'days');
      }
    }
    else {
      this.IsNumValid = false;
      this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Warning, ['Please enter days from 1 to 20']);
    }
  }
  LoadReport() {
    this.ConvertDaysToDate(this.Days);
    this.IsNumValid = true;
    let patientId = this._selectedPatientService.SelectedPatient.PatientId;
    let patientVisitId = this._selectedPatientService.SelectedPatient.PatientVisitId;
    const labTestIds = this.LabTestIds.join(',');
    this.FromDate = this.IsAcrossVisitAvailability ? null : this.FromDate;
    this.ToDate = this.IsAcrossVisitAvailability ? null : this.ToDate;
    this.TestCount = this.IsAcrossVisitAvailability ? this.TestCount : null;
    this._clinicalNoteDLSerivce
      .GetInvestigationResults(this.FromDate, this.ToDate, patientId, patientVisitId, labTestIds, this.IsAcrossVisitAvailability, this.TestCount,)
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          if (res.Results && res.Results.length > 0) {
            this.InvestigationResultList = res.Results;
            this.InvestigationResultList = res.Results.map(item => {
              item['ReferenceRange'] = this.GetReferenceRange(item);
              return item;
            });
            this.FormatInvestigationResult(this.InvestigationResultList);
            this.FilterColumnsWithData();
          }
        }
        else {

          this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ["Cannot Load the Lab Investigation Result List Please Check The Console"]);
        }
      });
  }
  GetReferenceRange(item: LabInvestigationResultsView_DTO): string {
    let age = this.coreService.CalculateAge(this._selectedPatientService.SelectedPatient.DateOfBirth);
    let formattedAge = parseInt(age.replace(/\D/g, ''), 10) || 0;
    const gender = this._selectedPatientService.SelectedPatient.Gender.toLowerCase();
    if (item.ValueType === ENUM_InvestigationLAB_ValueType.number) {
      if (formattedAge < 16) {
        return item.ChildRange || item.Range;
      } else {
        if (gender === ENUM_Genders.Male) {
          return item.MaleRange || item.Range;
        } else if (gender === ENUM_Genders.Female) {
          return item.FemaleRange || item.Range;
        } else {
          return item.Range;
        }
      }
    }
    else if (item.ValueType === ENUM_InvestigationLAB_ValueType.text) {
      return item.RangeDescription;
    }
    return '';
  }
  public FormatInvestigationResult(labTestInfo: Array<LabInvestigationResult_DTO>) {
    this.InvestigationResultViewList = [];
    this.DateHeaders = [];
    if (!labTestInfo || labTestInfo.length === 0) {
      this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Warning, ["No data provided for investigation results."]);
      return;
    }
    let fromDate = this.FromDate ? moment(this.FromDate) : moment.min(labTestInfo.map(item => moment(item.ResultDate)));
    let toDate = this.ToDate ? moment(this.ToDate).add(1, 'day') : moment.max(labTestInfo.map(item => moment(item.ResultDate))).add(1, 'day');
    let current = moment(fromDate);
    while (current.isBefore(toDate, 'day')) {
      this.DateHeaders.push(current.format('YYYY-MM-DD'));
      current.add(1, 'day');
    }
    labTestInfo.forEach(item => {
      let result = new LabInvestigationResultsView_DTO();

      if (item && item.Test && (item.ComponentName || item.Unit)) {
        result.TestName = item.Test;
        result.ComponentName = item.ComponentName;
        result.Unit = item.Unit;
        result.ReferenceRange = item.ReferenceRange;
        result.IsAbnormal = item.IsAbnormal;
        this.DateHeaders.forEach(date => {
          let value = labTestInfo.find(a =>
            a.Test === item.Test &&
            a.ComponentName === item.ComponentName &&
            moment(a.ResultDate).isSame(moment(date), 'day')
          );

          result.Values.push(value ? value.Value : '');
        });

        this.InvestigationResultViewList.push(result);
      }
    });
  }


  FilterColumnsWithData() {
    const columnHasData = (index: number) => {
      return this.InvestigationResultViewList.some(row => row.Values[index] !== null && row.Values[index] !== undefined && row.Values[index] !== '');
    };

    this.FilteredDateHeaders = this.DateHeaders.filter((_, index) => columnHasData(index));

    this.FilteredInvestigationResultViewList = this.InvestigationResultViewList.map(row => {
      return {
        ...row,
        Values: row.Values.filter((_, index) => columnHasData(index)),
        IsAbnormal: row.IsAbnormal
      };
    });
    console.log("final", this.FilteredInvestigationResultViewList);
  }
  PrintResults() {
    this.DivContentObj = this.DivContentObj.innerHTML + document.getElementById('result_list').innerHTML;
    this.ShowPrintPage = true;
  }
  HidePrintPage() {
    this.ShowPrintPage = false;
    this.DivContentObj = { innerHTML: '' };
  }
}
