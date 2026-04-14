import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import * as moment from 'moment';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { EmployeeListDTO } from '../../../clinical-settings/shared/dto/employee-list.dto';
import { DanpheHTTPResponse } from '../../../shared/common-models';
import { MessageboxService } from '../../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponses, ENUM_Medication_Status, ENUM_MessageBox_Status } from '../../../shared/shared-enums';
import { ClinicalPatientService } from '../../shared/clinical-patient.service';
import { ClinicalNoteBLService } from '../../shared/clinical.bl.service';
import { Field } from '../../shared/dto/field.dto';
import { ItemList_DTO } from '../../shared/dto/item-list.dto';
import { MedicationLog_DTO } from '../../shared/dto/medication-log.dto';
import { PatientMedication_DTO } from '../../shared/dto/patient-medication.dto';

@Component({
  selector: 'treatment-cardex-view',
  templateUrl: './treatment-cardex-view.component.html',
  styleUrls: ['./treatment-cardex-view.component.css']
})
export class TreatmentCardexViewComponent implements OnInit {
  Field: Field;
  IsAcrossVisitAvailability: boolean = false;
  ActivePatientMedications = new Array<PatientMedication_DTO>();
  PatientId: number = 0;
  PatientVisitId: number = 0;
  MedicationTakenDateTime: string;
  MedicationTakenDate: string;
  MedicationTakenTime: string;
  ShowAddMedicationLogPopUp: boolean = false;
  ShoMedicationLogs: boolean = false;
  ShowAllMedicationLogPopUp = false;
  MedicationViewValidator: FormGroup = null;
  EntryMedicationLog = new MedicationLog_DTO();
  MedicationHistoryLogs = new Array<MedicationLog_DTO>();
  FilteredMedicationEntryLogs = new Array<MedicationLog_DTO>();
  SelectedActiveMedication = new PatientMedication_DTO();
  PatientAllMedicationLogs = new Array<PatientMedication_DTO>();
  FilterPatientAllMedicationList = new Array<PatientMedication_DTO>();
  EmployeeList = new Array<EmployeeListDTO>();
  CardexMedicationItemList = new Array<ItemList_DTO>();
  FilteredMedicationLogs = new Array<ItemList_DTO>();

  FromDate: string = "";
  ToDate: string = "";
  PrescriberName: string = "";
  SelectedCardexItemToFilter: { ItemId: number, ItemName: string; };

