import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CoreService } from '../../../core/shared/core.service';
import { DanpheHTTPResponse } from '../../../shared/common-models';
import { MessageboxService } from '../../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status } from '../../../shared/shared-enums';
import { GetOTMSTCheckList_DTO } from '../../shared/dto/get-ot-mst-checklist.dto';
import { OTCheckListInputType_DTO } from '../../shared/dto/ot-check-list-input-type.dto';
import { PostOTMSTCheckList_DTO } from '../../shared/dto/post-ot-mst-checklist.dto';
import { OTCheckListModel } from '../../shared/ot-checklist.model';
import { OTGridColumnSettings } from '../../shared/ot-grid-column-settings';
import { OperationTheatreBLService } from '../../shared/ot.bl.service';
import { OTService } from '../../shared/ot.service';

@Component({
  selector: 'ot-manage-checklist',
  templateUrl: './ot-manage-checklist.component.html',
  styleUrls: ['./ot-manage-checklist.component.css'],
  host: { '(window:keyup)': 'hotkeys($event)' }
})
export class ManageCheckListComponent implements OnInit {

  OTCheckListGridColumns = new Array<any>();
  OTGridColumns = new OTGridColumnSettings();
  OTCheckList = new OTCheckListModel();
  CurrentOTCheckList = new PostOTMSTCheckList_DTO();
  SelectedOTCheckList = new GetOTMSTCheckList_DTO();
  MSTCheckList = new Array<GetOTMSTCheckList_DTO>();
  IsCheckListUpdate: boolean = false;
  ShowAddLookUpPage: boolean = false;
  OTCheckListInputTypes = new Array<OTCheckListInputType_DTO>();
  CurrentLookUpList = new Array<string>();
  CurrentLookUp: string = null;
  LookUp: string = '';
  IsLookUpUpdate: boolean = false;
  LookUpIndex: number = null;
  @ViewChild('inputTypeDropdown') InputTypeDropdown: ElementRef;

  constructor(
    private _OTBlService: OperationTheatreBLService,
    private _messageBoxService: MessageboxService,
    public coreService: CoreService,
    private _otService: OTService
  ) {
    this.OTCheckListGridColumns = this.OTGridColumns.OTCheckList;
  }

  ngOnInit(): void {
    this.GetOTCheckListInputTypes();
    this.GetOTMSTCheckList();
    this.GoToFirstElement();
  }

  get OTCheckListFormControls() {
    return this.OTCheckList.OTCheckListValidator.controls;
  }
  get OTCheckListFormValue() {
    return this.OTCheckList.OTCheckListValidator.value;
  }

  hotkeys(event): void {
    if (event.keyCode === 27) {
      this.CloseAddLookUpPage();
    }
  }

  GoToFirstElement(): void {
    const nextElement = document.getElementById('id_txt_checklistname') as HTMLInputElement;
    if (nextElement) {
      nextElement.focus();
    }
  }

  GoToNextElement(event: KeyboardEvent, nextElementId: string): void {
    event.preventDefault(); //! Sanjeev, Prevent default behavior of Enter key
    const nextElement = document.getElementById(nextElementId) as HTMLInputElement;
    if (nextElement) {
      nextElement.focus();
    }
  }

