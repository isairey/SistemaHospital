import { ChangeDetectorRef, Component } from "@angular/core";
import { CoreService } from "../../../core/shared/core.service";
import { SecurityService } from "../../../security/shared/security.service";
import { DanpheHTTPResponse } from "../../../shared/common-models";
import { GridEmitModel } from "../../../shared/danphe-grid/grid-emit.model";
import { SettingsGridColumnSettings } from "../../../shared/danphe-grid/settings-grid-column-settings";
import { MessageboxService } from "../../../shared/messagebox/messagebox.service";
import { ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status } from "../../../shared/shared-enums";
import { ClinicalSettingsBLService } from "../../shared/clinical-settings.bl.service";
import { ChiefComplain_DTO } from "../../shared/dto/chief-complaint.dto";



@Component({
  templateUrl: "./chief-complains.component.html"
})
export class ChiefComplainsComponent {
  public ChiefComplainsGridColumns: typeof SettingsGridColumnSettings.prototype.ChiefComplainList;
  public ShowGrid: boolean = false;
  public SetCLNHeadingGridColumns: SettingsGridColumnSettings = null;

  public ChiefComplainToEdit: ChiefComplain_DTO = new ChiefComplain_DTO();
  public Index: number;
  public UpdateChiefComplain: boolean;
  public Loading: boolean = false;

  public ShowNewChiefComplainsPage: boolean = false;
  public SelectedItem = new ChiefComplain_DTO();


  public CLNChiefComplainsList: Array<ChiefComplain_DTO> = new Array<ChiefComplain_DTO>();
  constructor(public _clnSetblService: ClinicalSettingsBLService,
    public msgBoxServ: MessageboxService,
    public coreService: CoreService,
    public securityService: SecurityService,
    public changeDetector: ChangeDetectorRef
  ) {


    this.SetCLNHeadingGridColumns = new SettingsGridColumnSettings(this.coreService.taxLabel, this.securityService);
    this.ChiefComplainsGridColumns = this.SetCLNHeadingGridColumns.ChiefComplainList;
    this.GetChiefComplains();
  }


  ShowAddChiefComplainPage() {
    this.ShowNewChiefComplainsPage = false;
    this.changeDetector.detectChanges();
    this.UpdateChiefComplain = false;
    this.ShowNewChiefComplainsPage = true;
  }
  GetDataFromAdd($event) {
    this.GetChiefComplains();
    this.ShowNewChiefComplainsPage = false;
    this.ChiefComplainToEdit = null;

  }
  public GetChiefComplains() {


    this._clnSetblService.GetChiefComplains()
      .subscribe(
        (res: DanpheHTTPResponse) => {
          if (res.Status === ENUM_DanpheHTTPResponses.OK) {
            if (res.Results) {
              this.CLNChiefComplainsList = res.Results;
              this.Loading = false;
            } else {
              this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Notice, ['No Data Found!']);
              this.Loading = false;
            }

          }
          else {
            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ['Failed to get Chief complains, check log for details']);
            this.Loading = false;
          }

        });
  }




  ChiefComplainsGridActions($event: GridEmitModel) {
    switch ($event.Action) {
      case "edit": {
        this.ChiefComplainToEdit = null;
        this.ShowNewChiefComplainsPage = false;
        this.Index = this.CLNChiefComplainsList.findIndex(p => p.ChiefComplainId === $event.Data.ChiefComplainId);
        this.changeDetector.detectChanges();
        this.ChiefComplainToEdit = $event.Data;
        this.ShowNewChiefComplainsPage = true;

        break;
      }
      case "deactivateChiefComplainsSetting": {
        this.SelectedItem = $event.Data;
        this.ActivateChiefComplains(this.SelectedItem);
        break;
      }

      case "activateChiefComplainsSetting": {
        this.SelectedItem = $event.Data;
        this.ActivateChiefComplains(this.SelectedItem);
        break;
      }
      default:
        break;
    }

  }


  ActivateChiefComplains(selectedItem: ChiefComplain_DTO) {
    const message = selectedItem.IsActive ? "Are you sure you want to deactivate this chief complain?" : "Are you sure you want to activate this chief complain?";
    if (window.confirm(message)) {
      this._clnSetblService
        .ChiefComplainsActivation(selectedItem)
        .subscribe((res: DanpheHTTPResponse) => {
          if (res.Status === ENUM_DanpheHTTPResponses.OK) {
            this.GetChiefComplains();
            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Success, ['chief complain Status updated successfully']);
          } else {
            this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ["failed to Change status",]);
          }
        });
    }
  }
}

