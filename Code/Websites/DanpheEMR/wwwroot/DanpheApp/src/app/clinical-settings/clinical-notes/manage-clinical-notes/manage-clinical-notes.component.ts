import { Component } from '@angular/core';
import { CoreService } from '../../../core/shared/core.service';
import { SecurityService } from '../../../security/shared/security.service';
import { DanpheHTTPResponse } from '../../../shared/common-models';
import { GridEmitModel } from '../../../shared/danphe-grid/grid-emit.model';
import { SettingsGridColumnSettings } from '../../../shared/danphe-grid/settings-grid-column-settings';
import { MessageboxService } from '../../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status } from '../../../shared/shared-enums';
import { ClinicalSettingsBLService } from '../../shared/clinical-settings.bl.service';
import { ClinicalMasterNotes_DTO } from '../../shared/dto/clinical-master-notes.dto';
import { ClinicalNoteInfo } from '../../shared/dto/clinical-note-info.dto';

@Component({
  selector: 'app-manage-clinical-notes',
  templateUrl: './manage-clinical-notes.component.html',
})
export class ManageClinicalNotesComponent {
  public ClinicalMasterNotesGridColumns: typeof SettingsGridColumnSettings.prototype.ClinicalMasterNotes;
  ShowGrid: boolean = false;
  SetCLNHeadingGridColumns: SettingsGridColumnSettings = null;
  CLNMasterNotesList = new Array<ClinicalMasterNotes_DTO>();
  ShowNewClinicalNotesPage: boolean = false;
  UpdateClinicalNotes: boolean = false;
  ClinicalMasterNotes = new ClinicalMasterNotes_DTO();
  ClinicalNotes = new ClinicalMasterNotes_DTO();
  ShowMedicalComponentPage: boolean = false;
  SelectedItem = new ClinicalMasterNotes_DTO();

  ClinicalNotesInfo: Array<ClinicalNoteInfo> = new Array<ClinicalNoteInfo>();

  constructor(private _clnSetblService: ClinicalSettingsBLService,
    private msgBoxServ: MessageboxService,
    private coreService: CoreService,
    public securityService: SecurityService,
  ) {


    this.SetCLNHeadingGridColumns = new SettingsGridColumnSettings(this.coreService.taxLabel, this.securityService);
    this.ClinicalMasterNotesGridColumns = this.SetCLNHeadingGridColumns.ClinicalMasterNotes;
    this.GetClinicalMasterNotes();
  }


  ShowAddClinicalNotesPage() {
    this.ShowNewClinicalNotesPage = false;
    this.UpdateClinicalNotes = false;
    this.ShowNewClinicalNotesPage = true;
  }
  GetDataFromAdd($event) {
    this.GetClinicalMasterNotes();
    this.ShowNewClinicalNotesPage = false;
    this.ClinicalMasterNotes = null;


  }
  HandleCloseEvent(event) {
    if (event.action === 'close') {
      this.ShowMedicalComponentPage = false;
    }
  }

  /**
   *  @summary Retrieves the list of clinical master notes from the server.
   * Updates `CLNMasterNotesList` with the retrieved data or shows a message if no data is found.
   */
  public GetClinicalMasterNotes(): void {
    this._clnSetblService.GetClinicalMasterNotes()
      .subscribe(
        (res: DanpheHTTPResponse) => {
          if (res.Status === ENUM_DanpheHTTPResponses.OK) {
            if (res.Results && res.Results.length > 0) {
              this.CLNMasterNotesList = res.Results;
              this.ClinicalNotesInfo = this.CLNMasterNotesList.map(note => ({
                ClinicalNoteId: note.ClinicalNotesMasterId,
                IsDefault: note.IsDefault
              }));
            } else {
              this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Notice, ['No Data Found!']);
            }

          }
          else {
            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ['Failed to get Clinical Notes, check log for details']);
          }

        });
  }


  /**
   *  @summary Handles grid actions such as edit, activate/deactivate, and manage medical components.
   *
   * @param $event The event object containing the action and data.
   */
  ClinicalNotesGridActions($event: GridEmitModel): void {
    switch ($event.Action) {
      case "edit": {
        this.ClinicalMasterNotes = null;
        this.ShowNewClinicalNotesPage = false;
        this.ClinicalMasterNotes = $event.Data;
        this.ShowNewClinicalNotesPage = true;
        this.UpdateClinicalNotes = true;

        break;
      }
      case "deactivateClinicalNotes": {
        this.SelectedItem = $event.Data;
        this.ActivateClinicalNotes(this.SelectedItem);
        break;
      }

      case "activateClinicalNotes": {
        this.SelectedItem = $event.Data;
        this.ActivateClinicalNotes(this.SelectedItem);
        break;
      }
      case "manageMedicalComponents": {
        this.ClinicalNotes = null;
        this.ShowMedicalComponentPage = false;
        this.ClinicalNotes = $event.Data;
        this.ShowMedicalComponentPage = true;

        break;
      }
      default:
        break;
    }

  }
  /**
  * @summary Activates or deactivates a clinical note based on its current status.
  * Prompts the user for confirmation and updates the status via the server.
  *
  * @param selectedItem The clinical note item to activate or deactivate.
  */
  ActivateClinicalNotes(selectedItem: ClinicalMasterNotes_DTO): void {
    const message = selectedItem.IsActive ? "Are you sure you want to deactivate this Clinical Note?" : "Are you sure you want to activate this Clinical Note?";
    if (window.confirm(message)) {
      this._clnSetblService
        .ClinicalNotesActivation(selectedItem)
        .subscribe((res: DanpheHTTPResponse) => {
          if (res.Status === ENUM_DanpheHTTPResponses.OK) {
            this.GetClinicalMasterNotes();
            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Success, ['Clinical Note Status updated successfully']);
          } else {
            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ["failed to Change status of Clinical Note",]);
          }
        });
    }
  }


}
