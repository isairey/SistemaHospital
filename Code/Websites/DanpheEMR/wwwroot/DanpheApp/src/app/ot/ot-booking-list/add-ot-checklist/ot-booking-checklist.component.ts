import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { DanpheHTTPResponse } from '../../../shared/common-models';
import { MessageboxService } from '../../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status, ENUM_OTChecklistFileFormats, ENUM_OT_CheckListInputType } from '../../../shared/shared-enums';
import { GetOTBookingDetails_DTO } from '../../shared/dto/get-ot-booking-details.dto';
import { GetOTCheckList_DTO } from '../../shared/dto/get-ot-checklist.dto';
import { GetOTMSTCheckList_DTO } from '../../shared/dto/get-ot-mst-checklist.dto';
import { PostOTCheckList_DTO } from '../../shared/dto/post-ot-checklist.dto';
import { UploadedFile_DTO } from '../../shared/dto/uploaded-file.dto';
import { OTGridColumnSettings } from '../../shared/ot-grid-column-settings';
import { OperationTheatreBLService } from '../../shared/ot.bl.service';

@Component({
  selector: 'ot-booking-checklist',
  templateUrl: './ot-booking-checklist.component.html',
  styleUrls: ['./ot-booking-checklist.component.css'],
  host: { '(window:keyup)': 'hotkeys($event)' }
})
export class OTBookingCheckListComponent implements OnInit {

  @ViewChild('inputField') inputField: ElementRef;
  @Input('ShowCheckListPage') ShowCheckListPage = false;
  @Output('CheckListCallBack') CheckListCallBackEmitter = new EventEmitter<boolean>();
  @Input('SelectedOTBooking') SelectedOTBooking = new GetOTBookingDetails_DTO();
  // @Input('OTBookingId') OTBookingId: number = 0;
  // @Input('SurgeryId') SurgeryId: number = 0;
  // @Input('PatientId') PatientId: number = 0;
  // @Input('PatientVisitId') PatientVisitId: number = 0;
  @Input('SurgeryName') SurgeryName: string = "";
  @Input('is-view-only') IsViewOnly: boolean = false;
  @Input("IsCancelled") IsCancelled: boolean = false;
  ActiveMSTCheckList = new Array<GetOTMSTCheckList_DTO>();
  AllMSTCheckList = new Array<GetOTMSTCheckList_DTO>();
  ShowAddCheckListPage = false;
  CheckListFormArray: FormArray;  // New FormArray for dynamic checklist items
  CheckListFormGroup: FormGroup = null;
  CheckListObject = new PostOTCheckList_DTO();
  CheckListInputType_SingleSelection = ENUM_OT_CheckListInputType.SingleSelection;
  CheckListInputType_MultipleSelection = ENUM_OT_CheckListInputType.MultipleSelection;
  CheckListInputType_File = ENUM_OT_CheckListInputType.File;
  CheckListInputType_ShortDescription = ENUM_OT_CheckListInputType.ShortDescription;
  CheckListInputType_LongDescription = ENUM_OT_CheckListInputType.LongDescription;
  UploadedFiles: Array<{ FileBase64Url: string; FileData: string }> = [];
  FileBase64Url: string = null;
  CheckList = new Array<GetOTCheckList_DTO>();
  CheckListOnGrid = new Array<GetOTCheckList_DTO>();
  IsUpdate: boolean = false;
  loading: boolean = false;
  CheckListControls: AbstractControl[];
  IsFileTypeValid: boolean = true;
  IsFileSizeValid: boolean = true;
  OTBookingCheckListListColumns = new Array<any>();
  OTGridColumns = new OTGridColumnSettings();
  fileSrc: any;
  ShowImageFilePreviewPopUp: boolean = false;
  SerializedFileData: string = null;
  FileName: string = null;
  ShowCheckListGrid: boolean = false;

  constructor(
    private fb: FormBuilder,
    private _OTBlService: OperationTheatreBLService,
    private _messageBoxService: MessageboxService,
    private sanitizer: DomSanitizer
  ) {
    this.CheckListFormGroup = fb.group({
      CheckLists: fb.array([])
    });
    this.CheckListControls = (this.CheckListFormGroup.get('CheckLists') as FormArray).controls;
    this.OTBookingCheckListListColumns = this.OTGridColumns.OTBookingCheckList;
  }

