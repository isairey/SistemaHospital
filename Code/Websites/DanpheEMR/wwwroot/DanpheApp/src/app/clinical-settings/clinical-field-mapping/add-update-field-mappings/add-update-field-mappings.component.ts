import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DanpheHTTPResponse } from '../../../shared/common-models';
import { MessageboxService } from '../../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponseText, ENUM_DanpheHTTPResponses, ENUM_EscapeKey, ENUM_MappingType, ENUM_MessageBox_Status } from '../../../shared/shared-enums';
import { ClinicalSettingsBLService } from '../../shared/clinical-settings.bl.service';
import { AddUpdateClinicalUserFieldMappingsDTO } from '../../shared/dto/add-update-userfield-mapping.dto';
import { ClinicalHeading_DTO } from '../../shared/dto/clinical-heading.dto';
import { DepartmentList_DTO } from '../../shared/dto/department-list.dto';
import { EmployeeListDTO } from '../../shared/dto/employee-list.dto';
import { ClinicalUserFieldList_DTO } from '../../shared/dto/field-list-view.dto';
import { ClinicalUserFieldMappingsDTO } from '../../shared/dto/user-field-mapping_dto';
@Component({
  selector: 'add-update-field-mappings',
  templateUrl: './add-update-field-mappings.component.html',
  host: { '(window:keydown)': 'hotkeys($event)' }
})
export class AddUpdateFieldMappingsComponent {

  @Input('show-update-UserMapping-Page')
  Update: boolean = false;
  @Input('update-cln-User-mappings')
  SelectedClinicalUserFieldMapping = new ClinicalUserFieldMappingsDTO();
  @Output("callback-add")
  CallbackAdd = new EventEmitter<Object>();

  @Output("callback-close")
  CallbackClose = new EventEmitter<object>();

