import { ChangeDetectorRef, Component } from "@angular/core";
import { CoreService } from "../../../core/shared/core.service";
import { SecurityService } from '../../../security/shared/security.service';
import { DanpheHTTPResponse } from "../../../shared/common-models";
import { GridEmitModel } from '../../../shared/danphe-grid/grid-emit.model';
import { SettingsGridColumnSettings } from '../../../shared/danphe-grid/settings-grid-column-settings';
import { MessageboxService } from '../../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status } from '../../../shared/shared-enums';
import { ClinicalSettingsBLService } from '../../shared/clinical-settings.bl.service';
import { ClinicalHeadingField_DTO } from "../../shared/dto/clinical-heading-field.dto";
@Component({
  templateUrl: "./clinical-heading-fields-component.html"
})
export class ClinicalHeadingFieldsComponent {


  public SelectedItem = new ClinicalHeadingField_DTO();
  public SelectedFieldName = new ClinicalHeadingField_DTO();
  public SelectedFieldOption = new ClinicalHeadingField_DTO();
  public Update: boolean;
  public SelectedFieldId: number;
  //public index: number;
  public ShowHeadingFieldPopUp: boolean = false;
  public ShowFieldQuestionary: boolean = false;
  public ShowFieldQuestionaryOptions: boolean = false;

  public ShowGrid: boolean = false;
  public ClinicalHeadingFields: Array<ClinicalHeadingField_DTO> = new Array<ClinicalHeadingField_DTO>();
  public ClinicalFieldToEdit: ClinicalHeadingField_DTO = new ClinicalHeadingField_DTO();

  public ClinicalHeadingFieldGridColumns: typeof SettingsGridColumnSettings.prototype.ClinicalHeadingFieldGrid;
  public SetCLNHeadingGridColumns: SettingsGridColumnSettings = null;

  constructor(private _clnSetblService: ClinicalSettingsBLService,
    public msgBoxServ: MessageboxService,
    public securityService: SecurityService,
    public coreService: CoreService,
    public changeDetector: ChangeDetectorRef
  ) {

    this.SetCLNHeadingGridColumns = new SettingsGridColumnSettings(this.coreService.taxLabel, this.securityService);
    this.ClinicalHeadingFieldGridColumns = this.SetCLNHeadingGridColumns.ClinicalHeadingFieldGrid;
    this.GetClinicalHeadingFieldSetup();

  }

  AddHeadField() {
    this.ShowHeadingFieldPopUp = false;
    this.changeDetector.detectChanges();
    this.ShowHeadingFieldPopUp = true;
    this.Update = false;
  }

  GetDataFromAdd($event) {
    this.GetClinicalHeadingFieldSetup();
    this.ShowHeadingFieldPopUp = false;
    this.ClinicalFieldToEdit = null;
    this.ShowFieldQuestionary = false;

  }
  GetClinicalHeadingFieldSetup() {
    this._clnSetblService.GetClinicalHeadingFieldSetup().subscribe(res => {
      if (res.Status === ENUM_DanpheHTTPResponses.OK) {
        this.ClinicalHeadingFields = res.Results;
        this.ShowGrid = true;
      }
      else {
        this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ['Failed to get Clinical Field data, check log for details']);
      }
    });
  }


  ClinicalHeadingFieldGridActions($event: GridEmitModel) {
    switch ($event.Action) {
      case "edit": {
        this.ClinicalFieldToEdit = null;
        this.ShowHeadingFieldPopUp = false;
        this.changeDetector.detectChanges();
        this.ClinicalFieldToEdit = $event.Data;
        this.SelectedFieldId = this.ClinicalFieldToEdit.FieldId;
        this.ShowHeadingFieldPopUp = true;
        this.Update = true;


        break;
      }
      case "deactivateClinicalHeadingFieldSetting": {
        this.SelectedItem = $event.Data;
        this.ActivateClinicalField(this.SelectedItem);
        break;
      }

      case "activateClinicalHeadingFieldSetting": {
        this.SelectedItem = $event.Data;
        this.ActivateClinicalField(this.SelectedItem);
        break;
      }
      case "manageQuestions": {
        this.SelectedFieldName = $event.Data;

        this.ShowFieldQuestionary = false;
        this.changeDetector.detectChanges();
        this.ShowFieldQuestionary = true;

        break;
      }
      case "manageOptions": {
        this.SelectedFieldOption = $event.Data;
        this.ShowFieldQuestionaryOptions = true;
        this.changeDetector.detectChanges();

        break;
      }
      default:
        break;
    }

  }
  ActivateClinicalField(selectedItem: ClinicalHeadingField_DTO) {

    const message = selectedItem.IsActive ? "Are you sure you want to deactivate this Clinical Heading Field?" : "Are you sure you want to activate this Clinical Heading Field?";
    if (window.confirm(message)) {
      this._clnSetblService
        .ClinicalHeadingFieldActivation(selectedItem)
        .subscribe((res: DanpheHTTPResponse) => {
          if (res.Status === ENUM_DanpheHTTPResponses.OK) {
            this.GetClinicalHeadingFieldSetup();
            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Success, ['clinical field Status updated successfully']);
          } else {
            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ["failed to Change status",]);
          }
        });
    }
  }



  closeQuestionaryPopup() {
    this.ShowFieldQuestionary = false;
  }
  closeOptionPopup() {
    this.ShowFieldQuestionaryOptions = false;
  }

}
