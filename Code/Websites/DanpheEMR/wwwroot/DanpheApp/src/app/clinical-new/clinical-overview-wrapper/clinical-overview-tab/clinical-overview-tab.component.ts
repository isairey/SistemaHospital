import { AfterViewInit, Component, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
import { MessageboxService } from '../../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status, ENUM_VisitType } from '../../../shared/shared-enums';
import { TabGroupComponent } from '../../dynamic-tabs/tabs/tab-group.component';
import { TabComponent } from '../../dynamic-tabs/tabs/tab.component';
import { ClinicalNoteBLService } from '../../shared/clinical.bl.service';
import { ParentHeading_DTO } from '../../shared/dto/parent-heading.dto';
import { PatientDetails_DTO } from '../../shared/dto/patient-cln-detail.dto';
import { ChildHeadingComponent } from './child-heading/child-heading.component';
import { FieldFormComponent } from './field-form/field-form.component';
import { ClinicalPatientService } from '../../shared/clinical-patient.service';

@Component({
  selector: 'app-patient-tab',
  templateUrl: './clinical-overview-tab.component.html',
  styleUrls: ['./clinical-overview-tab.component.css']
})
export class ClinicalOverviewTabComponent implements OnInit, AfterViewInit {
  DynamicTabs: TabComponent[] = [];

  @ViewChild(TabGroupComponent) tabsComponent;

  IsVisitTypeCheck: boolean = false;
  // DataContext: PatientDetails_DTO;
  SelectedPatient: PatientDetails_DTO = new PatientDetails_DTO();
  HeadingSubHeadingFieldList: ParentHeading_DTO[];

  //keeps track of overridden and overriding tabs
  ActiveParentTabs: { context: ParentHeading_DTO, index: number }[] = [];

  IsOpen: boolean = true;
  // VisitTypeContext: string;

  constructor(
    public MsgBoxServ: MessageboxService,
    public ClinicalBlservice: ClinicalNoteBLService,
    private _selectedPatientService: ClinicalPatientService,
  ) {


  }
  ngOnInit() {
    if (this._selectedPatientService.SelectedPatient) {
      this.SelectedPatient = this._selectedPatientService.SelectedPatient;
    }
    if (this.SelectedPatient.VisitType === ENUM_VisitType.inpatient) {
      this.IsVisitTypeCheck = true;
    }

  }
  ngAfterViewInit(): void {
    this.GetHeadingSubHeadingFields();
  }

  GetHeadingSubHeadingFields() {
    if (this.SelectedPatient && this.SelectedPatient.VisitType) {
      let visitType = this.SelectedPatient.VisitType
      this.ClinicalBlservice.GetClinicalHeadingSubHeadingField(visitType).subscribe(
        (res) => {
          if (res.Status == ENUM_DanpheHTTPResponses.OK) {
            this.HeadingSubHeadingFieldList = res.Results;
            if (this.HeadingSubHeadingFieldList && this.HeadingSubHeadingFieldList.length > 0) {
              this.HeadingSubHeadingFieldList.forEach((heading) => {
                heading['ActiveTab'] = false;
              });
              this.OpenDefaultTab();
            }

          } else {
            this.MsgBoxServ.showMessage(ENUM_MessageBox_Status.Error, [res.ErrorMessage]);
          }
        },
        (err) => {
          this.MsgBoxServ.showMessage(ENUM_MessageBox_Status.Error, [err.ErrorMessage]);
        }
      );
    } else {
      this.MsgBoxServ.showMessage(ENUM_MessageBox_Status.Error, ['Patient Visit Type is NULL']);
    }

  }

  OpenDefaultTab() {
    let defaultTab = this.HeadingSubHeadingFieldList.find(heading => heading.IsDefault);
    if (defaultTab)
      this.OpenHeadingTab(defaultTab);
    else
      this.OpenHeadingTab(this.HeadingSubHeadingFieldList[0]);
  }


  OpenParentHeadingTab(template: any, data: any, isCloseable: boolean, allowMultiple: boolean) {
    if (template) {

      this.tabsComponent.OpenTab(`${data.DisplayName}`, template,
        { patient: this.SelectedPatient, data: data }, isCloseable, allowMultiple);

    }
  }



  OpenHeadingTab(heading: ParentHeading_DTO) {
    //check if tab is already open
    if (!this.ActiveParentTabs.find(x => x.context === heading)) {
      //if not then
      this.ActiveParentTabs.push({ context: heading, index: (this.DynamicTabs.length) });
      if (heading.ChildHeading.length > 0) {
        this.OpenParentHeadingTab(ChildHeadingComponent, heading, false, true)
      }
      else {
        this.OpenParentHeadingTab(FieldFormComponent, heading, false, true)
      }
      this.SelectParentTab(heading);
    } else {
      let tabIndex = this.ActiveParentTabs.find(x => x.context === heading).index;
      this.SelectTab(this.DynamicTabs[tabIndex]);
      this.SelectParentTab(heading);
    }

  }

  //selects Overriding tabs
  SelectParentTab(heading: any) {
    if (this.HeadingSubHeadingFieldList)
      this.HeadingSubHeadingFieldList.forEach(element => {
        element.ActiveTab = false;
      })
    if (heading) {
      heading.ActiveTab = true;
    }
  }



  //selects Actual Tabs (overridden)
  SelectTab(tab: TabComponent) {
    // deactivate all tabs
    this.DynamicTabs.forEach(tab => (tab.Active = false));

    // activate the tab the user has clicked on.
    tab.Active = true;
  }

  ToggleSideNav() {
    this.IsOpen = !this.IsOpen
  }
}
