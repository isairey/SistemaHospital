import { ChangeDetectorRef, Component, EventEmitter, Input, Output } from '@angular/core';
import { ClinicalSettingsBLService } from '../../../../clinical-settings/shared/clinical-settings.bl.service';
import { ClinicalHeading_DTO } from '../../../../clinical-settings/shared/dto/clinical-heading.dto';
import { ClinicalMasterNotes_DTO } from '../../../../clinical-settings/shared/dto/clinical-master-notes.dto';
import { ClinicalFieldList_DTO, ClinicalNotesMapping_DTO, FilteredMedicalComponents_DTO } from '../../../../clinical-settings/shared/dto/clinical-notes-mapping.dto';
import { DepartmentList_DTO } from '../../../../clinical-settings/shared/dto/department-list.dto';
import { EmployeeListDTO } from '../../../../clinical-settings/shared/dto/employee-list.dto';
import { DanpheHTTPResponse } from '../../../../shared/common-models';
import { MessageboxService } from '../../../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponses, ENUM_EscapeKey, ENUM_MappingType, ENUM_MessageBox_Status } from '../../../../shared/shared-enums';



@Component({
  selector: 'clinical-component-mapping',
  templateUrl: './clinical-component-mapping.component.html',
  host: { '(window:keydown)': 'hotkeys($event)' }
})
export class ClinicalComponentMappingComponent {
  @Output("callback-add")
  CallbackAdd: EventEmitter<Object> = new EventEmitter<Object>();
  @Input("Show-MedicalComponent-Page")
  ShowMedicalComponentPage: boolean = false;
  @Input("Clinical-Notes")
  ClinicalNotes: ClinicalMasterNotes_DTO = new ClinicalMasterNotes_DTO();
  ClinicalNotesMapping: ClinicalNotesMapping_DTO = new ClinicalNotesMapping_DTO();
  DepartmentList = new Array<DepartmentList_DTO>();
  EmployeeList = new Array<EmployeeListDTO>();
  FilteredEmployeeList = new Array<EmployeeListDTO>();
  FilteredDepartmentList = new Array<DepartmentList_DTO>();
  FieldList = new Array<ClinicalFieldList_DTO>();
  filteredFields: ClinicalFieldList_DTO[] = [];
  SearchQuery: string = '';
  SelectedUserFieldsToMap = new ClinicalNotesMapping_DTO();
  ParentHeadingsList = new Array<ClinicalHeading_DTO>();
  FilterChildHeadings = new Array<ClinicalHeading_DTO>();
  ChildHeadingsList = new Array<ClinicalHeading_DTO>();
  MedicalComponentList = new Array<FilteredMedicalComponents_DTO>();
  FilteredMedicalComponents = new Array<FilteredMedicalComponents_DTO>();
  ShowMapping: boolean = false;
  SelectAllComponent: boolean = false;
  IsProceedClicked: boolean = false;
  CurrentMappingLabel: string = '';
  ClinicalFields = new Array<FilteredMedicalComponents_DTO>();

  constructor(
    private _clnSettingBLService: ClinicalSettingsBLService,
    private msgBoxServ: MessageboxService,
    private changeDetector: ChangeDetectorRef
  ) {
    this.GetEmployeeList();
    this.GetDepartmentList();
    this.GetParentHeadings();
    this.GetAllChildHeadings();
  }

