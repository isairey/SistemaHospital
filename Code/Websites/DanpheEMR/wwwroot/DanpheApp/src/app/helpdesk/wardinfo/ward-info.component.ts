import { ChangeDetectorRef, Component, Input } from '@angular/core';
import GridColumnSettings from '../../shared/danphe-grid/grid-column-settings.constant';
import { MessageboxService } from '../../shared/messagebox/messagebox.service';
import { HelpDeskBLService } from '../shared/helpdesk.bl.service';


@Component({
  templateUrl: "./ward-info.html",
  selector: 'ward-info',
})

export class HlpDskWardInfoComponent {
  @Input() showWardList: boolean = false;
  wardinfo: Array<any> = new Array<any>();
  wardinfoGridColumns: Array<any> = null;
  public selectedWardId: any = null;

  WardPreview: boolean = false;
  wardOccupancyList: Array<any> = new Array<any>();
  SelectedWardInfo = { occupied: 0, Reserved: 0, Total: 0, Vacant: 0, WardId: 0, WardName: "" };
  constructor(public helpDeskBLService: HelpDeskBLService,
    public changeDetector: ChangeDetectorRef,
    public msgBoxServ: MessageboxService) {
    //needs to clear previously selected employee

    this.LoadWardInfo();
    this.LoadWardBedOccupancy();
    this.wardinfoGridColumns = GridColumnSettings.WardInfoSearch;
  }
  LoadWardInfo(): void {
    this.helpDeskBLService.LoadWardInfo()
      .subscribe(res => {
        if (res.Status == "OK") {
          this.wardinfo = res.Results;
          this.showWardList = true;
          // this.wardinfo = this.wardinfo.filter(a=>a.Total>0);
        }
        else {
          this.msgBoxServ.showMessage("failed", [res.ErrorMessage]);

        }
      });
  }
  LoadWardBedOccupancy(): void {
    this.helpDeskBLService.GetBedOccupancyOfWards().subscribe(res => {
      if (res.Status === 'OK') {
        this.wardOccupancyList = res.Results;
      } else {
        this.msgBoxServ.showMessage('failed', [res.ErrorMessage]);
      }
    });
  }
  onWardSelected(wardId: number): void {
    const selectedWard = this.wardOccupancyList.find(w => w.WardId === wardId);
    if (selectedWard) {
      this.SelectedWardInfo = selectedWard;
    }
    this.showWardList = false;
    this.WardPreview = true;
    this.selectedWardId = wardId;
  }

}

