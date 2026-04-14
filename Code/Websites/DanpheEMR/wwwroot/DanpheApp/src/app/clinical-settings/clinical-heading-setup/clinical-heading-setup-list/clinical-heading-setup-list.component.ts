import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CoreService } from "../../../core/shared/core.service";
import { SecurityService } from '../../../security/shared/security.service';

import { DanpheHTTPResponse } from '../../../shared/common-models';
import { GridEmitModel } from '../../../shared/danphe-grid/grid-emit.model';
import { SettingsGridColumnSettings } from '../../../shared/danphe-grid/settings-grid-column-settings';
import { MessageboxService } from '../../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status } from '../../../shared/shared-enums';
import { ClinicalSettingsBLService } from '../../shared/clinical-settings.bl.service';
import { ClinicalFieldsList_DTO, ClinicalHeadingSectionMapping_DTO } from '../../shared/dto/clinical-heading-section-mapping.dto';
import { ClinicalHeading_DTO, ParentHeading_DTO } from '../../shared/dto/clinical-heading.dto';

@Component({
  selector: 'app-clinical-heading-setup-list',
  templateUrl: './clinical-heading-setup-list.component.html',
  styleUrls: ['./clinical-heading-setup-list.component.css']
})
export class ClinicalHeadingSetupListComponent implements OnInit {
  ShowGrid: boolean = false;
  SetCLNHeadingGridColumns: SettingsGridColumnSettings = null;
  ClinicalHeadingGridColumns: typeof SettingsGridColumnSettings.prototype.ClinicalHeadingList;
  CLNHeadingToEdit = new ClinicalHeading_DTO();
  SelectedItem = new ClinicalHeading_DTO();
  Update: boolean = false;
  IsSaveClicked: boolean = false;
  ShowAddNewPage: boolean = false;
  ClinicalHeading = new ClinicalHeading_DTO();
  CLNHeadingList = new Array<ClinicalHeading_DTO>();
  HeadingListForGrid = new Array<ClinicalHeading_DTO>();
  ParentHeadingNames: ParentHeading_DTO[] = [];
  ManageSectionMapping = new ClinicalHeading_DTO();
  ShowSectionMapping: boolean = false;
  FieldList = new Array<ClinicalFieldsList_DTO>();
  ClinicalFieldList = new Array<ClinicalFieldsList_DTO>();
  FilteredSections: ClinicalHeading_DTO[] = [];
  ClinicalSection = new ClinicalHeading_DTO();
  ClinicalHeadingId: number = 0;
  ShowDocumentSectionPage: boolean = false;
  UpdateSection: boolean = false;
  SelectedSection = new ClinicalHeading_DTO();
  SectionParentId: number = 0;
  IsSectionSelected: boolean = false;
  SelectedSectionFieldsToMap = new ClinicalHeadingSectionMapping_DTO();
  ShowSectionDiv: boolean = false;
  UniqueInputTypes: string[] = [];
  UniqueGroupNames: string[] = [];
  SelectedInputType: string = '';
  SelectedGroupName: string = '';
  FilterTerm: string = '';
  constructor(public _clnSetblService: ClinicalSettingsBLService,
    private msgBoxServ: MessageboxService,
    public coreService: CoreService,
    public securityService: SecurityService,
    public changeDetector: ChangeDetectorRef
  ) {
    this.SetCLNHeadingGridColumns = new SettingsGridColumnSettings(this.coreService.taxLabel, this.securityService);
    this.ClinicalHeadingGridColumns = this.SetCLNHeadingGridColumns.ClinicalHeadingList;
  }
  ngOnInit(): void {
    this.GetClinicalHeadingData();

  }