  constructor(
    private _clinicalBlService: ClinicalNoteBLService,
    private _selectedPatientService: ClinicalPatientService,
    private _messageBoxService: MessageboxService
  ) {

  }
  ngOnInit() {
    if (this.Field) {
      this.IsAcrossVisitAvailability = this.Field.IsAcrossVisitAvailability;
    } else {
      this.IsAcrossVisitAvailability = false;
    }
    this.PatientId = this._selectedPatientService.SelectedPatient.PatientId;
    this.PatientVisitId = this._selectedPatientService.SelectedPatient.PatientVisitId;
    this.GetEmployeeList();
    this.MedicationTakenDateTime = moment().format('YYYY-MM-DDTHH:mm');
    var _formBuilder = new FormBuilder();
    this.MedicationViewValidator = _formBuilder.group({
      'ItemName': [{ value: '', disabled: true }, Validators.required],
      'LastMedicationTakenDateTime': [{ value: '', disabled: true }],
      'Comments': ['', Validators.required]
    });
    let request: Observable<any>[] = [];

    request.push(this._clinicalBlService.GetSelectedPatientMedicationList(this.PatientId, this.PatientVisitId, this.IsAcrossVisitAvailability).pipe(
      catchError((err) => {
        return of(err.error);
      }
      )
    ));
    request.push(this._clinicalBlService.GetPatientActiveMedications(this.PatientId, this.PatientVisitId, this.IsAcrossVisitAvailability).pipe(
      catchError((err) => {
        return of(err.error);
      }
      )
    ));
    forkJoin(request).subscribe(
      result => {
        this.GetSelectedPatientMedicationList(result[0]);
        this.GetPatientActiveMedications(result[1]);
        this.FilterCardexMedicationItemList();
      }
    );


  }
  GetPatientActiveMedications(res) {
    if (res.Status === ENUM_DanpheHTTPResponses.OK) {
      if (res.Results && res.Results.length > 0) {
        this.ActivePatientMedications = res.Results;
        this.ActivePatientMedications.forEach(a => {
          if (a.Status === ENUM_Medication_Status.Active) {
            a.IsActiveMedication = true;
          }
        });
      }
      else {
        this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, ['Patient Medication List is empty.']);
      }
    } else {
      this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, ['Failed to get Patient Medication List',
      ]);
    }
  }
  AddNewMedicationLog(SelectedActiveMedication: PatientMedication_DTO) {
    this.SelectedActiveMedication = SelectedActiveMedication;
    this.ShowAddMedicationLogPopUp = true;
    if (SelectedActiveMedication) {
      if (SelectedActiveMedication.MedicationTakenDate && SelectedActiveMedication.MedicationTakenTime) {
        let combinedDateTime = this.CombineDateAndTime(SelectedActiveMedication.MedicationTakenDate, SelectedActiveMedication.MedicationTakenTime);
        this.MedicationViewValidator.get('LastMedicationTakenDateTime').patchValue(combinedDateTime);
      }
      else {
        this.MedicationViewValidator.get('LastMedicationTakenDateTime').patchValue(null);
      }
      this.MedicationViewValidator.get('ItemName').patchValue(SelectedActiveMedication.ItemName);
    }
  }
  ClosePopUp() {
    this.ShowAddMedicationLogPopUp = false;
    this.ShoMedicationLogs = false;
    this.ShowAllMedicationLogPopUp = false;
  }
  FilterCardexMedicationItemList() {
    if (this.ActivePatientMedications && this.ActivePatientMedications.length > 0 &&
      this.CardexMedicationItemList && this.CardexMedicationItemList.length > 0) {
      const activeItemIds = this.ActivePatientMedications
        .filter(med => med.MedicationTakenTime !== null)
        .map(med => med.ItemId);
      const filteredItemList = this.CardexMedicationItemList
        .filter(item => activeItemIds.includes(item.ItemId));
      const uniqueItemList: ItemList_DTO[] = [];
      filteredItemList.forEach(item => {
        if (!uniqueItemList.some(existingItem => existingItem.ItemName === item.ItemName)) {
          uniqueItemList.push(item);
        }
      });
      this.CardexMedicationItemList = uniqueItemList;
    }
  }


  AddMedicationEntry() {
    this.EntryMedicationLog = this.MedicationViewValidator.value;
    this.EntryMedicationLog.MedicationTakenDate = moment(this.MedicationTakenDateTime).format('YYYY-MM-DD');
    this.EntryMedicationLog.MedicationTakenTime = moment(this.MedicationTakenDateTime).format('HH:mm');
    this.EntryMedicationLog.CardexplanId = this.SelectedActiveMedication.CardexId;
    this._clinicalBlService.AddMedicationEntry(this.EntryMedicationLog).subscribe((res: DanpheHTTPResponse) => {
      if (res.Status === ENUM_DanpheHTTPResponses.OK) {
        this.MedicationViewValidator.reset();
        this._messageBoxService.showMessage(ENUM_MessageBox_Status.Success, ['Medication Entry successful.']);
        this.ShowAddMedicationLogPopUp = false;
        this._clinicalBlService.GetSelectedPatientMedicationList(this.PatientId, this.PatientVisitId, this.IsAcrossVisitAvailability)
          .subscribe((res: DanpheHTTPResponse) => {
            this.GetSelectedPatientMedicationList(res);
            this._clinicalBlService.GetPatientActiveMedications(this.PatientId, this.PatientVisitId, this.IsAcrossVisitAvailability)
              .subscribe((res: DanpheHTTPResponse) => {
                this.GetPatientActiveMedications(res);
                this.FilterCardexMedicationItemList();
              });
          });

      }
      else {
        this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ['Failed add Medication Entry.']);
      }
    });
  }
  CombineDateAndTime(date: string, time: string) {
    const datePart = date.split('T')[0];
    const combined = `${datePart} - ${time}`;
    return (combined);
  }
  ShowSelectedMedicationHistory(SelectedActiveMedication: PatientMedication_DTO) {
    this.SelectedActiveMedication = SelectedActiveMedication;
    this._clinicalBlService.GetSelectedMedicationHistoryLogs(this.SelectedActiveMedication.CardexId).subscribe((res: DanpheHTTPResponse) => {
      if (res.Status === ENUM_DanpheHTTPResponses.OK) {
        this.MedicationHistoryLogs = res.Results;
        this.FilteredMedicationEntryLogs = this.MedicationHistoryLogs;
        this.ShoMedicationLogs = true;
        if (this.SelectedActiveMedication.PrescriberId && this.EmployeeList && this.EmployeeList.length > 0) {
          let medicationPrescriber = this.EmployeeList.find(a => a.EmployeeId == this.SelectedActiveMedication.PrescriberId);
          this.PrescriberName = medicationPrescriber.EmployeeName;
        }
        else {
          this.PrescriberName = "";
        }
        if (this.MedicationHistoryLogs && this.MedicationHistoryLogs.length > 0) {
          this.MedicationHistoryLogs.forEach(a => {
            let entryBy = this.EmployeeList.find(e => e.EmployeeId == a.CreatedBy);
            a.EntryBy = entryBy.EmployeeName;
          });
        }
      }
      else {
        this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ['Unable to get the selected Active medications history log.']);
        this.ShoMedicationLogs = false;
      }
    });
  }
  OnFromToDateChange($event) {
    this.FromDate = $event.fromDate;
    this.ToDate = $event.toDate;
  }
  GetEmployeeList() {
    this._clinicalBlService.GetEmployeeList()
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this.EmployeeList = res.Results;
        }
      });
  }
  FilterEntryLogs() {
    this.FilteredMedicationEntryLogs = this.FilterMedicationEntryLog();
  }
  FilterMedicationEntryLog() {
    if (this.FromDate && this.ToDate) {
      const fromDate = new Date(this.FromDate.split('T')[0]);
      const toDate = new Date(this.ToDate.split('T')[0]);
      const filteredLogs = this.MedicationHistoryLogs.filter(log => {
        const medicationTakenDate = new Date(log.MedicationTakenDate.split('T')[0]);
        return medicationTakenDate >= fromDate && medicationTakenDate <= toDate;
      });
      return filteredLogs;
    } else {
      return [];
    }
  }

  GetAllMedicationLogList() {
    this._clinicalBlService.GetAllMedicationLogList(this.PatientId, this.PatientVisitId, this.IsAcrossVisitAvailability)
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this.ShowAllMedicationLogPopUp = true;
          if (res.Results && res.Results.length > 0) {
            res.Results.forEach(a => {
              let entryBy = this.EmployeeList.find(e => e.EmployeeId == a.CreatedBy);
              a.EntryBy = entryBy.EmployeeName;
            });
          }
          this.PatientAllMedicationLogs = res.Results;
          this.FilterPatientAllMedicationList = res.Results;

        }
        else {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ['failed to get the all medication list']);
        }
      });
  }

  GetSelectedPatientMedicationList(res) {
    if (res.Status === ENUM_DanpheHTTPResponses.OK) {
      if (res.Results && res.Results.length > 0) {
        this.CardexMedicationItemList = res.Results;
      }
      else {
        this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, ['Patient Medication List is empty.']);
      }
    } else {
      this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, ['Failed to get Patient Medication List',
      ]);
    }
  }

  CardexMedicationItemLists(data: any): string {
    let html = data["ItemName"];
    return html;
  }
  FilterPatientAllMedicationEntryList() {
    if (this.SelectedCardexItemToFilter) {
      this.FilterPatientAllMedicationList = this.PatientAllMedicationLogs.filter(
        a => a.MedicationItemId === this.SelectedCardexItemToFilter.ItemId
      );
    } else {
      this.FilterPatientAllMedicationList = this.PatientAllMedicationLogs;
    }

    if (this.FromDate && this.ToDate) {
      const fromDate = new Date(this.FromDate.split('T')[0]);
      const toDate = new Date(this.ToDate.split('T')[0]);
      const filteredLogs = this.FilterPatientAllMedicationList.filter(log => {
        const medicationTakenDate = new Date(log.MedicationTakenDate.split('T')[0]);
        return medicationTakenDate >= fromDate && medicationTakenDate <= toDate;
      });

      this.FilterPatientAllMedicationList = filteredLogs;
      return filteredLogs;
    } else {
      return this.FilterPatientAllMedicationList;
    }
  }

  OnMedicationItemSelected(event: any) {
    if (this.SelectedCardexItemToFilter) {
      this.FilteredMedicationLogs = this.CardexMedicationItemList.filter(log =>
        log.ItemName === this.SelectedCardexItemToFilter.ItemName
      );
    } else {
      this.FilteredMedicationLogs = this.CardexMedicationItemList;
    }
  }
  ReloadMedicationView(): void {
    this._clinicalBlService.GetPatientActiveMedications(this.PatientId, this.PatientVisitId, this.IsAcrossVisitAvailability).subscribe((res: DanpheHTTPResponse) => {
      this.GetPatientActiveMedications(res);
    });
  }

  IsToday(date: Date): boolean {
    const today = new Date();
    const dateValue = new Date(date);
    return dateValue.toDateString() === today.toDateString();
  }
  IsYesterday(date: Date): boolean {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateValue = new Date(date);
    return dateValue.toDateString() === yesterday.toDateString();
  }
}


