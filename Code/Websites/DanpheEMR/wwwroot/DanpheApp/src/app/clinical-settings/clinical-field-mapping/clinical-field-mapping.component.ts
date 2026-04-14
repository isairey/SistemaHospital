import { ChangeDetectorRef, Component } from '@angular/core';
import { SettingsService } from '../../settings-new/shared/settings-service';
import { GridEmitModel } from '../../shared/danphe-grid/grid-emit.model';
import { MessageboxService } from '../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status } from '../../shared/shared-enums';
import { ClinicalSettingsBLService } from '../shared/clinical-settings.bl.service';
import { ClinicalUserFieldList_DTO } from '../shared/dto/field-list-view.dto';
import { ClinicalUserFieldMappingsDTO } from '../shared/dto/user-field-mapping_dto';

@Component({
  selector: 'app-clinical-field-mapping',
  templateUrl: './clinical-field-mapping.component.html'
})
export class ClinicalFieldMappingComponent {

  ClinicalUserFieldMappingGridCols: typeof SettingsService.prototype.settingsGridCols.ClinicalUserFieldMappingGridCols
  Index: number;
  ShowAddUpdateMappingPage: boolean = false;
  Update: boolean = false;
  ShowUserFieldMappingGrid: boolean = false;
  ClnUserFieldMappingToEdit: ClinicalUserFieldMappingsDTO = new ClinicalUserFieldMappingsDTO();
  ClnUserMappingList: Array<ClinicalUserFieldMappingsDTO> = new Array<ClinicalUserFieldMappingsDTO>();
  constructor(
    private _settingsService: SettingsService,
    private _clnSettingsBLService: ClinicalSettingsBLService,
    private _msgBoxService: MessageboxService,
    private _changeDetector: ChangeDetectorRef

  ) {
    this.ClinicalUserFieldMappingGridCols = this._settingsService.settingsGridCols.ClinicalUserFieldMappingGridCols;
    this.GetClnUserMappingList();
  }
  GetClnUserMappingList() {
    this._clnSettingsBLService.GetClinicalFieldMappings()
      .subscribe(res => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this.ClnUserMappingList = res.Results;
          this.ShowUserFieldMappingGrid = true;
        }
        else {
          this._msgBoxService.showMessage(ENUM_MessageBox_Status.Failed, ['Failed to get Clinical Document data, check log for details']);
        }

      });

  }
  ClinicalHeadingGridActions($event: GridEmitModel) {
    switch ($event.Action) {
      case "edit": {
        this.ClnUserFieldMappingToEdit = new ClinicalUserFieldMappingsDTO();
        this.ShowAddUpdateMappingPage = false;
        this._changeDetector.detectChanges();
        this.ClnUserFieldMappingToEdit = $event.Data;
        this.ClnUserFieldMappingToEdit.FieldList = new Array<ClinicalUserFieldList_DTO>();
        this.ShowAddUpdateMappingPage = true;
        this.Update = true
        break;
      }
      // case "deactivateClinicalFieldMappings": {
      //   $event.Data.IsActive = false;
      //   this.ActivateClinicalFieldMappings($event.Data.ClinicalUserFieldId);
      //   break;
      // }

      // case "activateClinicalFieldMappings": {
      //   $event.Data.IsActive = true;
      //   this.ActivateClinicalFieldMappings($event.Data.ClinicalHeadingId);
      //   break;
      // }
      default:
        break;
    }

  }
  ActivateClinicalFieldMappings(ClinicalUserFieldId: number) {

  }
  getDataFromAdd($event) {
    this.GetClnUserMappingList();
    this.Update = false;
    this.ClnUserFieldMappingToEdit = new ClinicalUserFieldMappingsDTO();
  }
  GetDataFromClose() {
    this.ShowAddUpdateMappingPage = false;
    this.Update = false;
  }
  AddNewUserFieldMAppings() {
    this.ShowAddUpdateMappingPage = false;
    this._changeDetector.detectChanges();
    this.ClnUserFieldMappingToEdit = new ClinicalUserFieldMappingsDTO();
    this.ShowAddUpdateMappingPage = true;
  }
}
