import { Component, ElementRef, HostListener, Input, OnInit, Renderer2, ViewChild } from '@angular/core';
import * as moment from 'moment';
import { CoreService } from '../../core/shared/core.service';
import { MessageboxService } from '../../shared/messagebox/messagebox.service';
import { HelpDeskBLService } from '../shared/helpdesk.bl.service';

@Component({
  selector: 'ward-detailed-info',
  templateUrl: './ward-detailed-info.component.html',
  styleUrls: ['./ward-detailed-info.component.css']
})
export class HlpDskWardDetailedInfoComponent implements OnInit {
  @Input() selectedWardId: number;
  @Input() WardPreview: boolean;
  @Input() showWardList: boolean;
  @Input() SelectedWard: object;
  wardInfo: any;
  CurrentNepaliDate: string = '';
  CurrentEnglishDate: string = '';
  BedListByWard: Array<any> = [];

  @ViewChild('infiniteScrollTbody') infiniteScrollTbody!: ElementRef;
  isScrolling = false;
  private scrollTimeout: any;
  startIndex: number = 0;
  public Occupiedbeds: number = 0;
  public interval1: any;
  public interval2: any;
  public RefreshInterval: any;
  constructor(
    public helpDeskBLService: HelpDeskBLService,
    private renderer: Renderer2,
    public msgBoxServ: MessageboxService,
    public coreservice: CoreService
  ) {
    this.CurrentNepaliDate = moment().format('dddd MMMM D, YYYY');
    this.CurrentEnglishDate = moment().format('dddd MMMM D, YYYY');
    this.LoadBedsAndTheirPatients();
    let param = this.coreservice.Parameters.find(a => a.ParameterGroupName === "Helpdesk" && a.ParameterName === "WardInformationRefreshTime");
    if (param) {
      const paramValue = JSON.parse(param.ParameterValue);
      if (paramValue) {
        this.RefreshInterval = paramValue.RefreshTime * 1000 //! Krishna, Refresh Time shall be in Seconds so, Seconds * 1000 = milliseconds
      }
    }

  }


  ngOnDestroy() {
    if (this.interval1) {
      clearInterval(this.interval1);
    }
    if (this.interval2) {
      clearInterval(this.interval2);
    }
  }

  ngOnInit() {

    this.interval1 = setInterval(() => { // Load patient/ward  information every 1 minute
      this.LoadBedsAndTheirPatients();
      this.onWardSelected(this.selectedWardId);
    }, 60000); // 60000 milliseconds = 1 minute

    this.autoScroll();
    this.onWardSelected(this.selectedWardId);

  }

  onWardSelected(wardId: number): void {
    this.selectedWardId = wardId;
    this.wardInfo = this.SelectedWard;
    this.filterBedByWards();
  }
  LoadBedsAndTheirPatients(): void {
    this.CurrentNepaliDate = moment().format('dddd MMMM D, YYYY');
    this.CurrentEnglishDate = moment().format('dddd MMMM D, YYYY');
    this.helpDeskBLService.GetAllBedsWithPatInfo().subscribe(res => {
      if (res.Status === 'OK') {
        this.BedListByWard = res.Results.filter(b => b.IsOccupied === true);
        this.filterBedByWards();
      } else {
        this.msgBoxServ.showMessage('failed', [res.ErrorMessage]);
      }
    });
  }

  filterBedByWards() {
    this.BedListByWard = this.BedListByWard.filter(bed => bed.WardId === this.selectedWardId);
    this.Occupiedbeds = this.BedListByWard.length;
    this.BedListByWard.forEach((patient, index) => {
      patient.serialNumber = index + 1;
    });
  }

  ExitWardDetailView() {
    this.showWardList = true;
    this.WardPreview = false;
  }

  @HostListener('scroll', ['$event'])
  onScroll(event: Event) {
    // Set the scrolling flag to true when scrolling starts
    this.isScrolling = true;

    // Clear the flag after a short delay (adjust as needed)
    clearTimeout(this.scrollTimeout);
    this.scrollTimeout = setTimeout(() => {
      this.isScrolling = false;
    }, 100);
  }

  autoScroll() {
    this.interval2 = setInterval(() => {
      console.log('Scrolling ...');
      if (!this.isScrolling && this.infiniteScrollTbody) {
        const element = this.infiniteScrollTbody.nativeElement;
        const contentHeight = element.scrollHeight;
        const wrapper = element.parentElement;
        const wrapperHeight = wrapper.offsetHeight;

        if (wrapperHeight > contentHeight) {
          this.renderer.setStyle(element, 'overflowY', 'auto');

          const rowHeight = element.children[0].offsetHeight || 0;
          const rowsToScroll = 1;
          const cloneRows = this.BedListByWard.slice(0, rowsToScroll);
          cloneRows.forEach((cloneRow: any) => {
            this.BedListByWard.push(Object.assign({}, cloneRow));
          });
          this.BedListByWard.splice(0, rowsToScroll);
          this.renderer.setProperty(element, 'scrollTop', element.scrollTop + rowHeight * rowsToScroll);
        } else {
          this.renderer.setStyle(element, 'overflowY', 'hidden');
        }
      }
    }, this.RefreshInterval);
  }

}