  GetClinicalHeadingFieldSetup() {
    this._clnSetblService.GetClinicalHeadingFieldSetup().subscribe(res => {
      if (res.Status === ENUM_DanpheHTTPResponses.OK) {
        if (res.Results && res.Results.length) {
          this.ClinicalFieldList = res.Results;
          this.FieldList = res.Results.filter(record => record.IsActive);
          if (this.FieldList && this.FieldList.length > 0) {
            this.FieldList.forEach((field, index) => {
              if (!field.DisplaySequence || isNaN(field.DisplaySequence)) {
                field.DisplaySequence = index + 1;
              }
            });
          }
          if (this.FieldList && this.FieldList.length > 0) {
            this.UniqueInputTypes = Array.from(new Set(this.FieldList.map(field => field.InputType)));
          } else {
            this.UniqueInputTypes = [];
          }
          if (this.FieldList && this.FieldList.length > 0) {
            this.UniqueGroupNames = Array.from(new Set(this.FieldList
              .map(field => field.GroupName)
              .filter(groupName => groupName !== null && groupName !== undefined)));
          } else {
            this.UniqueGroupNames = [];
          }

        }
        else {
          this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Notice, ["No Data Found,Clinical Field List is empty"]);
        }
      }
      else {
        this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ['Failed to get Clinical Field data, check log for details']);
      }
    });
  }


  FilteredFieldList() {
    if (!this.FilterTerm) {
      return this.FieldList;
    }
    const lowerCaseFilter = this.FilterTerm.trim().toLowerCase();
    return this.FieldList.filter(field => {
      return (
        (field.FieldName && field.FieldName.toLowerCase().includes(lowerCaseFilter)) ||
        (field.InputType && field.InputType.toLowerCase().includes(lowerCaseFilter)) ||
        (field.GroupName && field.GroupName.toLowerCase().includes(lowerCaseFilter)) ||
        (field.DisplaySequence && field.DisplaySequence.toString().includes(lowerCaseFilter))
      );
    });
  }
  AddSection() {
    this.ShowDocumentSectionPage = true;
    this.UpdateSection = false;
  }
  FilterSections() {
    if (this.CLNHeadingList && this.CLNHeadingList.length > 0) {
      this.FilteredSections = this.CLNHeadingList.filter(heading =>
        heading.ParentId === this.ManageSectionMapping.ClinicalHeadingId
      );
      this.FilteredSections.sort((a, b) => {
        return a.IsActive === b.IsActive ? 0 : a.IsActive ? -1 : 1;
      });
      if (this.FilteredSections.length > 0 && !this.UpdateSection) {
        setTimeout(() => {
          const firstSection = this.FilteredSections[0];
          this.IsSectionSelected = true;

          this.SectionData(firstSection);
          this.changeDetector.detectChanges();
        }, 0);
      }
      if (this.ClinicalSection.IsActive && this.UpdateSection) {
        this.GetClinicalSectionMapping(this.ClinicalHeadingId);
      }
    } else {
      this.FilteredSections = [];
    }
  }
  SectionData(section: any) {
    this.ClinicalSection = section;
    this.ClinicalHeadingId = this.ClinicalSection.ClinicalHeadingId;
    this.SelectedInputType = "";
    this.SelectedGroupName = "";
    this.FilterTerm = "";


    if (!this.ClinicalSection.IsActive) {
      this.FieldList = [];
      this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ['Please activate this section to get related mappings.']);
      return;
    }
    this.GetClinicalSectionMapping(this.ClinicalHeadingId);
  }
  GetClinicalSectionMapping(SelectedClinicalHeadingId: number): void {
    this._clnSetblService.GetClinicalSectionMapping(SelectedClinicalHeadingId)
      .subscribe({
        next: (res: DanpheHTTPResponse) => {
          if (res.Status === ENUM_DanpheHTTPResponses.OK) {
            if (res.Results && res.Results.length) {
              this.FieldList = res.Results;
              this.FieldList.sort((a, b) => {
                return (b.IsMapped === true ? 1 : 0) - (a.IsMapped === true ? 1 : 0);
              });

              if (this.FieldList && this.FieldList.length > 0) {
                const maxDisplaySequence = Math.max(...this.FieldList.map(field => field.DisplaySequence || 0));
                this.FieldList.forEach((field, index) => {
                  if (!field.DisplaySequence || isNaN(field.DisplaySequence)) {
                    field.DisplaySequence = maxDisplaySequence + index + 1;
                  }
                });
              }
              if (this.FieldList && this.FieldList.length > 0) {
                this.UniqueInputTypes = Array.from(new Set(this.FieldList.map(field => field.InputType)));
              } else {
                this.UniqueInputTypes = [];
              }
              if (this.FieldList && this.FieldList.length > 0) {
                this.UniqueGroupNames = Array.from(new Set(this.FieldList
                  .map(field => field.GroupName)
                  .filter(groupName => groupName !== null && groupName !== undefined && groupName !== '')));
              } else {
                this.UniqueGroupNames = [];
              }

            } else {
              this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Notice, ["There is no Any Associated Clinical Section Mappings"]);
            }
          } else {
            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ['Failed to get clinical Section mappings, check log for details']);
          }
        }
      });
  }

  GetFilteredMedicalComponentListForSectionMapping(): void {
    this.IsSaveClicked = false;
    const selectedInputType = this.SelectedInputType || '';
    const selectedGroupName = this.SelectedGroupName || '';
    const sectionIdToUse = this.ClinicalHeadingId || this.ManageSectionMapping.ClinicalHeadingId;
    this.FieldList = [];

    this._clnSetblService.GetFilteredMedicalComponentListForSectionMapping(
      sectionIdToUse,
      selectedInputType,
      selectedGroupName

    ).subscribe({
      next: (res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          if (res.Results && res.Results.length) {
            this.FieldList = res.Results;
            if (this.FieldList && this.FieldList.length > 0) {
              const maxDisplaySequence = Math.max(...this.FieldList.map(field => field.DisplaySequence || 0));
              this.FieldList.forEach((field, index) => {
                if (!field.DisplaySequence || isNaN(field.DisplaySequence)) {
                  field.DisplaySequence = maxDisplaySequence + index + 1;
                }
                this.FieldList.sort((a, b) => {
                  if (a.IsMapped === b.IsMapped) return 0; // If both are true or false, retain order
                  return a.IsMapped ? -1 : 1; // `true` comes before `false`
                });
              });
            }
          }
          else {
            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Notice, ["There is no Any Associated Clinical Section Mappings"]);
          }
        }
        else {
          this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ['Failed to get filtered clinical Section mappings, check log for details']);
        }
      }
    });
  }

  EditSection(section: any) {
    this.ShowDocumentSectionPage = true;
    this.UpdateSection = true;
    this.SelectedSection = section;

  }
  BackToGrid() {
    this.ShowGrid = true;
    this.ShowSectionMapping = false;
  }
  GetDataFromSectionMapping(eventData: any) {
    this.GetClinicalHeadingData();

    this.ShowDocumentSectionPage = false;

    this.SelectedSection = null;
    if (eventData && eventData.action === "Close") {
      return;
    }

    this.ClinicalSection = eventData;
    if (!this.ClinicalSection) {
      return;
    }
    if (this.ClinicalSection && !this.ClinicalSection.IsActive) {
      this.FieldList = [];
      this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ['Please activate this section to get related mappings.']);
      this.changeDetector.detectChanges();
    }
    else if (this.ClinicalHeadingId) {

      this.FilterSections();

    }

  }
  AddSectionMapping() {
    let displaySequences = this.FieldList.map(field => field.DisplaySequence);
    let hasZeroValue = displaySequences.some(seq => seq <= 0);
    if (hasZeroValue) {
      this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, ["Display Sequence must be greater than zero."]);
      return;
    }
    let sectionIdToUse;
    this.IsSaveClicked = true;
    if (this.ClinicalHeadingId) {
      sectionIdToUse = this.ClinicalHeadingId;
    } else if (this.ManageSectionMapping.ParentId != null) {
      sectionIdToUse = this.ManageSectionMapping.ClinicalHeadingId;
    } if (!sectionIdToUse) {
      this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, [
        "Select a section first to add mapping to the section.",
      ]);
      return;
    }
    if (this.ClinicalSection && !this.ClinicalSection.IsActive && (!this.FieldList || !this.FieldList.length)) {
      this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, [
        "This section is inactive and the field list is empty. Please activate the section to save the mapping."
      ]);
      return;
    }

    if (this.FieldList && this.FieldList.length) {
      this.SelectedSectionFieldsToMap.ClinicalHeadingId = sectionIdToUse;
      const processedFieldList = this.FieldList.map(field => ({
        ...field,
        IsActive: field.IsMapped !== undefined ? field.IsMapped : false,
        ClinicalFieldId: field.FieldId
      }));
      this.SelectedSectionFieldsToMap.FieldList = processedFieldList;
      this._clnSetblService.AddSectionMapping(this.SelectedSectionFieldsToMap).subscribe({
        next: (res: DanpheHTTPResponse) => {
          if (res.Status === ENUM_DanpheHTTPResponses.OK) {
            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Success, [
              "Section mappings Added or updated",
            ]);
            this.FilterTerm = "";
            this.SelectedInputType = "";
            this.SelectedGroupName = "";
            this.GetFilteredMedicalComponentListForSectionMapping();
            this.changeDetector.detectChanges();

          } else {
            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, [
              "failed to and or update section mapping",
            ]);
          }
        }
      });

    }
  }
  ShowAddHeadingPage() {
    this.ShowAddNewPage = false;
    this.changeDetector.detectChanges();
    this.Update = false;
    this.ShowAddNewPage = true;
  }
  GetDataFromAdd($event) {
    this.GetClinicalHeadingData();
    this.ShowAddNewPage = false;
    this.CLNHeadingToEdit = null;


  }
  GetDataFromSection($event) {
    this.GetClinicalHeadingData();
    this.ShowSectionMapping = false;
    this.ManageSectionMapping = null;

  }

  HeadingInfo: DocumentInfo[] = new Array<DocumentInfo>();
  public GetClinicalHeadingData() {
    this._clnSetblService.GetClinicalHeadingData()
      .subscribe(res => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this.CLNHeadingList = res.Results;
          if (Array.isArray(this.CLNHeadingList)) {
            this.HeadingListForGrid = this.CLNHeadingList.filter(item => item.ParentId === null);
            let parentHeadings = this.CLNHeadingList.filter(heading => heading.ParentId === null || heading.ParentId === 0);
            this.ParentHeadingNames = parentHeadings.map(parent => ({
              ParentHeadingName: parent.ClinicalHeadingName,
              ParentId: parent.ClinicalHeadingId
            }));

            this.HeadingInfo = parentHeadings.map(heading =>
            ({
              HeadingId: heading.ClinicalHeadingId,
              IsDefault: heading.IsDefault,
              Sections: this.CLNHeadingList.filter(head => head.ParentId === heading.ClinicalHeadingId).map(section => ({
                ParentId: section.ParentId,
                HeadingId: section.ClinicalHeadingId,
                IsDefault: section.IsDefault,
              }))
            }));

            this.CLNHeadingList.forEach(heading => {
              if (heading.ParentId !== null && heading.ParentId !== 0) {
                let parent = this.CLNHeadingList.find(element => element.ClinicalHeadingId === heading.ParentId);
                if (parent) {
                  if (parent.ClinicalHeadingName) {
                    heading.ParentHeadingName = parent.ClinicalHeadingName;
                  } else {
                    heading.ParentHeadingName = parent.ParentHeadingName;
                  }
                }
              }
              else {
                heading.ParentHeadingName = heading.ClinicalHeadingName;
                heading.ClinicalHeadingName = '';
              }
            });
            this.FilterSections();
            this.ShowGrid = true;
          }

        }
        else {
          this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ['Failed to get Clinical Heading data, check log for details']);
        }

      });
  }
  ClinicalHeadingGridActions($event: GridEmitModel) {
    switch ($event.Action) {
      case "edit": {
        this.CLNHeadingToEdit = null;
        this.ShowAddNewPage = false;
        this.changeDetector.detectChanges();
        this.CLNHeadingToEdit = $event.Data;
        this.ShowAddNewPage = true;
        this.Update = true;
        break;
      } case "manageSectionAndMapping": {
        this.UpdateSection = false;
        this.ManageSectionMapping = null;
        this.ManageSectionMapping = $event.Data;
        this.ShowSectionMapping = true;
        this.SectionParentId = this.ManageSectionMapping.ClinicalHeadingId;
        this.FilterSections();
        this.ClinicalSection = new ClinicalHeading_DTO();
        this.ClinicalHeadingId = null;
        this.ShowSectionDiv = true;
        /* The following block is commented out because we no longer need to handle section mappings in this way.
          If we revisit a scenario where section mappings are required directly from the section grid,
         this code block can be reactivated for handling the setup accordingly.*/

        // if (this.ManageSectionMapping && this.ManageSectionMapping.ParentId) {
        //   this.IsSectionSelected = true;
        //   this.ShowSectionDiv = false;
        //   this.GetClinicalSectionMapping(this.ManageSectionMapping.ClinicalHeadingId);
        // } else {
        //   this.GetClinicalHeadingFieldSetup();
        //   this.IsSectionSelected = false;
        // }
        break;
      }
      case "deactivateClinicalHeadingSetting": {
        this.SelectedItem = $event.Data;
        this.ActivateClinicalHeading(this.SelectedItem);
        break;
      }

      case "activateClinicalHeadingSetting": {
        this.SelectedItem = $event.Data;
        this.ActivateClinicalHeading(this.SelectedItem);
        break;
      }
      default:
        break;
    }

  }
  ActivateClinicalHeading(selectedItem: ClinicalHeading_DTO) {

    const message = selectedItem.IsActive ? "Are you sure you want to deactivate this Clinical Heading? " : "Are you sure you want to activate this Clinical Heading?";
    if (window.confirm(message)) {
      this._clnSetblService
        .ClinicalHeadingActivation(selectedItem)
        .subscribe((res: DanpheHTTPResponse) => {
          if (res.Status === ENUM_DanpheHTTPResponses.OK) {
            this.GetClinicalHeadingData();
            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Success, ['clinical Heading Option Status updated successfully']);
          } else {
            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ["Failed to update the Status of Clinical Heading",]);
          }
        });
    }
  }
  ValidateDisplaySequence(Value: number): { valid: boolean, message?: string; } {
    if (Value <= 0) {
      return { valid: false, message: "Display Sequence must be greater than zero." };
    }
    return { valid: true };
  }
}

export class Heading {
  HeadingId: number = 0;
  IsDefault: boolean = false;
}
export class SectionInfo extends Heading {
  ParentId: number = 0;
}

export class DocumentInfo extends Heading {
  Sections: SectionInfo[] = null;
}