  ngOnInit(): void {
    this.InitializeCheckList();
  }

  get OTCheckListFormControls() {
    return this.CheckListFormGroup.controls;
  }
  get OTCheckListFormValue() {
    return this.CheckListFormGroup.value;
  }

  hotkeys(event): void {
    if (event.keyCode === 27) {
      if (this.ShowAddCheckListPage) {
        this.CloseCheckListPage();
      }
      else if (this.ShowImageFilePreviewPopUp) {
        this.CloseFilePreviewPopUp();
      }
    }
  }

  private async InitializeCheckList(): Promise<void> {
    try {
      await this.GetOTMSTCheckListBySurgeryId();
      this.AllMSTCheckList.forEach((item) => {
        const newItem: GetOTCheckList_DTO = {
          CheckListId: item.CheckListId,
          DisplayName: item.DisplayName,
          InputType: item.InputType,
          TXNChecklistId: null,
          OTBookingId: null,
          PatientId: null,
          PatientVisitId: null,
          CheckListValue: null,
          Remarks: null,
          CreatedBy: null,
          CreatedOn: null,
          ModifiedBy: null,
          ModifiedOn: null
        };
        this.CheckListOnGrid.push(newItem);
      });
      await this.GetCheckListByOTBookingIdAndSurgeryId();
      this.ActiveMSTCheckList.forEach(item => {
        this.CheckListFormArray = this.CheckListFormGroup.get('CheckLists') as FormArray;
        this.CheckListFormArray.push(this.fb.group({
          CheckListId: [item.CheckListId],
          CheckListValue: [],
          Remarks: [],
        }))
      });
      if (this.IsUpdate) {
        this.CheckList.forEach(element => {
          let checkList = this.ActiveMSTCheckList.find(e => e.CheckListId === element.CheckListId);
          if (checkList) {
            const checkListName = checkList.CheckListName;
            const formControlIndex = this.ActiveMSTCheckList.findIndex(item => item.CheckListName === checkListName);
            let control = this.CheckListFormArray.at(formControlIndex).get('CheckListValue');
            const remarksControl = this.CheckListFormArray.at(formControlIndex).get('Remarks');
            if (control) {
              if (checkList.InputType === ENUM_OT_CheckListInputType.File) {
                if (element.CheckListValue !== null) {
                  let fileData: UploadedFile_DTO = JSON.parse(element.CheckListValue);
                  this.FileBase64Url = fileData.BinaryData;
                  const tempFile = fileData.BinaryData.toString();
                  const index = tempFile.indexOf(',');
                  const binaryString = tempFile.substring(index + 1);
                  fileData.BinaryData = binaryString;
                  const serializedFileData = JSON.stringify(fileData);
                  this.UploadedFiles[formControlIndex] = {
                    FileBase64Url: this.FileBase64Url,
                    FileData: serializedFileData
                  };
                  control.setValue(serializedFileData);
                }
              }
              else {
                control.setValue(element.CheckListValue);
              }
            }
            if (remarksControl) {
              remarksControl.setValue(element.Remarks);
            }
          }
        });
      }
    } catch (err) {
      this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Error: ${err.ErrorMessage}`]);
    }
  }

  CloseCheckListPage(): void {
    this.ShowAddCheckListPage = false;
    this.GetCheckListByOTBookingIdAndSurgeryId();
  }

  async GetOTMSTCheckListBySurgeryId(): Promise<void> {
    try {
      const res: DanpheHTTPResponse = await this._OTBlService.GetOTMSTCheckListBySurgeryId(this.SelectedOTBooking.SurgeryId).toPromise();
      if (res.Status === ENUM_DanpheHTTPResponses.OK) {
        if (res.Results && res.Results.length > 0) {
          this.AllMSTCheckList = res.Results;
          this.ActiveMSTCheckList = res.Results;
          this.ActiveMSTCheckList = this.ActiveMSTCheckList.filter(o => o.IsActive);
          // this.MSTCheckList.sort((a, b) => a.DisplaySequence - b.DisplaySequence); //List is ordered at backend
          this.ActiveMSTCheckList.forEach(element => {
            if (element.LookUp && element.LookUp.trim() !== "") {
              let lookUpList = element.LookUp.split(",");
              if (lookUpList.length > 0) {
                element.LookUpList = lookUpList;
              }
            }
          });
        }
        else {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`Master CheckList is empty.`]);
        }
      }
      else {
        this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, [res.ErrorMessage]);
      }
    }
    catch (err) {
      throw new Error(err);
    }
  }

  async GetCheckListByOTBookingIdAndSurgeryId(): Promise<void> {
    try {
      this.ShowCheckListGrid = false;
      const res: DanpheHTTPResponse = await this._OTBlService.GetCheckListByOTBookingIdAndSurgeryId(this.SelectedOTBooking.OTBookingId, this.SelectedOTBooking.SurgeryId).toPromise();
      if (res.Status === ENUM_DanpheHTTPResponses.OK) {
        if (res.Results && res.Results.length) {
          this.CheckList = res.Results;
          // this.CheckListWithCheckListValue = this.CheckList.filter(checkList => checkList.CheckListValue);

          this.CheckList.forEach(checkList => {
            if (checkList) {
              let index = this.CheckListOnGrid.findIndex(item => item.CheckListId === checkList.CheckListId);
              if (index !== -1) {
                this.CheckListOnGrid[index] = checkList;
              }
            }
          });
          this.IsUpdate = true;
        }
        else {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`CheckList has not been updated.`]);
        }
      }
      else {
        this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, [res.ErrorMessage]);
      }
    }
    catch (err) {
      throw new Error(err);
    }
    finally {
      this.ShowCheckListGrid = true;
    }
  }

  SetValueToFormArray($event, formControlIndex: number): void {
    const data = $event.target.value.trim();
    const formArray = this.CheckListFormArray;
    const control = formArray.at(formControlIndex).get('CheckListValue');
    if (control) {
      control.setValue(data);
    }
  }

  SetRemarksToFormArray($event, formControlIndex: number): void {
    const data = $event.target.value.trim();
    const formArray = this.CheckListFormArray;
    const control = formArray.at(formControlIndex).get('Remarks');
    if (control) {
      control.setValue(data);
    }
  }

  OnSelect($event, lookupList: Array<string>, formControlId: string, formControlIndex: number): void {
    const data = $event.trim();
    const formArray = this.CheckListFormArray;
    const control = formArray.at(formControlIndex).get('CheckListValue');

    if (control) {
      let isDuplicate = false;
      const oldFormControlValue = control.value;
      if (oldFormControlValue) {
        const checkList = oldFormControlValue.split(',');
        isDuplicate = checkList.some(c => c.toLowerCase() === data.toLowerCase());
      }
      if (isDuplicate) {
        this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, ['Duplicate Item.']);
        this.ClearMultipleCheckListField(formControlId);
      } else {
        const matchedLookUp = lookupList.find(x => x.toLowerCase() === data.toLowerCase());
        if (matchedLookUp) {
          control.setValue(oldFormControlValue ? (oldFormControlValue + ',' + data) : data);
          this.ClearMultipleCheckListField(formControlId);
        }
      }
    }
  }

  RemoveItem(formControlName: string, formControlIndex: number, lookupIndex: number): void {
    const currentValues = this.CheckListFormArray.at(formControlIndex).get('CheckListValue').value.split(',');
    currentValues.splice(lookupIndex, 1);
    const newValue = currentValues.length > 0 ? currentValues.join(',') : null;
    this.CheckListFormArray.at(formControlIndex).get('CheckListValue').setValue(newValue);
  }

  ClearMultipleCheckListField(formControlId: string): void {
    const inputField = document.getElementById(formControlId) as HTMLInputElement;
    if (inputField) {
      inputField.value = null;
    }
  }

  SaveCheckList(): void {
    if (this.CheckListFormArray.valid) {
      const formArrayValues = this.CheckListFormArray.value;
      const CheckList: any[] = formArrayValues.map(control => {
        return {
          CheckListValue: control.CheckListValue,
          CheckListId: control.CheckListId,
          Remarks: control.Remarks,
        };
      });
      this.CheckListObject.CheckList = CheckList;
      this.CheckListObject.OTBookingId = this.SelectedOTBooking.OTBookingId;
      this.CheckListObject.PatientId = this.SelectedOTBooking.PatientId;
      this.CheckListObject.PatientVisitId = this.SelectedOTBooking.PatientVisitId;
      if (this.IsUpdate) {
        this.UpdateOTCheckList();
      }
      else {
        this.AddOTCheckList();
      }
    }
    else {
      // Handle the case when the form is not valid
      this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, ['Form is not valid.']);
    }
  }

  AddOTCheckList(): void {
    this.loading = true;
    this._OTBlService.AddOTCheckList(this.CheckListObject)
      .finally(() => {
        this.loading = false;
      })
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this.CloseCheckListPage();
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Success, [`CheckList Added Successfully.`]);
        }
        else {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, [`Unable to Add CheckList. Error : ${res.ErrorMessage}`]);
        }
      },
        (err: DanpheHTTPResponse) => {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Exception: ${err.ErrorMessage}`]);
        }
      );
  }

  UpdateOTCheckList(): void {
    this.loading = true;
    this._OTBlService.UpdateOTCheckList(this.CheckListObject)
      .finally(() => {
        this.loading = false;
      })
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this.CloseCheckListPage();
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Success, [`CheckList Updated Successfully.`]);
        }
        else {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, [`Unable to Update CheckList. Error : ${res.ErrorMessage}`]);
        }
      },
        (err: DanpheHTTPResponse) => {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Exception: ${err.ErrorMessage}`]);
        }
      );
  }

  //#region file upload

  RemoveFile(formControlIndex: number): void {
    this.UploadedFiles[formControlIndex] = null;
    this.CheckListFormArray.at(formControlIndex).get('CheckListValue').setValue(null);
  }


  OnFileUploaded(file: UploadedFile_DTO, formControlIndex: number): void {
    this.CheckFileValidation(file);
    if (!this.IsFileTypeValid || !this.IsFileSizeValid) {
      return;
    }
    const fileData = {
      FileName: file.FileName,
      Type: file.Type,
      BinaryData: file.BinaryData
    };
    this.SerializedFileData = JSON.stringify(fileData);
    this.FileBase64Url = `data:${file.Type};base64,${file.BinaryData}`;
    this.CheckListFormArray.at(formControlIndex).get('CheckListValue').setValue(this.SerializedFileData);
    // Store the file information in an array
    this.UploadedFiles[formControlIndex] = {
      FileBase64Url: this.FileBase64Url,
      FileData: this.SerializedFileData
    };
  }

  CheckFileValidation(file: UploadedFile_DTO): void {
    this.IsFileTypeValid = true;
    this.IsFileSizeValid = true;
    const acceptedImageTypes: string[] = ['image/jpeg', 'image/jpg', 'image/png'];
    const isImage: boolean = acceptedImageTypes.includes(file.Type);
    if (!isImage) {
      this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, ["Please ensure that only image files in the formats JPEG, JPG, and PNG are accepted."]);
      this.IsFileTypeValid = false;
    }
    if (file.Size > 3145728) {  // 3145728 bytes = 3 MB
      this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, ["Image must be less than 3 MB."]);
      this.IsFileSizeValid = false;
    }
  }

  //#endregion file upload

  EditCheckList(): void {
    this.ShowAddCheckListPage = true;
  }

  OTBookingCheckListGidActions(data): void {
    switch (data.Action) {
      case "preview":
        {
          let checkList = data.Data;
          this.PreviewFile(checkList.CheckListValue);
          break;
        }
    }
  }

  PreviewFile(serializedFileInfo: string): void {
    let fileData: UploadedFile_DTO = JSON.parse(serializedFileInfo);
    this.FileBase64Url = fileData.BinaryData;

    const tempFile = fileData.BinaryData.toString();
    const base64Data = tempFile.split(',')[1];

    if (base64Data) {
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);

      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const blob = new Blob([bytes], { type: fileData.Type });
      this.fileSrc = this.sanitizer.bypassSecurityTrustResourceUrl(URL.createObjectURL(blob));
      this.FileName = fileData.FileName;
      if (fileData.Type === ENUM_OTChecklistFileFormats.jpegImage ||
        fileData.Type === ENUM_OTChecklistFileFormats.jpgImage ||
        fileData.Type === ENUM_OTChecklistFileFormats.pngImage) {
        this.ShowImageFilePreviewPopUp = true;
      }
    }
  }

  CloseFilePreviewPopUp(): void {
    this.ShowImageFilePreviewPopUp = false;
  }

}
