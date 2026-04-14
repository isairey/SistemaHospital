import { ChangeDetectorRef, Component, EventEmitter, Input, Output, SimpleChanges } from "@angular/core";
import { CoreService } from "../../../../core/shared/core.service";
import { DanpheHTTPResponse } from "../../../../shared/common-models";
import { MessageboxService } from "../../../../shared/messagebox/messagebox.service";
import { ENUM_ClinicalHeading_HeadingType, ENUM_DanpheHTTPResponseText, ENUM_EscapeKey, ENUM_MessageBox_Status } from "../../../../shared/shared-enums";
import { ClinicalSettingsBLService } from "../../../shared/clinical-settings.bl.service";
import { ClinicalHeading_DTO, ParentHeading_DTO } from "../../../shared/dto/clinical-heading.dto";
import { DocumentInfo } from "../clinical-heading-setup-list.component";

@Component({
  selector: "update-clinical-heading",
  templateUrl: "./update-clinical-heading.component.html",
  host: { '(window:keydown)': 'hotkeys($event)' }
})
export class UpdateClinicalHeadingComponent {
  @Output("Callback-add")
  CallbackAdd: EventEmitter<Object> = new EventEmitter<Object>();
  @Output("Callback-addSection")
  CallbackAddSection: EventEmitter<Object> = new EventEmitter<Object>();

  @Output("Callback-close")
  CallbackClose: EventEmitter<Object> = new EventEmitter<Object>();

  @Input('cln-heading-to-edit')
  ClinicalHeading: ClinicalHeading_DTO = new ClinicalHeading_DTO();

  @Input('Update')
  Update: boolean = false;

  @Input('Show-Add-New-Page')
  ShowAddNewPage: boolean = false;

  @Input('ParentHeading-Names')
  ParentHeadingNames: ParentHeading_DTO[] = [];
  @Input('ShowDocumentSectionPage')
  ShowDocumentSectionPage: boolean = false;
  @Input('SectionParentId')
  SectionParentId: number = 0;
  @Input('SelectedSection')
  SelectedSection = new ClinicalHeading_DTO();
  @Input('Update-Section')
  UpdateSection: boolean = false;

  @Input('Heading-Info')
  HeadingInfo: DocumentInfo[] = new Array<DocumentInfo>();
  ClinicalHeadings = new ClinicalHeading_DTO();
  HeadingTypes = Object.values(ENUM_ClinicalHeading_HeadingType);
  SelectedHeadingType: string = null;
  ShowHeadingTypeName: boolean = false;
  TempParentId: number = 0;
  IsDocument: boolean = null;
  constructor(
    private _clnSetblService: ClinicalSettingsBLService,
    private _msgBoxServ: MessageboxService,
    public coreService: CoreService,
    private _changeDetectorRef: ChangeDetectorRef
  ) { }

  OnHeadingTypeChange(event: any, heading: string) {
    if (heading === ENUM_ClinicalHeading_HeadingType.Section) {
      this.IsDocument = false;
      this.ShowHeadingTypeName = event.target.checked;
      this.ShowHeadingTypeName = true;
      this.ClinicalHeadings.CLNHeadingValidator.controls['DisplayOrder'].reset();
      this.ClinicalHeadings.CLNHeadingValidator.controls['ParentId'].patchValue(this.TempParentId);
    }
    if (heading === ENUM_ClinicalHeading_HeadingType.Document) {
      this.IsDocument = true;
      this.ShowHeadingTypeName = false;
      this.ClinicalHeadings.CLNHeadingValidator.patchValue({
        ParentId: null
      });
      this.ClinicalHeadings.CLNHeadingValidator.controls['DisplayOrder'].reset();
    }

    if (event.target.checked) {
      this.SelectedHeadingType = heading;
      this.ClinicalHeadings.CLNHeadingValidator.patchValue({
        HeadingType: heading
      });
    } else {
      this.SelectedHeadingType = null;
      this.ClinicalHeadings.CLNHeadingValidator.patchValue({
        HeadingType: null

      });
    }
  }



  ngOnChanges(changes: SimpleChanges) {
    this.SelectedHeadingType = null;
    this.ShowHeadingTypeName = false;
    if (changes['ClinicalHeading'] && changes['ClinicalHeading'].currentValue) {
      this.SetValue();
    }

    if (this.ShowDocumentSectionPage) {
      this.SelectedHeadingType = ENUM_ClinicalHeading_HeadingType.Section;
      this.ShowHeadingTypeName = true;
      this.ClinicalHeadings.CLNHeadingValidator.controls['ParentId'].patchValue(this.SectionParentId);
    }
    if (this.ShowDocumentSectionPage && this.UpdateSection && this.SelectedSection) {
      this.SetValueForSection();
    }
    if ((this.ShowAddNewPage || this.ShowDocumentSectionPage) && !this.Update && !this.UpdateSection) {
      this.ClinicalHeadings.CLNHeadingValidator.controls['IsActive'].setValue(true);
    }
  }