  DepartmentList = new Array<DepartmentList_DTO>();
  EmployeeList = new Array<EmployeeListDTO>();
  FilteredEmployeeList = new Array<EmployeeListDTO>();
  FilteredDepartmentList = new Array<DepartmentList_DTO>();
  ClinicalUserFieldMapping = new ClinicalUserFieldMappingsDTO();
  ParentHeadingsList = new Array<ClinicalHeading_DTO>();
  FilterChildHeadings = new Array<ClinicalHeading_DTO>();
  ChildHeadingsList = new Array<ClinicalHeading_DTO>();
  SelectedUserFieldsToMap = new AddUpdateClinicalUserFieldMappingsDTO();
  FieldList = new Array<ClinicalUserFieldList_DTO>();
  ShowComponent: boolean = false;
  SelectAllComponent: boolean = false;
  MappingLabel: string;
  constructor(
    private _msgBoxService: MessageboxService,
    private _clnSettingBLService: ClinicalSettingsBLService
  ) {
    this.GetEmployeeList();
    this.GetDepartmentList();
    this.GetParentHeadings();
    this.GetAllChildHeadings();
  }
  ngOnInit() {
    if (this.SelectedClinicalUserFieldMapping.ClinicalHeadingId) {
      this.PatchSelectedClinicalUserFieldMapping();
    } else {
      this.SelectedClinicalUserFieldMapping = new ClinicalUserFieldMappingsDTO();
    }

  }
  GetDepartmentList() {
    this._clnSettingBLService.GetDepartmentList()
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this.DepartmentList = res.Results;
          this.FilteredDepartmentList = this.DepartmentList;
        }
      });
  }
  GetEmployeeList() {
    this._clnSettingBLService.GetEmployeeList()
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this.EmployeeList = res.Results;
          this.FilteredEmployeeList = this.EmployeeList;
        }
      });
  }
  FilterEmployeeList() {
    this.ClinicalUserFieldMapping.ClnFieldMappingsGroup.get('EmployeeId').reset();
    const selectedDepartmentId = this.ClinicalUserFieldMapping.ClnFieldMappingsGroup.get('DepartmentId').value;
    if (selectedDepartmentId !== null && selectedDepartmentId !== undefined && !isNaN(selectedDepartmentId)) {
      const parsedDepartmentId = +selectedDepartmentId;
      if (this.EmployeeList && this.EmployeeList.length) {
        this.FilteredEmployeeList = this.EmployeeList.filter(employee => employee.DepartmentId === parsedDepartmentId);
      }
    } else {
      this.FilteredEmployeeList = this.EmployeeList;
    }
    this.GetMappingLabel();
  }
  AssignDepartment() {
    let selectedDepartmentId = this.ClinicalUserFieldMapping.ClnFieldMappingsGroup.get('DepartmentId').value;
    let selectEmployeeId = this.ClinicalUserFieldMapping.ClnFieldMappingsGroup.get('EmployeeId').value;
    if (selectEmployeeId && !selectedDepartmentId) {
      const parsedEmployeeId = +selectEmployeeId;
      let selectedEmployee = this.FilteredEmployeeList.find(a => a.EmployeeId === parsedEmployeeId);
      if (selectedEmployee) {
        this.ClinicalUserFieldMapping.ClnFieldMappingsGroup.patchValue({
          DepartmentId: selectedEmployee.DepartmentId
        });
      }
    }
    else {
      this.FilteredDepartmentList = this.DepartmentList;
    }
  }

  FilterChildHeadingList() {
    let selectedParentId = this.ClinicalUserFieldMapping.ClnFieldMappingsGroup.get('ParentHeadingId').value;
    if (selectedParentId) {
      let parseSelectedParentId = +selectedParentId;
      this.FilterChildHeadings = this.ChildHeadingsList.filter(a => a.ParentId === parseSelectedParentId);
      if (this.FilterChildHeadings.length === 0) {
        this.ClinicalUserFieldMapping.ClnFieldMappingsGroup.get('ClinicalHeadingId').setValue(null);
      }
      else {
        this.ClinicalUserFieldMapping.ClnFieldMappingsGroup.get('ClinicalHeadingId').setValue(this.FilterChildHeadings[0].ClinicalHeadingId);
      }
    }
    else {
      this.FilterChildHeadings = this.ChildHeadingsList;

    }

  }
  GetParentHeadings() {
    this._clnSettingBLService.GetClinicalParentHeadings()
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this.ParentHeadingsList = res.Results;
        }
      });
  }
  GetAllChildHeadings() {
    this._clnSettingBLService.GetAllChildClinicalHeadings()
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this.ChildHeadingsList = res.Results;
          this.FilterChildHeadings = this.ChildHeadingsList;
        }
      });
  }
  LoadFields() {
    let selectedFieldData = this.ClinicalUserFieldMapping.ClnFieldMappingsGroup.value;
    let selectedEmployeeId = +selectedFieldData.EmployeeId;
    let selectedDepartmentId = +selectedFieldData.DepartmentId;
    let selectedClinicalHeadingId = selectedFieldData.ClinicalHeadingId ? +selectedFieldData.ClinicalHeadingId : +selectedFieldData.ParentHeadingId;
    let childHeadingId = selectedFieldData.ClinicalHeadingId ? +selectedFieldData.ClinicalHeadingId : null;
    let parentHeadingId = selectedFieldData.ParentHeadingId ? +selectedFieldData.ParentHeadingId : null;
    if (!this.Update) {
      this.SelectedClinicalUserFieldMapping.ClnFieldMappingsGroup.patchValue({
        DepartmentId: selectedDepartmentId,
        EmployeeId: selectedEmployeeId,
        ParentHeadingId: parentHeadingId,
        ClinicalHeadingId: childHeadingId,
      });
    }
    this._clnSettingBLService.LoadFields(selectedEmployeeId, selectedDepartmentId, selectedClinicalHeadingId)
      .subscribe({
        next: (res: DanpheHTTPResponse) => {
          if (res.Status === ENUM_DanpheHTTPResponses.OK) {
            this.SelectedClinicalUserFieldMapping.FieldList = new Array<ClinicalUserFieldList_DTO>();
            if (res.Results && res.Results.length) {
              this.FieldList = res.Results;
              this.FieldList.forEach(element => {
                let field = new ClinicalUserFieldList_DTO();
                field.IsActive = element.IsActive;
                field.FieldId = element.FieldId;
                field.ClinicalUserFieldId = element.ClinicalUserFieldId;
                field.FieldName = element.FieldName;
                field.DisplaySequence = element.DisplaySequence;
                this.SelectedClinicalUserFieldMapping.FieldList.push(field);
              });
              this.ShowComponent = true;
              this.MappingLabel = this.GetMappingLabel();
              this.SelectAllComponent = this.CheckIfAllFieldsActive();

            }
            else {
              this._msgBoxService.showMessage(ENUM_MessageBox_Status.Notice, ["There is no Any Associated Medical Components"]);
              this.FieldList = new Array<ClinicalUserFieldList_DTO>();
            }

          } else {
            this._msgBoxService.showMessage(ENUM_MessageBox_Status.Error, ["Failed to load Medical Components"]);
            console.error("Failed to load fields:", res.Status);
          }
        },
        error: (error) => {
          this._msgBoxService.showMessage(ENUM_MessageBox_Status.Error, ["An error occurred while loading fields. Check the console"]);
          console.error("An error occurred while loading Medical Components:", error);
        }
      });
  }
  CheckIfAllFieldsActive(): boolean {
    return this.FieldList.every(field => field.IsActive);
  }
  ClearFieldMappingForm() {
    this.ClinicalUserFieldMapping.ClnFieldMappingsGroup.reset();
  }

  AddUserFieldMappings() {
    for (let i in this.ClinicalUserFieldMapping.ClnFieldMappingsGroup.controls) {
      this.ClinicalUserFieldMapping.ClnFieldMappingsGroup.controls[i].markAsDirty();
      this.ClinicalUserFieldMapping.ClnFieldMappingsGroup.controls[i].updateValueAndValidity();
    }

    if (this.ClinicalUserFieldMapping.IsValidCheck(undefined, undefined)) {
      if (this.FieldList && this.FieldList.length) {
        if (!this.Update) {
          let employeeId = +this.SelectedClinicalUserFieldMapping.ClnFieldMappingsGroup.get('EmployeeId').value;
          let departmentId = +this.SelectedClinicalUserFieldMapping.ClnFieldMappingsGroup.get('DepartmentId').value;
          this.SelectedUserFieldsToMap.EmployeeId = employeeId === 0 ? null : employeeId;
          this.SelectedUserFieldsToMap.DepartmentId = departmentId === 0 ? null : departmentId;
          this.SelectedUserFieldsToMap.FieldList = new Array<ClinicalUserFieldList_DTO>();
          this.SelectedUserFieldsToMap.FieldList = [... this.SelectedClinicalUserFieldMapping.FieldList];
          if (this.SelectedClinicalUserFieldMapping.ClnFieldMappingsGroup.get('ParentHeadingId').value && this.SelectedClinicalUserFieldMapping.ClnFieldMappingsGroup.get('ClinicalHeadingId').value) {
            this.SelectedUserFieldsToMap.ClinicalHeadingId = +this.SelectedClinicalUserFieldMapping.ClnFieldMappingsGroup.get('ClinicalHeadingId').value;
          }
          else {
            this.SelectedClinicalUserFieldMapping.ClinicalHeadingId = +this.SelectedClinicalUserFieldMapping.ClnFieldMappingsGroup.get('ParentHeadingId').value;
          }
        }
        else {
          this.SelectedUserFieldsToMap.EmployeeId = this.SelectedClinicalUserFieldMapping.EmployeeId == 0 ? null : this.SelectedClinicalUserFieldMapping.EmployeeId;
          this.SelectedUserFieldsToMap.DepartmentId = this.SelectedClinicalUserFieldMapping.DepartmentId == 0 ? null : this.SelectedClinicalUserFieldMapping.DepartmentId;
          this.SelectedUserFieldsToMap.FieldList = [... this.SelectedClinicalUserFieldMapping.FieldList];
          if (this.SelectedClinicalUserFieldMapping.ParentHeadingId && this.SelectedClinicalUserFieldMapping.ClinicalHeadingId) {
            this.SelectedUserFieldsToMap.ClinicalHeadingId = this.SelectedClinicalUserFieldMapping.ClinicalHeadingId;
          }
          else {
            this.SelectedClinicalUserFieldMapping.ClinicalHeadingId = this.SelectedClinicalUserFieldMapping.ParentHeadingId;
          }

        }

        this._clnSettingBLService.AddUpdateUserFieldMappings(this.SelectedUserFieldsToMap)
          .subscribe((res: DanpheHTTPResponse) => {
            if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
              this.CallBackAddFieldMapping(res);
              let Section = this.ClinicalUserFieldMapping.ClnFieldMappingsGroup.value;
              if (!Section.ClinicalHeadingId) {
                this.ShowComponent = false;
              }
              this._msgBoxService.showMessage(ENUM_MessageBox_Status.Success, ["User Medical Component Mappings Updated successfully."]);
            }
            else {
              this._msgBoxService.showMessage(ENUM_DanpheHTTPResponses.Failed, [res.ErrorMessage]);
            }
          });
      }
      else {
        this._msgBoxService.showMessage(ENUM_MessageBox_Status.Notice, ["There is no Any Associated Medical Component for user mappings"]);
      }
    } else {
      this._msgBoxService.showMessage(ENUM_MessageBox_Status.Failed, ["Please fill mandatory fields."]);
    }
  }
  Close() {
    this.ClinicalUserFieldMapping = new (ClinicalUserFieldMappingsDTO);
    this.CallbackClose.emit({ action: "close", data: null });
    this.Update = false;
  }

  public hotkeys(event: KeyboardEvent) {
    if (event.key === ENUM_EscapeKey.EscapeKey) {
      this.ClinicalUserFieldMapping = new (ClinicalUserFieldMappingsDTO);
      this.CallbackClose.emit({ action: "close", data: null });
      this.Update = false;
    }
  }
  CallBackAddFieldMapping(res) {  //this method shoul be called after the add and update respose is getting sucessfull.
    if (res.Status === ENUM_DanpheHTTPResponses.OK && res.Results) {
      this.CallbackAdd.emit({ SelectedClinicalUserFieldMapping: res.Results });
      this.ClinicalUserFieldMapping.ClnFieldMappingsGroup.controls['ClinicalHeadingId'].setValue('');
      if (this.Update) {
        this.Close();
      }
    }
    else {
      this._msgBoxService.showMessage(ENUM_MessageBox_Status.Error, ["Check log for details"]);
      console.log(res.ErrorMessage);
    }
  }
  SetFocusById(id: string) {
    window.setTimeout(function () {
      let elementToBeFocused = document.getElementById(id);
      if (elementToBeFocused) {
        elementToBeFocused.focus();
      }
    }, 200);
  }
  PatchSelectedClinicalUserFieldMapping() {
    this.ClinicalUserFieldMapping.ClnFieldMappingsGroup.patchValue({
      DepartmentId: this.SelectedClinicalUserFieldMapping.DepartmentId,
      EmployeeId: this.SelectedClinicalUserFieldMapping.EmployeeId,
      ParentHeadingId: this.SelectedClinicalUserFieldMapping.ParentHeadingId,
      ClinicalHeadingId: this.SelectedClinicalUserFieldMapping.ClinicalHeadingId,
    });
  }


  OnFieldMapping(selectedField: ClinicalUserFieldList_DTO) {
    let fieldIndex = -1;

    if (this.SelectedClinicalUserFieldMapping
      && this.SelectedClinicalUserFieldMapping.FieldList) {
      fieldIndex = this.SelectedClinicalUserFieldMapping.FieldList.findIndex(
        f => f.FieldId === selectedField.FieldId
      );
    }
    if (fieldIndex !== -1) {
      this.SelectedClinicalUserFieldMapping.FieldList[fieldIndex].IsActive = selectedField.IsActive;
    }
    this.SelectAllComponent = this.CheckIfAllFieldsActive();
  }
  OnSectionSelected(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const selectedId = selectElement.value;
    const selectedSection = this.FilterChildHeadings.find(
      heading => heading.ClinicalHeadingId.toString() === selectedId
    );
    if (selectedSection) {
      const filteredDocument = this.ParentHeadingsList.find(a => a.ClinicalHeadingId === selectedSection.ParentId);
      if (filteredDocument) {
        this.ClinicalUserFieldMapping.ClnFieldMappingsGroup.get('ParentHeadingId').patchValue(filteredDocument.ClinicalHeadingId);
      }
    }
  }

  ChangeAllCheckbox() {
    this.FieldList.forEach(field => field.IsActive = this.SelectAllComponent);

    if (this.SelectedClinicalUserFieldMapping && this.SelectedClinicalUserFieldMapping.FieldList) {
      this.SelectedClinicalUserFieldMapping.FieldList.forEach(field => {
        const matchingField = this.FieldList.find(f => f.FieldId === field.FieldId);
        if (matchingField) field.IsActive = this.SelectAllComponent;
      });
    }
  }

  GetMappingLabel(): string {
    const selectedDepartmentId = this.ClinicalUserFieldMapping.ClnFieldMappingsGroup.get('DepartmentId').value;
    const selectedEmployeeId = this.ClinicalUserFieldMapping.ClnFieldMappingsGroup.get('EmployeeId').value;


    if (selectedDepartmentId && !selectedEmployeeId) {
      const selectedDepartment = this.DepartmentList.find(dep => dep.DepartmentId === +selectedDepartmentId);
      return selectedDepartment ? `${ENUM_MappingType.DepartmentLevel} (${selectedDepartment.DepartmentName})` : ENUM_MappingType.DepartmentLevel;
    }


    if (selectedEmployeeId) {
      const selectedEmployee = this.EmployeeList.find(emp => emp.EmployeeId === +selectedEmployeeId);
      return selectedEmployee ? `${ENUM_MappingType.UserLevel} (${selectedEmployee.EmployeeName})` : ENUM_MappingType.UserLevel;
    }


    return ENUM_MappingType.Default;

  }


}