  OnSearchQueryChange(value: string): void {
    this.SearchQuery = value;
    this.FilterFieldList();
  }
  GetClinicalNotesMappingLabel(): string {
    const selectedDepartmentId = this.ClinicalNotesMapping.ClinicalNotesMappingValidator.get('DepartmentId').value;
    const selectedEmployeeId = this.ClinicalNotesMapping.ClinicalNotesMappingValidator.get('EmployeeId').value;
    if (!this.IsProceedClicked) {
      return this.CurrentMappingLabel || '';
    }
    if (!selectedDepartmentId && !selectedEmployeeId) {
      this.CurrentMappingLabel = ENUM_MappingType.Default;
    }
    else if (selectedDepartmentId && !selectedEmployeeId) {
      const selectedDepartment = this.DepartmentList.find(dep => dep.DepartmentId === +selectedDepartmentId);
      this.CurrentMappingLabel = selectedDepartment
        ? `${ENUM_MappingType.DepartmentLevel} (${selectedDepartment.DepartmentName})`
        : ENUM_MappingType.DepartmentLevel;
    }
    else if (selectedEmployeeId) {
      const selectedEmployee = this.EmployeeList.find(emp => emp.EmployeeId === +selectedEmployeeId);
      this.CurrentMappingLabel = selectedEmployee
        ? `${ENUM_MappingType.UserLevel} (${selectedEmployee.EmployeeName})`
        : ENUM_MappingType.UserLevel;
    }
    return this.CurrentMappingLabel;
  }