  SetValueForSection() {
    if (this.SelectedSection && this.SelectedSection.ClinicalHeadingId !== 0) {
      this.ClinicalHeadings.CLNHeadingValidator.patchValue({
        ClinicalHeadingName: this.SelectedSection.ClinicalHeadingName,
        DisplayName: this.SelectedSection.DisplayName,
        DisplayOrder: this.SelectedSection.DisplayOrder,
        ParentId: this.SelectedSection.ParentId,
        IsDefault: this.SelectedSection.IsDefault,
        IsActive: this.SelectedSection.IsActive
      });
      this.IsDocument = false;

    }
  }

  Close() {
    this.ClinicalHeadings = new ClinicalHeading_DTO();
    this.CallbackAdd.emit({ action: "Close", data: null });
    this.CallbackAddSection.emit({ action: "Close", data: null });

  }

  /**
   * Method is useed for reset the value by defualt on pop-up form for user can fill multiple entries of default values.
   * @param clinicalHeading this parameter is used for to get the value from method AddClinicalHeading which send data in res.Results
   */
  ResetClinicalHeadingForm(clinicalHeading: any) {
    this.ClinicalHeadings = new ClinicalHeading_DTO();
    this.ClinicalHeadings.CLNHeadingValidator.controls['DisplayOrder'].setValue(clinicalHeading.DisplayOrder + 1);
    if (clinicalHeading.ParentId) {
      clinicalHeading.HeadingType = ENUM_ClinicalHeading_HeadingType.Section
    }
    if (clinicalHeading.HeadingType == ENUM_ClinicalHeading_HeadingType.Section) {
      this.ShowHeadingTypeName = true;
      this.ClinicalHeadings.CLNHeadingValidator.controls['ParentId'].patchValue(clinicalHeading.ParentId);
    } else {
      this.ShowHeadingTypeName = false;
      this.TempParentId = clinicalHeading.ClinicalHeadingId;
    }
  }
  UpdateHeadingTypeState(headingType: string) {
    if (headingType === ENUM_ClinicalHeading_HeadingType.Section) {
      this.ShowHeadingTypeName = true;
      this.SelectedHeadingType = ENUM_ClinicalHeading_HeadingType.Section;
      // this.IsDocument = false;
    } else if (headingType === ENUM_ClinicalHeading_HeadingType.Document) {
      this.ShowHeadingTypeName = false;
      this.SelectedHeadingType = ENUM_ClinicalHeading_HeadingType.Document;
      // this.IsDocument = true;
    } else {
      this.ShowHeadingTypeName = false;
      this.SelectedHeadingType = null;
    }
  }
  SetValue() {
    if (this.ClinicalHeading && this.ClinicalHeading.ClinicalHeadingId !== 0) {
      this.Update = true;
      if (this.ClinicalHeading.ParentId === null || this.ClinicalHeading.ParentId === 0) {
        this.IsDocument = true;
        this.ParentHeadingNames = [];
        this.ClinicalHeadings.CLNHeadingValidator.patchValue({
          ClinicalHeadingName: this.ClinicalHeading.ParentHeadingName,
          DisplayName: this.ClinicalHeading.DisplayName,
          DisplayOrder: this.ClinicalHeading.DisplayOrder,
          ParentId: this.ClinicalHeading.ParentId,
          IsDefault: this.ClinicalHeading.IsDefault
        });
      } else {
        this.ClinicalHeadings.CLNHeadingValidator.patchValue({
          ClinicalHeadingName: this.ClinicalHeading.ClinicalHeadingName,
          DisplayName: this.ClinicalHeading.DisplayName,
          DisplayOrder: this.ClinicalHeading.DisplayOrder,
          ParentId: this.ClinicalHeading.ParentId,
          IsDefault: this.ClinicalHeading.IsDefault
        });
      }
      this.UpdateHeadingTypeState(this.ClinicalHeading.HeadingType);

    }
  }