  GetOTCheckListInputTypes(): void {
    this._OTBlService.GetOTCheckListInputTypes()
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          if (res.Results && res.Results.length > 0) {
            this.OTCheckListInputTypes = res.Results;
          }
          else {
            this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`OTCheckListInputTypes is empty.`]);
          }
        }
      },
        (err: DanpheHTTPResponse) => {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Error : ${err.ErrorMessage}`]);
        });
  }

  GetOTMSTCheckList(): void {
    this._OTBlService.GetOTMSTCheckList()
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          if (res.Results && res.Results.length) {
            this.MSTCheckList = res.Results;
            this._otService.setOTMSTCheckList(this.MSTCheckList);
          }
          else {
            this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`CheckList is empty.`]);
          }
        }
      },
        (err: DanpheHTTPResponse) => {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Error : ${err.ErrorMessage}`]);
        });
  }

  OTCheckListGridActions($event): void {
    switch ($event.Action) {
      case "edit":
        {
          this.IsCheckListUpdate = true;
          this.SelectedOTCheckList = $event.Data;
          this.OTCheckListFormControls.CheckListName.setValue(this.SelectedOTCheckList.CheckListName);
          this.OTCheckListFormControls.DisplayName.setValue(this.SelectedOTCheckList.DisplayName);
          this.OTCheckListFormControls.InputType.setValue(this.SelectedOTCheckList.InputType);
          this.OTCheckListFormControls.DisplaySequence.setValue(this.SelectedOTCheckList.DisplaySequence);
          this.OTCheckListFormControls.IsActive.setValue(this.SelectedOTCheckList.IsActive);
          this.OTCheckListFormControls.IsMandatory.setValue(this.SelectedOTCheckList.IsMandatory);
          this.OTCheckListFormControls.LookUp.setValue(this.SelectedOTCheckList.LookUp);
        }
        break;

      case "add-lookup": {
        this.ShowAddLookUpPage = true;
        this.SelectedOTCheckList = $event.Data;
        if (this.SelectedOTCheckList.LookUp && this.SelectedOTCheckList.LookUp.trim() !== "") {
          let lookUpList = this.SelectedOTCheckList.LookUp.split(",");
          if (lookUpList.length > 0) {
            lookUpList.forEach(element => {
              this.CurrentLookUpList.push(element);
            });
          }
        }
        break;
      }

      default:
        break;
    }
  }

  HandleDropdownKeyEvents(event: KeyboardEvent, formControlId: string): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      const selectElement = this.InputTypeDropdown.nativeElement;
      if (selectElement.selectedIndex <= 0) {
        return;
      }
      setTimeout(() => {
        this.GoToNextElement(event, 'id_txt_display_sequence');
      }, 150);
    }
    else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
      const selectElement = this.InputTypeDropdown.nativeElement;
      const currentIndex = selectElement.selectedIndex;
      const newIndex = event.key === 'ArrowUp' ? currentIndex - 1 : currentIndex + 1;
      if (newIndex >= 0 && newIndex < selectElement.options.length) {
        selectElement.selectedIndex = newIndex;
      }
      const inputField = document.getElementById(formControlId) as HTMLInputElement;
      this.OTCheckListFormControls.InputType.setValue(inputField.value);
    }
  }

  OnCheckListInputTypeSelect($event): void {
    if ($event) {
      const inputType = $event.target.value;
      this.OTCheckList.InputType = inputType.trim();
    }
  }

  SaveOTCheckList(): void {
    if (this.OTCheckList.IsValidCheck(undefined, undefined)) {
      this.CurrentOTCheckList.ServiceItemId = this.OTCheckListFormValue.ServiceItemId;
      this.CurrentOTCheckList.CheckListName = this.OTCheckListFormValue.CheckListName.trim();
      this.CurrentOTCheckList.DisplayName = this.OTCheckListFormValue.DisplayName.trim();
      this.CurrentOTCheckList.InputType = this.OTCheckListFormValue.InputType;
      this.CurrentOTCheckList.IsMandatory = this.OTCheckListFormValue.IsMandatory;
      this.CurrentOTCheckList.DisplaySequence = this.OTCheckListFormValue.DisplaySequence;
      this.CurrentOTCheckList.IsActive = this.OTCheckListFormValue.IsActive;
      if (!this.IsCheckListUpdate) {
        this.AddOTMSTCheckList();
      } else {
        this.CurrentOTCheckList.CheckListId = this.SelectedOTCheckList.CheckListId;
        this.UpdateOTMSTCheckList();
      }
    }
    else {
      this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Please fill mandatory field.`]);
    }
  }

  AddOTMSTCheckList(): void {
    let isDuplicate = this.MSTCheckList.some((c) => c.CheckListName.toLowerCase() === this.CurrentOTCheckList.CheckListName.toLowerCase());
    if (isDuplicate) {
      this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`Duplicate CheckList.`]);
      return;
    }
    this._OTBlService.AddOTMSTCheckList(this.CurrentOTCheckList)
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this.OTCheckList = new OTCheckListModel();
          this.GetOTMSTCheckList();
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Success, [`New OT CheckList Added Successfully.`]);
        }
        else {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, [`Unable to Add OT CheckList.`]);
        }
      },
        (err: DanpheHTTPResponse) => {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Exception: ${err.ErrorMessage}`]);
        }
      );
  }

  UpdateOTMSTCheckList(): void {
    let isDuplicate = this.MSTCheckList.some((c) => c.CheckListName.toLowerCase() === this.CurrentOTCheckList.CheckListName.toLowerCase() && c.CheckListId !== this.CurrentOTCheckList.CheckListId);
    if (isDuplicate) {
      this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`Duplicate CheckList.`]);
      return;
    }
    this._OTBlService.UpdateOTMSTCheckList(this.CurrentOTCheckList)
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this.OTCheckList = new OTCheckListModel();
          this.GetOTMSTCheckList();
          this.IsCheckListUpdate = false;
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Success, [`OT CheckList Updated Successfully.`]);
        }
        else {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, [`Unable to Update OT CheckList.`]);
        }
      },
        (err: DanpheHTTPResponse) => {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Exception: ${err.ErrorMessage}`]);
        }
      );
  }

  ClearOTCheckListFormControls(): void {
    this.OTCheckList = new OTCheckListModel();
    this.SelectedOTCheckList = new GetOTMSTCheckList_DTO();
    this.IsCheckListUpdate = false;

  }

  CloseAddLookUpPage(): void {
    this.ShowAddLookUpPage = false;
    this.CurrentLookUpList = new Array<string>();
    this.CurrentLookUp = null;
    this.GetOTMSTCheckList();
  }

  AddLookUp(): void {
    if (this.CurrentLookUp && this.CurrentLookUp.trim().length > 0) {
      let isDuplicate = this.CurrentLookUpList.some((m, index) => {
        if (index !== this.LookUpIndex) {
          return m.toLowerCase() === this.CurrentLookUp.toLowerCase();
        }
        return false;
      });

      if (isDuplicate) {
        this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`Duplicate LookUp.`]);
        return;
      }

      if (!this.IsLookUpUpdate) {
        this.CurrentLookUpList.push(this.CurrentLookUp.trim());
        this.CurrentLookUp = null;
      } else {
        this.CurrentLookUpList[this.LookUpIndex] = this.CurrentLookUp.trim();
        this.IsLookUpUpdate = false;
      }

      this.CurrentLookUp = null;
    }
  }

  ClearLookUp(): void {
    this.CurrentLookUp = null;
    this.IsLookUpUpdate = false;
  }

  SaveLookUp(): void {
    if (this.CurrentLookUpList.length) {
      this.LookUp = this.CurrentLookUpList.join(',');
    }
    this._OTBlService.SaveLookUp(this.LookUp, this.SelectedOTCheckList.CheckListId)
      .finally(() => {
        this.LookUp = '';
      })
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this.CloseAddLookUpPage();
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Success, [`LookUp Added Successfully.`]);
        }
        else {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, [`Unable to Add LookUp.`]);
        }
      },
        (err: DanpheHTTPResponse) => {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Exception: ${err.ErrorMessage}`]);
        }
      );
  }

  EditLookUp(index: number): void {
    this.CurrentLookUp = this.CurrentLookUpList[index];
    this.LookUpIndex = index;
    this.IsLookUpUpdate = true;
  }
  DeleteLookUp(index: number): void {
    this.CurrentLookUpList.splice(index, 1);
    this.CurrentLookUp = null;
    this.IsLookUpUpdate = false;
  }

}