  ChangeAllCheckbox(): void {
    const form = this.ClinicalNotesMapping.ClinicalNotesMappingValidator;
    const selectAllControl = form.get('SelectAllComponent');
    if (selectAllControl) {
      const selectAll = selectAllControl.value;
      const filteredFieldList = this.FilterFieldList();
      filteredFieldList.forEach(field => {
        field.IsActive = selectAll;
        this.OnFieldMapping(field);
      });
    } else {
      console.error('FormControl "SelectAllComponent" is not defined.');
    }
  }
  CheckIfAllFieldsActive(): boolean {
    return this.FieldList.every(field => field.IsActive);
  }
  /**
  * @summary Fetches the list of departments from the service.
  */
  GetDepartmentList(): void {
    this._clnSettingBLService.GetDepartmentList()
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this.DepartmentList = res.Results;
          this.FilteredDepartmentList = this.DepartmentList;
        }
      });
  }
  /**
 *  @summary Fetches the list of employees from the service.
 */
  GetEmployeeList(): void {
    this._clnSettingBLService.GetEmployeeList()
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this.EmployeeList = res.Results;
          this.FilteredEmployeeList = this.EmployeeList;
        }
      });
  }
  /**
 *  @summary Fetches the parent headings for clinical notes from the service.
 */
  GetParentHeadings(): void {
    this._clnSettingBLService.GetClinicalParentHeadings()
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this.ParentHeadingsList = res.Results;
        }
      });
  }
  /**
  *@summary Fetches all child headings for clinical notes from the service.
  */
  GetAllChildHeadings(): void {
    this._clnSettingBLService.GetAllChildClinicalHeadings()
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this.ChildHeadingsList = res.Results;
        }
      });
  }

  /**
 *  @summary Filters the employee list based on the selected department.
 */
  FilterEmployeeList(): void {
    this.IsProceedClicked = false;
    const selectedDepartmentId = this.ClinicalNotesMapping.ClinicalNotesMappingValidator.get('DepartmentId').value;
    if (selectedDepartmentId !== null && selectedDepartmentId !== undefined && !isNaN(selectedDepartmentId)) {
      const parsedDepartmentId = +selectedDepartmentId;
      if (this.EmployeeList && this.EmployeeList.length) {
        this.FilteredEmployeeList = this.EmployeeList.filter(employee => employee.DepartmentId === parsedDepartmentId);
      }
    } else {
      this.FilteredEmployeeList = this.EmployeeList;
    }
  }

  /**
   * @summary Assigns a department based on the selected employee.
   */
  AssignDepartment(): void {
    this.IsProceedClicked = false;
    const selectedEmployeeId = this.ClinicalNotesMapping.ClinicalNotesMappingValidator.get('EmployeeId').value;
    if (selectedEmployeeId) {
      const parsedEmployeeId = +selectedEmployeeId;
      const selectedEmployee = this.EmployeeList.find(a => a.EmployeeId === parsedEmployeeId);
      if (selectedEmployee) {
        this.ClinicalNotesMapping.ClinicalNotesMappingValidator.patchValue({
          DepartmentId: selectedEmployee.DepartmentId
        });
        this.FilteredDepartmentList = this.DepartmentList.filter(dept => dept.DepartmentId === selectedEmployee.DepartmentId);
      }
    } else {
      this.ClinicalNotesMapping.ClinicalNotesMappingValidator.patchValue({
        DepartmentId: null
      });
      this.FilteredDepartmentList = this.DepartmentList;
    }
  }

  /**
   * @summary Filters child headings and medical components based on the selected parent heading ID.
   *  */
  FilterChildHeadingList(): void {
    this.ClinicalNotesMapping.ClinicalNotesMappingValidator.get('FieldId').setValue('');
    let selectedParentId = this.ClinicalNotesMapping.ClinicalNotesMappingValidator.get('ParentHeadingId').value;
    if (selectedParentId) {
      let parseSelectedParentId = +selectedParentId;
      this.FilterChildHeadings = this.ChildHeadingsList.filter(a => a.ParentId === parseSelectedParentId);
    }

  }


  FilterFieldList(): ClinicalFieldList_DTO[] {
    if (!this.SearchQuery) {
      return this.FieldList;
    }

    const searchLower = this.SearchQuery.toLowerCase();

    return this.FieldList.filter(field =>
      (field.FieldName && field.FieldName.toLowerCase().includes(searchLower))
    );
  }

  /**
     * @summary Handles the selection of a section and updates the medical components.
     * @param event - The change event triggered by selecting a section.
     */
  async OnSectionSelected(event: Event): Promise<void> {
    this.ClinicalNotesMapping.ClinicalNotesMappingValidator.get('FieldId').setValue('');
    const selectElement = event.target as HTMLSelectElement;
    const selectedId = selectElement.value;

    const selectedSection = this.FilterChildHeadings.find(
      heading => heading.ClinicalHeadingId.toString() === selectedId
    );

    if (selectedSection) {
      await this.GetClinicalFields(selectedSection.ClinicalHeadingId);
      if (this.ClinicalFields && this.ClinicalFields.length > 0) {
        this.FilteredMedicalComponents = this.ClinicalFields.filter(
          field => field.ClinicalHeadingId === selectedSection.ClinicalHeadingId
        );
      }
    }
    else {
      this.FilteredMedicalComponents = this.ClinicalFields;
    }
  }
  GetClinicalFields(SelectedClinicalHeadingId: number): Promise<void> {
    return new Promise((resolve) => {
      this._clnSettingBLService.GetClinicalSectionMapping(SelectedClinicalHeadingId)
        .subscribe({
          next: (res: DanpheHTTPResponse) => {
            if (res.Status === ENUM_DanpheHTTPResponses.OK) {
              if (res.Results && res.Results.length > 0) {
                this.ClinicalFields = res.Results.filter(field => field.IsMapped);
              }
            }
            else {
              this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Notice, ["Clinical Field list is empty"]);
            }
            resolve();
          },
          error: (err) => {
            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ['Failed to get clinical fields, check log for details']);
            console.error(err);
            resolve();
          }
        });
    });
  }

  Close() {
    this.FieldList = [];
    this.ClinicalNotesMapping = new (ClinicalNotesMapping_DTO);
    this.GetDepartmentList();
    this.GetEmployeeList();
    this.ShowMapping = false;
    this.CallbackAdd.emit({ action: "close", data: null });

  }

  ResetFilters(): void {
    this.ClinicalNotesMapping.ClinicalNotesMappingValidator.patchValue({
      ParentHeadingId: '',
      ClinicalHeadingId: '',
      FieldId: ''
    });
    this.FilterChildHeadings = [];
    this.FilteredMedicalComponents = [];
    this.LoadClinicalNotesMapping();

  }


  /**
 * @summary Loads clinical notes mappings based on the selected employee, department, and clinical notes master ID.
 *
 * @description
 * This method sets `ShowMapping` to `true` and makes an HTTP request to fetch clinical notes mappings using the selected employee ID, department ID, and clinical notes master ID.
 * It processes the response to update the `FieldList` with the fetched mappings, assigns display sequences if not already set, and maps the `FieldList` to `MedicalComponentList`.
 * It also handles cases where no data is found or where the request fails by displaying appropriate messages.
 *
 * @param {number} selectedEmployeeId - The ID of the employee for whom clinical notes mappings are to be fetched.
 * @param {number} selectedDepartmentId - The ID of the department associated with the clinical notes mappings.
 * @param {number} selectedClinicalNotesMasterId - The ID of the clinical notes master record used to fetch mappings.
 *
 */
  LoadClinicalNotesMapping(): void {
    this.IsProceedClicked = true;
    this.ShowMapping = true;
    const selectedFieldData = this.ClinicalNotesMapping.ClinicalNotesMappingValidator.value;
    const selectedEmployeeId = +selectedFieldData.EmployeeId;
    const selectedDepartmentId = +selectedFieldData.DepartmentId;
    const selectedClinicalNotesMasterId = this.ClinicalNotes.ClinicalNotesMasterId;
    const ChildHeadingId = null;
    const ParentHeadingId = null;
    this._clnSettingBLService.LoadClinicalNotesMapping(selectedEmployeeId, selectedDepartmentId, selectedClinicalNotesMasterId, ChildHeadingId, ParentHeadingId)
      .subscribe({
        next: (res: DanpheHTTPResponse) => {
          if (res.Status === ENUM_DanpheHTTPResponses.OK) {
            if (res.Results && res.Results.length) {
              this.changeDetector.detectChanges();
              this.FieldList = res.Results;
              this.SelectAllComponent = this.CheckIfAllFieldsActive();
              if (this.FieldList && this.FieldList.length > 0) {
                this.FieldList.forEach((field, index) => {
                  if (!field.DisplaySequence || isNaN(field.DisplaySequence)) {
                    field.DisplaySequence = index + 1;
                  }
                });
              }
              this.ClinicalNotesMapping.FieldList = [...this.FieldList];

            }
            else {
              this.FieldList = [];
              this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Notice, ["There is no Any Associated Clinical Notes Mappings"]);
            }
          }
          else {
            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ['Failed to get clinical notes mappings, check log for details']);
          }
        }
      });
  }
  /**
 * @summary Filters and loads medical components based on selected criteria.
 * @param {number} selectedFieldData.EmployeeId - The ID of the employee used for filtering the medical components.
 * @param {number} selectedFieldData.DepartmentId - The ID of the department used for filtering the medical components.
 * @param {number} this.ClinicalNotes.ClinicalNotesMasterId - The ID of the clinical notes master record used for filtering.
 * @param {number} selectedFieldData.ParentHeadingId - The ID of the parent heading used for filtering the medical components.
 * @param {number} selectedFieldData.ClinicalHeadingId - The ID of the clinical heading used for filtering the medical components.
 * @param {number} selectedFieldData.FieldId - The ID of the field used for filtering the medical components.
 *  */
  FilterMedicalComponents(): void {
    let selectedFieldData = this.ClinicalNotesMapping.ClinicalNotesMappingValidator.value;
    this._clnSettingBLService.GetFilteredMedicalComponentList(
      selectedFieldData.EmployeeId,
      selectedFieldData.DepartmentId,
      this.ClinicalNotes.ClinicalNotesMasterId,
      selectedFieldData.ParentHeadingId,
      selectedFieldData.ClinicalHeadingId,
      selectedFieldData.FieldId
    ).subscribe({
      next: (res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          if (res.Results && res.Results.length) {
            this.FieldList = res.Results;
            if (this.FieldList && this.FieldList.length > 0) {
              this.FieldList.forEach((field, index) => {
                if (!field.DisplaySequence || isNaN(field.DisplaySequence)) {
                  field.DisplaySequence = index + 1;
                }
              });
            }
          }

          else {
            this.FieldList = [];

            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Notice, ["There is no Any Associated Clinical Notes Mappings"]);
          }
        }
        else {
          this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ['Failed to get filtered clinical notes mappings, check log for details']);
        }
      }
    });
  }

  /**
   * @summary Adds or updates clinical notes mappings.
   * */
  AddUpdateMedicalComponentMappings(): void {

    const invalidFields = this.FieldList.filter(
      (field) => field.DisplaySequence <= 0
    );

    if (invalidFields.length > 0) {
      this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, [
        'Please ensure Display Sequence is greater than 0.',
      ]);
      return;
    }

    for (let i in this.ClinicalNotesMapping.ClinicalNotesMappingValidator.controls) {
      this.ClinicalNotesMapping.ClinicalNotesMappingValidator.controls[i].markAsDirty();
      this.ClinicalNotesMapping.ClinicalNotesMappingValidator.controls[i].updateValueAndValidity();
    }

    if (this.ClinicalNotesMapping.IsValidCheck(undefined, undefined)) {
      if (this.FieldList && this.FieldList.length) {
        const employeeId = +this.ClinicalNotesMapping.ClinicalNotesMappingValidator.get('EmployeeId').value;
        const departmentId = +this.ClinicalNotesMapping.ClinicalNotesMappingValidator.get('DepartmentId').value;
        this.SelectedUserFieldsToMap.EmployeeId = employeeId === 0 ? null : employeeId;
        this.SelectedUserFieldsToMap.ClinicalNotesMasterId = this.ClinicalNotes.ClinicalNotesMasterId;
        this.SelectedUserFieldsToMap.DepartmentId = departmentId === 0 ? null : departmentId;
        const processedFieldList = this.FieldList.map(field => ({
          ...field,
          IsActive: field.IsActive !== undefined ? field.IsActive : false
        }));

        this.SelectedUserFieldsToMap.FieldList = processedFieldList;
      }
    }
    this._clnSettingBLService.ClinicalNotesMappings(this.SelectedUserFieldsToMap).subscribe({
      next: (res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Success, [
            "Clinical notes mappings Added or updated",
          ]);
          this.ResetFilters();
          this.ClinicalNotesMapping.ClinicalNotesMappingValidator.controls['SearchQuery'].setValue('');
          this.SearchQuery = '';
          this.FieldList = this.FilterFieldList();
          this.ClinicalNotesMapping.ClinicalNotesMappingValidator.get('SelectAllComponent').setValue(false);
          this.LoadClinicalNotesMapping();
        } else {
          this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, [
            "failed to and or update clinical notes mapping",
          ]);
        }
      }
    });
  }
  OnFieldMapping(selectedField: ClinicalFieldList_DTO) {
    if (this.ClinicalNotesMapping && this.ClinicalNotesMapping.FieldList && this.ClinicalNotesMapping.FieldList.length) {
      let fieldIndex = this.ClinicalNotesMapping.FieldList.findIndex(f => f.FieldId === selectedField.FieldId);
      if (fieldIndex !== -1) {
        this.ClinicalNotesMapping.FieldList[fieldIndex].IsActive = selectedField.IsActive;
        this.ClinicalNotesMapping.FieldList[fieldIndex].DisplaySequence = selectedField.DisplaySequence;

      }
    }
  }

  public SetFocusById(id: string) {
    window.setTimeout(function () {
      let elementToBeFocused = document.getElementById(id);
      if (elementToBeFocused) {
        elementToBeFocused.focus();
      }
    }, 200);
  }

  ValidateDisplaySequence(Value: number): boolean {
    return Value > 0;
  }

  public hotkeys(event: KeyboardEvent) {
    if (event.key === ENUM_EscapeKey.EscapeKey) {
      //this.ShowMedicalComponentPage = false;
      this.Close();
    }
  }

}