  UpdateClinicalHeading() {
    this.onDefaultChange(this.ClinicalHeadings.CLNHeadingValidator.get('IsDefault').value);
    if (this.IsDefaultAlreadyExists)
      return;
    for (var i in this.ClinicalHeadings.CLNHeadingValidator.controls) {
      this.ClinicalHeadings.CLNHeadingValidator.controls[i].markAsDirty();
      this.ClinicalHeadings.CLNHeadingValidator.controls[i].updateValueAndValidity();
    }
    if (this.ClinicalHeadings.IsValidCheck(undefined, undefined)) {
      let updatedValue = this.ClinicalHeadings.CLNHeadingValidator.value;
      if (!this.ShowDocumentSectionPage) {
        updatedValue.IsActive = true;
        updatedValue.ClinicalHeadingId = this.ClinicalHeading.ClinicalHeadingId;

      }
      if (this.SelectedSection && this.ShowDocumentSectionPage) {
        updatedValue.ClinicalHeadingId = this.SelectedSection.ClinicalHeadingId;
      }


      this._clnSetblService.UpdateClinicalHeading(updatedValue)
        .subscribe((res: DanpheHTTPResponse) => {
          if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
            this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Success, ["Clinical Heading Record Updated."]);
            if (this.ShowDocumentSectionPage) {
              this.CallbackAddSection.emit(updatedValue);
            } else {
              this.CallbackAdd.emit(updatedValue);
            }
            // this.ClinicalHeadings = new ClinicalHeading_DTO();
            // this.ShowHeadingTypeName = false;

          }
          else {
            this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, [res.ErrorMessage]);
            this.SetFocusById('ClinicalHeading_DTO');
          }
        });
    }
  }

  AddClinicalHeading() {
    this.onDefaultChange(this.ClinicalHeadings.CLNHeadingValidator.get('IsDefault').value);
    if (this.IsDefaultAlreadyExists)
      return;
    for (let i in this.ClinicalHeadings.CLNHeadingValidator.controls) {
      this.ClinicalHeadings.CLNHeadingValidator.controls[i].markAsDirty();
      this.ClinicalHeadings.CLNHeadingValidator.controls[
        i
      ].updateValueAndValidity();
    }

    if (this.ClinicalHeadings.IsValidCheck(undefined, undefined)) {
      let updatedValue = this.ClinicalHeadings.CLNHeadingValidator.value;
      if (!this.ShowDocumentSectionPage) {
        updatedValue.IsActive = true;
      }

      this._clnSetblService.AddClinicalHeading(updatedValue).subscribe(
        (res: DanpheHTTPResponse) => {
          if (res.Status === ENUM_DanpheHTTPResponseText.OK) {
            this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Success, [
              "Clinical Heading Added Successfully!",
            ]);
            if (res.Results.ParentId == null) {
              this.ParentHeadingNames.push({ ParentId: res.Results.ClinicalHeadingId, ParentHeadingName: res.Results.ClinicalHeadingName });
              this.SelectedHeadingType = ENUM_ClinicalHeading_HeadingType.Document;
              this.IsDocument = true;
              this._changeDetectorRef.detectChanges();
            } else {
              this.SelectedHeadingType = ENUM_ClinicalHeading_HeadingType.Section;
              this.IsDocument = false;
              this.ShowHeadingTypeName = true;
              this.ClinicalHeading.HeadingType = ENUM_ClinicalHeading_HeadingType.Section;
            }
            this.ClinicalHeading = res.Results;
            this.ResetClinicalHeadingForm(res.Results);
          } else {
            this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, [res.ErrorMessage]);
          }
        },
        (err) => {
          this.logError(err);
        }
      );
    } else {
      this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, [
        "some data are invalid.",
      ]);
    }
  }
  logError(err: any) {
    console.log(err);
  }


  public SetFocusById(id: string) {
    window.setTimeout(function () {
      let elementToBeFocused = document.getElementById(id);
      if (elementToBeFocused) {
        elementToBeFocused.focus();
      }
    }, 200);

  }
  //Esc key press then pop will close.
  public hotkeys(event: KeyboardEvent) {
    if (event.key === ENUM_EscapeKey.EscapeKey) {
      this.ShowAddNewPage = false;
      this.Close();
    }
  }
  IsDefaultAlreadyExists: boolean = false;

  onDefaultChange(newValue: boolean) {
    //check if document is being added or section
    if (newValue === true && Array.isArray(this.HeadingInfo)) {
      if (this.IsDocument) {
        let defaultHeading = this.HeadingInfo.find(doc => doc.IsDefault === true);
        if (defaultHeading && this.Update) {
          if (defaultHeading.HeadingId === this.ClinicalHeading.ClinicalHeadingId)
            defaultHeading = null;
        }

        if (defaultHeading)
          this.IsDefaultAlreadyExists = true;
        else
          this.IsDefaultAlreadyExists = false;

      } else {

        let documentId = +this.ClinicalHeadings.CLNHeadingValidator.get('ParentId').value;
        let selectedDocument = this.HeadingInfo.find(document => document.HeadingId === documentId);
        let defaultHeading = selectedDocument ? selectedDocument.Sections.find(section => section.IsDefault === true) : undefined;
        if (defaultHeading && this.UpdateSection) {
          if (defaultHeading.HeadingId === this.SelectedSection.ClinicalHeadingId)
            defaultHeading = null;
        }

        if (defaultHeading)
          this.IsDefaultAlreadyExists = true;
        else
          this.IsDefaultAlreadyExists = false;
      }
    }
    else {
      this.IsDefaultAlreadyExists = false;
    }

  }
}
